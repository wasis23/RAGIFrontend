'use client';

import { RpsCrudMaster } from '@/components/siakad/RpsCrudMaster';

const INITIAL_METODE = [
  { id: 1, kode: 'MTD-01', nama: 'Problem Based Learning (PBL)', deskripsi: 'Pembelajaran berbasis pemecahan masalah nyata yang kontekstual.', created_at: '2026-10-09' },
  { id: 2, kode: 'MTD-02', nama: 'Project Based Learning (PjBL)', deskripsi: 'Pengerjaan proyek kolaboratif untuk menghasilkan luaran konkret.', created_at: '2026-10-09' },
  { id: 3, kode: 'MTD-03', nama: 'Case Method (Studi Kasus)', deskripsi: 'Analisis mendalam terhadap kasus-kasus spesifik di industri/masyarakat.', created_at: '2026-10-09' },
  { id: 4, kode: 'MTD-04', nama: 'Discovery & Inquiry Learning', deskripsi: 'Penemuan konsep mandiri melalui pengamatan dan eksperimen terarah.', created_at: '2026-10-09' },
  { id: 5, kode: 'MTD-05', nama: 'Small Group Discussion', deskripsi: 'Diskusi kelompok terfokus untuk pendalaman materi mingguan.', created_at: '2026-10-09' },
];

export default function RpsMetodePage() {
  return (
    <RpsCrudMaster
      title="Metode Pembelajaran RPS"
      description="Master referensi metode dan model pembelajaran interaktif untuk penyusunan aktivitas mingguan RPS."
      breadcrumbLabel="Metode"
      itemTypeLabel="Metode Pembelajaran"
      initialData={INITIAL_METODE}
    />
  );
}
