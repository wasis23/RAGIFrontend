'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '@/lib/axios';

import { PageHeader } from '@/components/layout/PageHeader';

export default function CreateJadwalUjianPage() {
  const router = useRouter();
  const [gelombangOptions, setGelombangOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const { register, handleSubmit, control } = useForm();

  useEffect(() => {
    fetchGelombang();
  }, []);

  const fetchGelombang = async () => {
    try {
      const res = await api.get('/spmb/gelombang');
      setGelombangOptions(res.data.data.map((g: any) => ({
        value: g.id,
        label: g.nama
      })));
    } catch (e) {
      toast.error('Gagal mengambil data gelombang');
    }
  };

  const onSubmit = async (formData: any) => {
    setLoading(true);
    try {
      await api.post('/spmb/jadwal-ujian', formData);
      toast.success('Berhasil menyimpan jadwal!');
      router.push('/spmb/ujian/jadwal');
    } catch (error) {
      toast.error('Gagal menyimpan jadwal.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Tambah Jadwal Ujian (CBT)" 
        action={
          <button 
            onClick={() => router.back()} 
            className="btn bg-orange-500 text-white hover:bg-orange-600 border-none shadow-sm"
          >
            <ArrowLeft size={16} className="mr-2" /> Kembali
          </button>
        }
      />

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <div className="form-group">
                <Controller
                  name="gelombang_id"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select
                      label="Gelombang Penerimaan"
                      options={gelombangOptions}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
              
              <div className="form-group">
                <Input label="Nama Sesi (Misal: Sesi 1 Pagi)" {...register('nama_sesi', { required: true })} />
              </div>
              
              <div className="form-group">
                <Controller
                  name="tipe_ujian"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select
                      label="Tipe Ujian"
                      options={[
                        { value: 'tulis', label: 'Ujian Tulis (CBT)' },
                        { value: 'praktik', label: 'Ujian Praktik' },
                        { value: 'wawancara', label: 'Wawancara' }
                      ]}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
              
              <div className="form-group">
                <Input label="Tanggal Ujian" type="date" {...register('tanggal', { required: true })} />
              </div>

              <div className="form-group">
                <Input label="Jam Mulai" type="time" {...register('jam_mulai', { required: true })} />
              </div>

              <div className="form-group">
                <Input label="Jam Selesai" type="time" {...register('jam_selesai', { required: true })} />
              </div>

              <div className="form-group lg:col-span-1">
                <Input label="Kapasitas Ruangan" type="number" min="1" {...register('kapasitas', { required: true, valueAsNumber: true })} />
              </div>

            </div>

            <div className="flex justify-end gap-3 mt-8 border-t border-slate-100 pt-6">
               <button type="button" onClick={() => router.back()} className="btn btn-ghost text-slate-600">Batal</button>
               <Button type="submit" variant="primary" disabled={loading}>
                 <Save size={18} className="mr-2" /> Simpan Jadwal
               </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
