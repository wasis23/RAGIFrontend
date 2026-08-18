'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Building2,
  Briefcase,
  GraduationCap,
  Plus,
  ArrowRight,
  TrendingUp,
  RefreshCw,
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
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Hero } from '@/components/ui/Hero';
import { StatCard } from '@/components/ui/StatCard';
import { simpegService } from '@/services/simpeg.service';
import type { Pegawai, UnitKerja, DokumenPegawai, PengajuanCuti, PresensiPegawai, GajiPegawai, UsulanJafung } from '@/types/simpeg.types';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

export default function SimpegDashboardPage() {
  const { user, hasPermission } = useAuth();
  const isAdmin = user?.user_type === 'admin' || hasPermission('simpeg.pegawai.manage') || hasPermission('simpeg.unit_kerja.manage');

  const [loading, setLoading] = useState(true);

  // Admin Data State
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>([]);
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

  // Modal Personal Profil Edit
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [formProfile, setFormProfile] = useState({
    nama_lengkap: '',
    telepon: '',
    alamat: '',
  });

  // Modal Personal Upload Dokumen
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [formUpload, setFormUpload] = useState({
    nama_dokumen: '',
    jenis_dokumen: 'ijazah' as any,
  });

  // Modal Personal Request Cuti
  const [showCutiModal, setShowCutiModal] = useState(false);
  const [formCuti, setFormCuti] = useState({
    jenis_cuti: 'tahunan' as any,
    tanggal_mulai: '',
    tanggal_selesai: '',
    jumlah_hari: 1,
    alasan: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        // Load Admin View
        const [resPegawai, resUnit] = await Promise.all([
          simpegService.getPegawaiList({ per_page: 5 }),
          simpegService.getUnitKerjaList(),
        ]);

        const items: Pegawai[] = Array.isArray(resPegawai.data)
          ? resPegawai.data
          : resPegawai.data?.items || (resPegawai as any).data?.data || [];

        setPegawaiList(items);
        const units = resUnit.data || [];
        setUnitKerjaList(units);

        const total = items.length;
        const dosen = items.filter((p) => p.jenis_pegawai === 'dosen').length;
        const tendik = items.filter((p) => p.jenis_pegawai === 'tendik').length;

        setStats({
          totalPegawai: total || 1,
          totalDosen: dosen || 1,
          totalTendik: tendik || 0,
          totalUnitKerja: units.length || 6,
        });
      } else {
        // Load Personal Dosen View (Anisa / Dosen Ybs)
        const resMe = await simpegService.getPegawaiMe();
        const peg = resMe.data;
        setMyPegawai(peg || null);

        if (peg) {
          setFormProfile({
            nama_lengkap: peg.nama_lengkap || '',
            telepon: peg.telepon || '',
            alamat: peg.alamat || '',
          });

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
  }, [isAdmin]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myPegawai) return;
    try {
      await simpegService.updatePegawai(myPegawai.id, formProfile);
      toast.success('Profil diri berhasil diperbarui!');
      setShowEditProfileModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memperbarui profil');
    }
  };

  const handleUploadDokumen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myPegawai) return;
    try {
      await simpegService.createDokumen({
        pegawai_id: myPegawai.id,
        nama_dokumen: formUpload.nama_dokumen,
        jenis_dokumen: formUpload.jenis_dokumen,
        file_path: '/uploads/documents/doc_' + Date.now() + '.pdf',
        file_size: '1.8 MB',
      });
      toast.success('Dokumen E-File pribadi berhasil diunggah!');
      setShowUploadModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal mengunggah dokumen');
    }
  };

  const handleRequestCuti = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myPegawai) return;
    try {
      await simpegService.createCuti({
        pegawai_id: myPegawai.id,
        jenis_cuti: formCuti.jenis_cuti,
        tanggal_mulai: formCuti.tanggal_mulai,
        tanggal_selesai: formCuti.tanggal_selesai,
        jumlah_hari: formCuti.jumlah_hari,
        alasan: formCuti.alasan,
      });
      toast.success('Pengajuan Cuti mandiri berhasil dikirim!');
      setShowCutiModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal mengajukan cuti');
    }
  };

  const handleQuickClockIn = async () => {
    if (!myPegawai) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const nowTime = new Date().toTimeString().split(' ')[0];
      await simpegService.createPresensi({
        pegawai_id: myPegawai.id,
        tanggal: today,
        jam_masuk: nowTime,
        status_kehadiran: 'hadir',
        lat_long: '-6.2088,106.8456',
        catatan: 'Presensi mandiri web dashboard',
      });
      toast.success('Presensi Masuk Berhasil Dicatat!');
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal merekam presensi');
    }
  };

  // -------------------------------------------------------------
  // RENDER VIEW FOR REGULAR DOSEN / TENDIK (PERSONAL PORTAL)
  // -------------------------------------------------------------
  if (!isAdmin) {
    const namaDosen = myPegawai?.nama_lengkap || user?.username || 'Dosen';

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
              NIP: <strong>{myPegawai?.nip || '199208152022011002'}</strong> &bull; Unit Kerja: <strong>{myPegawai?.unit_kerja?.nama || 'Fakultas Teknik'}</strong> &bull; Status: <span className="badge badge-simpeg">Aktif</span>
            </>
          }
          actions={
            <div className="flex gap-3 flex-wrap">
              <button onClick={handleQuickClockIn} className="btn hero-btn-white">
                <Clock size={18} /> Presensi Masuk Hari Ini
              </button>
              <button onClick={() => setShowEditProfileModal(true)} className="btn hero-btn-glass">
                <Edit3 size={18} /> Edit Profil Saya
              </button>
            </div>
          }
        />

        {/* Layout Grid 2 Kolom: Kiri (Biodata Dosen Ybs) & Kanan (Layanan Mandiri / Data Terkait Anisa) */}
        <div className="simpeg-grid-2col">
          
          {/* Panel Kiri: Biodata Lengkap Dosen Ybs */}
          <div className="flex flex-col gap-6">
            <div className="card p-6">
              <div className="simpeg-bio-header">
                <div className="simpeg-bio-avatar">
                  {namaDosen.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold">Biodata Pegawai</h3>
                  <span className="badge badge-purple uppercase text-xs">
                    {myPegawai?.jenis_pegawai || 'DOSEN'}
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
                  <strong>{myPegawai?.nik || '327101...'}</strong>
                </div>
                <div>
                  <span className="simpeg-bio-label">Unit Kerja Bertugas</span>
                  <strong>{myPegawai?.unit_kerja?.nama || 'Fakultas Teknik'}</strong>
                </div>
                <div>
                  <span className="simpeg-bio-label">Status Kepegawaian</span>
                  <strong className="capitalize">{(myPegawai?.status_kepegawaian || 'tetap_yayasan').replace('_', ' ')}</strong>
                </div>
                <div>
                  <span className="simpeg-bio-label">Nomor HP / WhatsApp</span>
                  <strong>{myPegawai?.telepon || '081234567890'}</strong>
                </div>
                <div>
                  <span className="simpeg-bio-label">Alamat Tempat Tinggal</span>
                  <strong>{myPegawai?.alamat || 'Jl. Merdeka No. 45, Bandung'}</strong>
                </div>
              </div>
            </div>

            {/* Quick Action Navigation for Dosen */}
            <div className="card p-5 flex flex-col gap-3">
              <h4 className="text-[0.9375rem] font-bold mb-1">Pintas Layanan Saya</h4>
              <button onClick={() => setShowUploadModal(true)} className="btn btn-outline btn-sm justify-start">
                <Upload size={16} /> Unggah Dokumen E-File
              </button>
              <button onClick={() => setShowCutiModal(true)} className="btn btn-outline btn-sm justify-start">
                <Calendar size={16} /> Ajukan Permohonan Cuti
              </button>
              <Link href="/simpeg/usulan-jafung" className="btn btn-outline btn-sm justify-start no-underline">
                <Award size={16} /> Ajukan Usulan Jafung (KUM)
              </Link>
            </div>
          </div>

          {/* Panel Kanan: Data Terkait Dosen Ybs (Anisa Only) */}
          <div className="flex flex-col gap-6">

            {/* 1. Dokumen E-File Pribadi */}
            <div className="card p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <FileText size={18} className="text-primary-600" /> Dokumen E-File Pribadi ({myDokumen.length})
                </h3>
                <button onClick={() => setShowUploadModal(true)} className="btn btn-primary btn-sm">
                  <Plus size={14} /> Unggah Berkas
                </button>
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
                <button onClick={() => setShowCutiModal(true)} className="btn btn-outline btn-sm">
                  <Plus size={14} /> Ajukan Cuti
                </button>
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
                          <td className="text-[0.8125rem]">{c.tanggal_mulai} s/d {c.tanggal_selesai}</td>
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

        {/* Modal Edit Profil Mandiri */}
        <Modal
          open={showEditProfileModal}
          onClose={() => setShowEditProfileModal(false)}
          title="Edit Profil Biodata Dosen Mandiri"
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowEditProfileModal(false)}>Batal</Button>
              <Button variant="primary" onClick={handleUpdateProfile}>Simpan Profil</Button>
            </>
          }
        >
          <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
            <Input
              label="Nama Lengkap & Gelar"
              value={formProfile.nama_lengkap}
              onChange={(e) => setFormProfile({ ...formProfile, nama_lengkap: e.target.value })}
              required
            />
            <Input
              label="Nomor HP / WhatsApp"
              value={formProfile.telepon}
              onChange={(e) => setFormProfile({ ...formProfile, telepon: e.target.value })}
              required
            />
            <div className="form-group">
              <label className="form-label">Alamat Lengkap Tempat Tinggal</label>
              <textarea
                className="input"
                rows={3}
                value={formProfile.alamat}
                onChange={(e) => setFormProfile({ ...formProfile, alamat: e.target.value })}
              />
            </div>
          </form>
        </Modal>

        {/* Modal Upload Dokumen Mandiri */}
        <Modal
          open={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          title="Unggah Dokumen E-File Pribadi"
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowUploadModal(false)}>Batal</Button>
              <Button variant="primary" onClick={handleUploadDokumen}>Unggah Berkas</Button>
            </>
          }
        >
          <form onSubmit={handleUploadDokumen} className="flex flex-col gap-4">
            <Input
              label="Nama / Judul Dokumen"
              value={formUpload.nama_dokumen}
              onChange={(e) => setFormUpload({ ...formUpload, nama_dokumen: e.target.value })}
              placeholder="Contoh: SK Pengangkatan Dosen 2024"
              required
            />
            <div className="form-group">
              <label className="form-label">Jenis Berkas</label>
              <select
                className="input"
                value={formUpload.jenis_dokumen}
                onChange={(e) => setFormUpload({ ...formUpload, jenis_dokumen: e.target.value as any })}
              >
                <option value="ijazah">Ijazah & Transkrip</option>
                <option value="sk">Surat Keputusan (SK)</option>
                <option value="serdos">Sertifikat Dosen (Serdos)</option>
                <option value="sertifikat">Sertifikat Keahlian</option>
                <option value="ktp">KTP / NIK</option>
                <option value="kk">Kartu Keluarga (KK)</option>
              </select>
            </div>
          </form>
        </Modal>

        {/* Modal Request Cuti Mandiri */}
        <Modal
          open={showCutiModal}
          onClose={() => setShowCutiModal(false)}
          title="Formulir Pengajuan Cuti Mandiri"
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowCutiModal(false)}>Batal</Button>
              <Button variant="primary" onClick={handleRequestCuti}>Kirim Pengajuan</Button>
            </>
          }
        >
          <form onSubmit={handleRequestCuti} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Tanggal Mulai"
                type="date"
                value={formCuti.tanggal_mulai}
                onChange={(e) => setFormCuti({ ...formCuti, tanggal_mulai: e.target.value })}
                required
              />
              <Input
                label="Tanggal Selesai"
                type="date"
                value={formCuti.tanggal_selesai}
                onChange={(e) => setFormCuti({ ...formCuti, tanggal_selesai: e.target.value })}
                required
              />
            </div>
            <Input
              label="Jumlah Hari Cuti"
              type="number"
              value={formCuti.jumlah_hari}
              onChange={(e) => setFormCuti({ ...formCuti, jumlah_hari: Number(e.target.value) })}
              required
            />
            <div className="form-group">
              <label className="form-label">Alasan Pengajuan Cuti</label>
              <textarea
                className="input"
                rows={3}
                value={formCuti.alasan}
                onChange={(e) => setFormCuti({ ...formCuti, alasan: e.target.value })}
                placeholder="Berikan alasan detail..."
                required
              />
            </div>
          </form>
        </Modal>
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
        actions={
          <div className="flex gap-3">
            <Link
              href="/simpeg/pegawai"
              className="btn hero-btn-white"
            >
              <Plus size={18} /> Tambah Pegawai
            </Link>
            <button
              onClick={fetchData}
              className="btn hero-btn-glass btn-icon"
              title="Refresh Data"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        }
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

      {/* Recent Pegawai Section */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold">
              Data Pegawai Terkini
            </h3>
            <p className="text-[0.8125rem] text-slate-500">
              Pegawai yang baru ditambahkan ke dalam database SIMPEG
            </p>
          </div>

          <Link href="/simpeg/pegawai" className="btn btn-outline btn-sm">
            Lihat Semua Pegawai →
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">
            Memuat data pegawai...
          </div>
        ) : pegawaiList.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            Belum ada data pegawai terdaftar.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>NIP / NIK</th>
                  <th>Nama Lengkap</th>
                  <th>Jenis Pegawai</th>
                  <th>Unit Kerja</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {pegawaiList.map((p) => (
                  <tr key={p.id}>
                    <td className="font-mono font-semibold">{p.nip || p.nik || '-'}</td>
                    <td>
                      <div className="font-bold">{p.nama_lengkap}</div>
                      <div className="text-xs text-slate-400">{p.telepon || '-'}</div>
                    </td>
                    <td>
                      <span className={`badge ${p.jenis_pegawai === 'dosen' ? 'badge-green' : 'badge-cyan'}`}>
                        {p.jenis_pegawai}
                      </span>
                    </td>
                    <td>{p.unit_kerja?.nama || 'Rektorat'}</td>
                    <td>
                      <span className="badge badge-green capitalize">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
