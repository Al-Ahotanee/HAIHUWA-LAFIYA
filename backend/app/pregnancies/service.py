"""Pregnancy business service: registration, EDD calculation, and longitudinal care."""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.common.enums import PregnancyStatus
from app.common.pagination import paginate
from app.common.schemas import PaginatedResponse, PaginationParams
from app.exceptions import BusinessRuleError, NotFoundError
from app.models import Mother, Pregnancy
from app.pregnancies.schemas import PregnancyCreate, PregnancyResponse, PregnancyUpdate


class PregnancyService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def register_pregnancy(self, data: PregnancyCreate, current_user: User) -> Pregnancy:
        # Check mother exists
        m_res = await self.db.execute(select(Mother).where(Mother.id == data.mother_id))
        mother = m_res.scalar_one_or_none()
        if not mother:
            raise NotFoundError("Mother", str(data.mother_id))

        # Check for existing active pregnancy (one active pregnancy per mother at a time)
        existing_active = await self.db.execute(
            select(Pregnancy).where(
                Pregnancy.mother_id == data.mother_id,
                Pregnancy.status == PregnancyStatus.ACTIVE.value,
            )
        )
        if existing_active.scalar_one_or_none():
            raise BusinessRuleError(
                "Mother already has an active pregnancy. Please resolve or close the current pregnancy before registering a new one."
            )

        # Calculate EDD automatically if LMP provided and EDD not set (Naegele's rule: LMP + 280 days)
        edd = data.estimated_due_date
        if data.lmp_date and not edd:
            edd = data.lmp_date + timedelta(days=280)

        pregnancy = Pregnancy(
            mother_id=data.mother_id,
            lmp_date=data.lmp_date,
            estimated_due_date=edd,
            gravida=data.gravida,
            parity=data.parity,
            gestational_age_at_registration=data.gestational_age_at_registration,
            status=PregnancyStatus.ACTIVE.value,
            is_high_risk=data.is_high_risk,
            high_risk_reasons=data.high_risk_reasons,
            facility_id=data.facility_id or current_user.facility_id,
            registered_by_id=current_user.id,
        )
        self.db.add(pregnancy)
        await self.db.commit()
        await self.db.refresh(pregnancy)
        return pregnancy

    async def get_pregnancy_by_id(self, pregnancy_id: uuid.UUID) -> Pregnancy:
        res = await self.db.execute(select(Pregnancy).where(Pregnancy.id == pregnancy_id))
        pregnancy = res.scalar_one_or_none()
        if not pregnancy:
            raise NotFoundError("Pregnancy", str(pregnancy_id))
        return pregnancy

    async def list_by_mother(self, mother_id: uuid.UUID) -> list[Pregnancy]:
        query = (
            select(Pregnancy)
            .where(Pregnancy.mother_id == mother_id)
            .order_by(Pregnancy.created_at.desc())
        )
        res = await self.db.execute(query)
        return list(res.scalars().all())

    async def update_pregnancy(
        self,
        pregnancy_id: uuid.UUID,
        data: PregnancyUpdate,
    ) -> Pregnancy:
        pregnancy = await self.get_pregnancy_by_id(pregnancy_id)
        if data.is_high_risk is not None:
            pregnancy.is_high_risk = data.is_high_risk
        if data.high_risk_reasons is not None:
            pregnancy.high_risk_reasons = data.high_risk_reasons
        if data.status is not None:
            pregnancy.status = data.status
        if data.outcome_date is not None:
            pregnancy.outcome_date = data.outcome_date

        pregnancy.updated_at = datetime.now(timezone.utc)
        await self.db.commit()
        await self.db.refresh(pregnancy)
        return pregnancy
