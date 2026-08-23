'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
  const [activeTab, setActiveTab] = useState<'sync' | 'config' | 'mappings' | 'logs'>('sync');
  const [isLoading, setIsLoading] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<string | null>(null);

  // Config state
  const [configForm, setConfigForm] = useState({
    url: 'http://localhost:8100/ws/live2.php',
    username: 'admin_siakad',
    password: '',
  });

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
        setTokenInfo(res.data.token);
        toast.success('Berhasil terhubung ke Neo Feeder / Staging');
      } else {
        toast.error(res?.message || 'Token tidak ditemukan');
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal terhubung ke Neo Feeder');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await feederService.getConfig();
      if (res.data) {
        setConfigForm({
          url: res.data.url,
          username: res.data.username,
          password: '',
        });
      }
    } catch (err) {}
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
    fetchConfig();
  }, []);

  useEffect(() => {
    fetchLogsAndMappings();
  }, [activeTab, appliedMappingFilters]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await feederService.saveConfig(configForm);
      toast.success('Konfigurasi Neo Feeder berhasil disimpan');
      checkToken();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal menyimpan konfigurasi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerSync = async (entity: 'mahasiswa' | 'biodata_mahasiswa' | 'riwayat_pendidikan_mahasiswa' | 'dosen' | 'mata_kuliah' | 'kelas' | 'penugasan_dosen') => {
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

        <button
          onClick={() => setActiveTab('config')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition -mb-px cursor-pointer ${
            activeTab === 'config'
              ? 'border-primary-600 text-primary-600 bg-primary-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Settings size={16} />
          Konfigurasi Kredensial
        </button>
      </div>

      {/* Tab 1: Sync Operations */}
      {activeTab === 'sync' && (
        <div className="space-y-4">
          {/* Connection Status Banner */}
          <div className="card p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  tokenInfo ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                }`}
              >
                {tokenInfo ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Status Koneksi Feeder / Staging
                </p>
                <p className="font-mono text-xs font-bold text-slate-900 mt-0.5 break-all">
                  {tokenInfo ? `Token Aktif: ${tokenInfo}` : 'Koneksi belum terverifikasi'}
                </p>
              </div>
            </div>
            <Badge variant={tokenInfo ? 'green' : 'rose'}>
              {tokenInfo ? 'TERHUBUNG' : 'OFFLINE'}
            </Badge>
          </div>

          {/* Sync Action Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Biodata Mahasiswa */}
            <div className="card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <User size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Biodata Mahasiswa (WS Feeder)</h4>
                    <p className="text-2xs text-slate-500">InsertBiodataMahasiswa (NIK, NISN, Ibu Kandung, Alamat)</p>
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-2xs text-slate-400 font-semibold font-mono">WS: InsertBiodataMahasiswa</span>
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

            {/* Card 2: Riwayat Pendidikan Mahasiswa */}
            <div className="card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <GraduationCap size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Riwayat Pendidikan & Registrasi</h4>
                    <p className="text-2xs text-slate-500">InsertRiwayatPendidikanMahasiswa (NIM, Prodi, Jalur Masuk, SKS Transfer)</p>
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-2xs text-slate-400 font-semibold font-mono">WS: InsertRiwayatPendidikanMahasiswa</span>
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

            {/* Card 3: Batch All Mahasiswa */}
            <div className="card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
                    <Users size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Sinkronisasi Penuh Mahasiswa</h4>
                    <p className="text-2xs text-slate-500">Orkestrasi gabungan Biodata + Riwayat Pendidikan PDDikti</p>
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-2xs text-slate-400 font-semibold font-mono">Orkestrasi: All Mahasiswa</span>
                <Button
                  variant="primary"
                  className="text-xs font-bold"
                  disabled={syncingEntity === 'mahasiswa'}
                  onClick={() => handleTriggerSync('mahasiswa')}
                >
                  {syncingEntity === 'mahasiswa' ? 'Menyinkronkan...' : 'Push All Mahasiswa →'}
                </Button>
              </div>
            </div>

            {/* Card 2: Dosen */}
            <div className="card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Users size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Sinkronisasi Data Dosen</h4>
                    <p className="text-2xs text-slate-500">Kirim data NIDN, NIP & homebase program studi</p>
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-2xs text-slate-400 font-semibold font-mono">Tabel: siakad_dosen</span>
                <Button
                  variant="primary"
                  className="text-xs font-bold"
                  disabled={syncingEntity === 'dosen'}
                  onClick={() => handleTriggerSync('dosen')}
                >
                  {syncingEntity === 'dosen' ? 'Menyinkronkan...' : 'Push Dosen →'}
                </Button>
              </div>
            </div>

            {/* Card 3: Mata Kuliah */}
            <div className="card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <BookOpen size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Sinkronisasi Mata Kuliah & Kurikulum</h4>
                    <p className="text-2xs text-slate-500">Kirim kode MK, total SKS tatap muka & praktek</p>
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
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

            {/* Card 4: Kelas Perkuliahan */}
            <div className="card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <CalendarCheck size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Sinkronisasi Kelas & Nilai</h4>
                    <p className="text-2xs text-slate-500">Kirim kelas kuliah aktif, KRS mahasiswa & nilai semester</p>
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-2xs text-slate-400 font-semibold font-mono">Tabel: siakad_kelas & siakad_nilai</span>
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

            {/* Card 5: Penugasan Dosen */}
            <div className="card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <Users size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Sinkronisasi Penugasan Dosen Ajar</h4>
                    <p className="text-2xs text-slate-500">Kirim data dosen pengajar kelas, SKS ajar, & 16 pertemuan ke Neo Feeder</p>
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-2xs text-slate-400 font-semibold font-mono">Tabel: siakad_dosen_pengampu</span>
                <Button
                  variant="primary"
                  className="text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white border-none"
                  disabled={syncingEntity === 'penugasan_dosen'}
                  onClick={() => handleTriggerSync('penugasan_dosen')}
                >
                  {syncingEntity === 'penugasan_dosen' ? 'Menyinkronkan...' : 'Push Penugasan Dosen →'}
                </Button>
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

      {/* Tab 4: Configuration */}
      {activeTab === 'config' && (
        <div className="card p-6 max-w-2xl space-y-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Pengaturan Kredensial Neo Feeder</h3>
            <p className="text-xs text-slate-500 mt-1">
              Konfigurasikan URL endpoint Web Service (WS) Neo Feeder PDDIKTI kampus Anda.
            </p>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4 pt-2">
            <Input
              label="URL Web Service Feeder (ws/live2.php atau sandbox) *"
              required
              value={configForm.url}
              onChange={(e) => setConfigForm({ ...configForm, url: e.target.value })}
              placeholder="http://localhost:8100/ws/live2.php"
            />

            <Input
              label="Username / Kode PT Feeder *"
              required
              value={configForm.username}
              onChange={(e) => setConfigForm({ ...configForm, username: e.target.value })}
              placeholder="admin_siakad"
            />

            <Input
              label="Password Feeder (Kosongkan jika tidak ingin mengubah)"
              type="password"
              value={configForm.password}
              onChange={(e) => setConfigForm({ ...configForm, password: e.target.value })}
              placeholder="••••••••"
            />

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <Button type="submit" variant="primary" disabled={isLoading}>
                {isLoading ? 'Menyimpan...' : 'Simpan Konfigurasi'}
              </Button>
            </div>
          </form>
        </div>
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
