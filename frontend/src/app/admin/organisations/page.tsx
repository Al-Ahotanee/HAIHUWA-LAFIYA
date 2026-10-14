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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api-client';
import {
  Building2,
  Search,
  Plus,
  Download,
  MapPin,
  Globe2,
  FolderTree,
  Home,
  AlertTriangle,
} from 'lucide-react';

interface StateItem {
  id: string;
  name: string;
  code: string;
  created_at?: string;
}

interface LGAItem {
  id: string;
  state_id: string;
  name: string;
  code: string;
  created_at?: string;
}

interface WardItem {
  id: string;
  lga_id: string;
  name: string;
  code: string;
  created_at?: string;
}

interface CommunityItem {
  id: string;
  ward_id: string;
  name: string;
  created_at?: string;
}

export default function GeographicEntitiesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'states' | 'lgas' | 'wards' | 'communities'>('states');
  const [searchTerm, setSearchTerm] = useState('');

  // Dialog states
  const [isAddStateOpen, setIsAddStateOpen] = useState(false);
  const [isAddLgaOpen, setIsAddLgaOpen] = useState(false);
  const [isAddWardOpen, setIsAddWardOpen] = useState(false);
  const [isAddCommunityOpen, setIsAddCommunityOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form states - State
  const [stateName, setStateName] = useState('');
  const [stateCode, setStateCode] = useState('');

  // Form states - LGA
  const [lgaName, setLgaName] = useState('');
  const [lgaCode, setLgaCode] = useState('');
  const [lgaStateId, setLgaStateId] = useState('');

  // Form states - Ward
  const [wardName, setWardName] = useState('');
  const [wardCode, setWardCode] = useState('');
  const [wardLgaId, setWardLgaId] = useState('');

  // Form states - Community
  const [communityName, setCommunityName] = useState('');
  const [communityWardId, setCommunityWardId] = useState('');

  // Queries
  const { data: states = [], isLoading: isLoadingStates } = useQuery<StateItem[]>({
    queryKey: ['locations', 'states'],
    queryFn: () => api.get<StateItem[]>('/api/v1/locations/states'),
  });

  const { data: lgas = [], isLoading: isLoadingLgas } = useQuery<LGAItem[]>({
    queryKey: ['locations', 'lgas'],
    queryFn: () => api.get<LGAItem[]>('/api/v1/locations/lgas'),
  });

  const { data: wards = [], isLoading: isLoadingWards } = useQuery<WardItem[]>({
    queryKey: ['locations', 'wards'],
    queryFn: () => api.get<WardItem[]>('/api/v1/locations/wards'),
  });

  const { data: communities = [], isLoading: isLoadingCommunities } = useQuery<CommunityItem[]>({
    queryKey: ['locations', 'communities'],
    queryFn: () => api.get<CommunityItem[]>('/api/v1/locations/communities'),
  });

  // Mutations
  const createStateMutation = useMutation({
    mutationFn: (newState: { name: string; code: string }) =>
      api.post<StateItem>('/api/v1/locations/states', newState),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations', 'states'] });
      setIsAddStateOpen(false);
      setStateName('');
      setStateCode('');
      setErrorMessage('');
    },
    onError: (err: any) => {
      setErrorMessage(err?.response?.data?.detail || 'Failed to create State. Please check your inputs.');
    },
  });

  const createLgaMutation = useMutation({
    mutationFn: (newLga: { state_id: string; name: string; code: string }) =>
      api.post<LGAItem>('/api/v1/locations/lgas', newLga),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations', 'lgas'] });
      setIsAddLgaOpen(false);
      setLgaName('');
      setLgaCode('');
      setLgaStateId('');
      setErrorMessage('');
    },
    onError: (err: any) => {
      setErrorMessage(err?.response?.data?.detail || 'Failed to create LGA. Please check your inputs.');
    },
  });

  const createWardMutation = useMutation({
    mutationFn: (newWard: { lga_id: string; name: string; code: string }) =>
      api.post<WardItem>('/api/v1/locations/wards', newWard),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations', 'wards'] });
      setIsAddWardOpen(false);
      setWardName('');
      setWardCode('');
      setWardLgaId('');
      setErrorMessage('');
    },
    onError: (err: any) => {
      setErrorMessage(err?.response?.data?.detail || 'Failed to create Ward. Please check your inputs.');
    },
  });

  const createCommunityMutation = useMutation({
    mutationFn: (newComm: { ward_id: string; name: string }) =>
      api.post<CommunityItem>('/api/v1/locations/communities', newComm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations', 'communities'] });
      setIsAddCommunityOpen(false);
      setCommunityName('');
      setCommunityWardId('');
      setErrorMessage('');
    },
    onError: (err: any) => {
      setErrorMessage(err?.response?.data?.detail || 'Failed to create Community. Please check your inputs.');
    },
  });

  const handleCreateState = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!stateName.trim() || !stateCode.trim()) {
      setErrorMessage('Please fill in State Name and Code.');
      return;
    }
    createStateMutation.mutate({
      name: stateName.trim(),
      code: stateCode.trim().toUpperCase(),
    });
  };

  const handleCreateLga = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!lgaName.trim() || !lgaCode.trim() || !lgaStateId) {
      setErrorMessage('Please fill in all required fields (Name, Code, State).');
      return;
    }
    createLgaMutation.mutate({
      state_id: lgaStateId,
      name: lgaName.trim(),
      code: lgaCode.trim().toUpperCase(),
    });
  };

  const handleCreateWard = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!wardName.trim() || !wardCode.trim() || !wardLgaId) {
      setErrorMessage('Please fill in all required fields (Name, Code, LGA).');
      return;
    }
    createWardMutation.mutate({
      lga_id: wardLgaId,
      name: wardName.trim(),
      code: wardCode.trim().toUpperCase(),
    });
  };

  const handleCreateCommunity = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!communityName.trim() || !communityWardId) {
      setErrorMessage('Please fill in Community/Village Name and Parent Ward.');
      return;
    }
    createCommunityMutation.mutate({
      ward_id: communityWardId,
      name: communityName.trim(),
    });
  };

  // Filtered Data
  const filteredStates = states.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLgas = lgas.filter((l) =>
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredWards = wards.filter((w) =>
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCommunities = communities.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Column Definitions
  const stateColumns: ColumnDef<StateItem>[] = [
    {
      header: 'State Name',
      accessorKey: 'name',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Globe2 className="h-4 w-4 text-emerald-600" />
          <span className="font-semibold text-foreground text-sm">{row.name} State</span>
        </div>
      ),
    },
    {
      header: 'State Code',
      accessorKey: 'code',
      cell: (row) => (
        <span className="font-mono text-xs font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground">
          {row.code}
        </span>
      ),
    },
    {
      header: 'Associated LGAs',
      cell: (row) => {
        const count = lgas.filter((l) => l.state_id === row.id).length;
        return (
          <Badge variant="outline" className="text-xs">
            {count} LGAs Registered
          </Badge>
        );
      },
    },
  ];

  const lgaColumns: ColumnDef<LGAItem>[] = [
    {
      header: 'LGA Name',
      accessorKey: 'name',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-emerald-600" />
          <span className="font-semibold text-foreground text-sm">{row.name}</span>
        </div>
      ),
    },
    {
      header: 'LGA Code',
      accessorKey: 'code',
      cell: (row) => (
        <span className="font-mono text-xs font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground">
          {row.code}
        </span>
      ),
    },
    {
      header: 'State Jurisdiction',
      cell: (row) => {
        const stateObj = states.find((s) => s.id === row.state_id);
        return <span className="text-sm font-medium">{stateObj ? `${stateObj.name} State` : 'State Authority'}</span>;
      },
    },
    {
      header: 'Ward Count',
      cell: (row) => {
        const count = wards.filter((w) => w.lga_id === row.id).length;
        return (
          <Badge variant="outline" className="text-xs">
            {count} Wards
          </Badge>
        );
      },
    },
  ];

  const wardColumns: ColumnDef<WardItem>[] = [
    {
      header: 'Ward Name',
      accessorKey: 'name',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <FolderTree className="h-4 w-4 text-primary" />
          <span className="font-semibold text-foreground text-sm">{row.name}</span>
        </div>
      ),
    },
    {
      header: 'Ward Code',
      accessorKey: 'code',
      cell: (row) => (
        <span className="font-mono text-xs font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground">
          {row.code}
        </span>
      ),
    },
    {
      header: 'Parent LGA',
      cell: (row) => {
        const lgaObj = lgas.find((l) => l.id === row.lga_id);
        return <span className="text-sm font-medium">{lgaObj ? lgaObj.name : 'Assigned LGA'}</span>;
      },
    },
    {
      header: 'Communities',
      cell: (row) => {
        const count = communities.filter((c) => c.ward_id === row.id).length;
        return (
          <Badge variant="secondary" className="text-xs">
            {count} Villages / Towns
          </Badge>
        );
      },
    },
  ];

  const communityColumns: ColumnDef<CommunityItem>[] = [
    {
      header: 'Town / Village / Settlement',
      accessorKey: 'name',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Home className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
          <span className="font-semibold text-foreground text-sm">{row.name}</span>
        </div>
      ),
    },
    {
      header: 'Parent Ward',
      cell: (row) => {
        const wardObj = wards.find((w) => w.id === row.ward_id);
        return <span className="text-sm font-medium">{wardObj ? wardObj.name : 'Assigned Ward'}</span>;
      },
    },
    {
      header: 'Registration Date',
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {row.created_at ? new Date(row.created_at).toLocaleDateString() : 'Active'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Geographic Entities
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure administrative boundaries across Northern Nigeria: States, LGAs, Wards, and Communities/Villages
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => {
              setErrorMessage('');
              setIsAddStateOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            <span>Add State</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => {
              setErrorMessage('');
              if (states.length > 0 && !lgaStateId) setLgaStateId(states[0].id);
              setIsAddLgaOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            <span>Add LGA</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => {
              setErrorMessage('');
              if (lgas.length > 0 && !wardLgaId) setWardLgaId(lgas[0].id);
              setIsAddWardOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            <span>Add Ward</span>
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => {
              setErrorMessage('');
              if (wards.length > 0 && !communityWardId) setCommunityWardId(wards[0].id);
              setIsAddCommunityOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            <span>Add Village/Town</span>
          </Button>
        </div>
      </div>

      {/* Tabs and Search Bar */}
      <Tabs defaultValue="states" value={activeTab} onValueChange={(val: any) => setActiveTab(val)}>
        <div className="flex flex-col sm:flex-row justify-between gap-3 items-stretch sm:items-center">
          <TabsList className="grid grid-cols-4 w-full sm:w-[480px]">
            <TabsTrigger value="states">States ({states.length})</TabsTrigger>
            <TabsTrigger value="lgas">LGAs ({lgas.length})</TabsTrigger>
            <TabsTrigger value="wards">Wards ({wards.length})</TabsTrigger>
            <TabsTrigger value="communities">Villages ({communities.length})</TabsTrigger>
          </TabsList>

          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${activeTab}...`}
              className="pl-9 h-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* States Tab */}
        <TabsContent value="states" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">State Jurisdictions</CardTitle>
              <CardDescription>
                State Primary Health Care Development Agencies (SPHCDA) operating across Northern Nigeria.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={stateColumns}
                data={filteredStates}
                total={filteredStates.length}
                pageSize={15}
                page={1}
                pages={1}
                onPageChange={() => {}}
                isLoading={isLoadingStates}
                emptyTitle="No States configured"
                emptyDescription="Click 'Add State' above to add a state in Northern Nigeria."
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* LGAs Tab */}
        <TabsContent value="lgas" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">Local Government Areas (LGAs)</CardTitle>
              <CardDescription>
                Primary local administrative units coordinating community health workers and ward focal persons.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={lgaColumns}
                data={filteredLgas}
                total={filteredLgas.length}
                pageSize={15}
                page={1}
                pages={1}
                onPageChange={() => {}}
                isLoading={isLoadingLgas}
                emptyTitle="No LGAs registered yet"
                emptyDescription="Click 'Add LGA' above to register a new Local Government Area."
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Wards Tab */}
        <TabsContent value="wards" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">Electoral & Clinical Wards</CardTitle>
              <CardDescription>
                Catchment areas for Community Health Workers (CHWs) and Primary Health Facilities.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={wardColumns}
                data={filteredWards}
                total={filteredWards.length}
                pageSize={15}
                page={1}
                pages={1}
                onPageChange={() => {}}
                isLoading={isLoadingWards}
                emptyTitle="No Wards registered yet"
                emptyDescription="Click 'Add Ward' above to configure health catchment areas under an LGA."
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Communities Tab */}
        <TabsContent value="communities" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">Villages, Towns & Communities</CardTitle>
              <CardDescription>
                Local settlements for mother residence profiling and CHW doorstep outreach.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={communityColumns}
                data={filteredCommunities}
                total={filteredCommunities.length}
                pageSize={15}
                page={1}
                pages={1}
                onPageChange={() => {}}
                isLoading={isLoadingCommunities}
                emptyTitle="No Communities or Villages recorded yet"
                emptyDescription="Click 'Add Village/Town' above to register local settlements under a ward."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODAL: Add State */}
      <Dialog open={isAddStateOpen} onOpenChange={setIsAddStateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe2 className="h-5 w-5 text-primary" />
              Add State Jurisdiction
            </DialogTitle>
            <DialogDescription>
              Register a new state administrative authority (e.g., Kaduna, Katsina, Sokoto, Jigawa, Bauchi, Borno).
            </DialogDescription>
          </DialogHeader>

          {errorMessage && (
            <div className="p-3 bg-destructive/15 border border-destructive/30 rounded-md text-destructive text-sm flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleCreateState} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="stName">State Name *</Label>
              <Input
                id="stName"
                placeholder="e.g. Kaduna, Katsina, Sokoto, Jigawa, Bauchi..."
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="stCode">State Code (ISO / Abbreviation) *</Label>
              <Input
                id="stCode"
                placeholder="e.g. KAD, KTS, SOK, JIG, BAU"
                value={stateCode}
                onChange={(e) => setStateCode(e.target.value)}
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddStateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createStateMutation.isPending}>
                {createStateMutation.isPending ? 'Saving State...' : 'Save State'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: Add LGA */}
      <Dialog open={isAddLgaOpen} onOpenChange={setIsAddLgaOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Add Local Government Area (LGA)
            </DialogTitle>
            <DialogDescription>
              Create a new administrative LGA boundary linked to a state.
            </DialogDescription>
          </DialogHeader>

          {errorMessage && (
            <div className="p-3 bg-destructive/15 border border-destructive/30 rounded-md text-destructive text-sm flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleCreateLga} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="stateSelect">State Jurisdiction *</Label>
              <select
                id="stateSelect"
                value={lgaStateId}
                onChange={(e) => setLgaStateId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
              >
                <option value="">Select State...</option>
                {states.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} State ({st.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lgaName">LGA Name *</Label>
              <Input
                id="lgaName"
                placeholder="e.g. Zaria, Daura, Dutse, Katagum, Gwale..."
                value={lgaName}
                onChange={(e) => setLgaName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lgaCode">LGA Code *</Label>
              <Input
                id="lgaCode"
                placeholder="e.g. ZAR, DAU, DUT, KTG"
                value={lgaCode}
                onChange={(e) => setLgaCode(e.target.value)}
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddLgaOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createLgaMutation.isPending}>
                {createLgaMutation.isPending ? 'Saving LGA...' : 'Save LGA'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: Add Ward */}
      <Dialog open={isAddWardOpen} onOpenChange={setIsAddWardOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderTree className="h-5 w-5 text-primary" />
              Add Ward Catchment
            </DialogTitle>
            <DialogDescription>
              Create a new health catchment Ward under a Local Government Area.
            </DialogDescription>
          </DialogHeader>

          {errorMessage && (
            <div className="p-3 bg-destructive/15 border border-destructive/30 rounded-md text-destructive text-sm flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleCreateWard} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="wardLgaSelect">Parent LGA *</Label>
              <select
                id="wardLgaSelect"
                value={wardLgaId}
                onChange={(e) => setWardLgaId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
              >
                <option value="">Select LGA...</option>
                {lgas.map((lg) => (
                  <option key={lg.id} value={lg.id}>
                    {lg.name} ({lg.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="wardName">Ward Name *</Label>
              <Input
                id="wardName"
                placeholder="e.g. Tudun Wada, Kaura, Sabon Gari..."
                value={wardName}
                onChange={(e) => setWardName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="wardCode">Ward Code *</Label>
              <Input
                id="wardCode"
                placeholder="e.g. TDW, KRA, SBG"
                value={wardCode}
                onChange={(e) => setWardCode(e.target.value)}
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddWardOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createWardMutation.isPending}>
                {createWardMutation.isPending ? 'Saving Ward...' : 'Save Ward'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: Add Community / Town / Village */}
      <Dialog open={isAddCommunityOpen} onOpenChange={setIsAddCommunityOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Home className="h-5 w-5 text-primary" />
              Add Village / Settlement / Community
            </DialogTitle>
            <DialogDescription>
              Register a specific town, village, or settlement cluster under a ward for CHW outreach.
            </DialogDescription>
          </DialogHeader>

          {errorMessage && (
            <div className="p-3 bg-destructive/15 border border-destructive/30 rounded-md text-destructive text-sm flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleCreateCommunity} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="commWardSelect">Parent Ward *</Label>
              <select
                id="commWardSelect"
                value={communityWardId}
                onChange={(e) => setCommunityWardId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
              >
                <option value="">Select Ward...</option>
                {wards.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="commName">Town / Village / Settlement Name *</Label>
              <Input
                id="commName"
                placeholder="e.g. Unguwar Rimi, Danbatta Village, Kofan Fada..."
                value={communityName}
                onChange={(e) => setCommunityName(e.target.value)}
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddCommunityOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createCommunityMutation.isPending}>
                {createCommunityMutation.isPending ? 'Saving Community...' : 'Save Village/Town'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
