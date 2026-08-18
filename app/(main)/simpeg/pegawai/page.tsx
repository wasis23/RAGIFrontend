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
      <div className="animate-fade-in flex flex-col gap-6">
        <PageHeader
          title="Data Pegawai (Dosen & Tendik)"
          description="Direktori Profil, NIP, NIDN, Jabatan, dan Status Kepegawaian Kampus"
        />
        <div className="card p-12 text-center">
          <ShieldAlert size={56} color="var(--danger)" className="mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2 text-red-700">
            Akses Ditolak / Dibatasi
          </h2>
          <p className="text-slate-400 max-w-[500px] mx-auto">
            Peran Anda tidak memiliki permission untuk melihat Data Pegawai SIMPEG.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <PageHeader
        title="Data Pegawai (Dosen & Tendik)"
        description="Direktori Profil, NIP, NIDN, Jabatan, dan Status Kepegawaian Kampus"
      />

      {/* Render Admin Table View OR Dosen Personal Biodata View */}
      {isAdmin ? (
        <>
          {/* Action & Filter Bar for Admin */}
          <div className="flex justify-between items-center flex-wrap gap-4">
            <form onSubmit={handleSearchSubmit} className="flex gap-3 flex-1 min-w-[300px] max-w-[600px]">
              <div className="relative flex-1">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari NIP, NIK, atau Nama Pegawai..."
                  className="pl-10"
                />
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
              <button type="submit" className="btn btn-outline btn-sm">Cari</button>
            </form>

            <div className="flex gap-3 items-center">
              <select
                className="input"
                value={selectedJenis}
                onChange={(e) => setSelectedJenis(e.target.value)}
                className="w-auto text-sm"
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
                className="w-auto text-sm"
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
          <div className="card p-5">
            {loading ? (
              <div className="p-8 text-center text-slate-400">Memuat data pegawai...</div>
            ) : pegawaiList.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Users size={48} className="mx-auto mb-4 opacity-40" />
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
                      <th className="text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pegawaiList.map((peg) => (
                      <tr key={peg.id}>
                        <td className="font-mono font-bold text-primary-600">
                          {peg.nip || peg.nik || `ID-${peg.id}`}
                        </td>
                        <td>
                          <div className="font-bold">{peg.nama_lengkap}</div>
                          <div className="text-xs text-slate-400">{peg.jenis_kelamin === 'L' ? 'Laki-Laki' : 'Perempuan'}</div>
                        </td>
                        <td>
                          <div className="flex flex-col gap-0.5">
                            <span className={`badge uppercase w-fit ${peg.jenis_pegawai === 'dosen' ? 'badge-purple' : 'badge-blue'}`}>
                              {peg.jenis_pegawai}
                            </span>
                            <span className="text-xs text-slate-500">{peg.status_kepegawaian.replace('_', ' ')}</span>
                          </div>
                        </td>
                        <td>{peg.unit_kerja?.nama || '-'}</td>
                        <td>
                          <div className="text-[0.8125rem] text-slate-500">{peg.telepon || '-'}</div>
                        </td>
                        <td>
                          <span className={`badge ${peg.status === 'aktif' ? 'badge-green' : 'badge-gray'}`}>
                            {peg.status}
                          </span>
                        </td>
                        <td className="text-right">
                          <Link href={`/simpeg/pegawai/${peg.id}`} className="btn btn-ghost btn-icon btn-sm" title="Lihat Profil">
                            <Eye size={16} color="var(--primary-600)" />
                          </Link>
                          {canUpdate && (
                            <button onClick={() => handleOpenEditModal(peg)} className="btn btn-ghost btn-icon btn-sm" title="Edit">
                              <Edit2 size={16} color="var(--primary-600)" />
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={() => handleDelete(peg.id, peg.nama_lengkap)} className="btn btn-ghost btn-icon btn-sm" title="Hapus">
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
        </>
      ) : (
        /* Personal Biodata & Jabatan View for Non-Admin Dosen/Tendik (No Table, No Filters) */
        <div className="flex flex-col gap-6">
          {loading ? (
            <div className="card p-12 text-center text-slate-400">
              Memuat profil biodata Anda...
            </div>
          ) : pegawaiList.length === 0 ? (
            <div className="card p-12 text-center text-slate-400">
              Data pegawai belum terdaftar di sistem.
            </div>
          ) : (
            (() => {
              const peg = pegawaiList[0];
              return (
                <>
                  {/* Top Banner Card */}
                  <div className="card bg-simpeg-hero p-7">
                    <div className="flex justify-between items-start flex-wrap gap-6">
                      <div className="flex gap-5 items-center">
                        <div className="w-[68px] h-[68px] rounded-full bg-white/20 flex items-center justify-center text-[1.75rem] font-extrabold">
                          {peg.nama_lengkap?.charAt(0) || 'D'}
                        </div>
                        <div>
                          <div className="text-sm opacity-85 font-medium">Profil Pegawai Kampus</div>
                          <h2 className="text-2xl font-extrabold my-1 text-white">{peg.nama_lengkap}</h2>
                          <div className="flex gap-3 items-center flex-wrap text-sm opacity-90">
                            <span>NIP: <strong>{peg.nip || '199208252022012004'}</strong></span>
                            <span>•</span>
                            <span>Status: <strong>{peg.status_kepegawaian?.toUpperCase() || 'TETAP YAYASAN'}</strong></span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenEditModal(peg)}
                        className="btn btn-secondary btn-sm bg-white text-primary-600 border-none font-bold"
                      >
                        <Edit2 size={16} /> Edit Kontak & Biodata
                      </button>
                    </div>
                  </div>

                  {/* 2-Column Section: Biodata & Riwayat Jabatan */}
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(340px,1fr))] gap-6">
                    
                    {/* Card 1: Biodata & Identitas Utama */}
                    <div className="card p-6">
                      <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-200">
                        <Users size={20} color="var(--primary-600)" />
                        <h3 className="text-lg font-bold m-0">
                          Biodata & Identitas Utama
                        </h3>
                      </div>

                      <div className="flex flex-col gap-4">
                        <div>
                          <div className="text-xs text-slate-400 uppercase font-semibold">Nama Lengkap & Gelar</div>
                          <div className="text-[0.9375rem] font-bold">{peg.nama_lengkap}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-slate-400 uppercase font-semibold">NIP</div>
                            <div className="text-sm font-semibold font-mono">{peg.nip || '-'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-400 uppercase font-semibold">NIK (KTP)</div>
                            <div className="text-sm font-semibold font-mono">{peg.nik || '327101...'}</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-slate-400 uppercase font-semibold">Tempat, Tgl Lahir</div>
                            <div className="text-sm text-slate-500">
                              {peg.tempat_lahir || 'Bandung'}, {peg.tanggal_lahir || '15 Jan 1985'}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-400 uppercase font-semibold">Jenis Kelamin</div>
                            <div className="text-sm text-slate-500">
                              {peg.jenis_kelamin === 'L' ? 'Laki-Laki' : 'Perempuan'}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-slate-400 uppercase font-semibold">Jenis Pegawai</div>
                            <div className="text-sm font-bold text-primary-600 uppercase">
                              {peg.jenis_pegawai}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-400 uppercase font-semibold">Unit Kerja Bertugas</div>
                            <div className="text-sm text-slate-500">
                              {peg.unit_kerja?.nama || 'Rektorat Universitas'}
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-slate-400 uppercase font-semibold">Nomor Telepon / WhatsApp</div>
                          <div className="text-sm text-slate-500 flex items-center gap-2">
                            <Phone size={14} color="var(--primary-600)" />
                            {peg.telepon || '081234567890'}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-slate-400 uppercase font-semibold">Alamat Domisili</div>
                          <div className="text-sm text-slate-500">
                            {peg.alamat || 'Jl. Kampus Utama No. 12, Bandung'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Riwayat Jabatan & Jabatan Fungsional (Jafung) */}
                    <div className="card p-6">
                      <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-200">
                        <Building2 size={20} color="var(--primary-600)" />
                        <h3 className="text-lg font-bold m-0">
                          Riwayat Jabatan & Jabatan Fungsional
                        </h3>
                      </div>

                      <div className="flex flex-col gap-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                          <div className="text-xs text-slate-400 uppercase font-semibold">Jabatan Fungsional Akademik (Jafung)</div>
                          <div className="text-lg font-extrabold text-primary-600 my-1">
                            Lektor (200 KUM)
                          </div>
                          <div className="text-xs text-slate-400">Status SK Jafung: Disetujui Kemendikbudristek</div>
                        </div>

                        <div>
                          <div className="text-xs text-slate-400 uppercase font-semibold">Jabatan Pengajar / Struktural</div>
                          <div className="text-[0.9375rem] font-bold">
                            Dosen Pengajar Tetap Program Studi
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-slate-400 uppercase font-semibold">Nomor SK Jabatan</div>
                            <div className="text-sm font-mono font-semibold">
                              SK/SK-PEG/2022/088
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-400 uppercase font-semibold">TMT Jabatan</div>
                            <div className="text-sm text-slate-500">
                              01 Januari 2022
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-slate-400 uppercase font-semibold">Golongan / Pangkat</div>
                            <div className="text-sm font-semibold">
                              Penata Muda Tk. I (III/b)
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-400 uppercase font-semibold">Masa Kerja Golongan</div>
                            <div className="text-sm text-slate-500">
                              4 Tahun 6 Bulan
                            </div>
                          </div>
                        </div>

                        <div className="mt-2 bg-emerald-50 text-emerald-700 p-3 rounded-lg text-[0.8125rem] flex items-center gap-2">
                          <CheckCircle size={16} color="var(--success)" />
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
