import { cn } from '@/lib/utils';

type BadgeVariant = 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'indigo' | 'purple' | 'cyan' | 'orange' | 'simpeg' | 'spmb' | 'siakad' | 'sikeu' | 'lms' | 'sinapra' | 'kerjasama' | 'upm' | 'success' | 'danger' | 'warning' | 'info' | 'secondary';

interface BadgeProps {
  variant?: BadgeVariant;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'gray', dot = false, children, className }: BadgeProps) {
  return (
    <span className={cn('badge', `badge-${variant}`, dot && 'badge-dot', className)}>
      {children}
    </span>
  );
}

// ====== Preset Badges untuk user_type (sesuai ERD) ======
export function UserTypeBadge({ type }: { type?: string }) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    mahasiswa: { label: 'Mahasiswa',           variant: 'blue'   },
    dosen:     { label: 'Dosen',               variant: 'simpeg' },
    tendik:    { label: 'Tenaga Kependidikan', variant: 'simpeg' },
    admin:     { label: 'Administrator',       variant: 'red'    },
    calon_mhs: { label: 'Calon Mahasiswa',     variant: 'spmb'   },
  };
  const config = (type ? map[type] : null) ?? { label: type || 'User', variant: 'gray' as BadgeVariant };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function ModuleBadge({ module }: { module: string }) {
  const modLower = module.toLowerCase();
  const validVariant: BadgeVariant = ['simpeg', 'spmb', 'siakad', 'sikeu', 'lms', 'sinapra', 'kerjasama', 'upm'].includes(modLower) 
    ? (modLower as BadgeVariant) 
    : 'gray';
  return <Badge variant={validVariant}>{module.toUpperCase()}</Badge>;
}

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <Badge variant={active ? 'green' : 'red'} dot>
      {active ? 'Aktif' : 'Nonaktif'}
    </Badge>
  );
}
