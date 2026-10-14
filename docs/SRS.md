# Haihuwa Lafiya Initiative — Software Requirements Specification
## 360° Motherhood Initiative Platform

**Version:** 1.0.0  
**Date:** 2026-10-14  
**Status:** Approved for Development  

---

## 1. Introduction

### 1.1 Purpose
Haihuwa Lafiya Initiative is a maternal and newborn health programme management platform designed to support community health workers, facility staff, programme managers and administrators in delivering comprehensive antenatal, delivery, postnatal and newborn care services across programme areas in Northern Nigeria.

### 1.2 Scope
The platform manages the full lifecycle of maternal and newborn care:
- Mother registration, consent and deduplication
- Pregnancy registration and longitudinal history
- Antenatal care scheduling, appointments, attendance and follow-up
- Clinical assessments and risk documentation
- Referral management and escalation
- Birth preparedness planning
- Delivery and pregnancy outcome recording
- Individual newborn records (supporting multiple births)
- Separate maternal and newborn postnatal workflows
- Configurable incentive programmes with eligibility, approvals and payment reconciliation
- Health education and communication logging
- Dashboard metrics, reports, data quality checks and exports
- Audit trails, privacy controls and operational health checks
- PWA/offline foundation with protected drafts

### 1.3 Definitions and Acronyms
| Term | Definition |
|------|-----------|
| ANC | Antenatal Care |
| PNC | Postnatal Care |
| CHW | Community Health Worker |
| LGA | Local Government Area |
| PHC | Primary Health Centre |
| RBAC | Role-Based Access Control |
| EDD | Estimated Due Date |
| LMP | Last Menstrual Period |
| MUAC | Mid-Upper Arm Circumference |
| BP | Blood Pressure |
| ITN | Insecticide-Treated Net |

### 1.4 User Roles
| Role | Description | Access Level |
|------|-------------|-------------|
| `super_admin` | Platform administrator | Full system access |
| `programme_manager` | Programme oversight | Programme-area scoped |
| `lga_coordinator` | LGA-level coordination | LGA scoped |
| `facility_manager` | Health facility management | Facility scoped |
| `midwife` | Clinical care provider | Facility scoped |
| `chw` | Community health worker | Ward/community scoped |
| `data_officer` | Data entry and quality | Programme-area scoped |
| `finance_officer` | Incentive and payment management | Programme-area scoped |
| `auditor` | Read-only audit access | Programme-area scoped |

---

## 2. System Architecture

### 2.1 Architecture Pattern
Modular monolith with clear separation of concerns:
- API handlers (routers)
- Request/response schemas (Pydantic)
- Business services
- Data repositories
- Database models (SQLAlchemy)
- Authentication and permissions
- Audit logging
- Integration adapters

### 2.2 Technology Stack
**Frontend:** Next.js (App Router), TypeScript (strict), Tailwind CSS, shadcn/ui, React Hook Form, Zod  
**Backend:** Python 3.12+, FastAPI, Pydantic v2, SQLAlchemy 2, Alembic  
**Database:** PostgreSQL 16 (Neon)  
**Hosting:** Render (Blueprint)

### 2.3 Communication
- Frontend communicates with backend via REST API (`/api/v1`)
- Browser never connects directly to database
- All state mutations go through authenticated API endpoints

---

## 3. Functional Requirements

### 3.1 Authentication & User Management (Module 1)
- **FR-1.1** Email/password authentication with secure hashing (bcrypt)
- **FR-1.2** JWT access tokens (short-lived) + refresh tokens (longer-lived, rotated)
- **FR-1.3** Login rate limiting (5 attempts per 15 minutes per IP/email)
- **FR-1.4** Session management with server-side token tracking
- **FR-1.5** Role-based access control with 9 defined roles
- **FR-1.6** Geographic scoping (programme area, LGA, ward, community, facility)
- **FR-1.7** User CRUD by authorised administrators
- **FR-1.8** Password reset flow
- **FR-1.9** Account deactivation (soft delete)
- **FR-1.10** Audit log of all authentication events

### 3.2 Organisation & Geography (Module 2)
- **FR-2.1** Organisation (programme) management
- **FR-2.2** Programme area hierarchy: State → LGA → Ward → Community
- **FR-2.3** Health facility registration linked to LGA
- **FR-2.4** Facility types: PHC, General Hospital, Specialist Hospital, Private Clinic
- **FR-2.5** Geographic entities are reference data managed by administrators
- **FR-2.6** All clinical and operational records are scoped to geography

### 3.3 Mother Registration (Module 3)
- **FR-3.1** Register mothers with demographic data, contact, location
- **FR-3.2** Informed consent capture (type, date, witness, revocation)
- **FR-3.3** Duplicate detection on name + phone + DOB combination
- **FR-3.4** Unique mother ID generation (programme prefix + sequence)
- **FR-3.5** Longitudinal profile view with all pregnancies and outcomes
- **FR-3.6** Soft delete only; never hard-delete clinical records
- **FR-3.7** Edit history tracked in audit log

