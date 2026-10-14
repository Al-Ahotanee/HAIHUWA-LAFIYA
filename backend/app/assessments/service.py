"""Clinical assessment business service."""

from __future__ import annotations

import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.assessments.schemas import ClinicalAssessmentCreate, ClinicalAssessmentResponse
from app.auth.models import User
from app.common.pagination import paginate
from app.common.schemas import PaginatedResponse, PaginationParams
from app.exceptions import NotFoundError
from app.models import ClinicalAssessment, DangerSign, LabResult, Pregnancy


class ClinicalAssessmentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def record_assessment(
        self,
        data: ClinicalAssessmentCreate,
        current_user: User,
    ) -> ClinicalAssessment:
        preg_res = await self.db.execute(select(Pregnancy).where(Pregnancy.id == data.pregnancy_id))
        if not preg_res.scalar_one_or_none():
            raise NotFoundError("Pregnancy", str(data.pregnancy_id))

        assessment = ClinicalAssessment(
            appointment_id=data.appointment_id,
            pregnancy_id=data.pregnancy_id,
            assessment_date=data.assessment_date,
            systolic_bp=data.systolic_bp,
            diastolic_bp=data.diastolic_bp,
            weight_kg=data.weight_kg,
            height_cm=data.height_cm,
            muac_cm=data.muac_cm,
            temperature_c=data.temperature_c,
            fundal_height_cm=data.fundal_height_cm,
            fetal_heart_rate=data.fetal_heart_rate,
            fetal_presentation=data.fetal_presentation,
            gestational_age_weeks=data.gestational_age_weeks,
            iron_folate_given=data.iron_folate_given,
            itn_given=data.itn_given,
            ipt_given=data.ipt_given,
            tetanus_dose=data.tetanus_dose,
            deworming_given=data.deworming_given,
            clinical_notes=data.clinical_notes,
            assessed_by_id=current_user.id,
        )
        self.db.add(assessment)
        await self.db.flush()

        for ds in data.danger_signs:
            sign = DangerSign(
                assessment_id=assessment.id,
                sign_name=ds.sign_name,
                severity=ds.severity,
                description=ds.description,
                action_taken=ds.action_taken,
            )
            self.db.add(sign)

        for lr in data.lab_results:
            result = LabResult(
                assessment_id=assessment.id,
                test_name=lr.test_name,
                result=lr.result,
                result_value=lr.result_value,
                unit=lr.unit,
                is_abnormal=lr.is_abnormal,
                test_date=lr.test_date,
                notes=lr.notes,
            )
            self.db.add(result)

        await self.db.commit()

        # Reload with relationships
        query = (
            select(ClinicalAssessment)
            .options(
                selectinload(ClinicalAssessment.danger_signs),
                selectinload(ClinicalAssessment.lab_results),
            )
            .where(ClinicalAssessment.id == assessment.id)
        )
        final_res = await self.db.execute(query)
        return final_res.scalar_one()

    async def list_by_pregnancy(self, pregnancy_id: uuid.UUID) -> list[ClinicalAssessment]:
        query = (
            select(ClinicalAssessment)
            .options(
                selectinload(ClinicalAssessment.danger_signs),
                selectinload(ClinicalAssessment.lab_results),
            )
            .where(ClinicalAssessment.pregnancy_id == pregnancy_id)
            .order_by(ClinicalAssessment.assessment_date.desc())
        )
        res = await self.db.execute(query)
        return list(res.scalars().all())

    async def list_all_assessments(
        self,
        params: PaginationParams,
    ) -> PaginatedResponse[ClinicalAssessmentResponse]:
        query = (
            select(ClinicalAssessment)
            .options(
                selectinload(ClinicalAssessment.danger_signs),
                selectinload(ClinicalAssessment.lab_results),
            )
            .order_by(ClinicalAssessment.assessment_date.desc())
        )
        return await paginate(self.db, query, params, response_model=ClinicalAssessmentResponse)

