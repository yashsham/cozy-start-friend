"""Writer Node: Drafts hyper-personalized cold outreach via local Ollama."""

from datetime import datetime, timezone
from typing import Any, Dict
from app.llm.ollama_client import ollama_client
from app.llm.prompts import WRITER_SYSTEM_PROMPT
from app.orchestration.state import SalesAgentState


async def writer_node(state: SalesAgentState) -> Dict[str, Any]:
    """Generate cold outreach email customized to the matched product and prospect evidence."""
    prospect = state.get("prospect", {})
    company = state.get("company", {})
    product = state.get("selected_product", {})
    first_name = prospect.get("first_name") or "there"
    company_name = company.get("name") or prospect.get("company", "your team")
    product_name = product.get("name", "our platform")
    value_prop = product.get("value_proposition", "accelerating sales results")
    attempts = (state.get("draft_attempts") or 0) + 1
    logs = list(state.get("execution_logs") or [])

    prompt = (
        f"Draft a personalized cold email to {first_name} at {company_name}. "
        f"Prospect title: {prospect.get('title', 'Leader')}. "
        f"Product we are pitching: {product_name}. "
        f"Product value proposition: {value_prop}. "
        f"Problem statement: {state.get('problem_statement', '')}. "
        f"Remember: lowercase subject, strictly under 100 words, no spam clichés, zero merge-tag placeholders."
    )

    subject = f"quick thought for {company_name}"
    body = ""
    word_count = 0

    try:
        # Check if Ollama is online
        is_online = await ollama_client.check_health()
        if is_online:
            result = await ollama_client.generate_json(
                prompt=prompt,
                system_prompt=WRITER_SYSTEM_PROMPT,
                temperature=0.2,
            )
            subject = result.get("subject", subject).lower()
            body = result.get("body", "")
            word_count = len(body.split())
        else:
            # Deterministic, high-quality local fallback for offline/test environments
            body = (
                f"Hi {first_name},\n\n"
                f"Saw your work leading initiatives at {company_name}.\n\n"
                f"Most leaders in your space tell us that managing outbound pipeline and data qualification "
                f"takes up dozens of hours every week.\n\n"
                f"We built {product_name} to solve this by {value_prop.lower()} locally with zero paid API overhead.\n\n"
                f"Open to a brief 5-minute chat next Tuesday?\n\n"
                f"Best,\nAlex"
            )
            word_count = len(body.split())
    except Exception as e:
        logs.append(f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] WriterNode warning: Local Ollama call fell back to template: {str(e)}")
        body = (
            f"Hi {first_name},\n\n"
            f"Noticed {company_name} is scaling operations this quarter.\n\n"
            f"We designed {product_name} specifically for {value_prop.lower()}.\n\n"
            f"Would it be worth a brief look sometime next week?\n\n"
            f"Best,\nAlex"
        )
        word_count = len(body.split())

    logs.append(f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] WriterNode: Drafted email (Attempt #{attempts}, {word_count} words).")

    return {
        "current_node": "WriterNode",
        "generated_subject": subject,
        "generated_body": body,
        "word_count": word_count,
        "draft_attempts": attempts,
        "execution_logs": logs,
    }
