'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ClipboardCheck,
  Search,
  Users,
  Award,
  CheckCircle2,
  AlertTriangle,
  User,
  FlaskConical,
  XCircle,
  FileText,
  ShieldCheck,
  Building2,
  CheckSquare,
  Sparkles,
  Info,
} from 'lucide-react';
import { SippmBadge } from '@/components/sippm/SippmBadge';
import { sippmService } from '@/services/sippm.service';
import { useAuth } from '@/hooks/useAuth';
import type { ProposalKegiatan, RubrikIndikator } from '@/types/sippm.types';

export default function ReviewerPortalPage() {
  const { user, hasRole, isAdmin } = useAuth();

  // Active Tab: 'tahap1' (Kaprodi), 'tahap2' (Admin SIPPM), 'tahap3' (Dual Reviewer Lolos)
  const [activeTab, setActiveTab] = useState<'tahap1' | 'tahap2' | 'tahap3'>('tahap1');

  // Proposal Lists per Stage
  const [tahap1List, setTahap1List] = useState<ProposalKegiatan[]>([]);
  const [tahap2List, setTahap2List] = useState<ProposalKegiatan[]>([]);
  const [tahap3List, setTahap3List] = useState<ProposalKegiatan[]>([]);
  const [loading, setLoading] = useState(true);

  // Search
  const [search, setSearch] = useState('');

  // Rubrik Evaluation Modal State
  const [selectedProposal, setSelectedProposal] = useState<ProposalKegiatan | null>(null);
  const [evaluationStage, setEvaluationStage] = useState<'kaprodi' | 'admin'>('kaprodi');
  const [rubriks, setRubriks] = useState<RubrikIndikator[]>([]);
  const [scores, setScores] = useState<Record<number, number>>({});
  const [catatan, setCatatan] = useState('');
  const [submittingEval, setSubmittingEval] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [evalSuccess, setEvalSuccess] = useState<string | null>(null);

  const fetchAllProposals = async () => {
    try {
      setLoading(true);

      // Fetch all proposals
      const res = await sippmService.getProposals({ per_page: 100 } as any);
      const items: ProposalKegiatan[] = Array.isArray(res?.data)
        ? res.data
        : (res?.data as any)?.items || (res?.data as any)?.data || [];

      // Categorize proposals into 3 review stages
      // Tahap 1: status = 'diajukan' atau 'submitted'
      const t1 = items.filter((p) => (p.status as any) === 'diajukan' || (p.status as any) === 'submitted');

      // Tahap 2: status = 'disetujui_kaprodi'
      const t2 = items.filter((p) => (p.status as any) === 'disetujui_kaprodi');

      // Tahap 3: status = 'disetujui_admin' atau 'lolos' atau 'approved'
      const t3 = items.filter(
        (p) =>
          (p.status as any) === 'disetujui_admin' ||
          (p.status as any) === 'lolos' ||
          (p.status as any) === 'approved'
      );

      setTahap1List(t1);
      setTahap2List(t2);
      setTahap3List(t3);
    } catch (err) {
      console.error('Failed to load proposals for reviewer portal', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllProposals();
  }, []);

  // Open Evaluation Modal for Tahap 1 or Tahap 2
  const handleOpenEvaluationModal = async (proposal: ProposalKegiatan, stage: 'kaprodi' | 'admin') => {
    setSelectedProposal(proposal);
    setEvaluationStage(stage);
    setScores({});
    setCatatan('');
    setEvalError(null);
    setEvalSuccess(null);

    // Fetch rubric indicators for this stage from Master Rubrik
    try {
      const res = await sippmService.indexRubrik({ tipe_reviewer: stage });
      const rubrikList = Array.isArray(res?.data)
        ? res.data
        : (res?.data as any)?.items || (res?.data as any)?.data || [];

      setRubriks(rubrikList);

      // Initialize default scores to 0
      const initialScores: Record<number, number> = {};
      rubrikList.forEach((r: RubrikIndikator) => {
        initialScores[r.id] = 0;
      });
      setScores(initialScores);
    } catch (err) {
      console.error('Failed to load rubriks for evaluation', err);
    }
  };

  // Calculate Weighted Total Score
  const calculateTotalScore = (): number => {
    if (rubriks.length === 0) return 0;
    const totalBobot = rubriks.reduce((acc: number, r: RubrikIndikator) => acc + (r.bobot || 0), 0);

    if (totalBobot > 0) {
      const weightedSum = rubriks.reduce((acc: number, r: RubrikIndikator) => {
        const score = scores[r.id] || 0;
        return acc + score * (r.bobot / totalBobot);
      }, 0);
      return Math.round(weightedSum * 10) / 10;
    } else {
      const sum = rubriks.reduce((acc: number, r: RubrikIndikator) => acc + (scores[r.id] || 0), 0);
      return Math.round((sum / rubriks.length) * 10) / 10;
    }
  };

  const currentTotalScore = calculateTotalScore();
  const isPassing = currentTotalScore > 80;

  // Submit Rubrik Evaluation
  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProposal) return;

    try {
      setSubmittingEval(true);
      setEvalError(null);

      // Determine next status based on stage and score > 80 threshold
      let nextStatus = '';
      if (evaluationStage === 'kaprodi') {
        nextStatus = isPassing ? 'disetujui_kaprodi' : 'revisi';
      } else {
        nextStatus = isPassing ? 'disetujui_admin' : 'revisi';
      }

      // Update proposal status via backend API
      await sippmService.updateProposal(selectedProposal.id, {
        status: nextStatus,
      } as any);

      setEvalSuccess(
        `Berhasil menyimpan hasil penilaian Rubrik ${
          evaluationStage === 'kaprodi' ? 'Tahap 1 (Kaprodi)' : 'Tahap 2 (Admin SIPPM)'
        }! Total Skor: ${currentTotalScore}. Status proposal diperbarui menjadi: "${nextStatus}".`
      );

      setTimeout(() => {
        setSelectedProposal(null);
        fetchAllProposals();
      }, 1500);
    } catch (err: any) {
      setEvalError(err.response?.data?.message || 'Gagal menyimpan hasil penilaian rubrik');
    } finally {
      setSubmittingEval(false);
    }
  };

  // Filter Helper
  const filterProposalList = (list: ProposalKegiatan[]) => {
    return list.filter(
      (item) =>
        (item.judul || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.ketua?.nama_lengkap || (item as any).ketua_pegawai?.nama_lengkap || '')
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        (item.rumpun_ilmu || '').toLowerCase().includes(search.toLowerCase())
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge badge-sippm">Fase Penilaian Rubrik Proposal</span>
            <span className="badge badge-purple font-bold">Reviewer & Verifikator Portal</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Portal Penilaian Rubrik Proposal Riset & PkM
          </h1>
          <p className="text-slate-500 text-sm">
            Penilaian bertahap indikator Keilmuan & Linieritas (Tahap 1 Kaprodi) dan Administrasi & Kelayakan Kelompok (Tahap 2 Admin SIPPM).
          </p>
        </div>
      </div>

      {/* 3 STAGE TABS (Tahap 1, Tahap 2, Tahap 3) */}
      <div className="flex items-center border-b border-slate-200 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('tahap1')}
          className={`px-4 py-3 text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all shrink-0 ${
            activeTab === 'tahap1'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 size={16} /> Tahap 1: Review Kaprodi ({tahap1List.length})
        </button>

        <button
          onClick={() => setActiveTab('tahap2')}
          className={`px-4 py-3 text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all shrink-0 ${
            activeTab === 'tahap2'
              ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck size={16} /> Tahap 2: Review Admin SIPPM ({tahap2List.length})
        </button>

        <button
          onClick={() => setActiveTab('tahap3')}
          className={`px-4 py-3 text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all shrink-0 ${
            activeTab === 'tahap3'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckCircle2 size={16} /> Tahap 3: Proposal Lolos Dual Reviewer ({tahap3List.length})
        </button>
      </div>

      {/* Search Filter Card */}
      <div className="card">
        <div className="card-body p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="input-wrapper w-full md:w-80">
            <span className="input-prefix-icon"><Search size={18} /></span>
            <input
              type="text"
              className="input input-icon-left"
              placeholder="Cari judul proposal / nama dosen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <Info size={14} className="text-primary-600" />
            Batas Minimal Kelulusan Skor per Tahap: <strong className="text-slate-900 font-bold">&gt; 80 / 100</strong>
          </div>
        </div>
      </div>

      {/* TAB 1: TAHAP 1 - REVIEW KAPRODI (KEILMUAN & LINIERITAS) */}
      {activeTab === 'tahap1' && (
        <div className="table-container bg-white">
          <table className="table">
            <thead>
              <tr>
                <th>Judul Proposal Usulan</th>
                <th>Ketua Pengusul & Prodi</th>
                <th>Skema & Dana</th>
                <th>Status Tahap 1</th>
                <th className="text-right">Aksi Scoring Rubrik</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400">Memuat proposal usulan Tahap 1...</td>
                </tr>
              ) : filterProposalList(tahap1List).length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CheckCircle2 size={32} className="text-emerald-400" />
                      <span>Tidak ada proposal antrean penilaian Tahap 1 (Kaprodi).</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filterProposalList(tahap1List).map((item) => (
                  <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td>
                      <div className="font-bold text-slate-900 line-clamp-1">{item.judul}</div>
                      <div className="text-xs text-indigo-700 font-medium mt-0.5">{item.rumpun_ilmu}</div>
                    </td>
                    <td>
                      <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                        <User size={14} className="text-slate-400" />
                        {item.ketua?.nama_lengkap || (item as any).ketua_pegawai?.nama_lengkap || 'Dosen Pengusul'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        NIP: {item.ketua?.nip || (item as any).ketua_pegawai?.nip || '-'}
                      </div>
                    </td>
                    <td>
                      <div className="text-xs font-bold text-slate-700">
                        {item.skema?.nama_skema || item.skema?.nama || 'Skema Riset'}
                      </div>
                      <div className="text-xs font-mono font-bold text-primary-700">
                        Rp {(item.dana_diusulkan || (item as any).anggaran_diajukan || 0).toLocaleString('id-ID')}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-amber font-bold text-[11px] flex items-center gap-1">
                        <AlertTriangle size={12} /> Menunggu Review Kaprodi
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEvaluationModal(item, 'kaprodi')}
                          className="btn btn-primary btn-sm font-bold shadow-xs flex items-center gap-1.5"
                        >
                          <Award size={15} /> Nilai Rubrik Tahap 1
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: TAHAP 2 - REVIEW ADMIN SIPPM (ADMINISTRASI & KELAYAKAN KELOMPOK) */}
      {activeTab === 'tahap2' && (
        <div className="table-container bg-white">
          <table className="table">
            <thead>
              <tr>
                <th>Judul Proposal Usulan</th>
                <th>Ketua Pengusul & Prodi</th>
                <th>Skema & Dana</th>
                <th>Verifikasi Tahap 1</th>
                <th className="text-right">Aksi Scoring Rubrik</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400">Memuat proposal usulan Tahap 2...</td>
                </tr>
              ) : filterProposalList(tahap2List).length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CheckCircle2 size={32} className="text-purple-400" />
                      <span>Tidak ada proposal antrean penilaian Tahap 2 (Admin SIPPM).</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filterProposalList(tahap2List).map((item) => (
                  <tr key={item.id} className="hover:bg-purple-50/30 transition-colors">
                    <td>
                      <div className="font-bold text-slate-900 line-clamp-1">{item.judul}</div>
                      <div className="text-xs text-purple-700 font-medium mt-0.5">{item.rumpun_ilmu}</div>
                    </td>
                    <td>
                      <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                        <User size={14} className="text-slate-400" />
                        {item.ketua?.nama_lengkap || (item as any).ketua_pegawai?.nama_lengkap || 'Dosen Pengusul'}
                      </div>
                    </td>
                    <td>
                      <div className="text-xs font-bold text-slate-700">
                        {item.skema?.nama_skema || item.skema?.nama || 'Skema Riset'}
                      </div>
                      <div className="text-xs font-mono font-bold text-primary-700">
                        Rp {(item.dana_diusulkan || (item as any).anggaran_diajukan || 0).toLocaleString('id-ID')}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-green font-bold text-[11px] flex items-center gap-1">
                        <CheckCircle2 size={12} /> Disetujui Kaprodi (Skor &gt; 80)
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEvaluationModal(item, 'admin')}
                          className="btn btn-primary btn-sm bg-purple-700 hover:bg-purple-800 border-none font-bold shadow-xs flex items-center gap-1.5"
                        >
                          <ShieldCheck size={15} /> Nilai Rubrik Tahap 2
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: TAHAP 3 - PROPOSAL LOLOS DUAL REVIEWER (DISETUJUI) */}
      {activeTab === 'tahap3' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5">
            <Sparkles size={18} className="text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong>Informasi Alur Tahap 3 (Final Approved)</strong>: Seluruh proposal pada tab ini dinyatakan 
              <strong> Disetujui oleh Kaprodi (Tahap 1)</strong> dan <strong> Disetujui oleh Admin SIPPM (Tahap 2)</strong>. 
              Admin SIPPM <em>tidak perlu mencarikan reviewer tambahan lagi</em> karena reviewer utama adalah Kaprodi di Tahap 1 dan Admin SIPPM di Tahap 2.
            </div>
          </div>

          <div className="table-container bg-white">
            <table className="table">
              <thead>
                <tr>
                  <th>Judul Proposal Usulan</th>
                  <th>Ketua Pengusul & Prodi</th>
                  <th>Skema & Dana Disetujui</th>
                  <th>Status Reviewer</th>
                  <th>Keterangan Persetujuan</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-400">Memuat proposal lolos Tahap 3...</td>
                  </tr>
                ) : filterProposalList(tahap3List).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <ClipboardCheck size={32} className="text-slate-300" />
                        <span>Belum ada proposal yang lolos evaluasi Tahap 1 & Tahap 2.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filterProposalList(tahap3List).map((item) => (
                    <tr key={item.id} className="hover:bg-emerald-50/40 transition-colors">
                      <td>
                        <div className="font-bold text-slate-900 line-clamp-1">{item.judul}</div>
                        <div className="text-xs text-primary-700 font-medium mt-0.5">{item.rumpun_ilmu}</div>
                      </td>
                      <td>
                        <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                          <User size={14} className="text-slate-400" />
                          {item.ketua?.nama_lengkap || (item as any).ketua_pegawai?.nama_lengkap || 'Dosen Pengusul'}
                        </div>
                      </td>
                      <td>
                        <div className="text-xs font-bold text-slate-700">
                          {item.skema?.nama_skema || item.skema?.nama || 'Skema Riset'}
                        </div>
                        <div className="text-xs font-mono font-bold text-emerald-700">
                          Rp {(item.dana_disetujui || (item as any).anggaran_disetujui || item.dana_diusulkan || 0).toLocaleString('id-ID')}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-green font-bold text-[11px] flex items-center gap-1">
                          <CheckCircle2 size={12} /> Dual Reviewer Lolos (2/2)
                        </span>
                      </td>
                      <td>
                        <div className="text-xs text-slate-600 font-medium flex items-center gap-1">
                          <CheckSquare size={14} className="text-emerald-600" />
                          Disetujui Kaprodi & Admin SIPPM
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FORM SCORING RUBRIK MODAL (TAHAP 1 & TAHAP 2 DINAMIS) */}
      {selectedProposal && (
        <div className="modal-overlay">
          <div className="modal modal-lg modal-body">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="badge badge-purple font-bold text-[11px] mb-1">
                  {evaluationStage === 'kaprodi'
                    ? 'Tahap 1: Rubrik Keilmuan & Linieritas (Kaprodi)'
                    : 'Tahap 2: Rubrik Administrasi & Kelayakan Kelompok (Admin SIPPM)'}
                </span>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Award className="text-purple-700" size={20} /> Form Penilaian Rubrik Proposal
                </h2>
              </div>
              <button onClick={() => setSelectedProposal(null)} className="btn btn-ghost btn-sm">✕</button>
            </div>

            {/* Context Box Proposal */}
            <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-100 space-y-1 text-xs">
              <div className="font-extrabold text-slate-900">{selectedProposal.judul}</div>
              <div className="text-slate-600 flex items-center gap-3">
                <span>Ketua: <strong>{selectedProposal.ketua?.nama_lengkap || (selectedProposal as any).ketua_pegawai?.nama_lengkap || 'Dosen Pengusul'}</strong></span>
                <span>•</span>
                <span>Prodi: <strong>{selectedProposal.rumpun_ilmu}</strong></span>
              </div>
            </div>

            {evalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
                <XCircle size={16} /> {evalError}
              </div>
            )}

            {evalSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 size={16} /> {evalSuccess}
              </div>
            )}

            {/* FORM RUBRIK SCORING */}
            <form onSubmit={handleSaveEvaluation} className="space-y-4">
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Indikator Penilaian Rubrik ({rubriks.length} Indikator Terdaftar)
                </h3>

                {rubriks.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                    Memuat indikator rubrik dari Master Data...
                  </div>
                ) : (
                  rubriks.map((rub) => (
                    <div key={rub.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                            {rub.nama_indikator}
                            <span className="badge badge-gray text-[10px] font-mono">Bobot: {rub.bobot}%</span>
                          </div>
                          {rub.deskripsi && <div className="text-[11px] text-slate-500 mt-0.5">{rub.deskripsi}</div>}
                        </div>
                        <div className="w-32 shrink-0">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            className="input input-sm text-right font-bold text-slate-900 text-xs"
                            value={scores[rub.id] ?? ''}
                            onChange={(e) =>
                              setScores({
                                ...scores,
                                [rub.id]: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                              })
                            }
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Total Live Score Summary Highlight */}
              <div className={`p-4 rounded-xl border flex items-center justify-between ${
                isPassing
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide">TOTAL SKOR AKHIR RUBRIK</div>
                  <div className="text-xs mt-0.5">
                    {isPassing ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 size={14} /> Lolos Reviewer (Skor &gt; 80) — Proposal Lanjut ke Tahap Berikutnya
                      </span>
                    ) : (
                      <span className="text-rose-700 font-bold flex items-center gap-1">
                        <XCircle size={14} /> Belum Memenuhi Batas Minimal (&le; 80) — Proposal Perlu Revisi
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-3xl font-extrabold font-mono">{currentTotalScore} / 100</div>
              </div>

              {/* Catatan Tambahan Reviewer */}
              <div className="form-group">
                <label className="form-label font-bold text-slate-700 text-xs">Catatan & Masukan Reviewer</label>
                <textarea
                  rows={3}
                  className="input text-xs"
                  placeholder="Ketik catatan evaluasi keilmuan, linieritas, atau catatan administrasi kelompok..."
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                />
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedProposal(null)}
                  className="btn btn-ghost btn-sm text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingEval}
                  className="btn btn-primary btn-sm bg-purple-700 hover:bg-purple-800 border-none font-bold"
                >
                  {submittingEval ? 'Menyimpan...' : 'Simpan & Tetapkan Status Proposal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
