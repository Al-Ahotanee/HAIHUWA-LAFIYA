# Haihuwa Lafiya Initiative — Open Decisions & Operational Assumptions

This document registers all operational assumptions, structural choices, and missing specifications pending field/programme team confirmation.

---

## 1. External Integrations (Status: Manual Defaults Active)
- **SMS Gateway**: Deferred per user directive. The platform uses a manual communication logger (`CommunicationLog`) where CHWs and facility staff document sent SMS or phone calls directly without calling third-party APIs.
- **Payment Disbursements**: Deferred per user directive. All financial claims use manual reconciliation and disbursement recording (`IncentivePayment` with `payment_method='manual_cash'` / `'manual_bank_transfer'`).

---

## 2. Clinical Protocol Disclaimer
- All danger signs, lab tests, and clinical thresholds are baseline data structures aligned with WHO guidelines.
- **Crucial Rule**: The software never generates diagnostic risk scores autonomously. All classifications and urgent interventions must be confirmed and authorized by a licensed healthcare provider (midwife, doctor, or CHEW).

---

## 3. Geographic Identifiers & Numbering Formats
- **Mother ID Scheme**: `HL-{LGA_CODE}-{SEQUENCE_6_DIGITS}` (e.g. `HL-KAN-000001`).
- **Newborn ID Scheme**: `{MOTHER_ID}-B{BIRTH_ORDER}` (e.g. `HL-KAN-000001-B1`, `HL-KAN-000001-B2`).
- **Claim Reference Scheme**: `CLM-{YYYYMMDD}-{SEQUENCE_4_DIGITS}`.

---

## 4. Data Retention & Archival
- Clinical records are retained indefinitely by default with soft-deletion policies to prevent accidental record destruction.
- Hard deletions on mother or delivery profiles are strictly restricted and logged to the immutable `audit_logs` table.
