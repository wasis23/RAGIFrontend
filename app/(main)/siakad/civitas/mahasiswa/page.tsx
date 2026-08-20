'use client';

import { useState, useEffect } from 'react';
import { GraduationCap, Plus, Search, Edit3, Trash2, RefreshCw, Sparkles, UserCheck } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

export default function MahasiswaPage() {
  const [mahasiswas, setMahasiswas] = useState<any[]>([]);
  const [prodis, setProdis] = useState<any[]>([]);
  const [dosens, setDosens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterProdi, setFilterProdi] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDosenPa, setFilterDosenPa] = useState('');
  const [filterNim, setFilterNim] = useState('');

  // Bulk PA Assignment State
  const [selectedMhsIds, setSelectedMhsIds] = useState<number[]>([]);
  const [isBulkPaModalOpen, setIsBulkPaModalOpen] = useState(false);
  const [selectedBulkDosenId, setSelectedBulkDosenId] = useState<number | ''>('');
  const [assigningPa, setAssigningPa] = useState(false);

  // Sync & Generate NIM States
  const [syncingSpmb, setSyncingSpmb] = useState(false);
  const [generatingNims, setGeneratingNims] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMhs, setEditingMhs] = useState<any | null>(null);
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
        siakadService.getDosens({ per_page: 100 })
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
        search,
        program_studi_id: filterProdi,
        status: filterStatus
      });
      if (res.data) {
        let list = res.data;
        if (filterDosenPa === 'unassigned') {
          list = list.filter((m: any) => !m.dosen_wali_id);
        } else if (filterDosenPa) {
          list = list.filter((m: any) => String(m.dosen_wali_id) === String(filterDosenPa));
        }

        if (filterNim === 'unassigned') {
          list = list.filter((m: any) => !m.nim || m.nim === '');
        } else if (filterNim === 'assigned') {
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
  }, [search, filterProdi, filterStatus, filterDosenPa, filterNim]);

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

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedMhsIds(mahasiswas.map((m) => m.id));
    } else {
      setSelectedMhsIds([]);
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedMhsIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkAssignPa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBulkDosenId || selectedMhsIds.length === 0) return;
    try {
      setAssigningPa(true);
      const res = await siakadService.bulkAssignPa({
        mahasiswa_ids: selectedMhsIds,
        dosen_wali_id: Number(selectedBulkDosenId)
      });
      toast.success(res.message || 'Dosen PA berhasil ditetapkan');
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
        nim: item.nim,
        nik: item.nik || '',
        program_studi_id: item.program_studi_id,
        angkatan: item.angkatan,
        jenis_kelamin: item.jenis_kelamin,
        status: item.status,
        dosen_wali_id: item.dosen_wali_id || '',
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

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus mahasiswa ini?')) return;
    try {
      await siakadService.deleteMahasiswa(id);
      toast.success('Mahasiswa berhasil dihapus');
      fetchMahasiswa();
    } catch (err: any) {
      toast.error('Gagal menghapus mahasiswa');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <PageHeader
        title="Manajemen Mahasiswa & Dosen PA"
        description="Data mahasiswa aktif, integrasi SPMB, penomoran NIM otomatis, dan plotting Dosen Pembimbing Akademik."
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              icon={<RefreshCw size={15} className={`text-emerald-600 ${syncingSpmb ? 'animate-spin' : ''}`} />}
              className="font-bold min-h-[40px] border-emerald-200 text-emerald-800 hover:bg-emerald-50"
              onClick={handleSyncSpmb}
              disabled={syncingSpmb}
            >
              {syncingSpmb ? 'Menyinkronkan...' : 'Tarik dari SPMB'}
            </Button>
            <Button
              variant="outline"
              icon={<Sparkles size={15} className="text-amber-600" />}
              className="font-bold min-h-[40px] border-amber-200 text-amber-800 hover:bg-amber-50"
              onClick={handleGenerateMissingNims}
              disabled={generatingNims}
            >
              {generatingNims ? 'Memproses...' : 'Generate NIM (Bagi yang Belum Ada)'}
            </Button>
            <Button
              variant="outline"
              icon={<GraduationCap size={16} className="text-primary-600" />}
              className="font-bold min-h-[40px] border-primary-200 text-primary-700 hover:bg-primary-50"
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
              variant="primary"
              icon={<Plus size={16} />}
              className="font-bold min-h-[40px]"
              onClick={() => handleOpenModal()}
            >
              Tambah Manual
            </Button>
          </div>
        }
      />

      {/* Floating Action Bar jika ada mahasiswa yang dicentang */}
      {selectedMhsIds.length > 0 && (
        <div className="bg-primary-900 text-white rounded-2xl p-4 flex items-center justify-between shadow-xl animate-fade-in border border-primary-700">
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

      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div className="relative md:col-span-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari NIM, NIK, atau Nama..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-primary-500 transition outline-none"
            />
          </div>

          <select
            value={filterProdi}
            onChange={(e) => setFilterProdi(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none font-semibold text-slate-700"
          >
            <option value="">Semua Program Studi</option>
            {prodis.map((p) => (
              <option key={p.id} value={p.id}>{p.nama}</option>
            ))}
          </select>

          <select
            value={filterNim}
            onChange={(e) => setFilterNim(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none font-semibold text-slate-700"
          >
            <option value="">Semua Status NIM</option>
            <option value="unassigned">⚠️ Belum Memiliki NIM</option>
            <option value="assigned">✓ Sudah Memiliki NIM</option>
          </select>

          <select
            value={filterDosenPa}
            onChange={(e) => setFilterDosenPa(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none font-semibold text-slate-700"
          >
            <option value="">Semua Dosen PA (Wali)</option>
            <option value="unassigned">⚠️ Belum Memiliki Dosen PA</option>
            {dosens.map((d) => (
              <option key={d.id} value={d.id}>PA: {d.nama_lengkap}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none font-semibold text-slate-700"
          >
            <option value="">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="cuti">Cuti</option>
            <option value="mangkir">Mangkir</option>
            <option value="lulus">Lulus</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-y border-slate-200">
              <tr>
                <th className="py-3 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={mahasiswas.length > 0 && selectedMhsIds.length === mahasiswas.length}
                    className="rounded text-primary-600 focus:ring-primary-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">NIM</th>
                <th className="py-3 px-4">NAMA LENGKAP</th>
                <th className="py-3 px-4">PROGRAM STUDI</th>
                <th className="py-3 px-4">ANGKATAN</th>
                <th className="py-3 px-4">DOSEN PEMBIMBING AKADEMIK (PA)</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr><td colSpan={8} className="py-8 text-center text-slate-400">Memuat data mahasiswa...</td></tr>
              ) : mahasiswas.length === 0 ? (
                <tr><td colSpan={8} className="py-8 text-center text-slate-400">Tidak ada data mahasiswa yang sesuai</td></tr>
              ) : (
                mahasiswas.map((mhs) => {
                  const isSelected = selectedMhsIds.includes(mhs.id);
                  return (
                    <tr key={mhs.id} className={`transition ${isSelected ? 'bg-primary-50/60' : 'hover:bg-slate-50/80'}`}>
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(mhs.id)}
                          className="rounded text-primary-600 focus:ring-primary-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        {mhs.nim ? (
                          <span className="font-bold text-slate-900">{mhs.nim}</span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="badge badge-yellow text-2xs font-bold">Belum Ada NIM</span>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await siakadService.generateNim({
                                    id: mhs.id,
                                    nama_lengkap: mhs.nama_lengkap,
                                    program_studi_id: mhs.program_studi_id,
                                    angkatan: mhs.angkatan,
                                    jenis_kelamin: mhs.jenis_kelamin,
                                  });
                                  toast.success(`NIM berhasil di-generate untuk ${mhs.nama_lengkap}`);
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
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900">{mhs.nama_lengkap}</span>
                        {mhs.konversi_id && (
                          <span className="badge badge-purple text-2xs ml-2 font-bold">Transfer</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">{mhs.program_studi?.nama || '-'}</td>
                      <td className="py-3.5 px-4 tabular-nums font-mono">{mhs.angkatan}</td>
                      <td className="py-3.5 px-4">
                        {mhs.dosen_wali ? (
                          <span className="font-bold text-primary-800 bg-primary-50 px-2 py-1 rounded-lg border border-primary-200">
                            {mhs.dosen_wali.nama_lengkap}
                          </span>
                        ) : (
                          <span className="text-2xs text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 font-bold">
                            Belum Ada Dosen PA
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`badge text-2xs font-bold ${mhs.status === 'aktif' ? 'badge-green' : 'badge-yellow'}`}>
                          {mhs.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            icon={<Edit3 size={13} />}
                            className="text-2xs py-1 px-2.5 h-auto font-bold"
                            onClick={() => handleOpenModal(mhs)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            icon={<Trash2 size={13} className="text-rose-600" />}
                            className="text-2xs py-1 px-2.5 h-auto hover:bg-rose-50"
                            onClick={() => handleDelete(mhs.id)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Plotting Dosen PA Massal */}
      {isBulkPaModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <h3 className="text-base font-extrabold text-slate-900">Plotting Dosen Pembimbing Akademik (PA)</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Pilih Dosen PA yang akan membimbing <strong>{selectedMhsIds.length} mahasiswa</strong> terpilih.
            </p>

            <form onSubmit={handleBulkAssignPa} className="space-y-4">
              <div>
                <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Pilih Dosen Pembimbing Akademik (PA) *
                </label>
                <select
                  required
                  value={selectedBulkDosenId}
                  onChange={(e) => setSelectedBulkDosenId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-primary-500"
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

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  className="text-xs"
                  onClick={() => setIsBulkPaModalOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={assigningPa}
                  className="text-xs font-bold"
                >
                  {assigningPa ? 'Menyimpan...' : `Tetapkan untuk ${selectedMhsIds.length} Mahasiswa`}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Mahasiswa */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <h3 className="text-base font-extrabold text-slate-900">
              {editingMhs ? 'Edit Mahasiswa' : 'Tambah Mahasiswa / Generate NIM'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              {editingMhs ? 'Perbarui data profil mahasiswa.' : 'Kosongkan NIM jika ingin sistem generate otomatis.'}
            </p>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ahmad Fauzi"
                  value={form.nama_lengkap}
                  onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    NIM (Auto jika kosong)
                  </label>
                  <input
                    type="text"
                    disabled={Boolean(editingMhs)}
                    placeholder="Kosong = Auto"
                    value={form.nim}
                    onChange={(e) => setForm({ ...form, nim: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary-500 font-mono disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Program Studi *
                  </label>
                  <select
                    disabled={Boolean(editingMhs)}
                    value={form.program_studi_id}
                    onChange={(e) => setForm({ ...form, program_studi_id: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary-500 disabled:bg-slate-100"
                  >
                    {prodis.map((p) => (
                      <option key={p.id} value={p.id}>{p.nama}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Angkatan *
                  </label>
                  <input
                    type="number"
                    required
                    value={form.angkatan}
                    onChange={(e) => setForm({ ...form, angkatan: parseInt(e.target.value) || 2025 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Jenis Kelamin *
                  </label>
                  <select
                    value={form.jenis_kelamin}
                    onChange={(e) => setForm({ ...form, jenis_kelamin: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary-500"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>

              {editingMhs && (
                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Status Mahasiswa
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary-500"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="cuti">Cuti</option>
                    <option value="mangkir">Mangkir</option>
                    <option value="lulus">Lulus</option>
                  </select>
                </div>
              )}

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
                  {saving ? 'Menyimpan...' : 'Simpan Mahasiswa'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
