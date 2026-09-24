'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Calendar,
  Clock,
  Plus,
  CheckCircle,
  XCircle,
  Filter,
  ShieldAlert,
  Eye,
  Check,
  Trash2,
  UserCheck,
  Paperclip,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/DropdownMenu';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Badge } from '@/components/ui/Badge';
import { simpegService } from '@/services/simpeg.service';
import { simpegIzinKerjaService } from '@/services/simpeg.izin-sk.service';
import type { PengajuanCuti, StatusApprovalCuti, MasterJenisCuti } from '@/types/simpeg.types';
import type {
  IzinJamKerja,
  IzinJamKerjaMasters,
  IzinJamKerjaStatus,
} from '@/types/simpeg.izin-sk.types';
import type { PaginationMeta } from '@/types/api.types';
import { useAuth } from '@/hooks/useAuth';
import { getStorageFileUrl } from '@/lib/utils';

const approvalIzinSchema = z.object({
  status: z.enum(['disetujui', 'ditolak'], {
    error: 'Keputusan approval wajib dipilih',
  }),
  catatan_approval: z.string().max(500, 'Catatan maksimal 500 karakter').optional(),
});

type ApprovalIzinFormValues = z.infer<typeof approvalIzinSchema>;

export default function CutiDanIzinKerjaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'izin-kerja' ? 'izin-kerja' : 'cuti';
  const [activeTab, setActiveTab] = useState<'cuti' | 'izin-kerja'>(initialTab);

  const { user, isAdmin, hasPermission } = useAuth();

  // Permissions Cuti
  const canReadCuti =
    hasPermission('simpeg.cuti.read') ||
    hasPermission('simpeg.cuti.request') ||
    hasPermission('simpeg.cuti.approve') ||
    hasPermission('simpeg.cuti.manage');
  const canCreateCuti =
    hasPermission('simpeg.cuti.create') ||
    hasPermission('simpeg.cuti.request') ||
    hasPermission('simpeg.cuti.manage');
  const canUpdateCuti =
    hasPermission('simpeg.cuti.update') ||
    hasPermission('simpeg.cuti.approve') ||
    hasPermission('simpeg.cuti.manage');

  // Permissions Izin Kerja
  const canReadIzinKerja =
    isAdmin ||
    hasPermission('simpeg.izin_kerja.read') ||
    hasPermission('simpeg.izin_kerja.approve') ||
    hasPermission('simpeg.izin_kerja.create');
  const canCreateIzinKerja = isAdmin || hasPermission('simpeg.izin_kerja.create');
  const canApproveIzinKerja = isAdmin || hasPermission('simpeg.izin_kerja.approve');
  const canDeleteIzinKerja = isAdmin || hasPermission('simpeg.izin_kerja.delete');

  // State Tab Cuti
  const [loadingCuti, setLoadingCuti] = useState(true);
  const [cutiList, setCutiList] = useState<PengajuanCuti[]>([]);
  const [masterCutiList, setMasterCutiList] = useState<MasterJenisCuti[]>([]);
  const [metaCuti, setMetaCuti] = useState<PaginationMeta | undefined>();

  const [searchCuti, setSearchCuti] = useState('');
  const [filterJenisCuti, setFilterJenisCuti] = useState('');
  const [filterStatusCuti, setFilterStatusCuti] = useState('');
  const [filterTanggalMulaiCuti, setFilterTanggalMulaiCuti] = useState('');
  const [filterTanggalSelesaiCuti, setFilterTanggalSelesaiCuti] = useState('');
  const [filterMinHariCuti, setFilterMinHariCuti] = useState('');
  const [filterMaxHariCuti, setFilterMaxHariCuti] = useState('');
  const [filterOrderByCuti, setFilterOrderByCuti] = useState('tanggal_mulai');
  const [filterOrderDirCuti, setFilterOrderDirCuti] = useState<'asc' | 'desc'>('desc');
  const [pageCuti, setPageCuti] = useState(1);
  const [limitCuti, setLimitCuti] = useState(15);
  const [showFilterCuti, setShowFilterCuti] = useState(false);

  const [showModalApprovalCuti, setShowModalApprovalCuti] = useState(false);
  const [selectedCuti, setSelectedCuti] = useState<PengajuanCuti | null>(null);
  const [catatanApprovalCuti, setCatatanApprovalCuti] = useState('');
  const [isSubmittingApprovalCuti, setIsSubmittingApprovalCuti] = useState(false);

  // State Tab Izin Jam Kerja
  const [loadingIzin, setLoadingIzin] = useState(false);
  const [izinList, setIzinList] = useState<IzinJamKerja[]>([]);
  const [metaIzin, setMetaIzin] = useState<PaginationMeta | null>(null);
  const [mastersIzin, setMastersIzin] = useState<IzinJamKerjaMasters | null>(null);

  const [searchIzin, setSearchIzin] = useState('');
  const [filterStatusIzin, setFilterStatusIzin] = useState('');
  const [filterJenisIzin, setFilterJenisIzin] = useState('');
  const [filterTanggalMulaiIzin, setFilterTanggalMulaiIzin] = useState('');
  const [filterTanggalSelesaiIzin, setFilterTanggalSelesaiIzin] = useState('');
  const [sortByIzin, setSortByIzin] = useState('tanggal');
  const [sortOrderIzin, setSortOrderIzin] = useState<'asc' | 'desc'>('desc');
  const [pageIzin, setPageIzin] = useState(1);
  const [limitIzin, setLimitIzin] = useState(15);
  const [showFilterIzin, setShowFilterIzin] = useState(false);

  const [approvalModalOpenIzin, setApprovalModalOpenIzin] = useState(false);
  const [selectedForApprovalIzin, setSelectedForApprovalIzin] = useState<IzinJamKerja | null>(null);
  const [isSubmittingApprovalIzin, setIsSubmittingApprovalIzin] = useState(false);

  const {
    control: controlApprovalIzin,
    handleSubmit: handleSubmitApprovalIzinForm,
    reset: resetApprovalIzin,
    formState: { errors: errorsApprovalIzin },
  } = useForm<ApprovalIzinFormValues>({
    resolver: zodResolver(approvalIzinSchema),
    defaultValues: {
      status: 'disetujui',
      catatan_approval: '',
    },
  });

  const [deleteDialogOpenIzin, setDeleteDialogOpenIzin] = useState(false);
  const [itemToDeleteIzin, setItemToDeleteIzin] = useState<IzinJamKerja | null>(null);
  const [isDeletingIzin, setIsDeletingIzin] = useState(false);

  const jenisIzinOptions = [
    { value: '', label: 'Semua Jenis Izin' },
    ...(mastersIzin?.jenis_izin || []).map((j) => ({
      value: String(j.id),
      label: j.nama,
    })),
  ];

  const statusOptionsIzin = [
    { value: '', label: 'Semua Status' },
    { value: 'menunggu', label: 'Menunggu Persetujuan' },
    { value: 'disetujui', label: 'Disetujui' },
    { value: 'ditolak', label: 'Ditolak' },
  ];

  const approvalDecisionOptions = [
    { value: 'disetujui', label: 'Setujui Permohonan' },
    { value: 'ditolak', label: 'Tolak Permohonan' },
  ];

  // Fetch Master Data
  useEffect(() => {
    simpegService
      .getMasterJenisCutiList({ all: 1 })
      .then((res: any) => {
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setMasterCutiList(list);
      })
      .catch((err) => console.error('Gagal memuat master jenis cuti', err));
  }, []);

  useEffect(() => {
    simpegIzinKerjaService
      .getMasters()
      .then((res: any) => {
        if (res.status === 'success' && res.data) {
          setMastersIzin(res.data);
        }
      })
      .catch((err: any) => console.error('Gagal mengambil master jenis izin kerja', err));
  }, []);

  // Load Cuti List
  const loadCuti = useCallback(async () => {
    if (!canReadCuti) return;
    setLoadingCuti(true);
    try {
      const res: any = await simpegService.getCutiList({
        page: pageCuti,
        limit: limitCuti,
        search: searchCuti || undefined,
        master_jenis_cuti_id: filterJenisCuti || undefined,
        status_approval: filterStatusCuti || undefined,
        tanggal_mulai: filterTanggalMulaiCuti || undefined,
        tanggal_selesai: filterTanggalSelesaiCuti || undefined,
        min_jumlah_hari: filterMinHariCuti || undefined,
        max_jumlah_hari: filterMaxHariCuti || undefined,
        sort_by: filterOrderByCuti,
        sort_dir: filterOrderDirCuti,
      });

      if (res?.data) {
        setCutiList(Array.isArray(res.data) ? res.data : []);
        if (res.meta) setMetaCuti(res.meta);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memuat Pengajuan Cuti');
    } finally {
      setLoadingCuti(false);
    }
  }, [canReadCuti, pageCuti, limitCuti, searchCuti, filterJenisCuti, filterStatusCuti, filterTanggalMulaiCuti, filterTanggalSelesaiCuti, filterMinHariCuti, filterMaxHariCuti, filterOrderByCuti, filterOrderDirCuti]);

  // Load Izin Kerja List
  const loadIzinKerja = useCallback(async () => {
    if (!canReadIzinKerja) return;
    setLoadingIzin(true);
    try {
      const params: Record<string, any> = {
        page: pageIzin,
        limit: limitIzin,
        sort_by: sortByIzin,
        sort_dir: sortOrderIzin,
      };
      if (searchIzin) params.search = searchIzin;
      if (filterStatusIzin) params.status = filterStatusIzin;
      if (filterJenisIzin) params.master_jenis_izin_id = filterJenisIzin;
      if (filterTanggalMulaiIzin) params.tanggal_mulai = filterTanggalMulaiIzin;
      if (filterTanggalSelesaiIzin) params.tanggal_selesai = filterTanggalSelesaiIzin;

      const res = await simpegIzinKerjaService.getList(params);
      if (res.status === 'success' && res.data) {
        setIzinList(res.data);
        if (res.meta) setMetaIzin(res.meta);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memuat data izin jam kerja.');
    } finally {
      setLoadingIzin(false);
    }
  }, [canReadIzinKerja, pageIzin, limitIzin, searchIzin, filterStatusIzin, filterJenisIzin, filterTanggalMulaiIzin, filterTanggalSelesaiIzin, sortByIzin, sortOrderIzin]);

  useEffect(() => {
    if (activeTab === 'cuti') {
      loadCuti();
    } else {
      loadIzinKerja();
    }
  }, [activeTab, loadCuti, loadIzinKerja]);

  // Handlers Cuti
  const handleOpenRequestCuti = () => {
    if (!canCreateCuti) {
      toast.error('Anda tidak memiliki permission untuk mengajukan Cuti.');
      return;
    }
    router.push('/simpeg/cuti/pengajuan');
  };

  const handleOpenApprovalModalCuti = (cuti: PengajuanCuti) => {
    if (!canUpdateCuti) {
      toast.error('Anda tidak memiliki permission untuk memproses persetujuan Cuti.');
      return;
    }
    setSelectedCuti(cuti);
    setCatatanApprovalCuti('');
    setShowModalApprovalCuti(true);
  };

  const handleProcessApprovalCuti = async (status: StatusApprovalCuti) => {
    if (!selectedCuti || !canUpdateCuti) {
      toast.error('Akses Ditolak: Anda tidak memiliki permission memproses persetujuan Cuti.');
      return;
    }

    setIsSubmittingApprovalCuti(true);
    try {
      await simpegService.updateStatusCuti(selectedCuti.id, status, catatanApprovalCuti);
      toast.success(`Pengajuan Cuti berhasil di-${status.toUpperCase()}! Notifikasi terkirim.`);
      setShowModalApprovalCuti(false);
      loadCuti();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memproses permohonan Cuti');
    } finally {
      setIsSubmittingApprovalCuti(false);
    }
  };

  // Handlers Izin Kerja
  const handleOpenRequestIzin = () => {
    if (!canCreateIzinKerja) {
      toast.error('Anda tidak memiliki permission untuk mengajukan Izin Jam Kerja.');
      return;
    }
    router.push('/simpeg/izin-kerja/create');
  };

  const handleResetFilterIzin = () => {
    setSearchIzin('');
    setFilterStatusIzin('');
    setFilterJenisIzin('');
    setFilterTanggalMulaiIzin('');
    setFilterTanggalSelesaiIzin('');
    setSortByIzin('tanggal');
    setSortOrderIzin('desc');
    setPageIzin(1);
    setShowFilterIzin(false);
  };

  const onSubmitApprovalIzin = async (values: ApprovalIzinFormValues) => {
    if (!selectedForApprovalIzin) return;

    setIsSubmittingApprovalIzin(true);
    try {
      await simpegIzinKerjaService.approve(selectedForApprovalIzin.id, {
        status: values.status,
        catatan_approval: values.catatan_approval || '',
      });

      toast.success(
        values.status === 'disetujui'
          ? 'Izin jam kerja disetujui! Status presensi telah disinkronisasikan otomatis.'
          : 'Izin jam kerja ditolak.'
      );
      setApprovalModalOpenIzin(false);
      setSelectedForApprovalIzin(null);
      resetApprovalIzin({ status: 'disetujui', catatan_approval: '' });
      loadIzinKerja();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memproses approval izin.');
    } finally {
      setIsSubmittingApprovalIzin(false);
    }
  };

  const handleDeleteIzin = async () => {
    if (!itemToDeleteIzin) return;
    setIsDeletingIzin(true);
    try {
      await simpegIzinKerjaService.delete(itemToDeleteIzin.id);
      toast.success('Pengajuan izin jam kerja berhasil dihapus.');
      setDeleteDialogOpenIzin(false);
      setItemToDeleteIzin(null);
      loadIzinKerja();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menghapus pengajuan izin.');
    } finally {
      setIsDeletingIzin(false);
    }
  };

  const currentPegawaiId = (user as any)?.pegawai?.id;

  const getRowActionsIzin = (row: IzinJamKerja): DropdownMenuItem[] => {
    const actions: DropdownMenuItem[] = [
      {
        label: 'Lihat Detail',
        icon: <Eye size={14} />,
        onClick: () => router.push(`/simpeg/izin-kerja/${row.id}`),
      },
    ];

    if (canApproveIzinKerja && row.status === 'menunggu') {
      actions.push({
        label: 'Proses Approval SDM',
        icon: <Check size={14} />,
        onClick: () => {
          setSelectedForApprovalIzin(row);
          resetApprovalIzin({ status: 'disetujui', catatan_approval: '' });
          setApprovalModalOpenIzin(true);
        },
      });
    }

    if (row.status === 'menunggu' && (canDeleteIzinKerja || row.pegawai_id === currentPegawaiId)) {
      actions.push({
        label: 'Hapus Izin',
        icon: <Trash2 size={14} />,
        variant: 'danger',
        onClick: () => {
          setItemToDeleteIzin(row);
          setDeleteDialogOpenIzin(true);
        },
      });
    }

    return actions;
  };

  // Kolom Cuti
  const columnsCuti: ColumnDef<PengajuanCuti>[] = [
    {
      key: 'pegawai',
      label: 'Pemilik / Pegawai',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-800 text-xs">
            {row.pegawai?.nama_lengkap || `Pegawai ID ${row.pegawai_id}`}
          </div>
          <div className="text-2xs font-mono text-slate-400">
            {row.pegawai?.nip ? `NIP. ${row.pegawai.nip}` : row.pegawai?.nidn ? `NIDN. ${row.pegawai.nidn}` : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'jenis_cuti',
      label: 'Jenis Cuti / Izin',
      render: (row) => {
        const nama = row.master_jenis_cuti?.nama || (row.jenis_cuti ? row.jenis_cuti.replace('_', ' ') : 'Cuti');
        const isDitetapkan = row.master_jenis_cuti?.tipe_durasi === 'ditetapkan';
        return (
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-slate-800 text-xs">{nama}</span>
            {row.master_jenis_cuti ? (
              <Badge variant={isDitetapkan ? 'amber' : 'secondary'} className="text-[10px] w-fit">
                {isDitetapkan ? `${row.master_jenis_cuti.durasi_hari} Hari (Ditetapkan)` : 'Fleksibel'}
              </Badge>
            ) : (
              <Badge variant="purple" className="uppercase text-[10px] w-fit">
                {(row.jenis_cuti || 'tahunan').replace('_', ' ')}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      key: 'periode',
      label: 'Tanggal Mulai - Selesai',
      render: (row) => (
        <span className="text-xs text-slate-700">
          {row.tanggal_mulai} s/d {row.tanggal_selesai}
        </span>
      ),
    },
    {
      key: 'jumlah_hari',
      label: 'Lama Cuti',
      render: (row) => <span className="font-bold text-xs">{row.jumlah_hari} Hari</span>,
    },
    {
      key: 'alasan',
      label: 'Alasan & Lampiran',
      render: (row) => (
        <div className="space-y-4">
          <div className="text-slate-600 text-xs line-clamp-2 max-w-xs">{row.alasan}</div>
          {row.file_pendukung && (
            <a
              href={row.file_pendukung_url || getStorageFileUrl(row.file_pendukung)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-[11px] text-[var(--module-primary)] hover:underline font-semibold"
            >
              <Paperclip size={14} /> Lihat Lampiran Izin
            </a>
          )}
        </div>
      ),
    },
    {
      key: 'status_approval',
      label: 'Status Approval',
      render: (row) => {
        const variant =
          row.status_approval === 'approved'
            ? 'green'
            : row.status_approval === 'rejected'
            ? 'red'
            : 'yellow';
        return (
          <Badge variant={variant} className="uppercase text-[10px]">
            {row.status_approval || 'pending'}
          </Badge>
        );
      },
    },
    {
      key: 'aksi',
      label: 'Aksi SDM',
      align: 'right',
      render: (row) => {
        if (!canUpdateCuti) return '-';

        const menuItems: DropdownMenuItem[] = [
          {
            label: 'Proses Approval SDM',
            icon: <CheckCircle size={14} />,
            onClick: () => handleOpenApprovalModalCuti(row),
          },
        ];

        return (
          <div className="flex justify-end">
            <DropdownMenu items={menuItems} />
          </div>
        );
      },
    },
  ];

  // Kolom Izin Jam Kerja
  const columnsIzinKerja: ColumnDef<IzinJamKerja>[] = [
    {
      key: 'pegawai',
      label: 'Pegawai Pemohon',
      render: (row: IzinJamKerja) => (
        <div>
          <div className="font-bold text-slate-800 dark:text-slate-100 text-xs">
            {row.pegawai?.nama_lengkap || '-'}
          </div>
          <div className="text-2xs font-mono text-slate-400">
            {row.pegawai?.nip ? `NIP. ${row.pegawai.nip}` : row.pegawai?.nidn ? `NIDN. ${row.pegawai.nidn}` : ''}
            {row.pegawai?.unit_kerja?.nama ? ` • ${row.pegawai.unit_kerja.nama}` : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'jenis_izin',
      label: 'Jenis Izin Jam Kerja',
      render: (row: IzinJamKerja) => (
        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
          {row.jenis_izin?.nama || '-'}
        </span>
      ),
    },
    {
      key: 'tanggal',
      label: 'Tanggal & Jam',
      render: (row: IzinJamKerja) => (
        <div className="text-xs">
          <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">
            {new Date(row.tanggal).toLocaleDateString('id-ID', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </div>
          <div className="text-2xs text-slate-400 font-mono">
            {row.jam_mulai.substring(0, 5)} - {row.jam_selesai.substring(0, 5)} WIB
          </div>
        </div>
      ),
    },
    {
      key: 'alasan',
      label: 'Alasan & Lampiran',
      render: (row: IzinJamKerja) => (
        <div className="space-y-4">
          <p className="line-clamp-2 max-w-xs text-xs text-slate-600 dark:text-slate-300">
            {row.alasan}
          </p>
          {row.file_bukti && (
            <a
              href={row.file_bukti_url || getStorageFileUrl(row.file_bukti)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-[11px] text-[var(--module-primary)] hover:underline font-semibold"
            >
              <Paperclip size={14} /> Lihat Lampiran Bukti
            </a>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status Approval',
      render: (row: IzinJamKerja) => {
        const variant =
          row.status === 'disetujui'
            ? 'green'
            : row.status === 'ditolak'
            ? 'red'
            : 'yellow';
        return (
          <Badge variant={variant} className="capitalize text-[10px]">
            {row.status === 'menunggu' ? 'Menunggu Approval' : row.status}
          </Badge>
        );
      },
    },
    {
      key: 'aksi',
      label: 'Aksi SDM',
      align: 'right',
      render: (row: IzinJamKerja) => (
        <div className="flex justify-end">
          <DropdownMenu items={getRowActionsIzin(row)} />
        </div>
      ),
    },
  ];

  // Render Access Denied if no permission for both
  if (!canReadCuti && !canReadIzinKerja) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader
          title="Pengajuan Cuti & Izin Kerja"
          description="Layanan permohonan cuti tahunan/khusus dan izin jam kerja dinas/pribadi serta monitoring persetujuan SDM"
        />
        <div className="card p-6 text-center">
          <ShieldAlert size={56} color="var(--danger)" className="mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2 text-slate-800">
            Akses Ditolak / Dibatasi
          </h2>
          <p className="text-slate-400 max-w-[500px] mx-auto">
            Peran Anda saat ini tidak memiliki hak akses (*permission*) untuk melihat layanan Cuti maupun Izin Jam Kerja Pegawai.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Pengajuan Cuti & Izin Kerja"
        description="Layanan permohonan cuti tahunan/khusus dan izin jam kerja dinas/pribadi serta monitoring persetujuan SDM"
        action={
          <div className="flex items-center gap-2">
            {activeTab === 'cuti' ? (
              <>
                <Button
                  variant="outline"
                  icon={<Filter size={16} />}
                  onClick={() => setShowFilterCuti(true)}
                >
                  Filter
                </Button>
                {canCreateCuti && (
                  <Button icon={<Plus size={16} />} onClick={handleOpenRequestCuti}>
                    Ajukan Cuti Baru
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  icon={<Filter size={16} />}
                  onClick={() => setShowFilterIzin(true)}
                >
                  Filter
                </Button>
                {canCreateIzinKerja && (
                  <Button icon={<Plus size={16} />} onClick={handleOpenRequestIzin}>
                    Ajukan Izin Kerja
                  </Button>
                )}
              </>
            )}
          </div>
        }
      />

      {/* Modern Navigation Tabs (Mengikuti Format Presensi Pegawai) */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto">
        {canReadCuti && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setActiveTab('cuti')}
            style={activeTab === 'cuti' ? { backgroundColor: 'var(--module-primary-subtle)', color: 'var(--module-primary)', borderColor: 'var(--module-primary)' } : undefined}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'cuti'
                ? '!border-[var(--module-primary)] !text-[var(--module-primary)] !bg-[var(--module-primary-subtle)] font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <Calendar size={16} /> Pengajuan Cuti Pegawai
          </Button>
        )}
        {canReadIzinKerja && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setActiveTab('izin-kerja')}
            style={activeTab === 'izin-kerja' ? { backgroundColor: 'var(--module-primary-subtle)', color: 'var(--module-primary)', borderColor: 'var(--module-primary)' } : undefined}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'izin-kerja'
                ? '!border-[var(--module-primary)] !text-[var(--module-primary)] !bg-[var(--module-primary-subtle)] font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <Clock size={16} /> Izin Parsial Jam Kerja
          </Button>
        )}
      </div>

      {/* ── TAB 1: PENGAJUAN CUTI ── */}
      {activeTab === 'cuti' && (
        <div className="space-y-4">
          <DataTable
            columns={columnsCuti}
            data={cutiList}
            isLoading={loadingCuti}
            meta={metaCuti}
            onPageChange={(newPage) => setPageCuti(newPage)}
            onLimitChange={(newLimit) => {
              setLimitCuti(newLimit);
              setPageCuti(1);
            }}
            emptyMessage={
              <div className="p-4 text-center text-slate-400">
                <Calendar size={48} className="mx-auto mb-4 opacity-40" />
                <p>Belum ada data pengajuan cuti yang sesuai filter.</p>
              </div>
            }
          />
        </div>
      )}

      {/* ── TAB 2: IZIN JAM KERJA ── */}
      {activeTab === 'izin-kerja' && (
        <div className="space-y-4">
          <DataTable
            columns={columnsIzinKerja}
            data={izinList}
            isLoading={loadingIzin}
            meta={metaIzin || undefined}
            onPageChange={(newPage) => setPageIzin(newPage)}
            onLimitChange={(newLimit) => { setLimitIzin(newLimit); setPageIzin(1); }}
            emptyMessage={
              <div className="p-4 text-center text-slate-400">
                <Clock size={48} className="mx-auto mb-4 opacity-40" />
                <p>Belum ada data izin jam kerja yang sesuai kriteria.</p>
              </div>
            }
          />
        </div>
      )}

      {/* ── DRAWER FILTER CUTI ── */}
      <Drawer
        open={showFilterCuti}
        onClose={() => setShowFilterCuti(false)}
        title="Filter & Urutkan Pengajuan Cuti"
      >
        <div className="space-y-4">
          <Input
            label="Pencarian Nama / Alasan"
            placeholder="Cari nama pegawai, alasan..."
            value={searchCuti}
            onChange={(e) => {
              setSearchCuti(e.target.value);
              setPageCuti(1);
            }}
          />

          <Select
            label="Jenis Cuti / Izin"
            value={filterJenisCuti}
            onChange={(val) => {
              setFilterJenisCuti(val);
              setPageCuti(1);
            }}
            options={[
              { value: '', label: 'Semua Jenis Cuti / Izin' },
              ...masterCutiList.map((m) => ({
                value: m.id.toString(),
                label: `${m.nama} ${m.tipe_durasi === 'ditetapkan' ? `(${m.durasi_hari} Hari)` : ''}`,
              })),
            ]}
          />

          <Select
            label="Status Approval"
            value={filterStatusCuti}
            onChange={(val) => {
              setFilterStatusCuti(val);
              setPageCuti(1);
            }}
            options={[
              { value: '', label: 'Semua Status Approval' },
              { value: 'pending', label: 'Menunggu Approval (Pending)' },
              { value: 'approved', label: 'Disetujui (Approved)' },
              { value: 'rejected', label: 'Ditolak (Rejected)' },
            ]}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Tanggal Mulai Periode"
              type="date"
              value={filterTanggalMulaiCuti}
              onChange={(e) => {
                setFilterTanggalMulaiCuti(e.target.value);
                setPageCuti(1);
              }}
            />
            <Input
              label="Tanggal Selesai Periode"
              type="date"
              value={filterTanggalSelesaiCuti}
              onChange={(e) => {
                setFilterTanggalSelesaiCuti(e.target.value);
                setPageCuti(1);
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Min. Lama Cuti (Hari)"
              type="number"
              placeholder="0"
              value={filterMinHariCuti}
              onChange={(e) => {
                setFilterMinHariCuti(e.target.value);
                setPageCuti(1);
              }}
            />
            <Input
              label="Maks. Lama Cuti (Hari)"
              type="number"
              placeholder="Tak terhingga"
              value={filterMaxHariCuti}
              onChange={(e) => {
                setFilterMaxHariCuti(e.target.value);
                setPageCuti(1);
              }}
            />
          </div>

          <hr className="border-t border-slate-200 my-2" />

          {/* Grid 2 Kolom Sorting */}
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={filterOrderByCuti}
              onChange={(val) => setFilterOrderByCuti(val)}
              options={[
                { value: 'tanggal_mulai', label: 'Tanggal Mulai' },
                { value: 'tanggal_selesai', label: 'Tanggal Selesai' },
                { value: 'nama_pegawai', label: 'Nama Pegawai' },
                { value: 'jenis_cuti', label: 'Jenis Cuti' },
                { value: 'jumlah_hari', label: 'Jumlah Hari' },
                { value: 'alasan', label: 'Alasan' },
                { value: 'status_approval', label: 'Status Approval' },
                { value: 'created_at', label: 'Tanggal Pengajuan' },
                { value: 'id', label: 'ID' },
              ]}
            />
            <Select
              label="Arah"
              value={filterOrderDirCuti}
              onChange={(val) => setFilterOrderDirCuti(val as 'asc' | 'desc')}
              options={[
                { value: 'desc', label: 'Z - A (Terbaru)' },
                { value: 'asc', label: 'A - Z (Terlama)' },
              ]}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSearchCuti('');
                setFilterJenisCuti('');
                setFilterStatusCuti('');
                setFilterTanggalMulaiCuti('');
                setFilterTanggalSelesaiCuti('');
                setFilterMinHariCuti('');
                setFilterMaxHariCuti('');
                setFilterOrderByCuti('tanggal_mulai');
                setFilterOrderDirCuti('desc');
                setPageCuti(1);
              }}
            >
              Reset Filter
            </Button>
            <Button onClick={() => setShowFilterCuti(false)}>
              Terapkan
            </Button>
          </div>
        </div>
      </Drawer>

      {/* ── DRAWER FILTER IZIN KERJA ── */}
      <Drawer
        open={showFilterIzin}
        onClose={() => setShowFilterIzin(false)}
        title="Filter Izin Jam Kerja"
      >
        <div className="space-y-4">
          <Input
            label="Pencarian"
            type="text"
            placeholder="Cari alasan izin, nama pegawai, NIP..."
            value={searchIzin}
            onChange={(e) => {
              setSearchIzin(e.target.value);
              setPageIzin(1);
            }}
          />

          <Select
            label="Jenis Izin Jam Kerja"
            options={jenisIzinOptions}
            value={filterJenisIzin}
            onChange={(val: any) => setFilterJenisIzin(val || '')}
          />

          <Select
            label="Status Approval"
            options={statusOptionsIzin}
            value={filterStatusIzin}
            onChange={(val: any) => setFilterStatusIzin(val || '')}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Tanggal Mulai"
              type="date"
              value={filterTanggalMulaiIzin}
              onChange={(e) => setFilterTanggalMulaiIzin(e.target.value)}
            />
            <Input
              label="Tanggal Selesai"
              type="date"
              value={filterTanggalSelesaiIzin}
              onChange={(e) => setFilterTanggalSelesaiIzin(e.target.value)}
            />
          </div>

          <hr className="my-4 border-slate-200 dark:border-slate-700" />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              options={[
                { value: 'tanggal', label: 'Tanggal Izin' },
                { value: 'nama_pegawai', label: 'Nama Pegawai' },
                { value: 'jenis_izin', label: 'Jenis Izin' },
                { value: 'alasan', label: 'Alasan' },
                { value: 'status', label: 'Status' },
                { value: 'created_at', label: 'Tanggal Pengajuan' },
              ]}
              value={sortByIzin}
              onChange={(val: any) => setSortByIzin(val || 'tanggal')}
            />
            <Select
              label="Arah"
              options={[
                { value: 'desc', label: 'Z - A (Terbaru)' },
                { value: 'asc', label: 'A - Z (Terlama)' },
              ]}
              value={sortOrderIzin}
              onChange={(val: any) => setSortOrderIzin(val || 'desc')}
            />
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="outline"
              onClick={handleResetFilterIzin}
            >
              Reset Filter
            </Button>
            <Button
              onClick={() => {
                setPageIzin(1);
                setShowFilterIzin(false);
              }}
            >
              Terapkan
            </Button>
          </div>
        </div>
      </Drawer>

      {/* ── MODAL APPROVAL CUTI SDM ── */}
      {canUpdateCuti && (
        <Modal
          open={showModalApprovalCuti}
          onClose={() => setShowModalApprovalCuti(false)}
          title="Proses Persetujuan Cuti SDM"
          footer={
            <div className="flex gap-2 justify-end w-full">
              <Button
                variant="danger"
                loading={isSubmittingApprovalCuti}
                disabled={isSubmittingApprovalCuti}
                onClick={() => handleProcessApprovalCuti('rejected')}
              >
                <XCircle size={16} /> Tolak Cuti
              </Button>
              <Button
                variant="primary"
                loading={isSubmittingApprovalCuti}
                disabled={isSubmittingApprovalCuti}
                onClick={() => handleProcessApprovalCuti('approved')}
              >
                <CheckCircle size={16} /> Setujui Cuti
              </Button>
            </div>
          }
        >
          {selectedCuti && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm space-y-4">
                <div><strong>Pegawai:</strong> {selectedCuti.pegawai?.nama_lengkap || selectedCuti.pegawai_id}</div>
                <div><strong>Jenis:</strong> {(selectedCuti.jenis_cuti || 'TAHUNAN').toUpperCase()} ({selectedCuti.jumlah_hari} Hari)</div>
                <div><strong>Periode:</strong> {selectedCuti.tanggal_mulai} s/d {selectedCuti.tanggal_selesai}</div>
                <div><strong>Alasan:</strong> {selectedCuti.alasan}</div>
                {selectedCuti.file_pendukung && (
                  <div className="pt-4">
                    <a
                      href={selectedCuti.file_pendukung_url || getStorageFileUrl(selectedCuti.file_pendukung)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-xs text-[var(--module-primary)] hover:underline font-semibold bg-white p-2 rounded border border-slate-200"
                    >
                      <Paperclip size={14} /> Lihat Lampiran Izin / Surat Cuti
                    </a>
                  </div>
                )}
              </div>

              <Textarea
                label="Catatan Approval SDM (Dikirim via WA/Email)"
                rows={2}
                value={catatanApprovalCuti}
                onChange={(e) => setCatatanApprovalCuti(e.target.value)}
                placeholder="Contoh: Disetujui. Harap selesaikan serah terima tugas sebelum menjalani cuti."
              />
            </div>
          )}
        </Modal>
      )}

      {/* ── MODAL APPROVAL IZIN JAM KERJA ── */}
      <Modal
        open={approvalModalOpenIzin}
        onClose={() => setApprovalModalOpenIzin(false)}
        title="Proses Approval Izin Jam Kerja"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={() => setApprovalModalOpenIzin(false)}
              disabled={isSubmittingApprovalIzin}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={isSubmittingApprovalIzin}
              loading={isSubmittingApprovalIzin}
              onClick={() => handleSubmitApprovalIzinForm(onSubmitApprovalIzin)()}
            >
              Simpan Keputusan
            </Button>
          </div>
        }
      >
        <form
          id="approval-izin-form"
          onSubmit={handleSubmitApprovalIzinForm(onSubmitApprovalIzin)}
          className="space-y-4"
        >
          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300 space-y-4">
            <p className="font-semibold text-slate-800 dark:text-white">
              {selectedForApprovalIzin?.pegawai?.nama_lengkap}
            </p>
            <p>
              {selectedForApprovalIzin?.jenis_izin?.nama} • {selectedForApprovalIzin?.tanggal} (
              {selectedForApprovalIzin?.jam_mulai} - {selectedForApprovalIzin?.jam_selesai})
            </p>
            <p className="italic">&ldquo;{selectedForApprovalIzin?.alasan}&rdquo;</p>
            {selectedForApprovalIzin?.file_bukti && (
              <div>
                <a
                  href={selectedForApprovalIzin.file_bukti_url || getStorageFileUrl(selectedForApprovalIzin.file_bukti)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-xs text-[var(--module-primary)] hover:underline font-semibold bg-white p-2 rounded border border-slate-200"
                >
                  <Paperclip size={14} /> Lihat Berkas Lampiran Bukti
                </a>
              </div>
            )}
          </div>

          <Controller
            name="status"
            control={controlApprovalIzin}
            render={({ field }) => (
              <Select
                label="Keputusan Approval"
                options={approvalDecisionOptions}
                value={field.value}
                onChange={(val: any) => field.onChange(val || '')}
                error={errorsApprovalIzin.status?.message}
              />
            )}
          />

          <Controller
            name="catatan_approval"
            control={controlApprovalIzin}
            render={({ field }) => (
              <Input
                label="Catatan Approval"
                placeholder="Tambahkan catatan pertimbangan jika diperlukan..."
                value={field.value || ''}
                onChange={field.onChange}
                error={errorsApprovalIzin.catatan_approval?.message}
              />
            )}
          />
        </form>
      </Modal>

      {/* ── DELETE CONFIRM DIALOG IZIN JAM KERJA ── */}
      <ConfirmDialog
        isOpen={deleteDialogOpenIzin}
        onClose={() => setDeleteDialogOpenIzin(false)}
        onConfirm={handleDeleteIzin}
        title="Hapus Pengajuan Izin Jam Kerja"
        message={`Apakah Anda yakin ingin menghapus pengajuan izin pada tanggal ${itemToDeleteIzin?.tanggal}? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus Pengajuan"
        cancelText="Batal"
        variant="danger"
        isLoading={isDeletingIzin}
      />
    </div>
  );
}
