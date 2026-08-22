'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Filter } from 'lucide-react';
import { spmbService } from '@/services/spmb.service';
import { MasterTipeJalur } from '@/types/spmb.types';
import toast from 'react-hot-toast';
import { DataTable } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Controller, useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Form memiliki base input (kode, nama) <= 5.
// Berdasarkan Aturan 8, Form <= 5 inputs WAJIB menggunakan Modal.
// Meskipun menggunakan dynamic field array (alur_pendaftaran), base state tetap <= 5.
const schema = z.object({
  kode: z.string().min(1, 'Kode wajib diisi').max(50, 'Kode maksimal 50 karakter'),
  nama: z.string().min(1, 'Nama tipe jalur wajib diisi').max(255, 'Nama maksimal 255 karakter'),
  alur: z.array(z.object({
    nama_tahap: z.string().min(1, 'Nama tahap wajib diisi')
  })).optional()
});

type FormValues = z.infer<typeof schema>;

export default function MasterTipeJalurPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [data, setData] = useState<MasterTipeJalur[]>([]);
  const [meta, setMeta] = useState<{
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
    from?: number;
    to?: number;
  }>({ current_page: 1, last_page: 1, total: 0, per_page: 10 });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterTipeJalur | null>(null);

  // Filter drawer state
  const [showFilter, setShowFilter] = useState(false);
  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 10;
  const searchQ = searchParams.get('search') || '';
  const orderByQ = searchParams.get('sort_by') || 'id';
  const orderDirQ = searchParams.get('sort_dir') || 'asc';

  const [filterSearch, setFilterSearch] = useState(searchQ);
  const [filterOrderBy, setFilterOrderBy] = useState(orderByQ);
  const [filterOrderDir, setFilterOrderDir] = useState(orderDirQ);

  const { register, handleSubmit, control, reset, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { alur: [] }
  });

  const { fields: alurFields, append: appendAlur, remove: removeAlur } = useFieldArray({
    control,
    name: 'alur'
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await spmbService.getMasterTipeJalur({
        page,
        limit,
        search: searchQ,
        sort_by: orderByQ,
        sort_dir: orderDirQ
      });
      setData(res.data || []);
      if (res.meta) setMeta(res.meta);
    } catch (error: any) {
      toast.error(error.message || 'Gagal memuat data tipe jalur');
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchQ, orderByQ, orderDirQ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateURLParams = (newParams: Record<string, string | number>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.keys(newParams).forEach(key => {
      if (newParams[key]) {
        params.set(key, String(newParams[key]));
      } else {
        params.delete(key);
      }
    });
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleApplyFilter = () => {
    updateURLParams({
      page: 1,
      search: filterSearch,
      sort_by: filterOrderBy,
      sort_dir: filterOrderDir
    });
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterOrderBy('id');
    setFilterOrderDir('asc');
    updateURLParams({
      page: 1,
      search: '',
      sort_by: 'id',
      sort_dir: 'asc'
    });
    setShowFilter(false);
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    reset({ kode: '', nama: '', alur: [] });
    setShowModal(true);
  };

  const handleOpenEdit = (item: MasterTipeJalur) => {
    setEditingItem(item);
    setValue('kode', item.kode);
    setValue('nama', item.nama);
    setValue('alur', item.alur?.map(a => ({ nama_tahap: a.nama_tahap })) || []);
    setShowModal(true);
  };

  const onSubmitForm = async (values: FormValues) => {
    try {
      setSubmitting(true);
      if (editingItem) {
        await spmbService.updateMasterTipeJalur(editingItem.id, values);
        toast.success('Tipe jalur berhasil diperbarui');
      } else {
        await spmbService.createMasterTipeJalur(values);
        toast.success('Tipe jalur berhasil ditambahkan');
      }
      setShowModal(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan data');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus tipe jalur ini?')) return;
    try {
      await spmbService.deleteMasterTipeJalur(id);
      toast.success('Tipe jalur berhasil dihapus');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus data');
    }
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <PageHeader
        title="Master Tipe Jalur"
        description="Kelola kategori master tipe jalur penerimaan mahasiswa"
        action={
          <div className="flex gap-2">
            <Button icon={<Plus size={16} />} onClick={handleOpenCreate}>
              Tambah Tipe Jalur
            </Button>
            <Button 
              variant="outline"
              icon={<Filter size={16} />} 
              onClick={() => setShowFilter(true)}
            >
              Filter
            </Button>
          </div>
        }
      />

      <DataTable 
        data={data}
        meta={meta}
        isLoading={loading}
        columns={[
          { key: 'kode', label: 'Kode', sortable: true },
          { key: 'nama', label: 'Nama Tipe Jalur', sortable: true },
          { 
            key: 'alur', 
            label: 'Alur Pendaftaran', 
            render: (row) => (
              <div className="flex flex-wrap gap-1">
                {row.alur && row.alur.length > 0 ? (
                  row.alur.map((a, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs font-normal bg-slate-100 text-slate-600 border border-slate-200">
                      {idx + 1}. {a.nama_tahap}
                    </Badge>
                  ))
                ) : (
                  <span className="text-slate-400 text-sm italic">Belum diset</span>
                )}
              </div>
            )
          },
          { 
            key: 'actions', 
            label: 'Aksi', 
            align: 'right', 
            render: (row) => (
              <DropdownMenu
                items={[
                  {
                    label: 'Edit Data',
                    icon: <Edit size={14} />,
                    onClick: () => handleOpenEdit(row),
                  },
                  {
                    label: 'Hapus',
                    icon: <Trash2 size={14} className="text-red-500" />,
                    onClick: () => handleDelete(row.id),
                    variant: 'danger',
                  },
                ]}
              />
            ) 
          }
        ]}
      />

      {/* Modal Form Create/Edit */}
      {/* REQUIRED BY RULE 8: Forms <= 5 inputs must use a Modal, not a separate page */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingItem ? 'Edit Tipe Jalur' : 'Tambah Tipe Jalur'}
      >
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Kode Tipe Jalur *"
              placeholder="Misal: REGULER, PRESTASI"
              error={errors.kode?.message}
              {...register('kode')}
            />
            <Input 
              label="Nama Tipe Jalur *"
              placeholder="Misal: Jalur Reguler"
              error={errors.nama?.message}
              {...register('nama')}
            />
          </div>
          
          <div className="pt-4 border-t border-slate-100">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-semibold text-slate-700">Alur Pendaftaran</h4>
              <Button type="button" size="sm" variant="outline" icon={<Plus size={14} />} onClick={() => appendAlur({ nama_tahap: '' })}>
                Tambah Tahap
              </Button>
            </div>
            
            <div className="space-y-2">
              {alurFields.length === 0 && (
                <div className="text-sm text-center py-4 border border-dashed rounded-lg text-slate-400 bg-slate-50">
                  Belum ada alur pendaftaran. Klik Tambah Tahap.
                </div>
              )}
              {alurFields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-start">
                  <div className="flex-none pt-2 font-semibold text-slate-400 w-6 text-center">
                    {index + 1}.
                  </div>
                  <div className="flex-1">
                    <Input 
                      placeholder="Nama Tahap (Misal: Seleksi Berkas)"
                      {...register(`alur.${index}.nama_tahap`)}
                      error={errors.alur?.[index]?.nama_tahap?.message}
                    />
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="text-red-500 mt-1" 
                    onClick={() => removeAlur(index)}
                    title="Hapus tahap ini"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)} disabled={submitting}>
              Batal
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              {editingItem ? 'Simpan' : 'Tambah'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Filter Drawer */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Tipe Jalur"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={handleResetFilter}>
              Reset
            </Button>
            <Button variant="primary" onClick={handleApplyFilter}>
              Terapkan
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <Input 
            label="Pencarian"
            placeholder="Kode atau nama tipe jalur..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />

          <hr className="border-t border-slate-200 my-1" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select 
              label="Urut Berdasarkan"
              value={filterOrderBy}
              onChange={(val) => setFilterOrderBy(val)}
              options={[
                { value: 'id', label: 'ID' },
                { value: 'nama', label: 'Nama Tipe Jalur' },
                { value: 'kode', label: 'Kode Tipe Jalur' }
              ]}
            />

            <Select 
              label="Arah"
              value={filterOrderDir}
              onChange={(val) => setFilterOrderDir(val)}
              options={[
                { value: 'asc', label: 'A - Z (Naik)' },
                { value: 'desc', label: 'Z - A (Turun)' }
              ]}
            />
          </div>
        </div>
      </Drawer>
    </div>
  );
}