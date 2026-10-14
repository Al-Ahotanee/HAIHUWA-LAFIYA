# Haihuwa Lafiya Initiative — Data Dictionary

Complete database schema documentation for all relational tables, types, foreign keys, and indexes.

---

## 1. Core Reference & Geographic Hierarchy

### `organisations`
| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | UUID | No | Primary Key |
| `name` | VARCHAR(255) | No | Unique programme organisation name |
| `code` | VARCHAR(20) | No | Short identifier (e.g. `HL-360`) |
| `description` | TEXT | Yes | Mission overview |
| `is_active` | BOOLEAN | No | Operational status flag |
| `created_at` | TIMESTAMPTZ | No | UTC timestamp |
| `updated_at` | TIMESTAMPTZ | No | UTC timestamp |

### `states`
| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | UUID | No | Primary Key |
| `name` | VARCHAR(100) | No | State name (e.g. `Kano`, `Katsina`) |
| `code` | VARCHAR(10) | No | State code (`KAN`, `KT`) |
| `created_at` | TIMESTAMPTZ | No | Registration date |

### `lgas`
| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | UUID | No | Primary Key |
| `state_id` | UUID | No | FK -> `states.id` (RESTRICT) |
| `name` | VARCHAR(100) | No | LGA Name |
| `code` | VARCHAR(20) | No | Unique LGA Code |
| `created_at` | TIMESTAMPTZ | No | Registration timestamp |

### `wards`
| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | UUID | No | Primary Key |
| `lga_id` | UUID | No | FK -> `lgas.id` (RESTRICT) |
| `name` | VARCHAR(100) | No | Ward administrative name |
| `code` | VARCHAR(20) | No | Unique Ward Code |
| `created_at` | TIMESTAMPTZ | No | Creation timestamp |

### `communities`
| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | UUID | No | Primary Key |
| `ward_id` | UUID | No | FK -> `wards.id` (RESTRICT) |
| `name` | VARCHAR(100) | No | Village / Settlement name |
| `created_at` | TIMESTAMPTZ | No | Creation timestamp |

### `health_facilities`
| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | UUID | No | Primary Key |
| `lga_id` | UUID | No | FK -> `lgas.id` (RESTRICT) |
| `name` | VARCHAR(255) | No | Health facility name |
| `code` | VARCHAR(20) | No | Facility master code |
| `facility_type`| VARCHAR(50) | No | `phc`, `general_hospital`, `specialist_hospital`, `private_clinic` |
| `address` | TEXT | Yes | Physical location |
| `phone` | VARCHAR(20) | Yes | Contact number |
| `latitude` | FLOAT | Yes | GPS latitude |
| `longitude` | FLOAT | Yes | GPS longitude |
| `is_active` | BOOLEAN | No | Operational status |

---

## 2. Authentication, Users & Sessions

### `users`
| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | UUID | No | Primary Key |
| `email` | VARCHAR(255) | No | Unique login email |
| `password_hash` | VARCHAR(255) | No | Bcrypt hashed credentials |
| `full_name` | VARCHAR(255) | No | Staff member name |
| `phone` | VARCHAR(20) | Yes | Contact phone number |
| `role` | VARCHAR(50) | No | `super_admin`, `programme_manager`, `lga_coordinator`, `facility_manager`, `midwife`, `chw`, `data_officer`, `finance_officer`, `auditor` |
| `is_active` | BOOLEAN | No | Account active status |
| `organisation_id`| UUID | Yes | FK -> `organisations.id` |
| `programme_area_id`| UUID | Yes | Programme area boundary constraint |
| `lga_id` | UUID | Yes | LGA scope constraint |
| `ward_id` | UUID | Yes | Ward scope constraint |
| `facility_id` | UUID | Yes | Facility scope constraint |
| `created_at` | TIMESTAMPTZ | No | Registration date |
| `updated_at` | TIMESTAMPTZ | No | Last profile modification |

### `user_sessions`
| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | UUID | No | Primary Key |
| `user_id` | UUID | No | FK -> `users.id` (CASCADE) |
| `refresh_token_hash`| VARCHAR(255) | No | SHA-256 hash of rotated refresh token |
| `ip_address` | VARCHAR(45) | Yes | Client IPv4/IPv6 |
| `user_agent` | TEXT | Yes | Client browser / device |
| `expires_at` | TIMESTAMPTZ | No | Expiration timestamp |
| `created_at` | TIMESTAMPTZ | No | Session login timestamp |
| `revoked_at` | TIMESTAMPTZ | Yes | Invalidation timestamp on logout/rotation |

---

## 3. Mothers & Pregnancies

