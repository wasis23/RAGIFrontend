'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DollarSign, Printer, Plus, RefreshCw, ShieldAlert } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { simpegService } from '@/services/simpeg.service';
import type { GajiPegawai, StatusTransferGaji } from '@/types/simpeg.types';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

export default function PayrollPage() {
  const { user, hasPermission } = useAuth();
  const isAdmin = user?.user_type === 'admin' || hasPermission('simpeg.payroll.manage');
  const canRead = hasPermission('simpeg.payroll.read') || hasPermission('simpeg.payroll.view') || hasPermission('simpeg.payroll.manage');
  const canCreate = hasPermission('simpeg.payroll.create') || hasPermission('simpeg.payroll.manage');

  const [loading, setLoading] = useState(true);
  const [payrollList, setPayrollList] = useState<GajiPegawai[]>([]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    pegawai_id: 1,
    periode_bulan_tahun: '2026-07',
    gaji_pokok: 4500000,
    total_tunjangan: 1500000,
    total_potongan: 250000,
    gaji_bersih: 5750000,
    status_transfer: 'paid' as StatusTransferGaji,
    nomor_rekening: '5220391823',
    bank_nama: 'Bank Mandiri',
  });

  const loadPayroll = async () => {
    if (!canRead) return;
    setLoading(true);
    try {
      if (!isAdmin) {
        const resMe = await simpegService.getPegawaiMe();
        if (resMe.data) {
          const pegId = resMe.data.id;
          setFormData(prev => ({ ...prev, pegawai_id: pegId }));
          const res = await simpegService.getPayrollList(pegId);
          setPayrollList(res.data || []);
        }
      } else {
        const res = await simpegService.getPayrollList();
        setPayrollList(res.data || []);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memuat Slip Gaji');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayroll();
  }, [canRead]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) {
      toast.error('Akses Ditolak: Anda tidak memiliki permission menerbitkan slip gaji.');
      return;
    }

    try {
      const res = await simpegService.createPayroll(formData);
      toast.success('Slip gaji berhasil diterbitkan & terposting ke Jurnal SIKEU!');
      setShowModal(false);
      loadPayroll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menerbitkan slip gaji');
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  if (!canRead) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader
          title="Payroll & Slip Gaji Pegawai"
          description="Penggajian, Tunjangan Jabatan, Potongan PPh21, dan Integrasi Jurnal Keuangan (SIKEU)"
        />
        <Card>
          <EmptyState
            icon={<ShieldAlert size={48} className="text-[var(--danger)]" />}
            title="Akses Ditolak / Dibatasi"
            description="Peran Anda saat ini tidak memiliki permission untuk melihat Slip Gaji & Payroll."
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Payroll & Slip Gaji Pegawai"
        description="Penggajian, Tunjangan Jabatan, Potongan PPh21, dan Integrasi Jurnal Keuangan (SIKEU)"
      />

      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">Daftar Slip Gaji ({payrollList.length})</h3>
        <div className="flex gap-3 items-center">
          <Button variant="outline" size="sm" onClick={() => window.open('/sikeu/akuntansi/jurnal', '_blank')}>
            Lihat Jurnal SIKEU &rarr;
          </Button>
          <Button variant="outline" size="sm" onClick={loadPayroll}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </Button>
          {canCreate && (
            <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
              <Plus size={16} /> Terbitkan Payroll Baru
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <Card>
          <CardBody className="text-center text-[var(--text-muted)] py-8">Memuat slip gaji...</CardBody>
        </Card>
      ) : payrollList.length === 0 ? (
        <Card>
          <EmptyState
            icon={<DollarSign size={48} className="opacity-40" />}
            title="Belum ada data slip gaji penerbitan."
          />
        </Card>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Periode</th>
                <th>Nama Pegawai</th>
                <th>Gaji Pokok</th>
                <th>Tunjangan</th>
                <th>Potongan</th>
                <th>Take Home Pay</th>
                <th>Status SIKEU</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {payrollList.map((g) => (
                <tr key={g.id}>
                  <td className="font-bold font-mono">{g.periode_bulan_tahun}</td>
                  <td className="font-bold">
                    {g.pegawai?.nama_lengkap || `Pegawai ID ${g.pegawai_id}`}
                  </td>
                  <td>{formatRupiah(g.gaji_pokok)}</td>
                  <td className="text-[var(--success)]">+{formatRupiah(g.total_tunjangan)}</td>
                  <td className="text-[var(--danger)]">-{formatRupiah(g.total_potongan)}</td>
                  <td className="font-bold text-accent-600">{formatRupiah(g.gaji_bersih)}</td>
                  <td>
                    <Badge variant="green" className="uppercase">
                      {g.status_transfer} (Posted)
                    </Badge>
                  </td>
                  <td className="text-right">
                    <Button variant="ghost" size="sm" icon={<Printer size={16} />} onClick={() => toast.success('Mengunduh Slip Gaji PDF...')} title="Cetak Slip Gaji" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Terbit Payroll */}
      {canCreate && (
        <Modal
          open={showModal}
          onClose={() => setShowModal(false)}
          title="Terbitkan Slip Gaji & Post to SIKEU"
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowModal(false)}>Batal</Button>
              <Button variant="primary" onClick={handleSubmit}>Terbitkan & Post Jurnal</Button>
            </>
          }
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Periode (YYYY-MM)"
              value={formData.periode_bulan_tahun}
              onChange={(e) => setFormData({ ...formData, periode_bulan_tahun: e.target.value })}
              placeholder="2026-07"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Gaji Pokok (IDR)"
                type="number"
                value={formData.gaji_pokok}
                onChange={(e) => setFormData({ ...formData, gaji_pokok: Number(e.target.value) })}
                required
              />
              <Input
                label="Total Tunjangan (IDR)"
                type="number"
                value={formData.total_tunjangan}
                onChange={(e) => setFormData({ ...formData, total_tunjangan: Number(e.target.value) })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Total Potongan (IDR)"
                type="number"
                value={formData.total_potongan}
                onChange={(e) => setFormData({ ...formData, total_potongan: Number(e.target.value) })}
              />
              <Input
                label="Gaji Bersih / THP (IDR)"
                type="number"
                value={formData.gaji_bersih}
                onChange={(e) => setFormData({ ...formData, gaji_bersih: Number(e.target.value) })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nama Bank"
                value={formData.bank_nama}
                onChange={(e) => setFormData({ ...formData, bank_nama: e.target.value })}
              />
              <Input
                label="Nomor Rekening"
                value={formData.nomor_rekening}
                onChange={(e) => setFormData({ ...formData, nomor_rekening: e.target.value })}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
