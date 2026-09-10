'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Save, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

import { spmbService } from '@/services/spmb.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Checkbox } from '@/components/ui/Checkbox';

const schema = z.object({
  jalur_masuk_id: z.number().min(1, 'Jalur Masuk wajib dipilih'),
  label: z.string().min(3, 'Label dokumen minimal 3 karakter'),
  wajib: z.boolean(),
  is_active: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export default function CreateBerkasRequirementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedJalur, setSelectedJalur] = useState<any>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      label: '',
      wajib: true,
      is_active: true,
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      await spmbService.createBerkasRequirement(data);
      toast.success('Syarat berkas berhasil ditambahkan');
      router.push('/spmb/master/berkas-requirement');
    } catch (error: any) {
      toast.error(error.message || 'Gagal menambahkan data');
    } finally {
      setLoading(false);
    }
  };

  const loadJalurOptions = async () => {
    const res = await spmbService.getJalurMasuk();
    return res.data
      .filter((j: any) => j.is_active)
      .map((j: any) => ({
        value: j.id,
        label: j.nama,
      }));
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <PageHeader
        title="Tambah Syarat Berkas"
        description="Tambahkan persyaratan dokumen baru untuk pendaftaran"
        action={
          <Button 
            variant="outline" 
            icon={<ArrowLeft size={16} />} 
            onClick={() => router.back()}
          >
            Kembali
          </Button>
        }
      />

      <div className="card p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              name="jalur_masuk_id"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  label="Jalur Masuk *"
                  loadOptions={loadJalurOptions}
                  defaultOptions
                  placeholder="Pilih Jalur Masuk..."
                  value={selectedJalur}
                  onChange={(sel: any) => {
                    setSelectedJalur(sel);
                    field.onChange(sel ? sel.value : null);
                  }}
                  error={errors.jalur_masuk_id?.message}
                />
              )}
            />

            <Controller
              name="label"
              control={control}
              render={({ field }) => (
                <Input
                  label="Label Dokumen (Nama Tampil) *"
                  placeholder="Contoh: Ijazah SMA/SMK"
                  error={errors.label?.message}
                  {...field}
                />
              )}
            />

            <Controller
              name="wajib"
              control={control}
              render={({ field }) => (
                <div className="flex items-center h-full pt-4">
                  <Checkbox
                    label="Dokumen ini Wajib Diunggah"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    error={errors.wajib?.message}
                  />
                </div>
              )}
            />

            <Controller
              name="is_active"
              control={control}
              render={({ field }) => (
                <div className="flex items-center h-full pt-4">
                  <Checkbox
                    label="Status Aktif (Tampil di Form)"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    error={errors.is_active?.message}
                  />
                </div>
              )}
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-800">
            <Button
              type="submit"
              icon={<Save size={16} />}
              isLoading={loading}
              disabled={loading}
            >
              Simpan Syarat Berkas
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
