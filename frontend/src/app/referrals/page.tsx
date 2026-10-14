'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable, ColumnDef } from '@/components/data-table/data-table';
import { api } from '@/lib/api-client';
import { Send, Search, Plus, Filter, Download, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ReferralItem {
  id: string;
  pregnancy_id: string;
  reason: string;
  clinical_summary?: string;
  urgency: string;
  transport_mode?: string;
  status: string;
  created_at: string;
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
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<ReferralListResponse>({
    queryKey: ['referrals', page, searchTerm],
    queryFn: () =>
      api.get<ReferralListResponse>('/api/v1/referrals', {
        page,
        page_size: 15,
      }),
  });

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
      cell: (row) => <span className="font-medium text-foreground">{row.reason}</span>,
    },
    {
      header: 'Urgency',
      cell: (row) => {
        const isEmergency = row.urgency === 'emergency';
        return (
          <Badge variant={isEmergency ? 'destructive' : 'outline'} className="gap-1 text-[10px] uppercase tracking-wider">
            {isEmergency && <AlertCircle className="h-3 w-3" />}
            {row.urgency}
          </Badge>
        );
      },
    },
    {
      header: 'Status',
      cell: (row) => (
        <Badge variant={row.status === 'in_transit' ? 'default' : 'secondary'} className="text-[10px] capitalize">
          {row.status.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      header: 'Transport Mode',
      accessorKey: 'transport_mode',
      cell: (row) => <span className="text-xs text-muted-foreground capitalize">{row.transport_mode || 'None'}</span>,
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
          <Button size="sm" className="gap-1.5" onClick={() => router.push('/dashboard')}>
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
            Live hospital reception status linked to Neon PostgreSQL database.
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
    </div>
  );
}
