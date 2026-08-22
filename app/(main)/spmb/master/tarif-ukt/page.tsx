'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Filter } from 'lucide-react';
import { spmbService } from '@/services/spmb.service';
import { TarifUktSpmb } from '@/types/spmb.types';
import toast from 'react-hot-toast';
import { DataTable } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

const schema = z.object({
  program_studi_id: z.number().int().positive(),
  tahun_akademik_id: z.number().int().positive(),
  kelompok_ukt: z.string().min(1, 'Kelompok UKT wajib diisi').max(100),
  nominal: z.number().min(0, 'Nominal tidak boleh negatif'),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const formatRupiah = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

export default function TarifUktSpmbPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [data, setData] = useState<TarifUktSpmb[]>([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 15 });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<TarifUktSpmb | null>(null);
  const [showFilter, setShowFilter] = useState(false);

  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 15;
  const searchQ = searchParams.get('search') || '';
  const orderByQ = searchParams.get('sort_by') || 'id';
  const orderDirQ = searchParams.get('sort_dir') || 'asc';

  const [filterSearch, setFilterSearch] = useState(searchQ);
  const [filterOrderBy, setFilterOrderBy] = useState(orderByQ);
  const [filterOrderDir, setFilterOrderDir] = useState(orderDirQ);

  const { register, handleSubmit, control, reset, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { is_active: true, kelompok_ukt: '', nominal: 0, program_studi_id: 0, tahun_akademik_id: 0 }
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await spmbService.getTarifUktSpmb({ page, limit, search: searchQ, sort_by: orderByQ, sort_dir: orderDirQ });
      setData(res.data || []);
      if (res.meta) setMeta(res.meta);
    } catch {
      toast.error('Gagal memuat data tarif UKT');
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchQ, orderByQ, orderDirQ]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateURLParams = (params: Record<string, string | number>) => {
    const p = new URLSearchParams(searchParams.toString());
    Object.keys(params).forEach(k => params[k] ? p.set(k, String(params[k])) : p.delete(k));
    router.push(`${pathname}?${p.toString()}`);
  };

  const handleApplyFilter = () => {
    updateURLParams({ page: 1, search: filterSearch, sort_by: filterOrderBy, sort_dir: filterOrderDir });
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterSearch(''); setFilterOrderBy('id'); setFilterOrderDir('asc');
    updateURLParams({ page: 1, search: '', sort_by: 'id', sort_dir: 'asc' });
    setShowFilter(false);
  };

  const loadProdi = async (inputValue: string) => {
    try {
      const res = await spmbService.getProgramStudi();
      const list = res.data || [];
      return list
        .filter((p: any) => p.nama.toLowerCase().includes(inputValue.toLowerCase()))
        .map((p: any) => ({ value: p.id, label: `${p.kode || ''} - ${p.nama}` }));
    } catch { return []; }
  };

  const loadTahunAkademik = async (inputValue: string) => {
    try {
      const res = await spmbService.getTahunAkademikList();
      const list = res.data || [];
      return list
        .filter((t: any) => t.nama.toLowerCase().includes(inputValue.toLowerCase()))
        .map((t: any) => ({ value: t.id, label: t.nama }));
    } catch { return []; }
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    reset({ is_active: true, kelompok_ukt: '', nominal: 0 });
    setShowModal(true);
  };

  const handleOpenEdit = (item: TarifUktSpmb) => {
    setEditingItem(item);
    setValue('program_studi_id', item.program_studi_id);
    setValue('tahun_akademik_id', item.tahun_akademik_id);
    setValue('kelompok_ukt', item.kelompok_ukt);
    setValue('nominal', Number(item.nominal));
    setValue('is_active', item.is_active);
    setShowModal(true);
  };

  const onSubmit = async (values: FormValues) => {
    try {
      setSubmitting(true);
      if (editingItem) {
        await spmbService.updateTarifUktSpmb(editingItem.id, values);
        toast.success('Tarif UKT berhasil diperbarui');
      } else {
        await spmbService.storeTarifUktSpmb(values);
        toast.success('Tarif UKT berhasil ditambahkan');
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan data');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus tarif UKT ini?')) return;
    try {
      await spmbService.deleteTarifUktSpmb(id);
      toast.success('Tarif UKT berhasil dihapus');
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus data');
    }
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <PageHeader
        title="Tarif UKT Daftar Ulang"
        description="Konfigurasi nominal biaya UKT daftar ulang per program studi dan tahun akademik"
        action={
          <div className="flex gap-2">
            <Button icon={<Plus size={16} />} onClick={handleOpenCreate}>Tambah Tarif</Button>
            <Button variant="outline" icon={<Filter size={16} />} onClick={() => setShowFilter(true)}>Filter</Button>
          </div>
        }
      />

      <DataTable
        data={data}
        meta={meta}
        isLoading={loading}
        columns={[
          {
            key: 'program_studi',
            label: 'Program Studi',
            render: (row) => <span className="font-medium">{row.program_studi?.nama ?? '-'}</span>
          },
          {
            key: 'tahun_akademik',
            label: 'Tahun Akademik',
            render: (row) => <span>{row.tahun_akademik?.nama ?? '-'}</span>
          },
          { key: 'kelompok_ukt', label: 'Kelompok UKT', sortable: true },
          {
            key: 'nominal',
            label: 'Nominal',
            render: (row) => <span className="font-semibold">{formatRupiah(Number(row.nominal))}</span>
          },
          {
            key: 'is_active',
            label: 'Status',
            render: (row) => row.is_active
              ? <Badge variant="success">Aktif</Badge>
              : <Badge variant="danger">Nonaktif</Badge>
          },
          {
            key: 'actions',
            label: 'Aksi',
            align: 'right',
            render: (row) => (
              <DropdownMenu
                items={[
                  { label: 'Edit', icon: <Edit size={14} />, onClick: () => handleOpenEdit(row) },
                  { label: 'Hapus', icon: <Trash2 size={14} className="text-red-500" />, onClick: () => handleDelete(row.id), variant: 'danger' },
                ]}
              />
            )
          }
        ]}
      />

      {/* Modal Form Create/Edit */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingItem ? 'Edit Tarif UKT' : 'Tambah Tarif UKT Daftar Ulang'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <Controller
            name="program_studi_id"
            control={control}
            render={({ field }) => (
              <AsyncSelect
                label="Program Studi *"
                placeholder="Pilih program studi..."
                loadOptions={loadProdi}
                defaultOptions
                value={field.value ? { value: field.value, label: data.find(d => d.program_studi_id === field.value)?.program_studi?.nama ?? String(field.value) } : null}
                onChange={(opt: any) => field.onChange(opt?.value ?? null)}
                error={errors.program_studi_id?.message}
              />
            )}
          />

          <Controller
            name="tahun_akademik_id"
            control={control}
            render={({ field }) => (
              <AsyncSelect
                label="Tahun Akademik *"
                placeholder="Pilih tahun akademik..."
                loadOptions={loadTahunAkademik}
                defaultOptions
                value={field.value ? { value: field.value, label: data.find(d => d.tahun_akademik_id === field.value)?.tahun_akademik?.nama ?? String(field.value) } : null}
                onChange={(opt: any) => field.onChange(opt?.value ?? null)}
                error={errors.tahun_akademik_id?.message}
              />
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Kelompok UKT *"
              placeholder="Misal: UKT-1, UKT-2"
              error={errors.kelompok_ukt?.message}
              {...register('kelompok_ukt')}
            />
            <Input
              label="Nominal (Rp) *"
              type="number"
              placeholder="Misal: 2500000"
              error={errors.nominal?.message}
              {...register('nominal', { valueAsNumber: true })}
            />
          </div>

          <Controller
            name="is_active"
            control={control}
            render={({ field }) => (
              <Select
                label="Status"
                value={field.value ? 'true' : 'false'}
                onChange={(val) => field.onChange(val === 'true')}
                options={[
                  { value: 'true', label: 'Aktif' },
                  { value: 'false', label: 'Nonaktif' },
                ]}
              />
            )}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)} disabled={submitting}>Batal</Button>
            <Button type="submit" variant="primary" loading={submitting}>
              {editingItem ? 'Simpan Perubahan' : 'Tambah Tarif'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Filter Drawer */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Tarif UKT"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={handleResetFilter}>Reset</Button>
            <Button variant="primary" onClick={handleApplyFilter}>Terapkan</Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Pencarian"
            placeholder="Nama prodi atau kelompok UKT..."
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
                { value: 'kelompok_ukt', label: 'Kelompok UKT' },
                { value: 'nominal', label: 'Nominal' },
              ]}
            />
            <Select
              label="Arah"
              value={filterOrderDir}
              onChange={(val) => setFilterOrderDir(val)}
              options={[
                { value: 'asc', label: 'A - Z (Naik)' },
                { value: 'desc', label: 'Z - A (Turun)' },
              ]}
            />
          </div>
        </div>
      </Drawer>
    </div>
  );
}
