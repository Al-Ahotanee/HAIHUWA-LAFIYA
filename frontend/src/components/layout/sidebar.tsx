'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navSections, NavItem } from './nav-items';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import { Heart, Activity } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';

interface SidebarProps {
  className?: string;
  onItemClick?: () => void;
}

export function Sidebar({ className, onItemClick }: SidebarProps) {
  const pathname = usePathname();
  const { hasRole } = usePermissions();

  const isItemVisible = (item: NavItem): boolean => {
    if (!item.requiredRoles || item.requiredRoles.length === 0) {
      return true;
    }
    return hasRole(item.requiredRoles);
  };

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r bg-card text-card-foreground',
        className
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 shrink-0 items-center border-b px-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 transition-opacity hover:opacity-90"
          onClick={onItemClick}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Heart className="h-5 w-5 fill-current" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold leading-tight tracking-tight text-foreground">
              {APP_NAME}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Maternal & Newborn
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <nav className="space-y-6">
          {navSections.map((section, sIdx) => {
            const visibleItems = section.items.filter(isItemVisible);
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title || `section-${sIdx}`} className="space-y-1">
                {section.title && (
                  <h3 className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                    {section.title}
                  </h3>
                )}
                <div className="mt-1 space-y-0.5">
                  {visibleItems.map((item) => {
                    const isActive =
                      item.href === '/dashboard'
                        ? pathname === '/dashboard' || pathname === '/'
                        : pathname.startsWith(item.href);

                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onItemClick}
                        className={cn(
                          'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                        )}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <Icon
                          className={cn(
                            'mr-3 h-4 w-4 shrink-0 transition-transform group-hover:scale-110',
                            isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'
                          )}
                        />
                        <span className="truncate">{item.title}</span>
                        {item.badge && (
                          <span
                            className={cn(
                              'ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold',
                              isActive
                                ? 'bg-primary-foreground/20 text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer info */}
      <div className="shrink-0 border-t p-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-emerald-600" />
          <span>System Operational</span>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground/70">
          v1.0.0 • Northern Nigeria Focus
        </p>
      </div>
    </aside>
  );
}
