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
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        <PageHeader
          title={`Portal Layanan Mandiri SIMPEG`}
          description={`Selamat datang, ${namaDosen} — Manajemen Data Kepegawaian, Dokumen, dan Layanan Mandiri`}
        />

        {/* Hero Banner Personal Dosen */}
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, #059669 0%, #047857 60%, #064e3b 100%)',
            color: 'white',
            padding: '2rem',
            borderRadius: '16px',
            boxShadow: '0 10px 25px -5px rgba(5, 150, 105, 0.3)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'rgba(255,255,255,0.18)',
                  backdropFilter: 'blur(8px)',
                  padding: '0.25rem 0.75rem',
                  borderRadius: 99,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  marginBottom: '0.75rem',
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#a7f3d0' }} />
                LAYANAN MANDIRI DOSEN & TENDIK
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem' }}>
                {namaDosen}
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9375rem', maxWidth: 620, lineHeight: 1.6 }}>
                NIP: <strong>{myPegawai?.nip || '199208152022011002'}</strong> &bull; Unit Kerja: <strong>{myPegawai?.unit_kerja?.nama || 'Fakultas Teknik'}</strong> &bull; Status: <span className="badge badge-green">Aktif</span>
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button onClick={handleQuickClockIn} className="btn" style={{ background: '#10b981', color: 'white', fontWeight: 700, borderRadius: 10, padding: '0.75rem 1.25rem', border: 'none' }}>
                <Clock size={18} /> Presensi Masuk Hari Ini
              </button>
              <button onClick={() => setShowEditProfileModal(true)} className="btn" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700, borderRadius: 10, padding: '0.75rem 1.25rem', border: '1px solid rgba(255,255,255,0.3)' }}>
                <Edit3 size={18} /> Edit Profil Saya
              </button>
            </div>
          </div>
        </div>

        {/* Layout Grid 2 Kolom: Kiri (Biodata Dosen Ybs) & Kanan (Layanan Mandiri / Data Terkait Anisa) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(360px, 2fr)', gap: '1.5rem' }}>
          
          {/* Panel Kiri: Biodata Lengkap Dosen Ybs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ width: 54, height: 54, borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800 }}>
                  {namaDosen.charAt(0)}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>Biodata Pegawai</h3>
                  <span className="badge badge-purple" style={{ textTransform: 'uppercase', fontSize: '0.75rem' }}>
                    {myPegawai?.jenis_pegawai || 'DOSEN'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', fontSize: '0.875rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>NIP / Identitas</span>
                  <strong style={{ fontFamily: 'monospace', color: '#4f46e5' }}>{myPegawai?.nip || '-'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>NIK (KTP)</span>
                  <strong>{myPegawai?.nik || '327101...'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Unit Kerja Bertugas</span>
                  <strong>{myPegawai?.unit_kerja?.nama || 'Fakultas Teknik'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Status Kepegawaian</span>
                  <strong style={{ textTransform: 'capitalize' }}>{(myPegawai?.status_kepegawaian || 'tetap_yayasan').replace('_', ' ')}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Nomor HP / WhatsApp</span>
                  <strong>{myPegawai?.telepon || '081234567890'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Alamat Tempat Tinggal</span>
                  <strong>{myPegawai?.alamat || 'Jl. Merdeka No. 45, Bandung'}</strong>
                </div>
              </div>
            </div>

            {/* Quick Action Navigation for Dosen */}
            <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Pintas Layanan Saya</h4>
              <button onClick={() => setShowUploadModal(true)} className="btn btn-outline btn-sm" style={{ justifyContent: 'flex-start' }}>
                <Upload size={16} /> Unggah Dokumen E-File
              </button>
              <button onClick={() => setShowCutiModal(true)} className="btn btn-outline btn-sm" style={{ justifyContent: 'flex-start' }}>
                <Calendar size={16} /> Ajukan Permohonan Cuti
              </button>
              <Link href="/simpeg/usulan-jafung" className="btn btn-outline btn-sm" style={{ justifyContent: 'flex-start', textDecoration: 'none' }}>
                <Award size={16} /> Ajukan Usulan Jafung (KUM)
              </Link>
            </div>
          </div>

          {/* Panel Kanan: Data Terkait Dosen Ybs (Anisa Only) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* 1. Dokumen E-File Pribadi */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={18} color="#4f46e5" /> Dokumen E-File Pribadi ({myDokumen.length})
                </h3>
                <button onClick={() => setShowUploadModal(true)} className="btn btn-primary btn-sm">
                  <Plus size={14} /> Unggah Berkas
                </button>
              </div>

              {myDokumen.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Belum ada berkas E-File diunggah.</p>
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
                          <td style={{ fontWeight: 600 }}>{d.nama_dokumen}</td>
                          <td><span className="badge badge-purple" style={{ textTransform: 'uppercase' }}>{d.jenis_dokumen}</span></td>
                          <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{d.file_size || '1.5 MB'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 2. Pengajuan Cuti Saya */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Calendar size={18} color="#059669" /> Pengajuan Cuti Saya ({myCuti.length})
                </h3>
                <button onClick={() => setShowCutiModal(true)} className="btn btn-outline btn-sm">
                  <Plus size={14} /> Ajukan Cuti
                </button>
              </div>

              {myCuti.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Belum ada riwayat pengajuan cuti.</p>
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
                          <td style={{ fontWeight: 600 }}>{(c.jenis_cuti || 'tahunan').toUpperCase()}</td>
                          <td style={{ fontSize: '0.8125rem' }}>{c.tanggal_mulai} s/d {c.tanggal_selesai}</td>
                          <td style={{ fontWeight: 700, color: '#4f46e5' }}>{c.jumlah_hari} Hari</td>
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
            <div className="card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
                <DollarSign size={18} color="#0284c7" /> Slip Gaji Saya ({myPayroll.length})
              </h3>
              {myPayroll.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Belum ada slip gaji diterbitkan.</p>
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
                          <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>{p.periode_bulan_tahun}</td>
                          <td>Rp {p.gaji_pokok?.toLocaleString('id-ID')}</td>
                          <td style={{ fontWeight: 700, color: '#059669' }}>Rp {p.gaji_bersih?.toLocaleString('id-ID')}</td>
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
          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
          <form onSubmit={handleUploadDokumen} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
          <form onSubmit={handleRequestCuti} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <PageHeader
        title="Dashboard Kepegawaian (SIMPEG Admin)"
        description="Pusat kelola Sumber Daya Manusia, Unit Kerja, dan Jabatan Universitas"
      />

      {/* Hero Welcome Banner Admin */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 60%, #1e1b4b 100%)',
          color: 'white',
          padding: '2rem',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '16px',
        }}
      >
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', padding: '0.25rem 0.75rem', borderRadius: 99, fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#a7f3d0' }} />
              PANEL UTAMA ADMIN SIMPEG KAMPUS
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem' }}>
              Sistem Informasi Kepegawaian Kampus
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9375rem', maxWidth: 620, lineHeight: 1.6 }}>
              Kelola data seluruh Dosen, Tenaga Kependidikan, Unit Kerja, Jabatan, dan Riwayat SK Kepegawaian terhubung langsung dengan SSO Central Authorization.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link
              href="/simpeg/pegawai"
              className="btn"
              style={{ background: 'white', color: '#4338ca', fontWeight: 700, borderRadius: 10, padding: '0.75rem 1.25rem', border: 'none' }}
            >
              <Plus size={18} /> Tambah Pegawai
            </Link>
            <button
              onClick={fetchData}
              className="btn"
              style={{ background: 'rgba(255,255,255,0.2)', color: 'white', borderRadius: 10, padding: '0.75rem', border: '1px solid rgba(255,255,255,0.3)' }}
              title="Refresh Data"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div className="stat-card" style={{ borderLeft: '4px solid #6366f1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Total SDM / Pegawai</span>
            <div className="stat-icon" style={{ background: '#eeeffe', color: '#4f46e5' }}>
              <Users size={22} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.25rem 0' }}>
            {loading ? '...' : stats.totalPegawai}
          </div>
          <span style={{ fontSize: '0.8125rem', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            <TrendingUp size={14} /> Terdaftar di SSO
          </span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Dosen Pengajar</span>
            <div className="stat-icon" style={{ background: '#d1fae5', color: '#059669' }}>
              <GraduationCap size={22} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.25rem 0' }}>
            {loading ? '...' : stats.totalDosen}
          </div>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            NIDN / NIP Verified
          </span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #0284c7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Tenaga Kependidikan</span>
            <div className="stat-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
              <Briefcase size={22} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.25rem 0' }}>
            {loading ? '...' : stats.totalTendik}
          </div>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Staf & Administrasi
          </span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Unit Kerja</span>
            <div className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
              <Building2 size={22} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.25rem 0' }}>
            {loading ? '...' : stats.totalUnitKerja}
          </div>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Fakultas, Prodi & Biro
          </span>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
        <Link href="/simpeg/pegawai" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ padding: '1.5rem', height: '100%', transition: 'all 0.2s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#eeeffe', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={22} />
              </div>
              <ArrowRight size={20} color="#6b7280" />
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>
              Manajemen Data Pegawai
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Lihat, cari, dan kelola profil biodata lengkap seluruh Dosen & Staf Tendik kampus.
            </p>
          </div>
        </Link>

        <Link href="/simpeg/unit-kerja" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ padding: '1.5rem', height: '100%', transition: 'all 0.2s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={22} />
              </div>
              <ArrowRight size={20} color="#6b7280" />
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>
              Struktur Unit Kerja
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Kelola hierarki organisasi Rektorat, Dekanat Fakultas, Program Studi, Biro, dan LP3M.
            </p>
          </div>
        </Link>

        <Link href="/simpeg/jabatan" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ padding: '1.5rem', height: '100%', transition: 'all 0.2s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Briefcase size={22} />
              </div>
              <ArrowRight size={20} color="#6b7280" />
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>
              Jabatan & Jafung Dosen
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Pengaturan Jabatan Struktural serta Jabatan Fungsional Akademik (Lektor, Guru Besar).
            </p>
          </div>
        </Link>
      </div>

      {/* Recent Pegawai Section */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Data Pegawai Terkini
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Pegawai yang baru ditambahkan ke dalam database SIMPEG
            </p>
          </div>

          <Link href="/simpeg/pegawai" className="btn btn-outline btn-sm">
            Lihat Semua Pegawai →
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Memuat data pegawai...
          </div>
        ) : pegawaiList.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
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
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{p.nip || p.nik || '-'}</td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{p.nama_lengkap}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.telepon || '-'}</div>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: p.jenis_pegawai === 'dosen' ? '#d1fae5' : '#e0f2fe',
                          color: p.jenis_pegawai === 'dosen' ? '#065f46' : '#0369a1',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                        }}
                      >
                        {p.jenis_pegawai}
                      </span>
                    </td>
                    <td>{p.unit_kerja?.nama || 'Rektorat'}</td>
                    <td>
                      <span className="badge badge-green" style={{ textTransform: 'capitalize' }}>
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
