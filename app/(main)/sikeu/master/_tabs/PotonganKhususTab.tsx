'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Filter,
  Loader2,
  Save,
  Trash2,
  Edit,
  User,
  SlidersHorizontal,
  Info,
  DollarSign,
  Percent,
  CheckCircle2,
  XCircle,
  FileText,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import { sikeuService, PotonganMahasiswa } from '@/services/sikeu.service';
import { formatRupiah } from '@/lib/utils';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const potonganFormSchema = z.object({
  mahasiswa_id: z.number().min(1, 'Silakan cari dan pilih mahasiswa terlebih dahulu'),
  nama_potongan: z.string().trim().min(1, 'Nama atau jenis potongan wajib diisi'),
  tipe_potongan: z.enum(['nominal', 'persen']),
  nilai_potongan: z.number().positive('Nilai potongan harus lebih besar dari 0'),
  master_biaya_id: z.string().optional().nullable(),
  semester: z.string().optional().nullable(),
  tahun_akademik: z.string().optional().nullable(),
  berlaku_mulai: z.string().optional().nullable(),
  berlaku_sampai: z.string().optional().nullable(),
  nomor_sk: z.string().optional().nullable(),
  keterangan: z.string().optional().nullable(),
  status: z.enum(['aktif', 'nonaktif', 'selesai']),
});

type FormValues = z.infer<typeof potonganFormSchema>;

const getTodayDate = () => new Date().toISOString().split('T')[0];
const getDefaultEndDate = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split('T')[0];
};

export interface PotonganKhususTabProps {
  setHeaderAction?: (action: React.ReactNode) => void;
}

