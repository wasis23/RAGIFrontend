'use client';

import { useState, useEffect } from 'react';
import { History, Search, Eye, ShieldCheck, ShieldAlert, Key } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { adminService } from '@/services/admin.service';
import { formatDateTime } from '@/lib/utils';
import type { AuditLog } from '@/types/auth.types';

interface ExtendedAuditLog extends AuditLog {
  username: string;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<ExtendedAuditLog[]>([]);
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<ExtendedAuditLog | null>(null);

  const fetchLogs = async () => {
    try {
      const res = await adminService.getAuditLogs({ search });
      const list = Array.isArray(res?.data)
        ? res.data
        : (res?.data as { items?: ExtendedAuditLog[] })?.items ?? [];
      setLogs(list);
    } catch {
      toast.error('Gagal memuat audit log. Periksa koneksi ke server.');
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [search]);

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.username.toLowerCase().includes(search.toLowerCase()) ||
      l.ip_address.includes(search)
  );

  const getActionBadge = (action: string) => {
    if (action.includes('failed') || action.includes('delete')) {
      return <span className="badge badge-red">{action}</span>;
    }
    if (action.includes('success') || action.includes('verify')) {
      return <span className="badge badge-green">{action}</span>;
    }
    return <span className="badge badge-blue">{action}</span>;
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <PageHeader
        title="Audit Log Keamanan (Audit Logs Table)"
        description="Jejak audit otomatis seluruh peristiwa autentikasi & perubahan data (Tabel: audit_logs)"
      />

      <div className="card" style={{ padding: '1rem 1.25rem' }}>
        <div style={{ maxWidth: 400 }}>
          <Input
            placeholder="Cari aksi, username, atau IP address..."
            prefixIcon={<Search size={16} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Waktu Kejadian</th>
                <th>Pengguna</th>
                <th>Aksi (Action)</th>
                <th>IP Address</th>
                <th>Payload JSON</th>
                <th style={{ textAlign: 'right' }}>Detail</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>#{log.id}</td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    {formatDateTime(log.created_at)}
                  </td>
                  <td style={{ fontWeight: 700 }}>{log.username}</td>
                  <td>{getActionBadge(log.action)}</td>
                  <td>
                    <code style={{ background: 'var(--gray-100)', padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.8125rem' }}>
                      {log.ip_address}
                    </code>
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontFamily: 'monospace', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.payload}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Eye size={14} />}
                      onClick={() => setSelectedLog(log)}
                    >
                      Lihat
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
