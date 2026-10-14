'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/shared/empty-state';
import { Award, Search, Plus, Filter, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MilestoneIncentivesPage() {
  const router = useRouter();

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
          <Button size="sm" className="gap-1.5" onClick={() => alert('New entry action')}>
            <Plus className="h-4 w-4" />
            <span>New Record</span>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter or search by name, ID, facility..."
                className="pl-9 h-9"
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
          <CardTitle className="text-lg font-semibold">Records Registry</CardTitle>
          <CardDescription>
            Live synchronization active with Neon PostgreSQL backend.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Award}
            title="No active records to display"
            description="No records have been filed yet for this clinical queue. Use the action button above to register the first entry."
            actionLabel="Create First Entry"
            onAction={() => alert('Create new entry modal')}
          />
        </CardContent>
      </Card>
    </div>
  );
}