### `mothers`
| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | UUID | No | Primary Key |
| `mother_id` | VARCHAR(30) | No | Unique programme code (e.g. `HL-NAS-000001`) |
| `first_name` | VARCHAR(100) | No | Given name |
| `last_name` | VARCHAR(100) | No | Family name |
| `other_names`| VARCHAR(100) | Yes | Middle/other names |
| `date_of_birth`| DATE | Yes | Birth date |
| `age_at_registration`| INTEGER | Yes | Age in years |
| `phone` | VARCHAR(20) | Yes | Primary phone number (Indexed) |
| `alternate_phone` | VARCHAR(20) | Yes | Secondary contact |
| `marital_status` | VARCHAR(20) | Yes | Marital status |
| `education_level`| VARCHAR(50) | Yes | Highest education level attained |
| `occupation` | VARCHAR(100) | Yes | Mother occupation |
| `lga_id` | UUID | No | FK -> `lgas.id` |
| `ward_id` | UUID | No | FK -> `wards.id` |
| `community_id` | UUID | Yes | FK -> `communities.id` |
| `address` | TEXT | Yes | Residential address |
| `facility_id` | UUID | Yes | Primary assigned health facility |
| `registered_by_id` | UUID | No | FK -> `users.id` |
| `is_active` | BOOLEAN | No | Soft-delete active flag |
| `created_at` | TIMESTAMPTZ | No | Enrollment timestamp |
| `updated_at` | TIMESTAMPTZ | No | Profile update timestamp |

### `mother_consents`
| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | UUID | No | Primary Key |
| `mother_id` | UUID | No | FK -> `mothers.id` |
| `consent_type` | VARCHAR(50) | No | `programme_enrollment`, `data_sharing`, `sms_communication` |
| `granted` | BOOLEAN | No | Consent granted status |
| `granted_date`| DATE | No | Date granted |
| `witness_name`| VARCHAR(255)| Yes | Witness full name |
| `revoked_date`| DATE | Yes | Date revoked if withdrawn |
| `revocation_reason`| TEXT | Yes | Documented reason for withdrawal |

### `pregnancies`
| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | UUID | No | Primary Key |
| `mother_id` | UUID | No | FK -> `mothers.id` |
| `lmp_date` | DATE | Yes | Last Menstrual Period |
| `estimated_due_date`| DATE | Yes | Auto-calculated (LMP + 280 days) |
| `gravida` | INTEGER | No | Total pregnancies count (≥ 1) |
| `parity` | INTEGER | No | Previous births count (≥ 0) |
| `gestational_age_at_registration`| INTEGER | Yes | Gestational age in weeks |
| `status` | VARCHAR(20) | No | `active`, `delivered`, `loss`, `terminated` |
| `is_high_risk` | BOOLEAN | No | High-risk classification flag |
| `high_risk_reasons` | TEXT | Yes | Clinical risk factors |
| `anc_schedule_id` | UUID | Yes | FK -> `anc_schedules.id` |
| `facility_id` | UUID | Yes | Primary care facility |
| `registered_by_id` | UUID | No | FK -> `users.id` |
| `outcome_date`| DATE | Yes | Delivery/Loss outcome date |

---

## 4. Clinical Care, Appointments & Assessments

### `appointments`
| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | UUID | No | Primary Key |
| `pregnancy_id` | UUID | No | FK -> `pregnancies.id` |
| `anc_visit_id` | UUID | Yes | FK -> `anc_schedule_visits.id` |
| `facility_id` | UUID | Yes | Assigned facility |
| `visit_type` | VARCHAR(30) | No | `anc`, `pnc_maternal`, `pnc_newborn`, `follow_up` |
| `scheduled_date`| DATE | No | Planned visit date |
| `actual_date` | DATE | Yes | Actual attendance date |
| `status` | VARCHAR(20) | No | `scheduled`, `attended`, `missed`, `cancelled`, `rescheduled` |
| `attended_by_id`| UUID | Yes | Verifying healthcare staff (FK -> `users.id`) |
| `notes` | TEXT | Yes | Visit observations |

### `clinical_assessments`
| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | UUID | No | Primary Key |
| `appointment_id` | UUID | No | FK -> `appointments.id` |
| `pregnancy_id` | UUID | No | FK -> `pregnancies.id` |
| `assessment_date`| DATE | No | Examination date |
| `systolic_bp` | INTEGER | Yes | Systolic blood pressure (mmHg) |
| `diastolic_bp` | INTEGER | Yes | Diastolic blood pressure (mmHg) |
| `weight_kg` | NUMERIC(5,2)| Yes | Maternal weight |
| `muac_cm` | NUMERIC(4,1)| Yes | Mid-upper arm circumference |
| `fundal_height_cm`| NUMERIC(4,1)| Yes | Fundal height (cm) |
| `fetal_heart_rate`| INTEGER | Yes | Heart rate (bpm) |
| `iron_folate_given`| BOOLEAN | Yes | Routine iron supplementation |
| `itn_given` | BOOLEAN | Yes | Insecticide-treated net distributed |
| `ipt_given` | BOOLEAN | Yes | Malaria intermittent preventive therapy |
| `clinical_notes` | TEXT | Yes | Clinical observations by provider |
| `assessed_by_id` | UUID | No | Provider ID (FK -> `users.id`) |

