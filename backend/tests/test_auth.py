"""Tests for health endpoint and auth security workflows."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.auth.security import get_password_hash


@pytest.mark.asyncio
async def test_health_check_endpoint(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "timestamp" in data


@pytest.mark.asyncio
async def test_auth_login_flow(client: AsyncClient, db_session: AsyncSession):
    # Seed a test user
    test_user = User(
        email="test_midwife@haihuwalafiya.org",
        password_hash=get_password_hash("securePassword123!"),
        full_name="Amina Ibrahim",
        role="midwife",
        is_active=True,
    )
    db_session.add(test_user)
    await db_session.commit()

    # Successful login
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "test_midwife@haihuwalafiya.org", "password": "securePassword123!"},
    )
    assert login_res.status_code == 200
    token_data = login_res.json()
    assert "access_token" in token_data
    assert "refresh_token" in token_data
    assert token_data["user"]["email"] == "test_midwife@haihuwalafiya.org"
    assert token_data["user"]["role"] == "midwife"

    # Profile verification with token
    headers = {"Authorization": f"Bearer {token_data['access_token']}"}
    me_res = await client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["full_name"] == "Amina Ibrahim"

    # Token refresh
    refresh_res = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": token_data["refresh_token"]},
    )
    assert refresh_res.status_code == 200
    new_tokens = refresh_res.json()
    assert "access_token" in new_tokens

    # Invalid password rejection
    bad_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "test_midwife@haihuwalafiya.org", "password": "wrongPassword"},
    )
    assert bad_login.status_code == 401
