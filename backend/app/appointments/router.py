"""Appointment and follow-up REST endpoints."""

from __future__ import annotations

import uuid
from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.appointments.schemas import (
    AppointmentCreate,
    AppointmentResponse,
    AppointmentUpdate,
    FollowupCreate,
    MissedAppointmentItem,
)
from app.appointments.service import AppointmentService
from app.auth.dependencies import get_current_user, require_roles
from app.auth.models import User
from app.common.enums import UserRole
from app.database import get_db

router = APIRouter(prefix="/appointments", tags=["Appointments"])


@router.post("", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
async def schedule_appointment(
    data: AppointmentCreate,
    current_user: Annotated[User, Depends(require_roles([
        UserRole.CHW, UserRole.MIDWIFE, UserRole.FACILITY_MANAGER, UserRole.SUPER_ADMIN
    ]))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AppointmentResponse:
    """Schedule a care visit (ANC, PNC, or follow-up)."""
    service = AppointmentService(db)
    appointment = await service.schedule_appointment(data, current_user)
    return AppointmentResponse.model_validate(appointment)


@router.post("/{appointment_id}/attendance", response_model=AppointmentResponse)
async def verify_attendance(
    appointment_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_roles([
        UserRole.MIDWIFE, UserRole.FACILITY_MANAGER, UserRole.SUPER_ADMIN
    ]))],
    db: Annotated[AsyncSession, Depends(get_db)],
    actual_date: date = Query(default_factory=date.today),
    notes: str | None = None,
) -> AppointmentResponse:
    """Record and verify attendance at a clinical facility."""
    service = AppointmentService(db)
    appointment = await service.record_attendance(appointment_id, actual_date, current_user, notes)
    return AppointmentResponse.model_validate(appointment)


@router.get("/missed", response_model=list[MissedAppointmentItem])
async def list_missed_appointments(
    _current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[MissedAppointmentItem]:
    """Return overdue scheduled visits requiring active CHW community follow-up."""
    service = AppointmentService(db)
    return await service.list_missed_appointments()


@router.post("/followups", status_code=status.HTTP_201_CREATED)
async def record_followup(
    data: FollowupCreate,
    current_user: Annotated[User, Depends(require_roles([
        UserRole.CHW, UserRole.MIDWIFE, UserRole.FACILITY_MANAGER, UserRole.SUPER_ADMIN
    ]))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Log an outreach attempt (phone call, home visit, or SMS)."""
    service = AppointmentService(db)
    followup = await service.log_followup(data, current_user)
    return {"id": followup.id, "status": "recorded"}
