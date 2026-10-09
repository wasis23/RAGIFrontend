'use client';

import { useState, useEffect, useTransition } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Users, Filter, CheckSquare, Square, ArrowLeft, CheckCircle2, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody } from '@/components/ui/Card';
import { siakadService } from '@/services/siakad.service';
import type { PaginationMeta } from '@/types/api.types';
import toast from 'react-hot-toast';

export default function PemetaanMahasiswaKelasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialKelas = searchParams.get('kelas') || '';
  const initialAngkatan = searchParams.get('angkatan') || '';

  const [masterKelases, setMasterKelases] = useState<any[]>([]);
  const [selectedMasterKelasId, setSelectedMasterKelasId] = useState<number | ''>('');
  const [syncDosenPa, setSyncDosenPa] = useState(true);

  // Mahasiswa Data
  const [mahasiswas, setMahasiswas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  // Selected for batch mapping
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Filter Drawer
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterAngkatan, setFilterAngkatan] = useState(initialAngkatan);
  const [filterCurrentKelas, setFilterCurrentKelas] = useState('');
  const [filterHanyaBelumAdaKelas, setFilterHanyaBelumAdaKelas] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    angkatan: initialAngkatan,
    currentKelas: '',
    hanyaBelumAdaKelas: false,
  });

  // Load Master Kelas list (scoped to user's active prodi)
  const fetchMasterKelasList = async () => {
    try {
      const res = await siakadService.getMasterKelasList({ is_active: true, per_page: 100 });
      const list = Array.isArray(res.data) ? res.data : (res.data?.items || []);
      setMasterKelases(list);

      if (initialKelas) {
        const found = list.find((k: any) => k.nama_kelas === initialKelas);
        if (found) setSelectedMasterKelasId(found.id);
      } else if (list.length > 0 && !selectedMasterKelasId) {
        setSelectedMasterKelasId(list[0].id);
      }
    } catch {
      toast.error('Gagal memuat master kelas');
    }
  };

  useEffect(() => {
    fetchMasterKelasList();
  }, []);

  const fetchMahasiswaList = async () => {
    setLoading(true);
    try {
      const res = await siakadService.getMahasiswaForPemetaanKelas({
        search: appliedFilters.search || undefined,
        angkatan: appliedFilters.angkatan ? Number(appliedFilters.angkatan) : undefined,
        kelas: appliedFilters.currentKelas || undefined,
        hanya_belum_ada_kelas: appliedFilters.hanyaBelumAdaKelas ? true : undefined,
        page,
        limit,
      });

      if (res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data.items || []);
        setMahasiswas(list);
        if (res.meta) {
          setMeta(res.meta);
        } else {
          setMeta({
            current_page: 1,
            per_page: limit,
            total: list.length,
            last_page: 1,
            from: list.length > 0 ? 1 : 0,
            to: list.length,
          });
        }
      }
    } catch {
      toast.error('Gagal memuat daftar mahasiswa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMahasiswaList();
  }, [appliedFilters, page, limit]);

  const selectedKelasObj = masterKelases.find((k) => k.id === Number(selectedMasterKelasId));

  const handleSelectAllOnPage = () => {
    const pageIds = mahasiswas.map((m) => m.id);
    const allSelected = pageIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleAssignSubmit = async () => {
    if (!selectedMasterKelasId) {
      toast.error('Pilih target kelas terlebih dahulu');
      return;
    }
    if (selectedIds.length === 0) {
      toast.error('Pilih setidaknya 1 mahasiswa untuk dipetakan');
      return;
    }

    try {
      setSubmitting(true);
      const res = await siakadService.assignMahasiswaToMasterKelas({
        master_kelas_id: Number(selectedMasterKelasId),
        mahasiswa_ids: selectedIds,
        sync_dosen_pa: syncDosenPa,
      });
      toast.success(res.message || 'Pemetaan mahasiswa berhasil disimpan');
      setSelectedIds([]);
      fetchMahasiswaList();
      fetchMasterKelasList();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal memetakan mahasiswa ke kelas');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      key: 'select',
      label: (
        <div className="flex items-center justify-center">
          <Checkbox
            label=""
            checked={mahasiswas.length > 0 && mahasiswas.every((m) => selectedIds.includes(m.id))}
            onChange={handleSelectAllOnPage}
          />
        </div>
      ),
      align: 'center',
      render: (row) => (
        <div className="flex items-center justify-center">
          <Checkbox
            label=""
            checked={selectedIds.includes(row.id)}
            onChange={() => handleToggleSelect(row.id)}
          />
        </div>
      ),
    },
    {
      key: 'mahasiswa',
      label: 'MAHASISWA & NIM',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-slate-900 text-xs block">{row.nim}</span>
          <span className="font-bold text-slate-800 text-xs block">{row.nama_lengkap}</span>
          <span className="text-2xs text-slate-500 block font-mono">Angkatan: {row.angkatan || '-'}</span>
        </div>
      ),
    },
    {
      key: 'program_studi',
      label: 'PROGRAM STUDI',
      render: (row) => (
        <span className="text-xs font-semibold text-slate-700">
          {row.program_studi?.nama || '-'}
        </span>
      ),
    },
    {
      key: 'kelas_saat_ini',
      label: 'KELAS SAAT INI',
      align: 'center',
      render: (row) => (
        row.kelas ? (
          <Badge variant="blue" className="font-mono text-2xs">
            {row.kelas}
          </Badge>
        ) : (
          <Badge variant="gray" className="text-2xs">
            Belum Ada Kelas
          </Badge>
        )
      ),
    },
    {
      key: 'dosen_pa',
      label: 'DOSEN PA SAAT INI',
      render: (row) => (
        <div>
          <span className="text-xs font-semibold text-slate-800 block">
            {row.dosen_wali?.nama_lengkap || '-'}
          </span>
          <span className="text-2xs text-slate-400 font-mono block">
            {row.dosen_wali?.nidn ? `NIDN: ${row.dosen_wali.nidn}` : 'Belum ada PA'}
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Pemetaan Mahasiswa ke Kelas"
        description="Petakan rombongan belajar mahasiswa per angkatan dan sinkronkan dengan Dosen PA secara otomatis."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'OBE', href: '/siakad/obe' },
          { label: 'Master Kelas', href: '/siakad/obe/kelas' },
          { label: 'Pemetaan' },
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
              variant="outline"
              icon={<ArrowLeft size={16} />}
              onClick={() => router.push('/siakad/obe/kelas')}
            >
              Kembali
            </Button>
          </div>
        }
      />

      {/* Target Selection Panel */}
      <Card className="border-blue-200 bg-blue-50/40">
        <CardBody className="space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1 w-full md:w-auto">
              <label className="text-xs font-bold text-slate-800 mb-1.5 block">
                Target Master Kelas Tujuan (Program Studi Aktif)
              </label>
              <Select
                placeholder="Pilih target kelas..."
                options={masterKelases.map((k) => ({
                  value: String(k.id),
                  label: `${k.nama_kelas} — Angkatan ${k.tahun_angkatan || '-'} (PA: ${k.dosen_pa?.nama_lengkap || 'Belum ada PA'}) [${k.mahasiswas_count ?? 0} Mhs]`,
                }))}
                value={String(selectedMasterKelasId || '')}
                onChange={(val: any) => setSelectedMasterKelasId(val ? Number(val) : '')}
              />
            </div>

            <div className="flex flex-col gap-2 pt-1 md:pt-5">
              <Checkbox
                label="Sinkronkan Dosen PA Kelas ke Mahasiswa"
                checked={syncDosenPa}
                onChange={(e: any) => setSyncDosenPa(e.target ? e.target.checked : Boolean(e))}
              />
            </div>

            <div className="pt-1 md:pt-5">
              <Button
                variant="primary"
                icon={<CheckCircle2 size={16} />}
                disabled={selectedIds.length === 0 || !selectedMasterKelasId || submitting}
                loading={submitting}
                onClick={handleAssignSubmit}
              >
                Tetapkan {selectedIds.length > 0 ? `(${selectedIds.length} Mhs)` : ''} ke Kelas
              </Button>
            </div>
          </div>

          {selectedKelasObj && (
            <div className="p-3 bg-white rounded-lg border border-blue-100 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 font-mono text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                  {selectedKelasObj.nama_kelas}
                </span>
                <span className="text-slate-600">
                  Angkatan: <strong>{selectedKelasObj.tahun_angkatan || '-'}</strong>
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-600">
                  Dosen PA: <strong>{selectedKelasObj.dosen_pa?.nama_lengkap || 'Belum ditetapkan'}</strong>
                </span>
              </div>
              <div className="text-slate-500 font-medium">
                {selectedIds.length} mahasiswa terpilih untuk dipetakan
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      <DataTable
        columns={columns}
        data={mahasiswas}
        isLoading={loading}
        meta={meta}
        onPageChange={(p) => setPage(p)}
        onLimitChange={(l) => {
          setLimit(l);
          setPage(1);
        }}
        emptyMessage="Tidak ada mahasiswa yang ditemukan untuk program studi ini."
      />

      {/* Filter Drawer */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Mahasiswa"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setFilterSearch('');
                setFilterAngkatan('');
                setFilterCurrentKelas('');
                setFilterHanyaBelumAdaKelas(false);
                setAppliedFilters({
                  search: '',
                  angkatan: '',
                  currentKelas: '',
                  hanyaBelumAdaKelas: false,
                });
                setPage(1);
                setShowFilter(false);
              }}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setAppliedFilters({
                  search: filterSearch,
                  angkatan: filterAngkatan,
                  currentKelas: filterCurrentKelas,
                  hanyaBelumAdaKelas: filterHanyaBelumAdaKelas,
                });
                setPage(1);
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
            placeholder="Cari NIM, Nama Mahasiswa..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />

          <Input
            label="Tahun Angkatan"
            type="number"
            placeholder="Semua Angkatan..."
            value={filterAngkatan}
            onChange={(e) => setFilterAngkatan(e.target.value)}
          />

          <Input
            label="Kelas Saat Ini"
            placeholder="Contoh: 25A..."
            value={filterCurrentKelas}
            onChange={(e) => setFilterCurrentKelas(e.target.value)}
          />

          <Checkbox
            label="Hanya Mahasiswa yang Belum Ada Kelas"
            checked={filterHanyaBelumAdaKelas}
            onChange={(e: any) => setFilterHanyaBelumAdaKelas(e.target ? e.target.checked : Boolean(e))}
          />
        </div>
      </Drawer>
    </div>
  );
}
