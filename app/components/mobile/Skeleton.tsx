'use client';

import { cn } from '@/app/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200 rounded',
        className
      )}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 space-y-3">
      <Skeleton className="h-40 w-full rounded-lg" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-9 w-24 rounded-full" />
      </div>
    </div>
  );
}

export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4 bg-white">
      <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-4 w-16" />
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function SearchSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-12 w-full rounded-full" />
      <div className="flex gap-2 overflow-x-auto">
        <Skeleton className="h-8 w-20 rounded-full flex-shrink-0" />
        <Skeleton className="h-8 w-24 rounded-full flex-shrink-0" />
        <Skeleton className="h-8 w-20 rounded-full flex-shrink-0" />
        <Skeleton className="h-8 w-28 rounded-full flex-shrink-0" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <ListItemSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
