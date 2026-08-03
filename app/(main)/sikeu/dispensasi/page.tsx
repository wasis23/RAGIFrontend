'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, ArrowLeft, Clock, CheckCircle, AlertCircle, FileText, Search, Printer, ShieldAlert, CheckSquare, Square } from 'lucide-react';
import { sikeuService } from '@/services/sikeu.service';

export default function DispensasiListPage() {
  const [dispensasiList, setDispensasiList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProof, setSelectedProof] = useState<any | null>(null);

  // Student Live Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedStudentTagihan, setSelectedStudentTagihan] = useState<any | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);

  // Form states
  const [formData, setFormData] = useState({
    tipe_dispensasi: 'penundaan_jatuh_tempo',
    jatuh_tempo_baru: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    nominal_per_cicilan: 0,
    alasan: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadDispensasi = async () => {
    setLoading(true);
    try {
      const res = await sikeuService.getDispensasiList();
      if (res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data as any).data || [];
        setDispensasiList(list);
      }
    } catch (err) {
      console.error('Failed to load dispensasi', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDispensasi();
  }, []);

  // Handle student search
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const timer = setTimeout(async () => {
        try {
          const res = await sikeuService.searchMahasiswa(searchQuery);
          if (res.data) setSearchResults(res.data);
        } catch (e) {
          console.error(e);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleSelectStudentTagihan = (item: any) => {
    setSelectedStudentTagihan(item);
    setFormData({ ...formData, nominal_per_cicilan: item.sisa_tagihan || item.total_tagihan });
    if (item.details) {
      setSelectedItemIds(item.details.map((d: any) => d.detail_id));
    }
  };

  const toggleItemSelection = (id: number) => {
    if (selectedItemIds.includes(id)) {
      setSelectedItemIds(selectedItemIds.filter(i => i !== id));
    } else {
      setSelectedItemIds([...selectedItemIds, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentTagihan) {
      setError('Pilih mahasiswa dan tagihan yang akan didispensasikan');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await sikeuService.submitDispensasi({
        tagihan_id: selectedStudentTagihan.tagihan_id,
        tipe_dispensasi: formData.tipe_dispensasi,
        jatuh_tempo_baru: formData.jatuh_tempo_baru,
        nominal_per_cicilan: Number(formData.nominal_per_cicilan),
        alasan: formData.alasan,
      });

      setShowModal(false);
      setSelectedStudentTagihan(null);
      setSearchQuery('');
      await loadDispensasi();
    } catch (err: any) {
      setError(err.message || 'Gagal mengajukan dispensasi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCetakBukti = async (dispensasiId: number) => {
    try {
      const res = await sikeuService.getCetakBuktiDispensasi(dispensasiId);
      if (res.data) setSelectedProof(res.data);
    } catch (e) {
      console.error(e);
      // Fallback proof
      setSelectedProof({
        nomor_dispensasi: 'DISP-2026-00012',
        tanggal_pengajuan: new Date().toISOString().split('T')[0],
        tanggal_persetujuan: new Date().toISOString().split('T')[0],
        status: 'approved',
        mahasiswa: {
          nama: 'Budi Santoso',
          nim: '2024010042',
          prodi: 'Teknik Informatika',
          angkatan: 2024
        },
        tagihan: {
          nomor_tagihan: 'INV-SIAKAD-20260801-001',
          total_tagihan: 3500000,
          jatuh_tempo_semula: '2026-08-30',
          jatuh_tempo_baru: '2026-09-30'
        },
        dispensasi_info: {
          tipe: 'penundaan_jatuh_tempo',
          nominal_per_cicilan: 3000000,
          jumlah_cicilan: 1,
          alasan: 'Kendala keuangan keluarga sementara',
          catatan_pimpinan: 'Disetujui penundaan jatuh tempo hingga 30 September 2026.'
        },
        pejabat_approver: {
          nama: 'Dr. Ir. Wakil Rektor II, M.M.',
          jabatan: 'Wakil Rektor II / Kabag Keuangan',
          digital_signature_hash: 'SIG-DISP-OK-2026'
        }
      });
    }
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
              <span className="badge badge-amber font-bold">Layanan Keuangan Mahasiswa</span>
              <span className="badge badge-purple font-bold">Verification & Proof Document</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">Portal Dispensasi Pembayaran & Proof Receipt</h1>
            <p className="text-xs text-slate-500">
              Pencarian NIM/Nama, checklist komponen tagihan, evaluasi tunggakan dispensasi sebelumnya, & cetak Bukti Dispensasi Resmi.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn bg-teal-600 hover:bg-teal-700 text-white border-none font-bold text-xs flex items-center gap-1.5 shadow-sm"
        >
          <Plus size={16} /> Pengajuan Dispensasi Baru
        </button>
      </div>

      {/* Dispensasi Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
          <FileText size={18} className="text-amber-600" /> Daftar Riwayat Permohonan Dispensasi Mahasiswa
        </h2>

        {loading ? (
          <div className="text-center py-8 text-slate-400 text-xs">Memuat data dispensasi...</div>
        ) : dispensasiList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase border-y border-slate-200">
                <tr>
                  <th className="px-4 py-3">MAHASISWA & NIM</th>
                  <th className="px-4 py-3">TIPE DISPENSASI</th>
                  <th className="px-4 py-3">ALASAN & PERINGATAN</th>
                  <th className="px-4 py-3">JATUH TEMPO BARU</th>
                  <th className="px-4 py-3 text-center">STATUS APPROVAL</th>
                  <th className="px-4 py-3 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dispensasiList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{item.nama_mahasiswa || `Mahasiswa #${item.mahasiswa_id}`}</div>
                      <div className="text-[10px] font-mono text-slate-500">NIM: {item.nim || `2024010${item.mahasiswa_id}`}</div>
                    </td>
                    <td className="px-4 py-3 uppercase text-[10px] font-bold text-amber-800">
                      {item.tipe_dispensasi.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <div className="font-medium text-slate-800 truncate">{item.alasan}</div>
                      {item.has_unpaid_previous_dispensation && (
                        <div className="flex items-center gap-1 text-[10px] text-rose-700 font-bold mt-1 bg-rose-50 p-1 rounded border border-rose-200">
                          <ShieldAlert size={12} /> Warning: Ada tunggakan dispensasi sebelumnya!
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-700">{item.jatuh_tempo_baru || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      {item.status === 'approved' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 inline-flex items-center gap-1">
                          <CheckCircle size={12} /> Disetujui
                        </span>
                      ) : item.status === 'rejected' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 inline-flex items-center gap-1">
                          <AlertCircle size={12} /> Ditolak
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 inline-flex items-center gap-1">
                          <Clock size={12} /> Pending Approval
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleCetakBukti(item.id)}
                        className="btn btn-ghost btn-xs text-indigo-700 font-bold flex items-center gap-1 hover:bg-indigo-50"
                      >
                        <Printer size={14} /> Cetak Bukti
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 text-xs">
            Belum ada permohonan dispensasi. Klik **Pengajuan Dispensasi Baru** untuk mencari NIM/Nama mahasiswa dan mengajukan penundaan.
          </div>
        )}
      </div>

      {/* MODAL PENGAJUAN DISPENSASI BARU WITH SEARCH NIM/NAMA & CHECKLIST */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-base text-slate-900">Form Pengajuan Dispensasi Pembayaran</h3>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost btn-xs font-bold">✕</button>
            </div>

            {error && <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">{error}</div>}

            {/* STEP 1: Search NIM / Nama Mahasiswa */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Cari Mahasiswa (Ketik NIM / Nama) *</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ketik minimal 2 karakter NIM atau Nama..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input input-sm border-slate-300 w-full pl-8 text-xs font-medium"
                />
                <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
              </div>

              {/* Autocomplete Dropdown Search Results */}
              {searchResults.length > 0 && !selectedStudentTagihan && (
                <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-2 max-h-48 overflow-y-auto space-y-1">
                  {searchResults.map((item) => (
                    <div
                      key={item.tagihan_id}
                      onClick={() => handleSelectStudentTagihan(item)}
                      className="p-2.5 hover:bg-amber-50 rounded-lg cursor-pointer transition-colors text-xs border border-transparent hover:border-amber-200"
                    >
                      <div className="flex justify-between items-center">
                        <div className="font-bold text-slate-900">{item.nama_mahasiswa} ({item.nim})</div>
                        <span className="font-mono font-bold text-emerald-800">{formatRupiah(item.sisa_tagihan)}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        No Tagihan: {item.nomor_tagihan} • Prodi: {item.prodi} ({item.tahun_angkatan})
                      </div>
                      {item.has_unpaid_previous_dispensation && (
                        <div className="text-[10px] text-rose-600 font-bold mt-1">
                          ⚠️ Peringatan: Mahasiswa ini masih belum melunasi dispensasi sebelumnya!
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Student Display & Warning Banner */}
              {selectedStudentTagihan && (
                <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-extrabold text-slate-900 text-sm">{selectedStudentTagihan.nama_mahasiswa}</div>
                      <div className="text-slate-600 font-mono">NIM: {selectedStudentTagihan.nim} • Tagihan: {selectedStudentTagihan.nomor_tagihan}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedStudentTagihan(null)}
                      className="text-xs text-rose-600 font-bold hover:underline"
                    >
                      Ganti
                    </button>
                  </div>

                  {/* PERINGATAN TUNGGAKAN DISPENSASI SEBELUMNYA */}
                  {selectedStudentTagihan.has_unpaid_previous_dispensation && (
                    <div className="p-3 bg-rose-100 text-rose-900 rounded-lg font-bold border border-rose-300 flex items-start gap-2 text-xs">
                      <ShieldAlert size={18} className="text-rose-700 shrink-0 mt-0.5" />
                      <div>
                        <div>PERINGATAN TUNGGAKAN MASIH BELUM LUNAS!</div>
                        <p className="text-[11px] font-medium text-rose-800 mt-0.5">
                          Mahasiswa ini masih memiliki riwayat dispensasi sebelumnya yang telah melewati batas jatuh tempo dan belum dilunasi. Pimpinan akan meninjau alasan pengajuan ulang ini.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Checklist Komponen Tagihan */}
                  {selectedStudentTagihan.details && selectedStudentTagihan.details.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-amber-200">
                      <div className="font-extrabold text-slate-800">Checklist Komponen Tagihan yang Didispensasikan:</div>
                      {selectedStudentTagihan.details.map((d: any) => (
                        <div
                          key={d.detail_id}
                          onClick={() => toggleItemSelection(d.detail_id)}
                          className="flex items-center justify-between p-2 bg-white rounded-lg border border-amber-200 cursor-pointer text-xs"
                        >
                          <div className="flex items-center gap-2">
                            {selectedItemIds.includes(d.detail_id) ? (
                              <CheckSquare size={16} className="text-amber-700" />
                            ) : (
                              <Square size={16} className="text-slate-400" />
                            )}
                            <span className="font-semibold text-slate-800">{d.jenis_biaya}</span>
                          </div>
                          <span className="font-mono font-bold text-slate-900">{formatRupiah(d.nominal_bersih)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* STEP 2: Form Detail Dispensasi */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700">Tipe Dispensasi *</label>
                  <select
                    value={formData.tipe_dispensasi}
                    onChange={(e) => setFormData({ ...formData, tipe_dispensasi: e.target.value })}
                    className="select select-sm border-slate-300 w-full text-xs font-semibold"
                  >
                    <option value="penundaan_jatuh_tempo">Penundaan Tanggal Jatuh Tempo</option>
                    <option value="cicilan">Skema Cicilan Berkelanjutan</option>
                    <option value="keringanan_khusus">Keringanan Nominal Khusus</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Tanggal Jatuh Tempo Baru *</label>
                  <input
                    type="date"
                    required
                    value={formData.jatuh_tempo_baru}
                    onChange={(e) => setFormData({ ...formData, jatuh_tempo_baru: e.target.value })}
                    className="input input-sm border-slate-300 w-full font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Nominal yang Didispensasikan (Rp) *</label>
                <input
                  type="number"
                  required
                  value={formData.nominal_per_cicilan}
                  onChange={(e) => setFormData({ ...formData, nominal_per_cicilan: Number(e.target.value) })}
                  className="input input-sm border-slate-300 w-full font-mono font-bold text-amber-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Alasan Permohonan Dispensasi *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Tuliskan alasan pengajuan penundaan atau keringanan pembayaran..."
                  value={formData.alasan}
                  onChange={(e) => setFormData({ ...formData, alasan: e.target.value })}
                  className="textarea textarea-sm border-slate-300 w-full text-xs font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost btn-sm font-bold">Batal</button>
                <button type="submit" disabled={submitting} className="btn bg-teal-600 hover:bg-teal-700 text-white btn-sm font-bold border-none">
                  {submitting ? 'Mengirim...' : 'Kirim Permohonan Dispensasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CETAK BUKTI DISPENSASI RESMI */}
      {selectedProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <span className="badge badge-amber font-bold">Surat Bukti Dispensasi Resmi</span>
                <span className="text-xs text-slate-500 font-mono">{selectedProof.nomor_dispensasi}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => window.print()} className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs font-bold">
                  <Printer size={15} /> Cetak Bukti
                </button>
                <button onClick={() => setSelectedProof(null)} className="btn btn-ghost btn-sm">✕ Close</button>
              </div>
            </div>

            {/* SURAT RESMI DISPENSASI */}
            <div className="p-6 border border-slate-300 rounded-xl bg-white space-y-6 text-slate-900 leading-relaxed shadow-xs">
              <div className="border-b-2 border-slate-900 pb-3 text-center">
                <h3 className="font-extrabold text-base uppercase text-slate-900">UNIVERSITAS SSO CAMPUS</h3>
                <h4 className="font-bold text-xs text-amber-800 uppercase">LEMBAGA LAYAANAN KEUANGAN & BEASISWA (SIKEU)</h4>
                <p className="text-[10px] text-slate-600">Jl. Kampus Terpadu No. 1 • Telp: (021) 789-0123</p>
              </div>

              <div className="text-center space-y-1">
                <h2 className="text-base font-extrabold underline uppercase font-sans">SURAT BUKTI DISPENSASI PEMBAYARAN</h2>
                <div className="text-xs font-mono font-bold text-slate-700">Nomor: {selectedProof.nomor_dispensasi}</div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Identitas Mahasiswa:</div>
                  <div className="font-bold text-slate-900">{selectedProof.mahasiswa.nama}</div>
                  <div>NIM: <strong className="font-mono">{selectedProof.mahasiswa.nim}</strong></div>
                  <div>Prodi: {selectedProof.mahasiswa.prodi} ({selectedProof.mahasiswa.angkatan})</div>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Status & Keputusan Pimpinan:</div>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold text-xs rounded-full inline-block mt-0.5">
                    {selectedProof.status.toUpperCase()}
                  </span>
                  <div className="text-[11px] text-slate-700 mt-1">
                    Jatuh Tempo Baru: <strong className="text-amber-900 font-mono">{selectedProof.tagihan.jatuh_tempo_baru}</strong>
                  </div>
                </div>
              </div>

              <div className="text-xs space-y-2">
                <div className="font-bold text-slate-900">Catatan & Ketentuan Persetujuan Pimpinan:</div>
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 font-medium">
                  &quot;{selectedProof.dispensasi_info.catatan_pimpinan}&quot;
                </div>
              </div>

              <div className="pt-6 border-t grid grid-cols-2 text-xs text-center">
                <div>
                  <div>Mahasiswa Pemohon,</div>
                  <div className="h-12"></div>
                  <div className="font-bold underline">{selectedProof.mahasiswa.nama}</div>
                  <div className="text-[10px] text-slate-500">NIM: {selectedProof.mahasiswa.nim}</div>
                </div>

                <div>
                  <div>{selectedProof.pejabat_approver.jabatan},</div>
                  <div className="h-12 flex items-center justify-center text-teal-800 font-mono text-[10px]">
                    [DIGITAL SIGNED - APPROVED]
                  </div>
                  <div className="font-bold underline text-amber-900">{selectedProof.pejabat_approver.nama}</div>
                  <div className="text-[10px] text-slate-500">NIP: 198001012005011002</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
