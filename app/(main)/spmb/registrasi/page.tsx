'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { spmbService } from '@/services/spmb.service';
import api from '@/lib/axios';

export default function RegistrasiSpmbPage() {
  const router = useRouter();
  const { register, handleSubmit, control, watch, setValue } = useForm();
  
  const [jalurOptions, setJalurOptions] = useState([]);
  const [gelombangOptions, setGelombangOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tarif, setTarif] = useState(0);
  const [loadingTarif, setLoadingTarif] = useState(false);
  const [suksesData, setSuksesData] = useState(null);

  const selectedJalur = watch('jalur_id');
  const selectedGelombang = watch('gelombang_id');

  useEffect(() => {
    fetchJalur();
  }, []);

  useEffect(() => {
    if (selectedJalur) {
      fetchGelombang(selectedJalur);
    } else {
      setGelombangOptions([]);
    }
  }, [selectedJalur]);

  useEffect(() => {
    if (selectedJalur && selectedGelombang) {
      fetchTarif(selectedJalur, selectedGelombang);
    } else {
      setTarif(0);
    }
  }, [selectedJalur, selectedGelombang]);

  const fetchJalur = async () => {
    try {
      const res = await spmbService.getJalurMasuk();
      const options = res.data.map((j) => ({ value: j.id, label: j.nama }));
      setJalurOptions(options);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchGelombang = async (jalurId) => {
    try {
      const res = await spmbService.getGelombang();
      const options = res.data
        .filter((g) => g.jalur_masuk_id === Number(jalurId))
        .map((g) => ({ value: g.id, label: g.nama }));
      setGelombangOptions(options);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTarif = async (jalurId, gelombangId) => {
    setLoadingTarif(true);
    try {
      const res = await api.get('/v1/sikeu/spmb/tarif', {
        params: { jalur_id: jalurId, gelombang_id: gelombangId }
      });
      setTarif(res.data.data?.nominal || 0);
    } catch (error) {
      console.error('Failed to fetch tarif', error);
      setTarif(0);
    } finally {
      setLoadingTarif(false);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Hardcoded program_studi_id for now as we don't have prodi endpoint
      data.program_studi_id = 1; 
      
      const res = await spmbService.submitBiodata(data);
      if (res.status === 'success') {
        toast.success(res.message);
        setSuksesData(res.data);
      }
    } catch (error) {
      console.error(error);
      toast.error('Gagal melakukan pendaftaran. Silakan periksa kembali data Anda.');
    } finally {
      setLoading(false);
    }
  };

  if (suksesData) {
    const { pendaftaran, tagihan } = suksesData;
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in mt-10">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Pendaftaran Berhasil!</h2>
          <p className="text-slate-600 mb-6">Nomor Pendaftaran Anda: <strong>{pendaftaran.no_pendaftaran}</strong></p>
          
          {tagihan && (
            <div className="bg-slate-50 p-6 rounded-lg text-left mb-6">
              <h3 className="font-semibold text-slate-800 mb-4 border-b pb-2">Informasi Pembayaran</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nomor Tagihan</span>
                  <span className="font-medium text-slate-800">{tagihan.tagihan.nomor_tagihan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Virtual Account (BNI)</span>
                  <span className="font-bold text-primary-600 text-lg">{tagihan.virtual_account.va_number}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t mt-2">
                  <span className="text-slate-500">Total Pembayaran</span>
                  <span className="font-bold text-slate-800 text-xl">Rp {tagihan.tagihan.total_bayar.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          )}

          <p className="text-sm text-slate-500 mb-6">
            Silakan lakukan pembayaran sesuai dengan nominal di atas ke nomor Virtual Account yang tertera. 
            Setelah pembayaran lunas, Anda dapat melanjutkan ke tahap pengisian berkas.
          </p>

          <Button onClick={() => router.push('/spmb/pendaftar')}>Menuju Dashboard Calon Mahasiswa</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in mb-20">
      <PageHeader 
        title="Form Pendaftaran Mahasiswa Baru" 
        description="Lengkapi biodata dan pilih jalur pendaftaran yang sesuai"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Pilihan Jalur & Gelombang */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b">Pilih Jalur & Gelombang</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Controller
              name="jalur_id"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <Select
                  label="Jalur Pendaftaran *"
                  options={jalurOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="-- Pilih Jalur --"
                />
              )}
            />
            <Controller
              name="gelombang_id"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <Select
                  label="Gelombang Penerimaan *"
                  options={gelombangOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="-- Pilih Gelombang --"
                  disabled={!selectedJalur}
                />
              )}
            />
          </div>

          {selectedJalur && selectedGelombang && (
             <div className="mt-6 p-4 bg-primary-50 rounded-lg border border-primary-100 flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-primary-800">Biaya Pendaftaran</h4>
                  <p className="text-sm text-primary-600">Nominal yang harus dibayarkan untuk registrasi form ini.</p>
                </div>
                <div className="text-right">
                  {loadingTarif ? (
                    <span className="text-primary-400 font-medium animate-pulse">Menghitung...</span>
                  ) : (
                    <span className="text-2xl font-bold text-primary-700">
                      Rp {tarif.toLocaleString('id-ID')}
                    </span>
                  )}
                </div>
             </div>
          )}
        </div>

        {/* Biodata Diri */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b">Biodata Calon Mahasiswa</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Input
              label="Nama Lengkap *"
              placeholder="Sesuai Ijazah"
              {...register('nama_lengkap', { required: true })}
            />
            <Input
              label="NIK (Nomor Induk Kependudukan) *"
              placeholder="16 Digit NIK"
              maxLength={16}
              {...register('nik', { required: true, minLength: 16, maxLength: 16 })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Input
              label="Tempat Lahir *"
              placeholder="Kota kelahiran"
              {...register('tempat_lahir', { required: true })}
            />
            <Input
              type="date"
              label="Tanggal Lahir *"
              {...register('tanggal_lahir', { required: true })}
            />
            <Controller
              name="jenis_kelamin"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <Select
                  label="Jenis Kelamin *"
                  options={[
                    { value: 'L', label: 'Laki-Laki' },
                    { value: 'P', label: 'Perempuan' }
                  ]}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="-- Pilih --"
                />
              )}
            />
          </div>

          <Textarea
            label="Alamat Lengkap *"
            placeholder="Jalan, RT/RW, Kelurahan, Kecamatan"
            rows={3}
            {...register('alamat', { required: true })}
          />
        </div>

        {/* Riwayat Pendidikan */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b">Riwayat Pendidikan</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Asal Sekolah *"
              placeholder="Nama SMA/SMK/MA"
              {...register('asal_sekolah', { required: true })}
            />
            <Input
              label="Jurusan Sekolah *"
              placeholder="IPA/IPS/RPL dsb"
              {...register('jurusan_sekolah', { required: true })}
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button 
            type="submit" 
            size="lg" 
            isLoading={loading} 
            disabled={loading || !selectedJalur || !selectedGelombang}
          >
            Submit Pendaftaran & Lanjut Pembayaran
          </Button>
        </div>

      </form>
    </div>
  );
}
