'use client';

import { useEffect, useState } from 'react';
import { Award, Plus, RefreshCw, CheckCircle2, ShieldAlert } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { simpegService } from '@/services/simpeg.service';
import type { UsulanJafung, JabatanFungsionalAkademik } from '@/types/simpeg.types';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

export default function UsulanJafungPage() {
  const { hasPermission } = useAuth();
  const canRead = hasPermission('simpeg.usulan_jafung.read') || hasPermission('simpeg.usulan_jafung.request') || hasPermission('simpeg.usulan_jafung.verify');
  const canCreate = hasPermission('simpeg.usulan_jafung.create') || hasPermission('simpeg.usulan_jafung.request');

  const [loading, setLoading] = useState(true);
  const [usulanList, setUsulanList] = useState<UsulanJafung[]>([]);
  const [jafungList, setJafungList] = useState<JabatanFungsionalAkademik[]>([]);

  // Modal Request State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    pegawai_id: 1,
    jafung_asal_id: '',
    jafung_tujuan_id: '',
    angka_kredit_usulan: 200,
    catatan_reviewer: '',
  });

  const loadData = async () => {
    if (!canRead) return;
    setLoading(true);
    try {
      const [resUsulan, resJaf] = await Promise.all([
        simpegService.getUsulanJafungList(),
        simpegService.getJabatanFungsionalList(),
      ]);
      setUsulanList(resUsulan.data || []);
      setJafungList(resJaf.data || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memuat Usulan Jafung');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [canRead]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) {
      toast.error('Akses Ditolak: Anda tidak memiliki permission mengajukan Usulan Jafung.');
      return;
    }

    try {
      await simpegService.createUsulanJafung({
        pegawai_id: formData.pegawai_id,
        jafung_asal_id: formData.jafung_asal_id ? Number(formData.jafung_asal_id) : null,
        jafung_tujuan_id: Number(formData.jafung_tujuan_id),
        angka_kredit_usulan: Number(formData.angka_kredit_usulan),
        catatan_reviewer: formData.catatan_reviewer || null,
      });
      toast.success('Usulan kenaikan Jafung Dosen berhasil diajukan!');
      setShowModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal mengajukan usulan Jafung');
    }
  };

  if (!canRead) {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <PageHeader
          title="Usulan Kenaikan Jabatan Fungsional (Jafung & KUM Dosen)"
          description="Pengajuan & Verifikasi Angka Kredit Akademik Dosen (Asisten Ahli, Lektor, Lektor Kepala, Guru Besar)"
        />
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <ShieldAlert size={56} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#991b1b' }}>
            Akses Ditolak / Dibatasi
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: 500, margin: '0 auto' }}>
            Peran Anda saat ini tidak memiliki permission untuk melihat atau mengajukan Usulan Jafung Dosen.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PageHeader
        title="Usulan Kenaikan Jabatan Fungsional (Jafung & KUM Dosen)"
        description="Pengajuan & Verifikasi Angka Kredit Akademik Dosen (Asisten Ahli, Lektor, Lektor Kepala, Guru Besar)"
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Daftar Usulan Jafung Dosen ({usulanList.length})</h3>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={loadData} className="btn btn-outline btn-sm">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          {canCreate && (
            <button onClick={() => setShowModal(true)} className="btn btn-primary btn-sm">
              <Plus size={16} /> Ajukan Kenaikan Jafung
            </button>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: '1.25rem' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Memuat usulan jafung...</div>
        ) : usulanList.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Award size={48} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
            <p>Belum ada usulan kenaikan Jafung Dosen.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Nama Dosen</th>
                  <th>Jafung Asal</th>
                  <th>Jafung Tujuan</th>
                  <th>Angka Kredit (KUM)</th>
                  <th>Catatan Reviewer Tim Senat</th>
                </tr>
              </thead>
              <tbody>
                {usulanList.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {u.pegawai?.nama_lengkap || `Dosen ID ${u.pegawai_id}`}
                    </td>
                    <td>{u.jafung_asal?.nama || 'Tenaga Pengajar'}</td>
                    <td>
                      <span className="badge badge-purple" style={{ fontWeight: 700 }}>
                        {u.jafung_tujuan?.nama || `Jafung ID ${u.jafung_tujuan_id}`}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: '#059669' }}>{u.angka_kredit_usulan} KUM</td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{u.catatan_reviewer || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Ajukan Jafung */}
      {canCreate && (
        <Modal
          open={showModal}
          onClose={() => setShowModal(false)}
          title="Ajukan Kenaikan Jabatan Fungsional Dosen"
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowModal(false)}>Batal</Button>
              <Button variant="primary" onClick={handleSubmit}>Kirim Usulan Jafung</Button>
            </>
          }
        >
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Jabatan Fungsional Tujuan</label>
              <select
                className="input"
                value={formData.jafung_tujuan_id}
                onChange={(e) => setFormData({ ...formData, jafung_tujuan_id: e.target.value })}
                required
              >
                <option value="">-- Pilih Jafung Target --</option>
                {jafungList.map((jf) => (
                  <option key={jf.id} value={jf.id}>
                    {jf.nama} ({jf.angka_kredit_min} KUM)
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Total Angka Kredit Usulan (KUM)"
              type="number"
              value={formData.angka_kredit_usulan}
              onChange={(e) => setFormData({ ...formData, angka_kredit_usulan: Number(e.target.value) })}
              required
            />
            <div className="form-group">
              <label className="form-label">Catatan Pengajuan / Ringkasan Tridharma</label>
              <textarea
                className="input"
                rows={3}
                value={formData.catatan_reviewer}
                onChange={(e) => setFormData({ ...formData, catatan_reviewer: e.target.value })}
                placeholder="Tuliskan karya ilmiah & pengajaran pendukung..."
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
