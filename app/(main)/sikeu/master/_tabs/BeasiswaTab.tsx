'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Filter, Loader2, Save, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
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
  const [data, setData] = useState<Beasiswa[]>([]);
  const [loading, setLoading] = useState(false);
  const [jenisBiayaList, setJenisBiayaList] = useState<any[]>([]);

  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterSumber, setFilterSumber] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({ search: '', sumber: '' });

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
    setEditingItem(null);
    reset({
      kode: '',
      nama: '',
      sumber: 'internal',
      tipe_potongan: 'persen',
      nilai_potongan: 100,
      jenis_biaya_ids: [],
      berlaku_angkatan_mulai: 2023,
      berlaku_angkatan_sampai: 2027,
      deskripsi: '',
    });
    setIsModalOpen(true);
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
    setAppliedFilters({ search: filterSearch, sumber: filterSumber });
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterSumber('');
    setAppliedFilters({ search: '', sumber: '' });
    setShowFilter(false);
  };

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (appliedFilters.search) {
        const q = appliedFilters.search.toLowerCase();
        if (!item.nama?.toLowerCase().includes(q) && !item.kode?.toLowerCase().includes(q) && !item.deskripsi?.toLowerCase().includes(q)) return false;
      }
      if (appliedFilters.sumber && item.sumber !== appliedFilters.sumber) return false;
      return true;
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
        <span className="font-mono text-xs font-bold px-2 py-1 bg-slate-100 text-slate-700 rounded-md uppercase">
          {row.kode}
        </span>
      ),
    },
    {
      key: 'nama',
      label: 'NAMA PROGRAM BEASISWA',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900 text-sm">{row.nama}</p>
          {row.deskripsi && <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{row.deskripsi}</p>}
        </div>
      ),
    },
    {
      key: 'sumber',
      label: 'SUMBER DANA',
      render: (row) => (
        <span className="badge badge-blue text-xs font-semibold uppercase">{row.sumber || 'Internal'}</span>
      ),
    },
    {
      key: 'cakupan_biaya',
      label: 'CAKUPAN KOMPONEN',
      render: (row) => (
        <span className="text-xs text-slate-700 font-medium">{getCakupanBiayaText(row)}</span>
      ),
    },
    {
      key: 'nilai_potongan',
      label: 'BESARAN POTONGAN',
      render: (row) => (
        <span className="font-bold text-emerald-700 text-xs">
          {row.tipe_potongan === 'persen' ? `${row.nilai_potongan}%` : formatRupiah(row.nilai_potongan)}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(row)} icon={<Edit size={14} />}
            className="font-semibold text-slate-600 hover:text-primary-600 hover:bg-primary-50">
            Edit
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleOpenDelete(row.id, row.nama)} icon={<Trash2 size={14} />}
            className="font-semibold text-rose-600 hover:bg-rose-50">
            Hapus
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Master Program Beasiswa"
        description="Kelola skema beasiswa, sumber dana, besaran potongan, dan cakupan komponen biaya."
        action={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button variant="outline" onClick={() => setShowFilter(true)} icon={<Filter size={16} />} className="font-bold min-h-[40px]">
              Filter
            </Button>
            <Button variant="primary" onClick={handleOpenAdd} icon={<Plus size={16} />} className="font-bold min-h-[40px] px-4 shadow-sm">
              Tambah Master Beasiswa
            </Button>
          </div>
        }
      />

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