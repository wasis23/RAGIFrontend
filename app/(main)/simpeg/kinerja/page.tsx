'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, Plus, Filter, ShieldAlert, FileText, CheckCircle2, Clock, AlertCircle, Trash2, Eye, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { simpegService } from '@/services/simpeg.service';
import type { PenilaianKinerja, PredikatKinerja, StatusSkp } from '@/types/simpeg.types';
import type { PaginationMeta } from '@/types/api.types';
import { useAuth } from '@/hooks/useAuth';

export default function KinerjaPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canRead = hasPermission('simpeg.kinerja.read') || hasPermission('simpeg.kinerja.evaluate') || hasPermission('simpeg.kinerja.manage');
  const canCreate = hasPermission('simpeg.kinerja.create') || hasPermission('simpeg.kinerja.manage');

  const [loading, setLoading] = useState(true);
  const [kinerjaList, setKinerjaList] = useState<PenilaianKinerja[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();

  // Filter Drawer & Pagination state
  const [showFilter, setShowFilter] = useState(false);
  const [search, setSearch] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPredikat, setFilterPredikat] = useState('');
  const [filterOrderBy, setFilterOrderBy] = useState('tahun');
  const [filterOrderDir, setFilterOrderDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);

  // Delete Confirm Dialog state
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadKinerja = useCallback(async () => {
    if (!canRead) return;
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page,
        limit,
        search: search || undefined,
        semester: filterSemester || undefined,
        status: filterStatus || undefined,
        predikat: filterPredikat || undefined,
        orderBy: filterOrderBy,
        orderDir: filterOrderDir,
      };

      const res: any = await simpegService.getKinerjaList(params);
      if (res?.data && Array.isArray(res.data)) {
        setKinerjaList(res.data);
        if (res.meta) setMeta(res.meta);
      } else if (Array.isArray(res)) {
        setKinerjaList(res);
      } else {
        setKinerjaList([]);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memuat evaluasi kinerja');
      setKinerjaList([]);
    } finally {
      setLoading(false);
    }
  }, [canRead, page, limit, search, filterSemester, filterStatus, filterPredikat, filterOrderBy, filterOrderDir]);

  useEffect(() => {
    loadKinerja();
  }, [loadKinerja]);

  // KPI Metrics Calculation
  const kpiMetrics = useMemo(() => {
    const total = meta?.total ?? kinerjaList.length;
    const draftCount = kinerjaList.filter((k) => k.status === 'draft').length;
    const pendingCount = kinerjaList.filter((k) => k.status === 'diajukan').length;
    const evaluatedCount = kinerjaList.filter((k) => k.status === 'dinilai').length;

    return { total, draftCount, pendingCount, evaluatedCount };
  }, [meta, kinerjaList]);

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await simpegService.deleteKinerja(deleteId);
      toast.success('Dokumen Sasaran Kinerja Pegawai berhasil dihapus');
      setDeleteId(null);
      loadKinerja();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus dokumen SKP');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status?: StatusSkp) => {
    switch (status) {
      case 'draft':
        return <Badge variant="gray">Draft Target</Badge>;
      case 'diajukan':
        return <Badge variant="amber">Menunggu Persetujuan</Badge>;
      case 'disetujui':
        return <Badge variant="simpeg">Target Disetujui</Badge>;
      case 'dinilai':
        return <Badge variant="success">Selesai Dinilai</Badge>;
      default:
        return <Badge variant="gray">{status || 'Draft'}</Badge>;
    }
  };

  const getPredikatBadge = (predikat: PredikatKinerja, status?: StatusSkp) => {
    if (status !== 'dinilai') {
      return <span className="text-xs text-slate-400 italic">Belum dinilai</span>;
    }
    switch (predikat) {
      case 'sangat_baik':
        return <Badge variant="success" className="uppercase">Sangat Baik</Badge>;
      case 'baik':
        return <Badge variant="simpeg" className="uppercase">Baik</Badge>;
      case 'cukup':
        return <Badge variant="yellow" className="uppercase">Cukup</Badge>;
      case 'kurang':
        return <Badge variant="warning" className="uppercase">Kurang</Badge>;
      case 'sangat_kurang':
        return <Badge variant="danger" className="uppercase">Sangat Kurang</Badge>;
      default:
        return <Badge variant="gray" className="uppercase">{predikat}</Badge>;
    }
  };

  const columns: ColumnDef<PenilaianKinerja>[] = [
    {
      key: 'tahun_semester',
      label: 'Periode / Semester',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-900">
            Tahun {row.tahun}
          </div>
          <div className="text-xs text-slate-500 uppercase font-medium">
            Semester {row.semester}
          </div>
        </div>
      ),
    },
    {
      key: 'pegawai',
      label: 'Pegawai & Penilai',
      render: (row) => (
        <div className="space-y-1">
          <div>
            <span className="font-semibold text-slate-900">{row.pegawai?.nama_lengkap || `Pegawai #${row.pegawai_id}`}</span>
            {row.pegawai?.nip && <span className="text-xs text-slate-500 block">NIP: {row.pegawai.nip}</span>}
          </div>
          {row.pejabat_penilai && (
            <div className="text-xs text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-100">
              <span className="font-medium text-slate-700">Penilai:</span> {row.pejabat_penilai.nama_lengkap}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status Alur',
      render: (row) => getStatusBadge(row.status),
    },
    {
      key: 'nilai_skp',
      label: 'Capaian SKP',
      render: (row) => (
        <div>
          {row.status === 'dinilai' ? (
            <div>
              <span className="font-bold text-base text-slate-900">{row.nilai_skp}</span>
              <span className="text-xs text-slate-500"> / 100</span>
            </div>
          ) : (
            <span className="text-xs text-slate-400">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'nilai_bkd',
      label: 'BKD Dosen',
      render: (row) => (
        <span className="text-sm font-medium text-slate-700">
          {row.nilai_bkd ? `${row.nilai_bkd} SKS` : '-'}
        </span>
      ),
    },
    {
      key: 'predikat',
      label: 'Predikat Evaluasi',
      render: (row) => getPredikatBadge(row.predikat, row.status),
    },
    {
      key: 'aksi',
      label: 'Aksi',
      align: 'right',
      render: (row) => {
        const menuItems: DropdownMenuItem[] = [
          {
            label: 'Rincian Butir & Capaian',
            icon: <Eye size={14} />,
            onClick: () => router.push(`/simpeg/kinerja/${row.id}`),
          },
        ];

        if (row.status === 'draft') {
          menuItems.push({
            label: 'Hapus Draf SKP',
            icon: <Trash2 size={14} />,
            variant: 'danger',
            onClick: () => setDeleteId(row.id),
          });
        }

        return (
          <div className="flex justify-end">
            <DropdownMenu items={menuItems} />
          </div>
        );
      },
    },
  ];

  if (!canRead) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader
          title="Sasaran Kinerja Pegawai (SKP)"
          description="Siklus Penyusunan Target Butir Kerja, Realisasi Luaran, dan Evaluasi Kinerja Dosen/Tendik"
        />
        <div className="card p-6 text-center">
          <ShieldAlert size={56} className="mx-auto mb-4 opacity-40 text-rose-500" />
          <h2 className="text-xl font-bold mb-2">Akses Ditolak / Dibatasi</h2>
          <p className="max-w-[500px] mx-auto opacity-70">
            Peran Anda saat ini tidak memiliki permission untuk melihat data Sasaran Kinerja Pegawai.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Sasaran Kinerja Pegawai (SKP)"
        description="Siklus Penyusunan Target Butir Kerja, Realisasi Luaran, dan Evaluasi Kinerja Dosen/Tendik"
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setShowFilter(true)}
            >
              Filter
            </Button>
            {canCreate && (
              <Button icon={<Plus size={16} />} onClick={() => router.push('/simpeg/kinerja/create')}>
                Susun Sasaran Baru
              </Button>
            )}
          </div>
        }
      />

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-4 bg-white border border-slate-100 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <FileText size={24} />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Dokumen SKP</div>
            <div className="text-2xl font-bold text-slate-900">{kpiMetrics.total}</div>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-4 bg-white border border-slate-100 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Menunggu Persetujuan</div>
            <div className="text-2xl font-bold text-amber-600">{kpiMetrics.pendingCount}</div>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-4 bg-white border border-slate-100 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center shrink-0">
            <AlertCircle size={24} />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Draf Target</div>
            <div className="text-2xl font-bold text-slate-700">{kpiMetrics.draftCount}</div>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-4 bg-white border border-slate-100 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Selesai Dinilai</div>
            <div className="text-2xl font-bold text-emerald-600">{kpiMetrics.evaluatedCount}</div>
          </div>
        </div>
      </div>

      {/* Main DataTable */}
      <DataTable
        columns={columns}
        data={kinerjaList}
        isLoading={loading}
        meta={meta || undefined}
        onPageChange={(newPage) => setPage(newPage)}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
        emptyMessage={
          <div className="py-8 text-center opacity-70">
            <TrendingUp size={48} className="mx-auto mb-4 opacity-40" />
            <p>Belum ada Sasaran Kinerja Pegawai yang tercatat sesuai kriteria filter.</p>
          </div>
        }
      />

      {/* Filter Drawer Slide Right-to-Left */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter & Urutkan Sasaran Kinerja"
      >
        <div className="space-y-4">
          <Input
            label="Pencarian Pegawai"
            placeholder="Cari nama, NIP, atau NIDN..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />

          <Select
            label="Filter Semester"
            value={filterSemester}
            onChange={(val) => {
              setFilterSemester(val);
              setPage(1);
            }}
            options={[
              { value: '', label: 'Semua Semester' },
              { value: 'ganjil', label: 'Semester Ganjil' },
              { value: 'genap', label: 'Semester Genap' },
              { value: 'tahunan', label: 'Tahunan' },
            ]}
          />

          <Select
            label="Filter Status Alur"
            value={filterStatus}
            onChange={(val) => {
              setFilterStatus(val);
              setPage(1);
            }}
            options={[
              { value: '', label: 'Semua Status' },
              { value: 'draft', label: 'Draft Target' },
              { value: 'diajukan', label: 'Menunggu Persetujuan Atasan' },
              { value: 'disetujui', label: 'Target Disetujui' },
              { value: 'dinilai', label: 'Selesai Dinilai' },
            ]}
          />

          <Select
            label="Filter Predikat Akhir"
            value={filterPredikat}
            onChange={(val) => {
              setFilterPredikat(val);
              setPage(1);
            }}
            options={[
              { value: '', label: 'Semua Predikat' },
              { value: 'sangat_baik', label: 'Sangat Baik' },
              { value: 'baik', label: 'Baik' },
              { value: 'cukup', label: 'Cukup' },
              { value: 'kurang', label: 'Kurang' },
              { value: 'sangat_kurang', label: 'Sangat Kurang' },
            ]}
          />

          <hr className="my-2" />

          {/* Grid 2 Kolom Sorting */}
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={filterOrderBy}
              onChange={(val) => setFilterOrderBy(val)}
              options={[
                { value: 'tahun', label: 'Tahun' },
                { value: 'nilai_skp', label: 'Nilai SKP' },
                { value: 'status', label: 'Status' },
                { value: 'id', label: 'ID' },
              ]}
            />

            <Select
              label="Arah Urutan"
              value={filterOrderDir}
              onChange={(val) => setFilterOrderDir(val as 'asc' | 'desc')}
              options={[
                { value: 'desc', label: 'Mundur (DESC)' },
                { value: 'asc', label: 'Maju (ASC)' },
              ]}
            />
          </div>
        </div>
      </Drawer>

      {/* Konfirmasi Hapus Modal */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Sasaran Kinerja Pegawai"
        message="Apakah Anda yakin ingin menghapus draf Sasaran Kinerja Pegawai ini beserta seluruh rincian butir targetnya?"
        confirmText="Ya, Hapus SKP"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
