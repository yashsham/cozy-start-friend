"""Typed state schema for LangGraph multi-product sales agent."""

from typing import Any, Dict, List, Optional
from typing_extensions import TypedDict


class SalesAgentState(TypedDict, total=False):
    """The central state dictionary passed across all nodes in the LangGraph DAG."""

    # Target Entity
    prospect_id: str
    prospect: Dict[str, Any]
    company: Dict[str, Any]

    # Public Evidence & Observations
    observations: List[Dict[str, Any]]
    buying_signals: List[Dict[str, Any]]

    # Multi-Product Context
    active_products: List[Dict[str, Any]]
    product_scores: Dict[str, Dict[str, Any]]
    selected_product_id: Optional[str]
    selected_product: Optional[Dict[str, Any]]

    # Qualification & Problem Statement
    fit_score: float
    fit_tier: str  # 'very_high', 'high', 'medium', 'low', 'unfit'
    qualifying_factors: List[str]
    disqualifying_factors: List[str]
    problem_statement: str
    is_qualified: bool

    # Outreach Draft
    generated_subject: str
    generated_body: str
    word_count: int
    draft_attempts: int

    # Safety & Quality Gate
    gate_passed: bool
    gate_violations: List[str]

    # Human-in-the-Loop Review
    requires_human_approval: bool
    approval_status: str  # 'pending', 'approved', 'rejected'
    reviewer_notes: str

    # Delivery & Dispatch
    outbox_id: Optional[str]
    is_sent: bool
    sent_timestamp: Optional[str]

    # Inbound Handling & Safety Guards
    inbound_reply_text: Optional[str]
    reply_intent: Optional[str]  # 'positive', 'objection', 'unsubscribe', 'out_of_office'
    stop_campaign: bool  # Deterministic Stop-on-Reply Flag

    # Execution Trace
    execution_logs: List[str]
    current_node: str
    error: Optional[str]
