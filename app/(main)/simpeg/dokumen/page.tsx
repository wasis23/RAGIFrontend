'use client';

import { useEffect, useState } from 'react';
import { FileText, Upload, Trash2, Eye, ShieldCheck, RefreshCw, ShieldAlert } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { simpegService } from '@/services/simpeg.service';
import type { DokumenPegawai, JenisDokumenPegawai } from '@/types/simpeg.types';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

export default function DokumenPage() {
  const { user, hasPermission } = useAuth();
  const isAdmin = user?.user_type === 'admin' || hasPermission('simpeg.dokumen.manage');
  const canRead = hasPermission('simpeg.dokumen.read') || hasPermission('simpeg.dokumen.manage');
  const canCreate = hasPermission('simpeg.dokumen.create') || hasPermission('simpeg.dokumen.upload') || hasPermission('simpeg.dokumen.manage');
  const canUpdate = hasPermission('simpeg.dokumen.update') || hasPermission('simpeg.dokumen.manage');
  const canDelete = hasPermission('simpeg.dokumen.delete') || hasPermission('simpeg.dokumen.manage');

  const [loading, setLoading] = useState(true);
  const [dokumenList, setDokumenList] = useState<DokumenPegawai[]>([]);

  // Modal Upload State
  const [showModalUpload, setShowModalUpload] = useState(false);
  const [formUpload, setFormUpload] = useState({
    pegawai_id: 1,
    nama_dokumen: '',
    jenis_dokumen: 'ijazah' as JenisDokumenPegawai,
    file_path: '/uploads/documents/sk_dosen.pdf',
    file_size: '2.4 MB',
  });

  // Modal Preview Watermark State
  const [showModalPreview, setShowModalPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  const loadDokumen = async () => {
    if (!canRead) return;
    setLoading(true);
    try {
      if (!isAdmin) {
        const resMe = await simpegService.getPegawaiMe();
        if (resMe.data) {
          const pegId = resMe.data.id;
          setFormUpload(prev => ({ ...prev, pegawai_id: pegId }));
          const res = await simpegService.getDokumenList(pegId);
          setDokumenList(res.data || []);
        }
      } else {
        const res = await simpegService.getDokumenList();
        setDokumenList(res.data || []);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memuat Dokumen E-File');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDokumen();
  }, [canRead]);

  const handleOpenUpload = () => {
    if (!canCreate) {
      toast.error('Anda tidak memiliki permission untuk mengunggah dokumen.');
      return;
    }
    setFormUpload({
      pegawai_id: 1,
      nama_dokumen: '',
      jenis_dokumen: 'ijazah' as JenisDokumenPegawai,
      file_path: '/uploads/documents/doc_' + Date.now() + '.pdf',
      file_size: '1.5 MB',
    });
    setShowModalUpload(true);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) {
      toast.error('Akses Ditolak: Anda tidak memiliki permission mengunggah dokumen.');
      return;
    }
    try {
      await simpegService.createDokumen(formUpload);
      toast.success('Dokumen E-File berhasil diunggah!');
      setShowModalUpload(false);
      loadDokumen();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal mengunggah dokumen');
    }
  };

  const handlePreviewSecure = async (id: number) => {
    if (!canRead) {
      toast.error('Akses Ditolak: Anda tidak memiliki permission membaca dokumen.');
      return;
    }
    try {
      const res = await simpegService.getSecureDokumenView(id);
      setPreviewData(res.data);
      setShowModalPreview(true);
    } catch (err: any) {
      toast.error('Gagal memuat secure preview');
    }
  };

  const handleDelete = async (id: number, nama: string) => {
    if (!canDelete) {
      toast.error('Akses Ditolak: Anda tidak memiliki permission menghapus dokumen.');
      return;
    }
    if (!confirm(`Hapus dokumen "${nama}"?`)) return;
    try {
      await simpegService.deleteDokumen(id);
      toast.success('Dokumen berhasil dihapus!');
      loadDokumen();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus dokumen');
    }
  };

  if (!canRead) {
    return (
      <div className="animate-fade-in flex flex-col gap-6">
        <PageHeader
          title="Manajemen Dokumen E-File Digital"
          description="Arsip Surat Keputusan (SK), Ijazah, Transkrip, KTP, KK, dan Sertifikat Kepegawaian"
        />
        <div className="card p-12 text-center">
          <ShieldAlert size={56} color="var(--danger)" className="mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2 text-red-700">
            Akses Ditolak / Dibatasi
          </h2>
          <p className="text-slate-400 max-w-[500px] mx-auto">
            Peran Anda tidak memiliki permission untuk membaca Arsip Dokumen E-File.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <PageHeader
        title="Manajemen Dokumen E-File Digital"
        description="Arsip Surat Keputusan (SK), Ijazah, Transkrip, KTP, KK, dan Sertifikat Kepegawaian"
      />

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold">Dokumen Digital ({dokumenList.length})</h3>
        <div className="flex gap-3">
          <button onClick={loadDokumen} className="btn btn-outline btn-sm">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          {canCreate && (
            <button onClick={handleOpenUpload} className="btn btn-primary btn-sm">
              <Upload size={16} /> Unggah Dokumen Baru
            </button>
          )}
        </div>
      </div>

      <div className="card p-5">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Memuat berkas E-File...</div>
        ) : dokumenList.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileText size={48} className="mx-auto mb-4 opacity-40" />
            <p>Belum ada dokumen digital yang diunggah.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Nama Dokumen</th>
                  <th>Pemilik / Pegawai</th>
                  <th>Jenis Dokumen</th>
                  <th>Ukuran</th>
                  <th>Proteksi Keamanan</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {dokumenList.map((doc) => (
                  <tr key={doc.id}>
                    <td className="font-bold">{doc.nama_dokumen}</td>
                    <td>{doc.pegawai?.nama_lengkap || `Pegawai ID ${doc.pegawai_id}`}</td>
                    <td>
                      <span className="badge badge-purple uppercase">
                        {doc.jenis_dokumen}
                      </span>
                    </td>
                    <td className="text-slate-400 text-[0.8125rem]">{doc.file_size || '1.2 MB'}</td>
                    <td>
                      <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
                        <ShieldCheck size={14} /> Encrypted Watermark
                      </div>
                    </td>
                    <td className="text-right">
                      <button onClick={() => handlePreviewSecure(doc.id)} className="btn btn-ghost btn-icon btn-sm" title="Pratinjau Terproteksi">
                        <Eye size={16} color="var(--primary-600)" />
                      </button>
                      {canDelete && (
                        <button onClick={() => handleDelete(doc.id, doc.nama_dokumen)} className="btn btn-ghost btn-icon btn-sm" title="Hapus Dokumen">
                          <Trash2 size={16} color="var(--danger)" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Upload */}
      {canCreate && (
        <Modal
          open={showModalUpload}
          onClose={() => setShowModalUpload(false)}
          title="Unggah Dokumen E-File Pegawai"
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowModalUpload(false)}>Batal</Button>
              <Button variant="primary" onClick={handleUploadSubmit}>Unggah Dokumen</Button>
            </>
          }
        >
          <form onSubmit={handleUploadSubmit} className="flex flex-col gap-4">
            <Input
              label="Judul / Nama Dokumen"
              value={formUpload.nama_dokumen}
              onChange={(e) => setFormUpload({ ...formUpload, nama_dokumen: e.target.value })}
              placeholder="Contoh: SK Pengangkatan Dosen Tetap 2024"
              required
            />
            <div className="form-group">
              <label className="form-label">Jenis Dokumen</label>
              <select
                className="input"
                value={formUpload.jenis_dokumen}
                onChange={(e) => setFormUpload({ ...formUpload, jenis_dokumen: e.target.value as JenisDokumenPegawai })}
              >
                <option value="sk">Surat Keputusan (SK)</option>
                <option value="ijazah">Ijazah & Transkrip</option>
                <option value="serdos">Sertifikat Dosen (Serdos)</option>
                <option value="sertifikat">Sertifikat Pelatihan / Keahlian</option>
                <option value="ktp">KTP / NIK</option>
                <option value="kk">Kartu Keluarga (KK)</option>
                <option value="lainnya">Dokumen Pendukung Lainnya</option>
              </select>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Watermark Secure View */}
      <Modal
        open={showModalPreview}
        onClose={() => setShowModalPreview(false)}
        title="Dynamic Watermark Secure Preview"
        footer={<Button variant="secondary" onClick={() => setShowModalPreview(false)}>Tutup Viewer</Button>}
      >
        {previewData && (
          <div className="flex flex-col gap-4">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="font-bold mb-1">{previewData.nama_dokumen}</div>
              <div className="text-xs text-slate-500">Status Keamanan: {previewData.security_status}</div>
            </div>
            <div className="doc-preview">
              <div className="text-center z-[2]">
                <FileText size={48} className="opacity-60 mx-auto mb-2" />
                <p className="text-sm">Pratinjau PDF Terenkripsi</p>
              </div>
              <div className="doc-preview-watermark">
                {previewData.watermark_overlay}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
