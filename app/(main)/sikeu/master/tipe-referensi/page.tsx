import { Metadata } from 'next';
import { MasterReferensiView } from '@/components/master/MasterReferensiView';

export const metadata: Metadata = {
  title: 'Master Tipe Referensi SIKEU | Integrasi Sistem Kampus',
  description: 'Kelola kategori tipe referensi data keuangan dan pembayaran.',
};

export default function SikeuMasterTipeReferensiPage() {
  return (
    <MasterReferensiView
      initialModule="sikeu"
      initialTab="tipe"
      pageTitle="Master Tipe Referensi Keuangan (SIKEU)"
      pageDescription="Pengelolaan kelompok kategori referensi data keuangan kampus dan kategori global."
    />
  );
}
