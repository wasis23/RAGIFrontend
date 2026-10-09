'use client';

import { RpsCrudMaster } from '@/components/siakad/RpsCrudMaster';

export default function RpsKelolaPage() {
  return (
    <RpsCrudMaster
      title="Kelola Dokumen RPS"
      description="Manajemen dokumen Rencana Pembelajaran Semester (RPS) mata kuliah, evaluasi mingguan, dan verifikasi silabus."
      breadcrumbLabel="Kelola RPS"
      itemTypeLabel="Dokumen RPS"
      initialData={[]}
    />
  );
}
