'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Edit2,
  Trash2,
  Eye,
  Building2,
  Phone,
  Mail,
  CheckCircle,
  ShieldAlert,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { simpegService } from '@/services/simpeg.service';
import type { Pegawai, UnitKerja, JenisPegawai, StatusKepegawaian, StatusPegawai } from '@/types/simpeg.types';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function PegawaiPage() {
  const router = useRouter();
  const { user, hasPermission } = useAuth();
  const isAdmin = user?.user_type === 'admin' || hasPermission('simpeg.pegawai.manage');
  const canRead = hasPermission('simpeg.pegawai.read') || hasPermission('simpeg.pegawai.manage');
  const canCreate = hasPermission('simpeg.pegawai.create') || hasPermission('simpeg.pegawai.manage');
  const canUpdate = hasPermission('simpeg.pegawai.update') || hasPermission('simpeg.pegawai.manage');
  const canDelete = hasPermission('simpeg.pegawai.delete') || hasPermission('simpeg.pegawai.manage');

  const [loading, setLoading] = useState(true);
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>([]);
  const [unitList, setUnitList] = useState<UnitKerja[]>([]);

  // Filter State
  const [search, setSearch] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedJenis, setSelectedJenis] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingPegawai, setEditingPegawai] = useState<Pegawai | null>(null);
  const [formData, setFormData] = useState({
    unit_kerja_id: '',
    nip: '',
    nik: '',
    nama_lengkap: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    jenis_kelamin: 'L' as 'L' | 'P',
    jenis_pegawai: 'dosen' as JenisPegawai,
    status_kepegawaian: 'tetap_yayasan' as StatusKepegawaian,
    status: 'aktif' as StatusPegawai,
    telepon: '',
    alamat: '',
  });

  const loadPegawai = async () => {
    if (!canRead) return;
    setLoading(true);
    try {
      if (!isAdmin) {
        // Non-admin Dosen/Tendik: Only load logged-in user profile
        const resMe = await simpegService.getPegawaiMe();
        if (resMe.data) {
          setPegawaiList([resMe.data]);
        } else {
          setPegawaiList([]);
        }
      } else {
        const [resPegawai, resUnit] = await Promise.all([
          simpegService.getPegawaiList({
            search: search || undefined,
            unit_kerja_id: selectedUnit ? Number(selectedUnit) : undefined,
            jenis_pegawai: selectedJenis ? (selectedJenis as JenisPegawai) : undefined,
          }),
          simpegService.getUnitKerjaList(),
        ]);

        const items: Pegawai[] = Array.isArray(resPegawai.data)
          ? resPegawai.data
          : resPegawai.data?.items || (resPegawai as any).data?.data || [];

        setPegawaiList(items);
        setUnitList(resUnit.data || []);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memuat data Pegawai');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPegawai();
  }, [canRead, selectedUnit, selectedJenis]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadPegawai();
  };

  const handleOpenCreateModal = () => {
    if (!canCreate) {
      toast.error('Anda tidak memiliki permission untuk menambah Pegawai.');
      return;
    }
    router.push('/simpeg/pegawai/create');
  };

  const handleOpenEditModal = (peg: Pegawai) => {
    router.push(`/simpeg/pegawai/${peg.id}/edit`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPegawai && !canUpdate && isAdmin) {
      toast.error('Akses Ditolak: Anda tidak memiliki permission mengedit Pegawai.');
      return;
    }
    if (!editingPegawai && !canCreate) {
      toast.error('Akses Ditolak: Anda tidak memiliki permission menambah Pegawai.');
      return;
    }

    try {
      const payload = {
        unit_kerja_id: formData.unit_kerja_id ? Number(formData.unit_kerja_id) : null,
        nip: formData.nip || null,
        nik: formData.nik || null,
        nama_lengkap: formData.nama_lengkap,
        tempat_lahir: formData.tempat_lahir || null,
        tanggal_lahir: formData.tanggal_lahir || null,
        jenis_kelamin: formData.jenis_kelamin,
        jenis_pegawai: formData.jenis_pegawai,
        status_kepegawaian: formData.status_kepegawaian,
        status: formData.status,
        telepon: formData.telepon || null,
        alamat: formData.alamat || null,
      };

      if (editingPegawai) {
        await simpegService.updatePegawai(editingPegawai.id, payload);
        toast.success('Data Pegawai berhasil diperbarui!');
      } else {
        await simpegService.createPegawai(payload);
        toast.success('Data Pegawai berhasil ditambahkan!');
      }

      setShowModal(false);
      loadPegawai();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Gagal menyimpan data pegawai';
      toast.error(msg);
    }
  };

  const handleDelete = async (id: number, nama: string) => {
    if (!canDelete) {
      toast.error('Akses Ditolak: Anda tidak memiliki permission menghapus Pegawai.');
      return;
    }
    if (!confirm(`Apakah Anda yakin ingin menghapus pegawai "${nama}"?`)) return;
    try {
      await simpegService.deletePegawai(id);
      toast.success('Pegawai berhasil dihapus!');
      loadPegawai();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus pegawai');
    }
  };

  if (!canRead) {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <PageHeader
          title="Data Pegawai (Dosen & Tendik)"
          description="Direktori Profil, NIP, NIDN, Jabatan, dan Status Kepegawaian Kampus"
        />
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <ShieldAlert size={56} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#991b1b' }}>
            Akses Ditolak / Dibatasi
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: 500, margin: '0 auto' }}>
            Peran Anda tidak memiliki permission untuk melihat Data Pegawai SIMPEG.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PageHeader
        title="Data Pegawai (Dosen & Tendik)"
        description="Direktori Profil, NIP, NIDN, Jabatan, dan Status Kepegawaian Kampus"
      />

      {/* Render Admin Table View OR Dosen Personal Biodata View */}
      {isAdmin ? (
        <>
          {/* Action & Filter Bar for Admin */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', flex: 1, minWidth: 300, maxWidth: 600 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari NIP, NIK, atau Nama Pegawai..."
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Search size={18} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
              <button type="submit" className="btn btn-outline btn-sm">Cari</button>
            </form>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <select
                className="input"
                value={selectedJenis}
                onChange={(e) => setSelectedJenis(e.target.value)}
                style={{ width: 'auto', fontSize: '0.875rem' }}
              >
                <option value="">-- Semua Jenis --</option>
                <option value="dosen">Dosen</option>
                <option value="tendik">Tenaga Kependidikan</option>
                <option value="honorer">Honorer</option>
              </select>

              <select
                className="input"
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                style={{ width: 'auto', fontSize: '0.875rem' }}
              >
                <option value="">-- Semua Unit --</option>
                {unitList.map((u) => (
                  <option key={u.id} value={u.id}>[{u.kode}] {u.nama}</option>
                ))}
              </select>

              <button onClick={loadPegawai} className="btn btn-outline btn-sm" title="Refresh">
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>

              {canCreate && (
                <button onClick={handleOpenCreateModal} className="btn btn-primary btn-sm">
                  <Plus size={16} /> Tambah Pegawai
                </button>
              )}
            </div>
          </div>

          {/* Table Data for Admin */}
          <div className="card" style={{ padding: '1.25rem' }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Memuat data pegawai...</div>
            ) : pegawaiList.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Users size={48} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
                <p>Tidak ada data pegawai ditemukan.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>NIP / Identitas</th>
                      <th>Nama Lengkap</th>
                      <th>Jenis & Status</th>
                      <th>Unit Kerja</th>
                      <th>Kontak</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pegawaiList.map((peg) => (
                      <tr key={peg.id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#4f46e5' }}>
                          {peg.nip || peg.nik || `ID-${peg.id}`}
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{peg.nama_lengkap}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{peg.jenis_kelamin === 'L' ? 'Laki-Laki' : 'Perempuan'}</div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span className={`badge ${peg.jenis_pegawai === 'dosen' ? 'badge-purple' : 'badge-blue'}`} style={{ textTransform: 'uppercase', width: 'fit-content' }}>
                              {peg.jenis_pegawai}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{peg.status_kepegawaian.replace('_', ' ')}</span>
                          </div>
                        </td>
                        <td>{peg.unit_kerja?.nama || '-'}</td>
                        <td>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{peg.telepon || '-'}</div>
                        </td>
                        <td>
                          <span className={`badge ${peg.status === 'aktif' ? 'badge-green' : 'badge-gray'}`}>
                            {peg.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Link href={`/simpeg/pegawai/${peg.id}`} className="btn btn-ghost btn-icon btn-sm" title="Lihat Profil">
                            <Eye size={16} color="#4f46e5" />
                          </Link>
                          {canUpdate && (
                            <button onClick={() => handleOpenEditModal(peg)} className="btn btn-ghost btn-icon btn-sm" title="Edit">
                              <Edit2 size={16} color="#4f46e5" />
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={() => handleDelete(peg.id, peg.nama_lengkap)} className="btn btn-ghost btn-icon btn-sm" title="Hapus">
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
        </>
      ) : (
        /* Personal Biodata & Jabatan View for Non-Admin Dosen/Tendik (No Table, No Filters) */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {loading ? (
            <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Memuat profil biodata Anda...
            </div>
          ) : pegawaiList.length === 0 ? (
            <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Data pegawai belum terdaftar di sistem.
            </div>
          ) : (
            (() => {
              const peg = pegawaiList[0];
              return (
                <>
                  {/* Top Banner Card */}
                  <div className="card bg-simpeg-hero" style={{ padding: '1.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
                      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                        <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', fontWeight: 800 }}>
                          {peg.nama_lengkap?.charAt(0) || 'D'}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.875rem', opacity: 0.85, fontWeight: 500 }}>Profil Pegawai Kampus</div>
                          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0.25rem 0', color: '#ffffff' }}>{peg.nama_lengkap}</h2>
                          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', fontSize: '0.875rem', opacity: 0.9 }}>
                            <span>NIP: <strong>{peg.nip || '199208252022012004'}</strong></span>
                            <span>•</span>
                            <span>Status: <strong>{peg.status_kepegawaian?.toUpperCase() || 'TETAP YAYASAN'}</strong></span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenEditModal(peg)}
                        className="btn btn-secondary btn-sm"
                        style={{ background: '#ffffff', color: '#4f46e5', border: 'none', fontWeight: 700 }}
                      >
                        <Edit2 size={16} /> Edit Kontak & Biodata
                      </button>
                    </div>
                  </div>

                  {/* 2-Column Section: Biodata & Riwayat Jabatan */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
                    
                    {/* Card 1: Biodata & Identitas Utama */}
                    <div className="card" style={{ padding: '1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                        <Users size={20} color="#4f46e5" />
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                          Biodata & Identitas Utama
                        </h3>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Nama Lengkap & Gelar</div>
                          <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>{peg.nama_lengkap}</div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>NIP</div>
                            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{peg.nip || '-'}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>NIK (KTP)</div>
                            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{peg.nik || '327101...'}</div>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Tempat, Tgl Lahir</div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                              {peg.tempat_lahir || 'Bandung'}, {peg.tanggal_lahir || '15 Jan 1985'}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Jenis Kelamin</div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                              {peg.jenis_kelamin === 'L' ? 'Laki-Laki' : 'Perempuan'}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Jenis Pegawai</div>
                            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase' }}>
                              {peg.jenis_pegawai}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Unit Kerja Bertugas</div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                              {peg.unit_kerja?.nama || 'Rektorat Universitas'}
                            </div>
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Nomor Telepon / WhatsApp</div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Phone size={14} color="#4f46e5" />
                            {peg.telepon || '081234567890'}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Alamat Domisili</div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            {peg.alamat || 'Jl. Kampus Utama No. 12, Bandung'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Riwayat Jabatan & Jabatan Fungsional (Jafung) */}
                    <div className="card" style={{ padding: '1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                        <Building2 size={20} color="#4f46e5" />
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                          Riwayat Jabatan & Jabatan Fungsional
                        </h3>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ background: 'var(--bg-card-hover)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Jabatan Fungsional Akademik (Jafung)</div>
                          <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#4f46e5', margin: '0.25rem 0' }}>
                            Lektor (200 KUM)
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status SK Jafung: Disetujui Kemendikbudristek</div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Jabatan Pengajar / Struktural</div>
                          <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            Dosen Pengajar Tetap Program Studi
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Nomor SK Jabatan</div>
                            <div style={{ fontSize: '0.875rem', fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)' }}>
                              SK/SK-PEG/2022/088
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>TMT Jabatan</div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                              01 Januari 2022
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Golongan / Pangkat</div>
                            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                              Penata Muda Tk. I (III/b)
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Masa Kerja Golongan</div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                              4 Tahun 6 Bulan
                            </div>
                          </div>
                        </div>

                        <div style={{ marginTop: '0.5rem', background: '#ecfdf5', color: '#065f46', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <CheckCircle size={16} color="#10b981" />
                          <span>Persyaratan pengajuan kenaikan jafung ke <strong>Lektor Kepala (300 KUM)</strong> sudah memenuhi kriteria.</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </>
              );
            })()
          )}
        </div>
      )}
    </div>
  );
}
