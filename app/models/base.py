"""Base model entities with ID and timestamp generation."""

import uuid
from datetime import datetime, timezone
from pydantic import BaseModel, Field


def generate_id() -> str:
    """Generate a 12-char hex UUID for entity IDs."""
    return uuid.uuid4().hex[:12]


def utc_now() -> datetime:
    """Return timezone-naive UTC timestamp."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class BaseEntity(BaseModel):
    id: str = Field(default_factory=generate_id)
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)
