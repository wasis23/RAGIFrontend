'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  Building2,
  Briefcase,
  GraduationCap,
  Plus,
  ArrowRight,
  TrendingUp,
  User,
  FileText,
  Calendar,
  Clock,
  DollarSign,
  Award,
  Edit3,
  Upload,
  CheckCircle,
  MapPin,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Hero } from '@/components/ui/Hero';
import { StatCard } from '@/components/ui/StatCard';
import { simpegService } from '@/services/simpeg.service';
import type { Pegawai, UnitKerja, DokumenPegawai, PengajuanCuti, PresensiPegawai, GajiPegawai, UsulanJafung } from '@/types/simpeg.types';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/utils';

export default function SimpegDashboardPage() {
  const router = useRouter();
  const { user, isAdmin, hasRole, hasPermission } = useAuth();
  const canAccess = isAdmin || hasPermission('simpeg.pegawai.manage') || hasPermission('simpeg.unit_kerja.manage');
  const canJafung = hasRole('dosen') || hasPermission('simpeg.usulan_jafung.read');

  const [loading, setLoading] = useState(true);

  // Admin Data State
  const [unitKerjaList, setUnitKerjaList] = useState<UnitKerja[]>([]);
  const [stats, setStats] = useState({
    totalPegawai: 0,
    totalDosen: 0,
    totalTendik: 0,
    totalUnitKerja: 0,
  });

  // Personal Dosen/Tendik State
  const [myPegawai, setMyPegawai] = useState<Pegawai | null>(null);
  const [myDokumen, setMyDokumen] = useState<DokumenPegawai[]>([]);
  const [myCuti, setMyCuti] = useState<PengajuanCuti[]>([]);
  const [myPresensi, setMyPresensi] = useState<PresensiPegawai[]>([]);
  const [myPayroll, setMyPayroll] = useState<GajiPegawai[]>([]);
  const [myUsulanJafung, setMyUsulanJafung] = useState<UsulanJafung[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (canAccess) {
        // Load Real-time Admin View
        const [resStats, resUnit] = await Promise.all([
          simpegService.getDashboardStats(),
          simpegService.getUnitKerjaList(),
        ]);

        if (resStats?.data) {
          setStats({
            totalPegawai: resStats.data.total_pegawai,
            totalDosen: resStats.data.total_dosen,
            totalTendik: resStats.data.total_tendik,
            totalUnitKerja: resStats.data.total_unit_kerja,
          });
        }
        setUnitKerjaList(resUnit?.data || []);
      } else {
        // Load Personal Dosen View (Anisa / Dosen Ybs)
        const resMe = await simpegService.getPegawaiMe();
        const peg = resMe.data;
        setMyPegawai(peg || null);

        if (peg) {
          // Fetch Personal Data for this Pegawai
          const [resDok, resCut, resPres, resPay, resJaf] = await Promise.allSettled([
            simpegService.getDokumenList(peg.id),
            simpegService.getCutiList(peg.id),
            simpegService.getPresensiList(peg.id),
            simpegService.getPayrollList(peg.id),
            simpegService.getUsulanJafungList(peg.id),
          ]);

          if (resDok.status === 'fulfilled') setMyDokumen(resDok.value.data || []);
          if (resCut.status === 'fulfilled') setMyCuti(resCut.value.data || []);
          if (resPres.status === 'fulfilled') setMyPresensi(resPres.value.data || []);
          if (resPay.status === 'fulfilled') setMyPayroll(resPay.value.data || []);
          if (resJaf.status === 'fulfilled') setMyUsulanJafung(resJaf.value.data || []);
        }
      }
    } catch (err: any) {
      toast.error('Gagal memuat data dashboard SIMPEG');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Auto-refresh interval (setiap 30 detik) untuk sinkronisasi realtime
    const interval = setInterval(() => {
      fetchData();
    }, 30000);

    return () => clearInterval(interval);
  }, [canAccess]);

  // -------------------------------------------------------------
  // RENDER VIEW FOR REGULAR DOSEN / TENDIK (PERSONAL PORTAL)
  // -------------------------------------------------------------
  if (!canAccess) {
    const namaDosen = myPegawai?.nama_lengkap || user?.name || user?.username || 'Pegawai';

    return (
      <div className="animate-fade-in space-y-7">
        <PageHeader
          title={`Portal Layanan Mandiri SIMPEG`}
          description={`Selamat datang, ${namaDosen} — Manajemen Data Kepegawaian, Dokumen, dan Layanan Mandiri`}
        />

        <Hero
          badge="LAYANAN MANDIRI DOSEN & TENDIK"
          title={namaDosen}
          description={
            <>
              NIP: <strong>{myPegawai?.nip || '-'}</strong> &bull; Unit Kerja: <strong>{myPegawai?.unit_kerja?.nama || '-'}</strong> &bull; Status: <span className="badge badge-simpeg">{myPegawai?.status || 'Aktif'}</span>
            </>
          }
          actions={
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => {
                  if (myPegawai?.id) {
                    router.push(`/simpeg/pegawai/${myPegawai.id}/edit`);
                  } else {
                    toast.error('Data profil pegawai sedang dimuat...');
                  }
                }}
                className="btn hero-btn-glass"
              >
                <Edit3 size={18} /> Edit Profil Saya
              </button>
            </div>
          }
        />

        {/* Layout Grid 2 Kolom: Kiri (Biodata Dosen/Tendik) & Kanan (Layanan Mandiri) */}
        <div className="simpeg-grid-2col">
          
          {/* Panel Kiri: Biodata Lengkap Pegawai */}
          <div className="flex flex-col gap-6">
            <div className="card p-6">
              <div className="simpeg-bio-header">
                <div className="simpeg-bio-avatar">
                  {namaDosen.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold">Biodata Pegawai</h3>
                  <span className="badge badge-purple uppercase text-xs">
                    {myPegawai?.jenis_pegawai || (hasRole('dosen') ? 'DOSEN' : 'TENDIK')}
                  </span>
                </div>
              </div>

              <div className="simpeg-bio-fields">
                <div>
                  <span className="simpeg-bio-label">NIP / Identitas</span>
                  <strong className="font-mono text-primary-600">{myPegawai?.nip || '-'}</strong>
                </div>
                <div>
                  <span className="simpeg-bio-label">NIK (KTP)</span>
                  <strong>{myPegawai?.nik || '-'}</strong>
                </div>
                <div>
                  <span className="simpeg-bio-label">Unit Kerja Bertugas</span>
                  <strong>{myPegawai?.unit_kerja?.nama || '-'}</strong>
                </div>
                <div>
                  <span className="simpeg-bio-label">Status Kepegawaian</span>
                  <strong className="capitalize">{myPegawai?.status_kepegawaian ? myPegawai.status_kepegawaian.replace('_', ' ') : '-'}</strong>
                </div>
                <div>
                  <span className="simpeg-bio-label">Nomor HP / WhatsApp</span>
                  <strong>{myPegawai?.telepon || '-'}</strong>
                </div>
                <div>
                  <span className="simpeg-bio-label">Alamat Tempat Tinggal</span>
                  <strong>{myPegawai?.alamat || '-'}</strong>
                </div>
              </div>
            </div>

            {/* Quick Action Navigation for Dosen / Tendik */}
            <div className="card p-5 flex flex-col gap-3">
              <h4 className="text-[0.9375rem] font-bold mb-1">Pintas Layanan Saya</h4>
              <Link href="/simpeg/dokumen" className="btn btn-outline btn-sm justify-start no-underline">
                <Upload size={16} /> Unggah Dokumen E-File
              </Link>
              <Link href="/simpeg/cuti" className="btn btn-outline btn-sm justify-start no-underline">
                <Calendar size={16} /> Ajukan Permohonan Cuti
              </Link>
              {canJafung && (
                <Link href="/simpeg/usulan-jafung" className="btn btn-outline btn-sm justify-start no-underline">
                  <Award size={16} /> Ajukan Usulan Jafung (KUM)
                </Link>
              )}
            </div>
          </div>

          {/* Panel Kanan: Data Terkait Pegawai */}
          <div className="flex flex-col gap-6">

            {/* 1. Dokumen E-File Pribadi */}
            <div className="card p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <FileText size={18} className="text-primary-600" /> Dokumen E-File Pribadi ({myDokumen.length})
                </h3>
                <Link href="/simpeg/dokumen" className="btn btn-primary btn-sm no-underline">
                  <Plus size={16} /> Kelola Berkas
                </Link>
              </div>

              {myDokumen.length === 0 ? (
                <p className="text-sm text-slate-400">Belum ada berkas E-File diunggah.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Nama Dokumen</th>
                        <th>Jenis</th>
                        <th>Ukuran</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myDokumen.slice(0, 3).map((d) => (
                        <tr key={d.id}>
                          <td className="font-semibold">{d.nama_dokumen}</td>
                          <td><span className="badge badge-purple uppercase">{d.jenis_dokumen}</span></td>
                          <td className="text-xs text-slate-400">{d.file_size || '1.5 MB'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 2. Pengajuan Cuti Saya */}
            <div className="card p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Calendar size={18} className="text-emerald-600" /> Pengajuan Cuti Saya ({myCuti.length})
                </h3>
                <Link href="/simpeg/cuti" className="btn btn-outline btn-sm no-underline">
                  <Plus size={16} /> Ajukan Cuti
                </Link>
              </div>

              {myCuti.length === 0 ? (
                <p className="text-sm text-slate-400">Belum ada riwayat pengajuan cuti.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Jenis</th>
                        <th>Periode</th>
                        <th>Hari</th>
                        <th>Status SDM</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myCuti.slice(0, 3).map((c) => (
                        <tr key={c.id}>
                          <td className="font-semibold">{(c.jenis_cuti || 'tahunan').toUpperCase()}</td>
                          <td className="text-[0.8125rem]">{formatDate(c.tanggal_mulai)} s/d {formatDate(c.tanggal_selesai)}</td>
                          <td className="font-bold text-primary-600">{c.jumlah_hari} Hari</td>
                          <td>
                            <span className={`badge ${c.status_approval === 'approved' ? 'badge-green' : c.status_approval === 'rejected' ? 'badge-red' : 'badge-yellow'}`}>
                              {c.status_approval}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 3. Slip Gaji / Payroll Saya */}
            <div className="card p-5">
              <h3 className="text-base font-bold flex items-center gap-2 mb-4">
                <DollarSign size={18} className="text-sky-600" /> Slip Gaji Saya ({myPayroll.length})
              </h3>
              {myPayroll.length === 0 ? (
                <p className="text-sm text-slate-400">Belum ada slip gaji diterbitkan.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Periode</th>
                        <th>Gaji Pokok</th>
                        <th>Take Home Pay</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myPayroll.slice(0, 3).map((p) => (
                        <tr key={p.id}>
                          <td className="font-bold font-mono">{p.periode_bulan_tahun}</td>
                          <td>Rp {p.gaji_pokok?.toLocaleString('id-ID')}</td>
                          <td className="font-bold text-emerald-600">Rp {p.gaji_bersih?.toLocaleString('id-ID')}</td>
                          <td><span className="badge badge-green">PAID</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER ADMIN VIEW (FOR SUPER ADMIN / OPERATOR SDM)
  // -------------------------------------------------------------

  return (
    <div className="animate-fade-in space-y-7">
      <PageHeader
        title="Dashboard Kepegawaian (SIMPEG Admin)"
        description="Pusat kelola Sumber Daya Manusia, Unit Kerja, dan Jabatan Universitas"
      />

      <Hero
        badge="PANEL UTAMA ADMIN SIMPEG KAMPUS"
        title="Sistem Informasi Kepegawaian Kampus"
        description="Kelola data seluruh Dosen, Tenaga Kependidikan, Unit Kerja, Jabatan, dan Riwayat SK Kepegawaian terhubung langsung dengan SSO Central Authorization."
      />

      <div className="kpi-grid">
        <StatCard
          label="Total SDM / Pegawai"
          value={loading ? '...' : stats.totalPegawai}
          icon={<Users size={22} />}
          iconVariant="indigo"
          footer={<span className="flex items-center gap-1"><TrendingUp size={14} /> Terdaftar di SSO</span>}
        />
        <StatCard
          label="Dosen Pengajar"
          value={loading ? '...' : stats.totalDosen}
          icon={<GraduationCap size={22} />}
          iconVariant="green"
          footer="NIDN / NIP Verified"
        />
        <StatCard
          label="Tenaga Kependidikan"
          value={loading ? '...' : stats.totalTendik}
          icon={<Briefcase size={22} />}
          iconVariant="cyan"
          footer="Staf & Administrasi"
        />
        <StatCard
          label="Unit Kerja"
          value={loading ? '...' : stats.totalUnitKerja}
          icon={<Building2 size={22} />}
          iconVariant="amber"
          footer="Fakultas, Prodi & Biro"
        />
      </div>

      {/* Quick Navigation Cards */}
      <div className="quick-nav-grid">
        <Link href="/simpeg/pegawai" className="card quick-nav-card no-underline">
          <div className="flex items-center justify-between mb-4">
            <div className="module-card-icon-lg">
              <Users size={22} />
            </div>
            <ArrowRight size={20} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-bold mb-1">
            Manajemen Data Pegawai
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Lihat, cari, dan kelola profil biodata lengkap seluruh Dosen & Staf Tendik kampus.
          </p>
        </Link>

        <Link href="/simpeg/unit-kerja" className="card quick-nav-card no-underline">
          <div className="flex items-center justify-between mb-4">
            <div className="module-card-icon-lg bg-amber-50 text-amber-600">
              <Building2 size={22} />
            </div>
            <ArrowRight size={20} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-bold mb-1">
            Struktur Unit Kerja
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Kelola hierarki organisasi Rektorat, Dekanat Fakultas, Program Studi, Biro, dan LP3M.
          </p>
        </Link>

        <Link href="/simpeg/jabatan" className="card quick-nav-card no-underline">
          <div className="flex items-center justify-between mb-4">
            <div className="module-card-icon-lg bg-sky-50 text-sky-600">
              <Briefcase size={22} />
            </div>
            <ArrowRight size={20} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-bold mb-1">
            Jabatan & Jafung Dosen
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Pengaturan Jabatan Struktural serta Jabatan Fungsional Akademik (Lektor, Guru Besar).
          </p>
        </Link>
      </div>
    </div>
  );
}
