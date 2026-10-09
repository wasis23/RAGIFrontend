'use client';

import { RpsCrudMaster } from '@/components/siakad/RpsCrudMaster';

export default function RpsBentukPage() {
  return (
    <RpsCrudMaster
      title="Bentuk Pembelajaran RPS"
      description="Master referensi bentuk pembelajaran yang digunakan dalam penyusunan Rencana Pembelajaran Semester (RPS)."
      breadcrumbLabel="Bentuk"
      itemTypeLabel="Bentuk Pembelajaran"
      initialData={[]}
    />
  );
}
