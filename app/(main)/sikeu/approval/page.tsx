'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck, CheckCircle2, XCircle, Clock, Filter, Loader2, Save, Eye
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
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { useForm } from 'react-hook-form';

interface ApprovalItem {
  id: number;
  type: 'dispensasi' | 'tagihan' | 'kas';
  title: string;
  pemohon: string;
  nominal: number;
  tanggal: string;
  keterangan: string;
}

interface DecisionFormValues {
  catatan: string;
}

const formatRupiah = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

export default function SikeuApprovalPage() {
  const [data, setData] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter Drawer State — 2-stage
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [appliedFilters, setAppliedFilters] = useState({ search: '', type: 'all' });

  // Action Modal State
  const [activeItem, setActiveItem] = useState<ApprovalItem | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<DecisionFormValues>({
    defaultValues: { catatan: '' },
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await sikeuService.getPendingApprovals();
      const rawTagihan = res.data?.tagihan_pending || [];
      const rawDispensasi = res.data?.dispensasi_pending || [];

      const mappedTagihan: ApprovalItem[] = rawTagihan.map((t: any) => ({
        id: t.id,
        type: 'tagihan',
        title: `Penerbitan Invoice Tagihan #${t.id}`,
        pemohon: t.nim ? `Mahasiswa NIM ${t.nim}` : 'SIAKAD',
        nominal: t.total_tagihan || 3500000,
        tanggal: t.created_at || '2026-08-01',
        keterangan: t.alasan || 'Tagihan khusus semester aktif',
      }));

      const mappedDispensasi: ApprovalItem[] = rawDispensasi.map((d: any) => ({
        id: d.id,
        type: 'dispensasi',
        title: `Permohonan Dispensasi #${d.id}`,
        pemohon: d.nama_mahasiswa || `Mahasiswa #${d.mahasiswa_id}`,
        nominal: d.nominal_per_cicilan || 1500000,
        tanggal: d.created_at || '2026-08-01',
        keterangan: d.alasan || 'Permohonan penundaan / cicilan tagihan',
      }));

      setData([...mappedTagihan, ...mappedDispensasi]);
    } catch {
      setData([]);
      toast.error('Gagal memuat daftar pengajuan approval');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAction = (item: ApprovalItem, action: 'approve' | 'reject') => {
    setActiveItem(item);
    setActionType(action);
    reset({ catatan: '' });
  };

  const onSubmitDecision = async (formData: DecisionFormValues) => {
    if (!activeItem) return;
    setSubmitting(true);
    try {
      if (activeItem.type === 'dispensasi') {
        if (actionType === 'approve') {
          await sikeuService.approveDispensasi(activeItem.id, formData.catatan);
        } else {
          await sikeuService.rejectDispensasi(activeItem.id, formData.catatan);
        }
      } else {
        if (actionType === 'approve') {
          await sikeuService.approveTagihan(activeItem.id, formData.catatan);
        } else {
          await sikeuService.rejectTagihan(activeItem.id, formData.catatan);
        }
      }

      toast.success(
        `Pengajuan "${activeItem.title}" berhasil di-${actionType === 'approve' ? 'setujui' : 'tolak'}`
      );
      setActiveItem(null);
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal memproses keputusan approval');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyFilter = () => {
    setAppliedFilters({ search: filterSearch, type: filterType });
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterType('all');
    setAppliedFilters({ search: '', type: 'all' });
    setShowFilter(false);
  };

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (appliedFilters.search) {
        const q = appliedFilters.search.toLowerCase();
        if (!item.title?.toLowerCase().includes(q) && !item.pemohon?.toLowerCase().includes(q) && !item.keterangan?.toLowerCase().includes(q)) return false;
      }
      if (appliedFilters.type !== 'all' && item.type !== appliedFilters.type) return false;
      return true;
    });
  }, [data, appliedFilters]);

  const columns: ColumnDef<ApprovalItem>[] = [
    {
      key: 'title',
      label: 'PENGAJUAN & KETERANGAN',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900 text-sm">{row.title}</p>
          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{row.keterangan}</p>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'KATEGORI',
      render: (row) => (
        <span className="badge badge-purple text-xs font-bold uppercase">{row.type}</span>
      ),
    },
    {
      key: 'pemohon',
      label: 'PEMOHON',
      render: (row) => (
        <span className="font-semibold text-slate-700 text-xs">{row.pemohon}</span>
      ),
    },
    {
      key: 'nominal',
      label: 'NOMINAL',
      render: (row) => (
        <span className="font-bold text-slate-900 tabular-nums text-sm">
          {formatRupiah(row.nominal || 0)}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'KEPUTUSAN PIMPINAN',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleOpenAction(row, 'approve')}
            icon={<CheckCircle2 size={14} className="text-emerald-600" />}
            className="font-bold text-emerald-700 hover:bg-emerald-50"
          >
            Setujui
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleOpenAction(row, 'reject')}
            icon={<XCircle size={14} className="text-rose-600" />}
            className="font-bold text-rose-700 hover:bg-rose-50"
          >
            Tolak
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <PageHeader
        title="Portal Persetujuan Pimpinan (Approval)"
        description="Verifikasi dan persetujuan bertingkat untuk pengajuan kas, dispensasi tagihan, dan pencairan anggaran."
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
          </div>
        }
      />

      <DataTable data={filteredData} isLoading={loading} columns={columns} emptyMessage="Belum ada antrean pengajuan persetujuan." />

      {/* Modal Decision */}
      <Modal isOpen={Boolean(activeItem)} onClose={() => setActiveItem(null)}
        title={actionType === 'approve' ? 'Konfirmasi Persetujuan (Approve)' : 'Konfirmasi Penolakan (Reject)'}>
        <form onSubmit={handleSubmit(onSubmitDecision)} className="space-y-5">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <p className="text-xs font-bold text-slate-900">{activeItem?.title}</p>
            <p className="text-2xs text-slate-500">Pemohon: {activeItem?.pemohon}</p>
            <p className="text-sm font-extrabold text-emerald-700">{formatRupiah(activeItem?.nominal || 0)}</p>
          </div>

          <Textarea label="Catatan Pimpinan (Opsional)" placeholder="Tuliskan alasan atau instruksi tambahan..."
            {...register('catatan')} />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setActiveItem(null)} disabled={submitting} className="font-bold text-slate-600">
              Batal
            </Button>
            <Button type="submit" variant={actionType === 'approve' ? 'primary' : 'outline'} disabled={submitting}
              icon={submitting ? <Loader2 size={18} className="animate-spin" /> : actionType === 'approve' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
              className={`font-bold shadow-md ${actionType === 'reject' ? 'border-rose-300 text-rose-700 hover:bg-rose-50' : ''}`}>
              {submitting ? 'Memproses...' : actionType === 'approve' ? 'Setujui Pengajuan' : 'Tolak Pengajuan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Filter Drawer */}
      <Drawer isOpen={showFilter} onClose={() => setShowFilter(false)} title="Filter Approval" width="420px"
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
          <Input label="Cari Judul / Pemohon / Keterangan" placeholder="Ketik kata kunci..."
            value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} />

          <Select label="Kategori Pengajuan"
            value={filterType}
            onChange={(val) => setFilterType(val as string)}
            options={[
              { value: 'all', label: 'Semua Kategori' },
              { value: 'dispensasi', label: 'Dispensasi Tagihan' },
              { value: 'tagihan', label: 'Penerbitan Invoice Special' },
              { value: 'kas', label: 'Pencairan Kas Operasional' },
            ]} />
        </div>
      </Drawer>
    </div>
  );
}
