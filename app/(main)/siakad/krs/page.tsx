'use client';

import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Lock,
  AlertTriangle,
  Search,
  Filter,
  ShieldCheck,
  UserCheck,
  BookOpen,
  Clock,
  MapPin,
  Eye,
  Plus,
  Trash2,
  Send,
  Printer,
  Sparkles,
  HelpCircle,
  Calendar,
  ChevronDown,
  Settings,
  Check,
  Save
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu, type DropdownMenuItem } from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { siakadService } from '@/services/siakad.service';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function KrsMahasiswaPage() {
  const { user } = useAuthStore();
  const userRoles = user?.roles?.map((r: any) => typeof r === 'string' ? r : r.slug) || [];
  const isMahasiswa = userRoles.includes('mahasiswa');
  const isDosen = userRoles.includes('dosen');
  const isAdmin = userRoles.includes('superadmin') || userRoles.includes('admin');

  const [krsList, setKrsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [selectedKrs, setSelectedKrs] = useState<any | null>(null);

  // Multi-period state
  const [tahunAkademiks, setTahunAkademiks] = useState<any[]>([]);
  const [selectedTaId, setSelectedTaId] = useState<number | null>(null);
  const [isManagePeriodModalOpen, setIsManagePeriodModalOpen] = useState(false);
  const [isNewPeriodOpen, setIsNewPeriodOpen] = useState(false);
  const [newPeriodForm, setNewPeriodForm] = useState({
    kode: '',
    nama: '',
    tahun_mulai: 2026,
    tahun_selesai: 2027,
    is_active: false,
  });
  const [settingActivePeriod, setSettingActivePeriod] = useState(false);

  // Student active KRS state
  const [studentKrsData, setStudentKrsData] = useState<any | null>(null);
  const [isPickerModalOpen, setIsPickerModalOpen] = useState(false);
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [submittingKrs, setSubmittingKrs] = useState(false);
  const [addingClassId, setAddingClassId] = useState<number | null>(null);

  // Print modal state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Penyetaraan Konversi States & Handlers (Moved from Profile Page)
  const [activeTab, setActiveTab] = useState<'krs' | 'konversi'>('krs');
  const [matakuliahs, setMatakuliahs] = useState<any[]>([]);
  const [konversiForm, setKonversiForm] = useState({
    kampus_asal: '',
    prodi_asal: '',
    catatan: '',
    details: [] as any[],
  });
  const [savingKonversi, setSavingKonversi] = useState(false);

  useEffect(() => {
    if (mhs?.konversi_transfer) {
      setKonversiForm({
        kampus_asal: mhs.konversi_transfer.kampus_asal || '',
        prodi_asal: mhs.konversi_transfer.prodi_asal || '',
        catatan: mhs.konversi_transfer.catatan || '',
        details: mhs.konversi_transfer.details || [],
      });
    }
  }, [studentKrsData]);

  useEffect(() => {
    if (isMahasiswa && activeTab === 'konversi') {
      const fetchMk = async () => {
        try {
          const res = await siakadService.getMataKuliahs({ per_page: 200 });
          if (res.data) setMatakuliahs(res.data);
        } catch (err) {}
      };
      fetchMk();
    }
  }, [activeTab, isMahasiswa]);

  const handleAddKonversiDetail = () => {
    setKonversiForm((prev) => ({
      ...prev,
      details: [
        ...prev.details,
        {
          mata_kuliah_diakui_id: matakuliahs[0]?.id || 1,
          kode_mk_asal: '',
          nama_mk_asal: '',
          sks_asal: 3,
          nilai_huruf_asal: 'A',
        },
      ],
    }));
  };

  const handleRemoveKonversiDetail = (idx: number) => {
    setKonversiForm((prev) => {
      const updated = [...prev.details];
      updated.splice(idx, 1);
      return { ...prev, details: updated };
    });
  };

  const handleKonversiDetailChange = (idx: number, field: string, value: any) => {
    setKonversiForm((prev) => {
      const updated = [...prev.details];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, details: updated };
    });
  };

  const handleSaveKonversi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mhs?.id) return;
    
    if (!konversiForm.kampus_asal || !konversiForm.prodi_asal) {
      toast.error('Kampus Asal dan Program Studi Asal wajib diisi');
      return;
    }
    if (konversiForm.details.length === 0) {
      toast.error('Minimal harus menginputkan 1 mata kuliah penyetaraan');
      return;
    }

    try {
      setSavingKonversi(true);
      const payload = {
        mahasiswa_id: mhs.id,
        kampus_asal: konversiForm.kampus_asal,
        prodi_asal: konversiForm.prodi_asal,
        catatan: konversiForm.catatan,
        status: 'draft', // saved as draft
        details: konversiForm.details.map((d: any) => ({
          mata_kuliah_diakui_id: Number(d.mata_kuliah_diakui_id),
          kode_mk_asal: d.kode_mk_asal,
          nama_mk_asal: d.nama_mk_asal,
          sks_asal: Number(d.sks_asal),
          nilai_huruf_asal: d.nilai_huruf_asal,
        })),
      };
      
      const res = await siakadService.createKonversi(payload);
      toast.success(res.message || 'Konversi transfer berhasil disimpan sebagai DRAFT');
      await fetchStudentActiveKrs(selectedTaId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal menyimpan konversi transfer');
    } finally {
      setSavingKonversi(false);
    }
  };

  const handleSubmitKonversi = async () => {
    if (!mhs?.konversi_id) return;
    if (!confirm('Kirim usulan konversi transfer Anda ke Dosen PA? Data tidak akan bisa diubah selama proses review.')) return;
    
    try {
      setSavingKonversi(true);
      const res = await siakadService.updateKonversiStatus(mhs.konversi_id, {
        status: 'diajukan',
        catatan: 'Diajukan oleh mahasiswa transfer untuk validasi PA.'
      });
      toast.success(res.message || 'Usulan konversi transfer berhasil diajukan');
      await fetchStudentActiveKrs(selectedTaId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal mengajukan konversi transfer');
    } finally {
      setSavingKonversi(false);
    }
  };

  const handleDeleteKonversi = async () => {
    if (!mhs?.konversi_id) return;
    if (!window.confirm('Apakah Anda yakin ingin menghapus data konversi transfer Anda?')) return;
    try {
      setSavingKonversi(true);
      await siakadService.deleteKonversi(mhs.konversi_id);
      toast.success('Konversi transfer berhasil dihapus');
      setKonversiForm({
        kampus_asal: '',
        prodi_asal: '',
        catatan: '',
        details: [],
      });
      await fetchStudentActiveKrs(selectedTaId);
    } catch (err: any) {
      toast.error('Gagal menghapus konversi transfer');
    } finally {
      setSavingKonversi(false);
    }
  };

  // Roles checked at top

  // Admin filter states & prodi
  const [prodiList, setProdiList] = useState<any[]>([]);
  const [filterProdi, setFilterProdi] = useState('');
  const [filterAngkatan, setFilterAngkatan] = useState('');
  const [filterSpp, setFilterSpp] = useState('');
  const [selectedKrsIds, setSelectedKrsIds] = useState<number[]>([]);
  const [isBulkApproving, setIsBulkApproving] = useState(false);

  const fetchTahunAkademiks = async () => {
    try {
      const res = await siakadService.getTahunAkademiks();
      if (res.data && res.data.length > 0) {
        setTahunAkademiks(res.data);
        const activeTa = res.data.find((t: any) => t.is_active) || res.data[0];
        if (!selectedTaId) {
          setSelectedTaId(activeTa.id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProdiList = async () => {
    try {
      const res = await siakadService.getProdi();
      if (res.data) setProdiList(res.data);
    } catch (err) {}
  };

  const fetchStudentActiveKrs = async (taId?: number | null) => {
    try {
      setLoading(true);
      const res = await siakadService.getActiveKrs(taId ? { tahun_akademik_id: taId } : undefined);
      if (res.data) {
        setStudentKrsData(res.data);
      }
    } catch (err: any) {
      toast.error('Gagal memuat data KRS mahasiswa');
    } finally {
      setLoading(false);
    }
  };

  const fetchKrsList = async () => {
    try {
      setLoading(true);
      const res = await siakadService.getKrs({
        search,
        status: filterStatus || undefined,
        program_studi_id: filterProdi || undefined,
        angkatan: filterAngkatan || undefined,
        status_spp: filterSpp || undefined,
        tahun_akademik_id: selectedTaId || undefined,
        advisees_only: isDosen && !isAdmin ? true : undefined,
      });
      if (res.data) {
        setKrsList(res.data);
        setSelectedKrsIds([]);
      }
    } catch (err: any) {
      toast.error('Gagal memuat daftar KRS');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTahunAkademiks();
    fetchProdiList();
  }, []);

  useEffect(() => {
    if (isMahasiswa) {
      fetchStudentActiveKrs(selectedTaId);
    } else {
      fetchKrsList();
    }
  }, [search, filterStatus, filterProdi, filterAngkatan, filterSpp, selectedTaId, isMahasiswa]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const pendingIds = krsList.filter((k) => k.status !== 'disetujui' && !k.locked_by_keuangan).map((k) => k.id);
      setSelectedKrsIds(pendingIds);
    } else {
      setSelectedKrsIds([]);
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedKrsIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkApprove = async () => {
    if (selectedKrsIds.length === 0) return;
    try {
      setIsBulkApproving(true);
      const res = await siakadService.bulkApproveKrs(selectedKrsIds);
      toast.success(res.message || 'KRS terpilih berhasil disetujui');
      fetchKrsList();
      setSelectedKrsIds([]);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal menyetujui KRS secara massal');
    } finally {
      setIsBulkApproving(false);
    }
  };

  const openClassPicker = async () => {
    setIsPickerModalOpen(true);
    try {
      setLoadingClasses(true);
      const res = await siakadService.getAvailableClasses(selectedTaId ? { tahun_akademik_id: selectedTaId } : undefined);
      if (res.data) setAvailableClasses(res.data);
    } catch (err: any) {
      toast.error('Gagal memuat daftar mata kuliah yang dibuka');
    } finally {
      setLoadingClasses(false);
    }
  };

  const handleAddClass = async (kelasId: number) => {
    try {
      setAddingClassId(kelasId);
      const res = await siakadService.addClassToKrs({
        kelas_id: kelasId,
        tahun_akademik_id: selectedTaId || undefined
      });
      toast.success(res.message || 'Mata kuliah berhasil ditambahkan ke KRS');
      await fetchStudentActiveKrs(selectedTaId);
      setAvailableClasses((prev) =>
        prev.map((c) => (c.id === kelasId ? { ...c, is_enrolled: true, can_take: false } : c))
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal menambahkan mata kuliah');
    } finally {
      setAddingClassId(null);
    }
  };

  const handleDropClass = async (detailId: number) => {
    if (!confirm('Yakin ingin menghapus/drop mata kuliah ini dari rencana studi Anda?')) return;
    try {
      const res = await siakadService.dropClassFromKrs(detailId);
      toast.success(res.message || 'Mata kuliah berhasil dihapus dari KRS');
      await fetchStudentActiveKrs(selectedTaId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal menghapus mata kuliah');
    }
  };

  const handleSubmitKrs = async () => {
    try {
      setSubmittingKrs(true);
      const res = await siakadService.submitKrs(selectedTaId ? { tahun_akademik_id: selectedTaId } : undefined);
      toast.success(res.message || 'KRS berhasil diajukan ke Dosen Wali');
      fetchStudentActiveKrs(selectedTaId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal mengajukan KRS');
    } finally {
      setSubmittingKrs(false);
    }
  };

  const handleReopenKrs = async () => {
    try {
      const res = await siakadService.reopenKrs(selectedTaId ? { tahun_akademik_id: selectedTaId } : undefined);
      toast.success(res.message || 'KRS telah dibuka kembali untuk revisi');
      fetchStudentActiveKrs(selectedTaId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal membuka kembali KRS');
    }
  };

  const handleApprove = async (id: number) => {
    try {
      setApprovingId(id);
      const res = await siakadService.approveKrs(id);
      toast.success(res.message || 'KRS berhasil disetujui');
      fetchKrsList();
      if (selectedKrs?.id === id) {
        setSelectedKrs((prev: any) => ({ ...prev, status: 'disetujui' }));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal menyetujui KRS');
    } finally {
      setApprovingId(null);
    }
  };

  const mhs = studentKrsData?.mahasiswa;
  const activeKrs = studentKrsData?.krs;
  const isTransferStudent = mhs?.jenis_pendaftaran === 'Peserta Didik Pindahan' || Boolean(mhs?.konversi_transfer);
  const selectedTaObj = tahunAkademiks.find((t) => t.id === selectedTaId);

  const columns: ColumnDef<any>[] = [
    {
      key: 'select',
      label: '',
      align: 'center',
      headerRender: () => (
        <input
          type="checkbox"
          onChange={handleSelectAll}
          checked={
            selectedKrsIds.length > 0 &&
            selectedKrsIds.length === krsList.filter((k) => k.status !== 'disetujui' && !k.locked_by_keuangan).length
          }
          className="rounded border-slate-300 text-primary-600 focus:ring-0 cursor-pointer"
        />
      ),
      render: (row) => {
        const isSelected = selectedKrsIds.includes(row.id);
        const canSelect = row.status !== 'disetujui' && !row.locked_by_keuangan;
        return (
          <input
            type="checkbox"
            checked={isSelected}
            disabled={!canSelect}
            onChange={() => handleToggleSelect(row.id)}
            className="rounded border-slate-300 text-primary-600 focus:ring-0 cursor-pointer disabled:opacity-40"
          />
        );
      },
    },
    {
      key: 'mahasiswa',
      label: 'NIM & MAHASISWA',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block">{row.mahasiswa?.nama_lengkap}</span>
          <span className="font-mono text-2xs text-slate-400">{row.mahasiswa?.nim}</span>
        </div>
      ),
    },
    {
      key: 'program_studi',
      label: 'PROGRAM STUDI / ANGKATAN',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-800">{row.mahasiswa?.program_studi?.nama || '-'}</span>
          <span className="text-2xs text-slate-400 block font-mono">Angkatan {row.mahasiswa?.angkatan || 2023}</span>
        </div>
      ),
    },
    {
      key: 'dosen_wali',
      label: 'DOSEN WALI',
      render: (row) => (
        <span className="text-slate-700 text-xs">{row.mahasiswa?.dosen_wali?.nama_lengkap || '-'}</span>
      ),
    },
    {
      key: 'total_sks',
      label: 'TOTAL SKS',
      align: 'center',
      render: (row) => (
        <span className="font-black tabular-nums text-slate-900 text-sm">
          {row.total_sks_diambil} SKS
        </span>
      ),
    },
    {
      key: 'status_keuangan',
      label: 'STATUS KEUANGAN',
      render: (row) =>
        row.locked_by_keuangan ? (
          <Badge variant="red" className="inline-flex items-center gap-1">
            <Lock size={11} /> Belum Lunas SPP
          </Badge>
        ) : (
          <Badge variant="green" className="inline-flex items-center gap-1">
            <CheckCircle2 size={11} /> Lunas SPP (SIKEU)
          </Badge>
        ),
    },
    {
      key: 'status',
      label: 'STATUS KRS',
      render: (row) => {
        const variant =
          row.status === 'disetujui'
            ? 'green'
            : row.status === 'diajukan'
            ? 'amber'
            : 'gray';
        return <Badge variant={variant as any}>{row.status?.toUpperCase()}</Badge>;
      },
    },
    {
      key: 'actions',
      label: 'AKSI',
      align: 'right',
      render: (row) => {
        const items: DropdownMenuItem[] = [
          {
            label: 'Detail Rencana Studi',
            icon: <Eye size={14} />,
            onClick: () => {
              setSelectedKrs(row);
            },
          },
        ];

        if (row.status !== 'disetujui' && !row.locked_by_keuangan) {
          items.push({
            label: 'Setujui KRS',
            icon: <CheckCircle2 size={14} />,
            onClick: () => {
              handleApprove(row.id);
            },
          });
        }

        return <DropdownMenu items={items} />;
      },
    },
  ];

  const studentKrsColumns: ColumnDef<any>[] = [
    {
      key: 'kode_mk',
      label: 'KODE MK',
      render: (row) => (
        <span className="font-mono font-bold text-slate-900">
          {row.kelas?.mata_kuliah?.kode_mk || '-'}
        </span>
      ),
    },
    {
      key: 'mata_kuliah',
      label: 'MATA KULIAH & KELAS',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block">{row.kelas?.mata_kuliah?.nama}</span>
          <span className="text-2xs text-slate-400">Kelas {row.kelas?.nama_kelas}</span>
        </div>
      ),
    },
    {
      key: 'sks',
      label: 'SKS',
      align: 'center',
      render: (row) => (
        <span className="font-bold text-slate-900 font-mono">
          {row.kelas?.mata_kuliah?.total_sks || 3} SKS
        </span>
      ),
    },
    {
      key: 'dosen',
      label: 'DOSEN PENGAMPU',
      render: (row) => (
        <span className="font-medium text-slate-700 text-xs">
          {row.kelas?.dosen_pengampu?.[0]?.dosen?.nama_lengkap || 'Dosen Pengampu'}
        </span>
      ),
    },
    {
      key: 'jadwal',
      label: 'JADWAL & WAKTU',
      render: (row) => (
        <span className="font-bold text-slate-800 capitalize flex items-center gap-1 text-2xs">
          <Clock size={12} className="text-primary-600 shrink-0" />
          {row.kelas?.hari ? `${row.kelas.hari}, ${row.kelas.jam_mulai?.slice(0, 5)} - ${row.kelas.jam_selesai?.slice(0, 5)}` : '-'}
        </span>
      ),
    },
    {
      key: 'ruangan',
      label: 'RUANGAN (SINAPRA)',
      render: (row) => (
        <Badge variant="blue" className="text-2xs font-bold inline-flex items-center gap-1">
          <MapPin size={10} /> {row.kelas?.ruangan?.nama || 'Ruang Kuliah'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <Button
          variant="outline"
          icon={<Trash2 size={13} className="text-rose-600" />}
          className="text-2xs py-1 px-2.5 h-auto hover:bg-rose-50 font-bold text-rose-700 border-rose-200"
          onClick={() => handleDropClass(row.id)}
          disabled={activeKrs?.status === 'disetujui'}
          title={activeKrs?.status === 'disetujui' ? 'KRS sudah disetujui, tidak dapat dibatalkan' : 'Batalkan mata kuliah ini'}
        >
          Drop
        </Button>
      ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Konten Halaman Utama (disembunyikan saat mencetak) */}
      <div className="space-y-6 print:hidden">
        <PageHeader
          title={
            isMahasiswa
              ? 'Kartu Rencana Studi (KRS) Mahasiswa'
              : isDosen
              ? 'Bimbingan Akademik & Approval KRS'
              : 'Manajemen KRS Mahasiswa Universitas'
          }
          description={
            isMahasiswa
              ? 'Pilih mata kuliah semester, sesuaikan beban SKS, dan ajukan persetujuan ke Dosen Pembimbing Akademik.'
              : 'Persetujuan rencana studi semester mahasiswa bimbingan wali.'
          }
          breadcrumbs={[
            { label: 'Portal SSO', href: '/dashboard' },
            { label: 'SIAKAD', href: '/siakad' },
            { label: 'Rencana Studi (KRS)' },
          ]}
          action={
            <div className="flex items-center gap-2.5 flex-wrap justify-start md:justify-end">
              {/* Dropdown Periode Akademik */}
              <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
                <Calendar size={14} className="text-primary-600 shrink-0" />
                <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">Periode:</span>
                <select
                  value={selectedTaId || ''}
                  onChange={(e) => setSelectedTaId(Number(e.target.value))}
                  className="text-xs font-bold text-slate-900 bg-transparent outline-none cursor-pointer pr-1"
                >
                  {(isMahasiswa && studentKrsData?.mahasiswa?.angkatan
                    ? tahunAkademiks.filter((ta) => {
                        const startYear = ta.tahun_mulai || Number(String(ta.kode).slice(0, 4));
                        return startYear >= Number(studentKrsData.mahasiswa.angkatan) || ta.is_active;
                      })
                    : tahunAkademiks
                  ).map((ta) => (
                    <option key={ta.id} value={ta.id}>
                      {ta.nama} {ta.is_active ? '★ (Aktif)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Button for Admin & Dosen */}
              {!isMahasiswa && (
                <Button
                  variant="outline"
                  icon={<Filter size={15} />}
                  className="font-bold min-h-[38px] text-xs"
                  onClick={() => setShowFilter(true)}
                >
                  Filter
                </Button>
              )}

              {/* Admin Kelola / Aktifkan Periode Button */}
              {isAdmin && (
                <Button
                  variant="outline"
                  icon={<Settings size={14} className="text-slate-700" />}
                  className="font-bold text-xs py-2 px-3 h-auto border-slate-300 hover:bg-slate-50 text-slate-800"
                  onClick={() => setIsManagePeriodModalOpen(true)}
                  title="Kelola & Aktifkan Periode Semester"
                >
                  Kelola Periode
                </Button>
              )}

              {/* Mahasiswa Action Buttons */}
              {isMahasiswa && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    icon={<Plus size={15} />}
                    className="font-bold min-h-[38px] text-xs shadow-xs"
                    onClick={openClassPicker}
                  >
                    Ambil Mata Kuliah
                  </Button>

                  {activeKrs?.status === 'draft' ? (
                    <Button
                      variant="outline"
                      icon={<Send size={14} className="text-primary-600" />}
                      className="font-bold text-xs min-h-[38px] border-primary-300 text-primary-700 hover:bg-primary-50"
                      onClick={handleSubmitKrs}
                      disabled={submittingKrs || (activeKrs?.krs_details?.length || 0) === 0 || activeKrs?.locked_by_keuangan}
                    >
                      {submittingKrs ? 'Mengajukan...' : 'Ajukan ke Dosen Wali'}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="font-bold min-h-[38px] text-xs text-amber-700 hover:bg-amber-50 border-amber-300"
                      onClick={handleReopenKrs}
                    >
                      Revisi / Ubah Rencana Studi
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    icon={<Printer size={15} />}
                    className="font-bold min-h-[38px] text-xs"
                    onClick={() => setIsPrintModalOpen(true)}
                    disabled={!activeKrs || activeKrs.krs_details?.length === 0}
                  >
                    Cetak KRS
                  </Button>
                </div>
              )}
            </div>
          }
        />

      {/* ======================================================== */}
      {/* KHUSUS TAMPILAN MAHASISWA & MAHASISWA TRANSFER */}
      {/* ======================================================== */}
      {isMahasiswa && (
        <div className="space-y-5">
          {/* Banner Profil Akademik & Status Keuangan */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 text-white shadow-md space-y-4">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full text-white">
                    Semester Terpilih: {activeKrs?.tahun_akademik?.nama || selectedTaObj?.nama || '2026/2027 Ganjil'}
                  </span>
                  {isTransferStudent && (
                    <span className="badge bg-amber-400 text-slate-950 font-black text-2xs uppercase tracking-wider">
                      Mahasiswa Transfer / Pindahan
                    </span>
                  )}
                </div>
                <h2 className="text-xl md:text-2xl font-black mt-2.5 text-white" style={{ color: '#ffffff' }}>
                  {mhs?.nama_lengkap || user?.username}
                </h2>
                <p className="text-xs text-slate-300 font-mono mt-0.5" style={{ color: '#e2e8f0' }}>
                  NIM: {mhs?.nim || '2301001001'} • {mhs?.program_studi?.nama || 'S1 Teknik Informatika'} ({mhs?.program_studi?.jenjang || 'S1'})
                </p>
                <p className="text-2xs text-slate-300 mt-2 flex items-center gap-1.5 font-medium" style={{ color: '#e2e8f0' }}>
                  <UserCheck size={14} className="text-primary-400" />
                  Dosen Wali: <strong className="text-white" style={{ color: '#ffffff' }}>{mhs?.dosen_wali?.nama_lengkap || 'Dr. Ir. Ahmad Santoso, M.Kom'}</strong>
                </p>
              </div>

              <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-xs border border-white/10 shrink-0">
                <div className="text-center">
                  <span className="text-2xs text-slate-300 block font-semibold" style={{ color: '#e2e8f0' }}>Total SKS Diambil</span>
                  <span className="text-2xl font-black text-white" style={{ color: '#ffffff' }}>{activeKrs?.total_sks_diambil || 0}</span>
                  <span className="text-2xs text-slate-400 block font-mono" style={{ color: '#94a3b8' }}>Batas: 24 SKS</span>
                </div>
                <div className="h-10 w-px bg-white/20" />
                <div className="text-center">
                  <span className="text-2xs text-slate-300 block font-semibold" style={{ color: '#e2e8f0' }}>Status SPP (SIKEU)</span>
                  {activeKrs?.locked_by_keuangan ? (
                    <span className="badge badge-red text-xs font-bold mt-1 inline-flex items-center gap-1">
                      <Lock size={11} /> Belum Lunas
                    </span>
                  ) : (
                    <span className="badge badge-green text-xs font-bold mt-1 inline-flex items-center gap-1">
                      <CheckCircle2 size={11} /> Lunas SPP
                    </span>
                  )}
                </div>
                <div className="h-10 w-px bg-white/20" />
                <div className="text-center">
                  <span className="text-2xs text-slate-300 block font-semibold" style={{ color: '#e2e8f0' }}>Status KRS</span>
                  <span className={`badge text-xs font-bold mt-1 uppercase ${
                    activeKrs?.status === 'disetujui' ? 'badge-green' : activeKrs?.status === 'diajukan' ? 'badge-yellow' : 'badge-slate'
                  }`}>
                    {activeKrs?.status || 'DRAFT'}
                  </span>
                </div>
              </div>
            </div>

            {/* Khusus Mahasiswa Transfer: Info Penyetaraan */}
            {isTransferStudent && (
              <div className="bg-amber-500/10 border border-amber-400/30 rounded-xl p-3.5 flex items-center justify-between text-xs text-amber-200">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-400 shrink-0" />
                  <span>
                    Anda memiliki <strong>{mhs.konversi_transfer?.details?.length || 2} mata kuliah konversi</strong> yang telah diakui dari kampus asal ({mhs.konversi_transfer?.kampus_asal}). Sistem otomatis menandai mata kuliah tersebut agar tidak terambil ganda.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Tabs for Transfer Student */}
          {isTransferStudent && (
            <div className="flex border-b border-slate-200/90 mt-2">
              <button
                type="button"
                className={`py-3 px-6 font-bold text-xs uppercase tracking-wider border-b-2 transition ${
                  activeTab === 'krs'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
                onClick={() => setActiveTab('krs')}
              >
                Rencana Studi (KRS)
              </button>
              <button
                type="button"
                className={`py-3 px-6 font-bold text-xs uppercase tracking-wider border-b-2 transition ${
                  activeTab === 'konversi'
                    ? 'border-amber-600 text-amber-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
                onClick={() => setActiveTab('konversi')}
              >
                Penyetaraan Konversi
              </button>
            </div>
          )}

          {activeTab === 'krs' ? (
            /* Daftar Mata Kuliah yang Diambil (Full-Bleed DataTable) */
            <div className="space-y-4">
              <DataTable
                columns={studentKrsColumns}
                data={activeKrs?.krs_details || []}
                isLoading={loading}
                emptyMessage={
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-3 py-6">
                    <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center">
                      <BookOpen size={24} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">Rencana Studi Masih Kosong</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Anda belum memilih mata kuliah untuk periode <strong>{selectedTaObj?.nama || 'semester ini'}</strong>. Gunakan tombol di kanan atas untuk mengambil kelas.
                      </p>
                    </div>
                  </div>
                }
              />

              {/* Total Footer Ringkasan Beban SKS */}
              {activeKrs?.krs_details?.length > 0 && (
                <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex items-center justify-between flex-wrap gap-3 text-xs">
                  <span className="text-slate-600 font-medium">
                    Jumlah Mata Kuliah Terpilih: <strong className="text-slate-900">{activeKrs.krs_details.length} Kelas</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 font-medium">Total Beban Studi:</span>
                    <span className="font-mono font-black text-sm text-primary-700 bg-primary-50 px-3 py-1 rounded-lg border border-primary-200">
                      {activeKrs.total_sks_diambil || 0} / 24 SKS
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Penyetaraan Konversi Form (tab === 'konversi') */
            <div className="card p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Sparkles className="text-amber-500" size={18} />
                    Penyetaraan Nilai Konversi (Mahasiswa Pindahan)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Mapping mata kuliah asal ke mata kuliah kurikulum lokal kampus saat ini.
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  {mhs?.konversi_transfer?.status && (
                    <span className={`badge text-2xs font-black uppercase ${
                      mhs.konversi_transfer.status === 'disetujui' ? 'badge-green' : mhs.konversi_transfer.status === 'diajukan' ? 'badge-yellow' : mhs.konversi_transfer.status === 'ditolak' ? 'badge-red' : 'badge-slate'
                    }`}>
                      Status: {mhs.konversi_transfer.status}
                    </span>
                  )}
                  {mhs?.konversi_id && mhs?.konversi_transfer?.status === 'draft' && (
                    <Button
                      variant="danger"
                      size="sm"
                      icon={<Trash2 size={13} />}
                      className="font-bold text-xs h-auto py-1 px-3 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100"
                      onClick={handleDeleteKonversi}
                      disabled={savingKonversi}
                      type="button"
                    >
                      Hapus Konversi
                    </Button>
                  )}
                </div>
              </div>

              {/* Status Notice */}
              {mhs?.konversi_transfer?.status === 'diajukan' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-xs text-yellow-800 flex items-start gap-2.5">
                  <Clock size={16} className="mt-0.5 shrink-0 text-yellow-600" />
                  <div>
                    <strong className="font-bold block">Usulan Sedang Ditinjau</strong>
                    Usulan konversi transfer Anda telah diajukan ke Dosen PA. Perubahan data dikunci selama masa review.
                  </div>
                </div>
              )}

              {mhs?.konversi_transfer?.status === 'disetujui' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-800 flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                  <div>
                    <strong className="font-bold block">Usulan Disetujui</strong>
                    Usulan konversi Anda telah disetujui oleh Dosen PA. Mata kuliah yang diakui secara otomatis lulus dan tidak perlu diambil kembali di KRS.
                  </div>
                </div>
              )}

              {mhs?.konversi_transfer?.status === 'ditolak' && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-800 flex items-start gap-2.5">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-rose-600" />
                  <div>
                    <strong className="font-bold block">Usulan Ditolak</strong>
                    Catatan Dosen PA: <strong>{mhs.konversi_transfer.catatan || '-'}</strong>. Silakan perbaiki data di bawah dan simpan/ajukan kembali.
                  </div>
                </div>
              )}

              <form onSubmit={handleSaveKonversi} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Perguruan Tinggi Asal *"
                    placeholder="Contoh: Universitas Gadjah Mada"
                    value={konversiForm.kampus_asal}
                    onChange={(e) => setKonversiForm({ ...konversiForm, kampus_asal: e.target.value })}
                    required
                    disabled={mhs?.konversi_transfer?.status === 'diajukan' || mhs?.konversi_transfer?.status === 'disetujui'}
                  />
                  <Input
                    label="Program Studi Asal *"
                    placeholder="Contoh: S1 Teknik Informatika"
                    value={konversiForm.prodi_asal}
                    onChange={(e) => setKonversiForm({ ...konversiForm, prodi_asal: e.target.value })}
                    required
                    disabled={mhs?.konversi_transfer?.status === 'diajukan' || mhs?.konversi_transfer?.status === 'disetujui'}
                  />
                  <div className="md:col-span-2">
                    <label className="label font-bold text-slate-700">Catatan Tambahan (Opsional)</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Diakui sebanyak 10 mata kuliah..."
                      value={konversiForm.catatan}
                      onChange={(e) => setKonversiForm({ ...konversiForm, catatan: e.target.value })}
                      className="textarea w-full text-xs font-bold"
                      disabled={mhs?.konversi_transfer?.status === 'diajukan' || mhs?.konversi_transfer?.status === 'disetujui'}
                    />
                  </div>
                </div>

                {/* Converted Course List */}
                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Mata Kuliah Yang Diakui</h4>
                    {!(mhs?.konversi_transfer?.status === 'diajukan' || mhs?.konversi_transfer?.status === 'disetujui') && (
                      <button
                        type="button"
                        onClick={handleAddKonversiDetail}
                        className="text-xs font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 py-1 px-3 rounded-lg flex items-center gap-1.5 cursor-pointer transition"
                      >
                        <Plus size={14} /> Tambah Baris Mata Kuliah
                      </button>
                    )}
                  </div>

                  {konversiForm.details.length === 0 ? (
                    <p className="text-xs text-center py-6 text-slate-400 italic">Belum ada mata kuliah yang disetarakan. Klik tombol di atas untuk menambah.</p>
                  ) : (
                    <div className="space-y-4">
                      {konversiForm.details.map((detail: any, idx: number) => (
                        <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 relative shadow-2xs">
                          {!(mhs?.konversi_transfer?.status === 'diajukan' || mhs?.konversi_transfer?.status === 'disetujui') && (
                            <button
                              type="button"
                              onClick={() => handleRemoveKonversiDetail(idx)}
                              className="absolute right-3 top-3 text-rose-600 hover:text-rose-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 size={12} /> Hapus Baris
                            </button>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-20">
                            <Input
                              label="Kode MK Asal *"
                              placeholder="e.g. INF-101"
                              value={detail.kode_mk_asal}
                              onChange={(e) => handleKonversiDetailChange(idx, 'kode_mk_asal', e.target.value)}
                              required
                              disabled={mhs?.konversi_transfer?.status === 'diajukan' || mhs?.konversi_transfer?.status === 'disetujui'}
                            />
                            <Input
                              label="Nama MK Asal *"
                              placeholder="e.g. Pemrograman Dasar"
                              value={detail.nama_mk_asal}
                              onChange={(e) => handleKonversiDetailChange(idx, 'nama_mk_asal', e.target.value)}
                              required
                              disabled={mhs?.konversi_transfer?.status === 'diajukan' || mhs?.konversi_transfer?.status === 'disetujui'}
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <Input
                              label="SKS Asal *"
                              type="number"
                              min="1"
                              value={detail.sks_asal}
                              onChange={(e) => handleKonversiDetailChange(idx, 'sks_asal', parseInt(e.target.value) || 0)}
                              required
                              disabled={mhs?.konversi_transfer?.status === 'diajukan' || mhs?.konversi_transfer?.status === 'disetujui'}
                            />
                            <Input
                              label="Nilai Huruf Asal *"
                              placeholder="e.g. A, B+, C"
                              value={detail.nilai_huruf_asal}
                              onChange={(e) => handleKonversiDetailChange(idx, 'nilai_huruf_asal', e.target.value)}
                              required
                              disabled={mhs?.konversi_transfer?.status === 'diajukan' || mhs?.konversi_transfer?.status === 'disetujui'}
                            />
                            <div>
                              <label className="label font-bold text-slate-700">Disetarakan Ke MK Lokal *</label>
                              <select
                                value={detail.mata_kuliah_diakui_id}
                                onChange={(e) => handleKonversiDetailChange(idx, 'mata_kuliah_diakui_id', parseInt(e.target.value))}
                                className="select w-full text-xs font-bold bg-white"
                                disabled={mhs?.konversi_transfer?.status === 'diajukan' || mhs?.konversi_transfer?.status === 'disetujui'}
                              >
                                {matakuliahs.map((mk) => (
                                  <option key={mk.id} value={mk.id}>
                                    {mk.kode_mk} - {mk.nama} ({mk.total_sks} SKS)
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  {mhs?.konversi_id && (mhs?.konversi_transfer?.status === 'draft' || mhs?.konversi_transfer?.status === 'ditolak') && (
                    <Button
                      type="button"
                      variant="outline"
                      className="font-bold text-xs"
                      onClick={handleSubmitKonversi}
                      disabled={savingKonversi}
                    >
                      <Send size={14} /> Ajukan Penyetaraan ke Dosen PA
                    </Button>
                  )}
                  {!(mhs?.konversi_transfer?.status === 'diajukan' || mhs?.konversi_transfer?.status === 'disetujui') && (
                    <Button
                      type="submit"
                      variant="primary"
                      className="font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white border-amber-600"
                      disabled={savingKonversi}
                    >
                      <Save size={14} /> Simpan Draft Penyetaraan
                    </Button>
                  )}
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL PEMILIHAN MATA KULIAH (COURSE PICKER) */}
      {/* ======================================================== */}
      {isPickerModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="badge badge-blue text-2xs font-bold mb-1 inline-block">
                  Katalog Pemilihan Kelas • {selectedTaObj?.nama}
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  Pilih Mata Kuliah Rencana Studi
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Klik tombol <strong>"Ambil Kelas"</strong> untuk mendaftarkan mata kuliah ke dalam draf KRS Anda.
                </p>
              </div>
              <Button
                variant="outline"
                className="text-xs"
                onClick={() => setIsPickerModalOpen(false)}
              >
                Selesai / Tutup
              </Button>
            </div>

            {/* Filter Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Cari nama mata kuliah, kode, atau dosen pengampu..."
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-primary-500 transition outline-none"
              />
            </div>

            {/* List Available Classes */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">KODE MK</th>
                    <th className="py-2.5 px-3">MATA KULIAH & KELAS</th>
                    <th className="py-2.5 px-3 text-center">SKS</th>
                    <th className="py-2.5 px-3">JADWAL & RUANG</th>
                    <th className="py-2.5 px-3">DOSEN PENGAMPU</th>
                    <th className="py-2.5 px-3 text-center">SISA KUOTA</th>
                    <th className="py-2.5 px-3 text-right">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {loadingClasses ? (
                    <tr><td colSpan={7} className="py-8 text-center text-slate-400">Memuat katalog kelas...</td></tr>
                  ) : availableClasses.length === 0 ? (
                    <tr><td colSpan={7} className="py-8 text-center text-slate-400">Tidak ada kelas yang dibuka pada periode ini</td></tr>
                  ) : (
                    availableClasses
                      .filter((c) =>
                        c.mata_kuliah?.nama?.toLowerCase().includes(pickerSearch.toLowerCase()) ||
                        c.mata_kuliah?.kode_mk?.toLowerCase().includes(pickerSearch.toLowerCase()) ||
                        c.dosen_pengampu?.toLowerCase().includes(pickerSearch.toLowerCase())
                      )
                      .map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">{c.mata_kuliah?.kode_mk}</td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-900">{c.mata_kuliah?.nama}</span>
                            <span className="text-2xs text-slate-400 block font-normal">
                              Kelas {c.nama_kelas} • Semester {c.mata_kuliah?.semester_anjuran}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-bold">{c.mata_kuliah?.total_sks} SKS</td>
                          <td className="py-3 px-3 text-2xs text-slate-600">
                            <span className="font-bold text-slate-800 capitalize block">
                              {c.jadwal}
                            </span>
                            <span className="text-slate-400 font-medium">{c.ruangan}</span>
                          </td>
                          <td className="py-3 px-3 text-slate-700 text-2xs font-medium">
                            {c.dosen_pengampu || '-'}
                          </td>
                          <td className="py-3 px-3 text-center font-bold tabular-nums">
                            <span className={c.sisa_kuota <= 5 ? 'text-rose-600' : 'text-slate-800'}>
                              {c.sisa_kuota} kursi
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            {c.is_converted ? (
                              <span className="badge bg-amber-100 text-amber-800 font-bold text-2xs">
                                Sudah Dikonversi (Transfer)
                              </span>
                            ) : c.is_enrolled ? (
                              <span className="badge badge-green font-bold text-2xs inline-flex items-center gap-1">
                                <CheckCircle2 size={11} /> Sudah Diambil
                              </span>
                            ) : c.sisa_kuota <= 0 ? (
                              <span className="badge badge-red font-bold text-2xs">Penuh</span>
                            ) : (
                              <Button
                                variant="primary"
                                icon={<Plus size={13} />}
                                className="text-2xs py-1 px-3 h-auto font-bold"
                                onClick={() => handleAddClass(c.id)}
                                disabled={addingClassId === c.id}
                              >
                                {addingClassId === c.id ? 'Menyimpan...' : 'Ambil Kelas'}
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAMPILAN ADMIN & DOSEN WALI (TABEL REVIEW & APPROVAL KRS) */}
      {/* ======================================================== */}
      {!isMahasiswa && (
        <div className="space-y-4">
          {/* Bulk Action Toolbar */}
          {selectedKrsIds.length > 0 && (
            <div className="bg-primary-50 border border-primary-200 rounded-xl p-3.5 flex items-center justify-between flex-wrap gap-3 animate-fade-in">
              <div className="flex items-center gap-2">
                <Badge variant="purple" className="font-black text-xs">
                  {selectedKrsIds.length} KRS Terpilih
                </Badge>
                <span className="text-xs text-primary-900 font-semibold">
                  Siap untuk diverifikasi dan disetujui secara bersamaan.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="text-xs py-1 px-3 h-auto"
                  onClick={() => setSelectedKrsIds([])}
                >
                  Batalkan Pilihan
                </Button>
                <Button
                  variant="primary"
                  icon={<CheckCircle2 size={14} />}
                  className="text-xs py-1.5 px-4 h-auto font-bold shadow-xs"
                  onClick={handleBulkApprove}
                  disabled={isBulkApproving}
                >
                  {isBulkApproving ? 'Memproses...' : `Setujui (${selectedKrsIds.length}) KRS Sekaligus`}
                </Button>
              </div>
            </div>
          )}

          {/* Full-bleed DataTable */}
          <DataTable
            columns={columns}
            data={krsList}
            isLoading={loading}
            emptyMessage="Belum ada data KRS yang sesuai filter."
          />

          {/* Drawer Filter */}
          <Drawer
            open={showFilter}
            onClose={() => setShowFilter(false)}
            title="Filter Data KRS"
            footer={
              <div className="flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearch('');
                    setFilterProdi('');
                    setFilterAngkatan('');
                    setFilterStatus('');
                    setShowFilter(false);
                  }}
                >
                  Reset
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    fetchKrsList();
                    setShowFilter(false);
                  }}
                >
                  Terapkan
                </Button>
              </div>
            }
          >
            <div className="flex flex-col gap-5">
              <Input
                label="Pencarian Mahasiswa"
                placeholder="Cari NIM, nama mahasiswa, atau dosen wali..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <div>
                <label className="label">Program Studi</label>
                <select
                  value={filterProdi}
                  onChange={(e) => setFilterProdi(e.target.value)}
                  className="select w-full"
                >
                  <option value="">Semua Program Studi</option>
                  {prodiList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nama} ({p.jenjang || 'S1'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Tahun Angkatan</label>
                <select
                  value={filterAngkatan}
                  onChange={(e) => setFilterAngkatan(e.target.value)}
                  className="select w-full"
                >
                  <option value="">Semua Angkatan</option>
                  <option value="2023">Angkatan 2023</option>
                  <option value="2024">Angkatan 2024</option>
                  <option value="2025">Angkatan 2025</option>
                  <option value="2026">Angkatan 2026</option>
                </select>
              </div>

              <div>
                <label className="label">Status Persetujuan KRS</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="select w-full"
                >
                  <option value="">Semua Status KRS</option>
                  <option value="diajukan">Diajukan (Menunggu)</option>
                  <option value="disetujui">Disetujui</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>
          </Drawer>
        </div>
      )}
      </div>

      {/* ======================================================== */}
      {/* MODAL CETAK KRS ONLINE (DOKUMEN RESMI) */}
      {/* ======================================================== */}
      {isPrintModalOpen && activeKrs && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in print:p-0 print:m-0 print:static print:bg-white print:overflow-visible">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[95vh] overflow-y-auto space-y-6 print:p-0 print:m-0 print:max-w-none print:border-none print:shadow-none print:max-h-none print:overflow-visible">
            <div className="flex items-center justify-between border-b pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <span className="badge badge-purple font-bold">Dokumen Resmi Akademik</span>
                <span className="text-xs text-slate-500 font-mono">KRS-{mhs?.nim}-{selectedTaObj?.kode || '20261'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  icon={<Printer size={15} />}
                  className="font-bold text-xs"
                  onClick={() => window.print()}
                >
                  Cetak / Unduh PDF
                </Button>
                <Button variant="outline" className="text-xs" onClick={() => setIsPrintModalOpen(false)}>
                  ✕ Tutup
                </Button>
              </div>
            </div>

            {/* DOKUMEN CETAK KRS */}
            <div className="printable-document p-8 border border-slate-300 rounded-xl bg-white space-y-6 text-slate-900 leading-relaxed shadow-xs print:p-0 print:border-none print:space-y-4 print:shadow-none">
              {/* Kop KRS */}
              <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
                <div>
                  <h2 className="font-black text-base tracking-wider uppercase text-slate-900">UNIVERSITAS SSO CAMPUS</h2>
                  <h3 className="font-bold text-xs text-slate-700 uppercase">{mhs?.program_studi?.fakultas?.nama || 'FAKULTAS TEKNOLOGI INFORMASI & SAINS DATA'}</h3>
                  <p className="text-[10px] text-slate-600">Jl. Kampus Terpadu No. 1 • Telp: (021) 789-0123 • Email: baak@campus.ac.id</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-primary-900 uppercase tracking-widest font-mono">KARTU RENCANA STUDI</div>
                  <div className="text-xs font-mono font-bold text-slate-700">TAHUN: {selectedTaObj?.nama || '2026/2027 Ganjil'}</div>
                </div>
              </div>

              {/* Data Mahasiswa */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <div>Nama Mahasiswa: <strong className="font-bold">{mhs?.nama_lengkap}</strong></div>
                  <div>NIM: <strong className="font-mono">{mhs?.nim}</strong></div>
                  <div>Program Studi: {mhs?.program_studi?.nama} ({mhs?.program_studi?.jenjang || 'S1'})</div>
                </div>
                <div className="space-y-1">
                  <div>Tahun Angkatan: <strong className="font-mono">{mhs?.angkatan || 2023}</strong></div>
                  <div>Dosen Pembimbing (Wali): <strong>{mhs?.dosen_wali?.nama_lengkap || 'Dr. Ir. Ahmad Santoso, M.Kom'}</strong></div>
                  <div>Status KRS: <span className="font-bold uppercase text-emerald-700">{activeKrs.status}</span></div>
                </div>
              </div>

              {/* Rincian Mata Kuliah */}
              <div className="space-y-2">
                <table className="w-full text-left text-xs border border-slate-300">
                  <thead className="bg-slate-100 text-slate-800 font-bold uppercase border-b border-slate-300">
                    <tr>
                      <th className="py-2 px-3 text-center border-r border-slate-300 w-10">NO</th>
                      <th className="py-2 px-3 border-r border-slate-300 w-24">KODE MK</th>
                      <th className="py-2 px-3 border-r border-slate-300">NAMA MATA KULIAH</th>
                      <th className="py-2 px-3 text-center border-r border-slate-300 w-12">SKS</th>
                      <th className="py-2 px-3 border-r border-slate-300">DOSEN PENGAMPU</th>
                      <th className="py-2 px-3">JADWAL & RUANG</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {activeKrs.krs_details?.map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 text-center border-r border-slate-300">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-mono font-bold border-r border-slate-300">{item.kelas?.mata_kuliah?.kode_mk}</td>
                        <td className="py-2.5 px-3 font-medium border-r border-slate-300">{item.kelas?.mata_kuliah?.nama}</td>
                        <td className="py-2.5 px-3 text-center font-bold border-r border-slate-300">{item.kelas?.mata_kuliah?.total_sks}</td>
                        <td className="py-2.5 px-3 text-2xs border-r border-slate-300">{item.kelas?.dosen_pengampu?.[0]?.dosen?.nama_lengkap || mhs?.dosen_wali?.nama_lengkap}</td>
                        <td className="py-2.5 px-3 text-2xs">
                          {item.kelas?.hari?.toUpperCase()}, {item.kelas?.jam_mulai?.slice(0, 5)} - {item.kelas?.ruangan?.nama || 'Aula'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100 border-t-2 border-slate-900 font-bold">
                    <tr>
                      <td colSpan={3} className="py-2.5 px-3 text-right uppercase">TOTAL BEBAN SKS RENCANA STUDI:</td>
                      <td className="py-2.5 px-3 text-center font-mono text-sm">{activeKrs.total_sks_diambil}</td>
                      <td colSpan={2} className="py-2.5 px-3 text-slate-500 text-2xs">Maksimal Beban: 24 SKS</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Tanda Tangan 3 Kolom */}
              <div className="grid grid-cols-3 gap-4 pt-8 text-center text-xs">
                <div className="space-y-16">
                  <div>
                    <span className="text-slate-500 block">Mahasiswa,</span>
                  </div>
                  <div>
                    <strong className="underline block font-bold">{mhs?.nama_lengkap}</strong>
                    <span className="font-mono text-2xs">NIM: {mhs?.nim}</span>
                  </div>
                </div>

                <div className="space-y-16">
                  <div>
                    <span className="text-slate-500 block">Dosen Pembimbing Akademik,</span>
                  </div>
                  <div>
                    <strong className="underline block font-bold">{mhs?.dosen_wali?.nama_lengkap || 'Dr. Ir. Ahmad Santoso, M.Kom'}</strong>
                    <span className="font-mono text-2xs">NIDN: {mhs?.dosen_wali?.nidn || '0412058001'}</span>
                  </div>
                </div>

                <div className="space-y-16">
                  <div>
                    <span className="text-slate-500 block">Ketua Program Studi,</span>
                  </div>
                  <div>
                    <strong className="underline block font-bold">Dr. Ir. Ahmad Santoso, M.Kom</strong>
                    <span className="font-mono text-2xs">NIP: 198005122005011002</span>
                  </div>
                </div>
              </div>

              {/* Validasi Footer */}
              <div className="pt-4 border-t flex justify-between items-center text-[10px] text-slate-400 font-mono">
                <span>Dokumen KRS Resmi Dicetak dari Sistem Informasi Akademik Terpadu (SIAKAD)</span>
                <span>SECURITY CODE: #{activeKrs.id}-{selectedTaObj?.kode || '20261'}-VALID</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MANAJEMEN & PENGAKTIFAN PERIODE SEMESTER */}
      {isManagePeriodModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in print:hidden">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <Calendar size={18} className="text-primary-600" />
                  Manajemen & Pengaktifan Periode Semester
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tentukan semester aktif untuk proses KRS, perkuliahan, dan penilaian.
                </p>
              </div>
              <button
                onClick={() => setIsManagePeriodModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* List Periode Tahun Akademik */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700">Daftar Periode Semester:</span>
                <Button
                  variant="outline"
                  icon={<Plus size={13} />}
                  className="text-2xs py-1 px-2.5 h-auto font-bold text-primary-700"
                  onClick={() => setIsNewPeriodOpen(!isNewPeriodOpen)}
                >
                  {isNewPeriodOpen ? 'Tutup Form' : '+ Tambah Periode Baru'}
                </Button>
              </div>

              {/* Form Tambah Periode Baru */}
              {isNewPeriodOpen && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      await siakadService.storeTahunAkademik(newPeriodForm);
                      toast.success('Periode tahun akademik berhasil ditambahkan');
                      setIsNewPeriodOpen(false);
                      setNewPeriodForm({ kode: '', nama: '', tahun_mulai: 2026, tahun_selesai: 2027, is_active: false });
                      fetchTahunAkademiks();
                    } catch (err: any) {
                      toast.error('Gagal menambahkan periode');
                    }
                  }}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Kode Periode (e.g. 20262)</label>
                      <input
                        type="text"
                        required
                        value={newPeriodForm.kode}
                        onChange={(e) => setNewPeriodForm({ ...newPeriodForm, kode: e.target.value })}
                        placeholder="e.g. 20262"
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Nama Periode</label>
                      <input
                        type="text"
                        required
                        value={newPeriodForm.nama}
                        onChange={(e) => setNewPeriodForm({ ...newPeriodForm, nama: e.target.value })}
                        placeholder="e.g. 2026/2027 Genap"
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-bold"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="submit" variant="primary" className="text-2xs py-1 px-3 h-auto font-bold">
                      Simpan Periode
                    </Button>
                  </div>
                </form>
              )}

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 w-24">KODE</th>
                      <th className="py-2.5 px-3">NAMA PERIODE</th>
                      <th className="py-2.5 px-3 text-center w-32">STATUS</th>
                      <th className="py-2.5 px-3 text-right w-40">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {tahunAkademiks.map((ta) => (
                      <tr key={ta.id} className={ta.is_active ? 'bg-emerald-50/50 font-bold' : 'hover:bg-slate-50'}>
                        <td className="py-2.5 px-3 font-mono font-black text-slate-900">{ta.kode}</td>
                        <td className="py-2.5 px-3">{ta.nama}</td>
                        <td className="py-2.5 px-3 text-center">
                          {ta.is_active ? (
                            <span className="badge badge-green text-2xs font-bold">★ Periode Aktif</span>
                          ) : (
                            <span className="badge badge-gray text-2xs">Non-aktif</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {!ta.is_active ? (
                            <Button
                              variant="primary"
                              icon={<Check size={12} />}
                              className="text-2xs py-1 px-2.5 h-auto font-bold bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-xs"
                              disabled={settingActivePeriod}
                              onClick={async () => {
                                try {
                                  setSettingActivePeriod(true);
                                  await siakadService.setActiveTahunAkademik(ta.id);
                                  toast.success(`Periode ${ta.nama} berhasil diaktifkan!`);
                                  setSelectedTaId(ta.id);
                                  await fetchTahunAkademiks();
                                  fetchKrsList();
                                } catch (err: any) {
                                  toast.error('Gagal mengaktifkan periode');
                                } finally {
                                  setSettingActivePeriod(false);
                                }
                              }}
                            >
                              Jadikan Aktif
                            </Button>
                          ) : (
                            <span className="text-2xs text-emerald-700 font-bold">Sedang Berjalan</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t">
              <Button
                variant="outline"
                className="text-xs font-bold"
                onClick={() => setIsManagePeriodModalOpen(false)}
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL DETAIL KRS MAHASISWA (ADMIN & DOSEN WALI) */}
      {/* ======================================================== */}
      {selectedKrs && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in print:hidden">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto space-y-5">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b pb-3.5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="badge badge-purple text-2xs font-extrabold uppercase">
                    Rencana Studi (KRS)
                  </span>
                  <span className={`badge text-2xs font-bold ${
                    selectedKrs.status === 'disetujui' ? 'badge-green' : selectedKrs.status === 'diajukan' ? 'badge-yellow' : 'badge-slate'
                  }`}>
                    STATUS: {selectedKrs.status?.toUpperCase()}
                  </span>
                  {selectedKrs.locked_by_keuangan ? (
                    <span className="badge badge-red text-2xs font-bold inline-flex items-center gap-1">
                      <Lock size={10} /> Belum Lunas SPP
                    </span>
                  ) : (
                    <span className="badge badge-green text-2xs font-bold inline-flex items-center gap-1">
                      <CheckCircle2 size={10} /> Lunas Keuangan
                    </span>
                  )}
                </div>
                <h3 className="font-black text-base text-slate-900 mt-1">
                  KRS: {selectedKrs.mahasiswa?.nama_lengkap} ({selectedKrs.mahasiswa?.nim})
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedKrs(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Student Info Card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-2xs text-slate-400 font-bold uppercase block">Mahasiswa</span>
                <strong className="text-slate-900 block">{selectedKrs.mahasiswa?.nama_lengkap}</strong>
                <span className="font-mono text-2xs text-slate-500">NIM: {selectedKrs.mahasiswa?.nim}</span>
              </div>
              <div>
                <span className="text-2xs text-slate-400 font-bold uppercase block">Program Studi</span>
                <span className="font-semibold text-slate-800 block">{selectedKrs.mahasiswa?.program_studi?.nama || '-'}</span>
                <span className="text-2xs text-slate-500">Angkatan {selectedKrs.mahasiswa?.angkatan || 2023}</span>
              </div>
              <div>
                <span className="text-2xs text-slate-400 font-bold uppercase block">Dosen Pembimbing</span>
                <span className="font-semibold text-slate-800 block">{selectedKrs.mahasiswa?.dosen_wali?.nama_lengkap || selectedKrs.dosen_pembimbing?.nama_lengkap || '-'}</span>
                <span className="text-2xs text-slate-500 font-mono">NIDN: {selectedKrs.mahasiswa?.dosen_wali?.nidn || '-'}</span>
              </div>
              <div>
                <span className="text-2xs text-slate-400 font-bold uppercase block">Total Beban Studi</span>
                <span className="text-sm font-black text-primary-700 block">{selectedKrs.total_sks_diambil || 0} SKS</span>
                <span className="text-2xs text-slate-500">{selectedKrs.krs_details?.length || 0} Mata Kuliah Terpilih</span>
              </div>
            </div>

            {/* List of Enrolled Courses */}
            <div className="space-y-2">
              <span className="font-extrabold text-xs text-slate-900 block">
                Daftar Mata Kuliah yang Diambil ({selectedKrs.tahun_akademik?.nama || 'Semester Aktif'}):
              </span>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">NO</th>
                      <th className="py-2.5 px-3">KODE MK</th>
                      <th className="py-2.5 px-3">MATA KULIAH & KELAS</th>
                      <th className="py-2.5 px-3 text-center">SKS</th>
                      <th className="py-2.5 px-3">DOSEN PENGAMPU</th>
                      <th className="py-2.5 px-3">JADWAL & RUANGAN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {!selectedKrs.krs_details || selectedKrs.krs_details.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400">
                          Belum ada mata kuliah yang didaftarkan pada KRS ini.
                        </td>
                      </tr>
                    ) : (
                      selectedKrs.krs_details.map((detail: any, idx: number) => (
                        <tr key={detail.id || idx} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                            {detail.kelas?.mata_kuliah?.kode_mk || detail.kode_mk || '-'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-slate-900 block">
                              {detail.kelas?.mata_kuliah?.nama || detail.nama_mk || '-'}
                            </span>
                            <span className="text-2xs text-slate-400">
                              Kelas {detail.kelas?.nama_kelas || '-'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-black tabular-nums">
                            {detail.kelas?.mata_kuliah?.total_sks || detail.sks || 3} SKS
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">
                            {detail.kelas?.dosen_pengampu?.find((dp: any) => dp.peran === 'pengampu_utama')?.dosen?.nama_lengkap ||
                             detail.kelas?.dosen_pengampu?.[0]?.dosen?.nama_lengkap ||
                             detail.dosen_pengampu ||
                             '-'}
                          </td>
                          <td className="py-2.5 px-3 text-2xs">
                            <span className="font-bold text-slate-800 capitalize block">
                              {detail.kelas?.hari ? `${detail.kelas.hari}, ${detail.kelas.jam_mulai?.slice(0, 5)} - ${detail.kelas.jam_selesai?.slice(0, 5)}` : '-'}
                            </span>
                            <span className="text-slate-400">{detail.kelas?.ruangan?.nama || 'Ruang Kuliah'}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {selectedKrs.krs_details?.length > 0 && (
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                      <tr>
                        <td colSpan={3} className="py-2.5 px-3 text-right text-slate-600">
                          Total Beban SKS:
                        </td>
                        <td className="py-2.5 px-3 text-center font-black text-primary-700">
                          {selectedKrs.total_sks_diambil} SKS
                        </td>
                        <td colSpan={2} className="py-2.5 px-3 text-slate-400 text-2xs">
                          Maksimal Beban: 24 SKS
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* Penyetaraan Konversi Section inside Modal for Advisor/Admin Review */}
            {(selectedKrs.mahasiswa?.jenis_pendaftaran === 'Peserta Didik Pindahan' || selectedKrs.mahasiswa?.konversi_transfer) && (
              <div className="space-y-3 pt-3 border-t">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="text-amber-500 animate-pulse" size={14} />
                    Usulan Penyetaraan Konversi Transfer:
                  </span>
                  {selectedKrs.mahasiswa?.konversi_transfer?.status && (
                    <span className={`badge text-2xs font-black uppercase ${
                      selectedKrs.mahasiswa.konversi_transfer.status === 'disetujui' ? 'badge-green' : selectedKrs.mahasiswa.konversi_transfer.status === 'diajukan' ? 'badge-yellow' : selectedKrs.mahasiswa.konversi_transfer.status === 'ditolak' ? 'badge-red' : 'badge-slate'
                    }`}>
                      Status: {selectedKrs.mahasiswa.konversi_transfer.status}
                    </span>
                  )}
                </div>

                {!selectedKrs.mahasiswa?.konversi_transfer ? (
                  <p className="text-2xs text-slate-400 italic">Mahasiswa belum menginputkan data penyetaraan konversi.</p>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-4 text-2xs">
                      <div>
                        <span className="text-slate-400 font-semibold block uppercase">Kampus Asal</span>
                        <strong className="text-slate-800">{selectedKrs.mahasiswa.konversi_transfer.kampus_asal}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block uppercase">Prodi Asal</span>
                        <strong className="text-slate-800">{selectedKrs.mahasiswa.konversi_transfer.prodi_asal}</strong>
                      </div>
                      {selectedKrs.mahasiswa.konversi_transfer.catatan && (
                        <div className="col-span-2">
                          <span className="text-slate-400 font-semibold block uppercase">Catatan Mahasiswa</span>
                          <span className="text-slate-700 italic">"{selectedKrs.mahasiswa.konversi_transfer.catatan}"</span>
                        </div>
                      )}
                    </div>

                    <div className="border-t pt-2.5">
                      <span className="font-bold text-slate-800 block mb-1">Daftar Penyetaraan Matakuliah:</span>
                      <table className="w-full text-left text-2xs border-collapse">
                        <thead>
                          <tr className="border-b text-slate-500 font-bold">
                            <th className="py-1">MK Asal (Kode/Nama/SKS/Nilai)</th>
                            <th className="py-1">Disetarakan Ke MK Lokal (Kode/Nama/SKS)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y text-slate-700 font-medium">
                          {selectedKrs.mahasiswa.konversi_transfer.details?.map((det: any, i: number) => (
                            <tr key={det.id || i}>
                              <td className="py-1.5 pr-2">
                                <span className="font-bold">{det.kode_mk_asal} - {det.nama_mk_asal}</span> ({det.sks_asal} SKS, Nilai {det.nilai_huruf_asal})
                              </td>
                              <td className="py-1.5">
                                <span className="font-bold text-primary-700">{det.mata_kuliah_diakui?.kode_mk || det.mata_kuliah_diakui_id}</span> - {det.mata_kuliah_diakui?.nama} ({det.mata_kuliah_diakui?.total_sks} SKS)
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Dosen Wali / Admin Approval Actions */}
                    {selectedKrs.mahasiswa.konversi_transfer.status === 'diajukan' && (
                      <div className="border-t pt-3 flex items-center justify-between flex-wrap gap-2">
                        <div className="flex-1 min-w-[200px]">
                          <input
                            type="text"
                            placeholder="Catatan persetujuan / penolakan..."
                            id="catatan-konversi"
                            className="input w-full text-2xs py-1.5 font-bold"
                          />
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            variant="danger"
                            size="sm"
                            className="font-bold text-2xs py-1 px-3 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                            onClick={async () => {
                              const input = document.getElementById('catatan-konversi') as HTMLInputElement;
                              const catatan = input?.value || '';
                              if (!catatan) {
                                toast.error('Harap isi catatan/alasan penolakan');
                                return;
                              }
                              try {
                                const res = await siakadService.updateKonversiStatus(selectedKrs.mahasiswa.konversi_transfer.id, {
                                  status: 'ditolak',
                                  catatan
                                });
                                toast.success('Penyetaraan konversi ditolak.');
                                setSelectedKrs(null);
                                fetchKrsList();
                              } catch (err) {
                                toast.error('Gagal memproses usulan konversi');
                              }
                            }}
                          >
                            Tolak Penyetaraan
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            className="font-bold text-2xs py-1 px-3 bg-emerald-600 text-white hover:bg-emerald-700 border-none"
                            onClick={async () => {
                              const input = document.getElementById('catatan-konversi') as HTMLInputElement;
                              const catatan = input?.value || 'Disetujui oleh Dosen PA';
                              try {
                                const res = await siakadService.updateKonversiStatus(selectedKrs.mahasiswa.konversi_transfer.id, {
                                  status: 'disetujui',
                                  catatan
                                });
                                toast.success('Penyetaraan konversi disetujui.');
                                setSelectedKrs(null);
                                fetchKrsList();
                              } catch (err) {
                                toast.error('Gagal memproses usulan konversi');
                              }
                            }}
                          >
                            Setujui Penyetaraan
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t">
              <Button
                variant="outline"
                className="text-xs"
                onClick={() => setSelectedKrs(null)}
              >
                Tutup
              </Button>

              <div className="flex items-center gap-2">
                {selectedKrs.status !== 'disetujui' && (
                  <Button
                    variant="primary"
                    icon={<CheckCircle2 size={14} />}
                    className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-xs"
                    onClick={async () => {
                      await handleApprove(selectedKrs.id);
                      setSelectedKrs(null);
                    }}
                    disabled={selectedKrs.locked_by_keuangan}
                  >
                    Setujui KRS Mahasiswa
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
