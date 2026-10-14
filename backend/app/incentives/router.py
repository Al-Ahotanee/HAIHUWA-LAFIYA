"""Incentives and manual payment REST endpoints."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_roles
from app.auth.models import User
from app.common.enums import UserRole
from app.database import get_db
from app.incentives.schemas import (
    IncentiveClaimCreate,
    IncentiveClaimResponse,
    IncentivePaymentRecord,
    IncentivePaymentResponse,
)
from app.incentives.service import IncentiveService

router = APIRouter(prefix="/incentives", tags=["Incentives & Disbursements"])


@router.post("/claims", response_model=IncentiveClaimResponse, status_code=status.HTTP_201_CREATED)
async def submit_claim(
    data: IncentiveClaimCreate,
    current_user: Annotated[User, Depends(require_roles([
        UserRole.CHW, UserRole.MIDWIFE, UserRole.FACILITY_MANAGER, UserRole.SUPER_ADMIN
    ]))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> IncentiveClaimResponse:
    """Submit milestone claim with duplicate prevention."""
    service = IncentiveService(db)
    claim = await service.submit_claim(data, current_user)
    return IncentiveClaimResponse.model_validate(claim)


@router.post("/claims/{claim_id}/approve", response_model=IncentiveClaimResponse)
async def approve_claim(
    claim_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_roles([
        UserRole.FINANCE_OFFICER, UserRole.PROGRAMME_MANAGER, UserRole.SUPER_ADMIN
    ]))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> IncentiveClaimResponse:
    """Approve claim for manual cash or transfer disbursement."""
    service = IncentiveService(db)
    claim = await service.approve_claim(claim_id, current_user)
    return IncentiveClaimResponse.model_validate(claim)


@router.post("/payments", response_model=IncentivePaymentResponse, status_code=status.HTTP_201_CREATED)
async def record_payment(
    data: IncentivePaymentRecord,
    current_user: Annotated[User, Depends(require_roles([
        UserRole.FINANCE_OFFICER, UserRole.SUPER_ADMIN
    ]))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> IncentivePaymentResponse:
    """Record manual payment disbursement with idempotency protection."""
    service = IncentiveService(db)
    payment = await service.record_payment(data, current_user)
    return IncentivePaymentResponse.model_validate(payment)
