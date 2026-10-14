import { UserRole } from '@/types/api';
import { MotherStatus, PregnancyRiskLevel, PregnancyStatus, AppointmentStatus, ReferralStatus, ReferralUrgency } from '@/types/mother';

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Haihuwa Lafiya Initiative';

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Administrator',
  programme_manager: 'Programme Manager',
  lga_coordinator: 'LGA Coordinator',
  facility_manager: 'Facility Manager',
  midwife: 'Midwife / Nurse',
  chw: 'Community Health Worker',
  data_officer: 'Data Officer',
  finance_officer: 'Finance Officer',
  auditor: 'Auditor',
};

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  super_admin: 100,
  programme_manager: 80,
  lga_coordinator: 60,
  facility_manager: 50,
  midwife: 40,
  data_officer: 40,
  finance_officer: 40,
  auditor: 30,
  chw: 20,
};

export const MOTHER_STATUS_CONFIG: Record<MotherStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning' }> = {
  active: { label: 'Active', variant: 'success' },
  inactive: { label: 'Inactive', variant: 'secondary' },
  transferred: { label: 'Transferred', variant: 'outline' },
  deceased: { label: 'Deceased', variant: 'destructive' },
};

export const PREGNANCY_STATUS_CONFIG: Record<PregnancyStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning' }> = {
  active: { label: 'Active', variant: 'success' },
  delivered: { label: 'Delivered', variant: 'default' },
  miscarriage: { label: 'Miscarriage', variant: 'destructive' },
  loss: { label: 'Loss', variant: 'destructive' },
  terminated: { label: 'Terminated', variant: 'secondary' },
};

export const RISK_LEVEL_CONFIG: Record<PregnancyRiskLevel, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning' }> = {
  low: { label: 'Low Risk', variant: 'success' },
  medium: { label: 'Moderate Risk', variant: 'warning' },
  high: { label: 'High Risk', variant: 'destructive' },
};

export const APPOINTMENT_STATUS_CONFIG: Record<AppointmentStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning' }> = {
  scheduled: { label: 'Scheduled', variant: 'secondary' },
  attended: { label: 'Attended', variant: 'success' },
  missed: { label: 'Missed', variant: 'destructive' },
  cancelled: { label: 'Cancelled', variant: 'outline' },
  rescheduled: { label: 'Rescheduled', variant: 'warning' },
};

export const REFERRAL_STATUS_CONFIG: Record<ReferralStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning' }> = {
  initiated: { label: 'Initiated', variant: 'secondary' },
  accepted: { label: 'Accepted', variant: 'outline' },
  in_transit: { label: 'In Transit', variant: 'warning' },
  completed: { label: 'Completed', variant: 'success' },
  declined: { label: 'Declined', variant: 'destructive' },
  expired: { label: 'Expired', variant: 'destructive' },
};

export const REFERRAL_URGENCY_CONFIG: Record<ReferralUrgency, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning' }> = {
  routine: { label: 'Routine', variant: 'secondary' },
  urgent: { label: 'Urgent', variant: 'warning' },
  emergency: { label: 'Emergency', variant: 'destructive' },
};

export const TOKEN_STORAGE_KEY = 'haihuwa_access_token';
export const REFRESH_TOKEN_STORAGE_KEY = 'haihuwa_refresh_token';
export const USER_STORAGE_KEY = 'haihuwa_user_data';
