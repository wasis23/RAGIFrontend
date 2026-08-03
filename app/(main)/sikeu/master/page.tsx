'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Plus, Calendar, Layers, Edit, Trash2, UserCheck, Award, Sparkles, Filter, CheckCircle2, AlertCircle, RefreshCw, UserPlus, Search, Settings, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { sikeuService } from '@/services/sikeu.service';

export default function MasterBiayaPage() {
  const [activeTab, setActiveTab] = useState<'tarif' | 'jalur-kelas' | 'student-types' | 'jenis-biaya' | 'beasiswa' | 'mapping-beasiswa'>('tarif');
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
  const [assignForm, setAssignForm] = useState({ mahasiswa_id: 101, beasiswa_id: 1, berlaku_mulai: '', berlaku_sampai: '' });

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

  const fetchTarif = async () => {
    try {
      setLoading(true);
      const res = await sikeuService.getTarifList({ tahun_angkatan: selectedAngkatan, jalur_kelas: selectedJalur });
      if (res.data) setTarifList(res.data);
    } catch (e) {
      setTarifList([
        { id: 1, tahun_angkatan: selectedAngkatan, jalur_kelas: selectedJalur, kelompok_ukt: 1, nama_kelompok: 'Kelompok 1 (Subsidi Penuh)', nominal: 500000, jenis_biaya: { nama: 'UKT Kelompok 1 (Subsidi)' } },
        { id: 2, tahun_angkatan: selectedAngkatan, jalur_kelas: selectedJalur, kelompok_ukt: 2, nama_kelompok: 'Kelompok 2 (Subsidi Parsial)', nominal: 1500000, jenis_biaya: { nama: 'UKT Kelompok 2' } },
        { id: 3, tahun_angkatan: selectedAngkatan, jalur_kelas: selectedJalur, kelompok_ukt: 3, nama_kelompok: 'Kelompok 3 (Reguler / Standar)', nominal: selectedJalur === 'Karyawan' ? 5500000 : 3500000, jenis_biaya: { nama: 'UKT Kelompok 3 (Standar)' } },
        { id: 4, tahun_angkatan: selectedAngkatan, jalur_kelas: selectedJalur, kelompok_ukt: 4, nama_kelompok: 'Kelompok 4 (Mandiri)', nominal: selectedJalur === 'Karyawan' ? 7500000 : 5500000, jenis_biaya: { nama: 'UKT Kelompok 4 (Mandiri)' } },
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
      if (editingTarif) {
        await sikeuService.updateTarif(editingTarif.id, tarifForm);
        setFeedback({ type: 'success', message: 'Nominal tarif berhasil diperbarui.' });
      } else {
        await sikeuService.storeTarif(tarifForm);
        setFeedback({ type: 'success', message: 'Tarif angkatan baru berhasil disimpan.' });
      }
      setIsTarifModalOpen(false);
      setEditingTarif(null);
      fetchTarif();
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
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Master Tarif, Jalur Kelas, Tipe Tagihan & Beasiswa</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Pengaturan Angkatan, master Jalur Kelas, penetapan tipe tagihan pendaftaran, pencarian NIM/Nama, & scope Beasiswa.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
                  setTarifForm({ jenis_biaya_id: 1, tahun_angkatan: selectedAngkatan, jalur_kelas: selectedJalur, kelompok_ukt: 1, nama_kelompok: 'Kelompok 1 (Subsidi Penuh)', program_studi_id: 0, nominal: 3500000 });
                  setIsTarifModalOpen(true);
                }}
                className="btn bg-teal-600 hover:bg-teal-700 text-white border-none font-bold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Plus size={16} /> Atur Nominal Tarif
              </button>
            </>
          )}
          {activeTab === 'jalur-kelas' && (
            <button
              onClick={() => {
                setJalurForm({ nama_jalur: '', deskripsi: '' });
                setIsJalurModalOpen(true);
              }}
              className="btn bg-indigo-600 hover:bg-indigo-700 text-white border-none font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={16} /> Tambah Jalur Kelas Baru
            </button>
          )}
          {activeTab === 'student-types' && (
            <button
              onClick={() => {
                setEditingStudentType(null);
                setStudentTypeForm({ mahasiswa_id: 105, nim: '2025010088', nama_mahasiswa: 'Mahasiswa Baru', tahun_angkatan: 2025, jalur_kelas: 'Reguler', kelompok_ukt: 3, beasiswa_id: 0, catatan_perubahan: 'Pendaftaran baru via SPMB' });
                setIsStudentTypeModalOpen(true);
              }}
              className="btn bg-indigo-600 hover:bg-indigo-700 text-white border-none font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <UserPlus size={16} /> Penetapan Tipe Pendaftaran Baru
            </button>
          )}
          {activeTab === 'jenis-biaya' && (
            <button
              onClick={() => {
                setEditingJenisBiaya(null);
                setJenisBiayaForm({ kode: '', nama: '', tipe: 'ukt', nominal_standar: 0, deskripsi: '' });
                setIsJenisBiayaModalOpen(true);
              }}
              className="btn bg-indigo-600 hover:bg-indigo-700 text-white border-none font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={16} /> Tambah Komponen Biaya
            </button>
          )}
          {activeTab === 'beasiswa' && (
            <button
              onClick={() => {
                setEditingBeasiswa(null);
                setBeasiswaForm({ kode: '', nama: '', sumber: 'internal', tipe_potongan: 'persen', nilai_potongan: 100, jenis_biaya_id: 0, berlaku_angkatan_mulai: 2023, berlaku_angkatan_sampai: 2027, deskripsi: '' });
                setIsBeasiswaModalOpen(true);
              }}
              className="btn bg-emerald-600 hover:bg-emerald-700 text-white border-none font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={16} /> Tambah Master Beasiswa
            </button>
          )}
          {activeTab === 'mapping-beasiswa' && (
            <button
              onClick={() => setIsAssignBeasiswaModalOpen(true)}
              className="btn bg-amber-600 hover:bg-amber-700 text-white border-none font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={16} /> Tetapkan Mahasiswa Penerima
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

      {/* Responsive Segmented Cards Navigation */}
      <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm space-y-2">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          <button
            onClick={() => setActiveTab('tarif')}
            className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
              activeTab === 'tarif'
                ? 'bg-teal-50/80 border-teal-600 text-teal-900 shadow-xs ring-1 ring-teal-600/30'
                : 'bg-slate-50/60 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-1.5 font-extrabold text-xs">
              <Calendar size={15} className={activeTab === 'tarif' ? 'text-teal-700' : 'text-slate-400'} />
              Tarif Angkatan
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Nominal per UKT & Kelas</span>
          </button>

          <button
            onClick={() => setActiveTab('jalur-kelas')}
            className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
              activeTab === 'jalur-kelas'
                ? 'bg-teal-50/80 border-teal-600 text-teal-900 shadow-xs ring-1 ring-teal-600/30'
                : 'bg-slate-50/60 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-1.5 font-extrabold text-xs">
              <Settings size={15} className={activeTab === 'jalur-kelas' ? 'text-teal-700' : 'text-slate-400'} />
              Jalur / Kelas
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Master Tipe Mahasiswa</span>
          </button>

          <button
            onClick={() => setActiveTab('student-types')}
            className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
              activeTab === 'student-types'
                ? 'bg-teal-50/80 border-teal-600 text-teal-900 shadow-xs ring-1 ring-teal-600/30'
                : 'bg-slate-50/60 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-1.5 font-extrabold text-xs">
              <UserCheck size={15} className={activeTab === 'student-types' ? 'text-teal-700' : 'text-slate-400'} />
              Tipe Tagihan
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Penetapan & Perubahan Status</span>
          </button>

          <button
            onClick={() => setActiveTab('jenis-biaya')}
            className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
              activeTab === 'jenis-biaya'
                ? 'bg-teal-50/80 border-teal-600 text-teal-900 shadow-xs ring-1 ring-teal-600/30'
                : 'bg-slate-50/60 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-1.5 font-extrabold text-xs">
              <Layers size={15} className={activeTab === 'jenis-biaya' ? 'text-teal-700' : 'text-slate-400'} />
              Komponen Biaya
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Master Jenis & Tipe Tagihan</span>
          </button>

          <button
            onClick={() => setActiveTab('beasiswa')}
            className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
              activeTab === 'beasiswa'
                ? 'bg-teal-50/80 border-teal-600 text-teal-900 shadow-xs ring-1 ring-teal-600/30'
                : 'bg-slate-50/60 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-1.5 font-extrabold text-xs">
              <Award size={15} className={activeTab === 'beasiswa' ? 'text-teal-700' : 'text-slate-400'} />
              Master Beasiswa
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Scope Potongan & Angkatan</span>
          </button>

          <button
            onClick={() => setActiveTab('mapping-beasiswa')}
            className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
              activeTab === 'mapping-beasiswa'
                ? 'bg-teal-50/80 border-teal-600 text-teal-900 shadow-xs ring-1 ring-teal-600/30'
                : 'bg-slate-50/60 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-1.5 font-extrabold text-xs">
              <UserCheck size={15} className={activeTab === 'mapping-beasiswa' ? 'text-teal-700' : 'text-slate-400'} />
              Penerima Beasiswa
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Mapping Mahasiswa Aktif</span>
          </button>
        </div>
      </div>

      {/* TAB 1: MASTER TARIF PER ANGKATAN & KELAS */}
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
            </div>

            <div className="text-xs font-mono font-bold text-slate-500">
              Total {tarifList.length} Kelompok Tarif Configured
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase border-y border-slate-200">
                <tr>
                  <th className="px-4 py-3">ANGKATAN & JALUR KELAS</th>
                  <th className="px-4 py-3">KELOMPOK UKT & INFORMASI LEVEL</th>
                  <th className="px-4 py-3">KOMPONEN BIAYA</th>
                  <th className="px-4 py-3 text-right">NOMINAL TARIF (RP)</th>
                  <th className="px-4 py-3 text-center">STATUS</th>
                  <th className="px-4 py-3 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-8 text-slate-400">Memuat tarif...</td></tr>
                ) : tarifList.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-slate-400">Belum ada tarif untuk Angkatan {selectedAngkatan} - Kelas {selectedJalur}.</td></tr>
                ) : (
                  tarifList.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold font-mono text-teal-800">
                        Angkatan {t.tahun_angkatan || selectedAngkatan} ({t.jalur_kelas || selectedJalur})
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-extrabold text-slate-900 text-sm">
                          {t.nama_kelompok || `Kelompok ${t.kelompok_ukt}`}
                        </div>
                        <div className="text-[10px] text-teal-700 font-bold mt-0.5">
                          {getLevelText(t.kelompok_ukt)} {t.program_studi_id ? `• Prodi ID: ${t.program_studi_id}` : ''}
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
                                kelompok_ukt: t.kelompok_ukt || 1,
                                nama_kelompok: t.nama_kelompok || `Kelompok ${t.kelompok_ukt || 1}`,
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

      {/* TAB 2: MASTER SETTING JALUR KELAS MAHASISWA WITH EDIT & SAFE DELETE */}
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

      {/* TAB 3: PENETAPAN & PERUBAHAN TIPE TAGIHAN WITH SERVER-SIDE PAGINATION */}
      {activeTab === 'student-types' && (
        <div className="bg-white rounded-b-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">Penetapan Tipe Tagihan & Riwayat Perubahan Jalur Mahasiswa</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Integrasi otomatis dari SPMB/SIAKAD & Pengaturan Admin (dilengkapi Server-Side Pagination & Search).
              </p>
            </div>

            {/* SERVER-SIDE SEARCH FILTER BY NAMA OR NIM */}
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

          {/* UI PAGINATION CONTROLS FOR STUDENT TYPES */}
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

      {/* TAB 4: KOMPONEN BIAYA MASTER */}
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

      {/* TAB 5: MASTER BEASISWA WITH SCOPE TARGETING (JENIS BIAYA & ANGKATAN) */}
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

      {/* TAB 6: PENETAPAN BEASISWA MAHASISWA WITH PAGINATION */}
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

          {/* UI PAGINATION CONTROLS FOR BEASISWA MAPPING */}
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
                <button type="submit" className="btn bg-indigo-600 hover:bg-indigo-700 text-white btn-sm font-bold border-none">
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
                <button type="submit" className="btn bg-indigo-600 hover:bg-indigo-700 text-white btn-sm font-bold border-none">
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

              {/* CHECKLIST SYARAT KONFIRMASI */}
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
                <button type="submit" disabled={loading} className="btn bg-indigo-600 hover:bg-indigo-700 text-white btn-sm font-bold border-none">
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
                <button type="button" onClick={handleAddAngkatan} className="btn bg-indigo-600 hover:bg-indigo-700 text-white btn-sm font-bold border-none">
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

              <div>
                <label className="text-xs font-bold text-slate-700">Nama / Label Kelompok Tarif *</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Kelompok 1 (Teknik) / Kelompok 1 (Kesehatan)"
                  value={tarifForm.nama_kelompok}
                  onChange={(e) => setTarifForm({ ...tarifForm, nama_kelompok: e.target.value })}
                  className="input input-sm border-slate-300 w-full font-bold text-xs"
                />
                <span className="text-[10px] text-slate-500 italic mt-0.5 block">
                  Anda bebas mengetik nama kelompok (contoh: Kelompok 1 Teknik vs Kelompok 1 Kesehatan).
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Grade / Level UKT *</label>
                  <select
                    value={tarifForm.kelompok_ukt}
                    onChange={(e) => {
                      const u = Number(e.target.value);
                      setTarifForm({
                        ...tarifForm,
                        kelompok_ukt: u,
                        nama_kelompok: tarifForm.nama_kelompok || getLevelText(u)
                      });
                    }}
                    className="select select-sm border-slate-300 w-full font-semibold text-xs"
                  >
                    <option value={1}>Level 1 (Subsidi Penuh)</option>
                    <option value={2}>Level 2 (Subsidi Parsial)</option>
                    <option value={3}>Level 3 (Reguler / Standar)</option>
                    <option value={4}>Level 4 (Mandiri)</option>
                    <option value={5}>Level 5 (Eksekutif / Khusus)</option>
                  </select>
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
                <button type="submit" className="btn bg-indigo-600 hover:bg-indigo-700 text-white btn-sm font-bold border-none">
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

              {/* TARGETING SCOPE: JENIS BIAYA & TAHUN ANGKATAN */}
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
                <button type="submit" className="btn bg-emerald-600 hover:bg-emerald-700 text-white btn-sm font-bold border-none">
                  Simpan Master Beasiswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PENETAPAN BEASISWA MAHASISWA */}
      {isAssignBeasiswaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-base text-slate-900">Tetapkan Penerima Beasiswa</h3>
              <button onClick={() => setIsAssignBeasiswaModalOpen(false)} className="btn btn-ghost btn-xs font-bold">✕</button>
            </div>
            <form onSubmit={handleAssignBeasiswa} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700">ID / NIM Mahasiswa *</label>
                <input
                  type="number"
                  required
                  placeholder="Misal: 101"
                  value={assignForm.mahasiswa_id}
                  onChange={(e) => setAssignForm({ ...assignForm, mahasiswa_id: Number(e.target.value) })}
                  className="input input-sm border-slate-300 w-full font-bold"
                />
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
                <button type="submit" className="btn bg-amber-600 hover:bg-amber-700 text-white btn-sm font-bold border-none">
                  Tetapkan Beasiswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
