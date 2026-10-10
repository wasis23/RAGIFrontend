'use client';

import { RpsCrudMaster } from '@/components/siakad/RpsCrudMaster';

export default function RpsJenisPembelajaranPage() {
  return (
    <RpsCrudMaster
      tipe="jenis_pembelajaran"
      title="Jenis Pembelajaran RPS"
      description="Master referensi jenis pembelajaran (mis. Kuliah, Responsi, Praktikum, Magang, Blended) yang digunakan dalam Rencana Pembelajaran Semester (RPS)."
      breadcrumbLabel="Jenis Pembelajaran"
      itemTypeLabel="Jenis Pembelajaran"
    />
  );
}
