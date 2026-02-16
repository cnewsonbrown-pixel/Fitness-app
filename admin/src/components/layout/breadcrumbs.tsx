'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useBreadcrumbs } from '@/hooks/use-breadcrumbs';

export function Breadcrumbs() {
  const breadcrumbs = useBreadcrumbs();

  return (
    <nav className="flex items-center space-x-1 text-sm">
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1;

        return (
          <div key={crumb.href} className="flex items-center">
            {index > 0 && <ChevronRight className="mx-1 h-4 w-4 text-muted-foreground" />}
            {isLast ? (
              <span className="font-medium text-foreground">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
