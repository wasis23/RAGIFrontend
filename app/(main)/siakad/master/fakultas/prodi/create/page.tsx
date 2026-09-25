'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, GraduationCap } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { ProdiForm, type ProdiFormValues } from '@/components/siakad/ProdiForm';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

export default function CreateProdiPage() {
  const router = useRouter();
  const [fakultas, setFakultas] = useState<any[]>([]);

  useEffect(() => {
    siakadService
      .getFakultas()
      .then((res) => {
        if (res.data) setFakultas(res.data);
      })
      .catch(() => toast.error('Gagal memuat referensi fakultas'));
  }, []);

  const handleSubmit = async (values: ProdiFormValues) => {
    try {
      await siakadService.createProdi(values);
      toast.success('Program studi baru berhasil ditambahkan');
      router.push('/siakad/master/fakultas');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal menyimpan program studi');
      throw err;
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Tambah Program Studi Baru"
        description="Pendaftaran program studi baru ke dalam struktur fakultas universitas."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Fakultas & Prodi', href: '/siakad/master/fakultas' },
          { label: 'Tambah Prodi' },
        ]}
        action={
          <Button
            variant="outline"
            icon={<ArrowLeft size={16} />}
            onClick={() => router.push('/siakad/master/fakultas')}
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
              <GraduationCap size={16} />
            </span>
            <div>
              <p className="text-xs font-extrabold text-slate-900">Identitas, Kepemimpinan & Akreditasi</p>
              <p className="text-xs text-slate-500 mt-0.5">Fakultas induk, kode PDDIKTI, jenjang, kaprodi, dan status akreditasi.</p>
            </div>
          </div>
          <ProdiForm
            fakultasOptions={fakultas.map((f) => ({ value: f.id, label: `${f.kode} — ${f.nama}` }))}
            defaultValues={fakultas[0] ? { fakultas_id: fakultas[0].id } : undefined}
            onSubmit={handleSubmit}
            onCancel={() => router.push('/siakad/master/fakultas')}
          />
        </CardBody>
      </Card>
    </div>
  );
}
