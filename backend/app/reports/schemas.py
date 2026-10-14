"""Reporting and live dashboard metrics schemas."""

from __future__ import annotations

from pydantic import BaseModel


class DashboardStatsResponse(BaseModel):
    total_registered_mothers: int
    active_pregnancies: int
    high_risk_pregnancies: int
    attended_anc_visits: int
    overdue_visits: int
    total_deliveries: int
    facility_deliveries: int
    live_births: int
    active_referrals: int
    total_disbursed_amount: float
