'use client';

import React from 'react';
import { SectionTitle } from '../atoms/SectionTitle';
import { CredentialField } from '../molecules/CredentialField';
import { Lock } from 'lucide-react';
import { GatewayConfigData } from './GatewayConfigFormPanel';

interface CredentialSectionProps {
  gatewayName: string;
  config: GatewayConfigData;
  onChange: (field: keyof GatewayConfigData, val: any) => void;
}

export const CredentialSection: React.FC<CredentialSectionProps> = ({
  gatewayName,
  config,
  onChange,
}) => {
  const isXendit = gatewayName.toLowerCase() === 'xendit';

  return (
    <div className="p-4 sm:p-5 bg-white border border-slate-200/90 rounded-xl space-y-4 shadow-2xs">
      <SectionTitle
        number="2"
        title="API CREDENTIALS & WEBHOOK TOKEN"
        description="Masukan kunci otentikasi API yang diberikan oleh penyedia Payment Gateway."
      />

      <div className="space-y-3.5">
        <CredentialField
          label={isXendit ? 'API / Secret Key (Secret) *' : 'API Key (Secret) *'}
          value={config.api_key || ''}
          onChange={(val) => onChange('api_key', val)}
          placeholder={isXendit ? 'xnd_development_...' : 'Ketik Secret Key...'}
          helperText="Gunakan API Secret Key dengan hak akses write/read untuk transaksi."
          isSecret={true}
        />

        <CredentialField
          label={isXendit ? 'Public Key (Opsional)' : 'Merchant Code / Client ID *'}
          value={config.public_key || ''}
          onChange={(val) => onChange('public_key', val)}
          placeholder={isXendit ? 'xnd_public_...' : 'Ketik Merchant Code...'}
          helperText="Public Key atau Merchant ID yang digunakan untuk validasi frontend."
          isSecret={false}
        />

        <CredentialField
          label="Webhook Verification Token *"
          value={config.webhook_token || ''}
          onChange={(val) => onChange('webhook_token', val)}
          placeholder="xnd_wh_verification_token_..."
          helperText="Token ini digunakan backend untuk memverifikasi callback pelunasan dari bank."
          isSecret={true}
        />
      </div>

      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2 text-2xs text-slate-600 font-medium">
        <Lock size={14} className="text-emerald-600 shrink-0" />
        <span>
          Kredensial disimpan secara aman dengan enkripsi AES-256 dan hanya digunakan oleh server backend.
        </span>
      </div>
    </div>
  );
};
