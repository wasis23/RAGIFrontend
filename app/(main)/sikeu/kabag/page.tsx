'use client';

import { formatRupiah, formatDate } from '@/lib/utils';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Wallet,
  ShieldCheck,
  CheckCircle,
  XCircle,
  ArrowLeft,
  AlertCircle,
  FileText,
  User,
  ArrowRightLeft,
  BookOpen,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { sikeuService } from '@/services/sikeu.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';

export default function SikeuKabagPage() {
  const [activeTab, setActiveTab] = useState<'approval' | 'kas-utama' | 'akuntansi'>('approval');
  const [loading, setLoading] = useState(true);

  // Real Metric & Unit Kas States
  const [saldoKasUtama, setSaldoKasUtama] = useState(0);
  const [unitKasList, setUnitKasList] = useState<any[]>([]);
  const [recentJurnals, setRecentJurnals] = useState<any[]>([]);

  // Approval Pending Lists
  const [pendingDispensasi, setPendingDispensasi] = useState<any[]>([]);
  const [pendingTagihan, setPendingTagihan] = useState<any[]>([]);

  // Modal Approval Action
  const [modalAction, setModalAction] = useState<{ id: number; title: string; type: string } | null>(null);
  const [modalDecision, setModalDecision] = useState<'setujui' | 'tolak'>('setujui');
  const [catatan, setCatatan] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [approving, setApproving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashRes, appRes, kasRes] = await Promise.all([
        sikeuService.getDashboardSummary().catch(() => ({ data: null })),
        sikeuService.getPendingApprovals().catch(() => ({ data: null })),
        sikeuService.getUnitKasList().catch(() => ({ data: null })),
      ]);

      if (dashRes.data?.metrics) {
        setSaldoKasUtama(dashRes.data.metrics.saldo_kas_utama || 0);
      }
      if (Array.isArray(dashRes.data?.recent_jurnals)) {
        setRecentJurnals(dashRes.data.recent_jurnals);
      }
      if (Array.isArray(kasRes.data)) {
        setUnitKasList(kasRes.data);
      } else if (Array.isArray((kasRes.data as any)?.data)) {
        setUnitKasList((kasRes.data as any).data);
      }

      if (appRes.data?.dispensasi_pending) {
        const mapped = appRes.data.dispensasi_pending.map((d: any) => ({
          id: d.id,
          mhs: d.nama_mahasiswa || `Mahasiswa #${d.mahasiswa_id}`,
          prodi: d.prodi || '-',
          tipe: d.tipe_dispensasi?.replace('_', ' ') || 'Dispensasi',
          nominal: Number(d.nominal_per_cicilan) || 0,
          deadline: formatDate(d.jatuh_tempo_baru) || '-',
          alasan: d.alasan || 'Permohonan dispensasi pembayaran tagihan',
        }));
        setPendingDispensasi(mapped);
      }
    if (Array.isArray(appRes.data?.tagihan_pending)) {
        const mappedTagihan = appRes.data.tagihan_pending.map((t: any) => ({
          id: t.id,
          kode: t.nomor_tagihan || `TG-${t.id}`,
          mhs: t.mahasiswa?.nama_lengkap || `Mahasiswa #${t.mahasiswa_id}`,
          nominal: Number(t.total_tagihan) || 0,
          jenis: (t.source_system || 'SIAKAD').toUpperCase(),
          jatuh_tempo: formatDate(t.jatuh_tempo) || '-',
        }));
        setPendingTagihan(mappedTagihan);
      }
    } catch (e) {
      console.error('Failed to load kabag data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenDecision = (id: number, title: string, type: string) => {
    setModalAction({ id, title, type });
    setModalDecision('setujui');
    setCatatan('');
  };

  const handleSubmitDecision = async () => {
    if (!modalAction) return;
    setApproving(true);
    try {
      if (modalAction.type === 'dispensasi') {
        if (modalDecision === 'setujui') {
          await sikeuService.approveDispensasi(modalAction.id, catatan);
        } else {
          await sikeuService.rejectDispensasi(modalAction.id, catatan);
        }
        setPendingDispensasi(prev => prev.filter(i => i.id !== modalAction.id));
        setFeedback({
          type: 'success',
          message: `Keputusan ${modalDecision === 'setujui' ? 'SETUJUI' : 'TOLAK'} dispensasi ${modalAction.title} berhasil diproses.`,
        });
      } else if (modalAction.type === 'tagihan') {
        if (modalDecision === 'setujui') {
          await sikeuService.approveTagihan(modalAction.id, catatan);
        } else {
          await sikeuService.rejectTagihan(modalAction.id, catatan);
        }
        setPendingTagihan(prev => prev.filter(i => i.id !== modalAction.id));
        setFeedback({
          type: 'success',
          message: `Keputusan ${modalDecision === 'setujui' ? 'SETUJUI' : 'TOLAK'} pengajuan ${modalAction.title} berhasil diproses.`,
        });
      }
      setModalAction(null);
      setCatatan('');
    } catch (error: any) {
      setFeedback({
        type: 'error',
        message: error?.response?.data?.message || 'Gagal memproses keputusan. Silakan coba lagi.',
      });
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Header Portal Kabag Keuangan */}
      <PageHeader
        title="Portal Khusus Kabag Keuangan"
        description="Pusat Otorisasi Kas Utama, Persetujuan Dispensasi, Mutasi Likuiditas, & Pengawasan Akuntansi"
        action={
          <div className="flex items-center gap-2">
            <Link href="/sikeu" className="btn btn-warning btn-icon" title="Kembali">
              <ArrowLeft size={18} />
            </Link>
            <Link
              href="/sikeu/approval"
              className="btn btn-secondary font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <ShieldCheck size={16} /> Portal Approval ({pendingDispensasi.length + pendingTagihan.length})
            </Link>
          </div>
        }
      />

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



      {/* TAB SUB-NAVIGASI OTORITAS KABAG */}
      <div className="card p-6 overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50/50 p-2 gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('approval')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'approval'
                ? 'bg-primary-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <ShieldCheck size={16} /> 1. Otorisasi Approval ({pendingDispensasi.length + pendingTagihan.length})
          </button>
          <button
            onClick={() => setActiveTab('kas-utama')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'kas-utama'
                ? 'bg-primary-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Wallet size={16} /> 2. Kas Utama Kabag & Unit Kas
          </button>
          <button
            onClick={() => setActiveTab('akuntansi')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'akuntansi'
                ? 'bg-primary-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <BookOpen size={16} /> 3. Pengawasan Akuntansi & Jurnal Umum
          </button>
        </div>

        {/* CONTENT TAB 1: OTORISASI APPROVAL KABAG */}
        {activeTab === 'approval' && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Antrean Perizinan & Otorisasi Keputusan Kabag Keuangan</h2>
                <p className="text-xs text-slate-500">Pilih setujui atau tolak untuk memproses status dispensasi, mutasi kas, dan pengeluaran operasional</p>
              </div>
            </div>

            {/* SEKSI 1: DISPENSASI PEMBAYARAN MAHASISWA */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-amber-900 flex items-center gap-1.5">
                  <User size={16} className="text-amber-600" /> Permohonan Dispensasi Pembayaran Mahasiswa ({pendingDispensasi.length}):
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {pendingDispensasi.map((d) => (
                  <div key={d.id} className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2 flex justify-between items-center">
                    <div>
                      <div className="font-extrabold text-slate-900">{d.mhs}</div>
                      <div className="text-[11px] text-slate-600 font-semibold">{d.prodi} • {d.tipe}</div>
                      <div className="text-[11px] text-slate-500 italic mt-0.5">&ldquo;{d.alasan}&rdquo;</div>
                    </div>
                    <div className="text-right space-y-2 shrink-0">
                      <div className="font-mono text-sm font-extrabold text-emerald-800">{formatRupiah(d.nominal)}</div>
                      <button
                        onClick={() => handleOpenDecision(d.id, `Dispensasi ${d.mhs}`, 'dispensasi')}
                        className="btn btn-secondary btn-xs font-bold border-none"
                      >
                        Proses Keputusan &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SEKSI 2: TAGIHAN PERLU PERSETUJUAN */}
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <FileText size={16} className="text-slate-700" /> Tagihan Menunggu Persetujuan Kabag ({pendingTagihan.length}):
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {pendingTagihan.map((k) => (
                  <div key={k.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 flex justify-between items-center">
                    <div>
                      <div className="font-mono font-bold text-primary-900">{k.kode}</div>
                      <div className="text-[11px] text-slate-700 font-bold">{k.jenis} | {k.mhs}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Jatuh tempo: {formatDate(k.jatuh_tempo)}</div>
                    </div>
                    <div className="text-right space-y-2 shrink-0">
                      <div className="font-mono text-sm font-extrabold text-emerald-800">{formatRupiah(k.nominal)}</div>
                      <button
                        onClick={() => handleOpenDecision(k.id, `Tagihan ${k.kode}`, 'tagihan')}
                        className="btn btn-primary btn-xs font-bold border-none"
                      >
                        Proses Keputusan &rarr;
                      </button>
                    </div>
                  </div>
                ))}
                {pendingTagihan.length === 0 && (
                  <div className="col-span-2 text-center py-6 text-slate-400">
                    Tidak ada tagihan yang menunggu persetujuan.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CONTENT TAB 2: KAS UTAMA KABAG & MUTASI UNIT */}
        {activeTab === 'kas-utama' && (
          <div className="p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Kas Utama Kabag Keuangan & Unit Kas Kampus</h2>
                <p className="text-xs text-slate-500">Daftar saldo unit kas aktif & saldo kas utama instansi</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {unitKasList.length > 0 ? (
                unitKasList.map((u: any) => (
                  <div key={u.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="font-bold text-slate-900">{u.nama_kas}</div>
                    <div className="text-xl font-mono font-extrabold text-slate-900">
                      {formatRupiah(u.saldo_saat_ini || 0)}
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                      u.is_kabag_kas ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {u.is_kabag_kas ? 'KAS UTAMA INSTANSI' : u.tipe_kas || 'KAS OPERASIONAL'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-6 text-slate-400">
                  Tidak ada data unit kas aktif.
                </div>
              )}
            </div>
          </div>
        )}

        {/* CONTENT TAB 3: PENGAWASAN AKUNTANSI & JURNAL UMUM */}
        {activeTab === 'akuntansi' && (
          <div className="p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Pengawasan Jurnal Akuntansi & Balanced Ledger</h2>
                <p className="text-xs text-slate-500">Pencatatan otomatis jurnal debet & kredit dari transaksi yang disetujui Kabag</p>
              </div>
              <Link href="/sikeu/akuntansi" className="btn btn-secondary btn-xs font-bold border-none">
                Buka Portal Akuntansi Lengkap &rarr;
              </Link>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 font-medium">
              ✨ <strong>Sistem Balanced Journal (100% Synced)</strong>: Setiap pembayaran UKT, mutasi unit kas, maupun pengeluaran operasional yang disetujui Kabag secara otomatis terposting ke Jurnal Umum dengan perimbangan Debet & Kredit seimbang.
            </div>
          </div>
        )}
      </div>

      {/* MODAL HASIL OTORISASI DECISION KABAG */}
      <Modal
        isOpen={Boolean(modalAction)}
        onClose={() => setModalAction(null)}
        title={`Otorisasi Kabag Keuangan: ${modalAction?.title || ''}`}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 pt-1 pb-2">
            <Button
              type="button"
              variant={modalDecision === 'setujui' ? 'primary' : 'ghost'}
              onClick={() => setModalDecision('setujui')}
              icon={<CheckCircle size={14} />}
              className="flex-1 font-bold text-xs"
            >
              Setujui
            </Button>
            <Button
              type="button"
              variant={modalDecision === 'tolak' ? 'danger' : 'ghost'}
              onClick={() => setModalDecision('tolak')}
              icon={<XCircle size={14} />}
              className="flex-1 font-bold text-xs"
            >
              Tolak
            </Button>
          </div>

          <Textarea
            label="Catatan Instruksi Kabag Keuangan (Opsional)"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Tuliskan catatan persetujuan atau penolakan..."
            rows={3}
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setModalAction(null)}
              disabled={approving}
              className="font-bold text-slate-600"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant={modalDecision === 'setujui' ? 'primary' : 'danger'}
              onClick={handleSubmitDecision}
              disabled={approving}
              icon={approving ? <Loader2 size={16} className="animate-spin" /> : undefined}
              className="font-bold shadow-md"
            >
              {approving
                ? 'Memproses...'
                : modalDecision === 'setujui'
                ? 'Terbitkan Persetujuan'
                : 'Tolak Pengajuan'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
