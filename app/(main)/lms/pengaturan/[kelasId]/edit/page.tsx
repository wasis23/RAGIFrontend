'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { lmsService } from '@/services/lms.service';
import {
  LmsKelasItem,
  LmsKelasSetting,
  LMS_SETTING_DEFAULT,
  METODE_ABSENSI_OPTIONS,
  METODE_ABSENSI_VALUES,
  MetodeAbsensi,
} from '@/types/lms.types';
import { ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const TOTAL_PERTEMUAN_MIN = 1;
const TOTAL_PERTEMUAN_MAX = 32;

const pengaturanSchema = z.object({
  total_pertemuan: z
    .number({ message: 'Jumlah pertemuan wajib diisi.' })
    .int('Jumlah pertemuan harus bilangan bulat.')
    .min(TOTAL_PERTEMUAN_MIN, `Jumlah pertemuan minimal ${TOTAL_PERTEMUAN_MIN}.`)
    .max(TOTAL_PERTEMUAN_MAX, `Jumlah pertemuan maksimal ${TOTAL_PERTEMUAN_MAX}.`),
  metode_absensi: z.enum(METODE_ABSENSI_VALUES, {
    message: 'Metode absensi wajib dipilih.',
  }),
  batas_min_hadir_persen: z
    .number({ message: 'Batas minimum hadir wajib diisi.' })
    .int('Batas minimum hadir harus bilangan bulat.')
    .min(0, 'Batas minimum hadir tidak boleh negatif.')
    .max(100, 'Batas minimum hadir maksimal 100 persen.'),
  can_submit_late: z.boolean(),
  show_nilai_to_mahasiswa: z.boolean(),
  storage_disk: z.string().max(50, 'Nama storage disk maksimal 50 karakter.').optional(),
});

type PengaturanFormData = z.infer<typeof pengaturanSchema>;

export default function UbahPengaturanLmsPage() {
  const router = useRouter();
  const params = useParams<{ kelasId: string }>();
  const kelasId = Number(params?.kelasId);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [kelasLabel, setKelasLabel] = useState<string>('');
  const [belumDikonfigurasi, setBelumDikonfigurasi] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<PengaturanFormData>({
    resolver: zodResolver(pengaturanSchema),
    defaultValues: { ...LMS_SETTING_DEFAULT, storage_disk: '' },
  });

  useEffect(() => {
    if (!Number.isFinite(kelasId) || kelasId <= 0) {
      toast.error('ID kelas tidak valid.');
      router.push('/lms/pengaturan');
      return;
    }

    let cancelled = false;

    (async () => {
      setIsLoading(true);
      try {
        // Ambil per kelas (bukan lewat daftar agregat) supaya tidak bergantung pagination.
        // `getKelasOverview` sudah mengembalikan `kelas` + `lms_setting`.
        const res = await lmsService.getKelasOverview(kelasId);
        const overview = res.data as unknown as {
          kelas?: LmsKelasItem;
          lms_setting?: LmsKelasSetting | null;
        } | null;
        const kelas = overview?.kelas;

        if (cancelled) return;

        if (!kelas) {
          toast.error('Data kelas tidak ditemukan atau di luar akses Anda.');
          router.push('/lms/pengaturan');
          return;
        }

        setKelasLabel(
          `${kelas.kode_kelas || ''} • ${kelas.nama_kelas || ''}`.trim() +
            (kelas.mata_kuliah?.nama ? ` • ${kelas.mata_kuliah.nama}` : '')
        );

        // `getKelasOverview` mengembalikan nilai bawaan bila kelas belum pernah
        // dikonfigurasi, jadi form selalu terisi valid.
        const setting: LmsKelasSetting | null = overview?.lms_setting ?? null;
        setBelumDikonfigurasi(!setting || setting.id === undefined);

        reset({
          total_pertemuan: setting?.total_pertemuan ?? LMS_SETTING_DEFAULT.total_pertemuan,
          metode_absensi: setting?.metode_absensi ?? LMS_SETTING_DEFAULT.metode_absensi,
          batas_min_hadir_persen:
            setting?.batas_min_hadir_persen ?? LMS_SETTING_DEFAULT.batas_min_hadir_persen,
          can_submit_late: setting?.can_submit_late ?? LMS_SETTING_DEFAULT.can_submit_late,
          show_nilai_to_mahasiswa:
            setting?.show_nilai_to_mahasiswa ?? LMS_SETTING_DEFAULT.show_nilai_to_mahasiswa,
          storage_disk: setting?.storage_disk ?? '',
        });
      } catch (err: any) {
        toast.error(err?.message || 'Gagal memuat pengaturan kelas.');
        router.push('/lms/pengaturan');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [kelasId, router, reset]);

  const onSubmit = async (data: PengaturanFormData) => {
    try {
      await lmsService.updateKelasSetting(kelasId, {
        total_pertemuan: Number(data.total_pertemuan),
        metode_absensi: data.metode_absensi,
        batas_min_hadir_persen: Number(data.batas_min_hadir_persen),
        can_submit_late: data.can_submit_late,
        show_nilai_to_mahasiswa: data.show_nilai_to_mahasiswa,
        storage_disk: data.storage_disk?.trim() || null,
      });
      toast.success('Pengaturan LMS kelas berhasil disimpan.');
      router.push('/lms/pengaturan');
    } catch (err: any) {
      const fieldErrors = err?.response?.data?.errors || {};
      let terpetakan = false;

      const fields = [
        'total_pertemuan',
        'metode_absensi',
        'batas_min_hadir_persen',
        'can_submit_late',
        'show_nilai_to_mahasiswa',
        'storage_disk',
      ] as const;

      fields.forEach((key) => {
        const value = (fieldErrors as Record<string, unknown>)[key];
        if (value !== undefined) {
          setError(key, { message: Array.isArray(value) ? String(value[0]) : String(value) });
          terpetakan = true;
        }
      });

      if (terpetakan) {
        toast.error('Periksa kembali data yang diisi.');
      } else {
        toast.error(
          err?.response?.data?.message || err?.message || 'Gagal menyimpan pengaturan LMS.'
        );
      }
    }
  };

  return (
    <div className="w-full flex flex-col space-y-4">
      <PageHeader
        title="Ubah Pengaturan LMS"
        description={
          kelasLabel
            ? `Atur parameter LMS untuk kelas ${kelasLabel}.`
            : 'Atur parameter LMS untuk kelas.'
        }
        breadcrumbs={[
          { label: 'LMS', href: '/lms' },
          { label: 'Pengaturan LMS', href: '/lms/pengaturan' },
          { label: 'Ubah' },
        ]}
        action={
          <Button
            variant="outline"
            icon={<ArrowLeft size={16} />}
            onClick={() => router.push('/lms/pengaturan')}
            style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
          >
            Kembali
          </Button>
        }
      />

      {belumDikonfigurasi ? (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
          Kelas ini belum pernah dikonfigurasi. Form di bawah diisi dengan nilai bawaan sistem —
          simpan untuk menerapkan pengaturan.
        </div>
      ) : null}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Jumlah Pertemuan"
              type="number"
              min={TOTAL_PERTEMUAN_MIN}
              max={TOTAL_PERTEMUAN_MAX}
              disabled={isLoading}
              error={errors.total_pertemuan?.message}
              {...register('total_pertemuan', { valueAsNumber: true })}
            />

            <Controller
              name="metode_absensi"
              control={control}
              render={({ field }) => (
                <Select
                  label="Metode Absensi"
                  value={field.value}
                  onChange={(val) => field.onChange(val as MetodeAbsensi)}
                  options={METODE_ABSENSI_OPTIONS}
                  disabled={isLoading}
                  error={errors.metode_absensi?.message}
                />
              )}
            />

            <Input
              label="Batas Minimum Kehadiran (%)"
              type="number"
              min={0}
              max={100}
              disabled={isLoading}
              error={errors.batas_min_hadir_persen?.message}
              {...register('batas_min_hadir_persen', { valueAsNumber: true })}
            />

            <Input
              label="Storage Disk (opsional)"
              placeholder="Kosongkan untuk memakai default sistem"
              disabled={isLoading}
              error={errors.storage_disk?.message}
              {...register('storage_disk')}
            />
          </div>

          {/* Checkbox boolean diletakkan pada baris penuh agar tinggi baris form
              tetap rata dan tidak menyisakan whitespace di kolom ketiga. */}
          <div className="flex flex-col gap-4 md:flex-row md:gap-6">
            <Checkbox
              label="Izinkan Pengumpulan Tugas Terlambat"
              disabled={isLoading}
              error={errors.can_submit_late?.message}
              {...register('can_submit_late')}
            />

            <Checkbox
              label="Tampilkan Nilai ke Mahasiswa"
              disabled={isLoading}
              error={errors.show_nilai_to_mahasiswa?.message}
              {...register('show_nilai_to_mahasiswa')}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/lms/pengaturan')}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" icon={<Save size={16} />} disabled={isSubmitting || isLoading}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
