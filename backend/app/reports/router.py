"""Reporting REST router for dashboard metrics."""

from __future__ import annotations

from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.database import get_db
from app.reports.schemas import DashboardStatsResponse
from app.reports.service import ReportService

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])


@router.get("/dashboard-stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(
    _current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> DashboardStatsResponse:
    """Provide real-time programme metrics computed from database records."""
    service = ReportService(db)
    return await service.get_dashboard_stats()


# Additional direct dashboard router mounted for frontend convenience
dashboard_router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@dashboard_router.get("/stats")
async def get_dashboard_stats_alias(
    _current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = ReportService(db)
    stats = await service.get_dashboard_stats()
    return {
        "active_mothers": stats.total_registered_mothers,
        "active_pregnancies": stats.active_pregnancies,
        "high_risk_pregnancies": stats.high_risk_pregnancies,
        "pending_referrals": stats.active_referrals,
        "scheduled_visits_today": stats.overdue_visits,
        "facility_deliveries_month": stats.facility_deliveries,
    }


@dashboard_router.get("/activity")
async def get_dashboard_activity(
    _current_user: Annotated[User, Depends(get_current_user)],
    _db: Annotated[AsyncSession, Depends(get_db)],
):
    return []

