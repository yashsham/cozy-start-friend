"""Unit tests for LangGraph multi-product sales workflow and deterministic guards."""

import pytest
from app.orchestration.graph import run_sales_agent_workflow
from app.safety.gate import check_email_quality


@pytest.mark.asyncio
async def test_full_workflow_qualification_and_drafting():
    """Verify that a qualified prospect traverses the graph to draft and approval."""
    initial_state = {
        "prospect_id": "p_001",
        "prospect": {
            "first_name": "Sarah",
            "last_name": "Connor",
            "title": "VP of Engineering",
            "company": "Cyberdyne Systems",
            "industry": "Artificial Intelligence",
        },
        "company": {
            "name": "Cyberdyne Systems",
            "industry": "Artificial Intelligence",
            "description": "Building neural network processors and autonomous systems.",
            "tech_stack": ["Python", "FastAPI", "PyTorch"],
        },
        "active_products": [
            {
                "id": "prod_1",
                "name": "Harvey AI Agent",
                "value_proposition": "Automating outbound sales prospecting locally",
                "target_industries": ["Artificial Intelligence", "SaaS"],
                "description": "Local-first AI sales platform",
            }
        ],
        "requires_human_approval": False,
        "execution_logs": [],
    }

    result = await run_sales_agent_workflow(initial_state)

    # Assertions
    assert result["is_qualified"] is True
    assert result["fit_score"] > 60.0
    assert result["selected_product_id"] == "prod_1"
    assert result["generated_subject"] is not None
    assert result["generated_body"] is not None
    assert result["word_count"] <= 125
    assert result["gate_passed"] is True
    assert result["approval_status"] == "approved"
    assert result["is_sent"] is True
    assert result["outbox_id"] is not None
    assert len(result["execution_logs"]) >= 5


@pytest.mark.asyncio
async def test_disqualification_branch():
    """Verify that an unfit lead terminates early without copy generation."""
    initial_state = {
        "prospect_id": "p_unfit",
        "prospect": {
            "first_name": "Bob",
            "last_name": "Baker",
            "title": "Pastry Chef",
            "company": "Bob's Bakery",
            "industry": "Food & Beverage",
        },
        "company": {
            "name": "Bob's Bakery",
            "industry": "Food & Beverage",
            "description": "Local bakery selling sourdough breads and croissants.",
        },
        "active_products": [
            {
                "id": "prod_enterprise_saas",
                "name": "Enterprise FinTech Suite",
                "value_proposition": "Regulatory compliance for tier-1 investment banks",
                "target_industries": ["Investment Banking", "Securities Trading"],
                "description": "Compliance automation software.",
            }
        ],
        "execution_logs": [],
    }

    result = await run_sales_agent_workflow(initial_state)

    # Should be marked not qualified and end at QualifyNode
    assert result["is_qualified"] is False
    assert result.get("generated_body") is None
    assert result.get("is_sent") is not True


def test_deterministic_safety_gate_rules():
    """Verify that banned clichés, merge tags, and long copy are caught deterministically."""
    # 1. Merge tag leak
    leaky_body = "Hi {{first_name}}, loved what [Company] is doing."
    passed, violations, _ = check_email_quality("quick thought", leaky_body)
    assert passed is False
    assert any("merge-tag detected" in v for v in violations)

    # 2. Banned spam cliché
    spammy_body = "Hope this email finds you well. We offer disruptive synergy."
    passed, violations, _ = check_email_quality("hello", spammy_body)
    assert passed is False
    assert any("banned spam cliché" in v for v in violations)

    # 3. Exceeds 125 words
    long_body = "word " * 130
    passed, violations, count = check_email_quality("quick note", long_body)
    assert passed is False
    assert count == 130
    assert any("exceeds maximum allowed" in v for v in violations)


@pytest.mark.asyncio
async def test_deterministic_stop_on_reply_guard():
    """Verify that an inbound reply unconditionally triggers the stop-on-reply guard."""
    initial_state = {
        "prospect_id": "p_reply",
        "prospect": {"first_name": "Elena", "company": "Stripe"},
        "company": {"name": "Stripe"},
        "active_products": [{"id": "prod_1", "name": "Harvey", "value_proposition": "Sales AI", "target_industries": []}],
        "requires_human_approval": False,
        "inbound_reply_text": "Thanks for reaching out, but please remove me from your list. Unsubscribe.",
        "execution_logs": [],
    }

    result = await run_sales_agent_workflow(initial_state)

    assert result["stop_campaign"] is True
    assert result["reply_intent"] == "unsubscribe"
    assert any("STOP-ON-REPLY GUARD TRIGGERED" in log for log in result["execution_logs"])
