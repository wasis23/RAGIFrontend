'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { formatRupiah } from '@/lib/utils';
import {
  CreditCard, DollarSign, Filter, RefreshCw, CheckCircle2, Clock, XCircle, Building, Search, Plus, Eye, AlertTriangle, RotateCcw
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
import { DropdownMenu } from '@/components/ui/DropdownMenu';

interface PaymentItem {
  id: number;
  kode_transaksi: string;
  nim?: string;
  nama_mahasiswa?: string;
  program_studi?: string;
  rincian_pembayaran?: string;
  virtual_account?: { va_number?: string; bank_nama?: string };
  tagihan?: { nomor_tagihan?: string; mahasiswa_id?: number; rincian?: string };
  jumlah_bayar: number;
  waktu_bayar: string;
  channel_bayar: string;
  status: 'success' | 'pending' | 'failed' | string;
}

export default function PembayaranPage() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter Drawer State — 2-stage
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterChannel, setFilterChannel] = useState('');
  const [filterOrderBy, setFilterOrderBy] = useState('waktu_bayar');
  const [filterOrderDir, setFilterOrderDir] = useState<'asc' | 'desc'>('desc');
  const [appliedFilters, setAppliedFilters] = useState({ search: '', status: '', channel: '', orderBy: 'waktu_bayar', orderDir: 'desc' as 'asc' | 'desc' });

  // Modals State
  const [detailModal, setDetailModal] = useState<PaymentItem | null>(null);
  const [koreksiModal, setKoreksiModal] = useState<{
    isOpen: boolean;
    item: PaymentItem | null;
    alasan: string;
    loading: boolean;
  }>({
    isOpen: false,
    item: null,
    alasan: '',
    loading: false,
  });

  const handleConfirmKoreksi = async () => {
    if (!koreksiModal.item) return;
    if (!koreksiModal.alasan || koreksiModal.alasan.trim().length < 10) {
      toast.error('Alasan koreksi wajib diisi minimal 10 karakter.');
      return;
    }

    try {
      setKoreksiModal((prev) => ({ ...prev, loading: true }));
      const res = await sikeuService.koreksiPembayaran(koreksiModal.item.id, {
        alasan_koreksi: koreksiModal.alasan.trim(),
      });
      if (res.status === 'success') {
        toast.success(res.message || 'Pembayaran berhasil dikoreksi dan dibatalkan.');
        setKoreksiModal({ isOpen: false, item: null, alasan: '', loading: false });
        fetchPayments();
      } else {
        toast.error(res.message || 'Gagal mengoreksi pembayaran');
        setKoreksiModal((prev) => ({ ...prev, loading: false }));
      }
    } catch (e: any) {
      toast.error(e?.message || 'Terjadi kesalahan saat memproses koreksi');
      setKoreksiModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await sikeuService.getPembayaranList();
      const list = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
      setPayments(list);
    } catch {
      setPayments([]);
      toast.error('Gagal memuat data histori pembayaran');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleApplyFilter = () => {
    setAppliedFilters({ search: filterSearch, status: filterStatus, channel: filterChannel, orderBy: filterOrderBy, orderDir: filterOrderDir });
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterStatus('');
    setFilterChannel('');
    setFilterOrderBy('waktu_bayar');
    setFilterOrderDir('desc');
    setAppliedFilters({ search: '', status: '', channel: '', orderBy: 'waktu_bayar', orderDir: 'desc' });
    setShowFilter(false);
  };

  const filteredData = useMemo(() => {
    const list = payments.filter((item) => {
      if (appliedFilters.search) {
        const q = appliedFilters.search.toLowerCase();
        const matchKode = item.kode_transaksi?.toLowerCase().includes(q);
        const matchVA = item.virtual_account?.va_number?.toLowerCase().includes(q);
        const matchTagihan = item.tagihan?.nomor_tagihan?.toLowerCase().includes(q);
        const matchNama = item.nama_mahasiswa?.toLowerCase().includes(q);
        const matchNim = item.nim?.toLowerCase().includes(q);
        if (!matchKode && !matchVA && !matchTagihan && !matchNama && !matchNim) return false;
      }
      if (appliedFilters.status && item.status !== appliedFilters.status) return false;
      if (appliedFilters.channel && item.channel_bayar !== appliedFilters.channel) return false;
      return true;
    });

    return [...list].sort((a, b) => {
      let valA: any = a[appliedFilters.orderBy as keyof PaymentItem] ?? '';
      let valB: any = b[appliedFilters.orderBy as keyof PaymentItem] ?? '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return appliedFilters.orderDir === 'asc' ? -1 : 1;
      if (valA > valB) return appliedFilters.orderDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [payments, appliedFilters]);

  const totalSuccess = useMemo(() => {
    return filteredData
      .filter((p) => p.status === 'success')
      .reduce((sum, p) => sum + (p.jumlah_bayar || 0), 0);
  }, [filteredData]);

  const columns: ColumnDef<PaymentItem>[] = [
    {
      key: 'kode_transaksi',
      label: 'KODE TRANSAKSI',
      render: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-md">
            {row.kode_transaksi}
          </span>
          <span className="text-2xs block text-slate-400 font-semibold mt-1">{row.waktu_bayar || '-'}</span>
        </div>
      ),
    },
    {
      key: 'mahasiswa',
      label: 'MAHASISWA',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900 text-xs">{row.nama_mahasiswa || '-'}</p>
          <div className="flex items-center gap-1 text-2xs text-slate-500 font-medium mt-0.5">
            <span className="font-mono text-primary-700 font-bold">{row.nim || '-'}</span>
            <span>•</span>
            <span className="truncate max-w-[150px]">{row.program_studi || '-'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'rincian_pembayaran',
      label: 'PERIODE / RINCIAN BIAYA',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-800 text-xs leading-snug">
            {row.rincian_pembayaran || row.tagihan?.rincian || 'Tagihan Semester'}
          </p>
          <p className="font-mono text-2xs text-slate-400 mt-0.5">{row.tagihan?.nomor_tagihan || '-'}</p>
        </div>
      ),
    },
    {
      key: 'virtual_account',
      label: 'CHANNEL / METODE',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900 text-xs">{row.virtual_account?.bank_nama || row.channel_bayar || 'VA Bank'}</p>
          <p className="font-mono text-2xs text-slate-500">{row.virtual_account?.va_number || (row.channel_bayar === 'LOKET_TUNAI' ? 'Tunai Kasir' : '-')}</p>
        </div>
      ),
    },
    {
      key: 'jumlah_bayar',
      label: 'JUMLAH BAYAR',
      render: (row) => (
        <span className="font-bold text-emerald-700 tabular-nums text-sm">
          {formatRupiah(row.jumlah_bayar || 0)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (row) => {
        if (row.status === 'success') {
          return (
            <span className="badge badge-green text-xs font-bold inline-flex items-center gap-1">
              <CheckCircle2 size={12} /> Berhasil (Lunas)
            </span>
          );
        }
        if (row.status === 'reversed') {
          return (
            <span className="badge badge-gray text-xs font-bold inline-flex items-center gap-1">
              <RefreshCw size={12} /> Dikoreksi (Batal)
            </span>
          );
        }
        if (row.status === 'pending') {
          return (
            <span className="badge badge-blue text-xs font-bold inline-flex items-center gap-1">
              <Clock size={12} /> Menunggu Verifikasi
            </span>
          );
        }
        return (
          <span className="badge badge-red text-xs font-bold inline-flex items-center gap-1">
            <XCircle size={12} /> Gagal / Expired
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end">
          <DropdownMenu
            items={[
              {
                label: 'Rincian Pembayaran',
                icon: <Eye size={14} />,
                onClick: () => setDetailModal(row),
              },
              ...(row.status !== 'reversed'
                ? [
                    {
                      label: 'Koreksi Pembayaran',
                      icon: <RotateCcw size={14} />,
                      variant: 'danger' as const,
                      onClick: () => {
                        setKoreksiModal({
                          isOpen: true,
                          item: row,
                          alasan: '',
                          loading: false,
                        });
                      },
                    },
                  ]
                : []),
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="w-full space-y-6 animate-fade-in">
      <PageHeader
        title="Histori Transaksi Pembayaran & Virtual Account"
        description="Monitoring log pembayaran lunas, settlement payment gateway, dan mutasi masuk rekening bank."
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
            <Link href="/sikeu/tagihan/create">
              <Button
                variant="primary"
                icon={<Plus size={16} />}
                className="font-bold min-h-[40px] px-4 shadow-sm"
              >
                Transaksi Kasir Loket
              </Button>
            </Link>
          </div>
        }
      />



      <DataTable data={filteredData} isLoading={loading} columns={columns} emptyMessage="Belum ada data histori pembayaran." />

      {/* Filter Drawer */}
      <Drawer isOpen={showFilter} onClose={() => setShowFilter(false)} title="Filter Pembayaran" width="420px"
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
          <Input label="Cari Kode Transaksi / VA / Invoice" placeholder="Ketik kata kunci..."
            value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} />

          <Select label="Status Transaksi"
            value={filterStatus}
            onChange={(val) => setFilterStatus(val as string)}
            options={[
              { value: '', label: 'Semua Status' },
              { value: 'success', label: 'Berhasil (Lunas)' },
              { value: 'pending', label: 'Menunggu Verifikasi' },
              { value: 'failed', label: 'Gagal / Expired' },
            ]} />

          <Select label="Channel Pembayaran"
            value={filterChannel}
            onChange={(val) => setFilterChannel(val as string)}
            options={[
              { value: '', label: 'Semua Channel' },
              { value: 'VA_BANK', label: 'Virtual Account Bank' },
              { value: 'QRIS', label: 'QRIS Instant' },
              { value: 'LOKET', label: 'Loket Kasir Tunai' },
            ]} />

          <hr className="border-t border-slate-200 my-2" />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={filterOrderBy}
              onChange={(val) => setFilterOrderBy(val as string)}
              options={[
                { value: 'waktu_bayar', label: 'Waktu Bayar' },
                { value: 'kode_transaksi', label: 'Kode Transaksi' },
                { value: 'nama_mahasiswa', label: 'Nama Mahasiswa' },
                { value: 'jumlah_bayar', label: 'Jumlah Bayar' },
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

      {/* Detail Modal */}
      <Modal
        isOpen={!!detailModal}
        onClose={() => setDetailModal(null)}
        title="Rincian Transaksi Pembayaran"
        size="lg"
      >
        {detailModal && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-slate-400 block font-medium">Kode Transaksi:</span>
                <span className="font-mono font-bold text-slate-800">{detailModal.kode_transaksi}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Waktu Transaksi:</span>
                <span className="font-semibold text-slate-700">{detailModal.waktu_bayar || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Status:</span>
                <span className="font-bold uppercase text-primary-700">{detailModal.status}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Nama Mahasiswa:</span>
                <span className="font-bold text-slate-900">{detailModal.nama_mahasiswa || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">NIM:</span>
                <span className="font-mono font-semibold text-slate-700">{detailModal.nim || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Program Studi:</span>
                <span className="font-semibold text-slate-700">{detailModal.program_studi || '-'}</span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-3.5 space-y-2">
              <div className="flex justify-between items-center text-slate-600">
                <span>Nomor Tagihan:</span>
                <span className="font-mono font-semibold">{detailModal.tagihan?.nomor_tagihan || '-'}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Rincian Komponen:</span>
                <span className="font-semibold text-right">{detailModal.rincian_pembayaran || detailModal.tagihan?.rincian || '-'}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Metode / Channel:</span>
                <span className="font-semibold">{detailModal.virtual_account?.bank_nama || detailModal.channel_bayar || 'VA'}</span>
              </div>
              {detailModal.virtual_account?.va_number && (
                <div className="flex justify-between items-center text-slate-600">
                  <span>Nomor VA:</span>
                  <span className="font-mono font-bold text-primary-700">{detailModal.virtual_account.va_number}</span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-sm font-bold text-slate-900">
                <span>Total Dibayar:</span>
                <span className="text-emerald-700 font-extrabold text-base">{formatRupiah(detailModal.jumlah_bayar || 0)}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setDetailModal(null)} size="sm">
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Koreksi Modal */}
      <Modal
        isOpen={koreksiModal.isOpen}
        onClose={() => setKoreksiModal({ isOpen: false, item: null, alasan: '', loading: false })}
        title="Koreksi / Batalkan Pembayaran"
        size="md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-800">
            <AlertTriangle size={18} className="shrink-0 mt-0.5 text-amber-600" />
            <div>
              <p className="font-bold">Perhatian: Tindakan Destruktif</p>
              <p className="mt-0.5 text-amber-700 leading-relaxed">
                Koreksi transaksi akan membatalkan status pembayaran, mengurangi total bayar pada tagihan mahasiswa, dan mencatat reversal jurnal kas.
              </p>
            </div>
          </div>

          {koreksiModal.item && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 font-medium">
              <div className="flex justify-between">
                <span className="text-slate-500">Kode Transaksi:</span>
                <span className="font-mono font-bold text-slate-800">{koreksiModal.item.kode_transaksi}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mahasiswa:</span>
                <span className="font-bold text-slate-800">{koreksiModal.item.nama_mahasiswa} ({koreksiModal.item.nim})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nominal:</span>
                <span className="font-bold text-rose-700">{formatRupiah(koreksiModal.item.jumlah_bayar || 0)}</span>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="block font-bold text-slate-700 text-xs">
              Alasan Koreksi <span className="text-rose-500">* (minimal 10 karakter)</span>
            </label>
            <textarea
              rows={3}
              value={koreksiModal.alasan}
              onChange={(e) => setKoreksiModal(prev => ({ ...prev, alasan: e.target.value }))}
              placeholder="Contoh: Salah alokasi tagihan kasir loket / transfer duplikat..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setKoreksiModal({ isOpen: false, item: null, alasan: '', loading: false })}
              disabled={koreksiModal.loading}
              size="sm"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleConfirmKoreksi}
              isLoading={koreksiModal.loading}
              disabled={koreksiModal.alasan.trim().length < 10}
              size="sm"
            >
              Konfirmasi Koreksi
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
