'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Users,
  BookOpen,
  CalendarCheck,
  RefreshCw,
  Award,
  CheckCircle2,
  Clock,
  ArrowRight,
  Database,
  Building2,
  FileSpreadsheet,
  TrendingUp,
  Lock,
  CreditCard,
  UserCheck,
  FileText,
  PlusCircle,
  MapPin
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { siakadService } from '@/services/siakad.service';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function SiakadDashboardPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);

  // Check roles
  const userRoles = user?.roles?.map((r: any) => typeof r === 'string' ? r : r.slug) || [];
  const isMahasiswa = userRoles.includes('mahasiswa');
  const isDosen = userRoles.includes('dosen');
  const isAdmin = userRoles.includes('superadmin') || userRoles.includes('admin');

  // Student specific data
  const [studentData, setStudentData] = useState<any | null>(null);

  // Admin summary data
  const [summary, setSummary] = useState({
    tahun_akademik_aktif: null as any,
    total_mahasiswa_aktif: 0,
    total_dosen: 0,
    total_kelas: 0,
    total_kurikulum: 0,
    total_matakuliah: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (isMahasiswa) {
          const res = await siakadService.getActiveKrs();
          if (res.data) {
            setStudentData(res.data);
          }
        } else {
          const res = await siakadService.getDashboardSummary();
          if (res.data) {
            setSummary(res.data);
          }
        }
      } catch (err: any) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isMahasiswa]);

  const activeSemesterName = summary.tahun_akademik_aktif?.nama || '2024/2025 Ganjil';

  // ========================================================
  // 1. DASHBOARD MAHASISWA (PORTAL MAHASISWA MANDIRI)
  // ========================================================
  if (isMahasiswa) {
    const mhs = studentData?.mahasiswa;
    const krs = studentData?.krs;
    const isTransfer = Boolean(mhs?.konversi_transfer);

    return (
      <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
        <PageHeader
          title="Dashboard Akademik Mahasiswa"
          description="Ringkasan profil akademik, status KRS semester aktif, jadwal kuliah hari ini, dan riwayat indeks prestasi."
          action={
            <div className="flex items-center gap-2">
              <Link href="/siakad/krs">
                <Button variant="primary" icon={<PlusCircle size={15} />} className="font-bold min-h-[40px]">
                  Isi / Edit KRS
                </Button>
              </Link>
              <Link href="/sikeu/mahasiswa/tagihan">
                <Button variant="outline" icon={<CreditCard size={15} />} className="font-bold min-h-[40px]">
                  Tagihan SPP
                </Button>
              </Link>
            </div>
          }
        />

        {/* Profil Mahasiswa Banner */}
        <div className="bg-gradient-to-r from-primary-900 via-primary-800 to-slate-900 text-white rounded-2xl p-6 shadow-md space-y-4">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full text-white">
                  Semester Aktif: {krs?.tahun_akademik?.nama || '2024/2025 Ganjil'}
                </span>
                {isTransfer && (
                  <span className="badge bg-amber-400 text-slate-950 font-black text-2xs uppercase tracking-wider">
                    Jalur Transfer / Pindahan
                  </span>
                )}
                <span className="badge bg-emerald-500 text-white font-bold text-2xs uppercase">
                  Status: Mahasiswa Aktif
                </span>
              </div>
              <h2 className="text-xl font-black mt-2.5">{mhs?.nama_lengkap || 'Ahmad Fadillah'}</h2>
              <p className="text-xs text-slate-300 font-mono mt-0.5">
                NIM: {mhs?.nim || '2301001001'} • Program Studi {mhs?.program_studi?.nama || 'Teknik Informatika (S1)'} • Angkatan {mhs?.angkatan || 2023}
              </p>
              <p className="text-2xs text-slate-300 mt-2 flex items-center gap-1.5 font-medium">
                <UserCheck size={14} className="text-primary-400" />
                Dosen Pembimbing Akademik: <strong className="text-white">{mhs?.dosen_wali?.nama_lengkap || 'Dr. Ir. Ahmad Santoso, M.Kom'}</strong>
              </p>
            </div>

            <div className="flex items-center gap-3 bg-white/10 p-3.5 rounded-xl backdrop-blur-xs border border-white/10">
              <div className="text-center px-2">
                <span className="text-2xs text-slate-300 block font-semibold">SKS Diambil</span>
                <span className="text-xl font-black text-white">{krs?.total_sks_diambil || 0}</span>
              </div>
              <div className="h-8 w-px bg-white/20" />
              <div className="text-center px-2">
                <span className="text-2xs text-slate-300 block font-semibold">Status SPP</span>
                {krs?.locked_by_keuangan ? (
                  <span className="badge badge-red text-2xs font-bold mt-1">Belum Lunas</span>
                ) : (
                  <span className="badge badge-green text-2xs font-bold mt-1">Lunas (SIKEU)</span>
                )}
              </div>
              <div className="h-8 w-px bg-white/20" />
              <div className="text-center px-2">
                <span className="text-2xs text-slate-300 block font-semibold">Status KRS</span>
                <span className="badge badge-yellow text-2xs font-bold mt-1 uppercase">{krs?.status || 'DRAFT'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Metrik Indeks Prestasi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs">
            <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">Indeks Prestasi Semester (IPS)</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-primary-700">3.85</span>
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-0.5">
                <TrendingUp size={13} /> Sangat Memuaskan
              </span>
            </div>
          </div>

          <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs">
            <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">Indeks Prestasi Kumulatif (IPK)</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-slate-900">3.85</span>
              <span className="text-2xs text-slate-400 font-semibold">Skala 4.00</span>
            </div>
          </div>

          <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs">
            <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">Beban SKS Semester</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-slate-900">{krs?.total_sks_diambil || 20}</span>
              <span className="text-2xs text-slate-400 font-semibold">Maks. 24 SKS</span>
            </div>
          </div>

          <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs">
            <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">Total SKS Lulus Kumulatif</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-slate-900">
                {isTransfer ? 44 : 20}
              </span>
              <span className="text-2xs text-emerald-600 font-bold">
                {isTransfer ? 'Termasuk 24 SKS Transfer' : 'Target: 144 SKS'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Shortcut Akses Mahasiswa */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <Link
            href="/siakad/krs"
            className="p-4 bg-white border border-slate-200/80 hover:border-primary-300 hover:shadow-sm rounded-xl transition flex items-center gap-3.5 group"
          >
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center font-bold">
              <BookOpen size={18} />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-xs group-hover:text-primary-700 transition">KRS Semester Ini</p>
              <p className="text-2xs text-slate-500">Ambil & atur mata kuliah</p>
            </div>
          </Link>

          <Link
            href="/siakad/perkuliahan/kelas"
            className="p-4 bg-white border border-slate-200/80 hover:border-primary-300 hover:shadow-sm rounded-xl transition flex items-center gap-3.5 group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <CalendarCheck size={18} />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-xs group-hover:text-primary-700 transition">Jadwal Kuliah & RPS</p>
              <p className="text-2xs text-slate-500">Jadwal ruang & silabus OBE</p>
            </div>
          </Link>

          <Link
            href="/siakad/nilai"
            className="p-4 bg-white border border-slate-200/80 hover:border-primary-300 hover:shadow-sm rounded-xl transition flex items-center gap-3.5 group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <Award size={18} />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-xs group-hover:text-primary-700 transition">KHS & Nilai Mutu</p>
              <p className="text-2xs text-slate-500">Transkrip & evaluasi studi</p>
            </div>
          </Link>

          <Link
            href="/sikeu/mahasiswa/tagihan"
            className="p-4 bg-white border border-slate-200/80 hover:border-primary-300 hover:shadow-sm rounded-xl transition flex items-center gap-3.5 group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <CreditCard size={18} />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-xs group-hover:text-primary-700 transition">Tagihan UKT / SPP</p>
              <p className="text-2xs text-slate-500">Status keuangan SIKEU</p>
            </div>
          </Link>
        </div>

        {/* Jadwal Kuliah Terdaftar di KRS */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Jadwal Perkuliahan Terdaftar</h3>
              <p className="text-xs text-slate-500">Jadwal tatap muka mingguan kelas yang telah diambil.</p>
            </div>
            <Link href="/siakad/perkuliahan/kelas">
              <Button variant="outline" className="text-xs font-bold">
                Lihat Semua & RPS
              </Button>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">MATA KULIAH</th>
                  <th className="py-2.5 px-3">HARI & WAKTU</th>
                  <th className="py-2.5 px-3">RUANGAN</th>
                  <th className="py-2.5 px-3">DOSEN PENGAMPU</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {krs?.krs_details?.length === 0 ? (
                  <tr><td colSpan={4} className="py-6 text-center text-slate-400">Belum ada mata kuliah yang diambil di KRS</td></tr>
                ) : (
                  krs?.krs_details?.map((detail: any) => (
                    <tr key={detail.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900">{detail.kelas?.mata_kuliah?.nama}</span>
                        <span className="text-2xs text-slate-400 block font-normal font-mono">
                          {detail.kelas?.mata_kuliah?.kode_mk} • {detail.kelas?.mata_kuliah?.total_sks} SKS
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-800 capitalize flex items-center gap-1">
                          <Clock size={12} className="text-primary-600" />
                          {detail.kelas?.hari}, {detail.kelas?.jam_mulai?.slice(0, 5)} - {detail.kelas?.jam_selesai?.slice(0, 5)}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="badge badge-blue text-2xs font-bold inline-flex items-center gap-1">
                          <MapPin size={10} /> {detail.kelas?.ruangan?.nama || 'Ruang Kuliah'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        {detail.kelas?.dosen_pengampu?.[0]?.dosen?.nama_lengkap || 'Dosen Pengampu'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ========================================================
  // 2. DASHBOARD ADMINISTRATOR BAAK & SUPERADMIN
  // ========================================================
  const stats = [
    {
      title: 'Total Mahasiswa Aktif',
      value: summary.total_mahasiswa_aktif.toString(),
      desc: 'Mahasiswa aktif terdaftar',
      icon: <GraduationCap size={22} className="text-primary-600" />,
      bg: 'bg-primary-50',
    },
    {
      title: 'Dosen Pengampu',
      value: summary.total_dosen.toString(),
      desc: 'Dosen homebase & pengampu',
      icon: <Users size={22} className="text-blue-600" />,
      bg: 'bg-blue-50',
    },
    {
      title: 'Kelas Perkuliahan',
      value: summary.total_kelas.toString(),
      desc: `Semester ${activeSemesterName}`,
      icon: <CalendarCheck size={22} className="text-emerald-600" />,
      bg: 'bg-emerald-50',
    },
    {
      title: 'Total Mata Kuliah',
      value: summary.total_matakuliah.toString(),
      desc: `${summary.total_kurikulum} Kurikulum aktif`,
      icon: <BookOpen size={22} className="text-purple-600" />,
      bg: 'bg-purple-50',
    },
  ];

  const quickNavs = [
    {
      title: 'Master Kurikulum & MK',
      desc: 'Struktur kurikulum, mata kuliah, dan prasyarat',
      icon: <BookOpen size={20} className="text-blue-600" />,
      href: '/siakad/master/kurikulum',
    },
    {
      title: 'Data Mahasiswa & NIM',
      desc: 'Generate NIM dan kelola data mahasiswa aktif',
      icon: <GraduationCap size={20} className="text-indigo-600" />,
      href: '/siakad/civitas/mahasiswa',
    },
    {
      title: 'Konversi Nilai Transfer',
      desc: 'Penyetaraan matakuliah mahasiswa pindahan',
      icon: <FileSpreadsheet size={20} className="text-amber-600" />,
      href: '/siakad/civitas/konversi',
    },
    {
      title: 'Jadwal & Ruang Kelas',
      desc: 'Alokasi ruang SINAPRA dan dosen pengampu',
      icon: <CalendarCheck size={20} className="text-emerald-600" />,
      href: '/siakad/perkuliahan/kelas',
    },
    {
      title: 'Rencana Studi (KRS)',
      desc: 'Persetujuan KRS & validasi tagihan SIKEU',
      icon: <CheckCircle2 size={20} className="text-teal-600" />,
      href: '/siakad/krs',
    },
    {
      title: 'Sinkronisasi Neo Feeder',
      desc: 'Integrasi dan push data ke PDDIKTI',
      icon: <Database size={20} className="text-purple-600" />,
      href: '/siakad/feeder-sync',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <PageHeader
        title="Sistem Informasi Akademik (SIAKAD)"
        description="Portal operasional akademik, kurikulum, perkuliahan, penilaian, dan sinkronisasi Neo Feeder PDDIKTI."
        action={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link href="/siakad/feeder-sync">
              <Button variant="outline" icon={<RefreshCw size={16} />} className="font-bold min-h-[40px]">
                Sync Feeder
              </Button>
            </Link>
            <Link href="/siakad/civitas/mahasiswa">
              <Button variant="primary" icon={<GraduationCap size={16} />} className="font-bold min-h-[40px] px-4 shadow-sm">
                Kelola Mahasiswa
              </Button>
            </Link>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs flex items-center justify-between hover:border-primary-200 transition"
          >
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{stat.title}</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
                {loading ? '...' : stat.value}
              </p>
              <p className="text-2xs text-slate-400 font-semibold mt-0.5">{stat.desc}</p>
            </div>
            <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center flex-shrink-0`}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Navigation Menu */}
      <div className="space-y-3">
        <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Modul Operasional SIAKAD</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {quickNavs.map((nav, idx) => (
            <Link
              key={idx}
              href={nav.href}
              className="p-4 bg-white border border-slate-200/80 hover:border-primary-300 hover:shadow-sm rounded-xl transition flex flex-col justify-between group"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-primary-50 transition flex items-center justify-center flex-shrink-0">
                  {nav.icon}
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm group-hover:text-primary-700 transition">
                    {nav.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{nav.desc}</p>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-end text-xs font-bold text-primary-600 group-hover:translate-x-1 transition-transform">
                <span>Buka Modul</span>
                <ArrowRight size={14} className="ml-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
