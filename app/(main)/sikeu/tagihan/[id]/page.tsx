'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Printer,
  CreditCard,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  FileText,
  User,
  GraduationCap,
  Sparkles,
  Layers,
  ShieldCheck,
  DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

const formatRupiah = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);

export default function TagihanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [tagihan, setTagihan] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await sikeuService.getTagihanDetail(id);
        setTagihan(res.data);
      } catch (err: any) {
        toast.error(err?.message || 'Gagal memuat rincian tagihan');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        <p className="text-sm text-slate-500 font-medium">Memuat invoice tagihan mahasiswa...</p>
      </div>
    );
  }

  if (!tagihan) {
    return (
      <div className="card p-12 text-center max-w-lg mx-auto my-12 space-y-4">
        <AlertTriangle className="mx-auto text-amber-500" size={48} />
        <h2 className="text-lg font-bold text-slate-800">Tagihan Tidak Ditemukan</h2>
        <p className="text-sm text-slate-500">
          Data tagihan dengan ID #{id} tidak tersedia dalam database atau belum diterbitkan.
        </p>
        <Button onClick={() => router.push('/sikeu/tagihan')} variant="outline" icon={<ArrowLeft size={16} />}>
          Kembali ke Daftar Tagihan
        </Button>
      </div>
    );
  }

  const isLunas = tagihan.status === 'lunas';
  const isSebagian = tagihan.status === 'sebagian';
  const isPending = tagihan.status === 'pending_approval';

  const grouped = tagihan.grouped_details || {};
  const moduleKeys = Object.keys(grouped);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-fade-in">
      {/* Top Navigation */}
      <div className="flex items-center justify-between print:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/sikeu/tagihan')}
          icon={<ArrowLeft size={16} />}
        >
          Kembali ke Daftar Tagihan
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            icon={<Printer size={15} />}
          >
            Cetak Invoice (PDF)
          </Button>
          {!isLunas && (
            <Link href="/sikeu/tagihan/create">
              <Button size="sm" icon={<CreditCard size={15} />}>
                Bayar di Kasir / Loket
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Invoice Card Container */}
      <div className="printable-document print-document bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden print:border-none print:shadow-none print:p-0">
        {/* Kop Surat Resmi Khusus Cetak (Hanya tampil saat Print) */}
        <div className="hidden print:flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
          <div>
            <h2 className="font-black text-lg tracking-wider uppercase text-slate-900">UNIVERSITAS SSO CAMPUS</h2>
            <h3 className="font-bold text-xs text-slate-700 uppercase">DIREKTORAT KEUANGAN & AKUNTANSI (SIKEU)</h3>
            <p className="text-[10px] text-slate-600">Jl. Kampus Terpadu No. 1 • Telp: (021) 789-0123 • Email: keu@campus.ac.id</p>
          </div>
          <div className="text-right">
            <div className="text-base font-black text-slate-900 uppercase tracking-widest font-mono">SURAT TAGIHAN (INVOICE)</div>
            <div className="text-xs font-mono font-bold text-slate-700">{tagihan.nomor_tagihan}</div>
            <div className="text-[10px] font-semibold text-slate-500 mt-1">Status: <span className="uppercase font-bold">{isLunas ? 'LUNAS' : 'BELUM DIBAYAR'}</span></div>
          </div>
        </div>

        {/* Header Ribbon / Status Banner (Layar Monitor) */}
        <div className="print:hidden p-6 md:p-8 bg-linear-to-r from-slate-900 via-primary-950 to-slate-900 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-slate-200 border border-white/10">
                {tagihan.nomor_tagihan}
              </span>
              <Badge
                variant={isLunas ? 'green' : isPending ? 'blue' : isSebagian ? 'amber' : 'red'}
                className="font-bold text-xs uppercase"
              >
                {isLunas ? 'LUNAS' : isPending ? 'VERIFIKASI PIMPINAN' : isSebagian ? 'BAYAR SEBAGIAN' : 'BELUM DIBAYAR'}
              </Badge>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
              Invoice Tagihan Mahasiswa
            </h1>
            <p className="text-xs text-slate-300">
              Sistem Sumber: <span className="font-semibold text-primary-300">{tagihan.source_system || 'SIAKAD'}</span> • Semester: <span className="text-white font-medium">{tagihan.semester}</span>
            </p>
          </div>

          <div className="text-left md:text-right space-y-1 bg-white/5 p-4 rounded-2xl border border-white/10">
            <span className="text-2xs uppercase tracking-wider text-slate-300 font-bold block">
              Total Tagihan Bersih
            </span>
            <span className="text-2xl md:text-3xl font-black text-white tabular-nums">
              {formatRupiah(tagihan.sisa_tagihan > 0 ? tagihan.sisa_tagihan : tagihan.total_tagihan - tagihan.total_potongan)}
            </span>
            <div className="text-2xs text-slate-300">
              Jatuh Tempo: <span className="font-semibold text-rose-300">{tagihan.jatuh_tempo || '31 Agustus 2026'}</span>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 print:p-0 space-y-8 print:space-y-4">
          {/* Student Profile Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-slate-50/80 rounded-2xl border border-slate-200/80 print:bg-white print:border-slate-300 print:p-3">
            <div className="space-y-3 print:space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <User size={14} className="text-primary-600 print:hidden" />
                <span>Identitas Mahasiswa</span>
              </div>
              <div>
                <p className="text-base font-extrabold text-slate-900">{tagihan.nama_mahasiswa}</p>
                <p className="text-xs font-mono text-slate-600">NIM: {tagihan.nim}</p>
              </div>
              <div className="text-xs text-slate-600 space-y-1">
                <p><span className="text-slate-400">Program Studi:</span> <span className="font-semibold text-slate-800">{tagihan.program_studi || 'Teknik Informatika'}</span></p>
                <p><span className="text-slate-400">Angkatan:</span> {tagihan.tahun_angkatan} • <span className="text-slate-400">Jalur:</span> {tagihan.jalur_kelas}</p>
              </div>
            </div>

            <div className="space-y-3 md:border-l md:border-slate-200 md:pl-6 print:space-y-1 print:border-l print:border-slate-300 print:pl-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <CreditCard size={14} className="text-primary-600 print:hidden" />
                <span>Metode Pembayaran Mandiri</span>
              </div>
              {tagihan.virtual_account ? (
                <div className="space-y-1">
                  <span className="text-2xs text-slate-400 font-medium">Nomor Virtual Account ({tagihan.virtual_account.bank || 'Bank Kampus'})</span>
                  <div className="font-mono text-lg font-black text-primary-700 tracking-wider">
                    {tagihan.virtual_account.va_number}
                  </div>
                  <p className="text-2xs text-slate-500">
                    Bisa dibayar via Mobile Banking, ATM Bersama/Prima, atau Loket Kasir Kampus.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Virtual Account belum aktif. Silakan bayar di Loket Keuangan Kampus.</p>
              )}
            </div>
          </div>

          {/* Rincian Komponen Biaya Dikelompokkan Per-Modul (Sesuai ALUR_SISTEM_PEMBAYARAN_MAHASISWA.md) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="text-primary-600" size={18} />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Rincian Komponen Tagihan Per-Modul
                </h2>
              </div>
              <span className="text-2xs text-slate-500">
                Klasifikasi: <strong>D</strong> (Pendaftaran PMB), <strong>P</strong> (Pendidikan Tetap), <strong>L</strong> (Lain-Lain)
              </span>
            </div>

            {moduleKeys.length > 0 ? (
              <div className="space-y-4">
                {moduleKeys.map((modKey) => {
                  const group = grouped[modKey];
                  return (
                    <div key={modKey} className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                      <div className="bg-slate-100/90 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-primary-600"></span>
                          Modul: {group.module_name || modKey.toUpperCase()}
                        </span>
                        <span className="text-xs font-bold text-slate-700">
                          Subtotal: {formatRupiah(group.subtotal)}
                        </span>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {group.items.map((item: any, idx: number) => (
                          <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-sm">{item.nama_biaya}</span>
                                <Badge variant="gray" className="text-2xs font-mono">
                                  {item.kategori_kode ? `Tipe ${item.kategori_kode}` : 'Biaya Tetap'}
                                </Badge>
                              </div>
                              <p className="text-slate-500 text-2xs font-mono">{item.kode_biaya || item.kode} • {item.kategori_label || item.kategori || 'Pendidikan'}</p>
                              {item.keterangan && <p className="text-slate-500 text-xs italic">{item.keterangan}</p>}
                            </div>
                            <div className="text-right space-y-0.5">
                              <div className="font-bold text-slate-900 text-sm tabular-nums">
                                {formatRupiah(item.nominal)}
                              </div>
                              {item.potongan > 0 && (
                                <div className="text-emerald-600 text-2xs font-semibold">
                                  Potongan: -{formatRupiah(item.potongan)}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Fallback Flat Details Table
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Komponen Biaya</th>
                      <th className="p-3">Kategori</th>
                      <th className="p-3 text-right">Nominal</th>
                      <th className="p-3 text-right">Potongan</th>
                      <th className="p-3 text-right">Nominal Bersih</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(tagihan.details || []).map((d: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-3 font-semibold text-slate-800">{d.nama_biaya}</td>
                        <td className="p-3 text-slate-500 font-mono">{d.kategori_kode || 'P'} ({d.module_label || 'SIAKAD'})</td>
                        <td className="p-3 text-right font-mono text-slate-700">{formatRupiah(d.nominal)}</td>
                        <td className="p-3 text-right font-mono text-emerald-600">{formatRupiah(d.potongan)}</td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">{formatRupiah(d.nominal_bersih || d.nominal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Ringkasan Finansial Formula Running Balance */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/90 space-y-2.5 max-w-md ml-auto text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Total Tagihan Kotor (Gross)</span>
              <span className="font-semibold text-slate-800 tabular-nums">{formatRupiah(tagihan.total_tagihan)}</span>
            </div>
            {tagihan.total_potongan > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Total Potongan / Beasiswa</span>
                <span className="tabular-nums">-{formatRupiah(tagihan.total_potongan)}</span>
              </div>
            )}
            {tagihan.total_denda > 0 && (
              <div className="flex justify-between text-rose-600 font-medium">
                <span>Denda Keterlambatan</span>
                <span className="tabular-nums">+{formatRupiah(tagihan.total_denda)}</span>
              </div>
            )}
            {tagihan.total_bayar > 0 && (
              <div className="flex justify-between text-primary-700 font-medium">
                <span>Total Telah Dibayar</span>
                <span className="tabular-nums">-{formatRupiah(tagihan.total_bayar)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-extrabold text-slate-900">
              <span>Sisa Kewajiban Piutang</span>
              <span className="text-primary-700 text-base tabular-nums">
                {formatRupiah(tagihan.sisa_tagihan !== undefined ? tagihan.sisa_tagihan : Math.max(0, tagihan.total_tagihan - tagihan.total_potongan - tagihan.total_bayar))}
              </span>
            </div>
          </div>

          {/* Tanda Tangan & Keterangan Resmi Cetak (Print View) */}
          <div className="hidden print:grid grid-cols-2 gap-8 pt-6 border-t border-slate-300 text-xs">
            <div className="space-y-1">
              <p className="font-bold text-slate-800">Catatan Penting:</p>
              <ul className="list-disc list-inside text-slate-600 text-[10px] space-y-0.5">
                <li>Pembayaran via Virtual Account terverifikasi otomatis dalam sistem tanpa perlu konfirmasi manual.</li>
                <li>Simpan surat tagihan dan bukti transfer ini sebagai bukti pembayaran resmi pendidikan.</li>
                <li>Apabila ada ketidaksesuaian data, hubungi Bagian Keuangan Kampus.</li>
              </ul>
            </div>
            <div className="text-right space-y-12">
              <div>
                <p className="text-slate-600">Kota Kampus, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p className="font-bold text-slate-800">Bagian Keuangan & Kasir</p>
              </div>
              <div>
                <p className="font-bold text-slate-900 underline">( Petugas Keuangan Kampus )</p>
                <p className="text-[10px] text-slate-500 font-mono">Direktorat Keuangan SIKEU</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
