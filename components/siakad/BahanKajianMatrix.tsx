'use client';

import { Printer, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/*
 * Komponen matriks pemetaan dua entitas (baris × kolom) dengan sel yang dapat
 * diklik untuk menyimpan pemetaan.
 *
 * MATRIKS TIDAK MENGGUNAKAN <DataTable />: DataTable dipakai untuk daftar
 * data dengan paginasi server-side, sedangkan matriks pemetaan menampilkan
 * seluruh grid korelasi sekaligus (tanpa paginasi) sesuai mockup acuan.
 * Struktur header dua tingkat (rowSpan/colSpan) tidak tersedia pada DataTable.
 */

export interface MatrixRow {
  id: number;
  kode?: string | null;
  nama?: string | null;
  /** Baris dua: keterangan ringkas (opsional). */
  sub?: string | null;
}

export interface MatrixCol {
  id: number;
  kode?: string | null;
  nama?: string | null;
}

export interface BahanKajianMatrixProps {
  /** Label entitas pada kolom pertama (mis. "Kode CPL" / "Kode MK"). */
  rowLabel: string;
  /** Label kelompok kolom (mis. "Bahan Kajian"). */
  colGroupLabel: string;
  /** Label grup baris di header (mis. "Capaian Pembelajaran Lulusan"). */
  rowGroupLabel: string;
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
  rowGroupLabel,
  rows,
  cols,
  pairs,
  onToggle,
  togglingKey,
  loading,
  emptyMessage,
  onPrint,
}: BahanKajianMatrixProps) {
  const totalColSpan = 2 + Math.max(1, cols.length);

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="outline" icon={<Printer size={16} />} onClick={onPrint}>
          Print
        </Button>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl border border-slate-200">
        <table className="table w-full text-xs">
          <thead className="bg-slate-50/90 border-b border-slate-200">
            <tr>
              <th rowSpan={2} className="p-3 text-center w-12 border-r border-slate-200 align-middle">
                NO
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
                  title={col.nama || undefined}
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
                <td colSpan={totalColSpan} className="p-8 text-center text-slate-400">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Memuat data matriks {rowGroupLabel}...
                  </span>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={totalColSpan} className="p-8 text-center text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr key={row.id} className="bg-white hover:bg-slate-50 transition-colors">
                  <td className="p-3 text-center font-bold text-slate-400 border-r border-slate-100">
                    {idx + 1}
                  </td>
                  <td className="p-3 border-r border-slate-100">
                    <span className="font-mono font-bold text-slate-900 text-xs block">{row.kode || '-'}</span>
                    {row.nama && <span className="text-2xs text-slate-500 block">{row.nama}</span>}
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
                        title={`Klik untuk menyimpan pemetaan ${row.kode} ↔ ${col.kode}`}
                      >
                        {isToggling ? (
                          <span className="inline-flex items-center justify-center text-emerald-600">
                            <Loader2 size={18} className="animate-spin" />
                          </span>
                        ) : (
                          isChecked && (
                            <span className="inline-flex items-center justify-center text-emerald-600">
                              <Check size={18} strokeWidth={3} />
                            </span>
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
