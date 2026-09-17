import { Metadata } from 'next';
import { MasterReferensiView } from '@/components/master/MasterReferensiView';

export const metadata: Metadata = {
  title: 'Master Tipe Referensi SPMB | Integrasi Sistem Kampus',
  description: 'Kelola kategori tipe referensi penerimaan mahasiswa baru (Asal Lulusan, Jalur Masuk, Penghasilan Ortu, dll).',
};

export default function SpmbMasterTipeReferensiPage() {
  return (
    <MasterReferensiView
      initialModule="spmb"
      initialTab="tipe"
      pageTitle="Master Tipe Referensi SPMB"
      pageDescription="Pengelolaan kelompok kategori referensi khusus penerimaan mahasiswa baru dan kategori global."
    />
  );
}
