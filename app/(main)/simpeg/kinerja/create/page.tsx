'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Calendar,
  UserCheck,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  ListChecks,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { simpegService } from '@/services/simpeg.service';
import { useAuth } from '@/hooks/useAuth';
import type { Pegawai } from '@/types/simpeg.types';

// ── ZOD SCHEMA ────────────────────────────────────────────────
const skpFormSchema = z.object({
  pegawai_id: z.string().min(1, 'Pegawai bersangkutan wajib dipilih'),
  tahun: z.string().min(4, 'Tahun minimal 4 digit'),
  semester: z.enum(['ganjil', 'genap', 'tahunan']),
  pejabat_penilai_id: z.string().min(1, 'Pejabat penilai wajib dipilih'),
  items: z
    .array(
      z.object({
        kategori_skp_id: z.string().min(1, 'Kategori SKP wajib dipilih'),
        uraian_tugas: z.string().min(5, 'Uraian tugas minimal 5 karakter'),
        target_output: z.string().min(2, 'Target output wajib diisi'),
        target_mutu: z.string().min(1, 'Target mutu wajib diisi'),
        target_waktu: z.string().min(1, 'Target waktu wajib diisi'),
        target_biaya: z.string().optional(),
      })
    )
    .min(1, 'Minimal harus menyusun 1 butir sasaran kinerja'),
});

type SkpFormValues = z.infer<typeof skpFormSchema>;

