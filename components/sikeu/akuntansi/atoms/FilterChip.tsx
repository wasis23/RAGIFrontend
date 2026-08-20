'use client';

import React from 'react';
import { X } from 'lucide-react';

interface FilterChipProps {
  label: string;
  value: string;
  onRemove: () => void;
}

export const FilterChip: React.FC<FilterChipProps> = ({ label, value, onRemove }) => {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
      <span className="text-slate-500">{label}:</span>
      <span className="font-semibold text-slate-900">{value}</span>
      <button
        type="button"
        onClick={onRemove}
        className="p-0.5 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-900 transition"
        aria-label={`Remove filter ${label}`}
      >
        <X size={12} />
      </button>
    </span>
  );
};
