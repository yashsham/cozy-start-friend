"""Human Review Node: Approvals queue for sales representatives."""

from datetime import datetime, timezone
from typing import Any, Dict
from app.orchestration.state import SalesAgentState


async def review_node(state: SalesAgentState) -> Dict[str, Any]:
    """Hold draft for Human-in-the-Loop review or auto-approve high-fit verified copy."""
    gate_passed = state.get("gate_passed", False)
    fit_score = state.get("fit_score", 0.0)
    requires_approval = state.get("requires_human_approval", False)
    current_status = state.get("approval_status", "pending")
    logs = list(state.get("execution_logs") or [])

    if not gate_passed:
        status = "rejected"
        notes = "Auto-rejected: Failed pre-send safety checks."
    elif requires_approval:
        status = "pending"
        notes = "Held in review queue for human sales rep sign-off."
    elif fit_score >= 50.0:
        status = "approved"
        notes = f"Auto-approved: Qualified fit score ({fit_score}) and passed quality gate."
    else:
        status = "pending"
        notes = "Moderate fit score requires human verification."

    logs.append(f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] HumanReviewNode: Status set to '{status}' ({notes}).")

    return {
        "current_node": "HumanReviewNode",
        "approval_status": status,
        "reviewer_notes": notes,
        "execution_logs": logs,
    }
