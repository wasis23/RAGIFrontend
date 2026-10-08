'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, CalendarCheck } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { DistribusiMengajarForm, type DistribusiMengajarFormValues } from '@/components/siakad/DistribusiMengajarForm';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

export default function EditDistribusiMengajarPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params?.id);
  const [loading, setLoading] = useState(true);
  const [initial, setInitial] = useState<any | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      try {
        const res = await siakadService.getDistribusiMengajarList({ per_page: 100 });
        const list: any[] = res.data || [];
        const found = list.find((x: any) => Number(x.id) === id);
        if (!found) {
          toast.error('Data distribusi mengajar tidak ditemukan');
          router.push('/siakad/obe/distribusi-mk');
          return;
        }
        setInitial(found);
      } catch {
        toast.error('Gagal memuat data distribusi mengajar');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSubmit = async (values: DistribusiMengajarFormValues) => {
    try {
      await siakadService.updateDistribusiMengajar(id, { ...values, is_active: true });
      toast.success('Distribusi mengajar berhasil diperbarui');
      router.push('/siakad/obe/distribusi-mk');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal memperbarui distribusi mengajar');
      throw err;
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Ubah Distribusi Mengajar"
        description="Perbarui penugasan dosen koordinator dan tim pengajar mata kuliah."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Distribusi Mata Kuliah', href: '/siakad/obe/distribusi-mk' },
          { label: 'Ubah' },
        ]}
        action={
          <Button
            variant="outline"
            icon={<ArrowLeft size={16} />}
            onClick={() => router.push('/siakad/obe/distribusi-mk')}
            className="border-[var(--module-primary)] text-[var(--module-primary)] hover:bg-[var(--module-primary-subtle)]"
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
                  className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0 bg-[var(--module-primary-subtle)] text-[var(--module-primary)]"
                >
                  <CalendarCheck size={16} />
                </span>
                <div>
                  <p className="text-xs font-extrabold text-slate-900">
                    {initial.mata_kuliah?.kode_mk} — {initial.mata_kuliah?.nama}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Perbarui kurikulum, semester, dan tim dosen pengajar.</p>
                </div>
              </div>
              <DistribusiMengajarForm
                tahunAktifNama={initial.tahun_akademik?.nama}
                defaultValues={{
                  tahun_akademik_id: initial.tahun_akademik_id,
                  tahunAkademikNama: initial.tahun_akademik?.nama,
                  kurikulum_id: initial.kurikulum_id,
                  kurikulumOption: initial.kurikulum
                    ? { value: initial.kurikulum.id, label: initial.kurikulum.nama }
                    : null,
                  mata_kuliah_id: initial.mata_kuliah_id,
                  mataKuliahOption: initial.mata_kuliah
                    ? {
                        value: initial.mata_kuliah.id,
                        label: `${initial.mata_kuliah.kode_mk} — ${initial.mata_kuliah.nama}`,
                      }
                    : null,
                  semester: initial.semester,
                  dosen_koordinator_id: initial.dosen_koordinator_id,
                  koordinatorOption: initial.dosen_koordinator
                    ? {
                        value: initial.dosen_koordinator.id,
                        label: `${initial.dosen_koordinator.nama_lengkap} — NIDN ${initial.dosen_koordinator.nidn || '-'}`,
                      }
                    : null,
                  dosen_anggota_ids: Array.isArray(initial.dosen_anggota_ids)
                    ? initial.dosen_anggota_ids.map(Number).filter(Boolean)
                    : [],
                }}
                onSubmit={handleSubmit}
                onCancel={() => router.push('/siakad/obe/distribusi-mk')}
                submitLabel="Simpan Perubahan"
              />
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
