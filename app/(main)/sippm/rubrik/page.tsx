'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Award,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { Hero } from '@/components/ui/Hero';
import { sippmService } from '@/services/sippm.service';
import type { RubrikIndikator, CreateRubrikPayload } from '@/types/sippm.types';

export default function MasterRubrikPage() {
  const [rubrikList, setRubrikList] = useState<RubrikIndikator[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'all' | 'kaprodi' | 'admin'>('all');
  const [search, setSearch] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<RubrikIndikator | null>(null);
  const [formData, setFormData] = useState<CreateRubrikPayload>({
    tipe_reviewer: 'kaprodi',
    nama_indikator: '',
    deskripsi: '',
    bobot: 25.0,
    skor_minimal_default: 80.0,
    is_active: true,
  });
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchRubriks();
  }, [activeTab]);

  const fetchRubriks = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (activeTab !== 'all') {
        params.tipe_reviewer = activeTab;
      }
      if (search) {
        params.search = search;
      }
      const res = await sippmService.indexRubrik(params);
      if (res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data as any)?.items || [];
        setRubrikList(list);
      }
    } catch (err: any) {
      console.error('Failed to fetch rubrik:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRubriks();
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      tipe_reviewer: activeTab === 'admin' ? 'admin' : 'kaprodi',
      nama_indikator: '',
      deskripsi: '',
      bobot: 25.0,
      skor_minimal_default: 80.0,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: RubrikIndikator) => {
    setEditingItem(item);
    setFormData({
      tipe_reviewer: item.tipe_reviewer,
      nama_indikator: item.nama_indikator,
      deskripsi: item.deskripsi || '',
      bobot: Number(item.bobot),
      skor_minimal_default: Number(item.skor_minimal_default),
      is_active: item.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_indikator.trim()) return;

    try {
      setSubmitting(true);
      if (editingItem) {
        await sippmService.updateRubrik(editingItem.id, formData);
        setToastMessage({ type: 'success', message: 'Rubrik indikator berhasil diperbarui!' });
      } else {
        await sippmService.storeRubrik(formData);
        setToastMessage({ type: 'success', message: 'Rubrik indikator baru berhasil ditambahkan!' });
      }
      setIsModalOpen(false);
      fetchRubriks();
    } catch (err: any) {
      setToastMessage({ type: 'error', message: err?.response?.data?.message || 'Gagal menyimpan rubrik' });
    } finally {
      setSubmitting(false);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus indikator penilaian ini?')) return;
    try {
      await sippmService.destroyRubrik(id);
      setToastMessage({ type: 'success', message: 'Indikator penilaian berhasil dihapus' });
      fetchRubriks();
    } catch (err: any) {
      setToastMessage({ type: 'error', message: 'Gagal menghapus indikator' });
    } finally {
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold flex items-center gap-2 animate-bounce ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : 'bg-rose-50 text-rose-800 border-rose-300'
          }`}
        >
          {toastMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toastMessage.message}
        </div>
      )}

      {/* Header Banner */}
      <Hero
        badge={<span className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/20 text-primary-300 text-xs font-bold uppercase tracking-wider border border-primary-500/30"><ClipboardList size={14} /> Master Data Reviewer SIPPM</span>}
        title="Master Rubrik Indikator Penilaian Proposal"
        description="Kelola indikator penilaian keilmuan untuk **Reviewer 1 (Kaprodi)** dan penilaian kelayakan administrasi untuk **Reviewer 2 (Admin SIPPM)** beserta aturan batas nilai lulus (*Minimal Pass Score*)."
        actions={
          <button
            onClick={openCreateModal}
            className="btn hero-btn-white"
          >
            <Plus size={18} /> Tambah Indikator Penilaian
          </button>
        }
      />

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'all' ? 'bg-white text-primary-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua Indikator
          </button>
          <button
            onClick={() => setActiveTab('kaprodi')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'kaprodi' ? 'bg-primary-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck size={14} /> Tahap 1: Kaprodi (Keilmuan)
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'admin' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck size={14} /> Tahap 2: Admin SIPPM (Kelayakan)
          </button>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Cari indikator penilaian..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input input-sm w-full pl-9 pr-4 rounded-xl border-slate-300 focus:border-primary-500 font-medium text-xs"
          />
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
        </form>
      </div>

      {/* Table Card */}
      <div className="card bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden">
        <div className="table-responsive">
          <table className="table w-full align-middle text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider">
                <th className="py-4 px-6 text-left">Tahap & Tipe Reviewer</th>
                <th className="py-4 px-6 text-left">Nama Indikator Penilaian</th>
                <th className="py-4 px-6 text-center">Bobot</th>
                <th className="py-4 px-6 text-center">Batas Nilai Lulus (Min. Score)</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 font-medium">
                    Memuat data rubrik indikator...
                  </td>
                </tr>
              ) : rubrikList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 font-medium">
                    Belum ada indikator penilaian untuk filter ini.
                  </td>
                </tr>
              ) : (
                rubrikList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6">
                      {item.tipe_reviewer === 'kaprodi' ? (
                        <span className="badge badge-blue inline-flex items-center gap-1.5">
                          <UserCheck size={12} /> Tahap 1: Kaprodi
                        </span>
                      ) : (
                        <span className="badge badge-green inline-flex items-center gap-1.5">
                          <ShieldCheck size={12} /> Tahap 2: Admin SIPPM
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{item.nama_indikator}</div>
                      {item.deskripsi && (
                        <div className="text-xs text-slate-500 mt-1 max-w-md line-clamp-2">{item.deskripsi}</div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="font-extrabold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                        {Number(item.bobot)}%
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center gap-1 font-extrabold text-primary-700 bg-primary-50 px-3 py-1 rounded-lg border border-primary-200">
                        <Award size={14} /> &gt; {Number(item.skor_minimal_default)} Poin
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {item.is_active ? (
                        <span className="badge badge-green inline-flex items-center gap-1">
                          <CheckCircle2 size={12} /> Aktif
                        </span>
                      ) : (
                        <span className="badge badge-gray inline-flex items-center gap-1">
                          <XCircle size={12} /> Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200 transition-all"
                          title="Edit Indikator"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-all"
                          title="Hapus Indikator"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form Create/Edit */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <ClipboardList className="text-primary-600" size={20} />
                {editingItem ? 'Edit Indikator Penilaian' : 'Tambah Indikator Penilaian Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="form-label font-bold text-xs">Tahap & Tipe Reviewer <span className="text-rose-500">*</span></label>
                <select
                  value={formData.tipe_reviewer}
                  onChange={(e) => setFormData({ ...formData, tipe_reviewer: e.target.value as 'kaprodi' | 'admin' })}
                  className="input input-sm font-semibold bg-white border-slate-300"
                >
                  <option value="kaprodi">Tahap 1: Reviewer Kaprodi (Keilmuan & Linieritas)</option>
                  <option value="admin">Tahap 2: Reviewer Admin SIPPM (Administrasi & Kelayakan)</option>
                </select>
              </div>

              <div>
                <label className="form-label font-bold text-xs">Nama Indikator Penilaian <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Linieritas Topik Riset dengan Roadmap Prodi"
                  value={formData.nama_indikator}
                  onChange={(e) => setFormData({ ...formData, nama_indikator: e.target.value })}
                  className="input input-sm font-semibold border-slate-300"
                />
              </div>

              <div>
                <label className="form-label font-bold text-xs">Deskripsi / Petunjuk Penilaian</label>
                <textarea
                  rows={3}
                  placeholder="Penjelasan kriteria yang harus diperiksa reviewer..."
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  className="textarea textarea-sm font-medium border-slate-300 w-full rounded-xl p-3 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label font-bold text-xs">Bobot Indikator (%) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="100"
                    required
                    value={formData.bobot}
                    onChange={(e) => setFormData({ ...formData, bobot: parseFloat(e.target.value) || 0 })}
                    className="input input-sm font-semibold border-slate-300"
                  />
                </div>
                <div>
                  <label className="form-label font-bold text-xs">Batas Nilai Lolos (Min. Score) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    required
                    value={formData.skor_minimal_default}
                    onChange={(e) => setFormData({ ...formData, skor_minimal_default: parseFloat(e.target.value) || 0 })}
                    className="input input-sm font-extrabold text-primary-800 border-slate-300"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="checkbox checkbox-primary checkbox-sm"
                />
                <label htmlFor="is_active" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Aktifkan Indikator Penilaian Ini
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-ghost btn-sm font-bold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn bg-primary-700 hover:bg-primary-800 text-white btn-sm font-bold border-none shadow-md"
                >
                  {submitting ? 'Menyimpan...' : editingItem ? 'Simpan Pembaruan' : 'Tambah Indikator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
