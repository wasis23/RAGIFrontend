'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Filter, Plus, CheckCircle2, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Textarea } from '@/components/ui/Textarea';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PeriodeSelector } from '@/components/siakad/PeriodeSelector';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

const cutiSchema = z.object({
  mahasiswa_id: z.number({ error: 'Mahasiswa wajib dipilih' }).min(1, 'Mahasiswa wajib dipilih'),
  tahun_akademik_id: z.number({ error: 'Periode wajib dipilih' }).min(1, 'Periode wajib dipilih'),
  alasan: z.string().min(10, 'Alasan minimal 10 karakter').max(1000, 'Alasan maksimal 1000 karakter'),
  file_surat: z.string().nullable().optional(),
});

type CutiValues = z.infer<typeof cutiSchema>;
type TabKey = 'pengajuan' | 'riwayat';

const CUTI_STATUS_OPTIONS = [
  { value: 'pending', label: 'Menunggu' },
  { value: 'disetujui', label: 'Disetujui' },
  { value: 'ditolak', label: 'Ditolak' },
];

const STATUS_META: Record<string, { label: string; variant: 'amber' | 'green' | 'red' | 'gray' }> = {
  pending: { label: 'Menunggu', variant: 'amber' },
  disetujui: { label: 'Disetujui', variant: 'green' },
  ditolak: { label: 'Ditolak', variant: 'red' },
};

