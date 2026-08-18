'use client';

import { useState, useEffect } from 'react';
import { Activity, LogOut, Smartphone, Monitor, ShieldAlert, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { adminService } from '@/services/admin.service';
import { parseUserAgent, formatDateTime } from '@/lib/utils';
import type { UserSession } from '@/types/auth.types';

interface ExtendedSession extends UserSession {
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<ExtendedSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<ExtendedSession | null>(null);

  // Filter States
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterOrderBy, setFilterOrderBy] = useState('created_at');
  const [filterOrderDir, setFilterOrderDir] = useState('desc');

  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedOrderBy, setAppliedOrderBy] = useState('created_at');
  const [appliedOrderDir, setAppliedOrderDir] = useState('desc');

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getAllSessions();
      const list = (Array.isArray(res?.data)
        ? res.data
        : ((res?.data as unknown as { items?: ExtendedSession[] })?.items ?? [])
      ) as ExtendedSession[];
      setSessions(list);
    } catch {
      toast.error('Gagal memuat data sesi. Periksa koneksi ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleForceLogout = async () => {
    if (!selectedSession) return;
    try {
      await adminService.forceLogoutSession(selectedSession.id);
      toast.success(`Sesi untuk ${selectedSession.user?.username || 'pengguna'} telah dipaksa keluar.`);
      fetchSessions();
    } catch {
      toast.error(`Gagal memaksa logout sesi. Periksa koneksi ke server.`);
    } finally {
      setSelectedSession(null);
    }
  };

  const filteredSessions = [...sessions].filter(sess => {
    if (!appliedSearch) return true;
    const lowerQ = appliedSearch.toLowerCase();
    const { browser, os } = parseUserAgent(sess.user_agent);
    return (sess.user?.username || '').toLowerCase().includes(lowerQ) || 
           (sess.user?.email || '').toLowerCase().includes(lowerQ) ||
           browser.toLowerCase().includes(lowerQ) ||
           os.toLowerCase().includes(lowerQ) ||
           sess.ip_address.includes(lowerQ);
  }).sort((a, b) => {
    let cmp = 0;
    if (appliedOrderBy === 'username') {
      cmp = (a.user?.username || '').localeCompare(b.user?.username || '');
    } else if (appliedOrderBy === 'created_at') {
      cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    } else if (appliedOrderBy === 'ip_address') {
      cmp = a.ip_address.localeCompare(b.ip_address);
    }
    
    return appliedOrderDir === 'desc' ? -cmp : cmp;
  });

  const columns: ColumnDef<ExtendedSession>[] = [
    { key: 'id', label: 'ID', render: (row) => <span className="font-bold text-slate-400">#{row.id}</span> },
    { key: 'user', label: 'Pengguna', render: (row) => (
      <div>
        <div className="font-bold">{row.user?.username || '-'}</div>
        <div className="text-xs text-slate-400">{row.user?.email || '-'}</div>
      </div>
    )},
    { key: 'device', label: 'Perangkat & Browser', render: (row) => {
      const { browser, os } = parseUserAgent(row.user_agent);
      const isMobile = os === 'Android' || os === 'iOS';
      return (
        <div className="flex items-center gap-2">
          {isMobile ? <Smartphone size={16} color="var(--primary-600)" /> : <Monitor size={16} color="var(--primary-600)" />}
          <span className="font-semibold text-sm">{browser} ({os})</span>
        </div>
      );
    }},
    { key: 'ip_address', label: 'IP Address', render: (row) => (
      <code className="bg-slate-100 px-2 py-0.5 rounded text-[0.8125rem]">
        {row.ip_address}
      </code>
    )},
    { key: 'created_at', label: 'Waktu Login', render: (row) => (
      <span className="text-[0.8125rem] text-slate-500">
        {formatDateTime(row.created_at)}
      </span>
    )},
    { key: 'expires_at', label: 'Kadaluarsa', render: (row) => (
      <span className="text-[0.8125rem] text-slate-400">
        {formatDateTime(row.expires_at)}
      </span>
    )},
    { key: 'aksi', label: 'Aksi', align: 'right', render: (row) => (
      <Button
        variant="outline-danger"
        size="sm"
        icon={<LogOut size={14} />}
        onClick={() => setSelectedSession(row)}
      >
        Force Logout
      </Button>
    )},
  ];

  return (
    <div className="animate-fade-in flex flex-col gap-7">
      <PageHeader
        title="Monitor Sesi Perangkat Global (Global Sessions Table)"
        description="Pantau seluruh sesi aktif di universitas dan lakukan Force Logout jika diperlukan (Tabel: user_sessions)"
        action={
          <Button 
            variant="outline" 
            icon={<Filter size={16} />} 
            onClick={() => setShowFilter(true)}
          >
            Filter
          </Button>
        }
      />

      <div className="alert alert-info session-alert">
        <ShieldAlert size={20} className="shrink-0" />
        <span className="text-sm">
          <strong>Keamanan Terpusat:</strong> Admin dapat memutus sesi pengguna yang terindikasi mencurigakan secara instan di seluruh ekosistem kampus.
        </span>
      </div>

      <DataTable
        columns={columns}
        data={filteredSessions}
        isLoading={isLoading}
      />

      {/* Filter Drawer */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Sesi"
        footer={
          <div className="flex justify-end gap-3">
            <Button 
              variant="secondary" 
              onClick={() => {
                setFilterSearch('');
                setFilterOrderBy('created_at');
                setFilterOrderDir('desc');
                setAppliedSearch('');
                setAppliedOrderBy('created_at');
                setAppliedOrderDir('desc');
                setShowFilter(false);
              }}
            >
              Reset
            </Button>
            <Button 
              variant="primary" 
              onClick={() => {
                setAppliedSearch(filterSearch);
                setAppliedOrderBy(filterOrderBy);
                setAppliedOrderDir(filterOrderDir);
                setShowFilter(false);
              }}
            >
              Terapkan
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-5">
          <Input 
            label="Pencarian"
            placeholder="Cari pengguna, perangkat, atau IP..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />

          <hr className="border-t border-slate-200 my-2" />

          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Urut Berdasarkan"
              value={filterOrderBy}
              onChange={(val) => setFilterOrderBy(val)}
              options={[
                { value: 'created_at', label: 'Waktu Login' },
                { value: 'username', label: 'Pengguna' },
                { value: 'ip_address', label: 'IP Address' }
              ]}
            />

            <Select 
              label="Arah"
              value={filterOrderDir}
              onChange={(val) => setFilterOrderDir(val)}
              options={[
                { value: 'asc', label: 'A - Z / Terlama' },
                { value: 'desc', label: 'Z - A / Terbaru' }
              ]}
            />
          </div>
        </div>
      </Drawer>

      {/* Force Logout Modal */}
      <Modal
        open={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        title="Paksa Keluar (Force Logout) Sesi?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelectedSession(null)}>Batal</Button>
            <Button variant="danger" onClick={handleForceLogout}>Paksa Logout</Button>
          </>
        }
      >
        <p className="text-slate-500">
          Paksa keluar pengguna <strong>{selectedSession?.user?.username || '-'}</strong> pada perangkat {selectedSession?.user_agent ? parseUserAgent(selectedSession.user_agent).browser : ''}? Tiket token SSO di perangkat tersebut akan dibatalkan seketika.
        </p>
      </Modal>
    </div>
  );
}
