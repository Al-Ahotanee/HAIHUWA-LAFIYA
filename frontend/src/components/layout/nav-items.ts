import {
  LayoutDashboard,
  Users,
  HeartPulse,
  CalendarCheck,
  Stethoscope,
  Send,
  Baby,
  Activity,
  Award,
  BookOpen,
  BarChart3,
  CheckCircle2,
  FileSpreadsheet,
  UserCog,
  Building2,
  Hospital,
  ShieldCheck,
  Settings,
  LucideIcon,
} from 'lucide-react';
import { UserRole } from '@/types/api';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  requiredRoles?: UserRole[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: 'Registrations',
    items: [
      {
        title: 'Mothers',
        href: '/mothers',
        icon: Users,
      },
      {
        title: 'Pregnancies',
        href: '/pregnancies',
        icon: HeartPulse,
      },
    ],
  },
  {
    title: 'Care',
    items: [
      {
        title: 'Appointments',
        href: '/appointments',
        icon: CalendarCheck,
      },
      {
        title: 'Assessments',
        href: '/assessments',
        icon: Stethoscope,
        requiredRoles: [
          'super_admin',
          'programme_manager',
          'facility_manager',
          'midwife',
          'data_officer',
        ],
      },
      {
        title: 'Referrals',
        href: '/referrals',
        icon: Send,
      },
    ],
  },
  {
    title: 'Outcomes',
    items: [
      {
        title: 'Deliveries',
        href: '/deliveries',
        icon: Baby,
        requiredRoles: [
          'super_admin',
          'programme_manager',
          'facility_manager',
          'midwife',
          'data_officer',
        ],
      },
      {
        title: 'Postnatal Care',
        href: '/postnatal',
        icon: Activity,
        requiredRoles: [
          'super_admin',
          'programme_manager',
          'facility_manager',
          'midwife',
          'chw',
          'data_officer',
        ],
      },
    ],
  },
  {
    title: 'Programme',
    items: [
      {
        title: 'Incentives',
        href: '/incentives',
        icon: Award,
        requiredRoles: [
          'super_admin',
          'programme_manager',
          'finance_officer',
          'auditor',
        ],
      },
      {
        title: 'Education',
        href: '/education',
        icon: BookOpen,
      },
    ],
  },
  {
    title: 'Reports & Quality',
    items: [
      {
        title: 'Programme Reports',
        href: '/reports',
        icon: BarChart3,
        requiredRoles: [
          'super_admin',
          'programme_manager',
          'lga_coordinator',
          'facility_manager',
          'data_officer',
          'finance_officer',
          'auditor',
        ],
      },
      {
        title: 'Data Quality',
        href: '/reports/data-quality',
        icon: CheckCircle2,
        requiredRoles: [
          'super_admin',
          'programme_manager',
          'data_officer',
          'lga_coordinator',
        ],
      },
      {
        title: 'Data Exports',
        href: '/reports/exports',
        icon: FileSpreadsheet,
        requiredRoles: [
          'super_admin',
          'programme_manager',
          'data_officer',
          'auditor',
        ],
      },
    ],
  },
  {
    title: 'Administration',
    items: [
      {
        title: 'User Management',
        href: '/admin/users',
        icon: UserCog,
        requiredRoles: ['super_admin', 'programme_manager'],
      },
      {
        title: 'Organisations',
        href: '/admin/organisations',
        icon: Building2,
        requiredRoles: ['super_admin', 'programme_manager'],
      },
      {
        title: 'Health Facilities',
        href: '/admin/facilities',
        icon: Hospital,
        requiredRoles: [
          'super_admin',
          'programme_manager',
          'lga_coordinator',
        ],
      },
      {
        title: 'Audit Logs',
        href: '/admin/audit',
        icon: ShieldCheck,
        requiredRoles: ['super_admin', 'auditor', 'programme_manager'],
      },
      {
        title: 'Settings',
        href: '/admin/settings',
        icon: Settings,
        requiredRoles: ['super_admin'],
      },
    ],
  },
];
