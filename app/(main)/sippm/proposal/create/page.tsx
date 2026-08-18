'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Save,
  FileText,
  Upload,
  UserPlus,
  Trash2,
  CheckCircle2,
  XCircle,
  FlaskConical,
  BookOpen,
  Plus,
  Search,
} from 'lucide-react';
import { sippmService } from '@/services/sippm.service';
import type { PeriodeHibah, SkemaKegiatan, JenisTim } from '@/types/sippm.types';

// Fallback Master Data Dosen (SIMPEG)
const fallbackDosenList = [
  { id: 1, nama_lengkap: 'Prof. Dr. Ir. H. Ahmad Dahlan, M.Kom', nip: '198205152010121001', prodi: 'S1 Teknik Informatika' },
  { id: 2, nama_lengkap: 'Dr. Siti Nurhaliza, S.T., M.T.', nip: '198509182010121002', prodi: 'S1 Sistem Informasi' },
  { id: 3, nama_lengkap: 'Budi Santoso, M.Kom.', nip: '199011222010121003', prodi: 'S1 Desain Komunikasi Visual' },
  { id: 4, nama_lengkap: 'Eka Putri, M.T.', nip: '198807052010121004', prodi: 'S1 Teknik Elektro' },
  { id: 5, nama_lengkap: 'Dr. Eng. Rahmat Hidayat, M.Sc.', nip: '198312092010121005', prodi: 'S1 Manajemen Informatika' },
  { id: 6, nama_lengkap: 'Dr. Rina Wijaya, S.Kom., M.T.', nip: '198404122010121006', prodi: 'D3 Sistem Informasi' },
];

// Fallback Master Data Tendik (SIMPEG)
const fallbackTendikList = [
  { id: 101, nama_lengkap: 'Hendra Gunawan, S.Kom. (Laboran TI)', nip: '199003152015041001', prodi: 'Laboratorium Komputer' },
  { id: 102, nama_lengkap: 'Dewi Lestari, A.Md. (Pranata Komputer)', nip: '199208202016052002', prodi: 'Pusat Komputer & Jaringan' },
  { id: 103, nama_lengkap: 'Rahmat Subagyo, S.T. (Teknisi Laboratorium)', nip: '198811102014021003', prodi: 'Lab Robotika & IoT' },
];

// Fallback Master Data Mahasiswa (SIAKAD)
const fallbackMahasiswaList = [
  { id: 1001, nama_lengkap: 'Aditia Rahmat Kusuma', nim: '202401001', prodi: 'S1 Teknik Informatika' },
  { id: 1002, nama_lengkap: 'Anisa Bella Safitri', nim: '202401002', prodi: 'S1 Sistem Informasi' },
  { id: 1003, nama_lengkap: 'Bayu Ferdiansyah', nim: '202401003', prodi: 'S1 Desain Komunikasi Visual' },
  { id: 1004, nama_lengkap: 'Candra Kusuma Wijaya', nim: '202401004', prodi: 'S1 Teknik Elektro' },
];

// Active Courses for SIAKAD Grade Conversion
const fallbackMataKuliahAktif = [
  { mata_kuliah_id: 101, kode_mk: 'MK-PML-01', nama_mk: 'Metodologi Penelitian & Pengabdian Masyarakat', total_sks: 3, nama_kelas: 'Kelas A' },
  { mata_kuliah_id: 102, kode_mk: 'MK-MBKM-02', nama_mk: 'Proyek Kemanusiaan & Pengabdian Desa', total_sks: 4, nama_kelas: 'Kelas MBKM' },
  { mata_kuliah_id: 103, kode_mk: 'MK-SKR-03', nama_mk: 'Tugas Akhir / Skripsi', total_sks: 6, nama_kelas: 'Kelas Riset' },
  { mata_kuliah_id: 104, kode_mk: 'MK-KKN-04', nama_mk: 'Kuliah Kerja Nyata / Pengabdian Mhs', total_sks: 4, nama_kelas: 'Kelas Tematik' },
];

