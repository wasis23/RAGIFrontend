'use client';

import React from 'react';
import { SectionTitle } from '../atoms/SectionTitle';
import { CredentialField } from '../molecules/CredentialField';
import { Lock } from 'lucide-react';
import { GatewayConfigData } from './GatewayConfigFormPanel';

interface H2hConnectionSectionProps {
  config: GatewayConfigData;
  onChange: (field: keyof GatewayConfigData, val: any) => void;
}

export const H2hConnectionSection: React.FC<H2hConnectionSectionProps> = ({
  config,
  onChange,
}) => {
  return (
    <div className="p-4 sm:p-5 bg-white border border-slate-200/90 rounded-xl space-y-4 shadow-2xs">
      <SectionTitle
        number="2"
        title="KONEKSI BRIDGE H2H BTN SYARIAH"
        description="URL API dan lokasi server bridge Go (indonusa_h2h_v2). Nilai di sini menggantikan .env (H2H_*)."
      />

      <div className="space-y-3.5">
        <CredentialField
          label="URL API Bridge *"
          value={config.base_url || ''}
          onChange={(val) => onChange('base_url', val)}
          placeholder="http://192.168.1.50:3002"
          helperText="Alamat HTTP bridge Go, tanpa garis miring di akhir."
          isSecret={false}
        />

        <CredentialField
          label="Lokasi Server Bridge"
          value={config.server_location || ''}
          onChange={(val) => onChange('server_location', val)}
          placeholder="Ruang Server Lt.2 / 192.168.1.50"
          helperText="Keterangan lokasi fisik / hostname server bridge untuk dokumentasi operasional."
          isSecret={false}
        />

        <CredentialField
          label="Token Bridge (Header sopingi-sikeu)"
          value={config.api_key || ''}
          onChange={(val) => onChange('api_key', val)}
          placeholder="Token otentikasi bridge..."
          helperText="Token yang dikirim sebagai header sopingi-sikeu saat menerbitkan billing."
          isSecret={true}
        />
      </div>

      <div className="pt-1 space-y-3.5">
        <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
          Database Bridge (tabel va_billings)
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <CredentialField
            label="DB Host"
            value={config.db_host || ''}
            onChange={(val) => onChange('db_host', val)}
            placeholder="192.168.1.50"
            isSecret={false}
          />
          <CredentialField
            label="DB Port"
            value={String(config.db_port ?? '3306')}
            onChange={(val) => onChange('db_port', val)}
            placeholder="3306"
            isSecret={false}
          />
          <CredentialField
            label="Nama Database"
            value={config.db_name || ''}
            onChange={(val) => onChange('db_name', val)}
            placeholder="sikeudb"
            isSecret={false}
          />
          <CredentialField
            label="DB Username"
            value={config.db_username || ''}
            onChange={(val) => onChange('db_username', val)}
            placeholder="h2huser"
            isSecret={false}
          />
        </div>

        <CredentialField
          label="DB Password"
          value={config.db_password || ''}
          onChange={(val) => onChange('db_password', val)}
          placeholder="Kosongkan bila tidak berubah..."
          helperText="Hanya diisi saat membuat atau mengganti password. Dikosongkan = tidak diubah."
          isSecret={true}
        />
      </div>

      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2 text-2xs text-slate-600 font-medium">
        <Lock size={14} className="text-emerald-600 shrink-0" />
        <span>
          Token dan password DB disimpan dengan enkripsi AES-256 dan hanya dipakai server backend.
        </span>
      </div>
    </div>
  );
};
