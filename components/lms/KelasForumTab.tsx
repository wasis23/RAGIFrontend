'use client';

import { useCallback, useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { EmptyState } from '@/components/ui/EmptyState';
import ForumChat from '@/components/lms/ForumChat';
import { lmsService } from '@/services/lms.service';
import { useAuth } from '@/hooks/useAuth';
import type { LmsForumTopik, LmsForumPost, LmsPertemuanItem } from '@/types/lms.types';
import { Plus, X, Send, Trash2, Pin, MessageSquare } from 'lucide-react';

const topikSchema = z.object({
  judul: z.string().min(1, 'Judul topik wajib diisi'),
  pertemuan_id: z.string().optional().default(''),
});

type TopikFormValues = z.infer<typeof topikSchema>;

const filterSchema = z.object({
  filter: z.string().optional().default(''),
});

type FilterFormValues = z.infer<typeof filterSchema>;

interface KelasForumTabProps {
  kelasId: number;
  isMahasiswa: boolean;
  canManage: boolean;
  pertemuanList?: LmsPertemuanItem[];
}

export default function KelasForumTab({ kelasId, isMahasiswa, canManage, pertemuanList = [] }: KelasForumTabProps) {
  void isMahasiswa;
  const { user } = useAuth();
  const currentName =
    (user as any)?.nama_lengkap || (user as any)?.name || (user as any)?.username || '';
  const [topikList, setTopikList] = useState<LmsForumTopik[]>([]);
  const [activeTopik, setActiveTopik] = useState<LmsForumTopik | null>(null);
  const [posts, setPosts] = useState<LmsForumPost[]>([]);
  const [loadingTopik, setLoadingTopik] = useState(true);
  const [loadingPost, setLoadingPost] = useState(false);
  const [showTopikModal, setShowTopikModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; kind: 'topik' | 'post'; id: number | null }>({
    isOpen: false,
    kind: 'post',
    id: null,
  });

  const topikForm = useForm<TopikFormValues>({
    resolver: zodResolver(topikSchema) as any,
    defaultValues: { judul: '', pertemuan_id: '' },
  });

  const filterForm = useForm<FilterFormValues>({
    resolver: zodResolver(filterSchema) as any,
    defaultValues: { filter: '' },
  });
  const filterValue = filterForm.watch('filter') ?? '';

  const pertemuanOptions =
    pertemuanList.length > 0
      ? pertemuanList.map((p) => ({
          value: String(p.id),
          label: `P${p.pertemuan_ke} — ${p.materi || p.tanggal}`,
        }))
      : Array.from({ length: 16 }, (_, i) => ({
          value: `ke-${i + 1}`,
          label: `Pertemuan ${i + 1}`,
        }));

  const filterOptions = [
    { value: '', label: 'Semua' },
    { value: 'umum', label: 'Umum' },
    ...pertemuanOptions,
  ];

  const pertemuanKeOf = (t: LmsForumTopik): number | null => {
    if (t.pertemuan_id === null || t.pertemuan_id === undefined) return null;
    const found = pertemuanList.find((p) => p.id === t.pertemuan_id);
    return found ? found.pertemuan_ke : null;
  };

  const filteredTopik = topikList.filter((t) => {
    if (!filterValue) return true;
    if (filterValue === 'umum') return t.pertemuan_id === null || t.pertemuan_id === undefined;
    return String(t.pertemuan_id) === String(filterValue);
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
        } else if (activeTopik) {
          const updated = topik.find((t) => t.id === activeTopik.id);
          if (updated) setActiveTopik(updated);
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
      let pertemuanId: number | null = null;
      if (values.pertemuan_id) {
        if (values.pertemuan_id.startsWith('ke-')) {
          const ke = Number(values.pertemuan_id.replace('ke-', ''));
          const found = pertemuanList.find((p) => p.pertemuan_ke === ke);
          pertemuanId = found ? found.id : null;
        } else {
          pertemuanId = Number(values.pertemuan_id);
        }
      }
      await lmsService.createForumTopik(kelasId, { judul: values.judul, pertemuan_id: pertemuanId });
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

  const handleSend = async (isi: string, parentId: number | null) => {
    if (!activeTopik || !isi.trim()) return;
    setSending(true);
    try {
      await lmsService.createForumPost(activeTopik.id, { isi: isi.trim(), parent_id: parentId });
      await fetchPost(activeTopik.id);
      fetchTopik();
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
      if (activeTopik) fetchPost(activeTopik.id);
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus');
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
        <Controller
          name="filter"
          control={filterForm.control}
          render={({ field }) => (
            <Select
              placeholder="Semua / Umum / per pertemuan..."
              options={filterOptions}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        {filteredTopik.length === 0 && <EmptyState title="Belum ada topik" description="Topik diskusi akan muncul di sini." />}
        {filteredTopik.map((t) => {
          const ke = pertemuanKeOf(t);
          return (
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
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant={t.pertemuan_id ? 'indigo' : 'gray'}>
                  {t.pertemuan_id ? (ke !== null ? `P-${ke}` : `P-${t.pertemuan_id}`) : 'Umum'}
                </Badge>
                <Badge variant="gray"><MessageSquare size={12} /> {t.total_post ?? t.posts_count ?? 0}</Badge>
                {t.post_terakhir && <span className="text-2xs text-slate-400 truncate">{t.post_terakhir.nama_penulis}: {t.post_terakhir.isi}</span>}
              </div>
            </div>
          );
        })}
      </div>

      <Card className="md:col-span-2 p-4 space-y-3">
        {!activeTopik ? (
          <EmptyState title="Pilih topik" description="Pilih topik di sebelah kiri untuk membaca dan membalas diskusi." />
        ) : (
          <ForumChat
            topik={activeTopik}
            posts={posts}
            loadingPost={loadingPost}
            onSend={handleSend}
            onDeletePost={handleDeletePost}
            sending={sending}
            currentName={currentName}
            pollIntervalMs={15000}
            onRefresh={() => activeTopik && fetchPost(activeTopik.id)}
          />
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
        <form id="form-forum-topik" onSubmit={topikForm.handleSubmit(onCreateTopik)} className="grid grid-cols-1 gap-4">
          <Input label="Judul Topik" placeholder="cth: Tanya Jawab UAS" error={topikForm.formState.errors.judul?.message} {...topikForm.register('judul')} />
          <Controller
            name="pertemuan_id"
            control={topikForm.control}
            render={({ field }) => (
              <Select
                label="Mulai dari Pertemuan"
                placeholder="Pilih pertemuan (opsional)..."
                options={[{ value: '', label: 'Tanpa pertemuan khusus' }, ...pertemuanOptions]}
                value={field.value}
                onChange={field.onChange}
                error={topikForm.formState.errors.pertemuan_id?.message}
              />
            )}
          />
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
