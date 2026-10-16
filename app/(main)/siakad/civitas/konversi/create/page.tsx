'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { z } from 'zod';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

const detailSchema = z.object({
  mata_kuliah_diakui_id: z
    .number()
    .min(1, 'Pilih mata kuliah kurikulum lokal'),
  kode_mk_asal: z.string().min(1, 'Kode MK asal wajib diisi'),
  nama_mk_asal: z.string().min(1, 'Nama MK asal wajib diisi'),
  sks_asal: z
    .number()
    .min(1, 'SKS asal minimal 1')
    .max(10, 'SKS asal maksimal 10'),
  nilai_huruf_asal: z.string().min(1, 'Nilai huruf asal wajib diisi'),
});

const konversiCreateSchema = z.object({
  mahasiswa_id: z.number().min(1, 'Pilih mahasiswa penerima konversi terlebih dahulu'),
  kampus_asal: z.string().min(1, 'Perguruan tinggi / kampus asal wajib diisi'),
  prodi_asal: z.string().min(1, 'Program studi asal wajib diisi'),
  catatan: z.string().optional(),
  details: z.array(detailSchema).min(1, 'Minimal harus ada 1 baris mata kuliah konversi'),
});

type KonversiCreateFormData = z.infer<typeof konversiCreateSchema>;

