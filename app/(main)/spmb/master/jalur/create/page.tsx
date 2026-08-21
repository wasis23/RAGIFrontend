'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { spmbService } from '@/services/spmb.service';
import { Input } from '@/components/ui/Input';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';

const schema = z.object({
  kode: z.string().min(1, 'Kode jalur wajib diisi'),
  nama: z.string().min(1, 'Nama jalur wajib diisi'),
  deskripsi: z.string().optional().nullable(),
  master_tipe_jalur_id: z.number().min(1, 'Tipe jalur wajib dipilih'),
  ada_wawancara: z.boolean(),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export default function CreateJalurPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      is_active: true,
      ada_wawancara: false
    }
  });

  const fetchTipeJalur = async () => {
    try {
      const res = await spmbService.getMasterTipeJalur();
      return (res.data || []).map((t: any) => ({
        value: t.id,
        label: t.nama
      }));
    } catch {
      return [];
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      setLoading(true);
      const payload = {
        ...data,
        deskripsi: data.deskripsi === null ? undefined : data.deskripsi,
      };
      await spmbService.createJalurMasuk(payload as any);
      toast.success('Jalur masuk berhasil ditambahkan');
      router.push('/spmb/master/jalur');
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-fade-in">
      <PageHeader
        title="Tambah Jalur Masuk"
        description="Buat master data jalur pendaftaran baru"
        backUrl="/spmb/master/jalur"
      />

      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body p-6 md:p-8">
          <form onSubmit={handleSubmit(onSubmit)}>
            <h3 className="text-lg font-semibold mb-4 text-base-content border-b pb-2">Informasi Umum</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Input 
                label="Kode Jalur *"
                placeholder="Misal: REG"
                error={errors.kode?.message}
                {...register('kode')} 
              />
              
              <Input 
                label="Nama Jalur *"
                placeholder="Misal: Reguler"
                error={errors.nama?.message}
                {...register('nama')} 
              />
              
              <div className="md:col-span-2">
                <Controller
                  name="master_tipe_jalur_id"
                  control={control}
                  render={({ field }) => (
                    <AsyncSelect
                      label="Tipe Jalur *"
                      placeholder="Pilih tipe jalur..."
                      loadOptions={fetchTipeJalur}
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.master_tipe_jalur_id?.message}
                      defaultOptions
                    />
                  )}
                />
              </div>
              
              <div className="md:col-span-2">
                <Textarea 
                  label="Deskripsi Keterangan"
                  placeholder="Penjelasan singkat mengenai jalur ini"
                  error={errors.deskripsi?.message}
                  {...register('deskripsi')} 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="flex items-center">
                <Checkbox label="Membutuhkan Wawancara" {...register('ada_wawancara')} />
              </div>
              <div className="flex items-center">
                <Checkbox 
                  label="Status Aktif (Jalur ini digunakan)"
                  {...register('is_active')} 
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-base-200">
               <Button type="button" variant="secondary" onClick={() => router.back()} disabled={loading}>Batal</Button>
               <Button type="submit" variant="primary" loading={loading} icon={<Save size={18} />}>
                 Simpan
               </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}