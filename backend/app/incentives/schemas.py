"""Incentive and manual payment validation schemas."""

from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, Field


class IncentiveClaimCreate(BaseModel):
    rule_id: uuid.UUID
    mother_id: uuid.UUID
    pregnancy_id: uuid.UUID
    amount: Decimal = Field(..., gt=0)


class IncentiveClaimApprove(BaseModel):
    notes: str | None = None


class IncentiveClaimReject(BaseModel):
    rejection_reason: str = Field(..., min_length=5)


class IncentivePaymentRecord(BaseModel):
    claim_id: uuid.UUID
    idempotency_key: str = Field(..., min_length=8)
    payment_reference: str = Field(..., min_length=4)
    amount: Decimal = Field(..., gt=0)
    payment_method: str = Field(default="manual_cash", description="manual_cash | manual_bank_transfer | mobile_money_manual")
    payment_date: date = Field(default_factory=date.today)
    reconciliation_notes: str | None = None


class IncentiveClaimResponse(BaseModel):
    id: uuid.UUID
    claim_reference: str
    rule_id: uuid.UUID
    mother_id: uuid.UUID
    pregnancy_id: uuid.UUID
    amount: Decimal
    status: str
    approved_at: datetime | None = None
    rejection_reason: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class IncentivePaymentResponse(BaseModel):
    id: uuid.UUID
    claim_id: uuid.UUID
    payment_reference: str
    amount: Decimal
    payment_method: str
    status: str
    payment_date: date
    reconciliation_notes: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True
