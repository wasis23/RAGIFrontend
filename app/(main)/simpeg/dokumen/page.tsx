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
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <PageHeader
          title="Manajemen Dokumen E-File Digital"
          description="Arsip Surat Keputusan (SK), Ijazah, Transkrip, KTP, KK, dan Sertifikat Kepegawaian"
        />
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <ShieldAlert size={56} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#991b1b' }}>
            Akses Ditolak / Dibatasi
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: 500, margin: '0 auto' }}>
            Peran Anda tidak memiliki permission untuk membaca Arsip Dokumen E-File.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PageHeader
        title="Manajemen Dokumen E-File Digital"
        description="Arsip Surat Keputusan (SK), Ijazah, Transkrip, KTP, KK, dan Sertifikat Kepegawaian"
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Dokumen Digital ({dokumenList.length})</h3>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
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

      <div className="card" style={{ padding: '1.25rem' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Memuat berkas E-File...</div>
        ) : dokumenList.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
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
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {dokumenList.map((doc) => (
                  <tr key={doc.id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{doc.nama_dokumen}</td>
                    <td>{doc.pegawai?.nama_lengkap || `Pegawai ID ${doc.pegawai_id}`}</td>
                    <td>
                      <span className="badge badge-purple" style={{ textTransform: 'uppercase' }}>
                        {doc.jenis_dokumen}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{doc.file_size || '1.2 MB'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#059669', fontSize: '0.75rem', fontWeight: 600 }}>
                        <ShieldCheck size={14} /> Encrypted Watermark
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button onClick={() => handlePreviewSecure(doc.id)} className="btn btn-ghost btn-icon btn-sm" title="Pratinjau Terproteksi">
                        <Eye size={16} color="#4f46e5" />
                      </button>
                      {canDelete && (
                        <button onClick={() => handleDelete(doc.id, doc.nama_dokumen)} className="btn btn-ghost btn-icon btn-sm" title="Hapus Dokumen">
                          <Trash2 size={16} color="#ef4444" />
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
          <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{previewData.nama_dokumen}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Status Keamanan: {previewData.security_status}</div>
            </div>
            <div
              style={{
                position: 'relative',
                height: 250,
                background: '#1e293b',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                color: 'white',
              }}
            >
              <div style={{ textAlign: 'center', zIndex: 2 }}>
                <FileText size={48} style={{ opacity: 0.6, margin: '0 auto 0.5rem' }} />
                <p style={{ fontSize: '0.875rem' }}>Pratinjau PDF Terenkripsi</p>
              </div>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: 'rotate(-25deg)',
                  fontSize: '0.95rem',
                  fontWeight: 900,
                  color: 'rgba(239, 68, 68, 0.25)',
                  pointerEvents: 'none',
                  whiteSpace: 'pre-wrap',
                  textAlign: 'center',
                  padding: '1rem',
                  lineHeight: 1.6,
                }}
              >
                {previewData.watermark_overlay}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
