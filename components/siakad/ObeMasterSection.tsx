'use client';

import { useState, useEffect } from 'react';
import { Plus, Filter, Edit2, Trash2, BookOpen, Layers, Award, CheckSquare, Grid, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

type MasterObeSubTab = 'tahun_kurikulum' | 'rumpun_mk' | 'jenis_cpl' | 'matakuliah' | 'distribusi_mk' | 'rubrik';

interface ObeMasterSectionProps {
  prodis: any[];
  selectedProdiId: number | string;
  onProdiChange?: (id: string) => void;
}

export function ObeMasterSection({ prodis, selectedProdiId, onProdiChange }: ObeMasterSectionProps) {
  const [activeSubTab, setActiveSubTab] = useState<MasterObeSubTab>('tahun_kurikulum');
  const [loading, setLoading] = useState(false);

  // Tab Data States
  const [kurikulums, setKurikulums] = useState<any[]>([]);
  const [rumpuns, setRumpuns] = useState<any[]>([]);
  const [jenisCpls, setJenisCpls] = useState<any[]>([]);
  const [mataKuliahs, setMataKuliahs] = useState<any[]>([]);
  const [distribusi, setDistribusi] = useState<any>(null);
  const [rubriks, setRubriks] = useState<any[]>([]);

  // Pagination Meta
  const [meta, setMeta] = useState<any>(undefined);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Filter Drawer State
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterSortBy, setFilterSortBy] = useState('nama');
  const [filterSortDir, setFilterSortDir] = useState<'asc' | 'desc'>('asc');
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    sortBy: 'nama',
    sortDir: 'asc' as 'asc' | 'desc',
  });

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingItem, setDeletingItem] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form State - Rumpun MK
  const [formKodeRumpun, setFormKodeRumpun] = useState('');
  const [formNamaRumpun, setFormNamaRumpun] = useState('');
  const [formDeskripsiRumpun, setFormDeskripsiRumpun] = useState('');

  // Form State - Jenis CPL
  const [formKodeJenis, setFormKodeJenis] = useState('');
  const [formNamaJenis, setFormNamaJenis] = useState('');
  const [formUrutanJenis, setFormUrutanJenis] = useState(1);

  // Form State - Tahun Kurikulum
  const [formKodeKurikulum, setFormKodeKurikulum] = useState('');
  const [formNamaKurikulum, setFormNamaKurikulum] = useState('');
  const [formTahunBerlaku, setFormTahunBerlaku] = useState(2026);
  const [formTotalSksLulus, setFormTotalSksLulus] = useState(144);

  // Form State - Rubrik
  const [formKodeRubrik, setFormKodeRubrik] = useState('');
  const [formNamaRubrik, setFormNamaRubrik] = useState('');
  const [formTipeRubrik, setFormTipeRubrik] = useState('analitik');
  const [formKriterias, setFormKriterias] = useState<any[]>([
    { nama_kriteria: 'Penguasaan Konsep', bobot_persen: 50, deskripsi_sangat_baik: '', deskripsi_baik: '', deskripsi_cukup: '', deskripsi_kurang: '' },
    { nama_kriteria: 'Implementasi & Hasil', bobot_persen: 50, deskripsi_sangat_baik: '', deskripsi_baik: '', deskripsi_cukup: '', deskripsi_kurang: '' }
  ]);

  const fetchData = async () => {
    if (!selectedProdiId) return;
    setLoading(true);
    try {
      const pId = Number(selectedProdiId);

      if (activeSubTab === 'tahun_kurikulum') {
        const res = await siakadService.getKurikulums({ program_studi_id: pId, search: appliedFilters.search || undefined, page, limit });
        if (res.data) setKurikulums(Array.isArray(res.data) ? res.data : (res.data.items || []));
      } else if (activeSubTab === 'rumpun_mk') {
        const res = await siakadService.getRumpunMataKuliah({ program_studi_id: pId, search: appliedFilters.search || undefined, sort_by: appliedFilters.sortBy, sort_order: appliedFilters.sortDir, page, limit });
        if (res.data) {
          setRumpuns(res.data);
          setMeta(res.meta);
        }
      } else if (activeSubTab === 'jenis_cpl') {
        const res = await siakadService.getJenisCpl({ program_studi_id: pId, search: appliedFilters.search || undefined, sort_by: appliedFilters.sortBy, sort_order: appliedFilters.sortDir, page, limit });
        if (res.data) {
          setJenisCpls(res.data);
          setMeta(res.meta);
        }
      } else if (activeSubTab === 'matakuliah') {
        const res = await siakadService.getMataKuliahs({ program_studi_id: pId, search: appliedFilters.search || undefined, page, limit });
        if (res.data) {
          setMataKuliahs(res.data);
          setMeta(res.meta);
        }
      } else if (activeSubTab === 'distribusi_mk') {
        const res = await siakadService.getDistribusiMataKuliah({ program_studi_id: pId });
        if (res.data) setDistribusi(res.data);
      } else if (activeSubTab === 'rubrik') {
        const res = await siakadService.getObeRubrikList({ program_studi_id: pId, search: appliedFilters.search || undefined, sort_by: appliedFilters.sortBy, sort_order: appliedFilters.sortDir, page, limit });
        if (res.data) {
          setRubriks(res.data);
          setMeta(res.meta);
        }
      }
    } catch {
      toast.error('Gagal memuat data master OBE');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeSubTab, selectedProdiId, appliedFilters, page, limit]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    if (activeSubTab === 'rumpun_mk') {
      setFormKodeRumpun('');
      setFormNamaRumpun('');
      setFormDeskripsiRumpun('');
    } else if (activeSubTab === 'jenis_cpl') {
      setFormKodeJenis('');
      setFormNamaJenis('');
      setFormUrutanJenis(jenisCpls.length + 1);
    } else if (activeSubTab === 'tahun_kurikulum') {
      setFormKodeKurikulum('');
      setFormNamaKurikulum('');
      setFormTahunBerlaku(new Date().getFullYear());
      setFormTotalSksLulus(144);
    } else if (activeSubTab === 'rubrik') {
      setFormKodeRubrik('');
      setFormNamaRubrik('');
      setFormTipeRubrik('analitik');
      setFormKriterias([
        { nama_kriteria: 'Penguasaan Konsep', bobot_persen: 50, deskripsi_sangat_baik: '', deskripsi_baik: '', deskripsi_cukup: '', deskripsi_kurang: '' },
        { nama_kriteria: 'Implementasi & Hasil', bobot_persen: 50, deskripsi_sangat_baik: '', deskripsi_baik: '', deskripsi_cukup: '', deskripsi_kurang: '' }
      ]);
    }
    setModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    if (activeSubTab === 'rumpun_mk') {
      setFormKodeRumpun(item.kode_rumpun);
      setFormNamaRumpun(item.nama_rumpun);
      setFormDeskripsiRumpun(item.deskripsi || '');
    } else if (activeSubTab === 'jenis_cpl') {
      setFormKodeJenis(item.kode_jenis);
      setFormNamaJenis(item.nama_jenis);
      setFormUrutanJenis(item.urutan || 1);
    } else if (activeSubTab === 'tahun_kurikulum') {
      setFormKodeKurikulum(item.kode);
      setFormNamaKurikulum(item.nama);
      setFormTahunBerlaku(item.tahun_berlaku || 2026);
      setFormTotalSksLulus(item.total_sks_lulus || 144);
    } else if (activeSubTab === 'rubrik') {
      setFormKodeRubrik(item.kode_rubrik);
      setFormNamaRubrik(item.nama_rubrik);
      setFormTipeRubrik(item.tipe_rubrik || 'analitik');
      setFormKriterias(item.kriterias && item.kriterias.length > 0 ? item.kriterias : [
        { nama_kriteria: 'Penguasaan Konsep', bobot_persen: 100 }
      ]);
    }
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const pId = Number(selectedProdiId);
      if (activeSubTab === 'rumpun_mk') {
        const payload = { program_studi_id: pId, kode_rumpun: formKodeRumpun, nama_rumpun: formNamaRumpun, deskripsi: formDeskripsiRumpun, is_active: true };
        if (editingItem) {
          await siakadService.updateRumpunMataKuliah(editingItem.id, payload);
          toast.success('Rumpun Mata Kuliah berhasil diperbarui');
        } else {
          await siakadService.createRumpunMataKuliah(payload);
          toast.success('Rumpun Mata Kuliah baru berhasil disimpan');
        }
      } else if (activeSubTab === 'jenis_cpl') {
        const payload = { program_studi_id: pId, kode_jenis: formKodeJenis, nama_jenis: formNamaJenis, urutan: formUrutanJenis, is_active: true };
        if (editingItem) {
          await siakadService.updateJenisCpl(editingItem.id, payload);
          toast.success('Jenis CPL berhasil diperbarui');
        } else {
          await siakadService.createJenisCpl(payload);
          toast.success('Jenis CPL baru berhasil disimpan');
        }
      } else if (activeSubTab === 'tahun_kurikulum') {
        const payload = { program_studi_id: pId, kode: formKodeKurikulum, nama: formNamaKurikulum, tahun_berlaku: formTahunBerlaku, total_sks_lulus: formTotalSksLulus, is_active: true };
        if (editingItem) {
          await siakadService.updateKurikulum(editingItem.id, payload);
          toast.success('Tahun Kurikulum berhasil diperbarui');
        } else {
          await siakadService.createKurikulum(payload);
          toast.success('Tahun Kurikulum baru berhasil disimpan');
        }
      } else if (activeSubTab === 'rubrik') {
        const payload = { program_studi_id: pId, kode_rubrik: formKodeRubrik, nama_rubrik: formNamaRubrik, tipe_rubrik: formTipeRubrik, kriterias: formKriterias, is_active: true };
        if (editingItem) {
          await siakadService.updateObeRubrik(editingItem.id, payload);
          toast.success('Rubrik Penilaian OBE berhasil diperbarui');
        } else {
          await siakadService.createObeRubrik(payload);
          toast.success('Rubrik Penilaian OBE baru berhasil disimpan');
        }
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan data master');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setDeleting(true);
    try {
      if (activeSubTab === 'rumpun_mk') {
        await siakadService.deleteRumpunMataKuliah(deletingItem.id);
      } else if (activeSubTab === 'jenis_cpl') {
        await siakadService.deleteJenisCpl(deletingItem.id);
      } else if (activeSubTab === 'tahun_kurikulum') {
        await siakadService.deleteKurikulum(deletingItem.id);
      } else if (activeSubTab === 'rubrik') {
        await siakadService.deleteObeRubrik(deletingItem.id);
      } else if (activeSubTab === 'matakuliah') {
        await siakadService.deleteMataKuliah(deletingItem.id);
      }
      toast.success('Data berhasil dihapus');
      setDeletingItem(null);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus data');
    } finally {
      setDeleting(false);
    }
  };

  // Columns Definitions
  const kurikulumColumns: ColumnDef<any>[] = [
    { key: 'id', label: 'NO', align: 'center', render: (_r, i) => <span className="font-bold text-slate-400 text-xs">{i + 1}</span> },
    { key: 'kode', label: 'KODE KURIKULUM', render: (r) => <span className="font-mono font-bold text-slate-900 text-xs">{r.kode}</span> },
    { key: 'nama', label: 'NAMA KURIKULUM', render: (r) => <span className="font-bold text-slate-800 text-xs block">{r.nama}</span> },
    { key: 'tahun_berlaku', label: 'TAHUN BERLAKU', align: 'center', render: (r) => <span className="font-mono text-xs font-bold text-slate-700">{r.tahun_berlaku}</span> },
    { key: 'total_sks_lulus', label: 'SYARAT SKS LULUS', align: 'center', render: (r) => <Badge variant="blue">{r.total_sks_lulus || 144} SKS</Badge> },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (r) => (
        <div className="flex justify-end">
          <DropdownMenu
            items={[
              { label: 'Edit Kurikulum', icon: <Edit2 size={14} />, onClick: () => handleOpenEdit(r) },
              { label: 'Hapus Kurikulum', icon: <Trash2 size={14} />, variant: 'danger', onClick: () => setDeletingItem(r) },
            ]}
          />
        </div>
      ),
    },
  ];

  const rumpunColumns: ColumnDef<any>[] = [
    { key: 'id', label: 'NO', align: 'center', render: (_r, i) => <span className="font-bold text-slate-400 text-xs">{meta?.from ? meta.from + i : i + 1}</span> },
    { key: 'kode_rumpun', label: 'KODE RUMPUN', render: (r) => <span className="font-mono font-bold text-slate-900 text-xs">{r.kode_rumpun}</span> },
    {
      key: 'nama_rumpun',
      label: 'NAMA RUMPUN ILMU / BIDANG',
      render: (r) => (
        <div>
          <span className="font-bold text-slate-900 text-xs block">{r.nama_rumpun}</span>
          <span className="text-2xs text-slate-500">{r.deskripsi || '-'}</span>
        </div>
      ),
    },
    { key: 'status', label: 'STATUS', align: 'center', render: (r) => r.is_active ? <Badge variant="green">Aktif</Badge> : <Badge variant="red">Nonaktif</Badge> },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (r) => (
        <div className="flex justify-end">
          <DropdownMenu
            items={[
              { label: 'Edit Rumpun', icon: <Edit2 size={14} />, onClick: () => handleOpenEdit(r) },
              { label: 'Hapus Rumpun', icon: <Trash2 size={14} />, variant: 'danger', onClick: () => setDeletingItem(r) },
            ]}
          />
        </div>
      ),
    },
  ];

  const jenisCplColumns: ColumnDef<any>[] = [
    { key: 'urutan', label: 'URUTAN', align: 'center', render: (r) => <span className="font-bold text-slate-500 text-xs">#{r.urutan || 1}</span> },
    { key: 'kode_jenis', label: 'KODE KATEGORI', render: (r) => <span className="font-mono font-bold text-slate-900 text-xs">{r.kode_jenis}</span> },
    { key: 'nama_jenis', label: 'NAMA KATEGORI / ASPEK CPL', render: (r) => <span className="font-bold text-slate-900 text-xs">{r.nama_jenis}</span> },
    { key: 'status', label: 'STATUS', align: 'center', render: (r) => r.is_active ? <Badge variant="green">Aktif</Badge> : <Badge variant="red">Nonaktif</Badge> },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (r) => (
        <div className="flex justify-end">
          <DropdownMenu
            items={[
              { label: 'Edit Jenis CPL', icon: <Edit2 size={14} />, onClick: () => handleOpenEdit(r) },
              { label: 'Hapus Jenis CPL', icon: <Trash2 size={14} />, variant: 'danger', onClick: () => setDeletingItem(r) },
            ]}
          />
        </div>
      ),
    },
  ];

  const mkColumns: ColumnDef<any>[] = [
    { key: 'id', label: 'NO', align: 'center', render: (_r, i) => <span className="font-bold text-slate-400 text-xs">{meta?.from ? meta.from + i : i + 1}</span> },
    { key: 'kode_mk', label: 'KODE MK', render: (r) => <span className="font-mono font-bold text-slate-900 text-xs">{r.kode_mk}</span> },
    {
      key: 'nama',
      label: 'NAMA MATA KULIAH',
      render: (r) => (
        <div>
          <span className="font-bold text-slate-900 text-xs block">{r.nama}</span>
          <span className="text-2xs text-slate-500 font-mono">
            {r.sks_teori || 0} SKS Teori + {r.sks_praktik || 0} SKS Praktik ({r.total_sks} SKS)
          </span>
        </div>
      ),
    },
    { key: 'semester_anjuran', label: 'SEMESTER', align: 'center', render: (r) => <span className="font-mono font-bold text-slate-700 text-xs">Sem. {r.semester_anjuran}</span> },
    { key: 'rumpun', label: 'RUMPUN ILMU', render: (r) => <span className="text-xs text-slate-700 font-medium">{r.rumpun_mata_kuliah?.nama_rumpun || '-'}</span> },
    { key: 'tipe', label: 'TIPE', align: 'center', render: (r) => <Badge variant={r.tipe === 'pilihan' ? 'purple' : 'blue'} className="capitalize">{r.tipe || 'Wajib'}</Badge> },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (r) => (
        <div className="flex justify-end">
          <DropdownMenu
            items={[
              { label: 'Hapus Mata Kuliah', icon: <Trash2 size={14} />, variant: 'danger', onClick: () => setDeletingItem(r) },
            ]}
          />
        </div>
      ),
    },
  ];

  const rubrikColumns: ColumnDef<any>[] = [
    { key: 'id', label: 'NO', align: 'center', render: (_r, i) => <span className="font-bold text-slate-400 text-xs">{meta?.from ? meta.from + i : i + 1}</span> },
    { key: 'kode_rubrik', label: 'KODE RUBRIK', render: (r) => <span className="font-mono font-bold text-slate-900 text-xs">{r.kode_rubrik}</span> },
    {
      key: 'nama_rubrik',
      label: 'NAMA RUBRIK ASESMEN',
      render: (r) => (
        <div>
          <span className="font-bold text-slate-900 text-xs block">{r.nama_rubrik}</span>
          <span className="text-2xs text-slate-500">Kriteria: {r.kriterias?.length || 0} kriteria asesmen</span>
        </div>
      ),
    },
    { key: 'tipe_rubrik', label: 'TIPE RUBRIK', align: 'center', render: (r) => <Badge variant="blue" className="capitalize">{r.tipe_rubrik}</Badge> },
    { key: 'status', label: 'STATUS', align: 'center', render: (r) => r.is_active ? <Badge variant="green">Aktif</Badge> : <Badge variant="red">Nonaktif</Badge> },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (r) => (
        <div className="flex justify-end">
          <DropdownMenu
            items={[
              { label: 'Edit Rubrik', icon: <Edit2 size={14} />, onClick: () => handleOpenEdit(r) },
              { label: 'Hapus Rubrik', icon: <Trash2 size={14} />, variant: 'danger', onClick: () => setDeletingItem(r) },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Sub-Tab Navigation */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto">
        <button
          onClick={() => { setActiveSubTab('tahun_kurikulum'); setPage(1); }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeSubTab === 'tahun_kurikulum'
              ? 'border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle)]'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Calendar size={15} />
          <span>Tahun Kurikulum</span>
        </button>

        <button
          onClick={() => { setActiveSubTab('rumpun_mk'); setPage(1); }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeSubTab === 'rumpun_mk'
              ? 'border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle)]'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Layers size={15} />
          <span>Rumpun Mata Kuliah</span>
        </button>

        <button
          onClick={() => { setActiveSubTab('jenis_cpl'); setPage(1); }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeSubTab === 'jenis_cpl'
              ? 'border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle)]'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Award size={15} />
          <span>Jenis CPL</span>
        </button>

        <button
          onClick={() => { setActiveSubTab('matakuliah'); setPage(1); }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeSubTab === 'matakuliah'
              ? 'border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle)]'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
          }`}
        >
          <BookOpen size={15} />
          <span>Mata Kuliah</span>
        </button>

        <button
          onClick={() => { setActiveSubTab('distribusi_mk'); setPage(1); }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeSubTab === 'distribusi_mk'
              ? 'border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle)]'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Grid size={15} />
          <span>Distribusi Mata Kuliah</span>
        </button>

        <button
          onClick={() => { setActiveSubTab('rubrik'); setPage(1); }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeSubTab === 'rubrik'
              ? 'border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle)]'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
          }`}
        >
          <CheckSquare size={15} />
          <span>Rubrik Penilaian</span>
        </button>
      </div>

      {/* Action Bar Sub-tab */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <span className="text-xs font-bold text-slate-600">
          Kelola data {activeSubTab.replace('_', ' ').toUpperCase()}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" icon={<Filter size={16} />} onClick={() => setShowFilter(true)}>
            Filter
          </Button>
          {activeSubTab !== 'distribusi_mk' && activeSubTab !== 'matakuliah' && (
            <Button variant="primary" icon={<Plus size={16} />} onClick={handleOpenCreate}>
              Tambah Data
            </Button>
          )}
        </div>
      </div>

      {/* Sub-tab Content */}
      {activeSubTab === 'tahun_kurikulum' && (
        <DataTable
          columns={kurikulumColumns}
          data={kurikulums}
          isLoading={loading}
          emptyMessage="Belum ada data kurikulum untuk prodi ini."
        />
      )}

      {activeSubTab === 'rumpun_mk' && (
        <DataTable
          columns={rumpunColumns}
          data={rumpuns}
          isLoading={loading}
          meta={meta}
          onPageChange={(p) => setPage(p)}
          onLimitChange={(l) => { setLimit(l); setPage(1); }}
          emptyMessage="Belum ada rumpun mata kuliah yang didaftarkan."
        />
      )}

      {activeSubTab === 'jenis_cpl' && (
        <DataTable
          columns={jenisCplColumns}
          data={jenisCpls}
          isLoading={loading}
          meta={meta}
          onPageChange={(p) => setPage(p)}
          onLimitChange={(l) => { setLimit(l); setPage(1); }}
          emptyMessage="Belum ada jenis / kategori CPL."
        />
      )}

      {activeSubTab === 'matakuliah' && (
        <DataTable
          columns={mkColumns}
          data={mataKuliahs}
          isLoading={loading}
          meta={meta}
          onPageChange={(p) => setPage(p)}
          onLimitChange={(l) => { setLimit(l); setPage(1); }}
          emptyMessage="Belum ada data mata kuliah terdaftar."
        />
      )}

      {activeSubTab === 'distribusi_mk' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">
              Total Kurikulum: <strong className="text-primary-600">{distribusi?.total_sks_keseluruhan || 0} SKS</strong> ({distribusi?.total_mk_keseluruhan || 0} Mata Kuliah)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(distribusi?.semesters || []).map((s: any) => (
              <div key={s.semester} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-bold text-xs text-slate-900">Semester {s.semester}</h4>
                  <Badge variant="blue">{s.total_sks} SKS ({s.total_mk} MK)</Badge>
                </div>
                <div className="space-y-1.5">
                  {(s.mata_kuliahs || []).map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs">
                      <div>
                        <span className="font-mono font-bold text-slate-900 block">{m.kode_mk}</span>
                        <span className="text-slate-700">{m.nama}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-600">{m.total_sks} SKS</span>
                    </div>
                  ))}
                  {s.mata_kuliahs?.length === 0 && (
                    <p className="text-2xs text-slate-400 italic py-2 text-center">Belum ada mata kuliah di semester ini.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'rubrik' && (
        <DataTable
          columns={rubrikColumns}
          data={rubriks}
          isLoading={loading}
          meta={meta}
          onPageChange={(p) => setPage(p)}
          onLimitChange={(l) => { setLimit(l); setPage(1); }}
          emptyMessage="Belum ada rubrik penilaian yang dibuat."
        />
      )}

      {/* Filter Drawer */}
      <Drawer
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Data Master OBE"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button
              variant="outline"
              onClick={() => {
                setFilterSearch('');
                setFilterSortBy('nama');
                setFilterSortDir('asc');
                setAppliedFilters({ search: '', sortBy: 'nama', sortDir: 'asc' });
                setPage(1);
                setShowFilter(false);
              }}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setAppliedFilters({ search: filterSearch, sortBy: filterSortBy, sortDir: filterSortDir });
                setPage(1);
                setShowFilter(false);
              }}
            >
              Terapkan
            </Button>
          </div>
        }
      >
        <div className="space-y-4 p-4">
          <Input
            label="Kata Kunci Pencarian"
            placeholder="Cari kode atau nama..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />

          <hr className="border-t border-slate-200 my-1" />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={filterSortBy}
              onChange={(val) => setFilterSortBy(val || 'nama')}
              options={[
                { value: 'nama', label: 'Nama / Label' },
                { value: 'kode', label: 'Kode' },
                { value: 'id', label: 'ID' },
              ]}
            />
            <Select
              label="Arah"
              value={filterSortDir}
              onChange={(val) => setFilterSortDir((val as 'asc' | 'desc') || 'asc')}
              options={[
                { value: 'asc', label: 'A - Z (Naik)' },
                { value: 'desc', label: 'Z - A (Turun)' },
              ]}
            />
          </div>
        </div>
      </Drawer>

      {/* Modal Form Master */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Edit Data Master OBE' : 'Tambah Data Master OBE Baru'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {activeSubTab === 'rumpun_mk' && (
            <div className="space-y-4">
              <Input
                label="Kode Rumpun Mata Kuliah *"
                value={formKodeRumpun}
                onChange={(e) => setFormKodeRumpun(e.target.value)}
                placeholder="Contoh: RMP-SE, RMP-DATA, RMP-NW"
                required
              />
              <Input
                label="Nama Rumpun Ilmu *"
                value={formNamaRumpun}
                onChange={(e) => setFormNamaRumpun(e.target.value)}
                placeholder="Contoh: Rekayasa Perangkat Lunak & Sistem Cerdas"
                required
              />
              <Input
                label="Deskripsi Ruang Lingkup"
                value={formDeskripsiRumpun}
                onChange={(e) => setFormDeskripsiRumpun(e.target.value)}
                placeholder="Keterangan singkat cakupan rumpun..."
              />
            </div>
          )}

          {activeSubTab === 'jenis_cpl' && (
            <div className="space-y-4">
              <Input
                label="Kode Kategori CPL *"
                value={formKodeJenis}
                onChange={(e) => setFormKodeJenis(e.target.value)}
                placeholder="Contoh: SIKAP, KU, KK, PENGETAHUAN"
                required
              />
              <Input
                label="Nama Aspek CPL *"
                value={formNamaJenis}
                onChange={(e) => setFormNamaJenis(e.target.value)}
                placeholder="Contoh: Keterampilan Khusus / Sikap"
                required
              />
              <Input
                label="Urutan Tampilan *"
                type="number"
                value={formUrutanJenis}
                onChange={(e) => setFormUrutanJenis(Number(e.target.value))}
                required
              />
            </div>
          )}

          {activeSubTab === 'tahun_kurikulum' && (
            <div className="space-y-4">
              <Input
                label="Kode Kurikulum *"
                value={formKodeKurikulum}
                onChange={(e) => setFormKodeKurikulum(e.target.value)}
                placeholder="Contoh: KUR-2026-TI"
                required
              />
              <Input
                label="Nama Kurikulum *"
                value={formNamaKurikulum}
                onChange={(e) => setFormNamaKurikulum(e.target.value)}
                placeholder="Contoh: Kurikulum OBE Berbasis MBKM 2026"
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Tahun Mulai Berlaku *"
                  type="number"
                  value={formTahunBerlaku}
                  onChange={(e) => setFormTahunBerlaku(Number(e.target.value))}
                  required
                />
                <Input
                  label="Syarat SKS Lulus *"
                  type="number"
                  value={formTotalSksLulus}
                  onChange={(e) => setFormTotalSksLulus(Number(e.target.value))}
                  required
                />
              </div>
            </div>
          )}

          {activeSubTab === 'rubrik' && (
            <div className="space-y-4">
              <Input
                label="Kode Rubrik *"
                value={formKodeRubrik}
                onChange={(e) => setFormKodeRubrik(e.target.value)}
                placeholder="Contoh: RBK-PROJ-01"
                required
              />
              <Input
                label="Nama Rubrik *"
                value={formNamaRubrik}
                onChange={(e) => setFormNamaRubrik(e.target.value)}
                placeholder="Contoh: Rubrik Asesmen Capaian Proyek"
                required
              />
              <Select
                label="Tipe Rubrik Asesmen *"
                options={[
                  { value: 'analitik', label: 'Analitik (Multi-Kriteria Berbobot)' },
                  { value: 'holistik', label: 'Holistik (Skala Tunggal Global)' },
                  { value: 'skala_persepsi', label: 'Skala Persepsi (Skala Likert)' },
                ]}
                value={formTipeRubrik}
                onChange={(val) => setFormTipeRubrik(val || 'analitik')}
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              {editingItem ? 'Simpan Perubahan' : 'Simpan Data'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDelete}
        title="Hapus Data Master OBE?"
        message={`Apakah Anda yakin ingin menghapus data ${deletingItem?.nama_rumpun || deletingItem?.nama_jenis || deletingItem?.nama_rubrik || deletingItem?.nama || 'item'}? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}
