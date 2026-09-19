'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, Filter, Loader2, Save, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { useForm } from 'react-hook-form';
import { formatRupiah } from '@/lib/utils';

interface Tarif {
  id: number;
  jenis_biaya_id?: number;
  tahun_angkatan: number;
  jalur_kelas: string;
  kelompok_ukt?: number;
  prodi?: string;
  nama_kelompok?: string;
  nominal: number;
  jenis_biaya?: { nama: string };
}

interface FormValues {
  jenis_biaya_id: number;
  tahun_angkatan: number;
  jalur_kelas: string;
  kelompok_ukt: number;
  prodi: string;
  nama_kelompok: string;
  nominal: number;
}

export interface TarifTabProps {
  setHeaderAction?: (action: React.ReactNode) => void;
}

export function TarifTab({ setHeaderAction }: TarifTabProps = {}) {
  const router = useRouter();
  const [data, setData] = useState<Tarif[]>([]);
  const [loading, setLoading] = useState(false);
  const [jenisBiayaList, setJenisBiayaList] = useState<any[]>([]);
  const [programStudiList, setProgramStudiList] = useState<any[]>([]);
  const [jalurKelasList, setJalurKelasList] = useState<{ value: string; label: string }[]>([]);

  // Filter Drawer States — 2-stage
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterAngkatan, setFilterAngkatan] = useState<string>('');
  const [filterJalur, setFilterJalur] = useState<string>('');
  const [filterOrderBy, setFilterOrderBy] = useState<'nominal' | 'tahun_angkatan' | 'nama_kelompok' | 'prodi'>('tahun_angkatan');
  const [filterOrderDir, setFilterOrderDir] = useState<'asc' | 'desc'>('desc');
  const [appliedFilters, setAppliedFilters] = useState({ search: '', angkatan: '', jalur: '' });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Tarif | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      jenis_biaya_id: 1,
      tahun_angkatan: 2025,
      jalur_kelas: '',
      kelompok_ukt: 1,
      prodi: '',
      nama_kelompok: '',
      nominal: 0,
    },
  });

  const selectedJalurVal = watch('jalur_kelas');

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await sikeuService.getTarifList();
      setData(Array.isArray(res.data) ? res.data : []);
    } catch {
      setData([]);
      toast.error('Gagal memuat data tarif');
    } finally {
      setLoading(false);
    }
  };

  const fetchJenisBiaya = async () => {
    try {
      const res = await sikeuService.getJenisBiayaList();
      setJenisBiayaList(Array.isArray(res.data) ? res.data : []);
    } catch {
      setJenisBiayaList([]);
    }
  };

  const fetchProgramStudi = async () => {
    try {
      const res = await sikeuService.getProgramStudiList();
      if (res.data && Array.isArray(res.data)) {
        setProgramStudiList(res.data);
      }
    } catch {
      setProgramStudiList([]);
    }
  };

  const fetchJalurKelas = async () => {
    try {
      const res = await sikeuService.getJalurKelasList();
      if (res.data && Array.isArray(res.data)) {
        setJalurKelasList(
          res.data.map((j: any) => ({
            value: j.nama_jalur || j.nama || j.kode,
            label: j.nama_jalur || j.nama || j.kode,
          }))
        );
      }
    } catch {
      setJalurKelasList([]);
    }
  };

  useEffect(() => {
    fetchData();
    fetchJenisBiaya();
    fetchProgramStudi();
    fetchJalurKelas();
  }, []);

  const handleOpenAdd = () => {
    router.push('/sikeu/master/tarif/create');
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
            {(appliedFilters.search || appliedFilters.angkatan || appliedFilters.jalur) && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary-600 ml-1"></span>
            )}
          </Button>
          <Button
            variant="primary"
            onClick={handleOpenAdd}
            icon={<Plus size={16} />}
            className="font-bold min-h-[38px] text-xs px-3.5 shadow-sm"
          >
            Atur Nominal Tarif
          </Button>
        </div>
      );
    }
  }, [setHeaderAction, appliedFilters]);

  const handleOpenEdit = (item: Tarif) => {
    setEditingItem(item);
    reset({
      jenis_biaya_id: item.jenis_biaya_id || 1,
      tahun_angkatan: item.tahun_angkatan,
      jalur_kelas: item.jalur_kelas || 'Reguler',
      kelompok_ukt: item.kelompok_ukt || 1,
      prodi: item.prodi || 'Teknik Informatika',
      nama_kelompok: item.nama_kelompok || '',
      nominal: item.nominal,
    });
    setIsModalOpen(true);
  };

  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: number | null; label?: string }>({ isOpen: false, id: null, label: '' });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleOpenDelete = (id: number, nama?: string) => {
    setDeleteModal({ isOpen: true, id, label: nama || '' });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.id) return;
    try {
      setDeleteLoading(true);
      await sikeuService.deleteTarif(deleteModal.id);
      toast.success('Tarif berhasil dihapus');
      setDeleteModal({ isOpen: false, id: null, label: '' });
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal menghapus tarif');
    } finally {
      setDeleteLoading(false);
    }
  };

  const onSubmit = async (formData: FormValues) => {
    setSubmitting(true);
    try {
      if (editingItem) {
        await sikeuService.updateTarif(editingItem.id, formData);
        toast.success('Nominal tarif berhasil diperbarui');
      } else {
        await sikeuService.storeTarif(formData);
        toast.success('Nominal tarif baru berhasil ditambahkan');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal menyimpan tarif');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyFilter = () => {
    setAppliedFilters({ search: filterSearch, angkatan: filterAngkatan, jalur: filterJalur });
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterAngkatan('');
    setFilterJalur('');
    setFilterOrderBy('tahun_angkatan');
    setFilterOrderDir('desc');
    setAppliedFilters({ search: '', angkatan: '', jalur: '' });
    setShowFilter(false);
  };

  const filteredData = useMemo(() => {
    const list = data.filter((item) => {
      if (appliedFilters.search) {
        const q = appliedFilters.search.toLowerCase();
        const matchNama = item.nama_kelompok?.toLowerCase().includes(q);
        const matchProdi = item.prodi?.toLowerCase().includes(q);
        const matchJenis = item.jenis_biaya?.nama?.toLowerCase().includes(q);
        if (!matchNama && !matchProdi && !matchJenis) return false;
      }
      if (appliedFilters.angkatan && item.tahun_angkatan.toString() !== appliedFilters.angkatan) return false;
      if (appliedFilters.jalur && item.jalur_kelas !== appliedFilters.jalur) return false;
      return true;
    });

    list.sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;
      switch (filterOrderBy) {
        case 'nominal':
          valA = Number(a.nominal || 0);
          valB = Number(b.nominal || 0);
          break;
        case 'tahun_angkatan':
          valA = Number(a.tahun_angkatan || 0);
          valB = Number(b.tahun_angkatan || 0);
          break;
        case 'nama_kelompok':
          valA = a.nama_kelompok || '';
          valB = b.nama_kelompok || '';
          break;
        case 'prodi':
          valA = a.prodi || '';
          valB = b.prodi || '';
          break;
      }
      if (valA < valB) return filterOrderDir === 'asc' ? -1 : 1;
      if (valA > valB) return filterOrderDir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [data, appliedFilters, filterOrderBy, filterOrderDir]);

  const columns: ColumnDef<Tarif>[] = [
    {
      key: 'nama_kelompok',
      label: 'KOMPONEN / NAMA TARIF',
      render: (row) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-md uppercase">
              {row.kelompok_ukt ? `UKT GOLONGAN ${row.kelompok_ukt}` : (row.jenis_biaya?.nama ? row.jenis_biaya.nama.slice(0, 8).toUpperCase() : 'TARIF')}
            </span>
            <p className="font-bold text-slate-900 text-sm">{row.nama_kelompok || row.jenis_biaya?.nama || 'Tarif Biaya'}</p>
          </div>
          <p className="text-2xs text-slate-400 font-semibold mt-1">{row.prodi || 'Semua Program Studi'}</p>
        </div>
      ),
    },
    {
      key: 'angkatan_jalur',
      label: 'ANGKATAN & JALUR',
      render: (row) => (
        <div>
          <p className="text-xs font-semibold text-slate-700">{row.prodi || 'Semua Program Studi'}</p>
          <p className="text-2xs text-slate-500">Angkatan {row.tahun_angkatan} • {row.jalur_kelas || 'Reguler'}</p>
        </div>
      ),
    },
    {
      key: 'nominal',
      label: 'NOMINAL TARIF',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 tabular-nums text-sm">
            {formatRupiah(row.nominal || 0)}
          </span>
          <span className="text-2xs block text-emerald-600 font-semibold mt-0.5">Tarif Pokok</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      render: () => (
        <span className="badge badge-green text-xs font-bold inline-flex items-center gap-1">
          <CheckCircle2 size={12} /> Aktif
        </span>
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
                label: 'Edit Tarif',
                icon: <Edit size={14} />,
                onClick: () => handleOpenEdit(row),
              },
              {
                label: 'Hapus Tarif',
                icon: <Trash2 size={14} />,
                variant: 'danger',
                onClick: () => handleOpenDelete(row.id, row.nama_kelompok),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      {!setHeaderAction && (
        <div className="flex items-center justify-end gap-2 flex-wrap mb-4">
          <Button variant="outline" onClick={() => setShowFilter(true)} icon={<Filter size={16} />} className="font-bold min-h-[38px] text-xs">
            Filter
          </Button>
          <Button variant="primary" onClick={handleOpenAdd} icon={<Plus size={16} />} className="font-bold min-h-[38px] text-xs px-3.5 shadow-sm">
            Atur Nominal Tarif
          </Button>
        </div>
      )}

      {/* Active Filters */}
      {(appliedFilters.search || appliedFilters.angkatan || appliedFilters.jalur) && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs text-slate-500 font-medium">Filter aktif:</span>
          {appliedFilters.search && (
            <span className="badge badge-blue text-xs font-medium">
              Pencarian: &quot;{appliedFilters.search}&quot;
            </span>
          )}
          {appliedFilters.angkatan && (
            <span className="badge badge-blue text-xs font-medium">
              Angkatan: {appliedFilters.angkatan}
            </span>
          )}
          {appliedFilters.jalur && (
            <span className="badge badge-blue text-xs font-medium">
              Jalur: {appliedFilters.jalur}
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

      <DataTable data={filteredData} isLoading={loading} columns={columns} emptyMessage="Belum ada data nominal tarif." />

      {/* Modal Add/Edit Tarif */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Nominal Tarif' : 'Tambah Nominal Tarif Baru'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Komponen Biaya *"
              options={jenisBiayaList.map(j => ({ value: j.id.toString(), label: j.nama }))}
              value={watch('jenis_biaya_id')?.toString()}
              onChange={(val) => setValue('jenis_biaya_id', Number(val))} />

            <Input type="number" label="Tahun Angkatan *" placeholder="2025"
              {...register('tahun_angkatan', { required: 'Tahun angkatan wajib diisi', valueAsNumber: true })}
              error={errors.tahun_angkatan?.message} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Jalur / Kelas *"
              options={
                jalurKelasList.length > 0
                  ? jalurKelasList
                  : [{ value: 'Reguler', label: 'Reguler' }]
              }
              value={selectedJalurVal}
              onChange={(val) => setValue('jalur_kelas', val as string)} />

            {programStudiList.length > 0 ? (
              <Select
                label="Program Studi *"
                options={programStudiList.map(p => ({
                  value: p.nama,
                  label: `${p.jenjang ? p.jenjang + ' ' : ''}${p.nama}`
                }))}
                value={watch('prodi')}
                onChange={(val) => {
                  setValue('prodi', val as string);
                  if (!watch('nama_kelompok') || watch('nama_kelompok').startsWith('SPP Semester')) {
                    setValue('nama_kelompok', `SPP Semester ${val}`);
                  }
                }}
              />
            ) : (
              <Input label="Program Studi *" placeholder="Contoh: Teknik Informatika"
                {...register('prodi', { required: 'Program studi wajib diisi' })}
                error={errors.prodi?.message} />
            )}
          </div>

          <Input label="Nama Kelompok / Keterangan Tarif *" placeholder="Contoh: SPP Semester Teknik Informatika"
            {...register('nama_kelompok', { required: 'Nama kelompok wajib diisi' })}
            error={errors.nama_kelompok?.message} />

          <Input type="number" label="Nominal Tarif (Rp) *" placeholder="3500000"
            {...register('nominal', { required: 'Nominal wajib diisi', valueAsNumber: true, min: { value: 0, message: 'Nominal tidak boleh negatif' } })}
            error={errors.nominal?.message} />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} disabled={submitting} className="font-bold text-slate-600">
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}
              icon={submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              className="font-bold shadow-md">
              {submitting ? 'Menyimpan...' : editingItem ? 'Perbarui' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Filter Drawer */}
      <Drawer isOpen={showFilter} onClose={() => setShowFilter(false)} title="Filter Tarif Angkatan" width="420px"
        footer={
          <div className="flex items-center justify-between gap-3">
            <Button type="button" variant="outline" onClick={handleResetFilter} className="font-bold text-slate-600 min-h-[42px] px-4">
              Reset
            </Button>
            <Button type="button" variant="primary" onClick={handleApplyFilter} className="font-bold min-h-[42px] px-5 shadow-md">
              Terapkan Filter
            </Button>
          </div>
        }>
        <div className="space-y-5">
          <Input label="Cari Nama Tarif / Prodi" placeholder="Ketik kata kunci..."
            value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} />

          <Select label="Tahun Angkatan"
            value={filterAngkatan}
            onChange={(val) => setFilterAngkatan(val as string)}
            options={[
              { value: '', label: 'Semua Angkatan' },
              { value: '2023', label: '2023' },
              { value: '2024', label: '2024' },
              { value: '2025', label: '2025' },
              { value: '2026', label: '2026' },
              { value: '2027', label: '2027' },
            ]} />

          <Select label="Jalur Kelas"
            value={filterJalur}
            onChange={(val) => setFilterJalur(val as string)}
            options={[
              { value: '', label: 'Semua Jalur Kelas' },
              ...jalurKelasList,
            ]} />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Urutkan Berdasarkan"
              value={filterOrderBy}
              onChange={(val) => setFilterOrderBy(val as any)}
              options={[
                { value: 'tahun_angkatan', label: 'Tahun Angkatan' },
                { value: 'nominal', label: 'Nominal Tarif' },
                { value: 'nama_kelompok', label: 'Nama Tarif' },
                { value: 'prodi', label: 'Program Studi' },
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

      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={() => !deleteLoading && setDeleteModal({ isOpen: false, id: null, label: '' })}
        onConfirm={handleConfirmDelete}
        isLoading={deleteLoading}
        title="Hapus Nominal Tarif"
        message={
          <span>
            Apakah Anda yakin ingin menghapus tarif <strong>&quot;{deleteModal.label}&quot;</strong>?
            Tindakan ini tidak dapat dibatalkan.
          </span>
        }
        confirmText="Ya, Hapus"
        cancelText="Batal"
      />
    </>
  );
}
