'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Briefcase,
  Car,
  Users,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { simpegSuratTugasService } from '@/services/simpeg.surat-tugas.service';
import { simpegService } from '@/services/simpeg.service';
import { useAuth } from '@/hooks/useAuth';
import type { SuratTugasMasters } from '@/types/simpeg.surat-tugas.types';
import type { Pegawai } from '@/types/simpeg.types';

// ── ZOD SCHEMA ────────────────────────────────────────────────
const suratTugasFormSchema = z
  .object({
    pegawai_id: z.string().min(1, 'Penanggung jawab / ketua tim wajib dipilih'),
    kategori_kegiatan_id: z.string().min(1, 'Kategori kegiatan wajib dipilih'),
    jenis_transportasi_id: z.string().min(1, 'Moda transportasi wajib dipilih'),
    nama_kegiatan: z.string().min(3, 'Nama kegiatan minimal 3 karakter'),
    tempat_berangkat: z.string().min(2, 'Tempat berangkat wajib diisi'),
    lokasi_tujuan: z.string().min(2, 'Lokasi tujuan kedinasan wajib diisi'),
    tanggal_berangkat: z.string().min(1, 'Tanggal berangkat wajib diisi'),
    tanggal_kembali: z.string().min(1, 'Tanggal kembali wajib diisi'),
    tanggal_mulai: z.string().min(1, 'Tanggal mulai kegiatan wajib diisi'),
    tanggal_selesai: z.string().min(1, 'Tanggal selesai kegiatan wajib diisi'),
    maksud_tujuan: z.string().min(5, 'Maksud dan tujuan minimal 5 karakter'),
    beban_anggaran: z.string().optional(),
    estimasi_biaya: z.string().optional(),
    keterangan: z.string().optional(),
    kendaraan_dinas: z.string().optional(),
    nama_driver: z.string().optional(),
    kontak_driver: z.string().optional(),
    anggota: z
      .array(
        z.object({
          pegawai_id: z.string().min(1, 'Pegawai anggota tim wajib dipilih'),
          peran: z.string().min(1, 'Peran wajib diisi'),
          keterangan: z.string().optional(),
        })
      )
      .optional(),
  })
  .refine(
    (data) => {
      if (data.tanggal_berangkat && data.tanggal_kembali) {
        return new Date(data.tanggal_kembali) >= new Date(data.tanggal_berangkat);
      }
      return true;
    },
    {
      message: 'Tanggal kembali harus sama atau setelah tanggal berangkat',
      path: ['tanggal_kembali'],
    }
  )
  .refine(
    (data) => {
      if (data.tanggal_mulai && data.tanggal_selesai) {
        return new Date(data.tanggal_selesai) >= new Date(data.tanggal_mulai);
      }
      return true;
    },
    {
      message: 'Tanggal selesai kegiatan harus sama atau setelah tanggal mulai',
      path: ['tanggal_selesai'],
    }
  );

type SuratTugasFormValues = z.infer<typeof suratTugasFormSchema>;

