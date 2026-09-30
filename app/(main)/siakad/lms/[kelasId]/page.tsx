'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { lmsService } from '@/services/lms.service';
import { referensiService, MasterReferensiItem } from '@/services/referensi.service';
import { LmsKelasOverview, LmsPertemuanItem } from '@/types/lms.types';
import { PaginationMeta } from '@/types/api.types';
import {
  Calendar,
  FileText,
  Clock,
  AlertCircle,
  Settings,
  ChevronRight,
  TrendingUp,
  Award,
  ShieldCheck,
  QrCode,
  BookOpen,
  Save,
  ArrowLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

// Zod Validation Schema di luar komponen sesuai Aturan Form Validation Reviewer
const settingSchema = z.object({
  total_pertemuan: z.coerce.number().min(1, 'Total pertemuan minimal 1 sesi').max(32, 'Maksimal 32 pertemuan'),
  batas_min_hadir_persen: z.coerce.number().min(0, 'Minimal 0%').max(100, 'Maksimal 100%'),
  metode_absensi: z.string().min(1, 'Metode absensi wajib dipilih'),
  can_submit_late: z.boolean(),
  show_nilai_to_mahasiswa: z.boolean(),
});

type SettingFormValues = z.infer<typeof settingSchema>;

interface PageProps {
  params: Promise<{
    kelasId: string;
  }>;
}

export default function LmsKelasDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const kelasId = Number(resolvedParams.kelasId);
  const router = useRouter();
  const { hasRole } = useAuth();
  const isMahasiswa = hasRole('mahasiswa');

  // State
  const [activeTab, setActiveTab] = useState<'pertemuan' | 'rekap' | 'setting'>('pertemuan');
  const [overview, setOverview] = useState<LmsKelasOverview | null>(null);
  const [rekapData, setRekapData] = useState<any | null>(null);
  const [rekapMeta, setRekapMeta] = useState<PaginationMeta>({
    current_page: 1,
    last_page: 1,
    per_page: 50,
    total: 0,
  });
  // Inisialisasi kosong murni dari API (Zero Hardcode Standard)
  const [metodeAbsensiOptions, setMetodeAbsensiOptions] = useState<Array<{ value: string; label: string }>>([]);

  // React Hook Form dengan Zod Resolver
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SettingFormValues>({
    resolver: zodResolver(settingSchema) as any,
    defaultValues: {
      total_pertemuan: 16,
      batas_min_hadir_persen: 75,
      metode_absensi: 'keduanya',
      can_submit_late: true,
      show_nilai_to_mahasiswa: true,
    },
  });

  const fetchMetodeOptions = useCallback(async () => {
    try {
      const res = await referensiService.getPaginated({ modul: 'siakad', per_page: 50 });
      if (res.data) {
        const filtered = res.data
          .filter((r: MasterReferensiItem) => r.tipe === 'metode_absensi_lms')
          .map((r: MasterReferensiItem) => ({ value: r.kode || String(r.id), label: r.nama }));
        if (filtered.length > 0) {
          setMetodeAbsensiOptions(filtered);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchOverview = useCallback(async () => {
    try {
      const res = await lmsService.getKelasOverview(kelasId);
      if (res.status === 'success' && res.data) {
        setOverview(res.data);
        if (res.data.lms_setting) {
          setValue('total_pertemuan', res.data.lms_setting.total_pertemuan || 16);
          setValue('batas_min_hadir_persen', res.data.lms_setting.batas_min_hadir_persen || 75);
          setValue('metode_absensi', res.data.lms_setting.metode_absensi || 'keduanya');
          setValue('can_submit_late', Boolean(res.data.lms_setting.can_submit_late));
          setValue('show_nilai_to_mahasiswa', Boolean(res.data.lms_setting.show_nilai_to_mahasiswa));
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat overview kelas');
    }
  }, [kelasId, setValue]);

  const fetchRekap = useCallback(async () => {
    try {
      const res = await lmsService.getRekapAbsensi(kelasId);
      if (res.status === 'success' && res.data) {
        setRekapData(res.data);
        setRekapMeta({
          current_page: 1,
          last_page: 1,
          per_page: res.data.rekapitulasi?.length || 50,
          total: res.data.rekapitulasi?.length || 0,
        });
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat rekap absensi');
    }
  }, [kelasId]);

  useEffect(() => {
    fetchOverview();
    fetchMetodeOptions();
  }, [fetchOverview, fetchMetodeOptions]);

  useEffect(() => {
    if (activeTab === 'rekap') {
      fetchRekap();
    }
  }, [activeTab, fetchRekap]);

  const onSaveSetting = async (values: SettingFormValues) => {
    try {
      const res = await lmsService.updateKelasSetting(kelasId, values as any);
      if (res.status === 'success') {
        toast.success('Pengaturan kelas LMS berhasil disimpan');
        fetchOverview();
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal memperbarui pengaturan');
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'selesai':
        return <Badge variant="green">Selesai</Badge>;
      case 'berlangsung':
        return (
          <Badge style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}>
            Berlangsung
          </Badge>
        );
      default:
        return <Badge variant="gray">Belum Mulai</Badge>;
    }
  };

  // Kolom Rekap Presensi DataTable
  const rekapColumns: ColumnDef<any>[] = [
    {
      key: 'mahasiswa',
      label: 'MAHASISWA',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-800 text-xs block">{row.nama_lengkap}</span>
          <span className="text-2xs text-slate-500 font-mono block">{row.nim}</span>
        </div>
      ),
    },
    {
      key: 'total_hadir',
      label: 'HADIR',
      align: 'center',
      render: (row) => (
        <span className="font-semibold text-emerald-600 text-xs">{row.total_hadir}</span>
      ),
    },
    {
      key: 'total_sakit',
      label: 'SAKIT',
      align: 'center',
      render: (row) => (
        <span className="text-slate-600 text-xs">{row.total_sakit}</span>
      ),
    },
    {
      key: 'total_izin',
      label: 'IZIN',
      align: 'center',
      render: (row) => (
        <span className="text-amber-600 text-xs">{row.total_izin}</span>
      ),
    },
    {
      key: 'total_alfa',
      label: 'ALFA',
      align: 'center',
      render: (row) => (
        <span className="text-rose-600 text-xs">{row.total_alfa}</span>
      ),
    },
    {
      key: 'persentase_kehadiran',
      label: '% HADIR',
      align: 'center',
      render: (row) => (
        <span className="font-bold text-slate-800 text-xs">{row.persentase_kehadiran}%</span>
      ),
    },
    {
      key: 'syarat',
      label: 'SYARAT UTS/UAS',
      align: 'center',
      render: (row) => (
        <Badge variant={row.is_memenuhi_syarat ? 'green' : 'red'}>
          {row.is_memenuhi_syarat ? 'Memenuhi' : 'Kurang'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title={overview?.kelas.nama_kelas || 'Detail Kelas LMS'}
        description={`${overview?.kelas.kode_kelas || ''} • ${overview?.kelas.mata_kuliah?.nama || ''} (${overview?.kelas.mata_kuliah?.total_sks || 0} SKS) • Prodi ${overview?.kelas.program_studi?.nama || ''}`}
        breadcrumbs={[
          { label: 'SIAKAD', href: '/siakad/dashboard' },
          { label: 'LMS', href: '/siakad/lms' },
          { label: overview?.kelas.nama_kelas || 'Detail Kelas' },
        ]}
        action={
          <Button
            onClick={() => router.push('/siakad/lms')}
            style={{ background: 'var(--module-primary)' }}
            icon={<ArrowLeft size={16} />}
          >
            Kembali
          </Button>
        }
      />

      {/* Progress Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Progres Perkuliahan</span>
            <TrendingUp size={16} className="text-slate-600" />
          </div>
          <div className="text-xl font-bold text-slate-800">
            {overview?.progress.persentase_selesai || 0}%
          </div>
          <div className="text-2xs text-slate-400">
            {overview?.progress.pertemuan_selesai || 0} dari {overview?.progress.total_pertemuan_terencana || 16} pertemuan tuntas
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Konten Pembelajaran</span>
            <FileText size={16} className="text-slate-600" />
          </div>
          <div className="text-xl font-bold text-slate-800">
            {overview?.statistik.total_materi || 0} Materi
          </div>
          <div className="text-2xs text-slate-400">
            {overview?.statistik.total_tugas || 0} tugas terbit
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Mahasiswa Terdaftar</span>
            <Award size={16} className="text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-slate-800">
            {overview?.statistik.total_mahasiswa_krs || 0} Mahasiswa
          </div>
          <div className="text-2xs text-slate-400">
            Terdaftar resmi via KRS Aktif
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Permohonan Izin Pending</span>
            <AlertCircle size={16} className="text-amber-500" />
          </div>
          <div className="text-xl font-bold text-slate-800">
            {overview?.statistik.total_izin_pending || 0} Surat
          </div>
          <div className="text-2xs text-slate-400">
            Menunggu persetujuan dosen
          </div>
        </div>
      </div>

      {/* Tab Menu Underline Standard */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
        <Button
          type="button"
          variant="tab"
          onClick={() => setActiveTab('pertemuan')}
          className={`flex items-center gap-2 p-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'pertemuan'
              ? 'border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle,#f8fafc)]'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Calendar size={16} />
          <span>Daftar 16 Pertemuan</span>
        </Button>

        <Button
          type="button"
          variant="tab"
          onClick={() => setActiveTab('rekap')}
          className={`flex items-center gap-2 p-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'rekap'
              ? 'border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle,#f8fafc)]'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck size={16} />
          <span>Rekapitulasi Presensi</span>
        </Button>

        {!isMahasiswa && (
          <Button
            type="button"
            variant="tab"
            onClick={() => setActiveTab('setting')}
            className={`flex items-center gap-2 p-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'setting'
                ? 'border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle,#f8fafc)]'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Settings size={16} />
            <span>Pengaturan Kelas LMS</span>
          </Button>
        )}
      </div>

      {/* Tab Content: Pertemuan List */}
      {activeTab === 'pertemuan' && (
        <div className="space-y-4">
          {overview?.pertemuan_list?.map((p: LmsPertemuanItem) => (
            <div
              key={p.id}
              onClick={() => router.push(`/siakad/lms/${kelasId}/pertemuan/${p.id}`)}
              className="p-4 bg-white rounded-xl border border-slate-200/80 hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-800 font-bold text-sm flex items-center justify-center shrink-0 border border-slate-200">
                  P{p.pertemuan_ke}
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-bold text-slate-900">
                      {p.materi || `Sesi Pertemuan Ke-${p.pertemuan_ke}`}
                    </h4>
                    {getStatusBadge(p.status_pertemuan)}
                    {p.is_token_active && (
                      <span className="inline-flex items-center gap-2 text-2xs font-semibold bg-emerald-50 text-emerald-700 p-2 rounded-full border border-emerald-200">
                        <QrCode size={16} /> Token Aktif: {p.token_absensi}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-2xs text-slate-500 flex-wrap">
                    <span className="flex items-center gap-2">
                      <Calendar size={16} /> {p.tanggal}
                    </span>
                    {p.jam_mulai && (
                      <span className="flex items-center gap-2">
                        <Clock size={16} /> {p.jam_mulai} - {p.jam_selesai || 'Selesai'}
                      </span>
                    )}
                    <span className="flex items-center gap-2 text-slate-700 font-medium">
                      <BookOpen size={16} /> {p.materi_list_count || 0} Materi
                    </span>
                    <span className="flex items-center gap-2 text-amber-700 font-medium">
                      <FileText size={16} /> {p.tugas_list_count || 0} Tugas
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center">
                <Button size="sm" variant="outline" className="text-xs" icon={<ChevronRight size={16} />}>
                  Buka Sesi
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab Content: Rekap Absensi dengan Mandatory DataTable */}
      {activeTab === 'rekap' && (
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs">
            <h3 className="text-xs font-bold text-slate-800">
              {isMahasiswa ? 'Rekapitulasi Kehadiran Saya' : 'Rekapitulasi Kehadiran Mahasiswa'}
            </h3>
            <p className="text-2xs text-slate-500">
              Batas minimal kehadiran: {rekapData?.batas_min_hadir_persen || 75}% ({Math.ceil(((rekapData?.batas_min_hadir_persen || 75) / 100) * (rekapData?.total_pertemuan || 16))} dari {rekapData?.total_pertemuan || 16} sesi)
            </p>
          </div>

          <DataTable
            columns={rekapColumns}
            data={rekapData?.rekapitulasi || []}
            meta={rekapMeta}
            onPageChange={(page) => {
              setRekapMeta((prev) => ({ ...prev, current_page: page }));
              fetchRekap();
            }}
            onLimitChange={(limit) => {
              setRekapMeta((prev) => ({ ...prev, per_page: limit, current_page: 1 }));
              fetchRekap();
            }}
            emptyMessage="Belum ada data rekapitulasi kehadiran mahasiswa."
          />
        </div>
      )}

      {/* Tab Content: Setting Kelas dengan Zod Validation & react-hook-form */}
      {activeTab === 'setting' && (
        <form onSubmit={handleSubmit(onSaveSetting)} className="p-6 bg-white rounded-xl border border-slate-200/80 shadow-xs max-w-2xl space-y-4">
          <h3 className="text-xs font-bold text-slate-800">
            Konfigurasi Pembelajaran Kelas LMS
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="number"
              label="Total Sesi Pertemuan"
              error={errors.total_pertemuan?.message}
              {...register('total_pertemuan')}
            />

            <Input
              type="number"
              label="Batas Minimal Kehadiran (%)"
              error={errors.batas_min_hadir_persen?.message}
              {...register('batas_min_hadir_persen')}
            />
          </div>

          <Controller
            name="metode_absensi"
            control={control}
            render={({ field }) => (
              <Select
                label="Metode Presensi Diperbolehkan"
                placeholder={metodeAbsensiOptions.length === 0 ? 'Memuat opsi...' : 'Pilih metode presensi...'}
                options={metodeAbsensiOptions}
                value={field.value}
                onChange={field.onChange}
                error={errors.metode_absensi?.message}
              />
            )}
          />

          <hr className="border-t border-slate-100 my-4" />

          <div className="space-y-4">
            <Controller
              name="can_submit_late"
              control={control}
              render={({ field }) => (
                <ToggleSwitch
                  id="can_submit_late"
                  checked={field.value}
                  onChange={field.onChange}
                  label="Izinkan Pengumpulan Tugas Terlambat"
                  description="Mahasiswa tetap dapat mengunggah tugas setelah deadline dengan label terlambat"
                />
              )}
            />

            <Controller
              name="show_nilai_to_mahasiswa"
              control={control}
              render={({ field }) => (
                <ToggleSwitch
                  id="show_nilai_to_mahasiswa"
                  checked={field.value}
                  onChange={field.onChange}
                  label="Tampilkan Nilai Tugas ke Mahasiswa"
                  description="Mahasiswa dapat langsung melihat nilai dan catatan feedback dosen di LMS"
                />
              )}
            />
          </div>

          <hr className="border-t border-slate-100 my-4" />

          <div className="flex justify-end">
            <Button
              type="submit"
              loading={isSubmitting}
              disabled={isSubmitting}
              icon={<Save size={16} />}
            >
              Simpan Pengaturan
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
