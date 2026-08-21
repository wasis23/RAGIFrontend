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
  ExternalLink,
  Clock,
  UploadCloud,
  FileCheck,
  Camera,
  FileText,
  Award,
  FileSpreadsheet,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select, SelectOption } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { spmbService, PendaftaranCalonMhs, PendaftaranBerkas } from '@/services/spmb.service';
import { useSpmbStore } from '@/store/spmbStore';
import { useUiStore } from '@/store/uiStore';
import api from '@/lib/axios';

import { XenditCheckoutModal } from '@/components/sikeu/payment-gateway/XenditCheckoutModal';

const spmbRegistrasiSchema = z.object({
  jalur_id: z.string().min(1, 'Jalur Pendaftaran wajib dipilih'),
  gelombang_id: z.string().min(1, 'Gelombang Penerimaan wajib dipilih'),
  program_studi_id: z.string().min(1, 'Program Studi Utama wajib dipilih'),
  program_studi_pilihan2_id: z.string().optional(),
  jenis_daftar: z.string().min(1, 'Jenis pendaftaran wajib dipilih'),
  kelas: z.string().min(1, 'Kelas wajib dipilih'),
  info_daftar: z.string().min(1, 'Info pendaftaran wajib dipilih'),
  ket_info_daftar: z.string().min(1, 'Keterangan info pendaftaran wajib diisi'),
  
  nama_lengkap: z.string().min(3, 'Nama lengkap minimal 3 karakter'),
  nik: z.string().regex(/^[0-9]{16}$/, 'NIK wajib 16 digit angka'),
  tempat_lahir: z.string().min(2, 'Tempat lahir wajib diisi'),
  tanggal_lahir: z.string().min(1, 'Tanggal lahir wajib diisi'),
  jenis_kelamin: z.string().min(1, 'Jenis kelamin wajib dipilih'),
  status_sipil: z.string().min(1, 'Status sipil wajib dipilih'),
  agama: z.string().optional(),
  kewarganegaraan: z.string().optional(),
  
  provinsi: z.string().min(2, 'Provinsi domisili wajib diisi'),
  kota_kabupaten: z.string().min(2, 'Kota/Kabupaten wajib diisi'),
  kecamatan: z.string().min(2, 'Kecamatan wajib diisi'),
  kode_pos: z.string().optional(),
  alamat: z.string().min(5, 'Alamat rumah lengkap minimal 5 karakter'),
  
  asal_lulusan: z.string().min(1, 'Asal lulusan wajib dipilih'),
  asal_sekolah: z.string().optional(),
  alamat_sekolah: z.string().optional(),
  npsn_sekolah: z.string().optional(),
  jurusan_sekolah: z.string().optional(),
  tahun_lulus: z.string().optional(),
  nilai_rata_rapor: z.string().optional(),

  asal_pt: z.string().optional(),
  jenis_pt: z.string().optional(),
  alamat_pt: z.string().optional(),
  jenjang_pt: z.string().optional(),
  progdi_pt: z.string().optional(),
  ipk_pt: z.string().optional(),
  nim_pt: z.string().optional(),
  tahun_lulus_pt: z.string().optional(),
  
  nama_ortu: z.string().min(2, 'Nama orang tua wajib diisi'),
  alamat_ortu: z.string().min(5, 'Alamat orang tua wajib diisi'),
  telp_ortu: z.string().min(10, 'Nomor HP orang tua minimal 10 digit').regex(/^[0-9\-\+\s]+$/, 'Format nomor HP orang tua tidak valid'),
  nama_ayah: z.string().min(2, 'Nama ayah kandung wajib diisi'),
  pekerjaan_ayah: z.string().optional(),
  nama_ibu: z.string().min(2, 'Nama ibu kandung wajib diisi'),
  pekerjaan_ibu: z.string().optional(),
  penghasilan_ortu: z.string().optional(),
  nama_wali: z.string().optional(),
  telepon_wali: z.string().optional(),
});

type SpmbFormValues = z.infer<typeof spmbRegistrasiSchema>;

const STEPS = [
  { id: 1, title: 'Jalur Masuk', short: 'Jalur', icon: MapPin },
  { id: 2, title: 'Biodata Diri', short: 'Biodata', icon: User },
  { id: 3, title: 'Data Kontak', short: 'Kontak', icon: MapPin },
  { id: 4, title: 'Akademik', short: 'Sekolah', icon: BookOpen },
  { id: 5, title: 'Data Ortu', short: 'Ortu', icon: Users },
  { id: 6, title: 'Unggah Berkas', short: 'Berkas', icon: UploadCloud },
  { id: 7, title: 'Konfirmasi', short: 'Review', icon: CheckSquare },
];

interface DokumenItemConfig {
  key: string;
  label: string;
  required: boolean;
  hint: string;
  icon: any;
}

const REQUIRED_DOCUMENTS: DokumenItemConfig[] = [
  { key: 'pas_foto', label: 'Pas Foto Resmi (3x4)', required: true, hint: 'Format PDF/JPG/PNG, latar merah/biru, maks 5MB', icon: Camera },
  { key: 'ktp', label: 'KTP / Kartu Identitas / Kartu Pelajar', required: true, hint: 'Format PDF/JPG/PNG, NIK terlihat jelas', icon: CreditCard },
  { key: 'kk', label: 'Kartu Keluarga (KK)', required: true, hint: 'Format PDF/JPG/PNG, lembar KK asli/legalisir', icon: FileText },
  { key: 'ijazah', label: 'Ijazah / Surat Keterangan Lulus (SKL)', required: true, hint: 'Format PDF/JPG/PNG, lembar nilai & stempel', icon: Award },
  { key: 'rapor', label: 'Transkrip Nilai / Rapor Semester 1-5', required: false, hint: 'Format PDF/JPG/PNG, gabungan halaman nilai rapor', icon: FileSpreadsheet },
];

