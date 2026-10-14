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
  Send,
  Search,
  Plus,
  Filter,
  Download,
  AlertCircle,
  Truck,
  Building,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ReferralItem {
  id: string;
  pregnancy_id: string;
  referring_facility_id: string;
  receiving_facility_id: string;
  reason: string;
  clinical_findings?: string;
  treatments_given?: string;
  urgency: string;
  status: string;
  created_at: string;
}

interface FacilityOption {
  id: string;
  name: string;
  code: string;
}

interface PregnancyOption {
  id: string;
  mother_id: string;
}

interface ReferralListResponse {
  items: ReferralItem[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export default function ReferralDirectoryPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  // Modal states
  const [isInitiateOpen, setIsInitiateOpen] = useState(false);
  const [isUpdateStatusOpen, setIsUpdateStatusOpen] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<ReferralItem | null>(null);
  const [newStatus, setNewStatus] = useState('in_transit');
  const [statusNotes, setStatusNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Form states
  const [pregnancyId, setPregnancyId] = useState('');
  const [referringFacilityId, setReferringFacilityId] = useState('');
  const [receivingFacilityId, setReceivingFacilityId] = useState('');
  const [urgency, setUrgency] = useState('emergency');
  const [reason, setReason] = useState('');
  const [clinicalFindings, setClinicalFindings] = useState('');
  const [treatmentsGiven, setTreatmentsGiven] = useState('');

  // Queries
  const { data, isLoading } = useQuery<ReferralListResponse>({
    queryKey: ['referrals', page, searchTerm],
    queryFn: () =>
      api.get<ReferralListResponse>('/api/v1/referrals', {
        page,
        page_size: 15,
      }),
  });

  const { data: facilitiesList = [] } = useQuery<FacilityOption[]>({
    queryKey: ['facilities-lookup'],
    queryFn: () => api.get<FacilityOption[]>('/api/v1/locations/facilities'),
    enabled: isInitiateOpen,
  });

  const { data: pregnanciesList } = useQuery<{ items: PregnancyOption[] }>({
    queryKey: ['pregnancies-lookup'],
    queryFn: () => api.get<{ items: PregnancyOption[] }>('/api/v1/pregnancies?page_size=50'),
    enabled: isInitiateOpen,
  });

  // Mutations
  const initiateMutation = useMutation({
    mutationFn: (newRef: any) => api.post('/api/v1/referrals', newRef),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      setIsInitiateOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setErrorMessage(err?.response?.data?.detail || 'Failed to initiate referral.');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      api.patch(`/api/v1/referrals/${id}/status`, { new_status: status, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      setIsUpdateStatusOpen(false);
      setSelectedReferral(null);
    },
    onError: (err: any) => {
      setErrorMessage(err?.response?.data?.detail || 'Failed to update referral status.');
    },
  });

  const resetForm = () => {
    setPregnancyId('');
    setReferringFacilityId('');
    setReceivingFacilityId('');
    setUrgency('emergency');
    setReason('');
    setClinicalFindings('');
    setTreatmentsGiven('');
    setErrorMessage('');
  };

  const handleInitiateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!pregnancyId || !referringFacilityId || !receivingFacilityId || !reason.trim()) {
      setErrorMessage('Please fill in all mandatory fields.');
      return;
    }

    initiateMutation.mutate({
      pregnancy_id: pregnancyId,
      referring_facility_id: referringFacilityId,
      receiving_facility_id: receivingFacilityId,
      urgency,
      reason: reason.trim(),
      clinical_findings: clinicalFindings.trim() || undefined,
      treatments_given: treatmentsGiven.trim() || undefined,
    });
  };

  const handleStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReferral) return;
    updateStatusMutation.mutate({
      id: selectedReferral.id,
      status: newStatus,
      notes: statusNotes.trim() || undefined,
    });
  };

  const columns: ColumnDef<ReferralItem>[] = [
    {
      header: 'Referral ID',
      accessorKey: 'id',
      cell: (row) => (
        <span className="font-mono font-medium text-primary text-xs bg-primary/10 px-2 py-0.5 rounded">
          {row.id.slice(0, 8)}...
        </span>
      ),
    },
    {
      header: 'Referral Reason',
      accessorKey: 'reason',
      cell: (row) => <span className="font-medium text-foreground text-sm">{row.reason}</span>,
    },
    {
      header: 'Urgency',
      cell: (row) => {
        const isEmergency = row.urgency === 'emergency';
        return (
          <Badge
            variant={isEmergency ? 'destructive' : 'outline'}
            className="gap-1 text-[10px] uppercase tracking-wider"
          >
            {isEmergency && <AlertCircle className="h-3 w-3" />}
            {row.urgency}
          </Badge>
        );
      },
    },
    {
      header: 'Transit Status',
      cell: (row) => (
        <Badge
          variant={row.status === 'in_transit' ? 'default' : 'secondary'}
          className="text-[10px] capitalize"
        >
          {row.status.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      header: 'Date Initiated',
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {row.created_at ? new Date(row.created_at).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: (row) => (
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1 text-primary hover:text-primary hover:bg-primary/10"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedReferral(row);
            setNewStatus(row.status);
            setStatusNotes('');
            setIsUpdateStatusOpen(true);
          }}
        >
          <Truck className="h-3.5 w-3.5" />
          <span>Update Status</span>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Referral Directory
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Emergency transfers, triage protocols, and specialist hospital care coordination
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
              setIsInitiateOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            <span>Initiate Referral</span>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search referrals by ID, diagnosis, hospital..."
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
          <CardTitle className="text-lg font-semibold">Active Care Escalations</CardTitle>
          <CardDescription>
            Live hospital reception status linked to Neon PostgreSQL database. Click &apos;Update Status&apos; to progress triage.
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
            emptyTitle="No referrals currently recorded"
            emptyDescription="Emergency and specialist referrals will appear here with active transit status."
          />
        </CardContent>
      </Card>

      {/* MODAL: Initiate Referral */}
      <Dialog open={isInitiateOpen} onOpenChange={setIsInitiateOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Initiate Patient Referral / Transfer
            </DialogTitle>
            <DialogDescription>
              Escalate high-risk labor or obstetric complications to secondary or tertiary hospitals.
            </DialogDescription>
          </DialogHeader>

          {errorMessage && (
            <div className="p-3 bg-destructive/15 border border-destructive/30 rounded-md text-destructive text-sm flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleInitiateSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="refPregnancy">Pregnancy Episode *</Label>
              <select
                id="refPregnancy"
                value={pregnancyId}
                onChange={(e) => setPregnancyId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
              >
                <option value="">Select Pregnancy...</option>
                {pregnanciesList?.items?.map((p) => (
                  <option key={p.id} value={p.id}>
                    Pregnancy #{p.id.slice(0, 8)} (Mother: {p.mother_id.slice(0, 8)})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="fromFacility">Referring PHC / Clinic *</Label>
                <select
                  id="fromFacility"
                  value={referringFacilityId}
                  onChange={(e) => setReferringFacilityId(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  required
                >
                  <option value="">Select Referring Facility...</option>
                  {facilitiesList.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="toFacility">Receiving Hospital / Center *</Label>
                <select
                  id="toFacility"
                  value={receivingFacilityId}
                  onChange={(e) => setReceivingFacilityId(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  required
                >
                  <option value="">Select Receiving Hospital...</option>
                  {facilitiesList.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="urgencySelect">Urgency Level *</Label>
              <select
                id="urgencySelect"
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="routine">Routine (Elective Consultation)</option>
                <option value="urgent">Urgent (Within 24 Hours)</option>
                <option value="emergency">Emergency (Immediate Life-Threatening Transfer)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reason">Primary Indication / Reason *</Label>
              <Input
                id="reason"
                placeholder="e.g. Obstructed labour, severe pre-eclampsia, eclampsia, hemorrhage..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="findings">Clinical Findings</Label>
              <Input
                id="findings"
                placeholder="e.g. BP 170/110, 4+ proteinuria, fetal bradycardia 95 bpm"
                value={clinicalFindings}
                onChange={(e) => setClinicalFindings(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="treatments">Pre-referral Interventions Given</Label>
              <Input
                id="treatments"
                placeholder="e.g. IV Magnesium Sulphate loading dose 4g, IV fluids started"
                value={treatmentsGiven}
                onChange={(e) => setTreatmentsGiven(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsInitiateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={initiateMutation.isPending}>
                {initiateMutation.isPending ? 'Initiating Transfer...' : 'Initiate Referral'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: Update Referral Status */}
      <Dialog open={isUpdateStatusOpen} onOpenChange={setIsUpdateStatusOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              Update Referral Status
            </DialogTitle>
            <DialogDescription>
              Update patient transit and reception tracking.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleStatusSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="statusSelect">Transition Status *</Label>
              <select
                id="statusSelect"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="in_transit">In Transit (Dispatched/En Route)</option>
                <option value="accepted">Accepted / Arrived at Facility</option>
                <option value="completed">Completed (Treated & Discharged/Admitted)</option>
                <option value="declined">Declined (Facility Full/No Bed)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="statusNotes">Notes / Arrival Observations</Label>
              <Input
                id="statusNotes"
                placeholder="e.g. Received in ER, emergency C-section planned..."
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsUpdateStatusOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateStatusMutation.isPending}>
                {updateStatusMutation.isPending ? 'Updating...' : 'Save Status'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
