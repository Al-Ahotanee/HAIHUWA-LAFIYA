"""Clinical assessment business service with MEOWS obstetric scoring and risk triage."""

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


def calculate_meows(
    systolic_bp: int | None,
    diastolic_bp: int | None,
    temp_c: float | None,
    fhr: int | None,
    has_danger_signs: bool,
) -> tuple[int, str]:
    """
    Compute Modified Early Obstetric Warning Score (MEOWS):
    Score: 0 (Normal), 1-2 (Observation / Amber), >=3 (Critical Alert / Red).
    """
    score = 0
    # Systolic BP
    if systolic_bp:
        if systolic_bp >= 160 or systolic_bp <= 90:
            score += 3
        elif systolic_bp >= 140:
            score += 2
        elif systolic_bp >= 130:
            score += 1

    # Diastolic BP
    if diastolic_bp:
        if diastolic_bp >= 110 or diastolic_bp <= 50:
            score += 3
        elif diastolic_bp >= 90:
            score += 2
        elif diastolic_bp >= 80:
            score += 1

    # Temperature
    if temp_c:
        if temp_c >= 38.5 or temp_c <= 35.0:
            score += 3
        elif temp_c >= 37.8 or temp_c <= 35.9:
            score += 2

    # Fetal Heart Rate
    if fhr:
        if fhr < 110 or fhr > 160:
            score += 2

    # Any danger signs add immediate critical weighting
    if has_danger_signs:
        score += 3

    if score >= 3:
        status_flag = "emergency_escalation"
    elif score >= 1:
        status_flag = "observation_required"
    else:
        status_flag = "routine_normal"

    return score, status_flag


class ClinicalAssessmentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def record_assessment(
        self,
        data: ClinicalAssessmentCreate,
        current_user: User,
    ) -> ClinicalAssessment:
        preg_res = await self.db.execute(select(Pregnancy).where(Pregnancy.id == data.pregnancy_id))
        pregnancy = preg_res.scalar_one_or_none()
        if not pregnancy:
            raise NotFoundError("Pregnancy", str(data.pregnancy_id))

        has_danger_signs = len(data.danger_signs) > 0
        meows_score, triage_status = calculate_meows(
            data.systolic_bp,
            data.diastolic_bp,
            data.temperature_c,
            data.fetal_heart_rate,
            has_danger_signs,
        )

        # Append MEOWS scoring to clinical notes automatically
        meows_note = f"[MEOWS Obstetric Triage: Score {meows_score} -> Tier: {triage_status.upper().replace('_', ' ')}]"
        notes = f"{meows_note} {data.clinical_notes or ''}".strip()

        # If MEOWS >= 3, automatically elevate pregnancy to high risk
        if meows_score >= 3 and not pregnancy.is_high_risk:
            pregnancy.is_high_risk = True
            pregnancy.high_risk_reasons = f"MEOWS Alert (Score: {meows_score}): Hypertensive/Febrile risk detected during assessment."

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
            clinical_notes=notes,
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
