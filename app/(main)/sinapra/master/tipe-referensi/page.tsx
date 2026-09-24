import { Metadata } from 'next';
import { MasterReferensiView } from '@/components/master/MasterReferensiView';

export const metadata: Metadata = {
  title: 'Master Tipe Referensi SINAPRA | Integrasi Sistem Kampus',
  description: 'Kelola kelompok kategori tipe referensi data sarana dan prasarana kampus.',
};

export default function SinapraMasterTipeReferensiPage() {
  return (
    <MasterReferensiView
      initialModule="sinapra"
      initialTab="tipe"
      pageTitle="Master Tipe Referensi Sarana & Prasarana (SINAPRA)"
      pageDescription="Pengelolaan kelompok kategori referensi data sarana dan prasarana kampus."
    />
  );
}
