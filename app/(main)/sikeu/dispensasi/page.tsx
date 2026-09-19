'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Filter, CheckCircle2, Clock, XCircle, Loader2, Save, Eye, Search, AlertTriangle, Printer, User, ShieldAlert, FileText
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
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { formatRupiah } from '@/lib/utils';

interface DispensasiItem {
  id: number;
  mahasiswa_id: number;
  nama_mahasiswa: string;
  nim: string;
  prodi?: string;
  tipe_dispensasi: string;
  nominal_per_cicilan: number;
  jumlah_cicilan?: number;
  jatuh_tempo_baru: string;
  allow_krs?: boolean;
  status: 'pending' | 'approved' | 'rejected' | string;
  alasan?: string;
  has_unpaid_previous_dispensation?: boolean;
  unpaid_previous_dispensation_count?: number;
  created_at?: string;
  tagihan_id?: number;
  tagihan?: {
    id?: number;
    nomor_tagihan?: string;
    total_tagihan?: number;
    jatuh_tempo?: string;
  };
}

const TIPE_DISPENSASI_OPTIONS = [
  { value: 'penundaan_jatuh_tempo', label: 'Penundaan Tanggal Jatuh Tempo' },
  { value: 'cicilan', label: 'Skema Pembayaran Per-Cicilan' },
  { value: 'keringanan_khusus', label: 'Permohonan Keringanan Khusus' },
];

