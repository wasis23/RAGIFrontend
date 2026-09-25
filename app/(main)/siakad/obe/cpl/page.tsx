import { ObeWorkspace } from '../page';

export default function ObeCplPage() {
  return (
    <ObeWorkspace
      initialTab="cpl"
      visibleTabs={['cpl', 'matrix_cpl_mk', 'profil_lulusan', 'bahan_kajian']}
      title="CPL & Kurikulum Prodi"
      description="Perumusan CPL, matriks korelasi CPL–MK, profil lulusan, dan bahan kajian."
      breadcrumbLabel="CPL & Kurikulum"
      allowedRoles={['superadmin', 'admin', 'kaprodi', 'wakil_prodi']}
    />
  );
}
