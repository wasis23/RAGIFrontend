'use client';

import { useEffect, useState } from 'react';
import { Briefcase, Plus, RefreshCw, Award, Edit2, Trash2, ShieldAlert } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { simpegService } from '@/services/simpeg.service';
import type { Jabatan, JabatanFungsionalAkademik, UnitKerja, TipeJabatan, GolonganJafung } from '@/types/simpeg.types';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

export default function JabatanPage() {
  const { hasPermission } = useAuth();
  const canRead = hasPermission('simpeg.jabatan.read') || hasPermission('simpeg.jabatan.manage');
  const canCreate = hasPermission('simpeg.jabatan.create') || hasPermission('simpeg.jabatan.manage');
  const canUpdate = hasPermission('simpeg.jabatan.update') || hasPermission('simpeg.jabatan.manage');
  const canDelete = hasPermission('simpeg.jabatan.delete') || hasPermission('simpeg.jabatan.manage');

  const [activeTab, setActiveTab] = useState<'jabatan' | 'jafung'>('jabatan');
  const [loading, setLoading] = useState(true);
  const [jabatanList, setJabatanList] = useState<Jabatan[]>([]);
  const [jafungList, setJafungList] = useState<JabatanFungsionalAkademik[]>([]);
  const [unitList, setUnitList] = useState<UnitKerja[]>([]);

  // Modal State for Jabatan
  const [showModalJabatan, setShowModalJabatan] = useState(false);
  const [editingJabatan, setEditingJabatan] = useState<Jabatan | null>(null);
  const [formJabatan, setFormJabatan] = useState({
    unit_kerja_id: '',
    nama: '',
    tipe: 'struktural' as TipeJabatan,
    level_jabatan: 2,
    is_active: true,
  });

  // Modal State for Jafung
  const [showModalJafung, setShowModalJafung] = useState(false);
  const [formJafung, setFormJafung] = useState({
    nama: '',
    angka_kredit_min: 100,
    angka_kredit_max: 150,
    golongan: 'asisten_ahli' as GolonganJafung,
  });

  const loadData = async () => {
    if (!canRead) return;
    setLoading(true);
    try {
      const [resJab, resJaf, resUnit] = await Promise.all([
        simpegService.getJabatanList(),
        simpegService.getJabatanFungsionalList(),
        simpegService.getUnitKerjaList(),
      ]);
      setJabatanList(resJab.data || []);
      setJafungList(resJaf.data || []);
      setUnitList(resUnit.data || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memuat data Jabatan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [canRead]);

  const handleOpenCreateJabatan = () => {
    if (!canCreate) {
      toast.error('Anda tidak memiliki permission untuk menambah Jabatan.');
      return;
    }
    setEditingJabatan(null);
    setFormJabatan({ unit_kerja_id: '', nama: '', tipe: 'struktural', level_jabatan: 2, is_active: true });
    setShowModalJabatan(true);
  };

  const handleOpenEditJabatan = (j: Jabatan) => {
    if (!canUpdate) {
      toast.error('Anda tidak memiliki permission untuk mengedit Jabatan.');
      return;
    }
    setEditingJabatan(j);
    setFormJabatan({
      unit_kerja_id: j.unit_kerja_id ? String(j.unit_kerja_id) : '',
      nama: j.nama,
      tipe: j.tipe,
      level_jabatan: j.level_jabatan,
      is_active: j.is_active,
    });
    setShowModalJabatan(true);
  };

  const handleSubmitJabatan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingJabatan && !canUpdate) {
      toast.error('Akses Ditolak: Anda tidak memiliki permission mengedit Jabatan.');
      return;
    }
    if (!editingJabatan && !canCreate) {
      toast.error('Akses Ditolak: Anda tidak memiliki permission menambah Jabatan.');
      return;
    }

    try {
      const payload = {
        unit_kerja_id: formJabatan.unit_kerja_id ? Number(formJabatan.unit_kerja_id) : null,
        nama: formJabatan.nama,
        tipe: formJabatan.tipe,
        level_jabatan: formJabatan.level_jabatan,
        is_active: formJabatan.is_active,
      };

      if (editingJabatan) {
        await simpegService.updateJabatan(editingJabatan.id, payload);
        toast.success('Jabatan berhasil diperbarui!');
      } else {
        await simpegService.createJabatan(payload);
        toast.success('Jabatan berhasil ditambahkan!');
      }

      setShowModalJabatan(false);
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan Jabatan');
    }
  };

  const handleDeleteJabatan = async (id: number, nama: string) => {
    if (!canDelete) {
      toast.error('Akses Ditolak: Anda tidak memiliki permission menghapus Jabatan.');
      return;
    }
    if (!confirm(`Hapus jabatan "${nama}"?`)) return;
    try {
      await simpegService.deleteJabatan(id);
      toast.success('Jabatan berhasil dihapus!');
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus Jabatan');
    }
  };

  const handleSubmitJafung = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) {
      toast.error('Akses Ditolak: Anda tidak memiliki permission mengelola Jafung.');
      return;
    }
    try {
      await simpegService.createJabatanFungsional(formJafung);
      toast.success('Jabatan Fungsional Dosen berhasil ditambahkan!');
      setShowModalJafung(false);
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menambahkan Jafung');
    }
  };

  if (!canRead) {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <PageHeader
          title="Manajemen Jabatan & Jafung Dosen"
          description="Kelola daftar Jabatan Struktural/Teknis serta Jabatan Fungsional Akademik Dosen"
        />
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <ShieldAlert size={56} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#991b1b' }}>
            Akses Ditolak / Dibatasi
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: 500, margin: '0 auto' }}>
            Peran Anda saat ini tidak memiliki hak akses (*permission*) untuk melihat Jabatan & Jafung.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PageHeader
        title="Manajemen Jabatan & Jafung Dosen"
        description="Kelola daftar Jabatan Struktural/Teknis serta Jabatan Fungsional Akademik Dosen"
      />

      {/* Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', background: '#f3f4f6', padding: '0.25rem', borderRadius: 10 }}>
          <button
            onClick={() => setActiveTab('jabatan')}
            className="btn btn-sm"
            style={{
              background: activeTab === 'jabatan' ? 'white' : 'transparent',
              color: activeTab === 'jabatan' ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: activeTab === 'jabatan' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              fontWeight: 700,
            }}
          >
            <Briefcase size={16} /> Jabatan Struktural & Teknis ({jabatanList.length})
          </button>
          <button
            onClick={() => setActiveTab('jafung')}
            className="btn btn-sm"
            style={{
              background: activeTab === 'jafung' ? 'white' : 'transparent',
              color: activeTab === 'jafung' ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: activeTab === 'jafung' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              fontWeight: 700,
            }}
          >
            <Award size={16} /> Jabatan Fungsional (Jafung) ({jafungList.length})
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={loadData} className="btn btn-outline btn-sm">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          {canCreate && activeTab === 'jabatan' && (
            <button onClick={handleOpenCreateJabatan} className="btn btn-primary btn-sm">
              <Plus size={16} /> Tambah Jabatan
            </button>
          )}
          {canCreate && activeTab === 'jafung' && (
            <button onClick={() => setShowModalJafung(true)} className="btn btn-primary btn-sm">
              <Plus size={16} /> Tambah Jafung Dosen
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: Jabatan */}
      {activeTab === 'jabatan' && (
        <div className="card" style={{ padding: '1.25rem' }}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Memuat data jabatan...</div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nama Jabatan</th>
                    <th>Tipe</th>
                    <th>Unit Kerja</th>
                    <th>Level</th>
                    <th>Status</th>
                    {(canUpdate || canDelete) && <th style={{ textAlign: 'right' }}>Aksi</th>}
                  </tr>
                </thead>
                <tbody>
                  {jabatanList.map((j) => (
                    <tr key={j.id}>
                      <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{j.nama}</td>
                      <td>
                        <span className="badge badge-purple" style={{ textTransform: 'uppercase' }}>
                          {j.tipe}
                        </span>
                      </td>
                      <td>{j.unit_kerja?.nama || '-'}</td>
                      <td>Lvl {j.level_jabatan}</td>
                      <td>
                        <span className={`badge ${j.is_active ? 'badge-green' : 'badge-gray'}`}>
                          {j.is_active ? 'Aktif' : 'Non-Aktif'}
                        </span>
                      </td>
                      {(canUpdate || canDelete) && (
                        <td style={{ textAlign: 'right' }}>
                          {canUpdate && (
                            <button onClick={() => handleOpenEditJabatan(j)} className="btn btn-ghost btn-icon btn-sm" title="Edit">
                              <Edit2 size={16} color="#4f46e5" />
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={() => handleDeleteJabatan(j.id, j.nama)} className="btn btn-ghost btn-icon btn-sm" title="Hapus">
                              <Trash2 size={16} color="#ef4444" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Jafung */}
      {activeTab === 'jafung' && (
        <div className="card" style={{ padding: '1.25rem' }}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Memuat master Jafung...</div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nama Jafung</th>
                    <th>Golongan</th>
                    <th>Min KUM</th>
                    <th>Max KUM</th>
                  </tr>
                </thead>
                <tbody>
                  {jafungList.map((jf) => (
                    <tr key={jf.id}>
                      <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{jf.nama}</td>
                      <td>
                        <span className="badge badge-blue" style={{ textTransform: 'uppercase' }}>
                          {jf.golongan.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: '#059669' }}>{jf.angka_kredit_min} KUM</td>
                      <td style={{ fontWeight: 700, color: '#4f46e5' }}>{jf.angka_kredit_max} KUM</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal Form Jabatan */}
      {(canCreate || canUpdate) && (
        <Modal
          open={showModalJabatan}
          onClose={() => setShowModalJabatan(false)}
          title={editingJabatan ? 'Edit Jabatan' : 'Tambah Jabatan Baru'}
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowModalJabatan(false)}>Batal</Button>
              <Button variant="primary" onClick={handleSubmitJabatan}>Simpan Data</Button>
            </>
          }
        >
          <form onSubmit={handleSubmitJabatan} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input
              label="Nama Jabatan"
              value={formJabatan.nama}
              onChange={(e) => setFormJabatan({ ...formJabatan, nama: e.target.value })}
              placeholder="Contoh: Dekan Fakultas Teknik, Kaprodi IF"
              required
            />
            <div className="form-group">
              <label className="form-label">Tipe Jabatan</label>
              <select
                className="input"
                value={formJabatan.tipe}
                onChange={(e) => setFormJabatan({ ...formJabatan, tipe: e.target.value as TipeJabatan })}
              >
                <option value="struktural">Struktural</option>
                <option value="fungsional">Fungsional</option>
                <option value="teknis">Teknis Operasional</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Unit Kerja Terikat (Opsional)</label>
              <select
                className="input"
                value={formJabatan.unit_kerja_id}
                onChange={(e) => setFormJabatan({ ...formJabatan, unit_kerja_id: e.target.value })}
              >
                <option value="">-- Lintas Unit / Tanpa Terikat --</option>
                {unitList.map((u) => (
                  <option key={u.id} value={u.id}>
                    [{u.kode}] {u.nama}
                  </option>
                ))}
              </select>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Form Jafung */}
      {canCreate && (
        <Modal
          open={showModalJafung}
          onClose={() => setShowModalJafung(false)}
          title="Tambah Master Jafung Dosen"
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowModalJafung(false)}>Batal</Button>
              <Button variant="primary" onClick={handleSubmitJafung}>Simpan Master Jafung</Button>
            </>
          }
        >
          <form onSubmit={handleSubmitJafung} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input
              label="Nama Jabatan Fungsional"
              value={formJafung.nama}
              onChange={(e) => setFormJafung({ ...formJafung, nama: e.target.value })}
              placeholder="Contoh: Lektor Kepala (AK 400)"
              required
            />
            <div className="form-group">
              <label className="form-label">Jenjang Golongan</label>
              <select
                className="input"
                value={formJafung.golongan}
                onChange={(e) => setFormJafung({ ...formJafung, golongan: e.target.value as GolonganJafung })}
              >
                <option value="tenaga_pengajar">Tenaga Pengajar</option>
                <option value="asisten_ahli">Asisten Ahli (III/a - III/b)</option>
                <option value="lektor">Lektor (III/c - III/d)</option>
                <option value="lektor_kepala">Lektor Kepala (IV/a - IV/c)</option>
                <option value="guru_besar">Guru Besar / Profesor (IV/d - IV/e)</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Input
                label="Min KUM"
                type="number"
                value={formJafung.angka_kredit_min}
                onChange={(e) => setFormJafung({ ...formJafung, angka_kredit_min: Number(e.target.value) })}
                required
              />
              <Input
                label="Max KUM"
                type="number"
                value={formJafung.angka_kredit_max}
                onChange={(e) => setFormJafung({ ...formJafung, angka_kredit_max: Number(e.target.value) })}
                required
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
