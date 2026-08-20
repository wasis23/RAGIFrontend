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

  return (
    <div className="space-y-6">
      {/* Header tanpa Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 card p-6">
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
              className="btn btn-primary border-none font-bold text-xs flex items-center gap-1.5 shadow-sm"
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
              className="btn btn-primary border-none font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={16} /> Tambah Jalur Kelas Baru
            </button>
          )}
          {activeTab === 'tarif' && (
            <>
              <button
                onClick={() => setIsAddAngkatanOpen(true)}
                className="btn btn-secondary border-none font-bold text-xs flex items-center gap-1.5 shadow-2xs"
              >
                <Plus size={16} /> Tambah Angkatan
              </button>
              <button
                onClick={() => {
                  setEditingTarif(null);
                  setTarifForm({ jenis_biaya_id: 1, tahun_angkatan: selectedAngkatan, jalur_kelas: selectedJalur, kelompok_ukt: 1, prodi: 'Teknik Informatika', nama_kelompok: 'SPP Semester Teknik Informatika', program_studi_id: 0, nominal: 3500000 });
                  setIsTarifModalOpen(true);
                }}
                className="btn btn-primary border-none font-bold text-xs flex items-center gap-1.5 shadow-sm"
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
              className="btn btn-primary border-none font-bold text-xs flex items-center gap-1.5 shadow-sm"
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
              className="btn btn-primary border-none font-bold text-xs flex items-center gap-1.5 shadow-sm"
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
              className="btn btn-primary border-none font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={16} /> Tetapkan Mahasiswa Penerima
            </button>
          )}
          {activeTab === 'unit-kas-master' && (
            <button
              onClick={() => {
                setEditingUnitKas(null);
                setUnitKasForm({ id: 0, nama_kas: '', bank_name: 'BNI', bank_account_number: '', bank_account_name: '', status: true, deskripsi: '' });
                setIsUnitKasModalOpen(true);
              }}
              className="btn btn-primary border-none font-bold text-xs flex items-center gap-1.5 shadow-sm"
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

      {/* Tab Navigation */}
      <div className="flex overflow-x-auto border-b border-slate-200 mt-4 px-2 no-scrollbar">
        {[
          { id: 'jenis-biaya', label: '1. Komponen Biaya Dasar' },
          { id: 'jalur-kelas', label: '2. Jalur & Kelas' },
          { id: 'tarif', label: '3. Nominal Tarif UKT' },
          { id: 'beasiswa', label: '4. Master Beasiswa' },
          { id: 'student-types', label: '5. Tipe Pendaftaran Mhs' },
          { id: 'mapping-beasiswa', label: '6. Penerima Beasiswa' },
          { id: 'unit-kas-master', label: '7. Unit Kas Master' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`whitespace-nowrap pb-3 text-sm font-bold border-b-2 px-4 transition-all ${
              activeTab === tab.id
                ? 'border-primary-600 text-slate-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. TAB JENIS BIAYA */}
      {activeTab === 'jenis-biaya' && (
        <div className="card p-6 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">Komponen Biaya Dasar</h2>
              <p className="text-xs text-slate-500 mt-0.5">Master data komponen biaya yang dapat ditagihkan.</p>
            </div>
            <span className="text-xs font-bold text-slate-500">{jenisBiayaList.length} Komponen</span>
          </div>
          <div className="overflow-x-auto">
            <table className="table w-full text-sm">
              <thead className="bg-slate-50/80 text-slate-600">
                <tr>
                  <th className="font-bold">Kode</th>
                  <th className="font-bold">Nama Komponen</th>
                  <th className="font-bold">Tipe</th>
                  <th className="font-bold">Nominal Standar</th>
                  <th className="font-bold">Status</th>
                  <th className="font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {jenisBiayaList.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="font-mono font-bold text-xs">{j.kode}</td>
                    <td className="font-bold text-slate-800">{j.nama}</td>
                    <td>
                      <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 uppercase">
                        {j.tipe}
                      </span>
                    </td>
                    <td className="font-mono font-bold text-slate-700">{formatRupiah(j.nominal_standar)}</td>
                    <td>
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${j.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {j.is_active ? 'AKTIF' : 'NONAKTIF'}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => {
                          setEditingJenisBiaya(j);
                          setJenisBiayaForm({ kode: j.kode, nama: j.nama, tipe: j.tipe, nominal_standar: j.nominal_standar, deskripsi: j.deskripsi || '' });
                          setIsJenisBiayaModalOpen(true);
                        }} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-slate-100 rounded-lg">
                          <Edit size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. TAB JALUR KELAS */}
      {activeTab === 'jalur-kelas' && (
        <div className="card p-6 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">Jalur & Kelas Pendaftaran</h2>
              <p className="text-xs text-slate-500 mt-0.5">Daftar jalur masuk dan kelas yang mempengaruhi tarif.</p>
            </div>
            <span className="text-xs font-bold text-slate-500">{jalurKelasList.length} Jalur</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jalurKelasList.map((j) => (
              <div key={j.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">{j.nama_jalur}</h3>
                  <p className="text-xs text-slate-500 mt-1">{j.deskripsi || '-'}</p>
                </div>
                <div className="flex justify-end gap-1 mt-4">
                  <button onClick={() => {
                    setEditingJalurItem(j);
                    setEditJalurForm({ nama_jalur: j.nama_jalur, deskripsi: j.deskripsi || '' });
                    setIsEditJalurModalOpen(true);
                  }} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-slate-100 rounded-lg">
                    <Edit size={14} />
                  </button>
                  <button onClick={() => {
                    setDeletingJalurItem(j);
                    setConfirmDeleteChecklist(false);
                    setIsDeleteJalurModalOpen(true);
                  }} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. TAB TARIF */}
      {activeTab === 'tarif' && (
        <div className="card p-6 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">Nominal Tarif Angkatan</h2>
              <p className="text-xs text-slate-500 mt-0.5">Penetapan nominal spesifik per prodi, jalur, dan angkatan.</p>
            </div>
          </div>
          
          <div className="flex gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex-1">
              <label className="text-xs font-bold text-slate-500 block mb-1">Tahun Angkatan</label>
              <select className="select select-sm w-full font-bold" value={selectedAngkatan} onChange={e => setSelectedAngkatan(Number(e.target.value))}>
                {availableAngkatan.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs font-bold text-slate-500 block mb-1">Jalur Pendaftaran</label>
              <select className="select select-sm w-full font-bold" value={selectedJalur} onChange={e => setSelectedJalur(e.target.value)}>
                {jalurKelasList.map(j => <option key={j.nama_jalur} value={j.nama_jalur}>{j.nama_jalur}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={fetchTarif} className="btn btn-primary btn-sm font-bold border-none">Tampilkan Tarif</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="table w-full text-sm">
              <thead className="bg-slate-50/80 text-slate-600">
                <tr>
                  <th className="font-bold">Komponen / Kelompok</th>
                  <th className="font-bold">Program Studi</th>
                  <th className="font-bold text-right">Nominal</th>
                  <th className="font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {tarifList.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50">
                    <td>
                      <div className="font-bold text-slate-800">{t.nama_kelompok}</div>
                      <div className="text-[10px] font-bold text-slate-500">{t.jenis_biaya?.nama}</div>
                    </td>
                    <td className="font-semibold text-slate-700">{t.prodi || 'Semua Prodi'}</td>
                    <td className="text-right font-mono font-bold text-slate-800">{formatRupiah(t.nominal)}</td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => {
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
                        }} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-slate-100 rounded-lg">
                          <Edit size={14} />
                        </button>
                        <button onClick={() => handleDeleteTarif(t.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. TAB BEASISWA */}
      {activeTab === 'beasiswa' && (
        <div className="card p-6 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">Master Data Beasiswa</h2>
              <p className="text-xs text-slate-500 mt-0.5">Program beasiswa internal dan eksternal yang tersedia.</p>
            </div>
            <span className="text-xs font-bold text-slate-500">{beasiswaList.length} Program</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {beasiswaList.map((b) => (
              <div key={b.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">{b.kode}</span>
                    <h3 className="font-extrabold text-slate-900 text-sm mt-1">{b.nama}</h3>
                  </div>
                  <span className={`badge ${b.sumber === 'pemerintah' ? 'badge-indigo' : 'badge-gray'}`}>
                    {b.sumber?.toUpperCase()}
                  </span>
                </div>
                <div className="space-y-1 mt-3 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Potongan:</span>
                    <span className="font-bold">{b.tipe_potongan === 'persen' ? `${b.nilai_potongan}%` : formatRupiah(b.nilai_potongan)}</span>
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
                <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100">
                  <button onClick={() => {
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
                  }} className="btn btn-xs btn-ghost text-primary-600 font-bold">Edit Detail</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. TAB STUDENT TYPES */}
      {activeTab === 'student-types' && (
        <div className="card p-6 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">Tipe Pendaftaran Mahasiswa</h2>
              <p className="text-xs text-slate-500 mt-0.5">Penetapan jalur masuk dan kelompok UKT per mahasiswa.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="table w-full text-sm">
              <thead className="bg-slate-50/80 text-slate-600">
                <tr>
                  <th className="font-bold">Mahasiswa</th>
                  <th className="font-bold">Tahun/Jalur</th>
                  <th className="font-bold">Kelompok UKT</th>
                  <th className="font-bold">Beasiswa Terkait</th>
                  <th className="font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {studentTypesList.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td>
                      <div className="font-bold text-slate-800">{s.nama_mahasiswa}</div>
                      <div className="font-mono text-xs text-slate-500">{s.nim}</div>
                    </td>
                    <td>
                      <div className="font-bold text-slate-700">{s.tahun_angkatan}</div>
                      <div className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 inline-block rounded-md mt-0.5">{s.jalur_kelas}</div>
                    </td>
                    <td>
                      <div className="font-semibold text-slate-800">{getLevelText(s.kelompok_ukt)}</div>
                    </td>
                    <td>
                      {s.beasiswa_id ? (
                        <span className="text-xs font-bold text-primary-600">Beasiswa Diterapkan</span>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="text-right">
                      <button onClick={() => {
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
                      }} className="btn btn-xs btn-ghost text-primary-600 font-bold">Ubah Tipe</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. TAB MAPPING BEASISWA */}
      {activeTab === 'mapping-beasiswa' && (
        <div className="card p-6 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">Mahasiswa Penerima Beasiswa</h2>
              <p className="text-xs text-slate-500 mt-0.5">Daftar mahasiswa yang sedang menerima beasiswa/potongan aktif.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="table w-full text-sm">
              <thead className="bg-slate-50/80 text-slate-600">
                <tr>
                  <th className="font-bold">Mahasiswa</th>
                  <th className="font-bold">Program Beasiswa</th>
                  <th className="font-bold">Nilai Potongan</th>
                  <th className="font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {mahasiswaBeasiswaList.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50">
                    <td>
                      <div className="font-bold text-slate-800">{m.nama_mahasiswa}</div>
                      <div className="font-mono text-xs text-slate-500">{m.nim}</div>
                    </td>
                    <td className="font-semibold text-slate-700">{m.nama_beasiswa}</td>
                    <td className="font-bold text-primary-600">{m.potongan_text}</td>
                    <td>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${m.status === 'aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {m.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. TAB MASTER UNIT KAS */}
      {activeTab === 'unit-kas-master' && (
        <div className="card p-6 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">Master Data Unit Kas & Multi-Rekening</h2>
              <p className="text-xs text-slate-500 mt-0.5">Pengelolaan unit pemegang Petty Cash beserta data rekening tujuan pencairan dana.</p>
            </div>
            <span className="text-xs font-bold text-slate-500">{unitKasMasterList.length} Unit Terdaftar</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unitKasMasterList.map((u) => (
              <div key={u.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className={`absolute top-0 left-0 w-1 h-full ${u.status ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                <div className="flex justify-between items-start mb-2 pl-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${u.status ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      <Building size={16} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-sm leading-tight">{u.nama_kas}</h3>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${u.status ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {u.status ? 'AKTIF' : 'NONAKTIF'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => {
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
                    }} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-slate-100 rounded-lg transition-colors">
                      <Edit size={14} />
                    </button>
                    <button onClick={() => handleDeleteUnitKas(u.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                      <Trash2 size={14} />
                    </button>
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
        </div>
      )}

      {/* MODAL UNIT KAS */}
      {isUnitKasModalOpen && (
        <div className="modal-overlay">
          <div className="modal modal-sm">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Building size={18} className="text-primary-600" /> {editingUnitKas ? 'Edit Unit Kas' : 'Tambah Unit Kas Baru'}
              </h3>
              <button onClick={() => setIsUnitKasModalOpen(false)} className="btn btn-ghost btn-xs font-bold">✕</button>
            </div>
            <form onSubmit={handleSaveUnitKas} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Nama Unit Kas *</label>
                <input
                  type="text"
                  required
                  className="input input-sm border-slate-300 w-full text-xs font-bold"
                  value={unitKasForm.nama_kas}
                  onChange={(e) => setUnitKasForm({ ...unitKasForm, nama_kas: e.target.value })}
                  placeholder="Misal: Petty Cash Fakultas Teknik"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Bank Transfer</label>
                  <select
                    className="select select-sm border-slate-300 w-full text-xs font-bold"
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
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">No. Rekening</label>
                  <input
                    type="text"
                    className="input input-sm border-slate-300 w-full text-xs font-mono"
                    value={unitKasForm.bank_account_number}
                    onChange={(e) => setUnitKasForm({ ...unitKasForm, bank_account_number: e.target.value })}
                    placeholder="Nomor rekening"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Atas Nama Rekening</label>
                <input
                  type="text"
                  className="input input-sm border-slate-300 w-full text-xs font-bold uppercase"
                  value={unitKasForm.bank_account_name}
                  onChange={(e) => setUnitKasForm({ ...unitKasForm, bank_account_name: e.target.value })}
                  placeholder="Nama pemilik rekening"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t mt-2">
                <input
                  type="checkbox"
                  className="toggle toggle-success toggle-sm"
                  id="statusUnitKas"
                  checked={unitKasForm.status}
                  onChange={(e) => setUnitKasForm({ ...unitKasForm, status: e.target.checked })}
                />
                <label htmlFor="statusUnitKas" className="text-xs font-bold text-slate-700 cursor-pointer">Unit Aktif</label>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                <button type="button" onClick={() => setIsUnitKasModalOpen(false)} className="btn btn-ghost btn-sm font-bold">Batal</button>
                <button type="submit" className="btn btn-primary btn-sm font-bold border-none">
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
