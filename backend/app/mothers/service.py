"""Mother business service: registration, deduplication, and ID generation."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.common.pagination import paginate
from app.common.schemas import PaginatedResponse, PaginationParams
from app.exceptions import DuplicateError, NotFoundError
from app.models import LGA, Mother, MotherConsent
from app.mothers.schemas import DeduplicationCheckRequest, MotherCreate, MotherResponse, MotherUpdate


class MotherService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def generate_mother_id(self, lga_id: uuid.UUID) -> str:
        """Generate unique ID: HL-{LGA_CODE}-{SEQUENCE_6_DIGITS}."""
        lga_result = await self.db.execute(select(LGA).where(LGA.id == lga_id))
        lga = lga_result.scalar_one_or_none()
        lga_code = lga.code if lga else "GEN"

        # Count existing mothers in this LGA to get the sequence number
        count_res = await self.db.execute(
            select(func.count(Mother.id)).where(Mother.lga_id == lga_id)
        )
        seq = count_res.scalar_one() + 1
        return f"HL-{lga_code.upper()}-{seq:06d}"

    async def check_duplicates(self, data: DeduplicationCheckRequest) -> list[Mother]:
        """Find potential duplicates matching names, phone, or DOB."""
        conditions = []
        # Name match
        name_cond = func.lower(Mother.first_name) == func.lower(data.first_name.strip())
        name_cond_last = func.lower(Mother.last_name) == func.lower(data.last_name.strip())
        conditions.append(name_cond & name_cond_last)

        if data.phone and len(data.phone.strip()) > 5:
            conditions.append(Mother.phone == data.phone.strip())

        query = select(Mother).where(or_(*conditions)).limit(10)
        res = await self.db.execute(query)
        return list(res.scalars().all())

    async def create_mother(self, data: MotherCreate, current_user: User) -> Mother:
        # Check if phone already registered
        if data.phone:
            existing = await self.db.execute(select(Mother).where(Mother.phone == data.phone))
            if existing.scalar_one_or_none():
                raise DuplicateError(f"A mother with phone number '{data.phone}' is already registered")

        mother_id_code = await self.generate_mother_id(data.lga_id)

        mother = Mother(
            mother_id=mother_id_code,
            first_name=data.first_name.strip(),
            last_name=data.last_name.strip(),
            other_names=data.other_names.strip() if data.other_names else None,
            date_of_birth=data.date_of_birth,
            age_at_registration=data.age_at_registration,
            phone=data.phone.strip() if data.phone else None,
            alternate_phone=data.alternate_phone.strip() if data.alternate_phone else None,
            marital_status=data.marital_status,
            education_level=data.education_level,
            occupation=data.occupation,
            lga_id=data.lga_id,
            ward_id=data.ward_id,
            community_id=data.community_id,
            address=data.address,
            facility_id=data.facility_id or current_user.facility_id,
            registered_by_id=current_user.id,
        )
        self.db.add(mother)
        await self.db.flush()

        if data.consent:
            consent = MotherConsent(
                mother_id=mother.id,
                consent_type=data.consent.consent_type,
                granted=data.consent.granted,
                granted_date=data.consent.granted_date,
                witness_name=data.consent.witness_name,
            )
            self.db.add(consent)

        await self.db.commit()
        await self.db.refresh(mother)
        return mother

    async def get_mother_by_id(self, mother_uuid: uuid.UUID) -> Mother:
        res = await self.db.execute(select(Mother).where(Mother.id == mother_uuid))
        mother = res.scalar_one_or_none()
        if not mother:
            raise NotFoundError("Mother", str(mother_uuid))
        return mother

    async def list_mothers(
        self,
        params: PaginationParams,
        *,
        search: str | None = None,
        ward_id: uuid.UUID | None = None,
        lga_id: uuid.UUID | None = None,
    ) -> PaginatedResponse[MotherResponse]:
        query = select(Mother).where(Mother.is_active.is_(True)).order_by(Mother.created_at.desc())

        if search:
            search_pattern = f"%{search}%"
            query = query.where(
                or_(
                    Mother.first_name.ilike(search_pattern),
                    Mother.last_name.ilike(search_pattern),
                    Mother.mother_id.ilike(search_pattern),
                    Mother.phone.ilike(search_pattern),
                )
            )

        if ward_id:
            query = query.where(Mother.ward_id == ward_id)
        if lga_id:
            query = query.where(Mother.lga_id == lga_id)

        return await paginate(self.db, query, params, response_model=MotherResponse)
