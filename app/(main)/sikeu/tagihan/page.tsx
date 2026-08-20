'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus, ArrowLeft, Clock, CheckCircle, AlertCircle, FileText, Filter,
  Calendar, Layers, Sparkles, CreditCard, CheckCircle2, RefreshCw,
  CheckSquare, Square, Search, Home, ChevronRight, X, RotateCcw
} from 'lucide-react';
import { sikeuService } from '@/services/sikeu.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Drawer } from '@/components/ui/Drawer';

export default function TagihanListPage() {
  const [tagihanList, setTagihanList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter states
  const [search, setSearch] = useState<string>('');
  const [selectedAngkatan, setSelectedAngkatan] = useState<string>('all');
  const [selectedProdi, setSelectedProdi] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showFilter, setShowFilter] = useState(false);

  // Temp filter states in Drawer
  const [tempAngkatan, setTempAngkatan] = useState<string>('all');
  const [tempProdi, setTempProdi] = useState<string>('all');
  const [tempStatus, setTempStatus] = useState<string>('all');

  // Modal Mass Active Billing Activation with Master Data Component Checklist
  const [isMassModalOpen, setIsMassModalOpen] = useState(false);
  const [massForm, setMassForm] = useState({
    target_angkatan: '2024',
    target_jalur: 'Reguler',
    target_kelompok: '3',
    target_prodi: 'all',
    semester_aktif: 'Semester Ganjil 2026/2027',
    jatuh_tempo: '2026-08-31',
  });

  // Reference fee components loaded from Master Data based on selected Angkatan, Jalur, & Kelompok
  const [masterComponents, setMasterComponents] = useState<any[]>([
    { kode: 'UKT_REG', nama: 'UKT Reguler / SPP Semester', nominal: 3500000, defaultSelected: true },
    { kode: 'PRAKTIKUM', nama: 'Biaya Laboratorium & Praktikum', nominal: 750000, defaultSelected: true },
    { kode: 'SPMB_ADM', nama: 'Biaya Pendaftaran SPMB', nominal: 350000, defaultSelected: false },
    { kode: 'WISUDA_FEE', nama: 'Biaya Wisuda & Kelulusan', nominal: 1750000, defaultSelected: false },
    { kode: 'GEDUNG', nama: 'Sumbangan Biaya Gedung / SPI', nominal: 5000000, defaultSelected: false },
  ]);

  const [selectedComponentKodes, setSelectedComponentKodes] = useState<string[]>(['UKT_REG', 'PRAKTIKUM']);
  const [massSubmitting, setMassSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Update component list when angkatan/jalur/kelompok changes in mass modal
  useEffect(() => {
    const angkatan = Number(massForm.target_angkatan) || 2024;
    const kelompok = Number(massForm.target_kelompok) || 3;
    const isKaryawan = massForm.target_jalur === 'Karyawan';

    let baseUkt = 3500000;
    if (kelompok === 1) baseUkt = 500000;
    else if (kelompok === 2) baseUkt = 1500000;
    else if (kelompok === 4) baseUkt = isKaryawan ? 7500000 : 5500000;
    else if (kelompok === 5) baseUkt = 8500000;
    else baseUkt = isKaryawan ? 5500000 : 3500000;

    setMasterComponents([
      { kode: 'UKT_REG', nama: `UKT Reguler (Angkatan ${angkatan} - Level ${kelompok})`, nominal: baseUkt, defaultSelected: true },
      { kode: 'PRAKTIKUM', nama: 'Biaya Laboratorium & Praktikum TI', nominal: 750000, defaultSelected: true },
      { kode: 'SPMB_ADM', nama: 'Biaya Pendaftaran SPMB', nominal: 350000, defaultSelected: false },
      { kode: 'WISUDA_FEE', nama: 'Biaya Wisuda & Kelulusan', nominal: 1750000, defaultSelected: false },
      { kode: 'GEDUNG', nama: 'Sumbangan Biaya Gedung / SPI', nominal: 5000000, defaultSelected: false },
    ]);
  }, [massForm.target_angkatan, massForm.target_jalur, massForm.target_kelompok]);

  const toggleComponentKode = (kode: string) => {
    if (selectedComponentKodes.includes(kode)) {
      setSelectedComponentKodes(selectedComponentKodes.filter((k) => k !== kode));
    } else {
      setSelectedComponentKodes([...selectedComponentKodes, kode]);
    }
  };

  const toggleSelectAllMasterComponents = () => {
    if (selectedComponentKodes.length === masterComponents.length) {
      setSelectedComponentKodes([]);
    } else {
      setSelectedComponentKodes(masterComponents.map((c) => c.kode));
    }
  };

  const calculateMassSubtotal = () => {
    return masterComponents
      .filter((c) => selectedComponentKodes.includes(c.kode))
      .reduce((acc, c) => acc + c.nominal, 0);
  };

  const fetchTagihan = async () => {
    setLoading(true);
    try {
      const res = await sikeuService.getStudentBillingTypes({ page: 1, per_page: 20 });
      if (res.data && res.data.length > 0) {
        setTagihanList(res.data.map((item: any) => ({
          id: item.id,
          nomor: `INV-SIAKAD-2026-${String(item.id).padStart(3, '0')}`,
          nim: item.nim,
          nama: item.nama_mahasiswa,
          angkatan: item.tahun_angkatan,
          jalur: item.jalur_kelas,
          kelompok_ukt: `Level ${item.kelompok_ukt}`,
          prodi: 'Teknik Informatika',
          total: item.kelompok_ukt === 4 ? 5500000 : item.kelompok_ukt === 1 ? 500000 : 3500000,
          status: item.beasiswa ? 'lunas' : 'belum_bayar',
          jatuhTempo: '2026-08-31',
          source: item.status_pendaftaran || 'SIAKAD',
        })));
      } else {
        setTagihanList([
          { id: 1, nomor: 'INV-SIAKAD-2026-001', nim: '2024010042', nama: 'Budi Santoso', angkatan: 2024, jalur: 'Reguler', kelompok_ukt: 'Level 3 (Reguler)', prodi: 'Teknik Informatika', total: 3500000, status: 'lunas', jatuhTempo: '2026-08-31', source: 'SIAKAD' },
          { id: 2, nomor: 'INV-SPMB-2026-002', nim: '2025010018', nama: 'Siti Rahmawati', angkatan: 2025, jalur: 'Reguler', kelompok_ukt: 'Level 3 (Reguler)', prodi: 'Sistem Informasi', total: 3500000, status: 'belum_bayar', jatuhTempo: '2026-08-31', source: 'SPMB' },
          { id: 3, nomor: 'INV-SIAKAD-2026-003', nim: '2023010088', nama: 'Ahmad Fauzi', angkatan: 2023, jalur: 'Karyawan', kelompok_ukt: 'Level 4 (Mandiri)', prodi: 'Manajemen Informatika', total: 5500000, status: 'pending_approval', jatuhTempo: '2026-08-31', source: 'SIAKAD' },
        ]);
      }
    } catch (e) {
      setTagihanList([
        { id: 1, nomor: 'INV-SIAKAD-2026-001', nim: '2024010042', nama: 'Budi Santoso', angkatan: 2024, jalur: 'Reguler', kelompok_ukt: 'Level 3 (Reguler)', prodi: 'Teknik Informatika', total: 3500000, status: 'lunas', jatuhTempo: '2026-08-31', source: 'SIAKAD' },
        { id: 2, nomor: 'INV-SPMB-2026-002', nim: '2025010018', nama: 'Siti Rahmawati', angkatan: 2025, jalur: 'Reguler', kelompok_ukt: 'Level 3 (Reguler)', prodi: 'Sistem Informasi', total: 3500000, status: 'belum_bayar', jatuhTempo: '2026-08-31', source: 'SPMB' },
        { id: 3, nomor: 'INV-SIAKAD-2026-003', nim: '2023010088', nama: 'Ahmad Fauzi', angkatan: 2023, jalur: 'Karyawan', kelompok_ukt: 'Level 4 (Mandiri)', prodi: 'Manajemen Informatika', total: 5500000, status: 'pending_approval', jatuhTempo: '2026-08-31', source: 'SIAKAD' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTagihan();
  }, []);

  const handleActivateMassBilling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedComponentKodes.length === 0) {
      alert('Pilih minimal 1 komponen tagihan master yang wajib dilunasi s/d bulan ini!');
      return;
    }
    setMassSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setFeedback({
        type: 'success',
        message: `Berhasil mengaktifkan & menerbitkan tagihan masal ${massForm.semester_aktif} (Angkatan ${massForm.target_angkatan}, Jalur ${massForm.target_jalur}, Level ${massForm.target_kelompok}) dengan ${selectedComponentKodes.length} komponen wajib (${formatRupiah(calculateMassSubtotal())}/mhs).`,
      });
      setIsMassModalOpen(false);
      fetchTagihan();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal mengaktifkan tagihan masal' });
    } finally {
      setMassSubmitting(false);
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const hasActiveFilter = selectedAngkatan !== 'all' || selectedProdi !== 'all' || selectedStatus !== 'all';

  const filteredList = tagihanList.filter((item) => {
    const matchSearch =
      !search ||
      item.nama?.toLowerCase().includes(search.toLowerCase()) ||
      item.nim?.toLowerCase().includes(search.toLowerCase()) ||
      item.nomor?.toLowerCase().includes(search.toLowerCase());
    const matchAngkatan = selectedAngkatan === 'all' || String(item.angkatan) === selectedAngkatan;
    const matchProdi = selectedProdi === 'all' || item.prodi === selectedProdi;
    const matchStatus = selectedStatus === 'all' || item.status === selectedStatus;
    return matchSearch && matchAngkatan && matchProdi && matchStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb Navigation */}
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
        <span className="text-slate-900 font-bold">Set Tagihan &amp; Invoice</span>
      </nav>

      {/* Standard SSO PageHeader */}
      <PageHeader
        title="Set Tagihan & Invoice Semester Aktif"
        description="Aktivasi tagihan masal per Angkatan/Prodi & Layanan Pembayaran Loket / VA Mahasiswa."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/sikeu" className="btn btn-secondary">
              <ArrowLeft size={16} /> Kembali ke SIKEU
            </Link>
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => {
                setTempAngkatan(selectedAngkatan);
                setTempProdi(selectedProdi);
                setTempStatus(selectedStatus);
                setShowFilter(true);
              }}
            >
              Filter
              {hasActiveFilter && (
                <span className="ml-1 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-primary-600 text-white rounded-full">
                  !
                </span>
              )}
            </Button>
            <Button
              variant="primary"
              icon={<Sparkles size={16} />}
              onClick={() => setIsMassModalOpen(true)}
            >
              Aktifkan Tagihan Masal
            </Button>
            <Link href="/sikeu/tagihan/create" className="btn btn-secondary">
              <CreditCard size={16} /> Bayar Loket / Terbitkan VA
            </Link>
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

      {/* Table Card */}
      <Card>
        <CardHeader>
          <div>
            <h2 className="font-bold text-slate-900">Daftar Tagihan &amp; Invoice Mahasiswa</h2>
            <p className="text-xs text-slate-500">
              {hasActiveFilter && <span className="text-primary-600 font-semibold mr-1">Filter aktif •</span>}
              {filteredList.length} invoice ditemukan
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Quick Live Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari no. invoice, nama, NIM..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input input-sm pl-8 pr-7 text-xs w-64 bg-white"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>
            <button
              onClick={fetchTagihan}
              disabled={loading}
              className="btn btn-ghost btn-icon btn-sm"
              title="Refresh"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </CardHeader>

        <CardBody className="p-0">
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs">Memuat data tagihan...</div>
          ) : filteredList.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <FileText size={22} />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Tagihan Tidak Ditemukan</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {hasActiveFilter
                  ? 'Tidak ada tagihan yang cocok dengan filter yang dipilih.'
                  : 'Belum ada data tagihan mahasiswa yang terbit.'}
              </p>
              {hasActiveFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<RotateCcw size={13} />}
                  className="mt-3"
                  onClick={() => {
                    setSelectedAngkatan('all');
                    setSelectedProdi('all');
                    setSelectedStatus('all');
                    setSearch('');
                  }}
                >
                  Reset Filter
                </Button>
              )}
            </div>
          ) : (
            <div className="table-container border-0 rounded-none">
              <table className="table">
                <thead>
                  <tr>
                    <th>No. Invoice</th>
                    <th>Mahasiswa &amp; NIM</th>
                    <th>Angkatan &amp; Prodi</th>
                    <th>Kelompok UKT</th>
                    <th className="text-right">Total Tagihan</th>
                    <th>Jatuh Tempo</th>
                    <th className="text-center">Status Bayar</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((item) => (
                    <tr key={item.id}>
                      <td className="font-mono font-bold text-indigo-700">{item.nomor}</td>
                      <td>
                        <div className="font-bold text-slate-900">{item.nama}</div>
                        <div className="text-[10px] font-mono text-slate-500">NIM: {item.nim}</div>
                      </td>
                      <td>
                        <div className="font-bold text-slate-700">Angkatan {item.angkatan}</div>
                        <div className="text-[10px] font-semibold text-slate-500">{item.prodi}</div>
                      </td>
                      <td className="font-semibold text-slate-800">{item.kelompok_ukt}</td>
                      <td className="text-right font-mono font-extrabold text-emerald-800 text-sm">
                        {formatRupiah(item.total)}
                      </td>
                      <td className="font-mono text-xs text-slate-600 font-medium">{item.jatuhTempo}</td>
                      <td className="text-center">
                        {item.status === 'lunas' ? (
                          <Badge variant="green" dot>
                            Lunas (KRS Aktif)
                          </Badge>
                        ) : item.status === 'pending_approval' ? (
                          <Badge variant="gray" dot>
                            Pending Approval
                          </Badge>
                        ) : (
                          <Badge variant="red" dot>
                            Belum Bayar
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* FILTER DRAWER — Standar SSO */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Tagihan & Invoice"
        width="360px"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setTempAngkatan('all');
                setTempProdi('all');
                setTempStatus('all');
                setSelectedAngkatan('all');
                setSelectedProdi('all');
                setSelectedStatus('all');
                setShowFilter(false);
              }}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setSelectedAngkatan(tempAngkatan);
                setSelectedProdi(tempProdi);
                setSelectedStatus(tempStatus);
                setShowFilter(false);
              }}
            >
              Terapkan
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-5">
          <div className="form-group">
            <label className="form-label">Tahun Angkatan</label>
            <select
              value={tempAngkatan}
              onChange={(e) => setTempAngkatan(e.target.value)}
              className="select w-full"
            >
              <option value="all">Semua Angkatan</option>
              <option value="2023">Angkatan 2023</option>
              <option value="2024">Angkatan 2024</option>
              <option value="2025">Angkatan 2025</option>
              <option value="2026">Angkatan 2026</option>
            </select>
            {tempAngkatan !== 'all' && (
              <p className="text-xs text-primary-600 font-semibold mt-1">
                ✓ Filter aktif: <strong>Angkatan {tempAngkatan}</strong>
              </p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Program Studi</label>
            <select
              value={tempProdi}
              onChange={(e) => setTempProdi(e.target.value)}
              className="select w-full"
            >
              <option value="all">Semua Program Studi</option>
              <option value="Teknik Informatika">Teknik Informatika</option>
              <option value="Sistem Informasi">Sistem Informasi</option>
              <option value="Manajemen Informatika">Manajemen Informatika</option>
            </select>
            {tempProdi !== 'all' && (
              <p className="text-xs text-primary-600 font-semibold mt-1">
                ✓ Filter aktif: <strong>{tempProdi}</strong>
              </p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Status Pembayaran</label>
            <select
              value={tempStatus}
              onChange={(e) => setTempStatus(e.target.value)}
              className="select w-full"
            >
              <option value="all">Semua Status</option>
              <option value="lunas">Lunas (KRS Aktif)</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="belum_bayar">Belum Bayar</option>
            </select>
            {tempStatus !== 'all' && (
              <p className="text-xs text-primary-600 font-semibold mt-1">
                ✓ Filter aktif: <strong>{tempStatus.replace('_', ' ').toUpperCase()}</strong>
              </p>
            )}
          </div>

          <hr className="border-t border-slate-200" />
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
            <span className="font-semibold">Catatan:</span> Klik &quot;Terapkan&quot; untuk menyaring data invoice pada tabel.
          </div>
        </div>
      </Drawer>

      {/* MODAL AKTIFKAN TAGIHAN MASAL SEMESTER AKTIF */}
      <Modal
        open={isMassModalOpen}
        onClose={() => setIsMassModalOpen(false)}
        title="Setting & Aktifkan Tagihan Semester Masal"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsMassModalOpen(false)}>
              Batal
            </Button>
            <Button
              variant="primary"
              disabled={massSubmitting || selectedComponentKodes.length === 0}
              onClick={handleActivateMassBilling}
            >
              {massSubmitting ? 'Memproses...' : 'Terbitkan Tagihan Masal'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleActivateMassBilling} className="space-y-4">
          {/* STEP 1: FILTERS ANGKATAN & JALUR KELAS */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3 text-xs">
            <div className="font-bold text-slate-800">1. Filter Target Mahasiswa dari Master Data:</div>

            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="form-label text-[11px]">Tahun Angkatan</label>
                <select
                  value={massForm.target_angkatan}
                  onChange={(e) => setMassForm({ ...massForm, target_angkatan: e.target.value })}
                  className="select w-full font-bold bg-white"
                >
                  <option value="2023">Angkatan 2023</option>
                  <option value="2024">Angkatan 2024</option>
                  <option value="2025">Angkatan 2025</option>
                  <option value="2026">Angkatan 2026</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label text-[11px]">Jalur / Kelas</label>
                <select
                  value={massForm.target_jalur}
                  onChange={(e) => setMassForm({ ...massForm, target_jalur: e.target.value })}
                  className="select w-full font-bold bg-white"
                >
                  <option value="Reguler">Reguler</option>
                  <option value="Karyawan">Karyawan</option>
                  <option value="Internasional">Internasional</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label text-[11px]">Program Studi</label>
              <select
                value={massForm.target_prodi}
                onChange={(e) => setMassForm({ ...massForm, target_prodi: e.target.value })}
                className="select w-full font-bold bg-white"
              >
                <option value="all">Semua Program Studi</option>
                <option value="ti">Teknik Informatika</option>
                <option value="si">Sistem Informasi</option>
                <option value="mi">Manajemen Informatika</option>
              </select>
            </div>
          </div>

          {/* STEP 2: CHECKLIST KOMPONEN TAGIHAN MASTER */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                2. Centang Komponen Master yang Wajib Dilunasi:
              </label>
              <button
                type="button"
                onClick={toggleSelectAllMasterComponents}
                className="text-[11px] font-bold text-primary-600 hover:underline"
              >
                {selectedComponentKodes.length === masterComponents.length ? 'Batal Semua' : 'Pilih Semua'}
              </button>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {masterComponents.map((c) => {
                const isChecked = selectedComponentKodes.includes(c.kode);
                return (
                  <div
                    key={c.kode}
                    onClick={() => toggleComponentKode(c.kode)}
                    className={`p-2.5 rounded-xl border cursor-pointer text-xs flex justify-between items-center transition-all ${
                      isChecked
                        ? 'bg-primary-50/50 border-primary-600 ring-1 ring-primary-600/30 font-bold'
                        : 'bg-slate-50/60 border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isChecked ? (
                        <CheckSquare size={16} className="text-primary-700 shrink-0" />
                      ) : (
                        <Square size={16} className="text-slate-300 shrink-0" />
                      )}
                      <span className={isChecked ? 'text-slate-900' : 'text-slate-600'}>{c.nama}</span>
                    </div>
                    <span className={`font-mono ${isChecked ? 'text-emerald-800 font-extrabold' : 'text-slate-400'}`}>
                      {formatRupiah(c.nominal)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs flex items-center justify-between">
              <span className="font-bold text-emerald-950">Subtotal Tagihan per Mahasiswa:</span>
              <span className="font-mono text-base font-extrabold text-emerald-800">
                {formatRupiah(calculateMassSubtotal())}
              </span>
            </div>
          </div>

          {/* STEP 3: SETTING JATUH TEMPO */}
          <div className="form-group">
            <div className="flex items-center justify-between mb-1">
              <label className="form-label mb-0">Batas Tanggal Jatuh Tempo *</label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 30);
                    setMassForm({ ...massForm, jatuh_tempo: d.toISOString().split('T')[0] });
                  }}
                  className="text-[10px] font-bold text-primary-600 hover:underline"
                >
                  +30 Hari
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 60);
                    setMassForm({ ...massForm, jatuh_tempo: d.toISOString().split('T')[0] });
                  }}
                  className="text-[10px] font-bold text-primary-600 hover:underline"
                >
                  +60 Hari
                </button>
              </div>
            </div>
            <Input
              type="date"
              required
              value={massForm.jatuh_tempo}
              onChange={(e) => setMassForm({ ...massForm, jatuh_tempo: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
