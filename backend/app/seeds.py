"""Seed reference data: Nigerian states, sample LGAs, and default admin user."""

from __future__ import annotations

import asyncio
from app.auth.models import User
from app.auth.security import get_password_hash
from app.database import AsyncSessionLocal
from app.models import HealthFacility, LGA, Organisation, State, Ward
from sqlalchemy import select


async def seed_reference_data():
    async with AsyncSessionLocal() as session:
        # Check if already seeded
        res = await session.execute(select(Organisation))
        if res.scalars().first():
            print("Reference data already seeded.")
            return

        print("Seeding reference data...")

        # 1. Organisation
        org = Organisation(
            name="Haihuwa Lafiya 360 Motherhood Initiative",
            code="HL-360",
            description="Maternal and Newborn Health Programme in Northern Nigeria",
            is_active=True,
        )
        session.add(org)
        await session.flush()

        # 2. State & LGAs
        kano = State(name="Kano", code="KAN")
        session.add(kano)
        await session.flush()

        nasarawa_lga = LGA(state_id=kano.id, name="Nasarawa", code="NAS")
        dala_lga = LGA(state_id=kano.id, name="Dala", code="DAL")
        session.add_all([nasarawa_lga, dala_lga])
        await session.flush()

        # 3. Wards
        ward1 = Ward(lga_id=nasarawa_lga.id, name="Gwagwarwa", code="GWG")
        ward2 = Ward(lga_id=nasarawa_lga.id, name="Dakata", code="DAK")
        session.add_all([ward1, ward2])
        await session.flush()

        # 4. Facilities
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

        # 5. Default Super Admin
        admin = User(
            email="admin@haihuwalafiya.org",
            password_hash=get_password_hash("dev-admin-2024!"),
            full_name="Haihuwa Platform Administrator",
            role="super_admin",
            is_active=True,
            organisation_id=org.id,
        )
        session.add(admin)

        await session.commit()
        print("Reference data successfully seeded! Admin: admin@haihuwalafiya.org")


if __name__ == "__main__":
    asyncio.run(seed_reference_data())
