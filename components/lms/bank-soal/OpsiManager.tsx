'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { siakadService } from '@/services/siakad.service';
import { BankSoalOpsi } from '@/types/bank-soal.types';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const opsiSchema = z.object({
  teks: z.string().min(1, 'Teks opsi wajib diisi.'),
  is_benar: z.boolean().default(false),
});

type OpsiValues = z.infer<typeof opsiSchema>;

export default function OpsiManager({ soalId, tipeSoal }: { soalId: number; tipeSoal: string }) {
  const [opsiList, setOpsiList] = useState<BankSoalOpsi[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<BankSoalOpsi | null>(null);
  const [deleting, setDeleting] = useState(false);

  const form = useForm<OpsiValues>({
    resolver: zodResolver(opsiSchema) as any,
    defaultValues: { teks: '', is_benar: false },
  });

  const fetchOpsi = async () => {
    setLoading(true);
    try {
      const res: any = await siakadService.getSoalDetail(soalId);
      const row = res.data;
      const list = Array.isArray(row?.opsi) ? row.opsi : Array.isArray(row?.options) ? row.options : [];
      setOpsiList(list);
    } catch {
      setOpsiList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpsi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soalId]);

  const onSubmit = async (values: OpsiValues) => {
    try {
      await siakadService.saveOpsi(soalId, {
        teks: values.teks.trim(),
        is_benar: values.is_benar,
        urutan: opsiList.length + 1,
      });
      toast.success('Opsi berhasil ditambahkan.');
      form.reset({ teks: '', is_benar: false });
      fetchOpsi();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menambah opsi.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await siakadService.deleteOpsi(soalId, deleteTarget.id);
      toast.success('Opsi berhasil dihapus.');
      setDeleteTarget(null);
      fetchOpsi();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus opsi.');
    } finally {
      setDeleting(false);
    }
  };

  if (tipeSoal !== 'pilihan_ganda') return null;

  const columns: ColumnDef<BankSoalOpsi>[] = [
    {
      key: 'teks',
      label: 'OPSI',
      render: (row) => (
        <div>
          <span className="text-xs text-slate-800 block line-clamp-2">{row.teks}</span>
          <span className="text-2xs text-slate-500 block">Urutan {row.urutan}</span>
        </div>
      ),
    },
    {
      key: 'benar',
      label: 'BENAR',
      align: 'center',
      render: (row) => <Badge variant={row.is_benar ? 'green' : 'gray'}>{row.is_benar ? 'Benar' : 'Salah'}</Badge>,
    },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end">
          <Button type="button" variant="outline-danger" size="sm" icon={<Trash2 size={16} />} onClick={() => setDeleteTarget(row)}>
            Hapus
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Card className="p-4 space-y-4">
      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700">Kelola Opsi</h5>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="md:col-span-2">
          <Input
            label="Teks Opsi"
            placeholder="Tulis teks opsi jawaban..."
            error={form.formState.errors.teks?.message}
            {...form.register('teks')}
          />
        </div>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Checkbox label="Tandai benar" {...form.register('is_benar')} />
          </div>
          <Button type="submit" size="sm" icon={<Plus size={16} />} loading={form.formState.isSubmitting} disabled={form.formState.isSubmitting}>
            Tambah
          </Button>
        </div>
      </form>

      <DataTable columns={columns} data={opsiList} isLoading={loading} emptyMessage="Belum ada opsi. Tambahkan opsi di atas." />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={deleting}
        title="Hapus Opsi"
        message="Yakin menghapus opsi ini?"
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </Card>
  );
}
