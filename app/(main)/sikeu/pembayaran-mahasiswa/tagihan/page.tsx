'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  Filter,
  CreditCard,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Building2,
  Calendar,
  UserCheck,
  Loader2,
  Copy,
  Check,
  Printer,
  Sparkles,
  ArrowLeft,
  DollarSign,
  FileText,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import { formatRupiah, angkaTerbilang } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { Checkbox } from '@/components/ui/Checkbox';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';

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
  keterangan?: string;
  selected?: boolean;
  customNominal?: number;
}

interface TagihanRecord {
  id: number;
  nomor_tagihan: string;
  mahasiswa_id?: number;
  calon_mahasiswa_id?: number;
  is_calon_mahasiswa: boolean;
  nim: string;
  nama_mahasiswa: string;
  prodi: string;
  total_tagihan: number;
  total_potongan: number;
  total_bayar: number;
  sisa: number;
  status: string;
  jatuh_tempo?: string;
  va_number?: string;
  created_at?: string;
  rincian_komponen?: Array<{
    master_biaya_id: number;
    nama_biaya: string;
    nominal: number;
  }>;
}

export default function InputTagihanMahasiswaPage() {
  const [activeTab, setActiveTab] = useState<'daftar' | 'buat'>('daftar');

  // List Tagihan State
  const [tagihanList, setTagihanList] = useState<TagihanRecord[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [meta, setMeta] = useState<any>({ current_page: 1, last_page: 1, total: 0, per_page: 15 });
  const [page, setPage] = useState(1);

  // Filter Drawer State (List)
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [appliedFilters, setAppliedFilters] = useState({ search: '', status: 'all' });

  // Form Buat Tagihan State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StudentLookup[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentLookup | null>(null);

  // Dynamic Fee Components for Selected Student
  const [loadingTarifs, setLoadingTarifs] = useState(false);
  const [dynamicTarifs, setDynamicTarifs] = useState<DynamicTarifItem[]>([]);
  const [semester, setSemester] = useState('1');
  const [jatuhTempo, setJatuhTempo] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [catatan, setCatatan] = useState('');
  const [modePembayaran, setModePembayaran] = useState<'terbitkan_tagihan' | 'bayar_loket_tunai' | 'bayar_loket_transfer'>('terbitkan_tagihan');
  const [submitting, setSubmitting] = useState(false);

  // Success Result Dialog
  const [successResult, setSuccessResult] = useState<any | null>(null);
  const [copiedVa, setCopiedVa] = useState(false);

  // Detail Modal State
  const [selectedDetail, setSelectedDetail] = useState<TagihanRecord | null>(null);

  // Fetch List Tagihan
  const fetchTagihan = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await sikeuService.getPembayaranMahasiswaTagihanList({
        page: page,
        per_page: 15,
        search: appliedFilters.search || undefined,
        status: appliedFilters.status !== 'all' ? appliedFilters.status : undefined,
      });

      setTagihanList(Array.isArray(res.data) ? res.data : []);
      if (res.meta) {
        setMeta(res.meta);
      }
    } catch {
      setTagihanList([]);
      toast.error('Gagal memuat daftar tagihan mahasiswa');
    } finally {
      setLoadingList(false);
    }
  }, [page, appliedFilters]);

  useEffect(() => {
    if (activeTab === 'daftar') {
      fetchTagihan();
    }
  }, [activeTab, fetchTagihan]);

  // Search Mahasiswa Debounce
  useEffect(() => {
    if (activeTab !== 'buat' || !searchQuery.trim()) {
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

  // Load Dynamic Fee Components when a student is selected
  const handleSelectStudent = async (mhs: StudentLookup) => {
    setSelectedStudent(mhs);
    setSearchQuery('');
    setSearchResults([]);
    setLoadingTarifs(true);

    try {
      const isCalon = !!(mhs.is_calon_mahasiswa || mhs.tipe_referensi === 'calon_mahasiswa' || !mhs.nim || mhs.nim === '-');
      const lookupParams = isCalon
        ? { calon_mahasiswa_id: mhs.calon_mahasiswa_id || mhs.id, tipe_referensi: 'calon_mahasiswa' }
        : { mahasiswa_id: mhs.id };

      const res = await sikeuService.getPembayaranMahasiswaTarifMahasiswa(lookupParams);

      if (res.data && Array.isArray(res.data.komponen_tarif)) {
        const mapped = res.data.komponen_tarif.map((item: any) => ({
          ...item,
          selected: true, // default checked
          customNominal: Number(item.nominal),
        }));
        setDynamicTarifs(mapped);
      } else {
        setDynamicTarifs([]);
      }
    } catch {
      toast.error('Gagal memuat tarif dinamis mahasiswa dari database');
      setDynamicTarifs([]);
    } finally {
      setLoadingTarifs(false);
    }
  };

  const handleToggleTarif = (index: number) => {
    setDynamicTarifs((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleNominalChange = (index: number, val: number) => {
    setDynamicTarifs((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, customNominal: Math.max(0, val) } : item))
    );
  };

  // Kalkulasi Total Tagihan yang dipilih
  const totalSelectedNominal = useMemo(() => {
    return dynamicTarifs
      .filter((item) => item.selected)
      .reduce((sum, item) => sum + (item.customNominal !== undefined ? item.customNominal : item.nominal), 0);
  }, [dynamicTarifs]);

  // Submit Tagihan Baru
  const handleSubmitTagihan = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStudent) {
      toast.error('Pilih mahasiswa terlebih dahulu');
      return;
    }

    const selectedItems = dynamicTarifs.filter((t) => t.selected);
    if (selectedItems.length === 0) {
      toast.error('Pilih minimal 1 komponen biaya yang akan ditagihkan');
      return;
    }

    if (!jatuhTempo) {
      toast.error('Tentukan tanggal jatuh tempo tagihan');
      return;
    }

    setSubmitting(true);
    try {
      const isCalon = !!(selectedStudent.is_calon_mahasiswa || selectedStudent.tipe_referensi === 'calon_mahasiswa' || !selectedStudent.nim || selectedStudent.nim === '-');
      const payload = {
        mahasiswa_id: isCalon ? null : selectedStudent.id,
        calon_mahasiswa_id: isCalon ? (selectedStudent.calon_mahasiswa_id || selectedStudent.id) : null,
        tipe_referensi: isCalon ? 'calon_mahasiswa' : 'mahasiswa',
        semester: parseInt(semester) || 1,
        jatuh_tempo: jatuhTempo,
        catatan: catatan || `Tagihan Semester ${semester}`,
        items: selectedItems.map((item) => ({
          master_biaya_id: item.master_biaya_id,
          nominal: item.customNominal !== undefined ? item.customNominal : item.nominal,
          keterangan: item.keterangan || item.nama,
        })),
        mode_pembayaran: modePembayaran,
        jumlah_bayar: totalSelectedNominal,
      };

      const res = await sikeuService.createPembayaranMahasiswaTagihan(payload);
      toast.success(res.message || 'Tagihan mahasiswa berhasil diproses');
      setSuccessResult(res.data);
      setSelectedStudent(null);
      setDynamicTarifs([]);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Gagal memproses tagihan mahasiswa');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedVa(true);
    toast.success('Nomor Virtual Account disalin ke clipboard');
    setTimeout(() => setCopiedVa(false), 2000);
  };

  // Kolom Tabel List Tagihan
  const columns: ColumnDef<TagihanRecord>[] = [
    {
      key: 'nomor_tagihan',
      label: 'Nomor Tagihan',
      render: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            {row.nomor_tagihan}
          </span>
          <span className="text-2xs block text-slate-400 mt-1">
            {row.created_at || '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'mahasiswa',
      label: 'Mahasiswa / Calon Mhs',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
            <span>{row.nama_mahasiswa}</span>
            {row.is_calon_mahasiswa && (
              <Badge variant="amber" className="text-[10px] py-0 px-1 font-bold">
                SPMB
              </Badge>
            )}
          </p>
          <p className="font-mono text-2xs text-slate-500">
            {row.nim && row.nim !== '-' ? `NIM: ${row.nim}` : 'Calon Mahasiswa'} • {row.prodi}
          </p>
        </div>
      ),
    },
    {
      key: 'total_tagihan',
      label: 'Total Tagihan',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 block">
            {formatRupiah(row.total_tagihan)}
          </span>
          {row.sisa > 0 && row.sisa < row.total_tagihan && (
            <span className="text-2xs text-amber-600 font-semibold">
              Sisa: {formatRupiah(row.sisa)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status Tagihan',
      render: (row) => {
        if (row.status === 'lunas') {
          return (
            <Badge variant="green" className="text-[10px] font-bold flex items-center gap-1 w-fit">
              <CheckCircle2 size={12} /> LUNAS
            </Badge>
          );
        }
        if (row.status === 'sebagian') {
          return (
            <Badge variant="blue" className="text-[10px] font-bold flex items-center gap-1 w-fit">
              <Clock size={12} /> SEBAGIAN
            </Badge>
          );
        }
        return (
          <Badge variant="red" className="text-[10px] font-bold flex items-center gap-1 w-fit">
            <XCircle size={12} /> BELUM BAYAR
          </Badge>
        );
      },
    },
    {
      key: 'va_number',
      label: 'Virtual Account',
      render: (row) =>
        row.va_number ? (
          <span className="font-mono text-xs font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-200">
            {row.va_number}
          </span>
        ) : (
          <span className="text-2xs text-slate-400 italic">Loket Kasir</span>
        ),
    },
    {
      key: 'jatuh_tempo',
      label: 'Jatuh Tempo',
      render: (row) => (
        <span className="text-xs text-slate-600">
          {row.jatuh_tempo || '-'}
        </span>
      ),
    },
    {
      key: 'aksi',
      label: 'Aksi',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end">
          <DropdownMenu
            items={[
              {
                label: 'Lihat Rincian Biaya',
                icon: <FileText size={14} />,
                onClick: () => setSelectedDetail(row),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Input Tagihan Mahasiswa"
        description="Penerbitan tagihan invoice dan Virtual Account (VA) berbasis komponen tarif dinamis per program studi dan angkatan."
        action={
          <div className="flex items-center gap-2 flex-wrap">
            {activeTab === 'daftar' && (
              <Button
                variant="outline"
                icon={<Filter size={16} />}
                onClick={() => setShowFilter(true)}
                className="font-bold min-h-[38px] text-xs"
              >
                Filter
              </Button>
            )}
            <Button
              variant={activeTab === 'buat' ? 'outline' : 'primary'}
              icon={activeTab === 'buat' ? <ArrowLeft size={16} /> : <Plus size={16} />}
              onClick={() => {
                setActiveTab((prev) => (prev === 'daftar' ? 'buat' : 'daftar'));
                if (activeTab === 'buat') {
                  fetchTagihan();
                }
              }}
              className="font-bold min-h-[38px] text-xs px-3.5 shadow-sm"
            >
              {activeTab === 'buat' ? 'Kembali ke Riwayat Tagihan' : 'Input Tagihan Baru'}
            </Button>
          </div>
        }
      />

      {/* Navigasi Tab Horizontal Standar Divided Bottom Border */}
      <div className="flex border-b border-slate-200 gap-1 sm:gap-2 overflow-x-auto pb-0.5">
        <button
          type="button"
          onClick={() => setActiveTab('daftar')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'daftar'
              ? 'border-primary-600 text-primary-700 bg-primary-50/60'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/70'
          }`}
        >
          <CreditCard size={15} className={activeTab === 'daftar' ? 'text-primary-600' : 'text-slate-400'} />
          <span>Daftar Tagihan Terbit</span>
          <span
            className={`text-2xs px-1.5 py-0.5 rounded font-semibold ${
              activeTab === 'daftar' ? 'bg-primary-100 text-primary-700' : 'bg-slate-200/80 text-slate-600'
            }`}
          >
            {meta?.total || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('buat')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'buat'
              ? 'border-primary-600 text-primary-700 bg-primary-50/60'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/70'
          }`}
        >
          <Sparkles size={15} className={activeTab === 'buat' ? 'text-primary-600' : 'text-slate-400'} />
          <span>Form Input Tagihan (Dinamis)</span>
        </button>
      </div>

      {/* VIEW 1: DAFTAR TAGIHAN */}
      {activeTab === 'daftar' && (
        <div className="space-y-4">
          <DataTable
            data={tagihanList}
            isLoading={loadingList}
            columns={columns}
            meta={meta}
            onPageChange={(p) => setPage(p)}
            emptyMessage="Belum ada data tagihan mahasiswa yang diterbitkan."
          />
        </div>
      )}

      {/* VIEW 2: FORM INPUT TAGIHAN MAHASISWA */}
      {activeTab === 'buat' && (
        <form onSubmit={handleSubmitTagihan} className="space-y-5">
          {/* LANGKAH 1: CARI & PILIH MAHASISWA */}
          <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Search size={16} className="text-primary-600" />
                <span>1. Pilih Mahasiswa / Calon Mahasiswa</span>
              </h2>
              {selectedStudent && (
                <span className="badge badge-green text-2xs font-bold flex items-center gap-1">
                  <CheckCircle2 size={12} /> Mahasiswa Terpilih
                </span>
              )}
            </div>

            {!selectedStudent ? (
              <div className="space-y-3">
                <div className="relative">
                  <Input
                    placeholder="Ketik NIM, Nama Mahasiswa, atau No Pendaftaran SPMB..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 size={16} className="animate-spin text-primary-600" />
                    </div>
                  )}
                </div>

                {/* Hasil Pencarian */}
                {searchResults.length > 0 && (
                  <div className="border border-slate-200 rounded-xl bg-white divide-y divide-slate-100 max-h-60 overflow-y-auto shadow-sm">
                    {searchResults.map((mhs) => {
                      const isCalon = !!(mhs.is_calon_mahasiswa || mhs.tipe_referensi === 'calon_mahasiswa' || !mhs.nim || mhs.nim === '-');
                      const idLabel = mhs.nim && mhs.nim !== '-' ? `NIM: ${mhs.nim}` : (mhs.no_pendaftaran ? `Reg: ${mhs.no_pendaftaran}` : `ID: ${mhs.id}`);
                      return (
                        <div
                          key={`s-${mhs.id}-${mhs.nim || mhs.no_pendaftaran || ''}`}
                          onClick={() => handleSelectStudent(mhs)}
                          className="p-3 hover:bg-primary-50/70 transition flex items-center justify-between cursor-pointer"
                        >
                          <div>
                            <p className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                              <span>{mhs.nama_mahasiswa}</span>
                              {isCalon && <Badge variant="amber" className="text-[10px] py-0 px-1 font-bold">SPMB</Badge>}
                            </p>
                            <p className="text-2xs text-slate-500 font-mono mt-0.5">
                              {idLabel} • {mhs.prodi || 'Program Studi'} • Angkatan {mhs.tahun_angkatan}
                            </p>
                          </div>
                          <span className="text-2xs font-bold px-2.5 py-1 rounded bg-white text-primary-700 border border-slate-200">
                            Pilih
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {searchQuery.trim().length > 1 && !isSearching && searchResults.length === 0 && (
                  <p className="text-2xs text-slate-400 italic text-center py-3">
                    Tidak ditemukan mahasiswa yang cocok dengan kata kunci &quot;{searchQuery}&quot;.
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between p-3.5 bg-primary-50/80 border border-primary-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary-600 text-white rounded-xl">
                    <UserCheck size={20} />
                  </div>
                  <div>
                    <p className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      <span>{selectedStudent.nama_mahasiswa}</span>
                      {(selectedStudent.is_calon_mahasiswa || !selectedStudent.nim || selectedStudent.nim === '-') && (
                        <Badge variant="amber" className="text-[10px] py-0 px-1 font-bold">Calon Mahasiswa SPMB</Badge>
                      )}
                    </p>
                    <p className="text-xs text-slate-600 font-mono mt-0.5">
                      {selectedStudent.nim && selectedStudent.nim !== '-' ? `NIM: ${selectedStudent.nim}` : `No. Reg: ${selectedStudent.no_pendaftaran || '-'}`}
                      {' '}• Program Studi: <strong>{selectedStudent.prodi || '-'}</strong>
                      {' '}• Angkatan: <strong>{selectedStudent.tahun_angkatan}</strong>
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelectedStudent(null);
                    setDynamicTarifs([]);
                  }}
                  className="text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50"
                >
                  Ganti Mahasiswa
                </Button>
              </div>
            )}
          </div>

          {/* LANGKAH 2: KOMPONEN TARIF DINAMIS BERDASARKAN PRODI & ANGKATAN */}
          {selectedStudent && (
            <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <CreditCard size={16} className="text-primary-600" />
                    <span>2. Komponen Tarif Dinamis (Setting Tarif Mahasiswa)</span>
                  </h2>
                  <p className="text-2xs text-slate-500 mt-0.5">
                    Komponen dan nominal berikut dimuat otomatis dari pengaturan tarif aktif untuk Angkatan {selectedStudent.tahun_angkatan} & Prodi {selectedStudent.prodi}.
                  </p>
                </div>
                <span className="text-2xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                  {dynamicTarifs.filter((t) => t.selected).length} dari {dynamicTarifs.length} komponen dipilih
                </span>
              </div>

              {loadingTarifs ? (
                <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Loader2 size={24} className="animate-spin text-primary-600" />
                  <p className="text-xs font-semibold">Memuat komponen tarif dinamis mahasiswa...</p>
                </div>
              ) : dynamicTarifs.length === 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5">
                  <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-amber-900">
                      Belum Ada Pengaturan Tarif Aktif
                    </p>
                    <p className="text-2xs text-amber-700 mt-0.5">
                      Mahasiswa ini berada di Angkatan {selectedStudent.tahun_angkatan} dan Prodi {selectedStudent.prodi}, namun belum ada komponen tarif aktif yang dikonfigurasi pada menu <strong>Pengaturan Tarif</strong>. Silakan tambahkan tarif terlebih dahulu di menu Pengaturan Tarif.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {dynamicTarifs.map((item, idx) => {
                      const isChecked = Boolean(item.selected);
                      return (
                        <div
                          key={`tarif-${item.setting_tarif_id}-${item.master_biaya_id}`}
                          className={`p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                            isChecked ? 'bg-primary-50/30' : 'bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="pt-0.5">
                              <Checkbox
                                checked={isChecked}
                                onChange={() => handleToggleTarif(idx)}
                                label=""
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-xs font-bold text-primary-700 bg-white px-1.5 py-0.5 rounded border border-primary-200">
                                  {item.kode}
                                </span>
                                <span className="font-bold text-slate-900 text-xs sm:text-sm">
                                  {item.nama}
                                </span>
                                {item.cakupan === 'global_kampus' ? (
                                  <Badge variant="blue" className="text-[10px]">
                                    Semua Prodi (Global)
                                  </Badge>
                                ) : (
                                  <Badge variant="purple" className="text-[10px]">
                                    Spesifik Prodi
                                  </Badge>
                                )}
                              </div>
                              <p className="text-2xs text-slate-500 mt-0.5">
                                {item.keterangan || `Komponen tagihan tipe ${item.tipe}`}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 justify-end pl-7 sm:pl-0">
                            <span className="text-2xs font-bold text-slate-500 whitespace-nowrap">Rp</span>
                            <input
                              type="number"
                              disabled={!isChecked}
                              value={item.customNominal !== undefined ? item.customNominal : item.nominal}
                              onChange={(e) => handleNominalChange(idx, parseFloat(e.target.value) || 0)}
                              className="w-36 px-2.5 py-1.5 text-xs font-mono font-bold text-right border border-slate-200 rounded-lg bg-white disabled:bg-slate-100 disabled:text-slate-400 focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Ringkasan Subtotal */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      Total Tagihan yang Akan Diterbitkan:
                    </span>
                    <span className="font-mono font-extrabold text-base sm:text-lg text-slate-900">
                      {formatRupiah(totalSelectedNominal)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* LANGKAH 3: PENGATURAN TAGIHAN & METODE PEMBAYARAN */}
          {selectedStudent && dynamicTarifs.length > 0 && (
            <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
              <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-primary-600" />
                <span>3. Konfigurasi Tagihan & Mode Pembayaran</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Target Semester Mahasiswa *"
                  options={[
                    { value: '1', label: 'Semester 1' },
                    { value: '2', label: 'Semester 2' },
                    { value: '3', label: 'Semester 3' },
                    { value: '4', label: 'Semester 4' },
                    { value: '5', label: 'Semester 5' },
                    { value: '6', label: 'Semester 6' },
                    { value: '7', label: 'Semester 7' },
                    { value: '8', label: 'Semester 8' },
                  ]}
                  value={semester}
                  onChange={(val) => setSemester(val as string)}
                />

                <Input
                  type="date"
                  label="Tanggal Jatuh Tempo *"
                  value={jatuhTempo}
                  onChange={(e) => setJatuhTempo(e.target.value)}
                />
              </div>

              <Textarea
                label="Catatan / Keterangan Tagihan (Opsional)"
                placeholder="Misal: Tagihan semester ganjil tahun akademik aktif..."
                rows={2}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
              />

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <p className="text-xs font-extrabold text-slate-800">
                  Pilih Mode Pemrosesan Tagihan:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label
                    onClick={() => setModePembayaran('terbitkan_tagihan')}
                    className={`p-3 rounded-xl border flex flex-col gap-1 cursor-pointer transition-all ${
                      modePembayaran === 'terbitkan_tagihan'
                        ? 'bg-primary-50/80 border-primary-500 ring-2 ring-primary-500/20 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                      <CreditCard size={14} className="text-primary-600" />
                      Terbitkan Invoice / VA
                    </span>
                    <span className="text-2xs text-slate-500">
                      Status Belum Bayar. Mahasiswa dapat membayar mandiri via Bank atau Portal.
                    </span>
                  </label>

                  <label
                    onClick={() => setModePembayaran('bayar_loket_tunai')}
                    className={`p-3 rounded-xl border flex flex-col gap-1 cursor-pointer transition-all ${
                      modePembayaran === 'bayar_loket_tunai'
                        ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-600" />
                      Bayar Tunai di Loket
                    </span>
                    <span className="text-2xs text-slate-500">
                      Status langsung Lunas. Transaksi kas loket kampus tercatat seketika.
                    </span>
                  </label>

                  <label
                    onClick={() => setModePembayaran('bayar_loket_transfer')}
                    className={`p-3 rounded-xl border flex flex-col gap-1 cursor-pointer transition-all ${
                      modePembayaran === 'bayar_loket_transfer'
                        ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-600" />
                      Bayar Transfer di Loket
                    </span>
                    <span className="text-2xs text-slate-500">
                      Status langsung Lunas dengan konfirmasi bukti transfer di loket.
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelectedStudent(null);
                    setDynamicTarifs([]);
                  }}
                  disabled={submitting}
                  className="text-xs font-bold"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitting || totalSelectedNominal <= 0}
                  icon={submitting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  className="text-xs font-bold shadow-sm px-6"
                >
                  {submitting
                    ? 'Memproses Tagihan...'
                    : modePembayaran === 'terbitkan_tagihan'
                    ? `Terbitkan Tagihan (${formatRupiah(totalSelectedNominal)})`
                    : `Proses Pelunasan Loket (${formatRupiah(totalSelectedNominal)})`}
                </Button>
              </div>
            </div>
          )}
        </form>
      )}

      {/* FILTER DRAWER RIWAYAT TAGIHAN */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Tagihan Mahasiswa"
        width="400px"
        footer={
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFilterSearch('');
                setFilterStatus('all');
                setAppliedFilters({ search: '', status: 'all' });
                setPage(1);
                setShowFilter(false);
              }}
              className="text-xs font-bold"
            >
              Reset
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                setAppliedFilters({ search: filterSearch, status: filterStatus });
                setPage(1);
                setShowFilter(false);
              }}
              className="text-xs font-bold shadow-sm px-5"
            >
              Terapkan Filter
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Cari Nomor Tagihan / Mahasiswa"
            placeholder="Ketik kata kunci..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />

          <Select
            label="Status Pembayaran"
            options={[
              { value: 'all', label: 'Semua Status' },
              { value: 'belum_bayar', label: 'Belum Bayar' },
              { value: 'sebagian', label: 'Sebagian' },
              { value: 'lunas', label: 'Lunas' },
            ]}
            value={filterStatus}
            onChange={(val) => setFilterStatus(val as string)}
          />
        </div>
      </Drawer>

      {/* MODAL SUKSES PENERBITAN / PEMBAYARAN */}
      <Modal
        isOpen={Boolean(successResult)}
        onClose={() => setSuccessResult(null)}
        title={successResult?.status === 'lunas' ? 'Kuitansi Pembayaran Loket Kasir' : 'Tagihan Berhasil Diterbitkan'}
        size="md"
      >
        {successResult && (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
              <CheckCircle2 size={22} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-emerald-950">
                  {successResult.status === 'lunas'
                    ? 'Pembayaran Loket Berhasil Dilunasi'
                    : 'Tagihan Mahasiswa & Virtual Account Siap'}
                </p>
                <p className="text-xs text-emerald-800 mt-0.5">
                  {successResult.nama_mahasiswa} • Total Tagihan: <strong>{formatRupiah(successResult.total_tagihan)}</strong>
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Nomor Invoice:</span>
                <span className="font-mono font-bold text-slate-800">{successResult.nomor_tagihan}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500">Nomor Virtual Account:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-extrabold text-primary-700 bg-white px-2 py-0.5 rounded border border-primary-200">
                    {successResult.va_number}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(successResult.va_number)}
                    className="p-1 text-slate-500 hover:text-primary-600 transition"
                    title="Salin VA"
                  >
                    {copiedVa ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Status Tagihan:</span>
                <span className={`font-bold uppercase ${successResult.status === 'lunas' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {successResult.status}
                </span>
              </div>
              <div className="py-1">
                <span className="text-slate-500 block mb-0.5">Terbilang:</span>
                <p className="font-semibold text-slate-800 italic capitalize">
                  {angkaTerbilang(successResult.total_tagihan)} rupiah
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => setSuccessResult(null)}
                className="text-xs font-bold"
              >
                Selesai
              </Button>
              <Button
                variant="primary"
                icon={<Printer size={15} />}
                onClick={() => window.print()}
                className="text-xs font-bold shadow-sm"
              >
                Cetak Bukti
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL RINCIAN DETAIL BIAYA */}
      <Modal
        isOpen={Boolean(selectedDetail)}
        onClose={() => setSelectedDetail(null)}
        title="Rincian Komponen Tagihan"
        size="md"
      >
        {selectedDetail && (
          <div className="space-y-4">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <p className="font-bold text-slate-900 text-sm">{selectedDetail.nama_mahasiswa}</p>
              <p className="text-xs text-slate-500 font-mono">
                {selectedDetail.nim !== '-' ? `NIM: ${selectedDetail.nim}` : 'Calon Mahasiswa'} • {selectedDetail.prodi}
              </p>
              <p className="text-xs text-slate-500">Invoice: <span className="font-mono font-semibold text-slate-800">{selectedDetail.nomor_tagihan}</span></p>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-700 mb-2">Daftar Komponen Biaya:</p>
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden text-xs">
                {selectedDetail.rincian_komponen && selectedDetail.rincian_komponen.length > 0 ? (
                  selectedDetail.rincian_komponen.map((r, i) => (
                    <div key={i} className="p-3 flex justify-between items-center bg-white">
                      <span className="font-medium text-slate-800">{r.nama_biaya}</span>
                      <span className="font-mono font-bold text-slate-900">{formatRupiah(r.nominal)}</span>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-slate-400 italic text-center">
                    Rincian komponen biaya tidak tersedia
                  </div>
                )}
                <div className="p-3 flex justify-between items-center bg-slate-50 font-bold">
                  <span>Total Tagihan:</span>
                  <span className="font-mono text-primary-700 text-sm">{formatRupiah(selectedDetail.total_tagihan)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => setSelectedDetail(null)}
                className="text-xs font-bold"
              >
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
