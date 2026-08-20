'use client';

import React from 'react';
import { CheckCircle2, Clock, FileEdit, AlertOctagon } from 'lucide-react';

export type JournalStatus = 'lunas' | 'posted' | 'pending' | 'draft' | 'void' | 'dibatalkan';

interface StatusBadgeProps {
  status: JournalStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const normStatus = (status || 'posted').toLowerCase();

  let config = {
    label: 'Posted',
    bg: 'bg-emerald-50 text-emerald-800 border-emerald-200/60',
    icon: <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />,
  };

  if (normStatus === 'lunas' || normStatus === 'posted') {
    config = {
      label: 'Lunas',
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200/60',
      icon: <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />,
    };
  } else if (normStatus === 'pending') {
    config = {
      label: 'Pending',
      bg: 'bg-amber-50 text-amber-800 border-amber-200/60',
      icon: <Clock size={12} className="text-amber-600 shrink-0" />,
    };
  } else if (normStatus === 'draft') {
    config = {
      label: 'Draft',
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      icon: <FileEdit size={12} className="text-slate-500 shrink-0" />,
    };
  } else if (normStatus === 'void' || normStatus === 'dibatalkan') {
    config = {
      label: 'Void',
      bg: 'bg-rose-50 text-rose-800 border-rose-200/60',
      icon: <AlertOctagon size={12} className="text-rose-600 shrink-0" />,
    };
  }

  const py = size === 'sm' ? 'py-0.5 px-2 text-2xs' : 'py-1 px-2.5 text-xs';

  return (
    <span className={`inline-flex items-center gap-1 font-semibold rounded-md border ${config.bg} ${py} uppercase tracking-wider`}>
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};
