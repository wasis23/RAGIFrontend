'use client';

import KelasForm from '../_components/KelasForm';

export default function CreateKelasPerkuliahanPage() {
  return (
    <KelasForm
      mode="create"
      title="Buka Kelas Perkuliahan Baru"
      description="Alokasikan mata kuliah, dosen pengampu, team teaching, ruangan, dan jadwal mingguan pada periode aktif."
      breadcrumbLabel="Buka Kelas Baru"
      submitLabel="Buka Kelas Perkuliahan"
    />
  );
}
