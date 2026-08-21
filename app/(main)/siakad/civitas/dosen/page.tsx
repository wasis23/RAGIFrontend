'use client';

import { useState, useEffect } from 'react';
import { UserCheck, Plus, Filter, Edit2, Trash2, RefreshCw } from 'lucide-react';
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

export default function DosenPage() {
  const [dosens, setDosens] = useState<any[]>([]);
  const [prodis, setProdis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter Drawer States
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterProdi, setFilterProdi] = useState('');
  const [filterJabatan, setFilterJabatan] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    prodi: '',
    jabatan: '',
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDosen, setEditingDosen] = useState<any | null>(null);
  const [deletingDosen, setDeletingDosen] = useState<any | null>(null);
  const [form, setForm] = useState({
    nama_lengkap: '',
    nidn: '',
    nip: '',
    program_studi_id: 1,
    jabatan_akademik: 'Lektor',
  });
  const [saving, setSaving] = useState(false);
  const [syncingSimpeg, setSyncingSimpeg] = useState(false);

  const fetchProdis = async () => {
    try {
      const res = await siakadService.getProdi();
      if (res.data) setProdis(res.data);
    } catch (err) {}
  };

  const fetchDosens = async () => {
    try {
      setLoading(true);
      const res = await siakadService.getDosens({
        search: appliedFilters.search,
        program_studi_id: appliedFilters.prodi,
      });
      if (res.data) {
        let list = res.data;
        if (appliedFilters.jabatan) {
          list = list.filter((d: any) => d.jabatan_akademik === appliedFilters.jabatan);
        }
        setDosens(list);
      }
    } catch (err: any) {
      toast.error('Gagal memuat data dosen');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProdis();
  }, []);

  useEffect(() => {
    fetchDosens();
  }, [appliedFilters]);

  const handleOpenModal = (item?: any) => {
    if (item) {
      setEditingDosen(item);
      setForm({
        nama_lengkap: item.nama_lengkap,
        nidn: item.nidn || '',
        nip: item.nip || '',
        program_studi_id: item.program_studi_id,
        jabatan_akademik: item.jabatan_akademik || 'Lektor',
      });
    } else {
      setEditingDosen(null);
      setForm({
        nama_lengkap: '',
        nidn: '',
        nip: '',
        program_studi_id: prodis[0]?.id || 1,
        jabatan_akademik: 'Lektor',
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editingDosen) {
        await siakadService.updateDosen(editingDosen.id, form);
        toast.success('Data dosen berhasil diperbarui');
      } else {
        await siakadService.createDosen(form);
        toast.success('Dosen berhasil ditambahkan');
      }
      setIsModalOpen(false);
      fetchDosens();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal menyimpan dosen');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingDosen) return;
    try {
      await siakadService.deleteDosen(deletingDosen.id);
      toast.success('Dosen berhasil dihapus');
      setDeletingDosen(null);
      fetchDosens();
    } catch (err: any) {
      toast.error('Gagal menghapus dosen');
    }
  };

  const handleSyncSimpeg = async () => {
    try {
      setSyncingSimpeg(true);
      const res = await siakadService.syncDosenFromSimpeg();
      toast.success(res.message || 'Data dosen berhasil disinkronkan dari SIMPEG');
      fetchDosens();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal sinkronisasi data dari SIMPEG');
    } finally {
      setSyncingSimpeg(false);
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      key: 'nidn',
      label: 'NIDN',
      render: (row) => (
        <span className="font-mono font-bold text-slate-900 text-xs">
          {row.nidn || '-'}
        </span>
      ),
    },
    {
      key: 'nama_lengkap',
      label: 'NAMA LENGKAP & GELAR',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 text-sm block">{row.nama_lengkap}</span>
          {row.nip && (
            <span className="text-2xs text-slate-400 font-mono">NIP: {row.nip}</span>
          )}
        </div>
      ),
    },
    {
      key: 'program_studi',
      label: 'HOMEBASE PRODI',
      render: (row) => (
        <span className="text-xs font-medium text-slate-700">
          {row.program_studi?.nama || '-'}
        </span>
      ),
    },
    {
      key: 'jabatan_akademik',
      label: 'JABATAN AKADEMIK',
      render: (row) => (
        <span className="text-xs font-semibold text-slate-800">
          {row.jabatan_akademik || 'Tenaga Pendidik'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      align: 'center',
      render: () => <Badge variant="green">Aktif</Badge>,
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
                label: 'Edit Dosen',
                icon: <Edit2 size={14} />,
                onClick: () => handleOpenModal(row),
              },
              {
                label: 'Hapus Dosen',
                icon: <Trash2 size={14} />,
                variant: 'danger',
                onClick: () => setDeletingDosen(row),
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
        title="Civitas Dosen & Pengajar"
        description="Data dosen ber-NIDN, homebase program studi, dan integrasi data kepegawaian SIMPEG."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Dosen' },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<RefreshCw size={15} className={syncingSimpeg ? 'animate-spin' : ''} />}
              onClick={handleSyncSimpeg}
              disabled={syncingSimpeg}
            >
              {syncingSimpeg ? 'Menyinkronkan...' : 'Sinkronkan SIMPEG'}
            </Button>
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => handleOpenModal()}
            >
              Tambah Dosen
            </Button>
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setShowFilter(true)}
            >
              Filter
            </Button>
          </div>
        }
      />

      <div className="card p-4 flex items-center justify-between gap-3 text-xs bg-primary-50/60 border-primary-200 text-primary-900">
        <div className="flex items-center gap-2.5">
          <UserCheck className="text-primary-600 shrink-0" size={18} />
          <span>
            <strong>Terintegrasi Otomatis dengan SIMPEG:</strong> Seluruh data dosen terpusat pada Modul Kepegawaian (SIMPEG). Penambahan atau pembaruan dosen dilakukan di SIMPEG dan otomatis tersinkronisasi ke SIAKAD.
          </span>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={dosens}
        isLoading={loading}
        emptyMessage="Belum ada data dosen yang terdaftar."
      />

      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Dosen"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setFilterSearch('');
                setFilterProdi('');
                setFilterJabatan('');
                setAppliedFilters({ search: '', prodi: '', jabatan: '' });
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
                  prodi: filterProdi,
                  jabatan: filterJabatan,
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
            label="NIDN, NIP, atau Nama Dosen"
            placeholder="Ketik kata kunci pencarian..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />

          <div>
            <label className="label">Homebase Program Studi</label>
            <select
              value={filterProdi}
              onChange={(e) => setFilterProdi(e.target.value)}
              className="select w-full"
            >
              <option value="">Semua Program Studi</option>
              {prodis.map((p) => (
                <option key={p.id} value={p.id.toString()}>{p.nama}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Jabatan Fungsional Akademik</label>
            <select
              value={filterJabatan}
              onChange={(e) => setFilterJabatan(e.target.value)}
              className="select w-full"
            >
              <option value="">Semua Jabatan</option>
              <option value="Tenaga Pengajar">Tenaga Pengajar</option>
              <option value="Asisten Ahli">Asisten Ahli</option>
              <option value="Lektor">Lektor</option>
              <option value="Lektor Kepala">Lektor Kepala</option>
              <option value="Guru Besar">Guru Besar (Profesor)</option>
            </select>
          </div>
        </div>
      </Drawer>

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDosen ? 'Edit Data Dosen' : 'Tambah Dosen Baru'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Dosen'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Nama Lengkap & Gelar *"
              required
              placeholder="Dr. Ahmad Santoso, M.Kom"
              value={form.nama_lengkap}
              onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })}
            />
          </div>

          <Input
            label="NIDN"
            placeholder="0412345601"
            value={form.nidn}
            onChange={(e) => setForm({ ...form, nidn: e.target.value })}
          />

          <Input
            label="NIP / NUP"
            placeholder="1985..."
            value={form.nip}
            onChange={(e) => setForm({ ...form, nip: e.target.value })}
          />

          <div>
            <label className="label">Homebase Prodi *</label>
            <select
              value={form.program_studi_id}
              onChange={(e) => setForm({ ...form, program_studi_id: parseInt(e.target.value) })}
              className="select w-full"
            >
              {prodis.map((p) => (
                <option key={p.id} value={p.id}>{p.nama}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Jabatan Akademik</label>
            <select
              value={form.jabatan_akademik}
              onChange={(e) => setForm({ ...form, jabatan_akademik: e.target.value })}
              className="select w-full"
            >
              <option value="Tenaga Pengajar">Tenaga Pengajar</option>
              <option value="Asisten Ahli">Asisten Ahli</option>
              <option value="Lektor">Lektor</option>
              <option value="Lektor Kepala">Lektor Kepala</option>
              <option value="Guru Besar">Guru Besar</option>
            </select>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(deletingDosen)}
        onClose={() => setDeletingDosen(null)}
        title="Hapus Dosen?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeletingDosen(null)}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Hapus
            </Button>
          </>
        }
      >
        <p className="text-slate-500 text-sm">
          Apakah Anda yakin ingin menghapus data dosen <strong>{deletingDosen?.nama_lengkap}</strong> (NIDN: {deletingDosen?.nidn || '-'})? Tindakan ini tidak dapat dibatalkan.
        </p>
      </Modal>
    </div>
  );
}