// Zod Schema for Create Proposal
const proposalSchema = z.object({
  periode_id: z.number().min(1, 'Pilih periode hibah TA'),
  skema_id: z.number().min(1, 'Pilih skema kegiatan'),
  ketua_pegawai_id: z.number().min(1, 'Pilih Ketua Pengusul Dosen'),
  program_studi: z.string().min(2, 'Program studi wajib terisi'),
  judul: z.string().min(10, 'Judul proposal minimal 10 karakter'),
  anggaran_diajukan: z.number().min(1000000, 'Dana diusulkan minimal Rp 1.000.000'),
  target_tkt: z.number().min(1).max(9).default(1),
  abstrak: z.string().min(50, 'Abstrak proposal minimal 50 karakter'),
  anggota: z
    .array(
      z.object({
        jenis_tim: z.enum(['dosen', 'tendik', 'mahasiswa', 'dosen_eksternal', 'eksternal'] as const),
        pegawai_id: z.number().optional(),
        mahasiswa_id: z.number().optional(),
        nama_eksternal: z.string().optional(),
        instansi_eksternal: z.string().optional(),
        nidn_eksternal: z.string().optional(),
        peran_dalam_tim: z.string().optional(),
        tugas_kegiatan: z.string().optional(),
      })
    )
    .optional(),
  mata_kuliah_konversi: z
    .array(
      z.object({
        nama_mk_search: z.string().optional(),
        mata_kuliah_id: z.number().min(1, 'Pilih mata kuliah'),
        keterangan: z.string().optional(),
      })
    )
    .optional(),
});

type ProposalFormValues = z.infer<typeof proposalSchema>;

