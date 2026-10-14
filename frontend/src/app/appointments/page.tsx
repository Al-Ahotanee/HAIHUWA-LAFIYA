'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable, ColumnDef } from '@/components/data-table/data-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api-client';
import {
  CalendarCheck,
  Search,
  Plus,
  Filter,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AppointmentItem {
  id: string;
  pregnancy_id: string;
  facility_id?: string;
  visit_type: string;
  scheduled_date: string;
  actual_date?: string;
  status: string;
  notes?: string;
  created_at: string;
}

interface PregnancyOption {
  id: string;
  mother_id: string;
  estimated_due_date?: string;
}

interface FacilityOption {
  id: string;
  name: string;
  code: string;
}

interface AppointmentListResponse {
  items: AppointmentItem[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export default function ClinicalAppointmentsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  // Modal states
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentItem | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Form states
  const [pregnancyId, setPregnancyId] = useState('');
  const [facilityId, setFacilityId] = useState('');
  const [visitType, setVisitType] = useState('anc');
  const [scheduledDate, setScheduledDate] = useState(
    new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');

  // Queries
  const { data, isLoading } = useQuery<AppointmentListResponse>({
    queryKey: ['appointments', page, searchTerm],
    queryFn: () =>
      api.get<AppointmentListResponse>('/api/v1/appointments', {
        page,
        page_size: 15,
      }),
  });

  const { data: pregnanciesList } = useQuery<{ items: PregnancyOption[] }>({
    queryKey: ['pregnancies-lookup'],
    queryFn: () => api.get<{ items: PregnancyOption[] }>('/api/v1/pregnancies?page_size=50'),
    enabled: isScheduleOpen,
  });

  const { data: facilitiesList = [] } = useQuery<FacilityOption[]>({
    queryKey: ['facilities-lookup'],
    queryFn: () => api.get<FacilityOption[]>('/api/v1/locations/facilities'),
    enabled: isScheduleOpen,
  });

  // Mutations
  const scheduleMutation = useMutation({
    mutationFn: (newAppointment: any) => api.post('/api/v1/appointments', newAppointment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setIsScheduleOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setErrorMessage(err?.response?.data?.detail || 'Failed to schedule appointment.');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/api/v1/appointments/${id}`, {
        status,
        actual_date: new Date().toISOString().split('T')[0],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setSelectedAppointment(null);
    },
  });

  const resetForm = () => {
    setPregnancyId('');
    setFacilityId('');
    setVisitType('anc');
    setNotes('');
    setErrorMessage('');
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!pregnancyId || !scheduledDate) {
      setErrorMessage('Please select a pregnancy episode and scheduled date.');
      return;
    }

    scheduleMutation.mutate({
      pregnancy_id: pregnancyId,
      visit_type: visitType,
      scheduled_date: scheduledDate,
      facility_id: facilityId || undefined,
      notes: notes || undefined,
    });
  };

  const columns: ColumnDef<AppointmentItem>[] = [
    {
      header: 'Appointment ID',
      accessorKey: 'id',
      cell: (row) => (
        <span className="font-mono font-medium text-primary text-xs bg-primary/10 px-2 py-0.5 rounded">
          {row.id.slice(0, 8)}...
        </span>
      ),
    },
    {
      header: 'Visit Type',
      cell: (row) => (
        <span className="font-semibold uppercase tracking-wider text-xs text-foreground">
          {row.visit_type.replace('_', ' ')}
        </span>
      ),
    },
    {
      header: 'Scheduled Date',
      cell: (row) => (
        <span className="font-medium text-foreground">
          {row.scheduled_date ? new Date(row.scheduled_date).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (row) => {
        const isScheduled = row.status === 'scheduled';
        const isCompleted = row.status === 'completed';
        return (
          <Badge
            variant={isCompleted ? 'default' : isScheduled ? 'outline' : 'secondary'}
            className="text-[10px] capitalize"
          >
            {row.status}
          </Badge>
        );
      },
    },
    {
      header: 'Notes',
      cell: (row) => (
        <span className="text-xs text-muted-foreground truncate max-w-[200px] block">
          {row.notes || '—'}
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          {row.status === 'scheduled' ? (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1 text-emerald-600 hover:text-emerald-700"
              onClick={(e) => {
                e.stopPropagation();
                updateStatusMutation.mutate({ id: row.id, status: 'completed' });
              }}
              disabled={updateStatusMutation.isPending}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Mark Attended</span>
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Done
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Clinical Appointments
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Routine antenatal visits, post-partum checkups, and defaulter tracking
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => {
              setErrorMessage('');
              setIsScheduleOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            <span>Book Visit</span>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search appointments by date, ID, type..."
                className="pl-9 h-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" className="h-9 gap-1.5 shrink-0">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span>Filters</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Scheduled Appointments Queue</CardTitle>
          <CardDescription>
            Live clinic schedule linked to Neon PostgreSQL database. Click &apos;Mark Attended&apos; to verify visits.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={data?.items || []}
            isLoading={isLoading}
            total={data?.total}
            page={data?.page}
            pageSize={data?.page_size}
            pages={data?.pages}
            onPageChange={setPage}
            emptyTitle="No scheduled appointments found"
            emptyDescription="Upcoming ANC visits will appear here with scheduled dates and status."
          />
        </CardContent>
      </Card>

      {/* MODAL: Book / Schedule Visit */}
      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-primary" />
              Schedule Clinical Visit
            </DialogTitle>
            <DialogDescription>
              Book an antenatal or post-natal checkup for an enrolled pregnancy.
            </DialogDescription>
          </DialogHeader>

          {errorMessage && (
            <div className="p-3 bg-destructive/15 border border-destructive/30 rounded-md text-destructive text-sm flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleScheduleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pregnancySelect">Pregnancy Episode *</Label>
              <select
                id="pregnancySelect"
                value={pregnancyId}
                onChange={(e) => setPregnancyId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
              >
                <option value="">Select Pregnancy...</option>
                {pregnanciesList?.items?.map((p) => (
                  <option key={p.id} value={p.id}>
                    Pregnancy #{p.id.slice(0, 8)} (Mother: {p.mother_id.slice(0, 8)}) {p.estimated_due_date ? `- EDD: ${p.estimated_due_date}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="visitType">Visit Type *</Label>
                <select
                  id="visitType"
                  value={visitType}
                  onChange={(e) => setVisitType(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="anc">ANC Routine Visit</option>
                  <option value="pnc_maternal">PNC (Maternal Checkup)</option>
                  <option value="pnc_newborn">PNC (Newborn Checkup)</option>
                  <option value="follow_up">Clinical Follow-up</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="scheduledDate">Scheduled Date *</Label>
                <Input
                  id="scheduledDate"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="facilitySelect">Designated Health Facility</Label>
              <select
                id="facilitySelect"
                value={facilityId}
                onChange={(e) => setFacilityId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Select Facility (Optional)...</option>
                {facilitiesList.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Clinical Instructions / Notes</Label>
              <Input
                id="notes"
                placeholder="e.g. Bring ultrasound scan, check Hb level..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsScheduleOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={scheduleMutation.isPending}>
                {scheduleMutation.isPending ? 'Scheduling...' : 'Save Appointment'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
