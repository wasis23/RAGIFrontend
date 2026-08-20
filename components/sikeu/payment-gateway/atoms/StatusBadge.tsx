import { cn } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, XCircle, MinusCircle } from 'lucide-react';

export type StatusBadgeVariant = 'active' | 'warning' | 'error' | 'inactive';

interface StatusBadgeProps {
  status: StatusBadgeVariant;
  text?: string;
  className?: string;
}

export function StatusBadge({ status, text, className }: StatusBadgeProps) {
  const configs = {
    active: {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-500',
      icon: CheckCircle2,
      label: 'Active Gateway',
    },
    warning: {
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      dot: 'bg-amber-500',
      icon: AlertTriangle,
      label: 'Needs Attention',
    },
    error: {
      bg: 'bg-rose-50 text-rose-800 border-rose-200',
      dot: 'bg-rose-500',
      icon: XCircle,
      label: 'Connection Error',
    },
    inactive: {
      bg: 'bg-slate-100 text-slate-600 border-slate-200',
      dot: 'bg-slate-400',
      icon: MinusCircle,
      label: 'Inactive',
    },
  };

  const current = configs[status] || configs.inactive;
  const Icon = current.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold transition-colors',
        current.bg,
        className
      )}
    >
      <span className={cn('w-2 h-2 rounded-full', current.dot)} />
      <Icon size={13} className="shrink-0" />
      <span>{text || current.label}</span>
    </span>
  );
}
