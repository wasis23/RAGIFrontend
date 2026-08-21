'use client';

import { useState, useEffect } from 'react';
import { FileSpreadsheet, Plus, Filter, Trash2, CheckCircle2 } from 'lucide-react';
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

export default function KonversiTransferPage() {
  const [konversis, setKonversis] = useState<any[]>([]);
  const [mahasiswas, setMahasiswas] = useState<any[]>([]);
  const [matakuliahs, setMatakuliahs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter Drawer States
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterMhsId, setFilterMhsId] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    mhsId: '',
  });

  const [mhsSearchModal, setMhsSearchModal] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingKonversi, setDeletingKonversi] = useState<any | null>(null);
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

  const fetchOptions = async () => {
    try {
      const [mRes, mkRes] = await Promise.all([
        siakadService.getMahasiswas({ per_page: 200 }),
        siakadService.getMataKuliahs({ per_page: 200 }),
      ]);
      if (mRes.data) {
        setMahasiswas(mRes.data);
        if (mRes.data.length > 0) setForm((f) => ({ ...f, mahasiswa_id: mRes.data[0].id }));
      }
      if (mkRes.data) {
        setMatakuliahs(mkRes.data);
        if (mkRes.data.length > 0) {
          setForm((f) => ({
            ...f,
            details: [
              {
                mata_kuliah_diakui_id: mkRes.data[0].id,
                kode_mk_asal: '',
                nama_mk_asal: '',
                sks_asal: 3,
                nilai_huruf_asal: 'A',
              },
            ],
          }));
        }
      }
    } catch (err) {}
  };

  const fetchKonversi = async () => {
    try {
      setLoading(true);
      const res = await siakadService.getKonversis({
        search: appliedFilters.search,
        mahasiswa_id: appliedFilters.mhsId || undefined,
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
  }, [appliedFilters]);

  const handleAddDetail = () => {
    setForm({
      ...form,
      details: [
        ...form.details,
        {
          mata_kuliah_diakui_id: matakuliahs[0]?.id || 1,
          kode_mk_asal: '',
          nama_mk_asal: '',
          sks_asal: 3,
          nilai_huruf_asal: 'A',
        },
      ],
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

  const handleDelete = async () => {
    if (!deletingKonversi) return;
    try {
      await siakadService.deleteKonversi(deletingKonversi.id);
      toast.success('Konversi transfer berhasil dihapus');
      setDeletingKonversi(null);
      fetchKonversi();
    } catch (err: any) {
      toast.error('Gagal menghapus konversi transfer');
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      key: 'no_transaksi',
      label: 'NO TRANSAKSI',
      render: (row) => (
        <span className="font-mono font-bold text-slate-900 text-xs">
          {row.no_transaksi}
        </span>
      ),
    },
    {
      key: 'mahasiswa',
      label: 'MAHASISWA TRANSFER',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 text-sm block">
            {row.mahasiswa?.nama_lengkap}
          </span>
          <span className="font-mono text-2xs text-slate-400">
            NIM: {row.mahasiswa?.nim || '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'kampus_asal',
      label: 'KAMPUS & PRODI ASAL',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-800 text-xs block">
            {row.kampus_asal}
          </span>
          <span className="text-2xs text-slate-500">
            Prodi: {row.prodi_asal}
          </span>
        </div>
      ),
    },
    {
      key: 'penyetaraan',
      label: 'PENYETARAAN MK DIAKUI',
      render: (row) => (
        <div className="space-y-1 py-1">
          {row.details?.map((d: any) => (
            <div key={d.id} className="text-2xs flex items-center gap-1.5 font-medium">
              <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                {d.kode_mk_asal} ({d.nilai_huruf_asal})
              </span>
              <span className="text-slate-400">→</span>
              <span className="font-bold text-primary-700">
                {d.mata_kuliah_diakui?.nama} ({d.mata_kuliah_diakui?.total_sks} SKS)
              </span>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      align: 'center',
      render: (row) => (
        <Badge variant="green" className="inline-flex items-center gap-1">
          <CheckCircle2 size={12} /> {row.status}
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
                label: 'Hapus Riwayat Konversi',
                icon: <Trash2 size={14} />,
                variant: 'danger',
                onClick: () => setDeletingKonversi(row),
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
        title="Konversi Nilai Mahasiswa Transfer"
        description="Penyetaraan dan mapping mata kuliah mahasiswa pindahan dari perguruan tinggi sebelumnya."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Konversi Transfer' },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => {
                setMhsSearchModal('');
                setIsModalOpen(true);
              }}
            >
              Input Konversi Transfer
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

      {/* Full-bleed DataTable Card */}
      <DataTable
        columns={columns}
        data={konversis}
        isLoading={loading}
        emptyMessage="Belum ada riwayat konversi transfer mahasiswa."
      />

      {/* Filter Drawer */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Konversi Transfer"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setFilterSearch('');
                setFilterMhsId('');
                setAppliedFilters({ search: '', mhsId: '' });
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
                  mhsId: filterMhsId,
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
            label="NIM, Nama, atau Kampus Asal"
            placeholder="Ketik kata kunci pencarian..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />

          <div>
            <label className="label">Pilih Mahasiswa</label>
            <select
              value={filterMhsId}
              onChange={(e) => setFilterMhsId(e.target.value)}
              className="select w-full"
            >
              <option value="">Semua Mahasiswa Transfer</option>
              {mahasiswas.map((m) => (
                <option key={m.id} value={m.id.toString()}>
                  {m.nim || 'Tanpa NIM'} - {m.nama_lengkap}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Drawer>

      {/* Modal Form Konversi */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Form Konversi Nilai Mahasiswa Transfer"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Konversi'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <label className="label">1. Pilih Mahasiswa Transfer *</label>
            <div className="relative mb-2">
              <Input
                placeholder="Ketik untuk memfilter nama / NIM mahasiswa..."
                value={mhsSearchModal}
                onChange={(e) => setMhsSearchModal(e.target.value)}
              />
            </div>
            <select
              value={form.mahasiswa_id}
              onChange={(e) => setForm({ ...form, mahasiswa_id: parseInt(e.target.value) })}
              className="select w-full font-semibold"
            >
              {mahasiswas
                .filter(
                  (m) =>
                    !mhsSearchModal ||
                    m.nama_lengkap.toLowerCase().includes(mhsSearchModal.toLowerCase()) ||
                    (m.nim && m.nim.toLowerCase().includes(mhsSearchModal.toLowerCase()))
                )
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nim || 'Belum ada NIM'} - {m.nama_lengkap} ({m.program_studi?.nama || 'S1'})
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="Perguruan Tinggi / Kampus Asal *"
              required
              placeholder="Contoh: Universitas Nusantara"
              value={form.kampus_asal}
              onChange={(e) => setForm({ ...form, kampus_asal: e.target.value })}
            />

            <Input
              label="Program Studi Asal *"
              required
              placeholder="Contoh: Teknik Komputer"
              value={form.prodi_asal}
              onChange={(e) => setForm({ ...form, prodi_asal: e.target.value })}
            />
          </div>

          {/* Detail Matakuliah */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase">Mata Kuliah yang Diakui</h4>
              <button
                type="button"
                onClick={handleAddDetail}
                className="text-xs font-bold text-primary-600 hover:underline cursor-pointer"
              >
                + Tambah Baris Mata Kuliah
              </button>
            </div>

            {form.details.map((detail, idx) => (
              <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 relative">
                {form.details.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveDetail(idx)}
                    className="absolute right-3 top-3 text-rose-500 text-xs font-bold hover:underline cursor-pointer"
                  >
                    Hapus
                  </button>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Kode MK Asal"
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
                    label="Nama MK Asal"
                    required
                    placeholder="Dasar Pemrograman"
                    value={detail.nama_mk_asal}
                    onChange={(e) => {
                      const d = [...form.details];
                      d[idx].nama_mk_asal = e.target.value;
                      setForm({ ...form, details: d });
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Input
                    label="SKS Asal"
                    type="number"
                    required
                    min="1"
                    value={detail.sks_asal}
                    onChange={(e) => {
                      const d = [...form.details];
                      d[idx].sks_asal = parseInt(e.target.value) || 3;
                      setForm({ ...form, details: d });
                    }}
                  />
                  <Input
                    label="Nilai Huruf Asal"
                    required
                    placeholder="A / B+"
                    value={detail.nilai_huruf_asal}
                    onChange={(e) => {
                      const d = [...form.details];
                      d[idx].nilai_huruf_asal = e.target.value;
                      setForm({ ...form, details: d });
                    }}
                  />
                  <div>
                    <label className="label">Disetarakan Ke MK</label>
                    <select
                      value={detail.mata_kuliah_diakui_id}
                      onChange={(e) => {
                        const d = [...form.details];
                        d[idx].mata_kuliah_diakui_id = parseInt(e.target.value);
                        setForm({ ...form, details: d });
                      }}
                      className="select w-full text-xs"
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
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        open={Boolean(deletingKonversi)}
        onClose={() => setDeletingKonversi(null)}
        title="Hapus Riwayat Konversi?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeletingKonversi(null)}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Hapus
            </Button>
          </>
        }
      >
        <p className="text-slate-500 text-sm">
          Apakah Anda yakin ingin menghapus data konversi transfer untuk <strong>{deletingKonversi?.mahasiswa?.nama_lengkap}</strong>? Tindakan ini tidak dapat dibatalkan.
        </p>
      </Modal>
    </div>
  );
}

