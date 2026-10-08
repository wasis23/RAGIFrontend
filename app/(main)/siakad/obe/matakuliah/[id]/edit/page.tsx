'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, type SelectOption } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Card, CardBody } from '@/components/ui/Card';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

const KATEGORI_MK_FORM_OPTIONS: SelectOption[] = [
  { value: 'Wajib', label: 'Wajib' },
  { value: 'Pilihan', label: 'Pilihan' },
  { value: 'Wajib Prodi', label: 'Wajib Prodi' },
];

const STATUS_MK_FORM_OPTIONS: SelectOption[] = [
  { value: 'aktif', label: 'Aktif' },
  { value: 'nonaktif', label: 'Nonaktif' },
];

const mataKuliahSchema = z.object({
  kurikulum_id: z.string().min(1, 'Kurikulum wajib dipilih'),
  kode_mk: z.string().min(2, 'Kode mata kuliah minimal 2 karakter').max(50, 'Kode mata kuliah maksimal 50 karakter'),
  nama: z.string().min(3, 'Nama mata kuliah minimal 3 karakter').max(255, 'Nama mata kuliah maksimal 255 karakter'),
  kategori: z.string().min(1, 'Kategori mata kuliah wajib dipilih'),
  sks_teori: z.coerce.number({ error: 'SKS Teori wajib diisi angka' }).min(0, 'SKS Teori tidak boleh negatif'),
  sks_praktik: z.coerce.number({ error: 'SKS Praktik wajib diisi angka' }).min(0, 'SKS Praktik tidak boleh negatif'),
  semester_anjuran: z.coerce.number({ error: 'Semester wajib diisi angka' }).int('Semester harus berupa bilangan bulat').min(1, 'Semester minimal 1').max(8, 'Semester maksimal 8'),
  jumlah_pertemuan: z.coerce.number({ error: 'Jumlah pertemuan wajib diisi angka' }).int('Jumlah pertemuan harus berupa bilangan bulat').min(1, 'Jumlah pertemuan minimal 1'),
  status: z.string().min(1, 'Status wajib dipilih'),
});

type MataKuliahFormValues = z.infer<typeof mataKuliahSchema>;

