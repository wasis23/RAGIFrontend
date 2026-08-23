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
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { spmbService } from '@/services/spmb.service';

const schema = z.object({
  tahun_akademik_id: z.number().int().positive('Tahun akademik wajib dipilih'),
  kelompok_ukt: z.string().min(1, 'Kelompok UKT wajib diisi'),
  nominal: z.number({ error: 'Nominal harus berupa angka' }).min(0, 'Nominal tidak boleh kurang dari 0'),
  is_active: z.boolean(),
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
  const { register, handleSubmit, control, reset, setValue, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { is_active: true, nominal: 0 } });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [prodiResponse, tarifResponse] = await Promise.all([
        spmbService.getProgramStudi(),
        spmbService.getTarifUktSpmb({ program_studi_id: programStudiId, page, limit, search, sort_by: sortBy, sort_dir: sortDir }),
      ]);
      const prodiList = Array.isArray(prodiResponse.data) ? prodiResponse.data : prodiResponse.data?.data || [];
      setProgramStudi(prodiList.find((item: any) => item.id === programStudiId));
      setData(tarifResponse.data || []);
      if (tarifResponse.meta) setMeta(tarifResponse.meta);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal memuat tarif program studi');
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



  const loadTahunAkademik = async (input: string) => {
    const response = await spmbService.getTahunAkademikList();
    return (response.data || []).filter((item: any) => item.nama.toLowerCase().includes(input.toLowerCase())).map((item: any) => ({ value: item.id, label: item.nama }));
  };

  const openCreate = () => { setEditing(null); reset({ tahun_akademik_id: 0, kelompok_ukt: '', nominal: 0, is_active: true }); setShowModal(true); };
  const openEdit = (item: any) => { setEditing(item); reset({ tahun_akademik_id: item.tahun_akademik_id, kelompok_ukt: item.kelompok_ukt, nominal: Number(item.nominal), is_active: item.is_active }); setShowModal(true); };
  const onSubmit = async (values: FormValues) => {
    try {
      setSubmitting(true);
      const payload = { ...values, program_studi_id: programStudiId };
      if (editing) await spmbService.updateTarifUktSpmb(editing.id, payload);
      else await spmbService.storeTarifUktSpmb(payload);
      toast.success('Tarif UKT berhasil disimpan'); setShowModal(false); fetchData();
    } catch (error: any) { toast.error(error?.response?.data?.message || 'Gagal menyimpan tarif UKT'); } finally { setSubmitting(false); }
  };
  const remove = async (id: number) => { if (!confirm('Hapus tarif UKT ini?')) return; await spmbService.deleteTarifUktSpmb(id); toast.success('Tarif UKT dihapus'); fetchData(); };

  return (
    <div className="w-full animate-fade-in flex flex-col gap-4 sm:gap-6">
      <PageHeader title={`Tarif UKT - ${programStudi?.nama || 'Program Studi'}`} description="Kelola kelompok tarif UKT berdasarkan master SIKEU" backUrl="/spmb/master/tarif-ukt" action={<div className="flex flex-wrap gap-2"><Button variant="outline" icon={<Filter size={16} />} onClick={() => setShowFilter(true)}>Filter</Button><Button icon={<Plus size={16} />} onClick={openCreate}>Tambah Tarif</Button></div>} />
      <DataTable data={data} meta={meta} isLoading={loading} columns={[
        { key: 'tahun_akademik', label: 'Tahun Akademik', render: (row) => row.tahun_akademik?.nama || '-' },
        { key: 'kelompok_ukt', label: 'Kelompok UKT' },
        { key: 'nominal', label: 'Nominal', render: (row) => formatRupiah(Number(row.nominal)) },
        { key: 'is_active', label: 'Status', render: (row) => row.is_active ? <Badge variant="success">Aktif</Badge> : <Badge variant="danger">Nonaktif</Badge> },
        { key: 'actions', label: 'Aksi', align: 'right', render: (row) => <DropdownMenu items={[{ label: 'Edit', icon: <Edit size={14} />, onClick: () => openEdit(row) }, { label: 'Hapus', icon: <Trash2 size={14} />, onClick: () => remove(row.id), variant: 'danger' }]} /> },
      ]} />
      <Drawer open={showFilter} onClose={() => setShowFilter(false)} title="Filter Tarif UKT" footer={<div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => setShowFilter(false)}>Batal</Button><Button onClick={applyFilter}>Terapkan</Button></div>}>
        <div className="flex flex-col gap-4">
          <Input label="Pencarian" value={filterSearch} onChange={(event) => setFilterSearch(event.target.value)} placeholder="Kelompok UKT..." />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Urut Berdasarkan" value={filterSortBy} onChange={setFilterSortBy} options={[{ value: 'id', label: 'ID' }, { value: 'kelompok_ukt', label: 'Kelompok UKT' }, { value: 'nominal', label: 'Nominal' }]} />
            <Select label="Arah" value={filterSortDir} onChange={setFilterSortDir} options={[{ value: 'asc', label: 'Naik' }, { value: 'desc', label: 'Turun' }]} />
          </div>
        </div>
      </Drawer>
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Tarif UKT' : 'Tambah Tarif UKT'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller name="tahun_akademik_id" control={control} render={({ field }) => <AsyncSelect label="Tahun Akademik *" loadOptions={loadTahunAkademik} defaultOptions value={field.value ? { value: field.value, label: data.find((item) => item.tahun_akademik_id === field.value)?.tahun_akademik?.nama || String(field.value) } : null} onChange={(option: any) => field.onChange(option?.value || 0)} error={errors.tahun_akademik_id?.message} />} />
            <Input label="Kelompok UKT *" placeholder="Contoh: Kelompok I" className="bg-white" {...register('kelompok_ukt')} error={errors.kelompok_ukt?.message} />
            <Input label="Nominal (Rp) *" type="number" className="bg-white" {...register('nominal', { valueAsNumber: true })} error={errors.nominal?.message} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100"><Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Batal</Button><Button type="submit" loading={submitting}>Simpan</Button></div>
        </form>
      </Modal>
    </div>
  );
}
