'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import {
  BahanKajianMatrix,
  MatrixPrintButton,
  type MatrixCol,
  type MatrixRow,
} from '@/components/siakad/BahanKajianMatrix';
import { loadProdiOptions } from '@/components/siakad/RubrikForm';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

export default function PemetaanBkMkPage() {
  const [mataKuliahs, setMataKuliahs] = useState<MatrixRow[]>([]);
  const [bahanKajians, setBahanKajians] = useState<MatrixCol[]>([]);
  const [pairs, setPairs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  const [prodiId, setProdiId] = useState('');
  const [kurikulumId, setKurikulumId] = useState('');

  const loadKurikulumOptions = useCallback(async (keyword: string) => {
    try {
      const res = await siakadService.getKurikulums({ search: keyword || undefined, per_page: 50 });
      const raw = res?.data;
      const list: any[] = Array.isArray(raw) ? raw : (raw?.items || raw?.data || []);
      return list.map((k: any) => ({
        value: k.id,
        label: `${k.nama || k.kode || `Kurikulum #${k.id}`}${k.tahun_berlaku ? ` — ${k.tahun_berlaku}` : ''}`,
        raw: k,
      }));
    } catch {
      return [];
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await siakadService.getMatrixBahanKajianMataKuliah({
        program_studi_id: prodiId ? Number(prodiId) : undefined,
        kurikulum_id: kurikulumId ? Number(kurikulumId) : undefined,
      });
      const payload = res?.data || {};
      setMataKuliahs(
        (payload.mata_kuliahs || []).map((m: any) => ({
          id: m.id,
          kode: m.kode_mk || '-',
          detail: m.nama,
        })),
      );
      setBahanKajians(
        (payload.bahan_kajians || []).map((b: any) => ({
          id: b.id,
          kode: b.kode_bk,
          nama: b.nama_bk,
        })),
      );
      setPairs(new Set((payload.pairs || []).map((p: any) => `${p.mata_kuliah_id}-${p.bahan_kajian_id}`)));
    } catch {
      toast.error('Gagal memuat matriks pemetaan BK-MK');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prodiId, kurikulumId]);

  // Default: batasi ke program studi aktif pertama agar matriks tidak menampilkan
  // seluruh prodi sekaligus. Endpoint prodi hanya mengembalikan prodi aktif.
  useEffect(() => {
    let mounted = true;
    siakadService
      .getProdi({ per_page: 50 })
      .then((res) => {
        if (!mounted || prodiId) return;
        const raw = res?.data;
        const list: any[] = Array.isArray(raw) ? raw : (raw?.items || raw?.data || []);
        const first = list.find((p: any) => p?.is_active !== false);
        if (first?.id) setProdiId(String(first.id));
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Baris matriks = Mata Kuliah, kolom = Bahan Kajian. Endpoint menyinkronkan
  // per Bahan Kajian, jadi klik di satu sel akan memakai daftar MK milik BK tersebut.
  const handleToggle = async (mataKuliahId: number, bahanKajianId: number, checked: boolean) => {
    const key = `${mataKuliahId}-${bahanKajianId}`;
    const mataKuliahIds = mataKuliahs
      .filter((m) => pairs.has(`${m.id}-${bahanKajianId}`))
      .map((m) => m.id)
      .filter((id) => (checked ? id !== mataKuliahId : true));

    const nextIds = checked ? mataKuliahIds : [...mataKuliahIds, mataKuliahId];

    setTogglingKey(key);
    try {
      await siakadService.syncBahanKajianMataKuliah({
        bahan_kajian_id: bahanKajianId,
        mata_kuliah_ids: nextIds,
      });

      setPairs((prev) => {
        const updated = new Set(prev);
        if (checked) updated.delete(key);
        else updated.add(key);
        return updated;
      });
      toast.success(checked ? 'Korelasi dilepas' : 'Korelasi BK-MK disimpan');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan pemetaan BK-MK');
    } finally {
      setTogglingKey(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Pemetaan BK - MK"
        description="Matriks pemetaan Bahan Kajian (BK) dengan Mata Kuliah (MK) program studi."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Pemetaan BK-MK' },
        ]}
        action={<MatrixPrintButton onPrint={() => window.print()} />}
      />

      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs text-xs text-slate-700">
        <strong>Catatan:</strong> Pemetaan BK dan MK dilakukan untuk mengetahui suatu Bahan Kajian memiliki Mata Kuliah tertentu.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AsyncSelect
          label="Program Studi"
          placeholder="Semua prodi..."
          loadOptions={loadProdiOptions}
          value={prodiId ? Number(prodiId) : null}
          onChange={(opt: any) => setProdiId(opt?.value ? String(opt.value) : '')}
          isClearable
        />
        <AsyncSelect
          label="Kurikulum"
          placeholder="Semua kurikulum..."
          loadOptions={loadKurikulumOptions}
          value={kurikulumId ? Number(kurikulumId) : null}
          onChange={(opt: any) => setKurikulumId(opt?.value ? String(opt.value) : '')}
          isClearable
        />
      </div>

      <BahanKajianMatrix
        rowLabel="Kode MK"
        colGroupLabel="Bahan Kajian"
        loadingLabel="BK-MK"
        rows={mataKuliahs}
        cols={bahanKajians}
        pairs={pairs}
        onToggle={handleToggle}
        togglingKey={togglingKey}
        loading={loading}
        emptyMessage="Belum ada mata kuliah aktif yang terdaftar untuk program studi ini."
        onPrint={() => window.print()}
      />
    </div>
  );
}
