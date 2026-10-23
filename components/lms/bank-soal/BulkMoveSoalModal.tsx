'use client';

import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { getApiErrorMessage } from '@/lib/utils';
import { siakadService } from '@/services/siakad.service';
import { MoveRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { loadKategoriOptions } from './BankSoalForm';

const bulkMoveSchema = z
  .object({
    kategori_id: z.string().optional().default(''),
  })
  .refine((v) => !!v.kategori_id, {
    message: 'Kategori tujuan wajib dipilih.',
    path: ['kategori_id'],
  });

type BulkMoveValues = z.infer<typeof bulkMoveSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  ids: number[];
  onMoved: (totalUpdated: number) => void;
}

function extractVal(val: unknown): string {
  if (val === null || val === undefined || val === '') return '';
  if (typeof val === 'object' && val !== null && 'value' in (val as Record<string, unknown>)) {
    const v = (val as { value: unknown }).value;
    return v === null || v === undefined ? '' : String(v);
  }
  return String(val);
}

/**
 * Modal pemindahan massal bank soal ke kategori lain (LMS-02).
 */
export default function BulkMoveSoalModal({ open, onClose, ids, onMoved }: Props) {
  const [isMoving, setIsMoving] = useState(false);

  const form = useForm<BulkMoveValues>({
    resolver: zodResolver(bulkMoveSchema) as any,
    defaultValues: { kategori_id: '' },
  });

  const handleSubmit = async (values: BulkMoveValues) => {
    setIsMoving(true);
    try {
      const res = await siakadService.bulkMoveSoal(ids, { kategori_id: Number(values.kategori_id) });
      const totalUpdated = res?.data?.total_updated ?? 0;
      toast.success(`${totalUpdated} soal berhasil dipindahkan.`);
      form.reset();
      onClose();
      onMoved(totalUpdated);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Gagal memindahkan soal.'));
    } finally {
      setIsMoving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Pindahkan Soal"
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={isMoving}>
            Batal
          </Button>
          <Button
            variant="primary"
            icon={<MoveRight size={16} />}
            onClick={form.handleSubmit(handleSubmit)}
            loading={isMoving}
            disabled={isMoving}
          >
            Pindahkan
          </Button>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
        <p className="text-xs text-slate-500">
          {ids.length} soal terpilih akan dipindahkan ke kategori tujuan.
        </p>

        <Controller
          name="kategori_id"
          control={form.control}
          render={({ field }) => (
            <AsyncSelect
              label="Kategori Tujuan"
              required
              placeholder="Pilih kategori..."
              value={field.value || ''}
              onChange={(val) => field.onChange(extractVal(val))}
              loadOptions={loadKategoriOptions}
              isClearable
              error={form.formState.errors.kategori_id?.message}
            />
          )}
        />
      </form>
    </Modal>
  );
}
