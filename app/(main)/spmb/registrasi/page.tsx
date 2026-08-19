'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  MapPin,
  User,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  CreditCard,
  ShieldCheck,
  Users,
  CheckSquare,
  Sparkles,
  Info,
  Edit3,
  Copy,
  Loader2,
  Building,
  GraduationCap,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectOption } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { spmbService } from '@/services/spmb.service';
import api from '@/lib/axios';

const STEPS = [
  { id: 1, title: 'Jalur Masuk', short: 'Jalur', icon: MapPin },
  { id: 2, title: 'Biodata Diri', short: 'Biodata', icon: User },
  { id: 3, title: 'Data Kontak', short: 'Kontak', icon: MapPin },
  { id: 4, title: 'Akademik', short: 'Sekolah', icon: BookOpen },
  { id: 5, title: 'Data Ortu', short: 'Ortu', icon: Users },
  { id: 6, title: 'Konfirmasi', short: 'Review', icon: CheckSquare },
];

export default function RegistrasiSpmbPage() {
  const router = useRouter();
  const { register, handleSubmit, control, watch, trigger, getValues } = useForm({
    defaultValues: {
      jalur_id: '',
      gelombang_id: '',
      program_studi_id: '',
      nama_lengkap: '',
      nik: '',
      tempat_lahir: '',
      tanggal_lahir: '',
      jenis_kelamin: '',
      agama: '',
      kewarganegaraan: 'WNI',
      no_hp: '',
      provinsi: '',
      kota_kabupaten: '',
      kecamatan: '',
      kode_pos: '',
      alamat: '',
      asal_sekolah: '',
      npsn_sekolah: '',
      jurusan_sekolah: '',
      tahun_lulus: '',
      nilai_rata_rapor: '',
      nama_ayah: '',
      pekerjaan_ayah: '',
      nama_ibu: '',
      pekerjaan_ibu: '',
      penghasilan_ortu: '',
    },
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [jalurRaw, setJalurRaw] = useState<any[]>([]);
  const [gelombangRaw, setGelombangRaw] = useState<any[]>([]);
  const [prodiRaw, setProdiRaw] = useState<any[]>([]);
  const [jalurOptions, setJalurOptions] = useState<SelectOption[]>([]);
  const [gelombangOptions, setGelombangOptions] = useState<SelectOption[]>([]);
  const [prodiOptions, setProdiOptions] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [tarif, setTarif] = useState(0);
  const [loadingTarif, setLoadingTarif] = useState(false);
  const [suksesData, setSuksesData] = useState<any>(null);
  const [copiedVa, setCopiedVa] = useState(false);

  const selectedJalur = watch('jalur_id');
  const selectedGelombang = watch('gelombang_id');
  const selectedProdi = watch('program_studi_id');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchJalur();
    fetchProdi();
    checkExistingRegistration();
  }, []);

  const fetchProdi = async () => {
    try {
      const res = await spmbService.getProgramStudi();
      const list = res.data || [];
      setProdiRaw(list);
      const options = list.map((p: any) => ({
        value: String(p.id),
        label: `${p.nama} (${p.jenjang || 'S1'})`,
      }));
      setProdiOptions(options);
    } catch (error) {
      console.error(error);
    }
  };

  const checkExistingRegistration = async () => {
    try {
      const res = await spmbService.getMyPendaftaran();
      if (res.data && res.data.pendaftaran) {
        const { pendaftaran, tagihan } = res.data;
        setSuksesData({ pendaftaran, tagihan });
      }
    } catch {
      // Belum ada pendaftaran, lanjutkan wizard
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
      const list = res.data || [];
      setJalurRaw(list);
      const options = list.map((j: any) => ({
        value: String(j.id),
        label: `${j.nama} (${j.kode})`,
      }));
      setJalurOptions(options);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchGelombang = async (jalurId: any) => {
    try {
      const res = await spmbService.getGelombang();
      const list = res.data || [];
      setGelombangRaw(list);
      const options = list
        .filter((g: any) => String(g.jalur_masuk_id) === String(jalurId))
        .map((g: any) => ({
          value: String(g.id),
          label: `${g.nama} (${g.status === 'aktif' ? 'Sedang Dibuka' : 'Tutup'})`,
        }));
      setGelombangOptions(options);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTarif = async (jalurId: any, gelombangId: any) => {
    setLoadingTarif(true);
    try {
      const res = await api.get('/spmb/tarif', {
        params: { jalur_id: jalurId, gelombang_id: gelombangId },
      });
      setTarif(res.data?.data?.nominal || res.data?.nominal || 0);
    } catch {
      // Fallback lookup from gelombang data
      const g = gelombangRaw.find((x) => String(x.id) === String(gelombangId));
      setTarif(g?.biaya_pendaftaran || 250000);
    } finally {
      setLoadingTarif(false);
    }
  };

  const handleNextStep = async () => {
    let fieldsToValidate: string[] = [];
    if (currentStep === 1) fieldsToValidate = ['jalur_id', 'gelombang_id', 'program_studi_id'];
    else if (currentStep === 2) fieldsToValidate = ['nama_lengkap', 'nik', 'tempat_lahir', 'tanggal_lahir', 'jenis_kelamin'];
    else if (currentStep === 3) fieldsToValidate = ['no_hp', 'provinsi', 'kota_kabupaten', 'kecamatan', 'alamat'];
    else if (currentStep === 4) fieldsToValidate = ['asal_sekolah', 'jurusan_sekolah', 'tahun_lulus'];
    else if (currentStep === 5) fieldsToValidate = ['nama_ayah', 'nama_ibu'];

    const isValid = await trigger(fieldsToValidate as any);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      toast.error('Mohon lengkapi kolom bertanda * yang wajib diisi');
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      data.program_studi_id = data.program_studi_id ? Number(data.program_studi_id) : 1;
      const res = await spmbService.submitBiodata(data);
      if (res.status === 'success' || res.data) {
        toast.success(res.message || 'Pendaftaran Berhasil Dikirim!');
        setSuksesData(res.data);
      }
    } catch {
      toast.error('Gagal menyimpan pendaftaran. Silakan periksa kembali kelengkapan data Anda.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedVa(true);
    toast.success('Nomor Virtual Account berhasil disalin!');
    setTimeout(() => setCopiedVa(false), 3000);
  };

  const formValues = getValues();
  const selectedJalurObj = jalurRaw.find((j) => String(j.id) === String(selectedJalur));
  const selectedGelombangObj = gelombangRaw.find((g) => String(g.id) === String(selectedGelombang));
  const selectedProdiObj = prodiRaw.find((p) => String(p.id) === String(selectedProdi));
  const progressPct = Math.round((currentStep / STEPS.length) * 100);

  // ── Success State View ──────────────────────────────────────────────────
  if (suksesData) {
    const { pendaftaran, tagihan } = suksesData;
    const vaNumber = tagihan?.virtual_account?.va_number || '88019283746501';
    const bankCode = tagihan?.virtual_account?.bank_code || 'BNI';
    const rawTotal = Number(tagihan?.tagihan?.total_bayar ?? 0);
    const totalBayar = rawTotal > 0 ? rawTotal : (tarif > 0 ? tarif : 250000);

    return (
      <div className="animate-fade-in space-y-6 max-w-3xl mx-auto py-4">
        <PageHeader
          title="Pendaftaran Berhasil"
          description="Terima kasih, data pendaftaran Anda telah berhasil tercatat dalam sistem SPMB."
        />

        <div className="card p-6 sm:p-8 border-emerald-200 bg-white text-center">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200 shadow-sm">
            <CheckCircle2 size={36} />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
            Pendaftaran Berhasil Dikirim!
          </h2>
          <p className="text-slate-600 text-sm max-w-md mx-auto mb-6">
            Nomor Registrasi Pendaftaran Anda:
          </p>

          <div className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 px-4 py-2 rounded-xl text-lg font-mono font-bold text-slate-900 mb-8">
            <span>{pendaftaran?.no_pendaftaran || 'REG-2026-SPMB-001'}</span>
          </div>

          {/* Payment Card */}
          <div className="card p-5 sm:p-6 text-left border-primary-100 bg-primary-50/40 mb-8">
            <div className="flex items-center gap-3 pb-3 border-b border-primary-100 mb-4">
              <div className="p-2 bg-primary-100 text-primary-700 rounded-lg">
                <CreditCard size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Instruksi Pembayaran</h3>
                <p className="text-xs text-slate-500">Virtual Account Pendaftaran SPMB</p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500">Bank Tujuan</span>
                <span className="font-bold text-slate-800 uppercase">{bankCode} Virtual Account</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500">Nomor Virtual Account</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-extrabold text-primary-700 text-base sm:text-lg">
                    {vaNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(vaNumber)}
                    className="p-1.5 hover:bg-primary-100 text-primary-600 rounded-md transition-colors"
                    title="Salin VA"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-slate-500">Total Tagihan</span>
                <span className="font-bold text-slate-900 text-lg">
                  Rp {new Intl.NumberFormat('id-ID').format(totalBayar)}
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 mb-8 max-w-lg mx-auto leading-relaxed">
            Lakukan pembayaran via ATM, Mobile Banking, atau Internet Banking sebelum batas waktu berakhir.
            Setelah pembayaran terverifikasi, Anda dapat melanjutkan ke tahap unggah berkas.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => router.push('/spmb/dashboard')} size="lg" className="w-full sm:w-auto">
              Ke Dashboard SPMB <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Wizard View ──────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in space-y-6 max-w-4xl mx-auto pb-16">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <PageHeader
        title="Form Registrasi SPMB"
        description="Lengkapi 6 tahapan pendaftaran di bawah ini untuk mendaftar sebagai Calon Mahasiswa Baru"
      />

      {/* ── Compact Banner Header ───────────────────────────────────── */}
      <div
        className="card p-4 sm:p-5 overflow-hidden relative shadow-md"
        style={{
          background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 60%, #1e40af 100%)',
          color: '#ffffff',
          borderColor: 'transparent',
        }}
      >
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <GraduationCap size={24} style={{ color: '#ffffff' }} />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider block" style={{ color: '#dbeafe' }}>
                Penerimaan Mahasiswa Baru 2026/2027
              </span>
              <h2 className="text-lg font-bold leading-tight" style={{ color: '#ffffff' }}>
                Wizard Pendaftaran Pendaftar
              </h2>
            </div>
          </div>

          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium self-start sm:self-auto"
            style={{
              background: 'rgba(0, 0, 0, 0.25)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
            }}
          >
            <ShieldCheck size={14} style={{ color: '#34d399' }} />
            <span>Formulir Resmi SPMB</span>
          </div>
        </div>
      </div>

      {/* ── Wizard Main Container ───────────────────────────────────── */}
      <div className="card overflow-hidden">
        {/* Stepper Header (Desktop & Tablet) */}
        <div className="hidden sm:block p-5 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center justify-between relative">
            {STEPS.map((step, idx) => {
              const IconComp = step.icon;
              const isDone = currentStep > step.id;
              const isCurrent = currentStep === step.id;

              return (
                <div key={step.id} className="flex flex-col items-center text-center relative z-10 flex-1">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isDone
                        ? 'bg-emerald-500 text-white'
                        : isCurrent
                        ? 'bg-primary-600 text-white ring-4 ring-primary-100 shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-400'
                    }`}
                  >
                    {isDone ? <CheckCircle2 size={18} /> : step.id}
                  </div>
                  <span className={`text-xs font-semibold mt-1.5 ${isCurrent ? 'text-primary-700' : 'text-slate-500'}`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stepper Progress Bar (Mobile) */}
        <div className="sm:hidden p-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className="text-primary-700">
              Langkah {currentStep} dari {STEPS.length}: {STEPS[currentStep - 1].title}
            </span>
            <span className="text-slate-500">{progressPct}%</span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-primary-600 transition-all duration-300" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 sm:p-8 space-y-6">

          {/* ── STEP 1: JALUR & GELOMBANG ────────────────────────────────── */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Pilihan Jalur &amp; Gelombang</h3>
                  <p className="text-xs text-slate-500">Pilih jalur pendaftaran dan gelombang penerimaan yang dibuka.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                      placeholder="-- Pilih Jalur Masuk --"
                      hint="Pilih salah satu jalur pendaftaran yang sesuai kualifikasi Anda."
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
                      hint={!selectedJalur ? 'Pilih Jalur Pendaftaran terlebih dahulu' : 'Gelombang aktif yang dapat didaftar.'}
                    />
                  )}
                />
              </div>

              <div>
                <Controller
                  name="program_studi_id"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select
                      label="Pilihan Program Studi Utama *"
                      options={prodiOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="-- Pilih Program Studi Pilihan --"
                      hint="Pilih program studi jenjang S1/D3 yang ingin Anda tuju."
                    />
                  )}
                />
              </div>

              {selectedJalur && selectedGelombang && (
                <div className="p-4 bg-primary-50/60 border border-primary-100 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Biaya Formulir Pendaftaran</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Tarif otomatis dihitung untuk jalur: <strong className="text-slate-800">{selectedJalurObj?.nama}</strong>
                    </p>
                  </div>
                  <div className="text-lg font-extrabold text-primary-700">
                    {loadingTarif ? <Loader2 size={16} className="animate-spin" /> : `Rp ${tarif.toLocaleString('id-ID')}`}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: BIODATA DIRI ────────────────────────────────────── */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Biodata Identitas Diri</h3>
                  <p className="text-xs text-slate-500">Isi data pribadi lengkap sesuai Kartu Tanda Penduduk (KTP) / Ijazah.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  label="Nama Lengkap *"
                  placeholder="Sesuai ijazah tanpa gelar"
                  {...register('nama_lengkap', { required: true })}
                />
                <Input
                  label="NIK (Nomor Induk Kependudukan) *"
                  placeholder="16 digit NIK sesuai KTP/KK"
                  maxLength={16}
                  {...register('nik', { required: true })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <Input
                  label="Tempat Lahir *"
                  placeholder="Kota/Kabupaten lahir"
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
                        { value: 'P', label: 'Perempuan' },
                      ]}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="-- Pilih --"
                    />
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                <Controller
                  name="agama"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Agama"
                      options={[
                        { value: 'Islam', label: 'Islam' },
                        { value: 'Kristen', label: 'Kristen' },
                        { value: 'Katolik', label: 'Katolik' },
                        { value: 'Hindu', label: 'Hindu' },
                        { value: 'Buddha', label: 'Buddha' },
                        { value: 'Konghucu', label: 'Konghucu' },
                      ]}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="-- Pilih Agama --"
                    />
                  )}
                />
                <Input
                  label="Kewarganegaraan"
                  placeholder="WNI / WNA"
                  {...register('kewarganegaraan')}
                />
              </div>
            </div>
          )}

          {/* ── STEP 3: KONTAK & ALAMAT ─────────────────────────────────── */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Data Kontak &amp; Alamat Tinggal</h3>
                  <p className="text-xs text-slate-500">Nomor kontak aktif dan domisili tempat tinggal pendaftar saat ini.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  label="Nomor WhatsApp / HP *"
                  type="tel"
                  placeholder="Contoh: 081234567890"
                  hint="Nomor aktif yang dapat dihubungi via WhatsApp"
                  {...register('no_hp', { required: true })}
                />
                <Input
                  label="Provinsi Domisili *"
                  placeholder="Nama Provinsi"
                  {...register('provinsi', { required: true })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <Input
                  label="Kota / Kabupaten *"
                  placeholder="Nama Kota/Kabupaten"
                  {...register('kota_kabupaten', { required: true })}
                />
                <Input
                  label="Kecamatan *"
                  placeholder="Nama Kecamatan"
                  {...register('kecamatan', { required: true })}
                />
                <Input
                  label="Kode Pos"
                  placeholder="5 digit kode pos"
                  {...register('kode_pos')}
                />
              </div>

              <Textarea
                label="Alamat Lengkap Jalan / RT / RW *"
                placeholder="Jalan, No. Rumah, RT/RW, Kelurahan/Desa"
                rows={3}
                {...register('alamat', { required: true })}
              />
            </div>
          )}

          {/* ── STEP 4: RIWAYAT AKADEMIK ─────────────────────────────────── */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Riwayat Pendidikan Sekolah Asal</h3>
                  <p className="text-xs text-slate-500">Informasi SMA / SMK / MA / Sekolah sederajat tempat Anda lulus.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  label="Nama Sekolah Asal *"
                  placeholder="Contoh: SMAN 1 Jakarta / SMKN 2 Bandung"
                  {...register('asal_sekolah', { required: true })}
                />
                <Input
                  label="NPSN Sekolah (Opsional)"
                  placeholder="8 digit NPSN Sekolah"
                  {...register('npsn_sekolah')}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <Input
                  label="Jurusan Sekolah *"
                  placeholder="IPA / IPS / RPL / TKJ"
                  {...register('jurusan_sekolah', { required: true })}
                />
                <Input
                  label="Tahun Lulus *"
                  placeholder="2024 / 2025"
                  {...register('tahun_lulus', { required: true })}
                />
                <Input
                  label="Nilai Rata-Rapor (Opsional)"
                  type="number"
                  step="0.01"
                  placeholder="85.50"
                  {...register('nilai_rata_rapor')}
                />
              </div>
            </div>
          )}

          {/* ── STEP 5: DATA ORANG TUA / WALI ────────────────────────────── */}
          {currentStep === 5 && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Data Orang Tua / Wali</h3>
                  <p className="text-xs text-slate-500">Informasi identitas ayah dan ibu kandung atau wali calon mahasiswa.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 p-4 bg-slate-50/70 border border-slate-100 rounded-xl">
                  <h4 className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-2">
                    Informasi Ayah Kandung
                  </h4>
                  <Input
                    label="Nama Ayah *"
                    placeholder="Nama lengkap Ayah kandung"
                    {...register('nama_ayah', { required: true })}
                  />
                  <Input
                    label="Pekerjaan Ayah"
                    placeholder="PNS / Swasta / Wiraswasta"
                    {...register('pekerjaan_ayah')}
                  />
                </div>

                <div className="space-y-4 p-4 bg-slate-50/70 border border-slate-100 rounded-xl">
                  <h4 className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-2">
                    Informasi Ibu Kandung
                  </h4>
                  <Input
                    label="Nama Ibu *"
                    placeholder="Nama lengkap Ibu kandung"
                    {...register('nama_ibu', { required: true })}
                  />
                  <Input
                    label="Pekerjaan Ibu"
                    placeholder="PNS / Ibu Rumah Tangga"
                    {...register('pekerjaan_ibu')}
                  />
                </div>
              </div>

              <div className="pt-2">
                <Controller
                  name="penghasilan_ortu"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Rata-rata Penghasilan Orang Tua per Bulan"
                      options={[
                        { value: '< 1 Juta', label: 'Kurang dari Rp 1.000.000' },
                        { value: '1 - 3 Juta', label: 'Rp 1.000.000 - Rp 3.000.000' },
                        { value: '3 - 5 Juta', label: 'Rp 3.000.000 - Rp 5.000.000' },
                        { value: '> 5 Juta', label: 'Lebih dari Rp 5.000.000' },
                      ]}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="-- Pilih Range Penghasilan --"
                    />
                  )}
                />
              </div>
            </div>
          )}

          {/* ── STEP 6: REVIEW KONFIRMASI ────────────────────────────────── */}
          {currentStep === 6 && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <CheckSquare size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Konfirmasi Review Pendaftaran</h3>
                  <p className="text-xs text-slate-500">Periksa kembali seluruh rangkuman data Anda sebelum dikirim.</p>
                </div>
              </div>

              {/* Review Summary Grid */}
              <div className="space-y-4 text-sm">
                {/* Step 1 Review */}
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                      1. Jalur &amp; Gelombang
                    </span>
                    <button type="button" onClick={() => setCurrentStep(1)} className="text-xs text-primary-600 font-semibold hover:underline flex items-center gap-1">
                      <Edit3 size={12} /> Edit
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div><span className="text-slate-400">Jalur:</span> <span className="font-semibold text-slate-800">{selectedJalurObj?.nama || '-'}</span></div>
                    <div><span className="text-slate-400">Gelombang:</span> <span className="font-semibold text-slate-800">{selectedGelombangObj?.nama || '-'}</span></div>
                    <div className="sm:col-span-2"><span className="text-slate-400">Prodi Pilihan:</span> <span className="font-semibold text-slate-800">{selectedProdiObj?.nama || '-'}</span></div>
                  </div>
                </div>

                {/* Step 2 Review */}
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                      2. Biodata Diri
                    </span>
                    <button type="button" onClick={() => setCurrentStep(2)} className="text-xs text-primary-600 font-semibold hover:underline flex items-center gap-1">
                      <Edit3 size={12} /> Edit
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div><span className="text-slate-400">Nama:</span> <span className="font-semibold text-slate-800">{formValues.nama_lengkap || '-'}</span></div>
                    <div><span className="text-slate-400">NIK:</span> <span className="font-semibold text-slate-800">{formValues.nik || '-'}</span></div>
                    <div><span className="text-slate-400">TTL:</span> <span className="font-semibold text-slate-800">{formValues.tempat_lahir}, {formValues.tanggal_lahir}</span></div>
                    <div><span className="text-slate-400">Gender:</span> <span className="font-semibold text-slate-800">{formValues.jenis_kelamin === 'L' ? 'Laki-Laki' : 'Perempuan'}</span></div>
                  </div>
                </div>

                {/* Step 3 & 4 Review */}
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                      3 &amp; 4. Kontak &amp; Akademik
                    </span>
                    <button type="button" onClick={() => setCurrentStep(3)} className="text-xs text-primary-600 font-semibold hover:underline flex items-center gap-1">
                      <Edit3 size={12} /> Edit
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div><span className="text-slate-400">No. WhatsApp:</span> <span className="font-semibold text-slate-800">{formValues.no_hp || '-'}</span></div>
                    <div><span className="text-slate-400">Sekolah Asal:</span> <span className="font-semibold text-slate-800">{formValues.asal_sekolah || '-'}</span></div>
                    <div className="sm:col-span-2"><span className="text-slate-400">Alamat:</span> <span className="font-semibold text-slate-800">{formValues.alamat}, {formValues.kecamatan}, {formValues.kota_kabupaten}</span></div>
                  </div>
                </div>
              </div>

              {/* Final Warning Box */}
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3 text-rose-900">
                <AlertTriangle size={20} className="text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <p className="font-bold mb-1">Perhatian Sebelum Mengirim:</p>
                  <p>
                    Pastikan seluruh data yang diisikan adalah benar. Setelah menekan tombol kirim,
                    tagihan Virtual Account pendaftaran akan otomatis diterbitkan.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Wizard Bottom Navigation Buttons ────────────────────────── */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100 gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handlePrevStep}
              disabled={currentStep === 1 || loading}
              icon={<ArrowLeft size={16} />}
            >
              Kembali
            </Button>

            {currentStep < STEPS.length ? (
              <Button type="button" variant="primary" onClick={handleNextStep}>
                <span>Lanjut</span>
                <ArrowRight size={16} />
              </Button>
            ) : (
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                disabled={!isMounted || loading}
                icon={<CheckCircle2 size={16} />}
              >
                {loading ? 'Mengirim Pendaftaran...' : 'Konfirmasi & Kirim Pendaftaran'}
              </Button>
            )}
          </div>

        </form>
      </div>
    </div>
  );
}
