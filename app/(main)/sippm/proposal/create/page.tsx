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
  Search,
} from 'lucide-react';
import { sippmService } from '@/services/sippm.service';
import { simpegService } from '@/services/simpeg.service';
import type { PeriodeHibah, SkemaKegiatan } from '@/types/sippm.types';

// Fallback Master Data Dosen (SIMPEG / SIAKAD 30 Dosen Database)
const fallbackDosenList = [
  { id: 1, nama_lengkap: 'Prof. Dr. Ir. H. Ahmad Dahlan, M.Kom', nip: '198205152010121001', prodi: 'S1 Teknik Informatika', email: 'if.dosen1@kampus.ac.id' },
  { id: 2, nama_lengkap: 'Dr. Siti Nurhaliza, S.T., M.T.', nip: '198509182010121002', prodi: 'S1 Teknik Informatika', email: 'if.dosen2@kampus.ac.id' },
  { id: 3, nama_lengkap: 'Budi Santoso, M.Kom.', nip: '199011222010121003', prodi: 'S1 Teknik Informatika', email: 'if.dosen3@kampus.ac.id' },
  { id: 4, nama_lengkap: 'Eka Putri, M.T.', nip: '198807052010121004', prodi: 'S1 Teknik Informatika', email: 'if.dosen4@kampus.ac.id' },
  { id: 5, nama_lengkap: 'Dr. Eng. Rahmat Hidayat, M.Sc.', nip: '198312092010121005', prodi: 'S1 Teknik Informatika', email: 'if.dosen5@kampus.ac.id' },
  { id: 6, nama_lengkap: 'Dr. Rina Wijaya, S.Kom., M.T.', nip: '198404122010121006', prodi: 'S1 Sistem Informasi', email: 'si.dosen1@kampus.ac.id' },
  { id: 7, nama_lengkap: 'Hendra Setiawan, M.Kom.', nip: '198906152010121007', prodi: 'S1 Sistem Informasi', email: 'si.dosen2@kampus.ac.id' },
  { id: 8, nama_lengkap: 'Maya Kartika, S.T., M.IS.', nip: '199103202010121008', prodi: 'S1 Sistem Informasi', email: 'si.dosen3@kampus.ac.id' },
  { id: 9, nama_lengkap: 'Agus Kurniawan, M.T.', nip: '198710082010121009', prodi: 'S1 Sistem Informasi', email: 'si.dosen4@kampus.ac.id' },
  { id: 10, nama_lengkap: 'Dr. Diana Permata, M.Kom.', nip: '198602282010121010', prodi: 'S1 Sistem Informasi', email: 'si.dosen5@kampus.ac.id' },
  { id: 11, nama_lengkap: 'Bambang Sudarsono, M.Sn.', nip: '198101142010121011', prodi: 'S1 Desain Komunikasi Visual', email: 'dkv.dosen1@kampus.ac.id' },
  { id: 12, nama_lengkap: 'Nadia Utami, S.Ds., M.A.', nip: '199208032010121012', prodi: 'S1 Desain Komunikasi Visual', email: 'dkv.dosen2@kampus.ac.id' },
  { id: 13, nama_lengkap: 'Faris Pratama, M.Ds.', nip: '199005192010121013', prodi: 'S1 Desain Komunikasi Visual', email: 'dkv.dosen3@kampus.ac.id' },
  { id: 14, nama_lengkap: 'Dr. Ratna Sari, M.Sn.', nip: '198511112010121014', prodi: 'S1 Desain Komunikasi Visual', email: 'dkv.dosen4@kampus.ac.id' },
  { id: 15, nama_lengkap: 'Doni Kusuma, S.Sn., M.Media.', nip: '198804252010121015', prodi: 'S1 Desain Komunikasi Visual', email: 'dkv.dosen5@kampus.ac.id' },
  { id: 16, nama_lengkap: 'Ir. Hendra Gunawan, M.T., Ph.D.', nip: '198009302010121016', prodi: 'S1 Teknik Elektro', email: 'te.dosen1@kampus.ac.id' },
  { id: 17, nama_lengkap: 'Dr. Tri Wibowo, S.T., M.Eng.', nip: '198307172010121017', prodi: 'S1 Teknik Elektro', email: 'te.dosen2@kampus.ac.id' },
  { id: 18, nama_lengkap: 'Dewi Anggraini, M.T.', nip: '198912012010121018', prodi: 'S1 Teknik Elektro', email: 'te.dosen3@kampus.ac.id' },
  { id: 19, nama_lengkap: 'Lutfi Hakim, S.T., M.Sc.', nip: '198603102010121019', prodi: 'S1 Teknik Elektro', email: 'te.dosen4@kampus.ac.id' },
  { id: 20, nama_lengkap: 'Siti Zulaikha, M.Eng.', nip: '199105052010121020', prodi: 'S1 Teknik Elektro', email: 'te.dosen5@kampus.ac.id' },
  { id: 21, nama_lengkap: 'Nurhasanah, S.Kom., M.Kom.', nip: '198708152010121021', prodi: 'S1 Manajemen Informatika', email: 'mi.dosen1@kampus.ac.id' },
  { id: 22, nama_lengkap: 'Rifan Syahputra, M.T.', nip: '199002112010121022', prodi: 'S1 Manajemen Informatika', email: 'mi.dosen2@kampus.ac.id' },
  { id: 23, nama_lengkap: 'Dr. Arif Budiman, M.Kom.', nip: '198406232010121023', prodi: 'S1 Manajemen Informatika', email: 'mi.dosen3@kampus.ac.id' },
  { id: 24, nama_lengkap: 'Gita Savitri, S.ST., M.Tr.Kom.', nip: '199210042010121024', prodi: 'S1 Manajemen Informatika', email: 'mi.dosen4@kampus.ac.id' },
  { id: 25, nama_lengkap: 'Haryo Damar, M.Kom.', nip: '198811182010121025', prodi: 'S1 Manajemen Informatika', email: 'mi.dosen5@kampus.ac.id' },
  { id: 26, nama_lengkap: 'Fajar Nugraha, M.Kom.', nip: '198901292010121026', prodi: 'D3 Sistem Informasi', email: 'd3si.dosen1@kampus.ac.id' },
  { id: 27, nama_lengkap: 'Siska Amelia, S.Kom., M.T.', nip: '199107122010121027', prodi: 'D3 Sistem Informasi', email: 'd3si.dosen2@kampus.ac.id' },
  { id: 28, nama_lengkap: 'Rian Hidayat, M.Kom.', nip: '198704082010121028', prodi: 'D3 Sistem Informasi', email: 'd3si.dosen3@kampus.ac.id' },
  { id: 29, nama_lengkap: 'Dr. Endang Lestari, M.T.', nip: '198309212010121029', prodi: 'D3 Sistem Informasi', email: 'd3si.dosen4@kampus.ac.id' },
  { id: 30, nama_lengkap: 'Taufik Hidayatullah, M.Tr.T.', nip: '199010152010121030', prodi: 'D3 Sistem Informasi', email: 'd3si.dosen5@kampus.ac.id' },
];

