'use client';

import { PageHeader } from '@/components/layout/PageHeader';

import { Users, FileText, CheckCircle, XCircle } from 'lucide-react';

export default function SPMBDashboardPage() {
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <PageHeader
        title="Dashboard SPMB"
        description="Ringkasan statistik penerimaan mahasiswa baru"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--primary-500)' }}>
          <div style={{ padding: '1rem', background: 'var(--primary-50)', borderRadius: '0.5rem' }}>
            <Users size={24} color="var(--primary-600)" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total Pendaftar</p>
            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>1,245</h3>
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--warning)' }}>
          <div style={{ padding: '1rem', background: 'var(--warning-light)', borderRadius: '0.5rem' }}>
            <FileText size={24} color="var(--warning-dark)" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Menunggu Verifikasi</p>
            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>342</h3>
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--success)' }}>
          <div style={{ padding: '1rem', background: 'var(--success-light)', borderRadius: '0.5rem' }}>
            <CheckCircle size={24} color="var(--success-dark)" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Lulus Seleksi</p>
            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>850</h3>
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--danger)' }}>
          <div style={{ padding: '1rem', background: 'var(--danger-light)', borderRadius: '0.5rem' }}>
            <XCircle size={24} color="var(--danger-dark)" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Gagal / Gugur</p>
            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>53</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem' }}>Prodi Terfavorit</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>S1 Teknik Informatika (450 Pendaftar)</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>S1 Sistem Informasi (320 Pendaftar)</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>D3 Manajemen Informatika (150 Pendaftar)</p>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem' }}>Gelombang Aktif</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}><strong>Gelombang 2 (Reguler)</strong></p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Tutup: 30 Agustus 2026</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Kuota Terisi: 65%</p>
        </div>
      </div>
    </div>
  );
}
