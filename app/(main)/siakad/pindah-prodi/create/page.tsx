'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardBody } from '@/components/ui/Card';
import { PeriodeSelector } from '@/components/siakad/PeriodeSelector';
import { siakadService } from '@/services/siakad.service';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

const pengajuanSchema = z.object({
  mahasiswa_id: z.number({ error: 'Mahasiswa wajib dipilih' }).min(1, 'Mahasiswa wajib dipilih'),
  new_program_studi_id: z.number({ error: 'Prodi tujuan wajib dipilih' }).min(1, 'Prodi tujuan wajib dipilih'),
  tahun_akademik_id: z.number().nullable().optional(),
  semester_efektif: z.number().min(1).max(14).nullable().optional(),
  tanggal_efektif: z.string().nullable().optional(),
  alasan: z.string().min(10, 'Alasan minimal 10 karakter').max(1000, 'Alasan maksimal 1000 karakter'),
  referensi_surat: z.string().max(255, 'Maksimal 255 karakter').nullable().optional(),
});

type PengajuanValues = z.infer<typeof pengajuanSchema>;

export default function CreatePindahProdiPage() {
  const router = useRouter();
  const [prodis, setProdis] = useState<any[]>([]);

  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<PengajuanValues>({
    resolver: zodResolver(pengajuanSchema),
    defaultValues: {
      mahasiswa_id: 0, new_program_studi_id: 0, tahun_akademik_id: null,
      semester_efektif: null, tanggal_efektif: null, alasan: '', referensi_surat: null,
    },
  });

  useEffect(() => {
    siakadService.getProdi().then((res) => res.data && setProdis(res.data)).catch(() => {});
  }, []);

  const loadMahasiswaOptions = async (keyword: string) => {
    try {
      const res = await siakadService.getMahasiswas({ per_page: 30, search: keyword || undefined });
      const list: any[] = res.data || [];
      return list.map((m: any) => ({
        value: m.id,
        label: `${m.nama_lengkap} — ${m.nim}`,
        sublabel: m.program_studi?.nama || '',
        raw: m,
      }));
    } catch {
      return [];
    }
  };

  const onSubmit = async (values: PengajuanValues) => {
    try {
      const res = await siakadService.createPindahProdi({
        mahasiswa_id: values.mahasiswa_id,
        new_program_studi_id: values.new_program_studi_id,
        tahun_akademik_id: values.tahun_akademik_id ?? undefined,
        semester_efektif: values.semester_efektif ?? undefined,
        tanggal_efektif: values.tanggal_efektif ?? undefined,
        alasan: values.alasan,
        referensi_surat: values.referensi_surat ?? undefined,
      });
      toast.success('Pengajuan dibuat, menunggu sign-off keuangan');
      router.push(`/siakad/pindah-prodi/${res.data?.id || ''}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal membuat pengajuan');
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Pengajuan Pindah Prodi"
        description="Formulir mutasi program studi. Setelah diajukan: cek keuangan → persetujuan → penerapan."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Pindah Prodi', href: '/siakad/pindah-prodi' },
          { label: 'Pengajuan Baru' },
        ]}
        action={
          <Button
            variant="outline"
            icon={<ArrowLeft size={16} />}
            onClick={() => router.push('/siakad/pindah-prodi')}
            style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
          >
            Kembali
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Card>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Controller
                  name="mahasiswa_id"
                  control={control}
                  render={({ field }) => (
                    <AsyncSelect
                      label="Mahasiswa"
                      required
                      placeholder="Cari NIM / nama..."
                      loadOptions={loadMahasiswaOptions}
                      value={field.value || null}
                      onChange={(opt: any) => field.onChange(opt?.value ? Number(opt.value) : 0)}
                      error={errors.mahasiswa_id?.message}
                    />
                  )}
                />
              </div>
              <Controller
                name="new_program_studi_id"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Prodi Tujuan"
                    required
                    placeholder="Pilih prodi..."
                    options={prodis.map((p: any) => ({ value: p.id, label: `${p.nama}${p.jenjang ? ` (${p.jenjang})` : ''}` }))}
                    value={field.value || ''}
                    onChange={(v: any) => field.onChange(v ? Number(v) : 0)}
                    error={errors.new_program_studi_id?.message}
                  />
                )}
              />
              <Controller
                name="tahun_akademik_id"
                control={control}
                render={({ field }) => (
                  <PeriodeSelector value={field.value || null} onChange={(id) => field.onChange(id)} error={errors.tahun_akademik_id?.message} />
                )}
              />
              <Controller
                name="semester_efektif"
                control={control}
                render={({ field }) => (
                  <Input
                    label="Semester Efektif"
                    type="number"
                    min={1}
                    max={14}
                    placeholder="cth. 3"
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    error={errors.semester_efektif?.message}
                  />
                )}
              />
              <Input label="Tanggal Efektif" type="date" error={errors.tanggal_efektif?.message} {...register('tanggal_efektif')} />
              <div className="md:col-span-2">
                <Textarea label="Alasan Pindah" required placeholder="Minimal 10 karakter..." error={errors.alasan?.message} {...register('alasan')} />
              </div>
              <Input label="Referensi Surat" placeholder="No. surat pengantar (opsional)" error={errors.referensi_surat?.message} {...register('referensi_surat')} />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={() => router.push('/siakad/pindah-prodi')}>
                Batal
              </Button>
              <Button type="submit" variant="primary" icon={<Save size={16} />} loading={isSubmitting} disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : 'Ajukan Pindah Prodi'}
              </Button>
            </div>
          </CardBody>
        </Card>
      </form>
    </div>
  );
}
