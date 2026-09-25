'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Award } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { SkalaNilaiForm, type SkalaNilaiFormValues } from '@/components/siakad/SkalaNilaiForm';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

export default function EditSkalaNilaiPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const [prodis, setProdis] = useState<any[]>([]);
  const [initial, setInitial] = useState<Partial<SkalaNilaiFormValues> | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [sRes, pRes] = await Promise.all([
          siakadService.getSkalaNilais({}),
          siakadService.getProdi(),
        ]);
        if (pRes.data) setProdis(pRes.data);
        const item = (sRes.data || []).find((s: any) => s.id === id);
        if (!item) {
          toast.error('Skala nilai tidak ditemukan');
          router.push('/siakad/master/skala-nilai');
          return;
        }
        setInitial({
          program_studi_id: item.program_studi_id || null,
          nilai_huruf: item.nilai_huruf,
          bobot_indeks: parseFloat(item.bobot_indeks) || 0,
          batas_bawah: parseFloat(item.batas_bawah) || 0,
          batas_atas: parseFloat(item.batas_atas) || 0,
          is_lulus: item.is_lulus ?? true,
          keterangan: item.keterangan || '',
        });
      } catch {
        toast.error('Gagal memuat data skala nilai');
      }
    };
    load();
  }, [id, router]);

  const handleSubmit = async (values: SkalaNilaiFormValues) => {
    try {
      await siakadService.updateSkalaNilai(id, values);
      toast.success('Skala nilai berhasil diperbarui');
      router.push('/siakad/master/skala-nilai');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal menyimpan skala nilai');
      throw err;
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Edit Skala Nilai Mutu"
        description="Perbarui rentang angka, bobot indeks, dan status kelulusan."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Skala Nilai', href: '/siakad/master/skala-nilai' },
          { label: 'Edit' },
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
              <p className="text-xs text-slate-500 mt-0.5">Perubahan berlaku untuk perhitungan KHS/Transkrip berikutnya.</p>
            </div>
          </div>
          {initial ? (
            <SkalaNilaiForm
              key={id}
              prodiOptions={prodis.map((p) => ({
                value: p.id,
                label: `${p.nama}${p.jenjang ? ` (${p.jenjang})` : ''}`,
              }))}
              defaultValues={initial}
              onSubmit={handleSubmit}
              onCancel={() => router.push('/siakad/master/skala-nilai')}
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
