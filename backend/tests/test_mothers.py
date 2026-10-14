"""Automated tests for Mother registration and duplicate prevention."""

import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.auth.security import create_access_token, get_password_hash
from app.models import LGA, State, Ward


@pytest.mark.asyncio
async def test_mother_registration_and_deduplication(client: AsyncClient, db_session: AsyncSession):
    # Setup Geography
    state = State(name="Kano", code="KAN")
    db_session.add(state)
    await db_session.flush()

    lga = LGA(state_id=state.id, name="Nasarawa", code="NAS")
    db_session.add(lga)
    await db_session.flush()

    ward = Ward(lga_id=lga.id, name="Gwagwarwa", code="GWG")
    db_session.add(ward)
    await db_session.flush()

    # Setup CHW User
    chw_user = User(
        email="chw_fatima@haihuwalafiya.org",
        password_hash=get_password_hash("pass1234"),
        full_name="Fatima Aliyu",
        role="chw",
        is_active=True,
        lga_id=lga.id,
        ward_id=ward.id,
    )
    db_session.add(chw_user)
    await db_session.commit()

    token = create_access_token({"sub": str(chw_user.id), "email": chw_user.email, "role": chw_user.role})
    headers = {"Authorization": f"Bearer {token}"}

    # Register Mother
    reg_payload = {
        "first_name": "Hadiza",
        "last_name": "Bello",
        "phone": "08012345678",
        "age_at_registration": 24,
        "lga_id": str(lga.id),
        "ward_id": str(ward.id),
        "consent": {
            "consent_type": "programme_enrollment",
            "granted": True,
            "granted_date": "2026-10-14",
            "witness_name": "Fatima Aliyu",
        },
    }

    res = await client.post("/api/v1/mothers", json=reg_payload, headers=headers)
    assert res.status_code == 201
    mother_data = res.json()
    assert mother_data["first_name"] == "Hadiza"
    assert mother_data["mother_id"].startswith("HL-NAS-")

    # Duplicate check detection
    dup_res = await client.post(
        "/api/v1/mothers/check-duplicates",
        json={"first_name": "hadiza", "last_name": "bello", "phone": "08012345678"},
        headers=headers,
    )
    assert dup_res.status_code == 200
    dup_data = dup_res.json()
    assert dup_data["potential_duplicates_found"] is True
    assert dup_data["count"] >= 1

    # Attempting to register another mother with the exact same phone returns 409 Conflict
    dup_reg = await client.post("/api/v1/mothers", json=reg_payload, headers=headers)
    assert dup_reg.status_code == 409
