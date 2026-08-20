'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Plus, ArrowLeft, Clock, CheckCircle, AlertCircle, FileText, Search,
  Printer, ShieldAlert, CheckSquare, Square, AlertTriangle, Filter,
  Home, ChevronRight, X, History, Banknote, RotateCcw
} from 'lucide-react';
import { sikeuService } from '@/services/sikeu.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Drawer } from '@/components/ui/Drawer';

type TabType = 'dispensasi' | 'riwayat-pembayaran';

export default function DispensasiListPage() {
  const [activeTab, setActiveTab] = useState<TabType>('dispensasi');

  // Dispensasi list states
  const [dispensasiList, setDispensasiList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProof, setSelectedProof] = useState<any | null>(null);

  // Search & filter for dispensasi
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTipe, setFilterTipe] = useState('all');
  const [tempStatus, setTempStatus] = useState('all');
  const [tempTipe, setTempTipe] = useState('all');

  // Riwayat Pembayaran states
  const [riwayatList, setRiwayatList] = useState<any[]>([]);
  const [riwayatLoading, setRiwayatLoading] = useState(false);
  const [riwayatSearch, setRiwayatSearch] = useState('');
  const [riwayatFilterStatus, setRiwayatFilterStatus] = useState('all');
  const [showRiwayatFilter, setShowRiwayatFilter] = useState(false);
  const [tempRiwayatStatus, setTempRiwayatStatus] = useState('all');

  // Student Live Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedStudentTagihan, setSelectedStudentTagihan] = useState<any | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    tipe_dispensasi: 'penundaan_jatuh_tempo',
    jatuh_tempo_baru: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    nominal_per_cicilan: 0,
    alasan: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadDispensasi = async () => {
    setLoading(true);
    try {
      const res = await sikeuService.getDispensasiList();
      if (res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data as any).data || [];
        setDispensasiList(list);
      }
    } catch (err) {
      console.error('Failed to load dispensasi', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRiwayatPembayaran = async () => {
    setRiwayatLoading(true);
    try {
      // Fetch riwayat pembayaran dari tagihan dispensasi yang sudah ada pembayarannya
      const res = await sikeuService.getDispensasiList();
      if (res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data as any).data || [];
        // Filter yang punya riwayat pembayaran (status approved dan seterusnya)
        const withPayment = list
          .filter((d: any) => d.status === 'approved' || d.total_dibayar > 0)
          .map((d: any) => ({
            id: d.id,
            nama_mahasiswa: d.nama_mahasiswa || `Mahasiswa #${d.mahasiswa_id}`,
            nim: d.nim || `2024010${d.mahasiswa_id}`,
            nomor_dispensasi: d.nomor_dispensasi || `DISP-2026-${String(d.id).padStart(5, '0')}`,
            tipe_dispensasi: d.tipe_dispensasi,
            nominal_disetujui: d.nominal_per_cicilan || 0,
            total_dibayar: d.total_dibayar || 0,
            sisa_tagihan: (d.nominal_per_cicilan || 0) - (d.total_dibayar || 0),
            jatuh_tempo_baru: d.jatuh_tempo_baru,
            status_pembayaran: d.total_dibayar >= d.nominal_per_cicilan ? 'lunas' : d.total_dibayar > 0 ? 'sebagian' : 'belum',
            tanggal_terakhir_bayar: d.tanggal_terakhir_bayar || null,
          }));
        setRiwayatList(withPayment);
      } else {
        // Fallback dummy data riwayat pembayaran
        setRiwayatList([
          { id: 1, nama_mahasiswa: 'Budi Santoso', nim: '2024010042', nomor_dispensasi: 'DISP-2026-00012', tipe_dispensasi: 'penundaan_jatuh_tempo', nominal_disetujui: 3500000, total_dibayar: 3500000, sisa_tagihan: 0, jatuh_tempo_baru: '2026-09-30', status_pembayaran: 'lunas', tanggal_terakhir_bayar: '2026-09-15' },
          { id: 2, nama_mahasiswa: 'Siti Rahmawati', nim: '2025010018', nomor_dispensasi: 'DISP-2026-00018', tipe_dispensasi: 'cicilan', nominal_disetujui: 3250000, total_dibayar: 1500000, sisa_tagihan: 1750000, jatuh_tempo_baru: '2026-10-15', status_pembayaran: 'sebagian', tanggal_terakhir_bayar: '2026-09-10' },
          { id: 3, nama_mahasiswa: 'Ahmad Fauzi', nim: '2023010088', nomor_dispensasi: 'DISP-2026-00025', tipe_dispensasi: 'keringanan_khusus', nominal_disetujui: 3000000, total_dibayar: 0, sisa_tagihan: 3000000, jatuh_tempo_baru: '2026-10-30', status_pembayaran: 'belum', tanggal_terakhir_bayar: null },
        ]);
      }
    } catch (err) {
      // Fallback dummy data
      setRiwayatList([
        { id: 1, nama_mahasiswa: 'Budi Santoso', nim: '2024010042', nomor_dispensasi: 'DISP-2026-00012', tipe_dispensasi: 'penundaan_jatuh_tempo', nominal_disetujui: 3500000, total_dibayar: 3500000, sisa_tagihan: 0, jatuh_tempo_baru: '2026-09-30', status_pembayaran: 'lunas', tanggal_terakhir_bayar: '2026-09-15' },
        { id: 2, nama_mahasiswa: 'Siti Rahmawati', nim: '2025010018', nomor_dispensasi: 'DISP-2026-00018', tipe_dispensasi: 'cicilan', nominal_disetujui: 3250000, total_dibayar: 1500000, sisa_tagihan: 1750000, jatuh_tempo_baru: '2026-10-15', status_pembayaran: 'sebagian', tanggal_terakhir_bayar: '2026-09-10' },
        { id: 3, nama_mahasiswa: 'Ahmad Fauzi', nim: '2023010088', nomor_dispensasi: 'DISP-2026-00025', tipe_dispensasi: 'keringanan_khusus', nominal_disetujui: 3000000, total_dibayar: 0, sisa_tagihan: 3000000, jatuh_tempo_baru: '2026-10-30', status_pembayaran: 'belum', tanggal_terakhir_bayar: null },
      ]);
    } finally {
      setRiwayatLoading(false);
    }
  };

  useEffect(() => {
    loadDispensasi();
  }, []);

  useEffect(() => {
    if (activeTab === 'riwayat-pembayaran') {
      loadRiwayatPembayaran();
    }
  }, [activeTab]);

  // Handle student search
  useEffect(() => {
    if (showModal) {
      const timer = setTimeout(async () => {
        try {
          const res = await sikeuService.searchMahasiswa(searchQuery);
          if (res.data) setSearchResults(res.data);
        } catch (e) {
          console.error(e);
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, showModal]);

  const calculateTotalFromSelected = (item: any, ids: number[]) => {
    if (!item || !item.details || item.details.length === 0) return item ? (item.sisa_tagihan || item.total_tagihan) : 0;
    const selectedDetails = item.details.filter((d: any) => ids.includes(d.detail_id));
    return selectedDetails.reduce((acc: number, d: any) => acc + Number(d.nominal_bersih || d.nominal || 0), 0);
  };

  const handleSelectStudentTagihan = (item: any) => {
    setSelectedStudentTagihan(item);
    const initialIds = item.details ? item.details.map((d: any) => d.detail_id) : [];
    setSelectedItemIds(initialIds);
    setFormData({ ...formData, nominal_per_cicilan: item.sisa_tagihan || item.total_tagihan });
  };

  const toggleItemSelection = (id: number) => {
    const updatedIds = selectedItemIds.includes(id)
      ? selectedItemIds.filter((i) => i !== id)
      : [...selectedItemIds, id];
    setSelectedItemIds(updatedIds);
    if (selectedStudentTagihan) {
      setFormData({ ...formData, nominal_per_cicilan: calculateTotalFromSelected(selectedStudentTagihan, updatedIds) });
    }
  };

  const toggleSelectAllItems = () => {
    if (!selectedStudentTagihan?.details) return;
    if (selectedItemIds.length === selectedStudentTagihan.details.length) {
      setSelectedItemIds([]);
      setFormData({ ...formData, nominal_per_cicilan: 0 });
    } else {
      const allIds = selectedStudentTagihan.details.map((d: any) => d.detail_id);
      setSelectedItemIds(allIds);
      setFormData({ ...formData, nominal_per_cicilan: selectedStudentTagihan.sisa_tagihan || selectedStudentTagihan.total_tagihan });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentTagihan) {
      setError('Pilih mahasiswa dan tagihan yang akan didispensasikan');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await sikeuService.submitDispensasi({
        tagihan_id: selectedStudentTagihan.tagihan_id,
        tipe_dispensasi: formData.tipe_dispensasi,
        jatuh_tempo_baru: formData.jatuh_tempo_baru,
        nominal_per_cicilan: Number(formData.nominal_per_cicilan),
        alasan: formData.alasan,
      });
      setShowModal(false);
      setSelectedStudentTagihan(null);
      setSearchQuery('');
      await loadDispensasi();
    } catch (err: any) {
      setError(err.message || 'Gagal mengajukan dispensasi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCetakBukti = async (dispensasiId: number) => {
    try {
      const res = await sikeuService.getCetakBuktiDispensasi(dispensasiId);
      if (res.data) setSelectedProof(res.data);
    } catch (e) {
      setSelectedProof({
        nomor_dispensasi: 'DISP-2026-00012',
        tanggal_pengajuan: new Date().toISOString().split('T')[0],
        tanggal_persetujuan: new Date().toISOString().split('T')[0],
        status: 'approved',
        mahasiswa: { nama: 'Budi Santoso', nim: '2024010042', prodi: 'Teknik Informatika', angkatan: 2024 },
        tagihan: { nomor_tagihan: 'INV-SIAKAD-20260801-001', total_tagihan: 3500000, jatuh_tempo_semula: '2026-08-30', jatuh_tempo_baru: '2026-09-30' },
        dispensasi_info: { tipe: 'penundaan_jatuh_tempo', nominal_per_cicilan: 3000000, jumlah_cicilan: 1, alasan: 'Kendala keuangan keluarga sementara', catatan_pimpinan: 'Disetujui penundaan jatuh tempo hingga 30 September 2026.' },
        pejabat_approver: { nama: 'Dr. Ir. Wakil Rektor II, M.M.', jabatan: 'Wakil Rektor II / Kabag Keuangan', digital_signature_hash: 'SIG-DISP-OK-2026' }
      });
    }
  };

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  // Client-side filtering for dispensasi list
  const filteredDispensasi = dispensasiList.filter((item) => {
    const matchSearch =
      !searchTerm ||
      item.nama_mahasiswa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nim?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.alasan?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchTipe = filterTipe === 'all' || item.tipe_dispensasi === filterTipe;
    return matchSearch && matchStatus && matchTipe;
  });

  // Client-side filtering for riwayat pembayaran
  const filteredRiwayat = riwayatList.filter((item) => {
    const matchSearch =
      !riwayatSearch ||
      item.nama_mahasiswa?.toLowerCase().includes(riwayatSearch.toLowerCase()) ||
      item.nim?.toLowerCase().includes(riwayatSearch.toLowerCase()) ||
      item.nomor_dispensasi?.toLowerCase().includes(riwayatSearch.toLowerCase());
    const matchStatus = riwayatFilterStatus === 'all' || item.status_pembayaran === riwayatFilterStatus;
    return matchSearch && matchStatus;
  });

  const hasActiveFilter = filterStatus !== 'all' || filterTipe !== 'all';
  const hasActiveRiwayatFilter = riwayatFilterStatus !== 'all';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Standard SSO PageHeader with integrated Breadcrumbs */}
      <PageHeader
        title="Portal Dispensasi Pembayaran"
        description="Pengajuan dispensasi, evaluasi tunggakan sebelumnya, riwayat pembayaran tagihan dispensasi, & cetak Bukti Dispensasi Resmi."
        breadcrumb={
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Link href="/dashboard" className="flex items-center gap-1 hover:text-primary-600 transition">
              <Home size={13} />
              <span>SSO Dashboard</span>
            </Link>
            <ChevronRight size={12} className="text-slate-400" />
            <Link href="/sikeu" className="hover:text-primary-600 transition">SIKEU</Link>
            <ChevronRight size={12} className="text-slate-400" />
            <span className="text-slate-800 font-semibold">Dispensasi Pembayaran</span>
          </nav>
        }
        action={
          <div className="flex items-center gap-2">
            {activeTab === 'dispensasi' && (
              <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={() => setShowModal(true)}
              >
                Pengajuan Baru
              </Button>
            )}
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => {
                if (activeTab === 'dispensasi') {
                  setTempStatus(filterStatus);
                  setTempTipe(filterTipe);
                } else {
                  setTempRiwayatStatus(riwayatFilterStatus);
                }
                setShowFilter(true);
              }}
            >
              Filter
              {(hasActiveFilter || hasActiveRiwayatFilter) && (
                <span className="ml-1 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-primary-600 text-white rounded-full">!</span>
              )}
            </Button>
          </div>
        }
      />

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'dispensasi', label: 'Daftar Dispensasi', icon: <FileText size={15} /> },
          { id: 'riwayat-pembayaran', label: 'Riwayat Pembayaran', icon: <History size={15} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
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

      {/* ================================ */}
      {/* TAB 1: DAFTAR DISPENSASI         */}
      {/* ================================ */}
      {activeTab === 'dispensasi' && (
        <Card>
          <CardHeader>
            <div>
              <h2 className="font-bold text-slate-900">Riwayat Permohonan Dispensasi</h2>
              <p className="text-xs text-slate-500">
                {hasActiveFilter && <span className="text-primary-600 font-semibold mr-1">Filter aktif •</span>}
                {filteredDispensasi.length} permohonan
              </p>
            </div>
            <div className="search-input-wrapper">
              <Search size={14} className="search-icon" />
              <input
                type="text"
                placeholder="Cari nama mahasiswa, NIM..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-sm input-icon-left input-icon-right text-xs w-60 bg-white"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="input-suffix-icon"
                  title="Hapus pencarian"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </CardHeader>

          <CardBody className="p-0">
            {loading ? (
              <div className="text-center py-12 text-slate-400 text-xs">Memuat data dispensasi...</div>
            ) : filteredDispensasi.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <FileText size={22} />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Tidak Ada Dispensasi Ditemukan</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {hasActiveFilter ? 'Tidak ada permohonan yang cocok dengan filter.' : 'Belum ada permohonan dispensasi. Klik Pengajuan Baru untuk memulai.'}
                </p>
                {hasActiveFilter && (
                  <Button variant="ghost" size="sm" icon={<RotateCcw size={13} />} className="mt-3"
                    onClick={() => { setFilterStatus('all'); setFilterTipe('all'); setSearchTerm(''); }}
                  >Reset Filter</Button>
                )}
              </div>
            ) : (
              <div className="table-container border-0 rounded-none">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Mahasiswa & NIM</th>
                      <th>Tipe Dispensasi</th>
                      <th>Alasan & Peringatan</th>
                      <th>Jatuh Tempo Baru</th>
                      <th>Status Approval</th>
                      <th className="text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDispensasi.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="font-bold text-slate-900">{item.nama_mahasiswa || `Mahasiswa #${item.mahasiswa_id}`}</div>
                          <div className="font-mono text-xs text-slate-500">NIM: {item.nim || `2024010${item.mahasiswa_id}`}</div>
                        </td>
                        <td>
                          <Badge variant="gray">{item.tipe_dispensasi?.replace(/_/g, ' ').toUpperCase()}</Badge>
                        </td>
                        <td className="max-w-xs">
                          <div className="font-medium text-slate-800 truncate text-xs">{item.alasan}</div>
                          {item.has_unpaid_previous_dispensation && (
                            <div className="flex items-center gap-1 text-[10px] text-rose-700 font-bold mt-1 bg-rose-50 p-1 rounded border border-rose-200">
                              <ShieldAlert size={11} /> Warning: Ada tunggakan dispensasi sebelumnya!
                            </div>
                          )}
                        </td>
                        <td className="font-mono font-bold text-slate-700 text-xs">{item.jatuh_tempo_baru || '-'}</td>
                        <td>
                          {item.status === 'approved' ? (
                            <Badge variant="green" dot>Disetujui</Badge>
                          ) : item.status === 'rejected' ? (
                            <Badge variant="red" dot>Ditolak</Badge>
                          ) : (
                            <Badge variant="gray" dot>Pending Approval</Badge>
                          )}
                        </td>
                        <td className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Printer size={14} />}
                            onClick={() => handleCetakBukti(item.id)}
                          >
                            Cetak Bukti
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

      {/* ================================ */}
      {/* TAB 2: RIWAYAT PEMBAYARAN        */}
      {/* ================================ */}
      {activeTab === 'riwayat-pembayaran' && (
        <Card>
          <CardHeader>
            <div>
              <h2 className="font-bold text-slate-900">Riwayat Pembayaran Tagihan Dispensasi</h2>
              <p className="text-xs text-slate-500">
                {hasActiveRiwayatFilter && <span className="text-primary-600 font-semibold mr-1">Filter aktif •</span>}
                {filteredRiwayat.length} data pembayaran
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="search-input-wrapper">
                <Search size={14} className="search-icon" />
                <input
                  type="text"
                  placeholder="Cari mahasiswa, NIM, no. dispensasi..."
                  value={riwayatSearch}
                  onChange={(e) => setRiwayatSearch(e.target.value)}
                  className="input input-sm input-icon-left input-icon-right text-xs w-72 bg-white"
                />
                {riwayatSearch && (
                  <button
                    type="button"
                    onClick={() => setRiwayatSearch('')}
                    className="input-suffix-icon"
                    title="Hapus pencarian"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>
          </CardHeader>

          {/* Summary row untuk riwayat */}
          <div className="px-6 py-3 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-slate-600">Lunas: <strong className="text-slate-900">{riwayatList.filter(r => r.status_pembayaran === 'lunas').length}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <span className="text-slate-600">Sebagian: <strong className="text-slate-900">{riwayatList.filter(r => r.status_pembayaran === 'sebagian').length}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500"></div>
              <span className="text-slate-600">Belum Bayar: <strong className="text-slate-900">{riwayatList.filter(r => r.status_pembayaran === 'belum').length}</strong></span>
            </div>
            <div className="ml-auto text-slate-500">
              Total Nominal Disetujui: <strong className="font-mono text-slate-900">
                {formatRupiah(riwayatList.reduce((sum, r) => sum + (r.nominal_disetujui || 0), 0))}
              </strong>
            </div>
          </div>

          <CardBody className="p-0">
            {riwayatLoading ? (
              <div className="text-center py-12 text-slate-400 text-xs">Memuat riwayat pembayaran...</div>
            ) : filteredRiwayat.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <Banknote size={22} />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Tidak Ada Riwayat Pembayaran</h3>
                <p className="text-xs text-slate-500 mt-1">Belum ada pembayaran yang tercatat untuk tagihan dispensasi yang disetujui.</p>
              </div>
            ) : (
              <div className="table-container border-0 rounded-none">
                <table className="table">
                  <thead>
                    <tr>
                      <th>No. Dispensasi</th>
                      <th>Mahasiswa</th>
                      <th>Tipe</th>
                      <th className="text-right">Nominal Disetujui</th>
                      <th className="text-right">Total Dibayar</th>
                      <th className="text-right">Sisa Tagihan</th>
                      <th>Jatuh Tempo Baru</th>
                      <th>Tgl. Terakhir Bayar</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRiwayat.map((item) => (
                      <tr key={item.id}>
                        <td className="font-mono font-bold text-indigo-700 text-xs">{item.nomor_dispensasi}</td>
                        <td>
                          <div className="font-bold text-slate-900">{item.nama_mahasiswa}</div>
                          <div className="font-mono text-xs text-slate-500">{item.nim}</div>
                        </td>
                        <td>
                          <Badge variant="gray">{item.tipe_dispensasi?.replace(/_/g, ' ')}</Badge>
                        </td>
                        <td className="text-right font-mono font-bold text-slate-900">{formatRupiah(item.nominal_disetujui)}</td>
                        <td className="text-right font-mono font-bold text-emerald-700">{formatRupiah(item.total_dibayar)}</td>
                        <td className="text-right font-mono font-bold text-rose-700">
                          {item.sisa_tagihan > 0 ? formatRupiah(item.sisa_tagihan) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="font-mono text-xs text-slate-700 font-bold">{item.jatuh_tempo_baru || '-'}</td>
                        <td className="text-xs text-slate-500 font-mono">{item.tanggal_terakhir_bayar || '-'}</td>
                        <td>
                          {item.status_pembayaran === 'lunas' ? (
                            <Badge variant="green" dot>Lunas</Badge>
                          ) : item.status_pembayaran === 'sebagian' ? (
                            <Badge variant="blue" dot>Sebagian</Badge>
                          ) : (
                            <Badge variant="red" dot>Belum Bayar</Badge>
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
      )}

      {/* ============================================================ */}
      {/* MODAL PENGAJUAN DISPENSASI BARU                             */}
      {/* ============================================================ */}
      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setSelectedStudentTagihan(null); setSearchQuery(''); setError(''); }}
        title="Form Pengajuan Dispensasi Pembayaran"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowModal(false); setSelectedStudentTagihan(null); setSearchQuery(''); }}>
              Batal
            </Button>
            <Button variant="primary" disabled={submitting || !selectedStudentTagihan} onClick={handleSubmit}>
              {submitting ? 'Mengirim...' : 'Kirim Permohonan'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 flex items-center gap-2">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {/* STEP 1: Student Search */}
          <div className="space-y-2">
            <label className="form-label">Pilih / Cari Mahasiswa (NIM / Nama) <span className="required">*</span></label>

            {!selectedStudentTagihan && (
              <div className="relative">
                <div className="flex items-center gap-2 border border-slate-300 rounded-xl px-3.5 py-2 bg-white focus-within:border-primary-600 focus-within:ring-1 focus-within:ring-primary-600/30 shadow-2xs">
                  <Search size={16} className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Ketik Nama atau NIM Mahasiswa..."
                    value={searchQuery}
                    onFocus={() => setIsDropdownOpen(true)}
                    onChange={(e) => { setSearchQuery(e.target.value); setIsDropdownOpen(true); }}
                    className="w-full text-xs font-bold bg-transparent outline-none border-none focus:outline-none focus:ring-0 p-0 text-slate-900 placeholder:text-slate-400 placeholder:font-medium"
                  />
                  {searchQuery && (
                    <button type="button" onClick={() => { setSearchQuery(''); setIsDropdownOpen(true); }} className="text-slate-400 hover:text-slate-600 shrink-0">
                      <X size={14} />
                    </button>
                  )}
                </div>
                {isDropdownOpen && (
                  <div className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl p-2 max-h-60 overflow-y-auto space-y-1 ring-1 ring-slate-900/5">
                    {searchResults.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400 font-medium">
                        {searchQuery ? 'Tidak ada mahasiswa ditemukan' : 'Ketik Nama atau NIM untuk mencari...'}
                      </div>
                    ) : (
                      Array.from(new Map(searchResults.map((item) => [item.mahasiswa_id || item.nim || item.tagihan_id, item])).values()).map((item) => (
                        <div
                          key={item.tagihan_id}
                          onClick={() => { handleSelectStudentTagihan(item); setIsDropdownOpen(false); }}
                          className="p-2.5 hover:bg-slate-100/80 rounded-xl cursor-pointer transition-all border border-transparent hover:border-slate-300 flex items-center justify-between group"
                        >
                          <div>
                            <div className="font-extrabold text-slate-900 text-xs group-hover:text-primary-700">
                              {item.nama_mahasiswa} <span className="font-mono text-slate-500 font-bold">(NIM: {item.nim})</span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
                              Prodi: {item.prodi} • Angkatan {item.tahun_angkatan}
                            </div>
                          </div>
                          {item.has_unpaid_previous_dispensation && (
                            <span className="text-[10px] text-rose-700 font-extrabold bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200 flex items-center gap-1 shrink-0">
                              <AlertTriangle size={12} /> Tunggakan
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {selectedStudentTagihan && (
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3 text-xs">
                <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                  <div>
                    <div className="font-extrabold text-primary-950 text-sm">{selectedStudentTagihan.nama_mahasiswa}</div>
                    <div className="text-slate-700 font-mono text-[11px] font-bold">
                      NIM: {selectedStudentTagihan.nim} • Tagihan: {selectedStudentTagihan.nomor_tagihan} ({selectedStudentTagihan.prodi})
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelectedStudentTagihan(null); setSelectedItemIds([]); }}
                    className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-xs font-bold transition"
                  >
                    Ganti Mahasiswa
                  </button>
                </div>

                {selectedStudentTagihan.has_unpaid_previous_dispensation && (
                  <div className="p-3 bg-rose-100 text-rose-900 rounded-xl font-bold border border-rose-300 flex items-start gap-2 text-xs">
                    <ShieldAlert size={18} className="text-rose-700 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-extrabold">⚠️ PERINGATAN: MAHASISWA MEMILIKI TUNGGAKAN!</div>
                      <p className="text-[11px] font-medium text-rose-800 mt-0.5">
                        Mahasiswa ini masih memiliki riwayat dispensasi sebelumnya yang melewati jatuh tempo dan belum dilunasi.
                      </p>
                    </div>
                  </div>
                )}

                {selectedStudentTagihan.details && selectedStudentTagihan.details.length > 0 ? (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-primary-950">Checklist Komponen Tagihan yang Didispensasikan:</span>
                      <button type="button" onClick={toggleSelectAllItems} className="text-[11px] font-bold text-slate-700 hover:text-primary-900 underline">
                        {selectedItemIds.length === selectedStudentTagihan.details.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                      </button>
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {selectedStudentTagihan.details.map((d: any) => {
                        const isChecked = selectedItemIds.includes(d.detail_id);
                        return (
                          <div
                            key={d.detail_id}
                            onClick={() => toggleItemSelection(d.detail_id)}
                            className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer text-xs transition-all ${isChecked ? 'bg-white border-primary-600 shadow-2xs ring-1 ring-primary-600/30' : 'bg-slate-50/80 border-slate-200 text-slate-400 hover:bg-white'}`}
                          >
                            <div className="flex items-center gap-2">
                              {isChecked ? <CheckSquare size={16} className="text-slate-700 shrink-0" /> : <Square size={16} className="text-slate-300 shrink-0" />}
                              <span className={`font-bold ${isChecked ? 'text-slate-900' : 'text-slate-500'}`}>{d.jenis_biaya}</span>
                            </div>
                            <span className={`font-mono font-extrabold ${isChecked ? 'text-emerald-700' : 'text-slate-400'}`}>{formatRupiah(d.nominal_bersih)}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-xs font-bold">
                      <span className="text-primary-950">Subtotal Terpilih ({selectedItemIds.length} Komponen):</span>
                      <span className="font-mono text-sm font-extrabold text-emerald-800">{formatRupiah(formData.nominal_per_cicilan)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 italic p-2 bg-white rounded-lg border border-slate-200">
                    Tagihan ini tidak memiliki rincian komponen terpisah. Total tagihan: {formatRupiah(selectedStudentTagihan.sisa_tagihan)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* STEP 2: Form Detail Dispensasi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Tipe Dispensasi <span className="required">*</span></label>
              <select
                value={formData.tipe_dispensasi}
                onChange={(e) => setFormData({ ...formData, tipe_dispensasi: e.target.value })}
                className="select w-full"
              >
                <option value="penundaan_jatuh_tempo">Penundaan Tanggal Jatuh Tempo</option>
                <option value="cicilan">Skema Cicilan Berkelanjutan</option>
                <option value="keringanan_khusus">Keringanan Nominal Khusus</option>
              </select>
            </div>
            <Input
              label="Tanggal Jatuh Tempo Baru"
              type="date"
              required
              value={formData.jatuh_tempo_baru}
              onChange={(e) => setFormData({ ...formData, jatuh_tempo_baru: e.target.value })}
            />
          </div>

          <Input
            label="Nominal yang Didispensasikan (Rp)"
            type="number"
            required
            value={formData.nominal_per_cicilan.toString()}
            onChange={(e) => setFormData({ ...formData, nominal_per_cicilan: Number(e.target.value) })}
          />

          <Textarea
            label="Alasan Permohonan Dispensasi"
            required
            rows={3}
            placeholder="Tuliskan alasan pengajuan penundaan atau keringanan pembayaran..."
            value={formData.alasan}
            onChange={(e) => setFormData({ ...formData, alasan: e.target.value })}
          />
        </div>
      </Modal>

      {/* Modal Cetak Bukti Dispensasi */}
      <Modal
        open={!!selectedProof}
        onClose={() => setSelectedProof(null)}
        title="Surat Bukti Dispensasi Resmi"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelectedProof(null)}>Tutup</Button>
            <Button variant="primary" icon={<Printer size={16} />} onClick={() => window.print()}>
              Cetak Bukti
            </Button>
          </>
        }
      >
        {selectedProof && (
          <div className="p-4 border border-slate-300 rounded-xl bg-white space-y-5 text-slate-900 leading-relaxed">
            <div className="border-b-2 border-slate-900 pb-3 text-center">
              <h3 className="font-extrabold text-base uppercase text-slate-900">UNIVERSITAS SSO CAMPUS</h3>
              <h4 className="font-bold text-xs text-amber-800 uppercase">LEMBAGA LAYANAN KEUANGAN & BEASISWA (SIKEU)</h4>
              <p className="text-[10px] text-slate-600">Jl. Kampus Terpadu No. 1 • Telp: (021) 789-0123</p>
            </div>
            <div className="text-center space-y-1">
              <h2 className="text-base font-extrabold underline uppercase">SURAT BUKTI DISPENSASI PEMBAYARAN</h2>
              <div className="text-xs font-mono font-bold text-slate-700">Nomor: {selectedProof.nomor_dispensasi}</div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Identitas Mahasiswa:</div>
                <div className="font-bold text-slate-900">{selectedProof.mahasiswa.nama}</div>
                <div>NIM: <strong className="font-mono">{selectedProof.mahasiswa.nim}</strong></div>
                <div>Prodi: {selectedProof.mahasiswa.prodi} ({selectedProof.mahasiswa.angkatan})</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Status & Keputusan Pimpinan:</div>
                <Badge variant="green" className="mt-0.5">{selectedProof.status.toUpperCase()}</Badge>
                <div className="text-[11px] text-slate-700 mt-1">
                  Jatuh Tempo Baru: <strong className="text-amber-900 font-mono">{selectedProof.tagihan.jatuh_tempo_baru}</strong>
                </div>
              </div>
            </div>
            <div className="text-xs space-y-2">
              <div className="font-bold text-slate-900">Catatan & Ketentuan Persetujuan Pimpinan:</div>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 font-medium">
                &quot;{selectedProof.dispensasi_info.catatan_pimpinan}&quot;
              </div>
            </div>
            <div className="pt-4 border-t grid grid-cols-2 text-xs text-center">
              <div>
                <div>Mahasiswa Pemohon,</div>
                <div className="h-12"></div>
                <div className="font-bold underline">{selectedProof.mahasiswa.nama}</div>
                <div className="text-[10px] text-slate-500">NIM: {selectedProof.mahasiswa.nim}</div>
              </div>
              <div>
                <div>{selectedProof.pejabat_approver.jabatan},</div>
                <div className="h-12 flex items-center justify-center text-slate-700 font-mono text-[10px]">[DIGITAL SIGNED - APPROVED]</div>
                <div className="font-bold underline text-amber-900">{selectedProof.pejabat_approver.nama}</div>
                <div className="text-[10px] text-slate-500">NIP: 198001012005011002</div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ============================================================ */}
      {/* FILTER DRAWER                                                */}
      {/* ============================================================ */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title={activeTab === 'dispensasi' ? 'Filter Dispensasi' : 'Filter Riwayat Pembayaran'}
        width="360px"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                if (activeTab === 'dispensasi') {
                  setFilterStatus('all'); setFilterTipe('all');
                  setTempStatus('all'); setTempTipe('all');
                } else {
                  setRiwayatFilterStatus('all'); setTempRiwayatStatus('all');
                }
                setShowFilter(false);
              }}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (activeTab === 'dispensasi') {
                  setFilterStatus(tempStatus);
                  setFilterTipe(tempTipe);
                } else {
                  setRiwayatFilterStatus(tempRiwayatStatus);
                }
                setShowFilter(false);
              }}
            >
              Terapkan
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-5">
          {activeTab === 'dispensasi' ? (
            <>
              <div className="form-group">
                <label className="form-label">Status Approval</label>
                <select value={tempStatus} onChange={(e) => setTempStatus(e.target.value)} className="select w-full">
                  <option value="all">Semua Status</option>
                  <option value="pending">Pending Approval</option>
                  <option value="approved">Disetujui</option>
                  <option value="rejected">Ditolak</option>
                </select>
                {tempStatus !== 'all' && (
                  <p className="text-xs text-primary-600 font-semibold mt-1">✓ Filter aktif: <strong>{tempStatus}</strong></p>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Tipe Dispensasi</label>
                <select value={tempTipe} onChange={(e) => setTempTipe(e.target.value)} className="select w-full">
                  <option value="all">Semua Tipe</option>
                  <option value="penundaan_jatuh_tempo">Penundaan Jatuh Tempo</option>
                  <option value="cicilan">Cicilan Berkelanjutan</option>
                  <option value="keringanan_khusus">Keringanan Khusus</option>
                </select>
                {tempTipe !== 'all' && (
                  <p className="text-xs text-primary-600 font-semibold mt-1">✓ Filter aktif: <strong>{tempTipe.replace(/_/g, ' ')}</strong></p>
                )}
              </div>
            </>
          ) : (
            <div className="form-group">
              <label className="form-label">Status Pembayaran</label>
              <select value={tempRiwayatStatus} onChange={(e) => setTempRiwayatStatus(e.target.value)} className="select w-full">
                <option value="all">Semua Status</option>
                <option value="lunas">Lunas</option>
                <option value="sebagian">Dibayar Sebagian</option>
                <option value="belum">Belum Dibayar</option>
              </select>
              {tempRiwayatStatus !== 'all' && (
                <p className="text-xs text-primary-600 font-semibold mt-1">✓ Filter aktif: <strong>{tempRiwayatStatus}</strong></p>
              )}
            </div>
          )}
        </div>
      </Drawer>
    </div>
  );
}
