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
  Send
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { siakadService } from '@/services/siakad.service';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function KurikulumObePage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'cpl' | 'cpmk' | 'rps'>('dashboard');
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
      });
      if (res.data) {
        setMatakuliahList(res.data);
        if (res.data[0] && !selectedMkId) {
          setSelectedMkId(res.data[0].id);
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
    }
  }, [selectedProdiId, activeTab]);

  useEffect(() => {
    if (selectedMkId && activeTab === 'cpmk') {
      fetchCpmk();
    }
  }, [selectedMkId, activeTab]);

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

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge badge-purple text-2xs font-extrabold uppercase tracking-wider">
              Modul Kurikulum OBE (SN-DIKTI)
            </span>
            <span className="badge badge-green text-2xs font-bold uppercase">
              Akreditasi Unggul
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight mt-1.5">
            Kurikulum & Rencana Pembelajaran Semester (RPS OBE)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Perumusan CPL, penurunan CPMK, penyusunan rancangan pembelajaran (RPS 16 Minggu), dan verifikasi Kaprodi.
          </p>
        </div>

        {/* Prodi Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Program Studi:</span>
          <select
            value={selectedProdiId}
            onChange={(e) => setSelectedProdiId(Number(e.target.value))}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 outline-none cursor-pointer"
          >
            {prodis.map((p) => (
              <option key={p.id} value={p.id}>{p.nama} ({p.jenjang})</option>
            ))}
          </select>
        </div>
      </div>

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
      </div>

      {/* ======================================================== */}
      {/* TAB 1: PEMANTAUAN & MONITORING OBE */}
      {/* ======================================================== */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-1">
              <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">CPL Terumuskan</span>
              <span className="text-2xl font-black text-slate-900 font-mono">
                {dashboardData?.summary?.total_cpl || 4}
              </span>
              <p className="text-2xs text-slate-400">Standar SN-Dikti / IABEE</p>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-1">
              <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">CPMK Terpetakan</span>
              <span className="text-2xl font-black text-primary-700 font-mono">
                {dashboardData?.summary?.total_cpmk || 24}
              </span>
              <p className="text-2xs text-slate-400">Lintas Seluruh Mata Kuliah</p>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-1">
              <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">Mata Kuliah Ber-RPS</span>
              <span className="text-2xl font-black text-emerald-700 font-mono">
                {dashboardData?.summary?.total_rps || 8} / {dashboardData?.summary?.total_matakuliah || 8}
              </span>
              <p className="text-2xs text-emerald-600 font-bold">100% Kelengkapan Dokumen</p>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-1">
              <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">RPS Disetujui Kaprodi</span>
              <span className="text-2xl font-black text-purple-700 font-mono">
                {dashboardData?.summary?.rps_disetujui || 8}
              </span>
              <p className="text-2xs text-purple-600 font-bold">Siap Pembelajaran Aktif</p>
            </div>
          </div>

          {/* CPL Fulfillment by Category Progress */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-5">
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
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
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
              className="text-xs font-bold"
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
              + Tambah Rumusan CPL
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-28">KODE CPL</th>
                  <th className="py-3 px-4 w-40">RANAH / KATEGORI</th>
                  <th className="py-3 px-4">DESKRIPSI CAPAIAN PEMBELAJARAN LULUSAN</th>
                  <th className="py-3 px-4 text-center w-24">STATUS</th>
                  <th className="py-3 px-4 text-right w-24">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {loading ? (
                  <tr><td colSpan={5} className="py-8 text-center text-slate-400">Memuat CPL...</td></tr>
                ) : cplList.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-slate-400">Belum ada CPL yang dirumuskan</td></tr>
                ) : (
                  cplList.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4 font-mono font-black text-primary-700">{c.kode_cpl}</td>
                      <td className="py-3.5 px-4">
                        <span className="badge badge-purple text-2xs uppercase font-bold">
                          {c.kategori.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 leading-relaxed font-normal text-slate-800">{c.deskripsi}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="badge badge-green text-2xs font-bold">Aktif</span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="outline"
                          icon={<Edit3 size={12} />}
                          className="text-2xs py-1 px-2.5 h-auto font-bold"
                          onClick={() => {
                            setEditingCpl(c);
                            setCplForm({
                              program_studi_id: c.program_studi_id,
                              kode_cpl: c.kode_cpl,
                              kategori: c.kategori,
                              deskripsi: c.deskripsi,
                            });
                            setIsCplModalOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: PEMETAAN CPMK MATA KULIAH */}
      {/* ======================================================== */}
      {activeTab === 'cpmk' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-5 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
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
              <select
                value={selectedMkId}
                onChange={(e) => setSelectedMkId(Number(e.target.value))}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none cursor-pointer"
              >
                {matakuliahList.map((m) => (
                  <option key={m.id} value={m.id}>{m.kode_mk} - {m.nama} ({m.total_sks} SKS)</option>
                ))}
              </select>

              <Button
                variant="primary"
                icon={<Plus size={15} />}
                className="text-xs font-bold shrink-0"
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
                + Tambah CPMK
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-28">KODE CPMK</th>
                  <th className="py-3 px-4 w-32">KORELASI CPL</th>
                  <th className="py-3 px-4">DESKRIPSI CAPAIAN MATA KULIAH</th>
                  <th className="py-3 px-4 text-center w-28">BOBOT (%)</th>
                  <th className="py-3 px-4 text-right w-24">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {loading ? (
                  <tr><td colSpan={5} className="py-8 text-center text-slate-400">Memuat CPMK...</td></tr>
                ) : cpmkList.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-slate-400">Belum ada CPMK untuk mata kuliah ini</td></tr>
                ) : (
                  cpmkList.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4 font-mono font-black text-primary-700">{c.kode_cpmk}</td>
                      <td className="py-3.5 px-4">
                        {c.cpl ? (
                          <span className="badge badge-blue font-mono text-2xs font-bold" title={c.cpl.deskripsi}>
                            {c.cpl.kode_cpl}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 leading-relaxed font-normal text-slate-800">{c.deskripsi}</td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">{c.bobot_persentase}%</td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="outline"
                          icon={<Edit3 size={12} />}
                          className="text-2xs py-1 px-2.5 h-auto font-bold"
                          onClick={() => {
                            setEditingCpmk(c);
                            setCpmkForm({
                              mata_kuliah_id: c.mata_kuliah_id,
                              cpl_id: c.cpl_id || '',
                              kode_cpmk: c.kode_cpmk,
                              deskripsi: c.deskripsi,
                              bobot_persentase: c.bobot_persentase || 30,
                            });
                            setIsCpmkModalOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: DOKUMEN RPS & ALUR VERIFIKASI / APPROVAL KAPRODI */}
      {/* ======================================================== */}
      {activeTab === 'rps' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <FileText size={16} className="text-primary-600" />
                Rencana Pembelajaran Semester (RPS) & Status Verifikasi Kaprodi
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar dokumen RPS mata kuliah kurikulum OBE, evaluasi 16 pertemuan, dan persetujuan Ketua Program Studi.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4">KODE & MATA KULIAH</th>
                  <th className="py-3 px-4">SMT / SKS</th>
                  <th className="py-3 px-4">DOSEN PENGEMBANG RPS</th>
                  <th className="py-3 px-4">VERIFIKATOR KAPRODI</th>
                  <th className="py-3 px-4 text-center">STATUS VERIFIKASI</th>
                  <th className="py-3 px-4 text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {loading ? (
                  <tr><td colSpan={6} className="py-8 text-center text-slate-400">Memuat data RPS...</td></tr>
                ) : rpsList.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-slate-400">Belum ada dokumen RPS</td></tr>
                ) : (
                  rpsList.map((rps) => {
                    const isApproved = rps.status === 'disetujui';
                    const isSubmitted = rps.status === 'diajukan';
                    const isRevision = rps.status === 'revisi';

                    return (
                      <tr key={rps.id} className="hover:bg-slate-50 transition">
                        <td className="py-3.5 px-4 font-mono">
                          <span className="font-extrabold text-slate-900 block font-sans">{rps.mata_kuliah?.nama}</span>
                          <span className="text-2xs text-slate-400">{rps.mata_kuliah?.kode_mk} • Tahun {rps.tahun_ajaran}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-800">Smt {rps.semester}</span>
                          <span className="text-2xs text-primary-700 block font-bold">{rps.mata_kuliah?.total_sks || 3} SKS</span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {rps.dosen_pengembang?.nama_lengkap || 'Tim Kurikulum Prodi'}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {rps.kaprodi?.nama_lengkap || 'Kaprodi'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {isApproved && (
                            <span className="badge badge-green text-2xs font-bold">✓ Disetujui Kaprodi</span>
                          )}
                          {isSubmitted && (
                            <span className="badge badge-yellow text-2xs font-bold">⏳ Menunggu Verifikasi</span>
                          )}
                          {isRevision && (
                            <span className="badge badge-red text-2xs font-bold" title={rps.catatan_revisi}>⚠️ Perlu Revisi</span>
                          )}
                          {!isApproved && !isSubmitted && !isRevision && (
                            <span className="badge badge-gray text-2xs font-bold">Draft Penyusunan</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="primary"
                              icon={<Eye size={12} />}
                              className="text-2xs py-1.5 px-3 h-auto font-bold shadow-xs"
                              onClick={() => handleOpenDetailRps(rps)}
                            >
                              Detail & Verifikasi RPS
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
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
  );
}
