'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  School,
  FileText,
  BookOpen,
  Award,
  Globe,
  Printer,
  Search,
  ExternalLink,
  CheckCircle2,
  Calendar,
  User,
  DollarSign,
  Layers,
  Building2,
  TrendingUp,
  FlaskConical,
  FileCheck,
} from 'lucide-react';
import { Hero } from '@/components/ui/Hero';

interface ProdiDetail {
  id: string;
  nama_prodi: string;
  fakultas: string;
  kaprodi: string;
  dosen_pengusul: number;
  scopus: number;
  sinta: number;
  dikti: number;
  internal: number;
  hki_paten: number;
  total_dana: number;
  target_iku: number;
  capaian_iku: number;
}

const mockProdiMap: Record<string, ProdiDetail> = {
  IF: {
    id: 'IF',
    nama_prodi: 'S1 Teknik Informatika',
    fakultas: 'Fakultas Ilmu Komputer',
    kaprodi: 'Prof. Dr. Ir. H. Ahmad Dahlan, M.Kom',
    dosen_pengusul: 5,
    scopus: 3,
    sinta: 2,
    dikti: 3,
    internal: 2,
    hki_paten: 5,
    total_dana: 145000000,
    target_iku: 80,
    capaian_iku: 118,
  },
  SI: {
    id: 'SI',
    nama_prodi: 'S1 Sistem Informasi',
    fakultas: 'Fakultas Ilmu Komputer',
    kaprodi: 'Dr. Rina Wijaya, S.Kom., M.T.',
    dosen_pengusul: 5,
    scopus: 3,
    sinta: 2,
    dikti: 3,
    internal: 2,
    hki_paten: 5,
    total_dana: 110000000,
    target_iku: 75,
    capaian_iku: 105,
  },
  DKV: {
    id: 'DKV',
    nama_prodi: 'S1 Desain Komunikasi Visual',
    fakultas: 'Fakultas Desain & Seni',
    kaprodi: 'Bambang Sudarsono, M.Sn.',
    dosen_pengusul: 5,
    scopus: 2,
    sinta: 3,
    dikti: 2,
    internal: 3,
    hki_paten: 5,
    total_dana: 65000000,
    target_iku: 70,
    capaian_iku: 92,
  },
  TE: {
    id: 'TE',
    nama_prodi: 'S1 Teknik Elektro',
    fakultas: 'Fakultas Teknik',
    kaprodi: 'Ir. Hendra Gunawan, M.T., Ph.D.',
    dosen_pengusul: 5,
    scopus: 3,
    sinta: 2,
    dikti: 3,
    internal: 2,
    hki_paten: 5,
    total_dana: 80000000,
    target_iku: 75,
    capaian_iku: 88,
  },
  MI: {
    id: 'MI',
    nama_prodi: 'S1 Manajemen Informatika',
    fakultas: 'Fakultas Ilmu Komputer',
    kaprodi: 'Nurhasanah, S.Kom., M.Kom.',
    dosen_pengusul: 5,
    scopus: 2,
    sinta: 3,
    dikti: 2,
    internal: 3,
    hki_paten: 5,
    total_dana: 40000000,
    target_iku: 70,
    capaian_iku: 68,
  },
  D3SI: {
    id: 'D3SI',
    nama_prodi: 'D3 Sistem Informasi',
    fakultas: 'Fakultas Ilmu Komputer',
    kaprodi: 'Fajar Nugraha, M.Kom.',
    dosen_pengusul: 5,
    scopus: 2,
    sinta: 3,
    dikti: 2,
    internal: 3,
    hki_paten: 5,
    total_dana: 30000000,
    target_iku: 65,
    capaian_iku: 72,
  },
};

