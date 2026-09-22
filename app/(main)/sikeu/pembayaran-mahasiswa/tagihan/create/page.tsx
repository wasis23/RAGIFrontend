'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  User,
  Search,
  CheckCircle2,
  Calendar,
  Building2,
  DollarSign,
  AlertCircle,
  Loader2,
  Sparkles,
  CreditCard,
  Copy,
  Check,
  Send,
  HelpCircle,
  RefreshCw,
  Info,
  Plus
} from 'lucide-react';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import { formatRupiah, angkaTerbilang } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Checkbox } from '@/components/ui/Checkbox';

interface StudentLookup {
  id: number;
  nim: string;
  nama_mahasiswa: string;
  tahun_angkatan: number;
  prodi?: string;
  is_calon_mahasiswa?: boolean;
  calon_mahasiswa_id?: number;
  no_pendaftaran?: string;
  nik?: string;
  tipe_referensi?: string;
}

interface DynamicTarifItem {
  setting_tarif_id: number;
  master_biaya_id: number;
  kode: string;
  nama: string;
  tipe: string;
  nominal: number;
  is_recurring: boolean;
  cakupan: 'spesifik_prodi' | 'global_kampus';
  semester?: number | null;
  cakupan_semester?: string;
  keterangan?: string;
  selected?: boolean;
  customNominal?: number;
}

export default function CreateTagihanMahasiswaPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'massal' | 'individu'>('massal');

  // Master References
  const [prodiList, setProdiList] = useState<any[]>([]);
  const [angkatanOptions, setAngkatanOptions] = useState<number[]>([]);
  const [dynamicKatalog, setDynamicKatalog] = useState<any[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);

  // ==========================================
  // TAB 1: FORM TAGIHAN MASSAL
  // ==========================================
  const currentYear = new Date().getFullYear();
  const [massAngkatan, setMassAngkatan] = useState<number>(currentYear);
  const [massProdiId, setMassProdiId] = useState<string>('');
  const [massSemester, setMassSemester] = useState<string>('1');
  const [massJatuhTempo, setMassJatuhTempo] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [massCatatan, setMassCatatan] = useState<string>('');
  const [selectedMassBiayaIds, setSelectedMassBiayaIds] = useState<number[]>([]);

  // Mass Preview State
  const [loadingMassPreview, setLoadingMassPreview] = useState(false);
  const [massPreviewData, setMassPreviewData] = useState<{
    total_mahasiswa: number;
    sudah_ditagih_count?: number;
    akan_diterbitkan_count?: number;
    total_estimasi_nominal: number;
    sample_mahasiswa: any[];
    mahasiswa?: any[];
    komponen_biaya: any[];
    komponen_terpakai?: any[];
  } | null>(null);

  // Mass Confirm & Submit
  const [showMassConfirm, setShowMassConfirm] = useState(false);
  const [submittingMass, setSubmittingMass] = useState(false);
  const [massSuccessData, setMassSuccessData] = useState<any | null>(null);

  // ==========================================
  // TAB 2: FORM TAGIHAN INDIVIDU / SPMB
  // ==========================================
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StudentLookup[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentLookup | null>(null);

  const [loadingStudentTarifs, setLoadingStudentTarifs] = useState(false);
  const [studentDynamicTarifs, setStudentDynamicTarifs] = useState<DynamicTarifItem[]>([]);
  const [indivSemester, setIndivSemester] = useState('1');
  const [indivJatuhTempo, setIndivJatuhTempo] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [indivCatatan, setIndivCatatan] = useState('');
  const [modePembayaran, setModePembayaran] = useState<'terbitkan_tagihan' | 'bayar_loket_tunai' | 'bayar_loket_transfer'>('terbitkan_tagihan');
  const [submittingIndiv, setSubmittingIndiv] = useState(false);
  const [indivSuccessData, setIndivSuccessData] = useState<any | null>(null);
  const [copiedVa, setCopiedVa] = useState(false);

  // Load Master Data
  useEffect(() => {
    const loadReferences = async () => {
      setLoadingRefs(true);
      try {
        const [resProdi, resAngkatan, resKatalog] = await Promise.all([
          sikeuService.getPembayaranMahasiswaProdiList(),
          sikeuService.getAngkatanList(),
          sikeuService.getPembayaranMahasiswaKatalogBiaya(),
        ]);

        const prodis = Array.isArray(resProdi.data) ? resProdi.data : [];
        const angkatans = Array.isArray(resAngkatan.data) ? resAngkatan.data : [];
        const katalog = Array.isArray(resKatalog.data) ? resKatalog.data : [];

        setProdiList(prodis);
        const years = angkatans.length > 0 ? angkatans : [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];
        setAngkatanOptions(years);
        if (years.length > 0) setMassAngkatan(years[0]);

        setDynamicKatalog(katalog);
        // Default check all dynamic fees
        setSelectedMassBiayaIds(katalog.map((k: any) => k.id));
      } catch {
        toast.error('Gagal memuat referensi prodi dan katalog biaya');
      } finally {
        setLoadingRefs(false);
      }
    };

    loadReferences();
  }, [currentYear]);

  // Fetch Mass Preview Debounced (tanpa filter komponen: tampilkan seluruh
  // komponen yang cocok tarif angkatan/prodi/semester, pilihan dicentang otomatis)
  const massBiayaDirtyRef = useRef(false);
  const fetchMassPreview = useCallback(async () => {
    if (!massAngkatan) return;
    setLoadingMassPreview(true);
    try {
      const res = await sikeuService.previewPembayaranMahasiswaMassTagihan({
        tahun_angkatan: massAngkatan,
        program_studi_id: massProdiId ? Number(massProdiId) : undefined,
        semester: massSemester ? Number(massSemester) : undefined,
      });

      if (res.data) {
        setMassPreviewData(res.data);
        // Auto-cocokkan komponen selama user belum mengubah manual
        if (!massBiayaDirtyRef.current && Array.isArray((res.data as any).komponen_terpakai)) {
          setSelectedMassBiayaIds((res.data as any).komponen_terpakai.map((k: any) => k.master_biaya_id));
        }
      }
    } catch {
      setMassPreviewData(null);
    } finally {
      setLoadingMassPreview(false);
    }
  }, [massAngkatan, massProdiId, massSemester]);

  useEffect(() => {
    if (activeTab === 'massal' && !loadingRefs) {
      const timer = setTimeout(() => {
        fetchMassPreview();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [activeTab, loadingRefs, fetchMassPreview]);

  // Komponen yang cocok tarif untuk parameter di atas (otomatis, bukan seluruh katalog)
  const matchedKomponen = useMemo(() => {
    const list = massPreviewData?.komponen_terpakai;
    if (Array.isArray(list) && list.length > 0) return list;
    return [];
  }, [massPreviewData]);

  // Total & daftar efektif sesuai komponen yang dicentang (di luar yang sudah ditagih)
  const effectivePreview = useMemo(() => {
    const rows = massPreviewData?.mahasiswa || massPreviewData?.sample_mahasiswa || [];
    let estimasi = 0;
    let akanTerbit = 0;
    const filtered = rows.map((m: any) => {
      const rincian = (m.rincian || []).filter((r: any) => selectedMassBiayaIds.includes(r.master_biaya_id));
      const total = rincian.reduce((s: number, r: any) => s + Number(r.nominal || 0), 0);
      if (!m.sudah_ditagih && total > 0) {
        akanTerbit += 1;
        estimasi += total;
      }
      return { ...m, rincian, total_nominal: total };
    });
    return { rows: filtered, estimasi, akanTerbit };
  }, [massPreviewData, selectedMassBiayaIds]);

  // Toggle Fee for Mass Generation (manual user = kunci pilihan otomatis)
  const toggleMassBiaya = (id: number) => {
    massBiayaDirtyRef.current = true;
    setSelectedMassBiayaIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Submit Mass Billing
  const handleConfirmMassSubmit = async () => {
    if (selectedMassBiayaIds.length === 0) {
      toast.error('Pilih minimal satu komponen tarif biaya dinamis');
      return;
    }

    setSubmittingMass(true);
    try {
      const payload = {
        tahun_angkatan: Number(massAngkatan),
        program_studi_id: massProdiId ? Number(massProdiId) : null,
        semester: Number(massSemester),
        jatuh_tempo: massJatuhTempo,
        catatan: massCatatan || `Tagihan Massal Angkatan ${massAngkatan} Semester ${massSemester}`,
        items: selectedMassBiayaIds.map((id) => ({
          master_biaya_id: id,
        })),
      };

      const res = await sikeuService.createPembayaranMahasiswaMassTagihan(payload);
      setShowMassConfirm(false);
      setMassSuccessData(res.data);
      toast.success(`Sukses menerbitkan ${res.data?.created_count || 0} tagihan massal`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memproses penerbitan tagihan massal');
    } finally {
      setSubmittingMass(false);
    }
  };

  // Student Search (Tab Individu) Debounce
  useEffect(() => {
    if (activeTab !== 'individu' || !searchQuery.trim()) {
      setIsSearching(false);
      return;
    }

    let isMounted = true;
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await sikeuService.searchMahasiswa(searchQuery);
        if (isMounted) {
          setSearchResults(Array.isArray(res.data) ? res.data : []);
        }
      } catch {
        if (isMounted) setSearchResults([]);
      } finally {
        if (isMounted) setIsSearching(false);
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery, activeTab]);

  // Select Student for Tab Individu
  const handleSelectStudent = async (mhs: StudentLookup) => {
    setSelectedStudent(mhs);
    setSearchQuery('');
    setSearchResults([]);
    setLoadingStudentTarifs(true);

    try {
      const params: any = {};
      if (mhs.is_calon_mahasiswa || mhs.tipe_referensi === 'calon_mahasiswa') {
        params.calon_mahasiswa_id = mhs.calon_mahasiswa_id || mhs.id;
        params.tipe_referensi = 'calon_mahasiswa';
      } else {
        params.mahasiswa_id = mhs.id;
      }
      // Kirim semester penagihan agar komponen khusus semester (lab/magang) ikut tersaring
      if (indivSemester) params.semester = Number(indivSemester);

      const res = await sikeuService.getPembayaranMahasiswaTarifMahasiswa(params);
      const items = Array.isArray(res.data?.komponen_tarif) ? res.data.komponen_tarif : [];

      // Initialize selected items (default check recurring / UKT)
      const mapped: DynamicTarifItem[] = items.map((item: any) => ({
        ...item,
        selected: true,
        customNominal: item.nominal,
      }));

      setStudentDynamicTarifs(mapped);
    } catch {
      setStudentDynamicTarifs([]);
      toast.error('Gagal memuat katalog tarif dinamis untuk mahasiswa ini');
    } finally {
      setLoadingStudentTarifs(false);
    }
  };

  const toggleStudentTarifItem = (index: number) => {
    setStudentDynamicTarifs((prev) => {
      const copy = [...prev];
      copy[index].selected = !copy[index].selected;
      return copy;
    });
  };

  const updateStudentTarifNominal = (index: number, val: number) => {
    setStudentDynamicTarifs((prev) => {
      const copy = [...prev];
      copy[index].customNominal = Math.max(0, val);
      return copy;
    });
  };

  // Submit Individual Billing
  const handleSubmitIndiv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      toast.error('Silakan cari dan pilih mahasiswa terlebih dahulu');
      return;
    }

    const selectedItems = studentDynamicTarifs.filter((t) => t.selected);
    if (selectedItems.length === 0) {
      toast.error('Pilih minimal satu komponen tarif biaya dinamis');
      return;
    }

    const isCalon = selectedStudent.is_calon_mahasiswa || selectedStudent.tipe_referensi === 'calon_mahasiswa';

    setSubmittingIndiv(true);
    try {
      const payload: any = {
        mahasiswa_id: isCalon ? null : selectedStudent.id,
        calon_mahasiswa_id: isCalon ? (selectedStudent.calon_mahasiswa_id || selectedStudent.id) : null,
        tipe_referensi: isCalon ? 'calon_mahasiswa' : 'mahasiswa',
        semester: Number(indivSemester),
        jatuh_tempo: indivJatuhTempo,
        catatan: indivCatatan,
        mode_pembayaran: modePembayaran,
        items: selectedItems.map((it) => ({
          master_biaya_id: it.master_biaya_id,
          nominal: Number(it.customNominal || it.nominal),
          keterangan: it.keterangan || undefined,
        })),
      };

      const res = await sikeuService.createPembayaranMahasiswaTagihan(payload);
      setIndivSuccessData(res.data);
      toast.success('Tagihan mahasiswa berhasil diproses!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menerbitkan tagihan mahasiswa');
    } finally {
      setSubmittingIndiv(false);
    }
  };

  const totalIndivNominal = useMemo(() => {
    return studentDynamicTarifs
      .filter((t) => t.selected)
      .reduce((sum, item) => sum + (Number(item.customNominal || item.nominal) || 0), 0);
  }, [studentDynamicTarifs]);

  const handleCopyVa = (va: string) => {
    navigator.clipboard.writeText(va);
    setCopiedVa(true);
    toast.success('Nomor Virtual Account berhasil disalin');
    setTimeout(() => setCopiedVa(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl pb-16 animate-fade-in">
      <PageHeader
        title="Input Tagihan Mahasiswa Baru"
        description="Terbitkan tagihan kuliah dinamis secara massal (per angkatan & program studi) atau per mahasiswa/SPMB."
        action={
          <Link href="/sikeu/pembayaran-mahasiswa/tagihan">
            <Button
              variant="outline"
              icon={<ArrowLeft size={16} />}
              className="border-slate-300 text-slate-700 hover:bg-slate-50 font-bold min-h-[38px] text-xs"
            >
              Kembali ke Daftar Tagihan
            </Button>
          </Link>
        }
      />

      {/* Navigasi Tab Horizontal Standar Divided Bottom Border */}
      <div className="flex border-b border-slate-200 gap-1 sm:gap-2 overflow-x-auto pb-0.5">
        <button
          type="button"
          onClick={() => setActiveTab('massal')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'massal'
              ? 'border-primary-600 text-primary-700 bg-primary-50/60'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/70'
          }`}
        >
          <Users size={16} className={activeTab === 'massal' ? 'text-primary-600' : 'text-slate-400'} />
          <span>Tagihan Massal (Per Angkatan & Prodi)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('individu')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'individu'
              ? 'border-primary-600 text-primary-700 bg-primary-50/60'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/70'
          }`}
        >
          <User size={16} className={activeTab === 'individu' ? 'text-primary-600' : 'text-slate-400'} />
          <span>Tagihan Per Mahasiswa (Individu / SPMB)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: TAGIHAN MASSAL */}
      {/* ========================================================================= */}
      {activeTab === 'massal' && (
        <div className="space-y-6">
          <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Users size={16} className="text-primary-600" />
                <span>1. Parameter Sasaran Penagihan Massal</span>
              </h2>
              <span className="text-2xs text-slate-500 font-medium">
                Kalkulasi otomatis mengikuti tarif matriks prodi
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Select
                label="Tahun Angkatan *"
                value={String(massAngkatan)}
                onChange={(v) => { massBiayaDirtyRef.current = false; setMassAngkatan(Number(v)); }}
                options={angkatanOptions.map((th) => ({
                  value: String(th),
                  label: `Angkatan ${th}`,
                }))}
              />

              <Select
                label="Program Studi"
                value={massProdiId}
                onChange={(v) => { massBiayaDirtyRef.current = false; setMassProdiId(v as string); }}
                options={[
                  { value: '', label: 'Semua Program Studi (Seluruh Kampus)' },
                  ...prodiList.map((p) => ({
                    value: String(p.id),
                    label: `${p.nama} (${p.jenjang || 'S1'})`,
                  })),
                ]}
              />

              <Select
                label="Semester Tagihan *"
                value={massSemester}
                onChange={(v) => { massBiayaDirtyRef.current = false; setMassSemester(v as string); }}
                options={Array.from({ length: 14 }, (_, i) => ({
                  value: String(i + 1),
                  label: `Semester ${i + 1}`,
                }))}
              />

              <Input
                type="date"
                label="Tanggal Jatuh Tempo *"
                value={massJatuhTempo}
                onChange={(e) => setMassJatuhTempo(e.target.value)}
              />
            </div>

            <Input
              label="Catatan Tagihan (Opsional)"
              placeholder={`Contoh: Tagihan Kuliah Semester ${massSemester} Angkatan ${massAngkatan}`}
              value={massCatatan}
              onChange={(e) => setMassCatatan(e.target.value)}
            />
          </div>

          {/* KOMPONEN BIAYA OTOMATIS SESUAI TARIF */}
          <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Sparkles size={16} className="text-primary-600" />
                <span>2. Komponen Biaya yang Ditagihkan (Otomatis Cocok Tarif)</span>
              </h2>
              <span className="text-2xs text-slate-500 font-medium">
                Angkatan {massAngkatan} • {massProdiId ? 'Prodi terpilih' : 'Semua prodi'} • Semester {massSemester}
              </span>
            </div>

            {loadingMassPreview && matchedKomponen.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin text-primary-600" />
                Mencocokkan komponen dengan pengaturan tarif...
              </div>
            ) : matchedKomponen.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center text-xs text-amber-800 space-y-1">
                <p className="font-bold">Tidak ada komponen yang cocok untuk parameter ini.</p>
                <p className="text-2xs">Belum ada tarif aktif Angkatan {massAngkatan} Semester {massSemester}. Atur dulu di menu Pengaturan Tarif.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {matchedKomponen.map((k: any) => {
                  const isChecked = selectedMassBiayaIds.includes(k.master_biaya_id);
                  const nominalLabel = k.nominal_min === k.nominal_max
                    ? formatRupiah(k.nominal_min)
                    : `${formatRupiah(k.nominal_min)} – ${formatRupiah(k.nominal_max)}`;
                  return (
                    <div
                      key={k.master_biaya_id}
                      onClick={() => toggleMassBiaya(k.master_biaya_id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                        isChecked
                          ? 'border-primary-400 bg-primary-50/50 shadow-2xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // Handled by container
                        className="mt-0.5 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                      />
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-900 block line-clamp-1">
                          {k.nama}
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-2xs px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold">
                            {k.kode}
                          </span>
                          <span className="font-mono text-2xs px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-bold">
                            {nominalLabel}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* LIVE PREVIEW MAHASISWA TERDAMPAK */}
          <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <DollarSign size={16} className="text-emerald-600" />
                <span>3. Pratinjau Kalkulasi Tagihan Massal</span>
              </h2>
              {loadingMassPreview ? (
                <span className="text-2xs font-semibold text-slate-400 flex items-center gap-1">
                  <Loader2 size={12} className="animate-spin" /> Menghitung target...
                </span>
              ) : (
                <button
                  type="button"
                  onClick={fetchMassPreview}
                  className="text-2xs text-primary-700 hover:text-primary-800 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw size={12} /> Segarkan Simulasi
                </button>
              )}
            </div>

            {loadingMassPreview ? (
              <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                <Loader2 size={24} className="animate-spin mx-auto text-primary-600" />
                <p>Mengkalkulasi mahasiswa angkatan {massAngkatan} dan tarif matriks...</p>
              </div>
            ) : massPreviewData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-1">
                    <span className="text-2xs font-bold text-blue-700 uppercase tracking-wider">
                      Mahasiswa Sasaran
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-extrabold text-blue-950 font-mono">
                        {massPreviewData.total_mahasiswa}
                      </span>
                      <span className="text-xs text-blue-800 font-medium">Mahasiswa Aktif</span>
                    </div>
                    <p className="text-2xs text-blue-700">
                      Angkatan {massAngkatan} {massProdiId ? `• Prodi Terpilih` : `• Seluruh Prodi`} • Semester {massSemester}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-1">
                    <span className="text-2xs font-bold text-emerald-700 uppercase tracking-wider">
                      Akan Diterbitkan
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-extrabold text-emerald-950 font-mono">
                        {effectivePreview.akanTerbit}
                      </span>
                      <span className="text-xs text-emerald-800 font-medium">Invoice Baru</span>
                    </div>
                    <p className="text-2xs text-emerald-700">
                      Estimasi {formatRupiah(effectivePreview.estimasi)} • {massPreviewData.sudah_ditagih_count || 0} sudah ditagih (dilewati)
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1">
                    <span className="text-2xs font-bold text-amber-700 uppercase tracking-wider">
                      Sudah Ditagih
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-extrabold text-amber-950 font-mono">
                        {massPreviewData.sudah_ditagih_count || 0}
                      </span>
                      <span className="text-xs text-amber-800 font-medium">Dilewati Otomatis</span>
                    </div>
                    <p className="text-2xs text-amber-700">
                      Memiliki tagihan Semester {massSemester} & tidak ditagih ulang
                    </p>
                  </div>
                </div>

                {/* Daftar Mahasiswa Cocok */}
                {effectivePreview.rows.length > 0 ? (
                  <div>
                    <span className="text-xs font-bold text-slate-700 block mb-2">
                      Mahasiswa Cocok Parameter ({effectivePreview.rows.length}):
                    </span>
                    <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs max-h-80 overflow-y-auto">
                      {effectivePreview.rows.map((m: any, idx: number) => (
                        <div key={m.id ?? idx} className="p-3 flex items-center justify-between bg-white hover:bg-slate-50">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900 block">
                              {m.nama_lengkap}{' '}
                              {m.sudah_ditagih && (
                                <span className="ml-1 text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded">
                                  Sudah ditagih
                                </span>
                              )}
                            </span>
                            <span className="text-2xs text-slate-500 font-mono">
                              NIM: {m.nim} • {m.prodi}
                              {m.sudah_ditagih && m.nomor_tagihan ? ` • ${m.nomor_tagihan}` : ''}
                            </span>
                            {m.rincian?.length > 0 && (
                              <span className="text-[10px] text-slate-400 block">
                                {m.rincian.map((r: any) => r.nama).join(', ')}
                              </span>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-mono font-bold text-slate-900 text-xs block">
                              {formatRupiah(m.total_nominal)}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {m.rincian?.length || 0} komponen tarif
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center text-xs text-amber-800 space-y-1">
                    <p className="font-bold">Tidak ditemukan mahasiswa aktif pada parameter yang dipilih.</p>
                    <p className="text-2xs">Pastikan ada mahasiswa terdaftar pada angkatan {massAngkatan} di modul SIAKAD.</p>
                  </div>
                )}

                {/* Tombol Terbitkan Massal */}
                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    disabled={
                      submittingMass ||
                      !massPreviewData ||
                      effectivePreview.akanTerbit === 0 ||
                      selectedMassBiayaIds.length === 0
                    }
                    onClick={() => setShowMassConfirm(true)}
                    icon={submittingMass ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    className="font-bold shadow-md min-w-[200px]"
                  >
                    Terbitkan Tagihan Massal ({effectivePreview.akanTerbit} Mhs)
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TAGIHAN INDIVIDU / SPMB */}
      {/* ========================================================================= */}
      {activeTab === 'individu' && (
        <form onSubmit={handleSubmitIndiv} className="space-y-6">
          {/* CARI & PILIH MAHASISWA */}
          <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Search size={16} className="text-primary-600" />
                <span>1. Cari & Pilih Mahasiswa / Calon Mahasiswa (SPMB)</span>
              </h2>
              {selectedStudent && (
                <span className="badge badge-green text-2xs font-bold flex items-center gap-1">
                  <CheckCircle2 size={12} /> Mahasiswa Terpilih
                </span>
              )}
            </div>

            {!selectedStudent ? (
              <div className="relative space-y-2">
                <Input
                  label="Ketik NIM, No Pendaftaran SPMB, atau Nama Mahasiswa *"
                  placeholder="Contoh: 2301001001 atau SPMB2026 atau Fadil..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />

                {isSearching && (
                  <div className="absolute top-full left-0 right-0 z-30 p-3 bg-white rounded-xl shadow-lg border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin text-primary-600" />
                    <span>Mencari mahasiswa di sistem SIAKAD & SPMB...</span>
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-30 bg-white rounded-xl shadow-xl border border-slate-200 divide-y divide-slate-100 max-h-60 overflow-y-auto mt-1">
                    {searchResults.map((m) => (
                      <button
                        key={`${m.is_calon_mahasiswa ? 'calon' : 'mhs'}-${m.id}`}
                        type="button"
                        onClick={() => handleSelectStudent(m)}
                        className="w-full p-3 text-left hover:bg-primary-50/60 flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-slate-900 block">{m.nama_mahasiswa}</span>
                          <span className="text-2xs text-slate-500 font-mono">
                            {m.nim || m.no_pendaftaran || '-'} • {m.prodi || 'Program Studi'}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${
                            m.is_calon_mahasiswa
                              ? 'bg-amber-100 text-amber-800 border-amber-200'
                              : 'bg-blue-100 text-blue-800 border-blue-200'
                          }`}
                        >
                          {m.is_calon_mahasiswa ? 'SPMB' : 'SIAKAD'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-slate-900">{selectedStudent.nama_mahasiswa}</span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${
                        selectedStudent.is_calon_mahasiswa
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : 'bg-blue-100 text-blue-800 border-blue-200'
                      }`}
                    >
                      {selectedStudent.is_calon_mahasiswa ? 'CALON MHS SPMB' : 'MAHASISWA SIAKAD'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-mono">
                    NIM / Pendaftaran: {selectedStudent.nim || selectedStudent.no_pendaftaran || '-'} • Angkatan:{' '}
                    {selectedStudent.tahun_angkatan} • {selectedStudent.prodi || '-'}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedStudent(null);
                    setStudentDynamicTarifs([]);
                  }}
                  className="text-xs font-bold border-slate-300"
                >
                  Ganti Mahasiswa
                </Button>
              </div>
            )}
          </div>

          {/* KOMPONEN BIAYA DINAMIS MAHASISWA */}
          {selectedStudent && (
            <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Sparkles size={16} className="text-primary-600" />
                  <span>2. Rincian Komponen Tarif Dinamis yang Berlaku</span>
                </h2>
                <span className="text-2xs text-slate-500 font-medium">
                  Mengikuti matriks angkatan {selectedStudent.tahun_angkatan} & prodi
                </span>
              </div>

              {loadingStudentTarifs ? (
                <div className="p-6 text-center text-xs text-slate-500 space-y-2">
                  <Loader2 size={20} className="animate-spin mx-auto text-primary-600" />
                  <p>Mencocokkan aturan tarif prodi...</p>
                </div>
              ) : studentDynamicTarifs.length === 0 ? (
                <div className="p-6 rounded-2xl bg-amber-50/80 border border-amber-200 text-center space-y-3">
                  <div className="space-y-1">
                    <p className="font-bold text-amber-900 text-xs sm:text-sm">
                      Belum Ada Pengaturan Tarif untuk Angkatan {selectedStudent.tahun_angkatan}
                    </p>
                    <p className="text-2xs text-amber-700 max-w-md mx-auto">
                      Komponen biaya dinamis untuk mahasiswa angkatan {selectedStudent.tahun_angkatan} ({selectedStudent.prodi}) belum dikonfigurasikan di menu Pengaturan Tarif. Silakan atur tarif terlebih dahulu agar komponen dapat ditagihkan.
                    </p>
                  </div>
                  <Link href="/sikeu/pembayaran-mahasiswa/tarif/create">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      icon={<Plus size={14} />}
                      className="text-xs font-bold shadow-xs"
                    >
                      Atur Tarif Angkatan {selectedStudent.tahun_angkatan}
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden text-xs">
                  {studentDynamicTarifs.map((item, idx) => (
                    <div
                      key={item.setting_tarif_id || idx}
                      className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        item.selected ? 'bg-primary-50/20' : 'bg-white opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={Boolean(item.selected)}
                          onChange={() => toggleStudentTarifItem(idx)}
                          className="mt-0.5 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                        />
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 block text-xs">{item.nama}</span>
                          <span className="font-mono text-2xs text-slate-500">
                            {item.kode} • Cakupan:{' '}
                            {item.cakupan === 'spesifik_prodi' ? 'Khusus Prodi' : 'Semua Prodi (Global)'}
                            {item.semester !== null && item.semester !== undefined ? ` • Smt ${item.semester}` : ''}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pl-7 sm:pl-0">
                        <span className="text-2xs text-slate-500 font-medium">Nominal:</span>
                        <input
                          type="number"
                          disabled={!item.selected}
                          value={item.customNominal ?? item.nominal}
                          onChange={(e) => updateStudentTarifNominal(idx, Number(e.target.value))}
                          className="w-36 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 disabled:bg-slate-100"
                        />
                      </div>
                    </div>
                  ))}

                  <div className="p-4 bg-slate-50 flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">Total Tagihan:</span>
                    <span className="font-mono font-extrabold text-primary-700 text-base">
                      {formatRupiah(totalIndivNominal)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PARAMETER & OPSI PEMBAYARAN */}
          {selectedStudent && studentDynamicTarifs.length > 0 && (
            <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <CreditCard size={16} className="text-primary-600" />
                  <span>3. Parameter Tagihan & Saluran Pembayaran</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Semester *"
                  value={indivSemester}
                  onChange={(v) => {
                    setIndivSemester(v as string);
                    // Muat ulang komponen sesuai semester (lab/magang hanya muncul di semester tertentu)
                    if (selectedStudent) handleSelectStudent(selectedStudent);
                  }}
                  options={Array.from({ length: 14 }, (_, i) => ({
                    value: String(i + 1),
                    label: `Semester ${i + 1}`,
                  }))}
                />

                <Input
                  type="date"
                  label="Tanggal Jatuh Tempo *"
                  value={indivJatuhTempo}
                  onChange={(e) => setIndivJatuhTempo(e.target.value)}
                />
              </div>

              <Input
                label="Catatan Tagihan (Opsional)"
                placeholder="Penjelasan tagihan mahasiswa ini..."
                value={indivCatatan}
                onChange={(e) => setIndivCatatan(e.target.value)}
              />

              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-slate-800 block">Metode / Alur Pembayaran *</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div
                    onClick={() => setModePembayaran('terbitkan_tagihan')}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-1 select-none ${
                      modePembayaran === 'terbitkan_tagihan'
                        ? 'border-primary-500 bg-primary-50/60 ring-2 ring-primary-500/20 shadow-2xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-900 block">Terbitkan Tagihan Online</span>
                    <span className="text-2xs text-slate-500 block">
                      Mahasiswa memilih saluran bayar (BCA, Mandiri, BNI, BRI, QRIS, dll) di portal. Nomor VA digenerate otomatis via Xendit
                    </span>
                  </div>

                  <div
                    onClick={() => setModePembayaran('bayar_loket_tunai')}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-1 select-none ${
                      modePembayaran === 'bayar_loket_tunai'
                        ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-2xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xs font-bold text-emerald-900 block">Bayar Tunai di Kasir</span>
                    <span className="text-2xs text-emerald-700 block">
                      Langsung lunas saat itu juga via uang fisik tunai di meja loket kasir kampus
                    </span>
                  </div>

                  <div
                    onClick={() => setModePembayaran('bayar_loket_transfer')}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-1 select-none ${
                      modePembayaran === 'bayar_loket_transfer'
                        ? 'border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-2xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xs font-bold text-indigo-900 block">Bayar Transfer di Kasir</span>
                    <span className="text-2xs text-indigo-700 block">
                      Langsung lunas via mesin EDC / bukti transfer bank langsung di hadapan kasir
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={submittingIndiv || totalIndivNominal <= 0}
                  icon={submittingIndiv ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  className="font-bold shadow-md min-w-[180px]"
                >
                  {modePembayaran === 'terbitkan_tagihan' ? 'Terbitkan Tagihan Online' : 'Simpan & Cetak Kuitansi Kasir'}
                </Button>
              </div>
            </div>
          )}
        </form>
      )}

      {/* ========================================================================= */}
      {/* MODAL KONFIRMASI PENERBITAN MASSAL */}
      {/* ========================================================================= */}
      <ConfirmDialog
        isOpen={showMassConfirm}
        onClose={() => setShowMassConfirm(false)}
        onConfirm={handleConfirmMassSubmit}
        title="Konfirmasi Terbitkan Tagihan Massal"
        message={
          <div className="space-y-2 text-left text-xs text-slate-600">
            <p>
              Anda akan menerbitkan tagihan untuk <strong>{effectivePreview.akanTerbit} mahasiswa</strong>{' '}
              pada <strong>Angkatan {massAngkatan} Semester {massSemester}</strong>{' '}
              {massProdiId ? `(Prodi terpilih)` : `(Semua Program Studi)`} dengan estimasi akumulasi nominal{' '}
              <strong className="text-primary-700 font-mono">
                {formatRupiah(effectivePreview.estimasi)}
              </strong>.
            </p>
            <p className="text-2xs text-slate-500">
              Setiap mahasiswa akan menerima tagihan resmi di portal mahasiswa dan dapat memilih metode bayar via Xendit dengan batas jatuh tempo{' '}
              {massJatuhTempo}. Lanjutkan?
            </p>
          </div>
        }
        confirmText="Ya, Terbitkan Massal"
        cancelText="Batal"
        variant="primary"
        isLoading={submittingMass}
      />

      {/* ========================================================================= */}
      {/* MODAL HASIL SUKSES MASSAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(massSuccessData)}
        onClose={() => {
          setMassSuccessData(null);
          router.push('/sikeu/pembayaran-mahasiswa/tagihan');
        }}
        title="Penerbitan Tagihan Massal Berhasil"
        size="md"
      >
        <div className="space-y-4 text-center p-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto">
            <CheckCircle2 size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Tagihan Massal Berhasil Diterbitkan!
          </h3>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1 text-left">
            <div className="flex justify-between">
              <span>Total Tagihan Terbit:</span>
              <strong className="font-mono text-slate-900">{massSuccessData?.created_count || 0} Invoice</strong>
            </div>
            <div className="flex justify-between">
              <span>Total Akumulasi Nominal:</span>
              <strong className="font-mono text-emerald-700">{formatRupiah(massSuccessData?.total_nominal || 0)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Sasaran Angkatan:</span>
              <span className="font-medium text-slate-800">{massSuccessData?.tahun_angkatan}</span>
            </div>
            {(massSuccessData?.skipped_count || 0) > 0 && (
              <div className="flex justify-between">
                <span>Dilewati (sudah ditagih):</span>
                <strong className="font-mono text-amber-700">{massSuccessData?.skipped_count} Mahasiswa</strong>
              </div>
            )}
          </div>
          <div className="flex justify-end pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                setMassSuccessData(null);
                router.push('/sikeu/pembayaran-mahasiswa/tagihan');
              }}
              className="font-bold text-xs"
            >
              Lihat Daftar Tagihan
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL HASIL SUKSES INDIVIDU */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(indivSuccessData)}
        onClose={() => {
          setIndivSuccessData(null);
          router.push('/sikeu/pembayaran-mahasiswa/tagihan');
        }}
        title="Tagihan Berhasil Diterbitkan"
        size="md"
      >
        {indivSuccessData && (
          <div className="space-y-4 text-center p-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Invoice Tagihan #{indivSuccessData.nomor_tagihan}
            </h3>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Tagihan:</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatRupiah(indivSuccessData.total_tagihan)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status Pembayaran:</span>
                <span className="font-bold text-emerald-700 uppercase">{indivSuccessData.status}</span>
              </div>
              {indivSuccessData.va_number && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-500 block mb-1">Nomor Virtual Account:</span>
                  <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-300 font-mono font-bold text-sm text-primary-700">
                    <span>{indivSuccessData.va_number}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyVa(indivSuccessData.va_number)}
                      className="text-slate-500 hover:text-slate-800 p-1"
                      title="Salin VA"
                    >
                      {copiedVa ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {indivSuccessData.status === 'lunas' && (
                <div className="pt-2 border-t border-slate-200">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 space-y-1">
                    <span className="font-bold text-xs flex items-center gap-1.5 text-emerald-800">
                      <CheckCircle2 size={14} className="text-emerald-600" />
                      Lunas di Meja Kasir
                    </span>
                    <p className="text-2xs text-emerald-700 leading-relaxed">
                      Pembayaran telah berhasil diverifikasi dan tercatat lunas di kasir kampus.
                    </p>
                  </div>
                </div>
              )}

              {!indivSuccessData.va_number && indivSuccessData.status !== 'lunas' && (
                <div className="pt-2 border-t border-slate-200">
                  <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-lg text-blue-900 space-y-1">
                    <span className="font-bold text-xs flex items-center gap-1.5 text-blue-800">
                      <CreditCard size={14} className="text-blue-600" />
                      Pembayaran Digital Xendit
                    </span>
                    <p className="text-2xs text-blue-700 leading-relaxed">
                      Tagihan berhasil diterbitkan dengan status belum bayar. Nomor VA atau kode QRIS akan digenerate secara otomatis oleh sistem Xendit sesuai bank / saluran bayar yang dipilih mahasiswa di portal saat checkout.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  setIndivSuccessData(null);
                  router.push('/sikeu/pembayaran-mahasiswa/tagihan');
                }}
                className="font-bold text-xs"
              >
                Kembali ke Riwayat Tagihan
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
