'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Plus, Eye, Upload, Wallet, Building2, UserRound, CheckCircle2, XCircle, ReceiptText, HandCoins, Edit2, Save, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { kasKecilService } from '@/services/kas-kecil.service';
import { sikeuService } from '@/services/sikeu.service';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { formatRupiah, formatDate } from '@/lib/utils';
import type { PaginationMeta } from '@/types/api.types';
import type { KasKecilUnit, KasKecilTransaksi, KasKecilPengajuan, PetugasRingkas, AkunKeuangan } from '@/types/sikeu.types';

const editKasKecilSchema = z.object({
  nama_kas: z.string().min(3, 'Nama kas kecil minimal 3 karakter'),
  fakultas_id: z.number({ error: 'Fakultas wajib dipilih' }).int('Fakultas wajib dipilih'),
  penanggung_jawab_id: z.number({ error: 'Petugas penanggung jawab wajib dipilih' }).int('Petugas wajib dipilih'),
  akun_keuangan_id: z.number({ error: 'Akun kas (COA aset) wajib dipilih' }).int('Akun COA wajib dipilih'),
  status: z.boolean(),
  deskripsi: z.string().optional(),
});

type EditKasKecilForm = z.infer<typeof editKasKecilSchema>;

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

const STATUS_PENGAJUAN: Record<string, { label: string; variant: 'warning' | 'success' | 'danger' }> = {
  pending_keuangan: { label: 'Menunggu Approval', variant: 'warning' },
  disetujui: { label: 'Disetujui', variant: 'success' },
  ditolak: { label: 'Ditolak', variant: 'danger' },
};

const petugasLabel = (source?: KasKecilUnit | PetugasRingkas | null): string => {
  // KasKecilUnit: penanggung_jawab bisa string legacy atau objek user ringkas.
  if (source && 'nama_kas' in source) {
    const pj = source.penanggung_jawab;
    if (pj && typeof pj === 'object') {
      if (pj.pegawai?.nama_lengkap) return pj.pegawai.nama_lengkap;
      if (pj.username) return pj.username;
    }
    if (typeof pj === 'string' && pj) return pj;
    return '-';
  }
  // Objek user langsung (mis. dibuatOleh).
  if (source && typeof source === 'object') {
    if (source.pegawai?.nama_lengkap) return source.pegawai.nama_lengkap;
    if (source.username) return source.username;
  }
  return '-';
};

const apiErrorMessage = (err: unknown, fallback: string): string => {
  const e = err as { response?: { data?: { message?: string } } } | null | undefined;
  return e?.response?.data?.message || fallback;
};

