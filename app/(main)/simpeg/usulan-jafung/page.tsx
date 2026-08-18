'use client';

import { useEffect, useState } from 'react';
import { Award, Plus, RefreshCw, ShieldAlert } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { simpegService } from '@/services/simpeg.service';
import type { UsulanJafung, JabatanFungsionalAkademik } from '@/types/simpeg.types';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

export default function UsulanJafungPage() {
  const { user, hasPermission } = useAuth();
  const isAdmin = user?.user_type === 'admin' || hasPermission('simpeg.usulan_jafung.verify') || hasPermission('simpeg.usulan_jafung.manage');
  const canRead = hasPermission('simpeg.usulan_jafung.read') || hasPermission('simpeg.usulan_jafung.request') || hasPermission('simpeg.usulan_jafung.verify');
  const canCreate = hasPermission('simpeg.usulan_jafung.create') || hasPermission('simpeg.usulan_jafung.request');

  const [loading, setLoading] = useState(true);
  const [usulanList, setUsulanList] = useState<UsulanJafung[]>([]);
  const [jafungList, setJafungList] = useState<JabatanFungsionalAkademik[]>([]);

  // Modal Request State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    pegawai_id: 1,
    jafung_asal_id: '',
    jafung_tujuan_id: '',
    angka_kredit_usulan: 200,
    catatan_reviewer: '',
  });

  const loadData = async () => {
    if (!canRead) return;
    setLoading(true);
    try {
      if (!isAdmin) {
        const resMe = await simpegService.getPegawaiMe();
        if (resMe.data) {
          const pegId = resMe.data.id;
          setFormData(prev => ({ ...prev, pegawai_id: pegId }));
          const [resUsulan, resJaf] = await Promise.all([
            simpegService.getUsulanJafungList(pegId),
            simpegService.getJabatanFungsionalList(),
          ]);
          setUsulanList(resUsulan.data || []);
          setJafungList(resJaf.data || []);
        }
      } else {
        const [resUsulan, resJaf] = await Promise.all([
          simpegService.getUsulanJafungList(),
          simpegService.getJabatanFungsionalList(),
        ]);
        setUsulanList(resUsulan.data || []);
        setJafungList(resJaf.data || []);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memuat Usulan Jafung');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [canRead]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) {
      toast.error('Akses Ditolak: Anda tidak memiliki permission mengajukan Usulan Jafung.');
      return;
    }

    try {
      await simpegService.createUsulanJafung({
        pegawai_id: formData.pegawai_id,
        jafung_asal_id: formData.jafung_asal_id ? Number(formData.jafung_asal_id) : null,
        jafung_tujuan_id: Number(formData.jafung_tujuan_id),
        angka_kredit_usulan: Number(formData.angka_kredit_usulan),
        catatan_reviewer: formData.catatan_reviewer || null,
      });
      toast.success('Usulan kenaikan Jafung Dosen berhasil diajukan!');
      setShowModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal mengajukan usulan Jafung');
    }
  };

  if (!canRead) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader
          title="Usulan Kenaikan Jabatan Fungsional (Jafung & KUM Dosen)"
          description="Pengajuan & Verifikasi Angka Kredit Akademik Dosen (Asisten Ahli, Lektor, Lektor Kepala, Guru Besar)"
        />
        <Card>
          <EmptyState
            icon={<ShieldAlert size={48} className="text-[var(--danger)]" />}
            title="Akses Ditolak / Dibatasi"
            description="Peran Anda saat ini tidak memiliki permission untuk melihat atau mengajukan Usulan Jafung Dosen."
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Usulan Kenaikan Jabatan Fungsional (Jafung & KUM Dosen)"
        description="Pengajuan & Verifikasi Angka Kredit Akademik Dosen (Asisten Ahli, Lektor, Lektor Kepala, Guru Besar)"
      />

      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">Daftar Usulan Jafung Dosen ({usulanList.length})</h3>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </Button>
          {canCreate && (
            <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
              <Plus size={16} /> Ajukan Kenaikan Jafung
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <Card>
          <CardBody className="text-center text-[var(--text-muted)] py-8">Memuat usulan jafung...</CardBody>
        </Card>
      ) : usulanList.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Award size={48} className="opacity-40" />}
            title="Belum ada usulan kenaikan Jafung Dosen."
          />
        </Card>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nama Dosen</th>
                <th>Jafung Asal</th>
                <th>Jafung Tujuan</th>
                <th>Angka Kredit (KUM)</th>
                <th>Catatan Reviewer Tim Senat</th>
              </tr>
            </thead>
            <tbody>
              {usulanList.map((u) => (
                <tr key={u.id}>
                  <td className="font-bold">
                    {u.pegawai?.nama_lengkap || `Dosen ID ${u.pegawai_id}`}
                  </td>
                  <td>{u.jafung_asal?.nama || 'Tenaga Pengajar'}</td>
                  <td>
                    <Badge variant="purple" className="font-bold">
                      {u.jafung_tujuan?.nama || `Jafung ID ${u.jafung_tujuan_id}`}
                    </Badge>
                  </td>
                  <td className="font-bold text-[var(--success)]">{u.angka_kredit_usulan} KUM</td>
                  <td className="text-sm text-[var(--text-secondary)]">{u.catatan_reviewer || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Ajukan Jafung */}
      {canCreate && (
        <Modal
          open={showModal}
          onClose={() => setShowModal(false)}
          title="Ajukan Kenaikan Jabatan Fungsional Dosen"
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowModal(false)}>Batal</Button>
              <Button variant="primary" onClick={handleSubmit}>Kirim Usulan Jafung</Button>
            </>
          }
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Select
              label="Jabatan Fungsional Tujuan"
              value={formData.jafung_tujuan_id}
              onChange={(val) => setFormData({ ...formData, jafung_tujuan_id: val })}
              options={[
                { value: '', label: '-- Pilih Jafung Target --' },
                ...jafungList.map((jf) => ({ value: String(jf.id), label: `${jf.nama} (${jf.angka_kredit_min} KUM)` })),
              ]}
              required
            />
            <Input
              label="Total Angka Kredit Usulan (KUM)"
              type="number"
              value={formData.angka_kredit_usulan}
              onChange={(e) => setFormData({ ...formData, angka_kredit_usulan: Number(e.target.value) })}
              required
            />
            <Textarea
              label="Catatan Pengajuan / Ringkasan Tridharma"
              rows={3}
              value={formData.catatan_reviewer}
              onChange={(e) => setFormData({ ...formData, catatan_reviewer: e.target.value })}
              placeholder="Tuliskan karya ilmiah & pengajaran pendukung..."
            />
          </form>
        </Modal>
      )}
    </div>
  );
}
