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

        # 2. States & LGAs across Northern Nigeria
        states_data = [
            {"name": "Kano", "code": "KAN", "lgas": [("Nasarawa", "NAS"), ("Dala", "DAL")]},
            {"name": "Kaduna", "code": "KAD", "lgas": [("Kaduna North", "KDN"), ("Zaria", "ZAR")]},
            {"name": "Katsina", "code": "KAT", "lgas": [("Katsina", "KTS"), ("Daura", "DAU")]},
            {"name": "Sokoto", "code": "SOK", "lgas": [("Sokoto North", "SKN"), ("Wamako", "WAM")]},
            {"name": "Jigawa", "code": "JIG", "lgas": [("Dutse", "DUT"), ("Hadejia", "HAD")]},
            {"name": "Bauchi", "code": "BAU", "lgas": [("Bauchi", "BCH"), ("Katagum", "KTG")]},
        ]

        nasarawa_lga = None
        for s_item in states_data:
            s_res = await session.execute(select(State).where(State.code == s_item["code"]))
            curr_state = s_res.scalar_one_or_none()
            if not curr_state:
                curr_state = State(name=s_item["name"], code=s_item["code"])
                session.add(curr_state)
                await session.flush()

            for lga_name, lga_code in s_item["lgas"]:
                l_res = await session.execute(select(LGA).where(LGA.code == lga_code))
                curr_lga = l_res.scalar_one_or_none()
                if not curr_lga:
                    curr_lga = LGA(state_id=curr_state.id, name=lga_name, code=lga_code)
                    session.add(curr_lga)
                    await session.flush()
                if lga_code == "NAS":
                    nasarawa_lga = curr_lga


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

        # 7. Seed Sample Clinical Records if not already present
        from app.models import Mother, Pregnancy, Appointment, ClinicalAssessment, Referral, IncentiveClaim, Delivery, Newborn
        from app.common.enums import PregnancyStatus, AppointmentStatus, ReferralStatus, ClaimStatus
        from datetime import date, time, timedelta

        # Ensure health facilities and locations are reliably fetched
        phc = (await session.execute(select(HealthFacility).where(HealthFacility.code == "PHC-GWG"))).scalars().first()
        gh = (await session.execute(select(HealthFacility).where(HealthFacility.code == "SSH-KAN"))).scalars().first()
        nasarawa_lga = (await session.execute(select(LGA).where(LGA.code == "NAS"))).scalars().first()
        ward1 = (await session.execute(select(Ward).where(Ward.code == "GWG"))).scalars().first()

        if not nasarawa_lga:
            nasarawa_lga = (await session.execute(select(LGA))).scalars().first()
        if not ward1:
            ward1 = (await session.execute(select(Ward))).scalars().first()
        if not phc:
            phc = (await session.execute(select(HealthFacility))).scalars().first()


        m_res = await session.execute(select(Mother))
        existing_mothers = m_res.scalars().all()
        if not existing_mothers:
            print("Seeding initial clinical mothers, pregnancies, and routine care encounters...")
            midwife_user = (await session.execute(select(User).where(User.role == "midwife"))).scalars().first()
            creator_id = midwife_user.id if midwife_user else user.id
            rule = (await session.execute(select(IncentiveRule))).scalars().first()

            sample_mothers = [
                ("Aisha", "Garba", "08023456701", 24, False, "HL-KAN-000001"),
                ("Hauwa", "Mohammed", "08023456702", 28, True, "HL-KAN-000002"),
                ("Zubaida", "Suleiman", "08023456703", 21, False, "HL-KAN-000003"),
                ("Maryam", "Abubakar", "08023456704", 32, True, "HL-KAN-000004"),
                ("Khadija", "Usman", "08023456705", 19, False, "HL-KAN-000005"),
            ]

            for first, last, ph, age, high_risk, m_id in sample_mothers:
                m = Mother(
                    mother_id=m_id,
                    first_name=first,
                    last_name=last,
                    phone=ph,
                    age_at_registration=age,
                    marital_status="married",
                    education_level="secondary",
                    occupation="trader",
                    lga_id=nasarawa_lga.id,
                    ward_id=ward1.id,
                    facility_id=phc.id if phc else None,
                    registered_by_id=creator_id,
                    is_active=True,
                )
                session.add(m)
                await session.flush()

                lmp = date.today() - timedelta(days=140)
                edd = lmp + timedelta(days=280)
                preg = Pregnancy(
                    mother_id=m.id,
                    gravida=2,
                    parity=1,
                    lmp_date=lmp,
                    estimated_due_date=edd,
                    gestational_age_at_registration=12,
                    status=PregnancyStatus.ACTIVE.value,
                    is_high_risk=high_risk,
                    high_risk_reasons="Hypertension history" if high_risk else None,
                    facility_id=phc.id if phc else None,
                    registered_by_id=creator_id,
                )
                session.add(preg)
                await session.flush()

                apt = Appointment(
                    pregnancy_id=preg.id,
                    facility_id=phc.id if phc else None,
                    visit_type="anc",
                    scheduled_date=date.today() + timedelta(days=7),
                    status=AppointmentStatus.SCHEDULED.value,
                    created_by_id=creator_id,
                )
                session.add(apt)
                await session.flush()

                assess = ClinicalAssessment(
                    appointment_id=apt.id,
                    pregnancy_id=preg.id,
                    assessment_date=date.today(),
                    assessed_by_id=creator_id,
                    gestational_age_weeks=20,
                    systolic_bp=145 if high_risk else 115,
                    diastolic_bp=95 if high_risk else 75,
                    weight_kg=64.5,
                    fundal_height_cm=20,
                    fetal_heart_rate=142,
                    clinical_notes="Patient counselled on nutrition, iron supplements and emergency danger signs.",
                )
                session.add(assess)

                if high_risk and gh and phc:
                    ref = Referral(
                        pregnancy_id=preg.id,
                        referring_facility_id=phc.id,
                        receiving_facility_id=gh.id,
                        initiated_by_id=creator_id,
                        reason="Pre-eclampsia emergency escalation",
                        clinical_findings="Persistent elevated BP (145/95 mmHg) with visual disturbances",
                        urgency="emergency",
                        status=ReferralStatus.IN_TRANSIT.value,
                    )
                    session.add(ref)

                if rule:
                    claim = IncentiveClaim(
                        mother_id=m.id,
                        rule_id=rule.id,
                        pregnancy_id=preg.id,
                        claim_reference=f"CLM-{m_id}",
                        amount=rule.amount,
                        status=ClaimStatus.PENDING.value,
                        submitted_by_id=creator_id,
                    )
                    session.add(claim)

            # 8. Seed one completed facility delivery and newborn
            if phc:
                delivered_mother = Mother(
                    mother_id="HL-KAN-000006",
                    first_name="Fatima",
                    last_name="Aliyu",
                    phone="08023456706",
                    age_at_registration=26,
                    marital_status="married",
                    education_level="tertiary",
                    occupation="teacher",
                    lga_id=nasarawa_lga.id,
                    ward_id=ward1.id,
                    facility_id=phc.id,
                    registered_by_id=creator_id,
                    is_active=True,
                )
                session.add(delivered_mother)
                await session.flush()

                deliv_lmp = date.today() - timedelta(days=285)
                deliv_preg = Pregnancy(
                    mother_id=delivered_mother.id,
                    gravida=1,
                    parity=0,
                    lmp_date=deliv_lmp,
                    estimated_due_date=deliv_lmp + timedelta(days=280),
                    gestational_age_at_registration=8,
                    status=PregnancyStatus.DELIVERED.value,
                    is_high_risk=False,
                    facility_id=phc.id,
                    registered_by_id=creator_id,
                    outcome_date=date.today() - timedelta(days=2),
                )
                session.add(deliv_preg)
                await session.flush()

                deliv = Delivery(
                    pregnancy_id=deliv_preg.id,
                    facility_id=phc.id,
                    delivery_date=date.today() - timedelta(days=2),
                    delivery_time="14:30",
                    delivery_mode="spontaneous_vaginal",
                    place_of_delivery="facility",
                    maternal_outcome="alive_well",
                    number_of_babies=1,
                    blood_loss_ml=250,
                    postpartum_haemorrhage=False,
                    attended_by_name="Nurse Fatima Bello",
                    attended_by_cadre="nurse_midwife",
                    recorded_by_id=creator_id,
                    notes="Normal spontaneous vaginal delivery without complications.",
                )
                session.add(deliv)
                await session.flush()

                nb = Newborn(
                    newborn_id="HL-KAN-000006-B1",
                    delivery_id=deliv.id,
                    mother_id=delivered_mother.id,
                    birth_order=1,
                    first_name="Ibrahim",
                    sex="male",
                    birth_weight_grams=3200,
                    length_cm=50.0,
                    head_circumference_cm=35.0,
                    apgar_1min=8,
                    apgar_5min=9,
                    apgar_10min=10,
                    resuscitation_performed=False,
                )
                session.add(nb)

            await session.commit()
            print("Clinical test records, deliveries, and newborns created successfully!")

        print("\n=== All reference data, clinical records, and user credentials seeded successfully! ===")
        print(f"Default password for all accounts: {COMMON_PASSWORD}\n")


if __name__ == "__main__":
    asyncio.run(seed_reference_data())
