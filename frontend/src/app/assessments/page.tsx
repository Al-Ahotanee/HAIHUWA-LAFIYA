'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, ColumnDef } from '@/components/data-table/data-table';
import { api } from '@/lib/api-client';
import { Stethoscope, Download, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AssessmentItem {
  id: string;
  pregnancy_id: string;
  assessment_date: string;
  systolic_bp?: number;
  diastolic_bp?: number;
  weight_kg?: number;
  fundal_height_cm?: number;
  fetal_heart_rate?: number;
  gestational_age_weeks?: number;
  clinical_notes?: string;
  created_at: string;
}

interface AssessmentListResponse {
  items: AssessmentItem[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export default function ClinicalAssessmentsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<AssessmentListResponse>({
    queryKey: ['clinical-assessments', page],
    queryFn: () =>
      api.get<AssessmentListResponse>('/api/v1/assessments', {
        page,
        page_size: 15,
      }),
  });

  const columns: ColumnDef<AssessmentItem>[] = [
    {
      header: 'Assessment Date',
      accessorKey: 'assessment_date',
      cell: (row) => (
        <span className="font-medium text-foreground text-sm">
          {new Date(row.assessment_date).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      ),
    },
    {
      header: 'Blood Pressure',
      cell: (row) => {
        const isHigh = (row.systolic_bp && row.systolic_bp >= 140) || (row.diastolic_bp && row.diastolic_bp >= 90);
        return (
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-sm">
              {row.systolic_bp && row.diastolic_bp ? `${row.systolic_bp}/${row.diastolic_bp} mmHg` : '—'}
            </span>
            {isHigh && <Badge variant="destructive" className="text-[10px] px-1 py-0">High</Badge>}
          </div>
        );
      },
    },
    {
      header: 'Weight',
      accessorKey: 'weight_kg',
      cell: (row) => <span className="text-sm">{row.weight_kg ? `${row.weight_kg} kg` : '—'}</span>,
    },
    {
      header: 'Fundal Ht / FHR',
      cell: (row) => (
        <span className="text-sm">
          {row.fundal_height_cm ? `${row.fundal_height_cm}cm` : '—'} / {row.fetal_heart_rate ? `${row.fetal_heart_rate}bpm` : '—'}
        </span>
      ),
    },
    {
      header: 'Gest. Age',
      accessorKey: 'gestational_age_weeks',
      cell: (row) => (
        <span className="text-sm font-medium">
          {row.gestational_age_weeks ? `${row.gestational_age_weeks} weeks` : '—'}
        </span>
      ),
    },
    {
      header: 'Clinical Summary',
      accessorKey: 'clinical_notes',
      cell: (row) => (
        <span className="text-xs text-muted-foreground line-clamp-1 max-w-[280px]">
          {row.clinical_notes || 'Routine checkup recorded.'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Clinical Assessments
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Vital signs, obstetric measurements, and clinical observations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => router.push('/pregnancies')}>
            <Plus className="h-4 w-4" />
            <span>New Assessment</span>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Triage & Examination Registry</CardTitle>
          <CardDescription>
            Live vital signs and antenatal checkup observations synchronized with database.
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
            emptyMessage="No clinical assessments recorded."
          />
        </CardContent>
      </Card>
    </div>
  );
}
