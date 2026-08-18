'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Award, Plus, Search, CheckCircle2, XCircle, ShieldCheck, FileCheck } from 'lucide-react';
import { sippmService } from '@/services/sippm.service';
import type { HkiDanBuku, KategoriHki, StatusVerifikasiLuaran } from '@/types/sippm.types';
import { SippmBadge } from '@/components/sippm/SippmBadge';

const hkiSchema = z.object({
  judul_hki: z.string().min(5, 'Judul HKI minimal 5 karakter'),
  kategori_hki: z.enum(['paten', 'paten_sederhana', 'hak_cipta', 'merek', 'desain_industri', 'buku_ajar', 'prototype'] as const),
  nomor_pendaftaran: z.string().optional(),
  nomor_sertifikat: z.string().optional(),
  tahun: z.number().min(2000, 'Tahun tidak valid').max(2030, 'Tahun tidak valid'),
});

type HkiFormValues = z.infer<typeof hkiSchema>;

export default function HkiRegistryPage() {
  const [hkiList, setHkiList] = useState<HkiDanBuku[]>([]);
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
  } = useForm<HkiFormValues>({
    resolver: zodResolver(hkiSchema) as any,
    defaultValues: {
      judul_hki: '',
      kategori_hki: 'hak_cipta',
      nomor_pendaftaran: 'EC00202612345',
      nomor_sertifikat: '000789123',
      tahun: 2026,
    },
  });

  const fetchHki = async () => {
    try {
      setLoading(true);
      const res = await sippmService.indexHki();
      const list = Array.isArray(res.data)
        ? res.data
        : (res?.data as any)?.items || (res?.data as any)?.data || [];
      setHkiList(list);
    } catch (err) {
      console.error('Failed to fetch HKI list', err);
      setHkiList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHki();
  }, []);

  const onSubmit = async (data: HkiFormValues) => {
    try {
      setSubmitting(true);
      setFeedback(null);
      await sippmService.storeHki(data);
      setFeedback({ type: 'success', message: 'HKI / Paten baru berhasil didaftarkan' });
      setIsModalOpen(false);
      reset();
      fetchHki();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Gagal mendaftarkan HKI' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (id: number, status: 'verified' | 'rejected') => {
    try {
      await sippmService.verifyHki(id, status);
      fetchHki();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal memverifikasi HKI');
    }
  };

  const safeList = Array.isArray(hkiList) ? hkiList : [];
  const filteredList = safeList.filter(
    (item) =>
      (item.judul_hki || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.kategori_hki || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge badge-sippm-purple">Portofolio & Intellectual Property</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">Registry HKI & Paten Kampus</h1>
          <p className="text-slate-500 text-sm">Pendataan Kekayaan Intelektual, Hak Cipta, Paten, Merek & Buku Ajar Dosen.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary bg-purple-700 hover:bg-purple-800 border-none shadow-sm font-bold">
          <Plus size={18} /> Registrasi HKI Baru
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
              placeholder="Cari karya HKI / paten..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Total {filteredList.length} HKI Terdaftar
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="table-container bg-white">
        <table className="table">
          <thead>
            <tr>
              <th>Judul HKI / Karya</th>
              <th>Kategori HKI</th>
              <th>No Pendaftaran / Sertifikat</th>
              <th>Tahun</th>
              <th>Status Verifikasi</th>
              <th className="text-right">Aksi LPPM</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-slate-400">Memuat data HKI & Paten...</td>
              </tr>
            ) : filteredList.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-slate-400">Belum ada HKI terdaftar.</td>
              </tr>
            ) : (
              filteredList.map((item) => {
                const judulHki = item.judul || item.judul_hki || 'HKI / Karya Terdaftar';
                const kategoriHki = (item.jenis_luaran || item.kategori_hki || 'hak_cipta').replace(/_/g, ' ');
                const noSertifikat = item.nomor_pencatatan_isbn || item.nomor_sertifikat || item.nomor_pendaftaran || '-';
                const displayTahun = item.tahun || (item.tgl_terbit_catat ? new Date(item.tgl_terbit_catat).getFullYear() : '2026');
                const statusVerifikasi: StatusVerifikasiLuaran = item.is_verified_lppm ? 'verified' : (item.status_verifikasi || 'pending');

                return (
                  <tr key={item.id} className="hover:bg-purple-50/30 transition-colors">
                    <td>
                      <div className="font-bold text-slate-900 line-clamp-1">{judulHki}</div>
                      {item.penerbit_lembaga && (
                        <div className="text-xs text-purple-700 font-medium mt-0.5">{item.penerbit_lembaga}</div>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-sippm-purple font-mono uppercase text-[11px]">
                        {kategoriHki}
                      </span>
                    </td>
                    <td className="font-mono text-xs font-bold text-slate-700">
                      {noSertifikat}
                    </td>
                    <td className="font-bold text-slate-700 text-xs">{displayTahun}</td>
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
                            >
                              Setujui
                            </button>
                            <button
                              onClick={() => handleVerify(item.id, 'rejected')}
                              className="btn btn-ghost btn-sm text-rose-600 hover:bg-rose-50"
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
                <Award className="text-purple-700" size={20} /> Registrasi HKI & Paten Baru
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost btn-sm">✕</button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Judul HKI / Ciptaan / Paten <span className="required">*</span></label>
                <input type="text" className={`input ${errors.judul_hki ? 'error' : ''}`} placeholder="Ketik judul HKI..." {...register('judul_hki')} />
                {errors.judul_hki && <span className="form-error">{errors.judul_hki.message}</span>}
              </div>

              {/* Grid 2 Kolom per crud-ui-standard */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Kategori Kekayaan Intelektual <span className="required">*</span></label>
                  <select className="input" {...register('kategori_hki')}>
                    <option value="hak_cipta">Hak Cipta Program/Karya</option>
                    <option value="paten">Paten Terdaftar</option>
                    <option value="paten_sederhana">Paten Sederhana</option>
                    <option value="merek">Merek Dagang</option>
                    <option value="desain_industri">Desain Industri</option>
                    <option value="buku_ajar">Buku Ajar / Monograf</option>
                    <option value="prototype">Prototype Industri</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Tahun Registrasi <span className="required">*</span></label>
                  <input type="number" className={`input ${errors.tahun ? 'error' : ''}`} placeholder="2026" {...register('tahun', { valueAsNumber: true })} />
                  {errors.tahun && <span className="form-error">{errors.tahun.message}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Nomor Pendaftaran Permohonan</label>
                  <input type="text" className="input" placeholder="EC002026xxxx" {...register('nomor_pendaftaran')} />
                </div>

                <div className="form-group">
                  <label className="form-label">Nomor Sertifikat HKI / Paten</label>
                  <input type="text" className="input" placeholder="000789xxx" {...register('nomor_sertifikat')} />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Batal
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary bg-purple-700 hover:bg-purple-800 border-none font-bold">
                  {submitting ? 'Mendaftarkan...' : 'Simpan HKI'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
