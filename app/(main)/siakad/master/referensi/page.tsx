'use client';

import { MasterReferensiView } from '@/components/master/MasterReferensiView';

export default function SiakadMasterReferensiPage() {
  return (
    <MasterReferensiView
      initialModule="siakad"
      pageTitle="Master Referensi Akademik"
      pageDescription="Pengelolaan data referensi untuk biodata civitas akademika (Mahasiswa & Dosen)."
    />
  );
}
