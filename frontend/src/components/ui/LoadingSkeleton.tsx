import clsx from 'clsx';

interface LoadingSkeletonProps {
  className?: string;
  count?: number;
  height?: string;
  width?: string;
}

function SkeletonLine({ className, height = 'h-4', width = 'w-full' }: LoadingSkeletonProps) {
  return (
    <div
      className={clsx(
        'animate-pulse bg-gray-200 dark:bg-gray-700 rounded',
        height,
        width,
        className
      )}
    />
  );
}

export default function LoadingSkeleton({ 
  className, 
  count = 1, 
  height = 'h-4', 
  width = 'w-full' 
}: LoadingSkeletonProps) {
  return (
    <div className={clsx('space-y-3', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonLine key={index} height={height} width={width} />
      ))}
    </div>
  );
}

// Predefined skeleton components for common use cases
export function EntryCardSkeleton() {
  return (
    <div className="card p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <SkeletonLine width="w-32" className="mb-2" />
          <SkeletonLine width="w-24" height="h-3" />
        </div>
        <SkeletonLine width="w-6" height="h-6" />
      </div>
      
      <div className="space-y-2 mb-4">
        <SkeletonLine />
        <SkeletonLine width="w-4/5" />
        <SkeletonLine width="w-3/5" />
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <SkeletonLine width="w-12" height="h-5" />
          <SkeletonLine width="w-16" height="h-5" />
          <SkeletonLine width="w-14" height="h-5" />
        </div>
        <SkeletonLine width="w-16" height="h-3" />
      </div>
    </div>
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="card p-6 animate-pulse">
      <SkeletonLine width="w-24" height="h-3" className="mb-3" />
      <SkeletonLine width="w-16" height="h-8" />
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className="card p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <SkeletonLine width="w-32" height="h-6" />
        <div className="flex gap-2">
          <SkeletonLine width="w-8" height="h-8" />
          <SkeletonLine width="w-8" height="h-8" />
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {Array.from({ length: 7 }).map((_, index) => (
          <SkeletonLine key={index} width="w-8" height="h-6" />
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, index) => (
          <SkeletonLine key={index} width="w-8" height="h-8" />
        ))}
      </div>
    </div>
  );
}