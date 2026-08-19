'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Drawer } from '@/components/ui/Drawer';
import { useForm, Controller } from 'react-hook-form';
import { Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';

export default function PesertaUjianPage() {
  const [pendaftarData, setPendaftarData] = useState([]);
  const [jadwalOptions, setJadwalOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedPeserta, setSelectedPeserta] = useState<string[]>([]);
  
  const [filterGelombang, setFilterGelombang] = useState('');
  const [filterOrderBy, setFilterOrderBy] = useState('id');
  const [filterOrderDir, setFilterOrderDir] = useState('desc');

  const { handleSubmit, control, reset } = useForm();

  useEffect(() => {
    fetchPendaftar();
    fetchJadwal();
  }, []);

  const fetchJadwal = async () => {
    try {
      const res = await api.get('/spmb/jadwal-ujian');
      setJadwalOptions(res.data.data.map((j: any) => ({
        value: j.id,
        label: `${j.nama_sesi} - ${j.tanggal} (${j.jam_mulai})`
      })));
    } catch (e) {
      toast.error('Gagal mengambil data jadwal');
    }
  };

  const fetchPendaftar = async () => {
    setLoading(true);
    try {
      // Get pendaftar who are verified
      const res = await api.get('/spmb/pendaftar?status=lulus_administrasi');
      setPendaftarData(res.data.data.data);
    } catch (error) {
      toast.error('Gagal mengambil data pendaftar.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    setIsFilterOpen(false);
    fetchPendaftar();
  };

  const onSubmitAssign = async (formData: any) => {
    if (selectedPeserta.length === 0) {
      toast.error('Pilih minimal satu peserta');
      return;
    }

    try {
      await api.post(`/spmb/jadwal-ujian/${formData.jadwal_id}/assign-peserta`, {
        pendaftaran_ids: selectedPeserta
      });
      toast.success('Berhasil menugaskan peserta ke jadwal!');
      setIsModalOpen(false);
      reset();
      setSelectedPeserta([]);
      fetchPendaftar();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menugaskan peserta.');
    }
  };

  const columns = [
    { 
      key: 'checkbox', 
      label: 'Pilih', 
      render: (row: any) => (
        <input 
          type="checkbox" 
          checked={selectedPeserta.includes(row.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedPeserta([...selectedPeserta, row.id]);
            } else {
              setSelectedPeserta(selectedPeserta.filter(id => id !== row.id));
            }
          }}
          className="w-4 h-4 text-primary rounded border-slate-300"
        />
      )
    },
    { key: 'no_pendaftaran', label: 'No Pendaftaran' },
    { key: 'nama_lengkap', label: 'Nama Lengkap' },
    { key: 'gelombang', label: 'Gelombang', render: (row: any) => row.gelombang_penerimaan?.nama },
    { key: 'status', label: 'Status' }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Plotting Peserta Ujian" 
        description="Pilih peserta yang telah lulus administrasi untuk ditugaskan ke jadwal ujian/CBT."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsFilterOpen(true)}>
              <Filter size={16} className="mr-2" /> Filter
            </Button>
            <Button 
              onClick={() => setIsModalOpen(true)}
              disabled={selectedPeserta.length === 0}
            >
              Tugaskan ke Jadwal ({selectedPeserta.length})
            </Button>
          </div>
        }
      />

      <DataTable
        data={pendaftarData}
        isLoading={loading}
        columns={columns}
      />

      <Drawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title="Filter & Urutkan"
      >
        <div className="space-y-6 p-4">
          <Select 
            label="Gelombang"
            value={filterGelombang}
            onChange={(val) => setFilterGelombang(val as string)}
            options={[
              { value: '', label: 'Semua Gelombang' }
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
                { value: 'no_pendaftaran', label: 'No Pendaftaran' }
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
        title="Tugaskan Peserta ke Jadwal"
      >
        <form onSubmit={handleSubmit(onSubmitAssign)} className="space-y-4">
          <p className="text-sm text-slate-600 mb-4">
            Anda akan menugaskan <strong>{selectedPeserta.length}</strong> peserta ujian ke jadwal berikut.
          </p>

          <div className="grid grid-cols-1 gap-4">
            <div className="form-group">
              <Controller
                name="jadwal_id"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Select
                    label="Pilih Jadwal / Sesi Ujian"
                    options={jadwalOptions}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 mt-6">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="submit" variant="primary">Konfirmasi</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
