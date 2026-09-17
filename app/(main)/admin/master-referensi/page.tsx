'use client';

import { MasterReferensiView } from '@/components/master/MasterReferensiView';

export default function AdminMasterReferensiPage() {
  return (
    <MasterReferensiView
      initialModule="all"
      pageTitle="Master Data Referensi Sistem"
      pageDescription="Pengelolaan pusat data referensi standar seluruh modul kampus (Agama, Status Sipil, Kewarganegaraan, dll)."
    />
  );
}
