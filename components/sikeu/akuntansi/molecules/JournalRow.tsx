'use client';

import React from 'react';
import { DateText } from '../atoms/DateText';
import { CurrencyText } from '../atoms/CurrencyText';
import { StatusBadge } from '../atoms/StatusBadge';
import { Eye } from 'lucide-react';

export interface JournalItemData {
  id: number;
  nomor_jurnal: string;
  tanggal_jurnal: string;
  jenis_sumber: string;
  keterangan: string;
  uang_masuk: number;
  uang_keluar: number;
  nama_akun_terkait?: string;
  kode_coa?: string;
  status_posting?: string;
}

interface JournalRowProps {
  data: JournalItemData;
  onSelect: (data: JournalItemData) => void;
}

export const JournalRow: React.FC<JournalRowProps> = ({ data, onSelect }) => {
  return (
    <tr
      onClick={() => onSelect(data)}
      className="hover:bg-slate-50/80 cursor-pointer transition-colors border-b border-slate-100/90 text-xs"
    >
      <td className="px-3.5 py-3 whitespace-nowrap">
        <DateText dateString={data.tanggal_jurnal} format="short" />
      </td>

      <td className="px-3.5 py-3 font-mono font-bold text-slate-800 whitespace-nowrap">
        {data.nomor_jurnal}
      </td>

      <td className="px-3.5 py-3">
        <span className="badge badge-purple text-2xs font-bold uppercase">{data.jenis_sumber}</span>
      </td>

      <td className="px-3.5 py-3">
        <p className="font-semibold text-slate-900 line-clamp-1">{data.keterangan || '-'}</p>
      </td>

      <td className="px-3.5 py-3 whitespace-nowrap">
        <span className="font-mono text-2xs text-slate-600 font-medium">
          {data.kode_coa ? `[${data.kode_coa}] ` : ''}{data.nama_akun_terkait || 'Kas Utama'}
        </span>
      </td>

      <td className="px-3.5 py-3 text-right whitespace-nowrap">
        {data.uang_masuk > 0 ? (
          <CurrencyText value={data.uang_masuk} prefix="+" variant="positive" size="sm" />
        ) : (
          <span className="text-slate-300 font-mono text-xs">—</span>
        )}
      </td>

      <td className="px-3.5 py-3 text-right whitespace-nowrap">
        {data.uang_keluar > 0 ? (
          <CurrencyText value={data.uang_keluar} prefix="-" variant="negative" size="sm" />
        ) : (
          <span className="text-slate-300 font-mono text-xs">—</span>
        )}
      </td>

      <td className="px-3.5 py-3 whitespace-nowrap">
        <StatusBadge status={data.status_posting || 'posted'} />
      </td>

      <td className="px-3.5 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => onSelect(data)}
          className="p-1.5 hover:bg-slate-200/60 rounded-md text-slate-500 hover:text-slate-900 transition"
          title="Lihat Detail Transaksi"
          aria-label="Lihat detail"
        >
          <Eye size={15} />
        </button>
      </td>
    </tr>
  );
};
