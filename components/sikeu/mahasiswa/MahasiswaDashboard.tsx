'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Wallet,
  CheckCircle2,
  Clock,
  Receipt,
  CreditCard,
  Upload,
  Landmark,
  Copy,
  ArrowRight,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatRupiah } from '@/lib/utils';
import { sikeuService } from '@/services/sikeu.service';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';

export default function MahasiswaDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [rekening, setRekening] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [resBills, resHistory, resKas] = await Promise.all([
          sikeuService.getMyBills(),
          sikeuService.getMyPaymentHistory().catch(() => ({ data: [] })),
          sikeuService.getUnitKasList().catch(() => ({ data: [] })),
        ]);
        if (Array.isArray((resBills as any)?.data)) setBills((resBills as any).data);
        if (Array.isArray((resHistory as any)?.data)) setPayments((resHistory as any).data);
        const kas = Array.isArray((resKas as any)?.data) ? (resKas as any).data : [];
        setRekening(kas.filter((u: any) => u.status !== false && ['tunai', 'bank_manual'].includes(u.kanal || 'bank_manual')));
      } catch {
        toast.error('Gagal memuat dashboard keuangan');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = useMemo(() => {
    const berjalan = bills.filter((b) => b.status !== 'lunas');
    return {
      sisa: berjalan.reduce((s, b) => s + (Number(b.sisa_bayar) || 0), 0),
      terbayar: bills.reduce((s, b) => s + (Number(b.total_bayar) || 0), 0),
      lunas: bills.filter((b) => b.status === 'lunas').length,
      pending: payments.filter((p) => p.status === 'pending').length,
      berjalan,
    };
  }, [bills, payments]);

  const nama = (user as any)?.nama_lengkap || (user as any)?.name || user?.username || 'Mahasiswa';
  const nim = (user as any)?.nim || user?.username || '-';

  const copyRek = (norek: string) => {
    navigator.clipboard.writeText(norek);
    toast.success('Nomor rekening disalin');
  };

  return (
    <div className="w-full space-y-6 animate-fade-in">
      <PageHeader
        title={`Keuangan Saya — ${nama}`}
        description={`NIM ${nim} • Ringkasan tagihan, pembayaran & verifikasi transfer.`}
        action={
          <Link href="/sikeu/mahasiswa/tagihan">
            <Button variant="primary" icon={<CreditCard size={16} />} className="font-bold min-h-[40px]">
              Bayar Tagihan
            </Button>
          </Link>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-5 rounded-2xl bg-white border border-slate-200 animate-pulse space-y-2">
              <div className="h-3 bg-slate-100 rounded w-1/2" />
              <div className="h-6 bg-slate-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <p className="text-2xs font-bold text-slate-500 uppercase">Sisa Tagihan Berjalan</p>
              <p className="text-xl font-black text-rose-700 tabular-nums mt-1">{formatRupiah(stats.sisa)}</p>
              <p className="text-2xs text-slate-400 mt-1">{stats.berjalan.length} tagihan belum lunas</p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <p className="text-2xs font-bold text-slate-500 uppercase">Total Telah Dibayar</p>
              <p className="text-xl font-black text-emerald-700 tabular-nums mt-1">{formatRupiah(stats.terbayar)}</p>
              <p className="text-2xs text-slate-400 mt-1">{stats.lunas} tagihan lunas</p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <p className="text-2xs font-bold text-slate-500 uppercase">Menunggu Verifikasi</p>
              <p className="text-xl font-black text-amber-600 tabular-nums mt-1">{stats.pending} bukti</p>
              <p className="text-2xs text-slate-400 mt-1">Transfer manual belum divalidasi</p>
            </div>
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950 to-slate-900 text-white border border-indigo-900 shadow-xs flex flex-col justify-between gap-2">
              <p className="text-2xs font-bold text-indigo-300 uppercase">Aksi Cepat</p>
              <div className="flex flex-wrap gap-2">
                <Link href="/sikeu/mahasiswa/tagihan" className="btn btn-sm bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 border-none">
                  <CreditCard size={13} /> Bayar / Upload Bukti
                </Link>
                <Link href="/sikeu/mahasiswa/tagihan" className="btn btn-sm bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 border border-white/20">
                  <Receipt size={13} /> Riwayat
                </Link>
              </div>
            </div>
          </div>

          {/* Tagihan berjalan */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <FileText size={16} className="text-primary-600" /> Tagihan Berjalan
              </h2>
              <Link href="/sikeu/mahasiswa/tagihan" className="text-xs font-bold text-primary-700 hover:underline flex items-center gap-1">
                Semua <ArrowRight size={13} />
              </Link>
            </div>
            {stats.berjalan.length === 0 ? (
              <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                <CheckCircle2 size={14} /> Semua tagihan lunas. Terima kasih!
              </p>
            ) : (
              <div className="space-y-2">
                {stats.berjalan.slice(0, 5).map((b: any) => (
                  <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                    <div>
                      <p className="font-bold text-slate-900 text-xs">
                        {b.nomor_tagihan} <span className="font-normal text-slate-500">• {b.periode_label}</span>
                      </p>
                      <p className="text-2xs text-slate-500">
                        Sisa: <b className="text-rose-700">{formatRupiah(b.sisa_bayar || 0)}</b>
                        {b.jatuh_tempo ? ` • Batas: ${b.jatuh_tempo}` : ''}
                      </p>
                    </div>
                    <Link
                      href="/sikeu/mahasiswa/tagihan"
                      className="btn btn-sm bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs border-none"
                    >
                      Bayar
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rekening manual + riwayat */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Landmark size={16} className="text-indigo-600" /> Rekening Transfer Manual
              </h2>
              {rekening.length === 0 ? (
                <p className="text-xs text-slate-400">Belum ada rekening manual terdaftar.</p>
              ) : (
                <div className="space-y-2">
                  {rekening.map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                      <div>
                        <p className="font-bold text-slate-900 text-xs">{r.nama_kas}</p>
                        <p className="font-mono text-xs text-slate-600">{r.bank_account_number || '-'} a.n. {r.bank_account_name || '-'}</p>
                      </div>
                      {r.bank_account_number && (
                        <button
                          type="button"
                          onClick={() => copyRek(r.bank_account_number)}
                          className="btn btn-outline btn-sm text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Copy size={13} /> Salin
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <p className="text-2xs text-slate-500 flex items-center gap-1">
                <Upload size={12} /> Setelah transfer, unggah bukti via tombol Upload Bukti Transfer di halaman tagihan.
              </p>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Wallet size={16} className="text-emerald-600" /> Pembayaran Terakhir
                </h2>
                <Link href="/sikeu/mahasiswa/tagihan" className="text-xs font-bold text-primary-700 hover:underline flex items-center gap-1">
                  Semua <ArrowRight size={13} />
                </Link>
              </div>
              {payments.length === 0 ? (
                <p className="text-xs text-slate-400">Belum ada pembayaran tercatat.</p>
              ) : (
                <div className="space-y-2">
                  {payments.slice(0, 5).map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs">
                      <div>
                        <p className="font-mono font-bold text-slate-900">{p.kode_transaksi}</p>
                        <p className="text-2xs text-slate-500">{p.channel_bayar}{p.unit_kas_nama ? ` • ${p.unit_kas_nama}` : ''}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold tabular-nums">{formatRupiah(p.jumlah_bayar)}</p>
                        {p.status === 'pending' ? (
                          <span className="text-2xs font-bold text-amber-600 inline-flex items-center gap-1"><Clock size={11} /> Menunggu</span>
                        ) : p.status === 'rejected' ? (
                          <span className="text-2xs font-bold text-rose-600">Ditolak</span>
                        ) : (
                          <span className="text-2xs font-bold text-emerald-600 inline-flex items-center gap-1"><CheckCircle2 size={11} /> Lunas</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
