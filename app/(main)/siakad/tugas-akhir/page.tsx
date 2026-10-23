'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  GraduationCap,
  Plus,
  Filter,
  BookOpen,
  Calendar,
  Award,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { siakadService } from '@/services/siakad.service';
import {
  TAHAP_TA_OPTIONS,
  STATUS_TA_OPTIONS,
  TA_SORT_BY_OPTIONS,
  SORT_DIRECTION_OPTIONS,
} from '@/lib/constants/siakad.constant';
import {
  TugasAkhirBimbinganSchema,
  PenjadwalanSidangSchema,
  PenilaianSidangSchema,
  type TugasAkhirBimbinganFormValues,
  type PenjadwalanSidangFormValues,
  type PenilaianSidangFormValues,
} from '@/lib/validations/siakad-pipeline.schema';
import toast from 'react-hot-toast';

export default function TugasAkhirPortalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [taList, setTaList] = useState<any[]>([]);
  const [selectedTa, setSelectedTa] = useState<any | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [meta, setMeta] = useState<any | null>(null);

  // Filter Drawer State (Search terpusat di Drawer)
  const [search, setSearch] = useState('');
  const [filterTahap, setFilterTahap] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterSortBy, setFilterSortBy] = useState('judul_utama');
  const [filterSortOrder, setFilterSortOrder] = useState('asc');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Modals for actions
  const [openBimbinganModal, setOpenBimbinganModal] = useState(false);
  const [openSidangModal, setOpenSidangModal] = useState(false);
  const [openNilaiModal, setOpenNilaiModal] = useState(false);

  // Bimbingan & Sidang state
  const [bimbinganList, setBimbinganList] = useState<any[]>([]);
  const [bimbinganLoading, setBimbinganLoading] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(false);

  // React Hook Form: Bimbingan Logbook
  const {
    register: regBimb,
    handleSubmit: handleSubBimb,
    reset: resetBimbForm,
    formState: { errors: errorsBimb },
  } = useForm<TugasAkhirBimbinganFormValues>({
    resolver: zodResolver(TugasAkhirBimbinganSchema),
    defaultValues: {
      dosen_id: 1,
      tanggal: new Date().toISOString().split('T')[0],
      bab_pembahasan: '',
      uraian_konsultasi: '',
      arahan_revisi: '',
    },
  });

  // React Hook Form: Penjadwalan Sidang
  const {
    register: regSidang,
    handleSubmit: handleSubSidang,
    reset: resetSidangForm,
    control: ctrlSidang,
    formState: { errors: errorsSidang },
  } = useForm<PenjadwalanSidangFormValues>({
    resolver: zodResolver(PenjadwalanSidangSchema),
    defaultValues: {
      jenis_sidang: 'sidang_skripsi',
      tanggal_sidang: '',
      jam_mulai: '09:00',
      jam_selesai: '11:00',
      ruangan_nama_manual: 'Ruang Sidang Utama',
      penguji_1_id: 1,
      penguji_2_id: 2,
    },
  });

  // React Hook Form: Penilaian Sidang
  const {
    register: regNilai,
    handleSubmit: handleSubNilai,
    reset: resetNilaiForm,
    formState: { errors: errorsNilai },
  } = useForm<PenilaianSidangFormValues>({
    resolver: zodResolver(PenilaianSidangSchema),
    defaultValues: {
      skor_metodologi: 85,
      skor_materi_skripsi: 85,
      skor_presentasi: 85,
      skor_penguasaan_materi: 85,
      catatan_revisi: '',
    },
  });

  const loadTaList = useCallback(async () => {
    try {
      setLoading(true);
      const res = await siakadService.getTugasAkhirList({
        page,
        per_page: limit,
      });
      const rawData = res?.data;
      if (Array.isArray(rawData)) {
        setTaList(rawData);
      } else if (rawData?.items || rawData?.data) {
        setTaList(rawData.items || rawData.data);
      } else {
        setTaList([]);
      }
      setMeta(res?.meta || rawData?.meta || {
        page,
        limit,
        total: Array.isArray(rawData) ? rawData.length : 0,
        total_pages: Math.ceil((Array.isArray(rawData) ? rawData.length : 1) / limit),
      });
    } catch {
      toast.error('Gagal memuat data Tugas Akhir');
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    loadTaList();
  }, [loadTaList]);

  const loadBimbinganData = async (taId: number) => {
    try {
      setBimbinganLoading(true);
      const res = await siakadService.getTaBimbingan(taId);
      setBimbinganList(res?.data || []);
    } catch {
      toast.error('Gagal memuat kartu bimbingan');
    } finally {
      setBimbinganLoading(false);
    }
  };

  const onSubmitBimbingan = async (values: TugasAkhirBimbinganFormValues) => {
    if (!selectedTa) return;
    try {
      setSubmittingAction(true);
      const res = await siakadService.createTaBimbingan(selectedTa.id, values);
      toast.success(res?.message || 'Catatan bimbingan berhasil disimpan');
      resetBimbForm();
      loadBimbinganData(selectedTa.id);
      loadTaList();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menambahkan bimbingan');
    } finally {
      setSubmittingAction(false);
    }
  };

  const onSubmitSidang = async (values: PenjadwalanSidangFormValues) => {
    if (!selectedTa) return;
    try {
      setSubmittingAction(true);
      const payload = {
        jenis_sidang: values.jenis_sidang,
        tanggal_sidang: values.tanggal_sidang,
        jam_mulai: values.jam_mulai,
        jam_selesai: values.jam_selesai,
        ruangan_id: values.ruangan_id,
        ruangan_nama_manual: values.ruangan_nama_manual,
        ketua_sidang_id: values.ketua_sidang_id,
        sekretaris_sidang_id: values.sekretaris_sidang_id,
        penguji: [
          { dosen_id: values.penguji_1_id, peran_penguji: 'penguji_1' },
          { dosen_id: values.penguji_2_id, peran_penguji: 'penguji_2' },
        ],
      };
      const res = await siakadService.scheduleTaSidang(selectedTa.id, payload);
      toast.success(res?.message || 'Jadwal sidang berhasil ditetapkan');
      setOpenSidangModal(false);
      resetSidangForm();
      loadTaList();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menjadwalkan sidang');
    } finally {
      setSubmittingAction(false);
    }
  };

  const onSubmitNilai = async (values: PenilaianSidangFormValues) => {
    if (!selectedTa) return;
    try {
      setSubmittingAction(true);
      const sidangId = selectedTa.sidang_aktif?.id || selectedTa.id;
      const res = await siakadService.submitTaSidangNilai(sidangId, values);
      toast.success(res?.message || 'Nilai sidang berhasil disimpan');
      setOpenNilaiModal(false);
      resetNilaiForm();
      loadTaList();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan nilai sidang');
    } finally {
      setSubmittingAction(false);
    }
  };

  const openBimbinganView = (ta: any) => {
    setSelectedTa(ta);
    loadBimbinganData(ta.id);
    setOpenBimbinganModal(true);
  };

  const filteredTa = useMemo(() => {
    let list = [...taList];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.judul_utama?.toLowerCase().includes(q) ||
          t.mahasiswa?.nama_lengkap?.toLowerCase().includes(q) ||
          t.mahasiswa?.nim?.toLowerCase().includes(q) ||
          t.bidang_kajian?.toLowerCase().includes(q)
      );
    }
    if (filterTahap !== 'ALL') {
      list = list.filter((t) => t.tahap === filterTahap);
    }
    if (filterStatus !== 'ALL') {
      list = list.filter((t) => t.status === filterStatus);
    }

    list.sort((a, b) => {
      const titleA = String(a.judul_utama || '');
      const titleB = String(b.judul_utama || '');
      return filterSortOrder === 'asc' ? titleA.localeCompare(titleB) : titleB.localeCompare(titleA);
    });

    return list;
  }, [taList, search, filterTahap, filterStatus, filterSortOrder]);

  const columns: ColumnDef<any>[] = [
    {
      key: 'mahasiswa',
      label: 'MAHASISWA & PRODI',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">
            {row.mahasiswa?.nama_lengkap || row.nama_mahasiswa || 'Mahasiswa'}
          </span>
          <span className="font-mono text-2xs text-slate-500">
            {row.mahasiswa?.nim || '-'} • {row.program_studi?.nama || 'Prodi'}
          </span>
        </div>
      ),
    },
    {
      key: 'judul',
      label: 'JUDUL TUGAS AKHIR / SKRIPSI',
      render: (row) => (
        <div className="max-w-md">
          <span className="font-semibold text-slate-900 block text-xs line-clamp-2">
            {row.judul_utama}
          </span>
          <span className="text-2xs text-slate-500 block">
            Bidang: <strong>{row.bidang_kajian || '-'}</strong>
          </span>
        </div>
      ),
    },
    {
      key: 'pembimbing',
      label: 'PEMBIMBING 1 & 2',
      render: (row) => (
        <div className="text-2xs text-slate-700">
          <p className="font-medium">1. {row.dosen_pembimbing_1?.nama_lengkap || 'Belum diplot'}</p>
          <p className="text-slate-500">2. {row.dosen_pembimbing_2?.nama_lengkap || '-'}</p>
        </div>
      ),
    },
    {
      key: 'tahap',
      label: 'TAHAP & SESI',
      align: 'center',
      render: (row) => (
        <div>
          <Badge variant="blue" className="text-2xs uppercase">
            {String(row.tahap || 'proposal').replace(/_/g, ' ')}
          </Badge>
          <span className="text-2xs font-mono text-slate-500 block mt-0.5">
            {row.total_sesi_bimbingan ?? 0} Sesi Asistensi
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      align: 'center',
      render: (row) => {
        const s = row.status || 'draft';
        const variant =
          s === 'selesai' || s === 'disetujui_prodi'
            ? 'green'
            : s === 'ditolak'
            ? 'red'
            : s === 'siap_sidang'
            ? 'cyan'
            : 'amber';
        return (
          <Badge variant={variant} className="text-2xs uppercase font-semibold">
            {s.replace(/_/g, ' ')}
          </Badge>
        );
      },
    },
    {
      key: 'nilai',
      label: 'NILAI AKHIR',
      align: 'center',
      render: (row) => (
        <span className="font-mono font-bold text-xs">
          {row.nilai_angka_akhir ?? '-'} {row.nilai_huruf_akhir ? `(${row.nilai_huruf_akhir})` : ''}
        </span>
      ),
    },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <DropdownMenu
          items={[
            {
              label: 'Detail & Bimbingan TA',
              icon: <FileText size={14} />,
              onClick: () => router.push(`/siakad/tugas-akhir/${row.id}`),
            },
          ]}
        />
      ),
    },
  ];

  const bimbinganColumns: ColumnDef<any>[] = [
    {
      key: 'tanggal',
      label: 'TANGGAL & DOSEN',
      render: (row) => (
        <div>
          <span className="font-mono text-2xs text-slate-600 block">{row.tanggal}</span>
          <span className="text-2xs font-semibold text-slate-800">
            {row.dosen?.nama_lengkap || 'Dosen Pembimbing'}
          </span>
        </div>
      ),
    },
    {
      key: 'bab',
      label: 'BAB & KONSULTASI',
      render: (row) => (
        <div className="space-y-0.5">
          <span className="text-xs font-bold text-slate-900 block">{row.bab_pembahasan}</span>
          <span className="text-2xs text-slate-600 block">{row.uraian_konsultasi}</span>
          {row.arahan_revisi && (
            <span className="text-2xs text-amber-700 block">Arahan: {row.arahan_revisi}</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'STATUS ACC',
      align: 'center',
      render: (row) => {
        const v = row.status_validasi || 'menunggu';
        return (
          <Badge
            variant={v === 'acc' ? 'green' : v === 'revisi' ? 'red' : 'amber'}
            className="text-2xs uppercase font-semibold"
          >
            {v}
          </Badge>
        );
      },
    },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <DropdownMenu
          items={[
            {
              label: 'Validasi / ACC',
              icon: <CheckCircle2 size={14} />,
              onClick: async () => {
                if (!selectedTa?.id || !row.id) return;
                try {
                  await siakadService.verifyTaBimbingan(selectedTa.id, row.id, {
                    status_validasi: 'acc',
                  });
                  toast.success(`Asistensi bab ${row.bab_pembahasan} berhasil disetujui`);
                  loadBimbinganData(selectedTa.id);
                } catch (err: any) {
                  toast.error(err?.response?.data?.message || 'Gagal memvalidasi asistensi');
                }
              },
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Portal Tugas Akhir & Skripsi"
        description="Monitoring siklus Tugas Akhir: pengajuan judul proposal, kartu bimbingan asistensi, jadwal sidang, dan nilai komposit majelis penguji."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Tugas Akhir' },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setShowFilterDrawer(true)}
              className="text-xs font-bold border-[var(--module-primary)] text-[var(--module-primary)] hover:bg-[var(--module-primary-subtle)]"
            >
              Filter
            </Button>
            <Button
              variant="primary"
              icon={<Plus size={14} />}
              onClick={() => router.push('/siakad/tugas-akhir/create')}
              className="text-xs font-bold"
            >
              Ajukan Judul Skripsi
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader className="p-4 border-b border-slate-200">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Direktori Tugas Akhir Mahasiswa
            </h3>
            <p className="text-2xs text-slate-500">
              Total {filteredTa.length} skripsi mahasiswa dalam bimbingan atau siap sidang.
            </p>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <DataTable
            columns={columns}
            data={filteredTa}
            meta={meta}
            onPageChange={(p) => setPage(p)}
            isLoading={loading}
            emptyMessage="Belum ada data Tugas Akhir atau Skripsi yang tercatat."
          />
        </CardBody>
      </Card>

      {/* Filter Drawer */}
      <Drawer
        open={showFilterDrawer}
        onClose={() => setShowFilterDrawer(false)}
        title="Filter & Pencarian Tugas Akhir"
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Pencarian Skripsi / Mahasiswa"
            placeholder="Cari judul/NIM/nama..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Select
            label="Tahap Skripsi"
            options={TAHAP_TA_OPTIONS}
            value={filterTahap}
            onChange={(v) => setFilterTahap(String(v || 'ALL'))}
          />

          <Select
            label="Status Persetujuan"
            options={STATUS_TA_OPTIONS}
            value={filterStatus}
            onChange={(v) => setFilterStatus(String(v || 'ALL'))}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Urutkan"
              options={TA_SORT_BY_OPTIONS}
              value={filterSortBy}
              onChange={(v) => setFilterSortBy(String(v || 'judul_utama'))}
            />
            <Select
              label="Arah"
              options={SORT_DIRECTION_OPTIONS}
              value={filterSortOrder}
              onChange={(v) => setFilterSortOrder(String(v || 'asc'))}
            />
          </div>

          <Button
            variant="primary"
            onClick={() => setShowFilterDrawer(false)}
            className="mt-2"
          >
            Terapkan Filter
          </Button>
        </div>
      </Drawer>
    </div>
  );
}