function DokumenUploadPanel({
  uploadedBerkas = {},
  onUpload,
  uploadingState = {}
}: {
  uploadedBerkas?: Record<string, any>;
  onUpload: (jenisBerkas: string, file: File) => void;
  uploadingState?: Record<string, boolean>;
}) {
  const safeUploaded = uploadedBerkas || {};
  const safeUploading = uploadingState || {};

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0 shadow-xs">
          <UploadCloud size={22} />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-base">Unggah Berkas &amp; Dokumen Pendaftaran</h3>
          <p className="text-xs text-slate-500">Unggah dokumen kelengkapan berkas pendaftaran calon mahasiswa (Format: PDF, JPG, PNG, Maks 5MB per file).</p>
        </div>
      </div>

      {/* Vertical Single-Column List (Ke bawah) */}
      <div className="space-y-3 pt-1">
        {REQUIRED_DOCUMENTS.map((doc) => {
          const IconComp = doc.icon;
          const berkas = safeUploaded[doc.key];
          const isUploading = Boolean(safeUploading[doc.key]);
          const isUploaded = Boolean(berkas?.file_path || berkas?.file_url);

          return (
            <div
              key={doc.key}
              className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isUploaded
                  ? 'bg-emerald-50/40 border-emerald-200/90 hover:border-emerald-300'
                  : 'bg-slate-50/70 border-slate-200/90 hover:border-primary-300'
              }`}
            >
              {/* Document Info Left */}
              <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isUploaded ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200/80 text-slate-600'
                }`}>
                  <IconComp size={20} />
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                      {doc.label}
                    </h4>
                    {doc.required ? (
                      <span className="text-2xs font-extrabold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                        Wajib
                      </span>
                    ) : (
                      <span className="text-2xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                        Opsional
                      </span>
                    )}
                    {isUploaded ? (
                      <span className="text-2xs font-extrabold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                        ✓ Terunggah
                      </span>
                    ) : (
                      <span className="text-2xs font-semibold text-slate-500 bg-slate-200/70 px-2.5 py-0.5 rounded-full">
                        Belum Diunggah
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium">{doc.hint}</p>
                </div>
              </div>

              {/* Document Action Right */}
              <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                {isUploaded && (
                  <a
                    href={berkas.file_url || (berkas.file_path ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/storage/${berkas.file_path.replace(/^public\//, '')}` : '#')}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-white border border-emerald-200 px-3 py-2 rounded-xl shadow-2xs transition-colors"
                  >
                    <FileCheck size={15} /> Lihat File
                  </a>
                )}

                <label className={`inline-flex items-center gap-1.5 cursor-pointer px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                  isUploading
                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                    : isUploaded
                    ? 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}>
                  {isUploading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Mengunggah...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={15} />
                      <span>{isUploaded ? 'Ganti File' : 'Unggah File'}</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    disabled={isUploading}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        onUpload(doc.key, file);
                      }
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function RegistrasiSpmbPage() {
  const router = useRouter();
  const { register, handleSubmit, control, watch, trigger, getValues, setValue, formState: { errors } } = useForm<SpmbFormValues>({
    resolver: zodResolver(spmbRegistrasiSchema),
    defaultValues: {
      jalur_id: '',
      gelombang_id: '',
      program_studi_id: '',
      jenis_daftar: '',
      kelas: '',
      info_daftar: '',
      ket_info_daftar: '',
      nama_lengkap: '',
      nik: '',
      tempat_lahir: '',
      tanggal_lahir: '',
      jenis_kelamin: '',
      status_sipil: '',
      agama: '',
      kewarganegaraan: 'WNI',
      provinsi: '',
      kota_kabupaten: '',
      kecamatan: '',
      kode_pos: '',
      alamat: '',
      asal_lulusan: 'sekolah',
      asal_sekolah: '',
      alamat_sekolah: '',
      npsn_sekolah: '',
      jurusan_sekolah: '',
      tahun_lulus: '',
      nilai_rata_rapor: '',
      asal_pt: '',
      jenis_pt: 'non-komputer',
      alamat_pt: '',
      jenjang_pt: '',
      progdi_pt: '',
      ipk_pt: '',
      nim_pt: '',
      tahun_lulus_pt: '',
      nama_ortu: '',
      alamat_ortu: '',
      telp_ortu: '',
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
  const [isEditingBiodata, setIsEditingBiodata] = useState(false);
  const [copiedVa, setCopiedVa] = useState(false);
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(true);
  const [loadingSimulasi, setLoadingSimulasi] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const selectedJalur = watch('jalur_id');
  const selectedGelombang = watch('gelombang_id');
  const selectedProdi = watch('program_studi_id');
  const { activeGelombang, fetchActiveGelombang } = useSpmbStore();
  const { module_color: moduleColor, fetchModuleColor } = useUiStore();

  useEffect(() => {
    setIsMounted(true);
    fetchJalur();
    fetchProdi();
    checkExistingRegistration();
    const currentModuleCode = window.location.pathname.split('/')[1] || '';
    fetchModuleColor(currentModuleCode);
    fetchActiveGelombang().then((active) => {
      if (active) {
        setValue('gelombang_id', String(active.id));
        setValue('jalur_id', String(active.jalur_masuk_id || '1'));
        fetchGelombang(active.jalur_masuk_id || 1);
        fetchTarif(active.jalur_masuk_id || 1, active.id);
      }
    });
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
    setIsCheckingRegistration(true);
    try {
      const res = await spmbService.getMyPendaftaran();
      if (res.data && res.data.pendaftaran) {
        const { pendaftaran, tagihan } = res.data;
        const p = pendaftaran;
        if (p.gelombang_penerimaan?.jalur_masuk_id) setValue('jalur_id', String(p.gelombang_penerimaan.jalur_masuk_id));
        if (p.gelombang_id) setValue('gelombang_id', String(p.gelombang_id));
        if (p.program_studi_id) setValue('program_studi_id', String(p.program_studi_id));
        if (p.program_studi_pilihan2_id) setValue('program_studi_pilihan2_id', String(p.program_studi_pilihan2_id));
        if (p.nama_lengkap) setValue('nama_lengkap', p.nama_lengkap);
        if (p.nik) setValue('nik', p.nik);
        if (p.tanggal_lahir) setValue('tanggal_lahir', p.tanggal_lahir.split('T')[0]);
        if (p.tempat_lahir) setValue('tempat_lahir', p.tempat_lahir);
        if (p.jenis_kelamin) setValue('jenis_kelamin', p.jenis_kelamin);
        if (p.agama) setValue('agama', p.agama);
        if (p.kewarganegaraan) setValue('kewarganegaraan', p.kewarganegaraan);
        if (p.alamat) setValue('alamat', p.alamat);
        if (p.provinsi) setValue('provinsi', p.provinsi);
        if (p.kota_kabupaten) setValue('kota_kabupaten', p.kota_kabupaten);
        if (p.kecamatan) setValue('kecamatan', p.kecamatan);
        if (p.kode_pos) setValue('kode_pos', p.kode_pos);
        if (p.asal_lulusan) setValue('asal_lulusan', p.asal_lulusan);
        if (p.asal_sekolah) setValue('asal_sekolah', p.asal_sekolah);
        if (p.jurusan_sekolah) setValue('jurusan_sekolah', p.jurusan_sekolah);
        if (p.npsn_sekolah) setValue('npsn_sekolah', p.npsn_sekolah);
        if (p.tahun_lulus) setValue('tahun_lulus', p.tahun_lulus);
        if (p.nilai_rata_rapor) setValue('nilai_rata_rapor', String(p.nilai_rata_rapor));
        if (p.asal_pt) setValue('asal_pt', p.asal_pt);
        if (p.jenis_pt) setValue('jenis_pt', p.jenis_pt);
        if (p.alamat_pt) setValue('alamat_pt', p.alamat_pt);
        if (p.jenjang_pt) setValue('jenjang_pt', p.jenjang_pt);
        if (p.progdi_pt) setValue('progdi_pt', p.progdi_pt);
        if (p.ipk_pt) setValue('ipk_pt', p.ipk_pt);
        if (p.nim_pt) setValue('nim_pt', p.nim_pt);
        if (p.tahun_lulus_pt) setValue('tahun_lulus_pt', p.tahun_lulus_pt);
        if (p.nama_ayah) setValue('nama_ayah', p.nama_ayah);
        if (p.pekerjaan_ayah) setValue('pekerjaan_ayah', p.pekerjaan_ayah);
        if (p.nama_ibu) setValue('nama_ibu', p.nama_ibu);
        if (p.pekerjaan_ibu) setValue('pekerjaan_ibu', p.pekerjaan_ibu);
        if (p.penghasilan_ortu) setValue('penghasilan_ortu', p.penghasilan_ortu);
        if (p.nama_wali) setValue('nama_wali', p.nama_wali);
        if (p.telepon_wali) setValue('telepon_wali', p.telepon_wali);

        if (p.dokumen_pendaftaran && Array.isArray(p.dokumen_pendaftaran)) {
          const berkasMap: Record<string, any> = {};
          p.dokumen_pendaftaran.forEach((b: any) => {
            const fileUrl = b.file_url || (b.file_path ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/storage/${b.file_path.replace(/^public\//, '')}` : '');
            berkasMap[b.jenis_berkas] = {
              id: b.id,
              file_path: b.file_path,
              file_url: fileUrl,
              is_verified: b.is_verified,
            };
          });
          setUploadedBerkas(berkasMap);
        }

        setSuksesData({ pendaftaran, tagihan });
      }
    } catch {
      // Belum ada pendaftaran, lanjutkan wizard
    } finally {
      setIsCheckingRegistration(false);
    }
  };

  const [suksesData, setSuksesData] = useState<any>(null);
  const [uploadingState, setUploadingState] = useState<Record<string, boolean>>({});
  const [uploadedBerkas, setUploadedBerkas] = useState<Record<string, any>>({});

  const handleFileUpload = async (jenisBerkas: string, file: File) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('jenis_berkas', jenisBerkas);

    setUploadingState((prev) => ({ ...prev, [jenisBerkas]: true }));
    try {
      const res = await spmbService.uploadBerkas(formData);
      toast.success(`Dokumen ${jenisBerkas.toUpperCase()} berhasil diunggah!`);
      if (res.data) {
        setUploadedBerkas((prev) => ({
          ...prev,
          [jenisBerkas]: res.data,
        }));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengunggah dokumen');
    } finally {
      setUploadingState((prev) => ({ ...prev, [jenisBerkas]: false }));
    }
  };

  const handleStartEditBiodata = () => {
    if (suksesData?.pendaftaran) {
      const p = suksesData.pendaftaran;
      setValue('jalur_id', String(p.gelombang_penerimaan?.jalur_masuk_id || '1'));
      setValue('gelombang_id', String(p.gelombang_id || '1'));
      setValue('program_studi_id', String(p.program_studi_id || '1'));
      if (p.program_studi_pilihan2_id) {
        setValue('program_studi_pilihan2_id', String(p.program_studi_pilihan2_id));
      }
      setValue('nama_lengkap', p.nama_lengkap || '');
      setValue('nik', p.nik || '');
      if (p.tanggal_lahir) {
        setValue('tanggal_lahir', p.tanggal_lahir.split('T')[0]);
      }
      setValue('tempat_lahir', p.tempat_lahir || '');
      setValue('jenis_kelamin', p.jenis_kelamin || 'L');
      setValue('agama', p.agama || '');
      setValue('kewarganegaraan', p.kewarganegaraan || 'WNI');
      setValue('alamat', p.alamat || '');
      setValue('provinsi', p.provinsi || '');
      setValue('kota_kabupaten', p.kota_kabupaten || '');
      setValue('kecamatan', p.kecamatan || '');
      setValue('kode_pos', p.kode_pos || '');
      setValue('asal_lulusan', p.asal_lulusan || 'sekolah');
      setValue('asal_sekolah', p.asal_sekolah || '');
      setValue('jurusan_sekolah', p.jurusan_sekolah || '');
      setValue('npsn_sekolah', p.npsn_sekolah || '');
      setValue('tahun_lulus', p.tahun_lulus || '');
      setValue('nilai_rata_rapor', p.nilai_rata_rapor ? String(p.nilai_rata_rapor) : '');
      setValue('asal_pt', p.asal_pt || '');
      setValue('jenis_pt', p.jenis_pt || 'non-komputer');
      setValue('alamat_pt', p.alamat_pt || '');
      setValue('jenjang_pt', p.jenjang_pt || '');
      setValue('progdi_pt', p.progdi_pt || '');
      setValue('ipk_pt', p.ipk_pt || '');
      setValue('nim_pt', p.nim_pt || '');
      setValue('tahun_lulus_pt', p.tahun_lulus_pt || '');
      setValue('nama_ayah', p.nama_ayah || '');
      setValue('pekerjaan_ayah', p.pekerjaan_ayah || '');
      setValue('nama_ibu', p.nama_ibu || '');
      setValue('pekerjaan_ibu', p.pekerjaan_ibu || '');
      setValue('penghasilan_ortu', p.penghasilan_ortu || '');
      setValue('nama_wali', p.nama_wali || '');
      setValue('telepon_wali', p.telepon_wali || '');

      setIsEditingBiodata(true);
      setCurrentStep(1);
    }
  };

  useEffect(() => {
    if (!suksesData) return;
    const isLunas = suksesData.pendaftaran?.status_pembayaran === 'lunas' || suksesData.tagihan?.tagihan?.status === 'lunas';
    if (isLunas) return;

    // Auto-polling payment status every 3 seconds
    const interval = setInterval(async () => {
      try {
        const res = await spmbService.getMyPendaftaran();
        if (res.data && res.data.pendaftaran) {
          const { pendaftaran, tagihan } = res.data;
          const checkLunas = pendaftaran?.status_pembayaran === 'lunas' || tagihan?.tagihan?.status === 'lunas';
          if (checkLunas) {
            setSuksesData({ pendaftaran, tagihan });
            toast.success('🎉 Pembayaran Berhasil Terverifikasi Real-Time! Status Anda telah otomatis diperbarui.');
            clearInterval(interval);
          }
        }
      } catch {
        // Silent polling error handling
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [suksesData]);

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
      setTarif(Number(g?.biaya_pendaftaran || 0));
    } finally {
      setLoadingTarif(false);
    }
  };

  const [savingStepLoading, setSavingStepLoading] = useState(false);

  const handleNextStep = async () => {
    let fieldsToValidate: string[] = [];
    if (currentStep === 1) fieldsToValidate = ['jalur_id', 'gelombang_id', 'program_studi_id', 'jenis_daftar', 'kelas'];
    else if (currentStep === 2) fieldsToValidate = ['nama_lengkap', 'nik', 'tempat_lahir', 'tanggal_lahir', 'jenis_kelamin', 'status_sipil'];
    else if (currentStep === 3) fieldsToValidate = ['no_hp', 'provinsi', 'kota_kabupaten', 'kecamatan', 'alamat'];
    else if (currentStep === 4) fieldsToValidate = ['asal_sekolah', 'alamat_sekolah', 'jurusan_sekolah', 'tahun_lulus'];
    else if (currentStep === 5) fieldsToValidate = ['nama_ayah', 'nama_ibu', 'nama_ortu', 'alamat_ortu', 'telp_ortu', 'info_daftar', 'ket_info_daftar'];
    else if (currentStep === 6) fieldsToValidate = [];

    const isValid = await trigger(fieldsToValidate as any);
    if (isValid) {
      // Auto-save step data to backend immediately
      setSavingStepLoading(true);
      try {
        const rawValues = getValues();
        const payload: any = {
          ...rawValues,
          program_studi_id: rawValues.program_studi_id ? Number(rawValues.program_studi_id) : 1,
          gelombang_id: rawValues.gelombang_id ? Number(rawValues.gelombang_id) : 1,
        };
        if (rawValues.program_studi_pilihan2_id) {
          payload.program_studi_pilihan2_id = Number(rawValues.program_studi_pilihan2_id);
        }
        await spmbService.submitBiodata(payload);
        toast.success(`Draft Langkah ${currentStep} tersimpan`, { duration: 1500 });
      } catch (err) {
        console.warn('Auto-save step warning:', err);
      } finally {
        setSavingStepLoading(false);
      }

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

  const mixLight = (base: string, pct: number) => `color-mix(in srgb, ${base} ${pct}%, white)`;
  const mixDark = (base: string, pct: number) => `color-mix(in srgb, ${base} ${pct}%, black)`;

  const dynamicStyles = moduleColor
    ? ({
        '--primary-50': mixLight(moduleColor, 10),
        '--primary-100': mixLight(moduleColor, 20),
        '--primary-200': mixLight(moduleColor, 40),
        '--primary-300': mixLight(moduleColor, 60),
        '--primary-400': mixLight(moduleColor, 80),
        '--primary-500': moduleColor,
        '--primary-600': mixDark(moduleColor, 80),
        '--primary-700': mixDark(moduleColor, 60),
        '--primary-800': mixDark(moduleColor, 40),
        '--primary-900': mixDark(moduleColor, 20),
        
        '--color-primary-50': mixLight(moduleColor, 10),
        '--color-primary-100': mixLight(moduleColor, 20),
        '--color-primary-200': mixLight(moduleColor, 40),
        '--color-primary-300': mixLight(moduleColor, 60),
        '--color-primary-400': mixLight(moduleColor, 80),
        '--color-primary-500': moduleColor,
        '--color-primary-600': mixDark(moduleColor, 80),
        '--color-primary-700': mixDark(moduleColor, 60),
        '--color-primary-800': mixDark(moduleColor, 40),
        '--color-primary-900': mixDark(moduleColor, 20),
      } as React.CSSProperties)
    : {};

  // ── Initial Check Loading State ──────────────────────────────────────────
  if (isCheckingRegistration) {
    return (
      <div className="animate-fade-in space-y-6 max-w-2xl mx-auto py-16 text-center" style={dynamicStyles}>
        <div className="p-8 bg-white border border-slate-200/80 rounded-2xl shadow-sm space-y-4 flex flex-col items-center justify-center">
          <Loader2 size={36} className="animate-spin text-primary-600 mb-1" />
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 text-base">Memeriksa Status Pendaftaran...</h3>
            <p className="text-xs text-slate-500">Mohon tunggu sebentar, kami sedang memuat data Anda.</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Success State View ──────────────────────────────────────────────────
  if (suksesData && !isEditingBiodata) {
    const { pendaftaran, tagihan } = suksesData || {};
    const vaObj = tagihan?.virtual_account || tagihan?.tagihan?.virtual_account || suksesData?.virtual_account;
    const vaNumber = vaObj?.va_number || '';
    const rawBank = vaObj?.bank_kode || vaObj?.bank_code || vaObj?.bank_nama || '';
    const bankCode = rawBank ? rawBank.replace(/^Bank\s+/i, '').trim().toUpperCase() : '';
    const rawTotal = Number(tagihan?.tagihan?.total_bayar ?? tagihan?.total_bayar ?? 0);
    const totalBayar = rawTotal > 0 ? rawTotal : (tarif > 0 ? tarif : 250000);

    return (
      <div className="animate-fade-in space-y-6 max-w-3xl mx-auto py-4" style={dynamicStyles}>
        <PageHeader
          title="Pendaftaran Berhasil"
          description="Terima kasih, data pendaftaran Anda telah berhasil tercatat dalam sistem SPMB."
        />

        <div className="card p-6 sm:p-8 border border-slate-200/80 bg-white text-center shadow-md rounded-2xl">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-sm">
            <CheckCircle2 size={36} />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1">
            Pendaftaran Berhasil Dikirim!
          </h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-5">
            Nomor Registrasi Pendaftaran Anda:
          </p>

          <div className="inline-flex items-center gap-3 bg-slate-50 border border-slate-200/90 px-4 py-2 rounded-xl text-base sm:text-lg font-mono font-bold text-slate-900 mb-8 shadow-inner">
            <span>{pendaftaran?.no_pendaftaran || 'REG-2026-SPMB-001'}</span>
            <button
              type="button"
              onClick={() => copyToClipboard(pendaftaran?.no_pendaftaran || '')}
              className="text-xs text-primary-600 font-semibold hover:underline flex items-center gap-1 border-l border-slate-200 pl-2"
            >
              <Copy size={14} /> Salin
            </button>
          </div>

          {/* ── UNGGAH BERKAS / DOKUMEN PENDAFTARAN (DI ATAS RINCIAN PEMBAYARAN) ── */}
          <div className="card p-5 sm:p-6 bg-white border border-slate-200/90 rounded-2xl shadow-2xs mb-6 text-left">
            <DokumenUploadPanel
              uploadedBerkas={uploadedBerkas}
              onUpload={handleFileUpload}
              uploadingState={uploadingState}
                 />
               </div>


          {/* Payment Card (Production Ready & Premium) */}
          <div className="card p-5 sm:p-7 text-left border-primary-200/80 bg-gradient-to-b from-primary-50/50 via-white to-white mb-6 shadow-sm rounded-2xl">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-5">
              <div className="p-2.5 bg-primary-600 text-white rounded-xl shadow-sm">
                <CreditCard size={22} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Instruksi &amp; Rincian Pembayaran</h3>
                <p className="text-xs text-slate-500">Virtual Account Pendaftaran SPMB Kampus</p>
              </div>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-slate-100 gap-1">
                <span className="text-slate-500 font-medium">Bank Tujuan</span>
                <span className="font-extrabold text-slate-800 uppercase tracking-wide bg-slate-100 px-3 py-1 rounded-lg border border-slate-200/60 text-xs sm:text-sm self-start sm:self-auto">
                  {bankCode ? `${bankCode} VIRTUAL ACCOUNT` : 'VIRTUAL ACCOUNT'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-slate-100 gap-2">
                <span className="text-slate-500 font-medium">Nomor Virtual Account</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-primary-700 text-xl sm:text-2xl tracking-wider">
                    {vaNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(vaNumber)}
                    className="inline-flex items-center gap-1.5 bg-primary-50 border border-primary-200 hover:bg-primary-100 text-primary-700 font-bold px-2.5 py-1.5 rounded-lg text-xs transition-colors shadow-sm"
                    title="Salin Nomor VA"
                  >
                    <Copy size={14} />
                    <span>Salin</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-slate-100 gap-1">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Clock size={15} className="text-amber-600" /> Batas Waktu Pembayaran (VA Active)
                </span>
                <span className="font-bold text-amber-900 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200/80 text-xs sm:text-sm self-start sm:self-auto">
                  {(() => {
                    const vaObj = suksesData?.tagihan?.virtual_account || suksesData?.virtual_account;
                    const rawExp = vaObj?.expired_at || suksesData?.tagihan?.tagihan?.jatuh_tempo || suksesData?.tagihan?.jatuh_tempo;
                    if (!rawExp) return '30 Hari Sejak Diterbitkan';
                    return new Date(rawExp).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }) + ' WIB';
                  })()}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 gap-1">
                <span className="text-slate-500 font-medium">Total Tagihan</span>
                <span className="font-black text-slate-900 text-xl sm:text-2xl text-primary-900">
                  Rp {new Intl.NumberFormat('id-ID').format(totalBayar)}
                </span>
              </div>
            </div>
          </div>

          {/* ── 3. STATUS PEMBAYARAN (DI PALING BAWAH) ── */}
          <div className="card p-5 sm:p-6 bg-white border border-slate-200/90 rounded-2xl shadow-2xs mb-6 text-left space-y-4">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Status Pembayaran Tagihan</h4>
                  <p className="text-2xs text-slate-500">Status verifikasi real-time dari sistem keuangan SIKEU</p>
                </div>
              </div>

              <div>
                {pendaftaran?.status_pembayaran === 'lunas' ? (
                  <span className="badge badge-green text-xs font-extrabold px-3 py-1">
                    ✓ LUNAS
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold px-3 py-1 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    Menunggu Pembayaran
                  </span>
                )}
              </div>
            </div>

            {pendaftaran?.status_pembayaran === 'lunas' ? (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-bold">
                <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
                <span>Pembayaran Berhasil Dilunasi &amp; Terverifikasi oleh SIKEU!</span>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <p className="text-xs text-slate-500">
                  Belum menyelesaikan pembayaran? Anda dapat menerbitkan ulang Virtual Account jika kode VA kadaluarsa.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  isLoading={loadingReset}
                  onClick={async () => {
                    setLoadingReset(true);
                    try {
                      const res = await spmbService.reissueVa();
                      toast.success('Nomor Virtual Account berhasil diperbarui!');
                      if (res.data) {
                        setSuksesData(res.data);
                      }
                    } catch (err: any) {
                      toast.error(err.response?.data?.message || 'Gagal memperbarui nomor Virtual Account');
                    } finally {
                      setLoadingReset(false);
                    }
                  }}
                  className="w-full sm:w-auto bg-white border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold shrink-0"
                >
                  🔄 Terbitkan Ulang VA
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button 
              type="button" 
              variant="outline" 
              size="lg" 
              onClick={handleStartEditBiodata} 
              className="w-full sm:w-auto font-bold border-slate-300 text-slate-700 hover:bg-slate-50 min-h-[46px]"
              icon={<Edit3 size={16} />}
            >
              Edit / Perbarui Biodata
            </Button>
            <Button onClick={() => router.push('/spmb/dashboard')} size="lg" className="w-full sm:w-auto min-h-[46px] font-extrabold">
              Ke Dashboard SPMB <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Wizard View ──────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in space-y-6 max-w-4xl mx-auto pb-16" style={dynamicStyles}>
      {/* ── Page Header ────────────────────────────────────────────── */}
      <PageHeader
        title="Form Registrasi SPMB"
        description="Lengkapi 6 tahapan pendaftaran di bawah ini untuk mendaftar sebagai Calon Mahasiswa Baru"
      />

      {isEditingBiodata && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-amber-900 text-sm font-bold shadow-2xs animate-fade-in">
          <div className="flex items-center gap-2">
            <Edit3 size={18} className="text-amber-600 shrink-0" />
            <span>Mode Edit / Perbarui Biodata Pendaftaran</span>
          </div>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsEditingBiodata(false)}
            className="text-amber-800 hover:bg-amber-100 text-xs font-bold shrink-0"
          >
            Batal Edit / Kembali
          </Button>
        </div>
      )}

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
                  render={({ field }) => (
                    <Select
                      label="Jalur Pendaftaran *"
                      options={jalurOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="-- Pilih Jalur Masuk --"
                      error={errors.jalur_id?.message}
                      hint="Pilih salah satu jalur pendaftaran yang sesuai kualifikasi Anda."
                    />
                  )}
                />

                {/* Gelombang Penerimaan (Terikat permanen pada pendaftaran calon mahasiswa) */}
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-700 mb-1">
                    Gelombang Penerimaan <span className="text-slate-400 font-normal">(Terikat Permanen Pada Pendaftaran)</span>
                  </label>
                  <div className="p-3 bg-gradient-to-br from-primary-50/80 via-white to-primary-50/40 border border-primary-200 rounded-lg flex items-center justify-between gap-3 shadow-2xs h-[42px]">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-primary-600 shrink-0" />
                      <span className="text-xs font-black text-slate-900">
                        {suksesData?.pendaftaran?.gelombang_penerimaan?.nama || activeGelombang?.nama || 'Gelombang 1 Penerimaan SPMB'}
                      </span>
                    </div>
                    <Badge variant="green" className="text-2xs font-extrabold px-2.5 py-0.5 shrink-0">
                      ✓ Terdaftar &amp; Terunci
                    </Badge>
                  </div>
                  <span className="text-2xs text-slate-500 font-medium mt-1">
                    Gelombang pendaftaran Anda telah terikat permanen di database dan tidak akan terdampak jika Admin membuka gelombang baru.
                  </span>
                </div>
              </div>

              <div>
                <Controller
                  name="program_studi_id"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Pilihan Program Studi Utama *"
                      options={prodiOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="-- Pilih Program Studi Pilihan --"
                      error={errors.program_studi_id?.message}
                      hint="Pilih program studi jenjang S1/D3 yang ingin Anda tuju."
                    />
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Controller
                  name="jenis_daftar"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Jenis Pendaftaran *"
                      options={[
                        { value: 'REGULER', label: 'Reguler' },
                        { value: 'KARYAWAN', label: 'Karyawan' },
                        { value: 'TRANSFER', label: 'Transfer' },
                      ]}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="-- Pilih Jenis Pendaftaran --"
                      error={errors.jenis_daftar?.message}
                    />
                  )}
                />
                <Controller
                  name="kelas"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Kelas *"
                      options={[
                        { value: 'Pagi', label: 'Pagi' },
                        { value: 'Khusus', label: 'Karyawan / Khusus' },
                        { value: 'RPL', label: 'RPL / Transfer' },
                        { value: 'Pindahan', label: 'Pindahan' },
                      ]}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="-- Pilih Kelas --"
                      error={errors.kelas?.message}
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
                  error={errors.nama_lengkap?.message}
                  {...register('nama_lengkap')}
                />
                <Input
                  label="NIK (Nomor Induk Kependudukan) *"
                  placeholder="16 digit NIK sesuai KTP/KK"
                  maxLength={16}
                  error={errors.nik?.message}
                  {...register('nik')}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <Input
                  label="Tempat Lahir *"
                  placeholder="Kota/Kabupaten lahir"
                  error={errors.tempat_lahir?.message}
                  {...register('tempat_lahir')}
                />
                <Input
                  type="date"
                  label="Tanggal Lahir *"
                  error={errors.tanggal_lahir?.message}
                  {...register('tanggal_lahir')}
                />
                <Controller
                  name="jenis_kelamin"
                  control={control}
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
                      error={errors.jenis_kelamin?.message}
                    />
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                <Controller
                  name="status_sipil"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Status Sipil *"
                      options={[
                        { value: 'Belum Kawin', label: 'Belum Kawin' },
                        { value: 'Kawin', label: 'Kawin' },
                        { value: 'Janda', label: 'Janda' },
                        { value: 'Duda', label: 'Duda' },
                      ]}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="-- Pilih Status Sipil --"
                      error={errors.status_sipil?.message}
                    />
                  )}
                />
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                  label="Provinsi Domisili *"
                  placeholder="Nama Provinsi"
                  error={errors.provinsi?.message}
                  {...register('provinsi')}
                />
                <Input
                  label="Kota / Kabupaten *"
                  placeholder="Nama Kota/Kabupaten"
                  error={errors.kota_kabupaten?.message}
                  {...register('kota_kabupaten')}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input
                  label="Kecamatan *"
                  placeholder="Nama Kecamatan"
                  error={errors.kecamatan?.message}
                  {...register('kecamatan')}
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
                error={errors.alamat?.message}
                {...register('alamat')}
              />
            </div>
          )}

          {/* ── STEP 4: RIWAYAT AKADEMIK ─────────────────────────────────── */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Riwayat Pendidikan Sekolah Asal</h3>
                  <p className="text-xs text-slate-500">Informasi SMA / SMK / MA / Sekolah sederajat tempat Anda lulus.</p>
                </div>
              </div>

              <div className="mb-4">
                <Controller
                  name="asal_lulusan"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Asal Lulusan *"
                      options={[
                        { value: 'sekolah', label: 'SMA/SMK/MA/Sederajat' },
                        { value: 'pt', label: 'Perguruan Tinggi (Transfer)' },
                      ]}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="-- Pilih Asal Lulusan --"
                      error={errors.asal_lulusan?.message}
                    />
                  )}
                />
              </div>

              {watch('asal_lulusan') === 'sekolah' ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input
                      label="Nama Sekolah Asal *"
                      placeholder="Contoh: SMAN 1 Jakarta / SMKN 2 Bandung"
                      error={errors.asal_sekolah?.message}
                      {...register('asal_sekolah')}
                    />
                    <Input
                      label="NPSN Sekolah (Opsional)"
                      placeholder="8 digit NPSN Sekolah"
                      {...register('npsn_sekolah')}
                    />
                  </div>

                  <Textarea
                    label="Alamat Sekolah *"
                    placeholder="Jalan, RT/RW, Kelurahan, Kecamatan, Kota/Kabupaten"
                    rows={2}
                    error={errors.alamat_sekolah?.message}
                    {...register('alamat_sekolah')}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <Input
                      label="Jurusan Sekolah *"
                      placeholder="IPA / IPS / RPL / TKJ"
                      error={errors.jurusan_sekolah?.message}
                      {...register('jurusan_sekolah')}
                    />
                    <Input
                      label="Tahun Lulus *"
                      placeholder="2024 / 2025"
                      error={errors.tahun_lulus?.message}
                      {...register('tahun_lulus')}
                    />
                    <Input
                      label="Nilai Rata-Rapor (Opsional)"
                      type="number"
                      step="0.01"
                      placeholder="85.50"
                      {...register('nilai_rata_rapor')}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input
                      label="Asal Perguruan Tinggi *"
                      placeholder="Nama Kampus Asal"
                      error={errors.asal_pt?.message}
                      {...register('asal_pt')}
                    />
                    <Controller
                      name="jenis_pt"
                      control={control}
                      render={({ field }) => (
                        <Select
                          label="Jenis Perguruan Tinggi *"
                          options={[
                            { value: 'non-komputer', label: 'Non Komputer' },
                            { value: 'komputer', label: 'Komputer' },
                          ]}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="-- Pilih Jenis PT --"
                          error={errors.jenis_pt?.message}
                        />
                      )}
                    />
                  </div>

                  <Textarea
                    label="Alamat Perguruan Tinggi *"
                    placeholder="Alamat lengkap PT Asal"
                    rows={2}
                    error={errors.alamat_pt?.message}
                    {...register('alamat_pt')}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Controller
                      name="jenjang_pt"
                      control={control}
                      render={({ field }) => (
                        <Select
                          label="Jenjang Program Studi *"
                          options={[
                            { value: 'D3', label: 'D3' },
                            { value: 'S1', label: 'S1' },
                            { value: 'S2', label: 'S2' },
                          ]}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="-- Pilih Jenjang --"
                          error={errors.jenjang_pt?.message}
                        />
                      )}
                    />
                    <Input
                      label="Program Studi *"
                      placeholder="Nama Program Studi Asal"
                      error={errors.progdi_pt?.message}
                      {...register('progdi_pt')}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <Input
                      label="IPK *"
                      placeholder="Contoh: 3.50"
                      type="number"
                      step="0.01"
                      error={errors.ipk_pt?.message}
                      {...register('ipk_pt')}
                    />
                    <Input
                      label="NIM *"
                      placeholder="Nomor Induk Mahasiswa"
                      error={errors.nim_pt?.message}
                      {...register('nim_pt')}
                    />
                    <Input
                      label="Tahun Lulus/Keluar *"
                      placeholder="2024"
                      error={errors.tahun_lulus_pt?.message}
                      {...register('tahun_lulus_pt')}
                    />
                  </div>
                </>
              )}
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

              <div className="space-y-4 p-4 bg-slate-50/70 border border-slate-100 rounded-xl">
                <h4 className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-2">
                  Biodata Utama &amp; Alamat Orang Tua / Penanggung Jawab
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nama Orang Tua *"
                    placeholder="Nama Orang Tua / Penanggung Jawab"
                    error={errors.nama_ortu?.message}
                    {...register('nama_ortu')}
                  />
                  <Input
                    label="No. Telepon / HP Orang Tua *"
                    type="tel"
                    placeholder="Contoh: 081234567890"
                    error={errors.telp_ortu?.message}
                    {...register('telp_ortu')}
                  />
                </div>
                <Textarea
                  label="Alamat Orang Tua *"
                  placeholder="Alamat lengkap tempat tinggal orang tua"
                  rows={2}
                  error={errors.alamat_ortu?.message}
                  {...register('alamat_ortu')}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 p-4 bg-slate-50/70 border border-slate-100 rounded-xl">
                  <h4 className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-2">
                    Informasi Ayah Kandung
                  </h4>
                  <Input
                    label="Nama Ayah *"
                    placeholder="Nama lengkap Ayah kandung"
                    error={errors.nama_ayah?.message}
                    {...register('nama_ayah')}
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
                    error={errors.nama_ibu?.message}
                    {...register('nama_ibu')}
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

              <div className="space-y-4 p-4 bg-slate-50/70 border border-slate-100 rounded-xl">
                <h4 className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-2">
                  Informasi Tambahan &amp; Sumber Informasi
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Controller
                    name="info_daftar"
                    control={control}
                    render={({ field }) => (
                      <Select
                        label="Info Pendaftaran *"
                        options={[
                          { value: 'Media Sosial / Website', label: 'Media Sosial / Website' },
                          { value: 'Guru / Sekolah', label: 'Guru / Sekolah' },
                          { value: 'Brosur / Spanduk', label: 'Brosur / Spanduk' },
                          { value: 'Alumni / Teman', label: 'Alumni / Teman' },
                          { value: 'Rekomendasi Dosen/Staff', label: 'Rekomendasi Dosen/Staff' },
                          { value: 'Lainnya', label: 'Lainnya' },
                        ]}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="-- Pilih Sumber Info --"
                        error={errors.info_daftar?.message}
                      />
                    )}
                  />
                  <Input
                    label="Keterangan Info *"
                    placeholder="Isi rincian sumber info atau tanda (-)"
                    error={errors.ket_info_daftar?.message}
                    {...register('ket_info_daftar')}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 6: UNGGAH BERKAS DOKUMEN PENDAFTARAN ───────────────── */}
          {currentStep === 6 && (
            <div className="space-y-5 animate-fade-in">
              <DokumenUploadPanel
                uploadedBerkas={uploadedBerkas}
                onUpload={handleFileUpload}
                uploadingState={uploadingState}
              />
            </div>
          )}

          {/* ── STEP 7: REVIEW KONFIRMASI ────────────────────────────────── */}
          {currentStep === 7 && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <CheckSquare size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Konfirmasi Review Pendaftaran</h3>
                  <p className="text-xs text-slate-500">Periksa kembali seluruh rangkuman data dan berkas Anda sebelum dikirim.</p>
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
                    {formValues.asal_lulusan === 'sekolah' ? (
                      <div><span className="text-slate-400">Sekolah Asal:</span> <span className="font-semibold text-slate-800">{formValues.asal_sekolah || '-'}</span></div>
                    ) : (
                      <div><span className="text-slate-400">PT Asal:</span> <span className="font-semibold text-slate-800">{formValues.asal_pt || '-'}</span></div>
                    )}
                    <div className="sm:col-span-2"><span className="text-slate-400">Alamat:</span> <span className="font-semibold text-slate-800">{formValues.alamat}, {formValues.kecamatan}, {formValues.kota_kabupaten}</span></div>
                  </div>
                </div>

                {/* Step 6 Review: Berkas */}
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                      6. Berkas Pendaftaran
                    </span>
                    <button type="button" onClick={() => setCurrentStep(6)} className="text-xs text-primary-600 font-semibold hover:underline flex items-center gap-1">
                      <Edit3 size={12} /> Edit Berkas
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {REQUIRED_DOCUMENTS.map((doc) => {
                      const isUp = Boolean(uploadedBerkas[doc.key]?.file_path || uploadedBerkas[doc.key]?.file_url);
                      return (
                        <div key={doc.key} className="flex items-center gap-1.5 font-medium">
                          <span className={isUp ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                            {isUp ? '✓' : '○'} {doc.label.split(' ')[0]}
                          </span>
                        </div>
                      );
                    })}
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
              <Button 
                type="button" 
                variant="primary" 
                onClick={handleNextStep}
                loading={savingStepLoading}
                disabled={savingStepLoading}
              >
                <span>{savingStepLoading ? 'Menyimpan...' : 'Lanjut'}</span>
                {!savingStepLoading && <ArrowRight size={16} />}
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
