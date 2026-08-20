'use client';

import React from 'react';
import { ToggleSwitch } from '../atoms/ToggleSwitch';

interface ToggleFieldProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}

export const ToggleField: React.FC<ToggleFieldProps> = ({
  title,
  description,
  checked,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="flex items-center justify-between p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl gap-4">
      <div className="space-y-0.5 pr-2">
        <p className="text-xs font-bold text-slate-900">{title}</p>
        <p className="text-2xs text-slate-500 font-medium">{description}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-2xs font-extrabold font-mono uppercase ${checked ? 'text-emerald-700' : 'text-slate-400'}`}>
          {checked ? 'ON' : 'OFF'}
        </span>
        <ToggleSwitch checked={checked} onChange={onChange} disabled={disabled} />
      </div>
    </div>
  );
};
