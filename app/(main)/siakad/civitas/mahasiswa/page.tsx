'use client';

import { useState, useEffect } from 'react';
import {
  GraduationCap,
  Plus,
  Filter,
  Edit2,
  Trash2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
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

export default function MahasiswaPage() {
  const [mahasiswas, setMahasiswas] = useState<any[]>([]);
  const [prodis, setProdis] = useState<any[]>([]);
  const [dosens, setDosens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter Drawer States
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterProdi, setFilterProdi] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDosenPa, setFilterDosenPa] = useState('');
  const [filterNim, setFilterNim] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    prodi: '',
    status: '',
    dosenPa: '',
    nim: '',
  });

  // Bulk PA Assignment State
  const [selectedMhsIds, setSelectedMhsIds] = useState<number[]>([]);
  const [isBulkPaModalOpen, setIsBulkPaModalOpen] = useState(false);
  const [selectedBulkDosenId, setSelectedBulkDosenId] = useState<number | ''>('');
  const [assigningPa, setAssigningPa] = useState(false);

  // Sync & Generate NIM States
  const [syncingSpmb, setSyncingSpmb] = useState(false);
  const [generatingNims, setGeneratingNims] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMhs, setEditingMhs] = useState<any | null>(null);
  const [deletingMhs, setDeletingMhs] = useState<any | null>(null);
  const [form, setForm] = useState({
    nama_lengkap: '',
    nim: '',
    nik: '',
    program_studi_id: 1,
    angkatan: 2025,
    jenis_kelamin: 'L',
    status: 'aktif',
    dosen_wali_id: '',
    telepon: '',
    alamat: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchOptions = async () => {
    try {
      const [pRes, dRes] = await Promise.all([
        siakadService.getProdi(),
        siakadService.getDosens({ per_page: 100 }),
      ]);
      if (pRes.data) setProdis(pRes.data);
      if (dRes.data) {
        setDosens(dRes.data);
        if (dRes.data[0]) setSelectedBulkDosenId(dRes.data[0].id);
      }
    } catch (err) {}
  };

  const fetchMahasiswa = async () => {
    try {
      setLoading(true);
      const res = await siakadService.getMahasiswas({
        search: appliedFilters.search,
        program_studi_id: appliedFilters.prodi,
        status: appliedFilters.status,
      });
      if (res.data) {
        let list = res.data;
        if (appliedFilters.dosenPa === 'unassigned') {
          list = list.filter((m: any) => !m.dosen_wali_id);
        } else if (appliedFilters.dosenPa) {
          list = list.filter((m: any) => String(m.dosen_wali_id) === String(appliedFilters.dosenPa));
        }

        if (appliedFilters.nim === 'unassigned') {
          list = list.filter((m: any) => !m.nim || m.nim === '');
        } else if (appliedFilters.nim === 'assigned') {
          list = list.filter((m: any) => Boolean(m.nim));
        }

        setMahasiswas(list);
      }
    } catch (err: any) {
      toast.error('Gagal memuat data mahasiswa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    fetchMahasiswa();
  }, [appliedFilters]);

  const handleSyncSpmb = async () => {
    try {
      setSyncingSpmb(true);
      const res = await siakadService.syncMahasiswaFromSpmb();
      toast.success(res.message || 'Data mahasiswa baru berhasil disinkronkan dari SPMB');
      fetchMahasiswa();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal sinkronisasi data dari SPMB');
    } finally {
      setSyncingSpmb(false);
    }
  };

  const handleGenerateMissingNims = async () => {
    try {
      setGeneratingNims(true);
      const res = await siakadService.generateMissingNims();
      toast.success(res.message || 'NIM berhasil di-generate bagi data yang belum ada');
      fetchMahasiswa();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal generate NIM');
    } finally {
      setGeneratingNims(false);
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedMhsIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedMhsIds.length === mahasiswas.length) {
      setSelectedMhsIds([]);
    } else {
      setSelectedMhsIds(mahasiswas.map((m) => m.id));
    }
  };

  const handleBulkAssignPa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBulkDosenId) {
      toast.error('Pilih Dosen PA terlebih dahulu');
      return;
    }
    try {
      setAssigningPa(true);
      await siakadService.bulkAssignPa({
        mahasiswa_ids: selectedMhsIds,
        dosen_wali_id: Number(selectedBulkDosenId),
      });
      toast.success(`Dosen PA berhasil ditetapkan untuk ${selectedMhsIds.length} mahasiswa`);
      setIsBulkPaModalOpen(false);
      setSelectedMhsIds([]);
      fetchMahasiswa();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal menetapkan Dosen PA');
    } finally {
      setAssigningPa(false);
    }
  };

  const handleOpenModal = (item?: any) => {
    if (item) {
      setEditingMhs(item);
      setForm({
        nama_lengkap: item.nama_lengkap,
        nim: item.nim || '',
        nik: item.nik || '',
        program_studi_id: item.program_studi_id,
        angkatan: item.angkatan || 2025,
        jenis_kelamin: item.jenis_kelamin || 'L',
        status: item.status || 'aktif',
        dosen_wali_id: item.dosen_wali_id ? String(item.dosen_wali_id) : '',
        telepon: item.telepon || '',
        alamat: item.alamat || '',
      });
    } else {
      setEditingMhs(null);
      setForm({
        nama_lengkap: '',
        nim: '',
        nik: '',
        program_studi_id: prodis[0]?.id || 1,
        angkatan: 2025,
        jenis_kelamin: 'L',
        status: 'aktif',
        dosen_wali_id: '',
        telepon: '',
        alamat: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editingMhs) {
        await siakadService.updateMahasiswa(editingMhs.id, form);
        toast.success('Data mahasiswa berhasil diperbarui');
      } else {
        if (!form.nim) {
          await siakadService.generateNim({
            nama_lengkap: form.nama_lengkap,
            program_studi_id: form.program_studi_id,
            angkatan: form.angkatan,
            jenis_kelamin: form.jenis_kelamin,
          });
          toast.success('Mahasiswa & NIM baru berhasil di-generate');
        } else {
          await siakadService.createMahasiswa(form);
          toast.success('Mahasiswa berhasil ditambahkan');
        }
      }
      setIsModalOpen(false);
      fetchMahasiswa();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingMhs) return;
    try {
      await siakadService.deleteMahasiswa(deletingMhs.id);
      toast.success('Mahasiswa berhasil dihapus');
      setDeletingMhs(null);
      fetchMahasiswa();
    } catch (err: any) {
      toast.error('Gagal menghapus mahasiswa');
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      key: 'select',
      label: '',
      align: 'center',
      headerRender: () => (
        <input
          type="checkbox"
          onChange={handleSelectAll}
          checked={mahasiswas.length > 0 && selectedMhsIds.length === mahasiswas.length}
          className="rounded text-primary-600 focus:ring-primary-500 cursor-pointer"
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedMhsIds.includes(row.id)}
          onChange={() => handleToggleSelect(row.id)}
          className="rounded text-primary-600 focus:ring-primary-500 cursor-pointer"
        />
      ),
    },
    {
      key: 'nim',
      label: 'NIM',
      render: (row) => (
        <div className="font-mono">
          {row.nim ? (
            <span className="font-bold text-slate-900 text-xs">{row.nim}</span>
          ) : (
            <div className="flex items-center gap-1.5">
              <Badge variant="amber" className="text-2xs">Belum Ada NIM</Badge>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await siakadService.generateNim({
                      id: row.id,
                      nama_lengkap: row.nama_lengkap,
                      program_studi_id: row.program_studi_id,
                      angkatan: row.angkatan,
                      jenis_kelamin: row.jenis_kelamin,
                    });
                    toast.success(`NIM berhasil di-generate untuk ${row.nama_lengkap}`);
                    fetchMahasiswa();
                  } catch (err: any) {
                    toast.error('Gagal generate NIM');
                  }
                }}
                className="text-2xs font-bold text-primary-600 hover:text-primary-800 underline cursor-pointer"
              >
                + Buat NIM
              </button>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'nama_lengkap',
      label: 'NAMA MAHASISWA',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900 text-sm">{row.nama_lengkap}</span>
          {row.konversi_id && (
            <Badge variant="purple" className="text-2xs">Transfer</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'program_studi',
      label: 'PROGRAM STUDI',
      render: (row) => (
        <span className="text-xs font-medium text-slate-700">
          {row.program_studi?.nama || '-'}
        </span>
      ),
    },
    {
      key: 'angkatan',
      label: 'ANGKATAN',
      align: 'center',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-slate-900">
          {row.angkatan}
        </span>
      ),
    },
    {
      key: 'dosen_pa',
      label: 'DOSEN PA (WALI)',
      render: (row) => (
        <div>
          {row.dosen_wali ? (
            <span className="font-bold text-primary-800 bg-primary-50 px-2 py-1 rounded-lg border border-primary-200 text-xs inline-block">
              {row.dosen_wali.nama_lengkap}
            </span>
          ) : (
            <span className="text-2xs text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 font-bold inline-block">
              Belum Ada Dosen PA
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      align: 'center',
      render: (row) => (
        <Badge
          variant={row.status === 'aktif' ? 'green' : row.status === 'cuti' ? 'amber' : 'gray'}
          className="capitalize"
        >
          {row.status}
        </Badge>
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
                label: 'Edit Mahasiswa',
                icon: <Edit2 size={14} />,
                onClick: () => handleOpenModal(row),
              },
              ...(!row.nim
                ? [
                    {
                      label: 'Generate NIM',
                      icon: <Sparkles size={14} />,
                      onClick: async () => {
                        try {
                          await siakadService.generateNim({
                            id: row.id,
                            nama_lengkap: row.nama_lengkap,
                            program_studi_id: row.program_studi_id,
                            angkatan: row.angkatan,
                            jenis_kelamin: row.jenis_kelamin,
                          });
                          toast.success('NIM berhasil di-generate');
                          fetchMahasiswa();
                        } catch (err: any) {
                          toast.error('Gagal generate NIM');
                        }
                      },
                    },
                  ]
                : []),
              {
                label: 'Hapus Mahasiswa',
                icon: <Trash2 size={14} />,
                variant: 'danger',
                onClick: () => setDeletingMhs(row),
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
        title="Civitas Mahasiswa"
        description="Data mahasiswa aktif, integrasi SPMB, penomoran NIM otomatis, dan plotting Dosen Pembimbing Akademik."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Mahasiswa' },
        ]}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              icon={<RefreshCw size={15} className={syncingSpmb ? 'animate-spin' : ''} />}
              onClick={handleSyncSpmb}
              disabled={syncingSpmb}
            >
              {syncingSpmb ? 'Menyinkronkan...' : 'Tarik dari SPMB'}
            </Button>
            <Button
              variant="outline"
              icon={<Sparkles size={15} />}
              onClick={handleGenerateMissingNims}
              disabled={generatingNims}
            >
              {generatingNims ? 'Memproses...' : 'Generate NIM'}
            </Button>
            <Button
              variant="outline"
              icon={<GraduationCap size={16} />}
              onClick={() => {
                if (selectedMhsIds.length === 0) {
                  toast('Centang mahasiswa di tabel terlebih dahulu untuk menetapkan Dosen PA.', { icon: 'ℹ️' });
                } else {
                  setIsBulkPaModalOpen(true);
                }
              }}
            >
              Plotting Dosen PA ({selectedMhsIds.length})
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

      {/* Floating Action Bar jika ada mahasiswa yang dicentang */}
      {selectedMhsIds.length > 0 && (
        <div className="card p-4 flex items-center justify-between border-primary-500 bg-primary-950 text-white shadow-xl animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-700 text-white font-black flex items-center justify-center text-xs">
              {selectedMhsIds.length}
            </div>
            <div>
              <p className="text-xs font-extrabold text-white">
                {selectedMhsIds.length} Mahasiswa Terpilih
              </p>
              <p className="text-2xs text-primary-200">
                Siap ditetapkan Dosen Pembimbing Akademik (Dosen PA) secara bersamaan.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              className="text-xs font-bold py-1.5 px-3 h-auto"
              onClick={() => setSelectedMhsIds([])}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              className="text-xs font-bold py-1.5 px-4 h-auto bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs border-none"
              onClick={() => setIsBulkPaModalOpen(true)}
            >
              Tetapkan Dosen PA Sekarang →
            </Button>
          </div>
        </div>
      )}

      {/* Full-bleed DataTable Card */}
      <DataTable
        columns={columns}
        data={mahasiswas}
        isLoading={loading}
        emptyMessage="Belum ada data mahasiswa yang terdaftar."
      />

      {/* Filter Drawer */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Mahasiswa"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setFilterSearch('');
                setFilterProdi('');
                setFilterNim('');
                setFilterDosenPa('');
                setFilterStatus('');
                setAppliedFilters({ search: '', prodi: '', nim: '', dosenPa: '', status: '' });
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
                  nim: filterNim,
                  dosenPa: filterDosenPa,
                  status: filterStatus,
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
            label="NIM, NIK, atau Nama Mahasiswa"
            placeholder="Ketik kata kunci pencarian..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />

          <div>
            <label className="label">Program Studi</label>
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
            <label className="label">Status Kepemilikan NIM</label>
            <select
              value={filterNim}
              onChange={(e) => setFilterNim(e.target.value)}
              className="select w-full"
            >
              <option value="">Semua Status NIM</option>
              <option value="unassigned">⚠️ Belum Memiliki NIM</option>
              <option value="assigned">✓ Sudah Memiliki NIM</option>
            </select>
          </div>

          <div>
            <label className="label">Dosen Pembimbing Akademik (PA)</label>
            <select
              value={filterDosenPa}
              onChange={(e) => setFilterDosenPa(e.target.value)}
              className="select w-full"
            >
              <option value="">Semua Dosen PA</option>
              <option value="unassigned">⚠️ Belum Memiliki Dosen PA</option>
              {dosens.map((d) => (
                <option key={d.id} value={d.id.toString()}>{d.nama_lengkap}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Status Akademik</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="select w-full"
            >
              <option value="">Semua Status</option>
              <option value="aktif">Aktif</option>
              <option value="cuti">Cuti</option>
              <option value="mangkir">Mangkir</option>
              <option value="lulus">Lulus</option>
            </select>
          </div>
        </div>
      </Drawer>

      {/* Modal Plotting Dosen PA Massal */}
      <Modal
        open={isBulkPaModalOpen}
        onClose={() => setIsBulkPaModalOpen(false)}
        title="Plotting Dosen Pembimbing Akademik (PA)"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsBulkPaModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleBulkAssignPa} disabled={assigningPa}>
              {assigningPa ? 'Menyimpan...' : `Tetapkan untuk ${selectedMhsIds.length} Mahasiswa`}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Pilih Dosen PA yang akan membimbing <strong>{selectedMhsIds.length} mahasiswa</strong> terpilih.
          </p>

          <div>
            <label className="label">Pilih Dosen Pembimbing Akademik (PA) *</label>
            <select
              required
              value={selectedBulkDosenId}
              onChange={(e) => setSelectedBulkDosenId(Number(e.target.value))}
              className="select w-full font-bold"
            >
              {dosens.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nama_lengkap} (NIDN: {d.nidn || '-'})
                </option>
              ))}
            </select>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-2xs text-slate-600 space-y-1">
            <p>• Dosen PA berhak memverifikasi dan menyetujui pengajuan KRS mahasiswa.</p>
            <p>• Dosen PA memonitor rekap nilai KHS dan perkembangan indeks prestasi kumulatif.</p>
          </div>
        </div>
      </Modal>

      {/* Modal Form Mahasiswa */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMhs ? 'Edit Mahasiswa' : 'Tambah Mahasiswa / Generate NIM'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Mahasiswa'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Nama Lengkap Mahasiswa"
              required
              placeholder="Contoh: Ahmad Fauzi"
              value={form.nama_lengkap}
              onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })}
            />
          </div>

          <Input
            label="NIM (Kosongkan jika auto)"
            disabled={Boolean(editingMhs)}
            placeholder="Kosong = Auto generate"
            value={form.nim}
            onChange={(e) => setForm({ ...form, nim: e.target.value })}
          />

          <div>
            <label className="label">Program Studi *</label>
            <select
              disabled={Boolean(editingMhs)}
              value={form.program_studi_id}
              onChange={(e) => setForm({ ...form, program_studi_id: parseInt(e.target.value) })}
              className="select w-full"
            >
              {prodis.map((p) => (
                <option key={p.id} value={p.id}>{p.nama}</option>
              ))}
            </select>
          </div>

          <Input
            label="Tahun Angkatan"
            type="number"
            required
            value={form.angkatan}
            onChange={(e) => setForm({ ...form, angkatan: parseInt(e.target.value) || 2025 })}
          />

          <div>
            <label className="label">Jenis Kelamin *</label>
            <select
              value={form.jenis_kelamin}
              onChange={(e) => setForm({ ...form, jenis_kelamin: e.target.value })}
              className="select w-full"
            >
              <option value="L">Laki-laki (L)</option>
              <option value="P">Perempuan (P)</option>
            </select>
          </div>

          {editingMhs && (
            <div className="md:col-span-2">
              <label className="label">Status Akademik</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="select w-full"
              >
                <option value="aktif">Aktif</option>
                <option value="cuti">Cuti</option>
                <option value="mangkir">Mangkir</option>
                <option value="lulus">Lulus</option>
              </select>
            </div>
          )}
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        open={Boolean(deletingMhs)}
        onClose={() => setDeletingMhs(null)}
        title="Hapus Mahasiswa?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeletingMhs(null)}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Hapus
            </Button>
          </>
        }
      >
        <p className="text-slate-500 text-sm">
          Apakah Anda yakin ingin menghapus mahasiswa <strong>{deletingMhs?.nama_lengkap}</strong> ({deletingMhs?.nim || 'Belum ada NIM'})? Tindakan ini tidak dapat dibatalkan.
        </p>
      </Modal>
    </div>
  );
}
