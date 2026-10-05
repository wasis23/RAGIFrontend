'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  ShieldCheck, 
  User, 
  GraduationCap, 
  Users, 
  FileCheck, 
  ExternalLink, 
  Save, 
  Check, 
  AlertCircle,
  Hash,
  CreditCard,
  ChevronUp,
  ChevronDown,
  Gift,
  Wallet,
  Landmark,
  ReceiptText,
  CalendarClock,
  Download,
  UserCheck,
  Plus,
  Pencil,
  Trash2,
  Percent,
} from 'lucide-react';
import { spmbService, PendaftaranCalonMhs, PendaftaranBerkas } from '@/services/spmb.service';
import type { SpmbPotonganCalon } from '@/types/spmb.types';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectOption } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useAuth } from '@/hooks/useAuth';
import { SPMB_STATUS_CONFIG, SpmbStatusBadge, SpmbPaymentBadge } from '@/components/spmb/SpmbStatusBadge';



// ============================================================
// CLEAN KEY-VALUE METADATA ITEM
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
// DAFTAR ULANG STATUS LABEL
// ============================================================
const STATUS_DAFTAR_ULANG_LABEL: Record<string, string> = {
  belum: 'Belum Daftar Ulang',
  menunggu_pembayaran: 'Menunggu Pembayaran',
  lunas: 'Lunas',
};

const STATUS_DAFTAR_ULANG_VARIANT: Record<string, 'green' | 'yellow' | 'blue' | 'gray'> = {
  belum: 'gray',
  menunggu_pembayaran: 'yellow',
  lunas: 'green',
};

