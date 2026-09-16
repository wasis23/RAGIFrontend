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
import { simpegSkPegawaiService } from '@/services/simpeg.izin-sk.service';
import { simpegService } from '@/services/simpeg.service';
import { useAuth } from '@/hooks/useAuth';
import type { SkPegawaiMasters } from '@/types/simpeg.izin-sk.types';
import type { Pegawai } from '@/types/simpeg.types';

// Zod Schema
const skPegawaiFormSchema = z
  .object({
    pegawai_id: z.string().min(1, 'Pegawai pemilik SK wajib dipilih'),
    kategori_sk_id: z.string().min(1, 'Kategori SK wajib dipilih'),
    nomor_sk: z.string().min(3, 'Nomor SK minimal 3 karakter'),
    judul_sk: z.string().min(5, 'Judul SK minimal 5 karakter'),
    pejabat_penetap: z.string().min(3, 'Pejabat penetap minimal 3 karakter'),
    tanggal_sk: z.string().min(1, 'Tanggal penetapan SK wajib diisi'),
    tmt_sk: z.string().min(1, 'TMT mulai SK wajib diisi'),
    tmt_selesai: z.string().optional(),
    keterangan: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.tmt_sk && data.tmt_selesai) {
        return new Date(data.tmt_selesai) >= new Date(data.tmt_sk);
      }
      return true;
    },
    {
      message: 'TMT selesai harus sama atau setelah TMT mulai',
      path: ['tmt_selesai'],
    }
  );

type SkPegawaiFormValues = z.infer<typeof skPegawaiFormSchema>;

