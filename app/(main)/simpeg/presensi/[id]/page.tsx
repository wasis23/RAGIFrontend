'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Filter, DollarSign, Layers, Calendar, Clock, CheckCircle2, FileText, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { simpegService } from '@/services/simpeg.service';
import type { PresensiPegawai } from '@/types/simpeg.types';
import type { PaginationMeta } from '@/types/api.types';
import type { PresensiBundle } from '../page';
import { useAuth } from '@/hooks/useAuth';

export default function PresensiBundleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const bundleId = resolvedParams.id;
  const router = useRouter();
  const { user, hasPermission } = useAuth();
  const isAdmin = user?.user_type === 'admin' || hasPermission('simpeg.presensi.manage');

  const [loading, setLoading] = useState(true);
  const [bundle, setBundle] = useState<PresensiBundle | null>(null);
  const [presensiList, setPresensiList] = useState<PresensiPegawai[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();

  // Filter & Pagination state
  const [searchPegawaiId, setSearchPegawaiId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterOrderBy, setFilterOrderBy] = useState('tanggal');
  const [filterOrderDir, setFilterOrderDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [showFilter, setShowFilter] = useState(false);

  // Modal Payroll Process State
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [processingPayroll, setProcessingPayroll] = useState(false);

  const fetchBundleDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await simpegService.getPresensiBundleDetail(bundleId, {
        search: searchPegawaiId.trim() || undefined,
        status_kehadiran: filterStatus || undefined,
        sort_by: filterOrderBy,
        sort_dir: filterOrderDir,
        page,
        limit,
      });

      if (res.status === 'success') {
        setBundle(res.bundle);
        setPresensiList(res.data || []);
        if (res.meta) {
          setMeta(res.meta);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memuat rincian Bundle Presensi');
    } finally {
      setLoading(false);
    }
  }, [bundleId, searchPegawaiId, filterStatus, filterOrderBy, filterOrderDir, page, limit]);

  useEffect(() => {
    fetchBundleDetail();
  }, [fetchBundleDetail]);

  const handleProcessPayroll = async () => {
    setProcessingPayroll(true);
    try {
      const res = await simpegService.processBundlePayroll(bundleId);
      if (res.status === 'success') {
        toast.success(res.message || `Payroll untuk bundle ${bundle?.nama_periode} berhasil diproses!`);
        setShowPayrollModal(false);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memproses payroll untuk bundle ini.');
    } finally {
      setProcessingPayroll(false);
    }
  };

  const columns: ColumnDef<PresensiPegawai>[] = [
    {
      key: 'pegawai_id',
      label: 'Pegawai ID',
      render: (row) => (
        <span className="font-mono font-semibold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-lg text-xs border border-primary-200">
          ID {row.pegawai_id}
        </span>
      ),
    },
    {
      key: 'tanggal',
      label: 'Tanggal Presensi',
      render: (row) => {
        const d = new Date(row.tanggal);
        const isSunday = d.getDay() === 0;

        return (
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold ${isSunday ? 'text-rose-700 font-bold' : 'text-slate-700'}`}>
              {d.toLocaleDateString('id-ID', {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </span>
            {isSunday && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
                Minggu
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'jam_masuk',
      label: 'Scan Masuk',
      render: (row) => {
        if (!row.jam_masuk) {
          return <span className="text-xs text-slate-400 font-medium">-</span>;
        }

        const jam = row.jam_masuk;
        const isLate = jam > '08:15:00';

        if (isLate) {
          const [h, m] = jam.split(':').map(Number);
          const scanInMinutes = h * 60 + m;
          const targetMinutes = 8 * 60; // 08:00
          const diffMins = Math.max(0, scanInMinutes - targetMinutes);

          return (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1 text-xs font-bold text-rose-700">
                <Clock size={13} className="text-rose-500 shrink-0" />
                <span>{jam}</span>
              </div>
              <span className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded w-fit">
                Terlambat {diffMins} mnt
              </span>
            </div>
          );
        }

        return (
          <div className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
            <Clock size={13} className="text-emerald-500 shrink-0" />
            <span>{jam}</span>
          </div>
        );
      },
    },
    {
      key: 'jam_keluar',
      label: 'Scan Pulang',
      render: (row) => {
        if (!row.jam_keluar) {
          return <span className="text-xs text-slate-400 font-medium">-</span>;
        }

        const jam = row.jam_keluar;
        const isEarly = jam < '16:00:00';

        if (isEarly) {
          const [h, m] = jam.split(':').map(Number);
          const scanOutMinutes = h * 60 + m;
          const targetMinutes = 16 * 60; // 16:00
          const diffMins = Math.max(0, targetMinutes - scanOutMinutes);

          return (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1 text-xs font-bold text-rose-700">
                <Clock size={13} className="text-rose-500 shrink-0" />
                <span>{jam}</span>
              </div>
              <span className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded w-fit">
                Pulang Cepat {diffMins} mnt
              </span>
            </div>
          );
        }

        return (
          <div className="flex items-center gap-1 text-xs font-semibold text-blue-700">
            <Clock size={13} className="text-blue-500 shrink-0" />
            <span>{jam}</span>
          </div>
        );
      },
    },
    {
      key: 'status_kehadiran',
      label: 'Status Kehadiran',
      render: (row) => {
        let variant: 'success' | 'danger' | 'warning' | 'info' | 'secondary' = 'secondary';
        if (row.status_kehadiran === 'hadir') variant = 'success';
        else if (row.status_kehadiran === 'alfa') variant = 'danger';
        else if (row.status_kehadiran === 'izin' || row.status_kehadiran === 'sakit') variant = 'warning';
        else if (row.status_kehadiran === 'dinas') variant = 'info';

        return (
          <Badge variant={variant} className="capitalize">
            {row.status_kehadiran}
          </Badge>
        );
      },
    },
    {
      key: 'informasi_izin',
      label: 'Informasi Izin',
      render: () => (
        <span className="text-xs text-slate-400 font-normal">-</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={bundle ? bundle.nama_periode : 'Rincian Bundle Presensi'}
        description={`Detail log absensi pegawai periode ${bundle?.tanggal_awal || ''} s/d ${bundle?.tanggal_akhir || ''}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" icon={<ArrowLeft size={16} />} onClick={() => router.push('/simpeg/presensi')}>
              Kembali ke Daftar Bundle
            </Button>
            <Button variant="outline" icon={<Filter size={16} />} onClick={() => setShowFilter(true)}>
              Filter
            </Button>
            {isAdmin && (
              <Button icon={<DollarSign size={16} />} onClick={() => setShowPayrollModal(true)}>
                Proses Payroll Bundle Ini
              </Button>
            )}
          </div>
        }
      />

      {/* Bundle Metadata Header Card */}
      {bundle && (
        <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-50 text-primary-600 rounded-xl">
              <Layers size={20} />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-400">Nama Bundle</div>
              <div className="text-sm font-bold text-slate-800">{bundle.nama_periode}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Calendar size={20} />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-400">Rentang Tanggal</div>
              <div className="text-sm font-bold text-slate-800">
                {bundle.tanggal_awal} s/d {bundle.tanggal_akhir}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Users size={20} />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-400">Jumlah Karyawan</div>
              <div className="text-sm font-bold text-emerald-700">
                {bundle.total_pegawai !== undefined ? bundle.total_pegawai.toLocaleString('id-ID') : (bundle.total_record ? bundle.total_record.toLocaleString('id-ID') : 0)} Karyawan
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <FileText size={20} />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-400">Waktu Buat Bundle</div>
              <div className="text-xs font-semibold text-slate-700">
                {new Date(bundle.created_at).toLocaleString('id-ID', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={presensiList}
        isLoading={loading}
        meta={meta}
        onPageChange={(newPage) => setPage(newPage)}
        rowClassName={(row) => {
          const isSunday = new Date(row.tanggal).getDay() === 0;
          return isSunday ? 'bg-rose-50/70 hover:bg-rose-100/80 border-l-4 border-l-rose-500' : '';
        }}
      />

      {/* Filter Drawer (Slide Kanan-ke-Kiri) */}
      <Drawer open={showFilter} onClose={() => setShowFilter(false)} title="Filter Absensi di Bundle Ini">
        <div className="space-y-4">
          <Input
            label="Cari Pegawai ID (Spesifik)"
            placeholder="Contoh: 35 (hanya memfilter Pegawai ID 35)"
            value={searchPegawaiId}
            onChange={(e) => setSearchPegawaiId(e.target.value)}
          />

          <Select
            label="Status Kehadiran"
            value={filterStatus}
            onChange={(val) => setFilterStatus(val)}
            options={[
              { value: '', label: 'Semua Status Kehadiran' },
              { value: 'hadir', label: 'Hadir' },
              { value: 'alfa', label: 'Alpha / Tidak Hadir' },
              { value: 'izin', label: 'Izin' },
              { value: 'sakit', label: 'Sakit' },
              { value: 'dinas', label: 'Dinas Luar' },
            ]}
          />

          <hr className="border-t border-slate-200 my-2" />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={filterOrderBy}
              onChange={(val) => setFilterOrderBy(val)}
              options={[
                { value: 'tanggal', label: 'Tanggal Absensi' },
                { value: 'pegawai_id', label: 'Pegawai ID' },
                { value: 'jam_masuk', label: 'Jam Masuk' },
              ]}
            />
            <Select
              label="Arah"
              value={filterOrderDir}
              onChange={(val) => setFilterOrderDir(val as 'asc' | 'desc')}
              options={[
                { value: 'asc', label: 'A - Z (Terlama/Asc)' },
                { value: 'desc', label: 'Z - A (Terbaru/Desc)' },
              ]}
            />
          </div>

          <div className="pt-4 flex gap-2">
            <Button
              className="w-full"
              onClick={() => {
                setPage(1);
                setShowFilter(false);
                fetchBundleDetail();
              }}
            >
              Terapkan Filter
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSearchPegawaiId('');
                setFilterStatus('');
                setFilterOrderBy('tanggal');
                setFilterOrderDir('asc');
                setPage(1);
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Modal Confirm Process Payroll for Bundle */}
      <Modal
        open={showPayrollModal}
        onClose={() => setShowPayrollModal(false)}
        title="Proses Payroll Gaji dari Bundle Presensi"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowPayrollModal(false)} disabled={processingPayroll}>
              Batal
            </Button>
            <Button loading={processingPayroll} disabled={processingPayroll} onClick={handleProcessPayroll}>
              Proses & Kirim Payroll ke SIKEU
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3.5 bg-primary-50 text-primary-900 rounded-xl border border-primary-100">
            <DollarSign size={22} className="mt-0.5 shrink-0 text-primary-600" />
            <div className="text-sm space-y-1">
              <p className="font-semibold text-primary-900">Proses Perhitungan Gaji Payroll</p>
              <p className="text-primary-700 text-xs">
                Perhitungan komponen gaji (gaji pokok, tunjangan kehadiran, dan potongan keterlambatan) akan dikalkulasi berdasarkan {bundle?.total_record} log presensi dalam bundle <strong>{bundle?.nama_periode}</strong> (Periode: {bundle?.tanggal_awal} s/d {bundle?.tanggal_akhir}).
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Hasil kalkulasi payroll ini akan diteruskan ke modul SIKEU untuk verifikasi pembayaran gaji pegawai.
          </p>
        </div>
      </Modal>
    </div>
  );
}
