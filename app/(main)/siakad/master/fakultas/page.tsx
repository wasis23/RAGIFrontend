'use client';

import { useState, useEffect } from 'react';
import { Building2, Layers, Plus, Search, Edit3, Trash2, GraduationCap } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

export default function FakultasPage() {
  const [activeTab, setActiveTab] = useState<'fakultas' | 'prodi'>('fakultas');
  const [fakultas, setFakultas] = useState<any[]>([]);
  const [prodis, setProdis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal Fakultas state
  const [isFakultasModalOpen, setIsFakultasModalOpen] = useState(false);
  const [editingFakultas, setEditingFakultas] = useState<any | null>(null);
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
        siakadService.getProdi({ search })
      ]);
      if (fRes.data) {
        setFakultas(fRes.data);
        if (fRes.data.length > 0 && !prodiForm.fakultas_id) {
          setProdiForm(p => ({ ...p, fakultas_id: fRes.data[0].id }));
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
  }, [search]);

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

  const handleDeleteFakultas = async (id: number) => {
    if (!confirm('Yakin ingin menghapus fakultas ini?')) return;
    try {
      await siakadService.deleteFakultas(id);
      toast.success('Fakultas berhasil dihapus');
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
        fakultas_id: item.fakultas_id || fakultas[0]?.id || 1,
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
        toast.success('Program Studi berhasil diperbarui');
      } else {
        await siakadService.createProdi(prodiForm);
        toast.success('Program Studi berhasil ditambahkan');
      }
      setIsProdiModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal menyimpan program studi');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProdi = async (id: number) => {
    if (!confirm('Yakin ingin menghapus program studi ini?')) return;
    try {
      await siakadService.deleteProdi(id);
      toast.success('Program Studi berhasil dihapus');
      fetchData();
    } catch (err: any) {
      toast.error('Gagal menghapus program studi');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <PageHeader
        title="Fakultas & Program Studi"
        description="Master data struktur organisasi akademik, fakultas, dan program studi terakreditasi."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<Plus size={16} />}
              className="font-bold min-h-[40px]"
              onClick={() => handleOpenFakultasModal()}
            >
              Tambah Fakultas
            </Button>
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              className="font-bold min-h-[40px]"
              onClick={() => handleOpenProdiModal()}
            >
              Tambah Program Studi
            </Button>
          </div>
        }
      />

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('fakultas')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'fakultas'
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Building2 size={16} /> Struktur Fakultas ({fakultas.length})
        </button>
        <button
          onClick={() => setActiveTab('prodi')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'prodi'
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <GraduationCap size={16} /> Daftar Program Studi ({prodis.length})
        </button>
      </div>

      {/* Tab 1: Fakultas */}
      {activeTab === 'fakultas' && (
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-8 text-center text-slate-400 text-xs shadow-2xs">
              Memuat data fakultas...
            </div>
          ) : fakultas.length === 0 ? (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-8 text-center text-slate-400 text-xs shadow-2xs">
              Belum ada data fakultas
            </div>
          ) : (
            fakultas.map((f) => (
              <div key={f.id} className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center font-bold">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-2xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
                          {f.kode}
                        </span>
                        <span className="badge badge-green text-2xs font-bold">Aktif</span>
                      </div>
                      <h3 className="font-bold text-base text-slate-900 mt-1">{f.nama}</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      icon={<Edit3 size={13} />}
                      className="text-2xs py-1 px-2.5 h-auto font-bold"
                      onClick={() => handleOpenFakultasModal(f)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      icon={<Trash2 size={13} className="text-rose-600" />}
                      className="text-2xs py-1 px-2.5 h-auto hover:bg-rose-50"
                      onClick={() => handleDeleteFakultas(f.id)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
                  {f.program_studis?.map((prodi: any) => (
                    <div key={prodi.id} className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5 hover:border-primary-300 transition">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-800 text-xs">{prodi.kode_prodi}</span>
                        <span className="badge badge-blue text-2xs font-bold">{prodi.akreditasi || 'Terakreditasi'}</span>
                      </div>
                      <p className="font-bold text-slate-900 text-xs">{prodi.nama} ({prodi.jenjang})</p>
                      <p className="text-2xs text-slate-400 font-mono">Kode DIKTI: {prodi.kode_prodi_dikti || '55201'}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Program Studi Table */}
      {activeTab === 'prodi' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari program studi atau kode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-primary-500 transition outline-none"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4">KODE PRODI</th>
                  <th className="py-3 px-4">KODE DIKTI</th>
                  <th className="py-3 px-4">NAMA PROGRAM STUDI</th>
                  <th className="py-3 px-4">JENJANG</th>
                  <th className="py-3 px-4">FAKULTAS INDUK</th>
                  <th className="py-3 px-4">AKREDITASI</th>
                  <th className="py-3 px-4 text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {loading ? (
                  <tr><td colSpan={7} className="py-8 text-center text-slate-400">Memuat data program studi...</td></tr>
                ) : prodis.length === 0 ? (
                  <tr><td colSpan={7} className="py-8 text-center text-slate-400">Belum ada data program studi</td></tr>
                ) : (
                  prodis.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{p.kode_prodi}</td>
                      <td className="py-3.5 px-4 font-mono text-primary-700 font-bold">{p.kode_prodi_dikti || '-'}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{p.nama}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">{p.jenjang || 'S1'}</td>
                      <td className="py-3.5 px-4 text-slate-600">{p.fakultas?.nama || '-'}</td>
                      <td className="py-3.5 px-4">
                        <span className="badge badge-blue text-2xs font-bold">{p.akreditasi || 'Terakreditasi'}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            icon={<Edit3 size={13} />}
                            className="text-2xs py-1 px-2.5 h-auto font-bold"
                            onClick={() => handleOpenProdiModal(p)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            icon={<Trash2 size={13} className="text-rose-600" />}
                            className="text-2xs py-1 px-2.5 h-auto hover:bg-rose-50"
                            onClick={() => handleDeleteProdi(p.id)}
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
      )}

      {/* Modal Fakultas */}
      {isFakultasModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <h3 className="text-base font-extrabold text-slate-900">
              {editingFakultas ? 'Edit Fakultas' : 'Tambah Fakultas Baru'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Lengkapi kode dan nama resmi fakultas di lingkungan kampus.
            </p>

            <form onSubmit={handleSaveFakultas} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kode Fakultas *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingFakultas)}
                    placeholder="FTI"
                    value={fakultasForm.kode}
                    onChange={(e) => setFakultasForm({ ...fakultasForm, kode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary-500 font-mono disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Singkat
                  </label>
                  <input
                    type="text"
                    placeholder="FTI Sains Data"
                    value={fakultasForm.nama_singkat}
                    onChange={(e) => setFakultasForm({ ...fakultasForm, nama_singkat: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Resmi Fakultas *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Fakultas Teknologi Informasi & Sains Data"
                  value={fakultasForm.nama}
                  onChange={(e) => setFakultasForm({ ...fakultasForm, nama: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    No Telepon
                  </label>
                  <input
                    type="text"
                    placeholder="021-..."
                    value={fakultasForm.telepon}
                    onChange={(e) => setFakultasForm({ ...fakultasForm, telepon: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email Resmi
                  </label>
                  <input
                    type="email"
                    placeholder="fti@kampus.ac.id"
                    value={fakultasForm.email}
                    onChange={(e) => setFakultasForm({ ...fakultasForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  className="text-xs"
                  onClick={() => setIsFakultasModalOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="text-xs font-bold"
                  disabled={saving}
                >
                  {saving ? 'Menyimpan...' : 'Simpan Fakultas'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Program Studi */}
      {isProdiModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <h3 className="text-base font-extrabold text-slate-900">
              {editingProdi ? 'Edit Program Studi' : 'Tambah Program Studi Baru'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Pilih fakultas induk, kode prodi internal, dan kode resmi DIKTI.
            </p>

            <form onSubmit={handleSaveProdi} className="space-y-3.5">
              <div>
                <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Fakultas Induk *
                </label>
                <select
                  value={prodiForm.fakultas_id}
                  onChange={(e) => setProdiForm({ ...prodiForm, fakultas_id: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary-500"
                >
                  {fakultas.map((f) => (
                    <option key={f.id} value={f.id}>{f.kode} - {f.nama}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kode Prodi Internal *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingProdi)}
                    placeholder="IF"
                    value={prodiForm.kode_prodi}
                    onChange={(e) => setProdiForm({ ...prodiForm, kode_prodi: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary-500 font-mono disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kode DIKTI / PDDIKTI
                  </label>
                  <input
                    type="text"
                    placeholder="55201"
                    value={prodiForm.kode_prodi_dikti}
                    onChange={(e) => setProdiForm({ ...prodiForm, kode_prodi_dikti: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Program Studi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Informatika"
                  value={prodiForm.nama}
                  onChange={(e) => setProdiForm({ ...prodiForm, nama: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Jenjang *
                  </label>
                  <select
                    value={prodiForm.jenjang}
                    onChange={(e) => setProdiForm({ ...prodiForm, jenjang: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary-500"
                  >
                    <option value="D3">D3 (Diploma 3)</option>
                    <option value="D4">D4 (Sarjana Terapan)</option>
                    <option value="S1">S1 (Sarjana)</option>
                    <option value="S2">S2 (Magister)</option>
                    <option value="S3">S3 (Doktor)</option>
                    <option value="Profesi">Profesi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Akreditasi
                  </label>
                  <select
                    value={prodiForm.akreditasi}
                    onChange={(e) => setProdiForm({ ...prodiForm, akreditasi: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary-500"
                  >
                    <option value="Unggul">Unggul</option>
                    <option value="Baik Sekali">Baik Sekali</option>
                    <option value="Baik">Baik</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  className="text-xs"
                  onClick={() => setIsProdiModalOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="text-xs font-bold"
                  disabled={saving}
                >
                  {saving ? 'Menyimpan...' : 'Simpan Prodi'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
