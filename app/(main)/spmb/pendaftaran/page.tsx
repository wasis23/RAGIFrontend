'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Eye, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  ShieldCheck, 
  Search, 
  RotateCcw, 
  User, 
  GraduationCap, 
  Users, 
  FileCheck, 
  Award, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  Save, 
  Check, 
  AlertCircle,
  Hash,
  CreditCard
} from 'lucide-react';
import { spmbService, PendaftaranCalonMhs, PendaftaranBerkas } from '@/services/spmb.service';
import toast from 'react-hot-toast';
import { DataTable } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';

// ============================================================
// STATUS CONFIGURATION SYSTEM (SINGLE SOURCE OF TRUTH)
// ============================================================
export interface StatusConfig {
  label: string;
  variant: 'gray' | 'blue' | 'purple' | 'green' | 'red' | 'yellow' | 'cyan';
  icon: any;
  description: string;
}

export const SPMB_STATUS_CONFIG: Record<string, StatusConfig> = {
  draft: {
    label: 'Draft',
    variant: 'gray',
    icon: FileText,
    description: 'Pendaftaran belum dikirim atau dalam tahap pengisian awal.',
  },
  submitted: {
    label: 'Submitted (Menunggu Verifikasi)',
    variant: 'blue',
    icon: Clock,
    description: 'Berkas dan formulir telah dikirim, menunggu verifikasi berkas oleh admin.',
  },
  verified: {
    label: 'Verified (Terverifikasi)',
    variant: 'purple',
    icon: CheckCircle2,
    description: 'Seluruh berkas pendaftaran telah diperiksa dan dinyatakan valid.',
  },
  lulus_administrasi: {
    label: 'Lulus Administrasi',
    variant: 'green',
    icon: ShieldCheck,
    description: 'Pendaftar dinyatakan LULUS seleksi berkas dan berhak lanjut ke tahap berikutnya.',
  },
  gagal_administrasi: {
    label: 'Gagal Administrasi',
    variant: 'red',
    icon: XCircle,
    description: 'Pendaftar TIDAK LULUS seleksi administrasi. Catatan verifikasi wajib diisi.',
  },
};

export function SpmbStatusBadge({ status }: { status: string }) {
  const config = SPMB_STATUS_CONFIG[status] || {
    label: status ? status.replace('_', ' ') : 'Unknown',
    variant: 'gray' as const,
    icon: FileText,
    description: '',
  };
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-extrabold rounded-full shadow-2xs">
      <Icon size={14} className="shrink-0" />
      <span>{config.label}</span>
    </Badge>
  );
}

export function SpmbPaymentBadge({ status }: { status?: string }) {
  const isPaid = status === 'lunas';
  return (
    <Badge variant={isPaid ? 'green' : 'yellow'} className="inline-flex items-center gap-1 px-2.5 py-0.5 text-2xs font-extrabold rounded-full border border-slate-200 shadow-2xs">
      {isPaid ? <CheckCircle2 size={12} className="text-emerald-600" /> : <Clock size={12} className="text-amber-600" />}
      <span>{isPaid ? 'Bayar: Lunas' : 'Bayar: Belum Lunas'}</span>
    </Badge>
  );
}

// ============================================================
// CLEAN KEY-VALUE METADATA ITEM (NO CLUTTERED BOXES)
// ============================================================
function MetadataItem({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex flex-col py-1.5">
      <span className="text-2xs font-extrabold uppercase tracking-wider text-slate-400 mb-0.5">{label}</span>
      <span className="text-sm font-bold text-slate-800 break-words leading-snug">
        {value || <span className="text-slate-400 font-normal italic text-xs">-</span>}
      </span>
    </div>
  );
}

