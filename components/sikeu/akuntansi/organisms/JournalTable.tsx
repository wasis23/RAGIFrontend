'use client';

import React from 'react';
import { JournalRow, JournalItemData } from '../molecules/JournalRow';
import { FileText, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface JournalTableProps {
  data: JournalItemData[];
  loading: boolean;
  onSelect: (item: JournalItemData) => void;
  onResetSearch?: () => void;
}

export const JournalTable: React.FC<JournalTableProps> = ({
  data,
  loading,
  onSelect,
  onResetSearch,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-semibold sticky top-0 z-10">
            <tr>
              <th className="px-3.5 py-2.5 uppercase tracking-wider text-2xs">Tanggal</th>
              <th className="px-3.5 py-2.5 uppercase tracking-wider text-2xs">No. Jurnal</th>
              <th className="px-3.5 py-2.5 uppercase tracking-wider text-2xs">Sumber</th>
              <th className="px-3.5 py-2.5 uppercase tracking-wider text-2xs">Uraian Transaksi</th>
              <th className="px-3.5 py-2.5 uppercase tracking-wider text-2xs">Akun / COA</th>
              <th className="px-3.5 py-2.5 uppercase tracking-wider text-2xs text-right">Uang Masuk</th>
              <th className="px-3.5 py-2.5 uppercase tracking-wider text-2xs text-right">Uang Keluar</th>
              <th className="px-3.5 py-2.5 uppercase tracking-wider text-2xs">Status</th>
              <th className="px-3.5 py-2.5 uppercase tracking-wider text-2xs text-right">Aksi</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100/90">
            {loading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="px-3.5 py-3"><div className="h-3.5 w-16 bg-slate-100 rounded"></div></td>
                  <td className="px-3.5 py-3"><div className="h-3.5 w-24 bg-slate-200 rounded"></div></td>
                  <td className="px-3.5 py-3"><div className="h-3.5 w-12 bg-slate-100 rounded"></div></td>
                  <td className="px-3.5 py-3"><div className="h-3.5 w-48 bg-slate-100 rounded"></div></td>
                  <td className="px-3.5 py-3"><div className="h-3.5 w-24 bg-slate-100 rounded"></div></td>
                  <td className="px-3.5 py-3 text-right"><div className="h-3.5 w-20 bg-slate-100 rounded ml-auto"></div></td>
                  <td className="px-3.5 py-3 text-right"><div className="h-3.5 w-20 bg-slate-100 rounded ml-auto"></div></td>
                  <td className="px-3.5 py-3"><div className="h-3.5 w-14 bg-slate-100 rounded"></div></td>
                  <td className="px-3.5 py-3 text-right"><div className="h-3.5 w-8 bg-slate-100 rounded ml-auto"></div></td>
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 px-4 text-center">
                  <div className="max-w-sm mx-auto space-y-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900 text-sm">Belum Ada Transaksi Jurnal</p>
                      <p className="text-2xs text-slate-500 mt-1">
                        Belum ada data transaksi keuangan pada periode atau filter yang dipilih.
                      </p>
                    </div>
                    {onResetSearch && (
                      <Button
                        size="sm"
                        variant="outline"
                        icon={<RotateCcw size={14} />}
                        onClick={onResetSearch}
                        className="font-bold mx-auto"
                      >
                        Reset Filter
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <JournalRow key={item.id} data={item} onSelect={onSelect} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