export default function KasKecilDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, hasPermission } = useAuth();

  const [unit, setUnit] = useState<KasKecilUnit | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'transaksi' | 'pengajuan'>('transaksi');

  // Transaksi state
  const [transaksis, setTransaksis] = useState<KasKecilTransaksi[]>([]);
  const [trxMeta, setTrxMeta] = useState<PaginationMeta | undefined>(undefined);
  const [trxPage, setTrxPage] = useState(1);
  const [trxLimit, setTrxLimit] = useState(15);
  const [trxLoading, setTrxLoading] = useState(false);
  const [saldo, setSaldo] = useState<number | string>(0);

  // Pengajuan state
  const [pengajuans, setPengajuans] = useState<KasKecilPengajuan[]>([]);
  const [pgjMeta, setPgjMeta] = useState<PaginationMeta | undefined>(undefined);
  const [pgjPage, setPgjPage] = useState(1);
  const [pgjLimit, setPgjLimit] = useState(15);
  const [pgjLoading, setPgjLoading] = useState(false);
  const [pgjStatusFilter, setPgjStatusFilter] = useState<string>('all');
  const [pendingCount, setPendingCount] = useState<number>(0);

  // Modal pengajuan (<= 5 input)
  const [modalPengajuan, setModalPengajuan] = useState(false);
  const [judulPengajuan, setJudulPengajuan] = useState('');
  const [keperluan, setKeperluan] = useState('');
  const [nominalDiajukan, setNominalDiajukan] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Confirm approve / reject / delete
  const [targetApprove, setTargetApprove] = useState<KasKecilPengajuan | null>(null);
  const [targetReject, setTargetReject] = useState<KasKecilPengajuan | null>(null);
  const [targetDelete, setTargetDelete] = useState<KasKecilPengajuan | null>(null);
  const [rejectCatatan, setRejectCatatan] = useState('');
  const [acting, setActing] = useState(false);

  const canTransaksi = hasPermission('sikeu.kaskecil.transaksi');
  const canPengajuan = hasPermission('sikeu.kaskecil.pengajuan');
  const canApprove = hasPermission('sikeu.kaskecil.approve');
  const canManage = hasPermission('sikeu.kas.manage');

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [coaList, setCoaList] = useState<AkunKeuangan[]>([]);
  const [selectedEditFakultas, setSelectedEditFakultas] = useState<{ value: string; label: string } | null>(null);
  const [selectedEditPetugas, setSelectedEditPetugas] = useState<{ value: string; label: string } | null>(null);

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    control: controlEdit,
    setValue: setEditValue,
    watch: watchEdit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<EditKasKecilForm>({
    resolver: zodResolver(editKasKecilSchema) as unknown as Resolver<EditKasKecilForm>,
    defaultValues: {
      nama_kas: '',
      fakultas_id: undefined,
      penanggung_jawab_id: undefined,
      akun_keuangan_id: undefined,
      status: true,
      deskripsi: '',
    },
  });

  const watchEditAkun = watchEdit('akun_keuangan_id');

  useEffect(() => {
    const fetchCoa = async () => {
      try {
        const res = await sikeuService.getCoaList('aset');
        const list = Array.isArray(res.data) ? res.data : [];
        setCoaList(
          list.filter(
            (a) =>
              String(a.kode_akun || '').startsWith('101') ||
              String(a.kode_akun || '').startsWith('102')
          )
        );
      } catch {
        setCoaList([]);
      }
    };
    fetchCoa();
  }, []);

  const loadFakultasOptions = useCallback(async (inputValue: string) => {
    try {
      const res = await kasKecilService.referensiFakultas();
      const list = Array.isArray(res.data) ? res.data : [];
      const q = inputValue.trim().toLowerCase();
      const filtered = q ? list.filter((f) => f.nama.toLowerCase().includes(q)) : list;
      return filtered.map((f) => ({ value: String(f.id), label: f.nama }));
    } catch {
      return [];
    }
  }, []);

  const loadPetugasOptions = useCallback(async (inputValue: string) => {
    try {
      const res = await kasKecilService.referensiPetugas(inputValue || undefined);
      const list = Array.isArray(res.data) ? res.data : [];
      return list.map((p) => ({ value: String(p.id), label: p.label }));
    } catch {
      return [];
    }
  }, []);

  const handleOpenEdit = () => {
    if (!unit) return;
    resetEdit({
      nama_kas: unit.nama_kas,
      fakultas_id: unit.fakultas_id || (unit.fakultas?.id ? Number(unit.fakultas.id) : undefined),
      penanggung_jawab_id:
        unit.penanggung_jawab_id ||
        (typeof unit.penanggung_jawab === 'object' && unit.penanggung_jawab ? Number(unit.penanggung_jawab.id) : undefined),
      akun_keuangan_id:
        unit.akun_keuangan_id ||
        (unit.akunKeuangan?.id ? Number(unit.akunKeuangan.id) : undefined) ||
        (unit.akun_keuangan?.id ? Number(unit.akun_keuangan.id) : undefined),
      status: unit.status !== false && unit.status !== 0,
      deskripsi: unit.deskripsi || '',
    });

    if (unit.fakultas) {
      setSelectedEditFakultas({ value: String(unit.fakultas.id), label: unit.fakultas.nama });
    } else {
      setSelectedEditFakultas(null);
    }

    if (unit.penanggung_jawab && typeof unit.penanggung_jawab === 'object') {
      const label = unit.penanggung_jawab.pegawai?.nama_lengkap
        ? `${unit.penanggung_jawab.pegawai.nama_lengkap} (${unit.penanggung_jawab.username || ''})`
        : unit.penanggung_jawab.username || 'Petugas Kas Kecil';
      setSelectedEditPetugas({ value: String(unit.penanggung_jawab.id), label });
    } else {
      setSelectedEditPetugas(null);
    }

    setEditModalOpen(true);
  };

  const onSaveEdit = async (form: EditKasKecilForm) => {
    if (!unit) return;
    setSubmittingEdit(true);
    try {
      const res = await kasKecilService.updateUnit(unit.id, {
        nama_kas: form.nama_kas,
        fakultas_id: form.fakultas_id,
        penanggung_jawab_id: form.penanggung_jawab_id,
        akun_keuangan_id: form.akun_keuangan_id,
        status: form.status,
        deskripsi: form.deskripsi?.trim() || undefined,
      });
      toast.success('Unit kas kecil berhasil diperbarui');
      setEditModalOpen(false);
      if (res.data) setUnit(res.data);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Gagal memperbarui unit kas kecil';
      toast.error(msg);
    } finally {
      setSubmittingEdit(false);
    }
  };

  const fetchUnit = useCallback(async () => {
    try {
      setLoading(true);
      const res = await kasKecilService.detailUnit(id);
      if (res.status !== 'success' || !res.data) {
        toast.error('Data unit kas kecil tidak ditemukan');
        return;
      }
      setUnit(res.data);
      setSaldo(res.data.saldo_saat_ini ?? 0);
    } catch {
      toast.error('Gagal memuat detail unit kas kecil');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchTransaksi = useCallback(async () => {
    try {
      setTrxLoading(true);
      const res = await kasKecilService.listTransaksi(id, { page: trxPage, per_page: trxLimit });
      setTransaksis(Array.isArray(res.data) ? res.data : []);
      setTrxMeta(res.meta);
      if (res.saldo_saat_ini !== undefined) setSaldo(res.saldo_saat_ini);
    } catch {
      setTransaksis([]);
      toast.error('Gagal memuat transaksi kas kecil');
    } finally {
      setTrxLoading(false);
    }
  }, [id, trxPage, trxLimit]);

  const fetchPendingCount = useCallback(async () => {
    try {
      const res = await kasKecilService.listPengajuan(id, { status: 'pending_keuangan', per_page: 1 });
      setPendingCount(res?.meta?.total || 0);
    } catch {
      // silent
    }
  }, [id]);

  const fetchPengajuan = useCallback(async () => {
    try {
      setPgjLoading(true);
      const params: { page: number; per_page: number; status?: string } = {
        page: pgjPage,
        per_page: pgjLimit,
      };
      if (pgjStatusFilter !== 'all') {
        params.status = pgjStatusFilter;
      }
      const res = await kasKecilService.listPengajuan(id, params);
      setPengajuans(Array.isArray(res.data) ? res.data : []);
      setPgjMeta(res.meta);
      fetchPendingCount();
    } catch {
      setPengajuans([]);
      toast.error('Gagal memuat pengajuan kas kecil');
    } finally {
      setPgjLoading(false);
    }
  }, [id, pgjPage, pgjLimit, pgjStatusFilter, fetchPendingCount]);

  useEffect(() => { fetchUnit(); }, [fetchUnit]);
  useEffect(() => { fetchPendingCount(); }, [fetchPendingCount]);
  useEffect(() => {
    if (activeTab === 'transaksi') fetchTransaksi();
  }, [activeTab, fetchTransaksi]);
  useEffect(() => {
    if (activeTab === 'pengajuan') fetchPengajuan();
  }, [activeTab, fetchPengajuan]);

  const submitPengajuan = async () => {
    setSubmitting(true);
    try {
      await kasKecilService.createPengajuan(id, {
        judul_pengajuan: judulPengajuan,
        keperluan: keperluan?.trim() || undefined,
        nominal_diajukan: Number(nominalDiajukan) || 0,
      });
      toast.success('Pengajuan kas langsung berhasil dibuat dan menunggu persetujuan');
      setModalPengajuan(false);
      setJudulPengajuan('');
      setKeperluan('');
      setNominalDiajukan('');
      fetchPengajuan();
    } catch (err: unknown) {
      toast.error(apiErrorMessage(err, 'Gagal membuat pengajuan kas langsung'));
    } finally {
      setSubmitting(false);
    }
  };

  const doApprove = async () => {
    if (!targetApprove) return;
    setActing(true);
    try {
      await kasKecilService.approvePengajuan(targetApprove.id);
      toast.success('Pengajuan disetujui. Saldo bertambah & jurnal otomatis dibuat.');
      setTargetApprove(null);
      await Promise.all([fetchUnit(), fetchPengajuan()]);
    } catch (err: unknown) {
      toast.error(apiErrorMessage(err, 'Gagal menyetujui pengajuan'));
    } finally {
      setActing(false);
    }
  };

  const doReject = async () => {
    if (!targetReject) return;
    if (!rejectCatatan.trim()) {
      toast.error('Catatan penolakan wajib diisi.');
      return;
    }
    setActing(true);
    try {
      await kasKecilService.rejectPengajuan(targetReject.id, rejectCatatan);
      toast.success('Pengajuan kas langsung ditolak.');
      setTargetReject(null);
      setRejectCatatan('');
      fetchPengajuan();
    } catch (err: unknown) {
      toast.error(apiErrorMessage(err, 'Gagal menolak pengajuan'));
    } finally {
      setActing(false);
    }
  };

  const doDeletePengajuan = async () => {
    if (!targetDelete) return;
    setActing(true);
    try {
      await kasKecilService.deletePengajuan(targetDelete.id);
      toast.success('Pengajuan kas langsung berhasil dihapus/dibatalkan.');
      setTargetDelete(null);
      fetchPengajuan();
    } catch (err: unknown) {
      toast.error(apiErrorMessage(err, 'Gagal menghapus pengajuan'));
    } finally {
      setActing(false);
    }
  };

  const trxColumns: ColumnDef<KasKecilTransaksi>[] = [
    {
      key: 'nomor_transaksi',
      label: 'NO. TRANSAKSI',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900 text-xs">{row.nomor_transaksi}</p>
          <p className="text-2xs text-slate-500 mt-0.5">{formatDate(row.tanggal_transaksi)}</p>
        </div>
      ),
    },
    {
      key: 'uraian',
      label: 'URAIAN & KATEGORI',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-800 text-xs">{row.uraian}</p>
          <span className="badge bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold mt-1">{row.kategori?.nama || 'Tanpa Kategori'}</span>
          {row.penerima && <p className="text-2xs text-slate-500 mt-1">Kepada: {row.penerima}</p>}
        </div>
      ),
    },
    {
      key: 'nominal',
      label: 'NOMINAL',
      align: 'right',
      render: (row) => (
        <p className="font-mono font-bold text-sm text-rose-600">-{formatRupiah(Number(row.nominal) || 0)}</p>
      ),
    },
    {
      key: 'dibuat',
      label: 'DICATAT OLEH',
      render: (row) => (
        <p className="text-xs text-slate-600">{petugasLabel(row.dibuatOleh)}</p>
      ),
    },
    {
      key: 'actions',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <DropdownMenu
          items={[
            ...(row.file_bukti_path
              ? [{
                  label: 'Lihat Bukti',
                  icon: <Eye size={14} />,
                  onClick: () => {
                      window.open(`${API_BASE.replace(/\/api$/, '')}/storage/${row.file_bukti_path}`, '_blank');
                    },
                }]
              : []),
          ]}
        />
      ),
    },
  ];

  const pgjColumns: ColumnDef<KasKecilPengajuan>[] = [
    {
      key: 'nomor_pengajuan',
      label: 'NO. PENGAJUAN',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900 text-xs">{row.nomor_pengajuan}</p>
          <p className="text-2xs text-slate-500 mt-0.5">{formatDate(row.created_at)}</p>
        </div>
      ),
    },
    {
      key: 'judul_pengajuan',
      label: 'JUDUL / KEPERLUAN',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-800 text-xs">{row.judul_pengajuan}</p>
          {row.keperluan && <p className="text-2xs text-slate-500 mt-1 line-clamp-1">{row.keperluan}</p>}
        </div>
      ),
    },
    {
      key: 'nominal',
      label: 'NOMINAL',
      align: 'right',
      render: (row) => (
        <p className="font-mono font-bold text-sm text-emerald-700">{formatRupiah(Number(row.nominal_diajukan) || 0)}</p>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (row) => {
        const cfg = STATUS_PENGAJUAN[row.status] || { label: row.status, variant: 'secondary' as const };
        return <Badge variant={cfg.variant} dot>{cfg.label}</Badge>;
      },
    },
    {
      key: 'actions',
      label: 'AKSI',
      align: 'right',
      render: (row) => {
        const isPemohon = (user?.id && (row.pemohon_id === user.id || row.created_by === user.id));
        const canDelete = row.status === 'pending_keuangan' && (isPemohon || canPengajuan || canManage);

        const items = [
          ...(row.status === 'pending_keuangan' && canApprove
            ? [
                {
                  label: 'Setujui (Top-up Saldo)',
                  icon: <CheckCircle2 size={14} />,
                  onClick: () => setTargetApprove(row),
                },
                {
                  label: 'Tolak',
                  icon: <XCircle size={14} />,
                  variant: 'danger' as const,
                  onClick: () => {
                    setRejectCatatan('');
                    setTargetReject(row);
                  },
                },
              ]
            : []),
          ...(canDelete
            ? [
                {
                  label: 'Hapus Pengajuan',
                  icon: <Trash2 size={14} />,
                  variant: 'danger' as const,
                  onClick: () => setTargetDelete(row),
                },
              ]
            : []),
          ...(row.catatan_penolakan
            ? [
                {
                  label: 'Lihat Catatan Penolakan',
                  icon: <Eye size={14} />,
                  onClick: () => toast(row.catatan_penolakan!, { icon: '📝' }),
                },
              ]
            : []),
        ];

        if (items.length === 0) {
          return <span className="text-slate-400 text-xs">-</span>;
        }

        return <DropdownMenu items={items} />;
      },
    },
  ];

  const nominalDiajukanValid = (() => {
    const n = Number(nominalDiajukan);
    return typeof n === 'number' && !Number.isNaN(n) && n > 0;
  })();

  if (loading && !unit) {
    return <div className="p-8 text-sm text-slate-500">Memuat detail unit kas kecil...</div>;
  }

  if (!unit) {
    return (
      <div className="p-8 text-sm text-slate-500">
        Data tidak ditemukan.{' '}
        <Link href="/sikeu/kas-kecil" className="underline text-primary-600 font-semibold">Kembali ke daftar</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title={unit.nama_kas}
        description={`Kas Kecil • ${unit.fakultas?.nama || '-'} • PJ: ${petugasLabel(unit)}`}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/sikeu/kas-kecil">
              <Button variant="outline" icon={<ArrowLeft size={16} />} className="font-bold min-h-[38px] text-xs">
                Kembali
              </Button>
            </Link>
            {canManage && (
              <Button
                variant="primary"
                icon={<Edit2 size={15} />}
                onClick={handleOpenEdit}
                className="font-bold min-h-[38px] text-xs shadow-md"
              >
                Edit Unit Kas Kecil
              </Button>
            )}
          </div>
        }
      />

      {/* Ringkasan saldo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 border border-slate-200/80">
          <div className="flex items-center gap-2 text-2xs font-bold text-slate-500 mb-1.5">
            <Wallet size={14} className="text-emerald-600" /> Saldo Saat Ini
          </div>
          <p className="font-mono text-lg font-bold text-emerald-700">{formatRupiah(Number(saldo) || 0)}</p>
        </div>
        <div className="card p-4 border border-slate-200/80">
          <div className="flex items-center gap-2 text-2xs font-bold text-slate-500 mb-1.5">
            <Building2 size={14} className="text-primary-600" /> Fakultas
          </div>
          <p className="font-bold text-sm text-slate-800">{unit.fakultas?.nama || '-'}</p>
          <p className="text-2xs text-slate-500 mt-0.5">{unit.fakultas?.kode && `Kode: ${unit.fakultas.kode}`}</p>
        </div>
        <div className="card p-4 border border-slate-200/80">
          <div className="flex items-center gap-2 text-2xs font-bold text-slate-500 mb-1.5">
            <UserRound size={14} className="text-indigo-600" /> Penanggung Jawab
          </div>
          <p className="font-bold text-sm text-slate-800">{petugasLabel(unit)}</p>
        </div>
        <div className="card p-4 border border-slate-200/80">
          <div className="flex items-center gap-2 text-2xs font-bold text-slate-500 mb-1.5">
            <ReceiptText size={14} className="text-cyan-600" /> Akun COA Kas
          </div>
          <p className="font-mono font-bold text-xs text-indigo-600">
            {(unit.akunKeuangan || unit.akun_keuangan)?.kode_akun || '-'}
          </p>
          <p className="text-2xs text-slate-500 mt-0.5">{(unit.akunKeuangan || unit.akun_keuangan)?.nama_akun || 'Tanpa pemetaan'}</p>
        </div>
      </div>

      {/* Tab navigasi (Divided Bottom Border) */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('transaksi')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'transaksi'
              ? 'border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle)]'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <ReceiptText size={16} /> Transaksi Keluar
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pengajuan')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'pengajuan'
              ? 'border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle)]'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <HandCoins size={16} />
          <span>Pengajuan Kas Langsung</span>
          {pendingCount > 0 && (
            <span className="text-2xs px-1.5 py-0.5 rounded-full font-bold bg-amber-500 text-white animate-pulse">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'transaksi' && (
        <div className="space-y-4">
          {canTransaksi && (
            <div className="flex justify-end">
              <Link href={`/sikeu/kas-kecil/${unit.id}/transaksi/create`}>
                <Button variant="primary" icon={<Upload size={16} />} className="font-bold min-h-[38px] text-xs shadow-md">
                  Catat Transaksi Keluar
                </Button>
              </Link>
            </div>
          )}
          <div className="card p-4 sm:p-6 border border-slate-200/80">
            <DataTable
              columns={trxColumns}
              data={transaksis}
              isLoading={trxLoading}
              meta={trxMeta}
              onPageChange={setTrxPage}
              onLimitChange={(l) => { setTrxLimit(l); setTrxPage(1); }}
              emptyMessage="Belum ada transaksi kas kecil."
            />
          </div>
        </div>
      )}

      {activeTab === 'pengajuan' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Sub-tab Filter Status Pengajuan (Divided Bottom Border Navigation) */}
            <div className="flex border-b border-slate-200 gap-1 sm:gap-2 overflow-x-auto pb-0.5">
              {[
                { id: 'all', label: 'Semua Pengajuan' },
                {
                  id: 'pending_keuangan',
                  label: 'Menunggu Approval',
                  badge: pendingCount > 0 ? pendingCount : undefined,
                },
                { id: 'disetujui', label: 'Disetujui' },
                { id: 'ditolak', label: 'Ditolak' },
              ].map((tab) => {
                const isTabActive = pgjStatusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setPgjStatusFilter(tab.id);
                      setPgjPage(1);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                      isTabActive
                        ? 'border-primary-600 text-primary-700 bg-primary-50/60'
                        : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/70'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && (
                      <span className={`text-2xs px-1.5 py-0.5 rounded-full font-bold ${
                        isTabActive
                          ? 'bg-amber-500 text-white'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {canPengajuan && (
              <div className="flex justify-end shrink-0">
                <Button variant="primary" icon={<Plus size={16} />} onClick={() => setModalPengajuan(true)} className="font-bold min-h-[38px] text-xs shadow-md">
                  Ajukan Kas Langsung
                </Button>
              </div>
            )}
          </div>

          <div className="card p-4 sm:p-6 border border-slate-200/80">
            <DataTable
              columns={pgjColumns}
              data={pengajuans}
              isLoading={pgjLoading}
              meta={pgjMeta}
              onPageChange={setPgjPage}
              onLimitChange={(l) => { setPgjLimit(l); setPgjPage(1); }}
              emptyMessage={
                pgjStatusFilter === 'pending_keuangan'
                  ? 'Tidak ada pengajuan yang menunggu persetujuan (approval).'
                  : pgjStatusFilter === 'disetujui'
                  ? 'Belum ada pengajuan kas langsung yang disetujui.'
                  : pgjStatusFilter === 'ditolak'
                  ? 'Belum ada pengajuan kas langsung yang ditolak.'
                  : 'Belum ada pengajuan kas langsung.'
              }
            />
          </div>
        </div>
      )}

      {/* Modal ajukan kas langsung (<= 5 input) */}
      <Modal
        isOpen={modalPengajuan}
        onClose={() => !submitting && setModalPengajuan(false)}
        title="Ajukan Kas Langsung (Top-up)"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModalPengajuan(false)} disabled={submitting} className="font-bold min-h-[38px] text-xs">
              Batal
            </Button>
            <Button
              variant="primary"
              loading={submitting}
              onClick={submitPengajuan}
              disabled={!judulPengajuan || !nominalDiajukanValid}
              className="font-bold min-h-[38px] text-xs"
            >
              Ajukan
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Judul Pengajuan *"
              placeholder="Contoh: Pengisian kas langsung bulanan FT"
              value={judulPengajuan}
              onChange={(e) => setJudulPengajuan(e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <Textarea
              label="Keperluan"
              placeholder="Penjelasan kebutuhan dana kas langsung..."
              rows={3}
              value={keperluan}
              onChange={(e) => setKeperluan(e.target.value)}
            />
          </div>
          <Input
            label="Nominal Diajukan (Rp) *"
            type="number"
            min={1}
            placeholder="0"
            value={nominalDiajukan}
            onChange={(e) => setNominalDiajukan(e.target.value)}
          />
        </div>
      </Modal>

      {/* ConfirmDialog: Setujui */}
      <ConfirmDialog
        isOpen={!!targetApprove}
        onClose={() => setTargetApprove(null)}
        onConfirm={doApprove}
        title="Setujui Pengajuan Kas Langsung?"
        message={
          <>
            Pengajuan <b>{targetApprove?.nomor_pengajuan}</b> sebesar{' '}
            <b className="text-emerald-700">{formatRupiah(Number(targetApprove?.nominal_diajukan) || 0)}</b> akan disetujui.
            <br />
            Saldo kas kecil bertambah dan jurnal pengisian kas otomatis dibuat (Dr Kas Unit / Cr Kas Utama).
          </>
        }
        confirmText="Ya, Setujui"
        variant="primary"
        isLoading={acting}
      />

      {/* ConfirmDialog: Tolak dengan catatan */}
      <ConfirmDialog
        isOpen={!!targetReject}
        onClose={() => setTargetReject(null)}
        onConfirm={doReject}
        title="Tolak Pengajuan Kas Langsung?"
        message={
          <div className="w-full text-left space-y-2">
            <p className="text-xs sm:text-sm text-slate-600">
              Tolak pengajuan <b>{targetReject?.nomor_pengajuan}</b>? Tidak akan ada mutasi saldo.
            </p>
            <Textarea
              label="Catatan Penolakan *"
              placeholder="Alasan penolakan (wajib diisi)"
              rows={3}
              value={rejectCatatan}
              onChange={(e) => setRejectCatatan(e.target.value)}
            />
          </div>
        }
        confirmText="Ya, Tolak"
        variant="danger"
        isLoading={acting}
        cancelText="Batal"
      />

      {/* ConfirmDialog: Hapus Pengajuan (Pending) */}
      <ConfirmDialog
        isOpen={!!targetDelete}
        onClose={() => setTargetDelete(null)}
        onConfirm={doDeletePengajuan}
        title="Hapus Pengajuan Kas Langsung?"
        message={
          <span>
            Apakah Anda yakin ingin membatalkan/menghapus pengajuan <strong>{targetDelete?.nomor_pengajuan}</strong> senilai{' '}
            <strong>{formatRupiah(Number(targetDelete?.nominal_diajukan) || 0)}</strong>? Tindakan ini tidak dapat dibatalkan.
          </span>
        }
        confirmText="Hapus Pengajuan"
        cancelText="Batal"
        variant="danger"
        isLoading={acting}
      />

      {/* Modal Edit Unit Kas Kecil */}
      <Modal
        open={editModalOpen}
        onClose={() => {
          if (!submittingEdit) {
            setEditModalOpen(false);
          }
        }}
        title={`Edit Unit Kas Kecil: ${unit.nama_kas}`}
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditModalOpen(false)}
              disabled={submittingEdit}
              className="font-bold min-h-[38px] text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSubmitEdit(onSaveEdit)}
              disabled={submittingEdit}
              loading={submittingEdit}
              icon={!submittingEdit ? <Save size={15} /> : undefined}
              className="font-bold min-h-[38px] text-xs shadow-md"
            >
              {submittingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmitEdit(onSaveEdit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nama Kas Kecil *"
              placeholder="Contoh: Kas Kecil Fakultas Teknik"
              {...registerEdit('nama_kas')}
              error={editErrors.nama_kas?.message}
            />

            <div>
              <label className="form-label">
                Fakultas <span className="required">*</span>
              </label>
              <Controller
                control={controlEdit}
                name="fakultas_id"
                render={({ field }) => (
                  <AsyncSelect
                    loadOptions={loadFakultasOptions}
                    value={selectedEditFakultas}
                    onChange={(val: { value: string; label: string } | null) => {
                      setSelectedEditFakultas(val || null);
                      field.onChange(val ? Number(val.value) : undefined);
                    }}
                    placeholder="Pilih fakultas..."
                    error={editErrors.fakultas_id?.message as string | undefined}
                    isClearable
                  />
                )}
              />
              {editErrors.fakultas_id && (
                <span className="form-error">{editErrors.fakultas_id.message}</span>
              )}
            </div>

            <div>
              <label className="form-label">
                Petugas Penanggung Jawab <span className="required">*</span>
              </label>
              <Controller
                control={controlEdit}
                name="penanggung_jawab_id"
                render={({ field }) => (
                  <AsyncSelect
                    loadOptions={loadPetugasOptions}
                    value={selectedEditPetugas}
                    onChange={(val: { value: string; label: string } | null) => {
                      setSelectedEditPetugas(val || null);
                      field.onChange(val ? Number(val.value) : undefined);
                    }}
                    placeholder="Ketik nama/username petugas..."
                    error={editErrors.penanggung_jawab_id?.message as string | undefined}
                    isClearable
                  />
                )}
              />
              {editErrors.penanggung_jawab_id && (
                <span className="form-error">{editErrors.penanggung_jawab_id.message}</span>
              )}
            </div>

            <Select
              label="Akun Kas (COA Aset 101/102) *"
              options={[
                ...(watchEditAkun ? [] : [{ value: '', label: '-- Pilih akun kas --' }]),
                ...coaList.map((a) => ({ value: String(a.id), label: `[${a.kode_akun}] ${a.nama_akun}` })),
              ]}
              value={watchEditAkun?.toString() || ''}
              onChange={(val) =>
                setEditValue('akun_keuangan_id', val ? Number(val) : (null as unknown as number), {
                  shouldValidate: true,
                })
              }
              error={editErrors.akun_keuangan_id?.message}
            />

            <Select
              label="Status Operasional Unit *"
              options={[
                { value: 'true', label: 'Aktif (Dapat Bertransaksi)' },
                { value: 'false', label: 'Non-Aktif (Ditangguhkan)' },
              ]}
              value={watchEdit('status') ? 'true' : 'false'}
              onChange={(val) => setEditValue('status', val === 'true')}
            />

            <div>
              <Textarea
                label="Deskripsi / Catatan"
                placeholder="Peruntukan kas kecil, batasan pengeluaran harian, dsb."
                rows={2}
                {...registerEdit('deskripsi')}
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}