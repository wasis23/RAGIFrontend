'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { siakadService } from '@/services/siakad.service';
import {
  BANK_SOAL_SORT_BY_OPTIONS,
  BankSoal,
  TINGKAT_KESULITAN_OPTIONS,
  TIPE_SOAL_LABEL,
  TIPE_SOAL_OPTIONS,
  TipeSoal,
} from '@/types/bank-soal.types';
import { SORT_ORDER_OPTIONS } from '@/lib/constants';
import { PaginationMeta } from '@/types/api.types';
import { useAuth } from '@/hooks/useAuth';
import { Filter, RotateCcw, Check, Plus, Pencil, Trash2, ListChecks } from 'lucide-react';
import toast from 'react-hot-toast';
import { loadKategoriOptions } from '@/components/lms/bank-soal/BankSoalForm';

function extractVal(val: unknown): string {
  if (val === null || val === undefined || val === '') return '';
  if (typeof val === 'object' && val !== null && 'value' in (val as Record<string, unknown>)) {
    const v = (val as { value: unknown }).value;
    return v === null || v === undefined ? '' : String(v);
  }
  return String(val);
}

const filterSchema = z.object({
  search: z.string().optional().default(''),
  kategori_id: z.string().optional().default(''),
  tipe_soal: z.string().optional().default(''),
  tingkat_kesulitan: z.string().optional().default(''),
  sort_by: z.string().optional().default('id'),
  sort_order: z.enum(['asc', 'desc']).optional().default('desc'),
});

type FilterValues = z.infer<typeof filterSchema>;

