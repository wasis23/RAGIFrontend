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
import { Checkbox } from '@/components/ui/Checkbox';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useForm } from 'react-hook-form';
import { formatRupiah } from '@/lib/utils';

interface Beasiswa {
  id: number;
  kode: string;
  nama: string;
  sumber: string;
  tipe_potongan: string;
  nilai_potongan: number;
  jenis_biaya_ids: number[];
  jenis_biaya?: { id: number; nama: string; kode: string }[];
  berlaku_angkatan_mulai?: number;
  berlaku_angkatan_sampai?: number;
  deskripsi?: string;
}

interface FormValues {
  kode: string;
  nama: string;
  sumber: string;
  tipe_potongan: string;
  nilai_potongan: number;
  jenis_biaya_ids: number[];
  berlaku_angkatan_mulai: number;
  berlaku_angkatan_sampai: number;
  deskripsi: string;
}

export function BeasiswaTab() {
  const router = useRouter();
  const [data, setData] = useState<Beasiswa[]>([]);
  const [loading, setLoading] = useState(false);
  const [jenisBiayaList, setJenisBiayaList] = useState<any[]>([]);

  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterSumber, setFilterSumber] = useState('');
  const [filterOrderBy, setFilterOrderBy] = useState('nama');
  const [filterOrderDir, setFilterOrderDir] = useState<'asc' | 'desc'>('asc');
  const [appliedFilters, setAppliedFilters] = useState({ search: '', sumber: '', orderBy: 'nama', orderDir: 'asc' as 'asc' | 'desc' });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Beasiswa | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      kode: '',
      nama: '',
      sumber: 'internal',
      tipe_potongan: 'persen',
      nilai_potongan: 100,
      jenis_biaya_ids: [],
      berlaku_angkatan_mulai: 2023,
      berlaku_angkatan_sampai: 2027,
      deskripsi: '',
    },
  });

  const tipePotonganVal = watch('tipe_potongan');
  const selectedJenisBiayaIds = watch('jenis_biaya_ids') || [];

  const toggleJenisBiaya = (id: number) => {
    const current = watch('jenis_biaya_ids') || [];
    const next = current.includes(id) ? current.filter((i) => i !== id) : [...current, id];
    setValue('jenis_biaya_ids', next, { shouldValidate: true });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await sikeuService.getBeasiswaList();
      setData(Array.isArray(res.data) ? res.data : []);
    } catch {
      setData([]);
      toast.error('Gagal memuat data beasiswa');
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

  useEffect(() => {
    fetchData();
    fetchJenisBiaya();
  }, []);

  const handleOpenAdd = () => {
    router.push('/sikeu/master/beasiswa/create');
  };

  const handleOpenEdit = (item: Beasiswa) => {
    setEditingItem(item);
    reset({
      kode: item.kode,
      nama: item.nama,
      sumber: item.sumber || 'internal',
      tipe_potongan: item.tipe_potongan || 'persen',
      nilai_potongan: item.nilai_potongan || 0,
      jenis_biaya_ids: item.jenis_biaya_ids || [],
      berlaku_angkatan_mulai: item.berlaku_angkatan_mulai || 2023,
      berlaku_angkatan_sampai: item.berlaku_angkatan_sampai || 2027,
      deskripsi: item.deskripsi || '',
    });
    setIsModalOpen(true);
  };

  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: number | null; nama?: string }>({
    isOpen: false,
    id: null,
    nama: '',
  });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleOpenDelete = (id: number, nama: string) => {
    setDeleteModal({ isOpen: true, id, nama });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.id) return;
    try {
      setDeleteLoading(true);
      await sikeuService.deleteBeasiswa(deleteModal.id);
      toast.success('Program beasiswa berhasil dihapus');
      setDeleteModal({ isOpen: false, id: null, nama: '' });
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal menghapus beasiswa');
    } finally {
      setDeleteLoading(false);
    }
  };

  const onSubmit = async (formData: FormValues) => {
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        jenis_biaya_ids: formData.jenis_biaya_ids || [],
      };
      if (editingItem) {
        await sikeuService.updateBeasiswa(editingItem.id, payload);
        toast.success('Program beasiswa berhasil diperbarui');
      } else {
        await sikeuService.storeBeasiswa(payload);
        toast.success('Program beasiswa baru berhasil ditambahkan');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal menyimpan beasiswa');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyFilter = () => {
    setAppliedFilters({ search: filterSearch, sumber: filterSumber, orderBy: filterOrderBy, orderDir: filterOrderDir });
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterSumber('');
    setFilterOrderBy('nama');
    setFilterOrderDir('asc');
    setAppliedFilters({ search: '', sumber: '', orderBy: 'nama', orderDir: 'asc' });
    setShowFilter(false);
  };

  const filteredData = useMemo(() => {
    const list = data.filter((item) => {
      if (appliedFilters.search) {
        const q = appliedFilters.search.toLowerCase();
        if (!item.nama?.toLowerCase().includes(q) && !item.kode?.toLowerCase().includes(q) && !item.deskripsi?.toLowerCase().includes(q)) return false;
      }
      if (appliedFilters.sumber && item.sumber !== appliedFilters.sumber) return false;
      return true;
    });

    return [...list].sort((a, b) => {
      let valA: any = a[appliedFilters.orderBy as keyof Beasiswa] ?? '';
      let valB: any = b[appliedFilters.orderBy as keyof Beasiswa] ?? '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return appliedFilters.orderDir === 'asc' ? -1 : 1;
      if (valA > valB) return appliedFilters.orderDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, appliedFilters]);

  const getCakupanBiayaText = (item: Beasiswa) => {
    if (!item.jenis_biaya_ids || item.jenis_biaya_ids.length === 0) return 'Semua Komponen Biaya';
    const names = (item.jenis_biaya || []).map((j) => j.nama);
    if (names.length === 0) return `${item.jenis_biaya_ids.length} komponen biaya`;
    return names.join(', ');
  };

  const columns: ColumnDef<Beasiswa>[] = [
    {
      key: 'kode',
      label: 'KODE',
      render: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-md uppercase">
            {row.kode}
          </span>
        </div>
      ),
    },
    {
      key: 'nama',
      label: 'NAMA PROGRAM BEASISWA',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900 text-sm">{row.nama}</p>
          {row.deskripsi && <p className="text-2xs text-slate-400 font-semibold mt-1 line-clamp-1">{row.deskripsi}</p>}
        </div>
      ),
    },
    {
      key: 'sumber',
      label: 'SUMBER DANA',
      render: (row) => (
        <span className="badge badge-blue text-xs font-bold uppercase">{row.sumber || 'Internal'}</span>
      ),
    },
    {
      key: 'cakupan_biaya',
      label: 'CAKUPAN KOMPONEN',
      render: (row) => (
        <div>
          <p className="text-xs font-semibold text-slate-700">{getCakupanBiayaText(row)}</p>
          <p className="text-2xs text-slate-500">
            {row.berlaku_angkatan_mulai && row.berlaku_angkatan_sampai
              ? `Angkatan ${row.berlaku_angkatan_mulai} - ${row.berlaku_angkatan_sampai}`
              : 'Semua Angkatan'}
          </p>
        </div>
      ),
    },
    {
      key: 'nilai_potongan',
      label: 'BESARAN POTONGAN',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 tabular-nums text-sm">
            {row.tipe_potongan === 'persen' ? `${row.nilai_potongan}%` : formatRupiah(row.nilai_potongan)}
          </span>
          <span className="text-2xs block text-emerald-600 font-semibold mt-0.5">
            {row.tipe_potongan === 'persen' ? 'Potongan Persentase' : 'Potongan Nominal Tetap'}
          </span>
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
                label: 'Edit Master Beasiswa',
                icon: <Edit size={14} />,
                onClick: () => handleOpenEdit(row),
              },
              {
                label: 'Hapus',
                icon: <Trash2 size={14} />,
                variant: 'danger',
                onClick: () => handleOpenDelete(row.id, row.nama),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      {/* Table Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs mb-4">
        <div className="flex items-center gap-2.5">
          <h2 className="text-sm font-bold text-slate-900">Daftar Program Beasiswa</h2>
          <span className="badge badge-blue text-xs font-semibold">{filteredData.length} Data</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setShowFilter(true)} icon={<Filter size={16} />} className="font-bold min-h-[38px] text-xs">
            Filter
          </Button>
          <Button variant="primary" onClick={handleOpenAdd} icon={<Plus size={16} />} className="font-bold min-h-[38px] text-xs px-3.5 shadow-sm">
            Tambah Master Beasiswa
          </Button>
        </div>
      </div>

      {/* Active Filters */}
      {(appliedFilters.search || appliedFilters.sumber) && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs text-slate-500 font-medium">Filter aktif:</span>
          {appliedFilters.search && (
            <span className="badge badge-blue text-xs font-medium">
              Pencarian: &quot;{appliedFilters.search}&quot;
            </span>
          )}
          {appliedFilters.sumber && (
            <span className="badge badge-blue text-xs font-medium">
              Sumber Dana: {appliedFilters.sumber.toUpperCase()}
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

      <DataTable data={filteredData} isLoading={loading} columns={columns} emptyMessage="Belum ada data program beasiswa." />

      {/* Modal Add/Edit */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Master Beasiswa' : 'Tambah Master Beasiswa Baru'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Kode Beasiswa *" placeholder="Contoh: KIP_KULIAH"
              {...register('kode', { required: 'Kode wajib diisi' })}
              error={errors.kode?.message} />
            <Input label="Nama Program Beasiswa *" placeholder="Contoh: Beasiswa KIP Kuliah"
              {...register('nama', { required: 'Nama beasiswa wajib diisi' })}
              error={errors.nama?.message} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Sumber Dana Beasiswa *"
              options={[
                { value: 'internal', label: 'Internal Yayasan / Kampus' },
                { value: 'pemerintah', label: 'Pemerintah (Kemendikbud/KIP)' },
                { value: 'mitra', label: 'Mitra Industri / CSR' },
                { value: 'alumni', label: 'Ikatan Alumni' },
              ]}
              value={watch('sumber')}
              onChange={(val) => setValue('sumber', val as string)} />

            <Select label="Tipe Potongan *"
              options={[
                { value: 'persen', label: 'Persentase (%)' },
                { value: 'nominal', label: 'Nominal Tetap (Rp)' },
              ]}
              value={tipePotonganVal}
              onChange={(val) => setValue('tipe_potongan', val as string)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input type="number" label={tipePotonganVal === 'persen' ? 'Besaran Potongan (%) *' : 'Nominal Potongan (Rp) *'}
              placeholder={tipePotonganVal === 'persen' ? '100' : '1500000'}
              {...register('nilai_potongan', { required: 'Nilai potongan wajib diisi', valueAsNumber: true })}
              error={errors.nilai_potongan?.message} />
          </div>

          {/* Multi Komponen Biaya */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700 block">
              Berlaku Untuk Komponen Biaya (Multi Pilih)
            </label>
            <p className="text-xs text-slate-500">
              Pilih satu atau lebih komponen biaya. Jika tidak ada yang dipilih, beasiswa berlaku global untuk semua komponen biaya.
            </p>

            {errors.jenis_biaya_ids && (
              <p className="text-xs text-red-500">{errors.jenis_biaya_ids.message}</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl max-h-60 overflow-y-auto">
              {jenisBiayaList.length > 0 ? (
                jenisBiayaList.map((jb) => (
                  <Checkbox
                    key={jb.id}
                    label={`${jb.nama || jb.nama_biaya || '-'} (${jb.kode || jb.kode_biaya || '-'})`}
                    checked={selectedJenisBiayaIds.includes(jb.id)}
                    onChange={() => toggleJenisBiaya(jb.id)}
                  />
                ))
              ) : (
                <p className="col-span-2 text-xs text-slate-400 text-center py-2">Data komponen biaya belum tersedia di master.</p>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <CheckCircle2 size={12} className="text-emerald-500" />
              {selectedJenisBiayaIds.length === 0
                ? 'Berlaku untuk SEMUA komponen biaya (Global)'
                : `Berlaku pada ${selectedJenisBiayaIds.length} komponen biaya: ${
                    jenisBiayaList
                      .filter((jb) => selectedJenisBiayaIds.includes(jb.id))
                      .map((jb) => jb.nama || jb.nama_biaya)
                      .join(', ')
                  }`
              }
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input type="number" label="Berlaku Dari Angkatan" placeholder="2023"
              {...register('berlaku_angkatan_mulai', { valueAsNumber: true })} />
            <Input type="number" label="Sampai Angkatan" placeholder="2027"
              {...register('berlaku_angkatan_sampai', { valueAsNumber: true })} />
          </div>

          <Input label="Deskripsi / Syarat Beasiswa" placeholder="Penjelasan singkat mengenai syarat dan cakupan beasiswa..."
            {...register('deskripsi')} />

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
      <Drawer isOpen={showFilter} onClose={() => setShowFilter(false)} title="Filter Master Beasiswa" width="420px"
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
          <Input label="Cari Nama / Kode Beasiswa" placeholder="Ketik kata kunci..."
            value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} />
          <Select label="Sumber Dana"
            value={filterSumber}
            onChange={(val) => setFilterSumber(val as string)}
            options={[
              { value: '', label: 'Semua Sumber Dana' },
              { value: 'internal', label: 'Internal Yayasan' },
              { value: 'pemerintah', label: 'Pemerintah' },
              { value: 'mitra', label: 'Mitra / CSR' },
              { value: 'alumni', label: 'Alumni' },
            ]} />

          <div className="pt-3 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Urutan Tampilan</p>
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Urutkan Berdasarkan"
                value={filterOrderBy}
                onChange={(val) => setFilterOrderBy(val as string)}
                options={[
                  { value: 'nama', label: 'Nama Beasiswa' },
                  { value: 'kode', label: 'Kode Beasiswa' },
                  { value: 'sumber', label: 'Sumber Dana' },
                  { value: 'nilai_potongan', label: 'Besaran Potongan' },
                ]}
              />
              <Select
                label="Arah Urutan"
                value={filterOrderDir}
                onChange={(val) => setFilterOrderDir(val as 'asc' | 'desc')}
                options={[
                  { value: 'asc', label: 'Menaik (A-Z)' },
                  { value: 'desc', label: 'Menurun (Z-A)' },
                ]}
              />
            </div>
          </div>
        </div>
      </Drawer>

      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={() => !deleteLoading && setDeleteModal({ isOpen: false, id: null, nama: '' })}
        onConfirm={handleConfirmDelete}
        isLoading={deleteLoading}
        title="Hapus Program Beasiswa"
        message={
          <span>
            Apakah Anda yakin ingin menghapus beasiswa <strong>&quot;{deleteModal.nama}&quot;</strong>?
            Tindakan ini tidak dapat dibatalkan.
          </span>
        }
        confirmText="Ya, Hapus"
        cancelText="Batal"
      />
    </>
  );
}