'use client';

import React from 'react';
import { SectionTitle } from '../atoms/SectionTitle';
import { ToggleField } from '../molecules/ToggleField';
import { GatewayConfigData } from './GatewayConfigFormPanel';

interface AutomationSectionProps {
  config: GatewayConfigData;
  onChange: (field: keyof GatewayConfigData, val: any) => void;
}

export const AutomationSection: React.FC<AutomationSectionProps> = ({ config, onChange }) => {
  return (
    <div className="p-4 sm:p-5 bg-white border border-slate-200/90 rounded-xl space-y-4 shadow-2xs">
      <SectionTitle
        number="3"
        title="AUTOMATION & VALIDATION"
        description="Fitur otomatisasi pencairan dana & validasi nama pemilik rekening penerima."
      />

      <div className="space-y-3">
        <ToggleField
          title="Otomatisasi Disbursement (Pencairan Dana)"
          description="Izinkan sistem melakukan transfer otomatis dana kasir/pengeluaran jika disetujui pimpinan."
          checked={!!config.auto_disbursement_enabled}
          onChange={(val) => onChange('auto_disbursement_enabled', val)}
        />

        <ToggleField
          title="Validasi Nama Rekening Otomatis (Bank Account Check)"
          description="Verifikasi kesesuaian nama pemilik rekening tujuan sebelum pengeluaran cair."
          checked={!!config.account_validation_enabled}
          onChange={(val) => onChange('account_validation_enabled', val)}
        />
      </div>
    </div>
  );
};
