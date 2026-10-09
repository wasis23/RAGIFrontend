'use client';

import { RpsCrudMaster } from '@/components/siakad/RpsCrudMaster';

const INITIAL_KRITERIA = [
  { id: 1, kode: 'KRT-01', nama: 'Ketepatan Analisis & Logika', deskripsi: 'Kemampuan menguraikan argumen dan ketepatan penalaran ilmiah.', created_at: '2026-10-09' },
  { id: 2, kode: 'KRT-02', nama: 'Penguasaan Konsep Teoretis', deskripsi: 'Tingkat pemahaman terhadap teori, rumus, dan dasar keilmuan.', created_at: '2026-10-09' },
  { id: 3, kode: 'KRT-03', nama: 'Keterampilan Praktik & Penerapan', deskripsi: 'Kelancaran pengoperasian alat, kode, atau instrumen teknis.', created_at: '2026-10-09' },
  { id: 4, kode: 'KRT-04', nama: 'Komunikasi & Presentasi', deskripsi: 'Kejelasan penyampaian lisan dan estetika visual paparan materi.', created_at: '2026-10-09' },
  { id: 5, kode: 'KRT-05', nama: 'Kerja Sama Tim & Tanggung Jawab', deskripsi: 'Kontribusi aktif, kepemimpinan, dan etika kerja kelompok.', created_at: '2026-10-09' },
];

export default function RpsKriteriaPage() {
  return (
    <RpsCrudMaster
      title="Kriteria Penilaian RPS"
      description="Master kriteria evaluasi dan standar kualitas capaian pembelajaran mingguan pada dokumen RPS."
      breadcrumbLabel="Kriteria"
      itemTypeLabel="Kriteria Penilaian"
      initialData={INITIAL_KRITERIA}
    />
  );
}
