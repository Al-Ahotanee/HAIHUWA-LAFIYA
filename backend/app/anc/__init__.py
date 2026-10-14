"""Antenatal Care schedule models."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
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


class ANCSchedule(Base):
    """Versioned ANC visit schedule (e.g. WHO 8-contact model)."""

    __tablename__ = "anc_schedules"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=generate_uuid
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    description: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )

    visits: Mapped[list[ANCScheduleVisit]] = relationship(
        back_populates="schedule", order_by="ANCScheduleVisit.visit_number"
    )


class ANCScheduleVisit(Base):
    """Individual visit definition within an ANC schedule."""

    __tablename__ = "anc_schedule_visits"
    __table_args__ = (
        Index("ix_anc_visits_schedule_id", "schedule_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=generate_uuid
    )
    schedule_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("anc_schedules.id", ondelete="CASCADE"), nullable=False
    )
    visit_number: Mapped[int] = mapped_column(Integer, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    gestational_age_min_weeks: Mapped[int] = mapped_column(Integer, nullable=False)
    gestational_age_max_weeks: Mapped[int] = mapped_column(Integer, nullable=False)
    required_assessments: Mapped[str | None] = mapped_column(
        Text, comment="JSON array of required assessment types"
    )
    description: Mapped[str | None] = mapped_column(Text)

    schedule: Mapped[ANCSchedule] = relationship(back_populates="visits")
