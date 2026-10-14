"""Delivery and outcome models: Delivery, DeliveryComplication."""

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
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.common.utils import generate_uuid, utcnow
from app.database import Base


class Delivery(Base):
    """Delivery record for a pregnancy."""

    __tablename__ = "deliveries"
    __table_args__ = (
        Index("ix_deliveries_pregnancy_id", "pregnancy_id"),
        Index("ix_deliveries_facility_id", "facility_id"),
        Index("ix_deliveries_date", "delivery_date"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=generate_uuid
    )
    pregnancy_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("pregnancies.id", ondelete="RESTRICT"), nullable=False, unique=True
    )
    facility_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("health_facilities.id", ondelete="RESTRICT")
    )

    delivery_date: Mapped[date] = mapped_column(Date, nullable=False)
    delivery_time: Mapped[str | None] = mapped_column(String(10), comment="HH:MM format")
    delivery_mode: Mapped[str] = mapped_column(
        String(30), nullable=False, default="vaginal",
        comment="vaginal | caesarean | assisted"
    )
    place_of_delivery: Mapped[str] = mapped_column(
        String(50), nullable=False, default="facility",
        comment="facility | home | en_route | other"
    )

    maternal_outcome: Mapped[str] = mapped_column(
        String(30), nullable=False, default="alive",
        comment="alive | deceased | critically_ill"
    )
    number_of_babies: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    blood_loss_ml: Mapped[int | None] = mapped_column(Integer)
    postpartum_haemorrhage: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    attended_by_name: Mapped[str | None] = mapped_column(String(255))
    attended_by_cadre: Mapped[str | None] = mapped_column(String(100), comment="doctor | midwife | nurse | cheww | tba")
    recorded_by_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    notes: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )

    # Relationships
    pregnancy: Mapped["Pregnancy"] = relationship(back_populates="delivery")  # noqa: F821
    complications: Mapped[list[DeliveryComplication]] = relationship(
        back_populates="delivery", cascade="all, delete-orphan"
    )
    newborns: Mapped[list["Newborn"]] = relationship(  # noqa: F821
        back_populates="delivery", cascade="all, delete-orphan"
    )


class DeliveryComplication(Base):
    """Complications observed during labour and delivery."""

    __tablename__ = "delivery_complications"
    __table_args__ = (
        Index("ix_deliv_comp_delivery_id", "delivery_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=generate_uuid
    )
    delivery_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("deliveries.id", ondelete="CASCADE"), nullable=False
    )
    complication_name: Mapped[str] = mapped_column(String(100), nullable=False)
    management_provided: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )

    delivery: Mapped[Delivery] = relationship(back_populates="complications")
