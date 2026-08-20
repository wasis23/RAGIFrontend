'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { spmbService } from '@/services/spmb.service';
import { GelombangPenerimaan, JalurMasuk } from '@/types/spmb.types';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

import { PageHeader } from '@/components/layout/PageHeader';

export default function CreateGelombangPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [jalurList, setJalurList] = useState<JalurMasuk[]>([]);
  const [sikeuTarifOptions, setSikeuTarifOptions] = useState<Array<{ value: string; label: string }>>([]);

  const { register, handleSubmit, control, formState: { errors } } = useForm<Partial<GelombangPenerimaan>>({
    defaultValues: {
      tahun_akademik_id: 1, // Dummy default
      kuota_total: 100,
      biaya_pendaftaran: 250000,
      status: 'draft',
    }
  });

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [jalurRes, sikeuRes] = await Promise.all([
          spmbService.getJalurMasuk(),
          spmbService.getSikeuTarifList().catch(() => null),
        ]);

        setJalurList(jalurRes.data.filter((j: any) => j.is_active));

        const rawTarifList = sikeuRes?.data || [];
        if (Array.isArray(rawTarifList) && rawTarifList.length > 0) {
          const mapped = rawTarifList.map((t: any) => ({
            value: Math.round(Number(t.nominal || t.nominal_tarif)).toString(),
            label: `${t.jenis_biaya?.kode || t.kode || 'SIKEU'} - ${t.nama || t.jenis_biaya?.nama || 'Tarif SPMB'} (Rp ${new Intl.NumberFormat('id-ID').format(Number(t.nominal || t.nominal_tarif || 0))})`
          }));
          setSikeuTarifOptions(mapped);
        }
      } catch (error) {
        console.error('Failed to load master data', error);
      }
    };
    fetchMasterData();
  }, []);

  const onSubmit = async (data: Partial<GelombangPenerimaan>) => {
    try {
      setLoading(true);
      const payload = {
        ...data,
        biaya_pendaftaran: data.biaya_pendaftaran !== undefined ? Number(data.biaya_pendaftaran) : undefined,
      };
      await spmbService.createGelombang(payload as any);
      toast.success('Gelombang berhasil ditambahkan');
      router.push('/spmb/master/gelombang');
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Tambah Gelombang" 
        action={
          <button 
            onClick={() => router.back()} 
            className="btn btn-secondary"
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
                  name="jalur_masuk_id"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select
                      label="Jalur Masuk *"
                      options={jalurList.map((j) => ({ value: j.id.toString(), label: j.nama }))}
                      value={field.value?.toString()}
                      onChange={(val) => field.onChange(val ? Number(val) : '')}
                    />
                  )}
                />
              </div>

              <div className="form-group">
                <Input 
                  label="Nama Gelombang *"
                  placeholder="Contoh: Gelombang 1 - Prestasi"
                  {...register('nama', { required: true })} 
                />
              </div>
              
              <div className="form-group">
                <Input 
                  type="number"
                  label="Kuota Pendaftar *"
                  {...register('kuota_total', { required: true, min: 1 })} 
                />
              </div>
              
              <div className="form-group">
                <Controller
                  name="biaya_pendaftaran"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select
                      label="Tarif Biaya Pendaftaran (Mapping SIKEU) *"
                      placeholder="-- Pilih Master Tarif Keuangan SIKEU --"
                      options={sikeuTarifOptions}
                      value={field.value?.toString() || '250000'}
                      onChange={(val) => field.onChange(val ? Number(val) : 250000)}
                      hint="Pilih opsi tarif yang berasal dari Master Tarif Modul Keuangan SIKEU."
                    />
                  )}
                />
              </div>

              <div className="form-group">
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

              <div className="form-group">
                <Input 
                  type="date"
                  label="Tgl Buka Pendaftaran *"
                  {...register('tanggal_buka', { required: true })} 
                />
              </div>

              <div className="form-group">
                <Input 
                  type="date"
                  label="Tgl Tutup Pendaftaran *"
                  {...register('tanggal_tutup', { required: true })} 
                />
              </div>

              <div className="form-group">
                <Input 
                  type="date"
                  label="Tgl Ujian"
                  {...register('tanggal_ujian')} 
                />
              </div>

              <div className="form-group">
                <Input 
                  type="date"
                  label="Tgl Pengumuman"
                  {...register('tanggal_pengumuman')} 
                />
              </div>

            </div>

            <input type="hidden" {...register('tahun_akademik_id')} value={1} />

            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
               <button type="button" onClick={() => router.back()} className="btn btn-ghost text-slate-600" disabled={loading}>Batal</button>
               <button type="submit" className="btn btn-primary" disabled={loading}>
                 {loading ? <span className="loading loading-spinner loading-sm"></span> : <Save size={18} className="mr-2" />}
                 Simpan Gelombang
               </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
