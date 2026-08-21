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
  UserCheck,
  CreditCard,
  PlusCircle,
  MapPin,
  Sparkles,
  Layers,
  TrendingUp
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge, StatusBadge } from '@/components/ui/Badge';
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

  const activeSemesterName = summary.tahun_akademik_aktif?.nama || '2026/2027 Ganjil';

  // ========================================================
  // 1. DASHBOARD MAHASISWA (PORTAL MAHASISWA MANDIRI)
  // ========================================================
  if (isMahasiswa) {
    const mhs = studentData?.mahasiswa;
    const krs = studentData?.krs;
    const isTransfer = Boolean(mhs?.konversi_transfer);

    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Dashboard Akademik Mahasiswa"
          description="Ringkasan profil akademik, status KRS semester aktif, jadwal kuliah, dan capaian OBE."
          breadcrumbs={[
            { label: 'Portal SSO', href: '/dashboard' },
            { label: 'SIAKAD' },
            { label: 'Portal Mahasiswa' },
          ]}
          action={
            <div className="flex items-center gap-2">
              <Link href="/siakad/krs">
                <Button variant="primary" icon={<PlusCircle size={15} />} className="font-bold">
                  Isi / Edit KRS
                </Button>
              </Link>
              <Link href="/sikeu/mahasiswa/tagihan">
                <Button variant="outline" icon={<CreditCard size={15} />} className="font-bold">
                  Tagihan SPP
                </Button>
              </Link>
            </div>
          }
        />

        {/* Profil Mahasiswa Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 text-white shadow-md">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge active={true} />
                <Badge variant="blue">
                  Semester: {krs?.tahun_akademik?.nama || '2026/2027 Ganjil'}
                </Badge>
                {isTransfer && (
                  <Badge variant="amber">
                    Jalur Transfer / Pindahan
                  </Badge>
                )}
                <Badge variant="green">
                  Mahasiswa Aktif
                </Badge>
              </div>

              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white mt-1">
                {mhs?.nama_lengkap || user?.username || 'Ahmad Fadillah'}
              </h2>
              <p className="text-xs text-slate-300 font-mono">
                NIM: {mhs?.nim || user?.username || '2301001001'} • Program Studi {mhs?.program_studi?.nama || 'Teknik Informatika (S1)'} • Angkatan {mhs?.angkatan || 2026}
              </p>
              <p className="text-xs text-slate-300 flex items-center gap-1.5 font-medium pt-1">
                <UserCheck size={14} className="text-primary-400" />
                Dosen Pembimbing Akademik (PA): <strong className="text-white">{mhs?.dosen_wali?.nama_lengkap || 'Dr. Budi Utomo, M.Kom'}</strong>
              </p>
            </div>

            {/* Quick SKS & SPP Card */}
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 shrink-0">
              <div className="text-center px-1">
                <span className="text-2xs text-slate-300 block font-semibold">SKS Diambil</span>
                <span className="text-2xl font-black text-white font-mono">{krs?.total_sks_diambil || 0}</span>
              </div>
              <div className="h-8 w-px bg-white/20" />
              <div className="text-center px-1">
                <span className="text-2xs text-slate-300 block font-semibold">Status SPP</span>
                {krs?.locked_by_keuangan ? (
                  <Badge variant="rose" className="mt-1 font-bold">Belum Lunas</Badge>
                ) : (
                  <Badge variant="green" className="mt-1 font-bold">Lunas (SIKEU)</Badge>
                )}
              </div>
              <div className="h-8 w-px bg-white/20" />
              <div className="text-center px-1">
                <span className="text-2xs text-slate-300 block font-semibold">Status KRS</span>
                <Badge variant="amber" className="mt-1 font-bold uppercase">{krs?.status || 'DRAFT'}</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Metrik Indeks Prestasi Grid (Sinkron Data Riil) */}
        {(() => {
          const akademik = studentData?.akademik_summary || {
            ipk: '0.00',
            ips: '0.00',
            total_sks_lulus: 0,
            total_sks_diambil: krs?.total_sks_diambil || 0,
          };
          const ipkNum = parseFloat(akademik.ipk) || 0;
          const ipsNum = parseFloat(akademik.ips) || 0;

          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card p-5 flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Indeks Prestasi Semester (IPS)
                  </span>
                  <div className="p-2 rounded-xl text-primary-700 bg-primary-50">
                    <Award size={18} />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-2xl font-bold text-slate-900 font-mono">{akademik.ips}</div>
                  <div className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    {ipsNum > 0 ? (
                      <>
                        <TrendingUp size={13} /> {ipsNum >= 3.51 ? 'Dengan Pujian' : ipsNum >= 3.0 ? 'Sangat Memuaskan' : 'Memuaskan'}
                      </>
                    ) : (
                      <span className="text-slate-400 font-normal">Belum Ada Nilai Terbit</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="card p-5 flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    IPK Kumulatif
                  </span>
                  <div className="p-2 rounded-xl text-emerald-700 bg-emerald-50">
                    <GraduationCap size={18} />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-2xl font-bold text-slate-900 font-mono">{akademik.ipk}</div>
                  <div className="text-xs text-slate-500 font-medium">
                    {ipkNum > 0 ? 'Skala 4.00 (SN-DIKTI)' : 'Mahasiswa Baru (Semester 1)'}
                  </div>
                </div>
              </div>

              <div className="card p-5 flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Beban SKS Semester
                  </span>
                  <div className="p-2 rounded-xl text-blue-700 bg-blue-50">
                    <BookOpen size={18} />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-2xl font-bold text-slate-900 font-mono">{krs?.total_sks_diambil || 0} SKS</div>
                  <div className="text-xs text-slate-500 font-medium">Maksimal Beban: 24 SKS</div>
                </div>
              </div>

              <div className="card p-5 flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total SKS Lulus
                  </span>
                  <div className="p-2 rounded-xl text-purple-700 bg-purple-50">
                    <CheckCircle2 size={18} />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-2xl font-bold text-slate-900 font-mono">{akademik.total_sks_lulus || 0} SKS</div>
                  <div className="text-xs text-emerald-600 font-semibold">
                    {isTransfer ? 'Termasuk SKS Penyetaraan' : 'Target: 144 SKS Kelulusan'}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Quick Menu Shortcuts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
          <Link
            href="/siakad/krs"
            className="card p-4 hover:border-primary-300 hover:shadow-md transition flex items-center gap-3.5 group"
          >
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center font-bold">
              <BookOpen size={18} />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-xs group-hover:text-primary-700 transition">KRS Online</p>
              <p className="text-2xs text-slate-500">Ambil & batalkan kelas</p>
            </div>
          </Link>

          <Link
            href="/siakad/nilai"
            className="card p-4 hover:border-primary-300 hover:shadow-md transition flex items-center gap-3.5 group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <Award size={18} />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-xs group-hover:text-primary-700 transition">KHS & Transkrip</p>
              <p className="text-2xs text-slate-500">Nilai & Mutu Akademik</p>
            </div>
          </Link>

          <Link
            href="/siakad/nilai"
            className="card p-4 hover:border-primary-300 hover:shadow-md transition flex items-center gap-3.5 group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <Layers size={18} />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-xs group-hover:text-primary-700 transition">Portofolio OBE</p>
              <p className="text-2xs text-slate-500">Capaian CPL & CPMK</p>
            </div>
          </Link>

          <Link
            href="/sikeu/mahasiswa/tagihan"
            className="card p-4 hover:border-primary-300 hover:shadow-md transition flex items-center gap-3.5 group"
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
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Jadwal Perkuliahan Terdaftar</h3>
              <p className="text-xs text-slate-500">Jadwal tatap muka mingguan kelas yang telah disetujui di KRS.</p>
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
                  <th className="py-2.5 px-3">RUANGAN (SINAPRA)</th>
                  <th className="py-2.5 px-3">DOSEN PENGAMPU</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {krs?.krs_details?.length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-slate-400">Belum ada mata kuliah yang diambil di KRS semester ini</td></tr>
                ) : (
                  krs?.krs_details?.map((detail: any) => (
                    <tr key={detail.id} className="hover:bg-slate-50/80 transition">
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
                        <Badge variant="blue" className="inline-flex items-center gap-1">
                          <MapPin size={10} /> {detail.kelas?.ruangan?.nama || 'Ruang Kuliah'}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-medium">
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
  // 2. DASHBOARD ADMINISTRATOR BAAK & DOSEN
  // ========================================================
  const stats = [
    {
      title: 'Total Mahasiswa Aktif',
      value: summary.total_mahasiswa_aktif.toString(),
      desc: 'Mahasiswa aktif terdaftar',
      icon: <GraduationCap size={20} />,
      variant: 'stat-icon-blue',
    },
    {
      title: 'Dosen Pengampu',
      value: summary.total_dosen.toString(),
      desc: 'Dosen homebase & pengampu',
      icon: <Users size={20} />,
      variant: 'stat-icon-indigo',
    },
    {
      title: 'Kelas Perkuliahan',
      value: summary.total_kelas.toString(),
      desc: `Semester ${activeSemesterName}`,
      icon: <CalendarCheck size={20} />,
      variant: 'stat-icon-green',
    },
    {
      title: 'Total Mata Kuliah',
      value: summary.total_matakuliah.toString(),
      desc: `${summary.total_kurikulum} Kurikulum aktif`,
      icon: <BookOpen size={20} />,
      variant: 'stat-icon-amber',
    },
  ];

  const quickNavs = [
    {
      title: 'Master Kurikulum & MK',
      desc: 'Struktur kurikulum, mata kuliah, dan prasyarat',
      icon: <BookOpen size={20} className="text-blue-600" />,
      href: '/siakad/master/kurikulum',
      badge: 'Master Data',
    },
    {
      title: 'Data Mahasiswa & NIM',
      desc: 'Generate NIM dan kelola data mahasiswa aktif',
      icon: <GraduationCap size={20} className="text-indigo-600" />,
      href: '/siakad/civitas/mahasiswa',
      badge: 'Civitas',
    },
    {
      title: 'Konversi Nilai Transfer',
      desc: 'Penyetaraan matakuliah mahasiswa pindahan',
      icon: <FileSpreadsheet size={20} className="text-amber-600" />,
      href: '/siakad/civitas/konversi',
      badge: 'Civitas',
    },
    {
      title: 'Jadwal & Ruang Kelas',
      desc: 'Alokasi ruang SINAPRA dan dosen pengampu',
      icon: <CalendarCheck size={20} className="text-emerald-600" />,
      href: '/siakad/perkuliahan/kelas',
      badge: 'Perkuliahan',
    },
    {
      title: 'Rencana Studi (KRS)',
      desc: 'Persetujuan KRS & validasi tagihan SIKEU',
      icon: <CheckCircle2 size={20} className="text-teal-600" />,
      href: '/siakad/krs',
      badge: 'Bimbingan PA',
    },
    {
      title: 'Penilaian KHS & OBE',
      desc: 'Input nilai asesmen dan capaian CPMK',
      icon: <Award size={20} className="text-rose-600" />,
      href: '/siakad/nilai',
      badge: 'OBE Grading',
    },
    {
      title: 'Kurikulum & RPS OBE',
      desc: 'Penyusunan CPL, CPMK, dan approval RPS',
      icon: <Layers size={20} className="text-sky-600" />,
      href: '/siakad/obe',
      badge: 'SN-DIKTI',
    },
    {
      title: 'Sinkronisasi Neo Feeder',
      desc: 'Integrasi dan push data ke PDDIKTI',
      icon: <Database size={20} className="text-purple-600" />,
      href: '/siakad/feeder-sync',
      badge: 'WS Dikti',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Sistem Informasi Akademik (SIAKAD)"
        description="Pusat operasional akademik, kurikulum OBE, perkuliahan terpadu, dan sinkronisasi Neo Feeder PDDIKTI."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD' },
        ]}
        action={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link href="/siakad/feeder-sync">
              <Button variant="outline" icon={<RefreshCw size={15} />} className="font-bold">
                Sync Feeder
              </Button>
            </Link>
            <Link href="/siakad/civitas/mahasiswa">
              <Button variant="primary" icon={<GraduationCap size={15} />} className="font-bold shadow-xs">
                Kelola Mahasiswa
              </Button>
            </Link>
          </div>
        }
      />

      {/* Stats Cards Grid (Matching SSO Dashboard) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="card p-5 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {stat.title}
              </span>
              <div className="p-2 rounded-xl text-slate-700 bg-slate-100">
                {stat.icon}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-2xl font-bold text-slate-900 font-mono">
                {loading ? '...' : stat.value}
              </div>
              <div className="text-xs text-slate-500 font-medium">{stat.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Modul Operasional Grid */}
      <section className="space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Modul &amp; Layanan Akademik Terpadu</h3>
          <p className="text-xs text-slate-500">
            Akses cepat ke seluruh pengelolaan perkuliahan, kurikulum OBE, dan sinkronisasi data
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickNavs.map((nav, idx) => (
            <Link
              key={idx}
              href={nav.href}
              className="card p-5 hover:border-primary-300 hover:shadow-md transition flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-primary-50 transition flex items-center justify-center">
                    {nav.icon}
                  </div>
                  {nav.badge && (
                    <Badge variant="blue" className="text-[10px] font-bold">
                      {nav.badge}
                    </Badge>
                  )}
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm group-hover:text-primary-700 transition">
                    {nav.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{nav.desc}</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end text-xs font-bold text-primary-600 group-hover:translate-x-1 transition-transform">
                <span>Buka Modul</span>
                <ArrowRight size={14} className="ml-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
