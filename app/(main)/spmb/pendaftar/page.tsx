'use client';

import { useState, useEffect } from 'react';
import { Filter, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { spmbService, type PendaftaranCalonMhs } from '@/services/spmb.service';
import type { PaginationMeta } from '@/types/api.types';

export default function PendaftarPage() {
  const [data, setData] = useState<PendaftaranCalonMhs[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination & Filters State
  const [page, setPage] = useState<number>(1);
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined);
  const [filterLimit, setFilterLimit] = useState<string>('15');
  
  const [showFilter, setShowFilter] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('');

  const [appliedFilters, setAppliedFilters] = useState({
    status: '',
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
      const params: any = { page };
      if (appliedFilters.status !== '') params.status = appliedFilters.status;
      if (filterLimit !== '') params.limit = filterLimit;

      const res: any = await spmbService.getPendaftaran(params);
      let pendaftarList = [];
      let metaData = undefined;

      if (res && Array.isArray(res.data) && 'current_page' in res) {
        pendaftarList = res.data;
        metaData = {
          current_page: res.current_page,
          last_page: res.last_page,
          per_page: res.per_page,
          total: res.total,
          from: res.from,
          to: res.to
        };
      } else if (res && res.data && Array.isArray(res.data.items)) {
        pendaftarList = res.data.items;
        metaData = res.data.meta;
      } else if (res && Array.isArray(res.data)) {
        pendaftarList = res.data;
      } else if (Array.isArray(res)) {
        pendaftarList = res;
      }

      setData(pendaftarList);
      setMeta(metaData);
    } catch {
      toast.error('Gagal memuat data pendaftar. Periksa koneksi ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendaftar();
  }, [page, filterLimit, appliedFilters.status]);

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': return <Badge variant="secondary">Draft</Badge>;
      case 'submitted': return <Badge variant="warning">Submitted</Badge>;
      case 'verified': return <Badge variant="info">Verified</Badge>;
      case 'lulus_administrasi': return <Badge variant="success">Lulus Adm</Badge>;
      case 'gagal_administrasi': return <Badge variant="danger">Gagal Adm</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const columns: ColumnDef<PendaftaranCalonMhs>[] = [
    { key: 'id', label: 'No', render: (row, index) => <span className="font-bold text-slate-400">{meta?.from ? meta.from + index : index + 1}</span> },
    { key: 'no_pendaftaran', label: 'No. Pendaftaran', render: (row) => (
      <span className="font-bold">
        {row.no_pendaftaran}
      </span>
    )},
    { key: 'nama_lengkap', label: 'Nama Lengkap', render: (row) => row.nama_lengkap },
    { key: 'nik', label: 'NIK', render: (row) => row.nik },
    { key: 'gelombang', label: 'Gelombang', render: (row) => row.gelombang_penerimaan?.nama || '-' },
    { key: 'status', label: 'Status', render: (row) => getStatusBadge(row.status) },
    { key: 'aksi', label: 'Aksi', align: 'right', render: (row) => (
      <div className="flex justify-end gap-2">
        {['submitted', 'verified'].includes(row.status) && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleOpenVerify(row)}
          >
            Verifikasi
          </Button>
        )}
      </div>
    )},
  ];

  return (
    <div className="animate-fade-in flex flex-col gap-7">
      <PageHeader
        title="Verifikasi Pendaftar (SPMB)"
        description="Kelola dan verifikasi administrasi calon mahasiswa"
        action={
          <div className="flex gap-2">
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

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        meta={meta}
        onPageChange={(p) => setPage(p)}
        onLimitChange={(l) => { setFilterLimit(l.toString()); setPage(1); }}
      />

      {/* Filter Drawer */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Pendaftar"
        footer={
          <div className="flex justify-end gap-3">
            <Button 
              variant="secondary" 
              onClick={() => {
                setFilterStatus('');
                setAppliedFilters({
                  status: '',
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
                  status: filterStatus,
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
        <div className="flex flex-col gap-5">
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
