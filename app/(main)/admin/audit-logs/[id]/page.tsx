'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ShieldCheck, Clock, Globe, User as UserIcon, Terminal, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { adminService } from '@/services/admin.service';
import { formatDateTime } from '@/lib/utils';
import type { AuditLog } from '@/types/auth.types';

interface ExtendedAuditLog extends AuditLog {
  username?: string;
  user?: {
    id: number;
    name?: string;
    username: string;
    email: string;
  };
}

export default function AuditLogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [log, setLog] = useState<ExtendedAuditLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    adminService.getAuditLogById(id)
      .then((res: any) => {
        const item = res?.data || res;
        setLog(item);
      })
      .catch((err) => {
        console.error('Gagal memuat detail audit log:', err);
        toast.error('Gagal memuat detail audit log');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  const getActionBadgeVariant = (action?: string) => {
    const act = (action || '').toLowerCase();
    if (act.includes('fail') || act.includes('delete') || act.includes('revoke') || act.includes('destroy')) {
      return 'danger' as const;
    }
    if (act.includes('success') || act.includes('verify') || act.includes('create') || act.includes('login')) {
      return 'success' as const;
    }
    return 'info' as const;
  };

  return (
    <div className="animate-fade-in flex w-full flex-col gap-6">
      <PageHeader
        title={`Detail Audit Log #${id}`}
        description="Informasi rinci jejak audit, metadata perangkat, dan payload rekaman perubahan sistem"
        action={
          <Button
            icon={<ArrowLeft size={16} />}
            onClick={() => router.push('/admin/audit-logs')}
            style={{ background: 'var(--module-primary)' }}
          >
            Kembali
          </Button>
        }
      />

      {isLoading ? (
        <div className="w-full p-6 bg-white rounded-xl border border-slate-200 text-center text-slate-500">
          Memuat detail audit log...
        </div>
      ) : !log ? (
        <div className="w-full p-6 bg-white rounded-xl border border-slate-200 text-center text-slate-500">
          Data audit log tidak ditemukan.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Card 1: Ringkasan Entitas & Pelaku */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <ShieldCheck size={18} />
                Informasi Utama Peristiwa
              </h3>
              <Badge variant={getActionBadgeVariant(log.action)}>
                {log.action}
              </Badge>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <UserIcon size={14} />
                    Pengguna / Pelaku
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    {log.user?.name || log.user?.username || log.username || 'System'}
                    {log.user_id ? ` (ID #${log.user_id})` : ''}
                  </div>
                  <div className="text-xs text-slate-400">
                    {log.user?.email || 'Aksi sistem internal'}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <Clock size={14} />
                    Waktu Kejadian
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    {formatDateTime(log.created_at)}
                  </div>
                  <div className="text-xs text-slate-400">
                    Timestamp presisi server
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <Globe size={14} />
                    Alamat IP
                  </div>
                  <div>
                    <code className="bg-white px-2 py-0.5 rounded border border-slate-200 text-xs font-mono font-bold text-slate-800">
                      {log.ip_address || '-'}
                    </code>
                  </div>
                  <div className="text-xs text-slate-400">
                    IP jaringan pengirim request
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <Layers size={14} />
                    Modul & Target
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    {log.module || 'IAM'} • {log.table_name || 'core_users'}
                  </div>
                  <div className="text-xs text-slate-400">
                    Konteks domain sistem
                  </div>
                </div>
              </div>

              {log.user_agent && (
                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                  <span className="text-xs font-semibold text-slate-500 block">User Agent (Browser / Client):</span>
                  <code className="text-xs font-mono text-slate-700 break-all block leading-relaxed">
                    {log.user_agent}
                  </code>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Payload Data JSON */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Terminal size={18} />
                Payload Data (JSON)
              </h3>
            </div>
            <div className="card-body">
              <pre className="p-4 bg-slate-900 text-emerald-400 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed max-h-96">
                {(() => {
                  try {
                    return log.payload
                      ? JSON.stringify(
                          typeof log.payload === 'string'
                            ? JSON.parse(log.payload)
                            : log.payload,
                          null,
                          2
                        )
                      : '{}';
                  } catch {
                    return String(log.payload || '{}');
                  }
                })()}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
