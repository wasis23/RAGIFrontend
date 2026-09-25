'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  Plus,
  Filter,
  Edit2,
  Trash2,
  RefreshCw,
  Sparkles,
  Shuffle,
  Users,
  Download,
  Upload,
  FileSpreadsheet,
  BookOpen,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { siakadService } from '@/services/siakad.service';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function MahasiswaPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const userRoles = user?.roles?.map((r: any) => (typeof r === 'string' ? r : r.slug)) || [];
  // Dosen murni (bukan admin/kaprodi): hanya bimbingan, read-only
  const isDosenOnly = userRoles.includes('dosen') && !userRoles.includes('superadmin') && !userRoles.includes('admin') && !userRoles.includes('kaprodi') && !userRoles.includes('wakil_prodi');
  const [mahasiswas, setMahasiswas] = useState<any[]>([]);
  const [prodis, setProdis] = useState<any[]>([]);
  const [dosens, setDosens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter Drawer States
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterProdi, setFilterProdi] = useState('');
  const [filterAngkatan, setFilterAngkatan] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDosenPa, setFilterDosenPa] = useState('');
  const [filterNim, setFilterNim] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    prodi: '',
    angkatan: '',
    status: '',
    dosenPa: '',
    nim: '',
  });

  // Bulk PA Assignment State
  const [selectedMhsIds, setSelectedMhsIds] = useState<number[]>([]);
  const [isBulkPaModalOpen, setIsBulkPaModalOpen] = useState(false);
  const [selectedBulkDosenId, setSelectedBulkDosenId] = useState<number | ''>('');
  const [assigningPa, setAssigningPa] = useState(false);

  // Auto Distribute PA State
  const [isAutoDistributeModalOpen, setIsAutoDistributeModalOpen] = useState(false);
  const [distributeDosenIds, setDistributeDosenIds] = useState<number[]>([]);
  const [distributeProdiId, setDistributeProdiId] = useState<string>('');
  const [distributeAngkatan, setDistributeAngkatan] = useState<string>('2025');
  const [distributing, setDistributing] = useState(false);

  // Sync & Generate NIM States
  const [syncingSpmb, setSyncingSpmb] = useState(false);
  const [generatingNims, setGeneratingNims] = useState(false);

  // Individual NIM Assignment Modal
  const [isNimModalOpen, setIsNimModalOpen] = useState(false);
  const [targetMhsForNim, setTargetMhsForNim] = useState<any | null>(null);
  const [nimMethod, setNimMethod] = useState<'standard' | 'no_pendaftaran' | 'custom'>('standard');
  const [customNimInput, setCustomNimInput] = useState('');
  const [generatingIndividualNim, setGeneratingIndividualNim] = useState(false);

  // Batch Generate NIM Modal
  const [isBatchNimModalOpen, setIsBatchNimModalOpen] = useState(false);
  const [batchNimScheme, setBatchNimScheme] = useState<'standard' | 'no_pendaftaran'>('standard');

  // Export / Import NIM CSV States
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Buku Induk States
  const [isBukuModalOpen, setIsBukuModalOpen] = useState(false);
  const [bukuProdi, setBukuProdi] = useState('');
  const [bukuAngkatan, setBukuAngkatan] = useState('');
  const [bukuStatus, setBukuStatus] = useState('');
  const [downloadingBuku, setDownloadingBuku] = useState(false);

  // Ubah Status Akademik States (keluar = dropout, lulus via yudisium)
  const [statusTarget, setStatusTarget] = useState<any | null>(null);
  const [statusForm, setStatusForm] = useState({ status: 'aktif', alasan: '' });
  const [savingStatus, setSavingStatus] = useState(false);

  // Ubah Status Massal (checklist) — hanya aktif/cuti/lulus; dropout/mangkir wajib satuan
  const [isBulkStatusOpen, setIsBulkStatusOpen] = useState(false);
  const [bulkStatusForm, setBulkStatusForm] = useState({ status: 'lulus', alasan: '' });
  const [savingBulkStatus, setSavingBulkStatus] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMhs, setEditingMhs] = useState<any | null>(null);
  const [deletingMhs, setDeletingMhs] = useState<any | null>(null);
  const [form, setForm] = useState({
    nama_lengkap: '',
    nim: '',
    nik: '',
    program_studi_id: 1,
    angkatan: 2025,
    jenis_kelamin: 'L',
    status: 'aktif',
    dosen_wali_id: '',
    telepon: '',
    alamat: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchOptions = async () => {
    try {
      const [pRes, dRes] = await Promise.all([
        siakadService.getProdi(),
        siakadService.getDosens({ per_page: 100 }),
      ]);
      if (pRes.data) setProdis(pRes.data);
      if (dRes.data) {
        setDosens(dRes.data);
        if (dRes.data[0]) setSelectedBulkDosenId(dRes.data[0].id);
      }
    } catch (err) {}
  };

  const fetchMahasiswa = async () => {
    try {
      setLoading(true);
      const res = await siakadService.getMahasiswas({
        search: appliedFilters.search,
        program_studi_id: appliedFilters.prodi,
        angkatan: appliedFilters.angkatan,
        status: appliedFilters.status,
        advisees_only: isDosenOnly ? true : undefined,
      });
      if (res.data) {
        let list = res.data;
        if (appliedFilters.dosenPa === 'unassigned') {
          list = list.filter((m: any) => !m.dosen_wali_id);
        } else if (appliedFilters.dosenPa) {
          list = list.filter((m: any) => String(m.dosen_wali_id) === String(appliedFilters.dosenPa));
        }

        if (appliedFilters.nim === 'unassigned') {
          list = list.filter((m: any) => !m.nim || m.nim === '');
        } else if (appliedFilters.nim === 'assigned') {
          list = list.filter((m: any) => Boolean(m.nim));
        }

        setMahasiswas(list);
      }
    } catch (err: any) {
      toast.error('Gagal memuat data mahasiswa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    fetchMahasiswa();
  }, [appliedFilters, isDosenOnly]);

  const handleSyncSpmb = async () => {
    try {
      setSyncingSpmb(true);
      const res = await siakadService.syncMahasiswaFromSpmb();
      toast.success(res.message || 'Data mahasiswa baru berhasil disinkronkan dari SPMB');
      fetchMahasiswa();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal sinkronisasi data dari SPMB');
    } finally {
      setSyncingSpmb(false);
    }
  };

  const handleOpenNimModal = (mhs: any) => {
    setTargetMhsForNim(mhs);
    const noPendaftaran = mhs.spmb_konversi?.pendaftaran_calon_mhs?.no_pendaftaran;
    if (noPendaftaran) {
      setNimMethod('no_pendaftaran');
      setCustomNimInput(noPendaftaran);
    } else {
      setNimMethod('standard');
      setCustomNimInput('');
    }
    setIsNimModalOpen(true);
  };

  const handleSaveIndividualNim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetMhsForNim) return;

    try {
      setGeneratingIndividualNim(true);
      const payload: any = {
        id: targetMhsForNim.id,
        nama_lengkap: targetMhsForNim.nama_lengkap,
        program_studi_id: targetMhsForNim.program_studi_id,
        angkatan: targetMhsForNim.angkatan,
        jenis_kelamin: targetMhsForNim.jenis_kelamin,
      };

      if (nimMethod === 'no_pendaftaran') {
        payload.use_no_pendaftaran = true;
      } else if (nimMethod === 'custom') {
        if (!customNimInput.trim()) {
          toast.error('Masukkan NIM manual terlebih dahulu');
          return;
        }
        payload.custom_nim = customNimInput.trim();
      }

      await siakadService.generateNim(payload);
      toast.success(`NIM berhasil ditetapkan untuk ${targetMhsForNim.nama_lengkap}`);
      setIsNimModalOpen(false);
      fetchMahasiswa();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal menetapkan NIM');
    } finally {
      setGeneratingIndividualNim(false);
    }
  };

  const handleGenerateMissingNims = async () => {
    try {
      setGeneratingNims(true);
      const res = await siakadService.generateMissingNims({ scheme: batchNimScheme });
      toast.success(res.message || 'NIM berhasil di-generate bagi data yang belum ada');
      setIsBatchNimModalOpen(false);
      fetchMahasiswa();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal generate NIM');
    } finally {
      setGeneratingNims(false);
    }
  };

  const handleExportNim = async () => {
    try {
      setIsExporting(true);
      const blob = await siakadService.exportNimData({
        program_studi_id: appliedFilters.prodi || undefined,
        status: appliedFilters.status || undefined,
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `data_nim_mahasiswa_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Data NIM berhasil diunduh');
    } catch (err: any) {
      toast.error('Gagal mengunduh data NIM');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadBukuInduk = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setDownloadingBuku(true);
      const blob = await siakadService.exportBukuInduk({
        program_studi_id: bukuProdi || undefined,
        angkatan: bukuAngkatan || undefined,
        status: bukuStatus || undefined,
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `buku_induk_${bukuAngkatan || 'semua'}_${bukuStatus || 'semua'}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Buku induk berhasil diunduh');
      setIsBukuModalOpen(false);
    } catch (err: any) {
      toast.error('Gagal mengunduh buku induk');
    } finally {
      setDownloadingBuku(false);
    }
  };

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusTarget) return;
    try {
      setSavingStatus(true);
      const res = await siakadService.updateMahasiswaStatus(statusTarget.id, statusForm);
      toast.success(res.message || 'Status akademik berhasil diperbarui');
      setStatusTarget(null);
      fetchMahasiswa();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal memperbarui status');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleSaveBulkStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMhsIds.length === 0) return;
    try {
      setSavingBulkStatus(true);
      const res = await siakadService.bulkUpdateMahasiswaStatus({
        ids: selectedMhsIds,
        status: bulkStatusForm.status,
        alasan: bulkStatusForm.alasan || undefined,
      });
      toast.success(res.message || 'Status massal berhasil diperbarui');
      setIsBulkStatusOpen(false);
      setSelectedMhsIds([]);
      fetchMahasiswa();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal memperbarui status massal');
    } finally {
      setSavingBulkStatus(false);
    }
  };

  const handleImportNim = async (e: React.FormEvent) => {    e.preventDefault();
    if (!importFile) {
      toast.error('Pilih file CSV terlebih dahulu');
      return;
    }

    try {
      setIsImporting(true);
      const formData = new FormData();
      formData.append('file', importFile);

      const res = await siakadService.importNimData(formData);
      toast.success(res.message || 'Import data NIM berhasil diperbarui');
      setIsImportModalOpen(false);
      setImportFile(null);
      fetchMahasiswa();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal mengimpor file CSV');
    } finally {
      setIsImporting(false);
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedMhsIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedMhsIds.length === mahasiswas.length) {
      setSelectedMhsIds([]);
    } else {
      setSelectedMhsIds(mahasiswas.map((m) => m.id));
    }
  };

  const handleBulkAssignPa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBulkDosenId) {
      toast.error('Pilih Dosen PA terlebih dahulu');
      return;
    }
    try {
      setAssigningPa(true);
      await siakadService.bulkAssignPa({
        mahasiswa_ids: selectedMhsIds,
        dosen_wali_id: Number(selectedBulkDosenId),
      });
      toast.success(`Dosen PA berhasil ditetapkan untuk ${selectedMhsIds.length} mahasiswa`);
      setIsBulkPaModalOpen(false);
      setSelectedMhsIds([]);
      fetchMahasiswa();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal menetapkan Dosen PA');
    } finally {
      setAssigningPa(false);
    }
  };

  const handleAutoDistributePa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (distributeDosenIds.length === 0) {
      toast.error('Pilih minimal 1 Dosen PA untuk distribusi mahasiswa');
      return;
    }
    try {
      setDistributing(true);
      const res = await siakadService.autoDistributePa({
        dosen_ids: distributeDosenIds,
        program_studi_id: distributeProdiId ? Number(distributeProdiId) : undefined,
        angkatan: distributeAngkatan ? Number(distributeAngkatan) : undefined,
      });
      toast.success(res.message || 'Mahasiswa berhasil didistribusikan ke Dosen PA secara merata');
      setIsAutoDistributeModalOpen(false);
      fetchMahasiswa();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal mendistribusikan Dosen PA');
    } finally {
      setDistributing(false);
    }
  };

  const handleOpenModal = (item?: any) => {
    if (item) {
      setEditingMhs(item);
      setForm({
        nama_lengkap: item.nama_lengkap,
        nim: item.nim || '',
        nik: item.nik || '',
        program_studi_id: item.program_studi_id,
        angkatan: item.angkatan || 2025,
        jenis_kelamin: item.jenis_kelamin || 'L',
        status: item.status || 'aktif',
        dosen_wali_id: item.dosen_wali_id ? String(item.dosen_wali_id) : '',
        telepon: item.telepon || '',
        alamat: item.alamat || '',
      });
    } else {
      setEditingMhs(null);
      setForm({
        nama_lengkap: '',
        nim: '',
        nik: '',
        program_studi_id: prodis[0]?.id || 1,
        angkatan: 2025,
        jenis_kelamin: 'L',
        status: 'aktif',
        dosen_wali_id: '',
        telepon: '',
        alamat: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editingMhs) {
        await siakadService.updateMahasiswa(editingMhs.id, form);
        toast.success('Data mahasiswa berhasil diperbarui');
      } else {
        if (!form.nim) {
          await siakadService.generateNim({
            nama_lengkap: form.nama_lengkap,
            program_studi_id: form.program_studi_id,
            angkatan: form.angkatan,
            jenis_kelamin: form.jenis_kelamin,
          });
          toast.success('Mahasiswa & NIM baru berhasil di-generate');
        } else {
          await siakadService.createMahasiswa(form);
          toast.success('Mahasiswa berhasil ditambahkan');
        }
      }
      setIsModalOpen(false);
      fetchMahasiswa();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingMhs) return;
    try {
      await siakadService.deleteMahasiswa(deletingMhs.id);
      toast.success('Mahasiswa berhasil dihapus');
      setDeletingMhs(null);
      fetchMahasiswa();
    } catch (err: any) {
      toast.error('Gagal menghapus mahasiswa');
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      key: 'select',
      label: '',
      align: 'center',
      headerRender: () => (
        <input
          type="checkbox"
          onChange={handleSelectAll}
          checked={mahasiswas.length > 0 && selectedMhsIds.length === mahasiswas.length}
          className="rounded text-primary-600 focus:ring-primary-500 cursor-pointer"
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedMhsIds.includes(row.id)}
          onChange={() => handleToggleSelect(row.id)}
          className="rounded text-primary-600 focus:ring-primary-500 cursor-pointer"
        />
      ),
    },
    {
      key: 'nim',
      label: 'NIM',
      render: (row) => (
        <div className="font-mono">
          {row.nim ? (
            <span className="font-bold text-slate-900 text-xs">{row.nim}</span>
          ) : (
            <div className="flex items-center gap-1.5">
              <Badge variant="amber" className="text-2xs">Belum Ada NIM</Badge>
              <button
                type="button"
                onClick={() => handleOpenNimModal(row)}
                className="text-2xs font-bold text-primary-600 hover:text-primary-800 underline cursor-pointer"
              >
                + Buat NIM
              </button>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'nama_lengkap',
      label: 'NAMA MAHASISWA',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900 text-sm">{row.nama_lengkap}</span>
          {row.konversi_id && (
            <Badge variant="purple" className="text-2xs">Transfer</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'program_studi',
      label: 'PROGRAM STUDI',
      render: (row) => (
        <span className="text-xs font-medium text-slate-700">
          {row.program_studi?.nama || '-'}
        </span>
      ),
    },
    {
      key: 'angkatan',
      label: 'ANGKATAN',
      align: 'center',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-slate-900">
          {row.angkatan}
        </span>
      ),
    },
    {
      key: 'dosen_pa',
      label: 'DOSEN PA (WALI)',
      render: (row) => (
        <div>
          {row.dosen_wali ? (
            <span className="font-bold text-primary-800 bg-primary-50 px-2 py-1 rounded-lg border border-primary-200 text-xs inline-block">
              {row.dosen_wali.nama_lengkap}
            </span>
          ) : (
            <span className="text-2xs text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 font-bold inline-block">
              Belum Ada Dosen PA
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      align: 'center',
      render: (row) => (
        <Badge
          variant={row.status === 'aktif' ? 'green' : row.status === 'cuti' ? 'amber' : 'gray'}
          className="capitalize"
        >
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end">
          <DropdownMenu
            items={[
              {
                label: 'Edit Mahasiswa',
                icon: <Edit2 size={14} />,
                onClick: () => handleOpenModal(row),
              },
              {
                label: row.nim ? 'Ubah / Sesuaikan NIM' : 'Tetapkan NIM',
                icon: <Sparkles size={14} />,
                onClick: () => handleOpenNimModal(row),
              },
              {
                label: 'Ubah Status Akademik',
                icon: <RefreshCw size={14} />,
                onClick: () => {
                  setStatusTarget(row);
                  setStatusForm({ status: row.status || 'aktif', alasan: '' });
                },
              },
              {
                label: 'Hapus Mahasiswa',
                icon: <Trash2 size={14} />,
                variant: 'danger',
                onClick: () => setDeletingMhs(row),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Civitas Mahasiswa"
        description="Data mahasiswa aktif, integrasi SPMB, penomoran NIM otomatis, dan plotting Dosen Pembimbing Akademik."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Mahasiswa' },
        ]}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setShowFilter(true)}
            >
              Filter
            </Button>
            {!isDosenOnly && (
              <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={() => router.push('/siakad/civitas/mahasiswa/create')}
              >
                Tambah Mahasiswa
              </Button>
            )}
          </div>
        }
      />

      {!isDosenOnly && (
      <>
      {/* Bilah Alat Massal — dikelompokkan agar header tidak berantakan */}
      <div className="card p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <FileSpreadsheet size={17} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold text-slate-900">Kelola NIM Massal</p>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <Button variant="outline" size="sm" className="text-2xs py-1 px-2.5 h-auto" icon={<Download size={13} />} onClick={handleExportNim} disabled={isExporting}>
                {isExporting ? 'Mengunduh...' : 'Export CSV'}
              </Button>
              <Button variant="outline" size="sm" className="text-2xs py-1 px-2.5 h-auto" icon={<Upload size={13} />} onClick={() => setIsImportModalOpen(true)}>
                Import
              </Button>
              <Button variant="outline" size="sm" className="text-2xs py-1 px-2.5 h-auto" icon={<Sparkles size={13} />} onClick={() => setIsBatchNimModalOpen(true)}>
                Generate
              </Button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 md:border-l md:border-slate-100 md:pl-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <RefreshCw size={17} className={syncingSpmb ? 'animate-spin' : ''} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold text-slate-900">Sinkronisasi SPMB</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <Button variant="outline" size="sm" className="text-2xs py-1 px-2.5 h-auto" onClick={handleSyncSpmb} disabled={syncingSpmb}>
                {syncingSpmb ? 'Menyinkronkan...' : 'Tarik Pendaftar Lulus →'}
              </Button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 md:border-l md:border-slate-100 md:pl-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <BookOpen size={17} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold text-slate-900">Buku Induk</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <Button
                variant="outline"
                size="sm"
                className="text-2xs py-1 px-2.5 h-auto"
                icon={<Download size={13} />}
                onClick={() => {
                  setBukuProdi(appliedFilters.prodi || '');
                  setBukuAngkatan('');
                  setBukuStatus('');
                  setIsBukuModalOpen(true);
                }}
              >
                Unduh Rekap (CSV)
              </Button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 md:border-l md:border-slate-100 md:pl-3">
          <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
            <Users size={17} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold text-slate-900">Dosen PA {selectedMhsIds.length > 0 && <span className="text-primary-600">({selectedMhsIds.length} dipilih)</span>}</p>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className="text-2xs py-1 px-2.5 h-auto"
                icon={<GraduationCap size={13} />}
                onClick={() => {
                  if (selectedMhsIds.length === 0) {
                    toast('Centang mahasiswa di tabel terlebih dahulu untuk menetapkan Dosen PA.', { icon: 'ℹ️' });
                  } else {
                    setIsBulkPaModalOpen(true);
                  }
                }}
              >
                Plotting PA
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-2xs py-1 px-2.5 h-auto"
                icon={<Shuffle size={13} />}
                onClick={() => {
                  setDistributeDosenIds(dosens.slice(0, 3).map((d) => d.id));
                  setIsAutoDistributeModalOpen(true);
                }}
              >
                Bagi Rata DPA
              </Button>
            </div>
          </div>
        </div>
      </div>
      </>
      )}

      {isDosenOnly && (
        <p className="text-2xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
          Menampilkan <strong>mahasiswa bimbingan Anda</strong> saja. Kelola catatan dan aktivitas di menu Bimbingan PA.
        </p>
      )}

      {/* Floating Action Bar jika ada mahasiswa yang dicentang */}
      {!isDosenOnly && selectedMhsIds.length > 0 && (
        <div className="card p-4 flex items-center justify-between border-primary-500 bg-primary-950 text-white shadow-xl animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-700 text-white font-black flex items-center justify-center text-xs">
              {selectedMhsIds.length}
            </div>
            <div>
              <p className="text-xs font-extrabold text-white">
                {selectedMhsIds.length} Mahasiswa Terpilih
              </p>
              <p className="text-2xs text-primary-200">
                Siap ditetapkan Dosen Pembimbing Akademik (Dosen PA) secara bersamaan.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              className="text-xs font-bold py-1.5 px-3 h-auto"
              onClick={() => setSelectedMhsIds([])}
            >
              Batal
            </Button>
            <Button
              variant="secondary"
              className="text-xs font-bold py-1.5 px-3 h-auto"
              onClick={() => {
                setBulkStatusForm({ status: 'lulus', alasan: '' });
                setIsBulkStatusOpen(true);
              }}
            >
              Ubah Status Massal
            </Button>
            <Button
              variant="primary"
              className="text-xs font-bold py-1.5 px-4 h-auto bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs border-none"
              onClick={() => setIsBulkPaModalOpen(true)}
            >
              Tetapkan Dosen PA Sekarang →
            </Button>
          </div>
        </div>
      )}

      {/* Full-bleed DataTable Card */}
      <DataTable
        columns={isDosenOnly ? columns.filter((c) => c.key !== 'select' && c.key !== 'aksi') : columns}
        data={mahasiswas}
        isLoading={loading}
        emptyMessage="Belum ada data mahasiswa yang terdaftar."
      />

      {/* Filter Drawer */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Mahasiswa"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setFilterSearch('');
                setFilterProdi('');
                setFilterAngkatan('');
                setFilterNim('');
                setFilterDosenPa('');
                setFilterStatus('');
                setAppliedFilters({ search: '', prodi: '', angkatan: '', nim: '', dosenPa: '', status: '' });
                setShowFilter(false);
              }}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setAppliedFilters({
                  search: filterSearch,
                  prodi: filterProdi,
                  angkatan: filterAngkatan,
                  nim: filterNim,
                  dosenPa: filterDosenPa,
                  status: filterStatus,
                });
                setShowFilter(false);
              }}
            >
              Terapkan
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-5">
          <Input
            label="NIM, NIK, atau Nama Mahasiswa"
            placeholder="Ketik kata kunci pencarian..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />

          <div>
            <label className="label">Program Studi</label>
            <select
              value={filterProdi}
              onChange={(e) => setFilterProdi(e.target.value)}
              className="select w-full"
            >
              <option value="">Semua Program Studi</option>
              {prodis.map((p) => (
                <option key={p.id} value={p.id.toString()}>{p.nama}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Tahun Angkatan</label>
            <select
              value={filterAngkatan}
              onChange={(e) => setFilterAngkatan(e.target.value)}
              className="select w-full"
            >
              <option value="">Semua Angkatan</option>
              {Array.from({ length: 8 }, (_, i) => new Date().getFullYear() - i).map((yr) => (
                <option key={yr} value={String(yr)}>Angkatan {yr}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Status Kepemilikan NIM</label>
            <select
              value={filterNim}
              onChange={(e) => setFilterNim(e.target.value)}
              className="select w-full"
            >
              <option value="">Semua Status NIM</option>
              <option value="unassigned">⚠️ Belum Memiliki NIM</option>
              <option value="assigned">✓ Sudah Memiliki NIM</option>
            </select>
          </div>

          <div>
            <label className="label">Dosen Pembimbing Akademik (PA)</label>
            <select
              value={filterDosenPa}
              onChange={(e) => setFilterDosenPa(e.target.value)}
              className="select w-full"
            >
              <option value="">Semua Dosen PA</option>
              <option value="unassigned">⚠️ Belum Memiliki Dosen PA</option>
              {dosens.map((d) => (
                <option key={d.id} value={d.id.toString()}>{d.nama_lengkap}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Status Akademik</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="select w-full"
            >
              <option value="">Semua Status</option>
              <option value="aktif">Aktif</option>
              <option value="cuti">Cuti</option>
              <option value="mangkir">Mangkir</option>
              <option value="lulus">Lulus</option>
            </select>
          </div>
        </div>
      </Drawer>

      {/* Modal Plotting Dosen PA Massal */}
      <Modal
        open={isBulkPaModalOpen}
        onClose={() => setIsBulkPaModalOpen(false)}
        title="Plotting Dosen Pembimbing Akademik (PA)"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsBulkPaModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleBulkAssignPa} disabled={assigningPa}>
              {assigningPa ? 'Menyimpan...' : `Tetapkan untuk ${selectedMhsIds.length} Mahasiswa`}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Pilih Dosen PA yang akan membimbing <strong>{selectedMhsIds.length} mahasiswa</strong> terpilih.
          </p>

          <div>
            <label className="label">Pilih Dosen Pembimbing Akademik (PA) *</label>
            <select
              required
              value={selectedBulkDosenId}
              onChange={(e) => setSelectedBulkDosenId(Number(e.target.value))}
              className="select w-full font-bold"
            >
              {dosens.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nama_lengkap} (NIDN: {d.nidn || '-'})
                </option>
              ))}
            </select>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-2xs text-slate-600 space-y-1">
            <p>• Dosen PA berhak memverifikasi dan menyetujui pengajuan KRS mahasiswa.</p>
            <p>• Dosen PA memonitor rekap nilai KHS dan perkembangan indeks prestasi kumulatif.</p>
          </div>
        </div>
      </Modal>

      {/* Modal Distribusi Bagi Rata Dosen PA Otomatis */}
      <Modal
        open={isAutoDistributeModalOpen}
        onClose={() => setIsAutoDistributeModalOpen(false)}
        title="Distribusi / Bagi Rata Dosen PA Otomatis"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsAutoDistributeModalOpen(false)}>
              Batal
            </Button>
            <Button
              variant="primary"
              onClick={handleAutoDistributePa}
              disabled={distributing || distributeDosenIds.length === 0}
            >
              {distributing ? 'Mendistribusikan...' : `Bagi Rata ke (${distributeDosenIds.length}) Dosen`}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 leading-relaxed">
            Sistem akan mengambil seluruh mahasiswa aktif yang <strong>belum memiliki Dosen PA</strong> pada Program Studi / Angkatan terpilih, kemudian membagikannya secara proporsional dan merata (Round-Robin) kepada daftar dosen yang dicentang di bawah.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label">Target Program Studi</label>
              <select
                value={distributeProdiId}
                onChange={(e) => setDistributeProdiId(e.target.value)}
                className="select w-full text-xs font-bold"
              >
                <option value="">Semua Program Studi</option>
                {prodis.map((p) => (
                  <option key={p.id} value={p.id}>{p.nama}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Target Angkatan</label>
              <select
                value={distributeAngkatan}
                onChange={(e) => setDistributeAngkatan(e.target.value)}
                className="select w-full text-xs font-bold"
              >
                <option value="">Semua Angkatan</option>
                {Array.from({ length: 6 }, (_, i) => {
                  const y = new Date().getFullYear() - i;
                  return <option key={y} value={y}>{y}</option>;
                })}
              </select>
            </div>
          </div>

          <div>
            <label className="label flex items-center justify-between">
              <span>Pilih Dosen PA Penerima Mahasiswa Bimbingan ({distributeDosenIds.length} Dosen) *</span>
              <button
                type="button"
                className="text-2xs text-primary-600 hover:underline font-bold"
                onClick={() => {
                  if (distributeDosenIds.length === dosens.length) {
                    setDistributeDosenIds([]);
                  } else {
                    setDistributeDosenIds(dosens.map((d) => d.id));
                  }
                }}
              >
                {distributeDosenIds.length === dosens.length ? 'Batal Pilih Semua' : 'Pilih Semua Dosen'}
              </button>
            </label>
            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1.5 bg-slate-50">
              {dosens.map((d) => {
                const isChecked = distributeDosenIds.includes(d.id);
                return (
                  <label
                    key={d.id}
                    className={`flex items-center gap-2 p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                      isChecked ? 'bg-primary-50 text-primary-900 border border-primary-200' : 'bg-white text-slate-700 hover:bg-slate-100 border border-transparent'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setDistributeDosenIds([...distributeDosenIds, d.id]);
                        } else {
                          setDistributeDosenIds(distributeDosenIds.filter((id) => id !== d.id));
                        }
                      }}
                      className="rounded text-primary-600"
                    />
                    <span className="font-bold">{d.nama_lengkap}</span>
                    <span className="text-2xs text-slate-400 font-mono ml-auto">NIDN: {d.nidn || '-'}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal Form Mahasiswa */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMhs ? 'Edit Mahasiswa' : 'Tambah Mahasiswa / Generate NIM'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Mahasiswa'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Nama Lengkap Mahasiswa"
              required
              placeholder="Contoh: Ahmad Fauzi"
              value={form.nama_lengkap}
              onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })}
            />
          </div>

          <Input
            label="NIM (Kosongkan jika auto)"
            disabled={Boolean(editingMhs)}
            placeholder="Kosong = Auto generate"
            value={form.nim}
            onChange={(e) => setForm({ ...form, nim: e.target.value })}
          />

          <div>
            <label className="label">Program Studi *</label>
            <select
              disabled={Boolean(editingMhs)}
              value={form.program_studi_id}
              onChange={(e) => setForm({ ...form, program_studi_id: parseInt(e.target.value) })}
              className="select w-full"
            >
              {prodis.map((p) => (
                <option key={p.id} value={p.id}>{p.nama}</option>
              ))}
            </select>
          </div>

          <Input
            label="Tahun Angkatan"
            type="number"
            required
            value={form.angkatan}
            onChange={(e) => setForm({ ...form, angkatan: parseInt(e.target.value) || 2025 })}
          />

          <div>
            <label className="label">Jenis Kelamin *</label>
            <select
              value={form.jenis_kelamin}
              onChange={(e) => setForm({ ...form, jenis_kelamin: e.target.value })}
              className="select w-full"
            >
              <option value="L">Laki-laki (L)</option>
              <option value="P">Perempuan (P)</option>
            </select>
          </div>

          {editingMhs && (
            <div className="md:col-span-2">
              <label className="label">Status Akademik</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="select w-full"
              >
                <option value="aktif">Aktif</option>
                <option value="cuti">Cuti</option>
                <option value="mangkir">Mangkir</option>
                <option value="lulus">Lulus</option>
              </select>
            </div>
          )}
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        open={Boolean(deletingMhs)}
        onClose={() => setDeletingMhs(null)}
        title="Hapus Mahasiswa?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeletingMhs(null)}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Hapus
            </Button>
          </>
        }
      >
        <p className="text-slate-500 text-sm">
          Apakah Anda yakin ingin menghapus mahasiswa <strong>{deletingMhs?.nama_lengkap}</strong> ({deletingMhs?.nim || 'Belum ada NIM'})? Tindakan ini tidak dapat dibatalkan.
        </p>
      </Modal>

      {/* Modal Penetapan NIM Mahasiswa (Individual) */}
      <Modal
        open={isNimModalOpen}
        onClose={() => setIsNimModalOpen(false)}
        title="Penetapan & Penomoran NIM"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsNimModalOpen(false)}>
              Batal
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveIndividualNim}
              disabled={generatingIndividualNim}
            >
              {generatingIndividualNim ? 'Menyimpan...' : 'Simpan NIM'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
            <p className="font-bold text-slate-800">{targetMhsForNim?.nama_lengkap}</p>
            <p className="text-slate-500">
              Prodi: <span className="font-semibold text-slate-700">{targetMhsForNim?.program_studi?.nama || '-'}</span> | Angkatan: <span className="font-semibold text-slate-700">{targetMhsForNim?.angkatan}</span>
            </p>
            {targetMhsForNim?.spmb_konversi?.pendaftaran_calon_mhs?.no_pendaftaran && (
              <p className="text-primary-700 font-mono text-2xs">
                No. Pendaftaran SPMB: <strong>{targetMhsForNim.spmb_konversi.pendaftaran_calon_mhs.no_pendaftaran}</strong>
              </p>
            )}
            {targetMhsForNim?.nim && (
              <p className="text-amber-700 font-mono text-2xs">
                NIM Saat Ini: <strong>{targetMhsForNim.nim}</strong>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="label">Pilih Metode Penomoran NIM *</label>
            <div className="space-y-2">
              <label className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-colors ${nimMethod === 'standard' ? 'border-primary-500 bg-primary-50/50 text-primary-950 font-semibold' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                <input
                  type="radio"
                  name="nimMethod"
                  value="standard"
                  checked={nimMethod === 'standard'}
                  onChange={() => setNimMethod('standard')}
                  className="mt-0.5 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <p className="font-bold">Format Standar Kampus (Otomatis)</p>
                  <p className="text-2xs text-slate-500 font-normal mt-0.5">
                    Menggunakan format kombinasi: <code>{"{2 digit thn}{2 digit kode prodi}{4 digit nomor urut}"}</code>.
                  </p>
                </div>
              </label>

              {targetMhsForNim?.spmb_konversi?.pendaftaran_calon_mhs?.no_pendaftaran && (
                <label className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-colors ${nimMethod === 'no_pendaftaran' ? 'border-primary-500 bg-primary-50/50 text-primary-950 font-semibold' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                  <input
                    type="radio"
                    name="nimMethod"
                    value="no_pendaftaran"
                    checked={nimMethod === 'no_pendaftaran'}
                    onChange={() => {
                      setNimMethod('no_pendaftaran');
                      setCustomNimInput(targetMhsForNim.spmb_konversi.pendaftaran_calon_mhs.no_pendaftaran);
                    }}
                    className="mt-0.5 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <p className="font-bold">Gunakan Nomor Pendaftaran SPMB</p>
                    <p className="text-2xs text-slate-500 font-normal mt-0.5">
                      Menjadikan nomor pendaftaran <code>{targetMhsForNim.spmb_konversi.pendaftaran_calon_mhs.no_pendaftaran}</code> langsung sebagai NIM resmi mahasiswa.
                    </p>
                  </div>
                </label>
              )}

              <label className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-colors ${nimMethod === 'custom' ? 'border-primary-500 bg-primary-50/50 text-primary-950 font-semibold' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                <input
                  type="radio"
                  name="nimMethod"
                  value="custom"
                  checked={nimMethod === 'custom'}
                  onChange={() => setNimMethod('custom')}
                  className="mt-0.5 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <p className="font-bold">Input Manual / Kombinasi Karakter Kampus</p>
                  <p className="text-2xs text-slate-500 font-normal mt-0.5">
                    Masukkan format NIM khusus kampus (bebas huruf, tanda hubung, atau angka unik).
                  </p>
                </div>
              </label>
            </div>
          </div>

          {nimMethod === 'custom' && (
            <div className="pt-2 animate-fade-in">
              <Input
                label="Nomor Induk Mahasiswa (NIM) Baru *"
                placeholder="Contoh: TI-2025-001 / 25.01.009"
                value={customNimInput}
                onChange={(e) => setCustomNimInput(e.target.value)}
                required
              />
              <p className="text-2xs text-slate-400 mt-1">
                Pastikan NIM belum pernah digunakan oleh mahasiswa lain.
              </p>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal Generate Missing NIMs (Batch) */}
      <Modal
        open={isBatchNimModalOpen}
        onClose={() => setIsBatchNimModalOpen(false)}
        title="Generate NIM Otomatis (Massal)"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsBatchNimModalOpen(false)}>
              Batal
            </Button>
            <Button
              variant="primary"
              onClick={handleGenerateMissingNims}
              disabled={generatingNims}
            >
              {generatingNims ? 'Memproses...' : 'Proses Generate Sekarang'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Pilih skema penomoran untuk seluruh mahasiswa aktif yang <strong>belum memiliki NIM</strong>:
          </p>

          <div className="space-y-2">
            <label className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-colors ${batchNimScheme === 'standard' ? 'border-primary-500 bg-primary-50/50 text-primary-950 font-semibold' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
              <input
                type="radio"
                name="batchNimScheme"
                value="standard"
                checked={batchNimScheme === 'standard'}
                onChange={() => setBatchNimScheme('standard')}
                className="mt-0.5 text-primary-600 focus:ring-primary-500"
              />
              <div>
                <p className="font-bold">Format Standar Kampus (Urut Otomatis)</p>
                <p className="text-2xs text-slate-500 font-normal mt-0.5">
                  Format: <code>{"{2 digit thn}{2 digit prodi}{4 digit nomor urut}"}</code>.
                </p>
              </div>
            </label>

            <label className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-colors ${batchNimScheme === 'no_pendaftaran' ? 'border-primary-500 bg-primary-50/50 text-primary-950 font-semibold' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
              <input
                type="radio"
                name="batchNimScheme"
                value="no_pendaftaran"
                checked={batchNimScheme === 'no_pendaftaran'}
                onChange={() => setBatchNimScheme('no_pendaftaran')}
                className="mt-0.5 text-primary-600 focus:ring-primary-500"
              />
              <div>
                <p className="font-bold">Gunakan Nomor Pendaftaran SPMB (Jika Ada)</p>
                <p className="text-2xs text-slate-500 font-normal mt-0.5">
                  Mahasiswa yang berasal dari SPMB akan memakai No. Pendaftaran SPMB sebagai NIM. Mahasiswa lain akan memakai format standar.
                </p>
              </div>
            </label>
          </div>
        </div>
      </Modal>

      {/* Modal Import NIM CSV */}
      <Modal
        open={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Data NIM dari File CSV"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsImportModalOpen(false)}>
              Batal
            </Button>
            <Button
              variant="primary"
              onClick={handleImportNim}
              disabled={isImporting || !importFile}
            >
              {isImporting ? 'Mengimpor...' : 'Mulai Import CSV'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleImportNim} className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 space-y-1.5 leading-relaxed">
            <p className="font-bold text-slate-900 flex items-center gap-1.5">
              <FileSpreadsheet size={15} className="text-primary-600" /> Petunjuk Import NIM Offline:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-2xs text-slate-600 pl-1">
              <li>Klik tombol <strong>Export NIM (CSV)</strong> untuk mengunduh daftar mahasiswa kampus saat ini.</li>
              <li>Buka file di Microsoft Excel atau Google Sheets.</li>
              <li>Isi kolom <code>NIM_BARU</code> dengan format penomoran kampus yang diinginkan (bebas huruf & angka).</li>
              <li>Simpan sebagai file <strong>CSV (Comma Delimited)</strong> lalu unggah kembali melalui form di bawah.</li>
            </ol>
          </div>

          <div>
            <label className="label">Pilih File CSV (*.csv) *</label>
            <input
              type="file"
              accept=".csv,text/csv"
              required
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setImportFile(e.target.files[0]);
                }
              }}
              className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer border border-slate-200 rounded-xl p-2 bg-white"
            />
            {importFile && (
              <p className="text-2xs text-emerald-600 font-semibold mt-1.5">
                ✓ File terpilih: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>
        </form>
      </Modal>

      {/* Modal Buku Induk */}
      <Modal
        open={isBukuModalOpen}
        onClose={() => setIsBukuModalOpen(false)}
        title="Unduh Buku Induk Mahasiswa"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsBukuModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleDownloadBukuInduk} disabled={downloadingBuku} icon={<Download size={14} />}>
              {downloadingBuku ? 'Mengunduh...' : 'Unduh CSV'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleDownloadBukuInduk} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Program Studi"
            placeholder="Semua Prodi"
            options={prodis.map((p) => ({ value: p.id, label: p.nama }))}
            value={bukuProdi || ''}
            onChange={(v: any) => setBukuProdi(String(v || ''))}
            isClearable
          />
          <Input
            label="Angkatan"
            type="number"
            placeholder="cth. 2024 (kosongkan = semua)"
            value={bukuAngkatan}
            onChange={(e) => setBukuAngkatan(e.target.value)}
          />
          <div className="md:col-span-2">
            <label className="label">Status Akademik</label>
            <select value={bukuStatus} onChange={(e) => setBukuStatus(e.target.value)} className="select w-full">
              <option value="">Semua Status</option>
              <option value="aktif">Aktif</option>
              <option value="cuti">Cuti</option>
              <option value="mangkir">Mangkir</option>
              <option value="dropout">Dropout / Keluar</option>
              <option value="lulus">Lulus</option>
            </select>
          </div>
          <p className="md:col-span-2 text-2xs text-slate-500">
            Rekapan berisi NIM, biodata, prodi, angkatan, jalur masuk, dosen wali, status, dan IPK — cocok dibuka di Excel.
          </p>
        </form>
      </Modal>

      {/* Modal Ubah Status Akademik */}
      <Modal
        open={!!statusTarget}
        onClose={() => setStatusTarget(null)}
        title={`Ubah Status — ${statusTarget?.nama_lengkap || ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setStatusTarget(null)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSaveStatus} disabled={savingStatus}>
              {savingStatus ? 'Menyimpan...' : 'Simpan Status'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveStatus} className="space-y-4">
          <p className="text-xs text-slate-600">
            Status saat ini: <strong className="capitalize">{statusTarget?.status}</strong>
            <span className="block text-2xs text-slate-400 mt-0.5">Mahasiswa keluar (DO/mengundurkan diri) dicatat sebagai Dropout. Kelulusan tetap via menu Yudisium.</span>
          </p>
          <div>
            <label className="label">Status Baru *</label>
            <select
              value={statusForm.status}
              onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
              className="select w-full"
              required
            >
              <option value="aktif">Aktif</option>
              <option value="cuti">Cuti</option>
              <option value="mangkir">Mangkir</option>
              <option value="dropout">Dropout / Keluar</option>
              <option value="lulus">Lulus</option>
            </select>
          </div>
          <Input
            label="Alasan / Keterangan"
            placeholder="cth. Mengundurkan diri atas permintaan sendiri (No. surat...)"
            value={statusForm.alasan}
            onChange={(e) => setStatusForm({ ...statusForm, alasan: e.target.value })}
            hint="Wajib diisi bila status non-aktif. Tercatat di riwayat status akademik."
          />
        </form>
      </Modal>
      {/* Modal Ubah Status Massal */}
      <Modal
        open={isBulkStatusOpen}
        onClose={() => setIsBulkStatusOpen(false)}
        title={`Ubah Status Massal — ${selectedMhsIds.length} Mahasiswa`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsBulkStatusOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSaveBulkStatus} disabled={savingBulkStatus}>
              {savingBulkStatus ? 'Menyimpan...' : `Terapkan ke ${selectedMhsIds.length} Mahasiswa`}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveBulkStatus} className="space-y-4">
          <div>
            <label className="label">Status Baru (massal) *</label>
            <select
              value={bulkStatusForm.status}
              onChange={(e) => setBulkStatusForm({ ...bulkStatusForm, status: e.target.value })}
              className="select w-full"
              required
            >
              <option value="lulus">Lulus (wisuda/yudisium serentak)</option>
              <option value="aktif">Aktif (aktifkan kembali)</option>
              <option value="cuti">Cuti (kolektif)</option>
            </select>
            <p className="text-2xs text-slate-400 mt-1">
              Dropout/keluar & mangkir tidak tersedia massal — wajib per mahasiswa dengan alasan individual.
            </p>
          </div>
          <Input
            label="Alasan Bersama"
            placeholder="cth. Yudisium Periode Gasal 2025/2026 (SK No. ...)"
            value={bulkStatusForm.alasan}
            onChange={(e) => setBulkStatusForm({ ...bulkStatusForm, alasan: e.target.value })}
            hint="Wajib bila status lulus/cuti. Dicatat di riwayat tiap mahasiswa."
          />
        </form>
      </Modal>
    </div>
  );
}
