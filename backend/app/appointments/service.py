"""Appointments service: scheduling, attendance recording, incentive triggering, and missed visit detection."""

from __future__ import annotations

import uuid
from datetime import date, datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.appointments.schemas import AppointmentCreate, AppointmentResponse, AppointmentUpdate, FollowupCreate, MissedAppointmentItem
from app.auth.models import User
from app.common.enums import AppointmentStatus, ClaimStatus
from app.common.pagination import paginate
from app.common.schemas import PaginatedResponse, PaginationParams
from app.exceptions import BusinessRuleError, NotFoundError
from app.models import Appointment, AppointmentFollowup, HealthFacility, IncentiveClaim, IncentiveRule, Mother, Pregnancy


class AppointmentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def schedule_appointment(self, data: AppointmentCreate, current_user: User) -> Appointment:
        preg_res = await self.db.execute(select(Pregnancy).where(Pregnancy.id == data.pregnancy_id))
        preg = preg_res.scalar_one_or_none()
        if not preg:
            raise NotFoundError("Pregnancy", str(data.pregnancy_id))

        facility_id = data.facility_id or preg.facility_id or current_user.facility_id

        appointment = Appointment(
            pregnancy_id=data.pregnancy_id,
            anc_visit_id=data.anc_visit_id,
            facility_id=facility_id,
            visit_type=data.visit_type,
            scheduled_date=data.scheduled_date,
            status=AppointmentStatus.SCHEDULED.value,
            notes=data.notes,
            created_by_id=current_user.id,
        )
        self.db.add(appointment)
        await self.db.commit()
        await self.db.refresh(appointment)
        return appointment

    async def record_attendance(
        self,
        appointment_id: uuid.UUID,
        actual_date: date,
        current_user: User,
        notes: str | None = None,
    ) -> Appointment:
        res = await self.db.execute(select(Appointment).where(Appointment.id == appointment_id))
        appointment = res.scalar_one_or_none()
        if not appointment:
            raise NotFoundError("Appointment", str(appointment_id))

        appointment.status = AppointmentStatus.ATTENDED.value
        appointment.actual_date = actual_date
        appointment.attended_by_id = current_user.id
        if notes:
            appointment.notes = (appointment.notes or "") + "\n" + notes
        appointment.updated_at = datetime.now(timezone.utc)

        # Count attended ANC visits for this pregnancy to auto-trigger ANC-4 milestone
        attended_count_res = await self.db.execute(
            select(func.count(Appointment.id)).where(
                Appointment.pregnancy_id == appointment.pregnancy_id,
                Appointment.visit_type == "anc",
                Appointment.status == AppointmentStatus.ATTENDED.value,
            )
        )
        attended_count = attended_count_res.scalar_one()

        if attended_count >= 4:
            # Check if ANC4 rule exists and if claim has already been filed
            rule_res = await self.db.execute(
                select(IncentiveRule).where(IncentiveRule.trigger_event == "anc_milestone_4", IncentiveRule.is_active == True)
            )
            rule = rule_res.scalars().first()
            if rule:
                existing_claim = await self.db.execute(
                    select(IncentiveClaim).where(
                        IncentiveClaim.pregnancy_id == appointment.pregnancy_id,
                        IncentiveClaim.rule_id == rule.id,
                    )
                )
                if not existing_claim.scalar_one_or_none():
                    # Fetch pregnancy to get mother_id
                    preg = (await self.db.execute(select(Pregnancy).where(Pregnancy.id == appointment.pregnancy_id))).scalar_one()
                    date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
                    count_claims = (await self.db.execute(select(func.count(IncentiveClaim.id)))).scalar_one() + 1
                    new_claim = IncentiveClaim(
                        claim_reference=f"CLM-{date_str}-{count_claims:04d}",
                        rule_id=rule.id,
                        mother_id=preg.mother_id,
                        pregnancy_id=preg.id,
                        amount=rule.amount,
                        status=ClaimStatus.PENDING.value,
                        submitted_by_id=current_user.id,
                    )
                    self.db.add(new_claim)

        await self.db.commit()
        await self.db.refresh(appointment)
        return appointment

    async def list_missed_appointments(self, reference_date: date | None = None) -> list[MissedAppointmentItem]:
        """Detect scheduled visits whose date has passed without attendance."""
        ref_date = reference_date or date.today()

        query = (
            select(Appointment, Pregnancy, Mother, HealthFacility)
            .join(Pregnancy, Appointment.pregnancy_id == Pregnancy.id)
            .join(Mother, Pregnancy.mother_id == Mother.id)
            .outerjoin(HealthFacility, Appointment.facility_id == HealthFacility.id)
            .where(
                Appointment.status == AppointmentStatus.SCHEDULED.value,
                Appointment.scheduled_date < ref_date,
            )
            .order_by(Appointment.scheduled_date.asc())
        )
        result = await self.db.execute(query)
        rows = result.all()

        missed = []
        for appt, preg, mother, facility in rows:
            days_overdue = (ref_date - appt.scheduled_date).days
            missed.append(
                MissedAppointmentItem(
                    appointment_id=appt.id,
                    pregnancy_id=preg.id,
                    mother_id=mother.id,
                    mother_name=f"{mother.first_name} {mother.last_name}",
                    mother_phone=mother.phone,
                    scheduled_date=appt.scheduled_date,
                    days_overdue=days_overdue,
                    facility_name=facility.name if facility else None,
                )
            )
        return missed

    async def log_followup(self, data: FollowupCreate, current_user: User) -> AppointmentFollowup:
        followup = AppointmentFollowup(
            appointment_id=data.appointment_id,
            followup_type=data.followup_type,
            followup_date=data.followup_date,
            outcome=data.outcome,
            notes=data.notes,
            performed_by_id=current_user.id,
        )
        self.db.add(followup)
        await self.db.commit()
        await self.db.refresh(followup)
        return followup

    async def list_appointments(
        self,
        params: PaginationParams,
        *,
        status: str | None = None,
        visit_type: str | None = None,
    ) -> PaginatedResponse[AppointmentResponse]:
        query = select(Appointment).order_by(Appointment.scheduled_date.asc())
        if status:
            query = query.where(Appointment.status == status)
        if visit_type:
            query = query.where(Appointment.visit_type == visit_type)
        return await paginate(self.db, query, params, response_model=AppointmentResponse)