export default function CutiPage() {
  const [tab, setTab] = useState<TabKey>('pengajuan');
  const [data, setData] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(undefined);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSortBy, setFilterSortBy] = useState('created_at');
  const [filterSortDir, setFilterSortDir] = useState('desc');
  const [applied, setApplied] = useState<{ search: string; status: string; tahun_akademik_id: number | null; sort_by: string; sort_order: string }>({ search: '', status: '', tahun_akademik_id: null, sort_by: 'created_at', sort_order: 'desc' });
  const [draftTaId, setDraftTaId] = useState<number | null>(null);

  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const [isTambahOpen, setIsTambahOpen] = useState(false);
  const [prosesItem, setProsesItem] = useState<{ row: any; status: 'disetujui' | 'ditolak' } | null>(null);
  const [processing, setProcessing] = useState(false);

  const { register, control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CutiValues>({
    resolver: zodResolver(cutiSchema),
    defaultValues: { mahasiswa_id: 0, tahun_akademik_id: 0, alasan: '', file_surat: null },
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await siakadService.getCutiList({
        search: applied.search || undefined,
        status: applied.status || undefined,
        tahun_akademik_id: applied.tahun_akademik_id || undefined,
        sort_by: applied.sort_by || undefined,
        sort_order: applied.sort_order || undefined,
        page,
        per_page: 15,
      });
      setData(res.data || []);
      setMeta((res as any).meta);
    } catch {
      toast.error('Gagal memuat pengajuan cuti');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await siakadService.getStatusLog({ page: 1, per_page: 25 });
      setLogs(res.data || []);
    } catch {
      toast.error('Gagal memuat riwayat status');
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (tab === 'pengajuan') fetchData();
    else fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, page, applied]);

  const loadMahasiswaOptions = async (keyword: string) => {
    try {
      const res = await siakadService.getMahasiswas({ per_page: 30, search: keyword || undefined });
      const list: any[] = res.data || [];
      return list.map((m: any) => ({
        value: m.id,
        label: `${m.nama_lengkap} — ${m.nim}`,
        sublabel: m.program_studi?.nama || '',
        raw: m,
      }));
    } catch {
      return [];
    }
  };

  const onTambah = async (values: CutiValues) => {
    try {
      await siakadService.createCuti({
        mahasiswa_id: values.mahasiswa_id,
        tahun_akademik_id: values.tahun_akademik_id,
        alasan: values.alasan,
        file_surat: values.file_surat || undefined,
      });
      toast.success('Pengajuan cuti dibuat, menunggu persetujuan BAAK');
      setIsTambahOpen(false);
      reset({ mahasiswa_id: 0, tahun_akademik_id: 0, alasan: '', file_surat: null });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal membuat pengajuan cuti');
    }
  };

  const handleProses = async () => {
    if (!prosesItem) return;
    try {
      setProcessing(true);
      await siakadService.prosesCuti(prosesItem.row.id, { status: prosesItem.status });
      toast.success(prosesItem.status === 'disetujui' ? 'Cuti disetujui, status mahasiswa menjadi cuti' : 'Pengajuan cuti ditolak');
      setProsesItem(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memproses cuti');
    } finally {
      setProcessing(false);
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      key: 'mhs',
      label: 'NIM & NAMA',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{row.mahasiswa?.nama_lengkap || '-'}</span>
          <span className="font-mono text-2xs text-slate-500">{row.mahasiswa?.nim || '-'}</span>
        </div>
      ),
    },
    {
      key: 'alasan',
      label: 'ALASAN',
      render: (row) => <span className="text-xs text-slate-700 line-clamp-2">{row.alasan}</span>,
    },
    {
      key: 'status',
      label: 'STATUS',
      align: 'center',
      render: (row) => {
        const m = STATUS_META[row.status] || { label: row.status, variant: 'gray' as const };
        return <Badge variant={m.variant} className="text-2xs font-bold">{m.label}</Badge>;
      },
    },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <DropdownMenu
          items={
            row.status === 'pending'
              ? [
                  { label: 'Setujui Cuti', icon: <CheckCircle2 size={14} />, onClick: () => setProsesItem({ row, status: 'disetujui' }) },
                  { label: 'Tolak Pengajuan', icon: <XCircle size={14} />, variant: 'danger' as const, onClick: () => setProsesItem({ row, status: 'ditolak' }) },
                ]
              : [{ label: 'Sudah diproses', icon: <CheckCircle2 size={14} />, onClick: () => {} }]
          }
        />
      ),
    },
  ];

  const logColumns: ColumnDef<any>[] = [
    {
      key: 'mhs',
      label: 'MAHASISWA',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{row.mahasiswa?.nama_lengkap || `#${row.mahasiswa_id}`}</span>
          <span className="text-2xs text-slate-500">{row.created_at ? new Date(row.created_at).toLocaleDateString('id-ID') : '-'}</span>
        </div>
      ),
    },
    {
      key: 'perubahan',
      label: 'PERUBAHAN STATUS',
      render: (row) => (
        <span className="text-xs">
          <Badge variant="gray" className="text-2xs">{row.status_lama || '-'}</Badge>
          <span className="mx-1">→</span>
          <Badge variant="blue" className="text-2xs">{row.status_baru || '-'}</Badge>
        </span>
      ),
    },
    {
      key: 'alasan',
      label: 'ALASAN',
      render: (row) => <span className="text-xs text-slate-600 line-clamp-2">{row.alasan || '-'}</span>,
    },
  ];

  const tabBtn = (key: TabKey, label: string) => (
    <button
      key={key}
      onClick={() => setTab(key)}
      className={`px-5 py-3 text-xs font-extrabold border-b-2 transition -mb-px cursor-pointer ${
        tab === key ? 'border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle)] rounded-t-lg border-b-2' : 'border-transparent text-slate-500 hover:text-slate-900'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cuti Mahasiswa"
        description="Pengajuan cuti akademik, persetujuan BAAK (status mahasiswa otomatis menjadi cuti), dan riwayat perubahan status."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Cuti Mahasiswa' },
        ]}
        action={
          <div className="flex items-center gap-2">
            {tab === 'pengajuan' && (
              <Button variant="outline" icon={<Filter size={15} />} className="font-bold text-xs min-h-[38px]" style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }} onClick={() => { setDraftTaId(applied.tahun_akademik_id); setShowFilter(true); }}>
                Filter
              </Button>
            )}
            {tab === 'pengajuan' && (
              <Button variant="primary" icon={<Plus size={15} />} className="font-bold text-xs min-h-[38px]" onClick={() => setIsTambahOpen(true)}>
                Ajukan Cuti
              </Button>
            )}
          </div>
        }
      />

      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto">
        {tabBtn('pengajuan', 'Pengajuan Cuti')}
        {tabBtn('riwayat', 'Riwayat Status')}
      </div>

      {tab === 'pengajuan' && (
        <DataTable columns={columns} data={data} meta={meta} isLoading={loading} emptyMessage="Belum ada pengajuan cuti." />
      )}
      {tab === 'riwayat' && (
        <DataTable columns={logColumns} data={logs} isLoading={loadingLogs} emptyMessage="Belum ada riwayat perubahan status." />
      )}

      <Drawer open={showFilter} onClose={() => setShowFilter(false)} title="Filter Pengajuan Cuti">
        <div className="flex flex-col gap-5">
          <PeriodeSelector value={draftTaId} onChange={(id) => setDraftTaId(id)} />
          <Input label="Pencarian" placeholder="Cari NIM / nama..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select
            label="Status"
            placeholder="Semua Status"
            options={CUTI_STATUS_OPTIONS}
            value={filterStatus || ''}
            onChange={(v: any) => setFilterStatus(String(v || ''))}
            isClearable
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urutkan"
              options={[
                { value: 'mahasiswa', label: 'Nama Mahasiswa' },
                { value: 'created_at', label: 'Tanggal' },
                { value: 'updated_at', label: 'Diperbarui' },
                { value: 'id', label: 'ID' },
              ]}
              value={filterSortBy || 'created_at'}
              onChange={(v: any) => setFilterSortBy(String(v || 'created_at'))}
            />
            <Select
              label="Arah"
              options={[
                { value: 'desc', label: 'Terbaru' },
                { value: 'asc', label: 'Terlama' },
              ]}
              value={filterSortDir || 'desc'}
              onChange={(v: any) => setFilterSortDir(String(v || 'desc'))}
            />
          </div>
          <Button
            variant="primary"
            onClick={() => {
              setApplied({ search, status: filterStatus, tahun_akademik_id: draftTaId, sort_by: filterSortBy, sort_order: filterSortDir });
              setPage(1);
              setShowFilter(false);
            }}
          >
            Terapkan
          </Button>
        </div>
      </Drawer>

      <Modal open={isTambahOpen} onClose={() => setIsTambahOpen(false)} title="Pengajuan Cuti Baru">
        <form onSubmit={handleSubmit(onTambah)} noValidate className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Controller
                name="mahasiswa_id"
                control={control}
                render={({ field }) => (
                  <AsyncSelect
                    label="Mahasiswa"
                    required
                    placeholder="Cari NIM / nama..."
                    loadOptions={loadMahasiswaOptions}
                    value={field.value || null}
                    onChange={(opt: any) => field.onChange(opt?.value ? Number(opt.value) : 0)}
                    error={errors.mahasiswa_id?.message}
                  />
                )}
              />
            </div>
            <Controller
              name="tahun_akademik_id"
              control={control}
              render={({ field }) => (
                <PeriodeSelector
                  value={field.value || null}
                  onChange={(id) => field.onChange(id)}
                  required
                  error={errors.tahun_akademik_id?.message}
                />
              )}
            />
            <Input label="Path Surat (opsional)" placeholder="cth. cuti/2026/surat.pdf" error={errors.file_surat?.message} {...register('file_surat')} />
            <div className="md:col-span-2">
              <Textarea label="Alasan Cuti" required placeholder="Tuliskan alasan pengajuan cuti..." error={errors.alasan?.message} {...register('alasan')} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsTambahOpen(false)}>Batal</Button>
            <Button type="submit" variant="primary" loading={isSubmitting} disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Ajukan Cuti'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!prosesItem}
        onClose={() => setProsesItem(null)}
        onConfirm={handleProses}
        title={prosesItem?.status === 'disetujui' ? 'Setujui Cuti?' : 'Tolak Pengajuan?'}
        message={
          prosesItem?.status === 'disetujui'
            ? `Status ${prosesItem?.row.mahasiswa?.nama_lengkap} akan diubah menjadi cuti dan KRS diblokir.`
            : `Pengajuan cuti ${prosesItem?.row.mahasiswa?.nama_lengkap} akan ditolak.`
        }
        confirmText={prosesItem?.status === 'disetujui' ? 'Ya, Setujui' : 'Ya, Tolak'}
        variant={prosesItem?.status === 'disetujui' ? 'primary' : 'danger'}
        isLoading={processing}
      />
    </div>
  );
}
