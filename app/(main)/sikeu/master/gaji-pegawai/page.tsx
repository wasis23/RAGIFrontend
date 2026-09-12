'use client';

import { useEffect, useState, useCallback } from 'react';
import { DollarSign, Edit, Save, ShieldAlert, RefreshCw, Filter, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { sikeuService } from '@/services/sikeu.service';
import { useAuth } from '@/hooks/useAuth';

interface MasterGajiItem {
  pegawai_id: number;
  nama_lengkap: string;
  nip?: string;
  jenis_pegawai?: string;
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

  // Pagination & Filter States
  const [search, setSearch] = useState('');
  const [filterJenis, setFilterJenis] = useState('all');
  const [tempFilterJenis, setTempFilterJenis] = useState('all');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Form Edit State
  const [formGajiPokok, setFormGajiPokok] = useState(0);
  const [formTunjanganTetap, setFormTunjanganTetap] = useState(0);
  const [formPotonganTetap, setFormPotonganTetap] = useState(0);
  const [formTarifTransport, setFormTarifTransport] = useState(50000);

  const loadMasterGaji = useCallback(async () => {
    setLoading(true);
    try {
      const res = await sikeuService.getMasterGajiList({
        search: search || undefined,
        jenis_pegawai: filterJenis !== 'all' ? filterJenis : undefined,
        page,
        per_page: perPage,
      });
      const list = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
      setMasterList(list);

      const meta = (res as any)?.meta;
      if (meta) {
        setTotalItems(meta.total || list.length);
        setTotalPages(meta.last_page || Math.ceil((meta.total || list.length) / perPage));
      } else {
        setTotalItems(list.length);
        setTotalPages(Math.ceil(list.length / perPage) || 1);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Gagal memuat Master Komponen Gaji Pegawai SIKEU');
    } finally {
      setLoading(false);
    }
  }, [search, filterJenis, page, perPage]);

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
      await sikeuService.saveMasterGaji({
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
      toast.error(err?.response?.data?.message || err?.message || 'Gagal menyimpan Master Komponen Gaji');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyFilter = () => {
    setFilterJenis(tempFilterJenis);
    setPage(1);
    setShowFilterDrawer(false);
  };

  const handleResetFilter = () => {
    setSearch('');
    setFilterJenis('all');
    setTempFilterJenis('all');
    setPage(1);
    setShowFilterDrawer(false);
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
          <span className="font-bold text-slate-900 block">{row.nama_lengkap}</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-2xs text-slate-500 font-mono">NIP: {row.nip || '-'}</span>
            {row.jenis_pegawai && (
              <Badge variant="blue" className="text-[10px] uppercase font-bold py-0 px-1.5">
                {row.jenis_pegawai}
              </Badge>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'gaji_pokok',
      label: 'Gaji Pokok',
      render: (row) => <span className="font-semibold text-slate-800 tabular-nums">{formatRupiah(row.gaji_pokok)}</span>,
    },
    {
      key: 'tunjangan_tetap',
      label: 'Tunjangan Tetap',
      render: (row) => <span className="font-semibold text-emerald-600 tabular-nums">+{formatRupiah(row.tunjangan_tetap)}</span>,
    },
    {
      key: 'tarif_transport_harian',
      label: 'Tarif Transport Harian',
      render: (row) => (
        <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg text-xs border border-blue-200 tabular-nums">
          {formatRupiah(row.tarif_transport_harian)} / Hari
        </span>
      ),
    },
    {
      key: 'potongan_tetap',
      label: 'Potongan Standar',
      render: (row) => <span className="font-semibold text-rose-600 tabular-nums">-{formatRupiah(row.potongan_tetap)}</span>,
    },
    {
      key: 'aksi',
      label: 'Aksi',
      align: 'right',
      render: (row) => {
        const menuItems: DropdownMenuItem[] = [
          {
            label: 'Atur Komponen Gaji',
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
      <div className="animate-fade-in space-y-6 max-w-6xl mx-auto">
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
    <div className="animate-fade-in space-y-6 max-w-6xl mx-auto pb-16">
      <PageHeader
        title="Master Tarif Gaji & Transport Pegawai (SIKEU)"
        description="Penentuan Tarif Gaji Pokok, Tunjangan Tetap, Potongan Standar, dan Biaya Transport Harian Presensi SIMPEG"
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative w-48 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Cari Pegawai / NIP..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 shadow-2xs transition-all"
              />
            </div>
            <Button
              variant="outline"
              icon={<Filter size={15} />}
              onClick={() => {
                setTempFilterJenis(filterJenis);
                setShowFilterDrawer(true);
              }}
              className="font-bold min-h-[38px] text-xs"
            >
              Filter {filterJenis !== 'all' && `(1)`}
            </Button>
            <Button
              variant="outline"
              icon={<RefreshCw size={15} />}
              onClick={loadMasterGaji}
              className="font-bold min-h-[38px] text-xs"
            >
              Refresh
            </Button>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={masterList}
        isLoading={loading}
        meta={{
          current_page: page,
          last_page: totalPages,
          per_page: perPage,
          total: totalItems,
          from: (page - 1) * perPage + 1,
          to: Math.min(page * perPage, totalItems),
        }}
        onPageChange={(newPage: number) => setPage(newPage)}
        onLimitChange={(newLimit: number) => {
          setPerPage(newLimit);
          setPage(1);
        }}
        emptyMessage={
          <div className="py-12 text-center text-slate-400 space-y-2">
            <DollarSign size={40} className="mx-auto opacity-30 text-slate-400" />
            <p className="text-xs font-semibold text-slate-600">Tidak ada data pegawai yang sesuai.</p>
          </div>
        }
      />

      {/* Drawer Filter */}
      <Drawer
        isOpen={showFilterDrawer}
        onClose={() => setShowFilterDrawer(false)}
        title="Filter Master Gaji Pegawai"
        width="380px"
        footer={
          <div className="flex items-center justify-between gap-2 w-full">
            <Button type="button" variant="outline" onClick={handleResetFilter} className="font-bold text-xs">
              Reset
            </Button>
            <Button type="button" variant="primary" onClick={handleApplyFilter} className="font-bold text-xs shadow-xs">
              Terapkan Filter
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Select
            label="Kategori / Jenis Pegawai"
            value={tempFilterJenis}
            onChange={(val) => setTempFilterJenis(val as string)}
            options={[
              { value: 'all', label: 'Semua Jenis Pegawai' },
              { value: 'dosen', label: 'Dosen / Tenaga Pendidik' },
              { value: 'tendik', label: 'Tenaga Kependidikan (Tendik)' },
              { value: 'struktural', label: 'Pejabat Struktural' },
            ]}
          />
        </div>
      </Drawer>

      {/* Modal Edit Master Tarif Gaji */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Atur Komponen Gaji: ${selectedItem?.nama_lengkap}`}
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
            label="Tarif Transport Harian (Diberikan per-Hari Absen Tepat Waktu) *"
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

          <div className="flex gap-2 justify-end w-full pt-4 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setShowEditModal(false)} disabled={isSaving} className="font-bold text-xs">
              Batal
            </Button>
            <Button
              variant="primary"
              disabled={isSaving}
              onClick={handleSaveMasterGaji}
              icon={<Save size={15} />}
              className="font-bold text-xs shadow-xs"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Komponen Gaji'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
