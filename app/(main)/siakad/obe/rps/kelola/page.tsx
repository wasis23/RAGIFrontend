'use client';

import { RpsCrudMaster } from '@/components/siakad/RpsCrudMaster';

const INITIAL_RPS = [
  { id: 1, kode: 'RPS-TI-101', nama: 'RPS Pemrograman Web Dasar (2026)', deskripsi: 'Silabus 16 pertemuan, CPMK, materi mingguan, dan rubrik tugas project.', created_at: '2026-10-09' },
  { id: 2, kode: 'RPS-TI-102', nama: 'RPS Struktur Data & Algoritma', deskripsi: 'Silabus terstandarisasi OBE dengan integrasi studi kasus dan praktikum.', created_at: '2026-10-09' },
  { id: 3, kode: 'RPS-TI-103', nama: 'RPS Basis Data Terdistribusi', deskripsi: 'Penyusunan rencana pembelajaran berbasis project based learning (PjBL).', created_at: '2026-10-09' },
  { id: 4, kode: 'RPS-TI-104', nama: 'RPS Rekayasa Perangkat Lunak', deskripsi: 'Penyusunan tahapan SDLC agile, perancangan arsitektur, dan evaluasi.', created_at: '2026-10-09' },
  { id: 5, kode: 'RPS-TI-105', nama: 'RPS Kecerdasan Buatan & Machine Learning', deskripsi: 'Rencana pembelajaran mingguan dengan studi kasus model deep learning.', created_at: '2026-10-09' },
];

export default function RpsKelolaPage() {
  return (
    <RpsCrudMaster
      title="Kelola Dokumen RPS"
      description="Manajemen dokumen Rencana Pembelajaran Semester (RPS) mata kuliah, evaluasi mingguan, dan verifikasi silabus."
      breadcrumbLabel="Kelola RPS"
      itemTypeLabel="Dokumen RPS"
      initialData={INITIAL_RPS}
    />
  );
}
