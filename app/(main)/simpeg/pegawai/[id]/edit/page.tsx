'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, RefreshCw, CreditCard, Building } from 'lucide-react';
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
import { simpegService } from '@/services/simpeg.service';
import type { UnitKerja } from '@/types/simpeg.types';

const pegawaiSchema = z.object({
  nama_lengkap: z.string().min(1, 'Nama Lengkap wajib diisi'),
  nip: z.string().optional().nullable(),
  nik: z.string().optional().nullable(),
  unit_kerja_id: z.string().optional().nullable(),
  jenis_pegawai: z.enum(['dosen', 'tendik', 'honorer'], {
    message: 'Jenis Pegawai wajib dipilih',
  }),
  status_kepegawaian: z.enum(['pns', 'non_pns', 'kontrak', 'tetap_yayasan'], {
    message: 'Status Kepegawaian wajib dipilih',
  }),
  status: z.enum(['aktif', 'non_aktif', 'pensiun', 'meninggal'], {
    message: 'Status Keaktifan wajib dipilih',
  }),
  tempat_lahir: z.string().optional().nullable(),
  tanggal_lahir: z.string().optional().nullable(),
  jenis_kelamin: z.enum(['L', 'P'], {
    message: 'Jenis Kelamin wajib dipilih',
  }),
  telepon: z.string().optional().nullable(),
  alamat: z.string().optional().nullable(),
  bank_nama: z.string().optional().nullable(),
  nomor_rekening: z.string().optional().nullable(),
});

type PegawaiFormValues = z.infer<typeof pegawaiSchema>;

