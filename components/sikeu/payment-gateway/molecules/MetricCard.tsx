'use client';

import { cn } from '@/lib/utils';
import { Wallet, Clock, TrendingUp } from 'lucide-react';
import { CurrencyText } from '@/components/sikeu/akuntansi/atoms/CurrencyText';

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
  const variantStyles = {
    primary: {
      card: 'bg-white border-slate-200/90 text-slate-900 shadow-2xs',
      title: 'text-slate-500 font-bold',
      textVariant: 'positive' as const,
      iconBg: 'bg-emerald-50 text-emerald-600',
      icon: Wallet,
      footer: 'border-slate-100 text-slate-400',
    },
    amber: {
      card: 'bg-white border-slate-200/90 text-slate-900 shadow-2xs',
      title: 'text-amber-800 font-bold',
      textVariant: 'negative' as const,
      iconBg: 'bg-amber-50 text-amber-600',
      icon: Clock,
      footer: 'border-slate-100 text-slate-500',
    },
    indigo: {
      card: 'bg-white border-slate-200/90 text-slate-900 shadow-2xs',
      title: 'text-indigo-800 font-bold',
      textVariant: 'neutral' as const,
      iconBg: 'bg-indigo-50 text-indigo-600',
      icon: TrendingUp,
      footer: 'border-slate-100 text-slate-500',
    },
  };

  const style = variantStyles[variant] || variantStyles.primary;
  const Icon = style.icon;

  if (loading) {
    return (
      <div className={cn('p-4 sm:p-5 bg-white border border-slate-200 rounded-xl space-y-3 animate-pulse', className)}>
        <div className="h-3 bg-slate-200 rounded w-1/2" />
        <div className="h-7 bg-slate-200 rounded w-3/4" />
        {lastUpdated && <div className="h-2 bg-slate-100 rounded w-1/3 pt-2" />}
      </div>
    );
  }

  return (
    <div className={cn('p-4 sm:p-5 bg-white border border-slate-200/90 rounded-xl flex flex-col justify-between transition-all hover:border-slate-300 shadow-2xs', className)}>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-2xs font-extrabold uppercase tracking-wider text-slate-500 line-clamp-1">{title}</span>
          <div className={cn('p-1.5 rounded-lg shrink-0', style.iconBg)}>
            <Icon size={16} />
          </div>
        </div>

        <div className="overflow-hidden">
          <CurrencyText
            value={value}
            variant={style.textVariant}
            size="lg"
            className="text-base sm:text-lg lg:text-xl font-extrabold block truncate"
          />
        </div>
      </div>

      {lastUpdated && (
        <div className="text-2xs font-mono border-t border-slate-100 pt-2.5 mt-3 flex items-center justify-between text-slate-400">
          <span>Terakhir disinkronkan:</span>
          <span className="font-semibold text-slate-600">{lastUpdated}</span>
        </div>
      )}
    </div>
  );
}