### `danger_signs`
| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | UUID | No | Primary Key |
| `assessment_id` | UUID | No | FK -> `clinical_assessments.id` |
| `sign_name` | VARCHAR(100)| No | e.g. Severe headache, vaginal bleeding, convulsions |
| `severity` | VARCHAR(20) | No | `warning`, `danger`, `emergency` |
| `description` | TEXT | Yes | Clinical description |
| `action_taken` | TEXT | Yes | Immediate action / referral steps |

---

## 5. Deliveries, Newborns & Postnatal Care

### `deliveries`
| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | UUID | No | Primary Key |
| `pregnancy_id` | UUID | No | FK -> `pregnancies.id` (Unique) |
| `facility_id` | UUID | Yes | Facility where birth occurred |
| `delivery_date` | DATE | No | Date of birth |
| `delivery_mode` | VARCHAR(30) | No | `vaginal`, `caesarean`, `assisted` |
| `place_of_delivery`| VARCHAR(50)| No | `facility`, `home`, `en_route` |
| `maternal_outcome` | VARCHAR(30)| No | `alive`, `deceased`, `critically_ill` |
| `number_of_babies` | INTEGER | No | Multiple birth count (1, 2, 3...) |
| `blood_loss_ml` | INTEGER | Yes | Estimated blood loss in ml |
| `postpartum_haemorrhage`| BOOLEAN| No | PPH occurrence flag |
| `recorded_by_id`| UUID | No | Attending staff (FK -> `users.id`) |

### `newborns`
| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | UUID | No | Primary Key |
| `newborn_id` | VARCHAR(40) | No | Unique newborn code (e.g. `HL-FUN-000001-B1`) |
| `delivery_id` | UUID | No | FK -> `deliveries.id` |
| `mother_id` | UUID | No | FK -> `mothers.id` |
| `birth_order` | INTEGER | No | Order of birth (1, 2, 3...) |
| `first_name` | VARCHAR(100)| Yes | Baby given name |
| `sex` | VARCHAR(20) | No | `male`, `female`, `ambiguous` |
| `birth_weight_grams`| INTEGER | No | Weight in grams (e.g. 3100) |
| `apgar_1min` | INTEGER | Yes | 1-minute APGAR score (0-10) |
| `apgar_5min` | INTEGER | Yes | 5-minute APGAR score (0-10) |
| `resuscitation_performed`| BOOLEAN| No | Resuscitation requirement flag |
| `status` | VARCHAR(30) | No | `alive`, `stillbirth_fresh`, `stillbirth_macerated`, `deceased` |

---

## 6. Incentives & Manual Payments

### `incentive_claims`
| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | UUID | No | Primary Key |
| `claim_reference`| VARCHAR(50) | No | Unique tracking code (`CLM-YYYYMMDD-0001`) |
| `rule_id` | UUID | No | FK -> `incentive_rules.id` |
| `mother_id` | UUID | No | FK -> `mothers.id` |
| `pregnancy_id` | UUID | No | FK -> `pregnancies.id` |
| `amount` | NUMERIC(12,2)| No | Financial incentive entitlement |
| `status` | VARCHAR(20) | No | `pending`, `approved`, `rejected`, `paid`, `cancelled` |
| `submitted_by_id`| UUID | No | Submitting worker (FK -> `users.id`) |
| `approved_by_id` | UUID | Yes | Authorising officer (FK -> `users.id`) |

### `incentive_payments`
| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | UUID | No | Primary Key |
| `claim_id` | UUID | No | FK -> `incentive_claims.id` |
| `idempotency_key` | VARCHAR(100)| No | Unique token preventing duplicate payments |
| `payment_reference`| VARCHAR(100)| No | Bank/Cash voucher reference |
| `amount` | NUMERIC(12,2)| No | Disbursed amount |
| `payment_method` | VARCHAR(50) | No | `manual_cash`, `manual_bank_transfer` |
| `status` | VARCHAR(20) | No | `completed`, `pending`, `failed`, `reversed` |
| `payment_date` | DATE | No | Transaction date |
| `recorded_by_id`| UUID | No | Finance officer recording payout |

---

## 7. Audit & Operational Health

### `audit_logs`
| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | UUID | No | Primary Key |
| `user_id` | UUID | Yes | FK -> `users.id` |
| `user_email` | VARCHAR(255)| Yes | Email at time of action |
| `action` | VARCHAR(50) | No | `create`, `update`, `delete`, `login`, `export`, etc. |
| `resource_type` | VARCHAR(100)| No | Domain entity affected |
| `resource_id` | VARCHAR(100)| Yes | Affected resource ID |
| `ip_address` | VARCHAR(45) | Yes | Client IP |
| `details` | TEXT | Yes | Audit summary or JSON diff |
| `created_at` | TIMESTAMPTZ | No | Immutable UTC log timestamp |
