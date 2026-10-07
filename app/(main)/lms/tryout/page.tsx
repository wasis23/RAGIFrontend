'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import KelasSelect from '@/components/lms/KelasSelect';
import PeriodeAkademikSelect from '@/components/lms/PeriodeAkademikSelect';
import { toTahunAkademikId } from '@/lib/kelas';
import { lmsService } from '@/services/lms.service';
import { siakadService } from '@/services/siakad.service';
import {
  LmsQuizItem,
  TRYOUT_SORT_BY_OPTIONS,
  YA_TIDAK_OPTIONS,
} from '@/types/lms.types';
import {
  formatJadwal,
  getJendelaStatus,
  isJendelaTerbuka,
  jendelaTertutupPesan,
  fromDateTimeLocalValue,
  extractOptionValue,
} from '@/components/lms/tryout/tryoutHelpers';
import { SORT_ORDER_OPTIONS } from '@/lib/constants';
import { PaginationMeta } from '@/types/api.types';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Filter,
  RotateCcw,
  Check,
  ClipboardCheck,
  Clock,
  Plus,
  Play,
  CalendarDays,
  Settings,
  Eye,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

/**
 * Formulir AWAL pembuatan tryout — disengaja ramping (3 input, standar form:
 * ≤5 input dalam modal). Jadwal, durasi, soal, peserta, dan publikasi
 * dilengkapi di halaman Kelola Tryout setelah dibuat.
 */
const tryoutSchema = z.object({
  kelas_id: z.string().min(1, 'Kelas wajib dipilih.'),
  judul: z.string().min(1, 'Judul tryout wajib diisi.').max(255, 'Judul tryout maksimal 255 karakter.'),
  deskripsi: z.string().max(2000, 'Deskripsi maksimal 2000 karakter.').optional().default(''),
});

type TryoutFormValues = z.infer<typeof tryoutSchema>;

function jendelaBadge(dibuka?: string | null, ditutup?: string | null) {
  const s = getJendelaStatus(dibuka, ditutup);
  const variant = s.key === 'berlangsung' ? 'green' : s.key === 'belum' ? 'gray' : s.key === 'berakhir' ? 'red' : 'blue';
  return <Badge variant={variant}>{s.label}</Badge>;
}

