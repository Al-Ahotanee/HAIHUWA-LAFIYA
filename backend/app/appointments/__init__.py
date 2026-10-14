"""Appointment models: Appointment, AppointmentFollowup."""

from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import (
    DateTime,
    Date,
    ForeignKey,
    Index,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.common.utils import generate_uuid, utcnow
from app.database import Base


class Appointment(Base):
    """Scheduled visit appointment linked to a pregnancy."""

    __tablename__ = "appointments"
    __table_args__ = (
        Index("ix_appointments_pregnancy_id", "pregnancy_id"),
        Index("ix_appointments_status", "status"),
        Index("ix_appointments_scheduled_date", "scheduled_date"),
        Index("ix_appointments_facility_id", "facility_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=generate_uuid
    )
    pregnancy_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("pregnancies.id", ondelete="RESTRICT"), nullable=False
    )
    anc_visit_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("anc_schedule_visits.id", ondelete="SET NULL")
    )
    facility_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("health_facilities.id", ondelete="RESTRICT")
    )

    # Scheduling
    visit_type: Mapped[str] = mapped_column(
        String(30), nullable=False, comment="anc | pnc_maternal | pnc_newborn | follow_up"
    )
    scheduled_date: Mapped[date] = mapped_column(Date, nullable=False)
    actual_date: Mapped[date | None] = mapped_column(Date)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="scheduled",
        comment="scheduled | attended | missed | cancelled | rescheduled"
    )

    # Attendance verification
    attended_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT")
    )
    notes: Mapped[str | None] = mapped_column(Text)

    # Scheduling metadata
    created_by_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )

    # Relationships
    pregnancy: Mapped["Pregnancy"] = relationship(back_populates="appointments")  # noqa: F821
    followups: Mapped[list[AppointmentFollowup]] = relationship(
        back_populates="appointment", cascade="all, delete-orphan"
    )
    assessment: Mapped["ClinicalAssessment | None"] = relationship(  # noqa: F821
        back_populates="appointment", uselist=False
    )


class AppointmentFollowup(Base):
    """Follow-up action for a missed appointment."""

    __tablename__ = "appointment_followups"
    __table_args__ = (
        Index("ix_followups_appointment_id", "appointment_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=generate_uuid
    )
    appointment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("appointments.id", ondelete="CASCADE"), nullable=False
    )
    followup_type: Mapped[str] = mapped_column(
        String(30), nullable=False, comment="phone_call | home_visit | sms"
    )
    followup_date: Mapped[date] = mapped_column(Date, nullable=False)
    outcome: Mapped[str | None] = mapped_column(
        String(30), comment="reached | not_reached | rescheduled | refused"
    )
    notes: Mapped[str | None] = mapped_column(Text)
    performed_by_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )

    appointment: Mapped[Appointment] = relationship(back_populates="followups")
