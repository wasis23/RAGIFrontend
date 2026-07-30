'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled System Error:', error);
  }, [error]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--gray-50)',
      padding: '2rem',
    }}>
      <div className="card" style={{ maxWidth: 520, width: '100%', textAlign: 'center', padding: '2.5rem 2rem' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: '#fef2f2', color: '#dc2626',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.25rem auto', border: '1px solid #fecaca',
        }}>
          <AlertTriangle size={36} />
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          Terjadi Kesalahan Sistem
        </h1>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          Maaf, terjadi kesalahan tak terduga pada halaman ini. Tim pengembang telah diberitahu mengenai masalah ini.
        </p>

        {error.digest && (
          <div style={{
            background: 'var(--gray-100)',
            padding: '0.5rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.75rem',
            fontFamily: 'monospace',
            color: 'var(--text-muted)',
            marginBottom: '1.5rem',
          }}>
            Error Code / Digest: {error.digest}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button variant="outline" icon={<RefreshCw size={16} />} onClick={() => reset()}>
            Coba Lagi
          </Button>
          <Link href="/dashboard">
            <Button variant="primary" icon={<Home size={16} />}>
              Kembali ke Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
