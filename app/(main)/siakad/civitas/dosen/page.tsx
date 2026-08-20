'use client';

import { useState, useEffect } from 'react';
import { UserCheck, Plus, Search, Edit3, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

export default function DosenPage() {
  const [dosens, setDosens] = useState<any[]>([]);
  const [prodis, setProdis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterProdi, setFilterProdi] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDosen, setEditingDosen] = useState<any | null>(null);
  const [form, setForm] = useState({
    nama_lengkap: '',
    nidn: '',
    nip: '',
    program_studi_id: 1,
    jabatan_akademik: 'Lektor',
  });
  const [saving, setSaving] = useState(false);

  const fetchProdis = async () => {
    try {
      const res = await siakadService.getProdi();
      if (res.data) setProdis(res.data);
    } catch (err) {}
  };

  const fetchDosens = async () => {
    try {
      setLoading(true);
      const res = await siakadService.getDosens({ search, program_studi_id: filterProdi });
      if (res.data) setDosens(res.data);
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
  }, [search, filterProdi]);

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

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus dosen ini?')) return;
    try {
      await siakadService.deleteDosen(id);
      toast.success('Dosen berhasil dihapus');
      fetchDosens();
    } catch (err: any) {
      toast.error('Gagal menghapus dosen');
    }
  };

  const [syncingSimpeg, setSyncingSimpeg] = useState(false);

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

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <PageHeader
        title="Dosen & Tenaga Pengajar"
        description="Data dosen ber-NIDN, homebase program studi, dan integrasi data pegawai SIMPEG."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<UserCheck size={16} className="text-primary-600" />}
              className="font-bold min-h-[40px] border-primary-200 hover:bg-primary-50 text-primary-700"
              onClick={handleSyncSimpeg}
              disabled={syncingSimpeg}
            >
              {syncingSimpeg ? 'Menyinkronkan...' : 'Tarik Data Dosen dari SIMPEG'}
            </Button>
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              className="font-bold min-h-[40px]"
              onClick={() => handleOpenModal()}
            >
              Tambah Dosen Baru
            </Button>
          </div>
        }
      />

      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
        {/* Filters */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari berdasarkan NIDN, NIP, atau Nama Lengkap..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-primary-500 transition outline-none"
            />
          </div>

          <select
            value={filterProdi}
            onChange={(e) => setFilterProdi(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
          >
            <option value="">Semua Program Studi</option>
            {prodis.map((p) => (
              <option key={p.id} value={p.id}>{p.nama}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-y border-slate-200">
              <tr>
                <th className="py-3 px-4">NIDN</th>
                <th className="py-3 px-4">NAMA LENGKAP & GELAR</th>
                <th className="py-3 px-4">PROGRAM STUDI</th>
                <th className="py-3 px-4">JABATAN AKADEMIK</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr><td colSpan={6} className="py-8 text-center text-slate-400">Memuat data dosen...</td></tr>
              ) : dosens.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-slate-400">Tidak ada data dosen</td></tr>
              ) : (
                dosens.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{d.nidn || '-'}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{d.nama_lengkap}</td>
                    <td className="py-3.5 px-4">{d.program_studi?.nama || '-'}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{d.jabatan_akademik || 'Tenaga Pendidik'}</td>
                    <td className="py-3.5 px-4">
                      <span className="badge badge-green text-2xs font-bold">Aktif</span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          icon={<Edit3 size={13} />}
                          className="text-2xs py-1 px-2.5 h-auto font-bold"
                          onClick={() => handleOpenModal(d)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          icon={<Trash2 size={13} className="text-rose-600" />}
                          className="text-2xs py-1 px-2.5 h-auto hover:bg-rose-50"
                          onClick={() => handleDelete(d.id)}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dosen */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <h3 className="text-base font-extrabold text-slate-900">
              {editingDosen ? 'Edit Data Dosen' : 'Tambah Dosen Pengampu'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Lengkapi NIDN, gelar, dan program studi homebase dosen.
            </p>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Lengkap & Gelar *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Dr. Ahmad Santoso, M.Kom"
                  value={form.nama_lengkap}
                  onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    NIDN
                  </label>
                  <input
                    type="text"
                    placeholder="0412345601"
                    value={form.nidn}
                    onChange={(e) => setForm({ ...form, nidn: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    NIP / NUP
                  </label>
                  <input
                    type="text"
                    placeholder="1985..."
                    value={form.nip}
                    onChange={(e) => setForm({ ...form, nip: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Homebase Prodi *
                  </label>
                  <select
                    value={form.program_studi_id}
                    onChange={(e) => setForm({ ...form, program_studi_id: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary-500"
                  >
                    {prodis.map((p) => (
                      <option key={p.id} value={p.id}>{p.nama}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Jabatan Akademik
                  </label>
                  <select
                    value={form.jabatan_akademik}
                    onChange={(e) => setForm({ ...form, jabatan_akademik: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary-500"
                  >
                    <option value="Asisten Ahli">Asisten Ahli</option>
                    <option value="Lektor">Lektor</option>
                    <option value="Lektor Kepala">Lektor Kepala</option>
                    <option value="Guru Besar">Guru Besar</option>
                    <option value="Tenaga Pengajar">Tenaga Pengajar</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  className="text-xs"
                  onClick={() => setIsModalOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="text-xs font-bold"
                  disabled={saving}
                >
                  {saving ? 'Menyimpan...' : 'Simpan Dosen'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
