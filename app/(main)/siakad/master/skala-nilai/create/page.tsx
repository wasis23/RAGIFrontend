'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Award } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { SkalaNilaiForm, type SkalaNilaiFormValues } from '@/components/siakad/SkalaNilaiForm';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

export default function CreateSkalaNilaiPage() {
  const router = useRouter();
  const [prodis, setProdis] = useState<any[]>([]);

  useEffect(() => {
    siakadService
      .getProdi()
      .then((res) => {
        if (res.data) setProdis(res.data);
      })
      .catch(() => toast.error('Gagal memuat referensi program studi'));
  }, []);

  const handleSubmit = async (values: SkalaNilaiFormValues) => {
    try {
      await siakadService.createSkalaNilai(values);
      toast.success('Skala nilai baru berhasil ditambahkan');
      router.push('/siakad/master/skala-nilai');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal menyimpan skala nilai');
      throw err;
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Tambah Skala Nilai Mutu"
        description="Konfigurasi rentang angka, huruf mutu, bobot indeks, dan status kelulusan."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Skala Nilai', href: '/siakad/master/skala-nilai' },
          { label: 'Tambah' },
        ]}
        action={
          <Button
            variant="outline"
            icon={<ArrowLeft size={16} />}
            onClick={() => router.push('/siakad/master/skala-nilai')}
            style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
          >
            Kembali
          </Button>
        }
      />

      <Card>
        <CardBody>
          <div className="flex items-start gap-3 pb-4 border-b border-slate-100 mb-4">
            <span
              className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
              style={{ background: 'var(--module-primary-subtle)', color: 'var(--module-primary)' }}
            >
              <Award size={16} />
            </span>
            <div>
              <p className="text-xs font-extrabold text-slate-900">Rentang, Bobot & Kelulusan</p>
              <p className="text-xs text-slate-500 mt-0.5">Kosongkan prodi untuk skala standar universitas.</p>
            </div>
          </div>
          <SkalaNilaiForm
            prodiOptions={prodis.map((p) => ({
              value: p.id,
              label: `${p.nama}${p.jenjang ? ` (${p.jenjang})` : ''}`,
            }))}
            onSubmit={handleSubmit}
            onCancel={() => router.push('/siakad/master/skala-nilai')}
          />
        </CardBody>
      </Card>
    </div>
  );
}
