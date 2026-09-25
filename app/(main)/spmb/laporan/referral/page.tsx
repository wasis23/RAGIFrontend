'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Filter, Gift, Users, Award, Ban, AlertCircle, RotateCcw, Check, Plus } from 'lucide-react';
import { spmbService } from '@/services/spmb.service';
import type { ReferralReportItem, GelombangPenerimaan } from '@/types/spmb.types';
import type { PaginationMeta } from '@/types/api.types';
import toast from 'react-hot-toast';
import { DataTable } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Badge } from '@/components/ui/Badge';

const STATUS_LABEL: Record<string, string> = {
  claimed: 'Terklaim',
  qualified: 'Lolos Administrasi',
  rewarded: 'Reward Diberikan',
  cancelled: 'Dibatalkan',
};

function ReferralStatusBadge({ status }: { status: string }) {
  const isAccent = status === 'qualified' || status === 'rewarded';
  return (
    <Badge
      className={isAccent ? '' : 'bg-slate-100 text-slate-600 border border-slate-200'}
      style={isAccent ? { backgroundColor: 'color-mix(in srgb, var(--module-primary) 12%, white)', color: 'var(--module-primary)', borderColor: 'color-mix(in srgb, var(--module-primary) 35%, white)' } : undefined}
    >
      {STATUS_LABEL[status] || status}
    </Badge>
  );
}

