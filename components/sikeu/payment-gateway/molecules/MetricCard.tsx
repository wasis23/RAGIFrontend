import { cn } from '@/lib/utils';
import { Wallet, Clock, TrendingUp } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number;
  lastUpdated?: string;
  isPrimary?: boolean;
  variant?: 'primary' | 'amber' | 'indigo';
  loading?: boolean;
  className?: string;
}

export function MetricCard({
  title,
  value,
  lastUpdated,
  isPrimary = false,
  variant = 'primary',
  loading = false,
  className,
}: MetricCardProps) {
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const variantStyles = {
    primary: {
      card: 'bg-slate-900 border-slate-800 text-white shadow-md',
      title: 'text-slate-300',
      value: 'text-emerald-400 font-black',
      iconBg: 'bg-emerald-500/20 text-emerald-400',
      icon: Wallet,
      footer: 'border-slate-800 text-slate-400',
    },
    amber: {
      card: 'bg-white border-slate-200/80 text-slate-900 shadow-sm',
      title: 'text-amber-800 font-bold',
      value: 'text-amber-900 font-black',
      iconBg: 'bg-amber-50 text-amber-600',
      icon: Clock,
      footer: 'border-slate-100 text-slate-500',
    },
    indigo: {
      card: 'bg-white border-slate-200/80 text-slate-900 shadow-sm',
      title: 'text-indigo-800 font-bold',
      value: 'text-indigo-900 font-black',
      iconBg: 'bg-indigo-50 text-indigo-600',
      icon: TrendingUp,
      footer: 'border-slate-100 text-slate-500',
    },
  };

  const style = variantStyles[variant] || variantStyles.primary;
  const Icon = style.icon;

  if (loading) {
    return (
      <div className={cn('card p-5 sm:p-6 space-y-4 animate-pulse', isPrimary ? 'bg-slate-900' : 'bg-white')}>
        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
        {lastUpdated && <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded w-1/3 pt-2" />}
      </div>
    );
  }

  return (
    <div className={cn('card p-5 sm:p-6 flex flex-col justify-between transition-all', style.card, className)}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className={cn('text-[11px] font-extrabold uppercase tracking-wider', style.title)}>{title}</span>
          <div className={cn('p-2 rounded-xl', style.iconBg)}>
            <Icon size={18} />
          </div>
        </div>

        <div>
          <div className={cn('text-2xl sm:text-3xl font-mono tracking-tight', style.value)}>
            {formatRupiah(value)}
          </div>
        </div>
      </div>

      {lastUpdated && (
        <div className={cn('text-[10px] font-mono border-t pt-3 mt-4 flex items-center justify-between', style.footer)}>
          <span>Terakhir disinkronkan:</span>
          <span className="font-semibold">{lastUpdated}</span>
        </div>
      )}
    </div>
  );
}
