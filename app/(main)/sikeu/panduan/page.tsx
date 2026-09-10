'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  BookOpen,
  HelpCircle,
  CreditCard,
  Settings,
  ShieldCheck,
  FileText,
  DollarSign,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  Tag,
  KeyRound,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

interface GuideSection {
  id: string;
  title: string;
  category: 'tagihan' | 'setting' | 'pembayaran' | 'dispensasi' | 'akuntansi' | 'akun';
  categoryLabel: string;
  summary: string;
  targetUrl?: string;
  targetLabel?: string;
  rolesAllowed: string[];
  steps: string[];
  tips?: string[];
  warnings?: string[];
  faqs?: { q: string; a: string }[];
}

const GUIDES: GuideSection[] = [
  {
    id: 'generate-tagihan-masal',
    title: 'Cara Menerbitkan / Mengaktifkan Tagihan Semester Masal',
    category: 'tagihan',
    categoryLabel: 'Tagihan & Invoice',
    summary:
      'Panduan menerbitkan invoice tagihan semester secara otomatis dan sekaligus untuk seluruh mahasiswa aktif berdasarkan Tahun Angkatan dan Jalur Kelas.',
    targetUrl: '/sikeu/tagihan',
    targetLabel: 'Buka Halaman Tagihan SPP',
    rolesAllowed: ['operator_sikeu', 'kabag_keuangan'],
    steps: [
      'Pastikan Anda sudah mengonfigurasi Setting Tarif untuk Tahun Angkatan dan Jalur Kelas target di menu Master Keuangan.',
      'Pastikan data Tipe Tagihan Mahasiswa (UKT / Jalur) sudah ditetapkan pada tab "Tipe Tagihan Mhs".',
      'Buka menu "OPERASIONAL PENERIMAAN" → "Tagihan SPP & UKT" (/sikeu/tagihan).',
      'Klik tombol "Aktifkan Tagihan Masal" (ikon Sparkles ✨) di pojok kanan atas.',
      'Pilih Tahun Angkatan (misal: 2025), Jalur Kelas (Reguler/Karyawan), Semester Aktif (contoh: Semester Ganjil 2026/2027), dan Batas Tanggal Jatuh Tempo.',
      'Klik "Terbitkan Tagihan Masal". Sistem akan otomatis mengalkulasi komponen biaya dan menerbitkan tagihan mahasiswa tanpa duplikasi.',
    ],
    tips: [
      'Jika mahasiswa sudah memiliki nomor tagihan yang sama, sistem otomatis melewatinya (aman dari tagihan ganda).',
      'Besaran tagihan otomatis mengambil gabungan komponen biaya dari Setting Tarif yang berstatus aktif.',
    ],
    warnings: [
      'Jika belum ada Setting Tarif yang cocok dengan angkatan dan jalur yang dipilih, proses akan dibatalkan dengan pesan peringatan.',
    ],
    faqs: [
      {
        q: 'Apakah mahasiswa langsung bisa melihat tagihannya?',
        a: 'Ya, mahasiswa dapat langsung login dan melihat tagihannya di menu "Tagihan SPP (SIKEU)" atau mencetak invoice resminya.',
      },
      {
        q: 'Bagaimana jika ada mahasiswa beasiswa 100%?',
        a: 'Jika mahasiswa terdaftar pada mapping beasiswa, nilai tagihan bersih akan otomatis terpotong sesuai persentase atau nominal beasiswanya.',
      },
    ],
  },
  {
    id: 'setting-tarif-angkatan',
    title: 'Cara Setting Tarif Biaya per Angkatan, Prodi, & Semester',
    category: 'setting',
    categoryLabel: 'Master & Konfigurasi',
    summary:
      'Panduan mengatur nominal standar biaya kuliah berdasarkan kombinasi Tahun Angkatan, Program Studi, Semester (1-8), dan Jalur Kelas.',
    targetUrl: '/sikeu/master',
    targetLabel: 'Buka Master Biaya & Tarif',
    rolesAllowed: ['operator_sikeu', 'kabag_keuangan'],
    steps: [
      'Buka menu "MASTER KEUANGAN" → "Master Biaya & Tarif" (/sikeu/master).',
      'Pilih tab navigasi "Setting Tarif (Semester/Angkatan)".',
      'Klik tombol "+ Tambah Setting Tarif".',
      'Pilih Komponen Master Biaya (contoh: UKT Reguler atau Biaya Praktikum).',
      'Tentukan Tahun Angkatan (misal 2025), Jalur Kelas (Reguler), dan Semester target (1-8, atau biarkan kosong jika berlaku di semua semester).',
      'Masukkan Nominal Biaya dalam Rupiah (contoh: Rp 3.500.000).',
      'Tambahkan keterangan operasional jika diperlukan, pastikan centang "Status Tarif Aktif", lalu klik "Simpan".',
    ],
    tips: [
      'Gunakan fitur Filter di pojok kanan untuk mengecek tarif per angkatan atau jalur sebelum memulai semester baru.',
      'Sistem memiliki proteksi unique constraint agar tidak terjadi pengaturan ganda untuk kombinasi angkatan & jenis biaya yang sama.',
    ],
    faqs: [
      {
        q: 'Apa bedanya Setting Tarif dengan Jenis Biaya?',
        a: 'Jenis Biaya mendefinisikan nama komponen (misal: "UKT Reguler", "Praktikum"). Sedangkan Setting Tarif mendefinisikan nominal riil untuk angkatan, jalur, dan semester tertentu.',
      },
    ],
  },
  {
    id: 'pembayaran-kasir-loket',
    title: 'Cara Memproses Pembayaran di Kasir / Loket Kampus',
    category: 'pembayaran',
    categoryLabel: 'Pembayaran & Kasir',
    summary:
      'Prosedur penerimaan pembayaran mahasiswa langsung di loket (tunai) atau penerbitan Virtual Account (transfer bank) beserta cetak bukti transaksi.',
    targetUrl: '/sikeu/tagihan/create',
    targetLabel: 'Buka Form Loket Kasir',
    rolesAllowed: ['operator_sikeu', 'kabag_keuangan'],
    steps: [
      'Buka menu "Tagihan SPP & UKT" lalu klik tombol "Bayar Loket / Terbitkan VA" atau akses langsung ke /sikeu/tagihan/create.',
      'Langkah 1: Cari mahasiswa dengan mengetikkan NIM atau Nama pada kolom pencarian autocomplete.',
      'Langkah 2: Pilih komponen tagihan yang akan dilunasi dengan mencentang kotak ceklis di daftar tagihan aktif.',
      'Langkah 3: Pilih Metode Pembayaran: "Bayar Tunai Loket Kasir" untuk pembayaran tunai di kasir, atau "Virtual Account BNI" untuk pembayaran via transfer.',
      'Masukkan catatan transaksi jika ada, lalu klik "Proses Pembayaran Loket".',
      'Sistem akan mencatat pelunasan, membuat kuitansi, dan meng-generate jurnal akuntansi secara otomatis.',
    ],
    tips: [
      'Jumlah pembayaran tunai otomatis memvalidasi bahwa uang yang disetorkan tidak boleh melebihi sisa kewajiban mahasiswa.',
      'Kuitansi resmi dapat langsung dicetak dari tampilan modal berhasil.',
    ],
    warnings: [
      'Transaksi kasir akan otomatis DITOLAK oleh sistem jika tanggal transaksi jatuh pada periode akuntansi yang sudah berstatus Ditutup (Tutup Buku).',
    ],
    faqs: [
      {
        q: 'Bagaimana jika kasir salah menginputkan nominal uang?',
        a: 'Gunakan fitur Koreksi Transaksi di halaman Riwayat Pembayaran (/sikeu/pembayaran). Sistem akan membuat jurnal pembalik (reversal) dan mengembalikan saldo tagihan.',
      },
    ],
  },
  {
    id: 'koreksi-pembayaran',
    title: 'Cara Mengoreksi / Membatalkan Transaksi Pembayaran Salah Input',
    category: 'pembayaran',
    categoryLabel: 'Pembayaran & Kasir',
    summary:
      'Mekanisme pembatalan pembayaran yang salah menggunakan jurnal pembalik (reversal entry) sesuai standar akuntansi perbankan kampus.',
    targetUrl: '/sikeu/pembayaran',
    targetLabel: 'Buka Riwayat Pembayaran',
    rolesAllowed: ['kabag_keuangan'],
    steps: [
      'Buka menu "OPERASIONAL PENERIMAAN" → "Pembayaran SPP" (/sikeu/pembayaran).',
      'Cari kode transaksi atau NIM mahasiswa yang pembayarannya ingin dikoreksi.',
      'Klik tombol "Koreksi" pada baris transaksi tersebut.',
      'Ketikkan alasan koreksi pembatalan secara jelas (minimal 10 karakter).',
      'Konfirmasi koreksi. Sistem akan mengubah status pembayaran menjadi "reversed", membuat Jurnal Pembalik, dan menormalkan kembali sisa tagihan mahasiswa.',
    ],
    warnings: [
      'Transaksi yang sudah pernah dibatalkan (reversed) tidak dapat dibatalkan kembali.',
      'Hanya Kepala Bagian Keuangan (kabag_keuangan) atau Superadmin yang memiliki izin mengoreksi transaksi.',
    ],
  },
  {
    id: 'pengajuan-dispensasi',
    title: 'Cara Mengajukan & Memproses Dispensasi Tagihan Mahasiswa',
    category: 'dispensasi',
    categoryLabel: 'Dispensasi & Keringanan',
    summary:
      'Prosedur pemberian penundaan jatuh tempo atau cicilan bagi mahasiswa yang terkendala biaya agar tetap dapat mengikuti perkuliahan / KRS.',
    targetUrl: '/sikeu/dispensasi',
    targetLabel: 'Buka Menu Dispensasi',
    rolesAllowed: ['operator_sikeu', 'kabag_keuangan'],
    steps: [
      'Buka menu "OPERASIONAL PENGELUARAN" → "Dispensasi Pembayaran" (/sikeu/dispensasi).',
      'Klik tombol "Ajukan Dispensasi Baru".',
      'Cari mahasiswa berdasarkan NIM atau Nama.',
      'Sistem akan otomatis memeriksa apakah mahasiswa bersangkutan masih memiliki tunggakan dispensasi dari semester sebelumnya.',
      'Pilih tagihan yang diajukan, tentukan tanggal Jatuh Tempo Baru, jenis keringanan/cicilan, dan unggah surat permohonan pendukung.',
      'Klik "Kirim Permohonan". Status dispensasi akan masuk ke antrean persetujuan Pimpinan.',
    ],
    tips: [
      'Setelah disetujui oleh Pimpinan di halaman /sikeu/approval, bukti dispensasi dapat dicetak untuk keperluan registrasi akademik.',
    ],
  },
  {
    id: 'tutup-buku-akuntansi',
    title: 'Cara Melakukan Tutup Buku Periode Akuntansi',
    category: 'akuntansi',
    categoryLabel: 'Akuntansi & Pembukuan',
    summary:
      'Langkah mengunci periode transaksi keuangan agar tidak dapat diubah, ditambah, atau dikoreksi kembali demi validitas laporan.',
    targetUrl: '/sikeu/akuntansi/jurnal',
    targetLabel: 'Buka Menu Akuntansi',
    rolesAllowed: ['kabag_keuangan'],
    steps: [
      'Pastikan seluruh kas masuk, pengeluaran kas unit, dan penerimaan SPP bulan berjalan telah direkonsiliasi seimbang (Balanced Journal).',
      'Buka menu "AKUNTANSI & LAPORAN" → "Chart of Accounts (COA)" atau Periode Akuntansi.',
      'Pilih periode yang ingin ditutup (misal: Periode Agustus 2026).',
      'Ubah status dari "Terbuka" menjadi "Ditutup".',
      'Setelah ditutup, seluruh endpoint input kasir dan koreksi transaksi pada rentang tanggal tersebut akan otomatis diblokir sistem.',
    ],
  },
  {
    id: 'daftar-akun-testing',
    title: 'Daftar Akun Pengujian & Uji Coba Role SIKEU',
    category: 'akun',
    categoryLabel: 'Akun & Hak Akses',
    summary:
      'Informasi akun login siap pakai untuk simulasi alur kasir, kabag keuangan, pimpinan pengambil keputusan, dan mahasiswa.',
    rolesAllowed: ['operator_sikeu', 'kabag_keuangan', 'pimpinan', 'mahasiswa'],
    steps: [
      'Kasir Operasional: Email kasir.sikeu@kampus.ac.id | Password: password (Role: operator_sikeu)',
      'Kabag Keuangan: Email kabag.keuangan@kampus.ac.id | Password: password (Role: kabag_keuangan)',
      'Pimpinan / WR II: Email pimpinan@kampus.ac.id | Password: password (Role: pimpinan)',
      'Mahasiswa Mandiri: Email mahasiswa.test@kampus.ac.id | Password: password (Role: mahasiswa)',
    ],
    tips: [
      'Gunakan mode Penyamaran (Incognito) atau browser berbeda saat menguji perpindahan peran antara Operator dan Pimpinan.',
    ],
  },
];

