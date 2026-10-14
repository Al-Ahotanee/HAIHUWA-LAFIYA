"""Clinical assessment models: ClinicalAssessment, DangerSign, LabResult."""

from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import (
    Date,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.common.utils import generate_uuid, utcnow
from app.database import Base


class ClinicalAssessment(Base):
    """Clinical observations recorded during a visit."""

    __tablename__ = "clinical_assessments"
    __table_args__ = (
        Index("ix_assessments_appointment_id", "appointment_id"),
        Index("ix_assessments_pregnancy_id", "pregnancy_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=generate_uuid
    )
    appointment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("appointments.id", ondelete="RESTRICT"), nullable=False
    )
    pregnancy_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("pregnancies.id", ondelete="RESTRICT"), nullable=False
    )
    assessment_date: Mapped[date] = mapped_column(Date, nullable=False)

    # Vital signs
    systolic_bp: Mapped[int | None] = mapped_column(Integer)
    diastolic_bp: Mapped[int | None] = mapped_column(Integer)
    weight_kg: Mapped[float | None] = mapped_column(Numeric(5, 2))
    height_cm: Mapped[float | None] = mapped_column(Numeric(5, 1))
    muac_cm: Mapped[float | None] = mapped_column(Numeric(4, 1))
    temperature_c: Mapped[float | None] = mapped_column(Numeric(4, 1))

    # Obstetric
    fundal_height_cm: Mapped[float | None] = mapped_column(Numeric(4, 1))
    fetal_heart_rate: Mapped[int | None] = mapped_column(Integer)
    fetal_presentation: Mapped[str | None] = mapped_column(String(30))
    gestational_age_weeks: Mapped[int | None] = mapped_column(Integer)

    # Interventions
    iron_folate_given: Mapped[bool | None] = mapped_column()
    itn_given: Mapped[bool | None] = mapped_column(comment="Insecticide-treated net")
    ipt_given: Mapped[bool | None] = mapped_column(comment="IPT for malaria")
    tetanus_dose: Mapped[int | None] = mapped_column(Integer)
    deworming_given: Mapped[bool | None] = mapped_column()

    # Clinical notes
    clinical_notes: Mapped[str | None] = mapped_column(Text)
    assessed_by_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )

    # Relationships
    appointment: Mapped["Appointment"] = relationship(back_populates="assessment")  # noqa: F821
    danger_signs: Mapped[list[DangerSign]] = relationship(
        back_populates="assessment", cascade="all, delete-orphan"
    )
    lab_results: Mapped[list[LabResult]] = relationship(
        back_populates="assessment", cascade="all, delete-orphan"
    )


class DangerSign(Base):
    """Documented danger sign during an assessment."""

    __tablename__ = "danger_signs"
    __table_args__ = (
        Index("ix_danger_signs_assessment_id", "assessment_id"),
        Index("ix_danger_signs_severity", "severity"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=generate_uuid
    )
    assessment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clinical_assessments.id", ondelete="CASCADE"),
        nullable=False,
    )
    sign_name: Mapped[str] = mapped_column(String(100), nullable=False)
    severity: Mapped[str] = mapped_column(
        String(20), nullable=False, comment="warning | danger | emergency"
    )
    description: Mapped[str | None] = mapped_column(Text)
    action_taken: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )

    assessment: Mapped[ClinicalAssessment] = relationship(back_populates="danger_signs")


class LabResult(Base):
    """Laboratory test result recorded during an assessment."""

    __tablename__ = "lab_results"
    __table_args__ = (
        Index("ix_lab_results_assessment_id", "assessment_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=generate_uuid
    )
    assessment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clinical_assessments.id", ondelete="CASCADE"),
        nullable=False,
    )
    test_name: Mapped[str] = mapped_column(
        String(50), nullable=False,
        comment="hiv | hepatitis_b | syphilis | blood_group | haemoglobin | urinalysis | malaria"
    )
    result: Mapped[str] = mapped_column(String(100), nullable=False)
    result_value: Mapped[float | None] = mapped_column(Float)
    unit: Mapped[str | None] = mapped_column(String(20))
    is_abnormal: Mapped[bool | None] = mapped_column()
    test_date: Mapped[date] = mapped_column(Date, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )

    assessment: Mapped[ClinicalAssessment] = relationship(back_populates="lab_results")
