'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, CalendarCheck } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { TahunAkademikForm } from '@/components/siakad/TahunAkademikForm';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

export default function CreateTahunAkademikPage() {
  const router = useRouter();

  const handleSubmit = async (values: Record<string, any>) => {
    try {
      await siakadService.storeTahunAkademik(values);
      toast.success('Periode tahun akademik berhasil ditambahkan');
      router.push('/siakad/master/tahun-akademik');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal menambahkan tahun akademik');
      throw err;
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Buka Periode Tahun Akademik Baru"
        description="Definisikan kode, kalender jendela KRS/perkuliahan/nilai, dan mode penilaian periode."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Tahun Akademik', href: '/siakad/master/tahun-akademik' },
          { label: 'Buka Periode' },
        ]}
        action={
          <Button
            variant="outline"
            icon={<ArrowLeft size={16} />}
            onClick={() => router.push('/siakad/master/tahun-akademik')}
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
              <CalendarCheck size={16} />
            </span>
            <div>
              <p className="text-xs font-extrabold text-slate-900">Identitas, Kalender & Mode Penilaian</p>
              <p className="text-xs text-slate-500 mt-0.5">Aktivasi periode dilakukan dari halaman daftar via Set Sebagai Aktif.</p>
            </div>
          </div>
          <TahunAkademikForm
            onSubmit={handleSubmit}
            onCancel={() => router.push('/siakad/master/tahun-akademik')}
          />
        </CardBody>
      </Card>
    </div>
  );
}
