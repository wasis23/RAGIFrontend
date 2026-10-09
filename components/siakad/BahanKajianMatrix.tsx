'use client';

import { Printer, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/*
 * Komponen matriks pemetaan dua entitas (baris × kolom) dengan sel yang dapat
 * diklik untuk menyimpan pemetaan.
 *
 * MATRIKS TIDAK MENGGUNAKAN <DataTable />: DataTable dipakai untuk daftar
 * data dengan paginasi server-side, sedangkan matriks pemetaan menampilkan
 * seluruh grid korelasi sekaligus (tanpa paginasi) sesuai mockup acuan
 * (/siakad/obe/pemetaan-cpl-pl). Struktur header dua tingkat (rowSpan/colSpan)
 * juga tidak tersedia pada DataTable.
 *
 * Styling tabel dipegang satu file ini agar seluruh halaman matriks OBE
 * (CPL-PL, CPL-BK, BK-MK) konsisten.
 */

export interface MatrixRow {
  id: number;
  kode?: string | null;
  /** Baris kedua di sel identitas (deskripsi/rumusan/nama). */
  detail?: string | null;
}

export interface MatrixCol {
  id: number;
  kode?: string | null;
  nama?: string | null;
}

export interface BahanKajianMatrixProps {
  /** Label kolom identitas di baris header, mis. "Kode CPL" / "Kode MK". */
  rowLabel: string;
  /** Label kelompok kolom, mis. "Bahan Kajian". */
  colGroupLabel: string;
  /** Prefix pada pesan memuat, mis. "CPL-BK". */
  loadingLabel: string;
  rows: MatrixRow[];
  cols: MatrixCol[];
  /** Kunci pasangan terpetakan: `${rowId}-${colId}`. */
  pairs: Set<string>;
  onToggle: (rowId: number, colId: number, checked: boolean) => void;
  /** Kunci sel yang sedang menyimpan, mis. `3-7`. */
  togglingKey: string | null;
  loading: boolean;
  emptyMessage: string;
  onPrint: () => void;
}

export function BahanKajianMatrix({
  rowLabel,
  colGroupLabel,
  loadingLabel,
  rows,
  cols,
  pairs,
  onToggle,
  togglingKey,
  loading,
  emptyMessage,
  onPrint,
}: BahanKajianMatrixProps) {
  const colSpan = 2 + Math.max(1, cols.length);

  return (
    <>
      <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-2xs">
        <table className="table w-full text-xs">
          <thead className="bg-slate-50/90 border-b border-slate-200">
            <tr>
              <th rowSpan={2} className="p-3 text-center w-12 border-r border-slate-200 align-middle">
                #
              </th>
              <th rowSpan={2} className="p-3 text-left w-56 border-r border-slate-200 align-middle">
                {rowLabel}
              </th>
              <th colSpan={cols.length || 1} className="p-2.5 text-center font-bold bg-slate-100/70">
                {colGroupLabel}
              </th>
            </tr>
            <tr className="border-t border-slate-200 bg-slate-50">
              {cols.map((col) => (
                <th
                  key={col.id}
                  className="p-2.5 text-center font-mono font-bold text-slate-900 border-r border-slate-200 last:border-r-0 min-w-24"
                >
                  {col.kode || '-'}
                </th>
              ))}
              {cols.length === 0 && (
                <th className="p-2.5 text-center text-slate-400 font-normal">Belum ada data</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan={colSpan} className="p-8 text-center text-slate-400">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Memuat data matriks {loadingLabel}...
                  </span>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="p-8 text-center text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3 text-center font-bold text-slate-400 border-r border-slate-100">
                    {idx + 1}
                  </td>
                  <td className="p-3 border-r border-slate-100">
                    <span className="font-mono font-bold text-slate-900 block">{row.kode || '-'}</span>
                    {row.detail && <span className="text-2xs text-slate-500 line-clamp-1">{row.detail}</span>}
                  </td>
                  {cols.map((col) => {
                    const key = `${row.id}-${col.id}`;
                    const isChecked = pairs.has(key);
                    const isToggling = togglingKey === key;

                    return (
                      <td
                        key={col.id}
                        onClick={() => !isToggling && onToggle(row.id, col.id, isChecked)}
                        className={`p-3 text-center border-r border-slate-100 last:border-r-0 transition-colors ${
                          isChecked ? 'bg-emerald-50/40' : 'hover:bg-slate-100/50'
                        } ${isToggling ? 'opacity-60 pointer-events-none' : 'cursor-pointer'}`}
                        title={`Klik untuk toggle korelasi ${row.kode} ↔ ${col.kode}`}
                      >
                        {isToggling ? (
                          <div className="flex items-center justify-center text-emerald-600">
                            <Loader2 size={18} className="animate-spin" />
                          </div>
                        ) : (
                          isChecked && (
                            <div className="flex items-center justify-center text-emerald-600 font-black">
                              <Check size={18} strokeWidth={3} />
                            </div>
                          )
                        )}
                      </td>
                    );
                  })}
                  {cols.length === 0 && <td className="p-3 text-center text-slate-300">-</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function MatrixPrintButton({ onPrint }: { onPrint: () => void }) {
  return (
    <Button variant="primary" icon={<Printer size={16} />} onClick={onPrint}>
      Print
    </Button>
  );
}
