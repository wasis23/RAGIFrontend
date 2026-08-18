'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Drawer } from '@/components/ui/Drawer';
import { useForm, Controller } from 'react-hook-form';
import { Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';

export default function MasterKuotaProdiPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const [filterProdi, setFilterProdi] = useState('');
  const [filterOrderBy, setFilterOrderBy] = useState('id');
  const [filterOrderDir, setFilterOrderDir] = useState('asc');

  const [prodiOptions, setProdiOptions] = useState([
    { value: 1, label: 'S1 Teknik Informatika' },
    { value: 2, label: 'S1 Sistem Informasi' },
    { value: 3, label: 'S1 Ilmu Komputer' }
  ]);
  
  const { register, handleSubmit, control, reset } = useForm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/spmb/kuota-prodi');
      setData(res.data.data);
    } catch (error) {
      toast.error('Gagal mengambil data kuota.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    // Logic for applying filter
    setIsFilterOpen(false);
    fetchData();
  };

  const onSubmit = async (formData: any) => {
    try {
      await api.post('/spmb/kuota-prodi', {
        tahun_akademik_id: 1, // hardcoded for now
        program_studi_id: formData.program_studi_id,
        kuota_total: formData.kuota_total
      });
      toast.success('Berhasil menyimpan kuota!');
      setIsModalOpen(false);
      reset();
      fetchData();
    } catch (error) {
      toast.error('Gagal menyimpan kuota.');
    }
  };

  const columns = [
    { key: 'tahun_akademik_id', label: 'Tahun Akademik', render: () => '2026/2027' },
    { key: 'program_studi_id', label: 'Program Studi', render: (row: any) => prodiOptions.find(p => p.value === row.program_studi_id)?.label || `Prodi ID: ${row.program_studi_id}` },
    { key: 'kuota_total', label: 'Kuota Total' },
    { key: 'kuota_terisi', label: 'Kuota Terisi', render: (row: any) => (
      <span className={row.kuota_terisi >= row.kuota_total ? 'text-red-600 font-bold' : 'text-green-600'}>
        {row.kuota_terisi}
      </span>
    )},
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Manajemen Kuota Prodi" 
        description="Atur kuota pendaftaran mahasiswa baru untuk tiap program studi."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsFilterOpen(true)}>
              <Filter size={16} className="mr-2" /> Filter
            </Button>
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>Set Kuota Baru</Button>
          </div>
        }
      />

      <DataTable
        data={data}
        loading={loading}
        columns={columns}
      />

      <Drawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title="Filter & Urutkan"
      >
        <div className="space-y-6 p-4">
          <Select 
            label="Program Studi"
            value={filterProdi}
            onChange={(val) => setFilterProdi(val as string)}
            options={[
              { value: '', label: 'Semua Prodi' },
              ...prodiOptions
            ]}
          />

          <hr className="border-t border-slate-200 my-2" />
          
          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Urut Berdasarkan"
              value={filterOrderBy}
              onChange={(val) => setFilterOrderBy(val as string)}
              options={[
                { value: 'id', label: 'ID' },
                { value: 'kuota_total', label: 'Kuota Total' },
                { value: 'kuota_terisi', label: 'Kuota Terisi' }
              ]}
            />
            <Select 
              label="Arah"
              value={filterOrderDir}
              onChange={(val) => setFilterOrderDir(val as string)}
              options={[
                { value: 'asc', label: 'A - Z (Naik)' },
                { value: 'desc', label: 'Z - A (Turun)' }
              ]}
            />
          </div>

          <div className="pt-4 flex justify-end border-t border-slate-100">
            <Button variant="primary" onClick={applyFilters}>Terapkan Filter</Button>
          </div>
        </div>
      </Drawer>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Set Kuota Program Studi"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <Controller
                name="program_studi_id"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Select
                    label="Program Studi"
                    options={prodiOptions}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
            <div className="form-group">
              <Input 
                label="Kuota Total" 
                type="number" 
                min="1"
                {...register('kuota_total', { required: true, valueAsNumber: true })} 
              />
            </div>
          </div>
          
          <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 mt-6">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="submit" variant="primary">Simpan Kuota</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
