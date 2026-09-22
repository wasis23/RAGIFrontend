'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Filter, MoreVertical, Search, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { adminService } from '@/services/admin.service';
import { formatDateTime } from '@/lib/utils';
import type { AuditLog } from '@/types/auth.types';
import type { PaginationMeta } from '@/types/api.types';

interface ExtendedAuditLog extends AuditLog {
  username?: string;
  user?: {
    id: number;
    name?: string;
    username: string;
    email: string;
  };
}

export default function AdminAuditLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<ExtendedAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination & Filter States
  const [page, setPage] = useState<number>(1);
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined);
  const [filterLimit, setFilterLimit] = useState<string>('15');

  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterUsername, setFilterUsername] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterIp, setFilterIp] = useState('');
  const [filterPayload, setFilterPayload] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterOrderBy, setFilterOrderBy] = useState('created_at');
  const [filterOrderDir, setFilterOrderDir] = useState('desc');

  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    username: '',
    action: '',
    ip: '',
    payload: '',
    date: '',
    orderBy: 'created_at',
    orderDir: 'desc',
  });

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params: any = { page };
      if (appliedFilters.search !== '') params.search = appliedFilters.search;
      if (appliedFilters.username !== '') params.username = appliedFilters.username;
      if (appliedFilters.action !== '') params.action = appliedFilters.action;
      if (appliedFilters.ip !== '') params.ip_address = appliedFilters.ip;
      if (appliedFilters.payload !== '') params.payload = appliedFilters.payload;
      if (appliedFilters.date !== '') params.created_at = appliedFilters.date;
      if (appliedFilters.orderBy !== '') params.order_by = appliedFilters.orderBy;
      if (appliedFilters.orderDir !== '') params.order_dir = appliedFilters.orderDir;
      if (filterLimit !== '') params.limit = filterLimit;

      const res: any = await adminService.getAuditLogs(params);
      let logList: ExtendedAuditLog[] = [];
      let metaData = undefined;

      if (res && Array.isArray(res.data) && 'current_page' in res) {
        logList = res.data;
        metaData = {
          current_page: res.current_page,
          last_page: res.last_page,
          per_page: res.per_page,
          total: res.total,
          from: res.from,
          to: res.to,
        };
      } else if (res && res.data && Array.isArray(res.data.items)) {
        logList = res.data.items;
        metaData = res.data.meta;
      } else if (res && Array.isArray(res.data)) {
        logList = res.data;
        if (res.meta) {
          metaData = res.meta;
        }
      } else if (Array.isArray(res)) {
        logList = res;
      }

      setLogs(logList);
      setMeta(metaData);
    } catch {
      toast.error('Gagal memuat audit log. Periksa koneksi ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [
    page,
    filterLimit,
    appliedFilters.search,
    appliedFilters.username,
    appliedFilters.action,
    appliedFilters.ip,
    appliedFilters.payload,
    appliedFilters.date,
    appliedFilters.orderBy,
    appliedFilters.orderDir,
  ]);

  const getActionBadge = (action: string) => {
    const act = (action || '').toLowerCase();
    if (act.includes('fail') || act.includes('delete') || act.includes('revoke') || act.includes('destroy')) {
      return <Badge variant="danger">{action}</Badge>;
    }
    if (act.includes('success') || act.includes('verify') || act.includes('create') || act.includes('login')) {
      return <Badge variant="success">{action}</Badge>;
    }
    return <Badge variant="info">{action}</Badge>;
  };

  const columns: ColumnDef<ExtendedAuditLog>[] = [
    {
      key: 'id',
      label: 'No',
      render: (row, index) => (
        <span className="font-bold text-slate-400">{meta?.from ? meta.from + index : index + 1}</span>
      ),
    },
    {
      key: 'created_at',
      label: 'Waktu Kejadian',
      render: (row) => (
        <span className="text-xs text-slate-500 whitespace-nowrap">
          {formatDateTime(row.created_at)}
        </span>
      ),
    },
    {
      key: 'username',
      label: 'Pengguna',
      render: (row) => {
        const displayName = row.user?.name || row.user?.username || row.username || 'System';
        return (
          <div>
            <div className="font-bold text-slate-900 text-xs">{displayName}</div>
            <div className="text-2xs text-slate-400">
              {row.user?.email || (row.user_id ? `ID #${row.user_id}` : '-')}
            </div>
          </div>
        );
      },
    },
    {
      key: 'action',
      label: 'Aksi (Action)',
      render: (row) => getActionBadge(row.action),
    },
    {
      key: 'ip_address',
      label: 'Alamat IP',
      render: (row) => (
        <code className="bg-slate-100 px-2 py-0.5 rounded text-xs font-mono font-bold text-slate-800">
          {row.ip_address || '-'}
        </code>
      ),
    },
    {
      key: 'payload',
      label: 'Payload JSON',
      render: (row) => (
        <span className="text-xs text-slate-500 font-mono max-w-[200px] inline-block overflow-hidden text-ellipsis whitespace-nowrap">
          {row.payload || '-'}
        </span>
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
                label: 'Detail Log & Payload',
                icon: <Eye size={14} />,
                onClick: () => router.push(`/admin/audit-logs/${row.id}`),
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
        title="Audit Log Keamanan (Audit Logs Table)"
        description="Jejak audit otomatis seluruh peristiwa autentikasi & perubahan data (Tabel: audit_logs)"
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
          data={logs}
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
        title="Filter Audit Logs"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setFilterSearch('');
                setFilterUsername('');
                setFilterAction('');
                setFilterIp('');
                setFilterPayload('');
                setFilterDate('');
                setFilterOrderBy('created_at');
                setFilterOrderDir('desc');
                setAppliedFilters({
                  search: '',
                  username: '',
                  action: '',
                  ip: '',
                  payload: '',
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
                  search: filterSearch,
                  username: filterUsername,
                  action: filterAction,
                  ip: filterIp,
                  payload: filterPayload,
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
            label="Pencarian Bebas"
            placeholder="Cari aksi, username, atau alamat IP..."
            prefixIcon={<Search size={16} />}
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />

          <Input
            label="Pengguna"
            placeholder="Cari nama atau username pengguna..."
            value={filterUsername}
            onChange={(e) => setFilterUsername(e.target.value)}
          />

          <Input
            label="Aksi (Action)"
            placeholder="Contoh: login, logout, create, update..."
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
          />

          <Input
            label="Alamat IP"
            placeholder="Contoh: 127.0.0.1 atau 192.168.1.1..."
            value={filterIp}
            onChange={(e) => setFilterIp(e.target.value)}
          />

          <Input
            label="Payload JSON"
            placeholder="Cari kata kunci dalam payload..."
            value={filterPayload}
            onChange={(e) => setFilterPayload(e.target.value)}
          />

          <Input
            label="Tanggal Kejadian"
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
                { value: 'created_at', label: 'Waktu Kejadian' },
                { value: 'id', label: 'ID Log' },
                { value: 'user_id', label: 'ID Pengguna' },
                { value: 'action', label: 'Aksi (Action)' },
                { value: 'ip_address', label: 'Alamat IP' },
                { value: 'module', label: 'Modul Sistem' },
                { value: 'table_name', label: 'Nama Tabel' },
                { value: 'payload', label: 'Payload JSON' },
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
    </div>
  );
}
