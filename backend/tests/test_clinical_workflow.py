"""Integration tests for pregnancy registration, attendance and delivery recording."""

from datetime import date, timedelta
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.auth.security import create_access_token, get_password_hash
from app.models import HealthFacility, LGA, Mother, State, Ward


@pytest.mark.asyncio
async def test_pregnancy_delivery_workflow(client: AsyncClient, db_session: AsyncSession):
    # Setup Geography
    state = State(name="Katsina", code="KT")
    db_session.add(state)
    await db_session.flush()

    lga = LGA(state_id=state.id, name="Funtua", code="FUN")
    db_session.add(lga)
    await db_session.flush()

    facility = HealthFacility(
        lga_id=lga.id,
        name="Funtua General Hospital",
        code="GH-FUN",
        facility_type="general_hospital",
        is_active=True,
    )
    db_session.add(facility)

    midwife = User(
        email="midwife_maryam@haihuwalafiya.org",
        password_hash=get_password_hash("pass1234"),
        full_name="Maryam Kabir",
        role="midwife",
        is_active=True,
        facility_id=facility.id,
    )
    db_session.add(midwife)
    await db_session.flush()

    mother = Mother(
        mother_id="HL-FUN-000001",
        first_name="Zainab",
        last_name="Umar",
        lga_id=lga.id,
        ward_id=lga.id,
        registered_by_id=midwife.id,
        facility_id=facility.id,
        is_active=True,
    )
    db_session.add(mother)
    await db_session.commit()

    token = create_access_token({"sub": str(midwife.id), "email": midwife.email, "role": midwife.role})
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Register Pregnancy
    lmp = date.today() - timedelta(days=70)
    preg_payload = {
        "mother_id": str(mother.id),
        "lmp_date": lmp.isoformat(),
        "gravida": 2,
        "parity": 1,
        "is_high_risk": False,
    }
    preg_res = await client.post("/api/v1/pregnancies", json=preg_payload, headers=headers)
    assert preg_res.status_code == 201
    preg_data = preg_res.json()
    assert preg_data["status"] == "active"
    assert preg_data["estimated_due_date"] == (lmp + timedelta(days=280)).isoformat()

    # 2. Cannot register another active pregnancy for the same mother
    dup_preg = await client.post("/api/v1/pregnancies", json=preg_payload, headers=headers)
    assert dup_preg.status_code == 400

    # 3. Schedule Appointment
    appt_payload = {
        "pregnancy_id": preg_data["id"],
        "visit_type": "anc",
        "scheduled_date": (date.today() + timedelta(days=14)).isoformat(),
        "notes": "ANC 1 Contact",
    }
    appt_res = await client.post("/api/v1/appointments", json=appt_payload, headers=headers)
    assert appt_res.status_code == 201
    appt_data = appt_res.json()
    assert appt_data["status"] == "scheduled"

    # 4. Record Delivery (Twins) and newborn creation
    deliv_payload = {
        "pregnancy_id": preg_data["id"],
        "facility_id": str(facility.id),
        "delivery_date": date.today().isoformat(),
        "delivery_mode": "vaginal",
        "place_of_delivery": "facility",
        "maternal_outcome": "alive",
        "number_of_babies": 2,
        "newborns": [
            {
                "birth_order": 1,
                "first_name": "Hassan",
                "sex": "male",
                "birth_weight_grams": 2700,
                "apgar_1min": 8,
                "apgar_5min": 9,
            },
            {
                "birth_order": 2,
                "first_name": "Hussaina",
                "sex": "female",
                "birth_weight_grams": 2500,
                "apgar_1min": 7,
                "apgar_5min": 9,
            },
        ],
    }
    deliv_res = await client.post("/api/v1/deliveries", json=deliv_payload, headers=headers)
    assert deliv_res.status_code == 201
    deliv_data = deliv_res.json()
    assert len(deliv_data["newborns"]) == 2
    assert deliv_data["newborns"][0]["newborn_id"] == "HL-FUN-000001-B1"
    assert deliv_data["newborns"][1]["newborn_id"] == "HL-FUN-000001-B2"

    # 5. Verify Pregnancy is marked Delivered
    updated_preg = await client.get(f"/api/v1/pregnancies/{preg_data['id']}", headers=headers)
    assert updated_preg.json()["status"] == "delivered"
