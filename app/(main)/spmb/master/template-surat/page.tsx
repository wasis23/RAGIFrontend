'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Plus, Edit, Trash2, Filter, Eye, FileText, Download } from 'lucide-react';
import { spmbService } from '@/services/spmb.service';
import {
  TemplateSuratSpmb,
  JalurMasuk,
  GelombangPenerimaan,
  FILTER_STATUS_TEMPLATE_OPTIONS,
  SORT_BY_TEMPLATE_OPTIONS,
  SORT_DIR_OPTIONS,
} from '@/types/spmb.types';
import toast from 'react-hot-toast';
import { DataTable } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export default function MasterTemplateSuratPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [data, setData] = useState<TemplateSuratSpmb[]>([]);
  const [meta, setMeta] = useState<{
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
    from?: number;
    to?: number;
  }>({ current_page: 1, last_page: 1, total: 0, per_page: 10 });
  const [loading, setLoading] = useState(false);

  // Filter drawer state
  const [showFilter, setShowFilter] = useState(false);
  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 10;
  const searchQ = searchParams.get('search') || '';
  const jalurQ = searchParams.get('jalur_masuk_id') || '';
  const gelombangQ = searchParams.get('gelombang_id') || '';
  const statusQ = searchParams.get('is_active') || '';
  const orderByQ = searchParams.get('sort_by') || 'nama';
  const orderDirQ = searchParams.get('sort_dir') || 'asc';

  const [filterSearch, setFilterSearch] = useState(searchQ);
  const [filterJalur, setFilterJalur] = useState(jalurQ);
  const [filterGelombang, setFilterGelombang] = useState(gelombangQ);
  const [filterStatus, setFilterStatus] = useState(statusQ);
  const [filterOrderBy, setFilterOrderBy] = useState(orderByQ);
  const [filterOrderDir, setFilterOrderDir] = useState(orderDirQ);

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    id: number | null;
    label: string;
    loading: boolean;
  }>({
    isOpen: false,
    id: null,
    label: '',
    loading: false,
  });

  const loadJalurOptions = async (inputValue: string) => {
    try {
      const res = await spmbService.getJalurMasuk({ name: inputValue, limit: 50 });
      return (res.data || []).map((j: JalurMasuk) => ({
        value: String(j.id),
        label: `${j.kode} - ${j.nama}`,
      }));
    } catch {
      return [];
    }
  };

  const loadGelombangOptions = async (inputValue: string) => {
    try {
      const res = await spmbService.getGelombang({ nama: inputValue, per_page: 50 });
      return (res.data || []).map((g: GelombangPenerimaan) => ({
        value: String(g.id),
        label: g.nama,
      }));
    } catch {
      return [];
    }
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await spmbService.getTemplateSurat({
        page,
        limit,
        search: searchQ,
        jalur_masuk_id: jalurQ || undefined,
        gelombang_id: gelombangQ || undefined,
        is_active: statusQ !== '' ? statusQ : undefined,
        sort_by: orderByQ,
        sort_dir: orderDirQ,
      });
      setData(res.data || []);
      if (res.meta) setMeta(res.meta);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Gagal memuat data template surat';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchQ, jalurQ, gelombangQ, statusQ, orderByQ, orderDirQ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateURLParams = (newParams: Record<string, string | number>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.keys(newParams).forEach((key) => {
      if (newParams[key] !== '' && newParams[key] !== undefined && newParams[key] !== null) {
        params.set(key, String(newParams[key]));
      } else {
        params.delete(key);
      }
    });
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleApplyFilter = () => {
    updateURLParams({
      page: 1,
      search: filterSearch,
      jalur_masuk_id: filterJalur,
      gelombang_id: filterGelombang,
      is_active: filterStatus,
      sort_by: filterOrderBy,
      sort_dir: filterOrderDir,
    });
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterJalur('');
    setFilterGelombang('');
    setFilterStatus('');
    setFilterOrderBy('nama');
    setFilterOrderDir('asc');
    updateURLParams({
      page: 1,
      search: '',
      jalur_masuk_id: '',
      gelombang_id: '',
      is_active: '',
      sort_by: 'nama',
      sort_dir: 'asc',
    });
    setShowFilter(false);
  };

  const handleOpenDelete = (item: TemplateSuratSpmb) => {
    setDeleteModal({
      isOpen: true,
      id: item.id,
      label: item.nama || item.kode,
      loading: false,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.id) return;
    try {
      setDeleteModal((prev) => ({ ...prev, loading: true }));
      await spmbService.deleteTemplateSurat(deleteModal.id);
      toast.success(`Template surat "${deleteModal.label}" berhasil dihapus`);
      setDeleteModal({ isOpen: false, id: null, label: '', loading: false });
      fetchData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Gagal menghapus template surat';
      toast.error(message);
      setDeleteModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handlePreviewPdf = async (id: number, kode: string) => {
    const toastId = toast.loading('Menyiapkan pratinjau dokumen PDF...');
    try {
      const blob = await spmbService.previewTemplateSuratPdf(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.download = `Preview-Template-${kode}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Pratinjau PDF berhasil dibuka', { id: toastId });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal membuka pratinjau PDF';
      toast.error(message, { id: toastId });
    }
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <PageHeader
        title="Master Template SK & Surat SPMB"
        description="Kelola format kop, nomor surat dinamis, teks keputusan, petunjuk daftar ulang, dan pejabat penandatangan dokumen resmi SPMB"
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setShowFilter(true)}
              style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
            >
              Filter
            </Button>
            <Button
              icon={<Plus size={16} />}
              onClick={() => router.push('/spmb/master/template-surat/create')}
              style={{ backgroundColor: 'var(--module-primary)' }}
            >
              Tambah Template
            </Button>
          </div>
        }
      />

      <DataTable
        data={data}
        meta={meta}
        isLoading={loading}
        onPageChange={(p) => updateURLParams({ page: p })}
        columns={[
          {
            key: 'kode',
            label: 'KODE & JENIS',
            sortable: true,
            render: (row) => (
              <div className="flex flex-col">
                <span className="font-bold text-xs text-slate-800">{row.kode}</span>
                <span className="text-2xs text-slate-500 uppercase tracking-wider mt-0.5">
                  {row.jenis_surat?.replace('_', ' ')}
                </span>
              </div>
            ),
          },
          {
            key: 'nama',
            label: 'NAMA TEMPLATE',
            sortable: true,
            render: (row) => (
              <div className="flex flex-col">
                <span className="font-bold text-xs text-slate-800">{row.nama}</span>
                <span className="text-2xs text-slate-500 line-clamp-1 mt-0.5">
                  {row.judul_surat || 'Surat Keputusan Kelulusan'}
                </span>
              </div>
            ),
          },
          {
            key: 'jalur_gelombang',
            label: 'JALUR & GELOMBANG',
            render: (row) => (
              <div className="flex flex-col gap-0.5">
                <span className="text-2xs font-semibold text-slate-700">
                  {row.jalur_masuk?.nama ? (
                    <Badge variant="secondary" className="text-2xs">{row.jalur_masuk.nama}</Badge>
                  ) : (
                    <span className="text-2xs text-slate-400 italic">Semua Jalur</span>
                  )}
                </span>
                <span className="text-2xs text-slate-500">
                  {row.gelombang?.nama ? (
                    <Badge variant="secondary" className="text-2xs">{row.gelombang.nama}</Badge>
                  ) : (
                    <span className="text-2xs text-slate-400 italic">Semua Gelombang</span>
                  )}
                </span>
              </div>
            ),
          },
          {
            key: 'is_active',
            label: 'STATUS',
            sortable: true,
            render: (row) =>
              row.is_active ? (
                <Badge variant="success" className="text-2xs">Aktif</Badge>
              ) : (
                <Badge variant="danger" className="text-2xs">Tidak Aktif</Badge>
              ),
          },
          {
            key: 'actions',
            label: 'AKSI',
            align: 'right',
            render: (row) => (
              <DropdownMenu
                items={[
                  {
                    label: 'Lihat Detail',
                    icon: <Eye size={14} />,
                    onClick: () => router.push(`/spmb/master/template-surat/${row.id}`),
                  },
                  {
                    label: 'Pratinjau PDF',
                    icon: <Download size={14} />,
                    onClick: () => handlePreviewPdf(row.id, row.kode),
                  },
                  {
                    label: 'Edit Template',
                    icon: <Edit size={14} />,
                    onClick: () => router.push(`/spmb/master/template-surat/${row.id}/edit`),
                  },
                  {
                    label: 'Hapus',
                    icon: <Trash2 size={14} className="text-red-500" />,
                    onClick: () => handleOpenDelete(row),
                    variant: 'danger',
                  },
                ]}
              />
            ),
          },
        ]}
      />

      {/* Filter Drawer */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Template Surat"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={handleResetFilter}>
              Reset
            </Button>
            <Button
              variant="primary"
              onClick={handleApplyFilter}
              style={{ backgroundColor: 'var(--module-primary)', borderColor: 'var(--module-primary)' }}
            >
              Terapkan
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Kode / Judul / Teks"
            placeholder="Cari kode atau judul..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />

          <AsyncSelect
            label="Jalur Masuk"
            placeholder="Pilih atau cari jalur..."
            value={filterJalur}
            onChange={(opt: { value: string; label: string } | null) => setFilterJalur(opt ? opt.value : '')}
            loadOptions={loadJalurOptions}
            isClearable
          />

          <AsyncSelect
            label="Gelombang"
            placeholder="Pilih atau cari gelombang..."
            value={filterGelombang}
            onChange={(opt: { value: string; label: string } | null) => setFilterGelombang(opt ? opt.value : '')}
            loadOptions={loadGelombangOptions}
            isClearable
          />

          <Select
            label="Status Template"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={FILTER_STATUS_TEMPLATE_OPTIONS as any}
          />

          <hr className="border-slate-200" />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={filterOrderBy}
              onChange={(e) => setFilterOrderBy(e.target.value)}
              options={SORT_BY_TEMPLATE_OPTIONS as any}
            />
            <Select
              label="Arah Urutan"
              value={filterOrderDir}
              onChange={(e) => setFilterOrderDir(e.target.value)}
              options={SORT_DIR_OPTIONS as any}
            />
          </div>
        </div>
      </Drawer>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        title="Hapus Template Surat"
        message={`Apakah Anda yakin ingin menghapus template surat "${deleteModal.label}"? Dokumen pendaftaran baru tidak akan dapat menggunakan template ini.`}
        confirmText="Hapus"
        cancelText="Batal"
        isLoading={deleteModal.loading}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteModal({ isOpen: false, id: null, label: '', loading: false })}
      />
    </div>
  );
}
