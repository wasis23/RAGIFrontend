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
  Users,
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
  const [angkatanList, setAngkatanList] = useState<{ value: string; label: string }[]>([]);
  const [activeTaLabel, setActiveTaLabel] = useState<string>('');
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Student Target Preview state
  const [targetStudentPreview, setTargetStudentPreview] = useState<{ total: number; sample: any[] } | null>(null);
  const [loadingStudentPreview, setLoadingStudentPreview] = useState(false);

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
      target_angkatan: '',
      target_jalur: '',
      target_prodi: '',
      target_semester: '1',
      semester_aktif: 'Semester 1 (Ganjil)',
      jatuh_tempo: defaultJatuhTempo,
    },
  });

  const watchAngkatan = watch('target_angkatan');
  const watchJalur = watch('target_jalur');
  const watchProdi = watch('target_prodi');
  const watchSemester = watch('target_semester');

  // Load dynamic Jalur Kelas, Program Studi, Angkatan and Active Academic Year from Database
  useEffect(() => {
    const loadDynamicOptions = async () => {
      setLoadingOptions(true);
      try {
        const [resJalur, resProdi, resAngkatan, resTa] = await Promise.all([
          sikeuService.getJalurKelasList(),
          sikeuService.getProgramStudiList(),
          sikeuService.getAngkatanList().catch(() => ({ data: [] })),
          sikeuService.getActiveTahunAkademik().catch(() => ({ data: null })),
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

        if (Array.isArray(resAngkatan?.data) && resAngkatan.data.length > 0) {
          const angkatans = resAngkatan.data.map((a: number) => ({
            value: String(a),
            label: `Angkatan ${a}`,
          }));
          setAngkatanList(angkatans);
          if (!watch('target_angkatan')) {
            setValue('target_angkatan', angkatans[0].value);
          }
        } else {
          const currYear = String(new Date().getFullYear());
          setAngkatanList([{ value: currYear, label: `Angkatan ${currYear}` }]);
          if (!watch('target_angkatan')) {
            setValue('target_angkatan', currYear);
          }
        }

        const taName = resTa?.data?.nama || resTa?.data?.tahun_akademik || '';
        if (taName) {
          setActiveTaLabel(taName);
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
    const taStr = activeTaLabel ? ` ${activeTaLabel}` : '';
    setValue('semester_aktif', `Semester ${semNum} (${tipeSem})${taStr}`);
  }, [watchSemester, activeTaLabel, setValue]);

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

  // Fetch estimated target students
  useEffect(() => {
    if (!watchAngkatan || !watchJalur) return;
    let isMounted = true;
    const fetchTargetStudents = async () => {
      setLoadingStudentPreview(true);
      try {
        const res = await sikeuService.previewMassTarget({
          tahun_angkatan: parseInt(watchAngkatan),
          jalur_kelas: watchJalur,
          program_studi_id: watchProdi ? parseInt(watchProdi) : undefined,
        });
        if (isMounted && res.data) {
          setTargetStudentPreview({
            total: res.data.total_mahasiswa,
            sample: res.data.sample_mahasiswa || [],
          });
        }
      } catch (err) {
        if (isMounted) setTargetStudentPreview(null);
      } finally {
        if (isMounted) setLoadingStudentPreview(false);
      }
    };
    fetchTargetStudents();
    return () => {
      isMounted = false;
    };
  }, [watchAngkatan, watchJalur, watchProdi]);

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
                options={angkatanList.length > 0 ? angkatanList : [
                  { value: String(new Date().getFullYear()), label: `Angkatan ${new Date().getFullYear()}` }
                ]}
                value={watch('target_angkatan')}
                onChange={(val) => setValue('target_angkatan', val as string)}
                disabled={loadingOptions}
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

            {/* Target Student Preview Info */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-primary-600 shrink-0" />
                <span className="text-slate-600 font-medium">Estimasi Mahasiswa Terdampak:</span>
                {loadingStudentPreview ? (
                  <span className="flex items-center gap-1 text-slate-400 font-mono">
                    <Loader2 size={12} className="animate-spin" /> Menghitung...
                  </span>
                ) : targetStudentPreview ? (
                  <span className="font-bold text-slate-900 font-mono">
                    {targetStudentPreview.total} Mahasiswa Aktif
                  </span>
                ) : (
                  <span className="text-slate-400 font-mono">-</span>
                )}
              </div>
              {targetStudentPreview && targetStudentPreview.sample.length > 0 && (
                <span className="text-2xs text-slate-500 italic">
                  Contoh: {targetStudentPreview.sample.map((s: any) => s.nama_mahasiswa).slice(0, 3).join(', ')}{targetStudentPreview.total > 3 ? '...' : ''}
                </span>
              )}
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
