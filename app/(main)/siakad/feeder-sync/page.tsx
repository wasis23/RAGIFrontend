'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { feederService } from '@/services/feeder.service';
import toast from 'react-hot-toast';
import {
  RefreshCw,
  Database,
  CheckCircle2,
  AlertTriangle,
  Settings,
  History,
  ArrowRight,
  Search,
  Filter,
  GraduationCap,
  Users,
  BookOpen,
  CalendarCheck,
  Server
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
  const [mappingFilter, setMappingFilter] = useState({
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
        const res = await feederService.getMappings(mappingFilter);
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
  }, [activeTab, mappingFilter]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await feederService.saveConfig(configForm);
      toast.success('Konfigurasi Neo Feeder berhasil disimpan');
      checkToken();
    } catch (err: any) {
      toast.error('Gagal menyimpan konfigurasi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerSync = async (entity: 'mahasiswa' | 'dosen' | 'mata_kuliah' | 'kelas' | 'penugasan_dosen') => {
    try {
      setSyncingEntity(entity);
      const res = await feederService.triggerSync(entity);
      toast.success(res.message || `Sinkronisasi ${entity} selesai`);
      fetchLogsAndMappings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || `Gagal sinkronisasi ${entity}`);
    } finally {
      setSyncingEntity(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <PageHeader
        title="Integrasi & Penampungan Data Neo Feeder PDDIKTI"
        description="Sinkronisasi data terintegrasi ke Neo Feeder PDDIKTI, pemetaan data staging/penampungan, dan manajemen koneksi web service."
        action={
          <Button
            variant="outline"
            icon={<RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />}
            className="font-bold text-xs"
            onClick={checkToken}
            disabled={isLoading}
          >
            {isLoading ? 'Mengecek...' : 'Cek Status Token'}
          </Button>
        }
      />

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('sync')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'sync'
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Database size={16} /> Operasi Sinkronisasi
        </button>
        <button
          onClick={() => setActiveTab('mappings')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'mappings'
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Server size={16} /> Penampungan Data & ID Feeder
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'logs'
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <History size={16} /> Riwayat Log Sync
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'config'
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Settings size={16} /> Konfigurasi Kredensial
        </button>
      </div>

      {/* Tab 1: Sync Operations */}
      {activeTab === 'sync' && (
        <div className="space-y-4">
          {/* Connection Status Banner */}
          <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tokenInfo ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {tokenInfo ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status Koneksi Feeder / Staging</p>
                <p className="font-mono text-xs font-bold text-slate-900 mt-0.5 break-all">
                  {tokenInfo ? `Token Aktif: ${tokenInfo}` : 'Koneksi belum terverifikasi'}
                </p>
              </div>
            </div>
            <span className={`badge font-bold text-2xs ${tokenInfo ? 'badge-green' : 'badge-red'}`}>
              {tokenInfo ? 'TERHUBUNG' : 'OFFLINE'}
            </span>
          </div>

          {/* Sync Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Mahasiswa */}
            <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                    <GraduationCap size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Sinkronisasi Data Mahasiswa</h4>
                    <p className="text-2xs text-slate-500">Kirim biodata, NIK, NIM & status akademik ke PDDIKTI</p>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-2xs text-slate-400 font-semibold">Tabel: siakad_mahasiswa</span>
                <Button
                  variant="primary"
                  className="text-xs font-bold px-3 py-1.5 h-auto"
                  disabled={syncingEntity === 'mahasiswa'}
                  onClick={() => handleTriggerSync('mahasiswa')}
                >
                  {syncingEntity === 'mahasiswa' ? 'Menyinkronkan...' : 'Push Mahasiswa →'}
                </Button>
              </div>
            </div>

            {/* Card 2: Dosen */}
            <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Users size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Sinkronisasi Data Dosen</h4>
                    <p className="text-2xs text-slate-500">Kirim data NIDN, NIP & homebase program studi</p>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-2xs text-slate-400 font-semibold">Tabel: siakad_dosen</span>
                <Button
                  variant="primary"
                  className="text-xs font-bold px-3 py-1.5 h-auto"
                  disabled={syncingEntity === 'dosen'}
                  onClick={() => handleTriggerSync('dosen')}
                >
                  {syncingEntity === 'dosen' ? 'Menyinkronkan...' : 'Push Dosen →'}
                </Button>
              </div>
            </div>

            {/* Card 3: Mata Kuliah */}
            <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                    <BookOpen size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Sinkronisasi Mata Kuliah & Kurikulum</h4>
                    <p className="text-2xs text-slate-500">Kirim kode MK, total SKS tatap muka & praktek</p>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-2xs text-slate-400 font-semibold">Tabel: siakad_mata_kuliah</span>
                <Button
                  variant="primary"
                  className="text-xs font-bold px-3 py-1.5 h-auto"
                  disabled={syncingEntity === 'mata_kuliah'}
                  onClick={() => handleTriggerSync('mata_kuliah')}
                >
                  {syncingEntity === 'mata_kuliah' ? 'Menyinkronkan...' : 'Push Mata Kuliah →'}
                </Button>
              </div>
            </div>

            {/* Card 4: Kelas Perkuliahan */}
            <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CalendarCheck size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Sinkronisasi Kelas & Nilai</h4>
                    <p className="text-2xs text-slate-500">Kirim kelas kuliah aktif, KRS mahasiswa & nilai semester</p>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-2xs text-slate-400 font-semibold">Tabel: siakad_kelas & siakad_nilai</span>
                <Button
                  variant="primary"
                  className="text-xs font-bold px-3 py-1.5 h-auto"
                  disabled={syncingEntity === 'kelas'}
                  onClick={() => handleTriggerSync('kelas')}
                >
                  {syncingEntity === 'kelas' ? 'Menyinkronkan...' : 'Push Kelas & Nilai →'}
                </Button>
              </div>
            </div>

            {/* Card 5: Penugasan Dosen Pengajar Kelas */}
            <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Users size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Sinkronisasi Penugasan Dosen Ajar</h4>
                    <p className="text-2xs text-slate-500">Kirim data dosen pengajar kelas, SKS ajar, & 16 pertemuan ke Neo Feeder</p>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-2xs text-slate-400 font-semibold">Tabel: siakad_dosen_pengampu</span>
                <Button
                  variant="primary"
                  className="text-xs font-bold px-3 py-1.5 h-auto bg-amber-600 hover:bg-amber-700 text-white border-none"
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
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <select
                value={mappingFilter.entity_type}
                onChange={(e) => setMappingFilter({ ...mappingFilter, entity_type: e.target.value })}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
              >
                <option value="">Semua Entitas</option>
                <option value="mahasiswa">Mahasiswa</option>
                <option value="dosen">Dosen</option>
                <option value="mata_kuliah">Mata Kuliah</option>
                <option value="kelas">Kelas</option>
              </select>

              <select
                value={mappingFilter.sync_status}
                onChange={(e) => setMappingFilter({ ...mappingFilter, sync_status: e.target.value })}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
              >
                <option value="">Semua Status</option>
                <option value="synced">Synced</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4">ENTITAS</th>
                  <th className="py-3 px-4">LOCAL ID</th>
                  <th className="py-3 px-4">ID FEEDER / DIKTI</th>
                  <th className="py-3 px-4">STATUS SYNC</th>
                  <th className="py-3 px-4">TERAKHIR SYNC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {mappings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Belum ada penampungan data mapping. Klik salah satu tombol "Push" di tab Operasi Sinkronisasi.
                    </td>
                  </tr>
                ) : (
                  mappings.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900 uppercase">{m.entity_type}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">#{m.local_id}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-primary-700">{m.feeder_id || '-'}</td>
                      <td className="py-3.5 px-4">
                        <span className={`badge text-2xs font-bold ${
                          m.sync_status === 'synced' ? 'badge-green' : m.sync_status === 'failed' ? 'badge-red' : 'badge-yellow'
                        }`}>
                          {m.sync_status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-2xs">{m.last_synced_at || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Riwayat Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4">WAKTU SYNC</th>
                  <th className="py-3 px-4">MODUL / ENTITAS</th>
                  <th className="py-3 px-4">TIPE</th>
                  <th className="py-3 px-4">TOTAL</th>
                  <th className="py-3 px-4">SUKSES / GAGAL</th>
                  <th className="py-3 px-4">STATUS</th>
                  <th className="py-3 px-4">OPERATOR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">Belum ada riwayat log sinkronisasi.</td>
                  </tr>
                ) : (
                  logs.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono text-slate-600 text-2xs">{l.created_at?.slice(0, 19).replace('T', ' ')}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 uppercase">{l.entity_type}</td>
                      <td className="py-3.5 px-4 uppercase font-bold text-slate-600">{l.sync_type}</td>
                      <td className="py-3.5 px-4 tabular-nums font-bold">{l.total_records}</td>
                      <td className="py-3.5 px-4 tabular-nums">
                        <span className="text-emerald-700 font-bold">{l.success_count} Sukses</span> /{' '}
                        <span className="text-rose-600 font-bold">{l.failed_count} Gagal</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`badge text-2xs font-bold ${
                          l.status === 'success' ? 'badge-green' : l.status === 'partial' ? 'badge-yellow' : 'badge-red'
                        }`}>
                          {l.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{l.user?.username || 'System'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Configuration */}
      {activeTab === 'config' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs max-w-2xl">
          <h3 className="text-base font-extrabold text-slate-900">Pengaturan Kredensial Neo Feeder</h3>
          <p className="text-xs text-slate-500 mt-1 mb-5">
            Konfigurasikan URL endpoint Web Service (WS) Neo Feeder PDDIKTI kampus Anda.
          </p>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div>
              <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                URL Web Service Feeder (ws/live2.php atau sandbox)
              </label>
              <input
                type="text"
                required
                value={configForm.url}
                onChange={(e) => setConfigForm({ ...configForm, url: e.target.value })}
                placeholder="http://localhost:8100/ws/live2.php"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Username / Kode PT Feeder
              </label>
              <input
                type="text"
                required
                value={configForm.username}
                onChange={(e) => setConfigForm({ ...configForm, username: e.target.value })}
                placeholder="admin_siakad"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password Feeder (Kosongkan jika tidak ingin mengubah)
              </label>
              <input
                type="password"
                value={configForm.password}
                onChange={(e) => setConfigForm({ ...configForm, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <Button type="submit" variant="primary" className="text-xs font-bold min-h-[38px]" disabled={isLoading}>
                {isLoading ? 'Menyimpan...' : 'Simpan Konfigurasi'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
