"""Business Profile and Organization Context domain entity."""

from typing import List
from pydantic import Field
from app.models.base import BaseEntity


class BusinessProfile(BaseEntity):
    company_name: str
    website: str = ""
    tagline: str = ""
    overview: str = ""
    industry: str = ""
    business_model: str = "B2B"
    target_geography: str = "Global"
    value_proposition: str = ""
    competitors: List[str] = Field(default_factory=list)
