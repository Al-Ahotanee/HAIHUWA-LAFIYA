"""Pydantic schemas for Auth and User management."""

from __future__ import annotations

import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

from app.common.enums import UserRole


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)


class TokenRefreshRequest(BaseModel):
    refresh_token: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    phone: str | None = None
    role: str
    is_active: bool
    organisation_id: uuid.UUID | None = None
    programme_area_id: uuid.UUID | None = None
    lga_id: uuid.UUID | None = None
    ward_id: uuid.UUID | None = None
    facility_id: uuid.UUID | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str
    phone: str | None = None
    role: UserRole
    organisation_id: uuid.UUID | None = None
    lga_id: uuid.UUID | None = None
    ward_id: uuid.UUID | None = None
    facility_id: uuid.UUID | None = None


class UserUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    role: UserRole | None = None
    is_active: bool | None = None
    lga_id: uuid.UUID | None = None
    ward_id: uuid.UUID | None = None
    facility_id: uuid.UUID | None = None
