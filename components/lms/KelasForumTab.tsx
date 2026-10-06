'use client';

import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { EmptyState } from '@/components/ui/EmptyState';
import { lmsService } from '@/services/lms.service';
import type { LmsForumTopik, LmsForumPost } from '@/types/lms.types';
import { Plus, X, Send, Trash2, Pin, MessageSquare } from 'lucide-react';

const topikSchema = z.object({
  judul: z.string().min(1, 'Judul topik wajib diisi'),
});

type TopikFormValues = z.infer<typeof topikSchema>;

interface KelasForumTabProps {
  kelasId: number;
  isMahasiswa: boolean;
  canManage: boolean;
}

export default function KelasForumTab({ kelasId, isMahasiswa, canManage }: KelasForumTabProps) {
  const [topikList, setTopikList] = useState<LmsForumTopik[]>([]);
  const [activeTopik, setActiveTopik] = useState<LmsForumTopik | null>(null);
  const [posts, setPosts] = useState<LmsForumPost[]>([]);
  const [loadingTopik, setLoadingTopik] = useState(true);
  const [loadingPost, setLoadingPost] = useState(false);
  const [showTopikModal, setShowTopikModal] = useState(false);
  const [pesan, setPesan] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; kind: 'topik' | 'post'; id: number | null }>({
    isOpen: false,
    kind: 'post',
    id: null,
  });

  const topikForm = useForm<TopikFormValues>({
    resolver: zodResolver(topikSchema) as any,
    defaultValues: { judul: '' },
  });

  const fetchTopik = useCallback(async () => {
    setLoadingTopik(true);
    try {
      const res = await lmsService.listForumTopik(kelasId);
      if (res.status === 'success') {
        const rawData = res.data as any;
        const topik: LmsForumTopik[] = Array.isArray(rawData) ? rawData : (rawData?.topik || []);
        setTopikList(topik);
        if (!activeTopik && topik.length > 0) {
          setActiveTopik(topik[0]);
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat forum');
    } finally {
      setLoadingTopik(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kelasId]);

  const fetchPost = useCallback(async (topikId: number) => {
    setLoadingPost(true);
    try {
      const res = await lmsService.listForumPost(topikId, { per_page: 50 });
      if (res.status === 'success') setPosts(res.data || []);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat pesan');
    } finally {
      setLoadingPost(false);
    }
  }, []);

  useEffect(() => {
    fetchTopik();
  }, [fetchTopik]);

  useEffect(() => {
    if (activeTopik) fetchPost(activeTopik.id);
  }, [activeTopik, fetchPost]);

  const onCreateTopik = async (values: TopikFormValues) => {
    try {
      await lmsService.createForumTopik(kelasId, { judul: values.judul });
      toast.success('Topik berhasil dibuat');
      topikForm.reset();
      setShowTopikModal(false);
      fetchTopik();
    } catch (err: any) {
      toast.error(err.message || 'Gagal membuat topik');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.id) return;
    try {
      if (deleteConfirm.kind === 'topik') {
        await lmsService.deleteForumTopik(deleteConfirm.id);
        toast.success('Topik dihapus');
        setActiveTopik(null);
        fetchTopik();
      } else {
        await lmsService.deleteForumPost(deleteConfirm.id);
        toast.success('Pesan dihapus');
        if (activeTopik) fetchPost(activeTopik.id);
      }
      setDeleteConfirm({ isOpen: false, kind: 'post', id: null });
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus');
    }
  };

  const handleSend = async () => {
    if (!activeTopik || !pesan.trim()) return;
    setSending(true);
    try {
      await lmsService.createForumPost(activeTopik.id, { isi: pesan.trim(), parent_id: replyTo });
      setPesan('');
      setReplyTo(null);
      fetchPost(activeTopik.id);
      fetchTopik();
    } catch (err: any) {
      toast.error(err.response?.data?.errors?.parent_id?.[0] || err.message || 'Gagal mengirim pesan');
    } finally {
      setSending(false);
    }
  };

  if (loadingTopik) return <p className="text-xs text-slate-500">Memuat forum...</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700">Topik Diskusi</h5>
          {canManage && (
            <Button size="sm" variant="outline" icon={<Plus size={16} />} onClick={() => setShowTopikModal(true)}>
              Topik
            </Button>
          )}
        </div>
        {topikList.length === 0 && <EmptyState title="Belum ada topik" description="Topik diskusi akan muncul di sini." />}
        {topikList.map((t) => (
          <div
            key={t.id}
            onClick={() => setActiveTopik(t)}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${activeTopik?.id === t.id ? 'border-[var(--module-primary)] bg-[var(--module-primary-subtle,#f8fafc)]' : 'border-slate-200 bg-white hover:border-slate-300'}`}
          >
            <div className="flex items-center gap-2">
              {t.is_pinned && <Pin size={14} className="text-amber-500" />}
              <span className="text-xs font-bold flex-1">{t.judul}</span>
              {canManage && (
                <DropdownMenu
                  items={[{ label: 'Hapus Topik', icon: <Trash2 size={16} />, onClick: () => setDeleteConfirm({ isOpen: true, kind: 'topik', id: t.id }) }]}
                />
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="gray"><MessageSquare size={12} /> {t.total_post}</Badge>
              {t.post_terakhir && <span className="text-2xs text-slate-400 truncate">{t.post_terakhir.nama_penulis}: {t.post_terakhir.isi}</span>}
            </div>
          </div>
        ))}
      </div>

      <Card className="md:col-span-2 p-4 space-y-3">
        {!activeTopik ? (
          <EmptyState title="Pilih topik" description="Pilih topik di sebelah kiri untuk membaca dan membalas diskusi." />
        ) : (
          <>
            <h5 className="text-xs font-bold">{activeTopik.judul}</h5>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {loadingPost && <p className="text-2xs text-slate-400">Memuat pesan...</p>}
              {posts.map((p) => (
                <div key={p.id} className="space-y-2">
                  <div className="rounded-xl border border-slate-200 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-2xs font-bold text-[var(--module-primary)]">{p.nama_penulis}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-2xs text-slate-400">{new Date(p.created_at).toLocaleString('id-ID')}</span>
                        <DropdownMenu
                          items={[
                            { label: 'Balas', icon: <Send size={16} />, onClick: () => setReplyTo(p.id) },
                            { label: 'Hapus', icon: <Trash2 size={16} />, onClick: () => setDeleteConfirm({ isOpen: true, kind: 'post', id: p.id }) },
                          ]}
                        />
                      </div>
                    </div>
                    <p className="text-xs whitespace-pre-wrap mt-1">{p.isi}</p>
                  </div>
                  {p.balasan?.map((b) => (
                    <div key={b.id} className="ml-6 rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-2xs font-bold">{b.nama_penulis}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-2xs text-slate-400">{new Date(b.created_at).toLocaleString('id-ID')}</span>
                          <DropdownMenu
                            items={[{ label: 'Hapus', icon: <Trash2 size={16} />, onClick: () => setDeleteConfirm({ isOpen: true, kind: 'post', id: b.id }) }]}
                          />
                        </div>
                      </div>
                      <p className="text-xs whitespace-pre-wrap mt-1">{b.isi}</p>
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
          </>
        )}
      </Card>

      <Modal
        open={showTopikModal}
        onClose={() => setShowTopikModal(false)}
        title="Buat Topik Diskusi"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" icon={<X size={16} />} onClick={() => setShowTopikModal(false)}>Batal</Button>
            <Button type="submit" form="form-forum-topik" loading={topikForm.formState.isSubmitting} disabled={topikForm.formState.isSubmitting} icon={<Send size={16} />}>
              Buat Topik
            </Button>
          </div>
        }
      >
        <form id="form-forum-topik" onSubmit={topikForm.handleSubmit(onCreateTopik)} className="space-y-4">
          <Input label="Judul Topik" placeholder="cth: Tanya Jawab UAS" error={topikForm.formState.errors.judul?.message} {...topikForm.register('judul')} />
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, kind: 'post', id: null })}
        onConfirm={handleDelete}
        title={deleteConfirm.kind === 'topik' ? 'Hapus Topik' : 'Hapus Pesan'}
        message={<span>Yakin hapus {deleteConfirm.kind === 'topik' ? 'topik beserta seluruh pesannya' : 'pesan ini'}?</span>}
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
