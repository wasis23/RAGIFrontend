'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Filter, CheckCircle, XCircle, Award } from 'lucide-react';
import { spmbService, PendaftaranCalonMhs } from '@/services/spmb.service';
import toast from 'react-hot-toast';
import { DataTable } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Textarea } from '@/components/ui/Textarea';

export default function SeleksiPage() {
  const [data, setData] = useState<PendaftaranCalonMhs[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Pagination & Filtering state
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [totalItems, setTotalItems] = useState(0);

  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    status: '',
  });

  // Action Modal State (Penetapan Kelulusan)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPendaftar, setSelectedPendaftar] = useState<PendaftaranCalonMhs | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  
  // Form State
  const [formStatus, setFormStatus] = useState('');
  const [formProdiDiterima, setFormProdiDiterima] = useState('');
  const [formNilaiTotal, setFormNilaiTotal] = useState('');
  const [formCatatan, setFormCatatan] = useState('');
  const [formIsPublished, setFormIsPublished] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await spmbService.getPendaftaran({
        page,
        per_page: perPage,
        search: appliedFilters.search,
        status: appliedFilters.status, // might map to hasil_seleksi.status in API backend, assuming standard filtering
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

  const handleOpenModal = (row: PendaftaranCalonMhs) => {
    setSelectedPendaftar(row);
    // Reset form or populate from existing data
    setFormStatus('lulus');
    setFormProdiDiterima(row.program_studi_id?.toString() || '');
    setFormNilaiTotal('0');
    setFormCatatan('');
    setFormIsPublished(false);
    setIsModalOpen(true);
  };

  const handleSubmitKelulusan = async () => {
    if (!selectedPendaftar) return;
    if (!formStatus) {
      toast.error('Status kelulusan harus dipilih');
      return;
    }
    
    try {
      setSubmitLoading(true);
      await spmbService.tetapkanKelulusan(selectedPendaftar.id, {
        status: formStatus,
        program_studi_diterima_id: formStatus === 'lulus' ? Number(formProdiDiterima) : undefined,
        nilai_total: Number(formNilaiTotal),
        catatan: formCatatan,
        is_published: formIsPublished
      });
      
      toast.success('Hasil seleksi berhasil ditetapkan');
      setIsModalOpen(false);
      fetchData(); // Refresh list
    } catch (error: any) {
      toast.error(error.message || 'Gagal menetapkan hasil seleksi');
    } finally {
      setSubmitLoading(false);
    }
  };

  const renderStatus = (val: string) => {
    const statusColors: Record<string, string> = {
      'lulus': 'badge-green',
      'tidak_lulus': 'badge-red',
      'cadangan': 'badge-yellow',
      'mahasiswa_baru': 'badge-blue', // Already converted
    };
    const badgeClass = statusColors[val] || 'badge-gray';
    return (
      <span className={`badge ${badgeClass} uppercase text-xs font-bold`}>
        {val ? val.replace('_', ' ') : 'BELUM DITETAPKAN'}
      </span>
    );
  };

  return (
    <div className="animate-fade-in flex flex-col gap-7">
      <PageHeader
        title="Penentuan Kelulusan & Nilai"
        description="Kelola nilai ujian dan tetapkan status kelulusan calon mahasiswa"
        action={
          <div className="flex gap-2">
            <Button 
              variant="outline"
              icon={<Filter size={16} />} 
              onClick={() => setShowFilter(true)}
            >
              Filter Data
            </Button>
          </div>
        }
      />

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <DataTable 
          data={data}
          isLoading={loading}
          columns={[
            { key: 'no_pendaftaran', label: 'No Pendaftaran', sortable: true },
            { key: 'nama_lengkap', label: 'Nama Lengkap', sortable: true },
            { key: 'program_studi', label: 'Prodi Pilihan', render: (row: any) => row.program_studi?.nama || '-' },
            { key: 'nilai_total', label: 'Nilai Total', render: (row: any) => row.hasil_seleksi?.nilai_total || '-' },
            { key: 'status_kelulusan', label: 'Status Seleksi', render: (row: any) => renderStatus(row.hasil_seleksi?.status) },
            { key: 'actions', label: 'Aksi', align: 'right', render: (row) => (
              <div className="flex justify-end gap-2">
                <Button 
                    variant="primary" 
                    size="sm" 
                    icon={<Award size={14} />} 
                    onClick={() => handleOpenModal(row)}
                >
                  Kelulusan
                </Button>
              </div>
            )}
          ]}
        />
      </div>

      {/* Filter Drawer */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Data Seleksi"
        footer={
          <div className="flex justify-end gap-3">
            <Button 
              variant="secondary" 
              onClick={() => {
                setFilterSearch('');
                setFilterStatus('');
                setAppliedFilters({ search: '', status: '' });
                setShowFilter(false);
                setPage(1);
              }}
            >
              Reset
            </Button>
            <Button 
              variant="primary" 
              onClick={() => {
                setAppliedFilters({ search: filterSearch, status: filterStatus });
                setShowFilter(false);
                setPage(1);
              }}
            >
              Terapkan
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-5">
          <Input 
            label="Pencarian"
            placeholder="No pendaftaran atau nama..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />

          <Select 
            label="Status Kelulusan"
            value={filterStatus}
            onChange={(val) => setFilterStatus(val)}
            options={[
              { value: '', label: 'Semua Status' },
              { value: 'belum', label: 'Belum Ditetapkan' },
              { value: 'lulus', label: 'Lulus' },
              { value: 'tidak_lulus', label: 'Tidak Lulus' },
              { value: 'cadangan', label: 'Cadangan' }
            ]}
          />
        </div>
      </Drawer>

      {/* Modal Penetapan Kelulusan */}
      <Modal
        open={isModalOpen}
        onClose={() => !submitLoading && setIsModalOpen(false)}
        title="Penetapan Hasil Seleksi"
      >
        {selectedPendaftar && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg text-sm border border-slate-100">
              <p className="font-semibold">{selectedPendaftar.nama_lengkap}</p>
              <p className="text-slate-500">{selectedPendaftar.no_pendaftaran}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select 
                label="Keputusan"
                value={formStatus}
                onChange={setFormStatus}
                options={[
                  { value: 'lulus', label: 'Diterima / Lulus' },
                  { value: 'tidak_lulus', label: 'Tidak Lulus' },
                  { value: 'cadangan', label: 'Cadangan' }
                ]}
              />

              <Input 
                label="Nilai Total Seleksi"
                type="number"
                value={formNilaiTotal}
                onChange={(e) => setFormNilaiTotal(e.target.value)}
                placeholder="0.00"
              />
            </div>

            {formStatus === 'lulus' && (
              <Select 
                label="Diterima di Program Studi"
                value={formProdiDiterima}
                onChange={setFormProdiDiterima}
                options={[
                  { value: selectedPendaftar.program_studi_id?.toString(), label: `Pilihan 1` }, // Ideally load real name from selectedPendaftar
                  { value: selectedPendaftar.program_studi_pilihan2_id?.toString() || '', label: `Pilihan 2` }
                ].filter(o => o.value)}
              />
            )}

            <Textarea
              label="Catatan (Opsional)"
              value={formCatatan}
              onChange={(e) => setFormCatatan(e.target.value)}
              placeholder="Catatan tambahan..."
              rows={3}
            />

            <div className="pt-2">
              <Checkbox
                label="Umumkan sekarang (Kirim Email Notifikasi)"
                checked={formIsPublished}
                onChange={(e) => setFormIsPublished(e.target.checked)}
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button variant="primary" loading={submitLoading} onClick={handleSubmitKelulusan}>
                Simpan & Tetapkan
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
