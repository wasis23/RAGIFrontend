'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Filter, Loader2, Save } from 'lucide-react';
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

interface StudentType {
  id: number;
  mahasiswa_id: number;
  nim: string;
  nama_mahasiswa: string;
  tahun_angkatan: number;
  jalur_kelas: string;
  kelompok_ukt: number;
  beasiswa_id?: number;
  beasiswa?: { nama: string };
  catatan_perubahan?: string;
}

interface FormValues {
  mahasiswa_id: number;
  nim: string;
  nama_mahasiswa: string;
  tahun_angkatan: number;
  jalur_kelas: string;
  kelompok_ukt: number;
  beasiswa_id: number;
  catatan_perubahan: string;
}

export function StudentTypesTab() {
  const [data, setData] = useState<StudentType[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter Drawer — 2-stage
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StudentType | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      mahasiswa_id: 101,
      nim: '',
      nama_mahasiswa: '',
      tahun_angkatan: 2025,
      jalur_kelas: 'Reguler',
      kelompok_ukt: 1,
      beasiswa_id: 0,
      catatan_perubahan: '',
    },
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await sikeuService.getStudentBillingTypes();
      setData(Array.isArray(res.data) ? res.data : []);
    } catch {
      setData([]);
      toast.error('Gagal memuat data tipe tagihan mahasiswa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setEditingItem(null);
    reset({
      mahasiswa_id: 101,
      nim: '',
      nama_mahasiswa: '',
      tahun_angkatan: 2025,
      jalur_kelas: 'Reguler',
      kelompok_ukt: 1,
      beasiswa_id: 0,
      catatan_perubahan: 'Penetapan awal mahasiswa baru',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: StudentType) => {
    setEditingItem(item);
    reset({
      mahasiswa_id: item.mahasiswa_id,
      nim: item.nim,
      nama_mahasiswa: item.nama_mahasiswa,
      tahun_angkatan: item.tahun_angkatan,
      jalur_kelas: item.jalur_kelas,
      kelompok_ukt: item.kelompok_ukt,
      beasiswa_id: item.beasiswa_id || 0,
      catatan_perubahan: item.catatan_perubahan || '',
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (formData: FormValues) => {
    setSubmitting(true);
    try {
      if (editingItem) {
        await sikeuService.updateStudentBillingType(editingItem.id, formData);
        toast.success('Tipe tagihan mahasiswa berhasil diperbarui');
      } else {
        await sikeuService.assignStudentBillingType(formData);
        toast.success('Penetapan tipe tagihan mahasiswa baru berhasil disimpan');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal menyimpan tipe tagihan');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredData = useMemo(() => {
    if (!appliedSearch) return data;
    const q = appliedSearch.toLowerCase();
    return data.filter((item) =>
      item.nama_mahasiswa?.toLowerCase().includes(q) ||
      item.nim?.toLowerCase().includes(q) ||
      item.jalur_kelas?.toLowerCase().includes(q)
    );
  }, [data, appliedSearch]);

  const columns: ColumnDef<StudentType>[] = [
    {
      key: 'nama_mahasiswa',
      label: 'MAHASISWA',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900 text-sm">{row.nama_mahasiswa}</p>
          <p className="font-mono text-xs text-slate-500">NIM: {row.nim || '-'}</p>
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
      label: 'JALUR KELAS',
      render: (row) => (
        <span className="font-semibold text-slate-700 text-xs">{row.jalur_kelas}</span>
      ),
    },
    {
      key: 'kelompok_ukt',
      label: 'GOLONGAN / KELOMPOK UKT',
      render: (row) => (
        <span className="badge badge-purple text-xs font-bold">Golongan {row.kelompok_ukt}</span>
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
            Edit Tipe
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Tipe Pendaftaran & Tagihan Mahasiswa"
        description="Penetapan golongan UKT, jalur kelas, dan skema pembiayaan untuk setiap mahasiswa."
        action={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button variant="outline" onClick={() => setShowFilter(true)} icon={<Filter size={16} />} className="font-bold min-h-[40px]">
              Filter
            </Button>
            <Button variant="primary" onClick={handleOpenAdd} icon={<Plus size={16} />} className="font-bold min-h-[40px] px-4 shadow-sm">
              Penetapan Tipe Mahasiswa
            </Button>
          </div>
        }
      />

      <DataTable data={filteredData} isLoading={loading} columns={columns} emptyMessage="Belum ada data penetapan tipe tagihan mahasiswa." />

      {/* Modal Add/Edit */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Tipe Tagihan Mahasiswa' : 'Penetapan Tipe Tagihan Baru'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nama Mahasiswa *" placeholder="Contoh: Budi Santoso"
              {...register('nama_mahasiswa', { required: 'Nama mahasiswa wajib diisi' })}
              error={errors.nama_mahasiswa?.message} />
            <Input label="NIM *" placeholder="Contoh: 2025010088"
              {...register('nim', { required: 'NIM wajib diisi' })}
              error={errors.nim?.message} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input type="number" label="Tahun Angkatan *" placeholder="2025"
              {...register('tahun_angkatan', { required: 'Angkatan wajib diisi', valueAsNumber: true })} />
            <Select label="Jalur Kelas *"
              options={[
                { value: 'Reguler', label: 'Reguler' },
                { value: 'Karyawan', label: 'Karyawan / Eksekutif' },
                { value: 'Internasional', label: 'Internasional' },
                { value: 'Online', label: 'Online' },
              ]}
              value={watch('jalur_kelas')}
              onChange={(val) => setValue('jalur_kelas', val as string)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Golongan / Kelompok UKT *"
              options={[
                { value: '1', label: 'Golongan 1 (Subsidi Penuh)' },
                { value: '2', label: 'Golongan 2 (Subsidi Parsial)' },
                { value: '3', label: 'Golongan 3 (Reguler / Standar)' },
                { value: '4', label: 'Golongan 4 (Mandiri / Menengah)' },
                { value: '5', label: 'Golongan 5 (Eksekutif / Khusus)' },
              ]}
              value={watch('kelompok_ukt')?.toString() || '1'}
              onChange={(val) => setValue('kelompok_ukt', Number(val))} />

            <Input label="Catatan Perubahan" placeholder="Contoh: Pindah jalur pada semester 3..."
              {...register('catatan_perubahan')} />
          </div>

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
      <Drawer isOpen={showFilter} onClose={() => setShowFilter(false)} title="Filter Tipe Mahasiswa" width="420px"
        footer={
          <div className="flex items-center justify-between gap-3">
            <Button type="button" variant="outline" onClick={() => { setFilterSearch(''); setAppliedSearch(''); setShowFilter(false); }}
              className="font-bold text-slate-600 min-h-[42px] px-4">
              Reset
            </Button>
            <Button type="button" variant="primary" onClick={() => { setAppliedSearch(filterSearch); setShowFilter(false); }}
              className="font-bold min-h-[42px] px-5 shadow-md">
              Terapkan Filter
            </Button>
          </div>
        }>
        <div className="space-y-5">
          <Input label="Cari Nama / NIM / Jalur" placeholder="Ketik kata kunci..."
            value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} />
        </div>
      </Drawer>
    </>
  );
}
