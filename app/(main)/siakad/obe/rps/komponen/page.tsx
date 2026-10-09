'use client';

import { RpsCrudMaster } from '@/components/siakad/RpsCrudMaster';

export default function RpsKomponenPage() {
  return (
    <RpsCrudMaster
      title="Komponen Evaluasi RPS"
      description="Master komponen asesmen dan instrumen pembobot nilai pada penyusunan silabus RPS."
      breadcrumbLabel="Komponen"
      itemTypeLabel="Komponen Evaluasi"
      initialData={[]}
    />
  );
}
