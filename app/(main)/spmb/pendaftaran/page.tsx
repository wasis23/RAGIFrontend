'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, ChevronRight, ChevronLeft, Upload, CheckCircle, GraduationCap, Sparkles } from 'lucide-react';

import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { spmbService, GelombangPenerimaan } from '@/services/spmb.service';

const formSchema = z.object({
  // Step 1: Biodata
  nama_lengkap: z.string().min(1, 'Nama lengkap wajib diisi'),
  nik: z.string().min(16, 'NIK minimal 16 digit').max(16, 'NIK maksimal 16 digit'),
  tempat_lahir: z.string().min(1, 'Tempat lahir wajib diisi'),
  tanggal_lahir: z.string().min(1, 'Tanggal lahir wajib diisi'),
  jenis_kelamin: z.enum(['L', 'P'], { required_error: 'Jenis kelamin wajib dipilih' }),
  agama: z.string().optional(),
  kewarganegaraan: z.string().default('WNI'),
  no_hp: z.string().min(10, 'No HP minimal 10 digit').max(15, 'No HP maksimal 15 digit'),
  alamat: z.string().min(1, 'Alamat wajib diisi'),
  provinsi: z.string().min(1, 'Provinsi wajib diisi'),
  kota_kabupaten: z.string().min(1, 'Kota/Kabupaten wajib diisi'),
  kecamatan: z.string().min(1, 'Kecamatan wajib diisi'),
  kode_pos: z.string().optional(),

  // Step 2: Pendidikan
  asal_sekolah: z.string().min(1, 'Asal sekolah wajib diisi'),
  jurusan_sekolah: z.string().min(1, 'Jurusan sekolah wajib diisi'),
  tahun_lulus: z.string().min(4, 'Tahun lulus wajib diisi'),
  nilai_rata_rapor: z.string().optional(),
  npsn_sekolah: z.string().optional(),

  // Step 3: Orang Tua
  nama_ayah: z.string().optional(),
  pekerjaan_ayah: z.string().optional(),
  nama_ibu: z.string().optional(),
  pekerjaan_ibu: z.string().optional(),
  penghasilan_ortu: z.string().optional(),
  nama_wali: z.string().optional(),
  telepon_wali: z.string().optional(),

  // Step 4: Program Studi
  gelombang_id: z.string().min(1, 'Gelombang wajib dipilih'),
  program_studi_id: z.string().min(1, 'Pilihan Prodi 1 wajib dipilih'),
  program_studi_pilihan2_id: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const steps = [
  { id: 1, title: 'Biodata Diri' },
  { id: 2, title: 'Pendidikan' },
  { id: 3, title: 'Data Orang Tua' },
  { id: 4, title: 'Pilihan Prodi' },
  { id: 5, title: 'Unggah Berkas' },
];

export default function FormulirPendaftaranPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [gelombangOptions, setGelombangOptions] = useState<{value: string, label: string}[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, boolean>>({});

  const { register, handleSubmit, control, formState: { errors, isValid }, trigger, setValue, reset, getValues } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      kewarganegaraan: 'WNI',
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const myPendaftaran = await spmbService.getMyPendaftaran();
        if (myPendaftaran?.data) {
          const data = myPendaftaran.data;
          reset({
            ...data,
            gelombang_id: data.gelombang_id ? String(data.gelombang_id) : '',
            program_studi_id: data.program_studi_id ? String(data.program_studi_id) : '',
            program_studi_pilihan2_id: data.program_studi_pilihan2_id ? String(data.program_studi_pilihan2_id) : '',
            nilai_rata_rapor: data.nilai_rata_rapor ? String(data.nilai_rata_rapor) : '',
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

  const validateStep = async () => {
    let fieldsToValidate: (keyof FormValues)[] = [];
    
    switch (currentStep) {
      case 1:
        fieldsToValidate = ['nama_lengkap', 'nik', 'tempat_lahir', 'tanggal_lahir', 'jenis_kelamin', 'no_hp', 'alamat', 'provinsi', 'kota_kabupaten', 'kecamatan'];
        break;
      case 2:
        fieldsToValidate = ['asal_sekolah', 'jurusan_sekolah', 'tahun_lulus'];
        break;
      case 3:
        fieldsToValidate = ['nama_ayah', 'nama_ibu'];
        break;
      case 4:
        fieldsToValidate = ['gelombang_id', 'program_studi_id'];
        break;
      default:
        return true;
    }
    
    const isStepValid = await trigger(fieldsToValidate);
    
    if (isStepValid) {
      // Save draft automatically when moving to next step
      saveDraft(getValues());
    }
    
    return isStepValid;
  };

  const nextStep = async () => {
    if (await validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const saveDraft = async (data: FormValues) => {
    try {
      await spmbService.submitBiodata({
        ...data,
        gelombang_id: Number(data.gelombang_id),
        program_studi_id: Number(data.program_studi_id),
        program_studi_pilihan2_id: data.program_studi_pilihan2_id ? Number(data.program_studi_pilihan2_id) : undefined,
        nilai_rata_rapor: data.nilai_rata_rapor ? Number(data.nilai_rata_rapor) : undefined,
      });
    } catch (error) {
      console.error('Gagal menyimpan draft', error);
    }
  };

  const onSubmit = async () => {
    setIsLoading(true);
    try {
      // Finalize logic
      await spmbService.finalizePendaftaran();
      toast.success('Pendaftaran berhasil disubmit!');
      router.push('/spmb/dashboard');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal mensubmit pendaftaran');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, jenis_berkas: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('jenis_berkas', jenis_berkas);

    try {
      await spmbService.uploadBerkas(formData);
      toast.success(`Berkas ${jenis_berkas} berhasil diunggah`);
      setUploadedFiles(prev => ({ ...prev, [jenis_berkas]: true }));
    } catch (error) {
      toast.error(`Gagal mengunggah ${jenis_berkas}`);
    }
  };

  const prodiOptions = [
    { value: '1', label: 'Teknik Informatika' },
    { value: '2', label: 'Sistem Informasi' },
    { value: '3', label: 'Manajemen' },
    { value: '4', label: 'Akuntansi' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Area Premium */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 mb-8 shadow-xl shadow-blue-900/20 isolate">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl opacity-60 -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-400/20 rounded-full blur-3xl opacity-60 translate-y-1/3 -translate-x-1/4"></div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xNSkiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom_right,white,transparent)]"></div>

        <div className="relative z-10 p-8 sm:p-10 md:p-12 lg:px-14 flex flex-col md:flex-row gap-8 items-center justify-between">
          <div className="flex-1 w-full text-left">
            <button 
              onClick={() => router.back()} 
              className="group flex items-center gap-2 text-sm font-semibold text-blue-100 hover:text-white transition-all duration-300 mb-6 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full w-fit backdrop-blur-sm border border-white/20"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
              Kembali ke Dashboard
            </button>
            
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold uppercase tracking-wider mb-4 shadow-sm backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-200 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              Portal Penerimaan Mahasiswa Baru
            </div>
            
            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4 drop-shadow-md leading-tight">
              Formulir Pendaftaran
            </h1>
            
            <p className="text-blue-50 max-w-2xl text-sm md:text-base leading-relaxed font-medium drop-shadow-sm">
              Lengkapi profil diri Anda dan jadilah bagian dari civitas akademika kami. Pastikan seluruh data yang dimasukkan akurat dan dapat dipertanggungjawabkan untuk mempermudah proses verifikasi.
            </p>
          </div>
          
          <div className="hidden lg:flex w-48 h-48 relative flex-shrink-0 items-center justify-center">
            <div className="absolute inset-0 bg-white/10 rounded-3xl blur-2xl"></div>
            <div className="relative bg-white/20 backdrop-blur-md border border-white/30 rounded-3xl p-8 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500 group">
              <GraduationCap size={72} className="text-white drop-shadow-lg group-hover:scale-110 transition-transform duration-500" strokeWidth={1.5} />
              <Sparkles size={24} className="text-blue-200 absolute -top-3 -right-3 animate-pulse drop-shadow-md" />
            </div>
          </div>
        </div>
      </div>

      {/* Steps Indicator */}
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 mb-8">
        <div className="relative flex justify-between items-center w-full max-w-3xl mx-auto">
          {/* Progress Bar Background */}
          <div className="absolute left-0 top-5 -translate-y-1/2 w-full h-1.5 bg-gray-100 rounded-full z-0"></div>
          {/* Progress Bar Fill */}
          <div 
            className="absolute left-0 top-5 -translate-y-1/2 h-1.5 bg-blue-500 rounded-full z-0 transition-all duration-500 ease-out" 
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          ></div>
          
          {steps.map(step => {
            const isCompleted = currentStep > step.id;
            const isActive = currentStep === step.id;
            
            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center gap-3">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 shadow-sm
                    ${isActive ? 'bg-blue-600 text-white ring-4 ring-blue-100 scale-110' : 
                      isCompleted ? 'bg-blue-500 text-white' : 'bg-white text-gray-400 border-2 border-gray-200'}`}
                >
                  {isCompleted ? <CheckCircle size={18} /> : step.id}
                </div>
                <span className={`text-xs md:text-sm font-semibold whitespace-nowrap transition-colors duration-300 hidden sm:block
                  ${isActive ? 'text-blue-700' : isCompleted ? 'text-gray-700' : 'text-gray-400'}`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 overflow-hidden relative">
        {/* Top Accent Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-400 to-blue-600"></div>
        
        <div className="p-6 md:p-10">
          <form className="space-y-8">
            
            {/* STEP 1: Biodata */}
            {currentStep === 1 && (
              <div className="transition-all duration-500 ease-in-out">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-100">
                  <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl font-bold">01</div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Biodata Diri & Kontak</h3>
                    <p className="text-sm text-gray-500 mt-1">Lengkapi informasi pribadi dasar Anda dengan benar sesuai identitas resmi.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-7">
                  <Input label="Nama Lengkap" {...register('nama_lengkap')} error={errors.nama_lengkap?.message} required />
                  <Input label="NIK (Nomor Induk Kependudukan)" {...register('nik')} error={errors.nik?.message} required />
                  <Controller
                    control={control}
                    name="jenis_kelamin"
                    render={({ field }) => (
                      <Select label="Jenis Kelamin" options={[{ value: 'L', label: 'Laki-laki' }, { value: 'P', label: 'Perempuan' }]} {...field} error={errors.jenis_kelamin?.message} required />
                    )}
                  />
                  <Input label="Tempat Lahir" {...register('tempat_lahir')} error={errors.tempat_lahir?.message} required />
                  <Input type="date" label="Tanggal Lahir" {...register('tanggal_lahir')} error={errors.tanggal_lahir?.message} required />
                  <Controller
                    control={control}
                    name="agama"
                    render={({ field }) => (
                      <Select label="Agama" options={[{ value: 'Islam', label: 'Islam' }, { value: 'Kristen', label: 'Kristen' }, { value: 'Katolik', label: 'Katolik' }, { value: 'Hindu', label: 'Hindu' }, { value: 'Buddha', label: 'Buddha' }, { value: 'Konghucu', label: 'Konghucu' }]} {...field} />
                    )}
                  />
                  <Input label="No WhatsApp / HP" {...register('no_hp')} error={errors.no_hp?.message} required />
                  <Input label="Kewarganegaraan" {...register('kewarganegaraan')} />
                  <div className="col-span-1 md:col-span-2 lg:col-span-3">
                    <Textarea label="Alamat Domisili Lengkap" {...register('alamat')} error={errors.alamat?.message} required />
                  </div>
                  <Input label="Provinsi" {...register('provinsi')} error={errors.provinsi?.message} required />
                  <Input label="Kota/Kabupaten" {...register('kota_kabupaten')} error={errors.kota_kabupaten?.message} required />
                  <Input label="Kecamatan" {...register('kecamatan')} error={errors.kecamatan?.message} required />
                  <Input label="Kode Pos" {...register('kode_pos')} />
                </div>
              </div>
            )}

            {/* STEP 2: Pendidikan */}
            {currentStep === 2 && (
              <div className="transition-all duration-500 ease-in-out">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-100">
                  <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl font-bold">02</div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Data Pendidikan Asal</h3>
                    <p className="text-sm text-gray-500 mt-1">Masukkan riwayat pendidikan terakhir Anda sebelum mendaftar ke kampus ini.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-7">
                  <Input label="Nama Sekolah Asal" {...register('asal_sekolah')} error={errors.asal_sekolah?.message} required />
                  <Input label="Jurusan Sekolah" placeholder="Contoh: IPA / IPS / Teknik Komputer Jaringan" {...register('jurusan_sekolah')} error={errors.jurusan_sekolah?.message} required />
                  <Input label="NPSN Sekolah" placeholder="Bisa dicari di referensi data kemdikbud" {...register('npsn_sekolah')} />
                  <Input label="Tahun Lulus" type="number" placeholder="Contoh: 2024" {...register('tahun_lulus')} error={errors.tahun_lulus?.message} required />
                  <Input label="Nilai Rata-rata Rapor (Opsional)" type="number" step="0.01" placeholder="Contoh: 85.50" {...register('nilai_rata_rapor')} />
                </div>
              </div>
            )}

            {/* STEP 3: Data Orang Tua */}
            {currentStep === 3 && (
              <div className="transition-all duration-500 ease-in-out">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-100">
                  <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl font-bold">03</div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Data Orang Tua / Wali</h3>
                    <p className="text-sm text-gray-500 mt-1">Informasi ini dibutuhkan untuk keperluan pendataan profil mahasiswa.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-7">
                  <Input label="Nama Ayah" {...register('nama_ayah')} />
                  <Input label="Pekerjaan Ayah" {...register('pekerjaan_ayah')} />
                  <Input label="Nama Ibu" {...register('nama_ibu')} />
                  <Input label="Pekerjaan Ibu" {...register('pekerjaan_ibu')} />
                  <Controller
                    control={control}
                    name="penghasilan_ortu"
                    render={({ field }) => (
                      <Select 
                        label="Penghasilan Gabungan (Per Bulan)" 
                        options={[
                          { value: '< 1 Juta', label: '< Rp 1 Juta' }, 
                          { value: '1-3 Juta', label: 'Rp 1 - 3 Juta' }, 
                          { value: '3-5 Juta', label: 'Rp 3 - 5 Juta' }, 
                          { value: '5-10 Juta', label: 'Rp 5 - 10 Juta' }, 
                          { value: '> 10 Juta', label: '> Rp 10 Juta' }
                        ]} 
                        {...field} 
                      />
                    )}
                  />
                  <div className="col-span-1 md:col-span-2 mt-6 p-6 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-100 shadow-sm">
                    <p className="text-sm text-indigo-800 font-semibold mb-5 flex items-center gap-2">
                      <CheckCircle size={16} /> 
                      Khusus bagi Anda yang tinggal dengan wali, silakan lengkapi form berikut:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-7">
                      <Input label="Nama Wali" {...register('nama_wali')} />
                      <Input label="No Telepon Wali" {...register('telepon_wali')} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Program Studi */}
            {currentStep === 4 && (
              <div className="transition-all duration-500 ease-in-out">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-100">
                  <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl font-bold">04</div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Pilihan Program Studi</h3>
                    <p className="text-sm text-gray-500 mt-1">Tentukan pilihan program studi dan gelombang pendaftaran yang Anda inginkan.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-7">
                  <Controller
                    control={control}
                    name="gelombang_id"
                    render={({ field }) => (
                      <Select label="Gelombang Penerimaan" options={gelombangOptions} placeholder="Pilih Gelombang" {...field} error={errors.gelombang_id?.message} required />
                    )}
                  />
                  <div className="hidden md:block"></div>
                  <Controller
                    control={control}
                    name="program_studi_id"
                    render={({ field }) => (
                      <Select label="Pilihan Program Studi 1" options={prodiOptions} {...field} error={errors.program_studi_id?.message} required />
                    )}
                  />
                  <Controller
                    control={control}
                    name="program_studi_pilihan2_id"
                    render={({ field }) => (
                      <Select label="Pilihan Program Studi 2 (Cadangan)" options={prodiOptions} isClearable {...field} />
                    )}
                  />
                </div>
              </div>
            )}

            {/* STEP 5: Berkas */}
            {currentStep === 5 && (
              <div className="transition-all duration-500 ease-in-out">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                  <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl font-bold">05</div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Unggah Dokumen Persyaratan</h3>
                    <p className="text-sm text-gray-500 mt-1">Dokumen yang diunggah harus jelas dan dapat dibaca. Format yang didukung: PDF, JPG, PNG (Maksimal 5MB).</p>
                  </div>
                </div>
                
                <div className="space-y-5">
                  {[
                    { id: 'foto', title: 'Pas Foto Terbaru (Berwarna)', icon: '📸' },
                    { id: 'kk', title: 'Kartu Keluarga (KK)', icon: '👨‍👩‍👧‍👦' },
                    { id: 'ijazah', title: 'Ijazah / Surat Keterangan Lulus (SKL)', icon: '🎓' },
                  ].map((berkas) => (
                    <div key={berkas.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-gray-200 rounded-xl bg-gray-50/50 hover:bg-white hover:border-blue-300 hover:shadow-md transition-all duration-300 gap-4 group">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl transition-colors duration-300 ${uploadedFiles[berkas.id] ? 'bg-green-100 text-green-700' : 'bg-white text-gray-400 border border-gray-200 group-hover:border-blue-200 group-hover:text-blue-500 shadow-sm'}`}>
                          {uploadedFiles[berkas.id] ? <CheckCircle size={26} /> : <Upload size={26} />}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 mb-0.5 flex items-center gap-2">
                            {berkas.icon} {berkas.title} 
                            {(berkas.id === 'foto' || berkas.id === 'ijazah') && <span className="text-red-500 text-sm">*</span>}
                          </p>
                          <p className={`text-xs font-medium ${uploadedFiles[berkas.id] ? 'text-green-600' : 'text-gray-500'}`}>
                            {uploadedFiles[berkas.id] ? '✓ Berkas berhasil diunggah' : 'Belum ada dokumen yang diunggah'}
                          </p>
                        </div>
                      </div>
                      <div className="sm:ml-auto">
                        <input 
                          type="file" 
                          id={`file-${berkas.id}`} 
                          className="hidden" 
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload(e, berkas.id)}
                        />
                        <label htmlFor={`file-${berkas.id}`} className={`btn btn-sm px-6 font-semibold cursor-pointer w-full sm:w-auto ${uploadedFiles[berkas.id] ? 'btn-outline border-gray-300 text-gray-700 hover:bg-gray-100' : 'btn-primary'}`}>
                          {uploadedFiles[berkas.id] ? 'Ganti File' : 'Pilih File'}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between pt-8 border-t border-gray-100 mt-10 gap-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={prevStep}
                disabled={currentStep === 1 || isLoading}
                className="w-full sm:w-auto min-w-[140px] border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <ChevronLeft size={18} className="mr-1" /> Sebelumnya
              </Button>
              
              {currentStep < steps.length ? (
                <Button 
                  type="button" 
                  variant="primary" 
                  onClick={nextStep}
                  className="w-full sm:w-auto min-w-[140px] shadow-md shadow-blue-500/30"
                >
                  Selanjutnya <ChevronRight size={18} className="ml-1" />
                </Button>
              ) : (
                <div className="w-full sm:w-auto flex flex-col items-end gap-2">
                  <Button 
                    type="button" 
                    variant="primary" 
                    onClick={onSubmit}
                    loading={isLoading}
                    disabled={!uploadedFiles.foto || !uploadedFiles.ijazah}
                    className="w-full sm:w-auto shadow-md shadow-blue-500/30 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
                  >
                    <Save size={18} className="mr-2" /> Selesaikan Pendaftaran
                  </Button>
                  {(!uploadedFiles.foto || !uploadedFiles.ijazah) && (
                    <p className="text-xs font-semibold text-red-500 text-right bg-red-50 p-2 rounded-lg border border-red-100">
                      ⚠️ Anda wajib mengunggah Foto dan Ijazah.
                    </p>
                  )}
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
