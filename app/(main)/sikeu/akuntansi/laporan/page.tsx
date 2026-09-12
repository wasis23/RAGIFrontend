'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, PieChart, TrendingUp, DollarSign, Layers, Printer, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const formatRupiah = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);

export default function LaporanKeuanganPage() {
  const [activeTab, setActiveTab] = useState<'laba_rugi' | 'neraca' | 'arus_kas' | 'ekuitas'>('laba_rugi');
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);

  const fetchLaporan = async () => {
    try {
      setLoading(true);
      const res = await sikeuService.getLaporanKeuangan();
      if (res.data) {
        setReportData(res.data);
      }
    } catch {
      toast.error('Gagal memuat laporan keuangan institusi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLaporan();
  }, []);

  const lr = reportData?.laba_rugi;
  const neraca = reportData?.neraca;
  const cf = reportData?.arus_kas;
  const ekuitas = reportData?.perubahan_ekuitas;
  const periode = reportData?.periode || 'Periode Berjalan';

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-16">
      <PageHeader
        title="Portal 4 Laporan Keuangan Utama"
        description="Laporan Laba Rugi, Neraca Posisi Keuangan, Arus Kas, & Laporan Perubahan Ekuitas Kampus"
        action={
          <div className="flex items-center gap-2">
            <Link href="/sikeu/akuntansi" className="btn btn-secondary btn-icon">
              <ArrowLeft size={18} />
            </Link>
            <Button
              variant="outline"
              icon={<Printer size={16} />}
              onClick={() => window.print()}
              className="font-bold print:hidden"
            >
              Cetak Laporan
            </Button>
          </div>
        }
      />

      {/* Financial Statement Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-6 pt-3 rounded-t-xl overflow-x-auto print:hidden shadow-2xs">
        <button
          onClick={() => setActiveTab('laba_rugi')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 shrink-0 transition-colors ${
            activeTab === 'laba_rugi' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <TrendingUp size={16} /> 1. Laba Rugi / Aktivitas
        </button>
        <button
          onClick={() => setActiveTab('neraca')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 shrink-0 transition-colors ${
            activeTab === 'neraca' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <PieChart size={16} /> 2. Neraca / Posisi Keuangan
        </button>
        <button
          onClick={() => setActiveTab('arus_kas')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 shrink-0 transition-colors ${
            activeTab === 'arus_kas' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <DollarSign size={16} /> 3. Laporan Arus Kas
        </button>
        <button
          onClick={() => setActiveTab('ekuitas')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 shrink-0 transition-colors ${
            activeTab === 'ekuitas' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Layers size={16} /> 4. Perubahan Ekuitas
        </button>
      </div>

      {loading ? (
        <Card>
          <CardBody className="py-16 text-center text-slate-400 space-y-3">
            <Loader2 size={32} className="animate-spin mx-auto text-primary-600" />
            <p className="font-semibold text-sm">Menghitung dan menyusun laporan keuangan riil...</p>
          </CardBody>
        </Card>
      ) : (
        <>
          {/* Tab Content 1: Laba Rugi */}
          {activeTab === 'laba_rugi' && (
            <Card>
              <CardBody className="space-y-6 p-6">
                <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                  <h2 className="text-base font-extrabold text-slate-900">
                    Laporan Aktivitas & Laba Rugi ({periode})
                  </h2>
                  <span className="text-xs font-mono text-slate-400">Standard PSAK No. 45</span>
                </div>
                <div className="space-y-6 text-sm">
                  <div>
                    <h3 className="font-bold text-emerald-700 uppercase text-xs tracking-wider mb-2.5">
                      I. PENDAPATAN OPERASIONAL & PENERIMAAN
                    </h3>
                    <div className="space-y-2 pl-4">
                      <div className="flex justify-between text-slate-700">
                        <span>Pendapatan UKT / SPP Mahasiswa</span>
                        <span className="font-mono font-semibold">{formatRupiah(lr?.pendapatan?.pendapatan_mahasiswa || 0)}</span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>Pendapatan Hibah Riset & PkM (SIPPM)</span>
                        <span className="font-mono font-semibold">{formatRupiah(lr?.pendapatan?.pendapatan_hibah || 0)}</span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>Pendapatan Donasi & Kerjasama Eksternal</span>
                        <span className="font-mono font-semibold">{formatRupiah(lr?.pendapatan?.pendapatan_eksternal || 0)}</span>
                      </div>
                      <div className="flex justify-between font-bold border-t border-slate-200 pt-2 text-slate-900">
                        <span>TOTAL PENDAPATAN</span>
                        <span className="font-mono text-emerald-700">{formatRupiah(lr?.pendapatan?.total_pendapatan || 0)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-rose-700 uppercase text-xs tracking-wider mb-2.5">
                      II. BEBAN OPERASIONAL KAMPUS
                    </h3>
                    <div className="space-y-2 pl-4">
                      <div className="flex justify-between text-slate-700">
                        <span>Beban Operasional & Kantor</span>
                        <span className="font-mono font-semibold">{formatRupiah(lr?.beban?.beban_operasional || 0)}</span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>Beban Pemeliharaan Sarana & Prasarana</span>
                        <span className="font-mono font-semibold">{formatRupiah(lr?.beban?.beban_pemeliharaan || 0)}</span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>Beban Laboratorium & Praktikum</span>
                        <span className="font-mono font-semibold">{formatRupiah(lr?.beban?.beban_laboratorium || 0)}</span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>Beban Gaji & Honorarium Pegawai</span>
                        <span className="font-mono font-semibold">{formatRupiah(lr?.beban?.beban_honorarium || 0)}</span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>Beban Lain-lain</span>
                        <span className="font-mono font-semibold">{formatRupiah(lr?.beban?.beban_lainnya || 0)}</span>
                      </div>
                      <div className="flex justify-between font-bold border-t border-slate-200 pt-2 text-slate-900">
                        <span>TOTAL BEBAN</span>
                        <span className="font-mono text-rose-700">{formatRupiah(lr?.beban?.total_beban || 0)}</span>
                      </div>
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl border flex justify-between items-center font-bold text-base ${
                    (lr?.surplus_defisit || 0) >= 0 ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' : 'bg-rose-50/80 border-rose-200 text-rose-950'
                  }`}>
                    <span>SURPLUS / (DEFISIT) BERSIH TAHUN BERJALAN</span>
                    <span className="font-mono text-xl tabular-nums">{formatRupiah(lr?.surplus_defisit || 0)}</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Tab Content 2: Neraca */}
          {activeTab === 'neraca' && (
            <Card>
              <CardBody className="space-y-6 p-6">
                <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                  <h2 className="text-base font-extrabold text-slate-900">
                    Laporan Posisi Keuangan / Neraca ({periode})
                  </h2>
                  <span className="text-xs font-mono text-slate-400">Aktiva = Pasiva (Balanced)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div className="space-y-3 bg-slate-50/60 p-4 rounded-xl border border-slate-200/80">
                    <h3 className="font-bold text-indigo-700 uppercase text-xs tracking-wider border-b border-slate-200 pb-2">
                      ASET (AKTIVA)
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-slate-700">
                        <span>Kas & Bank Kampus</span>
                        <span className="font-mono font-semibold">{formatRupiah(neraca?.aset?.kas_bank || 0)}</span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>Piutang SPP & UKT Mahasiswa</span>
                        <span className="font-mono font-semibold">{formatRupiah(neraca?.aset?.piutang_mahasiswa || 0)}</span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>Aset Tetap, Gedung & Peralatan</span>
                        <span className="font-mono font-semibold">{formatRupiah(neraca?.aset?.aset_tetap || 0)}</span>
                      </div>
                      <div className="flex justify-between font-extrabold border-t border-slate-200 pt-3 text-indigo-950 text-base">
                        <span>TOTAL ASET</span>
                        <span className="font-mono">{formatRupiah(neraca?.aset?.total_aset || 0)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 bg-slate-50/60 p-4 rounded-xl border border-slate-200/80">
                    <h3 className="font-bold text-purple-700 uppercase text-xs tracking-wider border-b border-slate-200 pb-2">
                      LIABILITAS & EKUITAS (PASIVA)
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-slate-700">
                        <span>Utang Pajak PPh/PPN Terutang</span>
                        <span className="font-mono font-semibold">{formatRupiah(neraca?.liabilitas?.utang_pajak || 0)}</span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>Ekuitas Dana Awal Institusi</span>
                        <span className="font-mono font-semibold">{formatRupiah(neraca?.ekuitas?.ekuitas_awal || 0)}</span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>Surplus Laba Tahun Berjalan</span>
                        <span className="font-mono font-semibold text-emerald-700">{formatRupiah(neraca?.ekuitas?.surplus_tahun_berjalan || 0)}</span>
                      </div>
                      <div className="flex justify-between font-extrabold border-t border-slate-200 pt-3 text-purple-950 text-base">
                        <span>TOTAL PASIVA</span>
                        <span className="font-mono">{formatRupiah(neraca?.total_pasiva || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Tab Content 3: Arus Kas */}
          {activeTab === 'arus_kas' && (
            <Card>
              <CardBody className="space-y-6 p-6">
                <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                  <h2 className="text-base font-extrabold text-slate-900">
                    Laporan Arus Kas / Cash Flow ({periode})
                  </h2>
                  <span className="text-xs font-mono text-slate-400">Metode Langsung (Direct Method)</span>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="font-medium text-slate-700">Arus Kas Bersih dari Aktivitas Operasional</span>
                    <span className="font-mono text-emerald-700 font-bold">{formatRupiah(cf?.arus_kas_operasional || 0)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="font-medium text-slate-700">Arus Kas dari Aktivitas Investasi</span>
                    <span className="font-mono text-slate-400">{formatRupiah(cf?.arus_kas_investasi || 0)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="font-medium text-slate-700">Arus Kas dari Aktivitas Pendanaan</span>
                    <span className="font-mono text-slate-400">{formatRupiah(cf?.arus_kas_pendanaan || 0)}</span>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between items-center font-bold text-emerald-950 text-base">
                    <span>SALDO AKHIR KAS & SETARA KAS</span>
                    <span className="font-mono text-xl">{formatRupiah(cf?.saldo_akhir_kas || 0)}</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Tab Content 4: Ekuitas */}
          {activeTab === 'ekuitas' && (
            <Card>
              <CardBody className="space-y-6 p-6">
                <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                  <h2 className="text-base font-extrabold text-slate-900">
                    Laporan Perubahan Ekuitas Dana ({periode})
                  </h2>
                  <span className="text-xs font-mono text-slate-400">Ekuitas Institusi Kampus</span>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-slate-100 text-slate-700">
                    <span>Saldo Ekuitas Awal Periode</span>
                    <span className="font-mono font-semibold">{formatRupiah(ekuitas?.saldo_awal || 0)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100 text-emerald-700">
                    <span>Surplus / (Defisit) Bersih Periode Berjalan</span>
                    <span className="font-mono font-bold">{formatRupiah(ekuitas?.surplus_defisit || 0)}</span>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 flex justify-between items-center font-bold text-purple-950 text-base">
                    <span>SALDO EKUITAS AKHIR PERIODE</span>
                    <span className="font-mono text-xl">{formatRupiah(ekuitas?.saldo_akhir || 0)}</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
