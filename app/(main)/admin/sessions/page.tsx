'use client';

import { useState, useEffect } from 'react';
import { Activity, LogOut, Smartphone, Monitor, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { adminService } from '@/services/admin.service';
import { parseUserAgent, formatDateTime } from '@/lib/utils';
import type { UserSession } from '@/types/auth.types';

interface ExtendedSession extends UserSession {
  username: string;
  email: string;
}

const MOCK_GLOBAL_SESSIONS: ExtendedSession[] = [
  {
    id: 201,
    user_id: 1,
    username: 'admin_super',
    email: 'admin@kampus.ac.id',
    token: 'token_admin_xyz',
    ip_address: '180.252.164.21',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0 Safari/537.36',
    expires_at: new Date(Date.now() + 86400000 * 7).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 202,
    user_id: 2,
    username: 'dosen_siakad',
    email: 'dosen@kampus.ac.id',
    token: 'token_dosen_abc',
    ip_address: '36.85.12.99',
    user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
    expires_at: new Date(Date.now() + 86400000 * 5).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 203,
    user_id: 3,
    username: 'mahasiswa_demo',
    email: 'mhs@kampus.ac.id',
    token: 'token_mhs_qwe',
    ip_address: '114.124.200.45',
    user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) Mobile/15E148',
    expires_at: new Date(Date.now() + 86400000 * 3).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<ExtendedSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ExtendedSession | null>(null);

  const fetchSessions = async () => {
    try {
      const res = await adminService.getAllSessions();
      const list = Array.isArray(res?.data) ? res.data : (res?.data as any)?.items;
      setSessions(list?.length ? list : MOCK_GLOBAL_SESSIONS);
    } catch {
      setSessions(MOCK_GLOBAL_SESSIONS);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleForceLogout = async () => {
    if (!selectedSession) return;
    try {
      await adminService.forceLogoutSession(selectedSession.id);
      toast.success(`Sesi untuk ${selectedSession.username} telah dipaksa keluar.`);
      fetchSessions();
    } catch {
      setSessions((prev) => prev.filter((s) => s.id !== selectedSession.id));
      toast.success(`Sesi untuk ${selectedSession.username} dipaksa keluar (Mode lokal).`);
    } finally {
      setSelectedSession(null);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <PageHeader
        title="Monitor Sesi Perangkat Global (Global Sessions Table)"
        description="Pantau seluruh sesi aktif di universitas dan lakukan Force Logout jika diperlukan (Tabel: user_sessions)"
      />

      <div className="alert alert-info">
        <ShieldAlert size={20} style={{ flexShrink: 0 }} />
        <span>
          <strong>Keamanan Terpusat:</strong> Admin dapat memutus sesi pengguna yang terindikasi mencurigakan secara instan di seluruh ekosistem kampus.
        </span>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Pengguna</th>
                <th>Perangkat & Browser</th>
                <th>IP Address</th>
                <th>Waktu Login</th>
                <th>Kadaluarsa</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((sess) => {
                const { browser, os } = parseUserAgent(sess.user_agent);
                const isMobile = os === 'Android' || os === 'iOS';

                return (
                  <tr key={sess.id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>#{sess.id}</td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{sess.username}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sess.email}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {isMobile ? <Smartphone size={16} color="var(--primary-600)" /> : <Monitor size={16} color="var(--primary-600)" />}
                        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{browser} ({os})</span>
                      </div>
                    </td>
                    <td>
                      <code style={{ background: 'var(--gray-100)', padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.8125rem' }}>
                        {sess.ip_address}
                      </code>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {formatDateTime(sess.created_at)}
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {formatDateTime(sess.expires_at)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        icon={<LogOut size={14} />}
                        onClick={() => setSelectedSession(sess)}
                      >
                        Force Logout
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

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
        <p style={{ color: 'var(--text-secondary)' }}>
          Paksa keluar pengguna <strong>{selectedSession?.username}</strong> pada perangkat {selectedSession?.user_agent ? parseUserAgent(selectedSession.user_agent).browser : ''}? Tiket token SSO di perangkat tersebut akan dibatalkan seketika.
        </p>
      </Modal>
    </div>
  );
}
