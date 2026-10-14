"""Clinical Assessment validation schemas."""

from __future__ import annotations

import uuid
from datetime import date, datetime
from pydantic import BaseModel, Field


class DangerSignCreate(BaseModel):
    sign_name: str
    severity: str = Field(default="warning", description="warning | danger | emergency")
    description: str | None = None
    action_taken: str | None = None


class DangerSignResponse(BaseModel):
    id: uuid.UUID
    sign_name: str
    severity: str
    description: str | None = None
    action_taken: str | None = None

    class Config:
        from_attributes = True


class LabResultCreate(BaseModel):
    test_name: str = Field(..., description="hiv | hepatitis_b | syphilis | blood_group | haemoglobin | urinalysis | malaria")
    result: str
    result_value: float | None = None
    unit: str | None = None
    is_abnormal: bool | None = None
    test_date: date = Field(default_factory=date.today)
    notes: str | None = None


class LabResultResponse(BaseModel):
    id: uuid.UUID
    test_name: str
    result: str
    result_value: float | None = None
    unit: str | None = None
    is_abnormal: bool | None = None
    test_date: date
    notes: str | None = None

    class Config:
        from_attributes = True


class ClinicalAssessmentCreate(BaseModel):
    appointment_id: uuid.UUID
    pregnancy_id: uuid.UUID
    assessment_date: date = Field(default_factory=date.today)

    # Vitals
    systolic_bp: int | None = Field(None, ge=50, le=300)
    diastolic_bp: int | None = Field(None, ge=30, le=200)
    weight_kg: float | None = Field(None, ge=20.0, le=250.0)
    height_cm: float | None = Field(None, ge=80.0, le=250.0)
    muac_cm: float | None = Field(None, ge=10.0, le=60.0)
    temperature_c: float | None = Field(None, ge=30.0, le=45.0)

    # Obstetric
    fundal_height_cm: float | None = Field(None, ge=5.0, le=60.0)
    fetal_heart_rate: int | None = Field(None, ge=60, le=240)
    fetal_presentation: str | None = None
    gestational_age_weeks: int | None = Field(None, ge=4, le=44)

    # Routine Interventions
    iron_folate_given: bool | None = None
    itn_given: bool | None = None
    ipt_given: bool | None = None
    tetanus_dose: int | None = None
    deworming_given: bool | None = None

    clinical_notes: str | None = None
    danger_signs: list[DangerSignCreate] = []
    lab_results: list[LabResultCreate] = []


class ClinicalAssessmentResponse(BaseModel):
    id: uuid.UUID
    appointment_id: uuid.UUID
    pregnancy_id: uuid.UUID
    assessment_date: date
    systolic_bp: int | None = None
    diastolic_bp: int | None = None
    weight_kg: float | None = None
    muac_cm: float | None = None
    temperature_c: float | None = None
    fundal_height_cm: float | None = None
    fetal_heart_rate: int | None = None
    fetal_presentation: str | None = None
    gestational_age_weeks: int | None = None
    iron_folate_given: bool | None = None
    itn_given: bool | None = None
    ipt_given: bool | None = None
    clinical_notes: str | None = None
    danger_signs: list[DangerSignResponse] = []
    lab_results: list[LabResultResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True
