import { ObeWorkspace } from '../page';

export default function ObeCpmkPage() {
  return (
    <ObeWorkspace
      initialTab="cpmk"
      visibleTabs={['cpmk']}
      title="Pemetaan CPMK Mata Kuliah"
      description="Penurunan CPMK per mata kuliah, korelasi CPL, dan bobot 100% syarat input nilai."
      breadcrumbLabel="CPMK Mata Kuliah"
      allowedRoles={['superadmin', 'admin', 'kaprodi', 'wakil_prodi', 'dosen']}
    />
  );
}
