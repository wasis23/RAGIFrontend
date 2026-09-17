import { Metadata } from 'next';
import { MasterReferensiView } from '@/components/master/MasterReferensiView';

export const metadata: Metadata = {
  title: 'Master Tipe Referensi | Integrasi Sistem Kampus',
  description: 'Kelola kategori tipe referensi standar (Agama, Status Sipil, Kewarganegaraan, dll) lintas modul universitas.',
};

export default function MasterTipeReferensiPage() {
  return (
    <MasterReferensiView
      initialModule="all"
      initialTab="tipe"
      pageTitle="Master Tipe Referensi"
      pageDescription="Pengelolaan kelompok kategori referensi sistem kampus. Tipe referensi ini digunakan untuk mengelompokkan opsi dropdown di modul SPMB, SIAKAD, SIMPEG, dan SIKEU."
    />
  );
}
