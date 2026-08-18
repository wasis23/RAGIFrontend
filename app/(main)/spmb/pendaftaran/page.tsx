'use client';

import { useState, useEffect, useCallback } from 'react';
import { Eye, Filter, CheckCircle, XCircle } from 'lucide-react';
import { spmbService, PendaftaranCalonMhs, PendaftaranBerkas } from '@/services/spmb.service';
import toast from 'react-hot-toast';
import { DataTable } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

export default function DataPendaftarPage() {
  const [data, setData] = useState<PendaftaranCalonMhs[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Pagination & Filtering state
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [totalItems, setTotalItems] = useState(0);

  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterOrderBy, setFilterOrderBy] = useState('created_at');
  const [filterOrderDir, setFilterOrderDir] = useState('desc');
  
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    status: '',
    orderBy: 'created_at',
    orderDir: 'desc'
  });

  // Drawer state
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [selectedPendaftar, setSelectedPendaftar] = useState<PendaftaranCalonMhs | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Status update state
  const [updateStatusLoading, setUpdateStatusLoading] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [catatanVerifikasi, setCatatanVerifikasi] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await spmbService.getPendaftaran({
        page,
        per_page: perPage,
        search: appliedFilters.search,
        status: appliedFilters.status,
        order_by: appliedFilters.orderBy,
        order_dir: appliedFilters.orderDir
      });
      setData(res.data.data);
      setTotalItems(res.data.total);
    } catch (error: any) {
      toast.error(error.message || 'Gagal memuat data pendaftar');
    } finally {
      setLoading(false);
    }
  }, [page, perPage, appliedFilters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchDetail = async (id: number) => {
    try {
      setDetailLoading(true);
      const res = await spmbService.getPendaftaranDetail(id);
      setSelectedPendaftar(res.data);
      setNewStatus(res.data.status);
      setCatatanVerifikasi(res.data.catatan_verifikasi || '');
    } catch (error: any) {
      toast.error(error.message || 'Gagal memuat detail pendaftar');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenDetail = (row: PendaftaranCalonMhs) => {
    setSelectedPendaftar(null);
    setIsDetailDrawerOpen(true);
    fetchDetail(row.id);
  };

  const handleVerifyBerkas = async (berkasId: number, isVerified: boolean) => {
    try {
      await spmbService.verifyBerkasPendaftaran(berkasId, { is_verified: isVerified });
      toast.success(`Berkas berhasil ditandai sebagai ${isVerified ? 'Valid' : 'Tidak Valid'}`);
      // Refresh detail
      if (selectedPendaftar) {
        fetchDetail(selectedPendaftar.id);
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal memverifikasi berkas');
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedPendaftar) return;
    try {
      setUpdateStatusLoading(true);
      await spmbService.updateStatusPendaftaran(selectedPendaftar.id, { 
        status: newStatus, 
        catatan_verifikasi: catatanVerifikasi 
      });
      toast.success('Status pendaftar berhasil diperbarui');
      fetchData(); // Refresh list
      fetchDetail(selectedPendaftar.id); // Refresh detail
    } catch (error: any) {
      toast.error(error.message || 'Gagal memperbarui status');
    } finally {
      setUpdateStatusLoading(false);
    }
  };

  const statusColors: Record<string, { bg: string; color: string }> = {
    'draft': { bg: 'var(--bg-light)', color: 'var(--text-secondary)' },
    'submitted': { bg: 'var(--info-light)', color: 'var(--info-dark)' },
    'verified': { bg: 'var(--primary-100)', color: 'var(--primary-700)' },
    'lulus_administrasi': { bg: 'var(--success-light)', color: 'var(--success-dark)' },
    'gagal_administrasi': { bg: 'var(--danger-light)', color: 'var(--danger-dark)' },
  };

  const renderStatus = (val: string) => {
    const style = statusColors[val] || statusColors['draft'];
    return (
      <span style={{ 
        display: 'inline-block', 
        background: style.bg, 
        color: style.color, 
        padding: '2px 8px', 
        borderRadius: '4px', 
        fontSize: '0.75rem', 
        fontWeight: 700, 
        textTransform: 'uppercase' 
      }}>
        {val.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <PageHeader
        title="Data Pendaftar"
        description="Kelola dan verifikasi berkas calon mahasiswa baru"
        action={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button 
              style={{ backgroundColor: '#f97316', color: '#fff', border: 'none' }} 
              icon={<Filter size={16} />} 
              onClick={() => setShowFilter(true)}
            >
              Filter
            </Button>
          </div>
        }
      />

      <DataTable 
        data={data}
        loading={loading}
        columns={[
          { key: 'no_pendaftaran', label: 'No Pendaftaran', sortable: true },
          { key: 'nama_lengkap', label: 'Nama Lengkap', sortable: true },
          { key: 'program_studi', label: 'Program Studi Pilihan 1', render: (row) => row.program_studi?.nama || '-' },
          { key: 'status', label: 'Status', render: (row) => renderStatus(row.status) },
          { key: 'actions', label: 'Aksi', align: 'right', render: (row) => (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <Button variant="ghost" size="sm" icon={<Eye size={16} />} onClick={() => handleOpenDetail(row)}>
                Verifikasi
              </Button>
            </div>
          )}
        ]}
      />

      {/* Filter Drawer */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Pendaftar"
        footer={
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button 
              variant="secondary" 
              onClick={() => {
                setFilterSearch('');
                setFilterStatus('');
                setFilterOrderBy('created_at');
                setFilterOrderDir('desc');
                setAppliedFilters({
                  search: '',
                  status: '',
                  orderBy: 'created_at',
                  orderDir: 'desc'
                });
                setShowFilter(false);
                setPage(1);
              }}
            >
              Reset
            </Button>
            <Button 
              variant="primary" 
              onClick={() => {
                setAppliedFilters({
                  search: filterSearch,
                  status: filterStatus,
                  orderBy: filterOrderBy,
                  orderDir: filterOrderDir
                });
                setShowFilter(false);
                setPage(1);
              }}
            >
              Terapkan
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Input 
            label="Pencarian"
            placeholder="No pendaftaran atau nama..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />

          <Select 
            label="Status Pendaftaran"
            value={filterStatus}
            onChange={(val) => setFilterStatus(val)}
            options={[
              { value: '', label: 'Semua Status' },
              { value: 'draft', label: 'Draft' },
              { value: 'submitted', label: 'Submitted (Menunggu Verifikasi)' },
              { value: 'verified', label: 'Verified (Terverifikasi)' },
              { value: 'lulus_administrasi', label: 'Lulus Administrasi' },
              { value: 'gagal_administrasi', label: 'Gagal Administrasi' }
            ]}
          />
          
          <hr style={{ borderTop: '1px solid var(--border-light)', margin: '0.5rem 0' }} />

          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Urut Berdasarkan"
              value={filterOrderBy}
              onChange={(val) => setFilterOrderBy(val)}
              options={[
                { value: 'created_at', label: 'Tanggal Daftar' },
                { value: 'nama_lengkap', label: 'Nama Pendaftar' },
                { value: 'no_pendaftaran', label: 'No Pendaftaran' },
                { value: 'status', label: 'Status' }
              ]}
            />

            <Select 
              label="Arah"
              value={filterOrderDir}
              onChange={(val) => setFilterOrderDir(val)}
              options={[
                { value: 'asc', label: 'A - Z (Naik)' },
                { value: 'desc', label: 'Z - A (Turun)' }
              ]}
            />
          </div>
        </div>
      </Drawer>

      {/* Detail & Verification Drawer */}
      <Drawer
        open={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        title="Detail & Verifikasi Pendaftaran"
        size="lg"
      >
        {detailLoading || !selectedPendaftar ? (
          <div className="flex justify-center items-center h-48">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        ) : (
          <div className="space-y-6 p-4">
            {/* Header info */}
            <div className="bg-base-200 p-4 rounded-lg flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold">{selectedPendaftar.nama_lengkap}</h3>
                <p className="text-sm text-gray-500">No. Pendaftaran: {selectedPendaftar.no_pendaftaran}</p>
                <p className="text-sm text-gray-500">NIK: {selectedPendaftar.nik}</p>
              </div>
              <div>
                {renderStatus(selectedPendaftar.status)}
              </div>
            </div>

            {/* Berkas List */}
            <div>
              <h4 className="font-semibold text-lg border-b pb-2 mb-4">Berkas Pendukung</h4>
              {(!selectedPendaftar.dokumen_pendaftaran || selectedPendaftar.dokumen_pendaftaran.length === 0) ? (
                <p className="text-gray-500 text-sm">Belum ada berkas yang diunggah.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedPendaftar.dokumen_pendaftaran.map((berkas: PendaftaranBerkas) => (
                    <div key={berkas.id} className="border p-4 rounded-lg shadow-sm bg-white">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium capitalize">{berkas.jenis_dokumen.replace('_', ' ')}</span>
                        {berkas.is_verified ? (
                          <span className="text-success flex items-center text-xs font-bold gap-1"><CheckCircle size={14}/> Valid</span>
                        ) : (
                          <span className="text-warning flex items-center text-xs font-bold gap-1"><XCircle size={14}/> Belum Valid</span>
                        )}
                      </div>
                      <a 
                        href={`http://localhost:8000/storage/${berkas.file_path}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-sm text-blue-500 underline mb-4 block"
                      >
                        Lihat Dokumen
                      </a>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant={berkas.is_verified ? "primary" : "secondary"}
                          onClick={() => handleVerifyBerkas(berkas.id, true)}
                        >
                          Valid
                        </Button>
                        <Button 
                          size="sm" 
                          variant={!berkas.is_verified ? "danger" : "secondary"}
                          onClick={() => handleVerifyBerkas(berkas.id, false)}
                        >
                          Tidak Valid
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Status Update Form */}
            <div className="mt-8 border-t pt-6">
              <h4 className="font-semibold text-lg mb-4">Keputusan Administrasi</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Select
                  label="Ubah Status"
                  value={newStatus}
                  onChange={(val) => setNewStatus(val)}
                  options={[
                    { value: 'draft', label: 'Draft' },
                    { value: 'submitted', label: 'Submitted' },
                    { value: 'verified', label: 'Verified' },
                    { value: 'lulus_administrasi', label: 'Lulus Administrasi' },
                    { value: 'gagal_administrasi', label: 'Gagal Administrasi' }
                  ]}
                />
              </div>
              <div className="mb-4">
                <Input
                  label="Catatan Verifikasi (Opsional)"
                  value={catatanVerifikasi}
                  onChange={(e) => setCatatanVerifikasi(e.target.value)}
                  placeholder="Beri catatan untuk pendaftar..."
                />
              </div>
              <Button 
                onClick={handleUpdateStatus} 
                loading={updateStatusLoading}
              >
                Simpan Keputusan
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
