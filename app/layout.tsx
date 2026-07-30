import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'SSO Campus — Single Sign-On Ekosistem Kampus',
    template: '%s | SSO Campus',
  },
  description:
    'Sistem Single Sign-On terpusat untuk ekosistem kampus. Satu akun untuk semua layanan akademik.',
  keywords: ['SSO', 'Single Sign-On', 'Kampus', 'Akademik', 'SIAKAD', 'PDDikti'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '10px',
              background: '#1e293b',
              color: '#f8fafc',
              fontSize: '0.875rem',
              fontWeight: '500',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
            },
          }}
        />
      </body>
    </html>
  );
}