export default function LaporanProdiDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const prodiId = resolvedParams.id || 'IF';
  const prodi = mockProdiMap[prodiId] || mockProdiMap['IF'];

  const [activeTab, setActiveTab] = useState<'publikasi' | 'hibah' | 'hki'>('publikasi');
  const [searchTerm, setSearchTerm] = useState('');

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  // Mock Publikasi Data
  const publikasiList = [
    {
      id: 1,
      dosen: 'Prof. Dr. Ir. H. Ahmad Dahlan, M.Kom',
      nidn: '0412058201',
      judul: 'Deep Learning Architecture for Automated Medical Image Segmentation in Oncology',
      jurnal: 'IEEE Access (Scopus Q1, Impact Factor: 3.9)',
      tanggal: '15 Jan 2026',
      kategori: 'Scopus Q1',
      link: 'https://doi.org/10.1109/ACCESS.2026.3129841',
    },
    {
      id: 2,
      dosen: 'Dr. Siti Nurhaliza, S.T., M.T.',
      nidn: '0418098502',
      judul: 'IoT-based Precision Agriculture Monitoring System with Solar-Powered Sensor Node in Tropical Climate',
      jurnal: 'Journal of King Saud University - Computer and Information Sciences (Scopus Q2)',
      tanggal: '02 Feb 2026',
      kategori: 'Scopus Q2',
      link: 'https://doi.org/10.1016/j.jksuci.2026.02.011',
    },
    {
      id: 3,
      dosen: 'Budi Santoso, M.Kom',
      nidn: '0422119003',
      judul: 'Optimasi Algoritma Genetic Algorithm pada Penjadwalan Perkuliahan dan Ruang Laboratorium Komputer',
      jurnal: 'Jurnal Teknologi Informasi dan Ilmu Komputer (JTIK - SINTA 2)',
      tanggal: '10 Des 2025',
      kategori: 'SINTA 2',
      link: 'https://sinta.kemdikbud.go.id/journals/profile/2049',
    },
    {
      id: 4,
      dosen: 'Eka Putri, M.T.',
      nidn: '0405078804',
      judul: 'Analisis Sentimen Opini Publik terhadap Kebijakan Transportasi Listrik Menggunakan BERT Framework',
      jurnal: 'Jurnal Riset Akuntansi & Informatika (JRAI - SINTA 3)',
      tanggal: '18 Nov 2025',
      kategori: 'SINTA 3',
      link: 'https://sinta.kemdikbud.go.id/journals/profile/3120',
    },
    {
      id: 5,
      dosen: 'Dr. Eng. Rahmat Hidayat, M.Sc.',
      nidn: '0409128305',
      judul: 'Performance Benchmark of Lightweight Cryptography for Embedded Microcontrollers',
      jurnal: 'International Journal of Advanced Computer Science (Scopus Q3)',
      tanggal: '24 Okt 2025',
      kategori: 'Scopus Q3',
      link: 'https://scopus.com/record/display.uri?eid=2-s2.0-85129031',
    },
  ];

  // Mock Hibah Riset Data
  const hibahList = [
    {
      id: 1,
      ketua: 'Prof. Dr. Ir. H. Ahmad Dahlan, M.Kom',
      judul: 'Pengembangan Model Generative AI Berbasis Micro-Services untuk Deteksi Dini Penyakit Tanaman Padi',
      skema: 'DIKTI - Fundamental Reguler',
      sumber: 'DIKTI DRTPM',
      dana: 65000000,
      status: 'Selesai LPJ',
    },
    {
      id: 2,
      ketua: 'Dr. Siti Nurhaliza, S.T., M.T.',
      judul: 'Rancang Bangun Microgrid Energi Terbarukan Berbasis IoT untuk Desa Mandiri Energi',
      skema: 'DIKTI - Terapan Unggulan PT',
      sumber: 'DIKTI DRTPM',
      dana: 45000000,
      status: 'Termin 2 Disbursed',
    },
    {
      id: 3,
      ketua: 'Budi Santoso, M.Kom',
      judul: 'Audit Keamanan Informasi SSO Subdomain Kampus Berbasis Standar ISO/IEC 27001',
      skema: 'Internal - Penelitian Pemula (HPP)',
      sumber: 'Dana Internal LPPM',
      dana: 20000000,
      status: 'Penelitian Berjalan',
    },
    {
      id: 4,
      ketua: 'Eka Putri, M.T.',
      judul: 'Penerapan UI/UX Modern pada Sistem Manajemen Informasi Pegawai (SIMPEG) Kampus',
      skema: 'Internal - Pengabdian Vokasi (PPM)',
      sumber: 'Dana Internal LPPM',
      dana: 15000000,
      status: 'Pengabdian Berjalan',
    },
  ];

  // Mock HKI Data
  const hkiList = [
    {
      id: 1,
      inventor: 'Prof. Dr. Ir. H. Ahmad Dahlan, M.Kom & Tim',
      judul: 'Source Code Framework Algoritma MedSeg-DeepV1 untuk Segmentasi Citra Medis',
      jenis: 'Hak Cipta Program Komputer',
      no_cipta: 'EC00202619882',
      tanggal: '12 Jan 2026',
    },
    {
      id: 2,
      inventor: 'Dr. Siti Nurhaliza, S.T., M.T.',
      judul: 'Desain Industri Enclosure Sensor Node Microgrid Portable Tahan Cuaca',
      jenis: 'Paten Sederhana',
      no_cipta: 'IDS000004921',
      tanggal: '28 Des 2025',
    },
    {
      id: 3,
      inventor: 'Budi Santoso, M.Kom',
      judul: 'Buku Ajar Praktikum Keamanan Jaringan dan Kriptografi Kuantum',
      jenis: 'Hak Cipta Buku Ajar',
      no_cipta: 'EC00202598112',
      tanggal: '15 Nov 2025',
    },
    {
      id: 4,
      inventor: 'Eka Putri, M.T.',
      judul: 'Modul Sistem Informasi Manajemen Rekognisi Dosen dan Capaian IKU',
      jenis: 'Hak Cipta Karya Tulis',
      no_cipta: 'EC00202587654',
      tanggal: '05 Okt 2025',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* HEADER & BACK BUTTON */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/sippm')}
            className="btn btn-secondary btn-sm bg-white hover:bg-slate-100 text-slate-700 font-bold border-slate-200 flex items-center gap-1.5 shadow-xs"
          >
            <ArrowLeft size={16} /> Kembali ke Dashboard
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="badge badge-blue">
                Laporan Penjaminan Mutu UPM
              </span>
              <span className="badge badge-purple">
                IKU 5 Kemendikbudristek
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              Laporan Kinerja Riset & Luaran: {prodi.nama_prodi}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {prodi.fakultas} • Ketua Program Studi: <strong>{prodi.kaprodi}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="btn btn-primary bg-primary-700 hover:bg-primary-800 border-none text-white font-bold text-xs flex items-center gap-2 shadow-sm shrink-0"
        >
          <Printer size={16} /> Cetak Laporan PDF
        </button>
      </div>

      {/* TOP EXECUTIVE STATS GRID (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 bg-white border border-primary-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-primary-700 text-xs font-semibold">
            <span>DOSEN PENGUSUL</span>
            <User size={18} className="text-primary-600" />
          </div>
          <div className="text-3xl font-black font-mono text-slate-900">{prodi.dosen_pengusul} Dosen</div>
          <div className="text-[11px] text-primary-700 font-bold">Partisipasi Aktif LPPM</div>
        </div>

        <div className="card p-5 bg-white border border-purple-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-purple-700 text-xs font-semibold">
            <span>TOTAL PUBLIKASI</span>
            <Globe size={18} className="text-purple-600" />
          </div>
          <div className="text-3xl font-black font-mono text-slate-900">
            {prodi.scopus + prodi.sinta} <span className="text-sm font-normal text-slate-500">Artikel</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-bold">
            <span className="text-purple-700 font-mono">{prodi.scopus} Scopus</span>
            <span className="text-slate-300">•</span>
            <span className="text-blue-700 font-mono">{prodi.sinta} SINTA</span>
          </div>
        </div>

        <div className="card p-5 bg-white border border-emerald-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold">
            <span>HIBAH TERDANAI</span>
            <Award size={18} className="text-emerald-600" />
          </div>
          <div className="text-3xl font-black font-mono text-slate-900">
            {prodi.dikti + prodi.internal} <span className="text-sm font-normal text-slate-500">Proposal</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-bold">
            <span className="text-emerald-700 font-mono">{prodi.dikti} DIKTI</span>
            <span className="text-slate-300">•</span>
            <span className="text-amber-700 font-mono">{prodi.internal} Internal</span>
          </div>
        </div>

        <div className="card p-5 bg-white border border-amber-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-amber-700 text-xs font-semibold">
            <span>ALOKASI PAGU DANA</span>
            <TrendingUp size={18} className="text-amber-600" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">{formatRupiah(prodi.total_dana)}</div>
          <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
            <CheckCircle2 size={13} /> Capaian IKU 5: {prodi.capaian_iku}%
          </div>
        </div>
      </div>

      {/* MAIN DATA TAB SECTION */}
      <div className="card">
        {/* Navigation Tabs */}
        <div className="card-header bg-slate-50 p-4 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('publikasi')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                activeTab === 'publikasi'
                  ? 'bg-primary-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Globe size={15} /> Publikasi Jurnal ({publikasiList.length})
            </button>

            <button
              onClick={() => setActiveTab('hibah')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                activeTab === 'hibah'
                  ? 'bg-primary-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Award size={15} /> Hibah Riset ({hibahList.length})
            </button>

            <button
              onClick={() => setActiveTab('hki')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                activeTab === 'hki'
                  ? 'bg-primary-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <FileCheck size={15} /> HKI & Paten ({hkiList.length})
            </button>
          </div>

          <div className="input-wrapper w-full md:w-64">
            <span className="input-prefix-icon"><Search size={15} /></span>
            <input
              type="text"
              className="input input-icon-left text-xs"
              placeholder="Cari judul / nama dosen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* TAB CONTENT: TAB 1 - PUBLIKASI JURNAL */}
        {activeTab === 'publikasi' && (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th className="text-center w-12">No</th>
                  <th className="text-left w-64">Nama Dosen & NIDN</th>
                  <th className="text-left">Judul Artikel & Nama Jurnal</th>
                  <th className="text-center w-36">Kategori & Indexing</th>
                  <th className="text-center w-32">Tanggal Terbit</th>
                  <th className="text-center w-32">Link Publikasi</th>
                </tr>
              </thead>
              <tbody>
                {publikasiList
                  .filter(
                    (p) =>
                      p.dosen.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      p.judul.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((pub, idx) => (
                    <tr key={pub.id} className="hover:bg-slate-50 transition-colors">
                      <td className="text-center align-middle font-mono font-bold text-slate-400 text-xs">
                        {idx + 1}
                      </td>
                      <td className="text-left align-middle">
                        <div className="font-extrabold text-slate-900 text-xs">{pub.dosen}</div>
                        <div className="text-[11px] text-slate-400 font-mono">NIDN: {pub.nidn}</div>
                      </td>
                      <td className="text-left align-middle space-y-1">
                        <div className="font-bold text-slate-900 text-xs leading-snug">{pub.judul}</div>
                        <div className="text-[11px] text-primary-700 font-medium">{pub.jurnal}</div>
                      </td>
                      <td className="text-center align-middle">
                        <div className="flex justify-center">
                          <span
                            className={`badge font-bold text-[11px] font-mono ${
                              pub.kategori.includes('Scopus')
                                ? 'badge-purple bg-purple-100 text-purple-800 border-purple-200'
                                : 'badge-blue bg-blue-100 text-blue-800 border-blue-200'
                            }`}
                          >
                            {pub.kategori}
                          </span>
                        </div>
                      </td>
                      <td className="text-center align-middle text-xs font-medium text-slate-600">
                        {pub.tanggal}
                      </td>
                      <td className="text-center align-middle">
                        <div className="flex justify-center">
                          <a
                            href={pub.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary btn-sm bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[11px] inline-flex items-center gap-1 border-purple-200"
                          >
                            <ExternalLink size={13} /> DOI / URL
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB CONTENT: TAB 2 - HIBAH RISET */}
        {activeTab === 'hibah' && (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th className="text-center w-12">No</th>
                  <th className="text-left w-64">Ketua Peneliti</th>
                  <th className="text-left">Judul Proposal Riset</th>
                  <th className="text-center w-48">Skema & Sumber Hibah</th>
                  <th className="text-center w-40">Dana Disetujui</th>
                  <th className="text-center w-36">Status Hibah</th>
                </tr>
              </thead>
              <tbody>
                {hibahList
                  .filter(
                    (h) =>
                      h.ketua.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      h.judul.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((hib, idx) => (
                    <tr key={hib.id} className="hover:bg-slate-50 transition-colors">
                      <td className="text-center align-middle font-mono font-bold text-slate-400 text-xs">
                        {idx + 1}
                      </td>
                      <td className="text-left align-middle">
                        <div className="font-extrabold text-slate-900 text-xs">{hib.ketua}</div>
                        <div className="text-[11px] text-slate-500 font-medium">Ketua Pelaksana</div>
                      </td>
                      <td className="text-left align-middle">
                        <div className="font-bold text-slate-900 text-xs leading-snug">{hib.judul}</div>
                      </td>
                      <td className="text-center align-middle">
                        <div className="text-xs font-bold text-slate-800">{hib.skema}</div>
                        <div className="text-[11px] text-primary-700 font-medium">{hib.sumber}</div>
                      </td>
                      <td className="text-center align-middle font-mono font-extrabold text-primary-900 text-xs">
                        {formatRupiah(hib.dana)}
                      </td>
                      <td className="text-center align-middle">
                        <div className="flex justify-center">
                          <span className="badge badge-green font-bold text-[11px]">
                            {hib.status}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB CONTENT: TAB 3 - HKI & PATEN */}
        {activeTab === 'hki' && (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th className="text-center w-12">No</th>
                  <th className="text-left w-64">Inventor / Pemegang Hak</th>
                  <th className="text-left">Judul Ciptaan / Paten</th>
                  <th className="text-center w-48">Jenis HKI</th>
                  <th className="text-center w-40">No. Permohonan / Cipta</th>
                  <th className="text-center w-32">Tanggal Terbit</th>
                </tr>
              </thead>
              <tbody>
                {hkiList
                  .filter(
                    (hk) =>
                      hk.inventor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      hk.judul.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((hki, idx) => (
                    <tr key={hki.id} className="hover:bg-slate-50 transition-colors">
                      <td className="text-center align-middle font-mono font-bold text-slate-400 text-xs">
                        {idx + 1}
                      </td>
                      <td className="text-left align-middle">
                        <div className="font-extrabold text-slate-900 text-xs">{hki.inventor}</div>
                      </td>
                      <td className="text-left align-middle">
                        <div className="font-bold text-slate-900 text-xs leading-snug">{hki.judul}</div>
                      </td>
                      <td className="text-center align-middle">
                        <div className="flex justify-center">
                          <span className="badge badge-fuchsia bg-fuchsia-50 text-fuchsia-800 border-fuchsia-200 font-bold text-[11px]">
                            {hki.jenis}
                          </span>
                        </div>
                      </td>
                      <td className="text-center align-middle font-mono font-bold text-slate-700 text-xs">
                        {hki.no_cipta}
                      </td>
                      <td className="text-center align-middle text-xs font-medium text-slate-600">
                        {hki.tanggal}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FOOTER NOTE / CATATAN EVALUASI UPM */}
      <Hero
        badge={<span className="flex items-center gap-2 text-primary-200 font-extrabold text-sm tracking-wide"><CheckCircle2 size={20} /> REKOMENDASI PENJAMINAN MUTU UPM</span>}
        title=""
        description={
          <p className="text-xs md:text-sm text-primary-50 leading-relaxed font-semibold max-w-4xl opacity-95">
            Capaian IKU 5 Program Studi <strong>{prodi.nama_prodi}</strong> telah diverifikasi oleh Badan Penjaminan Mutu (UPM) Kampus. Seluruh luaran publikasi Scopus, Sinta, dan HKI telah memenuhi kriteria SPMI Kemendikbudristek.
          </p>
        }
        actions={
          <div className="text-left md:text-right shrink-0 bg-primary-950/80 p-3.5 rounded-xl border border-primary-700/60">
            <div className="text-[10px] text-primary-300 uppercase font-black tracking-wider">STATUS AKREDITASI PRODI</div>
            <div className="text-xl font-black text-emerald-300 font-mono">UNGGUL (A)</div>
          </div>
        }
      />
    </div>
  );
}
