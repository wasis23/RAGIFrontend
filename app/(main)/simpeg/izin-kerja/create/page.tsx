'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { simpegIzinKerjaService } from '@/services/simpeg.izin-sk.service';
import { simpegService } from '@/services/simpeg.service';
import { useAuth } from '@/hooks/useAuth';
import type { IzinJamKerjaMasters } from '@/types/simpeg.izin-sk.types';
import type { Pegawai } from '@/types/simpeg.types';

// Zod Schema
const izinKerjaFormSchema = z
  .object({
    pegawai_id: z.string().min(1, 'Pegawai pemohon wajib dipilih'),
    master_jenis_izin_id: z.string().min(1, 'Jenis izin jam kerja wajib dipilih'),
    tanggal: z.string().min(1, 'Tanggal izin wajib diisi'),
    jam_mulai: z.string().min(1, 'Jam mulai wajib diisi'),
    jam_selesai: z.string().min(1, 'Jam selesai wajib diisi'),
    alasan: z.string().min(5, 'Alasan izin minimal 5 karakter'),
  })
  .refine(
    (data) => {
      if (data.jam_mulai && data.jam_selesai) {
        return data.jam_selesai > data.jam_mulai;
      }
      return true;
    },
    {
      message: 'Jam selesai harus setelah jam mulai',
      path: ['jam_selesai'],
    }
  );

type IzinKerjaFormValues = z.infer<typeof izinKerjaFormSchema>;

