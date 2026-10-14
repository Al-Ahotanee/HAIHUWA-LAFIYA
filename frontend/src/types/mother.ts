export type ConsentType = 'written' | 'verbal' | 'biometric';
export type MotherStatus = 'active' | 'inactive' | 'transferred' | 'deceased';

export interface Mother {
  id: string;
  unique_id: string; // Programme prefix + sequence e.g., HLI-KNO-2026-0001
  first_name: string;
  last_name: string;
  other_names?: string | null;
  date_of_birth: string;
  estimated_age?: number;
  phone_number: string;
  alternate_phone?: string | null;
  address: string;
  community: string;
  ward_id: string;
  ward_name?: string;
  lga_id: string;
  lga_name?: string;
  state: string;
  preferred_facility_id: string;
  preferred_facility_name?: string;
  consent_given: boolean;
  consent_type: ConsentType;
  consent_date: string;
  consent_witness?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relationship?: string | null;
  status: MotherStatus;
  active_pregnancy_id?: string | null;
  created_at: string;
  updated_at: string;
}

export type PregnancyStatus = 'active' | 'delivered' | 'miscarriage' | 'terminated' | 'loss';
export type PregnancyRiskLevel = 'low' | 'medium' | 'high';

export interface Pregnancy {
  id: string;
  mother_id: string;
  mother_name?: string;
  mother_unique_id?: string;
  gravida: number; // Total number of pregnancies
  parity: number;  // Number of deliveries > 28 weeks
  living_children: number;
  lmp_date: string; // Last menstrual period
  edd_date: string; // Estimated due date
  gestational_age_weeks?: number;
  risk_level: PregnancyRiskLevel;
  risk_factors?: string[];
  status: PregnancyStatus;
  preferred_facility_id: string;
  preferred_facility_name?: string;
  chw_id?: string | null;
  chw_name?: string | null;
  schedule_version?: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export type AppointmentStatus = 'scheduled' | 'attended' | 'missed' | 'cancelled' | 'rescheduled';
export type AppointmentType = 'anc' | 'pnc' | 'routine' | 'referral_followup';

export interface Appointment {
  id: string;
  mother_id: string;
  mother_name?: string;
  pregnancy_id?: string | null;
  facility_id: string;
  facility_name?: string;
  appointment_date: string;
  appointment_type: AppointmentType;
  visit_number: number;
  status: AppointmentStatus;
  attended_at?: string | null;
  provider_name?: string | null;
  notes?: string | null;
  created_at: string;
}

export type ReferralUrgency = 'routine' | 'urgent' | 'emergency';
export type ReferralStatus = 'initiated' | 'accepted' | 'in_transit' | 'completed' | 'declined' | 'expired';

export interface Referral {
  id: string;
  mother_id: string;
  mother_name?: string;
  pregnancy_id?: string | null;
  referring_facility_id: string;
  referring_facility_name?: string;
  receiving_facility_id: string;
  receiving_facility_name?: string;
  urgency: ReferralUrgency;
  reason: string;
  status: ReferralStatus;
  clinical_summary?: string | null;
  initiated_by_name: string;
  initiated_at: string;
  completed_at?: string | null;
}

export interface MotherFilters {
  search?: string;
  lga_id?: string;
  ward_id?: string;
  facility_id?: string;
  status?: MotherStatus;
  has_active_pregnancy?: boolean;
}

export interface PregnancyFilters {
  search?: string;
  risk_level?: PregnancyRiskLevel;
  status?: PregnancyStatus;
  facility_id?: string;
}
