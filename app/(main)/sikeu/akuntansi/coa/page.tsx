'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, ArrowLeft, BookOpen, CheckCircle, Filter, Search, Eye } from 'lucide-react';
import { sikeuService } from '@/services/sikeu.service';
import { AkunKeuangan } from '@/types/sikeu.types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import toast from 'react-hot-toast';

export default function CoaPage() {
  const [coaList, setCoaList] = useState<AkunKeuangan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Filter Drawer State (table-filter-ui-standard)
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterKelompok, setFilterKelompok] = useState('all');
  const [appliedFilters, setAppliedFilters] = useState({ search: '', kelompok: 'all' });

  // Form states <= 5 inputs (use Modal 2-column grid per crud-ui-standard)
  const [formData, setFormData] = useState({
    kode_akun: '',
    nama_akun: '',
    kelompok: 'aset',
    saldo_normal: 'debet',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadCoa = async () => {
    setLoading(true);
    try {
      const res = await sikeuService.getCoaList();
      if (res.data) {
        setCoaList(res.data);
      }
    } catch (err) {
      console.error('Failed to load COA', err);
      toast.error('Gagal memuat Chart of Accounts (COA)');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoa();
  }, []);

  const handleCreateCoa = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await sikeuService.storeCoa(formData);
      toast.success('Akun COA baru berhasil dibuat');
      setShowModal(false);
      setFormData({ kode_akun: '', nama_akun: '', kelompok: 'aset', saldo_normal: 'debet' });
      await loadCoa();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Gagal membuat akun COA');
      toast.error('Gagal membuat akun COA');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyFilter = () => {
    setAppliedFilters({ search: filterSearch, kelompok: filterKelompok });
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterKelompok('all');
    setAppliedFilters({ search: '', kelompok: 'all' });
    setShowFilter(false);
  };

  const filteredData = useMemo(() => {
    return coaList.filter((item) => {
      if (appliedFilters.search) {
        const q = appliedFilters.search.toLowerCase();
        const matchKode = item.kode_akun?.toLowerCase().includes(q);
        const matchNama = item.nama_akun?.toLowerCase().includes(q);
        if (!matchKode && !matchNama) return false;
      }
      if (appliedFilters.kelompok !== 'all' && item.kelompok?.toLowerCase() !== appliedFilters.kelompok) {
        return false;
      }
      return true;
    });
  }, [coaList, appliedFilters]);

  const columns: ColumnDef<AkunKeuangan>[] = [
    {
      key: 'kode_akun',
      label: 'KODE AKUN',
      render: (row) => (
        <span className="font-mono font-bold text-xs text-primary-700 bg-primary-50 px-2 py-1 rounded-md border border-primary-100">
          {row.kode_akun}
        </span>
      ),
    },
    {
      key: 'nama_akun',
      label: 'NAMA AKUN KEUANGAN',
      render: (row) => (
        <span className="font-bold text-slate-900 text-sm">{row.nama_akun}</span>
      ),
    },
    {
      key: 'kelompok',
      label: 'KELOMPOK',
      render: (row) => {
        const k = row.kelompok?.toLowerCase();
        const variant =
          k === 'aset' ? 'green' :
          k === 'liabilitas' ? 'red' :
          k === 'ekuitas' ? 'purple' :
          k === 'pendapatan' ? 'blue' : 'yellow';
        return (
          <Badge variant={variant as any} className="uppercase text-xs font-semibold">
            {row.kelompok}
          </Badge>
        );
      },
    },
    {
      key: 'saldo_normal',
      label: 'SALDO NORMAL',
      render: (row) => (
        <span className="font-semibold text-xs text-slate-700 uppercase">
          {row.saldo_normal}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      align: 'center',
      render: () => (
        <Badge variant="green" className="inline-flex items-center gap-1">
          <CheckCircle size={12} /> Aktif
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. PageHeader dengan Breadcrumbs & Action Button */}
      <PageHeader
        title="Chart of Accounts (COA / Master Akun)"
        description="Master pengkodean akun akuntansi (Aset, Liabilitas, Ekuitas, Pendapatan, & Beban)"
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'Modul SIKEU', href: '/sikeu' },
          { label: 'Master Akuntansi', href: '/sikeu/akuntansi' },
          { label: 'COA' },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Link href="/sikeu/akuntansi">
              <Button variant="outline" icon={<ArrowLeft size={16} />}>
                Kembali
              </Button>
            </Link>
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setShowFilter(true)}
            >
              Filter
            </Button>
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => setShowModal(true)}
            >
              Tambah Akun COA
            </Button>
          </div>
        }
      />

      {/* 2. Full-Bleed DataTable Card */}
      <DataTable
        columns={columns}
        data={filteredData}
        isLoading={loading}
        emptyMessage="Belum ada akun COA yang sesuai filter."
      />

      {/* 3. Slide-out Drawer Filter di Sisi Kanan */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Akun COA"
        width="420px"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button variant="outline" onClick={handleResetFilter}>
              Reset
            </Button>
            <Button variant="primary" onClick={handleApplyFilter}>
              Terapkan Filter
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-5">
          <Input
            label="Pencarian Cepat"
            placeholder="Cari kode atau nama akun COA..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />

          <Select
            label="Kelompok Akun"
            options={[
              { value: 'all', label: 'Semua Kelompok' },
              { value: 'aset', label: 'Aset' },
              { value: 'liabilitas', label: 'Liabilitas' },
              { value: 'ekuitas', label: 'Ekuitas' },
              { value: 'pendapatan', label: 'Pendapatan' },
              { value: 'beban', label: 'Beban' },
            ]}
            value={filterKelompok}
            onChange={(val) => setFilterKelompok(val)}
          />
        </div>
      </Drawer>

      {/* Modal <= 5 Input Grid 2-Column (per crud-ui-standard) */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Tambah Akun COA Baru"
        size="md"
      >
        {error && <div className="p-3 mb-4 bg-rose-50 text-rose-700 text-xs rounded-lg">{error}</div>}

        <form onSubmit={handleCreateCoa} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Kode Akun *"
              placeholder="Contoh: 101.03"
              value={formData.kode_akun}
              onChange={(e) => setFormData({ ...formData, kode_akun: e.target.value })}
              required
            />

            <Input
              label="Nama Akun *"
              placeholder="Kas Kecil Fakultas"
              value={formData.nama_akun}
              onChange={(e) => setFormData({ ...formData, nama_akun: e.target.value })}
              required
            />

            <Select
              label="Kelompok Akun *"
              options={[
                { value: 'aset', label: 'Aset (100)' },
                { value: 'liabilitas', label: 'Liabilitas (200)' },
                { value: 'ekuitas', label: 'Ekuitas (300)' },
                { value: 'pendapatan', label: 'Pendapatan (400)' },
                { value: 'beban', label: 'Beban (500)' },
              ]}
              value={formData.kelompok}
              onChange={(val) => setFormData({ ...formData, kelompok: val })}
            />

            <Select
              label="Saldo Normal *"
              options={[
                { value: 'debet', label: 'DEBET' },
                { value: 'kredit', label: 'KREDIT' },
              ]}
              value={formData.saldo_normal}
              onChange={(val) => setFormData({ ...formData, saldo_normal: val })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowModal(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={submitting}
            >
              Simpan Akun COA
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
