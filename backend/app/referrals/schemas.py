"""Referral schemas."""

from __future__ import annotations

import uuid
from datetime import datetime
from pydantic import BaseModel, Field


class ReferralCreate(BaseModel):
    pregnancy_id: uuid.UUID
    referring_facility_id: uuid.UUID
    receiving_facility_id: uuid.UUID
    urgency: str = Field(default="routine", description="routine | urgent | emergency")
    reason: str
    clinical_findings: str | None = None
    treatments_given: str | None = None


class ReferralStatusUpdate(BaseModel):
    new_status: str = Field(..., description="accepted | in_transit | completed | declined | expired")
    notes: str | None = None


class ReferralResponse(BaseModel):
    id: uuid.UUID
    pregnancy_id: uuid.UUID
    referring_facility_id: uuid.UUID
    receiving_facility_id: uuid.UUID
    urgency: str
    reason: str
    clinical_findings: str | None = None
    treatments_given: str | None = None
    status: str
    outcome_summary: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
