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
    { key: 'id', label: 'No', render: (_, index) => <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{index + 1}</span> },
    { key: 'kode', label: 'Kode', render: (row) => (
      <code style={{ background: 'var(--gray-100)', padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.8125rem', fontWeight: 700 }}>
        {row.kode}
      </code>
    )},
    { key: 'nama', label: 'Nama Jalur', render: (row) => <span style={{ fontWeight: 700 }}>{row.nama}</span> },
    { key: 'tipe', label: 'Tipe', render: (row) => (
      <span style={{ textTransform: 'capitalize' }}>{row.tipe}</span>
    )},
    { key: 'status', label: 'Status', render: (row) => (
      <Badge variant={row.is_active ? 'success' : 'danger'}>
        {row.is_active ? 'Aktif' : 'Tidak Aktif'}
      </Badge>
    )},
    { key: 'created_at', label: 'Tanggal Dibuat', render: (row) => (
      <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
        {formatDate(row.created_at)}
      </span>
    )},
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
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
