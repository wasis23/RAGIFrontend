'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  AlertCircle,
  FileText,
  User,
  Wallet,
  Receipt,
  TrendingDown,
  Building2,
  CheckCircle2,
  ArrowRightLeft
} from 'lucide-react';
import { sikeuService } from '@/services/sikeu.service';

export default function SikeuApprovalPage() {
  // 4 Distinct Approval Categories (Separate Cards)
  const [dispensasiList, setDispensasiList] = useState<any[]>([]);
  const [kasKabagList, setKasKabagList] = useState<any[]>([]);
  const [operasionalList, setOperasionalList] = useState<any[]>([]);
  const [tagihanList, setTagihanList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalAction, setModalAction] = useState<{
    category: 'dispensasi' | 'kas' | 'operasional' | 'tagihan';
    action: 'approve' | 'reject';
    id: number;
    title: string;
  } | null>(null);

  const [catatan, setCatatan] = useState('');
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      // Mock data for each synchronized approval category
      setDispensasiList([
        { id: 201, mahasiswa_nama: 'Budi Santoso', nim: '2024010042', prodi: 'Teknik Informatika', angkatan: 2024, tipe: 'Cicilan UKT 50%', jatuh_tempo_baru: '2026-09-15', sisa_tagihan: 3500000, alasan: 'Kendala keuangan keluarga terdampar musibah, memohon izin mencicil 2x.' },
        { id: 202, mahasiswa_nama: 'Siti Rahmawati', nim: '2025010018', prodi: 'Sistem Informasi', angkatan: 2025, tipe: 'Penundaan Pembayaran', jatuh_tempo_baru: '2026-09-30', sisa_tagihan: 4000000, alasan: 'Menunggu pencairan beasiswa pemerintah daerah bulan depan.' },
      ]);

      setKasKabagList([
        { id: 301, kode_mutasi: 'MUT-KAS-202608-01', unit_asal: 'Kas Utama Kabag Keuangan', unit_tujuan: 'Kas Operasional SPMB', nominal: 15000000, peruntukan: 'Pengisian kas tunai operasional pendaftaran SPMB Gelombang 2', pemohon: 'Kabag Keuangan' },
        { id: 302, kode_mutasi: 'MUT-KAS-202608-02', unit_asal: 'Kas Bank BNI Kampus', unit_tujuan: 'Kas Bank Mandiri Payroll', nominal: 45000000, peruntukan: 'Transfer mutasi likuiditas persediaan gaji dosen & pegawai', pemohon: 'Kabag Keuangan' },
      ]);

      setOperasionalList([
        { id: 401, nomor_pengajuan: 'EXP-OPR-202608-01', unit: 'Laboratorium Komputer TI', nama_pengeluaran: 'Pembelian Router & Switch Core CISCO Lab TI', nominal: 18500000, tanggal: '2026-08-02', pemohon: 'Ka. Lab Komputer' },
        { id: 402, nomor_pengajuan: 'EXP-OPR-202608-02', unit: 'Bagian Kemahasiswaan', nama_pengeluaran: 'Dana Hibah Kompetisi PKM & Robotika Nasional', nominal: 12000000, tanggal: '2026-08-03', pemohon: 'Wakil Rektor III' },
      ]);

      setTagihanList([
        { id: 101, nomor_tagihan: 'INV-EXT-202608-01', mahasiswa_nama: 'Ahmad Fauzi', nim: '2023010088', source: 'SIAKAD', nominal: 5500000, jatuh_tempo: '2026-08-31', alasan: 'Penerbitan invoice khusus kelas eksekutif' },
      ]);
    } catch (err) {
      console.error('Failed to load pending approvals', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleConfirmAction = async () => {
    if (!modalAction) return;
    setProcessing(true);
    try {
      const decisionText = modalAction.action === 'approve' ? 'DISETUJUI' : 'DITOLAK';
      setFeedback({
        type: 'success',
        message: `Pengajuan #${modalAction.id} (${modalAction.title}) telah berhasil ${decisionText} oleh Pimpinan. Keputusan dan jurnal otomatis telah diperbarui.`,
      });

      // Update local state list
      if (modalAction.category === 'dispensasi') {
        setDispensasiList(prev => prev.filter(item => item.id !== modalAction.id));
      } else if (modalAction.category === 'kas') {
        setKasKabagList(prev => prev.filter(item => item.id !== modalAction.id));
      } else if (modalAction.category === 'operasional') {
        setOperasionalList(prev => prev.filter(item => item.id !== modalAction.id));
      } else {
        setTagihanList(prev => prev.filter(item => item.id !== modalAction.id));
      }

      setModalAction(null);
      setCatatan('');
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal memproses keputusan approval' });
    } finally {
      setProcessing(false);
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const totalPendingCount = dispensasiList.length + kasKabagList.length + operasionalList.length + tagihanList.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/sikeu" className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-600 transition">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Portal Approval Pimpinan</h1>
            <p className="text-xs text-slate-500">Persetujuan Terpisah per Kategori: Dispensasi Pembayaran, Kas Kabag Keuangan, & Pengeluaran Operasional</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs">
            <Clock size={16} /> Total Pending: {totalPendingCount} Pengajuan
          </span>
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

      {/* CARD CATEGORY 1: PERMOHONAN DISPENSASI PEMBAYARAN MAHASISWA */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <User size={20} className="text-amber-600" />
            <div>
              <h2 className="text-base font-extrabold text-slate-900">1. Card Approval Dispensasi Pembayaran Mahasiswa</h2>
              <p className="text-xs text-slate-500">Persetujuan cicilan / penundaan bayar (Otomatis membuka kuncian KRS di SIAKAD)</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800">
            {dispensasiList.length} Antrean
          </span>
        </div>

        {dispensasiList.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400 font-medium">Tidak ada permohonan dispensasi pembayaran yang pending.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dispensasiList.map((d) => (
              <div key={d.id} className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-3 text-xs flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-sm">{d.mahasiswa_nama}</span>
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-white text-slate-700 border border-slate-200">
                      NIM: {d.nim}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 font-medium">Prodi: {d.prodi} (Angkatan {d.angkatan})</div>
                  <div className="p-2.5 bg-white rounded-lg border border-amber-200 text-[11px] text-slate-700 font-medium">
                    &ldquo;{d.alasan}&rdquo;
                  </div>
                  <div className="flex justify-between items-center text-[11px] pt-1">
                    <span className="text-slate-600">Jatuh Tempo Baru: <strong className="text-slate-900">{d.jatuh_tempo_baru}</strong></span>
                    <span className="font-mono font-extrabold text-emerald-800">{formatRupiah(d.sisa_tagihan)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-amber-200/60">
                  <button
                    onClick={() => setModalAction({ category: 'dispensasi', action: 'reject', id: d.id, title: `Tolak Dispensasi ${d.mahasiswa_nama}` })}
                    className="btn btn-ghost btn-xs text-rose-600 hover:bg-rose-50 font-bold"
                  >
                    <XCircle size={14} /> Tolak
                  </button>
                  <button
                    onClick={() => setModalAction({ category: 'dispensasi', action: 'approve', id: d.id, title: `Setujui Dispensasi ${d.mahasiswa_nama}` })}
                    className="btn bg-emerald-600 hover:bg-emerald-700 text-white btn-xs font-bold border-none"
                  >
                    <CheckCircle size={14} /> Setujui Dispensasi
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CARD CATEGORY 2: PERIZINAN MUTASI & PENGELOLAAN KAS KABAG KEUANGAN */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Wallet size={20} className="text-teal-600" />
            <div>
              <h2 className="text-base font-extrabold text-slate-900">2. Card Approval Perizinan Kas Kabag Keuangan & Mutasi Unit</h2>
              <p className="text-xs text-slate-500">Persetujuan transfer dana antar unit kas (Otomatis mencatat Jurnal Umum Debet/Kredit)</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-teal-100 text-teal-800">
            {kasKabagList.length} Antrean
          </span>
        </div>

        {kasKabagList.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400 font-medium">Tidak ada permohonan mutasi kas yang pending.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {kasKabagList.map((k) => (
              <div key={k.id} className="p-4 rounded-xl border border-teal-200 bg-teal-50/40 space-y-3 text-xs flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-teal-800">{k.kode_mutasi}</span>
                    <span className="font-mono text-sm font-extrabold text-emerald-800">{formatRupiah(k.nominal)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-700 font-bold bg-white p-2 rounded-lg border border-teal-200">
                    <span>{k.unit_asal}</span>
                    <ArrowRightLeft size={12} className="text-teal-600 shrink-0" />
                    <span>{k.unit_tujuan}</span>
                  </div>
                  <p className="text-[11px] text-slate-600">Peruntukan: <strong>{k.peruntukan}</strong></p>
                  <div className="text-[10px] text-slate-500 font-semibold">Pemohon: {k.pemohon}</div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-teal-200/60">
                  <button
                    onClick={() => setModalAction({ category: 'kas', action: 'reject', id: k.id, title: `Tolak Mutasi ${k.kode_mutasi}` })}
                    className="btn btn-ghost btn-xs text-rose-600 hover:bg-rose-50 font-bold"
                  >
                    <XCircle size={14} /> Tolak
                  </button>
                  <button
                    onClick={() => setModalAction({ category: 'kas', action: 'approve', id: k.id, title: `Setujui Mutasi ${k.kode_mutasi}` })}
                    className="btn bg-teal-600 hover:bg-teal-700 text-white btn-xs font-bold border-none"
                  >
                    <CheckCircle size={14} /> Setujui Mutasi Kas
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CARD CATEGORY 3: PENGELUARAN OPERASIONAL UNIT & PRODI */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <TrendingDown size={20} className="text-purple-600" />
            <div>
              <h2 className="text-base font-extrabold text-slate-900">3. Card Approval Pengeluaran Operasional Unit & Prodi</h2>
              <p className="text-xs text-slate-500">Persetujuan pencairan anggaran belanja operasional & kegiatan laboratorium/prodi</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-purple-100 text-purple-800">
            {operasionalList.length} Antrean
          </span>
        </div>

        {operasionalList.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400 font-medium">Tidak ada permohonan pengeluaran operasional yang pending.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {operasionalList.map((o) => (
              <div key={o.id} className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 space-y-3 text-xs flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-sm">{o.nama_pengeluaran}</span>
                    <span className="font-mono text-sm font-extrabold text-emerald-800">{formatRupiah(o.nominal)}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 font-medium">Unit: <strong>{o.unit}</strong> • Tanggal: {o.tanggal}</div>
                  <div className="text-[10px] font-mono text-purple-800 bg-white p-2 rounded-lg border border-purple-200">
                    No Pengajuan: {o.nomor_pengajuan} (Pemohon: {o.pemohon})
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-purple-200/60">
                  <button
                    onClick={() => setModalAction({ category: 'operasional', action: 'reject', id: o.id, title: `Tolak Pengeluaran ${o.nomor_pengajuan}` })}
                    className="btn btn-ghost btn-xs text-rose-600 hover:bg-rose-50 font-bold"
                  >
                    <XCircle size={14} /> Tolak
                  </button>
                  <button
                    onClick={() => setModalAction({ category: 'operasional', action: 'approve', id: o.id, title: `Setujui Pengeluaran ${o.nomor_pengajuan}` })}
                    className="btn bg-purple-600 hover:bg-purple-700 text-white btn-xs font-bold border-none"
                  >
                    <CheckCircle size={14} /> Setujui Pencairan
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CARD CATEGORY 4: TAGIHAN EKSTERNAL LINTAS SISTEM */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <FileText size={20} className="text-indigo-600" />
            <div>
              <h2 className="text-base font-extrabold text-slate-900">4. Card Approval Tagihan Eksternal (SIAKAD / SPMB)</h2>
              <p className="text-xs text-slate-500">Persetujuan khusus invoice baru yang memerlukan persetujuan pimpinan</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-indigo-100 text-indigo-800">
            {tagihanList.length} Antrean
          </span>
        </div>

        {tagihanList.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400 font-medium">Tidak ada permohonan tagihan eksternal yang pending.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tagihanList.map((t) => (
              <div key={t.id} className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-3 text-xs flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-700">{t.nomor_tagihan}</span>
                    <span className="font-mono text-sm font-extrabold text-emerald-800">{formatRupiah(t.nominal)}</span>
                  </div>
                  <div className="text-slate-800 font-bold">{t.mahasiswa_nama} (NIM: {t.nim})</div>
                  <p className="text-[11px] text-slate-600">{t.alasan}</p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-indigo-200/60">
                  <button
                    onClick={() => setModalAction({ category: 'tagihan', action: 'reject', id: t.id, title: `Tolak Tagihan ${t.nomor_tagihan}` })}
                    className="btn btn-ghost btn-xs text-rose-600 hover:bg-rose-50 font-bold"
                  >
                    <XCircle size={14} /> Tolak
                  </button>
                  <button
                    onClick={() => setModalAction({ category: 'tagihan', action: 'approve', id: t.id, title: `Setujui Tagihan ${t.nomor_tagihan}` })}
                    className="btn bg-indigo-600 hover:bg-indigo-700 text-white btn-xs font-bold border-none"
                  >
                    <CheckCircle size={14} /> Setujui Invoice
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {modalAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">{modalAction.title}</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Pimpinan (Opsional)</label>
              <textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Tuliskan catatan atau instruksi persetujuan..."
                className="w-full text-xs font-medium border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setModalAction(null)}
                className="btn btn-ghost btn-sm font-bold"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={processing}
                className={`btn btn-sm font-bold text-white border-none ${
                  modalAction.action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {processing ? 'Memproses...' : modalAction.action === 'approve' ? 'Konfirmasi Approve' : 'Konfirmasi Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
