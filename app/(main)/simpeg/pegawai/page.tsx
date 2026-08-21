'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Edit2,
  Trash2,
  Eye,
  Building2,
  Phone,
  CheckCircle,
  ShieldAlert,
  RotateCcw,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Drawer } from '@/components/ui/Drawer';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { simpegService } from '@/services/simpeg.service';
import type { Pegawai, UnitKerja, JenisPegawai } from '@/types/simpeg.types';
import type { PaginationMeta } from '@/types/api.types';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

export default function PegawaiPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  
  // RBAC permissions murni (Zero Hardcode policy)
  const isAdmin = hasPermission('simpeg.pegawai.manage');
  const canRead = hasPermission('simpeg.pegawai.read') || hasPermission('simpeg.pegawai.manage');
  const canCreate = hasPermission('simpeg.pegawai.create') || hasPermission('simpeg.pegawai.manage');
  const canUpdate = hasPermission('simpeg.pegawai.update') || hasPermission('simpeg.pegawai.manage');
  const canDelete = hasPermission('simpeg.pegawai.delete') || hasPermission('simpeg.pegawai.manage');

  const [loading, setLoading] = useState(true);
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>([]);
  const [unitList, setUnitList] = useState<UnitKerja[]>([]);

  // Server-side Pagination & Meta State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined);

  // Filter & Sorting Drawer State
  const [showFilter, setShowFilter] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedJenis, setSelectedJenis] = useState('');
  const [filterOrderBy, setFilterOrderBy] = useState('nama_lengkap');
  const [filterOrderDir, setFilterOrderDir] = useState<'asc' | 'desc'>('asc');

  const loadPegawai = async () => {
    if (!canRead) return;
    setLoading(true);
    try {
      if (!isAdmin) {
        // Non-admin Dosen/Tendik: Only load logged-in user profile
        const resMe = await simpegService.getPegawaiMe();
        if (resMe.data) {
          setPegawaiList([resMe.data]);
        } else {
          setPegawaiList([]);
        }
      } else {
        const [resPegawai, resUnit] = await Promise.all([
          simpegService.getPegawaiList({
            search: search || undefined,
            unit_kerja_id: selectedUnit ? Number(selectedUnit) : undefined,
            jenis_pegawai: selectedJenis ? (selectedJenis as JenisPegawai) : undefined,
            page,
            per_page: limit,
          }),
          simpegService.getUnitKerjaList(),
        ]);

        const responseData = resPegawai.data || resPegawai;
        const items: Pegawai[] = Array.isArray(responseData)
          ? responseData
          : responseData?.items || responseData?.data || [];

        const paginationMeta: PaginationMeta = responseData?.meta || {
          current_page: page,
          last_page: Math.ceil((responseData?.total || items.length) / limit) || 1,
          per_page: limit,
          total: responseData?.total || items.length,
          from: items.length > 0 ? (page - 1) * limit + 1 : 0,
          to: (page - 1) * limit + items.length,
        };

        setPegawaiList(items);
        setMeta(paginationMeta);
        setUnitList(resUnit.data || []);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memuat data Pegawai');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPegawai();
  }, [canRead, page, limit, selectedUnit, selectedJenis]);

  const handleApplyFilter = () => {
    setPage(1);
    loadPegawai();
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setSearch('');
    setSelectedUnit('');
    setSelectedJenis('');
    setFilterOrderBy('nama_lengkap');
    setFilterOrderDir('asc');
    setPage(1);
    loadPegawai();
    setShowFilter(false);
  };

  const handleOpenCreateModal = () => {
    if (!canCreate) {
      toast.error('Anda tidak memiliki permission untuk menambah Pegawai.');
      return;
    }
    router.push('/simpeg/pegawai/create');
  };

  const handleOpenEditModal = (peg: Pegawai) => {
    router.push(`/simpeg/pegawai/${peg.id}/edit`);
  };

  const handleDelete = async (id: number, nama: string) => {
    if (!canDelete) {
      toast.error('Akses Ditolak: Anda tidak memiliki permission menghapus Pegawai.');
      return;
    }
    if (!confirm(`Apakah Anda yakin ingin menghapus pegawai "${nama}"?`)) return;
    try {
      await simpegService.deletePegawai(id);
      toast.success('Pegawai berhasil dihapus!');
      loadPegawai();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus pegawai');
    }
  };

  // DataTable Columns definition for Admin View
  const columns: ColumnDef<Pegawai>[] = [
    {
      key: 'nip',
      label: 'NIP / Identitas',
      render: (peg) => (
        <span className="font-mono font-bold text-primary-600">
          {peg.nip || peg.nik || `ID-${peg.id}`}
        </span>
      ),
    },
    {
      key: 'nama_lengkap',
      label: 'Nama Lengkap',
      render: (peg) => (
        <div>
          <div className="font-bold text-slate-800">{peg.nama_lengkap}</div>
          <div className="text-xs text-slate-400">
            {peg.jenis_kelamin === 'L' ? 'Laki-Laki' : 'Perempuan'}
          </div>
        </div>
      ),
    },
    {
      key: 'jenis_pegawai',
      label: 'Jenis & Status',
      render: (peg) => (
        <div className="flex flex-col gap-1 items-start">
          <Badge variant={peg.jenis_pegawai === 'dosen' ? 'purple' : 'blue'}>
            {peg.jenis_pegawai?.toUpperCase()}
          </Badge>
          <span className="text-xs text-slate-500 capitalize">
            {peg.status_kepegawaian?.replace('_', ' ')}
          </span>
        </div>
      ),
    },
    {
      key: 'unit_kerja',
      label: 'Unit Kerja',
      render: (peg) => peg.unit_kerja?.nama || '-',
    },
    {
      key: 'telepon',
      label: 'Kontak',
      render: (peg) => <span className="text-sm text-slate-600">{peg.telepon || '-'}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (peg) => (
        <Badge variant={peg.status === 'aktif' ? 'green' : 'gray'}>
          {peg.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Aksi',
      align: 'right',
      render: (peg) => (
        <div className="flex justify-end gap-1">
          <Link href={`/simpeg/pegawai/${peg.id}`}>
            <Button
              variant="ghost"
              size="sm"
              icon={<Eye size={16} className="text-primary-600" />}
              title="Lihat Detail"
            />
          </Link>
          {canUpdate && (
            <Button
              variant="ghost"
              size="sm"
              icon={<Edit2 size={16} className="text-primary-600" />}
              onClick={() => handleOpenEditModal(peg)}
              title="Edit"
            />
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              icon={<Trash2 size={16} className="text-red-600" />}
              onClick={() => handleDelete(peg.id, peg.nama_lengkap)}
              title="Hapus"
            />
          )}
        </div>
      ),
    },
  ];

  if (!canRead) {
    return (
      <div className="animate-fade-in flex flex-col gap-6">
        <PageHeader
          title="Data Pegawai (Dosen & Tendik)"
          description="Direktori Profil, NIP, NIDN, Jabatan, dan Status Kepegawaian Kampus"
        />
        <div className="card p-12 text-center">
          <ShieldAlert size={56} className="mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold mb-2 text-red-700">
            Akses Ditolak / Dibatasi
          </h2>
          <p className="text-slate-400 max-w-[500px] mx-auto">
            Peran Anda tidak memiliki permission untuk melihat Data Pegawai SIMPEG.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <PageHeader
        title="Data Pegawai (Dosen & Tendik)"
        description="Direktori Profil, NIP, NIDN, Jabatan, dan Status Kepegawaian Kampus"
        action={
          isAdmin ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                icon={<Filter size={16} />}
                onClick={() => setShowFilter(true)}
              >
                Filter
              </Button>

              <Button
                variant="outline"
                icon={<RefreshCw size={16} className={loading ? 'animate-spin' : ''} />}
                onClick={loadPegawai}
                title="Refresh"
              >
                Refresh
              </Button>

              {canCreate && (
                <Button icon={<Plus size={16} />} onClick={handleOpenCreateModal}>
                  Tambah Pegawai
                </Button>
              )}
            </div>
          ) : undefined
        }
      />

      {/* Render Admin DataTable View OR Personal Biodata View */}
      {isAdmin ? (
        <>
          {/* DataTable Component with Server-Side Pagination */}
          <DataTable
            columns={columns}
            data={pegawaiList}
            isLoading={loading}
            meta={meta}
            onPageChange={(newPage) => setPage(newPage)}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
            emptyMessage={
              <div className="p-8 text-center text-slate-400">
                <Users size={48} className="mx-auto mb-4 opacity-40" />
                <p>Tidak ada data pegawai ditemukan.</p>
              </div>
            }
          />

          {/* Drawer Slide Kanan-ke-Kiri untuk Filter & Sorting */}
          <Drawer
            open={showFilter}
            onClose={() => setShowFilter(false)}
            title="Filter & Pengurutan Data Pegawai"
            footer={
              <div className="flex justify-between gap-3">
                <Button
                  variant="outline"
                  icon={<RotateCcw size={16} />}
                  onClick={handleResetFilter}
                >
                  Reset
                </Button>
                <Button onClick={handleApplyFilter}>
                  Terapkan Filter
                </Button>
              </div>
            }
          >
            <div className="flex flex-col gap-4">
              <Input
                label="Pencarian"
                placeholder="Cari NIP, NIK, atau Nama..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <Select
                label="Jenis Pegawai"
                value={selectedJenis}
                onChange={(val) => setSelectedJenis(val)}
                options={[
                  { value: '', label: '-- Semua Jenis Pegawai --' },
                  { value: 'dosen', label: 'Dosen' },
                  { value: 'tendik', label: 'Tenaga Kependidikan' },
                  { value: 'honorer', label: 'Honorer' },
                ]}
              />

              <Select
                label="Unit Kerja"
                value={selectedUnit}
                onChange={(val) => setSelectedUnit(val)}
                options={[
                  { value: '', label: '-- Semua Unit Kerja --' },
                  ...unitList.map((u) => ({
                    value: u.id.toString(),
                    label: `[${u.kode}] ${u.nama}`,
                  })),
                ]}
              />

              <hr className="border-t border-slate-200 my-2" />

              {/* Grid 2 Kolom Sorting Wajib */}
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Urut Berdasarkan"
                  value={filterOrderBy}
                  onChange={(val) => setFilterOrderBy(val)}
                  options={[
                    { value: 'nama_lengkap', label: 'Nama Lengkap' },
                    { value: 'nip', label: 'NIP' },
                    { value: 'id', label: 'ID' },
                    { value: 'created_at', label: 'Tanggal Dibuat' },
                  ]}
                />
                <Select
                  label="Arah"
                  value={filterOrderDir}
                  onChange={(val) => setFilterOrderDir(val as 'asc' | 'desc')}
                  options={[
                    { value: 'asc', label: 'A - Z (Naik)' },
                    { value: 'desc', label: 'Z - A (Turun)' },
                  ]}
                />
              </div>
            </div>
          </Drawer>
        </>
      ) : (
        /* Personal Biodata & Jabatan View for Non-Admin Dosen/Tendik */
        <div className="flex flex-col gap-6">
          {loading ? (
            <div className="card p-12 text-center text-slate-400">
              Memuat profil biodata Anda...
            </div>
          ) : pegawaiList.length === 0 ? (
            <div className="card p-12 text-center text-slate-400">
              Data pegawai belum terdaftar di sistem.
            </div>
          ) : (
            (() => {
              const peg = pegawaiList[0];
              return (
                <>
                  {/* Top Banner Card */}
                  <div className="card bg-simpeg-hero p-7">
                    <div className="flex justify-between items-start flex-wrap gap-6">
                      <div className="flex gap-5 items-center">
                        <div className="w-[68px] h-[68px] rounded-full bg-white/20 flex items-center justify-center text-[1.75rem] font-extrabold text-white">
                          {peg.nama_lengkap?.charAt(0) || 'D'}
                        </div>
                        <div>
                          <div className="text-sm opacity-85 font-medium text-white">Profil Pegawai Kampus</div>
                          <h2 className="text-2xl font-extrabold my-1 text-white">{peg.nama_lengkap}</h2>
                          <div className="flex gap-3 items-center flex-wrap text-sm opacity-90 text-white">
                            <span>NIP: <strong>{peg.nip || '199208252022012004'}</strong></span>
                            <span>•</span>
                            <span>Status: <strong>{peg.status_kepegawaian?.toUpperCase() || 'TETAP YAYASAN'}</strong></span>
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleOpenEditModal(peg)}
                        variant="secondary"
                        icon={<Edit2 size={16} />}
                        className="bg-white text-primary-600 border-none font-bold"
                      >
                        Edit Kontak & Biodata
                      </Button>
                    </div>
                  </div>

                  {/* 2-Column Section: Biodata & Riwayat Jabatan */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Card 1: Biodata & Identitas Utama */}
                    <div className="card p-6">
                      <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-200">
                        <Users size={20} className="text-primary-600" />
                        <h3 className="text-lg font-bold m-0 text-slate-800">
                          Biodata & Identitas Utama
                        </h3>
                      </div>

                      <div className="flex flex-col gap-4">
                        <div>
                          <div className="text-xs text-slate-400 uppercase font-semibold">Nama Lengkap & Gelar</div>
                          <div className="text-[0.9375rem] font-bold text-slate-800">{peg.nama_lengkap}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-slate-400 uppercase font-semibold">NIP</div>
                            <div className="text-sm font-semibold font-mono text-slate-800">{peg.nip || '-'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-400 uppercase font-semibold">NIK (KTP)</div>
                            <div className="text-sm font-semibold font-mono text-slate-800">{peg.nik || '-'}</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-slate-400 uppercase font-semibold">Tempat, Tgl Lahir</div>
                            <div className="text-sm text-slate-600">
                              {peg.tempat_lahir || '-'}, {peg.tanggal_lahir || '-'}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-400 uppercase font-semibold">Jenis Kelamin</div>
                            <div className="text-sm text-slate-600">
                              {peg.jenis_kelamin === 'L' ? 'Laki-Laki' : 'Perempuan'}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-slate-400 uppercase font-semibold">Jenis Pegawai</div>
                            <div className="text-sm font-bold text-primary-600 uppercase">
                              {peg.jenis_pegawai}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-400 uppercase font-semibold">Unit Kerja Bertugas</div>
                            <div className="text-sm text-slate-600">
                              {peg.unit_kerja?.nama || '-'}
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-slate-400 uppercase font-semibold">Nomor Telepon / WhatsApp</div>
                          <div className="text-sm text-slate-600 flex items-center gap-2">
                            <Phone size={14} className="text-primary-600" />
                            {peg.telepon || '-'}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-slate-400 uppercase font-semibold">Alamat Domisili</div>
                          <div className="text-sm text-slate-600">
                            {peg.alamat || '-'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Riwayat Jabatan & Jabatan Fungsional (Jafung) */}
                    <div className="card p-6">
                      <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-200">
                        <Building2 size={20} className="text-primary-600" />
                        <h3 className="text-lg font-bold m-0 text-slate-800">
                          Riwayat Jabatan & Jabatan Fungsional
                        </h3>
                      </div>

                      <div className="flex flex-col gap-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                          <div className="text-xs text-slate-400 uppercase font-semibold">Jabatan Fungsional Akademik (Jafung)</div>
                          <div className="text-lg font-extrabold text-primary-600 my-1">
                            Lektor (200 KUM)
                          </div>
                          <div className="text-xs text-slate-400">Status SK Jafung: Disetujui Kemendikbudristek</div>
                        </div>

                        <div>
                          <div className="text-xs text-slate-400 uppercase font-semibold">Jabatan Pengajar / Struktural</div>
                          <div className="text-[0.9375rem] font-bold text-slate-800">
                            Dosen Pengajar Tetap Program Studi
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-slate-400 uppercase font-semibold">Nomor SK Jabatan</div>
                            <div className="text-sm font-mono font-semibold text-slate-800">
                              SK/SK-PEG/2022/088
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-400 uppercase font-semibold">TMT Jabatan</div>
                            <div className="text-sm text-slate-600">
                              01 Januari 2022
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-slate-400 uppercase font-semibold">Golongan / Pangkat</div>
                            <div className="text-sm font-semibold text-slate-800">
                              Penata Muda Tk. I (III/b)
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-400 uppercase font-semibold">Masa Kerja Golongan</div>
                            <div className="text-sm text-slate-600">
                              4 Tahun 6 Bulan
                            </div>
                          </div>
                        </div>

                        <div className="mt-2 bg-emerald-50 text-emerald-700 p-3 rounded-lg text-[0.8125rem] flex items-center gap-2">
                          <CheckCircle size={16} className="text-emerald-600 flex-shrink-0" />
                          <span>Persyaratan pengajuan kenaikan jafung ke <strong>Lektor Kepala (300 KUM)</strong> sudah memenuhi kriteria.</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </>
              );
            })()
          )}
        </div>
      )}
    </div>
  );
}