export default function DispensasiListPage() {
  const router = useRouter();
  const [data, setData] = useState<DispensasiItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter Drawer State — 2-stage
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterOrderBy, setFilterOrderBy] = useState('nama_mahasiswa');
  const [filterOrderDir, setFilterOrderDir] = useState<'asc' | 'desc'>('asc');
  const [appliedFilters, setAppliedFilters] = useState({ search: '', status: 'all', orderBy: 'nama_mahasiswa', orderDir: 'asc' as 'asc' | 'desc' });

  // Detail / Print Modal State
  const [detailItem, setDetailItem] = useState<DispensasiItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Inline Approval/Rejection State
  const [approvalItem, setApprovalItem] = useState<DispensasiItem | null>(null);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [approvalCatatan, setApprovalCatatan] = useState('');
  const [submittingApproval, setSubmittingApproval] = useState(false);

  const handleOpenApproval = (item: DispensasiItem, action: 'approve' | 'reject') => {
    setApprovalItem(item);
    setApprovalAction(action);
    setApprovalCatatan('');
  };

  const handleProcessApproval = async () => {
    if (!approvalItem) return;
    if (approvalAction === 'reject' && !approvalCatatan.trim()) {
      toast.error('Wajib mengisi alasan penolakan dispensasi!');
      return;
    }

    setSubmittingApproval(true);
    try {
      if (approvalAction === 'approve') {
        await sikeuService.approveDispensasi(approvalItem.id, approvalCatatan);
        toast.success('Permohonan dispensasi berhasil disetujui');
      } else {
        await sikeuService.rejectDispensasi(approvalItem.id, approvalCatatan);
        toast.success('Permohonan dispensasi telah ditolak');
      }
      setApprovalItem(null);
      fetchDispensasi();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || 'Gagal memproses keputusan dispensasi');
    } finally {
      setSubmittingApproval(false);
    }
  };

  const fetchDispensasi = async () => {
    try {
      setLoading(true);
      const res = await sikeuService.getDispensasiList();
      const raw = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
      setData(raw);
    } catch {
      setData([]);
      toast.error('Gagal memuat data dispensasi tagihan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDispensasi();
  }, []);



  const handleOpenDetail = (item: DispensasiItem) => {
    setDetailItem(item);
    setIsDetailOpen(true);
  };

  const handleApplyFilter = () => {
    setAppliedFilters({ search: filterSearch, status: filterStatus, orderBy: filterOrderBy, orderDir: filterOrderDir });
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterStatus('all');
    setFilterOrderBy('nama_mahasiswa');
    setFilterOrderDir('asc');
    setAppliedFilters({ search: '', status: 'all', orderBy: 'nama_mahasiswa', orderDir: 'asc' });
    setShowFilter(false);
  };

  const filteredData = useMemo(() => {
    const list = data.filter((item) => {
      if (appliedFilters.search) {
        const q = appliedFilters.search.toLowerCase();
        const matchNama = item.nama_mahasiswa?.toLowerCase().includes(q);
        const matchNim = item.nim?.toLowerCase().includes(q);
        const matchAlasan = item.alasan?.toLowerCase().includes(q);
        const matchTagihan = item.tagihan?.nomor_tagihan?.toLowerCase().includes(q);
        if (!matchNama && !matchNim && !matchAlasan && !matchTagihan) return false;
      }
      if (appliedFilters.status !== 'all' && item.status !== appliedFilters.status) return false;
      return true;
    });

    return [...list].sort((a, b) => {
      let valA: any = a[appliedFilters.orderBy as keyof DispensasiItem] ?? '';
      let valB: any = b[appliedFilters.orderBy as keyof DispensasiItem] ?? '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return appliedFilters.orderDir === 'asc' ? -1 : 1;
      if (valA > valB) return appliedFilters.orderDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, appliedFilters]);

  const columns: ColumnDef<DispensasiItem>[] = [
    {
      key: 'nama_mahasiswa',
      label: 'MAHASISWA',
      render: (row) => (
        <div>
          <div className="flex items-center gap-1.5">
            <p className="font-bold text-slate-900 text-sm">{row.nama_mahasiswa || `Mahasiswa #${row.mahasiswa_id}`}</p>
            {row.has_unpaid_previous_dispensation && (
              <span title="Memiliki riwayat tunggakan dispensasi" className="text-amber-500">
                <ShieldAlert size={15} />
              </span>
            )}
          </div>
          <p className="font-mono text-xs text-slate-500">NIM: {row.nim || '-'}</p>
        </div>
      ),
    },
    {
      key: 'tipe_dispensasi',
      label: 'TIPE DISPENSASI',
      render: (row) => {
        const label = TIPE_DISPENSASI_OPTIONS.find((t) => t.value === row.tipe_dispensasi)?.label || row.tipe_dispensasi;
        return <span className="badge badge-purple text-xs font-semibold">{label}</span>;
      },
    },
    {
      key: 'jatuh_tempo_baru',
      label: 'JATUH TEMPO BARU',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-1 rounded-md">
          {row.jatuh_tempo_baru || '-'}
        </span>
      ),
    },
    {
      key: 'nominal_per_cicilan',
      label: 'NOMINAL CICILAN / DISPENSASI',
      render: (row) => (
        <span className="font-bold text-slate-900 tabular-nums text-sm">
          {formatRupiah(row.nominal_per_cicilan || 0)}
        </span>
      ),
    },
    {
      key: 'allow_krs',
      label: 'BYPASS KRS SIAKAD',
      render: (row) => (
        row.allow_krs ? (
          <span className="badge badge-green text-2xs font-bold inline-flex items-center gap-1">
            <CheckCircle2 size={11} /> Diizinkan
          </span>
        ) : (
          <span className="badge badge-slate text-2xs font-semibold inline-flex items-center gap-1">
            <XCircle size={11} /> Terkunci
          </span>
        )
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (row) => {
        if (row.status === 'approved') {
          return (
            <span className="badge badge-green text-xs font-bold inline-flex items-center gap-1">
              <CheckCircle2 size={12} /> Disetujui
            </span>
          );
        }
        if (row.status === 'rejected') {
          return (
            <span className="badge badge-red text-xs font-bold inline-flex items-center gap-1">
              <XCircle size={12} /> Ditolak
            </span>
          );
        }
        return (
          <span className="badge badge-blue text-xs font-bold inline-flex items-center gap-1">
            <Clock size={12} /> Menunggu Persetujuan
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: 'AKSI',
      align: 'right',
      render: (row) => {
        const menuItems: any[] = [];

        if (row.status === 'pending') {
          menuItems.push(
            {
              label: 'Setujui Permohonan',
              icon: <CheckCircle2 size={14} className="text-emerald-600" />,
              onClick: () => handleOpenApproval(row, 'approve'),
            },
            {
              label: 'Tolak Permohonan',
              icon: <XCircle size={14} className="text-rose-600" />,
              onClick: () => handleOpenApproval(row, 'reject'),
            }
          );
        }

        if (row.status === 'approved') {
          menuItems.push({
            label: 'Lihat & Cetak Surat',
            icon: <Printer size={14} />,
            onClick: () => handleOpenDetail(row),
          });
        }

        menuItems.push({
          label: 'Detail Tagihan Terkait',
          icon: <Eye size={14} />,
          onClick: () => {
            if (row.tagihan?.nomor_tagihan || row.tagihan_id) {
              router.push(`/sikeu/tagihan/${row.tagihan_id || row.id}`);
            } else {
              handleOpenDetail(row);
            }
          },
        });

        return (
          <div className="flex items-center justify-end">
            <DropdownMenu items={menuItems} />
          </div>
        );
      },
    },
  ];

  return (
    <div className="w-full space-y-6 animate-fade-in pb-6">
      <PageHeader
        title="Dispensasi & Keringanan Pembayaran Tagihan"
        description="Kelola permohonan cicilan, penundaan tanggal jatuh tempo, dan validasi riwayat tunggakan mahasiswa."
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
              icon={<Plus size={16} />}
              onClick={() => router.push('/sikeu/dispensasi/create')}
              className="font-bold min-h-[40px] px-4 shadow-sm"
            >
              Pengajuan Dispensasi Baru
            </Button>
          </div>
        }
      />

      <DataTable
        data={filteredData}
        isLoading={loading}
        columns={columns}
        emptyMessage="Belum ada permohonan dispensasi tagihan."
      />

      {/* Modal Detail & Cetak Bukti Resmi */}
      {detailItem && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title="Surat Bukti Dispensasi Tagihan Resmi"
        >
          <div className="space-y-6">
            {detailItem.status !== 'approved' && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5 text-xs text-amber-900 print:hidden">
                <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                <div>
                  <p className="font-bold">Surat Belum Disahkan</p>
                  <p className="text-2xs text-amber-700 mt-0.5">
                    Permohonan ini berstatus <strong>{detailItem.status.toUpperCase()}</strong>. Surat bukti resmi hanya sah dan dapat dicetak setelah disetujui pimpinan.
                  </p>
                </div>
              </div>
            )}

            {/* Printable Document Container */}
            <div className="printable-document print-document p-8 border border-slate-300 rounded-2xl bg-white space-y-5 text-slate-900 leading-relaxed shadow-2xs print:border-none print:shadow-none print:p-0">
              {/* Kop Resmi Surat Kampus */}
              <div className="border-b-4 border-double border-slate-900 pb-3 flex justify-between items-start">
                <div className="space-y-0.5">
                  <h3 className="font-extrabold text-base tracking-wider uppercase text-slate-900">
                    UNIVERSITAS SSO CAMPUS
                  </h3>
                  <h4 className="font-bold text-xs text-slate-700 uppercase">
                    WAKIL REKTOR II BIDANG KEUANGAN & SUMBER DAYA
                  </h4>
                  <p className="text-[10px] text-slate-600">
                    Gedung Rektorat Lt. 2 • Jl. Kampus Terpadu No. 1 • Telp: (021) 789-0123 • Email: keu@campus.ac.id
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-mono font-extrabold text-indigo-950 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded">
                    SURAT KETERANGAN RESMI
                  </div>
                  <div className="text-[10px] font-mono text-slate-600 mt-1">
                    No: {detailItem.id}/UN-SSO/WR2-KEU/DISP/{new Date().getFullYear()}
                  </div>
                </div>
              </div>

              {/* Judul Surat */}
              <div className="text-center space-y-1 py-1">
                <h4 className="font-extrabold text-sm tracking-wide uppercase text-slate-900 underline underline-offset-4">
                  SURAT KETERANGAN DISPENSASI PEMBAYARAN KULIAH
                </h4>
                <p className="text-2xs text-slate-500 font-mono">
                  Tentang Penangguhan & Penyesuaian Kewajiban Keuangan Mahasiswa
                </p>
              </div>

              {/* Paragraf Pembuka */}
              <p className="text-xs text-slate-700 leading-relaxed">
                Yang bertanda tangan di bawah ini, Wakil Rektor II / Bagian Keuangan Universitas SSO Campus, menerangkan bahwa mahasiswa:
              </p>

              {/* Data Mahasiswa */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs grid grid-cols-2 gap-y-2 gap-x-4">
                <div>
                  <span className="text-slate-500 text-2xs block uppercase font-bold">Nama Lengkap Mahasiswa:</span>
                  <span className="font-bold text-slate-900">{detailItem.nama_mahasiswa}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-2xs block uppercase font-bold">Nomor Induk Mahasiswa (NIM):</span>
                  <span className="font-mono font-bold text-slate-900">{detailItem.nim}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-2xs block uppercase font-bold">Program Studi:</span>
                  <span className="font-semibold text-slate-800">{detailItem.prodi || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-2xs block uppercase font-bold">Nomor Tagihan Terkait:</span>
                  <span className="font-mono font-bold text-slate-900">{detailItem.tagihan?.nomor_tagihan || `INV-SIAKAD-${detailItem.id}`}</span>
                </div>
              </div>

              {/* Ketentuan Dispensasi */}
              <div className="space-y-2 text-xs">
                <span className="font-bold text-slate-900 text-xs block">Ketentuan & Skema Dispensasi yang Disetujui:</span>
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200 text-xs">
                  <div className="flex justify-between p-2.5 bg-slate-50/50">
                    <span className="text-slate-600">Tipe / Bentuk Keringanan:</span>
                    <strong className="text-slate-900">{TIPE_DISPENSASI_OPTIONS.find(t => t.value === detailItem.tipe_dispensasi)?.label || detailItem.tipe_dispensasi}</strong>
                  </div>
                  <div className="flex justify-between p-2.5">
                    <span className="text-slate-600">Batas Akhir Pelunasan (Jatuh Tempo Baru):</span>
                    <strong className="font-mono text-rose-700 font-bold">{detailItem.jatuh_tempo_baru}</strong>
                  </div>
                  <div className="flex justify-between p-2.5 bg-slate-50/50">
                    <span className="text-slate-600">Nominal Cicilan / Tangguhan Disetujui:</span>
                    <strong className="font-mono text-emerald-800 font-extrabold">{formatRupiah(detailItem.nominal_per_cicilan)}</strong>
                  </div>
                  <div className="flex justify-between p-2.5">
                    <span className="text-slate-600">Status Akses KRS SIAKAD:</span>
                    <strong className={detailItem.allow_krs ? 'text-emerald-700 font-extrabold' : 'text-slate-600'}>
                      {detailItem.allow_krs ? '✅ DIIZINKAN (BYPASS LOCK SIAKAD AKTIF)' : '❌ TERKUNCI SAMPAI LUNAS'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Klausul Keputusan */}
              <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-950 space-y-1">
                <span className="font-bold block">Klausul Akses Akademik (SIAKAD):</span>
                <p className="text-[11px] leading-relaxed text-emerald-900">
                  {detailItem.allow_krs
                    ? 'Berdasarkan surat keputusan ini, sistem SIAKAD secara otomatis membuka kunci pengisian KRS bagi mahasiswa yang bersangkutan hingga batas jatuh tempo yang telah ditetapkan.'
                    : 'Mahasiswa wajib menyelesaikan kewajiban pembayaran cicilan sebelum sistem SIAKAD membuka akses pengisian KRS.'}
                </p>
              </div>

              {/* Alasan */}
              <div className="space-y-1 text-xs">
                <span className="font-bold text-slate-700 uppercase text-2xs">Alasan Permohonan:</span>
                <p className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 leading-relaxed italic text-[11px]">
                  &ldquo;{detailItem.alasan || 'Permohonan penyesuaian jatuh tempo perkuliahan.'}&rdquo;
                </p>
              </div>

              {/* Digital Signature & Footer */}
              <div className="pt-4 border-t-2 border-slate-200 flex justify-between items-end text-xs">
                <div className="space-y-1 text-2xs text-slate-500 font-mono">
                  <p>Dokumen ini sah dan diterbitkan secara elektronik oleh SIKEU.</p>
                  <p>VALIDITY HASH: #{detailItem.id}-VERIFIED-WR2</p>
                  <p>Dicetak pada: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <div className="text-right space-y-1 shrink-0">
                  <p className="text-2xs text-slate-500">Jakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <p className="font-bold text-slate-900 text-xs">Wakil Rektor II / Bagian Keuangan</p>
                  <div className="h-12 flex items-center justify-end">
                    <span className="font-mono text-2xs text-emerald-800 font-bold border border-emerald-300 bg-emerald-50 px-2.5 py-1 rounded shadow-2xs">
                      [DIGITALLY SIGNED & VERIFIED]
                    </span>
                  </div>
                  <p className="font-bold text-slate-800 text-2xs underline">Bagian Keuangan & Administrasi Tagihan</p>
                  <p className="text-2xs text-slate-500 font-mono">Direktorat Keuangan Kampus</p>
                </div>
              </div>
            </div>

            {/* Action Buttons in Modal Footer */}
            <div className="flex items-center justify-end gap-3 pt-2 print:hidden">
              <Button
                variant="outline"
                icon={<Printer size={15} />}
                onClick={() => window.print()}
                disabled={detailItem.status !== 'approved'}
                className="font-bold"
              >
                Cetak Bukti Dispensasi (PDF)
              </Button>
              <Button
                variant="ghost"
                onClick={() => setIsDetailOpen(false)}
                className="font-bold text-slate-600"
              >
                Tutup
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Keputusan Inline Approval / Rejection */}
      {approvalItem && (
        <Modal
          isOpen={!!approvalItem}
          onClose={() => setApprovalItem(null)}
          title={approvalAction === 'approve' ? 'Persetujuan Dispensasi Tagihan' : 'Penolakan Dispensasi Tagihan'}
        >
          <div className="space-y-4">
            <div className={`p-4 rounded-xl text-xs space-y-1 ${approvalAction === 'approve' ? 'bg-emerald-50 text-emerald-950 border border-emerald-200' : 'bg-rose-50 text-rose-950 border border-rose-200'}`}>
              <p className="font-bold">
                {approvalAction === 'approve'
                  ? `Setujui dispensasi tagihan untuk ${approvalItem.nama_mahasiswa} (NIM: ${approvalItem.nim || '-'})?`
                  : `Tolak permohonan dispensasi untuk ${approvalItem.nama_mahasiswa} (NIM: ${approvalItem.nim || '-'})?`}
              </p>
              <p className="text-slate-600 text-2xs">
                Nominal Cicilan: {formatRupiah(approvalItem.nominal_per_cicilan)} • Batas Pelunasan Baru: {approvalItem.jatuh_tempo_baru}
              </p>
            </div>

            <Textarea
              label={approvalAction === 'approve' ? 'Catatan Persetujuan Pimpinan (Opsional)' : 'Alasan Penolakan (Wajib) *'}
              placeholder={approvalAction === 'approve' ? 'Contoh: Disetujui sesuai arahan pimpinan untuk pembayaran bertahap.' : 'Jelaskan alasan permohonan ditolak...'}
              value={approvalCatatan}
              onChange={(e) => setApprovalCatatan(e.target.value)}
              rows={3}
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => setApprovalItem(null)}
                disabled={submittingApproval}
              >
                Batal
              </Button>
              <Button
                variant={approvalAction === 'approve' ? 'primary' : 'danger'}
                onClick={handleProcessApproval}
                disabled={submittingApproval}
                icon={submittingApproval ? <Loader2 size={15} className="animate-spin" /> : undefined}
                className="font-bold"
              >
                {submittingApproval ? 'Memproses...' : (approvalAction === 'approve' ? 'Ya, Setujui Permohonan' : 'Tolak Permohonan')}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Filter Drawer */}
      <Drawer
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Dispensasi"
        width="420px"
        footer={
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleResetFilter}
              className="font-bold text-slate-600 min-h-[42px] px-4"
            >
              Reset
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleApplyFilter}
              className="font-bold min-h-[42px] px-5 shadow-md"
            >
              Terapkan Filter
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <Input
            label="Cari Nama / NIM / Alasan / Tagihan"
            placeholder="Ketik kata kunci pencarian..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />

          <Select
            label="Status Persetujuan"
            value={filterStatus}
            onChange={(val) => setFilterStatus(val as string)}
            options={[
              { value: 'all', label: 'Semua Status' },
              { value: 'pending', label: 'Menunggu Persetujuan' },
              { value: 'approved', label: 'Disetujui' },
              { value: 'rejected', label: 'Ditolak' },
            ]}
          />

          <hr className="border-t border-slate-200 my-2" />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={filterOrderBy}
              onChange={(val) => setFilterOrderBy(val as string)}
              options={[
                { value: 'nama_mahasiswa', label: 'Nama Mahasiswa' },
                { value: 'nim', label: 'NIM' },
                { value: 'nominal_per_cicilan', label: 'Nominal Cicilan' },
                { value: 'jatuh_tempo_baru', label: 'Jatuh Tempo Baru' },
                { value: 'status', label: 'Status' },
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