export default function EditMataKuliahObePage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params?.id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<MataKuliahFormValues>({
    resolver: zodResolver(mataKuliahSchema) as any,
    defaultValues: {
      kurikulum_id: '',
      kode_mk: '',
      nama: '',
      kategori: 'Wajib',
      sks_teori: 2,
      sks_praktik: 0,
      semester_anjuran: 1,
      jumlah_pertemuan: 16,
      status: 'aktif',
    },
  });

  const sksTeori = watch('sks_teori') || 0;
  const sksPraktik = watch('sks_praktik') || 0;
  const totalSks = Number(sksTeori) + Number(sksPraktik);

  const loadKurikulumOptions = useCallback(async (keyword: string) => {
    try {
      const res = await siakadService.getKurikulums({ search: keyword || undefined, per_page: 50 });
      const raw = res?.data;
      const list: any[] = Array.isArray(raw) ? raw : (raw?.items || raw?.data || []);
      return list.map((k: any) => ({
        value: String(k.id),
        label: `${k.nama || k.kode}${k.tahun_berlaku ? ` — ${k.tahun_berlaku}` : ''}`,
        raw: k,
      }));
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    siakadService.getMataKuliahs({ id }).then((mkRes) => {
      const mkList = Array.isArray(mkRes.data) ? mkRes.data : (mkRes.data?.items || []);
      const item = mkList.find((m: any) => m.id === id) || mkRes.data;
      if (item) {
        reset({
          kurikulum_id: String(item.kurikulum_id || ''),
          kode_mk: item.kode_mk || '',
          nama: item.nama || '',
          kategori: item.kategori || (item.tipe === 'pilihan' ? 'Pilihan' : 'Wajib'),
          sks_teori: item.sks_teori || 0,
          sks_praktik: item.sks_praktik || 0,
          semester_anjuran: item.semester_anjuran || 1,
          jumlah_pertemuan: item.jumlah_pertemuan || 16,
          status: item.is_active ? 'aktif' : 'nonaktif',
        });
      }
      setLoading(false);
    });
  }, [id, reset]);

  const onSubmit = async (values: MataKuliahFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        kurikulum_id: Number(values.kurikulum_id),
        kode_mk: values.kode_mk,
        nama: values.nama,
        kategori: values.kategori,
        tipe: values.kategori.toLowerCase() === 'pilihan' ? 'pilihan' : 'wajib',
        sks_teori: Number(values.sks_teori),
        sks_praktik: Number(values.sks_praktik),
        total_sks: totalSks,
        semester_anjuran: Number(values.semester_anjuran),
        jumlah_pertemuan: Number(values.jumlah_pertemuan),
        is_active: values.status === 'aktif',
      };
      await siakadService.updateMataKuliah(id, payload);
      toast.success('Mata kuliah berhasil diperbarui');
      router.push('/siakad/obe/matakuliah');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memperbarui mata kuliah');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Memuat data mata kuliah...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in w-full">
      <PageHeader
        title="Edit Daftar Mata Kuliah"
        description="Perbarui informasi kode, bobot SKS, dan semester mata kuliah."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Mata Kuliah', href: '/siakad/obe/matakuliah' },
          { label: 'Edit' },
        ]}
        action={
          <Button
            variant="outline"
            icon={<ArrowLeft size={16} />}
            onClick={() => router.push('/siakad/obe/matakuliah')}
            className="border-[var(--module-primary)] text-[var(--module-primary)] hover:bg-[var(--module-primary-subtle)]"
          >
            Kembali
          </Button>
        }
      />

      <Card>
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-sm text-slate-900">1. Identitas Mata Kuliah</h3>
            <p className="text-2xs text-slate-500">Kurikulum acuan, kode resmi, nama mata kuliah, dan kategori sifat perkuliahan.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="md:col-span-2 lg:col-span-3">
              <Controller
                name="kurikulum_id"
                control={control}
                render={({ field }) => (
                  <AsyncSelect
                    label="Kurikulum *"
                    placeholder="Cari kurikulum..."
                    loadOptions={loadKurikulumOptions}
                    value={field.value ? String(field.value) : null}
                    onChange={(opt: any) => field.onChange(opt ? String(opt.value) : '')}
                    error={errors.kurikulum_id?.message}
                  />
                )}
              />
            </div>

            <Input
              label="Kode *"
              {...register('kode_mk')}
              error={errors.kode_mk?.message}
              placeholder="Contoh: PM-IK-1-1-005"
            />

            <div className="md:col-span-1 lg:col-span-2">
              <Input
                label="Nama Mata Kuliah *"
                {...register('nama')}
                error={errors.nama?.message}
                placeholder="Contoh: TEORI FOTOGRAFI"
              />
            </div>

            <Controller
              name="kategori"
              control={control}
              render={({ field }) => (
                <Select
                  label="Kategori *"
                  placeholder="Pilih Kategori"
                  options={KATEGORI_MK_FORM_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.kategori?.message}
                />
              )}
            />

            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select
                  label="Status *"
                  placeholder="Pilih Status"
                  options={STATUS_MK_FORM_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.status?.message}
                />
              )}
            />
          </div>

          <div className="border-b border-slate-100 pb-3 pt-2">
            <h3 className="font-extrabold text-sm text-slate-900">2. Bobot SKS & Alokasi Semester</h3>
            <p className="text-2xs text-slate-500">Pembagian bobot SKS teori/praktik, penempatan semester anjuran, dan jumlah pertemuan.</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              label="SKS Teori *"
              type="number"
              min={0}
              {...register('sks_teori', { valueAsNumber: true })}
              error={errors.sks_teori?.message}
            />
            <Input
              label="SKS Praktik *"
              type="number"
              min={0}
              {...register('sks_praktik', { valueAsNumber: true })}
              error={errors.sks_praktik?.message}
            />
            <Input label="Total SKS" type="number" value={totalSks} disabled />
            <Input
              label="Semester Anjuran *"
              type="number"
              min={1}
              max={8}
              {...register('semester_anjuran', { valueAsNumber: true })}
              error={errors.semester_anjuran?.message}
            />
            <Input
              label="Jml Pertemuan *"
              type="number"
              min={1}
              {...register('jumlah_pertemuan', { valueAsNumber: true })}
              error={errors.jumlah_pertemuan?.message}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/siakad/obe/matakuliah')}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" icon={<Save size={16} />} loading={isSubmitting}>
              Simpan Perubahan
            </Button>
          </div>
        </form>
        </CardBody>
      </Card>
    </div>
  );
}
