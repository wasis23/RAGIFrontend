'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { siakadService } from '@/services/siakad.service';
import { SesiForm } from '../../_components/SesiForm';
import toast from 'react-hot-toast';

export default function EditSesiPage() {
  const router = useRouter();
  const params = useParams<{ id: string; sesiId: string }>();
  const rpsId = Number(params?.id);
  const sesiId = Number(params?.sesiId);

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [mataKuliahId, setMataKuliahId] = useState<number | undefined>(undefined);
  const [initial, setInitial] = useState<any | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!rpsId || Number.isNaN(rpsId) || !sesiId || Number.isNaN(sesiId)) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      try {
        const [detailRes, sesiRes] = await Promise.all([
          siakadService.showRps(rpsId),
          siakadService.listRpsSesi(rpsId),
        ]);
        if (!active) return;
        const d = detailRes?.data;
        const mk = d?.mata_kuliah || d?.mataKuliah;
        if (mk?.id) setMataKuliahId(Number(mk.id));
        const list: any[] = Array.isArray(sesiRes?.data) ? sesiRes.data : [];
        const found = list.find((s: any) => Number(s.id) === sesiId);
        if (!found) {
          setNotFound(true);
          return;
        }
        setInitial(found);
      } catch (err: any) {
        if (active) {
          setNotFound(true);
          toast.error(err?.response?.data?.message || 'Gagal memuat sesi pertemuan');
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [rpsId, sesiId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Ubah Sesi Pertemuan"
          description="Memuat data sesi pertemuan..."
          breadcrumbs={[
            { label: 'Portal SSO', href: '/dashboard' },
            { label: 'SIAKAD', href: '/siakad' },
            { label: 'RPS', href: '/siakad/obe/rps/kelola' },
            { label: 'Edit RPS', href: `/siakad/obe/rps/${rpsId}/edit` },
            { label: 'Ubah Sesi' },
          ]}
        />
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <Loader2 size={16} className="animate-spin text-slate-400" />
          <span className="text-xs text-slate-500">Memuat sesi pertemuan...</span>
        </div>
      </div>
    );
  }

  if (notFound || !initial) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Ubah Sesi Pertemuan"
          description="Sesi pertemuan tidak ditemukan atau tidak dapat diakses."
          breadcrumbs={[
            { label: 'Portal SSO', href: '/dashboard' },
            { label: 'SIAKAD', href: '/siakad' },
            { label: 'RPS', href: '/siakad/obe/rps/kelola' },
            { label: 'Edit RPS', href: `/siakad/obe/rps/${rpsId}/edit` },
            { label: 'Ubah Sesi' },
          ]}
          action={
            <Button
              variant="outline"
              icon={<ArrowLeft size={16} />}
              onClick={() => router.push(`/siakad/obe/rps/${rpsId}/edit`)}
              style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
            >
              Kembali
            </Button>
          }
        />
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-sm text-slate-500">
            Sesi pertemuan dengan ID <span className="font-mono font-bold">{sesiId || '-'}</span> tidak ditemukan.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title={`Ubah Sesi Pertemuan ${initial.minggu_ke}`}
        description="Perubahan Sub-CPMK, penilaian, luring/daring, materi, dan bobot sesi pertemuan RPS."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'RPS', href: '/siakad/obe/rps/kelola' },
          { label: 'Edit RPS', href: `/siakad/obe/rps/${rpsId}/edit` },
          { label: 'Ubah Sesi' },
        ]}
        action={
          <Button
            variant="outline"
            icon={<ArrowLeft size={16} />}
            onClick={() => router.push(`/siakad/obe/rps/${rpsId}/edit`)}
            style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
          >
            Kembali
          </Button>
        }
      />

      <SesiForm
        rpsId={rpsId}
        mataKuliahId={mataKuliahId}
        initial={initial}
        defaultMingguKe={Number(initial.minggu_ke) || 1}
        submitLabel="Simpan Perubahan"
      />
    </div>
  );
}
