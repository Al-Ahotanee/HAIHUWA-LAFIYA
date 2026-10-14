"""Auth service: login authentication, rate limiting, and session lifecycle."""

from __future__ import annotations

import hashlib
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import LoginAttempt, User, UserSession
from app.auth.schemas import LoginRequest, TokenResponse, UserResponse
from app.auth.security import create_access_token, create_refresh_token, decode_token, get_password_hash, verify_password
from app.config import get_settings
from app.exceptions import RateLimitError, UnauthorizedError


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.settings = get_settings()

    async def check_rate_limit(self, email: str, ip_address: str | None) -> None:
        """Enforce max failed attempts per window."""
        window_start = datetime.now(timezone.utc) - timedelta(
            minutes=self.settings.LOGIN_RATE_LIMIT_WINDOW_MINUTES
        )

        query = select(func.count(LoginAttempt.id)).where(
            LoginAttempt.email == email,
            LoginAttempt.success.is_(False),
            LoginAttempt.created_at >= window_start,
        )
        result = await self.db.execute(query)
        failed_count = result.scalar_one()

        if failed_count >= self.settings.LOGIN_RATE_LIMIT_ATTEMPTS:
            raise RateLimitError(
                f"Too many failed login attempts. Please wait {self.settings.LOGIN_RATE_LIMIT_WINDOW_MINUTES} minutes."
            )

    async def log_attempt(self, email: str, ip_address: str | None, success: bool) -> None:
        attempt = LoginAttempt(
            email=email,
            ip_address=ip_address,
            success=success,
        )
        self.db.add(attempt)
        await self.db.commit()

    async def authenticate(
        self,
        login_data: LoginRequest,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> TokenResponse:
        await self.check_rate_limit(login_data.email, ip_address)

        query = select(User).where(User.email == login_data.email)
        result = await self.db.execute(query)
        user = result.scalar_one_or_none()

        if not user or not verify_password(login_data.password, user.password_hash):
            await self.log_attempt(login_data.email, ip_address, success=False)
            raise UnauthorizedError("Invalid email or password")

        if not user.is_active:
            await self.log_attempt(login_data.email, ip_address, success=False)
            raise UnauthorizedError("User account is inactive. Please contact your coordinator.")

        await self.log_attempt(login_data.email, ip_address, success=True)

        token_payload = {
            "sub": str(user.id),
            "email": user.email,
            "role": user.role,
        }
        access_token = create_access_token(token_payload)
        refresh_token = create_refresh_token(token_payload)

        # Store hashed refresh token in session
        refresh_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        session = UserSession(
            user_id=user.id,
            refresh_token_hash=refresh_hash,
            ip_address=ip_address,
            user_agent=user_agent,
            expires_at=datetime.now(timezone.utc) + timedelta(days=self.settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )
        self.db.add(session)
        await self.db.commit()

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserResponse.model_validate(user),
        )

    async def refresh_tokens(self, refresh_token: str) -> TokenResponse:
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise UnauthorizedError("Invalid refresh token")

        user_id_str = payload.get("sub")
        if not user_id_str:
            raise UnauthorizedError("Malformed refresh token")

        user_uuid = uuid.UUID(user_id_str)
        refresh_hash = hashlib.sha256(refresh_token.encode()).hexdigest()

        # Check session
        query = select(UserSession).where(
            UserSession.refresh_token_hash == refresh_hash,
            UserSession.user_id == user_uuid,
            UserSession.revoked_at.is_(None),
            UserSession.expires_at > datetime.now(timezone.utc),
        )
        res = await self.db.execute(query)
        session = res.scalar_one_or_none()
        if not session:
            raise UnauthorizedError("Session expired or revoked")

        # Get user
        u_res = await self.db.execute(select(User).where(User.id == user_uuid, User.is_active.is_(True)))
        user = u_res.scalar_one_or_none()
        if not user:
            raise UnauthorizedError("User deactivated")

        # Rotate tokens
        token_payload = {
            "sub": str(user.id),
            "email": user.email,
            "role": user.role,
        }
        new_access = create_access_token(token_payload)
        new_refresh = create_refresh_token(token_payload)

        # Invalidate old session and record new one
        session.revoked_at = datetime.now(timezone.utc)
        new_session = UserSession(
            user_id=user.id,
            refresh_token_hash=hashlib.sha256(new_refresh.encode()).hexdigest(),
            ip_address=session.ip_address,
            user_agent=session.user_agent,
            expires_at=datetime.now(timezone.utc) + timedelta(days=self.settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )
        self.db.add(new_session)
        await self.db.commit()

        return TokenResponse(
            access_token=new_access,
            refresh_token=new_refresh,
            user=UserResponse.model_validate(user),
        )

    async def logout(self, refresh_token: str) -> None:
        refresh_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        query = select(UserSession).where(UserSession.refresh_token_hash == refresh_hash)
        res = await self.db.execute(query)
        session = res.scalar_one_or_none()
        if session:
            session.revoked_at = datetime.now(timezone.utc)
            await self.db.commit()
