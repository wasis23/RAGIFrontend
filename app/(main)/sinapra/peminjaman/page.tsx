'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Badge } from '@/components/ui/Badge';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { formatDate } from '@/lib/utils';
import { sinapraService } from '@/services/sinapra.service';
import type {
  PeminjamanRuangan,
  ApplyPeminjamanRuanganPayload,
  ApprovePeminjamanRuanganPayload,
  PeminjamanAset,
  ApplyPeminjamanAsetPayload,
  ApprovePeminjamanAsetPayload,
  KembalikanAsetPayload,
  Ruangan,
  Aset
} from '@/types/sinapra.types';
import type { PaginationMeta } from '@/types/api.types';

export default function PeminjamanPage() {
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

  // Modal Pinjam Ruangan Form
  const [showPinjamRuanganModal, setShowPinjamRuanganModal] = useState(false);
  const [selectedRuanganObj, setSelectedRuanganObj] = useState<{ value: string; label: string } | null>(null);

  const [ruanganForm, setRuanganForm] = useState<ApplyPeminjamanRuanganPayload>({
    ruangan_id: 0,
    tanggal: new Date().toISOString().split('T')[0],
    jam_mulai: '08:00',
    jam_selesai: '12:00',
    keperluan: '',
  });

  // Modal Approval Ruangan
  const [approvingRuangan, setApprovingRuangan] = useState<PeminjamanRuangan | null>(null);
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

  // Modal Pinjam Aset Form
  const [showPinjamAsetModal, setShowPinjamAsetModal] = useState(false);
  const [selectedAsetObj, setSelectedAsetObj] = useState<{ value: string; label: string } | null>(null);

  const [asetForm, setAsetForm] = useState<ApplyPeminjamanAsetPayload>({
    aset_id: 0,
    tanggal_pinjam: new Date().toISOString().split('T')[0],
    tanggal_kembali_rencana: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    keperluan: '',
  });

  // Modal Approval Aset
  const [approvingAset, setApprovingAset] = useState<PeminjamanAset | null>(null);
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

  const loadRuanganOptions = async (inputValue: string) => {
    try {
      const res: any = await sinapraService.getRuanganList({ search: inputValue });
      let list = res?.data?.items || res?.data || res || [];
      if (Array.isArray(list)) {
        return list.map((r: Ruangan) => ({ value: r.id.toString(), label: `${r.kode} - ${r.nama}` }));
      }
      return [];
    } catch {
      return [];
    }
  };

  const loadAsetOptions = async (inputValue: string) => {
    try {
      const res: any = await sinapraService.getAsetList({ search: inputValue });
      let list = res?.data?.items || res?.data || res || [];
      if (Array.isArray(list)) {
        return list.map((a: Aset) => ({ value: a.id.toString(), label: `${a.kode_aset} - ${a.nama}` }));
      }
      return [];
    } catch {
      return [];
    }
  };

  // ------------------------------------------------------------
  // HANDLERS PEMINJAMAN RUANGAN
  // ------------------------------------------------------------
  const handleSavePinjamRuangan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruanganForm.ruangan_id || !ruanganForm.keperluan || !ruanganForm.tanggal) {
      toast.error('Ruangan, Tanggal, dan Keperluan wajib diisi!');
      return;
    }

    try {
      await sinapraService.applyPeminjamanRuangan(ruanganForm);
      toast.success('Permohonan peminjaman ruangan berhasil dikirim!');
      fetchRuanganList();
      setShowPinjamRuanganModal(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengajukan peminjaman ruangan.');
    }
  };

  const handleProcessApprovalRuangan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingRuangan) return;

    try {
      await sinapraService.approvePeminjamanRuangan(approvingRuangan.id, approvalRuanganForm);
      toast.success(`Permohonan ruangan berhasil ${approvalRuanganForm.is_approved ? 'disetujui' : 'ditolak'}!`);
      fetchRuanganList();
      setApprovingRuangan(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memproses approval ruangan.');
    }
  };

  // ------------------------------------------------------------
  // HANDLERS PEMINJAMAN ASET
  // ------------------------------------------------------------
  const handleSavePinjamAset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asetForm.aset_id || !asetForm.keperluan || !asetForm.tanggal_pinjam) {
      toast.error('Barang Aset, Tanggal, dan Keperluan wajib diisi!');
      return;
    }

    try {
      await sinapraService.applyPeminjamanAset(asetForm);
      toast.success('Permohonan peminjaman aset berhasil dikirim!');
      fetchAsetList();
      setShowPinjamAsetModal(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengajukan peminjaman aset.');
    }
  };

  const handleProcessApprovalAset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingAset) return;

    try {
      await sinapraService.approvePeminjamanAset(approvingAset.id, approvalAsetForm);
      toast.success(`Permohonan aset berhasil ${approvalAsetForm.is_approved ? 'disetujui' : 'ditolak'}!`);
      fetchAsetList();
      setApprovingAset(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memproses approval peminjaman aset.');
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
      render: (row) => (
        <Badge
          style={{
            backgroundColor: 'color-mix(in srgb, var(--module-primary) 12%, transparent)',
            color: 'var(--module-primary)',
            borderColor: 'color-mix(in srgb, var(--module-primary) 25%, transparent)',
          }}
          className="text-2xs capitalize"
        >
          {row.status?.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end">
          <DropdownMenu
            items={[
              ...(row.status === 'pending'
                ? [
                    {
                      label: 'Proses Approval',
                      icon: <UserCheck size={16} className="text-[var(--module-primary)]" />,
                      onClick: () => {
                        setApprovingRuangan(row);
                        setApprovalRuanganForm({ is_approved: true, catatan_approver: '' });
                      },
                    },
                  ]
                : []),
              {
                label: 'Detail Jadwal',
                icon: <Clock size={16} className="text-[var(--module-primary)]" />,
                onClick: () => {
                  toast(`Jadwal: ${formatDate(row.tanggal)} (${row.jam_mulai} - ${row.jam_selesai} WIB)`, {
                    icon: <Info size={16} className="text-[var(--module-primary)]" />,
                  });
                },
              },
            ]}
          />
        </div>
      ),
    },
  ];

  const asetColumns: ColumnDef<PeminjamanAset>[] = [
    {
      key: 'id_pinjam',
      label: 'ID PINJAM & TANGGAL',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-[var(--module-primary)] block text-xs">
            PA-{row.id}
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
      render: (row) => (
        <Badge
          style={{
            backgroundColor: 'color-mix(in srgb, var(--module-primary) 12%, transparent)',
            color: 'var(--module-primary)',
            borderColor: 'color-mix(in srgb, var(--module-primary) 25%, transparent)',
          }}
          className="text-2xs capitalize"
        >
          {row.status?.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end">
          <DropdownMenu
            items={[
              ...(row.status === 'pending'
                ? [
                    {
                      label: 'Proses Approval',
                      icon: <UserCheck size={16} className="text-[var(--module-primary)]" />,
                      onClick: () => {
                        setApprovingAset(row);
                        setApprovalAsetForm({ is_approved: true, catatan_approver: '' });
                      },
                    },
                  ]
                : []),
              ...(row.status === 'dipinjam'
                ? [
                    {
                      label: 'Kembalikan Aset',
                      icon: <RotateCcw size={16} className="text-[var(--module-primary)]" />,
                      onClick: () => {
                        setReturningAset(row);
                        setReturnAsetForm({
                          kondisi_kembali: 'baik',
                          catatan: '',
                        });
                      },
                    },
                  ]
                : []),
              {
                label: 'Detail Peminjaman',
                icon: <FileText size={16} className="text-[var(--module-primary)]" />,
                onClick: () => {
                  toast(`Keperluan: ${row.keperluan || '-'}`, {
                    icon: <Info size={16} className="text-[var(--module-primary)]" />,
                  });
                },
              },
            ]}
          />
        </div>
      ),
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
              <Button icon={<Plus size={16} />} onClick={() => { setSelectedRuanganObj(null); setShowPinjamRuanganModal(true); }}>
                Permohonan Pinjam Ruangan
              </Button>
            ) : (
              <Button icon={<Plus size={16} />} onClick={() => { setSelectedAsetObj(null); setShowPinjamAsetModal(true); }}>
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

      {/* ------------------------------------------------------------ */}
      {/* MODAL FORM PERMOHONAN PINJAM RUANGAN (FORM <= 5 INPUT) */}
      {/* ------------------------------------------------------------ */}
      <Modal
        open={showPinjamRuanganModal}
        onClose={() => setShowPinjamRuanganModal(false)}
        title="Formulir Permohonan Pinjam Ruangan"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowPinjamRuanganModal(false)}>Batal</Button>
            <Button variant="primary" onClick={handleSavePinjamRuangan}>Kirim Permohonan</Button>
          </>
        }
      >
        <form onSubmit={handleSavePinjamRuangan} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-full">
            <AsyncSelect
              label="Pilih Ruangan Kampus"
              required
              placeholder="Cari ruangan..."
              value={selectedRuanganObj}
              onChange={(sel: any) => {
                setSelectedRuanganObj(sel);
                setRuanganForm({ ...ruanganForm, ruangan_id: sel ? parseInt(sel.value) : 0 });
              }}
              loadOptions={loadRuanganOptions}
            />
          </div>

          <Input
            label="Tanggal Pemakaian"
            type="date"
            required
            value={ruanganForm.tanggal}
            onChange={(e) => setRuanganForm({ ...ruanganForm, tanggal: e.target.value })}
          />

          <Input
            label="Jam Mulai"
            type="time"
            required
            value={ruanganForm.jam_mulai}
            onChange={(e) => setRuanganForm({ ...ruanganForm, jam_mulai: e.target.value })}
          />

          <Input
            label="Jam Selesai"
            type="time"
            required
            value={ruanganForm.jam_selesai}
            onChange={(e) => setRuanganForm({ ...ruanganForm, jam_selesai: e.target.value })}
          />

          <div className="col-span-full">
            <Textarea
              label="Keperluan / Acara"
              required
              rows={3}
              placeholder="cth: Seminar Nasional Himatik Komputer..."
              value={ruanganForm.keperluan}
              onChange={(e) => setRuanganForm({ ...ruanganForm, keperluan: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* APPROVAL RUANGAN MODAL */}
      <Modal
        open={!!approvingRuangan}
        onClose={() => setApprovingRuangan(null)}
        title="Proses Approval Peminjaman Ruangan"
        footer={
          <>
            <Button variant="secondary" onClick={() => setApprovingRuangan(null)}>Batal</Button>
            <Button variant="primary" onClick={handleProcessApprovalRuangan}>Simpan Keputusan</Button>
          </>
        }
      >
        <form onSubmit={handleProcessApprovalRuangan} className="space-y-4">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm">
            <div><strong>Ruangan:</strong> {approvingRuangan?.ruangan?.nama}</div>
            <div><strong>Pemohon:</strong> {approvingRuangan?.user?.name}</div>
            <div><strong>Keperluan:</strong> {approvingRuangan?.keperluan}</div>
          </div>

          <Select
            label="Keputusan Status Approval"
            value={approvalRuanganForm.is_approved ? 'true' : 'false'}
            onChange={(val) => setApprovalRuanganForm({ ...approvalRuanganForm, is_approved: val === 'true' })}
            options={[
              { value: 'true', label: 'Setujui Permohonan' },
              { value: 'false', label: 'Tolak Permohonan' },
            ]}
          />

          <Textarea
            label="Catatan Approver"
            rows={3}
            placeholder="Alasan penolakan / instruksi khusus..."
            value={approvalRuanganForm.catatan_approver || ''}
            onChange={(e) => setApprovalRuanganForm({ ...approvalRuanganForm, catatan_approver: e.target.value })}
          />
        </form>
      </Modal>

      {/* ------------------------------------------------------------ */}
      {/* MODAL FORM PERMOHONAN PINJAM ASET (FORM <= 5 INPUT) */}
      {/* ------------------------------------------------------------ */}
      <Modal
        open={showPinjamAsetModal}
        onClose={() => setShowPinjamAsetModal(false)}
        title="Formulir Permohonan Pinjam Barang Aset"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowPinjamAsetModal(false)}>Batal</Button>
            <Button variant="primary" onClick={handleSavePinjamAset}>Kirim Permohonan</Button>
          </>
        }
      >
        <form onSubmit={handleSavePinjamAset} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-full">
            <AsyncSelect
              label="Pilih Barang / Aset Inventaris"
              required
              placeholder="Cari nama aset / kode..."
              value={selectedAsetObj}
              onChange={(sel: any) => {
                setSelectedAsetObj(sel);
                setAsetForm({ ...asetForm, aset_id: sel ? parseInt(sel.value) : 0 });
              }}
              loadOptions={loadAsetOptions}
            />
          </div>

          <Input
            label="Tanggal Pinjam"
            type="date"
            required
            value={asetForm.tanggal_pinjam}
            onChange={(e) => setAsetForm({ ...asetForm, tanggal_pinjam: e.target.value })}
          />

          <Input
            label="Tanggal Rencana Kembali"
            type="date"
            required
            value={asetForm.tanggal_kembali_rencana}
            onChange={(e) => setAsetForm({ ...asetForm, tanggal_kembali_rencana: e.target.value })}
          />

          <div className="col-span-full">
            <Textarea
              label="Keperluan Pinjam"
              required
              rows={3}
              placeholder="cth: Penggunaan sound system untuk acara dies natalis..."
              value={asetForm.keperluan}
              onChange={(e) => setAsetForm({ ...asetForm, keperluan: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* APPROVAL ASET MODAL */}
      <Modal
        open={!!approvingAset}
        onClose={() => setApprovingAset(null)}
        title="Proses Approval Peminjaman Aset"
        footer={
          <>
            <Button variant="secondary" onClick={() => setApprovingAset(null)}>Batal</Button>
            <Button variant="primary" onClick={handleProcessApprovalAset}>Simpan Keputusan</Button>
          </>
        }
      >
        <form onSubmit={handleProcessApprovalAset} className="space-y-4">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm">
            <div><strong>Barang Aset:</strong> {approvingAset?.aset?.nama}</div>
            <div><strong>Pemohon:</strong> {approvingAset?.user?.name}</div>
            <div><strong>Keperluan:</strong> {approvingAset?.keperluan}</div>
          </div>

          <Select
            label="Keputusan Status Approval"
            value={approvalAsetForm.is_approved ? 'true' : 'false'}
            onChange={(val) => setApprovalAsetForm({ ...approvalAsetForm, is_approved: val === 'true' })}
            options={[
              { value: 'true', label: 'Setujui Permohonan' },
              { value: 'false', label: 'Tolak Permohonan' },
            ]}
          />

          <Textarea
            label="Catatan Approver"
            rows={3}
            placeholder="Catatan pengambilan barang / instruksi..."
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
                { value: 'pending', label: 'Menunggu Approval (Pending)' },
                { value: 'disetujui', label: 'Disetujui' },
                { value: 'ditolak', label: 'Ditolak' },
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
                { value: 'pending', label: 'Menunggu Approval (Pending)' },
                { value: 'dipinjam', label: 'Sedang Dipinjam' },
                { value: 'kembali', label: 'Sudah Kembali' },
                { value: 'ditolak', label: 'Ditolak' },
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
