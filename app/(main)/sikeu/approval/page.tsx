'use client';

import { formatRupiah, formatDate } from '@/lib/utils';
import { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck, CheckCircle2, XCircle, Clock, Filter, Loader2, Save, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import { pengajuanOperasionalService } from '@/services/pengajuan-operasional.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
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



export default function SikeuApprovalPage() {
  const [data, setData] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter Drawer State — 2-stage
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterOrderBy, setFilterOrderBy] = useState('tanggal');
  const [filterOrderDir, setFilterOrderDir] = useState<'asc' | 'desc'>('desc');
  const [appliedFilters, setAppliedFilters] = useState({ search: '', type: 'all', orderBy: 'tanggal', orderDir: 'desc' as 'asc' | 'desc' });

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
        tanggal: formatDate(t.created_at) || '-',
        keterangan: t.alasan || 'Tagihan khusus semester aktif',
      }));

      const mappedDispensasi: ApprovalItem[] = rawDispensasi.map((d: any) => ({
        id: d.id,
        type: 'dispensasi',
        title: `Permohonan Dispensasi #${d.id} ${d.allow_krs ? '• [Bypass KRS Aktif]' : '• [KRS Terkunci]'}`,
        pemohon: d.nama_mahasiswa || `Mahasiswa #${d.mahasiswa_id}`,
        nominal: d.nominal_per_cicilan || 1500000,
        tanggal: formatDate(d.created_at) || '-',
        keterangan: d.alasan || 'Permohonan penundaan / cicilan tagihan',
      }));

      let mappedKas: ApprovalItem[] = [];
      try {
        const kasRes = await pengajuanOperasionalService.list({ per_page: 50 });
        const kasItems: any[] = Array.isArray(kasRes.data) ? kasRes.data : [];
        mappedKas = kasItems
          .filter((k: any) => ['pending_sarpras', 'pending_keuangan', 'pending_direktur', 'diajukan'].includes(k.status))
          .map((k: any) => ({
            id: k.id,
            type: 'kas' as const,
            title: `${k.nomor_pengajuan} — ${k.judul_pengajuan} [${k.status}]`,
            pemohon: k.fakultas?.nama || `Pengajuan #${k.id}`,
            nominal: Number(k.nominal_diajukan) || 0,
            tanggal: formatDate(k.created_at) || '-',
            keterangan: k.deskripsi || '',
          }));
      } catch {
        mappedKas = [];
      }

      setData([...mappedTagihan, ...mappedDispensasi, ...mappedKas]);
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
      } else if (activeItem.type === 'kas') {
        await pengajuanOperasionalService.approve(activeItem.id, actionType, formData.catatan);
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
    setAppliedFilters({ search: filterSearch, type: filterType, orderBy: filterOrderBy, orderDir: filterOrderDir });
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterType('all');
    setFilterOrderBy('tanggal');
    setFilterOrderDir('desc');
    setAppliedFilters({ search: '', type: 'all', orderBy: 'tanggal', orderDir: 'desc' });
    setShowFilter(false);
  };

  const filteredData = useMemo(() => {
    const list = data.filter((item) => {
      if (appliedFilters.search) {
        const q = appliedFilters.search.toLowerCase();
        if (!item.title?.toLowerCase().includes(q) && !item.pemohon?.toLowerCase().includes(q) && !item.keterangan?.toLowerCase().includes(q)) return false;
      }
      if (appliedFilters.type !== 'all' && item.type !== appliedFilters.type) return false;
      return true;
    });

    return [...list].sort((a, b) => {
      let valA: any = a[appliedFilters.orderBy as keyof ApprovalItem] ?? '';
      let valB: any = b[appliedFilters.orderBy as keyof ApprovalItem] ?? '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return appliedFilters.orderDir === 'asc' ? -1 : 1;
      if (valA > valB) return appliedFilters.orderDir === 'asc' ? 1 : -1;
      return 0;
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
        <div className="flex items-center justify-end">
          <DropdownMenu
            items={[
              {
                label: 'Setujui Pengajuan',
                icon: <CheckCircle2 size={14} className="text-emerald-600" />,
                onClick: () => handleOpenAction(row, 'approve'),
              },
              {
                label: 'Tolak Pengajuan',
                icon: <XCircle size={14} className="text-rose-600" />,
                variant: 'danger',
                onClick: () => handleOpenAction(row, 'reject'),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="w-full space-y-6 animate-fade-in">
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

          <hr className="border-t border-slate-200 my-2" />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={filterOrderBy}
              onChange={(val) => setFilterOrderBy(val as string)}
              options={[
                { value: 'tanggal', label: 'Tanggal' },
                { value: 'title', label: 'Judul Pengajuan' },
                { value: 'pemohon', label: 'Pemohon' },
                { value: 'nominal', label: 'Nominal' },
                { value: 'type', label: 'Kategori' },
              ]}
            />
            <Select
              label="Arah"
              value={filterOrderDir}
              onChange={(val) => setFilterOrderDir(val as 'asc' | 'desc')}
              options={[
                { value: 'asc', label: 'A - Z (Naik)' },
                { value: 'desc', label: 'Z - A (Turun)' },
              ]}
            />
          </div>
        </div>
      </Drawer>
    </div>
  );
}
