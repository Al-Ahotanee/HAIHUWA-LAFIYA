'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, ColumnDef } from '@/components/data-table/data-table';
import { api } from '@/lib/api-client';
import { Award, Download, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface IncentiveClaimItem {
  id: string;
  claim_reference: string;
  rule_id: string;
  mother_id: string;
  pregnancy_id: string;
  amount: number | string;
  status: string;
  created_at: string;
}

interface IncentiveListResponse {
  items: IncentiveClaimItem[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export default function MilestoneIncentivesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<IncentiveListResponse>({
    queryKey: ['incentive-claims', page],
    queryFn: () =>
      api.get<IncentiveListResponse>('/api/v1/incentives/claims', {
        page,
        page_size: 15,
      }),
  });

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">Approved</Badge>;
      case 'paid':
        return <Badge className="bg-blue-600 text-white hover:bg-blue-700">Paid</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending Review</Badge>;
    }
  };

  const columns: ColumnDef<IncentiveClaimItem>[] = [
    {
      header: 'Claim Ref',
      accessorKey: 'claim_reference',
      cell: (row) => (
        <span className="font-mono font-medium text-primary text-xs bg-primary/10 px-2 py-0.5 rounded">
          {row.claim_reference}
        </span>
      ),
    },
    {
      header: 'Subsidy Amount',
      accessorKey: 'amount',
      cell: (row) => (
        <span className="font-semibold text-foreground text-sm">
          ₦{Number(row.amount).toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Claim Status',
      accessorKey: 'status',
      cell: (row) => getStatusBadge(row.status),
    },
    {
      header: 'Submitted Date',
      accessorKey: 'created_at',
      cell: (row) => (
        <span className="text-muted-foreground text-xs">
          {new Date(row.created_at).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Milestone Incentives
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Transport subsidies, nutritional incentives, and claim disbursements
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => router.push('/mothers')}>
            <Plus className="h-4 w-4" />
            <span>Submit Milestone Claim</span>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Incentive Claims Registry</CardTitle>
          <CardDescription>
            Live subsidy claims and verified milestone disbursements.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={data?.items || []}
            total={data?.total || 0}
            pageSize={15}
            page={page}
            pages={data?.pages}
            onPageChange={setPage}
            isLoading={isLoading}
            emptyTitle="No incentive claims found in the database."
          />
        </CardContent>
      </Card>
    </div>
  );
}
