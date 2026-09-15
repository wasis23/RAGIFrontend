'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Calendar, Upload, Image as ImageIcon, Clock, CalendarDays, Info, AlertCircle } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { simpegService } from '@/services/simpeg.service';
import type { Pegawai, MasterJenisCuti } from '@/types/simpeg.types';
import { useAuth } from '@/hooks/useAuth';

interface OptionType {
  value: string;
  label: string;
}

const cutiSchema = z.object({
  pegawai_id: z.string().min(1, 'Pegawai Pemohon wajib dipilih'),
  master_jenis_cuti_id: z.string().min(1, 'Jenis Cuti / Izin wajib dipilih'),
  tanggal_mulai: z.string().min(1, 'Tanggal Mulai wajib diisi'),
  tanggal_selesai: z.string().min(1, 'Tanggal Selesai wajib diisi'),
  jumlah_hari: z.number().min(1, 'Jumlah hari minimal 1 hari'),
  alasan: z.string().min(1, 'Alasan pengajuan cuti wajib diisi'),
});

type CutiFormValues = z.infer<typeof cutiSchema>;

export default function PengajuanCutiPage() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('simpeg.cuti.create') || hasPermission('simpeg.cuti.request') || hasPermission('simpeg.cuti.manage');
  const router = useRouter();

  const [masterList, setMasterList] = useState<MasterJenisCuti[]>([]);
  const [selectedMaster, setSelectedMaster] = useState<MasterJenisCuti | null>(null);
  const [selectedPegawaiOption, setSelectedPegawaiOption] = useState<OptionType | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingMaster, setLoadingMaster] = useState(true);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CutiFormValues>({
    resolver: zodResolver(cutiSchema),
    defaultValues: {
      pegawai_id: '',
      master_jenis_cuti_id: '',
      tanggal_mulai: '',
      tanggal_selesai: '',
      jumlah_hari: 1,
      alasan: '',
    },
  });

  const tglMulai = watch('tanggal_mulai');
  const tglSelesai = watch('tanggal_selesai');

  // Load active master cuti types from backend API (Zero Hardcode Policy)
  useEffect(() => {
    const fetchMaster = async () => {
      setLoadingMaster(true);
      try {
        const res: any = await simpegService.getMasterJenisCutiList({ is_active: 1, all: 1 });
        const list: MasterJenisCuti[] = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setMasterList(list);
      } catch (err) {
        console.error('Gagal mengambil master jenis cuti', err);
        toast.error('Gagal memuat jenis cuti dari server.');
      } finally {
        setLoadingMaster(false);
      }
    };
    fetchMaster();
  }, []);

  // Calculate dates based on start date & duration type
  const calculateEndDateForFixed = useCallback((startDateStr: string, durasi: number) => {
    if (!startDateStr || durasi < 1) return;
    const parts = startDateStr.split('-');
    if (parts.length !== 3) return;
    const start = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    start.setDate(start.getDate() + durasi - 1);
    const y = start.getFullYear();
    const m = String(start.getMonth() + 1).padStart(2, '0');
    const d = String(start.getDate()).padStart(2, '0');
    const endDateStr = `${y}-${m}-${d}`;
    setValue('tanggal_selesai', endDateStr);
    setValue('jumlah_hari', durasi);
  }, [setValue]);

  // Handle Jenis Cuti Change
  const handleMasterChange = (masterId: string) => {
    setValue('master_jenis_cuti_id', masterId);
    const found = masterList.find((m) => m.id.toString() === masterId) || null;
    setSelectedMaster(found);

    if (found?.tipe_durasi === 'ditetapkan' && tglMulai) {
      calculateEndDateForFixed(tglMulai, found.durasi_hari);
    }
  };

  // Handle start date change
  const handleStartDateChange = (newStart: string) => {
    setValue('tanggal_mulai', newStart);
    if (selectedMaster?.tipe_durasi === 'ditetapkan') {
      calculateEndDateForFixed(newStart, selectedMaster.durasi_hari);
    } else if (newStart && tglSelesai) {
      const d1 = new Date(newStart);
      const d2 = new Date(tglSelesai);
      if (d2 >= d1) {
        const diffDays = Math.ceil(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        setValue('jumlah_hari', diffDays);
      }
    }
  };

  // Handle end date change for flexible leave
  const handleEndDateChange = (newEnd: string) => {
    setValue('tanggal_selesai', newEnd);
    if (tglMulai && newEnd) {
      const d1 = new Date(tglMulai);
      const d2 = new Date(newEnd);
      if (d2 >= d1) {
        const diffDays = Math.ceil(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        setValue('jumlah_hari', diffDays);
      }
    }
  };

  // Async loader for Pegawai AsyncSelect
  const loadPegawaiOptions = useCallback(async (inputValue: string) => {
    try {
      const res: any = await simpegService.getPegawaiList({ per_page: 500 });
      const responseData = res?.data || res;
      const list: Pegawai[] = Array.isArray(responseData)
        ? responseData
        : responseData?.items || responseData?.data || [];
      
      const filtered = inputValue
        ? list.filter(
            (p: Pegawai) =>
              p.nama_lengkap.toLowerCase().includes(inputValue.toLowerCase()) ||
              (p.nip && p.nip.toLowerCase().includes(inputValue.toLowerCase()))
          )
        : list;

      return filtered.map((p: Pegawai) => ({
        value: p.id.toString(),
        label: `[NIP: ${p.nip || '-'}] ${p.nama_lengkap} (${p.unit_kerja?.nama || 'Tanpa Unit'})`,
      }));
    } catch (err) {
      console.error('Gagal memuat opsi pegawai', err);
      return [];
    }
  }, []);

  const isFixed = selectedMaster?.tipe_durasi === 'ditetapkan';
  const isAttachmentMandatory = Boolean(selectedMaster?.lampiran_wajib);

  const onSubmit = async (values: CutiFormValues) => {
    if (!canCreate) {
      toast.error('Akses Ditolak: Anda tidak memiliki permission mengajukan Cuti.');
      return;
    }

    if (isAttachmentMandatory && !selectedFile) {
      toast.error(`Surat / berkas lampiran pendukung wajib diunggah untuk jenis cuti: ${selectedMaster?.nama}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('pegawai_id', values.pegawai_id);
      formData.append('master_jenis_cuti_id', values.master_jenis_cuti_id);
      formData.append('tanggal_mulai', values.tanggal_mulai);
      formData.append('tanggal_selesai', values.tanggal_selesai);
      formData.append('jumlah_hari', values.jumlah_hari.toString());
      formData.append('alasan', values.alasan);
      
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      await simpegService.createCuti(formData);
      toast.success('Formulir Pengajuan Cuti berhasil dikirim dan tersimpan!');
      router.push('/simpeg/cuti');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal mengirim pengajuan Cuti');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Formulir Pengajuan Cuti Online"
        description="Lengkapi data permohonan cuti kerja dan unggah berkas pendukung sesuai jenis izin yang dipilih"
        action={
          <Button
            onClick={() => router.back()}
            className="bg-orange-500 hover:bg-orange-600 text-white border-none shadow-sm font-bold"
            icon={<ArrowLeft size={16} />}
          >
            Kembali
          </Button>
        }
      />

      <div className="card">
        <div className="card-body p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {/* Pemohon Pegawai */}
              <div className="lg:col-span-3">
                <Controller
                  name="pegawai_id"
                  control={control}
                  render={({ field }) => (
                    <AsyncSelect
                      label="Pilih Pegawai Pemohon"
                      required
                      placeholder="Ketik nama pegawai / NIP untuk mencari dari database..."
                      loadOptions={loadPegawaiOptions}
                      value={selectedPegawaiOption || (field.value ? { value: field.value, label: field.value } : null)}
                      onChange={(opt) => {
                        setSelectedPegawaiOption(opt);
                        field.onChange(opt ? opt.value : '');
                      }}
                      isClearable
                      error={errors.pegawai_id?.message}
                    />
                  )}
                />
              </div>

              {/* Dynamic Jenis Cuti Dropdown from DB */}
              <div className="lg:col-span-3">
                <Controller
                  name="master_jenis_cuti_id"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Jenis Izin & Cuti"
                      required
                      value={field.value}
                      onChange={(val) => handleMasterChange(val)}
                      error={errors.master_jenis_cuti_id?.message}
                      disabled={loadingMaster}
                      options={[
                        { value: '', label: loadingMaster ? 'Memuat data jenis cuti...' : '-- Pilih Jenis Cuti / Izin --' },
                        ...masterList.map((m) => ({
                          value: m.id.toString(),
                          label: `${m.nama} ${m.tipe_durasi === 'ditetapkan' ? `(Durasi Ditetapkan: ${m.durasi_hari} Hari)` : '(Durasi Fleksibel)'}`,
                        })),
                      ]}
                    />
                  )}
                />

                {/* Banner Info Tipe Durasi */}
                {selectedMaster && (
                  <div className={`mt-2 p-3 rounded-xl border flex items-start gap-3 transition-all ${
                    isFixed 
                      ? 'bg-amber-50/80 border-amber-200 text-amber-900' 
                      : 'bg-blue-50/80 border-blue-200 text-blue-900'
                  }`}>
                    {isFixed ? (
                      <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <CalendarDays className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="text-xs space-y-1">
                      <div className="font-bold flex items-center gap-2">
                        <span>{selectedMaster.nama}</span>
                        <Badge variant={isFixed ? 'warning' : 'info'} className="text-[10px] py-0 px-1.5">
                          {isFixed ? 'Durasi Baku Ditetapkan' : 'Durasi Fleksibel'}
                        </Badge>
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        {isFixed
                          ? `Jenis izin ini memiliki durasi baku ${selectedMaster.durasi_hari} ${selectedMaster.satuan || 'hari'}. Saat Anda memilih Tanggal Mulai, Tanggal Selesai dan Jumlah Hari akan otomatis terisi dan terkunci.`
                          : 'Jenis izin ini bersifat fleksibel. Anda bebas menentukan Tanggal Mulai dan Tanggal Selesai permohonan.'}
                      </p>
                      {selectedMaster.keterangan && (
                        <p className="text-slate-500 italic">Ketentuan: {selectedMaster.keterangan}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Tanggal Mulai */}
              <Input
                label="Tanggal Mulai"
                type="date"
                required
                error={errors.tanggal_mulai?.message}
                {...register('tanggal_mulai', {
                  onChange: (e) => handleStartDateChange(e.target.value),
                })}
              />

              {/* Tanggal Selesai (Readonly if Fixed Duration) */}
              <div>
                <Input
                  label={`Tanggal Selesai * ${isFixed ? '(Otomatis Ditetapkan)' : ''}`}
                  type="date"
                  required
                  readOnly={isFixed}
                  className={isFixed ? 'bg-slate-100 cursor-not-allowed font-semibold text-slate-700' : ''}
                  error={errors.tanggal_selesai?.message}
                  {...register('tanggal_selesai', {
                    onChange: (e) => handleEndDateChange(e.target.value),
                  })}
                />
                {isFixed && (
                  <span className="text-[11px] text-amber-700 font-medium block mt-1">
                    * Terkunci otomatis {selectedMaster?.durasi_hari} hari dari tanggal mulai
                  </span>
                )}
              </div>

              {/* Durasi Hari (Readonly if Fixed Duration) */}
              <div>
                <Input
                  label={`Durasi (Hari Kalender / Kerja) * ${isFixed ? '(Baku)' : ''}`}
                  type="number"
                  required
                  readOnly={isFixed}
                  placeholder="Contoh: 3"
                  className={isFixed ? 'bg-slate-100 cursor-not-allowed font-bold text-slate-700' : ''}
                  error={errors.jumlah_hari?.message}
                  {...register('jumlah_hari', { valueAsNumber: true })}
                />
                {isFixed && (
                  <span className="text-[11px] text-amber-700 font-medium block mt-1">
                    * Durasi baku ditetapkan sistem
                  </span>
                )}
              </div>

              {/* Input Foto / Berkas Lampiran Izin */}
              <div className="lg:col-span-3 space-y-1">
                <label className="block text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  Foto / Berkas Lampiran Surat Izin Cuti (Surat Dokter / Undangan / Bukti)
                  {isAttachmentMandatory ? (
                    <span className="text-rose-500 font-bold">* (Wajib Lampirkan Berkas)</span>
                  ) : (
                    <span className="text-slate-400 font-normal">(Opsional)</span>
                  )}
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 border border-slate-300 rounded-xl cursor-pointer p-1.5 transition-all"
                />
                {selectedFile ? (
                  <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-1">
                    <ImageIcon size={14} /> Berkas Lampiran Terpilih: <strong>{selectedFile.name}</strong> ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </p>
                ) : (
                  <p className="text-xs text-slate-400">
                    Format yang didukung: JPG, PNG, PDF (Maksimal 10MB)
                    {isAttachmentMandatory && <span className="text-rose-500 font-semibold ml-1">— Wajib untuk jenis cuti ini</span>}
                  </p>
                )}
              </div>

              {/* Alasan Pengajuan */}
              <div className="lg:col-span-3">
                <Controller
                  name="alasan"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      label="Alasan Detail Pengajuan Cuti"
                      required
                      rows={3}
                      placeholder="Ketikkan alasan detail permohonan pengajuan cuti..."
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.alasan?.message}
                    />
                  )}
                />
              </div>

            </div>

            <div className="flex justify-end gap-3 border-t pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                type="submit"
                loading={isSubmitting}
                disabled={isSubmitting}
                icon={<Save size={16} />}
                className="font-bold"
              >
                Kirim Pengajuan Cuti
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
