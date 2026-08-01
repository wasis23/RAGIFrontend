'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Layers, Plus, Search, CheckCircle2, XCircle, FileText } from 'lucide-react';
import { sippmService } from '@/services/sippm.service';
import type { SkemaKegiatan, JenisKegiatan, KategoriSkema } from '@/types/sippm.types';

// Zod Schema (<= 5 input modal form)
const skemaSchema = z.object({
  nama_skema: z.string().min(3, 'Nama skema minimal 3 karakter'),
  kode_skema: z.string().min(2, 'Kode skema minimal 2 karakter'),
  jenis_kegiatan: z.enum(['penelitian', 'pengabdian'] as const),
  kategori_skema: z.enum(['dasar', 'terapan', 'pengembangan'] as const),
  maksimal_dana: z.number().min(1000000, 'Dana minimal Rp 1.000.000'),
});

type SkemaFormValues = z.infer<typeof skemaSchema>;

export default function MasterSkemaPage() {
  const [skemaList, setSkemaList] = useState<SkemaKegiatan[]>([]);
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
  } = useForm<SkemaFormValues>({
    resolver: zodResolver(skemaSchema) as any,
    defaultValues: {
      nama_skema: '',
      kode_skema: '',
      jenis_kegiatan: 'penelitian',
      kategori_skema: 'terapan',
      maksimal_dana: 25000000,
    },
  });

  const fetchSkema = async () => {
    try {
      setLoading(true);
      const res = await sippmService.indexSkema();
      const list = Array.isArray(res.data)
        ? res.data
        : (res?.data as any)?.items || (res?.data as any)?.data || [];
      setSkemaList(list);
    } catch (err) {
      console.error('Failed to fetch skema', err);
      setSkemaList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkema();
  }, []);

  const onSubmit = async (data: SkemaFormValues) => {
    try {
      setSubmitting(true);
      setFeedback(null);
      await sippmService.storeSkema(data);
      setFeedback({ type: 'success', message: 'Skema baru berhasil ditambahkan' });
      setIsModalOpen(false);
      reset();
      fetchSkema();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Gagal menyimpan skema' });
    } finally {
      setSubmitting(false);
    }
  };

  const safeList = Array.isArray(skemaList) ? skemaList : [];
  const filteredList = safeList.filter(
    (item) =>
      (item.nama_skema || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.kode_skema || '').toLowerCase().includes(search.toLowerCase())
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
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">Master Skema Kegiatan</h1>
          <p className="text-slate-500 text-sm">Kelola skema hibah penelitian & pengabdian masyarakat beserta pagu maksimal dana.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary bg-teal-600 hover:bg-teal-700 border-none shadow-sm">
          <Plus size={18} /> Tambah Skema Baru
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
              placeholder="Cari skema / kode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Total {filteredList.length} Skema Terdaftar
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="table-container bg-white">
        <table className="table">
          <thead>
            <tr>
              <th>Kode</th>
              <th>Nama Skema</th>
              <th>Jenis Kegiatan</th>
              <th>Kategori</th>
              <th>Maksimal Dana</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-400">Memuat skema kegiatan...</td>
              </tr>
            ) : filteredList.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-400">Belum ada skema kegiatan terdaftar.</td>
              </tr>
            ) : (
              filteredList.map((item) => {
                const kodeSkema = item.kode || item.kode_skema || 'SKM';
                const namaSkema = item.nama || item.nama_skema || 'Skema Kegiatan';
                const jenisKegiatan = item.tipe || item.jenis_kegiatan || 'penelitian';
                const kategoriSkema = item.sumber_dana || item.kategori_skema || 'internal';
                const maksAnggaran = Number(item.maksimal_anggaran || item.maksimal_dana || 0);

                return (
                  <tr key={item.id}>
                    <td className="font-mono text-xs font-bold text-teal-700">{kodeSkema}</td>
                    <td className="font-bold text-slate-800">{namaSkema}</td>
                    <td>
                      <span className={`badge ${jenisKegiatan === 'penelitian' ? 'badge-blue' : 'badge-green'}`}>
                        {jenisKegiatan.toUpperCase()}
                      </span>
                    </td>
                    <td className="capitalize text-slate-600 font-medium">{kategoriSkema.replace(/_/g, ' ')}</td>
                    <td className="font-bold text-teal-700">{formatRupiah(maksAnggaran)}</td>
                    <td>
                      <span className={`badge ${item.is_active !== false ? 'badge-green badge-dot' : 'badge-gray'}`}>
                        {item.is_active !== false ? 'Aktif' : 'Non-Aktif'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal <= 5 Input Form (Grid 2 Kolom per crud-ui-standard) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Layers className="text-teal-600" size={20} /> Tambah Skema Kegiatan
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost btn-sm">✕</button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Grid 2 Kolom */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Kode Skema <span className="required">*</span></label>
                  <input type="text" className={`input ${errors.kode_skema ? 'error' : ''}`} placeholder="Misal: SKM-PD" {...register('kode_skema')} />
                  {errors.kode_skema && <span className="form-error">{errors.kode_skema.message}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Maksimal Dana (Rp) <span className="required">*</span></label>
                  <input type="number" className={`input ${errors.maksimal_dana ? 'error' : ''}`} placeholder="25000000" {...register('maksimal_dana')} />
                  {errors.maksimal_dana && <span className="form-error">{errors.maksimal_dana.message}</span>}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Nama Skema Kegiatan <span className="required">*</span></label>
                <input type="text" className={`input ${errors.nama_skema ? 'error' : ''}`} placeholder="Misal: Penelitian Dasar Dosen Pemula" {...register('nama_skema')} />
                {errors.nama_skema && <span className="form-error">{errors.nama_skema.message}</span>}
              </div>

              {/* Grid 2 Kolom untuk Select */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Jenis Kegiatan <span className="required">*</span></label>
                  <select className="input" {...register('jenis_kegiatan')}>
                    <option value="penelitian">Penelitian</option>
                    <option value="pengabdian">Pengabdian Masyarakat</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Kategori Skema <span className="required">*</span></label>
                  <select className="input" {...register('kategori_skema')}>
                    <option value="dasar">Dasar</option>
                    <option value="terapan">Terapan</option>
                    <option value="pengembangan">Pengembangan</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Batal
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary bg-teal-600 hover:bg-teal-700 border-none">
                  {submitting ? 'Menyimpan...' : 'Simpan Skema'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
