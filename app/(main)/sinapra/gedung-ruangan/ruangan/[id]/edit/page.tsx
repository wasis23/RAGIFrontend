'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { RuanganForm } from '@/components/sinapra/RuanganForm';
import { sinapraService } from '@/services/sinapra.service';
import type { Ruangan } from '@/types/sinapra.types';

export default function EditRuanganPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id ? Number(params.id) : null;

  const [ruangan, setRuangan] = useState<Ruangan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchDetail = async () => {
      setIsLoading(true);
      try {
        const res: any = await sinapraService.getRuanganDetail(id);
        const data = res?.data || res;
        setRuangan(data);
      } catch {
        toast.error('Gagal memuat detail data ruangan.');
        router.push('/sinapra/gedung-ruangan');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, [id, router]);

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title={ruangan ? `Ubah Ruangan — ${ruangan.nama}` : 'Ubah Data Ruangan'}
        description="Perbarui informasi identitas, kapasitas, prodi penanggung jawab, serta kuantitas fasilitas ruangan (Modul SINAPRA)"
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

      {isLoading ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 flex flex-col items-center justify-center gap-3">
          <Loader2 className="animate-spin text-[var(--module-primary)]" size={32} />
          <p className="text-xs text-slate-500 font-medium">Memuat data ruangan kampus...</p>
        </div>
      ) : ruangan ? (
        <RuanganForm initialData={ruangan} isEdit />
      ) : null}
    </div>
  );
}
