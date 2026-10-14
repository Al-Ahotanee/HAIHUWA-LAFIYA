'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { usePermissions } from '@/hooks/use-permissions';
import { api } from '@/lib/api-client';
import { StatsCard } from '@/components/dashboard/stats-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ROLE_LABELS } from '@/lib/constants';
import {
  Users,
  HeartPulse,
  AlertTriangle,
  Send,
  CalendarCheck,
  Baby,
  PlusCircle,
  FileText,
  UserPlus,
  ShieldCheck,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';

interface DashboardStatsResponse {
  active_mothers?: number;
  active_pregnancies?: number;
  high_risk_pregnancies?: number;
  pending_referrals?: number;
  scheduled_visits_today?: number;
  facility_deliveries_month?: number;
}

interface RecentActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: string;
  status?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isClinical, isCHW, isFinance, isManager, isSuperAdmin } = usePermissions();

  // Fetch real statistics from API
  const {
    data: stats,
    isLoading: isStatsLoading,
    isError: isStatsError,
  } = useQuery<DashboardStatsResponse>({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get<DashboardStatsResponse>('/api/v1/dashboard/stats'),
    retry: 1,
  });

  // Fetch recent activity from API
  const {
    data: activities,
    isLoading: isActivitiesLoading,
  } = useQuery<RecentActivityItem[]>({
    queryKey: ['dashboard-activity'],
    queryFn: () => api.get<RecentActivityItem[]>('/api/v1/dashboard/activity'),
    retry: 1,
  });

  const roleName = user ? ROLE_LABELS[user.role] || user.role : 'User';

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-primary/20 bg-gradient-to-r from-emerald-50/80 via-emerald-100/30 to-background p-6 dark:from-emerald-950/30 dark:via-background sm:flex-row sm:items-center">
        <div>
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            {roleName}
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Welcome, {user?.full_name || 'Care Provider'}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Overview of maternal health metrics, active pregnancies, and routine clinical care queues.
          </p>
        </div>

        {/* Quick Primary Action */}
        <div className="flex shrink-0 items-center gap-3">
          {(isClinical || isCHW || isManager || isSuperAdmin) && (
            <Button
              onClick={() => router.push('/mothers/new')}
              className="gap-2 shadow-sm"
            >
              <UserPlus className="h-4 w-4" />
              Register Mother
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">Programme Indicators</h3>
          <span className="text-xs text-muted-foreground">Updated in real-time</span>
        </div>

        {isStatsError ? (
          <div className="rounded-lg border border-muted bg-muted/20 p-4 text-center text-sm text-muted-foreground">
            Connect backend API at /api/v1 to display live programme indicators.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Registered Mothers"
              value={stats?.active_mothers}
              icon={Users}
              isLoading={isStatsLoading}
              description="Active registered mothers"
            />
            <StatsCard
              title="Active Pregnancies"
              value={stats?.active_pregnancies}
              icon={HeartPulse}
              isLoading={isStatsLoading}
              description="Under active care"
            />
            <StatsCard
              title="High Risk Cases"
              value={stats?.high_risk_pregnancies}
              icon={AlertTriangle}
              isLoading={isStatsLoading}
              description="Requiring clinical escalation"
            />
            <StatsCard
              title="Pending Referrals"
              value={stats?.pending_referrals}
              icon={Send}
              isLoading={isStatsLoading}
              description="Awaiting facility confirmation"
            />
          </div>
        )}
      </div>

      {/* Role-Based Quick Actions Grid */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-foreground">Quick Actions</h3>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {(isClinical || isCHW || isManager || isSuperAdmin) && (
            <Button
              variant="outline"
              className="h-auto flex-col items-start p-4 hover:border-primary/50 text-left"
              onClick={() => router.push('/pregnancies/new')}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                <HeartPulse className="h-4 w-4" />
              </div>
              <span className="mt-3 font-semibold text-foreground">Register Pregnancy</span>
              <span className="mt-1 text-xs text-muted-foreground">
                Document LMP, EDD and parity
              </span>
            </Button>
          )}

          {(isClinical || isCHW || isManager || isSuperAdmin) && (
            <Button
              variant="outline"
              className="h-auto flex-col items-start p-4 hover:border-primary/50 text-left"
              onClick={() => router.push('/appointments')}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                <CalendarCheck className="h-4 w-4" />
              </div>
              <span className="mt-3 font-semibold text-foreground">ANC Appointments</span>
              <span className="mt-1 text-xs text-muted-foreground">
                Manage today’s scheduled clinic visits
              </span>
            </Button>
          )}

          {(isClinical || isCHW || isManager || isSuperAdmin) && (
            <Button
              variant="outline"
              className="h-auto flex-col items-start p-4 hover:border-primary/50 text-left"
              onClick={() => router.push('/referrals/new')}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                <Send className="h-4 w-4" />
              </div>
              <span className="mt-3 font-semibold text-foreground">Initiate Referral</span>
              <span className="mt-1 text-xs text-muted-foreground">
                Escalate emergency or specialist care
              </span>
            </Button>
          )}

          {(isClinical || isManager || isSuperAdmin) && (
            <Button
              variant="outline"
              className="h-auto flex-col items-start p-4 hover:border-primary/50 text-left"
              onClick={() => router.push('/deliveries/new')}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                <Baby className="h-4 w-4" />
              </div>
              <span className="mt-3 font-semibold text-foreground">Record Delivery</span>
              <span className="mt-1 text-xs text-muted-foreground">
                Document birth outcome & newborn
              </span>
            </Button>
          )}

          {(isFinance || isManager || isSuperAdmin) && (
            <Button
              variant="outline"
              className="h-auto flex-col items-start p-4 hover:border-primary/50 text-left"
              onClick={() => router.push('/incentives')}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                <PlusCircle className="h-4 w-4" />
              </div>
              <span className="mt-3 font-semibold text-foreground">Incentive Claims</span>
              <span className="mt-1 text-xs text-muted-foreground">
                Verify milestone disbursements
              </span>
            </Button>
          )}

          {(isManager || isSuperAdmin) && (
            <Button
              variant="outline"
              className="h-auto flex-col items-start p-4 hover:border-primary/50 text-left"
              onClick={() => router.push('/reports')}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                <FileText className="h-4 w-4" />
              </div>
              <span className="mt-3 font-semibold text-foreground">Programme Reports</span>
              <span className="mt-1 text-xs text-muted-foreground">
                ANC coverage & health outputs
              </span>
            </Button>
          )}

          {isSuperAdmin && (
            <Button
              variant="outline"
              className="h-auto flex-col items-start p-4 hover:border-primary/50 text-left"
              onClick={() => router.push('/admin/users')}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <span className="mt-3 font-semibold text-foreground">User Administration</span>
              <span className="mt-1 text-xs text-muted-foreground">
                Manage roles and credentials
              </span>
            </Button>
          )}
        </div>
      </div>

      {/* Recent Activity and Clinical Care Feed */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-base font-semibold">Recent Care Activity</CardTitle>
              <CardDescription>Latest encounters, registrations and updates</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs text-primary"
              onClick={() => router.push('/mothers')}
            >
              <span>View all</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent>
            {isActivitiesLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !activities || activities.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="No recent activity logged"
                description="Encounters, appointments and clinical registrations will appear here once recorded."
                actionLabel="Register First Mother"
                onAction={() => router.push('/mothers/new')}
              />
            ) : (
              <div className="divide-y divide-border">
                {activities.map((act) => (
                  <div key={act.id} className="flex items-start justify-between py-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">{act.title}</p>
                      <p className="text-xs text-muted-foreground">{act.description}</p>
                      <span className="text-[11px] text-muted-foreground/70">{act.timestamp}</span>
                    </div>
                    {act.status && <StatusBadge status={act.status} />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Priority Focus & Alerts Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Priority Focus Areas</CardTitle>
            <CardDescription>Actionable queues according to Northern Nigeria clinical protocols</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-foreground">High-Risk Pregnancy Alerts</h4>
                  <p className="text-xs text-muted-foreground">Hypertension, severe anaemia, previous C-section</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push('/pregnancies?risk_level=high')}
              >
                Review
              </Button>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  <CalendarCheck className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-foreground">Overdue ANC Visits</h4>
                  <p className="text-xs text-muted-foreground">Defaulter tracing queue for Community Health Workers</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push('/appointments?status=missed')}
              >
                Trace
              </Button>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                  <Send className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-foreground">In-Transit Referrals</h4>
                  <p className="text-xs text-muted-foreground">Emergency transfers requiring facility reception</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push('/referrals?status=in_transit')}
              >
                Track
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
