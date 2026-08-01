'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FileCheck, Plus, Search, CheckCircle2, XCircle, DollarSign, Calendar, FileText } from 'lucide-react';
import { sippmService } from '@/services/sippm.service';
import type { KontrakKegiatan, ProposalKegiatan } from '@/types/sippm.types';
import { SippmBadge } from '@/components/sippm/SippmBadge';

// Modal <= 5 inputs
const kontrakSchema = z.object({
  proposal_kegiatan_id: z.number().min(1, 'Pilih proposal usulan'),
  nomor_kontrak: z.string().min(5, 'Nomor kontrak minimal 5 karakter'),
  nominal_disetujui: z.number().min(1000000, 'Nominal disetujui minimal Rp 1.000.000'),
  tgl_mulai: z.string().min(1, 'Tanggal mulai wajib diisi'),
  tgl_selesai: z.string().min(1, 'Tanggal selesai wajib diisi'),
});

type KontrakFormValues = z.infer<typeof kontrakSchema>;

export default function KontrakPage() {
  const [kontrakList, setKontrakList] = useState<KontrakKegiatan[]>([]);
  const [proposalApproved, setProposalApproved] = useState<ProposalKegiatan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<KontrakFormValues>({
    resolver: zodResolver(kontrakSchema) as any,
    defaultValues: {
      proposal_kegiatan_id: 0,
      nomor_kontrak: '001/LPPM/KONTRAK/2026',
      nominal_disetujui: 25000000,
      tgl_mulai: '2026-09-01',
      tgl_selesai: '2027-02-28',
    },
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resKontrak, resProp] = await Promise.all([
        sippmService.indexKontrak(),
        sippmService.getProposals({ status: 'approved' }),
      ]);
      if (resKontrak.data) setKontrakList(resKontrak.data);
      if (resProp.data) {
        const items = Array.isArray(resProp.data) ? resProp.data : (resProp.data as any).items || [];
        setProposalApproved(items);
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

  const onSubmit = async (data: KontrakFormValues) => {
    try {
      setSubmitting(true);
      setFeedback(null);
      await sippmService.storeKontrak(data.proposal_kegiatan_id, {
        nomor_kontrak: data.nomor_kontrak,
        nominal_dana: data.nominal_disetujui,
        tgl_mulai: data.tgl_mulai,
        tgl_selesai: data.tgl_selesai,
      });
      setFeedback({ type: 'success', message: 'Kontrak hibah berhasil dibuat' });
      setIsModalOpen(false);
      reset();
      fetchData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Gagal membuat kontrak' });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredList = kontrakList.filter(
    (item) =>
      item.nomor_kontrak.toLowerCase().includes(search.toLowerCase()) ||
      item.proposal?.judul.toLowerCase().includes(search.toLowerCase())
  );

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge badge-sippm-gold">Keuangan & Legal SIPPM</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">Kontrak Hibah Kegiatan</h1>
          <p className="text-slate-500 text-sm">Kelola penandatanganan SPK & alokasi pencairan dana hibah penelitian.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary bg-amber-600 hover:bg-amber-700 border-none shadow-sm font-bold">
          <Plus size={18} /> Buat Kontrak Baru
        </button>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
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
              placeholder="Cari no kontrak / judul proposal..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Total {filteredList.length} Kontrak Terbit
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="table-container bg-white">
        <table className="table">
          <thead>
            <tr>
              <th>Nomor Kontrak</th>
              <th>Judul Proposal</th>
              <th>Jangka Waktu Kontrak</th>
              <th>Nominal Dana Disetujui</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-slate-400">Memuat data kontrak hibah...</td>
              </tr>
            ) : filteredList.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-slate-400">Belum ada kontrak hibah diterbitkan.</td>
              </tr>
            ) : (
              filteredList.map((item) => (
                <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                  <td className="font-mono text-xs font-bold text-amber-800">{item.nomor_kontrak}</td>
                  <td>
                    <div className="font-bold text-slate-900 line-clamp-1">{item.proposal?.judul || 'Proposal'}</div>
                    <div className="text-xs text-slate-500 mt-0.5">Ketua: {item.proposal?.ketua?.nama_lengkap || '-'}</div>
                  </td>
                  <td className="text-xs text-slate-600 font-medium">
                    {item.tgl_mulai} s.d {item.tgl_selesai}
                  </td>
                  <td className="font-extrabold text-teal-700">{formatRupiah(item.nominal_dana || 0)}</td>
                  <td>
                    <SippmBadge status={item.is_signed ? 'contracted' : 'approved'} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form <= 5 Input Form (Grid 2 Kolom per crud-ui-standard) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <FileCheck className="text-amber-600" size={20} /> Terbitkan Kontrak Hibah Baru
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost btn-sm">✕</button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Pilih Proposal Disetujui <span className="required">*</span></label>
                <select className={`input ${errors.proposal_kegiatan_id ? 'error' : ''}`} {...register('proposal_kegiatan_id', { valueAsNumber: true })}>
                  <option value={0}>-- Pilih Proposal --</option>
                  {proposalApproved.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.judul} (Ketua: {p.ketua?.nama_lengkap})
                    </option>
                  ))}
                </select>
                {errors.proposal_kegiatan_id && <span className="form-error">{errors.proposal_kegiatan_id.message}</span>}
              </div>

              {/* Grid 2 Kolom per crud-ui-standard */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Nomor Kontrak SPK <span className="required">*</span></label>
                  <input type="text" className={`input ${errors.nomor_kontrak ? 'error' : ''}`} placeholder="001/LPPM/KONTRAK/2026" {...register('nomor_kontrak')} />
                  {errors.nomor_kontrak && <span className="form-error">{errors.nomor_kontrak.message}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Nominal Dana Disetujui (Rp) <span className="required">*</span></label>
                  <input type="number" className={`input ${errors.nominal_disetujui ? 'error' : ''}`} placeholder="25000000" {...register('nominal_disetujui', { valueAsNumber: true })} />
                  {errors.nominal_disetujui && <span className="form-error">{errors.nominal_disetujui.message}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Tanggal Mulai Kontrak <span className="required">*</span></label>
                  <input type="date" className={`input ${errors.tgl_mulai ? 'error' : ''}`} {...register('tgl_mulai')} />
                  {errors.tgl_mulai && <span className="form-error">{errors.tgl_mulai.message}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Tanggal Selesai Kontrak <span className="required">*</span></label>
                  <input type="date" className={`input ${errors.tgl_selesai ? 'error' : ''}`} {...register('tgl_selesai')} />
                  {errors.tgl_selesai && <span className="form-error">{errors.tgl_selesai.message}</span>}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Batal
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary bg-amber-600 hover:bg-amber-700 border-none font-bold">
                  {submitting ? 'Menerbitkan...' : 'Terbitkan Kontrak'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
