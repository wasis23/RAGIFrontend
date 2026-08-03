'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';

import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { spmbService, GelombangPenerimaan } from '@/services/spmb.service';

const formSchema = z.object({
  nama_lengkap: z.string().min(1, 'Nama lengkap wajib diisi'),
  nik: z.string().min(16, 'NIK minimal 16 digit').max(16, 'NIK maksimal 16 digit'),
  tempat_lahir: z.string().min(1, 'Tempat lahir wajib diisi'),
  tanggal_lahir: z.string().min(1, 'Tanggal lahir wajib diisi'),
  jenis_kelamin: z.enum(['L', 'P'], { required_error: 'Jenis kelamin wajib dipilih' }),
  alamat: z.string().min(1, 'Alamat wajib diisi'),
  asal_sekolah: z.string().min(1, 'Asal sekolah wajib diisi'),
  jurusan_sekolah: z.string().min(1, 'Jurusan sekolah wajib diisi'),
  gelombang_id: z.string().min(1, 'Gelombang wajib dipilih'),
  program_studi_id: z.string().min(1, 'Pilihan Prodi 1 wajib dipilih'),
  program_studi_pilihan2_id: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function FormulirPendaftaranPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [gelombangOptions, setGelombangOptions] = useState<{value: string, label: string}[]>([]);

  const { register, handleSubmit, control, formState: { errors }, setValue, reset } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nama_lengkap: '',
      nik: '',
      tempat_lahir: '',
      tanggal_lahir: '',
      jenis_kelamin: undefined,
      alamat: '',
      asal_sekolah: '',
      jurusan_sekolah: '',
      gelombang_id: '',
      program_studi_id: '',
      program_studi_pilihan2_id: '',
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const myPendaftaran = await spmbService.getMyPendaftaran();
        if (myPendaftaran?.data) {
          const data = myPendaftaran.data;
          reset({
            nama_lengkap: data.nama_lengkap || '',
            nik: data.nik || '',
            tempat_lahir: data.tempat_lahir || '',
            tanggal_lahir: data.tanggal_lahir || '',
            jenis_kelamin: data.jenis_kelamin as 'L' | 'P' | undefined,
            alamat: data.alamat || '',
            asal_sekolah: data.asal_sekolah || '',
            jurusan_sekolah: data.jurusan_sekolah || '',
            gelombang_id: data.gelombang_id ? String(data.gelombang_id) : '',
            program_studi_id: data.program_studi_id ? String(data.program_studi_id) : '',
            program_studi_pilihan2_id: data.program_studi_pilihan2_id ? String(data.program_studi_pilihan2_id) : '',
          });
        }

        const resGelombang = await spmbService.getGelombang();
        if (resGelombang?.data) {
          const items = Array.isArray(resGelombang.data) ? resGelombang.data : (resGelombang.data.items || []);
          const options = items
            .filter((g: GelombangPenerimaan) => g.status === 'aktif')
            .map((g: GelombangPenerimaan) => ({
              value: String(g.id),
              label: g.nama,
            }));
          setGelombangOptions(options);
          
          if (options.length > 0 && !myPendaftaran?.data?.gelombang_id) {
            setValue('gelombang_id', options[0].value);
          }
        }
      } catch (error) {
        toast.error('Gagal mengambil data dari server');
      }
    };
    
    fetchData();
  }, [reset, setValue]);

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      await spmbService.submitBiodata({
        ...data,
        gelombang_id: Number(data.gelombang_id),
        program_studi_id: Number(data.program_studi_id),
        program_studi_pilihan2_id: data.program_studi_pilihan2_id ? Number(data.program_studi_pilihan2_id) : undefined,
      });
      toast.success('Berhasil menyimpan formulir pendaftaran');
      router.push('/spmb/pendaftaran');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal menyimpan formulir');
    } finally {
      setIsLoading(false);
    }
  };

  const prodiOptions = [
    { value: '1', label: 'Teknik Informatika' },
    { value: '2', label: 'Sistem Informasi' },
    { value: '3', label: 'Manajemen' },
    { value: '4', label: 'Akuntansi' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => router.back()} 
          className="btn btn-ghost btn-sm"
        >
          <ArrowLeft size={18} /> Kembali
        </button>
        <PageHeader title="Formulir Pendaftaran SPMB" />
      </div>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <h3 className="text-lg font-bold mb-4 border-b pb-2">Biodata Diri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Input
                label="Nama Lengkap"
                placeholder="Masukkan nama lengkap"
                error={errors.nama_lengkap?.message}
                {...register('nama_lengkap')}
                required
              />
              <Input
                label="NIK"
                placeholder="Masukkan 16 digit NIK"
                error={errors.nik?.message}
                {...register('nik')}
                required
              />
              <Input
                label="Tempat Lahir"
                placeholder="Masukkan tempat lahir"
                error={errors.tempat_lahir?.message}
                {...register('tempat_lahir')}
                required
              />
              <Input
                type="date"
                label="Tanggal Lahir"
                error={errors.tanggal_lahir?.message}
                {...register('tanggal_lahir')}
                required
              />
              <Controller
                control={control}
                name="jenis_kelamin"
                render={({ field }) => (
                  <Select
                    label="Jenis Kelamin"
                    options={[
                      { value: 'L', label: 'Laki-laki' },
                      { value: 'P', label: 'Perempuan' },
                    ]}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.jenis_kelamin?.message}
                    required
                  />
                )}
              />
              <div className="col-span-1 md:col-span-2 lg:col-span-3">
                <Textarea
                  label="Alamat Lengkap"
                  placeholder="Masukkan alamat domisili saat ini"
                  error={errors.alamat?.message}
                  {...register('alamat')}
                  required
                />
              </div>
            </div>

            <h3 className="text-lg font-bold mb-4 border-b pb-2">Asal Sekolah</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Input
                label="Nama Sekolah"
                placeholder="Masukkan asal sekolah"
                error={errors.asal_sekolah?.message}
                {...register('asal_sekolah')}
                required
              />
              <Input
                label="Jurusan Sekolah"
                placeholder="Misal: IPA, IPS, RPL"
                error={errors.jurusan_sekolah?.message}
                {...register('jurusan_sekolah')}
                required
              />
            </div>

            <h3 className="text-lg font-bold mb-4 border-b pb-2">Pilihan Program Studi</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Controller
                control={control}
                name="gelombang_id"
                render={({ field }) => (
                  <Select
                    label="Gelombang Penerimaan"
                    options={gelombangOptions}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.gelombang_id?.message}
                    required
                    placeholder="Pilih Gelombang"
                  />
                )}
              />
              <Controller
                control={control}
                name="program_studi_id"
                render={({ field }) => (
                  <Select
                    label="Pilihan Prodi 1"
                    options={prodiOptions}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.program_studi_id?.message}
                    required
                  />
                )}
              />
              <Controller
                control={control}
                name="program_studi_pilihan2_id"
                render={({ field }) => (
                  <Select
                    label="Pilihan Prodi 2 (Opsional)"
                    options={prodiOptions}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.program_studi_pilihan2_id?.message}
                    isClearable
                  />
                )}
              />
            </div>

            <div className="flex justify-end gap-3 mt-8">
               <Button type="button" variant="ghost" onClick={() => router.back()}>
                 Batal
               </Button>
               <Button type="submit" variant="primary" loading={isLoading}>
                 <div className="flex items-center">
                   <Save size={18} className="mr-2" /> Simpan Formulir
                 </div>
               </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
