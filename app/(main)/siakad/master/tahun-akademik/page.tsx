'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Check, Star, Clock, Edit2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { SIAKAD_OPTION_TYPES, useSiakadOptions } from '@/lib/siakad-options';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

export default function TahunAkademikPage() {
  const router = useRouter();
  const [tahunAkademiks, setTahunAkademiks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingActiveId, setSettingActiveId] = useState<number | null>(null);
  const modeOptions = useSiakadOptions(SIAKAD_OPTION_TYPES.MODE_PENILAIAN);
  const modeLabel = (v: string) => modeOptions.find((o) => o.value === v)?.label || v || '-';

  const fetchTahunAkademiks = async () => {
    try {
      setLoading(true);
      const res = await siakadService.getTahunAkademiks();
      if (res.data) {
        setTahunAkademiks(res.data);
      }
    } catch (err: any) {
      toast.error('Gagal memuat daftar tahun akademik');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTahunAkademiks();
  }, []);

  const handleSetActive = async (id: number) => {
    try {
      setSettingActiveId(id);
      await siakadService.setActiveTahunAkademik(id);
      toast.success('Periode aktif akademik berhasil diubah');
      fetchTahunAkademiks();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal mengubah periode aktif');
    } finally {
      setSettingActiveId(null);
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      key: 'kode',
      label: 'KODE PERIODE',
      render: (row) => (
        <span className="font-mono font-black text-slate-900 text-xs">
          {row.kode}
        </span>
      ),
    },
    {
      key: 'nama',
      label: 'NAMA PERIODE TAHUN AKADEMIK',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 text-xs block">{row.nama}</span>
          <span className="text-2xs text-slate-500">
            Tahun Ajaran: {row.tahun_mulai || '-'} / {row.tahun_selesai || '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'STATUS PERIODE',
      align: 'center',
      render: (row) =>
        row.is_active ? (
          <Badge variant="green" className="inline-flex items-center gap-1 font-bold">
            <Star size={12} />
            Periode Aktif
          </Badge>
        ) : (
          <Badge variant="gray" className="text-2xs">
            Arsip / Non-aktif
          </Badge>
        ),
    },
    {
      key: 'mode_penilaian',
      label: 'MODE PENILAIAN',
      align: 'center',
      render: (row) => (
        <Badge variant="purple" className="text-2xs">
          {modeLabel(row.mode_penilaian)}
        </Badge>
      ),
    },
    {
      key: 'aksi',
      label: 'AKSI & KONTROL',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end items-center gap-2">
          {row.is_active ? (
            <span className="text-2xs text-emerald-600 font-bold px-3 py-1 bg-emerald-50 rounded-lg border border-emerald-200">
              Sedang Berjalan
            </span>
          ) : (
            <Button
              variant="outline"
              size="sm"
              icon={<Check size={12} />}
              disabled={settingActiveId === row.id}
              onClick={() => handleSetActive(row.id)}
              className="text-2xs font-bold"
            >
              {settingActiveId === row.id ? 'Mengaktifkan...' : 'Set Sebagai Aktif'}
            </Button>
          )}
          <DropdownMenu
            items={[
              {
                label: 'Edit Periode',
                icon: <Edit2 size={14} />,
                onClick: () => router.push(`/siakad/master/tahun-akademik/${row.id}/edit`),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Tahun & Periode Akademik"
        description="Kelola master semester aktif, aktivasi kalender akademik, dan kontrol mode penilaian perkuliahan."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Master Data', href: '/siakad/master/fakultas' },
          { label: 'Tahun Akademik' },
        ]}
        action={
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => router.push('/siakad/master/tahun-akademik/create')}
          >
            Buka Periode Baru
          </Button>
        }
      />

      <div
        className="rounded-2xl p-4 flex items-start gap-3 border"
        style={{ background: 'var(--module-primary-subtle)', borderColor: 'var(--module-primary)' }}
      >
        <Clock size={20} className="shrink-0 mt-0.5" style={{ color: 'var(--module-primary)' }} />
        <div className="text-xs space-y-1">
          <p className="font-bold text-slate-900">Informasi Penetapan Periode Aktif</p>
          <p className="text-slate-600 leading-relaxed">
            Menetapkan periode aktif akan secara otomatis mensinkronkan sesi pengisian KRS mahasiswa, jadwal perkuliahan, penawaran kelas baru, serta penagihan SPP/UKT pada modul SIKEU untuk semester bersangkutan.
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={tahunAkademiks}
        isLoading={loading}
        emptyMessage="Belum ada periode tahun akademik."
      />
    </div>
  );
}
