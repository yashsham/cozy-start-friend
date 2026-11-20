"""Agent execution and LangGraph workflow orchestration endpoints."""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.api.deps import get_product_service
from app.orchestration.graph import run_sales_agent_workflow
from app.schemas.common import APIResponse
from app.services.product_service import ProductService

router = APIRouter(prefix="/agents", tags=["Sales Agents"])


class AgentRunRequest(BaseModel):
    prospect_id: Optional[str] = None
    first_name: str = "Jane"
    last_name: str = "Doe"
    title: str = "VP of Sales"
    company_name: str = "Acme SaaS Technologies"
    company_industry: str = "B2B SaaS"
    company_description: str = "Cloud platform for automating revenue workflows."
    auto_approve: bool = False
    inbound_reply_text: Optional[str] = None


class AgentRunResponse(BaseModel):
    status: str
    current_node: str
    is_qualified: bool
    selected_product: Optional[str] = None
    fit_score: float
    fit_tier: str
    generated_subject: Optional[str] = None
    generated_body: Optional[str] = None
    word_count: int = 0
    gate_passed: bool
    approval_status: str
    is_sent: bool
    stop_campaign: bool
    execution_logs: List[str]


@router.get("/pipeline", response_model=APIResponse[Dict[str, Any]])
async def get_agent_pipeline():
    """Retrieve LangGraph nodes and execution pipeline topology."""
    nodes = [
        {"id": "scout", "name": "Lead Intake & Discovery", "type": "intake"},
        {"id": "research", "name": "Public Evidence & DOM Scraper", "type": "intelligence"},
        {"id": "qualify", "name": "Multi-Product ICP Matcher", "type": "scoring"},
        {"id": "writer", "name": "Local Qwen Copywriter", "type": "generation"},
        {"id": "gate", "name": "Deterministic Safety Gate", "type": "verification"},
        {"id": "review", "name": "Human-in-the-Loop Approval", "type": "control"},
        {"id": "sender", "name": "Direct Outbox Dispatcher", "type": "delivery"},
        {"id": "reply_handler", "name": "Inbound Stop-on-Reply Guard", "type": "safety"},
    ]
    return APIResponse(
        message="Agent pipeline topology retrieved",
        data={
            "graph_engine": "LangGraph StateGraph",
            "active_nodes": nodes,
            "deterministic_guards": ["stop_on_reply", "pre_send_gate", "untrusted_sanitizer"],
        },
    )


@router.post("/run", response_model=APIResponse[AgentRunResponse])
async def trigger_agent_run(
    request: AgentRunRequest,
    product_service: ProductService = Depends(get_product_service),
):
    """Execute the compiled LangGraph sales workflow from discovery to dispatch."""
    # Fetch active products from DB to feed the multi-product router
    products = await product_service.list_products(active_only=True)
    if not products:
        # Fallback to default product if database catalog is not yet populated
        products_payload = [
            {
                "id": "prod_harvey_core",
                "name": "Harvey AI Sales Agent",
                "value_proposition": "Automating outbound sales prospecting locally with zero cloud API costs",
                "target_industries": ["B2B SaaS", "FinTech", "Enterprise Software"],
                "description": "Local-first AI sales agent platform.",
            }
        ]
    else:
        products_payload = [p.model_dump() for p in products]

    initial_state = {
        "prospect_id": request.prospect_id or "p_test",
        "prospect": {
            "first_name": request.first_name,
            "last_name": request.last_name,
            "title": request.title,
            "company": request.company_name,
            "industry": request.company_industry,
        },
        "company": {
            "name": request.company_name,
            "industry": request.company_industry,
            "description": request.company_description,
            "tech_stack": ["React", "FastAPI", "PostgreSQL"],
        },
        "active_products": products_payload,
        "requires_human_approval": not request.auto_approve,
        "inbound_reply_text": request.inbound_reply_text,
        "execution_logs": [],
    }

    try:
        final_state = await run_sales_agent_workflow(initial_state)

        selected_prod = final_state.get("selected_product")
        selected_prod_name = selected_prod.get("name") if selected_prod else None

        response_data = AgentRunResponse(
            status="completed",
            current_node=final_state.get("current_node", "END"),
            is_qualified=final_state.get("is_qualified", False),
            selected_product=selected_prod_name,
            fit_score=final_state.get("fit_score", 0.0),
            fit_tier=final_state.get("fit_tier", "medium"),
            generated_subject=final_state.get("generated_subject"),
            generated_body=final_state.get("generated_body"),
            word_count=final_state.get("word_count", 0),
            gate_passed=final_state.get("gate_passed", False),
            approval_status=final_state.get("approval_status", "pending"),
            is_sent=final_state.get("is_sent", False),
            stop_campaign=final_state.get("stop_campaign", False),
            execution_logs=final_state.get("execution_logs", []),
        )

        return APIResponse(
            message="Workflow execution completed successfully",
            data=response_data,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Agent Execution Error", "message": str(e)},
        )
