'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Award, Plus, Filter, Edit2, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

export default function SkalaNilaiPage() {
  const router = useRouter();
  const [skalaNilais, setSkalaNilais] = useState<any[]>([]);
  const [prodis, setProdis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter Drawer State
  const [showFilter, setShowFilter] = useState(false);
  const [filterProdiId, setFilterProdiId] = useState('');
  const [filterSearch, setFilterSearch] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
    prodiId: '',
    search: '',
  });

  const [deletingItem, setDeletingItem] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [skalaRes, prodiRes] = await Promise.all([
        siakadService.getSkalaNilais({
          program_studi_id: appliedFilters.prodiId || undefined,
          search: appliedFilters.search || undefined,
        }),
        siakadService.getProdi(),
      ]);

      if (skalaRes.data) setSkalaNilais(skalaRes.data);
      if (prodiRes.data) setProdis(prodiRes.data);
    } catch (err: any) {
      toast.error('Gagal memuat data skala penilaian akademik');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [appliedFilters]);

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      setDeleting(true);
      await siakadService.deleteSkalaNilai(deletingItem.id);
      toast.success('Skala nilai berhasil dihapus');
      setDeletingItem(null);
      fetchData();
    } catch (err: any) {
      toast.error('Gagal menghapus skala nilai');
    } finally {
      setDeleting(false);
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      key: 'nilai_huruf',
      label: 'NILAI HURUF',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span
            className="w-8 h-8 rounded-lg font-black font-mono flex items-center justify-center text-sm border"
            style={{ background: 'var(--module-primary-subtle)', color: 'var(--module-primary)', borderColor: 'var(--module-primary)' }}
          >
            {row.nilai_huruf}
          </span>
          <div>
            <span className="font-bold text-slate-900 text-xs block">
              Bobot Indeks: {parseFloat(row.bobot_indeks).toFixed(2)}
            </span>
            <span className="text-2xs text-slate-500">{row.keterangan || '-'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'rentang_nilai',
      label: 'RENTANG ANGKA (0 - 100)',
      render: (row) => (
        <span className="font-mono font-bold text-slate-800 text-xs bg-slate-100 px-2 py-1 rounded">
          {parseFloat(row.batas_bawah).toFixed(1)} s.d {parseFloat(row.batas_atas).toFixed(1)}
        </span>
      ),
    },
    {
      key: 'program_studi',
      label: 'BERLAKU UNTUK',
      render: (row) => (
        <span className="text-xs font-semibold text-slate-700">
          {row.program_studi?.nama
            ? `${row.program_studi.nama}${row.program_studi.jenjang ? ` (${row.program_studi.jenjang})` : ''}`
            : 'Semua Program Studi (Standar Universitas)'}
        </span>
      ),
    },
    {
      key: 'is_lulus',
      label: 'STATUS KELULUSAN',
      align: 'center',
      render: (row) => (
        <Badge variant={row.is_lulus ? 'green' : 'red'} className="inline-flex items-center gap-1 text-2xs">
          {row.is_lulus ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
          {row.is_lulus ? 'Lulus MK' : 'Tidak Lulus (Mengulang)'}
        </Badge>
      ),
    },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end">
          <DropdownMenu
            items={[
              {
                label: 'Edit Skala Nilai',
                icon: <Edit2 size={14} />,
                onClick: () => router.push(`/siakad/master/skala-nilai/${row.id}/edit`),
              },
              {
                label: 'Hapus Skala Nilai',
                icon: <Trash2 size={14} />,
                variant: 'danger',
                onClick: () => setDeletingItem(row),
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
        title="Master Skala Nilai Mutu"
        description="Konfigurasi rentang angka penilaian, konversi huruf mutu (A s.d E), dan bobot indeks prestasi (0.00 - 4.00)."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Master Data', href: '/siakad/master/fakultas' },
          { label: 'Skala Nilai' },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setShowFilter(true)}
            >
              Filter
            </Button>
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => router.push('/siakad/master/skala-nilai/create')}
            >
              Tambah Skala Nilai
            </Button>
          </div>
        }
      />

      <div
        className="rounded-2xl p-4 flex items-start gap-3 border"
        style={{ background: 'var(--module-primary-subtle)', borderColor: 'var(--module-primary)' }}
      >
        <Award size={20} className="shrink-0 mt-0.5" style={{ color: 'var(--module-primary)' }} />
        <div className="text-xs space-y-1">
          <p className="font-bold text-slate-900">Standar Penilaian Akademik Terpusat</p>
          <p className="text-slate-600 leading-relaxed">
            Nilai akhir mahasiswa, kelulusan mata kuliah, dan bobot mutu KHS/Transkrip dihitung otomatis dari tabel acuan ini. Tetapkan skala khusus per program studi atau pakai standar universitas umum.
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={skalaNilais}
        isLoading={loading}
        emptyMessage="Belum ada skala nilai yang tersimpan."
      />

      {/* Filter Drawer */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Skala Nilai"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setFilterProdiId('');
                setFilterSearch('');
                setAppliedFilters({ prodiId: '', search: '' });
                setShowFilter(false);
              }}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setAppliedFilters({ prodiId: filterProdiId, search: filterSearch });
                setShowFilter(false);
              }}
            >
              Terapkan
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-5">
          <Input
            label="Pencarian"
            placeholder="Cari huruf mutu atau keterangan..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />
          <Select
            label="Program Studi"
            placeholder="Semua (Termasuk Standar Universitas)"
            options={prodis.map((p) => ({
              value: p.id,
              label: `${p.nama}${p.jenjang ? ` (${p.jenjang})` : ''}`,
            }))}
            value={filterProdiId || ''}
            onChange={(val: any) => setFilterProdiId(val ? String(val) : '')}
            isClearable
          />
        </div>
      </Drawer>

      <ConfirmDialog
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDelete}
        title="Hapus Skala Nilai?"
        message={
          <span>
            Apakah Anda yakin ingin menghapus skala nilai mutu <strong>{deletingItem?.nilai_huruf}</strong>?
          </span>
        }
        isLoading={deleting}
      />
    </div>
  );
}
