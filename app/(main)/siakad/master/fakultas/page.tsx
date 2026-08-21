'use client';

import { useState, useEffect } from 'react';
import { Building2, Layers, Plus, Filter, Edit2, Trash2, GraduationCap } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

export default function FakultasPage() {
  const [activeTab, setActiveTab] = useState<'fakultas' | 'prodi'>('fakultas');
  const [fakultas, setFakultas] = useState<any[]>([]);
  const [prodis, setProdis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter Drawer State
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterFakultasId, setFilterFakultasId] = useState('');
  const [filterJenjang, setFilterJenjang] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    fakultasId: '',
    jenjang: '',
  });

  // Modal Fakultas state
  const [isFakultasModalOpen, setIsFakultasModalOpen] = useState(false);
  const [editingFakultas, setEditingFakultas] = useState<any | null>(null);
  const [deletingFakultas, setDeletingFakultas] = useState<any | null>(null);
  const [fakultasForm, setFakultasForm] = useState({
    kode: '',
    nama: '',
    nama_singkat: '',
    telepon: '',
    email: '',
  });

  // Modal Prodi state
  const [isProdiModalOpen, setIsProdiModalOpen] = useState(false);
  const [editingProdi, setEditingProdi] = useState<any | null>(null);
  const [deletingProdi, setDeletingProdi] = useState<any | null>(null);
  const [prodiForm, setProdiForm] = useState({
    fakultas_id: 1,
    kode_prodi: '',
    kode_prodi_dikti: '',
    nama: '',
    jenjang: 'S1',
    akreditasi: 'Baik Sekali',
  });

  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [fRes, pRes] = await Promise.all([
        siakadService.getFakultas(),
        siakadService.getProdi({
          search: appliedFilters.search,
          fakultas_id: appliedFilters.fakultasId,
          jenjang: appliedFilters.jenjang,
        }),
      ]);
      if (fRes.data) {
        setFakultas(fRes.data);
        if (fRes.data.length > 0 && !prodiForm.fakultas_id) {
          setProdiForm((p) => ({ ...p, fakultas_id: fRes.data[0].id }));
        }
      }
      if (pRes.data) setProdis(pRes.data);
    } catch (err: any) {
      toast.error('Gagal memuat data fakultas & program studi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [appliedFilters]);

  // --- HANDLER FAKULTAS ---
  const handleOpenFakultasModal = (item?: any) => {
    if (item) {
      setEditingFakultas(item);
      setFakultasForm({
        kode: item.kode,
        nama: item.nama,
        nama_singkat: item.nama_singkat || '',
        telepon: item.telepon || '',
        email: item.email || '',
      });
    } else {
      setEditingFakultas(null);
      setFakultasForm({
        kode: '',
        nama: '',
        nama_singkat: '',
        telepon: '',
        email: '',
      });
    }
    setIsFakultasModalOpen(true);
  };

  const handleSaveFakultas = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editingFakultas) {
        await siakadService.updateFakultas(editingFakultas.id, fakultasForm);
        toast.success('Fakultas berhasil diperbarui');
      } else {
        await siakadService.createFakultas(fakultasForm);
        toast.success('Fakultas baru berhasil ditambahkan');
      }
      setIsFakultasModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal menyimpan fakultas');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFakultas = async () => {
    if (!deletingFakultas) return;
    try {
      await siakadService.deleteFakultas(deletingFakultas.id);
      toast.success('Fakultas berhasil dihapus');
      setDeletingFakultas(null);
      fetchData();
    } catch (err: any) {
      toast.error('Gagal menghapus fakultas');
    }
  };

  // --- HANDLER PRODI ---
  const handleOpenProdiModal = (item?: any) => {
    if (item) {
      setEditingProdi(item);
      setProdiForm({
        fakultas_id: item.fakultas_id,
        kode_prodi: item.kode_prodi,
        kode_prodi_dikti: item.kode_prodi_dikti || '',
        nama: item.nama,
        jenjang: item.jenjang || 'S1',
        akreditasi: item.akreditasi || 'Baik Sekali',
      });
    } else {
      setEditingProdi(null);
      setProdiForm({
        fakultas_id: fakultas[0]?.id || 1,
        kode_prodi: '',
        kode_prodi_dikti: '',
        nama: '',
        jenjang: 'S1',
        akreditasi: 'Baik Sekali',
      });
    }
    setIsProdiModalOpen(true);
  };

  const handleSaveProdi = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editingProdi) {
        await siakadService.updateProdi(editingProdi.id, prodiForm);
        toast.success('Program studi berhasil diperbarui');
      } else {
        await siakadService.createProdi(prodiForm);
        toast.success('Program studi baru berhasil ditambahkan');
      }
      setIsProdiModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal menyimpan program studi');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProdi = async () => {
    if (!deletingProdi) return;
    try {
      await siakadService.deleteProdi(deletingProdi.id);
      toast.success('Program studi berhasil dihapus');
      setDeletingProdi(null);
      fetchData();
    } catch (err: any) {
      toast.error('Gagal menghapus program studi');
    }
  };

  const prodiColumns: ColumnDef<any>[] = [
    {
      key: 'kode_prodi',
      label: 'KODE PRODI',
      render: (row) => (
        <span className="font-mono font-bold text-slate-900 text-xs">
          {row.kode_prodi}
        </span>
      ),
    },
    {
      key: 'kode_prodi_dikti',
      label: 'KODE DIKTI',
      render: (row) => (
        <span className="font-mono font-bold text-primary-700 text-xs">
          {row.kode_prodi_dikti || '-'}
        </span>
      ),
    },
    {
      key: 'nama',
      label: 'NAMA PROGRAM STUDI',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 text-sm block">{row.nama}</span>
          <span className="text-2xs text-slate-400 font-medium">{row.fakultas?.nama || '-'}</span>
        </div>
      ),
    },
    {
      key: 'jenjang',
      label: 'JENJANG',
      align: 'center',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-slate-700">
          {row.jenjang || 'S1'}
        </span>
      ),
    },
    {
      key: 'akreditasi',
      label: 'AKREDITASI',
      align: 'center',
      render: (row) => (
        <Badge variant="blue">{row.akreditasi || 'Terakreditasi'}</Badge>
      ),
    },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end">
          <DropdownMenu
            items={[
              {
                label: 'Edit Program Studi',
                icon: <Edit2 size={14} />,
                onClick: () => handleOpenProdiModal(row),
              },
              {
                label: 'Hapus Program Studi',
                icon: <Trash2 size={14} />,
                variant: 'danger',
                onClick: () => setDeletingProdi(row),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Fakultas & Program Studi"
        description="Struktur unit pengelola akademik, fakultas induk, dan program studi yang aktif."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Fakultas & Prodi' },
        ]}
        action={
          <div className="flex items-center gap-2">
            {activeTab === 'fakultas' ? (
              <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={() => handleOpenFakultasModal()}
              >
                Tambah Fakultas
              </Button>
            ) : (
              <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={() => handleOpenProdiModal()}
              >
                Tambah Program Studi
              </Button>
            )}

            {activeTab === 'prodi' && (
              <Button
                variant="outline"
                icon={<Filter size={16} />}
                onClick={() => setShowFilter(true)}
              >
                Filter
              </Button>
            )}
          </div>
        }
      />

      {/* Tab Selector */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('fakultas')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition -mb-px cursor-pointer ${
            activeTab === 'fakultas'
              ? 'border-primary-600 text-primary-600 bg-primary-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Building2 size={16} />
          Struktur Fakultas ({fakultas.length})
        </button>

        <button
          onClick={() => setActiveTab('prodi')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition -mb-px cursor-pointer ${
            activeTab === 'prodi'
              ? 'border-primary-600 text-primary-600 bg-primary-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <GraduationCap size={16} />
          Daftar Program Studi ({prodis.length})
        </button>
      </div>

      {/* Tab 1: Fakultas Cards Grid */}
      {activeTab === 'fakultas' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fakultas.map((f) => (
            <div key={f.id} className="card p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center font-bold shrink-0">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-2xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
                        {f.kode}
                      </span>
                      <Badge variant="green">Aktif</Badge>
                    </div>
                    <h3 className="font-bold text-base text-slate-900 mt-1">{f.nama}</h3>
                  </div>
                </div>

                <DropdownMenu
                  items={[
                    {
                      label: 'Edit Fakultas',
                      icon: <Edit2 size={14} />,
                      onClick: () => handleOpenFakultasModal(f),
                    },
                    {
                      label: 'Hapus Fakultas',
                      icon: <Trash2 size={14} />,
                      variant: 'danger',
                      onClick: () => setDeletingFakultas(f),
                    },
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3 border-t border-slate-100">
                {f.program_studis?.map((prodi: any) => (
                  <div key={prodi.id} className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-800 text-xs">{prodi.kode_prodi}</span>
                      <Badge variant="blue" className="text-[10px]">{prodi.akreditasi || 'Unggul'}</Badge>
                    </div>
                    <p className="font-bold text-slate-900 text-xs">{prodi.nama} ({prodi.jenjang})</p>
                    <p className="text-2xs text-slate-400 font-mono">Kode DIKTI: {prodi.kode_prodi_dikti || '-'}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Program Studi Table (Full-bleed DataTable) */}
      {activeTab === 'prodi' && (
        <DataTable
          columns={prodiColumns}
          data={prodis}
          isLoading={loading}
          emptyMessage="Belum ada program studi yang terdaftar."
        />
      )}

      {/* Filter Drawer for Prodi */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Program Studi"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setFilterSearch('');
                setFilterFakultasId('');
                setFilterJenjang('');
                setAppliedFilters({ search: '', fakultasId: '', jenjang: '' });
                setShowFilter(false);
              }}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setAppliedFilters({
                  search: filterSearch,
                  fakultasId: filterFakultasId,
                  jenjang: filterJenjang,
                });
                setShowFilter(false);
              }}
            >
              Terapkan
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-5">
          <Input
            label="Kode atau Nama Prodi"
            placeholder="Ketik kata kunci..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />

          <div>
            <label className="label">Fakultas Induk</label>
            <select
              value={filterFakultasId}
              onChange={(e) => setFilterFakultasId(e.target.value)}
              className="select w-full"
            >
              <option value="">Semua Fakultas</option>
              {fakultas.map((f) => (
                <option key={f.id} value={f.id.toString()}>{f.nama}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Jenjang Pendidikan</label>
            <select
              value={filterJenjang}
              onChange={(e) => setFilterJenjang(e.target.value)}
              className="select w-full"
            >
              <option value="">Semua Jenjang</option>
              <option value="D3">Diploma 3 (D3)</option>
              <option value="D4">Sarjana Terapan (D4)</option>
              <option value="S1">Sarjana (S1)</option>
              <option value="S2">Magister (S2)</option>
              <option value="S3">Doktor (S3)</option>
              <option value="Profesi">Profesi</option>
            </select>
          </div>
        </div>
      </Drawer>

      {/* Modal Fakultas */}
      <Modal
        open={isFakultasModalOpen}
        onClose={() => setIsFakultasModalOpen(false)}
        title={editingFakultas ? 'Edit Fakultas' : 'Tambah Fakultas Baru'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsFakultasModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSaveFakultas} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Fakultas'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveFakultas} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Kode Fakultas"
            required
            disabled={Boolean(editingFakultas)}
            placeholder="FTI"
            value={fakultasForm.kode}
            onChange={(e) => setFakultasForm({ ...fakultasForm, kode: e.target.value })}
          />

          <Input
            label="Nama Singkat"
            placeholder="FTIK"
            value={fakultasForm.nama_singkat}
            onChange={(e) => setFakultasForm({ ...fakultasForm, nama_singkat: e.target.value })}
          />

          <div className="md:col-span-2">
            <Input
              label="Nama Lengkap Fakultas"
              required
              placeholder="Fakultas Teknologi Informasi & Komunikasi"
              value={fakultasForm.nama}
              onChange={(e) => setFakultasForm({ ...fakultasForm, nama: e.target.value })}
            />
          </div>

          <Input
            label="Nomor Telepon"
            placeholder="021-1234567"
            value={fakultasForm.telepon}
            onChange={(e) => setFakultasForm({ ...fakultasForm, telepon: e.target.value })}
          />

          <Input
            label="Email Resmi Fakultas"
            type="email"
            placeholder="fti@kampus.ac.id"
            value={fakultasForm.email}
            onChange={(e) => setFakultasForm({ ...fakultasForm, email: e.target.value })}
          />
        </form>
      </Modal>

      {/* Modal Prodi */}
      <Modal
        open={isProdiModalOpen}
        onClose={() => setIsProdiModalOpen(false)}
        title={editingProdi ? 'Edit Program Studi' : 'Tambah Program Studi Baru'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsProdiModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSaveProdi} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Program Studi'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveProdi} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Fakultas Induk *</label>
            <select
              disabled={Boolean(editingProdi)}
              value={prodiForm.fakultas_id}
              onChange={(e) => setProdiForm({ ...prodiForm, fakultas_id: parseInt(e.target.value) })}
              className="select w-full"
            >
              {fakultas.map((f) => (
                <option key={f.id} value={f.id}>{f.nama}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Jenjang Pendidikan *</label>
            <select
              value={prodiForm.jenjang}
              onChange={(e) => setProdiForm({ ...prodiForm, jenjang: e.target.value })}
              className="select w-full"
            >
              <option value="D3">Diploma 3 (D3)</option>
              <option value="D4">Sarjana Terapan (D4)</option>
              <option value="S1">Sarjana (S1)</option>
              <option value="S2">Magister (S2)</option>
              <option value="S3">Doktor (S3)</option>
            </select>
          </div>

          <Input
            label="Kode Prodi Internal"
            required
            disabled={Boolean(editingProdi)}
            placeholder="IF"
            value={prodiForm.kode_prodi}
            onChange={(e) => setProdiForm({ ...prodiForm, kode_prodi: e.target.value })}
          />

          <Input
            label="Kode Prodi PDDIKTI"
            placeholder="55201"
            value={prodiForm.kode_prodi_dikti}
            onChange={(e) => setProdiForm({ ...prodiForm, kode_prodi_dikti: e.target.value })}
          />

          <div className="md:col-span-2">
            <Input
              label="Nama Program Studi"
              required
              placeholder="Teknik Informatika"
              value={prodiForm.nama}
              onChange={(e) => setProdiForm({ ...prodiForm, nama: e.target.value })}
            />
          </div>

          <div className="md:col-span-2">
            <label className="label">Peringkat Akreditasi</label>
            <select
              value={prodiForm.akreditasi}
              onChange={(e) => setProdiForm({ ...prodiForm, akreditasi: e.target.value })}
              className="select w-full"
            >
              <option value="Unggul">Unggul (A)</option>
              <option value="Baik Sekali">Baik Sekali (B)</option>
              <option value="Baik">Baik (C)</option>
              <option value="Terakreditasi Sementara">Terakreditasi Sementara</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* Delete Modals */}
      <Modal
        open={Boolean(deletingFakultas)}
        onClose={() => setDeletingFakultas(null)}
        title="Hapus Fakultas?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeletingFakultas(null)}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleDeleteFakultas}>
              Hapus
            </Button>
          </>
        }
      >
        <p className="text-slate-500 text-sm">
          Apakah Anda yakin ingin menghapus fakultas <strong>{deletingFakultas?.nama}</strong>?
        </p>
      </Modal>

      <Modal
        open={Boolean(deletingProdi)}
        onClose={() => setDeletingProdi(null)}
        title="Hapus Program Studi?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeletingProdi(null)}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleDeleteProdi}>
              Hapus
            </Button>
          </>
        }
      >
        <p className="text-slate-500 text-sm">
          Apakah Anda yakin ingin menghapus program studi <strong>{deletingProdi?.nama}</strong>?
        </p>
      </Modal>
    </div>
  );
}
