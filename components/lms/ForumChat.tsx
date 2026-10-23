'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import type { LmsForumPost, LmsForumTopik } from '@/types/lms.types';
import { formatRelativeTime } from '@/lib/utils';
import { MessageSquare, Pencil, Send, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';

const editSchema = z.object({
  isi: z
    .string()
    .min(1, 'Isi pesan wajib diisi')
    .max(5000, 'Isi pesan maksimal 5000 karakter'),
});

type EditFormValues = z.infer<typeof editSchema>;

interface ForumChatProps {
  topik: LmsForumTopik | null;
  posts: LmsForumPost[];
  loadingPost: boolean;
  onSend: (isi: string, parentId: number | null) => Promise<void> | void;
  onDeletePost: (postId: number) => Promise<void> | void;
  /** Aksi edit pesan; bila tidak diberikan, menu Edit tidak ditampilkan. */
  onEditPost?: (postId: number, isi: string) => Promise<void> | void;
  sending?: boolean;
  currentName?: string;
  /** ID pengguna aktif — dipakai agar kepemilikan pesan akurat (fallback: nama). */
  currentUserId?: number | null;
  /** Pengelola kelas boleh mengedit pesan siapa pun (moderasi). */
  canManage?: boolean;
  allowReply?: boolean;
  /** Interval polling opsional (ms). Bila diisi + onRefresh ada, auto-refresh tiap interval. */
  pollIntervalMs?: number;
  onRefresh?: () => void;
  /** Aksi tambahan di header (mis. hapus topik oleh dosen). */
  headerExtra?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
}

export default function ForumChat({
  topik,
  posts,
  loadingPost,
  onSend,
  onDeletePost,
  onEditPost,
  sending = false,
  currentName = '',
  currentUserId = null,
  canManage = false,
  allowReply = true,
  pollIntervalMs,
  onRefresh,
  headerExtra,
  emptyTitle = 'Pilih topik',
  emptyDescription = 'Pilih topik untuk membaca dan membalas diskusi.',
}: ForumChatProps) {
  const [pesan, setPesan] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editTarget, setEditTarget] = useState<LmsForumPost | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const editForm = useForm<EditFormValues>({
    resolver: zodResolver(editSchema) as any,
    defaultValues: { isi: '' },
  });

  useEffect(() => {
    if (!topik || !pollIntervalMs || !onRefresh) return;
    const t = setInterval(() => {
      onRefresh();
    }, pollIntervalMs);
    return () => clearInterval(t);
  }, [topik, pollIntervalMs, onRefresh]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [posts, sending]);

  useEffect(() => {
    setPesan('');
    setReplyTo(null);
  }, [topik?.id]);

  const isMine = (p: LmsForumPost) => {
    if (currentUserId !== null && p.user_id !== null && p.user_id !== undefined) {
      return Number(p.user_id) === Number(currentUserId);
    }
    if (!currentName) return false;
    return p.nama_penulis === currentName;
  };

  const handleSend = async () => {
    if (!pesan.trim()) return;
    await onSend(pesan.trim(), replyTo);
    setPesan('');
    setReplyTo(null);
  };

  const openEdit = (p: LmsForumPost) => {
    setEditTarget(p);
    editForm.reset({ isi: p.isi });
  };

  const submitEdit = editForm.handleSubmit(async (values) => {
    if (!editTarget || !onEditPost) return;
    setSavingEdit(true);
    try {
      await onEditPost(editTarget.id, values.isi.trim());
      setEditTarget(null);
    } finally {
      setSavingEdit(false);
    }
  });

  const renderBubble = (p: LmsForumPost, mine: boolean, withReply: boolean) => (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl p-3 border ${
          mine
            ? 'rounded-br-md text-white border-transparent'
            : 'rounded-bl-md bg-white border-slate-200'
        }`}
        style={mine ? { backgroundColor: 'var(--module-primary)' } : undefined}
      >
        <div className="flex items-center justify-between gap-2">
          <span className={`text-2xs font-bold ${mine ? 'text-white/90' : 'text-[var(--module-primary)]'}`}>
            {mine ? 'Anda' : p.nama_penulis}
          </span>
          <div className="flex items-center gap-1">
            <span className={`text-2xs ${mine ? 'text-white/70' : 'text-slate-400'}`}>
              {new Date(p.created_at).toLocaleString('id-ID')}
            </span>
            <DropdownMenu
              items={[
                ...(withReply
                  ? [{ label: 'Balas', icon: <Send size={16} />, onClick: () => setReplyTo(p.id) }]
                  : []),
                ...(onEditPost && (mine || canManage)
                  ? [{ label: 'Edit Pesan', icon: <Pencil size={16} />, onClick: () => openEdit(p) }]
                  : []),
                { label: 'Hapus', icon: <Trash2 size={16} />, onClick: () => setDeleteId(p.id) },
              ]}
            />
          </div>
        </div>
        <p className={`text-xs whitespace-pre-wrap mt-1 ${mine ? 'text-white' : 'text-slate-800'}`}>{p.isi}</p>
        {p.is_edited && (
          <span className={`text-2xs mt-1 block ${mine ? 'text-white/60' : 'text-slate-400'}`}>
            diedit{p.updated_at ? ` · ${formatRelativeTime(p.updated_at)}` : ''}
          </span>
        )}
      </div>
    </div>
  );

  if (!topik) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h5 className="text-xs font-bold flex items-center gap-2">
          <MessageSquare size={16} style={{ color: 'var(--module-primary)' }} />
          {topik.judul}
        </h5>
        <div className="flex items-center gap-2">
          <Badge variant="gray">{topik.total_post ?? topik.posts_count ?? posts.length} pesan</Badge>
          {headerExtra}
        </div>
      </div>
      <div ref={scrollRef} className="space-y-3 max-h-96 overflow-y-auto p-2 bg-slate-50/60 rounded-xl">
        {loadingPost && <p className="text-2xs text-slate-400">Memuat pesan...</p>}
        {posts.map((p) => (
          <div key={p.id} className="space-y-2">
            {renderBubble(p, isMine(p), allowReply)}
            {p.balasan?.map((b) => (
              <div key={b.id} className={`flex ${isMine(b) ? 'justify-end' : 'justify-start'} pl-6`}>
                {renderBubble(b, isMine(b), false)}
              </div>
            ))}
          </div>
        ))}
        {posts.length === 0 && !loadingPost && <p className="text-2xs text-slate-400">Belum ada pesan. Mulai diskusi!</p>}
      </div>
      <div className="space-y-2 border-t pt-3">
        {replyTo && (
          <div className="flex items-center justify-between text-2xs text-slate-500">
            <span>Membalas pesan... <Button size="sm" variant="ghost" onClick={() => setReplyTo(null)}>Batal</Button></span>
          </div>
        )}
        <Textarea placeholder="Tulis pesan diskusi..." value={pesan} onChange={(e) => setPesan(e.target.value)} />
        <div className="flex justify-end">
          <Button size="sm" icon={<Send size={16} />} loading={sending} disabled={sending || !pesan.trim()} onClick={handleSend}>
            Kirim
          </Button>
        </div>
      </div>

      <Modal
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
        title="Edit Pesan"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              Batal
            </Button>
            <Button
              type="submit"
              form="form-edit-pesan-forum"
              icon={<Pencil size={16} />}
              loading={savingEdit}
              disabled={savingEdit}
            >
              Simpan
            </Button>
          </div>
        }
      >
        <form id="form-edit-pesan-forum" onSubmit={submitEdit} className="grid grid-cols-1 gap-4">
          <Textarea
            label="Isi Pesan"
            placeholder="Tulis pesan diskusi..."
            error={editForm.formState.errors.isi?.message}
            {...editForm.register('isi')}
          />
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (deleteId !== null) await onDeletePost(deleteId);
          setDeleteId(null);
        }}
        title="Hapus Pesan"
        message={<span>Yakin hapus pesan ini?</span>}
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
