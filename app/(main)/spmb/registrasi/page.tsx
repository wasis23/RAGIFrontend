'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Hero } from '@/components/ui/Hero';
import { Map, User, BookOpen, CheckCircle, ArrowRight, CreditCard, ShieldCheck } from 'lucide-react';
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
  const [suksesData, setSuksesData] = useState<any>(null);

  const selectedJalur = watch('jalur_id');
  const selectedGelombang = watch('gelombang_id');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchJalur();
    checkExistingRegistration();
  }, []);

  const checkExistingRegistration = async () => {
    try {
      const res = await spmbService.getMyPendaftaran();
      if (res.data && res.data.pendaftaran) {
        const { pendaftaran, tagihan } = res.data;
        // Set values if they exist, just in case
        ['nama_lengkap', 'nik', 'tanggal_lahir', 'tempat_lahir', 'jenis_kelamin', 'alamat', 'asal_sekolah', 'jurusan_sekolah'].forEach(field => {
          if (pendaftaran[field]) setValue(field, pendaftaran[field]);
        });
        if (pendaftaran.gelombang_id) setValue('gelombang_id', pendaftaran.gelombang_id);
        if (pendaftaran.gelombang_penerimaan?.jalur_masuk_id) setValue('jalur_id', pendaftaran.gelombang_penerimaan.jalur_masuk_id);

        // Langsung tampilkan halaman sukses beserta tagihan
        setSuksesData({ pendaftaran, tagihan });
      }
    } catch (error) {
      console.error('No existing registration found', error);
    }
  };

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
      const options = res.data.map((j: any) => ({ value: j.id, label: j.nama }));
      setJalurOptions(options);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchGelombang = async (jalurId: any) => {
    try {
      const res = await spmbService.getGelombang();
      const options = res.data
        .filter((g: any) => g.jalur_masuk_id === Number(jalurId))
        .map((g: any) => ({ value: g.id, label: g.nama }));
      setGelombangOptions(options);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTarif = async (jalurId: any, gelombangId: any) => {
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

  const onSubmit = async (data: any) => {
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
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in mt-6 sm:mt-10 px-4 sm:px-0">
        <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 text-center relative overflow-hidden">
          {/* Decorative Background */}
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-green-50 to-white/0 pointer-events-none" />
          
          <div className="relative z-10">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm ring-8 ring-green-50">
              <CheckCircle size={40} />
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-2">Pendaftaran Berhasil!</h2>
            <p className="text-slate-600 mb-8 text-lg">Nomor Pendaftaran Anda: <strong className="text-slate-900 bg-slate-100 px-3 py-1 rounded-md">{pendaftaran.no_pendaftaran}</strong></p>
            
            {tagihan && (
              <div className="bg-gradient-to-br from-slate-50 to-white p-5 sm:p-8 rounded-2xl text-left mb-8 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><CreditCard size={20} /></div>
                  <h3 className="font-bold text-lg text-slate-800">Informasi Pembayaran</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4">
                    <span className="text-slate-500 font-medium">Nomor Tagihan</span>
                    <span className="font-bold text-slate-800 break-all">{tagihan.tagihan.nomor_tagihan}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4 pt-4 border-t border-slate-100">
                    <span className="text-slate-500 font-medium">Virtual Account ({tagihan.virtual_account.bank_code})</span>
                    <span className="font-black text-xl sm:text-2xl text-indigo-600 tracking-wider font-mono break-all">{tagihan.virtual_account.va_number}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4 pt-4 border-t border-slate-100">
                    <span className="text-slate-500 font-medium">Total Pembayaran</span>
                    <span className="font-black text-xl text-slate-800">Rp {new Intl.NumberFormat('id-ID').format(tagihan.tagihan.total_bayar)}</span>
                  </div>
                </div>
              </div>
            )}

            <p className="text-slate-500 mb-8 leading-relaxed max-w-xl mx-auto">
              Silakan lakukan pembayaran sesuai dengan nominal di atas ke nomor Virtual Account yang tertera. 
              Setelah pembayaran lunas, Anda dapat melanjutkan ke tahap pengisian berkas.
            </p>

            <Button onClick={() => router.push('/spmb/pendaftar')} size="lg" className="w-full sm:w-auto min-w-[250px] shadow-lg shadow-indigo-200">
              Menuju Dashboard Camaba <ArrowRight size={18} className="ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 animate-fade-in mb-20 pb-12 px-4 sm:px-0">
      <Hero
        badge={
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-sm font-medium text-white shadow-sm">
            <ShieldCheck size={16} className="text-emerald-300" />
            Portal Pendaftaran Resmi
          </span>
        }
        title={
          <>
            Formulir <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-200 to-white">Registrasi SPMB</span>
          </>
        }
        description="Lengkapi biodata diri Anda dan pilih jalur pendaftaran yang sesuai untuk memulai perjalanan akademik bersama kami."
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 mt-8">
        
        {/* Pilihan Jalur & Gelombang */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
          <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl shadow-sm hidden sm:block">
              <Map size={22} />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-800">Pilih Jalur & Gelombang</h3>
          </div>
          <div className="p-5 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
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
             <div className="mt-6 p-5 bg-primary-50 rounded-xl border border-primary-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-primary-900">Biaya Pendaftaran</h4>
                  <p className="text-sm text-primary-600 mt-1">Nominal yang harus dibayarkan untuk registrasi form ini.</p>
                </div>
                <div className="text-left sm:text-right">
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
        </div>

        {/* Biodata Diri */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
          <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl shadow-sm hidden sm:block">
              <User size={22} />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-800">Biodata Calon Mahasiswa</h3>
          </div>
          <div className="p-5 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8 mb-6 sm:mb-8">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 mb-5 sm:mb-6">
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
        </div>

        {/* Riwayat Pendidikan */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
          <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl shadow-sm hidden sm:block">
              <BookOpen size={22} />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-800">Riwayat Pendidikan</h3>
          </div>
          <div className="p-5 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8">
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
        </div>

        <div className="flex justify-end pt-4 sm:pt-6">
          <Button 
            type="submit" 
            size="lg" 
            className="w-full sm:w-auto shadow-xl shadow-indigo-200 min-w-0 sm:min-w-[280px] h-12 sm:h-14 text-sm sm:text-base font-bold"
            isLoading={loading} 
            disabled={!isMounted || loading || !selectedJalur || !selectedGelombang}
          >
            Submit Pendaftaran & Lanjut Pembayaran <ArrowRight size={18} className="ml-2" />
          </Button>
        </div>

      </form>
    </div>
  );
}
