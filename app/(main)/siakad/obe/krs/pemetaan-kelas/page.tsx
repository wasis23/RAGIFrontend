'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { List } from 'lucide-react';

export default function PemetaanKrsKelasPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Pemetakan KRS-Kelas"
        description="Pengaturan alokasi dan pemetaan mata kuliah rencana studi mahasiswa ke kelas perkuliahan aktif."
        breadcrumbs={[
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Kurikulum OBE', href: '/siakad/obe' },
          { label: 'KRS', href: '/siakad/obe/krs/paket' },
          { label: 'Pemetakan KRS-Kelas' },
        ]}
      />

      <Card className="border border-slate-200 shadow-2xs">
        <CardBody className="py-6 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-[var(--module-primary-subtle)] flex items-center justify-center text-[var(--module-primary)]">
            <List size={32} />
          </div>
          <h3 className="text-base font-bold text-slate-800">Pemetakan KRS-Kelas</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
            Halaman pengaturan pemetaan mata kuliah rencana studi ke kelas perkuliahan. Modul ini disiapkan tanpa data dummy.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
