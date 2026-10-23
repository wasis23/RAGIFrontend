'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, GraduationCap } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Card, CardBody } from '@/components/ui/Card';
import { PeriodeSelector } from '@/components/siakad/PeriodeSelector';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

const yudisiumSchema = z.object({
  mahasiswa_id: z.number({ error: 'Mahasiswa wajib dipilih' }).min(1, 'Mahasiswa wajib dipilih'),
  tahun_akademik_id: z.number({ error: 'Periode wajib dipilih' }).min(1, 'Periode wajib dipilih'),
  tanggal_sidang: z.string().nullable().optional(),
  ipk_akhir: z.number({ error: 'IPK wajib diisi' }).min(2, 'IPK minimal 2.00 untuk yudisium').max(4, 'IPK maksimal 4.00'),
  total_sks: z.number({ error: 'Total SKS wajib diisi' }).min(144, 'Minimal 144 SKS untuk yudisium'),
  masa_studi_semester: z.number({ error: 'Masa studi wajib diisi' }).min(1, 'Minimal 1 semester').max(28, 'Maksimal 28 semester'),
  predikat: z.string().nullable().optional(),
  nomor_ijazah: z.string().max(100, 'Maksimal 100 karakter').nullable().optional(),
  tanggal_ijazah: z.string().nullable().optional(),
});

type YudisiumValues = z.infer<typeof yudisiumSchema>;

function TambahYudisiumContent() {
  const params = useSearchParams();
  const router = useRouter();
  const mhsParam = params.get('mhs') ? Number(params.get('mhs')) : 0;

  const { register, control, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<YudisiumValues>({
    resolver: zodResolver(yudisiumSchema),
    defaultValues: {
      mahasiswa_id: mhsParam || 0, tahun_akademik_id: 0, tanggal_sidang: null,
      ipk_akhir: 0, total_sks: 0, masa_studi_semester: 8,
      predikat: null, nomor_ijazah: null, tanggal_ijazah: null,
    },
  });

  useEffect(() => {
    if (!mhsParam) return;
    siakadService.cekSyaratKelulusan(mhsParam).then((res) => {
      const d: any = res.data || null;
      if (!d) return;
      setValue('mahasiswa_id', d.mahasiswa?.id || mhsParam, { shouldValidate: true });
      setValue('ipk_akhir', Number(d.ipk || 0), { shouldValidate: true });
      setValue('total_sks', Number(d.total_sks || 0), { shouldValidate: true });
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mhsParam]);

  const loadMahasiswaOptions = async (keyword: string) => {
    try {
      const res = await siakadService.getMahasiswas({ per_page: 30, search: keyword || undefined });
      const list: any[] = res.data || [];
      return list.map((m: any) => ({
        value: m.id,
        label: `${m.nama_lengkap} — ${m.nim} (IPK ${Number(m.ipk || 0).toFixed(2)})`,
        sublabel: m.program_studi?.nama || '',
        raw: m,
      }));
    } catch {
      return [];
    }
  };

  const onSubmit = async (values: YudisiumValues) => {
    try {
      await siakadService.createKelulusan({
        mahasiswa_id: values.mahasiswa_id,
        tahun_akademik_id: values.tahun_akademik_id,
        tanggal_sidang: values.tanggal_sidang || undefined,
        ipk_akhir: values.ipk_akhir,
        total_sks: values.total_sks,
        masa_studi_semester: values.masa_studi_semester,
        predikat: values.predikat || undefined,
        nomor_ijazah: values.nomor_ijazah || undefined,
        tanggal_ijazah: values.tanggal_ijazah || undefined,
      });
      toast.success('Yudisium ditetapkan, status mahasiswa menjadi lulus');
      router.push('/siakad/kelulusan');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menetapkan yudisium');
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Penetapan Yudisium"
        description="Tetapkan kelulusan mahasiswa yang memenuhi syarat (min. IPK 2.00 & 144 SKS)."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Kelulusan', href: '/siakad/kelulusan' },
          { label: 'Tetapkan Yudisium' },
        ]}
        action={
          <Button
            variant="outline"
            icon={<ArrowLeft size={16} />}
            onClick={() => router.push('/siakad/kelulusan')}
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
                name="tahun_akademik_id"
                control={control}
                render={({ field }) => (
                  <PeriodeSelector value={field.value || null} onChange={(id) => field.onChange(id)} required error={errors.tahun_akademik_id?.message} />
                )}
              />
              <Input label="Tanggal Sidang" type="date" error={errors.tanggal_sidang?.message} {...register('tanggal_sidang')} />
              <Input label="IPK Akhir" type="number" step="0.01" min={0} max={4} required error={errors.ipk_akhir?.message} {...register('ipk_akhir', { valueAsNumber: true })} />
              <Input label="Total SKS" type="number" min={100} required error={errors.total_sks?.message} {...register('total_sks', { valueAsNumber: true })} />
              <Input label="Masa Studi (semester)" type="number" min={1} max={28} required error={errors.masa_studi_semester?.message} {...register('masa_studi_semester', { valueAsNumber: true })} />
              <Input label="Predikat" placeholder="cth. Dengan Pujian" error={errors.predikat?.message} {...register('predikat')} />
              <Input label="Nomor Ijazah" placeholder="No. seri ijazah" error={errors.nomor_ijazah?.message} {...register('nomor_ijazah')} />
              <Input label="Tanggal Ijazah" type="date" error={errors.tanggal_ijazah?.message} {...register('tanggal_ijazah')} />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={() => router.push('/siakad/kelulusan')}>
                Batal
              </Button>
              <Button type="submit" variant="primary" icon={<GraduationCap size={16} />} loading={isSubmitting} disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : 'Tetapkan Lulus'}
              </Button>
            </div>
          </CardBody>
        </Card>
      </form>
    </div>
  );
}

export default function TambahYudisiumPage() {
  return (
    <Suspense fallback={<p className="text-xs font-bold text-slate-400 animate-pulse">Memuat...</p>}>
      <TambahYudisiumContent />
    </Suspense>
  );
}
