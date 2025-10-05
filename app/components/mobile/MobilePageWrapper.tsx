'use client';

import { ReactNode } from 'react';
import { cn } from '@/app/lib/utils';

interface MobilePageWrapperProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
  fullHeight?: boolean;
}

export default function MobilePageWrapper({
  children,
  className,
  noPadding = false,
  fullHeight = false,
}: MobilePageWrapperProps) {
  return (
    <div
      className={cn(
        'w-full min-h-screen md:min-h-0',
        fullHeight && 'h-full',
        !noPadding && 'px-4 py-4 md:px-6 md:py-6',
        'overflow-x-hidden',
        className
      )}
    >
      {children}
    </div>
  );
}

// Mobile-optimized container for content sections
export function MobileSection({
  children,
  className,
  title,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <section className={cn('w-full mb-6', className)}>
      {title && (
        <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
      )}
      {children}
    </section>
  );
}

// Mobile-optimized card container
export function MobileCard({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-2xl shadow-sm p-4 w-full',
        'border border-gray-100',
        onClick && 'active:scale-[0.98] transition-transform cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}

// Mobile-optimized grid
export function MobileGrid({
  children,
  columns = 1,
  className,
}: {
  children: ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
  };

  return (
    <div className={cn('grid gap-4 w-full', gridCols[columns], className)}>
      {children}
    </div>
  );
}
