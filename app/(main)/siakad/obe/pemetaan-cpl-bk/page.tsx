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
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

export default function PemetaanCplBkPage() {
  const [cpls, setCpls] = useState<MatrixRow[]>([]);
  const [bahanKajians, setBahanKajians] = useState<MatrixCol[]>([]);
  const [pairs, setPairs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

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
      const res = await siakadService.getMatrixCplBahanKajian({
        kurikulum_id: kurikulumId ? Number(kurikulumId) : undefined,
      });
      const payload = res?.data || {};
      setCpls(
        (payload.cpls || []).map((c: any) => ({
          id: c.id,
          kode: c.kode_cpl || '-',
          detail: c.deskripsi,
        })),
      );
      setBahanKajians(
        (payload.bahan_kajians || []).map((b: any) => ({
          id: b.id,
          kode: b.kode_bk,
          nama: b.nama_bk,
        })),
      );
      setPairs(new Set((payload.pairs || []).map((p: any) => `${p.cpl_id}-${p.bahan_kajian_id}`)));
    } catch {
      toast.error('Gagal memuat matriks pemetaan CPL-BK');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kurikulumId]);

  const handleToggle = async (cplId: number, bahanKajianId: number, checked: boolean) => {
    const key = `${cplId}-${bahanKajianId}`;
    const bahanKajianIds = bahanKajians
      .filter((b) => pairs.has(`${cplId}-${b.id}`))
      .map((b) => b.id)
      .filter((id) => (checked ? id !== bahanKajianId : true));

    const nextIds = checked ? bahanKajianIds : [...bahanKajianIds, bahanKajianId];

    setTogglingKey(key);
    try {
      await siakadService.syncCplBahanKajian({ cpl_id: cplId, bahan_kajian_ids: nextIds });

      setPairs((prev) => {
        const updated = new Set(prev);
        if (checked) updated.delete(key);
        else updated.add(key);
        return updated;
      });
      toast.success(checked ? 'Korelasi dilepas' : 'Korelasi CPL-BK disimpan');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan pemetaan CPL-BK');
    } finally {
      setTogglingKey(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Pemetaan CPL - BK"
        description="Matriks pemetaan Capaian Pembelajaran Lulusan (CPL) dengan Bahan Kajian (BK) program studi."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Pemetaan CPL-BK' },
        ]}
        action={<MatrixPrintButton onPrint={() => window.print()} />}
      />

      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs text-xs text-slate-700">
        <strong>Catatan:</strong> Pemetaan CPL dan BK dilakukan untuk mengetahui setiap CPL memiliki komponen Bahan Kajian tertentu.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        rowLabel="Kode CPL"
        colGroupLabel="Bahan Kajian"
        loadingLabel="CPL-BK"
        rows={cpls}
        cols={bahanKajians}
        pairs={pairs}
        onToggle={handleToggle}
        togglingKey={togglingKey}
        loading={loading}
        emptyMessage="Belum ada CPL aktif yang terdaftar untuk program studi ini."
        onPrint={() => window.print()}
      />
    </div>
  );
}
