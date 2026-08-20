'use client';

import React from 'react';
import { Plus, Filter, Download, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface JournalHeaderProps {
  onOpenFilter: () => void;
  onOpenCreateModal: () => void;
  activeTab: 'jurnal' | 'coa';
  onTabChange: (tab: 'jurnal' | 'coa') => void;
}

export const JournalHeader: React.FC<JournalHeaderProps> = ({
  onOpenFilter,
  onOpenCreateModal,
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-purple text-2xs font-extrabold uppercase tracking-wider">SIKEU ERP</span>
            <span className="badge badge-green text-2xs font-extrabold uppercase tracking-wider">Enterprise Ledger</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Jurnal Keuangan & Mutasi Kas
          </h1>
          <p className="text-xs text-slate-500 hidden sm:block mt-0.5">
            Pencatatan seluruh transaksi kas masuk, kas keluar, dan kelola Chart of Accounts (COA).
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            icon={<Filter size={15} />}
            onClick={onOpenFilter}
            className="font-bold min-h-[38px]"
          >
            Filter
          </Button>

          <Button
            variant="outline"
            size="sm"
            icon={<Download size={15} />}
            onClick={() => window.print()}
            className="font-bold min-h-[38px] hidden md:inline-flex"
          >
            Export
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={15} />}
            onClick={onOpenCreateModal}
            className="font-bold min-h-[38px] px-3.5 shadow-xs"
          >
            <span className="hidden sm:inline">Catat Transaksi</span>
            <span className="sm:hidden">+ Transaksi</span>
          </Button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-semibold">
        <button
          type="button"
          onClick={() => onTabChange('jurnal')}
          className={`pb-2.5 px-1.5 border-b-2 transition-colors ${
            activeTab === 'jurnal'
              ? 'border-primary-600 text-primary-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Jurnal Keuangan
        </button>

        <button
          type="button"
          onClick={() => onTabChange('coa')}
          className={`pb-2.5 px-1.5 border-b-2 transition-colors ${
            activeTab === 'coa'
              ? 'border-primary-600 text-primary-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Master Chart of Accounts (COA)
        </button>
      </div>
    </div>
  );
};
