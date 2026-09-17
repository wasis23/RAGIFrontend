'use client';

import { MasterReferensiView } from '@/components/master/MasterReferensiView';

export default function SpmbMasterReferensiPage() {
  return (
    <MasterReferensiView
      initialModule="spmb"
      pageTitle="Master Referensi SPMB"
      pageDescription="Pengelolaan data referensi untuk formulir pendaftaran mahasiswa baru (Agama, Status Sipil, Asal Sekolah/Lulusan, Penghasilan Ortu, dll)."
    />
  );
}
