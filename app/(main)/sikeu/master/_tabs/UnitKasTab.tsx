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
import { Select } from '@/components/ui/Select';
import { useForm } from 'react-hook-form';

interface UnitKas {
  id: number;
  nama_kas: string;
  tipe_kas: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_name?: string;
  penanggung_jawab?: string;
  status: boolean;
  deskripsi?: string;
}

interface FormValues {
  nama_kas: string;
  tipe_kas: string;
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
  penanggung_jawab: string;
  status: boolean;
  deskripsi: string;
}

const TIPE_KAS_OPTIONS = [
  { value: 'utama', label: 'Kas Utama (Rektorat/Pusat)' },
  { value: 'operasional', label: 'Kas Operasional Unit' },
  { value: 'petty_cash', label: 'Petty Cash / Kas Kecil' },
  { value: 'bank_penerimaan', label: 'Bank Penerimaan (SPMB/SPP)' },
  { value: 'beasiswa', label: 'Kas Beasiswa & ZISWAF' },
];

export function UnitKasTab() {
  const [data, setData] = useState<UnitKas[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter Drawer — 2-stage
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({ search: '', status: '' });

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<UnitKas | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      nama_kas: '',
      tipe_kas: 'utama',
      bank_name: 'BNI',
      bank_account_number: '',
      bank_account_name: '',
      penanggung_jawab: '',
      status: true,
      deskripsi: '',
    },
  });

  const isActiveValue = watch('status');

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await sikeuService.getUnitKasList();
      setData(Array.isArray(res.data) ? res.data : []);
    } catch {
      setData([]);
      toast.error('Gagal memuat data unit kas');
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
      nama_kas: '',
      tipe_kas: 'utama',
      bank_name: 'BNI',
      bank_account_number: '',
      bank_account_name: '',
      penanggung_jawab: '',
      status: true,
      deskripsi: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: UnitKas) => {
    setEditingItem(item);
    reset({
      nama_kas: item.nama_kas,
      tipe_kas: item.tipe_kas || 'utama',
      bank_name: item.bank_name || 'BNI',
      bank_account_number: item.bank_account_number || '',
      bank_account_name: item.bank_account_name || '',
      penanggung_jawab: item.penanggung_jawab || '',
      status: item.status !== false,
      deskripsi: item.deskripsi || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number, nama: string) => {
    if (!confirm(`Yakin ingin menghapus unit kas "${nama}"?`)) return;
    try {
      await sikeuService.deleteUnitKas(id);
      toast.success('Unit kas berhasil dihapus');
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal menghapus unit kas');
    }
  };

  const onSubmit = async (formData: FormValues) => {
    setSubmitting(true);
    try {
      if (editingItem) {
        await sikeuService.updateUnitKas(editingItem.id, formData);
        toast.success('Unit kas berhasil diperbarui');
      } else {
        await sikeuService.storeUnitKas(formData);
        toast.success('Unit kas baru berhasil ditambahkan');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal menyimpan unit kas');
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
    setAppliedFilters({ search: '', status: '' });
    setShowFilter(false);
  };

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (appliedFilters.search) {
        const q = appliedFilters.search.toLowerCase();
        if (!item.nama_kas?.toLowerCase().includes(q) &&
            !item.bank_name?.toLowerCase().includes(q) &&
            !item.bank_account_number?.toLowerCase().includes(q) &&
            !item.penanggung_jawab?.toLowerCase().includes(q)) return false;
      }
      if (appliedFilters.status === 'active' && !item.status) return false;
      if (appliedFilters.status === 'inactive' && item.status) return false;
      return true;
    });
  }, [data, appliedFilters]);

  const columns: ColumnDef<UnitKas>[] = [
    {
      key: 'nama_kas',
      label: 'NAMA KAS / REKENING',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900 text-sm">{row.nama_kas}</p>
          {row.deskripsi && <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{row.deskripsi}</p>}
        </div>
      ),
    },
    {
      key: 'bank_info',
      label: 'INFORMASI BANK',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-800 text-xs">{row.bank_name} - {row.bank_account_number || '-'}</p>
          <p className="text-2xs text-slate-500">{row.bank_account_name || '-'}</p>
        </div>
      ),
    },
    {
      key: 'penanggung_jawab',
      label: 'PENANGGUNG JAWAB',
      render: (row) => (
        <span className="font-semibold text-slate-700 text-xs">{row.penanggung_jawab || '-'}</span>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (row) =>
        row.status ? (
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
          <Button size="sm" variant="ghost" onClick={() => handleDelete(row.id, row.nama_kas)} icon={<Trash2 size={14} />}
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
        title="Master Unit Kas & Rekening"
        description="Kelola akun kas utama, kas operasional, dan rekening bank penerimaan kampus."
        action={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button variant="outline" onClick={() => setShowFilter(true)} icon={<Filter size={16} />} className="font-bold min-h-[40px]">
              Filter
            </Button>
            <Button variant="primary" onClick={handleOpenAdd} icon={<Plus size={16} />} className="font-bold min-h-[40px] px-4 shadow-sm">
              Tambah Unit Kas
            </Button>
          </div>
        }
      />

      <DataTable data={filteredData} isLoading={loading} columns={columns} emptyMessage="Belum ada data unit kas." />

      {/* Modal Add/Edit */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Unit Kas' : 'Tambah Unit Kas Baru'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nama Unit Kas *" placeholder="Contoh: Kas Utama Bagian Keuangan"
              {...register('nama_kas', { required: 'Nama kas wajib diisi' })}
              error={errors.nama_kas?.message} />

            <Select label="Tipe Kas *"
              options={TIPE_KAS_OPTIONS}
              value={watch('tipe_kas')}
              onChange={(val) => setValue('tipe_kas', val as string)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Nama Bank / Metode *"
              options={[
                { value: 'BNI', label: 'BNI (Bank Negara Indonesia)' },
                { value: 'Mandiri', label: 'Bank Mandiri' },
                { value: 'BRI', label: 'BRI (Bank Rakyat Indonesia)' },
                { value: 'BSI', label: 'BSI (Bank Syariah Indonesia)' },
                { value: 'BCA', label: 'BCA' },
                { value: 'KAS_TUNAI', label: 'Kas Tunai (Cash)' },
              ]}
              value={watch('bank_name')}
              onChange={(val) => setValue('bank_name', val as string)} />

            <Input label="Nomor Rekening / Cashbox *" placeholder="Contoh: 08821908234"
              {...register('bank_account_number', { required: 'Nomor rekening wajib diisi' })}
              error={errors.bank_account_number?.message} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Atas Nama Rekening *" placeholder="Contoh: Universitas Indonusa - Kas Utama"
              {...register('bank_account_name', { required: 'Nama pemilik rekening wajib diisi' })}
              error={errors.bank_account_name?.message} />

            <Input label="Penanggung Jawab *" placeholder="Contoh: Hj. Siti Fatimah, S.E."
              {...register('penanggung_jawab', { required: 'Penanggung jawab wajib diisi' })}
              error={errors.penanggung_jawab?.message} />
          </div>

          <Input label="Deskripsi / Catatan" placeholder="Penjelasan mengenai peruntukan unit kas ini..."
            {...register('deskripsi')} />

          <Select label="Status *"
            options={[
              { value: 'true', label: 'Aktif (Dapat Digunakan)' },
              { value: 'false', label: 'Non-Aktif (Diarsipkan)' },
            ]}
            value={isActiveValue ? 'true' : 'false'}
            onChange={(val) => setValue('status', val === 'true')} />

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
      <Drawer isOpen={showFilter} onClose={() => setShowFilter(false)} title="Filter Unit Kas" width="420px"
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
          <Input label="Cari Nama Kas / Rekening / Penanggung Jawab" placeholder="Ketik kata kunci..."
            value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} />

          <Select label="Status"
            value={filterStatus}
            onChange={(val) => setFilterStatus(val as string)}
            options={[
              { value: '', label: 'Semua Status' },
              { value: 'active', label: 'Hanya Yang Aktif' },
              { value: 'inactive', label: 'Hanya Yang Non-Aktif' },
            ]} />
        </div>
      </Drawer>
    </>
  );
}