export default function CreateProposalPage() {
  const router = useRouter();
  const [periodeList, setPeriodeList] = useState<PeriodeHibah[]>([]);
  const [skemaList, setSkemaList] = useState<SkemaKegiatan[]>([]);
  const [dosenList, setDosenList] = useState<any[]>(fallbackDosenList);
  const [tendikList, setTendikList] = useState<any[]>(fallbackTendikList);
  const [mahasiswaList] = useState<any[]>(fallbackMahasiswaList);
  const [mataKuliahOptions, setMataKuliahOptions] = useState<any[]>(fallbackMataKuliahAktif);
  
  const [fileProposal, setFileProposal] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProposalFormValues>({
    resolver: zodResolver(proposalSchema) as any,
    defaultValues: {
      periode_id: 0,
      skema_id: 0,
      ketua_pegawai_id: 1,
      program_studi: 'S1 Teknik Informatika',
      judul: '',
      anggaran_diajukan: 20000000,
      target_tkt: 3,
      abstrak: '',
      anggota: [
        {
          jenis_tim: 'dosen',
          pegawai_id: 2,
          peran_dalam_tim: 'Anggota Peneliti Dosen',
          tugas_kegiatan: 'Perancangan arsitektur sistem dan algoritma.',
        },
      ],
      mata_kuliah_konversi: [
        {
          nama_mk_search: '[MK-PML-01] Metodologi Penelitian & Pengabdian Masyarakat (3 SKS)',
          mata_kuliah_id: 101,
          keterangan: 'Konversi Nilai Mata Kuliah Metodologi Penelitian (3 SKS)',
        },
      ],
    },
  });

  const { fields: anggotaFields, append: appendAnggota, remove: removeAnggota } = useFieldArray({
    control,
    name: 'anggota',
  });

  const { fields: mkFields, append: appendMk, remove: removeMk } = useFieldArray({
    control,
    name: 'mata_kuliah_konversi',
  });

  const anggotaWatch = watch('anggota');
  const ketuaPegawaiIdWatch = watch('ketua_pegawai_id');

  // Derive Program Studi dynamically from selected Dosen ID
  const selectedDosen = dosenList.find((d) => Number(d.id) === Number(ketuaPegawaiIdWatch));
  const currentProdi = selectedDosen?.prodi || selectedDosen?.unit_kerja?.nama_unit || 'S1 Teknik Informatika';

  // Sync Program Studi value into form state on render
  useEffect(() => {
    setValue('program_studi', currentProdi);
  }, [currentProdi, setValue]);

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [resPeriode, resSkema, resDosen, resTendik] = await Promise.allSettled([
          sippmService.indexPeriode(),
          sippmService.indexSkema(),
          sippmService.getDosenReference(),
          sippmService.getTendikReference(),
        ]);

        if (resPeriode.status === 'fulfilled') {
          const periodes = Array.isArray(resPeriode.value?.data)
            ? resPeriode.value.data
            : (resPeriode.value?.data as any)?.items || [];
          if (periodes.length > 0) {
            setPeriodeList(periodes);
            setValue('periode_id', periodes[0].id);
          }
        }

        if (resSkema.status === 'fulfilled') {
          const skemas = Array.isArray(resSkema.value?.data)
            ? resSkema.value.data
            : (resSkema.value?.data as any)?.items || [];
          if (skemas.length > 0) {
            setSkemaList(skemas);
            setValue('skema_id', skemas[0].id);
          }
        }

        if (resDosen.status === 'fulfilled' && resDosen.value?.data?.length) {
          const formattedDosen = resDosen.value.data.map((d: any) => ({
            ...d,
            prodi: d.prodi || d.unit_kerja?.nama || 'S1 Teknik Informatika',
          }));
          setDosenList(formattedDosen);
          if (formattedDosen[0]?.prodi) {
            setValue('program_studi', formattedDosen[0].prodi);
          }
        }

        if (resTendik.status === 'fulfilled' && resTendik.value?.data?.length) {
          setTendikList(resTendik.value.data);
        }
      } catch (err) {
        console.error('Failed loading SIPPM master reference data', err);
      }
    };
    loadMasterData();
  }, [setValue]);

  const onSubmit = async (data: ProposalFormValues) => {
    try {
      setSubmitting(true);
      setErrorMsg(null);

      const primaryMkId = data.mata_kuliah_konversi?.[0]?.mata_kuliah_id;

      const payload: any = {
        periode_hibah_id: data.periode_id,
        skema_kegiatan_id: data.skema_id,
        ketua_pegawai_id: data.ketua_pegawai_id,
        mata_kuliah_id: primaryMkId,
        judul: data.judul,
        abstrak: data.abstrak,
        rumpun_ilmu: currentProdi,
        dana_diusulkan: data.anggaran_diajukan,
        file_proposal: fileProposal || undefined,
        anggota: data.anggota?.map((a) => ({
          jenis_tim: a.jenis_tim,
          pegawai_id: a.pegawai_id,
          mahasiswa_id: a.mahasiswa_id,
          nama_eksternal: a.nama_eksternal,
          instansi_eksternal: a.instansi_eksternal,
          nidn_eksternal: a.nidn_eksternal,
          peran_dalam_tim: a.peran_dalam_tim || 'Anggota',
          tugas_kegiatan: a.tugas_kegiatan,
        })),
      };

      await sippmService.createProposal(payload);
      router.push('/sippm/proposal');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Gagal menyimpan proposal kegiatan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* HEADER & BACK BUTTON */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn btn-ghost btn-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={18} /> Kembali
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Form Pengajuan Proposal Usulan SIPPM
            <span className="badge badge-blue">
              Integrasi SIAKAD & SIMPEG
            </span>
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Lengkapi data usulan hibah, Jenis Tim (Tendik/Dosen Eksternal), serta Konversi Nilai Multi-Mata Kuliah SIAKAD.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium flex items-center gap-2">
          <XCircle size={18} /> {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* CARD 1: INFORMASI PERIODE TA, SKEMA & KETUA DOSEN */}
        <div className="card shadow-sm border border-slate-200 rounded-2xl overflow-hidden bg-white">
          <div className="card-header bg-slate-50 border-b border-slate-200 px-6 py-4">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <FlaskConical size={18} className="text-primary-600" /> Skema, Periode TA & Ketua Pengusul
            </h2>
          </div>
          <div className="card-body p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Field 1: Periode Hibah (TA Format) */}
              <div className="form-group">
                <label className="form-label font-bold text-xs">Periode Hibah (TA Format) <span className="text-rose-500">*</span></label>
                <select className={`input font-medium ${errors.periode_id ? 'border-rose-500' : ''}`} {...register('periode_id', { valueAsNumber: true })}>
                  <option value={0}>-- Pilih Periode --</option>
                  {periodeList.map((p) => {
                    const formatPendek = p.tahun_anggaran ? p.tahun_anggaran : p.nama_periode;
                    return (
                      <option key={p.id} value={p.id}>
                        {formatPendek}
                      </option>
                    );
                  })}
                  {periodeList.length === 0 && (
                    <>
                      <option value={1}>2025/2026</option>
                      <option value={2}>2024/2025</option>
                    </>
                  )}
                </select>
                {errors.periode_id && <span className="text-xs text-rose-500 font-semibold">{errors.periode_id.message}</span>}
              </div>

              {/* Field 2: Skema Kegiatan (Standar PDDIKTI) */}
              <div className="form-group">
                <label className="form-label font-bold text-xs">Skema Kegiatan (Standar PDDIKTI) <span className="text-rose-500">*</span></label>
                <select className={`input font-medium ${errors.skema_id ? 'border-rose-500' : ''}`} {...register('skema_id', { valueAsNumber: true })}>
                  <option value={0}>-- Pilih Skema --</option>
                  {skemaList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama || s.nama_skema}
                    </option>
                  ))}
                  {skemaList.length === 0 && (
                    <>
                      <option value={1}>Penelitian Dosen Muda (PDP)</option>
                      <option value={2}>Penelitian Dasar (PD)</option>
                      <option value={3}>Penelitian Terapan (PT / BIMA)</option>
                      <option value={4}>Pengabdian Masyarakat Pemula (PMP)</option>
                    </>
                  )}
                </select>
                {errors.skema_id && <span className="text-xs text-rose-500 font-semibold">{errors.skema_id.message}</span>}
              </div>

              {/* Field 3: Ketua Pengusul Dosen (RHF register with custom onChange) */}
              <div className="form-group">
                <label className="form-label font-bold text-xs">Ketua Pengusul (Dosen SIMPEG) <span className="text-rose-500">*</span></label>
                <select
                  className="input font-medium"
                  {...register('ketua_pegawai_id', {
                    valueAsNumber: true,
                    onChange: (e) => {
                      const val = Number(e.target.value);
                      const found = dosenList.find((d) => Number(d.id) === val);
                      if (found && found.prodi) {
                        setValue('program_studi', found.prodi);
                      }
                    },
                  })}
                >
                  {dosenList.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nama_lengkap || d.nama} ({d.prodi || 'S1 Teknik Informatika'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Field 4: Program Studi (Controlled directly via currentProdi state) */}
              <div className="form-group">
                <label className="form-label font-bold text-xs">Program Studi <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  readOnly
                  className="input font-bold bg-slate-100 text-primary-800 cursor-not-allowed border-slate-300"
                  value={currentProdi}
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">Terisi otomatis dari data Ketua Pengusul Dosen SIMPEG</span>
              </div>

              {/* Field 5: Judul Proposal */}
              <div className="form-group lg:col-span-2">
                <label className="form-label font-bold text-xs">Judul Usulan Proposal <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  className="input font-semibold text-slate-900"
                  placeholder="Ketik judul proposal usulan lengkap..."
                  {...register('judul')}
                />
                {errors.judul && <span className="text-xs text-rose-500 font-semibold">{errors.judul.message}</span>}
              </div>

              {/* Field 6: Dana Diusulkan */}
              <div className="form-group">
                <label className="form-label font-bold text-xs">Dana Diusulkan (Rp) <span className="text-rose-500">*</span></label>
                <input
                  type="number"
                  className="input font-semibold text-primary-700"
                  placeholder="20000000"
                  {...register('anggaran_diajukan', { valueAsNumber: true })}
                />
              </div>

              {/* Field 7: Abstrak */}
              <div className="form-group col-span-full">
                <label className="form-label font-bold text-xs">Abstrak Proposal Usulan <span className="text-rose-500">*</span></label>
                <textarea
                  rows={4}
                  className="input font-normal text-slate-700"
                  placeholder="Tuliskan latar belakang masalah, urgensi riset/pengabdian, metode, serta target luaran..."
                  {...register('abstrak')}
                />
                {errors.abstrak && <span className="text-xs text-rose-500 font-semibold">{errors.abstrak.message}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: BOX STRUKTUR JENIS TIM ANGGOTA (INTERNAL & EKSTERNAL) */}
        <div className="card shadow-sm border border-slate-200 rounded-2xl overflow-hidden bg-white">
          <div className="card-header bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <UserPlus size={18} className="text-primary-600" /> Struktur Jenis Tim Anggota (Internal & Eksternal)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Dukungan Jenis Tim lengkap: Dosen, Tendik (SIMPEG), Mahasiswa (SIAKAD), serta Dosen Eksternal.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                appendAnggota({
                  jenis_tim: 'dosen',
                  pegawai_id: 1,
                  peran_dalam_tim: 'Anggota Peneliti',
                  tugas_kegiatan: '',
                })
              }
              className="btn btn-secondary btn-sm bg-primary-50 text-primary-700 border-primary-200 hover:bg-primary-100 font-bold"
            >
              + Tambah Anggota Tim
            </button>
          </div>
          <div className="card-body p-6 space-y-4">
            {anggotaFields.map((field, index) => {
              const currentJenisTim: JenisTim = anggotaWatch?.[index]?.jenis_tim || 'dosen';

              return (
                <div key={field.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 relative grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  {/* Field Jenis Tim */}
                  <div className="form-group md:col-span-3">
                    <label className="form-label text-xs font-bold">Jenis Tim <span className="text-rose-500">*</span></label>
                    <select
                      className="input input-sm font-semibold bg-white border-primary-300"
                      {...register(`anggota.${index}.jenis_tim` as const)}
                      onChange={(e) => {
                        const val = e.target.value as JenisTim;
                        setValue(`anggota.${index}.jenis_tim`, val);
                      }}
                    >
                      <option value="dosen">Dosen (SIMPEG)</option>
                      <option value="tendik">Tendik / Laboran (SIMPEG)</option>
                      <option value="mahasiswa">Mahasiswa (SIAKAD)</option>
                      <option value="dosen_eksternal">Dosen Eksternal (Input Manual)</option>
                      <option value="eksternal">Mitra / Instansi Lapangan</option>
                    </select>
                  </div>

                  {/* Dynamic Selection Input Based on Jenis Tim */}
                  <div className="form-group md:col-span-5">
                    <label className="form-label text-xs font-bold">
                      {currentJenisTim === 'dosen' && 'Pilih Dosen (SIMPEG)'}
                      {currentJenisTim === 'tendik' && 'Pilih Tendik (SIMPEG)'}
                      {currentJenisTim === 'mahasiswa' && 'Pilih Mahasiswa (SIAKAD)'}
                      {currentJenisTim === 'dosen_eksternal' && 'Nama Dosen Eksternal & NIDN'}
                      {currentJenisTim === 'eksternal' && 'Nama Mitra / Instansi'}
                      <span className="text-rose-500"> *</span>
                    </label>

                    {/* Dosen SIMPEG */}
                    {currentJenisTim === 'dosen' && (
                      <select
                        className="input input-sm font-medium bg-white"
                        {...register(`anggota.${index}.pegawai_id` as const, { valueAsNumber: true })}
                      >
                        {dosenList.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.nama_lengkap || d.nama} (NIP: {d.nip})
                          </option>
                        ))}
                      </select>
                    )}

                    {/* Tendik SIMPEG */}
                    {currentJenisTim === 'tendik' && (
                      <select
                        className="input input-sm font-medium bg-white border-blue-300"
                        {...register(`anggota.${index}.pegawai_id` as const, { valueAsNumber: true })}
                      >
                        {tendikList.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.nama_lengkap || t.nama} (NIP: {t.nip})
                          </option>
                        ))}
                      </select>
                    )}

                    {/* Mahasiswa SIAKAD */}
                    {currentJenisTim === 'mahasiswa' && (
                      <select
                        className="input input-sm font-medium bg-white border-amber-300 text-amber-950 font-semibold"
                        {...register(`anggota.${index}.mahasiswa_id` as const, { valueAsNumber: true })}
                      >
                        {mahasiswaList.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.nama_lengkap} (NIM: {m.nim}) - {m.prodi}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* Dosen Eksternal (Input Manual) */}
                    {currentJenisTim === 'dosen_eksternal' && (
                      <div className="grid grid-cols-1 gap-2">
                        <input
                          type="text"
                          className="input input-sm font-medium bg-white border-indigo-300"
                          placeholder="Nama Lengkap Dosen Eksternal & Gelar"
                          {...register(`anggota.${index}.nama_eksternal` as const)}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            className="input input-xs bg-white"
                            placeholder="NIDN / NIP Eksternal"
                            {...register(`anggota.${index}.nidn_eksternal` as const)}
                          />
                          <input
                            type="text"
                            className="input input-xs bg-white"
                            placeholder="Universitas / Instansi Asal"
                            {...register(`anggota.${index}.instansi_eksternal` as const)}
                          />
                        </div>
                      </div>
                    )}

                    {/* Eksternal / Mitra */}
                    {currentJenisTim === 'eksternal' && (
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          className="input input-sm font-medium bg-white"
                          placeholder="Nama Perwakilan Mitra"
                          {...register(`anggota.${index}.nama_eksternal` as const)}
                        />
                        <input
                          type="text"
                          className="input input-sm font-medium bg-white"
                          placeholder="Nama Perusahaan / Instansi"
                          {...register(`anggota.${index}.instansi_eksternal` as const)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Tugas / Deskripsi Job */}
                  <div className="form-group md:col-span-3">
                    <label className="form-label text-xs font-bold">Peran & Tugas dalam Tim</label>
                    <input
                      type="text"
                      className="input input-sm"
                      placeholder="Contoh: Analisis Data & Pengujian Lab"
                      {...register(`anggota.${index}.tugas_kegiatan` as const)}
                    />
                  </div>

                  {/* Hapus Button */}
                  <div className="md:col-span-1 flex items-center justify-end md:justify-center pt-2 md:pt-4">
                    <button
                      type="button"
                      onClick={() => removeAnggota(index)}
                      className="btn btn-ghost btn-sm text-rose-600 hover:bg-rose-50 p-1.5"
                      title="Hapus Anggota Tim"
                      disabled={anggotaFields.length === 1}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CARD 3: BOX INTEGRASI MATA KULIAH SIAKAD (KONVERSI NILAI MAHASISWA) */}
        <div className="card shadow-sm border border-primary-200 rounded-2xl overflow-hidden bg-white">
          <div className="card-header bg-primary-50 border-b border-primary-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-primary-950 flex items-center gap-2">
                <BookOpen size={18} className="text-primary-600" /> Integrasi Mata Kuliah SIAKAD (Konversi Nilai Mahasiswa)
              </h2>
              <p className="text-xs text-primary-800/80 mt-0.5 font-medium">
                Pilih atau ketik nama mata kuliah aktif SIAKAD yang akan mendapatkan konversi nilai / SKS bagi mahasiswa yang berpartisipasi.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                appendMk({
                  nama_mk_search: '',
                  mata_kuliah_id: 102,
                  keterangan: '',
                })
              }
              className="btn btn-secondary btn-sm bg-primary-600 text-white hover:bg-primary-700 font-bold border-none shadow-sm"
            >
              <Plus size={16} /> Tambah Mata Kuliah Konversi
            </button>
          </div>
          <div className="card-body p-6 space-y-4">
            {mkFields.map((field, index) => (
              <div key={field.id} className="p-4 rounded-xl bg-primary-50/30 border border-primary-200 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                {/* Select Box / Single Select Dropdown */}
                <div className="form-group md:col-span-6">
                  <label className="form-label text-xs font-bold text-primary-900">
                    Mata Kuliah Aktif SIAKAD ({index + 1}) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    className="input input-sm font-semibold text-slate-800 border-primary-300 focus:border-primary-500 bg-white"
                    {...register(`mata_kuliah_konversi.${index}.mata_kuliah_id` as const, { valueAsNumber: true })}
                  >
                    <option value={0}>-- Pilih Mata Kuliah Aktif SIAKAD --</option>
                    {mataKuliahOptions.map((mk) => (
                      <option key={mk.mata_kuliah_id} value={mk.mata_kuliah_id}>
                        {mk.nama_mk} [{mk.kode_mk}]
                      </option>
                    ))}
                  </select>
                </div>

                {/* Keterangan / Target Konversi */}
                <div className="form-group md:col-span-5">
                  <label className="form-label text-xs font-bold text-primary-900">Catatan / Target Konversi (Opsional)</label>
                  <input
                    type="text"
                    className="input input-sm font-medium bg-white"
                    placeholder="Contoh: Konversi nilai otomatis untuk mahasiswa S1 TI semester 6"
                    {...register(`mata_kuliah_konversi.${index}.keterangan` as const)}
                  />
                </div>

                {/* Hapus Button */}
                <div className="md:col-span-1 flex items-center justify-end md:justify-center pt-2 md:pt-4">
                  <button
                    type="button"
                    onClick={() => removeMk(index)}
                    className="btn btn-ghost btn-sm text-rose-600 hover:bg-rose-50 p-1.5"
                    title="Hapus Mata Kuliah Konversi"
                    disabled={mkFields.length === 1}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CARD 4: FILE BERKAS PROPOSAL */}
        <div className="card shadow-sm border border-slate-200 rounded-2xl overflow-hidden bg-white">
          <div className="card-header bg-slate-50 border-b border-slate-200 px-6 py-4">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Upload size={18} className="text-primary-600" /> Berkas Dokumen Proposal (PDF)
            </h2>
          </div>
          <div className="card-body p-6">
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-primary-500 transition-colors bg-slate-50/50">
              <FileText className="mx-auto text-primary-600 mb-2" size={36} />
              <div className="text-sm font-bold text-slate-800 mb-1">
                {fileProposal ? fileProposal.name : 'Pilih atau drop file PDF Proposal'}
              </div>
              <p className="text-xs text-slate-400 mb-4">Format PDF sesuai template panduan hibah (Maksimal 10 MB)</p>
              <label className="btn btn-secondary btn-sm inline-flex items-center cursor-pointer font-bold">
                <Upload size={14} className="mr-1" /> Browse File PDF
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFileProposal(e.target.files[0]);
                    }
                  }}
                />
              </label>
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn btn-secondary font-semibold"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary bg-primary-600 hover:bg-primary-700 border-none shadow-md font-bold text-white px-6"
          >
            <Save size={18} /> {submitting ? 'Menyimpan Proposal...' : 'Simpan Draf Proposal'}
          </button>
        </div>
      </form>
    </div>
  );
}
