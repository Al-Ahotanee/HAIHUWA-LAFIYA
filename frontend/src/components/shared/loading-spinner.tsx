import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
  className?: string;
  fullScreen?: boolean;
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

export function LoadingSpinner({
  size = 'md',
  label = 'Loading...',
  className,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const content = (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 p-4 text-muted-foreground',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 className={cn('animate-spin text-primary', sizeMap[size])} />
      {label && <span className="text-sm font-medium">{label}</span>}
      <span className="sr-only">{label}</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
}
