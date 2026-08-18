'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Plus, RefreshCw, Award, ShieldAlert } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { simpegService } from '@/services/simpeg.service';
import type { PenilaianKinerja, PredikatKinerja } from '@/types/simpeg.types';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

export default function KinerjaPage() {
  const { user, hasPermission } = useAuth();
  const isAdmin = user?.user_type === 'admin' || hasPermission('simpeg.kinerja.evaluate') || hasPermission('simpeg.kinerja.manage');
  const canRead = hasPermission('simpeg.kinerja.read');
  const canCreate = hasPermission('simpeg.kinerja.create') || hasPermission('simpeg.kinerja.evaluate');

  const [loading, setLoading] = useState(true);
  const [kinerjaList, setKinerjaList] = useState<PenilaianKinerja[]>([]);

  // Modal Form Evaluasi Kinerja
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    pegawai_id: 1,
    tahun: 2026,
    semester: 'ganjil' as 'ganjil' | 'genap' | 'tahunan',
    nilai_skp: 88.5,
    nilai_bkd: 14.5,
    predikat: 'sangat_baik' as PredikatKinerja,
    catatan_evaluator: 'Memenuhi ekspektasi tridharma perguruan tinggi dengan sangat baik.',
  });

  const loadKinerja = async () => {
    if (!canRead) return;
    setLoading(true);
    try {
      if (!isAdmin) {
        const resMe = await simpegService.getPegawaiMe();
        if (resMe.data) {
          const pegId = resMe.data.id;
          setFormData(prev => ({ ...prev, pegawai_id: pegId }));
          const res = await simpegService.getKinerjaList(pegId);
          setKinerjaList(res.data || []);
        }
      } else {
        const res = await simpegService.getKinerjaList();
        setKinerjaList(res.data || []);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memuat evaluasi kinerja');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKinerja();
  }, [canRead]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) {
      toast.error('Akses Ditolak: Anda tidak memiliki permission menginput evaluasi kinerja.');
      return;
    }

    try {
      await simpegService.createKinerja({
        pegawai_id: formData.pegawai_id,
        tahun: Number(formData.tahun),
        semester: formData.semester,
        nilai_skp: Number(formData.nilai_skp),
        nilai_bkd: formData.nilai_bkd ? Number(formData.nilai_bkd) : null,
        predikat: formData.predikat,
        catatan_evaluator: formData.catatan_evaluator || null,
      });
      toast.success('Penilaian Kinerja SKP/BKD berhasil disimpan!');
      setShowModal(false);
      loadKinerja();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan penilaian kinerja');
    }
  };

  if (!canRead) {
    return (
      <div className="animate-fade-in" className="flex flex-col gap-6">
        <PageHeader
          title="Penilaian Kinerja Pegawai (SKP & BKD)"
          description="Evaluasi Kinerja Tahunan SKP PNS/Non-PNS & Laporan Beban Kerja Dosen (BKD)"
        />
        <div className="card" className="p-12 text-center">
          <ShieldAlert size={56} color="var(--danger)" className="mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2 text-red-700">
            Akses Ditolak / Dibatasi
          </h2>
          <p className="text-slate-400 max-w-[500px] mx-auto">
            Peran Anda saat ini tidak memiliki permission untuk melihat Penilaian Kinerja.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" className="flex flex-col gap-6">
      <PageHeader
        title="Penilaian Kinerja Pegawai (SKP & BKD)"
        description="Evaluasi Kinerja Tahunan SKP PNS/Non-PNS & Laporan Beban Kerja Dosen (BKD)"
      />

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold">Laporan Kinerja SKP & BKD ({kinerjaList.length})</h3>
        <div className="flex gap-3">
          <button onClick={loadKinerja} className="btn btn-outline btn-sm">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          {canCreate && (
            <button onClick={() => setShowModal(true)} className="btn btn-primary btn-sm">
              <Plus size={16} /> Input Evaluasi Kinerja
            </button>
          )}
        </div>
      </div>

      <div className="card" className="p-5">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Memuat evaluasi kinerja...</div>
        ) : kinerjaList.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <TrendingUp size={48} className="mx-auto mb-4 opacity-40" />
            <p>Belum ada evaluasi kinerja tercatat.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Tahun / Semester</th>
                  <th>Nama Pegawai</th>
                  <th>Nilai SKP</th>
                  <th>Nilai BKD Dosen</th>
                  <th>Predikat Kinerja</th>
                  <th>Evaluator / Asesor</th>
                </tr>
              </thead>
              <tbody>
                {kinerjaList.map((k) => (
                  <tr key={k.id}>
                    <td className="font-bold">
                      {k.tahun} ({k.semester.toUpperCase()})
                    </td>
                    <td className="font-bold">
                      {k.pegawai?.nama_lengkap || `Pegawai ID ${k.pegawai_id}`}
                    </td>
                    <td className="font-bold text-primary-600">{k.nilai_skp} / 100</td>
                    <td className="font-bold text-emerald-600">{k.nilai_bkd ? `${k.nilai_bkd} SKS` : '-'}</td>
                    <td>
                      <span className="badge badge-green" className="uppercase">
                        {k.predikat.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="text-[0.8125rem] text-slate-500">
                      {k.evaluator?.username || 'Asesor SDM'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Input Evaluasi */}
      {canCreate && (
        <Modal
          open={showModal}
          onClose={() => setShowModal(false)}
          title="Input Evaluasi SKP / BKD Pegawai"
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowModal(false)}>Batal</Button>
              <Button variant="primary" onClick={handleSubmit}>Simpan Evaluasi</Button>
            </>
          }
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Tahun Evaluasi"
                type="number"
                value={formData.tahun}
                onChange={(e) => setFormData({ ...formData, tahun: Number(e.target.value) })}
                required
              />
              <div className="form-group">
                <label className="form-label">Semester</label>
                <select
                  className="input"
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value as any })}
                >
                  <option value="ganjil">Ganjil</option>
                  <option value="genap">Genap</option>
                  <option value="tahunan">Tahunan</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nilai SKP (Skala 0-100)"
                type="number"
                step="0.1"
                value={formData.nilai_skp}
                onChange={(e) => setFormData({ ...formData, nilai_skp: Number(e.target.value) })}
                required
              />
              <Input
                label="Nilai BKD Dosen (SKS)"
                type="number"
                step="0.1"
                value={formData.nilai_bkd}
                onChange={(e) => setFormData({ ...formData, nilai_bkd: Number(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Predikat Evaluasi Kinerja</label>
              <select
                className="input"
                value={formData.predikat}
                onChange={(e) => setFormData({ ...formData, predikat: e.target.value as PredikatKinerja })}
              >
                <option value="sangat_baik">Sangat Baik</option>
                <option value="baik">Baik</option>
                <option value="cukup">Cukup</option>
                <option value="kurang">Kurang</option>
                <option value="sangat_kurang">Sangat Kurang</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Catatan Evaluator / Asesor</label>
              <textarea
                className="input"
                rows={3}
                value={formData.catatan_evaluator}
                onChange={(e) => setFormData({ ...formData, catatan_evaluator: e.target.value })}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
