'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Trash2, Send, ArrowLeft } from 'lucide-react';
import { sippmService } from '@/services/sippm.service';
import type { CreatePengumumanPayload } from '@/types/sippm.types';

export default function CreatePengumumanPage() {
  const router = useRouter();

  const DEFAULT_JADWAL = [
    { waktu: '20 Maret – 22 Maret', kegiatan: 'Pengumuman Penerimaan proposal PPM' },
    { waktu: '23 Maret - 23 April', kegiatan: 'Unggah proposal melalui system http://sippm.poltekindonusa.ac.id\nUsername : nidn\nPassword : nidn' },
    { waktu: '24 April – 28 April', kegiatan: 'Penilaian oleh tim reviewer' },
    { waktu: '29 April', kegiatan: 'Penetapan pemenang' },
    { waktu: '30 April', kegiatan: 'Pengumuman proposal yang didanai' },
    { waktu: '4 Mei', kegiatan: 'Kontrak dan Pencairan dana 70%' },
    { waktu: '4 Mei – 4 Juli', kegiatan: 'Pelaksanaan PPM' },
    { waktu: '6 – 7 Juli', kegiatan: 'Monev kemajuan pelaksanaan PPM melalui sistem' },
    { waktu: '14 – 15 Agustus', kegiatan: 'Unggah Laporan akhir dan Luaran yang sesuai dalam proposal melalui sistem' },
    { waktu: 'Akhir Agustus', kegiatan: 'Seminar Hasil dan pencairan dana 30%' },
  ];

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'danger' } | null>(null);

  const [formData, setFormData] = useState<CreatePengumumanPayload>({
    nomor_surat: '001/UPPM-INDONUSA/III/2026',
    tgl_surat: '2026-03-20',
    tahun_anggaran: '2026',
    kategori_pendanaan: 'Hibah Institusi',
    hal_surat: 'Penerimaan Proposal Penelitian dan Pengabdian Kepada Masyarakat (PPM) Hibah Institusi Tahun Anggaran 2026',
    nama_ketua_uppm: 'Narsih, S.T., M.Kom',
    nama_direktur: 'Ir. Suwahyo, S.T., M.T',
    tgl_buka_proposal: '2026-03-23',
    tgl_tutup_proposal: '2026-04-23',
    lampiran_alokasi_waktu: DEFAULT_JADWAL,
  });

  const showToast = (message: string, type: 'success' | 'danger' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleJadwalChange = (index: number, field: 'waktu' | 'kegiatan', value: string) => {
    const current = [...(formData.lampiran_alokasi_waktu || formData.lampiran_jadwal || [])];
    current[index] = { ...current[index], [field]: value };
    setFormData({ ...formData, lampiran_alokasi_waktu: current, lampiran_jadwal: current });
  };

  const handleAddJadwalRow = () => {
    const current = formData.lampiran_alokasi_waktu || formData.lampiran_jadwal || [];
    const updated = [...current, { waktu: '', kegiatan: '' }];
    setFormData({ ...formData, lampiran_alokasi_waktu: updated, lampiran_jadwal: updated });
  };

  const handleRemoveJadwalRow = (index: number) => {
    const current = formData.lampiran_alokasi_waktu || formData.lampiran_jadwal || [];
    const updated = current.filter((_, i) => i !== index);
    setFormData({ ...formData, lampiran_alokasi_waktu: updated, lampiran_jadwal: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await sippmService.createPengumuman(formData);
      showToast('Pengumuman berhasil diterbitkan!', 'success');
      setTimeout(() => {
        router.push('/sippm/pengumuman');
      }, 1500);
    } catch (error: any) {
      console.error('Submit Pengumuman Error:', error);
      showToast(error.response?.data?.message || 'Gagal menerbitkan pengumuman', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white font-medium flex items-center gap-2 ${
          toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
        }`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* HEADER & BACK BUTTON */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn btn-ghost btn-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={18} /> Kembali
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Buat Pengumuman Hibah Institusi Baru
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200">
              Formulir Penerbitan Surat
            </span>
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Isi rincian informasi dokumen surat resmi pengumuman penerimaan proposal hibah penelitian & pengabdian beserta alokasi waktu lampiran.
          </p>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Top Grid: 2 Columns for Sections 1 & 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Column 1: Informasi Dokumen Surat */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="border-b pb-3 flex items-center gap-2">
              <span className="w-7 h-7 bg-blue-100 text-blue-700 rounded-lg font-bold text-xs flex items-center justify-center">1</span>
              <h3 className="font-bold text-slate-800 text-sm">Informasi Dokumen Surat</h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Surat Resmi *</label>
              <input
                type="text"
                required
                value={formData.nomor_surat}
                onChange={(e) => setFormData({ ...formData, nomor_surat: e.target.value })}
                placeholder="Contoh: 001/UPPM-INDONUSA/III/2026"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm outline-none bg-slate-50/50 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Surat *</label>
              <input
                type="date"
                required
                value={formData.tgl_surat}
                onChange={(e) => setFormData({ ...formData, tgl_surat: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm outline-none bg-slate-50/50 focus:bg-white transition"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tahun Anggaran Pendanaan *</label>
                <input
                  type="text"
                  required
                  value={formData.tahun_anggaran}
                  onChange={(e) => setFormData({ ...formData, tahun_anggaran: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm outline-none bg-slate-50/50 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori Pendanaan</label>
                <input
                  type="text"
                  value={formData.kategori_pendanaan}
                  onChange={(e) => setFormData({ ...formData, kategori_pendanaan: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm outline-none bg-slate-50/50 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Perihal Surat *</label>
              <input
                type="text"
                required
                value={formData.hal_surat}
                onChange={(e) => setFormData({ ...formData, hal_surat: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm outline-none bg-slate-50/50 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Column 2: Tanggal Pengusulan & Pejabat */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="border-b pb-3 flex items-center gap-2">
              <span className="w-7 h-7 bg-indigo-100 text-indigo-700 rounded-lg font-bold text-xs flex items-center justify-center">2</span>
              <h3 className="font-bold text-slate-800 text-sm">Waktu Pengusulan & Pejabat TTD</h3>
            </div>

            <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-3">
              <h4 className="font-bold text-indigo-900 text-xs uppercase">Periode Pengusulan Proposal Dosen</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Buka Pengusulan *</label>
                  <input
                    type="date"
                    required
                    value={formData.tgl_buka_proposal}
                    onChange={(e) => setFormData({ ...formData, tgl_buka_proposal: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm outline-none bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Tutup Pengusulan *</label>
                  <input
                    type="date"
                    required
                    value={formData.tgl_tutup_proposal}
                    onChange={(e) => setFormData({ ...formData, tgl_tutup_proposal: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm outline-none bg-white transition"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama & Gelar Ketua UPPM *</label>
                <input
                  type="text"
                  required
                  value={formData.nama_ketua_uppm}
                  onChange={(e) => setFormData({ ...formData, nama_ketua_uppm: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm outline-none bg-slate-50/50 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama & Gelar Direktur Kampus *</label>
                <input
                  type="text"
                  required
                  value={formData.nama_direktur}
                  onChange={(e) => setFormData({ ...formData, nama_direktur: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm outline-none bg-slate-50/50 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kualifikasi Dosen Sasaran</label>
              <textarea
                rows={2}
                value={formData.kualifikasi_dosen}
                onChange={(e) => setFormData({ ...formData, kualifikasi_dosen: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm outline-none bg-slate-50/50 focus:bg-white transition"
              />
            </div>
          </div>
        </div>

        {/* Section 3: LAMPIRAN 1 Editor (Full Width Below Sections 1 & 2) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 bg-emerald-100 text-emerald-700 rounded-lg font-bold text-xs flex items-center justify-center shrink-0">3</span>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">LAMPIRAN 1: Alokasi Waktu & Agenda Kegiatan</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sesuaikan atau tambah daftar agenda alokasi waktu kegiatan yang akan tampil secara otomatis pada Lampiran 1 surat resmi pengumuman.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddJadwalRow}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition shadow-sm flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
            >
              <Plus size={14} /> Tambah Baris Agenda
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="p-3 w-12 text-center border-b border-slate-200">No</th>
                  <th className="p-3 w-72 border-b border-slate-200">Waktu Agenda</th>
                  <th className="p-3 border-b border-slate-200">Rincian Kegiatan</th>
                  <th className="p-3 w-20 text-center border-b border-slate-200">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {(formData.lampiran_alokasi_waktu || formData.lampiran_jadwal || []).map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 text-center font-bold text-slate-500 bg-slate-50/50">
                      {idx + 1}.
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        placeholder="Contoh: 20 Maret – 22 Maret"
                        value={row.waktu || ''}
                        onChange={(e) => handleJadwalChange(idx, 'waktu', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50/50 focus:bg-white transition"
                      />
                    </td>
                    <td className="p-3">
                      <textarea
                        rows={2}
                        placeholder="Rincian kegiatan..."
                        value={row.kegiatan || ''}
                        onChange={(e) => handleJadwalChange(idx, 'kegiatan', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50/50 focus:bg-white transition"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveJadwalRow(idx)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition border border-rose-200"
                        title="Hapus baris ini"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Footer */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <Link
            href="/sippm/pengumuman"
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition"
          >
            Batal
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary font-bold rounded-xl px-6 py-2.5 border-none shadow-lg text-sm flex items-center gap-2"
          >
            {submitting ? 'Memproses...' : <><Send size={16} /> Terbitkan & Generate Draf Surat PDF</>}
          </button>
        </div>
      </form>
    </div>
  );
}