export default function CreateSuratTugasPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [masters, setMasters] = useState<SuratTugasMasters | null>(null);
  const [fileSuratTugas, setFileSuratTugas] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected ketua option state for AsyncSelect display
  const [selectedKetuaOption, setSelectedKetuaOption] = useState<{ value: string; label: string } | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<SuratTugasFormValues>({
    resolver: zodResolver(suratTugasFormSchema),
    defaultValues: {
      pegawai_id: '',
      kategori_kegiatan_id: '',
      jenis_transportasi_id: '',
      nama_kegiatan: '',
      tempat_berangkat: 'Kampus Utama',
      lokasi_tujuan: '',
      tanggal_berangkat: '',
      tanggal_kembali: '',
      tanggal_mulai: '',
      tanggal_selesai: '',
      maksud_tujuan: '',
      beban_anggaran: '',
      estimasi_biaya: '',
      keterangan: '',
      kendaraan_dinas: '',
      nama_driver: '',
      kontak_driver: '',
      anggota: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'anggota',
  });

  // Fetch masters
  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const res = await simpegSuratTugasService.getMasters();
        if (res.status === 'success' && res.data) {
          setMasters(res.data);
          if (res.data.kategori_kegiatan.length > 0) {
            setValue('kategori_kegiatan_id', res.data.kategori_kegiatan[0].id.toString());
          }
          if (res.data.jenis_transportasi.length > 0) {
            setValue('jenis_transportasi_id', res.data.jenis_transportasi[0].id.toString());
          }
        }
      } catch (err: any) {
        toast.error('Gagal memuat master referensi surat tugas');
      }
    };
    fetchMasters();
  }, [setValue]);

  // Load Pegawai Options for AsyncSelect
  const loadPegawaiOptions = useCallback(async (inputValue: string) => {
    try {
      const res = await simpegService.getPegawaiList({
        search: inputValue || undefined,
        per_page: 20,
      });

      const list: Pegawai[] = Array.isArray(res.data) ? res.data : res.data?.data || [];
      return list.map((p) => ({
        value: p.id.toString(),
        label: `${p.nama_lengkap}${p.nip ? ` (NIP: ${p.nip})` : ''} - ${p.unit_kerja?.nama || 'SDM'}`,
      }));
    } catch (err) {
      console.error('Gagal mencari pegawai', err);
      return [];
    }
  }, []);

  const kategoriOptions = masters?.kategori_kegiatan.map((k) => ({
    value: k.id.toString(),
    label: k.nama,
  })) || [];

  const transportasiOptions = masters?.jenis_transportasi.map((t) => ({
    value: t.id.toString(),
    label: t.nama,
  })) || [];

  const onSubmit = async (values: SuratTugasFormValues, status: 'draft' | 'diajukan' = 'diajukan') => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('pegawai_id', values.pegawai_id);
      formData.append('kategori_kegiatan_id', values.kategori_kegiatan_id);
      formData.append('jenis_transportasi_id', values.jenis_transportasi_id);
      formData.append('nama_kegiatan', values.nama_kegiatan);
      formData.append('tempat_berangkat', values.tempat_berangkat);
      formData.append('lokasi_tujuan', values.lokasi_tujuan);
      formData.append('tanggal_berangkat', values.tanggal_berangkat);
      formData.append('tanggal_kembali', values.tanggal_kembali);
      formData.append('tanggal_mulai', values.tanggal_mulai);
      formData.append('tanggal_selesai', values.tanggal_selesai);
      formData.append('maksud_tujuan', values.maksud_tujuan);
      formData.append('status', status);

      if (values.beban_anggaran) formData.append('beban_anggaran', values.beban_anggaran);
      if (values.estimasi_biaya) formData.append('estimasi_biaya', values.estimasi_biaya);
      if (values.keterangan) formData.append('keterangan', values.keterangan);
      if (values.kendaraan_dinas) formData.append('kendaraan_dinas', values.kendaraan_dinas);
      if (values.nama_driver) formData.append('nama_driver', values.nama_driver);
      if (values.kontak_driver) formData.append('kontak_driver', values.kontak_driver);

      if (values.anggota && values.anggota.length > 0) {
        values.anggota.forEach((item, index) => {
          formData.append(`anggota[${index}][pegawai_id]`, item.pegawai_id);
          formData.append(`anggota[${index}][peran]`, item.peran);
          if (item.keterangan) formData.append(`anggota[${index}][keterangan]`, item.keterangan);
        });
      }

      if (fileSuratTugas) {
        formData.append('file_surat_tugas', fileSuratTugas);
      }

      await simpegSuratTugasService.create(formData);
      toast.success(
        status === 'diajukan'
          ? 'Permohonan surat tugas berhasil diajukan!'
          : 'Draf surat tugas berhasil disimpan!'
      );
      router.push('/simpeg/surat-tugas');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan surat tugas.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6 max-w-5xl mx-auto pb-6">
      <PageHeader
        title="Pengajuan Surat Tugas & Logistik Dinas"
        description="Lengkapi detail perjalanan dinas luar kampus, penugasan armada kendaraan, nama driver, serta anggota tim rombongan."
        backUrl="/simpeg/surat-tugas"
      />

      <form className="space-y-6">
        {/* SECTION 1: DATA UTAMA KEGIATAN */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Briefcase size={18} className="text-primary-600 shrink-0" />
            <h2 className="text-base font-bold text-slate-900">1. Data Utama Kegiatan & Penugasan</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Penanggung Jawab / Ketua Rombongan <span className="text-rose-500">*</span>
              </label>
              <Controller
                control={control}
                name="pegawai_id"
                render={({ field }) => (
                  <AsyncSelect
                    loadOptions={loadPegawaiOptions}
                    value={selectedKetuaOption}
                    onChange={(val: any) => {
                      setSelectedKetuaOption(val);
                      field.onChange(val ? val.value : '');
                    }}
                    placeholder="Ketik nama atau NIP pegawai..."
                    error={errors.pegawai_id?.message}
                    isClearable
                  />
                )}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Kategori Kegiatan Tugas <span className="text-rose-500">*</span>
              </label>
              <Controller
                control={control}
                name="kategori_kegiatan_id"
                render={({ field }) => (
                  <Select
                    options={kategoriOptions}
                    value={field.value}
                    onChange={(val: any) => field.onChange(val || '')}
                    error={errors.kategori_kegiatan_id?.message}
                  />
                )}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nama Kegiatan Kedinasan <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="Contoh: Rapat Koordinasi Nasional APTIKOM Wilayah Jawa Barat"
                {...register('nama_kegiatan')}
                error={errors.nama_kegiatan?.message}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Tempat Asal Berangkat <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="Contoh: Kampus Utama"
                {...register('tempat_berangkat')}
                error={errors.tempat_berangkat?.message}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Lokasi / Kota Tujuan <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="Contoh: Hotel Hilton Bandung / LLDIKTI Wilayah IV"
                {...register('lokasi_tujuan')}
                error={errors.lokasi_tujuan?.message}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Tanggal Berangkat <span className="text-rose-500">*</span>
              </label>
              <Input
                type="date"
                {...register('tanggal_berangkat')}
                error={errors.tanggal_berangkat?.message}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Tanggal Kembali / Pulang <span className="text-rose-500">*</span>
              </label>
              <Input
                type="date"
                {...register('tanggal_kembali')}
                error={errors.tanggal_kembali?.message}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Tanggal Kegiatan Mulai <span className="text-rose-500">*</span>
              </label>
              <Input
                type="date"
                {...register('tanggal_mulai')}
                error={errors.tanggal_mulai?.message}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Tanggal Kegiatan Selesai <span className="text-rose-500">*</span>
              </label>
              <Input
                type="date"
                {...register('tanggal_selesai')}
                error={errors.tanggal_selesai?.message}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Maksud & Tujuan Kedinasan <span className="text-rose-500">*</span>
              </label>
              <Textarea
                placeholder="Jelaskan maksud dan tujuan pelaksanaan dinas luar..."
                rows={3}
                {...register('maksud_tujuan')}
                error={errors.maksud_tujuan?.message}
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: TRANSPORTASI & LOGISTIK DINAS */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Car size={18} className="text-primary-600 shrink-0" />
            <h2 className="text-base font-bold text-slate-900">2. Transportasi, Armada & Anggaran</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Moda Transportasi <span className="text-rose-500">*</span>
              </label>
              <Controller
                control={control}
                name="jenis_transportasi_id"
                render={({ field }) => (
                  <Select
                    options={transportasiOptions}
                    value={field.value}
                    onChange={(val: any) => field.onChange(val || '')}
                    error={errors.jenis_transportasi_id?.message}
                  />
                )}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Kendaraan Dinas / Nopol
              </label>
              <Input
                placeholder="Contoh: Toyota Avanza (D 1234 XY)"
                {...register('kendaraan_dinas')}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Nama Driver</label>
              <Input placeholder="Nama pengemudi armada dinas..." {...register('nama_driver')} />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Kontak Driver (HP)</label>
              <Input placeholder="081234567890" {...register('kontak_driver')} />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Beban Anggaran</label>
              <Input placeholder="Contoh: RKAT Prodi / Hibah Riset" {...register('beban_anggaran')} />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Estimasi Biaya Perjalanan (Rp)
              </label>
              <Input
                type="number"
                placeholder="Contoh: 2500000"
                {...register('estimasi_biaya')}
              />
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Keterangan Tambahan / Catatan Logistik
              </label>
              <Input
                placeholder="Catatan tambahan mengenai akomodasi, penjemputan, dll..."
                {...register('keterangan')}
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: ANGGOTA TIM ROMBONGAN */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-100 flex-wrap">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-primary-600 shrink-0" />
              <div>
                <h2 className="text-base font-bold text-slate-900">3. Anggota Tim Rombongan</h2>
                <p className="text-xs text-slate-500">
                  Daftarkan staf/dosen lain yang berangkat bersama dalam tugas kedinasan ini.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ pegawai_id: '', peran: 'Anggota', keterangan: '' })}
              className="flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Tambah Anggota</span>
            </Button>
          </div>

          {fields.length === 0 ? (
            <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl">
              <Users size={28} className="mx-auto text-slate-300 mb-2" />
              <p className="text-xs text-slate-500">
                Belum ada anggota rombongan. Klik tombol &quot;Tambah Anggota&quot; jika perjalanan dinas
                melibatkan lebih dari satu orang.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {fields.map((field, idx) => (
                <div
                  key={field.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
                >
                  <div className="md:col-span-5">
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Pilih Pegawai Anggota #{idx + 1} <span className="text-rose-500">*</span>
                    </label>
                    <Controller
                      control={control}
                      name={`anggota.${idx}.pegawai_id`}
                      render={({ field: memberField }) => (
                        <AsyncSelect
                          loadOptions={loadPegawaiOptions}
                          onChange={(val: any) => memberField.onChange(val ? val.value : '')}
                          placeholder="Cari nama pegawai..."
                        />
                      )}
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Peran Dalam Tugas
                    </label>
                    <Input
                      placeholder="Contoh: Anggota, Notulis, Pemateri"
                      {...register(`anggota.${idx}.peran`)}
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Keterangan
                    </label>
                    <Input
                      placeholder="Keterangan opsional..."
                      {...register(`anggota.${idx}.keterangan`)}
                    />
                  </div>

                  <div className="md:col-span-1 flex items-end justify-end pt-5">
                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Hapus anggota ini"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 4: BERKAS LAMPIRAN */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Upload size={18} className="text-primary-600 shrink-0" />
            <h2 className="text-base font-bold text-slate-900">4. Berkas Undangan / Surat Pendukung</h2>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Unggah Undangan / Berkas Tugas (PDF, Opsional)
            </label>
            <Input
              type="file"
              accept=".pdf"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setFileSuratTugas(e.target.files[0]);
                }
              }}
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Format berkas wajib PDF dengan ukuran maksimal 10MB.
            </p>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center justify-between gap-4 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/simpeg/surat-tugas')}
            disabled={isSubmitting}
          >
            Batal
          </Button>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleSubmit((data) => onSubmit(data, 'draft'))}
              isLoading={isSubmitting}
            >
              Simpan sebagai Draf
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSubmit((data) => onSubmit(data, 'diajukan'))}
              isLoading={isSubmitting}
            >
              Kirim Permohonan
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
