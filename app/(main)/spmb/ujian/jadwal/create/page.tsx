'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Clock, BookOpen, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { PageHeader } from '@/components/layout/PageHeader';

interface FormValues {
  gelombang_id: string;
  nama_sesi: string;
  tipe_ujian: string;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  kapasitas: number;
}

export default function CreateJadwalUjianPage() {
  const router = useRouter();
  const [gelombangOptions, setGelombangOptions] = useState<{ value: string | number; label: string }[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      tipe_ujian: 'tulis',
      kapasitas: 30,
    },
  });

  useEffect(() => {
    fetchGelombang();
  }, []);

  const fetchGelombang = async () => {
    setIsFetching(true);
    try {
      const res = await api.get('/spmb/gelombang');
      const list = res.data?.data?.data || res.data?.data || res.data || [];
      const options = Array.isArray(list)
        ? list.map((g: any) => ({
            value: String(g.id),
            label: `${g.nama} (${g.status === 'aktif' ? 'Aktif' : 'Non-Aktif'})`,
          }))
        : [];
      setGelombangOptions(options);
    } catch {
      toast.error('Gagal mengambil data gelombang penerimaan');
    } finally {
      setIsFetching(false);
    }
  };

  const onSubmit = async (formData: FormValues) => {
    setLoading(true);
    try {
      await api.post('/spmb/jadwal-ujian', formData);
      toast.success('Jadwal ujian (CBT) berhasil disimpan!');
      router.push('/spmb/ujian/jadwal');
    } catch {
      toast.error('Gagal menyimpan jadwal ujian. Silakan periksa kembali inputan Anda.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <PageHeader
        title="Tambah Jadwal Ujian (CBT)"
        description="Konfigurasi sesi ujian tes masuk, kapasitas ruangan, serta rentang waktu pelaksanaan"
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            icon={<ArrowLeft size={16} />}
            className="min-h-[40px] px-4 font-bold"
          >
            Kembali
          </Button>
        }
      />

      {/* ── Form Card Container ──────────────────────────────────────── */}
      <div className="card overflow-hidden shadow-sm border border-slate-200/80">
        <form onSubmit={handleSubmit(onSubmit)} className="divide-y divide-slate-100">
          
          {/* Section 1: Informasi Gelombang & Sesi Ujian */}
          <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
              <div className="p-2.5 rounded-xl bg-primary-50 text-primary-600 font-bold shrink-0">
                <BookOpen size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Informasi Gelombang &amp; Sesi Ujian</h3>
                <p className="text-2xs sm:text-xs text-slate-500 font-medium">
                  Pilih periode gelombang penerimaan dan tentukan identitas sesi tes
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              {/* Gelombang Penerimaan */}
              <div className="space-y-1.5">
                <Controller
                  name="gelombang_id"
                  control={control}
                  rules={{ required: 'Gelombang penerimaan wajib dipilih' }}
                  render={({ field }) => (
                    <Select
                      label="Gelombang Penerimaan *"
                      options={gelombangOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={isFetching ? 'Memuat gelombang...' : 'Pilih gelombang penerimaan...'}
                      disabled={isFetching}
                      error={errors.gelombang_id?.message}
                      hint="Pilih gelombang pendaftaran aktif tempat ujian ini dilaksanakan."
                    />
                  )}
                />
              </div>

              {/* Nama Sesi */}
              <div className="space-y-1.5">
                <Input
                  label="Nama Sesi Ujian *"
                  placeholder="Contoh: Sesi 1 - Pagi (Ruang CAT A)"
                  {...register('nama_sesi', { required: 'Nama sesi ujian wajib diisi' })}
                  error={errors.nama_sesi?.message}
                  hint="Berikan penamaan sesi yang spesifik dan mudah dipahami pendaftar."
                />
              </div>

              {/* Tipe Ujian */}
              <div className="space-y-1.5 md:col-span-2 lg:col-span-1">
                <Controller
                  name="tipe_ujian"
                  control={control}
                  rules={{ required: 'Tipe ujian wajib dipilih' }}
                  render={({ field }) => (
                    <Select
                      label="Tipe Pelaksanaan Ujian *"
                      options={[
                        { value: 'tulis', label: 'Ujian Tulis Komputer (CBT)' },
                        { value: 'praktik', label: 'Ujian Praktik / Keterampilan' },
                        { value: 'wawancara', label: 'Wawancara / Wawancara Online' },
                      ]}
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.tipe_ujian?.message}
                    />
                  )}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Waktu Pelaksanaan & Kapasitas Peserta */}
          <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-50/40">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 font-bold shrink-0">
                <Clock size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Waktu Pelaksanaan &amp; Kapasitas</h3>
                <p className="text-2xs sm:text-xs text-slate-500 font-medium">
                  Atur tanggal, alokasi jam pelaksanaan, serta kuota daya tampung ruangan
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6">
              {/* Tanggal Ujian */}
              <div className="space-y-1.5">
                <Input
                  label="Tanggal Pelaksanaan Ujian *"
                  type="date"
                  {...register('tanggal', { required: 'Tanggal pelaksanaan ujian wajib diisi' })}
                  error={errors.tanggal?.message}
                />
              </div>

              {/* Jam Mulai */}
              <div className="space-y-1.5">
                <Input
                  label="Jam Mulai *"
                  type="time"
                  {...register('jam_mulai', { required: 'Jam mulai wajib diisi' })}
                  error={errors.jam_mulai?.message}
                  hint="Format 24 jam (misal: 08:00)"
                />
              </div>

              {/* Jam Selesai */}
              <div className="space-y-1.5">
                <Input
                  label="Jam Selesai *"
                  type="time"
                  {...register('jam_selesai', { required: 'Jam selesai wajib diisi' })}
                  error={errors.jam_selesai?.message}
                  hint="Format 24 jam (misal: 10:30)"
                />
              </div>

              {/* Kapasitas Ruangan */}
              <div className="space-y-1.5 sm:col-span-2 md:col-span-3">
                <Input
                  label="Kapasitas / Kuota Peserta (Ruangan) *"
                  type="number"
                  min={1}
                  placeholder="Contoh: 30"
                  {...register('kapasitas', {
                    required: 'Kapasitas ruangan wajib diisi',
                    valueAsNumber: true,
                    min: { value: 1, message: 'Kapasitas minimal 1 peserta' },
                  })}
                  error={errors.kapasitas?.message}
                  hint="Batas maksimal calon mahasiswa yang dapat ditugaskan pada sesi ujian ini."
                />
              </div>
            </div>
          </div>

          {/* Form Action Footer (Mobile-First Stacking & Min Touch Target 44px) */}
          <div className="p-4 sm:p-6 bg-white flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              disabled={loading}
              className="min-h-[44px] w-full sm:w-auto font-bold text-slate-600 hover:bg-slate-100"
            >
              Batal
            </Button>

            <Button
              type="submit"
              variant="primary"
              disabled={loading || isFetching}
              icon={loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              className="min-h-[44px] w-full sm:w-auto font-bold shadow-md hover:shadow-lg"
            >
              {loading ? 'Menyimpan Jadwal...' : 'Simpan Jadwal Ujian'}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}
