'use client';

import { useAuth } from './use-auth';
import { UserRole } from '@/types/api';
import { ROLE_HIERARCHY } from '@/lib/constants';

export type PermissionAction =
  | 'mothers:create'
  | 'mothers:edit'
  | 'mothers:delete'
  | 'pregnancies:create'
  | 'clinical:assess'
  | 'clinical:refer'
  | 'deliveries:record'
  | 'newborns:record'
  | 'incentives:approve'
  | 'incentives:disburse'
  | 'reports:view'
  | 'reports:export'
  | 'audit:view'
  | 'users:manage'
  | 'facilities:manage';

const ROLE_PERMISSIONS: Record<UserRole, PermissionAction[]> = {
  super_admin: [
    'mothers:create',
    'mothers:edit',
    'mothers:delete',
    'pregnancies:create',
    'clinical:assess',
    'clinical:refer',
    'deliveries:record',
    'newborns:record',
    'incentives:approve',
    'incentives:disburse',
    'reports:view',
    'reports:export',
    'audit:view',
    'users:manage',
    'facilities:manage',
  ],
  programme_manager: [
    'mothers:create',
    'mothers:edit',
    'pregnancies:create',
    'clinical:assess',
    'clinical:refer',
    'deliveries:record',
    'newborns:record',
    'incentives:approve',
    'reports:view',
    'reports:export',
    'audit:view',
    'facilities:manage',
  ],
  lga_coordinator: [
    'mothers:create',
    'mothers:edit',
    'pregnancies:create',
    'clinical:refer',
    'reports:view',
    'reports:export',
  ],
  facility_manager: [
    'mothers:create',
    'mothers:edit',
    'pregnancies:create',
    'clinical:assess',
    'clinical:refer',
    'deliveries:record',
    'newborns:record',
    'reports:view',
  ],
  midwife: [
    'mothers:create',
    'mothers:edit',
    'pregnancies:create',
    'clinical:assess',
    'clinical:refer',
    'deliveries:record',
    'newborns:record',
  ],
  chw: [
    'mothers:create',
    'pregnancies:create',
    'clinical:refer',
  ],
  data_officer: [
    'mothers:create',
    'mothers:edit',
    'pregnancies:create',
    'deliveries:record',
    'newborns:record',
    'reports:view',
    'reports:export',
  ],
  finance_officer: [
    'incentives:approve',
    'incentives:disburse',
    'reports:view',
    'reports:export',
  ],
  auditor: [
    'reports:view',
    'audit:view',
  ],
};

export function usePermissions() {
  const { user, hasRole, hasMinRole } = useAuth();

  const can = (action: PermissionAction): boolean => {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    const allowed = ROLE_PERMISSIONS[user.role] || [];
    return allowed.includes(action);
  };

  const isRoleAtLeast = (minRole: UserRole): boolean => {
    if (!user) return false;
    return (ROLE_HIERARCHY[user.role] ?? 0) >= (ROLE_HIERARCHY[minRole] ?? 0);
  };

  return {
    user,
    role: user?.role,
    hasRole,
    hasMinRole,
    isRoleAtLeast,
    can,
    isSuperAdmin: user?.role === 'super_admin',
    isManager: user?.role === 'programme_manager' || user?.role === 'super_admin',
    isClinical: user?.role === 'midwife' || user?.role === 'facility_manager',
    isCHW: user?.role === 'chw',
    isFinance: user?.role === 'finance_officer',
  };
}
