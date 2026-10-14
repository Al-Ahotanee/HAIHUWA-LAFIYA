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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { api } from '@/lib/api-client';
import {
  HeartPulse,
  Search,
  Plus,
  Filter,
  Download,
  AlertTriangle,
  Eye,
  Calendar,
  Building,
  UserCheck,
  Baby,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PregnancyItem {
  id: string;
  mother_id: string;
  gravida: number;
  parity: number;
  lmp_date?: string;
  estimated_due_date?: string;
  gestational_age_at_registration?: number;
  status: string;
  is_high_risk: boolean;
  high_risk_reasons?: string;
  facility_id?: string;
  created_at: string;
  outcome_date?: string;
}

interface MotherOption {
  id: string;
  mother_id: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

interface FacilityOption {
  id: string;
  name: string;
  code: string;
}

interface PregnancyListResponse {
  items: PregnancyItem[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export default function PregnancyTrackingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  // Modal / Sheet States
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [selectedPregnancy, setSelectedPregnancy] = useState<PregnancyItem | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Form State
  const [selectedMotherId, setSelectedMotherId] = useState('');
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [lmpDate, setLmpDate] = useState('');
  const [eddDate, setEddDate] = useState('');
  const [gravida, setGravida] = useState('1');
  const [parity, setParity] = useState('0');
  const [gestationalWeeks, setGestationalWeeks] = useState('');
  const [isHighRisk, setIsHighRisk] = useState(false);
  const [highRiskReasons, setHighRiskReasons] = useState('');

  // Auto calculate EDD when LMP changes (Naegele's rule: +1 year, -3 months, +7 days = +280 days)
  const handleLmpChange = (val: string) => {
    setLmpDate(val);
    if (val) {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        d.setDate(d.getDate() + 280);
        setEddDate(d.toISOString().split('T')[0]);
      }
    }
  };

  // Queries
  const { data, isLoading } = useQuery<PregnancyListResponse>({
    queryKey: ['pregnancies', page, searchTerm],
    queryFn: () =>
      api.get<PregnancyListResponse>('/api/v1/pregnancies', {
        page,
        page_size: 15,
      }),
  });

  const { data: mothersList } = useQuery<{ items: MotherOption[] }>({
    queryKey: ['mothers-lookup'],
    queryFn: () => api.get<{ items: MotherOption[] }>('/api/v1/mothers?page_size=50'),
    enabled: isRegisterOpen,
  });

  const { data: facilitiesList = [] } = useQuery<FacilityOption[]>({
    queryKey: ['facilities-lookup'],
    queryFn: () => api.get<FacilityOption[]>('/api/v1/locations/facilities'),
    enabled: isRegisterOpen,
  });

  // Mutation
  const registerPregnancyMutation = useMutation({
    mutationFn: (newPregnancy: any) => api.post('/api/v1/pregnancies', newPregnancy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pregnancies'] });
      setIsRegisterOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setErrorMessage(err?.response?.data?.detail || 'Failed to register pregnancy episode.');
    },
  });

  const resetForm = () => {
    setSelectedMotherId('');
    setSelectedFacilityId('');
    setLmpDate('');
    setEddDate('');
    setGravida('1');
    setParity('0');
    setGestationalWeeks('');
    setIsHighRisk(false);
    setHighRiskReasons('');
    setErrorMessage('');
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!selectedMotherId) {
      setErrorMessage('Please select a registered mother.');
      return;
    }

    const payload: any = {
      mother_id: selectedMotherId,
      gravida: parseInt(gravida, 10) || 1,
      parity: parseInt(parity, 10) || 0,
      is_high_risk: isHighRisk,
    };

    if (lmpDate) payload.lmp_date = lmpDate;
    if (eddDate) payload.estimated_due_date = eddDate;
    if (gestationalWeeks) payload.gestational_age_at_registration = parseInt(gestationalWeeks, 10);
    if (selectedFacilityId) payload.facility_id = selectedFacilityId;
    if (isHighRisk && highRiskReasons) payload.high_risk_reasons = highRiskReasons;

    registerPregnancyMutation.mutate(payload);
  };

  const columns: ColumnDef<PregnancyItem>[] = [
    {
      header: 'Pregnancy ID',
      accessorKey: 'id',
      cell: (row) => (
        <span className="font-mono font-medium text-primary text-xs bg-primary/10 px-2 py-0.5 rounded">
          {row.id.slice(0, 8)}...
        </span>
      ),
    },
    {
      header: 'Mother ID',
      accessorKey: 'mother_id',
      cell: (row) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.mother_id.slice(0, 8)}...
        </span>
      ),
    },
    {
      header: 'Gravida / Parity',
      cell: (row) => (
        <span className="font-medium text-foreground">
          G{row.gravida} P{row.parity}
        </span>
      ),
    },
    {
      header: 'Est. Due Date (EDD)',
      cell: (row) => (
        <span className="font-medium text-emerald-700 dark:text-emerald-400">
          {row.estimated_due_date ? new Date(row.estimated_due_date).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      header: 'Risk Level',
      cell: (row) =>
        row.is_high_risk ? (
          <Badge variant="destructive" className="gap-1 text-[10px]">
            <AlertTriangle className="h-3 w-3" />
            High Risk
          </Badge>
        ) : (
          <Badge variant="outline" className="text-emerald-700 dark:text-emerald-300 text-[10px]">
            Routine Care
          </Badge>
        ),
    },
    {
      header: 'Clinical Status',
      cell: (row) => (
        <Badge variant={row.status === 'active' ? 'default' : 'secondary'} className="text-[10px] capitalize">
          {row.status}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1 text-primary hover:text-primary hover:bg-primary/10"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedPregnancy(row);
          }}
        >
          <Eye className="h-3.5 w-3.5" />
          <span>Dossier</span>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Pregnancy Tracking
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Antenatal care episodes, gestational age monitoring, and high-risk case triaging
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
              setIsRegisterOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            <span>Register Pregnancy</span>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search active pregnancies..."
                className="pl-9 h-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" className="h-9 gap-1.5 shrink-0">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span>Filter Episodes</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Active Pregnancy Episodes</CardTitle>
          <CardDescription>
            Synchronized directly with Neon PostgreSQL backend. Click on any record to view the pregnancy dossier.
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
            onRowClick={(row) => setSelectedPregnancy(row)}
            emptyTitle="No pregnancy episodes recorded"
            emptyDescription="Active pregnancies will appear here with gestational tracking."
          />
        </CardContent>
      </Card>

      {/* MODAL: Register Pregnancy */}
      <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <HeartPulse className="h-5 w-5 text-primary" />
              Register Antenatal Pregnancy Episode
            </DialogTitle>
            <DialogDescription>
              Link a pregnant mother to clinical monitoring, estimate delivery date, and assess risk category.
            </DialogDescription>
          </DialogHeader>

          {errorMessage && (
            <div className="p-3 bg-destructive/15 border border-destructive/30 rounded-md text-destructive text-sm flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="motherSelect">Select Registered Mother *</Label>
              <select
                id="motherSelect"
                value={selectedMotherId}
                onChange={(e) => setSelectedMotherId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
              >
                <option value="">Choose Mother...</option>
                {mothersList?.items?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.first_name} {m.last_name} ({m.mother_id}) - {m.phone || 'No phone'}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="lmp">Last Menstrual Period (LMP)</Label>
                <Input
                  id="lmp"
                  type="date"
                  value={lmpDate}
                  onChange={(e) => handleLmpChange(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edd">Estimated Due Date (EDD)</Label>
                <Input
                  id="edd"
                  type="date"
                  value={eddDate}
                  onChange={(e) => setEddDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="gravida">Gravida (Total) *</Label>
                <Input
                  id="gravida"
                  type="number"
                  min="1"
                  max="20"
                  value={gravida}
                  onChange={(e) => setGravida(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="parity">Parity (Prior births) *</Label>
                <Input
                  id="parity"
                  type="number"
                  min="0"
                  max="20"
                  value={parity}
                  onChange={(e) => setParity(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gestationalWeeks">Weeks at Booking</Label>
                <Input
                  id="gestationalWeeks"
                  type="number"
                  min="1"
                  max="44"
                  placeholder="e.g. 12"
                  value={gestationalWeeks}
                  onChange={(e) => setGestationalWeeks(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="facilitySelect">Attending Primary Facility</Label>
              <select
                id="facilitySelect"
                value={selectedFacilityId}
                onChange={(e) => setSelectedFacilityId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Select Facility...</option>
                {facilitiesList.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-lg border border-border p-3 space-y-3 bg-muted/20">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="highRiskCheck"
                  checked={isHighRisk}
                  onCheckedChange={(checked) => setIsHighRisk(!!checked)}
                />
                <Label htmlFor="highRiskCheck" className="text-sm font-semibold text-destructive flex items-center gap-1 cursor-pointer">
                  <AlertTriangle className="h-4 w-4" />
                  Flag as High-Risk Pregnancy
                </Label>
              </div>

              {isHighRisk && (
                <div className="space-y-1.5 pt-1">
                  <Label htmlFor="highRiskReasons" className="text-xs">Clinical Risk Factors / Justification</Label>
                  <Input
                    id="highRiskReasons"
                    placeholder="e.g. Severe hypertension, prior C-section, anaemia, age < 18"
                    value={highRiskReasons}
                    onChange={(e) => setHighRiskReasons(e.target.value)}
                    required={isHighRisk}
                  />
                </div>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsRegisterOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={registerPregnancyMutation.isPending}>
                {registerPregnancyMutation.isPending ? 'Registering...' : 'Register Pregnancy'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DOSSIER SHEET: Pregnancy Clinical Details */}
      <Sheet open={!!selectedPregnancy} onOpenChange={(open) => !open && setSelectedPregnancy(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          {selectedPregnancy && (
            <>
              <SheetHeader className="pb-4 border-b">
                <div className="flex items-center justify-between">
                  <Badge variant={selectedPregnancy.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                    {selectedPregnancy.status}
                  </Badge>
                  {selectedPregnancy.is_high_risk ? (
                    <Badge variant="destructive" className="gap-1 text-xs">
                      <AlertTriangle className="h-3 w-3" />
                      High Risk
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-emerald-700 dark:text-emerald-300">
                      Routine Care
                    </Badge>
                  )}
                </div>
                <SheetTitle className="text-xl font-bold flex items-center gap-2 mt-2">
                  <HeartPulse className="h-5 w-5 text-primary" />
                  Pregnancy Episode
                </SheetTitle>
                <SheetDescription className="font-mono text-xs">
                  ID: {selectedPregnancy.id}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 py-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Obstetric Profile
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-2.5 rounded-lg border bg-muted/40">
                      <span className="text-xs text-muted-foreground block">Gravida</span>
                      <span className="font-bold text-base">{selectedPregnancy.gravida}</span>
                    </div>
                    <div className="p-2.5 rounded-lg border bg-muted/40">
                      <span className="text-xs text-muted-foreground block">Parity</span>
                      <span className="font-bold text-base">{selectedPregnancy.parity}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Gestational Timeline
                  </h4>
                  <div className="space-y-2 text-sm border rounded-lg p-3">
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">LMP Date:</span>
                      <span className="font-medium">
                        {selectedPregnancy.lmp_date ? new Date(selectedPregnancy.lmp_date).toLocaleDateString() : 'Not recorded'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">Est. Due Date (EDD):</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        {selectedPregnancy.estimated_due_date ? new Date(selectedPregnancy.estimated_due_date).toLocaleDateString() : 'Pending'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">Gestational Age at Booking:</span>
                      <span className="font-medium">
                        {selectedPregnancy.gestational_age_at_registration ? `${selectedPregnancy.gestational_age_at_registration} Weeks` : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedPregnancy.is_high_risk && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-destructive">
                      Risk Diagnosis
                    </h4>
                    <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-sm font-medium">
                      {selectedPregnancy.high_risk_reasons || 'High risk profile indicated without specific notes.'}
                    </div>
                  </div>
                )}

                <div className="space-y-3 pt-4 border-t">
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Clinical Actions
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => {
                        setSelectedPregnancy(null);
                        router.push('/appointments');
                      }}
                    >
                      <Calendar className="h-4 w-4" />
                      Book Visit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => {
                        setSelectedPregnancy(null);
                        router.push('/deliveries');
                      }}
                    >
                      <Baby className="h-4 w-4" />
                      Record Delivery
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
