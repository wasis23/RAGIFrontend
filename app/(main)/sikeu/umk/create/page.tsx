'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Textarea } from '@/components/ui/Textarea';
import { getApiErrorMessage } from '@/lib/utils';

const umkSchema = z.object({
  unit_kas_id: z.number().int().nullable().optional(),
  nama_penerima: z.string().min(3, 'Nama penerima minimal 3 karakter'),
  tanggal: z.string().min(1, 'Tanggal UMK wajib diisi'),
  tanggal_selesai: z.string().optional(),
  keterangan: z.string().max(2000, 'Keterangan maksimal 2000 karakter').optional(),
  total: z.coerce.number({ error: 'Total UMK wajib diisi' }).min(1, 'Total UMK harus lebih dari nol'),
});

type UmkForm = z.infer<typeof umkSchema>;

export default function CreateUmkPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<UmkForm>({
    resolver: zodResolver(umkSchema) as unknown as Resolver<UmkForm>,
    defaultValues: { unit_kas_id: null, nama_penerima: '', tanggal: new Date().toISOString().slice(0, 10), tanggal_selesai: '', keterangan: '', total: 0 },
  });

  const [selectedUnitKas, setSelectedUnitKas] = useState<{ value: string; label: string } | null>(null);

  const loadUnitKasOptions = useCallback(async (inputValue: string) => {
    try {
      const res = await sikeuService.getUnitKasList();
      const list = Array.isArray(res.data) ? res.data : [];
      const q = inputValue.trim().toLowerCase();
      const filtered = q ? list.filter((u) => String(u.nama_kas || '').toLowerCase().includes(q)) : list;
      return filtered.map((u) => ({ value: String(u.id), label: u.nama_kas }));
    } catch {
      return [];
    }
  }, []);

  const onSubmit = async (form: UmkForm) => {
    setSubmitting(true);
    try {
      await sikeuService.createUmk({
        unit_kas_id: form.unit_kas_id ?? null,
        nama_penerima: form.nama_penerima,
        tanggal: form.tanggal,
        tanggal_selesai: form.tanggal_selesai || null,
        keterangan: form.keterangan || undefined,
        total: form.total,
      });
      toast.success('UMK berhasil dicatat.');
      router.push('/sikeu/umk');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Gagal mencatat UMK.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6 animate-fade-in">
      <PageHeader
        title="Catat Uang Muka Kerja"
        description="Uang muka dicatat aktif; penyelesaian dilakukan dari daftar UMK."
        action={
          <Button variant="outline" icon={<ArrowLeft size={16} />} onClick={() => router.push('/sikeu/umk')} className="font-bold text-xs border-[var(--module-primary)] text-[var(--module-primary)] hover:bg-[var(--module-primary-subtle)]">
            Kembali
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Wallet size={18} className="text-[var(--module-primary)]" />
              Informasi Uang Muka
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Controller
              control={control}
              name="unit_kas_id"
              render={({ field }) => (
                <AsyncSelect
                  label="Unit Kas (opsional)"
                  loadOptions={loadUnitKasOptions}
                  value={selectedUnitKas}
                  onChange={(val: { value: string; label: string } | null) => {
                    setSelectedUnitKas(val || null);
                    field.onChange(val ? Number(val.value) : null);
                  }}
                  placeholder="Tanpa unit kas..."
                  error={errors.unit_kas_id?.message as string | undefined}
                  isClearable
                />
              )}
            />

            <Input label="Nama Penerima *" placeholder="Nama penerima dana" {...register('nama_penerima')} error={errors.nama_penerima?.message} />

            <Input label="Total (Rp) *" type="number" min={1} {...register('total')} error={errors.total?.message} />

            <Input label="Tanggal UMK *" type="date" {...register('tanggal')} error={errors.tanggal?.message} />

            <Input label="Tanggal Selesai" type="date" {...register('tanggal_selesai')} error={errors.tanggal_selesai?.message} />

            <div className="col-span-full">
              <Textarea label="Keterangan" placeholder="Keperluan uang muka..." {...register('keterangan')} error={errors.keterangan?.message} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => router.push('/sikeu/umk')}>Batal</Button>
            <Button type="submit" variant="primary" loading={submitting}>
              <Save size={16} className="mr-2" /> Simpan
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
