'use client';

import { RpsCrudMaster } from '@/components/siakad/RpsCrudMaster';

export default function RpsMetodePage() {
  return (
    <RpsCrudMaster
      title="Metode Pembelajaran RPS"
      description="Master referensi metode dan model pembelajaran interaktif untuk penyusunan aktivitas mingguan RPS."
      breadcrumbLabel="Metode"
      itemTypeLabel="Metode Pembelajaran"
      initialData={[]}
    />
  );
}
