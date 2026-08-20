'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Filter, Loader2, Save, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useForm } from 'react-hook-form';

interface JalurKelas {
  id: number;
  kode?: string;
  nama_jalur: string;
  deskripsi?: string;
  is_active?: boolean;
}

interface FormValues {
  nama_jalur: string;
  deskripsi: string;
}

export function JalurKelasTab() {
  const [data, setData] = useState<JalurKelas[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter Drawer — 2-stage
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<JalurKelas | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: { nama_jalur: '', deskripsi: '' },
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await sikeuService.getJalurKelasList();
      setData(Array.isArray(res.data) ? res.data : []);
    } catch {
      setData([]);
      toast.error('Gagal memuat data jalur kelas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setEditingItem(null);
    reset({ nama_jalur: '', deskripsi: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: JalurKelas) => {
    setEditingItem(item);
    reset({ nama_jalur: item.nama_jalur, deskripsi: item.deskripsi || '' });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number, nama: string) => {
    if (!confirm(`Yakin ingin menghapus jalur kelas "${nama}"?`)) return;
    try {
      await sikeuService.deleteJalurKelas(id);
      toast.success('Jalur kelas berhasil dihapus');
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal menghapus jalur kelas');
    }
  };

  const onSubmit = async (formData: FormValues) => {
    setSubmitting(true);
    try {
      if (editingItem) {
        await sikeuService.updateJalurKelas(editingItem.id, formData);
        toast.success('Jalur kelas berhasil diperbarui');
      } else {
        await sikeuService.storeJalurKelas(formData);
        toast.success('Jalur kelas baru berhasil ditambahkan');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal menyimpan jalur kelas');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredData = useMemo(() => {
    if (!appliedSearch) return data;
    const q = appliedSearch.toLowerCase();
    return data.filter((item) =>
      item.nama_jalur?.toLowerCase().includes(q) || item.deskripsi?.toLowerCase().includes(q) || item.kode?.toLowerCase().includes(q)
    );
  }, [data, appliedSearch]);

  const columns: ColumnDef<JalurKelas>[] = [
    {
      key: 'kode',
      label: 'KODE',
      render: (row) =>
        row.kode ? (
          <span className="font-mono text-xs font-bold px-2 py-1 bg-slate-100 text-slate-700 rounded-md uppercase">
            {row.kode}
          </span>
        ) : (
          <span className="text-slate-400 text-xs">—</span>
        ),
    },
    {
      key: 'nama_jalur',
      label: 'NAMA JALUR / KELAS',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900 text-sm">{row.nama_jalur}</p>
          {row.deskripsi && <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{row.deskripsi}</p>}
        </div>
      ),
    },
    {
      key: 'is_active',
      label: 'STATUS',
      render: (row) =>
        row.is_active !== false ? (
          <span className="badge badge-green text-xs font-bold inline-flex items-center gap-1">
            <CheckCircle2 size={12} /> Aktif
          </span>
        ) : (
          <span className="badge badge-red text-xs font-bold inline-flex items-center gap-1">
            <XCircle size={12} /> Non-Aktif
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
          <Button size="sm" variant="ghost" onClick={() => handleDelete(row.id, row.nama_jalur)} icon={<Trash2 size={14} />}
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
        title="Jalur & Kelas"
        description="Kelola jalur masuk dan tipe kelas mahasiswa yang tersedia di sistem keuangan."
        action={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button variant="outline" onClick={() => setShowFilter(true)} icon={<Filter size={16} />} className="font-bold min-h-[40px]">
              Filter
            </Button>
            <Button variant="primary" onClick={handleOpenAdd} icon={<Plus size={16} />} className="font-bold min-h-[40px] px-4 shadow-sm">
              Tambah Jalur Kelas
            </Button>
          </div>
        }
      />

      <DataTable data={filteredData} isLoading={loading} columns={columns} emptyMessage="Belum ada data jalur kelas." />

      {/* Modal Create / Edit */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Jalur Kelas' : 'Tambah Jalur Kelas Baru'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input label="Nama Jalur / Kelas *" placeholder="Contoh: Reguler, Karyawan / Eksekutif"
            {...register('nama_jalur', { required: 'Nama jalur wajib diisi' })}
            error={errors.nama_jalur?.message} />
          <Input label="Deskripsi / Catatan" placeholder="Penjelasan singkat mengenai jalur kelas ini..."
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
      <Drawer isOpen={showFilter} onClose={() => setShowFilter(false)} title="Filter Jalur Kelas" width="420px"
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
          <Input label="Cari Nama atau Kode Jalur" placeholder="Ketik kata kunci..."
            value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} />
        </div>
      </Drawer>
    </>
  );
}
