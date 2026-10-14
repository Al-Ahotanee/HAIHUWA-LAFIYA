"""Delivery and newborn REST endpoints."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_roles
from app.auth.models import User
from app.common.enums import UserRole
from app.database import get_db
from app.deliveries.schemas import DeliveryCreate, DeliveryResponse
from app.deliveries.service import DeliveryService

router = APIRouter(prefix="/deliveries", tags=["Deliveries"])


@router.post("", response_model=DeliveryResponse, status_code=status.HTTP_201_CREATED)
async def record_delivery(
    data: DeliveryCreate,
    current_user: Annotated[User, Depends(require_roles([
        UserRole.MIDWIFE, UserRole.FACILITY_MANAGER, UserRole.SUPER_ADMIN
    ]))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> DeliveryResponse:
    """Record childbirth outcome, close active pregnancy, and create newborn records."""
    service = DeliveryService(db)
    delivery = await service.record_delivery(data, current_user)
    return DeliveryResponse.model_validate(delivery)
