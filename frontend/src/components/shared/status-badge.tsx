import React from 'react';
import { Badge, BadgeProps } from '@/components/ui/badge';
import {
  MOTHER_STATUS_CONFIG,
  PREGNANCY_STATUS_CONFIG,
  RISK_LEVEL_CONFIG,
  APPOINTMENT_STATUS_CONFIG,
  REFERRAL_STATUS_CONFIG,
  REFERRAL_URGENCY_CONFIG,
} from '@/lib/constants';
import {
  MotherStatus,
  PregnancyStatus,
  PregnancyRiskLevel,
  AppointmentStatus,
  ReferralStatus,
  ReferralUrgency,
} from '@/types/mother';

type StatusType =
  | 'mother'
  | 'pregnancy'
  | 'risk'
  | 'appointment'
  | 'referral'
  | 'urgency'
  | 'auto';

interface StatusBadgeProps {
  status: string;
  type?: StatusType;
  className?: string;
}

export function StatusBadge({ status, type = 'auto', className }: StatusBadgeProps) {
  const normalized = status.toLowerCase();

  let label: string = status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  let variant: BadgeProps['variant'] = 'secondary';

  if (type === 'mother' || (type === 'auto' && normalized in MOTHER_STATUS_CONFIG)) {
    const config = MOTHER_STATUS_CONFIG[normalized as MotherStatus];
    if (config) {
      label = config.label;
      variant = config.variant;
    }
  } else if (type === 'pregnancy' || (type === 'auto' && normalized in PREGNANCY_STATUS_CONFIG)) {
    const config = PREGNANCY_STATUS_CONFIG[normalized as PregnancyStatus];
    if (config) {
      label = config.label;
      variant = config.variant;
    }
  } else if (type === 'risk' || (type === 'auto' && normalized in RISK_LEVEL_CONFIG)) {
    const config = RISK_LEVEL_CONFIG[normalized as PregnancyRiskLevel];
    if (config) {
      label = config.label;
      variant = config.variant;
    }
  } else if (type === 'appointment' || (type === 'auto' && normalized in APPOINTMENT_STATUS_CONFIG)) {
    const config = APPOINTMENT_STATUS_CONFIG[normalized as AppointmentStatus];
    if (config) {
      label = config.label;
      variant = config.variant;
    }
  } else if (type === 'referral' || (type === 'auto' && normalized in REFERRAL_STATUS_CONFIG)) {
    const config = REFERRAL_STATUS_CONFIG[normalized as ReferralStatus];
    if (config) {
      label = config.label;
      variant = config.variant;
    }
  } else if (type === 'urgency' || (type === 'auto' && normalized in REFERRAL_URGENCY_CONFIG)) {
    const config = REFERRAL_URGENCY_CONFIG[normalized as ReferralUrgency];
    if (config) {
      label = config.label;
      variant = config.variant;
    }
  }

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}
