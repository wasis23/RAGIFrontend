'use client';

import { useState, useEffect } from 'react';
import { Plus, Filter, Edit2, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

export default function ProfilLulusanObePage() {
  const [items, setItems] = useState<any[]>([]);
  const [kurikulums, setKurikulums] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<any>(undefined);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterKurikulumId, setFilterKurikulumId] = useState('');
  const [filterSortBy, setFilterSortBy] = useState('kode_pl');
  const [filterSortDir, setFilterSortDir] = useState<'asc' | 'desc'>('asc');
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    kurikulumId: '',
    sortBy: 'kode_pl',
    sortDir: 'asc' as 'asc' | 'desc',
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingItem, setDeletingItem] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form Sesuai Gambar: Kurikulum, Kode, Rumusan
  const [formKurikulumId, setFormKurikulumId] = useState('');
  const [formKode, setFormKode] = useState('');
  const [formRumusan, setFormRumusan] = useState('');

  useEffect(() => {
    siakadService.getKurikulums().then((res) => {
      if (res.data) {
        const raw = res.data;
        const list = Array.isArray(raw) ? raw : (raw.items || []);
        setKurikulums(list);
        if (list[0]) setFormKurikulumId(String(list[0].id));
      }
    });
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await siakadService.getProfilLulusans({
        search: appliedFilters.search || undefined,
        kurikulum_id: appliedFilters.kurikulumId || undefined,
        sort_by: appliedFilters.sortBy,
        sort_order: appliedFilters.sortDir,
        page,
        limit,
      });
      if (res.data) {
        const raw = res.data;
        setItems(Array.isArray(raw) ? raw : (raw.items || []));
        if (res.meta) {
          setMeta(res.meta);
        } else if (Array.isArray(raw)) {
          setMeta({
            current_page: 1,
            per_page: raw.length,
            total: raw.length,
            last_page: 1,
            from: 1,
            to: raw.length,
          });
        }
      }
    } catch {
      toast.error('Gagal memuat profil lulusan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [appliedFilters, page, limit]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormKode('');
    setFormRumusan('');
    if (kurikulums[0]) setFormKurikulumId(String(kurikulums[0].id));
    setModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setFormKurikulumId(item.kurikulum_id ? String(item.kurikulum_id) : (kurikulums[0] ? String(kurikulums[0].id) : ''));
    setFormKode(item.kode_pl || item.kode || '');
    setFormRumusan(item.deskripsi || item.nama || '');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        kurikulum_id: Number(formKurikulumId) || (kurikulums[0]?.id ?? 1),
        kode_pl: formKode,
        nama: formRumusan.slice(0, 100),
        deskripsi: formRumusan,
      };
      await siakadService.storeProfilLulusan(payload);
      toast.success('Profil lulusan berhasil disimpan');
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan profil lulusan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setDeleting(true);
    try {
      await siakadService.deleteProfilLulusan(deletingItem.id);
      toast.success('Profil lulusan berhasil dihapus');
      setDeletingItem(null);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus profil lulusan');
    } finally {
      setDeleting(false);
    }
  };

  const columns: ColumnDef<any>[] = [
    { key: 'id', label: 'NO', align: 'center', render: (_r, i) => <span className="font-bold text-slate-400 text-xs">{meta?.from ? meta.from + i : i + 1}</span> },
    { key: 'kode_pl', label: 'KODE', render: (r) => <span className="font-mono font-bold text-slate-900 text-xs">{r.kode_pl || r.kode}</span> },
    {
      key: 'deskripsi',
      label: 'RUMUSAN PROFIL LULUSAN',
      render: (r) => (
        <div>
          <span className="font-bold text-slate-900 text-xs block">{r.nama}</span>
          {r.deskripsi && r.deskripsi !== r.nama && (
            <span className="text-2xs text-slate-500 block mt-0.5">{r.deskripsi}</span>
          )}
        </div>
      ),
    },
    { key: 'kurikulum', label: 'KURIKULUM', align: 'center', render: (r) => <span className="text-xs text-slate-700 font-medium">{r.kurikulum?.nama || '2023'}</span> },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (r) => (
        <div className="flex justify-end">
          <DropdownMenu
            items={[
              { label: 'Edit Profil Lulusan', icon: <Edit2 size={14} />, onClick: () => handleOpenEdit(r) },
              { label: 'Hapus Profil Lulusan', icon: <Trash2 size={14} />, variant: 'danger', onClick: () => setDeletingItem(r) },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Profil Lulusan (PL)"
        description="Rumusan capaian peran, profesi, atau kemampuan kerja yang diharapkan dari lulusan."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Profil Lulusan' },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" icon={<Filter size={16} />} onClick={() => setShowFilter(true)}>
              Filter
            </Button>
            <Button variant="primary" icon={<Plus size={16} />} onClick={handleOpenCreate}>
              Tambah Rumusan Profil Lulusan
            </Button>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={items}
        isLoading={loading}
        meta={meta}
        onPageChange={(p) => setPage(p)}
        onLimitChange={(l) => { setLimit(l); setPage(1); }}
        emptyMessage="Belum ada profil lulusan terdaftar."
      />

      <Drawer
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Profil Lulusan"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button
              variant="outline"
              onClick={() => {
                setFilterSearch('');
                setFilterKurikulumId('');
                setFilterSortBy('kode_pl');
                setFilterSortDir('asc');
                setAppliedFilters({ search: '', kurikulumId: '', sortBy: 'kode_pl', sortDir: 'asc' });
                setPage(1);
                setShowFilter(false);
              }}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setAppliedFilters({ search: filterSearch, kurikulumId: filterKurikulumId, sortBy: filterSortBy, sortDir: filterSortDir });
                setPage(1);
                setShowFilter(false);
              }}
            >
              Terapkan
            </Button>
          </div>
        }
      >
        <div className="space-y-4 p-4">
          <Input label="Kata Kunci" placeholder="Cari kode atau rumusan..." value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} />
          <Select
            label="Kurikulum"
            options={[
              { value: '', label: 'Semua Kurikulum' },
              ...kurikulums.map((k) => ({ value: String(k.id), label: `${k.tahun_berlaku || k.nama} — ${k.nama}` })),
            ]}
            value={filterKurikulumId}
            onChange={(val) => setFilterKurikulumId(val || '')}
          />
          <hr className="border-t border-slate-200 my-1" />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={filterSortBy}
              onChange={(val) => setFilterSortBy(val || 'kode_pl')}
              options={[
                { value: 'kode_pl', label: 'Kode' },
                { value: 'nama', label: 'Rumusan' },
              ]}
            />
            <Select
              label="Arah"
              value={filterSortDir}
              onChange={(val) => setFilterSortDir((val as 'asc' | 'desc') || 'asc')}
              options={[
                { value: 'asc', label: 'A - Z' },
                { value: 'desc', label: 'Z - A' },
              ]}
            />
          </div>
        </div>
      </Drawer>

      {/* Modal Sesuai Gambar Tambah Rumusan Profil Lulusan */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingItem ? 'Edit Rumusan Profil Lulusan' : 'Tambah Rumusan Profil Lulusan'}>
        <form onSubmit={handleSave} className="space-y-4">
          <Select
            label="Kurikulum"
            options={kurikulums.map((k) => ({ value: String(k.id), label: `${k.tahun_berlaku || k.nama} — ${k.nama}` }))}
            value={formKurikulumId}
            onChange={(val) => setFormKurikulumId(val || '')}
            required
          />
          <Input label="Kode" value={formKode} onChange={(e) => setFormKode(e.target.value)} placeholder="Contoh: PL01" required />
          <Textarea label="Rumusan" value={formRumusan} onChange={(e) => setFormRumusan(e.target.value)} placeholder="Tuliskan rumusan profil lulusan..." rows={4} required />
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={submitting}>Batal</Button>
            <Button type="submit" variant="primary" loading={submitting}>{editingItem ? 'Simpan Perubahan' : 'Simpan'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDelete}
        title="Hapus Profil Lulusan?"
        message={`Apakah Anda yakin ingin menghapus profil lulusan ${deletingItem?.kode_pl || deletingItem?.nama}?`}
        confirmText="Hapus"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}
