"""Referral models: Referral, ReferralUpdate."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.common.utils import generate_uuid, utcnow
from app.database import Base


class Referral(Base):
    """Referral record initiated from clinical care."""

    __tablename__ = "referrals"
    __table_args__ = (
        Index("ix_referrals_pregnancy_id", "pregnancy_id"),
        Index("ix_referrals_status", "status"),
        Index("ix_referrals_urgency", "urgency"),
        Index("ix_referrals_referring_facility", "referring_facility_id"),
        Index("ix_referrals_receiving_facility", "receiving_facility_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=generate_uuid
    )
    pregnancy_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("pregnancies.id", ondelete="RESTRICT"), nullable=False
    )
    referring_facility_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("health_facilities.id", ondelete="RESTRICT"), nullable=False
    )
    receiving_facility_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("health_facilities.id", ondelete="RESTRICT"), nullable=False
    )

    urgency: Mapped[str] = mapped_column(
        String(20), nullable=False, default="routine",
        comment="routine | urgent | emergency"
    )
    reason: Mapped[str] = mapped_column(String(255), nullable=False)
    clinical_findings: Mapped[str | None] = mapped_column(Text)
    treatments_given: Mapped[str | None] = mapped_column(Text)

    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="initiated",
        comment="initiated | accepted | in_transit | completed | declined | expired"
    )
    outcome_summary: Mapped[str | None] = mapped_column(Text)

    initiated_by_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )

    updates: Mapped[list[ReferralUpdate]] = relationship(
        back_populates="referral", cascade="all, delete-orphan", order_by="ReferralUpdate.created_at"
    )


class ReferralUpdate(Base):
    """Audit and timeline tracking for referral state transitions."""

    __tablename__ = "referral_updates"
    __table_args__ = (
        Index("ix_referral_updates_referral_id", "referral_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=generate_uuid
    )
    referral_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("referrals.id", ondelete="CASCADE"), nullable=False
    )
    previous_status: Mapped[str] = mapped_column(String(20), nullable=False)
    new_status: Mapped[str] = mapped_column(String(20), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)
    updated_by_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )

    referral: Mapped[Referral] = relationship(back_populates="updates")
