'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, CalendarCheck } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { TahunAkademikForm, tahunAkademikFromRow, type TahunAkademikFormValues } from '@/components/siakad/TahunAkademikForm';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

export default function EditTahunAkademikPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const [initial, setInitial] = useState<Partial<TahunAkademikFormValues> | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await siakadService.getTahunAkademiks();
        const item = (res.data || []).find((t: any) => t.id === id);
        if (!item) {
          toast.error('Periode tidak ditemukan');
          router.push('/siakad/master/tahun-akademik');
          return;
        }
        setInitial(tahunAkademikFromRow(item));
      } catch {
        toast.error('Gagal memuat data periode');
      }
    };
    load();
  }, [id, router]);

  const handleSubmit = async (values: Record<string, any>) => {
    try {
      const { kode, ...payload } = values;
      void kode;
      await siakadService.updateTahunAkademik(id, payload);
      toast.success('Periode tahun akademik berhasil diperbarui');
      router.push('/siakad/master/tahun-akademik');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal memperbarui periode');
      throw err;
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Edit Periode Tahun Akademik"
        description="Perbarui kalender jendela akademik dan mode penilaian periode."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Tahun Akademik', href: '/siakad/master/tahun-akademik' },
          { label: 'Edit Periode' },
        ]}
        action={
          <Button
            variant="outline"
            icon={<ArrowLeft size={16} />}
            onClick={() => router.push('/siakad/master/tahun-akademik')}
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
              <CalendarCheck size={16} />
            </span>
            <div>
              <p className="text-xs font-extrabold text-slate-900">Identitas, Kalender & Mode Penilaian</p>
              <p className="text-xs text-slate-500 mt-0.5">Kode periode tidak dapat diubah setelah dibuat.</p>
            </div>
          </div>
          {initial ? (
            <TahunAkademikForm
              key={id}
              isEditing
              defaultValues={initial}
              onSubmit={handleSubmit}
              onCancel={() => router.push('/siakad/master/tahun-akademik')}
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