// ============================================================
// SECTION WRAPPER
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
        className="w-full px-5 py-3.5 bg-slate-50/80 hover:bg-slate-100/80 flex items-center justify-between border-b border-slate-200/60 transition-colors text-left"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-primary-100/60 text-primary-700">
            <Icon size={18} />
          </div>
          <span className="font-bold text-slate-900 text-sm md:text-base">{title}</span>
          {badgeCount !== undefined && (
            <span className="px-2.5 py-0.5 text-2xs font-extrabold rounded-full bg-slate-200 text-slate-700">
              {badgeCount}
            </span>
          )}
        </div>
        <div className="text-slate-400 p-1">
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>
      {isOpen && (
        <div className="p-5 animate-fade-in divide-y divide-slate-100">
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================================
// SKEMA POTONGAN BIAYA KUSTOM PER CALON
// ============================================================
const potonganCalonSchema = z.object({
  komponen_biaya_id: z.number().min(1, 'Pilih komponen biaya'),
  nama_potongan: z.string().min(1, 'Nama potongan wajib diisi').max(150, 'Maksimal 150 karakter'),
  tipe_potongan: z.enum(['nominal', 'persen']),
  nilai_potongan: z.number().min(0, 'Nilai minimal 0'),
  tahap: z.enum(['pendaftaran', 'daftar_ulang', 'keduanya']),
  nomor_sk: z.string().max(100, 'Maksimal 100 karakter').optional().or(z.literal('')),
  keterangan: z.string().optional().or(z.literal('')),
  berlaku_mulai: z.string().optional().or(z.literal('')),
  berlaku_sampai: z.string().optional().or(z.literal('')),
  status: z.enum(['draft', 'aktif', 'dibatalkan']),
});

type PotonganCalonFormValues = z.infer<typeof potonganCalonSchema>;

// ============================================================
// SKEMA PENETAPAN HASIL SELEKSI
// ============================================================
const hasilSeleksiSchema = z
  .object({
    status: z.enum(['lulus', 'tidak_lulus', 'cadangan']),
    program_studi_diterima_id: z.number().optional(),
    nilai_total: z.number().min(0).optional(),
    peringkat: z.number().min(1).optional(),
    catatan: z.string().max(1000, 'Maksimal 1000 karakter').optional().or(z.literal('')),
  })
  .refine((d) => d.status !== 'lulus' || (d.program_studi_diterima_id && d.program_studi_diterima_id > 0), {
    message: 'Program studi diterima wajib dipilih untuk status lulus.',
    path: ['program_studi_diterima_id'],
  });

type HasilSeleksiFormValues = z.infer<typeof hasilSeleksiSchema>;

// Nilai tetap domain (closed-set, bukan entitas master) — dipusatkan di satu lokasi.
const TIPE_POTONGAN_OPTIONS: SelectOption[] = [
  { value: 'persen', label: 'Persen (%)' },
  { value: 'nominal', label: 'Nominal (Rp)' },
];

const TAHAP_POTONGAN_OPTIONS: SelectOption[] = [
  { value: 'pendaftaran', label: 'Pendaftaran' },
  { value: 'daftar_ulang', label: 'Daftar Ulang' },
  { value: 'keduanya', label: 'Pendaftaran & Daftar Ulang' },
];

const STATUS_POTONGAN_OPTIONS: SelectOption[] = [
  { value: 'aktif', label: 'Aktif' },
  { value: 'draft', label: 'Draft' },
  { value: 'dibatalkan', label: 'Dibatalkan' },
];

const STATUS_KELULUSAN_OPTIONS: SelectOption[] = [
  { value: 'lulus', label: 'Lulus' },
  { value: 'tidak_lulus', label: 'Tidak Lulus' },
  { value: 'cadangan', label: 'Cadangan' },
];

// ============================================================
// SEPARATE DETAIL PAGE FOR PENDAFTARAN VERIFICATION
// ============================================================
export default function DetailPendaftaranPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const id = Number(resolvedParams.id);

  const { hasPermission } = useAuth();
  const canKonversiMahasiswa = hasPermission('spmb.manage');

  const [pendaftar, setPendaftar] = useState<PendaftaranCalonMhs | null>(null);
  const [loading, setLoading] = useState(true);

  // Status update state
  const [updateStatusLoading, setUpdateStatusLoading] = useState(false);
  const [downloadingSk, setDownloadingSk] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [catatanVerifikasi, setCatatanVerifikasi] = useState('');

  const handleDownloadSk = async () => {
    if (!pendaftar?.id) return;
    try {
      setDownloadingSk(true);
      await spmbService.downloadSkLulusPdf(pendaftar.id, pendaftar.no_pendaftaran);
      toast.success('SK Tanda Lulus berhasil diunduh.');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || 'Gagal mengunduh SK Tanda Lulus.');
    } finally {
      setDownloadingSk(false);
    }
  };

  // Konversi manual ke Mahasiswa
  const [showKonversiConfirm, setShowKonversiConfirm] = useState(false);
  const [showKonversiOverride, setShowKonversiOverride] = useState(false);
  const [isKonversiLoading, setIsKonversiLoading] = useState(false);

  const handleOpenKonversi = () => {
    if (!pendaftar) return;
    if (pendaftar.status === 'mahasiswa_baru') {
      toast.error(`Pendaftar ini sudah dikonversi menjadi mahasiswa${pendaftar.nim ? ` (NIM: ${pendaftar.nim})` : ''}.`);
      return;
    }
    if (pendaftar.status !== 'lulus_administrasi') {
      toast.error('Belum memenuhi syarat konversi. Hanya pendaftar berstatus "Lulus Administrasi" yang dapat dijadikan mahasiswa.');
      return;
    }
    setShowKonversiConfirm(true);
  };

  const handleKonversiMahasiswa = async (force = false) => {
    if (!pendaftar?.id) return;
    setIsKonversiLoading(true);
    try {
      const res = await spmbService.konversiMahasiswa(pendaftar.id, force ? { force: true } : undefined);
      toast.success(`✅ Berhasil dikonversi! NIM: ${res.data.nim}`);
      setShowKonversiConfirm(false);
      setShowKonversiOverride(false);
      fetchDetail(id);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const errors = error?.response?.data?.errors || {};
      if (errors.daftar_ulang) {
        setShowKonversiConfirm(false);
        setShowKonversiOverride(true);
        return;
      }
      const msg = Object.keys(errors).length
        ? Object.values(errors).flat().join(' ')
        : error?.response?.data?.message || 'Gagal mengonversi ke mahasiswa.';
      toast.error(msg);
    } finally {
      setIsKonversiLoading(false);
    }
  };

  // ---- Potongan Biaya Kustom per Calon ----
  const [potonganList, setPotonganList] = useState<SpmbPotonganCalon[]>([]);
  const [komponenList, setKomponenList] = useState<{ id: number; kode?: string; nama: string }[]>([]);
  const [loadingPotongan, setLoadingPotongan] = useState(false);
  const [showPotonganModal, setShowPotonganModal] = useState(false);
  const [editingPotongan, setEditingPotongan] = useState<SpmbPotonganCalon | null>(null);
  const [savingPotongan, setSavingPotongan] = useState(false);
  const [deletePotonganState, setDeletePotonganState] = useState<{ open: boolean; item: SpmbPotonganCalon | null; loading: boolean }>({
    open: false,
    item: null,
    loading: false,
  });

  const {
    register: registerPotongan,
    handleSubmit: handlePotonganSubmit,
    control: controlPotongan,
    reset: resetPotongan,
    watch: watchPotongan,
    formState: { errors: errorsPotongan },
  } = useForm<PotonganCalonFormValues>({
    resolver: zodResolver(potonganCalonSchema),
    defaultValues: {
      komponen_biaya_id: 0,
      nama_potongan: '',
      tipe_potongan: 'persen',
      nilai_potongan: 0,
      tahap: 'keduanya',
      nomor_sk: '',
      keterangan: '',
      berlaku_mulai: '',
      berlaku_sampai: '',
      status: 'aktif',
    },
  });
  const tipePotongan = watchPotongan('tipe_potongan');

  const fetchPotongan = async (pendaftaranId: number) => {
    try {
      setLoadingPotongan(true);
      const res = await spmbService.getPotonganCalon(pendaftaranId, { per_page: 100 });
      setPotonganList(res.data || []);
    } catch {
      setPotonganList([]);
    } finally {
      setLoadingPotongan(false);
    }
  };

  const fetchKomponen = async () => {
    try {
      const res = await spmbService.getKomponenBiayaList({ is_active: true, limit: 100 });
      const list = Array.isArray(res?.data) ? res.data : res?.data?.items || [];
      setKomponenList(list);
    } catch {
      setKomponenList([]);
    }
  };

  const loadKomponenOptions = async (search: string) => {
    try {
      const res = await spmbService.getKomponenBiayaList({ is_active: true, search: search || undefined, limit: 20 });
      const items = Array.isArray(res?.data) ? res.data : res?.data?.items || [];
      return items.map((k: any) => ({
        value: k.id,
        label: `${k.nama}${k.kode ? ` (${k.kode})` : ''}`,
      }));
    } catch {
      return [];
    }
  };

  const emptyPotonganForm = (): PotonganCalonFormValues => ({
    komponen_biaya_id: 0,
    nama_potongan: '',
    tipe_potongan: 'persen',
    nilai_potongan: 0,
    tahap: 'keduanya',
    nomor_sk: '',
    keterangan: '',
    berlaku_mulai: '',
    berlaku_sampai: '',
    status: 'aktif',
  });

  const handleOpenCreatePotongan = () => {
    setEditingPotongan(null);
    resetPotongan(emptyPotonganForm());
    setShowPotonganModal(true);
  };

  const handleOpenEditPotongan = (item: SpmbPotonganCalon) => {
    setEditingPotongan(item);
    resetPotongan({
      komponen_biaya_id: Number(item.komponen_biaya_id),
      nama_potongan: item.nama_potongan,
      tipe_potongan: item.tipe_potongan,
      nilai_potongan: Number(item.nilai_potongan),
      tahap: item.tahap,
      nomor_sk: item.nomor_sk || '',
      keterangan: item.keterangan || '',
      berlaku_mulai: item.berlaku_mulai || '',
      berlaku_sampai: item.berlaku_sampai || '',
      status: item.status,
    });
    setShowPotonganModal(true);
  };

  const submitPotongan = async (values: PotonganCalonFormValues) => {
    if (values.tipe_potongan === 'persen' && values.nilai_potongan > 100) {
      toast.error('Potongan persen maksimal 100.');
      return;
    }
    try {
      setSavingPotongan(true);
      const payload = {
        komponen_biaya_id: Number(values.komponen_biaya_id),
        nama_potongan: values.nama_potongan.trim(),
        tipe_potongan: values.tipe_potongan,
        nilai_potongan: Number(values.nilai_potongan),
        tahap: values.tahap,
        nomor_sk: values.nomor_sk?.trim() || undefined,
        keterangan: values.keterangan?.trim() || undefined,
        berlaku_mulai: values.berlaku_mulai || null,
        berlaku_sampai: values.berlaku_sampai || null,
        status: values.status,
      };
      if (editingPotongan) {
        await spmbService.updatePotonganCalon(editingPotongan.id, payload);
        toast.success('Potongan berhasil diperbarui.');
      } else {
        await spmbService.createPotonganCalon(id, payload);
        toast.success('Potongan berhasil ditambahkan.');
      }
      setShowPotonganModal(false);
      setEditingPotongan(null);
      fetchPotongan(id);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const msg = error?.response?.data?.errors
        ? Object.values(error.response.data.errors).flat().join(' ')
        : error?.response?.data?.message || 'Gagal menyimpan potongan.';
      toast.error(msg);
    } finally {
      setSavingPotongan(false);
    }
  };

  const handleConfirmDeletePotongan = async () => {
    if (!deletePotonganState.item) return;
    try {
      setDeletePotonganState((p) => ({ ...p, loading: true }));
      await spmbService.deletePotonganCalon(deletePotonganState.item.id);
      toast.success('Potongan berhasil dihapus.');
      setDeletePotonganState({ open: false, item: null, loading: false });
      fetchPotongan(id);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || 'Gagal menghapus potongan.');
      setDeletePotonganState((p) => ({ ...p, loading: false }));
    }
  };

  useEffect(() => {
    if (id) {
      fetchPotongan(id);
      fetchKomponen();
      fetchProdi();
    }
  }, [id]);

  // ---- Penetapan Hasil Seleksi ----
  const [showHasilModal, setShowHasilModal] = useState(false);
  const [savingHasil, setSavingHasil] = useState(false);
  const [prodiList, setProdiList] = useState<{ id: number; nama: string; jenjang?: string }[]>([]);

  const {
    register: registerHasil,
    handleSubmit: handleHasilSubmit,
    control: controlHasil,
    reset: resetHasil,
    formState: { errors: errorsHasil },
  } = useForm<HasilSeleksiFormValues>({
    resolver: zodResolver(hasilSeleksiSchema),
    defaultValues: { status: 'lulus', program_studi_diterima_id: undefined, nilai_total: 0, peringkat: undefined, catatan: '' },
  });

  const fetchProdi = async () => {
    try {
      const res = await spmbService.getProgramStudi({ limit: 100 });
      setProdiList(Array.isArray(res?.data) ? res.data : res?.data?.items || []);
    } catch {
      setProdiList([]);
    }
  };

  const loadProdiOptions = async (search: string) => {
    try {
      const res = await spmbService.getProgramStudi({ search: search || undefined, limit: 20 });
      const items = Array.isArray(res?.data) ? res.data : res?.data?.items || [];
      return items.map((p: any) => ({
        value: p.id,
        label: `${p.jenjang ? `[${p.jenjang}] ` : ''}${p.nama}`,
      }));
    } catch {
      return [];
    }
  };

  const handleOpenHasilSeleksi = () => {
    const h = pendaftar?.hasil_seleksi;
    resetHasil({
      status: h?.status || 'lulus',
      program_studi_diterima_id: h?.program_studi_diterima_id
        ? Number(h.program_studi_diterima_id)
        : pendaftar?.program_studi_id
        ? Number(pendaftar.program_studi_id)
        : undefined,
      nilai_total: h?.nilai_total ? Number(h.nilai_total) : 0,
      peringkat: h?.peringkat ? Number(h.peringkat) : undefined,
      catatan: h?.catatan || '',
    });
    setShowHasilModal(true);
  };

  const submitHasilSeleksi = async (values: HasilSeleksiFormValues) => {
    if (!pendaftar?.id) return;
    try {
      setSavingHasil(true);
      await spmbService.tetapkanHasilSeleksi(pendaftar.id, {
        status: values.status,
        program_studi_diterima_id: values.program_studi_diterima_id ? Number(values.program_studi_diterima_id) : undefined,
        nilai_total:
          values.nilai_total !== undefined && !Number.isNaN(Number(values.nilai_total)) ? Number(values.nilai_total) : 0,
        peringkat: values.peringkat ? Number(values.peringkat) : undefined,
        catatan: values.catatan?.trim() || undefined,
      });
      toast.success('Hasil seleksi berhasil ditetapkan.');
      setShowHasilModal(false);
      fetchDetail(id);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const msg = error?.response?.data?.errors
        ? Object.values(error.response.data.errors).flat().join(' ')
        : error?.response?.data?.message || 'Gagal menetapkan hasil seleksi.';
      toast.error(msg);
    } finally {
      setSavingHasil(false);
    }
  };



  // Fetch Detail Pendaftaran by ID
  const fetchDetail = async (pendaftarId: number) => {
    try {
      setLoading(true);
      const res = await spmbService.getPendaftaranDetail(pendaftarId);
      const pData = res.data?.id ? res.data : res.data?.data || res;
      setPendaftar(pData);
      setNewStatus(pData.status || 'draft');
      setCatatanVerifikasi(pData.catatan_verifikasi || '');
    } catch (error: any) {
      toast.error(error.message || 'Gagal memuat detail pendaftar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDetail(id);
    }
  }, [id]);

  // Document Verification Handler
  const handleVerifyBerkas = async (berkasId: number, isVerified: boolean) => {
    try {
      await spmbService.verifyBerkasPendaftaran(berkasId, { is_verified: isVerified });
      toast.success(`Berkas ditandai sebagai ${isVerified ? 'Valid' : 'Belum Valid'}`);
      fetchDetail(id);
    } catch (error: any) {
      toast.error(error.message || 'Gagal memverifikasi berkas');
    }
  };

  // Decision Handler
  const handleUpdateStatus = async () => {
    if (!pendaftar) return;
    try {
      setUpdateStatusLoading(true);
      await spmbService.updateStatusPendaftaran(pendaftar.id, { 
        status: newStatus, 
        catatan_verifikasi: catatanVerifikasi 
      });
      toast.success('Keputusan pendaftaran berhasil disimpan');
      fetchDetail(id);
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan keputusan pendaftaran');
    } finally {
      setUpdateStatusLoading(false);
    }
  };

  if (loading || !pendaftar) {
    return (
      <div className="space-y-6 pb-12">
        <PageHeader 
          title="Detail & Verifikasi Pendaftaran"
          action={
            <button 
              onClick={() => router.push('/spmb/pendaftaran')} 
              className="btn bg-orange-500 text-white hover:bg-orange-600 border-none shadow-sm font-bold text-xs"
            >
              <ArrowLeft size={16} className="mr-1.5" /> Kembali
            </button>
          }
        />
        <div className="flex flex-col items-center justify-center h-64 gap-3 bg-white rounded-xl border border-slate-200 p-8">
          <div className="spinner spinner-primary"></div>
          <span className="text-xs font-semibold text-slate-500">Memuat detail pendaftaran...</span>
        </div>
      </div>
    );
  }

  const daftarUlang = pendaftar.daftar_ulang;
  const tagihanDaftarUlang = daftarUlang?.tagihan ?? null;
  const statusDaftarUlang = daftarUlang?.status_daftar_ulang || 'belum';
  const daftarUlangLunas = (tagihanDaftarUlang?.sisa_kurang ?? 0) <= 0;

  return (
    <div className="animate-fade-in space-y-6 pb-16">
      <PageHeader 
        title="Detail & Verifikasi Pendaftaran"
        description="Kelola verifikasi berkas dan tentukan keputusan pendaftaran calon mahasiswa."
        backUrl="/spmb/pendaftaran"
        action={
          (pendaftar.status === 'lulus_administrasi' || pendaftar.status === 'mahasiswa_baru' || pendaftar.hasil_seleksi?.status === 'lulus') ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadSk}
              isLoading={downloadingSk}
              icon={<Download size={15} />}
              style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
              className="font-bold text-xs"
            >
              {downloadingSk ? 'Mengunduh...' : 'Unduh SK Tanda Lulus'}
            </Button>
          ) : undefined
        }
      />

      {/* 1. VISUAL ANCHOR HEADER CARD */}
      <div className="p-5 md:p-6 rounded-xl bg-white border border-slate-200 border-l-4 border-l-primary-600 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <span className="text-2xs font-extrabold text-slate-400 uppercase tracking-widest block">NAMA CALON MAHASISWA</span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
            {pendaftar.nama_lengkap}
          </h2>
          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200 font-mono font-bold">
              <Hash size={13} className="text-slate-400 shrink-0" />
              <span>{pendaftar.no_pendaftaran}</span>
            </div>
            <div className="flex items-center gap-1 text-slate-500 font-semibold">
              <CreditCard size={13} className="text-slate-400 shrink-0" />
              <span>NIK: {pendaftar.nik || '-'}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap md:flex-col items-start md:items-end gap-2 shrink-0 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
          <SpmbStatusBadge status={pendaftar.status} />
          <SpmbPaymentBadge status={pendaftar.status_pembayaran} />
        </div>
      </div>

      {/* 2. GRID DETAILS AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        
        {/* LEFT & CENTER COLUMN: INFORMATION SECTIONS */}
        <div className="lg:col-span-2 xl:col-span-3 space-y-6">
          
          {/* SECTION A: BIODATA & IDENTITAS */}
          <DetailSection title="Identitas & Biodata Pendaftar" icon={User} defaultOpen={true}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3 pt-1">
              <MetadataItem label="Tempat, Tgl Lahir" value={`${pendaftar.tempat_lahir || '-'}, ${pendaftar.tanggal_lahir ? new Date(pendaftar.tanggal_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}`} />
              <MetadataItem label="Jenis Kelamin" value={pendaftar.jenis_kelamin === 'L' ? 'Laki-laki' : pendaftar.jenis_kelamin === 'P' ? 'Perempuan' : '-'} />
              <MetadataItem label="Agama" value={pendaftar.agama} />
              <MetadataItem label="Kewarganegaraan" value={pendaftar.kewarganegaraan} />
              <MetadataItem label="No. Handphone" value={pendaftar.no_hp || pendaftar.user?.phone} />
              <MetadataItem label="Email Account" value={pendaftar.user?.email || pendaftar.user?.username} />
            </div>
            <div className="pt-2">
              <MetadataItem label="Alamat Lengkap" value={pendaftar.alamat} />
            </div>
          </DetailSection>

          {/* SECTION B: INFORMASI AKADEMIK & PRODI */}
          <DetailSection title="Informasi Akademik & Prodi" icon={GraduationCap} defaultOpen={true}>
            <div className="space-y-4 pt-1">
              {/* Highlight Card for Program Studi */}
              <div className="p-4 bg-gradient-to-br from-primary-50/80 to-primary-50/40 border border-primary-200/80 rounded-xl space-y-1">
                <span className="text-2xs font-extrabold text-primary-700 uppercase tracking-widest block">PROGRAM STUDI PILIHAN</span>
                <div className="text-base font-black text-slate-900">
                  1. {pendaftar.program_studi?.nama || '-'} <span className="text-xs font-semibold text-primary-700">({pendaftar.program_studi?.jenjang || 'S1'})</span>
                </div>
                {pendaftar.program_studi_pilihan2?.nama && (
                  <div className="text-xs font-bold text-slate-700">
                    2. {pendaftar.program_studi_pilihan2.nama} <span className="text-2xs text-slate-500">({pendaftar.program_studi_pilihan2.jenjang || 'S1'})</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3 pt-1">
                <MetadataItem label="Asal Sekolah" value={pendaftar.asal_sekolah} />
                <MetadataItem label="Jurusan Sekolah" value={pendaftar.jurusan_sekolah} />
                <MetadataItem label="Tahun Lulus" value={pendaftar.tahun_lulus} />
                <MetadataItem label="NPSN Sekolah" value={pendaftar.npsn_sekolah} />
                <MetadataItem label="Nilai Rata Rapor" value={pendaftar.nilai_rata_rapor ? String(pendaftar.nilai_rata_rapor) : '-'} />
                <MetadataItem label="Gelombang Penerimaan" value={pendaftar.gelombang_penerimaan?.nama || 'Gelombang 1'} />
              </div>
            </div>
          </DetailSection>

          {/* SECTION C: DATA ORANG TUA / WALI */}
          <DetailSection title="Data Orang Tua & Wali" icon={Users} defaultOpen={false}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3 pt-1">
              <MetadataItem label="Nama Ayah" value={pendaftar.nama_ayah} />
              <MetadataItem label="Pekerjaan Ayah" value={pendaftar.pekerjaan_ayah} />
              <MetadataItem label="Nama Ibu" value={pendaftar.nama_ibu} />
              <MetadataItem label="Pekerjaan Ibu" value={pendaftar.pekerjaan_ibu} />
              <MetadataItem label="Penghasilan Ortu" value={pendaftar.penghasilan_ortu} />
              <MetadataItem label="Wali / Telepon" value={pendaftar.nama_wali ? `${pendaftar.nama_wali} (${pendaftar.telepon_wali || '-'})` : '-'} />
            </div>
          </DetailSection>

          {/* SECTION C2: KODE REFERRAL */}
          <DetailSection title="Kode Referral" icon={Gift} defaultOpen={false}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <MetadataItem label="Kode Digunakan" value={pendaftar.used_referral_code || '-'} />
              <MetadataItem label="Direferensikan Oleh" value={pendaftar.referrer?.name || pendaftar.referrer?.username || '-'} />
              <MetadataItem label="Kode Referrer" value={pendaftar.referrer?.referral_code || '-'} />
              <MetadataItem
                label="Divalidasi Pada"
                value={pendaftar.referral_validated_at ? new Date(pendaftar.referral_validated_at).toLocaleString('id-ID') : '-'}
              />
            </div>
          </DetailSection>

          {/* SECTION C3: PEMBAYARAN DAFTAR ULANG */}
          <DetailSection title="Pembayaran Daftar Ulang" icon={Wallet} defaultOpen={true}>
            {!tagihanDaftarUlang ? (
              <EmptyState
                icon={<ReceiptText size={32} className="text-slate-400" />}
                title="Belum ada tagihan daftar ulang"
                description="Tagihan daftar ulang diterbitkan setelah calon mahasiswa dinyatakan lulus seleksi."
                className="py-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl"
              />
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={STATUS_DAFTAR_ULANG_VARIANT[statusDaftarUlang] || 'gray'} className="text-2xs font-extrabold px-3 py-1">
                      {STATUS_DAFTAR_ULANG_LABEL[statusDaftarUlang] || statusDaftarUlang}
                    </Badge>
                    <Badge variant={daftarUlangLunas ? 'green' : (tagihanDaftarUlang.sudah_dibayar > 0 ? 'yellow' : 'red')} className="text-2xs font-extrabold px-3 py-1">
                      Tagihan: {(tagihanDaftarUlang.status || '-').replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <span className="text-2xs font-bold text-slate-500 font-mono">
                    {tagihanDaftarUlang.nomor_tagihan || '-'}
                  </span>
                </div>

                {/* Ringkasan nominal */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60">
                    <span className="text-2xs font-extrabold uppercase tracking-wider text-slate-400 block">Total Tagihan</span>
                    <span className="text-base font-black text-slate-900">{formatCurrency(tagihanDaftarUlang.total_bersih)}</span>
                  </div>
                  <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/60">
                    <span className="text-2xs font-extrabold uppercase tracking-wider text-emerald-600 block">Sudah Dibayar</span>
                    <span className="text-base font-black text-emerald-700">{formatCurrency(tagihanDaftarUlang.sudah_dibayar)}</span>
                  </div>
                  <div className={`p-3 rounded-xl border ${daftarUlangLunas ? 'border-emerald-200 bg-emerald-50/60' : 'border-red-200 bg-red-50/60'}`}>
                    <span className={`text-2xs font-extrabold uppercase tracking-wider block ${daftarUlangLunas ? 'text-emerald-600' : 'text-red-500'}`}>Sisa Kurang</span>
                    <span className={`text-base font-black ${daftarUlangLunas ? 'text-emerald-700' : 'text-red-600'}`}>{formatCurrency(tagihanDaftarUlang.sisa_kurang)}</span>
                  </div>
                </div>

                {/* Progress pembayaran */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-2xs font-bold text-slate-500">
                    <span>Progres Pembayaran</span>
                    <span>{tagihanDaftarUlang.persen_terbayar}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, Math.max(0, tagihanDaftarUlang.persen_terbayar))}%`, backgroundColor: 'var(--module-primary)' }}
                    />
                  </div>
                </div>

                {/* Meta & VA */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <MetadataItem
                    label="Jatuh Tempo"
                    value={tagihanDaftarUlang.due_date ? new Date(tagihanDaftarUlang.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                  />
                  <MetadataItem
                    label="Potongan / Denda"
                    value={`${formatCurrency(tagihanDaftarUlang.total_potongan)} / ${formatCurrency(tagihanDaftarUlang.total_denda)}`}
                  />
                  {tagihanDaftarUlang.virtual_account && (
                    <>
                      <MetadataItem
                        label="Virtual Account"
                        value={`${tagihanDaftarUlang.virtual_account.bank_nama || tagihanDaftarUlang.virtual_account.bank_kode || '-'} • ${tagihanDaftarUlang.virtual_account.va_number || '-'}`}
                      />
                      <MetadataItem
                        label="VA Berlaku Hingga"
                        value={tagihanDaftarUlang.virtual_account.expired_at ? new Date(tagihanDaftarUlang.virtual_account.expired_at).toLocaleString('id-ID') : '-'}
                      />
                    </>
                  )}
                </div>

                {/* Riwayat pembayaran */}
                <div>
                  <span className="text-2xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-4">
                    <CalendarClock size={16} /> Riwayat Pembayaran
                  </span>
                  {tagihanDaftarUlang.riwayat_pembayaran.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Belum ada pembayaran tercatat.</p>
                  ) : (
                    <div className="space-y-4">
                      {tagihanDaftarUlang.riwayat_pembayaran.map((bayar) => (
                        <div key={bayar.id} className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg border border-slate-200 bg-white">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                              <Landmark size={16} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-800">{formatCurrency(bayar.jumlah_bayar)}</span>
                              <span className="text-2xs text-slate-400 font-semibold">{bayar.kode_transaksi || '-'} • {bayar.channel_bayar || '-'}</span>
                            </div>
                          </div>
                          <span className="text-2xs font-bold text-slate-500">
                            {bayar.paid_at ? new Date(bayar.paid_at).toLocaleString('id-ID') : '-'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </DetailSection>

          {/* SECTION: POTONGAN BIAYA KHUSUS PER CALON */}
          <DetailSection title="Potongan Biaya Khusus" icon={Percent} defaultOpen={true} badgeCount={potonganList.length}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 pb-2">
              <p className="text-2xs text-slate-500">
                Potongan kustom per calon (menunjuk 1 komponen biaya). Diterapkan otomatis saat tagihan pendaftaran/daftar ulang dibuat.
              </p>
              {canKonversiMahasiswa && (
                <Button variant="outline" size="sm" icon={<Plus size={16} />} onClick={handleOpenCreatePotongan} className="shrink-0">
                  Tambah Potongan
                </Button>
              )}
            </div>

            {loadingPotongan ? (
              <div className="py-4 text-center text-xs text-slate-400">Memuat potongan...</div>
            ) : potonganList.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">Belum ada potongan khusus untuk calon ini.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {potonganList.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 truncate">{p.nama_potongan}</span>
                        <Badge variant={p.status === 'aktif' ? 'success' : p.status === 'draft' ? 'secondary' : 'danger'}>{p.status}</Badge>
                      </div>
                      <div className="text-2xs text-slate-500 mt-0.5">
                        {p.nama_komponen || p.komponen_biaya?.nama || '-'}
                        {' • '}
                        {p.tipe_potongan === 'persen' ? `${Number(p.nilai_potongan)}%` : formatCurrency(Number(p.nilai_potongan))}
                        {' • '}Tahap: {String(p.tahap).replace('_', ' ')}
                        {p.nomor_sk ? ` • SK: ${p.nomor_sk}` : ''}
                      </div>
                    </div>
                    {canKonversiMahasiswa && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenEditPotongan(p)} title="Edit potongan">
                          <Pencil size={15} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeletePotonganState({ open: true, item: p, loading: false })} title="Hapus potongan">
                          <Trash2 size={15} className="text-red-500" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </DetailSection>

          {/* SECTION D: DOCUMENT VERIFICATION */}
          <DetailSection 
            title="Berkas Pendukung" 
            icon={FileCheck} 
            defaultOpen={true}
            badgeCount={pendaftar.dokumen_pendaftaran?.length || 0}
          >
            {(!pendaftar.dokumen_pendaftaran || pendaftar.dokumen_pendaftaran.length === 0) ? (
              <EmptyState
                icon={<FileText size={32} className="text-slate-400" />}
                title="Belum ada berkas terunggah"
                description="Calon mahasiswa ini belum mengunggah berkas persyaratan pendaftaran."
                className="py-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl"
              />
            ) : (
              <div className="space-y-3 pt-1">
                {pendaftar.dokumen_pendaftaran.map((berkas: PendaftaranBerkas) => (
                  <div key={berkas.id} className="p-4 rounded-xl border border-slate-200 bg-white hover:border-primary-300 shadow-2xs transition-all space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <FileText size={18} className="text-primary-600 shrink-0" />
                        <span className="font-bold text-slate-900 text-sm capitalize">
                          {(berkas.jenis_berkas || berkas.jenis_dokumen || 'dokumen').replace(/_/g, ' ')}
                        </span>
                      </div>
                      {berkas.is_verified ? (
                        <Badge variant="green" className="text-2xs font-extrabold px-3 py-1">
                          <Check size={12} className="mr-1" /> Valid
                        </Badge>
                      ) : (
                        <Badge variant="yellow" className="text-2xs font-extrabold px-3 py-1">
                          <Clock size={12} className="mr-1" /> Belum Valid
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                      <a 
                        href={`${process.env.NEXT_PUBLIC_API_URL || ''}/storage/${berkas.file_path}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-800 font-extrabold hover:underline"
                      >
                        <ExternalLink size={14} />
                        Lihat Dokumen Fullscreen
                      </a>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant={berkas.is_verified ? "primary" : "outline"}
                          onClick={() => handleVerifyBerkas(berkas.id, true)}
                          className="text-xs py-1 px-3.5 h-8 font-extrabold"
                        >
                          Set Valid
                        </Button>
                        <Button 
                          size="sm" 
                          variant={!berkas.is_verified ? "danger" : "outline"}
                          onClick={() => handleVerifyBerkas(berkas.id, false)}
                          className="text-xs py-1 px-3.5 h-8 font-extrabold"
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

        </div>

        {/* RIGHT COLUMN: KEPUTUSAN ADMINISTRASI STICKY ACTION CARD */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-3">
              <ShieldCheck size={20} className="text-primary-600" />
              <h3 className="font-black text-base uppercase tracking-wide">Keputusan Administrasi</h3>
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
                  <span>Calon mahasiswa akan mendapatkan status LUNAS Administrasi dan berhak mengikuti tahap berikutnya.</span>
                </div>
              )}

              <Textarea
                label="Catatan Verifikasi (Tampil ke Calon Mhs)"
                value={catatanVerifikasi}
                onChange={(e) => setCatatanVerifikasi(e.target.value)}
                placeholder="Contoh: Berkas Ijazah belum terunggah dengan jelas, mohon unggah ulang..."
                rows={4}
              />

              <Button 
                onClick={handleUpdateStatus} 
                isLoading={updateStatusLoading}
                variant="primary"
                icon={<Save size={16} />}
                className="w-full font-black shadow-md min-h-[46px] text-sm"
              >
                {updateStatusLoading ? 'Menyimpan Keputusan...' : 'Simpan Keputusan'}
              </Button>

              {/* Penetapan Hasil Seleksi (lulus/tidak lulus/cadangan) */}
              {canKonversiMahasiswa && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  {pendaftar.hasil_seleksi ? (
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                      <p className="text-2xs font-bold text-slate-500 uppercase tracking-wider">Hasil Seleksi</p>
                      <p className="text-xs font-bold text-slate-800 capitalize">
                        {String(pendaftar.hasil_seleksi.status).replace('_', ' ')}
                      </p>
                      {pendaftar.hasil_seleksi.program_studi_diterima?.nama && (
                        <p className="text-2xs text-slate-500">{pendaftar.hasil_seleksi.program_studi_diterima.nama}</p>
                      )}
                    </div>
                  ) : null}
                  <Button
                    onClick={handleOpenHasilSeleksi}
                    variant="outline"
                    icon={<GraduationCap size={16} />}
                    className="w-full font-bold text-xs py-2.5"
                    style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
                  >
                    {pendaftar.hasil_seleksi ? 'Perbarui Hasil Seleksi' : 'Tetapkan Hasil Seleksi'}
                  </Button>
                  <p className="text-2xs text-slate-400 text-center">
                    Menetapkan status Lulus membuka tahap Daftar Ulang.
                  </p>
                </div>
              )}

              {(pendaftar.status === 'lulus_administrasi' || pendaftar.status === 'mahasiswa_baru' || pendaftar.hasil_seleksi?.status === 'lulus') && (
                <div className="pt-2 border-t border-slate-100">
                  <Button 
                    onClick={handleDownloadSk} 
                    isLoading={downloadingSk}
                    variant="outline"
                    icon={<Download size={16} />}
                    style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
                    className="w-full font-bold text-xs py-2.5"
                  >
                    {downloadingSk ? 'Mengunduh SK...' : 'Unduh SK Tanda Lulus (PDF)'}
                  </Button>
                </div>
              )}

              {/* Tombol Konversi ke Mahasiswa — selalu tampil untuk admin; validasi syarat saat diklik */}
              {canKonversiMahasiswa && (
                <div className="pt-2 border-t border-slate-100">
                  <Button
                    onClick={handleOpenKonversi}
                    variant="primary"
                    icon={<UserCheck size={16} />}
                    className="w-full font-black text-xs py-2.5"
                    style={{ backgroundColor: 'var(--module-primary)' }}
                  >
                    Konversi ke Mahasiswa
                  </Button>
                  <p className="text-2xs text-slate-400 text-center mt-1">
                    Langsung terbitkan NIM, aktifkan akun mahasiswa &amp; email kampus
                  </p>
                </div>
              )}

              {/* Badge info jika sudah dikonversi */}
              {pendaftar.status === 'mahasiswa_baru' && pendaftar.nim && (
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <UserCheck size={16} className="text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-2xs font-bold text-emerald-700">Sudah Dikonversi</p>
                    <p className="text-xs text-emerald-600 font-mono">{pendaftar.nim}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ConfirmDialog: Konversi ke Mahasiswa */}
      <ConfirmDialog
        isOpen={showKonversiConfirm}
        onClose={() => {
          if (!isKonversiLoading) setShowKonversiConfirm(false);
        }}
        onConfirm={() => handleKonversiMahasiswa()}
        title="Konversi ke Mahasiswa?"
        message={
          <span>
            Tindakan ini akan langsung menerbitkan <strong>NIM</strong>, mengaktifkan{' '}
            <strong>akun mahasiswa</strong>, dan membuat <strong>email kampus</strong> untuk{' '}
            <strong>{pendaftar?.nama_lengkap}</strong>.
            <br /><br />
            <span className="text-amber-600 font-semibold">
              ⚠️ Tindakan ini tidak dapat dibatalkan.
            </span>
          </span>
        }
        confirmText="Ya, Konversi Sekarang"
        cancelText="Batal"
        variant="warning"
        isLoading={isKonversiLoading}
      />

      {/* ConfirmDialog: Override konversi saat daftar ulang belum lunas */}
      <ConfirmDialog
        isOpen={showKonversiOverride}
        onClose={() => {
          if (!isKonversiLoading) setShowKonversiOverride(false);
        }}
        onConfirm={() => handleKonversiMahasiswa(true)}
        title="Daftar Ulang Belum Lunas"
        message={
          <span>
            Tagihan <strong>daftar ulang</strong> untuk <strong>{pendaftar?.nama_lengkap}</strong> belum lunas.
            Konversi tetap dapat dilakukan dengan <strong>override</strong> (mis. kebijakan khusus/beasiswa).
            <br /><br />
            <span className="text-amber-600 font-semibold">
              ⚠️ Override ini dicatat pada audit log.
            </span>
          </span>
        }
        confirmText="Tetap Konversi (Override)"
        cancelText="Batal"
        variant="danger"
        isLoading={isKonversiLoading}
      />

      {/* Modal: Potongan Biaya Khusus per Calon */}
      <Modal
        open={showPotonganModal}
        onClose={() => {
          if (!savingPotongan) {
            setShowPotonganModal(false);
            setEditingPotongan(null);
          }
        }}
        title={editingPotongan ? 'Edit Potongan Biaya' : 'Tambah Potongan Biaya'}
      >
        <form onSubmit={handlePotonganSubmit(submitPotongan)} className="space-y-4 pt-1">
          <Controller
            control={controlPotongan}
            name="komponen_biaya_id"
            render={({ field }) => (
              <AsyncSelect
                label="Komponen Biaya *"
                required
                placeholder="Cari komponen biaya..."
                defaultOptions
                value={field.value || null}
                onChange={(opt: any) => field.onChange(opt ? Number(opt.value) : undefined)}
                loadOptions={loadKomponenOptions}
                error={errorsPotongan.komponen_biaya_id?.message}
                hint="Potongan menunjuk tepat satu komponen biaya."
              />
            )}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nama Potongan *"
              placeholder="Contoh: Keringanan Rektorat"
              error={errorsPotongan.nama_potongan?.message}
              {...registerPotongan('nama_potongan')}
            />
            <Controller
              control={controlPotongan}
              name="tipe_potongan"
              render={({ field }) => (
                <Select
                  label="Tipe Potongan *"
                  required
                  value={field.value}
                  onChange={field.onChange}
                  options={TIPE_POTONGAN_OPTIONS}
                  error={errorsPotongan.tipe_potongan?.message}
                />
              )}
            />
            <Input
              type="number"
              min={0}
              max={tipePotongan === 'persen' ? 100 : undefined}
              label={tipePotongan === 'persen' ? 'Nilai Potongan (%) *' : 'Nilai Potongan (Rp) *'}
              error={errorsPotongan.nilai_potongan?.message}
              {...registerPotongan('nilai_potongan', { valueAsNumber: true })}
            />
            <Controller
              control={controlPotongan}
              name="tahap"
              render={({ field }) => (
                <Select
                  label="Berlaku Pada Tahap *"
                  required
                  value={field.value}
                  onChange={field.onChange}
                  options={TAHAP_POTONGAN_OPTIONS}
                  error={errorsPotongan.tahap?.message}
                />
              )}
            />
            <Input
              label="Nomor SK (Opsional)"
              placeholder="SK/012/2026"
              error={errorsPotongan.nomor_sk?.message}
              {...registerPotongan('nomor_sk')}
            />
            <Controller
              control={controlPotongan}
              name="status"
              render={({ field }) => (
                <Select
                  label="Status *"
                  required
                  value={field.value}
                  onChange={field.onChange}
                  options={STATUS_POTONGAN_OPTIONS}
                  error={errorsPotongan.status?.message}
                />
              )}
            />
            <Input
              type="date"
              label="Berlaku Mulai (Opsional)"
              error={errorsPotongan.berlaku_mulai?.message}
              {...registerPotongan('berlaku_mulai')}
            />
            <Input
              type="date"
              label="Berlaku Sampai (Opsional)"
              error={errorsPotongan.berlaku_sampai?.message}
              {...registerPotongan('berlaku_sampai')}
            />
          </div>
          <Textarea
            label="Keterangan / Dasar (Opsional)"
            placeholder="Alasan/dasar pemberian potongan..."
            rows={2}
            error={errorsPotongan.keterangan?.message}
            {...registerPotongan('keterangan')}
          />
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowPotonganModal(false);
                setEditingPotongan(null);
              }}
              disabled={savingPotongan}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" loading={savingPotongan} icon={<Save size={16} />}>
              Simpan
            </Button>
          </div>
        </form>
      </Modal>

      {/* ConfirmDialog: Hapus Potongan Khusus */}
      <ConfirmDialog
        isOpen={deletePotonganState.open}
        onClose={() => {
          if (!deletePotonganState.loading) setDeletePotonganState({ open: false, item: null, loading: false });
        }}
        onConfirm={handleConfirmDeletePotongan}
        title="Hapus Potongan?"
        message={
          <span>
            Hapus potongan <strong>{deletePotonganState.item?.nama_potongan}</strong> untuk komponen{' '}
            <strong>{deletePotonganState.item?.nama_komponen}</strong>? Tindakan ini tidak dapat dibatalkan.
          </span>
        }
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
        isLoading={deletePotonganState.loading}
      />

      {/* Modal: Penetapan Hasil Seleksi */}
      <Modal
        open={showHasilModal}
        onClose={() => {
          if (!savingHasil) setShowHasilModal(false);
        }}
        title="Penetapan Hasil Seleksi"
      >
        <form onSubmit={handleHasilSubmit(submitHasilSeleksi)} className="space-y-4 pt-1">
          <Controller
            control={controlHasil}
            name="status"
            render={({ field }) => (
              <Select
                label="Status Kelulusan *"
                required
                value={field.value}
                onChange={field.onChange}
                options={STATUS_KELULUSAN_OPTIONS}
                error={errorsHasil.status?.message}
              />
            )}
          />
          <Controller
            control={controlHasil}
            name="program_studi_diterima_id"
            render={({ field }) => (
              <AsyncSelect
                label="Program Studi Diterima *"
                required
                placeholder="Cari program studi..."
                defaultOptions
                value={field.value || null}
                onChange={(opt: any) => field.onChange(opt ? Number(opt.value) : undefined)}
                loadOptions={loadProdiOptions}
                error={errorsHasil.program_studi_diterima_id?.message}
                hint="Wajib untuk status Lulus."
              />
            )}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="number"
              min={0}
              label="Nilai Total (Opsional)"
              error={errorsHasil.nilai_total?.message}
              {...registerHasil('nilai_total', {
                setValueAs: (v) => (v === '' || v === null || v === undefined || Number.isNaN(Number(v)) ? undefined : Number(v)),
              })}
            />
            <Input
              type="number"
              min={1}
              label="Peringkat (Opsional)"
              error={errorsHasil.peringkat?.message}
              {...registerHasil('peringkat', {
                setValueAs: (v) => (v === '' || v === null || v === undefined || Number.isNaN(Number(v)) ? undefined : Number(v)),
              })}
            />
          </div>
          <Textarea
            label="Catatan (Opsional)"
            placeholder="Catatan hasil seleksi..."
            rows={2}
            error={errorsHasil.catatan?.message}
            {...registerHasil('catatan')}
          />
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setShowHasilModal(false)} disabled={savingHasil}>
              Batal
            </Button>
            <Button type="submit" variant="primary" loading={savingHasil} icon={<Save size={16} />}>
              Simpan Hasil Seleksi
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
