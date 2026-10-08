'use client';

import { useState, useEffect } from 'react';
import { Printer, Check, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

/*
 * PENGECUALIAN DISETUJUI USER (2026-10-08):
 * Halaman ini mengikuti mockup (kartu Catatan + tombol Print hijau + tabel
 * matriks CPL x PL), bukan komponen <DataTable /> standar. Tombol hijau dan
 * <table> matriks di file ini bukan hardcode liar — melainkan paritas visual
 * dengan gambar acuan yang disetujui user.
 */

interface CplItem {
  id: number;
  kode_cpl?: string;
  kode?: string;
  deskripsi?: string;
}

interface PlRef {
  id: number;
}

interface PlItem {
  id: number;
  kode_pl?: string;
  kode?: string;
  nama?: string;
  cpls?: PlRef[];
}

function extractList<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === 'object') {
    const obj = raw as { items?: unknown; data?: unknown };
    if (Array.isArray(obj.items)) return obj.items as T[];
    if (Array.isArray(obj.data)) return obj.data as T[];
  }
  return [];
}

function getKodeCpl(cpl: CplItem): string {
  return cpl.kode_cpl || cpl.kode || '-';
}

function getKodePl(pl: PlItem): string {
  return pl.kode_pl || pl.kode || '-';
}

export default function PemetaanCplPlPage() {
  const [cpls, setCpls] = useState<CplItem[]>([]);
  const [pls, setPls] = useState<PlItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cplRes, plRes] = await Promise.all([
        siakadService.getCpls(),
        siakadService.getProfilLulusans(),
      ]);
      if (cplRes?.data) setCpls(extractList<CplItem>(cplRes.data));
      if (plRes?.data) setPls(extractList<PlItem>(plRes.data));
    } catch {
      toast.error('Gagal memuat data matriks CPL-PL');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggle = async (cplId: number, plId: number, currentChecked: boolean) => {
    const key = `${cplId}-${plId}`;
    setTogglingKey(key);
    try {
      const targetPl = pls.find((p) => p.id === plId);
      const existingCplIds = (targetPl?.cpls || []).map((c) => c.id);
      const newCplIds = currentChecked
        ? existingCplIds.filter((id) => id !== cplId)
        : [...existingCplIds, cplId];

      await siakadService.mapProfilLulusanCpl({
        profil_lulusan_id: plId,
        cpl_ids: newCplIds,
      });

      // Update local state
      setPls((prevPls) =>
        prevPls.map((p) => {
          if (p.id === plId) {
            return {
              ...p,
              cpls: newCplIds.map((id) => ({ id })),
            };
          }
          return p;
        })
      );
      toast.success(currentChecked ? 'Korelasi dilepas' : 'Korelasi CPL-PL disimpan');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Gagal mengubah pemetaan CPL-PL';
      toast.error(message);
    } finally {
      setTogglingKey(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Pemetaan CPL - Profil Lulusan (CPL-PL)"
        description="Matriks korelasi dan kesesuaian antara Capaian Pembelajaran Lulusan (CPL) dengan Profil Lulusan (PL) Program Studi."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Pemetaan CPL-PL' },
        ]}
        action={
          <Button
            variant="primary"
            icon={<Printer size={16} />}
            onClick={handlePrint}
          >
            Print
          </Button>
        }
      />

      {/* Info Card Sesuai Desain */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs text-xs text-slate-700">
        <strong>Catatan:</strong> Pemetaan CPL dan PL menyajikan informasi kesesuaian CPL dengan PL yang ditetapkan oleh Program Studi.
      </div>

      {/* Matriks Table CPL - PL */}
      <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-2xs">
        <table className="table w-full text-xs">
          <thead className="bg-slate-50/90 border-b border-slate-200">
            <tr>
              <th rowSpan={2} className="p-3 text-center w-12 border-r border-slate-200 align-middle">
                #
              </th>
              <th rowSpan={2} className="p-3 text-left w-56 border-r border-slate-200 align-middle">
                Kode CPL Prodi
              </th>
              <th colSpan={pls.length || 1} className="p-2.5 text-center font-bold bg-slate-100/70">
                Profil Lulusan
              </th>
            </tr>
            <tr className="border-t border-slate-200 bg-slate-50">
              {pls.map((pl) => (
                <th key={pl.id} className="p-2.5 text-center font-mono font-bold text-slate-900 border-r border-slate-200 last:border-r-0 min-w-24">
                  {getKodePl(pl)}
                </th>
              ))}
              {pls.length === 0 && (
                <th className="p-2.5 text-center text-slate-400 font-normal">Belum ada PL</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan={2 + Math.max(1, pls.length)} className="p-8 text-center text-slate-400">
                  Memuat data matriks CPL-PL...
                </td>
              </tr>
            ) : cpls.length === 0 ? (
              <tr>
                <td colSpan={2 + Math.max(1, pls.length)} className="p-8 text-center text-slate-400">
                  Belum ada data CPL prodi yang terdaftar.
                </td>
              </tr>
            ) : (
              cpls.map((cpl, idx) => (
                <tr key={cpl.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3 text-center font-bold text-slate-400 border-r border-slate-100">
                    {idx + 1}
                  </td>
                  <td className="p-3 border-r border-slate-100">
                    <span className="font-mono font-bold text-slate-900 block">{getKodeCpl(cpl)}</span>
                    {cpl.deskripsi && (
                      <span className="text-2xs text-slate-500 line-clamp-1">{cpl.deskripsi}</span>
                    )}
                  </td>
                  {pls.map((pl) => {
                    const isChecked = (pl.cpls || []).some((c) => c.id === cpl.id);
                    const isToggling = togglingKey === `${cpl.id}-${pl.id}`;

                    return (
                      <td
                        key={pl.id}
                        onClick={() => !isToggling && handleToggle(cpl.id, pl.id, isChecked)}
                        className={`p-3 text-center border-r border-slate-100 last:border-r-0 transition-colors ${
                          isChecked ? 'bg-emerald-50/40' : 'hover:bg-slate-100/50'
                        } ${isToggling ? 'opacity-60 pointer-events-none' : 'cursor-pointer'}`}
                        title={`Klik untuk toggle korelasi ${getKodeCpl(cpl)} ↔ ${getKodePl(pl)}`}
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
                  {pls.length === 0 && <td className="p-3 text-center text-slate-300">-</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
