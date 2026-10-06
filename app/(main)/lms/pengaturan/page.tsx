'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Modal } from '@/components/ui/Modal';
import KelasSelect from '@/components/lms/KelasSelect';
import PeriodeAkademikSelect from '@/components/lms/PeriodeAkademikSelect';
import { toTahunAkademikId } from '@/lib/kelas';
import { lmsService } from '@/services/lms.service';
import {
  LmsKelasItem,
  METODE_ABSENSI_LABEL,
  LMS_SETTING_DEFAULT,
  PENGATURAN_SORT_BY_OPTIONS,
  PENGATURAN_STATUS_OPTIONS,
  METODE_ABSENSI_OPTIONS,
  MetodeAbsensi,
  PengaturanStatus,
} from '@/types/lms.types';
import { SORT_ORDER_OPTIONS } from '@/lib/constants';
import { PaginationMeta } from '@/types/api.types';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Filter, RotateCcw, Check, Settings, SlidersHorizontal, Users, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Pemilih kelas untuk membuat konfigurasi LMS baru.
 *
 * Pengaturan LMS berlingkup kelas (satu baris = satu kelas), jadi "Tambah Data"
 * berarti memilih kelas lalu diarahkan ke form konfigurasinya. Nilai yang dipakai
 * adalah `kelas.id`, bukan nama/kode kelas.
 */
const pengaturanSchema = z.object({
  kelas_id: z.string().min(1, 'Kelas wajib dipilih.'),
});

type PengaturanFormValues = z.infer<typeof pengaturanSchema>;

