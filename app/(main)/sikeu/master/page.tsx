'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, CheckCircle, Plus, Calendar, Layers, Edit, Trash2, UserCheck, Award, Sparkles, Filter, CheckCircle2, AlertCircle, RefreshCw, UserPlus, Search, Settings, ChevronLeft, ChevronRight, AlertTriangle, Building, Wallet, Home, RotateCcw, X } from 'lucide-react';
import { sikeuService } from '@/services/sikeu.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Drawer } from '@/components/ui/Drawer';

export default function MasterBiayaPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  // Reordered default tab: 1. Komponen Biaya, 2. Jalur/Kelas, 3. Tarif Angkatan, 4. Master Beasiswa, 5. Tipe Tagihan, 6. Penerima Beasiswa, 7. Master Unit Kas
  const [activeTab, setActiveTab] = useState<'jenis-biaya' | 'jalur-kelas' | 'tarif' | 'beasiswa' | 'student-types' | 'mapping-beasiswa' | 'unit-kas-master'>('jenis-biaya');

  // Global search & filter states for toolbars
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    // Reset search & filter when switching tabs
    setSearchTerm('');
    setFilterType('all');
    setFilterSource('all');
    setFilterStatus('all');
    setShowFilter(false);
  }, [activeTab]);

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
    prodi: '',
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
  const [unitKasMasterList, setUnitKasMasterList] = useState<any[]>([]);
  const [isUnitKasModalOpen, setIsUnitKasModalOpen] = useState(false);
  const [unitKasForm, setUnitKasForm] = useState({ id: 0, nama_kas: '', bank_name: 'BNI', bank_account_number: '', bank_account_name: '', status: true, deskripsi: '' });
  const [editingUnitKas, setEditingUnitKas] = useState<any | null>(null);

  const fetchUnitKas = async () => {
    try {
      setLoading(true);
      const res = await sikeuService.getUnitKasList();
      setUnitKasMasterList(res.data || []);
    } catch (error: any) {
      setFeedback({ type: 'error', message: 'Gagal mengambil data Unit Kas: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'unit-kas-master') {
      fetchUnitKas();
    }
  }, [activeTab]);

  const handleSaveUnitKas = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUnitKas) {
        await sikeuService.updateUnitKas(editingUnitKas.id, unitKasForm);
        setFeedback({ type: 'success', message: 'Data Unit Kas berhasil diperbarui.' });
      } else {
        await sikeuService.storeUnitKas(unitKasForm);
        setFeedback({ type: 'success', message: 'Unit Kas baru berhasil ditambahkan.' });
      }
      setIsUnitKasModalOpen(false);
      fetchUnitKas();
    } catch (error: any) {
      setFeedback({ type: 'error', message: 'Gagal menyimpan: ' + error.message });
    }
  };

  const handleDeleteUnitKas = async (id: number) => {
    if (confirm('Yakin ingin menghapus unit kas ini?')) {
      try {
        await sikeuService.deleteUnitKas(id);
        setFeedback({ type: 'success', message: 'Unit kas berhasil dihapus' });
        fetchUnitKas();
      } catch (error: any) {
        setFeedback({ type: 'error', message: 'Gagal menghapus: ' + error.message });
      }
    }
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
      setJenisBiayaList(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setJenisBiayaList([]);
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

  // Filtered data calculations
  const filteredJenisBiaya = jenisBiayaList.filter(j => {
    const matchSearch = !searchTerm || j.nama?.toLowerCase().includes(searchTerm.toLowerCase()) || j.kode?.toLowerCase().includes(searchTerm.toLowerCase()) || j.deskripsi?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === 'all' || j.tipe === filterType;
    return matchSearch && matchType;
  });

  const filteredJalurKelas = jalurKelasList.filter(j => {
    return !searchTerm || j.nama_jalur?.toLowerCase().includes(searchTerm.toLowerCase()) || j.deskripsi?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredTarif = tarifList.filter(t => {
    return !searchTerm || t.nama_kelompok?.toLowerCase().includes(searchTerm.toLowerCase()) || t.prodi?.toLowerCase().includes(searchTerm.toLowerCase()) || t.jenis_biaya?.nama?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredBeasiswa = beasiswaList.filter(b => {
    const matchSearch = !searchTerm || b.nama?.toLowerCase().includes(searchTerm.toLowerCase()) || b.kode?.toLowerCase().includes(searchTerm.toLowerCase()) || b.deskripsi?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSource = filterSource === 'all' || b.sumber === filterSource;
    return matchSearch && matchSource;
  });

  const filteredStudentTypes = studentTypesList.filter(s => {
    return !searchTerm || s.nama_mahasiswa?.toLowerCase().includes(searchTerm.toLowerCase()) || s.nim?.toLowerCase().includes(searchTerm.toLowerCase()) || s.jalur_kelas?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredMahasiswaBeasiswa = mahasiswaBeasiswaList.filter(m => {
    const matchSearch = !searchTerm || m.nama_mahasiswa?.toLowerCase().includes(searchTerm.toLowerCase()) || m.nim?.toLowerCase().includes(searchTerm.toLowerCase()) || m.nama_beasiswa?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || m.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const filteredUnitKas = unitKasMasterList.filter(u => {
    const matchSearch = !searchTerm || u.nama_kas?.toLowerCase().includes(searchTerm.toLowerCase()) || u.bank_name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.bank_account_number?.toLowerCase().includes(searchTerm.toLowerCase()) || u.bank_account_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || (filterStatus === 'aktif' ? u.status : !u.status);
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* SSO Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium -mb-2">
        <Link href="/dashboard" className="flex items-center gap-1.5 hover:text-primary-600 transition">
          <Home size={14} />
          <span>SSO Dashboard</span>
        </Link>
        <ChevronRight size={12} className="text-slate-400" />
        <Link href="/sikeu" className="hover:text-primary-600 transition">
          SIKEU
        </Link>
        <ChevronRight size={12} className="text-slate-400" />
        <span className="text-slate-900 font-bold">Master Biaya &amp; Tarif</span>
      </nav>

      {/* Standard SSO PageHeader */}
      <PageHeader
        title="Master Biaya, Jalur, Tarif & Beasiswa"
        description="Pengelolaan komponen biaya, jalur kelas, tarif angkatan, master beasiswa, tipe tagihan & penerima beasiswa."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/sikeu" className="btn btn-secondary">
              <ArrowLeft size={16} /> Kembali ke SIKEU
            </Link>
            {/* Filter Button — semua tab */}
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setShowFilter(true)}
            >
              Filter
              {(filterType !== 'all' || filterSource !== 'all' || filterStatus !== 'all') && (
                <span className="ml-1 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-primary-600 text-white rounded-full">
                  !
                </span>
              )}
            </Button>
            {activeTab === 'jenis-biaya' && (
              <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={() => {
                  setEditingJenisBiaya(null);
                  setJenisBiayaForm({ kode: '', nama: '', tipe: 'ukt', nominal_standar: 0, deskripsi: '' });
                  setIsJenisBiayaModalOpen(true);
                }}
              >
                Tambah Komponen Biaya
              </Button>
            )}
            {activeTab === 'jalur-kelas' && (
              <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={() => {
                  setJalurForm({ nama_jalur: '', deskripsi: '' });
                  setIsJalurModalOpen(true);
                }}
              >
                Tambah Jalur Kelas Baru
              </Button>
            )}
            {activeTab === 'tarif' && (
              <>
                <Button
                  variant="secondary"
                  icon={<Plus size={16} />}
                  onClick={() => setIsAddAngkatanOpen(true)}
                >
                  Tambah Angkatan
                </Button>
                <Button
                  variant="primary"
                  icon={<Plus size={16} />}
                  onClick={() => {
                    setEditingTarif(null);
                    setTarifForm({ jenis_biaya_id: 1, tahun_angkatan: selectedAngkatan, jalur_kelas: selectedJalur, kelompok_ukt: 1, prodi: 'Teknik Informatika', nama_kelompok: 'SPP Semester Teknik Informatika', program_studi_id: 0, nominal: 3500000 });
                    setIsTarifModalOpen(true);
                  }}
                >
                  Atur Nominal Tarif
                </Button>
              </>
            )}
            {activeTab === 'beasiswa' && (
              <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={() => {
                  setEditingBeasiswa(null);
                  setBeasiswaForm({ kode: '', nama: '', sumber: 'internal', tipe_potongan: 'persen', nilai_potongan: 100, jenis_biaya_id: 0, berlaku_angkatan_mulai: 2023, berlaku_angkatan_sampai: 2027, deskripsi: '' });
                  setIsBeasiswaModalOpen(true);
                }}
              >
                Tambah Master Beasiswa
              </Button>
            )}
            {activeTab === 'student-types' && (
              <Button
                variant="primary"
                icon={<UserPlus size={16} />}
                onClick={() => {
                  setEditingStudentType(null);
                  setStudentTypeForm({ mahasiswa_id: 105, nim: '2025010088', nama_mahasiswa: 'Mahasiswa Baru', tahun_angkatan: 2025, jalur_kelas: 'Reguler', kelompok_ukt: 3, beasiswa_id: 0, catatan_perubahan: 'Pendaftaran baru via SPMB' });
                  setIsStudentTypeModalOpen(true);
                }}
              >
                Penetapan Tipe Baru
              </Button>
            )}
            {activeTab === 'mapping-beasiswa' && (
              <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={() => {
                  setAssignSearchQuery('');
                  if (studentTypesList.length > 0) {
                    setAssignForm({ ...assignForm, mahasiswa_id: studentTypesList[0].mahasiswa_id });
                  }
                  setIsAssignBeasiswaModalOpen(true);
                }}
              >
                Tetapkan Mahasiswa Penerima
              </Button>
            )}
            {activeTab === 'unit-kas-master' && (
              <Button
                variant="primary"
                icon={<Building size={16} />}
                onClick={() => {
                  setEditingUnitKas(null);
                  setUnitKasForm({ id: 0, nama_kas: '', bank_name: 'BNI', bank_account_number: '', bank_account_name: '', status: true, deskripsi: '' });
                  setIsUnitKasModalOpen(true);
                }}
              >
                Tambah Unit Kas Baru
              </Button>
            )}
          </div>
        }
      />

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

      {/* Standard Tab Navigation */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-200 pb-3 no-scrollbar">
        {[
          { id: 'jenis-biaya', label: '1. Komponen Biaya Dasar', icon: <Layers size={15} /> },
          { id: 'jalur-kelas', label: '2. Jalur & Kelas', icon: <Calendar size={15} /> },
          { id: 'tarif', label: '3. Nominal Tarif UKT', icon: <Wallet size={15} /> },
          { id: 'beasiswa', label: '4. Master Beasiswa', icon: <Award size={15} /> },
          { id: 'student-types', label: '5. Tipe Pendaftaran Mhs', icon: <UserPlus size={15} /> },
          { id: 'mapping-beasiswa', label: '6. Penerima Beasiswa', icon: <UserCheck size={15} /> },
          { id: 'unit-kas-master', label: '7. Unit Kas Master', icon: <Building size={15} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-primary-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 1. TAB JENIS BIAYA */}
      {activeTab === 'jenis-biaya' && (
        <Card>
          <CardHeader>
            <div>
              <h2 className="font-bold text-slate-900">Komponen Biaya Dasar</h2>
              <p className="text-xs text-slate-500">Master data komponen biaya yang dapat ditagihkan.</p>
            </div>
            <Badge variant="blue">{filteredJenisBiaya.length} Komponen</Badge>
          </CardHeader>

          {/* Search Bar */}
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari kode atau nama komponen biaya..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-sm pl-9 pr-8 text-xs w-full bg-white"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={13} />
                </button>
              )}
            </div>
            <span className="text-xs text-slate-500 font-medium">{filteredJenisBiaya.length} Komponen</span>
          </div>

          <CardBody className="p-0">
            {filteredJenisBiaya.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <Search size={22} />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Komponen Biaya Tidak Ditemukan</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Tidak ada komponen biaya yang cocok dengan kriteria filter yang diterapkan.
                </p>
              </div>
            ) : (
              <div className="table-container border-0 rounded-none">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Kode</th>
                      <th>Nama Komponen</th>
                      <th>Tipe</th>
                      <th>Nominal Standar</th>
                      <th>Status</th>
                      <th className="text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJenisBiaya.map((j) => (
                      <tr key={j.id}>
                        <td className="font-mono font-bold">{j.kode}</td>
                        <td className="font-semibold text-slate-900">{j.nama}</td>
                        <td>
                          <Badge variant="gray">{j.tipe?.toUpperCase()}</Badge>
                        </td>
                        <td className="font-mono font-bold text-slate-700">{formatRupiah(j.nominal_standar)}</td>
                        <td>
                          <Badge variant={j.is_active ? 'green' : 'red'} dot>
                            {j.is_active ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                        </td>
                        <td className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              icon={<Edit size={14} />}
                              onClick={() => {
                                setEditingJenisBiaya(j);
                                setJenisBiayaForm({ kode: j.kode, nama: j.nama, tipe: j.tipe, nominal_standar: j.nominal_standar, deskripsi: j.deskripsi || '' });
                                setIsJenisBiayaModalOpen(true);
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* 2. TAB JALUR KELAS */}
      {activeTab === 'jalur-kelas' && (
        <Card>
          <CardHeader>
            <div>
              <h2 className="font-bold text-slate-900">Jalur &amp; Kelas Pendaftaran</h2>
              <p className="text-xs text-slate-500">Daftar jalur masuk dan kelas yang mempengaruhi tarif.</p>
            </div>
            <Badge variant="blue">{filteredJalurKelas.length} Jalur</Badge>
          </CardHeader>

          {/* Search Bar */}
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama jalur kelas atau deskripsi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-sm pl-9 pr-8 text-xs w-full bg-white"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={13} />
                </button>
              )}
            </div>
            <span className="text-xs text-slate-500 font-medium">{filteredJalurKelas.length} Jalur</span>
          </div>

          <CardBody>
            {filteredJalurKelas.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <Search size={22} />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Jalur Kelas Tidak Ditemukan</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Tidak ada jalur kelas yang sesuai dengan kata kunci &ldquo;{searchTerm}&rdquo;.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredJalurKelas.map((j) => (
                  <div key={j.id} className="p-4 rounded-xl border border-slate-200 bg-white hover:border-primary-300 hover:shadow-xs transition-all flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{j.nama_jalur}</h3>
                      <p className="text-xs text-slate-500 mt-1">{j.deskripsi || '-'}</p>
                    </div>
                    <div className="flex justify-end gap-1.5 mt-4 pt-3 border-t border-slate-100">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Edit size={14} />}
                        onClick={() => {
                          setEditingJalurItem(j);
                          setEditJalurForm({ nama_jalur: j.nama_jalur, deskripsi: j.deskripsi || '' });
                          setIsEditJalurModalOpen(true);
                        }}
                      />
                      <Button
                        variant="outline-danger"
                        size="sm"
                        icon={<Trash2 size={14} />}
                        onClick={() => {
                          setDeletingJalurItem(j);
                          setConfirmDeleteChecklist(false);
                          setIsDeleteJalurModalOpen(true);
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* 3. TAB TARIF */}
      {activeTab === 'tarif' && (
        <Card>
          <CardHeader>
            <div>
              <h2 className="font-bold text-slate-900">Nominal Tarif Angkatan</h2>
              <p className="text-xs text-slate-500">Penetapan nominal spesifik per prodi, jalur, dan angkatan.</p>
            </div>
            <Badge variant="indigo">Angkatan {selectedAngkatan}</Badge>
          </CardHeader>

          {/* Search Bar — Filter Angkatan & Jalur via Drawer */}
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Saring nama kelompok / prodi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-sm pl-8 pr-7 text-xs w-full bg-white"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={12} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-medium">Angkatan {selectedAngkatan} · {selectedJalur}</span>
              <span className="text-xs text-slate-500 font-medium">{filteredTarif.length} Tarif</span>
            </div>
          </div>

          <CardBody className="p-0">
            {filteredTarif.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <Search size={22} />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Tarif Tidak Ditemukan</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Belum ada tarif yang dikonfigurasi untuk Angkatan {selectedAngkatan} &amp; Jalur {selectedJalur}.
                </p>
              </div>
            ) : (
              <div className="table-container border-0 rounded-none">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Komponen / Kelompok</th>
                      <th>Program Studi</th>
                      <th className="text-right">Nominal</th>
                      <th className="text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTarif.map((t) => (
                      <tr key={t.id}>
                        <td>
                          <div className="font-bold text-slate-900">{t.nama_kelompok}</div>
                          <div className="text-[10px] text-slate-500">{t.jenis_biaya?.nama}</div>
                        </td>
                        <td className="font-semibold text-slate-700">{t.prodi || 'Semua Prodi'}</td>
                        <td className="text-right font-mono font-bold text-slate-900">{formatRupiah(t.nominal)}</td>
                        <td className="text-right">
                          <div className="flex justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              icon={<Edit size={14} />}
                              onClick={() => {
                                setEditingTarif(t);
                                setTarifForm({
                                  jenis_biaya_id: t.jenis_biaya_id || 1,
                                  tahun_angkatan: selectedAngkatan,
                                  jalur_kelas: selectedJalur,
                                  kelompok_ukt: 1,
                                  nama_kelompok: t.nama_kelompok,
                                  program_studi_id: 0,
                                  nominal: t.nominal,
                                  prodi: t.prodi || 'Semua Prodi'
                                });
                                setIsTarifModalOpen(true);
                              }}
                            />
                            <Button
                              variant="outline-danger"
                              size="sm"
                              icon={<Trash2 size={14} />}
                              onClick={() => handleDeleteTarif(t.id)}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* 4. TAB BEASISWA */}
      {activeTab === 'beasiswa' && (
        <Card>
          <CardHeader>
            <div>
              <h2 className="font-bold text-slate-900">Master Data Beasiswa</h2>
              <p className="text-xs text-slate-500">Program beasiswa internal dan eksternal yang tersedia.</p>
            </div>
            <Badge variant="blue">{filteredBeasiswa.length} Program</Badge>
          </CardHeader>

          {/* Search Bar */}
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari program beasiswa atau kode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-sm pl-9 pr-8 text-xs w-full bg-white"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={13} />
                </button>
              )}
            </div>
            <span className="text-xs text-slate-500 font-medium">{filteredBeasiswa.length} Program</span>
          </div>

          <CardBody>
            {filteredBeasiswa.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <Search size={22} />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Beasiswa Tidak Ditemukan</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Tidak ada data beasiswa yang sesuai dengan filter pencarian Anda.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredBeasiswa.map((b) => (
                  <div key={b.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">{b.kode}</span>
                        <h3 className="font-bold text-slate-900 text-sm mt-1">{b.nama}</h3>
                      </div>
                      <Badge variant={b.sumber === 'pemerintah' ? 'indigo' : 'gray'}>
                        {b.sumber?.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="space-y-1 mt-3 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span>Potongan:</span>
                        <span className="font-bold text-emerald-600">{b.tipe_potongan === 'persen' ? `${b.nilai_potongan}%` : formatRupiah(b.nilai_potongan)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cakupan:</span>
                        <span className="font-semibold">{b.jenis_biaya ? b.jenis_biaya.nama : 'Semua Tagihan'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Berlaku Angkatan:</span>
                        <span className="font-mono font-bold">{b.berlaku_angkatan_mulai} - {b.berlaku_angkatan_sampai}</span>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Edit size={14} />}
                        onClick={() => {
                          setEditingBeasiswa(b);
                          setBeasiswaForm({
                            kode: b.kode,
                            nama: b.nama,
                            sumber: b.sumber || 'internal',
                            tipe_potongan: b.tipe_potongan || 'persen',
                            nilai_potongan: b.nilai_potongan,
                            jenis_biaya_id: b.jenis_biaya_id || 0,
                            berlaku_angkatan_mulai: b.berlaku_angkatan_mulai,
                            berlaku_angkatan_sampai: b.berlaku_angkatan_sampai,
                            deskripsi: b.deskripsi || ''
                          });
                          setIsBeasiswaModalOpen(true);
                        }}
                      >
                        Edit Detail
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* 5. TAB STUDENT TYPES */}
      {activeTab === 'student-types' && (
        <Card>
          <CardHeader>
            <div>
              <h2 className="font-bold text-slate-900">Tipe Pendaftaran Mahasiswa</h2>
              <p className="text-xs text-slate-500">Penetapan jalur masuk dan kelompok UKT per mahasiswa.</p>
            </div>
            <Badge variant="blue">{filteredStudentTypes.length} Mahasiswa</Badge>
          </CardHeader>

          {/* Search Bar */}
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama mahasiswa atau NIM..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-sm pl-9 pr-8 text-xs w-full bg-white"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={13} />
                </button>
              )}
            </div>
            <span className="text-xs text-slate-500 font-medium">{filteredStudentTypes.length} Mahasiswa</span>
          </div>

          <CardBody className="p-0">
            {filteredStudentTypes.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <Search size={22} />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Mahasiswa Tidak Ditemukan</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Tidak ada penetapan tipe pendaftaran mahasiswa yang cocok dengan pencarian.
                </p>
              </div>
            ) : (
              <div className="table-container border-0 rounded-none">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Mahasiswa</th>
                      <th>Tahun/Jalur</th>
                      <th>Kelompok UKT</th>
                      <th>Beasiswa Terkait</th>
                      <th className="text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudentTypes.map((s) => (
                      <tr key={s.id}>
                        <td>
                          <div className="font-bold text-slate-900">{s.nama_mahasiswa}</div>
                          <div className="font-mono text-xs text-slate-500">{s.nim}</div>
                        </td>
                        <td>
                          <div className="font-bold text-slate-700">{s.tahun_angkatan}</div>
                          <Badge variant="gray" className="mt-0.5">{s.jalur_kelas}</Badge>
                        </td>
                        <td>
                          <div className="font-semibold text-slate-800">{getLevelText(s.kelompok_ukt)}</div>
                        </td>
                        <td>
                          {s.beasiswa_id ? (
                            <Badge variant="green">Beasiswa Diterapkan</Badge>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>
                        <td className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingStudentType(s);
                              setStudentTypeForm({
                                mahasiswa_id: s.mahasiswa_id,
                                nim: s.nim,
                                nama_mahasiswa: s.nama_mahasiswa,
                                tahun_angkatan: s.tahun_angkatan,
                                jalur_kelas: s.jalur_kelas,
                                kelompok_ukt: s.kelompok_ukt,
                                beasiswa_id: s.beasiswa_id || 0,
                                catatan_perubahan: 'Penyesuaian administratif'
                              });
                              setIsStudentTypeModalOpen(true);
                            }}
                          >
                            Ubah Tipe
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* 6. TAB MAPPING BEASISWA */}
      {activeTab === 'mapping-beasiswa' && (
        <Card>
          <CardHeader>
            <div>
              <h2 className="font-bold text-slate-900">Mahasiswa Penerima Beasiswa</h2>
              <p className="text-xs text-slate-500">Daftar mahasiswa yang sedang menerima beasiswa/potongan aktif.</p>
            </div>
            <Badge variant="green">{filteredMahasiswaBeasiswa.length} Penerima</Badge>
          </CardHeader>

          {/* Search Bar */}
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari penerima, NIM, atau program beasiswa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-sm pl-9 pr-8 text-xs w-full bg-white"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={13} />
                </button>
              )}
            </div>
            <span className="text-xs text-slate-500 font-medium">{filteredMahasiswaBeasiswa.length} Penerima</span>
          </div>

          <CardBody className="p-0">
            {filteredMahasiswaBeasiswa.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <Search size={22} />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Penerima Beasiswa Tidak Ditemukan</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Tidak ada mahasiswa penerima beasiswa yang cocok dengan kriteria filter saat ini.
                </p>
              </div>
            ) : (
              <div className="table-container border-0 rounded-none">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Mahasiswa</th>
                      <th>Program Beasiswa</th>
                      <th>Nilai Potongan</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMahasiswaBeasiswa.map((m) => (
                      <tr key={m.id}>
                        <td>
                          <div className="font-bold text-slate-900">{m.nama_mahasiswa}</div>
                          <div className="font-mono text-xs text-slate-500">{m.nim}</div>
                        </td>
                        <td className="font-semibold text-slate-700">{m.nama_beasiswa}</td>
                        <td className="font-bold text-emerald-600">{m.potongan_text}</td>
                        <td>
                          <Badge variant={m.status === 'aktif' ? 'green' : 'red'} dot>
                            {m.status?.toUpperCase()}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* 7. TAB MASTER UNIT KAS */}
      {activeTab === 'unit-kas-master' && (
        <Card>
          <CardHeader>
            <div>
              <h2 className="font-bold text-slate-900">Master Data Unit Kas &amp; Multi-Rekening</h2>
              <p className="text-xs text-slate-500">Pengelolaan unit pemegang Petty Cash beserta data rekening tujuan pencairan dana.</p>
            </div>
            <Badge variant="blue">{filteredUnitKas.length} Unit Terdaftar</Badge>
          </CardHeader>

          {/* Search Bar */}
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari unit kas, bank, atau no. rekening..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-sm pl-9 pr-8 text-xs w-full bg-white"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={13} />
                </button>
              )}
            </div>
            <span className="text-xs text-slate-500 font-medium">{filteredUnitKas.length} Unit Terdaftar</span>
          </div>

          <CardBody>
            {filteredUnitKas.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <Search size={22} />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Unit Kas Tidak Ditemukan</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Tidak ada data unit kas yang sesuai dengan kata kunci pencarian.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUnitKas.map((u) => (
                  <div key={u.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className={`absolute top-0 left-0 w-1 h-full ${u.status ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                    <div className="flex justify-between items-start mb-2 pl-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${u.status ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          <Building size={16} />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm leading-tight">{u.nama_kas}</h3>
                          <Badge variant={u.status ? 'green' : 'red'} dot className="mt-0.5">
                            {u.status ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Edit size={14} />}
                          onClick={() => {
                            setEditingUnitKas(u);
                            setUnitKasForm({
                              id: u.id,
                              nama_kas: u.nama_kas,
                              bank_name: u.bank_name || 'BNI',
                              bank_account_number: u.bank_account_number || '',
                              bank_account_name: u.bank_account_name || '',
                              status: u.status,
                              deskripsi: u.deskripsi || ''
                            });
                            setIsUnitKasModalOpen(true);
                          }}
                        />
                        <Button
                          variant="outline-danger"
                          size="sm"
                          icon={<Trash2 size={14} />}
                          onClick={() => handleDeleteUnitKas(u.id)}
                        />
                      </div>
                    </div>
                    
                    <div className="pl-2 space-y-1.5 mt-3 text-xs">
                      <div className="flex justify-between items-center text-slate-500">
                        <span>Bank</span>
                        <span className="font-bold text-slate-700">{u.bank_name || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-500">
                        <span>No. Rekening</span>
                        <span className="font-mono font-bold text-slate-700">{u.bank_account_number || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-500">
                        <span>Atas Nama</span>
                        <span className="font-bold text-slate-700">{u.bank_account_name || '-'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* MODAL TAMBAH JALUR KELAS BARU */}
      <Modal
        open={isJalurModalOpen}
        onClose={() => setIsJalurModalOpen(false)}
        title="Tambah Jalur Kelas Baru"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsJalurModalOpen(false)}>Batal</Button>
            <Button variant="primary" onClick={handleSaveJalurKelas}>Simpan Jalur Kelas</Button>
          </>
        }
      >
        <form onSubmit={handleSaveJalurKelas} className="space-y-4">
          <Input
            label="Nama Jalur / Kelas Mahasiswa"
            required
            value={jalurForm.nama_jalur}
            onChange={(e) => setJalurForm({ ...jalurForm, nama_jalur: e.target.value })}
            placeholder="Misal: Reguler, Karyawan, Internasional..."
          />
          <Textarea
            label="Deskripsi / Keterangan"
            rows={3}
            value={jalurForm.deskripsi}
            onChange={(e) => setJalurForm({ ...jalurForm, deskripsi: e.target.value })}
            placeholder="Keterangan jalur penerimaan atau kelas..."
          />
        </form>
      </Modal>

      {/* MODAL EDIT JALUR KELAS */}
      <Modal
        open={isEditJalurModalOpen && !!editingJalurItem}
        onClose={() => setIsEditJalurModalOpen(false)}
        title="Edit Jalur Kelas"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsEditJalurModalOpen(false)}>Batal</Button>
            <Button variant="primary" onClick={handleUpdateJalurKelas}>Simpan Perubahan</Button>
          </>
        }
      >
        <form onSubmit={handleUpdateJalurKelas} className="space-y-4">
          <Input
            label="Nama Jalur / Kelas Mahasiswa"
            required
            value={editJalurForm.nama_jalur}
            onChange={(e) => setEditJalurForm({ ...editJalurForm, nama_jalur: e.target.value })}
          />
          <Textarea
            label="Deskripsi / Keterangan"
            rows={3}
            value={editJalurForm.deskripsi}
            onChange={(e) => setEditJalurForm({ ...editJalurForm, deskripsi: e.target.value })}
          />
        </form>
      </Modal>

      {/* MODAL HAPUS JALUR KELAS */}
      <Modal
        open={isDeleteJalurModalOpen && !!deletingJalurItem}
        onClose={() => setIsDeleteJalurModalOpen(false)}
        title="Peringatan Hapus Jalur Kelas"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsDeleteJalurModalOpen(false)}>Batal</Button>
            <Button
              variant="danger"
              disabled={!confirmDeleteChecklist}
              onClick={handleDeleteJalurKelas}
            >
              Hapus Permanen
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-sm space-y-1">
            <div className="font-bold text-base">Jalur Kelas: {deletingJalurItem?.nama_jalur}</div>
            <p className="text-xs text-rose-700">
              Penghapusan jalur kelas ini dapat mempengaruhi kelompok tarif mahasiswa yang menggunakan jalur kelas tersebut.
            </p>
          </div>
          <label className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              id="chkConfirmDelete"
              checked={confirmDeleteChecklist}
              onChange={(e) => setConfirmDeleteChecklist(e.target.checked)}
              className="checkbox checkbox-sm checkbox-error mt-0.5"
            />
            <span className="text-xs font-semibold text-slate-800">
              Saya yakin dan paham akibat dari menghapus jalur kelas &ldquo;{deletingJalurItem?.nama_jalur}&rdquo;.
            </span>
          </label>
        </div>
      </Modal>

      {/* MODAL UBAH / PENETAPAN TIPE TAGIHAN MAHASISWA */}
      <Modal
        open={isStudentTypeModalOpen}
        onClose={() => setIsStudentTypeModalOpen(false)}
        title={editingStudentType ? 'Ubah Tipe Tagihan & Jalur Mahasiswa' : 'Penetapan Tipe Tagihan Baru'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsStudentTypeModalOpen(false)}>Batal</Button>
            <Button variant="primary" disabled={loading} onClick={handleSaveStudentType}>Simpan Perubahan</Button>
          </>
        }
      >
        <form onSubmit={handleSaveStudentType} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="NIM / ID Mahasiswa"
              required
              readOnly={!!editingStudentType}
              value={studentTypeForm.nim || studentTypeForm.mahasiswa_id}
              onChange={(e) => setStudentTypeForm({ ...studentTypeForm, nim: e.target.value })}
            />
            <Input
              label="Nama Mahasiswa"
              required
              readOnly={!!editingStudentType}
              value={studentTypeForm.nama_mahasiswa}
              onChange={(e) => setStudentTypeForm({ ...studentTypeForm, nama_mahasiswa: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Jalur / Kelas Baru <span className="required">*</span></label>
              <select
                value={studentTypeForm.jalur_kelas}
                onChange={(e) => setStudentTypeForm({ ...studentTypeForm, jalur_kelas: e.target.value })}
                className="select w-full"
              >
                {jalurKelasList.map((j) => (
                  <option key={j.id} value={j.nama_jalur}>{j.nama_jalur}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Kelompok UKT <span className="required">*</span></label>
              <select
                value={studentTypeForm.kelompok_ukt}
                onChange={(e) => setStudentTypeForm({ ...studentTypeForm, kelompok_ukt: Number(e.target.value) })}
                className="select w-full"
              >
                <option value={1}>Level 1 (Subsidi Penuh)</option>
                <option value={2}>Level 2 (Subsidi Parsial)</option>
                <option value={3}>Level 3 (Reguler / Standar)</option>
                <option value={4}>Level 4 (Mandiri)</option>
                <option value={5}>Level 5 (Eksekutif / Khusus)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Program Beasiswa (Opsional)</label>
            <select
              value={studentTypeForm.beasiswa_id}
              onChange={(e) => setStudentTypeForm({ ...studentTypeForm, beasiswa_id: Number(e.target.value) })}
              className="select w-full"
            >
              <option value={0}>-- Tanpa Beasiswa --</option>
              {beasiswaList.map((b) => (
                <option key={b.id} value={b.id}>[{b.kode}] {b.nama}</option>
              ))}
            </select>
          </div>

          <Textarea
            label="Catatan Alasan Perubahan"
            required
            rows={3}
            placeholder="Misal: Pindah dari kelas reguler ke kelas karyawan per semester 3..."
            value={studentTypeForm.catatan_perubahan}
            onChange={(e) => setStudentTypeForm({ ...studentTypeForm, catatan_perubahan: e.target.value })}
          />
        </form>
      </Modal>

      {/* MODAL TAMBAH ANGKATAN BARU */}
      <Modal
        open={isAddAngkatanOpen}
        onClose={() => setIsAddAngkatanOpen(false)}
        title="Tambah Angkatan Baru"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsAddAngkatanOpen(false)}>Batal</Button>
            <Button variant="primary" onClick={handleAddAngkatan}>Simpan Angkatan</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Tahun Angkatan Baru"
            required
            type="number"
            value={newAngkatanYear}
            onChange={(e) => setNewAngkatanYear(Number(e.target.value))}
            min={2000}
            max={2100}
          />
        </div>
      </Modal>

      {/* MODAL ATUR / EDIT NOMINAL TARIF UKT */}
      <Modal
        open={isTarifModalOpen}
        onClose={() => setIsTarifModalOpen(false)}
        title={editingTarif ? 'Edit Tarif UKT' : 'Atur Nominal Tarif UKT'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsTarifModalOpen(false)}>Batal</Button>
            <Button variant="primary" disabled={loading} onClick={handleSaveTarif}>
              {editingTarif ? 'Simpan Pembaruan Tarif' : 'Simpan Tarif'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveTarif} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Tahun Angkatan</label>
              <select
                value={tarifForm.tahun_angkatan}
                onChange={(e) => setTarifForm({ ...tarifForm, tahun_angkatan: Number(e.target.value) })}
                className="select w-full"
              >
                {availableAngkatan.map((a) => (
                  <option key={a} value={a}>Angkatan {a}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Jalur / Kelas</label>
              <select
                value={tarifForm.jalur_kelas}
                onChange={(e) => setTarifForm({ ...tarifForm, jalur_kelas: e.target.value })}
                className="select w-full"
              >
                {jalurKelasList.map((j) => (
                  <option key={j.id} value={j.nama_jalur}>{j.nama_jalur}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Program Studi <span className="required">*</span></label>
              <select
                value={tarifForm.prodi}
                onChange={(e) => setTarifForm({ ...tarifForm, prodi: e.target.value })}
                className="select w-full"
              >
                <option value="Teknik Informatika">Teknik Informatika</option>
                <option value="Sistem Informasi">Sistem Informasi</option>
                <option value="Manajemen Informatika">Manajemen Informatika</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Kelompok UKT</label>
              <select
                value={tarifForm.kelompok_ukt}
                onChange={(e) => setTarifForm({ ...tarifForm, kelompok_ukt: Number(e.target.value) })}
                className="select w-full"
              >
                <option value={1}>Kelompok 1 (Subsidi Penuh)</option>
                <option value={2}>Kelompok 2 (Subsidi Parsial)</option>
                <option value={3}>Kelompok 3 (Reguler / Standar)</option>
                <option value={4}>Kelompok 4 (Mandiri)</option>
                <option value={5}>Kelompok 5 (Eksekutif / Khusus)</option>
              </select>
            </div>
          </div>

          <Input
            label="Peruntukan / Label Tarif"
            required
            placeholder="Contoh: SPP Semester Teknik Informatika"
            value={tarifForm.nama_kelompok}
            onChange={(e) => setTarifForm({ ...tarifForm, nama_kelompok: e.target.value })}
          />

          <div className="form-group">
            <label className="form-label">Komponen Biaya <span className="required">*</span></label>
            <select
              value={tarifForm.jenis_biaya_id}
              onChange={(e) => setTarifForm({ ...tarifForm, jenis_biaya_id: Number(e.target.value) })}
              className="select w-full"
            >
              {jenisBiayaList.map((j) => (
                <option key={j.id} value={j.id}>{j.nama}</option>
              ))}
            </select>
          </div>

          <Input
            label="Nominal Tarif (Rp)"
            required
            type="number"
            value={tarifForm.nominal}
            onChange={(e) => setTarifForm({ ...tarifForm, nominal: Number(e.target.value) })}
          />
        </form>
      </Modal>

      {/* MODAL KOMPONEN JENIS BIAYA */}
      <Modal
        open={isJenisBiayaModalOpen}
        onClose={() => setIsJenisBiayaModalOpen(false)}
        title={editingJenisBiaya ? 'Edit Komponen Biaya' : 'Tambah Komponen Biaya'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsJenisBiayaModalOpen(false)}>Batal</Button>
            <Button variant="primary" onClick={handleSaveJenisBiaya}>Simpan Komponen Biaya</Button>
          </>
        }
      >
        <form onSubmit={handleSaveJenisBiaya} className="space-y-4">
          <Input
            label="Kode Komponen"
            required
            readOnly={!!editingJenisBiaya}
            placeholder="Misal: UKT_SEMESTER / PRAKTIKUM"
            value={jenisBiayaForm.kode}
            onChange={(e) => setJenisBiayaForm({ ...jenisBiayaForm, kode: e.target.value.toUpperCase() })}
            hint="Gunakan huruf kapital atau garis bawah"
          />

          <Input
            label="Nama Komponen Biaya"
            required
            placeholder="Misal: Biaya Laboratorium & Praktikum"
            value={jenisBiayaForm.nama}
            onChange={(e) => setJenisBiayaForm({ ...jenisBiayaForm, nama: e.target.value })}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Tipe Komponen <span className="required">*</span></label>
              <select
                value={jenisBiayaForm.tipe}
                onChange={(e) => setJenisBiayaForm({ ...jenisBiayaForm, tipe: e.target.value })}
                className="select w-full"
              >
                <option value="ukt">UKT</option>
                <option value="spp">SPP</option>
                <option value="praktikum">Praktikum</option>
                <option value="wisuda">Wisuda</option>
                <option value="spmb_adm">SPMB</option>
                <option value="lainnya">Lainnya / Gedung</option>
              </select>
            </div>
            <Input
              label="Nominal Standar (Rp)"
              type="number"
              value={jenisBiayaForm.nominal_standar}
              onChange={(e) => setJenisBiayaForm({ ...jenisBiayaForm, nominal_standar: Number(e.target.value) })}
            />
          </div>

          <Textarea
            label="Deskripsi Peruntukan"
            rows={3}
            placeholder="Tuliskan keterangan peruntukan biaya..."
            value={jenisBiayaForm.deskripsi}
            onChange={(e) => setJenisBiayaForm({ ...jenisBiayaForm, deskripsi: e.target.value })}
          />
        </form>
      </Modal>

      {/* MODAL MASTER BEASISWA */}
      <Modal
        open={isBeasiswaModalOpen}
        onClose={() => setIsBeasiswaModalOpen(false)}
        title={editingBeasiswa ? 'Edit Program Beasiswa' : 'Tambah Master Beasiswa'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsBeasiswaModalOpen(false)}>Batal</Button>
            <Button variant="primary" onClick={handleSaveBeasiswa}>Simpan Master Beasiswa</Button>
          </>
        }
      >
        <form onSubmit={handleSaveBeasiswa} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Kode Beasiswa"
              required
              readOnly={!!editingBeasiswa}
              placeholder="Misal: KIP_KULIAH"
              value={beasiswaForm.kode}
              onChange={(e) => setBeasiswaForm({ ...beasiswaForm, kode: e.target.value.toUpperCase() })}
            />
            <div className="form-group">
              <label className="form-label">Sumber Dana <span className="required">*</span></label>
              <select
                value={beasiswaForm.sumber}
                onChange={(e) => setBeasiswaForm({ ...beasiswaForm, sumber: e.target.value })}
                className="select w-full"
              >
                <option value="internal">Internal Kampus</option>
                <option value="pemerintah">Pemerintah (KIP-K)</option>
                <option value="eksternal">Eksternal / Sponsor</option>
              </select>
            </div>
          </div>

          <Input
            label="Nama Program Beasiswa"
            required
            placeholder="Misal: Beasiswa KIP Kuliah Pemerintah"
            value={beasiswaForm.nama}
            onChange={(e) => setBeasiswaForm({ ...beasiswaForm, nama: e.target.value })}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Tipe Potongan <span className="required">*</span></label>
              <select
                value={beasiswaForm.tipe_potongan}
                onChange={(e) => setBeasiswaForm({ ...beasiswaForm, tipe_potongan: e.target.value })}
                className="select w-full"
              >
                <option value="persen">Persentase (%)</option>
                <option value="nominal">Nominal Rupiah (Rp)</option>
              </select>
            </div>
            <Input
              label="Nilai Potongan"
              required
              type="number"
              value={beasiswaForm.nilai_potongan}
              onChange={(e) => setBeasiswaForm({ ...beasiswaForm, nilai_potongan: Number(e.target.value) })}
            />
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Filter size={14} className="text-primary-600" /> Target Scope Potongan Tagihan &amp; Angkatan:
            </div>

            <div className="form-group">
              <label className="form-label">Target Komponen Tagihan (Opsional)</label>
              <select
                value={beasiswaForm.jenis_biaya_id}
                onChange={(e) => setBeasiswaForm({ ...beasiswaForm, jenis_biaya_id: Number(e.target.value) })}
                className="select w-full bg-white"
              >
                <option value={0}>-- Berlaku untuk Semua Tagihan Pendidikan --</option>
                {jenisBiayaList.map((j) => (
                  <option key={j.id} value={j.id}>Khusus Komponen: {j.nama}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Angkatan Mulai"
                type="number"
                value={beasiswaForm.berlaku_angkatan_mulai}
                onChange={(e) => setBeasiswaForm({ ...beasiswaForm, berlaku_angkatan_mulai: Number(e.target.value) })}
              />
              <Input
                label="Angkatan Sampai"
                type="number"
                value={beasiswaForm.berlaku_angkatan_sampai}
                onChange={(e) => setBeasiswaForm({ ...beasiswaForm, berlaku_angkatan_sampai: Number(e.target.value) })}
              />
            </div>
          </div>

          <Textarea
            label="Deskripsi / SK Rektor"
            rows={3}
            placeholder="Keterangan peruntukan & persyaratannya..."
            value={beasiswaForm.deskripsi}
            onChange={(e) => setBeasiswaForm({ ...beasiswaForm, deskripsi: e.target.value })}
          />
        </form>
      </Modal>

      {/* MODAL PENETAPAN BEASISWA MAHASISWA */}
      <Modal
        open={isAssignBeasiswaModalOpen}
        onClose={() => setIsAssignBeasiswaModalOpen(false)}
        title="Tetapkan Penerima Beasiswa"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsAssignBeasiswaModalOpen(false)}>Batal</Button>
            <Button variant="primary" onClick={handleAssignBeasiswa}>Tetapkan Beasiswa</Button>
          </>
        }
      >
        <form onSubmit={handleAssignBeasiswa} className="space-y-4">
          <div>
            <label className="form-label block mb-1">Cari &amp; Pilih Mahasiswa <span className="required">*</span></label>
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ketik Nama atau NIM..."
                  value={assignSearchQuery}
                  onChange={(e) => {
                    setAssignSearchQuery(e.target.value);
                    fetchStudentTypes(1, e.target.value);
                  }}
                  className="input pl-9 text-xs"
                />
                <Search size={16} className="absolute left-3 top-3 text-slate-400" />
              </div>

              <select
                required
                value={assignForm.mahasiswa_id}
                onChange={(e) => setAssignForm({ ...assignForm, mahasiswa_id: Number(e.target.value) })}
                className="select w-full text-xs"
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

          <div className="form-group">
            <label className="form-label">Program Beasiswa <span className="required">*</span></label>
            <select
              value={assignForm.beasiswa_id}
              onChange={(e) => setAssignForm({ ...assignForm, beasiswa_id: Number(e.target.value) })}
              className="select w-full text-xs"
            >
              {beasiswaList.map((b) => (
                <option key={b.id} value={b.id}>[{b.kode}] {b.nama}</option>
              ))}
            </select>
          </div>
        </form>
      </Modal>

      {/* MODAL UNIT KAS */}
      <Modal
        open={isUnitKasModalOpen}
        onClose={() => setIsUnitKasModalOpen(false)}
        title={editingUnitKas ? 'Edit Unit Kas' : 'Tambah Unit Kas Baru'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsUnitKasModalOpen(false)}>Batal</Button>
            <Button variant="primary" onClick={handleSaveUnitKas}>Simpan Unit Kas</Button>
          </>
        }
      >
        <form onSubmit={handleSaveUnitKas} className="space-y-4">
          <Input
            label="Nama Unit Kas"
            required
            placeholder="Misal: Petty Cash Fakultas Teknik"
            value={unitKasForm.nama_kas}
            onChange={(e) => setUnitKasForm({ ...unitKasForm, nama_kas: e.target.value })}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Bank Transfer</label>
              <select
                className="select w-full"
                value={unitKasForm.bank_name}
                onChange={(e) => setUnitKasForm({ ...unitKasForm, bank_name: e.target.value })}
              >
                <option value="BNI">BNI</option>
                <option value="Mandiri">Mandiri</option>
                <option value="BRI">BRI</option>
                <option value="BCA">BCA</option>
                <option value="BSI">BSI</option>
              </select>
            </div>
            <Input
              label="No. Rekening"
              placeholder="Nomor rekening"
              value={unitKasForm.bank_account_number}
              onChange={(e) => setUnitKasForm({ ...unitKasForm, bank_account_number: e.target.value })}
            />
          </div>

          <Input
            label="Atas Nama Rekening"
            placeholder="Nama pemilik rekening"
            value={unitKasForm.bank_account_name}
            onChange={(e) => setUnitKasForm({ ...unitKasForm, bank_account_name: e.target.value })}
          />

          <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
            <input
              type="checkbox"
              id="statusUnitKas"
              checked={unitKasForm.status}
              onChange={(e) => setUnitKasForm({ ...unitKasForm, status: e.target.checked })}
              className="toggle toggle-success toggle-sm"
            />
            <span className="text-xs font-bold text-slate-800">Unit Aktif</span>
          </label>
        </form>
      </Modal>

      {/* ============================================================ */}
      {/* FILTER DRAWER — Muncul dari kanan saat tombol Filter diklik  */}
      {/* ============================================================ */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title={`Filter: ${
          activeTab === 'jenis-biaya' ? 'Komponen Biaya' :
          activeTab === 'jalur-kelas' ? 'Jalur & Kelas' :
          activeTab === 'tarif' ? 'Nominal Tarif Angkatan' :
          activeTab === 'beasiswa' ? 'Master Beasiswa' :
          activeTab === 'student-types' ? 'Tipe Pendaftaran' :
          activeTab === 'mapping-beasiswa' ? 'Penerima Beasiswa' :
          'Unit Kas Master'
        }`}
        width="360px"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setFilterType('all');
                setFilterSource('all');
                setFilterStatus('all');
                if (activeTab === 'tarif') {
                  setSelectedAngkatan(2025);
                  setSelectedJalur('Reguler');
                }
              }}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (activeTab === 'tarif') fetchTarif();
                setShowFilter(false);
              }}
            >
              Terapkan
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-5">

          {/* Filter: Tab Jenis Biaya */}
          {activeTab === 'jenis-biaya' && (
            <div className="form-group">
              <label className="form-label">Tipe Komponen Biaya</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="select w-full"
              >
                <option value="all">Semua Tipe</option>
                <option value="ukt">UKT</option>
                <option value="spp">SPP</option>
                <option value="praktikum">Praktikum</option>
                <option value="wisuda">Wisuda</option>
                <option value="spmb_adm">SPMB / Administrasi</option>
                <option value="lainnya">Lainnya / Gedung</option>
              </select>
              {filterType !== 'all' && (
                <p className="text-xs text-primary-600 font-semibold mt-1">
                  ✓ Filter aktif: <strong>{filterType.toUpperCase()}</strong>
                </p>
              )}
            </div>
          )}

          {/* Filter: Tab Tarif Angkatan */}
          {activeTab === 'tarif' && (
            <>
              <div className="form-group">
                <label className="form-label">Tahun Angkatan</label>
                <select
                  className="select w-full font-bold"
                  value={selectedAngkatan}
                  onChange={(e) => setSelectedAngkatan(Number(e.target.value))}
                >
                  {availableAngkatan.map((a) => (
                    <option key={a} value={a}>Angkatan {a}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Jalur Pendaftaran</label>
                <select
                  className="select w-full font-bold"
                  value={selectedJalur}
                  onChange={(e) => setSelectedJalur(e.target.value)}
                >
                  {jalurKelasList.map((j) => (
                    <option key={j.nama_jalur} value={j.nama_jalur}>{j.nama_jalur}</option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                <span className="font-semibold">Klik &quot;Terapkan&quot;</span> untuk memuat data tarif sesuai angkatan dan jalur yang dipilih.
              </div>
            </>
          )}

          {/* Filter: Tab Master Beasiswa */}
          {activeTab === 'beasiswa' && (
            <div className="form-group">
              <label className="form-label">Sumber Beasiswa</label>
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className="select w-full"
              >
                <option value="all">Semua Sumber</option>
                <option value="internal">Internal Kampus</option>
                <option value="pemerintah">Pemerintah (KIP-K)</option>
                <option value="eksternal">Eksternal / Swasta</option>
              </select>
              {filterSource !== 'all' && (
                <p className="text-xs text-primary-600 font-semibold mt-1">
                  ✓ Filter aktif: <strong>{filterSource}</strong>
                </p>
              )}
            </div>
          )}

          {/* Filter: Tab Mapping Beasiswa */}
          {activeTab === 'mapping-beasiswa' && (
            <div className="form-group">
              <label className="form-label">Status Beasiswa</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="select w-full"
              >
                <option value="all">Semua Status</option>
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
              {filterStatus !== 'all' && (
                <p className="text-xs text-primary-600 font-semibold mt-1">
                  ✓ Filter aktif: <strong>{filterStatus}</strong>
                </p>
              )}
            </div>
          )}

          {/* Filter: Tab Unit Kas Master */}
          {activeTab === 'unit-kas-master' && (
            <div className="form-group">
              <label className="form-label">Status Unit Kas</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="select w-full"
              >
                <option value="all">Semua Status</option>
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
              {filterStatus !== 'all' && (
                <p className="text-xs text-primary-600 font-semibold mt-1">
                  ✓ Filter aktif: <strong>{filterStatus}</strong>
                </p>
              )}
            </div>
          )}

          {/* Info: Tab tanpa filter tambahan */}
          {(activeTab === 'jalur-kelas' || activeTab === 'student-types') && (
            <div className="text-center py-8 text-slate-400">
              <Filter size={28} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold text-slate-600">Tidak ada filter tambahan</p>
              <p className="text-xs mt-1">Tab ini hanya mendukung pencarian teks di kolom search.</p>
            </div>
          )}

        </div>
      </Drawer>

    </div>
  );
}
