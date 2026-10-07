'use client';

import { useCallback, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { lmsService } from '@/services/lms.service';
import { siakadService } from '@/services/siakad.service';
import { KELAS_PATTERN } from '@/lib/kelas';
import type { LmsTryoutPeserta } from '@/types/lms.types';
import { Copy, Check, Trash2, KeyRound, Users } from 'lucide-react';
import TryoutKolaboratorCard, { TambahPesertaForm } from './TryoutKolaboratorCard';
import { extractOptionValue } from './tryoutHelpers';

const pesertaKelasSchema = z.object({
  kelas: z
    .string()
    .min(1, 'Kelas wajib diisi.')
    .regex(KELAS_PATTERN, 'Format kelas tidak valid. Gunakan 2 digit angkatan + huruf, cth: 25A'),
  program_studi_id: z.string().optional(),
});

type PesertaKelasFormValues = z.infer<typeof pesertaKelasSchema>;

function TambahPesertaKelasForm({ quizId, onAdded }: { quizId: number; onAdded: () => void }) {
  const form = useForm<PesertaKelasFormValues>({
    resolver: zodResolver(pesertaKelasSchema),
    defaultValues: { kelas: '', program_studi_id: '' },
  });

  const loadProdiOptions = useCallback(async (inputValue: string) => {
    try {
      const res: any = await siakadService.getProdi({ search: inputValue || undefined, per_page: 20 });
      const items = Array.isArray(res.data) ? res.data : res.data?.data || [];
      return items.map((p: any) => ({
        value: String(p.id),
        label: `${p.nama || p.nama_prodi || `Prodi #${p.id}`}${p.jenjang ? ` (${p.jenjang})` : ''}`,
      }));
    } catch {
      return [];
    }
  }, []);

  const onSubmit = async (values: PesertaKelasFormValues) => {
    try {
      const kelas = values.kelas.trim().toUpperCase();
      const payload: { kelas: string; program_studi_id?: number } = { kelas };
      const prodiVal = (values.program_studi_id || '').trim();
      if (prodiVal) payload.program_studi_id = Number(prodiVal);
      const res: any = await lmsService.addTryoutPesertaByKelas(quizId, payload);
      const added = Number(res?.data?.added ?? res?.data?.added_count ?? res?.data?.created_count ?? 0);
      const skipped = Number(res?.data?.skipped_count ?? res?.data?.skipped ?? 0);
      toast.success(`${added} peserta ditambahkan (${skipped} dilewati/sudah terdaftar)`);
      form.reset({ kelas: '', program_studi_id: '' });
      onAdded();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal menambah peserta per kelas');
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Controller
        name="kelas"
        control={form.control}
        render={({ field }) => (
          <Input
            label="Kelas"
            required
            placeholder="cth: 25A"
            maxLength={10}
            value={field.value}
            onChange={(e) => field.onChange(e.target.value.toUpperCase().slice(0, 10))}
            onBlur={field.onBlur}
            hint="Format: 2 digit angkatan + huruf kelas (cth: 25A)"
            error={form.formState.errors.kelas?.message}
          />
        )}
      />
      <Controller
        name="program_studi_id"
        control={form.control}
        render={({ field }) => (
          <AsyncSelect
            label="Program Studi (opsional)"
            placeholder="Semua prodi..."
            value={field.value}
            onChange={(val) => field.onChange(extractOptionValue(val))}
            loadOptions={loadProdiOptions}
            isClearable
            error={form.formState.errors.program_studi_id?.message}
          />
        )}
      />
      <div className="md:col-span-2 flex justify-end">
        <Button
          size="sm"
          type="submit"
          icon={<Users size={16} />}
          loading={form.formState.isSubmitting}
          disabled={form.formState.isSubmitting}
        >
          Tambahkan Kelas
        </Button>
      </div>
    </form>
  );
}

interface TryoutPesertaTabProps {
  quizId: number;
  peserta: LmsTryoutPeserta[];
  krsCount: number | null;
  kodeAkses?: string | null;
  onChanged: () => void;
}

export default function TryoutPesertaTab({ quizId, peserta, krsCount, kodeAkses, onChanged }: TryoutPesertaTabProps) {
  const [copied, setCopied] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ isOpen: boolean; id: number | null; name: string }>({
    isOpen: false,
    id: null,
    name: '',
  });
  const [deleting, setDeleting] = useState(false);

  const handleCopyKode = async () => {
    if (!kodeAkses) return;
    try {
      await navigator.clipboard.writeText(kodeAkses);
      setCopied(true);
      toast.success('Kode akses disalin');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Gagal menyalin kode akses');
    }
  };

  const handleRemove = async () => {
    if (!deleteTarget.id) return;
    setDeleting(true);
    try {
      await lmsService.removeTryoutPeserta(deleteTarget.id);
      toast.success('Peserta dihapus');
      setDeleteTarget({ isOpen: false, id: null, name: '' });
      onChanged();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus peserta');
    } finally {
      setDeleting(false);
    }
  };

  const columns: ColumnDef<LmsTryoutPeserta>[] = [
    {
      key: 'mahasiswa',
      label: 'MAHASISWA',
      render: (p) => (
        <div>
          <span className="font-bold text-slate-800 text-xs block">{p.mahasiswa?.nama_lengkap || `ID #${p.mahasiswa_id}`}</span>
          <span className="text-2xs text-slate-500 font-mono block">{p.mahasiswa?.nim || '-'}</span>
        </div>
      ),
    },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (p) => (
        <div className="flex justify-end">
          <DropdownMenu
            items={[
              {
                label: 'Hapus',
                icon: <Trash2 size={16} />,
                onClick: () =>
                  setDeleteTarget({
                    isOpen: true,
                    id: p.id,
                    name: p.mahasiswa?.nama_lengkap || `#${p.mahasiswa_id}`,
                  }),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-500">Peserta otomatis (KRS kelas)</div>
            <div className="text-xs font-bold text-slate-800">
              {krsCount === null || krsCount === undefined ? '-' : `${krsCount} mahasiswa`}
            </div>
            <div className="text-2xs text-slate-400">Seluruh mahasiswa KRS aktif dapat mengerjakan.</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'var(--module-primary-subtle)', color: 'var(--module-primary)' }}
          >
            <KeyRound size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-500">Kode Akses</div>
            {kodeAkses ? (
              <div className="flex items-center gap-2">
                <code className="text-xs font-bold font-mono text-slate-800">{kodeAkses}</code>
                <Button size="sm" variant="outline" icon={copied ? <Check size={16} /> : <Copy size={16} />} onClick={handleCopyKode}>
                  {copied ? 'Disalin' : 'Salin'}
                </Button>
              </div>
            ) : (
              <Badge variant="gray">Terbuka (tanpa kode)</Badge>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-4 space-y-4">
        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Peserta Eksplisit ({peserta.length})
        </h5>
        <TambahPesertaForm quizId={quizId} onAdded={onChanged} />
        <hr className="border-t border-slate-100" />
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Users size={16} style={{ color: 'var(--module-primary)' }} />
            <h6 className="text-xs font-bold uppercase tracking-wider text-slate-700">Tambah per Kelas</h6>
          </div>
          <TambahPesertaKelasForm quizId={quizId} onAdded={onChanged} />
        </div>
        <DataTable
          columns={columns}
          data={peserta}
          meta={{ current_page: 1, last_page: 1, per_page: peserta.length || 10, total: peserta.length }}
          onPageChange={() => {}}
          emptyMessage="Belum ada peserta eksplisit. Mahasiswa KRS tetap dapat mengerjakan otomatis."
        />
      </Card>

      <TryoutKolaboratorCard quizId={quizId} />

      <ConfirmDialog
        isOpen={deleteTarget.isOpen}
        onClose={() => setDeleteTarget({ isOpen: false, id: null, name: '' })}
        onConfirm={handleRemove}
        isLoading={deleting}
        title="Hapus Peserta"
        message={<span>Yakin hapus <strong>{deleteTarget.name}</strong> dari peserta tryout?</span>}
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
