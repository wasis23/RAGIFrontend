'use client';

import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { EmptyState } from '@/components/ui/EmptyState';
import ForumChat from '@/components/lms/ForumChat';
import { lmsService } from '@/services/lms.service';
import { useAuth } from '@/hooks/useAuth';
import type { LmsForumTopik, LmsForumPost } from '@/types/lms.types';
import { Plus, X, Send, Trash2 } from 'lucide-react';

const topikSchema = z.object({
  judul: z.string().min(1, 'Judul diskusi wajib diisi'),
});

type TopikFormValues = z.infer<typeof topikSchema>;

interface PertemuanDiskusiProps {
  kelasId: number;
  pertemuanId: number;
  pertemuanKe?: number | null;
  canManage: boolean;
}

export default function PertemuanDiskusi({ kelasId, pertemuanId, pertemuanKe, canManage }: PertemuanDiskusiProps) {
  const { user } = useAuth();
  const currentName =
    (user as any)?.nama_lengkap || (user as any)?.name || (user as any)?.username || '';
  const [topik, setTopik] = useState<LmsForumTopik | null>(null);
  const [posts, setPosts] = useState<LmsForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPost, setLoadingPost] = useState(false);
  const [showTopikModal, setShowTopikModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [deleteTopikConfirm, setDeleteTopikConfirm] = useState(false);

  const topikForm = useForm<TopikFormValues>({
    resolver: zodResolver(topikSchema) as any,
    defaultValues: { judul: '' },
  });

  const defaultJudul = `Diskusi Pertemuan ${pertemuanKe ?? ''}`.trim();

  const fetchTopik = useCallback(async () => {
    setLoading(true);
    try {
      const res = await lmsService.listForumTopik(kelasId, { pertemuan_id: pertemuanId, per_page: 50 });
      if (res.status === 'success') {
        const rawData = res.data as any;
        const list: LmsForumTopik[] = Array.isArray(rawData) ? rawData : (rawData?.topik || []);
        const scoped = list.filter((t) => t.pertemuan_id === pertemuanId);
        setTopik(scoped.length > 0 ? scoped[0] : null);
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat diskusi pertemuan');
    } finally {
      setLoading(false);
    }
  }, [kelasId, pertemuanId]);

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
    if (topik) fetchPost(topik.id);
    else setPosts([]);
  }, [topik, fetchPost]);

  const onCreateTopik = async (values: TopikFormValues) => {
    try {
      await lmsService.createForumTopik(kelasId, { judul: values.judul, pertemuan_id: pertemuanId });
      toast.success('Diskusi pertemuan berhasil dibuat');
      topikForm.reset();
      setShowTopikModal(false);
      fetchTopik();
    } catch (err: any) {
      toast.error(err.message || 'Gagal membuat diskusi pertemuan');
    }
  };

  const handleDeleteTopik = async () => {
    if (!topik) return;
    try {
      await lmsService.deleteForumTopik(topik.id);
      toast.success('Diskusi pertemuan dihapus');
      setTopik(null);
      setDeleteTopikConfirm(false);
      fetchTopik();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus');
    }
  };

  const handleSend = async (isi: string, parentId: number | null) => {
    if (!topik || !isi.trim()) return;
    setSending(true);
    try {
      await lmsService.createForumPost(topik.id, { isi: isi.trim(), parent_id: parentId });
      await fetchPost(topik.id);
    } catch (err: any) {
      toast.error(err.response?.data?.errors?.parent_id?.[0] || err.message || 'Gagal mengirim pesan');
    } finally {
      setSending(false);
    }
  };

  const handleDeletePost = async (postId: number) => {
    try {
      await lmsService.deleteForumPost(postId);
      toast.success('Pesan dihapus');
      if (topik) fetchPost(topik.id);
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus');
    }
  };

  if (loading) return <p className="text-xs text-slate-500">Memuat diskusi pertemuan...</p>;

  if (!topik) {
    return (
      <div className="space-y-4">
        <EmptyState
          title="Belum ada diskusi pertemuan ini"
          description={canManage ? 'Buat ruang diskusi khusus sesi pertemuan ini agar mahasiswa bisa bertanya dan berdiskusi.' : 'Ruang diskusi untuk sesi pertemuan ini belum dibuat oleh dosen.'}
        />
        {canManage && (
          <div className="flex justify-center">
            <Button
              size="sm"
              icon={<Plus size={16} />}
              onClick={() => {
                topikForm.setValue('judul', defaultJudul);
                setShowTopikModal(true);
              }}
            >
              Buat Diskusi Pertemuan {pertemuanKe ?? ''}
            </Button>
          </div>
        )}
        <Modal
          open={showTopikModal}
          onClose={() => setShowTopikModal(false)}
          title={`Buat Diskusi Pertemuan ${pertemuanKe ?? ''}`}
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="outline" icon={<X size={16} />} onClick={() => setShowTopikModal(false)}>Batal</Button>
              <Button type="submit" form="form-diskusi-pertemuan" loading={topikForm.formState.isSubmitting} disabled={topikForm.formState.isSubmitting} icon={<Send size={16} />}>
                Buat Diskusi
              </Button>
            </div>
          }
        >
          <form id="form-diskusi-pertemuan" onSubmit={topikForm.handleSubmit(onCreateTopik)} className="grid grid-cols-1 gap-4">
            <Input label="Judul Diskusi" placeholder={defaultJudul} error={topikForm.formState.errors.judul?.message} {...topikForm.register('judul')} />
          </form>
        </Modal>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <ForumChat
          topik={topik}
          posts={posts}
          loadingPost={loadingPost}
          onSend={handleSend}
          onDeletePost={handleDeletePost}
          sending={sending}
          currentName={currentName}
          pollIntervalMs={15000}
          onRefresh={() => topik && fetchPost(topik.id)}
          headerExtra={
            canManage ? (
              <DropdownMenu
                items={[{ label: 'Hapus Diskusi', icon: <Trash2 size={16} />, onClick: () => setDeleteTopikConfirm(true) }]}
              />
            ) : undefined
          }
        />
      </Card>

      <Modal
        open={showTopikModal}
        onClose={() => setShowTopikModal(false)}
        title={`Buat Diskusi Pertemuan ${pertemuanKe ?? ''}`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" icon={<X size={16} />} onClick={() => setShowTopikModal(false)}>Batal</Button>
            <Button type="submit" form="form-diskusi-pertemuan" loading={topikForm.formState.isSubmitting} disabled={topikForm.formState.isSubmitting} icon={<Send size={16} />}>
              Buat Diskusi
            </Button>
          </div>
        }
      >
        <form id="form-diskusi-pertemuan" onSubmit={topikForm.handleSubmit(onCreateTopik)} className="grid grid-cols-1 gap-4">
          <Input label="Judul Diskusi" placeholder={defaultJudul} error={topikForm.formState.errors.judul?.message} {...topikForm.register('judul')} />
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteTopikConfirm}
        onClose={() => setDeleteTopikConfirm(false)}
        onConfirm={handleDeleteTopik}
        title="Hapus Diskusi"
        message={<span>Yakin hapus diskusi pertemuan beserta seluruh pesannya?</span>}
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
