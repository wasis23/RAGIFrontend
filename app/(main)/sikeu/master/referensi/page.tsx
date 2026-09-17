'use client';

import { MasterReferensiView } from '@/components/master/MasterReferensiView';

export default function SikeuMasterReferensiPage() {
  return (
    <MasterReferensiView
      initialModule="sikeu"
      pageTitle="Master Referensi Keuangan"
      pageDescription="Pengelolaan data referensi untuk transaksi, klasifikasi, dan data pendukung keuangan kampus."
    />
  );
}
