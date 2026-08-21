'use client';

import { useEffect, useState, useCallback } from 'react';
import { Calendar, Plus, CheckCircle, XCircle, Filter, ShieldAlert } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { simpegService } from '@/services/simpeg.service';
import type { PengajuanCuti, JenisCuti, StatusApprovalCuti, Pegawai } from '@/types/simpeg.types';
import type { PaginationMeta } from '@/types/api.types';
import { useAuth } from '@/hooks/useAuth';

interface OptionType {
  value: string;
  label: string;
}

const cutiSchema = z.object({
  pegawai_id: z.string().min(1, 'Pegawai Pemohon wajib dipilih'),
  jenis_cuti: z.enum(['tahunan', 'sakit', 'alasan_penting', 'melahirkan', 'besar'], {
    message: 'Jenis Cuti wajib dipilih',
  }),
  tanggal_mulai: z.string().min(1, 'Tanggal Mulai wajib diisi'),
  tanggal_selesai: z.string().min(1, 'Tanggal Selesai wajib diisi'),
  jumlah_hari: z.number().min(1, 'Jumlah hari minimal 1'),
  alasan: z.string().min(1, 'Alasan pengajuan cuti wajib diisi'),
});

type CutiFormValues = z.infer<typeof cutiSchema>;

export default function CutiPage() {
  const { hasPermission } = useAuth();
  const canRead = hasPermission('simpeg.cuti.read') || hasPermission('simpeg.cuti.request') || hasPermission('simpeg.cuti.approve') || hasPermission('simpeg.cuti.manage');
  const canCreate = hasPermission('simpeg.cuti.create') || hasPermission('simpeg.cuti.request') || hasPermission('simpeg.cuti.manage');
  const canUpdate = hasPermission('simpeg.cuti.update') || hasPermission('simpeg.cuti.approve') || hasPermission('simpeg.cuti.manage');

  const [loading, setLoading] = useState(true);
  const [cutiList, setCutiList] = useState<PengajuanCuti[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();

  // Filter & Pagination state
  const [search, setSearch] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterOrderBy, setFilterOrderBy] = useState('tanggal_mulai');
  const [filterOrderDir, setFilterOrderDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [showFilter, setShowFilter] = useState(false);

  // Modal Request Cuti State
  const [showModalRequest, setShowModalRequest] = useState(false);
  const [selectedPegawaiOption, setSelectedPegawaiOption] = useState<OptionType | null>(null);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // Modal Process/Approval State
  const [showModalApproval, setShowModalApproval] = useState(false);
  const [selectedCuti, setSelectedCuti] = useState<PengajuanCuti | null>(null);
  const [catatanApproval, setCatatanApproval] = useState('');
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CutiFormValues>({
    resolver: zodResolver(cutiSchema),
    defaultValues: {
      pegawai_id: '',
      jenis_cuti: 'tahunan',
      tanggal_mulai: '',
      tanggal_selesai: '',
      jumlah_hari: 1,
      alasan: '',
    },
  });

  const loadCuti = useCallback(async () => {
    if (!canRead) return;
    setLoading(true);
    try {
      const res: any = await simpegService.getCutiList({
        page,
        limit,
        search: search || undefined,
        jenis_cuti: filterJenis || undefined,
        status_approval: filterStatus || undefined,
        sort_by: filterOrderBy,
        sort_dir: filterOrderDir,
      });

      if (res?.meta) {
        setCutiList(res.data || []);
        setMeta(res.meta);
      } else {
        let items: PengajuanCuti[] = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        if (search) {
          const q = search.toLowerCase();
          items = items.filter(
            (c) =>
              c.alasan?.toLowerCase().includes(q) ||
              c.pegawai?.nama_lengkap?.toLowerCase().includes(q)
          );
        }
        if (filterJenis) {
          items = items.filter((c) => c.jenis_cuti === filterJenis);
        }
        if (filterStatus) {
          items = items.filter((c) => c.status_approval === filterStatus);
        }

        items.sort((a, b) => {
          let valA = (a as any)[filterOrderBy] ?? '';
          let valB = (b as any)[filterOrderBy] ?? '';
          if (typeof valA === 'string') valA = valA.toLowerCase();
          if (typeof valB === 'string') valB = valB.toLowerCase();

          if (valA < valB) return filterOrderDir === 'asc' ? -1 : 1;
          if (valA > valB) return filterOrderDir === 'asc' ? 1 : -1;
          return 0;
        });

        const totalItems = items.length;
        const totalPages = Math.ceil(totalItems / limit) || 1;
        const startIndex = (page - 1) * limit;
        const paginated = items.slice(startIndex, startIndex + limit);

        setCutiList(paginated);
        setMeta({
          current_page: page,
          last_page: totalPages,
          per_page: limit,
          total: totalItems,
          from: totalItems > 0 ? startIndex + 1 : 0,
          to: Math.min(startIndex + limit, totalItems),
        });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memuat Pengajuan Cuti');
    } finally {
      setLoading(false);
    }
  }, [canRead, page, limit, search, filterJenis, filterStatus, filterOrderBy, filterOrderDir]);

  useEffect(() => {
    loadCuti();
  }, [loadCuti]);

  // Async loader for Pegawai AsyncSelect
  const loadPegawaiOptions = useCallback(async (inputValue: string) => {
    try {
      const res: any = await simpegService.getPegawaiList();
      const list: Pegawai[] = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      const filtered = list.filter(
        (p: Pegawai) =>
          p.nama_lengkap.toLowerCase().includes(inputValue.toLowerCase()) ||
          (p.nip && p.nip.toLowerCase().includes(inputValue.toLowerCase()))
      );
      return filtered.map((p: Pegawai) => ({
        value: p.id.toString(),
        label: `[NIP: ${p.nip || '-'}] ${p.nama_lengkap}`,
      }));
    } catch (err) {
      console.error('Gagal memuat opsi pegawai', err);
      return [];
    }
  }, []);

  const handleOpenRequest = () => {
    if (!canCreate) {
      toast.error('Anda tidak memiliki permission untuk mengajukan Cuti.');
      return;
    }
    setSelectedPegawaiOption(null);
    reset({
      pegawai_id: '',
      jenis_cuti: 'tahunan',
      tanggal_mulai: '',
      tanggal_selesai: '',
      jumlah_hari: 1,
      alasan: '',
    });
    setShowModalRequest(true);
  };

  const onSubmitRequest = async (values: CutiFormValues) => {
    if (!canCreate) {
      toast.error('Akses Ditolak: Anda tidak memiliki permission mengajukan Cuti.');
      return;
    }

    setIsSubmittingRequest(true);
    try {
      const payload = {
        pegawai_id: Number(values.pegawai_id),
        jenis_cuti: values.jenis_cuti as JenisCuti,
        tanggal_mulai: values.tanggal_mulai,
        tanggal_selesai: values.tanggal_selesai,
        jumlah_hari: values.jumlah_hari,
        alasan: values.alasan,
      };

      await simpegService.createCuti(payload);
      toast.success('Pengajuan Cuti berhasil dikirim!');
      setShowModalRequest(false);
      loadCuti();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal mengajukan Cuti');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleOpenApprovalModal = (cuti: PengajuanCuti) => {
    if (!canUpdate) {
      toast.error('Anda tidak memiliki permission untuk memproses persetujuan Cuti.');
      return;
    }
    setSelectedCuti(cuti);
    setCatatanApproval('');
    setShowModalApproval(true);
  };

  const handleProcessApproval = async (status: StatusApprovalCuti) => {
    if (!selectedCuti || !canUpdate) {
      toast.error('Akses Ditolak: Anda tidak memiliki permission memproses persetujuan Cuti.');
      return;
    }

    setIsSubmittingApproval(true);
    try {
      await simpegService.updateStatusCuti(selectedCuti.id, status, catatanApproval);
      toast.success(`Pengajuan Cuti berhasil di-${status.toUpperCase()}! Notifikasi terkirim.`);
      setShowModalApproval(false);
      loadCuti();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memproses permohonan Cuti');
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const columns: ColumnDef<PengajuanCuti>[] = [
    {
      key: 'pegawai',
      label: 'Pemilik / Pegawai',
      render: (row) => <span className="font-bold">{row.pegawai?.nama_lengkap || `Pegawai ID ${row.pegawai_id}`}</span>,
    },
    {
      key: 'jenis_cuti',
      label: 'Jenis Cuti',
      render: (row) => (
        <Badge variant="purple" className="uppercase">
          {(row.jenis_cuti || 'tahunan').replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'periode',
      label: 'Tanggal Mulai - Selesai',
      render: (row) => `${row.tanggal_mulai} s/d ${row.tanggal_selesai}`,
    },
    {
      key: 'jumlah_hari',
      label: 'Lama Cuti',
      render: (row) => <span className="font-bold">{row.jumlah_hari} Hari</span>,
    },
    {
      key: 'alasan',
      label: 'Alasan',
      render: (row) => <span className="text-slate-600 text-xs">{row.alasan}</span>,
    },
    {
      key: 'status_approval',
      label: 'Status Approval',
      render: (row) => {
        const variant =
          row.status_approval === 'approved'
            ? 'green'
            : row.status_approval === 'rejected'
            ? 'red'
            : 'yellow';
        return (
          <Badge variant={variant} className="uppercase">
            {row.status_approval || 'pending'}
          </Badge>
        );
      },
    },
    {
      key: 'aksi',
      label: 'Aksi SDM',
      align: 'right',
      render: (row) => {
        if (!canUpdate) return '-';

        const menuItems: DropdownMenuItem[] = [
          {
            label: 'Proses Approval SDM',
            icon: <CheckCircle size={14} />,
            onClick: () => handleOpenApprovalModal(row),
          },
        ];

        return (
          <div className="flex justify-end">
            <DropdownMenu items={menuItems} />
          </div>
        );
      },
    },
  ];

  if (!canRead) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader
          title="Layanan & Pengajuan Cuti Pegawai"
          description="Permohonan Cuti Tahunan, Sakit, Alasan Penting, Melahirkan, dan Approval SDM"
        />
        <div className="card p-6 text-center">
          <ShieldAlert size={56} color="var(--danger)" className="mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2 text-slate-800">
            Akses Ditolak / Dibatasi
          </h2>
          <p className="text-slate-400 max-w-[500px] mx-auto">
            Peran Anda saat ini tidak memiliki hak akses (*permission*) untuk melihat layanan Cuti Pegawai.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Layanan & Pengajuan Cuti Pegawai"
        description="Permohonan Cuti Tahunan, Sakit, Alasan Penting, Melahirkan, dan Approval SDM"
        action={
          <div className="flex gap-2">
            {canCreate && (
              <Button icon={<Plus size={16} />} onClick={handleOpenRequest}>
                Ajukan Cuti Baru
              </Button>
            )}
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setShowFilter(true)}
            >
              Filter
            </Button>
          </div>
        }
      />

      {/* Main DataTable */}
      <DataTable
        columns={columns}
        data={cutiList}
        isLoading={loading}
        meta={meta}
        onPageChange={(newPage) => setPage(newPage)}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
        emptyMessage={
          <div className="py-8 text-center text-slate-400">
            <Calendar size={48} className="mx-auto mb-4 opacity-40" />
            <p>Belum ada data pengajuan cuti yang sesuai filter.</p>
          </div>
        }
      />

      {/* Filter Drawer Slide Right-to-Left */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter & Urutkan Pengajuan Cuti"
      >
        <div className="space-y-4">
          <Input
            label="Pencarian Nama / Alasan"
            placeholder="Cari nama pegawai, alasan..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />

          <Select
            label="Jenis Cuti"
            value={filterJenis}
            onChange={(val) => {
              setFilterJenis(val);
              setPage(1);
            }}
            options={[
              { value: '', label: 'Semua Jenis Cuti' },
              { value: 'tahunan', label: 'Cuti Tahunan' },
              { value: 'sakit', label: 'Cuti Sakit' },
              { value: 'alasan_penting', label: 'Cuti Alasan Penting' },
              { value: 'melahirkan', label: 'Cuti Melahirkan' },
              { value: 'besar', label: 'Cuti Besar' },
            ]}
          />

          <Select
            label="Status Approval"
            value={filterStatus}
            onChange={(val) => {
              setFilterStatus(val);
              setPage(1);
            }}
            options={[
              { value: '', label: 'Semua Status Approval' },
              { value: 'pending', label: 'Menunggu Approval (Pending)' },
              { value: 'approved', label: 'Disetujui (Approved)' },
              { value: 'rejected', label: 'Ditolak (Rejected)' },
            ]}
          />

          <hr className="border-t border-slate-200 my-2" />

          {/* Grid 2 Kolom Sorting */}
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={filterOrderBy}
              onChange={(val) => setFilterOrderBy(val)}
              options={[
                { value: 'tanggal_mulai', label: 'Tanggal Mulai' },
                { value: 'jenis_cuti', label: 'Jenis Cuti' },
                { value: 'status_approval', label: 'Status' },
                { value: 'id', label: 'ID' },
              ]}
            />
            <Select
              label="Arah"
              value={filterOrderDir}
              onChange={(val) => setFilterOrderDir(val as 'asc' | 'desc')}
              options={[
                { value: 'desc', label: 'Z - A (Terbaru)' },
                { value: 'asc', label: 'A - Z (Terlama)' },
              ]}
            />
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSearch('');
                setFilterJenis('');
                setFilterStatus('');
                setFilterOrderBy('tanggal_mulai');
                setFilterOrderDir('desc');
                setPage(1);
              }}
            >
              Reset Filter
            </Button>
            <Button onClick={() => setShowFilter(false)}>
              Terapkan
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Modal Request Cuti */}
      {canCreate && (
        <Modal
          open={showModalRequest}
          onClose={() => setShowModalRequest(false)}
          title="Formulir Pengajuan Cuti Online"
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowModalRequest(false)}>
                Batal
              </Button>
              <Button
                type="submit"
                loading={isSubmittingRequest}
                disabled={isSubmittingRequest}
                form="cuti-request-modal-form"
              >
                Kirim Pengajuan
              </Button>
            </>
          }
        >
          <form id="cuti-request-modal-form" onSubmit={handleSubmit(onSubmitRequest)} className="space-y-4">
            <Controller
              name="pegawai_id"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  label="Pilih Pegawai Pemohon"
                  required
                  placeholder="Cari nama pegawai / NIP..."
                  loadOptions={loadPegawaiOptions}
                  value={selectedPegawaiOption || (field.value ? { value: field.value, label: field.value } : null)}
                  onChange={(opt) => {
                    setSelectedPegawaiOption(opt);
                    field.onChange(opt ? opt.value : '');
                  }}
                  isClearable
                  error={errors.pegawai_id?.message}
                />
              )}
            />

            <Controller
              name="jenis_cuti"
              control={control}
              render={({ field }) => (
                <Select
                  label="Jenis Cuti"
                  required
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.jenis_cuti?.message}
                  options={[
                    { value: 'tahunan', label: 'Cuti Tahunan' },
                    { value: 'sakit', label: 'Cuti Sakit' },
                    { value: 'alasan_penting', label: 'Cuti Alasan Penting' },
                    { value: 'melahirkan', label: 'Cuti Melahirkan' },
                    { value: 'besar', label: 'Cuti Besar' },
                  ]}
                />
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Tanggal Mulai"
                type="date"
                required
                error={errors.tanggal_mulai?.message}
                {...register('tanggal_mulai')}
              />
              <Input
                label="Tanggal Selesai"
                type="date"
                required
                error={errors.tanggal_selesai?.message}
                {...register('tanggal_selesai')}
              />
            </div>

            <Input
              label="Jumlah Hari Cuti"
              type="number"
              required
              error={errors.jumlah_hari?.message}
              {...register('jumlah_hari', { valueAsNumber: true })}
            />

            <Controller
              name="alasan"
              control={control}
              render={({ field }) => (
                <Textarea
                  label="Alasan Pengajuan Cuti"
                  required
                  rows={3}
                  placeholder="Berikan alasan detail pengajuan cuti..."
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.alasan?.message}
                />
              )}
            />
          </form>
        </Modal>
      )}

      {/* Modal Process Approval SDM */}
      {canUpdate && (
        <Modal
          open={showModalApproval}
          onClose={() => setShowModalApproval(false)}
          title="Proses Persetujuan Cuti SDM"
          footer={
            <div className="flex gap-2 justify-end w-full">
              <Button
                variant="danger"
                loading={isSubmittingApproval}
                disabled={isSubmittingApproval}
                onClick={() => handleProcessApproval('rejected')}
              >
                <XCircle size={16} /> Tolak Cuti
              </Button>
              <Button
                variant="primary"
                loading={isSubmittingApproval}
                disabled={isSubmittingApproval}
                onClick={() => handleProcessApproval('approved')}
              >
                <CheckCircle size={16} /> Setujui Cuti
              </Button>
            </div>
          }
        >
          {selectedCuti && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm space-y-1">
                <div><strong>Pegawai:</strong> {selectedCuti.pegawai?.nama_lengkap || selectedCuti.pegawai_id}</div>
                <div><strong>Jenis:</strong> {(selectedCuti.jenis_cuti || 'TAHUNAN').toUpperCase()} ({selectedCuti.jumlah_hari} Hari)</div>
                <div><strong>Periode:</strong> {selectedCuti.tanggal_mulai} s/d {selectedCuti.tanggal_selesai}</div>
                <div><strong>Alasan:</strong> {selectedCuti.alasan}</div>
              </div>

              <Textarea
                label="Catatan Approval SDM (Dikirim via WA/Email)"
                rows={2}
                value={catatanApproval}
                onChange={(e) => setCatatanApproval(e.target.value)}
                placeholder="Contoh: Disetujui. Harap selesaikan serah terima tugas sebelum menjalani cuti."
              />
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
