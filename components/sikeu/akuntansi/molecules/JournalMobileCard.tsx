'use client';

import React from 'react';
import { DateText } from '../atoms/DateText';
import { CurrencyText } from '../atoms/CurrencyText';
import { StatusBadge } from '../atoms/StatusBadge';
import { ChevronRight } from 'lucide-react';
import { JournalItemData } from './JournalRow';

interface JournalMobileCardProps {
  data: JournalItemData;
  onSelect: (data: JournalItemData) => void;
}

export const JournalMobileCard: React.FC<JournalMobileCardProps> = ({ data, onSelect }) => {
  const isMasuk = data.uang_masuk > 0;

  return (
    <div
      onClick={() => onSelect(data)}
      className="p-3.5 bg-white border border-slate-200/90 rounded-xl shadow-2xs space-y-2.5 active:bg-slate-50 transition cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusBadge status={data.status_posting || 'posted'} />
          <span className="badge badge-purple text-2xs font-bold uppercase">{data.jenis_sumber}</span>
        </div>
        <ChevronRight size={16} className="text-slate-400" />
      </div>

      <div>
        <p className="font-bold text-slate-900 text-sm line-clamp-1">{data.keterangan || 'Transaksi Keuangan'}</p>
        <div className="flex items-center gap-2 mt-0.5 text-2xs text-slate-500 font-mono">
          <span>{data.nomor_jurnal}</span>
          <span>•</span>
          <DateText dateString={data.tanggal_jurnal} format="short" />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div>
          <span className="text-2xs font-semibold text-slate-400 block">
            {isMasuk ? 'Uang Masuk' : 'Uang Keluar'}
          </span>
          <CurrencyText
            value={isMasuk ? data.uang_masuk : data.uang_keluar}
            prefix={isMasuk ? '+' : '-'}
            variant={isMasuk ? 'positive' : 'negative'}
            size="base"
          />
        </div>

        <div className="text-right">
          <span className="text-2xs font-semibold text-slate-400 block">Akun</span>
          <span className="text-2xs font-bold text-slate-700 font-mono">
            {data.nama_akun_terkait || 'Kas Utama'}
          </span>
        </div>
      </div>
    </div>
  );
};
