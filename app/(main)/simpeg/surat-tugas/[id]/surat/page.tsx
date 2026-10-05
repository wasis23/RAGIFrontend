'use client';

import { useEffect, useState, use, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Printer, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { simpegSuratTugasService } from '@/services/simpeg.surat-tugas.service';
import { simpegService } from '@/services/simpeg.service';
import { arsipService } from '@/services/arsip.service';
import { getApiErrorMessage, formatDate } from '@/lib/utils';
import type { SuratTugas } from '@/types/simpeg.surat-tugas.types';
import type { KopSurat } from '@/types/arsip.types';
import type { TandaTanganPegawai } from '@/types/simpeg.types';

export default function CetakSuratTugasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const suratTugasId = Number(resolvedParams.id);

  const [loading, setLoading] = useState(true);
  const [suratTugas, setSuratTugas] = useState<SuratTugas | null>(null);
  const [kopSurat, setKopSurat] = useState<KopSurat | null>(null);
  const [tandaTanganApprover, setTandaTanganApprover] = useState<TandaTanganPegawai | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const resSurat = await simpegSuratTugasService.getById(suratTugasId);
        const data = resSurat.data || null;
        setSuratTugas(data);

        if (data) {
          // 1. Ambil Kop Surat aktif dari modul ARSIP
          const tahun = data.tanggal_berangkat
            ? new Date(data.tanggal_berangkat).getFullYear()
            : new Date().getFullYear();

          try {
            const resKop = await arsipService.getKopSuratByYear(tahun);
            if (resKop.data) {
              setKopSurat(resKop.data);
            }
          } catch (e) {
            console.warn('Kop surat ARSIP tidak ditemukan, menggunakan kop standar:', e);
          }

          // 2. Ambil Tanda Tangan Digital Pimpinan (Direktur/Approver) dari master SIMPEG
          const approverUserId = data.direktur?.id || data.approved_by || data.approver?.id;
          if (approverUserId) {
            try {
              const resTtd = await simpegService.getActiveTandaTanganByUser(approverUserId);
              if (resTtd.data) {
                setTandaTanganApprover(resTtd.data);
              }
            } catch (e) {
              console.warn('Tanda tangan digital pimpinan belum terdaftar di SIMPEG:', e);
            }
          }
        }
      } catch (err: any) {
        toast.error(getApiErrorMessage(err, 'Gagal memuat dokumen surat tugas.'));
      } finally {
        setLoading(false);
      }
    };

    if (suratTugasId) {
      fetchData();
    }
  }, [suratTugasId]);

  const handlePrint = () => {
    const originalTitle = document.title;
    if (suratTugas?.nomor_surat) {
      document.title = `Surat-Tugas-SPPD-${suratTugas.nomor_surat.replace(/[\/\\]/g, '_')}`;
    } else {
      document.title = 'Surat-Tugas-SPPD';
    }
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  const isPanjarApprovedByPegawai = useMemo(() => {
    if (!suratTugas) return false;
    const nominal = Number(suratTugas.nominal_disetujui || 0);
    if (nominal <= 0 || suratTugas.status_pencairan === 'tidak_perlu') return true;
    const sikeuStatus = suratTugas.status_pencairan || suratTugas.pencairan_kas?.status;
    if (!sikeuStatus) return false;
    return ['siap_cair', 'dicairkan', 'sudah_cair', 'lpj_diunggah', 'selesai'].includes(sikeuStatus);
  }, [suratTugas]);

  // Helper format hari/tanggal rentang acara (contoh: "Senin, 18 Desember 2023" atau "Sabtu – Senin / 22–24 Agustus 2025")
  const formattedHariTanggalAcara = useMemo(() => {
    if (!suratTugas) return '-';
    const tglMulai = suratTugas.tanggal_mulai || suratTugas.tanggal_berangkat;
    const tglSelesai = suratTugas.tanggal_selesai || suratTugas.tanggal_kembali;

    if (!tglMulai) return '-';

    const dMulai = new Date(tglMulai);
    const namaHariMulai = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(dMulai);

    if (!tglSelesai || tglMulai === tglSelesai) {
      return `${namaHariMulai} / ${formatDate(tglMulai)}`;
    }

    const dSelesai = new Date(tglSelesai);
    const namaHariSelesai = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(dSelesai);

    const sameMonthYear =
      dMulai.getMonth() === dSelesai.getMonth() && dMulai.getFullYear() === dSelesai.getFullYear();

    if (sameMonthYear) {
      const monthYear = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(dSelesai);
      return `${namaHariMulai} – ${namaHariSelesai} / ${dMulai.getDate()} – ${dSelesai.getDate()} ${monthYear}`;
    }

    return `${namaHariMulai} – ${namaHariSelesai} / ${formatDate(tglMulai)} – ${formatDate(tglSelesai)}`;
  }, [suratTugas]);

  // Tanggal terbit surat (default Surakarta, DD MMMM YYYY)
  const formattedTanggalTerbit = useMemo(() => {
    if (!suratTugas) return '';
    const dateSource = suratTugas.approved_at || suratTugas.created_at || new Date().toISOString();
    return formatDate(dateSource);
  }, [suratTugas]);

  // Data Pimpinan (Direktur Politeknik Indonusa Surakarta)
  // Menampilkan user dengan role direktur jika ada, tanpa pernah menampilkan "Superadmin"
  const pimpinanNama = useMemo(() => {
    const dir = suratTugas?.direktur;
    const dirNama = dir?.pegawai?.nama_lengkap || dir?.name;
    if (dirNama && !dirNama.toLowerCase().includes('superadmin') && !dirNama.toLowerCase().includes('admin')) {
      return dirNama;
    }

    const approverNama = suratTugas?.approver?.pegawai?.nama_lengkap || suratTugas?.approver?.name;
    if (approverNama && !approverNama.toLowerCase().includes('superadmin') && !approverNama.toLowerCase().includes('admin')) {
      return approverNama;
    }

    return 'Ir. Suci Purwandari, M.M., Ph.D';
  }, [suratTugas]);

  const pimpinanNik = useMemo(() => {
    const dir = suratTugas?.direktur;
    const dirNama = dir?.pegawai?.nama_lengkap || dir?.name;
    const dirNik = dir?.pegawai?.nip || dir?.pegawai?.nik;
    if (dirNik && dirNama && !dirNama.toLowerCase().includes('superadmin') && !dirNama.toLowerCase().includes('admin')) {
      return dirNik;
    }

    const approverNama = suratTugas?.approver?.pegawai?.nama_lengkap || suratTugas?.approver?.name;
    const approverNik = suratTugas?.approver?.pegawai?.nip || suratTugas?.approver?.pegawai?.nik;
    if (approverNik && approverNama && !approverNama.toLowerCase().includes('superadmin') && !approverNama.toLowerCase().includes('admin')) {
      return approverNik;
    }

    return '23.08.03.011';
  }, [suratTugas]);

  const pimpinanTtdUrl = useMemo(() => {
    return (
      suratTugas?.direktur?.active_tanda_tangan?.file_url ||
      tandaTanganApprover?.file_url ||
      suratTugas?.approver?.active_tanda_tangan?.file_url ||
      null
    );
  }, [suratTugas, tandaTanganApprover]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Menyiapkan Dokumen Surat Tugas & SPPD Resmi...</p>
      </div>
    );
  }

  if (!suratTugas) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6">
        <p className="text-sm text-slate-600 font-medium">Dokumen Surat Tugas tidak ditemukan.</p>
        <Link href={`/simpeg/surat-tugas/${suratTugasId}`}>
          <Button variant="outline" size="md">
            <ArrowLeft size={16} className="mr-1.5" />
            Kembali ke Rincian
          </Button>
        </Link>
      </div>
    );
  }

  if (!isPanjarApprovedByPegawai) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6">
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-6 max-w-lg text-center space-y-3">
          <p className="font-bold text-sm">Dokumen & SPPD Belum Dapat Dicetak</p>
          <p className="text-xs text-amber-700 leading-relaxed">
            Pencetakan surat tugas dan SPPD resmi hanya dapat dilakukan setelah pegawai menyetujui nominal panjar kedinasan di sistem SIKEU.
          </p>
          <div className="pt-2">
            <Link href={`/simpeg/surat-tugas/${suratTugasId}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft size={16} className="mr-1.5" />
                Kembali ke Rincian Surat Tugas
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isMenungguArsip = suratTugas.nomor_surat?.startsWith('MENUNGGU ARSIP');

  // Penyelenggara kegiatan
  const namaPenyelenggara = suratTugas.penyelenggara?.trim() || suratTugas.keterangan?.trim() || '-';

  return (
    <div className="surat-outer-container w-full flex flex-col items-center gap-6 p-4 md:p-8 max-w-6xl mx-auto">
      {/* Top Action Bar (Hidden when Printing) */}
      <div className="print-action-bar print:hidden w-full max-w-[210mm] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link href={`/simpeg/surat-tugas/${suratTugasId}`}>
            <Button variant="outline" size="sm" className="border-slate-300 text-slate-700 hover:bg-slate-100">
              <ArrowLeft size={16} className="mr-1.5" />
              Kembali
            </Button>
          </Link>
          <div>
            <h1 className="text-base font-bold text-slate-900">Format Cetak Surat Tugas & SPPD (A4)</h1>
            <p className="text-xs text-slate-500">
              Nomor:{' '}
              <span className={`font-mono font-bold ${isMenungguArsip ? 'text-amber-600' : 'text-slate-900'}`}>
                {suratTugas.nomor_surat || 'Belum Ada Nomor'}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isMenungguArsip ? (
            <Badge variant="warning" className="text-2xs">
              Menunggu Pengesahan ARSIP
            </Badge>
          ) : (
            <Badge variant="success" className="text-2xs">
              Bernomor Resmi ARSIP
            </Badge>
          )}

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          >
            <Printer size={16} className="mr-1.5" />
            Cetak / Simpan PDF
          </Button>
        </div>
      </div>

      {/* Style CSS cetak khusus per halaman A4 dan page-break */}
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 0 !important;
        }
        @media screen {
          .a4-page-sheet {
            width: 210mm;
            min-height: 297mm;
            max-width: 100%;
            margin: 0 auto 2rem auto;
            padding: 14mm 20mm;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
            background: #ffffff;
            box-sizing: border-box;
          }
        }
        @media print {
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 210mm !important;
            height: 100% !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .print-action-bar,
          .print-hidden-element,
          [class*="print:hidden"] {
            display: none !important;
            visibility: hidden !important;
          }

          .main-layout,
          main,
          .surat-outer-container {
            margin: 0 !important;
            padding: 0 !important;
            gap: 0 !important;
            width: 210mm !important;
            max-width: 210mm !important;
            border: none !important;
            box-shadow: none !important;
            display: block !important;
            background: transparent !important;
          }

          div.printable-document.a4-page-sheet,
          div.print-document.a4-page-sheet,
          div.a4-page-sheet {
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            width: 210mm !important;
            height: 296mm !important;
            max-height: 296mm !important;
            margin: 0 !important;
            padding: 12mm 18mm 12mm 18mm !important;
            border: none !important;
            box-shadow: none !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: always !important;
            break-after: page !important;
          }

          div.printable-document.a4-page-sheet:last-of-type,
          div.print-document.a4-page-sheet:last-of-type,
          div.a4-page-sheet:last-of-type {
            page-break-after: auto !important;
            break-after: auto !important;
          }
        }
      `}</style>

      {/* ========================================================================= */}
      {/* HALAMAN 1: SURAT TUGAS (1 LEMBAR A4)                                      */}
      {/* ========================================================================= */}
      <div className="printable-document print-document a4-page-sheet bg-white text-slate-950 font-serif leading-[1.5] text-[11pt] flex flex-col justify-between">
        <div>
          {/* KOP SURAT RESMI (ARSIP) - LEBAR MENGIKUTI BATAS KANAN & KIRI TEKS SURAT */}
          {kopSurat?.file_url ? (
            <div className="w-full mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={kopSurat.file_url}
                alt="Kop Surat Resmi Kampus"
                className="w-full h-auto block"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-between pb-2 mb-3">
              <div className="w-14 h-14 relative flex-shrink-0 flex items-center justify-center bg-blue-900 text-white rounded font-bold text-sm print:border print:border-black font-sans">
                POLTEK
              </div>
              <div className="flex-1 text-center px-4 font-sans">
                <h3 className="text-2xs font-bold tracking-widest text-slate-700 uppercase">
                  YAYASAN PENDIDIKAN TINGGI SURAKARTA
                </h3>
                <h2 className="text-sm font-extrabold text-slate-950 uppercase tracking-wide">
                  POLITEKNIK INDONUSA SURAKARTA
                </h2>
                <h4 className="text-2xs font-bold text-blue-900 uppercase">
                  DIREKTORAT SUMBER DAYA MANUSIA & TATA KELOLA KAMPUS (SIMPEG)
                </h4>
                <p className="text-[8.5px] text-slate-600 mt-0.5">
                  Jl. KH Samanhudi No. 84-86, Surakarta, Jawa Tengah 57142 | Telp: (0271) 714901
                </p>
              </div>
              <div className="w-14 h-14 flex-shrink-0 flex flex-col items-center justify-center p-1 border border-slate-300 rounded text-center font-sans">
                <ShieldCheck size={20} className="text-blue-800" />
                <span className="text-[7.5px] font-bold text-slate-600">RESMI</span>
              </div>
            </div>
          )}

          {/* JUDUL SURAT (14pt) & NOMOR (12pt) */}
          <div className="text-center my-3">
            <h2 className="text-[14pt] font-bold uppercase underline tracking-wider">
              SURAT TUGAS
            </h2>
            <p className="text-[12pt] font-medium mt-0.5">
              NO :{' '}
              <span className="font-mono font-bold text-[12pt]">
                {suratTugas.nomor_surat || '…………………………………………………'}
              </span>
            </p>
          </div>

          {/* PARAGRAF PEMBERI TUGAS (11pt, Line-spacing 1.5) */}
          <div className="space-y-2.5 my-3 leading-[1.5] text-[11pt]">
            <p>Yang bertanda tangan dibawah ini, Direktur Politeknik Indonusa Surakarta :</p>
            <table className="w-full border-collapse ml-4 text-[11pt] leading-[1.5]">
              <tbody>
                <tr>
                  <td className="w-36 align-top py-0.5">Nama</td>
                  <td className="w-4 align-top py-0.5">:</td>
                  <td className="align-top py-0.5 font-semibold">{pimpinanNama}</td>
                </tr>
                <tr>
                  <td className="w-36 align-top py-0.5">Jabatan</td>
                  <td className="w-4 align-top py-0.5">:</td>
                  <td className="align-top py-0.5">Direktur</td>
                </tr>
                <tr>
                  <td className="w-36 align-top py-0.5">Instansi</td>
                  <td className="w-4 align-top py-0.5">:</td>
                  <td className="align-top py-0.5">Politeknik Indonusa Surakarta</td>
                </tr>
              </tbody>
            </table>

            {/* PARAGRAF PENERIMA TUGAS (11pt, Line-spacing 1.5) */}
            <p className="pt-1">Memberikan tugas kepada :</p>
            <table className="w-full border-collapse ml-4 text-[11pt] leading-[1.5]">
              <tbody>
                <tr>
                  <td className="w-36 align-top py-0.5">Nama</td>
                  <td className="w-4 align-top py-0.5">:</td>
                  <td className="align-top py-0.5">
                    <div className="space-y-0.5">
                      <p className="font-semibold">{suratTugas.pegawai?.nama_lengkap || '-'}</p>
                      {suratTugas.anggota &&
                        suratTugas.anggota.map((ang, idx) => (
                          <p key={ang.id || idx}>
                            {ang.pegawai?.nama_lengkap || '-'}
                          </p>
                        ))}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="w-36 align-top py-0.5">Instansi</td>
                  <td className="w-4 align-top py-0.5">:</td>
                  <td className="align-top py-0.5">Politeknik Indonusa Surakarta</td>
                </tr>
                <tr>
                  <td className="w-36 align-top py-0.5">Keperluan</td>
                  <td className="w-4 align-top py-0.5">:</td>
                  <td className="align-top py-0.5">{suratTugas.nama_kegiatan}</td>
                </tr>
                <tr>
                  <td className="w-36 align-top py-0.5">Hari / Tanggal</td>
                  <td className="w-4 align-top py-0.5">:</td>
                  <td className="align-top py-0.5">{formattedHariTanggalAcara}</td>
                </tr>
                <tr>
                  <td className="w-36 align-top py-0.5">Tempat</td>
                  <td className="w-4 align-top py-0.5">:</td>
                  <td className="align-top py-0.5">{suratTugas.lokasi_tujuan}</td>
                </tr>
                <tr>
                  <td className="w-36 align-top py-0.5">Pukul</td>
                  <td className="w-4 align-top py-0.5">:</td>
                  <td className="align-top py-0.5">{suratTugas.jam_pelaksanaan || '08.00 WIB - Selesai'}</td>
                </tr>
                <tr>
                  <td className="w-36 align-top py-0.5">Penyelenggara</td>
                  <td className="w-4 align-top py-0.5">:</td>
                  <td className="align-top py-0.5">{namaPenyelenggara}</td>
                </tr>
              </tbody>
            </table>

            {/* PARAGRAF PENUTUP (11pt, Line-spacing 1.5) */}
            <p className="pt-1.5 text-justify">
              Demikian surat tugas ini dibuat untuk dapat dipergunakan dan dilaksanakan sebagaimana mestinya.
            </p>
          </div>
        </div>

        {/* AREA TANDA TANGAN (2 KOLOM: MITRA DI KIRI & DIREKTUR DI KANAN) */}
        <div className="mt-4 pt-1">
          <div className="grid grid-cols-2 gap-8 text-[11pt] leading-[1.5]">
            {/* SISI KIRI: PIMPINAN MITRA (DIKOSONGKAN NAMA SESUAI PERMINTAAN USER) */}
            <div className="flex flex-col justify-between min-h-[135px] text-center">
              <div>
                <p className="font-semibold text-[11pt]">
                  {namaPenyelenggara !== '-' ? namaPenyelenggara : 'Penyelenggara / Mitra'}
                </p>
                <p className="text-transparent select-none text-2xs">&nbsp;</p>
              </div>
              <div className="pt-8">
                <p className="border-b border-black w-44 mx-auto font-medium">&nbsp;</p>
                <p className="text-[10pt] text-slate-600 italic mt-0.5">(Tanda tangan &amp; Cap Mitra)</p>
              </div>
            </div>

            {/* SISI KANAN: DIREKTUR KAMPUS POLITEKNIK INDONUSA SURAKARTA */}
            <div className="flex flex-col justify-between min-h-[135px] text-center">
              <div className="text-[10pt]">
                <p>Surakarta, {formattedTanggalTerbit}</p>
                <p>Mengetahui,</p>
                <p className="font-semibold text-[10pt]">Direktur</p>
              </div>

              {/* Tanda Tangan Digital dari master SIMPEG */}
              <div className="h-14 flex items-center justify-center my-0.5">
                {pimpinanTtdUrl ? (
                  <div className="relative w-32 h-14">
                    <Image
                      src={pimpinanTtdUrl}
                      alt="Tanda Tangan Direktur"
                      width={128}
                      height={56}
                      className="max-h-full max-w-full object-contain mx-auto"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="h-12 flex items-center justify-center">
                    <span className="text-xs text-slate-400 italic">[ Tanda Tangan Direktur ]</span>
                  </div>
                )}
              </div>

              <div>
                <p className="font-bold underline text-[11pt]">{pimpinanNama}</p>
                <p className="text-[10pt]">NIK. {pimpinanNik}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* HALAMAN 2: SURAT PERINTAH PERJALANAN DINAS (SPPD) (1 LEMBAR A4)           */}
      {/* ========================================================================= */}
      <div className="printable-document print-document a4-page-sheet bg-white text-slate-950 font-serif leading-[1.5] text-[11pt] flex flex-col justify-between">
        <div>
          {/* KOP SURAT RESMI (ARSIP) - LEBAR MENGIKUTI BATAS KANAN & KIRI TEKS SURAT */}
          {kopSurat?.file_url ? (
            <div className="w-full mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={kopSurat.file_url}
                alt="Kop Surat Resmi Kampus"
                className="w-full h-auto block"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-between pb-2 mb-3">
              <div className="w-14 h-14 relative flex-shrink-0 flex items-center justify-center bg-blue-900 text-white rounded font-bold text-sm print:border print:border-black font-sans">
                POLTEK
              </div>
              <div className="flex-1 text-center px-4 font-sans">
                <h3 className="text-2xs font-bold tracking-widest text-slate-700 uppercase">
                  YAYASAN PENDIDIKAN TINGGI SURAKARTA
                </h3>
                <h2 className="text-sm font-extrabold text-slate-950 uppercase tracking-wide">
                  POLITEKNIK INDONUSA SURAKARTA
                </h2>
                <h4 className="text-2xs font-bold text-blue-900 uppercase">
                  DIREKTORAT SUMBER DAYA MANUSIA & TATA KELOLA KAMPUS (SIMPEG)
                </h4>
                <p className="text-[8.5px] text-slate-600 mt-0.5">
                  Jl. KH Samanhudi No. 84-86, Surakarta, Jawa Tengah 57142 | Telp: (0271) 714901
                </p>
              </div>
              <div className="w-14 h-14 flex-shrink-0 flex flex-col items-center justify-center p-1 border border-slate-300 rounded text-center font-sans">
                <ShieldCheck size={20} className="text-blue-800" />
                <span className="text-[7.5px] font-bold text-slate-600">RESMI</span>
              </div>
            </div>
          )}

          {/* JUDUL SPPD (14pt) & NOMOR (12pt) */}
          <div className="text-center my-3">
            <h2 className="text-[14pt] font-bold uppercase underline tracking-wider">
              SURAT PERINTAH PERJALANAN DINAS
            </h2>
            <p className="text-[12pt] font-medium mt-0.5">
              NO :{' '}
              <span className="font-mono font-bold text-[12pt]">
                {suratTugas.nomor_surat || '…………………………………………………'}
              </span>
            </p>
          </div>

          {/* TABEL DIBERIKAN KEPADA (11pt, Line-spacing 1.5) */}
          <div className="space-y-2.5 my-3 leading-[1.5] text-[11pt]">
            <p>Diberikan kepada :</p>
            <table className="w-full border-collapse ml-4 text-[11pt] leading-[1.5]">
              <tbody>
                <tr>
                  <td className="w-44 align-top py-0.5">Nama</td>
                  <td className="w-4 align-top py-0.5">:</td>
                  <td className="align-top py-0.5 font-semibold">
                    {suratTugas.pegawai?.nama_lengkap || '-'}
                  </td>
                </tr>
                <tr>
                  <td className="w-44 align-top py-0.5">Instansi</td>
                  <td className="w-4 align-top py-0.5">:</td>
                  <td className="align-top py-0.5">Politeknik Indonusa Surakarta</td>
                </tr>
                <tr>
                  <td className="w-44 align-top py-0.5">Keperluan</td>
                  <td className="w-4 align-top py-0.5">:</td>
                  <td className="align-top py-0.5">
                    {suratTugas.nama_kegiatan}
                  </td>
                </tr>
                <tr>
                  <td className="w-44 align-top py-0.5">Hari / Tanggal</td>
                  <td className="w-4 align-top py-0.5">:</td>
                  <td className="align-top py-0.5">{formattedHariTanggalAcara}</td>
                </tr>
                <tr>
                  <td className="w-44 align-top py-0.5">Tempat</td>
                  <td className="w-4 align-top py-0.5">:</td>
                  <td className="align-top py-0.5">{suratTugas.lokasi_tujuan}</td>
                </tr>
                <tr>
                  <td className="w-44 align-top py-0.5">Pukul</td>
                  <td className="w-4 align-top py-0.5">:</td>
                  <td className="align-top py-0.5">{suratTugas.jam_pelaksanaan || '08.00 WIB - Selesai'}</td>
                </tr>
                <tr>
                  <td className="w-44 align-top py-0.5">Penyelenggara</td>
                  <td className="w-4 align-top py-0.5">:</td>
                  <td className="align-top py-0.5">{namaPenyelenggara}</td>
                </tr>
              </tbody>
            </table>

            {/* KLAUSUL PERJALANAN DINAS (11pt, Line-spacing 1.5) */}
            <p className="pt-1.5 font-medium">Untuk melaksanakan perjalanan dinas :</p>
            <table className="w-full border-collapse ml-4 text-[11pt] leading-[1.5]">
              <tbody>
                <tr>
                  <td className="w-44 align-top py-0.5">Alamat yang dituju</td>
                  <td className="w-4 align-top py-0.5">:</td>
                  <td className="align-top py-0.5">
                    {suratTugas.lokasi_tujuan || '-'}
                  </td>
                </tr>
                <tr>
                  <td className="w-44 align-top py-0.5">Dengan Kendaraan</td>
                  <td className="w-4 align-top py-0.5">:</td>
                  <td className="align-top py-0.5">
                    {suratTugas.jenis_transportasi?.is_kendaraan_kampus
                      ? 'Kantor'
                      : suratTugas.jenis_transportasi?.nama
                      ? suratTugas.jenis_transportasi.nama
                      : 'Kantor / Pribadi'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* BAGIAN BAWAH SPPD: TANDA TANGAN & KETERANGAN */}
        <div>
          {/* AREA TANDA TANGAN (TANDA TANGAN PEMEGANG DI KIRI & DIREKTUR DI KANAN) */}
          <div className="mt-4 pt-1">
            <div className="grid grid-cols-2 gap-8 text-[11pt] leading-[1.5]">
              {/* SISI KIRI: TANDA TANGAN PEMEGANG */}
              <div className="flex flex-col justify-between min-h-[135px] text-center">
                <div>
                  <p className="text-transparent select-none text-2xs">&nbsp;</p>
                  <p className="font-medium text-[10pt]">Tanda Tangan Pemegang</p>
                </div>
                <div className="pt-8">
                  <p className="font-bold underline text-[11pt]">{suratTugas.pegawai?.nama_lengkap || '-'}</p>
                  <p className="text-[10pt] text-transparent select-none">&nbsp;</p>
                </div>
              </div>

              {/* SISI KANAN: DIREKTUR */}
              <div className="flex flex-col justify-between min-h-[135px] text-center">
                <div className="text-[10pt]">
                  <p>Surakarta, {formattedTanggalTerbit}</p>
                  <p className="font-medium text-[10pt]">Direktur</p>
                </div>

                {/* Tanda Tangan Digital dari master SIMPEG */}
                <div className="h-14 flex items-center justify-center my-0.5">
                  {pimpinanTtdUrl ? (
                    <div className="relative w-32 h-14">
                      <Image
                        src={pimpinanTtdUrl}
                        alt="Tanda Tangan Direktur"
                        width={128}
                        height={56}
                        className="max-h-full max-w-full object-contain mx-auto"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="h-12 flex items-center justify-center">
                      <span className="text-xs text-slate-400 italic">[ Tanda Tangan Direktur ]</span>
                    </div>
                  )}
                </div>

                <div>
                  <p className="font-bold underline text-[11pt]">{pimpinanNama}</p>
                  <p className="text-[10pt]">NIK. {pimpinanNik}</p>
                </div>
              </div>
            </div>
          </div>

          {/* KETERANGAN DI BAGIAN BAWAH SPPD (+1pt: Header 10pt, List 8.5pt, Spacing 1.5) */}
          <div className="mt-4 pt-2 border-t border-slate-200 text-[10pt] leading-[1.5] text-slate-700 font-sans space-y-1">
            <p className="font-semibold underline text-[10pt]">Keterangan :</p>
            <ol className="list-decimal list-inside space-y-0.5 text-[8.5pt] text-slate-600 leading-[1.5]">
              <li>Tanda * coret salah satu yang tidak digunakan (apabila ada).</li>
              <li>Surat tugas dan SPPD dilampirkan pada LPJ kegiatan di Sistem Kepegawaian.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
