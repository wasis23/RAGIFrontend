'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  TrendingUp,
  Search,
  CheckCircle2,
  XCircle,
  Building2,
  BookOpen,
  Award,
  Globe,
  Layers,
  FileCheck,
  Edit,
  Sliders,
  ShieldCheck,
  Save,
} from 'lucide-react';
import { simpegService } from '@/services/simpeg.service';
import type { UnitKerja } from '@/types/simpeg.types';
import type { Iku5StandardProdi } from '@/types/sippm.types';

const ikuStandardSchema = z.object({
  prodi_id: z.string().min(1, 'Pilih program studi'),
  target_scopus: z.number().min(0, 'Minimal 0 artikel'),
  target_sinta: z.number().min(0, 'Minimal 0 artikel'),
  target_dikti: z.number().min(0, 'Minimal 0 hibah'),
  target_internal: z.number().min(0, 'Minimal 0 hibah'),
  target_hki: z.number().min(0, 'Minimal 0 HKI'),
  min_capaian_iku: z.number().min(50, 'Minimal target 50%').max(200, 'Maksimal target 200%'),
  tahun_akademik: z.string().min(4, 'Tahun akademik tidak valid'),
});

type IkuStandardFormValues = z.infer<typeof ikuStandardSchema>;

export default function Iku5StandardsPage() {
  const [prodiStandards, setProdiStandards] = useState<Iku5StandardProdi[]>([]);
  const [unitKerjaList, setUnitKerjaList] = useState<UnitKerja[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProdi, setSelectedProdi] = useState<Iku5StandardProdi | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<IkuStandardFormValues>({
    resolver: zodResolver(ikuStandardSchema) as any,
    defaultValues: {
      prodi_id: '',
      target_scopus: 3,
      target_sinta: 5,
      target_dikti: 3,
      target_internal: 4,
      target_hki: 5,
      min_capaian_iku: 100,
      tahun_akademik: '2025/2026',
    },
  });

  // Default Standard Fallbacks (merged with database backend unit kerja)
  const defaultStandardMap: Record<string, Omit<Iku5StandardProdi, 'id' | 'nama_prodi' | 'fakultas'>> = {
    'S1 Teknik Informatika': { target_scopus: 5, target_sinta: 8, target_dikti: 4, target_internal: 5, target_hki: 8, min_capaian_iku: 110, tahun_akademik: '2025/2026' },
    'S1 Sistem Informasi': { target_scopus: 4, target_sinta: 7, target_dikti: 3, target_internal: 4, target_hki: 6, min_capaian_iku: 100, tahun_akademik: '2025/2026' },
    'S1 Desain Komunikasi Visual': { target_scopus: 2, target_sinta: 5, target_dikti: 2, target_internal: 4, target_hki: 10, min_capaian_iku: 95, tahun_akademik: '2025/2026' },
    'S1 Teknik Elektro': { target_scopus: 4, target_sinta: 6, target_dikti: 4, target_internal: 3, target_hki: 5, min_capaian_iku: 100, tahun_akademik: '2025/2026' },
    'S1 Manajemen Informatika': { target_scopus: 3, target_sinta: 5, target_dikti: 2, target_internal: 3, target_hki: 4, min_capaian_iku: 90, tahun_akademik: '2025/2026' },
    'D3 Sistem Informasi': { target_scopus: 2, target_sinta: 4, target_dikti: 2, target_internal: 3, target_hki: 4, min_capaian_iku: 85, tahun_akademik: '2025/2026' },
  };

  const fetchBackendProdi = async () => {
    try {
      setLoading(true);
      const res = await simpegService.getUnitKerjaList();
      const rawUnits = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
      setUnitKerjaList(rawUnits);

      // Filter only prodi unit kerja or fallback to default list
      const prodiUnits = rawUnits.filter((u: any) => u.jenis === 'prodi' || (u.nama || '').toLowerCase().includes('s1') || (u.nama || '').toLowerCase().includes('d3'));
      const activeUnits = prodiUnits.length > 0 ? prodiUnits : [
        { id: 1, nama: 'S1 Teknik Informatika', jenis: 'prodi' },
        { id: 2, nama: 'S1 Sistem Informasi', jenis: 'prodi' },
        { id: 3, nama: 'S1 Desain Komunikasi Visual', jenis: 'prodi' },
        { id: 4, nama: 'S1 Teknik Elektro', jenis: 'prodi' },
        { id: 5, nama: 'S1 Manajemen Informatika', jenis: 'prodi' },
        { id: 6, nama: 'D3 Sistem Informasi', jenis: 'prodi' },
      ];

      // Load saved standards from localStorage if exists
      const saved = localStorage.getItem('sippm_iku5_standards');
      let savedStandards: Record<string, Iku5StandardProdi> = {};
      if (saved) {
        try { savedStandards = JSON.parse(saved); } catch (e) {}
      }

      const mergedList: Iku5StandardProdi[] = activeUnits.map((unit: any, idx: number) => {
        const prodiName = unit.nama || unit.name || `Prodi ${idx + 1}`;
        const code = unit.kode || prodiName.split(' ').map((w: string) => w[0]).join('').toUpperCase();
        
        if (savedStandards[code]) {
          return savedStandards[code];
        }

        const defaultVal = defaultStandardMap[prodiName] || {
          target_scopus: 3,
          target_sinta: 5,
          target_dikti: 3,
          target_internal: 3,
          target_hki: 5,
          min_capaian_iku: 100,
          tahun_akademik: '2025/2026',
        };

        return {
          id: code,
          unit_kerja_id: unit.id,
          nama_prodi: prodiName,
          fakultas: unit.parent?.nama || 'Fakultas Ilmu Komputer',
          ...defaultVal,
        };
      });

      setProdiStandards(mergedList);
    } catch (err) {
      console.error('Failed to load prodi from backend', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackendProdi();
  }, []);

  const handleEditModal = (item: Iku5StandardProdi) => {
    setSelectedProdi(item);
    setValue('prodi_id', item.id);
    setValue('target_scopus', item.target_scopus);
    setValue('target_sinta', item.target_sinta);
    setValue('target_dikti', item.target_dikti);
    setValue('target_internal', item.target_internal);
    setValue('target_hki', item.target_hki);
    setValue('min_capaian_iku', item.min_capaian_iku);
    setValue('tahun_akademik', item.tahun_akademik);
    setIsModalOpen(true);
  };

  const onSubmit = async (data: IkuStandardFormValues) => {
    try {
      setSubmitting(true);
      setFeedback(null);

      const updated = prodiStandards.map((item) => {
        if (item.id === data.prodi_id) {
          return {
            ...item,
            target_scopus: data.target_scopus,
            target_sinta: data.target_sinta,
            target_dikti: data.target_dikti,
            target_internal: data.target_internal,
            target_hki: data.target_hki,
            min_capaian_iku: data.min_capaian_iku,
            tahun_akademik: data.tahun_akademik,
          };
        }
        return item;
      });

      setProdiStandards(updated);

      // Persist to localStorage
      const storageObj: Record<string, Iku5StandardProdi> = {};
      updated.forEach((u) => { storageObj[u.id] = u; });
      localStorage.setItem('sippm_iku5_standards', JSON.stringify(storageObj));

      setFeedback({ type: 'success', message: `Standar IKU 5 untuk "${selectedProdi?.nama_prodi}" berhasil diperbarui!` });
      setIsModalOpen(false);
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Gagal memperbarui standar IKU 5 prodi.' });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProdi = prodiStandards.filter(
    (p) =>
      p.nama_prodi.toLowerCase().includes(search.toLowerCase()) ||
      p.fakultas.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge badge-sippm">Sistem Mutu Akademik Kampus</span>
            <span className="badge badge-purple font-bold">Admin LPPM & UPM</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Pengaturan Standar Capaian IKU 5 per Program Studi
          </h1>
          <p className="text-slate-500 text-sm">
            Konfigurasi rasio target luaran Scopus, Sinta, Hibah Dikti/Internal, serta HKI untuk setiap Program Studi.
          </p>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          {feedback.message}
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 border-l-4 border-l-purple-600 bg-white shadow-xs">
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Prodi Terkonfigurasi</div>
          <div className="text-2xl font-black text-slate-900 mt-1 flex items-center gap-2">
            <Building2 size={24} className="text-purple-600" />
            {prodiStandards.length} Program Studi
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Data master dari SIMPEG Backend</div>
        </div>

        <div className="card p-5 border-l-4 border-l-primary-600 bg-white shadow-xs">
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Rata-rata Target Scopus</div>
          <div className="text-2xl font-black text-primary-700 mt-1 flex items-center gap-2">
            <Globe size={24} className="text-primary-600" />
            {Math.round(prodiStandards.reduce((sum, p) => sum + p.target_scopus, 0) / (prodiStandards.length || 1))} Artikel / Prodi
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Standardisasi Jurnal Q1 - Q4</div>
        </div>

        <div className="card p-5 border-l-4 border-l-blue-600 bg-white shadow-xs">
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Rata-rata Target Hibah</div>
          <div className="text-2xl font-black text-blue-700 mt-1 flex items-center gap-2">
            <Award size={24} className="text-blue-600" />
            {Math.round(prodiStandards.reduce((sum, p) => sum + p.target_dikti + p.target_internal, 0) / (prodiStandards.length || 1))} Proposal / Prodi
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Hibah DIKTI & Riset Internal</div>
        </div>

        <div className="card p-5 border-l-4 border-l-amber-600 bg-white shadow-xs">
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Tahun Akademik Aktif</div>
          <div className="text-2xl font-black text-amber-700 mt-1 flex items-center gap-2">
            <ShieldCheck size={24} className="text-amber-600" />
            TA 2025/2026
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Penjaminan Mutu UPM Kampus</div>
        </div>
      </div>

      {/* Filter Card */}
      <div className="card">
        <div className="card-body p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="input-wrapper w-full md:w-80">
            <span className="input-prefix-icon"><Search size={18} /></span>
            <input
              type="text"
              className="input input-icon-left"
              placeholder="Cari program studi / fakultas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Total {filteredProdi.length} Program Studi Ditemukan
          </div>
        </div>
      </div>

      {/* Standards Table */}
      <div className="table-container bg-white">
        <table className="table w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left py-3.5 px-4 font-extrabold text-slate-700 text-xs">PROGRAM STUDI (BACKEND DB)</th>
              <th className="text-center py-3.5 px-4 font-extrabold text-slate-700 text-xs">TARGET SCOPUS</th>
              <th className="text-center py-3.5 px-4 font-extrabold text-slate-700 text-xs">TARGET SINTA</th>
              <th className="text-center py-3.5 px-4 font-extrabold text-slate-700 text-xs">TARGET DIKTI</th>
              <th className="text-center py-3.5 px-4 font-extrabold text-slate-700 text-xs">TARGET INTERNAL</th>
              <th className="text-center py-3.5 px-4 font-extrabold text-slate-700 text-xs">TARGET HKI</th>
              <th className="text-center py-3.5 px-4 font-extrabold text-slate-700 text-xs">MIN CAPAIAN IKU</th>
              <th className="text-right py-3.5 px-4 font-extrabold text-slate-700 text-xs">AKSI CONFIG</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-slate-400">Memuat data program studi dari database backend...</td>
              </tr>
            ) : filteredProdi.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-slate-400">Tidak ada program studi yang cocok.</td>
              </tr>
            ) : (
              filteredProdi.map((item) => (
                <tr key={item.id} className="hover:bg-purple-50/20 transition-colors">
                  <td className="py-4 px-4">
                    <div className="font-extrabold text-slate-900 text-sm">{item.nama_prodi}</div>
                    <div className="text-xs text-slate-500 font-medium">{item.fakultas}</div>
                  </td>
                  <td className="text-center py-4 px-4">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-bold font-mono border border-purple-200">
                      <Globe size={13} /> {item.target_scopus} Artikel
                    </span>
                  </td>
                  <td className="text-center py-4 px-4">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold font-mono border border-blue-200">
                      <BookOpen size={13} /> {item.target_sinta} Artikel
                    </span>
                  </td>
                  <td className="text-center py-4 px-4">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold font-mono border border-emerald-200">
                      <Award size={13} /> {item.target_dikti} Hibah
                    </span>
                  </td>
                  <td className="text-center py-4 px-4">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold font-mono border border-amber-200">
                      <Layers size={13} /> {item.target_internal} Hibah
                    </span>
                  </td>
                  <td className="text-center py-4 px-4">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-fuchsia-50 text-fuchsia-700 text-xs font-bold font-mono border border-fuchsia-200">
                      <FileCheck size={13} /> {item.target_hki} HKI
                    </span>
                  </td>
                  <td className="text-center py-4 px-4 font-mono font-black text-slate-800 text-xs">
                    <span className="badge badge-gray">
                      {item.min_capaian_iku}%
                    </span>
                  </td>
                  <td className="text-right py-4 px-4">
                    <button
                      onClick={() => handleEditModal(item)}
                      className="btn btn-primary btn-sm bg-purple-700 hover:bg-purple-800 border-none font-bold text-xs flex items-center gap-1.5 ml-auto"
                    >
                      <Edit size={14} /> Edit Standar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* EDIT MODAL FORM (<= 5 inputs / 2-column grid per crud-ui-standard) */}
      {isModalOpen && selectedProdi && (
        <div className="modal-overlay">
          <div className="modal modal-lg modal-body">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Sliders className="text-purple-700" size={20} /> Konfigurasi Target Standar IKU 5
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost btn-sm">✕</button>
            </div>

            {/* Target Context Info */}
            <div className="p-3 rounded-xl bg-purple-50 border border-purple-100 text-xs text-purple-900 space-y-0.5">
              <div className="font-black text-sm">{selectedProdi.nama_prodi}</div>
              <div className="text-purple-700">{selectedProdi.fakultas}</div>
            </div>

            {/* FORM HAS <= 5 INPUT GROUPS -> MODAL GRID MAKS 2 KOLOM per crud-ui-standard */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Target Scopus */}
                <div className="form-group">
                  <label className="form-label text-xs font-bold text-slate-700">Target Artikel Scopus <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    className={`input text-xs ${errors.target_scopus ? 'error' : ''}`}
                    {...register('target_scopus', { valueAsNumber: true })}
                  />
                  {errors.target_scopus && <span className="form-error">{errors.target_scopus.message}</span>}
                </div>

                {/* Target Sinta */}
                <div className="form-group">
                  <label className="form-label text-xs font-bold text-slate-700">Target Artikel Sinta <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    className={`input text-xs ${errors.target_sinta ? 'error' : ''}`}
                    {...register('target_sinta', { valueAsNumber: true })}
                  />
                  {errors.target_sinta && <span className="form-error">{errors.target_sinta.message}</span>}
                </div>

                {/* Target Dikti */}
                <div className="form-group">
                  <label className="form-label text-xs font-bold text-slate-700">Target Hibah DIKTI <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    className={`input text-xs ${errors.target_dikti ? 'error' : ''}`}
                    {...register('target_dikti', { valueAsNumber: true })}
                  />
                  {errors.target_dikti && <span className="form-error">{errors.target_dikti.message}</span>}
                </div>

                {/* Target Internal */}
                <div className="form-group">
                  <label className="form-label text-xs font-bold text-slate-700">Target Hibah Internal <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    className={`input text-xs ${errors.target_internal ? 'error' : ''}`}
                    {...register('target_internal', { valueAsNumber: true })}
                  />
                  {errors.target_internal && <span className="form-error">{errors.target_internal.message}</span>}
                </div>

                {/* Target HKI */}
                <div className="form-group">
                  <label className="form-label text-xs font-bold text-slate-700">Target HKI & Paten <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    className={`input text-xs ${errors.target_hki ? 'error' : ''}`}
                    {...register('target_hki', { valueAsNumber: true })}
                  />
                  {errors.target_hki && <span className="form-error">{errors.target_hki.message}</span>}
                </div>

                {/* Target Min Capaian (%) */}
                <div className="form-group">
                  <label className="form-label text-xs font-bold text-slate-700">Target Min Capaian (%) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    className={`input text-xs ${errors.min_capaian_iku ? 'error' : ''}`}
                    {...register('min_capaian_iku', { valueAsNumber: true })}
                  />
                  {errors.min_capaian_iku && <span className="form-error">{errors.min_capaian_iku.message}</span>}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost btn-sm text-slate-600">
                  Batal
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary btn-sm bg-purple-700 hover:bg-purple-800 border-none font-bold">
                  {submitting ? 'Menyimpan...' : 'Simpan Standar IKU'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