### 3.4 Pregnancy Management (Module 4)
- **FR-4.1** Register pregnancy linked to mother
- **FR-4.2** Only one active pregnancy per mother at a time
- **FR-4.3** Record LMP, EDD (auto-calculated), gravida, parity
- **FR-4.4** Pregnancy status lifecycle: active → delivered | loss | terminated
- **FR-4.5** Pregnancy history viewable on mother profile
- **FR-4.6** Previous pregnancy outcomes recorded (gravida/parity)

### 3.5 Antenatal Care Schedules (Module 5)
- **FR-5.1** Versioned ANC visit schedules (WHO 8-contact model as default)
- **FR-5.2** Schedule defines visit number, gestational age window, required assessments
- **FR-5.3** Schedule versions allow programme evolution without breaking history
- **FR-5.4** Active schedule assigned to new pregnancies at registration

### 3.6 Appointments (Module 6)
- **FR-6.1** Create appointments linked to pregnancy and ANC schedule visit
- **FR-6.2** Appointment statuses: scheduled → attended | missed | cancelled | rescheduled
- **FR-6.3** Attendance verification (date, facility, provider)
- **FR-6.4** Missed appointment detection and follow-up task generation
- **FR-6.5** Overdue appointment queue for CHWs
- **FR-6.6** Appointment reminders (when messaging is configured)

### 3.7 Clinical Assessments (Module 7)
- **FR-7.1** Record clinical observations per visit (BP, weight, MUAC, fundal height, fetal heart rate)
- **FR-7.2** Record lab results (HIV, hepatitis B, syphilis, blood group, haemoglobin, urinalysis, malaria)
- **FR-7.3** Danger sign documentation with severity classification
- **FR-7.4** Risk factors tracked across visits
- **FR-7.5** Clinical notes by authorised providers
- **FR-7.6** No autonomous diagnosis; system documents observations only

### 3.8 Referrals (Module 8)
- **FR-8.1** Initiate referral from any clinical encounter
- **FR-8.2** Referral statuses: initiated → accepted → in_transit → completed | declined | expired
- **FR-8.3** Referral reason, urgency level, referring/receiving facility
- **FR-8.4** Referral outcome documentation
- **FR-8.5** Escalation for overdue referrals
- **FR-8.6** Emergency referrals bypass non-essential workflows

### 3.9 Birth Preparedness (Module 9)
- **FR-9.1** Birth preparedness plan per pregnancy
- **FR-9.2** Checklist: transport, birth companion, facility, funds, blood donor, supplies
- **FR-9.3** Preparedness status tracking
- **FR-9.4** Linkage to referral plan if high-risk

### 3.10 Delivery & Outcomes (Module 10)
- **FR-10.1** Record delivery details: date, mode, location, attendant
- **FR-10.2** Pregnancy outcome: live_birth | stillbirth | miscarriage | maternal_death
- **FR-10.3** Complications documentation
- **FR-10.4** Transition pregnancy status to delivered
- **FR-10.5** Trigger newborn record creation for live births

### 3.11 Newborn Records (Module 11)
- **FR-11.1** Individual newborn record per baby (supporting twins, triplets)
- **FR-11.2** Birth weight, APGAR scores, sex, immediate complications
- **FR-11.3** Linked to pregnancy and delivery record
- **FR-11.4** Newborn ID generation
- **FR-11.5** Vaccination tracking (BCG, OPV-0, Hepatitis B at birth)

### 3.12 Postnatal Care (Module 12)
- **FR-12.1** Separate maternal PNC schedule (24h, 48-72h, 7-14 days, 6 weeks)
- **FR-12.2** Separate newborn PNC schedule
- **FR-12.3** Maternal PNC assessments: BP, bleeding, infection signs, mental health screening
- **FR-12.4** Newborn PNC assessments: weight, feeding, cord care, jaundice, danger signs
- **FR-12.5** PNC visit tracking with same appointment workflow as ANC

### 3.13 Incentive Programmes (Module 13)
- **FR-13.1** Configurable incentive programmes with eligibility criteria
- **FR-13.2** Incentive types: cash, voucher, supply kit
- **FR-13.3** Eligibility triggers: ANC milestone, delivery at facility, PNC completion
- **FR-13.4** Claim creation and approval workflow
- **FR-13.5** Duplicate claim prevention
- **FR-13.6** Payment recording with reference numbers
- **FR-13.7** Reconciliation reports
- **FR-13.8** Decimal-safe financial amounts
- **FR-13.9** Idempotent payment operations