export default function CreateSkPegawaiPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [masters, setMasters] = useState<SkPegawaiMasters | null>(null);
  const [fileSk, setFileSk] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPegawaiOption, setSelectedPegawaiOption] = useState<{ value: string; label: string } | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<SkPegawaiFormValues>({
    resolver: zodResolver(skPegawaiFormSchema),
    defaultValues: {
      pegawai_id: '',
      kategori_sk_id: '',
      nomor_sk: '',
      judul_sk: '',
      pejabat_penetap: 'Rektor Universitas',
      tanggal_sk: new Date().toISOString().split('T')[0],
      tmt_sk: new Date().toISOString().split('T')[0],
      tmt_selesai: '',
      keterangan: '',
    },
  });

  // Fetch masters
  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const res = await simpegSkPegawaiService.getMasters();
        if (res.status === 'success' && res.data) {
          setMasters(res.data);
          if (res.data.kategori_sk.length > 0) {
            setValue('kategori_sk_id', res.data.kategori_sk[0].id.toString());
          }
        }
      } catch (err: any) {
        toast.error('Gagal memuat master kategori SK');
      }
    };
    fetchMasters();
  }, [setValue]);

  // Pre-fill if logged-in user is a Pegawai
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
      console.error('Gagal mencari pegawai', err);
      return [];
    }
  }, []);

  const kategoriOptions =
    masters?.kategori_sk.map((k) => ({
      value: k.id.toString(),
      label: k.nama,
    })) || [];

  // Submit Handler
  const onSubmit = async (values: SkPegawaiFormValues) => {
    if (!fileSk) {
      toast.error('Berkas pindaian SK (PDF) wajib diunggah.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('pegawai_id', values.pegawai_id);
      formData.append('kategori_sk_id', values.kategori_sk_id);
      formData.append('nomor_sk', values.nomor_sk);
      formData.append('judul_sk', values.judul_sk);
      formData.append('pejabat_penetap', values.pejabat_penetap);
      formData.append('tanggal_sk', values.tanggal_sk);
      formData.append('tmt_sk', values.tmt_sk);
      if (values.tmt_selesai) formData.append('tmt_selesai', values.tmt_selesai);
      if (values.keterangan) formData.append('keterangan', values.keterangan);
      formData.append('file_sk', fileSk);

      await simpegSkPegawaiService.create(formData);
      toast.success('Laporan SK pegawai berhasil disimpan dan diajukan ke tim SDM!');
      router.push('/simpeg/sk-pegawai');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan arsip SK pegawai.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6 pb-6">
      <PageHeader
        title="Laporkan / Unggah SK Pegawai"
        description="Pencatatan Surat Keputusan resmi (pengangkatan, jafung, penugasan mengajar, bimbingan, atau SK kepanitiaan)."
        action={
          <Button
            variant="outline"
            onClick={() => router.push('/simpeg/sk-pegawai')}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Repositori</span>
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 border-b border-slate-200 pb-3 dark:border-slate-800">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Data Identitas & Ketetapan SK
            </h2>
            <p className="text-xs text-slate-500">
              Pastikan nomor SK, tanggal penetapan, dan TMT sesuai dengan dokumen fisik/asli.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pegawai AsyncSelect */}
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Pegawai Pemilik SK <span className="text-rose-500">*</span>
              </label>
              <Controller
                name="pegawai_id"
                control={control}
                render={({ field }) => (
                  <AsyncSelect
                    placeholder="Cari nama atau NIP pegawai..."
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

            {/* Kategori SK */}
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Kategori Dokumen SK <span className="text-rose-500">*</span>
              </label>
              <Controller
                name="kategori_sk_id"
                control={control}
                render={({ field }) => (
                  <Select
                    options={kategoriOptions}
                    value={field.value}
                    onChange={(val: any) => field.onChange(val || '')}
                    className="mt-1 w-full"
                  />
                )}
              />
              {errors.kategori_sk_id && (
                <p className="mt-1 text-xs text-rose-500">{errors.kategori_sk_id.message}</p>
              )}
            </div>

            {/* Nomor SK */}
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Nomor Resmi SK <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="Contoh: SK/REK/2026/045"
                {...register('nomor_sk')}
                className="mt-1 w-full"
              />
              {errors.nomor_sk && (
                <p className="mt-1 text-xs text-rose-500">{errors.nomor_sk.message}</p>
              )}
            </div>

            {/* Pejabat Penetap */}
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Pejabat Penetap <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="Contoh: Rektor Universitas / Ketua Yayasan"
                {...register('pejabat_penetap')}
                className="mt-1 w-full"
              />
              {errors.pejabat_penetap && (
                <p className="mt-1 text-xs text-rose-500">{errors.pejabat_penetap.message}</p>
              )}
            </div>

            {/* Judul SK (Full Width) */}
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Judul / Tentang SK <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="Contoh: Penugasan Beban Mengajar Dosen Semester Gasal TA 2026/2027"
                {...register('judul_sk')}
                className="mt-1 w-full"
              />
              {errors.judul_sk && (
                <p className="mt-1 text-xs text-rose-500">{errors.judul_sk.message}</p>
              )}
            </div>

            {/* Tanggal Penetapan SK */}
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Tanggal Penetapan SK <span className="text-rose-500">*</span>
              </label>
              <Input
                type="date"
                {...register('tanggal_sk')}
                className="mt-1 w-full"
              />
              {errors.tanggal_sk && (
                <p className="mt-1 text-xs text-rose-500">{errors.tanggal_sk.message}</p>
              )}
            </div>

            {/* TMT SK Mulai & Selesai */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  TMT Mulai <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="date"
                  {...register('tmt_sk')}
                  className="mt-1 w-full"
                />
                {errors.tmt_sk && (
                  <p className="mt-1 text-xs text-rose-500">{errors.tmt_sk.message}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  TMT Selesai (Opsional)
                </label>
                <Input
                  type="date"
                  {...register('tmt_selesai')}
                  className="mt-1 w-full"
                />
                {errors.tmt_selesai && (
                  <p className="mt-1 text-xs text-rose-500">{errors.tmt_selesai.message}</p>
                )}
              </div>
            </div>

            {/* Berkas SK PDF (Full Width) */}
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Berkas Pindaian SK (PDF) <span className="text-rose-500">*</span>
              </label>
              <div className="mt-1 flex items-center gap-3">
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    if (file && file.size > 10 * 1024 * 1024) {
                      toast.error('Ukuran berkas maksimal 10MB');
                      return;
                    }
                    setFileSk(file);
                  }}
                  className="w-full text-xs"
                  required
                />
                {fileSk && (
                  <span className="text-xs text-emerald-600 font-medium">
                    {fileSk.name}
                  </span>
                )}
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Wajib berformat PDF asli atau pindaian jelas (Maksimal 10MB).
              </p>
            </div>

            {/* Keterangan (Full Width) */}
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Keterangan Tambahan (Opsional)
              </label>
              <Textarea
                rows={3}
                placeholder="Catatan pendukung terkait SK (misal: digunakan untuk pelaporan BKD / kenaikan pangkat)..."
                {...register('keterangan')}
                className="mt-1 w-full"
              />
            </div>
          </div>
        </div>

        {/* Form Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/simpeg/sk-pegawai')}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan & Laporkan SK'}
          </Button>
        </div>
      </form>
    </div>
  );
}
