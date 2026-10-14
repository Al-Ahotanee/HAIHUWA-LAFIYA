"""Postnatal care models: MaternalPNCVisit, NewbornPNCVisit."""

from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.common.utils import generate_uuid, utcnow
from app.database import Base


class MaternalPNCVisit(Base):
    """Maternal Postnatal Care visit (24h, 48-72h, 7-14 days, 6 weeks)."""

    __tablename__ = "maternal_pnc_visits"
    __table_args__ = (
        Index("ix_mat_pnc_pregnancy_id", "pregnancy_id"),
        Index("ix_mat_pnc_date", "visit_date"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=generate_uuid
    )
    pregnancy_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("pregnancies.id", ondelete="RESTRICT"), nullable=False
    )
    facility_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("health_facilities.id", ondelete="RESTRICT")
    )
    visit_number: Mapped[int] = mapped_column(Integer, nullable=False, comment="1=24h, 2=48-72h, 3=7-14d, 4=6wk")
    visit_date: Mapped[date] = mapped_column(Date, nullable=False)

    # Maternal Observations
    systolic_bp: Mapped[int | None] = mapped_column(Integer)
    diastolic_bp: Mapped[int | None] = mapped_column(Integer)
    temperature_c: Mapped[float | None] = mapped_column(Numeric(4, 1))
    lochia_normal: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    lochia_concerns: Mapped[str | None] = mapped_column(Text)
    perineum_healing_normal: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    breast_concerns: Mapped[str | None] = mapped_column(Text)
    family_planning_counseled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    family_planning_method_chosen: Mapped[str | None] = mapped_column(String(100))
    maternal_mental_health_screened: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    depression_suspected: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    danger_signs_detected: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    danger_signs_notes: Mapped[str | None] = mapped_column(Text)
    clinical_notes: Mapped[str | None] = mapped_column(Text)

    provider_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )


class NewbornPNCVisit(Base):
    """Newborn Postnatal Care visit."""

    __tablename__ = "newborn_pnc_visits"
    __table_args__ = (
        Index("ix_nb_pnc_newborn_id", "newborn_id"),
        Index("ix_nb_pnc_date", "visit_date"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=generate_uuid
    )
    newborn_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("newborns.id", ondelete="RESTRICT"), nullable=False
    )
    facility_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("health_facilities.id", ondelete="RESTRICT")
    )
    visit_number: Mapped[int] = mapped_column(Integer, nullable=False)
    visit_date: Mapped[date] = mapped_column(Date, nullable=False)

    # Newborn observations
    current_weight_grams: Mapped[int] = mapped_column(Integer, nullable=False)
    temperature_c: Mapped[float | None] = mapped_column(Numeric(4, 1))
    exclusive_breastfeeding: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    feeding_difficulty: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    umbilical_cord_status: Mapped[str] = mapped_column(
        String(50), default="clean_and_dry", nullable=False,
        comment="clean_and_dry | reddened | discharge | bleeding"
    )
    jaundice_observed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    danger_signs_detected: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    danger_signs_notes: Mapped[str | None] = mapped_column(Text)

    immunization_status_checked: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    clinical_notes: Mapped[str | None] = mapped_column(Text)

    provider_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )

    newborn: Mapped["Newborn"] = relationship(back_populates="pnc_visits")  # noqa: F821
