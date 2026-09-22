'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Filter, CheckCircle2, Clock, XCircle, Loader2, Save, Eye, Search, AlertTriangle, Printer, User, ShieldAlert, FileText, Trash2
} from 'lucide-react';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { formatRupiah, formatDate } from '@/lib/utils';

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
  cicilan_payment_count?: number;
  cicilan_total_bayar?: number;
  has_unpaid_previous_dispensation?: boolean;
  unpaid_previous_dispensation_count?: number;
  created_at?: string;
  tagihan_id?: number;
  tagihan?: {
    id?: number;
    nomor_tagihan?: string;
    total_tagihan?: number;
    total_bayar?: number;
    total_potongan?: number;
    total_denda?: number;
    status?: string;
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
  const [buktiResmi, setBuktiResmi] = useState<any | null>(null);
  const [loadingBukti, setLoadingBukti] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [printing, setPrinting] = useState(false);

  // Delete State
  const [deletingItem, setDeletingItem] = useState<DispensasiItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
    setBuktiResmi(null);
    setQrDataUrl('');

    // Ambil bukti resmi (hash tanda tangan) + generate QR verifikasi publik
    if (item.status === 'approved') {
      setLoadingBukti(true);
      sikeuService.getCetakBuktiDispensasi(item.id)
        .then(async (res: any) => {
          const bukti = res?.data ?? null;
          setBuktiResmi(bukti);
          const hash = bukti?.pejabat_approver?.digital_signature_hash;
          if (hash && typeof window !== 'undefined') {
            try {
              const verifyUrl = `${window.location.origin}/validasi-dispensasi/${encodeURIComponent(hash)}`;
              const dataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 110 });
              setQrDataUrl(dataUrl);
            } catch {
              setQrDataUrl('');
            }
          }
        })
        .catch(() => setBuktiResmi(null))
        .finally(() => setLoadingBukti(false));
    }
  };

  const handlePrintBukti = () => {
    if (!detailItem || detailItem.status !== 'approved') {
      toast.error('Surat hanya dapat dicetak setelah disetujui pimpinan.');
      return;
    }
    setPrinting(true);
    try {
      const bukti = buktiResmi;
      const hash: string = bukti?.pejabat_approver?.digital_signature_hash || '';
      const verifyUrl = typeof window !== 'undefined' && hash
        ? `${window.location.origin}/validasi-dispensasi/${encodeURIComponent(hash)}`
        : '';
      const tipeLabel = TIPE_DISPENSASI_OPTIONS.find((t) => t.value === detailItem.tipe_dispensasi)?.label || detailItem.tipe_dispensasi;
      const nomorSurat = `DISP-${new Date().getFullYear()}-${String(detailItem.id).padStart(5, '0')}`;
      const tglCetak = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      const totalTagihan = Number(detailItem.tagihan?.total_tagihan || 0);
      const totalBayar = Number(detailItem.tagihan?.total_bayar || 0);
      const sisa = Math.max(0, totalTagihan - totalBayar);

      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (!doc) {
        window.print();
        return;
      }

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Surat Dispensasi - ${nomorSurat}</title>
            <meta charset="utf-8" />
            <style>
              @page { size: A4 portrait; margin: 14mm 16mm; }
              * { box-sizing: border-box; }
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; color: #0f172a; font-size: 10.5pt; line-height: 1.5; background: #fff; }
              .kop { border-bottom: 3px double #0f172a; padding-bottom: 10px; display: flex; justify-content: space-between; align-items: flex-start; }
              .kop h1 { font-size: 14pt; font-weight: 900; margin: 0; letter-spacing: 1px; }
              .kop h2 { font-size: 9.5pt; margin: 2px 0 0 0; color: #334155; }
              .kop p { font-size: 8pt; color: #64748b; margin: 2px 0 0 0; }
              .kop-right { text-align: right; }
              .kop-badge { font-family: monospace; font-size: 9pt; font-weight: 800; background: #f1f5f9; padding: 3px 10px; border-radius: 4px; }
              .kop-no { font-family: monospace; font-size: 8.5pt; color: #475569; margin-top: 3px; }
              .judul { text-align: center; margin: 14px 0 4px 0; }
              .judul h3 { font-size: 12pt; margin: 0; text-decoration: underline; text-underline-offset: 4px; }
              .judul p { font-size: 8.5pt; color: #64748b; font-family: monospace; margin: 3px 0 0 0; }
              .isi { font-size: 10pt; color: #334155; margin: 10px 0; }
              .grid2 { display: table; width: 100%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin: 8px 0; }
              .grid2 .row { display: table-row; }
              .grid2 .cell { display: table-cell; padding: 4px 8px 4px 0; vertical-align: top; width: 50%; }
              .lbl { font-size: 7.5pt; text-transform: uppercase; color: #64748b; font-weight: 700; display: block; }
              .val { font-weight: 700; color: #0f172a; }
              .mono { font-family: monospace; }
              table.skema { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 9.5pt; }
              table.skema td { border: 1px solid #cbd5e1; padding: 7px 12px; }
              table.skema tr:nth-child(odd) td { background: #f8fafc; }
              .klausul { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 10px 14px; font-size: 9pt; color: #064e3b; margin: 8px 0; }
              .alasan { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; font-style: italic; font-size: 9.5pt; color: #334155; margin: 8px 0; }
              .ttd { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 22px; page-break-inside: avoid; }
              .ttd-left { font-size: 8pt; color: #64748b; font-family: monospace; }
              .ttd-right { text-align: center; font-size: 9pt; }
              .ttd-name { font-weight: 800; text-decoration: underline; margin-top: 52px; }
              .qrbox { text-align: center; margin-top: 6px; }
              .qrbox img { width: 92px; height: 92px; border: 1px solid #e2e8f0; border-radius: 6px; }
              .qrbox p { font-size: 7.5pt; color: #64748b; margin: 3px 0 0 0; }
              .hashline { font-family: monospace; font-size: 7.5pt; color: #64748b; margin-top: 2px; }
            </style>
          </head>
          <body>
            <div class="kop">
              <div>
                <h1>UNIVERSITAS SSO CAMPUS</h1>
                <h2>WAKIL REKTOR II BIDANG KEUANGAN &amp; SUMBER DAYA</h2>
                <p>Gedung Rektorat Lt. 2 &bull; Jl. Kampus Terpadu No. 1 &bull; Telp: (021) 789-0123 &bull; Email: keu@campus.ac.id</p>
              </div>
              <div class="kop-right">
                <div class="kop-badge">SURAT KETERANGAN RESMI</div>
                <div class="kop-no">No: ${detailItem.id}/UN-SSO/WR2-KEU/DISP/${new Date().getFullYear()}</div>
              </div>
            </div>
            <div class="judul">
              <h3>SURAT KETERANGAN DISPENSASI PEMBAYARAN KULIAH</h3>
              <p>Tentang Penangguhan &amp; Penyesuaian Kewajiban Keuangan Mahasiswa</p>
            </div>
            <p class="isi">Yang bertanda tangan di bawah ini, Wakil Rektor II / Bagian Keuangan Universitas SSO Campus, menerangkan bahwa mahasiswa:</p>
            <div class="grid2">
              <div class="row">
                <div class="cell"><span class="lbl">Nama Lengkap Mahasiswa</span><span class="val">${detailItem.nama_mahasiswa || '-'}</span></div>
                <div class="cell"><span class="lbl">Nomor Induk Mahasiswa (NIM)</span><span class="val mono">${detailItem.nim || '-'}</span></div>
              </div>
              <div class="row">
                <div class="cell"><span class="lbl">Program Studi</span><span class="val">${detailItem.prodi || '-'}</span></div>
                <div class="cell"><span class="lbl">Nomor Tagihan Terkait</span><span class="val mono">${detailItem.tagihan?.nomor_tagihan || '-'}</span></div>
              </div>
              <div class="row">
                <div class="cell"><span class="lbl">Total Tagihan</span><span class="val mono">${formatRupiah(totalTagihan)}</span></div>
                <div class="cell"><span class="lbl">Sudah Dibayar / Sisa</span><span class="val mono">${formatRupiah(totalBayar)} / ${formatRupiah(sisa)}</span></div>
              </div>
            </div>
            <table class="skema">
              <tr><td style="width:45%; color:#475569;">Tipe / Bentuk Keringanan</td><td><strong>${tipeLabel}</strong></td></tr>
              <tr><td style="color:#475569;">Batas Akhir Pelunasan (Jatuh Tempo Baru)</td><td><strong class="mono">${formatDate(detailItem.jatuh_tempo_baru)}</strong></td></tr>
              <tr><td style="color:#475569;">Nominal Cicilan / Tangguhan Disetujui</td><td><strong class="mono">${formatRupiah(Number(detailItem.nominal_per_cicilan || 0))}</strong></td></tr>
              ${detailItem.jumlah_cicilan ? `<tr><td style="color:#475569;">Jumlah Tahapan Cicilan</td><td><strong>${detailItem.jumlah_cicilan} kali</strong></td></tr>` : ''}
              <tr><td style="color:#475569;">Status Akses KRS SIAKAD</td><td><strong>${detailItem.allow_krs ? 'DIIZINKAN (BYPASS LOCK SIAKAD AKTIF)' : 'TERKUNCI SAMPAI LUNAS'}</strong></td></tr>
            </table>
            <div class="klausul"><strong>Klausul Akses Akademik (SIAKAD):</strong> ${detailItem.allow_krs ? 'Berdasarkan surat keputusan ini, sistem SIAKAD secara otomatis membuka kunci pengisian KRS bagi mahasiswa yang bersangkutan hingga batas jatuh tempo yang telah ditetapkan.' : 'Mahasiswa wajib menyelesaikan kewajiban pembayaran cicilan sebelum sistem SIAKAD membuka akses pengisian KRS.'}</div>
            <div class="alasan">&ldquo;${(detailItem.alasan || 'Permohonan penyesuaian jatuh tempo perkuliahan.').replace(/</g, '&lt;')}&rdquo;</div>
            <div class="ttd">
              <div class="ttd-left">
                <p style="margin:0;">Dokumen ini sah dan diterbitkan secara elektronik oleh SIKEU.</p>
                <p style="margin:0;">VALIDITY HASH: #${detailItem.id}-VERIFIED-WR2</p>
                <p style="margin:0;">Dicetak pada: ${tglCetak}</p>
              </div>
              <div class="ttd-right">
                <p style="margin:0;">Jakarta, ${tglCetak}</p>
                <p style="margin:4px 0 0 0; font-weight:700;">Wakil Rektor II / Bagian Keuangan</p>
                ${qrDataUrl ? `<div class="qrbox"><img src="${qrDataUrl}" alt="QR Verifikasi" /><p>Scan QR verifikasi keaslian</p><div class="hashline">${hash}</div></div>` : (hash ? `<div class="hashline">${hash}<br/>Verifikasi: ${verifyUrl}</div>` : '')}
                <p class="ttd-name">${bukti?.pejabat_approver?.nama || 'Bagian Keuangan & Administrasi Tagihan'}</p>
                <p style="margin:0; font-size:8pt; color:#64748b; font-family:monospace;">Direktorat Keuangan Kampus</p>
              </div>
            </div>
          </body>
        </html>
      `;

      doc.open();
      doc.write(html);
      doc.close();

      iframe.contentWindow?.focus();
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => {
          try {
            document.body.removeChild(iframe);
          } catch {}
        }, 2000);
      }, 250);
    } finally {
      setPrinting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    try {
      const res = await sikeuService.deleteDispensasi(deletingItem.id);
      toast.success(res?.message || 'Dispensasi berhasil dihapus');
      setDeletingItem(null);
      fetchDispensasi();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Gagal menghapus dispensasi');
    } finally {
      setIsDeleting(false);
    }
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
          {formatDate(row.jatuh_tempo_baru)}
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
              router.push(`/sikeu/pembayaran-mahasiswa/tagihan`);
            } else {
              handleOpenDetail(row);
            }
          },
        });

        menuItems.push({
          label: 'Hapus Dispensasi',
          icon: <Trash2 size={14} className="text-rose-600" />,
          onClick: () => setDeletingItem(row),
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
                    <strong className="font-mono text-rose-700 font-bold">{formatDate(detailItem.jatuh_tempo_baru)}</strong>
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
                  {loadingBukti ? (
                    <div className="h-12 flex items-center justify-end text-2xs text-slate-400">
                      <Loader2 size={14} className="animate-spin mr-1" /> Memuat QR verifikasi...
                    </div>
                  ) : qrDataUrl ? (
                    <div className="flex flex-col items-end gap-1">
                      <img src={qrDataUrl} alt="QR Code Verifikasi" className="w-20 h-20 rounded shadow-2xs border border-slate-200" />
                      <span className="text-[9px] font-mono text-slate-400">Scan QR verifikasi keaslian</span>
                      {buktiResmi?.pejabat_approver?.digital_signature_hash && (
                        <span className="text-[9px] font-mono text-slate-400">{buktiResmi.pejabat_approver.digital_signature_hash}</span>
                      )}
                    </div>
                  ) : (
                    <div className="h-12 flex items-center justify-end">
                      <span className="font-mono text-2xs text-emerald-800 font-bold border border-emerald-300 bg-emerald-50 px-2.5 py-1 rounded shadow-2xs">
                        [DIGITALLY SIGNED & VERIFIED]
                      </span>
                    </div>
                  )}
                  <p className="font-bold text-slate-800 text-2xs underline">{buktiResmi?.pejabat_approver?.nama || 'Bagian Keuangan & Administrasi Tagihan'}</p>
                  <p className="text-2xs text-slate-500 font-mono">Direktorat Keuangan Kampus</p>
                </div>
              </div>
            </div>

            {/* Action Buttons in Modal Footer */}
            <div className="flex items-center justify-end gap-3 pt-2 print:hidden">
              <Button
                variant="outline"
                icon={printing ? <Loader2 size={15} className="animate-spin" /> : <Printer size={15} />}
                onClick={handlePrintBukti}
                disabled={detailItem.status !== 'approved' || printing}
                className="font-bold"
              >
                {printing ? 'Menyiapkan Cetakan...' : 'Cetak Bukti Dispensasi (PDF)'}
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
                Nominal Cicilan: {formatRupiah(approvalItem.nominal_per_cicilan)} • Batas Pelunasan Baru: {formatDate(approvalItem.jatuh_tempo_baru)}
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

      {/* Konfirmasi Hapus Dispensasi */}
      <ConfirmDialog
        isOpen={!!deletingItem}
        onClose={() => !isDeleting && setDeletingItem(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Dispensasi Tagihan"
        confirmText="Ya, Hapus Dispensasi"
        cancelText="Batal"
        variant="danger"
        isLoading={isDeleting}
        message={
          deletingItem ? (
            (() => {
              const cicilanCount = deletingItem.cicilan_payment_count ?? (Number(deletingItem.tagihan?.total_bayar || 0) > 0 ? 1 : 0);
              const cicilanTotal = deletingItem.cicilan_total_bayar ?? Number(deletingItem.tagihan?.total_bayar || 0);
              return (
                <span>
                  Dispensasi untuk <strong>{deletingItem.nama_mahasiswa}</strong> (NIM: {deletingItem.nim || '-'}, tagihan{' '}
                  <span className="font-mono">{deletingItem.tagihan?.nomor_tagihan || `#${deletingItem.tagihan_id}`}</span>) akan dihapus permanen dan status tagihan dikembalikan normal.
                  <br />
                  <br />
                  {cicilanCount > 0 ? (
                    <span className="inline-block p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 font-semibold">
                      Sudah ada {cicilanCount} pembayaran cicilan tercatat sebesar {formatRupiah(cicilanTotal)} setelah skema ini disetujui. Sistem akan menolak penghapusan ini demi menjaga record.
                    </span>
                  ) : (
                    <span className="inline-block p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold">
                      Belum ada pembayaran cicilan tercatat pada skema ini (pembayaran biasa sebelum dispensasi tidak dihitung), aman untuk dihapus.
                    </span>
                  )}
                </span>
              );
            })()
          ) : (
            'Apakah Anda yakin ingin menghapus dispensasi ini?'
          )
        }
      />

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
