"""Pregnancy business service: registration, EDD calculation, WHO 8-contact scheduling, and longitudinal care."""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.common.enums import AppointmentStatus, PregnancyStatus
from app.common.pagination import paginate
from app.common.schemas import PaginatedResponse, PaginationParams
from app.exceptions import BusinessRuleError, NotFoundError
from app.models import Appointment, Mother, Pregnancy
from app.pregnancies.schemas import PregnancyCreate, PregnancyResponse, PregnancyUpdate

# WHO 8-contact ANC Protocol (Weeks of gestation)
WHO_ANC_CONTACTS = [
    {"visit_num": 1, "target_week": 10, "notes": "WHO Contact 1: Booking visit (<12 weeks) - Registration, baseline BP/Hb, rapid tests, folate"},
    {"visit_num": 2, "target_week": 20, "notes": "WHO Contact 2: 20 weeks - Fetal anatomy scan, maternal wellbeing, proteinuria screening"},
    {"visit_num": 3, "target_week": 26, "notes": "WHO Contact 3: 26 weeks - Symphysis-fundal height, gestational diabetes screen, malaria IPTp"},
    {"visit_num": 4, "target_week": 30, "notes": "WHO Contact 4: 30 weeks - Blood pressure, anaemia re-screen, birth preparedness plan review"},
    {"visit_num": 5, "target_week": 34, "notes": "WHO Contact 5: 34 weeks - Fetal growth & presentation, pre-eclampsia assessment, birth kit check"},
    {"visit_num": 6, "target_week": 36, "notes": "WHO Contact 6: 36 weeks - Presentation confirmation, emergency referral readiness, transport plan"},
    {"visit_num": 7, "target_week": 38, "notes": "WHO Contact 7: 38 weeks - Labour onset counseling, danger signs review, support companion plan"},
    {"visit_num": 8, "target_week": 40, "notes": "WHO Contact 8: 40 weeks - Full term assessment, membrane sweep counseling, post-term referral plan"},
]


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
        lmp = data.lmp_date
        if lmp and not edd:
            edd = lmp + timedelta(days=280)
        elif edd and not lmp:
            lmp = edd - timedelta(days=280)

        pregnancy = Pregnancy(
            mother_id=data.mother_id,
            lmp_date=lmp,
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
        await self.db.flush()

        # Automatically schedule WHO 8-contact appointments if LMP/EDD is present
        if lmp:
            today = datetime.now(timezone.utc).date()
            for contact in WHO_ANC_CONTACTS:
                visit_date = lmp + timedelta(weeks=contact["target_week"])
                # If visit date is in the past, schedule booking now or keep track
                scheduled_date = visit_date if visit_date >= today else today + timedelta(days=contact["visit_num"] * 3)
                appt = Appointment(
                    pregnancy_id=pregnancy.id,
                    facility_id=pregnancy.facility_id,
                    visit_type="anc",
                    scheduled_date=scheduled_date,
                    status=AppointmentStatus.SCHEDULED.value,
                    notes=f"ANC Contact #{contact['visit_num']} ({contact['target_week']}w) - {contact['notes']}",
                )
                self.db.add(appt)

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

    async def list_pregnancies(
        self,
        params: PaginationParams,
        *,
        status: str | None = None,
        is_high_risk: bool | None = None,
    ) -> PaginatedResponse[PregnancyResponse]:
        query = select(Pregnancy).order_by(Pregnancy.created_at.desc())
        if status:
            query = query.where(Pregnancy.status == status)
        if is_high_risk is not None:
            query = query.where(Pregnancy.is_high_risk == is_high_risk)
        return await paginate(self.db, query, params, response_model=PregnancyResponse)
