'use client';

import React from 'react';
import { CredentialInput } from '../atoms/CredentialInput';
import { Shield } from 'lucide-react';

interface CredentialFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  helperText?: string;
  isSecret?: boolean;
}

export const CredentialField: React.FC<CredentialFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  helperText,
  isSecret = true,
}) => {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <span>{label}</span>
          {isSecret && <Shield size={12} className="text-emerald-600" />}
        </label>
      </div>

      <CredentialInput
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        isSecret={isSecret}
      />

      {helperText && <p className="text-2xs text-slate-500 font-medium">{helperText}</p>}
    </div>
  );
};
