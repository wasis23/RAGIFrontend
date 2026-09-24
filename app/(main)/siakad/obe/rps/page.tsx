import { ObeWorkspace } from '../page';

export default function ObeRpsPage() {
  return (
    <ObeWorkspace
      initialTab="rps"
      visibleTabs={['rps']}
      title="Dokumen RPS & Verifikasi"
      description="Penyusunan RPS 16 minggu oleh dosen dan verifikasi/persetujuan Kaprodi."
      breadcrumbLabel="RPS & Verifikasi"
      allowedRoles={['superadmin', 'admin', 'kaprodi', 'wakil_prodi', 'dosen']}
    />
  );
}
