'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FileCheck, Plus, Search, CheckCircle2, XCircle, DollarSign, Calendar, FileText, User, Award } from 'lucide-react';
import { sippmService } from '@/services/sippm.service';
import type { KontrakKegiatan, ProposalKegiatan } from '@/types/sippm.types';
import { SippmBadge } from '@/components/sippm/SippmBadge';

// Modal <= 5 inputs (Grid 2 Kolom per crud-ui-standard)
const kontrakSchema = z.object({
  proposal_kegiatan_id: z.number().min(1, 'Pilih proposal usulan'),
  nomor_kontrak: z.string().min(5, 'Nomor kontrak minimal 5 karakter'),
  nominal_disetujui: z.number().min(1000000, 'Nominal disetujui minimal Rp 1.000.000'),
  tgl_mulai: z.string().min(1, 'Tanggal mulai wajib diisi'),
  tgl_selesai: z.string().min(1, 'Tanggal selesai wajib diisi'),
});

type KontrakFormValues = z.infer<typeof kontrakSchema>;

interface CombinedKontrakRow {
  id: string;
  type: 'pending' | 'contracted';
  proposal_id: number;
  nomor_kontrak: string;
  judul_proposal: string;
  ketua_pengusul: string;
  jangka_waktu: string;
  dana_diusulkan: number | null;
  dana_disetujui: number | null;
  status_kontrak: string;
  rawProposal?: ProposalKegiatan;
  rawKontrak?: KontrakKegiatan;
}

