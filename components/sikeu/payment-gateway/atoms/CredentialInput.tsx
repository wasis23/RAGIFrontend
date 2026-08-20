'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface CredentialInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  isSecret?: boolean;
}

export const CredentialInput: React.FC<CredentialInputProps> = ({
  value,
  onChange,
  placeholder = 'Ketik kredensial...',
  isSecret = true,
}) => {
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success('Kredensial disalin ke clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative flex items-center">
      <input
        type={isSecret && !showSecret ? 'password' : 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-3 pr-20 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition shadow-2xs truncate"
      />

      <div className="absolute right-1.5 flex items-center gap-1 bg-white pl-1">
        {isSecret && (
          <button
            type="button"
            onClick={() => setShowSecret(!showSecret)}
            className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 hover:text-slate-800 transition"
            title={showSecret ? 'Sembunyikan Secret' : 'Tampilkan Secret'}
            aria-label="Toggle Secret"
          >
            {showSecret ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}

        <button
          type="button"
          onClick={handleCopy}
          className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 hover:text-slate-800 transition"
          title="Salin Kredensial"
          aria-label="Salin Kredensial"
        >
          {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
        </button>
      </div>
    </div>
  );
};
