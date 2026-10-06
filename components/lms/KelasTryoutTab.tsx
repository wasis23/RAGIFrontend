'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { EmptyState } from '@/components/ui/EmptyState';
import QuizManagePanel from '@/components/lms/QuizManagePanel';
import { lmsService } from '@/services/lms.service';
import { siakadService } from '@/services/siakad.service';
import type { LmsQuizItem } from '@/types/lms.types';
import { PUBLISH_STATUS_OPTIONS } from '@/types/lms.types';
import { Plus, X, Save, Trash2, Play, ListChecks, UserPlus, Lock } from 'lucide-react';

const tryoutSchema = z.object({
  judul: z.string().min(1, 'Judul tryout wajib diisi'),
  durasi_menit: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? undefined : Number(v)),
    z.number().min(1).max(1440).optional()
  ),
  max_attempt: z.coerce.number().min(1).max(10).default(1),
  kode_akses: z.string().max(20).optional().default(''),
  is_published: z.coerce.boolean().default(false),
});

type TryoutFormValues = z.infer<typeof tryoutSchema>;

interface KelasTryoutTabProps {
  kelasId: number;
  isMahasiswa: boolean;
}

export default function KelasTryoutTab({ kelasId, isMahasiswa }: KelasTryoutTabProps) {
  const [list, setList] = useState<LmsQuizItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [manageQuizId, setManageQuizId] = useState<number | null>(null);
  const [pesertaQuizId, setPesertaQuizId] = useState<number | null>(null);
  const [pesertaList, setPesertaList] = useState<any[]>([]);
  const [selectedMhs, setSelectedMhs] = useState<string>('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: number | null; name: string }>({
    isOpen: false,
    id: null,
    name: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<TryoutFormValues>({
    resolver: zodResolver(tryoutSchema) as any,
    defaultValues: { judul: '', max_attempt: 1, kode_akses: '', is_published: false },
  });

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await lmsService.listTryout(kelasId);
      if (res.status === 'success') setList(res.data || []);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat tryout');
    } finally {
      setLoading(false);
    }
  }, [kelasId]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const onSubmit = async (values: TryoutFormValues) => {
    try {
      await lmsService.createTryout(kelasId, {
        judul: values.judul,
        durasi_menit: values.durasi_menit as any,
        max_attempt: values.max_attempt,
        kode_akses: values.kode_akses || null,
        is_published: Boolean(values.is_published),
      } as any);
      toast.success('Tryout berhasil dibuat');
      setShowModal(false);
      fetchList();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal membuat tryout');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.id) return;
    setIsDeleting(true);
    try {
      await lmsService.deleteQuiz(deleteConfirm.id);
      toast.success('Tryout berhasil dihapus');
      setDeleteConfirm({ isOpen: false, id: null, name: '' });
      if (manageQuizId === deleteConfirm.id) setManageQuizId(null);
      fetchList();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus tryout');
    } finally {
      setIsDeleting(false);
    }
  };

  const loadPeserta = async (quizId: number) => {
    setPesertaQuizId(quizId);
    try {
      const res = await lmsService.getQuizManage(quizId);
      setPesertaList(res.data?.quiz?.tryout_peserta || []);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat peserta');
    }
  };

  const handleAddPeserta = async () => {
    if (!pesertaQuizId || !selectedMhs) return;
    try {
      await lmsService.addTryoutPeserta(pesertaQuizId, Number(selectedMhs));
      toast.success('Peserta berhasil ditambahkan');
      setSelectedMhs('');
      loadPeserta(pesertaQuizId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menambah peserta');
    }
  };

  const handleRemovePeserta = async (id: number) => {
    if (!pesertaQuizId) return;
    try {
      await lmsService.removeTryoutPeserta(id);
      toast.success('Peserta dihapus');
      loadPeserta(pesertaQuizId);
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus peserta');
    }
  };

  if (loading) return <p className="text-xs text-slate-500">Memuat tryout...</p>;

  if (isMahasiswa) {
    if (list.length === 0) {
      return <EmptyState title="Belum ada tryout" description="Belum ada paket latihan untuk kelas ini." />;
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {list.map((t) => (
          <Card key={t.id} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <h5 className="text-xs font-bold">{t.judul}</h5>
              <div className="flex gap-1">
                {(t as any).kode_akses ? <Badge variant="yellow"><Lock size={12} /> Berkode</Badge> : null}
                {t.durasi_menit ? <Badge>{t.durasi_menit} mnt</Badge> : <Badge variant="gray">Tanpa batas</Badge>}
              </div>
            </div>
            {t.deskripsi && <p className="text-2xs text-slate-500">{t.deskripsi}</p>}
            <Link href={`/lms/${kelasId}/quiz/${t.id}`}>
              <Button size="sm" icon={<Play size={16} />}>Mulai Tryout</Button>
            </Link>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          icon={<Plus size={16} />}
          onClick={() => {
            form.reset({ judul: '', max_attempt: 1, kode_akses: '', is_published: false });
            setShowModal(true);
          }}
        >
          Buat Tryout
        </Button>
      </div>

      {list.length === 0 ? (
        <EmptyState title="Belum ada tryout" description="Buat paket latihan lintas pertemuan untuk kelas ini." />
      ) : (
        <DataTable
          columns={[
            { key: 'judul', label: 'Judul', render: (t: LmsQuizItem) => <span className="text-xs font-semibold">{t.judul}</span> },
            { key: 'akses', label: 'Akses', render: (t: LmsQuizItem) =>
                (t as any).kode_akses ? <Badge variant="yellow"><Lock size={12} /> Berkode</Badge> : <Badge variant="gray">Terbuka</Badge>,
            },
            { key: 'status', label: 'Status', render: (t: LmsQuizItem) =>
                t.is_archived ? <Badge variant="gray">Arsip</Badge> : t.is_published ? <Badge variant="green">Published</Badge> : <Badge variant="yellow">Draft</Badge>,
            },
            { key: 'aksi', label: 'Aksi', render: (t: LmsQuizItem) => (
                <DropdownMenu
                  items={[
                    { label: manageQuizId === t.id ? 'Tutup Kelola' : 'Kelola Soal & Nilai', icon: <ListChecks size={16} />, onClick: () => setManageQuizId(manageQuizId === t.id ? null : t.id) },
                    { label: 'Kelola Peserta', icon: <UserPlus size={16} />, onClick: () => loadPeserta(t.id) },
                    { label: t.is_archived ? 'Buka Arsip' : 'Arsipkan', icon: <Save size={16} />, onClick: async () => {
                      await lmsService.updateQuiz(t.id, { is_archived: !t.is_archived } as any);
                      toast.success(t.is_archived ? 'Tryout dibuka kembali' : 'Tryout diarsipkan');
                      fetchList();
                    } },
                    { label: t.is_published ? 'Unpublish' : 'Publish', icon: <Save size={16} />, onClick: async () => {
                      await lmsService.updateQuiz(t.id, { is_published: !t.is_published } as any);
                      toast.success('Status publikasi diperbarui');
                      fetchList();
                    } },
                    { label: 'Hapus', icon: <Trash2 size={16} />, onClick: () => setDeleteConfirm({ isOpen: true, id: t.id, name: t.judul }) },
                  ]}
                />
              ),
            },
          ] as ColumnDef<LmsQuizItem>[]}
          data={list}
          meta={{ current_page: 1, last_page: 1, per_page: list.length || 10, total: list.length }}
          onPageChange={() => {}}
        />
      )}

      {manageQuizId && <QuizManagePanel quizId={manageQuizId} onChanged={fetchList} />}

      {pesertaQuizId && (
        <Card className="p-4 space-y-3">
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700">Peserta Eksplisit (di luar KRS)</h5>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <AsyncSelect
                label="Tambah Mahasiswa"
                placeholder="Cari NIM / nama..."
                value={selectedMhs}
                onChange={(val) => setSelectedMhs(val ? String(val) : '')}
                loadOptions={async (input) => {
                  try {
                    const res: any = await siakadService.getMahasiswas({ search: input, per_page: 20 });
                    const items = Array.isArray(res.data) ? res.data : res.data?.data || [];
                    return items.map((m: any) => ({ value: String(m.id), label: `${m.nim} — ${m.nama_lengkap}` }));
                  } catch {
                    return [];
                  }
                }}
                isClearable
              />
            </div>
            <Button size="sm" icon={<UserPlus size={16} />} onClick={handleAddPeserta} disabled={!selectedMhs}>
              Tambah
            </Button>
          </div>
          {pesertaList.map((p: any) => (
            <div key={p.id} className="flex items-center justify-between text-xs border rounded-lg p-2">
              <span>{p.mahasiswa?.nim} — {p.mahasiswa?.nama_lengkap}</span>
              <Button size="sm" variant="outline-danger" icon={<Trash2 size={16} />} onClick={() => handleRemovePeserta(p.id)}>
                Hapus
              </Button>
            </div>
          ))}
        </Card>
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Buat Tryout Baru"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" icon={<X size={16} />} onClick={() => setShowModal(false)}>Batal</Button>
            <Button type="submit" form="form-tryout" loading={form.formState.isSubmitting} disabled={form.formState.isSubmitting} icon={<Save size={16} />}>
              Simpan Tryout
            </Button>
          </div>
        }
      >
        <form id="form-tryout" onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input label="Judul Tryout" placeholder="cth: Tryout UTS MK ..." error={form.formState.errors.judul?.message} {...form.register('judul')} />
          </div>
          <Input type="number" label="Durasi (menit, opsional)" {...form.register('durasi_menit')} />
          <Input type="number" label="Maks Attempt" {...form.register('max_attempt')} />
          <Input label="Kode Akses (opsional)" placeholder="cth: TO123" {...form.register('kode_akses')} />
          <Controller
            name="is_published"
            control={form.control}
            render={({ field }) => (
              <Select
                label="Publikasikan?"
                value={field.value ? '1' : '0'}
                onChange={(val) => field.onChange(val === '1')}
                options={PUBLISH_STATUS_OPTIONS}
              />
            )}
          />
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null, name: '' })}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Hapus Tryout"
        message={<span>Yakin hapus <strong>{deleteConfirm.name}</strong>? Seluruh attempt ikut terhapus.</span>}
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
