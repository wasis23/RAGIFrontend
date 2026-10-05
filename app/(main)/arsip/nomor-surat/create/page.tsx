'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { CheckCircle2, ShieldAlert, FileText, Hash, ArrowLeft } from 'lucide-react';

import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { arsipService } from '@/services/arsip.service';
import { STATUS_AWAL_NOMOR_OPTIONS } from '@/types/arsip.types';

const generateFormSchema = z.object({
  mode: z.enum(['satuan', 'bulk']),
  tanggal_surat: z.string().min(1, 'Tanggal surat wajib diisi'),
  kode_unit: z.string().min(1, 'Kode unit kerja wajib dipilih'),
  kode_klasifikasi: z.string().min(1, 'Kode klasifikasi surat wajib dipilih'),
  perihal: z.string().min(3, 'Perihal surat minimal 3 karakter'),
  tujuan: z.string().optional(),
  status: z.enum(['terpakai', 'direservasi']),
  jumlah_nomor: z.number().int().min(1, 'Minimal 1 nomor').max(100, 'Maksimal 100 nomor'),
  catatan: z.string().optional(),
});

type GenerateFormData = z.infer<typeof generateFormSchema>;

export default function CreateNomorSuratPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('arsip.nomor_surat.create');

  const [submitting, setSubmitting] = useState(false);
  const todayStr = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<GenerateFormData>({
    resolver: zodResolver(generateFormSchema),
    defaultValues: {
      mode: 'satuan',
      tanggal_surat: todayStr,
      kode_unit: '',
      kode_klasifikasi: '',
      perihal: '',
      tujuan: '',
      status: 'terpakai',
      jumlah_nomor: 1,
      catatan: '',
    },
  });

  const watchMode = watch('mode');
  const watchTanggal = watch('tanggal_surat');
  const watchUnit = watch('kode_unit');
  const watchKlasifikasi = watch('kode_klasifikasi');
  const watchJumlah = watch('jumlah_nomor');

  // Preview format kalkulasi
  const parsedDate = watchTanggal ? new Date(watchTanggal) : new Date();
  const letterYear = isNaN(parsedDate.getFullYear()) ? new Date().getFullYear() : parsedDate.getFullYear();
  const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  const monthIdx = isNaN(parsedDate.getMonth()) ? new Date().getMonth() : parsedDate.getMonth();
  const romanMonth = romanMonths[monthIdx];
  const unitPreview = watchUnit || '[UNIT]';
  const klasifikasiPreview = watchKlasifikasi || '[KLASIFIKASI]';

  const onSubmit = async (data: GenerateFormData) => {
    try {
      setSubmitting(true);
      const res = await arsipService.generateNomorSurat({
        mode: data.mode,
        tanggal_surat: data.tanggal_surat,
        kode_unit: data.kode_unit,
        kode_klasifikasi: data.kode_klasifikasi,
        perihal: data.perihal,
        tujuan: data.tujuan || undefined,
        status: data.status,
        module_origin: 'arsip',
        jumlah_nomor: data.mode === 'bulk' ? data.jumlah_nomor : 1,
        catatan: data.catatan || undefined,
      });

      if (res.data) {
        if (Array.isArray(res.data)) {
          toast.success(`Berhasil menerbitkan ${res.data.length} nomor surat sekaligus!`);
          router.push('/arsip/nomor-surat');
        } else {
          toast.success(`Nomor surat ${res.data.nomor_surat || ''} berhasil diterbitkan!`);
          if (res.data.id) {
            router.push(`/arsip/nomor-surat/${res.data.id}`);
          } else {
            router.push('/arsip/nomor-surat');
          }
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menerbitkan nomor surat');
    } finally {
      setSubmitting(false);
    }
  };

  if (!canCreate) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader
          title="Terbitkan Nomor Surat"
          description="Form penerbitan nomor surat resmi kampus"
          action={
            <Link href="/arsip/nomor-surat">
              <Button
                variant="outline"
                size="md"
                className="border-[var(--module-primary)] text-[var(--module-primary)] hover:bg-[var(--module-primary-subtle,#f0fdfa)]"
              >
                <ArrowLeft size={16} className="mr-1.5" />
                Kembali
              </Button>
            </Link>
          }
        />
        <div className="bg-white border border-red-200 rounded-xl p-6 text-center shadow-xs">
          <ShieldAlert size={36} className="text-red-500 mx-auto mb-2" />
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Akses Ditolak</h2>
          <p className="text-2xs text-slate-500 max-w-sm mx-auto mb-4">
            Anda tidak memiliki izin (permission <code className="font-mono">arsip.nomor_surat.create</code>) untuk menerbitkan nomor surat resmi.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push('/arsip/nomor-surat')}
          >
            Kembali ke Daftar Nomor Surat
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Terbitkan Nomor Surat"
        description="Form penerbitan nomor surat resmi kampus dengan format baku dan penomoran otomatis berurutan"
        action={
          <Link href="/arsip/nomor-surat">
            <Button
              variant="outline"
              size="md"
              className="border-[var(--module-primary)] text-[var(--module-primary)] hover:bg-[var(--module-primary-subtle,#f0fdfa)]"
            >
              <ArrowLeft size={16} className="mr-1.5" />
              Kembali
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Form Input */}
        <div className="lg:col-span-2">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-[var(--module-primary)]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Data Penerbitan Nomor Surat
                </h3>
              </div>
              <Badge variant="blue" className="text-2xs font-mono uppercase">
                {watchMode === 'bulk' ? 'Penerbitan Sekaligus' : 'Penerbitan Satuan'}
              </Badge>
            </div>

            {/* Pilihan Mode */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100/80 rounded-lg">
              <button
                type="button"
                onClick={() => setValue('mode', 'satuan')}
                className={`py-2 px-3 text-xs font-semibold rounded-md transition-all text-center ${
                  watchMode === 'satuan'
                    ? 'bg-white text-[var(--module-primary)] font-bold shadow-xs border border-[var(--module-primary)]/20'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Satuan (1 Dokumen)
              </button>
              <button
                type="button"
                onClick={() => setValue('mode', 'bulk')}
                className={`py-2 px-3 text-xs font-semibold rounded-md transition-all text-center ${
                  watchMode === 'bulk'
                    ? 'bg-white text-[var(--module-primary)] font-bold shadow-xs border border-[var(--module-primary)]/20'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Sekaligus / Banyak Nomor (Bulk)
              </button>
            </div>

            {/* Form Fields: Grid 2 Kolom Compact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Tanggal Surat *"
                type="date"
                {...register('tanggal_surat')}
                error={errors.tanggal_surat?.message}
              />

              {watchMode === 'bulk' ? (
                <Input
                  label="Jumlah Nomor yang Diterbitkan *"
                  type="number"
                  min={1}
                  max={100}
                  {...register('jumlah_nomor', { valueAsNumber: true })}
                  error={errors.jumlah_nomor?.message}
                />
              ) : (
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Status Awal Nomor *"
                      options={STATUS_AWAL_NOMOR_OPTIONS}
                      value={field.value}
                      onChange={(val) => field.onChange(val || 'terpakai')}
                      error={errors.status?.message}
                    />
                  )}
                />
              )}

              <Controller
                name="kode_unit"
                control={control}
                render={({ field }) => (
                  <AsyncSelect
                    label="Kode Unit Pengolah *"
                    placeholder="Cari kode atau nama unit pengolah..."
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
                    onChange={(opt: any) => field.onChange(opt ? opt.value : '')}
                    error={errors.kode_unit?.message}
                    required
                  />
                )}
              />

              <Controller
                name="kode_klasifikasi"
                control={control}
                render={({ field }) => (
                  <AsyncSelect
                    label="Kode Klasifikasi Surat (DI - DIX) *"
                    placeholder="Cari kode atau uraian klasifikasi..."
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
                    onChange={(opt: any) => field.onChange(opt ? opt.value : '')}
                    error={errors.kode_klasifikasi?.message}
                    required
                  />
                )}
              />

              <div className="sm:col-span-2">
                <Input
                  label="Perihal Surat *"
                  placeholder="Contoh: Undangan Rapat Kerja Pimpinan Kampus Semester Ganjil"
                  {...register('perihal')}
                  error={errors.perihal?.message}
                />
              </div>

              <div className="sm:col-span-2">
                <Input
                  label="Tujuan / Kepada (Penerima Surat)"
                  placeholder="Contoh: Seluruh Dekan Fakultas & Kepala Lembaga"
                  {...register('tujuan')}
                  error={errors.tujuan?.message}
                />
              </div>

              <div className="sm:col-span-2">
                <Textarea
                  label="Catatan Tambahan (Opsional)"
                  placeholder="Catatan internal pengarsipan dokumen..."
                  rows={2}
                  {...register('catatan')}
                  error={errors.catatan?.message}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => router.push('/arsip/nomor-surat')}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="bg-[var(--module-primary)] hover:opacity-90 text-white"
                isLoading={submitting}
              >
                <CheckCircle2 size={16} className="mr-1.5" />
                {watchMode === 'bulk'
                  ? `Terbitkan ${watchJumlah || 1} Nomor Sekaligus`
                  : 'Terbitkan Nomor Surat'}
              </Button>
            </div>
          </form>
        </div>

        {/* Kolom Kanan: Preview Format & Pedoman */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Hash size={16} className="text-[var(--module-primary)]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Preview Format Penomoran
              </h3>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center space-y-1">
              <span className="text-2xs uppercase tracking-wider font-semibold text-slate-400 block">
                Simulasi Format Nomor
              </span>
              <p className="font-mono text-xs font-bold text-slate-900 break-all">
                XXX/{unitPreview}/{klasifikasiPreview}/{romanMonth}/{letterYear}
              </p>
              <span className="text-2xs text-slate-500 block">
                Tahun Dokumen: {letterYear} • Bulan: {romanMonth}
              </span>
            </div>

            <div className="text-2xs text-slate-500 space-y-2 pt-1">
              <p>
                <strong className="text-slate-700">Urutan Otomatis:</strong> Nomor urut (XXX) dihitung otomatis oleh sistem per kombinasi unit kerja, klasifikasi surat, dan tahun surat tanpa risiko bentrok.
              </p>
              <p>
                <strong className="text-slate-700">Lampiran Kop Surat:</strong> Sesuai tahun dokumen ({letterYear}), kop surat versi {letterYear >= 2021 ? 'Baru (≥ 2021)' : 'Lama (< 2021)'} akan otomatis dikaitkan saat cetak atau unduh.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
