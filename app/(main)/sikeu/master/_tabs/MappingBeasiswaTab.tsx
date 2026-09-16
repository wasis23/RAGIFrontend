'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Filter, Loader2, Save, CheckCircle2, XCircle, Trash2, Edit, User, ShieldCheck, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { useForm } from 'react-hook-form';

interface MahasiswaBeasiswa {
  id: number;
  mahasiswa_id: number;
  beasiswa_id?: number;
  nama_mahasiswa: string;
  nim: string;
  nama_beasiswa: string;
  tipe_potongan?: 'persen' | 'nominal' | string;
  nilai_potongan?: number;
  potongan_text?: string;
  status: 'aktif' | 'nonaktif' | 'selesai' | string;
  berlaku_mulai?: string;
  berlaku_sampai?: string;
}

interface FormValues {
  mahasiswa_id: number;
  beasiswa_id: number;
  berlaku_mulai: string;
  berlaku_sampai: string;
  status: string;
}

const getTodayDate = () => new Date().toISOString().split('T')[0];
const getDefaultEndDate = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split('T')[0];
};

export function MappingBeasiswaTab() {
  const [data, setData] = useState<MahasiswaBeasiswa[]>([]);
  const [loading, setLoading] = useState(false);
  const [beasiswaOptions, setBeasiswaOptions] = useState<any[]>([]);

  // Filter Drawer — 2-stage
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterOrderBy, setFilterOrderBy] = useState<'nama_mahasiswa' | 'nim' | 'nama_beasiswa' | 'status'>('nama_mahasiswa');
  const [filterOrderDir, setFilterOrderDir] = useState<'asc' | 'desc'>('asc');
  const [appliedFilters, setAppliedFilters] = useState({ search: '', status: '' });

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MahasiswaBeasiswa | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirm Modal
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    id: number | null;
    namaMahasiswa: string;
    namaBeasiswa: string;
  }>({
    isOpen: false,
    id: null,
    namaMahasiswa: '',
    namaBeasiswa: '',
  });
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Student Selection state for Modal
  const [studentSearch, setStudentSearch] = useState('');
  const [studentResults, setStudentResults] = useState<any[]>([]);
  const [selectedStudentObj, setSelectedStudentObj] = useState<any | null>(null);
  const [searchingStudent, setSearchingStudent] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
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

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await sikeuService.getMahasiswaBeasiswaList();
      setData(Array.isArray(res.data) ? res.data : []);
    } catch {
      setData([]);
      toast.error('Gagal memuat data penerima beasiswa');
    } finally {
      setLoading(false);
    }
  };

  const fetchBeasiswaList = async () => {
    try {
      const res = await sikeuService.getBeasiswaList();
      setBeasiswaOptions(Array.isArray(res.data) ? res.data : []);
    } catch {
      setBeasiswaOptions([]);
    }
  };

  useEffect(() => {
    fetchData();
    fetchBeasiswaList();
  }, []);

  // Debounced Student Autocomplete Search
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
    }, 250);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [studentSearch, isModalOpen, editingItem]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setSelectedStudentObj(null);
    setStudentSearch('');
    setStudentResults([]);
    reset({
      mahasiswa_id: 0,
      beasiswa_id: beasiswaOptions[0]?.id || 0,
      berlaku_mulai: getTodayDate(),
      berlaku_sampai: getDefaultEndDate(),
      status: 'aktif',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: MahasiswaBeasiswa) => {
    setEditingItem(item);
    setSelectedStudentObj({
      id: item.mahasiswa_id,
      nama_mahasiswa: item.nama_mahasiswa,
      nim: item.nim,
    });
    reset({
      mahasiswa_id: item.mahasiswa_id,
      beasiswa_id: item.beasiswa_id || (beasiswaOptions.find(b => b.nama === item.nama_beasiswa)?.id || beasiswaOptions[0]?.id || 0),
      berlaku_mulai: item.berlaku_mulai || getTodayDate(),
      berlaku_sampai: item.berlaku_sampai || getDefaultEndDate(),
      status: item.status || 'aktif',
    });
    setIsModalOpen(true);
  };

  const handleOpenDelete = (item: MahasiswaBeasiswa) => {
    setDeleteModal({
      isOpen: true,
      id: item.id,
      namaMahasiswa: item.nama_mahasiswa,
      namaBeasiswa: item.nama_beasiswa,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.id) return;
    setDeleteLoading(true);
    try {
      await sikeuService.deleteMahasiswaBeasiswa(deleteModal.id);
      toast.success(`Potongan beasiswa untuk ${deleteModal.namaMahasiswa} berhasil dicabut`);
      setDeleteModal({ isOpen: false, id: null, namaMahasiswa: '', namaBeasiswa: '' });
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal menghapus penetapan potongan beasiswa');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleStatus = async (item: MahasiswaBeasiswa) => {
    const nextStatus = item.status === 'aktif' ? 'nonaktif' : 'aktif';
    try {
      await sikeuService.updateMahasiswaBeasiswa(item.id, { status: nextStatus });
      toast.success(`Status beasiswa diubah menjadi ${nextStatus === 'aktif' ? 'AKTIF' : 'NON-AKTIF'}`);
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal mengubah status beasiswa');
    }
  };

  const onSubmit = async (formData: FormValues) => {
    if (!formData.mahasiswa_id || formData.mahasiswa_id === 0) {
      toast.error('Silakan pilih mahasiswa penerima terlebih dahulu');
      return;
    }
    if (!formData.beasiswa_id || formData.beasiswa_id === 0) {
      toast.error('Silakan pilih program beasiswa / skema potongan');
      return;
    }

    setSubmitting(true);
    try {
      if (editingItem) {
        await sikeuService.updateMahasiswaBeasiswa(editingItem.id, {
          beasiswa_id: Number(formData.beasiswa_id),
          berlaku_mulai: formData.berlaku_mulai,
          berlaku_sampai: formData.berlaku_sampai,
          status: formData.status,
        });
        toast.success('Data penetapan potongan beasiswa berhasil diperbarui');
      } else {
        await sikeuService.assignMahasiswaBeasiswa({
          mahasiswa_id: Number(formData.mahasiswa_id),
          beasiswa_id: Number(formData.beasiswa_id),
          berlaku_mulai: formData.berlaku_mulai,
          berlaku_sampai: formData.berlaku_sampai,
          status: formData.status,
          nim: selectedStudentObj?.nim,
          nama_mahasiswa: selectedStudentObj?.nama_mahasiswa,
        });
        toast.success('Penerima potongan beasiswa berhasil ditetapkan');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal menyimpan penetapan beasiswa');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyFilter = () => {
    setAppliedFilters({ search: filterSearch, status: filterStatus });
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterStatus('');
    setFilterOrderBy('nama_mahasiswa');
    setFilterOrderDir('asc');
    setAppliedFilters({ search: '', status: '' });
    setShowFilter(false);
  };

  const filteredData = useMemo(() => {
    const list = data.filter((item) => {
      if (appliedFilters.search) {
        const q = appliedFilters.search.toLowerCase();
        if (
          !item.nama_mahasiswa?.toLowerCase().includes(q) &&
          !item.nim?.toLowerCase().includes(q) &&
          !item.nama_beasiswa?.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      if (appliedFilters.status && item.status !== appliedFilters.status) return false;
      return true;
    });

    list.sort((a, b) => {
      let valA: any = '';
      let valB: any = '';
      switch (filterOrderBy) {
        case 'nama_mahasiswa':
          valA = a.nama_mahasiswa?.toLowerCase() || '';
          valB = b.nama_mahasiswa?.toLowerCase() || '';
          break;
        case 'nim':
          valA = a.nim || '';
          valB = b.nim || '';
          break;
        case 'nama_beasiswa':
          valA = a.nama_beasiswa?.toLowerCase() || '';
          valB = b.nama_beasiswa?.toLowerCase() || '';
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

  const columns: ColumnDef<MahasiswaBeasiswa>[] = [
    {
      key: 'nama_beasiswa',
      label: 'SKEMA BEASISWA',
      render: (row) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-md uppercase">
              {row.nama_beasiswa.split(' ')[0] || 'BEASISWA'}
            </span>
            <p className="font-bold text-slate-900 text-sm">{row.nama_beasiswa}</p>
          </div>
          <p className="text-2xs text-slate-400 font-semibold mt-1">
            Masa: {row.berlaku_mulai || '-'} s/d {row.berlaku_sampai || '-'}
          </p>
        </div>
      ),
    },
    {
      key: 'nama_mahasiswa',
      label: 'MAHASISWA',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900 text-sm">{row.nama_mahasiswa}</p>
          <p className="font-mono text-xs text-slate-500">NIM: {row.nim}</p>
        </div>
      ),
    },
    {
      key: 'potongan_text',
      label: 'BESARAN POTONGAN',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 tabular-nums text-sm">
            {row.potongan_text || '-'}
          </span>
          <span className="text-2xs block text-emerald-600 font-semibold mt-0.5">Potongan Tagihan</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (row) => (
        <button
          type="button"
          onClick={() => handleToggleStatus(row)}
          title="Klik untuk mengubah status aktif / non-aktif"
          className="cursor-pointer transition hover:opacity-80 inline-flex items-center"
        >
          {row.status === 'aktif' ? (
            <span className="badge badge-green text-xs font-bold inline-flex items-center gap-1 shadow-2xs">
              <CheckCircle2 size={12} /> Aktif
            </span>
          ) : (
            <span className="badge badge-red text-xs font-bold inline-flex items-center gap-1 shadow-2xs">
              <XCircle size={12} /> Non-Aktif
            </span>
          )}
        </button>
      ),
    },
    {
      key: 'actions',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end">
          <DropdownMenu
            align="right"
            items={[
              {
                label: 'Edit Penetapan',
                icon: <Edit size={14} />,
                onClick: () => handleOpenEdit(row),
              },
              {
                label: 'Cabut Potongan',
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
    <>
      <PageHeader
        title="Penetapan Potongan & Beasiswa Mahasiswa"
        description="Kelola alokasi potongan biaya dan beasiswa untuk mahasiswa tertentu agar tagihan terpotong otomatis saat invoice diterbitkan."
        action={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="outline"
              onClick={() => setShowFilter(true)}
              icon={<Filter size={16} />}
              className="font-bold min-h-[40px]"
            >
              Filter
            </Button>
            <Button
              variant="primary"
              onClick={handleOpenAdd}
              icon={<Plus size={16} />}
              className="font-bold min-h-[40px] px-4 shadow-sm"
            >
              Tetapkan Potongan Mahasiswa
            </Button>
          </div>
        }
      />

      {/* Active Filters */}
      {(appliedFilters.search || appliedFilters.status) && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
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
            onClick={handleResetFilter}
            className="text-xs text-red-600 hover:text-red-700 font-semibold underline cursor-pointer ml-1"
          >
            Reset Filter
          </button>
        </div>
      )}

      <DataTable
        data={filteredData}
        isLoading={loading}
        columns={columns}
        emptyMessage="Belum ada data mahasiswa yang ditetapkan menerima potongan/beasiswa."
      />

      {/* Modal Add / Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Penetapan Potongan Mahasiswa' : 'Tetapkan Potongan Mahasiswa Baru'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Interactive Student Selector */}
          <div className="space-y-2">
            <label className="form-label">Pilih Mahasiswa *</label>
            {!selectedStudentObj ? (
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    placeholder="Ketik NIM atau nama mahasiswa..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                  />
                  {searchingStudent && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 size={16} className="animate-spin text-primary-500" />
                    </div>
                  )}
                </div>

                {studentSearch.trim().length > 0 && (
                  studentResults.length > 0 ? (
                    <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto bg-slate-50/50">
                      <div className="px-3 py-1.5 bg-slate-100 text-2xs font-bold text-slate-500 uppercase tracking-wider">
                        Hasil Pencarian Mahasiswa ({studentResults.length})
                      </div>
                      {studentResults.map((stu) => (
                        <button
                          key={stu.id}
                          type="button"
                          onClick={() => {
                            setSelectedStudentObj(stu);
                            setValue('mahasiswa_id', stu.id);
                            setStudentSearch('');
                            setStudentResults([]);
                          }}
                          className="w-full p-2.5 text-left hover:bg-primary-50 transition flex items-center justify-between text-xs cursor-pointer"
                        >
                          <div>
                            <p className="font-bold text-slate-900">{stu.nama_mahasiswa}</p>
                            <p className="text-slate-500 font-mono text-2xs">
                              NIM: {stu.nim} • {stu.prodi} • Angkatan {stu.tahun_angkatan}
                            </p>
                          </div>
                          <span className="badge badge-purple text-2xs font-bold">{stu.jalur_kelas}</span>
                        </button>
                      ))}
                    </div>
                  ) : !searchingStudent ? (
                    <div className="p-3 border border-slate-200 rounded-xl text-center text-xs text-slate-500 bg-slate-50">
                      Tidak ditemukan mahasiswa dengan kata kunci &ldquo;{studentSearch}&rdquo;
                    </div>
                  ) : null
                )}
              </div>
            ) : (
              <div className="p-3 bg-primary-50/80 border border-primary-200 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-extrabold text-slate-900 text-sm">{selectedStudentObj.nama_mahasiswa}</p>
                  <p className="font-mono text-xs text-slate-600">
                    NIM: {selectedStudentObj.nim}
                    {selectedStudentObj.prodi ? ` • ${selectedStudentObj.prodi}` : ''}
                    {selectedStudentObj.tahun_angkatan ? ` • Angkatan ${selectedStudentObj.tahun_angkatan}` : ''}
                  </p>
                </div>
                {!editingItem && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedStudentObj(null);
                      setValue('mahasiswa_id', 0);
                      setStudentSearch('');
                      setStudentResults([]);
                    }}
                    className="font-bold text-rose-600 hover:bg-rose-50"
                  >
                    Ganti
                  </Button>
                )}
              </div>
            )}
            <input type="hidden" {...register('mahasiswa_id', { required: true, min: 1 })} />
            {errors.mahasiswa_id && (
              <p className="text-xs text-red-500">Mahasiswa wajib dipilih</p>
            )}
          </div>

          {/* Program Beasiswa / Skema Potongan */}
          <div className="space-y-2">
            <Select
              label="Skema Potongan / Beasiswa *"
              options={beasiswaOptions.map((b) => ({
                value: b.id.toString(),
                label: `${b.nama} (${b.tipe_potongan === 'persen' ? `${b.nilai_potongan}%` : `Rp ${Number(b.nilai_potongan).toLocaleString('id-ID')}`})`,
              }))}
              value={watch('beasiswa_id')?.toString()}
              onChange={(val) => setValue('beasiswa_id', Number(val))}
            />

            {activeBeasiswaDetail && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>Detail Potongan: {activeBeasiswaDetail.nama}</span>
                </div>
                <p className="text-slate-600">
                  Besaran Diskon: <strong>{activeBeasiswaDetail.tipe_potongan === 'persen' ? `${activeBeasiswaDetail.nilai_potongan}%` : `Rp ${Number(activeBeasiswaDetail.nilai_potongan).toLocaleString('id-ID')}`}</strong>
                </p>
                <p className="text-slate-500 text-[11px]">
                  Cakupan: {activeBeasiswaDetail.jenis_biaya && activeBeasiswaDetail.jenis_biaya.length > 0
                    ? activeBeasiswaDetail.jenis_biaya.map((j: any) => j.nama).join(', ')
                    : 'Semua Komponen Biaya (Global)'}
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="date"
              label="Berlaku Mulai *"
              {...register('berlaku_mulai', { required: 'Tanggal mulai wajib diisi' })}
            />
            <Input
              type="date"
              label="Berlaku Sampai *"
              {...register('berlaku_sampai', { required: 'Tanggal selesai wajib diisi' })}
            />
          </div>

          <Select
            label="Status Penetapan *"
            value={watch('status') || 'aktif'}
            onChange={(val) => setValue('status', val as string)}
            options={[
              { value: 'aktif', label: 'Aktif (Potongan Otomatis Berlaku)' },
              { value: 'nonaktif', label: 'Non-Aktif (Ditangguhkan)' },
              { value: 'selesai', label: 'Selesai (Sudah Berakhir)' },
            ]}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
              className="font-bold text-slate-600"
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              icon={submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              className="font-bold shadow-md"
            >
              {submitting ? 'Menyimpan...' : editingItem ? 'Perbarui Penetapan' : 'Simpan Penetapan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Filter Drawer */}
      <Drawer
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Penerima Beasiswa & Potongan"
        width="420px"
        footer={
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleResetFilter}
              className="font-bold text-slate-600 min-h-[42px] px-4"
            >
              Reset
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleApplyFilter}
              className="font-bold min-h-[42px] px-5 shadow-md"
            >
              Terapkan Filter
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <Input
            label="Cari Nama / NIM / Beasiswa"
            placeholder="Ketik kata kunci..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />
          <Select
            label="Status"
            value={filterStatus}
            onChange={(val) => setFilterStatus(val as string)}
            options={[
              { value: '', label: 'Semua Status' },
              { value: 'aktif', label: 'Aktif' },
              { value: 'nonaktif', label: 'Non-Aktif' },
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
                { value: 'nim', label: 'NIM' },
                { value: 'nama_beasiswa', label: 'Nama Beasiswa' },
                { value: 'status', label: 'Status' },
              ]}
            />
            <Select
              label="Arah Urutan"
              value={filterOrderDir}
              onChange={(val) => setFilterOrderDir(val as any)}
              options={[
                { value: 'asc', label: 'Menaik (A-Z)' },
                { value: 'desc', label: 'Menurun (Z-A)' },
              ]}
            />
          </div>
        </div>
      </Drawer>

      {/* Confirm Dialog for Deleting / Revoking Scholarship */}
      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={() => !deleteLoading && setDeleteModal({ isOpen: false, id: null, namaMahasiswa: '', namaBeasiswa: '' })}
        onConfirm={handleConfirmDelete}
        isLoading={deleteLoading}
        title="Cabut Penetapan Potongan Beasiswa"
        message={
          <span>
            Apakah Anda yakin ingin mencabut beasiswa/potongan <strong>&quot;{deleteModal.namaBeasiswa}&quot;</strong> untuk mahasiswa <strong>&quot;{deleteModal.namaMahasiswa}&quot;</strong>?
            <br className="mt-1" />
            Tindakan ini akan menghentikan pemotongan tagihan otomatis untuk mahasiswa bersangkutan.
          </span>
        }
        confirmText="Ya, Cabut Potongan"
        cancelText="Batal"
      />
    </>
  );
}
