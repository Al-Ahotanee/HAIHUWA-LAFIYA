"""Authentication and authorization dependencies and RBAC checks."""

from __future__ import annotations

import uuid
from typing import Annotated, Sequence

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.auth.security import decode_token
from app.common.enums import UserRole
from app.database import get_db
from app.exceptions import ForbiddenError, UnauthorizedError

security_scheme = HTTPBearer(auto_error=False)

# Role hierarchy levels for permission comparisons
ROLE_HIERARCHY: dict[str, int] = {
    UserRole.CHW.value: 10,
    UserRole.MIDWIFE.value: 20,
    UserRole.DATA_OFFICER.value: 30,
    UserRole.FINANCE_OFFICER.value: 30,
    UserRole.FACILITY_MANAGER.value: 40,
    UserRole.LGA_COORDINATOR.value: 50,
    UserRole.PROGRAMME_MANAGER.value: 60,
    UserRole.AUDITOR.value: 50,
    UserRole.SUPER_ADMIN.value: 100,
}


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """Validate bearer token and resolve current active user."""
    if not credentials or not credentials.credentials:
        raise UnauthorizedError("Missing authentication token")

    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") != "access":
        raise UnauthorizedError("Invalid or expired access token")

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise UnauthorizedError("Token missing subject identifier")

    try:
        user_uuid = uuid.UUID(user_id_str)
    except ValueError:
        raise UnauthorizedError("Malformed user identifier in token")

    query = select(User).where(User.id == user_uuid, User.is_active.is_(True))
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user:
        raise UnauthorizedError("User not found or account is deactivated")

    return user


def require_roles(allowed_roles: Sequence[UserRole | str]):
    """Enforce RBAC role check on route endpoints."""
    allowed_values = [r.value if isinstance(r, UserRole) else str(r) for r in allowed_roles]

    async def role_checker(current_user: Annotated[User, Depends(get_current_user)]) -> User:
        if current_user.role == UserRole.SUPER_ADMIN.value:
            return current_user

        if current_user.role not in allowed_values:
            raise ForbiddenError(f"Insufficient permissions. Required one of: {allowed_values}")
        return current_user

    return role_checker


def check_geographic_access(
    user: User,
    *,
    lga_id: uuid.UUID | None = None,
    ward_id: uuid.UUID | None = None,
    facility_id: uuid.UUID | None = None,
) -> bool:
    """Enforce ward, facility or LGA boundary access constraints."""
    if user.role == UserRole.SUPER_ADMIN.value or user.role == UserRole.PROGRAMME_MANAGER.value:
        return True

    if user.lga_id and lga_id and user.lga_id != lga_id:
        return False

    if user.ward_id and ward_id and user.ward_id != ward_id:
        return False

    if user.facility_id and facility_id and user.facility_id != facility_id:
        return False

    return True
