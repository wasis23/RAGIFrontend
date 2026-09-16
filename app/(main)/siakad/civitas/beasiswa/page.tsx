'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  Filter,
  Loader2,
  Save,
  Trash2,
  Edit2,
  GraduationCap,
  Sparkles,
  Info,
  Calendar,
  Search,
  User,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { siakadService } from '@/services/siakad.service';
import type { PaginationMeta } from '@/types/api.types';

// ============================================================
// TypeScript Interfaces & Zod Validation Schema
// ============================================================

interface MahasiswaBeasiswaItem {
  id: number;
  mahasiswa_id: number;
  nim: string;
  nama_mahasiswa: string;
  prodi?: string;
  angkatan?: number;
  beasiswa_id: number;
  kode_beasiswa?: string;
  nama_beasiswa: string;
  sumber_beasiswa?: string;
  tipe_potongan?: 'persen' | 'nominal' | string;
  nilai_potongan?: number;
  potongan_text?: string;
  berlaku_mulai?: string;
  berlaku_sampai?: string;
  status: 'aktif' | 'nonaktif' | 'selesai' | string;
  created_at?: string;
}

interface BeasiswaOption {
  id: number;
  kode: string;
  nama: string;
  sumber: string;
  tipe_potongan: string;
  nilai_potongan: number;
  potongan_text: string;
  deskripsi?: string;
}

const beasiswaFormSchema = z.object({
  mahasiswa_id: z.number().min(1, 'Mahasiswa wajib dipilih.'),
  beasiswa_id: z.number().min(1, 'Program beasiswa wajib dipilih.'),
  berlaku_mulai: z.string().min(1, 'Tanggal mulai berlaku wajib diisi.'),
  berlaku_sampai: z.string().min(1, 'Tanggal selesai berlaku wajib diisi.'),
  status: z.enum(['aktif', 'nonaktif', 'selesai']),
});

type BeasiswaFormData = z.infer<typeof beasiswaFormSchema>;

const getTodayDate = () => new Date().toISOString().split('T')[0];
const getDefaultEndDate = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split('T')[0];
};

