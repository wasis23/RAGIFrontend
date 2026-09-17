import { Metadata } from 'next';
import { MasterReferensiView } from '@/components/master/MasterReferensiView';

export const metadata: Metadata = {
  title: 'Master Tipe Referensi SIAKAD | Integrasi Sistem Kampus',
  description: 'Kelola kategori tipe referensi akademik dan kemahasiswaan BAAK.',
};

export default function SiakadMasterTipeReferensiPage() {
  return (
    <MasterReferensiView
      initialModule="siakad"
      initialTab="tipe"
      pageTitle="Master Tipe Referensi Akademik (SIAKAD)"
      pageDescription="Pengelolaan kelompok kategori referensi akademik universitas dan kategori global."
    />
  );
}
