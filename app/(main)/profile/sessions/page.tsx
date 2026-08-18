'use client';

import { useState, useEffect } from 'react';
import { Smartphone, Monitor, Globe, LogOut, ShieldAlert, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { parseUserAgent, formatDateTime } from '@/lib/utils';
import { sessionService } from '@/services/session.service';
import type { UserSession } from '@/types/auth.types';

export default function SessionsPage() {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<UserSession | null>(null);
  const [showRevokeAllModal, setShowRevokeAllModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock sessions list if backend not available
  const mockSessions: UserSession[] = [
    {
      id: 101,
      user_id: 1,
      token: 'sess_token_curr_123',
      ip_address: '180.252.164.21',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
      expires_at: new Date(Date.now() + 86400000 * 7).toISOString(),
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 102,
      user_id: 1,
      token: 'sess_token_mobile_456',
      ip_address: '114.124.201.88',
      user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
      expires_at: new Date(Date.now() + 86400000 * 5).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
  ];

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const res = await sessionService.getMySessions();
      setSessions(res.data && res.data.length > 0 ? res.data : mockSessions);
    } catch {
      setSessions(mockSessions);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevokeSingle = async () => {
    if (!selectedSession) return;
    setIsSubmitting(true);
    try {
      await sessionService.deleteSession(selectedSession.id);
      toast.success('Sesi berhasil dihentikan!');
      setSessions((prev) => prev.filter((s) => s.id !== selectedSession.id));
      setSelectedSession(null);
    } catch {
      toast.error('Gagal menghentikan sesi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeAllOthers = async () => {
    setIsSubmitting(true);
    try {
      await sessionService.deleteAllOtherSessions();
      toast.success('Semua sesi perangkat lain telah berhasil dihentikan!');
      setSessions((prev) => prev.slice(0, 1));
      setShowRevokeAllModal(false);
    } catch {
      toast.error('Gagal menghentikan sesi lain.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-8">
      <PageHeader
        title="Kelola Sesi Perangkat (Active Sessions)"
        description="Daftar perangkat yang saat ini memiliki akses aktif ke akun SSO Anda (Tabel: user_sessions)"
        action={
          sessions.length > 1 && (
            <Button
              variant="danger"
              icon={<LogOut size={16} />}
              onClick={() => setShowRevokeAllModal(true)}
            >
              Keluar Semua Sesi Lain
            </Button>
          )
        }
      />

      <div className="alert alert-info">
        <ShieldAlert size={20} className="shrink-0" />
        <div>
          <strong>Informasi Keamanan:</strong> Jika Anda melihat lokasi atau perangkat yang tidak Anda kenali, segera hentikan sesi tersebut dan ubah password akun SSO Anda.
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton height="100px" />
            <Skeleton height="100px" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="empty-state card">
            <Smartphone size={48} color="var(--text-muted)" />
            <div>Tidak ada sesi aktif ditemukan</div>
          </div>
        ) : (
          sessions.map((sess, idx) => {
            const { browser, os } = parseUserAgent(sess.user_agent);
            const isMobile = os === 'Android' || os === 'iOS';
            const isCurrent = idx === 0;

            return (
              <div key={sess.id} className="card session-card">
                <div className="session-card-inner">
                  <div className="session-info">
                    <div className={`session-icon${isCurrent ? ' current' : ''}`}>
                      {isMobile ? <Smartphone size={24} /> : <Monitor size={24} />}
                    </div>

                    <div>
                      <div className="session-title-row">
                        <h4 className="text-base font-bold m-0">
                          {browser} di {os}
                        </h4>
                        {isCurrent ? (
                          <span className="badge badge-green badge-dot">
                            Perangkat Ini
                          </span>
                        ) : (
                          <span className="badge badge-gray">Sesi Aktif</span>
                        )}
                      </div>

                      <div className="session-meta">
                        <span className="session-meta-item">
                          <Globe size={14} /> IP: {sess.ip_address}
                        </span>
                        <span>Aktif sejak: {formatDateTime(sess.created_at)}</span>
                        <span>Kadaluarsa: {formatDateTime(sess.expires_at)}</span>
                      </div>
                    </div>
                  </div>

                  {!isCurrent && (
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<LogOut size={14} />}
                      onClick={() => setSelectedSession(sess)}
                    >
                      Hentikan Akses
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Confirm Revoke Single */}
      <Modal
        open={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        title="Hentikan Sesi Perangkat?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelectedSession(null)}>Batal</Button>
            <Button variant="danger" loading={isSubmitting} onClick={handleRevokeSingle}>
              Hentikan Sesi
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-500">
          Perangkat ini akan dipaksa keluar dari semua layanan SSO kampus. Pengguna di perangkat ini harus memasukkan credentials kembali untuk login.
        </p>
      </Modal>

      {/* Modal Confirm Revoke All */}
      <Modal
        open={showRevokeAllModal}
        onClose={() => setShowRevokeAllModal(false)}
        title="Hentikan Semua Sesi Lain?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowRevokeAllModal(false)}>Batal</Button>
            <Button variant="danger" loading={isSubmitting} onClick={handleRevokeAllOthers}>
              Hentikan Semua
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-500">
          Semua sesi login di komputer atau smartphone lain akan dihentikan seketika. Hanya sesi di perangkat ini yang tetap aktif.
        </p>
      </Modal>
    </div>
  );
}
