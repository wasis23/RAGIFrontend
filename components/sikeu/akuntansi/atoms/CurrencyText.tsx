'use client';

import React from 'react';

interface CurrencyTextProps {
  value: number | string | null | undefined;
  prefix?: '+' | '-' | 'auto' | 'none';
  variant?: 'positive' | 'negative' | 'neutral' | 'default';
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
  className?: string;
}

export const formatCurrency = (rawVal: number | string | null | undefined): string => {
  if (rawVal === null || rawVal === undefined) return 'Rp 0';
  const num = typeof rawVal === 'string' ? parseFloat(rawVal) : rawVal;
  if (isNaN(num)) return 'Rp 0';
  
  const absNum = Math.abs(num);
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(absNum);

  return formatted;
};

export const CurrencyText: React.FC<CurrencyTextProps> = ({
  value,
  prefix = 'none',
  variant = 'default',
  size = 'sm',
  className = '',
}) => {
  const num = typeof value === 'string' ? parseFloat(value) : value ?? 0;
  const safeNum = isNaN(num) ? 0 : num;
  const formattedText = formatCurrency(safeNum);

  let prefixSymbol = '';
  if (prefix === '+') prefixSymbol = '+ ';
  else if (prefix === '-') prefixSymbol = '− ';
  else if (prefix === 'auto') {
    if (safeNum > 0) prefixSymbol = '+ ';
    else if (safeNum < 0) prefixSymbol = '− ';
  }

  const colorClasses = {
    positive: 'text-emerald-700 font-semibold',
    negative: 'text-rose-700 font-semibold',
    neutral: 'text-slate-900 font-semibold',
    default: 'text-slate-900 font-medium',
  }[variant];

  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg font-bold',
    xl: 'text-xl sm:text-2xl font-extrabold',
  }[size];

  return (
    <span className={`font-mono tabular-nums tracking-tight ${colorClasses} ${sizeClasses} ${className}`}>
      {prefixSymbol}{formattedText}
    </span>
  );
};