export default function LmsPengaturanListPage() {
  const router = useRouter();

  const [rows, setRows] = useState<LmsKelasItem[]>([]);
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
  // Paritas 1:1 dengan kolom tabel: kolom METODE ABSENSI dan KONFIGURASI
  // harus punya filter-nya masing-masing, bukan hanya pencarian free-text.
  const [filterMetodeAbsensi, setFilterMetodeAbsensi] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterOrderBy, setFilterOrderBy] = useState<string>('kode_kelas');
  const [filterOrderDir, setFilterOrderDir] = useState<string>('asc');

  const [isTambahOpen, setIsTambahOpen] = useState<boolean>(false);
  const pengaturanForm = useForm<PengaturanFormValues>({
    resolver: zodResolver(pengaturanSchema),
    defaultValues: { kelas_id: '' },
  });

  const fetchData = useCallback(
    async (page = 1, perPage = 10) => {
      setIsLoading(true);
      try {
        const res = await lmsService.indexPengaturan({
          page,
          per_page: perPage,
          search: filterSearch || undefined,
          sort_by: filterOrderBy || 'kode_kelas',
          sort_order: (filterOrderDir as 'asc' | 'desc') || 'asc',
          tahun_akademik_id: toTahunAkademikId(filterTahunAkademik),
          metode_absensi: (filterMetodeAbsensi || undefined) as MetodeAbsensi | undefined,
          status_konfigurasi: (filterStatus || undefined) as PengaturanStatus | undefined,
        });

        if (res.status === 'success' && res.data) {
          setRows(res.data);
          if (res.meta) setMeta(res.meta);
        } else {
          setRows([]);
        }
      } catch (err: any) {
        toast.error(err.message || 'Gagal memuat daftar pengaturan LMS');
        setRows([]);
      } finally {
        setIsLoading(false);
      }
    },
    [
      filterSearch,
      filterOrderBy,
      filterOrderDir,
      filterTahunAkademik,
      filterMetodeAbsensi,
      filterStatus,
    ]
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
    setFilterMetodeAbsensi('');
    setFilterStatus('');
    setFilterOrderBy('kode_kelas');
    setFilterOrderDir('asc');
    setShowFilter(false);
  };

  const onPilihKelas = pengaturanForm.handleSubmit(async (values) => {
    setIsTambahOpen(false);
    router.push(`/lms/pengaturan/${values.kelas_id}/edit`);
  });

  const columns: ColumnDef<LmsKelasItem>[] = [
    {
      key: 'kelas',
      label: 'KELAS',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-800 text-xs block">{row.kode_kelas}</span>
          <span className="text-2xs text-slate-500 block">
            {row.mata_kuliah?.nama || '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'periode',
      label: 'PERIODE',
      render: (row) => (
        <div>
          <span className="text-xs text-slate-800 block">
            {row.tahun_akademik?.nama || '-'}
          </span>
          <span className="text-2xs text-slate-500 block">{row.nama_kelas}</span>
        </div>
      ),
    },
    {
      key: 'konfigurasi',
      label: 'KONFIGURASI',
      render: (row) => {
        // Kelas yang belum pernah dikonfigurasi → tampilkan nilai bawaan + badge.
        const setting = row.lms_setting;
        const metode = (setting?.metode_absensi ?? LMS_SETTING_DEFAULT.metode_absensi) as MetodeAbsensi;
        const total = setting?.total_pertemuan ?? LMS_SETTING_DEFAULT.total_pertemuan;

        return (
          <div className="inline-flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-700 bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
              {METODE_ABSENSI_LABEL[metode]}
            </span>
            <span className="text-2xs text-slate-500">{total} pertemuan</span>
            {!setting ? <Badge variant="amber">Belum dikonfigurasi</Badge> : null}
          </div>
        );
      },
    },
    {
      key: 'batas_hadir',
      label: 'BATAS HADIR',
      align: 'center',
      render: (row) => {
        const batas =
          row.lms_setting?.batas_min_hadir_persen ??
          LMS_SETTING_DEFAULT.batas_min_hadir_persen;
        return <span className="text-xs text-slate-700">{batas}%</span>;
      },
    },
    {
      key: 'pengunjung',
      label: 'MAHASISWA',
      align: 'center',
      render: (row) => (
        <div className="inline-flex items-center gap-1 text-xs text-slate-700 bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
          <Users size={16} className="text-slate-500" />
          <span>{row.mahasiswa_count ?? 0}</span>
        </div>
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
                label: 'Ubah Pengaturan LMS',
                icon: <SlidersHorizontal size={16} />,
                onClick: () => router.push(`/lms/pengaturan/${row.id}/edit`),
              },
              {
                label: 'Buka Detail Kelas',
                icon: <Settings size={16} />,
                onClick: () => router.push(`/lms/${row.id}`),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  const belumKonfigurasi = rows.filter((r) => !r.lms_setting).length;

  return (
    <div className="w-full flex flex-col space-y-4">
      <PageHeader
        title="Pengaturan LMS"
        description="Konfigurasi jumlah pertemuan, metode absensi, dan batas kehadiran untuk setiap kelas."
        breadcrumbs={[
          { label: 'LMS', href: '/lms' },
          { label: 'Pengaturan LMS' },
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
            <Button variant="primary" icon={<Plus size={16} />} onClick={() => setIsTambahOpen(true)}>
              Tambah Data
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <Settings size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-500">Total Kelas</div>
            <div className="text-lg font-bold text-slate-800">{meta.total}</div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <SlidersHorizontal size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-500">Belum Dikonfigurasi (halaman ini)</div>
            <div className="text-lg font-bold text-slate-800">{belumKonfigurasi}</div>
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
        emptyMessage="Belum ada kelas yang dapat dikonfigurasi."
      />

      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Pengaturan LMS"
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
            placeholder="Cari kode kelas, nama kelas, atau mata kuliah..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />

          <PeriodeAkademikSelect
            label="Tahun Akademik"
            placeholder="Semua periode..."
            value={filterTahunAkademik}
            onChange={(val) => setFilterTahunAkademik(val)}
          />

          <Select
            label="Metode Absensi"
            placeholder="Semua metode..."
            value={filterMetodeAbsensi}
            onChange={(val) => setFilterMetodeAbsensi(val ? String(val) : '')}
            options={METODE_ABSENSI_OPTIONS}
            isClearable
          />

          <Select
            label="Status Konfigurasi"
            placeholder="Semua status..."
            value={filterStatus}
            onChange={(val) => setFilterStatus(val ? String(val) : '')}
            options={PENGATURAN_STATUS_OPTIONS}
            isClearable
          />

          <div className="border-t border-slate-200 my-4" />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={filterOrderBy}
              onChange={(val) => setFilterOrderBy(val)}
              options={PENGATURAN_SORT_BY_OPTIONS}
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
        onClose={() => {
          setIsTambahOpen(false);
          pengaturanForm.reset({ kelas_id: '' });
        }}
        title="Konfigurasi Pengaturan LMS"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsTambahOpen(false)}>
              Batal
            </Button>
            <Button
              variant="primary"
              onClick={onPilihKelas}
              loading={pengaturanForm.formState.isSubmitting}
              disabled={pengaturanForm.formState.isSubmitting}
            >
              Simpan
            </Button>
          </div>
        }
      >
        <form onSubmit={onPilihKelas}>
          <Controller
            name="kelas_id"
            control={pengaturanForm.control}
            render={({ field }) => (
              <KelasSelect
                label="Kelas"
                placeholder="Pilih kelas yang akan dikonfigurasi..."
                required
                value={field.value}
                onChange={(val) => field.onChange(val ? String(val) : '')}
                error={pengaturanForm.formState.errors.kelas_id?.message}
              />
            )}
          />
          <p className="text-2xs text-slate-500 mt-2">
            Anda akan diarahkan ke form konfigurasi untuk kelas tersebut.
          </p>
        </form>
      </Modal>
    </div>
  );
}
