'use client';

import { MasterReferensiView } from '@/components/master/MasterReferensiView';

export default function SinapraMasterReferensiPage() {
  return (
    <MasterReferensiView
      initialModule="sinapra"
      pageTitle="Master Referensi Sarana & Prasarana (SINAPRA)"
      pageDescription="Pengelolaan data referensi operasional sarpras kampus (Kondisi Aset, Metode Disposal, Prioritas Tiket, Sumber Anggaran, Satuan, Kategori BHP, dll)."
    />
  );
}
