'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { FileText, BookOpen, Layers } from 'lucide-react';
import Link from 'next/link';

export default function SiakadRpsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Rencana Pembelajaran Semester (RPS)"
        description="Portal peninjauan dan penyusunan RPS berbasis Capaian Pembelajaran Lulusan (CPL) dan CPMK."
        breadcrumbs={[
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'RPS' },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary-50 text-primary-600">
              <FileText size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">Kelola Dokumen RPS OBE</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Akses matriks penyusunan rencana pembelajaran 16 minggu, integrasi bahan kajian, dan verifikasi Kaprodi.
              </p>
              <div className="pt-2">
                <Link
                  href="/siakad/obe/rps/kelola"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline"
                >
                  Buka Kelola RPS →
                </Link>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-sky-50 text-sky-600">
              <Layers size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">Kurikulum & Pemetaan CPMK</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tinjau pemetaan CPMK terhadap CPL dan distribusi mata kuliah pada kurikulum yang berlaku.
              </p>
              <div className="pt-2">
                <Link
                  href="/siakad/obe"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline"
                >
                  Buka Modul OBE →
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 text-center">
        <div className="max-w-md mx-auto space-y-3 py-6">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <BookOpen size={24} />
          </div>
          <h4 className="text-sm font-bold text-slate-800">Modul RPS Akademik</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Halaman ini disiapkan sebagai hub sentral navigasi dokumen RPS. Anda dapat menyusun atau meninjau RPS mata kuliah melalui menu terintegrasi di atas.
          </p>
        </div>
      </Card>
    </div>
  );
}
