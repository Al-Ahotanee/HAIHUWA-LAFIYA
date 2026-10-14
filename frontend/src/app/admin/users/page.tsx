'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, ColumnDef } from '@/components/data-table/data-table';
import { api } from '@/lib/api-client';
import { UserCog, Download, Plus, ShieldCheck } from 'lucide-react';

interface UserItem {
  id: string;
  email: string;
  full_name: string;
  role: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
}

export default function UserManagementPage() {
  const { data, isLoading } = useQuery<UserItem[]>({
    queryKey: ['admin-users'],
    queryFn: () => api.get<UserItem[]>('/api/v1/auth/users'),
  });

  const getRoleBadge = (role: string) => {
    const r = role.toLowerCase();
    if (r.includes('admin')) {
      return <Badge className="bg-red-600 text-white font-mono text-xs">{role.replace('_', ' ')}</Badge>;
    }
    if (r.includes('midwife') || r.includes('facility')) {
      return <Badge className="bg-emerald-600 text-white font-mono text-xs">{role.replace('_', ' ')}</Badge>;
    }
    if (r.includes('finance')) {
      return <Badge className="bg-amber-600 text-white font-mono text-xs">{role.replace('_', ' ')}</Badge>;
    }
    return <Badge variant="secondary" className="font-mono text-xs">{role.replace('_', ' ')}</Badge>;
  };

  const columns: ColumnDef<UserItem>[] = [
    {
      header: 'Full Name',
      accessorKey: 'full_name',
      cell: (row) => (
        <div className="font-medium text-foreground">
          {row.full_name}
        </div>
      ),
    },
    {
      header: 'Email / Username',
      accessorKey: 'email',
      cell: (row) => (
        <span className="font-mono text-xs text-muted-foreground">{row.email}</span>
      ),
    },
    {
      header: 'Assigned Role',
      accessorKey: 'role',
      cell: (row) => getRoleBadge(row.role),
    },
    {
      header: 'Phone',
      accessorKey: 'phone',
      cell: (row) => <span className="text-sm">{row.phone || '—'}</span>,
    },
    {
      header: 'Account Status',
      accessorKey: 'is_active',
      cell: (row) => (
        <Badge variant={row.is_active ? 'default' : 'destructive'} className="capitalize text-xs">
          {row.is_active ? 'Active' : 'Disabled'}
        </Badge>
      ),
    },
  ];

  const usersList = data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            User Management & Roster
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Clinical staff, CHW rosters, credentials, and role-based permissions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
            <Download className="h-4 w-4" />
            <span>Export Roster</span>
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => alert('Add User Modal')}>
            <Plus className="h-4 w-4" />
            <span>Invite Personnel</span>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Registered Staff & System Roles</CardTitle>
          <CardDescription>
            Live system accounts seeded with universal test password <code className="bg-muted px-1.5 py-0.5 rounded text-primary font-mono text-xs">Password123!</code>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={usersList}
            totalItems={usersList.length}
            pageSize={20}
            currentPage={1}
            isLoading={isLoading}
            emptyMessage="No personnel registered."
          />
        </CardContent>
      </Card>
    </div>
  );
}
