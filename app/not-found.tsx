'use client';

import Link from 'next/link';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotFoundPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--gray-50)',
      padding: '2rem',
    }}>
      <div className="card" style={{ maxWidth: 480, width: '100%', textAlign: 'center', padding: '3rem 2rem' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'var(--primary-50)', color: 'var(--primary-600)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem auto', border: '1px solid var(--primary-200)',
        }}>
          <FileQuestion size={40} />
        </div>

        <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--primary-900)', lineHeight: 1 }}>
          404
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.5rem 0' }}>
          Halaman Tidak Ditemukan
        </h1>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: '1.75rem', lineHeight: 1.5 }}>
          Halaman SSO atau modul yang Anda cari tidak ada, telah dipindahkan, atau alamat URL salah.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button variant="secondary" icon={<ArrowLeft size={16} />} onClick={() => window.history.back()}>
            Kembali
          </Button>
          <Link href="/dashboard">
            <Button variant="primary" icon={<Home size={16} />}>
              Ke Dashboard SSO
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
