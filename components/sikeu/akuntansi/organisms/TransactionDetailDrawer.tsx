'use client';

import React from 'react';
import { X, Printer, AlertOctagon, CheckCircle2, FileText, Calendar, Building, CreditCard } from 'lucide-react';
import { JournalItemData } from '../molecules/JournalRow';
import { StatusBadge } from '../atoms/StatusBadge';
import { DateText } from '../atoms/DateText';
import { CurrencyText } from '../atoms/CurrencyText';
import { Button } from '@/components/ui/Button';

interface TransactionDetailDrawerProps {
  item: JournalItemData | null;
  onClose: () => void;
}

export const TransactionDetailDrawer: React.FC<TransactionDetailDrawerProps> = ({ item, onClose }) => {
  if (!item) return null;

  const isMasuk = item.uang_masuk > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end animate-fade-in">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge status={item.status_posting || 'posted'} />
              <span className="badge badge-purple text-2xs font-bold uppercase">{item.jenis_sumber}</span>
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              Detail Transaksi Jurnal
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-5 flex-1">
          {/* Main Amount Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-center">
            <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">
              {isMasuk ? 'TOTAL UANG MASUK (INFLOW)' : 'TOTAL UANG KELUAR (OUTFLOW)'}
            </span>
            <CurrencyText
              value={isMasuk ? item.uang_masuk : item.uang_keluar}
              prefix={isMasuk ? '+' : '-'}
              variant={isMasuk ? 'positive' : 'negative'}
              size="xl"
            />
          </div>

          {/* Section 1: Informasi Jurnal */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <FileText size={14} className="text-slate-400" />
              Informasi Jurnal
            </h3>

            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Nomor Jurnal:</span>
                <span className="font-mono font-bold text-slate-900">{item.nomor_jurnal}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Tanggal Transaksi:</span>
                <DateText dateString={item.tanggal_jurnal} format="long" className="text-slate-900 font-semibold" />
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Sumber Transaksi:</span>
                <span className="font-bold text-slate-900 uppercase">{item.jenis_sumber}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Uraian Transaksi */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Uraian / Deskripsi</h3>
            <div className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl text-xs text-slate-800 font-medium">
              {item.keterangan || 'Tidak ada deskripsi tambahan.'}
            </div>
          </div>

          {/* Section 3: Informasi Akun COA */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard size={14} className="text-slate-400" />
              Akun Keuangan (COA)
            </h3>

            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Kode COA:</span>
                <span className="font-mono font-bold text-slate-900">{item.kode_coa || '1101'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Nama Akun:</span>
                <span className="font-bold text-slate-900">{item.nama_akun_terkait || 'Kas Utama Rektorat'}</span>
              </div>
            </div>
          </div>

          {/* Section 4: Audit Metadata */}
          <div className="pt-2 border-t border-slate-100 text-2xs text-slate-400 space-y-1">
            <p>Dibuat: {item.tanggal_jurnal} oleh System Administrator</p>
            <p>Status Posting: Posted & Balanced in General Ledger</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-white sticky bottom-0 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={<Printer size={15} />}
            onClick={() => window.print()}
            className="font-bold"
          >
            Cetak Kuitansi
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="font-bold text-slate-600"
          >
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
};
