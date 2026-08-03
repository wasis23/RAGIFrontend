'use client';

import { useState, useEffect } from 'react';
import { History, Search, Eye, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { adminService } from '@/services/admin.service';
import { formatDateTime } from '@/lib/utils';
import type { AuditLog } from '@/types/auth.types';

interface ExtendedAuditLog extends AuditLog {
  username: string;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<ExtendedAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<ExtendedAuditLog | null>(null);

  // Filter States
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getAuditLogs({ search: appliedSearch });
      const list = (Array.isArray(res?.data)
        ? res.data
        : ((res?.data as unknown as { items?: ExtendedAuditLog[] })?.items ?? [])
      ) as ExtendedAuditLog[];
      setLogs(list);
    } catch {
      toast.error('Gagal memuat audit log. Periksa koneksi ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [appliedSearch]);

  const getActionBadge = (action: string) => {
    if (action.includes('failed') || action.includes('delete')) {
      return <span className="badge badge-red">{action}</span>;
    }
    if (action.includes('success') || action.includes('verify')) {
      return <span className="badge badge-green">{action}</span>;
    }
    return <span className="badge badge-blue">{action}</span>;
  };

  const columns: ColumnDef<ExtendedAuditLog>[] = [
    { key: 'id', label: 'ID', render: (row) => <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>#{row.id}</span> },
    { key: 'created_at', label: 'Waktu Kejadian', render: (row) => (
      <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
        {formatDateTime(row.created_at)}
      </span>
    )},
    { key: 'username', label: 'Pengguna', render: (row) => <span style={{ fontWeight: 700 }}>{row.username}</span> },
    { key: 'action', label: 'Aksi (Action)', render: (row) => getActionBadge(row.action) },
    { key: 'ip_address', label: 'IP Address', render: (row) => (
      <code style={{ background: 'var(--gray-100)', padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.8125rem' }}>
        {row.ip_address}
      </code>
    )},
    { key: 'payload', label: 'Payload JSON', render: (row) => (
      <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontFamily: 'monospace', maxWidth: 200, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {row.payload}
      </span>
    )},
    { key: 'detail', label: 'Detail', align: 'right', render: (row) => (
      <Button
        variant="ghost"
        size="sm"
        icon={<Eye size={14} />}
        onClick={() => setSelectedLog(row)}
      >
        Lihat
      </Button>
    )},
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <PageHeader
        title="Audit Log Keamanan (Audit Logs Table)"
        description="Jejak audit otomatis seluruh peristiwa autentikasi & perubahan data (Tabel: audit_logs)"
        action={
          <Button 
            style={{ backgroundColor: '#f97316', color: '#fff', border: 'none' }} 
            icon={<Filter size={16} />} 
            onClick={() => setShowFilter(true)}
          >
            Filter Logs
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={logs}
        isLoading={isLoading}
      />

      {/* Filter Drawer */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Audit Logs"
        footer={
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button 
              variant="secondary" 
              onClick={() => {
                setFilterSearch('');
                setAppliedSearch('');
                setShowFilter(false);
              }}
            >
              Reset
            </Button>
            <Button 
              variant="primary" 
              onClick={() => {
                setAppliedSearch(filterSearch);
                setShowFilter(false);
              }}
            >
              Terapkan
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Input 
            label="Pencarian Bebas"
            placeholder="Cari aksi, username, atau IP address..."
            prefixIcon={<Search size={16} />}
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />
        </div>
      </Drawer>

      {/* Modal Detail Payload */}
      <Modal
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={`Audit Log #${selectedLog?.id} — ${selectedLog?.action}`}
        footer={<Button variant="secondary" onClick={() => setSelectedLog(null)}>Tutup</Button>}
      >
        {selectedLog && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem' }}>
              <div><strong>Pengguna:</strong> {selectedLog.username} (ID #{selectedLog.user_id})</div>
              <div><strong>IP Address:</strong> {selectedLog.ip_address}</div>
              <div><strong>Waktu:</strong> {formatDateTime(selectedLog.created_at)}</div>
              <div><strong>User Agent:</strong> {selectedLog.user_agent}</div>
            </div>

            <div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.5rem' }}>Payload Data (JSON):</div>
              <pre style={{
                background: 'var(--gray-900)',
                color: '#38bdf8',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8125rem',
                overflowX: 'auto',
              }}>
                {selectedLog.payload ? JSON.stringify(JSON.parse(selectedLog.payload), null, 2) : '{}'}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
