"""System settings and metrics schemas."""

from typing import Any, Dict, List
from pydantic import BaseModel


class SystemMetricItem(BaseModel):
    title: str
    value: str
    sub: str
    trend: str
    icon: str


class SystemOverviewResponse(BaseModel):
    active_products: int
    total_prospects: int
    qualified_prospects: int
    drafts_pending: int
    emails_sent: int
    replies_received: int
    system_status: str
