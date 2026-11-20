"""Campaign, Drafts, and Reply request/response schemas."""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class OutboxDraftResponse(BaseModel):
    id: str
    campaign_id: str
    prospect_id: str
    step: int
    to_email: str
    subject: str
    body: str
    status: str
    approved_by: str
    send_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    error: str = ""
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DraftReviewRequest(BaseModel):
    action: str = Field(..., pattern="^(approve|reject)$")
    modified_subject: Optional[str] = None
    modified_body: Optional[str] = None


class ReplyResponse(BaseModel):
    id: str
    prospect_id: str
    campaign_id: str
    channel: str
    intent: str
    stage: str
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
