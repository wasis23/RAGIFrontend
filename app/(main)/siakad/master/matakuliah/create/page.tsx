'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { MataKuliahForm, type MataKuliahFormValues } from '@/components/siakad/MataKuliahForm';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

export default function CreateMataKuliahPage() {
  const router = useRouter();
  const [kurikulums, setKurikulums] = useState<any[]>([]);

  useEffect(() => {
    siakadService
      .getKurikulums()
      .then((res) => {
        if (res.data) setKurikulums(res.data);
      })
      .catch(() => toast.error('Gagal memuat referensi kurikulum'));
  }, []);

  const handleSubmit = async (values: MataKuliahFormValues) => {
    try {
      await siakadService.createMataKuliah(values);
      toast.success('Mata kuliah berhasil ditambahkan');
      router.push('/siakad/master/matakuliah');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal menyimpan mata kuliah');
      throw err;
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Tambah Mata Kuliah Baru"
        description="Daftarkan mata kuliah ke kurikulum, bobot SKS, semester anjuran, dan tipe."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Mata Kuliah', href: '/siakad/master/matakuliah' },
          { label: 'Tambah MK' },
        ]}
        action={
          <Button
            variant="outline"
            icon={<ArrowLeft size={16} />}
            onClick={() => router.push('/siakad/master/matakuliah')}
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
              <BookOpen size={16} />
            </span>
            <div>
              <p className="text-xs font-extrabold text-slate-900">Identitas, Kurikulum & Bobot SKS</p>
              <p className="text-xs text-slate-500 mt-0.5">Prasyarat MK dapat diatur setelah MK tersimpan, via menu Kelola Prasyarat.</p>
            </div>
          </div>
          <MataKuliahForm
            kurikulumOptions={kurikulums.map((k) => ({
              value: k.id,
              label: `${k.nama} — ${k.program_studi?.nama || ''}`,
            }))}
            onSubmit={handleSubmit}
            onCancel={() => router.push('/siakad/master/matakuliah')}
          />
        </CardBody>
      </Card>
    </div>
  );
}