export default function CreateKonversiTransferPage() {
  const router = useRouter();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<KonversiCreateFormData>({
    resolver: zodResolver(konversiCreateSchema),
    defaultValues: {
      mahasiswa_id: 0,
      kampus_asal: '',
      prodi_asal: '',
      catatan: '',
      details: [
        {
          mata_kuliah_diakui_id: 0,
          kode_mk_asal: '',
          nama_mk_asal: '',
          sks_asal: 3,
          nilai_huruf_asal: 'A',
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'details',
  });

  const loadMahasiswaOptions = useCallback(async (inputValue: string) => {
    try {
      const res = await siakadService.getMahasiswas({
        search: inputValue || undefined,
        per_page: 20,
      });
      const data = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
      return data.map((m: any) => ({
        value: m.id,
        label: `${m.nama_lengkap} (${m.nim || 'Belum ada NIM'}) • ${m.program_studi?.nama || 'Prodi'} • Angkatan ${m.angkatan || '-'}`,
      }));
    } catch {
      return [];
    }
  }, []);

  const loadMataKuliahOptions = useCallback(async (inputValue: string) => {
    try {
      const res = await siakadService.getMataKuliahs({
        search: inputValue || undefined,
        per_page: 20,
      });
      const data = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
      return data.map((mk: any) => ({
        value: mk.id,
        label: `${mk.kode_mk || ''} - ${mk.nama || ''} (${mk.total_sks || mk.sks_total || mk.sks_teori || 0} SKS)`.trim(),
      }));
    } catch {
      return [];
    }
  }, []);

  const handleAddDetail = () => {
    append({
      mata_kuliah_diakui_id: 0,
      kode_mk_asal: '',
      nama_mk_asal: '',
      sks_asal: 3,
      nilai_huruf_asal: 'A',
    });
  };

  const onSubmit = async (data: KonversiCreateFormData) => {
    try {
      await siakadService.createKonversi(data);
      toast.success('Penyetaraan nilai mahasiswa transfer berhasil disimpan!');
      router.push('/siakad/civitas/konversi');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal menyimpan data konversi');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Input Konversi Nilai Mahasiswa Transfer"
        description="Penyetaraan dan mapping mata kuliah mahasiswa pindahan dari perguruan tinggi sebelumnya ke kurikulum aktif."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Konversi Nilai', href: '/siakad/civitas/konversi' },
          { label: 'Input Penyetaraan' },
        ]}
        action={
          <Button
            variant="outline"
            icon={<ArrowLeft size={16} />}
            onClick={() => router.push('/siakad/civitas/konversi')}
          >
            Kembali
          </Button>
        }
      />

      <div className="card p-6 bg-white border border-slate-200 shadow-xs">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-sm text-slate-900">1. Mahasiswa & Asal Perguruan Tinggi</h3>
            <p className="text-2xs text-slate-500">Pilih mahasiswa pindahan dan identitas kampus tempat studi sebelumnya.</p>
          </div>

          <div className="space-y-4">
            <div>
              <Controller
                control={control}
                name="mahasiswa_id"
                render={({ field }) => (
                  <AsyncSelect
                    label="Pilih Mahasiswa Penerima Konversi *"
                    required
                    placeholder="Ketik nama atau NIM mahasiswa..."
                    loadOptions={loadMahasiswaOptions}
                    defaultOptions={true}
                    value={field.value}
                    onChange={(opt: any) => field.onChange(opt ? Number(opt.value) : 0)}
                    error={errors.mahasiswa_id?.message}
                  />
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input
                label="Perguruan Tinggi / Kampus Asal *"
                required
                placeholder="Contoh: Universitas Gadjah Mada"
                error={errors.kampus_asal?.message}
                {...register('kampus_asal')}
              />

              <Input
                label="Program Studi Asal *"
                required
                placeholder="Contoh: D3 Teknik Informatika"
                error={errors.prodi_asal?.message}
                {...register('prodi_asal')}
              />

              <Input
                label="Catatan / Nomor SK Penyetaraan"
                placeholder="Contoh: SK Rektor No. 12/SK-KONV/2026"
                error={errors.catatan?.message}
                {...register('catatan')}
              />
            </div>
          </div>

          <div className="border-b border-slate-100 pb-3 pt-2 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                2. Rincian Mata Kuliah yang Diakui ({fields.length} MK)
              </h3>
              <p className="text-2xs text-slate-500">Mata kuliah dari kampus asal yang disetarakan dengan mata kuliah kurikulum lokal.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              icon={<Plus size={14} />}
              onClick={handleAddDetail}
              className="text-xs font-bold"
            >
              Tambah Baris MK
            </Button>
          </div>

          {errors.details?.message && (
            <p className="text-xs text-rose-600 font-bold">{errors.details.message}</p>
          )}

          <div className="space-y-4">
            {fields.map((field, idx) => (
              <div key={field.id} className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    Baris #{idx + 1}
                  </span>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 size={14} className="text-rose-500" />}
                      className="text-xs text-rose-600 hover:bg-rose-50"
                      onClick={() => remove(idx)}
                    >
                      Hapus
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4 bg-white p-4 rounded-xl border border-slate-200">
                    <span className="text-2xs font-bold text-slate-500 block uppercase">Mata Kuliah Asal</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Input
                        label="Kode MK Asal *"
                        placeholder="CS101"
                        required
                        error={errors.details?.[idx]?.kode_mk_asal?.message}
                        {...register(`details.${idx}.kode_mk_asal`)}
                      />
                      <div className="sm:col-span-2">
                        <Input
                          label="Nama MK Asal *"
                          placeholder="Dasar Pemrograman"
                          required
                          error={errors.details?.[idx]?.nama_mk_asal?.message}
                          {...register(`details.${idx}.nama_mk_asal`)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        label="SKS Asal *"
                        type="number"
                        min={1}
                        max={10}
                        required
                        error={errors.details?.[idx]?.sks_asal?.message}
                        {...register(`details.${idx}.sks_asal`, { valueAsNumber: true })}
                      />
                      <Input
                        label="Nilai Huruf Asal *"
                        placeholder="A / B+"
                        required
                        error={errors.details?.[idx]?.nilai_huruf_asal?.message}
                        {...register(`details.${idx}.nilai_huruf_asal`)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4 bg-white p-4 rounded-xl border border-slate-200">
                    <span className="text-2xs font-bold text-slate-500 block uppercase">Disetarakan Ke MK Lokal</span>
                    <Controller
                      control={control}
                      name={`details.${idx}.mata_kuliah_diakui_id`}
                      render={({ field: selectField }) => (
                        <AsyncSelect
                          label="Pilih MK Kurikulum Lokal *"
                          required
                          placeholder="Cari kode atau nama mata kuliah..."
                          loadOptions={loadMataKuliahOptions}
                          defaultOptions={true}
                          value={selectField.value}
                          onChange={(opt: any) => selectField.onChange(opt ? Number(opt.value) : 0)}
                          error={errors.details?.[idx]?.mata_kuliah_diakui_id?.message}
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/siakad/civitas/konversi')}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={<Save size={16} />}
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Konversi Transfer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
