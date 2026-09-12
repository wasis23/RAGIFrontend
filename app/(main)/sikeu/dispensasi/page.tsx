'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Plus, Filter, CheckCircle2, Clock, XCircle, Loader2, Save, Eye, Search, AlertTriangle, Printer, User, ShieldAlert, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { useForm } from 'react-hook-form';

interface DispensasiItem {
  id: number;
  mahasiswa_id: number;
  nama_mahasiswa: string;
  nim: string;
  tipe_dispensasi: string;
  nominal_per_cicilan: number;
  jumlah_cicilan?: number;
  jatuh_tempo_baru: string;
  allow_krs?: boolean;
  status: 'pending' | 'approved' | 'rejected' | string;
  alasan?: string;
  has_unpaid_previous_dispensation?: boolean;
  unpaid_previous_dispensation_count?: number;
  created_at?: string;
  tagihan?: {
    nomor_tagihan?: string;
    total_tagihan?: number;
    jatuh_tempo?: string;
  };
}

interface StudentOption {
  id: number;
  nim: string;
  nama_mahasiswa: string;
  tahun_angkatan: number;
  jalur_kelas: string;
  kelompok_ukt: number;
}

interface FormValues {
  mahasiswa_id: number;
  tagihan_id: number;
  tipe_dispensasi: string;
  jatuh_tempo_baru: string;
  jumlah_cicilan: number;
  nominal_per_cicilan: number;
  allow_krs: boolean;
  alasan: string;
}

const TIPE_DISPENSASI_OPTIONS = [
  { value: 'penundaan_jatuh_tempo', label: 'Penundaan Tanggal Jatuh Tempo' },
  { value: 'pembayaran_cicilan', label: 'Skema Pembayaran Per-Cicilan' },
  { value: 'keringanan_potongan', label: 'Permohonan Keringanan Khusus' },
];

const formatRupiah = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);

