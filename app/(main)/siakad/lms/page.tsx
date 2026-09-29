'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Badge } from '@/components/ui/Badge';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { lmsService } from '@/services/lms.service';
import { referensiService } from '@/services/referensi.service';
import { LmsKelasItem } from '@/types/lms.types';
import { PaginationMeta } from '@/types/api.types';
import { Filter, Eye, BookOpen, Users, Calendar, ArrowRight, RotateCcw, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LmsKelasListPage() {
  const router = useRouter();

  // State Data & Loading
  const [kelasList, setKelasList] = useState<LmsKelasItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [meta, setMeta] = useState<PaginationMeta>({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });

  // State Filter & Drawer (Paritas 1:1 terhadap 4 kolom informasi tabel)
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [filterProdi, setFilterProdi] = useState<string>('');
  const [filterTahunAkademik, setFilterTahunAkademik] = useState<string>('');
  const [filterKapasitas, setFilterKapasitas] = useState<string>('');
  const [filterOrderBy, setFilterOrderBy] = useState<string>('nama_kelas');
  const [filterOrderDir, setFilterOrderDir] = useState<string>('asc');

  // Server-side loader untuk Program Studi via AsyncSelect
  const loadProdiOptions = useCallback(async (inputValue: string) => {
    try {
      const res = await referensiService.getPaginated({
        modul: 'siakad',
        tipe: 'program_studi',
        search: inputValue || undefined,
        per_page: 20,
      });
      return (res.data || []).map((r) => ({
        value: String(r.id),
        label: r.nama,
      }));
    } catch {
      return [];
    }
  }, []);

  // Server-side loader untuk Tahun Akademik via AsyncSelect
  const loadTahunAkademikOptions = useCallback(async (inputValue: string) => {
    try {
      const res = await referensiService.getPaginated({
        modul: 'siakad',
        tipe: 'tahun_akademik',
        search: inputValue || undefined,
        per_page: 20,
      });
      return (res.data || []).map((r) => ({
        value: String(r.id),
        label: r.nama,
      }));
    } catch {
      return [];
    }
  }, []);

  // Fetch Kelas
  const fetchKelas = useCallback(async (page = 1, perPage = 10) => {
    setIsLoading(true);
    try {
      const res = await lmsService.getMyKelas({
        page,
        per_page: perPage,
        search: filterSearch || undefined,
        sort_by: filterOrderBy || 'nama_kelas',
        sort_order: (filterOrderDir as 'asc' | 'desc') || 'asc',
      });

      if (res.status === 'success' && res.data) {
        setKelasList(res.data);
        if (res.meta) {
          setMeta(res.meta);
        }
      } else {
        setKelasList([]);
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat daftar kelas LMS');
      setKelasList([]);
    } finally {
      setIsLoading(false);
    }
  }, [filterSearch, filterOrderBy, filterOrderDir]);

  useEffect(() => {
    fetchKelas(meta.current_page, meta.per_page);
  }, [fetchKelas, meta.current_page, meta.per_page]);

  const handleApplyFilter = () => {
    setShowFilter(false);
    fetchKelas(1, meta.per_page);
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterProdi('');
    setFilterTahunAkademik('');
    setFilterKapasitas('');
    setFilterOrderBy('nama_kelas');
    setFilterOrderDir('asc');
    setShowFilter(false);
  };

  // Kolom DataTable (Max 12px Rule & Format Sel 2-Baris)
  const columns: ColumnDef<LmsKelasItem>[] = [
    {
      key: 'kelas',
      label: 'MATA KULIAH & KELAS',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-800 text-xs block">
            {row.nama_kelas}
          </span>
          <span className="text-2xs text-slate-500 font-mono block">
            {row.kode_kelas} • {row.mata_kuliah?.nama || '-'} ({row.mata_kuliah?.total_sks || 0} SKS)
          </span>
        </div>
      ),
    },
    {
      key: 'prodi',
      label: 'PROGRAM STUDI',
      render: (row) => (
        <div>
          <span className="text-xs font-medium text-slate-800 block">
            {row.program_studi?.nama || '-'}
          </span>
          <span className="text-2xs text-slate-500 block">
            Jenjang: {row.program_studi?.jenjang || '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'semester',
      label: 'TAHUN AKADEMIK',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Badge variant={row.tahun_akademik?.is_aktif ? 'green' : 'gray'}>
            {row.tahun_akademik?.nama || '-'}
          </Badge>
        </div>
      ),
    },
    {
      key: 'kapasitas',
      label: 'KAPASITAS KELAS',
      align: 'center',
      render: (row) => (
        <div className="inline-flex items-center gap-2 text-xs text-slate-700 bg-slate-50 p-2 rounded-md border border-slate-200">
          <Users size={16} className="text-slate-500" />
          <span>{row.kapasitas} Mahasiswa</span>
        </div>
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
                label: 'Buka Kelas LMS',
                icon: <ArrowRight size={16} />,
                onClick: () => router.push(`/siakad/lms/${row.id}`),
              },
              {
                label: 'Detail Ringkasan',
                icon: <Eye size={16} />,
                onClick: () => router.push(`/siakad/lms/${row.id}`),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="LMS Perkuliahan"
        description="Pusat materi pembelajaran, tugas terintegrasi OBE, dan presensi realtime mahasiswa per pertemuan."
        breadcrumbs={[
          { label: 'SIAKAD', href: '/siakad/dashboard' },
          { label: 'Perkuliahan', href: '/siakad/perkuliahan' },
          { label: 'LMS' },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
              onClick={() => setShowFilter(true)}
            >
              Filter
            </Button>
          </div>
        }
      />

      {/* Overview Metric Banner (Netral Slate/Emerald/Amber) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <BookOpen size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-500">Total Kelas Diampu</div>
            <div className="text-base font-bold text-slate-800">{meta.total} Kelas Aktif</div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Calendar size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-500">Standar Pertemuan</div>
            <div className="text-base font-bold text-slate-800">16 Pertemuan / Kelas</div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-500">Metode Presensi</div>
            <div className="text-base font-bold text-slate-800">Token QR & Manual Dosen</div>
          </div>
        </div>
      </div>

      {/* Tabel Kelas LMS */}
      <DataTable
        columns={columns}
        data={kelasList}
        isLoading={isLoading}
        meta={meta}
        onPageChange={(p) => fetchKelas(p, meta.per_page)}
        onLimitChange={(lim) => fetchKelas(1, lim)}
        emptyMessage="Belum ada kelas perkuliahan yang diampu pada semester ini."
      />

      {/* Filter Drawer dengan AsyncSelect Server-Side & Paritas 100% */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Kelas LMS"
        footer={
          <div className="grid grid-cols-2 gap-2 w-full">
            <Button variant="outline" icon={<RotateCcw size={16} />} onClick={handleResetFilter}>
              Reset
            </Button>
            <Button icon={<Check size={16} />} onClick={handleApplyFilter}>
              Terapkan
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Pencarian Kelas / Mata Kuliah"
            placeholder="Cari kode kelas, nama kelas, atau nama MK..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />

          <AsyncSelect
            label="Program Studi"
            placeholder="Cari atau pilih Program Studi..."
            value={filterProdi}
            onChange={(val) => setFilterProdi(val ? String(val) : '')}
            loadOptions={loadProdiOptions}
            isClearable
          />

          <AsyncSelect
            label="Tahun Akademik"
            placeholder="Cari atau pilih Tahun Akademik..."
            value={filterTahunAkademik}
            onChange={(val) => setFilterTahunAkademik(val ? String(val) : '')}
            loadOptions={loadTahunAkademikOptions}
            isClearable
          />

          <Input
            type="number"
            label="Minimal Kapasitas Kelas"
            placeholder="Contoh: 30"
            value={filterKapasitas}
            onChange={(e) => setFilterKapasitas(e.target.value)}
          />

          <hr className="border-t border-slate-200 my-4" />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={filterOrderBy}
              onChange={(val) => setFilterOrderBy(val)}
              options={[
                { value: 'nama_kelas', label: 'Nama Kelas' },
                { value: 'kode_kelas', label: 'Kode Kelas' },
                { value: 'program_studi', label: 'Program Studi' },
                { value: 'tahun_akademik', label: 'Tahun Akademik' },
                { value: 'kapasitas', label: 'Kapasitas Kelas' },
                { value: 'id', label: 'ID Kelas' },
                { value: 'created_at', label: 'Tanggal Dibuat' },
              ]}
            />
            <Select
              label="Arah"
              value={filterOrderDir}
              onChange={(val) => setFilterOrderDir(val)}
              options={[
                { value: 'asc', label: 'A - Z (Naik)' },
                { value: 'desc', label: 'Z - A (Turun)' },
              ]}
            />
          </div>
        </div>
      </Drawer>
    </div>
  );
}
