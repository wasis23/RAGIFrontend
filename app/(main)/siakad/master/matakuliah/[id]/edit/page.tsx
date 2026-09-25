'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { MataKuliahForm, type MataKuliahFormValues } from '@/components/siakad/MataKuliahForm';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

export default function EditMataKuliahPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const [kurikulums, setKurikulums] = useState<any[]>([]);
  const [initial, setInitial] = useState<Partial<MataKuliahFormValues> | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [kRes, mRes] = await Promise.all([
          siakadService.getKurikulums(),
          siakadService.getMataKuliahs({ per_page: 500 }),
        ]);
        if (kRes.data) setKurikulums(kRes.data);
        const item = (mRes.data || []).find((m: any) => m.id === id);
        if (!item) {
          toast.error('Mata kuliah tidak ditemukan');
          router.push('/siakad/master/matakuliah');
          return;
        }
        setInitial({
          kurikulum_id: item.kurikulum_id,
          kode_mk: item.kode_mk,
          nama: item.nama,
          sks_teori: item.sks_teori,
          sks_praktik: item.sks_praktik,
          semester_anjuran: item.semester_anjuran,
          tipe: item.tipe,
        });
      } catch {
        toast.error('Gagal memuat data mata kuliah');
      }
    };
    load();
  }, [id, router]);

  const handleSubmit = async (values: MataKuliahFormValues) => {
    try {
      await siakadService.updateMataKuliah(id, values);
      toast.success('Mata kuliah berhasil diperbarui');
      router.push('/siakad/master/matakuliah');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal menyimpan mata kuliah');
      throw err;
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Edit Mata Kuliah"
        description="Perbarui identitas, bobot SKS, semester anjuran, dan tipe mata kuliah."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Mata Kuliah', href: '/siakad/master/matakuliah' },
          { label: 'Edit MK' },
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
              <p className="text-xs text-slate-500 mt-0.5">Kode dan kurikulum acuan tidak dapat diubah setelah dibuat.</p>
            </div>
          </div>
          {initial ? (
            <MataKuliahForm
              key={id}
              isEditing
              kurikulumOptions={kurikulums.map((k) => ({
                value: k.id,
                label: `${k.nama} — ${k.program_studi?.nama || ''}`,
              }))}
              defaultValues={initial}
              onSubmit={handleSubmit}
              onCancel={() => router.push('/siakad/master/matakuliah')}
              submitLabel="Simpan Perubahan"
            />
          ) : (
            <div className="h-40 rounded-xl bg-slate-100 animate-pulse" />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
