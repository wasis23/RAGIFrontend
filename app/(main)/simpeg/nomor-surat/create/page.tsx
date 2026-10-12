'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Send, 
  ArrowLeft, 
  CheckCircle2, 
  Hash
} from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';

import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { simpegService } from '@/services/simpeg.service';
import { arsipService } from '@/services/arsip.service';
import { useAuth } from '@/hooks/useAuth';
import { getApiErrorMessage } from '@/lib/utils';
import { ShieldAlert } from 'lucide-react';

// Skema Validasi Permohonan Nomor Surat Baru dari SIMPEG
const requestNomorSchema = z.object({
  mode: z.enum(['satuan', 'bulk']),
  tanggal_surat: z.string().min(1, 'Tanggal surat wajib diisi'),
  kode_unit: z.string().min(1, 'Kode unit kerja wajib dipilih'),
  kode_klasifikasi: z.string().min(1, 'Kode klasifikasi surat wajib dipilih'),
  perihal: z.string().min(3, 'Perihal surat minimal 3 karakter'),
  tujuan: z.string().optional(),
  jumlah_nomor: z.number().int().min(1, 'Minimal 1 nomor').max(100, 'Maksimal 100 nomor'),
  catatan_pemohon: z.string().optional(),
  lampiran: z
    .custom<File | null>()
    .optional()
    .nullable()
    .refine((file) => !file || file.size <= 10 * 1024 * 1024, {
      message: 'Ukuran berkas maksimal 10 MB',
    }),
});

type RequestNomorFormData = z.infer<typeof requestNomorSchema>;

export default function SimpegCreateNomorSuratPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canRequest = hasPermission('simpeg.nomor_surat.create') || hasPermission('simpeg.nomor_surat.request');
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const todayStr = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<RequestNomorFormData>({
    resolver: zodResolver(requestNomorSchema),
    defaultValues: {
      mode: 'satuan',
      tanggal_surat: todayStr,
      kode_unit: '',
      kode_klasifikasi: '',
      perihal: '',
      tujuan: '',
      jumlah_nomor: 1,
      catatan_pemohon: '',
      lampiran: null,
    },
  });

  const watchMode = watch('mode');
  const watchTanggal = watch('tanggal_surat');
  const watchUnit = watch('kode_unit');
  const watchKlasifikasi = watch('kode_klasifikasi');
  const watchJumlah = watch('jumlah_nomor');

  // Preview format penomoran
  const parsedDate = watchTanggal ? new Date(watchTanggal) : new Date();
  const letterYear = isNaN(parsedDate.getFullYear()) ? new Date().getFullYear() : parsedDate.getFullYear();
  const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  const monthIdx = isNaN(parsedDate.getMonth()) ? new Date().getMonth() : parsedDate.getMonth();
  const romanMonth = romanMonths[monthIdx];

  const onSubmitRequest = async (formData: RequestNomorFormData) => {
    try {
      setSubmittingRequest(true);
      await simpegService.submitRequestNomorSurat({
        mode: formData.mode,
        tanggal_surat: formData.tanggal_surat,
        kode_unit: formData.kode_unit,
        kode_klasifikasi: formData.kode_klasifikasi,
        perihal: formData.perihal,
        tujuan: formData.tujuan || undefined,
        jumlah_nomor: formData.mode === 'bulk' ? formData.jumlah_nomor : 1,
        catatan_pemohon: formData.catatan_pemohon || undefined,
        lampiran: formData.lampiran || undefined,
      });

      toast.success('Permohonan nomor surat berhasil dikirim ke Admin ARSIP!');
      router.push('/simpeg/nomor-surat');
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Gagal mengajukan permohonan nomor surat.'));
    } finally {
      setSubmittingRequest(false);
    }
  };

  if (!canRequest) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader
          title="Ajukan Permohonan Nomor Surat"
          description="Formulir pengajuan permohonan nomor surat resmi kampus ke bagian kearsipan / sekretariat"
          action={
            <Button
              type="button"
              variant="outline"
              size="md"
              icon={<ArrowLeft size={16} />}
              className="border-[var(--module-primary)] text-[var(--module-primary)] hover:bg-[var(--module-primary-subtle,#f0fdfa)]"
              onClick={() => router.push('/simpeg/nomor-surat')}
            >
              Kembali
            </Button>
          }
        />
        <div className="bg-white border border-red-200 rounded-xl p-6 text-center shadow-sm">
          <ShieldAlert size={36} className="text-red-500 mx-auto mb-2" />
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Akses Ditolak</h2>
          <p className="text-2xs text-slate-500 max-w-sm mx-auto mb-4">
            Anda tidak memiliki izin untuk mengajukan permohonan nomor surat resmi.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push('/simpeg/nomor-surat')}
          >
            Kembali ke Daftar Nomor Surat
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Ajukan Permohonan Nomor Surat"
        description="Formulir pengajuan permohonan nomor surat resmi kampus ke bagian kearsipan / sekretariat"
        action={
          <Button
            type="button"
            variant="outline"
            size="md"
            icon={<ArrowLeft size={16} />}
            className="border-[var(--module-primary)] text-[var(--module-primary)] hover:bg-[var(--module-primary-subtle,#f0fdfa)]"
            onClick={() => router.push('/simpeg/nomor-surat')}
          >
            Kembali
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <form
            onSubmit={handleSubmit(onSubmitRequest)}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Send size={16} className="text-[var(--module-primary)]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Form Permohonan Nomor Surat Resmi
                </h3>
              </div>
              <Badge variant="info" className="text-2xs font-mono uppercase">
                {watchMode === 'bulk' ? 'Banyak Nomor (Bulk)' : 'Satuan (1 Dokumen)'}
              </Badge>
            </div>

            {/* Pilihan Mode Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100/80 rounded-lg">
              <Button
                type="button"
                variant={watchMode === 'satuan' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setValue('mode', 'satuan')}
                className={`w-full text-xs font-semibold ${
                  watchMode === 'satuan'
                    ? 'bg-[var(--module-primary)] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Satuan (1 Dokumen)
              </Button>
              <Button
                type="button"
                variant={watchMode === 'bulk' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setValue('mode', 'bulk')}
                className={`w-full text-xs font-semibold ${
                  watchMode === 'bulk'
                    ? 'bg-[var(--module-primary)] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sekaligus / Banyak Nomor (Bulk)
              </Button>
            </div>

            {/* Grid Inputs Compact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Tanggal Surat *"
                type="date"
                {...register('tanggal_surat')}
                error={errors.tanggal_surat?.message}
              />

              {watchMode === 'bulk' ? (
                <Input
                  label="Jumlah Nomor yang Dibutuhkan *"
                  type="number"
                  min={1}
                  max={100}
                  {...register('jumlah_nomor', { valueAsNumber: true })}
                  error={errors.jumlah_nomor?.message}
                />
              ) : (
                <div className="flex flex-col justify-end">
                  <span className="text-2xs text-slate-400 pb-2">
                    Jumlah nomor yang diterbitkan: <strong>1 Dokumen</strong>
                  </span>
                </div>
              )}

              <Controller
                name="kode_unit"
                control={control}
                render={({ field }) => (
                  <AsyncSelect
                    label="Kode Unit Kerja Pemohon *"
                    placeholder="Cari kode atau nama unit..."
                    loadOptions={async (query) => {
                      const units = await arsipService.getAllKlasifikasi('unit');
                      const filtered = (units || []).filter(
                        (u) =>
                          u.nama.toLowerCase().includes(query.toLowerCase()) ||
                          u.kode.toLowerCase().includes(query.toLowerCase())
                      );
                      return filtered.map((u) => ({
                        value: u.kode,
                        label: `${u.kode} - ${u.nama}`,
                      }));
                    }}
                    value={field.value}
                    onChange={(opt: any) => field.onChange(opt?.value || '')}
                    error={errors.kode_unit?.message}
                    isClearable
                  />
                )}
              />

              <Controller
                name="kode_klasifikasi"
                control={control}
                render={({ field }) => (
                  <AsyncSelect
                    label="Klasifikasi Masalah Surat *"
                    placeholder="Cari kode klasifikasi..."
                    loadOptions={async (query) => {
                      const klasifikasis = await arsipService.getAllKlasifikasi('klasifikasi');
                      const filtered = (klasifikasis || []).filter(
                        (k) =>
                          k.nama.toLowerCase().includes(query.toLowerCase()) ||
                          k.kode.toLowerCase().includes(query.toLowerCase())
                      );
                      return filtered.map((k) => ({
                        value: k.kode,
                        label: `${k.kode} - ${k.nama}`,
                      }));
                    }}
                    value={field.value}
                    onChange={(opt: any) => field.onChange(opt?.value || '')}
                    error={errors.kode_klasifikasi?.message}
                    isClearable
                  />
                )}
              />

              <div className="sm:col-span-2">
                <Input
                  label="Perihal Surat *"
                  placeholder="Contoh: Undangan Rapat Evaluasi Kerja Triwulan III..."
                  {...register('perihal')}
                  error={errors.perihal?.message}
                />
              </div>

              <div className="sm:col-span-2">
                <Input
                  label="Tujuan / Penerima Surat (Opsional)"
                  placeholder="Contoh: Seluruh Dosen Fakultas Teknik, Mitra Kerjasama..."
                  {...register('tujuan')}
                  error={errors.tujuan?.message}
                />
              </div>

              <div className="sm:col-span-2">
                <Controller
                  name="lampiran"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <div>
                      <Input
                        type="file"
                        label="Lampiran Draft Surat (Opsional - PDF/DOC/DOCX/JPG)"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        error={error?.message}
                        onChange={(e) => field.onChange(e.target.files?.[0] || null)}
                        className="text-xs text-slate-600 cursor-pointer"
                      />
                      {field.value && (
                        <p className="text-2xs text-emerald-600 mt-1 font-medium">
                          ✓ Berkas draft dipilih: {field.value.name} ({(field.value.size / 1024).toFixed(0)} KB)
                        </p>
                      )}
                    </div>
                  )}
                />
                <p className="text-2xs text-slate-400 mt-1">
                  Draft surat (bila ada) dapat dilampirkan untuk mempermudah verifikasi oleh staf kearsipan kampus.
                </p>
              </div>

              <div className="sm:col-span-2">
                <Textarea
                  label="Catatan Pemohon (Opsional)"
                  placeholder="Catatan atau keterangan urgensi surat..."
                  rows={2}
                  {...register('catatan_pemohon')}
                  error={errors.catatan_pemohon?.message}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => router.push('/simpeg/nomor-surat')}
                disabled={submittingRequest}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                icon={<CheckCircle2 size={16} />}
                className="bg-[var(--module-primary)] hover:opacity-90 text-white"
                isLoading={submittingRequest}
              >
                Kirim Pengajuan Nomor Surat
              </Button>
            </div>
          </form>
        </div>

        {/* Kolom Kanan: Panduan & Preview Simulasi */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Hash size={16} className="text-[var(--module-primary)]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Simulasi Format Nomor
              </h3>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center space-y-1">
              <span className="text-2xs uppercase tracking-wider font-semibold text-slate-400 block">
                Prediksi Format Nomor Surat
              </span>
              <p className="font-mono text-xs font-bold text-[var(--module-primary)] break-all">
                [NO_URUT]/{watchUnit || '[UNIT]'}/{watchKlasifikasi || '[KLASIFIKASI]'}/{romanMonth}/{letterYear}
              </p>
              <p className="text-2xs text-slate-400 mt-1">
                {watchMode === 'bulk' 
                  ? `Sistem akan menerbitkan ${watchJumlah || 1} nomor urut berurutan`
                  : 'Nomor urut resmi akan diberikan otomatis oleh sistem'}
              </p>
            </div>

            <div className="text-2xs text-slate-500 space-y-2 pt-2 border-t border-slate-100 leading-relaxed">
              <p className="font-semibold text-slate-700">Ketentuan Permohonan:</p>
              <p>
                <strong className="text-slate-700">Kode Unit:</strong> Sesuaikan dengan unit kerja atau fakultas Anda yang bertindak sebagai pembuat surat.
              </p>
              <p>
                <strong className="text-slate-700">Klasifikasi:</strong> Pilih klasifikasi masalah surat sesuai tata kearsipan resmi kampus.
              </p>
              <p>
                <strong className="text-slate-700">Scan Fisik Mandiri:</strong> Begitu nomor surat disetujui/diterbitkan, nomor akan otomatis muncul di tabel <em>Daftar Nomor Surat Saya</em> agar Anda dapat mencetak surat dan mengunggah berkas scannya.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