export default function LmsTryoutListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

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
  const canManageTryout = hasPermission('siakad.kelas.manage');
  const [isTambahOpen, setIsTambahOpen] = useState<boolean>(false);
  const tryoutForm = useForm<TryoutFormValues>({
    resolver: zodResolver(tryoutSchema) as any,
    defaultValues: {
      kelas_id: '',
      judul: '',
      deskripsi: '',
    },
  });

  // Preset filter kelas dari query (?kelas_id=..) — link dari tab Tryout mahasiswa
  useEffect(() => {
    const q = searchParams.get('kelas_id');
    if (q) setFilterKelas(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Default ke periode aktif SIAKAD (sama seperti halaman /lms).
  const [periodeReady, setPeriodeReady] = useState<boolean>(false);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await siakadService.getTahunAkademiks();
        const rows: any[] = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
        const aktif = rows.find((t: any) => t.is_aktif || t.is_active);
        if (!cancelled && aktif) {
          setFilterTahunAkademik((prev) => prev || String(aktif.id));
        }
      } catch {
        // abaikan — user bisa pilih manual via PeriodeSwitcher
      } finally {
        if (!cancelled) setPeriodeReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
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
          tahun_akademik_id: toTahunAkademikId(filterTahunAkademik),
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
    if (!periodeReady) return;
    fetchData(meta.current_page, meta.per_page);
  }, [fetchData, meta.current_page, meta.per_page, periodeReady]);

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
      const res = await lmsService.createTryout(Number(values.kelas_id), {
        judul: values.judul,
        deskripsi: values.deskripsi || null,
      } as any);
      toast.success('Tryout dibuat sebagai Draft. Lengkapi jadwal, soal & peserta di halaman Kelola.');
      setIsTambahOpen(false);
      tryoutForm.reset({
        kelas_id: '',
        judul: '',
        deskripsi: '',
      });
      const newId = (res.data as any)?.id;
      if (newId) {
        router.push(`/lms/tryout/${newId}`);
        return;
      }
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
          {(row as any).kode_akses ? (
            <span className="text-2xs text-amber-600 inline-flex items-center gap-1 mt-1">
              <Lock size={12} /> Berkode
            </span>
          ) : null}
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
      key: 'jadwal',
      label: 'JADWAL',
      render: (row) => (
        <div>
          <span className="text-2xs text-slate-600 block">
            Buka: {formatJadwal(row.dibuka_at)}
          </span>
          <span className="text-2xs text-slate-500 block">
            Tutup: {formatJadwal(row.ditutup_at)}
          </span>
        </div>
      ),
    },
    {
      key: 'jendela',
      label: 'STATUS JENDELA',
      align: 'center',
      render: (row) => jendelaBadge(row.dibuka_at, row.ditutup_at),
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
                label: 'Kelola Tryout',
                icon: <Settings size={16} />,
                onClick: () => router.push(`/lms/tryout/${row.id}`),
              },
              {
                // Dosen TIDAK mengerjakan — hanya preview tampilan mahasiswa.
                label: 'Preview Soal',
                icon: <Eye size={16} />,
                onClick: () => router.push(`/lms/tryout/${row.id}?tab=preview`),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="w-full space-y-4">
      <PageHeader
        title="Tryout"
        description="Kumpulan tryout latihan dari seluruh kelas yang Anda ikuti atau ampu."
        breadcrumbs={[{ label: 'LMS', href: '/lms' }, { label: 'Tryout' }]}
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

      {/* PeriodeSwitcher */}
      <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'var(--module-primary-subtle)', color: 'var(--module-primary)' }}
          >
            <CalendarDays size={16} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800">Periode Akademik</div>
            <div className="text-2xs text-slate-500">Kosongkan = semua periode</div>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <PeriodeAkademikSelect
            label=""
            placeholder="Semua periode SIAKAD..."
            value={filterTahunAkademik}
            onChange={(val) => setFilterTahunAkademik(val)}
          />
        </div>
      </div>

      {canManageTryout ? (
        <DataTable
          columns={columns}
          data={rows}
          isLoading={isLoading}
          meta={meta}
          onPageChange={(p) => fetchData(p, meta.per_page)}
          onLimitChange={(lim) => fetchData(1, lim)}
          emptyMessage="Belum ada tryout yang tersedia untuk kelas Anda."
        />
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 bg-white rounded-xl border border-slate-200 animate-pulse space-y-2">
              <div className="h-4 bg-slate-100 rounded w-2/3" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="p-4 bg-white rounded-xl border border-slate-200/80">
          <EmptyState title="Belum ada tryout" description="Belum ada tryout yang tersedia untuk kelas Anda." />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((t) => {
            const terbuka = t.is_published && isJendelaTerbuka(t.dibuka_at, t.ditutup_at);
            const pesanTutup = !t.is_published
              ? 'Tryout belum dipublish oleh dosen.'
              : jendelaTertutupPesan(t.dibuka_at, t.ditutup_at);
            return (
              <div key={t.id} className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h5 className="text-xs font-bold text-slate-900 line-clamp-2">{t.judul}</h5>
                  <Badge variant={t.is_published ? 'green' : 'amber'}>
                    {t.is_published ? 'Terbit' : 'Draft'}
                  </Badge>
                </div>
                <p className="text-2xs text-slate-500">
                  {t.kelas?.mata_kuliah?.nama || t.kelas?.nama_kelas || '-'}
                </p>
                <div className="flex items-center gap-4 text-2xs text-slate-500">
                  <span className="flex items-center gap-2">
                    <Clock size={14} /> {t.durasi_menit ?? '-'} mnt
                  </span>
                  <span className="flex items-center gap-2">
                    <ClipboardCheck size={14} /> {t.soal_count ?? 0} soal
                  </span>
                  {(t as any).kode_akses ? (
                    <span className="flex items-center gap-1 text-amber-600">
                      <Lock size={14} /> Berkode
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
                  <div className="text-2xs text-slate-500">
                    <span className="block">Buka: {formatJadwal(t.dibuka_at)}</span>
                    <span className="block">Tutup: {formatJadwal(t.ditutup_at)}</span>
                  </div>
                  {jendelaBadge(t.dibuka_at, t.ditutup_at)}
                </div>
                {!terbuka ? (
                  <p className="text-2xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2">
                    {pesanTutup}
                  </p>
                ) : null}
                {terbuka ? (
                  <Link href={`/lms/${t.kelas_id}/quiz/${t.id}`}>
                    <Button size="sm" className="w-full" icon={<Play size={16} />}>
                      Mulai
                    </Button>
                  </Link>
                ) : (
                  <Button size="sm" className="w-full" icon={<Play size={16} />} disabled>
                    Mulai
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

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

          <PeriodeAkademikSelect
            label="Tahun Akademik"
            placeholder="Semua periode..."
            value={filterTahunAkademik}
            onChange={(val) => setFilterTahunAkademik(val)}
          />

          <KelasSelect value={filterKelas} onChange={(val) => setFilterKelas(extractOptionValue(val))} />

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
        size="lg"
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
        <form onSubmit={tryoutForm.handleSubmit(onSimpanTryout)} className="grid grid-cols-1 gap-4">
          <Controller
            name="kelas_id"
            control={tryoutForm.control}
            render={({ field }) => (
              <KelasSelect
                label="Kelas"
                placeholder="Pilih kelas..."
                required
                value={field.value}
                onChange={(val) => field.onChange(extractOptionValue(val))}
                error={tryoutForm.formState.errors.kelas_id?.message}
              />
            )}
          />

          <Input
            label="Judul Tryout"
            required
            placeholder="cth: Tryout UTS Genap"
            error={tryoutForm.formState.errors.judul?.message}
            {...tryoutForm.register('judul')}
          />

          <Textarea
            label="Deskripsi"
            placeholder="Petunjuk pengerjaan untuk mahasiswa..."
            error={tryoutForm.formState.errors.deskripsi?.message}
            {...tryoutForm.register('deskripsi')}
          />

          <p className="text-2xs text-slate-500">
            Jadwal, durasi, soal, peserta, dan publikasi diatur di halaman Kelola setelah tryout dibuat.
          </p>
        </form>
      </Modal>
    </div>
  );
}
