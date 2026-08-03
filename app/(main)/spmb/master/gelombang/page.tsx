'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { spmbService, type GelombangPenerimaan, type JalurMasuk } from '@/services/spmb.service';

export default function GelombangPage() {
  const [data, setData] = useState<GelombangPenerimaan[]>([]);
  const [jalurMasuk, setJalurMasuk] = useState<JalurMasuk[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    jalur_masuk_id: '',
    tahun_akademik_id: '1',
    nama: '',
    tanggal_buka: '',
    tanggal_tutup: '',
    kuota_total: '',
    biaya_pendaftaran: '',
    status: 'draft'
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [gelombangRes, jalurMasukRes] = await Promise.all([
        spmbService.getGelombang(),
        spmbService.getJalurMasuk()
      ]);
      
      const items = gelombangRes.data?.items || gelombangRes.data || gelombangRes;
      setData(Array.isArray(items) ? items : []);

      const jalurItems = jalurMasukRes.data?.items || jalurMasukRes.data || jalurMasukRes;
      setJalurMasuk(Array.isArray(jalurItems) ? jalurItems : []);
    } catch {
      toast.error('Gagal memuat data. Periksa koneksi ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setFormData({
      jalur_masuk_id: '',
      tahun_akademik_id: '1',
      nama: '',
      tanggal_buka: '',
      tanggal_tutup: '',
      kuota_total: '',
      biaya_pendaftaran: '',
      status: 'draft'
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.jalur_masuk_id || !formData.nama || !formData.tanggal_buka || !formData.tanggal_tutup || !formData.kuota_total || !formData.biaya_pendaftaran) {
      toast.error('Semua kolom wajib diisi.');
      return;
    }

    try {
      await spmbService.createGelombang({
        ...formData,
        jalur_masuk_id: Number(formData.jalur_masuk_id),
        tahun_akademik_id: Number(formData.tahun_akademik_id),
        kuota_total: Number(formData.kuota_total),
        biaya_pendaftaran: Number(formData.biaya_pendaftaran)
      });
      toast.success('Gelombang baru berhasil ditambahkan!');
      fetchData();
      setShowModal(false);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Gagal menyimpan gelombang. Periksa koneksi ke server.';
      toast.error(errorMsg);
    }
  };

  const columns: ColumnDef<GelombangPenerimaan>[] = [
    { key: 'id', label: 'No', render: (_, index) => <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{index + 1}</span> },
    { key: 'nama', label: 'Nama Gelombang', render: (row) => <span style={{ fontWeight: 700 }}>{row.nama}</span> },
    { key: 'jalur_masuk', label: 'Jalur Masuk', render: (row) => (
      <span>{row.jalur_masuk?.nama || row.jalur_masuk_id}</span>
    )},
    { key: 'tanggal', label: 'Periode', render: (row) => (
      <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.8125rem' }}>
        <span>Buka: {formatDate(row.tanggal_buka)}</span>
        <span>Tutup: {formatDate(row.tanggal_tutup)}</span>
      </div>
    )},
    { key: 'kuota', label: 'Kuota', render: (row) => (
      <span>{row.kuota_terisi} / {row.kuota_total}</span>
    )},
    { key: 'biaya', label: 'Biaya', render: (row) => (
      <span>Rp {row.biaya_pendaftaran.toLocaleString('id-ID')}</span>
    )},
    { key: 'status', label: 'Status', render: (row) => {
      let variant: 'success' | 'warning' | 'danger' | 'info' = 'info';
      if (row.status === 'aktif') variant = 'success';
      if (row.status === 'draft') variant = 'warning';
      if (row.status === 'ditutup') variant = 'danger';
      if (row.status === 'selesai') variant = 'info';

      return (
        <Badge variant={variant} style={{ textTransform: 'capitalize' }}>
          {row.status}
        </Badge>
      );
    }},
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <PageHeader
        title="Master Gelombang Penerimaan"
        description="Kelola gelombang pendaftaran mahasiswa baru SPMB"
        action={
          <Button icon={<Plus size={16} />} onClick={handleOpenCreate}>
            Tambah Gelombang
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
      />

      {/* Modal Form */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Tambah Gelombang Baru"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Batal</Button>
            <Button variant="primary" onClick={handleSave}>
              Simpan
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nama Gelombang"
            required
            placeholder="Contoh: Gelombang 1 Reguler 2024"
            value={formData.nama}
            onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
            className="md:col-span-2"
          />

          <Select
            label="Jalur Masuk"
            required
            value={formData.jalur_masuk_id}
            onChange={(val) => setFormData({ ...formData, jalur_masuk_id: val })}
            options={[
              { value: '', label: 'Pilih Jalur Masuk' },
              ...jalurMasuk.map((jm) => ({
                value: jm.id.toString(),
                label: jm.nama
              }))
            ]}
          />

          <Select
            label="Status"
            required
            value={formData.status}
            onChange={(val) => setFormData({ ...formData, status: val })}
            options={[
              { value: 'draft', label: 'Draft' },
              { value: 'aktif', label: 'Aktif' },
              { value: 'ditutup', label: 'Ditutup' },
              { value: 'selesai', label: 'Selesai' }
            ]}
          />

          <Input
            label="Tanggal Buka"
            type="datetime-local"
            required
            value={formData.tanggal_buka}
            onChange={(e) => setFormData({ ...formData, tanggal_buka: e.target.value })}
          />

          <Input
            label="Tanggal Tutup"
            type="datetime-local"
            required
            value={formData.tanggal_tutup}
            onChange={(e) => setFormData({ ...formData, tanggal_tutup: e.target.value })}
          />

          <Input
            label="Kuota Total"
            type="number"
            required
            placeholder="0"
            value={formData.kuota_total}
            onChange={(e) => setFormData({ ...formData, kuota_total: e.target.value })}
          />

          <Input
            label="Biaya Pendaftaran"
            type="number"
            required
            placeholder="0"
            value={formData.biaya_pendaftaran}
            onChange={(e) => setFormData({ ...formData, biaya_pendaftaran: e.target.value })}
          />
        </form>
      </Modal>
    </div>
  );
}
