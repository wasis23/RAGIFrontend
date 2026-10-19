'use client';

import KelasForm from '../_components/KelasForm';

export default function CreateKelasPerkuliahanPage() {
  return (
    <KelasForm
      mode="create"
      title="Buka Jadwal Perkuliahan Baru"
      description="Alokasikan mata kuliah, dosen pengampu, team teaching, ruangan, dan jadwal mingguan pada periode aktif."
      breadcrumbLabel="Buka Jadwal Baru"
      submitLabel="Buka Jadwal Perkuliahan"
    />
  );
}