export default function LaporanReferralPage() {
  const router = useRouter();
  const [data, setData] = useState<ReferralReportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isForbidden, setIsForbidden] = useState(false);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | undefined>(undefined);
  const [summary, setSummary] = useState({ claimed: 0, qualified: 0, rewarded: 0, cancelled: 0 });

  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterReferrer, setFilterReferrer] = useState('');
  const [filterPendaftar, setFilterPendaftar] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCode, setFilterCode] = useState('');
  const [filterGelombang, setFilterGelombang] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterOrderBy, setFilterOrderBy] = useState('created_at');
  const [filterOrderDir, setFilterOrderDir] = useState('desc');
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    referrer: '',
    pendaftar: '',
    status: '',
    referral_code: '',
    gelombang_id: '',
    start_date: '',
    end_date: '',
    orderBy: 'created_at',
    orderDir: 'desc',
  });

  const loadGelombangOptions = useCallback(async (input: string) => {
    const res = await spmbService.getGelombang({ nama: input || undefined, per_page: 50 });
    const items: GelombangPenerimaan[] = res?.data || [];
    return items.map((g) => ({ value: String(g.id), label: g.nama }));
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setIsForbidden(false);
      const params: {
        page: number;
        per_page: number;
        sort_by: string;
        sort_order: string;
        search?: string;
        referrer?: string;
        pendaftar?: string;
        status?: string;
        referral_code?: string;
        gelombang_id?: string;
        start_date?: string;
        end_date?: string;
      } = {
        page,
        per_page: perPage,
        sort_by: appliedFilters.orderBy,
        sort_order: appliedFilters.orderDir,
      };
      if (appliedFilters.search.trim()) params.search = appliedFilters.search.trim();
      if (appliedFilters.referrer.trim()) params.referrer = appliedFilters.referrer.trim();
      if (appliedFilters.pendaftar.trim()) params.pendaftar = appliedFilters.pendaftar.trim();
      if (appliedFilters.status.trim()) params.status = appliedFilters.status.trim();
      if (appliedFilters.referral_code.trim()) params.referral_code = appliedFilters.referral_code.trim();
      if (appliedFilters.gelombang_id.trim()) params.gelombang_id = appliedFilters.gelombang_id.trim();
      if (appliedFilters.start_date.trim()) params.start_date = appliedFilters.start_date.trim();
      if (appliedFilters.end_date.trim()) params.end_date = appliedFilters.end_date.trim();

      const res = await spmbService.getReferralReport(params);
      setData(res?.data || []);
      if (res?.meta) {
        setPaginationMeta({
          current_page: res.meta.current_page,
          last_page: res.meta.last_page,
          per_page: res.meta.per_page,
          total: res.meta.total,
          from: res.meta.from,
          to: res.meta.to,
        });
      }
      try {
        const summaryRes = await spmbService.getReferralSummary();
        if (summaryRes?.data) setSummary(summaryRes.data);
      } catch {
        // Ringkasan opsional; daftar tetap tampil bila endpoint belum tersedia.
      }
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: { message?: string } } };
      if (err?.response?.status === 403) {
        setIsForbidden(true);
      } else {
        toast.error(err?.response?.data?.message || 'Gagal memuat laporan referral');
      }
    } finally {
      setLoading(false);
    }
  }, [page, perPage, appliedFilters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isForbidden) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 animate-fade-in">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 border border-red-100 shadow-2xs">
          <AlertCircle size={20} />
        </div>
        <h1 className="text-4xl font-black text-slate-800 mb-1">403</h1>
        <h2 className="text-lg font-bold text-slate-700 mb-2">Akses Ditolak</h2>
        <p className="text-slate-500 text-sm max-w-md">
          Anda tidak memiliki hak akses untuk melihat laporan referral SPMB.
        </p>
      </div>
    );
  }

  const summaryItems = [
    { label: 'Terklaim', value: summary.claimed, icon: Gift, accent: false },
    { label: 'Lolos Administrasi', value: summary.qualified, icon: Users, accent: true },
    { label: 'Reward Diberikan', value: summary.rewarded, icon: Award, accent: true },
    { label: 'Dibatalkan', value: summary.cancelled, icon: Ban, accent: false },
  ];

  return (
    <div className="animate-fade-in space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Laporan Referral"
        description="Rekapitulasi penggunaan kode referral pada pendaftaran mahasiswa baru."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
              onClick={() => setShowFilter(true)}
            >
              Filter
            </Button>
            <Button
              icon={<Plus size={16} />}
              style={{ backgroundColor: 'var(--module-primary)', color: 'white' }}
              onClick={() => router.push('/spmb/pendaftaran')}
            >
              Tambah Data
            </Button>
          </div>
        }
      />

      <Badge
        className="inline-flex items-center gap-2 px-3 py-2 rounded-full font-extrabold text-xs w-fit"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--module-primary) 12%, white)',
          color: 'var(--module-primary)',
          borderColor: 'var(--module-primary)',
        }}
      >
        <Award size={16} />
        {summary.qualified} Lolos
      </Badge>

      {/* Ringkasan Status */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryItems.map((item) => (
          <div key={item.label} className="card p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-extrabold uppercase tracking-wider text-slate-400">{item.label}</span>
              <item.icon size={16} className={item.accent ? 'text-[var(--module-primary)]' : 'text-slate-400'} />
            </div>
            <span className={`text-2xl font-black ${item.accent ? 'text-[var(--module-primary)]' : 'text-slate-900'}`}>
              {item.value}
            </span>
          </div>
        ))}
      </div>

      <div className="hidden md:block w-full bg-white rounded-xl border border-slate-200 shadow-2xs">
        <DataTable
          data={data}
          isLoading={loading}
          meta={paginationMeta}
          onPageChange={(p) => setPage(p)}
          onLimitChange={(l) => {
            setPerPage(l);
            setPage(1);
          }}
          columns={[
            {
              key: 'referrer',
              label: 'Referrer',
              render: (row) => (
                <div className="flex flex-col">
                  <span className="font-bold text-slate-900 text-xs">{row.referrer?.name || row.referrer?.username || '-'}</span>
                  <span className="text-2xs text-slate-500 font-mono">{row.referral_code}</span>
                </div>
              ),
            },
            {
              key: 'pendaftaran',
              label: 'Pendaftar',
              render: (row) => (
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-800 text-xs">{row.pendaftaran?.nama_lengkap || row.nama_pendaftar || '-'}</span>
                  <span className="text-2xs text-slate-500 font-mono">{row.no_pendaftaran || '-'}</span>
                </div>
              ),
            },
            {
              key: 'gelombang',
              label: 'Gelombang',
              render: (row) => (
                <span className="text-xs text-slate-700">{row.pendaftaran?.gelombang_penerimaan?.nama || '-'}</span>
              ),
            },
            {
              key: 'status',
              label: 'Status Referral',
              render: (row) => <ReferralStatusBadge status={row.status} />,
            },
            {
              key: 'created_at',
              label: 'Tanggal',
              render: (row) => (
                <span className="text-xs text-slate-600">
                  {row.created_at ? new Date(row.created_at).toLocaleDateString('id-ID') : '-'}
                </span>
              ),
            },
          ]}
        />
      </div>

      {/* Mobile Cards */}
      <div className="block md:hidden space-y-4">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="card p-4 animate-pulse space-y-4">
              <div className="h-4 bg-slate-200 rounded w-1/2" />
              <div className="h-3 bg-slate-200 rounded w-3/4" />
            </div>
          ))
        ) : data.length === 0 ? (
          <div className="card p-6 text-center text-sm text-slate-500">Belum ada data referral.</div>
        ) : (
          data.map((row) => (
            <div key={row.id} className="card p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-4">
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{row.referrer?.name || row.referrer?.username || '-'}</h3>
                  <span className="font-mono text-2xs text-slate-500">{row.referral_code}</span>
                </div>
                <ReferralStatusBadge status={row.status} />
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-2xs font-medium">Pendaftar</span>
                  <span className="text-slate-700 font-semibold">{row.pendaftaran?.nama_lengkap || row.nama_pendaftar || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-2xs font-medium">No. Pendaftaran</span>
                  <span className="text-slate-700 font-semibold font-mono">{row.no_pendaftaran || '-'}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Drawer
        position="right"
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Laporan Referral"
        width="400px"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button
              variant="outline"
              className="w-1/2"
              icon={<RotateCcw size={16} />}
              onClick={() => {
                setFilterSearch('');
                setFilterReferrer('');
                setFilterPendaftar('');
                setFilterStatus('');
                setFilterCode('');
                setFilterGelombang('');
                setFilterStartDate('');
                setFilterEndDate('');
                setFilterOrderBy('created_at');
                setFilterOrderDir('desc');
                setAppliedFilters({
                  search: '',
                  referrer: '',
                  pendaftar: '',
                  status: '',
                  referral_code: '',
                  gelombang_id: '',
                  start_date: '',
                  end_date: '',
                  orderBy: 'created_at',
                  orderDir: 'desc',
                });
                setShowFilter(false);
                setPage(1);
              }}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              className="w-1/2 font-bold"
              icon={<Check size={16} />}
              onClick={() => {
                setAppliedFilters({
                  search: filterSearch,
                  referrer: filterReferrer,
                  pendaftar: filterPendaftar,
                  status: filterStatus,
                  referral_code: filterCode,
                  gelombang_id: filterGelombang,
                  start_date: filterStartDate,
                  end_date: filterEndDate,
                  orderBy: filterOrderBy,
                  orderDir: filterOrderDir,
                });
                setShowFilter(false);
                setPage(1);
              }}
            >
              Terapkan
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Pencarian Global"
            placeholder="Cari referrer / pendaftar / no pendaftaran..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />

          <Input
            label="Referrer"
            placeholder="Nama / username / email referrer"
            value={filterReferrer}
            onChange={(e) => setFilterReferrer(e.target.value)}
          />

          <Input
            label="Pendaftar / No. Pendaftaran"
            placeholder="Nama atau nomor pendaftaran"
            value={filterPendaftar}
            onChange={(e) => setFilterPendaftar(e.target.value)}
          />

          <Input
            label="Kode Referral"
            placeholder="REF-A1B2C3"
            value={filterCode}
            onChange={(e) => setFilterCode(e.target.value.toUpperCase())}
          />

          <Select
            label="Status Referral"
            value={filterStatus}
            onChange={(val) => setFilterStatus(val)}
            options={[
              { value: '', label: 'Semua Status' },
              { value: 'claimed', label: 'Terklaim' },
              { value: 'qualified', label: 'Lolos Administrasi' },
              { value: 'rewarded', label: 'Reward Diberikan' },
              { value: 'cancelled', label: 'Dibatalkan' },
            ]}
          />

          <AsyncSelect
            label="Gelombang"
            placeholder="Pilih Gelombang"
            isClearable
            defaultOptions
            loadOptions={loadGelombangOptions}
            value={filterGelombang || null}
            onChange={(sel: { value?: string } | null) => setFilterGelombang(sel?.value ? String(sel.value) : '')}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Tanggal Mulai"
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
            />
            <Input
              label="Tanggal Selesai"
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
            />
          </div>

          <hr className="border-slate-200 my-4" />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={filterOrderBy}
              onChange={(val) => setFilterOrderBy(val)}
              options={[
                { value: 'created_at', label: 'Tanggal' },
                { value: 'referrer', label: 'Referrer' },
                { value: 'pendaftar', label: 'Pendaftar' },
                { value: 'gelombang', label: 'Gelombang' },
                { value: 'status', label: 'Status Referral' },
                { value: 'referral_code', label: 'Kode Referral' },
              ]}
            />
            <Select
              label="Arah"
              value={filterOrderDir}
              onChange={(val) => setFilterOrderDir(val)}
              options={[
                { value: 'asc', label: 'A - Z (Ascending)' },
                { value: 'desc', label: 'Z - A (Descending)' },
              ]}
            />
          </div>
        </div>
      </Drawer>
    </div>
  );
}
