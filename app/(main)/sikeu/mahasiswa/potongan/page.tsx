'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PotonganKhususTab } from '../../master/_tabs/PotonganKhususTab';

export default function PotonganKhususPage() {
  const [headerAction, setHeaderAction] = useState<React.ReactNode>(null);

  return (
    <div className="w-full space-y-6 animate-fade-in pb-6">
      {/* Page Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'Keuangan', href: '/sikeu' },
          { label: 'Mahasiswa', href: '/sikeu/mahasiswa/tagihan' },
          { label: 'Potongan Khusus' },
        ]}
        title="Potongan & Keringanan Khusus Mahasiswa"
        description="Kelola penetapan potongan biaya pendidikan tambahan/khusus untuk mahasiswa tertentu di luar beasiswa umum (misal: diskon anak dosen/karyawan, keringanan SK Rektor, beasiswa saudara kandung)."
        action={headerAction}
      />

      {/* Main Tab Interface */}
      <div className="w-full space-y-6">
        <PotonganKhususTab setHeaderAction={setHeaderAction} />
      </div>
    </div>
  );
}
