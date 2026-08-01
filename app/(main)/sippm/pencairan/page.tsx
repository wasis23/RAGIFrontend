'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreditCard, Plus, Search, CheckCircle2, XCircle, DollarSign, Upload, Building } from 'lucide-react';
import { sippmService } from '@/services/sippm.service';
import type { PencairanDanaHibah, KontrakKegiatan } from '@/types/sippm.types';
import { SippmBadge } from '@/components/sippm/SippmBadge';

const pencairanSchema = z.object({
  kontrak_kegiatan_id: z.number().min(1, 'Pilih kontrak hibah'),
  termin_ke: z.number().min(1, 'Termin minimal 1').max(2, 'Termin maksimal 2'),
  nominal_cair: z.number().min(1000000, 'Nominal pencairan minimal Rp 1.000.000'),
  nama_bank: z.string().min(2, 'Nama bank wajib diisi'),
  nomor_rekening: z.string().min(5, 'Nomor rekening wajib diisi'),
});

type PencairanFormValues = z.infer<typeof pencairanSchema>;

export default function PencairanPage() {
  const [pencairanList, setPencairanList] = useState<PencairanDanaHibah[]>([]);
  const [kontrakList, setKontrakList] = useState<KontrakKegiatan[]>([]);
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
  } = useForm<PencairanFormValues>({
    resolver: zodResolver(pencairanSchema) as any,
    defaultValues: {
      kontrak_kegiatan_id: 0,
      termin_ke: 1,
      nominal_cair: 17500000,
      nama_bank: 'Bank Mandiri',
      nomor_rekening: '1370001234567',
    },
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const resKontrak = await sippmService.indexKontrak();
      if (resKontrak.data) {
        setKontrakList(resKontrak.data);
      }
    } catch (err) {
      console.error('Failed to load pencairan data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onSubmit = async (data: PencairanFormValues) => {
    try {
      setSubmitting(true);
      setFeedback(null);
      await sippmService.requestPencairan(data.kontrak_kegiatan_id, {
        termin: data.termin_ke,
        nominal: data.nominal_cair,
        catatan_keuangan: `Pencairan bank ${data.nama_bank} - Rek: ${data.nomor_rekening}`,
      });
      setFeedback({ type: 'success', message: 'Permohonan pencairan dana berhasil diajukan' });
      setIsModalOpen(false);
      reset();
      fetchData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Gagal mengajukan pencairan' });
    } finally {
      setSubmitting(false);
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge badge-sippm-gold">Keuangan & Pencairan SIPPM</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">Pencairan Dana Hibah Riset</h1>
          <p className="text-slate-500 text-sm">Pengajuan pencairan Termin 1 (70%) & Termin 2 (30%) beserta kelengkapan LPJ.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary bg-teal-600 hover:bg-teal-700 border-none shadow-sm font-bold">
          <Plus size={18} /> Pengajuan Pencairan Dana
        </button>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          {feedback.message}
        </div>
      )}

      {/* Kontrak Hibah & Termins Card */}
      <div className="card">
        <div className="card-header bg-slate-50">
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <CreditCard size={18} className="text-teal-600" /> Daftar Kontrak Aktif & Status Pencairan
          </h2>
        </div>
        <div className="card-body p-0">
          <div className="table-container bg-white">
            <table className="table">
              <thead>
                <tr>
                  <th>Nomor Kontrak</th>
                  <th>Proposal & Ketua</th>
                  <th>Total Disetujui</th>
                  <th>Termin 1 (70%)</th>
                  <th>Termin 2 (30%)</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400">Memuat data kontrak...</td>
                  </tr>
                ) : kontrakList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400">Belum ada kontrak terdaftar untuk pencairan.</td>
                  </tr>
                ) : (
                  kontrakList.map((k) => (
                    <tr key={k.id}>
                      <td className="font-mono text-xs font-bold text-teal-800">{k.nomor_kontrak}</td>
                      <td>
                        <div className="font-bold text-slate-900">{k.proposal?.judul || 'Proposal'}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{k.proposal?.ketua?.nama_lengkap}</div>
                      </td>
                      <td className="font-extrabold text-teal-700">{formatRupiah(k.nominal_dana || 0)}</td>
                      <td>
                        <div className="text-xs font-bold text-slate-700">{formatRupiah((k.nominal_dana || 0) * 0.7)}</div>
                        <span className="badge badge-green mt-1">Ready to Disburse</span>
                      </td>
                      <td>
                        <div className="text-xs font-bold text-slate-700">{formatRupiah((k.nominal_dana || 0) * 0.3)}</div>
                        <span className="badge badge-gray mt-1">Menunggu LPJ 70%</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Form <= 5 inputs (Grid 2 Kolom per crud-ui-standard) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Building className="text-teal-600" size={20} /> Pengajuan Pencairan Dana Hibah
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost btn-sm">✕</button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Pilih Kontrak Hibah <span className="required">*</span></label>
                <select className={`input ${errors.kontrak_kegiatan_id ? 'error' : ''}`} {...register('kontrak_kegiatan_id', { valueAsNumber: true })}>
                  <option value={0}>-- Pilih Kontrak --</option>
                  {kontrakList.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nomor_kontrak} - {k.proposal?.judul}
                    </option>
                  ))}
                </select>
                {errors.kontrak_kegiatan_id && <span className="form-error">{errors.kontrak_kegiatan_id.message}</span>}
              </div>

              {/* Grid 2 Kolom per crud-ui-standard */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Termin Ke- <span className="required">*</span></label>
                  <select className="input" {...register('termin_ke', { valueAsNumber: true })}>
                    <option value={1}>Termin 1 (70% Dana Initial)</option>
                    <option value={2}>Termin 2 (30% Pelunasan LPJ)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Nominal Pencairan (Rp) <span className="required">*</span></label>
                  <input type="number" className={`input ${errors.nominal_cair ? 'error' : ''}`} placeholder="17500000" {...register('nominal_cair', { valueAsNumber: true })} />
                  {errors.nominal_cair && <span className="form-error">{errors.nominal_cair.message}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Nama Bank Rekening <span className="required">*</span></label>
                  <input type="text" className={`input ${errors.nama_bank ? 'error' : ''}`} placeholder="Misal: Bank Mandiri / BNI" {...register('nama_bank')} />
                  {errors.nama_bank && <span className="form-error">{errors.nama_bank.message}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Nomor Rekening Tujuan <span className="required">*</span></label>
                  <input type="text" className={`input ${errors.nomor_rekening ? 'error' : ''}`} placeholder="137000xxxx" {...register('nomor_rekening')} />
                  {errors.nomor_rekening && <span className="form-error">{errors.nomor_rekening.message}</span>}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Batal
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary bg-teal-600 hover:bg-teal-700 border-none font-bold">
                  {submitting ? 'Mengirim...' : 'Kirim Pengajuan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
