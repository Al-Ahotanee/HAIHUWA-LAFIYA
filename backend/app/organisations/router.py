"""Geographic entities, health facilities, and organisation management REST router."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_roles
from app.auth.models import User
from app.common.enums import UserRole
from app.database import get_db
from app.models import HealthFacility, LGA, Organisation, State, Ward
from app.organisations.schemas import (
    FacilityCreate,
    FacilityResponse,
    LGACreate,
    LGAResponse,
    OrganisationResponse,
    StateResponse,
    WardCreate,
    WardResponse,
)

router = APIRouter(tags=["Geography & Health Facilities"])


# States
@router.get("/locations/states", response_model=list[StateResponse])
async def list_states(
    _current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[StateResponse]:
    """List all states."""
    result = await db.execute(select(State).order_by(State.name))
    return [StateResponse.model_validate(s) for s in result.scalars().all()]


# LGAs
@router.get("/locations/lgas", response_model=list[LGAResponse])
async def list_lgas(
    _current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    state_id: uuid.UUID | None = None,
) -> list[LGAResponse]:
    """List LGAs, optionally filtered by state."""
    query = select(LGA).order_by(LGA.name)
    if state_id:
        query = query.where(LGA.state_id == state_id)
    result = await db.execute(query)
    return [LGAResponse.model_validate(l) for l in result.scalars().all()]


@router.post("/locations/lgas", response_model=LGAResponse, status_code=status.HTTP_201_CREATED)
async def create_lga(
    data: LGACreate,
    _current_user: Annotated[User, Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.PROGRAMME_MANAGER]))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> LGAResponse:
    """Create a new Local Government Area."""
    lga = LGA(state_id=data.state_id, name=data.name, code=data.code.upper())
    db.add(lga)
    await db.commit()
    await db.refresh(lga)
    return LGAResponse.model_validate(lga)


# Wards
@router.get("/locations/wards", response_model=list[WardResponse])
async def list_wards(
    _current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    lga_id: uuid.UUID | None = None,
) -> list[WardResponse]:
    """List Wards, optionally filtered by LGA."""
    query = select(Ward).order_by(Ward.name)
    if lga_id:
        query = query.where(Ward.lga_id == lga_id)
    result = await db.execute(query)
    return [WardResponse.model_validate(w) for w in result.scalars().all()]


@router.post("/locations/wards", response_model=WardResponse, status_code=status.HTTP_201_CREATED)
async def create_ward(
    data: WardCreate,
    _current_user: Annotated[User, Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.PROGRAMME_MANAGER]))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> WardResponse:
    """Create a new Ward."""
    ward = Ward(lga_id=data.lga_id, name=data.name, code=data.code.upper())
    db.add(ward)
    await db.commit()
    await db.refresh(ward)
    return WardResponse.model_validate(ward)


# Health Facilities
@router.get("/locations/facilities", response_model=list[FacilityResponse])
async def list_facilities(
    _current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    lga_id: uuid.UUID | None = None,
) -> list[FacilityResponse]:
    """List health facilities with optional LGA filtering."""
    query = select(HealthFacility).order_by(HealthFacility.name)
    if lga_id:
        query = query.where(HealthFacility.lga_id == lga_id)
    result = await db.execute(query)
    return [FacilityResponse.model_validate(f) for f in result.scalars().all()]


@router.post("/locations/facilities", response_model=FacilityResponse, status_code=status.HTTP_201_CREATED)
async def create_facility(
    data: FacilityCreate,
    _current_user: Annotated[User, Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.PROGRAMME_MANAGER]))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> FacilityResponse:
    """Register a new primary healthcare centre or hospital."""
    facility = HealthFacility(
        lga_id=data.lga_id,
        name=data.name,
        code=data.code.upper(),
        facility_type=data.facility_type,
        address=data.address,
        phone=data.phone,
        is_active=data.is_active,
    )
    db.add(facility)
    await db.commit()
    await db.refresh(facility)
    return FacilityResponse.model_validate(facility)


# Organisations
@router.get("/organisations", response_model=list[OrganisationResponse])
async def list_organisations(
    _current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[OrganisationResponse]:
    """List partner organisations."""
    result = await db.execute(select(Organisation).order_by(Organisation.name))
    return [OrganisationResponse.model_validate(o) for o in result.scalars().all()]
