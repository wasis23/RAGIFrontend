'use client';

import { useCallback, useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { lmsService } from '@/services/lms.service';
import { siakadService } from '@/services/siakad.service';
import {
  LmsQuizKolaborator,
  TRYOUT_PERAN_OPTIONS,
  TRYOUT_PERAN_VALUES,
  TRYOUT_PERAN_LABEL,
  TryoutPeran,
} from '@/types/lms.types';
import { Plus, Trash2, Users, UserPlus } from 'lucide-react';
import { extractOptionValue } from './tryoutHelpers';

const kolaboratorSchema = z.object({
  dosen_id: z.string().min(1, 'Dosen wajib dipilih.'),
  peran: z.enum(TRYOUT_PERAN_VALUES, { message: 'Peran wajib dipilih.' }),
});

type KolaboratorFormValues = z.infer<typeof kolaboratorSchema>;

export default function TryoutKolaboratorCard({ quizId }: { quizId: number }) {
  const [list, setList] = useState<LmsQuizKolaborator[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<{ isOpen: boolean; id: number | null }>({ isOpen: false, id: null });

  const form = useForm<KolaboratorFormValues>({
    resolver: zodResolver(kolaboratorSchema) as any,
    defaultValues: { dosen_id: '', peran: 'pengawas' as TryoutPeran },
  });

  const loadDosenOptions = useCallback(async (inputValue: string) => {
    try {
      const res: any = await siakadService.getDosens({ search: inputValue || undefined, per_page: 20 });
      const items = Array.isArray(res.data) ? res.data : res.data?.data || [];
      return items.map((d: any) => ({
        value: String(d.id),
        label: `${d.nidn || d.nip || ''} — ${d.nama_lengkap || d.nama}`.trim(),
      }));
    } catch {
      return [];
    }
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await lmsService.listKolaborator(quizId);
      if (res.status === 'success') setList(res.data || []);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat tim dosen');
    } finally {
      setLoading(false);
    }
  }, [quizId]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const onAdd = async (values: KolaboratorFormValues) => {
    try {
      await lmsService.addKolaborator(quizId, { dosen_id: Number(values.dosen_id), peran: values.peran });
      toast.success('Kolaborator ditambahkan');
      form.reset({ dosen_id: '', peran: 'pengawas' });
      fetchList();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menambah kolaborator');
    }
  };

  const onRemove = async () => {
    if (!deleting.id) return;
    try {
      await lmsService.removeKolaborator(deleting.id);
      toast.success('Kolaborator dihapus');
      setDeleting({ isOpen: false, id: null });
      fetchList();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus kolaborator');
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Users size={16} style={{ color: 'var(--module-primary)' }} />
        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700">Kelola Tim Dosen</h5>
      </div>

      <form onSubmit={form.handleSubmit(onAdd)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Controller
          name="dosen_id"
          control={form.control}
          render={({ field }) => (
            <AsyncSelect
              label="Dosen"
              placeholder="Cari NIDN / nama dosen..."
              value={field.value}
              onChange={(val) => field.onChange(extractOptionValue(val))}
              loadOptions={loadDosenOptions}
              isClearable
              error={form.formState.errors.dosen_id?.message}
            />
          )}
        />
        <Controller
          name="peran"
          control={form.control}
          render={({ field }) => (
            <Select
              label="Peran"
              value={field.value}
              onChange={field.onChange}
              options={TRYOUT_PERAN_OPTIONS}
              error={form.formState.errors.peran?.message}
            />
          )}
        />
        <div className="md:col-span-2 flex justify-end">
          <Button
            size="sm"
            type="submit"
            icon={<Plus size={16} />}
            loading={form.formState.isSubmitting}
            disabled={form.formState.isSubmitting}
          >
            Tambah
          </Button>
        </div>
      </form>

      <hr className="border-t border-slate-100" />

      {loading ? (
        <p className="text-2xs text-slate-400">Memuat tim...</p>
      ) : list.length === 0 ? (
        <p className="text-2xs text-slate-400">Belum ada kolaborator untuk tryout ini.</p>
      ) : (
        <div className="space-y-2">
          {list.map((k) => (
            <div key={k.id} className="flex items-center justify-between gap-2 text-xs border border-slate-200 rounded-xl p-2">
              <div className="min-w-0">
                <span className="font-semibold text-slate-800 block truncate">
                  {k.dosen?.nama_lengkap || `Dosen #${k.dosen_id}`}
                </span>
                <span className="text-2xs text-slate-500">{k.dosen?.nidn || ''}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="gray">{TRYOUT_PERAN_LABEL[k.peran] || k.peran}</Badge>
                <Button
                  size="sm"
                  variant="outline-danger"
                  icon={<Trash2 size={16} />}
                  onClick={() => setDeleting({ isOpen: true, id: k.id })}
                >
                  Hapus
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={deleting.isOpen}
        onClose={() => setDeleting({ isOpen: false, id: null })}
        onConfirm={onRemove}
        title="Hapus Kolaborator"
        message={<span>Yakin hapus kolaborator ini dari tim tryout?</span>}
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </Card>
  );
}

export function TambahPesertaForm({ quizId, onAdded }: { quizId: number; onAdded: () => void }) {
  const schema = z.object({
    mahasiswa_id: z.string().min(1, 'Mahasiswa wajib dipilih.'),
  });
  type Values = z.infer<typeof schema>;
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { mahasiswa_id: '' },
  });

  const onSubmit = async (values: Values) => {
    try {
      await lmsService.addTryoutPeserta(quizId, Number(values.mahasiswa_id));
      toast.success('Peserta berhasil ditambahkan');
      form.reset({ mahasiswa_id: '' });
      onAdded();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menambah peserta');
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2 items-end">
      <div className="flex-1">
        <Controller
          name="mahasiswa_id"
          control={form.control}
          render={({ field }) => (
            <AsyncSelect
              label="Tambah Mahasiswa (di luar KRS)"
              placeholder="Cari NIM / nama..."
              value={field.value}
              onChange={(val) => field.onChange(extractOptionValue(val))}
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
              error={form.formState.errors.mahasiswa_id?.message}
            />
          )}
        />
      </div>
      <Button
        size="sm"
        type="submit"
        icon={<UserPlus size={16} />}
        loading={form.formState.isSubmitting}
        disabled={form.formState.isSubmitting}
      >
        Tambah
      </Button>
    </form>
  );
}
