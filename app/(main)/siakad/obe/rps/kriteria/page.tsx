'use client';

import { RpsCrudMaster } from '@/components/siakad/RpsCrudMaster';

export default function RpsKriteriaPage() {
  return (
    <RpsCrudMaster
      tipe="kriteria"
      title="Kriteria Penilaian RPS"
      description="Master kriteria evaluasi dan standar kualitas capaian pembelajaran mingguan pada dokumen RPS."
      breadcrumbLabel="Kriteria"
      itemTypeLabel="Kriteria Penilaian"
    />
  );
}
