"""Incentive and manual payment business service."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.common.enums import ClaimStatus, PaymentStatus
from app.exceptions import BusinessRuleError, DuplicateError, NotFoundError
from app.incentives.schemas import IncentiveClaimCreate, IncentivePaymentRecord
from app.models import IncentiveClaim, IncentivePayment, IncentiveRule, Mother, Pregnancy


class IncentiveService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def submit_claim(self, data: IncentiveClaimCreate, current_user: User) -> IncentiveClaim:
        # Check rule
        r_res = await self.db.execute(select(IncentiveRule).where(IncentiveRule.id == data.rule_id))
        if not r_res.scalar_one_or_none():
            raise NotFoundError("IncentiveRule", str(data.rule_id))

        # Check duplicate claim
        existing = await self.db.execute(
            select(IncentiveClaim).where(
                IncentiveClaim.pregnancy_id == data.pregnancy_id,
                IncentiveClaim.rule_id == data.rule_id,
            )
        )
        if existing.scalar_one_or_none():
            raise DuplicateError("A claim for this specific milestone has already been submitted for this pregnancy.")

        # Generate claim reference
        date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
        count_res = await self.db.execute(select(func.count(IncentiveClaim.id)))
        seq = count_res.scalar_one() + 1
        claim_ref = f"CLM-{date_str}-{seq:04d}"

        claim = IncentiveClaim(
            claim_reference=claim_ref,
            rule_id=data.rule_id,
            mother_id=data.mother_id,
            pregnancy_id=data.pregnancy_id,
            amount=data.amount,
            status=ClaimStatus.PENDING.value,
            submitted_by_id=current_user.id,
        )
        self.db.add(claim)
        await self.db.commit()
        await self.db.refresh(claim)
        return claim

    async def approve_claim(self, claim_id: uuid.UUID, current_user: User) -> IncentiveClaim:
        res = await self.db.execute(select(IncentiveClaim).where(IncentiveClaim.id == claim_id))
        claim = res.scalar_one_or_none()
        if not claim:
            raise NotFoundError("IncentiveClaim", str(claim_id))

        if claim.status != ClaimStatus.PENDING.value:
            raise BusinessRuleError(f"Claim is in '{claim.status}' state and cannot be approved.")

        claim.status = ClaimStatus.APPROVED.value
        claim.approved_by_id = current_user.id
        claim.approved_at = datetime.now(timezone.utc)
        claim.updated_at = datetime.now(timezone.utc)

        await self.db.commit()
        await self.db.refresh(claim)
        return claim

    async def record_payment(self, data: IncentivePaymentRecord, current_user: User) -> IncentivePayment:
        # Check idempotency
        existing_idem = await self.db.execute(
            select(IncentivePayment).where(IncentivePayment.idempotency_key == data.idempotency_key)
        )
        if existing_idem.scalar_one_or_none():
            raise DuplicateError(f"Payment with idempotency key '{data.idempotency_key}' already processed.")

        # Check claim
        res = await self.db.execute(select(IncentiveClaim).where(IncentiveClaim.id == data.claim_id))
        claim = res.scalar_one_or_none()
        if not claim:
            raise NotFoundError("IncentiveClaim", str(data.claim_id))

        if claim.status != ClaimStatus.APPROVED.value:
            raise BusinessRuleError("Payment can only be recorded for approved claims.")

        payment = IncentivePayment(
            claim_id=data.claim_id,
            idempotency_key=data.idempotency_key,
            payment_reference=data.payment_reference,
            amount=data.amount,
            payment_method=data.payment_method,
            status=PaymentStatus.COMPLETED.value,
            payment_date=data.payment_date,
            recorded_by_id=current_user.id,
            reconciliation_notes=data.reconciliation_notes,
        )
        self.db.add(payment)

        # Mark claim as paid
        claim.status = ClaimStatus.PAID.value
        claim.updated_at = datetime.now(timezone.utc)

        await self.db.commit()
        await self.db.refresh(payment)
        return payment
