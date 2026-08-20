'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, Edit3, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

export default function MataKuliahPage() {
  const [matakuliahs, setMatakuliahs] = useState<any[]>([]);
  const [kurikulums, setKurikulums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterKurikulum, setFilterKurikulum] = useState('');
  const [filterTipe, setFilterTipe] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMk, setEditingMk] = useState<any | null>(null);
  const [form, setForm] = useState({
    kurikulum_id: 1,
    kode_mk: '',
    nama: '',
    sks_teori: 2,
    sks_praktik: 1,
    semester_anjuran: 1,
    tipe: 'wajib',
  });
  const [saving, setSaving] = useState(false);

  const fetchKurikulums = async () => {
    try {
      const res = await siakadService.getKurikulums();
      if (res.data) setKurikulums(res.data);
    } catch (err) {}
  };

  const fetchMataKuliah = async () => {
    try {
      setLoading(true);
      const res = await siakadService.getMataKuliahs({
        search,
        kurikulum_id: filterKurikulum,
        tipe: filterTipe,
      });
      if (res.data) setMatakuliahs(res.data);
    } catch (err: any) {
      toast.error('Gagal memuat mata kuliah');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKurikulums();
  }, []);

  useEffect(() => {
    fetchMataKuliah();
  }, [search, filterKurikulum, filterTipe]);

  const handleOpenModal = (item?: any) => {
    if (item) {
      setEditingMk(item);
      setForm({
        kurikulum_id: item.kurikulum_id,
        kode_mk: item.kode_mk,
        nama: item.nama,
        sks_teori: item.sks_teori,
        sks_praktik: item.sks_praktik,
        semester_anjuran: item.semester_anjuran,
        tipe: item.tipe,
      });
    } else {
      setEditingMk(null);
      setForm({
        kurikulum_id: kurikulums[0]?.id || 1,
        kode_mk: '',
        nama: '',
        sks_teori: 2,
        sks_praktik: 1,
        semester_anjuran: 1,
        tipe: 'wajib',
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editingMk) {
        await siakadService.updateMataKuliah(editingMk.id, form);
        toast.success('Mata kuliah berhasil diperbarui');
      } else {
        await siakadService.createMataKuliah(form);
        toast.success('Mata kuliah berhasil ditambahkan');
      }
      setIsModalOpen(false);
      fetchMataKuliah();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal menyimpan mata kuliah');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus mata kuliah ini?')) return;
    try {
      await siakadService.deleteMataKuliah(id);
      toast.success('Mata kuliah berhasil dihapus');
      fetchMataKuliah();
    } catch (err: any) {
      toast.error('Gagal menghapus mata kuliah');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <PageHeader
        title="Mata Kuliah & Bobot SKS"
        description="Master data mata kuliah, pembagian SKS tatap muka dan praktik, serta semester anjuran."
        action={
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            className="font-bold min-h-[40px]"
            onClick={() => handleOpenModal()}
          >
            Tambah Mata Kuliah
          </Button>
        }
      />

      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari kode atau nama mata kuliah..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-primary-500 transition outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterKurikulum}
              onChange={(e) => setFilterKurikulum(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
            >
              <option value="">Semua Kurikulum</option>
              {kurikulums.map((k) => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </select>

            <select
              value={filterTipe}
              onChange={(e) => setFilterTipe(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
            >
              <option value="">Semua Tipe</option>
              <option value="wajib">Wajib</option>
              <option value="pilihan">Pilihan</option>
              <option value="wajib_prodi">Wajib Prodi</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-y border-slate-200">
              <tr>
                <th className="py-3 px-4">KODE MK</th>
                <th className="py-3 px-4">NAMA MATA KULIAH</th>
                <th className="py-3 px-4">KURIKULUM</th>
                <th className="py-3 px-4">BOBOT SKS (T/P)</th>
                <th className="py-3 px-4">SEM</th>
                <th className="py-3 px-4">TIPE</th>
                <th className="py-3 px-4 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr><td colSpan={7} className="py-8 text-center text-slate-400">Memuat mata kuliah...</td></tr>
              ) : matakuliahs.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-slate-400">Belum ada mata kuliah</td></tr>
              ) : (
                matakuliahs.map((mk) => (
                  <tr key={mk.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{mk.kode_mk}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{mk.nama}</td>
                    <td className="py-3.5 px-4 text-slate-600">{mk.kurikulum?.nama || '-'}</td>
                    <td className="py-3.5 px-4 tabular-nums">
                      <span className="font-bold">{mk.total_sks} SKS</span>
                      <span className="text-2xs text-slate-400 block font-normal">({mk.sks_teori}T / {mk.sks_praktik}P)</span>
                    </td>
                    <td className="py-3.5 px-4 tabular-nums font-semibold">{mk.semester_anjuran}</td>
                    <td className="py-3.5 px-4">
                      <span className={`badge text-2xs font-bold ${mk.tipe === 'wajib' ? 'badge-blue' : 'badge-purple'}`}>
                        {mk.tipe.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          icon={<Edit3 size={13} />}
                          className="text-2xs py-1 px-2.5 h-auto font-bold"
                          onClick={() => handleOpenModal(mk)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          icon={<Trash2 size={13} className="text-rose-600" />}
                          className="text-2xs py-1 px-2.5 h-auto hover:bg-rose-50"
                          onClick={() => handleDelete(mk.id)}
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

      {/* Modal MK */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <h3 className="text-base font-extrabold text-slate-900">
              {editingMk ? 'Edit Mata Kuliah' : 'Tambah Mata Kuliah Baru'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Tentukan SKS Teori, Praktik, dan semester anjuran mahasiswa.
            </p>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Kurikulum Induk *
                </label>
                <select
                  disabled={Boolean(editingMk)}
                  value={form.kurikulum_id}
                  onChange={(e) => setForm({ ...form, kurikulum_id: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary-500 disabled:bg-slate-100"
                >
                  {kurikulums.map((k) => (
                    <option key={k.id} value={k.id}>{k.kode} - {k.nama}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kode MK *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingMk)}
                    placeholder="IF301"
                    value={form.kode_mk}
                    onChange={(e) => setForm({ ...form, kode_mk: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary-500 font-mono disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Semester Anjuran *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="8"
                    value={form.semester_anjuran}
                    onChange={(e) => setForm({ ...form, semester_anjuran: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Mata Kuliah *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Pemrograman Web & Mobile"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    SKS Teori
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={form.sks_teori}
                    onChange={(e) => setForm({ ...form, sks_teori: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    SKS Praktik
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={form.sks_praktik}
                    onChange={(e) => setForm({ ...form, sks_praktik: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tipe MK
                  </label>
                  <select
                    value={form.tipe}
                    onChange={(e) => setForm({ ...form, tipe: e.target.value })}
                    className="w-full px-2 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary-500"
                  >
                    <option value="wajib">Wajib</option>
                    <option value="pilihan">Pilihan</option>
                    <option value="wajib_prodi">Wajib Prodi</option>
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
                  {saving ? 'Menyimpan...' : 'Simpan Mata Kuliah'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
