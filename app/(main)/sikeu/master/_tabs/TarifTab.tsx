'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Filter, Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useForm } from 'react-hook-form';

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

const formatRupiah = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

export function TarifTab() {
  const [data, setData] = useState<Tarif[]>([]);
  const [loading, setLoading] = useState(false);
  const [jenisBiayaList, setJenisBiayaList] = useState<any[]>([]);

  // Filter Drawer States — 2-stage
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterAngkatan, setFilterAngkatan] = useState<string>('');
  const [filterJalur, setFilterJalur] = useState<string>('');
  const [appliedFilters, setAppliedFilters] = useState({ search: '', angkatan: '', jalur: '' });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Tarif | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      jenis_biaya_id: 1,
      tahun_angkatan: 2025,
      jalur_kelas: 'Reguler',
      kelompok_ukt: 1,
      prodi: 'Teknik Informatika',
      nama_kelompok: 'SPP Semester Teknik Informatika',
      nominal: 3500000,
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

  useEffect(() => {
    fetchData();
    fetchJenisBiaya();
  }, []);

  const handleOpenAdd = () => {
    setEditingItem(null);
    reset({
      jenis_biaya_id: jenisBiayaList[0]?.id || 1,
      tahun_angkatan: 2025,
      jalur_kelas: 'Reguler',
      kelompok_ukt: 1,
      prodi: 'Teknik Informatika',
      nama_kelompok: 'SPP Semester Teknik Informatika',
      nominal: 3500000,
    });
    setIsModalOpen(true);
  };

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

  const handleDelete = async (id: number, nama?: string) => {
    if (!confirm(`Yakin ingin menghapus tarif "${nama || 'ini'}"?`)) return;
    try {
      await sikeuService.deleteTarif(id);
      toast.success('Tarif berhasil dihapus');
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal menghapus tarif');
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
    setAppliedFilters({ search: '', angkatan: '', jalur: '' });
    setShowFilter(false);
  };

  const filteredData = useMemo(() => {
    return data.filter((item) => {
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
  }, [data, appliedFilters]);

  const columns: ColumnDef<Tarif>[] = [
    {
      key: 'nama_kelompok',
      label: 'KOMPONEN / NAMA TARIF',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900 text-sm">{row.nama_kelompok || row.jenis_biaya?.nama || 'Tarif Biaya'}</p>
          <p className="text-xs text-slate-500">{row.prodi || 'Semua Program Studi'}</p>
        </div>
      ),
    },
    {
      key: 'tahun_angkatan',
      label: 'ANGKATAN',
      render: (row) => (
        <span className="badge badge-blue text-xs font-bold">{row.tahun_angkatan}</span>
      ),
    },
    {
      key: 'jalur_kelas',
      label: 'JALUR / KELAS',
      render: (row) => (
        <span className="font-semibold text-slate-700 text-xs">{row.jalur_kelas || 'Reguler'}</span>
      ),
    },
    {
      key: 'nominal',
      label: 'NOMINAL TARIF',
      render: (row) => (
        <span className="font-bold text-slate-900 tabular-nums text-sm">
          {formatRupiah(row.nominal || 0)}
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
          <Button size="sm" variant="ghost" onClick={() => handleDelete(row.id, row.nama_kelompok)} icon={<Trash2 size={14} />}
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
        title="Nominal Tarif Biaya Angkatan"
        description="Kelola besaran nominal tarif biaya perkuliahan per angkatan, prodi, dan jalur kelas."
        action={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button variant="outline" onClick={() => setShowFilter(true)} icon={<Filter size={16} />} className="font-bold min-h-[40px]">
              Filter
            </Button>
            <Button variant="primary" onClick={handleOpenAdd} icon={<Plus size={16} />} className="font-bold min-h-[40px] px-4 shadow-sm">
              Atur Nominal Tarif
            </Button>
          </div>
        }
      />

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
              options={[
                { value: 'Reguler', label: 'Kelas Reguler' },
                { value: 'Karyawan', label: 'Kelas Karyawan / Eksekutif' },
                { value: 'Internasional', label: 'Kelas Internasional' },
                { value: 'Online', label: 'Kelas Online / PJJ' },
              ]}
              value={selectedJalurVal}
              onChange={(val) => setValue('jalur_kelas', val as string)} />

            <Input label="Program Studi *" placeholder="Contoh: Teknik Informatika"
              {...register('prodi', { required: 'Program studi wajib diisi' })}
              error={errors.prodi?.message} />
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
              { value: 'Reguler', label: 'Reguler' },
              { value: 'Karyawan', label: 'Karyawan / Eksekutif' },
              { value: 'Internasional', label: 'Internasional' },
              { value: 'Online', label: 'Online' },
            ]} />
        </div>
      </Drawer>
    </>
  );
}
