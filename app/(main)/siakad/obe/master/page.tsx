import { ObeWorkspace } from '../page';

export default function ObeMasterKurikulumPage() {
  return (
    <ObeWorkspace
      initialTab="master_kurikulum"
      visibleTabs={['master_kurikulum', 'cpl', 'cpmk', 'rps']}
      title="Master Kurikulum OBE Homebase"
      description="Kelola komponen dasar kurikulum OBE: tahun kurikulum, rumpun mata kuliah, jenis CPL, mata kuliah, distribusi semester, dan rubrik asesmen."
      breadcrumbLabel="Master Kurikulum OBE"
      requiredPermission="siakad.kurikulum.read"
    />
  );
}

