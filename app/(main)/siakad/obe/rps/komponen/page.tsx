'use client';

import { RpsCrudMaster } from '@/components/siakad/RpsCrudMaster';

const INITIAL_KOMPONEN = [
  { id: 1, kode: 'KMP-01', nama: 'Tugas Mandiri / Kuis Mingguan', deskripsi: 'Penilaian formatif pemahaman materi berkala.', created_at: '2026-10-09' },
  { id: 2, kode: 'KMP-02', nama: 'Praktikum & Laporan Lab', deskripsi: 'Evaluasi kinerja keterampilan dan penulisan laporan teknis.', created_at: '2026-10-09' },
  { id: 3, kode: 'KMP-03', nama: 'Ujian Tengah Semester (UTS)', deskripsi: 'Evaluasi sumatif capaian pembelajaran paruh semester.', created_at: '2026-10-09' },
  { id: 4, kode: 'KMP-04', nama: 'Ujian Akhir Semester (UAS)', deskripsi: 'Evaluasi sumatif komprehensif capaian akhir semester.', created_at: '2026-10-09' },
  { id: 5, kode: 'KMP-05', nama: 'Proyek Akhir / Capstone Design', deskripsi: 'Luaran produk utuh terintegrasi dari seluruh materi perkuliahan.', created_at: '2026-10-09' },
];

export default function RpsKomponenPage() {
  return (
    <RpsCrudMaster
      title="Komponen Evaluasi RPS"
      description="Master komponen asesmen dan instrumen pembobot nilai pada penyusunan silabus RPS."
      breadcrumbLabel="Komponen"
      itemTypeLabel="Komponen Evaluasi"
      initialData={INITIAL_KOMPONEN}
    />
  );
}
