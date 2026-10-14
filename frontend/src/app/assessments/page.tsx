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
import { Checkbox } from '@/components/ui/checkbox';
import { api } from '@/lib/api-client';
import { Stethoscope, Download, Plus, AlertTriangle, Activity, Heart, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AssessmentItem {
  id: string;
  pregnancy_id: string;
  appointment_id?: string;
  assessment_date: string;
  systolic_bp?: number;
  diastolic_bp?: number;
  weight_kg?: number;
  temperature_c?: number;
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

interface AppointmentOption {
  id: string;
  pregnancy_id: string;
  scheduled_date: string;
}

export default function ClinicalAssessmentsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  // Modal State
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form State
  const [appointmentId, setAppointmentId] = useState('');
  const [pregnancyId, setPregnancyId] = useState('');
  const [assessmentDate, setAssessmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [systolicBp, setSystolicBp] = useState('115');
  const [diastolicBp, setDiastolicBp] = useState('75');
  const [tempC, setTempC] = useState('36.8');
  const [weightKg, setWeightKg] = useState('62.5');
  const [fundalHeight, setFundalHeight] = useState('24');
  const [fetalHeartRate, setFetalHeartRate] = useState('140');
  const [gestationalAge, setGestationalAge] = useState('24');
  const [hasSevereHeadache, setHasSevereHeadache] = useState(false);
  const [hasVisualDisturbance, setHasVisualDisturbance] = useState(false);
  const [hasVaginalBleeding, setHasVaginalBleeding] = useState(false);
  const [notes, setNotes] = useState('');

  // Queries
  const { data, isLoading } = useQuery<AssessmentListResponse>({
    queryKey: ['clinical-assessments', page],
    queryFn: () =>
      api.get<AssessmentListResponse>('/api/v1/assessments', {
        page,
        page_size: 15,
      }),
  });

  const { data: appointmentsList } = useQuery<{ items: AppointmentOption[] }>({
    queryKey: ['appointments-lookup'],
    queryFn: () => api.get<{ items: AppointmentOption[] }>('/api/v1/appointments?page_size=50'),
    enabled: isRecordOpen,
  });

  // Calculate live MEOWS (Modified Early Obstetric Warning Score)
  const calcScore = () => {
    let score = 0;
    const sys = parseInt(systolicBp, 10);
    const dia = parseInt(diastolicBp, 10);
    const temp = parseFloat(tempC);
    const fhr = parseInt(fetalHeartRate, 10);

    if (sys) {
      if (sys >= 160 || sys <= 90) score += 3;
      else if (sys >= 140) score += 2;
      else if (sys >= 130) score += 1;
    }
    if (dia) {
      if (dia >= 110 || dia <= 50) score += 3;
      else if (dia >= 90) score += 2;
      else if (dia >= 80) score += 1;
    }
    if (temp) {
      if (temp >= 38.5 || temp <= 35.0) score += 3;
      else if (temp >= 37.8 || temp <= 35.9) score += 2;
    }
    if (fhr) {
      if (fhr < 110 || fhr > 160) score += 2;
    }
    if (hasSevereHeadache || hasVisualDisturbance || hasVaginalBleeding) {
      score += 3;
    }
    return score;
  };

  const liveScore = calcScore();

  // Mutation
  const recordMutation = useMutation({
    mutationFn: (newAssess: any) => api.post('/api/v1/assessments', newAssess),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinical-assessments'] });
      queryClient.invalidateQueries({ queryKey: ['pregnancies'] });
      setIsRecordOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setErrorMessage(err?.response?.data?.detail || 'Failed to record clinical assessment.');
    },
  });

  const resetForm = () => {
    setAppointmentId('');
    setPregnancyId('');
    setAssessmentDate(new Date().toISOString().split('T')[0]);
    setSystolicBp('115');
    setDiastolicBp('75');
    setTempC('36.8');
    setWeightKg('62.5');
    setFundalHeight('24');
    setFetalHeartRate('140');
    setGestationalAge('24');
    setHasSevereHeadache(false);
    setHasVisualDisturbance(false);
    setHasVaginalBleeding(false);
    setNotes('');
    setErrorMessage('');
  };

  const handleRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!appointmentId || !pregnancyId) {
      setErrorMessage('Please link an active appointment.');
      return;
    }

    const dangerSigns = [];
    if (hasSevereHeadache) dangerSigns.push({ sign_name: 'Severe Headache', severity: 'danger' });
    if (hasVisualDisturbance) dangerSigns.push({ sign_name: 'Visual Disturbances / Blurred Vision', severity: 'danger' });
    if (hasVaginalBleeding) dangerSigns.push({ sign_name: 'Antepartum Vaginal Bleeding', severity: 'emergency' });

    const payload: any = {
      appointment_id: appointmentId,
      pregnancy_id: pregnancyId,
      assessment_date: assessmentDate,
      systolic_bp: parseInt(systolicBp, 10) || undefined,
      diastolic_bp: parseInt(diastolicBp, 10) || undefined,
      temperature_c: parseFloat(tempC) || undefined,
      weight_kg: parseFloat(weightKg) || undefined,
      fundal_height_cm: parseFloat(fundalHeight) || undefined,
      fetal_heart_rate: parseInt(fetalHeartRate, 10) || undefined,
      gestational_age_weeks: parseInt(gestationalAge, 10) || undefined,
      clinical_notes: notes.trim() || undefined,
      danger_signs: dangerSigns,
      lab_results: [],
    };

    recordMutation.mutate(payload);
  };

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
        const isElevated = (row.systolic_bp && row.systolic_bp >= 140) || (row.diastolic_bp && row.diastolic_bp >= 90);
        return (
          <div className="flex items-center gap-1.5">
            <span className={`font-semibold text-sm ${isElevated ? 'text-destructive' : 'text-foreground'}`}>
              {row.systolic_bp && row.diastolic_bp ? `${row.systolic_bp}/${row.diastolic_bp} mmHg` : '—'}
            </span>
            {isElevated && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
          </div>
        );
      },
    },
    {
      header: 'Fetal Heart Rate',
      accessorKey: 'fetal_heart_rate',
      cell: (row) => (
        <span className="text-sm font-medium">
          {row.fetal_heart_rate ? `${row.fetal_heart_rate} bpm` : '—'}
        </span>
      ),
    },
    {
      header: 'Fundal Height / GA',
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.fundal_height_cm ? `${row.fundal_height_cm} cm` : '—'} ({row.gestational_age_weeks ? `${row.gestational_age_weeks}w` : '—'})
        </span>
      ),
    },
    {
      header: 'MEOWS Triage / Notes',
      accessorKey: 'clinical_notes',
      cell: (row) => {
        const isCritical = row.clinical_notes?.includes('EMERGENCY ESCALATION') || row.clinical_notes?.includes('Score 3');
        const isWarning = row.clinical_notes?.includes('OBSERVATION');
        return (
          <div className="max-w-[320px]">
            {isCritical ? (
              <Badge variant="destructive" className="text-[10px] gap-1 mb-1">
                <ShieldAlert className="h-3 w-3" />
                Critical MEOWS Alert
              </Badge>
            ) : isWarning ? (
              <Badge variant="outline" className="text-amber-600 border-amber-400 text-[10px] gap-1 mb-1">
                <AlertTriangle className="h-3 w-3" />
                Observation Tier
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px] mb-1">
                Routine
              </Badge>
            )}
            <span className="text-xs text-muted-foreground truncate block">
              {row.clinical_notes || 'Routine vitals recorded'}
            </span>
          </div>
        );
      },
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
            Maternal vital signs, fundal growth, fetal heart auscultation, and automated MEOWS obstetric scoring
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => {
              setErrorMessage('');
              setIsRecordOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            <span>Record Assessment</span>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Assessment Registry</CardTitle>
          <CardDescription>
            Longitudinal clinical checkup logs synchronized with Neon PostgreSQL backend.
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
            emptyTitle="No clinical assessments recorded yet."
            emptyDescription="Clinical observations and MEOWS obstetric vital records will appear here."
          />
        </CardContent>
      </Card>

      {/* MODAL: Record Assessment */}
      <Dialog open={isRecordOpen} onOpenChange={setIsRecordOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Stethoscope className="h-5 w-5 text-primary" />
              Record Clinical Assessment & MEOWS
            </DialogTitle>
            <DialogDescription>
              Measure maternal vitals, screen for hypertensive disorders, and trigger automated MEOWS risk scoring.
            </DialogDescription>
          </DialogHeader>

          {errorMessage && (
            <div className="p-3 bg-destructive/15 border border-destructive/30 rounded-md text-destructive text-sm flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Real-time MEOWS score banner */}
          <div
            className={`p-3 rounded-lg border flex items-center justify-between ${
              liveScore >= 3
                ? 'bg-destructive/15 border-destructive text-destructive'
                : liveScore >= 1
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              <div>
                <span className="font-bold text-sm block">
                  MEOWS Obstetric Score: {liveScore}
                </span>
                <span className="text-xs">
                  {liveScore >= 3
                    ? 'CRITICAL ALERT: Emergency obstetric referral / senior clinician review required'
                    : liveScore >= 1
                    ? 'OBSERVATION: Repeat vitals in 30 mins / close monitoring'
                    : 'Normal range: Proceed with routine antenatal care'}
                </span>
              </div>
            </div>
            <Badge
              variant={liveScore >= 3 ? 'destructive' : liveScore >= 1 ? 'outline' : 'default'}
              className="uppercase tracking-wider text-[10px]"
            >
              {liveScore >= 3 ? 'Critical' : liveScore >= 1 ? 'Warning' : 'Normal'}
            </Badge>
          </div>

          <form onSubmit={handleRecordSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="apptSelect">Linked Appointment *</Label>
              <select
                id="apptSelect"
                value={appointmentId}
                onChange={(e) => {
                  const sel = appointmentsList?.items?.find((a) => a.id === e.target.value);
                  setAppointmentId(e.target.value);
                  if (sel) setPregnancyId(sel.pregnancy_id);
                }}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
              >
                <option value="">Select Appointment...</option>
                {appointmentsList?.items?.map((a) => (
                  <option key={a.id} value={a.id}>
                    Visit on {a.scheduled_date} (Pregnancy #{a.pregnancy_id.slice(0, 8)})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label htmlFor="sys" className="text-xs">Systolic BP</Label>
                <Input
                  id="sys"
                  type="number"
                  placeholder="120"
                  value={systolicBp}
                  onChange={(e) => setSystolicBp(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="dia" className="text-xs">Diastolic BP</Label>
                <Input
                  id="dia"
                  type="number"
                  placeholder="80"
                  value={diastolicBp}
                  onChange={(e) => setDiastolicBp(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="temp" className="text-xs">Temp (°C)</Label>
                <Input
                  id="temp"
                  type="number"
                  step="0.1"
                  placeholder="36.8"
                  value={tempC}
                  onChange={(e) => setTempC(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="weight" className="text-xs">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  placeholder="65"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="fundal" className="text-xs">Fundal Height (cm)</Label>
                <Input
                  id="fundal"
                  type="number"
                  placeholder="24"
                  value={fundalHeight}
                  onChange={(e) => setFundalHeight(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="fhr" className="text-xs">Fetal Heart Rate (bpm)</Label>
                <Input
                  id="fhr"
                  type="number"
                  placeholder="140"
                  value={fetalHeartRate}
                  onChange={(e) => setFetalHeartRate(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ga" className="text-xs">Gestational Age (weeks)</Label>
                <Input
                  id="ga"
                  type="number"
                  placeholder="24"
                  value={gestationalAge}
                  onChange={(e) => setGestationalAge(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {/* Danger Signs Screen */}
            <div className="border rounded-lg p-3 bg-muted/20 space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                Obstetric Danger Signs Screening
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="headache"
                    checked={hasSevereHeadache}
                    onCheckedChange={(c) => setHasSevereHeadache(!!c)}
                  />
                  <Label htmlFor="headache" className="text-xs cursor-pointer">Severe Headache</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="vision"
                    checked={hasVisualDisturbance}
                    onCheckedChange={(c) => setHasVisualDisturbance(!!c)}
                  />
                  <Label htmlFor="vision" className="text-xs cursor-pointer">Blurred Vision</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="bleeding"
                    checked={hasVaginalBleeding}
                    onCheckedChange={(c) => setHasVaginalBleeding(!!c)}
                  />
                  <Label htmlFor="bleeding" className="text-xs text-destructive font-medium cursor-pointer">Vaginal Bleeding</Label>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Clinical Findings & Actions</Label>
              <Input
                id="notes"
                placeholder="e.g. Prescribed methyldopa, scheduled 48h BP follow-up"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsRecordOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={recordMutation.isPending}>
                {recordMutation.isPending ? 'Saving Assessment...' : 'Save Clinical Assessment'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
