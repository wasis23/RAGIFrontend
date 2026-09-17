'use client';

import { MasterReferensiView } from '@/components/master/MasterReferensiView';

export default function SimpegMasterReferensiPage() {
  return (
    <MasterReferensiView
      initialModule="simpeg"
      pageTitle="Master Referensi Kepegawaian (SDM)"
      pageDescription="Pengelolaan data referensi untuk biodata pegawai dan dosen (Agama, Status Pernikahan/Sipil, Pendidikan, dll)."
    />
  );
}