export default function EditPegawaiPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const pegawaiId = Number(resolvedParams.id);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUnitOption, setSelectedUnitOption] = useState<{ value: string; label: string } | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<PegawaiFormValues>({
    resolver: zodResolver(pegawaiSchema),
    defaultValues: {
      nama_lengkap: '',
      nip: '',
      nik: '',
      unit_kerja_id: '',
      jenis_pegawai: 'dosen',
      status_kepegawaian: 'tetap_yayasan',
      status: 'aktif',
      tempat_lahir: '',
      tanggal_lahir: '',
      jenis_kelamin: 'L',
      telepon: '',
      alamat: '',
      bank_nama: '',
      nomor_rekening: '',
    },
  });

  const loadUnitKerjaOptions = useCallback(async (inputValue: string) => {
    try {
      const res = await simpegService.getUnitKerjaList();
      const units = res.data || [];
      const filtered = units.filter(
        (u: UnitKerja) =>
          u.nama.toLowerCase().includes(inputValue.toLowerCase()) ||
          u.kode.toLowerCase().includes(inputValue.toLowerCase())
      );
      return filtered.map((u: UnitKerja) => ({
        value: u.id.toString(),
        label: `[${u.kode}] ${u.nama}`,
      }));
    } catch (err) {
      console.error('Gagal memuat opsi unit kerja', err);
      return [];
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [resPegawai, resUnit] = await Promise.all([
          simpegService.getPegawaiDetail(pegawaiId),
          simpegService.getUnitKerjaList(),
        ]);

        const peg = resPegawai.data;
        if (peg) {
          const formVals: PegawaiFormValues = {
            unit_kerja_id: peg.unit_kerja_id ? String(peg.unit_kerja_id) : '',
            nip: peg.nip || '',
            nik: peg.nik || '',
            nama_lengkap: peg.nama_lengkap || '',
            tempat_lahir: peg.tempat_lahir || '',
            tanggal_lahir: peg.tanggal_lahir || '',
            jenis_kelamin: peg.jenis_kelamin || 'L',
            jenis_pegawai: peg.jenis_pegawai || 'dosen',
            status_kepegawaian: peg.status_kepegawaian || 'tetap_yayasan',
            status: peg.status || 'aktif',
            telepon: peg.telepon || '',
            alamat: peg.alamat || '',
            bank_nama: peg.bank_nama || '',
            nomor_rekening: peg.nomor_rekening || '',
          };
          reset(formVals);

          if (peg.unit_kerja) {
            setSelectedUnitOption({
              value: String(peg.unit_kerja.id),
              label: `[${peg.unit_kerja.kode}] ${peg.unit_kerja.nama}`,
            });
          }
        }
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Gagal memuat data pegawai');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [pegawaiId, reset]);

  const onSubmit = async (values: PegawaiFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        unit_kerja_id: values.unit_kerja_id ? Number(values.unit_kerja_id) : null,
        nip: values.nip || null,
        nik: values.nik || null,
        nama_lengkap: values.nama_lengkap,
        tempat_lahir: values.tempat_lahir || null,
        tanggal_lahir: values.tanggal_lahir || null,
        jenis_kelamin: values.jenis_kelamin,
        jenis_pegawai: values.jenis_pegawai,
        status_kepegawaian: values.status_kepegawaian,
        status: values.status,
        telepon: values.telepon || null,
        alamat: values.alamat || null,
        bank_nama: values.bank_nama || null,
        nomor_rekening: values.nomor_rekening || null,
      };

      await simpegService.updatePegawai(pegawaiId, payload);
      toast.success('Data Pegawai berhasil diperbarui!');
      router.push('/simpeg/pegawai');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memperbarui data pegawai');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Edit Kontak & Biodata Pegawai"
          description="Perbarui biodata pribadi, alamat, nomor rekening, atau status kepegawaian"
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
        <div className="card p-6 text-center text-slate-400">
          <RefreshCw size={28} className="animate-spin mx-auto mb-2 text-primary-600" />
          Memuat data pegawai...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Edit Kontak & Biodata Pegawai"
        description="Perbarui biodata pribadi, alamat, nomor rekening, atau status kepegawaian"
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
              
              <Input
                label="Nama Lengkap & Gelar *"
                required
                placeholder="Ketik Nama Lengkap & Gelar..."
                error={errors.nama_lengkap?.message}
                {...register('nama_lengkap')}
              />

              <Input
                label="NIP (Nomor Induk Pegawai)"
                placeholder="Ketik NIP pegawai..."
                error={errors.nip?.message}
                {...register('nip')}
              />

              <Input
                label="NIK (KTP)"
                placeholder="Ketik NIK 16 digit..."
                error={errors.nik?.message}
                {...register('nik')}
              />

              <Controller
                name="jenis_pegawai"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Jenis Pegawai *"
                    required
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.jenis_pegawai?.message}
                    options={[
                      { value: 'dosen', label: 'Dosen Pengajar' },
                      { value: 'tendik', label: 'Tenaga Kependidikan' },
                      { value: 'honorer', label: 'Honorer' },
                    ]}
                  />
                )}
              />

              <Controller
                name="status_kepegawaian"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Status Kepegawaian *"
                    required
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.status_kepegawaian?.message}
                    options={[
                      { value: 'tetap_yayasan', label: 'Tetap Yayasan / Kampus' },
                      { value: 'pns', label: 'PNS DPK' },
                      { value: 'non_pns', label: 'Non-PNS' },
                      { value: 'kontrak', label: 'Kontrak' },
                    ]}
                  />
                )}
              />

              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Status Keaktifan *"
                    required
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.status?.message}
                    options={[
                      { value: 'aktif', label: 'Aktif' },
                      { value: 'non_aktif', label: 'Non-Aktif' },
                      { value: 'pensiun', label: 'Pensiun' },
                    ]}
                  />
                )}
              />

              <div className="lg:col-span-3">
                <Controller
                  name="unit_kerja_id"
                  control={control}
                  render={({ field }) => (
                    <AsyncSelect
                      label="Unit Kerja Tempat Bertugas"
                      placeholder="Cari Unit Kerja (contoh: Fakultas / Biro / Prodi)..."
                      loadOptions={loadUnitKerjaOptions}
                      value={selectedUnitOption || (field.value ? { value: field.value, label: field.value } : null)}
                      onChange={(opt) => {
                        setSelectedUnitOption(opt);
                        field.onChange(opt ? opt.value : '');
                      }}
                      isClearable
                      error={errors.unit_kerja_id?.message}
                    />
                  )}
                />
              </div>

              <Input
                label="Tempat Lahir"
                placeholder="Ketik Kota Tempat Lahir..."
                error={errors.tempat_lahir?.message}
                {...register('tempat_lahir')}
              />

              <Input
                type="date"
                label="Tanggal Lahir"
                error={errors.tanggal_lahir?.message}
                {...register('tanggal_lahir')}
              />

              <Controller
                name="jenis_kelamin"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Jenis Kelamin *"
                    required
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.jenis_kelamin?.message}
                    options={[
                      { value: 'L', label: 'Laki-Laki' },
                      { value: 'P', label: 'Perempuan' },
                    ]}
                  />
                )}
              />

              <Input
                label="Nomor Telepon / WhatsApp"
                placeholder="Ketik Nomor HP / WA..."
                error={errors.telepon?.message}
                {...register('telepon')}
              />

              <Input
                label="Nama Bank Pencairan"
                placeholder="Contoh: Bank Mandiri / BNI / BRI"
                error={errors.bank_nama?.message}
                {...register('bank_nama')}
              />

              <Input
                label="Nomor Rekening Bank"
                placeholder="Ketik Nomor Rekening..."
                error={errors.nomor_rekening?.message}
                {...register('nomor_rekening')}
              />

              <div className="lg:col-span-3">
                <Textarea
                  label="Alamat Domisili Lengkap"
                  placeholder="Ketik Alamat Lengkap..."
                  rows={2}
                  error={errors.alamat?.message}
                  {...register('alamat')}
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
                Simpan Perubahan
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
