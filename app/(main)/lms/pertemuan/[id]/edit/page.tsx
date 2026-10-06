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
import { Textarea } from '@/components/ui/Textarea';
import { lmsService } from '@/services/lms.service';
import {
  LmsPertemuanItem,
  PERTEMUAN_STATUS_OPTIONS,
  PERTEMUAN_STATUS_VALUES,
  PertemuanStatus,
} from '@/types/lms.types';
import { ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const PERTEMUAN_MAX = 16;

const pertemuanSchema = z
  .object({
    pertemuan_ke: z
      .number({ message: 'Nomor pertemuan wajib diisi.' })
      .int('Nomor pertemuan harus bilangan bulat.')
      .min(1, 'Nomor pertemuan minimal 1.')
      .max(PERTEMUAN_MAX, `Nomor pertemuan maksimal ${PERTEMUAN_MAX}.`),
    tanggal: z.string().min(1, 'Tanggal pertemuan wajib diisi.'),
    jam_mulai: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Format jam mulai harus HH:MM.')
      .or(z.literal(''))
      .optional(),
    jam_selesai: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Format jam selesai harus HH:MM.')
      .or(z.literal(''))
      .optional(),
    materi: z.string().max(255, 'Materi maksimal 255 karakter.').optional(),
    catatan_pertemuan: z.string().optional(),
    status_pertemuan: z.enum(PERTEMUAN_STATUS_VALUES),
  })
  .refine(
    (data) => !data.jam_mulai || !data.jam_selesai || data.jam_selesai > data.jam_mulai,
    { message: 'Jam selesai harus setelah jam mulai.', path: ['jam_selesai'] }
  );

type PertemuanFormData = z.infer<typeof pertemuanSchema>;

export default function UbahPertemuanPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const pertemuanId = Number(params?.id);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [kelasLabel, setKelasLabel] = useState<string>('');

  const {
    register,
    handleSubmit,
    reset,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<PertemuanFormData>({
    resolver: zodResolver(pertemuanSchema),
    defaultValues: {
      pertemuan_ke: 1,
      tanggal: '',
      jam_mulai: '',
      jam_selesai: '',
      materi: '',
      catatan_pertemuan: '',
      status_pertemuan: 'belum',
    },
  });

  useEffect(() => {
    if (!Number.isFinite(pertemuanId) || pertemuanId <= 0) {
      toast.error('ID pertemuan tidak valid.');
      router.push('/lms/pertemuan');
      return;
    }

    let cancelled = false;

    (async () => {
      setIsLoading(true);
      try {
        const res = await lmsService.getPertemuanDetail(pertemuanId);
        // Bentuk respons: { pertemuan: {...}, materi_list, tugas_list, ... }
        const payload = res.data as unknown as {
          pertemuan?: LmsPertemuanItem & {
            kelas?: { kode_kelas?: string; nama_kelas?: string };
          };
        };
        const row = payload?.pertemuan;

        if (cancelled) return;

        if (!row || typeof row.pertemuan_ke !== 'number') {
          toast.error('Data pertemuan tidak ditemukan.');
          router.push('/lms/pertemuan');
          return;
        }

        reset({
          pertemuan_ke: row.pertemuan_ke,
          tanggal: (row.tanggal || '').slice(0, 10),
          jam_mulai: (row.jam_mulai ?? '').slice(0, 5),
          jam_selesai: (row.jam_selesai ?? '').slice(0, 5),
          materi: row.materi ?? '',
          catatan_pertemuan: row.catatan_pertemuan ?? '',
          status_pertemuan: row.status_pertemuan ?? 'belum',
        });

        const kelas = row.kelas;
        setKelasLabel(kelas ? `${kelas.kode_kelas || ''} • ${kelas.nama_kelas || ''}`.trim() : '');
      } catch (err: any) {
        toast.error(err?.message || 'Gagal memuat data pertemuan.');
        router.push('/lms/pertemuan');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pertemuanId, router, reset]);

  const onSubmit = async (data: PertemuanFormData) => {
    try {
      await lmsService.updatePertemuan(pertemuanId, {
        pertemuan_ke: Number(data.pertemuan_ke),
        tanggal: data.tanggal,
        materi: data.materi?.trim() || null,
        catatan_pertemuan: data.catatan_pertemuan?.trim() || null,
        jam_mulai: data.jam_mulai || null,
        jam_selesai: data.jam_selesai || null,
        status_pertemuan: data.status_pertemuan,
      });
      toast.success('Pertemuan berhasil diperbarui.');
      router.push('/lms/pertemuan');
    } catch (err: any) {
      // Validasi server (mis. nomor pertemuan bentrok) dipetakan ke field terkait.
      const fieldErrors = err?.response?.data?.errors || {};
      let terpetakan = false;

      Object.entries(fieldErrors).forEach(([key, value]) => {
        const pesan = Array.isArray(value) ? String(value[0]) : String(value);
        if (key === 'pertemuan_ke' || key === 'tanggal' || key === 'materi') {
          setError(key as keyof PertemuanFormData, { message: pesan });
          terpetakan = true;
        } else if (key === 'catatan_pertemuan') {
          setError('catatan_pertemuan', { message: pesan });
          terpetakan = true;
        } else if (key === 'jam_mulai') {
          setError('jam_mulai', { message: pesan });
          terpetakan = true;
        } else if (key === 'jam_selesai') {
          setError('jam_selesai', { message: pesan });
          terpetakan = true;
        } else if (key === 'status_pertemuan') {
          setError('status_pertemuan', { message: pesan });
          terpetakan = true;
        }
      });

      if (terpetakan) {
        toast.error('Periksa kembali data yang diisi.');
      } else {
        toast.error(
          err?.response?.data?.message || err?.message || 'Gagal menyimpan pertemuan.'
        );
      }
    }
  };

  return (
    <div className="w-full flex flex-col space-y-4">
      <PageHeader
        title="Ubah Pertemuan"
        description={
          kelasLabel
            ? `Perbarui data pertemuan pada kelas ${kelasLabel}.`
            : 'Perbarui data pertemuan perkuliahan.'
        }
        breadcrumbs={[
          { label: 'LMS', href: '/lms' },
          { label: 'Pertemuan', href: '/lms/pertemuan' },
          { label: 'Ubah Pertemuan' },
        ]}
        action={
          <Button
            variant="outline"
            icon={<ArrowLeft size={16} />}
            onClick={() => router.push('/lms/pertemuan')}
            style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
          >
            Kembali
          </Button>
        }
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              label="Nomor Pertemuan"
              type="number"
              min={1}
              max={PERTEMUAN_MAX}
              placeholder="1"
              disabled={isLoading}
              error={errors.pertemuan_ke?.message}
              {...register('pertemuan_ke', { valueAsNumber: true })}
            />

            <Input
              label="Tanggal Pertemuan"
              type="date"
              disabled={isLoading}
              error={errors.tanggal?.message}
              {...register('tanggal')}
            />

            <Controller
              name="status_pertemuan"
              control={control}
              render={({ field }) => (
                <Select
                  label="Status Pertemuan"
                  value={field.value}
                  onChange={(val) => field.onChange(val as PertemuanStatus)}
                  options={PERTEMUAN_STATUS_OPTIONS}
                  disabled={isLoading}
                  error={errors.status_pertemuan?.message}
                />
              )}
            />

            <Input
              label="Jam Mulai"
              type="time"
              disabled={isLoading}
              error={errors.jam_mulai?.message}
              {...register('jam_mulai')}
            />

            <Input
              label="Jam Selesai"
              type="time"
              disabled={isLoading}
              error={errors.jam_selesai?.message}
              {...register('jam_selesai')}
            />

            <Input
              label="Materi"
              placeholder="Contoh: Basis Data Relasional — Normalisasi"
              disabled={isLoading}
              error={errors.materi?.message}
              {...register('materi')}
            />

            <div className="col-span-full">
              <Textarea
                label="Catatan Pertemuan"
                placeholder="Catatan tambahan untuk mahasiswa (opsional)"
                rows={4}
                disabled={isLoading}
                error={errors.catatan_pertemuan?.message}
                {...register('catatan_pertemuan')}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/lms/pertemuan')}
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