export default function CreateIzinKerjaPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [masters, setMasters] = useState<IzinJamKerjaMasters | null>(null);
  const [fileBukti, setFileBukti] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPegawaiOption, setSelectedPegawaiOption] = useState<{ value: string; label: string } | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<IzinKerjaFormValues>({
    resolver: zodResolver(izinKerjaFormSchema),
    defaultValues: {
      pegawai_id: '',
      master_jenis_izin_id: '',
      tanggal: new Date().toISOString().split('T')[0],
      jam_mulai: '08:00',
      jam_selesai: '10:00',
      alasan: '',
    },
  });

  // Fetch masters
  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const res = await simpegIzinKerjaService.getMasters();
        if (res.status === 'success' && res.data) {
          setMasters(res.data);
          if (res.data.jenis_izin.length > 0) {
            setValue('master_jenis_izin_id', res.data.jenis_izin[0].id.toString());
          }
        }
      } catch (err: any) {
        toast.error('Gagal memuat master jenis izin jam kerja');
      }
    };
    fetchMasters();
  }, [setValue]);

  // Pre-fill if user has pegawai linked
  useEffect(() => {
    const currentPegawai = (user as any)?.pegawai;
    if (currentPegawai) {
      setValue('pegawai_id', currentPegawai.id.toString());
      setSelectedPegawaiOption({
        value: currentPegawai.id.toString(),
        label: `${currentPegawai.nama_lengkap} ${currentPegawai.nip ? `(NIP: ${currentPegawai.nip})` : ''}`,
      });
    }
  }, [user, setValue]);

  // Load Pegawai Options for AsyncSelect
  const loadPegawaiOptions = useCallback(async (inputValue: string) => {
    try {
      const res = await simpegService.getPegawaiList({
        search: inputValue || undefined,
        per_page: 20,
      });

      const list: Pegawai[] = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
      return list.map((p) => ({
        value: p.id.toString(),
        label: `${p.nama_lengkap}${p.nip ? ` (NIP: ${p.nip})` : ''} - ${p.unit_kerja?.nama || 'SDM'}`,
      }));
    } catch (err) {
      console.error('Gagal mencari data pegawai', err);
      return [];
    }
  }, []);

  const jenisIzinOptions =
    masters?.jenis_izin.map((item) => ({
      value: item.id.toString(),
      label: item.nama,
    })) || [];

  // Form Submit
  const onSubmit = async (values: IzinKerjaFormValues) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('pegawai_id', values.pegawai_id);
      formData.append('master_jenis_izin_id', values.master_jenis_izin_id);
      formData.append('tanggal', values.tanggal);
      formData.append('jam_mulai', values.jam_mulai);
      formData.append('jam_selesai', values.jam_selesai);
      formData.append('alasan', values.alasan);

      if (fileBukti) {
        formData.append('file_bukti', fileBukti);
      }

      await simpegIzinKerjaService.create(formData);
      toast.success('Pengajuan izin jam kerja berhasil dikirim!');
      router.push('/simpeg/izin-kerja');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengirim pengajuan izin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6 pb-6">
      <PageHeader
        title="Ajukan Izin Parsial Jam Kerja"
        description="Formulir permohonan izin keluar kampus sementara, datang terlambat, atau pulang lebih awal."
        action={
          <Button
            variant="outline"
            onClick={() => router.push('/simpeg/izin-kerja')}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Daftar</span>
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Card Data Pengajuan */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 border-b border-slate-200 pb-3 dark:border-slate-800">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Data Pemohon & Rincian Izin
            </h2>
            <p className="text-xs text-slate-500">
              Pastikan rentang jam izin dan alasan diisi dengan lengkap dan akurat.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pegawai AsyncSelect */}
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Pegawai Pemohon <span className="text-rose-500">*</span>
              </label>
              <Controller
                name="pegawai_id"
                control={control}
                render={({ field }) => (
                  <AsyncSelect
                    placeholder="Ketik nama atau NIP pegawai..."
                    loadOptions={loadPegawaiOptions}
                    value={selectedPegawaiOption}
                    onChange={(val) => {
                      setSelectedPegawaiOption(val);
                      field.onChange(val ? val.value : '');
                    }}
                    isClearable
                    className="mt-1"
                  />
                )}
              />
              {errors.pegawai_id && (
                <p className="mt-1 text-xs text-rose-500">{errors.pegawai_id.message}</p>
              )}
            </div>

            {/* Jenis Izin */}
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Jenis Izin Jam Kerja <span className="text-rose-500">*</span>
              </label>
              <Controller
                name="master_jenis_izin_id"
                control={control}
                render={({ field }) => (
                  <Select
                    options={jenisIzinOptions}
                    value={field.value}
                    onChange={(val: any) => field.onChange(val || '')}
                    className="mt-1 w-full"
                  />
                )}
              />
              {errors.master_jenis_izin_id && (
                <p className="mt-1 text-xs text-rose-500">
                  {errors.master_jenis_izin_id.message}
                </p>
              )}
            </div>

            {/* Tanggal */}
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Tanggal Izin <span className="text-rose-500">*</span>
              </label>
              <Input
                type="date"
                {...register('tanggal')}
                className="mt-1 w-full"
              />
              {errors.tanggal && (
                <p className="mt-1 text-xs text-rose-500">{errors.tanggal.message}</p>
              )}
            </div>

            {/* Rentang Jam */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Jam Mulai <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="time"
                  {...register('jam_mulai')}
                  className="mt-1 w-full"
                />
                {errors.jam_mulai && (
                  <p className="mt-1 text-xs text-rose-500">{errors.jam_mulai.message}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Jam Selesai <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="time"
                  {...register('jam_selesai')}
                  className="mt-1 w-full"
                />
                {errors.jam_selesai && (
                  <p className="mt-1 text-xs text-rose-500">{errors.jam_selesai.message}</p>
                )}
              </div>
            </div>

            {/* Alasan (Full Width) */}
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Alasan / Keperluan Izin <span className="text-rose-500">*</span>
              </label>
              <Textarea
                rows={3}
                placeholder="Jelaskan alasan izin secara jelas (misal: urusan bank dinas, kondisi darurat keluarga, dll)..."
                {...register('alasan')}
                className="mt-1 w-full"
              />
              {errors.alasan && (
                <p className="mt-1 text-xs text-rose-500">{errors.alasan.message}</p>
              )}
            </div>

            {/* Berkas Bukti (Full Width) */}
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Berkas Bukti / Surat Keterangan Pendukung (Opsional)
              </label>
              <div className="mt-1 flex items-center gap-3">
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    if (file && file.size > 10 * 1024 * 1024) {
                      toast.error('Ukuran berkas maksimal 10MB');
                      return;
                    }
                    setFileBukti(file);
                  }}
                  className="w-full text-xs"
                />
                {fileBukti && (
                  <span className="text-xs text-emerald-600 font-medium">
                    {fileBukti.name}
                  </span>
                )}
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Format yang didukung: PDF, JPG, PNG (Maksimal 10MB).
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/simpeg/izin-kerja')}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Mengirim...' : 'Kirim Pengajuan Izin'}
          </Button>
        </div>
      </form>
    </div>
  );
}
