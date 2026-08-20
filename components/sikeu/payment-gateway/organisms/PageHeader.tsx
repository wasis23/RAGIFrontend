'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PageHeaderProps {
  onSyncBalance: () => void;
  loadingBalance: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ onSyncBalance, loadingBalance }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 border border-slate-200/90 rounded-xl shadow-2xs">
      <div className="flex items-center gap-3">
        <Link
          href="/sikeu"
          className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition flex items-center justify-center"
          title="Kembali ke SIKEU"
          aria-label="Kembali"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="badge badge-purple text-2xs font-extrabold uppercase tracking-wider">
              SIKEU Gateway Engine
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
            Konfigurasi Payment Gateway
          </h1>
          <p className="text-xs text-slate-500 hidden sm:block">
            Kelola credential API, environment transaksi, saldo, webhook, dan otomatisasi gateway pembayaran.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onSyncBalance}
          disabled={loadingBalance}
          icon={<RefreshCw size={14} className={loadingBalance ? 'animate-spin text-primary-600' : ''} />}
          className="font-bold min-h-[38px] text-xs shadow-2xs"
        >
          {loadingBalance ? 'Sinkronisasi...' : 'Sync Saldo'}
        </Button>
      </div>
    </div>
  );
};
