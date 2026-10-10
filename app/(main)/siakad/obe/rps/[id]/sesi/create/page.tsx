'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { siakadService } from '@/services/siakad.service';
import { SesiForm } from '../_components/SesiForm';
import toast from 'react-hot-toast';

export default function CreateSesiPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const rpsId = Number(params?.id);

  const [loading, setLoading] = useState(true);
  const [mataKuliahId, setMataKuliahId] = useState<number | undefined>(undefined);
  const [defaultMingguKe, setDefaultMingguKe] = useState(1);
  const [totalSisaBobot, setTotalSisaBobot] = useState(100);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!rpsId || Number.isNaN(rpsId)) {
        setLoading(false);
        return;
      }
      try {
        const [detailRes, sesiRes] = await Promise.all([
          siakadService.showRps(rpsId),
          siakadService.listRpsSesi(rpsId, { per_page: 50 }),
        ]);
        if (!active) return;
        const d = detailRes?.data;
        const mk = d?.mata_kuliah || d?.mataKuliah;
        if (mk?.id) setMataKuliahId(Number(mk.id));
        const list: any[] = Array.isArray(sesiRes?.data) ? sesiRes.data : [];
        const used = new Set(list.map((s: any) => Number(s.minggu_ke)));
        let next = 1;
        while (next <= 16 && used.has(next)) next += 1;
        setDefaultMingguKe(next <= 16 ? next : 1);
        
        const currentTotal = sesiRes?.meta?.total_bobot ? Number(sesiRes.meta.total_bobot) : list.reduce((sum, s) => sum + (Number(s.bobot_penilaian) || 0), 0);
        setTotalSisaBobot(Math.max(0, 100 - currentTotal));
      } catch (err: any) {
        if (active) toast.error(err?.response?.data?.message || 'Gagal memuat data RPS');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [rpsId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Tambah Sesi Pertemuan"
          description="Memuat data dokumen RPS..."
          breadcrumbs={[
            { label: 'Portal SSO', href: '/dashboard' },
            { label: 'SIAKAD', href: '/siakad' },
            { label: 'RPS', href: '/siakad/obe/rps/kelola' },
            { label: 'Edit RPS', href: `/siakad/obe/rps/${rpsId}/edit` },
            { label: 'Tambah Sesi' },
          ]}
        />
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <Loader2 size={16} className="animate-spin text-slate-400" />
          <span className="text-xs text-slate-500">Memuat data RPS...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Tambah Sesi Pertemuan"
        description="Penambahan rencana pembelajaran satu pertemuan: Sub-CPMK, penilaian, luring/daring, materi, dan bobot."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'RPS', href: '/siakad/obe/rps/kelola' },
          { label: 'Edit RPS', href: `/siakad/obe/rps/${rpsId}/edit` },
          { label: 'Tambah Sesi' },
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
        defaultMingguKe={defaultMingguKe} 
        submitLabel="Simpan Sesi" 
        totalSisaBobot={totalSisaBobot}
      />
    </div>
  );
}
