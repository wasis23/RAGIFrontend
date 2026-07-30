import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export function Skeleton({ className, width, height }: SkeletonProps) {
  return (
    <div
      className={cn('skeleton', className)}
      style={{ width, height: height ?? '1rem' }}
    />
  );
}

// Skeleton preset untuk stat card
export function StatCardSkeleton() {
  return (
    <div className="stat-card">
      <Skeleton width="48px" height="48px" className="rounded-xl" />
      <Skeleton width="60%" height="0.75rem" />
      <Skeleton width="40%" height="1.5rem" />
    </div>
  );
}

// Skeleton preset untuk baris tabel
export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '0.875rem 1rem' }}>
          <Skeleton height="0.875rem" width={i === 0 ? '60%' : '80%'} />
        </td>
      ))}
    </tr>
  );
}
