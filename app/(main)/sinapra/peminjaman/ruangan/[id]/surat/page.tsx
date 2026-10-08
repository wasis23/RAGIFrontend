'use client';

import { useEffect, useState, use, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Printer, ShieldCheck, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { sinapraService } from '@/services/sinapra.service';
import { arsipService } from '@/services/arsip.service';
import { getApiErrorMessage, formatDate } from '@/lib/utils';
import type { SuratPeminjamanRuanganData } from '@/types/sinapra.types';
import type { KopSurat } from '@/types/arsip.types';

export default function CetakSuratPeminjamanRuanganPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const peminjamanId = Number(resolvedParams.id);

  const [loading, setLoading] = useState(true);
  const [surat, setSurat] = useState<SuratPeminjamanRuanganData | null>(null);
  const [kopSurat, setKopSurat] = useState<KopSurat | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const resSurat = await sinapraService.getSuratPeminjamanRuangan(peminjamanId);
        const data = resSurat.data || null;
        setSurat(data);

        if (data) {
          // Ambil Kop Surat aktif dari modul ARSIP sesuai tahun surat
          const tahun = data.tanggal
            ? new Date(data.tanggal).getFullYear()
            : new Date().getFullYear();

          try {
            const resKop = await arsipService.getKopSuratByYear(tahun);
            if (resKop.data) {
              setKopSurat(resKop.data);
            }
          } catch (e) {
            console.warn('Kop surat ARSIP tidak ditemukan, menggunakan kop fallback:', e);
          }
        }
      } catch (err: any) {
        toast.error(getApiErrorMessage(err, 'Gagal memuat dokumen surat peminjaman ruangan.'));
      } finally {
        setLoading(false);
      }
    };

    if (peminjamanId) {
      fetchData();
    }
  }, [peminjamanId]);

  const handlePrint = () => {
    const originalTitle = document.title;
    if (surat?.nomor_surat) {
      document.title = `Surat-Izin-Peminjaman-Ruangan-${surat.nomor_surat.replace(/[\/\\]/g, '_')}`;
    } else {
      document.title = 'Surat-Izin-Peminjaman-Ruangan';
    }
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  // Helper format hari/tanggal pemakaian
  const formattedHariTanggal = useMemo(() => {
    if (!surat?.tanggal) return '-';
    const d = new Date(surat.tanggal);
    const namaHari = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(d);
    return `${namaHari}, ${formatDate(surat.tanggal)}`;
  }, [surat]);

  // Tanggal terbit surat
  const formattedTanggalTerbit = useMemo(() => {
    if (!surat) return '';
    const dateSource = surat.surat_generated_at || surat.tanggal || new Date().toISOString();
    return formatDate(dateSource);
  }, [surat]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-[var(--module-primary)] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Menyiapkan Dokumen Surat Izin Peminjaman Ruangan Resmi...</p>
      </div>
    );
  }

  if (!surat) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6">
        <p className="text-sm text-slate-600 font-medium">Dokumen Surat Peminjaman Ruangan tidak ditemukan atau belum disetujui.</p>
        <Link href={`/sinapra/peminjaman/ruangan/${peminjamanId}`}>
          <Button variant="outline" size="md">
            <ArrowLeft size={16} className="mr-1.5" />
            Kembali ke Rincian
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="surat-outer-container w-full flex flex-col items-center gap-6 p-4 md:p-8 max-w-6xl mx-auto">
      {/* Top Action Bar (Hidden when Printing) */}
      <div className="print-action-bar print:hidden w-full max-w-[210mm] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link href={`/sinapra/peminjaman/ruangan/${peminjamanId}`}>
            <Button variant="outline" size="sm" className="border-slate-300 text-slate-700 hover:bg-slate-100">
              <ArrowLeft size={16} className="mr-1.5" />
              Kembali
            </Button>
          </Link>
          <div>
            <h1 className="text-base font-bold text-slate-900">Format Cetak Surat Peminjaman Ruangan (A4)</h1>
            <p className="text-xs text-slate-500">
              Nomor: <span className="font-mono font-bold text-slate-900">{surat.nomor_surat}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={
              surat.status === 'disetujui' || surat.status === 'selesai'
                ? 'success'
                : 'warning'
            }
            className="text-2xs capitalize"
          >
            {surat.status}
          </Badge>

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handlePrint}
          >
            <Printer size={16} className="mr-1.5" />
            Cetak / Simpan PDF
          </Button>
        </div>
      </div>

      {/* Style CSS cetak khusus per halaman A4 dan page-break standar SIMPEG */}
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
            padding: 12mm 18mm;
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
        }
      `}</style>

      {/* ========================================================================= */}
      {/* HALAMAN 1: SURAT IZIN PEMINJAMAN RUANGAN (1 LEMBAR A4)                     */}
      {/* ========================================================================= */}
      <div className="printable-document print-document a4-page-sheet bg-white text-slate-950 font-serif leading-[1.45] text-[10.5pt] flex flex-col justify-between">
        <div>
          {/* KOP SURAT RESMI (ARSIP) ATAU FALLBACK RESMI KAMPUS */}
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
            <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-black">
              <div className="w-14 h-14 relative flex-shrink-0 flex items-center justify-center bg-[var(--module-primary)] text-white rounded font-bold text-sm print:border print:border-black font-sans">
                POLTEK
              </div>
              <div className="flex-1 text-center px-4 font-sans">
                <h3 className="text-2xs font-bold tracking-widest text-slate-700 uppercase">
                  YAYASAN PENDIDIKAN TINGGI SURAKARTA
                </h3>
                <h2 className="text-sm font-extrabold text-slate-950 uppercase tracking-wide">
                  POLITEKNIK INDONUSA SURAKARTA
                </h2>
                <h4 className="text-2xs font-bold text-[var(--module-primary)] uppercase">
                  DIREKTORAT PENGELOLAAN SARANA, PRASARANA & ASET KAMPUS (SINAPRA)
                </h4>
                <p className="text-[8.5px] text-slate-600 mt-0.5">
                  Jl. KH Samanhudi No. 84-86, Surakarta, Jawa Tengah 57142 | Telp: (0271) 714901
                </p>
              </div>
              <div className="w-14 h-14 flex-shrink-0 flex flex-col items-center justify-center p-1 border border-slate-300 rounded text-center font-sans">
                <ShieldCheck size={20} className="text-[var(--module-primary)]" />
                <span className="text-[7.5px] font-bold text-slate-600">RESMI</span>
              </div>
            </div>
          )}

          {/* JUDUL SURAT (13pt) & NOMOR (11pt) */}
          <div className="text-center my-2.5">
            <h2 className="text-[13pt] font-bold uppercase underline tracking-wider">
              SURAT BUKTI & IZIN PEMINJAMAN RUANGAN
            </h2>
            <p className="text-[11pt] font-medium mt-0.5">
              NOMOR : <span className="font-mono font-bold">{surat.nomor_surat || '…………………………………………………'}</span>
            </p>
          </div>

          {/* PENGANTAR */}
          <p className="text-justify text-[10.5pt] mb-2 leading-[1.45]">
            Berdasarkan permohonan peminjaman ruangan yang telah diajukan melalui Sistem Informasi Sarana Prasarana (SINAPRA) serta telah disetujui oleh pejabat yang berwenang, dengan ini diberikan izin pemakaian fasilitas ruangan kampus kepada:
          </p>

          {/* TABEL DATA PEMINJAM */}
          <table className="w-full border-collapse ml-2 text-[10.5pt] leading-[1.45] mb-2">
            <tbody>
              <tr>
                <td className="w-40 align-top py-0.5 font-medium">Nama Peminjam</td>
                <td className="w-4 align-top py-0.5">:</td>
                <td className="align-top py-0.5 font-semibold">{surat.peminjam.nama}</td>
              </tr>
              <tr>
                <td className="w-40 align-top py-0.5 font-medium">Nomor Identitas (NIM/NIP)</td>
                <td className="w-4 align-top py-0.5">:</td>
                <td className="align-top py-0.5 font-mono">{surat.peminjam.nomor_identitas}</td>
              </tr>
              <tr>
                <td className="w-40 align-top py-0.5 font-medium">Unit Kerja / Program Studi</td>
                <td className="w-4 align-top py-0.5">:</td>
                <td className="align-top py-0.5">{surat.peminjam.unit_kerja}</td>
              </tr>
              <tr>
                <td className="w-40 align-top py-0.5 font-medium">Kontak / No. Handphone</td>
                <td className="w-4 align-top py-0.5">:</td>
                <td className="align-top py-0.5">{surat.peminjam.kontak || '-'}</td>
              </tr>
              <tr>
                <td className="w-40 align-top py-0.5 font-medium">Keperluan Pemakaian</td>
                <td className="w-4 align-top py-0.5">:</td>
                <td className="align-top py-0.5 font-semibold text-slate-900">{surat.keperluan}</td>
              </tr>
            </tbody>
          </table>

          {/* RINCIAN RUANGAN & FASILITAS */}
          <div className="mt-3">
            <p className="font-semibold text-[10.5pt] mb-1">
              Rincian Ruangan dan Waktu Penggunaan Fasilitas :
            </p>
            <table className="w-full border-collapse border border-black text-[10pt] leading-tight mb-2">
              <tbody>
                <tr className="border-b border-black">
                  <td className="border-r border-black p-1.5 w-1/3 bg-slate-50 font-medium">Nama Ruangan & Kode</td>
                  <td className="p-1.5 font-semibold">
                    {surat.ruangan.nama} <span className="font-mono text-[9pt] font-normal">({surat.ruangan.kode || '-'})</span>
                  </td>
                </tr>
                <tr className="border-b border-black">
                  <td className="border-r border-black p-1.5 bg-slate-50 font-medium">Lokasi Gedung / Lantai</td>
                  <td className="p-1.5">
                    {surat.ruangan.gedung || '-'} — Lantai {surat.ruangan.lantai || 1} ({surat.ruangan.tipe_ruangan || 'Umum'})
                  </td>
                </tr>
                <tr className="border-b border-black">
                  <td className="border-r border-black p-1.5 bg-slate-50 font-medium">Hari / Tanggal Pemakaian</td>
                  <td className="p-1.5 font-semibold">{formattedHariTanggal}</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="border-r border-black p-1.5 bg-slate-50 font-medium">Waktu Penggunaan</td>
                  <td className="p-1.5 font-semibold">
                    Pukul {surat.jam_mulai?.substring(0, 5)} s.d. {surat.jam_selesai?.substring(0, 5)} WIB
                  </td>
                </tr>
                <tr>
                  <td className="border-r border-black p-1.5 bg-slate-50 font-medium">Fasilitas Standar Tersedia</td>
                  <td className="p-1.5 text-[9.5pt]">
                    Kapasitas: {surat.ruangan.kapasitas || '-'} Orang | AC: {surat.ruangan.ada_ac ? 'Tersedia' : 'Tidak'} | Proyektor: {surat.ruangan.ada_proyektor ? 'Tersedia' : 'Tidak'} | Wi-Fi: {surat.ruangan.ada_wifi ? 'Tersedia' : 'Tidak'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* PAKTA INTEGRITAS & TANGGUNG JAWAB PEMINJAM */}
          <div className="mt-2.5 p-2 bg-slate-50/70 border border-slate-300 rounded text-[8.5pt] leading-normal font-sans">
            <p className="font-bold text-slate-900 uppercase mb-0.5">Ketentuan & Tanggung Jawab Peminjam (Pakta Integritas):</p>
            <ol className="list-decimal pl-4 space-y-0.5 text-slate-700">
              <li>Peminjam wajib menjaga kebersihan, ketertiban, dan keutuhan seluruh fasilitas serta peralatan di dalam ruangan.</li>
              <li>Ruangan hanya digunakan untuk kegiatan sesuai dengan keperluan yang diajukan dalam izin ini.</li>
              <li>Mematikan AC, proyektor, lampu, dan mengunci pintu kembali setelah kegiatan selesai dilaksanakan.</li>
              <li>Segala bentuk kerusakan fasilitas akibat kelalaian peminjam menjadi tanggung jawab penuh peminjam untuk memperbaiki/mengganti.</li>
            </ol>
          </div>

          {/* PARAGRAF PENUTUP */}
          <p className="pt-2 text-justify text-[10.5pt] leading-[1.45]">
            Demikian surat izin dan bukti peminjaman ruangan ini diterbitkan untuk dipergunakan sebagaimana mestinya dan ditunjukkan kepada petugas sarpras/keamanan yang bertugas di lokasi.
          </p>
        </div>

        {/* AREA TANDA TANGAN (2 ATAU 3 KOLOM: PEMINJAM DI KIRI, LABORAN JIKA ADA DI TENGAH, APPROVER/ADMIN DI KANAN) */}
        <div className="mt-2 pt-1 border-t border-slate-200">
          <div className="flex justify-end mb-2 text-[9pt]">
            <p>Surakarta, {formattedTanggalTerbit}</p>
          </div>

          <div className={`grid ${surat.laboran ? 'grid-cols-3' : 'grid-cols-2'} gap-4 text-center text-[10pt] leading-[1.4]`}>
            {/* SISI KIRI: PEMINJAM */}
            <div className="flex flex-col justify-between min-h-[140px] text-center">
              <div>
                <p className="font-medium">Pihak Peminjam,</p>
                <p className="text-[8.5pt] text-slate-500">{surat.peminjam.unit_kerja}</p>
              </div>

              {/* Tanda Tangan Digital Peminjam jika ada */}
              <div className="h-14 flex items-center justify-center my-0.5">
                {surat.peminjam.tanda_tangan_url ? (
                  <div className="relative w-28 h-14">
                    <Image
                      src={surat.peminjam.tanda_tangan_url}
                      alt="Tanda Tangan Peminjam"
                      width={112}
                      height={56}
                      className="max-h-full max-w-full object-contain mx-auto"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="h-12 flex items-center justify-center">
                    <span className="text-[8pt] text-slate-400 italic">[ Tanda Tangan Peminjam ]</span>
                  </div>
                )}
              </div>

              <div>
                <p className="font-bold underline text-[10pt]">{surat.peminjam.nama}</p>
                <p className="text-[8.5pt] text-slate-600 font-mono">ID: {surat.peminjam.nomor_identitas}</p>
              </div>
            </div>

            {/* SISI TENGAH: LABORAN (JIKA RUANGAN LABORATORIUM) */}
            {surat.laboran && (
              <div className="flex flex-col justify-between min-h-[140px] text-center">
                <div>
                  <p className="font-medium">Laboran Ruangan,</p>
                  <p className="text-[8.5pt] text-slate-500">Verifikator Laboratorium</p>
                </div>

                <div className="h-14 flex items-center justify-center my-0.5">
                  {surat.laboran.tanda_tangan_url ? (
                    <div className="relative w-28 h-14">
                      <Image
                        src={surat.laboran.tanda_tangan_url}
                        alt="Tanda Tangan Laboran"
                        width={112}
                        height={56}
                        className="max-h-full max-w-full object-contain mx-auto"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="h-12 flex items-center justify-center">
                      <span className="text-[8pt] text-slate-400 italic">[ Tanda Tangan Laboran ]</span>
                    </div>
                  )}
                </div>

                <div>
                  <p className="font-bold underline text-[10pt]">{surat.laboran.nama}</p>
                  <p className="text-[8.5pt] text-slate-600 font-mono">NIP: {surat.laboran.nip || '-'}</p>
                </div>
              </div>
            )}

            {/* SISI KANAN: APPROVER / ADMIN SARPRAS */}
            <div className="flex flex-col justify-between min-h-[140px] text-center">
              <div>
                <p className="font-medium">Mengetahui &amp; Menyetujui,</p>
                <p className="text-[8.5pt] font-semibold text-slate-800">Bagian Pengelolaan Sarana Prasarana</p>
              </div>

              {/* Tanda Tangan Digital Approver dari master SIMPEG */}
              <div className="h-14 flex items-center justify-center my-0.5">
                {surat.approver?.tanda_tangan_url ? (
                  <div className="relative w-28 h-14">
                    <Image
                      src={surat.approver.tanda_tangan_url}
                      alt="Tanda Tangan Approver"
                      width={112}
                      height={56}
                      className="max-h-full max-w-full object-contain mx-auto"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="h-12 flex items-center justify-center">
                    <span className="text-[8pt] text-slate-400 italic">[ Tanda Tangan Approver ]</span>
                  </div>
                )}
              </div>

              <div>
                <p className="font-bold underline text-[10pt]">{surat.approver?.nama || 'Admin Sarpras & SIPPM'}</p>
                <p className="text-[8.5pt] text-slate-600 font-mono">NIP: {surat.approver?.nip || '-'}</p>
              </div>
            </div>
          </div>

          {/* DIGITAL SIGNATURE / VERIFIKASI QR CODE FOOTER */}
          <div className="mt-3 pt-1 border-t border-dotted border-slate-300 flex items-center justify-between text-[7.5pt] text-slate-500 font-sans">
            <div className="flex items-center gap-1.5">
              <QrCode size={16} className="text-slate-700" />
              <span>Dokumen ini resmi diterbitkan secara elektronik oleh Sistem Informasi SINAPRA Kampus.</span>
            </div>
            <div className="font-mono text-slate-400 truncate max-w-[240px]">
              SHA256: {surat.verifikasi_token?.substring(0, 24)}...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
