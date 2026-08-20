'use client';

import { useState, useEffect } from 'react';
import { Layers, Plus, Search, Edit3, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

export default function KurikulumPage() {
  const [kurikulums, setKurikulums] = useState<any[]>([]);
  const [prodis, setProdis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKurikulum, setEditingKurikulum] = useState<any | null>(null);
  const [form, setForm] = useState({
    kode: '',
    nama: '',
    program_studi_id: 1,
    tahun_berlaku: 2024,
    total_sks_lulus: 144,
    deskripsi: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchProdis = async () => {
    try {
      const res = await siakadService.getProdi();
      if (res.data) setProdis(res.data);
    } catch (err) {}
  };

  const fetchKurikulum = async () => {
    try {
      setLoading(true);
      const res = await siakadService.getKurikulums({ search });
      if (res.data) setKurikulums(res.data);
    } catch (err: any) {
      toast.error('Gagal memuat kurikulum');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProdis();
  }, []);

  useEffect(() => {
    fetchKurikulum();
  }, [search]);

  const handleOpenModal = (item?: any) => {
    if (item) {
      setEditingKurikulum(item);
      setForm({
        kode: item.kode,
        nama: item.nama,
        program_studi_id: item.program_studi_id,
        tahun_berlaku: item.tahun_berlaku,
        total_sks_lulus: item.total_sks_lulus,
        deskripsi: item.deskripsi || '',
      });
    } else {
      setEditingKurikulum(null);
      setForm({
        kode: '',
        nama: '',
        program_studi_id: prodis[0]?.id || 1,
        tahun_berlaku: 2024,
        total_sks_lulus: 144,
        deskripsi: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editingKurikulum) {
        await siakadService.updateKurikulum(editingKurikulum.id, form);
        toast.success('Kurikulum berhasil diperbarui');
      } else {
        await siakadService.createKurikulum(form);
        toast.success('Kurikulum baru berhasil dibuat');
      }
      setIsModalOpen(false);
      fetchKurikulum();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal menyimpan kurikulum');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus kurikulum ini?')) return;
    try {
      await siakadService.deleteKurikulum(id);
      toast.success('Kurikulum berhasil dihapus');
      fetchKurikulum();
    } catch (err: any) {
      toast.error('Gagal menghapus kurikulum');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <PageHeader
        title="Kurikulum Akademik"
        description="Struktur kurikulum OBE, penetapan total SKS kelulusan, dan masa berlaku kurikulum."
        action={
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            className="font-bold min-h-[40px]"
            onClick={() => handleOpenModal()}
          >
            Tambah Kurikulum
          </Button>
        }
      />

      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Cari kode atau nama kurikulum..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-primary-500 transition outline-none"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-y border-slate-200">
              <tr>
                <th className="py-3 px-4">KODE</th>
                <th className="py-3 px-4">NAMA KURIKULUM</th>
                <th className="py-3 px-4">PROGRAM STUDI</th>
                <th className="py-3 px-4">TAHUN BERLAKU</th>
                <th className="py-3 px-4">TOTAL SKS LULUS</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr><td colSpan={7} className="py-8 text-center text-slate-400">Memuat data kurikulum...</td></tr>
              ) : kurikulums.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-slate-400">Belum ada kurikulum</td></tr>
              ) : (
                kurikulums.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{k.kode}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900">{k.nama}</span>
                      <p className="text-2xs text-slate-400 mt-0.5">{k.deskripsi}</p>
                    </td>
                    <td className="py-3.5 px-4">{k.program_studi?.nama || '-'}</td>
                    <td className="py-3.5 px-4 tabular-nums font-semibold">{k.tahun_berlaku}</td>
                    <td className="py-3.5 px-4 tabular-nums font-bold text-slate-900">{k.total_sks_lulus} SKS</td>
                    <td className="py-3.5 px-4">
                      <span className="badge badge-green text-2xs font-bold">Aktif</span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          icon={<Edit3 size={13} />}
                          className="text-2xs py-1 px-2.5 h-auto font-bold"
                          onClick={() => handleOpenModal(k)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          icon={<Trash2 size={13} className="text-rose-600" />}
                          className="text-2xs py-1 px-2.5 h-auto hover:bg-rose-50"
                          onClick={() => handleDelete(k.id)}
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

      {/* Modal Kurikulum */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <h3 className="text-base font-extrabold text-slate-900">
              {editingKurikulum ? 'Edit Kurikulum' : 'Tambah Kurikulum Baru'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Definisikan kode kurikulum, total SKS kelulusan, dan prodi pengampu.
            </p>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Kode Kurikulum *
                </label>
                <input
                  type="text"
                  required
                  disabled={Boolean(editingKurikulum)}
                  placeholder="KUR-2024-IF"
                  value={form.kode}
                  onChange={(e) => setForm({ ...form, kode: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary-500 font-mono disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Kurikulum *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Kurikulum OBE Informatika 2024"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Program Studi *
                  </label>
                  <select
                    disabled={Boolean(editingKurikulum)}
                    value={form.program_studi_id}
                    onChange={(e) => setForm({ ...form, program_studi_id: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary-500 disabled:bg-slate-100"
                  >
                    {prodis.map((p) => (
                      <option key={p.id} value={p.id}>{p.nama}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tahun Berlaku *
                  </label>
                  <input
                    type="number"
                    required
                    value={form.tahun_berlaku}
                    onChange={(e) => setForm({ ...form, tahun_berlaku: parseInt(e.target.value) || 2024 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Total SKS Kelulusan *
                </label>
                <input
                  type="number"
                  required
                  min="100"
                  value={form.total_sks_lulus}
                  onChange={(e) => setForm({ ...form, total_sks_lulus: parseInt(e.target.value) || 144 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Deskripsi
                </label>
                <textarea
                  rows={2}
                  value={form.deskripsi}
                  onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                  placeholder="Keterangan kurikulum..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary-500"
                />
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
                  {saving ? 'Menyimpan...' : 'Simpan Kurikulum'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
