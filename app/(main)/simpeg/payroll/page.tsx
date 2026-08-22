'use client';

import { useEffect, useState, useCallback } from 'react';
import { DollarSign, Printer, Send, Filter, ShieldAlert, CheckCircle2, Clock, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { simpegService } from '@/services/simpeg.service';
import type { GajiPegawai } from '@/types/simpeg.types';
import type { PaginationMeta } from '@/types/api.types';
import { useAuth } from '@/hooks/useAuth';

export default function PayrollPage() {
  const { user, hasPermission } = useAuth();
  const isAdmin = user?.user_type === 'admin' || hasPermission('simpeg.payroll.manage');
  const canRead = hasPermission('simpeg.payroll.read') || hasPermission('simpeg.payroll.view') || hasPermission('simpeg.payroll.manage');
  const canCreate = hasPermission('simpeg.payroll.create') || hasPermission('simpeg.payroll.manage');

  const [loading, setLoading] = useState(true);
  const [payrollList, setPayrollList] = useState<GajiPegawai[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();

  // Filter & Pagination state
  const [search, setSearch] = useState('');
  const [filterPeriode, setFilterPeriode] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterOrderBy, setFilterOrderBy] = useState('periode_bulan_tahun');
  const [filterOrderDir, setFilterOrderDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [showFilter, setShowFilter] = useState(false);

  // Submit to SIKEU Modal State
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [periodeSubmit, setPeriodeSubmit] = useState(new Date().toISOString().substring(0, 7));
  const [isSubmittingToSikeu, setIsSubmittingToSikeu] = useState(false);

  // Print Slip Modal State
  const [selectedSlip, setSelectedSlip] = useState<GajiPegawai | null>(null);
  const [showSlipModal, setShowSlipModal] = useState(false);

  const loadPayroll = useCallback(async () => {
    if (!canRead) return;
    setLoading(true);
    try {
      const res: any = await simpegService.getPayrollList({
        page,
        limit,
        search: search || undefined,
        periode: filterPeriode || undefined,
        status_transfer: filterStatus || undefined,
        sort_by: filterOrderBy,
        sort_dir: filterOrderDir,
      });

      if (res?.meta) {
        setPayrollList(res.data || []);
        setMeta(res.meta);
      } else {
        let items: GajiPegawai[] = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        if (search) {
          const q = search.toLowerCase();
          items = items.filter(
            (g) =>
              g.periode_bulan_tahun.toLowerCase().includes(q) ||
              g.pegawai?.nama_lengkap?.toLowerCase().includes(q)
          );
        }
        if (filterPeriode) {
          items = items.filter((g) => g.periode_bulan_tahun === filterPeriode);
        }
        if (filterStatus) {
          items = items.filter((g) => g.status_transfer === filterStatus);
        }

        items.sort((a, b) => {
          let valA = (a as any)[filterOrderBy] ?? '';
          let valB = (b as any)[filterOrderBy] ?? '';
          if (typeof valA === 'string') valA = valA.toLowerCase();
          if (typeof valB === 'string') valB = valB.toLowerCase();

          if (valA < valB) return filterOrderDir === 'asc' ? -1 : 1;
          if (valA > valB) return filterOrderDir === 'asc' ? 1 : -1;
          return 0;
        });

        const totalItems = items.length;
        const totalPages = Math.ceil(totalItems / limit) || 1;
        const startIndex = (page - 1) * limit;
        const paginated = items.slice(startIndex, startIndex + limit);

        setPayrollList(paginated);
        setMeta({
          current_page: page,
          last_page: totalPages,
          per_page: limit,
          total: totalItems,
          from: totalItems > 0 ? startIndex + 1 : 0,
          to: Math.min(startIndex + limit, totalItems),
        });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memuat Rekapitulasi Payroll');
    } finally {
      setLoading(false);
    }
  }, [canRead, page, limit, search, filterPeriode, filterStatus, filterOrderBy, filterOrderDir]);

  useEffect(() => {
    loadPayroll();
  }, [loadPayroll]);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const handleExecuteSubmitToSikeu = async () => {
    setIsSubmittingToSikeu(true);
    try {
      const res: any = await simpegService.submitPayrollToSikeu(periodeSubmit);
      toast.success(res?.message || 'Pengajuan payroll berhasil dikirim ke modul SIKEU!');
      setShowSubmitModal(false);
      loadPayroll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal mengajukan payroll ke SIKEU');
    } finally {
      setIsSubmittingToSikeu(false);
    }
  };

  const handleProcessPaymentSIKEU = async (id: number) => {
    try {
      const res: any = await simpegService.processPayrollPayment(id);
      toast.success(res?.message || 'Pembayaran gaji berhasil diproses oleh SIKEU & Slip terbit!');
      loadPayroll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memproses pembayaran gaji');
    }
  };

  const columns: ColumnDef<GajiPegawai>[] = [
    {
      key: 'periode_bulan_tahun',
      label: 'Periode',
      render: (row) => <span className="font-bold font-mono text-xs">{row.periode_bulan_tahun}</span>,
    },
    {
      key: 'pegawai',
      label: 'Nama Pegawai',
      render: (row) => (
        <div>
          <span className="font-bold block">{row.pegawai?.nama_lengkap || `Pegawai ID ${row.pegawai_id}`}</span>
          <span className="text-[11px] text-slate-500 font-mono">NIP: {row.pegawai?.nip || '-'}</span>
        </div>
      ),
    },
    {
      key: 'gaji_pokok',
      label: 'Gaji Pokok (SIKEU)',
      render: (row) => <span className="font-medium text-slate-700">{formatRupiah(row.gaji_pokok)}</span>,
    },
    {
      key: 'total_tunjangan',
      label: 'Tunjangan (Tetap + Transport)',
      render: (row) => (
        <div>
          <span className="font-bold text-emerald-600">+{formatRupiah(row.total_tunjangan)}</span>
          <span className="block text-[10px] text-slate-500 font-semibold">
            Presensi Tepat Waktu: {row.jumlah_hari_hadir_tepat_waktu ?? 0} Hari
          </span>
        </div>
      ),
    },
    {
      key: 'total_potongan',
      label: 'Potongan (SIKEU)',
      render: (row) => <span className="font-semibold text-rose-600">-{formatRupiah(row.total_potongan)}</span>,
    },
    {
      key: 'gaji_bersih',
      label: 'Take Home Pay',
      render: (row) => <span className="font-extrabold text-primary-700 text-sm">{formatRupiah(row.gaji_bersih)}</span>,
    },
    {
      key: 'status_transfer',
      label: 'Status Alur Penggajian',
      render: (row) => {
        if (row.status_transfer === 'paid') {
          return (
            <Badge variant="green" className="uppercase">
              <CheckCircle2 size={12} className="mr-1 inline" /> Lunas (Slip Terbit)
            </Badge>
          );
        }
        if (row.status_transfer === 'submitted_to_sikeu') {
          return (
            <Badge variant="blue" className="uppercase">
              <Clock size={12} className="mr-1 inline text-blue-600 animate-pulse" /> Menunggu Pembayaran SIKEU
            </Badge>
          );
        }
        return (
          <Badge variant="yellow" className="uppercase">
            Draft (SIMPEG)
          </Badge>
        );
      },
    },
    {
      key: 'aksi',
      label: 'Aksi',
      align: 'right',
      render: (row) => {
        const menuItems: DropdownMenuItem[] = [];

        if (row.status_transfer === 'paid') {
          menuItems.push({
            label: 'Lihat / Cetak Slip Gaji PDF',
            icon: <Printer size={14} />,
            onClick: () => {
              setSelectedSlip(row);
              setShowSlipModal(true);
            },
          });
        }

        if (row.status_transfer === 'submitted_to_sikeu' && isAdmin) {
          menuItems.push({
            label: 'Eksekusi Pembayaran SIKEU (Approve & Pay)',
            icon: <CheckCircle2 size={14} className="text-emerald-600" />,
            onClick: () => handleProcessPaymentSIKEU(row.id),
          });
        }

        if (menuItems.length === 0) {
          menuItems.push({
            label: 'Menunggu Pengajuan SIMPEG / SIKEU',
            icon: <Info size={14} />,
            onClick: () => {},
          });
        }

        return (
          <div className="flex justify-end">
            <DropdownMenu items={menuItems} />
          </div>
        );
      },
    },
  ];

  if (!canRead) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader
          title="Payroll & Slip Gaji Pegawai"
          description="Rekapitulasi Gaji Bulanan, Kalkulasi Transport Presensi, dan Pengajuan Pembayaran ke Modul SIKEU"
        />
        <div className="card p-6 text-center">
          <ShieldAlert size={56} className="mx-auto mb-4 opacity-40" />
          <h2 className="text-xl font-bold mb-2">
            Akses Ditolak / Dibatasi
          </h2>
          <p className="max-w-[500px] mx-auto opacity-70">
            Peran Anda saat ini tidak memiliki hak akses (*permission*) untuk melihat Slip Gaji & Payroll.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Payroll & Slip Gaji Pegawai"
        description="Rekapitulasi Gaji Bulanan, Kalkulasi Transport Presensi, dan Pengajuan Pembayaran ke Modul SIKEU"
        action={
          <div className="flex gap-2">
            {canCreate && (
              <Button
                icon={<Send size={16} />}
                onClick={() => setShowSubmitModal(true)}
                className="bg-primary-600 hover:bg-primary-700 text-white"
              >
                Kirim Pengajuan ke SIKEU
              </Button>
            )}
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setShowFilter(true)}
            >
              Filter
            </Button>
          </div>
        }
      />


      {/* Main DataTable */}
      <DataTable
        columns={columns}
        data={payrollList}
        isLoading={loading}
        meta={meta}
        onPageChange={(newPage) => setPage(newPage)}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
        emptyMessage={
          <div className="py-8 text-center text-slate-400">
            <DollarSign size={48} className="mx-auto mb-4 opacity-40" />
            <p>Belum ada data rekapan payroll gaji pegawai. Silakan lakukan `Buat Payroll` dari halaman Presensi.</p>
          </div>
        }
      />

      {/* Filter Drawer Slide Right-to-Left */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter & Urutkan Payroll Slip Gaji"
      >
        <div className="space-y-4">
          <Input
            label="Pencarian Nama / Periode"
            placeholder="Cari nama pegawai, 2026-08..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />

          <Input
            label="Filter Periode (YYYY-MM)"
            placeholder="Contoh: 2026-08"
            value={filterPeriode}
            onChange={(e) => {
              setFilterPeriode(e.target.value);
              setPage(1);
            }}
          />

          <Select
            label="Filter Status Alur"
            value={filterStatus}
            onChange={(val) => {
              setFilterStatus(val);
              setPage(1);
            }}
            options={[
              { value: '', label: 'Semua Status' },
              { value: 'draft', label: 'Draft (SIMPEG)' },
              { value: 'submitted_to_sikeu', label: 'Menunggu Pembayaran SIKEU' },
              { value: 'paid', label: 'Lunas (Slip Terbit)' },
            ]}
          />

          <hr className="my-2 border-slate-200" />

          {/* Grid 2 Kolom Sorting */}
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={filterOrderBy}
              onChange={(val) => setFilterOrderBy(val)}
              options={[
                { value: 'periode_bulan_tahun', label: 'Periode' },
                { value: 'gaji_bersih', label: 'Take Home Pay' },
                { value: 'id', label: 'ID' },
              ]}
            />
            <Select
              label="Arah"
              value={filterOrderDir}
              onChange={(val) => setFilterOrderDir(val as 'asc' | 'desc')}
              options={[
                { value: 'desc', label: 'Z - A (Terbaru)' },
                { value: 'asc', label: 'A - Z (Terlama)' },
              ]}
            />
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSearch('');
                setFilterPeriode('');
                setFilterStatus('');
                setFilterOrderBy('periode_bulan_tahun');
                setFilterOrderDir('desc');
                setPage(1);
              }}
            >
              Reset Filter
            </Button>
            <Button onClick={() => setShowFilter(false)}>
              Terapkan
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Modal Kirim Pengajuan ke SIKEU */}
      {canCreate && (
        <Modal
          open={showSubmitModal}
          onClose={() => setShowSubmitModal(false)}
          title="Kirim Pengajuan Payroll ke Modul SIKEU"
          footer={
            <div className="flex gap-2 justify-end w-full">
              <Button variant="secondary" onClick={() => setShowSubmitModal(false)}>
                Batal
              </Button>
              <Button
                variant="primary"
                loading={isSubmittingToSikeu}
                disabled={isSubmittingToSikeu}
                onClick={handleExecuteSubmitToSikeu}
              >
                <Send size={16} /> Kirim Pengajuan Sekarang
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-sm">
            <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 text-primary-900 space-y-2">
              <h4 className="font-bold flex items-center gap-2">
                <Send size={18} /> Pengajuan Penggajian ke Admin SIKEU
              </h4>
              <p className="text-xs opacity-90">
                Seluruh data rekapan gaji pegawai pada periode ini akan dikirimkan ke modul Keuangan (SIKEU) untuk dilakukan verifikasi dan proses pencairan/pembayaran transfer kas.
              </p>
            </div>

            <Input
              label="Pilih Periode Penggajian yang Ingin Diajukan *"
              type="month"
              value={periodeSubmit}
              onChange={(e) => setPeriodeSubmit(e.target.value)}
              required
            />
          </div>
        </Modal>
      )}

      {/* Modal Cetak Slip Gaji Resmi PDF */}
      <Modal
        open={showSlipModal}
        onClose={() => setShowSlipModal(false)}
        title={`Slip Gaji Resmi Pegawai — Periode ${selectedSlip?.periode_bulan_tahun}`}
        footer={
          <div className="flex gap-2 justify-end w-full">
            <Button variant="secondary" onClick={() => setShowSlipModal(false)}>
              Tutup
            </Button>
            <Button variant="primary" onClick={() => window.print()}>
              <Printer size={16} /> Cetak / Download PDF
            </Button>
          </div>
        }
      >
        {selectedSlip && (
          <div className="space-y-4 p-4 border border-slate-200 rounded-xl bg-white text-slate-800">
            <div className="border-b border-slate-300 pb-3 text-center">
              <h3 className="font-black text-lg text-slate-900 uppercase tracking-wider">Slip Gaji Pegawai</h3>
              <p className="text-xs text-slate-500 font-mono">Periode Penggajian: {selectedSlip.periode_bulan_tahun}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400 block">Nama Pegawai:</span>
                <span className="font-bold">{selectedSlip.pegawai?.nama_lengkap || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">NIP:</span>
                <span className="font-bold font-mono">{selectedSlip.pegawai?.nip || '-'}</span>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg space-y-2 text-xs">
              <div className="flex justify-between">
                <span>Gaji Pokok (SIKEU):</span>
                <span className="font-semibold">{formatRupiah(selectedSlip.gaji_pokok)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tunjangan Tetap (SIKEU):</span>
                <span className="font-semibold">{formatRupiah(selectedSlip.tunjangan_tetap || 0)}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Bonus Transport Presensi ({selectedSlip.jumlah_hari_hadir_tepat_waktu ?? 0} Hari Tepat Waktu):</span>
                <span className="font-bold">+{formatRupiah(selectedSlip.total_biaya_transport || 0)}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Potongan Tetap (SIKEU/BPJS/PPh21):</span>
                <span className="font-semibold">-{formatRupiah(selectedSlip.total_potongan)}</span>
              </div>
              <hr className="border-slate-300 my-1" />
              <div className="flex justify-between font-black text-sm text-primary-700 pt-1">
                <span>TAKE HOME PAY (LUNAS):</span>
                <span>{formatRupiah(selectedSlip.gaji_bersih)}</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 italic text-center">
              Status: LUNAS — Diproses & Diterbitkan oleh Sub-Sistem Keuangan (SIKEU) RAGI Campus Platform.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