// Sample Master Data Mahasiswa SIAKAD
const fallbackMahasiswaList = [
  { id: 1, nama_lengkap: 'Aditia Rahmat Kusuma', nim: '202401001', prodi: 'S1 Teknik Informatika' },
  { id: 2, nama_lengkap: 'Anisa Bella Safitri', nim: '202401002', prodi: 'S1 Sistem Informasi' },
  { id: 3, nama_lengkap: 'Bayu Ferdiansyah', nim: '202401003', prodi: 'S1 Desain Komunikasi Visual' },
  { id: 4, nama_lengkap: 'Candra Kusuma Wijaya', nim: '202401004', prodi: 'S1 Teknik Elektro' },
  { id: 5, nama_lengkap: 'Dian Sastrowardoyo', nim: '202401005', prodi: 'S1 Manajemen Informatika' },
  { id: 6, nama_lengkap: 'Erika Carlina Putri', nim: '202401006', prodi: 'D3 Sistem Informasi' },
];

// Sample Master Data Mitra / Instansi Industri
const fallbackMitraList = [
  { id: 1, nama_mitra: 'PT Telkom Indonesia Tbk', kategori: 'BUMN / Telekomunikasi' },
  { id: 2, nama_mitra: 'PT Bank Central Asia Tbk (BCA)', kategori: 'Perbankan / FinTech' },
  { id: 3, nama_mitra: 'Dinas Komunikasi dan Informatika (Diskominfo)', kategori: 'Instansi Pemerintah' },
  { id: 4, nama_mitra: 'PT Pertamina (Persero)', kategori: 'BUMN / Energi' },
  { id: 5, nama_mitra: 'PT Astra International Tbk', kategori: 'Manufaktur & Otomotif' },
  { id: 6, nama_mitra: 'Badan Siber dan Sandi Negara (BSSN)', kategori: 'Lembaga Negara' },
];

