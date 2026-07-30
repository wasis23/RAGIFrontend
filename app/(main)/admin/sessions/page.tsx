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

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<ExtendedSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ExtendedSession | null>(null);

  const fetchSessions = async () => {
    try {
      const res = await adminService.getAllSessions();
      // Backend mengirim UserSession dengan relasi user (username, email)
      const list = (Array.isArray(res?.data)
        ? res.data
        : ((res?.data as unknown as { items?: ExtendedSession[] })?.items ?? [])
      ) as ExtendedSession[];
      setSessions(list);
    } catch {
      toast.error('Gagal memuat data sesi. Periksa koneksi ke server.');
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
      toast.error(`Gagal memaksa logout sesi. Periksa koneksi ke server.`);
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
