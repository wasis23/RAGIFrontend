'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Plus, CheckCircle, XCircle, Filter, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { simpegService } from '@/services/simpeg.service';
import type { PengajuanCuti, StatusApprovalCuti } from '@/types/simpeg.types';
import type { PaginationMeta } from '@/types/api.types';
import { useAuth } from '@/hooks/useAuth';

export default function CutiPage() {
  const { hasPermission } = useAuth();
  const canRead = hasPermission('simpeg.cuti.read') || hasPermission('simpeg.cuti.request') || hasPermission('simpeg.cuti.approve') || hasPermission('simpeg.cuti.manage');
  const canCreate = hasPermission('simpeg.cuti.create') || hasPermission('simpeg.cuti.request') || hasPermission('simpeg.cuti.manage');
  const canUpdate = hasPermission('simpeg.cuti.update') || hasPermission('simpeg.cuti.approve') || hasPermission('simpeg.cuti.manage');
  const router = useRouter();

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

  // Modal Process/Approval State
  const [showModalApproval, setShowModalApproval] = useState(false);
  const [selectedCuti, setSelectedCuti] = useState<PengajuanCuti | null>(null);
  const [catatanApproval, setCatatanApproval] = useState('');
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);

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

  const handleOpenRequest = () => {
    if (!canCreate) {
      toast.error('Anda tidak memiliki permission untuk mengajukan Cuti.');
      return;
    }
    router.push('/simpeg/cuti/pengajuan');
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
      label: 'Alasan & Lampiran',
      render: (row) => (
        <div className="space-y-1">
          <div className="text-slate-600 text-xs">{row.alasan}</div>
          {row.file_pendukung && (
            <a
              href={row.file_pendukung.startsWith('http') ? row.file_pendukung : `http://localhost:8000/${row.file_pendukung}`}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-primary-600 hover:underline font-semibold block"
            >
              📎 Liha Lampiran Izin
            </a>
          )}
        </div>
      ),
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
