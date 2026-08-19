'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, DollarSign, CheckCircle, ShieldCheck, Wallet, ArrowUpRight, ArrowDownLeft, Clock, FileText, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { sikeuService } from '@/services/sikeu.service';

export default function UnitKasPage() {
  // Master Data Unit
  const [unitList, setUnitList] = useState<any[]>([]);

  const [kasList] = useState([
    { id: 1, nama: 'Kas Kabag Keuangan (Kas Utama Kabag)', saldoAwal: 500000000, saldoSaatIni: 883000000, pj: 'Kabag Keuangan', deskripsi: 'Kas Utama Operasional & Verifikasi Bagian Keuangan', isKabag: true, status: true },
    { id: 2, nama: 'Petty Cash Fakultas Teknik & TIK', saldoAwal: 10000000, saldoSaatIni: 10000000, pj: 'Kabag TU FTIK', deskripsi: 'Kas operasional kecil fakultas', isKabag: false, status: true },
    { id: 3, nama: 'Petty Cash Fakultas Ekonomi & Bisnis', saldoAwal: 15000000, saldoSaatIni: 12500000, pj: 'Kasir FEB', deskripsi: 'Kas operasional harian FEB', isKabag: false, status: true },
    { id: 4, nama: 'Kas Operasional SPMB', saldoAwal: 5000000, saldoSaatIni: 15000000, pj: 'Panitia SPMB', deskripsi: 'Kas tunai operasional kasir SPMB', isKabag: false, status: true },
  ]);

  // List of Unit Cash Requests / Proposals submitted to Kabag
  const [pengajuanKasList, setPengajuanKasList] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [unitRes, pengajuanRes] = await Promise.all([
        sikeuService.getUnitKasList(),
        sikeuService.getPengajuanKasList()
      ]);
      setUnitList(unitRes.data || []);
      setPengajuanKasList(pengajuanRes.data || []);
    } catch (error: any) {
      setFeedback({ type: 'error', message: 'Gagal memuat data: ' + error.message });
    }
  };

  // Modal States
  const [isPengajuanModalOpen, setIsPengajuanModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  
  // Kabag Approval Modal States
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [approvingItem, setApprovingItem] = useState<any | null>(null);
  const [approveForm, setApproveForm] = useState({ catatan_kabag: '' });

  const [pengajuanForm, setPengajuanForm] = useState({
    unit_pemohon: unitList[0]?.nama || '',
    jenis_pengajuan: 'Pengisian Uang Muka Operasional (Petty Cash)',
    jenis_pengajuan_manual: '',
    nominal: '5000000',
    rekening_tujuan: 'BNI - 1234567890 (a.n Operasional FTIK)',
    keterangan: 'Pengisian ulang saldo kas tunai operasional unit',
  });

  const [transferForm, setTransferForm] = useState({
    ke_kas_id: 1,
    nominal: 5000000,
    keterangan: 'Penyetoran mutasi pendapatan unit ke Kas Kabag Keuangan',
  });

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleCreatePengajuan = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalJenisPengajuan = pengajuanForm.jenis_pengajuan === 'lainnya' ? pengajuanForm.jenis_pengajuan_manual : pengajuanForm.jenis_pengajuan;

    if (pengajuanForm.jenis_pengajuan === 'lainnya' && !pengajuanForm.jenis_pengajuan_manual.trim()) {
      setFeedback({ type: 'error', message: 'Tuliskan jenis pengajuan manual yang Anda perlukan.' });
      return;
    }

    try {
      const selectedUnit = unitList.find((u: any) => u.id === Number(pengajuanForm.unit_pemohon));
      await sikeuService.storePengajuanKas({
        unit_kas_id: selectedUnit ? selectedUnit.id : null,
        judul_pengajuan: finalJenisPengajuan,
        deskripsi: pengajuanForm.keterangan,
        nominal_diajukan: Number(pengajuanForm.nominal)
      });
      setFeedback({ type: 'success', message: 'Permohonan dana kas unit berhasil diajukan.' });
      setIsPengajuanModalOpen(false);
      fetchData();
    } catch (error: any) {
      setFeedback({ type: 'error', message: 'Gagal mengajukan: ' + error.message });
    }
  };

  const handleApproveKabag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingItem) return;

    try {
      await sikeuService.approvePengajuanKas(approvingItem.id);
      setFeedback({
        type: 'success',
        message: `Pengajuan ${approvingItem.nomor_pengajuan} DISETUJUI dan dana sedang diproses pencairannya.`,
      });
      setIsApproveModalOpen(false);
      setApprovingItem(null);
      fetchData();
    } catch (error: any) {
      setFeedback({ type: 'error', message: 'Gagal approve: ' + error.message });
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
            <div className="flex items-center gap-2">
              <span className="badge badge-teal-pill">Kas Unit & Treasury</span>
              <span className="badge badge-indigo">Pengajuan & Mutasi Kas Kabag</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">Pengelolaan Kas Unit & Pengajuan Dana Kas</h1>
            <p className="text-xs text-slate-500">
              Form pengajuan permohonan dana unit kas ke Kabag Keuangan, monitoring saldo kas utama, & mutasi penyetoran
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setPengajuanForm({
                ...pengajuanForm,
                unit_pemohon: unitList.length > 0 ? unitList[0].id : '',
                jenis_pengajuan: 'Pengisian Uang Muka Operasional (Petty Cash)',
                jenis_pengajuan_manual: '',
                rekening_tujuan: 'Pencairan Kas Tunai',
              });
              setIsPengajuanModalOpen(true);
            }}
            className="btn btn-primary border-none font-bold text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Send size={16} /> Ajukan Permohonan Dana Kas Unit
          </button>
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="btn btn-secondary border-none font-bold text-xs flex items-center gap-1.5 shadow-2xs"
          >
            <ArrowUpRight size={16} /> Mutasi ke Kas Kabag
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {feedback.message}
        </div>
      )}

      {/* Kas Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {kasList.map((k) => (
          <div
            key={k.id}
            className={`p-5 rounded-2xl border shadow-sm space-y-3 transition-all flex flex-col justify-between ${
              k.isKabag
                ? 'bg-gradient-to-br from-slate-900 to-primary-950 text-white border-primary-700 md:col-span-1'
                : 'bg-white border-slate-100 text-slate-900'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-extrabold tracking-wide ${k.isKabag ? 'text-slate-300 flex items-center gap-1' : 'text-slate-800'}`}>
                  {k.isKabag && <ShieldCheck size={16} />} {k.nama}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                  k.isKabag ? 'bg-slate-400/20 text-slate-300 border border-slate-400/30' : 'bg-emerald-50 text-emerald-700'
                }`}>
                  {k.isKabag ? 'KAS UTAMA KABAG' : 'PETTY CASH'}
                </span>
              </div>

              <div>
                <div className={`text-[11px] ${k.isKabag ? 'text-slate-300' : 'text-slate-500'}`}>Saldo Tersedia:</div>
                <div className={`text-xl font-extrabold font-mono mt-0.5 ${k.isKabag ? 'text-emerald-400' : 'text-slate-900'}`}>
                  {formatRupiah(k.saldoSaatIni)}
                </div>
              </div>
            </div>

            <div className={`text-[11px] border-t pt-2 space-y-0.5 ${k.isKabag ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-500'}`}>
              <div>PJ: <strong className={k.isKabag ? 'text-white' : 'text-slate-800'}>{k.pj}</strong></div>
              <div>Saldo Awal: {formatRupiah(k.saldoAwal)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* SEKSI RIWAYAT PENGAJUAN PERMOHONAN DANA KAS UNIT KE KABAG KEUANGAN */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Send size={18} className="text-primary-600" />
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Riwayat & Daftar Persetujuan Pengajuan Dana Kas Unit</h2>
              <p className="text-xs text-slate-500">Daftar permohonan pengisian kas operasional & reimbursement yang telah diajukan ke Kabag Keuangan</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase border-y border-slate-200">
              <tr>
                <th className="px-4 py-3">NO. PENGAJUAN</th>
                <th className="px-4 py-3">UNIT PEMOHON & PJ</th>
                <th className="px-4 py-3">JENIS & ALASAN PENGAJUAN</th>
                <th className="px-4 py-3 text-right">NOMINAL DANA</th>
                <th className="px-4 py-3">REKENING TUJUAN</th>
                <th className="px-4 py-3 text-center">STATUS APPROVAL</th>
                <th className="px-4 py-3 text-center">AKSI KABAG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pengajuanKasList.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono font-bold text-slate-700">{req.nomor_pengajuan}
                    <div className="text-[10px] text-slate-500 font-sans mt-0.5">{new Date(req.created_at).toLocaleDateString('id-ID')}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{req.unit_kas?.nama_kas || 'Unit Tidak Diketahui'}</div>
                    <div className="text-[10px] text-slate-500 font-semibold">Pemohon: Admin Unit Kas</div>
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <div className="font-bold text-slate-800">{req.judul_pengajuan}</div>
                    <div className="text-[10px] text-slate-500 italic mt-0.5 truncate" title={req.deskripsi}>&ldquo;{req.deskripsi}&rdquo;</div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-extrabold text-emerald-800 text-sm">
                    {formatRupiah(req.nominal_diajukan)}
                  </td>
                  <td className="px-4 py-3 font-mono text-[10px] font-bold text-slate-600 max-w-[120px] truncate" title={req.unit_kas?.bank_account_number}>
                    {req.unit_kas?.bank_name} - {req.unit_kas?.bank_account_number}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {req.status === 'dicairkan' ? (
                      <span className="inline-flex items-center gap-1 badge badge-green border border-emerald-200">
                        <CheckCircle size={12} /> DICAIRKAN
                      </span>
                    ) : (
                      <span className="badge badge-yellow inline-flex items-center gap-1">
                        <Clock size={12} /> PENDING
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                     {req.status === 'pending_keuangan' ? (
                        <button
                          onClick={() => {
                            setApprovingItem(req);
                            setApproveForm({ catatan_kabag: '' });
                            setIsApproveModalOpen(true);
                          }}
                          className="btn btn-primary btn-xs font-bold border-none"
                        >
                          ACC KABAG
                        </button>
                     ) : (
                       <span className="text-[10px] text-slate-400 font-semibold">-</span>
                     )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL AJUKAN PERMOHONAN DANA KAS UNIT KE KABAG KEUANGAN */}
      {isPengajuanModalOpen && (
        <div className="modal-overlay">
          <div className="modal modal-sm">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Send size={18} className="text-primary-600" /> Form Pengajuan Dana Kas Unit
              </h3>
              <button onClick={() => setIsPengajuanModalOpen(false)} className="btn btn-ghost btn-xs font-bold">✕</button>
            </div>

            <form onSubmit={handleCreatePengajuan} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Unit Pemohon *</label>
                <select
                  value={pengajuanForm.unit_pemohon}
                  onChange={(e) => setPengajuanForm({ ...pengajuanForm, unit_pemohon: e.target.value })}
                  className="select select-sm border-slate-300 w-full font-bold text-xs"
                >
                  {unitList.map(unit => (
                    <option key={unit.id} value={unit.id}>{unit.nama_kas}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Jenis Pengajuan *</label>
                <select
                  value={pengajuanForm.jenis_pengajuan}
                  onChange={(e) => {
                    setPengajuanForm({ ...pengajuanForm, jenis_pengajuan: e.target.value });
                  }}
                  className="select select-sm border-slate-300 w-full font-bold text-xs"
                >
                  <option value="Pengisian Uang Muka Operasional (Petty Cash)">Pengisian Uang Muka Operasional (Petty Cash)</option>
                  <option value="Reimbursement Operasional Unit">Reimbursement Operasional Unit</option>
                  <option value="Tambahan Kas Tunai Loket Kasir">Tambahan Kas Tunai Loket Kasir</option>
                  <option value="lainnya">Lainnya (Input Manual)...</option>
                </select>
              </div>

              {pengajuanForm.jenis_pengajuan === 'lainnya' && (
                <div className="animate-in fade-in slide-in-from-top-1">
                  <label className="font-bold text-slate-700 block mb-1">Ketik Jenis Pengajuan Secara Manual *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pengadaan Alat Lab Khusus..."
                    value={pengajuanForm.jenis_pengajuan_manual}
                    onChange={(e) => setPengajuanForm({ ...pengajuanForm, jenis_pengajuan_manual: e.target.value })}
                    className="input input-sm border-slate-300 w-full font-bold text-xs"
                  />
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nominal Permohonan Dana (Rp) *</label>
                <input
                  type="number"
                  required
                  value={pengajuanForm.nominal}
                  onChange={(e) => setPengajuanForm({ ...pengajuanForm, nominal: e.target.value })}
                  className="input input-sm border-slate-300 w-full font-mono font-extrabold text-emerald-800 text-sm"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Rekening Bank Tujuan Pencairan (Multi-Rekening Unit) *</label>
                <select
                  value={pengajuanForm.rekening_tujuan}
                  onChange={(e) => setPengajuanForm({ ...pengajuanForm, rekening_tujuan: e.target.value })}
                  className="select select-sm border-slate-300 w-full font-mono text-xs font-bold"
                >
                  <option value="BNI - 1234567890 (a.n Operasional FTIK)">BNI - 1234567890 (a.n Operasional FTIK)</option>
                  <option value="Mandiri - 9876543210 (a.n Kasir SPMB)">Mandiri - 9876543210 (a.n Kasir SPMB)</option>
                  <option value="BCA - 5554443332 (a.n Lab Komputer TI)">BCA - 5554443332 (a.n Lab Komputer TI)</option>
                  <option value="BRI - 1122334455 (a.n Kemahasiswaan & PKM)">BRI - 1122334455 (a.n Kemahasiswaan & PKM)</option>
                  <option value="KAS_TUNAI">Pencairan Kas Tunai Loket</option>
                </select>
                <p className="text-[10px] text-slate-700 font-medium mt-1 leading-tight">
                  ⚡ Saat Kabag Keuangan ACC, Gateway (Xendit/Duitku) akan mentransfer dana dari Wallet langsung ke nomor rekening spesifik unit Anda.
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Keterangan & Rincian Penggunaan Dana *</label>
                <textarea
                  required
                  rows={3}
                  value={pengajuanForm.keterangan}
                  onChange={(e) => setPengajuanForm({ ...pengajuanForm, keterangan: e.target.value })}
                  placeholder="Tuliskan rincian peruntukan permohonan dana..."
                  className="textarea textarea-sm border-slate-300 w-full text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsPengajuanModalOpen(false)} className="btn btn-ghost btn-sm font-bold">Batal</button>
                <button type="submit" className="btn btn-primary btn-sm font-bold border-none">
                  Kirim Pengajuan ke Kabag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KABAG APPROVAL (XENDIT / DUITKU INTEGRATION MOCK) */}
      {isApproveModalOpen && approvingItem && (
        <div className="modal-overlay">
          <div className="modal modal-md modal-body">
            <div className="flex items-center justify-between border-b pb-3 border-indigo-100">
              <h3 className="font-extrabold text-base text-indigo-900 flex items-center gap-2">
                <ShieldCheck size={20} className="text-indigo-600" /> Verifikasi & Cairkan Dana (Kabag Keuangan)
              </h3>
              <button onClick={() => setIsApproveModalOpen(false)} className="btn btn-ghost btn-xs font-bold text-slate-400">✕</button>
            </div>

            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-2 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-slate-500 font-semibold">No. Pengajuan</span>
                <span className="col-span-2 font-mono font-bold text-indigo-800">{approvingItem.nomor_pengajuan}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-slate-500 font-semibold">Unit & Pemohon</span>
                <span className="col-span-2 font-bold text-slate-800">{approvingItem.unit_kas?.nama_kas} (Admin)</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-slate-500 font-semibold">Rekening Tujuan</span>
                <span className="col-span-2 font-mono font-bold text-slate-700">{approvingItem.unit_kas?.bank_account_number}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-slate-500 font-semibold">Nominal Cair</span>
                <span className="col-span-2 font-mono font-extrabold text-emerald-700 text-lg">{formatRupiah(approvingItem.nominal_diajukan)}</span>
              </div>
            </div>

            <form onSubmit={handleApproveKabag} className="space-y-4 text-xs">


              <div>
                <label className="font-bold text-slate-700 block mb-1">Catatan Persetujuan Kabag (Opsional)</label>
                <textarea
                  rows={2}
                  value={approveForm.catatan_kabag}
                  onChange={(e) => setApproveForm({ ...approveForm, catatan_kabag: e.target.value })}
                  placeholder="Berikan catatan apabila ada instruksi khusus untuk unit..."
                  className="textarea textarea-sm border-slate-300 w-full text-xs font-medium"
                />
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-[10px] text-amber-900 font-medium">
                ⚠️ <strong className="text-amber-950">PERINGATAN:</strong> Meng-klik &ldquo;Setujui & Cairkan Dana&rdquo; akan <strong>secara otomatis memotong saldo wallet institusi</strong> pada Payment Gateway dan langsung dikirim ke rekening tujuan unit tanpa proses manual lagi. Transaksi ini juga akan membentuk Jurnal Pengeluaran Kas secara otomatis.
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsApproveModalOpen(false)} className="btn btn-ghost btn-sm font-bold">Batal / Tolak</button>
                <button type="submit" className="btn btn-primary btn-sm font-bold border-none shadow-md">
                  <CheckCircle size={16} /> Setujui & Cairkan Dana
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MUTASI KAS KABAG */}
      {isTransferModalOpen && (
        <div className="modal-overlay">
          <div className="modal modal-sm">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Wallet size={18} className="text-primary-600" /> Mutasi Penyetoran ke Kas Kabag
              </h3>
              <button onClick={() => setIsTransferModalOpen(false)} className="btn btn-ghost btn-xs font-bold">✕</button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setFeedback({
                  type: 'success',
                  message: `Mutasi penyetoran kas sebesar ${formatRupiah(transferForm.nominal)} ke Kas Kabag Keuangan berhasil dicatat.`,
                });
                setIsTransferModalOpen(false);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tujuan Kas Utama *</label>
                <select className="select select-sm border-slate-300 w-full font-bold text-xs" value="1" disabled>
                  <option value={1}>Kas Kabag Keuangan (Kas Utama Kabag)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nominal Penyetoran (Rp) *</label>
                <input
                  type="number"
                  required
                  value={transferForm.nominal}
                  onChange={(e) => setTransferForm({ ...transferForm, nominal: Number(e.target.value) })}
                  className="input input-sm border-slate-300 w-full font-mono font-extrabold text-emerald-800 text-sm"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Keterangan Mutasi *</label>
                <textarea
                  required
                  rows={3}
                  value={transferForm.keterangan}
                  onChange={(e) => setTransferForm({ ...transferForm, keterangan: e.target.value })}
                  className="textarea textarea-sm border-slate-300 w-full text-xs font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button type="button" onClick={() => setIsTransferModalOpen(false)} className="btn btn-ghost btn-sm font-bold">Batal</button>
                <button type="submit" className="btn btn-primary btn-sm font-bold border-none">
                  Proses Mutasi Kas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
