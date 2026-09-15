'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { feederService } from '@/services/feeder.service';
import toast from 'react-hot-toast';
import {
  RefreshCw,
  Database,
  CheckCircle2,
  AlertTriangle,
  Settings,
  History,
  GraduationCap,
  Users,
  User,
  BookOpen,
  CalendarCheck,
  Server,
  Filter,
} from 'lucide-react';

export default function FeederSyncPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'sync' | 'mappings' | 'logs'>('sync');
  const [isLoading, setIsLoading] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<string | null>(null);
  const [tokenStaging, setTokenStaging] = useState(false);

  // Mappings & Logs state
  const [mappings, setMappings] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [syncingEntity, setSyncingEntity] = useState<string | null>(null);

  // Filter Drawer State (Mappings Tab)
  const [showFilter, setShowFilter] = useState(false);
  const [filterEntityType, setFilterEntityType] = useState('');
  const [filterSyncStatus, setFilterSyncStatus] = useState('');
  const [appliedMappingFilters, setAppliedMappingFilters] = useState({
    entity_type: '',
    sync_status: '',
  });

  const checkToken = async () => {
    setIsLoading(true);
    try {
      const res = await feederService.getToken();
      if (res?.data?.token) {
        const isStaging = res.data.is_staging === true;
        setTokenInfo(res.data.token);
        setTokenStaging(isStaging);
        if (isStaging) {
          toast(res?.message || 'WS Feeder tidak terjangkau. Mode staging aktif.');
        } else {
          toast.success('Berhasil terhubung ke Neo Feeder / Staging');
        }
      } else {
        toast.error(res?.message || 'Token tidak ditemukan');
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal terhubung ke Neo Feeder');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogsAndMappings = async () => {
    try {
      if (activeTab === 'logs') {
        const res = await feederService.getLogs();
        if (res.data) setLogs(res.data);
      } else if (activeTab === 'mappings') {
        const res = await feederService.getMappings(appliedMappingFilters);
        if (res.data) setMappings(res.data);
      }
    } catch (err) {}
  };

  useEffect(() => {
    checkToken();
  }, []);

  useEffect(() => {
    fetchLogsAndMappings();
  }, [activeTab, appliedMappingFilters]);

  const handleTriggerSync = async (entity: 'mahasiswa' | 'biodata_mahasiswa' | 'riwayat_pendidikan_mahasiswa' | 'dosen' | 'pull_dosen' | 'penugasan_dosen' | 'ajar_dosen' | 'mata_kuliah' | 'kelas') => {
    try {
      setSyncingEntity(entity);
      const res = await feederService.triggerSync(entity);
      toast.success(res.message || `Sinkronisasi ${entity} berhasil diproses`);
      fetchLogsAndMappings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || `Gagal sinkronisasi ${entity}`);
    } finally {
      setSyncingEntity(null);
    }
  };

  const mappingColumns: ColumnDef<any>[] = [
    {
      key: 'entity_type',
      label: 'ENTITAS',
      render: (row) => (
        <span className="font-bold text-slate-900 uppercase text-xs">
          {row.entity_type}
        </span>
      ),
    },
    {
      key: 'local_id',
      label: 'LOCAL ID',
      render: (row) => (
        <span className="font-mono font-bold text-slate-800 text-xs">
          #{row.local_id}
        </span>
      ),
    },
    {
      key: 'feeder_id',
      label: 'ID FEEDER / DIKTI',
      render: (row) => (
        <span className="font-mono font-bold text-primary-700 text-xs">
          {row.feeder_id || '-'}
        </span>
      ),
    },
    {
      key: 'sync_status',
      label: 'STATUS SYNC',
      align: 'center',
      render: (row) => (
        <Badge
          variant={
            row.sync_status === 'synced'
              ? 'green'
              : row.sync_status === 'failed'
              ? 'rose'
              : 'amber'
          }
          className="uppercase"
        >
          {row.sync_status}
        </Badge>
      ),
    },
    {
      key: 'last_synced_at',
      label: 'TERAKHIR SYNC',
      render: (row) => (
        <span className="text-slate-500 font-mono text-2xs">
          {row.last_synced_at || '-'}
        </span>
      ),
    },
  ];

  const logColumns: ColumnDef<any>[] = [
    {
      key: 'created_at',
      label: 'WAKTU SYNC',
      render: (row) => (
        <span className="font-mono text-slate-600 text-2xs">
          {row.created_at?.slice(0, 19).replace('T', ' ')}
        </span>
      ),
    },
    {
      key: 'entity_type',
      label: 'MODUL / ENTITAS',
      render: (row) => (
        <span className="font-bold text-slate-900 uppercase text-xs">
          {row.entity_type}
        </span>
      ),
    },
    {
      key: 'sync_type',
      label: 'TIPE',
      render: (row) => (
        <span className="uppercase font-bold text-slate-600 text-2xs">
          {row.sync_type}
        </span>
      ),
    },
    {
      key: 'total_records',
      label: 'TOTAL',
      align: 'center',
      render: (row) => (
        <span className="tabular-nums font-bold text-slate-900 text-xs">
          {row.total_records}
        </span>
      ),
    },
    {
      key: 'hasil',
      label: 'SUKSES / GAGAL',
      render: (row) => (
        <span className="tabular-nums text-xs">
          <span className="text-emerald-700 font-bold">{row.success_count} Sukses</span> /{' '}
          <span className="text-rose-600 font-bold">{row.failed_count} Gagal</span>
        </span>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      align: 'center',
      render: (row) => (
        <Badge
          variant={
            row.status === 'success'
              ? 'green'
              : row.status === 'partial'
              ? 'amber'
              : 'rose'
          }
          className="uppercase"
        >
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'operator',
      label: 'OPERATOR',
      render: (row) => (
        <span className="text-slate-600 text-xs">
          {row.user?.username || 'System'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Sinkronisasi PDDikti Neo Feeder"
        description="Integrasi Web Service (WS) Neo Feeder, sinkronisasi civitas, kurikulum, dan pelaporan semester."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Neo Feeder Sync' },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />}
              onClick={checkToken}
              disabled={isLoading}
            >
              Uji Koneksi
            </Button>
            {activeTab === 'mappings' && (
              <Button
                variant="outline"
                icon={<Filter size={16} />}
                onClick={() => setShowFilter(true)}
              >
                Filter
              </Button>
            )}
          </div>
        }
      />

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('sync')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition -mb-px cursor-pointer ${
            activeTab === 'sync'
              ? 'border-primary-600 text-primary-600 bg-primary-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Database size={16} />
          Operasi Sinkronisasi
        </button>

        <button
          onClick={() => setActiveTab('mappings')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition -mb-px cursor-pointer ${
            activeTab === 'mappings'
              ? 'border-primary-600 text-primary-600 bg-primary-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Server size={16} />
          Data Mapping Feeder
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition -mb-px cursor-pointer ${
            activeTab === 'logs'
              ? 'border-primary-600 text-primary-600 bg-primary-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <History size={16} />
          Riwayat Log Sync
        </button>
      </div>

      {/* Tab 1: Sync Operations */}
      {activeTab === 'sync' && (
        <div className="space-y-6">
          {/* Connection Status Banner */}
          <div className="card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  tokenInfo
                    ? tokenStaging
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-emerald-50 text-emerald-600'
                    : 'bg-rose-50 text-rose-600'
                }`}
              >
                {tokenInfo ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Status Koneksi Feeder / Staging
                </p>
                <p className="font-mono text-xs font-bold text-slate-900 mt-0.5 break-all">
                  {tokenInfo
                    ? `${tokenStaging ? 'Mode Staging' : 'Token Aktif'}: ${tokenInfo}`
                    : 'Koneksi belum terverifikasi'}
                </p>
                {tokenInfo && tokenStaging && (
                  <p className="text-xs text-amber-600 mt-1">
                    WS Feeder tidak terjangkau. Data ditampung secara lokal (staging).
                  </p>
                )}
              </div>
            </div>
            <Badge variant={tokenInfo ? (tokenStaging ? 'amber' : 'green') : 'rose'}>
              {tokenInfo ? (tokenStaging ? 'STAGING' : 'TERHUBUNG') : 'OFFLINE'}
            </Badge>
          </div>

          {/* Notice: kredensial dikelola di IAM */}
          <div className="card p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between bg-slate-50 border border-slate-200">
            <div className="flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                <Settings size={18} />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Kredensial Neo Feeder</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  URL, username, dan password WS Feeder kini dikelola terpusat di IAM → Pengaturan Sistem.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => router.push('/iam/settings')}
              className="w-full sm:w-auto shrink-0"
            >
              Buka IAM Settings
            </Button>
          </div>

          {/* ── SECTION: MAHASISWA ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center">
                <GraduationCap size={16} />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Data Mahasiswa</h3>
                <p className="text-2xs text-slate-500">Push biodata, riwayat pendidikan, dan registrasi mahasiswa ke PDDikti</p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Card: Biodata Mahasiswa */}
              <div className="card p-4 flex flex-col">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <User size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Biodata Mahasiswa</h4>
                    <p className="text-2xs text-slate-500">NIK, NISN, Ibu Kandung, Alamat</p>
                  </div>
                </div>
                <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-2xs text-slate-400 font-semibold font-mono">InsertBiodataMahasiswa</span>
                  <Button
                    variant="primary"
                    className="text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white"
                    disabled={syncingEntity === 'biodata_mahasiswa'}
                    onClick={() => handleTriggerSync('biodata_mahasiswa')}
                  >
                    {syncingEntity === 'biodata_mahasiswa' ? 'Menyinkronkan...' : 'Push Biodata →'}
                  </Button>
                </div>
              </div>

              {/* Card: Riwayat Pendidikan Mahasiswa */}
              <div className="card p-4 flex flex-col">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <GraduationCap size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Riwayat Pendidikan</h4>
                    <p className="text-2xs text-slate-500">NIM, Prodi, Jalur Masuk, SKS Transfer</p>
                  </div>
                </div>
                <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-2xs text-slate-400 font-semibold font-mono">InsertRiwayatPendidikan</span>
                  <Button
                    variant="primary"
                    className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={syncingEntity === 'riwayat_pendidikan_mahasiswa'}
                    onClick={() => handleTriggerSync('riwayat_pendidikan_mahasiswa')}
                  >
                    {syncingEntity === 'riwayat_pendidikan_mahasiswa' ? 'Menyinkronkan...' : 'Push Riwayat →'}
                  </Button>
                </div>
              </div>

              {/* Card: Batch All Mahasiswa */}
              <div className="card p-4 flex flex-col border-2 border-dashed border-primary-200 bg-primary-50/30">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center">
                    <Users size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Sinkronisasi Penuh</h4>
                    <p className="text-2xs text-slate-500">Biodata + Riwayat Pendidikan sekaligus</p>
                  </div>
                </div>
                <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-2xs text-slate-400 font-semibold font-mono">Orkestrasi: All</span>
                  <Button
                    variant="primary"
                    className="text-xs font-bold"
                    disabled={syncingEntity === 'mahasiswa'}
                    onClick={() => handleTriggerSync('mahasiswa')}
                  >
                    {syncingEntity === 'mahasiswa' ? 'Menyinkronkan...' : 'Push All →'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* ── SECTION: DOSEN ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <Users size={16} />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Data Dosen</h3>
                <p className="text-2xs text-slate-500">Pull biodata, cocokkan NIDN, penugasan PT, dan kirim pengajar kelas kuliah</p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Card: Dosen Langkah 1 - Biodata NIDN */}
              <div className="card p-4 flex flex-col">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <User size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">Biodata Dosen</h4>
                      <Badge variant="blue">Langkah 1</Badge>
                    </div>
                    <p className="text-2xs text-slate-500">PULL & cocokkan NIDN dari PDDikti</p>
                  </div>
                </div>
                <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-2xs text-slate-400 font-semibold font-mono">GetListDosen</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="text-xs font-bold"
                      disabled={syncingEntity === 'dosen' || syncingEntity === 'pull_dosen'}
                      onClick={() => handleTriggerSync('dosen')}
                    >
                      {syncingEntity === 'dosen' ? 'Mencocokkan...' : 'Cocokkan NIDN →'}
                    </Button>
                    <Button
                      variant="primary"
                      className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={syncingEntity === 'dosen' || syncingEntity === 'pull_dosen'}
                      onClick={() => handleTriggerSync('pull_dosen')}
                    >
                      {syncingEntity === 'pull_dosen' ? 'Menarik...' : 'Tarik Feeder →'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Card: Dosen Langkah 2 - Penugasan Dosen PT */}
              <div className="card p-4 flex flex-col">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Users size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">Penugasan PT</h4>
                      <Badge variant="indigo">Langkah 2</Badge>
                    </div>
                    <p className="text-2xs text-slate-500">id_registrasi_dosen per Prodi & TA aktif</p>
                  </div>
                </div>
                <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-2xs text-slate-400 font-semibold font-mono">GetListPenugasanDosen</span>
                  <Button
                    variant="primary"
                    className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white border-none"
                    disabled={syncingEntity === 'penugasan_dosen'}
                    onClick={() => handleTriggerSync('penugasan_dosen')}
                  >
                    {syncingEntity === 'penugasan_dosen' ? 'Mencocokkan...' : 'Cocokkan →'}
                  </Button>
                </div>
              </div>

              {/* Card: Dosen Langkah 3 - Pengajar Kelas */}
              <div className="card p-4 flex flex-col">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Users size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">Ajar Dosen</h4>
                      <Badge variant="amber">Langkah 3</Badge>
                    </div>
                    <p className="text-2xs text-slate-500">Kirim pengajar ke kelas (16 pertemuan)</p>
                  </div>
                </div>
                <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-2xs text-slate-400 font-semibold font-mono">InsertDosenPengajarKelas</span>
                  <Button
                    variant="primary"
                    className="text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white border-none"
                    disabled={syncingEntity === 'ajar_dosen'}
                    onClick={() => handleTriggerSync('ajar_dosen')}
                  >
                    {syncingEntity === 'ajar_dosen' ? 'Mengirim...' : 'Kirim Pengajar →'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* ── SECTION: KURIKULUM & PERKULIAHAN ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                <BookOpen size={16} />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Kurikulum & Perkuliahan</h3>
                <p className="text-2xs text-slate-500">Push mata kuliah, kelas perkuliahan, KRS, dan nilai semester ke PDDikti</p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Card: Mata Kuliah */}
              <div className="card p-4 flex flex-col">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                    <BookOpen size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Mata Kuliah & Kurikulum</h4>
                    <p className="text-2xs text-slate-500">Kode MK, total SKS tatap muka & praktek</p>
                  </div>
                </div>
                <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-2xs text-slate-400 font-semibold font-mono">Tabel: siakad_mata_kuliah</span>
                  <Button
                    variant="primary"
                    className="text-xs font-bold"
                    disabled={syncingEntity === 'mata_kuliah'}
                    onClick={() => handleTriggerSync('mata_kuliah')}
                  >
                    {syncingEntity === 'mata_kuliah' ? 'Menyinkronkan...' : 'Push Mata Kuliah →'}
                  </Button>
                </div>
              </div>

              {/* Card: Kelas Perkuliahan */}
              <div className="card p-4 flex flex-col">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CalendarCheck size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Kelas Perkuliahan & Nilai</h4>
                    <p className="text-2xs text-slate-500">Kelas aktif, KRS mahasiswa & nilai semester</p>
                  </div>
                </div>
                <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-2xs text-slate-400 font-semibold font-mono">Tabel: siakad_kelas</span>
                  <Button
                    variant="primary"
                    className="text-xs font-bold"
                    disabled={syncingEntity === 'kelas'}
                    onClick={() => handleTriggerSync('kelas')}
                  >
                    {syncingEntity === 'kelas' ? 'Menyinkronkan...' : 'Push Kelas & Nilai →'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Staging / Penampungan Mappings */}
      {activeTab === 'mappings' && (
        <DataTable
          columns={mappingColumns}
          data={mappings}
          isLoading={isLoading}
          emptyMessage="Belum ada penampungan data mapping. Klik salah satu tombol 'Push' di tab Operasi Sinkronisasi."
        />
      )}

      {/* Tab 3: Riwayat Logs */}
      {activeTab === 'logs' && (
        <DataTable
          columns={logColumns}
          data={logs}
          isLoading={isLoading}
          emptyMessage="Belum ada riwayat log sinkronisasi Neo Feeder."
        />
      )}

      {/* Filter Drawer for Mappings */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Mapping Feeder"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setFilterEntityType('');
                setFilterSyncStatus('');
                setAppliedMappingFilters({ entity_type: '', sync_status: '' });
                setShowFilter(false);
              }}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setAppliedMappingFilters({
                  entity_type: filterEntityType,
                  sync_status: filterSyncStatus,
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
          <div>
            <label className="label">Tipe Entitas</label>
            <select
              value={filterEntityType}
              onChange={(e) => setFilterEntityType(e.target.value)}
              className="select w-full"
            >
              <option value="">Semua Entitas</option>
              <option value="mahasiswa">Mahasiswa</option>
              <option value="dosen">Dosen</option>
              <option value="mata_kuliah">Mata Kuliah</option>
              <option value="kelas">Kelas Perkuliahan</option>
            </select>
          </div>

          <div>
            <label className="label">Status Sinkronisasi</label>
            <select
              value={filterSyncStatus}
              onChange={(e) => setFilterSyncStatus(e.target.value)}
              className="select w-full"
            >
              <option value="">Semua Status</option>
              <option value="synced">Synced (Berhasil)</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed (Gagal)</option>
            </select>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
