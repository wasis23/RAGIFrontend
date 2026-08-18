'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertCircle, CheckCircle, FileText, Download, Filter, RefreshCw, CheckCircle2, Search } from 'lucide-react';
import { sikeuService } from '@/services/sikeu.service';

export default function TaxReportPage() {
  const [taxData, setTaxData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterJenis, setFilterJenis] = useState<string>('semua');
  const [filterStatus, setFilterStatus] = useState<string>('semua');
  const [search, setSearch] = useState<string>('');

  const [summary, setSummary] = useState({
    total_terutang: 0,
    total_disetor: 0,
    total_keseluruhan: 0,
  });

  // Modal Setor Pajak
  const [isSetorModalOpen, setIsSetorModalOpen] = useState(false);
  const [selectedTax, setSelectedTax] = useState<any | null>(null);
  const [ntpnInput, setNtpnInput] = useState('');
  const [submittingSetor, setSubmittingSetor] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchTaxes = async () => {
    try {
      setLoading(true);
      const res = await sikeuService.getPajakList({
        search: search || undefined,
        jenis: filterJenis !== 'semua' ? filterJenis : undefined,
        status: filterStatus !== 'semua' ? filterStatus : undefined,
      });

      if (res.data) {
        setTaxData(Array.isArray(res.data) ? res.data : []);
      }
      if ((res as any).summary) {
        setSummary((res as any).summary);
      }
    } catch (e) {
      console.error('Failed to load tax records', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxes();
  }, [filterJenis, filterStatus]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTaxes();
  };

  const handleSetorPajak = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTax || !ntpnInput.trim()) return;

    try {
      setSubmittingSetor(true);
      await sikeuService.setorPajak(selectedTax.id, {
        ntpn: ntpnInput.trim(),
      });

      setFeedback(`Penyetoran Pajak ${selectedTax.nomor} dengan NTPN ${ntpnInput.trim()} berhasil dicatat dan jurnal penyetoran terposting.`);
      setIsSetorModalOpen(false);
      setSelectedTax(null);
      setNtpnInput('');
      fetchTaxes();
    } catch (err: any) {
      alert('Gagal mencatat penyetoran: ' + (err.message || 'Error'));
    } finally {
      setSubmittingSetor(false);
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 card p-6">
        <div className="flex items-center gap-3">
          <Link href="/sikeu" className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-600 transition">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="badge badge-purple">
                Tax & Fiscal Compliance
              </span>
              <span className="badge badge-green">
                PPh 21 / 23 / PPN 11%
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Laporan & Rekapitulasi Pajak Kampus</h1>
            <p className="text-xs text-slate-500">Monitoring Pemotongan & Penyetoran Pajak PPh 21, PPh 23, dan PPN 11% Terintegrasi</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-center gap-3">
            <AlertCircle size={22} className="text-amber-600" />
            <div>
              <div className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider">Total Pajak Terutang</div>
              <div className="text-base font-extrabold text-slate-900 font-mono">{formatRupiah(summary.total_terutang)}</div>
            </div>
          </div>
          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center gap-3">
            <CheckCircle2 size={22} className="text-emerald-600" />
            <div>
              <div className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider">Total Sudah Disetor</div>
              <div className="text-base font-extrabold text-slate-900 font-mono">{formatRupiah(summary.total_disetor)}</div>
            </div>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 size={18} /> {feedback}
        </div>
      )}

      {/* Filter & Actions */}
      <div className="card p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <form onSubmit={handleSearch} className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Cari no ref, vendor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </form>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Jenis Pajak:</span>
            <select
              value={filterJenis}
              onChange={(e) => setFilterJenis(e.target.value)}
              className="select select-sm"
            >
              <option value="semua">Semua Jenis Pajak</option>
              <option value="pph_21">PPh 21 (Honorarium SDM)</option>
              <option value="pph_23">PPh 23 (Jasa Vendor)</option>
              <option value="ppn_11">PPN 11% (Barang/Jasa)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="select select-sm"
            >
              <option value="semua">Semua Status</option>
              <option value="terutang">Terutang (Belum Setor)</option>
              <option value="disetor">Sudah Disetor (Ada NTPN)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchTaxes}
            disabled={loading}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition"
          >
            <Download size={14} /> Cetak Rekap Pajak
          </button>
        </div>
      </div>

      {/* Tax Table */}
      <div className="card p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase border-y border-slate-200">
              <tr>
                <th className="px-4 py-3">NO. REF PAJAK</th>
                <th className="px-4 py-3">JENIS PAJAK</th>
                <th className="px-4 py-3">URAIAN TRANSAKSI / VENDOR</th>
                <th className="px-4 py-3 text-right">NOMINAL PAJAK</th>
                <th className="px-4 py-3">BATAS SETOR</th>
                <th className="px-4 py-3">NTPN / BUKTI SETOR</th>
                <th className="px-4 py-3 text-center">STATUS</th>
                <th className="px-4 py-3 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    Memuat data pajak...
                  </td>
                </tr>
              ) : taxData.length > 0 ? (
                taxData.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-amber-700">{t.nomor}</td>
                    <td className="px-4 py-3 font-extrabold text-slate-900">{t.jenis}</td>
                    <td className="px-4 py-3 font-medium text-slate-700">
                      <div>{t.deskripsi}</div>
                      <div className="text-[10px] text-slate-400">Vendor: {t.vendor} | NPWP: {t.npwp}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-extrabold text-slate-900 text-sm">
                      {formatRupiah(t.nominal)}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">{t.jatuhTempo}</td>
                    <td className="px-4 py-3 font-mono font-bold text-indigo-700">{t.ntpn}</td>
                    <td className="px-4 py-3 text-center">
                      {t.status === 'disetor' ? (
                        <span className="inline-flex items-center gap-1 badge badge-green">
                          <CheckCircle size={12} /> Sudah Disetor
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 badge badge-yellow">
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
                          className="btn btn-primary btn-sm"
                        >
                          Input NTPN Setor
                        </button>
                      ) : (
                        <span className="text-slate-400 font-medium text-[11px]">Selesai Disetor</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    Belum ada kewajiban pajak yang tercatat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL INPUT BUKTI / NTPN PENYETORAN PAJAK */}
      {isSetorModalOpen && selectedTax && (
        <div className="modal-overlay">
          <div className="modal modal-sm">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-base text-slate-900">Input NTPN / Bukti Penyetoran Pajak</h3>
              <button onClick={() => setIsSetorModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <form onSubmit={handleSetorPajak} className="space-y-3">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div><span className="font-bold text-slate-600">No. Ref Pajak:</span> <span className="font-mono font-bold text-slate-900">{selectedTax.nomor}</span></div>
                <div><span className="font-bold text-slate-600">Jenis Pajak:</span> <span className="font-bold text-slate-900">{selectedTax.jenis}</span></div>
                <div><span className="font-bold text-slate-600">Nominal Setoran:</span> <span className="font-mono font-extrabold text-amber-700">{formatRupiah(selectedTax.nominal)}</span></div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nomor Transaksi Penerimaan Negara (NTPN) *</label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan kode NTPN resmi (16 karakter)..."
                  value={ntpnInput}
                  onChange={(e) => setNtpnInput(e.target.value)}
                  className="w-full text-xs font-mono font-bold border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSetorModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingSetor}
                  className="btn btn-primary disabled:opacity-50"
                >
                  {submittingSetor ? 'Menyimpan...' : 'Simpan Bukti Setor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
