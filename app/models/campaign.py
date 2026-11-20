"""Campaign, Outbox, and Inbound Reply domain entities."""

from datetime import datetime
from typing import List, Optional
from pydantic import Field
from app.models.base import BaseEntity


class Campaign(BaseEntity):
    name: str
    channel: str = "email"
    sequence_json: str = "[]"
    prospect_ids_json: str = "[]"
    status: str = "draft"  # 'draft', 'active', 'paused', 'completed'


class OutboxItem(BaseEntity):
    campaign_id: str = ""
    prospect_id: str = ""
    step: int = 1
    to_email: str
    subject: str
    body: str
    status: str = "pending_review"  # 'pending_review', 'approved', 'sent', 'rejected', 'cancelled'
    approved_by: str = ""  # 'user', 'autopilot', ''
    send_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    error: str = ""
    mailbox_id: str = ""


class Reply(BaseEntity):
    prospect_id: str
    campaign_id: str = ""
    intent: str = ""  # 'positive', 'objection', 'unsubscribe', 'out_of_office'
    stage: str = "replied"
    status: str = "open"
    thread_json: str = "[]"
