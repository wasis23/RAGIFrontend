'use client';

import { useState, useEffect } from 'react';
import { FileSpreadsheet, Plus, CheckCircle2, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

export default function KonversiTransferPage() {
  const [konversis, setKonversis] = useState<any[]>([]);
  const [mahasiswas, setMahasiswas] = useState<any[]>([]);
  const [matakuliahs, setMatakuliahs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMhsFilter, setSelectedMhsFilter] = useState('');
  const [mhsSearchModal, setMhsSearchModal] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    mahasiswa_id: 1,
    kampus_asal: '',
    prodi_asal: '',
    catatan: '',
    details: [
      { mata_kuliah_diakui_id: 1, kode_mk_asal: '', nama_mk_asal: '', sks_asal: 3, nilai_huruf_asal: 'A' }
    ]
  });
  const [saving, setSaving] = useState(false);

  const fetchOptions = async () => {
    try {
      const [mRes, mkRes] = await Promise.all([
        siakadService.getMahasiswas({ per_page: 200 }),
        siakadService.getMataKuliahs({ per_page: 200 })
      ]);
      if (mRes.data) {
        setMahasiswas(mRes.data);
        if (mRes.data.length > 0) setForm(f => ({ ...f, mahasiswa_id: mRes.data[0].id }));
      }
      if (mkRes.data) {
        setMatakuliahs(mkRes.data);
        if (mkRes.data.length > 0) {
          setForm(f => ({
            ...f,
            details: [{ mata_kuliah_diakui_id: mkRes.data[0].id, kode_mk_asal: '', nama_mk_asal: '', sks_asal: 3, nilai_huruf_asal: 'A' }]
          }));
        }
      }
    } catch (err) {}
  };

  const fetchKonversi = async () => {
    try {
      setLoading(true);
      const res = await siakadService.getKonversis({
        search,
        mahasiswa_id: selectedMhsFilter || undefined,
      });
      if (res.data) setKonversis(res.data);
    } catch (err: any) {
      toast.error('Gagal memuat data konversi transfer');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    fetchKonversi();
  }, [search, selectedMhsFilter]);

  const handleAddDetail = () => {
    setForm({
      ...form,
      details: [
        ...form.details,
        { mata_kuliah_diakui_id: matakuliahs[0]?.id || 1, kode_mk_asal: '', nama_mk_asal: '', sks_asal: 3, nilai_huruf_asal: 'A' }
      ]
    });
  };

  const handleRemoveDetail = (idx: number) => {
    const updated = [...form.details];
    updated.splice(idx, 1);
    setForm({ ...form, details: updated });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await siakadService.createKonversi(form);
      toast.success('Konversi transfer mahasiswa berhasil disimpan');
      setIsModalOpen(false);
      fetchKonversi();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal menyimpan konversi transfer');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus data konversi transfer ini?')) return;
    try {
      await siakadService.deleteKonversi(id);
      toast.success('Konversi transfer berhasil dihapus');
      fetchKonversi();
    } catch (err: any) {
      toast.error('Gagal menghapus konversi transfer');
    }
  };

  const selectedMhsObj = mahasiswas.find((m) => m.id === form.mahasiswa_id);

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <PageHeader
        title="Konversi Nilai Mahasiswa Transfer"
        description="Penyetaraan dan mapping mata kuliah mahasiswa pindahan dari perguruan tinggi sebelumnya."
        action={
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            className="font-bold min-h-[40px]"
            onClick={() => {
              setMhsSearchModal('');
              setIsModalOpen(true);
            }}
          >
            Input Konversi Transfer
          </Button>
        }
      />

      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
        {/* Search & Filter Toolbar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-2">
            <input
              type="text"
              placeholder="Cari NIM, nama mahasiswa, atau kampus asal..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-primary-500 transition outline-none font-medium"
            />
          </div>

          <select
            value={selectedMhsFilter}
            onChange={(e) => setSelectedMhsFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none font-semibold text-slate-700"
          >
            <option value="">Semua Mahasiswa Transfer</option>
            {mahasiswas.map((m) => (
              <option key={m.id} value={m.id}>{m.nim} - {m.nama_lengkap}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-y border-slate-200">
              <tr>
                <th className="py-3 px-4">NO TRANSAKSI</th>
                <th className="py-3 px-4">MAHASISWA</th>
                <th className="py-3 px-4">KAMPUS & PRODI ASAL</th>
                <th className="py-3 px-4">PENYETARAAN MK DIAKUI</th>
                <th className="py-3 px-4 text-center">TOTAL SKS DIAKUI</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr><td colSpan={6} className="py-8 text-center text-slate-400">Memuat data konversi...</td></tr>
              ) : konversis.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-slate-400">Belum ada riwayat konversi transfer</td></tr>
              ) : (
                konversis.map((knv) => (
                  <tr key={knv.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{knv.no_transaksi}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900">{knv.mahasiswa?.nama_lengkap}</span>
                      <span className="block font-mono text-2xs text-slate-400 mt-0.5">{knv.mahasiswa?.nim}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-800">{knv.kampus_asal}</span>
                      <span className="block text-2xs text-slate-500 mt-0.5">{knv.prodi_asal}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        {knv.details?.map((d: any) => (
                          <div key={d.id} className="text-2xs flex items-center gap-1.5 font-medium">
                            <span className="font-mono bg-slate-100 px-1 py-0.5 rounded">{d.kode_mk_asal} ({d.nilai_huruf_asal})</span>
                            <span>→</span>
                            <span className="font-bold text-primary-700">{d.mata_kuliah_diakui?.nama} ({d.mata_kuliah_diakui?.total_sks} SKS)</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="badge badge-green text-2xs font-bold inline-flex items-center gap-1">
                        <CheckCircle2 size={11} /> {knv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="outline"
                        icon={<Trash2 size={13} className="text-rose-600" />}
                        className="text-2xs py-1 px-2.5 h-auto hover:bg-rose-50"
                        onClick={() => handleDelete(knv.id)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Konversi */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-extrabold text-slate-900">Form Konversi Nilai Mahasiswa Transfer</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Penyetaraan mata kuliah mahasiswa pindahan ke kurikulum aktif.
            </p>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  1. Cari & Pilih Mahasiswa Transfer *
                </label>
                <div className="relative mb-2">
                  <input
                    type="text"
                    placeholder="Ketik untuk mencari NIM atau nama mahasiswa..."
                    value={mhsSearchModal}
                    onChange={(e) => setMhsSearchModal(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-primary-500 transition outline-none font-medium"
                  />
                </div>
                <select
                  value={form.mahasiswa_id}
                  onChange={(e) => setForm({ ...form, mahasiswa_id: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-primary-500"
                >
                  {mahasiswas
                    .filter((m) =>
                      !mhsSearchModal ||
                      m.nama_lengkap.toLowerCase().includes(mhsSearchModal.toLowerCase()) ||
                      m.nim.toLowerCase().includes(mhsSearchModal.toLowerCase())
                    )
                    .map((m) => (
                      <option key={m.id} value={m.id}>{m.nim} - {m.nama_lengkap} ({m.program_studi?.nama || 'S1'})</option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kampus Asal *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Universitas Nusantara"
                    value={form.kampus_asal}
                    onChange={(e) => setForm({ ...form, kampus_asal: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Prodi Asal *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Teknik Komputer"
                    value={form.prodi_asal}
                    onChange={(e) => setForm({ ...form, prodi_asal: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Detail Matakuliah */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase">Mata Kuliah yang Diakui</h4>
                  <button
                    type="button"
                    onClick={handleAddDetail}
                    className="text-xs font-bold text-primary-600 hover:underline"
                  >
                    + Tambah Baris
                  </button>
                </div>

                {form.details.map((detail, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative">
                    {form.details.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDetail(idx)}
                        className="absolute right-3 top-3 text-rose-500 text-xs font-bold"
                      >
                        Hapus
                      </button>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-2xs font-semibold text-slate-600 mb-0.5">Kode MK Asal</label>
                        <input
                          type="text"
                          required
                          placeholder="CS101"
                          value={detail.kode_mk_asal}
                          onChange={(e) => {
                            const d = [...form.details];
                            d[idx].kode_mk_asal = e.target.value;
                            setForm({ ...form, details: d });
                          }}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-2xs font-semibold text-slate-600 mb-0.5">Nama MK Asal</label>
                        <input
                          type="text"
                          required
                          placeholder="Dasar Pemrograman"
                          value={detail.nama_mk_asal}
                          onChange={(e) => {
                            const d = [...form.details];
                            d[idx].nama_mk_asal = e.target.value;
                            setForm({ ...form, details: d });
                          }}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-2xs font-semibold text-slate-600 mb-0.5">SKS Asal</label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={detail.sks_asal}
                          onChange={(e) => {
                            const d = [...form.details];
                            d[idx].sks_asal = parseInt(e.target.value) || 3;
                            setForm({ ...form, details: d });
                          }}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-2xs font-semibold text-slate-600 mb-0.5">Nilai Huruf</label>
                        <input
                          type="text"
                          required
                          placeholder="A / B+"
                          value={detail.nilai_huruf_asal}
                          onChange={(e) => {
                            const d = [...form.details];
                            d[idx].nilai_huruf_asal = e.target.value;
                            setForm({ ...form, details: d });
                          }}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-2xs font-semibold text-slate-600 mb-0.5">Disetarakan Ke MK</label>
                        <select
                          value={detail.mata_kuliah_diakui_id}
                          onChange={(e) => {
                            const d = [...form.details];
                            d[idx].mata_kuliah_diakui_id = parseInt(e.target.value);
                            setForm({ ...form, details: d });
                          }}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                        >
                          {matakuliahs.map((mk) => (
                            <option key={mk.id} value={mk.id}>{mk.kode_mk} - {mk.nama}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
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
                  {saving ? 'Menyimpan...' : 'Simpan Konversi'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
