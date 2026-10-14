'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable, ColumnDef } from '@/components/data-table/data-table';
import { api } from '@/lib/api-client';
import { Users, Search, Plus, Filter, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MotherItem {
  id: string;
  mother_id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  age_at_registration?: number;
  marital_status?: string;
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

export default function MothersRegisterPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<MotherListResponse>({
    queryKey: ['mothers', page, searchTerm],
    queryFn: () =>
      api.get<MotherListResponse>('/api/v1/mothers', {
        page,
        page_size: 15,
        search: searchTerm || undefined,
      }),
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
      cell: (row) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.phone || 'No Phone'}
        </span>
      ),
    },
    {
      header: 'Age',
      accessorKey: 'age_at_registration',
      cell: (row) => <span>{row.age_at_registration ? `${row.age_at_registration} yrs` : '—'}</span>,
    },
    {
      header: 'Status',
      cell: (row) => (
        <Badge variant={row.is_active ? 'default' : 'secondary'} className="text-[10px]">
          {row.is_active ? 'Active Care' : 'Discharged'}
        </Badge>
      ),
    },
    {
      header: 'Registered',
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {row.created_at ? new Date(row.created_at).toLocaleDateString() : '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Mothers Register
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Maternal records, deduplication registry, and longitudinal patient profiles
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => router.push('/dashboard')}>
            <Plus className="h-4 w-4" />
            <span>New Mother</span>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by mother name, ID, phone..."
                className="pl-9 h-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" className="h-9 gap-1.5 shrink-0">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span>Filter Registry</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Active Programme Registry</CardTitle>
          <CardDescription>
            Live synchronization active with Neon PostgreSQL backend.
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
            emptyTitle="No mothers registered yet"
            emptyDescription="Registered mothers will appear here with clinical identification codes."
          />
        </CardContent>
      </Card>
    </div>
  );
}
