"""Pregnancy data validation schemas."""

from __future__ import annotations

import uuid
from datetime import date, datetime
from pydantic import BaseModel, Field


class PregnancyCreate(BaseModel):
    mother_id: uuid.UUID
    lmp_date: date | None = None
    estimated_due_date: date | None = None
    gravida: int = Field(..., ge=1, description="Total pregnancies including this one")
    parity: int = Field(default=0, ge=0, description="Previous deliveries")
    gestational_age_at_registration: int | None = Field(None, ge=1, le=45)
    is_high_risk: bool = False
    high_risk_reasons: str | None = None
    facility_id: uuid.UUID | None = None


class PregnancyUpdate(BaseModel):
    is_high_risk: bool | None = None
    high_risk_reasons: str | None = None
    status: str | None = None
    outcome_date: date | None = None


class PregnancyResponse(BaseModel):
    id: uuid.UUID
    mother_id: uuid.UUID
    lmp_date: date | None = None
    estimated_due_date: date | None = None
    gravida: int
    parity: int
    gestational_age_at_registration: int | None = None
    status: str
    is_high_risk: bool
    high_risk_reasons: str | None = None
    facility_id: uuid.UUID | None = None
    created_at: datetime
    updated_at: datetime
    outcome_date: date | None = None

    class Config:
        from_attributes = True
