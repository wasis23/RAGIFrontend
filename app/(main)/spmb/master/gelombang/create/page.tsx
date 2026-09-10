'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  Sparkles, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Info, 
  DollarSign, 
  ChevronRight,
  Layers
} from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { spmbService } from '@/services/spmb.service';
import { moduleService } from '@/services/module.service';
import { GelombangPenerimaan, JalurMasuk } from '@/types/spmb.types';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/layout/PageHeader';
import api from '@/lib/axios';

// ============================================================
// VALIDATION SCHEMA (MANDATORY ZOD STANDARD)
// ============================================================
const gelombangFormSchema = z.object({
  nama: z.string().min(1, 'Nama gelombang wajib diisi').max(255, 'Nama gelombang maksimal 255 karakter'),
  jalur_masuk_id: z.number().min(1, 'Jalur masuk wajib dipilih'),
  tahun_akademik_id: z.number().min(1, 'Tahun akademik wajib dipilih'),
  master_biaya_id: z.number().min(1, 'Tarif biaya pendaftaran SIKEU wajib dipilih'),
  biaya_pendaftaran: z.number().min(0, 'Biaya pendaftaran minimal 0').optional(),
  kuota_total: z.number().min(1, 'Kuota pendaftar minimal 1'),
  tanggal_buka: z.string().min(1, 'Tanggal buka pendaftaran wajib diisi'),
  tanggal_tutup: z.string().min(1, 'Tanggal tutup pendaftaran wajib diisi'),
  tanggal_pengumuman: z.string().optional().nullable(),
  status: z.enum(['draft', 'aktif', 'ditutup', 'selesai']),
}).refine((data) => {
  if (data.tanggal_buka && data.tanggal_tutup) {
    return new Date(data.tanggal_tutup) >= new Date(data.tanggal_buka);
  }
  return true;
}, {
  message: 'Tanggal tutup pendaftaran harus setelah tanggal buka',
  path: ['tanggal_tutup'],
});

type GelombangFormValues = z.infer<typeof gelombangFormSchema>;

// ============================================================
// MOLECULES: SECTION HEADER
// ============================================================
function SectionHeader({ title, description, icon: Icon }: { title: string; description: string; icon: any }) {
  return (
    <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
      <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0 border border-primary-100 shadow-2xs">
        <Icon size={20} />
      </div>
      <div>
        <h3 className="font-extrabold text-slate-900 text-base md:text-lg tracking-tight">{title}</h3>
        <p className="text-xs text-slate-500 font-medium">{description}</p>
      </div>
    </div>
  );
}

// ============================================================
// MOLECULES: STATUS HELPER ALERT
// ============================================================
function StatusAlert({ status }: { status?: string }) {
  if (status === 'aktif') {
    return (
      <div className="p-3.5 bg-emerald-50 border border-emerald-200/90 rounded-xl flex items-start gap-2.5 text-emerald-900 text-xs font-semibold animate-fade-in shadow-2xs">
        <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block text-emerald-950">Status: Aktif (Sedang Berjalan)</span>
          <span>Gelombang ini sedang dibuka dan otomatis menjadi default pendaftaran bagi calon mahasiswa baru.</span>
        </div>
      </div>
    );
  }
  if (status === 'draft') {
    return (
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5 text-slate-700 text-xs font-semibold animate-fade-in shadow-2xs">
        <Info size={16} className="text-slate-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block text-slate-900">Status: Draft (Belum Dipublikasikan)</span>
          <span>Gelombang ini masih dalam tahap perancangan dan belum dapat didaftar oleh calon mahasiswa.</span>
        </div>
      </div>
    );
  }
  if (status === 'ditutup') {
    return (
      <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-900 text-xs font-semibold animate-fade-in shadow-2xs">
        <Clock size={16} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block text-amber-950">Status: Ditutup (Pendaftaran Berakhir)</span>
          <span>Gelombang ini telah ditutup. Calon mahasiswa baru tidak dapat lagi melakukan registrasi di gelombang ini.</span>
        </div>
      </div>
    );
  }
  if (status === 'selesai') {
    return (
      <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl flex items-start gap-2.5 text-indigo-900 text-xs font-semibold animate-fade-in shadow-2xs">
        <Sparkles size={16} className="text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block text-indigo-950">Status: Selesai (Sudah Pengumuman)</span>
          <span>Seluruh proses pendaftaran dan seleksi pada gelombang ini telah selesai dilaksanakan.</span>
        </div>
      </div>
    );
  }
  return null;
}

