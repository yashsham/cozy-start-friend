"""Prospect and Company request/response validation schemas."""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class CompanyResponse(BaseModel):
    id: str
    name: str = ""
    domain: str = ""
    website: str = ""
    description: str = ""
    industry: str = ""
    company_size: str = ""
    location: str = ""
    tech_stack: List[str] = Field(default_factory=list)
    signals: List[str] = Field(default_factory=list)
    phone: str = ""
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProspectBase(BaseModel):
    first_name: str = ""
    last_name: str = ""
    email: str = ""
    title: str = ""
    company: str = ""
    industry: str = ""
    company_size: str = ""
    phone: str = ""
    linkedin_url: str = ""
    status: str = "new"


class ProspectCreate(ProspectBase):
    company_id: Optional[str] = None


class ProspectUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    title: Optional[str] = None
    status: Optional[str] = None
    score: Optional[int] = None
    personalization_notes: Optional[str] = None


class ProspectResponse(ProspectBase):
    id: str
    company_id: Optional[str] = None
    email_status: str
    score: int
    personalization_notes: str
    timezone: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
