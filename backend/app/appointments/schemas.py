"""Appointments data validation schemas."""

from __future__ import annotations

import uuid
from datetime import date, datetime
from pydantic import BaseModel, Field


class AppointmentCreate(BaseModel):
    pregnancy_id: uuid.UUID
    anc_visit_id: uuid.UUID | None = None
    facility_id: uuid.UUID | None = None
    visit_type: str = Field(default="anc", description="anc | pnc_maternal | pnc_newborn | follow_up")
    scheduled_date: date
    notes: str | None = None


class AppointmentUpdate(BaseModel):
    scheduled_date: date | None = None
    actual_date: date | None = None
    status: str | None = None
    notes: str | None = None


class AppointmentResponse(BaseModel):
    id: uuid.UUID
    pregnancy_id: uuid.UUID
    anc_visit_id: uuid.UUID | None = None
    facility_id: uuid.UUID | None = None
    visit_type: str
    scheduled_date: date
    actual_date: date | None = None
    status: str
    notes: str | None = None
    attended_by_id: uuid.UUID | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MissedAppointmentItem(BaseModel):
    appointment_id: uuid.UUID
    pregnancy_id: uuid.UUID
    mother_id: uuid.UUID
    mother_name: str
    mother_phone: str | None
    scheduled_date: date
    days_overdue: int
    facility_name: str | None


class FollowupCreate(BaseModel):
    appointment_id: uuid.UUID
    followup_type: str = Field(..., description="phone_call | home_visit | sms")
    followup_date: date = Field(default_factory=date.today)
    outcome: str = Field(..., description="reached | not_reached | rescheduled | refused")
    notes: str | None = None
