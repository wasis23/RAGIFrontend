'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { CurrencyText } from '../atoms/CurrencyText';

interface FinancialMetricCardProps {
  title: string;
  amount: number;
  type: 'inflow' | 'outflow' | 'balance';
  countInfo?: string;
  loading?: boolean;
}

export const FinancialMetricCard: React.FC<FinancialMetricCardProps> = ({
  title,
  amount,
  type,
  countInfo,
  loading = false,
}) => {
  const isPositive = type === 'inflow';
  const isNegative = type === 'outflow';

  const icon = isPositive ? (
    <TrendingUp size={16} className="text-emerald-600 shrink-0" />
  ) : isNegative ? (
    <TrendingDown size={16} className="text-rose-600 shrink-0" />
  ) : (
    <Wallet size={16} className="text-blue-600 shrink-0" />
  );

  const variant = isPositive ? 'positive' : isNegative ? 'negative' : 'neutral';
  const prefix = isPositive ? '+' : isNegative ? '-' : 'none';

  if (loading) {
    return (
      <div className="p-4 bg-white border border-slate-200/90 rounded-xl animate-pulse space-y-2">
        <div className="h-3 w-28 bg-slate-100 rounded"></div>
        <div className="h-6 w-36 bg-slate-200 rounded"></div>
        <div className="h-3 w-20 bg-slate-100 rounded"></div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white border border-slate-200/90 rounded-xl shadow-2xs flex flex-col justify-between space-y-1.5 transition-all hover:border-slate-300">
      <div className="flex items-center justify-between">
        <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">{title}</span>
        <div className={`p-1.5 rounded-lg ${isPositive ? 'bg-emerald-50' : isNegative ? 'bg-rose-50' : 'bg-blue-50'}`}>
          {icon}
        </div>
      </div>

      <div>
        <CurrencyText value={amount} prefix={prefix} variant={variant} size="xl" />
      </div>

      {countInfo && (
        <p className="text-2xs text-slate-500 font-medium flex items-center gap-1">
          {countInfo}
        </p>
      )}
    </div>
  );
};
