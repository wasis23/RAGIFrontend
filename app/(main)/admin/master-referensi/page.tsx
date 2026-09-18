import { Metadata } from 'next';
import { MasterReferensiView } from '@/components/master/MasterReferensiView';

export const metadata: Metadata = {
  title: 'Master Data Referensi | Integrasi Sistem Kampus',
  description: 'Pengelolaan pusat data referensi standar seluruh modul kampus (Agama, Status Sipil, Kewarganegaraan, dll).',
};

export default function AdminMasterReferensiPage() {
  return (
    <MasterReferensiView
      initialModule="all"
      pageTitle="Master Data Referensi Sistem"
      pageDescription="Pengelolaan pusat data referensi standar seluruh modul kampus (Agama, Status Sipil, Kewarganegaraan, dll)."
    />
  );
}
