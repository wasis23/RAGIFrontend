'use client';

import { useState, useEffect, use } from 'react';
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
import toast from 'react-hot-toast';
import { spmbService } from '@/services/spmb.service';
import { moduleService } from '@/services/module.service';
import { GelombangPenerimaan, JalurMasuk } from '@/types/spmb.types';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/layout/PageHeader';

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
// MAIN PAGE COMPONENT (EDIT GELOMBANG SPMB)
// ============================================================
export default function EditGelombangPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const id = Number(resolvedParams.id);
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [jalurList, setJalurList] = useState<JalurMasuk[]>([]);
  const [tahunAkademikOptions, setTahunAkademikOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [sikeuTarifOptions, setSikeuTarifOptions] = useState<Array<{ value: string; label: string }>>([]);

  const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm<Partial<GelombangPenerimaan>>({
    defaultValues: {
      kuota_total: 100,
      status: 'draft',
    }
  });

  const selectedBiaya = watch('biaya_pendaftaran');
  const selectedStatus = watch('status');
  const tglBuka = watch('tanggal_buka');
  const tglTutup = watch('tanggal_tutup');

  // Load Jalur Masuk, Tahun Akademik & SIKEU Master Tariffs dynamically from API
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [jalurRes, modules, tahunRes] = await Promise.all([
          spmbService.getJalurMasuk(),
          moduleService.getAllModules().catch(() => []),
          spmbService.getTahunAkademikList().catch(() => null),
        ]);

        setJalurList(jalurRes.data.filter((j: any) => j.is_active));

        const rawTahunList = tahunRes?.data || [];
        if (Array.isArray(rawTahunList) && rawTahunList.length > 0) {
          const mappedTahun = rawTahunList.map((t: any) => ({
            value: t.id.toString(),
            label: t.nama || `${t.tahun_mulai}/${t.tahun_selesai}`
          }));
          setTahunAkademikOptions(mappedTahun);
        }

        // Find SPMB module dynamically from DB modules list by code
        const spmbModule = (modules || []).find((m: any) => m.code.toLowerCase() === 'spmb');
        const sikeuRes = await spmbService.getSikeuTarifList(spmbModule?.id).catch(() => null);

        const rawTarifList = sikeuRes?.data || [];
        if (Array.isArray(rawTarifList) && rawTarifList.length > 0) {
          const mapped = rawTarifList.map((t: any) => {
            const nominal = Number(t.nominal_standar ?? t.nominal ?? t.nominal_tarif ?? 0);
            const kode = t.kode || t.jenis_biaya?.kode || 'SIKEU';
            const nama = t.nama || t.jenis_biaya?.nama || 'Biaya Pendaftaran SPMB';
            return {
              value: Math.round(nominal).toString(),
              label: `[${kode}] ${nama} (Rp ${new Intl.NumberFormat('id-ID').format(nominal)})`
            };
          });
          setSikeuTarifOptions(mapped);
        } else {
          setSikeuTarifOptions([
            { value: '250000', label: '[SPMB_ADM] Biaya Pendaftaran SPMB (Rp 250.000)' },
            { value: '3500000', label: '[UKT_REG] Uang Kuliah Tunggal (UKT) Reguler (Rp 3.500.000)' },
          ]);
        }
      } catch (error) {
        console.error('Failed to load master data', error);
      }
    };
    fetchMasterData();
  }, []);

  // Load Existing Gelombang Detail
  useEffect(() => {
    if (!id) return;
    
    const fetchDetail = async () => {
      try {
        setFetching(true);
        const res = await spmbService.getGelombangById(id);
        const row = res.data;
        const rowNominal = Math.round(Number(row.biaya_pendaftaran || 0));
        
        // Dynamically append existing nominal to options if not present
        setSikeuTarifOptions((prev) => {
          const exists = prev.some((o) => Math.round(Number(o.value)) === rowNominal);
          if (!exists && rowNominal > 0) {
            return [
              ...prev,
              { value: rowNominal.toString(), label: `Master Tarif SIKEU (Rp ${new Intl.NumberFormat('id-ID').format(rowNominal)})` }
            ];
          }
          return prev;
        });

        reset({
          nama: row.nama,
          jalur_masuk_id: row.jalur_masuk_id,
          tahun_akademik_id: row.tahun_akademik_id,
          kuota_total: row.kuota_total,
          biaya_pendaftaran: rowNominal,
          status: row.status,
          tanggal_buka: row.tanggal_buka ? new Date(row.tanggal_buka).toISOString().split('T')[0] : '',
          tanggal_tutup: row.tanggal_tutup ? new Date(row.tanggal_tutup).toISOString().split('T')[0] : '',
          tanggal_ujian: row.tanggal_ujian ? new Date(row.tanggal_ujian).toISOString().split('T')[0] : '',
          tanggal_pengumuman: row.tanggal_pengumuman ? new Date(row.tanggal_pengumuman).toISOString().split('T')[0] : '',
        });
      } catch (error: any) {
        toast.error('Gagal memuat data gelombang');
        router.push('/spmb/master/gelombang');
      } finally {
        setFetching(false);
      }
    };
    
    fetchDetail();
  }, [id, reset, router]);

  // Submit Handler
  const onSubmit = async (data: Partial<GelombangPenerimaan>) => {
    // Client-side date comparison check
    if (data.tanggal_buka && data.tanggal_tutup && new Date(data.tanggal_tutup) < new Date(data.tanggal_buka)) {
      toast.error('Tanggal tutup pendaftaran harus setelah tanggal buka');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...data,
        biaya_pendaftaran: data.biaya_pendaftaran !== undefined ? Number(data.biaya_pendaftaran) : undefined,
      };
      await spmbService.updateGelombang(id, payload as any);
      toast.success('Konfigurasi Gelombang berhasil diperbarui');
      router.push('/spmb/master/gelombang');
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan data gelombang');
    } finally {
      setLoading(false);
    }
  };

  // Date Relationship Validation Error Check
  const isDateInvalid = Boolean(tglBuka && tglTutup && new Date(tglTutup) < new Date(tglBuka));

  if (fetching) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 py-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-xl w-64"></div>
        <div className="card p-8 bg-white border border-slate-200 rounded-2xl space-y-8">
          <div className="h-6 bg-slate-200 rounded-md w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-12 bg-slate-100 rounded-lg"></div>
            <div className="h-12 bg-slate-100 rounded-lg"></div>
            <div className="h-12 bg-slate-100 rounded-lg"></div>
            <div className="h-12 bg-slate-100 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-28 md:pb-12 animate-fade-in">
      
      {/* 1. PAGE HEADER */}
      <PageHeader 
        title="Edit Gelombang"
        description="Perbarui informasi, biaya, status, dan jadwal gelombang pendaftaran SPMB."
        action={
          <button 
            onClick={() => router.push('/spmb/master/gelombang')} 
            className="btn bg-orange-500 text-white hover:bg-orange-600 border-none shadow-sm font-bold text-xs flex items-center gap-1.5 px-4 py-2 rounded-lg"
          >
            <ArrowLeft size={16} /> Kembali
          </button>
        }
      />

      {/* 2. FORM CONTAINER (SINGLE CLEAN PRIMARY SURFACE) */}
      <div className="card p-5 sm:p-7 md:p-8 bg-white border border-slate-200/90 shadow-2xs rounded-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          {/* SECTION I: INFORMASI UMUM */}
          <div className="space-y-5">
            <SectionHeader 
              title="Informasi Umum"
              description="Atur nama, jalur masuk, kuota pendaftar, biaya, dan status keaktifan gelombang."
              icon={Layers}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 pt-1">
              
              {/* Tahun Akademik (Dynamic from DB) */}
              <Controller
                name="tahun_akademik_id"
                control={control}
                rules={{ required: 'Tahun akademik wajib dipilih' }}
                render={({ field }) => (
                  <Select
                    label="Tahun Akademik *"
                    placeholder="Pilih Tahun Akademik..."
                    options={tahunAkademikOptions}
                    value={field.value?.toString()}
                    onChange={(val) => field.onChange(val ? Number(val) : '')}
                    error={errors.tahun_akademik_id?.message}
                    hint="Tahun akademik penerimaan mahasiswa."
                  />
                )}
              />

              {/* Jalur Masuk */}
              <Controller
                name="jalur_masuk_id"
                control={control}
                rules={{ required: 'Jalur masuk wajib dipilih' }}
                render={({ field }) => (
                  <Select
                    label="Jalur Masuk *"
                    placeholder="Pilih Jalur Masuk..."
                    options={jalurList.map((j) => ({ value: j.id.toString(), label: j.nama }))}
                    value={field.value?.toString()}
                    onChange={(val) => field.onChange(val ? Number(val) : '')}
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
                error={errors.nama ? 'Nama gelombang wajib diisi' : undefined}
                {...register('nama', { required: true })} 
              />

              {/* Kuota Pendaftar */}
              <Input 
                type="number"
                label="Kuota Pendaftar *"
                placeholder="100"
                required
                hint="Jumlah maksimal pendaftar pada gelombang ini."
                error={errors.kuota_total ? 'Kuota pendaftar minimal 1' : undefined}
                {...register('kuota_total', { required: true, min: 1 })} 
              />

              {/* Select Tarif Keuangan SIKEU (Mapping Master Tarif SIKEU) */}
              <div className="space-y-2">
                <Controller
                  name="biaya_pendaftaran"
                  control={control}
                  rules={{ required: 'Tarif SIKEU wajib dipilih' }}
                  render={({ field }) => (
                    <Select
                      label="Tarif Biaya Pendaftaran (Mapping SIKEU) *"
                      placeholder="-- Pilih Master Tarif Keuangan SIKEU --"
                      options={sikeuTarifOptions}
                      value={field.value !== undefined && field.value !== null && field.value !== 0 ? Math.round(Number(field.value)).toString() : ''}
                      onChange={(val) => field.onChange(val ? Number(val) : undefined)}
                      error={errors.biaya_pendaftaran?.message}
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
                  rules={{ required: true }}
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
                    />
                  )}
                />

                {/* Status Helper Alert */}
                <StatusAlert status={selectedStatus} />
              </div>

            </div>
          </div>

          {/* SECTION II: JADWAL PELAKSANAAN */}
          <div className="space-y-5 pt-2">
            <SectionHeader 
              title="Jadwal Pelaksanaan"
              description="Tentukan rentang tanggal buka/tutup pendaftaran, tanggal ujian, dan pengumuman."
              icon={Calendar}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 pt-1">
              
              <Input 
                type="date"
                label="Tanggal Buka Pendaftaran *"
                required
                error={errors.tanggal_buka ? 'Tanggal buka wajib diisi' : undefined}
                {...register('tanggal_buka', { required: true })} 
              />

              <div className="space-y-1">
                <Input 
                  type="date"
                  label="Tanggal Tutup Pendaftaran *"
                  required
                  error={errors.tanggal_tutup ? 'Tanggal tutup wajib diisi' : undefined}
                  {...register('tanggal_tutup', { required: true })} 
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
                label="Tanggal Ujian (Opsional)"
                hint="Jadwal tes seleksi/ujian tulis (jika ada)."
                {...register('tanggal_ujian')} 
              />

              <Input 
                type="date"
                label="Tanggal Pengumuman (Opsional)"
                hint="Jadwal pengumuman kelulusan peserta."
                {...register('tanggal_pengumuman')} 
              />

            </div>
          </div>

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
              {loading ? 'Menyimpan Perubahan...' : 'Simpan Perubahan'}
            </Button>
          </div>

        </form>
      </div>

    </div>
  );
}
