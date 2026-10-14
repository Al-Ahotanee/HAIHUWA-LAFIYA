"""Pregnancy models: Pregnancy, PregnancyHistory."""

from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.common.utils import generate_uuid, utcnow
from app.database import Base


class Pregnancy(Base):
    """Pregnancy record linked to a mother. One mother can have multiple pregnancies."""

    __tablename__ = "pregnancies"
    __table_args__ = (
        Index("ix_pregnancies_mother_id", "mother_id"),
        Index("ix_pregnancies_status", "status"),
        Index("ix_pregnancies_edd", "estimated_due_date"),
        CheckConstraint("gravida >= 1", name="ck_pregnancies_gravida_positive"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=generate_uuid
    )
    mother_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("mothers.id", ondelete="RESTRICT"), nullable=False
    )

    # Clinical
    lmp_date: Mapped[date | None] = mapped_column(
        Date, comment="Last Menstrual Period date"
    )
    estimated_due_date: Mapped[date | None] = mapped_column(
        Date, comment="Auto-calculated: LMP + 280 days"
    )
    gravida: Mapped[int] = mapped_column(Integer, nullable=False, comment="Total pregnancies including this one")
    parity: Mapped[int] = mapped_column(Integer, default=0, nullable=False, comment="Previous deliveries")
    gestational_age_at_registration: Mapped[int | None] = mapped_column(
        Integer, comment="Weeks at registration"
    )

    # Status
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="active",
        comment="active | delivered | loss | terminated"
    )
    is_high_risk: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    high_risk_reasons: Mapped[str | None] = mapped_column(Text)

    # ANC Schedule
    anc_schedule_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("anc_schedules.id", ondelete="SET NULL")
    )

    # Facility and registration
    facility_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("health_facilities.id", ondelete="RESTRICT")
    )
    registered_by_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )
    outcome_date: Mapped[date | None] = mapped_column(Date)

    # Relationships
    mother: Mapped["Mother"] = relationship(back_populates="pregnancies")  # noqa: F821
    appointments: Mapped[list["Appointment"]] = relationship(  # noqa: F821
        back_populates="pregnancy", order_by="Appointment.scheduled_date"
    )
    delivery: Mapped["Delivery | None"] = relationship(back_populates="pregnancy", uselist=False)  # noqa: F821
    birth_preparedness: Mapped["BirthPreparednessPlan | None"] = relationship(  # noqa: F821
        back_populates="pregnancy", uselist=False
    )


class PregnancyHistory(Base):
    """Previous pregnancy outcomes before programme enrollment."""

    __tablename__ = "pregnancy_history"
    __table_args__ = (
        Index("ix_preg_history_mother_id", "mother_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=generate_uuid
    )
    mother_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("mothers.id", ondelete="RESTRICT"), nullable=False
    )
    year: Mapped[int | None] = mapped_column(Integer)
    outcome: Mapped[str] = mapped_column(String(30), nullable=False)
    delivery_mode: Mapped[str | None] = mapped_column(String(30))
    birth_weight_grams: Mapped[int | None] = mapped_column(Integer)
    complications: Mapped[str | None] = mapped_column(Text)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )
