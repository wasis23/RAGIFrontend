'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CalendarCheck } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { DistribusiMengajarForm, type DistribusiMengajarFormValues } from '@/components/siakad/DistribusiMengajarForm';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

export default function CreateDistribusiMengajarPage() {
  const router = useRouter();
  const [tahunAktifNama, setTahunAktifNama] = useState('');
  const [tahunAktifId, setTahunAktifId] = useState<number | null>(null);

  useEffect(() => {
    siakadService
      .getTahunAkademiks()
      .then((res) => {
        const list: any[] = res.data || [];
        const active = list.find((t: any) => t.is_active) || list[0];
        if (active) {
          setTahunAktifNama(active.nama || '');
          setTahunAktifId(active.id);
        }
      })
      .catch(() => toast.error('Gagal memuat tahun akademik aktif'));
  }, []);

  const handleSubmit = async (values: DistribusiMengajarFormValues) => {
    try {
      await siakadService.createDistribusiMengajar({
        ...values,
        tahun_akademik_id: values.tahun_akademik_id ?? tahunAktifId,
        is_active: true,
      });
      toast.success('Distribusi mengajar berhasil ditambahkan');
      router.push('/siakad/obe/distribusi-mk');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal menyimpan distribusi mengajar');
      throw err;
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Tambah Distribusi Mengajar"
        description="Penugasan dosen koordinator dan tim pengajar mata kuliah per semester."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Distribusi Mata Kuliah', href: '/siakad/obe/distribusi-mk' },
          { label: 'Tambah' },
        ]}
        action={
          <Button
            variant="outline"
            icon={<ArrowLeft size={16} />}
            onClick={() => router.push('/siakad/obe/distribusi-mk')}
            className="border-[var(--module-primary)] text-[var(--module-primary)] hover:bg-[var(--module-primary-subtle)]"
          >
            Kembali
          </Button>
        }
      />

      <Card>
        <CardBody>
          <div className="flex items-start gap-3 pb-4 border-b border-slate-100 mb-4">
            <span
              className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0 bg-[var(--module-primary-subtle)] text-[var(--module-primary)]"
            >
              <CalendarCheck size={16} />
            </span>
            <div>
              <p className="text-xs font-extrabold text-slate-900">Penugasan Pengajar Mata Kuliah</p>
              <p className="text-xs text-slate-500 mt-0.5">Kurikulum, mata kuliah, semester, dan tim dosen pengajar.</p>
            </div>
          </div>
          <DistribusiMengajarForm
            tahunAktifNama={tahunAktifNama}
            defaultValues={{ tahun_akademik_id: tahunAktifId, tahunAkademikNama: tahunAktifNama }}
            onSubmit={handleSubmit}
            onCancel={() => router.push('/siakad/obe/distribusi-mk')}
          />
        </CardBody>
      </Card>
    </div>
  );
}
