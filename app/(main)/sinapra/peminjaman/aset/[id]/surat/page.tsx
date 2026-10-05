'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Printer, ShieldCheck, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { sinapraService } from '@/services/sinapra.service';
import { getApiErrorMessage } from '@/lib/utils';
import type { SuratPeminjamanAsetData } from '@/types/sinapra.types';

export default function SuratPeminjamanAsetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const peminjamanId = Number(resolvedParams.id);

  const [loading, setLoading] = useState(true);
  const [surat, setSurat] = useState<SuratPeminjamanAsetData | null>(null);

  useEffect(() => {
    const fetchSurat = async () => {
      try {
        setLoading(true);
        const res = await sinapraService.getSuratPeminjamanAset(peminjamanId);
        setSurat(res.data || null);
      } catch (err: any) {
        toast.error(getApiErrorMessage(err, 'Gagal memuat surat peminjaman aset.'));
      } finally {
        setLoading(false);
      }
    };

    if (peminjamanId) {
      fetchSurat();
    }
  }, [peminjamanId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Memuat Surat Peminjaman Resmi...</p>
      </div>
    );
  }

  if (!surat) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6">
        <p className="text-sm text-slate-600 font-medium">Surat peminjaman tidak ditemukan atau belum disetujui.</p>
        <Link href={`/sinapra/peminjaman/aset/${peminjamanId}`}>
          <Button variant="outline" size="md">
            <ArrowLeft size={16} className="mr-1.5" />
            Kembali ke Detail Peminjaman
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6 p-4 md:p-8 max-w-5xl mx-auto">
      {/* Top Action Bar (Hidden when Printing) */}
      <div className="print:hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link href={`/sinapra/peminjaman/aset/${peminjamanId}`}>
            <Button variant="outline" size="sm" className="border-slate-300 text-slate-700 hover:bg-slate-100">
              <ArrowLeft size={16} className="mr-1.5" />
              Kembali
            </Button>
          </Link>
          <div>
            <h1 className="text-base font-bold text-slate-900">Surat Peminjaman Resmi</h1>
            <p className="text-xs text-slate-500">Nomor: {surat.nomor_surat}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={
              surat.status === 'kembali'
                ? 'gray'
                : surat.status === 'disetujui' || surat.status === 'dipinjam'
                ? 'success'
                : 'warning'
            }
            className="capitalize"
          >
            {surat.status}
          </Badge>
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

      {/* Official Document Container (A4 Printable Layout) */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 md:p-12 print:p-0 print:border-none print:shadow-none text-slate-900 font-serif leading-relaxed">
        {/* KOP SURAT RESMI */}
        <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-6">
          <div className="w-20 h-20 relative flex-shrink-0 flex items-center justify-center bg-blue-900 text-white rounded-lg font-bold text-xl print:border print:border-black">
            POLTEK
          </div>
          <div className="flex-1 text-center px-4">
            <h3 className="text-xs font-sans font-bold tracking-widest text-slate-700 uppercase">
              YAYASAN PENDIDIKAN TINGGI SURAKARTA
            </h3>
            <h2 className="text-lg md:text-xl font-sans font-extrabold text-slate-950 uppercase tracking-wide">
              POLITEKNIK INDONUSA SURAKARTA
            </h2>
            <h4 className="text-xs font-sans font-bold text-blue-900 uppercase">
              DIREKTORAT PENGELOLAAN SARANA, PRASARANA & ASET KAMPUS (SINAPRA)
            </h4>
            <p className="text-2xs font-sans text-slate-600 mt-1">
              Jl. KH Samanhudi No. 84-86, Surakarta, Jawa Tengah 57142 | Telp: (0271) 714901 | Email: sarpras@poltekindonusa.ac.id
            </p>
          </div>
          <div className="w-20 h-20 flex-shrink-0 flex flex-col items-center justify-center p-1 border border-slate-300 rounded text-center">
            <ShieldCheck size={28} className="text-blue-800" />
            <span className="text-[9px] font-sans font-bold text-slate-600 mt-0.5">RESMI</span>
          </div>
        </div>

        {/* JUDUL SURAT */}
        <div className="text-center my-4">
          <h2 className="text-sm md:text-base font-sans font-extrabold uppercase underline tracking-wider">
            SURAT IZIN PEMINJAMAN SARANA DAN PRASARANA / ASET KAMPUS
          </h2>
          <p className="text-xs font-sans font-medium text-slate-700 mt-1">
            Nomor: <span className="font-semibold">{surat.nomor_surat}</span>
          </p>
        </div>

        {/* PARAGRAF PENGANTAR */}
        <p className="text-xs text-justify mb-4 font-sans">
          Berdasarkan permohonan peminjaman sarana dan prasarana kampus yang telah diajukan melalui Sistem Informasi SINAPRA, Direktorat Sarana dan Prasarana memberikan izin penggunaan fasilitas/barang inventaris kepada:
        </p>

        {/* IDENTITAS PEMINJAM */}
        <div className="bg-slate-50 border border-slate-200 rounded p-4 mb-5 text-xs font-sans">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4">
            <div className="flex">
              <span className="w-36 text-slate-500 flex-shrink-0">Nama Peminjam</span>
              <span className="font-bold text-slate-900">: {surat.peminjam.nama}</span>
            </div>
            <div className="flex">
              <span className="w-36 text-slate-500 flex-shrink-0">Nomor Identitas (NIM/NIP)</span>
              <span className="font-semibold text-slate-900">: {surat.peminjam.nomor_identitas}</span>
            </div>
            <div className="flex">
              <span className="w-36 text-slate-500 flex-shrink-0">Unit Kerja / Program Studi</span>
              <span className="text-slate-800">: {surat.peminjam.unit_kerja}</span>
            </div>
            <div className="flex">
              <span className="w-36 text-slate-500 flex-shrink-0">Kontak / No. Telepon</span>
              <span className="text-slate-800">: {surat.peminjam.kontak || '-'}</span>
            </div>
            <div className="flex">
              <span className="w-36 text-slate-500 flex-shrink-0">Waktu Peminjaman</span>
              <span className="font-semibold text-slate-800">
                : {surat.tanggal_pinjam} s.d. {surat.tanggal_kembali_rencana}
              </span>
            </div>
            <div className="flex">
              <span className="w-36 text-slate-500 flex-shrink-0">Keperluan</span>
              <span className="text-slate-800">: {surat.keperluan}</span>
            </div>
          </div>
        </div>

        {/* DAFTAR BARANG YANG DIPINJAM */}
        <div className="mb-5 font-sans">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
            Rincian Barang / Peralatan Inventaris yang Dipinjam:
          </h4>
          <table className="w-full text-xs border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-slate-800 border-b border-slate-300">
                <th className="border border-slate-300 px-2 py-1.5 text-center w-10">No</th>
                <th className="border border-slate-300 px-3 py-1.5 text-left">Kode Aset</th>
                <th className="border border-slate-300 px-3 py-1.5 text-left">Nama Peralatan / Barang</th>
                <th className="border border-slate-300 px-3 py-1.5 text-left">Merk / Spesifikasi</th>
                <th className="border border-slate-300 px-3 py-1.5 text-left">Lokasi Ruangan Asal</th>
                <th className="border border-slate-300 px-3 py-1.5 text-center w-24">Kondisi Awal</th>
              </tr>
            </thead>
            <tbody>
              {surat.daftar_barang.map((item, idx) => (
                <tr key={item.aset_id || idx} className="border-b border-slate-200">
                  <td className="border border-slate-300 px-2 py-1.5 text-center">{idx + 1}</td>
                  <td className="border border-slate-300 px-3 py-1.5 font-mono text-2xs font-semibold">{item.kode_aset}</td>
                  <td className="border border-slate-300 px-3 py-1.5 font-medium">{item.nama_barang}</td>
                  <td className="border border-slate-300 px-3 py-1.5 text-slate-600">{item.merk || item.nomor_seri || '-'}</td>
                  <td className="border border-slate-300 px-3 py-1.5 text-slate-600">{item.lokasi_ruangan} ({item.gedung})</td>
                  <td className="border border-slate-300 px-3 py-1.5 text-center capitalize">{item.kondisi_pinjam}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* KETENTUAN DAN TANGGUNG JAWAB PEMINJAM */}
        <div className="mb-6 font-sans text-2xs text-slate-700 leading-normal border border-slate-200 bg-slate-50/50 rounded p-3">
          <p className="font-bold text-slate-800 uppercase mb-1">Ketentuan & Tanggung Jawab Peminjam (Pakta Integritas):</p>
          <ol className="list-decimal pl-4 space-y-0.5">
            <li>Peminjam wajib menjaga keutuhan, kebersihan, dan fungsi normal dari seluruh peralatan yang dipinjam.</li>
            <li>Peralatan hanya digunakan untuk kegiatan tridharma/akademik resmi sesuai keperluan yang diajukan.</li>
            <li>Dilarang keras memindahtangankan barang pinjaman kepada pihak ketiga tanpa izin resmi dari Bagian Sarpras.</li>
            <li>Barang wajib dikembalikan paling lambat pada tanggal rencana pengembalian dalam kondisi bersih dan lengkap.</li>
            <li>Apabila terjadi kerusakan atau kehilangan barang, peminjam bersedia mengganti perbaikan atau unit barang baru yang setara sesuai regulasi kampus.</li>
          </ol>
        </div>

        {/* TANGGAL DAN PENGESAHAN DENGAN TANDA TANGAN DIGITAL DARI SIMPEG */}
        <div className="font-sans text-xs mt-6">
          <div className="flex justify-end mb-4 text-2xs text-slate-600">
            Surakarta, {surat.surat_generated_at ? surat.surat_generated_at.substring(0, 10) : surat.tanggal_pinjam}
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            {/* Peminjam */}
            <div className="flex flex-col items-center justify-between min-h-[160px] border border-slate-200 rounded p-3 bg-white">
              <span className="font-semibold text-slate-800 text-2xs uppercase">Pihak Peminjam,</span>
              <div className="h-20 flex items-center justify-center my-1">
                {surat.peminjam.tanda_tangan_url ? (
                  <div className="relative w-32 h-16">
                    <Image
                      src={surat.peminjam.tanda_tangan_url}
                      alt="Tanda Tangan Peminjam"
                      width={128}
                      height={64}
                      className="max-h-full max-w-full object-contain mx-auto"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="border border-dashed border-slate-300 rounded px-3 py-2 text-2xs text-slate-400">
                    Tanda Tangan Elektronik
                  </div>
                )}
              </div>
              <div className="border-t border-slate-300 w-full pt-1">
                <p className="font-bold text-slate-900 text-xs">{surat.peminjam.nama}</p>
                <p className="text-slate-500 text-2xs">{surat.peminjam.nomor_identitas}</p>
              </div>
            </div>

            {/* Laboran / Penanggung Jawab Ruangan */}
            <div className="flex flex-col items-center justify-between min-h-[160px] border border-slate-200 rounded p-3 bg-white">
              <span className="font-semibold text-slate-800 text-2xs uppercase">
                {surat.laboran ? 'Laboran / Penanggung Jawab Lab,' : 'Petugas Sarana Prasarana,'}
              </span>
              <div className="h-20 flex items-center justify-center my-1">
                {surat.laboran?.tanda_tangan_url ? (
                  <div className="relative w-32 h-16">
                    <Image
                      src={surat.laboran.tanda_tangan_url}
                      alt="Tanda Tangan Laboran (SIMPEG)"
                      width={128}
                      height={64}
                      className="max-h-full max-w-full object-contain mx-auto"
                      unoptimized
                    />
                  </div>
                ) : surat.laboran ? (
                  <div className="flex flex-col items-center text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                    <CheckCircle size={16} className="mb-0.5" />
                    <span className="text-[10px] font-semibold">Terverifikasi Digital</span>
                    <span className="text-[8px] text-slate-500 font-mono">SIMPEG Verified</span>
                  </div>
                ) : (
                  <span className="text-2xs text-slate-400 italic">-</span>
                )}
              </div>
              <div className="border-t border-slate-300 w-full pt-1">
                <p className="font-bold text-slate-900 text-xs">
                  {surat.laboran?.nama || 'Petugas Laboratorium'}
                </p>
                <p className="text-slate-500 text-2xs">
                  {surat.laboran?.nip ? `NIP. ${surat.laboran.nip}` : 'Laboran Resmi Kampus'}
                </p>
              </div>
            </div>

            {/* Approver Sarpras (SIMPEG Digital Signature) */}
            <div className="flex flex-col items-center justify-between min-h-[160px] border border-slate-200 rounded p-3 bg-white">
              <span className="font-semibold text-slate-800 text-2xs uppercase">
                Menyetujui,<br />Ka. Bagian Sarana & Prasarana
              </span>
              <div className="h-20 flex items-center justify-center my-1">
                {surat.approver?.tanda_tangan_url ? (
                  <div className="relative w-32 h-16">
                    <Image
                      src={surat.approver.tanda_tangan_url}
                      alt="Tanda Tangan Approver (SIMPEG)"
                      width={128}
                      height={64}
                      className="max-h-full max-w-full object-contain mx-auto"
                      unoptimized
                    />
                  </div>
                ) : surat.approver ? (
                  <div className="flex flex-col items-center text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                    <CheckCircle size={16} className="mb-0.5" />
                    <span className="text-[10px] font-semibold">Disetujui Digital</span>
                    <span className="text-[8px] text-slate-500 font-mono">SIMPEG Verified</span>
                  </div>
                ) : (
                  <span className="text-2xs text-slate-400 italic">Belum Disetujui</span>
                )}
              </div>
              <div className="border-t border-slate-300 w-full pt-1">
                <p className="font-bold text-slate-900 text-xs">
                  {surat.approver?.nama || 'Ka. Bagian Sarpras'}
                </p>
                <p className="text-slate-500 text-2xs">
                  {surat.approver?.nip ? `NIP. ${surat.approver.nip}` : 'Pejabat Berwenang'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER VERIFIKASI KEABSAHAN DOKUMEN DIGITAL */}
        <div className="mt-8 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-2xs text-slate-500 font-sans">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-100 border border-slate-300 flex items-center justify-center rounded font-mono font-bold text-[10px] text-slate-700">
              QR
            </div>
            <div>
              <p className="font-semibold text-slate-700">
                Dokumen Resmi Terverifikasi Sistem Terpadu (SINAPRA & SIMPEG)
              </p>
              <p className="font-mono text-[9px] text-slate-400">
                Token Keabsahan: {surat.verifikasi_token || '-'}
              </p>
            </div>
          </div>
          <div className="text-right text-[10px] text-slate-400">
            Halaman 1 dari 1 • Dicetak otomatis dari Portal Kampus
          </div>
        </div>
      </div>
    </div>
  );
}
