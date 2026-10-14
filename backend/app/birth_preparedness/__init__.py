"""Birth preparedness plan models."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.common.utils import generate_uuid, utcnow
from app.database import Base


class BirthPreparednessPlan(Base):
    """Birth preparedness checklist and transport plan per pregnancy."""

    __tablename__ = "birth_preparedness_plans"
    __table_args__ = (
        Index("ix_birth_prep_pregnancy_id", "pregnancy_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=generate_uuid
    )
    pregnancy_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("pregnancies.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    target_facility_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("health_facilities.id", ondelete="SET NULL")
    )

    # Checklist components
    identified_transport: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    transport_contact_phone: Mapped[str | None] = mapped_column(String(20))
    has_birth_companion: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    birth_companion_name: Mapped[str | None] = mapped_column(String(255))
    saved_emergency_funds: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    emergency_funds_amount: Mapped[float | None] = mapped_column(Numeric(10, 2))
    identified_blood_donor: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    blood_donor_contact: Mapped[str | None] = mapped_column(String(100))
    essential_supplies_ready: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    notes: Mapped[str | None] = mapped_column(Text)
    reviewed_by_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )

    pregnancy: Mapped["Pregnancy"] = relationship(back_populates="birth_preparedness")  # noqa: F821
