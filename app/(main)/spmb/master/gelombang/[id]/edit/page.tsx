'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { spmbService } from '@/services/spmb.service';
import { GelombangPenerimaan, JalurMasuk } from '@/types/spmb.types';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

export default function EditGelombangPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [jalurList, setJalurList] = useState<JalurMasuk[]>([]);

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<Partial<GelombangPenerimaan>>({
    defaultValues: {
      tahun_akademik_id: 1, // Dummy default
      kuota_total: 100,
      biaya_pendaftaran: 250000,
      status: 'draft',
    }
  });

  useEffect(() => {
    const fetchJalur = async () => {
      try {
        const res = await spmbService.getJalurMasuk();
        setJalurList(res.data.filter((j: any) => j.is_active));
      } catch (error) {
        console.error('Failed to load jalur masuk', error);
      }
    };
    fetchJalur();
  }, []);

  useEffect(() => {
    if (!id) return;
    
    const fetchDetail = async () => {
      try {
        setFetching(true);
        const res = await spmbService.getGelombangById(id);
        const row = res.data;
        reset({
          ...row,
          tanggal_buka: row.tanggal_buka ? row.tanggal_buka.substring(0, 10) : '',
          tanggal_tutup: row.tanggal_tutup ? row.tanggal_tutup.substring(0, 10) : '',
          tanggal_ujian: row.tanggal_ujian ? row.tanggal_ujian.substring(0, 10) : '',
          tanggal_pengumuman: row.tanggal_pengumuman ? row.tanggal_pengumuman.substring(0, 10) : '',
        });
      } catch (error: any) {
        toast.error('Gagal memuat data gelombang');
        router.push('/spmb/master/gelombang');
      } finally {
        setFetching(false);
      }
    };
    
    fetchDetail();
  }, [id, reset, router]);

  const onSubmit = async (data: Partial<GelombangPenerimaan>) => {
    try {
      setLoading(true);
      await spmbService.updateGelombang(id, data);
      toast.success('Gelombang berhasil diperbarui');
      router.push('/spmb/master/gelombang');
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
        <h1 className="text-2xl font-bold">Edit Gelombang</h1>
      </div>

      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body p-8">
          <form onSubmit={handleSubmit(onSubmit)}>
            
            <h3 className="text-lg font-semibold mb-4 text-base-content border-b pb-2">Informasi Umum</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              
              <Controller
                name="jalur_masuk_id"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Select
                    label="Jalur Masuk *"
                    placeholder="Pilih Jalur..."
                    options={jalurList.map((j) => ({ value: j.id.toString(), label: j.nama }))}
                    value={field.value?.toString()}
                    onChange={(val) => field.onChange(val ? Number(val) : '')}
                  />
                )}
              />

              <Input 
                label="Nama Gelombang *"
                placeholder="Contoh: Gelombang 1 - Prestasi"
                {...register('nama', { required: true })} 
              />
              
              <Input 
                type="number"
                label="Kuota Pendaftar *"
                {...register('kuota_total', { required: true, min: 1 })} 
              />
              
              <Input 
                type="number"
                label="Biaya Pendaftaran (Rp) *"
                hint="Digunakan sebagai tarif tagihan SPMB"
                {...register('biaya_pendaftaran', { required: true, min: 0 })} 
              />

              <div className="md:col-span-2">
                <Controller
                  name="status"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select
                      label="Status Gelombang"
                      options={[
                        { value: 'draft', label: 'Draft (Belum Dibuka)' },
                        { value: 'aktif', label: 'Aktif (Sedang Berjalan)' },
                        { value: 'ditutup', label: 'Ditutup (Pendaftaran Berakhir)' },
                        { value: 'selesai', label: 'Selesai (Sudah Pengumuman)' }
                      ]}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
            </div>

            <h3 className="text-lg font-semibold mb-4 text-base-content border-b pb-2">Jadwal Pelaksanaan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <Input 
                type="date"
                label="Tgl Buka Pendaftaran *"
                {...register('tanggal_buka', { required: true })} 
              />
              <Input 
                type="date"
                label="Tgl Tutup Pendaftaran *"
                {...register('tanggal_tutup', { required: true })} 
              />

              <Input 
                type="date"
                label="Tgl Ujian"
                {...register('tanggal_ujian')} 
              />
              <Input 
                type="date"
                label="Tgl Pengumuman"
                {...register('tanggal_pengumuman')} 
              />

            </div>

            {/* Hidden academic year ID for now since we don't have Siakad integrated yet in this context */}
            <input type="hidden" {...register('tahun_akademik_id')} value={1} />

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
