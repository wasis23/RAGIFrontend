'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';
import {
  User,
  MapPin,
  Users,
  GraduationCap,
  Save,
  RefreshCw,
  Database,
  Calendar,
  Sparkles,
  ChevronRight,
  BookOpen,
  Trash2,
  Plus,
} from 'lucide-react';

export default function AdminMahasiswaBiodataPage() {
  const [kelasOptions, setKelasOptions] = useState<any[]>([]);
  const [mhsOptions, setMhsOptions] = useState<any[]>([]);
  const [matakuliahs, setMatakuliahs] = useState<any[]>([]);
  
  const [selectedKelasId, setSelectedKelasId] = useState<string>('');
  const [selectedMhsId, setSelectedMhsId] = useState<string>('');
  
  const [loadingKelas, setLoadingKelas] = useState(true);
  const [loadingMhs, setLoadingMhs] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncingFeeder, setSyncingFeeder] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'biodata' | 'alamat' | 'ortu' | 'riwayat'>('biodata');
  const [mahasiswa, setMahasiswa] = useState<any>(null);

  // Form State for Biodata
  const [formData, setFormData] = useState({
    nama_lengkap: '',
    nim: '',
    nik: '',
    nisn: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    jenis_kelamin: 'L',
    agama: 'Islam',
    telepon: '',
    email: '',
    alamat: '',
    rt: '',
    rw: '',
    dusun: '',
    kelurahan: '',
    kecamatan: '',
    kota: '',
    provinsi: '',
    kode_pos: '',
    jenis_tinggal: 'Bersama Orang Tua',
    alat_transportasi: 'Sepeda Motor',
    nama_ibu_kandung: '',
    nik_ibu: '',
    nama_ayah: '',
    nik_ayah: '',
    nama_wali: '',
    status: 'aktif',
  });

  // Form State for Konversi Transfer
  const [konversiForm, setKonversiForm] = useState({
    kampus_asal: '',
    prodi_asal: '',
    catatan: '',
    details: [] as any[],
  });

  // Fetch initial classes and courses
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoadingKelas(true);
        const [kelasRes, mkRes] = await Promise.all([
          siakadService.getKelas({ per_page: 200 }),
          siakadService.getMataKuliahs({ per_page: 200 }),
        ]);
        if (kelasRes.data) setKelasOptions(kelasRes.data);
        if (mkRes.data) setMatakuliahs(mkRes.data);
      } catch (err) {
        toast.error('Gagal memuat data kelas / mata kuliah');
      } finally {
        setLoadingKelas(false);
      }
    };
    fetchInitialData();
  }, []);

  // Fetch students when class changes
  useEffect(() => {
    if (!selectedKelasId) {
      setMhsOptions([]);
      setSelectedMhsId('');
      setMahasiswa(null);
      return;
    }
    const fetchStudents = async () => {
      try {
        setLoadingMhs(true);
        const res = await siakadService.getMahasiswas({ kelas_id: selectedKelasId, per_page: 100 });
        if (res.data) {
          setMhsOptions(res.data);
          setSelectedMhsId('');
          setMahasiswa(null);
        }
      } catch (err) {
        toast.error('Gagal memuat mahasiswa kelas');
      } finally {
        setLoadingMhs(false);
      }
    };
    fetchStudents();
  }, [selectedKelasId]);

  // Fetch student profile details when student changes
  useEffect(() => {
    if (!selectedMhsId) {
      setMahasiswa(null);
      return;
    }
    const fetchStudentDetail = async () => {
      try {
        setLoadingDetail(true);
        const res = await siakadService.getMahasiswaDetail(Number(selectedMhsId));
        if (res.data) {
          const detail = res.data;
          setMahasiswa(detail);
          
          // Map to Form
          setFormData({
            nama_lengkap: detail.nama_lengkap || '',
            nim: detail.nim || '',
            nik: detail.nik || '',
            nisn: detail.nisn || '',
            tempat_lahir: detail.tempat_lahir || '',
            tanggal_lahir: detail.tanggal_lahir ? detail.tanggal_lahir.slice(0, 10) : '',
            jenis_kelamin: detail.jenis_kelamin || 'L',
            agama: detail.agama || 'Islam',
            telepon: detail.telepon || '',
            email: detail.email || detail.user?.email || '',
            alamat: detail.alamat || '',
            rt: detail.rt || '',
            rw: detail.rw || '',
            dusun: detail.dusun || '',
            kelurahan: detail.kelurahan || '',
            kecamatan: detail.kecamatan || '',
            kota: detail.kota || '',
            provinsi: detail.provinsi || '',
            kode_pos: detail.kode_pos || '',
            jenis_tinggal: detail.jenis_tinggal || 'Bersama Orang Tua',
            alat_transportasi: detail.alat_transportasi || 'Sepeda Motor',
            nama_ibu_kandung: detail.nama_ibu_kandung || '',
            nik_ibu: detail.nik_ibu || '',
            nama_ayah: detail.nama_ayah || '',
            nik_ayah: detail.nik_ayah || '',
            nama_wali: detail.nama_wali || '',
            status: detail.status || 'aktif',
          });

          // Map to Konversi
          if (detail.konversi_transfer) {
            setKonversiForm({
              kampus_asal: detail.konversi_transfer.kampus_asal || '',
              prodi_asal: detail.konversi_transfer.prodi_asal || '',
              catatan: detail.konversi_transfer.catatan || '',
              details: detail.konversi_transfer.details || [],
            });
          } else {
            setKonversiForm({
              kampus_asal: '',
              prodi_asal: '',
              catatan: '',
              details: [],
            });
          }
        }
      } catch (err) {
        toast.error('Gagal memuat detail biodata mahasiswa');
      } finally {
        setLoadingDetail(false);
      }
    };
    fetchStudentDetail();
  }, [selectedMhsId]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveBiodata = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMhsId) return;
    try {
      setSaving(true);
      const res = await siakadService.updateMahasiswa(Number(selectedMhsId), formData);
      toast.success(res.message || 'Biodata mahasiswa berhasil diperbarui oleh admin');
      if (res.data) {
        setMahasiswa(res.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal menyimpan perubahan');
    } finally {
      setSaving(false);
    }
  };

  const handleSyncFeeder = async () => {
    if (!selectedMhsId) return;
    try {
      setSyncingFeeder(true);
      const res = await siakadService.syncMahasiswaProfilToFeeder({ mahasiswa_id: Number(selectedMhsId) });
      toast.success(res.message || 'Biodata berhasil disinkronkan ke Neo Feeder PDDikti');
      // Refresh
      const detailRes = await siakadService.getMahasiswaDetail(Number(selectedMhsId));
      if (detailRes.data) setMahasiswa(detailRes.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal sinkronisasi ke Neo Feeder');
    } finally {
      setSyncingFeeder(false);
    }
  };

  // Konversi functions
  const handleAddKonversiDetail = () => {
    setKonversiForm((prev) => ({
      ...prev,
      details: [
        ...prev.details,
        {
          mata_kuliah_diakui_id: matakuliahs[0]?.id || 1,
          kode_mk_asal: '',
          nama_mk_asal: '',
          sks_asal: 3,
          nilai_huruf_asal: 'A',
        },
      ],
    }));
  };

  const handleRemoveKonversiDetail = (idx: number) => {
    setKonversiForm((prev) => {
      const updated = [...prev.details];
      updated.splice(idx, 1);
      return { ...prev, details: updated };
    });
  };

  const handleKonversiDetailChange = (idx: number, field: string, value: any) => {
    setKonversiForm((prev) => {
      const updated = [...prev.details];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, details: updated };
    });
  };

  const handleSaveKonversi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMhsId) return;
    
    if (!konversiForm.kampus_asal || !konversiForm.prodi_asal) {
      toast.error('Kampus Asal dan Program Studi Asal wajib diisi');
      return;
    }
    if (konversiForm.details.length === 0) {
      toast.error('Minimal harus menginputkan 1 mata kuliah penyetaraan');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        mahasiswa_id: Number(selectedMhsId),
        kampus_asal: konversiForm.kampus_asal,
        prodi_asal: konversiForm.prodi_asal,
        catatan: konversiForm.catatan,
        details: konversiForm.details.map((d: any) => ({
          mata_kuliah_diakui_id: Number(d.mata_kuliah_diakui_id),
          kode_mk_asal: d.kode_mk_asal,
          nama_mk_asal: d.nama_mk_asal,
          sks_asal: Number(d.sks_asal),
          nilai_huruf_asal: d.nilai_huruf_asal,
        })),
      };
      
      const res = await siakadService.createKonversi(payload);
      toast.success(res.message || 'Konversi transfer mahasiswa berhasil disimpan/diperbarui');
      
      // Refresh detail
      const detailRes = await siakadService.getMahasiswaDetail(Number(selectedMhsId));
      if (detailRes.data) {
        setMahasiswa(detailRes.data);
        if (detailRes.data.konversi_transfer) {
          setKonversiForm({
            kampus_asal: detailRes.data.konversi_transfer.kampus_asal || '',
            prodi_asal: detailRes.data.konversi_transfer.prodi_asal || '',
            catatan: detailRes.data.konversi_transfer.catatan || '',
            details: detailRes.data.konversi_transfer.details || [],
          });
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal menyimpan konversi transfer');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteKonversi = async () => {
    if (!mahasiswa?.konversi_id) return;
    if (!window.confirm('Apakah Anda yakin ingin menghapus data konversi transfer mahasiswa ini?')) return;
    try {
      setSaving(true);
      await siakadService.deleteKonversi(mahasiswa.konversi_id);
      toast.success('Konversi transfer berhasil dihapus');
      setKonversiForm({
        kampus_asal: '',
        prodi_asal: '',
        catatan: '',
        details: [],
      });
      // Refresh detail
      const detailRes = await siakadService.getMahasiswaDetail(Number(selectedMhsId));
      if (detailRes.data) setMahasiswa(detailRes.data);
    } catch (err: any) {
      toast.error('Gagal menghapus konversi transfer');
    } finally {
      setSaving(false);
    }
  };

  const isTransfer = Boolean(mahasiswa?.konversi_id || mahasiswa?.konversi_transfer || formData.status === 'aktif' && mahasiswa?.jalur_masuk === 'Transfer');

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Kelola Biodata Mahasiswa (Kelas)"
        description="Pilih kelas dan mahasiswa untuk menampilkan, melengkapi, serta menyelaraskan biodata resmi PDDikti Neo Feeder."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Civitas' },
          { label: 'Biodata Mahasiswa' },
        ]}
      />

      {/* Selectors Card */}
      <div className="card p-6 bg-slate-50 border border-slate-200 shadow-sm rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label font-bold text-slate-800">1. Pilih Kelas / Jadwal Kuliah *</label>
            <select
              value={selectedKelasId}
              onChange={(e) => setSelectedKelasId(e.target.value)}
              className="select w-full bg-white border-slate-300 font-medium"
              disabled={loadingKelas}
            >
              <option value="">-- Pilih Kelas Kuliah --</option>
              {kelasOptions.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.mata_kuliah?.nama} ({k.nama_kelas}) - {k.hari?.toUpperCase()} {k.jam_mulai}
                </option>
              ))}
            </select>
            {loadingKelas && <p className="text-2xs text-slate-400 mt-1 animate-pulse">Memuat daftar kelas...</p>}
          </div>

          <div>
            <label className="label font-bold text-slate-800">2. Pilih Mahasiswa Terdaftar *</label>
            <select
              value={selectedMhsId}
              onChange={(e) => setSelectedMhsId(e.target.value)}
              className="select w-full bg-white border-slate-300 font-medium"
              disabled={!selectedKelasId || loadingMhs}
            >
              <option value="">
                {!selectedKelasId
                  ? '-- Pilih Kelas Terlebih Dahulu --'
                  : mhsOptions.length === 0
                  ? '-- Tidak Ada Mahasiswa di Kelas Ini --'
                  : '-- Pilih Mahasiswa --'}
              </option>
              {mhsOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nim || 'Belum ada NIM'} - {m.nama_lengkap}
                </option>
              ))}
            </select>
            {loadingMhs && <p className="text-2xs text-slate-400 mt-1 animate-pulse">Memuat daftar mahasiswa...</p>}
          </div>
        </div>
      </div>

      {/* Loading detail state */}
      {loadingDetail && (
        <div className="card p-12 text-center text-slate-400 animate-pulse">
          <RefreshCw className="animate-spin mx-auto mb-3 text-primary-600" size={28} />
          <p className="text-xs font-bold">Memuat detail profil mahasiswa...</p>
        </div>
      )}

      {/* Empty State */}
      {!selectedMhsId && !loadingDetail && (
        <div className="card p-12 text-center text-slate-400 border border-dashed border-slate-300 bg-slate-50/50 rounded-2xl">
          <User className="mx-auto mb-3 text-slate-300" size={40} />
          <h3 className="text-sm font-bold text-slate-700">Biodata Belum Dipilih</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Silakan pilih kelas terlebih dahulu, kemudian pilih mahasiswa di kelas tersebut untuk melengkapi data akademiknya.
          </p>
        </div>
      )}

      {/* Detailed Form */}
      {selectedMhsId && !loadingDetail && mahasiswa && (
        <div className="space-y-6">
          {/* Header Profile Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 p-6 text-white shadow-md">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge active={mahasiswa.status === 'aktif'} />
                  <Badge variant="blue">
                    Prodi: {mahasiswa.program_studi?.nama || '-'} ({mahasiswa.program_studi?.jenjang || 'S1'})
                  </Badge>
                  {isTransfer && (
                    <Badge variant="amber">
                      Jalur Transfer
                    </Badge>
                  )}
                  <Badge variant="purple">
                    Angkatan {mahasiswa.angkatan || 2026}
                  </Badge>
                </div>

                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white mt-1">
                  {mahasiswa.nama_lengkap}
                </h2>
                <p className="text-xs text-slate-300 font-mono">
                  NIM: <strong>{mahasiswa.nim || 'Belum diisi'}</strong> • NIK: <strong>{mahasiswa.nik || 'Belum diisi'}</strong> • NISN: <strong>{mahasiswa.nisn || '-'}</strong>
                </p>
              </div>

              {/* Feeder Status Box */}
              <div className="flex flex-col gap-2 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 shrink-0 text-xs">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <Database size={13} className="text-amber-400" /> ID Feeder Biodata:
                  </span>
                  <span className="font-mono font-bold text-amber-300">
                    {mahasiswa.id_feeder_biodata || 'STG-BIO-' + mahasiswa.id}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-2">
                  <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <GraduationCap size={13} className="text-emerald-400" /> ID Feeder Riwayat:
                  </span>
                  <span className="font-mono font-bold text-emerald-300">
                    {mahasiswa.id_feeder_riwayat || 'STG-REG-' + mahasiswa.id}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
            <span className="text-xs font-bold text-slate-700">Aksi Admin Akademik (PDDIKTI)</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                icon={<RefreshCw size={14} className={syncingFeeder ? 'animate-spin' : ''} />}
                className="font-bold text-xs"
                onClick={handleSyncFeeder}
                disabled={syncingFeeder || saving}
              >
                {syncingFeeder ? 'Menyinkronkan...' : 'Sinkronkan ke Neo Feeder'}
              </Button>
              <Button
                variant="primary"
                icon={<Save size={15} />}
                className="font-bold text-xs shadow-xs"
                onClick={handleSaveBiodata}
                disabled={saving || syncingFeeder}
              >
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('biodata')}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition -mb-px cursor-pointer whitespace-nowrap ${
                activeTab === 'biodata'
                  ? 'border-primary-600 text-primary-600 bg-primary-50/50 rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <User size={15} />
              1. Biodata Pribadi
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('alamat')}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition -mb-px cursor-pointer whitespace-nowrap ${
                activeTab === 'alamat'
                  ? 'border-primary-600 text-primary-600 bg-primary-50/50 rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <MapPin size={15} />
              2. Alamat & Domisili
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ortu')}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition -mb-px cursor-pointer whitespace-nowrap ${
                activeTab === 'ortu'
                  ? 'border-primary-600 text-primary-600 bg-primary-50/50 rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Users size={15} />
              3. Data Orang Tua
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('riwayat')}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition -mb-px cursor-pointer whitespace-nowrap ${
                activeTab === 'riwayat'
                  ? 'border-primary-600 text-primary-600 bg-primary-50/50 rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <GraduationCap size={15} />
              4. Riwayat & Konversi Transfer
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSaveBiodata} className="space-y-6">
            {/* TAB 1: BIODATA */}
            {activeTab === 'biodata' && (
              <div className="card p-6 space-y-6 bg-white border border-slate-200 rounded-2xl shadow-xs animate-fade-in">
                <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">Identitas Diri Resmi</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input
                    label="Nama Lengkap Sesuai KTP / Ijazah"
                    required
                    value={formData.nama_lengkap}
                    onChange={(e) => handleChange('nama_lengkap', e.target.value)}
                  />
                  <Input
                    label="Nomor Induk Mahasiswa (NIM)"
                    required
                    value={formData.nim}
                    onChange={(e) => handleChange('nim', e.target.value)}
                  />
                  <Input
                    label="NIK (16 Digit)"
                    maxLength={16}
                    value={formData.nik}
                    onChange={(e) => handleChange('nik', e.target.value)}
                  />
                  <Input
                    label="NISN"
                    maxLength={10}
                    value={formData.nisn}
                    onChange={(e) => handleChange('nisn', e.target.value)}
                  />
                  <Input
                    label="Tempat Lahir"
                    value={formData.tempat_lahir}
                    onChange={(e) => handleChange('tempat_lahir', e.target.value)}
                  />
                  <Input
                    label="Tanggal Lahir"
                    type="date"
                    value={formData.tanggal_lahir}
                    onChange={(e) => handleChange('tanggal_lahir', e.target.value)}
                  />
                  <div>
                    <label className="label font-bold text-slate-700">Jenis Kelamin</label>
                    <select
                      value={formData.jenis_kelamin}
                      onChange={(e) => handleChange('jenis_kelamin', e.target.value)}
                      className="select w-full text-xs font-bold"
                    >
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </div>
                  <div>
                    <label className="label font-bold text-slate-700">Agama</label>
                    <select
                      value={formData.agama}
                      onChange={(e) => handleChange('agama', e.target.value)}
                      className="select w-full text-xs font-bold"
                    >
                      <option value="Islam">Islam</option>
                      <option value="Kristen">Kristen Protestan</option>
                      <option value="Katolik">Katolik</option>
                      <option value="Hindu">Hindu</option>
                      <option value="Buddha">Buddha</option>
                      <option value="Konghucu">Konghucu</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                  <Input
                    label="Nomor Telepon"
                    value={formData.telepon}
                    onChange={(e) => handleChange('telepon', e.target.value)}
                  />
                  <Input
                    label="Email Mahasiswa"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* TAB 2: ALAMAT */}
            {activeTab === 'alamat' && (
              <div className="card p-6 space-y-6 bg-white border border-slate-200 rounded-2xl shadow-xs animate-fade-in">
                <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">Alamat & Domisili Sesuai KK</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="label font-bold text-slate-700">Alamat Lengkap</label>
                    <textarea
                      rows={2}
                      value={formData.alamat}
                      onChange={(e) => handleChange('alamat', e.target.value)}
                      className="textarea w-full text-xs font-bold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="RT"
                      value={formData.rt}
                      onChange={(e) => handleChange('rt', e.target.value)}
                    />
                    <Input
                      label="RW"
                      value={formData.rw}
                      onChange={(e) => handleChange('rw', e.target.value)}
                    />
                  </div>
                  <Input
                    label="Dusun"
                    value={formData.dusun}
                    onChange={(e) => handleChange('dusun', e.target.value)}
                  />
                  <Input
                    label="Kelurahan"
                    value={formData.kelurahan}
                    onChange={(e) => handleChange('kelurahan', e.target.value)}
                  />
                  <Input
                    label="Kecamatan"
                    value={formData.kecamatan}
                    onChange={(e) => handleChange('kecamatan', e.target.value)}
                  />
                  <Input
                    label="Kota / Kabupaten"
                    value={formData.kota}
                    onChange={(e) => handleChange('kota', e.target.value)}
                  />
                  <Input
                    label="Provinsi"
                    value={formData.provinsi}
                    onChange={(e) => handleChange('provinsi', e.target.value)}
                  />
                  <Input
                    label="Kode Pos"
                    value={formData.kode_pos}
                    onChange={(e) => handleChange('kode_pos', e.target.value)}
                  />
                  <div>
                    <label className="label font-bold text-slate-700">Jenis Tempat Tinggal</label>
                    <select
                      value={formData.jenis_tinggal}
                      onChange={(e) => handleChange('jenis_tinggal', e.target.value)}
                      className="select w-full text-xs font-bold"
                    >
                      <option value="Bersama Orang Tua">Bersama Orang Tua</option>
                      <option value="Wali">Bersama Wali</option>
                      <option value="Kost">Kost</option>
                      <option value="Asrama">Asrama Mahasiswa</option>
                      <option value="Panti Asuhan">Panti Asuhan</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label className="label font-bold text-slate-700">Alat Transportasi</label>
                    <select
                      value={formData.alat_transportasi}
                      onChange={(e) => handleChange('alat_transportasi', e.target.value)}
                      className="select w-full text-xs font-bold"
                    >
                      <option value="Sepeda Motor">Sepeda Motor</option>
                      <option value="Mobil Pribadi">Mobil Pribadi</option>
                      <option value="Angkutan Umum">Angkutan Umum / Bus</option>
                      <option value="Jalan Kaki">Jalan Kaki</option>
                      <option value="Sepeda">Sepeda</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: DATA ORANG TUA */}
            {activeTab === 'ortu' && (
              <div className="card p-6 space-y-6 bg-white border border-slate-200 rounded-2xl shadow-xs animate-fade-in">
                <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">Data Orang Tua / Wali</h3>
                
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                  <span className="text-xs font-extrabold text-slate-800 uppercase block">Data Ibu Kandung (Wajib)</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Nama Lengkap Ibu Kandung *"
                      required
                      value={formData.nama_ibu_kandung}
                      onChange={(e) => handleChange('nama_ibu_kandung', e.target.value)}
                    />
                    <Input
                      label="NIK Ibu Kandung"
                      maxLength={16}
                      value={formData.nik_ibu}
                      onChange={(e) => handleChange('nik_ibu', e.target.value)}
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                  <span className="text-xs font-extrabold text-slate-800 uppercase block">Data Ayah Kandung</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Nama Lengkap Ayah"
                      value={formData.nama_ayah}
                      onChange={(e) => handleChange('nama_ayah', e.target.value)}
                    />
                    <Input
                      label="NIK Ayah"
                      maxLength={16}
                      value={formData.nik_ayah}
                      onChange={(e) => handleChange('nik_ayah', e.target.value)}
                    />
                  </div>
                </div>

                <Input
                  label="Nama Lengkap Wali (Opsional)"
                  value={formData.nama_wali}
                  onChange={(e) => handleChange('nama_wali', e.target.value)}
                />
              </div>
            )}

            {/* TAB 4: RIWAYAT / KONVERSI */}
            {activeTab === 'riwayat' && (
              <div className="space-y-6 animate-fade-in">
                <div className="card p-6 space-y-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
                  <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">Riwayat Pendaftaran & Dosen PA</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 bg-slate-50 border rounded-xl">
                      <span className="text-slate-400 block font-semibold">Program Studi</span>
                      <strong className="text-sm font-bold text-slate-900">{mahasiswa.program_studi?.nama} ({mahasiswa.program_studi?.jenjang})</strong>
                    </div>
                    <div className="p-3 bg-slate-50 border rounded-xl">
                      <span className="text-slate-400 block font-semibold">Tahun Angkatan</span>
                      <strong className="text-sm font-bold text-slate-900">{mahasiswa.angkatan}</strong>
                    </div>
                    <div className="p-3 bg-slate-50 border rounded-xl">
                      <span className="text-slate-400 block font-semibold">Jalur Masuk</span>
                      <strong className="text-sm font-bold text-slate-900">{mahasiswa.jalur_masuk || (isTransfer ? 'Transfer' : 'Reguler')}</strong>
                    </div>
                    <div className="p-3 bg-slate-50 border rounded-xl">
                      <span className="text-slate-400 block font-semibold">Dosen Pembimbing Akademik</span>
                      <strong className="text-sm font-bold text-slate-900">{mahasiswa.dosen_wali?.nama_lengkap || 'Belum ditentukan'}</strong>
                    </div>
                  </div>
                </div>

                {/* Konversi Section for Transfer Student */}
                {isTransfer && (
                  <div className="card p-6 bg-amber-50/50 border border-amber-200 rounded-2xl shadow-xs space-y-6">
                    <div className="flex items-center justify-between border-b border-amber-200 pb-3">
                      <div>
                        <h3 className="text-base font-extrabold text-amber-950 flex items-center gap-2">
                          <Sparkles className="text-amber-700" size={18} />
                          Penyetaraan Nilai Konversi (Mahasiswa Transfer)
                        </h3>
                        <p className="text-xs text-amber-800">
                          Mapping mata kuliah asal ke mata kuliah kurikulum lokal kampus saat ini.
                        </p>
                      </div>
                      
                      {mahasiswa.konversi_id && (
                        <Button
                          variant="danger"
                          size="sm"
                          icon={<Trash2 size={13} />}
                          className="font-bold text-xs h-auto py-1 px-3 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100"
                          onClick={handleDeleteKonversi}
                          disabled={saving}
                          type="button"
                        >
                          Hapus Konversi
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Perguruan Tinggi Asal *"
                        placeholder="Contoh: Universitas Gadjah Mada"
                        value={konversiForm.kampus_asal}
                        onChange={(e) => setKonversiForm({ ...konversiForm, kampus_asal: e.target.value })}
                        required
                      />
                      <Input
                        label="Program Studi Asal *"
                        placeholder="Contoh: S1 Teknik Informatika"
                        value={konversiForm.prodi_asal}
                        onChange={(e) => setKonversiForm({ ...konversiForm, prodi_asal: e.target.value })}
                        required
                      />
                      <div className="md:col-span-2">
                        <label className="label font-bold text-slate-700">Catatan Tambahan (Opsional)</label>
                        <textarea
                          rows={2}
                          placeholder="e.g. Diakui sebanyak 10 mata kuliah..."
                          value={konversiForm.catatan}
                          onChange={(e) => setKonversiForm({ ...konversiForm, catatan: e.target.value })}
                          className="textarea w-full text-xs font-bold"
                        />
                      </div>
                    </div>

                    {/* Converted Course List */}
                    <div className="space-y-3 pt-3 border-t border-amber-200">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Mata Kuliah Yang Diakui</h4>
                        <button
                          type="button"
                          onClick={handleAddKonversiDetail}
                          className="text-xs font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 py-1 px-3 rounded-lg flex items-center gap-1.5 cursor-pointer transition"
                        >
                          <Plus size={14} /> Tambah Baris Mata Kuliah
                        </button>
                      </div>

                      {konversiForm.details.length === 0 ? (
                        <p className="text-xs text-center py-6 text-slate-400 italic">Belum ada mata kuliah yang disetarakan. Klik tombol di atas untuk menambah.</p>
                      ) : (
                        <div className="space-y-4">
                          {konversiForm.details.map((detail, idx) => (
                            <div key={idx} className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 relative shadow-2xs">
                              <button
                                type="button"
                                onClick={() => handleRemoveKonversiDetail(idx)}
                                className="absolute right-3 top-3 text-rose-600 hover:text-rose-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 size={12} /> Hapus Baris
                              </button>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-20">
                                <Input
                                  label="Kode MK Asal *"
                                  placeholder="e.g. INF-101"
                                  value={detail.kode_mk_asal}
                                  onChange={(e) => handleKonversiDetailChange(idx, 'kode_mk_asal', e.target.value)}
                                  required
                                />
                                <Input
                                  label="Nama MK Asal *"
                                  placeholder="e.g. Pemrograman Dasar"
                                  value={detail.nama_mk_asal}
                                  onChange={(e) => handleKonversiDetailChange(idx, 'nama_mk_asal', e.target.value)}
                                  required
                                />
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <Input
                                  label="SKS Asal *"
                                  type="number"
                                  min="1"
                                  value={detail.sks_asal}
                                  onChange={(e) => handleKonversiDetailChange(idx, 'sks_asal', parseInt(e.target.value) || 0)}
                                  required
                                />
                                <Input
                                  label="Nilai Huruf Asal *"
                                  placeholder="e.g. A, B+, C"
                                  value={detail.nilai_huruf_asal}
                                  onChange={(e) => handleKonversiDetailChange(idx, 'nilai_huruf_asal', e.target.value)}
                                  required
                                />
                                <div>
                                  <label className="label font-bold text-slate-700">Disetarakan Ke MK Lokal *</label>
                                  <select
                                    value={detail.mata_kuliah_diakui_id}
                                    onChange={(e) => handleKonversiDetailChange(idx, 'mata_kuliah_diakui_id', parseInt(e.target.value))}
                                    className="select w-full text-xs font-bold bg-white"
                                  >
                                    {matakuliahs.map((mk) => (
                                      <option key={mk.id} value={mk.id}>
                                        {mk.kode_mk} - {mk.nama} ({mk.total_sks} SKS)
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button
                        type="button"
                        variant="primary"
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-auto py-2 px-5 rounded-lg flex items-center gap-1.5"
                        onClick={handleSaveKonversi}
                        disabled={saving}
                      >
                        <Save size={14} /> Simpan Penyetaraan Konversi
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Save bottom bar for tabs 1-3 */}
            {activeTab !== 'riwayat' && (
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  icon={<Save size={15} />}
                  className="font-bold min-w-[160px] shadow-xs"
                  disabled={saving || syncingFeeder}
                >
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
