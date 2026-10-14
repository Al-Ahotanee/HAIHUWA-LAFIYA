"""Mother data validation schemas."""

from __future__ import annotations

import uuid
from datetime import date, datetime
from pydantic import BaseModel, Field


class MotherConsentCreate(BaseModel):
    consent_type: str = Field(default="programme_enrollment")
    granted: bool = True
    granted_date: date = Field(default_factory=date.today)
    witness_name: str | None = None


class MotherCreate(BaseModel):
    first_name: str = Field(..., min_length=2, max_length=100)
    last_name: str = Field(..., min_length=2, max_length=100)
    other_names: str | None = None
    date_of_birth: date | None = None
    age_at_registration: int | None = Field(None, ge=10, le=65)
    phone: str | None = Field(None, max_length=20)
    alternate_phone: str | None = Field(None, max_length=20)
    marital_status: str | None = None
    education_level: str | None = None
    occupation: str | None = None

    lga_id: uuid.UUID
    ward_id: uuid.UUID
    community_id: uuid.UUID | None = None
    address: str | None = None
    facility_id: uuid.UUID | None = None

    consent: MotherConsentCreate | None = None


class MotherUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    other_names: str | None = None
    phone: str | None = None
    alternate_phone: str | None = None
    marital_status: str | None = None
    education_level: str | None = None
    occupation: str | None = None
    ward_id: uuid.UUID | None = None
    community_id: uuid.UUID | None = None
    address: str | None = None
    facility_id: uuid.UUID | None = None


class MotherResponse(BaseModel):
    id: uuid.UUID
    mother_id: str
    first_name: str
    last_name: str
    other_names: str | None = None
    date_of_birth: date | None = None
    age_at_registration: int | None = None
    phone: str | None = None
    alternate_phone: str | None = None
    marital_status: str | None = None
    education_level: str | None = None
    occupation: str | None = None
    lga_id: uuid.UUID
    ward_id: uuid.UUID
    community_id: uuid.UUID | None = None
    address: str | None = None
    facility_id: uuid.UUID | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DeduplicationCheckRequest(BaseModel):
    first_name: str
    last_name: str
    phone: str | None = None
    date_of_birth: date | None = None


class DeduplicationCheckResponse(BaseModel):
    potential_duplicates_found: bool
    count: int
    matches: list[MotherResponse]
