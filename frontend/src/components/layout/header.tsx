'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Menu, Search, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserMenu } from './user-menu';

interface HeaderProps {
  onOpenMobileMenu?: () => void;
}

export function Header({ onOpenMobileMenu }: HeaderProps) {
  const pathname = usePathname();

  const getBreadcrumbTitle = () => {
    if (!pathname || pathname === '/' || pathname === '/dashboard') {
      return 'Dashboard';
    }
    const segments = pathname.split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    return last.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
      <div className="flex items-center gap-3">
        {onOpenMobileMenu && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onOpenMobileMenu}
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        <div className="flex items-center gap-2">
          <h1 className="text-base font-semibold text-foreground sm:text-lg">
            {getBreadcrumbTitle()}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Search Bar Placeholder */}
        <div className="relative hidden w-64 md:block lg:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search mothers, IDs, facilities..."
            className="h-9 w-full bg-muted/40 pl-9 text-sm"
            aria-label="Global search"
          />
        </div>

        {/* Notifications Button */}
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
          aria-label="Notifications"
          onClick={() => {
            // Notifications drawer trigger in future iteration
          }}
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
        </Button>

        {/* User Menu */}
        <UserMenu />
      </div>
    </header>
  );
}
