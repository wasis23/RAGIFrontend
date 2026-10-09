'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Printer, Filter, Loader2 } from 'lucide-react';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

/*
 * Laporan read-only Pemetaan CPL-BK-MK.
 *
 * Menampilkan baris = Bahan Kajian, kolom = CPL, isi sel = daftar Mata Kuliah
 * yang menjembatani keduanya. Tidak ada penyimpanan terpisah: isi matriks
 * dihitung dari komposisi Pemetaan CPL-BK dan Pemetaan BK-MK, sehingga mustahil
 * melenceng dari pemetaan induknya.
 *
 * MATRIKS TIDAK MENGGUNAKAN <DataTable />: laporan menampilkan seluruh grid
 * sekaligus tanpa paginasi dan membutuhkan isi sel multi-baris. Pengecualian ini
 * sama dengan /siakad/obe/pemetaan-cpl-pl.
 */

interface Row {
  id: number;
  kode?: string | null;
  detail?: string | null;
}

interface Col {
  id: number;
  kode?: string | null;
}

interface IsiSel {
  kode_mk: string;
  nama_mk: string;
}

export default function PemetaanCplBkMkPage() {
  const [bahanKajians, setBahanKajians] = useState<Row[]>([]);
  const [cpls, setCpls] = useState<Col[]>([]);
  const [isi, setIsi] = useState<Record<string, Record<string, IsiSel[]>>>({});
  const [loading, setLoading] = useState(true);

  const [showFilter, setShowFilter] = useState(false);
  const [filterProdi, setFilterProdi] = useState('');
  const [appliedProdi, setAppliedProdi] = useState('');

  const loadProdiOptions = async (keyword: string) => {
    const res = await siakadService.getProdi({ search: keyword || undefined, per_page: 50 });
    const raw = res?.data;
    const list: any[] = Array.isArray(raw) ? raw : (raw?.items || raw?.data || []);
    return list.map((p: any) => ({
      value: p.id,
      label: `${p.nama || p.nama_prodi || `Prodi #${p.id}`}${p.kode_prodi ? ` — ${p.kode_prodi}` : ''}${p.jenjang ? ` (${p.jenjang})` : ''}`,
      raw: p,
    }));
  };

  const fetchData = async (prodiId?: string) => {
    setLoading(true);
    try {
      const res = await siakadService.getMatrixCplBahanKajianMataKuliah({
        program_studi_id: prodiId ? Number(prodiId) : undefined,
      });
      const payload = res?.data || {};

      setBahanKajians(
        (payload.bahan_kajians || []).map((b: any) => ({
          id: b.id,
          kode: b.kode_bk,
          detail: b.nama_bk,
        })),
      );
      setCpls((payload.cpls || []).map((c: any) => ({ id: c.id, kode: c.kode_cpl || '-' })));
      setIsi(payload.isi || {});
    } catch {
      toast.error('Gagal memuat laporan pemetaan CPL-BK-MK');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(appliedProdi || undefined);
  }, [appliedProdi]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Pemetaan CPL-BK-MK"
        description="Laporan korelasi Capaian Pembelajaran Lulusan (CPL), Bahan Kajian (BK), dan Mata Kuliah (MK) program studi."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Pemetaan CPL-BK-MK' },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setShowFilter(true)}
              style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
            >
              Filter
            </Button>
            <Button variant="primary" icon={<Printer size={16} />} onClick={() => window.print()}>
              Print
            </Button>
          </div>
        }
      />

      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs text-xs text-slate-700">
        <strong>Catatan:</strong> Pemetaan CPL-BK-MK dilakukan untuk mengetahui CPL dan BK yang melekat pada mata
        kuliah tertentu. Laporan ini bersifat <strong>read-only</strong> dan otomatis tersusun dari Pemetaan CPL-BK
        serta Pemetaan BK-MK.
      </div>

      <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-2xs">
        <table className="table w-full text-xs">
          <thead className="bg-slate-50/90 border-b border-slate-200">
            <tr>
              <th rowSpan={2} className="p-3 text-left w-64 border-r border-slate-200 align-middle">
                Bahan Kajian
              </th>
              <th colSpan={cpls.length || 1} className="p-2.5 text-center font-bold bg-slate-100/70">
                CPL
              </th>
            </tr>
            <tr className="border-t border-slate-200 bg-slate-50">
              {cpls.map((col) => (
                <th
                  key={col.id}
                  className="p-2.5 text-center font-mono font-bold text-slate-900 border-r border-slate-200 last:border-r-0 min-w-32"
                >
                  {col.kode}
                </th>
              ))}
              {cpls.length === 0 && (
                <th className="p-2.5 text-center text-slate-400 font-normal">Belum ada data</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan={2 + Math.max(1, cpls.length)} className="p-8 text-center text-slate-400">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Memuat laporan CPL-BK-MK...
                  </span>
                </td>
              </tr>
            ) : bahanKajians.length === 0 ? (
              <tr>
                <td colSpan={2 + Math.max(1, cpls.length)} className="p-8 text-center text-slate-400">
                  Belum ada bahan kajian aktif yang terdaftar untuk program studi ini.
                </td>
              </tr>
            ) : (
              bahanKajians.map((row, idx) => (
                <tr key={row.id} className="hover:bg-slate-50/70 transition-colors align-top">
                  <td className="p-3 border-r border-slate-100">
                    <span className="block">
                      <span className="font-mono font-bold text-slate-900">{row.kode || '-'}</span>
                      {row.detail ? ` - ${row.detail}` : ''}
                    </span>
                  </td>
                  {cpls.map((col) => {
                    const daftarMk: IsiSel[] = isi?.[String(col.id)]?.[String(row.id)] || [];
                    return (
                      <td key={col.id} className="p-3 border-r border-slate-100 last:border-r-0 align-top">
                        {daftarMk.length === 0 ? (
                          <span className="text-slate-200">-</span>
                        ) : (
                          <ul className="space-y-1.5">
                            {daftarMk.map((mk) => (
                              <li key={mk.kode_mk} className="leading-tight">
                                <span className="block font-mono font-bold text-slate-800">{mk.kode_mk}</span>
                                <span className="block text-2xs text-slate-500 uppercase">{mk.nama_mk}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                    );
                  })}
                  {cpls.length === 0 && <td className="p-3 text-center text-slate-300">-</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Drawer open={showFilter} onClose={() => setShowFilter(false)} title="Filter Laporan CPL-BK-MK">
        <div className="space-y-4">
          <AsyncSelect
            label="Program Studi"
            placeholder="Semua prodi..."
            loadOptions={loadProdiOptions}
            value={filterProdi ? Number(filterProdi) : null}
            onChange={(opt: any) => setFilterProdi(opt?.value ? String(opt.value) : '')}
            isClearable
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setFilterProdi('');
                setAppliedProdi('');
                setShowFilter(false);
              }}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setAppliedProdi(filterProdi);
                setShowFilter(false);
              }}
            >
              Terapkan
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}