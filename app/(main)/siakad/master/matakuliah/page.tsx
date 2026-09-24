'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Filter, Edit2, Trash2, GitFork } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PrasyaratForm, type PrasyaratFormValues } from '@/components/siakad/MataKuliahForm';
import { SIAKAD_OPTION_TYPES, useSiakadOptions } from '@/lib/siakad-options';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

export default function MataKuliahPage() {
  const router = useRouter();
  const [matakuliahs, setMatakuliahs] = useState<any[]>([]);
  const [kurikulums, setKurikulums] = useState<any[]>([]);
  const [prodis, setProdis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter Drawer States
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterProdi, setFilterProdi] = useState('');
  const [filterKurikulum, setFilterKurikulum] = useState('');
  const [filterTipe, setFilterTipe] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    prodi_id: '',
    kurikulum: '',
    tipe: '',
  });

  const [deletingMk, setDeletingMk] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);
  const tipeOptions = useSiakadOptions(SIAKAD_OPTION_TYPES.TIPE_MK);
  const tipeLabel = (v: string) => tipeOptions.find((o) => o.value === v)?.label || v || '-';

  // Prasyarat MK Modal State
  const [prasyaratMkTarget, setPrasyaratMkTarget] = useState<any | null>(null);
  const [prasyaratList, setPrasyaratList] = useState<any[]>([]);
  const [loadingPrasyarat, setLoadingPrasyarat] = useState(false);
  const [deletingPrasyaratId, setDeletingPrasyaratId] = useState<number | null>(null);

  const fetchPrasyaratForMk = async (mkId: number) => {
    try {
      setLoadingPrasyarat(true);
      const res = await siakadService.getPrasyaratMks({ mata_kuliah_id: mkId });
      if (res.data) setPrasyaratList(res.data);
    } catch (err: any) {
      toast.error('Gagal memuat prasyarat mata kuliah');
    } finally {
      setLoadingPrasyarat(false);
    }
  };

  const handleOpenPrasyaratModal = (mk: any) => {
    setPrasyaratMkTarget(mk);
    fetchPrasyaratForMk(mk.id);
  };

  const handleAddPrasyarat = async (values: PrasyaratFormValues) => {
    if (!prasyaratMkTarget) return;
    try {
      await siakadService.createPrasyaratMk({
        mata_kuliah_id: prasyaratMkTarget.id,
        prasyarat_id: values.prasyarat_id,
        tipe: values.tipe,
        nilai_minimum: values.nilai_minimum,
      });
      toast.success('Prasyarat berhasil ditambahkan');
      fetchPrasyaratForMk(prasyaratMkTarget.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal menambahkan prasyarat');
      throw err;
    }
  };

  const handleDeletePrasyarat = async (id: number) => {
    try {
      setDeletingPrasyaratId(id);
      await siakadService.deletePrasyaratMk(id);
      toast.success('Prasyarat berhasil dihapus');
      if (prasyaratMkTarget) fetchPrasyaratForMk(prasyaratMkTarget.id);
    } catch (err: any) {
      toast.error('Gagal menghapus prasyarat');
    } finally {
      setDeletingPrasyaratId(null);
    }
  };

  const fetchInitialData = async () => {
    try {
      const [kRes, pRes] = await Promise.all([
        siakadService.getKurikulums(),
        siakadService.getProdi(),
      ]);
      if (kRes.data) setKurikulums(kRes.data);
      if (pRes.data) setProdis(pRes.data);
    } catch (err) {}
  };

  const fetchMataKuliah = async () => {
    try {
      setLoading(true);
      const res = await siakadService.getMataKuliahs({
        search: appliedFilters.search || undefined,
        program_studi_id: appliedFilters.prodi_id || undefined,
        kurikulum_id: appliedFilters.kurikulum || undefined,
        tipe: appliedFilters.tipe || undefined,
        per_page: 100,
      });
      if (res.data) setMatakuliahs(res.data);
    } catch (err: any) {
      toast.error('Gagal memuat mata kuliah');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchMataKuliah();
  }, [appliedFilters]);

  const handleDelete = async () => {
    if (!deletingMk) return;
    try {
      setDeleting(true);
      await siakadService.deleteMataKuliah(deletingMk.id);
      toast.success('Mata kuliah berhasil dihapus');
      setDeletingMk(null);
      fetchMataKuliah();
    } catch (err: any) {
      toast.error('Gagal menghapus mata kuliah');
    } finally {
      setDeleting(false);
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      key: 'kode_mk',
      label: 'KODE MK',
      render: (row) => (
        <span className="font-mono font-bold text-slate-900 text-xs">
          {row.kode_mk}
        </span>
      ),
    },
    {
      key: 'nama',
      label: 'NAMA MATA KULIAH',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 text-xs block">{row.nama}</span>
          <span className="text-2xs text-slate-500 font-mono">
            {row.sks_teori} SKS Teori + {row.sks_praktik} SKS Praktik
          </span>
        </div>
      ),
    },
    {
      key: 'total_sks',
      label: 'TOTAL SKS',
      align: 'center',
      render: (row) => (
        <span className="font-mono text-xs font-black text-slate-900">
          {row.total_sks} SKS
        </span>
      ),
    },
    {
      key: 'semester_anjuran',
      label: 'SEMESTER',
      align: 'center',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-slate-700">
          Sem. {row.semester_anjuran}
        </span>
      ),
    },
    {
      key: 'program_studi',
      label: 'PROGRAM STUDI & KURIKULUM',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 text-xs block">
            {row.kurikulum?.program_studi?.nama || '-'}
          </span>
          <span className="text-2xs text-slate-500">
            {row.kurikulum?.nama || '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'tipe',
      label: 'TIPE',
      align: 'center',
      render: (row) => (
        <Badge variant={row.tipe === 'pilihan' ? 'purple' : 'blue'} className="capitalize">
          {tipeLabel(row.tipe)}
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
                label: 'Kelola Prasyarat MK',
                icon: <GitFork size={14} />,
                onClick: () => handleOpenPrasyaratModal(row),
              },
              {
                label: 'Edit Mata Kuliah',
                icon: <Edit2 size={14} />,
                onClick: () => router.push(`/siakad/master/matakuliah/${row.id}/edit`),
              },
              {
                label: 'Hapus Mata Kuliah',
                icon: <Trash2 size={14} />,
                variant: 'danger',
                onClick: () => setDeletingMk(row),
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
        title="Master Mata Kuliah"
        description="Daftar mata kuliah, bobot SKS teori & praktik, semester anjuran, dan tipe kurikulum."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Mata Kuliah' },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setShowFilter(true)}
            >
              Filter
            </Button>
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => router.push('/siakad/master/matakuliah/create')}
            >
              Tambah Mata Kuliah
            </Button>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={matakuliahs}
        isLoading={loading}
        emptyMessage="Belum ada data mata kuliah yang tersimpan."
      />

      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Mata Kuliah"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setFilterSearch('');
                setFilterProdi('');
                setFilterKurikulum('');
                setFilterTipe('');
                setAppliedFilters({ search: '', prodi_id: '', kurikulum: '', tipe: '' });
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
                  prodi_id: filterProdi,
                  kurikulum: filterKurikulum,
                  tipe: filterTipe,
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
            label="Kode atau Nama Mata Kuliah"
            placeholder="Ketik kata kunci..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />

          <Select
            label="Program Studi"
            placeholder="Semua Program Studi"
            options={prodis.map((p) => ({
              value: p.id,
              label: `${p.nama}${p.jenjang ? ` (${p.jenjang})` : ''}`,
            }))}
            value={filterProdi || ''}
            onChange={(val: any) => {
              setFilterProdi(val ? String(val) : '');
              setFilterKurikulum('');
            }}
            isClearable
          />

          <Select
            label="Kurikulum"
            placeholder="Semua Kurikulum"
            options={kurikulums
              .filter((k) => !filterProdi || String(k.program_studi_id) === String(filterProdi))
              .map((k) => ({
                value: k.id,
                label: `${k.nama} — ${k.program_studi?.nama || ''}`,
              }))}
            value={filterKurikulum || ''}
            onChange={(val: any) => setFilterKurikulum(val ? String(val) : '')}
            isClearable
          />

          <Select
            label="Tipe Mata Kuliah"
            placeholder="Semua Tipe"
            options={tipeOptions}
            value={filterTipe || ''}
            onChange={(val: any) => setFilterTipe(val ? String(val) : '')}
            isClearable
          />
        </div>
      </Drawer>

      <ConfirmDialog
        isOpen={Boolean(deletingMk)}
        onClose={() => setDeletingMk(null)}
        onConfirm={handleDelete}
        title="Hapus Mata Kuliah?"
        message={
          <span>
            Apakah Anda yakin ingin menghapus mata kuliah <strong>{deletingMk?.nama}</strong> ({deletingMk?.kode_mk})? Tindakan ini tidak dapat dibatalkan.
          </span>
        }
        isLoading={deleting}
      />

      {/* Modal Kelola Prasyarat Mata Kuliah (<= 5 field) */}
      <Modal
        open={Boolean(prasyaratMkTarget)}
        onClose={() => setPrasyaratMkTarget(null)}
        title={`Kelola Prasyarat: ${prasyaratMkTarget?.kode_mk} — ${prasyaratMkTarget?.nama}`}
        size="lg"
        footer={
          <Button variant="secondary" onClick={() => setPrasyaratMkTarget(null)}>
            Tutup
          </Button>
        }
      >
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            {prasyaratMkTarget && (
              <PrasyaratForm
                key={prasyaratMkTarget.id}
                excludeMkId={prasyaratMkTarget.id}
                onSubmit={handleAddPrasyarat}
              />
            )}
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase">
              Daftar Prasyarat Terdaftar ({prasyaratList.length})
            </h4>

            {loadingPrasyarat ? (
              <p className="text-xs text-slate-400 py-3 text-center">Memuat daftar prasyarat...</p>
            ) : prasyaratList.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                Belum ada mata kuliah prasyarat yang ditentukan untuk mata kuliah ini.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {prasyaratList.map((item) => (
                  <div key={item.id} className="p-3 bg-white flex items-center justify-between hover:bg-slate-50 transition">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900">
                          {item.prasyarat?.kode_mk}
                        </span>
                        <span className="text-xs font-semibold text-slate-700">
                          {item.prasyarat?.nama}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={item.tipe === 'lulus' ? 'green' : 'blue'} className="text-2xs">
                          {item.tipe === 'lulus' ? `Wajib Lulus (Min. ${item.nilai_minimum})` : 'Pernah Diambil'}
                        </Badge>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Trash2 size={12} />}
                      onClick={() => handleDeletePrasyarat(item.id)}
                      disabled={deletingPrasyaratId === item.id}
                      className="text-2xs text-rose-600 hover:bg-rose-50 hover:border-rose-300"
                    >
                      {deletingPrasyaratId === item.id ? 'Menghapus...' : 'Hapus'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
