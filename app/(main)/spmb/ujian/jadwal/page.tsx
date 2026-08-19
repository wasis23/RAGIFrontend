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

import Link from 'next/link';

export default function JadwalUjianPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [filterGelombang, setFilterGelombang] = useState('');
  const [filterOrderBy, setFilterOrderBy] = useState('tanggal');
  const [filterOrderDir, setFilterOrderDir] = useState('desc');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/spmb/jadwal-ujian');
      setData(res.data.data);
    } catch (error) {
      toast.error('Gagal mengambil data jadwal.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    setIsFilterOpen(false);
    fetchData();
  };

  const columns = [
    { key: 'nama_sesi', label: 'Nama Sesi' },
    { key: 'gelombang_penerimaan', label: 'Gelombang', render: (row: any) => row.gelombang_penerimaan?.nama },
    { key: 'tipe_ujian', label: 'Tipe Ujian', render: (row: any) => <span className="capitalize">{row.tipe_ujian}</span> },
    { key: 'tanggal', label: 'Tanggal Ujian' },
    { key: 'waktu', label: 'Waktu', render: (row: any) => `${row.jam_mulai} - ${row.jam_selesai}` },
    { key: 'kapasitas', label: 'Kapasitas' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Jadwal Ujian / CBT" 
        description="Kelola jadwal ujian dan kapasitas ruangan untuk ujian masuk."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsFilterOpen(true)}>
              <Filter size={16} className="mr-2" /> Filter
            </Button>
            <Link href="/spmb/ujian/jadwal/create" className="btn btn-primary">
              Buat Jadwal Ujian
            </Link>
          </div>
        }
      />

      <DataTable
        data={data}
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
                { value: 'tanggal', label: 'Tanggal Ujian' }
              ]}
            />
            <Select 
              label="Arah"
              value={filterOrderDir}
              onChange={(val) => setFilterOrderDir(val as string)}
              options={[
                { value: 'asc', label: 'Lama ke Baru' },
                { value: 'desc', label: 'Baru ke Lama' }
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