### 3.14 Health Education (Module 14)
- **FR-14.1** Health education session logging
- **FR-14.2** Topics covered per session
- **FR-14.3** Attendance tracking
- **FR-14.4** Communication logs (SMS, calls, visits)

### 3.15 Reports & Dashboard (Module 15)
- **FR-15.1** Dashboard with real-time programme metrics
- **FR-15.2** Registration statistics by geography and period
- **FR-15.3** ANC coverage and completion rates
- **FR-15.4** Delivery outcome statistics
- **FR-15.5** Referral completion rates
- **FR-15.6** Incentive disbursement summaries
- **FR-15.7** Data quality checks (missing fields, overdue visits, incomplete records)
- **FR-15.8** Controlled data exports (CSV) with audit logging
- **FR-15.9** All statistics from real API data, never fabricated

### 3.16 Audit & Administration (Module 16)
- **FR-16.1** Immutable audit log of sensitive operations
- **FR-16.2** Audit entries: user, action, resource, timestamp, IP, changes
- **FR-16.3** System settings management
- **FR-16.4** Privacy controls and data retention policies
- **FR-16.5** Health check endpoints
- **FR-16.6** Application version and deployment info

### 3.17 PWA & Offline (Module 17)
- **FR-17.1** Service worker for static asset caching
- **FR-17.2** Offline draft storage for forms (IndexedDB)
- **FR-17.3** Online/offline status indicator
- **FR-17.4** Draft sync with conflict detection on reconnection
- **FR-17.5** No offline clinical data entry until sync is fully tested and approved

---

## 4. Non-Functional Requirements

### 4.1 Security
- HTTPS everywhere in production
- Secure password hashing (bcrypt, cost factor ≥ 12)
- CSRF protection where applicable
- SQL injection prevention (parameterised queries via ORM)
- XSS prevention (output encoding, CSP headers)
- IDOR prevention (ownership checks on every endpoint)
- Mass assignment protection (explicit Pydantic schemas)
- Rate limiting on authentication endpoints
- No secrets in source control or browser
- No clinical data in application logs

### 4.2 Performance
- API response time < 500ms for standard operations
- Paginated responses for list endpoints (default 25, max 100)
- Database connection pooling
- Appropriate indexes on frequently queried columns

### 4.3 Reliability
- Database transactions for multi-step operations
- Idempotent payment operations
- Graceful degradation when integrations are unavailable
- Health check endpoints for monitoring

### 4.4 Accessibility
- WCAG 2.1 Level AA compliance target
- Keyboard navigable
- Screen reader compatible
- Appropriate colour contrast ratios
- Focus management in modals and forms

### 4.5 Data Protection
- Privacy impact assessment documented
- Data retention policy documented
- Backup strategy documented
- Incident response plan documented
- Soft delete for clinical and financial records
- Consent management with revocation support

---

## 5. API Design

### 5.1 Conventions
- Base path: `/api/v1`
- JSON request/response bodies
- Consistent error format: `{ "detail": "message", "code": "ERROR_CODE" }`
- Pagination: `?page=1&page_size=25`
- Filtering: query parameters
- Sorting: `?sort_by=field&sort_order=asc`
- UUID primary keys in URLs

### 5.2 Authentication Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/login` | Authenticate |
| POST | `/api/v1/auth/refresh` | Refresh token |
| POST | `/api/v1/auth/logout` | Invalidate session |
| POST | `/api/v1/auth/password-reset/request` | Request reset |
| POST | `/api/v1/auth/password-reset/confirm` | Confirm reset |

### 5.3 Resource Endpoints (Pattern)
All resource endpoints follow CRUD patterns:
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/{resource}` | List (paginated) |
| POST | `/api/v1/{resource}` | Create |
| GET | `/api/v1/{resource}/{id}` | Get by ID |
| PATCH | `/api/v1/{resource}/{id}` | Update |
| DELETE | `/api/v1/{resource}/{id}` | Soft delete |

---

## 6. Deployment

### 6.1 Render Blueprint
- Separate web services for frontend and backend
- Environment variables for all configuration
- No persistent filesystem dependency
- Automated builds from Git

### 6.2 Environment Configuration
- `DATABASE_URL` — Neon pooled connection
- `DATABASE_URL_DIRECT` — Neon direct connection (migrations)
- `SECRET_KEY` — JWT signing key
- `CORS_ORIGINS` — Allowed frontend origins
- `ENVIRONMENT` — development | staging | production

---

## 7. Acceptance Criteria

1. All 17 functional modules are implemented and connected
2. Database schema is migrated and consistent
3. RBAC is enforced on every protected endpoint
4. Frontend is connected to backend APIs
5. Automated tests pass
6. Security-critical flows are tested
7. Configuration is documented
8. Deployment files are validated
9. Outstanding risks are disclosed
