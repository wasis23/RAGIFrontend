'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Filter, Eye, CheckCircle2, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { SpmbStatusBadge, SpmbPaymentBadge } from '@/components/spmb/SpmbStatusBadge';
import { spmbService, type PendaftaranCalonMhs } from '@/services/spmb.service';
import type { PaginationMeta } from '@/types/api.types';

export default function PendaftarPage() {
  const router = useRouter();
  const [data, setData] = useState<PendaftaranCalonMhs[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination & Filters State
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(15);
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined);
  
  const [showFilter, setShowFilter] = useState(false);
  const [filterNoPendaftaran, setFilterNoPendaftaran] = useState('');
  const [filterNama, setFilterNama] = useState('');
  const [filterProdi, setFilterProdi] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterOrderBy, setFilterOrderBy] = useState('created_at');
  const [filterOrderDir, setFilterOrderDir] = useState<'asc' | 'desc'>('desc');

  const [appliedFilters, setAppliedFilters] = useState({
    noPendaftaran: '',
    nama: '',
    prodi: '',
    status: '',
    orderBy: 'created_at',
    orderDir: 'desc' as 'asc' | 'desc',
  });

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [verifyingPendaftar, setVerifyingPendaftar] = useState<PendaftaranCalonMhs | null>(null);
  
  const [formData, setFormData] = useState<{ is_lulus: boolean | null; catatan: string }>({
    is_lulus: null,
    catatan: '',
  });

  const fetchPendaftar = async () => {
    setIsLoading(true);
    try {
      const params: any = { page, per_page: perPage };
      if (appliedFilters.status !== '') params.status = appliedFilters.status;
      if (appliedFilters.noPendaftaran !== '') params.no_pendaftaran = appliedFilters.noPendaftaran;
      if (appliedFilters.nama !== '') params.nama = appliedFilters.nama;
      if (appliedFilters.prodi !== '') params.program_studi = appliedFilters.prodi;
      if (appliedFilters.orderBy !== '') params.order_by = appliedFilters.orderBy;
      if (appliedFilters.orderDir) params.order_dir = appliedFilters.orderDir;

      const res: any = await spmbService.getPendaftaran(params);
      let pendaftarList: any[] = [];
      let rawMeta: any = null;

      if (Array.isArray(res)) {
        pendaftarList = res;
      } else if (Array.isArray(res?.data)) {
        pendaftarList = res.data;
        rawMeta = res;
      } else if (Array.isArray(res?.data?.data)) {
        pendaftarList = res.data.data;
        rawMeta = res.data;
      } else if (Array.isArray(res?.data?.data?.data)) {
        pendaftarList = res.data.data.data;
        rawMeta = res.data.data;
      }

      setData(pendaftarList);
      const calculatedTotal = rawMeta?.total ?? pendaftarList.length;
      setMeta({
        current_page: rawMeta?.current_page || page,
        last_page: rawMeta?.last_page || 1,
        per_page: rawMeta?.per_page || perPage,
        total: calculatedTotal,
        from: rawMeta?.from || (pendaftarList.length > 0 ? (page - 1) * perPage + 1 : 0),
        to: rawMeta?.to || Math.min(page * perPage, calculatedTotal),
      });
    } catch {
      toast.error('Gagal memuat data pendaftar. Periksa koneksi ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendaftar();
  }, [page, perPage, appliedFilters]);

  const handleOpenVerify = (pendaftar: PendaftaranCalonMhs) => {
    setVerifyingPendaftar(pendaftar);
    setFormData({
      is_lulus: null,
      catatan: '',
    });
    setShowModal(true);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyingPendaftar) return;
    if (formData.is_lulus === null) {
      toast.error('Pilih status kelulusan.');
      return;
    }

    try {
      await spmbService.updateStatusPendaftaran(verifyingPendaftar.id, {
        status: formData.is_lulus ? 'lulus_administrasi' : 'gagal_administrasi',
        catatan_verifikasi: formData.catatan,
      });
      toast.success('Verifikasi berhasil disimpan!');
      fetchPendaftar();
      setShowModal(false);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Gagal menyimpan verifikasi. Periksa koneksi ke server.';
      toast.error(errorMsg);
    }
  };

  const columns: ColumnDef<PendaftaranCalonMhs>[] = [
    { 
      key: 'no_pendaftaran', 
      label: 'No. Pendaftaran', 
      render: (row) => (
        <span className="font-mono font-bold text-slate-800 text-xs bg-slate-100 px-2 py-1 rounded border border-slate-200">
          {row.no_pendaftaran}
        </span>
      )
    },
    { 
      key: 'nama_lengkap', 
      label: 'Nama Pendaftar', 
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 text-sm">{row.nama_lengkap}</span>
          <span className="text-xs text-slate-500">NIK: {row.nik || '-'}</span>
        </div>
      )
    },
    { 
      key: 'program_studi', 
      label: 'Program Studi Pilihan', 
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800 text-xs">
            1. {row.program_studi?.nama || '-'}
          </span>
          {row.program_studi_pilihan2?.nama && (
            <span className="text-2xs text-slate-500">
              2. {row.program_studi_pilihan2.nama}
            </span>
          )}
        </div>
      )
    },
    { 
      key: 'status', 
      label: 'Status Pendaftaran & Pembayaran', 
      render: (row) => (
        <div className="flex flex-col items-start gap-1">
          <SpmbStatusBadge status={row.status} />
          <SpmbPaymentBadge status={row.status_pembayaran} />
        </div>
      )
    },
    { 
      key: 'actions', 
      label: 'Aksi', 
      align: 'right', 
      render: (row) => (
        <DropdownMenu
          items={[
            {
              label: 'Verifikasi Berkas',
              icon: <Eye size={15} />,
              onClick: () => router.push(`/spmb/pendaftaran/${row.id}`)
            },
            {
              label: 'Keputusan Kelulusan',
              icon: <CheckCircle2 size={15} />,
              onClick: () => handleOpenVerify(row)
            }
          ]}
        />
      )
    }
  ];

  return (
    <div className="animate-fade-in flex flex-col gap-7">
      <PageHeader
        title="Verifikasi Pendaftar (SPMB)"
        description="Kelola dan verifikasi administrasi calon mahasiswa"
        action={
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-50 border border-primary-100 text-primary-700 font-extrabold text-xs">
              <Award size={14} />
              {meta?.total ?? data.length} Pendaftar
            </span>

            <Button 
              variant="outline"
              icon={<Filter size={16} />} 
              onClick={() => setShowFilter(true)}
              style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
            >
              Filter
            </Button>
          </div>
        }
      />

      <div className="w-full bg-white rounded-xl shadow-2xs border border-slate-200">
        <DataTable
          columns={columns}
          data={data}
          isLoading={isLoading}
          meta={meta}
          onPageChange={(p) => setPage(p)}
          onLimitChange={(l) => { setPerPage(l); setPage(1); }}
        />
      </div>

      {/* Filter Drawer */}
      <Drawer
        position="right"
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter & Urutkan Pendaftar"
        footer={
          <div className="flex justify-end gap-2">
            <Button 
              variant="secondary" 
              onClick={() => {
                setFilterNoPendaftaran('');
                setFilterNama('');
                setFilterProdi('');
                setFilterStatus('');
                setFilterOrderBy('created_at');
                setFilterOrderDir('desc');
                setAppliedFilters({
                  noPendaftaran: '',
                  nama: '',
                  prodi: '',
                  status: '',
                  orderBy: 'created_at',
                  orderDir: 'desc',
                });
                setPage(1);
                setShowFilter(false);
              }}
            >
              Reset
            </Button>
            <Button 
              variant="primary" 
              onClick={() => {
                setAppliedFilters({
                  noPendaftaran: filterNoPendaftaran,
                  nama: filterNama,
                  prodi: filterProdi,
                  status: filterStatus,
                  orderBy: filterOrderBy,
                  orderDir: filterOrderDir,
                });
                setPage(1);
                setShowFilter(false);
              }}
            >
              Terapkan
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="No. Pendaftaran"
            placeholder="Cari nomor pendaftaran..."
            value={filterNoPendaftaran}
            onChange={(e) => setFilterNoPendaftaran(e.target.value)}
          />

          <Input
            label="Nama Pendaftar"
            placeholder="Cari nama calon mahasiswa..."
            value={filterNama}
            onChange={(e) => setFilterNama(e.target.value)}
          />

          <Input
            label="Program Studi Pilihan"
            placeholder="Cari nama prodi pilihan..."
            value={filterProdi}
            onChange={(e) => setFilterProdi(e.target.value)}
          />

          <Select 
            label="Status Pendaftaran"
            value={filterStatus}
            onChange={(val) => setFilterStatus(val)}
            options={[
              { value: '', label: 'Semua Status' },
              { value: 'draft', label: 'Draft' },
              { value: 'submitted', label: 'Submitted' },
              { value: 'verified', label: 'Verified' },
              { value: 'lulus_administrasi', label: 'Lulus Administrasi' },
              { value: 'gagal_administrasi', label: 'Gagal Administrasi' },
            ]}
          />

          <hr className="border-slate-200" />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={filterOrderBy}
              onChange={(val) => setFilterOrderBy(val)}
              options={[
                { value: 'id', label: 'ID Pendaftar' },
                { value: 'no_pendaftaran', label: 'No. Pendaftaran' },
                { value: 'nama_lengkap', label: 'Nama Pendaftar' },
                { value: 'program_studi', label: 'Program Studi Pilihan' },
                { value: 'status', label: 'Status Pendaftaran' },
                { value: 'created_at', label: 'Tanggal Daftar' },
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

      {/* Modal Verifikasi */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Verifikasi Administrasi Pendaftar"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Batal</Button>
            <Button variant="primary" onClick={handleVerify}>Simpan Verifikasi</Button>
          </>
        }
      >
        {verifyingPendaftar && (
          <form onSubmit={handleVerify} className="flex flex-col gap-4">
            <div className="bg-gray-50 p-4 rounded-md mb-4 border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Pendaftar</p>
              <p className="font-semibold">{verifyingPendaftar.nama_lengkap} ({verifyingPendaftar.no_pendaftaran})</p>
            </div>
            
            <Select
              label="Keputusan Kelulusan Administrasi"
              required
              value={formData.is_lulus === null ? '' : formData.is_lulus ? 'true' : 'false'}
              onChange={(val) => setFormData({ ...formData, is_lulus: val === 'true' })}
              options={[
                { value: '', label: '-- Pilih Keputusan --' },
                { value: 'true', label: 'Lulus Administrasi' },
                { value: 'false', label: 'Gagal Administrasi' },
              ]}
            />

            <Textarea
              label="Catatan Verifikasi (Opsional)"
              rows={3}
              placeholder="Berikan catatan jika diperlukan..."
              value={formData.catatan}
              onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
            />
          </form>
        )}
      </Modal>
    </div>
  );
}
