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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api-client';
import {
  Users,
  Search,
  Plus,
  Download,
  Eye,
  HeartPulse,
  Calendar,
  AlertTriangle,
  FileText,
  UserCheck,
  Building,
  MapPin,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MotherItem {
  id: string;
  mother_id: string;
  first_name: string;
  last_name: string;
  other_names?: string;
  phone?: string;
  age_at_registration?: number;
  marital_status?: string;
  education_level?: string;
  occupation?: string;
  lga_id?: string;
  ward_id?: string;
  facility_id?: string;
  is_active: boolean;
  created_at: string;
}

interface MotherListResponse {
  items: MotherItem[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

interface PregnancySummary {
  id: string;
  gravida: number;
  parity: number;
  lmp_date?: string;
  estimated_due_date?: string;
  gestational_age_at_registration?: number;
  status: string;
  is_high_risk: boolean;
  high_risk_reasons?: string;
  created_at: string;
}

interface LocationOption {
  id: string;
  name: string;
  code: string;
}

export default function MothersRegisterPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [selectedMother, setSelectedMother] = useState<MotherItem | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [maritalStatus, setMaritalStatus] = useState('married');
  const [educationLevel, setEducationLevel] = useState('secondary');
  const [occupation, setOccupation] = useState('trader');
  const [selectedLga, setSelectedLga] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const [selectedFacility, setSelectedFacility] = useState('');
  const [consentGranted, setConsentGranted] = useState(true);

  // Queries
  const { data, isLoading } = useQuery<MotherListResponse>({
    queryKey: ['mothers', page, searchTerm],
    queryFn: () =>
      api.get<MotherListResponse>('/api/v1/mothers', {
        page,
        page_size: 15,
        search: searchTerm || undefined,
      }),
  });

  const { data: lgas } = useQuery<LocationOption[]>({
    queryKey: ['locations-lgas'],
    queryFn: () => api.get<LocationOption[]>('/api/v1/locations/lgas'),
  });

  const { data: wards } = useQuery<LocationOption[]>({
    queryKey: ['locations-wards', selectedLga],
    queryFn: () => api.get<LocationOption[]>('/api/v1/locations/wards', { lga_id: selectedLga || undefined }),
    enabled: !!selectedLga,
  });

  const { data: facilities } = useQuery<LocationOption[]>({
    queryKey: ['locations-facilities', selectedLga],
    queryFn: () => api.get<LocationOption[]>('/api/v1/locations/facilities', { lga_id: selectedLga || undefined }),
  });

  const { data: motherPregnancies, isLoading: isPregnanciesLoading } = useQuery<PregnancySummary[]>({
    queryKey: ['mother-pregnancies', selectedMother?.id],
    queryFn: () => api.get<PregnancySummary[]>(`/api/v1/pregnancies/mother/${selectedMother?.id}`),
    enabled: !!selectedMother?.id,
  });

  // Register Mutation
  const registerMutation = useMutation({
    mutationFn: async () => {
      setErrorMessage('');
      if (!firstName || !lastName) throw new Error('First name and last name are required');
      if (!selectedLga) throw new Error('Please select an LGA');
      if (!selectedWard) throw new Error('Please select a Ward');

      return api.post('/api/v1/mothers', {
        first_name: firstName,
        last_name: lastName,
        phone: phone || undefined,
        age_at_registration: age ? Number(age) : undefined,
        marital_status: maritalStatus,
        education_level: educationLevel,
        occupation: occupation,
        lga_id: selectedLga,
        ward_id: selectedWard,
        facility_id: selectedFacility || undefined,
        consent: consentGranted
          ? {
              consent_type: 'programme_enrollment',
              granted: true,
            }
          : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mothers'] });
      setIsRegisterOpen(false);
      // Reset form
      setFirstName('');
      setLastName('');
      setPhone('');
      setAge('');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || err.message || 'Failed to register mother';
      setErrorMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
    },
  });

  const columns: ColumnDef<MotherItem>[] = [
    {
      header: 'Mother ID',
      accessorKey: 'mother_id',
      cell: (row) => (
        <span className="font-mono font-medium text-primary text-xs bg-primary/10 px-2 py-0.5 rounded">
          {row.mother_id}
        </span>
      ),
    },
    {
      header: 'Full Name',
      cell: (row) => (
        <div className="font-medium text-foreground">
          {row.first_name} {row.last_name}
        </div>
      ),
    },
    {
      header: 'Phone Number',
      accessorKey: 'phone',
      cell: (row) => <span className="font-mono text-xs">{row.phone || '—'}</span>,
    },
    {
      header: 'Age',
      accessorKey: 'age_at_registration',
      cell: (row) => <span className="text-sm">{row.age_at_registration ? `${row.age_at_registration} yrs` : '—'}</span>,
    },
    {
      header: 'Marital Status',
      accessorKey: 'marital_status',
      cell: (row) => <span className="capitalize text-sm">{row.marital_status || '—'}</span>,
    },
    {
      header: 'Status',
      accessorKey: 'is_active',
      cell: (row) => (
        <Badge variant={row.is_active ? 'default' : 'secondary'} className="capitalize text-xs">
          {row.is_active ? 'Active Enrollee' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1 text-primary hover:bg-primary/10"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedMother(row);
          }}
        >
          <Eye className="h-3.5 w-3.5" />
          <span>View Dossier</span>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Mothers Registry
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Enrolled mothers, clinical IDs, demographics, and longitudinal maternal histories
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
            <Download className="h-4 w-4" />
            <span>Export Roster</span>
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => setIsRegisterOpen(true)}>
            <Plus className="h-4 w-4" />
            <span>Register New Mother</span>
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search mother by name, Phone number, or National Clinical ID..."
                className="pl-9 h-9"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Active Programme Registry</CardTitle>
          <CardDescription>
            Live synchronization active with Neon PostgreSQL backend. Click any record to inspect complete history.
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
            onRowClick={(row) => setSelectedMother(row)}
            emptyTitle="No mothers registered yet"
            emptyDescription="Registered mothers will appear here with clinical identification codes."
          />
        </CardContent>
      </Card>

      {/* ================= REGISTER NEW MOTHER DIALOG ================= */}
      <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2 text-primary">
              <UserCheck className="h-5 w-5" />
              Register New Mother
            </DialogTitle>
            <DialogDescription>
              Create a new maternal health record with deduplication checks and unique ID generation.
            </DialogDescription>
          </DialogHeader>

          {errorMessage && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                placeholder="e.g. Fatima"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last Name / Surname *</Label>
              <Input
                id="lastName"
                placeholder="e.g. Aliyu"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="e.g. 08023456789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="age">Age at Registration</Label>
              <Input
                id="age"
                type="number"
                placeholder="e.g. 24"
                value={age}
                onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="maritalStatus">Marital Status</Label>
              <select
                id="maritalStatus"
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                value={maritalStatus}
                onChange={(e) => setMaritalStatus(e.target.value)}
              >
                <option value="married">Married</option>
                <option value="single">Single</option>
                <option value="widowed">Widowed</option>
                <option value="divorced">Divorced</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="education">Education Level</Label>
              <select
                id="education"
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
              >
                <option value="none">No formal education</option>
                <option value="primary">Primary School</option>
                <option value="secondary">Secondary School</option>
                <option value="tertiary">Tertiary / Higher Education</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="occupation">Occupation</Label>
              <Input
                id="occupation"
                placeholder="e.g. Trader, Homemaker, Teacher"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lga">Local Government Area (LGA) *</Label>
              <select
                id="lga"
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                value={selectedLga}
                onChange={(e) => {
                  setSelectedLga(e.target.value);
                  setSelectedWard('');
                }}
              >
                <option value="">-- Select LGA --</option>
                {lgas?.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ward">Ward *</Label>
              <select
                id="ward"
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
                disabled={!selectedLga}
              >
                <option value="">-- Select Ward --</option>
                {wards?.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="facility">Assigned Primary Facility</Label>
              <select
                id="facility"
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                value={selectedFacility}
                onChange={(e) => setSelectedFacility(e.target.value)}
              >
                <option value="">-- Select Facility (Optional) --</option>
                {facilities?.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2 border-t">
            <Checkbox
              id="consent"
              checked={consentGranted}
              onCheckedChange={(val) => setConsentGranted(!!val)}
            />
            <Label htmlFor="consent" className="text-xs text-muted-foreground font-normal cursor-pointer">
              Patient informed consent granted for maternal healthcare monitoring, ANC reminders, and milestone transport subsidies.
            </Label>
          </div>

          <DialogFooter className="pt-3">
            <Button variant="outline" onClick={() => setIsRegisterOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => registerMutation.mutate()} disabled={registerMutation.isPending}>
              {registerMutation.isPending ? 'Registering...' : 'Register Mother'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= MOTHER DOSSIER DETAIL SHEET ================= */}
      <Sheet open={!!selectedMother} onOpenChange={(open) => !open && setSelectedMother(null)}>
        <SheetContent className="sm:max-w-xl w-full overflow-y-auto">
          {selectedMother && (
            <div className="space-y-6">
              <SheetHeader>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                    {selectedMother.mother_id}
                  </span>
                  <Badge variant={selectedMother.is_active ? 'default' : 'secondary'}>
                    {selectedMother.is_active ? 'Active Enrollee' : 'Inactive'}
                  </Badge>
                </div>
                <SheetTitle className="text-2xl font-bold">
                  {selectedMother.first_name} {selectedMother.last_name}
                </SheetTitle>
                <SheetDescription>
                  Enrolled on {new Date(selectedMother.created_at).toLocaleDateString()}
                </SheetDescription>
              </SheetHeader>

              <Tabs defaultValue="demographics" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="demographics">Demographics</TabsTrigger>
                  <TabsTrigger value="pregnancies">Pregnancies ({motherPregnancies?.length || 0})</TabsTrigger>
                </TabsList>

                <TabsContent value="demographics" className="space-y-4 pt-3">
                  <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 p-4 rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground">Phone Number</p>
                      <p className="font-medium font-mono">{selectedMother.phone || 'None provided'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Age at Registration</p>
                      <p className="font-medium">{selectedMother.age_at_registration || '—'} years old</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Marital Status</p>
                      <p className="font-medium capitalize">{selectedMother.marital_status || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Education Level</p>
                      <p className="font-medium capitalize">{selectedMother.education_level || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Occupation</p>
                      <p className="font-medium capitalize">{selectedMother.occupation || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Database UUID</p>
                      <p className="font-mono text-[10px] truncate">{selectedMother.id}</p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-foreground">
                      <FileText className="h-4 w-4 text-primary" />
                      Clinical Quick Actions
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs"
                        onClick={() => router.push('/pregnancies')}
                      >
                        <HeartPulse className="h-3.5 w-3.5 text-rose-500" />
                        <span>Register Pregnancy</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs"
                        onClick={() => router.push('/appointments')}
                      >
                        <Calendar className="h-3.5 w-3.5 text-blue-500" />
                        <span>Schedule Visit</span>
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="pregnancies" className="space-y-3 pt-3">
                  {isPregnanciesLoading ? (
                    <p className="text-sm text-muted-foreground">Loading obstetric timeline...</p>
                  ) : !motherPregnancies || motherPregnancies.length === 0 ? (
                    <div className="text-center p-6 bg-muted/20 rounded-lg">
                      <HeartPulse className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                      <p className="text-sm font-medium">No recorded pregnancies</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Use the pregnancy registration module to open an antenatal care episode.
                      </p>
                      <Button
                        size="sm"
                        className="mt-3 gap-1.5 text-xs"
                        onClick={() => router.push('/pregnancies')}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Book Pregnancy</span>
                      </Button>
                    </div>
                  ) : (
                    motherPregnancies.map((p) => (
                      <Card key={p.id} className="overflow-hidden">
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm">
                              Gravida {p.gravida}, Parity {p.parity}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {p.is_high_risk && (
                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                  High Risk
                                </Badge>
                              )}
                              <Badge variant={p.status === 'active' ? 'default' : 'secondary'} className="capitalize text-[10px]">
                                {p.status}
                              </Badge>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-1">
                            <div>
                              <span>LMP: </span>
                              <span className="font-medium text-foreground">{p.lmp_date || '—'}</span>
                            </div>
                            <div>
                              <span>EDD: </span>
                              <span className="font-medium text-foreground">{p.estimated_due_date || '—'}</span>
                            </div>
                          </div>

                          {p.high_risk_reasons && (
                            <div className="bg-destructive/10 text-destructive text-xs p-2 rounded mt-2">
                              <strong>Clinical alert:</strong> {p.high_risk_reasons}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
