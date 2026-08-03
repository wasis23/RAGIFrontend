'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertCircle, CheckCircle, FileText, Download, Filter, Plus, CheckCircle2 } from 'lucide-react';

export default function TaxReportPage() {
  const [taxData, setTaxData] = useState([
    { id: 1, nomor: 'TAX-202608-001', jenis: 'PPh 21', deskripsi: 'Pajak Penghasilan Gaji Pegawai & Dosen Tetap', nominal: 7500000, status: 'terutang', jatuhTempo: '2026-09-10', ntpn: '-' },
    { id: 2, nomor: 'TAX-202608-002', jenis: 'PPh 23', deskripsi: 'Pajak Pemeliharaan Server Cloud & Software TI', nominal: 1800000, status: 'terutang', jatuhTempo: '2026-09-10', ntpn: '-' },
    { id: 3, nomor: 'TAX-202608-003', jenis: 'PPN 11%', deskripsi: 'Pajak Pengadaan Perangkat Komputer Lab', nominal: 3200000, status: 'disetor', jatuhTempo: '2026-08-31', ntpn: '0981273918237912' },
    { id: 4, nomor: 'TAX-202608-004', jenis: 'PPh 21', deskripsi: 'Pajak Honorarium Narasumber Seminar & Jurnal', nominal: 1250000, status: 'disetor', jatuhTempo: '2026-08-15', ntpn: '5561273918237900' },
  ]);

  const [filterJenis, setFilterJenis] = useState<string>('semua');
  const [filterStatus, setFilterStatus] = useState<string>('semua');

  // Modal Setor Pajak
  const [isSetorModalOpen, setIsSetorModalOpen] = useState(false);
  const [selectedTax, setSelectedTax] = useState<any | null>(null);
  const [ntpnInput, setNtpnInput] = useState('');

  const [feedback, setFeedback] = useState<string | null>(null);

  const filteredTax = taxData.filter((t) => {
    const matchJenis = filterJenis === 'semua' || t.jenis === filterJenis;
    const matchStatus = filterStatus === 'semua' || t.status === filterStatus;
    return matchJenis && matchStatus;
  });

  const totalTerutang = taxData.filter(t => t.status === 'terutang').reduce((sum, t) => sum + t.nominal, 0);
  const totalDisetor = taxData.filter(t => t.status === 'disetor').reduce((sum, t) => sum + t.nominal, 0);

  const handleSetorPajak = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTax || !ntpnInput.trim()) return;

    setTaxData(taxData.map(t => t.id === selectedTax.id ? { ...t, status: 'disetor', ntpn: ntpnInput } : t));
    setFeedback(`Penyetoran Pajak ${selectedTax.nomor} dengan NTPN ${ntpnInput} berhasil dicatat.`);
    setIsSetorModalOpen(false);
    setSelectedTax(null);
    setNtpnInput('');
  };

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
              <span className="badge badge-purple font-bold">Tax & Fiscal Compliance</span>
              <span className="badge badge-green font-bold">PPh 21/23/PPN</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">Laporan & Rekapitulasi Pajak Kampus</h1>
            <p className="text-xs text-slate-500">Monitoring Pemotongan & Penyetoran Pajak PPh 21, PPh 23, dan PPN 11% Terintegrasi</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center gap-3">
            <AlertCircle size={22} className="text-amber-600" />
            <div>
              <div className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider">Total Pajak Terutang</div>
              <div className="text-base font-extrabold text-slate-900">{formatRupiah(totalTerutang)}</div>
            </div>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-3">
            <CheckCircle2 size={22} className="text-emerald-600" />
            <div>
              <div className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider">Total Sudah Disetor</div>
              <div className="text-base font-extrabold text-slate-900">{formatRupiah(totalDisetor)}</div>
            </div>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm font-bold flex items-center gap-2">
          <CheckCircle2 size={18} /> {feedback}
        </div>
      )}

      {/* Filter & Actions */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Jenis Pajak:</span>
            <select
              value={filterJenis}
              onChange={(e) => setFilterJenis(e.target.value)}
              className="select select-sm border-slate-300 text-xs font-bold rounded-xl"
            >
              <option value="semua">Semua Jenis Pajak</option>
              <option value="PPh 21">PPh 21 (Gaji/Honor)</option>
              <option value="PPh 23">PPh 23 (Jasa Vendor)</option>
              <option value="PPN 11%">PPN 11% (Barang/Jasa)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Status Penyetoran:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="select select-sm border-slate-300 text-xs font-bold rounded-xl"
            >
              <option value="semua">Semua Status</option>
              <option value="terutang">Terutang (Belum Setor)</option>
              <option value="disetor">Sudah Disetor (Ada NTPN)</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="btn btn-ghost btn-sm text-slate-700 font-bold flex items-center gap-1.5"
        >
          <Download size={16} /> Cetak Rekap Pajak
        </button>
      </div>

      {/* Tax Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase border-y border-slate-200">
              <tr>
                <th className="px-4 py-3">NO. REF PAJAK</th>
                <th className="px-4 py-3">JENIS PAJAK</th>
                <th className="px-4 py-3">URAIAN TRANSAKSI</th>
                <th className="px-4 py-3 text-right">NOMINAL PAJAK (RP)</th>
                <th className="px-4 py-3">BATAS PENYETORAN</th>
                <th className="px-4 py-3">NTPN / NO BUKTI SETOR</th>
                <th className="px-4 py-3 text-center">STATUS SETOR</th>
                <th className="px-4 py-3 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTax.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-mono font-extrabold text-amber-700">{t.nomor}</td>
                  <td className="px-4 py-3 font-extrabold text-slate-900">{t.jenis}</td>
                  <td className="px-4 py-3 font-medium text-slate-700">{t.deskripsi}</td>
                  <td className="px-4 py-3 text-right font-mono font-extrabold text-slate-900 text-sm">
                    {formatRupiah(t.nominal)}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600">{t.jatuhTempo}</td>
                  <td className="px-4 py-3 font-mono font-bold text-indigo-700">{t.ntpn}</td>
                  <td className="px-4 py-3 text-center">
                    {t.status === 'disetor' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        <CheckCircle size={12} /> Sudah Disetor
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700">
                        <AlertCircle size={12} /> Terutang
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {t.status === 'terutang' ? (
                      <button
                        onClick={() => {
                          setSelectedTax(t);
                          setNtpnInput('');
                          setIsSetorModalOpen(true);
                        }}
                        className="btn bg-amber-600 hover:bg-amber-700 text-white btn-xs font-bold border-none"
                      >
                        Input NTPN Setor
                      </button>
                    ) : (
                      <span className="text-slate-400 font-medium text-[11px]">Selesai</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL INPUT BUKTI / NTPN PENYETORAN PAJAK */}
      {isSetorModalOpen && selectedTax && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-base text-slate-900">Input NTPN / Bukti Penyetoran Pajak</h3>
              <button onClick={() => setIsSetorModalOpen(false)} className="btn btn-ghost btn-xs font-bold">✕</button>
            </div>
            <form onSubmit={handleSetorPajak} className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div><span className="font-bold">No. Ref:</span> {selectedTax.nomor}</div>
                <div><span className="font-bold">Jenis Pajak:</span> {selectedTax.jenis}</div>
                <div><span className="font-bold">Nominal:</span> <span className="font-mono font-bold text-amber-700">{formatRupiah(selectedTax.nominal)}</span></div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Nomor Transaksi Penerimaan Negara (NTPN) *</label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan 16 digit kode NTPN bank/pos..."
                  value={ntpnInput}
                  onChange={(e) => setNtpnInput(e.target.value)}
                  className="input input-sm border-slate-300 w-full font-mono font-bold text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button type="button" onClick={() => setIsSetorModalOpen(false)} className="btn btn-ghost btn-sm font-bold">Batal</button>
                <button type="submit" className="btn bg-amber-600 hover:bg-amber-700 text-white btn-sm font-bold border-none">
                  Simpan Bukti Setor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