export default function SiakadBeasiswaPage() {
  const [data, setData] = useState<MahasiswaBeasiswaItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);

  // Reference options from SIKEU
  const [beasiswaOptions, setBeasiswaOptions] = useState<BeasiswaOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Filter Drawer State (2-stage: staging vs applied)
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterBeasiswaId, setFilterBeasiswaId] = useState('');
  const [filterOrderBy, setFilterOrderBy] = useState<'nama_mahasiswa' | 'nim' | 'status' | 'berlaku_mulai'>('nama_mahasiswa');
  const [filterOrderDir, setFilterOrderDir] = useState<'asc' | 'desc'>('asc');
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    status: '',
    beasiswa_id: '',
    sort_by: 'nama_mahasiswa',
    sort_order: 'asc',
  });

  // Modal Add / Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MahasiswaBeasiswaItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Student Search / Autocomplete inside Modal
  const [studentSearch, setStudentSearch] = useState('');
  const [studentResults, setStudentResults] = useState<any[]>([]);
  const [selectedStudentObj, setSelectedStudentObj] = useState<any | null>(null);
  const [searchingStudent, setSearchingStudent] = useState(false);

  // Delete Confirm Dialog State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    item: MahasiswaBeasiswaItem | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    item: null,
    isLoading: false,
  });

  // React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BeasiswaFormData>({
    resolver: zodResolver(beasiswaFormSchema),
    defaultValues: {
      mahasiswa_id: 0,
      beasiswa_id: 0,
      berlaku_mulai: getTodayDate(),
      berlaku_sampai: getDefaultEndDate(),
      status: 'aktif',
    },
  });

  const selectedBeasiswaId = watch('beasiswa_id');
  const activeBeasiswaDetail = useMemo(() => {
    return beasiswaOptions.find((b) => b.id === Number(selectedBeasiswaId));
  }, [beasiswaOptions, selectedBeasiswaId]);

  // ============================================================
  // Data Fetching
  // ============================================================

  const fetchBeasiswaOptions = async () => {
    try {
      setLoadingOptions(true);
      const res = await siakadService.getBeasiswaOptions();
      setBeasiswaOptions(Array.isArray(res.data) ? res.data : []);
    } catch {
      setBeasiswaOptions([]);
    } finally {
      setLoadingOptions(false);
    }
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        per_page: limit,
        sort_by: appliedFilters.sort_by,
        sort_order: appliedFilters.sort_order,
      };

      if (appliedFilters.search) {
        params.search = appliedFilters.search;
      }
      if (appliedFilters.status) {
        params.status = appliedFilters.status;
      }
      if (appliedFilters.beasiswa_id) {
        params.beasiswa_id = appliedFilters.beasiswa_id;
      }

      const res = await siakadService.getMahasiswaBeasiswaList(params);
      setData(Array.isArray(res.data) ? res.data : []);
      if (res.meta) {
        setMeta(res.meta);
      }
    } catch (err: any) {
      setData([]);
      toast.error(err?.response?.data?.message || 'Gagal memuat data penerima beasiswa');
    } finally {
      setLoading(false);
    }
  }, [page, limit, appliedFilters]);

  useEffect(() => {
    fetchBeasiswaOptions();
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ============================================================
  // Student Search Debounce for Add Modal
  // ============================================================
  useEffect(() => {
    if (!isModalOpen || editingItem) return;
    if (!studentSearch || studentSearch.trim().length < 2) {
      setStudentResults([]);
      setSearchingStudent(false);
      return;
    }

    let isMounted = true;
    setSearchingStudent(true);
    const timer = setTimeout(async () => {
      try {
        const res = await siakadService.getMahasiswas({ search: studentSearch.trim(), per_page: 8 });
        if (isMounted) {
          setStudentResults(Array.isArray(res.data) ? res.data : []);
        }
      } catch {
        if (isMounted) setStudentResults([]);
      } finally {
        if (isMounted) setSearchingStudent(false);
      }
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [studentSearch, isModalOpen, editingItem]);

  // ============================================================
  // Handlers: Filter Drawer
  // ============================================================

  const handleApplyFilter = () => {
    setAppliedFilters({
      search: filterSearch,
      status: filterStatus,
      beasiswa_id: filterBeasiswaId,
      sort_by: filterOrderBy,
      sort_order: filterOrderDir,
    });
    setPage(1);
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterStatus('');
    setFilterBeasiswaId('');
    setFilterOrderBy('nama_mahasiswa');
    setFilterOrderDir('asc');
    setAppliedFilters({
      search: '',
      status: '',
      beasiswa_id: '',
      sort_by: 'nama_mahasiswa',
      sort_order: 'asc',
    });
    setPage(1);
    setShowFilter(false);
  };

  // ============================================================
  // Handlers: Add / Edit Modal
  // ============================================================

  const handleOpenAdd = () => {
    setEditingItem(null);
    setSelectedStudentObj(null);
    setStudentSearch('');
    setStudentResults([]);
    reset({
      mahasiswa_id: 0,
      beasiswa_id: beasiswaOptions.length > 0 ? beasiswaOptions[0].id : 0,
      berlaku_mulai: getTodayDate(),
      berlaku_sampai: getDefaultEndDate(),
      status: 'aktif',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: MahasiswaBeasiswaItem) => {
    setEditingItem(item);
    setSelectedStudentObj({
      id: item.mahasiswa_id,
      nama_lengkap: item.nama_mahasiswa,
      nim: item.nim,
      programStudi: { nama: item.prodi },
      angkatan: item.angkatan,
    });
    reset({
      mahasiswa_id: item.mahasiswa_id,
      beasiswa_id: item.beasiswa_id,
      berlaku_mulai: item.berlaku_mulai || getTodayDate(),
      berlaku_sampai: item.berlaku_sampai || getDefaultEndDate(),
      status: (item.status as any) || 'aktif',
    });
    setIsModalOpen(true);
  };

  const handleSelectStudent = (student: any) => {
    setSelectedStudentObj(student);
    setValue('mahasiswa_id', student.id, { shouldValidate: true });
    setStudentSearch('');
    setStudentResults([]);
  };

  const onSubmit = async (formData: BeasiswaFormData) => {
    setSubmitting(true);
    try {
      if (editingItem) {
        await siakadService.updateMahasiswaBeasiswa(editingItem.id, {
          beasiswa_id: formData.beasiswa_id,
          berlaku_mulai: formData.berlaku_mulai,
          berlaku_sampai: formData.berlaku_sampai,
          status: formData.status,
        });
        toast.success('Penetapan beasiswa mahasiswa berhasil diperbarui');
      } else {
        await siakadService.createMahasiswaBeasiswa(formData);
        toast.success('Mahasiswa berhasil ditetapkan sebagai penerima beasiswa');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Gagal menyimpan penetapan beasiswa';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // Handlers: Delete Confirm
  // ============================================================

  const handleOpenDelete = (item: MahasiswaBeasiswaItem) => {
    setDeleteModal({ isOpen: true, item, isLoading: false });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.item) return;
    setDeleteModal((prev) => ({ ...prev, isLoading: true }));
    try {
      await siakadService.deleteMahasiswaBeasiswa(deleteModal.item.id);
      toast.success('Penetapan beasiswa mahasiswa berhasil dihapus');
      setDeleteModal({ isOpen: false, item: null, isLoading: false });
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus penetapan beasiswa');
      setDeleteModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // ============================================================
  // Table Columns Definition
  // ============================================================

  const columns: ColumnDef<MahasiswaBeasiswaItem>[] = [
    {
      key: 'mahasiswa',
      label: 'MAHASISWA',
      render: (row) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-900 text-sm">{row.nama_mahasiswa}</span>
          </div>
          <p className="font-mono text-xs text-slate-500 flex items-center gap-2">
            <span>NIM: {row.nim}</span>
            {row.prodi && row.prodi !== '-' && (
              <>
                <span>•</span>
                <span className="text-slate-600 font-medium">{row.prodi}</span>
              </>
            )}
          </p>
        </div>
      ),
    },
    {
      key: 'beasiswa',
      label: 'PROGRAM BEASISWA',
      render: (row) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <GraduationCap size={15} className="text-primary-600 shrink-0" />
            <span className="font-bold text-slate-800 text-xs">{row.nama_beasiswa}</span>
          </div>
          {row.sumber_beasiswa && (
            <span className="inline-block text-2xs uppercase tracking-wider font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              Sumber: {row.sumber_beasiswa}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'skema_potongan',
      label: 'SKEMA POTONGAN (SIKEU)',
      render: (row) => (
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Sparkles size={13} className="text-emerald-600" />
            {row.potongan_text || '-'}
          </span>
          <p className="text-3xs text-slate-400 italic">Ditetapkan Keuangan</p>
        </div>
      ),
    },
    {
      key: 'masa_berlaku',
      label: 'MASA BERLAKU',
      render: (row) => (
        <div className="text-xs text-slate-600 space-y-0.5">
          <div className="flex items-center gap-1">
            <Calendar size={13} className="text-slate-400" />
            <span>{row.berlaku_mulai || '-'}</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400 text-2xs">
            <span>s/d</span>
            <span>{row.berlaku_sampai || 'Seterusnya'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      align: 'center',
      render: (row) => {
        if (row.status === 'aktif') {
          return (
            <Badge variant="success" className="font-bold text-xs gap-1">
              <CheckCircle2 size={12} />
              Aktif
            </Badge>
          );
        }
        if (row.status === 'selesai') {
          return (
            <Badge variant="warning" className="font-bold text-xs gap-1">
              <Clock size={12} />
              Selesai
            </Badge>
          );
        }
        return (
          <Badge variant="gray" className="font-bold text-xs gap-1">
            <XCircle size={12} />
            Non-Aktif
          </Badge>
        );
      },
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
                label: 'Ubah Penetapan',
                icon: <Edit2 size={14} />,
                onClick: () => handleOpenEdit(row),
              },
              {
                label: 'Hapus Penerima',
                icon: <Trash2 size={14} />,
                variant: 'danger',
                onClick: () => handleOpenDelete(row),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="w-full space-y-6 animate-fade-in pb-16">
      {/* Page Header */}
      <PageHeader
        title="Penerima Beasiswa Mahasiswa"
        description="Kelola penetapan mahasiswa penerima beasiswa oleh BAAK. Besaran dan skema pemotongan biaya dikonfigurasi secara terpusat oleh Bagian Keuangan (SIKEU)."
        action={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setShowFilter(true)}
              className="font-bold text-xs"
            >
              Filter Data
            </Button>
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={handleOpenAdd}
              className="font-bold text-xs shadow-xs"
            >
              Tetapkan Penerima
            </Button>
          </div>
        }
      />

      {/* Info Context Card */}
      <div className="p-4 bg-linear-to-r from-primary-500/10 via-primary-500/5 to-transparent border border-primary-200/80 rounded-2xl flex items-start gap-3">
        <div className="p-2 bg-primary-600 text-white rounded-xl shrink-0 mt-0.5 shadow-2xs">
          <ShieldCheck size={18} />
        </div>
        <div className="space-y-1">
          <h2 className="text-xs font-bold text-slate-900">
            Pemisahan Wewenang BAAK & SIKEU
          </h2>
          <p className="text-2xs text-slate-600 leading-relaxed">
            Admin BAAK bertugas memilih <strong>mahasiswa</strong> dan <strong>program beasiswa</strong> yang diterima berdasarkan SK penetapan. Aturan komponen biaya serta besaran potongan (persen maupun nominal) dikelola sepenuhnya oleh Keuangan di modul SIKEU dan otomatis memotong tagihan saat periode invoice diterbitkan.
          </p>
        </div>
      </div>

      {/* Main DataTable */}
      <div className="w-full bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <DataTable
          columns={columns}
          data={data}
          isLoading={loading}
          meta={meta}
          onPageChange={(newPage) => setPage(newPage)}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
          emptyMessage={
            <div className="text-center py-12 space-y-3">
              <GraduationCap size={40} className="mx-auto text-slate-300 stroke-[1.5]" />
              <p className="text-sm font-bold text-slate-700">Belum ada mahasiswa penerima beasiswa</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Silakan klik tombol <strong>Tetapkan Penerima</strong> di atas untuk menambahkan mahasiswa yang berhak memperoleh beasiswa.
              </p>
            </div>
          }
        />
      </div>

      {/* Filter Drawer (Slide Right-to-Left) */}
      <Drawer
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Penerima Beasiswa"
        width="400px"
        footer={
          <div className="flex items-center justify-between gap-3 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={handleResetFilter}
              className="font-bold text-slate-600 min-h-[40px] px-4 text-xs"
            >
              Reset
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleApplyFilter}
              className="font-bold shadow-xs min-h-[40px] px-5 text-xs"
            >
              Terapkan Filter
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-2">
          <Input
            label="Cari Mahasiswa / NIM / Beasiswa"
            placeholder="Ketik kata kunci pencarian..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />

          <Select
            label="Program Beasiswa"
            value={filterBeasiswaId}
            onChange={(val) => setFilterBeasiswaId(String(val || ''))}
            options={[
              { value: '', label: 'Semua Program Beasiswa' },
              ...beasiswaOptions.map((b) => ({
                value: String(b.id),
                label: `${b.nama} (${b.potongan_text})`,
              })),
            ]}
          />

          <Select
            label="Status Penerima"
            value={filterStatus}
            onChange={(val) => setFilterStatus(String(val || ''))}
            options={[
              { value: '', label: 'Semua Status' },
              { value: 'aktif', label: 'Aktif' },
              { value: 'nonaktif', label: 'Non-Aktif' },
              { value: 'selesai', label: 'Selesai' },
            ]}
          />

          <hr className="border-t border-slate-200 my-2" />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={filterOrderBy}
              onChange={(val) => setFilterOrderBy(val as any)}
              options={[
                { value: 'nama_mahasiswa', label: 'Nama Mahasiswa' },
                { value: 'nim', label: 'NIM' },
                { value: 'status', label: 'Status' },
                { value: 'berlaku_mulai', label: 'Mulai Berlaku' },
              ]}
            />
            <Select
              label="Arah"
              value={filterOrderDir}
              onChange={(val) => setFilterOrderDir(val as any)}
              options={[
                { value: 'asc', label: 'A - Z (Naik)' },
                { value: 'desc', label: 'Z - A (Turun)' },
              ]}
            />
          </div>
        </div>
      </Drawer>

      {/* Modal Tambah / Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !submitting && setIsModalOpen(false)}
        title={editingItem ? 'Ubah Penetapan Beasiswa' : 'Tetapkan Penerima Beasiswa Baru'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Mahasiswa Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Pilih Mahasiswa <span className="text-rose-500">*</span>
            </label>

            {!editingItem ? (
              !selectedStudentObj ? (
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      placeholder="Ketik minimal 2 karakter (NIM atau Nama Mahasiswa)..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                    />
                    {searchingStudent && (
                      <div className="absolute right-3 top-2.5 text-slate-400">
                        <Loader2 size={16} className="animate-spin text-primary-600" />
                      </div>
                    )}
                  </div>

                  {studentResults.length > 0 && (
                    <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl bg-white divide-y divide-slate-100 shadow-sm">
                      {studentResults.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => handleSelectStudent(s)}
                          className="w-full text-left px-3 py-2 hover:bg-primary-50 transition-colors flex items-center justify-between group"
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-800 group-hover:text-primary-700">
                              {s.nama_lengkap || s.nama}
                            </p>
                            <p className="text-2xs text-slate-500 font-mono">
                              NIM: {s.nim || '-'} • Prodi: {s.programStudi?.nama || '-'} • Angkatan: {s.angkatan || '-'}
                            </p>
                          </div>
                          <span className="text-2xs font-bold text-primary-600 group-hover:underline">
                            Pilih
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-primary-50/60 border border-primary-200/80 rounded-xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-900 text-xs">
                      {selectedStudentObj.nama_lengkap || selectedStudentObj.nama}
                    </p>
                    <p className="font-mono text-2xs text-slate-600">
                      NIM: {selectedStudentObj.nim} • Prodi: {selectedStudentObj.programStudi?.nama || '-'} • Angkatan: {selectedStudentObj.angkatan || '-'}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedStudentObj(null);
                      setValue('mahasiswa_id', 0, { shouldValidate: true });
                      setStudentSearch('');
                    }}
                    className="font-bold text-rose-600 hover:bg-rose-50 text-xs"
                  >
                    Ganti
                  </Button>
                </div>
              )
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-0.5">
                <p className="font-bold text-slate-900 text-xs">{editingItem.nama_mahasiswa}</p>
                <p className="font-mono text-2xs text-slate-600">
                  NIM: {editingItem.nim} {editingItem.prodi && `• Prodi: ${editingItem.prodi}`}
                </p>
              </div>
            )}

            {errors.mahasiswa_id && (
              <p className="text-2xs text-rose-600 font-medium">{errors.mahasiswa_id.message}</p>
            )}
          </div>

          {/* Program Beasiswa Selection */}
          <div className="space-y-1.5">
            <Select
              label="Program Beasiswa *"
              value={watch('beasiswa_id')}
              onChange={(val) => setValue('beasiswa_id', Number(val), { shouldValidate: true })}
              options={beasiswaOptions.map((b) => ({
                value: b.id,
                label: `${b.nama} (${b.potongan_text}) - Sumber: ${b.sumber}`,
              }))}
              error={errors.beasiswa_id?.message}
            />

            {/* Read-Only Info Card for Selected Beasiswa */}
            {activeBeasiswaDetail && (
              <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl flex items-start gap-2.5">
                <Sparkles size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1 text-2xs text-slate-700 leading-relaxed">
                  <p>
                    <strong>Skema Potongan:</strong>{' '}
                    <span className="font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                      {activeBeasiswaDetail.potongan_text}
                    </span>{' '}
                    (Sumber: <span className="uppercase font-semibold">{activeBeasiswaDetail.sumber}</span>)
                  </p>
                  {activeBeasiswaDetail.deskripsi && (
                    <p className="text-slate-500 italic">{activeBeasiswaDetail.deskripsi}</p>
                  )}
                  <p className="text-3xs text-slate-400">
                    * Ketentuan nominal dan jenis biaya yang dipotong dikonfigurasi di Modul Keuangan (SIKEU).
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Grid 2 Kolom: Tanggal Berlaku */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="date"
              label="Berlaku Mulai *"
              {...register('berlaku_mulai')}
              error={errors.berlaku_mulai?.message}
            />
            <Input
              type="date"
              label="Berlaku Sampai *"
              {...register('berlaku_sampai')}
              error={errors.berlaku_sampai?.message}
            />
          </div>

          {/* Status Penetapan */}
          <div>
            <Select
              label="Status Penetapan *"
              value={watch('status')}
              onChange={(val) => setValue('status', val as any, { shouldValidate: true })}
              options={[
                { value: 'aktif', label: 'Aktif (Berlaku pada Tagihan)' },
                { value: 'nonaktif', label: 'Non-Aktif (Ditangguhkan)' },
                { value: 'selesai', label: 'Selesai (Masa Berlaku Berakhir)' },
              ]}
              error={errors.status?.message}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
              className="font-bold text-slate-600 text-xs"
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              icon={submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              className="font-bold shadow-xs text-xs"
            >
              {submitting ? 'Menyimpan...' : editingItem ? 'Perbarui Penetapan' : 'Simpan Penetapan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, item: null, isLoading: false })}
        onConfirm={handleConfirmDelete}
        isLoading={deleteModal.isLoading}
        title="Hapus Penerima Beasiswa"
        message={
          <span>
            Apakah Anda yakin ingin mencabut penetapan beasiswa untuk mahasiswa{' '}
            <strong>{deleteModal.item?.nama_mahasiswa}</strong> ({deleteModal.item?.nim})? Setelah dihapus, mahasiswa ini tidak lagi mendapatkan subsidi beasiswa pada invoice mendatang.
          </span>
        }
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