// ============================================================
// MAIN PAGE COMPONENT (CREATE GELOMBANG SPMB)
// ============================================================
export default function CreateGelombangPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<GelombangFormValues>({
    resolver: zodResolver(gelombangFormSchema) as any,
    defaultValues: {
      nama: '',
      kuota_total: 100,
      status: 'draft',
      biaya_pendaftaran: 0,
      tanggal_buka: '',
      tanggal_tutup: '',
      tanggal_pengumuman: '',
    }
  });

  const selectedMasterBiayaId = watch('master_biaya_id');
  const selectedBiaya = watch('biaya_pendaftaran');
  const selectedStatus = watch('status');
  const tglBuka = watch('tanggal_buka');
  const tglTutup = watch('tanggal_tutup');

  const loadTahunAkademik = useCallback(async (input: string) => {
    try {
      const res = await spmbService.getTahunAkademikList();
      const list = res?.data || [];
      return list
        .filter((t: any) => (t.nama || `${t.tahun_mulai}/${t.tahun_selesai}`).toLowerCase().includes(input.toLowerCase()))
        .map((t: any) => ({
          value: t.id,
          label: t.nama || `${t.tahun_mulai}/${t.tahun_selesai}`,
          ...t
        }));
    } catch {
      return [];
    }
  }, []);

  const loadJalurMasuk = useCallback(async (input: string) => {
    try {
      const res = await spmbService.getJalurMasuk();
      const list = res?.data || [];
      return list
        .filter((j: any) => j.is_active && (j.nama || '').toLowerCase().includes(input.toLowerCase()))
        .map((j: any) => ({
          value: j.id,
          label: j.nama,
          ...j
        }));
    } catch {
      return [];
    }
  }, []);

  const loadMasterBiaya = useCallback(async (input: string) => {
    try {
      const response = await api.get('/v1/sikeu/master/master-biaya?module_code=spmb');
      const list = response.data?.data || [];
      return list
        .filter((item: any) => 
          (item.nama || '').toLowerCase().includes(input.toLowerCase()) || 
          (item.kode || '').toLowerCase().includes(input.toLowerCase())
        )
        .map((item: any) => ({
          value: item.id,
          label: `[${item.kode}] ${item.nama} (Rp ${Number(item.nominal_standar || 0).toLocaleString('id-ID')})`,
          ...item
        }));
    } catch {
      return [];
    }
  }, []);

  const onSubmit = async (data: Partial<GelombangPenerimaan>) => {
    if (data.tanggal_buka && data.tanggal_tutup && new Date(data.tanggal_tutup) < new Date(data.tanggal_buka)) {
      toast.error('Tanggal tutup pendaftaran harus setelah tanggal buka');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...data,
        jalur_masuk_id: Number(data.jalur_masuk_id),
        tahun_akademik_id: Number(data.tahun_akademik_id),
        master_biaya_id: data.master_biaya_id ? Number(data.master_biaya_id) : undefined,
        biaya_pendaftaran: data.biaya_pendaftaran !== undefined ? Number(data.biaya_pendaftaran) : undefined,
      };
      await spmbService.createGelombang(payload as any);
      toast.success('Gelombang penerimaan baru berhasil ditambahkan');
      router.push('/spmb/master/gelombang');
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan data gelombang');
    } finally {
      setLoading(false);
    }
  };

  const isDateInvalid = Boolean(tglBuka && tglTutup && new Date(tglTutup) < new Date(tglBuka));

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-28 md:pb-12 animate-fade-in">
      
      {/* 1. PAGE HEADER */}
      <PageHeader 
        title="Tambah Gelombang"
        description="Buat periode gelombang pendaftaran SPMB baru beserta biaya dan jadwalnya."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/spmb/master/gelombang')} 
            icon={<ArrowLeft size={16} />}
            className="font-bold text-xs px-4 py-2"
          >
            Kembali
          </Button>
        }
      />

      {/* 2. FORM CONTAINER (SINGLE CLEAN PRIMARY SURFACE) */}
      <div className="card p-5 sm:p-7 md:p-8 bg-white border border-slate-200/90 shadow-2xs rounded-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          {/* SECTION I: INFORMASI UMUM */}
          <div className="space-y-5">
            <SectionHeader 
              title="Informasi Umum"
              description="Atur nama, tahun akademik, jalur masuk, kuota pendaftar, biaya, dan status keaktifan gelombang."
              icon={Layers}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 pt-1">
              
              {/* Tahun Akademik (Dynamic from DB) */}
              <Controller
                name="tahun_akademik_id"
                control={control}
                render={({ field }) => (
                  <AsyncSelect
                    label="Tahun Akademik *"
                    placeholder="Pilih atau cari Tahun Akademik..."
                    loadOptions={loadTahunAkademik}
                    defaultOptions
                    value={field.value}
                    onChange={(opt: any) => field.onChange(opt ? Number(opt.value) : undefined)}
                    error={errors.tahun_akademik_id?.message}
                    hint="Tahun akademik penerimaan mahasiswa."
                  />
                )}
              />

              {/* Jalur Masuk */}
              <Controller
                name="jalur_masuk_id"
                control={control}
                render={({ field }) => (
                  <AsyncSelect
                    label="Jalur Masuk *"
                    placeholder="Pilih atau cari Jalur Masuk..."
                    loadOptions={loadJalurMasuk}
                    defaultOptions
                    value={field.value}
                    onChange={(opt: any) => field.onChange(opt ? Number(opt.value) : undefined)}
                    error={errors.jalur_masuk_id?.message}
                    hint="Jalur penerimaan yang dinaungi gelombang ini."
                  />
                )}
              />

              {/* Nama Gelombang */}
              <Input 
                label="Nama Gelombang *"
                placeholder="Contoh: Gelombang 1 - Prestasi"
                required
                error={errors.nama?.message}
                {...register('nama')} 
              />

              {/* Kuota Pendaftar */}
              <Input 
                type="number"
                label="Kuota Pendaftar *"
                placeholder="100"
                required
                hint="Jumlah maksimal pendaftar pada gelombang ini."
                error={errors.kuota_total?.message}
                {...register('kuota_total', { valueAsNumber: true })} 
              />

              {/* Select Tarif Keuangan SIKEU (Mapping Master Tarif SIKEU) */}
              <div className="space-y-2">
                <Controller
                  name="master_biaya_id"
                  control={control}
                  render={({ field }) => (
                    <AsyncSelect
                      label="Tarif Biaya Pendaftaran (Mapping SIKEU) *"
                      placeholder="Pilih atau cari Master Tarif Keuangan SIKEU..."
                      loadOptions={loadMasterBiaya}
                      defaultOptions
                      value={field.value}
                      onChange={(opt: any) => {
                        const id = opt ? Number(opt.value) : undefined;
                        field.onChange(id);
                        if (opt) {
                          const nominal = Number(opt.nominal_standar ?? opt.nominal ?? 0);
                          setValue('biaya_pendaftaran', nominal);
                        }
                      }}
                      error={errors.master_biaya_id?.message}
                      hint="Pilih opsi tarif yang berasal dari Master Tarif Modul Keuangan SIKEU."
                    />
                  )}
                />
                {selectedBiaya !== undefined && selectedBiaya !== null && selectedBiaya !== 0 && !isNaN(Number(selectedBiaya)) && (
                  <div className="p-3 bg-emerald-50/90 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <DollarSign size={16} className="text-emerald-600 shrink-0" />
                      <span className="text-xs font-black text-slate-900">
                        Nominal Terpilih: Rp {new Intl.NumberFormat('id-ID').format(Number(selectedBiaya))}
                      </span>
                    </div>
                    <Badge variant="green" className="text-2xs font-extrabold px-2.5 py-0.5 shrink-0">
                      🟢 Ter-mapping SIKEU
                    </Badge>
                  </div>
                )}
              </div>

              {/* Status Gelombang (Prominent Full Width Selector) */}
              <div className="md:col-span-2 space-y-3 pt-2">
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Status Gelombang *"
                      options={[
                        { value: 'draft', label: 'Draft (Belum Dipublikasikan)' },
                        { value: 'aktif', label: 'Aktif (Sedang Berjalan / Dibuka)' },
                        { value: 'ditutup', label: 'Ditutup (Pendaftaran Berakhir)' },
                        { value: 'selesai', label: 'Selesai (Sudah Pengumuman)' }
                      ]}
                      value={field.value}
                      onChange={field.onChange}
                      hint="Status menentukan keaktifan gelombang pada portal pendaftaran calon mahasiswa."
                      error={errors.status?.message}
                    />
                  )}
                />

                {/* Status Helper Alert */}
                <StatusAlert status={selectedStatus} />
              </div>

            </div>
          </div>

          <div className="space-y-5 pt-2">
            <SectionHeader 
              title="Jadwal Pelaksanaan"
              description="Tentukan rentang tanggal buka/tutup pendaftaran dan pengumuman."
              icon={Calendar}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 pt-1">
              
              <Input 
                type="date"
                label="Tanggal Buka Pendaftaran *"
                required
                error={errors.tanggal_buka?.message}
                {...register('tanggal_buka')} 
              />

              <div className="space-y-1">
                <Input 
                  type="date"
                  label="Tanggal Tutup Pendaftaran *"
                  required
                  error={errors.tanggal_tutup?.message}
                  {...register('tanggal_tutup')} 
                />
                {isDateInvalid && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800 text-xs font-bold animate-fade-in mt-1">
                    <AlertCircle size={14} className="text-red-600 shrink-0" />
                    <span>⚠ Tanggal tutup pendaftaran harus setelah tanggal buka.</span>
                  </div>
                )}
              </div>

              <Input 
                type="date"
                label="Tanggal Pengumuman (Opsional)"
                hint="Jadwal pengumuman kelulusan peserta."
                error={errors.tanggal_pengumuman?.message}
                {...register('tanggal_pengumuman')} 
              />

            </div>
          </div>

          {/* Hidden Academic Year Field */}
          <input type="hidden" {...register('tahun_akademik_id')} value={1} />

          {/* SECTION III: ACTION AREA (DESKTOP INLINE / MOBILE STICKY BOTTOM) */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push('/spmb/master/gelombang')}
              disabled={loading}
              className="w-full sm:w-auto font-bold text-slate-600 hover:bg-slate-100 min-h-[44px]"
            >
              Batal
            </Button>
            
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              disabled={loading || isDateInvalid}
              icon={<Save size={18} />}
              className="w-full sm:w-auto font-black shadow-md min-h-[46px] px-6 text-sm"
            >
              {loading ? 'Menyimpan Gelombang...' : 'Simpan Gelombang'}
            </Button>
          </div>

        </form>
      </div>

    </div>
  );
}

