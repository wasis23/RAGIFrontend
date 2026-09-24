'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Filter, Trash2, Search, Plus, Edit3 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { siakadService } from '@/services/siakad.service';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function BankSoalPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const userRoles = user?.roles?.map((r: any) => (typeof r === 'string' ? r : r.slug)) || [];
  const readOnly = userRoles.includes('mahasiswa');

  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [mkFilter, setMkFilter] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [toDelete, setToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchList = async () => {
    try {
      setLoading(true);
      const res = await siakadService.getSoalList();
      if (res.data) setList(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Gagal memuat bank soal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      setDeleting(true);
      await siakadService.deleteSoal(toDelete.id);
      toast.success('Soal dihapus');
      setToDelete(null);
      fetchList();
    } catch {
      toast.error('Gagal menghapus soal');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = list.filter((s: any) => {
    if (mkFilter && String(s.rps?.mata_kuliah_id) !== String(mkFilter)) return false;
    if (debounced) {
      const q = debounced.toLowerCase();
      const hay = `${s.pertanyaan || ''} ${s.rps?.mataKuliah?.nama || ''} ${s.rps?.mataKuliah?.kode_mk || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const mkOptions = (() => {
    const map = new Map<number, string>();
    list.forEach((s: any) => {
      if (s.rps?.mata_kuliah_id) {
        map.set(s.rps.mata_kuliah_id, `${s.rps?.mataKuliah?.kode_mk || ''} — ${s.rps?.mataKuliah?.nama || ''}`);
      }
    });
    return [...map.entries()].map(([value, label]) => ({ value, label }));
  })();

  const columns: ColumnDef<any>[] = [
    {
      key: 'soal',
      label: 'PERTANYAAN',
      render: (r) => (
        <div>
          <span className="text-xs text-slate-800 block leading-relaxed">{r.pertanyaan}</span>
          <span className="text-2xs text-slate-400">
            {r.subCpmk ? `SubCPMK: ${r.subCpmk.kode_sub_cpmk} • ` : ''}Bobot {r.bobot}
            {r.kunci_jawaban ? ` • Kunci: ${String(r.kunci_jawaban).substring(0, 50)}` : ''}
          </span>
        </div>
      ),
    },
    {
      key: 'mk',
      label: 'MATA KULIAH',
      render: (r) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{r.rps?.mataKuliah?.nama || '-'}</span>
          <span className="font-mono text-2xs text-slate-400">{r.rps?.mataKuliah?.kode_mk || ''} • {r.rps?.tahun_ajaran || ''}</span>
        </div>
      ),
    },
    {
      key: 'minggu',
      label: 'SESI',
      align: 'center',
      render: (r) => (
        <Badge variant="blue">Mg {r.mingguan?.minggu_ke || '-'}</Badge>
      ),
    },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (r) => (
        <div className="flex justify-end gap-1.5">
          {!readOnly && (
            <Button
              variant="outline"
              icon={<Edit3 size={13} />}
              className="text-2xs py-1 px-2.5 h-auto font-bold"
              onClick={() => router.push(`/siakad/obe/soal/${r.id}/edit`)}
            >
              Ubah
            </Button>
          )}
          {!readOnly && (
            <Button
              variant="outline"
              icon={<Trash2 size={13} className="text-rose-600" />}
              className="text-2xs py-1 px-2 h-auto hover:bg-rose-50"
              onClick={() => setToDelete(r)}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Bank Soal OBE"
        description="Kumpulan butir soal per sesi RPS dan SubCPMK lintas mata kuliah. Tambah/ubah via halaman form."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Bank Soal' },
        ]}
        action={
          <div className="flex items-center gap-2">
            {!readOnly && (
              <Button variant="primary" icon={<Plus size={15} />} className="font-bold text-xs min-h-[38px]" onClick={() => router.push('/siakad/obe/soal/create')}>
                Tambah Soal
              </Button>
            )}
            <Button variant="outline" icon={<Filter size={15} />} className="font-bold text-xs min-h-[38px]" onClick={() => setShowFilter(true)}>
              Filter
            </Button>
          </div>
        }
      />

      <div className="card p-4">
        <Input
          label="Cari Soal / Mata Kuliah"
          placeholder="Ketik kata kunci... (otomatis)"
          prefixIcon={<Search size={15} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <DataTable columns={columns} data={filtered} isLoading={loading} emptyMessage="Belum ada soal tersimpan." />

      <Drawer open={showFilter} onClose={() => setShowFilter(false)} title="Filter Bank Soal">
        <div className="flex flex-col gap-5">
          <div>
            <label className="label">Mata Kuliah</label>
            <select value={mkFilter} onChange={(e) => setMkFilter(e.target.value)} className="select w-full">
              <option value="">Semua Mata Kuliah</option>
              {mkOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              setMkFilter('');
              setSearch('');
              setShowFilter(false);
            }}
          >
            Reset
          </Button>
        </div>
      </Drawer>

      <ConfirmDialog
        isOpen={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        title="Hapus Soal?"
        message="Butir soal ini akan dihapus dari bank soal."
        confirmText="Ya, Hapus"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}
