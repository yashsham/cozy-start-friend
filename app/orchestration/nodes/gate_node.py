"""Gate Check Node: Deterministic pre-send quality verification."""

from datetime import datetime, timezone
from typing import Any, Dict
from app.orchestration.state import SalesAgentState
from app.safety.gate import check_email_quality


async def gate_node(state: SalesAgentState) -> Dict[str, Any]:
    """Execute deterministic pre-send verification rules."""
    subject = state.get("generated_subject", "")
    body = state.get("generated_body", "")
    logs = list(state.get("execution_logs") or [])

    passed, violations, word_count = check_email_quality(subject=subject, body=body, max_words=125)

    if passed:
        logs.append(
            f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] GateCheckNode: Passed all quality gates ({word_count} words, 0 merge tag leaks, 0 spam clichés)."
        )
    else:
        logs.append(
            f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] GateCheckNode: FAILED with {len(violations)} violations: {'; '.join(violations)}"
        )

    return {
        "current_node": "GateCheckNode",
        "gate_passed": passed,
        "gate_violations": violations,
        "word_count": word_count,
        "execution_logs": logs,
    }
