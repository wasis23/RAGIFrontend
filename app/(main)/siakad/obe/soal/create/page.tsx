'use client';

import SoalForm from '../_components/SoalForm';

export default function CreateSoalPage() {
  return (
    <SoalForm
      title="Tambah Soal Bank Soal"
      description="Pilih RPS tujuan, minggu, dan SubCPMK, lalu tulis butir soal beserta bobotnya."
      breadcrumbLabel="Tambah Soal"
      submitLabel="Simpan Soal"
    />
  );
}
