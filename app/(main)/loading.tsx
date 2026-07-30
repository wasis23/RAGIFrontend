import { Skeleton } from '@/components/ui/Skeleton';

export default function MainLoading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', width: '100%' }}>
      {/* Header Skeleton */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Skeleton width="220px" height="32px" />
          <div style={{ marginTop: '0.5rem' }}>
            <Skeleton width="340px" height="18px" />
          </div>
        </div>
        <Skeleton width="140px" height="40px" />
      </div>

      {/* Main Content Skeleton Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        <Skeleton height="120px" />
        <Skeleton height="120px" />
        <Skeleton height="120px" />
        <Skeleton height="120px" />
      </div>

      {/* Big Table Skeleton */}
      <Skeleton height="350px" />
    </div>
  );
}
