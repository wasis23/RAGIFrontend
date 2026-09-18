'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Loader2, Layers, BookOpen, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import { moduleService, AppModule } from '@/services/module.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';

const jenisBiayaSchema = z.object({
  kode: z.string().min(2, 'Kode minimal 2 karakter').max(50, 'Kode maksimal 50 karakter'),
  nama: z.string().min(3, 'Nama komponen biaya minimal 3 karakter'),
  tipe: z.string().min(1, 'Tipe biaya wajib dipilih'),
  skema_tarif: z.enum(['dinamis', 'flat']),
  nominal_standar: z.number().min(0, 'Nominal tidak boleh negatif'),
  deskripsi: z.string().optional(),
  is_active: z.boolean().default(true),
  is_recurring: z.boolean().default(true),
});

type JenisBiayaFormData = z.infer<typeof jenisBiayaSchema>;

const DYNAMIC_FEE_TYPES = ['ukt', 'spp', 'sks', 'praktikum'];

export default function CreateJenisBiayaPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [appModules, setAppModules] = useState<AppModule[]>([]);
  const [selectedModuleCodes, setSelectedModuleCodes] = useState<string[]>(['sikeu']);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<JenisBiayaFormData>({
    resolver: zodResolver(jenisBiayaSchema) as any,
    defaultValues: {
      kode: '',
      nama: '',
      tipe: 'ukt',
      skema_tarif: 'dinamis',
      nominal_standar: 0,
      deskripsi: '',
      is_active: true,
      is_recurring: true,
    },
  });

  const watchTipe = watch('tipe');
  const watchSkemaTarif = watch('skema_tarif');

  // Auto-switch skema_tarif when tipe changes
  useEffect(() => {
    if (DYNAMIC_FEE_TYPES.includes(watchTipe)) {
      setValue('skema_tarif', 'dinamis');
    } else if (watchTipe === 'spmb_adm' || watchTipe === 'wisuda' || watchTipe === 'cuti') {
      setValue('skema_tarif', 'flat');
    }
  }, [watchTipe, setValue]);

  useEffect(() => {
    moduleService.getAllModules()
      .then((mods) => {
        setAppModules(Array.isArray(mods) ? mods : []);
      })
      .catch(() => {
        setAppModules([]);
      });
  }, []);

  const toggleModule = (code: string) => {
    setSelectedModuleCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const onSubmit = async (data: JenisBiayaFormData) => {
    if (selectedModuleCodes.length === 0) {
      toast.error('Pilih minimal 1 modul aplikasi untuk delegasi');
      return;
    }

    setSubmitting(true);
    try {
      await sikeuService.storeJenisBiaya({
        kode: data.kode,
        nama: data.nama,
        tipe: data.tipe,
        skema_tarif: data.skema_tarif,
        nominal_standar: data.skema_tarif === 'flat' ? Number(data.nominal_standar) : 0,
        deskripsi: data.deskripsi,
        is_active: data.is_active,
        is_recurring: data.is_recurring,
        module_codes: selectedModuleCodes,
      } as any);

      toast.success('Komponen biaya baru berhasil ditambahkan');
      router.push('/sikeu/master?tab=jenis_biaya');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Gagal menyimpan komponen biaya');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      <PageHeader
        title="Tambah Komponen Biaya Baru"
        description="Daftarkan entitas pungutan dan delegasi modul aplikasi lintas sistem (SIAKAD, SPMB, SIKEU)."
        action={
          <Button
            variant="outline"
            icon={<ArrowLeft size={16} />}
            onClick={() => router.push('/sikeu/master?tab=jenis_biaya')}
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
              <BookOpen size={18} className="text-primary-600" />
              Identitas & Karakteristik Komponen Biaya
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Isi kode unik, nama resmi, tipe pungutan, serta skema penarifan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Kode Biaya *"
              placeholder="Contoh: UKT_REG, SPMB_ADM, WISUDA_FEE"
              {...register('kode')}
              error={errors.kode?.message}
            />

            <Input
              label="Nama Komponen Biaya *"
              placeholder="Contoh: Uang Kuliah Tunggal (UKT) Reguler"
              {...register('nama')}
              error={errors.nama?.message}
            />

            <Select
              label="Kategori / Tipe Pungutan *"
              options={[
                { value: 'ukt', label: 'UKT (Uang Kuliah Tunggal)' },
                { value: 'spp', label: 'SPP Berkala' },
                { value: 'sks', label: 'Biaya SKS Perkuliahan' },
                { value: 'praktikum', label: 'Biaya Praktikum / Laboratorium' },
                { value: 'spmb_adm', label: 'Biaya Pendaftaran SPMB' },
                { value: 'wisuda', label: 'Biaya Wisuda & Ijazah' },
                { value: 'cuti', label: 'Biaya Administrasi Cuti' },
                { value: 'kemahasiswaan', label: 'Iuran Kemahasiswaan' },
                { value: 'lainnya', label: 'Komponen Lainnya' },
              ]}
              value={watchTipe}
              onChange={(val) => setValue('tipe', val as string, { shouldValidate: true })}
            />

            <Select
              label="Skema Penarifan *"
              options={[
                { value: 'dinamis', label: 'Dinamis (Mengikuti Matriks Angkatan & Prodi)' },
                { value: 'flat', label: 'Flat (Satu Nominal Statis untuk Semua)' },
              ]}
              value={watchSkemaTarif}
              onChange={(val) => setValue('skema_tarif', val as any, { shouldValidate: true })}
            />

            {watchSkemaTarif === 'flat' && (
              <Input
                type="number"
                label="Nominal Standar Flat (Rp) *"
                placeholder="250000"
                {...register('nominal_standar', { valueAsNumber: true })}
                error={errors.nominal_standar?.message}
                hint="Nominal tunggal yang langsung digunakan tanpa pengaturan matriks"
              />
            )}
          </div>

          {/* Multi-Module Delegation Selection */}
          <div className="space-y-2.5 p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-primary-600" />
              <span className="text-xs font-bold text-slate-900">
                Delegasi ke Modul Aplikasi (Bisa Lebih dari 1) *
              </span>
            </div>
            <p className="text-2xs text-slate-500">
              Pilih modul aplikasi yang berhak mengonsumsi dan menerbitkan komponen biaya ini.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
              {appModules.map((m) => {
                const isChecked = selectedModuleCodes.includes(m.code);
                return (
                  <label
                    key={m.code}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isChecked
                        ? 'border-primary-500 bg-primary-50/70 text-primary-950 font-bold shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleModule(m.code)}
                      className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
                    />
                    <div className="truncate">
                      <span className="block truncate">{m.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono font-normal uppercase">{m.code}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <input
                type="checkbox"
                {...register('is_recurring')}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Biaya Rutin / Berulang</span>
                <span className="text-2xs text-slate-500 block">Diterbitkan setiap semester baru secara otomatis</span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <input
                type="checkbox"
                {...register('is_active')}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Status Aktif</span>
                <span className="text-2xs text-slate-500 block">Komponen dapat dipilih dalam pembuatan invoice</span>
              </div>
            </label>
          </div>

          <Textarea
            label="Deskripsi / Catatan Tambahan"
            placeholder="Keterangan peruntukan komponen biaya ini..."
            rows={3}
            {...register('deskripsi')}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/sikeu/master?tab=jenis_biaya')}
            disabled={submitting}
            className="font-bold min-h-[42px] px-5"
          >
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={submitting || selectedModuleCodes.length === 0}
            icon={submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            className="font-bold shadow-md min-h-[42px] px-6"
          >
            {submitting ? 'Menyimpan...' : 'Simpan Komponen Biaya'}
          </Button>
        </div>
      </form>
    </div>
  );
}
