'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { spmbService } from '@/services/spmb.service';
import { JalurMasuk } from '@/types/spmb.types';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';

export default function EditJalurPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<Partial<JalurMasuk>>({
    defaultValues: {
      tipe: 'reguler',
      is_active: true,
      ada_ujian_tulis: false,
      ada_ujian_praktik: false,
      ada_wawancara: false
    }
  });

  useEffect(() => {
    if (!id) return;
    
    const fetchDetail = async () => {
      try {
        setFetching(true);
        const res = await spmbService.getJalurMasukById(id);
        reset(res.data);
      } catch (error: any) {
        toast.error('Gagal memuat data jalur masuk');
        router.push('/spmb/master/jalur');
      } finally {
        setFetching(false);
      }
    };
    
    fetchDetail();
  }, [id, reset, router]);

  const onSubmit = async (data: Partial<JalurMasuk>) => {
    try {
      setLoading(true);
      await spmbService.updateJalurMasuk(id, data);
      toast.success('Jalur masuk berhasil diperbarui');
      router.push('/spmb/master/jalur');
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* HEADER & BACK BUTTON */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => router.back()} 
          className="btn btn-ghost btn-sm"
        >
          <ArrowLeft size={18} /> Kembali
        </button>
        <h1 className="text-2xl font-bold">Edit Jalur Masuk</h1>
      </div>

      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body p-8">
          <form onSubmit={handleSubmit(onSubmit)}>
            
            <h3 className="text-lg font-semibold mb-4 text-base-content border-b pb-2">Informasi Umum</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              
              <Input 
                label="Kode Jalur *"
                placeholder="Misal: REG"
                {...register('kode', { required: true })} 
              />
              
              <Input 
                label="Nama Jalur *"
                placeholder="Misal: Reguler"
                {...register('nama', { required: true })} 
              />
              
              <Controller
                name="tipe"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Select
                    label="Tipe Jalur *"
                    options={[
                      { value: 'reguler', label: 'Reguler' },
                      { value: 'transfer', label: 'Transfer' },
                      { value: 'beasiswa', label: 'Beasiswa' },
                      { value: 'internasional', label: 'Internasional' },
                      { value: 'rpla', label: 'RPL/A' }
                    ]}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              
              <div className="flex items-center pt-2 md:pt-8">
                <Checkbox 
                  label="Status Aktif (Jalur ini digunakan)"
                  {...register('is_active')} 
                />
              </div>

              <div className="md:col-span-2">
                <Textarea 
                  label="Deskripsi Keterangan"
                  placeholder="Penjelasan singkat mengenai jalur ini"
                  {...register('deskripsi')} 
                />
              </div>

            </div>

            <h3 className="text-lg font-semibold mb-4 text-base-content border-b pb-2">Komponen Ujian</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              <div className="flex items-center">
                <Checkbox label="Ujian Tulis" {...register('ada_ujian_tulis')} />
              </div>
              <div className="flex items-center">
                <Checkbox label="Ujian Praktik" {...register('ada_ujian_praktik')} />
              </div>
              <div className="flex items-center">
                <Checkbox label="Wawancara" {...register('ada_wawancara')} />
              </div>

            </div>

            {/* ACTION BUTTONS */}
            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-base-200">
               <button type="button" onClick={() => router.back()} className="btn btn-ghost" disabled={loading}>Batal</button>
               <button type="submit" className="btn btn-primary" disabled={loading}>
                 {loading ? <span className="loading loading-spinner loading-sm"></span> : <Save size={18} className="mr-2" />}
                 Simpan Perubahan
               </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
