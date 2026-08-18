'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { spmbService, type JalurMasuk } from '@/services/spmb.service';

export default function JalurMasukPage() {
  const [data, setData] = useState<JalurMasuk[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await spmbService.getJalurMasuk();
      const items = res.data?.items || res.data || res;
      setData(Array.isArray(items) ? items : []);
    } catch {
      toast.error('Gagal memuat data Jalur Masuk. Periksa koneksi ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const columns: ColumnDef<JalurMasuk>[] = [
    { key: 'id', label: 'No', render: (_, index) => <span className="font-bold text-slate-400">{index + 1}</span> },
    { key: 'kode', label: 'Kode', render: (row) => (
      <code className="bg-slate-100 px-2 py-0.5 rounded text-[0.8125rem] font-bold">
        {row.kode}
      </code>
    )},
    { key: 'nama', label: 'Nama Jalur', render: (row) => <span className="font-bold">{row.nama}</span> },
    { key: 'tipe', label: 'Tipe', render: (row) => (
      <span className="capitalize">{row.tipe}</span>
    )},
    { key: 'status', label: 'Status', render: (row) => (
      <Badge variant={row.is_active ? 'success' : 'danger'}>
        {row.is_active ? 'Aktif' : 'Tidak Aktif'}
      </Badge>
    )},
    { key: 'created_at', label: 'Tanggal Dibuat', render: (row) => (
      <span className="text-[0.8125rem] text-slate-400">
        {formatDate(row.created_at)}
      </span>
    )},
  ];

  return (
    <div className="animate-fade-in flex flex-col gap-7">
      <PageHeader
        title="Master Jalur Masuk"
        description="Kelola data jalur masuk penerimaan mahasiswa baru SPMB"
      />

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
      />
    </div>
  );
}
