'use client';

import { formatRupiah } from '@/lib/utils';
import { useEffect, useState, useCallback } from 'react';
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
  DollarSign,
  Plus,
  Trash2,
  Percent,
  Save,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

export default function TagihanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [tagihan, setTagihan] = useState<any>(null);

  // Ad-hoc Potongan Modal State
  const [isPotonganModalOpen, setIsPotonganModalOpen] = useState(false);
  const [potonganForm, setPotonganForm] = useState({
    nama_potongan: '',
    tipe_potongan: 'nominal' as 'nominal' | 'persen',
    nilai_potongan: '',
    keterangan: '',
  });
  const [savingPotongan, setSavingPotongan] = useState(false);

  // Delete Potongan State
  const [deletePotonganModal, setDeletePotonganModal] = useState<{
    isOpen: boolean;
    id: number | null;
    keterangan: string;
    nominal: number;
  }>({
    isOpen: false,
    id: null,
    keterangan: '',
    nominal: 0,
  });
  const [deletingPotongan, setDeletingPotongan] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await sikeuService.getTagihanDetail(id);
      setTagihan(res.data);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal memuat rincian tagihan');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleAddPotongan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!potonganForm.nama_potongan || potonganForm.nama_potongan.trim().length === 0) {
      toast.error('Nama atau jenis potongan wajib diisi!');
      return;
    }
    const val = parseFloat(potonganForm.nilai_potongan);
    if (isNaN(val) || val <= 0) {
      toast.error('Nilai potongan harus lebih besar dari 0!');
      return;
    }

    setSavingPotongan(true);
    try {
      await sikeuService.addPotonganTagihan(id, {
        nama_potongan: potonganForm.nama_potongan.trim(),
        tipe: 'diskon',
        tipe_potongan: potonganForm.tipe_potongan,
        nilai_potongan: val,
        keterangan: potonganForm.keterangan?.trim() || undefined,
      });
      toast.success('Potongan tambahan berhasil diterapkan!');
      setIsPotonganModalOpen(false);
      setPotonganForm({
        nama_potongan: '',
        tipe_potongan: 'nominal',
        nilai_potongan: '',
        keterangan: '',
      });
      fetchDetail();
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menerapkan potongan tambahan');
    } finally {
      setSavingPotongan(false);
    }
  };

  const handleDeletePotongan = async () => {
    if (!deletePotonganModal.id) return;
    setDeletingPotongan(true);
    try {
      await sikeuService.deletePotonganTagihan(deletePotonganModal.id);
      toast.success('Potongan tagihan berhasil dicabut!');
      setDeletePotonganModal({ isOpen: false, id: null, keterangan: '', nominal: 0 });
      fetchDetail();
    } catch (err: any) {
      toast.error(err?.message || 'Gagal membatalkan potongan');
    } finally {
      setDeletingPotongan(false);
    }
  };

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
    <div className="w-full space-y-6 animate-fade-in pb-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2.5">
          <Link href="/sikeu/tagihan" className="btn btn-warning btn-icon" title="Kembali ke Daftar Tagihan">
            <ArrowLeft size={18} />
          </Link>
          <span className="text-xs font-bold text-slate-700 hidden sm:inline">Kembali ke Daftar Tagihan</span>
        </div>
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
            <>
              <Button
                size="sm"
                variant="outline"
                className="text-amber-700 border-amber-300 hover:bg-amber-50"
                icon={<Sparkles size={14} className="text-amber-500" />}
                onClick={() => setIsPotonganModalOpen(true)}
              >
                + Beri Potongan Khusus
              </Button>
              <Link href="/sikeu/tagihan/create">
                <Button size="sm" icon={<CreditCard size={15} />}>
                  Bayar di Kasir / Loket
                </Button>
              </Link>
            </>
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
              Jatuh Tempo: <span className="font-semibold text-rose-300">{tagihan.jatuh_tempo || '-'}</span>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 print:p-0 space-y-8 print:space-y-4">
          {/* Student Profile Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-slate-50/80 rounded-2xl border border-slate-200/80 print:bg-white print:border-slate-300 print:p-3">
            <div className="space-y-3 print:space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <User size={14} className="text-primary-600 print:hidden" />
                  <span>{tagihan.is_calon_mahasiswa || tagihan.tipe_referensi === 'calon_mahasiswa' ? 'Identitas Calon Mahasiswa (SPMB)' : 'Identitas Mahasiswa'}</span>
                </div>
                {(tagihan.is_calon_mahasiswa || tagihan.tipe_referensi === 'calon_mahasiswa') && (
                  <Badge variant="warning" className="text-2xs font-bold">Calon Mahasiswa</Badge>
                )}
              </div>
              <div>
                <p className="text-base font-extrabold text-slate-900">{tagihan.nama_mahasiswa}</p>
                <p className="text-xs font-mono text-slate-600">
                  {tagihan.nim && tagihan.nim !== '-' ? `NIM: ${tagihan.nim}` : (tagihan.no_pendaftaran ? `No. Pendaftaran: ${tagihan.no_pendaftaran}` : '-')}
                </p>
              </div>
              <div className="text-xs text-slate-600 space-y-1">
                <p><span className="text-slate-400">Program Studi:</span> <span className="font-semibold text-slate-800">{tagihan.program_studi || '-'}</span></p>
                <p><span className="text-slate-400">Angkatan / Tahun:</span> {tagihan.tahun_angkatan || '-'} {tagihan.jalur_kelas ? `• Jalur: ${tagihan.jalur_kelas}` : ''}</p>
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

          {/* Rincian Potongan Tambahan & Keringanan Khusus */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="text-amber-500" size={18} />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Rincian Potongan & Keringanan Khusus
                </h2>
                {tagihan.potongan_tagihan && tagihan.potongan_tagihan.length > 0 && (
                  <Badge variant="green" className="text-2xs font-mono">
                    {tagihan.potongan_tagihan.length} Terdaftar
                  </Badge>
                )}
              </div>
              {!isLunas && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs font-bold text-amber-700 border-amber-300 hover:bg-amber-50 print:hidden"
                  icon={<Plus size={14} />}
                  onClick={() => {
                    setPotonganForm({
                      nama_potongan: '',
                      tipe_potongan: 'nominal',
                      nilai_potongan: '',
                      keterangan: '',
                    });
                    setIsPotonganModalOpen(true);
                  }}
                >
                  + Beri Potongan Tambahan
                </Button>
              )}
            </div>

            {tagihan.potongan_tagihan && tagihan.potongan_tagihan.length > 0 ? (
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Keterangan / SK Potongan</th>
                      <th className="p-3">Tipe</th>
                      <th className="p-3">Dicatat Oleh</th>
                      <th className="p-3">Waktu Input</th>
                      <th className="p-3 text-right">Nominal Pengurang</th>
                      {!isLunas && <th className="p-3 text-center print:hidden">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tagihan.potongan_tagihan.map((pot: any) => (
                      <tr key={pot.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3 font-semibold text-slate-900">
                          {pot.keterangan || 'Potongan Khusus Mahasiswa'}
                        </td>
                        <td className="p-3">
                          <Badge variant={pot.tipe === 'subsidi' ? 'blue' : 'amber'} className="text-2xs uppercase">
                            {pot.tipe || 'Diskon'}
                          </Badge>
                        </td>
                        <td className="p-3 text-slate-600 font-medium">
                          {pot.petugas_nama || 'Petugas Keuangan'}
                        </td>
                        <td className="p-3 text-slate-500 font-mono text-2xs">
                          {pot.created_at || '-'}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-600 tabular-nums">
                          -{formatRupiah(pot.nominal_potongan)}
                        </td>
                        {!isLunas && (
                          <td className="p-3 text-center print:hidden">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                              title="Batalkan Potongan"
                              onClick={() =>
                                setDeletePotonganModal({
                                  isOpen: true,
                                  id: pot.id,
                                  keterangan: pot.keterangan,
                                  nominal: pot.nominal_potongan,
                                })
                              }
                            >
                              <Trash2 size={13} />
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-400">
                Belum ada potongan atau keringanan tambahan yang diterapkan pada invoice ini.
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

      {/* Modal Beri Potongan Tambahan / Keringanan */}
      <Modal
        isOpen={isPotonganModalOpen}
        onClose={() => setIsPotonganModalOpen(false)}
        title="Beri Potongan Tambahan / Keringanan Khusus"
        size="md"
      >
        <form onSubmit={handleAddPotongan} className="space-y-4 text-xs">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-xs">
              <Sparkles size={14} className="text-amber-600" />
              Pemberian Potongan pada Invoice #{tagihan?.nomor_tagihan}
            </p>
            <p className="text-2xs text-amber-800">
              Mahasiswa: <strong>{tagihan?.nama_mahasiswa}</strong> ({tagihan?.nim})
            </p>
            <p className="text-2xs text-amber-800">
              Sisa Kewajiban Saat Ini: <strong>{formatRupiah(tagihan ? (tagihan.sisa_tagihan !== undefined ? tagihan.sisa_tagihan : Math.max(0, tagihan.total_tagihan - tagihan.total_potongan - tagihan.total_bayar)) : 0)}</strong>
            </p>
          </div>

          <Input
            label="Nama / Alasan / SK Potongan"
            placeholder="Contoh: Keringanan Rektorat SK-042, Diskon Kakak-Beradik..."
            value={potonganForm.nama_potongan}
            onChange={(e) => setPotonganForm((prev) => ({ ...prev, nama_potongan: e.target.value }))}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Tipe Potongan"
              value={potonganForm.tipe_potongan}
              onChange={(e) => setPotonganForm((prev) => ({ ...prev, tipe_potongan: e.target.value as 'nominal' | 'persen' }))}
              options={[
                { value: 'nominal', label: 'Nominal Rupiah (Rp)' },
                { value: 'persen', label: 'Persentase (%) dari Sisa' },
              ]}
            />

            <Input
              label={potonganForm.tipe_potongan === 'persen' ? 'Persentase (%)' : 'Besaran Nominal (Rp)'}
              type="number"
              step="any"
              placeholder={potonganForm.tipe_potongan === 'persen' ? 'Contoh: 20' : 'Contoh: 1000000'}
              value={potonganForm.nilai_potongan}
              onChange={(e) => setPotonganForm((prev) => ({ ...prev, nilai_potongan: e.target.value }))}
              required
            />
          </div>

          {/* Live Preview Box */}
          {(() => {
            const currentSisa = tagihan ? (tagihan.sisa_tagihan !== undefined ? Number(tagihan.sisa_tagihan) : Math.max(0, Number(tagihan.total_tagihan) - Number(tagihan.total_potongan) - Number(tagihan.total_bayar))) : 0;
            const num = parseFloat(potonganForm.nilai_potongan) || 0;
            const potonganNominal = potonganForm.tipe_potongan === 'persen' ? Math.round((currentSisa * num) / 100) : num;
            const sisaBaru = Math.max(0, currentSisa - potonganNominal);

            return (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between text-2xs text-slate-600">
                  <span>Nominal Pengurang:</span>
                  <span className="font-bold text-emerald-600 font-mono">-{formatRupiah(potonganNominal)}</span>
                </div>
                <div className="flex justify-between text-2xs text-slate-900 font-bold pt-1 border-t border-slate-200">
                  <span>Estimasi Sisa Baru:</span>
                  <span className="font-mono text-primary-700">{formatRupiah(sisaBaru)}</span>
                </div>
              </div>
            );
          })()}

          <div>
            <label className="text-2xs font-semibold text-slate-700 block mb-1">
              Catatan / Dasar Permohonan (Opsional)
            </label>
            <textarea
              rows={2}
              placeholder="Catatan tambahan permohonan dispensasi potongan..."
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:outline-hidden focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              value={potonganForm.keterangan}
              onChange={(e) => setPotonganForm((prev) => ({ ...prev, keterangan: e.target.value }))}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPotonganModalOpen(false)}
              disabled={savingPotongan}
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              icon={savingPotongan ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              disabled={savingPotongan}
            >
              {savingPotongan ? 'Menerapkan...' : 'Terapkan Potongan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Dialog Konfirmasi Pembatalan Potongan */}
      <ConfirmDialog
        isOpen={deletePotonganModal.isOpen}
        onClose={() => setDeletePotonganModal({ isOpen: false, id: null, keterangan: '', nominal: 0 })}
        onConfirm={handleDeletePotongan}
        title="Batalkan Potongan Tagihan"
        message={`Apakah Anda yakin ingin membatalkan potongan "${deletePotonganModal.keterangan}" sebesar ${formatRupiah(deletePotonganModal.nominal)}? Nilai tagihan mahasiswa akan kembali bertambah sesuai nominal potongan ini.`}
        confirmText="Ya, Batalkan Potongan"
        cancelText="Batal"
        variant="danger"
        isLoading={deletingPotongan}
      />
    </div>
  );
}
