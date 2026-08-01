'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, Plus, Search, CheckCircle2, XCircle, Clock, DollarSign } from 'lucide-react';
import { sippmService } from '@/services/sippm.service';
import type { PeriodeHibah } from '@/types/sippm.types';

const periodeSchema = z.object({
  tahun_anggaran: z.string().min(4, 'Tahun anggaran wajib diisi'),
  nama_periode: z.string().min(3, 'Nama periode minimal 3 karakter'),
  tgl_buka: z.string().min(1, 'Tanggal buka wajib diisi'),
  tgl_tutup: z.string().min(1, 'Tanggal tutup wajib diisi'),
  total_anggaran: z.number().min(10000000, 'Total anggaran minimal Rp 10.000.000'),
});

type PeriodeFormValues = z.infer<typeof periodeSchema>;

export default function MasterPeriodePage() {
  const [periodeList, setPeriodeList] = useState<PeriodeHibah[]>([]);
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
  } = useForm<PeriodeFormValues>({
    resolver: zodResolver(periodeSchema) as any,
    defaultValues: {
      tahun_anggaran: '2026/2027',
      nama_periode: 'Periode Hibah Internal 2026',
      tgl_buka: '2026-08-01',
      tgl_tutup: '2026-09-30',
      total_anggaran: 500000000,
    },
  });

  const fetchPeriode = async () => {
    try {
      setLoading(true);
      const res = await sippmService.indexPeriode();
      const list = Array.isArray(res.data)
        ? res.data
        : (res?.data as any)?.items || (res?.data as any)?.data || [];
      setPeriodeList(list);
    } catch (err) {
      console.error('Failed to fetch periode', err);
      setPeriodeList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeriode();
  }, []);

  const onSubmit = async (data: PeriodeFormValues) => {
    try {
      setSubmitting(true);
      setFeedback(null);
      await sippmService.storePeriode({
        ...data,
        tgl_tutup_review: data.tgl_tutup,
      });
      setFeedback({ type: 'success', message: 'Periode hibah baru berhasil ditambahkan' });
      setIsModalOpen(false);
      reset();
      fetchPeriode();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Gagal menyimpan periode' });
    } finally {
      setSubmitting(false);
    }
  };

  const safeList = Array.isArray(periodeList) ? periodeList : [];
  const filteredList = safeList.filter(
    (item) =>
      (item.nama_periode || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.tahun_anggaran || '').toLowerCase().includes(search.toLowerCase())
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
            <span className="badge badge-sippm">Master Data SIPPM</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">Master Periode Hibah</h1>
          <p className="text-slate-500 text-sm">Pengaturan jadwal pendaftaran hibah riset & alokasi pagu anggaran tahunan.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary bg-teal-600 hover:bg-teal-700 border-none shadow-sm">
          <Plus size={18} /> Buat Periode Baru
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
              placeholder="Cari periode / tahun..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Total {filteredList.length} Periode Hibah
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container bg-white">
        <table className="table">
          <thead>
            <tr>
              <th>Tahun</th>
              <th>Nama Periode</th>
              <th>Jadwal Pendaftaran</th>
              <th>Total Anggaran</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-400">Memuat periode hibah...</td>
              </tr>
            ) : filteredList.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-400">Belum ada periode hibah terdaftar.</td>
              </tr>
            ) : (
              filteredList.map((item) => (
                <tr key={item.id}>
                  <td className="font-mono text-xs font-bold text-teal-700">{item.tahun_anggaran}</td>
                  <td className="font-bold text-slate-800">{item.nama_periode}</td>
                  <td className="text-slate-600 text-xs">
                    <div className="flex items-center gap-1 font-medium text-slate-700">
                      <Clock size={14} className="text-teal-600" />
                      {item.tgl_buka} s.d {item.tgl_tutup}
                    </div>
                  </td>
                  <td className="font-bold text-teal-700">{formatRupiah(item.total_anggaran)}</td>
                  <td>
                    <span className={`badge ${item.is_active ? 'badge-green badge-dot' : 'badge-gray'}`}>
                      {item.is_active ? 'Aktif' : 'Tutup'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form <= 5 inputs (Grid 2 Kolom) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Calendar className="text-teal-600" size={20} /> Buat Periode Hibah Baru
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost btn-sm">✕</button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Tahun Anggaran <span className="required">*</span></label>
                  <input type="text" className={`input ${errors.tahun_anggaran ? 'error' : ''}`} placeholder="2026/2027" {...register('tahun_anggaran')} />
                  {errors.tahun_anggaran && <span className="form-error">{errors.tahun_anggaran.message}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Total Pagu Anggaran (Rp) <span className="required">*</span></label>
                  <input type="number" className={`input ${errors.total_anggaran ? 'error' : ''}`} placeholder="500000000" {...register('total_anggaran')} />
                  {errors.total_anggaran && <span className="form-error">{errors.total_anggaran.message}</span>}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Nama Periode Hibah <span className="required">*</span></label>
                <input type="text" className={`input ${errors.nama_periode ? 'error' : ''}`} placeholder="Misal: Hibah Internal Periode II 2026" {...register('nama_periode')} />
                {errors.nama_periode && <span className="form-error">{errors.nama_periode.message}</span>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Tanggal Buka Pendaftaran <span className="required">*</span></label>
                  <input type="date" className={`input ${errors.tgl_buka ? 'error' : ''}`} {...register('tgl_buka')} />
                  {errors.tgl_buka && <span className="form-error">{errors.tgl_buka.message}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Tanggal Tutup Pendaftaran <span className="required">*</span></label>
                  <input type="date" className={`input ${errors.tgl_tutup ? 'error' : ''}`} {...register('tgl_tutup')} />
                  {errors.tgl_tutup && <span className="form-error">{errors.tgl_tutup.message}</span>}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Batal
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary bg-teal-600 hover:bg-teal-700 border-none">
                  {submitting ? 'Menyimpan...' : 'Simpan Periode'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
