'use client';

import { formatRupiah, formatDate } from '@/lib/utils';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Filter, Plus, Eye, Building2, Briefcase, CheckCircle2, Wallet, Check, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { pengajuanOperasionalService, type PengajuanOperasional } from '@/services/pengajuan-operasional.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { DropdownMenu } from '@/components/ui/DropdownMenu';

// ── SCHEMAS ZOD DI LUAR KOMPONEN (AUDIT 03 FORM VALIDATION) ──────────────────
const setujuiPanjarSchema = z.object({
  unit_kas_id: z.string().min(1, 'Unit Kas pembayaran wajib dipilih'),
  nominal_disetujui: z.coerce.number().positive('Nominal panjar yang disetujui harus lebih dari 0'),
  catatan: z.string().optional(),
});
type SetujuiPanjarFormValues = z.infer<typeof setujuiPanjarSchema>;

const cairkanPanjarSchema = z.object({
  tanggal_pencairan: z.string().min(1, 'Tanggal pencairan wajib diisi'),
  unit_kas_id: z.string().min(1, 'Unit Kas pembayaran wajib dipilih'),
  nominal_cair: z.coerce.number().positive('Nominal pencairan harus lebih dari 0'),
  bukti_pencairan: z.any().optional(),
});
type CairkanPanjarFormValues = z.infer<typeof cairkanPanjarSchema>;

const tutupLpjSchema = z.object({
  catatan: z.string().optional(),
});
type TutupLpjFormValues = z.infer<typeof tutupLpjSchema>;

const STATUS_LABEL: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'secondary' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  diajukan: { label: 'Diajukan', variant: 'info' },
  pending_sarpras: { label: 'Menunggu Sarpras', variant: 'warning' },
  pending_keuangan: { label: 'Menunggu Keuangan', variant: 'warning' },
  panjar_disetujui: { label: 'Menunggu Konfirmasi Pegawai', variant: 'info' },
  pending_direktur: { label: 'Menunggu Direktur', variant: 'warning' },
  disetujui: { label: 'Siap Dicairkan', variant: 'success' },
  ditolak: { label: 'Ditolak', variant: 'danger' },
  dicairkan: { label: 'Panjar Dicairkan', variant: 'success' },
  lpj_pending: { label: 'Verifikasi LPJ', variant: 'warning' },
  selesai: { label: 'Selesai', variant: 'success' },
};

