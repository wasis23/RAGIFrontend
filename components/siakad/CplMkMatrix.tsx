'use client';

import { Printer, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/*
 * Matriks Pemetaan CPL-MK.
 *
 * Berbeda dengan matriks pemetaan biasa (CPL-PL, CPL-BK, BK-MK) yang setiap
 * selnya bebas diklik, matriks ini memiliki aturan kelayakan: sebuah sel hanya
 * boleh dicentang bila sudah terdapat jalur CPL -> BK -> MK. Karena itu sel
 * dibagi menjadi tiga state:
 *   - `eligible` : punya jalur, boleh dicentang.
 *   - `checked`  : sudah dicentang (boleh dilepas, termasuk bila sudah yatim).
 *   - `locked`   : tidak punya jalur, tampil redup dan kliknya memunculkan toast.
 *
 * MATRIKS TIDAK MENGGUNAKAN <DataTable />: matriks menampilkan seluruh grid
 * korelasi sekaligus (tanpa paginasi) dan membutuhkan header dua tingkat
 * (rowSpan/colSpan) yang tidak tersedia pada DataTable. Pengecualian ini sama
 * dengan /siakad/obe/pemetaan-cpl-pl.
 */

export interface CplMkRow {
  id: number;
  kode?: string | null;
  detail?: string | null;
}

export interface CplMkCol {
  id: number;
  kode?: string | null;
}

export interface CplMkMatrixProps {
  rows: CplMkRow[];
  cols: CplMkCol[];
  /** Kunci pasangan yang punya jalur CPL -> BK -> MK: `${cplId}-${mataKuliahId}`. */
  eligible: Set<string>;
  /** Kunci pasangan yang sudah dicentang: `${cplId}-${mataKuliahId}`. */
  pairs: Set<string>;
  /** Kunci pasangan yang sudah dicentang namun jalurnya hilang ( perlu ditinjau ). */
  yatim: Set<string>;
  onToggle: (cplId: number, mataKuliahId: number, checked: boolean) => void;
  /** Handler saat sel terkunci diklik, untuk menampilkan toast peringatan. */
  onLockedClick: (row: CplMkRow, col: CplMkCol) => void;
  togglingKey: string | null;
  loading: boolean;
  emptyMessage: string;
}

export function CplMkMatrix({
  rows,
  cols,
  eligible,
  pairs,
  yatim,
  onToggle,
  onLockedClick,
  togglingKey,
  loading,
  emptyMessage,
}: CplMkMatrixProps) {
  const colSpan = 3 + Math.max(1, cols.length);

  const adaYatim = yatim.size > 0;

  return (
    <>
      {adaYatim && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle size={16} className="text-amber-700 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-900">
            <strong>Perhatian:</strong> {yatim.size} pemetaan ditandai (<AlertTriangle size={11} className="inline align-[-1px]" />)
            karena jalur CPL-BK atau BK-MK sudah berubah. Data tetap disimpan agar riwayat tidak hilang, namun perlu
            ditinjau kembali oleh Kaprodi.
          </p>
        </div>
      )}

      <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-2xs">
        <table className="table w-full text-xs">
          <thead className="bg-slate-50/90 border-b border-slate-200">
            <tr>
              <th rowSpan={2} className="p-3 text-center w-12 border-r border-slate-200 align-middle">
                #
              </th>
              <th rowSpan={2} className="p-3 text-left w-24 border-r border-slate-200 align-middle">
                Kode MK
              </th>
              <th rowSpan={2} className="p-3 text-left border-r border-slate-200 align-middle">
                Nama MK
              </th>
              <th colSpan={cols.length || 1} className="p-2.5 text-center font-bold bg-slate-100/70">
                CPL
              </th>
            </tr>
            <tr className="border-t border-slate-200 bg-slate-50">
              {cols.map((col) => (
                <th
                  key={col.id}
                  className="p-2.5 text-center font-mono font-bold text-slate-900 border-r border-slate-200 last:border-r-0 min-w-16"
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
                    Memuat data matriks CPL-MK...
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
                  <td className="p-3 text-center font-bold text-slate-400 border-r border-slate-100">{idx + 1}</td>
                  <td className="p-3 font-mono font-bold text-slate-900 border-r border-slate-100">{row.kode || '-'}</td>
                  <td className="p-3 text-slate-700 border-r border-slate-100">
                    <span className="block line-clamp-1">{row.detail || '-'}</span>
                  </td>
                  {cols.map((col) => {
                    const key = `${col.id}-${row.id}`;
                    const isChecked = pairs.has(key);
                    const isEligible = eligible.has(key);
                    const isYatim = yatim.has(key);
                    const isToggling = togglingKey === key;

                    // Lepas centang selalu boleh: itulah perbaikan untuk sel yatim.
                    const canToggle = isEligible || isChecked;

                    const stateClass = isYatim
                      ? 'bg-amber-50/60 cursor-pointer'
                      : isChecked
                        ? 'bg-emerald-50/40 cursor-pointer'
                        : isEligible
                          ? 'hover:bg-emerald-50/40 cursor-pointer'
                          : 'bg-slate-50/50 cursor-not-allowed';

                    return (
                      <td
                        key={col.id}
                        onClick={() => {
                          if (isToggling) return;
                          if (canToggle) onToggle(col.id, row.id, isChecked);
                          else onLockedClick(row, col);
                        }}
                        className={`p-3 text-center border-r border-slate-100 last:border-r-0 transition-colors ${stateClass} ${
                          isToggling ? 'opacity-60 pointer-events-none' : ''
                        }`}
                        title={
                          canToggle
                            ? `Klik untuk ${isChecked ? 'lepas' : 'simpan'} pemetaan ${row.kode} ↔ ${col.kode}`
                            : `Belum ada jalur CPL -> BK -> MK untuk ${row.kode} ↔ ${col.kode}`
                        }
                      >
                        {isToggling ? (
                          <div className="flex items-center justify-center text-emerald-600">
                            <Loader2 size={18} className="animate-spin" />
                          </div>
                        ) : isYatim ? (
                          <div className="flex items-center justify-center text-amber-600">
                            <AlertTriangle size={16} strokeWidth={2.5} />
                          </div>
                        ) : isChecked ? (
                          <div className="flex items-center justify-center text-emerald-600 font-black">
                            <Check size={18} strokeWidth={3} />
                          </div>
                        ) : isEligible ? (
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-300" />
                        ) : null}
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

export function CplMkLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-2xs text-slate-600">
      <span className="inline-flex items-center gap-1.5">
        <Check size={13} strokeWidth={3} className="text-emerald-600" /> Sudah dipetakan
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" /> Dapat dipilih (punya jalur CPL-BK-MK)
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm bg-slate-50/50 border border-slate-200" /> Terkunci (belum punya jalur)
      </span>
      <span className="inline-flex items-center gap-1.5">
        <AlertTriangle size={13} className="text-amber-600" /> Jalur berubah, perlu ditinjau
      </span>
    </div>
  );
}

export function MatrixPrintButton({ onPrint }: { onPrint: () => void }) {
  return (
    <Button variant="primary" icon={<Printer size={16} />} onClick={onPrint}>
      Print
    </Button>
  );
}