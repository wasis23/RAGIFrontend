'use client';

import { useEffect, useState, useCallback } from 'react';
import { DollarSign, Edit, Save, ShieldAlert, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/DropdownMenu';
import apiClient from '@/lib/axios';
import { useAuth } from '@/hooks/useAuth';

interface MasterGajiItem {
  pegawai_id: number;
  nama_lengkap: string;
  nip?: string;
  gaji_pokok: number;
  tunjangan_tetap: number;
  potongan_tetap: number;
  tarif_transport_harian: number;
  updated_at?: string;
}

export default function MasterGajiPegawaiSikeuPage() {
  const { user, hasPermission } = useAuth();
  const isAdmin = user?.user_type === 'admin' || hasPermission('sikeu.manage') || hasPermission('simpeg.payroll.manage');

  const [loading, setLoading] = useState(true);
  const [masterList, setMasterList] = useState<MasterGajiItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MasterGajiItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form Edit State
  const [formGajiPokok, setFormGajiPokok] = useState(0);
  const [formTunjanganTetap, setFormTunjanganTetap] = useState(0);
  const [formPotonganTetap, setFormPotonganTetap] = useState(0);
  const [formTarifTransport, setFormTarifTransport] = useState(50000);

  const loadMasterGaji = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await apiClient.get('/sikeu/master/gaji-pegawai');
      setMasterList(res.data?.data || res.data || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memuat Master Komponen Gaji Pegawai SIKEU');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMasterGaji();
  }, [loadMasterGaji]);

  const handleOpenEdit = (item: MasterGajiItem) => {
    setSelectedItem(item);
    setFormGajiPokok(item.gaji_pokok);
    setFormTunjanganTetap(item.tunjangan_tetap);
    setFormPotonganTetap(item.potongan_tetap);
    setFormTarifTransport(item.tarif_transport_harian);
    setShowEditModal(true);
  };

  const handleSaveMasterGaji = async () => {
    if (!selectedItem) return;
    setIsSaving(true);
    try {
      await apiClient.post('/sikeu/master/gaji-pegawai', {
        pegawai_id: selectedItem.pegawai_id,
        gaji_pokok: formGajiPokok,
        tunjangan_tetap: formTunjanganTetap,
        potongan_tetap: formPotonganTetap,
        tarif_transport_harian: formTarifTransport,
      });
      toast.success(`Master Komponen Gaji ${selectedItem.nama_lengkap} berhasil disimpan!`);
      setShowEditModal(false);
      loadMasterGaji();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan Master Komponen Gaji');
    } finally {
      setIsSaving(false);
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const columns: ColumnDef<MasterGajiItem>[] = [
    {
      key: 'nama_lengkap',
      label: 'Nama Pegawai / Dosen',
      render: (row) => (
        <div>
          <span className="font-bold block">{row.nama_lengkap}</span>
          <span className="text-[11px] text-slate-500 font-mono">NIP: {row.nip || '-'}</span>
        </div>
      ),
    },
    {
      key: 'gaji_pokok',
      label: 'Gaji Pokok',
      render: (row) => <span className="font-semibold text-slate-800">{formatRupiah(row.gaji_pokok)}</span>,
    },
    {
      key: 'tunjangan_tetap',
      label: 'Tunjangan Tetap',
      render: (row) => <span className="font-semibold text-emerald-600">+{formatRupiah(row.tunjangan_tetap)}</span>,
    },
    {
      key: 'tarif_transport_harian',
      label: 'Tarif Transport Harian',
      render: (row) => (
        <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs border border-blue-200">
          {formatRupiah(row.tarif_transport_harian)} / Hari Tepat Waktu
        </span>
      ),
    },
    {
      key: 'potongan_tetap',
      label: 'Potongan Standar (PPh/BPJS)',
      render: (row) => <span className="font-semibold text-rose-600">-{formatRupiah(row.potongan_tetap)}</span>,
    },
    {
      key: 'aksi',
      label: 'Aksi',
      align: 'right',
      render: (row) => {
        const menuItems: DropdownMenuItem[] = [
          {
            label: 'Atur Tarif & Komponen Gaji',
            icon: <Edit size={14} />,
            onClick: () => handleOpenEdit(row),
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

  if (!isAdmin) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader
          title="Master Tarif Gaji & Transport Pegawai (SIKEU)"
          description="Penentuan Tarif Gaji Pokok, Tunjangan Tetap, Potongan Standar, dan Biaya Transport Harian Presensi"
        />
        <div className="card p-6 text-center">
          <ShieldAlert size={56} className="mx-auto mb-4 opacity-40 text-rose-500" />
          <h2 className="text-xl font-bold mb-2">Akses Ditolak</h2>
          <p className="max-w-[500px] mx-auto opacity-70">
            Halaman penentuan tarif master gaji ini hanya dapat diakses oleh Admin SIKEU dan Pengelola Keuangan.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Master Tarif Gaji & Transport Pegawai (SIKEU)"
        description="Penentuan Tarif Gaji Pokok, Tunjangan Tetap, Potongan Standar, dan Biaya Transport Harian Presensi"
        action={
          <Button variant="outline" icon={<RefreshCw size={16} />} onClick={loadMasterGaji}>
            Refresh Data
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={masterList}
        isLoading={loading}
        emptyMessage={
          <div className="py-8 text-center text-slate-400">
            <DollarSign size={48} className="mx-auto mb-4 opacity-40" />
            <p>Belum ada data pegawai untuk diatur tarif gajinya.</p>
          </div>
        }
      />

      {/* Modal Edit Master Tarif Gaji */}
      <Modal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Atur Master Tarif Gaji SIKEU — ${selectedItem?.nama_lengkap}`}
        footer={
          <div className="flex gap-2 justify-end w-full">
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Batal
            </Button>
            <Button
              variant="primary"
              loading={isSaving}
              disabled={isSaving}
              onClick={handleSaveMasterGaji}
            >
              <Save size={16} /> Simpan Tarif Master
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Gaji Pokok (IDR) *"
            type="number"
            value={formGajiPokok}
            onChange={(e) => setFormGajiPokok(Number(e.target.value))}
            required
          />

          <Input
            label="Tunjangan Tetap (IDR) *"
            type="number"
            value={formTunjanganTetap}
            onChange={(e) => setFormTunjanganTetap(Number(e.target.value))}
            required
          />

          <Input
            label="Biaya Transport Harian (Diberikan per-Hari Absen Tepat Waktu <= 08:15:00) *"
            type="number"
            value={formTarifTransport}
            onChange={(e) => setFormTarifTransport(Number(e.target.value))}
            required
          />

          <Input
            label="Potongan Standar (PPh21 / BPJS / Lainnya) *"
            type="number"
            value={formPotonganTetap}
            onChange={(e) => setFormPotonganTetap(Number(e.target.value))}
            required
          />
        </div>
      </Modal>
    </div>
  );
}