const CATEGORIES = [
  { id: 'all', label: 'Semua Panduan', icon: BookOpen },
  { id: 'tagihan', label: 'Tagihan & Invoice', icon: FileText },
  { id: 'setting', label: 'Setting & Tarif', icon: Settings },
  { id: 'pembayaran', label: 'Pembayaran & Kasir', icon: CreditCard },
  { id: 'dispensasi', label: 'Dispensasi', icon: ShieldCheck },
  { id: 'akuntansi', label: 'Akuntansi & Tutup Buku', icon: DollarSign },
  { id: 'akun', label: 'Akun Pengujian', icon: KeyRound },
];

export default function PanduanSikeuPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>('generate-tagihan-masal');

  const filteredGuides = useMemo(() => {
    return GUIDES.filter((guide) => {
      // Filter kategori
      if (selectedCategory !== 'all' && guide.category !== selectedCategory) {
        return false;
      }
      // Filter pencarian
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = guide.title.toLowerCase().includes(q);
        const inSummary = guide.summary.toLowerCase().includes(q);
        const inSteps = guide.steps.some((s) => s.toLowerCase().includes(q));
        const inFaqs = guide.faqs?.some(
          (f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q)
        );
        return inTitle || inSummary || inSteps || inFaqs;
      }
      return true;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-12">
      <PageHeader
        title="Pusat Panduan & Alur Sistem SIKEU"
        description="Dokumentasi interaktif alur penerbitan tagihan, setting tarif, pembayaran kasir loket, dan prosedur operasional keuangan kampus."
      />

      {/* Hero Search Box */}
      <div className="bg-gradient-to-r from-blue-700 via-primary-700 to-indigo-800 rounded-2xl p-6 md:p-8 text-white shadow-xl">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-sm mb-3">
            <Sparkles size={14} className="text-yellow-300" /> Knowledge Base & Alur SIKEU
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2 text-white !text-white" style={{ color: '#ffffff' }}>
            Butuh bantuan alur operasional keuangan?
          </h2>
          <p className="text-blue-100 text-sm mb-5 leading-relaxed">
            Ketik kata kunci pertanyaan Anda, seperti: <em className="text-white font-semibold">&ldquo;cara membuat tagihan&rdquo;</em>, <em className="text-white font-semibold">&ldquo;setting tarif&rdquo;</em>, <em className="text-white font-semibold">&ldquo;koreksi pembayaran&rdquo;</em>, atau <em className="text-white font-semibold">&ldquo;tutup buku&rdquo;</em>.
          </p>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari alur kerja, panduan, atau FAQ keuangan..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-white/50 shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 bg-slate-100 px-2 py-1 rounded-md font-semibold"
              >
                Hapus
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon size={14} />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Menampilkan <strong>{filteredGuides.length}</strong> topik panduan
          {selectedCategory !== 'all' ? ` pada kategori ${CATEGORIES.find((c) => c.id === selectedCategory)?.label}` : ''}
          {searchQuery ? ` untuk pencarian "${searchQuery}"` : ''}
        </span>
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="text-primary-600 hover:underline font-semibold"
          >
            Reset Pencarian
          </button>
        )}
      </div>

      {/* Guide Cards Accordion */}
      {filteredGuides.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <HelpCircle className="mx-auto text-slate-300 mb-3" size={48} />
          <h3 className="font-bold text-slate-800 text-base mb-1">Topik Panduan Tidak Ditemukan</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-4">
            Tidak ada panduan yang cocok dengan kata kunci &ldquo;{searchQuery}&rdquo;. Coba gunakan kata kunci umum seperti tagihan, kasir, tarif, atau akun.
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-xs font-bold hover:bg-primary-700"
          >
            Tampilkan Semua Panduan
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGuides.map((guide) => {
            const isExpanded = expandedId === guide.id;

            return (
              <div
                key={guide.id}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isExpanded
                    ? 'border-primary-300 shadow-md ring-1 ring-primary-100'
                    : 'border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
              >
                {/* Header / Click to Expand */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : guide.id)}
                  className="p-5 flex items-start justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="badge badge-blue text-2xs font-bold uppercase tracking-wider">
                        {guide.categoryLabel}
                      </span>
                      <div className="flex items-center gap-1">
                        {guide.rolesAllowed.map((r) => (
                          <span
                            key={r}
                            className="font-mono text-2xs px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-semibold"
                          >
                            @{r}
                          </span>
                        ))}
                      </div>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-primary-600">
                      {guide.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{guide.summary}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    {guide.targetUrl && (
                      <Link
                        href={guide.targetUrl}
                        onClick={(e) => e.stopPropagation()}
                        className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-primary-600 bg-primary-50 hover:bg-primary-100 transition-colors"
                      >
                        Buka Halaman <ExternalLink size={12} />
                      </Link>
                    )}
                    <button
                      type="button"
                      className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-600 transition-transform duration-200 ${
                        isExpanded ? 'rotate-90 text-primary-600' : ''
                      }`}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <div className="px-5 pb-6 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-5 text-sm">
                    {/* Steps */}
                    <div>
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        Langkah-Langkah Pelaksanaan
                      </h4>
                      <ol className="space-y-2">
                        {guide.steps.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-xs text-slate-700 leading-relaxed">
                            <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 font-bold text-2xs flex items-center justify-center flex-shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Tips & Warnings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {guide.tips && guide.tips.length > 0 && (
                        <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-3.5 space-y-1">
                          <span className="text-emerald-800 font-bold text-xs flex items-center gap-1.5">
                            <Sparkles size={14} /> Tips & Catatan Penting
                          </span>
                          <ul className="list-disc list-inside text-xs text-emerald-900 space-y-1">
                            {guide.tips.map((t, i) => (
                              <li key={i}>{t}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {guide.warnings && guide.warnings.length > 0 && (
                        <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3.5 space-y-1">
                          <span className="text-amber-800 font-bold text-xs flex items-center gap-1.5">
                            <AlertTriangle size={14} /> Perhatian Khusus
                          </span>
                          <ul className="list-disc list-inside text-xs text-amber-900 space-y-1">
                            {guide.warnings.map((w, i) => (
                              <li key={i}>{w}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* FAQs */}
                    {guide.faqs && guide.faqs.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-200/60">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <HelpCircle size={14} className="text-primary-600" />
                          Pertanyaan yang Sering Diajukan (FAQ)
                        </h4>
                        <div className="space-y-2">
                          {guide.faqs.map((faq, i) => (
                            <div key={i} className="bg-white p-3 rounded-xl border border-slate-200/80">
                              <p className="font-bold text-slate-900 text-xs mb-1 flex items-center gap-1.5">
                                <span className="text-primary-600 font-black">Q:</span> {faq.q}
                              </p>
                              <p className="text-slate-600 text-xs leading-relaxed pl-4">
                                <span className="text-emerald-600 font-bold">A:</span> {faq.a}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick Link Button in footer */}
                    {guide.targetUrl && (
                      <div className="pt-2 flex justify-end">
                        <Link
                          href={guide.targetUrl}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white font-bold text-xs hover:bg-primary-700 shadow-sm transition-all"
                        >
                          {guide.targetLabel || 'Buka Halaman Terkait'} <ArrowRight size={14} />
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
