'use client';

import { useEffect, useState, useCallback } from 'react';
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
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  Info,
  CheckCircle2,
  FileText,
  GraduationCap,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Drawer } from '@/components/ui/Drawer';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
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
  const [shiftList, setShiftList] = useState<any[]>([]);
  const [roleList, setRoleList] = useState<{ id: number; name: string; slug: string }[]>([]);

  // Server-side Pagination & Meta State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined);

  // Filter & Sorting Drawer State
  const [showFilter, setShowFilter] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedJenis, setSelectedJenis] = useState('');
  const [selectedShift, setSelectedShift] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [filterOrderBy, setFilterOrderBy] = useState('nama_lengkap');
  const [filterOrderDir, setFilterOrderDir] = useState<'asc' | 'desc'>('asc');

  // Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isLoading: boolean;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    isLoading: false,
    onConfirm: async () => {},
  });
  const [importResult, setImportResult] = useState<{
    total: number;
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      const blob = await simpegService.downloadPegawaiTemplate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'template_import_pegawai.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Template impor berhasil diunduh!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal mengunduh template impor');
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      toast.error('Pilih berkas template terlebih dahulu.');
      return;
    }

    setImporting(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append('file', importFile);

      const res = await simpegService.importPegawai(formData);
      if (res.data) {
        setImportResult(res.data);
        if (res.data.success > 0) {
          toast.success(`Berhasil mengimpor ${res.data.success} data pegawai!`);
          loadPegawai();
        }
        if (res.data.failed > 0) {
          toast.error(`Terdapat ${res.data.failed} data yang gagal diimpor.`);
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memproses berkas impor.');
    } finally {
      setImporting(false);
    }
  };

  const handleCloseImportModal = () => {
    if (importing) return;
    setShowImportModal(false);
    setImportFile(null);
    setImportResult(null);
  };

  const loadPegawai = useCallback(async () => {
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
        const [resPegawai, resUnit, resShift, resRoles] = await Promise.all([
          simpegService.getPegawaiList({
            search: search || undefined,
            unit_kerja_id: selectedUnit ? Number(selectedUnit) : undefined,
            jenis_pegawai: selectedJenis ? (selectedJenis as JenisPegawai) : undefined,
            shift_template_id: selectedShift ? Number(selectedShift) : undefined,
            role_id: selectedRoleId ? Number(selectedRoleId) : undefined,
            page,
            per_page: limit,
          }),
          simpegService.getUnitKerjaList(),
          simpegService.getShiftTemplates().catch(() => ({ status: 'error' as const, data: [] })),
          simpegService.getAvailableRoles(),
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
        setShiftList((resShift as any)?.data || []);
        if (resRoles?.data) {
          setRoleList(resRoles.data);
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memuat data Pegawai');
    } finally {
      setLoading(false);
    }
  }, [canRead, isAdmin, page, limit, selectedUnit, selectedJenis, selectedShift, selectedRoleId, search]);

  useEffect(() => {
    loadPegawai();
  }, [loadPegawai]);

  const handleApplyFilter = () => {
    setPage(1);
    loadPegawai();
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setSearch('');
    setSelectedUnit('');
    setSelectedJenis('');
    setSelectedShift('');
    setSelectedRoleId('');
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

  const handleDelete = (id: number, nama: string) => {
    if (!canDelete) {
      toast.error('Akses Ditolak: Anda tidak memiliki permission menghapus Pegawai.');
      return;
    }
    setDeleteConfirm({
      isOpen: true,
      title: 'Hapus Data Pegawai',
      message: `Apakah Anda yakin ingin menghapus pegawai "${nama}"? Tindakan ini tidak dapat dibatalkan.`,
      isLoading: false,
      onConfirm: async () => {
        try {
          setDeleteConfirm((prev) => ({ ...prev, isLoading: true }));
          await simpegService.deletePegawai(id);
          toast.success('Pegawai berhasil dihapus!');
          setDeleteConfirm((prev) => ({ ...prev, isOpen: false, isLoading: false }));
          loadPegawai();
        } catch (err: any) {
          toast.error(err?.response?.data?.message || 'Gagal menghapus pegawai');
          setDeleteConfirm((prev) => ({ ...prev, isLoading: false }));
        }
      },
    });
  };

  // DataTable Columns definition for Admin View (with Mandatory 3-Dots Action Dropdown)
  const columns: ColumnDef<Pegawai>[] = [
    {
      key: 'nip',
      label: 'NIDN / NUPTK / NIP',
      render: (peg) => {
        const nidn = peg.nidn || peg.dosen?.nidn;
        const nuptk = peg.nuptk || peg.dosen?.nuptk;
        const nip = peg.nip;

        let displayValue = '-';
        let label = '';

        if (nidn) {
          displayValue = nidn;
          label = 'NIDN';
        } else if (nuptk) {
          displayValue = nuptk;
          label = 'NUPTK';
        } else if (nip) {
          displayValue = nip;
          label = 'NIP';
        } else if (peg.nik) {
          displayValue = peg.nik;
          label = 'NIK';
        } else {
          displayValue = `ID-${peg.id}`;
        }

        return (
          <div>
            <span className="font-mono font-bold text-primary-600 block">
              {displayValue}
            </span>
            {label && (
              <span className="text-2xs text-slate-400 font-mono block">{label}</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'nama_lengkap',
      label: 'Nama Lengkap & Gelar',
      render: (peg) => (
        <div>
          <div className="font-bold text-slate-800">{peg.nama_gelar || peg.nama_lengkap}</div>
          <div className="text-xs text-slate-400">
            {peg.jenis_kelamin ? (peg.jenis_kelamin === 'L' ? 'Laki-Laki' : 'Perempuan') : '-'}
          </div>
        </div>
      ),
    },
    {
      key: 'jenis_pegawai',
      label: 'Jenis Pegawai / Role',
      render: (peg) => (
        <div className="flex flex-col gap-1 items-start">
          {peg.roles && peg.roles.length > 0 ? (
            <div className="flex flex-wrap gap-1 max-w-[220px]">
              {peg.roles.map((r) => (
                <Badge key={r.id} variant="purple" className="text-2xs font-semibold">
                  {r.name}
                </Badge>
              ))}
            </div>
          ) : peg.jenis_pegawai ? (
            <Badge variant="blue" className="text-2xs">
              {peg.jenis_pegawai}
            </Badge>
          ) : (
            <span className="text-xs text-slate-400">-</span>
          )}
          {peg.status_kepegawaian ? (
            <span className="text-xs text-slate-500 capitalize">
              {peg.status_kepegawaian.replace('_', ' ')}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: 'unit_kerja',
      label: 'Unit Kerja / Homebase',
      render: (peg) => (
        <div>
          <span className="text-xs font-medium text-slate-800 block">
            {peg.dosen?.program_studi?.nama || peg.unit_kerja?.nama || '-'}
          </span>
          {peg.dosen?.program_studi && peg.unit_kerja && (
            <span className="text-2xs text-slate-400 block">{peg.unit_kerja.nama}</span>
          )}
        </div>
      ),
    },
    {
      key: 'shift_template',
      label: 'Shift Kerja',
      render: (peg) =>
        peg.shift_template?.name ? (
          <Badge variant="cyan">{peg.shift_template.name}</Badge>
        ) : (
          <span className="text-xs text-slate-400">Belum diatur</span>
        ),
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
        <div className="flex justify-end">
          <DropdownMenu
            items={[
              {
                label: 'Lihat Detail Profil',
                icon: <Eye size={14} className="text-primary-600" />,
                onClick: () => router.push(`/simpeg/pegawai/${peg.id}`),
              },
              ...(canUpdate
                ? [
                    {
                      label: 'Edit Data Pegawai',
                      icon: <Edit2 size={14} className="text-blue-600" />,
                      onClick: () => handleOpenEditModal(peg),
                    },
                  ]
                : []),
              ...(canDelete
                ? [
                    {
                      label: 'Hapus Pegawai',
                      icon: <Trash2 size={14} className="text-rose-600" />,
                      onClick: () => handleDelete(peg.id, peg.nama_lengkap),
                    },
                  ]
                : []),
            ]}
          />
        </div>
      ),
    },
  ];

  if (!canRead) {
    return (
      <div className="animate-fade-in flex flex-col gap-6">
        <PageHeader
          title="Data Pegawai (Dosen &amp; Tendik)"
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
        title="Data Pegawai (Dosen &amp; Tendik)"
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

              {canCreate && (
                <>
                  <Button
                    variant="outline"
                    icon={<Upload size={16} />}
                    onClick={() => {
                      setImportFile(null);
                      setImportResult(null);
                      setShowImportModal(true);
                    }}
                  >
                    Import Pegawai
                  </Button>

                  <Button icon={<Plus size={16} />} onClick={handleOpenCreateModal}>
                    Tambah Pegawai
                  </Button>
                </>
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
                label="Jenis Pegawai / Peran SSO"
                value={selectedRoleId}
                onChange={(val) => setSelectedRoleId(val)}
                options={[
                  { value: '', label: '-- Semua Jenis Pegawai / Role --' },
                  ...roleList.map((r) => ({
                    value: r.id.toString(),
                    label: r.name,
                  })),
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

              <Select
                label="Shift Kerja"
                value={selectedShift}
                onChange={(val) => setSelectedShift(val)}
                options={[
                  { value: '', label: '-- Semua Shift --' },
                  ...shiftList.map((s: any) => ({
                    value: s.id.toString(),
                    label: s.name,
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
                          <h2 className="text-2xl font-extrabold my-1 text-white">{peg.nama_gelar || peg.nama_lengkap}</h2>
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
                        Edit Kontak &amp; Biodata
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
                          Biodata &amp; Identitas Utama
                        </h3>
                      </div>

                      <div className="flex flex-col gap-4">
                        <div>
                          <div className="text-xs text-slate-400 uppercase font-semibold">Nama Lengkap &amp; Gelar</div>
                          <div className="text-[0.9375rem] font-bold text-slate-800">{peg.nama_gelar || peg.nama_lengkap}</div>
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
                          Riwayat Jabatan &amp; Jabatan Fungsional
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

                    {/* Card 3: Riwayat Pendidikan Resmi & Gelar Akademik */}
                    {peg.riwayat_pendidikan && peg.riwayat_pendidikan.length > 0 && (
                      <div className="card p-6 lg:col-span-2">
                        <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-200">
                          <GraduationCap size={20} className="text-primary-600" />
                          <h3 className="text-lg font-bold m-0 text-slate-800">
                            Riwayat Pendidikan Resmi &amp; Gelar Akademik
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {peg.riwayat_pendidikan.map((edu) => (
                            <div
                              key={edu.id}
                              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between gap-3 hover:border-primary-200 transition-colors"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <Badge variant="blue" className="uppercase font-mono text-xs">
                                  {edu.jenjang}
                                </Badge>
                                {edu.is_pendidikan_terakhir && (
                                  <Badge variant="green">Pendidikan Terakhir</Badge>
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-slate-800 text-sm">{edu.nama_institusi}</div>
                                <div className="text-xs text-slate-500 mt-0.5">{edu.program_studi || '-'}</div>
                              </div>
                              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                                <span className="font-semibold text-primary-700">
                                  {edu.singkatan_gelar
                                    ? `${edu.gelar_akademik ? edu.gelar_akademik + ' ' : ''}(${edu.singkatan_gelar})`
                                    : (edu.gelar_akademik || '-')}
                                </span>
                                <span className="font-mono text-slate-500">
                                  Lulus: {edu.tahun_lulus || '-'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              );
            })()
          )}
        </div>
      )}

      {/* Modal Import Pegawai */}
      <Modal
        open={showImportModal}
        onClose={handleCloseImportModal}
        title="Import Data Pegawai (CSV / Excel)"
        size="lg"
        footer={
          <div className="flex justify-between items-center w-full">
            <Button
              variant="outline"
              onClick={handleCloseImportModal}
              disabled={importing}
            >
              {importResult ? 'Selesai / Tutup' : 'Batal'}
            </Button>
            <Button
              onClick={handleImport}
              loading={importing}
              disabled={!importFile || importing}
              icon={<Upload size={16} />}
            >
              Mulai Import Data
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-5">
          {/* Card Info SSO */}
          <div className="p-4 rounded-xl bg-primary-50 border border-primary-200 text-primary-900 flex items-start gap-3">
            <Info size={22} className="text-primary-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-primary-900">Pembuatan Akun SSO Otomatis</p>
              <p className="text-primary-700 mt-1">
                Seluruh pegawai yang berhasil di-impor akan secara otomatis dibuatkan akun SSO (<code className="font-mono bg-primary-100 px-1 py-0.5 rounded text-xs">core_users</code>) dengan default password: <strong className="font-mono bg-primary-100 px-1.5 py-0.5 rounded text-primary-800">indonusa</strong> dan role sesuai jenis pegawai (<span className="font-medium">dosen</span> / <span className="font-medium">tendik</span>).
              </p>
            </div>
          </div>

          {/* Langkah 1: Download Template */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <FileSpreadsheet size={20} />
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 text-sm">Unduh Template Berkas</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Format CSV terstandarisasi dengan contoh format kolom NIP, NIK, Nama, dan Unit Kerja.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={<Download size={14} />}
              loading={downloadingTemplate}
              disabled={downloadingTemplate}
              onClick={handleDownloadTemplate}
              className="shrink-0 bg-white"
            >
              Unduh Template
            </Button>
          </div>

          {/* Langkah 2: Upload File Area */}
          <div className="flex flex-col gap-2">
            <Input
              type="file"
              label="Pilih Berkas yang Akan Di-impor (.csv, .xlsx, .xls)"
              accept=".csv, .xlsx, .xls, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              disabled={importing}
              required
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setImportFile(file);
                  setImportResult(null);
                }
              }}
              hint="Format berkas: .csv atau .xlsx (maksimal 10MB)"
            />
            {importFile && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center gap-2">
                <FileText size={16} className="text-primary-600 shrink-0" />
                <span className="font-semibold text-slate-800">{importFile.name}</span>
                <span className="text-slate-400">({(importFile.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}
          </div>

          {/* Ringkasan Hasil Impor */}
          {importResult && (
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 animate-fade-in">
              <h4 className="font-semibold text-sm text-slate-800 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-600" />
                Hasil Proses Impor
              </h4>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="block text-xs text-slate-500">Total Baris</span>
                  <span className="text-lg font-bold text-slate-800">{importResult.total}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100">
                  <span className="block text-xs text-emerald-600">Berhasil</span>
                  <span className="text-lg font-bold text-emerald-700">{importResult.success}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-100">
                  <span className="block text-xs text-rose-600">Gagal</span>
                  <span className="text-lg font-bold text-rose-700">{importResult.failed}</span>
                </div>
              </div>

              {importResult.errors && importResult.errors.length > 0 && (
                <div className="mt-3">
                  <span className="text-xs font-semibold text-rose-700 flex items-center gap-1.5 mb-1.5">
                    <AlertCircle size={14} />
                    Catatan Error / Peringatan:
                  </span>
                  <div className="max-h-36 overflow-y-auto rounded-lg bg-rose-50 border border-rose-100 p-2.5 text-xs text-rose-800 space-y-1">
                    {importResult.errors.map((err, idx) => (
                      <div key={idx}>• {err}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={deleteConfirm.onConfirm}
        title={deleteConfirm.title}
        message={deleteConfirm.message}
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
        isLoading={deleteConfirm.isLoading}
      />
    </div>
  );
}
