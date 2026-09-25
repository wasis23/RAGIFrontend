import { ObeWorkspace } from '../page';

export default function ObeKepatuhanPage() {
  return (
    <ObeWorkspace
      initialTab="kepatuhan_dosen"
      visibleTabs={['kepatuhan_dosen']}
      title="Ketertiban Pengisian Nilai Dosen"
      description="Pemantauan ketepatan waktu input nilai per dosen sebagai indikator kinerja (SIMPEG)."
      breadcrumbLabel="Ketertiban Dosen"
      allowedRoles={['superadmin', 'admin', 'kaprodi', 'wakil_prodi']}
    />
  );
}
