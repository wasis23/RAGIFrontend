'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, ClipboardCheck } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { RubrikForm, type RubrikFormValues } from '@/components/siakad/RubrikForm';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

export default function EditRubrikPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params?.id);
  const [loading, setLoading] = useState(true);
  const [initial, setInitial] = useState<RubrikFormValues | null>(null);
  const [prodiOption, setProdiOption] = useState<any | null>(null);
  const [title, setTitle] = useState('');

  const back = () => router.push('/siakad/obe/rubrik');

  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      try {
        const res = await siakadService.getObeRubrikDetail(id);
        const item = res?.data;
        if (!item) {
          toast.error('Data rubrik tidak ditemukan');
          back();
          return;
        }
        setTitle(item.nama_rubrik || '');
        const ps = item.program_studi || item.programStudi;
        if (ps) {
          setProdiOption({
            value: ps.id,
            label: `${ps.nama || ps.nama_prodi || `Prodi #${ps.id}`}${ps.kode_prodi ? ` — ${ps.kode_prodi}` : ''}`,
          });
        }
        const list = Array.isArray(item.kriterias) ? item.kriterias : [];
        setInitial({
          program_studi_id: Number(item.program_studi_id) || 0,
          kode_rubrik: item.kode_rubrik || '',
          nama_rubrik: item.nama_rubrik || '',
          tipe_rubrik: item.tipe_rubrik || 'analitik',
          deskripsi: item.deskripsi || '',
          is_active: item.is_active ?? true,
          kriterias:
            list.length > 0
              ? list.map((k: any) => ({
                  nama_kriteria: k.nama_kriteria || '',
                  bobot_persen: Number(k.bobot_persen ?? 0),
                  skor_min: Number(k.skor_min ?? 0),
                  skor_max: Number(k.skor_max ?? 100),
                  deskripsi: k.deskripsi || '',
                }))
              : [{ nama_kriteria: '', bobot_persen: 0, skor_min: 0, skor_max: 100, deskripsi: '' }],
        });
      } catch {
        toast.error('Gagal memuat data rubrik');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSubmit = async (values: RubrikFormValues) => {
    try {
      await siakadService.updateObeRubrik(id, {
        program_studi_id: Number(values.program_studi_id),
        kode_rubrik: values.kode_rubrik.trim(),
        nama_rubrik: values.nama_rubrik.trim(),
        tipe_rubrik: values.tipe_rubrik,
        deskripsi: values.deskripsi?.trim() || null,
        is_active: values.is_active,
        kriterias: values.kriterias.map((k) => ({
          nama_kriteria: k.nama_kriteria.trim(),
          bobot_persen: Number(k.bobot_persen),
          skor_min: Number(k.skor_min),
          skor_max: Number(k.skor_max),
          deskripsi: (k.deskripsi || '').trim() || null,
        })),
      });
      toast.success('Rubrik penilaian berhasil diperbarui');
      back();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || 'Gagal memperbarui rubrik');
      throw err;
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Ubah Rubrik Penilaian"
        description="Perbarui identitas rubrik, status, dan daftar kriteria beserta bobot dan skor."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Rubrik Penilaian', href: '/siakad/obe/rubrik' },
          { label: 'Ubah' },
        ]}
        action={
          <Button
            variant="outline"
            icon={<ArrowLeft size={16} />}
            onClick={back}
            style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
          >
            Kembali
          </Button>
        }
      />

      <Card>
        <CardBody>
          {loading || !initial ? (
            <p className="text-xs text-slate-500">Memuat data...</p>
          ) : (
            <>
              <div className="flex items-start gap-3 pb-4 border-b border-slate-100 mb-4">
                <span
                  className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
                  style={{ background: 'var(--module-primary-subtle)', color: 'var(--module-primary)' }}
                >
                  <ClipboardCheck size={16} />
                </span>
                <div>
                  <p className="text-xs font-extrabold text-slate-900">{title || 'Rubrik Penilaian'}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Perbarui identitas, status, dan kriteria rubrik asesmen.</p>
                </div>
              </div>
              <RubrikForm
                key={id}
                defaultValues={{ ...initial, prodiOption }}
                onSubmit={handleSubmit}
                onCancel={back}
                submitLabel="Simpan Perubahan"
              />
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
