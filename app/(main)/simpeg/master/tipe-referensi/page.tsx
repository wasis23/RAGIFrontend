import { Metadata } from 'next';
import { MasterReferensiView } from '@/components/master/MasterReferensiView';

export const metadata: Metadata = {
  title: 'Master Tipe Referensi SIMPEG | Integrasi Sistem Kampus',
  description: 'Kelola kategori tipe referensi data kepegawaian dan sumber daya manusia.',
};

export default function SimpegMasterTipeReferensiPage() {
  return (
    <MasterReferensiView
      initialModule="simpeg"
      initialTab="tipe"
      pageTitle="Master Tipe Referensi Kepegawaian (SIMPEG)"
      pageDescription="Pengelolaan kelompok kategori referensi data SDM kepegawaian dan kategori global."
    />
  );
}
