'use client';

import React from 'react';
import { SectionTitle } from '../atoms/SectionTitle';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { GatewayConfigData } from './GatewayConfigFormPanel';

interface EnvironmentSectionProps {
  config: GatewayConfigData;
  onChange: (field: keyof GatewayConfigData, val: any) => void;
}

export const EnvironmentSection: React.FC<EnvironmentSectionProps> = ({ config, onChange }) => {
  const isSandbox = config.environment === 'sandbox';

  return (
    <div className="p-4 sm:p-5 bg-white border border-slate-200/90 rounded-xl space-y-4 shadow-2xs">
      <SectionTitle
        number="1"
        title="ENVIRONMENT & LIMIT TRANSAKSI"
        description="Pilih lingkungan transaksi server dan batas maksimum nominal otomatis."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Environment Mode *"
          value={config.environment || 'sandbox'}
          onChange={(val) => onChange('environment', val as string)}
          options={[
            { value: 'sandbox', label: 'Development (Sandbox Mode - Dummy Money)' },
            { value: 'production', label: 'Production (Live Mode - Real Money)' },
          ]}
        />

        <Input
          type="number"
          label="Max Limit Auto-Disbursement (Rp) *"
          value={config.max_disbursement_limit || 50000000}
          onChange={(e) => onChange('max_disbursement_limit', Number(e.target.value))}
          placeholder="50000000"
        />
      </div>

      {/* Info Alert Box */}
      {isSandbox ? (
        <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs font-medium text-emerald-800">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>
            Mode Sandbox (Development) aktif. Transaksi menggunakan data pengujian aman tanpa uang riil.
          </span>
        </div>
      ) : (
        <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg flex items-center gap-2 text-xs font-medium text-amber-800">
          <AlertTriangle size={16} className="text-amber-600 shrink-0" />
          <span>
            Mode Production (Live) aktif! Seluruh transaksi Virtual Account & Disbursement menggunakan uang riil.
          </span>
        </div>
      )}
    </div>
  );
};
