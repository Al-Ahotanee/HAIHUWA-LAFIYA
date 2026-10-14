"""Reporting service calculating real aggregate metrics from PostgreSQL."""

from __future__ import annotations

from datetime import date
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.enums import AppointmentStatus, ClaimStatus, PregnancyStatus, ReferralStatus
from app.models import Appointment, Delivery, IncentivePayment, Mother, Newborn, Pregnancy, Referral
from app.reports.schemas import DashboardStatsResponse


class ReportService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_dashboard_stats(self) -> DashboardStatsResponse:
        """Fetch real aggregate data without fabricated figures."""
        # Mothers count
        mothers_res = await self.db.execute(select(func.count(Mother.id)).where(Mother.is_active.is_(True)))
        total_mothers = mothers_res.scalar_one()

        # Active pregnancies
        active_preg_res = await self.db.execute(
            select(func.count(Pregnancy.id)).where(Pregnancy.status == PregnancyStatus.ACTIVE.value)
        )
        active_pregnancies = active_preg_res.scalar_one()

        # High risk pregnancies
        high_risk_res = await self.db.execute(
            select(func.count(Pregnancy.id)).where(
                Pregnancy.status == PregnancyStatus.ACTIVE.value,
                Pregnancy.is_high_risk.is_(True),
            )
        )
        high_risk_pregnancies = high_risk_res.scalar_one()

        # Attended ANC visits
        anc_res = await self.db.execute(
            select(func.count(Appointment.id)).where(
                Appointment.status == AppointmentStatus.ATTENDED.value,
                Appointment.visit_type == "anc",
            )
        )
        attended_anc = anc_res.scalar_one()

        # Overdue appointments
        overdue_res = await self.db.execute(
            select(func.count(Appointment.id)).where(
                Appointment.status == AppointmentStatus.SCHEDULED.value,
                Appointment.scheduled_date < date.today(),
            )
        )
        overdue_visits = overdue_res.scalar_one()

        # Deliveries & facility births
        deliv_res = await self.db.execute(select(func.count(Delivery.id)))
        total_deliveries = deliv_res.scalar_one()

        fac_deliv_res = await self.db.execute(
            select(func.count(Delivery.id)).where(Delivery.place_of_delivery == "facility")
        )
        facility_deliveries = fac_deliv_res.scalar_one()

        # Newborns live
        nb_res = await self.db.execute(
            select(func.count(Newborn.id)).where(Newborn.status == "alive")
        )
        live_births = nb_res.scalar_one()

        # Active referrals
        ref_res = await self.db.execute(
            select(func.count(Referral.id)).where(
                Referral.status.in_([ReferralStatus.INITIATED.value, ReferralStatus.ACCEPTED.value, ReferralStatus.IN_TRANSIT.value])
            )
        )
        active_referrals = ref_res.scalar_one()

        # Total manual payments disbursed
        pay_res = await self.db.execute(
            select(func.coalesce(func.sum(IncentivePayment.amount), 0))
        )
        total_disbursed = float(pay_res.scalar_one())

        return DashboardStatsResponse(
            total_registered_mothers=total_mothers,
            active_pregnancies=active_pregnancies,
            high_risk_pregnancies=high_risk_pregnancies,
            attended_anc_visits=attended_anc,
            overdue_visits=overdue_visits,
            total_deliveries=total_deliveries,
            facility_deliveries=facility_deliveries,
            live_births=live_births,
            active_referrals=active_referrals,
            total_disbursed_amount=total_disbursed,
        )
