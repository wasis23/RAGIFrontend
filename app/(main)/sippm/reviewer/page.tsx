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
  UserPlus,
  ShieldAlert,
  User,
  FlaskConical,
  XCircle,
} from 'lucide-react';
import { SippmBadge } from '@/components/sippm/SippmBadge';
import { sippmService } from '@/services/sippm.service';
import { simpegService } from '@/services/simpeg.service';
import { useAuth } from '@/hooks/useAuth';
import type { ReviewerKegiatan, ProposalKegiatan } from '@/types/sippm.types';

export default function ReviewerPortalPage() {
  const { user, hasRole, isAdmin } = useAuth();
  const isLppmAdmin = isAdmin || hasRole('admin_lppm') || hasRole('superadmin');

  // State Tabs
  const [activeTab, setActiveTab] = useState<'assigned' | 'plotting'>(isLppmAdmin ? 'plotting' : 'assigned');

  // Assigned Reviewer Proposals (Reviewer View)
  const [assignedList, setAssignedList] = useState<ReviewerKegiatan[]>([]);
  const [loadingAssigned, setLoadingAssigned] = useState(true);

  // All Submitted Proposals (Admin LPPM View)
  const [submittedProposals, setSubmittedProposals] = useState<ProposalKegiatan[]>([]);
  const [dosenList, setDosenList] = useState<any[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(true);

  // Search
  const [search, setSearch] = useState('');

  // Plotting Modal State (<= 5 inputs: Proposal, Reviewer 1, Reviewer 2)
  const [selectedProposal, setSelectedProposal] = useState<ProposalKegiatan | null>(null);
  const [reviewer1Id, setReviewer1Id] = useState<string>('');
  const [reviewer2Id, setReviewer2Id] = useState<string>('');
  const [submittingPlot, setSubmittingPlot] = useState(false);
  const [plotError, setPlotError] = useState<string | null>(null);
  const [plotSuccess, setPlotSuccess] = useState<string | null>(null);

  const fetchAssignedProposals = async () => {
    try {
      setLoadingAssigned(true);
      const res = await sippmService.myAssignedProposals();
      const list = Array.isArray(res?.data)
        ? res.data
        : (res?.data as any)?.items || (res?.data as any)?.data || [];
      setAssignedList(list);
    } catch (err) {
      console.error('Failed to load assigned proposals', err);
      setAssignedList([]);
    } finally {
      setLoadingAssigned(false);
    }
  };

  const fetchSubmittedProposals = async () => {
    try {
      setLoadingProposals(true);
      const res = await sippmService.getProposals({ status: 'submitted' as any });
      const items = Array.isArray(res.data) ? res.data : (res.data as any)?.items || (res.data as any)?.data || [];
      setSubmittedProposals(items);
    } catch (err) {
      console.error('Failed to load submitted proposals', err);
      setSubmittedProposals([]);
    } finally {
      setLoadingProposals(false);
    }
  };

  const fetchDosenList = async () => {
    try {
      const res = await simpegService.getPegawaiList({ jenis_pegawai: 'dosen' });
      const list = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
      setDosenList(list);
    } catch (err) {
      console.error('Failed to load dosen list for reviewers', err);
    }
  };

  useEffect(() => {
    fetchAssignedProposals();
    if (isLppmAdmin) {
      fetchSubmittedProposals();
      fetchDosenList();
    }
  }, [isLppmAdmin]);

  const handleOpenPlotModal = (proposal: ProposalKegiatan) => {
    setSelectedProposal(proposal);
    setReviewer1Id('');
    setReviewer2Id('');
    setPlotError(null);
    setPlotSuccess(null);
  };

  const handleSavePlotting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProposal) return;
    if (!reviewer1Id || !reviewer2Id) {
      setPlotError('Wajib memilih Reviewer 1 dan Reviewer 2');
      return;
    }
    if (reviewer1Id === reviewer2Id) {
      setPlotError('Reviewer 1 dan Reviewer 2 tidak boleh orang yang sama');
      return;
    }

    try {
      setSubmittingPlot(true);
      setPlotError(null);
      await sippmService.assignReviewer(selectedProposal.id, {
        reviewer_ids: [Number(reviewer1Id), Number(reviewer2Id)],
      });
      setPlotSuccess(`Berhasil memplot 2 Reviewer untuk proposal "${selectedProposal.judul.substring(0, 30)}..."`);
      setTimeout(() => {
        setSelectedProposal(null);
        fetchSubmittedProposals();
      }, 1500);
    } catch (err: any) {
      setPlotError(err.response?.data?.message || 'Gagal menyimpan penugasan reviewer');
    } finally {
      setSubmittingPlot(false);
    }
  };

  // Filtered lists
  const filteredAssigned = (Array.isArray(assignedList) ? assignedList : []).filter(
    (item) =>
      (item.proposal?.judul || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.proposal?.ketua?.nama_lengkap || '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredProposals = (Array.isArray(submittedProposals) ? submittedProposals : []).filter(
    (item) =>
      (item.judul || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.ketua?.nama_lengkap || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge badge-sippm">Fase 4: Reviewer & Evaluasi Substantif</span>
            {isLppmAdmin && (
              <span className="badge badge-purple font-bold">Admin LPPM Mode</span>
            )}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Penugasan Dual Reviewer & Scoring Rubrik
          </h1>
          <p className="text-slate-500 text-sm">
            Kelola penugasan reviewer independen, penilaian desk evaluation, dan penetapan kelayakan hibah.
          </p>
        </div>
      </div>

      {/* Tabs Menu (Admin LPPM vs Reviewer Portal) */}
      <div className="flex items-center border-b border-slate-200 gap-2">
        {isLppmAdmin && (
          <button
            onClick={() => setActiveTab('plotting')}
            className={`px-4 py-2.5 text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'plotting'
                ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users size={16} /> Plotting Dual Reviewer ({submittedProposals.length})
          </button>
        )}

        <button
          onClick={() => setActiveTab('assigned')}
          className={`px-4 py-2.5 text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'assigned'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ClipboardCheck size={16} /> Tugas Evaluasi Saya ({assignedList.length})
        </button>
      </div>

      {/* Filter Card */}
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
          <div className="text-xs text-slate-500 font-medium">
            Tampilan: {activeTab === 'plotting' ? 'Panel Plotting Admin LPPM' : 'Portal Reviewer Independen'}
          </div>
        </div>
      </div>

      {/* TAB 1: PLOTTING DUAL REVIEWER (ADMIN LPPM VIEW) */}
      {activeTab === 'plotting' && isLppmAdmin && (
        <div className="table-container bg-white">
          <table className="table">
            <thead>
              <tr>
                <th>Judul Proposal Usulan</th>
                <th>Ketua Pengusul & Prodi</th>
                <th>Skema & Dana</th>
                <th>Status Reviewer</th>
                <th className="text-right">Aksi Plotting</th>
              </tr>
            </thead>
            <tbody>
              {loadingProposals ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400">Memuat proposal siap di-review...</td>
                </tr>
              ) : filteredProposals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CheckCircle2 size={32} className="text-emerald-400" />
                      <span>Semua proposal diajukan telah selesai di-plot reviewer!</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProposals.map((item) => {
                  const reviewerCount = item.reviewers?.length || 0;
                  return (
                    <tr key={item.id} className="hover:bg-purple-50/30 transition-colors">
                      <td>
                        <div className="font-bold text-slate-900 line-clamp-1">{item.judul}</div>
                        <div className="text-xs text-purple-700 font-medium mt-0.5">{item.rumpun_ilmu}</div>
                      </td>
                      <td>
                        <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                          <User size={14} className="text-slate-400" />
                          {item.ketua?.nama_lengkap || 'Dosen Pengusul'}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{item.ketua?.program_studi || 'Prodi Kampus'}</div>
                      </td>
                      <td>
                        <div className="text-xs font-bold text-slate-700">{item.skema?.nama_skema || item.skema?.nama || 'Skema Riset'}</div>
                        <div className="text-xs font-mono font-bold text-teal-700">
                          Rp {(item.dana_diusulkan || 0).toLocaleString('id-ID')}
                        </div>
                      </td>
                      <td>
                        {reviewerCount >= 2 ? (
                          <span className="badge badge-green font-bold text-[11px] flex items-center gap-1">
                            <CheckCircle2 size={12} /> Dual Reviewer Plot (2/2)
                          </span>
                        ) : reviewerCount === 1 ? (
                          <span className="badge badge-amber font-bold text-[11px] flex items-center gap-1">
                            <AlertTriangle size={12} /> Reviewer 1 Di-assign (1/2)
                          </span>
                        ) : (
                          <span className="badge badge-red font-bold text-[11px]">Belum Di-assign (0/2)</span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenPlotModal(item)}
                            className="btn btn-primary btn-sm bg-purple-700 hover:bg-purple-800 border-none font-bold shadow-xs flex items-center gap-1.5"
                          >
                            <UserPlus size={14} /> Plot Dual Reviewer
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: PORTAL PENUGASAN REVIEWER (REVIEWER VIEW) */}
      {activeTab === 'assigned' && (
        <div className="table-container bg-white">
          <table className="table">
            <thead>
              <tr>
                <th>Judul Proposal Usulan</th>
                <th>Ketua Pengusul</th>
                <th>Status Evaluasi</th>
                <th>Rekomendasi Keputusan</th>
                <th className="text-right">Aksi Reviewer</th>
              </tr>
            </thead>
            <tbody>
              {loadingAssigned ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400">Memuat penugasan proposal...</td>
                </tr>
              ) : filteredAssigned.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ClipboardCheck size={32} className="text-slate-300" />
                      <span>Belum ada proposal yang ditugaskan kepada Anda untuk direview.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAssigned.map((item) => (
                  <tr key={item.id} className="hover:bg-teal-50/40 transition-colors">
                    <td>
                      <div className="font-bold text-slate-900 line-clamp-1">{item.proposal?.judul || 'Proposal Riset'}</div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <span className="font-medium text-teal-700">{item.proposal?.skema?.nama_skema || 'Skema Riset'}</span>
                        <span>•</span>
                        <span className="font-mono">Dana: Rp {(item.proposal?.dana_diusulkan || 0).toLocaleString('id-ID')}</span>
                      </div>
                    </td>
                    <td>
                      <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                        <User size={14} className="text-slate-400" />
                        {item.proposal?.ketua?.nama_lengkap || 'Dosen Pengusul'}
                      </div>
                    </td>
                    <td>
                      <SippmBadge status={item.status} type="reviewer" />
                    </td>
                    <td>
                      {item.penilaian ? (
                        <SippmBadge status={item.penilaian.rekomendasi} type="rekomendasi" />
                      ) : (
                        <span className="text-xs text-slate-400 italic font-medium">Belum Diisi</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/sippm/reviewer/${item.id}/evaluate`}
                          className="btn btn-primary btn-sm bg-teal-600 hover:bg-teal-700 border-none shadow-xs font-bold"
                        >
                          <ClipboardCheck size={16} /> Form Scoring Rubrik
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* PLOTTING MODAL (<= 5 Inputs, 2-Column Grid per crud-ui-standard) */}
      {selectedProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <UserPlus className="text-purple-700" size={20} /> Plotting Dual Reviewer Proposal
              </h2>
              <button onClick={() => setSelectedProposal(null)} className="btn btn-ghost btn-sm">✕</button>
            </div>

            {/* Proposal Context Box */}
            <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-100 space-y-1 text-xs">
              <div className="font-extrabold text-slate-900">{selectedProposal.judul}</div>
              <div className="text-slate-600 flex items-center gap-3">
                <span>Ketua: <strong>{selectedProposal.ketua?.nama_lengkap || 'Dosen Pengusul'}</strong></span>
                <span>•</span>
                <span>Prodi: <strong>{selectedProposal.ketua?.program_studi || 'Informatika'}</strong></span>
              </div>
            </div>

            {plotError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
                <XCircle size={16} /> {plotError}
              </div>
            )}

            {plotSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 size={16} /> {plotSuccess}
              </div>
            )}

            {/* FORM HAS <= 5 INPUTS -> MODAL GRID MAKS 2 KOLOM per crud-ui-standard */}
            <form onSubmit={handleSavePlotting} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Input 1: Reviewer 1 */}
                <div className="form-group">
                  <label className="form-label font-bold text-slate-700 text-xs">Pilih Reviewer 1 <span className="text-rose-500">*</span></label>
                  <select
                    className="input text-xs"
                    value={reviewer1Id}
                    onChange={(e) => setReviewer1Id(e.target.value)}
                    required
                  >
                    <option value="">-- Pilih Dosen Reviewer 1 --</option>
                    {dosenList.map((d: any) => (
                      <option key={d.id} value={d.id}>
                        {d.nama_lengkap || d.name} ({d.unit_kerja?.nama || 'Dosen Expert'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Input 2: Reviewer 2 */}
                <div className="form-group">
                  <label className="form-label font-bold text-slate-700 text-xs">Pilih Reviewer 2 <span className="text-rose-500">*</span></label>
                  <select
                    className="input text-xs"
                    value={reviewer2Id}
                    onChange={(e) => setReviewer2Id(e.target.value)}
                    required
                  >
                    <option value="">-- Pilih Dosen Reviewer 2 --</option>
                    {dosenList.map((d: any) => (
                      <option key={d.id} value={d.id}>
                        {d.nama_lengkap || d.name} ({d.unit_kerja?.nama || 'Dosen Expert'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Conflict of Interest Notice */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
                <ShieldAlert size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Aturan Anti-Konflik Kepentingan (COI)</strong>: Reviewer 1 dan Reviewer 2 tidak boleh dari tim pengusul yang sama untuk menjamin obyektifitas penilaian.
                </span>
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
                  disabled={submittingPlot}
                  className="btn btn-primary btn-sm bg-purple-700 hover:bg-purple-800 border-none font-bold"
                >
                  {submittingPlot ? 'Menyimpan...' : 'Simpan Dual Reviewer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