// Zod Schema for Create Proposal
const proposalSchema = z.object({
  periode_hibah_id: z.number().min(1, 'Pilih periode hibah'),
  skema_kegiatan_id: z.number().min(1, 'Pilih skema kegiatan'),
  judul: z.string().min(10, 'Judul proposal minimal 10 karakter'),
  rumpun_ilmu: z.string().min(3, 'Rumpun ilmu wajib diisi'),
  dana_diusulkan: z.number().min(1000000, 'Dana diusulkan minimal Rp 1.000.000'),
  abstrak: z.string().min(50, 'Abstrak proposal minimal 50 karakter'),
  anggota: z
    .array(
      z.object({
        nama: z.string().min(3, 'Nama anggota wajib diisi'),
        email: z.string().email('Format email tidak valid').optional().or(z.literal('')),
        peran: z.enum(['anggota_dosen', 'anggota_mahasiswa', 'mitra'] as const),
        tugas: z.string().optional(),
      })
    )
    .optional(),
});

type ProposalFormValues = z.infer<typeof proposalSchema>;

export default function CreateProposalPage() {
  const router = useRouter();
  const [periodeList, setPeriodeList] = useState<PeriodeHibah[]>([]);
  const [skemaList, setSkemaList] = useState<SkemaKegiatan[]>([]);
  const [dosenList, setDosenList] = useState<typeof fallbackDosenList>(fallbackDosenList);
  const [mahasiswaList] = useState<typeof fallbackMahasiswaList>(fallbackMahasiswaList);
  const [mitraList] = useState<typeof fallbackMitraList>(fallbackMitraList);
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
      periode_hibah_id: 0,
      skema_kegiatan_id: 0,
      judul: '',
      rumpun_ilmu: 'Teknologi Informasi & Rekayasa',
      dana_diusulkan: 20000000,
      abstrak: '',
      anggota: [
        { nama: 'Dr. Siti Nurhaliza, S.T., M.T.', email: 'if.dosen2@kampus.ac.id', peran: 'anggota_dosen', tugas: 'Pengumpulan Data & Pengujian Model' },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'anggota',
  });

  const anggotaWatch = watch('anggota');

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [resPeriode, resSkema, resDosen] = await Promise.allSettled([
          sippmService.indexPeriode(),
          sippmService.indexSkema(),
          simpegService.getPegawaiList({ jenis_pegawai: 'dosen' }),
        ]);

        if (resPeriode.status === 'fulfilled') {
          const periodes = Array.isArray(resPeriode.value?.data)
            ? resPeriode.value.data
            : (resPeriode.value?.data as any)?.items || (resPeriode.value?.data as any)?.data || [];
          if (periodes.length > 0) {
            setPeriodeList(periodes);
            setValue('periode_hibah_id', periodes[0].id);
          }
        }

        if (resSkema.status === 'fulfilled') {
          const skemas = Array.isArray(resSkema.value?.data)
            ? resSkema.value.data
            : (resSkema.value?.data as any)?.items || (resSkema.value?.data as any)?.data || [];
          if (skemas.length > 0) {
            setSkemaList(skemas);
            setValue('skema_kegiatan_id', skemas[0].id);
          }
        }

        if (resDosen.status === 'fulfilled' && resDosen.value?.data) {
          const rawDosen = Array.isArray(resDosen.value.data) ? resDosen.value.data : (resDosen.value?.data as any)?.data || [];
          if (rawDosen.length > 0) {
            const mapped = rawDosen.map((d: any) => ({
              id: d.id,
              nama_lengkap: d.nama_lengkap || d.name,
              nip: d.nip || 'N/A',
              prodi: d.unit_kerja?.nama || 'Dosen Tetap',
              email: d.user?.email || `${d.id}@kampus.ac.id`,
            }));
            setDosenList(mapped);
          }
        }
      } catch (err) {
        console.error('Failed to load master data for proposal form', err);
      }
    };
    loadMasterData();
  }, [setValue]);

  const onSubmit = async (data: ProposalFormValues) => {
    try {
      setSubmitting(true);
      setErrorMsg(null);

      await sippmService.createProposal({
        ...data,
        file_proposal: fileProposal || undefined,
      });

      router.push('/sippm/proposal');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Gagal menyimpan proposal kegiatan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* HEADER & BACK BUTTON (crud-ui-standard) */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="btn btn-ghost btn-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={18} /> Kembali
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Form Pengajuan Proposal Usulan</h1>
          <p className="text-slate-500 text-xs mt-0.5">Lengkapi data usulan hibah riset & pengabdian masyarakat sesuai panduan LPPM.</p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium flex items-center gap-2">
          <XCircle size={18} /> {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* CARD 1: INFORMASI DASAR (COMPACT GRID LAYOUT MAKS 3 KOLOM) */}
        <div className="card">
          <div className="card-header bg-slate-50">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <FlaskConical size={18} className="text-teal-600" /> Informasi Skema & Rumpun Ilmu
            </h2>
          </div>
          <div className="card-body">
            {/* GRID LAYOUT MAKS 3 KOLOM per crud-ui-standard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Field 1 */}
              <div className="form-group">
                <label className="form-label">Periode Hibah <span className="required">*</span></label>
                <select className={`input ${errors.periode_hibah_id ? 'error' : ''}`} {...register('periode_hibah_id')}>
                  <option value={0}>-- Pilih Periode Hibah --</option>
                  {periodeList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nama_periode} ({p.tahun_anggaran})
                    </option>
                  ))}
                </select>
                {errors.periode_hibah_id && <span className="form-error">{errors.periode_hibah_id.message}</span>}
              </div>

              {/* Field 2 */}
              <div className="form-group">
                <label className="form-label">Skema Kegiatan <span className="required">*</span></label>
                <select className={`input ${errors.skema_kegiatan_id ? 'error' : ''}`} {...register('skema_kegiatan_id')}>
                  <option value={0}>-- Pilih Skema --</option>
                  {skemaList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama_skema} (Maks: Rp {(s.maksimal_dana || 0).toLocaleString('id-ID')})
                    </option>
                  ))}
                </select>
                {errors.skema_kegiatan_id && <span className="form-error">{errors.skema_kegiatan_id.message}</span>}
              </div>

              {/* Field 3 */}
              <div className="form-group">
                <label className="form-label">Rumpun Ilmu <span className="required">*</span></label>
                <input
                  type="text"
                  className={`input ${errors.rumpun_ilmu ? 'error' : ''}`}
                  placeholder="Misal: Teknik Informatika, Bioteknologi"
                  {...register('rumpun_ilmu')}
                />
                {errors.rumpun_ilmu && <span className="form-error">{errors.rumpun_ilmu.message}</span>}
              </div>

              {/* Field 4: Judul */}
              <div className="form-group md:col-span-2">
                <label className="form-label">Judul Proposal Usulan <span className="required">*</span></label>
                <input
                  type="text"
                  className={`input ${errors.judul ? 'error' : ''}`}
                  placeholder="Ketik judul proposal lengkap..."
                  {...register('judul')}
                />
                {errors.judul && <span className="form-error">{errors.judul.message}</span>}
              </div>

              {/* Field 5: Dana Diusulkan */}
              <div className="form-group">
                <label className="form-label">Dana Diusulkan (Rp) <span className="required">*</span></label>
                <input
                  type="number"
                  className={`input ${errors.dana_diusulkan ? 'error' : ''}`}
                  placeholder="20000000"
                  {...register('dana_diusulkan')}
                />
                {errors.dana_diusulkan && <span className="form-error">{errors.dana_diusulkan.message}</span>}
              </div>

              {/* Field 6: Abstrak */}
              <div className="form-group col-span-full">
                <label className="form-label">Abstrak Proposal <span className="required">*</span></label>
                <textarea
                  rows={4}
                  className={`input ${errors.abstrak ? 'error' : ''}`}
                  placeholder="Tuliskan latar belakang masalah, tujuan riset, metode, serta target output..."
                  {...register('abstrak')}
                />
                {errors.abstrak && <span className="form-error">{errors.abstrak.message}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: TIM ANGGOTA PENELITI / PENGABDIAN */}
        <div className="card">
          <div className="card-header bg-slate-50 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <UserPlus size={18} className="text-teal-600" /> Tim Anggota Usulan
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">Setiap dropdown mendukung pencarian langsung dengan mengetikkan nama/NIP/NIM.</p>
            </div>
            <button
              type="button"
              onClick={() => append({ nama: '', email: '', peran: 'anggota_dosen', tugas: '' })}
              className="btn btn-secondary btn-sm bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100 font-bold"
            >
              + Tambah Anggota
            </button>
          </div>
          <div className="card-body space-y-4">
            {fields.map((field, index) => {
              const currentPeran = anggotaWatch?.[index]?.peran || 'anggota_dosen';

              return (
                <div key={field.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 relative grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  {/* Peran Tim */}
                  <div className="form-group md:col-span-3">
                    <label className="form-label text-xs font-bold">Peran Tim <span className="text-rose-500">*</span></label>
                    <select
                      className="input input-sm font-medium bg-white"
                      {...register(`anggota.${index}.peran` as const)}
                      onChange={(e) => {
                        const newPeran = e.target.value as any;
                        setValue(`anggota.${index}.peran`, newPeran);
                        setValue(`anggota.${index}.nama`, '');
                        setValue(`anggota.${index}.email`, '');
                      }}
                    >
                      <option value="anggota_dosen">Anggota Dosen</option>
                      <option value="anggota_mahasiswa">Anggota Mahasiswa</option>
                      <option value="mitra">Mitra Lapangan / Industri</option>
                    </select>
                  </div>

                  {/* Nama Anggota: Searchable Combo Dropdown (Bisa Diketik) */}
                  <div className="form-group md:col-span-5">
                    <label className="form-label text-xs font-bold flex items-center justify-between">
                      <span>
                        {currentPeran === 'anggota_dosen' ? 'Nama Dosen' : currentPeran === 'anggota_mahasiswa' ? 'Nama / NIM Mahasiswa' : 'Nama Mitra / Instansi'}
                        <span className="text-rose-500"> *</span>
                      </span>
                    </label>

                    {/* Dosen Searchable Combo Input */}
                    {currentPeran === 'anggota_dosen' && (
                      <>
                        <div className="relative">
                          <input
                            type="text"
                            list={`dosen-datalist-${index}`}
                            className="input input-sm font-semibold text-slate-800 border-teal-300 focus:border-teal-500 bg-white pr-8"
                            placeholder="Ketik untuk mencari Nama Dosen atau NIP..."
                            {...register(`anggota.${index}.nama` as const)}
                            onChange={(e) => {
                              const val = e.target.value;
                              setValue(`anggota.${index}.nama`, val);
                              const found = dosenList.find((d) => d.nama_lengkap === val || val.includes(d.nama_lengkap));
                              if (found) {
                                setValue(`anggota.${index}.email`, found.email);
                              }
                            }}
                          />
                          <Search size={14} className="absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
                        </div>
                        <datalist id={`dosen-datalist-${index}`}>
                          {dosenList.map((dosen) => (
                            <option key={dosen.id} value={dosen.nama_lengkap}>
                              NIP: {dosen.nip} ({dosen.prodi})
                            </option>
                          ))}
                        </datalist>
                      </>
                    )}

                    {/* Mahasiswa Searchable Combo Input */}
                    {currentPeran === 'anggota_mahasiswa' && (
                      <>
                        <div className="relative">
                          <input
                            type="text"
                            list={`mahasiswa-datalist-${index}`}
                            className="input input-sm font-semibold text-slate-800 border-blue-300 focus:border-blue-500 bg-white pr-8"
                            placeholder="Ketik untuk mencari NIM atau Nama Mahasiswa..."
                            {...register(`anggota.${index}.nama` as const)}
                          />
                          <Search size={14} className="absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
                        </div>
                        <datalist id={`mahasiswa-datalist-${index}`}>
                          {mahasiswaList.map((mhs) => (
                            <option key={mhs.id} value={`${mhs.nama_lengkap} (${mhs.nim})`}>
                              {mhs.prodi}
                            </option>
                          ))}
                        </datalist>
                      </>
                    )}

                    {/* Mitra Searchable Combo Input */}
                    {currentPeran === 'mitra' && (
                      <>
                        <div className="relative">
                          <input
                            type="text"
                            list={`mitra-datalist-${index}`}
                            className="input input-sm font-semibold text-slate-800 border-purple-300 focus:border-purple-500 bg-white pr-8"
                            placeholder="Ketik untuk mencari Mitra atau Instansi..."
                            {...register(`anggota.${index}.nama` as const)}
                          />
                          <Search size={14} className="absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
                        </div>
                        <datalist id={`mitra-datalist-${index}`}>
                          {mitraList.map((mitra) => (
                            <option key={mitra.id} value={mitra.nama_mitra}>
                              {mitra.kategori}
                            </option>
                          ))}
                        </datalist>
                      </>
                    )}
                  </div>

                  {/* Tugas / Deskripsi Job */}
                  <div className="form-group md:col-span-3">
                    <label className="form-label text-xs font-bold">Tugas / Deskripsi Job</label>
                    <input
                      type="text"
                      className="input input-sm"
                      placeholder="Contoh: Analisis Data Riset"
                      {...register(`anggota.${index}.tugas` as const)}
                    />
                  </div>

                  {/* Hapus Button */}
                  <div className="md:col-span-1 flex items-center justify-end md:justify-center pt-2 md:pt-4">
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="btn btn-ghost btn-sm text-rose-600 hover:bg-rose-50 p-1.5"
                      title="Hapus Anggota"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CARD 3: FILE UNGGAH PROPOSAL */}
        <div className="card">
          <div className="card-header bg-slate-50">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Upload size={18} className="text-teal-600" /> File Berkas Proposal (PDF)
            </h2>
          </div>
          <div className="card-body">
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-teal-500 transition-colors bg-slate-50/50">
              <FileText className="mx-auto text-teal-600 mb-2" size={36} />
              <div className="text-sm font-bold text-slate-800 mb-1">
                {fileProposal ? fileProposal.name : 'Pilih atau drop file PDF Proposal'}
              </div>
              <p className="text-xs text-slate-400 mb-4">Format PDF sesuai template panduan (Maksimal 10 MB)</p>
              <label className="btn btn-secondary btn-sm inline-flex items-center cursor-pointer">
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

        {/* ACTION BUTTONS (crud-ui-standard) */}
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
            className="btn btn-primary bg-teal-600 hover:bg-teal-700 border-none shadow-md font-bold"
          >
            <Save size={18} /> {submitting ? 'Menyimpan Proposal...' : 'Simpan Draf Proposal'}
          </button>
        </div>
      </form>
    </div>
  );
}
