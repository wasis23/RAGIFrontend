'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import SoalForm, { type SoalFormInitial } from '../../_components/SoalForm';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

export default function EditSoalPage() {
  const params = useParams();
  const soalId = Number((params as any).id);
  const [initial, setInitial] = useState<SoalFormInitial | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!soalId) return;
    siakadService
      .getSoalList()
      .then((res) => {
        const found = (Array.isArray(res.data) ? res.data : []).find((s: any) => s.id === soalId);
        if (!found) {
          toast.error('Data soal tidak ditemukan');
          return;
        }
        setInitial({
          rps_id: found.rps_id,
          minggu_ke: String(found.mingguan?.minggu_ke || 1),
          sub_cpmk_id: found.sub_cpmk_id ? String(found.sub_cpmk_id) : '',
          pertanyaan: found.pertanyaan || '',
          bobot: Number(found.bobot) || 0,
          kunci_jawaban: found.kunci_jawaban || '',
        });
      })
      .catch(() => toast.error('Gagal memuat data soal'))
      .finally(() => setLoading(false));
  }, [soalId]);

  return (
    <SoalForm
      title="Ubah Soal Bank Soal"
      description="Perbarui butir soal, bobot, dan kunci jawabannya."
      breadcrumbLabel="Ubah Soal"
      submitLabel="Simpan Perubahan"
      initial={initial}
      soalId={soalId}
      loadingInitial={loading}
    />
  );
}
