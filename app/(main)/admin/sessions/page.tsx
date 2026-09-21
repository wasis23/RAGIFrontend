'use client';

import { useState, useEffect } from 'react';
import { LogOut, Smartphone, Monitor, Filter, MoreVertical, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { adminService } from '@/services/admin.service';
import { parseUserAgent, formatDateTime } from '@/lib/utils';
import type { UserSession } from '@/types/auth.types';
import type { PaginationMeta } from '@/types/api.types';

interface ExtendedSession extends UserSession {
  user?: {
    id: number;
    name?: string;
    username: string;
    email: string;
  };
}

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<ExtendedSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<ExtendedSession | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Pagination & Filter States
  const [page, setPage] = useState<number>(1);
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined);
  const [filterLimit, setFilterLimit] = useState<string>('15');

  const [showFilter, setShowFilter] = useState(false);
  const [filterUsername, setFilterUsername] = useState('');
  const [filterIp, setFilterIp] = useState('');
  const [filterUserAgent, setFilterUserAgent] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterOrderBy, setFilterOrderBy] = useState('created_at');
  const [filterOrderDir, setFilterOrderDir] = useState('desc');

  const [appliedFilters, setAppliedFilters] = useState({
    username: '',
    ip: '',
    userAgent: '',
    date: '',
    orderBy: 'created_at',
    orderDir: 'desc',
  });

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const params: any = { page };
      if (appliedFilters.username !== '') params.username = appliedFilters.username;
      if (appliedFilters.ip !== '') params.ip_address = appliedFilters.ip;
      if (appliedFilters.userAgent !== '') params.user_agent = appliedFilters.userAgent;
      if (appliedFilters.date !== '') params.created_at = appliedFilters.date;
      if (appliedFilters.orderBy !== '') params.order_by = appliedFilters.orderBy;
      if (appliedFilters.orderDir !== '') params.order_dir = appliedFilters.orderDir;
      if (filterLimit !== '') params.limit = filterLimit;

      const res: any = await adminService.getAllSessions(params);
      let sessionList: ExtendedSession[] = [];
      let metaData = undefined;

      if (res && Array.isArray(res.data) && 'current_page' in res) {
        sessionList = res.data;
        metaData = {
          current_page: res.current_page,
          last_page: res.last_page,
          per_page: res.per_page,
          total: res.total,
          from: res.from,
          to: res.to,
        };
      } else if (res && res.data && Array.isArray(res.data.items)) {
        sessionList = res.data.items;
        metaData = res.data.meta;
      } else if (res && Array.isArray(res.data)) {
        sessionList = res.data;
        if (res.meta) {
          metaData = res.meta;
        }
      } else if (Array.isArray(res)) {
        sessionList = res;
      }

      setSessions(sessionList);
      setMeta(metaData);
    } catch {
      toast.error('Gagal memuat data sesi. Periksa koneksi ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [
    page,
    filterLimit,
    appliedFilters.username,
    appliedFilters.ip,
    appliedFilters.userAgent,
    appliedFilters.date,
    appliedFilters.orderBy,
    appliedFilters.orderDir,
  ]);

  const handleForceLogout = async () => {
    if (!selectedSession) return;
    setIsLoggingOut(true);
    try {
      await adminService.forceLogoutSession(selectedSession.id);
      const userDisplay = selectedSession.user?.name || selectedSession.user?.username || 'pengguna';
      toast.success(`Sesi untuk ${userDisplay} telah dipaksa keluar.`);
      fetchSessions();
    } catch {
      toast.error('Gagal memaksa logout sesi. Periksa koneksi ke server.');
    } finally {
      setIsLoggingOut(false);
      setSelectedSession(null);
    }
  };

  const columns: ColumnDef<ExtendedSession>[] = [
    {
      key: 'id',
      label: 'No',
      render: (row, index) => (
        <span className="font-bold text-slate-400">{meta?.from ? meta.from + index : index + 1}</span>
      ),
    },
    {
      key: 'user',
      label: 'Pengguna',
      render: (row) => {
        const displayName = row.user?.name || row.user?.username || 'Tidak Diketahui';
        return (
          <div className="flex items-center gap-3">
            <div className="avatar avatar-sm">
              {displayName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="font-bold text-slate-900">{displayName}</div>
              <div className="text-xs text-slate-400">
                {row.user?.username ? `${row.user.username} • ` : ''}
                {row.user?.email || '-'}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'ip_address',
      label: 'Alamat IP',
      render: (row) => (
        <code className="bg-slate-100 px-2 py-0.5 rounded text-xs font-mono font-bold text-slate-800">
          {row.ip_address}
        </code>
      ),
    },
    {
      key: 'device',
      label: 'Perangkat & Browser',
      render: (row) => {
        const { browser, os } = parseUserAgent(row.user_agent);
        const isMobile =
          os.toLowerCase().includes('android') ||
          os.toLowerCase().includes('ios') ||
          row.user_agent.toLowerCase().includes('mobile');
        return (
          <div className="flex items-center gap-2">
            {isMobile ? (
              <Smartphone size={16} className="text-slate-400 shrink-0" />
            ) : (
              <Monitor size={16} className="text-slate-400 shrink-0" />
            )}
            <div className="text-xs">
              <span className="font-semibold text-slate-800">{browser}</span>
              <span className="text-slate-400 ml-1">({os})</span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'created_at',
      label: 'Waktu Login',
      render: (row) => (
        <span className="text-xs text-slate-500">{formatDateTime(row.created_at)}</span>
      ),
    },
    {
      key: 'aksi',
      label: 'Aksi',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end">
          <DropdownMenu
            items={[
              {
                label: 'Paksa Keluar (Force Logout)',
                icon: <LogOut size={14} />,
                variant: 'danger',
                onClick: () => setSelectedSession(row),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in flex w-full flex-col gap-6">
      <PageHeader
        title="Manajemen Sesi Pengguna (User Sessions)"
        description="Monitor dan kelola seluruh token autentikasi aktif pada ekosistem SSO (Tabel: user_sessions)"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setShowFilter(true)}
              style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
            >
              Filter
            </Button>
          </div>
        }
      />

      <div className="w-full bg-white rounded-xl shadow-2xs border border-slate-200">
        <DataTable
          columns={columns}
          data={sessions}
          isLoading={isLoading}
          meta={meta}
          onPageChange={(p) => setPage(p)}
          onLimitChange={(l) => {
            setFilterLimit(l.toString());
            setPage(1);
          }}
        />
      </div>

      {/* Filter Drawer */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Sesi Pengguna"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setFilterUsername('');
                setFilterIp('');
                setFilterUserAgent('');
                setFilterDate('');
                setFilterOrderBy('created_at');
                setFilterOrderDir('desc');
                setAppliedFilters({
                  username: '',
                  ip: '',
                  userAgent: '',
                  date: '',
                  orderBy: 'created_at',
                  orderDir: 'desc',
                });
                setPage(1);
                setShowFilter(false);
              }}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setAppliedFilters({
                  username: filterUsername,
                  ip: filterIp,
                  userAgent: filterUserAgent,
                  date: filterDate,
                  orderBy: filterOrderBy,
                  orderDir: filterOrderDir,
                });
                setPage(1);
                setShowFilter(false);
              }}
            >
              Terapkan
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Pengguna"
            placeholder="Cari nama atau username pengguna..."
            value={filterUsername}
            onChange={(e) => setFilterUsername(e.target.value)}
          />

          <Input
            label="Alamat IP"
            placeholder="Contoh: 127.0.0.1 atau 192.168.1.1..."
            value={filterIp}
            onChange={(e) => setFilterIp(e.target.value)}
          />

          <Input
            label="Perangkat & Browser"
            placeholder="Cari browser atau OS (contoh: Chrome, Windows)..."
            value={filterUserAgent}
            onChange={(e) => setFilterUserAgent(e.target.value)}
          />

          <Input
            label="Tanggal Login"
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />

          <hr className="border-slate-200" />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={filterOrderBy}
              onChange={(val) => setFilterOrderBy(val)}
              options={[
                { value: 'id', label: 'ID Sesi' },
                { value: 'user_id', label: 'ID Pengguna' },
                { value: 'ip_address', label: 'Alamat IP' },
                { value: 'user_agent', label: 'Perangkat & Browser' },
                { value: 'created_at', label: 'Waktu Login' },
              ]}
            />
            <Select
              label="Arah Urutan"
              value={filterOrderDir}
              onChange={(val) => setFilterOrderDir(val)}
              options={[
                { value: 'desc', label: 'Z - A (Terbaru)' },
                { value: 'asc', label: 'A - Z (Terlama)' },
              ]}
            />
          </div>
        </div>
      </Drawer>

      {/* Force Logout Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        onConfirm={handleForceLogout}
        title="Paksa Keluar Sesi Pengguna?"
        message={
          <>
            Apakah Anda yakin ingin memutus paksa sesi untuk{' '}
            <strong>
              {selectedSession?.user?.name || selectedSession?.user?.username || 'pengguna ini'}
            </strong>{' '}
            pada alamat IP <code>{selectedSession?.ip_address}</code>? Token otentikasi akan segera dicabut dan pengguna akan logout otomatis.
          </>
        }
        confirmText="Ya, Paksa Keluar"
        cancelText="Batal"
        isLoading={isLoggingOut}
        variant="danger"
      />
    </div>
  );
}
