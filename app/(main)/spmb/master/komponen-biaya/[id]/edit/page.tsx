'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { KomponenBiayaForm } from '@/components/spmb/KomponenBiayaForm';
import { spmbService } from '@/services/spmb.service';
import type { MasterKomponenBiaya } from '@/types/spmb.types';

export default function EditKomponenBiayaPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);
  const [initial, setInitial] = useState<MasterKomponenBiaya | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || Number.isNaN(id)) {
      setLoading(false);
      return;
    }
    spmbService
      .getKomponenBiayaById(id)
      .then((res) => setInitial(res?.data || null))
      .catch(() => toast.error('Gagal memuat detail komponen biaya.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="text-center text-sm text-slate-500 py-6">Memuat data...</div>;
  }

  if (!initial) {
    return <div className="text-center text-sm text-slate-500 py-6">Komponen biaya tidak ditemukan.</div>;
  }

  return <KomponenBiayaForm mode="edit" komponenId={id} initial={initial} />;
}
