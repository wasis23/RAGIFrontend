'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Badge } from '@/components/ui/Badge';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Modal } from '@/components/ui/Modal';
import KelasSelect from '@/components/lms/KelasSelect';
import { lmsService } from '@/services/lms.service';
import { referensiService } from '@/services/referensi.service';
import { LmsQuizItem, TRYOUT_SORT_BY_OPTIONS } from '@/types/lms.types';
import { SORT_ORDER_OPTIONS } from '@/lib/constants';
import { PaginationMeta } from '@/types/api.types';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Filter, RotateCcw, Check, ArrowRight, ClipboardCheck, Clock, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

/**
 * Formulir pembuatan tryout. Tryut berlingkup kelas, jadi kelas (dirujuk lewat
 * `kelas.id`) wajib dipilih lebih dulu; judul minimal agar tryout bisa dikenali.
 */
const tryoutSchema = z.object({
  kelas_id: z.string().min(1, 'Kelas wajib dipilih.'),
  judul: z.string().min(1, 'Judul tryout wajib diisi.').max(255, 'Judul tryout maksimal 255 karakter.'),
  durasi_menit: z
    .number({ message: 'Durasi harus berupa angka.' })
    .int('Durasi harus bilangan bulat.')
    .min(1, 'Durasi minimal 1 menit.')
    .max(1440, 'Durasi maksimal 1440 menit.'),
});

type TryoutFormValues = z.infer<typeof tryoutSchema>;

