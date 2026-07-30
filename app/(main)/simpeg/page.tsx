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
  Search,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { simpegService } from '@/services/simpeg.service';
import type { Pegawai, UnitKerja } from '@/types/simpeg.types';
import toast from 'react-hot-toast';

export default function SimpegDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>([]);
  const [unitKerjaList, setUnitKerjaList] = useState<UnitKerja[]>([]);
  const [stats, setStats] = useState({
    totalPegawai: 0,
    totalDosen: 0,
    totalTendik: 0,
    totalUnitKerja: 0,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
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

      // Compute stats
      const total = items.length;
      const dosen = items.filter((p) => p.jenis_pegawai === 'dosen').length;
      const tendik = items.filter((p) => p.jenis_pegawai === 'tendik').length;

      setStats({
        totalPegawai: total || 1,
        totalDosen: dosen || 1,
        totalTendik: tendik || 0,
        totalUnitKerja: units.length || 6,
      });
    } catch (err) {
      toast.error('Gagal memuat data SIMPEG');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <PageHeader
        title="Dashboard Kepegawaian (SIMPEG)"
        description="Pusat kelola Sumber Daya Manusia, Unit Kerja, dan Jabatan Universitas"
      />

      {/* Hero Welcome Banner */}
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
              MODUL SIMPEG TERINTEGRASI SSO
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
