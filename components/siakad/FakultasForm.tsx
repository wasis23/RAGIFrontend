'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export const fakultasSchema = z.object({
  kode: z.string().min(1, 'Kode fakultas wajib diisi').max(20, 'Kode maksimal 20 karakter'),
  nama: z.string().min(3, 'Nama fakultas minimal 3 karakter').max(255, 'Nama maksimal 255 karakter'),
  nama_singkat: z.string().max(50, 'Nama singkat maksimal 50 karakter').optional().or(z.literal('')),
  telepon: z.string().max(30, 'Telepon maksimal 30 karakter').optional().or(z.literal('')),
  email: z.string().max(100, 'Email maksimal 100 karakter').optional().or(z.literal('')).refine(
    (v) => !v || /.+@.+\..+/.test(v),
    'Format email tidak valid'
  ),
});

export type FakultasFormValues = z.infer<typeof fakultasSchema>;

interface FakultasFormProps {
  defaultValues?: Partial<FakultasFormValues>;
  onSubmit: (values: FakultasFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  isEditing?: boolean;
}

export function FakultasForm({ defaultValues, onSubmit, onCancel, submitLabel = 'Simpan Fakultas', isEditing = false }: FakultasFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FakultasFormValues>({
    resolver: zodResolver(fakultasSchema),
    defaultValues: {
      kode: '',
      nama: '',
      nama_singkat: '',
      telepon: '',
      email: '',
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Kode Fakultas" required disabled={isEditing} placeholder="cth. FTI" error={errors.kode?.message} {...register('kode')} />
        <Input label="Nama Singkat" placeholder="cth. FTIK" error={errors.nama_singkat?.message} {...register('nama_singkat')} />
        <div className="md:col-span-2">
          <Input label="Nama Lengkap Fakultas" required placeholder="cth. Fakultas Teknologi Informasi" error={errors.nama?.message} {...register('nama')} />
        </div>
        <Input label="Nomor Telepon" placeholder="cth. 021-1234567" error={errors.telepon?.message} {...register('telepon')} />
        <Input label="Email Resmi Fakultas" type="email" placeholder="cth. fti@kampus.ac.id" error={errors.email?.message} {...register('email')} />
      </div>
      <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit" variant="primary" loading={isSubmitting} disabled={isSubmitting}>
          {isSubmitting ? 'Menyimpan...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