export default function CreateSkpPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [loadingMasters, setLoadingMasters] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [kategoriList, setKategoriList] = useState<{ value: string; label: string }[]>([]);
  const [penilaiList, setPenilaiList] = useState<{ value: string; label: string }[]>([]);

  const defaultTahun = new Date().getFullYear();

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SkpFormValues>({
    resolver: zodResolver(skpFormSchema),
    defaultValues: {
      pegawai_id: '',
      tahun: String(defaultTahun),
      semester: 'ganjil',
      pejabat_penilai_id: '',
      items: [
        {
          kategori_skp_id: '',
          uraian_tugas: '',
          target_output: '1 Berkas / Laporan',
          target_mutu: '100',
          target_waktu: '6 Bulan',
          target_biaya: '',
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  // Load Masters
  const fetchMasters = useCallback(async () => {
    setLoadingMasters(true);
    try {
      const res = await simpegService.getKinerjaMasters();
      if (res?.data) {
        if (Array.isArray(res.data.kategori_skp)) {
          setKategoriList(
            res.data.kategori_skp.map((k: any) => ({
              value: String(k.id),
              label: `${k.nama} (${k.kode})`,
            }))
          );
        }
        if (Array.isArray(res.data.pejabat_penilai)) {
          setPenilaiList(
            res.data.pejabat_penilai.map((p: any) => ({
              value: String(p.id),
              label: `${p.nama_lengkap} ${p.nip ? `[NIP: ${p.nip}]` : ''} - ${p.jabatan_terakhir || 'Pimpinan/Dosen'}`,
            }))
          );
        }
      }
    } catch {
      toast.error('Gagal memuat master kategori SKP');
    } finally {
      setLoadingMasters(false);
    }
  }, []);

  useEffect(() => {
    fetchMasters();
  }, [fetchMasters]);

  // Set default pegawai_id jika pegawai biasa login
  useEffect(() => {
    const userPegawai = (user as any)?.pegawai;
    if (userPegawai?.id) {
      setValue('pegawai_id', String(userPegawai.id));
    }
  }, [user, setValue]);

  // Async load pegawai untuk pemilihan admin
  const loadPegawaiOptions = async (query: string) => {
    try {
      const res = await simpegService.getPegawaiList({ search: query, per_page: 20 } as any);
      const responseData = (res as any)?.data || res;
      const items: Pegawai[] = Array.isArray(responseData)
        ? responseData
        : responseData?.data || responseData?.items || [];
      return items.map((p: Pegawai) => ({
        value: String(p.id),
        label: `${p.nama_lengkap} ${p.nip ? `[NIP: ${p.nip}]` : ''}`,
      }));
    } catch {
      return [];
    }
  };

  const onSubmit = async (values: SkpFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        pegawai_id: Number(values.pegawai_id),
        tahun: Number(values.tahun),
        semester: values.semester,
        pejabat_penilai_id: Number(values.pejabat_penilai_id),
        items: values.items.map((item) => ({
          kategori_skp_id: Number(item.kategori_skp_id),
          uraian_tugas: item.uraian_tugas,
          target_output: item.target_output,
          target_mutu: Number(item.target_mutu),
          target_waktu: item.target_waktu,
          target_biaya: item.target_biaya ? Number(item.target_biaya) : null,
        })),
      };

      const res = await simpegService.createKinerja(payload);
      toast.success('Draf Sasaran Kinerja Pegawai (SKP) berhasil dibuat');
      if (res?.data?.id) {
        router.push(`/simpeg/kinerja/${res.data.id}`);
      } else {
        router.push('/simpeg/kinerja');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan sasaran kinerja');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6 pb-6">
      <PageHeader
        title="Susun Sasaran Kinerja Pegawai (SKP)"
        description="Penyusunan target luaran, mutu, dan waktu butir-per-butir tugas Tridharma & penunjang"
        action={
          <Button
            variant="outline"
            icon={<ArrowLeft size={16} />}
            onClick={() => router.push('/simpeg/kinerja')}
          >
            Kembali
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* CARD 1: INFORMASI PEGAWAI & PERIODE */}
        <div className="card p-4 sm:p-6 bg-white border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Calendar size={20} className="text-primary-600" />
            <h2 className="font-bold text-base text-slate-900">Periode & Identitas Penilaian</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Pegawai */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pegawai Bersangkutan <span className="text-rose-500">*</span>
              </label>
              <Controller
                control={control}
                name="pegawai_id"
                render={({ field }) => (
                  <AsyncSelect
                    loadOptions={loadPegawaiOptions}
                    value={field.value}
                    onChange={(val) => field.onChange(val)}
                    placeholder="Ketik nama atau NIP pegawai..."
                    error={errors.pegawai_id?.message}
                  />
                )}
              />
            </div>

            {/* Tahun */}
            <div>
              <Input
                label="Tahun Periode"
                type="number"
                {...register('tahun')}
                error={errors.tahun?.message}
              />
            </div>

            {/* Semester */}
            <div>
              <Controller
                control={control}
                name="semester"
                render={({ field }) => (
                  <Select
                    label="Semester"
                    value={field.value}
                    onChange={(val) => field.onChange(val)}
                    options={[
                      { value: 'ganjil', label: 'Semester Ganjil' },
                      { value: 'genap', label: 'Semester Genap' },
                      { value: 'tahunan', label: 'Tahunan' },
                    ]}
                    error={errors.semester?.message}
                  />
                )}
              />
            </div>

            {/* Pejabat Penilai */}
            <div className="lg:col-span-4">
              <Controller
                control={control}
                name="pejabat_penilai_id"
                render={({ field }) => (
                  <Select
                    label="Pejabat Penilai / Atasan Langsung"
                    value={field.value}
                    onChange={(val) => field.onChange(val)}
                    options={penilaiList}
                    placeholder="Pilih Dekan / Kaprodi / Pimpinan Penilai..."
                    error={errors.pejabat_penilai_id?.message}
                  />
                )}
              />
              <p className="text-xs text-slate-500 mt-1">
                Sasaran kerja yang Anda susun akan dievaluasi dan disetujui oleh Pejabat Penilai yang dipilih.
              </p>
            </div>
          </div>
        </div>

        {/* CARD 2: BUTIR SASARAN KINERJA (TARGET BUTIR-PER-BUTIR) */}
        <div className="card p-4 sm:p-6 bg-white border border-slate-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <ListChecks size={20} className="text-primary-600" />
              <div>
                <h2 className="font-bold text-base text-slate-900">Butir-Butir Sasaran Kinerja (Target)</h2>
                <p className="text-xs text-slate-500">Susun uraian tugas pokok Tridharma, mutu kualitas, target waktu dan biaya</p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<Plus size={16} />}
              onClick={() =>
                append({
                  kategori_skp_id: '',
                  uraian_tugas: '',
                  target_output: '1 Berkas / Laporan',
                  target_mutu: '100',
                  target_waktu: '6 Bulan',
                  target_biaya: '',
                })
              }
            >
              Tambah Butir Tugas
            </Button>
          </div>

          {errors.items?.root?.message && (
            <div className="p-3 text-xs bg-rose-50 text-rose-600 rounded-lg border border-rose-200 font-medium">
              {errors.items.root.message}
            </div>
          )}

          <div className="space-y-4">
            {fields.map((fieldItem, index) => (
              <div
                key={fieldItem.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4 relative transition hover:border-slate-300"
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-semibold text-xs uppercase tracking-wider text-slate-700">
                    Butir #{index + 1}
                  </span>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-rose-500 hover:text-rose-700 text-xs font-medium flex items-center gap-1 transition"
                    >
                      <Trash2 size={14} />
                      Hapus Butir
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Kategori SKP */}
                  <div className="lg:col-span-3">
                    <Controller
                      control={control}
                      name={`items.${index}.kategori_skp_id`}
                      render={({ field }) => (
                        <Select
                          label="Kategori Tugas Tridharma & Penunjang"
                          value={field.value}
                          onChange={(val) => field.onChange(val)}
                          options={kategoriList}
                          placeholder="Pilih Kategori Tugas..."
                          error={errors.items?.[index]?.kategori_skp_id?.message}
                        />
                      )}
                    />
                  </div>

                  {/* Uraian Tugas */}
                  <div className="lg:col-span-3">
                    <Textarea
                      label="Uraian Tugas Pokok / Rencana Kinerja"
                      rows={2}
                      placeholder="Contoh: Melaksanakan perkuliahan Pemrograman Web 3 SKS, menyusun RPS dan modul ajar..."
                      {...register(`items.${index}.uraian_tugas`)}
                      error={errors.items?.[index]?.uraian_tugas?.message}
                    />
                  </div>

                  {/* Target Output */}
                  <div>
                    <Input
                      label="Target Output / Luaran"
                      placeholder="Contoh: 1 Berkas Nilai & RPS"
                      {...register(`items.${index}.target_output`)}
                      error={errors.items?.[index]?.target_output?.message}
                    />
                  </div>

                  {/* Target Mutu (%) */}
                  <div>
                    <Input
                      label="Target Mutu Kualitas (%)"
                      type="number"
                      placeholder="100"
                      {...register(`items.${index}.target_mutu`)}
                      error={errors.items?.[index]?.target_mutu?.message}
                    />
                  </div>

                  {/* Target Waktu */}
                  <div>
                    <Input
                      label="Target Waktu"
                      placeholder="Contoh: 6 Bulan / 180 Hari"
                      {...register(`items.${index}.target_waktu`)}
                      error={errors.items?.[index]?.target_waktu?.message}
                    />
                  </div>

                  {/* Target Biaya (Rp) */}
                  <div className="lg:col-span-3">
                    <Input
                      label="Target Biaya / Anggaran (Rp) - Opsional"
                      type="number"
                      placeholder="0 (kosongkan jika tanpa anggaran khusus)"
                      {...register(`items.${index}.target_biaya`)}
                      error={errors.items?.[index]?.target_biaya?.message}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SUBMIT BUTTONS */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/simpeg/kinerja')}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={<Save size={16} />}
            isLoading={isSubmitting}
          >
            Simpan Draf Sasaran Kinerja
          </Button>
        </div>
      </form>
    </div>
  );
}
