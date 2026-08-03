'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, CreditCard, FileText, Printer, ShieldCheck, CheckCircle2, AlertCircle, Download, QrCode } from 'lucide-react';
import { sikeuService } from '@/services/sikeu.service';

export default function StudentTagihanPage() {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  const fetchMyBills = async () => {
    try {
      setLoading(true);
      const res = await sikeuService.getMyBills();
      if (res.data) setBills(res.data);
    } catch (e) {
      console.error(e);
      // Fallback mock bills for demonstration
      setBills([
        {
          id: 1,
          nomor_tagihan: 'INV-SIAKAD-20260801-001',
          tahun_akademik: '2025/2026 Ganjil',
          total_tagihan: 3500000,
          total_potongan: 500000,
          total_denda: 0,
          total_bayar: 0,
          sisa_bayar: 3000000,
          status: 'belum_bayar',
          jatuh_tempo: '2026-08-30',
          va_number: '880120260801001',
          bank_nama: 'Bank BNI (Virtual Account)',
          details: [
            { id: 101, nama_biaya: 'Uang Kuliah Tunggal (UKT)', nominal: 3500000, potongan: 500000, nominal_bersih: 3000000 }
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenInvoice = async (tagihanId: number) => {
    try {
      const res = await sikeuService.getInvoice(tagihanId);
      if (res.data) setSelectedInvoice(res.data);
    } catch (e) {
      console.error(e);
      // Fallback invoice object
      setSelectedInvoice({
        invoice_number: 'INV-SIAKAD-20260801-001',
        tanggal_terbit: new Date().toISOString().split('T')[0],
        jatuh_tempo: '2026-08-30',
        mahasiswa: {
          nama: 'Budi Santoso',
          nim: '2024010042',
          prodi: 'Teknik Informatika',
          angkatan: 2024
        },
        virtual_account: {
          bank: 'Bank BNI (Virtual Account)',
          va_number: '880120260801001',
          nominal_instruksi: 3000000,
          expired_at: '2026-08-30 23:59:59'
        },
        ringkasan: {
          subtotal: 3500000,
          potongan: 500000,
          denda: 0,
          total_dibayar: 0,
          sisa_tagihan: 3000000,
          status: 'belum_bayar'
        },
        items: [
          { deskripsi: 'Uang Kuliah Tunggal (UKT) Semester 3', nominal: 3500000, potongan: 500000, nominal_bersih: 3000000 }
        ]
      });
    }
  };

  useEffect(() => {
    fetchMyBills();
  }, []);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/sikeu" className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-600 transition">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="badge badge-green font-bold">Portal Mandiri Mahasiswa</span>
              <span className="badge badge-purple font-bold">Billing & Virtual Account</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">Tagihan Saya & Mandiri Invoice</h1>
            <p className="text-xs text-slate-500">
              Lihat status tagihan semester berjalan, cetak Surat Tagihan Invoice resmi, dan dapatkan Nomor Virtual Account.
            </p>
          </div>
        </div>
      </div>

      {/* Daftar Tagihan */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-4">
        <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
          <CreditCard size={18} className="text-teal-600" /> Daftar Tagihan Pendidikan Semester Berjalan
        </h2>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-slate-400 text-xs">Memuat tagihan anda...</div>
          ) : bills.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">Tidak ada tagihan aktif untuk akun anda.</div>
          ) : (
            bills.map((b) => (
              <div key={b.id} className="p-5 border border-slate-200 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-all space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-800">{b.nomor_tagihan}</span>
                      <span className="badge badge-gray text-[10px]">{b.tahun_akademik}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Jatuh Tempo: <strong>{b.jatuh_tempo || '-'}</strong></div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
                      b.status === 'lunas'
                        ? 'bg-emerald-100 text-emerald-800'
                        : b.status === 'dispensasi'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {b.status.replace('_', ' ')}
                    </span>
                    <button
                      onClick={() => handleOpenInvoice(b.id)}
                      className="btn bg-teal-700 hover:bg-teal-800 text-white btn-sm font-bold text-xs border-none flex items-center gap-1.5 shadow-sm"
                    >
                      <FileText size={15} /> Cetak Invoice & VA
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <div className="text-slate-500 font-medium">Total Nominal Tagihan</div>
                    <div className="font-mono font-extrabold text-slate-900 text-sm mt-0.5">{formatRupiah(b.total_tagihan)}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 font-medium">Potongan / Beasiswa</div>
                    <div className="font-mono font-bold text-emerald-700 text-sm mt-0.5">-{formatRupiah(b.total_potongan)}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 font-medium">Nominal Telah Dibayar</div>
                    <div className="font-mono font-bold text-indigo-700 text-sm mt-0.5">{formatRupiah(b.total_bayar)}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 font-medium">Sisa Harus Dibayar</div>
                    <div className="font-mono font-extrabold text-rose-700 text-sm mt-0.5">{formatRupiah(b.sisa_bayar)}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL INVOICE MAHASISWA CETAK MANDIRI */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <span className="badge badge-purple font-bold">Surat Tagihan Resmi (Invoice)</span>
                <span className="text-xs text-slate-500 font-mono">{selectedInvoice.invoice_number}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => window.print()} className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs font-bold">
                  <Printer size={15} /> Cetak Invoice
                </button>
                <button onClick={() => setSelectedInvoice(null)} className="btn btn-ghost btn-sm">✕ Close</button>
              </div>
            </div>

            {/* DOKUMEN CETAK INVOICE MANDIRI */}
            <div className="p-6 border border-slate-300 rounded-xl bg-white space-y-6 text-slate-900 leading-relaxed shadow-xs">
              {/* Kop Invoice */}
              <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
                <div>
                  <h3 className="font-extrabold text-base tracking-wider uppercase text-slate-900">UNIVERSITAS SSO CAMPUS</h3>
                  <h4 className="font-bold text-xs text-teal-800 uppercase">DIREKTORAT KEUANGAN & AKUNTANSI (SIKEU)</h4>
                  <p className="text-[10px] text-slate-600">Jl. Kampus Terpadu No. 1 • Telp: (021) 789-0123 • Email: keu@campus.ac.id</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-extrabold text-indigo-900 uppercase tracking-widest font-mono">INVOICE</div>
                  <div className="text-xs font-mono font-bold text-slate-700">{selectedInvoice.invoice_number}</div>
                </div>
              </div>

              {/* Data Mahasiswa & VA */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase">Ditujukan Kepada (Mahasiswa):</div>
                  <div className="font-bold text-slate-900">{selectedInvoice.mahasiswa.nama}</div>
                  <div>NIM: <strong className="font-mono">{selectedInvoice.mahasiswa.nim}</strong></div>
                  <div>Program Studi: {selectedInvoice.mahasiswa.prodi} (Angkatan {selectedInvoice.mahasiswa.angkatan})</div>
                </div>

                <div className="space-y-1 bg-white p-3 rounded-lg border border-teal-200">
                  <div className="text-[10px] font-extrabold text-teal-700 uppercase flex items-center gap-1">
                    <QrCode size={13} /> Nomor Virtual Account Pembayaran:
                  </div>
                  <div className="font-mono text-base font-extrabold text-teal-900 tracking-wider">
                    {selectedInvoice.virtual_account.va_number}
                  </div>
                  <div className="text-[10px] font-bold text-slate-600">{selectedInvoice.virtual_account.bank}</div>
                  <div className="text-[10px] text-rose-600">Batas Waktu: {selectedInvoice.virtual_account.expired_at}</div>
                </div>
              </div>

              {/* Rincian Items */}
              <div className="space-y-2">
                <div className="text-xs font-extrabold text-slate-900 uppercase">Rincian Komponen Tagihan Pendidikan:</div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-y">
                    <tr>
                      <th className="py-2 px-3">Komponen Biaya</th>
                      <th className="py-2 px-3 text-right">Nominal</th>
                      <th className="py-2 px-3 text-right">Potongan</th>
                      <th className="py-2 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedInvoice.items.map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 font-medium">{item.deskripsi}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{formatRupiah(item.nominal)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-700">-{formatRupiah(item.potongan)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">{formatRupiah(item.nominal_bersih)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Summary */}
              <div className="flex justify-end pt-2">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Total Tagihan:</span>
                    <span className="font-mono font-bold">{formatRupiah(selectedInvoice.ringkasan.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span>Total Beasiswa/Potongan:</span>
                    <span className="font-mono font-bold">-{formatRupiah(selectedInvoice.ringkasan.potongan)}</span>
                  </div>
                  <div className="flex justify-between text-base font-extrabold border-t pt-2 text-slate-900">
                    <span>Sisa Harus Dibayar:</span>
                    <span className="font-mono text-teal-800">{formatRupiah(selectedInvoice.ringkasan.sisa_tagihan)}</span>
                  </div>
                </div>
              </div>

              {/* Footer Validasi Digital */}
              <div className="pt-4 border-t flex justify-between items-center text-[10px] text-slate-400 font-mono">
                <span>Dokumen Invoice Resmi Terbit Otomatis via SIKEU System</span>
                <span>SECURITY CODE: #{selectedInvoice.invoice_number}-VALID</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
