'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Edit2,
  Building2,
  GraduationCap,
  Phone,
  CreditCard,
  Calendar,
  Award,
  ShieldAlert,
  BookOpen,
  FileCheck,
  ExternalLink,
  Briefcase,
  Layers,
  HeartHandshake,
  TrendingUp,
  FileText,
  CheckCircle2,
  Clock,
  Download,
  ScanFace,
  RotateCcw,
  MapPin,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { simpegService } from '@/services/simpeg.service';
import { simpegKompetensiService } from '@/services/simpeg.kompetensi.service';
import { simpegDossierService } from '@/services/simpeg.dossier.service';
import type { Pegawai } from '@/types/simpeg.types';
import type { SertifikasiDosen, RiwayatTes, RiwayatPelatihan } from '@/types/simpeg.kompetensi.types';
import type { TridharmaDossierData, TridharmaKelasAjar, TridharmaMahasiswaWali, TridharmaProposal, TridharmaPublikasi, TridharmaHki } from '@/types/simpeg.dossier.types';

export default function DetailPegawaiPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const pegawaiId = Number(resolvedParams.id);
  const router = useRouter();

  const [pegawai, setPegawai] = useState<Pegawai | null>(null);
  const [sertifikasiList, setSertifikasiList] = useState<SertifikasiDosen[]>([]);
  const [tesList, setTesList] = useState<RiwayatTes[]>([]);
  const [pelatihanList, setPelatihanList] = useState<RiwayatPelatihan[]>([]);
  const [dossier, setDossier] = useState<TridharmaDossierData | null>(null);
  const [activeTab, setActiveTab] = useState<'profil' | 'pengajaran' | 'penelitian' | 'pengabdian' | 'penunjang'>('profil');
  const [loading, setLoading] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleResetBiometric = async () => {
    setIsResetting(true);
    try {
      const res = await simpegService.resetFaceBiometric(pegawaiId);
      toast.success(res.message || 'Data biometrik wajah pegawai berhasil direset.');
      setPegawai((prev) => (prev ? { ...prev, is_face_enrolled: false, face_enrolled_at: null } : null));
      setShowResetConfirm(false);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      toast.error(errorObj?.response?.data?.message || 'Gagal mereset biometrik pegawai.');
    } finally {
      setIsResetting(false);
    }
  };

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const [resPeg, resSer, resTes, resPel, resDos] = await Promise.all([
          simpegService.getPegawaiDetail(pegawaiId),
          simpegKompetensiService.getSertifikasiList({ pegawai_id: pegawaiId, per_page: 50 }).catch(() => ({ data: [] })),
          simpegKompetensiService.getTesList({ pegawai_id: pegawaiId, per_page: 50 }).catch(() => ({ data: [] })),
          simpegKompetensiService.getPelatihanList({ pegawai_id: pegawaiId, per_page: 50 }).catch(() => ({ data: [] })),
          simpegDossierService.getTridharmaDossier(pegawaiId).catch(() => ({ data: null })),
        ]);

        if (resPeg.data) {
          setPegawai(resPeg.data);
        }
        setSertifikasiList(resSer.data || []);
        setTesList(resTes.data || []);
        setPelatihanList(resPel.data || []);
        if (resDos?.data) {
          setDossier(resDos.data);
        }
      } catch (err: unknown) {
        const errorObj = err as { response?: { data?: { message?: string } } };
        toast.error(errorObj?.response?.data?.message || 'Gagal memuat rincian data pegawai.');
      } finally {
        setLoading(false);
      }
    };

    if (pegawaiId) {
      fetchDetail();
    }
  }, [pegawaiId]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-fade-in">
        <PageHeader
          title="Detail Pegawai"
          description="Memuat informasi profil pegawai..."
          backUrl="/simpeg/pegawai"
        />
        <div className="card p-6 text-center text-slate-400">
          Memuat data profil, riwayat pendidikan, dan portofolio Tridharma...
        </div>
      </div>
    );
  }

  if (!pegawai) {
    return (
      <div className="flex flex-col gap-6 animate-fade-in">
        <PageHeader
          title="Pegawai Tidak Ditemukan"
          description="Data pegawai yang Anda cari tidak tersedia di sistem."
          backUrl="/simpeg/pegawai"
        />
        <div className="card p-6 text-center">
          <ShieldAlert size={48} className="mx-auto mb-3 text-rose-500" />
          <p className="text-slate-600 font-medium">Pegawai dengan ID tersebut tidak ditemukan.</p>
        </div>
      </div>
    );
  }

  const displayName = pegawai.nama_gelar || pegawai.nama_lengkap;
  const nidn = pegawai.nidn || pegawai.dosen?.nidn;
  const nuptk = pegawai.nuptk || pegawai.dosen?.nuptk;
  const nip = pegawai.nip;
  const homebaseProdi = pegawai.dosen?.program_studi?.nama;
  const metrics = dossier?.metrics;

  // Table Columns for Tridharma Sections
  const pengajaranColumns: ColumnDef<TridharmaKelasAjar>[] = [
    {
      key: 'mata_kuliah',
      label: 'Mata Kuliah & Kode',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-900">{row.nama_mk}</div>
          <div className="text-xs text-slate-500">Kode: {row.kode_mk} • {row.sks} SKS</div>
        </div>
      ),
    },
    {
      key: 'kelas',
      label: 'Kelas Perkuliahan',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-800">{row.nama_kelas}</span>
          <span className="text-xs text-slate-500 block">Kode: {row.kode_kelas}</span>
        </div>
      ),
    },
    {
      key: 'semester',
      label: 'Tahun Akademik',
      render: (row) => (
        <span className="font-medium text-slate-700">{row.tahun_akademik}</span>
      ),
    },
    {
      key: 'peran',
      label: 'Peran Pengampu',
      render: (row) => (
        <Badge variant={row.peran === 'pengampu_utama' ? 'success' : 'gray'} className="capitalize">
          {row.peran.replace('_', ' ')}
        </Badge>
      ),
    },
  ];

  const mhsWaliColumns: ColumnDef<TridharmaMahasiswaWali>[] = [
    {
      key: 'nim',
      label: 'NIM',
      render: (row) => <span className="font-mono font-bold text-slate-900">{row.nim}</span>,
    },
    {
      key: 'nama',
      label: 'Nama Mahasiswa',
      render: (row) => <span className="font-semibold text-slate-800">{row.nama_lengkap}</span>,
    },
    {
      key: 'prodi',
      label: 'Program Studi',
      render: (row) => row.program_studi || '-',
    },
    {
      key: 'angkatan',
      label: 'Angkatan',
      render: (row) => row.angkatan,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge variant={row.status === 'aktif' ? 'green' : 'gray'} className="capitalize">
          {row.status}
        </Badge>
      ),
    },
  ];

  const proposalColumns: ColumnDef<TridharmaProposal>[] = [
    {
      key: 'judul',
      label: 'Judul & Skema Hibah',
      render: (row) => (
        <div className="space-y-1 max-w-[380px]">
          <Badge variant="simpeg" className="text-2xs">
            {row.skema?.nama || 'Hibah Riset'}
          </Badge>
          <div className="font-bold text-xs text-slate-900 leading-snug">{row.judul}</div>
          <div className="text-xs text-slate-500">Kode: {row.kode_proposal}</div>
        </div>
      ),
    },
    {
      key: 'periode',
      label: 'Tahun / Periode',
      render: (row) => row.periode?.nama_gelombang || row.periode?.tahun_anggaran || '-',
    },
    {
      key: 'anggaran',
      label: 'Dana Disetujui',
      render: (row) => (
        <div className="text-xs">
          <span className="font-mono font-bold text-emerald-600 block">
            Rp {Number(row.anggaran_disetujui).toLocaleString()}
          </span>
          <span className="text-slate-400 text-2xs">
            Diusulkan: Rp {Number(row.anggaran_diajukan).toLocaleString()}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status Hibah',
      render: (row) => (
        <Badge variant={row.status === 'didanai' || row.status === 'selesai' ? 'success' : 'amber'} className="capitalize">
          {row.status}
        </Badge>
      ),
    },
  ];

  const publikasiColumns: ColumnDef<TridharmaPublikasi>[] = [
    {
      key: 'judul',
      label: 'Judul Publikasi & Jurnal',
      render: (row) => (
        <div className="space-y-1 max-w-[400px]">
          <div className="font-bold text-xs text-slate-900 leading-snug">{row.judul_artikel}</div>
          <div className="text-xs text-slate-600 font-medium">{row.nama_jurnal_prosiding}</div>
          <div className="text-xs text-slate-500">{row.volume_issue_tahun}</div>
        </div>
      ),
    },
    {
      key: 'indexing',
      label: 'Indexing / Reputasi',
      render: (row) => (
        <Badge variant={row.indexing?.includes('scopus') ? 'success' : 'simpeg'} className="uppercase">
          {row.indexing || 'Lainnya'}
        </Badge>
      ),
    },
    {
      key: 'doi',
      label: 'DOI / Tautan',
      render: (row) => (
        <div>
          {row.doi ? (
            <a
              href={`https://doi.org/${row.doi}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline font-semibold"
            >
              <ExternalLink size={12} /> DOI
            </a>
          ) : row.url_artikel ? (
            <a
              href={row.url_artikel}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline font-semibold"
            >
              <ExternalLink size={12} /> Artikel
            </a>
          ) : (
            <span className="text-xs text-slate-400">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'verifikasi',
      label: 'Verifikasi LPPM',
      render: (row) => (
        <Badge variant={row.is_verified_lppm ? 'green' : 'gray'}>
          {row.is_verified_lppm ? 'Terverifikasi' : 'Pending'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-6">
      <PageHeader
        title={displayName}
        description="Rincian profil lengkap, identitas kepegawaian, homebase prodi, serta portofolio Tridharma terpadu."
        backUrl="/simpeg/pegawai"
        action={
          <Button
            icon={<Edit2 size={16} />}
            onClick={() => router.push(`/simpeg/pegawai/${pegawai.id}/edit`)}
          >
            Edit Data Pegawai
          </Button>
        }
      />

      {/* Hero Banner Card */}
      <div className="card bg-simpeg-hero p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 flex items-center justify-center text-2xl sm:text-3xl font-extrabold text-white shadow-sm backdrop-blur-sm">
              {pegawai.nama_lengkap?.charAt(0) || 'P'}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {pegawai.roles && pegawai.roles.length > 0 ? (
                  pegawai.roles.map((r) => (
                    <Badge key={r.id} variant="purple" className="text-xs uppercase font-bold">
                      {r.name}
                    </Badge>
                  ))
                ) : (
                  <Badge variant={pegawai.jenis_pegawai === 'dosen' ? 'purple' : 'blue'} className="text-xs uppercase font-bold">
                    {pegawai.jenis_pegawai?.toUpperCase()}
                  </Badge>
                )}
                <Badge variant={pegawai.status === 'aktif' ? 'green' : 'gray'} className="text-xs uppercase">
                  {pegawai.status}
                </Badge>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">{displayName}</h2>
              <div className="flex items-center gap-3 mt-1 flex-wrap text-xs sm:text-sm text-white/90">
                {nip && <span>NIP: <strong className="text-white">{nip}</strong></span>}
                {nidn && <span>• NIDN: <strong className="text-white">{nidn}</strong></span>}
                {homebaseProdi && <span>• Homebase: <strong className="text-white">{homebaseProdi}</strong></span>}
              </div>
            </div>
          </div>
        </div>

        {/* Academic Identifiers (SINTA, Scopus, Google Scholar, ORCID) */}
        {(pegawai.sinta_id || pegawai.scopus_id || pegawai.google_scholar_id || pegawai.orcid_id) && (
          <div className="mt-4 pt-3 border-t border-white/20 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-white/80 font-medium mr-1">ID Akademik:</span>
            {pegawai.sinta_id && (
              <span className="text-2xs bg-white/20 text-white px-2 py-0.5 rounded font-mono font-semibold">
                SINTA: {pegawai.sinta_id}
              </span>
            )}
            {pegawai.scopus_id && (
              <span className="text-2xs bg-white/20 text-white px-2 py-0.5 rounded font-mono font-semibold">
                Scopus: {pegawai.scopus_id}
              </span>
            )}
            {pegawai.google_scholar_id && (
              <span className="text-2xs bg-white/20 text-white px-2 py-0.5 rounded font-mono font-semibold">
                Scholar: {pegawai.google_scholar_id}
              </span>
            )}
            {pegawai.orcid_id && (
              <span className="text-2xs bg-white/20 text-white px-2 py-0.5 rounded font-mono font-semibold">
                ORCID: {pegawai.orcid_id}
              </span>
            )}
          </div>
        )}
      </div>

      {/* TRIDHARMA SUMMARY METRICS (If Available) */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="card p-3 bg-white border border-slate-100 shadow-sm text-center">
            <div className="text-2xs text-slate-500 font-semibold uppercase tracking-wider">Total SKS Ajar</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{metrics.total_sks_ajar} SKS</div>
            <div className="text-2xs text-slate-400">{metrics.total_kelas_ajar} Kelas Kuliah</div>
          </div>

          <div className="card p-3 bg-white border border-slate-100 shadow-sm text-center">
            <div className="text-2xs text-slate-500 font-semibold uppercase tracking-wider">Bimbingan Wali</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{metrics.total_mhs_wali}</div>
            <div className="text-2xs text-slate-400">Mahasiswa Aktif</div>
          </div>

          <div className="card p-3 bg-white border border-slate-100 shadow-sm text-center">
            <div className="text-2xs text-slate-500 font-semibold uppercase tracking-wider">Hibah Riset</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{metrics.total_penelitian} Judul</div>
            <div className="text-2xs text-slate-400">Rp {Math.round(metrics.total_dana_penelitian / 1000000)} Jt</div>
          </div>

          <div className="card p-3 bg-white border border-slate-100 shadow-sm text-center">
            <div className="text-2xs text-slate-500 font-semibold uppercase tracking-wider">Publikasi Ilmiah</div>
            <div className="text-xl font-bold text-emerald-600 mt-0.5">{metrics.total_publikasi} Artikel</div>
            <div className="text-2xs text-slate-400">{metrics.total_publikasi_scopus} Scopus • {metrics.total_publikasi_sinta} Sinta</div>
          </div>

          <div className="card p-3 bg-white border border-slate-100 shadow-sm text-center">
            <div className="text-2xs text-slate-500 font-semibold uppercase tracking-wider">Pengabdian (PkM)</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{metrics.total_pengabdian} Kegiatan</div>
            <div className="text-2xs text-slate-400">Rp {Math.round(metrics.total_dana_pengabdian / 1000000)} Jt</div>
          </div>

          <div className="card p-3 bg-white border border-slate-100 shadow-sm text-center">
            <div className="text-2xs text-slate-500 font-semibold uppercase tracking-wider">Rerata SKP & BKD</div>
            <div className="text-xl font-bold text-primary-600 mt-0.5">{metrics.rerata_nilai_skp || '-'}</div>
            <div className="text-2xs text-slate-400">BKD: {metrics.rerata_nilai_bkd ? `${metrics.rerata_nilai_bkd} SKS` : '-'}</div>
          </div>
        </div>
      )}

      {/* TAB NAVIGATION BAR */}
      <div className="border-b border-slate-200">
        <div className="flex gap-2 overflow-x-auto pb-px">
          <button
            type="button"
            onClick={() => setActiveTab('profil')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-t-lg transition flex items-center gap-2 whitespace-nowrap border-b-2 ${
              activeTab === 'profil'
                ? 'border-primary-600 text-primary-600 bg-primary-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Users size={16} />
            Biodata & Kepegawaian
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pengajaran')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-t-lg transition flex items-center gap-2 whitespace-nowrap border-b-2 ${
              activeTab === 'pengajaran'
                ? 'border-primary-600 text-primary-600 bg-primary-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <GraduationCap size={16} />
            Pengajaran (SIAKAD)
            {dossier?.pengajaran?.kelas && (
              <span className="ml-1 px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded-full text-2xs font-bold">
                {dossier.pengajaran.kelas.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('penelitian')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-t-lg transition flex items-center gap-2 whitespace-nowrap border-b-2 ${
              activeTab === 'penelitian'
                ? 'border-primary-600 text-primary-600 bg-primary-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <BookOpen size={16} />
            Penelitian & Publikasi (SIPPM)
            {dossier?.penelitian?.publikasi && (
              <span className="ml-1 px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded-full text-2xs font-bold">
                {dossier.penelitian.publikasi.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pengabdian')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-t-lg transition flex items-center gap-2 whitespace-nowrap border-b-2 ${
              activeTab === 'pengabdian'
                ? 'border-primary-600 text-primary-600 bg-primary-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <HeartHandshake size={16} />
            Pengabdian Masyarakat (PkM)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('penunjang')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-t-lg transition flex items-center gap-2 whitespace-nowrap border-b-2 ${
              activeTab === 'penunjang'
                ? 'border-primary-600 text-primary-600 bg-primary-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Layers size={16} />
            Penunjang, SK &amp; Kinerja
          </button>
        </div>
      </div>

      {/* TAB CONTENT 1: PROFIL & KEPEGAWAIAN (ORIGINAL EXTENDED) */}
      {activeTab === 'profil' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Kolom 1: Informasi Kepegawaian */}
            <div className="card p-6 bg-white border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100 text-primary-600">
                  <Building2 size={20} />
                  <h3 className="font-bold text-base text-slate-900">Kepegawaian</h3>
                </div>
                <div className="flex flex-col gap-3 text-sm">
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Unit Kerja</span>
                    <span className="font-semibold text-slate-800">{pegawai.unit_kerja?.nama || '-'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Status Kepegawaian</span>
                    <span className="font-semibold text-slate-800 uppercase">{pegawai.status_kepegawaian}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Jenis Pegawai</span>
                    <span className="font-semibold text-slate-800 capitalize">{pegawai.jenis_pegawai || '-'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Jabatan Terakhir</span>
                    <span className="font-semibold text-slate-800">{pegawai.jabatan_terakhir || '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Kolom 2: Kontak & Identitas */}
            <div className="card p-6 bg-white border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100 text-primary-600">
                  <Phone size={20} />
                  <h3 className="font-bold text-base text-slate-900">Kontak &amp; Alamat</h3>
                </div>
                <div className="flex flex-col gap-3 text-sm">
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Telepon / WhatsApp</span>
                    <span className="font-semibold text-slate-800">{pegawai.telepon || '-'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Email Akun SSO</span>
                    <span className="font-semibold text-slate-800">{pegawai.user?.email || '-'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Alamat Domisili</span>
                    <span className="font-semibold text-slate-800">{pegawai.alamat || '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Kolom 3: Finansial & Payroll */}
            <div className="card p-6 bg-white border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100 text-primary-600">
                  <CreditCard size={20} />
                  <h3 className="font-bold text-base text-slate-900">Rekening Penggajian</h3>
                </div>
                <div className="flex flex-col gap-3 text-sm">
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Nama Bank</span>
                    <span className="font-semibold text-slate-800">{pegawai.bank_nama || '-'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Nomor Rekening</span>
                    <span className="font-semibold font-mono text-slate-800">{pegawai.nomor_rekening || '-'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Terdaftar Tanggal Masuk</span>
                    <span className="font-semibold text-slate-800">{pegawai.tanggal_masuk || '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sub-Card: Riwayat Pendidikan & Kompetensi */}
          <div className="card p-6 bg-white border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Award size={20} className="text-primary-600" />
              <h3 className="font-bold text-base text-slate-900">Sertifikasi &amp; Pelatihan Pegawai</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="text-xs text-slate-500 font-semibold mb-1">Sertifikasi Dosen &amp; Profesi</div>
                <div className="text-2xl font-bold text-slate-900">{sertifikasiList.length}</div>
                <div className="text-2xs text-slate-400 mt-1">Sertifikat terdaftar</div>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="text-xs text-slate-500 font-semibold mb-1">Tes Kemampuan (TKDA/TOEFL)</div>
                <div className="text-2xl font-bold text-slate-900">{tesList.length}</div>
                <div className="text-2xs text-slate-400 mt-1">Hasil tes tercatat</div>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="text-xs text-slate-500 font-semibold mb-1">Pelatihan &amp; Workshop</div>
                <div className="text-2xl font-bold text-slate-900">{pelatihanList.length}</div>
                <div className="text-2xs text-slate-400 mt-1">Kegiatan pengembangan</div>
              </div>
            </div>
          </div>

          {/* Card: Presensi Mobile & Biometrik Wajah */}
          <div className="card p-6 bg-white border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 flex-wrap">
              <div className="flex items-center gap-3">
                <ScanFace size={22} className="text-primary-600" />
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-800 m-0">
                    Presensi Mobile &amp; Biometrik Wajah
                  </h3>
                  <p className="text-xs text-slate-400 m-0">
                    Informasi status biometrik wajah, sinkronisasi jadwal kerja, dan titik geofence presensi mobile
                  </p>
                </div>
              </div>
              {pegawai.is_face_enrolled ? (
                <Badge variant="green" className="text-xs">
                  <CheckCircle2 size={12} className="mr-1 inline" /> Wajah Terdaftar
                </Badge>
              ) : (
                <Badge variant="gray" className="text-xs">
                  Belum Terdaftar
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              {/* Status Biometrik Wajah */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 uppercase font-semibold mb-1">
                    <ScanFace size={14} className="text-slate-500" />
                    Status Biometrik Wajah
                  </div>
                  <div className="font-bold text-slate-800 mt-1">
                    {pegawai.is_face_enrolled ? 'Wajah Aktif Terverifikasi' : 'Belum Melakukan Enrollment'}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {pegawai.face_enrolled_at ? (
                      <>Didaftarkan: {new Date(pegawai.face_enrolled_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</>
                    ) : (
                      'Pendaftaran dilakukan mandiri via aplikasi presensi mobile.'
                    )}
                  </div>
                  {pegawai.consent_pdp_at && (
                    <div className="text-2xs text-emerald-600 mt-1 font-medium">
                      ✓ Persetujuan PDP disetujui ({new Date(pegawai.consent_pdp_at).toLocaleDateString('id-ID')})
                    </div>
                  )}
                </div>

                {pegawai.is_face_enrolled && (
                  <div className="pt-3 mt-3 border-t border-slate-200/80">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-400 text-xs font-semibold"
                      icon={<RotateCcw size={13} />}
                      onClick={() => setShowResetConfirm(true)}
                      disabled={isResetting}
                    >
                      Reset Biometrik Wajah
                    </Button>
                  </div>
                )}
              </div>

              {/* Shift Kerja */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 uppercase font-semibold mb-1">
                    <Clock size={14} className="text-slate-500" />
                    Shift Kerja Presensi
                  </div>
                  <div className="font-bold text-slate-800 mt-1">
                    {pegawai.shift_template?.name || 'Default Kampus'}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {pegawai.shift_template?.start_time && pegawai.shift_template?.end_time
                      ? `${pegawai.shift_template.start_time} - ${pegawai.shift_template.end_time}`
                      : 'Mengikuti jadwal jam kerja umum instansi'}
                  </div>
                </div>
                <div className="text-2xs text-slate-400 pt-3 mt-3 border-t border-slate-200/80">
                  Konfigurasi shift dapat diubah melalui menu Edit Pegawai
                </div>
              </div>

              {/* Lokasi Kantor Geofence */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 uppercase font-semibold mb-1">
                    <MapPin size={14} className="text-slate-500" />
                    Lokasi Presensi Geofence
                  </div>
                  <div className="font-bold text-slate-800 mt-1">
                    Multi-Lokasi Kampus (Otomatis)
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {pegawai.office_location?.name
                      ? `Basis: ${pegawai.office_location.name} (dapat absen di seluruh lokasi kampus terdaftar)`
                      : 'Pegawai dapat presensi di seluruh lokasi kantor/kampus aktif terdekat'}
                  </div>
                </div>
                <div className="text-2xs text-slate-400 pt-3 mt-3 border-t border-slate-200/80">
                  Validasi radius GPS otomatis ke titik kampus/kantor terdekat
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: PENGAJARAN (SIAKAD) */}
      {activeTab === 'pengajaran' && (
        <div className="space-y-6 animate-fade-in">
          <div className="card p-6 bg-white border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <GraduationCap size={20} className="text-primary-600" />
                <div>
                  <h3 className="font-bold text-base text-slate-900">Riwayat Pengajaran Kelas Perkuliahan (SIAKAD)</h3>
                  <p className="text-xs text-slate-500">Mata kuliah yang diampu per semester beserta beban SKS</p>
                </div>
              </div>
            </div>

            <DataTable
              columns={pengajaranColumns}
              data={dossier?.pengajaran?.kelas || []}
              isLoading={false}
              emptyMessage={
                <div className="py-8 text-center text-slate-400">
                  Belum ada data riwayat kelas pengajaran tercatat di SIAKAD.
                </div>
              }
            />
          </div>

          {/* Mahasiswa Bimbingan Akademik / Wali */}
          <div className="card p-6 bg-white border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-primary-600" />
                <div>
                  <h3 className="font-bold text-base text-slate-900">Mahasiswa Bimbingan Akademik / Dosen Wali</h3>
                  <p className="text-xs text-slate-500">Daftar mahasiswa asuh perwalian akademik</p>
                </div>
              </div>
            </div>

            <DataTable
              columns={mhsWaliColumns}
              data={dossier?.pengajaran?.mahasiswa_wali || []}
              isLoading={false}
              emptyMessage={
                <div className="py-8 text-center text-slate-400">
                  Tidak ada mahasiswa perwalian yang diasuh saat ini.
                </div>
              }
            />
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: PENELITIAN & PUBLIKASI (SIPPM) */}
      {activeTab === 'penelitian' && (
        <div className="space-y-6 animate-fade-in">
          {/* Hibah Penelitian */}
          <div className="card p-6 bg-white border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen size={20} className="text-primary-600" />
                <div>
                  <h3 className="font-bold text-base text-slate-900">Hibah Penelitian Dosen (SIPPM)</h3>
                  <p className="text-xs text-slate-500">Proposal riset internal maupun eksternal yang didanai</p>
                </div>
              </div>
            </div>

            <DataTable
              columns={proposalColumns}
              data={dossier?.penelitian?.hibah_ketua || []}
              isLoading={false}
              emptyMessage={
                <div className="py-8 text-center text-slate-400">
                  Belum ada proposal hibah penelitian yang tercatat di SIPPM.
                </div>
              }
            />
          </div>

          {/* Publikasi Ilmiah */}
          <div className="card p-6 bg-white border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Award size={20} className="text-emerald-600" />
                <div>
                  <h3 className="font-bold text-base text-slate-900">Publikasi Artikel Jurnal &amp; Prosiding</h3>
                  <p className="text-xs text-slate-500">Artikel ilmiah terindeks Scopus, Sinta 1-6, dan WoS</p>
                </div>
              </div>
            </div>

            <DataTable
              columns={publikasiColumns}
              data={dossier?.penelitian?.publikasi || []}
              isLoading={false}
              emptyMessage={
                <div className="py-8 text-center text-slate-400">
                  Belum ada artikel publikasi ilmiah yang tercatat di SIPPM.
                </div>
              }
            />
          </div>

          {/* HKI & Buku */}
          <div className="card p-6 bg-white border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Layers size={20} className="text-primary-600" />
                <div>
                  <h3 className="font-bold text-base text-slate-900">Hak Cipta, Paten &amp; Buku Ajar (HKI)</h3>
                  <p className="text-xs text-slate-500">Kekayaan intelektual resmi ber-ISBN dan tercatat di Kemenkumham</p>
                </div>
              </div>
            </div>

            {dossier?.penelitian?.hki_buku && dossier.penelitian.hki_buku.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dossier.penelitian.hki_buku.map((hki) => (
                  <div key={hki.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                    <Badge variant="simpeg" className="text-2xs capitalize mb-1">{hki.jenis}</Badge>
                    <div className="font-bold text-xs text-slate-900">{hki.judul}</div>
                    <div className="text-xs text-slate-500">
                      No. Sertifikat: <span className="font-mono font-semibold">{hki.nomor_sertifikat || '-'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                Belum ada data HKI, paten, atau buku ajar tercatat.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: PENGABDIAN MASYARAKAT (SIPPM) */}
      {activeTab === 'pengabdian' && (
        <div className="space-y-6 animate-fade-in">
          <div className="card p-6 bg-white border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <HeartHandshake size={20} className="text-primary-600" />
                <div>
                  <h3 className="font-bold text-base text-slate-900">Kegiatan Pengabdian Kepada Masyarakat (PkM)</h3>
                  <p className="text-xs text-slate-500">Pemberdayaan masyarakat, pelatihan UMKM, dan kemitraan industri</p>
                </div>
              </div>
            </div>

            <DataTable
              columns={proposalColumns}
              data={dossier?.pengabdian?.hibah_ketua || []}
              isLoading={false}
              emptyMessage={
                <div className="py-8 text-center text-slate-400">
                  Belum ada kegiatan pengabdian kepada masyarakat yang tercatat di SIPPM.
                </div>
              }
            />
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: PENUNJANG & KINERJA (SIMPEG) */}
      {activeTab === 'penunjang' && (
        <div className="space-y-6 animate-fade-in">
          {/* Riwayat Evaluasi SKP */}
          <div className="card p-6 bg-white border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp size={20} className="text-primary-600" />
                <div>
                  <h3 className="font-bold text-base text-slate-900">Riwayat Sasaran Kinerja Pegawai (SKP &amp; BKD)</h3>
                  <p className="text-xs text-slate-500">Evaluasi capaian tahunan dan predikat kinerja</p>
                </div>
              </div>
            </div>

            {dossier?.penunjang?.kinerja_skp && dossier.penunjang.kinerja_skp.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dossier.penunjang.kinerja_skp.map((k) => (
                  <div key={k.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">Tahun {k.tahun} ({k.semester.toUpperCase()})</span>
                      <Badge variant="success" className="uppercase text-2xs">{k.predikat}</Badge>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-slate-900">{k.nilai_skp}</span>
                      <span className="text-xs text-slate-400">/ 100</span>
                      {k.nilai_bkd && (
                        <span className="text-xs font-semibold text-slate-600 ml-auto bg-slate-200/60 px-2 py-0.5 rounded">
                          BKD: {k.nilai_bkd} SKS
                        </span>
                      )}
                    </div>
                    {k.catatan_evaluator && (
                      <div className="text-2xs text-slate-500 italic bg-white p-2 rounded border border-slate-100">
                        &quot;{k.catatan_evaluator}&quot;
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                Belum ada evaluasi kinerja SKP yang tercatat.
              </div>
            )}
          </div>

          {/* Surat Tugas Kedinasan Luar */}
          <div className="card p-6 bg-white border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Briefcase size={20} className="text-primary-600" />
                <div>
                  <h3 className="font-bold text-base text-slate-900">Surat Tugas &amp; Kedinasan Luar Kampus</h3>
                  <p className="text-xs text-slate-500">Penugasan resmi mewakili kampus serta laporan LPJ</p>
                </div>
              </div>
            </div>

            {dossier?.penunjang?.surat_tugas && dossier.penunjang.surat_tugas.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dossier.penunjang.surat_tugas.map((st) => (
                  <div key={st.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <Badge variant="simpeg" className="text-2xs capitalize">{st.kategori_kegiatan?.nama || 'Tugas Dinas'}</Badge>
                      <Badge variant={st.status === 'disetujui' ? 'green' : 'gray'} className="text-2xs capitalize">{st.status}</Badge>
                    </div>
                    <div className="font-bold text-xs text-slate-900">{st.nama_kegiatan}</div>
                    <div className="text-xs text-slate-500">Tujuan: {st.lokasi_tujuan} • {st.tanggal_mulai ? st.tanggal_mulai.substring(0, 10) : '-'}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                Belum ada surat tugas dinas luar yang tercatat.
              </div>
            )}
          </div>

          {/* SK Penugasan Mandiri */}
          <div className="card p-6 bg-white border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-primary-600" />
                <div>
                  <h3 className="font-bold text-base text-slate-900">Surat Keputusan (SK) Mandiri &amp; Penugasan Dosen</h3>
                  <p className="text-xs text-slate-500">SK Mengajar, Pembimbingan, dan Jabatan Fungsional</p>
                </div>
              </div>
            </div>

            {dossier?.penunjang?.sk_pegawai && dossier.penunjang.sk_pegawai.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dossier.penunjang.sk_pegawai.map((sk) => (
                  <div key={sk.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <Badge variant="simpeg" className="text-2xs">{sk.kategori_sk?.nama || (sk as any).kategori?.nama || 'SK Penugasan'}</Badge>
                      <span className="text-2xs text-slate-400">{sk.tanggal_sk}</span>
                    </div>
                    <div className="font-bold text-xs text-slate-900">{sk.judul_sk}</div>
                    <div className="text-xs text-slate-500 font-mono">No: {sk.nomor_sk}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                Belum ada SK penugasan yang tercatat.
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleResetBiometric}
        title="Reset Biometrik Wajah"
        message={
          <div>
            Apakah Anda yakin ingin mereset data biometrik wajah pegawai <strong>{displayName}</strong>?
            <p className="mt-2 text-xs text-rose-600 font-semibold">
              Data vektor biometrik akan dihapus dan pegawai harus mendaftarkan ulang wajahnya melalui aplikasi mobile presensi.
            </p>
          </div>
        }
        confirmText="Ya, Reset Biometrik"
        cancelText="Batal"
        variant="danger"
        isLoading={isResetting}
      />
    </div>
  );
}
