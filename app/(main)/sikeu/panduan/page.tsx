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
import { useAuthStore } from '@/store/authStore';

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
    targetUrl: '/sikeu/pembayaran-mahasiswa/tagihan',
    targetLabel: 'Buka Halaman Tagihan SPP',
    rolesAllowed: ['operator_sikeu', 'kabag_keuangan', 'admin_keuangan_pembayaran'],
    steps: [
      'Pastikan Anda sudah mengonfigurasi Setting Tarif untuk Tahun Angkatan dan Jalur Kelas target di menu Master Keuangan.',
      'Pastikan data Tipe Tagihan Mahasiswa (UKT / Jalur) sudah ditetapkan pada tab "Tipe Tagihan Mhs".',
      'Buka menu "PEMBAYARAN MAHASISWA" → "Input Tagihan" (/sikeu/pembayaran-mahasiswa/tagihan).',
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
    rolesAllowed: ['operator_sikeu', 'kabag_keuangan', 'admin_keuangan_pembayaran'],
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
    targetUrl: '/sikeu/pembayaran-mahasiswa/bayar',
    targetLabel: 'Buka Form Loket Kasir',
    rolesAllowed: ['operator_sikeu', 'kabag_keuangan', 'admin_keuangan_pembayaran'],
    steps: [
      'Buka menu "PEMBAYARAN MAHASISWA" → "Bayar Kasir Loket" lalu pilih tagihan, atau akses langsung ke /sikeu/pembayaran-mahasiswa/bayar.',
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
        a: 'Gunakan fitur Koreksi Transaksi di halaman Riwayat Pembayaran (/sikeu/pembayaran-mahasiswa/bayar?tab=riwayat). Sistem akan membuat jurnal pembalik (reversal) dan mengembalikan saldo tagihan.',
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
    targetUrl: '/sikeu/pembayaran-mahasiswa/bayar?tab=riwayat',
    targetLabel: 'Buka Riwayat Pembayaran',
    rolesAllowed: ['kabag_keuangan'],
    steps: [
      'Buka menu "PEMBAYARAN MAHASISWA" → "Bayar Kasir Loket" tab Riwayat (/sikeu/pembayaran-mahasiswa/bayar?tab=riwayat).',
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
    rolesAllowed: ['operator_sikeu', 'kabag_keuangan', 'admin_keuangan_pembayaran'],
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
    rolesAllowed: ['kabag_keuangan', 'admin_keuangan_akuntansi'],
    steps: [
      'Pastikan seluruh kas masuk, pengeluaran kas unit, dan penerimaan SPP bulan berjalan telah direkonsiliasi seimbang (Balanced Journal).',
      'Buka menu "AKUNTANSI & LAPORAN" → "Chart of Accounts (COA)" atau Periode Akuntansi.',
      'Pilih periode yang ingin ditutup (misal: Periode Agustus 2026).',
      'Ubah status dari "Terbuka" menjadi "Ditutup".',
      'Setelah ditutup, seluruh endpoint input kasir dan koreksi transaksi pada rentang tanggal tersebut akan otomatis diblokir sistem.',
    ],
  },
  {
    id: 'operasional-akuntansi-harian',
    title: 'Operasional Akuntansi Harian (Jurnal, COA, Laporan)',
    category: 'akuntansi',
    categoryLabel: 'Akuntansi & Pembukuan',
    summary:
      'Alur kerja harian staf akuntansi: memantau Jurnal Umum, menelusur Buku Besar per akun, mengelola COA, dan menarik Laporan Keuangan.',
    targetUrl: '/sikeu/akuntansi/jurnal',
    targetLabel: 'Buka Jurnal Umum',
    rolesAllowed: ['operator_sikeu', 'kabag_keuangan', 'admin_keuangan_akuntansi'],
    steps: [
      'Buka menu "AKUNTANSI & LAPORAN" → "Jurnal Umum"; filter periode dan pastikan status jurnal Balanced/Posted sebelum tutup hari.',
      'Telusur mutasi per akun lewat "Buku Besar" (mis. kas 101/102, piutang, pendapatan) untuk rekonsiliasi dengan mutasi bank.',
      'Kelola daftar akun di "Chart of Accounts (COA)"; pemetaan kas unit (101/102) menentukan jurnal otomatis pembayaran.',
      'Tarik "Laporan Keuangan" per periode untuk bahan evaluasi; periode yang sudah ditutup tidak dapat dikoreksi.',
      'Pantau saldo per kanal (Xendit, H2H BSN, multi bank) di Dashboard sebagai pembanding kas.',
    ],
    tips: [
      'Jurnal dari pembayaran mahasiswa, pencairan operasional, dan penggajian terbit otomatis — tugas utama adalah verifikasi, bukan input manual.',
    ],
  },
  {
    id: 'pantauan-eksekutif-pimpinan',
    title: 'Pantauan Eksekutif untuk Pimpinan (Approval & Laporan)',
    category: 'akuntansi',
    categoryLabel: 'Akuntansi & Pembukuan',
    summary:
      'Yang perlu dipantau pimpinan: saldo kas per kanal di Dashboard, antrean approval 3 tahap, laporan keuangan, piutang, dan dispensasi.',
    targetUrl: '/sikeu',
    targetLabel: 'Buka Dashboard',
    rolesAllowed: ['pimpinan'],
    steps: [
      'Buka Dashboard Keuangan: pantau Total Saldo per Kanal (Xendit, H2H BSN, multi bank) serta piutang mahasiswa.',
      'Selesaikan antrean approval bertahap di menu Approval (sarpras → keuangan → direktur) agar pencairan tidak tertahan.',
      'Periksa Laporan Keuangan per periode sebelum menandatangani keputusan anggaran.',
      'Pantau tunggakan di Piutang Mahasiswa dan pengajuan Dispensasi yang membutuhkan persetujuan.',
    ],
    tips: [
      'Akses pimpinan bersifat pantau + setujui; operasional harian (input, koreksi, tutup buku) tetap di staf keuangan.',
    ],
  },
  {
    id: 'daftar-akun-testing',
    title: 'Daftar Akun Pengujian & Uji Coba Role SIKEU',
    category: 'akun',
    categoryLabel: 'Akun & Hak Akses',
    summary:
      'Kredensial akun tidak disimpan di aplikasi (hardcode). Akun penguji disediakan oleh seeder database sesuai role, kelola dan ganti passwordnya lewat modul IAM.',
    rolesAllowed: ['operator_sikeu', 'kabag_keuangan', 'pimpinan'],
    steps: [
      'Kasir Operasional: akun dengan role operator_sikeu (buat via seeder IAM/PermissionSeeder).',
      'Kabag Keuangan: akun dengan role kabag_keuangan (buat via seeder IAM/PermissionSeeder).',
      'Pimpinan / WR II: akun dengan role pimpinan (buat via seeder IAM/PermissionSeeder).',
      'Mahasiswa Mandiri: akun dengan role mahasiswa (buat via seeder IAM/PermissionSeeder).',
    ],
    tips: [
      'Gunakan mode Penyamaran (Incognito) atau browser berbeda saat menguji perpindahan peran antara Operator dan Pimpinan.',
    ],
  },
  {
    id: 'tata-cara-pembayaran-mahasiswa',
    title: 'Tata Cara Pembayaran Tagihan Kuliah (Mahasiswa)',
    category: 'pembayaran',
    categoryLabel: 'Pembayaran & Kasir',
    summary:
      'Cara membayar tagihan semester: VA BSN Host-to-Host (CUSTID), VA bank via checkout, QRIS, loket kasir kampus, dan transfer manual dengan upload bukti.',
    targetUrl: '/sikeu/mahasiswa/tagihan',
    targetLabel: 'Buka Tagihan Saya',
    rolesAllowed: ['mahasiswa', 'admin_keuangan_pembayaran'],
    steps: [
      'Buka menu "Tagihan & Pembayaran SPP", centang tagihan semester yang akan dibayar (bisa sekaligus beberapa tagihan).',
      'VA BSN Host-to-Host: bila tagihan sudah diterbitkan ke BTN Syariah, masukkan CUSTID (NIM / No. Pendaftaran yang tertera) di ATM / m-banking BTN Syariah, pilih tagihan, bayar ditambah Rp1.500 biaya layanan VA. Status lunas otomatis setelah bank memproses (sinkron berkala).',
      'VA bank lain (Mandiri / BRI / BCA / Permata): klik "Bayar Sekarang" pada tagihan, pilih channel bank, bayar ke nomor VA yang muncul sebelum masa kedaluwarsa.',
      'QRIS: pilih metode QRIS pada modal pembayaran, pindai kode dengan e-wallet / m-banking apa pun, verifikasi nominal lalu bayar.',
      'Loket kasir kampus: tunjukkan NIM atau cetak Invoice ke Bagian Keuangan; petugas memproses pelunasan tunai/EDC dan mencetak kuitansi.',
      'Transfer manual (BNI / BSN): klik "Bayar Sekarang", pilih rekening BNI/BSN kampus, tekan "Minta Kode Unik" — transfer TEPAT sebesar nominal yang tertera (tagihan + kode unik 3 digit, mis. ...123), lalu unggah foto struk (JPG/PNG, maks 5MB) pada halaman yang sama dan pantau status di tab Riwayat Pembayaran.',
    ],
    tips: [
      'Unduh / cetak Kuitansi Lunas dari tab Riwayat Pembayaran. Pindai QR pada kuitansi untuk verifikasi keaslian dokumen.',
      'Status kuning berarti menunggu verifikasi keuangan, hijau berarti terbayar, merah berarti ditolak (silakan unggah ulang bukti yang lebih jelas).',
    ],
    faqs: [
      {
        q: 'Saya sudah bayar via BTN, kenapa status belum lunas?',
        a: 'Pembayaran bank ditarik ke sistem secara berkala (setiap beberapa menit). Tunggu sebentar lalu muat ulang halaman. Bila lebih dari 1x24 jam belum berubah, hubungi Bagian Keuangan dengan membawa bukti transfer.',
      },
      {
        q: 'Apakah bisa mencicil bila belum mampu bayar penuh?',
        a: 'Bisa, bila pengajuan dispensasi/cicilan Anda disetujui pimpinan. Rincian skema cicilan akan tampil langsung pada kartu tagihan semester tersebut; bayar sesuai nominal per cicilan memakai tombol pembayaran yang sama.',
      },
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
  const { user } = useAuthStore();

  // Mahasiswa murni hanya melihat panduan untuk mahasiswa;
  // staf/admin tetap melihat seluruh panduan operasional.
  const roleSlugs = useMemo(
    () =>
      (user?.roles || []).map((r: any) =>
        String(typeof r === 'string' ? r : r.slug || r.name || '').toLowerCase()
      ),
    [user]
  );
  // Akses penuh (staf keuangan inti & admin): seluruh panduan.
  // Role terbatas (mahasiswa, pimpinan, admin keuangan): hanya panduan bertanda role-nya.
  const FULL_ACCESS_ROLES = ['superadmin', 'admin', 'super-admin', 'operator_sikeu', 'kabag_keuangan'];
  const hasFullAccess = roleSlugs.some((s) => FULL_ACCESS_ROLES.includes(s));

  const visibleGuides = useMemo(
    () =>
      hasFullAccess
        ? GUIDES
        : GUIDES.filter((g) =>
            g.rolesAllowed.map((r) => r.toLowerCase()).some((r) => roleSlugs.includes(r))
          ),
    [hasFullAccess, roleSlugs]
  );

  const visibleCategories = useMemo(
    () => CATEGORIES.filter((c) => c.id === 'all' || visibleGuides.some((g) => g.category === c.id)),
    [visibleGuides]
  );

  const filteredGuides = useMemo(() => {
    return visibleGuides.filter((guide) => {
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
  }, [searchQuery, selectedCategory, visibleGuides]);

  // Buka otomatis panduan pertama yang terlihat bila bawaan tidak tampil untuk role ini
  const effectiveExpandedId = filteredGuides.some((g) => g.id === expandedId)
    ? expandedId
    : filteredGuides[0]?.id ?? null;

  return (
    <div className="w-full space-y-6 animate-fade-in pb-6">
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
        {visibleCategories.map((cat) => {
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
            const isExpanded = effectiveExpandedId === guide.id;

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
                        {hasFullAccess &&
                          guide.rolesAllowed.map((r) => (
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
