'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { sinapraService } from '@/services/sinapra.service';
import type { PaginationMeta } from '@/types/api.types';
import type {
  LabBhp,
  BebasTanggungan,
  AlatKalibrasi,
} from '@/types/sinapra.types';
import {
  FlaskConical,
  FileCheck2,
  SlidersHorizontal,
  Plus,
  Filter,
  Trash2,
  ArrowDownUp,
  CheckCircle,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';

type TabType = 'bhp' | 'bebas_tanggungan' | 'kalibrasi';

// ─────────────────────────────────────────────────────────────
// ZOD VALIDATION SCHEMAS (WAJIB DI LUAR KOMPONEN)
// ─────────────────────────────────────────────────────────────

const transaksiBhpSchema = z.object({
  jenis_transaksi: z.enum(['masuk', 'keluar']),
  jumlah: z.number().positive('Jumlah mutasi harus lebih besar dari 0'),
  keterangan: z.string().optional(),
});

type TransaksiBhpFormData = z.infer<typeof transaksiBhpSchema>;

const sbtApplySchema = z.object({
  catatan: z.string().min(5, 'Alasan/catatan pengajuan surat minimal 5 karakter'),
});

type SbtApplyFormData = z.infer<typeof sbtApplySchema>;

const sbtApproveSchema = z.object({
  is_approved: z.enum(['true', 'false']),
  catatan: z.string().optional(),
});

type SbtApproveFormData = z.infer<typeof sbtApproveSchema>;

export default function SinapraLaboratoriumPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('bhp');

  // ─────────────────────────────────────────────────────────────
  // 1. STATE TAB 1: BAHAN HABIS PAKAI (BHP)
  // ─────────────────────────────────────────────────────────────
  const [bhpList, setBhpList] = useState<LabBhp[]>([]);
  const [bhpMeta, setBhpMeta] = useState<PaginationMeta>({
    current_page: 1,
    per_page: 15,
    total: 0,
    last_page: 1,
  });
  const [bhpLoading, setBhpLoading] = useState(false);
  const [bhpPage, setBhpPage] = useState(1);
  const [bhpSearch, setBhpSearch] = useState('');
  const [bhpKategori, setBhpKategori] = useState('');
  const [bhpRuanganId, setBhpRuanganId] = useState<string>('');
  const [bhpLokasi, setBhpLokasi] = useState('');
  const [bhpSatuan, setBhpSatuan] = useState('');
  const [bhpStatusStok, setBhpStatusStok] = useState('');
  const [bhpOrderBy, setBhpOrderBy] = useState('created_at');
  const [bhpOrderDir, setBhpOrderDir] = useState<'asc' | 'desc'>('desc');
  const [showBhpFilter, setShowBhpFilter] = useState(false);

  // Modal Mutasi Stok BHP (<= 5 inputs)
  const [isTransaksiModalOpen, setIsTransaksiModalOpen] = useState(false);
  const [selectedBhpForTransaksi, setSelectedBhpForTransaksi] = useState<LabBhp | null>(null);

  const {
    register: registerTransaksi,
    handleSubmit: handleSubmitTransaksi,
    reset: resetTransaksi,
    setValue: setTransaksiValue,
    watch: watchTransaksi,
    formState: { errors: transaksiErrors, isSubmitting: isTransaksiSubmitting },
  } = useForm<TransaksiBhpFormData>({
    resolver: zodResolver(transaksiBhpSchema),
    defaultValues: {
      jenis_transaksi: 'keluar',
      jumlah: 1,
      keterangan: '',
    },
  });

  // ─────────────────────────────────────────────────────────────
  // 2. STATE TAB 2: SURAT BEBAS TANGGUNGAN
  // ─────────────────────────────────────────────────────────────
  const [sbtList, setSbtList] = useState<BebasTanggungan[]>([]);
  const [sbtMeta, setSbtMeta] = useState<PaginationMeta>({
    current_page: 1,
    per_page: 15,
    total: 0,
    last_page: 1,
  });
  const [sbtLoading, setSbtLoading] = useState(false);
  const [sbtPage, setSbtPage] = useState(1);
  const [sbtSearch, setSbtSearch] = useState('');
  const [sbtStatus, setSbtStatus] = useState('');
  const [sbtCatatan, setSbtCatatan] = useState('');
  const [sbtTanggalPengajuan, setSbtTanggalPengajuan] = useState('');
  const [sbtOrderBy, setSbtOrderBy] = useState('created_at');
  const [sbtOrderDir, setSbtOrderDir] = useState<'asc' | 'desc'>('desc');
  const [showSbtFilter, setShowSbtFilter] = useState(false);

  // Modal Permohonan SBT (<= 5 inputs)
  const [isSbtModalOpen, setIsSbtModalOpen] = useState(false);
  const {
    register: registerSbtApply,
    handleSubmit: handleSubmitSbtApply,
    reset: resetSbtApply,
    formState: { errors: sbtApplyErrors, isSubmitting: isSbtSubmitting },
  } = useForm<SbtApplyFormData>({
    resolver: zodResolver(sbtApplySchema),
    defaultValues: {
      catatan: '',
    },
  });

  // Modal Approve SBT (<= 5 inputs)
  const [approvingSbt, setApprovingSbt] = useState<BebasTanggungan | null>(null);
  const [sbtKelayakan, setSbtKelayakan] = useState<any>(null);
  const [isLoadingKelayakan, setIsLoadingKelayakan] = useState(false);

  const {
    register: registerSbtApprove,
    handleSubmit: handleSubmitSbtApprove,
    reset: resetSbtApprove,
    setValue: setSbtApproveValue,
    watch: watchSbtApprove,
    formState: { errors: sbtApproveErrors, isSubmitting: isApproveSubmitting },
  } = useForm<SbtApproveFormData>({
    resolver: zodResolver(sbtApproveSchema),
    defaultValues: {
      is_approved: 'true',
      catatan: '',
    },
  });

  // ─────────────────────────────────────────────────────────────
  // 3. STATE TAB 3: KALIBRASI ALAT PRESISI
  // ─────────────────────────────────────────────────────────────
  const [kalibrasiList, setKalibrasiList] = useState<AlatKalibrasi[]>([]);
  const [kalibrasiMeta, setKalibrasiMeta] = useState<PaginationMeta>({
    current_page: 1,
    per_page: 15,
    total: 0,
    last_page: 1,
  });
  const [kalibrasiLoading, setKalibrasiLoading] = useState(false);
  const [kalibrasiPage, setKalibrasiPage] = useState(1);
  const [kalibrasiSearch, setKalibrasiSearch] = useState('');
  const [kalibrasiStatus, setKalibrasiStatus] = useState('');
  const [kalibrasiMendekati, setKalibrasiMendekati] = useState(false);
  const [kalibrasiAsetId, setKalibrasiAsetId] = useState('');
  const [kalibrasiInstitusi, setKalibrasiInstitusi] = useState('');
  const [kalibrasiNomorSertifikat, setKalibrasiNomorSertifikat] = useState('');
  const [kalibrasiTanggal, setKalibrasiTanggal] = useState('');
  const [kalibrasiTanggalKadaluarsa, setKalibrasiTanggalKadaluarsa] = useState('');
  const [kalibrasiOrderBy, setKalibrasiOrderBy] = useState('created_at');
  const [kalibrasiOrderDir, setKalibrasiOrderDir] = useState<'asc' | 'desc'>('desc');
  const [showKalibrasiFilter, setShowKalibrasiFilter] = useState(false);

  // Dialog Konfirmasi Hapus
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'bhp' | 'kalibrasi';
    id: number | null;
    title: string;
    message: string;
    isLoading: boolean;
  }>({
    isOpen: false,
    type: 'bhp',
    id: null,
    title: '',
    message: '',
    isLoading: false,
  });

  // ─────────────────────────────────────────────────────────────
  // FETCH DATA
  // ─────────────────────────────────────────────────────────────
  const fetchBhp = useCallback(async () => {
    setBhpLoading(true);
    try {
      const res: any = await sinapraService.getLabBhpList({
        page: bhpPage,
        per_page: 15,
        search: bhpSearch || undefined,
        kategori: bhpKategori || undefined,
        ruangan_id: bhpRuanganId ? Number(bhpRuanganId) : undefined,
        lokasi_penyimpanan: bhpLokasi || undefined,
        satuan: bhpSatuan || undefined,
        status_stok: bhpStatusStok || undefined,
        sort_by: bhpOrderBy,
        sort_dir: bhpOrderDir,
      });
      const items = Array.isArray(res?.data) ? res.data : (res?.data?.items || []);
      setBhpList(items);
      if (res?.data?.meta) setBhpMeta(res.data.meta);
      else if (res?.meta) setBhpMeta(res.meta);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memuat data BHP laboratorium');
    } finally {
      setBhpLoading(false);
    }
  }, [bhpPage, bhpSearch, bhpKategori, bhpRuanganId, bhpLokasi, bhpSatuan, bhpStatusStok, bhpOrderBy, bhpOrderDir]);

  const fetchSbt = useCallback(async () => {
    setSbtLoading(true);
    try {
      const res: any = await sinapraService.getBebasTanggunganList({
        page: sbtPage,
        per_page: 15,
        search: sbtSearch || undefined,
        status: sbtStatus || undefined,
        catatan: sbtCatatan || undefined,
        tanggal_pengajuan: sbtTanggalPengajuan || undefined,
        sort_by: sbtOrderBy,
        sort_dir: sbtOrderDir,
      });
      const items = Array.isArray(res?.data) ? res.data : (res?.data?.items || []);
      setSbtList(items);
      if (res?.data?.meta) setSbtMeta(res.data.meta);
      else if (res?.meta) setSbtMeta(res.meta);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memuat surat bebas tanggungan');
    } finally {
      setSbtLoading(false);
    }
  }, [sbtPage, sbtSearch, sbtStatus, sbtCatatan, sbtTanggalPengajuan, sbtOrderBy, sbtOrderDir]);

  const fetchKalibrasi = useCallback(async () => {
    setKalibrasiLoading(true);
    try {
      const res: any = await sinapraService.getAlatKalibrasiList({
        page: kalibrasiPage,
        per_page: 15,
        search: kalibrasiSearch || undefined,
        aset_id: kalibrasiAsetId ? Number(kalibrasiAsetId) : undefined,
        institusi_kalibrasi: kalibrasiInstitusi || undefined,
        nomor_sertifikat: kalibrasiNomorSertifikat || undefined,
        tanggal_kalibrasi: kalibrasiTanggal || undefined,
        tanggal_kadaluarsa: kalibrasiTanggalKadaluarsa || undefined,
        status_kelayakan: kalibrasiStatus || undefined,
        mendekati_kadaluarsa: kalibrasiMendekati || undefined,
        sort_by: kalibrasiOrderBy,
        sort_dir: kalibrasiOrderDir,
      });
      const items = Array.isArray(res?.data) ? res.data : (res?.data?.items || []);
      setKalibrasiList(items);
      if (res?.data?.meta) setKalibrasiMeta(res.data.meta);
      else if (res?.meta) setKalibrasiMeta(res.meta);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memuat data kalibrasi alat');
    } finally {
      setKalibrasiLoading(false);
    }
  }, [
    kalibrasiPage,
    kalibrasiSearch,
    kalibrasiAsetId,
    kalibrasiInstitusi,
    kalibrasiNomorSertifikat,
    kalibrasiTanggal,
    kalibrasiTanggalKadaluarsa,
    kalibrasiStatus,
    kalibrasiMendekati,
    kalibrasiOrderBy,
    kalibrasiOrderDir,
  ]);

  useEffect(() => {
    if (activeTab === 'bhp') fetchBhp();
    if (activeTab === 'bebas_tanggungan') fetchSbt();
    if (activeTab === 'kalibrasi') fetchKalibrasi();
  }, [activeTab, fetchBhp, fetchSbt, fetchKalibrasi]);

  // ─────────────────────────────────────────────────────────────
  // FILTER DRAWER HANDLERS
  // ─────────────────────────────────────────────────────────────
  const handleResetBhpFilter = () => {
    setBhpSearch('');
    setBhpKategori('');
    setBhpRuanganId('');
    setBhpLokasi('');
    setBhpSatuan('');
    setBhpStatusStok('');
    setBhpOrderBy('created_at');
    setBhpOrderDir('desc');
  };

  const handleApplyBhpFilter = () => {
    setBhpPage(1);
    fetchBhp();
    setShowBhpFilter(false);
  };

  const handleResetSbtFilter = () => {
    setSbtSearch('');
    setSbtStatus('');
    setSbtCatatan('');
    setSbtTanggalPengajuan('');
    setSbtOrderBy('created_at');
    setSbtOrderDir('desc');
  };

  const handleApplySbtFilter = () => {
    setSbtPage(1);
    fetchSbt();
    setShowSbtFilter(false);
  };

  const handleResetKalibrasiFilter = () => {
    setKalibrasiSearch('');
    setKalibrasiStatus('');
    setKalibrasiMendekati(false);
    setKalibrasiAsetId('');
    setKalibrasiInstitusi('');
    setKalibrasiNomorSertifikat('');
    setKalibrasiTanggal('');
    setKalibrasiTanggalKadaluarsa('');
    setKalibrasiOrderBy('created_at');
    setKalibrasiOrderDir('desc');
  };

  const handleApplyKalibrasiFilter = () => {
    setKalibrasiPage(1);
    fetchKalibrasi();
    setShowKalibrasiFilter(false);
  };

  // ─────────────────────────────────────────────────────────────
  // HANDLERS MODAL TRANSAKSI BHP
  // ─────────────────────────────────────────────────────────────
  const handleOpenTransaksiModal = (bhp: LabBhp) => {
    setSelectedBhpForTransaksi(bhp);
    resetTransaksi({
      jenis_transaksi: 'keluar',
      jumlah: 1,
      keterangan: '',
    });
    setIsTransaksiModalOpen(true);
  };

  const onSaveTransaksi = async (data: TransaksiBhpFormData) => {
    if (!selectedBhpForTransaksi) return;
    try {
      await sinapraService.transaksiLabBhp(selectedBhpForTransaksi.id, {
        jenis_transaksi: data.jenis_transaksi,
        jumlah: data.jumlah,
        keterangan: data.keterangan || undefined,
      });
      toast.success('Mutasi stok BHP berhasil dicatat');
      setIsTransaksiModalOpen(false);
      fetchBhp();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal mencatat mutasi stok');
    }
  };

  // ─────────────────────────────────────────────────────────────
  // HANDLERS SBT
  // ─────────────────────────────────────────────────────────────
  const onApplySbt = async (data: SbtApplyFormData) => {
    try {
      await sinapraService.applyBebasTanggungan(data);
      toast.success('Permohonan surat bebas tanggungan lab berhasil diajukan');
      setIsSbtModalOpen(false);
      resetSbtApply();
      fetchSbt();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal mengajukan surat bebas lab');
    }
  };

  const handleOpenApproveSbt = async (sbt: BebasTanggungan) => {
    setApprovingSbt(sbt);
    setIsLoadingKelayakan(true);
    resetSbtApprove({
      is_approved: 'true',
      catatan: '',
    });
    try {
      const res: any = await sinapraService.getBebasTanggunganDetail(sbt.id);
      const detail = res?.data || res;
      setSbtKelayakan(detail?.kelayakan_lab || null);
    } catch {
      setSbtKelayakan(null);
    } finally {
      setIsLoadingKelayakan(false);
    }
  };

  const onSaveApproveSbt = async (data: SbtApproveFormData) => {
    if (!approvingSbt) return;
    try {
      await sinapraService.approveBebasTanggungan(approvingSbt.id, {
        is_approved: data.is_approved === 'true',
        catatan: data.catatan || undefined,
      });
      toast.success(
        data.is_approved === 'true'
          ? 'Surat bebas tanggungan lab disetujui'
          : 'Permohonan surat bebas tanggungan ditolak'
      );
      setApprovingSbt(null);
      fetchSbt();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memproses permohonan bebas tanggungan');
    }
  };

  // ─────────────────────────────────────────────────────────────
  // DELETE HANDLERS
  // ─────────────────────────────────────────────────────────────
  const handleOpenDelete = (type: 'bhp' | 'kalibrasi', id: number, label: string) => {
    setDeleteConfirm({
      isOpen: true,
      type,
      id,
      title: type === 'bhp' ? 'Hapus Bahan Habis Pakai' : 'Hapus Data Kalibrasi',
      message: `Apakah Anda yakin ingin menghapus "${label}"? Tindakan ini tidak dapat dibatalkan.`,
      isLoading: false,
    });
  };

  const handleExecuteDelete = async () => {
    if (!deleteConfirm.id) return;
    setDeleteConfirm((prev) => ({ ...prev, isLoading: true }));
    try {
      if (deleteConfirm.type === 'bhp') {
        await sinapraService.deleteLabBhp(deleteConfirm.id);
        toast.success('BHP lab berhasil dihapus');
        fetchBhp();
      } else {
        await sinapraService.deleteAlatKalibrasi(deleteConfirm.id);
        toast.success('Data kalibrasi berhasil dihapus');
        fetchKalibrasi();
      }
      setDeleteConfirm((prev) => ({ ...prev, isOpen: false, id: null }));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus data');
      setDeleteConfirm((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // ─────────────────────────────────────────────────────────────
  // ASYNC SELECT LOADERS
  // ─────────────────────────────────────────────────────────────
  const loadRuanganLabOptions = async (query: string) => {
    try {
      const res: any = await sinapraService.getRuanganList({ search: query, tipe: 'lab', per_page: 20 });
      const items = Array.isArray(res?.data) ? res.data : (res?.data?.items || []);
      return items.map((r: any) => ({
        value: String(r.id),
        label: `${r.nama} [${r.kode}] - ${r.gedung?.nama || 'Gedung'}`,
      }));
    } catch {
      return [];
    }
  };

  const loadAsetLabOptions = async (query: string) => {
    try {
      const res: any = await sinapraService.getAsetList({ search: query, is_lab_asset: true, per_page: 20 });
      const items = Array.isArray(res?.data) ? res.data : (res?.data?.items || []);
      return items.map((a: any) => ({
        value: String(a.id),
        label: `${a.nama} [${a.kode_aset}] - ${a.ruangan?.nama || 'Lab'}`,
      }));
    } catch {
      return [];
    }
  };

  // ─────────────────────────────────────────────────────────────
  // TABLE COLUMNS
  // ─────────────────────────────────────────────────────────────
  const bhpColumns: ColumnDef<LabBhp>[] = [
    {
      key: 'kode_bhp',
      label: 'KODE & NAMA BHP',
      render: (row: LabBhp) => (
        <div>
          <span className="font-mono font-bold text-xs text-[var(--module-primary)] block">{row.kode_bhp}</span>
          <span className="font-bold text-slate-800 text-xs">{row.nama_bhp}</span>
        </div>
      ),
    },
    {
      key: 'ruangan',
      label: 'LABORATORIUM',
      render: (row: LabBhp) => (
        <div>
          <span className="text-xs text-slate-800 font-medium block">{row.ruangan?.nama || '-'}</span>
          <span className="text-2xs text-slate-400">{row.ruangan?.gedung?.nama || 'Gedung'}</span>
        </div>
      ),
    },
    {
      key: 'kategori',
      label: 'KATEGORI & LOKASI',
      render: (row: LabBhp) => (
        <div>
          <Badge variant="gray" className="text-2xs uppercase">
            {row.kategori}
          </Badge>
          <span className="text-2xs text-slate-400 block ">{row.lokasi_penyimpanan || '-'}</span>
        </div>
      ),
    },
    {
      key: 'stok',
      label: 'STOK SAAT INI',
      render: (row: LabBhp) => {
        const isMenipis = row.stok_saat_ini <= row.stok_minimum;
        return (
          <div className="flex items-center gap-2">
            <div>
              <span className={`text-xs font-bold ${isMenipis ? 'text-[var(--module-primary)]' : 'text-slate-800'}`}>
                {row.stok_saat_ini} {row.satuan}
              </span>
              <span className="text-2xs text-slate-400 block">Min: {row.stok_minimum}</span>
            </div>
            {isMenipis && (
              <Badge variant="danger" className="text-2xs animate-pulse">
                Menipis
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (row: LabBhp) => (
        <div className="flex justify-end">
          <DropdownMenu
            items={[
              {
                label: 'Mutasi Stok (+/-)',
                icon: <ArrowDownUp size={14} />,
                onClick: () => handleOpenTransaksiModal(row),
              },
              {
                label: 'Edit BHP',
                icon: <SlidersHorizontal size={14} />,
                onClick: () => router.push(`/sinapra/laboratorium/bhp/${row.id}/edit`),
              },
              {
                label: 'Hapus BHP',
                icon: <Trash2 size={14} />,
                variant: 'danger',
                onClick: () => handleOpenDelete('bhp', row.id, row.nama_bhp),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  const sbtColumns: ColumnDef<BebasTanggungan>[] = [
    {
      key: 'nomor_surat',
      label: 'NOMOR SURAT',
      render: (row: BebasTanggungan) => (
        <div>
          <span className="font-mono font-bold text-xs text-[var(--module-primary)] block">
            {row.nomor_surat || '(Menunggu Persetujuan)'}
          </span>
          <span className="text-2xs text-slate-400">Diajukan: {row.tanggal_pengajuan}</span>
        </div>
      ),
    },
    {
      key: 'mahasiswa',
      label: 'MAHASISWA PEMOHON',
      render: (row: BebasTanggungan) => (
        <div>
          <span className="font-bold text-slate-800 text-xs block">{row.mahasiswa?.name || 'Mahasiswa'}</span>
          <span className="text-2xs text-slate-400 font-mono">NIM: {row.mahasiswa?.username || '-'}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'STATUS VERIFIKASI',
      render: (row: BebasTanggungan) => {
        const variants: Record<string, 'warning' | 'success' | 'danger'> = {
          diajukan: 'warning',
          disetujui: 'success',
          ditolak: 'danger',
        };
        return (
          <Badge variant={variants[row.status] || 'gray'} className="text-2xs uppercase">
            {row.status}
          </Badge>
        );
      },
    },
    {
      key: 'catatan',
      label: 'CATATAN / ALASAN',
      render: (row: BebasTanggungan) => (
        <span className="text-xs text-slate-600 line-clamp-1 max-w-xs">{row.catatan || '-'}</span>
      ),
    },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (row: BebasTanggungan) => (
        <div className="flex justify-end">
          <DropdownMenu
            items={[
              {
                label: 'Verifikasi / Approve',
                icon: <CheckCircle size={14} />,
                onClick: () => handleOpenApproveSbt(row),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  const kalibrasiColumns: ColumnDef<AlatKalibrasi>[] = [
    {
      key: 'aset',
      label: 'INSTRUMEN PRESISI',
      render: (row: AlatKalibrasi) => (
        <div>
          <span className="font-mono font-bold text-xs text-[var(--module-primary)] block">{row.aset?.kode_aset}</span>
          <span className="font-bold text-slate-800 text-xs">{row.aset?.nama}</span>
        </div>
      ),
    },
    {
      key: 'institusi',
      label: 'INSTITUSI & SERTIFIKAT',
      render: (row: AlatKalibrasi) => (
        <div>
          <span className="text-xs text-slate-800 font-medium block">{row.institusi_kalibrasi}</span>
          <span className="text-2xs text-slate-400 font-mono">No: {row.nomor_sertifikat || '-'}</span>
        </div>
      ),
    },
    {
      key: 'kadaluarsa',
      label: 'MASA BERLAKU KALIBRASI',
      render: (row: AlatKalibrasi) => {
        const isExpiring = new Date(row.tanggal_kadaluarsa) <= new Date(Date.now() + 30 * 86400000);
        return (
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono font-bold ${isExpiring ? 'text-[var(--module-primary)]' : 'text-slate-800'}`}>
                {row.tanggal_kadaluarsa}
              </span>
              {isExpiring && (
                <Badge variant="warning" className="text-2xs">
                  Jatuh Tempo
                </Badge>
              )}
            </div>
            <span className="text-2xs text-slate-400 block">Kalibrasi: {row.tanggal_kalibrasi}</span>
          </div>
        );
      },
    },
    {
      key: 'status',
      label: 'KELAYAKAN FISIK',
      render: (row: AlatKalibrasi) => {
        const variants: Record<string, 'success' | 'danger' | 'warning'> = {
          laik: 'success',
          tidak_laik: 'danger',
          butuh_perbaikan: 'warning',
        };
        return (
          <Badge variant={variants[row.status_kelayakan] || 'gray'} className="text-2xs uppercase">
            {row.status_kelayakan}
          </Badge>
        );
      },
    },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (row: AlatKalibrasi) => (
        <div className="flex justify-end">
          <DropdownMenu
            items={[
              {
                label: 'Hapus Rekaman',
                icon: <Trash2 size={14} />,
                variant: 'danger',
                onClick: () => handleOpenDelete('kalibrasi', row.id, row.aset?.nama || 'Kalibrasi Alat'),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="w-full flex-col grid-cols-1 space-y-4">
      <PageHeader
        title="Operasional Khusus Laboratorium"
        description="Pengelolaan bahan habis pakai (BHP), surat bebas tanggungan lab, dan jadwal kalibrasi alat presisi."
        action={
          <div className="flex gap-2">
            {activeTab === 'bhp' && (
              <>
                <Button
                  variant="outline"
                  style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
                  icon={<Filter size={16} />}
                  onClick={() => setShowBhpFilter(true)}
                >
                  Filter
                </Button>
                <Button icon={<Plus size={16} />} onClick={() => router.push('/sinapra/laboratorium/bhp/create')}>
                  Tambah BHP
                </Button>
              </>
            )}
            {activeTab === 'bebas_tanggungan' && (
              <>
                <Button
                  variant="outline"
                  style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
                  icon={<Filter size={16} />}
                  onClick={() => setShowSbtFilter(true)}
                >
                  Filter
                </Button>
                <Button icon={<Plus size={16} />} onClick={() => setIsSbtModalOpen(true)}>
                  Ajukan Bebas Lab
                </Button>
              </>
            )}
            {activeTab === 'kalibrasi' && (
              <>
                <Button
                  variant="outline"
                  style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
                  icon={<Filter size={16} />}
                  onClick={() => setShowKalibrasiFilter(true)}
                >
                  Filter
                </Button>
                <Button icon={<Plus size={16} />} onClick={() => router.push('/sinapra/laboratorium/kalibrasi/create')}>
                  Catat Kalibrasi
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* NAVIGASI TAB BAKU */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto">
        <Button
          variant="ghost"
          onClick={() => setActiveTab('bhp')}
          className={`flex items-center gap-2 p-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'bhp'
              ? 'border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle)]'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <FlaskConical size={14} />
          <span>Bahan Habis Pakai (BHP Lab)</span>
          <Badge variant={activeTab === 'bhp' ? 'sinapra' : 'gray'} className="text-2xs">
            {bhpMeta.total}
          </Badge>
        </Button>

        <Button
          variant="ghost"
          onClick={() => setActiveTab('bebas_tanggungan')}
          className={`flex items-center gap-2 p-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'bebas_tanggungan'
              ? 'border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle)]'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <FileCheck2 size={14} />
          <span>Surat Bebas Tanggungan Lab</span>
          <Badge variant={activeTab === 'bebas_tanggungan' ? 'sinapra' : 'gray'} className="text-2xs">
            {sbtMeta.total}
          </Badge>
        </Button>

        <Button
          variant="ghost"
          onClick={() => setActiveTab('kalibrasi')}
          className={`flex items-center gap-2 p-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'kalibrasi'
              ? 'border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle)]'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <Clock size={14} />
          <span>Kalibrasi Alat Presisi</span>
          <Badge variant={activeTab === 'kalibrasi' ? 'sinapra' : 'gray'} className="text-2xs">
            {kalibrasiMeta.total}
          </Badge>
        </Button>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* KONTEN TAB 1: BAHAN HABIS PAKAI (BHP) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'bhp' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <DataTable
            columns={bhpColumns}
            data={bhpList}
            isLoading={bhpLoading}
            meta={bhpMeta}
            onPageChange={(p) => setBhpPage(p)}
          />
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* KONTEN TAB 2: SURAT BEBAS TANGGUNGAN */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'bebas_tanggungan' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <DataTable
            columns={sbtColumns}
            data={sbtList}
            isLoading={sbtLoading}
            meta={sbtMeta}
            onPageChange={(p) => setSbtPage(p)}
          />
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* KONTEN TAB 3: KALIBRASI ALAT PRESISI */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'kalibrasi' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <DataTable
            columns={kalibrasiColumns}
            data={kalibrasiList}
            isLoading={kalibrasiLoading}
            meta={kalibrasiMeta}
            onPageChange={(p) => setKalibrasiPage(p)}
          />
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* FILTER DRAWER: BHP LAB */}
      {/* ───────────────────────────────────────────────────────────── */}
      <Drawer
        open={showBhpFilter}
        onClose={() => setShowBhpFilter(false)}
        title="Filter Bahan Habis Pakai (BHP)"
      >
        <div className="space-y-4">
          <Input
            label="Pencarian"
            placeholder="Cari kode, nama BHP..."
            value={bhpSearch}
            onChange={(e) => setBhpSearch(e.target.value)}
          />

          <AsyncSelect
            label="Laboratorium"
            placeholder="Semua Ruangan Laboratorium"
            loadOptions={loadRuanganLabOptions}
            value={
              bhpRuanganId
                ? { value: bhpRuanganId, label: `Ruangan #${bhpRuanganId}` }
                : null
            }
            onChange={(sel: any) => setBhpRuanganId(sel ? sel.value : '')}
          />

          <Input
            label="Kategori BHP"
            placeholder="cth: komponen_elektronik, reagen"
            value={bhpKategori}
            onChange={(e) => setBhpKategori(e.target.value)}
          />

          <Input
            label="Lokasi Penyimpanan"
            placeholder="Cari lokasi lemari/rak..."
            value={bhpLokasi}
            onChange={(e) => setBhpLokasi(e.target.value)}
          />

          <Input
            label="Satuan"
            placeholder="cth: Pcs, Roll, Botol..."
            value={bhpSatuan}
            onChange={(e) => setBhpSatuan(e.target.value)}
          />

          <Select
            label="Status Stok"
            value={bhpStatusStok}
            onChange={(val) => setBhpStatusStok(val)}
            options={[
              { value: '', label: 'Semua Status Stok' },
              { value: 'menipis', label: 'Stok Menipis (≤ Batas Minimum)' },
              { value: 'aman', label: 'Stok Aman' },
            ]}
          />

          <hr className="border-slate-200" />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={bhpOrderBy}
              onChange={(val) => setBhpOrderBy(val)}
              options={[
                { value: 'created_at', label: 'Tanggal Dibuat' },
                { value: 'kode_bhp', label: 'Kode BHP' },
                { value: 'nama_bhp', label: 'Nama BHP' },
                { value: 'ruangan', label: 'Laboratorium' },
                { value: 'kategori', label: 'Kategori' },
                { value: 'lokasi_penyimpanan', label: 'Lokasi Penyimpanan' },
                { value: 'stok_saat_ini', label: 'Stok Saat Ini' },
                { value: 'stok_minimum', label: 'Stok Minimum' },
                { value: 'satuan', label: 'Satuan' },
              ]}
            />
            <Select
              label="Arah Urutan"
              value={bhpOrderDir}
              onChange={(val) => setBhpOrderDir(val as 'asc' | 'desc')}
              options={[
                { value: 'asc', label: 'Menaik (Asc)' },
                { value: 'desc', label: 'Menurun (Desc)' },
              ]}
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleResetBhpFilter}
            >
              Reset
            </Button>
            <Button
              className="w-full"
              onClick={handleApplyBhpFilter}
            >
              Terapkan
            </Button>
          </div>
        </div>
      </Drawer>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* FILTER DRAWER: SURAT BEBAS TANGGUNGAN */}
      {/* ───────────────────────────────────────────────────────────── */}
      <Drawer
        open={showSbtFilter}
        onClose={() => setShowSbtFilter(false)}
        title="Filter Surat Bebas Tanggungan"
      >
        <div className="space-y-4">
          <Input
            label="Pencarian"
            placeholder="Cari nomor surat, nama mahasiswa..."
            value={sbtSearch}
            onChange={(e) => setSbtSearch(e.target.value)}
          />

          <Select
            label="Status Permohonan"
            value={sbtStatus}
            onChange={(val) => setSbtStatus(val)}
            options={[
              { value: '', label: 'Semua Status' },
              { value: 'diajukan', label: 'Diajukan' },
              { value: 'disetujui', label: 'Disetujui' },
              { value: 'ditolak', label: 'Ditolak' },
            ]}
          />

          <Input
            label="Catatan / Alasan"
            placeholder="Cari catatan / alasan pengajuan..."
            value={sbtCatatan}
            onChange={(e) => setSbtCatatan(e.target.value)}
          />

          <Input
            label="Tanggal Pengajuan"
            type="date"
            value={sbtTanggalPengajuan}
            onChange={(e) => setSbtTanggalPengajuan(e.target.value)}
          />

          <hr className="border-slate-200" />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={sbtOrderBy}
              onChange={(val) => setSbtOrderBy(val)}
              options={[
                { value: 'created_at', label: 'Tanggal Dibuat' },
                { value: 'nomor_surat', label: 'Nomor Surat' },
                { value: 'tanggal_pengajuan', label: 'Tanggal Pengajuan' },
                { value: 'mahasiswa', label: 'Mahasiswa Pemohon' },
                { value: 'status', label: 'Status Verifikasi' },
                { value: 'catatan', label: 'Catatan / Alasan' },
              ]}
            />
            <Select
              label="Arah Urutan"
              value={sbtOrderDir}
              onChange={(val) => setSbtOrderDir(val as 'asc' | 'desc')}
              options={[
                { value: 'asc', label: 'Menaik (Asc)' },
                { value: 'desc', label: 'Menurun (Desc)' },
              ]}
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleResetSbtFilter}
            >
              Reset
            </Button>
            <Button
              className="w-full"
              onClick={handleApplySbtFilter}
            >
              Terapkan
            </Button>
          </div>
        </div>
      </Drawer>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* FILTER DRAWER: KALIBRASI ALAT */}
      {/* ───────────────────────────────────────────────────────────── */}
      <Drawer
        open={showKalibrasiFilter}
        onClose={() => setShowKalibrasiFilter(false)}
        title="Filter Kalibrasi Alat Presisi"
      >
        <div className="space-y-4">
          <Input
            label="Pencarian"
            placeholder="Cari alat, institusi, nomor sertifikat..."
            value={kalibrasiSearch}
            onChange={(e) => setKalibrasiSearch(e.target.value)}
          />

          <AsyncSelect
            label="Instrumen Presisi"
            placeholder="Semua Instrumen Alat..."
            loadOptions={loadAsetLabOptions}
            value={
              kalibrasiAsetId
                ? { value: kalibrasiAsetId, label: `Aset #${kalibrasiAsetId}` }
                : null
            }
            onChange={(sel: any) => setKalibrasiAsetId(sel ? sel.value : '')}
          />

          <Input
            label="Institusi Kalibrasi"
            placeholder="Cari institusi pelaksana..."
            value={kalibrasiInstitusi}
            onChange={(e) => setKalibrasiInstitusi(e.target.value)}
          />

          <Input
            label="Nomor Sertifikat"
            placeholder="Cari nomor sertifikat..."
            value={kalibrasiNomorSertifikat}
            onChange={(e) => setKalibrasiNomorSertifikat(e.target.value)}
          />

          <Input
            label="Tanggal Kalibrasi"
            type="date"
            value={kalibrasiTanggal}
            onChange={(e) => setKalibrasiTanggal(e.target.value)}
          />

          <Input
            label="Tanggal Kedaluwarsa"
            type="date"
            value={kalibrasiTanggalKadaluarsa}
            onChange={(e) => setKalibrasiTanggalKadaluarsa(e.target.value)}
          />

          <Select
            label="Kelayakan Fisik"
            value={kalibrasiStatus}
            onChange={(val) => setKalibrasiStatus(val)}
            options={[
              { value: '', label: 'Semua Status' },
              { value: 'laik', label: 'Laik' },
              { value: 'tidak_laik', label: 'Tidak Laik' },
              { value: 'butuh_perbaikan', label: 'Butuh Perbaikan' },
            ]}
          />

          <Checkbox
            label="Hanya alat yang mendekati jatuh tempo (≤ 30 hari)"
            checked={kalibrasiMendekati}
            onChange={(e) => setKalibrasiMendekati(e.target.checked)}
          />

          <hr className="border-slate-200" />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={kalibrasiOrderBy}
              onChange={(val) => setKalibrasiOrderBy(val)}
              options={[
                { value: 'created_at', label: 'Tanggal Dibuat' },
                { value: 'aset', label: 'Instrumen Presisi' },
                { value: 'institusi_kalibrasi', label: 'Institusi Kalibrasi' },
                { value: 'nomor_sertifikat', label: 'Nomor Sertifikat' },
                { value: 'tanggal_kalibrasi', label: 'Tanggal Kalibrasi' },
                { value: 'tanggal_kadaluarsa', label: 'Masa Berlaku / Kedaluwarsa' },
                { value: 'status_kelayakan', label: 'Kelayakan Fisik' },
              ]}
            />
            <Select
              label="Arah Urutan"
              value={kalibrasiOrderDir}
              onChange={(val) => setKalibrasiOrderDir(val as 'asc' | 'desc')}
              options={[
                { value: 'asc', label: 'Menaik (Asc)' },
                { value: 'desc', label: 'Menurun (Desc)' },
              ]}
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleResetKalibrasiFilter}
            >
              Reset
            </Button>
            <Button
              className="w-full"
              onClick={handleApplyKalibrasiFilter}
            >
              Terapkan
            </Button>
          </div>
        </div>
      </Drawer>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL MUTASI STOK BHP (ZOD STRICT) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <Modal
        open={isTransaksiModalOpen}
        onClose={() => setIsTransaksiModalOpen(false)}
        title={`Mutasi Stok: ${selectedBhpForTransaksi?.nama_bhp || 'BHP'}`}
        footer={null}
      >
        <form onSubmit={handleSubmitTransaksi(onSaveTransaksi)} className="space-y-4">
          <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs">
            <div className="flex justify-between p-2 border-b border-slate-200">
              <span className="text-slate-500">Stok Saat Ini:</span>
              <span className="font-bold font-mono text-slate-800">
                {selectedBhpForTransaksi?.stok_saat_ini} {selectedBhpForTransaksi?.satuan}
              </span>
            </div>
            <div className="flex justify-between p-2">
              <span className="text-slate-500">Batas Minimum:</span>
              <span className="font-bold font-mono text-slate-800">
                {selectedBhpForTransaksi?.stok_minimum} {selectedBhpForTransaksi?.satuan}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Select
                label="Jenis Mutasi"
                value={watchTransaksi('jenis_transaksi')}
                onChange={(val) => setTransaksiValue('jenis_transaksi', val as 'masuk' | 'keluar', { shouldValidate: true })}
                options={[
                  { value: 'keluar', label: 'Barang Keluar / Terpakai (-)' },
                  { value: 'masuk', label: 'Barang Masuk / Restock (+)' },
                ]}
              />
              {transaksiErrors.jenis_transaksi && (
                <p className="text-xs text-[var(--module-primary)]">{transaksiErrors.jenis_transaksi.message}</p>
              )}
            </div>

            <div>
              <Input
                label="Jumlah"
                type="number"
                min={1}
                {...registerTransaksi('jumlah', { valueAsNumber: true })}
              />
              {transaksiErrors.jumlah && (
                <p className="text-xs text-[var(--module-primary)]">{transaksiErrors.jumlah.message}</p>
              )}
            </div>
          </div>

          <div>
            <Textarea
              label="Keperluan / Keterangan Mutasi"
              placeholder="cth: Praktikum Jaringan Komputer Kelas 2A..."
              rows={3}
              {...registerTransaksi('keterangan')}
            />
            {transaksiErrors.keterangan && (
              <p className="text-xs text-[var(--module-primary)]">{transaksiErrors.keterangan.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-200">
            <Button variant="secondary" onClick={() => setIsTransaksiModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={isTransaksiSubmitting} disabled={isTransaksiSubmitting}>
              Simpan Mutasi
            </Button>
          </div>
        </form>
      </Modal>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL AJUKAN SURAT BEBAS TANGGUNGAN (ZOD STRICT) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <Modal
        open={isSbtModalOpen}
        onClose={() => setIsSbtModalOpen(false)}
        title="Ajukan Surat Bebas Tanggungan Lab"
        footer={null}
      >
        <form onSubmit={handleSubmitSbtApply(onApplySbt)} className="space-y-4">
          <div
            style={{
              backgroundColor: 'color-mix(in srgb, var(--module-primary) 12%, transparent)',
              borderColor: 'color-mix(in srgb, var(--module-primary) 25%, transparent)',
              color: 'var(--module-primary)',
            }}
            className="p-3 rounded-lg border text-xs"
          >
            <div className="flex items-center gap-2 font-bold ">
              <FileCheck2 size={16} />
              <span>Ketentuan Surat Bebas Tanggungan</span>
            </div>
            Sistem secara otomatis memeriksa seluruh riwayat peminjaman laboratorium Anda. Pastikan tidak ada alat
            atau fasilitas praktikum yang masih berstatus dipinjam sebelum mengajukan.
          </div>

          <div>
            <Textarea
              label="Alasan Pengajuan Surat"
              placeholder="cth: Pengajuan surat bebas laboratorium untuk syarat kelulusan dan yudisium program studi..."
              rows={4}
              {...registerSbtApply('catatan')}
            />
            {sbtApplyErrors.catatan && (
              <p className="text-xs text-[var(--module-primary)]">{sbtApplyErrors.catatan.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-200">
            <Button variant="secondary" onClick={() => setIsSbtModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={isSbtSubmitting} disabled={isSbtSubmitting}>
              Kirim Permohonan
            </Button>
          </div>
        </form>
      </Modal>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL APPROVE / VERIFIKASI SBT (ZOD STRICT) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <Modal
        open={!!approvingSbt}
        onClose={() => setApprovingSbt(null)}
        title="Verifikasi Surat Bebas Tanggungan Lab"
        footer={null}
      >
        <form onSubmit={handleSubmitSbtApprove(onSaveApproveSbt)} className="space-y-4">
          <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs">
            <div className="font-bold text-slate-800 text-sm">{approvingSbt?.mahasiswa?.name}</div>
            <div className="text-slate-500">NIM: {approvingSbt?.mahasiswa?.username}</div>
            <div className="text-slate-500">Diajukan Pada: {approvingSbt?.tanggal_pengajuan}</div>
            <div className="text-slate-700 italic border-t border-slate-200">
              &quot;{approvingSbt?.catatan || '-'}&quot;
            </div>
          </div>

          {isLoadingKelayakan ? (
            <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs flex items-center gap-2">
              <Clock size={16} className="animate-spin text-slate-500" />
              <span>Memeriksa kelayakan dan tanggungan laboratorium mahasiswa...</span>
            </div>
          ) : sbtKelayakan ? (
            <div
              style={{
                backgroundColor: 'color-mix(in srgb, var(--module-primary) 12%, transparent)',
                borderColor: 'color-mix(in srgb, var(--module-primary) 25%, transparent)',
                color: 'var(--module-primary)',
              }}
              className="p-3 rounded-lg border text-xs"
            >
              <div className="flex items-center gap-2 font-bold">
                {sbtKelayakan.is_layak ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                <span>
                  {sbtKelayakan.is_layak
                    ? 'Status: Bersih Dari Tanggungan Lab'
                    : `Perhatian: Ada ${sbtKelayakan.tanggungan_aktif_count} Peminjaman Belum Kembali!`}
                </span>
              </div>
              <p>{sbtKelayakan.catatan}</p>
            </div>
          ) : null}

          <div>
            <Select
              label="Keputusan Verifikasi"
              value={watchSbtApprove('is_approved')}
              onChange={(val) => setSbtApproveValue('is_approved', val as 'true' | 'false', { shouldValidate: true })}
              options={[
                { value: 'true', label: 'Setujui & Terbitkan Surat Bebas Lab' },
                { value: 'false', label: 'Tolak Permohonan' },
              ]}
            />
            {sbtApproveErrors.is_approved && (
              <p className="text-xs text-[var(--module-primary)]">{sbtApproveErrors.is_approved.message}</p>
            )}
          </div>

          <div>
            <Textarea
              label="Catatan Verifikator"
              placeholder="cth: Verifikasi laboratorium selesai, mahasiswa dinyatakan bebas tanggungan..."
              rows={3}
              {...registerSbtApprove('catatan')}
            />
            {sbtApproveErrors.catatan && (
              <p className="text-xs text-[var(--module-primary)]">{sbtApproveErrors.catatan.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-200">
            <Button variant="secondary" onClick={() => setApprovingSbt(null)}>
              Batal
            </Button>
            <Button type="submit" isLoading={isApproveSubmitting} disabled={isApproveSubmitting}>
              Simpan Keputusan
            </Button>
          </div>
        </form>
      </Modal>


      {/* ───────────────────────────────────────────────────────────── */}
      {/* DIALOG KONFIRMASI HAPUS DATA */}
      {/* ───────────────────────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleExecuteDelete}
        title={deleteConfirm.title}
        message={deleteConfirm.message}
        isLoading={deleteConfirm.isLoading}
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
