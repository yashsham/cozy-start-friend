"""Business Profile request and response schemas."""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class BusinessProfileBase(BaseModel):
    company_name: str = Field(..., min_length=1, max_length=120)
    website: Optional[str] = ""
    tagline: Optional[str] = ""
    overview: Optional[str] = ""
    industry: Optional[str] = ""
    business_model: Optional[str] = "B2B"
    target_geography: Optional[str] = "Global"
    value_proposition: Optional[str] = ""
    competitors: List[str] = Field(default_factory=list)


class BusinessProfileCreate(BusinessProfileBase):
    pass


class BusinessProfileUpdate(BaseModel):
    company_name: Optional[str] = None
    website: Optional[str] = None
    tagline: Optional[str] = None
    overview: Optional[str] = None
    industry: Optional[str] = None
    business_model: Optional[str] = None
    target_geography: Optional[str] = None
    value_proposition: Optional[str] = None
    competitors: Optional[List[str]] = None


class BusinessProfileResponse(BusinessProfileBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
