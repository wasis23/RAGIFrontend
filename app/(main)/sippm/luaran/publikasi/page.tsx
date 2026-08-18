'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BookOpen, Plus, Search, CheckCircle2, XCircle, ExternalLink, Award, FileText } from 'lucide-react';
import { sippmService } from '@/services/sippm.service';
import type { PublikasiIlmiah, KategoriPublikasi, StatusVerifikasiLuaran } from '@/types/sippm.types';
import { SippmBadge } from '@/components/sippm/SippmBadge';

const publikasiSchema = z.object({
  judul_artikel: z.string().min(5, 'Judul artikel minimal 5 karakter'),
  nama_jurnal: z.string().min(3, 'Nama jurnal wajib diisi'),
  kategori_publikasi: z.enum(['scopus', 'wos', 'sinta_1_2', 'sinta_3_6', 'international', 'national_indexed'] as const),
  tahun: z.number().min(2000, 'Tahun tidak valid').max(2030, 'Tahun tidak valid'),
  doi_url: z.string().optional(),
});

type PublikasiFormValues = z.infer<typeof publikasiSchema>;

export default function PublikasiRegistryPage() {
  const [publikasiList, setPublikasiList] = useState<PublikasiIlmiah[]>([]);
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
  } = useForm<PublikasiFormValues>({
    resolver: zodResolver(publikasiSchema) as any,
    defaultValues: {
      judul_artikel: '',
      nama_jurnal: '',
      kategori_publikasi: 'scopus',
      tahun: 2026,
      doi_url: 'https://doi.org/10.1016/j.future.2026.01.001',
    },
  });

  const fetchPublikasi = async () => {
    try {
      setLoading(true);
      const res = await sippmService.indexPublikasi();
      const list = Array.isArray(res.data)
        ? res.data
        : (res?.data as any)?.items || (res?.data as any)?.data || [];
      setPublikasiList(list);
    } catch (err) {
      console.error('Failed to fetch publikasi list', err);
      setPublikasiList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublikasi();
  }, []);

  const onSubmit = async (data: PublikasiFormValues) => {
    try {
      setSubmitting(true);
      setFeedback(null);
      await sippmService.storePublikasi(data);
      setFeedback({ type: 'success', message: 'Publikasi ilmiah baru berhasil didaftarkan' });
      setIsModalOpen(false);
      reset();
      fetchPublikasi();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Gagal mendaftarkan publikasi' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (id: number, status: 'verified' | 'rejected') => {
    try {
      await sippmService.verifyPublikasi(id, status);
      fetchPublikasi();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal memverifikasi publikasi');
    }
  };

  const safeList = Array.isArray(publikasiList) ? publikasiList : [];
  const filteredList = safeList.filter(
    (item) =>
      (item.judul_artikel || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.nama_jurnal || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge badge-sippm-purple">Portofolio & Registry Luaran</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">Registry Publikasi Ilmiah</h1>
          <p className="text-slate-500 text-sm">Pendataan luaran artikel ilmiah terindeks Scopus, WoS, dan Sinta Kampus.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary bg-purple-700 hover:bg-purple-800 border-none shadow-sm font-bold">
          <Plus size={18} /> Registrasi Publikasi Baru
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
              placeholder="Cari judul artikel / jurnal..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Total {filteredList.length} Artikel Terdaftar
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="table-container bg-white">
        <table className="table">
          <thead>
            <tr>
              <th>Judul Artikel & Nama Jurnal</th>
              <th>Kategori Indeks</th>
              <th>Tahun</th>
              <th>DOI / Link</th>
              <th>Status Verifikasi</th>
              <th className="text-right">Verifikasi LPPM</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-slate-400">Memuat publikasi ilmiah...</td>
              </tr>
            ) : filteredList.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-slate-400">Belum ada publikasi ilmiah terdaftar.</td>
              </tr>
            ) : (
              filteredList.map((item) => {
                const namaJurnal = item.nama_jurnal_prosiding || item.nama_jurnal || 'Jurnal / Prosiding Kampus';
                const indexingBadge = (item.indexing || item.jenis_publikasi || item.kategori_publikasi || 'scopus').replace(/_/g, ' ');
                const displayTahun = item.tahun || (item.volume_issue_tahun ? (item.volume_issue_tahun.match(/\((20\d\d)\)/)?.[1] || item.volume_issue_tahun) : '2026');
                const linkUrl = item.url_artikel || item.doi_url || (item.doi ? `https://doi.org/${item.doi}` : null);
                const statusVerifikasi: StatusVerifikasiLuaran = item.is_verified_lppm ? 'verified' : (item.status_verifikasi || 'pending');

                return (
                  <tr key={item.id} className="hover:bg-purple-50/30 transition-colors">
                    <td>
                      <div className="font-bold text-slate-900 line-clamp-1">{item.judul_artikel}</div>
                      <div className="text-xs text-purple-700 font-medium mt-0.5">{namaJurnal}</div>
                    </td>
                    <td>
                      <span className="badge badge-sippm-purple font-mono uppercase text-[11px]">
                        {indexingBadge}
                      </span>
                    </td>
                    <td className="font-bold text-slate-700 text-xs">{displayTahun}</td>
                    <td>
                      {linkUrl ? (
                        <a href={linkUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-700 hover:underline inline-flex items-center gap-1 font-mono">
                          <ExternalLink size={12} /> Link DOI
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400 font-mono">-</span>
                      )}
                    </td>
                    <td>
                      <SippmBadge status={statusVerifikasi} type="luaran" />
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        {statusVerifikasi === 'pending' && (
                          <>
                            <button
                              onClick={() => handleVerify(item.id, 'verified')}
                              className="btn btn-ghost btn-sm text-emerald-700 hover:bg-emerald-50"
                              title="Setujui Verifikasi"
                            >
                              Setujui
                            </button>
                            <button
                              onClick={() => handleVerify(item.id, 'rejected')}
                              className="btn btn-ghost btn-sm text-rose-600 hover:bg-rose-50"
                              title="Tolak Verifikasi"
                            >
                              Tolak
                            </button>
                          </>
                        )}
                        {statusVerifikasi === 'verified' && (
                          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 size={14} /> Terverifikasi
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form <= 5 inputs (Grid 2 Kolom per crud-ui-standard) */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal modal-lg modal-body">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <BookOpen className="text-purple-700" size={20} /> Registrasi Publikasi Ilmiah
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost btn-sm">✕</button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Judul Artikel Ilmiah <span className="required">*</span></label>
                <input type="text" className={`input ${errors.judul_artikel ? 'error' : ''}`} placeholder="Ketik judul artikel..." {...register('judul_artikel')} />
                {errors.judul_artikel && <span className="form-error">{errors.judul_artikel.message}</span>}
              </div>

              {/* Grid 2 Kolom per crud-ui-standard */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Nama Jurnal / Proceedings <span className="required">*</span></label>
                  <input type="text" className={`input ${errors.nama_jurnal ? 'error' : ''}`} placeholder="Misal: IEEE Access" {...register('nama_jurnal')} />
                  {errors.nama_jurnal && <span className="form-error">{errors.nama_jurnal.message}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Kategori Pengindeks <span className="required">*</span></label>
                  <select className="input" {...register('kategori_publikasi')}>
                    <option value="scopus">Scopus (Q1/Q2/Q3/Q4)</option>
                    <option value="wos">Web of Science (WoS)</option>
                    <option value="sinta_1_2">Sinta 1 - Sinta 2</option>
                    <option value="sinta_3_6">Sinta 3 - Sinta 6</option>
                    <option value="international">Internasional Bereputasi</option>
                    <option value="national_indexed">Nasional Terakreditasi</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Tahun Terbit <span className="required">*</span></label>
                  <input type="number" className={`input ${errors.tahun ? 'error' : ''}`} placeholder="2026" {...register('tahun', { valueAsNumber: true })} />
                  {errors.tahun && <span className="form-error">{errors.tahun.message}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Link DOI / URL Artikel</label>
                  <input type="text" className="input" placeholder="https://doi.org/10.xxx" {...register('doi_url')} />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Batal
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary bg-purple-700 hover:bg-purple-800 border-none font-bold">
                  {submitting ? 'Mendaftarkan...' : 'Simpan Publikasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
