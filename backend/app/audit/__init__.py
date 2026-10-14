"""Health education, communication and audit models."""

from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import (
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.common.utils import generate_uuid, utcnow
from app.database import Base


class EducationSession(Base):
    """Community or facility health education session."""

    __tablename__ = "education_sessions"
    __table_args__ = (
        Index("ix_edu_sessions_date", "session_date"),
        Index("ix_edu_sessions_facility_id", "facility_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=generate_uuid
    )
    facility_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("health_facilities.id", ondelete="SET NULL")
    )
    ward_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("wards.id", ondelete="SET NULL")
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    topics_covered: Mapped[str] = mapped_column(Text, comment="ANC importance, Nutrition, Danger Signs, etc.")
    session_date: Mapped[date] = mapped_column(Date, nullable=False)
    attendees_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    conducted_by_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )


class CommunicationLog(Base):
    """Outreach and communication record (manual SMS/call/visit logs)."""

    __tablename__ = "communication_logs"
    __table_args__ = (
        Index("ix_comm_logs_mother_id", "mother_id"),
        Index("ix_comm_logs_type", "communication_type"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=generate_uuid
    )
    mother_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("mothers.id", ondelete="CASCADE"), nullable=False
    )
    communication_type: Mapped[str] = mapped_column(
        String(30), nullable=False, default="sms",
        comment="sms | phone_call | home_visit"
    )
    purpose: Mapped[str] = mapped_column(
        String(100), nullable=False, comment="appointment_reminder | overdue_followup | health_tip"
    )
    message_content: Mapped[str | None] = mapped_column(Text)
    delivery_status: Mapped[str] = mapped_column(
        String(30), default="sent", nullable=False,
        comment="sent | delivered | failed | logged_manually"
    )
    logged_by_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )


class AuditLog(Base):
    """Immutable audit trail for all sensitive system events."""

    __tablename__ = "audit_logs"
    __table_args__ = (
        Index("ix_audit_logs_user_id", "user_id"),
        Index("ix_audit_logs_action", "action"),
        Index("ix_audit_logs_resource", "resource_type", "resource_id"),
        Index("ix_audit_logs_created_at", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=generate_uuid
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL")
    )
    user_email: Mapped[str | None] = mapped_column(String(255))
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(100), nullable=False)
    resource_id: Mapped[str | None] = mapped_column(String(100))
    ip_address: Mapped[str | None] = mapped_column(String(45))
    details: Mapped[str | None] = mapped_column(Text, comment="JSON string or textual audit summary")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )
