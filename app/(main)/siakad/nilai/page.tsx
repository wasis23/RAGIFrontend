'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Award,
  BookOpen,
  GraduationCap,
  Search,
  Filter,
  CheckCircle2,
  Edit3,
  TrendingUp,
  FileText,
  Printer,
  Calendar,
  Layers,
  Sparkles,
  UserCheck,
  Eye,
  Settings,
  Plus,
  Trash2,
  Target,
  BarChart3,
  Check,
  AlertCircle
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { siakadService } from '@/services/siakad.service';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function InputNilaiPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'khs' | 'transkrip' | 'portofolio_obe'>('khs');
  const [nilaiList, setNilaiList] = useState<any[]>([]);
  const [summary, setSummary] = useState<any | null>(null);
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [showFilter, setShowFilter] = useState(false);

  // Multi-period state
  const [tahunAkademiks, setTahunAkademiks] = useState<any[]>([]);
  const [selectedTaId, setSelectedTaId] = useState<number | null>(null);

  // Transkrip data
  const [transkripData, setTranskripData] = useState<any | null>(null);
  const [loadingTranskrip, setLoadingTranskrip] = useState(false);

  // Print Modals
  const [isPrintKhsOpen, setIsPrintKhsOpen] = useState(false);
  const [isPrintTranskripOpen, setIsPrintTranskripOpen] = useState(false);

  // Check roles
  const userRoles = user?.roles?.map((r: any) => typeof r === 'string' ? r : r.slug) || [];
  const isMahasiswa = userRoles.includes('mahasiswa');
  const isDosen = userRoles.includes('dosen');
  const isAdmin = userRoles.includes('superadmin') || userRoles.includes('admin');

  // Admin student search & directory states (Transkrip tab)
  const [mahasiswaDirectory, setMahasiswaDirectory] = useState<any[]>([]);
  const [selectedMahasiswa, setSelectedMahasiswa] = useState<any | null>(null);
  const [loadingMhs, setLoadingMhs] = useState(false);
  const [searchMhs, setSearchMhs] = useState('');
  const [filterProdiMhs, setFilterProdiMhs] = useState('');
  const [prodis, setProdis] = useState<any[]>([]);

  // Admin / Dosen class-first grading states (KHS tab)
  const [selectedKelasObj, setSelectedKelasObj] = useState<any | null>(null);
  const [searchKelas, setSearchKelas] = useState('');
  const [filterProdiKelas, setFilterProdiKelas] = useState('');
  const [loadingKelasList, setLoadingKelasList] = useState(false);

  // ==========================================
  // OBE (OUTCOME-BASED EDUCATION) STATES
  // ==========================================
  const [obeKelasData, setObeKelasData] = useState<any | null>(null);
  const [loadingObeKelas, setLoadingObeKelas] = useState(false);
  
  // OBE Assessment Config Modal
  const [isObeConfigOpen, setIsObeConfigOpen] = useState(false);
  const [obeConfigTab, setObeConfigTab] = useState<'komponen' | 'cpmk'>('komponen');
  const [editingKomponen, setEditingKomponen] = useState<any | null>(null);
  const [formKomponen, setFormKomponen] = useState({
    nama_komponen: '',
    teknik_penilaian: 'tugas',
    bobot: 20,
    cpmk_id: '',
  });
  const [savingKomponen, setSavingKomponen] = useState(false);

  // Custom CPMK by Dosen
  const [isAddingCpmk, setIsAddingCpmk] = useState(false);
  const [cpmkFormCustom, setCpmkFormCustom] = useState({
    kode_cpmk: '',
    deskripsi: '',
    bobot_persentase: 25,
    cpl_id: '',
  });
  const [savingCpmkCustom, setSavingCpmkCustom] = useState(false);

  // OBE Student Grading Modal
  const [editingPesertaObe, setEditingPesertaObe] = useState<any | null>(null);
  const [formObeScores, setFormObeScores] = useState<Record<number, number>>({});
  const [isFinalObe, setIsFinalObe] = useState(true);
  const [savingObeScores, setSavingObeScores] = useState(false);

  // Student OBE Portfolio Tab
  const [portofolioObeData, setPortofolioObeData] = useState<any | null>(null);
  const [loadingPortofolioObe, setLoadingPortofolioObe] = useState(false);

  // Student Porto Detail Modal / Drawer from class grading view
  const [portoDrawerStudent, setPortoDrawerStudent] = useState<any | null>(null);
  const [drawerPortoData, setDrawerPortoData] = useState<any | null>(null);
  const [loadingDrawerPorto, setLoadingDrawerPorto] = useState(false);

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

  const fetchKelasOptions = async () => {
    try {
      setLoadingKelasList(true);
      const [kRes, pRes] = await Promise.all([
        siakadService.getKelas({
          search: searchKelas,
          program_studi_id: filterProdiKelas || undefined,
          tahun_akademik_id: selectedTaId || undefined,
          my_teaching_only: isDosen && !isAdmin ? true : undefined,
        }),
        siakadService.getProdi(),
      ]);
      if (kRes.data) setKelasList(kRes.data);
      if (pRes.data) setProdis(pRes.data);
    } catch (err) {} finally {
      setLoadingKelasList(false);
    }
  };

  const fetchMahasiswaDirectory = async () => {
    if (isMahasiswa) return;
    try {
      setLoadingMhs(true);
      const res = await siakadService.getMahasiswas({
        search: searchMhs,
        program_studi_id: filterProdiMhs || undefined,
        per_page: 15,
      });
      if (res.data) setMahasiswaDirectory(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMhs(false);
    }
  };

  const fetchNilai = async () => {
    try {
      setLoading(true);
      const res = await siakadService.getNilai({
        search,
        kelas_id: selectedKelasObj?.id || filterKelas || undefined,
        mahasiswa_id: isMahasiswa ? undefined : selectedMahasiswa?.id || undefined,
        tahun_akademik_id: selectedTaId || undefined,
        my_classes_only: isDosen && !isAdmin && !selectedKelasObj && !selectedMahasiswa ? true : undefined,
      });
      if (res.data) setNilaiList(res.data);
      if ((res as any).summary) setSummary((res as any).summary);
    } catch (err: any) {
      toast.error('Gagal memuat data nilai');
    } finally {
      setLoading(false);
    }
  };

  const fetchObeKelasData = async (kelasId: number) => {
    try {
      setLoadingObeKelas(true);
      const res = await siakadService.getKelasNilaiObe(kelasId);
      if (res.data) {
        setObeKelasData(res.data);
      }
    } catch (err: any) {
      toast.error('Gagal memuat matriks penilaian OBE kelas');
    } finally {
      setLoadingObeKelas(false);
    }
  };

  const fetchTranskrip = async () => {
    try {
      setLoadingTranskrip(true);
      const res = await siakadService.getTranskrip(
        selectedMahasiswa?.id ? { mahasiswa_id: selectedMahasiswa.id } : undefined
      );
      if (res.data) {
        setTranskripData(res.data);
      }
    } catch (err: any) {
      toast.error('Gagal memuat transkrip nilai akademik');
    } finally {
      setLoadingTranskrip(false);
    }
  };

  const fetchPortofolioObe = async () => {
    const targetMhsId = selectedMahasiswa?.id ? selectedMahasiswa.id : undefined;
    try {
      setLoadingPortofolioObe(true);
      const res = await siakadService.getMahasiswaPortofolioObe(targetMhsId);
      if (res.data) {
        setPortofolioObeData(res.data);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memuat portofolio capaian OBE');
    } finally {
      setLoadingPortofolioObe(false);
    }
  };

  const handleOpenStudentPortoDrawer = async (student: any) => {
    setPortoDrawerStudent(student);
    try {
      setLoadingDrawerPorto(true);
      const res = await siakadService.getMahasiswaPortofolioObe(student.id);
      if (res.data) {
        setDrawerPortoData(res.data);
      }
    } catch (err: any) {
      toast.error('Gagal memuat rincian portofolio capaian OBE mahasiswa');
    } finally {
      setLoadingDrawerPorto(false);
    }
  };

  useEffect(() => {
    fetchTahunAkademiks();
  }, []);

  useEffect(() => {
    if (!isMahasiswa) {
      fetchKelasOptions();
    }
  }, [searchKelas, filterProdiKelas, selectedTaId, isMahasiswa]);

  useEffect(() => {
    if (!isMahasiswa && (activeTab === 'transkrip' || activeTab === 'portofolio_obe') && !selectedMahasiswa) {
      fetchMahasiswaDirectory();
    }
  }, [searchMhs, filterProdiMhs, isMahasiswa, selectedMahasiswa, activeTab]);

  useEffect(() => {
    if (isMahasiswa || (selectedMahasiswa && activeTab === 'khs')) {
      fetchNilai();
    }
  }, [search, selectedTaId, selectedMahasiswa, isMahasiswa, activeTab]);

  useEffect(() => {
    if (selectedKelasObj) {
      fetchObeKelasData(selectedKelasObj.id);
    }
  }, [selectedKelasObj]);

  useEffect(() => {
    if (activeTab === 'transkrip' && (isMahasiswa || selectedMahasiswa)) {
      fetchTranskrip();
    }
  }, [activeTab, selectedMahasiswa, isMahasiswa]);

  useEffect(() => {
    if (activeTab === 'portofolio_obe' && (isMahasiswa || selectedMahasiswa)) {
      fetchPortofolioObe();
    }
  }, [activeTab, selectedMahasiswa, isMahasiswa]);

  const handleSelectKelas = (k: any) => {
    setSelectedKelasObj(k);
    setFilterKelas(k.id);
  };

  const handleBackToKelasList = () => {
    setSelectedKelasObj(null);
    setFilterKelas('');
    setObeKelasData(null);
  };

  // Open OBE Student Grading Modal
  const handleOpenEditPesertaObe = (peserta: any) => {
    setEditingPesertaObe(peserta);
    const initialScores: Record<number, number> = {};
    if (peserta.scores) {
      Object.entries(peserta.scores).forEach(([compId, compData]: [any, any]) => {
        initialScores[Number(compId)] = compData.nilai_angka || 0;
      });
    }
    setFormObeScores(initialScores);
    setIsFinalObe(Boolean(peserta.is_final));
  };

  const handleSaveObeScores = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPesertaObe || !selectedKelasObj) return;

    try {
      setSavingObeScores(true);
      const res = await siakadService.saveKelasNilaiObe(selectedKelasObj.id, {
        krs_detail_id: editingPesertaObe.krs_detail_id,
        scores: formObeScores,
        is_final: isFinalObe,
      });
      toast.success(res.message || 'Nilai OBE dan Ketercapaian CPMK berhasil disimpan');
      setEditingPesertaObe(null);
      fetchObeKelasData(selectedKelasObj.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal menyimpan nilai OBE');
    } finally {
      setSavingObeScores(false);
    }
  };

  // OBE Component Settings Modal Handlers
  const handleSaveKomponen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKelasObj) return;

    try {
      setSavingKomponen(true);
      await siakadService.storeKelasKomponenObe(selectedKelasObj.id, {
        ...formKomponen,
        id: editingKomponen?.id || undefined,
      });
      toast.success('Komponen penilaian OBE berhasil diperbarui');
      setEditingKomponen(null);
      setFormKomponen({ nama_komponen: '', teknik_penilaian: 'tugas', bobot: 20, cpmk_id: '' });
      fetchObeKelasData(selectedKelasObj.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal menyimpan komponen asesmen');
    } finally {
      setSavingKomponen(false);
    }
  };

  const handleDeleteKomponen = async (id: number) => {
    if (!confirm('Hapus komponen penilaian OBE ini?')) return;
    try {
      await siakadService.deleteKelasKomponenObe(id);
      toast.success('Komponen berhasil dihapus');
      fetchObeKelasData(selectedKelasObj.id);
    } catch (err: any) {
      toast.error('Gagal menghapus komponen');
    }
  };

  const selectedTaObj = tahunAkademiks.find((t) => t.id === selectedTaId);
  const mhs = summary?.mahasiswa || transkripData?.mahasiswa || portofolioObeData?.mahasiswa;

  const kelasColumns: ColumnDef<any>[] = [
    {
      key: 'kode_kelas',
      label: 'KODE & KELAS',
      render: (k) => (
        <div>
          <span className="font-extrabold text-slate-900 block font-mono">{k.kode_kelas}</span>
          <span className="text-2xs text-slate-500">{k.nama_kelas}</span>
        </div>
      ),
    },
    {
      key: 'mata_kuliah',
      label: 'MATA KULIAH & SKS',
      render: (k) => (
        <div>
          <span className="font-bold text-slate-900 block">{k.mata_kuliah?.nama || 'Mata Kuliah'}</span>
          <span className="text-2xs text-primary-700 font-bold">{k.mata_kuliah?.total_sks || 3} SKS</span>
        </div>
      ),
    },
    {
      key: 'program_studi',
      label: 'PROGRAM STUDI',
      render: (k) => <span className="font-semibold text-slate-700">{k.program_studi?.nama || '-'}</span>,
    },
    {
      key: 'dosen',
      label: 'DOSEN PENGAMPU',
      render: (k) => (
        <span className="font-medium text-slate-800 text-xs">
          {k.dosen_pengampu?.[0]?.dosen?.nama_lengkap || 'Dosen Pengampu'}
        </span>
      ),
    },
    {
      key: 'jadwal',
      label: 'JADWAL & RUANG',
      render: (k) => (
        <div className="text-2xs text-slate-600">
          <span className="font-bold block capitalize">
            {k.hari || 'Senin'}, {k.jam_mulai ? k.jam_mulai.substring(0, 5) : '08:00'} - {k.jam_selesai ? k.jam_selesai.substring(0, 5) : '10:30'}
          </span>
          <span className="text-slate-400">{k.ruangan?.nama || 'Ruang Kuliah'}</span>
        </div>
      ),
    },
    {
      key: 'peserta',
      label: 'KUOTA / PESERTA',
      align: 'center',
      render: (k) => (
        <Badge variant="purple" className="text-2xs font-bold">
          {k.total_peserta || 35} Mahasiswa
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'AKSI',
      align: 'right',
      render: (k) => (
        <Button
          variant="primary"
          icon={<Eye size={13} />}
          className="text-2xs py-1.5 px-3 h-auto font-bold shadow-xs"
          onClick={() => handleSelectKelas(k)}
        >
          Buka Nilai & Peserta Kelas →
        </Button>
      ),
    },
  ];

  const mhsPortoColumns: ColumnDef<any>[] = [
    {
      key: 'mahasiswa',
      label: 'NIM & NAMA MAHASISWA',
      render: (m) => (
        <div>
          <span className="font-extrabold text-slate-900 block">{m.nama_lengkap}</span>
          <span className="text-2xs text-slate-500 font-mono">{m.nim}</span>
        </div>
      ),
    },
    {
      key: 'program_studi',
      label: 'PROGRAM STUDI',
      render: (m) => <span className="font-semibold text-slate-700">{m.program_studi?.nama || '-'}</span>,
    },
    {
      key: 'angkatan',
      label: 'ANGKATAN',
      align: 'center',
      render: (m) => <span className="font-mono">{m.angkatan || '2026'}</span>,
    },
    {
      key: 'ipk',
      label: 'IPK',
      align: 'center',
      render: (m) => (
        <span className="font-mono font-black text-slate-900">
          {Number(m.ipk ?? 0.00).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'status_cpl',
      label: 'STATUS CAPAIAN CPL',
      align: 'center',
      render: () => (
        <Badge variant="green" className="text-2xs font-bold">
          ✓ Memenuhi Standar CPL
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'AKSI',
      align: 'right',
      render: (m) => (
        <Button
          variant="primary"
          icon={<Eye size={13} />}
          className="text-2xs py-1.5 px-3 h-auto font-bold shadow-xs"
          onClick={() => {
            setSelectedMahasiswa(m);
            fetchPortofolioObe();
          }}
        >
          Lihat Detail Portofolio OBE →
        </Button>
      ),
    },
  ];

  const mhsTranskripColumns: ColumnDef<any>[] = [
    {
      key: 'nim',
      label: 'NIM',
      render: (m) => <span className="font-mono font-bold text-slate-900">{m.nim}</span>,
    },
    {
      key: 'nama_lengkap',
      label: 'NAMA MAHASISWA',
      render: (m) => <span className="font-bold text-slate-900">{m.nama_lengkap}</span>,
    },
    {
      key: 'program_studi',
      label: 'PROGRAM STUDI',
      render: (m) => <span>{m.program_studi?.nama || '-'}</span>,
    },
    {
      key: 'angkatan',
      label: 'ANGKATAN',
      align: 'center',
      render: (m) => <span className="font-mono">{m.angkatan || '2026'}</span>,
    },
    {
      key: 'actions',
      label: 'AKSI',
      align: 'right',
      render: (m) => (
        <Button
          variant={selectedMahasiswa?.id === m.id ? 'primary' : 'outline'}
          className="text-2xs py-1 px-3 h-auto font-bold"
          onClick={() => setSelectedMahasiswa(m)}
        >
          {selectedMahasiswa?.id === m.id ? '✓ Terpilih' : 'Pilih Mahasiswa'}
        </Button>
      ),
    },
  ];

  const studentKhsColumns: ColumnDef<any>[] = [
    {
      key: 'mata_kuliah',
      label: 'KODE & MATA KULIAH',
      render: (row) => {
        const mk = row.krs_detail?.kelas?.mata_kuliah;
        return (
          <div>
            <span className="font-extrabold text-slate-900 block">{mk?.nama || 'Mata Kuliah'}</span>
            <span className="text-2xs text-slate-400 font-mono">{mk?.kode_mk || 'MK'}</span>
          </div>
        );
      },
    },
    {
      key: 'sks',
      label: 'SKS',
      align: 'center',
      render: (row) => (
        <span className="font-bold font-mono text-slate-800">
          {row.krs_detail?.kelas?.mata_kuliah?.total_sks || 3} SKS
        </span>
      ),
    },
    {
      key: 'tugas',
      label: 'TUGAS (20%)',
      align: 'center',
      render: (row) => (
        <span className="font-mono text-xs">{Number(row.nilai_harian || 0).toFixed(1)}</span>
      ),
    },
    {
      key: 'kuis',
      label: 'KUIS (15%)',
      align: 'center',
      render: (row) => (
        <span className="font-mono text-xs">{Number(row.nilai_praktik || 0).toFixed(1)}</span>
      ),
    },
    {
      key: 'uts',
      label: 'UTS (30%)',
      align: 'center',
      render: (row) => (
        <span className="font-mono text-xs">{Number(row.nilai_uts || 0).toFixed(1)}</span>
      ),
    },
    {
      key: 'uas',
      label: 'PROYEK/UAS (35%)',
      align: 'center',
      render: (row) => (
        <span className="font-mono text-xs">{Number(row.nilai_uas || 0).toFixed(1)}</span>
      ),
    },
    {
      key: 'nilai_akhir',
      label: 'NILAI AKHIR',
      align: 'center',
      render: (row) => (
        <span className="font-mono font-black text-slate-900 text-xs">
          {Number(row.nilai_akhir || 0).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'nilai_huruf',
      label: 'HURUF',
      align: 'center',
      render: (row) => {
        const variant =
          row.nilai_huruf === 'A' || row.nilai_huruf === 'A-'
            ? 'green'
            : row.nilai_huruf === 'B+' || row.nilai_huruf === 'B'
            ? 'blue'
            : row.nilai_huruf === 'C+' || row.nilai_huruf === 'C'
            ? 'amber'
            : 'gray';
        return <Badge variant={variant as any}>{row.nilai_huruf || '-'}</Badge>;
      },
    },
    {
      key: 'bobot_mutu',
      label: 'MUTU',
      align: 'center',
      render: (row) => (
        <span className="font-mono font-bold text-emerald-700 text-xs">
          {Number(row.bobot_mutu || 0).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'STATUS KELULUSAN',
      align: 'center',
      render: (row) => {
        const isLulus = row.nilai_huruf !== 'E' && row.nilai_huruf !== 'D';
        return (
          <Badge variant={isLulus ? 'green' : 'rose'} className="text-2xs font-bold">
            {isLulus ? '✓ Lulus (Tercapai)' : '✗ Belum Lulus'}
          </Badge>
        );
      },
    },
  ];

  const transkripColumns: ColumnDef<any>[] = [
    {
      key: 'mata_kuliah',
      label: 'KODE & MATA KULIAH',
      render: (item) => (
        <div>
          <span className="font-bold text-slate-900 block font-sans">{item.nama_mk}</span>
          <span className="text-2xs text-slate-400 font-mono">{item.kode_mk}</span>
        </div>
      ),
    },
    {
      key: 'semester',
      label: 'SEMESTER / TIPE',
      render: (item) => (
        <Badge variant={item.is_transfer ? 'purple' : 'blue'} className="text-2xs font-bold">
          {item.semester_label}
        </Badge>
      ),
    },
    {
      key: 'sks',
      label: 'SKS (K)',
      align: 'center',
      render: (item) => <span className="font-mono font-bold text-slate-800">{item.sks}</span>,
    },
    {
      key: 'nilai_huruf',
      label: 'NILAI (N)',
      align: 'center',
      render: (item) => (
        <Badge variant={item.nilai_huruf === 'A' || item.nilai_huruf === 'A-' ? 'green' : 'blue'}>
          {item.nilai_huruf}
        </Badge>
      ),
    },
    {
      key: 'bobot_mutu',
      label: 'MUTU (M)',
      align: 'center',
      render: (item) => (
        <span className="font-mono font-bold text-slate-700">{Number(item.bobot_mutu).toFixed(2)}</span>
      ),
    },
    {
      key: 'mutu_x_sks',
      label: 'K X M',
      align: 'center',
      render: (item) => (
        <span className="font-mono font-black text-slate-900">{Number(item.mutu_x_sks).toFixed(2)}</span>
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
              ? 'Hasil Studi & Portofolio Capaian OBE'
              : isDosen
              ? 'Penilaian & Portofolio OBE Mahasiswa'
              : 'Manajemen Penilaian & Transkrip OBE'
          }
          description={
            isMahasiswa
              ? 'Kartu Hasil Studi (KHS), ketercapaian CPMK/CPL, dan dokumen Transkrip Akademik resmi.'
              : 'Manajemen asesmen capaian pembelajaran (OBE), evaluasi ketercapaian CPMK, dan kalkulasi KHS.'
          }
          breadcrumbs={[
            { label: 'Portal SSO', href: '/dashboard' },
            { label: 'SIAKAD', href: '/siakad' },
            { label: 'Hasil Studi & Penilaian' },
          ]}
          action={
            <div className="flex items-center gap-2.5 flex-wrap justify-start md:justify-end">
              {activeTab === 'khs' && (
                <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
                  <Calendar size={14} className="text-primary-600 shrink-0" />
                  <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">Periode:</span>
                  <select
                    value={selectedTaId || ''}
                    onChange={(e) => {
                      setSelectedTaId(Number(e.target.value));
                      setSelectedKelasObj(null);
                    }}
                    className="text-xs font-bold text-slate-900 bg-transparent outline-none cursor-pointer pr-1"
                  >
                    {(isMahasiswa && transkripData?.mahasiswa?.angkatan
                      ? tahunAkademiks.filter((ta) => {
                          const startYear = ta.tahun_mulai || Number(String(ta.kode).slice(0, 4));
                          return startYear >= Number(transkripData.mahasiswa.angkatan) || ta.is_active;
                        })
                      : tahunAkademiks
                    ).map((ta) => (
                      <option key={ta.id} value={ta.id}>
                        {ta.nama} {ta.is_active ? '★ (Aktif)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {isAdmin && selectedTaObj && (
                <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
                  <Settings size={14} className="text-emerald-600 shrink-0" />
                  <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">Mode Penilaian:</span>
                  <select
                    value={selectedTaObj.mode_penilaian || 'semi_obe'}
                    onChange={async (e) => {
                      const nextMode = e.target.value;
                      try {
                        await siakadService.updateModePenilaian(selectedTaObj.id, { mode_penilaian: nextMode });
                        toast.success(`Mode penilaian periode berhasil diubah ke ${nextMode}`);
                        setTahunAkademiks(prev => prev.map(t => t.id === selectedTaObj.id ? { ...t, mode_penilaian: nextMode } : t));
                      } catch(err) {
                        toast.error('Gagal memperbarui mode penilaian');
                      }
                    }}
                    className="text-xs font-bold text-slate-900 bg-transparent outline-none cursor-pointer pr-1"
                  >
                    <option value="full_obe">Pure OBE (CPMK)</option>
                    <option value="semi_obe">Hybrid OBE (UTS/UAS)</option>
                    <option value="konvensional">Konvensional</option>
                  </select>
                </div>
              )}

              {/* Filter Button for Admin & Dosen */}
              {!isMahasiswa && (
                ((activeTab === 'khs' && !selectedKelasObj) ||
                 (activeTab === 'portofolio_obe' && !selectedMahasiswa) ||
                 (activeTab === 'transkrip' && !selectedMahasiswa)) && (
                  <Button
                    variant="outline"
                    icon={<Filter size={15} />}
                    className="font-bold text-xs border-slate-300 min-h-[38px] text-slate-700 hover:bg-slate-50"
                    onClick={() => setShowFilter(true)}
                  >
                    Filter
                  </Button>
                )
              )}

              {/* Tombol Cetak KHS */}
              {activeTab === 'khs' && (isMahasiswa || (selectedMahasiswa && !selectedKelasObj)) && (
                <Button
                  variant="outline"
                  icon={<Printer size={15} />}
                  className="font-bold text-xs border-slate-300 min-h-[38px] text-slate-700 hover:bg-slate-50"
                  onClick={() => setIsPrintKhsOpen(true)}
                >
                  Cetak KHS
                </Button>
              )}

              {/* Tombol Cetak Transkrip */}
              {activeTab === 'transkrip' && (isMahasiswa || selectedMahasiswa) && (
                <Button
                  variant="primary"
                  icon={<Printer size={15} />}
                  className="font-bold text-xs min-h-[38px]"
                  onClick={() => setIsPrintTranskripOpen(true)}
                >
                  Cetak Transkrip
                </Button>
              )}
            </div>
          }
        />

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('khs')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-extrabold border-b-2 transition -mb-px cursor-pointer ${
              activeTab === 'khs'
                ? 'border-primary-600 text-primary-600 bg-primary-50/40 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <BookOpen size={16} />
            Penilaian & KHS Kelas (OBE)
          </button>

          <button
            onClick={() => setActiveTab('portofolio_obe')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-extrabold border-b-2 transition -mb-px cursor-pointer ${
              activeTab === 'portofolio_obe'
                ? 'border-primary-600 text-primary-600 bg-primary-50/40 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Target size={16} />
            Portofolio Capaian OBE (CPL & CPMK)
          </button>

          <button
            onClick={() => setActiveTab('transkrip')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-extrabold border-b-2 transition -mb-px cursor-pointer ${
              activeTab === 'transkrip'
                ? 'border-primary-600 text-primary-600 bg-primary-50/40 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Award size={16} />
            Transkrip Akademik Kumulatif
          </button>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: PENILAIAN & KHS KELAS BERBASIS OBE */}
        {/* ======================================================== */}
        {activeTab === 'khs' && (
          <div className="space-y-4">
            {/* VIEW UNTUK ADMIN / DOSEN */}
            {!isMahasiswa ? (
              !selectedKelasObj ? (
                /* 1. DIRECTORY DAFTAR KELAS & MATA KULIAH */
                <div className="space-y-4">
                  <DataTable
                    columns={kelasColumns}
                    data={kelasList}
                    isLoading={loadingKelasList}
                    emptyMessage="Tidak ada kelas aktif pada periode ini."
                  />

                  {/* Drawer Filter Kelas */}
                  <Drawer
                    open={showFilter && activeTab === 'khs'}
                    onClose={() => setShowFilter(false)}
                    title="Filter Kelas Perkuliahan"
                    footer={
                      <div className="flex justify-end gap-3">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setSearchKelas('');
                            setFilterProdiKelas('');
                            setShowFilter(false);
                          }}
                        >
                          Reset
                        </Button>
                        <Button
                          variant="primary"
                          onClick={() => setShowFilter(false)}
                        >
                          Terapkan
                        </Button>
                      </div>
                    }
                  >
                    <div className="flex flex-col gap-5">
                      <Input
                        label="Pencarian Kelas"
                        placeholder="Cari nama mata kuliah atau kelas..."
                        value={searchKelas}
                        onChange={(e) => setSearchKelas(e.target.value)}
                      />

                      <div>
                        <label className="label">Program Studi</label>
                        <select
                          value={filterProdiKelas}
                          onChange={(e) => setFilterProdiKelas(e.target.value)}
                          className="select w-full"
                        >
                          <option value="">Semua Program Studi</option>
                          {prodis.map((p) => (
                            <option key={p.id} value={p.id}>{p.nama}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </Drawer>
                </div>
              ) : (
                /* 2. DETAIL PENILAIAN OBE & PESERTA KELAS TERPILIH */
                <div className="space-y-4 animate-fade-in">
                  {/* Banner Info Kelas & Tombol Kembali */}
                  <div className="bg-primary-900 text-white rounded-2xl p-5 md:p-6 shadow-lg border border-primary-700 flex flex-col xl:flex-row xl:items-center justify-between gap-5 w-full overflow-hidden">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="badge badge-yellow text-2xs font-bold uppercase tracking-wider">
                          Kelas Aktif: {selectedKelasObj.nama_kelas} ({selectedKelasObj.kode_kelas})
                        </span>
                        <span className="badge bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-2xs font-bold">
                          Sistem Penilaian OBE
                        </span>
                      </div>
                      <h2 className="text-xl font-black text-white">
                        {selectedKelasObj.mata_kuliah?.nama} ({selectedKelasObj.mata_kuliah?.total_sks} SKS)
                      </h2>
                      <p className="text-xs text-primary-200">
                        Dosen Pengampu: <strong>{selectedKelasObj.dosen_pengampu?.[0]?.dosen?.nama_lengkap || 'Dosen Pengampu'}</strong> • Jadwal: {selectedKelasObj.hari ? selectedKelasObj.hari.toUpperCase() : 'SENIN'} ({selectedKelasObj.ruangan?.nama || 'Ruang Kuliah'})
                      </p>

                      {/* Bobot Kurikulum CPMK */}
                      <div className="flex items-center gap-1.5 pt-1 flex-wrap text-xs">
                        <span className="text-2xs font-bold text-primary-300 uppercase mr-1">Bobot Kurikulum CPMK:</span>
                        {obeKelasData?.cpmks?.map((c: any) => (
                          <span key={c.id} className="badge bg-primary-800 text-primary-100 border border-primary-600 text-2xs font-semibold" title={c.deskripsi}>
                            <strong>{c.kode_cpmk}</strong>: {c.bobot_persentase}% Bobot MK
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
                      <Button
                        variant="primary"
                        icon={<Edit3 size={14} />}
                        className="text-xs font-bold py-2.5 px-4 h-auto bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-sm whitespace-nowrap"
                        onClick={() => router.push(`/siakad/nilai/input/${selectedKelasObj.id}`)}
                      >
                        Input Nilai Kelas (Halaman Penuh)
                      </Button>
                      <Button
                        variant="secondary"
                        icon={<Settings size={14} className="text-slate-800" />}
                        className="text-xs font-bold py-2.5 px-4 h-auto bg-white hover:bg-slate-100 text-slate-900 border-none shadow-sm whitespace-nowrap"
                        onClick={() => setIsObeConfigOpen(true)}
                      >
                        Atur Komponen Asesmen OBE ({obeKelasData?.komponen?.length || 4})
                      </Button>
                      <Button
                        variant="outline"
                        className="text-xs font-bold py-2.5 px-4 h-auto bg-primary-800 hover:bg-primary-700 text-white border-primary-500 whitespace-nowrap"
                        onClick={handleBackToKelasList}
                      >
                        ← Kembali ke Daftar Kelas
                      </Button>
                    </div>
                  </div>

                  {/* Matriks Penilaian OBE Peserta Kelas */}
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                          <Target size={16} className="text-primary-600" />
                          Matriks Nilai Asesmen Dinamis & Evaluasi Ketercapaian CPMK
                        </h3>
                        <p className="text-xs text-slate-500">
                          Nilai akhir dihitung secara proporsional dari seluruh komponen asesmen OBE yang telah diukur.
                        </p>
                      </div>
                    </div>

                    {/* Kotak Edukasi / Panduan Membaca Matriks OBE */}
                    <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-start gap-2.5 text-xs text-blue-900">
                      <AlertCircle size={16} className="text-blue-600 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="font-extrabold block">💡 Panduan Membaca Matriks Penilaian OBE:</span>
                        <p className="text-blue-800 leading-relaxed text-2xs">
                          • <strong>Grup 1 (Komponen Asesmen)</strong>: Nilai riil instrumen penilaian (Tugas, Kuis, UTS, UAS) dengan skala <strong>0–100</strong>. Jika ada lebih dari satu tugas/kuis yang mengukur target CPMK yang sama (misal Tugas & Kuis sama-sama mengukur <em>CPMK-1</em>), nilai masing-masing instrumen tetap berdiri sendiri.<br/>
                          • <strong>Grup 2 (Ketercapaian CPMK)</strong>: Skor perolehan rata-rata terbobot kompetensi mahasiswa untuk masing-masing CPMK (Target kelulusan: <strong>≥ 65.0</strong>).<br/>
                          • <strong>Grup 3 (Rekap Hasil)</strong>: Akumulasi nilai akhir (0–100), konversi nilai huruf, dan bobot mutu SKS.
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs min-w-full">
                        <thead>
                          {/* TIER 1: Super Header Berjenjang */}
                          <tr className="bg-slate-100 text-slate-700 font-extrabold border-y border-slate-300 text-2xs uppercase tracking-wider">
                            <th colSpan={2} className="py-2.5 px-4 text-center">DATA MAHASISWA</th>
                            <th colSpan={obeKelasData?.komponen?.length || 1} className="py-2.5 px-3 text-center border-l border-slate-300 bg-sky-50 text-sky-900">
                              {obeKelasData?.mode_penilaian === 'full_obe'
                                ? '🎯 1. PENCAPAIAN CPMK KELAS (Skor 0 - 100)'
                                : '📋 1. NILAI KOMPONEN ASESMEN (Skor 0 - 100)'}
                            </th>
                            {obeKelasData?.mode_penilaian === 'semi_obe' && (
                              <th colSpan={obeKelasData?.cpmks?.length || 1} className="py-2.5 px-3 text-center border-l border-slate-300 bg-purple-50 text-purple-900">
                                🎯 2. EVALUASI KETERCAPAIAN CPMK (Target ≥65)
                              </th>
                            )}
                            <th colSpan={3} className="py-2.5 px-3 text-center border-l border-slate-300 bg-amber-50 text-amber-900">
                              🏆 {obeKelasData?.mode_penilaian === 'semi_obe' ? '3. REKAPITULASI HASIL' : '2. REKAPITULASI HASIL'}
                            </th>
                            <th className="py-2.5 px-4 text-right border-l border-slate-300">AKSI</th>
                          </tr>

                          {/* TIER 2: Nama-nama Kolom Spesifik */}
                          <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-2xs">
                            <th className="py-3 px-4 w-12 text-center">NO</th>
                            <th className="py-3 px-4 min-w-[180px]">NIM & NAMA MAHASISWA</th>

                            {/* Header Dinamis Komponen */}
                            {obeKelasData?.komponen?.map((comp: any) => (
                              <th key={comp.id} className="py-3 px-3 text-center border-l border-slate-200 bg-sky-50/40 min-w-[120px]">
                                <span className="block text-slate-900 font-black text-xs">{comp.nama_komponen}</span>
                                <div className="flex flex-col items-center gap-0.5 mt-1">
                                  <span className="badge badge-blue text-2xs font-mono font-bold">
                                    Bobot {comp.bobot}%
                                  </span>
                                  {comp.cpmk && obeKelasData?.mode_penilaian === 'semi_obe' && (
                                    <span className="text-2xs text-purple-700 font-bold">
                                      Ukur: {comp.cpmk.kode_cpmk}
                                    </span>
                                  )}
                                </div>
                              </th>
                            ))}

                            {/* Header Ketercapaian CPMK (Hanya untuk Semi-OBE) */}
                            {obeKelasData?.mode_penilaian === 'semi_obe' && obeKelasData?.cpmks?.map((c: any) => (
                              <th key={c.id} className="py-3 px-3 text-center border-l border-slate-200 bg-purple-50/50 min-w-[90px]">
                                <span className="block text-purple-950 font-black text-xs">{c.kode_cpmk}</span>
                                <span className="text-2xs text-purple-700 font-semibold block">Skor Capaian</span>
                              </th>
                            ))}

                            <th className="py-3 px-4 text-center border-l border-slate-200 bg-amber-50/40 font-black text-slate-900">
                              NILAI AKHIR
                            </th>
                            <th className="py-3 px-3 text-center bg-amber-50/40 font-black text-slate-900">HURUF</th>
                            <th className="py-3 px-3 text-center bg-amber-50/40 font-black text-slate-900">MUTU</th>
                            <th className="py-3 px-4 text-right border-l border-slate-200">AKSI</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                          {loadingObeKelas ? (
                            <tr><td colSpan={14} className="py-8 text-center text-slate-400">Memuat matriks nilai...</td></tr>
                          ) : !obeKelasData?.peserta || obeKelasData.peserta.length === 0 ? (
                            <tr><td colSpan={14} className="py-8 text-center text-slate-400">Belum ada mahasiswa terdaftar di kelas ini</td></tr>
                          ) : (
                            obeKelasData.peserta.map((p: any, idx: number) => (
                              <tr key={p.krs_detail_id} className="hover:bg-slate-50/80 transition">
                                <td className="py-3.5 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                                <td className="py-3.5 px-4 font-mono">
                                  <span className="font-bold text-slate-900 block font-sans">{p.mahasiswa?.nama_lengkap}</span>
                                  <span className="text-2xs text-slate-500 font-mono">{p.mahasiswa?.nim}</span>
                                </td>

                                {/* Kolom Nilai per Komponen Dinamis */}
                                {obeKelasData.komponen.map((comp: any) => {
                                  const compScore = p.scores?.[comp.id]?.nilai_angka || 0;
                                  return (
                                    <td key={comp.id} className="py-3.5 px-3 text-center font-mono font-bold text-slate-800 border-l border-slate-100">
                                      {compScore.toFixed(1)}
                                    </td>
                                  );
                                })}

                                {/* Kolom Ketercapaian CPMK (Hanya Semi-OBE) */}
                                {obeKelasData?.mode_penilaian === 'semi_obe' && obeKelasData.cpmks.map((c: any) => {
                                  const att = p.cpmk_attainment?.[c.id];
                                  const score = att?.skor || 0;
                                  const isPassed = att?.is_tercapai ?? (score >= 65);
                                  return (
                                    <td key={c.id} className="py-3.5 px-3 text-center border-l border-slate-100 bg-primary-50/20">
                                      <span className={`badge text-2xs font-bold ${isPassed ? 'badge-green' : 'badge-red'}`}>
                                        {score.toFixed(1)} {isPassed ? '✓' : '✗'}
                                      </span>
                                    </td>
                                  );
                                })}

                                <td className="py-3.5 px-4 text-center font-mono font-black text-slate-900 border-l border-slate-200 bg-slate-50">
                                  {Number(p.nilai_akhir).toFixed(2)}
                                </td>
                                <td className="py-3.5 px-3 text-center font-black text-primary-700">
                                  {p.nilai_huruf}
                                </td>
                                <td className="py-3.5 px-3 text-center font-mono text-emerald-700 font-bold">
                                  {Number(p.bobot_mutu).toFixed(2)}
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {obeKelasData?.mode_penilaian !== 'konvensional' && (
                                      <Button
                                        variant="outline"
                                        icon={<Award size={13} />}
                                        className="text-2xs py-1 px-2.5 h-auto font-bold text-purple-700 border-purple-200 hover:bg-purple-50 whitespace-nowrap"
                                        onClick={() => handleOpenStudentPortoDrawer(p.mahasiswa)}
                                      >
                                        Porto Capaian
                                      </Button>
                                    )}
                                    <Button
                                      variant="primary"
                                      icon={<Edit3 size={13} />}
                                      className="text-2xs py-1 px-2.5 h-auto font-bold whitespace-nowrap"
                                      onClick={() => router.push(`/siakad/nilai/input/${selectedKelasObj.id}`)}
                                    >
                                      Input Nilai
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )
            ) : (
              /* VIEW UNTUK MAHASISWA (KHS SEMESTER AKTIF BERBASIS OBE) */
              <div className="space-y-4">
                <DataTable
                  columns={studentKhsColumns}
                  data={nilaiList}
                  isLoading={loading}
                  emptyMessage="Belum ada nilai atau KHS yang diterbitkan pada semester ini."
                />

                {/* Ringkasan Indeks Prestasi Semester (IPS) Mahasiswa */}
                {nilaiList.length > 0 && (
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-6 text-xs text-slate-600">
                      <div>
                        <span className="text-slate-400 block text-2xs uppercase font-bold">Total SKS Semester</span>
                        <strong className="text-slate-900 text-sm font-mono">
                          {nilaiList.reduce((acc, curr) => acc + (curr.krs_detail?.kelas?.mata_kuliah?.total_sks || 3), 0)} SKS
                        </strong>
                      </div>
                      <div className="h-8 w-px bg-slate-200" />
                      <div>
                        <span className="text-slate-400 block text-2xs uppercase font-bold">Mata Kuliah Lulus</span>
                        <strong className="text-emerald-700 text-sm">
                          {nilaiList.filter((n) => n.nilai_huruf !== 'E' && n.nilai_huruf !== 'D').length} / {nilaiList.length} MK
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-700">Indeks Prestasi Semester (IPS):</span>
                      <span className="text-base font-mono font-black text-primary-700 bg-primary-50 px-4 py-1.5 rounded-xl border border-primary-200 shadow-2xs">
                        {(() => {
                          const totalSks = nilaiList.reduce((acc, curr) => acc + (curr.krs_detail?.kelas?.mata_kuliah?.total_sks || 3), 0);
                          const totalBobot = nilaiList.reduce((acc, curr) => acc + ((curr.bobot_mutu || 0) * (curr.krs_detail?.kelas?.mata_kuliah?.total_sks || 3)), 0);
                          return totalSks > 0 ? (totalBobot / totalSks).toFixed(2) : '0.00';
                        })()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: PORTOFOLIO CAPAIAN PEMBELAJARAN OBE (CPL & CPMK) */}
        {/* ======================================================== */}
        {activeTab === 'portofolio_obe' && (
          <div className="space-y-6 animate-fade-in">
            {/* Student Directory selector jika Admin / Dosen */}
            {!isMahasiswa && !selectedMahasiswa ? (
              <div className="space-y-4">
                <DataTable
                  columns={mhsPortoColumns}
                  data={mahasiswaDirectory}
                  isLoading={loadingMhs}
                  emptyMessage="Tidak ada mahasiswa ditemukan."
                />

                {/* Drawer Filter Mahasiswa Portofolio */}
                <Drawer
                  open={showFilter && activeTab === 'portofolio_obe'}
                  onClose={() => setShowFilter(false)}
                  title="Filter Direktori Mahasiswa"
                  footer={
                    <div className="flex justify-end gap-3">
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setSearchMhs('');
                          setFilterProdiMhs('');
                          setShowFilter(false);
                        }}
                      >
                        Reset
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => setShowFilter(false)}
                      >
                        Terapkan
                      </Button>
                    </div>
                  }
                >
                  <div className="flex flex-col gap-5">
                    <Input
                      label="Pencarian Mahasiswa"
                      placeholder="Cari NIM atau nama mahasiswa..."
                      value={searchMhs}
                      onChange={(e) => setSearchMhs(e.target.value)}
                    />

                    <div>
                      <label className="label">Program Studi</label>
                      <select
                        value={filterProdiMhs}
                        onChange={(e) => setFilterProdiMhs(e.target.value)}
                        className="select w-full"
                      >
                        <option value="">Semua Program Studi</option>
                        {prodis.map((p) => (
                          <option key={p.id} value={p.id}>{p.nama}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </Drawer>
              </div>
            ) : (
              /* DETAIL PORTOFOLIO MAHASISWA TERPILIH */
              <div className="space-y-6 animate-fade-in">
                {!isMahasiswa && selectedMahasiswa && (
                  <div className="bg-primary-900 text-white rounded-2xl p-5 shadow-lg border border-primary-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <span className="badge badge-yellow text-2xs font-bold uppercase tracking-wider">
                        Portofolio Mahasiswa Terpilih
                      </span>
                      <h2 className="text-lg font-black text-white mt-1">
                        {selectedMahasiswa.nama_lengkap} (NIM: {selectedMahasiswa.nim})
                      </h2>
                      <p className="text-xs text-primary-200 mt-0.5">
                        Program Studi: <strong>{selectedMahasiswa.program_studi?.nama}</strong> • Angkatan: <strong>{selectedMahasiswa.angkatan || 2026}</strong> • IPK: <strong>{Number(selectedMahasiswa.ipk || 0).toFixed(2)}</strong>
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      className="text-xs font-bold py-2 px-3.5 h-auto bg-primary-800 hover:bg-primary-700 text-white border-primary-500 whitespace-nowrap"
                      onClick={() => {
                        setSelectedMahasiswa(null);
                        setPortofolioObeData(null);
                      }}
                    >
                      ← Kembali ke Direktori Mahasiswa
                    </Button>
                  </div>
                )}

                {/* Radar & Progress Cards Capaian CPL */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {portofolioObeData?.cpl_summary?.map((cpl: any) => {
                    const score = Number(cpl.skor_rata_rata || 0);
                    return (
                      <div key={cpl.cpl_id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="badge badge-purple font-mono font-black text-xs">{cpl.kode_cpl}</span>
                          <span className="badge badge-blue text-2xs uppercase font-bold">{cpl.kategori.replace('_', ' ')}</span>
                        </div>

                        <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                          {cpl.deskripsi}
                        </p>

                        <div className="space-y-1.5 pt-2">
                          <div className="flex justify-between text-xs font-mono font-bold">
                            <span className="text-slate-500">Ketercapaian Standar:</span>
                            <span className="text-primary-700 text-sm font-black">{score}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 rounded-full ${
                                score >= 80 ? 'bg-emerald-500' : score >= 65 ? 'bg-primary-500' : score > 0 ? 'bg-amber-500' : 'bg-slate-200'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                            />
                          </div>
                        </div>

                        <div className="pt-2 flex justify-between items-center text-2xs text-slate-500 border-t border-slate-100">
                          <span>Status: <strong className={score >= 65 && cpl.total_mata_kuliah_diukur > 0 ? 'text-emerald-700' : 'text-slate-500'}>{cpl.status}</strong></span>
                          <span>Diukur pada {cpl.total_mata_kuliah_diukur || 0} Mata Kuliah</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: TRANSKRIP AKADEMIK KUMULATIF */}
        {/* ======================================================== */}
        {activeTab === 'transkrip' && (
          <div className="space-y-4">
            {/* Search selector jika bukan mahasiswa */}
            {!isMahasiswa && !selectedMahasiswa ? (
              <div className="space-y-4">
                <DataTable
                  columns={mhsTranskripColumns}
                  data={mahasiswaDirectory}
                  isLoading={loadingMhs}
                  emptyMessage="Tidak ada mahasiswa ditemukan."
                />

                {/* Drawer Filter Mahasiswa Transkrip */}
                <Drawer
                  open={showFilter && activeTab === 'transkrip'}
                  onClose={() => setShowFilter(false)}
                  title="Pencarian Mahasiswa Transkrip"
                  footer={
                    <div className="flex justify-end gap-3">
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setSearchMhs('');
                          setFilterProdiMhs('');
                          setShowFilter(false);
                        }}
                      >
                        Reset
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => setShowFilter(false)}
                      >
                        Terapkan
                      </Button>
                    </div>
                  }
                >
                  <div className="flex flex-col gap-5">
                    <Input
                      label="Pencarian Mahasiswa"
                      placeholder="Cari NIM atau nama mahasiswa..."
                      value={searchMhs}
                      onChange={(e) => setSearchMhs(e.target.value)}
                    />

                    <div>
                      <label className="label">Program Studi</label>
                      <select
                        value={filterProdiMhs}
                        onChange={(e) => setFilterProdiMhs(e.target.value)}
                        className="select w-full"
                      >
                        <option value="">Semua Program Studi</option>
                        {prodis.map((p) => (
                          <option key={p.id} value={p.id}>{p.nama}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </Drawer>
              </div>
            ) : (
              !isMahasiswa && selectedMahasiswa && (
                <div className="bg-primary-900 text-white rounded-2xl p-5 shadow-lg border border-primary-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="badge badge-yellow text-2xs font-bold uppercase tracking-wider">
                      Transkrip Mahasiswa Terpilih
                    </span>
                    <h2 className="text-lg font-black text-white mt-1">
                      {selectedMahasiswa.nama_lengkap} (NIM: {selectedMahasiswa.nim})
                    </h2>
                    <p className="text-xs text-primary-200 mt-0.5">
                      Program Studi: <strong>{selectedMahasiswa.program_studi?.nama}</strong> • Angkatan: <strong>{selectedMahasiswa.angkatan || 2026}</strong>
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    className="text-xs font-bold py-2 px-3.5 h-auto bg-primary-800 hover:bg-primary-700 text-white border-primary-500 whitespace-nowrap"
                    onClick={() => setSelectedMahasiswa(null)}
                  >
                    ← Ganti / Pilih Mahasiswa Lain
                  </Button>
                </div>
              )
            )}

            {/* Tabel Transkrip (Standard DataTable) */}
            <div className="space-y-4">
              <DataTable
                columns={transkripColumns}
                data={transkripData?.items || []}
                isLoading={loadingTranskrip}
                emptyMessage="Belum ada rekaman transkrip nilai akademik."
              />

              {/* Ringkasan IPK dan Total SKS Transkrip */}
              {transkripData?.ringkasan && (
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-6 text-xs text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-2xs uppercase font-bold">Total SKS Lulus</span>
                      <strong className="text-slate-900 text-sm font-mono">{transkripData.ringkasan.total_sks_lulus} SKS</strong>
                    </div>
                    <div className="h-8 w-px bg-slate-200" />
                    <div>
                      <span className="text-slate-400 block text-2xs uppercase font-bold">Total Angka Mutu</span>
                      <strong className="text-slate-900 text-sm font-mono">{transkripData.ringkasan.total_mutu}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-700">Indeks Prestasi Kumulatif (IPK):</span>
                    <span className="text-base font-mono font-black text-emerald-700 bg-emerald-50 px-4 py-1.5 rounded-xl border border-emerald-200 shadow-2xs">
                      {transkripData.ringkasan.ipk}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL PENGATURAN KOMPONEN ASESMEN OBE KELAS */}
      {/* ======================================================== */}
      {isObeConfigOpen && selectedKelasObj && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Settings size={16} className="text-primary-600" />
                  Pengaturan Komponen Asesmen OBE Kelas
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedKelasObj.mata_kuliah?.nama} ({selectedKelasObj.kode_kelas})
                </p>
              </div>
              <button onClick={() => setIsObeConfigOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            {/* Subtab Switcher */}
            <div className="flex items-center gap-2 border-b border-slate-200">
              <button
                type="button"
                onClick={() => setObeConfigTab('komponen')}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-extrabold border-b-2 transition -mb-px cursor-pointer ${
                  obeConfigTab === 'komponen'
                    ? 'border-primary-600 text-primary-600 bg-primary-50/40 rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <Layers size={14} />
                Komponen Asesmen Dinamis ({obeKelasData?.komponen?.length || 0})
              </button>

              {obeKelasData?.mode_penilaian !== 'konvensional' && (
                <button
                  type="button"
                  onClick={() => setObeConfigTab('cpmk')}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-extrabold border-b-2 transition -mb-px cursor-pointer ${
                    obeConfigTab === 'cpmk'
                      ? 'border-primary-600 text-primary-600 bg-primary-50/40 rounded-t-lg'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Target size={14} />
                  Kelola CPMK Mata Kuliah ({obeKelasData?.cpmks?.length || 0} CPMK)
                </button>
              )}
            </div>

            {/* TAB 1: KOMPONEN ASESMEN */}
            {obeConfigTab === 'komponen' && (
              <div className="space-y-4">
                {/* Form Tambah/Edit Komponen */}
                <form onSubmit={handleSaveKomponen} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <span className="text-xs font-black text-slate-800 uppercase block">
                    {editingKomponen ? 'Edit Komponen Asesmen' : '+ Tambah Komponen Asesmen Baru'}
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="sm:col-span-2">
                      <label className="block text-slate-600 font-bold mb-1">Nama Komponen Asesmen</label>
                      <input
                        type="text"
                        placeholder="e.g. Tugas Mandiri, Proyek PBL, Kuis..."
                        value={formKomponen.nama_komponen}
                        onChange={(e) => setFormKomponen({ ...formKomponen, nama_komponen: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-xs outline-none focus:border-primary-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Bobot Persentase (%)</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={formKomponen.bobot}
                        onChange={(e) => setFormKomponen({ ...formKomponen, bobot: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-xs outline-none focus:border-primary-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Teknik Asesmen</label>
                      <select
                        value={formKomponen.teknik_penilaian}
                        onChange={(e) => setFormKomponen({ ...formKomponen, teknik_penilaian: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-xs outline-none"
                      >
                        <option value="tugas">Tugas Terstruktur</option>
                        <option value="kuis">Kuis Formatif</option>
                        <option value="proyek">Proyek (PBL)</option>
                        <option value="tes_tulis">Tes Tulis (UTS/UAS)</option>
                        <option value="praktikum">Praktikum Laboratorium</option>
                        <option value="portofolio">Portofolio</option>
                        <option value="unjuk_kerja">Unjuk Kerja</option>
                      </select>
                    </div>

                    {obeKelasData?.mode_penilaian === 'semi_obe' && (
                      <div className="sm:col-span-2">
                        <label className="block text-slate-600 font-bold mb-1">Target Capaian Pembelajaran (CPMK)</label>
                        <select
                          value={formKomponen.cpmk_id}
                          onChange={(e) => setFormKomponen({ ...formKomponen, cpmk_id: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-xs outline-none"
                        >
                          <option value="">-- Pengukuran Umum Mata Kuliah --</option>
                          {obeKelasData?.cpmks?.map((c: any) => (
                            <option key={c.id} value={c.id}>
                              {c.kode_cpmk} {c.deskripsi ? `- ${c.deskripsi.substring(0, 50)}...` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    {editingKomponen && (
                      <Button
                        type="button"
                        variant="outline"
                        className="text-xs"
                        onClick={() => {
                          setEditingKomponen(null);
                          setFormKomponen({ nama_komponen: '', teknik_penilaian: 'tugas', bobot: 20, cpmk_id: '' });
                        }}
                      >
                        Batal Edit
                      </Button>
                    )}
                    <Button type="submit" variant="primary" className="text-xs font-bold" disabled={savingKomponen}>
                      {savingKomponen ? 'Menyimpan...' : editingKomponen ? 'Perbarui Komponen' : '+ Tambah Komponen'}
                    </Button>
                  </div>
                </form>

                {/* List Komponen Aktif */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 block">Daftar Komponen Asesmen Terdaftar:</span>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                    {obeKelasData?.komponen?.map((comp: any) => (
                      <div key={comp.id} className="p-3 flex items-center justify-between bg-white hover:bg-slate-50">
                        <div>
                          <strong className="font-bold text-slate-900">{comp.nama_komponen}</strong>
                          <div className="flex items-center gap-2 text-2xs text-slate-500 mt-0.5">
                            <span className="badge badge-purple text-2xs font-mono">{comp.bobot}%</span>
                            <span className="capitalize text-slate-600">
                              Teknik: {comp.teknik_penilaian ? comp.teknik_penilaian.replace('_', ' ') : 'Asesmen CPMK'}
                            </span>
                            {comp.cpmk && <span className="font-bold text-primary-700">Target: {comp.cpmk.kode_cpmk}</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            icon={<Edit3 size={12} />}
                            className="text-2xs py-1 px-2 h-auto"
                            onClick={() => {
                              setEditingKomponen(comp);
                              setFormKomponen({
                                nama_komponen: comp.nama_komponen,
                                teknik_penilaian: comp.teknik_penilaian || 'tugas',
                                bobot: comp.bobot,
                                cpmk_id: comp.cpmk_id || '',
                              });
                            }}
                          />
                          <Button
                            variant="outline"
                            icon={<Trash2 size={12} className="text-rose-600" />}
                            className="text-2xs py-1 px-2 h-auto hover:bg-rose-50"
                            onClick={() => handleDeleteKomponen(comp.id)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: KELOLA & TAMBAH CPMK CUSTOM */}
            {obeConfigTab === 'cpmk' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-slate-600">
                    Dosen dapat menambah atau merumuskan CPMK custom (CPMK-4, CPMK-5, dst) sesuai rancangan RPS.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    icon={<Plus size={13} />}
                    className="text-2xs py-1 px-2.5 h-auto font-bold text-primary-700"
                    onClick={() => {
                      setIsAddingCpmk(!isAddingCpmk);
                      setCpmkFormCustom({
                        kode_cpmk: `CPMK-${(obeKelasData?.cpmks?.length || 3) + 1}`,
                        deskripsi: '',
                        bobot_persentase: 25,
                        cpl_id: '',
                      });
                    }}
                  >
                    {isAddingCpmk ? 'Tutup Form' : '+ Tambah CPMK Baru'}
                  </Button>
                </div>

                {isAddingCpmk && (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!selectedKelasObj?.mata_kuliah_id) return;
                      try {
                        setSavingCpmkCustom(true);
                        await siakadService.storeCpmk({
                          ...cpmkFormCustom,
                          mata_kuliah_id: selectedKelasObj.mata_kuliah_id,
                        });
                        toast.success('CPMK baru berhasil ditambahkan untuk mata kuliah ini');
                        setIsAddingCpmk(false);
                        fetchObeKelasData(selectedKelasObj.id);
                      } catch (err: any) {
                        toast.error('Gagal menambahkan CPMK');
                      } finally {
                        setSavingCpmkCustom(false);
                      }
                    }}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-600 font-bold mb-1">Kode CPMK (e.g. CPMK-4)</label>
                        <input
                          type="text"
                          required
                          value={cpmkFormCustom.kode_cpmk}
                          onChange={(e) => setCpmkFormCustom({ ...cpmkFormCustom, kode_cpmk: e.target.value })}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 font-bold mb-1">Bobot Kurikulum MK (%)</label>
                        <input
                          type="number"
                          required
                          min="1"
                          max="100"
                          value={cpmkFormCustom.bobot_persentase}
                          onChange={(e) => setCpmkFormCustom({ ...cpmkFormCustom, bobot_persentase: Number(e.target.value) })}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Deskripsi Rumusan CPMK</label>
                      <textarea
                        rows={2}
                        required
                        placeholder="Tuliskan kemampuan spesifik yang diharapkan..."
                        value={cpmkFormCustom.deskripsi}
                        onChange={(e) => setCpmkFormCustom({ ...cpmkFormCustom, deskripsi: e.target.value })}
                        className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="submit" variant="primary" className="text-2xs py-1 px-3 h-auto font-bold" disabled={savingCpmkCustom}>
                        {savingCpmkCustom ? 'Menyimpan...' : 'Simpan CPMK Baru'}
                      </Button>
                    </div>
                  </form>
                )}

                {/* List CPMK yang Terdaftar */}
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                  {obeKelasData?.cpmks?.map((cpmk: any) => (
                    <div key={cpmk.id} className="p-3.5 flex items-center justify-between bg-white hover:bg-slate-50">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="badge badge-purple font-mono font-black text-2xs">{cpmk.kode_cpmk}</span>
                          <span className="badge badge-blue font-mono font-bold text-2xs">Bobot: {cpmk.bobot_persentase}%</span>
                          {cpmk.cpl && (
                            <span className="badge badge-gray text-2xs font-bold font-mono">
                              Korelasi: {cpmk.cpl.kode_cpl}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-800 font-medium leading-relaxed">{cpmk.deskripsi}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL INPUT NILAI MAHASISWA (OBE KOMPONEN DINAMIS) */}
      {/* ======================================================== */}
      {editingPesertaObe && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Target size={16} className="text-primary-600" />
                  Input Nilai Asesmen OBE Mahasiswa
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {editingPesertaObe.mahasiswa?.nim} - {editingPesertaObe.mahasiswa?.nama_lengkap}
                </p>
              </div>
              <button onClick={() => setEditingPesertaObe(null)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveObeScores} className="space-y-4">
              <div className="space-y-3 text-xs max-h-64 overflow-y-auto pr-1">
                {obeKelasData?.komponen?.map((comp: any) => (
                  <div key={comp.id} className="flex items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-slate-800 font-bold">{comp.nama_komponen}</label>
                      <span className="text-2xs text-slate-500">
                        Bobot: <strong>{comp.bobot}%</strong> {comp.cpmk ? `• ${comp.cpmk.kode_cpmk}` : ''}
                      </span>
                    </div>

                    <div className="w-24">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={formObeScores[comp.id] ?? 0}
                        onChange={(e) => setFormObeScores({
                          ...formObeScores,
                          [comp.id]: Number(e.target.value)
                        })}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-mono text-sm font-bold text-center focus:border-primary-500 outline-none"
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Live Preview Kalkulasi OBE */}
              {(() => {
                let akhir = 0;
                obeKelasData?.komponen?.forEach((c: any) => {
                  const val = formObeScores[c.id] || 0;
                  akhir += (val * Number(c.bobot)) / 100;
                });

                let huruf = 'E';
                let mutu = 0.00;
                if (akhir >= 85) { huruf = 'A'; mutu = 4.00; }
                else if (akhir >= 80) { huruf = 'A-'; mutu = 3.75; }
                else if (akhir >= 75) { huruf = 'B+'; mutu = 3.25; }
                else if (akhir >= 70) { huruf = 'B'; mutu = 3.00; }
                else if (akhir >= 65) { huruf = 'B-'; mutu = 2.75; }
                else if (akhir >= 60) { huruf = 'C+'; mutu = 2.25; }
                else if (akhir >= 55) { huruf = 'C'; mutu = 2.00; }
                else if (akhir >= 40) { huruf = 'D'; mutu = 1.00; }

                return (
                  <div className="bg-primary-50 p-3.5 rounded-xl border border-primary-200 flex items-center justify-between">
                    <div>
                      <span className="text-2xs text-primary-700 block uppercase font-bold">Nilai Akhir OBE</span>
                      <span className="text-base font-black text-slate-900 font-mono">{akhir.toFixed(2)}</span>
                    </div>
                    <div className="text-center">
                      <span className="text-2xs text-primary-700 block uppercase font-bold">Nilai Huruf</span>
                      <span className="text-base font-black text-primary-800 font-mono">{huruf}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-2xs text-primary-700 block uppercase font-bold">Bobot Mutu</span>
                      <span className="text-base font-black text-emerald-700 font-mono">{mutu.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is_final_obe"
                  checked={isFinalObe}
                  onChange={(e) => setIsFinalObe(e.target.checked)}
                  className="rounded text-primary-600 focus:ring-primary-500 cursor-pointer"
                />
                <label htmlFor="is_final_obe" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Kunci Nilai sebagai Nilai Final (KHS & Rekap Ketercapaian CPMK)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" className="text-xs" onClick={() => setEditingPesertaObe(null)}>
                  Batal
                </Button>
                <Button type="submit" variant="primary" className="text-xs font-bold" disabled={savingObeScores}>
                  {savingObeScores ? 'Menyimpan...' : 'Simpan Nilai OBE'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DRAWER PORTOFOLIO CAPAIAN OBE MAHASISWA DARI INPUT NILAI */}
      {/* ======================================================== */}
      <Drawer
        open={!!portoDrawerStudent}
        onClose={() => {
          setPortoDrawerStudent(null);
          setDrawerPortoData(null);
        }}
        title="Portofolio Capaian OBE Mahasiswa"
        footer={
          <div className="flex items-center justify-between gap-3 w-full">
            <Button
              variant="secondary"
              onClick={() => {
                setPortoDrawerStudent(null);
                setDrawerPortoData(null);
              }}
            >
              Tutup
            </Button>
            <Button
              variant="primary"
              icon={<Award size={14} />}
              onClick={() => {
                const std = portoDrawerStudent;
                setPortoDrawerStudent(null);
                setDrawerPortoData(null);
                setSelectedMahasiswa(std);
                setActiveTab('portofolio_obe');
              }}
            >
              Buka Tab Portofolio Lengkap →
            </Button>
          </div>
        }
      >
        {portoDrawerStudent && (
          <div className="space-y-6">
            {/* Header Ringkasan Mahasiswa */}
            <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 space-y-1">
              <span className="badge badge-purple text-2xs font-bold uppercase tracking-wider">
                Profil Mahasiswa
              </span>
              <h3 className="text-base font-extrabold text-slate-900 mt-1">
                {portoDrawerStudent.nama_lengkap}
              </h3>
              <p className="text-xs text-slate-600 font-mono">
                NIM: <strong>{portoDrawerStudent.nim}</strong> • Angkatan: <strong>{portoDrawerStudent.angkatan || 2026}</strong>
              </p>
              <p className="text-xs text-primary-700 font-semibold">
                Program Studi: {portoDrawerStudent.program_studi?.nama || '-'} • IPK: {Number(portoDrawerStudent.ipk || 0).toFixed(2)}
              </p>
            </div>

            {loadingDrawerPorto ? (
              <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                Memuat rincian ketercapaian CPMK & CPL mahasiswa...
              </div>
            ) : (
              <div className="space-y-5">
                {/* 1. Ketercapaian CPMK pada Kelas Terpilih */}
                {selectedKelasObj && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5 border-b pb-2">
                      <Layers size={14} className="text-primary-600" />
                      Capaian CPMK Kelas: {selectedKelasObj.mata_kuliah?.nama}
                    </h4>
                    <div className="space-y-2">
                      {obeKelasData?.cpmks?.map((cpmk: any) => {
                        const mhsInClass = obeKelasData?.peserta?.find(
                          (p: any) => p.mahasiswa?.id === portoDrawerStudent.id
                        );
                        const att = mhsInClass?.cpmk_attainment?.[cpmk.id];
                        const score = att?.skor || 0;
                        const isPassed = att?.is_tercapai ?? (score >= 65);

                        return (
                          <div key={cpmk.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-xs text-slate-900">{cpmk.kode_cpmk}</span>
                              <span className={`badge text-2xs font-bold ${isPassed ? 'badge-green' : 'badge-red'}`}>
                                Skor: {score.toFixed(1)} {isPassed ? '✓ Tercapai' : '✗ Belum'}
                              </span>
                            </div>
                            <p className="text-2xs text-slate-600 leading-normal">{cpmk.deskripsi}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Evaluasi Ketercapaian CPL Kumulatif */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5 border-b pb-2">
                    <Award size={14} className="text-primary-600" />
                    Ketercapaian CPL Lulusan (Kumulatif)
                  </h4>
                  <div className="space-y-3">
                    {drawerPortoData?.cpl_summary?.map((cpl: any) => {
                      const score = Number(cpl.skor_rata_rata || 0);
                      return (
                        <div key={cpl.cpl_id} className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="badge badge-purple font-mono font-black text-xs">{cpl.kode_cpl}</span>
                            <span className="text-xs font-black text-primary-700 font-mono">{score}%</span>
                          </div>
                          <p className="text-2xs font-medium text-slate-700">{cpl.deskripsi}</p>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all rounded-full ${
                                score >= 80 ? 'bg-emerald-500' : score >= 65 ? 'bg-primary-500' : score > 0 ? 'bg-amber-500' : 'bg-slate-200'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-3xs text-slate-400 font-semibold">
                            <span>Status: <strong className={score >= 65 && cpl.total_mata_kuliah_diukur > 0 ? 'text-emerald-700' : 'text-slate-500'}>{cpl.status}</strong></span>
                            <span>Diukur pada {cpl.total_mata_kuliah_diukur || 0} MK</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* ======================================================== */}
      {/* MODAL CETAK KHS SEMESTER (PRINT TEMPLATE) */}
      {/* ======================================================== */}
      {isPrintKhsOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in print:p-0 print:m-0 print:static print:bg-white print:overflow-visible">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 max-h-[95vh] overflow-y-auto space-y-6 print:p-0 print:m-0 print:max-w-none print:border-none print:shadow-none print:max-h-none print:overflow-visible">
            <div className="flex items-center justify-between border-b pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <span className="badge badge-purple font-bold">Kartu Hasil Studi (KHS) OBE</span>
                <span className="text-xs text-slate-500 font-mono">Periode: {selectedTaObj?.nama || 'Semester Aktif'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  icon={<Printer size={15} />}
                  className="font-bold text-xs"
                  onClick={() => window.print()}
                >
                  Cetak Dokumen Resmi (PDF)
                </Button>
                <Button variant="outline" className="text-xs" onClick={() => setIsPrintKhsOpen(false)}>
                  ✕ Tutup
                </Button>
              </div>
            </div>

            {/* DOKUMEN CETAK KHS */}
            <div className="printable-document p-8 border border-slate-300 rounded-xl bg-white space-y-6 text-slate-900 leading-relaxed shadow-xs print:p-0 print:border-none print:space-y-4 print:shadow-none">
              <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
                <div>
                  <h2 className="font-black text-base tracking-wider uppercase text-slate-900">UNIVERSITAS SSO CAMPUS</h2>
                  <h3 className="font-bold text-xs text-slate-700 uppercase">{mhs?.program_studi?.fakultas?.nama || 'FAKULTAS TEKNOLOGI INFORMASI'}</h3>
                  <p className="text-[10px] text-slate-600">Jl. Kampus Terpadu No. 1 • Telp: (021) 789-0123 • Email: baak@campus.ac.id</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-primary-900 uppercase tracking-widest font-mono">KARTU HASIL STUDI (KHS)</div>
                  <div className="text-xs font-mono font-bold text-slate-700">{selectedTaObj?.nama || 'Tahun Akademik 2026/2027'}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <div>Nama Mahasiswa: <strong className="font-bold">{mhs?.nama_lengkap}</strong></div>
                  <div>Nomor Induk Mahasiswa (NIM): <strong className="font-mono">{mhs?.nim}</strong></div>
                  <div>Dosen Pembimbing Akademik: <strong>{mhs?.dosen_wali?.nama_lengkap || 'Dr. Ir. Ahmad Santoso, M.Kom'}</strong></div>
                </div>
                <div className="space-y-1">
                  <div>Program Studi: <strong>{mhs?.program_studi?.nama} ({mhs?.program_studi?.jenjang || 'S1'})</strong></div>
                  <div>Tahun Masuk / Angkatan: <strong className="font-mono">{mhs?.angkatan || 2023}</strong></div>
                  <div>Model Pembelajaran: <strong className="text-primary-700">Outcome-Based Education (OBE)</strong></div>
                </div>
              </div>

              <table className="w-full text-left text-xs border border-slate-300">
                <thead className="bg-slate-100 text-slate-800 font-bold uppercase border-b border-slate-300">
                  <tr>
                    <th className="py-2 px-3 text-center border-r border-slate-300 w-10">NO</th>
                    <th className="py-2 px-3 border-r border-slate-300 w-24">KODE</th>
                    <th className="py-2 px-3 border-r border-slate-300">MATA KULIAH</th>
                    <th className="py-2 px-3 text-center border-r border-slate-300 w-14">SKS</th>
                    <th className="py-2 px-3 text-center border-r border-slate-300 w-14">NILAI</th>
                    <th className="py-2 px-3 text-center border-r border-slate-300 w-14">MUTU</th>
                    <th className="py-2 px-3 text-center w-16">K X M</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {nilaiList.map((n, idx) => {
                    const mk = n.krs_detail?.kelas?.mata_kuliah;
                    const sks = mk?.total_sks || 3;
                    const mutu = Number(n.bobot_mutu || 4);
                    return (
                      <tr key={idx}>
                        <td className="py-2 px-3 text-center border-r border-slate-300">{idx + 1}</td>
                        <td className="py-2 px-3 font-mono font-bold border-r border-slate-300">{mk?.kode_mk || 'MK'}</td>
                        <td className="py-2 px-3 font-medium border-r border-slate-300">{mk?.nama || 'Mata Kuliah'}</td>
                        <td className="py-2 px-3 text-center font-bold border-r border-slate-300">{sks}</td>
                        <td className="py-2 px-3 text-center font-bold border-r border-slate-300 text-primary-700">{n.nilai_huruf || 'A'}</td>
                        <td className="py-2 px-3 text-center font-mono border-r border-slate-300">{mutu.toFixed(2)}</td>
                        <td className="py-2 px-3 text-center font-bold">{(sks * mutu).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>Indeks Prestasi Semester (IPS): <strong className="font-mono text-base text-primary-900">{summary?.ips !== undefined ? Number(summary.ips).toFixed(2) : '0.00'}</strong></div>
                <div>Indeks Prestasi Kumulatif (IPK): <strong className="font-mono text-base text-primary-900">{summary?.ipk !== undefined ? Number(summary.ipk).toFixed(2) : '0.00'}</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL CETAK TRANSKRIP AKADEMIK (PRINT TEMPLATE) */}
      {/* ======================================================== */}
      {isPrintTranskripOpen && transkripData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in print:p-0 print:m-0 print:static print:bg-white print:overflow-visible">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 max-h-[95vh] overflow-y-auto space-y-6 print:p-0 print:m-0 print:max-w-none print:border-none print:shadow-none print:max-h-none print:overflow-visible">
            <div className="flex items-center justify-between border-b pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <span className="badge badge-purple font-bold">Transkrip Nilai Akademik Lengkap</span>
                <span className="text-xs text-slate-500 font-mono">TRX-{mhs?.nim}-OFFICIAL</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  icon={<Printer size={15} />}
                  className="font-bold text-xs"
                  onClick={() => window.print()}
                >
                  Cetak Dokumen Resmi (PDF)
                </Button>
                <Button variant="outline" className="text-xs" onClick={() => setIsPrintTranskripOpen(false)}>
                  ✕ Tutup
                </Button>
              </div>
            </div>

            {/* DOKUMEN CETAK TRANSKRIP */}
            <div className="printable-document p-8 border border-slate-300 rounded-xl bg-white space-y-6 text-slate-900 leading-relaxed shadow-xs print:p-0 print:border-none print:space-y-4 print:shadow-none">
              <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
                <div>
                  <h2 className="font-black text-base tracking-wider uppercase text-slate-900">UNIVERSITAS SSO CAMPUS</h2>
                  <h3 className="font-bold text-xs text-slate-700 uppercase">{mhs?.program_studi?.fakultas?.nama || 'FAKULTAS TEKNOLOGI INFORMASI'}</h3>
                  <p className="text-[10px] text-slate-600">Jl. Kampus Terpadu No. 1 • Telp: (021) 789-0123 • Email: baak@campus.ac.id</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-primary-900 uppercase tracking-widest font-mono">TRANSKRIP AKADEMIK OBE</div>
                  <div className="text-xs font-mono font-bold text-slate-700">NOMOR: {mhs?.nim}/TRX/{new Date().getFullYear()}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <div>Nama Mahasiswa: <strong className="font-bold">{mhs?.nama_lengkap}</strong></div>
                  <div>Nomor Induk Mahasiswa (NIM): <strong className="font-mono">{mhs?.nim}</strong></div>
                </div>
                <div className="space-y-1">
                  <div>Program Studi: <strong>{mhs?.program_studi?.nama} ({mhs?.program_studi?.jenjang || 'S1'})</strong></div>
                  <div>Tahun Masuk / Angkatan: <strong className="font-mono">{mhs?.angkatan || 2023}</strong></div>
                </div>
              </div>

              <table className="w-full text-left text-xs border border-slate-300">
                <thead className="bg-slate-100 text-slate-800 font-bold uppercase border-b border-slate-300">
                  <tr>
                    <th className="py-2 px-3 text-center border-r border-slate-300 w-10">NO</th>
                    <th className="py-2 px-3 border-r border-slate-300 w-24">KODE MK</th>
                    <th className="py-2 px-3 border-r border-slate-300">MATA KULIAH</th>
                    <th className="py-2 px-3 text-center border-r border-slate-300 w-14">SKS (K)</th>
                    <th className="py-2 px-3 text-center border-r border-slate-300 w-14">NILAI (N)</th>
                    <th className="py-2 px-3 text-center border-r border-slate-300 w-14">MUTU (M)</th>
                    <th className="py-2 px-3 text-center w-16">K X M</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {transkripData.items?.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="py-2 px-3 text-center border-r border-slate-300">{idx + 1}</td>
                      <td className="py-2 px-3 font-mono font-bold border-r border-slate-300">{item.kode_mk}</td>
                      <td className="py-2 px-3 font-medium border-r border-slate-300">{item.nama_mk}</td>
                      <td className="py-2 px-3 text-center font-bold border-r border-slate-300">{item.sks}</td>
                      <td className="py-2 px-3 text-center font-bold border-r border-slate-300 text-primary-700">{item.nilai_huruf}</td>
                      <td className="py-2 px-3 text-center font-mono border-r border-slate-300">{Number(item.bobot_mutu).toFixed(2)}</td>
                      <td className="py-2 px-3 text-center font-bold">{Number(item.mutu_x_sks).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 border-t-2 border-slate-900 font-bold">
                  <tr>
                    <td colSpan={3} className="py-2.5 px-3 text-right uppercase">JUMLAH TOTAL KUMULATIF:</td>
                    <td className="py-2.5 px-3 text-center font-mono text-sm">{transkripData.ringkasan?.total_sks_lulus}</td>
                    <td colSpan={2}></td>
                    <td className="py-2.5 px-3 text-center font-mono text-sm">{transkripData.ringkasan?.total_mutu}</td>
                  </tr>
                </tfoot>
              </table>

              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>Total SKS Diselesaikan: <strong className="font-mono text-sm text-slate-900">{transkripData.ringkasan?.total_sks_lulus} SKS</strong></div>
                <div>Indeks Prestasi Kumulatif (IPK): <strong className="font-mono text-base text-primary-900">{transkripData.ringkasan?.ipk}</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
