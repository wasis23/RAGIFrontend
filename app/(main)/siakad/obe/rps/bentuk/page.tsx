'use client';

import { RpsCrudMaster } from '@/components/siakad/RpsCrudMaster';

const INITIAL_BENTUK = [
  { id: 1, kode: 'BTK-01', nama: 'Kuliah / Responsi', deskripsi: 'Bentuk pembelajaran tatap muka terjadwal di kelas.', created_at: '2026-10-09' },
  { id: 2, kode: 'BTK-02', nama: 'Seminar / Diskusi Kelompok', deskripsi: 'Pemaparan makalah dan diskusi interaktif antarmahasiswa.', created_at: '2026-10-09' },
  { id: 3, kode: 'BTK-03', nama: 'Praktikum / Praktik Studio', deskripsi: 'Latihan keterampilan dan penerapan teori di laboratorium/studio.', created_at: '2026-10-09' },
  { id: 4, kode: 'BTK-04', nama: 'Praktik Lapangan / Magang', deskripsi: 'Kegiatan pembelajaran langsung di dunia industri atau masyarakat.', created_at: '2026-10-09' },
  { id: 5, kode: 'BTK-05', nama: 'Penelitian & Proyek Mandiri', deskripsi: 'Pengembangan karya ilmiah, prototipe, atau tugas akhir.', created_at: '2026-10-09' },
];

export default function RpsBentukPage() {
  return (
    <RpsCrudMaster
      title="Bentuk Pembelajaran RPS"
      description="Master referensi bentuk pembelajaran yang digunakan dalam penyusunan Rencana Pembelajaran Semester (RPS)."
      breadcrumbLabel="Bentuk"
      itemTypeLabel="Bentuk Pembelajaran"
      initialData={INITIAL_BENTUK}
    />
  );
}
