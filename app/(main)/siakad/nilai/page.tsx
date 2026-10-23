'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Award, CalendarCheck, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function SiakadNilaiPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Penilaian & Capaian Akademik"
        description="Portal monitoring dan pengesahan penilaian perkuliahan mahasiswa serta capaian hasil studi."
        breadcrumbs={[
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Nilai' },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary-50 text-primary-600">
              <CalendarCheck size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">Penilaian Perkuliahan Kelas</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Input dan rekapitulasi penilaian komponen asesmen per kelas perkuliahan oleh dosen pengampu.
              </p>
              <div className="pt-2">
                <Link
                  href="/siakad/perkuliahan/kelas"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline"
                >
                  Buka Jadwal Perkuliahan & Kelas →
                </Link>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
              <Award size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">Pengesahan Kartu Hasil Studi</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Pemeriksaan kelayakan dan pengesahan nilai KHS semester oleh bagian administrasi akademik.
              </p>
              <div className="pt-2">
                <Link
                  href="/siakad/khs"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700 hover:underline"
                >
                  Buka Pengesahan KHS →
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
          <h4 className="text-sm font-bold text-slate-800">Modul Penilaian Akademik</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Halaman ini disiapkan sebagai hub sentral menu penilaian. Nilai mahasiswa diinput melalui kelas perkuliahan aktif dan disahkan melalui modul Pengesahan KHS.
          </p>
        </div>
      </Card>
    </div>
  );
}
