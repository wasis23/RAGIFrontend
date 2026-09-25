'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, Trash2, Search } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { siakadService } from '@/services/siakad.service';
import { MkProdiSelect } from '@/components/siakad/MkProdiSelect';
import toast from 'react-hot-toast';

export default function CreateKonversiTransferPage() {
  const router = useRouter();

  const [mahasiswas, setMahasiswas] = useState<any[]>([]);
  const [matakuliahs, setMatakuliahs] = useState<any[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [mhsSearch, setMhsSearch] = useState('');

  const [form, setForm] = useState({
    mahasiswa_id: 1,
    kampus_asal: '',
    prodi_asal: '',
    catatan: '',
    details: [
      { mata_kuliah_diakui_id: 1, kode_mk_asal: '', nama_mk_asal: '', sks_asal: 3, nilai_huruf_asal: 'A' },
    ],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoadingInitial(true);
        const [mRes, mkRes] = await Promise.all([
          siakadService.getMahasiswas({ per_page: 300 }),
          siakadService.getMataKuliahs({ per_page: 300 }),
        ]);

        const mData = mRes.data || [];
        const mkData = mkRes.data || [];

        setMahasiswas(mData);
        setMatakuliahs(mkData);

        if (mData[0]) {
          setForm((f) => ({ ...f, mahasiswa_id: mData[0].id }));
        }
        if (mkData[0]) {
          setForm((f) => ({
            ...f,
            details: [
              {
                mata_kuliah_diakui_id: mkData[0].id,
                kode_mk_asal: '',
                nama_mk_asal: '',
                sks_asal: 3,
                nilai_huruf_asal: 'A',
              },
            ],
          }));
        }
      } catch (err) {
        toast.error('Gagal memuat data referensi mahasiswa / mata kuliah');
      } finally {
        setLoadingInitial(false);
      }
    };

    fetchOptions();
  }, []);

  const handleAddDetail = () => {
    setForm((prev) => ({
      ...prev,
      details: [
        ...prev.details,
        {
          mata_kuliah_diakui_id: matakuliahs[0]?.id || 1,
          kode_mk_asal: '',
          nama_mk_asal: '',
          sks_asal: 3,
          nilai_huruf_asal: 'A',
        },
      ],
    }));
  };

  const handleRemoveDetail = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      details: prev.details.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.mahasiswa_id) {
      toast.error('Pilih mahasiswa penerima konversi terlebih dahulu');
      return;
    }
    if (!form.kampus_asal || !form.prodi_asal) {
      toast.error('Kampus asal dan program studi asal wajib diisi');
      return;
    }
    if (form.details.length === 0) {
      toast.error('Minimal inputkan 1 mata kuliah konversi');
      return;
    }

    try {
      setSaving(true);
      await siakadService.createKonversi(form);
      toast.success('Penyetaraan nilai mahasiswa transfer berhasil disimpan!');
      router.push('/siakad/civitas/konversi');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal menyimpan data konversi');
    } finally {
      setSaving(false);
    }
  };

  const filteredMahasiswas = mahasiswas.filter((m) => {
    if (!mhsSearch) return true;
    const q = mhsSearch.toLowerCase();
    return (
      m.nama_lengkap.toLowerCase().includes(q) ||
      (m.nim && m.nim.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Input Konversi Nilai Mahasiswa Transfer"
        description="Penyetaraan dan mapping mata kuliah mahasiswa pindahan dari perguruan tinggi sebelumnya ke kurikulum aktif."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Konversi Nilai', href: '/siakad/civitas/konversi' },
          { label: 'Input Penyetaraan' },
        ]}
        action={
          <Button
            variant="outline"
            icon={<ArrowLeft size={16} />}
            onClick={() => router.push('/siakad/civitas/konversi')}
            style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
          >
            Kembali
          </Button>
        }
      />

      <div className="card p-6 bg-white border border-slate-200 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-sm text-slate-900">1. Mahasiswa & Asal Perguruan Tinggi</h3>
            <p className="text-2xs text-slate-500">Pilih mahasiswa pindahan dan identitas kampus tempat studi sebelumnya.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-3">
              <label className="label">Pilih Mahasiswa Penerima Konversi *</label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  placeholder="Ketik untuk memfilter nama / NIM mahasiswa..."
                  value={mhsSearch}
                  onChange={(e) => setMhsSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-primary-500 transition outline-none"
                />
              </div>

              <select
                value={form.mahasiswa_id}
                onChange={(e) => setForm({ ...form, mahasiswa_id: parseInt(e.target.value) })}
                className="select w-full"
                required
              >
                {filteredMahasiswas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nama_lengkap} ({m.nim || 'Belum ada NIM'}) • {m.program_studi?.nama || 'Prodi'} • Angkatan {m.angkatan}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Perguruan Tinggi / Kampus Asal *"
              required
              placeholder="Contoh: Universitas Gadjah Mada"
              value={form.kampus_asal}
              onChange={(e) => setForm({ ...form, kampus_asal: e.target.value })}
            />

            <Input
              label="Program Studi Asal *"
              required
              placeholder="Contoh: D3 Teknik Informatika"
              value={form.prodi_asal}
              onChange={(e) => setForm({ ...form, prodi_asal: e.target.value })}
            />

            <Input
              label="Catatan / Nomor SK Penyetaraan"
              placeholder="Contoh: SK Rektor No. 12/SK-KONV/2026"
              value={form.catatan}
              onChange={(e) => setForm({ ...form, catatan: e.target.value })}
            />
          </div>

          <div className="border-b border-slate-100 pb-3 pt-2 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">2. Rincian Mata Kuliah yang Diakui</h3>
              <p className="text-2xs text-slate-500">Mata kuliah dari kampus asal yang disetarakan dengan mata kuliah kurikulum lokal.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              icon={<Plus size={14} />}
              onClick={handleAddDetail}
              className="text-xs font-bold"
            >
              Tambah Baris MK
            </Button>
          </div>

          <div className="space-y-4">
            {form.details.map((detail, idx) => (
              <div key={idx} className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    Baris #{idx + 1}
                  </span>
                  {form.details.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 size={14} className="text-rose-500" />}
                      className="text-xs text-rose-600 hover:bg-rose-50"
                      onClick={() => handleRemoveDetail(idx)}
                    >
                      Hapus
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                  <Input
                    label="Kode MK Asal *"
                    required
                    placeholder="CS101"
                    value={detail.kode_mk_asal}
                    onChange={(e) => {
                      const d = [...form.details];
                      d[idx].kode_mk_asal = e.target.value;
                      setForm({ ...form, details: d });
                    }}
                  />

                  <Input
                    label="Nama MK Asal *"
                    required
                    placeholder="Dasar Pemrograman"
                    value={detail.nama_mk_asal}
                    onChange={(e) => {
                      const d = [...form.details];
                      d[idx].nama_mk_asal = e.target.value;
                      setForm({ ...form, details: d });
                    }}
                  />

                  <Input
                    label="SKS Asal *"
                    type="number"
                    required
                    min={1}
                    value={detail.sks_asal}
                    onChange={(e) => {
                      const d = [...form.details];
                      d[idx].sks_asal = parseInt(e.target.value) || 3;
                      setForm({ ...form, details: d });
                    }}
                  />

                  <Input
                    label="Nilai Huruf Asal *"
                    required
                    placeholder="A / B+"
                    value={detail.nilai_huruf_asal}
                    onChange={(e) => {
                      const d = [...form.details];
                      d[idx].nilai_huruf_asal = e.target.value;
                      setForm({ ...form, details: d });
                    }}
                  />

                  <MkProdiSelect
                    value={detail.mata_kuliah_diakui_id}
                    onChange={(id) => {
                      const d = [...form.details];
                      d[idx].mata_kuliah_diakui_id = id;
                      setForm({ ...form, details: d });
                    }}
                    matakuliahs={matakuliahs}
                    required
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/siakad/civitas/konversi')}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={<Save size={16} />}
              loading={saving}
              disabled={saving || loadingInitial}
            >
              {saving ? 'Menyimpan...' : 'Simpan Konversi Transfer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