export default function DispensasiListPage() {
  const [data, setData] = useState<DispensasiItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter Drawer State — 2-stage
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [appliedFilters, setAppliedFilters] = useState({ search: '', status: 'all' });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Student Search in Modal
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentResults, setStudentResults] = useState<StudentOption[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentOption | null>(null);
  const [studentWarning, setStudentWarning] = useState<string | null>(null);

  // Detail / Print Modal State
  const [detailItem, setDetailItem] = useState<DispensasiItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      mahasiswa_id: 0,
      tagihan_id: 1,
      tipe_dispensasi: 'penundaan_jatuh_tempo',
      jatuh_tempo_baru: '2026-09-30',
      jumlah_cicilan: 1,
      nominal_per_cicilan: 1500000,
      allow_krs: true,
      alasan: '',
    },
  });

  const fetchDispensasi = async () => {
    try {
      setLoading(true);
      const res = await sikeuService.getDispensasiList();
      const raw = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
      setData(raw);
    } catch {
      setData([]);
      toast.error('Gagal memuat data dispensasi tagihan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDispensasi();
  }, []);

  // Autocomplete student search debounce
  useEffect(() => {
    if (!studentSearchQuery.trim()) {
      setStudentResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await sikeuService.searchMahasiswa(studentSearchQuery);
        setStudentResults(Array.isArray(res.data) ? res.data : []);
      } catch {
        setStudentResults([]);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [studentSearchQuery]);

  const handleSelectStudent = (stu: StudentOption) => {
    setSelectedStudent(stu);
    setValue('mahasiswa_id', stu.id);
    setStudentSearchQuery('');
    setStudentResults([]);

    // Check if student has previous unpaid dispensations
    const prevDispensasi = data.filter(
      (d) => d.mahasiswa_id === stu.id && (d.status === 'approved' || d.status === 'pending')
    );

    if (prevDispensasi.length > 0) {
      setStudentWarning(
        `PERINGATAN: Mahasiswa ${stu.nama_mahasiswa} (${stu.nim}) masih memiliki ${prevDispensasi.length} riwayat pengajuan/dispensasi aktif yang belum dilunasi.`
      );
    } else {
      setStudentWarning(null);
    }
  };

  const handleOpenAdd = () => {
    setSelectedStudent(null);
    setStudentSearchQuery('');
    setStudentResults([]);
    setStudentWarning(null);
    reset({
      mahasiswa_id: 0,
      tagihan_id: 1,
      tipe_dispensasi: 'penundaan_jatuh_tempo',
      jatuh_tempo_baru: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      jumlah_cicilan: 1,
      nominal_per_cicilan: 1500000,
      allow_krs: true,
      alasan: '',
    });
    setIsModalOpen(true);
  };

  const onSubmitForm = async (formData: FormValues) => {
    if (!selectedStudent) {
      toast.error('Silakan cari dan pilih mahasiswa terlebih dahulu');
      return;
    }

    setSubmitting(true);
    try {
      await sikeuService.submitDispensasi({
        ...formData,
        tagihan_id: formData.tagihan_id || 1,
      });
      toast.success('Pengajuan dispensasi pembayaran berhasil dikirim');
      setIsModalOpen(false);
      fetchDispensasi();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal mengajukan dispensasi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDetail = (item: DispensasiItem) => {
    setDetailItem(item);
    setIsDetailOpen(true);
  };

  const handleApplyFilter = () => {
    setAppliedFilters({ search: filterSearch, status: filterStatus });
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterStatus('all');
    setAppliedFilters({ search: '', status: 'all' });
    setShowFilter(false);
  };

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (appliedFilters.search) {
        const q = appliedFilters.search.toLowerCase();
        const matchNama = item.nama_mahasiswa?.toLowerCase().includes(q);
        const matchNim = item.nim?.toLowerCase().includes(q);
        const matchAlasan = item.alasan?.toLowerCase().includes(q);
        const matchTagihan = item.tagihan?.nomor_tagihan?.toLowerCase().includes(q);
        if (!matchNama && !matchNim && !matchAlasan && !matchTagihan) return false;
      }
      if (appliedFilters.status !== 'all' && item.status !== appliedFilters.status) return false;
      return true;
    });
  }, [data, appliedFilters]);

  const columns: ColumnDef<DispensasiItem>[] = [
    {
      key: 'nama_mahasiswa',
      label: 'MAHASISWA',
      render: (row) => (
        <div>
          <div className="flex items-center gap-1.5">
            <p className="font-bold text-slate-900 text-sm">{row.nama_mahasiswa || `Mahasiswa #${row.mahasiswa_id}`}</p>
            {row.has_unpaid_previous_dispensation && (
              <span title="Memiliki riwayat tunggakan dispensasi" className="text-amber-500">
                <ShieldAlert size={15} />
              </span>
            )}
          </div>
          <p className="font-mono text-xs text-slate-500">NIM: {row.nim || '-'}</p>
        </div>
      ),
    },
    {
      key: 'tipe_dispensasi',
      label: 'TIPE DISPENSASI',
      render: (row) => {
        const label = TIPE_DISPENSASI_OPTIONS.find((t) => t.value === row.tipe_dispensasi)?.label || row.tipe_dispensasi;
        return <span className="badge badge-purple text-xs font-semibold">{label}</span>;
      },
    },
    {
      key: 'jatuh_tempo_baru',
      label: 'JATUH TEMPO BARU',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-1 rounded-md">
          {row.jatuh_tempo_baru || '-'}
        </span>
      ),
    },
    {
      key: 'nominal_per_cicilan',
      label: 'NOMINAL CICILAN / DISPENSASI',
      render: (row) => (
        <span className="font-bold text-slate-900 tabular-nums text-sm">
          {formatRupiah(row.nominal_per_cicilan || 0)}
        </span>
      ),
    },
    {
      key: 'allow_krs',
      label: 'BYPASS KRS SIAKAD',
      render: (row) => (
        row.allow_krs ? (
          <span className="badge badge-green text-2xs font-bold inline-flex items-center gap-1">
            <CheckCircle2 size={11} /> Diizinkan
          </span>
        ) : (
          <span className="badge badge-slate text-2xs font-semibold inline-flex items-center gap-1">
            <XCircle size={11} /> Terkunci
          </span>
        )
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (row) => {
        if (row.status === 'approved') {
          return (
            <span className="badge badge-green text-xs font-bold inline-flex items-center gap-1">
              <CheckCircle2 size={12} /> Disetujui
            </span>
          );
        }
        if (row.status === 'rejected') {
          return (
            <span className="badge badge-red text-xs font-bold inline-flex items-center gap-1">
              <XCircle size={12} /> Ditolak
            </span>
          );
        }
        return (
          <span className="badge badge-blue text-xs font-bold inline-flex items-center gap-1">
            <Clock size={12} /> Menunggu Persetujuan
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: 'AKSI',
      render: (row) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleOpenDetail(row)}
          icon={<Eye size={13} />}
          className="text-xs font-bold"
        >
          Lihat & Cetak
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-16">
      <PageHeader
        title="Dispensasi & Keringanan Pembayaran Tagihan"
        description="Kelola permohonan cicilan, penundaan tanggal jatuh tempo, dan validasi riwayat tunggakan mahasiswa."
        action={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setShowFilter(true)}
              className="font-bold min-h-[40px]"
            >
              Filter
            </Button>
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={handleOpenAdd}
              className="font-bold min-h-[40px] px-4 shadow-sm"
            >
              Pengajuan Dispensasi Baru
            </Button>
          </div>
        }
      />

      <DataTable
        data={filteredData}
        isLoading={loading}
        columns={columns}
        emptyMessage="Belum ada permohonan dispensasi tagihan."
      />

      {/* Modal Pengajuan Baru */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Pengajuan Dispensasi Tagihan Baru">
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-5">
          {/* Autocomplete Student Search */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Cari Mahasiswa (NIM atau Nama) *
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                placeholder="Ketik minimal 2 karakter (NIM atau Nama Mahasiswa)..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
              />
            </div>

            {/* Search Dropdown Results */}
            {studentResults.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl shadow-lg max-h-52 overflow-y-auto divide-y z-50">
                {studentResults.map((stu) => (
                  <button
                    key={stu.id}
                    type="button"
                    onClick={() => handleSelectStudent(stu)}
                    className="w-full text-left p-3 hover:bg-primary-50/80 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-slate-900 text-xs">{stu.nama_mahasiswa}</p>
                      <p className="text-[11px] font-mono text-slate-500">
                        NIM: {stu.nim} • Angkatan: {stu.tahun_angkatan} ({stu.jalur_kelas})
                      </p>
                    </div>
                    <Badge variant="purple" className="text-2xs">
                      UKT Level {stu.kelompok_ukt}
                    </Badge>
                  </button>
                ))}
              </div>
            )}

            {/* Selected Student Card */}
            {selectedStudent && (
              <div className="p-3.5 bg-primary-50/70 border border-primary-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-xs">
                    <User size={16} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-xs">{selectedStudent.nama_mahasiswa}</p>
                    <p className="text-2xs text-slate-600 font-mono">
                      NIM: {selectedStudent.nim} • Jalur: {selectedStudent.jalur_kelas} (Angkatan {selectedStudent.tahun_angkatan})
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedStudent(null)}
                  className="text-2xs text-slate-500 hover:text-rose-600 font-bold"
                >
                  Ganti
                </Button>
              </div>
            )}

            {/* Previous Arrears Warning Alert Box */}
            {studentWarning && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block">Peringatan Tunggakan Sebelumnya</span>
                  <span className="text-amber-800 leading-relaxed">{studentWarning}</span>
                </div>
              </div>
            )}
          </div>

          <Select
            label="Tipe Dispensasi *"
            options={TIPE_DISPENSASI_OPTIONS}
            value={watch('tipe_dispensasi')}
            onChange={(val) => setValue('tipe_dispensasi', val as string)}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="date"
              label="Batas Tanggal Jatuh Tempo Baru *"
              {...register('jatuh_tempo_baru', { required: 'Tanggal jatuh tempo baru wajib diisi' })}
              error={errors.jatuh_tempo_baru?.message}
            />

            <Input
              type="number"
              label="Nominal Per Cicilan (Rp) *"
              placeholder="1500000"
              {...register('nominal_per_cicilan', { required: 'Nominal wajib diisi', valueAsNumber: true })}
              error={errors.nominal_per_cicilan?.message}
            />
          </div>

          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start gap-3">
            <input
              type="checkbox"
              id="allow_krs"
              {...register('allow_krs')}
              className="mt-0.5 h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="allow_krs" className="text-xs text-slate-800 cursor-pointer space-y-0.5">
              <span className="font-bold text-emerald-950 block">Izinkan Pengisian KRS di SIAKAD (Bypass Lock Keuangan)</span>
              <span className="text-emerald-800 text-[11px] leading-relaxed block">
                Jika dicentang, mahasiswa dapat mengisi KRS di SIAKAD meskipun masih memiliki sisa tunggakan selama periode dispensasi berlaku.
              </span>
            </label>
          </div>

          <Textarea
            label="Alasan Permohonan Dispensasi *"
            placeholder="Jelaskan kendala finansial / pertimbangan permohonan dispensasi mahasiswa..."
            {...register('alasan', { required: 'Alasan wajib diisi' })}
            error={errors.alasan?.message}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
              className="font-bold text-slate-600"
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              icon={submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              className="font-bold shadow-md"
            >
              {submitting ? 'Mengirim...' : 'Kirim Pengajuan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Detail & Cetak Bukti Resmi */}
      {detailItem && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title="Surat Bukti Dispensasi Tagihan Resmi"
        >
          <div className="space-y-6">
            {/* Printable Document Container */}
            <div className="printable-document print-document p-8 border border-slate-300 rounded-2xl bg-white space-y-5 text-slate-900 leading-relaxed shadow-2xs print:border-none print:shadow-none print:p-0">
              {/* Kop Resmi Surat Kampus */}
              <div className="border-b-4 border-double border-slate-900 pb-3 flex justify-between items-start">
                <div className="space-y-0.5">
                  <h3 className="font-extrabold text-base tracking-wider uppercase text-slate-900">
                    UNIVERSITAS SSO CAMPUS
                  </h3>
                  <h4 className="font-bold text-xs text-slate-700 uppercase">
                    WAKIL REKTOR II BIDANG KEUANGAN & SUMBER DAYA
                  </h4>
                  <p className="text-[10px] text-slate-600">
                    Gedung Rektorat Lt. 2 • Jl. Kampus Terpadu No. 1 • Telp: (021) 789-0123 • Email: keu@campus.ac.id
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-mono font-extrabold text-indigo-950 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded">
                    SURAT KETERANGAN RESMI
                  </div>
                  <div className="text-[10px] font-mono text-slate-600 mt-1">
                    No: {detailItem.id}/UN-SSO/WR2-KEU/DISP/{new Date().getFullYear()}
                  </div>
                </div>
              </div>

              {/* Judul Surat */}
              <div className="text-center space-y-1 py-1">
                <h4 className="font-extrabold text-sm tracking-wide uppercase text-slate-900 underline underline-offset-4">
                  SURAT KETERANGAN DISPENSASI PEMBAYARAN KULIAH
                </h4>
                <p className="text-2xs text-slate-500 font-mono">
                  Tentang Penangguhan & Penyesuaian Kewajiban Keuangan Mahasiswa
                </p>
              </div>

              {/* Paragraf Pembuka */}
              <p className="text-xs text-slate-700 leading-relaxed">
                Yang bertanda tangan di bawah ini, Wakil Rektor II / Bagian Keuangan Universitas SSO Campus, menerangkan bahwa mahasiswa:
              </p>

              {/* Data Mahasiswa */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs grid grid-cols-2 gap-y-2 gap-x-4">
                <div>
                  <span className="text-slate-500 text-2xs block uppercase font-bold">Nama Lengkap Mahasiswa:</span>
                  <span className="font-bold text-slate-900">{detailItem.nama_mahasiswa}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-2xs block uppercase font-bold">Nomor Induk Mahasiswa (NIM):</span>
                  <span className="font-mono font-bold text-slate-900">{detailItem.nim}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-2xs block uppercase font-bold">Program Studi:</span>
                  <span className="font-semibold text-slate-800">Teknik Informatika (S1 Reguler)</span>
                </div>
                <div>
                  <span className="text-slate-500 text-2xs block uppercase font-bold">Nomor Tagihan Terkait:</span>
                  <span className="font-mono font-bold text-slate-900">{detailItem.tagihan?.nomor_tagihan || `INV-SIAKAD-${detailItem.id}`}</span>
                </div>
              </div>

              {/* Ketentuan Dispensasi */}
              <div className="space-y-2 text-xs">
                <span className="font-bold text-slate-900 text-xs block">Ketentuan & Skema Dispensasi yang Disetujui:</span>
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200 text-xs">
                  <div className="flex justify-between p-2.5 bg-slate-50/50">
                    <span className="text-slate-600">Tipe / Bentuk Keringanan:</span>
                    <strong className="text-slate-900">{TIPE_DISPENSASI_OPTIONS.find(t => t.value === detailItem.tipe_dispensasi)?.label || detailItem.tipe_dispensasi}</strong>
                  </div>
                  <div className="flex justify-between p-2.5">
                    <span className="text-slate-600">Batas Akhir Pelunasan (Jatuh Tempo Baru):</span>
                    <strong className="font-mono text-rose-700 font-bold">{detailItem.jatuh_tempo_baru}</strong>
                  </div>
                  <div className="flex justify-between p-2.5 bg-slate-50/50">
                    <span className="text-slate-600">Nominal Cicilan / Tangguhan Disetujui:</span>
                    <strong className="font-mono text-emerald-800 font-extrabold">{formatRupiah(detailItem.nominal_per_cicilan)}</strong>
                  </div>
                  <div className="flex justify-between p-2.5">
                    <span className="text-slate-600">Status Akses KRS SIAKAD:</span>
                    <strong className={detailItem.allow_krs ? 'text-emerald-700 font-extrabold' : 'text-slate-600'}>
                      {detailItem.allow_krs ? '✅ DIIZINKAN (BYPASS LOCK SIAKAD AKTIF)' : '❌ TERKUNCI SAMPAI LUNAS'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Klausul Keputusan */}
              <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-950 space-y-1">
                <span className="font-bold block">Klausul Akses Akademik (SIAKAD):</span>
                <p className="text-[11px] leading-relaxed text-emerald-900">
                  {detailItem.allow_krs
                    ? 'Berdasarkan surat keputusan ini, sistem SIAKAD secara otomatis membuka kunci pengisian KRS bagi mahasiswa yang bersangkutan hingga batas jatuh tempo yang telah ditetapkan.'
                    : 'Mahasiswa wajib menyelesaikan kewajiban pembayaran cicilan sebelum sistem SIAKAD membuka akses pengisian KRS.'}
                </p>
              </div>

              {/* Alasan */}
              <div className="space-y-1 text-xs">
                <span className="font-bold text-slate-700 uppercase text-2xs">Alasan Permohonan:</span>
                <p className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 leading-relaxed italic text-[11px]">
                  &ldquo;{detailItem.alasan || 'Permohonan penyesuaian jatuh tempo perkuliahan.'}&rdquo;
                </p>
              </div>

              {/* Digital Signature & Footer */}
              <div className="pt-4 border-t-2 border-slate-200 flex justify-between items-end text-xs">
                <div className="space-y-1 text-2xs text-slate-500 font-mono">
                  <p>Dokumen ini sah dan diterbitkan secara elektronik oleh SIKEU.</p>
                  <p>VALIDITY HASH: #{detailItem.id}-VERIFIED-WR2</p>
                  <p>Dicetak pada: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <div className="text-right space-y-1 shrink-0">
                  <p className="text-2xs text-slate-500">Jakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <p className="font-bold text-slate-900 text-xs">Wakil Rektor II / Bagian Keuangan</p>
                  <div className="h-12 flex items-center justify-end">
                    <span className="font-mono text-2xs text-emerald-800 font-bold border border-emerald-300 bg-emerald-50 px-2.5 py-1 rounded shadow-2xs">
                      [DIGITALLY SIGNED & VERIFIED]
                    </span>
                  </div>
                  <p className="font-bold text-slate-800 text-2xs underline">Dr. Hendra Gunawan, S.E., M.Ak.</p>
                  <p className="text-2xs text-slate-500 font-mono">NIP: 197805122005011002</p>
                </div>
              </div>
            </div>

            {/* Action Buttons in Modal Footer */}
            <div className="flex items-center justify-end gap-3 pt-2 print:hidden">
              <Button
                variant="outline"
                icon={<Printer size={15} />}
                onClick={() => window.print()}
                className="font-bold"
              >
                Cetak Bukti Dispensasi (PDF)
              </Button>
              <Button
                variant="ghost"
                onClick={() => setIsDetailOpen(false)}
                className="font-bold text-slate-600"
              >
                Tutup
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Filter Drawer */}
      <Drawer
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Dispensasi"
        width="420px"
        footer={
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleResetFilter}
              className="font-bold text-slate-600 min-h-[42px] px-4"
            >
              Reset
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleApplyFilter}
              className="font-bold min-h-[42px] px-5 shadow-md"
            >
              Terapkan Filter
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <Input
            label="Cari Nama / NIM / Alasan / Tagihan"
            placeholder="Ketik kata kunci pencarian..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />

          <Select
            label="Status Persetujuan"
            value={filterStatus}
            onChange={(val) => setFilterStatus(val as string)}
            options={[
              { value: 'all', label: 'Semua Status' },
              { value: 'pending', label: 'Menunggu Persetujuan' },
              { value: 'approved', label: 'Disetujui' },
              { value: 'rejected', label: 'Ditolak' },
            ]}
          />
        </div>
      </Drawer>
    </div>
  );
}
