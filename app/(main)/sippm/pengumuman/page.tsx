'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Shield, FilePlus, Printer, Upload, FileText, Send, CheckCircle2 } from 'lucide-react';
import { sippmService } from '@/services/sippm.service';
import type { PengumumanHibah } from '@/types/sippm.types';

export default function PengumumanHibahPage() {
  const [announcements, setAnnouncements] = useState<PengumumanHibah[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showUploadSignedModal, setShowUploadSignedModal] = useState<number | null>(null);
  const [showUploadTemplateModal, setShowUploadTemplateModal] = useState<number | null>(null);

  const [signedFile, setSignedFile] = useState<File | null>(null);
  const [templateType, setTemplateType] = useState<'mitra_indo' | 'mitra_intl'>('mitra_indo');
  const [templateFile, setTemplateFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await sippmService.indexPengumuman();
      if (res.data) {
        const dataItems = Array.isArray(res.data.data)
          ? res.data.data
          : (res.data.data as any)?.items || [];
        setAnnouncements(dataItems);
      }
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleUploadSigned = async (id: number) => {
    if (!signedFile) return;
    setSubmitting(true);
    try {
      await sippmService.uploadSignedPengumuman(id, signedFile);
      showNotification('Scan surat TTD basah berhasil diunggah!');
      setShowUploadSignedModal(null);
      setSignedFile(null);
      fetchAnnouncements();
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Gagal mengunggah file scan TTD.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadTemplate = async (id: number) => {
    if (!templateFile) return;
    setSubmitting(true);
    try {
      await sippmService.uploadTemplatePengumuman(id, templateType, templateFile);
      showNotification('File template proposal berhasil diunggah!');
      setShowUploadTemplateModal(null);
      setTemplateFile(null);
      fetchAnnouncements();
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Gagal mengunggah file template proposal.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin mempublish pengumuman ini? Periode pengusulan proposal di sistem akan OTOMATIS DIBUKA bagi seluruh dosen.')) {
      return;
    }
    setSubmitting(true);
    try {
      await sippmService.publishPengumuman(id);
      showNotification('Pengumuman berhasil DIPUBLISH! Dashboard dosen sekarang menampilkan periode pengusulan proposal aktif.');
      fetchAnnouncements();
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Gagal mempublish pengumuman.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateString = (val?: string) => {
    if (!val) return '-';
    return val.split('T')[0];
  };

  const getApiUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white font-medium flex items-center gap-2 ${
          toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
        }`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge badge-sippm">Modul Hibah SIPPM</span>
            <span className="badge badge-teal flex items-center gap-1 font-bold">
              <Shield size={12} /> Access: Admin UPPM (Semua Data Dosen)
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Pengumuman Hibah Internal
          </h1>
          <p className="text-slate-500 text-sm">
            Panel Admin UPPM untuk mengelola, menerbitkan, dan mencetak surat pengumuman hibah institusi.
          </p>
        </div>

        <Link
          href="/sippm/pengumuman/create"
          className="btn btn-primary font-bold rounded-xl px-4 py-2.5 flex items-center gap-2 border-none shadow-sm"
        >
          <FilePlus size={18} /> Terbitkan Pengumuman Baru
        </Link>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 text-sm">Daftar Pengumuman Hibah Institusi</h3>
          <span className="text-xs text-slate-500 font-medium">Total: {announcements.length} Dokumen</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Memuat data pengumuman...</div>
        ) : announcements.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            Belum ada pengumuman penerimaan proposal hibah yang diterbitkan. Klik <b>"Terbitkan Pengumuman Baru"</b> di atas.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-700 font-semibold text-xs uppercase border-b border-slate-200">
                <tr>
                  <th className="p-4">Nomor & Perihal Surat</th>
                  <th className="p-4">Tahun Anggaran</th>
                  <th className="p-4">Periode Pengusulan</th>
                  <th className="p-4">Status Siklus</th>
                  <th className="p-4 text-center">Aksi / Kontrol Surat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {announcements.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{p.nomor_surat}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{p.hal_surat}</div>
                      <div className="text-[11px] text-slate-400 mt-1">Surakarta, {formatDateString(p.tgl_surat)}</div>
                    </td>
                    <td className="p-4 font-semibold text-teal-700">T.A. {p.tahun_anggaran}</td>
                    <td className="p-4 text-xs">
                      <div className="text-emerald-600 font-medium">Buka: {formatDateString(p.tgl_buka_proposal)}</div>
                      <div className="text-rose-600 font-medium mt-0.5">Tutup: {formatDateString(p.tgl_tutup_proposal)}</div>
                    </td>
                    <td className="p-4">
                      {p.status === 'draft' && (
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-semibold">
                          Draf (Belum TTD)
                        </span>
                      )}
                      {p.status === 'pending_scan' && (
                        <span className="px-2.5 py-1 bg-teal-50 text-teal-700 border border-teal-200 rounded-full text-xs font-semibold">
                          Scan TTD Uploaded
                        </span>
                      )}
                      {p.status === 'published' && (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
                          <CheckCircle2 size={12} /> Published & Aktif
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {/* Button Cetak Draf PDF */}
                        <a
                          href={`${getApiUrl()}/sippm/pengumuman/${p.id}/html-draft`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-[160px] px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-lg text-xs transition flex items-center justify-center gap-1.5 border border-slate-200 shadow-sm"
                        >
                          <Printer size={14} /> Cetak Draf PDF
                        </a>

                        {/* Upload Scan TTD */}
                        <button
                          onClick={() => setShowUploadSignedModal(p.id)}
                          className="w-[160px] px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 font-medium rounded-lg text-xs transition flex items-center justify-center gap-1.5 border border-teal-200 shadow-sm"
                        >
                          <Upload size={14} /> Upload Scan TTD
                        </button>

                        {/* Upload Template Proposal */}
                        <button
                          onClick={() => setShowUploadTemplateModal(p.id)}
                          className="w-[160px] px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium rounded-lg text-xs transition flex items-center justify-center gap-1.5 border border-purple-200 shadow-sm"
                        >
                          <FileText size={14} /> Upload Template
                        </button>

                        {/* Button Publish */}
                        {p.status !== 'published' && (
                          <button
                            onClick={() => handlePublish(p.id)}
                            disabled={submitting}
                            className="w-[160px] px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-lg text-xs shadow hover:shadow-emerald-500/20 transition flex items-center justify-center gap-1.5"
                          >
                            <Send size={14} /> Publish Pengumuman
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>


      {/* Modal 2: Upload Signed Scan PDF */}
      {showUploadSignedModal !== null && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-2">Upload Scan Surat TTD Basah</h3>
            <p className="text-xs text-slate-600">
              Unggah file hasil <i>scan</i> dokumen surat pengumuman resmi yang sudah ditandatangani basah dan distempel oleh Direktur & Ketua UPPM (Format PDF / Gambar, maks 10MB).
            </p>

            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setSignedFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
            />

            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => setShowUploadSignedModal(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-medium"
              >
                Batal
              </button>
              <button
                onClick={() => handleUploadSigned(showUploadSignedModal)}
                disabled={!signedFile || submitting}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
              >
                {submitting ? 'Mengunggah...' : 'Simpan Scan TTD'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Upload Proposal Templates */}
      {showUploadTemplateModal !== null && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-2">Upload Template Proposal Dosen</h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori Template Proposal</label>
              <select
                value={templateType}
                onChange={(e) => setTemplateType(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="mitra_indo">Template Proposal Mitra Indonesia (.docx)</option>
                <option value="mitra_intl">Template Proposal Mitra Internasional (.docx)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih File (.docx / .pdf)</label>
              <input
                type="file"
                accept=".doc,.docx,.pdf"
                onChange={(e) => setTemplateFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => setShowUploadTemplateModal(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-medium"
              >
                Batal
              </button>
              <button
                onClick={() => handleUploadTemplate(showUploadTemplateModal)}
                disabled={!templateFile || submitting}
                className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
              >
                {submitting ? 'Mengunggah...' : 'Unggah Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
