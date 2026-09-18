'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Loader2, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

const tarifSchema = z.object({
  jenis_biaya_id: z.number().min(1, 'Komponen biaya wajib dipilih'),
  tahun_angkatan: z.number().min(2020, 'Tahun angkatan minimal 2020').max(2040, 'Tahun angkatan maksimal 2040'),
  jalur_kelas: z.string().min(1, 'Jalur / kelas kuliah wajib dipilih'),
  kelompok_ukt: z.number().min(1, 'Kelompok UKT minimal golongan 1').max(8, 'Kelompok UKT maksimal golongan 8'),
  prodi: z.string().min(1, 'Program studi wajib dipilih atau diisi'),
  nama_kelompok: z.string().min(3, 'Nama kelompok / keterangan tarif minimal 3 karakter'),
  nominal: z.number().min(0, 'Nominal tarif tidak boleh negatif'),
});

type TarifFormData = z.infer<typeof tarifSchema>;

export default function CreateTarifPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [jenisBiayaList, setJenisBiayaList] = useState<any[]>([]);
  const [jalurKelasList, setJalurKelasList] = useState<{ value: string; label: string }[]>([]);
  const [programStudiList, setProgramStudiList] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TarifFormData>({
    resolver: zodResolver(tarifSchema) as any,
    defaultValues: {
      jenis_biaya_id: 1,
      tahun_angkatan: new Date().getFullYear(),
      jalur_kelas: '',
      kelompok_ukt: 1,
      prodi: '',
      nama_kelompok: '',
      nominal: 3500000,
    },
  });

  const watchJenisBiayaId = watch('jenis_biaya_id');
  const watchJalurKelas = watch('jalur_kelas');
  const watchProdi = watch('prodi');
  const watchKelompokUkt = watch('kelompok_ukt');

  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoadingOptions(true);
        const [resBiaya, resJalur, resProdi] = await Promise.all([
          sikeuService.getJenisBiayaList(),
          sikeuService.getJalurKelasList().catch(() => ({ data: [] })),
          sikeuService.getProgramStudiList().catch(() => ({ data: [] })),
        ]);

        if (Array.isArray(resBiaya.data) && resBiaya.data.length > 0) {
          setJenisBiayaList(resBiaya.data);
          setValue('jenis_biaya_id', resBiaya.data[0].id);
        }

        if (Array.isArray(resJalur.data) && resJalur.data.length > 0) {
          const jalurs = resJalur.data.map((j: any) => ({
            value: j.nama_jalur || j.nama || j.kode,
            label: j.nama_jalur || j.nama || j.kode,
          }));
          setJalurKelasList(jalurs);
          setValue('jalur_kelas', jalurs[0].value);
        }

        if (Array.isArray(resProdi.data) && resProdi.data.length > 0) {
          setProgramStudiList(resProdi.data);
          setValue('prodi', resProdi.data[0].nama || '');
          setValue('nama_kelompok', `UKT Gol. 1 - ${resProdi.data[0].nama}`);
        }
      } catch (err) {
        console.error('Gagal mengambil opsi master tarif:', err);
        toast.error('Gagal memuat master data untuk opsi form.');
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, [setValue]);

  // Auto-fill nama_kelompok when prodi or ukt changes
  useEffect(() => {
    if (watchProdi) {
      setValue('nama_kelompok', `UKT Gol. ${watchKelompokUkt || 1} - ${watchProdi}`);
    }
  }, [watchProdi, watchKelompokUkt, setValue]);

  const onSubmit = async (data: TarifFormData) => {
    setSubmitting(true);
    try {
      await sikeuService.storeTarif(data);
      toast.success('Nominal tarif baru berhasil ditetapkan');
      router.push('/sikeu/mahasiswa/tarif?tab=tarif_ukt');
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || err.message || 'Gagal menyimpan nominal tarif');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6 animate-fade-in pb-12">
      <PageHeader
        title="Tambah Nominal Tarif Pendidikan"
        description="Tetapkan besaran tarif UKT per golongan, angkatan, jalur masuk, dan program studi dari tabel database."
        action={
          <Button
            variant="outline"
            icon={<ArrowLeft size={16} />}
            onClick={() => router.push('/sikeu/mahasiswa/tarif?tab=tarif_ukt')}
            className="font-bold min-h-[40px] px-4"
          >
            Kembali
          </Button>
        }
      />

      <div className="card p-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <DollarSign size={20} />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Formulir Pengaturan Tarif Baru</h3>
            <p className="text-xs text-slate-500">
              Pastikan konfigurasi sesuai master komponen biaya dan kurikulum angkatan.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Section 1: Komponen & Angkatan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Komponen Biaya *"
              options={
                jenisBiayaList.length > 0
                  ? jenisBiayaList.map((j) => ({
                      value: String(j.id),
                      label: `${j.kode ? `[${j.kode}] ` : ''}${j.nama}`,
                    }))
                  : [{ value: '1', label: 'Memuat data...' }]
              }
              value={watchJenisBiayaId ? String(watchJenisBiayaId) : ''}
              onChange={(val) => setValue('jenis_biaya_id', Number(val), { shouldValidate: true })}
              error={errors.jenis_biaya_id?.message}
            />

            <Input
              type="number"
              label="Tahun Angkatan *"
              placeholder="2025"
              {...register('tahun_angkatan', { valueAsNumber: true })}
              error={errors.tahun_angkatan?.message}
            />
          </div>

          {/* Section 2: Jalur Kelas & Golongan UKT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Jalur / Kelas Kuliah *"
              options={
                jalurKelasList.length > 0
                  ? jalurKelasList
                  : [{ value: 'Reguler', label: 'Reguler' }]
              }
              value={watchJalurKelas}
              onChange={(val) => setValue('jalur_kelas', val as string, { shouldValidate: true })}
              error={errors.jalur_kelas?.message}
            />

            <Select
              label="Golongan UKT *"
              options={[
                { value: '1', label: 'Golongan 1 (Subsidi Penuh)' },
                { value: '2', label: 'Golongan 2 (Subsidi Parsial)' },
                { value: '3', label: 'Golongan 3 (Reguler / Standar)' },
                { value: '4', label: 'Golongan 4 (Mandiri / Menengah)' },
                { value: '5', label: 'Golongan 5 (Eksekutif / Khusus)' },
                { value: '6', label: 'Golongan 6' },
                { value: '7', label: 'Golongan 7' },
                { value: '8', label: 'Golongan 8' },
              ]}
              value={watchKelompokUkt ? String(watchKelompokUkt) : '1'}
              onChange={(val) => setValue('kelompok_ukt', Number(val), { shouldValidate: true })}
              error={errors.kelompok_ukt?.message}
            />
          </div>

          {/* Section 3: Program Studi & Nominal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {programStudiList.length > 0 ? (
              <Select
                label="Program Studi *"
                options={programStudiList.map((p) => ({
                  value: p.nama,
                  label: `${p.jenjang ? `${p.jenjang} ` : ''}${p.nama}`,
                }))}
                value={watchProdi}
                onChange={(val) => setValue('prodi', val as string, { shouldValidate: true })}
                error={errors.prodi?.message}
              />
            ) : (
              <Input
                label="Program Studi *"
                placeholder="Contoh: Teknik Informatika"
                {...register('prodi')}
                error={errors.prodi?.message}
              />
            )}

            <Input
              type="number"
              label="Nominal Tarif (Rp) *"
              placeholder="3500000"
              {...register('nominal', { valueAsNumber: true })}
              error={errors.nominal?.message}
            />
          </div>

          {/* Section 4: Label / Keterangan Kelompok */}
          <div>
            <Input
              label="Nama Kelompok / Keterangan Tarif *"
              placeholder="Contoh: UKT Gol. 1 - Teknik Informatika"
              {...register('nama_kelompok')}
              error={errors.nama_kelompok?.message}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/sikeu/mahasiswa/tarif?tab=tarif_ukt')}
              disabled={submitting}
              className="font-bold min-h-[42px] px-5"
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              icon={submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              className="font-bold min-h-[42px] px-6 shadow-md"
            >
              {submitting ? 'Menyimpan Tarif...' : 'Simpan Nominal Tarif'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
