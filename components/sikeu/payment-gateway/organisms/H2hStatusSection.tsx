'use client';

import React from 'react';
import { Activity, Database, Globe, RefreshCw } from 'lucide-react';
import { StatusBadge } from '../atoms/StatusBadge';

export interface H2hStatusData {
  bridge_url?: string;
  sumber_config?: string;
  h2h_aktif?: boolean;
  bridge_api?: string;
  bridge_api_error?: string;
  bridge_db?: string;
  bridge_db_error?: string;
  va_billing_count?: number;
}

interface H2hStatusSectionProps {
  status: H2hStatusData | null;
  loading: boolean;
  onRefresh: () => void;
}

export const H2hStatusSection: React.FC<H2hStatusSectionProps> = ({
  status,
  loading,
  onRefresh,
}) => {
  return (
    <div className="p-4 sm:p-5 bg-white border border-slate-200/90 rounded-xl space-y-3 shadow-2xs">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Activity size={14} className="text-teal-600" /> Status Koneksi Bridge
        </h3>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="btn btn-outline btn-sm text-xs font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Memeriksa...' : 'Cek Ulang'}
        </button>
      </div>

      {!status ? (
        <p className="text-xs text-slate-500">Klik “Cek Ulang” untuk memeriksa konektivitas bridge.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
            <p className="font-bold text-slate-700 flex items-center gap-1.5">
              <Globe size={13} className="text-slate-500" /> API Bridge
            </p>
            <p className="font-mono text-2xs text-slate-600 break-all">{status.bridge_url || '-'}</p>
            <div className="flex items-center gap-2">
              <StatusBadge status={status.bridge_api === 'up' ? 'active' : 'inactive'} />
              <span className="text-2xs text-slate-500">
                Sumber: {status.sumber_config === 'menu' ? 'Menu ini' : '.env'}
                {status.h2h_aktif === false ? ' • Nonaktif' : ''}
              </span>
            </div>
            {status.bridge_api_error && (
              <p className="text-2xs text-red-600 font-medium">{status.bridge_api_error}</p>
            )}
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
            <p className="font-bold text-slate-700 flex items-center gap-1.5">
              <Database size={13} className="text-slate-500" /> Database Bridge
            </p>
            <div className="flex items-center gap-2">
              <StatusBadge status={status.bridge_db === 'up' ? 'active' : 'inactive'} />
              {typeof status.va_billing_count === 'number' && (
                <span className="text-2xs text-slate-500 font-medium">
                  {status.va_billing_count} billing tercatat
                </span>
              )}
            </div>
            {status.bridge_db_error && (
              <p className="text-2xs text-red-600 font-medium">{status.bridge_db_error}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
