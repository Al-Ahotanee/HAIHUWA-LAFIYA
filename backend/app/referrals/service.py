"""Referral business service: initiation, transitions, and timeline tracking."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.common.enums import ReferralStatus
from app.exceptions import NotFoundError
from app.models import HealthFacility, Pregnancy, Referral, ReferralUpdate
from app.referrals.schemas import ReferralCreate, ReferralStatusUpdate


class ReferralService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def initiate_referral(self, data: ReferralCreate, current_user: User) -> Referral:
        referral = Referral(
            pregnancy_id=data.pregnancy_id,
            referring_facility_id=data.referring_facility_id,
            receiving_facility_id=data.receiving_facility_id,
            urgency=data.urgency,
            reason=data.reason,
            clinical_findings=data.clinical_findings,
            treatments_given=data.treatments_given,
            status=ReferralStatus.INITIATED.value,
            initiated_by_id=current_user.id,
        )
        self.db.add(referral)
        await self.db.flush()

        initial_log = ReferralUpdate(
            referral_id=referral.id,
            previous_status="none",
            new_status=ReferralStatus.INITIATED.value,
            notes="Referral initiated",
            updated_by_id=current_user.id,
        )
        self.db.add(initial_log)
        await self.db.commit()
        await self.db.refresh(referral)
        return referral

    async def transition_status(
        self,
        referral_id: uuid.UUID,
        data: ReferralStatusUpdate,
        current_user: User,
    ) -> Referral:
        res = await self.db.execute(select(Referral).where(Referral.id == referral_id))
        referral = res.scalar_one_or_none()
        if not referral:
            raise NotFoundError("Referral", str(referral_id))

        previous_status = referral.status
        referral.status = data.new_status
        referral.updated_at = datetime.now(timezone.utc)

        log = ReferralUpdate(
            referral_id=referral.id,
            previous_status=previous_status,
            new_status=data.new_status,
            notes=data.notes,
            updated_by_id=current_user.id,
        )
        self.db.add(log)
        await self.db.commit()
        await self.db.refresh(referral)
        return referral