export function PotonganKhususTab({ setHeaderAction }: PotonganKhususTabProps = {}) {
  const router = useRouter();
  const [data, setData] = useState<PotonganMahasiswa[]>([]);
  const [loading, setLoading] = useState(false);
  const [masterBiayaList, setMasterBiayaList] = useState<any[]>([]);

  // Filter Drawer State (2-stage)
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterOrderBy, setFilterOrderBy] = useState<'nama_mahasiswa' | 'nama_potongan' | 'nilai_potongan' | 'status'>('nama_mahasiswa');
  const [filterOrderDir, setFilterOrderDir] = useState<'asc' | 'desc'>('asc');
  const [appliedFilters, setAppliedFilters] = useState({ search: '', status: '' });

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PotonganMahasiswa | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirm Dialog State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    id: number | null;
    namaMahasiswa: string;
    namaPotongan: string;
  }>({
    isOpen: false,
    id: null,
    namaMahasiswa: '',
    namaPotongan: '',
  });
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Student Autocomplete Search State
  const [studentSearch, setStudentSearch] = useState('');
  const [studentResults, setStudentResults] = useState<any[]>([]);
  const [selectedStudentObj, setSelectedStudentObj] = useState<any | null>(null);
  const [searchingStudent, setSearchingStudent] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(potonganFormSchema) as any,
    defaultValues: {
      mahasiswa_id: 0,
      nama_potongan: '',
      tipe_potongan: 'nominal',
      nilai_potongan: 0,
      master_biaya_id: '',
      semester: '',
      tahun_akademik: '2026/2027',
      berlaku_mulai: getTodayDate(),
      berlaku_sampai: getDefaultEndDate(),
      nomor_sk: '',
      keterangan: '',
      status: 'aktif',
    },
  });

  const watchTipePotongan = watch('tipe_potongan');
  const watchNilaiPotongan = watch('nilai_potongan');
  const watchMasterBiayaId = watch('master_biaya_id');
  const watchSemester = watch('semester');
  const watchStatus = watch('status');

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await sikeuService.getPotonganMahasiswaList();
      setData(Array.isArray(res.data) ? res.data : []);
    } catch {
      setData([]);
      toast.error('Gagal memuat data setting potongan khusus mahasiswa');
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterBiaya = async () => {
    try {
      const res = await sikeuService.getJenisBiayaList();
      setMasterBiayaList(Array.isArray(res.data) ? res.data : []);
    } catch {
      setMasterBiayaList([]);
    }
  };

  useEffect(() => {
    fetchData();
    fetchMasterBiaya();
  }, []);

  // Debounced Student Search
  useEffect(() => {
    if (!isModalOpen || editingItem) return;
    if (!studentSearch || studentSearch.trim().length === 0) {
      setStudentResults([]);
      setSearchingStudent(false);
      return;
    }
    let isMounted = true;
    setSearchingStudent(true);
    const timer = setTimeout(async () => {
      try {
        const res = await sikeuService.searchMahasiswa(studentSearch.trim());
        if (isMounted) {
          setStudentResults(Array.isArray(res.data) ? res.data : []);
        }
      } catch {
        if (isMounted) setStudentResults([]);
      } finally {
        if (isMounted) setSearchingStudent(false);
      }
    }, 350);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [studentSearch, isModalOpen, editingItem]);

  const openAddModal = () => {
    router.push('/sikeu/pembayaran-mahasiswa/potongan/create');
  };

  useEffect(() => {
    if (setHeaderAction) {
      setHeaderAction(
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => setShowFilter(true)}
            icon={<Filter size={16} />}
            className="font-bold min-h-[38px] text-xs"
          >
            Filter
            {(appliedFilters.search || appliedFilters.status) && (
              <span className="w-2 h-2 rounded-full bg-primary-600 ml-1"></span>
            )}
          </Button>
          <Button
            variant="primary"
            onClick={openAddModal}
            icon={<Plus size={16} />}
            className="font-bold min-h-[38px] text-xs px-3.5 shadow-sm"
          >
            Tambah Potongan Mahasiswa
          </Button>
        </div>
      );
    }
  }, [setHeaderAction, appliedFilters]);

  const openEditModal = (item: PotonganMahasiswa) => {
    setEditingItem(item);
    setSelectedStudentObj({
      id: item.mahasiswa_id,
      mahasiswa_id: item.mahasiswa_id,
      nim: item.nim,
      nama: item.nama_mahasiswa,
      nama_mahasiswa: item.nama_mahasiswa,
      nama_lengkap: item.nama_mahasiswa,
    });
    reset({
      mahasiswa_id: item.mahasiswa_id,
      nama_potongan: item.nama_potongan,
      tipe_potongan: (item.tipe_potongan as 'nominal' | 'persen') || 'nominal',
      nilai_potongan: Number(item.nilai_potongan) || 0,
      master_biaya_id: item.master_biaya_id ? String(item.master_biaya_id) : '',
      semester: item.semester ? String(item.semester) : '',
      tahun_akademik: item.tahun_akademik || '',
      berlaku_mulai: item.berlaku_mulai || getTodayDate(),
      berlaku_sampai: item.berlaku_sampai || getDefaultEndDate(),
      nomor_sk: item.nomor_sk || '',
      keterangan: item.keterangan || '',
      status: (item.status as 'aktif' | 'nonaktif' | 'selesai') || 'aktif',
    });
    setIsModalOpen(true);
  };

  const handleSelectStudent = (mhs: any) => {
    const mhsId = mhs.mahasiswa_id || mhs.id;
    setValue('mahasiswa_id', Number(mhsId), { shouldValidate: true });
    setSelectedStudentObj(mhs);
    setStudentSearch('');
    setStudentResults([]);
  };

  const onSubmit = async (formData: FormValues) => {
    if (!editingItem && (!formData.mahasiswa_id || formData.mahasiswa_id <= 0)) {
      toast.error('Silakan cari dan pilih mahasiswa terlebih dahulu!');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        mahasiswa_id: formData.mahasiswa_id,
        nama_potongan: formData.nama_potongan.trim(),
        tipe_potongan: formData.tipe_potongan,
        nilai_potongan: Number(formData.nilai_potongan),
        master_biaya_id: formData.master_biaya_id && formData.master_biaya_id !== '' ? Number(formData.master_biaya_id) : null,
        semester: formData.semester && formData.semester !== '' ? Number(formData.semester) : null,
        tahun_akademik: formData.tahun_akademik?.trim() || null,
        berlaku_mulai: formData.berlaku_mulai || null,
        berlaku_sampai: formData.berlaku_sampai || null,
        nomor_sk: formData.nomor_sk?.trim() || null,
        keterangan: formData.keterangan?.trim() || null,
        status: formData.status,
      };

      if (editingItem) {
        await sikeuService.updatePotonganMahasiswa(editingItem.id, payload);
        toast.success('Pengaturan potongan khusus mahasiswa berhasil diperbarui');
      } else {
        payload.nim = selectedStudentObj?.nim;
        payload.nama_mahasiswa = selectedStudentObj?.nama_mahasiswa || selectedStudentObj?.nama_lengkap || selectedStudentObj?.nama;
        await sikeuService.createPotonganMahasiswa(payload);
        toast.success('Potongan khusus mahasiswa berhasil ditetapkan');
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menyimpan pengaturan potongan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.id) return;
    setDeleteLoading(true);
    try {
      await sikeuService.deletePotonganMahasiswa(deleteModal.id);
      toast.success('Pengaturan potongan khusus berhasil dihapus');
      setDeleteModal({ isOpen: false, id: null, namaMahasiswa: '', namaPotongan: '' });
      fetchData();
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menghapus potongan khusus');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filter Logic
  const filteredData = useMemo(() => {
    const list = data.filter((item) => {
      const searchMatch = !appliedFilters.search ||
        item.nama_mahasiswa.toLowerCase().includes(appliedFilters.search.toLowerCase()) ||
        item.nim.toLowerCase().includes(appliedFilters.search.toLowerCase()) ||
        item.nama_potongan.toLowerCase().includes(appliedFilters.search.toLowerCase()) ||
        (item.nomor_sk && item.nomor_sk.toLowerCase().includes(appliedFilters.search.toLowerCase()));

      const statusMatch = !appliedFilters.status || item.status === appliedFilters.status;

      return searchMatch && statusMatch;
    });

    list.sort((a, b) => {
      let valA: any = '';
      let valB: any = '';
      switch (filterOrderBy) {
        case 'nama_mahasiswa':
          valA = a.nama_mahasiswa?.toLowerCase() || '';
          valB = b.nama_mahasiswa?.toLowerCase() || '';
          break;
        case 'nama_potongan':
          valA = a.nama_potongan?.toLowerCase() || '';
          valB = b.nama_potongan?.toLowerCase() || '';
          break;
        case 'nilai_potongan':
          valA = Number(a.nilai_potongan || 0);
          valB = Number(b.nilai_potongan || 0);
          break;
        case 'status':
          valA = a.status || '';
          valB = b.status || '';
          break;
      }
      if (valA < valB) return filterOrderDir === 'asc' ? -1 : 1;
      if (valA > valB) return filterOrderDir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [data, appliedFilters, filterOrderBy, filterOrderDir]);

  // Statistics Summary
  const stats = useMemo(() => {
    const totalMahasiswa = new Set(data.map((d) => d.mahasiswa_id)).size;
    const totalAktif = data.filter((d) => d.status === 'aktif').length;
    return { totalMahasiswa, totalAktif, totalData: data.length };
  }, [data]);

  const columns: ColumnDef<PotonganMahasiswa>[] = [
    {
      label: 'NAMA POTONGAN',
      key: 'nama_potongan',
      render: (row: PotonganMahasiswa) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-md uppercase">
              {row.nomor_sk ? `SK: ${row.nomor_sk}` : 'POTONGAN'}
            </span>
            <p className="font-bold text-slate-900 text-sm">{row.nama_potongan}</p>
          </div>
          {row.keterangan && <p className="text-2xs text-slate-400 font-semibold mt-1 line-clamp-1">{row.keterangan}</p>}
        </div>
      ),
    },
    {
      label: 'MAHASISWA',
      key: 'nama_mahasiswa',
      render: (row: PotonganMahasiswa) => (
        <div>
          <p className="font-bold text-slate-900 text-sm">{row.nama_mahasiswa}</p>
          <p className="font-mono text-xs text-slate-500">NIM: {row.nim}</p>
        </div>
      ),
    },
    {
      label: 'KOMPONEN & TARGET',
      key: 'komponen_biaya',
      render: (row: PotonganMahasiswa) => (
        <div>
          <p className="text-xs font-semibold text-slate-700">{row.komponen_biaya || 'Semua Komponen (Total Tagihan)'}</p>
          <p className="text-2xs text-slate-500">
            {row.semester ? `Semester ${row.semester}` : 'Semua Semester'}
            {row.tahun_akademik ? ` • ${row.tahun_akademik}` : ''}
          </p>
        </div>
      ),
    },
    {
      label: 'BESARAN POTONGAN',
      key: 'nilai_potongan',
      render: (row: PotonganMahasiswa) => {
        const isPercent = row.tipe_potongan === 'persen';
        return (
          <div>
            <span className="font-bold text-slate-900 tabular-nums text-sm">
              {isPercent ? `${row.nilai_potongan}%` : formatRupiah(row.nilai_potongan)}
            </span>
            <span className="text-2xs block text-emerald-600 font-semibold mt-0.5">
              {isPercent ? 'Pengurang Persen' : 'Nominal Langsung'}
            </span>
          </div>
        );
      },
    },
    {
      label: 'MASA BERLAKU',
      key: 'berlaku_mulai',
      render: (row: PotonganMahasiswa) => (
        <div>
          <p className="text-xs font-semibold text-slate-700">{row.berlaku_mulai || 'Sekarang'}</p>
          <p className="text-2xs text-slate-500">s/d {row.berlaku_sampai || 'Seterusnya'}</p>
        </div>
      ),
    },
    {
      label: 'STATUS',
      key: 'status',
      render: (row: PotonganMahasiswa) =>
        row.status === 'aktif' ? (
          <span className="badge badge-green text-xs font-bold inline-flex items-center gap-1">
            <CheckCircle2 size={12} /> Aktif
          </span>
        ) : row.status === 'selesai' ? (
          <span className="badge badge-blue text-xs font-bold inline-flex items-center gap-1">
            <CheckCircle2 size={12} /> Selesai
          </span>
        ) : (
          <span className="badge badge-red text-xs font-bold inline-flex items-center gap-1">
            <XCircle size={12} /> Non-Aktif
          </span>
        ),
    },
    {
      label: 'AKSI',
      key: 'id',
      align: 'right',
      render: (row: PotonganMahasiswa) => (
        <div className="flex items-center justify-end">
          <DropdownMenu
            align="right"
            items={[
              {
                label: 'Edit Potongan',
                icon: <Edit size={14} />,
                onClick: () => openEditModal(row),
              },
              {
                label: 'Hapus Potongan',
                icon: <Trash2 size={14} />,
                variant: 'danger',
                onClick: () =>
                  setDeleteModal({
                    isOpen: true,
                    id: row.id,
                    namaMahasiswa: row.nama_mahasiswa,
                    namaPotongan: row.nama_potongan,
                  }),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">

      {!setHeaderAction && (
        <div className="flex items-center justify-end gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            icon={<Filter size={14} />}
            onClick={() => setShowFilter(true)}
            className="text-xs font-bold min-h-[38px]"
          >
            Filter
            {(appliedFilters.search || appliedFilters.status) && (
              <span className="w-2 h-2 rounded-full bg-primary-600 ml-1"></span>
            )}
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={15} />}
            onClick={openAddModal}
            className="text-xs font-bold min-h-[38px] px-3.5 shadow-sm"
          >
            Tambah Potongan Mahasiswa
          </Button>
        </div>
      )}

      {/* Active Filters */}
      {(appliedFilters.search || appliedFilters.status) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Filter aktif:</span>
          {appliedFilters.search && (
            <span className="badge badge-blue text-xs font-medium">
              Pencarian: &quot;{appliedFilters.search}&quot;
            </span>
          )}
          {appliedFilters.status && (
            <span className="badge badge-blue text-xs font-medium">
              Status: {appliedFilters.status.toUpperCase()}
            </span>
          )}
          <button
            onClick={() => {
              setFilterSearch('');
              setFilterStatus('');
              setFilterOrderBy('nama_mahasiswa');
              setFilterOrderDir('asc');
              setAppliedFilters({ search: '', status: '' });
            }}
            className="text-xs text-red-600 hover:text-red-700 font-semibold underline cursor-pointer ml-1"
          >
            Reset Filter
          </button>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        data={filteredData}
        isLoading={loading}
        columns={columns}
        emptyMessage="Belum ada data mahasiswa yang ditetapkan menerima potongan/keringanan khusus."
      />

      {/* Filter Drawer (2-Stage Filtering) */}
      <Drawer
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Potongan Khusus Mahasiswa"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilterSearch('');
                setFilterStatus('');
                setFilterOrderBy('nama_mahasiswa');
                setFilterOrderDir('asc');
                setAppliedFilters({ search: '', status: '' });
                setShowFilter(false);
              }}
            >
              Reset
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setAppliedFilters({ search: filterSearch, status: filterStatus });
                setShowFilter(false);
              }}
            >
              Terapkan Filter
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <Input
            label="Pencarian Mahasiswa / Potongan / SK"
            placeholder="Cari NIM, Nama Mahasiswa, Nama Potongan, No. SK..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />

          <Select
            label="Status Potongan"
            value={filterStatus}
            onChange={(val) => setFilterStatus(val as string)}
            options={[
              { value: '', label: 'Semua Status' },
              { value: 'aktif', label: 'Aktif' },
              { value: 'nonaktif', label: 'Nonaktif' },
              { value: 'selesai', label: 'Selesai' },
            ]}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Urutkan Berdasarkan"
              value={filterOrderBy}
              onChange={(val) => setFilterOrderBy(val as any)}
              options={[
                { value: 'nama_mahasiswa', label: 'Nama Mahasiswa' },
                { value: 'nama_potongan', label: 'Nama Potongan' },
                { value: 'nilai_potongan', label: 'Besaran Potongan' },
                { value: 'status', label: 'Status' },
              ]}
            />
            <Select
              label="Arah Urutan"
              value={filterOrderDir}
              onChange={(val) => setFilterOrderDir(val as any)}
              options={[
                { value: 'asc', label: 'Menaik (A-Z / 0-9)' },
                { value: 'desc', label: 'Menurun (Z-A / 9-0)' },
              ]}
            />
          </div>
        </div>
      </Drawer>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Potongan Khusus Mahasiswa' : 'Tambah Potongan Khusus Mahasiswa'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
          {/* Section 1: Student Selection */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
            <label className="text-2xs font-bold text-slate-700 uppercase tracking-wider block">
              Mahasiswa Penerima Potongan <span className="text-rose-500">*</span>
            </label>

            {editingItem ? (
              <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200">
                <div className="p-2 rounded-xl bg-primary-100 text-primary-700">
                  <User size={18} />
                </div>
                <div>
                  <p className="font-extrabold text-slate-900 text-sm">{editingItem.nama_mahasiswa}</p>
                  <p className="text-2xs text-slate-500 font-mono">NIM: {editingItem.nim}</p>
                </div>
              </div>
            ) : selectedStudentObj ? (
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                    <User size={18} />
                  </div>
                  <div>
                    <p className="font-extrabold text-emerald-950 text-sm">
                      {selectedStudentObj.nama_mahasiswa || selectedStudentObj.nama_lengkap || selectedStudentObj.nama}
                    </p>
                    <p className="text-2xs text-emerald-700 font-mono">
                      NIM: {selectedStudentObj.nim} • {selectedStudentObj.prodi_nama || selectedStudentObj.prodi || selectedStudentObj.program_studi?.nama || 'Aktif'}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs text-rose-600 hover:bg-rose-100/50 cursor-pointer"
                  onClick={() => {
                    setSelectedStudentObj(null);
                    setValue('mahasiswa_id', 0, { shouldValidate: true });
                  }}
                >
                  Ganti
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    placeholder="Ketik NIM atau Nama Mahasiswa (min. 2 karakter)..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                  />
                  {searchingStudent && (
                    <div className="absolute right-3 top-3">
                      <Loader2 size={16} className="animate-spin text-primary-600" />
                    </div>
                  )}
                </div>

                {studentResults.length > 0 && (
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl bg-white divide-y divide-slate-100 shadow-md">
                    {studentResults.map((mhs: any) => (
                      <div
                        key={mhs.mahasiswa_id || mhs.id}
                        onClick={() => handleSelectStudent(mhs)}
                        className="p-2.5 hover:bg-primary-50/70 cursor-pointer flex items-center justify-between text-xs transition-colors"
                      >
                        <div>
                          <p className="font-bold text-slate-800">{mhs.nama_mahasiswa || mhs.nama_lengkap || mhs.nama}</p>
                          <p className="text-2xs text-slate-500 font-mono">
                            NIM: {mhs.nim} • Angkatan: {mhs.tahun_angkatan || mhs.angkatan || '-'}
                          </p>
                        </div>
                        <Badge variant="blue" className="text-2xs">Pilih</Badge>
                      </div>
                    ))}
                  </div>
                )}
                {studentSearch && !searchingStudent && studentResults.length === 0 && (
                  <p className="text-2xs text-slate-400 italic">Tidak ditemukan mahasiswa dengan kata kunci tersebut.</p>
                )}
                {errors.mahasiswa_id?.message && (
                  <p className="text-2xs text-rose-500 font-semibold">{errors.mahasiswa_id.message}</p>
                )}
              </div>
            )}
          </div>

          {/* Section 2: Detail Potongan Dinamis */}
          <div className="space-y-3">
            <Input
              label="Nama / Jenis Potongan Tambahan *"
              placeholder="Contoh: Keringanan UKT Rektorat, Diskon Saudara Kandung, Potongan Afirmasi..."
              {...register('nama_potongan')}
              error={errors.nama_potongan?.message}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Tipe Potongan *"
                value={watchTipePotongan}
                onChange={(val) => setValue('tipe_potongan', (val as 'nominal' | 'persen') || 'nominal', { shouldValidate: true })}
                options={[
                  { value: 'nominal', label: 'Nominal Tetap (Rp)' },
                  { value: 'persen', label: 'Persentase (%)' },
                ]}
                error={errors.tipe_potongan?.message}
              />

              <Input
                label={watchTipePotongan === 'persen' ? 'Besaran Persentase (%) *' : 'Besaran Nominal (Rp) *'}
                type="number"
                step="any"
                placeholder={watchTipePotongan === 'persen' ? 'Contoh: 25' : 'Contoh: 1500000'}
                {...register('nilai_potongan', { valueAsNumber: true })}
                error={errors.nilai_potongan?.message}
              />
            </div>

            {/* Dynamic Preview */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <span className="text-2xs text-slate-600 font-medium">Pratinjau Pengurangan Tagihan:</span>
              <span className="text-xs font-mono font-black text-primary-700">
                {watchTipePotongan === 'persen'
                  ? `${watchNilaiPotongan || 0}% dari Total Tagihan Mahasiswa`
                  : formatRupiah(watchNilaiPotongan || 0)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Pilihan Tagihan / Komponen yang Dipotong"
                value={watchMasterBiayaId || ''}
                onChange={(val) => setValue('master_biaya_id', (val as string) || '', { shouldValidate: true })}
                options={[
                  { value: '', label: 'Semua Komponen (Total Tagihan)' },
                  ...masterBiayaList.map((mb) => ({
                    value: String(mb.id),
                    label: `${mb.nama} (${mb.kode || 'BIAYA'})`,
                  })),
                ]}
                placeholder="Pilih tagihan atau semua komponen..."
                hint="Pilih tagihan spesifik yang akan dipotong, atau biarkan semua komponen."
                error={errors.master_biaya_id?.message}
              />

              <Select
                label="Target Semester Berlaku"
                value={watchSemester || ''}
                onChange={(val) => setValue('semester', (val as string) || '', { shouldValidate: true })}
                options={[
                  { value: '', label: 'Semua Semester (Berlaku Berulang)' },
                  ...Array.from({ length: 14 }, (_, i) => ({
                    value: String(i + 1),
                    label: `Semester ${i + 1}`,
                  })),
                ]}
                placeholder="Pilih semester atau semua semester..."
                hint="Jika semester belum dipilih, potongan berlaku untuk semua semester."
                error={errors.semester?.message}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Berlaku Mulai"
                type="date"
                {...register('berlaku_mulai')}
                error={errors.berlaku_mulai?.message}
              />
              <Input
                label="Berlaku Sampai"
                type="date"
                {...register('berlaku_sampai')}
                error={errors.berlaku_sampai?.message}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Nomor SK / Dasar Dokumen"
                placeholder="Contoh: SK Rektor No. 042/SK/2026"
                {...register('nomor_sk')}
                error={errors.nomor_sk?.message}
              />

              <Select
                label="Status Potongan"
                value={watchStatus || 'aktif'}
                onChange={(val) => setValue('status', (val as 'aktif' | 'nonaktif' | 'selesai') || 'aktif', { shouldValidate: true })}
                options={[
                  { value: 'aktif', label: 'Aktif (Diterapkan ke Tagihan)' },
                  { value: 'nonaktif', label: 'Nonaktif (Ditangguhkan)' },
                  { value: 'selesai', label: 'Selesai (Sudah Tidak Berlaku)' },
                ]}
                error={errors.status?.message}
              />
            </div>

            <Textarea
              label="Catatan / Alasan Pemberian Potongan"
              rows={2}
              placeholder="Tuliskan keterangan permohonan atau pertimbangan khusus..."
              {...register('keterangan')}
              error={errors.keterangan?.message}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              icon={submitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              disabled={submitting}
            >
              {submitting ? 'Menyimpan...' : editingItem ? 'Perbarui Pengaturan' : 'Simpan Potongan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null, namaMahasiswa: '', namaPotongan: '' })}
        onConfirm={handleDelete}
        title="Hapus Pengaturan Potongan Khusus"
        message={`Apakah Anda yakin ingin menghapus potongan "${deleteModal.namaPotongan}" untuk mahasiswa "${deleteModal.namaMahasiswa}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
        isLoading={deleteLoading}
      />
    </div>
  );
}
