'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Drawer } from '@/components/ui/Drawer';
import { Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';

export default function DaftarUlangPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [filterStatus, setFilterStatus] = useState('');
  const [filterOrderBy, setFilterOrderBy] = useState('id');
  const [filterOrderDir, setFilterOrderDir] = useState('desc');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/spmb/pendaftar?status=lulus');
      setData(res.data.data.data); // Adjust according to your pagination structure
    } catch (error) {
      toast.error('Gagal mengambil data daftar ulang.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    setIsFilterOpen(false);
    fetchData();
  };

  const handleGenerateTagihan = async (pendaftaranId: number) => {
    try {
      await api.post(`/spmb/daftar-ulang/${pendaftaranId}/generate-tagihan`);
      toast.success('Tagihan berhasil digenerate.');
      fetchData();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Gagal generate tagihan');
    }
  };

  const handleKonfirmasi = async (pendaftaranId: number) => {
    try {
      await api.post(`/spmb/daftar-ulang/${pendaftaranId}/konfirmasi`);
      toast.success('Daftar ulang berhasil dikonfirmasi. Mahasiswa dikonversi ke SIAKAD.');
      fetchData();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Gagal konfirmasi daftar ulang');
    }
  };

  const columns = [
    { key: 'no_pendaftaran', label: 'No Pendaftaran' },
    { key: 'nama_lengkap', label: 'Nama Lengkap' },
    { 
      key: 'status_daftar_ulang', 
      label: 'Status Daftar Ulang',
      render: (row: any) => {
        const status = row.hasil_seleksi?.status_daftar_ulang || 'belum';
        const color = status === 'lunas' ? 'text-green-600 font-medium' : 
                     status === 'menunggu_pembayaran' ? 'text-yellow-600 font-medium' : 'text-slate-500';
        return <span className={`capitalize ${color}`}>{status.replace('_', ' ')}</span>;
      }
    },
    { 
      key: 'aksi', 
      label: 'Aksi',
      render: (row: any) => {
        const status = row.hasil_seleksi?.status_daftar_ulang || 'belum';
        return (
          <div className="flex items-center gap-2">
            {status === 'belum' && (
              <Button size="sm" variant="outline" onClick={() => handleGenerateTagihan(row.id)}>
                Generate Tagihan
              </Button>
            )}
            {status === 'menunggu_pembayaran' && (
              <Button size="sm" variant="primary" onClick={() => handleKonfirmasi(row.id)}>
                Konfirmasi Pembayaran
              </Button>
            )}
            {status === 'lunas' && (
              <span className="text-sm text-green-600 font-bold">Selesai</span>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Daftar Ulang Mahasiswa" 
        description="Kelola tagihan dan konfirmasi daftar ulang calon mahasiswa yang telah lulus."
        action={
          <Button variant="outline" onClick={() => setIsFilterOpen(true)}>
            <Filter size={16} className="mr-2" /> Filter
          </Button>
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
            label="Status Daftar Ulang"
            value={filterStatus}
            onChange={(val) => setFilterStatus(val as string)}
            options={[
              { value: '', label: 'Semua Status' },
              { value: 'belum', label: 'Belum Tagihan' },
              { value: 'menunggu_pembayaran', label: 'Menunggu Pembayaran' },
              { value: 'lunas', label: 'Lunas / Selesai' }
            ]}
          />

          <hr style={{ borderTop: '1px solid var(--border-light)', margin: '0.5rem 0' }} />
          
          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Urut Berdasarkan"
              value={filterOrderBy}
              onChange={(val) => setFilterOrderBy(val as string)}
              options={[
                { value: 'id', label: 'ID' },
                { value: 'nama', label: 'Nama Pendaftar' }
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
    </div>
  );
}
