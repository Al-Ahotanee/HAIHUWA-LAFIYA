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
  Building2,
  Search,
  Plus,
  Download,
  MapPin,
  Phone,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

interface FacilityItem {
  id: string;
  name: string;
  code: string;
  facility_type: string;
  lga_id: string;
  address?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
}

interface LocationOption {
  id: string;
  name: string;
  code: string;
}

export default function FacilitiesManagementPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<FacilityItem | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [facilityType, setFacilityType] = useState('phc');
  const [selectedLga, setSelectedLga] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  // Queries
  const { data: facilities, isLoading } = useQuery<FacilityItem[]>({
    queryKey: ['admin-facilities'],
    queryFn: () => api.get<FacilityItem[]>('/api/v1/locations/facilities'),
  });

  const { data: lgas } = useQuery<LocationOption[]>({
    queryKey: ['locations-lgas'],
    queryFn: () => api.get<LocationOption[]>('/api/v1/locations/lgas'),
  });

  // Mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      setErrorMessage('');
      if (!name || !code) throw new Error('Facility name and code are required');
      if (!selectedLga) throw new Error('Please select an LGA');

      return api.post('/api/v1/locations/facilities', {
        name,
        code,
        facility_type: facilityType,
        lga_id: selectedLga,
        address: address || undefined,
        phone: phone || undefined,
        is_active: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-facilities'] });
      setIsAddOpen(false);
      setName('');
      setCode('');
      setAddress('');
      setPhone('');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || err.message || 'Failed to create facility';
      setErrorMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
    },
  });

  const filteredFacilities = (facilities || []).filter((f) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      f.name.toLowerCase().includes(term) ||
      f.code.toLowerCase().includes(term) ||
      f.facility_type.toLowerCase().includes(term)
    );
  });

  const getFacilityTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'specialist_hospital':
        return <Badge className="bg-purple-600 text-white font-mono text-xs">Specialist Hospital</Badge>;
      case 'general_hospital':
        return <Badge className="bg-blue-600 text-white font-mono text-xs">General Hospital</Badge>;
      case 'phc':
        return <Badge className="bg-emerald-600 text-white font-mono text-xs">Primary Health Centre</Badge>;
      default:
        return <Badge variant="secondary" className="font-mono text-xs capitalize">{type.replace('_', ' ')}</Badge>;
    }
  };

  const columns: ColumnDef<FacilityItem>[] = [
    {
      header: 'Facility Code',
      accessorKey: 'code',
      cell: (row) => (
        <span className="font-mono font-medium text-primary text-xs bg-primary/10 px-2 py-0.5 rounded">
          {row.code}
        </span>
      ),
    },
    {
      header: 'Facility Name',
      accessorKey: 'name',
      cell: (row) => <div className="font-medium text-foreground">{row.name}</div>,
    },
    {
      header: 'Level / Type',
      accessorKey: 'facility_type',
      cell: (row) => getFacilityTypeBadge(row.facility_type),
    },
    {
      header: 'Contact Phone',
      accessorKey: 'phone',
      cell: (row) => <span className="font-mono text-xs">{row.phone || '—'}</span>,
    },
    {
      header: 'Status',
      accessorKey: 'is_active',
      cell: (row) => (
        <Badge variant={row.is_active ? 'default' : 'secondary'} className="text-xs">
          {row.is_active ? 'Accredited' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Health Facilities Directory
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Primary healthcare centres, referral specialist hospitals, and accredited birth facilities
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
            <Download className="h-4 w-4" />
            <span>Export Registry</span>
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4" />
            <span>Register Facility</span>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search facility by name, code, or type..."
              className="pl-9 h-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Accredited Healthcare Delivery Sites</CardTitle>
          <CardDescription>
            Live synchronization active with Neon PostgreSQL backend.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredFacilities}
            total={filteredFacilities.length}
            pageSize={15}
            page={1}
            isLoading={isLoading}
            onRowClick={(row) => setSelectedFacility(row)}
            emptyTitle="No facilities registered yet"
            emptyDescription="Use the action button above to register the first primary healthcare centre."
          />
        </CardContent>
      </Card>

      {/* ================= REGISTER FACILITY MODAL ================= */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2 text-primary">
              <Building2 className="h-5 w-5" />
              Register Healthcare Facility
            </DialogTitle>
            <DialogDescription>
              Add a verified clinical site for ANC care, delivery services, and patient referrals.
            </DialogDescription>
          </DialogHeader>

          {errorMessage && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="facName">Facility Name *</Label>
              <Input
                id="facName"
                placeholder="e.g. Dala Maternal & Child Health Clinic"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="facCode">Unique Code *</Label>
                <Input
                  id="facCode"
                  placeholder="e.g. PHC-DAL"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="facType">Facility Level</Label>
                <select
                  id="facType"
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                  value={facilityType}
                  onChange={(e) => setFacilityType(e.target.value)}
                >
                  <option value="phc">Primary Health Centre</option>
                  <option value="general_hospital">General Hospital</option>
                  <option value="specialist_hospital">Specialist Hospital</option>
                  <option value="private_clinic">Private Clinic</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="facLga">Assigned LGA *</Label>
              <select
                id="facLga"
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                value={selectedLga}
                onChange={(e) => setSelectedLga(e.target.value)}
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
              <Label htmlFor="facPhone">Contact Phone</Label>
              <Input
                id="facPhone"
                placeholder="e.g. 08031112233"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="facAddress">Physical Address</Label>
              <Input
                id="facAddress"
                placeholder="e.g. Near Central Market, Dala Ward"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Registering...' : 'Register Facility'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= FACILITY DETAIL MODAL ================= */}
      <Dialog open={!!selectedFacility} onOpenChange={(open) => !open && setSelectedFacility(null)}>
        <DialogContent className="max-w-md">
          {selectedFacility && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                    {selectedFacility.code}
                  </span>
                  {getFacilityTypeBadge(selectedFacility.facility_type)}
                </div>
                <DialogTitle className="text-xl font-bold mt-2">
                  {selectedFacility.name}
                </DialogTitle>
                <DialogDescription>
                  Registered on {new Date(selectedFacility.created_at).toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-2 bg-muted/30 p-3.5 rounded-lg text-sm">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Address</p>
                    <p className="font-medium">{selectedFacility.address || 'Standard primary healthcare catchment'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 pt-2">
                  <Phone className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Emergency Contact</p>
                    <p className="font-mono font-medium">{selectedFacility.phone || '0800-HAIHUWA'}</p>
                  </div>
                </div>

                <div className="pt-2 text-xs text-muted-foreground">
                  <p>Facility UUID: <span className="font-mono text-[10px]">{selectedFacility.id}</span></p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedFacility(null)}>
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
