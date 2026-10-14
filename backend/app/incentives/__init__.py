"""Incentive and payment models (manual workflow default per user requirement)."""

from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.common.utils import generate_uuid, utcnow
from app.database import Base


class IncentiveProgramme(Base):
    """Configurable incentive programme."""

    __tablename__ = "incentive_programmes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=generate_uuid
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    code: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text)
    incentive_type: Mapped[str] = mapped_column(
        String(30), nullable=False, default="cash",
        comment="cash | voucher | supply_kit"
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )

    rules: Mapped[list[IncentiveRule]] = relationship(back_populates="programme", cascade="all, delete-orphan")


class IncentiveRule(Base):
    """Eligibility rule within an incentive programme."""

    __tablename__ = "incentive_rules"
    __table_args__ = (
        Index("ix_inc_rules_programme_id", "programme_id"),
        Index("ix_inc_rules_trigger", "trigger_event"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=generate_uuid
    )
    programme_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("incentive_programmes.id", ondelete="CASCADE"), nullable=False
    )
    trigger_event: Mapped[str] = mapped_column(
        String(50), nullable=False,
        comment="anc_milestone_4 | anc_milestone_8 | facility_delivery | pnc_completion"
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    programme: Mapped[IncentiveProgramme] = relationship(back_populates="rules")
    claims: Mapped[list[IncentiveClaim]] = relationship(back_populates="rule")


class IncentiveClaim(Base):
    """Claim for incentive payout with duplicate-claim protection."""

    __tablename__ = "incentive_claims"
    __table_args__ = (
        # Prevent duplicate claim for same mother, pregnancy and rule
        UniqueConstraint(
            "pregnancy_id", "rule_id",
            name="uq_claims_pregnancy_rule"
        ),
        Index("ix_claims_pregnancy_id", "pregnancy_id"),
        Index("ix_claims_mother_id", "mother_id"),
        Index("ix_claims_status", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=generate_uuid
    )
    claim_reference: Mapped[str] = mapped_column(
        String(50), nullable=False, unique=True, comment="e.g. CLM-20261014-0001"
    )
    rule_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("incentive_rules.id", ondelete="RESTRICT"), nullable=False
    )
    mother_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("mothers.id", ondelete="RESTRICT"), nullable=False
    )
    pregnancy_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("pregnancies.id", ondelete="RESTRICT"), nullable=False
    )

    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending",
        comment="pending | approved | rejected | paid | cancelled"
    )

    # Verification and approvals
    submitted_by_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    approved_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT")
    )
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    rejection_reason: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )

    rule: Mapped[IncentiveRule] = relationship(back_populates="claims")
    payments: Mapped[list[IncentivePayment]] = relationship(back_populates="claim")


class IncentivePayment(Base):
    """Payment record supporting safe manual disbursement."""

    __tablename__ = "incentive_payments"
    __table_args__ = (
        Index("ix_payments_claim_id", "claim_id"),
        Index("ix_payments_idempotency", "idempotency_key"),
        Index("ix_payments_status", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=generate_uuid
    )
    claim_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("incentive_claims.id", ondelete="RESTRICT"), nullable=False
    )
    idempotency_key: Mapped[str] = mapped_column(
        String(100), nullable=False, unique=True
    )
    payment_reference: Mapped[str] = mapped_column(
        String(100), nullable=False, unique=True, comment="Bank or Manual Voucher Reference"
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    payment_method: Mapped[str] = mapped_column(
        String(50), nullable=False, default="manual_cash",
        comment="manual_cash | manual_bank_transfer | mobile_money_manual"
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="completed",
        comment="pending | completed | failed | reversed"
    )
    payment_date: Mapped[date] = mapped_column(Date, nullable=False)
    recorded_by_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    reconciliation_notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )

    claim: Mapped[IncentiveClaim] = relationship(back_populates="payments")
