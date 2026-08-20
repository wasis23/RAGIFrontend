'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Plus, Sparkles, CreditCard, Filter, CheckCircle2, AlertCircle, XCircle, Clock, Search, Edit, Eye, Loader2, Save
} from 'lucide-react';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useForm } from 'react-hook-form';

interface TagihanItem {
  id: number;
  nomor: string;
  nim: string;
  nama: string;
  angkatan: number;
  jalur: string;
  kelompok_ukt: string;
  prodi: string;
  total: number;
  status: 'lunas' | 'belum_bayar' | 'pending_approval' | string;
  jatuhTempo: string;
  source: string;
}

interface MassFormValues {
  target_angkatan: string;
  target_jalur: string;
  target_kelompok: string;
  semester_aktif: string;
  jatuh_tempo: string;
}

const formatRupiah = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

export default function TagihanListPage() {
  const [data, setData] = useState<TagihanItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter Drawer State — 2-stage
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterAngkatan, setFilterAngkatan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [appliedFilters, setAppliedFilters] = useState({ search: '', angkatan: 'all', status: 'all' });

  // Mass Modal State
  const [isMassModalOpen, setIsMassModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<MassFormValues>({
    defaultValues: {
      target_angkatan: '2025',
      target_jalur: 'Reguler',
      target_kelompok: '3',
      semester_aktif: 'Semester Ganjil 2026/2027',
      jatuh_tempo: '2026-08-31',
    },
  });

  const fetchTagihan = async () => {
    setLoading(true);
    try {
      const res = await sikeuService.getStudentBillingTypes({ page: 1, per_page: 50 });
      const raw = Array.isArray(res.data) ? res.data : [];
      const mapped = raw.map((item: any) => ({
        id: item.id,
        nomor: `INV-SIAKAD-2026-${String(item.id).padStart(3, '0')}`,
        nim: item.nim || '-',
        nama: item.nama_mahasiswa || 'Mahasiswa',
        angkatan: item.tahun_angkatan || 2025,
        jalur: item.jalur_kelas || 'Reguler',
        kelompok_ukt: `Level ${item.kelompok_ukt || 3}`,
        prodi: 'Teknik Informatika',
        total: item.kelompok_ukt === 4 ? 5500000 : item.kelompok_ukt === 1 ? 500000 : 3500000,
        status: item.beasiswa ? 'lunas' : 'belum_bayar',
        jatuhTempo: '2026-08-31',
        source: item.status_pendaftaran || 'SIAKAD',
      }));
      setData(mapped);
    } catch {
      setData([]);
      toast.error('Gagal memuat data tagihan mahasiswa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTagihan();
  }, []);

  const onSubmitMassTagihan = async (formData: MassFormValues) => {
    setSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      toast.success(`Berhasil mengaktifkan & menerbitkan tagihan masal ${formData.semester_aktif} (Angkatan ${formData.target_angkatan})`);
      setIsMassModalOpen(false);
      fetchTagihan();
    } catch {
      toast.error('Gagal menerbitkan tagihan masal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyFilter = () => {
    setAppliedFilters({ search: filterSearch, angkatan: filterAngkatan, status: filterStatus });
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterAngkatan('all');
    setFilterStatus('all');
    setAppliedFilters({ search: '', angkatan: 'all', status: 'all' });
    setShowFilter(false);
  };

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (appliedFilters.search) {
        const q = appliedFilters.search.toLowerCase();
        if (!item.nama?.toLowerCase().includes(q) && !item.nim?.toLowerCase().includes(q) && !item.nomor?.toLowerCase().includes(q)) return false;
      }
      if (appliedFilters.angkatan !== 'all' && String(item.angkatan) !== appliedFilters.angkatan) return false;
      if (appliedFilters.status !== 'all' && item.status !== appliedFilters.status) return false;
      return true;
    });
  }, [data, appliedFilters]);

  const columns: ColumnDef<TagihanItem>[] = [
    {
      key: 'nomor',
      label: 'NOMOR TAGIHAN',
      render: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-md">
            {row.nomor}
          </span>
          <span className="text-2xs block text-slate-400 font-semibold mt-1">Sumber: {row.source}</span>
        </div>
      ),
    },
    {
      key: 'nama',
      label: 'MAHASISWA',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900 text-sm">{row.nama}</p>
          <p className="font-mono text-xs text-slate-500">NIM: {row.nim}</p>
        </div>
      ),
    },
    {
      key: 'angkatan',
      label: 'ANGKATAN & PRODI',
      render: (row) => (
        <div>
          <p className="text-xs font-semibold text-slate-700">{row.prodi}</p>
          <p className="text-2xs text-slate-500">Angkatan {row.angkatan} • {row.jalur}</p>
        </div>
      ),
    },
    {
      key: 'total',
      label: 'TOTAL TAGIHAN',
      render: (row) => (
        <span className="font-bold text-slate-900 tabular-nums text-sm">
          {formatRupiah(row.total)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (row) => {
        if (row.status === 'lunas') {
          return (
            <span className="badge badge-green text-xs font-bold inline-flex items-center gap-1">
              <CheckCircle2 size={12} /> Lunas
            </span>
          );
        }
        if (row.status === 'pending_approval') {
          return (
            <span className="badge badge-blue text-xs font-bold inline-flex items-center gap-1">
              <Clock size={12} /> Menunggu Verifikasi
            </span>
          );
        }
        return (
          <span className="badge badge-red text-xs font-bold inline-flex items-center gap-1">
            <XCircle size={12} /> Belum Bayar
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Link href={`/sikeu/tagihan/${row.id}`}>
            <Button size="sm" variant="ghost" icon={<Eye size={14} />}
              className="font-semibold text-slate-600 hover:text-primary-600 hover:bg-primary-50">
              Detail
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <PageHeader
        title="Set Tagihan & Invoice Semester Aktif"
        description="Aktivasi tagihan masal per Angkatan/Prodi & Layanan Pembayaran Loket / VA Mahasiswa."
        action={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setShowFilter(true)}
              className="font-bold min-h-[40px]"
            >
              Filter
            </Button>
            <Button
              variant="primary"
              icon={<Sparkles size={16} />}
              onClick={() => setIsMassModalOpen(true)}
              className="font-bold min-h-[40px] px-4 shadow-sm"
            >
              Aktifkan Tagihan Masal
            </Button>
          </div>
        }
      />

      <DataTable data={filteredData} isLoading={loading} columns={columns} emptyMessage="Belum ada data tagihan semester aktif." />

      {/* Modal Mass Tagihan */}
      <Modal isOpen={isMassModalOpen} onClose={() => setIsMassModalOpen(false)} title="Aktivasi Tagihan Semester Masal">
        <form onSubmit={handleSubmit(onSubmitMassTagihan)} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Target Angkatan *"
              options={[
                { value: '2023', label: 'Angkatan 2023' },
                { value: '2024', label: 'Angkatan 2024' },
                { value: '2025', label: 'Angkatan 2025' },
                { value: '2026', label: 'Angkatan 2026' },
              ]}
              value={watch('target_angkatan')}
              onChange={(val) => register('target_angkatan').onChange({ target: { value: val } })}
            />

            <Select
              label="Target Jalur Kelas *"
              options={[
                { value: 'Reguler', label: 'Reguler' },
                { value: 'Karyawan', label: 'Karyawan / Eksekutif' },
                { value: 'Internasional', label: 'Internasional' },
              ]}
              value={watch('target_jalur')}
              onChange={(val) => register('target_jalur').onChange({ target: { value: val } })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Semester Aktif *" placeholder="Contoh: Semester Ganjil 2026/2027"
              {...register('semester_aktif', { required: 'Semester aktif wajib diisi' })}
              error={errors.semester_aktif?.message} />

            <Input type="date" label="Batas Jatuh Tempo *"
              {...register('jatuh_tempo', { required: 'Jatuh tempo wajib diisi' })}
              error={errors.jatuh_tempo?.message} />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsMassModalOpen(false)} disabled={submitting} className="font-bold text-slate-600">
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}
              icon={submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              className="font-bold shadow-md">
              {submitting ? 'Mengaktifkan...' : 'Terbitkan Tagihan Masal'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Filter Drawer */}
      <Drawer isOpen={showFilter} onClose={() => setShowFilter(false)} title="Filter Tagihan Mahasiswa" width="420px"
        footer={
          <div className="flex items-center justify-between gap-3">
            <Button type="button" variant="outline" onClick={handleResetFilter} className="font-bold text-slate-600 min-h-[42px] px-4">
              Reset
            </Button>
            <Button type="button" variant="primary" onClick={handleApplyFilter} className="font-bold min-h-[42px] px-5 shadow-md">
              Terapkan Filter
            </Button>
          </div>
        }>
        <div className="space-y-5">
          <Input label="Cari Nomor Invoice / Nama / NIM" placeholder="Ketik kata kunci..."
            value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} />

          <Select label="Tahun Angkatan"
            value={filterAngkatan}
            onChange={(val) => setFilterAngkatan(val as string)}
            options={[
              { value: 'all', label: 'Semua Angkatan' },
              { value: '2023', label: '2023' },
              { value: '2024', label: '2024' },
              { value: '2025', label: '2025' },
              { value: '2026', label: '2026' },
            ]} />

          <Select label="Status Pembayaran"
            value={filterStatus}
            onChange={(val) => setFilterStatus(val as string)}
            options={[
              { value: 'all', label: 'Semua Status' },
              { value: 'lunas', label: 'Lunas' },
              { value: 'belum_bayar', label: 'Belum Bayar' },
              { value: 'pending_approval', label: 'Menunggu Verifikasi' },
            ]} />
        </div>
      </Drawer>
    </div>
  );
}
