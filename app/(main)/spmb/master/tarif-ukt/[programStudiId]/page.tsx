'use client';

import { useCallback, useEffect, useState } from 'react';
import { Edit, Plus, Trash2, Filter } from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { Select } from '@/components/ui/Select';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { spmbService } from '@/services/spmb.service';
import api from '@/lib/axios';

const schema = z.object({
  nama: z.string().min(1, 'Nama wajib diisi'),
  deskripsi: z.string().optional().nullable(),
  master_sikeu_biaya_id: z.number().int().positive('Komponen biaya wajib dipilih'),
});
type FormValues = z.infer<typeof schema>;

const formatRupiah = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

export default function TarifUktProgramStudiDetailPage() {
  const router = useRouter();
  const params = useParams();
  const programStudiId = Number(params?.programStudiId);
  const [programStudi, setProgramStudi] = useState<any>(null);
  const [data, setData] = useState<any[]>([]);
  const [meta, setMeta] = useState<{ current_page: number; last_page: number; total: number; per_page: number; from?: number; to?: number }>({ current_page: 1, last_page: 1, total: 0, per_page: 15 });
  const [showFilter, setShowFilter] = useState(false);
  const searchParams = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 15;
  const sortBy = searchParams.get('sort_by') || 'id';
  const sortDir = searchParams.get('sort_dir') || 'asc';
  const search = searchParams.get('search') || '';
  const [filterSearch, setFilterSearch] = useState(search);
  const [filterSortBy, setFilterSortBy] = useState(sortBy);
  const [filterSortDir, setFilterSortDir] = useState(sortDir);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { nama: '', deskripsi: '' } });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [prodiResponse, tarifResponse] = await Promise.all([
        spmbService.getProgramStudi(),
        spmbService.getTarifUktSpmb({ master_program_studi_id: programStudiId, page, limit, search, sort_by: sortBy, sort_dir: sortDir }),
      ]);
      const prodiList = Array.isArray(prodiResponse.data) ? prodiResponse.data : prodiResponse.data?.data || [];
      setProgramStudi(prodiList.find((item: any) => item.id === programStudiId));
      setData(tarifResponse.data || []);
      if (tarifResponse.meta) setMeta(tarifResponse.meta);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal memuat biaya program studi');
    } finally {
      setLoading(false);
    }
  }, [programStudiId]);

  useEffect(() => { if (programStudiId) fetchData(); }, [fetchData, programStudiId]);

  const applyFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1');
    filterSearch ? params.set('search', filterSearch) : params.delete('search');
    params.set('sort_by', filterSortBy);
    params.set('sort_dir', filterSortDir);
    router.push(`/spmb/master/tarif-ukt/${programStudiId}?${params.toString()}`);
    setShowFilter(false);
  };

  const [masterBiayaMap, setMasterBiayaMap] = useState<Record<number, any>>({});

  const loadMasterBiaya = async (input: string) => {
    const response = await api.get('/v1/sikeu/master/master-biaya?module_code=spmb');
    const items = (response.data?.data || [])
      .filter((item: any) => (item.nama || '').toLowerCase().includes(input.toLowerCase()) || (item.kode || '').toLowerCase().includes(input.toLowerCase()))
      .map((item: any) => ({
        value: item.id,
        label: `${item.kode ? item.kode + ' - ' : ''}${item.nama}`,
        kode: item.kode,
        nama: item.nama,
        tipe: item.tipe,
        nominal_standar: item.nominal_standar,
      }));
    setMasterBiayaMap((prev) => {
      const next = { ...prev };
      items.forEach((opt: any) => { next[opt.value] = opt; });
      return next;
    });
    return items;
  };

  const getMasterBiayaValue = (fieldValue: number) => {
    const opt = masterBiayaMap[fieldValue]
      || data.find((item) => item.master_sikeu_biaya_id === fieldValue)?.master_sikeu_biaya
      || editing?.master_sikeu_biaya;
    if (opt) {
      return {
        value: fieldValue,
        label: opt.label || `${opt.kode ? opt.kode + ' - ' : ''}${opt.nama}`,
        kode: opt.kode,
        nama: opt.nama || opt.label,
        nominal_standar: opt.nominal_standar,
      };
    }
    return null;
  };

  const openCreate = () => { setEditing(null); reset({ nama: '', deskripsi: '' }); setShowModal(true); };
  const openEdit = (item: any) => { setEditing(item); reset({ nama: item.nama, deskripsi: item.deskripsi, master_sikeu_biaya_id: item.master_sikeu_biaya_id }); setShowModal(true); };
  const onSubmit = async (values: FormValues) => {
    try {
      setSubmitting(true);
      const payload = { ...values, master_program_studi_id: programStudiId, deskripsi: values.deskripsi || undefined };
      if (editing) await spmbService.updateTarifUktSpmb(editing.id, payload);
      else await spmbService.storeTarifUktSpmb(payload);
      toast.success('Biaya daftar ulang berhasil disimpan'); setShowModal(false); fetchData();
    } catch (error: any) { toast.error(error?.response?.data?.message || 'Gagal menyimpan biaya daftar ulang'); } finally { setSubmitting(false); }
  };
  const remove = async (id: number) => { if (!confirm('Hapus biaya daftar ulang ini?')) return; await spmbService.deleteTarifUktSpmb(id); toast.success('Biaya daftar ulang dihapus'); fetchData(); };

  return (
    <div className="w-full animate-fade-in flex flex-col gap-4 sm:gap-6">
      <PageHeader title={`Biaya Daftar Ulang - ${programStudi?.nama || 'Program Studi'}`} description="Kelola biaya daftar ulang berdasarkan master SIKEU" backUrl="/spmb/master/tarif-ukt" action={<div className="flex flex-wrap gap-2"><Button variant="outline" icon={<Filter size={16} />} onClick={() => setShowFilter(true)}>Filter</Button><Button icon={<Plus size={16} />} onClick={openCreate}>Tambah Biaya</Button></div>} />
      <DataTable data={data} meta={meta} isLoading={loading} columns={[
        { key: 'nama', label: 'Nama Biaya', sortable: true },
        { key: 'master_sikeu_biaya', label: 'Komponen Biaya', render: (row) => row.master_sikeu_biaya?.nama || '-' },
        { key: 'nominal', label: 'Nominal', render: (row) => formatRupiah(Number(row.master_sikeu_biaya?.nominal_standar || 0)) },
        { key: 'deskripsi', label: 'Deskripsi', render: (row) => row.deskripsi || '-' },
        { key: 'actions', label: 'Aksi', align: 'right', render: (row) => <DropdownMenu items={[{ label: 'Edit', icon: <Edit size={14} />, onClick: () => openEdit(row) }, { label: 'Hapus', icon: <Trash2 size={14} />, onClick: () => remove(row.id), variant: 'danger' }]} /> },
      ]} />
      <Drawer open={showFilter} onClose={() => setShowFilter(false)} title="Filter Biaya Daftar Ulang" footer={<div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => setShowFilter(false)}>Batal</Button><Button onClick={applyFilter}>Terapkan</Button></div>}>
        <div className="flex flex-col gap-4">
          <Input label="Pencarian" value={filterSearch} onChange={(event) => setFilterSearch(event.target.value)} placeholder="Nama biaya..." />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Urut Berdasarkan" value={filterSortBy} onChange={setFilterSortBy} options={[{ value: 'id', label: 'ID' }, { value: 'nama', label: 'Nama Biaya' }, { value: 'created_at', label: 'Tanggal Dibuat' }]} />
            <Select label="Arah" value={filterSortDir} onChange={setFilterSortDir} options={[{ value: 'asc', label: 'Naik' }, { value: 'desc', label: 'Turun' }]} />
          </div>
        </div>
      </Drawer>
      <Modal open={showModal} onClose={() => setShowModal(false)} size="lg" title={editing ? 'Edit Biaya Daftar Ulang' : 'Tambah Biaya Daftar Ulang'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nama Biaya *" placeholder="Contoh: Biaya Daftar Ulang SPMB" className="bg-white" {...register('nama')} error={errors.nama?.message} />
            <div className="md:col-span-2">
              <Controller name="master_sikeu_biaya_id" control={control} render={({ field }) => <AsyncSelect label="Komponen Biaya (SIKEU) *" loadOptions={loadMasterBiaya} defaultOptions value={field.value ? getMasterBiayaValue(field.value) : null} onChange={(option: any) => field.onChange(option?.value || 0)} error={errors.master_sikeu_biaya_id?.message} formatOptionLabel={(option: any) => (
              <div className="flex items-center justify-between gap-2 py-0.5">
                <div className="flex flex-col min-w-0">
                  <span className="font-medium truncate">{option.nama || option.label}</span>
                  {option.kode && <span className="text-xs text-slate-400 font-mono">{option.kode}</span>}
                </div>
                {option.nominal_standar != null && Number(option.nominal_standar) > 0 && (
                  <span className="text-xs font-semibold text-slate-500 shrink-0">{formatRupiah(Number(option.nominal_standar))}</span>
                )}
              </div>
            )} />} />
            </div>
            <div className="md:col-span-2">
              <Textarea label="Deskripsi" placeholder="Penjelasan singkat biaya ini" className="bg-white" {...register('deskripsi')} error={errors.deskripsi?.message} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100"><Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Batal</Button><Button type="submit" loading={submitting}>Simpan</Button></div>
        </form>
      </Modal>
    </div>
  );
}