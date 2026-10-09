'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, ClipboardCheck } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { RubrikForm, suggestKodeRubrik, type RubrikFormValues } from '@/components/siakad/RubrikForm';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

export default function CreateRubrikPage() {
  const router = useRouter();
  const back = () => router.push('/siakad/obe/rubrik');

  const handleSubmit = async (values: RubrikFormValues) => {
    try {
      await siakadService.createObeRubrik({
        kode_rubrik: values.kode_rubrik.trim() || suggestKodeRubrik(values.nama_rubrik),
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
      toast.success('Rubrik penilaian baru berhasil disimpan');
      back();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || 'Gagal menyimpan rubrik');
      throw err;
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Tambah Rubrik Penilaian"
        description="Instrumen rubrik asesmen, kriteria penilaian, bobot, dan rentang skor minimum/maksimum."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Rubrik Penilaian', href: '/siakad/obe/rubrik' },
          { label: 'Tambah' },
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
          <div className="flex items-start gap-3 pb-4 border-b border-slate-100 mb-4">
            <span
              className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
              style={{ background: 'var(--module-primary-subtle)', color: 'var(--module-primary)' }}
            >
              <ClipboardCheck size={16} />
            </span>
            <div>
              <p className="text-xs font-extrabold text-slate-900">Instrumen Rubrik Asesmen</p>
              <p className="text-xs text-slate-500 mt-0.5">Identitas rubrik, status, dan daftar kriteria beserta bobot dan skor.</p>
            </div>
          </div>
          <RubrikForm onSubmit={handleSubmit} onCancel={back} submitLabel="Simpan Rubrik" />
        </CardBody>
      </Card>
    </div>
  );
}
