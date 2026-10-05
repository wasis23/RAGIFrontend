'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarCheck,
  Home,
  Boxes,
  Plus,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
  UserCheck,
  FileText,
  Info,
  Eye,
  Printer,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { formatDate } from '@/lib/utils';
import { sinapraService } from '@/services/sinapra.service';
import type {
  PeminjamanRuangan,
  ApprovePeminjamanRuanganPayload,
  PeminjamanAset,
  ApprovePeminjamanAsetPayload,
  KembalikanAsetPayload,
} from '@/types/sinapra.types';
import type { PaginationMeta } from '@/types/api.types';

export default function PeminjamanPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'ruangan' | 'aset'>('ruangan');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // ------------------------------------------------------------
  // TAB 1: PEMINJAMAN RUANGAN STATES
  // ------------------------------------------------------------
  const [ruanganList, setRuanganList] = useState<PeminjamanRuangan[]>([]);
  const [isRuanganLoading, setIsRuanganLoading] = useState(true);
  const [ruanganPage, setRuanganPage] = useState(1);
  const [ruanganMeta, setRuanganMeta] = useState<PaginationMeta | undefined>(undefined);
  const [ruanganSearch, setRuanganSearch] = useState('');
  const [ruanganStatusFilter, setRuanganStatusFilter] = useState('');
  const [ruanganSortBy, setRuanganSortBy] = useState('tanggal');
  const [ruanganSortDir, setRuanganSortDir] = useState<'asc' | 'desc'>('desc');

  const [approvingRuangan, setApprovingRuangan] = useState<PeminjamanRuangan | null>(null);
  const [isApprovingRuangan, setIsApprovingRuangan] = useState(false);
  const [approvalRuanganForm, setApprovalRuanganForm] = useState<ApprovePeminjamanRuanganPayload>({
    is_approved: true,
    catatan_approver: '',
  });

  // ------------------------------------------------------------
  // TAB 2: PEMINJAMAN ASET STATES
  // ------------------------------------------------------------
  const [asetList, setAsetList] = useState<PeminjamanAset[]>([]);
  const [isAsetLoading, setIsAsetLoading] = useState(true);
  const [asetPage, setAsetPage] = useState(1);
  const [asetMeta, setAsetMeta] = useState<PaginationMeta | undefined>(undefined);
  const [asetSearch, setAsetSearch] = useState('');
  const [asetStatusFilter, setAsetStatusFilter] = useState('');
  const [asetSortBy, setAsetSortBy] = useState('tanggal_pinjam');
  const [asetSortDir, setAsetSortDir] = useState<'asc' | 'desc'>('desc');

  // Modal Approval Aset
  const [approvingAset, setApprovingAset] = useState<PeminjamanAset | null>(null);
  const [isApprovingAset, setIsApprovingAset] = useState(false);
  const [approvalAsetForm, setApprovalAsetForm] = useState<ApprovePeminjamanAsetPayload>({
    is_approved: true,
    catatan_approver: '',
  });

  // Modal Pengembalian Aset
  const [returningAset, setReturningAset] = useState<PeminjamanAset | null>(null);
  const [returnAsetForm, setReturnAsetForm] = useState<KembalikanAsetPayload>({
    kondisi_kembali: 'baik',
    catatan: '',
  });

  // ------------------------------------------------------------
  // FETCH DATA FUNCTIONS
  // ------------------------------------------------------------
  const fetchRuanganList = async () => {
    setIsRuanganLoading(true);
    try {
      const res: any = await sinapraService.getPeminjamanRuanganList({
        page: ruanganPage,
        search: ruanganSearch,
        status: ruanganStatusFilter || undefined,
        sort_by: ruanganSortBy || undefined,
        sort_dir: ruanganSortDir || undefined,
      });

      let items = [];
      let metaData = undefined;

      if (res && Array.isArray(res.data) && 'current_page' in res) {
        items = res.data;
        metaData = {
          current_page: res.current_page,
          last_page: res.last_page,
          per_page: res.per_page,
          total: res.total,
          from: res.from,
          to: res.to,
        };
      } else if (res && res.data && Array.isArray(res.data.items)) {
        items = res.data.items;
        metaData = res.data.meta;
      } else if (res && Array.isArray(res.data)) {
        items = res.data;
      }

      setRuanganList(items);
      setRuanganMeta(metaData);
    } catch {
      toast.error('Gagal memuat daftar peminjaman ruangan.');
    } finally {
      setIsRuanganLoading(false);
    }
  };

  const fetchAsetList = async () => {
    setIsAsetLoading(true);
    try {
      const res: any = await sinapraService.getPeminjamanAsetList({
        page: asetPage,
        search: asetSearch,
        status: asetStatusFilter || undefined,
        sort_by: asetSortBy || undefined,
        sort_dir: asetSortDir || undefined,
      });

      let items = [];
      let metaData = undefined;

      if (res && Array.isArray(res.data) && 'current_page' in res) {
        items = res.data;
        metaData = {
          current_page: res.current_page,
          last_page: res.last_page,
          per_page: res.per_page,
          total: res.total,
          from: res.from,
          to: res.to,
        };
      } else if (res && res.data && Array.isArray(res.data.items)) {
        items = res.data.items;
        metaData = res.data.meta;
      } else if (res && Array.isArray(res.data)) {
        items = res.data;
      }

      setAsetList(items);
      setAsetMeta(metaData);
    } catch {
      toast.error('Gagal memuat daftar peminjaman aset.');
    } finally {
      setIsAsetLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ruangan') fetchRuanganList();
  }, [activeTab, ruanganPage, ruanganSearch, ruanganStatusFilter, ruanganSortBy, ruanganSortDir]);

  useEffect(() => {
    if (activeTab === 'aset') fetchAsetList();
  }, [activeTab, asetPage, asetSearch, asetStatusFilter, asetSortBy, asetSortDir]);



  const handleProcessApprovalRuangan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingRuangan) return;

    setIsApprovingRuangan(true);
    try {
      const isLaboranStage = approvingRuangan.status === 'pending_laboran';
      if (isLaboranStage) {
        await sinapraService.approveLaboranRuangan(approvingRuangan.id, {
          is_approved: approvalRuanganForm.is_approved,
          catatan_laboran: approvalRuanganForm.catatan_penolakan || approvalRuanganForm.catatan_approver,
        });
        toast.success(`Verifikasi laboran ruangan berhasil ${approvalRuanganForm.is_approved ? 'disetujui' : 'ditolak'}!`);
      } else {
        await sinapraService.approvePeminjamanRuangan(approvingRuangan.id, {
          is_approved: approvalRuanganForm.is_approved,
          catatan_penolakan: approvalRuanganForm.catatan_penolakan || approvalRuanganForm.catatan_approver,
        });
        toast.success(`Permohonan ruangan berhasil ${approvalRuanganForm.is_approved ? 'disetujui' : 'ditolak'}!`);
      }
      fetchRuanganList();
      setApprovingRuangan(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memproses approval ruangan.');
    } finally {
      setIsApprovingRuangan(false);
    }
  };


  const handleProcessApprovalAset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingAset) return;

    setIsApprovingAset(true);
    try {
      const isLaboranStage = approvingAset.status === 'pending_laboran';
      if (isLaboranStage) {
        await sinapraService.approveLaboranAset(approvingAset.id, {
          is_approved: approvalAsetForm.is_approved,
          catatan_laboran: approvalAsetForm.catatan_penolakan || approvalAsetForm.catatan_approver,
        });
        toast.success(`Verifikasi laboran aset berhasil ${approvalAsetForm.is_approved ? 'disetujui' : 'ditolak'}!`);
      } else {
        await sinapraService.approvePeminjamanAset(approvingAset.id, {
          is_approved: approvalAsetForm.is_approved,
          catatan_penolakan: approvalAsetForm.catatan_penolakan || approvalAsetForm.catatan_approver,
        });
        toast.success(`Permohonan aset berhasil ${approvalAsetForm.is_approved ? 'disetujui' : 'ditolak'}!`);
      }
      fetchAsetList();
      setApprovingAset(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memproses approval peminjaman aset.');
    } finally {
      setIsApprovingAset(false);
    }
  };

  const handleProcessPengembalianAset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returningAset) return;

    try {
      await sinapraService.kembalikanPeminjamanAset(returningAset.id, returnAsetForm);
      toast.success('Pengembalian barang aset berhasil diproses!');
      fetchAsetList();
      setReturningAset(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memproses pengembalian aset.');
    }
  };

  // ------------------------------------------------------------
  // COLUMNS DEFINITIONS (SIMPEG Standard: Max 12px, 2-Row Format)
  // ------------------------------------------------------------
  const ruanganColumns: ColumnDef<PeminjamanRuangan>[] = [
    {
      key: 'id_pinjam',
      label: 'ID PINJAM & TANGGAL',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-[var(--module-primary)] block text-xs">
            PR-{row.id}
          </span>
          <span className="text-2xs text-slate-400 block">
            {formatDate(row.tanggal)}
          </span>
        </div>
      ),
    },
    {
      key: 'ruangan',
      label: 'RUANGAN & GEDUNG',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-800 dark:text-slate-100 text-xs">
            {row.ruangan?.nama || `Ruangan #${row.ruangan_id}`}
          </div>
          <div className="text-2xs text-slate-400 line-clamp-1">
            {row.ruangan?.gedung?.nama || 'Gedung Kampus'}
          </div>
        </div>
      ),
    },
    {
      key: 'pemohon',
      label: 'PEMOHON & KEPERLUAN',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-800 dark:text-slate-100 text-xs">
            {row.user?.name || `User #${row.user_id}`}
          </div>
          <div className="text-2xs text-slate-500 line-clamp-1">
            {row.keperluan}
          </div>
        </div>
      ),
    },
    {
      key: 'jadwal',
      label: 'JAM PEMAKAIAN',
      render: (row) => (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {row.jam_mulai} - {row.jam_selesai} WIB
        </span>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (row) => {
        let label = row.status?.replace(/_/g, ' ');
        if (row.status === 'pending_laboran') {
          label = 'Tahap Laboran';
        } else if (row.status === 'pending_admin_sinapra') {
          label = 'Tahap Admin';
        } else if (row.status === 'disetujui') {
          label = 'Disetujui';
        } else if (row.status === 'ditolak_laboran' || row.status === 'ditolak_admin_sinapra' || row.status === 'ditolak') {
          label = row.status === 'ditolak_laboran' ? 'Ditolak Laboran' : 'Ditolak Admin';
        }

        return (
          <Badge
            style={{
              backgroundColor: 'color-mix(in srgb, var(--module-primary) 12%, transparent)',
              color: 'var(--module-primary)',
              borderColor: 'color-mix(in srgb, var(--module-primary) 25%, transparent)',
            }}
            className="text-2xs font-medium border capitalize"
          >
            {label}
          </Badge>
        );
      },
    },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (row) => {
        const canApprove = row.status === 'pending' || row.status === 'pending_laboran' || row.status === 'pending_admin_sinapra';
        const isLaboran = row.status === 'pending_laboran';

        return (
          <div className="flex justify-end">
            <DropdownMenu
              items={[
                {
                  label: 'Lihat Detail Peminjaman',
                  icon: <Eye size={16} className="text-[var(--module-primary)]" />,
                  onClick: () => router.push(`/sinapra/peminjaman/ruangan/${row.id}`),
                },
                ...(isLaboran
                  ? [
                      {
                        label: 'Verifikasi Laboran',
                        icon: <UserCheck size={16} className="text-[var(--module-primary)]" />,
                        onClick: () => router.push(`/sinapra/peminjaman/ruangan/${row.id}/verifikasi-laboran`),
                      },
                    ]
                  : canApprove
                  ? [
                      {
                        label: 'Persetujuan Admin',
                        icon: <UserCheck size={16} className="text-[var(--module-primary)]" />,
                        onClick: () => {
                          setApprovingRuangan(row);
                          setApprovalRuanganForm({ is_approved: true, catatan_approver: '' });
                        },
                      },
                    ]
                  : []),
              ]}
            />
          </div>
        );
      },
    },
  ];

  const asetColumns: ColumnDef<PeminjamanAset>[] = [
    {
      key: 'id_pinjam',
      label: 'ID PINJAM & TANGGAL',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-[var(--module-primary)] block text-xs">
            {row.kode_peminjaman || `PA-${row.id}`}
          </span>
          <span className="text-2xs text-slate-400 block">
            {formatDate(row.tanggal_pinjam)}
          </span>
        </div>
      ),
    },
    {
      key: 'aset',
      label: 'BARANG ASET & KODE',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-800 dark:text-slate-100 text-xs">
            {row.aset?.nama || `Aset #${row.aset_id}`}
          </div>
          <div className="text-2xs font-mono text-slate-400 line-clamp-1">
            [{row.aset?.kode_aset || '-'}]
          </div>
        </div>
      ),
    },
    {
      key: 'pemohon',
      label: 'PEMOHON & KEPERLUAN',
      render: (row) => {
        const identitas =
          row.nomor_identitas ||
          (row.user as any)?.mahasiswa?.nim ||
          (row.user as any)?.pegawai?.nidn ||
          (row.user as any)?.pegawai?.nuptk ||
          (row.user as any)?.pegawai?.nip;
        return (
          <div>
            <div className="font-semibold text-slate-800 dark:text-slate-100 text-xs">
              {row.user?.name || `User #${row.user_id}`}{' '}
              {identitas ? <span className="font-mono text-2xs text-slate-400 font-normal">({identitas})</span> : null}
            </div>
            <div className="text-2xs text-slate-500 line-clamp-1">
              {row.keperluan} {row.kontak_peminjam ? `• WA: ${row.kontak_peminjam}` : ''}
            </div>
          </div>
        );
      },
    },
    {
      key: 'tgl_pinjam',
      label: 'RENCANA KEMBALI',
      render: (row) => (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {formatDate(row.tanggal_kembali_rencana)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (row) => {
        let label = row.status?.replace(/_/g, ' ');
        if (row.status === 'pending_laboran') {
          label = 'Tahap Laboran';
        } else if (row.status === 'pending_admin_sinapra') {
          label = 'Tahap Admin';
        } else if (row.status === 'disetujui' || row.status === 'dipinjam') {
          label = row.status === 'dipinjam' ? 'Sedang Dipinjam' : 'Disetujui';
        } else if (row.status === 'ditolak_laboran' || row.status === 'ditolak_admin_sinapra' || row.status === 'ditolak') {
          label = row.status === 'ditolak_laboran' ? 'Ditolak Laboran' : 'Ditolak Admin';
        } else if (row.status === 'kembali') {
          label = 'Sudah Kembali';
        }

        return (
          <Badge
            style={{
              backgroundColor: 'color-mix(in srgb, var(--module-primary) 12%, transparent)',
              color: 'var(--module-primary)',
              borderColor: 'color-mix(in srgb, var(--module-primary) 25%, transparent)',
            }}
            className="text-2xs font-medium border capitalize"
          >
            {label}
          </Badge>
        );
      },
    },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (row) => {
        const canApprove = row.status === 'pending' || row.status === 'pending_laboran' || row.status === 'pending_admin_sinapra';
        const isLaboran = row.status === 'pending_laboran';

        return (
          <div className="flex justify-end">
            <DropdownMenu
              items={[
                {
                  label: 'Lihat Detail Peminjaman',
                  icon: <Eye size={16} className="text-[var(--module-primary)]" />,
                  onClick: () => router.push(`/sinapra/peminjaman/aset/${row.id}`),
                },
                ...(['disetujui', 'dipinjam', 'kembali'].includes(row.status)
                  ? [
                      {
                        label: 'Lihat Surat Peminjaman',
                        icon: <Printer size={16} className="text-blue-600" />,
                        onClick: () => router.push(`/sinapra/peminjaman/aset/${row.id}/surat`),
                      },
                    ]
                  : []),
                ...(isLaboran
                  ? [
                      {
                        label: 'Verifikasi Laboran',
                        icon: <UserCheck size={16} className="text-[var(--module-primary)]" />,
                        onClick: () => router.push(`/sinapra/peminjaman/aset/${row.id}/verifikasi-laboran`),
                      },
                    ]
                  : canApprove
                  ? [
                      {
                        label: 'Persetujuan Admin',
                        icon: <UserCheck size={16} className="text-[var(--module-primary)]" />,
                        onClick: () => {
                          setApprovingAset(row);
                          setApprovalAsetForm({ is_approved: true, catatan_approver: '' });
                        },
                      },
                    ]
                  : []),
                ...(['dipinjam', 'disetujui'].includes(row.status)
                  ? [
                      {
                        label: 'Kembalikan Aset',
                        icon: <RotateCcw size={16} className="text-emerald-600" />,
                        onClick: () => router.push(`/sinapra/peminjaman/aset/${row.id}/kembalikan`),
                      },
                    ]
                  : []),
              ]}
            />
          </div>
        );
      },
    },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Peminjaman Sarana & Prasarana Kampus"
        description="Kelola permohonan pinjam ruangan kelas/aula & barang inventaris aset untuk kegiatan kampus (Modul SINAPRA)"
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
              icon={<Filter size={16} />}
              onClick={() => setShowFilterDrawer(true)}
            >
              Filter
            </Button>
            {activeTab === 'ruangan' ? (
              <Button icon={<Plus size={16} />} onClick={() => router.push('/sinapra/peminjaman/ruangan/create')}>
                Permohonan Pinjam Ruangan
              </Button>
            ) : (
              <Button icon={<Plus size={16} />} onClick={() => router.push('/sinapra/peminjaman/aset/create')}>
                Permohonan Pinjam Aset
              </Button>
            )}
          </div>
        }
      />

      {/* TAB NAVIGATION (Rounded-top underline standard) */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex gap-2">
        <button
          onClick={() => setActiveTab('ruangan')}
          style={
            activeTab === 'ruangan'
              ? {
                  borderColor: 'var(--module-primary)',
                  color: 'var(--module-primary)',
                  backgroundColor: 'color-mix(in srgb, var(--module-primary) 10%, transparent)',
                }
              : undefined
          }
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all border-b-2 rounded-t-lg ${
            activeTab === 'ruangan'
              ? ''
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Home size={18} /> Peminjaman Ruangan
        </button>
        <button
          onClick={() => setActiveTab('aset')}
          style={
            activeTab === 'aset'
              ? {
                  borderColor: 'var(--module-primary)',
                  color: 'var(--module-primary)',
                  backgroundColor: 'color-mix(in srgb, var(--module-primary) 10%, transparent)',
                }
              : undefined
          }
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all border-b-2 rounded-t-lg ${
            activeTab === 'aset'
              ? ''
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Boxes size={18} /> Peminjaman Barang / Aset
        </button>
      </div>

      {/* DATA TABLE */}
      {activeTab === 'ruangan' ? (
        <DataTable
          columns={ruanganColumns}
          data={ruanganList}
          isLoading={isRuanganLoading}
          meta={ruanganMeta}
          onPageChange={(p) => setRuanganPage(p)}
        />
      ) : (
        <DataTable
          columns={asetColumns}
          data={asetList}
          isLoading={isAsetLoading}
          meta={asetMeta}
          onPageChange={(p) => setAsetPage(p)}
        />
      )}


      {/* APPROVAL RUANGAN MODAL */}
      <Modal
        open={!!approvingRuangan}
        onClose={() => setApprovingRuangan(null)}
        title="Persetujuan Admin Peminjaman Ruangan"
        footer={
          <>
            <Button variant="secondary" onClick={() => setApprovingRuangan(null)}>Batal</Button>
            <Button
              variant="primary"
              onClick={handleProcessApprovalRuangan}
              isLoading={isApprovingRuangan}
              disabled={isApprovingRuangan}
            >
              Simpan Keputusan Admin
            </Button>
          </>
        }
      >
        <form onSubmit={handleProcessApprovalRuangan} className="space-y-4">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm">
            <div><strong>Ruangan:</strong> {approvingRuangan?.ruangan?.nama}</div>
            <div><strong>Pemohon:</strong> {approvingRuangan?.user?.name}</div>
            <div><strong>Keperluan:</strong> {approvingRuangan?.keperluan}</div>
            <div><strong>Jadwal:</strong> {approvingRuangan?.tanggal ? formatDate(approvingRuangan.tanggal) : '-'} ({approvingRuangan?.jam_mulai} - {approvingRuangan?.jam_selesai} WIB)</div>
            {approvingRuangan?.catatan_laboran && (
              <div className="border-t border-slate-200 text-[var(--module-primary)]">
                <strong>Catatan Laboran:</strong> {approvingRuangan.catatan_laboran}
              </div>
            )}
          </div>

          <Select
            label={approvingRuangan?.status === 'pending_laboran' ? 'Keputusan Verifikasi Laboran' : 'Keputusan Persetujuan Admin'}
            value={approvalRuanganForm.is_approved ? 'true' : 'false'}
            onChange={(val) => setApprovalRuanganForm({ ...approvalRuanganForm, is_approved: val === 'true' })}
            options={[
              { value: 'true', label: approvingRuangan?.status === 'pending_laboran' ? 'Verifikasi & Teruskan ke Admin' : 'Setujui Permohonan' },
              { value: 'false', label: approvingRuangan?.status === 'pending_laboran' ? 'Tolak Verifikasi' : 'Tolak Permohonan' },
            ]}
          />

          <Textarea
            label={approvingRuangan?.status === 'pending_laboran' ? 'Catatan Laboran (Opsional)' : 'Catatan Penolakan / Arahan Admin'}
            rows={3}
            placeholder={approvingRuangan?.status === 'pending_laboran' ? 'Kondisi kesiapan laboratorium / alat praktikum...' : 'Alasan penolakan / arahan peminjaman...'}
            value={approvalRuanganForm.catatan_approver || ''}
            onChange={(e) => setApprovalRuanganForm({ ...approvalRuanganForm, catatan_approver: e.target.value })}
          />
        </form>
      </Modal>


      {/* APPROVAL ASET MODAL */}
      <Modal
        open={!!approvingAset}
        onClose={() => setApprovingAset(null)}
        title="Persetujuan Admin Peminjaman Aset"
        footer={
          <>
            <Button variant="secondary" onClick={() => setApprovingAset(null)}>Batal</Button>
            <Button
              variant="primary"
              onClick={handleProcessApprovalAset}
              isLoading={isApprovingAset}
              disabled={isApprovingAset}
            >
              Simpan Keputusan Admin
            </Button>
          </>
        }
      >
        <form onSubmit={handleProcessApprovalAset} className="space-y-4">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm">
            {approvingAset?.kode_peminjaman && (
              <div><strong>Kode Peminjaman:</strong> <span className="font-mono text-[var(--module-primary)] font-bold">{approvingAset.kode_peminjaman}</span></div>
            )}
            <div><strong>Barang Aset:</strong> {approvingAset?.aset?.nama} [{approvingAset?.aset?.kode_aset}]</div>
            <div><strong>Pemohon:</strong> {approvingAset?.user?.name}</div>
            <div><strong>Keperluan:</strong> {approvingAset?.keperluan}</div>
            <div><strong>Periode Pinjam:</strong> {approvingAset?.tanggal_pinjam ? formatDate(approvingAset.tanggal_pinjam) : '-'} s.d {approvingAset?.tanggal_kembali_rencana ? formatDate(approvingAset.tanggal_kembali_rencana) : '-'}</div>
            {approvingAset?.catatan_laboran && (
              <div className="border-t border-slate-200 text-[var(--module-primary)]">
                <strong>Catatan Laboran:</strong> {approvingAset.catatan_laboran}
              </div>
            )}
          </div>

          <Select
            label={approvingAset?.status === 'pending_laboran' ? 'Keputusan Verifikasi Laboran' : 'Keputusan Persetujuan Admin'}
            value={approvalAsetForm.is_approved ? 'true' : 'false'}
            onChange={(val) => setApprovalAsetForm({ ...approvalAsetForm, is_approved: val === 'true' })}
            options={[
              { value: 'true', label: approvingAset?.status === 'pending_laboran' ? 'Verifikasi & Teruskan ke Admin' : 'Setujui Permohonan' },
              { value: 'false', label: approvingAset?.status === 'pending_laboran' ? 'Tolak Verifikasi' : 'Tolak Permohonan' },
            ]}
          />

          <Textarea
            label={approvingAset?.status === 'pending_laboran' ? 'Catatan Laboran (Opsional)' : 'Catatan Penolakan / Arahan Admin'}
            rows={3}
            placeholder={approvingAset?.status === 'pending_laboran' ? 'Kondisi fisik aset / kelengkapan komponen...' : 'Alasan penolakan / arahan peminjaman...'}
            value={approvalAsetForm.catatan_approver || ''}
            onChange={(e) => setApprovalAsetForm({ ...approvalAsetForm, catatan_approver: e.target.value })}
          />
        </form>
      </Modal>

      {/* PENGEMBALIAN ASET MODAL */}
      <Modal
        open={!!returningAset}
        onClose={() => setReturningAset(null)}
        title="Proses Pengembalian Barang Aset"
        footer={
          <>
            <Button variant="secondary" onClick={() => setReturningAset(null)}>Batal</Button>
            <Button variant="primary" onClick={handleProcessPengembalianAset}>Proses Pengembalian</Button>
          </>
        }
      >
        <form onSubmit={handleProcessPengembalianAset} className="space-y-4">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm">
            <div><strong>Barang:</strong> {returningAset?.aset?.nama}</div>
            <div><strong>Peminjam:</strong> {returningAset?.user?.name}</div>
          </div>

          <Select
            label="Kondisi Fisik Barang Saat Dikembalikan"
            value={returnAsetForm.kondisi_kembali}
            onChange={(val) => setReturnAsetForm({ ...returnAsetForm, kondisi_kembali: val as any })}
            options={[
              { value: 'baik', label: 'Baik & Utuh' },
              { value: 'rusak_ringan', label: 'Rusak Ringan' },
              { value: 'rusak_berat', label: 'Rusak Berat / Hilang' },
            ]}
          />

          <Textarea
            label="Catatan Pengembalian"
            rows={3}
            placeholder="Catatan keutahuan komponen / kelengkapan..."
            value={returnAsetForm.catatan || ''}
            onChange={(e) => setReturnAsetForm({ ...returnAsetForm, catatan: e.target.value })}
          />
        </form>
      </Modal>

      {/* FILTER DRAWER */}
      <Drawer
        open={showFilterDrawer}
        onClose={() => setShowFilterDrawer(false)}
        title={activeTab === 'ruangan' ? 'Filter Peminjaman Ruangan' : 'Filter Peminjaman Aset'}
        footer={
          <div className="flex gap-2 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                if (activeTab === 'ruangan') {
                  setRuanganSearch('');
                  setRuanganStatusFilter('');
                  setRuanganSortBy('tanggal');
                  setRuanganSortDir('desc');
                  setRuanganPage(1);
                } else {
                  setAsetSearch('');
                  setAsetStatusFilter('');
                  setAsetSortBy('tanggal_pinjam');
                  setAsetSortDir('desc');
                  setAsetPage(1);
                }
                setShowFilterDrawer(false);
              }}
            >
              Reset
            </Button>
            <Button variant="primary" onClick={() => setShowFilterDrawer(false)}>
              Terapkan
            </Button>
          </div>
        }
      >
        {activeTab === 'ruangan' ? (
          <div className="space-y-4">
            <Input
              label="Pencarian"
              placeholder="Cari ruangan, pemohon, atau keperluan..."
              value={ruanganSearch}
              onChange={(e) => setRuanganSearch(e.target.value)}
            />

            <Select
              label="Status Permohonan"
              value={ruanganStatusFilter}
              onChange={(val) => setRuanganStatusFilter(val)}
              options={[
                { value: '', label: 'Semua Status' },
                { value: 'pending_laboran', label: 'Menunggu Verifikasi Laboran' },
                { value: 'pending_admin_sinapra', label: 'Menunggu Persetujuan Admin SINAPRA' },
                { value: 'disetujui', label: 'Disetujui' },
                { value: 'ditolak_laboran', label: 'Ditolak Laboran' },
                { value: 'ditolak_admin_sinapra', label: 'Ditolak Admin SINAPRA' },
                { value: 'selesai', label: 'Selesai' },
              ]}
            />

            <hr className="border-slate-200 dark:border-slate-800" />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Urutkan Berdasarkan"
                value={ruanganSortBy}
                onChange={(val) => setRuanganSortBy(val)}
                options={[
                  { value: 'tanggal', label: 'Tanggal Pemakaian' },
                  { value: 'created_at', label: 'Waktu Pengajuan' },
                  { value: 'status', label: 'Status' },
                ]}
              />
              <Select
                label="Arah Urutan"
                value={ruanganSortDir}
                onChange={(val: any) => setRuanganSortDir(val)}
                options={[
                  { value: 'desc', label: 'Menurun (Baru)' },
                  { value: 'asc', label: 'Menaik (Lama)' },
                ]}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              label="Pencarian"
              placeholder="Cari aset, pemohon, atau keperluan..."
              value={asetSearch}
              onChange={(e) => setAsetSearch(e.target.value)}
            />

            <Select
              label="Status Peminjaman"
              value={asetStatusFilter}
              onChange={(val) => setAsetStatusFilter(val)}
              options={[
                { value: '', label: 'Semua Status' },
                { value: 'pending_laboran', label: 'Menunggu Verifikasi Laboran' },
                { value: 'pending_admin_sinapra', label: 'Menunggu Persetujuan Admin SINAPRA' },
                { value: 'disetujui', label: 'Disetujui' },
                { value: 'dipinjam', label: 'Sedang Dipinjam' },
                { value: 'ditolak_laboran', label: 'Ditolak Laboran' },
                { value: 'ditolak_admin_sinapra', label: 'Ditolak Admin SINAPRA' },
                { value: 'kembali', label: 'Sudah Kembali' },
              ]}
            />

            <hr className="border-slate-200 dark:border-slate-800" />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Urutkan Berdasarkan"
                value={asetSortBy}
                onChange={(val) => setAsetSortBy(val)}
                options={[
                  { value: 'tanggal_pinjam', label: 'Tanggal Pinjam' },
                  { value: 'tanggal_kembali_rencana', label: 'Rencana Kembali' },
                  { value: 'created_at', label: 'Waktu Pengajuan' },
                  { value: 'status', label: 'Status' },
                ]}
              />
              <Select
                label="Arah Urutan"
                value={asetSortDir}
                onChange={(val: any) => setAsetSortDir(val)}
                options={[
                  { value: 'desc', label: 'Menurun (Baru)' },
                  { value: 'asc', label: 'Menaik (Lama)' },
                ]}
              />
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
