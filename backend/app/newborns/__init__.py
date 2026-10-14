"""Newborn models: Newborn, NewbornVaccination."""

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


class Newborn(Base):
    """Individual newborn record supporting multiple births."""

    __tablename__ = "newborns"
    __table_args__ = (
        Index("ix_newborns_delivery_id", "delivery_id"),
        Index("ix_newborns_mother_id", "mother_id"),
        Index("ix_newborns_newborn_id", "newborn_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=generate_uuid
    )
    newborn_id: Mapped[str] = mapped_column(
        String(40), nullable=False, unique=True, comment="e.g. HL-KAN-000001-B1"
    )
    delivery_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("deliveries.id", ondelete="RESTRICT"), nullable=False
    )
    mother_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("mothers.id", ondelete="RESTRICT"), nullable=False
    )

    birth_order: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    first_name: Mapped[str | None] = mapped_column(String(100))
    sex: Mapped[str] = mapped_column(String(20), nullable=False, comment="male | female | ambiguous")
    birth_weight_grams: Mapped[int] = mapped_column(Integer, nullable=False)
    length_cm: Mapped[float | None] = mapped_column(Numeric(4, 1))
    head_circumference_cm: Mapped[float | None] = mapped_column(Numeric(4, 1))

    apgar_1min: Mapped[int | None] = mapped_column(Integer)
    apgar_5min: Mapped[int | None] = mapped_column(Integer)
    apgar_10min: Mapped[int | None] = mapped_column(Integer)

    resuscitation_performed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    immediate_complications: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="alive",
        comment="alive | stillbirth_fresh | stillbirth_macerated | deceased"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )

    # Relationships
    delivery: Mapped["Delivery"] = relationship(back_populates="newborns")  # noqa: F821
    vaccinations: Mapped[list[NewbornVaccination]] = relationship(
        back_populates="newborn", cascade="all, delete-orphan"
    )
    pnc_visits: Mapped[list["NewbornPNCVisit"]] = relationship(  # noqa: F821
        back_populates="newborn", cascade="all, delete-orphan"
    )


class NewbornVaccination(Base):
    """Birth doses and early childhood vaccines given to newborn."""

    __tablename__ = "newborn_vaccinations"
    __table_args__ = (
        Index("ix_newborn_vacc_newborn_id", "newborn_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=generate_uuid
    )
    newborn_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("newborns.id", ondelete="CASCADE"), nullable=False
    )
    vaccine_name: Mapped[str] = mapped_column(
        String(50), nullable=False, comment="bcg | opv_0 | hep_b_0 | vitamin_a"
    )
    administered_date: Mapped[date] = mapped_column(Date, nullable=False)
    batch_number: Mapped[str | None] = mapped_column(String(50))
    administered_by_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )

    newborn: Mapped[Newborn] = relationship(back_populates="vaccinations")