export default function KontrakPage() {
  const [kontrakList, setKontrakList] = useState<KontrakKegiatan[]>([]);
  const [proposalTahap3, setProposalTahap3] = useState<ProposalKegiatan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProp, setSelectedProp] = useState<ProposalKegiatan | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<KontrakFormValues>({
    resolver: zodResolver(kontrakSchema) as any,
    defaultValues: {
      proposal_kegiatan_id: 0,
      nomor_kontrak: `001/LPPM/SPK/${new Date().getFullYear()}`,
      nominal_disetujui: 25000000,
      tgl_mulai: `${new Date().getFullYear()}-09-01`,
      tgl_selesai: `${new Date().getFullYear() + 1}-02-28`,
    },
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resKontrak, resProp] = await Promise.all([
        sippmService.indexKontrak(),
        sippmService.getProposals({ per_page: 100 } as any),
      ]);

      let contracts: KontrakKegiatan[] = [];
      if (resKontrak.data) {
        contracts = Array.isArray(resKontrak.data) ? resKontrak.data : (resKontrak.data as any).data || [];
        setKontrakList(contracts);
      }

      if (resProp.data) {
        const items: ProposalKegiatan[] = Array.isArray(resProp.data)
          ? resProp.data
          : (resProp.data as any).items || (resProp.data as any).data || [];

        // Filter Tahap 3 Approved proposals
        const t3 = items.filter(
          (p) =>
            (p.status as any) === 'disetujui_admin' ||
            (p.status as any) === 'lolos' ||
            (p.status as any) === 'approved'
        );
        setProposalTahap3(t3);
      }
    } catch (err) {
      console.error('Failed to load kontrak data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Build Unified Single Table Rows
  const buildCombinedRows = (): CombinedKontrakRow[] => {
    const contractedPropIds = new Set(kontrakList.map((k) => (k as any).proposal_id || k.proposal?.id));
    const rows: CombinedKontrakRow[] = [];

    // 1. Pending Proposals from Tahap 3 (not yet contracted)
    proposalTahap3.forEach((p) => {
      if (!contractedPropIds.has(p.id)) {
        rows.push({
          id: `prop-${p.id}`,
          type: 'pending',
          proposal_id: p.id,
          nomor_kontrak: '-',
          judul_proposal: p.judul,
          ketua_pengusul: p.ketua?.nama_lengkap || (p as any).ketua_pegawai?.nama_lengkap || '-',
          jangka_waktu: '-',
          dana_diusulkan: p.dana_diusulkan || (p as any).anggaran_diajukan || null,
          dana_disetujui: null,
          status_kontrak: 'Tahap 3 Lolos (Belum Terbit SPK)',
          rawProposal: p,
        });
      }
    });

    // 2. Existing Issued Contracts
    kontrakList.forEach((k) => {
      const p = k.proposal;
      rows.push({
        id: `kontrak-${k.id}`,
        type: 'contracted',
        proposal_id: (k as any).proposal_id || k.proposal?.id || 0,
        nomor_kontrak: k.nomor_kontrak || '-',
        judul_proposal: p?.judul || 'Proposal Usulan',
        ketua_pengusul: p?.ketua?.nama_lengkap || (p as any)?.ketua_pegawai?.nama_lengkap || '-',
        jangka_waktu: k.tgl_mulai && k.tgl_selesai ? `${k.tgl_mulai} s.d ${k.tgl_selesai}` : '-',
        dana_diusulkan: p?.dana_diusulkan || (p as any)?.anggaran_diajukan || null,
        dana_disetujui: (k as any).dana_disetujui || k.nominal_dana || null,
        status_kontrak: k.is_signed ? 'Kontrak Terdandatangani' : 'SPK Diterbitkan',
        rawProposal: p,
        rawKontrak: k,
      });
    });

    return rows;
  };

  const combinedRows = buildCombinedRows();

  // Filtered Rows
  const filteredRows = combinedRows.filter(
    (row) =>
      row.nomor_kontrak.toLowerCase().includes(search.toLowerCase()) ||
      row.judul_proposal.toLowerCase().includes(search.toLowerCase()) ||
      row.ketua_pengusul.toLowerCase().includes(search.toLowerCase())
  );

  // Open Modal for Setting Nominal & Issuing SPK
  const handleOpenCreateModal = (proposal?: ProposalKegiatan) => {
    if (proposal) {
      setSelectedProp(proposal);
      setValue('proposal_kegiatan_id', proposal.id);
      setValue('nominal_disetujui', proposal.dana_diusulkan || (proposal as any).anggaran_diajukan || 25000000);
      setValue('nomor_kontrak', `SPK/LPPM/${new Date().getFullYear()}/${String(proposal.id).padStart(3, '0')}`);
    } else {
      setSelectedProp(null);
      setValue('proposal_kegiatan_id', 0);
      setValue('nominal_disetujui', 25000000);
      setValue('nomor_kontrak', `001/LPPM/SPK/${new Date().getFullYear()}`);
    }
    setIsModalOpen(true);
  };

  const onSubmit = async (data: KontrakFormValues) => {
    try {
      setSubmitting(true);
      setFeedback(null);

      // 1. Issue SPK contract via backend
      await sippmService.storeKontrak(data.proposal_kegiatan_id, {
        nomor_kontrak: data.nomor_kontrak,
        nominal_dana: data.nominal_disetujui,
        tgl_mulai: data.tgl_mulai,
        tgl_selesai: data.tgl_selesai,
      });

      // 2. Update nominal disetujui & status on proposal
      await sippmService.updateProposal(data.proposal_kegiatan_id, {
        dana_disetujui: data.nominal_disetujui,
        status: 'lolos',
      } as any);

      setFeedback({
        type: 'success',
        message: `Kontrak SPK (${data.nomor_kontrak}) berhasil diterbitkan dengan Nominal Disetujui ${formatRupiah(
          data.nominal_disetujui
        )}!`,
      });

      setIsModalOpen(false);
      reset();
      fetchData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Gagal menerbitkan kontrak hibah. Periksa kembali inputan form.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatRupiah = (val: number | null) => {
    if (val === null || val === undefined || isNaN(val)) return '-';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge badge-sippm-gold">Keuangan & Legal SIPPM</span>
            <span className="badge badge-purple font-bold">Penetapan SPK & Kontrak Hibah</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Penetapan Nominal Disetujui & Kontrak Hibah SPK
          </h1>
          <p className="text-slate-500 text-sm">
            Tabel terintegrasi penetapan nominal hibah disetujui dan penerbitan SPK untuk seluruh proposal Tahap 3.
          </p>
        </div>
        <button
          onClick={() => handleOpenCreateModal()}
          className="btn btn-primary bg-amber-600 hover:bg-amber-700 border-none shadow-sm font-bold flex items-center gap-1.5"
        >
          <Plus size={18} /> Terbitkan Kontrak Manual
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          {feedback.message}
        </div>
      )}

      {/* Filter Card */}
      <div className="card">
        <div className="card-body p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="input-wrapper w-full md:w-80">
            <span className="input-prefix-icon"><Search size={18} /></span>
            <input
              type="text"
              className="input input-icon-left"
              placeholder="Cari no kontrak / proposal / ketua..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Total <strong>{filteredRows.length}</strong> Proposal / Kontrak Terdaftar
          </div>
        </div>
      </div>

      {/* SINGLE COMBINED TABLE */}
      <div className="table-container bg-white">
        <table className="table">
          <thead>
            <tr>
              <th>NO KONTRAK</th>
              <th>JUDUL PROPOSAL</th>
              <th>KETUA PENGUSUL</th>
              <th>JANGKA WAKTU</th>
              <th>DANA DIUSULKAN</th>
              <th>DANA DISETUJUI</th>
              <th>STATUS KONTRAK</th>
              <th className="text-right">AKSI PENETAPAN</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-slate-400">
                  Memuat data kontrak hibah...
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-slate-400">
                  Belum ada proposal / kontrak hibah terdaftar.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* NO KONTRAK */}
                  <td className="font-mono text-xs font-bold text-slate-900">
                    {row.nomor_kontrak !== '-' ? (
                      <span className="text-amber-800">{row.nomor_kontrak}</span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>

                  {/* JUDUL PROPOSAL */}
                  <td>
                    <div className="font-bold text-slate-900 line-clamp-1">{row.judul_proposal}</div>
                  </td>

                  {/* KETUA PENGUSUL */}
                  <td className="text-xs text-slate-700 font-semibold">
                    {row.ketua_pengusul}
                  </td>

                  {/* JANGKA WAKTU */}
                  <td className="text-xs text-slate-600 font-mono font-medium">
                    {row.jangka_waktu}
                  </td>

                  {/* DANA DIUSULKAN */}
                  <td className="font-bold text-teal-700 text-xs">
                    {formatRupiah(row.dana_diusulkan)}
                  </td>

                  {/* DANA DISETUJUI */}
                  <td className="font-extrabold text-emerald-700 text-xs">
                    {formatRupiah(row.dana_disetujui)}
                  </td>

                  {/* STATUS KONTRAK */}
                  <td>
                    {row.type === 'pending' ? (
                      <span className="badge badge-amber font-bold text-[11px] flex items-center gap-1">
                        Belum Terbit SPK
                      </span>
                    ) : (
                      <span className="badge badge-green font-bold text-[11px] flex items-center gap-1">
                        <CheckCircle2 size={12} /> {row.status_kontrak}
                      </span>
                    )}
                  </td>

                  {/* AKSI PENETAPAN */}
                  <td>
                    <div className="flex items-center justify-end gap-2">
                      {row.type === 'pending' && row.rawProposal ? (
                        <button
                          onClick={() => handleOpenCreateModal(row.rawProposal)}
                          className="btn btn-primary btn-sm bg-emerald-600 hover:bg-emerald-700 border-none font-bold shadow-xs flex items-center gap-1.5"
                        >
                          <DollarSign size={14} /> Tetapkan & Terbitkan SPK
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                          <CheckCircle2 size={14} className="text-emerald-500" /> Diterbitkan
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL FORM PENETAPAN NOMINAL & KONTRAK SPK (Grid 2 Kolom per crud-ui-standard) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <FileCheck className="text-amber-600" size={20} /> Penetapan Nominal & Terbitkan SPK
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost btn-sm">✕</button>
            </div>

            {selectedProp && (
              <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs space-y-1">
                <div className="font-extrabold text-slate-900">{selectedProp.judul}</div>
                <div className="text-slate-700 flex items-center gap-3">
                  <span>Dana Diusulkan Dosen: <strong className="text-teal-800 font-bold">{formatRupiah(selectedProp.dana_diusulkan || (selectedProp as any).anggaran_diajukan || 0)}</strong></span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="form-group">
                <label className="form-label font-bold text-xs">Pilih Proposal Tahap 3 Disetujui <span className="required">*</span></label>
                <select
                  className={`input text-xs ${errors.proposal_kegiatan_id ? 'error' : ''}`}
                  {...register('proposal_kegiatan_id', { valueAsNumber: true })}
                >
                  <option value={0}>-- Pilih Proposal Tahap 3 --</option>
                  {proposalTahap3.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.judul} (Diusulkan: {formatRupiah(p.dana_diusulkan || (p as any).anggaran_diajukan || 0)})
                    </option>
                  ))}
                </select>
                {errors.proposal_kegiatan_id && <span className="form-error">{errors.proposal_kegiatan_id.message}</span>}
              </div>

              {/* Grid 2 Kolom per crud-ui-standard */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label font-bold text-xs">Nomor Surat SPK Kontrak <span className="required">*</span></label>
                  <input
                    type="text"
                    className={`input text-xs font-mono ${errors.nomor_kontrak ? 'error' : ''}`}
                    placeholder="001/LPPM/SPK/2026"
                    {...register('nomor_kontrak')}
                  />
                  {errors.nomor_kontrak && <span className="form-error">{errors.nomor_kontrak.message}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label font-bold text-xs">Nominal Dana Disetujui (Rp) <span className="required">*</span></label>
                  <input
                    type="number"
                    className={`input text-xs font-bold text-emerald-800 ${errors.nominal_disetujui ? 'error' : ''}`}
                    placeholder="25000000"
                    {...register('nominal_disetujui', { valueAsNumber: true })}
                  />
                  {errors.nominal_disetujui && <span className="form-error">{errors.nominal_disetujui.message}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label font-bold text-xs">Tanggal Mulai SPK <span className="required">*</span></label>
                  <input
                    type="date"
                    className={`input text-xs ${errors.tgl_mulai ? 'error' : ''}`}
                    {...register('tgl_mulai')}
                  />
                  {errors.tgl_mulai && <span className="form-error">{errors.tgl_mulai.message}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label font-bold text-xs">Tanggal Selesai SPK <span className="required">*</span></label>
                  <input
                    type="date"
                    className={`input text-xs ${errors.tgl_selesai ? 'error' : ''}`}
                    {...register('tgl_selesai')}
                  />
                  {errors.tgl_selesai && <span className="form-error">{errors.tgl_selesai.message}</span>}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost btn-sm text-slate-600">
                  Batal
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary btn-sm bg-emerald-700 hover:bg-emerald-800 border-none font-bold">
                  {submitting ? 'Menerbitkan...' : 'Tetapkan Nominal & Terbitkan SPK'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
