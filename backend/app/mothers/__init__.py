"""Mother models: Mother, MotherConsent."""

from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.common.utils import generate_uuid, utcnow
from app.database import Base


class Mother(Base):
    """Registered mother in the programme."""

    __tablename__ = "mothers"
    __table_args__ = (
        Index("ix_mothers_phone", "phone"),
        Index("ix_mothers_mother_id", "mother_id"),
        Index("ix_mothers_ward_id", "ward_id"),
        Index("ix_mothers_community_id", "community_id"),
        Index("ix_mothers_dedup", "first_name", "last_name", "phone", "date_of_birth"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=generate_uuid
    )
    mother_id: Mapped[str] = mapped_column(
        String(30), nullable=False, unique=True, comment="Programme ID e.g. HL-KAN-000001"
    )

    # Demographics
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    other_names: Mapped[str | None] = mapped_column(String(100))
    date_of_birth: Mapped[date | None] = mapped_column(Date)
    age_at_registration: Mapped[int | None] = mapped_column(Integer)
    phone: Mapped[str | None] = mapped_column(String(20))
    alternate_phone: Mapped[str | None] = mapped_column(String(20))
    marital_status: Mapped[str | None] = mapped_column(String(20))
    education_level: Mapped[str | None] = mapped_column(String(50))
    occupation: Mapped[str | None] = mapped_column(String(100))

    # Location
    lga_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("lgas.id", ondelete="RESTRICT"), nullable=False
    )
    ward_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("wards.id", ondelete="RESTRICT"), nullable=False
    )
    community_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("communities.id", ondelete="RESTRICT")
    )
    address: Mapped[str | None] = mapped_column(Text)

    # Registration
    registered_by_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    facility_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("health_facilities.id", ondelete="RESTRICT")
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )

    # Relationships
    consents: Mapped[list[MotherConsent]] = relationship(
        back_populates="mother", cascade="all, delete-orphan"
    )
    pregnancies: Mapped[list["Pregnancy"]] = relationship(  # noqa: F821
        back_populates="mother", order_by="desc(Pregnancy.created_at)"
    )


class MotherConsent(Base):
    """Consent record for a mother, with revocation support."""

    __tablename__ = "mother_consents"
    __table_args__ = (
        Index("ix_consents_mother_id", "mother_id"),
        UniqueConstraint("mother_id", "consent_type", name="uq_consents_mother_type"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=generate_uuid
    )
    mother_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("mothers.id", ondelete="RESTRICT"), nullable=False
    )
    consent_type: Mapped[str] = mapped_column(String(50), nullable=False)
    granted: Mapped[bool] = mapped_column(Boolean, nullable=False)
    granted_date: Mapped[date] = mapped_column(Date, nullable=False)
    witness_name: Mapped[str | None] = mapped_column(String(255))
    revoked_date: Mapped[date | None] = mapped_column(Date)
    revocation_reason: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )

    mother: Mapped[Mother] = relationship(back_populates="consents")
