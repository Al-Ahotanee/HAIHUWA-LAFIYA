'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable, ColumnDef } from '@/components/data-table/data-table';
import { api } from '@/lib/api-client';
import { CalendarCheck, Search, Plus, Filter, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AppointmentItem {
  id: string;
  pregnancy_id: string;
  facility_id: string;
  visit_type: string;
  visit_number: number;
  scheduled_date: string;
  status: string;
  created_at: string;
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
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<AppointmentListResponse>({
    queryKey: ['appointments', page, searchTerm],
    queryFn: () =>
      api.get<AppointmentListResponse>('/api/v1/appointments', {
        page,
        page_size: 15,
      }),
  });

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
          {row.visit_type} #{row.visit_number}
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
        return (
          <Badge variant={isScheduled ? 'default' : 'secondary'} className="text-[10px] capitalize">
            {row.status}
          </Badge>
        );
      },
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
          <Button size="sm" className="gap-1.5" onClick={() => router.push('/dashboard')}>
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
            Live clinic schedule linked to Neon PostgreSQL database.
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
    </div>
  );
}
