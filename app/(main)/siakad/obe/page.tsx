'use client';

import { useState, useEffect } from 'react';
import {
  Award,
  BookOpen,
  Target,
  FileText,
  CheckCircle2,
  AlertCircle,
  Plus,
  Edit3,
  Trash2,
  Search,
  Eye,
  Check,
  X,
  Printer,
  Calendar,
  Layers,
  Sparkles,
  BarChart3,
  TrendingUp,
  Clock,
  Send,
  MoreVertical,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { siakadService } from '@/services/siakad.service';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function KurikulumObePage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'cpl' | 'cpmk' | 'rps' | 'profil_lulusan' | 'bahan_kajian'>('dashboard');
  const [prodis, setProdis] = useState<any[]>([]);
  const [selectedProdiId, setSelectedProdiId] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);

  // Dashboard Data
  const [dashboardData, setDashboardData] = useState<any | null>(null);

  // CPL Data
  const [cplList, setCplList] = useState<any[]>([]);
  const [isCplModalOpen, setIsCplModalOpen] = useState(false);
  const [editingCpl, setEditingCpl] = useState<any | null>(null);
  const [cplForm, setCplForm] = useState({
    program_studi_id: 1,
    kode_cpl: '',
    kategori: 'pengetahuan',
    deskripsi: '',
  });

  // CPMK Data
  const [matakuliahList, setMatakuliahList] = useState<any[]>([]);
  const [selectedMkId, setSelectedMkId] = useState<number | ''>('');
  const [searchMkQuery, setSearchMkQuery] = useState('');
  const [cpmkList, setCpmkList] = useState<any[]>([]);
  const [isCpmkModalOpen, setIsCpmkModalOpen] = useState(false);
  const [editingCpmk, setEditingCpmk] = useState<any | null>(null);
  const [cpmkForm, setCpmkForm] = useState({
    mata_kuliah_id: 1,
    cpl_id: '',
    kode_cpmk: '',
    deskripsi: '',
    bobot_persentase: 30,
  });

  // RPS Data
  const [rpsList, setRpsList] = useState<any[]>([]);
  const [selectedRpsDetail, setSelectedRpsDetail] = useState<any | null>(null);
  const [isRpsDetailOpen, setIsRpsDetailOpen] = useState(false);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [isPrintRpsOpen, setIsPrintRpsOpen] = useState(false);

  const [saving, setSaving] = useState(false);

  // Profil Lulusan States
  const [plList, setPlList] = useState<any[]>([]);
  const [isPlModalOpen, setIsPlModalOpen] = useState(false);
  const [editingPl, setEditingPl] = useState<any | null>(null);
  const [plForm, setPlForm] = useState({
    kode_pl: '',
    nama: '',
    deskripsi: '',
    urutan: 1,
  });
  const [isMapCplModalOpen, setIsMapCplModalOpen] = useState(false);
  const [selectedPlForMapping, setSelectedPlForMapping] = useState<any | null>(null);
  const [selectedCplIds, setSelectedCplIds] = useState<number[]>([]);

  // Bahan Kajian States
  const [bkList, setBkList] = useState<any[]>([]);
  const [isBkModalOpen, setIsBkModalOpen] = useState(false);
  const [editingBk, setEditingBk] = useState<any | null>(null);
  const [bkForm, setBkForm] = useState({
    kode_bk: '',
    nama_bk: '',
    deskripsi: '',
  });
  const [isMapBkModalOpen, setIsMapBkModalOpen] = useState(false);
  const [selectedMkForMapping, setSelectedMkForMapping] = useState<any | null>(null);
  const [selectedBkIds, setSelectedBkIds] = useState<number[]>([]);

  const fetchPl = async () => {
    try {
      setLoading(true);
      const res = await siakadService.getProfilLulusans({
        program_studi_id: selectedProdiId || undefined,
      });
      if (res.data) setPlList(res.data);
    } catch (err) {
      toast.error('Gagal memuat profil lulusan');
    } finally {
      setLoading(false);
    }
  };

  const fetchBk = async () => {
    try {
      setLoading(true);
      const res = await siakadService.getBahanKajians({
        program_studi_id: selectedProdiId || undefined,
      });
      if (res.data) setBkList(res.data);
    } catch (err) {
      toast.error('Gagal memuat bahan kajian');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePl = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        ...plForm,
        program_studi_id: Number(selectedProdiId),
        id: editingPl ? editingPl.id : undefined,
      };
      await siakadService.storeProfilLulusan(payload);
      toast.success(editingPl ? 'Profil lulusan berhasil diperbarui' : 'Profil lulusan berhasil ditambahkan');
      setIsPlModalOpen(false);
      fetchPl();
    } catch (err) {
      toast.error('Gagal menyimpan profil lulusan');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePl = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus profil lulusan ini?')) return;
    try {
      await siakadService.deleteProfilLulusan(id);
      toast.success('Profil lulusan berhasil dihapus');
      fetchPl();
    } catch (err) {
      toast.error('Gagal menghapus profil lulusan');
    }
  };

  const handleSavePlCplMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await siakadService.mapProfilLulusanCpl({
        profil_lulusan_id: selectedPlForMapping.id,
        cpl_ids: selectedCplIds,
      });
      toast.success('Pemetaan Cpl berhasil disimpan');
      setIsMapCplModalOpen(false);
      fetchPl();
    } catch (err) {
      toast.error('Gagal menyimpan pemetaan CPL');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBk = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        ...bkForm,
        program_studi_id: Number(selectedProdiId),
        id: editingBk ? editingBk.id : undefined,
      };
      await siakadService.storeBahanKajian(payload);
      toast.success(editingBk ? 'Bahan kajian berhasil diperbarui' : 'Bahan kajian berhasil ditambahkan');
      setIsBkModalOpen(false);
      fetchBk();
    } catch (err) {
      toast.error('Gagal menyimpan bahan kajian');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBk = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus bahan kajian ini?')) return;
    try {
      await siakadService.deleteBahanKajian(id);
      toast.success('Bahan kajian berhasil dihapus');
      fetchBk();
    } catch (err) {
      toast.error('Gagal menghapus bahan kajian');
    }
  };

  const handleSaveMkBkMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await siakadService.mapMataKuliahBahanKajian({
        mata_kuliah_id: selectedMkForMapping.id,
        bahan_kajian_ids: selectedBkIds,
      });
      toast.success('Pemetaan Bahan Kajian berhasil disimpan');
      setIsMapBkModalOpen(false);
      fetchMatakuliah();
    } catch (err) {
      toast.error('Gagal menyimpan pemetaan Bahan Kajian');
    } finally {
      setSaving(false);
    }
  };

  const plColumns: ColumnDef<any>[] = [
    {
      key: 'kode_pl',
      label: 'KODE PL',
      render: (row) => <span className="font-mono font-black text-indigo-700 text-xs">{row.kode_pl}</span>,
    },
    {
      key: 'nama',
      label: 'PROFIL LULUSAN',
      render: (row) => <span className="font-bold text-slate-900 text-xs">{row.nama}</span>,
    },
    {
      key: 'deskripsi',
      label: 'DESKRIPSI / RUMUSAN KOMPETENSI',
      render: (row) => <span className="text-slate-700 text-xs leading-relaxed">{row.deskripsi}</span>,
    },
    {
      key: 'cpls',
      label: 'CPL YANG DIDUKUNG',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.cpls?.length > 0 ? (
            row.cpls.map((c: any) => (
              <Badge key={c.id} variant="purple" className="font-bold text-[10px] uppercase">
                {c.kode_cpl}
              </Badge>
            ))
          ) : (
            <span className="text-slate-400 text-2xs italic">Belum terpetakan</span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <div className="flex items-center gap-1.5 justify-end">
          <Button
            variant="outline"
            icon={<Sparkles size={11} />}
            className="text-2xs py-1 px-2.5 h-auto font-black text-amber-700 hover:bg-amber-50 border-amber-200"
            onClick={() => {
              setSelectedPlForMapping(row);
              setSelectedCplIds(row.cpls?.map((c: any) => c.id) || []);
              setIsMapCplModalOpen(true);
            }}
          >
            Petakan CPL
          </Button>
          <Button
            variant="outline"
            icon={<Edit3 size={11} />}
            className="text-2xs py-1 px-2.5 h-auto font-bold text-slate-700"
            onClick={() => {
              setEditingPl(row);
              setPlForm({
                kode_pl: row.kode_pl,
                nama: row.nama,
                deskripsi: row.deskripsi || '',
                urutan: row.urutan || 1,
              });
              setIsPlModalOpen(true);
            }}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            icon={<Trash2 size={11} />}
            className="text-2xs py-1 px-2.5 h-auto font-bold text-red-600 hover:bg-red-50 border-red-200"
            onClick={() => handleDeletePl(row.id)}
          >
            Hapus
          </Button>
        </div>
      ),
    },
  ];

  const bkColumns: ColumnDef<any>[] = [
    {
      key: 'kode_bk',
      label: 'KODE BK',
      render: (row) => <span className="font-mono font-black text-emerald-700 text-xs">{row.kode_bk}</span>,
    },
    {
      key: 'nama_bk',
      label: 'NAMA BAHAN KAJIAN',
      render: (row) => <span className="font-bold text-slate-900 text-xs">{row.nama_bk}</span>,
    },
    {
      key: 'deskripsi',
      label: 'DESKRIPSI BAHAN KAJIAN / KEDALAMAN',
      render: (row) => <span className="text-slate-700 text-xs leading-relaxed">{row.deskripsi}</span>,
    },
    {
      key: 'actions',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <div className="flex items-center gap-1.5 justify-end">
          <Button
            variant="outline"
            icon={<Edit3 size={11} />}
            className="text-2xs py-1 px-2.5 h-auto font-bold text-slate-700"
            onClick={() => {
              setEditingBk(row);
              setBkForm({
                kode_bk: row.kode_bk,
                nama_bk: row.nama_bk,
                deskripsi: row.deskripsi || '',
              });
              setIsBkModalOpen(true);
            }}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            icon={<Trash2 size={11} />}
            className="text-2xs py-1 px-2.5 h-auto font-bold text-red-600 hover:bg-red-50 border-red-200"
            onClick={() => handleDeleteBk(row.id)}
          >
            Hapus
          </Button>
        </div>
      ),
    },
  ];

  const mkObeColumns: ColumnDef<any>[] = [
    {
      key: 'kode_mk',
      label: 'KODE & MATA KULIAH',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 text-xs block">{row.nama}</span>
          <span className="font-mono text-2xs text-slate-400">{row.kode_mk} • {row.total_sks} SKS • Smt {row.semester_default || '-'}</span>
        </div>
      ),
    },
    {
      key: 'bahan_kajian',
      label: 'BAHAN KAJIAN TERPETAKAN',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.bahan_kajians?.length > 0 ? (
            row.bahan_kajians.map((b: any) => (
              <Badge key={b.id} variant="green" className="font-bold text-[10px] uppercase">
                {b.kode_bk} - {b.nama_bk}
              </Badge>
            ))
          ) : (
            <span className="text-slate-400 text-2xs italic">Belum ada bahan kajian terpetakan</span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'AKSI PEMETAAN',
      align: 'right',
      render: (row) => (
        <Button
          variant="outline"
          icon={<Sparkles size={11} />}
          className="text-2xs py-1 px-2.5 h-auto font-black text-emerald-700 hover:bg-emerald-50 border-emerald-200"
          onClick={() => {
            setSelectedMkForMapping(row);
            setSelectedBkIds(row.bahan_kajians?.map((b: any) => b.id) || []);
            setIsMapBkModalOpen(true);
          }}
        >
          Petakan Bahan Kajian
        </Button>
      ),
    },
  ];

  const fetchProdis = async () => {
    try {
      const res = await siakadService.getProdi();
      if (res.data && res.data.length > 0) {
        setProdis(res.data);
        if (!selectedProdiId) {
          setSelectedProdiId(res.data[0].id);
        }
      }
    } catch (err) {}
  };

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await siakadService.getObeDashboard({
        program_studi_id: selectedProdiId || undefined,
      });
      if (res.data) setDashboardData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCpl = async () => {
    try {
      setLoading(true);
      const res = await siakadService.getCpl({
        program_studi_id: selectedProdiId || undefined,
      });
      if (res.data) setCplList(res.data);
    } catch (err) {
      toast.error('Gagal memuat daftar CPL');
    } finally {
      setLoading(false);
    }
  };

  const fetchMatakuliah = async () => {
    try {
      const res = await siakadService.getMataKuliahs({
        program_studi_id: selectedProdiId || undefined,
        per_page: 200,
      });
      if (res.data) {
        setMatakuliahList(res.data);
        if (res.data[0]) {
          setSelectedMkId(res.data[0].id);
        } else {
          setSelectedMkId('');
        }
      }
    } catch (err) {}
  };

  const fetchCpmk = async () => {
    if (!selectedMkId) return;
    try {
      setLoading(true);
      const res = await siakadService.getCpmk({
        mata_kuliah_id: selectedMkId,
      });
      if (res.data) setCpmkList(res.data);
    } catch (err) {
      toast.error('Gagal memuat CPMK mata kuliah');
    } finally {
      setLoading(false);
    }
  };

  const fetchRps = async () => {
    try {
      setLoading(true);
      const res = await siakadService.getRps({
        program_studi_id: selectedProdiId || undefined,
      });
      if (res.data) setRpsList(res.data);
    } catch (err) {
      toast.error('Gagal memuat dokumen RPS');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProdis();
  }, []);

  useEffect(() => {
    if (selectedProdiId) {
      if (activeTab === 'dashboard') fetchDashboard();
      if (activeTab === 'cpl') fetchCpl();
      if (activeTab === 'cpmk') {
        fetchMatakuliah();
        fetchCpl();
      }
      if (activeTab === 'rps') fetchRps();
      if (activeTab === 'profil_lulusan') fetchPl();
      if (activeTab === 'bahan_kajian') {
        fetchBk();
        fetchMatakuliah();
      }
    }
  }, [selectedProdiId, activeTab]);

  useEffect(() => {
    if (selectedMkId && activeTab === 'cpmk') {
      fetchCpmk();
    }
  }, [selectedMkId, activeTab]);

  useEffect(() => {
    const filtered = matakuliahList.filter((m) =>
      m.nama.toLowerCase().includes(searchMkQuery.toLowerCase()) ||
      m.kode_mk.toLowerCase().includes(searchMkQuery.toLowerCase())
    );
    if (filtered.length > 0) {
      const match = filtered.find((m) => m.id === selectedMkId);
      if (!match) {
        setSelectedMkId(filtered[0].id);
      }
    }
  }, [searchMkQuery, matakuliahList]);

  // CPL Handlers
  const handleSaveCpl = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await siakadService.storeCpl({
        ...cplForm,
        program_studi_id: selectedProdiId,
      });
      toast.success('CPL berhasil disimpan');
      setIsCplModalOpen(false);
      fetchCpl();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal menyimpan CPL');
    } finally {
      setSaving(false);
    }
  };

  // CPMK Handlers
  const handleSaveCpmk = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await siakadService.storeCpmk({
        ...cpmkForm,
        mata_kuliah_id: selectedMkId,
      });
      toast.success('CPMK berhasil disimpan');
      setIsCpmkModalOpen(false);
      fetchCpmk();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal menyimpan CPMK');
    } finally {
      setSaving(false);
    }
  };

  // RPS Approval Handlers
  const handleOpenDetailRps = async (rps: any) => {
    try {
      const res = await siakadService.showRps(rps.id);
      if (res.data) {
        setSelectedRpsDetail(res.data);
        setIsRpsDetailOpen(true);
      }
    } catch (err) {
      toast.error('Gagal membuka rincian RPS');
    }
  };

  const handleSubmitRpsToKaprodi = async (id: number) => {
    try {
      await siakadService.submitRps(id);
      toast.success('Dokumen RPS berhasil diajukan ke Kaprodi untuk verifikasi');
      fetchRps();
      if (selectedRpsDetail?.id === id) {
        handleOpenDetailRps(selectedRpsDetail);
      }
    } catch (err: any) {
      toast.error('Gagal mengajukan RPS');
    }
  };

  const handleApproveRps = async (id: number, status: 'disetujui' | 'revisi', notes?: string) => {
    try {
      await siakadService.approveRps(id, {
        status,
        catatan_revisi: notes,
      });
      toast.success(status === 'disetujui' ? 'RPS berhasil diverifikasi dan disetujui Kaprodi' : 'Catatan revisi berhasil dikirimkan ke Dosen');
      setIsRevisionModalOpen(false);
      setRevisionNotes('');
      fetchRps();
      if (selectedRpsDetail?.id === id) {
        handleOpenDetailRps(selectedRpsDetail);
      }
    } catch (err: any) {
      toast.error('Gagal memproses approval RPS');
    }
  };

  const selectedProdiObj = prodis.find((p) => p.id === Number(selectedProdiId));

  const cplColumns: ColumnDef<any>[] = [
    {
      key: 'kode_cpl',
      label: 'KODE CPL',
      render: (row) => (
        <span className="font-mono font-black text-primary-700 text-xs">
          {row.kode_cpl}
        </span>
      ),
    },
    {
      key: 'kategori',
      label: 'RANAH / KATEGORI',
      render: (row) => (
        <Badge variant="purple" className="uppercase font-bold text-2xs">
          {row.kategori?.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'deskripsi',
      label: 'DESKRIPSI CAPAIAN PEMBELAJARAN LULUSAN',
      render: (row) => (
        <span className="leading-relaxed font-normal text-slate-800 text-xs">
          {row.deskripsi}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      align: 'center',
      render: () => <Badge variant="green">Aktif</Badge>,
    },
    {
      key: 'actions',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <Button
          variant="outline"
          icon={<Edit3 size={12} />}
          className="text-2xs py-1 px-2.5 h-auto font-bold"
          onClick={() => {
            setEditingCpl(row);
            setCplForm({
              program_studi_id: row.program_studi_id,
              kode_cpl: row.kode_cpl,
              kategori: row.kategori,
              deskripsi: row.deskripsi,
            });
            setIsCplModalOpen(true);
          }}
        >
          Edit
        </Button>
      ),
    },
  ];

  const cpmkColumns: ColumnDef<any>[] = [
    {
      key: 'kode_cpmk',
      label: 'KODE CPMK',
      render: (row) => (
        <span className="font-mono font-black text-primary-700 text-xs">
          {row.kode_cpmk}
        </span>
      ),
    },
    {
      key: 'cpl',
      label: 'KORELASI CPL',
      render: (row) =>
        row.cpl ? (
          <Badge variant="blue" className="font-mono font-bold" title={row.cpl.deskripsi}>
            {row.cpl.kode_cpl}
          </Badge>
        ) : (
          <span className="text-slate-400 text-xs">-</span>
        ),
    },
    {
      key: 'deskripsi',
      label: 'DESKRIPSI CAPAIAN MATA KULIAH',
      render: (row) => (
        <span className="leading-relaxed font-normal text-slate-800 text-xs">
          {row.deskripsi}
        </span>
      ),
    },
    {
      key: 'bobot',
      label: 'BOBOT (%)',
      align: 'center',
      render: (row) => (
        <span className="font-mono font-bold text-slate-900 text-xs">
          {row.bobot_persentase}%
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <Button
          variant="outline"
          icon={<Edit3 size={12} />}
          className="text-2xs py-1 px-2.5 h-auto font-bold"
          onClick={() => {
            setEditingCpmk(row);
            setCpmkForm({
              mata_kuliah_id: row.mata_kuliah_id,
              cpl_id: row.cpl_id || '',
              kode_cpmk: row.kode_cpmk,
              deskripsi: row.deskripsi,
              bobot_persentase: row.bobot_persentase || 30,
            });
            setIsCpmkModalOpen(true);
          }}
        >
          Edit
        </Button>
      ),
    },
  ];

  const rpsColumns: ColumnDef<any>[] = [
    {
      key: 'mata_kuliah',
      label: 'KODE & MATA KULIAH',
      render: (row) => (
        <div>
          <span className="font-extrabold text-slate-900 block text-xs">
            {row.mata_kuliah?.nama}
          </span>
          <span className="text-2xs text-slate-400 font-mono">
            {row.mata_kuliah?.kode_mk} • Tahun {row.tahun_ajaran}
          </span>
        </div>
      ),
    },
    {
      key: 'sks',
      label: 'SMT / SKS',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-800 text-xs block">
            Smt {row.semester}
          </span>
          <span className="text-2xs text-primary-700 font-bold">
            {row.mata_kuliah?.total_sks || 3} SKS
          </span>
        </div>
      ),
    },
    {
      key: 'dosen',
      label: 'DOSEN PENGEMBANG RPS',
      render: (row) => (
        <span className="font-semibold text-slate-800 text-xs">
          {row.dosen_pengembang?.nama_lengkap || 'Tim Kurikulum Prodi'}
        </span>
      ),
    },
    {
      key: 'kaprodi',
      label: 'VERIFIKATOR KAPRODI',
      render: (row) => (
        <span className="font-semibold text-slate-800 text-xs">
          {row.kaprodi?.nama_lengkap || 'Kaprodi'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'STATUS VERIFIKASI',
      align: 'center',
      render: (row) => {
        if (row.status === 'disetujui') {
          return <Badge variant="green">✓ Disetujui</Badge>;
        }
        if (row.status === 'diajukan') {
          return <Badge variant="amber">⏳ Menunggu Verifikasi</Badge>;
        }
        if (row.status === 'revisi') {
          return <Badge variant="rose" title={row.catatan_revisi}>⚠️ Perlu Revisi</Badge>;
        }
        return <Badge variant="gray">Draft Penyusunan</Badge>;
      },
    },
    {
      key: 'actions',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <Button
          variant="primary"
          icon={<Eye size={12} />}
          className="text-2xs py-1.5 px-3 h-auto font-bold shadow-xs"
          onClick={() => handleOpenDetailRps(row)}
        >
          Detail & Verifikasi
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="space-y-6 animate-fade-in print:hidden">
        <PageHeader
          title="Kurikulum & Rencana Pembelajaran Semester (RPS OBE)"
          description="Perumusan CPL, penurunan CPMK, penyusunan rancangan pembelajaran (RPS 16 Minggu), dan verifikasi Kaprodi."
          breadcrumbs={[
            { label: 'Portal SSO', href: '/dashboard' },
            { label: 'SIAKAD', href: '/siakad' },
            { label: 'Kurikulum OBE' },
          ]}
          action={
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-500">Program Studi:</span>
              <select
                value={selectedProdiId}
                onChange={(e) => setSelectedProdiId(Number(e.target.value))}
                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none cursor-pointer"
              >
                {prodis.map((p) => (
                  <option key={p.id} value={p.id}>{p.nama} ({p.jenjang})</option>
                ))}
              </select>
            </div>
          }
        />

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-extrabold border-b-2 transition -mb-px cursor-pointer ${
            activeTab === 'dashboard'
              ? 'border-primary-600 text-primary-600 bg-primary-50/40 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <BarChart3 size={16} />
          Pemantauan & Monitoring OBE
        </button>

        <button
          onClick={() => setActiveTab('cpl')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-extrabold border-b-2 transition -mb-px cursor-pointer ${
            activeTab === 'cpl'
              ? 'border-primary-600 text-primary-600 bg-primary-50/40 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Award size={16} />
          Perumusan CPL Prodi ({cplList.length || 4})
        </button>

        <button
          onClick={() => setActiveTab('cpmk')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-extrabold border-b-2 transition -mb-px cursor-pointer ${
            activeTab === 'cpmk'
              ? 'border-primary-600 text-primary-600 bg-primary-50/40 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Target size={16} />
          Pemetaan CPMK Mata Kuliah
        </button>

        <button
          onClick={() => setActiveTab('rps')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-extrabold border-b-2 transition -mb-px cursor-pointer ${
            activeTab === 'rps'
              ? 'border-primary-600 text-primary-600 bg-primary-50/40 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText size={16} />
          Dokumen RPS & Verifikasi Kaprodi
        </button>

        <button
          onClick={() => setActiveTab('profil_lulusan')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-extrabold border-b-2 transition -mb-px cursor-pointer ${
            activeTab === 'profil_lulusan'
              ? 'border-primary-600 text-primary-600 bg-primary-50/40 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers size={16} />
          Profil Lulusan ({plList.length})
        </button>

        <button
          onClick={() => setActiveTab('bahan_kajian')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-extrabold border-b-2 transition -mb-px cursor-pointer ${
            activeTab === 'bahan_kajian'
              ? 'border-primary-600 text-primary-600 bg-primary-50/40 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <BookOpen size={16} />
          Bahan Kajian ({bkList.length})
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: PEMANTAUAN & MONITORING OBE */}
      {/* ======================================================== */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-5 space-y-1">
              <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">CPL Terumuskan</span>
              <span className="text-2xl font-black text-slate-900 font-mono">
                {dashboardData?.summary?.total_cpl || 4}
              </span>
              <p className="text-2xs text-slate-400">Standar SN-Dikti / IABEE</p>
            </div>

            <div className="card p-5 space-y-1">
              <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">CPMK Terpetakan</span>
              <span className="text-2xl font-black text-primary-700 font-mono">
                {dashboardData?.summary?.total_cpmk || 24}
              </span>
              <p className="text-2xs text-slate-400">Lintas Seluruh Mata Kuliah</p>
            </div>

            <div className="card p-5 space-y-1">
              <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">Mata Kuliah Ber-RPS</span>
              <span className="text-2xl font-black text-emerald-700 font-mono">
                {dashboardData?.summary?.total_rps || 8} / {dashboardData?.summary?.total_matakuliah || 8}
              </span>
              <p className="text-2xs text-emerald-600 font-bold">100% Kelengkapan Dokumen</p>
            </div>

            <div className="card p-5 space-y-1">
              <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">RPS Disetujui Kaprodi</span>
              <span className="text-2xl font-black text-purple-700 font-mono">
                {dashboardData?.summary?.rps_disetujui || 8}
              </span>
              <p className="text-2xs text-purple-600 font-bold">Siap Pembelajaran Aktif</p>
            </div>
          </div>

          {/* CPL Fulfillment by Category Progress */}
          <div className="card p-6 space-y-5">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <TrendingUp size={16} className="text-primary-600" />
                Rata-rata Ketercapaian CPL Lulusan per Ranah Kompetensi ({selectedProdiObj?.nama})
              </h3>
              <p className="text-xs text-slate-500">
                Data agregat asesmen portofolio mahasiswa per ranah CPL untuk akreditasi program studi.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-800">1. Ranah Sikap & Tata Nilai (CPL-01)</span>
                  <span className="text-emerald-700 font-mono font-black text-sm">88.5%</span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '88.5%' }} />
                </div>
                <span className="text-2xs text-slate-500 block">Target Threshold: ≥65% (Tercapai Sangat Baik)</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-800">2. Ranah Penguasaan Pengetahuan (CPL-02)</span>
                  <span className="text-primary-700 font-mono font-black text-sm">82.4%</span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-primary-500 h-full rounded-full" style={{ width: '82.4%' }} />
                </div>
                <span className="text-2xs text-slate-500 block">Target Threshold: ≥65% (Tercapai Sangat Baik)</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-800">3. Ranah Keterampilan Umum & Kolaborasi (CPL-03)</span>
                  <span className="text-emerald-700 font-mono font-black text-sm">85.0%</span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '85%' }} />
                </div>
                <span className="text-2xs text-slate-500 block">Target Threshold: ≥65% (Tercapai Sangat Baik)</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-800">4. Ranah Keterampilan Khusus / Keahlian (CPL-04)</span>
                  <span className="text-primary-700 font-mono font-black text-sm">81.2%</span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-primary-500 h-full rounded-full" style={{ width: '81.2%' }} />
                </div>
                <span className="text-2xs text-slate-500 block">Target Threshold: ≥65% (Tercapai Sangat Baik)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: PERUMUSAN CPL PRODI */}
      {/* ======================================================== */}
      {activeTab === 'cpl' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Award size={16} className="text-primary-600" />
                Capaian Pembelajaran Lulusan (CPL) - {selectedProdiObj?.nama}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Standar kompetensi lulusan yang harus dipenuhi mahasiswa selama masa studi.
              </p>
            </div>

            <Button
              variant="primary"
              icon={<Plus size={15} />}
              onClick={() => {
                setEditingCpl(null);
                setCplForm({
                  program_studi_id: Number(selectedProdiId),
                  kode_cpl: `CPL-0${cplList.length + 1}`,
                  kategori: 'pengetahuan',
                  deskripsi: '',
                });
                setIsCplModalOpen(true);
              }}
            >
              Tambah Rumusan CPL
            </Button>
          </div>

          <DataTable
            columns={cplColumns}
            data={cplList}
            isLoading={loading}
            emptyMessage="Belum ada CPL yang dirumuskan untuk program studi ini."
          />
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: PEMETAAN CPMK MATA KULIAH */}
      {/* ======================================================== */}
      {activeTab === 'cpmk' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Target size={16} className="text-primary-600" />
                Capaian Pembelajaran Mata Kuliah (CPMK)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Penurunan CPL program studi menjadi target capaian spesifik per mata kuliah.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={searchMkQuery}
                onChange={(e) => setSearchMkQuery(e.target.value)}
                placeholder="Cari Mata Kuliah..."
                className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary-500 w-44"
              />
              <select
                value={selectedMkId}
                onChange={(e) => setSelectedMkId(Number(e.target.value))}
                className="select text-xs font-bold"
              >
                {matakuliahList
                  .filter((m) =>
                    m.nama.toLowerCase().includes(searchMkQuery.toLowerCase()) ||
                    m.kode_mk.toLowerCase().includes(searchMkQuery.toLowerCase())
                  )
                  .map((m) => (
                    <option key={m.id} value={m.id}>{m.kode_mk} - {m.nama} ({m.total_sks} SKS)</option>
                  ))}
              </select>

              <Button
                variant="primary"
                icon={<Plus size={15} />}
                onClick={() => {
                  setEditingCpmk(null);
                  setCpmkForm({
                    mata_kuliah_id: Number(selectedMkId),
                    cpl_id: cplList[0]?.id || '',
                    kode_cpmk: `CPMK-${cpmkList.length + 1}`,
                    deskripsi: '',
                    bobot_persentase: 35,
                  });
                  setIsCpmkModalOpen(true);
                }}
              >
                Tambah CPMK
              </Button>
            </div>
          </div>

          <DataTable
            columns={cpmkColumns}
            data={cpmkList}
            isLoading={loading}
            emptyMessage="Belum ada CPMK untuk mata kuliah ini."
          />
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: DOKUMEN RPS & ALUR VERIFIKASI / APPROVAL KAPRODI */}
      {/* ======================================================== */}
      {activeTab === 'rps' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <FileText size={16} className="text-primary-600" />
              Rencana Pembelajaran Semester (RPS) & Status Verifikasi Kaprodi
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar dokumen RPS mata kuliah kurikulum OBE, evaluasi 16 pertemuan, dan persetujuan Ketua Program Studi.
            </p>
          </div>

          <DataTable
            columns={rpsColumns}
            data={rpsList}
            isLoading={loading}
            emptyMessage="Belum ada dokumen RPS yang terdaftar."
          />
        </div>
      )}

      {/* ======================================================== */}
      {/* DRAWER / MODAL DETAIL RPS & APPROVAL PRODI */}
      {/* ======================================================== */}
      {isRpsDetailOpen && selectedRpsDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="badge badge-purple text-2xs font-bold uppercase">
                    RPS Standar SN-Dikti
                  </span>
                  <span className={`badge text-2xs font-bold ${selectedRpsDetail.status === 'disetujui' ? 'badge-green' : selectedRpsDetail.status === 'diajukan' ? 'badge-yellow' : 'badge-gray'}`}>
                    Status: {selectedRpsDetail.status.toUpperCase()}
                  </span>
                </div>
                <h3 className="font-extrabold text-base text-slate-900 mt-1">
                  {selectedRpsDetail.mata_kuliah?.nama} ({selectedRpsDetail.mata_kuliah?.kode_mk})
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  icon={<Printer size={14} />}
                  className="text-xs font-bold"
                  onClick={() => setIsPrintRpsOpen(true)}
                >
                  Cetak RPS
                </Button>
                <button onClick={() => setIsRpsDetailOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                  ✕
                </button>
              </div>
            </div>

            {/* Banner Alur Approval Kaprodi */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <span className="text-2xs font-bold text-slate-500 uppercase block">Otoritas Pengesahan Kurikulum</span>
                <p className="text-xs text-slate-700">
                  Dosen Pengembang: <strong>{selectedRpsDetail.dosen_pengembang?.nama_lengkap || 'Dosen Pengembang'}</strong> • Kaprodi: <strong>{selectedRpsDetail.kaprodi?.nama_lengkap || 'Kaprodi'}</strong>
                </p>
                {selectedRpsDetail.catatan_revisi && (
                  <p className="text-xs text-rose-700 bg-rose-50 p-2 rounded-lg mt-2 border border-rose-200">
                    <strong>Catatan Revisi Kaprodi:</strong> {selectedRpsDetail.catatan_revisi}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {selectedRpsDetail.status !== 'disetujui' && selectedRpsDetail.status !== 'diajukan' && (
                  <Button
                    variant="primary"
                    icon={<Send size={13} />}
                    className="text-xs font-bold"
                    onClick={() => handleSubmitRpsToKaprodi(selectedRpsDetail.id)}
                  >
                    Ajukan ke Kaprodi
                  </Button>
                )}

                <Button
                  variant="primary"
                  icon={<Check size={13} />}
                  className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-xs"
                  onClick={() => handleApproveRps(selectedRpsDetail.id, 'disetujui')}
                >
                  ✓ Setujui RPS (Kaprodi)
                </Button>

                <Button
                  variant="outline"
                  icon={<X size={13} className="text-rose-600" />}
                  className="text-xs font-bold border-rose-200 text-rose-700 hover:bg-rose-50"
                  onClick={() => setIsRevisionModalOpen(true)}
                >
                  Minta Revisi
                </Button>
              </div>
            </div>

            {/* Rincian Capaian CPMK & Pustaka */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-extrabold text-slate-900 block">Capaian Pembelajaran (CPMK):</span>
                <ul className="space-y-1.5 list-disc pl-4 text-slate-700">
                  {selectedRpsDetail.mata_kuliah?.cpmks?.map((c: any) => (
                    <li key={c.id}>
                      <strong>{c.kode_cpmk} ({c.bobot_persentase}%):</strong> {c.deskripsi}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-extrabold text-slate-900 block">Pustaka & Referensi:</span>
                <p className="text-slate-700 whitespace-pre-line">{selectedRpsDetail.pustaka_utama || '-'}</p>
              </div>
            </div>

            {/* Rencana 16 Pertemuan Mingguan */}
            <div className="space-y-2">
              <span className="font-extrabold text-xs text-slate-900 block">Rencana Kegiatan Pembelajaran Mingguan (16 Pertemuan):</span>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 w-12 text-center">MG</th>
                      <th className="py-2.5 px-3 w-48">KEMAMPUAN AKHIR (SUB-CPMK)</th>
                      <th className="py-2.5 px-3">BAHAN KAJIAN / MATERI</th>
                      <th className="py-2.5 px-3 w-40">METODE PEMBELAJARAN</th>
                      <th className="py-2.5 px-3 text-center w-16">BOBOT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {selectedRpsDetail.mingguan?.map((m: any) => (
                      <tr key={m.id} className={m.minggu_ke === 8 || m.minggu_ke === 16 ? 'bg-primary-50/60 font-bold' : 'hover:bg-slate-50'}>
                        <td className="py-2.5 px-3 text-center font-mono font-black">{m.minggu_ke}</td>
                        <td className="py-2.5 px-3 text-slate-900">{m.kemampuan_akhir}</td>
                        <td className="py-2.5 px-3 text-slate-700">{m.bahan_kajian}</td>
                        <td className="py-2.5 px-3 text-2xs text-slate-600">{m.bentuk_metode}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold">{m.bobot_penilaian}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CATATAN REVISI RPS */}
      {isRevisionModalOpen && selectedRpsDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900">Catatan Revisi Dokumen RPS</h3>
            <textarea
              rows={4}
              placeholder="Tuliskan catatan perbaikan atau revisi RPS untuk dosen pengembang..."
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl text-xs outline-none focus:border-primary-500 font-medium"
              required
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" className="text-xs" onClick={() => setIsRevisionModalOpen(false)}>Batal</Button>
              <Button
                variant="primary"
                className="text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white border-none"
                onClick={() => handleApproveRps(selectedRpsDetail.id, 'revisi', revisionNotes)}
              >
                Kirim Revisi ke Dosen
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH / EDIT CPL */}
      {isCplModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-sm text-slate-900">
                {editingCpl ? 'Edit Rumusan CPL' : 'Tambah Capaian Pembelajaran Lulusan (CPL)'}
              </h3>
              <button onClick={() => setIsCplModalOpen(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveCpl} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Kode CPL</label>
                <input
                  type="text"
                  value={cplForm.kode_cpl}
                  onChange={(e) => setCplForm({ ...cplForm, kode_cpl: e.target.value })}
                  placeholder="e.g. CPL-01, S-1, KU-1..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Ranah / Kategori CPL</label>
                <select
                  value={cplForm.kategori}
                  onChange={(e) => setCplForm({ ...cplForm, kategori: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
                >
                  <option value="sikap">Sikap & Tata Nilai (S)</option>
                  <option value="pengetahuan">Penguasaan Pengetahuan (P)</option>
                  <option value="keterampilan_umum">Keterampilan Umum (KU)</option>
                  <option value="keterampilan_khusus">Keterampilan Khusus (KK)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Deskripsi Rumusan CPL</label>
                <textarea
                  rows={4}
                  value={cplForm.deskripsi}
                  onChange={(e) => setCplForm({ ...cplForm, deskripsi: e.target.value })}
                  placeholder="Tuliskan rumusan capaian pembelajaran lulusan..."
                  className="w-full p-3 border border-slate-300 rounded-xl font-medium"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" className="text-xs" onClick={() => setIsCplModalOpen(false)}>Batal</Button>
                <Button type="submit" variant="primary" className="text-xs font-bold" disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan CPL'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH / EDIT CPMK */}
      {isCpmkModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-sm text-slate-900">
                {editingCpmk ? 'Edit CPMK Mata Kuliah' : 'Tambah CPMK Mata Kuliah'}
              </h3>
              <button onClick={() => setIsCpmkModalOpen(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveCpmk} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Kode CPMK</label>
                  <input
                    type="text"
                    value={cpmkForm.kode_cpmk}
                    onChange={(e) => setCpmkForm({ ...cpmkForm, kode_cpmk: e.target.value })}
                    placeholder="e.g. CPMK-1"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Bobot Persentase (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={cpmkForm.bobot_persentase}
                    onChange={(e) => setCpmkForm({ ...cpmkForm, bobot_persentase: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Hubungkan ke CPL Program Studi</label>
                <select
                  value={cpmkForm.cpl_id}
                  onChange={(e) => setCpmkForm({ ...cpmkForm, cpl_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
                >
                  <option value="">-- Pilih CPL Terkait --</option>
                  {cplList.map((c) => (
                    <option key={c.id} value={c.id}>{c.kode_cpl} - {c.deskripsi.substring(0, 60)}...</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Deskripsi CPMK</label>
                <textarea
                  rows={4}
                  value={cpmkForm.deskripsi}
                  onChange={(e) => setCpmkForm({ ...cpmkForm, deskripsi: e.target.value })}
                  placeholder="Tuliskan kemampuan yang diharapkan setelah menyelesaikan mata kuliah..."
                  className="w-full p-3 border border-slate-300 rounded-xl font-medium"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" className="text-xs" onClick={() => setIsCpmkModalOpen(false)}>Batal</Button>
                <Button type="submit" variant="primary" className="text-xs font-bold" disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan CPMK'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>

      {/* ======================================================== */}
      {/* DOKUMEN CETAK RPS RESMI (SN-DIKTI / OBE) — KHUSUS PRINT */}
      {/* ======================================================== */}
      {/* Modal Form Profil Lulusan */}
      {isPlModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 animate-scale-in">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="font-black text-sm text-slate-900">
                {editingPl ? 'Edit Profil Lulusan' : 'Tambah Profil Lulusan'}
              </h3>
              <button onClick={() => setIsPlModalOpen(false)} className="text-slate-400 font-bold hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSavePl} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-2xs font-bold text-slate-500 uppercase">Kode PL</label>
                <input
                  type="text"
                  required
                  value={plForm.kode_pl}
                  onChange={(e) => setPlForm({ ...plForm, kode_pl: e.target.value })}
                  className="input w-full font-bold text-xs"
                  placeholder="Contoh: PL-01"
                />
              </div>

              <div className="space-y-1">
                <label className="text-2xs font-bold text-slate-500 uppercase">Nama Profil Lulusan</label>
                <input
                  type="text"
                  required
                  value={plForm.nama}
                  onChange={(e) => setPlForm({ ...plForm, nama: e.target.value })}
                  className="input w-full text-xs font-semibold"
                  placeholder="Contoh: Software Engineer, Data Scientist"
                />
              </div>

              <div className="space-y-1">
                <label className="text-2xs font-bold text-slate-500 uppercase">Deskripsi / Rumusan Kompetensi</label>
                <textarea
                  required
                  rows={4}
                  value={plForm.deskripsi}
                  onChange={(e) => setPlForm({ ...plForm, deskripsi: e.target.value })}
                  className="input w-full text-xs min-h-[80px]"
                  placeholder="Jelaskan kompetensi lulusan secara detail..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" className="text-xs" onClick={() => setIsPlModalOpen(false)}>Batal</Button>
                <Button type="submit" variant="primary" className="text-xs font-bold" disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Mapping CPL to PL */}
      {isMapCplModalOpen && selectedPlForMapping && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 animate-scale-in">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="font-black text-sm text-slate-900">Pemetaan CPL yang Didukung</h3>
                <p className="text-2xs text-slate-500 font-bold">{selectedPlForMapping.kode_pl} - {selectedPlForMapping.nama}</p>
              </div>
              <button onClick={() => setIsMapCplModalOpen(false)} className="text-slate-400 font-bold hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSavePlCplMapping} className="p-6 space-y-4">
              <p className="text-xs text-slate-500">Pilih satu atau beberapa CPL prodi yang diturunkan/didukung langsung oleh profil lulusan ini:</p>
              <div className="max-h-[250px] overflow-y-auto border border-slate-200 rounded-2xl p-4 divide-y divide-slate-100 space-y-2.5">
                {cplList.map((cpl) => (
                  <label key={cpl.id} className="flex items-start gap-3 pt-2.5 cursor-pointer first:pt-0">
                    <input
                      type="checkbox"
                      className="checkbox mt-0.5 shrink-0"
                      checked={selectedCplIds.includes(cpl.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCplIds([...selectedCplIds, cpl.id]);
                        } else {
                          setSelectedCplIds(selectedCplIds.filter((id) => id !== cpl.id));
                        }
                      }}
                    />
                    <div className="space-y-0.5">
                      <span className="font-mono font-black text-primary-700 text-xs block">{cpl.kode_cpl}</span>
                      <span className="text-xs text-slate-600 font-medium block leading-normal">{cpl.deskripsi}</span>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" className="text-xs" onClick={() => setIsMapCplModalOpen(false)}>Batal</Button>
                <Button type="submit" variant="primary" className="text-xs font-bold" disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan Pemetaan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Form Bahan Kajian */}
      {isBkModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 animate-scale-in">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="font-black text-sm text-slate-900">
                {editingBk ? 'Edit Bahan Kajian' : 'Tambah Bahan Kajian'}
              </h3>
              <button onClick={() => setIsBkModalOpen(false)} className="text-slate-400 font-bold hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSaveBk} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-2xs font-bold text-slate-500 uppercase">Kode Bahan Kajian (BK)</label>
                <input
                  type="text"
                  required
                  value={bkForm.kode_bk}
                  onChange={(e) => setBkForm({ ...bkForm, kode_bk: e.target.value })}
                  className="input w-full font-bold text-xs"
                  placeholder="Contoh: BK-01"
                />
              </div>

              <div className="space-y-1">
                <label className="text-2xs font-bold text-slate-500 uppercase">Nama Bahan Kajian</label>
                <input
                  type="text"
                  required
                  value={bkForm.nama_bk}
                  onChange={(e) => setBkForm({ ...bkForm, nama_bk: e.target.value })}
                  className="input w-full text-xs font-semibold"
                  placeholder="Contoh: Rekayasa Perangkat Lunak, Data Science"
                />
              </div>

              <div className="space-y-1">
                <label className="text-2xs font-bold text-slate-500 uppercase">Deskripsi / Kedalaman & Ruang Lingkup</label>
                <textarea
                  required
                  rows={4}
                  value={bkForm.deskripsi}
                  onChange={(e) => setBkForm({ ...bkForm, deskripsi: e.target.value })}
                  className="input w-full text-xs min-h-[80px]"
                  placeholder="Jelaskan ruang lingkup dan kedalaman materi..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" className="text-xs" onClick={() => setIsBkModalOpen(false)}>Batal</Button>
                <Button type="submit" variant="primary" className="text-xs font-bold" disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Mapping Bahan Kajian to Mata Kuliah */}
      {isMapBkModalOpen && selectedMkForMapping && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 animate-scale-in">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="font-black text-sm text-slate-900">Pemetaan Bahan Kajian ke Mata Kuliah</h3>
                <p className="text-2xs text-slate-500 font-bold">{selectedMkForMapping.kode_mk} - {selectedMkForMapping.nama}</p>
              </div>
              <button onClick={() => setIsMapBkModalOpen(false)} className="text-slate-400 font-bold hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSaveMkBkMapping} className="p-6 space-y-4">
              <p className="text-xs text-slate-500">Pilih satu atau beberapa Bahan Kajian yang tercakup di dalam mata kuliah ini:</p>
              <div className="max-h-[250px] overflow-y-auto border border-slate-200 rounded-2xl p-4 divide-y divide-slate-100 space-y-2.5">
                {bkList.map((bk) => (
                  <label key={bk.id} className="flex items-start gap-3 pt-2.5 cursor-pointer first:pt-0">
                    <input
                      type="checkbox"
                      className="checkbox mt-0.5 shrink-0"
                      checked={selectedBkIds.includes(bk.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedBkIds([...selectedBkIds, bk.id]);
                        } else {
                          setSelectedBkIds(selectedBkIds.filter((id) => id !== bk.id));
                        }
                      }}
                    />
                    <div className="space-y-0.5">
                      <span className="font-mono font-black text-emerald-700 text-xs block">{bk.kode_bk} - {bk.nama_bk}</span>
                      <span className="text-xs text-slate-600 font-medium block leading-normal">{bk.deskripsi}</span>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" className="text-xs" onClick={() => setIsMapBkModalOpen(false)}>Batal</Button>
                <Button type="submit" variant="primary" className="text-xs font-bold" disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan Pemetaan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedRpsDetail && (
        <div className="hidden print:block printable-document print-document bg-white text-black p-8 font-serif leading-normal w-full">
          {/* Kop Dokumen Resmi */}
          <div className="border-b-2 border-black pb-3 mb-4 text-center">
            <h2 className="text-sm font-bold uppercase tracking-wider">KEMENTERIAN PENDIDIKAN TINGGI, RISET, DAN TEKNOLOGI</h2>
            <h1 className="text-base font-black uppercase tracking-tight">UNIVERSITAS NUSANTARA TERPADU</h1>
            <p className="text-xs">
              FAKULTAS TEKNOLOGI INFORMASI & KOMUNIKASI • PROGRAM STUDI {selectedProdiObj?.nama?.toUpperCase() || 'SISTEM INFORMASI'}
            </p>
            <p className="text-[10px] text-gray-600 mt-0.5 font-sans">
              Jl. Kampus Terpadu No. 1 • Website: siakad.kampus.ac.id • Email: akademik@kampus.ac.id
            </p>
          </div>

          <div className="text-center mb-5">
            <h3 className="text-sm font-black uppercase tracking-wide underline">
              RENCANA PEMBELAJARAN SEMESTER (RPS)
            </h3>
            <p className="text-xs font-semibold mt-0.5">
              Standar Kurikulum Berbasis Capaian Pembelajaran Lulusan (Outcome-Based Education / SN-DIKTI)
            </p>
          </div>

          {/* Tabel Identitas Mata Kuliah */}
          <table className="w-full border-collapse border border-black text-xs mb-4">
            <tbody>
              <tr className="border-b border-black">
                <td className="p-2 font-bold bg-gray-100 w-1/4 border-r border-black">MATA KULIAH</td>
                <td className="p-2 border-r border-black font-semibold">{selectedRpsDetail.mata_kuliah?.nama}</td>
                <td className="p-2 font-bold bg-gray-100 w-1/6 border-r border-black">KODE MK</td>
                <td className="p-2 font-mono font-bold">{selectedRpsDetail.mata_kuliah?.kode_mk}</td>
              </tr>
              <tr className="border-b border-black">
                <td className="p-2 font-bold bg-gray-100 border-r border-black">BOBOT / SKS</td>
                <td className="p-2 border-r border-black">{selectedRpsDetail.mata_kuliah?.total_sks || 3} SKS</td>
                <td className="p-2 font-bold bg-gray-100 border-r border-black">SEMESTER</td>
                <td className="p-2">Semester {selectedRpsDetail.mata_kuliah?.semester_anjuran || 1}</td>
              </tr>
              <tr className="border-b border-black">
                <td className="p-2 font-bold bg-gray-100 border-r border-black">DOSEN PENGEMBANG RPS</td>
                <td className="p-2 border-r border-black font-semibold">{selectedRpsDetail.dosen_pengembang?.nama_lengkap || 'Dosen Pengampu'}</td>
                <td className="p-2 font-bold bg-gray-100 border-r border-black">KETUA PRODI</td>
                <td className="p-2 font-semibold">{selectedRpsDetail.kaprodi?.nama_lengkap || 'Dr. Ir. Ahmad Santoso, M.Kom'}</td>
              </tr>
            </tbody>
          </table>

          {/* Deskripsi Singkat */}
          <div className="mb-4 text-xs">
            <h4 className="font-bold border-b border-black pb-1 mb-1.5 uppercase">I. DESKRIPSI SINGKAT MATA KULIAH</h4>
            <p className="text-justify leading-relaxed whitespace-pre-line pl-2">
              {selectedRpsDetail.deskripsi_singkat || 'Mata kuliah ini membahas konsep dasar, metodologi, implementasi sistem terstruktur dan studi kasus komprehensif.'}
            </p>
          </div>

          {/* Capaian Pembelajaran (CPMK) */}
          <div className="mb-4 text-xs">
            <h4 className="font-bold border-b border-black pb-1 mb-1.5 uppercase">II. CAPAIAN PEMBELAJARAN MATA KULIAH (CPMK)</h4>
            <table className="w-full border-collapse border border-black text-xs">
              <thead className="bg-gray-100">
                <tr className="border-b border-black text-center font-bold">
                  <th className="p-1.5 border-r border-black w-20">KODE</th>
                  <th className="p-1.5 border-r border-black">DESKRIPSI CAPAIAN PEMBELAJARAN (CPMK)</th>
                  <th className="p-1.5 w-20">BOBOT</th>
                </tr>
              </thead>
              <tbody>
                {selectedRpsDetail.mata_kuliah?.cpmks?.length ? (
                  selectedRpsDetail.mata_kuliah.cpmks.map((c: any) => (
                    <tr key={c.id} className="border-b border-black">
                      <td className="p-1.5 font-bold font-mono text-center border-r border-black">{c.kode_cpmk}</td>
                      <td className="p-1.5 border-r border-black">{c.deskripsi}</td>
                      <td className="p-1.5 text-center font-bold">{c.bobot_persentase}%</td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-b border-black">
                    <td colSpan={3} className="p-2 text-center italic">CPMK disusun sesuai panduan kurikulum OBE SN-DIKTI.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pustaka & Referensi */}
          <div className="mb-4 text-xs">
            <h4 className="font-bold border-b border-black pb-1 mb-1.5 uppercase">III. REFERENSI / PUSTAKA PEMBELAJARAN</h4>
            <div className="pl-2 space-y-1">
              <p><strong>Pustaka Utama (Wajib):</strong></p>
              <p className="whitespace-pre-line pl-4 text-gray-800">{selectedRpsDetail.pustaka_utama || '1. Pressman, R. S. Software Engineering: A Practitioner’s Approach.\n2. Tanenbaum, A. S. Modern Operating Systems.'}</p>
              <p className="mt-2"><strong>Pustaka Pendukung:</strong></p>
              <p className="whitespace-pre-line pl-4 text-gray-800">{selectedRpsDetail.pustaka_pendukung || '1. IEEE Transactions on Systems and Software.\n2. Dokumentasi Standar Industri Terkait.'}</p>
            </div>
          </div>

          {/* Rencana 16 Pertemuan Mingguan */}
          <div className="mb-6 text-xs">
            <h4 className="font-bold border-b border-black pb-1 mb-1.5 uppercase">IV. RENCANA KEGIATAN PEMBELAJARAN MINGGUAN (16 PERTEMUAN)</h4>
            <table className="w-full border-collapse border border-black text-[10px]">
              <thead className="bg-gray-100 font-bold text-center">
                <tr className="border-b border-black">
                  <th className="p-1 border-r border-black w-8">MG</th>
                  <th className="p-1 border-r border-black w-1/4">KEMAMPUAN AKHIR (SUB-CPMK)</th>
                  <th className="p-1 border-r border-black">BAHAN KAJIAN / MATERI POKOK</th>
                  <th className="p-1 border-r border-black w-28">BENTUK & METODE</th>
                  <th className="p-1 w-12">BOBOT</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 16 }, (_, i) => i + 1).map((mKe) => {
                  const mData = selectedRpsDetail.mingguan?.find((m: any) => m.minggu_ke === mKe) || {};
                  return (
                    <tr key={mKe} className={`border-b border-black ${mKe === 8 || mKe === 16 ? 'bg-gray-100 font-bold' : ''}`}>
                      <td className="p-1 text-center font-bold border-r border-black">{mKe}</td>
                      <td className="p-1 border-r border-black">{mData.kemampuan_akhir || (mKe === 8 ? 'Evaluasi Tengah Semester' : mKe === 16 ? 'Evaluasi Akhir Semester' : `Sub-CPMK Pertemuan ${mKe}`)}</td>
                      <td className="p-1 border-r border-black">{mData.bahan_kajian || (mKe === 8 ? 'Ujian Tengah Semester (UTS)' : mKe === 16 ? 'Evaluasi Akhir Semester (UAS / Proyek)' : `Topik Pembahasan Perkuliahan Minggu ${mKe}`)}</td>
                      <td className="p-1 border-r border-black text-center">{mData.bentuk_metode || 'Kuliah & PBL'}</td>
                      <td className="p-1 text-center font-bold">{mData.bobot_penilaian ?? (mKe === 8 ? 25 : mKe === 16 ? 30 : 3)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Lembar Pengesahan Tanda Tangan */}
          <div className="grid grid-cols-3 gap-4 pt-6 text-center text-xs break-inside-avoid">
            <div className="space-y-16">
              <div>
                <span className="block text-gray-600">Dosen Pengembang RPS,</span>
              </div>
              <div>
                <strong className="underline block">{selectedRpsDetail.dosen_pengembang?.nama_lengkap || 'Dosen Pengampu'}</strong>
                <span className="font-mono text-[10px]">NIDN: {selectedRpsDetail.dosen_pengembang?.nidn || '0412058001'}</span>
              </div>
            </div>

            <div className="space-y-16">
              <div>
                <span className="block text-gray-600">Koordinator RMK,</span>
              </div>
              <div>
                <strong className="underline block">{selectedRpsDetail.koordinator_rmk?.nama_lengkap || 'Koordinator Bidang Keahlian'}</strong>
                <span className="font-mono text-[10px]">NIDN: {selectedRpsDetail.koordinator_rmk?.nidn || '0419088502'}</span>
              </div>
            </div>

            <div className="space-y-16">
              <div>
                <span className="block text-gray-600">Ketua Program Studi,</span>
              </div>
              <div>
                <strong className="underline block">{selectedRpsDetail.kaprodi?.nama_lengkap || 'Dr. Ir. Ahmad Santoso, M.Kom'}</strong>
                <span className="font-mono text-[10px]">NIP: 198005122005011002</span>
              </div>
            </div>
          </div>

          {/* Footer Dokumen */}
          <div className="pt-8 border-t border-black mt-8 flex justify-between items-center text-[9px] font-mono text-gray-500">
            <span>DOKUMEN RPS RESMI UNIVERSITAS NUSANTARA TERPADU — SISTEM INFORMASI AKADEMIK TERPADU (SIAKAD)</span>
            <span>VERIFIED OBE COMPLIANT #{selectedRpsDetail.mata_kuliah?.kode_mk}-2026</span>
          </div>
        </div>
      )}
    </div>
  );
}
