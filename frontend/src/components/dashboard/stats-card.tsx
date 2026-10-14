'use client';

import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value?: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  isLoading?: boolean;
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  isLoading = false,
  className,
}: StatsCardProps) {
  return (
    <Card className={cn('overflow-hidden transition-all hover:shadow-md', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-4">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-4 w-36" />
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {value ?? '—'}
              </div>

              {(trend || description) && (
                <div className="mt-2 flex items-center text-xs">
                  {trend && (
                    <span
                      className={cn(
                        'mr-2 flex items-center font-medium',
                        trend.isPositive !== false ? 'text-emerald-600' : 'text-rose-600'
                      )}
                    >
                      {trend.isPositive !== false ? (
                        <TrendingUp className="mr-1 h-3.5 w-3.5" />
                      ) : (
                        <TrendingDown className="mr-1 h-3.5 w-3.5" />
                      )}
                      {trend.value > 0 ? `+${trend.value}%` : `${trend.value}%`}
                    </span>
                  )}
                  {description && (
                    <span className="text-muted-foreground">{description}</span>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
