"""Reporting REST router for dashboard metrics and DHIS2 / NHMIS export."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated
from fastapi import APIRouter, Depends, Response
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.database import get_db
from app.models import Delivery, HealthFacility, Mother, Pregnancy, Referral
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


@router.get("/dhis2-export")
async def export_dhis2_nhmis(
    _current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Generate standardized DHIS2 / NHMIS 001/002 data aggregate export for Northern Nigeria."""
    service = ReportService(db)
    stats = await service.get_dashboard_stats()
    
    period = datetime.now(timezone.utc).strftime("%Y%m")
    
    # Standard DHIS2 dataValueSets schema
    payload = {
        "orgUnit": "NG-NORTH-PHCDA",
        "period": period,
        "dataSet": "NHMIS-MNCH-MONTHLY-SUMMARY",
        "dataValues": [
            {"dataElement": "ANC_TOTAL_REGISTERED", "period": period, "value": stats.total_registered_mothers},
            {"dataElement": "ANC_ACTIVE_PREGNANCIES", "period": period, "value": stats.active_pregnancies},
            {"dataElement": "ANC_HIGH_RISK_DETECTED", "period": period, "value": stats.high_risk_pregnancies},
            {"dataElement": "DELIVERY_TOTAL_RECORDED", "period": period, "value": stats.total_deliveries},
            {"dataElement": "DELIVERY_SKILLED_FACILITY", "period": period, "value": stats.facility_deliveries},
            {"dataElement": "DELIVERY_LIVE_BIRTHS", "period": period, "value": stats.live_births},
            {"dataElement": "REFERRAL_OBSTETRIC_EMERGENCY", "period": period, "value": stats.active_referrals},
            {"dataElement": "INCENTIVE_FUNDS_DISBURSED_NGN", "period": period, "value": stats.total_disbursed_amount},
        ]
    }
    return payload


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
