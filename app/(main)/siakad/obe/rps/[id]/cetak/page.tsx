'use client';

import { useState, useEffect, useCallback, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Printer,
  CheckCircle2,
  Clock,
  Layers,
  BookOpen,
  Award,
  Sparkles,
  FileText,
  RotateCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { siakadService } from '@/services/siakad.service';
import { arsipService } from '@/services/arsip.service';
import type { KopSurat } from '@/types/arsip.types';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function CetakRpsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const rpsId = Number(resolvedParams.id);

  const [loading, setLoading] = useState(true);
  const [rps, setRps] = useState<any | null>(null);
  const [sesiList, setSesiList] = useState<any[]>([]);
  const [kopSurat, setKopSurat] = useState<KopSurat | null>(null);
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');

  const fetchData = useCallback(async () => {
    if (!rpsId) return;
    try {
      setLoading(true);

      // 1. Ambil detail RPS lengkap beserta relasi
      const resRps = await siakadService.showRps(rpsId);
      const rpsData = resRps?.data;
      setRps(rpsData || null);

      if (rpsData) {
        // 2. Ambil sesi pertemuan mingguan (1-16)
        try {
          const resSesi = await siakadService.listRpsSesi(rpsId, { per_page: 50 });
          const rawSesi = resSesi?.data;
          const list = Array.isArray(rawSesi) ? rawSesi : (rawSesi?.items || rawSesi?.data || []);
          if (list.length > 0) {
            setSesiList(list.sort((a: any, b: any) => (a.minggu_ke || 0) - (b.minggu_ke || 0)));
          } else if (Array.isArray(rpsData.mingguan) && rpsData.mingguan.length > 0) {
            setSesiList([...rpsData.mingguan].sort((a: any, b: any) => (a.minggu_ke || 0) - (b.minggu_ke || 0)));
          }
        } catch (e) {
          console.warn('Gagal memuat sesi mingguan dari endpoint sesi, gunakan relasi mingguan:', e);
          if (Array.isArray(rpsData.mingguan)) {
            setSesiList([...rpsData.mingguan].sort((a: any, b: any) => (a.minggu_ke || 0) - (b.minggu_ke || 0)));
          }
        }

        // 3. Ambil Kop Surat resmi aktif dari modul ARSIP
        const tahun = rpsData.tanggal_penyusunan
          ? new Date(rpsData.tanggal_penyusunan).getFullYear()
          : (rpsData.tahun_ajaran ? parseInt(rpsData.tahun_ajaran.substring(0, 4), 10) : new Date().getFullYear());

        try {
          const resKop = await arsipService.getKopSuratByYear(tahun || new Date().getFullYear());
          if (resKop?.data) {
            setKopSurat(resKop.data);
          }
        } catch (e) {
          console.warn('Kop surat ARSIP tidak ditemukan, gunakan kop resmi fallback:', e);
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memuat data dokumen RPS.');
    } finally {
      setLoading(false);
    }
  }, [rpsId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePrint = () => {
    const originalTitle = document.title;
    const mk = rps?.mata_kuliah || rps?.mataKuliah;
    const kodeMk = mk?.kode_mk ? mk.kode_mk.replace(/[\/\\]/g, '_') : 'MK';
    const kodeRps = rps?.kode_rps ? rps.kode_rps.replace(/[\/\\]/g, '_') : `RPS_${rpsId}`;
    document.title = `RPS_${kodeMk}_${kodeRps}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  // Helper relasi dan label
  const mk = rps?.mata_kuliah || rps?.mataKuliah;
  const kurikulum = mk?.kurikulum;
  const prodi = kurikulum?.program_studi || kurikulum?.programStudi || mk?.program_studi;
  const fakultas = prodi?.fakultas;
  const rumpun = mk?.rumpun_mata_kuliah || mk?.rumpunMataKuliah;
  const dosenPengembang = rps?.dosen_pengembang || rps?.dosenPengembang;
  const koordinatorRmk = rps?.koordinator_rmk || rps?.koordinatorRmk;
  const kaprodi = rps?.kaprodi;
  const dosenAnggotas: any[] = Array.isArray(rps?.dosen_anggotas) ? rps.dosen_anggotas : [];

  // Pustaka
  const pustakaUtamaList = useMemo(() => {
    if (!rps?.pustaka_utama) return [];
    return rps.pustaka_utama
      .split('\n')
      .map((p: string) => p.trim())
      .filter(Boolean);
  }, [rps]);

  const pustakaPendukungList = useMemo(() => {
    if (!rps?.pustaka_pendukung) return [];
    return rps.pustaka_pendukung
      .split('\n')
      .map((p: string) => p.trim())
      .filter(Boolean);
  }, [rps]);

  // CPL yang dibebankan pada MK
  const cplList: any[] = useMemo(() => {
    if (!mk) return [];
    const directCpls = Array.isArray(mk.cpls) ? mk.cpls : [];
    const prodiCpls = Array.isArray(mk.cpmk_prodis || mk.cpmkProdis)
      ? (mk.cpmk_prodis || mk.cpmkProdis).map((cp: any) => cp.cpl).filter(Boolean)
      : [];

    const merged = [...directCpls, ...prodiCpls];
    const uniqueMap = new Map<number, any>();
    merged.forEach((item) => {
      if (item && item.id && !uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, item);
      }
    });
    return Array.from(uniqueMap.values());
  }, [mk]);

  // CPMK yang dibebankan pada MK
  const cpmkList: any[] = useMemo(() => {
    if (!mk) return [];
    if (Array.isArray(mk.cpmk_prodis || mk.cpmkProdis) && (mk.cpmk_prodis || mk.cpmkProdis).length > 0) {
      return mk.cpmk_prodis || mk.cpmkProdis;
    }
    if (Array.isArray(mk.cpmks) && mk.cpmks.length > 0) {
      return mk.cpmks;
    }
    return [];
  }, [mk]);

  // Sub-CPMK
  const subCpmkList = useMemo(() => {
    const list: any[] = [];
    const cpmks: any[] = mk?.cpmks || [];
    cpmks.forEach((cpmk: any) => {
      (cpmk.sub_cpmks || cpmk.subCpmks || []).forEach((sub: any) => {
        list.push({
          id: sub.id,
          kode_cpmk: cpmk.kode_cpmk || `CPMK #${cpmk.id}`,
          deskripsi: sub.deskripsi || sub.uraian,
        });
      });
    });
    return list;
  }, [mk]);

  // Total Bobot Pertemuan
  const totalBobotMingguan = useMemo(() => {
    if (!sesiList || sesiList.length === 0) return 0;
    return sesiList.reduce((acc, curr) => acc + (parseFloat(curr.bobot_penilaian) || 0), 0);
  }, [sesiList]);

  // Status Badge Helper
  const statusBadge = useMemo(() => {
    const st = rps?.status || 'draft';
    if (st === 'disetujui') {
      return <Badge variant="success">DISETUJUI RESMI</Badge>;
    }
    if (st === 'diajukan') {
      return <Badge variant="warning">MENUNGGU APPROVAL</Badge>;
    }
    if (st === 'revisi') {
      return <Badge variant="danger">PERLU REVISI</Badge>;
    }
    return <Badge variant="gray">DRAFT</Badge>;
  }, [rps?.status]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-[var(--module-primary)] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Menyiapkan Dokumen Rencana Pembelajaran Semester (RPS) Resmi...</p>
      </div>
    );
  }

  if (!rps) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-800">Dokumen RPS Tidak Ditemukan</h2>
        <p className="text-sm text-slate-500">Data dokumen RPS dengan ID {rpsId} tidak tersedia atau telah dihapus.</p>
        <Button variant="outline" onClick={() => router.push('/siakad/obe/rps/kelola')}>
          Kembali ke Kelola RPS
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-6 print:p-0 print:bg-white print:m-0">
      {/* ── ACTION BAR ATAS (HILANG SAAT DICETAK) ──────────────────────────────── */}
      <div className="print:hidden max-w-6xl mx-auto px-4 mb-6">
        <div className="backdrop-blur-md bg-white/95 border border-slate-200 shadow-md rounded-2xl px-5 py-3.5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              icon={<ArrowLeft size={16} />}
              onClick={() => router.push(`/siakad/obe/rps/${rpsId}`)}
              style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
            >
              Kembali
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">
                  {mk?.kode_mk ? `${mk.kode_mk} - ` : ''}{mk?.nama || 'RPS Mata Kuliah'}
                </span>
                {statusBadge}
              </div>
              <p className="text-2xs text-slate-500">
                Kode Dokumen: <span className="font-mono font-medium">{rps.kode_rps || '-'}</span> • Semester {rps.semester || mk?.semester_anjuran || 1} • {rps.tahun_ajaran || '-'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  orientation === 'landscape'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Landscape (Disarankan)
              </button>
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  orientation === 'portrait'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Portrait
              </button>
            </div>

            <Button
              variant="primary"
              size="sm"
              icon={<Printer size={16} />}
              onClick={handlePrint}
              className="font-bold shadow-sm"
            >
              Cetak / Simpan PDF
            </Button>
          </div>
        </div>

        <div className="mt-2 text-center text-2xs text-slate-500">
          💡 Gunakan opsi <strong className="text-slate-700">"Save as PDF"</strong> di browser dan pastikan centang opsi <strong className="text-slate-700">"Background graphics"</strong> untuk hasil cetak tabel & kop yang sempurna.
        </div>
      </div>

      {/* ── STYLESHEET CETAK KHUSUS A4 & VEKTOR TAJAM ────────────────────────── */}
      <style jsx global>{`
        @page {
          size: A4 ${orientation};
          margin: ${orientation === 'landscape' ? '6mm 8mm 6mm 8mm' : '8mm 10mm 8mm 10mm'};
        }

        @media screen {
          .printable-sheet {
            width: ${orientation === 'landscape' ? '297mm' : '210mm'};
            min-height: ${orientation === 'landscape' ? '210mm' : '297mm'};
            margin: 0 auto;
            background: #ffffff;
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
            padding: 0;
            box-sizing: border-box;
          }
        }

        @media print {
          @page {
            size: A4 ${orientation};
            margin: ${orientation === 'landscape' ? '6mm 8mm 6mm 8mm' : '8mm 10mm 8mm 10mm'};
          }

          html, body {
            background: #ffffff !important;
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Pastikan dokumen cetak RPS dan SEMUA isinya TERLIHAT (override body * di globals.css) */
          body * {
            visibility: hidden;
          }

          .printable-document,
          .printable-document *,
          .print-document,
          .print-document *,
          .printable-sheet,
          .printable-sheet * {
            visibility: visible !important;
          }

          /* Sembunyikan navbar, sidebar, banner, action bar secara fisik */
          .print-action-bar,
          .print-hidden-element,
          [class*="print:hidden"],
          aside,
          nav,
          header:not(.rps-kop-wrapper),
          .sidebar,
          .navbar,
          .sidebar-overlay,
          .sidebar-resizer,
          [class*="sidebar"],
          [class*="navbar"],
          [class*="banner"],
          .sticky,
          button,
          .btn {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .main-layout,
          .main-layout > div,
          main,
          .rps-print-page,
          .page-content-wrapper {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: auto !important;
            height: auto !important;
            border: none !important;
            box-shadow: none !important;
            display: block !important;
            background: #ffffff !important;
            overflow: visible !important;
            position: static !important;
          }

          .printable-document,
          .print-document,
          .printable-sheet {
            display: block !important;
            position: relative !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #000000 !important;
            overflow: visible !important;
          }

          .rps-kop-wrapper {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            display: block !important;
          }

          .rps-kop-wrapper img {
            width: 100% !important;
            height: auto !important;
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
            max-height: none !important;
          }

          .page-break-before {
            page-break-before: always !important;
            break-before: page !important;
          }

          .avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          table {
            width: 100% !important;
            border-collapse: collapse !important;
            page-break-inside: auto;
          }

          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }

          thead {
            display: table-header-group;
          }

          tfoot {
            display: table-footer-group;
          }
        }

        .rps-table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #1e293b;
        }

        .rps-table th,
        .rps-table td {
          border: 1px solid #1e293b;
          padding: 5px 7px;
          vertical-align: top;
        }

        .rps-table-header {
          background-color: #f1f5f9 !important;
          font-weight: 700;
          color: #0f172a;
          text-align: center;
        }
      `}</style>

      {/* ── KERTAS DOKUMEN CETAK UTAMA (A4) ─────────────────────────────────── */}
      <div className="w-full flex justify-center overflow-x-auto pb-8 print:p-0 print:overflow-visible print:block">
        <div className="printable-document print-document printable-sheet text-slate-900 font-serif text-[10pt] leading-normal rounded-xl bg-white shadow-2xl print:shadow-none print:rounded-none overflow-hidden">
        {/* ── 1. KOP SURAT MODUL ARSIP (FULL WIDTH, TANPA MARGIN & PADDING) ──── */}
        <div className="rps-kop-wrapper w-full p-0 m-0 overflow-hidden avoid-break">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={kopSurat?.file_url || '/images/kop_surat_kampus.png'}
            alt="Kop Surat Resmi Institusi"
            className="w-full h-auto block p-0 m-0"
            style={{ width: '100%', height: 'auto', display: 'block', margin: 0, padding: 0 }}
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.src.endsWith('/images/kop_surat_kampus.png')) {
                target.src = '/images/kop_surat_kampus.png';
              }
            }}
          />
        </div>

        {/* ── KONTEN DOKUMEN RPS (DENGAN MARGIN/PADDING DOKUMEN) ──────────────── */}
        <div className="p-6 md:p-8 print:p-2 space-y-4">

        {/* ── 2. JUDUL DOKUMEN RPS ────────────────────────────────────────────── */}
        <div className="text-center my-3 avoid-break">
          <h2 className="text-[13pt] font-black uppercase tracking-wider underline">
            RENCANA PEMBELAJARAN SEMESTER (RPS)
          </h2>
          <p className="text-[9pt] font-semibold text-slate-700 uppercase tracking-wide mt-0.5 font-sans">
            Standar Kurikulum Berbasis Capaian Pembelajaran Lulusan (Outcome-Based Education / SN-DIKTI)
          </p>
          <div className="inline-flex items-center gap-3 text-[8.5pt] font-mono text-slate-700 mt-1 px-3 py-0.5 bg-slate-50 border border-slate-300 rounded">
            <span>No. Dokumen: <strong>{rps.kode_rps || '-'}</strong></span>
            <span>•</span>
            <span>Tanggal Terbit: <strong>{formatDate(rps.tanggal_penyusunan || rps.created_at)}</strong></span>
            <span>•</span>
            <span>Status: <strong className="uppercase">{rps.status || 'draft'}</strong></span>
          </div>
        </div>

        {/* ── 3. TABEL IDENTITAS MATA KULIAH & PENGESAHAN ──────────────────────── */}
        <div className="avoid-break mb-4">
          <table className="rps-table text-[9pt] mb-3">
            <tbody>
              <tr>
                <td className="rps-table-header w-[18%]">MATA KULIAH (MK)</td>
                <td className="w-[32%] font-bold text-slate-950 font-sans">{mk?.nama || '-'}</td>
                <td className="rps-table-header w-[18%]">KODE MATA KULIAH</td>
                <td className="w-[32%] font-mono font-bold text-slate-950">{mk?.kode_mk || '-'}</td>
              </tr>
              <tr>
                <td className="rps-table-header">RUMPUN MK (RMK)</td>
                <td>{rumpun?.nama || rumpun?.nama_rumpun || rps.bahan_kajian_mk || 'Mata Kuliah Keahlian Berkarya'}</td>
                <td className="rps-table-header">BOBOT (SKS)</td>
                <td className="font-sans">
                  <strong>{mk?.total_sks || 2} SKS</strong>
                  <span className="text-slate-600 text-[8pt] ml-1.5 font-normal">
                    (Teori: {mk?.sks_teori ?? 2} SKS, Praktik: {mk?.sks_praktik ?? 0} SKS)
                  </span>
                </td>
              </tr>
              <tr>
                <td className="rps-table-header">PROGRAM STUDI</td>
                <td>{prodi?.nama_resmi || prodi?.nama || 'Program Studi'}</td>
                <td className="rps-table-header">SEMESTER / TAHUN</td>
                <td>Semester {rps.semester || mk?.semester_anjuran || 1} / {rps.tahun_ajaran || '2026/2027'}</td>
              </tr>
              <tr>
                <td className="rps-table-header">KURIKULUM</td>
                <td>{kurikulum?.nama || kurikulum?.kode || 'Kurikulum OBE'} {kurikulum?.tahun_berlaku ? `(${kurikulum.tahun_berlaku})` : ''}</td>
                <td className="rps-table-header">JENIS PEMBELAJARAN</td>
                <td>{rps.jenis_pembelajaran || 'Kuliah / Responsi / Praktik'}</td>
              </tr>
              <tr>
                <td className="rps-table-header">MATA KULIAH SYARAT</td>
                <td colSpan={3}>{rps.mata_kuliah_syarat && rps.mata_kuliah_syarat !== '-' ? rps.mata_kuliah_syarat : 'Tidak Ada Prasyarat (-)'}</td>
              </tr>
            </tbody>
          </table>

          {/* Kolom Otorisasi / Pengesahan 3 Pihak */}
          <div className="border border-slate-800 rounded p-2.5 bg-slate-50/50">
            <div className="text-center text-[9pt] font-bold uppercase tracking-wider mb-2 font-sans border-b border-slate-300 pb-1">
              LEMBAR PENGESAHAN DAN OTORISASI DOKUMEN RPS
            </div>
            <div className="grid grid-cols-3 gap-3 text-center text-[8.5pt]">
              {/* Dosen Pengembang RPS */}
              <div className="flex flex-col justify-between border-r border-slate-300 pr-2">
                <div>
                  <span className="font-semibold text-slate-700 block text-[8pt]">Dosen Pengembang RPS:</span>
                  <span className="text-2xs text-slate-500 italic block mt-0.5">Penyusun & Penanggungjawab</span>
                </div>
                <div className="my-8">
                  {rps.status === 'disetujui' && (
                    <div className="inline-block border border-emerald-600 text-emerald-800 text-[7pt] font-bold px-2 py-0.5 rounded uppercase font-sans">
                      ✓ Diverifikasi
                    </div>
                  )}
                </div>
                <div className="border-t border-slate-400 pt-1">
                  <span className="font-bold block text-slate-950 underline font-sans">
                    {dosenPengembang?.nama_lengkap || dosenPengembang?.nama || 'Dosen Pengampu MK'}
                  </span>
                  <span className="text-2xs text-slate-600 font-mono block">
                    NIDN: {dosenPengembang?.nidn || dosenPengembang?.nip || '-'}
                  </span>
                </div>
              </div>

              {/* Koordinator Rumpun MK */}
              <div className="flex flex-col justify-between border-r border-slate-300 px-2">
                <div>
                  <span className="font-semibold text-slate-700 block text-[8pt]">Koordinator Rumpun MK:</span>
                  <span className="text-2xs text-slate-500 italic block mt-0.5">Penelaah Bidang Keahlian</span>
                </div>
                <div className="my-8">
                  {rps.status === 'disetujui' && (
                    <div className="inline-block border border-emerald-600 text-emerald-800 text-[7pt] font-bold px-2 py-0.5 rounded uppercase font-sans">
                      ✓ Disetujui
                    </div>
                  )}
                </div>
                <div className="border-t border-slate-400 pt-1">
                  <span className="font-bold block text-slate-950 underline font-sans">
                    {koordinatorRmk?.nama_lengkap || koordinatorRmk?.nama || 'Koordinator RMK'}
                  </span>
                  <span className="text-2xs text-slate-600 font-mono block">
                    NIDN: {koordinatorRmk?.nidn || koordinatorRmk?.nip || '-'}
                  </span>
                </div>
              </div>

              {/* Ketua Program Studi */}
              <div className="flex flex-col justify-between pl-2">
                <div>
                  <span className="font-semibold text-slate-700 block text-[8pt]">Ketua Program Studi:</span>
                  <span className="text-2xs text-slate-500 italic block mt-0.5">Pengesah Kurikulum OBE</span>
                </div>
                <div className="my-8">
                  {rps.status === 'disetujui' && (
                    <div className="inline-block border-2 border-emerald-700 text-emerald-900 bg-emerald-50 text-[7.5pt] font-extrabold px-2.5 py-0.5 rounded uppercase font-sans tracking-wide">
                      ★ DISAHKAN RESMI
                    </div>
                  )}
                </div>
                <div className="border-t border-slate-400 pt-1">
                  <span className="font-bold block text-slate-950 underline font-sans">
                    {kaprodi?.nama_lengkap || kaprodi?.nama || 'Ketua Program Studi'}
                  </span>
                  <span className="text-2xs text-slate-600 font-mono block">
                    NIDN: {kaprodi?.nidn || kaprodi?.nip || '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Dosen Anggota Team Teaching jika ada */}
            {dosenAnggotas.length > 0 && (
              <div className="mt-2.5 pt-2 border-t border-slate-200 text-2xs text-slate-600 font-sans">
                <span className="font-bold text-slate-700 mr-1">Tim Dosen Pengampu (Team Teaching):</span>
                {dosenAnggotas.map((d: any, idx: number) => (
                  <span key={d.id || idx}>
                    {d.nama_lengkap || d.nama || d.name}
                    {d.nidn ? ` (NIDN: ${d.nidn})` : ''}
                    {idx < dosenAnggotas.length - 1 ? '; ' : ''}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── 4. CAPAIAN PEMBELAJARAN (CPL & CPMK) ────────────────────────────── */}
        <div className="avoid-break mb-4">
          <div className="font-bold uppercase tracking-wide text-[9.5pt] mb-1.5 text-slate-950 font-sans border-b border-slate-800 pb-0.5 flex items-center justify-between">
            <span>I. CAPAIAN PEMBELAJARAN LULUSAN & MATA KULIAH (CPL & CPMK)</span>
            <span className="text-[8pt] font-normal text-slate-600 font-serif">SN-DIKTI / OBE</span>
          </div>

          <table className="rps-table text-[8.5pt]">
            <thead>
              <tr className="rps-table-header">
                <th className="w-[12%] py-1">KODE</th>
                <th className="w-[20%] py-1">KATEGORI / ASPEK</th>
                <th className="py-1">RUMUSAN CAPAIAN PEMBELAJARAN LULUSAN YANG DIBEBANKAN PADA MK (CPL-PRODI)</th>
              </tr>
            </thead>
            <tbody>
              {cplList.length > 0 ? (
                cplList.map((cpl: any) => (
                  <tr key={cpl.id}>
                    <td className="font-mono font-bold text-center">{cpl.kode_cpl || `CPL-${cpl.id}`}</td>
                    <td className="font-semibold text-slate-800">{cpl.kategori || cpl.jenis || 'CPL Program Studi'}</td>
                    <td className="text-justify leading-relaxed">{cpl.deskripsi || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="text-center italic py-2 text-slate-500">
                    CPL dibebankan sesuai standar rumusan kurikulum Program Studi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Tabel CPMK & Sub-CPMK */}
          <table className="rps-table text-[8.5pt] mt-2">
            <thead>
              <tr className="rps-table-header">
                <th className="w-[12%] py-1">KODE</th>
                <th className="w-[20%] py-1">DUKUNGAN CPL</th>
                <th className="py-1">CAPAIAN PEMBELAJARAN MATA KULIAH (CPMK)</th>
              </tr>
            </thead>
            <tbody>
              {cpmkList.length > 0 ? (
                cpmkList.map((cpmk: any) => (
                  <tr key={cpmk.id}>
                    <td className="font-mono font-bold text-center">{cpmk.kode_cpmk || `CPMK-${cpmk.id}`}</td>
                    <td className="font-mono text-center font-semibold text-slate-800">
                      {cpmk.cpl?.kode_cpl || cpmk.kode_cpl || 'CPL Terkait'}
                    </td>
                    <td className="text-justify leading-relaxed">{cpmk.deskripsi || cpmk.rumusan || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="text-center italic py-2 text-slate-500">
                    CPMK dirumuskan secara spesifik mengacu pada capaian pembelajaran program studi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Rincian Sub-CPMK jika tersedia */}
          {subCpmkList.length > 0 && (
            <div className="mt-2 p-2 bg-slate-50 border border-slate-300 rounded text-[8pt]">
              <span className="font-bold text-slate-900 block mb-1 font-sans">
                Kemampuan Akhir Tiap Tahapan Pembelajaran (Sub-CPMK):
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-slate-800">
                {subCpmkList.map((sub: any, idx: number) => (
                  <li key={sub.id || idx}>
                    <strong className="font-mono text-slate-950">{sub.kode_cpmk ? `[${sub.kode_cpmk}] ` : ''}</strong>
                    {sub.deskripsi}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ── 5. DESKRIPSI SINGKAT & REFERENSI PUSTAKA ───────────────────────── */}
        <div className="avoid-break mb-4">
          <div className="font-bold uppercase tracking-wide text-[9.5pt] mb-1.5 text-slate-950 font-sans border-b border-slate-800 pb-0.5">
            II. DESKRIPSI MATA KULIAH, BAHAN KAJIAN & SUMBER PUSTAKA
          </div>

          <table className="rps-table text-[8.5pt]">
            <tbody>
              <tr>
                <td className="rps-table-header w-[22%]">Deskripsi Singkat MK</td>
                <td className="text-justify leading-relaxed">
                  {rps.deskripsi_singkat || mk?.deskripsi || 'Mata kuliah ini membahas konsep teoretis, praktis, metodologi dan implementasi komprehensif sesuai bidang keahlian.'}
                </td>
              </tr>
              <tr>
                <td className="rps-table-header">Bahan Kajian / Pokok Bahasan</td>
                <td className="text-justify leading-relaxed">
                  {rps.bahan_kajian_mk || 'Pokok bahasan disusun selaras dengan kurikulum OBE, standar industri, dan kompetensi lulusan program studi.'}
                </td>
              </tr>
              <tr>
                <td className="rps-table-header">Pustaka Utama (Wajib)</td>
                <td>
                  {pustakaUtamaList.length > 0 ? (
                    <ol className="list-decimal list-inside space-y-0.5">
                      {pustakaUtamaList.map((p: string, idx: number) => (
                        <li key={idx} className="leading-snug">{p}</li>
                      ))}
                    </ol>
                  ) : (
                    <span className="italic text-slate-500">Buku referensi utama dan modul terstandarisasi program studi.</span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="rps-table-header">Pustaka Pendukung</td>
                <td>
                  {pustakaPendukungList.length > 0 ? (
                    <ol className="list-decimal list-inside space-y-0.5">
                      {pustakaPendukungList.map((p: string, idx: number) => (
                        <li key={idx} className="leading-snug">{p}</li>
                      ))}
                    </ol>
                  ) : (
                    <span className="italic text-slate-500">Jurnal ilmiah, prosiding, whitepaper, dan dokumentasi resmi teknologi terkini.</span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="rps-table-header">Media Pembelajaran</td>
                <td>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <strong className="text-slate-900 block font-sans text-2xs uppercase">Perangkat Lunak (Software):</strong>
                      <span>{rps.media_pembelajaran_software || 'LMS Moodle, IDE / Editor Kode, Browser, DBMS Studio'}</span>
                    </div>
                    <div>
                      <strong className="text-slate-900 block font-sans text-2xs uppercase">Perangkat Keras (Hardware):</strong>
                      <span>{rps.media_pembelajaran_hardware || 'PC Laboratorium Komputer, LCD Proyektor, Jaringan Internet'}</span>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── 6. MATRIKS RENCANA PEMBELAJARAN MINGGUAN (16 MINGGU) ─────────────── */}
        <div className="mb-4">
          <div className="font-bold uppercase tracking-wide text-[9.5pt] mb-1.5 text-slate-950 font-sans border-b border-slate-800 pb-0.5 flex items-center justify-between">
            <span>III. MATRIKS RENCANA PEMBELAJARAN SEMESTER (MINGGUAN)</span>
            <span className="text-[8pt] font-normal text-slate-600 font-serif">16 Pertemuan Pembelajaran</span>
          </div>

          <table className="rps-table text-[8pt] leading-tight">
            <thead>
              <tr className="rps-table-header">
                <th className="w-[4%] py-1">Mg Ke-</th>
                <th className="w-[18%] py-1">Kemampuan Akhir Tiap Tahap Belajar (Sub-CPMK)</th>
                <th className="w-[18%] py-1">Bahan Kajian (Materi Pembelajaran)</th>
                <th className="w-[18%] py-1">Bentuk, Metode Pembelajaran & Penugasan Mahasiswa [Estimasi Waktu]</th>
                <th className="w-[14%] py-1">Pengalaman Belajar Mahasiswa</th>
                <th className="w-[12%] py-1">Penilaian (Kriteria & Bentuk)</th>
                <th className="w-[11%] py-1">Indikator & Teknik Penilaian</th>
                <th className="w-[5%] py-1">Bobot (%)</th>
              </tr>
            </thead>
            <tbody>
              {sesiList.length > 0 ? (
                sesiList.map((sesi: any) => {
                  const isUts = sesi.minggu_ke === 8 || sesi.jenis_pertemuan === 'uts' || String(sesi.topik_materi || '').toLowerCase().includes('uts');
                  const isUas = sesi.minggu_ke === 16 || sesi.jenis_pertemuan === 'uas' || String(sesi.topik_materi || '').toLowerCase().includes('uas');

                  if (isUts) {
                    return (
                      <tr key={sesi.id || sesi.minggu_ke} className="bg-slate-100 font-semibold avoid-break">
                        <td className="text-center font-bold font-mono py-2">{sesi.minggu_ke}</td>
                        <td colSpan={6} className="text-center py-2 uppercase tracking-wide font-sans text-slate-950">
                          ★ EVALUASI TENGAH SEMESTER (UTS) / UJIAN TENGAH SEMESTER ★
                          <span className="block text-2xs font-normal text-slate-600 lowercase first-letter:uppercase font-serif mt-0.5">
                            {sesi.topik_materi || sesi.kemampuan_akhir || 'Evaluasi ketercapaian Sub-CPMK pertemuan 1 sampai dengan pertemuan 7.'}
                          </span>
                        </td>
                        <td className="text-center font-bold font-mono py-2">{parseFloat(sesi.bobot_penilaian || 0)}%</td>
                      </tr>
                    );
                  }

                  if (isUas) {
                    return (
                      <tr key={sesi.id || sesi.minggu_ke} className="bg-slate-100 font-semibold avoid-break">
                        <td className="text-center font-bold font-mono py-2">{sesi.minggu_ke}</td>
                        <td colSpan={6} className="text-center py-2 uppercase tracking-wide font-sans text-slate-950">
                          ★ EVALUASI AKHIR SEMESTER (UAS) / UJIAN AKHIR SEMESTER ★
                          <span className="block text-2xs font-normal text-slate-600 lowercase first-letter:uppercase font-serif mt-0.5">
                            {sesi.topik_materi || sesi.kemampuan_akhir || 'Evaluasi menyeluruh ketercapaian capaian pembelajaran mata kuliah (CPMK).'}
                          </span>
                        </td>
                        <td className="text-center font-bold font-mono py-2">{parseFloat(sesi.bobot_penilaian || 0)}%</td>
                      </tr>
                    );
                  }

                  const subCpmk = sesi.sub_cpmk || sesi.subCpmk;
                  const bentukMetode = [
                    sesi.bentuk_metode,
                    sesi.bentuk_luring ? `Luring: ${sesi.bentuk_luring}` : null,
                    sesi.bentuk_daring ? `Daring: ${sesi.bentuk_daring}` : null,
                  ].filter(Boolean).join('; ');

                  return (
                    <tr key={sesi.id || sesi.minggu_ke} className="avoid-break">
                      {/* 1. Minggu Ke */}
                      <td className="text-center font-mono font-bold">{sesi.minggu_ke}</td>

                      {/* 2. Sub-CPMK */}
                      <td className="text-justify">
                        <span className="font-semibold block text-slate-950">
                          {subCpmk?.kode_cpmk ? `[${subCpmk.kode_cpmk}] ` : ''}
                          {sesi.kemampuan_akhir || subCpmk?.deskripsi || '-'}
                        </span>
                      </td>

                      {/* 3. Bahan Kajian (Materi) */}
                      <td>
                        <span className="font-bold text-slate-950 block">{sesi.topik_materi || sesi.bahan_kajian || '-'}</span>
                        {sesi.sub_topik_materi && (
                          <span className="text-2xs text-slate-700 block mt-0.5 whitespace-pre-line">
                            {sesi.sub_topik_materi}
                          </span>
                        )}
                      </td>

                      {/* 4. Bentuk, Metode & Estimasi Waktu */}
                      <td>
                        <span>{bentukMetode || 'Kuliah & Diskusi Kelompok'}</span>
                        {sesi.estimasi_waktu && (
                          <span className="block text-2xs font-semibold text-slate-700 mt-1">
                            Waktu: {sesi.estimasi_waktu}
                          </span>
                        )}
                        {sesi.penugasan_mahasiswa && (
                          <span className="block text-2xs text-slate-600 mt-0.5 italic">
                            Tugas: {sesi.penugasan_mahasiswa}
                          </span>
                        )}
                      </td>

                      {/* 5. Pengalaman Belajar */}
                      <td className="text-justify">
                        {sesi.pengalaman_belajar || 'Menyimak paparan dosen, studi kasus, berdiskusi dan menyelesaikan latihan mandiri.'}
                      </td>

                      {/* 6. Penilaian (Kriteria & Bentuk) */}
                      <td>
                        <span className="font-semibold block text-slate-900">
                          {sesi.kriteria_penilaian?.nama || sesi.kriteria_penilaian?.kode || sesi.kriteria_teknik || 'Kriteria Rubrik'}
                        </span>
                        {sesi.komponen_evaluasi?.nama && (
                          <span className="text-2xs text-slate-600 block mt-0.5">
                            Komponen: {sesi.komponen_evaluasi.nama}
                          </span>
                        )}
                      </td>

                      {/* 7. Indikator & Teknik Penilaian */}
                      <td>
                        <span>{sesi.indikator_penilaian || sesi.teknik_penilaian || 'Ketepatan & Penguasaan Materi'}</span>
                      </td>

                      {/* 8. Bobot % */}
                      <td className="text-center font-mono font-bold">
                        {parseFloat(sesi.bobot_penilaian || 0)}%
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="text-center italic py-4 text-slate-500">
                    Sesi pertemuan mingguan RPS belum diisi atau sedang dalam proses penyusunan.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-bold avoid-break">
                <td colSpan={7} className="text-right py-1.5 px-3 uppercase font-sans">
                  TOTAL BOBOT PENILAIAN EVALUASI MINGGUAN:
                </td>
                <td className="text-center font-mono py-1.5 text-[9pt]">
                  {totalBobotMingguan}%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ── 7. PEDOMAN EVALUASI & CATATAN PENUTUP ──────────────────────────── */}
        <div className="avoid-break mt-3 pt-2 border-t border-slate-800 text-[8pt] text-slate-700">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong className="block text-slate-900 font-sans uppercase mb-0.5">Keterangan Singkatan Pembelajaran:</strong>
              <p className="leading-snug">
                1. <strong>TM</strong> = Tatap Muka; <strong>PT</strong> = Penugasan Terstruktur; <strong>BM</strong> = Belajar Mandiri.<br />
                2. 1 SKS Teori = TM 50 menit/minggu + PT 60 menit/minggu + BM 60 menit/minggu.<br />
                3. 1 SKS Praktikum = 170 menit/minggu kegiatan laboratorium / bengkel / studio.
              </p>
            </div>
            <div className="text-right">
              <strong className="block text-slate-900 font-sans uppercase mb-0.5">Validasi Dokumen Sistem:</strong>
              <p className="leading-snug">
                Dicetak melalui SIAKAD Terpadu RAGI Campus Portal.<br />
                Waktu Cetak: {formatDate(new Date().toISOString())} • Versi Dokumen: OBE-{kurikulum?.tahun_berlaku || '2026'}.1<br />
                Dokumen ini sah dan mengikat untuk proses perkuliahan semester berjalan.
              </p>
            </div>
          </div>
        </div>
        </div>
      </div>
      </div>
    </div>
  );
}
