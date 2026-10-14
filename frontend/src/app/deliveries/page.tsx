'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, ColumnDef } from '@/components/data-table/data-table';
import { api } from '@/lib/api-client';
import { Baby, Download, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface NewbornItem {
  id: string;
  newborn_id: string;
  birth_order: number;
  sex: string;
  birth_weight_grams: number;
}

interface DeliveryItem {
  id: string;
  pregnancy_id: string;
  delivery_date: string;
  delivery_mode: string;
  place_of_delivery: string;
  maternal_outcome: string;
  number_of_babies: number;
  postpartum_haemorrhage: boolean;
  notes?: string;
  newborns?: NewbornItem[];
  created_at: string;
}

interface DeliveryListResponse {
  items: DeliveryItem[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export default function LaborandDeliveryPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<DeliveryListResponse>({
    queryKey: ['deliveries', page],
    queryFn: () =>
      api.get<DeliveryListResponse>('/api/v1/deliveries', {
        page,
        page_size: 15,
      }),
  });

  const columns: ColumnDef<DeliveryItem>[] = [
    {
      header: 'Delivery Date',
      accessorKey: 'delivery_date',
      cell: (row) => (
        <span className="font-medium text-foreground text-sm">
          {new Date(row.delivery_date).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      ),
    },
    {
      header: 'Delivery Mode',
      accessorKey: 'delivery_mode',
      cell: (row) => (
        <span className="capitalize text-sm font-medium">
          {row.delivery_mode.replace('_', ' ')}
        </span>
      ),
    },
    {
      header: 'Place',
      accessorKey: 'place_of_delivery',
      cell: (row) => (
        <Badge variant={row.place_of_delivery === 'facility' ? 'outline' : 'secondary'} className="capitalize">
          {row.place_of_delivery}
        </Badge>
      ),
    },
    {
      header: 'Maternal Outcome',
      accessorKey: 'maternal_outcome',
      cell: (row) => (
        <Badge variant={row.maternal_outcome === 'alive_well' ? 'default' : 'destructive'} className="capitalize">
          {row.maternal_outcome.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      header: 'Babies',
      accessorKey: 'number_of_babies',
      cell: (row) => (
        <span className="text-sm font-medium">
          {row.number_of_babies} baby {row.newborns && row.newborns.length > 0 && `(${row.newborns[0].newborn_id})`}
        </span>
      ),
    },
    {
      header: 'PPH',
      accessorKey: 'postpartum_haemorrhage',
      cell: (row) => (
        <Badge variant={row.postpartum_haemorrhage ? 'destructive' : 'outline'}>
          {row.postpartum_haemorrhage ? 'Yes' : 'No'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Labor & Delivery
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Childbirth outcomes, delivery records, and newborn summaries
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => router.push('/pregnancies')}>
            <Plus className="h-4 w-4" />
            <span>Record Delivery</span>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Delivery Records Registry</CardTitle>
          <CardDescription>
            Live childbirth records synchronized with Neon PostgreSQL backend.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={data?.items || []}
            totalItems={data?.total || 0}
            pageSize={15}
            currentPage={page}
            onPageChange={setPage}
            isLoading={isLoading}
            emptyMessage="No delivery records found in the system."
          />
        </CardContent>
      </Card>
    </div>
  );
}
