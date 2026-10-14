"""Seed comprehensive reference data and demo role credentials into the database."""

from __future__ import annotations

import asyncio
from app.auth.models import User
from app.auth.security import get_password_hash
from app.database import AsyncSessionLocal, Base, engine
from app.models import HealthFacility, IncentiveProgramme, IncentiveRule, LGA, Organisation, State, Ward
from sqlalchemy import select

DEMO_USERS = [
    {
        "email": "admin@haihuwalafiya.org",
        "full_name": "Dr. Kabir Sani (Admin)",
        "role": "super_admin",
        "phone": "08031110001",
    },
    {
        "email": "manager@haihuwalafiya.org",
        "full_name": "Amina Dahiru (Programme Manager)",
        "role": "programme_manager",
        "phone": "08031110002",
    },
    {
        "email": "coordinator@haihuwalafiya.org",
        "full_name": "Ibrahim Bello (LGA Coordinator)",
        "role": "lga_coordinator",
        "phone": "08031110003",
    },
    {
        "email": "facility@haihuwalafiya.org",
        "full_name": "Hajiya Maryam Umar (Facility In-Charge)",
        "role": "facility_manager",
        "phone": "08031110004",
    },
    {
        "email": "midwife@haihuwalafiya.org",
        "full_name": "Nurse Zainab Aliyu (Senior Midwife)",
        "role": "midwife",
        "phone": "08031110005",
    },
    {
        "email": "chw@haihuwalafiya.org",
        "full_name": "Fatima Haruna (Community Health Worker)",
        "role": "chw",
        "phone": "08031110006",
    },
    {
        "email": "data@haihuwalafiya.org",
        "full_name": "Usman Garba (M&E Data Officer)",
        "role": "data_officer",
        "phone": "08031110007",
    },
    {
        "email": "finance@haihuwalafiya.org",
        "full_name": "Balarabe Shehu (Finance & Incentive Officer)",
        "role": "finance_officer",
        "phone": "08031110008",
    },
    {
        "email": "auditor@haihuwalafiya.org",
        "full_name": "Hafsat Mahmud (Clinical Auditor)",
        "role": "auditor",
        "phone": "08031110009",
    },
]

COMMON_PASSWORD = "Password123!"


async def seed_reference_data():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        print("Checking reference data...")

        # 1. Organisation
        res = await session.execute(select(Organisation).where(Organisation.code == "HL-360"))
        org = res.scalar_one_or_none()
        if not org:
            org = Organisation(
                name="Haihuwa Lafiya 360 Motherhood Initiative",
                code="HL-360",
                description="Maternal and Newborn Health Programme in Northern Nigeria",
                is_active=True,
            )
            session.add(org)
            await session.flush()

        # 2. State & LGAs
        st_res = await session.execute(select(State).where(State.code == "KAN"))
        kano = st_res.scalar_one_or_none()
        if not kano:
            kano = State(name="Kano", code="KAN")
            session.add(kano)
            await session.flush()

        lga_res = await session.execute(select(LGA).where(LGA.code == "NAS"))
        nasarawa_lga = lga_res.scalar_one_or_none()
        if not nasarawa_lga:
            nasarawa_lga = LGA(state_id=kano.id, name="Nasarawa", code="NAS")
            dala_lga = LGA(state_id=kano.id, name="Dala", code="DAL")
            session.add_all([nasarawa_lga, dala_lga])
            await session.flush()

        # 3. Wards
        w_res = await session.execute(select(Ward).where(Ward.code == "GWG"))
        ward1 = w_res.scalar_one_or_none()
        if not ward1:
            ward1 = Ward(lga_id=nasarawa_lga.id, name="Gwagwarwa", code="GWG")
            ward2 = Ward(lga_id=nasarawa_lga.id, name="Dakata", code="DAK")
            session.add_all([ward1, ward2])
            await session.flush()

        # 4. Facilities
        fac_res = await session.execute(select(HealthFacility).where(HealthFacility.code == "PHC-GWG"))
        phc = fac_res.scalar_one_or_none()
        if not phc:
            phc = HealthFacility(
                lga_id=nasarawa_lga.id,
                name="Gwagwarwa Primary Healthcare Centre",
                code="PHC-GWG",
                facility_type="phc",
                is_active=True,
            )
            gh = HealthFacility(
                lga_id=nasarawa_lga.id,
                name="Sir Muhammadu Sanusi Specialist Hospital",
                code="SSH-KAN",
                facility_type="specialist_hospital",
                is_active=True,
            )
            session.add_all([phc, gh])
            await session.flush()

        # 5. Incentive Programme
        inc_res = await session.execute(select(IncentiveProgramme).where(IncentiveProgramme.code == "MAT-INC-2026"))
        if not inc_res.scalar_one_or_none():
            inc_prog = IncentiveProgramme(
                name="Safe Motherhood Attendance Incentive",
                code="MAT-INC-2026",
                description="Transport subsidy and nutrition incentive for completing 4 ANC contacts and facility delivery",
                incentive_type="cash",
                is_active=True,
            )
            session.add(inc_prog)
            await session.flush()

            rule1 = IncentiveRule(
                programme_id=inc_prog.id,
                trigger_event="anc_milestone_4",
                amount=5000.00,
                description="₦5,000 subsidy on completing 4th ANC contact",
                is_active=True,
            )
            rule2 = IncentiveRule(
                programme_id=inc_prog.id,
                trigger_event="facility_delivery",
                amount=10000.00,
                description="₦10,000 subsidy on skilled facility childbirth",
                is_active=True,
            )
            session.add_all([rule1, rule2])

        # 6. Seed all User Roles
        hashed_password = get_password_hash(COMMON_PASSWORD)
        for u in DEMO_USERS:
            existing = await session.execute(select(User).where(User.email == u["email"]))
            user = existing.scalar_one_or_none()
            if not user:
                user = User(
                    email=u["email"],
                    password_hash=hashed_password,
                    full_name=u["full_name"],
                    role=u["role"],
                    phone=u["phone"],
                    is_active=True,
                    organisation_id=org.id,
                    lga_id=nasarawa_lga.id,
                    ward_id=ward1.id,
                    facility_id=phc.id,
                )
                session.add(user)
                print(f"Created user: {u['email']} [{u['role']}]")
            else:
                user.password_hash = hashed_password
                user.is_active = True
                print(f"Updated user password: {u['email']}")

        await session.commit()
        print("\n=== All reference data and user credentials seeded successfully! ===")
        print(f"Default password for all accounts: {COMMON_PASSWORD}\n")


if __name__ == "__main__":
    asyncio.run(seed_reference_data())
