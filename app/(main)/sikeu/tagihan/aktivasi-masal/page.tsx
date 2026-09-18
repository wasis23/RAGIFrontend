'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Save,
  CreditCard,
  Loader2,
  Calendar,
  GraduationCap,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { sikeuService } from '@/services/sikeu.service';
import { formatRupiah } from '@/lib/utils';

interface MassFormValues {
  target_angkatan: string;
  target_jalur: string;
  target_prodi?: string;
  target_semester: string;
  semester_aktif: string;
  jatuh_tempo: string;
}

export default function AktivasiTagihanMasalPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [prodiList, setProdiList] = useState<{ value: string; label: string }[]>([]);
  const [jalurList, setJalurList] = useState<{ value: string; label: string }[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Fee Component preview state
  const [matchedFeeComponents, setMatchedFeeComponents] = useState<any[]>([]);
  const [selectedFeeIds, setSelectedFeeIds] = useState<number[]>([]);
  const [loadingFeeComponents, setLoadingFeeComponents] = useState(false);

  const defaultJatuhTempo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MassFormValues>({
    defaultValues: {
      target_angkatan: '2023',
      target_jalur: '',
      target_prodi: '',
      target_semester: '1',
      semester_aktif: 'Semester 1 (Ganjil) 2026/2027',
      jatuh_tempo: defaultJatuhTempo,
    },
  });

  const watchAngkatan = watch('target_angkatan');
  const watchJalur = watch('target_jalur');
  const watchProdi = watch('target_prodi');
  const watchSemester = watch('target_semester');

  // Load dynamic Jalur Kelas and Program Studi from Database
  useEffect(() => {
    const loadDynamicOptions = async () => {
      setLoadingOptions(true);
      try {
        const [resJalur, resProdi] = await Promise.all([
          sikeuService.getJalurKelasList(),
          sikeuService.getProgramStudiList(),
        ]);

        if (Array.isArray(resJalur?.data)) {
          const jalurs = resJalur.data.map((j: any) => ({
            value: j.nama_jalur || j.kode,
            label: j.nama_jalur || j.kode,
          }));
          setJalurList(jalurs);
          if (jalurs.length > 0 && !watch('target_jalur')) {
            setValue('target_jalur', jalurs[0].value);
          }
        }

        if (Array.isArray(resProdi?.data)) {
          setProdiList(
            resProdi.data.map((p: any) => ({
              value: String(p.id),
              label: `${p.jenjang ? p.jenjang + ' ' : ''}${p.nama}`,
            }))
          );
        }
      } catch (err) {
        console.error('Failed to load master options', err);
        toast.error('Gagal memuat master opsi jalur kelas / prodi');
      } finally {
        setLoadingOptions(false);
      }
    };
    loadDynamicOptions();
  }, [setValue, watch]);

  // Synchronize semester label on change
  useEffect(() => {
    const semNum = parseInt(watchSemester) || 1;
    const isGanjil = semNum % 2 !== 0;
    const tipeSem = isGanjil ? 'Ganjil' : 'Genap';
    setValue('semester_aktif', `Semester ${semNum} (${tipeSem}) 2026/2027`);
  }, [watchSemester, setValue]);

  // Fetch matched fee components from Setting Tarif
  useEffect(() => {
    if (!watchAngkatan || !watchJalur) return;
    let isMounted = true;
    const fetchComponents = async () => {
      setLoadingFeeComponents(true);
      try {
        const res = await sikeuService.getSettingTarifList({
          tahun_angkatan: parseInt(watchAngkatan),
          jalur_kelas: watchJalur,
          semester: parseInt(watchSemester),
          program_studi_id: watchProdi ? parseInt(watchProdi) : undefined,
          is_active: true,
          include_global: true,
        });

        if (isMounted && res.data) {
          setMatchedFeeComponents(res.data);
          const compIds = res.data.map((item: any) => item.master_biaya_id || item.id);
          setSelectedFeeIds(compIds);
        }
      } catch (err) {
        console.error('Failed to fetch fee components', err);
      } finally {
        if (isMounted) setLoadingFeeComponents(false);
      }
    };
    fetchComponents();
    return () => {
      isMounted = false;
    };
  }, [watchAngkatan, watchJalur, watchSemester, watchProdi]);

  const toggleFeeComponent = (compId: number) => {
    setSelectedFeeIds((prev) =>
      prev.includes(compId) ? prev.filter((id) => id !== compId) : [...prev, compId]
    );
  };

  const previewTotalNominal = useMemo(() => {
    return matchedFeeComponents
      .filter((comp) => selectedFeeIds.includes(comp.master_biaya_id || comp.id))
      .reduce((sum, comp) => sum + (parseFloat(comp.nominal) || 0), 0);
  }, [matchedFeeComponents, selectedFeeIds]);

  const onSubmitMassTagihan = async (formData: MassFormValues) => {
    if (selectedFeeIds.length === 0) {
      toast.error('Pilih minimal satu komponen tarif biaya semester!');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        tahun_angkatan: parseInt(formData.target_angkatan),
        jalur_kelas: formData.target_jalur,
        program_studi_id: formData.target_prodi ? parseInt(formData.target_prodi) : undefined,
        semester: parseInt(formData.target_semester),
        semester_label: formData.semester_aktif,
        jatuh_tempo: formData.jatuh_tempo,
        master_biaya_ids: selectedFeeIds,
      };

      const res = await sikeuService.generateMassTagihan(payload);
      toast.success(res.message || 'Tagihan masal semester aktif berhasil digenerate');
      router.push('/sikeu/tagihan');
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || err.message || 'Gagal generate tagihan semester masal');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6 animate-fade-in pb-12">
      <PageHeader
        title="Aktivasi Tagihan Semester Masal"
        description="Terbitkan tagihan semesteran baru secara serentak untuk seluruh mahasiswa aktif berdasarkan angkatan, jalur kelas, dan prodi."
        action={
          <Link href="/sikeu/tagihan">
            <Button variant="outline" icon={<ArrowLeft size={16} />} className="font-bold min-h-[40px]">
              Kembali ke Daftar Tagihan
            </Button>
          </Link>
        }
      />

      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs">
        <form onSubmit={handleSubmit(onSubmitMassTagihan)} className="space-y-6">
          {/* Target Mahasiswa Grid */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <GraduationCap size={16} className="text-primary-600" />
              1. Kriteria Target Mahasiswa
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Target Angkatan *"
                options={[
                  { value: '2023', label: 'Angkatan 2023' },
                  { value: '2024', label: 'Angkatan 2024' },
                  { value: '2025', label: 'Angkatan 2025' },
                  { value: '2026', label: 'Angkatan 2026' },
                ]}
                value={watch('target_angkatan')}
                onChange={(val) => setValue('target_angkatan', val as string)}
              />

              <Select
                label="Jalur Kelas (Database) *"
                options={jalurList}
                value={watch('target_jalur')}
                onChange={(val) => setValue('target_jalur', val as string)}
                disabled={loadingOptions}
              />

              <Select
                label="Semester Perkuliahan *"
                options={Array.from({ length: 8 }, (_, i) => ({
                  value: String(i + 1),
                  label: `Semester ${i + 1}`,
                }))}
                value={watch('target_semester')}
                onChange={(val) => setValue('target_semester', val as string)}
              />
            </div>

            <div>
              <Select
                label="Target Program Studi (Opsional)"
                options={[
                  { value: '', label: 'Semua Program Studi (Global Seluruh Kampus)' },
                  ...prodiList,
                ]}
                value={watch('target_prodi') || ''}
                onChange={(val) => setValue('target_prodi', val as string)}
                disabled={loadingOptions}
              />
            </div>
          </div>

          <hr className="border-slate-200/80" />

          {/* Matriks Komponen Biaya */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <CreditCard size={16} className="text-primary-600" />
                  2. Komponen Biaya Semester {watchSemester} (Matriks Tarif Database)
                </h3>
                <p className="text-2xs text-slate-500 mt-0.5">
                  Komponen tarif diambil otomatis dari tabel master setting tarif sesuai angkatan dan jalur kelas.
                </p>
              </div>
              <span className="text-2xs font-extrabold px-3 py-1 bg-primary-100 text-primary-700 rounded-lg shrink-0">
                {selectedFeeIds.length} Komponen Dipilih
              </span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
              {loadingFeeComponents ? (
                <div className="py-8 flex items-center justify-center gap-2 text-slate-400 text-xs font-medium">
                  <Loader2 size={16} className="animate-spin text-primary-600" />
                  <span>Memuat komponen tarif semester dari database...</span>
                </div>
              ) : matchedFeeComponents.length === 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
                  <p className="text-xs font-bold text-amber-900">Belum Ada Setting Tarif untuk Kriteria Ini</p>
                  <p className="text-2xs text-amber-700 mt-1">
                    Silakan tambahkan komponen biaya Semester {watchSemester} di menu{' '}
                    <Link href="/sikeu/mahasiswa/tarif" className="underline font-bold">
                      Pengaturan Tarif
                    </Link>{' '}
                    terlebih dahulu.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto divide-y divide-slate-200/60 pr-1">
                  {matchedFeeComponents.map((comp: any) => {
                    const compId = comp.master_biaya_id || comp.id;
                    const isChecked = selectedFeeIds.includes(compId);
                    const namaBiaya = comp.master_biaya?.nama || comp.keterangan || 'Biaya Pendidikan';
                    const nominal = parseFloat(comp.nominal) || 0;

                    return (
                      <label
                        key={comp.id}
                        className={`flex items-center justify-between p-3 rounded-xl transition cursor-pointer ${
                          isChecked
                            ? 'bg-white shadow-2xs border border-primary-200'
                            : 'hover:bg-slate-100/70 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleFeeComponent(compId)}
                            className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4 cursor-pointer"
                          />
                          <div>
                            <p className="text-xs font-bold text-slate-900">{namaBiaya}</p>
                            <p className="text-2xs text-slate-500">
                              {comp.keterangan || 'Komponen semester aktif'}
                            </p>
                          </div>
                        </div>
                        <span className="font-mono text-xs font-extrabold text-slate-900">
                          {formatRupiah(nominal)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {matchedFeeComponents.length > 0 && (
                <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Total Nominal per Mahasiswa (sebelum beasiswa):</span>
                  <span className="font-mono font-extrabold text-primary-700 text-sm">
                    {formatRupiah(previewTotalNominal)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <hr className="border-slate-200/80" />

          {/* Invoice & Due Date Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Calendar size={16} className="text-primary-600" />
              3. Keterangan Invoice & Batas Waktu Pembayaran
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Label Semester di Invoice *"
                placeholder="Contoh: Semester Ganjil 2026/2027"
                {...register('semester_aktif', { required: 'Label semester wajib diisi' })}
                error={errors.semester_aktif?.message}
              />

              <Input
                type="date"
                label="Batas Jatuh Tempo Pembayaran *"
                {...register('jatuh_tempo', { required: 'Tanggal jatuh tempo wajib diisi' })}
                error={errors.jatuh_tempo?.message}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/80">
            <Link href="/sikeu/tagihan">
              <Button type="button" variant="ghost" disabled={submitting} className="font-bold text-slate-600">
                Batal
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting || matchedFeeComponents.length === 0}
              icon={submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              className="font-bold min-h-[42px] px-6 shadow-md"
            >
              {submitting ? 'Mengaktifkan Tagihan...' : 'Aktifkan Tagihan Masal Sekarang'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
