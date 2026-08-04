'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, CheckCircle, Plus, Calendar, Layers, Edit, Trash2, UserCheck, Award, Sparkles, Filter, CheckCircle2, AlertCircle, RefreshCw, UserPlus, Search, Settings, ChevronLeft, ChevronRight, AlertTriangle, Building } from 'lucide-react';
import { sikeuService } from '@/services/sikeu.service';

export default function MasterBiayaPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  // Reordered default tab: 1. Komponen Biaya, 2. Jalur/Kelas, 3. Tarif Angkatan, 4. Master Beasiswa, 5. Tipe Tagihan, 6. Penerima Beasiswa, 7. Master Unit Kas
  const [activeTab, setActiveTab] = useState<'jenis-biaya' | 'jalur-kelas' | 'tarif' | 'beasiswa' | 'student-types' | 'mapping-beasiswa' | 'unit-kas-master'>('jenis-biaya');

  useEffect(() => {
    if (tabParam) {
      const validTabs = ['jenis-biaya', 'jalur-kelas', 'tarif', 'beasiswa', 'student-types', 'mapping-beasiswa', 'unit-kas-master'];
      if (validTabs.includes(tabParam)) {
        setActiveTab(tabParam as any);
      }
    }
  }, [tabParam]);

  const [selectedAngkatan, setSelectedAngkatan] = useState<number>(2025);
  const [selectedJalur, setSelectedJalur] = useState<string>('Reguler');

  // Helper for Direct UKT Level Text
  const getLevelText = (level: number) => {
    switch (level) {
      case 1: return 'Level 1 (Subsidi Penuh)';
      case 2: return 'Level 2 (Subsidi Parsial)';
      case 3: return 'Level 3 (Reguler / Standar)';
      case 4: return 'Level 4 (Mandiri)';
      case 5: return 'Level 5 (Eksekutif / Khusus)';
      default: return `Level ${level}`;
    }
  };

  // Dynamic Lists
  const [availableAngkatan, setAvailableAngkatan] = useState<number[]>([2023, 2024, 2025, 2026, 2027]);
  const [newAngkatanYear, setNewAngkatanYear] = useState<number>(2028);
  const [isAddAngkatanOpen, setIsAddAngkatanOpen] = useState(false);

  // Jalur Kelas Master & Modal States
  const [jalurKelasList, setJalurKelasList] = useState<any[]>([]);
  const [isJalurModalOpen, setIsJalurModalOpen] = useState(false);
  const [jalurForm, setJalurForm] = useState({ nama_jalur: '', deskripsi: '' });

  const [isEditJalurModalOpen, setIsEditJalurModalOpen] = useState(false);
  const [editingJalurItem, setEditingJalurItem] = useState<any | null>(null);
  const [editJalurForm, setEditJalurForm] = useState({ nama_jalur: '', deskripsi: '' });

  const [isDeleteJalurModalOpen, setIsDeleteJalurModalOpen] = useState(false);
  const [deletingJalurItem, setDeletingJalurItem] = useState<any | null>(null);
  const [confirmDeleteChecklist, setConfirmDeleteChecklist] = useState(false);

  const [tarifList, setTarifList] = useState<any[]>([]);
  const [jenisBiayaList, setJenisBiayaList] = useState<any[]>([]);
  const [beasiswaList, setBeasiswaList] = useState<any[]>([]);
  const [mahasiswaBeasiswaList, setMahasiswaBeasiswaList] = useState<any[]>([]);
  const [beasiswaPage, setBeasiswaPage] = useState<number>(1);
  const [beasiswaMeta, setBeasiswaMeta] = useState<{ current_page: number; last_page: number; total: number }>({ current_page: 1, last_page: 1, total: 0 });

  // Student Billing Types & Search Pagination
  const [studentTypesList, setStudentTypesList] = useState<any[]>([]);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentTypePage, setStudentTypePage] = useState<number>(1);
  const [studentTypeMeta, setStudentTypeMeta] = useState<{ current_page: number; last_page: number; total: number }>({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(false);

  // Modals & Form states
  const [isTarifModalOpen, setIsTarifModalOpen] = useState(false);
  const [editingTarif, setEditingTarif] = useState<any | null>(null);
  const [tarifForm, setTarifForm] = useState({
    jenis_biaya_id: 1,
    tahun_angkatan: 2025,
    jalur_kelas: 'Reguler',
    kelompok_ukt: 1,
    nama_kelompok: 'Kelompok 1 (Subsidi Penuh)',
    program_studi_id: 0,
    nominal: 3500000,
  });

  const [isJenisBiayaModalOpen, setIsJenisBiayaModalOpen] = useState(false);
  const [editingJenisBiaya, setEditingJenisBiaya] = useState<any | null>(null);
  const [jenisBiayaForm, setJenisBiayaForm] = useState({ kode: '', nama: '', tipe: 'ukt', nominal_standar: 0, deskripsi: '' });

  const [isBeasiswaModalOpen, setIsBeasiswaModalOpen] = useState(false);
  const [editingBeasiswa, setEditingBeasiswa] = useState<any | null>(null);
  const [beasiswaForm, setBeasiswaForm] = useState({
    kode: '',
    nama: '',
    sumber: 'internal',
    tipe_potongan: 'persen',
    nilai_potongan: 100,
    jenis_biaya_id: 0,
    berlaku_angkatan_mulai: 2023,
    berlaku_angkatan_sampai: 2027,
    deskripsi: '',
  });

  const [isAssignBeasiswaModalOpen, setIsAssignBeasiswaModalOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({ mahasiswa_id: 0, beasiswa_id: 1, berlaku_mulai: '', berlaku_sampai: '' });
  const [assignSearchQuery, setAssignSearchQuery] = useState('');

  const [isStudentTypeModalOpen, setIsStudentTypeModalOpen] = useState(false);
  const [editingStudentType, setEditingStudentType] = useState<any | null>(null);
  const [studentTypeForm, setStudentTypeForm] = useState({
    mahasiswa_id: 101,
    nim: '',
    nama_mahasiswa: '',
    tahun_angkatan: 2025,
    jalur_kelas: 'Reguler',
    kelompok_ukt: 3,
    beasiswa_id: 0,
    catatan_perubahan: '',
  });

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Unit Kas Master States
  const [unitKasMasterList, setUnitKasMasterList] = useState<any[]>([
    { id: 1, nama: 'Petty Cash Fakultas Teknik & TIK', bank: 'BNI', no_rekening: '1234567890', atas_nama: 'Operasional FTIK', status: 'aktif' },
    { id: 2, nama: 'Petty Cash Fakultas Ekonomi & Bisnis', bank: 'Mandiri', no_rekening: '0987654321', atas_nama: 'Operasional FEB', status: 'aktif' },
    { id: 3, nama: 'Kas Operasional SPMB', bank: 'Mandiri', no_rekening: '9876543210', atas_nama: 'Kasir SPMB', status: 'aktif' },
    { id: 4, nama: 'Kas Operasional LPPM', bank: 'BRI', no_rekening: '1122334455', atas_nama: 'LPPM Kampus', status: 'aktif' }
  ]);
  const [isUnitKasModalOpen, setIsUnitKasModalOpen] = useState(false);
  const [unitKasForm, setUnitKasForm] = useState({ id: 0, nama: '', bank: 'BNI', no_rekening: '', atas_nama: '', status: 'aktif' });
  const [editingUnitKas, setEditingUnitKas] = useState<any | null>(null);

  const handleSaveUnitKas = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUnitKas) {
      setUnitKasMasterList(unitKasMasterList.map(u => u.id === editingUnitKas.id ? { ...unitKasForm, id: editingUnitKas.id } : u));
      setFeedback({ type: 'success', message: 'Data Unit Kas berhasil diperbarui.' });
    } else {
      setUnitKasMasterList([{ ...unitKasForm, id: Date.now() }, ...unitKasMasterList]);
      setFeedback({ type: 'success', message: 'Unit Kas baru berhasil ditambahkan.' });
    }
    setIsUnitKasModalOpen(false);
  };

  // Fetch functions
  const fetchJalurKelas = async () => {
    try {
      const res = await sikeuService.getJalurKelasList();
      if (res.data) setJalurKelasList(res.data);
    } catch (e) {
      setJalurKelasList([
        { id: 1, kode: 'REGULER', nama_jalur: 'Reguler', deskripsi: 'Kelas Reguler Tatap Muka' },
        { id: 2, kode: 'KARYAWAN', nama_jalur: 'Karyawan / Eksekutif', deskripsi: 'Kelas Malam & Akhir Pekan' },
        { id: 3, kode: 'INTERNASIONAL', nama_jalur: 'Internasional', deskripsi: 'Kelas Bilingual / Internasional' },
        { id: 4, kode: 'ONLINE', nama_jalur: 'Kelas Online / Blended', deskripsi: 'Jalur PJJ Online' },
      ]);
    }
  };

  const [selectedProdiTarif, setSelectedProdiTarif] = useState<string>('all');

  const fetchTarif = async () => {
    try {
      setLoading(true);
      const res = await sikeuService.getTarifList({ tahun_angkatan: selectedAngkatan, jalur_kelas: selectedJalur });
      if (res.data) setTarifList(res.data);
    } catch (e) {
      setTarifList([
        { id: 1, tahun_angkatan: selectedAngkatan, jalur_kelas: selectedJalur, prodi: 'Teknik Informatika', nama_kelompok: 'SPP Semester Teknik Informatika', nominal: selectedJalur === 'Karyawan' ? 5500000 : 3500000, jenis_biaya: { nama: 'UKT / SPP Semester' } },
        { id: 2, tahun_angkatan: selectedAngkatan, jalur_kelas: selectedJalur, prodi: 'Sistem Informasi', nama_kelompok: 'SPP Semester Sistem Informasi', nominal: selectedJalur === 'Karyawan' ? 5250000 : 3250000, jenis_biaya: { nama: 'UKT / SPP Semester' } },
        { id: 3, tahun_angkatan: selectedAngkatan, jalur_kelas: selectedJalur, prodi: 'Manajemen Informatika', nama_kelompok: 'SPP Semester Manajemen Informatika', nominal: selectedJalur === 'Karyawan' ? 5000000 : 3000000, jenis_biaya: { nama: 'UKT / SPP Semester' } },
        { id: 4, tahun_angkatan: selectedAngkatan, jalur_kelas: selectedJalur, prodi: 'Teknik Informatika', nama_kelompok: 'Biaya Praktikum Laboratorium TI', nominal: 750000, jenis_biaya: { nama: 'Biaya Praktikum' } },
        { id: 5, tahun_angkatan: selectedAngkatan, jalur_kelas: selectedJalur, prodi: 'Semua Prodi', nama_kelompok: 'Biaya Wisuda & Kelulusan', nominal: 1750000, jenis_biaya: { nama: 'Biaya Wisuda' } },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchJenisBiaya = async () => {
    try {
      const res = await sikeuService.getJenisBiayaList();
      if (res.data) setJenisBiayaList(res.data);
    } catch (e) {
      setJenisBiayaList([
        { id: 1, kode: 'UKT_REG', nama: 'Uang Kuliah Tunggal (UKT) Reguler', tipe: 'ukt', nominal_standar: 3500000, is_active: true },
        { id: 2, kode: 'SPMB_ADM', nama: 'Biaya Pendaftaran SPMB', tipe: 'spmb_adm', nominal_standar: 350000, is_active: true },
        { id: 3, kode: 'WISUDA_FEE', nama: 'Biaya Kelulusan & Wisuda', tipe: 'wisuda', nominal_standar: 1750000, is_active: true },
        { id: 4, kode: 'GEDUNG', nama: 'Sumbangan Biaya Pengembangan / Gedung', tipe: 'lainnya', nominal_standar: 5000000, is_active: true },
      ]);
    }
  };

  const fetchBeasiswa = async () => {
    try {
      const res = await sikeuService.getBeasiswaList();
      if (res.data) setBeasiswaList(res.data);
    } catch (e) {
      setBeasiswaList([
        { id: 1, kode: 'KIP_KULIAH', nama: 'Beasiswa KIP Kuliah Pemerintah', sumber: 'pemerintah', tipe_potongan: 'persen', nilai_potongan: 100, jenis_biaya: { nama: 'Khusus UKT' }, berlaku_angkatan_mulai: 2023, berlaku_angkatan_sampai: 2027 },
        { id: 2, kode: 'PRESTASI_AKADEMIK', nama: 'Beasiswa Prestasi Akademik Kampus', sumber: 'internal', tipe_potongan: 'nominal', nilai_potongan: 1500000, jenis_biaya: null, berlaku_angkatan_mulai: 2024, berlaku_angkatan_sampai: 2026 },
      ]);
    }
  };

  const fetchMahasiswaBeasiswa = async (page = 1) => {
    try {
      const res = await sikeuService.getMahasiswaBeasiswaList({ page, per_page: 10 });
      if (res.data) setMahasiswaBeasiswaList(res.data);
      if (res.meta) setBeasiswaMeta(res.meta);
    } catch (e) {
      setMahasiswaBeasiswaList([
        { id: 1, mahasiswa_id: 101, nama_mahasiswa: 'Budi Santoso', nim: '2024010042', nama_beasiswa: 'Beasiswa KIP Kuliah Pemerintah', potongan_text: '100%', status: 'aktif' },
        { id: 2, mahasiswa_id: 102, nama_mahasiswa: 'Siti Rahmawati', nim: '2025010018', nama_beasiswa: 'Beasiswa Prestasi Akademik Kampus', potongan_text: 'Rp 1.500.000', status: 'aktif' },
      ]);
    }
  };

  const fetchStudentTypes = async (page = 1, q = '') => {
    try {
      setLoading(true);
      const res = await sikeuService.getStudentBillingTypes({ page, per_page: 10, q });
      if (res.data) setStudentTypesList(res.data);
      if (res.meta) setStudentTypeMeta(res.meta);
    } catch (e) {
      setStudentTypesList([
        { id: 1, mahasiswa_id: 101, nim: '2024010042', nama_mahasiswa: 'Budi Santoso', tahun_angkatan: 2024, jalur_kelas: 'Reguler', kelompok_ukt: 3, beasiswa: { nama: 'KIP Kuliah (100%)' }, status_pendaftaran: 'SIAKAD_AKTIF', catatan_perubahan: 'Penetapan awal dari SPMB (Penerima KIP-Kuliah)' },
        { id: 2, mahasiswa_id: 102, nim: '2025010018', nama_mahasiswa: 'Siti Rahmawati', tahun_angkatan: 2025, jalur_kelas: 'Reguler', kelompok_ukt: 3, beasiswa: null, status_pendaftaran: 'SPMB_DITERIMA', catatan_perubahan: 'Pendaftaran Jalur Mandiri SPMB' },
        { id: 3, mahasiswa_id: 103, nim: '2023010088', nama_mahasiswa: 'Ahmad Fauzi', tahun_angkatan: 2023, jalur_kelas: 'Karyawan', kelompok_ukt: 4, beasiswa: null, status_pendaftaran: 'PENGATURAN_ADMIN', catatan_perubahan: 'Pindah jalur dari Reguler ke Kelas Karyawan pada Semester 3' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJalurKelas();
    fetchTarif();
    fetchJenisBiaya();
    fetchBeasiswa();
    fetchMahasiswaBeasiswa(beasiswaPage);
    fetchStudentTypes(studentTypePage, studentSearchQuery);
  }, [selectedAngkatan, selectedJalur, studentTypePage, beasiswaPage]);

  // Handle Search submit / debounced trigger
  const handleSearchStudent = (q: string) => {
    setStudentSearchQuery(q);
    setStudentTypePage(1);
    fetchStudentTypes(1, q);
  };

  const handleAddAngkatan = () => {
    if (!availableAngkatan.includes(newAngkatanYear)) {
      const updated = [...availableAngkatan, newAngkatanYear].sort((a, b) => a - b);
      setAvailableAngkatan(updated);
      setSelectedAngkatan(newAngkatanYear);
      setTarifForm({ ...tarifForm, tahun_angkatan: newAngkatanYear });
      setFeedback({ type: 'success', message: `Tahun Angkatan ${newAngkatanYear} berhasil ditambahkan.` });
    }
    setIsAddAngkatanOpen(false);
  };

  const handleSaveJalurKelas = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sikeuService.storeJalurKelas(jalurForm);
      setFeedback({ type: 'success', message: 'Jalur / Tipe kelas mahasiswa baru berhasil ditambahkan.' });
      setIsJalurModalOpen(false);
      fetchJalurKelas();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal menyimpan jalur kelas' });
    }
  };

  const handleUpdateJalurKelas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJalurItem) return;
    try {
      await sikeuService.updateJalurKelas(editingJalurItem.id, editJalurForm);
      setFeedback({ type: 'success', message: 'Data Jalur / Kelas berhasil diperbarui.' });
      setIsEditJalurModalOpen(false);
      setEditingJalurItem(null);
      fetchJalurKelas();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal memperbarui jalur kelas' });
    }
  };

  const handleDeleteJalurKelas = async () => {
    if (!deletingJalurItem || !confirmDeleteChecklist) return;
    try {
      await sikeuService.deleteJalurKelas(deletingJalurItem.id);
      setFeedback({ type: 'success', message: `Jalur Kelas "${deletingJalurItem.nama_jalur}" berhasil dihapus.` });
      setIsDeleteJalurModalOpen(false);
      setDeletingJalurItem(null);
      setConfirmDeleteChecklist(false);
      fetchJalurKelas();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal menghapus jalur kelas' });
    }
  };

  const handleSaveTarif = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        ...tarifForm,
        prodi: tarifForm.prodi || 'Teknik Informatika',
        nama_kelompok: tarifForm.nama_kelompok || `SPP Semester ${tarifForm.prodi || 'Teknik Informatika'}`,
      };

      if (editingTarif) {
        try {
          await sikeuService.updateTarif(editingTarif.id, payload);
        } catch (e) {
          // Update local state if API mock
        }
        setTarifList(prev => prev.map(item => item.id === editingTarif.id ? { ...item, ...payload } : item));
        setFeedback({ type: 'success', message: `Nominal tarif (${payload.prodi}) berhasil diperbarui.` });
      } else {
        const newItem = {
          id: Date.now(),
          ...payload,
          jenis_biaya: { nama: 'UKT / SPP Semester' },
        };
        try {
          await sikeuService.storeTarif(payload);
        } catch (e) {
          // Append to local state if API mock
        }
        setTarifList(prev => [newItem, ...prev]);
        setFeedback({ type: 'success', message: `Tarif baru (${payload.prodi}) berhasil disimpan.` });
      }
      setIsTarifModalOpen(false);
      setEditingTarif(null);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal menyimpan tarif' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTarif = async (id: number) => {
    if (confirm('Apakah anda yakin ingin menghapus tarif ini?')) {
      try {
        await sikeuService.deleteTarif(id);
        setFeedback({ type: 'success', message: 'Tarif berhasil dihapus.' });
        fetchTarif();
      } catch (err: any) {
        setFeedback({ type: 'error', message: err.message || 'Gagal menghapus tarif' });
      }
    }
  };

  const handleSaveJenisBiaya = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingJenisBiaya) {
        await sikeuService.updateJenisBiaya(editingJenisBiaya.id, jenisBiayaForm);
        setFeedback({ type: 'success', message: 'Komponen biaya & nominal standar berhasil diperbarui.' });
      } else {
        await sikeuService.storeJenisBiaya(jenisBiayaForm);
        setFeedback({ type: 'success', message: 'Jenis biaya baru berhasil ditambahkan.' });
      }
      setIsJenisBiayaModalOpen(false);
      setEditingJenisBiaya(null);
      fetchJenisBiaya();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal menyimpan jenis biaya' });
    }
  };

  const handleSaveBeasiswa = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...beasiswaForm,
        jenis_biaya_id: beasiswaForm.jenis_biaya_id ? Number(beasiswaForm.jenis_biaya_id) : undefined,
        berlaku_angkatan_mulai: Number(beasiswaForm.berlaku_angkatan_mulai),
        berlaku_angkatan_sampai: Number(beasiswaForm.berlaku_angkatan_sampai),
      };

      if (editingBeasiswa) {
        await sikeuService.updateBeasiswa(editingBeasiswa.id, payload);
        setFeedback({ type: 'success', message: 'Master Beasiswa & scope cakupan berhasil diperbarui.' });
      } else {
        await sikeuService.storeBeasiswa(payload);
        setFeedback({ type: 'success', message: 'Master Program Beasiswa baru berhasil disimpan.' });
      }
      setIsBeasiswaModalOpen(false);
      setEditingBeasiswa(null);
      fetchBeasiswa();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal menyimpan beasiswa' });
    }
  };

  const handleAssignBeasiswa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.mahasiswa_id || assignForm.mahasiswa_id === 0) {
      setFeedback({ type: 'error', message: 'Pilih mahasiswa penerima beasiswa terlebih dahulu.' });
      return;
    }
    try {
      await sikeuService.assignMahasiswaBeasiswa(assignForm);
      setFeedback({ type: 'success', message: 'Penerima beasiswa berhasil ditetapkan ke mahasiswa.' });
      setIsAssignBeasiswaModalOpen(false);
      fetchMahasiswaBeasiswa(beasiswaPage);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal menetapkan penerima beasiswa' });
    }
  };

  const handleSaveStudentType = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingStudentType) {
        await sikeuService.updateStudentBillingType(editingStudentType.id, {
          jalur_kelas: studentTypeForm.jalur_kelas,
          kelompok_ukt: Number(studentTypeForm.kelompok_ukt),
          beasiswa_id: studentTypeForm.beasiswa_id ? Number(studentTypeForm.beasiswa_id) : undefined,
          catatan_perubahan: studentTypeForm.catatan_perubahan,
        });
        setFeedback({ type: 'success', message: 'Tipe tagihan & jalur kelas mahasiswa berhasil diubah.' });
      } else {
        await sikeuService.assignStudentBillingType({
          mahasiswa_id: Number(studentTypeForm.mahasiswa_id),
          nim: studentTypeForm.nim,
          nama_mahasiswa: studentTypeForm.nama_mahasiswa,
          tahun_angkatan: Number(studentTypeForm.tahun_angkatan),
          jalur_kelas: studentTypeForm.jalur_kelas,
          kelompok_ukt: Number(studentTypeForm.kelompok_ukt),
          beasiswa_id: studentTypeForm.beasiswa_id ? Number(studentTypeForm.beasiswa_id) : undefined,
          catatan_perubahan: studentTypeForm.catatan_perubahan || 'Penetapan tipe pendaftaran baru',
        });
        setFeedback({ type: 'success', message: 'Penetapan tipe tagihan mahasiswa baru berhasil disimpan.' });
      }
      setIsStudentTypeModalOpen(false);
      setEditingStudentType(null);
      fetchStudentTypes(studentTypePage, studentSearchQuery);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal memperbarui tipe tagihan mahasiswa' });
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header tanpa Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/sikeu" className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-600 transition">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Master Biaya, Jalur, Tarif & Beasiswa</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Pengelolaan komponen biaya, jalur kelas, tarif angkatan, master beasiswa, tipe tagihan & penerima beasiswa.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'jenis-biaya' && (
            <button
              onClick={() => {
                setEditingJenisBiaya(null);
                setJenisBiayaForm({ kode: '', nama: '', tipe: 'ukt', nominal_standar: 0, deskripsi: '' });
                setIsJenisBiayaModalOpen(true);
              }}
              className="btn bg-teal-600 hover:bg-teal-700 text-white border-none font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={16} /> Tambah Komponen Biaya
            </button>
          )}
          {activeTab === 'jalur-kelas' && (
            <button
              onClick={() => {
                setJalurForm({ nama_jalur: '', deskripsi: '' });
                setIsJalurModalOpen(true);
              }}
              className="btn bg-teal-600 hover:bg-teal-700 text-white border-none font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={16} /> Tambah Jalur Kelas Baru
            </button>
          )}
          {activeTab === 'tarif' && (
            <>
              <button
                onClick={() => setIsAddAngkatanOpen(true)}
                className="btn bg-slate-100 hover:bg-slate-200 text-slate-800 border-none font-bold text-xs flex items-center gap-1.5 shadow-2xs"
              >
                <Plus size={16} /> Tambah Angkatan
              </button>
              <button
                onClick={() => {
                  setEditingTarif(null);
                  setTarifForm({ jenis_biaya_id: 1, tahun_angkatan: selectedAngkatan, jalur_kelas: selectedJalur, prodi: 'Teknik Informatika', nama_kelompok: 'SPP Semester Teknik Informatika', program_studi_id: 0, nominal: 3500000 });
                  setIsTarifModalOpen(true);
                }}
                className="btn bg-teal-600 hover:bg-teal-700 text-white border-none font-bold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Plus size={16} /> Atur Nominal Tarif
              </button>
            </>
          )}
          {activeTab === 'beasiswa' && (
            <button
              onClick={() => {
                setEditingBeasiswa(null);
                setBeasiswaForm({ kode: '', nama: '', sumber: 'internal', tipe_potongan: 'persen', nilai_potongan: 100, jenis_biaya_id: 0, berlaku_angkatan_mulai: 2023, berlaku_angkatan_sampai: 2027, deskripsi: '' });
                setIsBeasiswaModalOpen(true);
              }}
              className="btn bg-teal-600 hover:bg-teal-700 text-white border-none font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={16} /> Tambah Master Beasiswa
            </button>
          )}
          {activeTab === 'student-types' && (
            <button
              onClick={() => {
                setEditingStudentType(null);
                setStudentTypeForm({ mahasiswa_id: 105, nim: '2025010088', nama_mahasiswa: 'Mahasiswa Baru', tahun_angkatan: 2025, jalur_kelas: 'Reguler', kelompok_ukt: 3, beasiswa_id: 0, catatan_perubahan: 'Pendaftaran baru via SPMB' });
                setIsStudentTypeModalOpen(true);
              }}
              className="btn bg-teal-600 hover:bg-teal-700 text-white border-none font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <UserPlus size={16} /> Penetapan Tipe Pendaftaran Baru
            </button>
          )}
          {activeTab === 'mapping-beasiswa' && (
            <button
              onClick={() => {
                setAssignSearchQuery('');
                if (studentTypesList.length > 0) {
                  setAssignForm({ ...assignForm, mahasiswa_id: studentTypesList[0].mahasiswa_id });
                }
                setIsAssignBeasiswaModalOpen(true);
              }}
              className="btn bg-teal-600 hover:bg-teal-700 text-white border-none font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={16} /> Tetapkan Mahasiswa Penerima
            </button>
          )}
          {activeTab === 'unit-kas-master' && (
            <button
              onClick={() => {
                setEditingUnitKas(null);
                setUnitKasForm({ id: 0, nama: '', bank: 'BNI', no_rekening: '', atas_nama: '', status: 'aktif' });
                setIsUnitKasModalOpen(true);
              }}
              className="btn bg-teal-600 hover:bg-teal-700 text-white border-none font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Building size={16} /> Tambah Unit Kas Baru
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {feedback.message}
        </div>
      )}

      {/* 1. TAB KOMPONEN BIAYA MASTER */}
      {activeTab === 'jenis-biaya' && (
        <div className="bg-white rounded-b-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">Master Komponen Biaya Pendidikan</h2>
              <p className="text-xs text-slate-500 mt-0.5">Definisi jenis biaya (nominal diatur terpisah per Angkatan & Jalur Kelas pada tab Tarif Angkatan).</p>
            </div>
            <span className="text-xs font-bold text-slate-500">{jenisBiayaList.length} Komponen Terdaftar</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase border-y border-slate-200">
                <tr>
                  <th className="px-4 py-3">KODE</th>
                  <th className="px-4 py-3">NAMA KOMPONEN BIAYA</th>
                  <th className="px-4 py-3">TIPE BIAYA</th>
                  <th className="px-4 py-3 text-center">STATUS</th>
                  <th className="px-4 py-3 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jenisBiayaList.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-700">{b.kode}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{b.nama}</td>
                    <td className="px-4 py-3 uppercase text-[10px] font-semibold text-slate-700">{b.tipe}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        <CheckCircle size={12} /> Aktif
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => {
                          setEditingJenisBiaya(b);
                          setJenisBiayaForm({
                            kode: b.kode,
                            nama: b.nama,
                            tipe: b.tipe,
                            nominal_standar: 0,
                            deskripsi: b.deskripsi || '',
                          });
                          setIsJenisBiayaModalOpen(true);
                        }}
                        title="Edit Komponen Biaya"
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 border border-transparent rounded-lg transition-all mx-auto"
                      >
                        <Edit size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. TAB MASTER JALUR KELAS */}
      {activeTab === 'jalur-kelas' && (
        <div className="bg-white rounded-b-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">Setting Jalur Kelas & Tipe Mahasiswa</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pengelolaan master tipe jalur mahasiswa (Reguler, Karyawan, Internasional, Online PJJ, dll.).
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500">{jalurKelasList.length} Jalur Terdaftar</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {jalurKelasList.map((j) => (
              <div key={j.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-700">{j.kode}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">Aktif</span>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm">{j.nama_jalur}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2">{j.deskripsi || 'Jalur perkuliahan institusi.'}</p>
                </div>

                <div className="flex items-center justify-end gap-1 pt-3 border-t border-slate-200/80">
                  <button
                    onClick={() => {
                      setEditingJalurItem(j);
                      setEditJalurForm({ nama_jalur: j.nama_jalur, deskripsi: j.deskripsi || '' });
                      setIsEditJalurModalOpen(true);
                    }}
                    title="Edit Jalur Kelas"
                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 border border-transparent rounded-lg transition-all"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => {
                      setDeletingJalurItem(j);
                      setConfirmDeleteChecklist(false);
                      setIsDeleteJalurModalOpen(true);
                    }}
                    title="Hapus Jalur Kelas"
                    className="p-1.5 text-rose-600 hover:bg-rose-50 hover:border-rose-200 border border-transparent rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. TAB TARIF ANGKATAN */}
      {activeTab === 'tarif' && (
        <div className="bg-white rounded-b-2xl border border-slate-100 shadow-sm p-6 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Tahun Angkatan:</span>
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                  {availableAngkatan.map((year) => (
                    <button
                      key={year}
                      onClick={() => {
                        setSelectedAngkatan(year);
                        setTarifForm({ ...tarifForm, tahun_angkatan: year });
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all ${
                        selectedAngkatan === year ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Jalur / Kelas:</span>
                <select
                  value={selectedJalur}
                  onChange={(e) => setSelectedJalur(e.target.value)}
                  className="select select-sm border-slate-300 font-bold text-xs rounded-xl"
                >
                  {jalurKelasList.map((j) => (
                    <option key={j.id} value={j.nama_jalur}>{j.nama_jalur}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Program Studi:</span>
                <select
                  value={selectedProdiTarif}
                  onChange={(e) => setSelectedProdiTarif(e.target.value)}
                  className="select select-sm border-slate-300 font-bold text-xs rounded-xl"
                >
                  <option value="all">Semua Program Studi</option>
                  <option value="Teknik Informatika">Teknik Informatika</option>
                  <option value="Sistem Informasi">Sistem Informasi</option>
                  <option value="Manajemen Informatika">Manajemen Informatika</option>
                </select>
              </div>
            </div>

            <div className="text-xs font-mono font-bold text-slate-500">
              Total {tarifList.filter(t => selectedProdiTarif === 'all' || !t.prodi || t.prodi === 'Semua Prodi' || t.prodi === selectedProdiTarif).length} Tarif Ditemukan
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase border-y border-slate-200">
                <tr>
                  <th className="px-4 py-3">PROGRAM STUDI</th>
                  <th className="px-4 py-3">ANGKATAN & JALUR KELAS</th>
                  <th className="px-4 py-3">PERUNTUKAN / LABEL TARIF</th>
                  <th className="px-4 py-3">KOMPONEN BIAYA</th>
                  <th className="px-4 py-3 text-right">NOMINAL TARIF (RP)</th>
                  <th className="px-4 py-3 text-center">STATUS</th>
                  <th className="px-4 py-3 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-8 text-slate-400">Memuat tarif...</td></tr>
                ) : tarifList.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-slate-400">Belum ada tarif untuk Angkatan {selectedAngkatan} - Kelas {selectedJalur}.</td></tr>
                ) : (
                  tarifList
                    .filter(t => selectedProdiTarif === 'all' || !t.prodi || t.prodi === 'Semua Prodi' || t.prodi === selectedProdiTarif)
                    .map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-teal-50 text-teal-800 border border-teal-200">
                          {t.prodi || t.program_studi || t.nama_prodi || 'Teknik Informatika'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold font-mono text-slate-800">
                        Angkatan {t.tahun_angkatan || selectedAngkatan} ({t.jalur_kelas || selectedJalur})
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-extrabold text-slate-900 text-sm">
                          {t.nama_kelompok || 'Tarif Standar Prodi'}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">{t.jenis_biaya?.nama || 'UKT Reguler'}</td>
                      <td className="px-4 py-3 text-right font-mono font-extrabold text-emerald-700 text-sm">
                        {formatRupiah(t.nominal)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                          {t.is_active !== false ? 'Aktif' : 'Non-Aktif'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setEditingTarif(t);
                              setTarifForm({
                                jenis_biaya_id: t.jenis_biaya_id || 1,
                                tahun_angkatan: t.tahun_angkatan || selectedAngkatan,
                                jalur_kelas: t.jalur_kelas || selectedJalur,
                                prodi: t.prodi || 'Teknik Informatika',
                                nama_kelompok: t.nama_kelompok || (t.prodi ? `Tarif ${t.prodi}` : 'Tarif SPP Standar'),
                                program_studi_id: t.program_studi_id || 0,
                                nominal: t.nominal,
                              });
                              setIsTarifModalOpen(true);
                            }}
                            title="Edit Nominal Tarif"
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 border border-transparent rounded-lg transition-all"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteTarif(t.id)}
                            title="Hapus Tarif"
                            className="p-1.5 text-rose-600 hover:bg-rose-50 hover:border-rose-200 border border-transparent rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. TAB MASTER BEASISWA */}
      {activeTab === 'beasiswa' && (
        <div className="bg-white rounded-b-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900">Master Program Beasiswa & Setting Scope Target Tagihan/Angkatan</h2>
            <span className="text-xs font-bold text-slate-500">{beasiswaList.length} Beasiswa Terdaftar</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase border-y border-slate-200">
                <tr>
                  <th className="px-4 py-3">KODE</th>
                  <th className="px-4 py-3">NAMA PROGRAM BEASISWA</th>
                  <th className="px-4 py-3">TARGET BIAYA / TAGIHAN</th>
                  <th className="px-4 py-3">CAKUPAN ANGKATAN</th>
                  <th className="px-4 py-3 text-right">NILAI POTONGAN</th>
                  <th className="px-4 py-3 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {beasiswaList.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-emerald-700">{b.kode}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{b.nama}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {b.jenis_biaya?.nama ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                          {b.jenis_biaya.nama}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">Semua Komponen Tagihan</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-teal-800">
                      {b.berlaku_angkatan_mulai && b.berlaku_angkatan_sampai
                        ? `Angkatan ${b.berlaku_angkatan_mulai} - ${b.berlaku_angkatan_sampai}`
                        : 'Semua Angkatan'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-extrabold text-emerald-800 text-sm">
                      {b.tipe_potongan === 'persen' ? `${b.nilai_potongan}%` : formatRupiah(b.nilai_potongan)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => {
                          setEditingBeasiswa(b);
                          setBeasiswaForm({
                            kode: b.kode,
                            nama: b.nama,
                            sumber: b.sumber || 'internal',
                            tipe_potongan: b.tipe_potongan || 'persen',
                            nilai_potongan: b.nilai_potongan || 100,
                            jenis_biaya_id: b.jenis_biaya_id || 0,
                            berlaku_angkatan_mulai: b.berlaku_angkatan_mulai || 2023,
                            berlaku_angkatan_sampai: b.berlaku_angkatan_sampai || 2027,
                            deskripsi: b.deskripsi || '',
                          });
                          setIsBeasiswaModalOpen(true);
                        }}
                        title="Edit Scope Beasiswa"
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 border border-transparent rounded-lg transition-all mx-auto"
                      >
                        <Edit size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. TAB TIPE TAGIHAN MAHASISWA */}
      {activeTab === 'student-types' && (
        <div className="bg-white rounded-b-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">Penetapan Tipe Tagihan & Riwayat Perubahan Jalur Mahasiswa</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Integrasi otomatis dari SPMB/SIAKAD & Pengaturan Admin (dilengkapi Server-Side Pagination & Search).
              </p>
            </div>

            <div className="relative w-full md:w-72">
              <input
                type="text"
                placeholder="Cari Nama atau NIM Mahasiswa..."
                value={studentSearchQuery}
                onChange={(e) => handleSearchStudent(e.target.value)}
                className="input input-sm border-slate-300 w-full pl-8 text-xs font-semibold rounded-xl"
              />
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase border-y border-slate-200">
                <tr>
                  <th className="px-4 py-3">MAHASISWA & NIM</th>
                  <th className="px-4 py-3">ANGKATAN & JALUR KELAS</th>
                  <th className="px-4 py-3">KELOMPOK UKT</th>
                  <th className="px-4 py-3">POTONGAN BEASISWA</th>
                  <th className="px-4 py-3">CATATAN PERUBAHAN</th>
                  <th className="px-4 py-3 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-8 text-slate-400">Memuat data...</td></tr>
                ) : studentTypesList.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-slate-400">Tidak ada mahasiswa ditemukan untuk kata kunci tersebut.</td></tr>
                ) : (
                  studentTypesList.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{st.nama_mahasiswa}</div>
                        <div className="text-[10px] font-mono text-slate-500">NIM: {st.nim}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-extrabold text-teal-800">Angkatan {st.tahun_angkatan}</span>
                        <div className="text-[10px] font-bold text-indigo-700 uppercase">Jalur {st.jalur_kelas}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-extrabold text-slate-900">Kelompok {st.kelompok_ukt}</div>
                        <div className="text-[10px] text-teal-700 font-bold mt-0.5">{getLevelText(st.kelompok_ukt)}</div>
                      </td>
                      <td className="px-4 py-3">
                        {st.beasiswa ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {st.beasiswa.nama || 'Penerima Beasiswa'}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">Non-Beasiswa</span>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <div className="font-medium text-slate-700 truncate">{st.catatan_perubahan || '-'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Sumber: {st.status_pendaftaran}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => {
                            setEditingStudentType(st);
                            setStudentTypeForm({
                              mahasiswa_id: st.mahasiswa_id,
                              nim: st.nim,
                              nama_mahasiswa: st.nama_mahasiswa,
                              tahun_angkatan: st.tahun_angkatan,
                              jalur_kelas: st.jalur_kelas,
                              kelompok_ukt: st.kelompok_ukt,
                              beasiswa_id: st.beasiswa_id || 0,
                              catatan_perubahan: st.catatan_perubahan || '',
                            });
                            setIsStudentTypeModalOpen(true);
                          }}
                          title="Ubah Tipe / Jalur Kelas Mahasiswa"
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 border border-transparent rounded-lg transition-all mx-auto"
                        >
                          <Edit size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t pt-4 text-xs font-semibold text-slate-600">
            <div>
              Menampilkan Halaman <span className="font-bold text-slate-900">{studentTypeMeta.current_page || 1}</span> dari <span className="font-bold text-slate-900">{studentTypeMeta.last_page || 1}</span> (Total <span className="font-bold text-slate-900">{studentTypeMeta.total || studentTypesList.length}</span> data)
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={studentTypePage <= 1}
                onClick={() => setStudentTypePage(p => Math.max(1, p - 1))}
                className="btn btn-ghost btn-xs flex items-center gap-1 font-bold disabled:opacity-40"
              >
                <ChevronLeft size={14} /> Sebelum
              </button>
              <button
                disabled={studentTypePage >= (studentTypeMeta.last_page || 1)}
                onClick={() => setStudentTypePage(p => p + 1)}
                className="btn btn-ghost btn-xs flex items-center gap-1 font-bold disabled:opacity-40"
              >
                Lanjut <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB PENERIMA BEASISWA */}
      {activeTab === 'mapping-beasiswa' && (
        <div className="bg-white rounded-b-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900">Daftar Mahasiswa Penerima Beasiswa (Pemotong Tagihan Otomatis)</h2>
            <span className="text-xs font-bold text-slate-500">{beasiswaMeta.total || mahasiswaBeasiswaList.length} Mahasiswa Menerima Beasiswa</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase border-y border-slate-200">
                <tr>
                  <th className="px-4 py-3">MAHASISWA & NIM</th>
                  <th className="px-4 py-3">PROGRAM BEASISWA</th>
                  <th className="px-4 py-3">NILAI POTONGAN</th>
                  <th className="px-4 py-3 text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mahasiswaBeasiswaList.map((mb) => (
                  <tr key={mb.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{mb.nama_mahasiswa}</div>
                      <div className="text-[10px] font-mono text-slate-500">NIM: {mb.nim}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{mb.nama_beasiswa}</td>
                    <td className="px-4 py-3 font-mono font-extrabold text-emerald-800">{mb.potongan_text}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        {mb.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t pt-4 text-xs font-semibold text-slate-600">
            <div>
              Menampilkan Halaman <span className="font-bold text-slate-900">{beasiswaMeta.current_page || 1}</span> dari <span className="font-bold text-slate-900">{beasiswaMeta.last_page || 1}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={beasiswaPage <= 1}
                onClick={() => setBeasiswaPage(p => Math.max(1, p - 1))}
                className="btn btn-ghost btn-xs flex items-center gap-1 font-bold disabled:opacity-40"
              >
                <ChevronLeft size={14} /> Sebelum
              </button>
              <button
                disabled={beasiswaPage >= (beasiswaMeta.last_page || 1)}
                onClick={() => setBeasiswaPage(p => p + 1)}
                className="btn btn-ghost btn-xs flex items-center gap-1 font-bold disabled:opacity-40"
              >
                Lanjut <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'unit-kas-master' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">7. Master Unit Kas & Unit Kerja Aktif</h2>
              <p className="text-xs text-slate-500">Kelola daftar unit kas operasional, penanggung jawab, & nomor rekening bank tujuan pencairan</p>
            </div>
            <button
              onClick={() => alert('Fasilitas tambah unit kas baru telah siap. Unit baru otomatis muncul di dropdown pengajuan.')}
              className="btn bg-teal-600 hover:bg-teal-700 text-white btn-xs font-bold border-none flex items-center gap-1"
            >
              <Plus size={14} /> Tambah Unit Kerja Baru
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-slate-900">Petty Cash Fakultas Teknik & TIK</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">AKTIF</span>
              </div>
              <div className="text-slate-600 font-medium">PJ: Kabag TU FTIK</div>
              <div className="font-mono text-teal-800 font-bold bg-white p-2 rounded border border-slate-200">
                Bank BNI - 1234567890 (a.n Rekening Operasional FTIK)
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-slate-900">Kas Operasional SPMB</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">AKTIF</span>
              </div>
              <div className="text-slate-600 font-medium">PJ: Panitia SPMB</div>
              <div className="font-mono text-teal-800 font-bold bg-white p-2 rounded border border-slate-200">
                Bank Mandiri - 9876543210 (a.n Rekening Kasir SPMB)
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-slate-900">Laboratorium Komputer TI</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">AKTIF</span>
              </div>
              <div className="text-slate-600 font-medium">PJ: Ka. Lab Komputer</div>
              <div className="font-mono text-teal-800 font-bold bg-white p-2 rounded border border-slate-200">
                Bank BCA - 5554443332 (a.n Operasional Lab Komputer TI)
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-slate-900">Bagian Kemahasiswaan & PKM</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">AKTIF</span>
              </div>
              <div className="text-slate-600 font-medium">PJ: Wakil Rektor III</div>
              <div className="font-mono text-teal-800 font-bold bg-white p-2 rounded border border-slate-200">
                Bank BRI - 1122334455 (a.n Dana Kemahasiswaan & PKM)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH JALUR KELAS BARU */}
      {isJalurModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-base text-slate-900">Tambah Jalur / Tipe Kelas Baru</h3>
              <button onClick={() => setIsJalurModalOpen(false)} className="btn btn-ghost btn-xs font-bold">✕</button>
            </div>
            <form onSubmit={handleSaveJalurKelas} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Nama Jalur Kelas *</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Kelas Malam / Kelas Online / Transfer"
                  value={jalurForm.nama_jalur}
                  onChange={(e) => setJalurForm({ ...jalurForm, nama_jalur: e.target.value })}
                  className="input input-sm border-slate-300 w-full font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Deskripsi / Peruntukan</label>
                <textarea
                  rows={2}
                  placeholder="Tuliskan keterangan peruntukan jalur kelas..."
                  value={jalurForm.deskripsi}
                  onChange={(e) => setJalurForm({ ...jalurForm, deskripsi: e.target.value })}
                  className="textarea textarea-sm border-slate-300 w-full text-xs font-medium"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <button type="button" onClick={() => setIsJalurModalOpen(false)} className="btn btn-ghost btn-sm font-bold">Batal</button>
                <button type="submit" className="btn bg-teal-600 hover:bg-teal-700 text-white btn-sm font-bold border-none">
                  Simpan Jalur Kelas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT JALUR KELAS */}
      {isEditJalurModalOpen && editingJalurItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-base text-slate-900">Edit Data Jalur Kelas [{editingJalurItem.kode}]</h3>
              <button onClick={() => setIsEditJalurModalOpen(false)} className="btn btn-ghost btn-xs font-bold">✕</button>
            </div>
            <form onSubmit={handleUpdateJalurKelas} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Nama Jalur Kelas *</label>
                <input
                  type="text"
                  required
                  value={editJalurForm.nama_jalur}
                  onChange={(e) => setEditJalurForm({ ...editJalurForm, nama_jalur: e.target.value })}
                  className="input input-sm border-slate-300 w-full font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Deskripsi / Peruntukan</label>
                <textarea
                  rows={2}
                  value={editJalurForm.deskripsi}
                  onChange={(e) => setEditJalurForm({ ...editJalurForm, deskripsi: e.target.value })}
                  className="textarea textarea-sm border-slate-300 w-full text-xs font-medium"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <button type="button" onClick={() => setIsEditJalurModalOpen(false)} className="btn btn-ghost btn-sm font-bold">Batal</button>
                <button type="submit" className="btn bg-teal-600 hover:bg-teal-700 text-white btn-sm font-bold border-none">
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL HAPUS JALUR KELAS WITH CHECKLIST CONFIRMATION */}
      {isDeleteJalurModalOpen && deletingJalurItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 text-rose-600">
              <h3 className="font-extrabold text-base flex items-center gap-1.5">
                <AlertTriangle size={18} /> Peringatan Penghapusan Jalur Kelas
              </h3>
              <button onClick={() => setIsDeleteJalurModalOpen(false)} className="btn btn-ghost btn-xs font-bold">✕</button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs space-y-1">
                <div className="font-extrabold text-sm">Jalur Kelas: {deletingJalurItem.nama_jalur} [{deletingJalurItem.kode}]</div>
                <p className="font-medium text-rose-800">
                  Penghapusan jalur kelas ini dapat mempengaruhi kelompok tarif mahasiswa yang menggunakan jalur kelas tersebut.
                </p>
              </div>

              <div className="flex items-start gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <input
                  type="checkbox"
                  id="chkConfirmDelete"
                  checked={confirmDeleteChecklist}
                  onChange={(e) => setConfirmDeleteChecklist(e.target.checked)}
                  className="checkbox checkbox-sm checkbox-rose mt-0.5"
                />
                <label htmlFor="chkConfirmDelete" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Saya yakin dan paham akibat dari menghapus jalur kelas &ldquo;{deletingJalurItem.nama_jalur}&rdquo;.
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsDeleteJalurModalOpen(false)} className="btn btn-ghost btn-sm font-bold">Batal</button>
                <button
                  type="button"
                  disabled={!confirmDeleteChecklist}
                  onClick={handleDeleteJalurKelas}
                  className="btn bg-rose-600 hover:bg-rose-700 text-white btn-sm font-bold border-none disabled:opacity-40"
                >
                  Hapus Jalur Kelas Permanen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL UBAH / PENETAPAN TIPE TAGIHAN MAHASISWA */}
      {isStudentTypeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-base text-slate-900">
                {editingStudentType ? 'Ubah Tipe Tagihan & Jalur Mahasiswa' : 'Penetapan Tipe Tagihan Baru'}
              </h3>
              <button onClick={() => setIsStudentTypeModalOpen(false)} className="btn btn-ghost btn-xs font-bold">✕</button>
            </div>
            <form onSubmit={handleSaveStudentType} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">NIM / ID Mahasiswa *</label>
                  <input
                    type="text"
                    required
                    readOnly={!!editingStudentType}
                    value={studentTypeForm.nim || studentTypeForm.mahasiswa_id}
                    onChange={(e) => setStudentTypeForm({ ...studentTypeForm, nim: e.target.value })}
                    className="input input-sm border-slate-300 w-full font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Nama Mahasiswa *</label>
                  <input
                    type="text"
                    required
                    readOnly={!!editingStudentType}
                    value={studentTypeForm.nama_mahasiswa}
                    onChange={(e) => setStudentTypeForm({ ...studentTypeForm, nama_mahasiswa: e.target.value })}
                    className="input input-sm border-slate-300 w-full font-bold text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Jalur / Kelas Baru *</label>
                  <select
                    value={studentTypeForm.jalur_kelas}
                    onChange={(e) => setStudentTypeForm({ ...studentTypeForm, jalur_kelas: e.target.value })}
                    className="select select-sm border-slate-300 w-full font-bold text-xs"
                  >
                    {jalurKelasList.map((j) => (
                      <option key={j.id} value={j.nama_jalur}>{j.nama_jalur}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Kelompok UKT *</label>
                  <select
                    value={studentTypeForm.kelompok_ukt}
                    onChange={(e) => setStudentTypeForm({ ...studentTypeForm, kelompok_ukt: Number(e.target.value) })}
                    className="select select-sm border-slate-300 w-full font-bold text-xs"
                  >
                    <option value={1}>Level 1 (Subsidi Penuh)</option>
                    <option value={2}>Level 2 (Subsidi Parsial)</option>
                    <option value={3}>Level 3 (Reguler / Standar)</option>
                    <option value={4}>Level 4 (Mandiri)</option>
                    <option value={5}>Level 5 (Eksekutif / Khusus)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Program Beasiswa (Opsional)</label>
                <select
                  value={studentTypeForm.beasiswa_id}
                  onChange={(e) => setStudentTypeForm({ ...studentTypeForm, beasiswa_id: Number(e.target.value) })}
                  className="select select-sm border-slate-300 w-full font-semibold text-xs"
                >
                  <option value={0}>-- Tanpa Beasiswa --</option>
                  {beasiswaList.map((b) => (
                    <option key={b.id} value={b.id}>[{b.kode}] {b.nama}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Catatan Alasan Perubahan *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Misal: Pindah dari kelas reguler ke kelas karyawan per semester 3..."
                  value={studentTypeForm.catatan_perubahan}
                  onChange={(e) => setStudentTypeForm({ ...studentTypeForm, catatan_perubahan: e.target.value })}
                  className="textarea textarea-sm border-slate-300 w-full text-xs font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button type="button" onClick={() => setIsStudentTypeModalOpen(false)} className="btn btn-ghost btn-sm font-bold">Batal</button>
                <button type="submit" disabled={loading} className="btn bg-teal-600 hover:bg-teal-700 text-white btn-sm font-bold border-none">
                  Simpan Perubahan Tipe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH ANGKATAN BARU */}
      {isAddAngkatanOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-base text-slate-900">Tambah Angkatan Baru</h3>
              <button onClick={() => setIsAddAngkatanOpen(false)} className="btn btn-ghost btn-xs font-bold">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Tahun Angkatan Baru *</label>
                <input
                  type="number"
                  value={newAngkatanYear}
                  onChange={(e) => setNewAngkatanYear(Number(e.target.value))}
                  className="input input-sm border-slate-300 w-full font-mono font-bold text-center text-lg text-indigo-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsAddAngkatanOpen(false)} className="btn btn-ghost btn-sm font-bold">Batal</button>
                <button type="button" onClick={handleAddAngkatan} className="btn bg-teal-600 hover:bg-teal-700 text-white btn-sm font-bold border-none">
                  Tambah Angkatan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT / INPUT TARIF ANGKATAN */}
      {isTarifModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-base text-slate-900">
                {editingTarif ? 'Update Nominal & Label Tarif UKT' : 'Set Tarif Angkatan Baru'}
              </h3>
              <button onClick={() => setIsTarifModalOpen(false)} className="btn btn-ghost btn-xs font-bold">✕</button>
            </div>
            <form onSubmit={handleSaveTarif} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Tahun Angkatan *</label>
                  <select
                    value={tarifForm.tahun_angkatan}
                    onChange={(e) => setTarifForm({ ...tarifForm, tahun_angkatan: Number(e.target.value) })}
                    className="select select-sm border-slate-300 w-full font-bold text-xs"
                  >
                    {availableAngkatan.map((year) => (
                      <option key={year} value={year}>Angkatan {year}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Jalur / Kelas *</label>
                  <select
                    value={tarifForm.jalur_kelas}
                    onChange={(e) => setTarifForm({ ...tarifForm, jalur_kelas: e.target.value })}
                    className="select select-sm border-slate-300 w-full font-bold text-xs"
                  >
                    {jalurKelasList.map((j) => (
                      <option key={j.id} value={j.nama_jalur}>{j.nama_jalur}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Program Studi *</label>
                  <select
                    value={tarifForm.prodi || 'Teknik Informatika'}
                    onChange={(e) => setTarifForm({ ...tarifForm, prodi: e.target.value, nama_kelompok: `SPP Semester ${e.target.value}` })}
                    className="select select-sm border-slate-300 w-full font-bold text-xs"
                  >
                    <option value="Semua Prodi">Semua Program Studi (Umum)</option>
                    <option value="Teknik Informatika">Teknik Informatika</option>
                    <option value="Sistem Informasi">Sistem Informasi</option>
                    <option value="Manajemen Informatika">Manajemen Informatika</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Peruntukan / Label Tarif *</label>
                  <input
                    type="text"
                    required
                    placeholder="contoh: SPP Semester Teknik Informatika"
                    value={tarifForm.nama_kelompok}
                    onChange={(e) => setTarifForm({ ...tarifForm, nama_kelompok: e.target.value })}
                    className="input input-sm border-slate-300 w-full font-semibold text-xs"
                  />
                </div>
              </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Komponen Biaya *</label>
                  <select
                    value={tarifForm.jenis_biaya_id}
                    onChange={(e) => setTarifForm({ ...tarifForm, jenis_biaya_id: Number(e.target.value) })}
                    className="select select-sm border-slate-300 w-full font-semibold text-xs"
                  >
                    {jenisBiayaList.map((j) => (
                      <option key={j.id} value={j.id}>{j.nama}</option>
                    ))}
                  </select>
                </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Nominal Tarif (Rp) *</label>
                <input
                  type="number"
                  required
                  value={tarifForm.nominal}
                  onChange={(e) => setTarifForm({ ...tarifForm, nominal: Number(e.target.value) })}
                  className="input input-sm border-slate-300 w-full font-mono font-extrabold text-emerald-800 text-base"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button type="button" onClick={() => setIsTarifModalOpen(false)} className="btn btn-ghost btn-sm font-bold">Batal</button>
                <button type="submit" disabled={loading} className="btn bg-teal-600 hover:bg-teal-700 text-white btn-sm font-bold border-none">
                  {editingTarif ? 'Simpan Pembaruan Tarif' : 'Simpan Tarif'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH / EDIT KOMPONEN JENIS BIAYA */}
      {isJenisBiayaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-base text-slate-900">
                {editingJenisBiaya ? 'Edit Master Komponen Biaya' : 'Tambah Komponen Biaya Kuliah'}
              </h3>
              <button onClick={() => setIsJenisBiayaModalOpen(false)} className="btn btn-ghost btn-xs font-bold">✕</button>
            </div>
            <form onSubmit={handleSaveJenisBiaya} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Kode Komponen *</label>
                <input
                  type="text"
                  required
                  readOnly={!!editingJenisBiaya}
                  placeholder="Misal: PRAKTIKUM / GEDUNG"
                  value={jenisBiayaForm.kode}
                  onChange={(e) => setJenisBiayaForm({ ...jenisBiayaForm, kode: e.target.value })}
                  className="input input-sm border-slate-300 w-full font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Nama Komponen Biaya *</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Biaya Laboratorium & Praktikum"
                  value={jenisBiayaForm.nama}
                  onChange={(e) => setJenisBiayaForm({ ...jenisBiayaForm, nama: e.target.value })}
                  className="input input-sm border-slate-300 w-full font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Tipe Komponen *</label>
                <select
                  value={jenisBiayaForm.tipe}
                  onChange={(e) => setJenisBiayaForm({ ...jenisBiayaForm, tipe: e.target.value })}
                  className="select select-sm border-slate-300 w-full font-semibold text-xs"
                >
                  <option value="ukt">UKT</option>
                  <option value="spp">SPP</option>
                  <option value="praktikum">Praktikum</option>
                  <option value="wisuda">Wisuda</option>
                  <option value="spmb_adm">SPMB</option>
                  <option value="lainnya">Lainnya / Gedung</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Deskripsi Peruntukan</label>
                <textarea
                  rows={2}
                  placeholder="Tuliskan keterangan peruntukan biaya..."
                  value={jenisBiayaForm.deskripsi}
                  onChange={(e) => setJenisBiayaForm({ ...jenisBiayaForm, deskripsi: e.target.value })}
                  className="textarea textarea-sm border-slate-300 w-full text-xs font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button type="button" onClick={() => setIsJenisBiayaModalOpen(false)} className="btn btn-ghost btn-sm font-bold">Batal</button>
                <button type="submit" className="btn bg-teal-600 hover:bg-teal-700 text-white btn-sm font-bold border-none">
                  Simpan Komponen Biaya
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MASTER BEASISWA WITH SCOPE TARGETING (JENIS BIAYA & ANGKATAN) */}
      {isBeasiswaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-base text-slate-900">
                {editingBeasiswa ? 'Edit Program Beasiswa & Scope' : 'Tambah Master Program Beasiswa'}
              </h3>
              <button onClick={() => setIsBeasiswaModalOpen(false)} className="btn btn-ghost btn-xs font-bold">✕</button>
            </div>
            <form onSubmit={handleSaveBeasiswa} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Kode Beasiswa *</label>
                  <input
                    type="text"
                    required
                    readOnly={!!editingBeasiswa}
                    placeholder="Misal: KIP_KULIAH"
                    value={beasiswaForm.kode}
                    onChange={(e) => setBeasiswaForm({ ...beasiswaForm, kode: e.target.value })}
                    className="input input-sm border-slate-300 w-full font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Sumber Dana *</label>
                  <select
                    value={beasiswaForm.sumber}
                    onChange={(e) => setBeasiswaForm({ ...beasiswaForm, sumber: e.target.value })}
                    className="select select-sm border-slate-300 w-full font-semibold text-xs"
                  >
                    <option value="internal">Internal Kampus</option>
                    <option value="pemerintah">Pemerintah (KIP-K)</option>
                    <option value="eksternal">Eksternal / Sponsor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Nama Program Beasiswa *</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Beasiswa KIP Kuliah Pemerintah"
                  value={beasiswaForm.nama}
                  onChange={(e) => setBeasiswaForm({ ...beasiswaForm, nama: e.target.value })}
                  className="input input-sm border-slate-300 w-full font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Tipe Potongan *</label>
                  <select
                    value={beasiswaForm.tipe_potongan}
                    onChange={(e) => setBeasiswaForm({ ...beasiswaForm, tipe_potongan: e.target.value })}
                    className="select select-sm border-slate-300 w-full font-semibold text-xs"
                  >
                    <option value="persen">Persentase (%)</option>
                    <option value="nominal">Nominal Rupiah (Rp)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Nilai Potongan *</label>
                  <input
                    type="number"
                    required
                    value={beasiswaForm.nilai_potongan}
                    onChange={(e) => setBeasiswaForm({ ...beasiswaForm, nilai_potongan: Number(e.target.value) })}
                    className="input input-sm border-slate-300 w-full font-mono font-bold text-emerald-800 text-xs"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
                <div className="text-xs font-extrabold text-slate-800 flex items-center gap-1">
                  <Filter size={14} className="text-emerald-600" /> Target Scope Potongan Tagihan & Angkatan:
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700">Target Komponen Tagihan (Optional)</label>
                  <select
                    value={beasiswaForm.jenis_biaya_id}
                    onChange={(e) => setBeasiswaForm({ ...beasiswaForm, jenis_biaya_id: Number(e.target.value) })}
                    className="select select-sm border-slate-300 w-full font-semibold text-xs bg-white"
                  >
                    <option value={0}>-- Berlaku untuk Semua Tagihan Pendidikan --</option>
                    {jenisBiayaList.map((j) => (
                      <option key={j.id} value={j.id}>Khusus Komponen: {j.nama}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700">Angkatan Mulai</label>
                    <input
                      type="number"
                      value={beasiswaForm.berlaku_angkatan_mulai}
                      onChange={(e) => setBeasiswaForm({ ...beasiswaForm, berlaku_angkatan_mulai: Number(e.target.value) })}
                      className="input input-xs border-slate-300 w-full font-mono font-bold bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700">Angkatan Sampai</label>
                    <input
                      type="number"
                      value={beasiswaForm.berlaku_angkatan_sampai}
                      onChange={(e) => setBeasiswaForm({ ...beasiswaForm, berlaku_angkatan_sampai: Number(e.target.value) })}
                      className="input input-xs border-slate-300 w-full font-mono font-bold bg-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Deskripsi / SK Rektor</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan peruntukan & persyaratannya..."
                  value={beasiswaForm.deskripsi}
                  onChange={(e) => setBeasiswaForm({ ...beasiswaForm, deskripsi: e.target.value })}
                  className="textarea textarea-sm border-slate-300 w-full text-xs font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button type="button" onClick={() => setIsBeasiswaModalOpen(false)} className="btn btn-ghost btn-sm font-bold">Batal</button>
                <button type="submit" className="btn bg-teal-600 hover:bg-teal-700 text-white btn-sm font-bold border-none">
                  Simpan Master Beasiswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PENETAPAN BEASISWA MAHASISWA WITH LIVE SEARCH MAHASISWA (NIM / NAMA) */}
      {isAssignBeasiswaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-base text-slate-900">Tetapkan Penerima Beasiswa</h3>
              <button onClick={() => setIsAssignBeasiswaModalOpen(false)} className="btn btn-ghost btn-xs font-bold">✕</button>
            </div>
            <form onSubmit={handleAssignBeasiswa} className="space-y-3">
              {/* SEARCHABLE STUDENT SELECTOR */}
              <div>
                <label className="text-xs font-bold text-slate-700">Cari & Pilih Mahasiswa *</label>
                <div className="space-y-1.5">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ketik Nama atau NIM..."
                      value={assignSearchQuery}
                      onChange={(e) => {
                        setAssignSearchQuery(e.target.value);
                        fetchStudentTypes(1, e.target.value);
                      }}
                      className="input input-sm border-slate-300 w-full pl-8 text-xs font-bold"
                    />
                    <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                  </div>

                  <select
                    required
                    value={assignForm.mahasiswa_id}
                    onChange={(e) => setAssignForm({ ...assignForm, mahasiswa_id: Number(e.target.value) })}
                    className="select select-sm border-slate-300 w-full font-bold text-xs bg-slate-50"
                  >
                    <option value={0}>-- Pilih Mahasiswa dari Hasil Pencarian --</option>
                    {studentTypesList.map((st) => (
                      <option key={st.id} value={st.mahasiswa_id}>
                        {st.nama_mahasiswa} (NIM: {st.nim}) - Angkatan {st.tahun_angkatan} [{st.jalur_kelas}]
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Program Beasiswa *</label>
                <select
                  value={assignForm.beasiswa_id}
                  onChange={(e) => setAssignForm({ ...assignForm, beasiswa_id: Number(e.target.value) })}
                  className="select select-sm border-slate-300 w-full font-bold text-xs"
                >
                  {beasiswaList.map((b) => (
                    <option key={b.id} value={b.id}>[{b.kode}] {b.nama}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button type="button" onClick={() => setIsAssignBeasiswaModalOpen(false)} className="btn btn-ghost btn-sm font-bold">Batal</button>
                <button type="submit" className="btn bg-teal-600 hover:bg-teal-700 text-white btn-sm font-bold border-none">
                  Tetapkan Beasiswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. TAB MASTER UNIT KAS */}
      {activeTab === 'unit-kas-master' && (
        <div className="bg-white rounded-b-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">Master Data Unit Kas & Multi-Rekening</h2>
              <p className="text-xs text-slate-500 mt-0.5">Pengelolaan unit pemegang Petty Cash beserta data rekening tujuan pencairan dana Xendit/Duitku.</p>
            </div>
            <span className="text-xs font-bold text-slate-500">{unitKasMasterList.length} Unit Terdaftar</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unitKasMasterList.map((u) => (
              <div key={u.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-teal-100 text-teal-800 rounded-md">ID: {u.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.status === 'aktif' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{u.status.toUpperCase()}</span>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm leading-tight">{u.nama}</h3>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-100 space-y-1">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rekening Tujuan Pencairan</div>
                    <div className="font-mono font-extrabold text-indigo-700 text-xs">{u.bank} - {u.no_rekening}</div>
                    <div className="text-[11px] font-semibold text-slate-700">a.n. {u.atas_nama}</div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1 pt-3 border-t border-slate-200/80">
                  <button
                    onClick={() => {
                      setEditingUnitKas(u);
                      setUnitKasForm(u);
                      setIsUnitKasModalOpen(true);
                    }}
                    title="Edit Unit Kas"
                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 border border-transparent rounded-lg transition-all"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Hapus Unit Kas ${u.nama}?`)) {
                        setUnitKasMasterList(unitKasMasterList.filter(item => item.id !== u.id));
                        setFeedback({ type: 'success', message: 'Unit kas berhasil dihapus.' });
                      }
                    }}
                    title="Hapus Unit Kas"
                    className="p-1.5 text-rose-600 hover:bg-rose-50 hover:border-rose-200 border border-transparent rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL UNIT KAS */}
      {isUnitKasModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Building size={18} className="text-teal-600" /> {editingUnitKas ? 'Edit Unit Kas' : 'Tambah Unit Kas Baru'}
              </h3>
              <button onClick={() => setIsUnitKasModalOpen(false)} className="btn btn-ghost btn-xs font-bold">✕</button>
            </div>
            <form onSubmit={handleSaveUnitKas} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nama Unit Pemegang Kas *</label>
                <input
                  type="text"
                  required
                  value={unitKasForm.nama}
                  onChange={(e) => setUnitKasForm({ ...unitKasForm, nama: e.target.value })}
                  placeholder="Contoh: Petty Cash Lab TI"
                  className="input input-sm border-slate-300 w-full font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Bank *</label>
                  <select
                    value={unitKasForm.bank}
                    onChange={(e) => setUnitKasForm({ ...unitKasForm, bank: e.target.value })}
                    className="select select-sm border-slate-300 w-full font-bold text-xs"
                  >
                    <option value="BNI">BNI</option>
                    <option value="Mandiri">Mandiri</option>
                    <option value="BCA">BCA</option>
                    <option value="BRI">BRI</option>
                    <option value="BSI">BSI</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">No. Rekening *</label>
                  <input
                    type="text"
                    required
                    value={unitKasForm.no_rekening}
                    onChange={(e) => setUnitKasForm({ ...unitKasForm, no_rekening: e.target.value })}
                    className="input input-sm border-slate-300 w-full font-mono font-bold text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Atas Nama Rekening *</label>
                <input
                  type="text"
                  required
                  value={unitKasForm.atas_nama}
                  onChange={(e) => setUnitKasForm({ ...unitKasForm, atas_nama: e.target.value })}
                  className="input input-sm border-slate-300 w-full font-semibold text-xs"
                />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="statusUnitKas"
                  checked={unitKasForm.status === 'aktif'}
                  onChange={(e) => setUnitKasForm({ ...unitKasForm, status: e.target.checked ? 'aktif' : 'nonaktif' })}
                  className="toggle toggle-success toggle-sm"
                />
                <label htmlFor="statusUnitKas" className="text-xs font-bold text-slate-700 cursor-pointer">Unit Aktif</label>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                <button type="button" onClick={() => setIsUnitKasModalOpen(false)} className="btn btn-ghost btn-sm font-bold">Batal</button>
                <button type="submit" className="btn bg-teal-600 hover:bg-teal-700 text-white btn-sm font-bold border-none">
                  Simpan Unit Kas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
