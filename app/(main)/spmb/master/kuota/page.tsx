'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Drawer } from '@/components/ui/Drawer';
import { Badge } from '@/components/ui/Badge';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Filter, Plus, Edit, Trash2, MoreVertical, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { spmbService } from '@/services/spmb.service';
import type { PaginationMeta } from '@/types/api.types';

interface KuotaProdiItem {
  id: number;
  tahun_akademik_id: number;
  program_studi_id: number;
  kuota_total: number;
  kuota_terisi: number;
  tahun_akademik?: {
    id: number;
    kode?: string;
    nama: string;
    is_active?: boolean;
  };
  program_studi?: {
    id: number;
    kode_prodi?: string;
    nama: string;
    jenjang?: string;
  };
}

export default function MasterKuotaProdiPage() {
  const [data, setData] = useState<KuotaProdiItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Filter drawer & form state (1:1 with 4 table information columns)
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterProdi, setFilterProdi] = useState('');
  const [filterTahunAkademik, setFilterTahunAkademik] = useState('');
  const [filterMinKuota, setFilterMinKuota] = useState('');
  const [filterStatusKuota, setFilterStatusKuota] = useState('');
  const [filterOrderBy, setFilterOrderBy] = useState('id');
  const [filterOrderDir, setFilterOrderDir] = useState<'asc' | 'desc'>('desc');

  // Applied filters state
  const [appliedFilters, setAppliedFilters] = useState({
    prodi: '',
    tahunAkademik: '',
    minKuota: '',
    statusKuota: '',
    orderBy: 'id',
    orderDir: 'desc' as 'asc' | 'desc',
  });

  // Reference options
  const [prodiOptions, setProdiOptions] = useState<{ value: string; label: string }[]>([]);
  const [tahunOptions, setTahunOptions] = useState<{ value: string; label: string }[]>([]);

  // Modal create/edit state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editTarget, setEditTarget] = useState<KuotaProdiItem | null>(null);
  const [formData, setFormData] = useState({
    tahun_akademik_id: '',
    program_studi_id: '',
    kuota_total: '',
  });

  // Delete dialog state
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: number | null; label?: string }>({
    isOpen: false,
    id: null,
    label: '',
  });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchReferences = async () => {
    try {
      const [resProdi, resTahun] = await Promise.all([
        spmbService.getProgramStudi(),
        spmbService.getTahunAkademikList(),
      ]);

      const prodiList = Array.isArray(resProdi.data) ? resProdi.data : [];
      setProdiOptions(
        prodiList.map((p: any) => ({
          value: p.id.toString(),
          label: `${p.nama} (${p.jenjang || 'S1'})`,
        }))
      );

      const tahunList = Array.isArray(resTahun.data) ? resTahun.data : [];
      setTahunOptions(
        tahunList.map((t: any) => ({
          value: t.id.toString(),
          label: t.nama || `Tahun #${t.id}`,
        }))
      );
    } catch (error) {
      console.error('Gagal mengambil data referensi kuota prodi:', error);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await spmbService.getKuotaProdi({
        page,
        per_page: perPage,
        program_studi_id: appliedFilters.prodi || undefined,
        tahun_akademik_id: appliedFilters.tahunAkademik || undefined,
        min_kuota: appliedFilters.minKuota ? Number(appliedFilters.minKuota) : undefined,
        status_kuota: appliedFilters.statusKuota || undefined,
        sort_by: appliedFilters.orderBy,
        sort_dir: appliedFilters.orderDir,
      });

      if (res.meta) {
        setData(res.data);
        setMeta(res.meta);
      } else {
        setData(Array.isArray(res.data) ? res.data : []);
      }
    } catch (error) {
      toast.error('Gagal memuat data kuota prodi.');
    } finally {
      setLoading(false);
    }
  }, [page, perPage, appliedFilters]);

  useEffect(() => {
    fetchReferences();
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApplyFilters = () => {
    setAppliedFilters({
      prodi: filterProdi,
      tahunAkademik: filterTahunAkademik,
      minKuota: filterMinKuota,
      statusKuota: filterStatusKuota,
      orderBy: filterOrderBy,
      orderDir: filterOrderDir,
    });
    setPage(1);
    setIsFilterOpen(false);
  };

  const handleResetFilters = () => {
    setFilterProdi('');
    setFilterTahunAkademik('');
    setFilterMinKuota('');
    setFilterStatusKuota('');
    setFilterOrderBy('id');
    setFilterOrderDir('desc');
    setAppliedFilters({
      prodi: '',
      tahunAkademik: '',
      minKuota: '',
      statusKuota: '',
      orderBy: 'id',
      orderDir: 'desc',
    });
    setPage(1);
    setIsFilterOpen(false);
  };

  const hasActiveFilter = Boolean(
    appliedFilters.prodi ||
    appliedFilters.tahunAkademik ||
    appliedFilters.minKuota ||
    appliedFilters.statusKuota ||
    appliedFilters.orderBy !== 'id' ||
    appliedFilters.orderDir !== 'desc'
  );

  const handleOpenCreate = () => {
    setEditTarget(null);
    setFormData({
      tahun_akademik_id: tahunOptions.length > 0 ? tahunOptions[0].value : '1',
      program_studi_id: prodiOptions.length > 0 ? prodiOptions[0].value : '',
      kuota_total: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: KuotaProdiItem) => {
    setEditTarget(item);
    setFormData({
      tahun_akademik_id: item.tahun_akademik_id.toString(),
      program_studi_id: item.program_studi_id.toString(),
      kuota_total: item.kuota_total.toString(),
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.program_studi_id) {
      toast.error('Pilih program studi terlebih dahulu.');
      return;
    }
    if (!formData.kuota_total || Number(formData.kuota_total) < 1) {
      toast.error('Masukkan kuota total yang valid (minimal 1).');
      return;
    }

    try {
      setSubmitting(true);
      if (editTarget) {
        await spmbService.updateKuotaProdi(editTarget.id, {
          kuota_total: Number(formData.kuota_total),
        });
        toast.success('Kuota program studi berhasil diperbarui!');
      } else {
        await spmbService.storeKuotaProdi({
          tahun_akademik_id: Number(formData.tahun_akademik_id || 1),
          program_studi_id: Number(formData.program_studi_id),
          kuota_total: Number(formData.kuota_total),
        });
        toast.success('Kuota program studi berhasil ditambahkan!');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan kuota program studi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDelete = (row: KuotaProdiItem) => {
    const prodiName = row.program_studi?.nama || `Prodi ID #${row.program_studi_id}`;
    setDeleteModal({
      isOpen: true,
      id: row.id,
      label: prodiName,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.id) return;
    try {
      setDeleteLoading(true);
      await spmbService.deleteKuotaProdi(deleteModal.id);
      toast.success(`Kuota "${deleteModal.label}" berhasil dihapus.`);
      setDeleteModal({ isOpen: false, id: null, label: '' });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus kuota program studi.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns: ColumnDef<KuotaProdiItem>[] = [
    {
      key: 'program_studi_id',
      label: 'Program Studi',
      sortable: true,
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 text-xs">
            {row.program_studi?.nama || `Prodi ID #${row.program_studi_id}`}
          </span>
          <span className="text-2xs text-slate-500">
            Jenjang: {row.program_studi?.jenjang || 'S1'} {row.program_studi?.kode_prodi ? `• Kode: ${row.program_studi.kode_prodi}` : ''}
          </span>
        </div>
      ),
    },
    {
      key: 'tahun_akademik_id',
      label: 'Tahun Akademik',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700">
          <Calendar size={13} className="text-slate-400 shrink-0" />
          <div className="flex flex-col">
            <span className="font-semibold text-slate-800 text-xs">
              {row.tahun_akademik?.nama || '2026/2027'}
            </span>
            <span className="text-2xs text-slate-500">
              {row.tahun_akademik?.is_active ? 'Tahun Aktif' : 'Nonaktif'}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'kuota_total',
      label: 'Kuota Total',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 text-xs">
            {row.kuota_total} Kursi
          </span>
          <span className="text-2xs text-slate-500">
            Kapasitas Pendaftar
          </span>
        </div>
      ),
    },
    {
      key: 'kuota_terisi',
      label: 'Keterisian & Status',
      render: (row) => {
        const terisi = row.kuota_terisi || 0;
        const total = row.kuota_total || 0;
        const sisa = Math.max(0, total - terisi);
        const isPenuh = total > 0 && terisi >= total;
        return (
          <div className="flex flex-col gap-1 items-start">
            <Badge variant={isPenuh ? 'red' : 'green'}>
              {isPenuh ? 'Kuota Penuh' : `${terisi} / ${total} Terisi`}
            </Badge>
            <span className="text-2xs text-slate-500">
              {isPenuh ? 'Tidak ada sisa kursi' : `Tersedia ${sisa} kursi lagi`}
            </span>
          </div>
        );
      },
    },
    {
      key: 'actions',
      label: 'Aksi',
      align: 'right',
      render: (row) => (
        <DropdownMenu
          triggerIcon={<MoreVertical size={16} />}
          items={[
            {
              label: 'Edit Kuota',
              icon: <Edit size={14} />,
              onClick: () => handleOpenEdit(row),
            },
            {
              label: 'Hapus',
              icon: <Trash2 size={14} />,
              variant: 'danger',
              onClick: () => handleOpenDelete(row),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Manajemen Kuota Prodi"
        description="Atur kuota pendaftaran mahasiswa baru untuk tiap program studi"
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
              onClick={() => setIsFilterOpen(true)}
            >
              Filter {hasActiveFilter ? '•' : ''}
            </Button>
            <Button
              icon={<Plus size={16} />}
              onClick={handleOpenCreate}
            >
              Set Kuota Baru
            </Button>
          </div>
        }
      />

      <DataTable
        data={data}
        isLoading={loading}
        meta={meta}
        onPageChange={(p) => setPage(p)}
        onLimitChange={(l) => {
          setPerPage(l);
          setPage(1);
        }}
        columns={columns}
      />

      {/* Drawer Filter: 1:1 Parity dengan 4 Kolom Tabel */}
      <Drawer
        position="right"
        open={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title="Filter & Urutkan Kuota"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={handleResetFilters}>
              Reset
            </Button>
            <Button variant="primary" onClick={handleApplyFilters}>
              Terapkan
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          {/* 1. Program Studi */}
          <Select
            label="Program Studi"
            value={filterProdi}
            onChange={(val) => setFilterProdi(val as string)}
            options={[
              { value: '', label: 'Semua Program Studi' },
              ...prodiOptions,
            ]}
          />

          {/* 2. Tahun Akademik */}
          <Select
            label="Tahun Akademik"
            value={filterTahunAkademik}
            onChange={(val) => setFilterTahunAkademik(val as string)}
            options={[
              { value: '', label: 'Semua Tahun Akademik' },
              ...tahunOptions,
            ]}
          />

          {/* 3. Minimal Kuota Total */}
          <Input
            label="Minimal Kuota Total"
            type="number"
            min="1"
            placeholder="Contoh: 50"
            value={filterMinKuota}
            onChange={(e) => setFilterMinKuota(e.target.value)}
          />

          {/* 4. Status Keterisian Kuota */}
          <Select
            label="Status Keterisian Kuota"
            value={filterStatusKuota}
            onChange={(val) => setFilterStatusKuota(val as string)}
            options={[
              { value: '', label: 'Semua Status Keterisian' },
              { value: 'tersedia', label: 'Masih Tersedia (Sisa > 0)' },
              { value: 'penuh', label: 'Kuota Penuh (Terisi >= Total)' },
            ]}
          />

          <hr className="border-slate-200" />

          {/* Comprehensive Sorting Grid 2 Kolom */}
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={filterOrderBy}
              onChange={(val) => setFilterOrderBy(val as string)}
              options={[
                { value: 'id', label: 'ID Kuota' },
                { value: 'program_studi_id', label: 'Program Studi' },
                { value: 'tahun_akademik_id', label: 'Tahun Akademik' },
                { value: 'kuota_total', label: 'Kuota Total' },
                { value: 'kuota_terisi', label: 'Kuota Terisi' },
              ]}
            />

            <Select
              label="Arah Urutan"
              value={filterOrderDir}
              onChange={(val) => setFilterOrderDir(val as 'asc' | 'desc')}
              options={[
                { value: 'desc', label: 'Z - A (Terbaru)' },
                { value: 'asc', label: 'A - Z (Terlama)' },
              ]}
            />
          </div>
        </div>
      </Drawer>

      {/* Modal Form: <= 5 input */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !submitting && setIsModalOpen(false)}
        title={editTarget ? 'Edit Kuota Program Studi' : 'Set Kuota Program Studi Baru'}
      >
        <form onSubmit={handleSubmitForm} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Tahun Akademik"
              value={formData.tahun_akademik_id}
              onChange={(val) => setFormData((prev) => ({ ...prev, tahun_akademik_id: val as string }))}
              options={tahunOptions}
              disabled={Boolean(editTarget)}
            />

            <Select
              label="Program Studi"
              value={formData.program_studi_id}
              onChange={(val) => setFormData((prev) => ({ ...prev, program_studi_id: val as string }))}
              options={prodiOptions}
              disabled={Boolean(editTarget)}
            />
          </div>

          <div>
            <Input
              label="Kuota Total (Kapasitas Kursi)"
              type="number"
              min="1"
              placeholder="Masukkan total kuota"
              value={formData.kuota_total}
              onChange={(e) => setFormData((prev) => ({ ...prev, kuota_total: e.target.value }))}
              required
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={submitting}
            >
              {editTarget ? 'Simpan Perubahan' : 'Simpan Kuota'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Dialog Konfirmasi Hapus */}
      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={() => !deleteLoading && setDeleteModal({ isOpen: false, id: null, label: '' })}
        onConfirm={handleConfirmDelete}
        isLoading={deleteLoading}
        title="Hapus Kuota Prodi"
        message={
          <span>
            Apakah Anda yakin ingin menghapus penetapan kuota untuk{' '}
            <strong>&quot;{deleteModal.label}&quot;</strong>?
          </span>
        }
        confirmText="Ya, Hapus"
        cancelText="Batal"
      />
    </div>
  );
}
