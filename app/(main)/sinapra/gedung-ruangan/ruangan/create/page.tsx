'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { RuanganForm } from '@/components/sinapra/RuanganForm';

export default function TambahRuanganPage() {
  const router = useRouter();

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Tambah Ruangan Baru"
        description="Daftarkan ruangan, laboratorium, atau aula baru beserta kapasitas dan kuantitas fasilitas fisik (Modul SINAPRA)"
        action={
          <Button
            variant="outline"
            onClick={() => router.back()}
            style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
            icon={<ArrowLeft size={16} />}
          >
            Kembali
          </Button>
        }
      />

      <RuanganForm />
    </div>
  );
}