export default function BankSoalListPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canManage = hasPermission('siakad.nilai.manage');

  const [rows, setRows] = useState<BankSoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [meta, setMeta] = useState<PaginationMeta>({ current_page: 1, last_page: 1, per_page: 10, total: 0 });
  const [showFilter, setShowFilter] = useState(false);
  const [targetHapus, setTargetHapus] = useState<BankSoal | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filterForm = useForm<FilterValues>({
    resolver: zodResolver(filterSchema) as any,
    defaultValues: { search: '', kategori_id: '', tipe_soal: '', tingkat_kesulitan: '', sort_by: 'id', sort_order: 'desc' },
  });
  const applied = filterForm.watch();

  const fetchData = useCallback(
    async (page = 1, perPage = 10, f?: FilterValues) => {
      setIsLoading(true);
      try {
        const fv = f ?? applied;
        const res = await siakadService.getSoalList({
          search: fv.search || undefined,
          kategori_id: fv.kategori_id ? Number(fv.kategori_id) : undefined,
          tipe_soal: fv.tipe_soal || undefined,
          tingkat_kesulitan: fv.tingkat_kesulitan || undefined,
          sort_by: fv.sort_by || 'id',
          sort_order: fv.sort_order || 'desc',
          page,
          per_page: perPage,
        });
        const payload: any = res.data;
        const list: BankSoal[] = Array.isArray(payload) ? payload : payload?.data || [];
        setRows(list);
        if (res.meta) setMeta(res.meta);
        else if (payload?.meta) setMeta(payload.meta);
        else if (Array.isArray(payload)) setMeta({ current_page: 1, last_page: 1, per_page: perPage, total: payload.length });
      } catch (err: any) {
        toast.error(err?.message || 'Gagal memuat bank soal');
        setRows([]);
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [applied.search, applied.kategori_id, applied.tipe_soal, applied.tingkat_kesulitan, applied.sort_by, applied.sort_order]
  );

  useEffect(() => {
    fetchData(meta.current_page, meta.per_page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta.current_page, meta.per_page]);

  const handleApplyFilter = (values: FilterValues) => {
    setShowFilter(false);
    setMeta((m) => ({ ...m, current_page: 1 }));
    fetchData(1, meta.per_page, values);
  };

  const handleResetFilter = () => {
    const reset = { search: '', kategori_id: '', tipe_soal: '', tingkat_kesulitan: '', sort_by: 'id', sort_order: 'desc' as const };
    filterForm.reset(reset);
    setShowFilter(false);
    setMeta((m) => ({ ...m, current_page: 1 }));
    fetchData(1, meta.per_page, reset);
  };

  const handleDelete = async () => {
    if (!targetHapus) return;
    setIsDeleting(true);
    try {
      await siakadService.deleteSoal(targetHapus.id);
      toast.success('Soal berhasil dihapus.');
      setTargetHapus(null);
      fetchData(meta.current_page, meta.per_page);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Gagal menghapus soal');
    } finally {
      setIsDeleting(false);
    }
  };

  const stripHtml = (html: string) => String(html || '').replace(/<[^>]*>/g, '').trim();

  const columns: ColumnDef<BankSoal>[] = [
    {
      key: 'pertanyaan',
      label: 'PERTANYAAN',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-800 text-xs block line-clamp-2">{stripHtml(row.pertanyaan) || '-'}</span>
          <span className="text-2xs text-slate-500 block">
            {row.kategori?.nama || (row.kategori_id ? `Kategori #${row.kategori_id}` : 'Tanpa kategori')}
            {row.rps?.mata_kuliah?.nama ? ` • ${row.rps.mata_kuliah.nama}` : ''}
          </span>
        </div>
      ),
    },
    {
      key: 'tipe',
      label: 'TIPE',
      align: 'center',
      render: (row) => <Badge variant="gray">{TIPE_SOAL_LABEL[row.tipe_soal as TipeSoal] || row.tipe_soal}</Badge>,
    },
    {
      key: 'kesulitan',
      label: 'KESULITAN',
      align: 'center',
      render: (row) => (
        <Badge variant={row.tingkat_kesulitan === 'sukar' ? 'red' : row.tingkat_kesulitan === 'sedang' ? 'yellow' : 'green'}>
          {row.tingkat_kesulitan || '-'}
        </Badge>
      ),
    },
    {
      key: 'kunci',
      label: 'KUNCI / OPSI',
      render: (row) => (
        <div>
          {Array.isArray(row.opsi) && row.opsi.length > 0 ? (
            <span className="text-2xs text-slate-600 block">{row.opsi.length} opsi • {row.opsi.filter((o) => o.is_benar).length} benar</span>
          ) : (
            <span className="text-2xs text-slate-600 block line-clamp-2">{stripHtml(row.kunci_jawaban || '') || '-'}</span>
          )}
          {row.bobot !== null && row.bobot !== undefined ? (
            <span className="text-2xs text-slate-400 block">Bobot {Number(row.bobot)}</span>
          ) : null}
        </div>
      ),
    },
    {
      key: 'quiz',
      label: 'QUIZ',
      align: 'center',
      render: (row) => {
        const used = row.dipakai_quiz || (row.quiz_count || 0) > 0;
        return <Badge variant={used ? 'blue' : 'gray'}>{used ? `Dipakai${row.quiz_count ? ` (${row.quiz_count})` : ''}` : 'Belum'}</Badge>;
      },
    },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end">
          <DropdownMenu
            items={[
              { label: 'Ubah', icon: <Pencil size={16} />, onClick: () => router.push(`/lms/bank-soal/${row.id}/edit`) },
              { label: 'Kelola Opsi', icon: <ListChecks size={16} />, onClick: () => router.push(`/lms/bank-soal/${row.id}/edit?tab=opsi`) },
              { label: 'Hapus', icon: <Trash2 size={16} />, variant: 'danger', onClick: () => setTargetHapus(row) },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="w-full space-y-4">
      <PageHeader
        title="Bank Soal"
        description="Kelola bank soal dosen untuk quiz dan tryout LMS."
        breadcrumbs={[{ label: 'LMS', href: '/lms' }, { label: 'Bank Soal' }]}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
              onClick={() => setShowFilter(true)}
            >
              Filter
            </Button>
            {canManage ? (
              <Button variant="primary" icon={<Plus size={16} />} onClick={() => router.push('/lms/bank-soal/create')}>
                Tambah Data
              </Button>
            ) : null}
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        meta={meta}
        onPageChange={(p) => setMeta((m) => ({ ...m, current_page: p }))}
        onLimitChange={(lim) => setMeta((m) => ({ ...m, per_page: lim, current_page: 1 }))}
        emptyMessage="Belum ada soal di bank soal."
      />

      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Bank Soal"
        footer={
          <div className="grid grid-cols-2 gap-2 w-full">
            <Button variant="outline" icon={<RotateCcw size={16} />} onClick={handleResetFilter}>
              Reset
            </Button>
            <Button icon={<Check size={16} />} onClick={filterForm.handleSubmit(handleApplyFilter)}>
              Terapkan
            </Button>
          </div>
        }
      >
        <form onSubmit={filterForm.handleSubmit(handleApplyFilter)} className="space-y-4">
          <Input label="Pencarian" placeholder="Cari pertanyaan soal..." {...filterForm.register('search')} />
          <Controller
            name="kategori_id"
            control={filterForm.control}
            render={({ field }) => (
              <AsyncSelect
                label="Kategori"
                placeholder="Semua kategori..."
                value={field.value || ''}
                onChange={(val) => field.onChange(extractVal(val))}
                loadOptions={loadKategoriOptions}
                isClearable
              />
            )}
          />
          <Controller
            name="tipe_soal"
            control={filterForm.control}
            render={({ field }) => (
              <Select
                label="Tipe Soal"
                placeholder="Semua tipe..."
                options={TIPE_SOAL_OPTIONS}
                value={field.value || ''}
                onChange={(val) => field.onChange(val)}
                isClearable
              />
            )}
          />
          <Controller
            name="tingkat_kesulitan"
            control={filterForm.control}
            render={({ field }) => (
              <Select
                label="Tingkat Kesulitan"
                placeholder="Semua kesulitan..."
                options={TINGKAT_KESULITAN_OPTIONS}
                value={field.value || ''}
                onChange={(val) => field.onChange(val)}
                isClearable
              />
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="sort_by"
              control={filterForm.control}
              render={({ field }) => (
                <Select label="Urut Berdasarkan" options={BANK_SOAL_SORT_BY_OPTIONS} value={field.value} onChange={(val) => field.onChange(val)} />
              )}
            />
            <Controller
              name="sort_order"
              control={filterForm.control}
              render={({ field }) => (
                <Select label="Arah" options={SORT_ORDER_OPTIONS} value={field.value} onChange={(val) => field.onChange(val)} />
              )}
            />
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        isOpen={!!targetHapus}
        onClose={() => setTargetHapus(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Hapus Soal"
        message="Yakin menghapus soal ini? Soal yang sudah dipakai quiz tidak dapat dihapus."
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
