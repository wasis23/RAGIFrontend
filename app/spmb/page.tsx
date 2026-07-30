import Link from 'next/link';

export default function SpmbLandingPage() {
  return (
    <div className="page-container flex flex-col items-center justify-center min-h-screen text-center animate-fade-in">
      <div className="mb-6 p-4 bg-indigo-50 rounded-2xl inline-block">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        </svg>
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
        Penerimaan Mahasiswa Baru
      </h1>
      <p className="text-lg text-slate-600 max-w-xl mx-auto mb-8">
        Selamat datang di portal SPMB (Sistem Penerimaan Mahasiswa Baru). Silakan buat akun atau masuk jika Anda sudah memiliki akun untuk memulai pendaftaran.
      </p>
      
      <div className="flex gap-4">
        <Link href="/login" className="btn btn-primary btn-lg">
          Masuk ke Portal
        </Link>
        <Link href="/register" className="btn btn-secondary btn-lg">
          Daftar Akun Baru
        </Link>
      </div>
    </div>
  );
}
