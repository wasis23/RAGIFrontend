'use client';

import { useEffect, useState } from 'react';
import { DollarSign, Printer, Plus, RefreshCw, CheckCircle, ShieldAlert } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { simpegService } from '@/services/simpeg.service';
import type { GajiPegawai, StatusTransferGaji } from '@/types/simpeg.types';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

export default function PayrollPage() {
  const { hasPermission } = useAuth();
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
      const res = await simpegService.getPayrollList();
      setPayrollList(res.data || []);
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
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <PageHeader
          title="Payroll & Slip Gaji Pegawai"
          description="Penggajian, Tunjangan Jabatan, Potongan PPh21, dan Integrasi Jurnal Keuangan (SIKEU)"
        />
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <ShieldAlert size={56} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#991b1b' }}>
            Akses Ditolak / Dibatasi
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: 500, margin: '0 auto' }}>
            Peran Anda saat ini tidak memiliki permission untuk melihat Slip Gaji & Payroll.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PageHeader
        title="Payroll & Slip Gaji Pegawai"
        description="Penggajian, Tunjangan Jabatan, Potongan PPh21, dan Integrasi Jurnal Keuangan (SIKEU)"
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Daftar Slip Gaji ({payrollList.length})</h3>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={loadPayroll} className="btn btn-outline btn-sm">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          {canCreate && (
            <button onClick={() => setShowModal(true)} className="btn btn-primary btn-sm">
              <Plus size={16} /> Terbitkan Payroll Baru
            </button>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: '1.25rem' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Memuat slip gaji...</div>
        ) : payrollList.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <DollarSign size={48} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
            <p>Belum ada data slip gaji penerbitan.</p>
          </div>
        ) : (
          <div className="table-responsive">
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
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {payrollList.map((g) => (
                  <tr key={g.id}>
                    <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>{g.periode_bulan_tahun}</td>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {g.pegawai?.nama_lengkap || `Pegawai ID ${g.pegawai_id}`}
                    </td>
                    <td>{formatRupiah(g.gaji_pokok)}</td>
                    <td style={{ color: '#059669' }}>+{formatRupiah(g.total_tunjangan)}</td>
                    <td style={{ color: '#dc2626' }}>-{formatRupiah(g.total_potongan)}</td>
                    <td style={{ fontWeight: 700, color: '#4f46e5' }}>{formatRupiah(g.gaji_bersih)}</td>
                    <td>
                      <span className="badge badge-green" style={{ textTransform: 'uppercase' }}>
                        {g.status_transfer} (Posted)
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button onClick={() => toast.success('Mengunduh Slip Gaji PDF...')} className="btn btn-ghost btn-icon btn-sm" title="Cetak Slip Gaji">
                        <Printer size={16} color="#4f46e5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input
              label="Periode (YYYY-MM)"
              value={formData.periode_bulan_tahun}
              onChange={(e) => setFormData({ ...formData, periode_bulan_tahun: e.target.value })}
              placeholder="2026-07"
              required
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
