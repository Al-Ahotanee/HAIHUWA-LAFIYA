"""Database Entity Relationship Documentation for Haihuwa Lafiya Initiative."""

# Database Schema & Entity Relationship Overview

This document describes all database tables, foreign keys, unique constraints, and indexes across the 17 functional modules.

## Tables by Domain

### 1. Organisations & Geography
- `organisations` (id, name, code, description, is_active, created_at, updated_at)
- `states` (id, name, code, created_at)
- `lgas` (id, state_id [FK->states.id], name, code, created_at)
- `wards` (id, lga_id [FK->lgas.id], name, code, created_at)
- `communities` (id, ward_id [FK->wards.id], name, created_at)
- `health_facilities` (id, lga_id [FK->lgas.id], name, code, facility_type, address, phone, lat, long, is_active)

### 2. Users, Sessions & Auth
- `users` (id, email [UQ], password_hash, full_name, phone, role, is_active, organisation_id, programme_area_id, lga_id, ward_id, facility_id, created_at, updated_at, deactivated_at)
- `user_sessions` (id, user_id [FK->users.id], refresh_token_hash, ip_address, user_agent, expires_at, created_at, revoked_at)
- `login_attempts` (id, email, ip_address, success, created_at)
- `password_reset_tokens` (id, user_id [FK->users.id], token_hash, expires_at, used_at, created_at)

### 3. Mothers & Pregnancies
- `mothers` (id, mother_id [UQ], first_name, last_name, other_names, date_of_birth, age_at_registration, phone, alternate_phone, marital_status, education_level, occupation, lga_id, ward_id, community_id, address, registered_by_id, facility_id, is_active, created_at, updated_at)
- `mother_consents` (id, mother_id [FK->mothers.id], consent_type, granted, granted_date, witness_name, revoked_date, revocation_reason, created_at)
- `pregnancies` (id, mother_id [FK->mothers.id], lmp_date, estimated_due_date, gravida, parity, gestational_age_at_registration, status, is_high_risk, high_risk_reasons, anc_schedule_id, facility_id, registered_by_id, created_at, updated_at, outcome_date)
- `pregnancy_history` (id, mother_id [FK->mothers.id], year, outcome, delivery_mode, birth_weight_grams, complications, notes, created_at)

### 4. ANC & Appointments
- `anc_schedules` (id, name, version, description, is_active, created_at)
- `anc_schedule_visits` (id, schedule_id [FK->anc_schedules.id], visit_number, name, gestational_age_min_weeks, gestational_age_max_weeks, required_assessments, description)
- `appointments` (id, pregnancy_id [FK->pregnancies.id], anc_visit_id, facility_id, visit_type, scheduled_date, actual_date, status, attended_by_id, notes, created_by_id, created_at, updated_at)
- `appointment_followups` (id, appointment_id [FK->appointments.id], followup_type, followup_date, outcome, notes, performed_by_id, created_at)

### 5. Clinical Assessments
- `clinical_assessments` (id, appointment_id [FK->appointments.id], pregnancy_id [FK->pregnancies.id], assessment_date, systolic_bp, diastolic_bp, weight_kg, height_cm, muac_cm, temperature_c, fundal_height_cm, fetal_heart_rate, fetal_presentation, gestational_age_weeks, iron_folate_given, itn_given, ipt_given, tetanus_dose, deworming_given, clinical_notes, assessed_by_id, created_at, updated_at)
- `danger_signs` (id, assessment_id [FK->clinical_assessments.id], sign_name, severity, description, action_taken, created_at)
- `lab_results` (id, assessment_id [FK->clinical_assessments.id], test_name, result, result_value, unit, is_abnormal, test_date, notes, created_at)

### 6. Referrals & Preparedness
- `referrals` (id, pregnancy_id [FK->pregnancies.id], referring_facility_id [FK->facilities.id], receiving_facility_id [FK->facilities.id], urgency, reason, clinical_findings, treatments_given, status, outcome_summary, initiated_by_id, created_at, updated_at)
- `referral_updates` (id, referral_id [FK->referrals.id], previous_status, new_status, notes, updated_by_id, created_at)
- `birth_preparedness_plans` (id, pregnancy_id [FK->pregnancies.id], target_facility_id, identified_transport, transport_contact_phone, has_birth_companion, birth_companion_name, saved_emergency_funds, emergency_funds_amount, identified_blood_donor, blood_donor_contact, essential_supplies_ready, notes, reviewed_by_id, created_at, updated_at)

### 7. Deliveries & Newborns
- `deliveries` (id, pregnancy_id [FK->pregnancies.id], facility_id, delivery_date, delivery_time, delivery_mode, place_of_delivery, maternal_outcome, number_of_babies, blood_loss_ml, postpartum_haemorrhage, attended_by_name, attended_by_cadre, recorded_by_id, notes, created_at, updated_at)
- `delivery_complications` (id, delivery_id [FK->deliveries.id], complication_name, management_provided, created_at)
- `newborns` (id, newborn_id [UQ], delivery_id [FK->deliveries.id], mother_id [FK->mothers.id], birth_order, first_name, sex, birth_weight_grams, length_cm, head_circumference_cm, apgar_1min, apgar_5min, apgar_10min, resuscitation_performed, immediate_complications, status, created_at, updated_at)
- `newborn_vaccinations` (id, newborn_id [FK->newborns.id], vaccine_name, administered_date, batch_number, administered_by_id, created_at)

### 8. Postnatal Care
- `maternal_pnc_visits` (id, pregnancy_id [FK->pregnancies.id], facility_id, visit_number, visit_date, systolic_bp, diastolic_bp, temperature_c, lochia_normal, lochia_concerns, perineum_healing_normal, breast_concerns, family_planning_counseled, family_planning_method_chosen, maternal_mental_health_screened, depression_suspected, danger_signs_detected, danger_signs_notes, clinical_notes, provider_id, created_at)
- `newborn_pnc_visits` (id, newborn_id [FK->newborns.id], facility_id, visit_number, visit_date, current_weight_grams, temperature_c, exclusive_breastfeeding, feeding_difficulty, umbilical_cord_status, jaundice_observed, danger_signs_detected, danger_signs_notes, immunization_status_checked, clinical_notes, provider_id, created_at)

### 9. Incentives & Payments
- `incentive_programmes` (id, name, code, description, incentive_type, is_active, created_at)
- `incentive_rules` (id, programme_id [FK->programmes.id], trigger_event, amount, description, is_active)
- `incentive_claims` (id, claim_reference [UQ], rule_id [FK->rules.id], mother_id [FK->mothers.id], pregnancy_id [FK->pregnancies.id], amount, status, submitted_by_id, approved_by_id, approved_at, rejection_reason, created_at, updated_at)
- `incentive_payments` (id, claim_id [FK->claims.id], idempotency_key [UQ], payment_reference [UQ], amount, payment_method, status, payment_date, recorded_by_id, reconciliation_notes, created_at)

### 10. Education, Communication & Audit
- `education_sessions` (id, facility_id, ward_id, title, topics_covered, session_date, attendees_count, conducted_by_id, notes, created_at)
- `communication_logs` (id, mother_id [FK->mothers.id], communication_type, purpose, message_content, delivery_status, logged_by_id, created_at)
- `audit_logs` (id, user_id, user_email, action, resource_type, resource_id, ip_address, details, created_at)
