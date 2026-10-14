"""Authentication API Router."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy import select
from app.auth.dependencies import get_current_user, require_roles
from app.common.enums import UserRole
from app.auth.models import User
from app.auth.schemas import LoginRequest, TokenRefreshRequest, TokenResponse, UserResponse
from app.auth.service import AuthService
from app.common.schemas import MessageResponse
from app.database import get_db

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
async def login(
    login_data: LoginRequest,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    """Authenticate user with rate limiting and issue tokens."""
    service = AuthService(db)
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    return await service.authenticate(login_data, ip_address=client_ip, user_agent=user_agent)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    refresh_data: TokenRefreshRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    """Rotate access and refresh tokens."""
    service = AuthService(db)
    return await service.refresh_tokens(refresh_data.refresh_token)


@router.post("/logout", response_model=MessageResponse)
async def logout(
    refresh_data: TokenRefreshRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MessageResponse:
    """Revoke session token."""
    service = AuthService(db)
    await service.logout(refresh_data.refresh_token)
    return MessageResponse(message="Successfully logged out")


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: Annotated[User, Depends(get_current_user)],
) -> UserResponse:
    """Get current authenticated user profile."""
    return UserResponse.model_validate(current_user)


@router.get("/users", response_model=list[UserResponse])
async def list_users(
    _current_user: Annotated[User, Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.PROGRAMME_MANAGER, UserRole.DATA_OFFICER]))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[UserResponse]:
    """List all system users for administrative management."""
    result = await db.execute(select(User).order_by(User.full_name))
    users = result.scalars().all()
    return [UserResponse.model_validate(u) for u in users]