function formatWaktu(value?: string | null): string {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function LmsTryoutListPage() {
  const router = useRouter();

  const [rows, setRows] = useState<LmsQuizItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [meta, setMeta] = useState<PaginationMeta>({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });

  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [filterTahunAkademik, setFilterTahunAkademik] = useState<string>('');
  const [filterKelas, setFilterKelas] = useState<string>('');
  const [filterOrderBy, setFilterOrderBy] = useState<string>('id');
  const [filterOrderDir, setFilterOrderDir] = useState<string>('desc');

  const { hasPermission } = useAuth();
  // Tryout dibuat oleh pengelola kelas (dosen/kaprodi/admin); mahasiswa hanya
  // mengerjakan tryout yang sudah terbit.
  const canManageTryout = hasPermission('siakad.kelas.manage');
  const [isTambahOpen, setIsTambahOpen] = useState<boolean>(false);
  const tryoutForm = useForm<TryoutFormValues>({
    resolver: zodResolver(tryoutSchema),
    defaultValues: { kelas_id: '', judul: '', durasi_menit: 60 },
  });

  const loadTahunAkademikOptions = useCallback(async (inputValue: string) => {
    try {
      const res = await referensiService.getPaginated({
        modul: 'siakad',
        tipe: 'tahun_akademik',
        search: inputValue || undefined,
        per_page: 20,
      });
      return (res.data || []).map((r) => ({ value: String(r.id), label: r.nama }));
    } catch {
      return [];
    }
  }, []);

  const fetchData = useCallback(
    async (page = 1, perPage = 10) => {
      setIsLoading(true);
      try {
        const res = await lmsService.listTryoutSaya({
          page,
          per_page: perPage,
          search: filterSearch || undefined,
          sort_by: filterOrderBy || 'id',
          sort_order: (filterOrderDir as 'asc' | 'desc') || 'desc',
          tahun_akademik_id: filterTahunAkademik ? Number(filterTahunAkademik) : undefined,
          kelas_id: filterKelas ? Number(filterKelas) : undefined,
        });

        if (res.status === 'success' && res.data) {
          setRows(res.data);
          if (res.meta) setMeta(res.meta);
        } else {
          setRows([]);
        }
      } catch (err: any) {
        toast.error(err.message || 'Gagal memuat daftar tryout');
        setRows([]);
      } finally {
        setIsLoading(false);
      }
    },
    [filterSearch, filterOrderBy, filterOrderDir, filterTahunAkademik, filterKelas]
  );

  useEffect(() => {
    fetchData(meta.current_page, meta.per_page);
  }, [fetchData, meta.current_page, meta.per_page]);

  const handleApplyFilter = () => {
    setShowFilter(false);
    fetchData(1, meta.per_page);
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterTahunAkademik('');
    setFilterKelas('');
    setFilterOrderBy('id');
    setFilterOrderDir('desc');
    setShowFilter(false);
  };

  const onSimpanTryout = async (values: TryoutFormValues) => {
    try {
      await lmsService.createTryout(Number(values.kelas_id), {
        judul: values.judul,
        durasi_menit: values.durasi_menit,
      });
      toast.success('Tryout berhasil dibuat. Lengkapi soal dari bank soal.');
      setIsTambahOpen(false);
      tryoutForm.reset({ kelas_id: '', judul: '', durasi_menit: 60 });
      fetchData(1, meta.per_page);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Gagal membuat tryout');
    }
  };

  const columns: ColumnDef<LmsQuizItem>[] = [
    {
      key: 'tryout',
      label: 'TRYOUT',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-800 text-xs block">{row.judul}</span>
          <span className="text-2xs text-slate-500 block line-clamp-1">
            {row.deskripsi || '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'kelas',
      label: 'KELAS',
      render: (row) => (
        <div>
          <span className="text-xs font-medium text-slate-800 block">
            {row.kelas?.nama_kelas || '-'}
          </span>
          <span className="text-2xs text-slate-500 font-mono block">
            {row.kelas?.kode_kelas || '-'}
            {row.kelas?.mata_kuliah?.nama ? ` • ${row.kelas.mata_kuliah.nama}` : ''}
          </span>
        </div>
      ),
    },
    {
      key: 'soal',
      label: 'SOAL & DURASI',
      align: 'center',
      render: (row) => (
        <div className="inline-flex items-center gap-2 text-xs text-slate-700 bg-slate-50 p-2 rounded-md border border-slate-200">
          <ClipboardCheck size={16} className="text-slate-500" />
          <span>{row.soal_count ?? 0} soal</span>
          <span className="text-slate-400">|</span>
          <Clock size={16} className="text-slate-500" />
          <span>{row.durasi_menit ?? 0} mnt</span>
        </div>
      ),
    },
    {
      key: 'jendela',
      label: 'JENDELA AKSES',
      render: (row) => (
        <div>
          <span className="text-2xs text-slate-600 block">
            Buka: {formatWaktu(row.dibuka_at)}
          </span>
          <span className="text-2xs text-slate-500 block">
            Tutup: {formatWaktu(row.ditutup_at)}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (row) => (
        <Badge variant={row.is_archived ? 'gray' : row.is_published ? 'green' : 'amber'}>
          {row.is_archived ? 'Diarsipkan' : row.is_published ? 'Terbit' : 'Draft'}
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
                label: 'Kerjakan Tryout',
                icon: <ArrowRight size={16} />,
                onClick: () => router.push(`/lms/${row.kelas_id}/quiz/${row.id}`),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Tryout"
        description="Kumpulan tryout latihan dari seluruh kelas yang Anda ikuti atau ampu."
        breadcrumbs={[
          { label: 'LMS', href: '/lms' },
          { label: 'Tryout' },
        ]}
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
            {canManageTryout ? (
              <Button variant="primary" icon={<Plus size={16} />} onClick={() => setIsTambahOpen(true)}>
                Tambah Data
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <ClipboardCheck size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-500">Total Tryout</div>
            <div className="text-xs font-bold text-slate-800">{meta.total}</div>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        meta={meta}
        onPageChange={(p) => fetchData(p, meta.per_page)}
        onLimitChange={(lim) => fetchData(1, lim)}
        emptyMessage="Belum ada tryout yang tersedia untuk kelas Anda."
      />

      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Tryout"
        footer={
          <div className="grid grid-cols-2 gap-2 w-full">
            <Button variant="outline" icon={<RotateCcw size={16} />} onClick={handleResetFilter}>
              Reset
            </Button>
            <Button icon={<Check size={16} />} onClick={handleApplyFilter}>
              Terapkan
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Pencarian"
            placeholder="Cari judul tryout, kelas, atau mata kuliah..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />

          <AsyncSelect
            label="Tahun Akademik"
            placeholder="Semua periode..."
            value={filterTahunAkademik}
            onChange={(val) => setFilterTahunAkademik(val ? String(val) : '')}
            loadOptions={loadTahunAkademikOptions}
            isClearable
          />

          <KelasSelect value={filterKelas} onChange={(val) => setFilterKelas(val ? String(val) : '')} />

          <hr className="border-t border-slate-200 my-4" />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={filterOrderBy}
              onChange={(val) => setFilterOrderBy(val)}
              options={TRYOUT_SORT_BY_OPTIONS}
            />
            <Select
              label="Arah"
              value={filterOrderDir}
              onChange={(val) => setFilterOrderDir(val)}
              options={SORT_ORDER_OPTIONS}
            />
          </div>
        </div>
      </Drawer>

      <Modal
        open={isTambahOpen}
        onClose={() => setIsTambahOpen(false)}
        title="Tambah Tryout"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsTambahOpen(false)}>
              Batal
            </Button>
            <Button
              variant="primary"
              onClick={tryoutForm.handleSubmit(onSimpanTryout)}
              loading={tryoutForm.formState.isSubmitting}
              disabled={tryoutForm.formState.isSubmitting}
            >
              Simpan
            </Button>
          </div>
        }
      >
        <form onSubmit={tryoutForm.handleSubmit(onSimpanTryout)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Controller
              name="kelas_id"
              control={tryoutForm.control}
              render={({ field }) => (
                <KelasSelect
                  label="Kelas"
                  placeholder="Pilih kelas..."
                  required
                  value={field.value}
                  onChange={(val) => field.onChange(val ? String(val) : '')}
                  error={tryoutForm.formState.errors.kelas_id?.message}
                />
              )}
            />
          </div>

          <div className="md:col-span-2">
            <Input
              label="Judul Tryout"
              required
              placeholder="cth: Tryout UTS Genap"
              error={tryoutForm.formState.errors.judul?.message}
              {...tryoutForm.register('judul')}
            />
          </div>

          <Input
            type="number"
            label="Durasi (menit)"
            min={1}
            max={1440}
            error={tryoutForm.formState.errors.durasi_menit?.message}
            {...tryoutForm.register('durasi_menit', { valueAsNumber: true })}
          />
        </form>
      </Modal>
    </div>
  );
}