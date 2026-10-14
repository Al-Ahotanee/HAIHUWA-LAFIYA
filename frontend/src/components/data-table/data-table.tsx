'use client';

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { Pagination } from './pagination';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ColumnDef<T> {
  id?: string;
  header: React.ReactNode | string;
  accessorKey?: keyof T;
  cell?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  isLoading?: boolean;
  total?: number;
  page?: number;
  pageSize?: number;
  pages?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (column: string) => void;
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  className?: string;
}

export function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  isLoading = false,
  total,
  page,
  pageSize,
  pages,
  onPageChange,
  onPageSizeChange,
  sortBy,
  sortOrder,
  onSort,
  onRowClick,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items to display in this list.',
  emptyActionLabel,
  onEmptyAction,
  className,
}: DataTableProps<T>) {
  const [internalSortBy, setInternalSortBy] = useState<string | undefined>(sortBy);
  const [internalSortOrder, setInternalSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (columnKey: string) => {
    if (onSort) {
      onSort(columnKey);
    } else {
      if (internalSortBy === columnKey) {
        setInternalSortOrder(internalSortOrder === 'asc' ? 'desc' : 'asc');
      } else {
        setInternalSortBy(columnKey);
        setInternalSortOrder('asc');
      }
    }
  };

  const currentSortBy = sortBy ?? internalSortBy;
  const currentSortOrder = sortOrder ?? internalSortOrder;

  return (
    <div className={cn('w-full space-y-4', className)}>
      <div className="rounded-md border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, idx) => {
                const columnKey = (column.accessorKey as string) || column.id || `col-${idx}`;
                const isSorted = currentSortBy === columnKey;

                return (
                  <TableHead key={columnKey} className={column.className}>
                    {column.sortable ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8 text-xs font-semibold data-[state=open]:bg-accent"
                        onClick={() => handleSort(columnKey)}
                      >
                        <span>{column.header}</span>
                        {isSorted ? (
                          currentSortOrder === 'asc' ? (
                            <ArrowUp className="ml-2 h-3.5 w-3.5" />
                          ) : (
                            <ArrowDown className="ml-2 h-3.5 w-3.5" />
                          )
                        ) : (
                          <ArrowUpDown className="ml-2 h-3.5 w-3.5 text-muted-foreground/60" />
                        )}
                      </Button>
                    ) : (
                      <span className="font-semibold text-foreground/80">{column.header}</span>
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: pageSize || 5 }).map((_, rowIndex) => (
                <TableRow key={`skeleton-row-${rowIndex}`}>
                  {columns.map((col, colIndex) => (
                    <TableCell key={`skeleton-cell-${rowIndex}-${colIndex}`}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48 text-center">
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    actionLabel={emptyActionLabel}
                    onAction={onEmptyAction}
                  />
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => (
                <TableRow
                  key={row.id ? String(row.id) : `row-${index}`}
                  className={cn(
                    onRowClick && 'cursor-pointer hover:bg-muted/60 transition-colors'
                  )}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map((column, colIdx) => {
                    const colKey = (column.accessorKey as string) || column.id || `col-${colIdx}`;
                    return (
                      <TableCell key={colKey} className={column.className}>
                        {column.cell
                          ? column.cell(row, index)
                          : column.accessorKey
                          ? String(row[column.accessorKey] ?? '—')
                          : '—'}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {total !== undefined &&
        page !== undefined &&
        pageSize !== undefined &&
        pages !== undefined &&
        onPageChange && (
          <Pagination
            total={total}
            page={page}
            pageSize={pageSize}
            pages={pages}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        )}
    </div>
  );
}
