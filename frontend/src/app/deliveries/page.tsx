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
import { Baby, Download, Plus, AlertTriangle, CheckCircle2 } from 'lucide-react';
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

interface PregnancyOption {
  id: string;
  mother_id: string;
  status: string;
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
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  // Modal State
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form State
  const [pregnancyId, setPregnancyId] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryMode, setDeliveryMode] = useState('vaginal');
  const [placeOfDelivery, setPlaceOfDelivery] = useState('facility');
  const [maternalOutcome, setMaternalOutcome] = useState('alive');
  const [numberOfBabies, setNumberOfBabies] = useState('1');
  const [postpartumHaemorrhage, setPostpartumHaemorrhage] = useState(false);
  const [attendedByName, setAttendedByName] = useState('');
  const [notes, setNotes] = useState('');

  // Newborn Details
  const [babySex, setBabySex] = useState('female');
  const [babyWeightGrams, setBabyWeightGrams] = useState('3200');
  const [babyApgar1, setBabyApgar1] = useState('8');
  const [babyApgar5, setBabyApgar5] = useState('9');

  // Queries
  const { data, isLoading } = useQuery<DeliveryListResponse>({
    queryKey: ['deliveries', page],
    queryFn: () =>
      api.get<DeliveryListResponse>('/api/v1/deliveries', {
        page,
        page_size: 15,
      }),
  });

  const { data: pregnanciesList } = useQuery<{ items: PregnancyOption[] }>({
    queryKey: ['pregnancies-lookup'],
    queryFn: () => api.get<{ items: PregnancyOption[] }>('/api/v1/pregnancies?page_size=50'),
    enabled: isRecordOpen,
  });

  // Mutation
  const recordDeliveryMutation = useMutation({
    mutationFn: (newDelivery: any) => api.post('/api/v1/deliveries', newDelivery),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['pregnancies'] });
      setIsRecordOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setErrorMessage(err?.response?.data?.detail || 'Failed to record delivery outcome.');
    },
  });

  const resetForm = () => {
    setPregnancyId('');
    setDeliveryDate(new Date().toISOString().split('T')[0]);
    setDeliveryMode('vaginal');
    setPlaceOfDelivery('facility');
    setMaternalOutcome('alive');
    setNumberOfBabies('1');
    setPostpartumHaemorrhage(false);
    setAttendedByName('');
    setNotes('');
    setBabySex('female');
    setBabyWeightGrams('3200');
    setBabyApgar1('8');
    setBabyApgar5('9');
    setErrorMessage('');
  };

  const handleRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!pregnancyId || !deliveryDate) {
      setErrorMessage('Please select a pregnancy episode and delivery date.');
      return;
    }

    const payload: any = {
      pregnancy_id: pregnancyId,
      delivery_date: deliveryDate,
      delivery_mode: deliveryMode,
      place_of_delivery: placeOfDelivery,
      maternal_outcome: maternalOutcome,
      number_of_babies: parseInt(numberOfBabies, 10) || 1,
      postpartum_haemorrhage: postpartumHaemorrhage,
      attended_by_name: attendedByName.trim() || undefined,
      notes: notes.trim() || undefined,
      newborns: [
        {
          birth_order: 1,
          sex: babySex,
          birth_weight_grams: parseInt(babyWeightGrams, 10) || 3000,
          apgar_1min: parseInt(babyApgar1, 10) || 8,
          apgar_5min: parseInt(babyApgar5, 10) || 9,
          status: 'alive',
        },
      ],
    };

    recordDeliveryMutation.mutate(payload);
  };

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
        <Badge variant={row.maternal_outcome === 'alive' ? 'default' : 'destructive'} className="capitalize">
          {row.maternal_outcome.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      header: 'Babies',
      accessorKey: 'number_of_babies',
      cell: (row) => (
        <span className="text-sm font-medium">
          {row.number_of_babies} baby {row.newborns && row.newborns.length > 0 && `(${row.newborns[0].sex}, ${row.newborns[0].birth_weight_grams}g)`}
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
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => {
              setErrorMessage('');
              setIsRecordOpen(true);
            }}
          >
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
            total={data?.total || 0}
            pageSize={15}
            page={page}
            pages={data?.pages}
            onPageChange={setPage}
            isLoading={isLoading}
            emptyTitle="No delivery records found in the system."
            emptyDescription="Recorded deliveries and newborn APGAR scores will appear here."
          />
        </CardContent>
      </Card>

      {/* MODAL: Record Delivery */}
      <Dialog open={isRecordOpen} onOpenChange={setIsRecordOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Baby className="h-5 w-5 text-primary" />
              Record Childbirth Delivery & Newborn
            </DialogTitle>
            <DialogDescription>
              Document labor outcome, maternal recovery, and newborn birth weights.
            </DialogDescription>
          </DialogHeader>

          {errorMessage && (
            <div className="p-3 bg-destructive/15 border border-destructive/30 rounded-md text-destructive text-sm flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleRecordSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="delPregnancy">Select Pregnancy Episode *</Label>
              <select
                id="delPregnancy"
                value={pregnancyId}
                onChange={(e) => setPregnancyId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
              >
                <option value="">Select Pregnancy...</option>
                {pregnanciesList?.items?.map((p) => (
                  <option key={p.id} value={p.id}>
                    Pregnancy #{p.id.slice(0, 8)} (Mother: {p.mother_id.slice(0, 8)})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="deliveryDate">Date of Delivery *</Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="deliveryMode">Delivery Mode *</Label>
                <select
                  id="deliveryMode"
                  value={deliveryMode}
                  onChange={(e) => setDeliveryMode(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="vaginal">Spontaneous Vaginal</option>
                  <option value="caesarean">Caesarean Section</option>
                  <option value="assisted">Assisted Vaginal (Vacuum/Forceps)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="place">Place of Delivery *</Label>
                <select
                  id="place"
                  value={placeOfDelivery}
                  onChange={(e) => setPlaceOfDelivery(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="facility">Health Facility / Hospital</option>
                  <option value="home">Home (Traditional Birth Attendant)</option>
                  <option value="en_route">En Route / In Transit</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="outcome">Maternal Outcome *</Label>
                <select
                  id="outcome"
                  value={maternalOutcome}
                  onChange={(e) => setMaternalOutcome(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="alive">Alive & Stable</option>
                  <option value="critically_ill">Critically Ill / ICU</option>
                  <option value="deceased">Maternal Death</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center space-x-2 pt-1">
                <Checkbox
                  id="pphCheck"
                  checked={postpartumHaemorrhage}
                  onCheckedChange={(checked) => setPostpartumHaemorrhage(!!checked)}
                />
                <Label htmlFor="pphCheck" className="text-sm font-semibold text-destructive cursor-pointer">
                  Postpartum Haemorrhage (PPH) Occurred
                </Label>
              </div>
            </div>

            <div className="border rounded-lg p-3 bg-muted/20 space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-1.5 text-primary">
                <Baby className="h-4 w-4" />
                Newborn Assessment
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="babySex" className="text-xs">Sex</Label>
                  <select
                    id="babySex"
                    value={babySex}
                    onChange={(e) => setBabySex(e.target.value)}
                    className="w-full h-8 text-xs rounded-md border border-input bg-background px-2"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="ambiguous">Ambiguous</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="weight" className="text-xs">Weight (g)</Label>
                  <Input
                    id="weight"
                    type="number"
                    min="500"
                    max="6500"
                    className="h-8 text-xs"
                    value={babyWeightGrams}
                    onChange={(e) => setBabyWeightGrams(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="apgar1" className="text-xs">APGAR 1 min</Label>
                  <Input
                    id="apgar1"
                    type="number"
                    min="0"
                    max="10"
                    className="h-8 text-xs"
                    value={babyApgar1}
                    onChange={(e) => setBabyApgar1(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="apgar5" className="text-xs">APGAR 5 min</Label>
                  <Input
                    id="apgar5"
                    type="number"
                    min="0"
                    max="10"
                    className="h-8 text-xs"
                    value={babyApgar5}
                    onChange={(e) => setBabyApgar5(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="attendant">Attended By (Midwife / Doctor)</Label>
              <Input
                id="attendant"
                placeholder="e.g. Midwife Fatima Sani"
                value={attendedByName}
                onChange={(e) => setAttendedByName(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsRecordOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={recordDeliveryMutation.isPending}>
                {recordDeliveryMutation.isPending ? 'Recording...' : 'Save Delivery Record'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
