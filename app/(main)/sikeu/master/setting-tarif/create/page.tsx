'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Loader2, Calculator, Layers, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { sikeuService, MasterBiaya } from '@/services/sikeu.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';

const settingTarifSchema = z.object({
  master_biaya_id: z.number().min(1, 'Komponen biaya wajib dipilih'),
  tahun_angkatan: z.number().min(2000, 'Tahun angkatan tidak valid').max(2099, 'Tahun angkatan tidak valid'),
  program_studi_id: z.string().optional(),
  semester: z.string().optional(),
  jalur_kelas: z.string().min(1, 'Jalur kelas wajib dipilih'),
  nominal: z.number().min(0, 'Nominal biaya tidak boleh negatif'),
  keterangan: z.string().optional(),
  is_active: z.boolean().default(true),
});

type SettingTarifFormData = z.infer<typeof settingTarifSchema>;

export default function CreateSettingTarifPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [masterBiayaList, setMasterBiayaList] = useState<MasterBiaya[]>([]);
  const [prodiList, setProdiList] = useState<any[]>([]);
  const [jalurKelasList, setJalurKelasList] = useState<{ value: string; label: string }[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SettingTarifFormData>({
    resolver: zodResolver(settingTarifSchema) as any,
    defaultValues: {
      master_biaya_id: 0,
      tahun_angkatan: new Date().getFullYear(),
      program_studi_id: '',
      semester: '',
      jalur_kelas: '',
      nominal: 3500000,
      keterangan: '',
      is_active: true,
    },
  });

  const watchBiayaId = watch('master_biaya_id');
  const watchProdiId = watch('program_studi_id');
  const watchJalur = watch('jalur_kelas');
  const watchSemester = watch('semester');
  const watchIsActive = watch('is_active');

  useEffect(() => {
    const loadMasterData = async () => {
      setLoadingOptions(true);
      try {
        const [resBiaya, resProdi, resJalur] = await Promise.all([
          sikeuService.getMasterBiayaList(),
          sikeuService.getProgramStudiList(),
          sikeuService.getJalurKelasList().catch(() => ({ data: [] })),
        ]);

        const biayaItems = Array.isArray(resBiaya.data) ? resBiaya.data : [];
        setMasterBiayaList(biayaItems);
        if (biayaItems.length > 0) {
          setValue('master_biaya_id', biayaItems[0].id);
        }

        const prodiItems = Array.isArray(resProdi.data) ? resProdi.data : [];
        setProdiList(prodiItems);

        const jalurItems = Array.isArray(resJalur.data) ? resJalur.data : [];
        if (jalurItems.length > 0) {
          const mapped = jalurItems.map((j: any) => ({
            value: j.nama || j.kode || String(j.id),
            label: j.nama || j.kode || String(j.id),
          }));
          setJalurKelasList(mapped);
          setValue('jalur_kelas', mapped[0].value);
        } else {
          // Fallback if empty
          setJalurKelasList([
            { value: 'REGULER', label: 'REGULER' },
            { value: 'KARYAWAN', label: 'KARYAWAN' },
            { value: 'INTERNASIONAL', label: 'INTERNASIONAL' },
          ]);
          setValue('jalur_kelas', 'REGULER');
        }
      } catch (err) {
        console.error(err);
        toast.error('Gagal memuat master data tarif');
      } finally {
        setLoadingOptions(false);
      }
    };

    loadMasterData();
  }, [setValue]);

  const onSubmit = async (data: SettingTarifFormData) => {
    setSubmitting(true);
    try {
      await sikeuService.storeSettingTarif({
        master_biaya_id: data.master_biaya_id,
        tahun_angkatan: data.tahun_angkatan,
        program_studi_id: data.program_studi_id ? Number(data.program_studi_id) : undefined,
        semester: data.semester ? Number(data.semester) : undefined,
        jalur_kelas: data.jalur_kelas,
        nominal: data.nominal,
        is_active: data.is_active,
        keterangan: data.keterangan || undefined,
      });

      toast.success('Pengaturan tarif berhasil disimpan!');
      router.push('/sikeu/mahasiswa/tarif?tab=setting_tarif');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Gagal menyimpan setting tarif');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      <PageHeader
        title="Tambah Setting Tarif Matriks"
        description="Tetapkan besaran tarif riil tagihan mahasiswa per kombinasi Tahun Angkatan, Program Studi, dan Jalur Kelas."
        action={
          <Button
            variant="outline"
            icon={<ArrowLeft size={16} />}
            onClick={() => router.push('/sikeu/mahasiswa/tarif?tab=setting_tarif')}
            className="font-bold min-h-[40px]"
          >
            Kembali
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calculator size={18} className="text-primary-600" />
              Parameter Matriks Tarif Biaya
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tentukan komponen biaya, sasaran program studi, tahun angkatan, dan nominal riil invoice.
            </p>
          </div>

          {loadingOptions ? (
            <div className="py-8 flex items-center justify-center gap-2 text-xs text-slate-500">
              <Loader2 size={18} className="animate-spin text-primary-600" />
              <span>Memuat data master referensi dari database...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Komponen Master Biaya *"
                options={masterBiayaList.map((b) => ({
                  value: String(b.id),
                  label: `${b.kode_biaya} - ${b.nama}`,
                }))}
                value={String(watchBiayaId)}
                onChange={(val) => setValue('master_biaya_id', Number(val), { shouldValidate: true })}
                error={errors.master_biaya_id?.message}
              />

              <Input
                type="number"
                label="Tahun Angkatan *"
                placeholder="2026"
                {...register('tahun_angkatan', { valueAsNumber: true })}
                error={errors.tahun_angkatan?.message}
              />

              <Select
                label="Program Studi (Pilih Global untuk Seluruh Kampus)"
                options={[
                  { value: '', label: 'Global Kampus (Berlaku Semua Program Studi)' },
                  ...prodiList.map((p) => ({
                    value: String(p.id),
                    label: `${p.jenjang ? p.jenjang + ' ' : ''}${p.nama}`,
                  })),
                ]}
                value={watchProdiId || ''}
                onChange={(val) => setValue('program_studi_id', val as string)}
              />

              <Select
                label="Jalur Kelas *"
                options={jalurKelasList}
                value={watchJalur}
                onChange={(val) => setValue('jalur_kelas', val as string, { shouldValidate: true })}
                error={errors.jalur_kelas?.message}
              />

              <Select
                label="Semester Target (Opsional)"
                options={[
                  { value: '', label: 'Semua Semester (Berlaku Semester 1 s/d 8)' },
                  { value: '1', label: 'Semester 1' },
                  { value: '2', label: 'Semester 2' },
                  { value: '3', label: 'Semester 3' },
                  { value: '4', label: 'Semester 4' },
                  { value: '5', label: 'Semester 5' },
                  { value: '6', label: 'Semester 6' },
                  { value: '7', label: 'Semester 7' },
                  { value: '8', label: 'Semester 8' },
                ]}
                value={watchSemester || ''}
                onChange={(val) => setValue('semester', val as string)}
              />

              <Input
                type="number"
                label="Nominal Biaya Riil (Rp) *"
                placeholder="3500000"
                {...register('nominal', { valueAsNumber: true })}
                error={errors.nominal?.message}
                hint="Nominal tagihan riil yang akan terbit pada invoice mahasiswa"
              />

              <div className="md:col-span-2">
                <Input
                  label="Keterangan Tambahan / Spesifikasi"
                  placeholder="Contoh: UKT Angkatan 2026 Teknik Informatika Semester Ganjil Reguler"
                  {...register('keterangan')}
                />
              </div>

              <div className="md:col-span-2 pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('is_active')}
                    className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Tarif Aktif dan Siap Digunakan untuk Penerbitan Tagihan
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/sikeu/mahasiswa/tarif?tab=setting_tarif')}
            disabled={submitting}
            className="font-bold min-h-[42px] px-5"
          >
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={submitting || loadingOptions}
            icon={submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            className="font-bold shadow-md min-h-[42px] px-6"
          >
            {submitting ? 'Menyimpan...' : 'Simpan Setting Tarif'}
          </Button>
        </div>
      </form>
    </div>
  );
}
