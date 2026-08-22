'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Calendar, Upload, Image as ImageIcon } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Textarea } from '@/components/ui/Textarea';
import { simpegService } from '@/services/simpeg.service';
import type { Pegawai, JenisCuti } from '@/types/simpeg.types';
import { useAuth } from '@/hooks/useAuth';

interface OptionType {
  value: string;
  label: string;
}

const cutiSchema = z.object({
  pegawai_id: z.string().min(1, 'Pegawai Pemohon wajib dipilih'),
  jenis_cuti: z.enum(['tahunan', 'sakit', 'alasan_penting', 'melahirkan', 'besar'], {
    message: 'Jenis Cuti wajib dipilih',
  }),
  tanggal_mulai: z.string().min(1, 'Tanggal Mulai wajib diisi'),
  tanggal_selesai: z.string().min(1, 'Tanggal Selesai wajib diisi'),
  jumlah_hari: z.number().min(1, 'Jumlah hari minimal 1 hari'),
  alasan: z.string().min(1, 'Alasan pengajuan cuti wajib diisi'),
});

type CutiFormValues = z.infer<typeof cutiSchema>;

export default function PengajuanCutiPage() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('simpeg.cuti.create') || hasPermission('simpeg.cuti.request') || hasPermission('simpeg.cuti.manage');
  const router = useRouter();

  const [selectedPegawaiOption, setSelectedPegawaiOption] = useState<OptionType | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CutiFormValues>({
    resolver: zodResolver(cutiSchema),
    defaultValues: {
      pegawai_id: '',
      jenis_cuti: 'tahunan',
      tanggal_mulai: '',
      tanggal_selesai: '',
      jumlah_hari: 1,
      alasan: '',
    },
  });

  const tglMulai = watch('tanggal_mulai');
  const tglSelesai = watch('tanggal_selesai');

  // Auto calculate working days estimation if start & end dates are picked
  const handleDateChange = (start: string, end: string) => {
    if (start && end) {
      const d1 = new Date(start);
      const d2 = new Date(end);
      if (d2 >= d1) {
        const diffTime = Math.abs(d2.getTime() - d1.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setValue('jumlah_hari', diffDays);
      }
    }
  };

  // Async loader for Pegawai AsyncSelect: Pulls ALL pegawai in database with high per_page
  const loadPegawaiOptions = useCallback(async (inputValue: string) => {
    try {
      const res: any = await simpegService.getPegawaiList({ per_page: 500 });
      const responseData = res?.data || res;
      const list: Pegawai[] = Array.isArray(responseData)
        ? responseData
        : responseData?.items || responseData?.data || [];
      
      const filtered = inputValue
        ? list.filter(
            (p: Pegawai) =>
              p.nama_lengkap.toLowerCase().includes(inputValue.toLowerCase()) ||
              (p.nip && p.nip.toLowerCase().includes(inputValue.toLowerCase()))
          )
        : list;

      return filtered.map((p: Pegawai) => ({
        value: p.id.toString(),
        label: `[NIP: ${p.nip || '-'}] ${p.nama_lengkap} (${p.unit_kerja?.nama || 'Tanpa Unit'})`,
      }));
    } catch (err) {
      console.error('Gagal memuat opsi pegawai', err);
      return [];
    }
  }, []);

  const onSubmit = async (values: CutiFormValues) => {
    if (!canCreate) {
      toast.error('Akses Ditolak: Anda tidak memiliki permission mengajukan Cuti.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('pegawai_id', values.pegawai_id);
      formData.append('jenis_cuti', values.jenis_cuti);
      formData.append('tanggal_mulai', values.tanggal_mulai);
      formData.append('tanggal_selesai', values.tanggal_selesai);
      formData.append('jumlah_hari', values.jumlah_hari.toString());
      formData.append('alasan', values.alasan);
      
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      await simpegService.createCuti(formData);
      toast.success('Formulir Pengajuan Cuti berhasil dikirim dan tersimpan!');
      router.push('/simpeg/cuti');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal mengirim pengajuan Cuti');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Mandatory RAGI Admin CRUD Rule 8: Back button on separate form page (>5 inputs) must use bg-orange-500 text-white */}
      <PageHeader
        title="Formulir Pengajuan Cuti Online"
        description="Lengkapi data permohonan cuti kerja dan unggah foto/dokumen surat keterangan atau lampiran izin"
        action={
          <Button
            onClick={() => router.back()}
            className="bg-orange-500 hover:bg-orange-600 text-white border-none shadow-sm font-bold"
            icon={<ArrowLeft size={16} />}
          >
            Kembali
          </Button>
        }
      />

      <div className="card">
        <div className="card-body p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              
              <div className="lg:col-span-3">
                <Controller
                  name="pegawai_id"
                  control={control}
                  render={({ field }) => (
                    <AsyncSelect
                      label="Pilih Pegawai Pemohon *"
                      required
                      placeholder="Ketik nama pegawai / NIP untuk mencari dari seluruh database..."
                      loadOptions={loadPegawaiOptions}
                      value={selectedPegawaiOption || (field.value ? { value: field.value, label: field.value } : null)}
                      onChange={(opt) => {
                        setSelectedPegawaiOption(opt);
                        field.onChange(opt ? opt.value : '');
                      }}
                      isClearable
                      error={errors.pegawai_id?.message}
                    />
                  )}
                />
              </div>

              <Controller
                name="jenis_cuti"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Jenis Cuti *"
                    required
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.jenis_cuti?.message}
                    options={[
                      { value: 'tahunan', label: 'Cuti Tahunan' },
                      { value: 'sakit', label: 'Cuti Sakit (Lampiran Surat Dokter)' },
                      { value: 'alasan_penting', label: 'Cuti Alasan Penting' },
                      { value: 'melahirkan', label: 'Cuti Melahirkan' },
                      { value: 'besar', label: 'Cuti Besar' },
                    ]}
                  />
                )}
              />

              <Input
                label="Tanggal Mulai *"
                type="date"
                required
                error={errors.tanggal_mulai?.message}
                {...register('tanggal_mulai', {
                  onChange: (e) => handleDateChange(e.target.value, tglSelesai),
                })}
              />

              <Input
                label="Tanggal Selesai *"
                type="date"
                required
                error={errors.tanggal_selesai?.message}
                {...register('tanggal_selesai', {
                  onChange: (e) => handleDateChange(tglMulai, e.target.value),
                })}
              />

              <Input
                label="Durasi Total (Hari Kerja) *"
                type="number"
                required
                placeholder="Contoh: 3"
                error={errors.jumlah_hari?.message}
                {...register('jumlah_hari', { valueAsNumber: true })}
              />

              {/* Input Foto / Berkas Lampiran Izin */}
              <div className="lg:col-span-2 space-y-1">
                <label className="block text-sm font-semibold text-slate-700">
                  Foto / Berkas Lampiran Surat Izin Cuti (Surat Dokter / Undangan / Bukti)
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 border border-slate-300 rounded-xl cursor-pointer p-1.5 transition-all"
                />
                {selectedFile ? (
                  <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-1">
                    <ImageIcon size={14} /> Berkas Lampiran Terpilih: <strong>{selectedFile.name}</strong> ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </p>
                ) : (
                  <p className="text-xs text-slate-400">Format yang didukung: JPG, PNG, PDF (Maksimal 10MB)</p>
                )}
              </div>

              <div className="lg:col-span-3">
                <Controller
                  name="alasan"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      label="Alasan Detail Pengajuan Cuti *"
                      required
                      rows={3}
                      placeholder="Ketikkan alasan detail permohonan pengajuan cuti..."
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.alasan?.message}
                    />
                  )}
                />
              </div>

            </div>

            <div className="flex justify-end gap-3 border-t pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                type="submit"
                loading={isSubmitting}
                disabled={isSubmitting}
                icon={<Save size={16} />}
                className="font-bold"
              >
                Kirim Pengajuan Cuti
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
