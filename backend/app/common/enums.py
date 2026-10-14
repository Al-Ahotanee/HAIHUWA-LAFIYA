"""Shared enumerations for the Haihuwa Lafiya platform."""

from __future__ import annotations

import enum


class UserRole(str, enum.Enum):
    """Application user roles with ascending privilege."""

    CHW = "chw"
    MIDWIFE = "midwife"
    DATA_OFFICER = "data_officer"
    FINANCE_OFFICER = "finance_officer"
    FACILITY_MANAGER = "facility_manager"
    LGA_COORDINATOR = "lga_coordinator"
    PROGRAMME_MANAGER = "programme_manager"
    AUDITOR = "auditor"
    SUPER_ADMIN = "super_admin"


class PregnancyStatus(str, enum.Enum):
    ACTIVE = "active"
    DELIVERED = "delivered"
    LOSS = "loss"
    TERMINATED = "terminated"


class AppointmentStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    ATTENDED = "attended"
    MISSED = "missed"
    CANCELLED = "cancelled"
    RESCHEDULED = "rescheduled"


class ReferralStatus(str, enum.Enum):
    INITIATED = "initiated"
    ACCEPTED = "accepted"
    IN_TRANSIT = "in_transit"
    COMPLETED = "completed"
    DECLINED = "declined"
    EXPIRED = "expired"


class ReferralUrgency(str, enum.Enum):
    ROUTINE = "routine"
    URGENT = "urgent"
    EMERGENCY = "emergency"


class DeliveryMode(str, enum.Enum):
    VAGINAL = "vaginal"
    CAESAREAN = "caesarean"
    ASSISTED = "assisted"


class PregnancyOutcome(str, enum.Enum):
    LIVE_BIRTH = "live_birth"
    STILLBIRTH = "stillbirth"
    MISCARRIAGE = "miscarriage"
    MATERNAL_DEATH = "maternal_death"


class NewbornSex(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"
    AMBIGUOUS = "ambiguous"


class FacilityType(str, enum.Enum):
    PHC = "phc"
    GENERAL_HOSPITAL = "general_hospital"
    SPECIALIST_HOSPITAL = "specialist_hospital"
    PRIVATE_CLINIC = "private_clinic"


class ConsentType(str, enum.Enum):
    PROGRAMME_ENROLLMENT = "programme_enrollment"
    DATA_SHARING = "data_sharing"
    SMS_COMMUNICATION = "sms_communication"


class IncentiveType(str, enum.Enum):
    CASH = "cash"
    VOUCHER = "voucher"
    SUPPLY_KIT = "supply_kit"


class IncentiveTrigger(str, enum.Enum):
    ANC_MILESTONE = "anc_milestone"
    FACILITY_DELIVERY = "facility_delivery"
    PNC_COMPLETION = "pnc_completion"


class ClaimStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    PAID = "paid"
    CANCELLED = "cancelled"


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REVERSED = "reversed"


class DangerSignSeverity(str, enum.Enum):
    WARNING = "warning"
    DANGER = "danger"
    EMERGENCY = "emergency"


class CommunicationType(str, enum.Enum):
    SMS = "sms"
    PHONE_CALL = "phone_call"
    HOME_VISIT = "home_visit"


class AuditAction(str, enum.Enum):
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    VIEW = "view"
    EXPORT = "export"
    LOGIN = "login"
    LOGOUT = "logout"
    LOGIN_FAILED = "login_failed"
    PASSWORD_RESET = "password_reset"
    APPROVE = "approve"
    REJECT = "reject"
    PAYMENT = "payment"
