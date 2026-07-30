import { cn } from '@/lib/utils';

type BadgeVariant = 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'indigo' | 'cyan' | 'orange';

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
export function UserTypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    mahasiswa: { label: 'Mahasiswa',           variant: 'blue'   },
    dosen:     { label: 'Dosen',               variant: 'green'  },
    tendik:    { label: 'Tenaga Kependidikan', variant: 'yellow' },
    admin:     { label: 'Administrator',       variant: 'red'    },
    calon_mhs: { label: 'Calon Mahasiswa',     variant: 'gray'   },
  };
  const config = map[type] ?? { label: type, variant: 'gray' as BadgeVariant };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <Badge variant={active ? 'green' : 'red'} dot>
      {active ? 'Aktif' : 'Nonaktif'}
    </Badge>
  );
}
