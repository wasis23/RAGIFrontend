'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Printer,
  Sparkles,
  FileText,
  Trash2,
  CheckCircle2,
  XCircle,
  Building2,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  Receipt,
  GraduationCap,
  Loader2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import { formatRupiah, formatDate } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface TagihanTerdampak {
  id: number;
  tagihan_id: number;
  nomor_tagihan: string;
  nominal_potongan: number;
  total_tagihan: number;
  total_bayar: number;
  sisa: number;
  status_tagihan: string;
  jatuh_tempo?: string | null;
  created_at?: string | null;
}

interface PotonganDetail {
  id: number;
  mahasiswa_id?: number | null;
  calon_mahasiswa_id?: number | null;
  is_calon_mahasiswa: boolean;
  tipe_referensi: string;
  nim: string;
  nama_mahasiswa: string;
  prodi: string;
  nama_potongan: string;
  tipe_potongan: string;
  nilai_potongan: number;
  nomor_sk: string;
  keterangan?: string | null;
  status: string;
  diinput_oleh_nama: string;
  created_at?: string | null;
  tagihan_list: TagihanTerdampak[];
}

export default function DetailPotonganMahasiswaPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [potongan, setPotongan] = useState<PotonganDetail | null>(null);

  // Delete Confirm Dialog State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch Detail Data
  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await sikeuService.getPembayaranMahasiswaPotonganDetail(id);
      if (res.data) {
        setPotongan(res.data);
      } else {
        toast.error('Data potongan tidak ditemukan');
        router.push('/sikeu/pembayaran-mahasiswa/potongan');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Gagal memuat rincian potongan');
      router.push('/sikeu/pembayaran-mahasiswa/potongan');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // Hapus / Batalkan Potongan Handler
  const handleDeletePotongan = async () => {
    if (!potongan) return;
    setDeleting(true);
    try {
      const res = await sikeuService.deletePembayaranMahasiswaPotongan(potongan.id);
      toast.success(res.message || 'Potongan mahasiswa berhasil dibatalkan dan tagihan telah dipulihkan');
      router.push('/sikeu/pembayaran-mahasiswa/potongan');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Gagal membatalkan potongan');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        <p className="text-xs font-semibold text-slate-500">Memuat rincian data potongan mahasiswa...</p>
      </div>
    );
  }

  if (!potongan) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-900">Data Potongan Tidak Ditemukan</h3>
        <p className="text-xs text-slate-500">Data potongan mungkin telah dihapus atau tidak tersedia.</p>
        <Button variant="outline" onClick={() => router.push('/sikeu/pembayaran-mahasiswa/potongan')}>
          Kembali ke Daftar Potongan
        </Button>
      </div>
    );
  }

  const totalNominalTerpotong = potongan.tagihan_list?.reduce((sum, item) => sum + (Number(item.nominal_potongan) || 0), 0) || potongan.nilai_potongan || 0;

  return (
    <div className="w-full space-y-6 animate-fade-in pb-12">
      {/* HEADER SESUAI STANDAR ADMIN CRUD REVIEWER */}
      <PageHeader
        breadcrumbs={[
          { label: 'Keuangan', href: '/sikeu' },
          { label: 'Pembayaran Mahasiswa', href: '/sikeu/pembayaran-mahasiswa/tarif' },
          { label: 'Potongan Mahasiswa', href: '/sikeu/pembayaran-mahasiswa/potongan' },
          { label: `Detail Potongan #${potongan.id}` },
        ]}
        title="Rincian Potongan Mahasiswa"
        description="Detail penetapan potongan biaya pendidikan, bukti surat keputusan persetujuan, dan status tagihan terdampak."
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/sikeu/pembayaran-mahasiswa/potongan">
              <Button
                variant="outline"
                icon={<ArrowLeft size={16} />}
                className="font-bold min-h-[38px] text-xs"
              >
                Kembali
              </Button>
            </Link>
            <Button
              variant="outline"
              icon={<Printer size={16} />}
              onClick={() => window.print()}
              className="font-bold min-h-[38px] text-xs print:hidden"
            >
              Cetak Bukti
            </Button>
            <Button
              variant="danger"
              icon={<Trash2 size={16} />}
              onClick={() => setShowDeleteConfirm(true)}
              className="font-bold min-h-[38px] text-xs shadow-xs print:hidden"
            >
              Batalkan Potongan
            </Button>
          </div>
        }
      />

      {/* KPI RINGKASAN METRIK */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 print:hidden">
        {/* Total Nominal Terpotong */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">Total Potongan</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Sparkles size={16} />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-base sm:text-lg font-extrabold text-emerald-700 font-mono">
              {formatRupiah(totalNominalTerpotong)}
            </span>
            <span className="text-2xs text-slate-500 block mt-0.5 font-medium">Pengurang Tagihan</span>
          </div>
        </div>

        {/* Tagihan Terdampak */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">Jumlah Tagihan</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Receipt size={16} />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-base sm:text-lg font-extrabold text-slate-900 font-mono">
              {potongan.tagihan_list?.length || 0}
            </span>
            <span className="text-2xs text-slate-500 block mt-0.5 font-medium">Invoice Tagihan Terkait</span>
          </div>
        </div>

        {/* Status Potongan */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">Status Penetapan</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div>
              {potongan.status === 'aktif' ? (
                <Badge variant="green" className="text-xs font-bold flex items-center gap-1 w-fit">
                  <CheckCircle2 size={12} /> AKTIF
                </Badge>
              ) : (
                <Badge variant="red" className="text-xs font-bold flex items-center gap-1 w-fit">
                  <XCircle size={12} /> NON-AKTIF
                </Badge>
              )}
            </div>
            <span className="text-2xs text-slate-500 block mt-1 font-medium">Berlaku di Sistem</span>
          </div>
        </div>

        {/* Tanggal Input */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">Waktu Penetapan</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar size={16} />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xs sm:text-sm font-bold text-slate-800 font-mono block truncate">
              {formatDate(potongan.created_at)}
            </span>
            <span className="text-2xs text-slate-500 block mt-0.5 font-medium">Oleh: {potongan.diinput_oleh_nama}</span>
          </div>
        </div>
      </div>

      {/* DUA KOLOM INFORMASI: IDENTITAS MAHASISWA & DOKUMEN PERSETUJUAN SK */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* PANEL 1: IDENTITAS MAHASISWA */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center">
                <User size={16} />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900">Mahasiswa Penerima Potongan</h3>
            </div>
            {potongan.is_calon_mahasiswa ? (
              <Badge variant="purple" className="text-2xs font-bold">
                Calon Mahasiswa (SPMB)
              </Badge>
            ) : (
              <Badge variant="blue" className="text-2xs font-bold">
                Mahasiswa Aktif (SIAKAD)
              </Badge>
            )}
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Nama Lengkap:</span>
              <p className="font-extrabold text-sm sm:text-base text-slate-900">{potongan.nama_mahasiswa}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/60 space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  {potongan.is_calon_mahasiswa ? 'No. Pendaftaran' : 'NIM'}
                </span>
                <p className="font-mono font-bold text-xs sm:text-sm text-slate-800">{potongan.nim}</p>
              </div>

              <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/60 space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Program Studi</span>
                <p className="font-bold text-xs sm:text-sm text-slate-800 flex items-center gap-1 line-clamp-1">
                  <GraduationCap size={14} className="text-slate-500 shrink-0" />
                  {potongan.prodi}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* PANEL 2: DOKUMEN PERSETUJUAN & SK (HIGHLIGHT UTAMA) */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <ShieldCheck size={16} />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900">Dasar Dokumen & Persetujuan SK</h3>
            </div>
            <span className="text-2xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 size={11} /> Sah / Terverifikasi
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Box Nomor SK (Wajib & Prominen) */}
            <div className="p-3.5 bg-gradient-to-r from-amber-50/90 to-amber-50/40 rounded-xl border border-amber-300/80 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider flex items-center gap-1">
                  <FileText size={12} className="text-amber-700" />
                  Nomor SK / Dasar Keputusan (Wajib)
                </span>
                <Badge variant="amber" className="text-[10px] font-mono font-bold">
                  SK Resmi
                </Badge>
              </div>
              <p className="font-mono font-extrabold text-sm sm:text-base text-amber-950">
                {potongan.nomor_sk || '-'}
              </p>
            </div>

            {/* Nama Potongan */}
            <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/60 space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Nama / Jenis Potongan
              </span>
              <p className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                <Sparkles size={13} className="text-amber-500 shrink-0" />
                {potongan.nama_potongan}
              </p>
            </div>

            {/* Keterangan & Catatan */}
            <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/60 space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Catatan Persetujuan / Keterangan
              </span>
              <p className="text-xs text-slate-700 italic">
                {potongan.keterangan || 'Tidak ada catatan keterangan tambahan.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* PANEL 3: RINCIAN TAGIHAN TERDAMPAK */}
      <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Receipt size={16} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Daftar Tagihan yang Dipotong ({potongan.tagihan_list?.length || 0})
              </h3>
              <p className="text-2xs text-slate-500">
                Daftar invoice mahasiswa yang alokasi tagihannya berkurang berkat potongan ini.
              </p>
            </div>
          </div>
          <Link href="/sikeu/pembayaran-mahasiswa/tagihan" className="text-xs font-bold text-primary-700 hover:text-primary-800 flex items-center gap-1 print:hidden">
            Lihat Semua Tagihan <ExternalLink size={12} />
          </Link>
        </div>

        {/* Tabel Tagihan Terdampak */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">No. Invoice Tagihan</th>
                <th className="py-3 px-4 text-right">Tagihan Awal</th>
                <th className="py-3 px-4 text-right">Nominal Potongan</th>
                <th className="py-3 px-4 text-right">Sisa Terkini</th>
                <th className="py-3 px-4 text-center">Status Tagihan</th>
                <th className="py-3 px-4 text-center">Jatuh Tempo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {potongan.tagihan_list && potongan.tagihan_list.length > 0 ? (
                potongan.tagihan_list.map((t, index) => (
                  <tr key={t.id || index} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <span className="font-mono font-bold text-slate-900 block">
                          {t.nomor_tagihan}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          Terdampak: {formatDate(t.created_at)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-700 font-medium">
                      {formatRupiah(t.total_tagihan)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">
                      - {formatRupiah(t.nominal_potongan)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-extrabold text-slate-900">
                      {formatRupiah(t.sisa)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {t.status_tagihan === 'lunas' ? (
                        <Badge variant="green" className="text-[10px] font-bold inline-flex items-center gap-1">
                          <CheckCircle2 size={11} /> LUNAS
                        </Badge>
                      ) : t.status_tagihan === 'sebagian' ? (
                        <Badge variant="blue" className="text-[10px] font-bold inline-flex items-center gap-1">
                          <Clock size={11} /> SEBAGIAN
                        </Badge>
                      ) : (
                        <Badge variant="red" className="text-[10px] font-bold inline-flex items-center gap-1">
                          <XCircle size={11} /> BELUM BAYAR
                        </Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-600 text-[11px]">
                      {formatDate(t.jatuh_tempo)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                    Tidak ada rincian tagihan yang terhubung.
                  </td>
                </tr>
              )}
            </tbody>
            {potongan.tagihan_list && potongan.tagihan_list.length > 0 && (
              <tfoot className="bg-slate-50/80 font-bold border-t border-slate-200 text-slate-800">
                <tr>
                  <td className="py-3 px-4">Total Potongan Diterapkan:</td>
                  <td className="py-3 px-4 text-right font-mono">
                    {formatRupiah(
                      potongan.tagihan_list.reduce((sum, item) => sum + (Number(item.total_tagihan) || 0), 0)
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-700 font-extrabold">
                    - {formatRupiah(totalNominalTerpotong)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900">
                    {formatRupiah(
                      potongan.tagihan_list.reduce((sum, item) => sum + (Number(item.sisa) || 0), 0)
                    )}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* MODAL KONFIRMASI PEMBATALAN / PENGHAPUSAN POTONGAN */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeletePotongan}
        title="Konfirmasi Batalkan Potongan Mahasiswa"
        message={`Apakah Anda yakin ingin membatalkan potongan "${potongan.nama_potongan}" untuk ${potongan.nama_mahasiswa}? Seluruh pengurangan pada tagihan akan dipulihkan ke saldo semula.`}
        confirmText="Ya, Batalkan Potongan"
        cancelText="Batal"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}
