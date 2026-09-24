'use client';

import { useEffect, useState } from 'react';
import { Award, Plus, Filter, ShieldAlert } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { simpegService } from '@/services/simpeg.service';
import type { UsulanJafung, JabatanFungsionalAkademik } from '@/types/simpeg.types';
import type { PaginationMeta } from '@/types/api.types';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

export default function UsulanJafungPage() {
  const { isAdmin, hasPermission } = useAuth();
  const canAccess = isAdmin || hasPermission('simpeg.usulan_jafung.verify') || hasPermission('simpeg.usulan_jafung.manage');
  const canRead = hasPermission('simpeg.usulan_jafung.read') || hasPermission('simpeg.usulan_jafung.request') || hasPermission('simpeg.usulan_jafung.verify');
  const canCreate = hasPermission('simpeg.usulan_jafung.create') || hasPermission('simpeg.usulan_jafung.request');

  const [loading, setLoading] = useState(true);
  const [usulanList, setUsulanList] = useState<UsulanJafung[]>([]);
  const [jafungList, setJafungList] = useState<JabatanFungsionalAkademik[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();
  const [showFilter, setShowFilter] = useState(false);
  const [search, setSearch] = useState('');
  const [filterOrderBy, setFilterOrderBy] = useState('created_at');
  const [filterOrderDir, setFilterOrderDir] = useState<'asc' | 'desc'>('desc');

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
      if (!canAccess) {
        const resMe = await simpegService.getPegawaiMe();
        if (resMe.data) {
          const pegId = resMe.data.id;
          setFormData(prev => ({ ...prev, pegawai_id: pegId }));
          const [resUsulan, resJaf] = await Promise.all([
            simpegService.getUsulanJafungList({ pegawai_id: pegId, page, limit, search: search || undefined, sort_by: filterOrderBy, sort_dir: filterOrderDir }),
            simpegService.getJabatanFungsionalList(),
          ]);
          setUsulanList(resUsulan.data || []);
          if ((resUsulan as any).meta) setMeta((resUsulan as any).meta);
          setJafungList(resJaf.data || []);
        }
      } else {
        const [resUsulan, resJaf] = await Promise.all([
          simpegService.getUsulanJafungList({ page, limit, search: search || undefined, sort_by: filterOrderBy, sort_dir: filterOrderDir }),
          simpegService.getJabatanFungsionalList(),
        ]);
        setUsulanList(resUsulan.data || []);
        if ((resUsulan as any).meta) setMeta((resUsulan as any).meta);
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
  }, [canRead, page, limit, filterOrderBy, filterOrderDir]);

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

  const columns: ColumnDef<UsulanJafung>[] = [
    {
      key: 'nama_dosen',
      label: 'Nama Dosen',
      render: (u) => (
        <span className="font-bold">
          {u.pegawai?.nama_lengkap || `Dosen ID ${u.pegawai_id}`}
        </span>
      ),
    },
    {
      key: 'jafung_asal',
      label: 'Jafung Asal',
      render: (u) => u.jafung_asal?.nama || 'Tenaga Pengajar',
    },
    {
      key: 'jafung_tujuan',
      label: 'Jafung Tujuan',
      render: (u) => (
        <Badge variant="purple" className="font-bold">
          {u.jafung_tujuan?.nama || `Jafung ID ${u.jafung_tujuan_id}`}
        </Badge>
      ),
    },
    {
      key: 'angka_kredit',
      label: 'Angka Kredit (KUM)',
      render: (u) => <span className="font-bold text-[var(--success)]">{u.angka_kredit_usulan} KUM</span>,
    },
    {
      key: 'catatan_reviewer',
      label: 'Catatan Reviewer Tim Senat',
      render: (u) => <span className="text-sm text-[var(--text-secondary)]">{u.catatan_reviewer || '-'}</span>,
    },
  ];

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
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setShowFilter(true)}
            >
              Filter
            </Button>
            {canCreate && (
              <Button icon={<Plus size={16} />} onClick={() => setShowModal(true)}>
                Ajukan Kenaikan Jafung
              </Button>
            )}
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={usulanList}
        isLoading={loading}
        meta={meta}
        onPageChange={(newPage) => setPage(newPage)}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
        emptyMessage="Belum ada usulan kenaikan Jafung Dosen."
      />

      {/* Drawer Filter */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Usulan Jafung Dosen"
      >
        <div className="space-y-4">
          <Input
            label="Cari Dosen / Jafung"
            placeholder="Ketik nama dosen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <hr className="my-2 border-slate-200" />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={filterOrderBy}
              onChange={(val) => setFilterOrderBy(val)}
              options={[
                { value: 'created_at', label: 'Tanggal Dibuat' },
                { value: 'angka_kredit_usulan', label: 'KUM Usulan' },
                { value: 'id', label: 'ID' },
              ]}
            />
            <Select
              label="Arah"
              value={filterOrderDir}
              onChange={(val) => setFilterOrderDir(val as 'asc' | 'desc')}
              options={[
                { value: 'desc', label: 'Z - A (Terbaru)' },
                { value: 'asc', label: 'A - Z (Terlama)' },
              ]}
            />
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSearch('');
                setFilterOrderBy('created_at');
                setFilterOrderDir('desc');
              }}
            >
              Reset
            </Button>
            <Button
              onClick={() => {
                setShowFilter(false);
                loadData();
              }}
            >
              Terapkan
            </Button>
          </div>
        </div>
      </Drawer>

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
