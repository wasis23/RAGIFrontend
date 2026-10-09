'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Filter } from 'lucide-react';
import {
  CplMkMatrix,
  CplMkLegend,
  MatrixPrintButton,
  type CplMkCol,
  type CplMkRow,
} from '@/components/siakad/CplMkMatrix';
import { loadProdiOptions } from '@/components/siakad/RubrikForm';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

export default function PemetaanCplMkPage() {
  const [mataKuliahs, setMataKuliahs] = useState<CplMkRow[]>([]);
  const [cpls, setCpls] = useState<CplMkCol[]>([]);
  const [eligible, setEligible] = useState<Set<string>>(new Set());
  const [pairs, setPairs] = useState<Set<string>>(new Set());
  const [yatim, setYatim] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  const [showFilter, setShowFilter] = useState(false);
  const [filterProdi, setFilterProdi] = useState('');
  const [appliedProdi, setAppliedProdi] = useState('');

  const fetchData = useCallback(async (prodiId?: string) => {
    setLoading(true);
    try {
      const res = await siakadService.getMatrixCplMataKuliah({
        program_studi_id: prodiId ? Number(prodiId) : undefined,
      });
      const payload = res?.data || {};

      setMataKuliahs(
        (payload.mata_kuliahs || []).map((m: any) => ({
          id: m.id,
          kode: m.kode_mk || '-',
          detail: m.nama,
        })),
      );
      setCpls((payload.cpls || []).map((c: any) => ({ id: c.id, kode: c.kode_cpl || '-' })));
      setEligible(new Set((payload.eligible || []).map((e: any) => `${e.cpl_id}-${e.mata_kuliah_id}`)));
      setPairs(new Set((payload.pairs || []).map((p: any) => `${p.cpl_id}-${p.mata_kuliah_id}`)));
      setYatim(new Set(payload.yatim || []));
    } catch {
      toast.error('Gagal memuat matriks pemetaan CPL-MK');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(appliedProdi || undefined);
  }, [appliedProdi, fetchData]);

  const handleToggle = async (cplId: number, mataKuliahId: number, checked: boolean) => {
    const key = `${cplId}-${mataKuliahId}`;
    setTogglingKey(key);

    // Snapshot untuk rollback bila server menolak.
    const prevPairs = pairs;
    const prevYatim = yatim;

    try {
      await siakadService.toggleMatrixCplMataKuliah({
        cpl_id: cplId,
        mata_kuliah_id: mataKuliahId,
        is_checked: checked,
      });

      setPairs((prev) => {
        const updated = new Set(prev);
        if (checked) updated.add(key);
        else updated.delete(key);
        return updated;
      });
      setYatim((prev) => {
        const updated = new Set(prev);
        updated.delete(key);
        return updated;
      });
      toast.success(checked ? 'Pemetaan CPL-MK disimpan' : 'Pemetaan CPL-MK dilepas');
    } catch (err: any) {
      setPairs(prevPairs);
      setYatim(prevYatim);
      toast.error(err?.response?.data?.message || 'Gagal menyimpan pemetaan CPL-MK');
    } finally {
      setTogglingKey(null);
    }
  };

  /**
   * Sel terkunci diklik: beri tahu penyebab spesifik, bukan pesan generik, agar
   * Kaprodi tahu harus去哪里 menyelesaikan pemetaan yang kurang.
   */
  const handleLockedClick = (row: CplMkRow, col: CplMkCol) => {
    const cpl = cpls.find((c) => c.id === col.id);
    const cplAdaBk = eligible.size === 0;

    if (cplAdaBk) {
      toast(
        `Belum ada pemetaan CPL-BK sama sekali. Selesaikan di Pemetaan CPL-BK sebelum mencentang ${col.kode}.`,
        { icon: '🔒' },
      );
      return;
    }

    toast(
      `${col.kode} belum punya jalur menuju ${row.kode}. Petakan ${col.kode} ke Bahan Kajian di Pemetaan CPL-BK, lalu Bahan Kajian tersebut ke ${row.kode} di Pemetaan BK-MK.`,
      { icon: '🔒' },
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Pemetaan CPL-MK"
        description="Matriks pemetaan Capaian Pembelajaran Lulusan (CPL) dengan Mata Kuliah (MK) program studi."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Pemetaan CPL-MK' },
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
            <MatrixPrintButton onPrint={() => window.print()} />
          </div>
        }
      />

      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs text-xs text-slate-700">
        <strong>Catatan:</strong> Hanya CPL yang sudah memiliki jalur melalui Bahan Kajian dan Mata Kuliah yang dapat
        dipilih pada matriks ini.
      </div>

      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <CplMkLegend />
      </div>

      <CplMkMatrix
        rows={mataKuliahs}
        cols={cpls}
        eligible={eligible}
        pairs={pairs}
        yatim={yatim}
        onToggle={handleToggle}
        onLockedClick={handleLockedClick}
        togglingKey={togglingKey}
        loading={loading}
        emptyMessage="Belum ada mata kuliah aktif yang terdaftar untuk program studi ini."
      />

      <Drawer open={showFilter} onClose={() => setShowFilter(false)} title="Filter Matriks CPL-MK">
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