"""LangGraph Sales Agent Workflow StateGraph compilation and runner."""

from typing import Any, Dict, Literal
from langgraph.graph import END, StateGraph

from app.orchestration.nodes.gate_node import gate_node
from app.orchestration.nodes.qualify_node import qualify_node
from app.orchestration.nodes.reply_node import reply_node
from app.orchestration.nodes.research_node import research_node
from app.orchestration.nodes.review_node import review_node
from app.orchestration.nodes.scout_node import scout_node
from app.orchestration.nodes.sender_node import sender_node
from app.orchestration.nodes.writer_node import writer_node
from app.orchestration.state import SalesAgentState


def route_after_scout(state: SalesAgentState) -> Literal["reply_handler", "research"]:
    """If an inbound reply is present, branch immediately to reply handling and stop-on-reply guard."""
    if state.get("inbound_reply_text"):
        return "reply_handler"
    return "research"


def route_after_qualify(state: SalesAgentState) -> Literal["writer", "__end__"]:
    """Conditional edge: Only qualified leads proceed to cold copy generation."""
    if state.get("is_qualified", False):
        return "writer"
    return END


def route_after_gate(state: SalesAgentState) -> Literal["review", "writer", "__end__"]:
    """Conditional edge: Regenerate draft if failed (up to 2 retries), otherwise proceed to review."""
    if state.get("gate_passed", False):
        return "review"
    attempts = state.get("draft_attempts", 0)
    if attempts < 2:
        return "writer"
    return "review"  # Flagged for human review after retries fail


def route_after_review(state: SalesAgentState) -> Literal["sender", "__end__"]:
    """Conditional edge: Only approved drafts proceed to outbound dispatch."""
    if state.get("approval_status") == "approved":
        return "sender"
    return END


def route_after_sender(state: SalesAgentState) -> Literal["reply_handler", "__end__"]:
    """Conditional edge: Process inbound reply if present."""
    if state.get("inbound_reply_text"):
        return "reply_handler"
    return END


def build_sales_graph() -> StateGraph:
    """Construct the stateful, multi-agent sales workflow graph."""
    builder = StateGraph(SalesAgentState)

    # Add Nodes
    builder.add_node("scout", scout_node)
    builder.add_node("research", research_node)
    builder.add_node("qualify", qualify_node)
    builder.add_node("writer", writer_node)
    builder.add_node("gate", gate_node)
    builder.add_node("review", review_node)
    builder.add_node("sender", sender_node)
    builder.add_node("reply_handler", reply_node)

    # Add Edges
    builder.set_entry_point("scout")
    builder.add_conditional_edges(
        "scout",
        route_after_scout,
        {
            "reply_handler": "reply_handler",
            "research": "research",
        },
    )
    builder.add_edge("research", "qualify")

    # Conditional Branching
    builder.add_conditional_edges(
        "qualify",
        route_after_qualify,
        {
            "writer": "writer",
            END: END,
        },
    )

    builder.add_edge("writer", "gate")

    builder.add_conditional_edges(
        "gate",
        route_after_gate,
        {
            "review": "review",
            "writer": "writer",
            END: END,
        },
    )

    builder.add_conditional_edges(
        "review",
        route_after_review,
        {
            "sender": "sender",
            END: END,
        },
    )

    builder.add_conditional_edges(
        "sender",
        route_after_sender,
        {
            "reply_handler": "reply_handler",
            END: END,
        },
    )

    builder.add_edge("reply_handler", END)

    return builder


sales_workflow = build_sales_graph().compile()


async def run_sales_agent_workflow(initial_state: Dict[str, Any]) -> SalesAgentState:
    """Execute the compiled LangGraph sales workflow from initial state to completion."""
    result = await sales_workflow.ainvoke(initial_state)
    return result
