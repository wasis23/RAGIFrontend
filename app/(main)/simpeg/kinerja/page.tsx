'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, Plus, Filter, ShieldAlert, Award, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { simpegService } from '@/services/simpeg.service';
import type { PenilaianKinerja, PredikatKinerja } from '@/types/simpeg.types';
import type { PaginationMeta } from '@/types/api.types';
import { useAuth } from '@/hooks/useAuth';

export default function KinerjaPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canRead = hasPermission('simpeg.kinerja.read') || hasPermission('simpeg.kinerja.evaluate') || hasPermission('simpeg.kinerja.manage');
  const canCreate = hasPermission('simpeg.kinerja.create') || hasPermission('simpeg.kinerja.evaluate') || hasPermission('simpeg.kinerja.manage');

  const [loading, setLoading] = useState(true);
  const [kinerjaList, setKinerjaList] = useState<PenilaianKinerja[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();

  // Filter Drawer & Pagination state
  const [showFilter, setShowFilter] = useState(false);
  const [search, setSearch] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [filterPredikat, setFilterPredikat] = useState('');
  const [filterOrderBy, setFilterOrderBy] = useState('tahun');
  const [filterOrderDir, setFilterOrderDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);

  const loadKinerja = useCallback(async () => {
    if (!canRead) return;
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page,
        limit,
        search: search || undefined,
        semester: filterSemester || undefined,
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
  }, [canRead, page, limit, search, filterSemester, filterPredikat, filterOrderBy, filterOrderDir]);

  useEffect(() => {
    loadKinerja();
  }, [loadKinerja]);

  const getPredikatBadge = (predikat: PredikatKinerja) => {
    switch (predikat) {
      case 'sangat_baik':
        return <Badge variant="success" className="uppercase">Sangat Baik</Badge>;
      case 'baik':
        return <Badge variant="blue" className="uppercase">Baik</Badge>;
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
      label: 'Tahun / Semester',
      render: (row) => (
        <span className="font-bold">
          {row.tahun} ({row.semester.toUpperCase()})
        </span>
      ),
    },
    {
      key: 'pegawai',
      label: 'Nama Pegawai',
      render: (row) => (
        <div>
          <div className="font-bold">{row.pegawai?.nama_lengkap || `Pegawai ID ${row.pegawai_id}`}</div>
          {row.pegawai?.nip && <div className="text-xs opacity-70">NIP: {row.pegawai.nip}</div>}
        </div>
      ),
    },
    {
      key: 'nilai_skp',
      label: 'Nilai SKP',
      render: (row) => <span className="font-bold">{row.nilai_skp} / 100</span>,
    },
    {
      key: 'nilai_bkd',
      label: 'Nilai BKD Dosen',
      render: (row) => (row.nilai_bkd ? `${row.nilai_bkd} SKS` : '-'),
    },
    {
      key: 'predikat',
      label: 'Predikat Kinerja',
      render: (row) => getPredikatBadge(row.predikat),
    },
    {
      key: 'evaluator',
      label: 'Evaluator / Asesor',
      render: (row) => row.evaluator?.username || 'Asesor SDM',
    },
    {
      key: 'aksi',
      label: 'Aksi',
      align: 'right',
      render: (row) => {
        const menuItems: DropdownMenuItem[] = [
          {
            label: 'Cetak Laporan SKP/BKD',
            icon: <FileText size={14} />,
            onClick: () => {
              toast.success(`Mencetak Rapor SKP ${row.pegawai?.nama_lengkap || row.id}...`);
            },
          },
        ];

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
          title="Penilaian Kinerja Pegawai (SKP & BKD)"
          description="Evaluasi Kinerja Tahunan SKP PNS/Non-PNS & Laporan Beban Kerja Dosen (BKD)"
        />
        <div className="card p-6 text-center">
          <ShieldAlert size={56} className="mx-auto mb-4 opacity-40" />
          <h2 className="text-xl font-bold mb-2">Akses Ditolak / Dibatasi</h2>
          <p className="max-w-[500px] mx-auto opacity-70">
            Peran Anda saat ini tidak memiliki permission untuk melihat Penilaian Kinerja.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Penilaian Kinerja Pegawai (SKP & BKD)"
        description="Evaluasi Kinerja Tahunan SKP PNS/Non-PNS & Laporan Beban Kerja Dosen (BKD)"
        action={
          <div className="flex gap-2">
            {canCreate && (
              <Button icon={<Plus size={16} />} onClick={() => router.push('/simpeg/kinerja/create')}>
                Input Evaluasi Kinerja
              </Button>
            )}
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setShowFilter(true)}
            >
              Filter
            </Button>
          </div>
        }
      />

      {/* Main DataTable */}
      <DataTable
        columns={columns}
        data={kinerjaList}
        isLoading={loading}
        meta={meta}
        onPageChange={(newPage) => setPage(newPage)}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
        emptyMessage={
          <div className="py-8 text-center opacity-70">
            <TrendingUp size={48} className="mx-auto mb-4 opacity-40" />
            <p>Belum ada evaluasi kinerja tercatat yang sesuai filter.</p>
          </div>
        }
      />

      {/* Filter Drawer Slide Right-to-Left */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter & Urutkan Evaluasi Kinerja"
      >
        <div className="space-y-4">
          <Input
            label="Pencarian Nama / NIP / Evaluator"
            placeholder="Cari nama pegawai..."
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
              { value: 'ganjil', label: 'Ganjil' },
              { value: 'genap', label: 'Genap' },
              { value: 'tahunan', label: 'Tahunan' },
            ]}
          />

          <Select
            label="Filter Predikat"
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
                { value: 'id', label: 'ID' },
              ]}
            />

            <Select
              label="Arah Pengurutan"
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
    </div>
  );
}