// ============================================================
// SECTION ACCORDION WRAPPER (CLEAN ENTERPRISE DESIGN)
// ============================================================
function DetailSection({ 
  title, 
  icon: Icon, 
  children, 
  defaultOpen = true,
  badgeCount
}: { 
  title: string; 
  icon: any; 
  children: React.ReactNode; 
  defaultOpen?: boolean;
  badgeCount?: number;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-slate-200 rounded-xl bg-white shadow-2xs overflow-hidden transition-all duration-200">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-slate-50/80 hover:bg-slate-100/80 flex items-center justify-between border-b border-slate-200/60 transition-colors text-left"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-primary-100/60 text-primary-700">
            <Icon size={16} />
          </div>
          <span className="font-bold text-slate-800 text-sm">{title}</span>
          {badgeCount !== undefined && (
            <span className="px-2 py-0.5 text-2xs font-extrabold rounded-full bg-slate-200 text-slate-700">
              {badgeCount}
            </span>
          )}
        </div>
        <div className="text-slate-400 p-1">
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>
      {isOpen && (
        <div className="p-4 animate-fade-in divide-y divide-slate-100">
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN PAGE COMPONENT
// ============================================================
export default function DataPendaftarPage() {
  const [data, setData] = useState<PendaftaranCalonMhs[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Pagination & Filtering state
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [totalItems, setTotalItems] = useState(0);

  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterOrderBy, setFilterOrderBy] = useState('created_at');
  const [filterOrderDir, setFilterOrderDir] = useState('desc');
  
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    status: '',
    orderBy: 'created_at',
    orderDir: 'desc'
  });

  // Detail Drawer state
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [selectedPendaftar, setSelectedPendaftar] = useState<PendaftaranCalonMhs | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Status update state
  const [updateStatusLoading, setUpdateStatusLoading] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [catatanVerifikasi, setCatatanVerifikasi] = useState('');

  const [paginationMeta, setPaginationMeta] = useState<any>(null);

  const [isForbidden, setIsForbidden] = useState(false);

  // Fetch Pendaftaran list with server-side pagination
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setIsForbidden(false);
      const queryParams: any = {
        page,
        per_page: perPage,
        order_by: appliedFilters.orderBy,
        order_dir: appliedFilters.orderDir,
      };
      if (appliedFilters.search?.trim()) {
        queryParams.search = appliedFilters.search.trim();
      }
      if (appliedFilters.status?.trim()) {
        queryParams.status = appliedFilters.status.trim();
      }

      const res = await spmbService.getPendaftaran(queryParams);

      let listData: any[] = [];
      let rawMeta: any = null;

      if (Array.isArray(res)) {
        listData = res;
      } else if (Array.isArray(res?.data)) {
        listData = res.data;
        rawMeta = res;
      } else if (Array.isArray(res?.data?.data)) {
        listData = res.data.data;
        rawMeta = res.data;
      } else if (Array.isArray(res?.data?.data?.data)) {
        listData = res.data.data.data;
        rawMeta = res.data.data;
      }

      setData(listData);
      const calculatedTotal = rawMeta?.total ?? listData.length;
      setTotalItems(calculatedTotal);

      if (rawMeta) {
        setPaginationMeta({
          current_page: rawMeta.current_page || page,
          last_page: rawMeta.last_page || 1,
          per_page: rawMeta.per_page || perPage,
          total: calculatedTotal,
          from: rawMeta.from || (listData.length > 0 ? (page - 1) * perPage + 1 : 0),
          to: rawMeta.to || Math.min(page * perPage, calculatedTotal),
        });
      }
    } catch (error: any) {
      if (error?.response?.status === 403 || error?.response?.status === 404 || error?.status === 403) {
        setIsForbidden(true);
      } else {
        toast.error(error.message || 'Gagal memuat data pendaftar');
      }
    } finally {
      setLoading(false);
    }
  }, [page, perPage, appliedFilters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch Detail Pendaftaran by ID
  const fetchDetail = async (id: number) => {
    try {
      setDetailLoading(true);
      const res = await spmbService.getPendaftaranDetail(id);
      const pData = res.data?.id ? res.data : res.data?.data || res;
      setSelectedPendaftar(pData);
      setNewStatus(pData.status || 'draft');
      setCatatanVerifikasi(pData.catatan_verifikasi || '');
    } catch (error: any) {
      toast.error(error.message || 'Gagal memuat detail pendaftar');
    } finally {
      setDetailLoading(false);
    }
  };

  const router = useRouter();

  const handleOpenDetail = (row: PendaftaranCalonMhs) => {
    router.push(`/spmb/pendaftaran/${row.id}`);
  };

  // Document Verification Handler
  const handleVerifyBerkas = async (berkasId: number, isVerified: boolean) => {
    try {
      await spmbService.verifyBerkasPendaftaran(berkasId, { is_verified: isVerified });
      toast.success(`Berkas ditandai sebagai ${isVerified ? 'Valid' : 'Belum Valid'}`);
      if (selectedPendaftar) {
        fetchDetail(selectedPendaftar.id);
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal memverifikasi berkas');
    }
  };

  // Administration Decision Update Handler
  const handleUpdateStatus = async () => {
    if (!selectedPendaftar) return;
    try {
      setUpdateStatusLoading(true);
      await spmbService.updateStatusPendaftaran(selectedPendaftar.id, { 
        status: newStatus, 
        catatan_verifikasi: catatanVerifikasi 
      });
      toast.success('Keputusan pendaftaran berhasil disimpan');
      fetchData();
      fetchDetail(selectedPendaftar.id);
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan keputusan pendaftaran');
    } finally {
      setUpdateStatusLoading(false);
    }
  };

  if (isForbidden) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 animate-fade-in">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 border border-red-100 shadow-2xs">
          <AlertCircle size={32} />
        </div>
        <h1 className="text-4xl font-black text-slate-800 mb-1">404</h1>
        <h2 className="text-lg font-bold text-slate-700 mb-2">Halaman Tidak Ditemukan</h2>
        <p className="text-slate-500 text-sm max-w-md mb-6">
          Halaman ini tidak tersedia atau Anda tidak memiliki hak akses yang dikonfigurasikan untuk role Anda.
        </p>
        <Button variant="primary" onClick={() => router.push('/spmb/dashboard')}>
          Kembali ke Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header with Real Data Count */}
      <PageHeader
        title="Data Pendaftaran"
        description="Kelola dan verifikasi berkas pendaftaran calon mahasiswa baru."
        action={
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-50 border border-primary-100 text-primary-700 font-extrabold text-xs">
              <Award size={14} />
              {totalItems} Pendaftar
            </span>

            <Button 
              variant="outline"
              icon={<Filter size={16} />} 
              onClick={() => setShowFilter(true)}
              className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50 font-bold shadow-2xs"
            >
              Filter {appliedFilters.status || appliedFilters.search ? '•' : ''}
            </Button>
          </div>
        }
      />

      {/* RESPONSIVE DATA DISPLAY: DESKTOP TABLE vs MOBILE CARDS */}
      
      {/* 1. DESKTOP VIEW (Table) */}
      <div className="hidden md:block">
        <DataTable 
          data={data}
          isLoading={loading}
          meta={paginationMeta}
          onPageChange={(p) => setPage(p)}
          onLimitChange={(l) => setPerPage(l)}
          columns={[
            { 
              key: 'no_pendaftaran', 
              label: 'No. Pendaftaran', 
              render: (row) => (
                <span className="font-mono font-bold text-slate-800 text-xs bg-slate-100 px-2 py-1 rounded border border-slate-200">
                  {row.no_pendaftaran}
                </span>
              )
            },
            { 
              key: 'nama_lengkap', 
              label: 'Nama Pendaftar', 
              render: (row) => (
                <div className="flex flex-col">
                  <span className="font-bold text-slate-900 text-sm">{row.nama_lengkap}</span>
                  <span className="text-xs text-slate-500">NIK: {row.nik || '-'}</span>
                </div>
              )
            },
            { 
              key: 'program_studi', 
              label: 'Program Studi Pilihan', 
              render: (row) => (
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-800 text-xs">
                    1. {row.program_studi?.nama || '-'}
                  </span>
                  {row.program_studi_pilihan2?.nama && (
                    <span className="text-2xs text-slate-500">
                      2. {row.program_studi_pilihan2.nama}
                    </span>
                  )}
                </div>
              )
            },
            { 
              key: 'status', 
              label: 'Status Pendaftaran & Pembayaran', 
              render: (row) => (
                <div className="flex flex-col items-start gap-1">
                  <SpmbStatusBadge status={row.status} />
                  <SpmbPaymentBadge status={row.status_pembayaran} />
                </div>
              )
            },
            { 
              key: 'actions', 
              label: 'Aksi', 
              align: 'right', 
              render: (row) => (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  icon={<Eye size={15} />} 
                  onClick={() => handleOpenDetail(row)}
                  className="text-primary-600 hover:bg-primary-50 font-bold"
                >
                  Verifikasi
                </Button>
              )
            }
          ]}
        />
      </div>

      {/* 2. MOBILE VIEW (Mobile-First Registration Cards) */}
      <div className="block md:hidden space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-4 animate-pulse space-y-3">
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                <div className="h-8 bg-slate-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : data.length === 0 ? (
          <EmptyState
            icon={<FileText size={40} className="text-slate-400" />}
            title="Data Pendaftaran Tidak Ditemukan"
            description="Belum ada data pendaftar calon mahasiswa yang sesuai dengan pencarian atau filter saat ini."
            action={
              (appliedFilters.search || appliedFilters.status) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilterSearch('');
                    setFilterStatus('');
                    setAppliedFilters({ search: '', status: '', orderBy: 'created_at', orderDir: 'desc' });
                    setPage(1);
                  }}
                  className="mt-2"
                >
                  Reset Filter
                </Button>
              )
            }
          />
        ) : (
          <div className="space-y-3">
            {data.map((row) => (
              <div 
                key={row.id} 
                onClick={() => handleOpenDetail(row)}
                className="card p-4 bg-white border border-slate-200 shadow-2xs rounded-xl hover:border-primary-300 transition-all cursor-pointer space-y-3 active:bg-slate-50"
              >
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{row.nama_lengkap}</h3>
                    <span className="font-mono text-xs font-semibold text-slate-500">
                      {row.no_pendaftaran}
                    </span>
                  </div>
                  <SpmbStatusBadge status={row.status} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-2xs font-medium">NIK</span>
                    <span className="text-slate-700 font-semibold">{row.nik || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-2xs font-medium">Prodi Pilihan</span>
                    <span className="text-slate-700 font-semibold truncate block">
                      {row.program_studi?.nama || '-'}
                    </span>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between text-xs text-primary-600 font-bold">
                  <span>Buka Verifikasi Detail</span>
                  <span>→</span>
                </div>
              </div>
            ))}

            {/* Mobile Pagination Controls */}
            {paginationMeta && (
              <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-600">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  ← Sebelumnya
                </Button>
                <span>Halaman {page} dari {paginationMeta.last_page || 1}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page >= (paginationMeta.last_page || 1)}
                  onClick={() => setPage(page + 1)}
                >
                  Berikutnya →
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FILTER DRAWER */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Data Pendaftar"
        width="400px"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button 
              variant="outline" 
              onClick={() => {
                setFilterSearch('');
                setFilterStatus('');
                setFilterOrderBy('created_at');
                setFilterOrderDir('desc');
                setAppliedFilters({ search: '', status: '', orderBy: 'created_at', orderDir: 'desc' });
                setShowFilter(false);
                setPage(1);
              }}
              className="w-1/2"
            >
              Reset
            </Button>
            <Button 
              variant="primary" 
              onClick={() => {
                setAppliedFilters({
                  search: filterSearch,
                  status: filterStatus,
                  orderBy: filterOrderBy,
                  orderDir: filterOrderDir
                });
                setShowFilter(false);
                setPage(1);
              }}
              className="w-1/2 font-bold"
            >
              Terapkan
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <Input 
            label="Pencarian Global"
            placeholder="Ketik nama, NIK, atau No. Pendaftaran..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />

          <Select 
            label="Status Pendaftaran"
            value={filterStatus}
            onChange={(val) => setFilterStatus(val)}
            options={[
              { value: '', label: 'Semua Status Pendaftaran' },
              { value: 'draft', label: 'Draft' },
              { value: 'submitted', label: 'Submitted (Menunggu Verifikasi)' },
              { value: 'verified', label: 'Verified (Terverifikasi)' },
              { value: 'lulus_administrasi', label: 'Lulus Administrasi' },
              { value: 'gagal_administrasi', label: 'Gagal Administrasi' }
            ]}
          />
          
          <hr style={{ borderTop: '1px solid var(--border-light)', margin: '0.5rem 0' }} />

          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Urut Berdasarkan"
              value={filterOrderBy}
              onChange={(val) => setFilterOrderBy(val)}
              options={[
                { value: 'created_at', label: 'Tanggal Daftar' },
                { value: 'nama_lengkap', label: 'Nama Pendaftar' },
                { value: 'no_pendaftaran', label: 'No Pendaftaran' },
                { value: 'status', label: 'Status' }
              ]}
            />

            <Select 
              label="Arah"
              value={filterOrderDir}
              onChange={(val) => setFilterOrderDir(val)}
              options={[
                { value: 'asc', label: 'A - Z (Ascending)' },
                { value: 'desc', label: 'Z - A (Descending)' }
              ]}
            />
          </div>
        </div>
      </Drawer>

      {/* DETAIL & VERIFIKASI PANEL (PREMIUM HIGH-CONTRAST REDESIGN) */}
      <Drawer
        open={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        title="Detail & Verifikasi Pendaftaran"
        width="540px"
      >
        {detailLoading || !selectedPendaftar ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="spinner spinner-primary"></div>
            <span className="text-xs font-semibold text-slate-500">Memuat detail pendaftaran...</span>
          </div>
        ) : (
          <div className="space-y-5 pb-20 md:pb-6">
            
            {/* 1. VISUAL ANCHOR HEADER (CRYSTAL CLEAR HIGH CONTRAST) */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 border-l-4 border-l-primary-600 shadow-2xs flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-2xs font-extrabold text-slate-400 uppercase tracking-widest block">NAMA PENDAFTAR</span>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
                    {selectedPendaftar.nama_lengkap}
                  </h3>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <SpmbStatusBadge status={selectedPendaftar.status} />
                  <SpmbPaymentBadge status={selectedPendaftar.status_pembayaran} />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-1.5 bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200 font-mono font-bold">
                  <Hash size={13} className="text-slate-400 shrink-0" />
                  <span>{selectedPendaftar.no_pendaftaran}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-500 font-semibold">
                  <CreditCard size={13} className="text-slate-400 shrink-0" />
                  <span>NIK: {selectedPendaftar.nik || '-'}</span>
                </div>
              </div>
            </div>

            {/* 2. PROGRESSIVE DISCLOSURE SECTIONS (CLEAN DEFINITION GRIDS) */}

            {/* SECTION A: BIODATA & IDENTITAS */}
            <DetailSection title="Identitas & Biodata Pendaftar" icon={User} defaultOpen={true}>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-1">
                <MetadataItem label="Tempat, Tgl Lahir" value={`${selectedPendaftar.tempat_lahir || '-'}, ${selectedPendaftar.tanggal_lahir ? new Date(selectedPendaftar.tanggal_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}`} />
                <MetadataItem label="Jenis Kelamin" value={selectedPendaftar.jenis_kelamin === 'L' ? 'Laki-laki' : selectedPendaftar.jenis_kelamin === 'P' ? 'Perempuan' : '-'} />
                <MetadataItem label="Agama" value={selectedPendaftar.agama} />
                <MetadataItem label="Kewarganegaraan" value={selectedPendaftar.kewarganegaraan} />
                <MetadataItem label="No. Handphone" value={selectedPendaftar.no_hp || selectedPendaftar.user?.phone} />
                <MetadataItem label="Email Account" value={selectedPendaftar.user?.email || selectedPendaftar.user?.username} />
              </div>
              <div className="pt-2">
                <MetadataItem label="Alamat Lengkap" value={selectedPendaftar.alamat} />
              </div>
            </DetailSection>

            {/* SECTION B: INFORMASI AKADEMIK & PRODI */}
            <DetailSection title="Informasi Akademik & Prodi" icon={GraduationCap} defaultOpen={true}>
              <div className="space-y-3 pt-1">
                {/* Highlight Card for Program Studi */}
                <div className="p-3.5 bg-gradient-to-br from-primary-50/80 to-blue-50/40 border border-primary-200/80 rounded-xl space-y-1">
                  <span className="text-2xs font-extrabold text-primary-700 uppercase tracking-widest block">PROGRAM STUDI PILIHAN</span>
                  <div className="text-sm font-black text-slate-900">
                    1. {selectedPendaftar.program_studi?.nama || '-'} <span className="text-xs font-semibold text-primary-700">({selectedPendaftar.program_studi?.jenjang || 'S1'})</span>
                  </div>
                  {selectedPendaftar.program_studi_pilihan2?.nama && (
                    <div className="text-xs font-bold text-slate-700">
                      2. {selectedPendaftar.program_studi_pilihan2.nama} <span className="text-2xs text-slate-500">({selectedPendaftar.program_studi_pilihan2.jenjang || 'S1'})</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-1">
                  <MetadataItem label="Asal Sekolah" value={selectedPendaftar.asal_sekolah} />
                  <MetadataItem label="Jurusan Sekolah" value={selectedPendaftar.jurusan_sekolah} />
                  <MetadataItem label="Tahun Lulus" value={selectedPendaftar.tahun_lulus} />
                  <MetadataItem label="NPSN Sekolah" value={selectedPendaftar.npsn_sekolah} />
                  <MetadataItem label="Nilai Rata Rapor" value={selectedPendaftar.nilai_rata_rapor ? String(selectedPendaftar.nilai_rata_rapor) : '-'} />
                  <MetadataItem label="Gelombang Penerimaan" value={selectedPendaftar.gelombang_penerimaan?.nama || 'Gelombang 1'} />
                </div>
              </div>
            </DetailSection>

            {/* SECTION C: DATA ORANG TUA / WALI */}
            <DetailSection title="Data Orang Tua & Wali" icon={Users} defaultOpen={false}>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-1">
                <MetadataItem label="Nama Ayah" value={selectedPendaftar.nama_ayah} />
                <MetadataItem label="Pekerjaan Ayah" value={selectedPendaftar.pekerjaan_ayah} />
                <MetadataItem label="Nama Ibu" value={selectedPendaftar.nama_ibu} />
                <MetadataItem label="Pekerjaan Ibu" value={selectedPendaftar.pekerjaan_ibu} />
                <MetadataItem label="Penghasilan Ortu" value={selectedPendaftar.penghasilan_ortu} />
                <MetadataItem label="Wali / Telepon" value={selectedPendaftar.nama_wali ? `${selectedPendaftar.nama_wali} (${selectedPendaftar.telepon_wali || '-'})` : '-'} />
              </div>
            </DetailSection>

            {/* SECTION D: DOCUMENT VERIFICATION */}
            <DetailSection 
              title="Berkas Pendukung" 
              icon={FileCheck} 
              defaultOpen={true}
              badgeCount={selectedPendaftar.dokumen_pendaftaran?.length || 0}
            >
              {(!selectedPendaftar.dokumen_pendaftaran || selectedPendaftar.dokumen_pendaftaran.length === 0) ? (
                <EmptyState
                  icon={<FileText size={32} className="text-slate-400" />}
                  title="Belum ada berkas terunggah"
                  description="Calon mahasiswa ini belum mengunggah berkas persyaratan pendaftaran."
                  className="py-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl"
                />
              ) : (
                <div className="space-y-3 pt-1">
                  {selectedPendaftar.dokumen_pendaftaran.map((berkas: PendaftaranBerkas) => (
                    <div key={berkas.id} className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-primary-300 shadow-2xs transition-all space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-primary-600 shrink-0" />
                          <span className="font-bold text-slate-900 text-xs capitalize">
                            {(berkas.jenis_berkas || berkas.jenis_dokumen || 'dokumen').replace(/_/g, ' ')}
                          </span>
                        </div>
                        {berkas.is_verified ? (
                          <Badge variant="green" className="text-2xs font-bold px-2.5 py-0.5">
                            <Check size={11} className="mr-1" /> Valid
                          </Badge>
                        ) : (
                          <Badge variant="yellow" className="text-2xs font-bold px-2.5 py-0.5">
                            <Clock size={11} className="mr-1" /> Belum Valid
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                        <a 
                          href={`http://localhost:8000/storage/${berkas.file_path}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-800 font-bold hover:underline"
                        >
                          <ExternalLink size={13} />
                          Lihat Dokumen
                        </a>
                        <div className="flex items-center gap-1.5">
                          <Button 
                            size="sm" 
                            variant={berkas.is_verified ? "primary" : "outline"}
                            onClick={() => handleVerifyBerkas(berkas.id, true)}
                            className="text-2xs py-1 px-3 h-7 font-extrabold"
                          >
                            Set Valid
                          </Button>
                          <Button 
                            size="sm" 
                            variant={!berkas.is_verified ? "danger" : "outline"}
                            onClick={() => handleVerifyBerkas(berkas.id, false)}
                            className="text-2xs py-1 px-3 h-7 font-extrabold"
                          >
                            Tidak Valid
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DetailSection>

            {/* SECTION E: KEPUTUSAN ADMINISTRASI (HIGH PRIORITY ACTION CARD) */}
            <div className="p-4.5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-2.5">
                <ShieldCheck size={20} className="text-primary-600" />
                <h4 className="font-black text-sm uppercase tracking-wide">Keputusan Administrasi</h4>
              </div>

              <div className="space-y-4">
                <Select
                  label="Status Pendaftaran"
                  value={newStatus}
                  onChange={(val) => setNewStatus(val)}
                  options={[
                    { value: 'draft', label: 'Draft (Pengisian)' },
                    { value: 'submitted', label: 'Submitted (Menunggu Verifikasi)' },
                    { value: 'verified', label: 'Verified (Berkas Terverifikasi)' },
                    { value: 'lulus_administrasi', label: 'Lulus Administrasi (Lanjut Tes/Pengumuman)' },
                    { value: 'gagal_administrasi', label: 'Gagal Administrasi (Ditolak)' }
                  ]}
                />

                {/* HELPER TEXT BASED ON SELECTED DECISION */}
                {newStatus === 'gagal_administrasi' && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-800 text-xs">
                    <AlertCircle size={15} className="text-red-600 shrink-0 mt-0.5" />
                    <span><strong>Perhatian:</strong> Mohon jelaskan alasan penolakan secara spesifik pada catatan verifikasi di bawah.</span>
                  </div>
                )}
                {newStatus === 'lulus_administrasi' && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2 text-emerald-800 text-xs">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>Calon mahasiswa akan mendapatkan status LUNAS Administrasi dan berhak mengikuti seleksi berikutnya.</span>
                  </div>
                )}

                <Textarea
                  label="Catatan Verifikasi (Tampil ke Calon Mhs)"
                  value={catatanVerifikasi}
                  onChange={(e) => setCatatanVerifikasi(e.target.value)}
                  placeholder="Contoh: Berkas Ijazah belum terunggah dengan jelas, mohon unggah ulang..."
                  rows={3}
                />

                <Button 
                  onClick={handleUpdateStatus} 
                  isLoading={updateStatusLoading}
                  variant="primary"
                  icon={<Save size={16} />}
                  className="w-full font-black shadow-md min-h-[44px] text-sm"
                >
                  {updateStatusLoading ? 'Menyimpan Keputusan...' : 'Simpan Keputusan'}
                </Button>
              </div>
            </div>

          </div>
        )}
      </Drawer>
    </div>
  );
}