export default function PengajuanOperasionalPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'operasional' | 'simpeg'>('operasional');
  const [data, setData] = useState<PengajuanOperasional[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination states (Audit 02)
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [meta, setMeta] = useState<any>(undefined);

  // Dynamic references (Audit 01 Zero Hardcode)
  const [unitKasList, setUnitKasList] = useState<{ id: number; nama_kas: string }[]>([]);
  const [kategoriList, setKategoriList] = useState<{ id: string; nama: string }[]>([]);

  // Filter Drawer State & Sorting Parity 1:1 (Audit 02)
  const [showFilter, setShowFilter] = useState(false);
  const [fSearch, setFSearch] = useState('');
  const [fPegawai, setFPegawai] = useState('');
  const [fTanggalDari, setFTanggalDari] = useState('');
  const [fTanggalSampai, setFTanggalSampai] = useState('');
  const [fStatus, setFStatus] = useState('all');
  const [fKategori, setFKategori] = useState('all');
  const [fKasId, setFKasId] = useState('all');
  const [fStatusLpj, setFStatusLpj] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const [applied, setApplied] = useState({
    search: '',
    pegawai: '',
    tanggal_dari: '',
    tanggal_sampai: '',
    status: 'all',
    kategori: 'all',
    kas_id: 'all',
    status_lpj: 'all',
    sort_by: 'created_at',
    sort_dir: 'desc' as 'asc' | 'desc',
  });

  // AsyncSelect Server-Side loader for Unit Kas (Audit 03)
  const loadUnitKasOptions = useCallback(async (inputValue: string) => {
    try {
      const res = await pengajuanOperasionalService.listUnitKas();
      const list = Array.isArray(res.data) ? res.data : [];
      return list
        .filter((k) => !inputValue || k.nama_kas.toLowerCase().includes(inputValue.toLowerCase()))
        .map((k) => ({
          value: String(k.id),
          label: k.nama_kas,
        }));
    } catch {
      return [];
    }
  }, []);

  // Modal: Setujui Panjar SIMPEG (Tahap 3)
  const [modalPanjarOpen, setModalPanjarOpen] = useState(false);
  const [selectedItemForPanjar, setSelectedItemForPanjar] = useState<PengajuanOperasional | null>(null);

  const formPanjar = useForm<SetujuiPanjarFormValues>({
    resolver: zodResolver(setujuiPanjarSchema) as any,
    defaultValues: {
      unit_kas_id: '',
      nominal_disetujui: 0,
      catatan: '',
    },
  });

  // Modal: Pencairan Kas & Upload Resi (Tahap 5)
  const [modalCairOpen, setModalCairOpen] = useState(false);
  const [selectedItemForCair, setSelectedItemForCair] = useState<PengajuanOperasional | null>(null);
  const [cairBuktiFile, setCairBuktiFile] = useState<File | null>(null);

  const formCair = useForm<CairkanPanjarFormValues>({
    resolver: zodResolver(cairkanPanjarSchema) as any,
    defaultValues: {
      tanggal_pencairan: new Date().toISOString().split('T')[0],
      unit_kas_id: '',
      nominal_cair: 0,
      bukti_pencairan: undefined,
    },
  });

  // Modal: Tutup LPJ SIMPEG (Tahap 8)
  const [modalTutupLpjOpen, setModalTutupLpjOpen] = useState(false);
  const [selectedItemForTutupLpj, setSelectedItemForTutupLpj] = useState<PengajuanOperasional | null>(null);

  const formTutupLpj = useForm<TutupLpjFormValues>({
    resolver: zodResolver(tutupLpjSchema) as any,
    defaultValues: {
      catatan: '',
    },
  });

  // Load Unit Kas & Kategori options via API (Zero Hardcode)
  useEffect(() => {
    pengajuanOperasionalService.listUnitKas()
      .then((res) => {
        if (Array.isArray(res.data)) {
          setUnitKasList(res.data);
        }
      })
      .catch(() => {});

    pengajuanOperasionalService.listKategori()
      .then((res) => {
        if (Array.isArray(res.data)) {
          setKategoriList(res.data);
        }
      })
      .catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await pengajuanOperasionalService.list({
        tab: activeTab,
        page,
        per_page: limit,
        search: applied.search || undefined,
        status: applied.status !== 'all' ? applied.status : undefined,
        kategori: activeTab === 'operasional' && applied.kategori !== 'all' ? applied.kategori : undefined,
      });
      setData(Array.isArray(res.data) ? res.data : []);
      if ((res as any).meta) {
        setMeta((res as any).meta);
      }
    } catch {
      toast.error('Gagal memuat daftar pengajuan');
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, limit, applied]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handler Open Modal Panjar
  const handleOpenSetujuiPanjar = (row: PengajuanOperasional) => {
    setSelectedItemForPanjar(row);
    formPanjar.reset({
      unit_kas_id: row.unit_kas_id ? String(row.unit_kas_id) : (unitKasList[0]?.id ? String(unitKasList[0].id) : ''),
      nominal_disetujui: Number(row.nominal_disetujui > 0 ? row.nominal_disetujui : row.nominal_diajukan),
      catatan: '',
    });
    setModalPanjarOpen(true);
  };

  // Submit Modal Panjar (Tahap 3)
  const onSubmitSetujuiPanjar = async (values: SetujuiPanjarFormValues) => {
    if (!selectedItemForPanjar) return;

    try {
      await pengajuanOperasionalService.setujuiPanjarSimpeg(selectedItemForPanjar.id, {
        unit_kas_id: Number(values.unit_kas_id),
        nominal_disetujui: Number(values.nominal_disetujui),
        catatan: values.catatan || undefined,
      });
      toast.success('Panjar perjalanan dinas disetujui! Menunggu konfirmasi pemohon di SIMPEG.');
      setModalPanjarOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyetujui panjar.');
    }
  };

  // Handler Open Modal Cairkan (Tahap 5)
  const handleOpenCairkan = (row: PengajuanOperasional) => {
    setSelectedItemForCair(row);
    formCair.reset({
      tanggal_pencairan: new Date().toISOString().split('T')[0],
      unit_kas_id: row.unit_kas_id ? String(row.unit_kas_id) : (unitKasList[0]?.id ? String(unitKasList[0].id) : ''),
      nominal_cair: Number(row.nominal_disetujui || row.nominal_diajukan),
      bukti_pencairan: undefined,
    });
    setCairBuktiFile(null);
    setModalCairOpen(true);
  };

  // Submit Modal Cairkan (Tahap 5)
  const onSubmitCairkan = async (values: CairkanPanjarFormValues) => {
    if (!selectedItemForCair) return;

    try {
      const formData = new FormData();
      formData.append('nominal_cair', String(values.nominal_cair));
      formData.append('tanggal_pencairan', values.tanggal_pencairan);
      if (values.unit_kas_id) formData.append('unit_kas_id', values.unit_kas_id);
      if (cairBuktiFile) formData.append('bukti_pencairan', cairBuktiFile);

      await pengajuanOperasionalService.pencairan(selectedItemForCair.id, formData);
      toast.success('Dana panjar dinas berhasil dicairkan!');
      setModalCairOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mencairkan dana panjar.');
    }
  };

  // Handler Open Modal Tutup LPJ (Tahap 8)
  const handleOpenTutupLpj = (row: PengajuanOperasional) => {
    setSelectedItemForTutupLpj(row);
    formTutupLpj.reset({
      catatan: '',
    });
    setModalTutupLpjOpen(true);
  };

  // Submit Modal Tutup LPJ (Tahap 8)
  const onSubmitTutupLpj = async (values: TutupLpjFormValues) => {
    if (!selectedItemForTutupLpj) return;

    try {
      await pengajuanOperasionalService.tutupLpjSimpeg(selectedItemForTutupLpj.id, {
        catatan: values.catatan || undefined,
      });
      toast.success('LPJ berhasil diverifikasi & kasbon dinas ditutup selesai!');
      setModalTutupLpjOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyelesaikan LPJ.');
    }
  };

  // TAB 1 (OPERASIONAL / SINAPRA) COLUMNS
  const columnsOperasional: ColumnDef<PengajuanOperasional>[] = [
    {
      key: 'judul_pengajuan',
      label: 'PENGAJUAN',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900 text-xs font-mono">{row.nomor_pengajuan}</p>
          <p className="text-xs text-slate-800 font-medium line-clamp-1">{row.judul_pengajuan}</p>
          <p className="text-2xs text-slate-500 line-clamp-1">{row.deskripsi}</p>
        </div>
      ),
    },
    {
      key: 'kategori_pengajuan',
      label: 'KATEGORI',
      render: (row) => (
        <Badge variant={row.kategori_pengajuan === 'pengadaan_barang' ? 'info' : 'secondary'}>
          {row.kategori_pengajuan === 'pengadaan_barang' ? 'BARANG' : 'NON-BARANG'}
        </Badge>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (row) => {
        const s = STATUS_LABEL[row.status] || { label: row.status, variant: 'secondary' as const };
        return <Badge variant={s.variant}>{s.label}</Badge>;
      },
    },
    {
      key: 'nominal_diajukan',
      label: 'NOMINAL',
      render: (row) => <span className="font-bold tabular-nums text-xs">{formatRupiah(Number(row.nominal_diajukan) || 0)}</span>,
    },
    {
      key: 'created_at',
      label: 'TANGGAL',
      render: (row) => <span className="text-xs text-slate-600">{row.created_at ? formatDate(row.created_at) : '-'}</span>,
    },
    {
      key: 'actions',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <DropdownMenu
          items={[{ label: 'Lihat Detail & Proses', icon: <Eye size={16} />, onClick: () => router.push(`/sikeu/pengajuan/${row.id}`) }]}
        />
      ),
    },
  ];

  // TAB 2 (PERJALANAN DINAS / SIMPEG) COLUMNS
  const columnsSimpeg: ColumnDef<PengajuanOperasional>[] = [
    {
      key: 'nomor_pengajuan',
      label: 'PENGAJUAN / SURAT TUGAS',
      render: (row) => {
        const st = row.surat_tugas;
        return (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-xs font-mono">{row.nomor_pengajuan}</span>
              {st?.nomor_surat && (
                <Badge variant="secondary">
                  {st.nomor_surat}
                </Badge>
              )}
            </div>
            <p className="text-xs font-medium text-slate-800 line-clamp-1">{st?.nama_kegiatan || row.judul_pengajuan}</p>
            <p className="text-2xs text-slate-400">
              Tujuan: {st?.lokasi_tujuan || '-'} ({st ? `${st.tanggal_berangkat} s/d ${st.tanggal_kembali}` : '-'})
            </p>
          </div>
        );
      },
    },
    {
      key: 'pegawai',
      label: 'PEGAWAI / UNIT',
      render: (row) => {
        const p = row.surat_tugas?.pegawai;
        return (
          <div>
            <p className="text-xs font-semibold text-slate-900">{p?.nama_lengkap || '-'}</p>
            <p className="text-2xs text-slate-400">{p?.unit_kerja?.nama || 'SDM'}</p>
          </div>
        );
      },
    },
    {
      key: 'unit_kas',
      label: 'KAS PEMBAYAR',
      render: (row) => {
        if (!row.unit_kas?.nama_kas) {
          return <span className="text-2xs text-amber-600 font-medium italic">Belum Ditetapkan</span>;
        }
        return (
          <span className="text-xs font-medium text-slate-800 inline-flex items-center gap-2">
            <Wallet size={16} style={{ color: 'var(--module-primary)' }} className="shrink-0" />
            <span>{row.unit_kas.nama_kas}</span>
          </span>
        );
      },
    },
    {
      key: 'nominal',
      label: 'ESTIMASI / PANJAR',
      render: (row) => (
        <div>
          <p className="text-xs font-bold text-slate-900 tabular-nums">
            {formatRupiah(row.nominal_disetujui > 0 ? row.nominal_disetujui : row.nominal_diajukan)}
          </p>
          {row.nominal_disetujui > 0 && row.nominal_disetujui !== row.nominal_diajukan && (
            <p className="text-2xs text-slate-400 line-through">
              {formatRupiah(row.nominal_diajukan)}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'lpj',
      label: 'REALISASI & SISA LPJ',
      render: (row) => {
        if (row.total_realisasi === null || row.total_realisasi === undefined || Number(row.total_realisasi) === 0) {
          return <span className="text-2xs text-slate-400 italic">Belum Ada LPJ</span>;
        }
        const sisa = Number(row.sisa_nominal || 0);
        return (
          <div>
            <p className="text-xs font-semibold text-slate-800 tabular-nums">
              Realisasi: {formatRupiah(row.total_realisasi)}
            </p>
            {sisa > 0 ? (
              <p className="text-2xs font-semibold text-emerald-600">
                Kembali: {formatRupiah(sisa)}
              </p>
            ) : sisa < 0 ? (
              <p className="text-2xs font-semibold text-rose-600">
                Klaim Kurang: {formatRupiah(Math.abs(sisa))}
              </p>
            ) : (
              <p className="text-2xs text-slate-400">Nihil (Impas)</p>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (row) => {
        const s = STATUS_LABEL[row.status] || { label: row.status, variant: 'secondary' as const };
        return <Badge variant={s.variant}>{s.label}</Badge>;
      },
    },
    {
      key: 'actions',
      label: 'AKSI',
      align: 'right',
      render: (row) => {
        const items = [];

        // Tahap 3: Setujui Kas & Nominal Panjar
        if (row.status === 'pending_keuangan') {
          items.push({
            label: 'Tentukan Kas & Setujui Panjar',
            icon: <CheckCircle2 size={16} className="text-emerald-600" />,
            onClick: () => handleOpenSetujuiPanjar(row),
          });
        }

        // Tahap 5: Pencairan Dana & Upload Resi
        if (row.status === 'disetujui') {
          items.push({
            label: 'Cairkan Panjar & Unggah Bukti',
            icon: <Wallet size={16} style={{ color: 'var(--module-primary)' }} />,
            onClick: () => handleOpenCairkan(row),
          });
        }

        // Tahap 8: Verifikasi LPJ & Tutup Buku
        if (row.status === 'lpj_pending') {
          items.push({
            label: 'Verifikasi LPJ & Selesaikan',
            icon: <Check size={16} className="text-emerald-600" />,
            onClick: () => handleOpenTutupLpj(row),
          });
        }

        // Link ke detail surat tugas di SIMPEG
        if (row.surat_tugas?.id) {
          items.push({
            label: 'Buka Surat Tugas (SIMPEG)',
            icon: <Eye size={16} />,
            onClick: () => router.push(`/simpeg/surat-tugas/${row.surat_tugas?.id}`),
          });
        }

        return <DropdownMenu items={items} />;
      },
    },
  ];

  return (
    <div className="w-full space-y-6 animate-fade-in">
      <PageHeader
        title="Pengajuan Operasional"
        description="Kelola pengajuan anggaran operasional kampus: Pengadaan Sarpras (SINAPRA) dan Panjar Dinas (SIMPEG)."
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setShowFilter(true)}
              style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
              className="font-bold min-h-[40px]"
            >
              Filter
            </Button>
            {activeTab === 'operasional' && (
              <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={() => router.push('/sikeu/pengajuan/create')}
                className="font-bold min-h-[40px]"
              >
                Buat Pengajuan
              </Button>
            )}
          </div>
        }
      />

      {/* SUB-NAVIGASI SKEMA TAB (ATURAN 13B ADMIN CRUD REVIEWER) */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => {
            setActiveTab('operasional');
            setPage(1);
          }}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'operasional'
              ? 'border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle)]'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <Building2 size={16} />
          <span>Operasional & Sarpras (SINAPRA)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('simpeg');
            setPage(1);
          }}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'simpeg'
              ? 'border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle)]'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <Briefcase size={16} />
          <span>Perjalanan Dinas (SIMPEG)</span>
        </button>
      </div>

      {/* DATA TABLE DENGAN SERVER-SIDE PAGINATION & META (ATURAN 5 ADMIN CRUD) */}
      {activeTab === 'operasional' ? (
        <DataTable
          data={data}
          isLoading={loading}
          columns={columnsOperasional}
          meta={meta}
          onPageChange={(newPage) => setPage(newPage)}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
          emptyMessage="Belum ada data pengajuan operasional & sarpras."
        />
      ) : (
        <DataTable
          data={data}
          isLoading={loading}
          columns={columnsSimpeg}
          meta={meta}
          onPageChange={(newPage) => setPage(newPage)}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
          emptyMessage="Belum ada antrean pencairan panjar perjalanan dinas SIMPEG."
        />
      )}

      {/* DRAWER FILTER (PARITAS 1:1 KOLOM INFORMASI & SORTING 2-KOLOM DENGAN HR) */}
      <Drawer
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Pengajuan"
        width="420px"
        footer={
          <div className="flex items-center justify-between gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFSearch('');
                setFPegawai('');
                setFTanggalDari('');
                setFTanggalSampai('');
                setFStatus('all');
                setFKategori('all');
                setFKasId('all');
                setFStatusLpj('all');
                setSortBy('created_at');
                setSortDir('desc');
                setApplied({
                  search: '',
                  pegawai: '',
                  tanggal_dari: '',
                  tanggal_sampai: '',
                  status: 'all',
                  kategori: 'all',
                  kas_id: 'all',
                  status_lpj: 'all',
                  sort_by: 'created_at',
                  sort_dir: 'desc',
                });
                setPage(1);
                setShowFilter(false);
              }}
              className="font-bold min-h-[40px] px-4"
            >
              Reset
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                setApplied({
                  search: fSearch,
                  pegawai: fPegawai,
                  tanggal_dari: fTanggalDari,
                  tanggal_sampai: fTanggalSampai,
                  status: fStatus,
                  kategori: fKategori,
                  kas_id: fKasId,
                  status_lpj: fStatusLpj,
                  sort_by: sortBy,
                  sort_dir: sortDir,
                });
                setPage(1);
                setShowFilter(false);
              }}
              className="font-bold min-h-[40px] px-4"
            >
              Terapkan Filter
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Cari Nomor / Judul / Kegiatan"
            placeholder="Ketik kata kunci..."
            value={fSearch}
            onChange={(e) => setFSearch(e.target.value)}
          />

          <Input
            label="Pegawai / Pemohon"
            placeholder="Cari nama pegawai..."
            value={fPegawai}
            onChange={(e) => setFPegawai(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Tanggal Dari"
              type="date"
              value={fTanggalDari}
              onChange={(e) => setFTanggalDari(e.target.value)}
            />
            <Input
              label="Tanggal Sampai"
              type="date"
              value={fTanggalSampai}
              onChange={(e) => setFTanggalSampai(e.target.value)}
            />
          </div>

          <Select
            label="Status Pengajuan"
            value={fStatus}
            onChange={(v) => setFStatus(v as string)}
            options={[
              { value: 'all', label: 'Semua Status' },
              ...Object.entries(STATUS_LABEL).map(([v, s]) => ({ value: v, label: s.label })),
            ]}
          />

          {activeTab === 'operasional' && (
            <Select
              label="Kategori Pengajuan"
              value={fKategori}
              onChange={(v) => setFKategori(v as string)}
              options={[
                { value: 'all', label: 'Semua Kategori' },
                ...kategoriList.map((k) => ({
                  value: String(k.id),
                  label: k.nama,
                })),
              ]}
            />
          )}

          <Select
            label="Unit Kas Pembayar"
            value={fKasId}
            onChange={(v) => setFKasId(v as string)}
            options={[
              { value: 'all', label: 'Semua Unit Kas' },
              ...unitKasList.map((k) => ({
                value: String(k.id),
                label: k.nama_kas,
              })),
            ]}
          />

          {activeTab === 'simpeg' && (
            <Select
              label="Status Realisasi / LPJ"
              value={fStatusLpj}
              onChange={(v) => setFStatusLpj(v as string)}
              options={[
                { value: 'all', label: 'Semua Status LPJ' },
                { value: 'belum_lpj', label: 'Belum Ada LPJ' },
                { value: 'ada_lpj', label: 'Sudah Ada LPJ' },
                { value: 'ada_kembalian', label: 'Ada Sisa Kembalian Panjar' },
                { value: 'kurang_bayar', label: 'Ada Klaim Kurang Bayar (Reimbursement)' },
                { value: 'impas', label: 'Realisasi Impas (Pas)' },
              ]}
            />
          )}

          {/* PEMISAH HR & SORTING 2-KOLOM (ATURAN 6 ADMIN CRUD) */}
          <hr className="border-t border-slate-200" />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={sortBy}
              onChange={(v) => setSortBy(v as string)}
              options={[
                { value: 'created_at', label: 'Tanggal Pengajuan' },
                { value: 'nomor_pengajuan', label: 'Nomor Pengajuan' },
                { value: 'judul_pengajuan', label: 'Judul / Kegiatan' },
                { value: 'pegawai', label: 'Pegawai / Pemohon' },
                { value: 'unit_kas', label: 'Unit Kas Pembayar' },
                { value: 'kategori_pengajuan', label: 'Kategori Pengajuan' },
                { value: 'nominal_diajukan', label: 'Nominal Diajukan' },
                { value: 'nominal_disetujui', label: 'Nominal Disetujui' },
                { value: 'total_realisasi', label: 'Realisasi / Sisa LPJ' },
                { value: 'status', label: 'Status' },
              ]}
            />
            <Select
              label="Arah Urutan"
              value={sortDir}
              onChange={(v) => setSortDir(v as 'asc' | 'desc')}
              options={[
                { value: 'asc', label: 'A - Z (Menaik)' },
                { value: 'desc', label: 'Z - A (Menurun)' },
              ]}
            />
          </div>
        </div>
      </Drawer>

      {/* MODAL: SETUJUI PANJAR SIMPEG DENGAN STRICT ZOD VALIDATION (TAHAP 3) */}
      <Modal
        isOpen={modalPanjarOpen}
        onClose={() => {
          if (!formPanjar.formState.isSubmitting) setModalPanjarOpen(false);
        }}
        title="Persetujuan Panjar Dinas (Keuangan)"
        size="md"
      >
        <form onSubmit={formPanjar.handleSubmit(onSubmitSetujuiPanjar)} className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex flex-col gap-2">
            <p className="font-semibold text-slate-800">
              {selectedItemForPanjar?.surat_tugas?.nama_kegiatan || selectedItemForPanjar?.judul_pengajuan}
            </p>
            <p className="text-slate-600">
              Pemohon: {selectedItemForPanjar?.surat_tugas?.pegawai?.nama_lengkap || '-'} ({selectedItemForPanjar?.surat_tugas?.pegawai?.unit_kerja?.nama || 'SDM'})
            </p>
            <p className="text-slate-600">
              Estimasi Diajukan: <span className="font-bold">{formatRupiah(selectedItemForPanjar?.nominal_diajukan)}</span>
            </p>
          </div>

          <Controller
            control={formPanjar.control}
            name="unit_kas_id"
            render={({ field }) => (
              <AsyncSelect
                label="Pilih Unit Kas Pembayar"
                required
                loadOptions={loadUnitKasOptions}
                value={field.value}
                onChange={(opt: any) => field.onChange(opt ? String(opt.value) : '')}
                error={formPanjar.formState.errors.unit_kas_id?.message}
                placeholder="Pilih unit kas pembayar..."
              />
            )}
          />

          <Input
            label="Nominal Panjar yang Disetujui (Rp)"
            type="number"
            min="1"
            required
            hint="Dapat disesuaikan berdasarkan plafon atau ketersediaan anggaran dinas."
            error={formPanjar.formState.errors.nominal_disetujui?.message}
            {...formPanjar.register('nominal_disetujui')}
          />

          <Input
            label="Catatan Keuangan (Opsional)"
            placeholder="Catatan persetujuan panjar dinas..."
            error={formPanjar.formState.errors.catatan?.message}
            {...formPanjar.register('catatan')}
          />

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalPanjarOpen(false)}
              disabled={formPanjar.formState.isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={formPanjar.formState.isSubmitting}
              disabled={formPanjar.formState.isSubmitting}
              className="flex items-center gap-2"
            >
              <Check size={16} />
              <span>Setujui Panjar</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: CAIRKAN DANA PANJAR & RESI DENGAN STRICT ZOD VALIDATION (TAHAP 5) */}
      <Modal
        isOpen={modalCairOpen}
        onClose={() => {
          if (!formCair.formState.isSubmitting) setModalCairOpen(false);
        }}
        title="Pencairan Dana Panjar & Unggah Bukti Transfer"
        size="md"
      >
        <form onSubmit={formCair.handleSubmit(onSubmitCairkan)} className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs flex flex-col gap-2">
            <p className="font-semibold text-emerald-950">
              {selectedItemForCair?.surat_tugas?.nama_kegiatan || selectedItemForCair?.judul_pengajuan}
            </p>
            <p className="text-emerald-900">
              Penerima: {selectedItemForCair?.surat_tugas?.pegawai?.nama_lengkap || '-'}
            </p>
            <p className="text-emerald-950 font-bold text-sm">
              Nominal Panjar: {formatRupiah(selectedItemForCair?.nominal_disetujui || selectedItemForCair?.nominal_diajukan)}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Tanggal Pencairan"
              type="date"
              required
              error={formCair.formState.errors.tanggal_pencairan?.message}
              {...formCair.register('tanggal_pencairan')}
            />
            <Controller
              control={formCair.control}
              name="unit_kas_id"
              render={({ field }) => (
                <AsyncSelect
                  label="Unit Kas"
                  required
                  loadOptions={loadUnitKasOptions}
                  value={field.value}
                  onChange={(opt: any) => field.onChange(opt ? String(opt.value) : '')}
                  error={formCair.formState.errors.unit_kas_id?.message}
                  placeholder="Pilih unit kas..."
                />
              )}
            />
          </div>

          <Controller
            control={formCair.control}
            name="bukti_pencairan"
            render={({ field: { onChange, value, ...field } }) => (
              <Input
                {...field}
                label="Unggah Bukti Pencairan / Resi Transfer (PDF / Gambar)"
                type="file"
                accept=".pdf,image/*"
                hint="Format PDF atau JPG/PNG, maksimal 5MB."
                error={formCair.formState.errors.bukti_pencairan?.message as string}
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  onChange(file);
                  setCairBuktiFile(file);
                }}
              />
            )}
          />

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalCairOpen(false)}
              disabled={formCair.formState.isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={formCair.formState.isSubmitting}
              disabled={formCair.formState.isSubmitting}
              className="flex items-center gap-2"
            >
              <Wallet size={16} />
              <span>Cairkan Dana</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: VERIFIKASI LPJ & TUTUP BUKU DENGAN STRICT ZOD VALIDATION (TAHAP 8) */}
      <Modal
        isOpen={modalTutupLpjOpen}
        onClose={() => {
          if (!formTutupLpj.formState.isSubmitting) setModalTutupLpjOpen(false);
        }}
        title="Verifikasi LPJ & Penutupan Kasbon Dinas"
        size="md"
      >
        <form onSubmit={formTutupLpj.handleSubmit(onSubmitTutupLpj)} className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex flex-col gap-2">
            <p className="font-semibold text-slate-800">
              {selectedItemForTutupLpj?.surat_tugas?.nama_kegiatan || selectedItemForTutupLpj?.judul_pengajuan}
            </p>
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
              <div>
                <p className="text-slate-500">Panjar Dicairkan:</p>
                <p className="font-bold text-slate-900">{formatRupiah(selectedItemForTutupLpj?.nominal_disetujui)}</p>
              </div>
              <div>
                <p className="text-slate-500">Total Realisasi (LPJ):</p>
                <p className="font-bold text-slate-900">{formatRupiah(selectedItemForTutupLpj?.total_realisasi)}</p>
              </div>
            </div>

            {selectedItemForTutupLpj && (() => {
              const sisa = Number(selectedItemForTutupLpj.sisa_nominal || 0);
              if (sisa > 0) {
                return (
                  <div className="bg-emerald-100 border border-emerald-300 text-emerald-900 p-2 rounded text-xs font-semibold">
                    Dana Panjar Kembali: {formatRupiah(sisa)} (Telah disetor kembali ke Kas Kampus)
                  </div>
                );
              } else if (sisa < 0) {
                return (
                  <div className="bg-amber-100 border border-amber-300 text-amber-900 p-2 rounded text-xs font-semibold">
                    Klaim Kurang Bayar: {formatRupiah(Math.abs(sisa))} (Reimbursement)
                  </div>
                );
              }
              return (
                <div className="bg-slate-200 text-slate-800 p-2 rounded text-xs font-semibold">
                  Realisasi Biaya Nihil / Pas Sesuai Panjar
                </div>
              );
            })()}

            {selectedItemForTutupLpj?.surat_tugas?.file_lpj && (
              <div className="pt-2">
                <a
                  href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/${selectedItemForTutupLpj.surat_tugas.file_lpj}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-bold text-[var(--module-primary)] hover:underline"
                >
                  <Download size={16} />
                  <span>Lihat Berkas LPJ (PDF)</span>
                </a>
              </div>
            )}
          </div>

          <Input
            label="Catatan Verifikasi Keuangan"
            placeholder="Catatan penutupan kasbon dinas..."
            error={formTutupLpj.formState.errors.catatan?.message}
            {...formTutupLpj.register('catatan')}
          />

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalTutupLpjOpen(false)}
              disabled={formTutupLpj.formState.isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={formTutupLpj.formState.isSubmitting}
              disabled={formTutupLpj.formState.isSubmitting}
              className="flex items-center gap-2"
            >
              <Check size={16} />
              <span>Verifikasi & Selesaikan</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
