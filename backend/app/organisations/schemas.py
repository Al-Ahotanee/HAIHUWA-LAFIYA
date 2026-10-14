"""Schemas for geographic entities and health facilities."""

from __future__ import annotations

import uuid
from datetime import datetime
from pydantic import BaseModel, Field


class StateCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    code: str = Field(..., min_length=2, max_length=10)


class StateResponse(BaseModel):
    id: uuid.UUID
    name: str
    code: str
    created_at: datetime

    class Config:
        from_attributes = True


class LGACreate(BaseModel):
    state_id: uuid.UUID
    name: str
    code: str


class LGAResponse(BaseModel):
    id: uuid.UUID
    state_id: uuid.UUID
    name: str
    code: str
    created_at: datetime

    class Config:
        from_attributes = True


class WardCreate(BaseModel):
    lga_id: uuid.UUID
    name: str
    code: str


class WardResponse(BaseModel):
    id: uuid.UUID
    lga_id: uuid.UUID
    name: str
    code: str
    created_at: datetime

    class Config:
        from_attributes = True


class CommunityCreate(BaseModel):
    ward_id: uuid.UUID
    name: str = Field(..., min_length=2, max_length=100)


class CommunityResponse(BaseModel):
    id: uuid.UUID
    ward_id: uuid.UUID
    name: str
    created_at: datetime

    class Config:
        from_attributes = True


class FacilityCreate(BaseModel):
    lga_id: uuid.UUID
    name: str
    code: str
    facility_type: str = "phc"
    address: str | None = None
    phone: str | None = None
    is_active: bool = True


class FacilityResponse(BaseModel):
    id: uuid.UUID
    lga_id: uuid.UUID
    name: str
    code: str
    facility_type: str
    address: str | None = None
    phone: str | None = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class OrganisationResponse(BaseModel):
    id: uuid.UUID
    name: str
    code: str
    description: str | None = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
