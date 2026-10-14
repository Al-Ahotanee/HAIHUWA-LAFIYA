'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable, ColumnDef } from '@/components/data-table/data-table';
import { api } from '@/lib/api-client';
import { HeartPulse, Search, Plus, Filter, Download, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PregnancyItem {
  id: string;
  mother_id: string;
  gravida: number;
  parity: number;
  last_menstrual_period: string;
  estimated_date_of_delivery: string;
  gestational_age_at_booking_weeks: number;
  status: string;
  is_high_risk: boolean;
  high_risk_reasons?: string;
  created_at: string;
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
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<PregnancyListResponse>({
    queryKey: ['pregnancies', page, searchTerm],
    queryFn: () =>
      api.get<PregnancyListResponse>('/api/v1/pregnancies', {
        page,
        page_size: 15,
      }),
  });

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
          {row.estimated_date_of_delivery ? new Date(row.estimated_date_of_delivery).toLocaleDateString() : '—'}
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
          <Button size="sm" className="gap-1.5" onClick={() => router.push('/dashboard')}>
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
            Synchronized directly with Neon PostgreSQL backend.
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
            emptyTitle="No pregnancy episodes recorded"
            emptyDescription="Active pregnancies will appear here with gestational tracking."
          />
        </CardContent>
      </Card>
    </div>
  );
}
