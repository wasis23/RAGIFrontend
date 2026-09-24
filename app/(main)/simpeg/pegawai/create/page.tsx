'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Info, MapPin } from 'lucide-react';
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
  gelar_depan: z.string().optional().nullable(),
  gelar_belakang: z.string().optional().nullable(),
  email: z.string().email('Format email tidak valid').optional().or(z.literal('')),
  nidn: z.string().min(1, 'NIDN wajib diisi'),
  nuptk: z.string().min(1, 'NUPTK wajib diisi'),
  nip: z.string().min(1, 'NIP wajib diisi'),
  nik: z.string().optional().nullable(),
  tanggal_masuk: z.string().min(1, 'Tanggal Masuk wajib diisi'),
  unit_kerja_id: z.string().optional().nullable(),
  role_ids: z.array(z.string().or(z.number())).min(1, 'Pilih minimal satu jenis pegawai / peran SSO'),
  status_kepegawaian: z.enum(['pns', 'non_pns', 'kontrak', 'tetap_yayasan'], {
    message: 'Status Kepegawaian wajib dipilih',
  }),
  status: z.enum(['aktif', 'non_aktif', 'pensiun'], {
    message: 'Status Keaktifan wajib dipilih',
  }),
  tempat_lahir: z.string().optional().nullable(),
  tanggal_lahir: z.string().optional().nullable(),
  jenis_kelamin: z.enum(['L', 'P'], {
    message: 'Jenis Kelamin wajib dipilih',
  }),
  telepon: z.string().optional().nullable(),
  alamat: z.string().optional().nullable(),
  shift_template_id: z.string().min(1, 'Shift Kerja (Jadwal Presensi) wajib dipilih'),
});

type PegawaiFormValues = z.infer<typeof pegawaiSchema>;

export default function CreatePegawaiPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<PegawaiFormValues>({
    resolver: zodResolver(pegawaiSchema),
    defaultValues: {
      nama_lengkap: '',
      gelar_depan: '',
      gelar_belakang: '',
      email: '',
      nidn: '',
      nuptk: '',
      nip: '',
      nik: '',
      tanggal_masuk: '',
      unit_kerja_id: '',
      role_ids: [],
      status_kepegawaian: 'tetap_yayasan',
      status: 'aktif',
      tempat_lahir: '',
      tanggal_lahir: '',
      jenis_kelamin: 'L',
      telepon: '',
      alamat: '',
      shift_template_id: '',
    },
  });

  // Server-side async loader for SSO Roles
  const loadRoleOptions = useCallback(async (inputValue: string) => {
    try {
      const res = await simpegService.getAvailableRoles();
      const roles = res.data || [];
      const filtered = roles.filter(
        (r) =>
          r.name.toLowerCase().includes(inputValue.toLowerCase()) ||
          r.slug.toLowerCase().includes(inputValue.toLowerCase())
      );
      return filtered.map((r) => ({
        value: r.id.toString(),
        label: r.name,
      }));
    } catch (err) {
      console.error('Gagal memuat opsi role SSO', err);
      return [];
    }
  }, []);

  // Server-side async loader for Unit Kerja AsyncSelect
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

  // Server-side async loader for Shift Template AsyncSelect
  const loadShiftOptions = useCallback(async (inputValue: string) => {
    try {
      const res = await simpegService.getShiftTemplates();
      const shifts = res.data || [];
      return shifts
        .filter((s: any) => s.name.toLowerCase().includes(inputValue.toLowerCase()))
        .map((s: any) => ({
          value: s.id.toString(),
          label: s.is_active ? s.name : `${s.name} (Non-Aktif)`,
        }));
    } catch (err) {
      console.error('Gagal memuat opsi shift kerja', err);
      return [];
    }
  }, []);

  const onSubmit = async (values: PegawaiFormValues) => {
    setIsSubmitting(true);
    try {
      const payload: any = {
        unit_kerja_id: values.unit_kerja_id ? Number(values.unit_kerja_id) : null,
        nidn: values.nidn,
        nuptk: values.nuptk,
        nip: values.nip,
        nik: values.nik || null,
        nama_lengkap: values.nama_lengkap,
        gelar_depan: values.gelar_depan || null,
        gelar_belakang: values.gelar_belakang || null,
        tanggal_masuk: values.tanggal_masuk,
        tempat_lahir: values.tempat_lahir || null,
        tanggal_lahir: values.tanggal_lahir || null,
        jenis_kelamin: values.jenis_kelamin,
        role_ids: values.role_ids.map(Number),
        status_kepegawaian: values.status_kepegawaian,
        status: values.status,
        telepon: values.telepon || null,
        alamat: values.alamat || null,
        shift_template_id: Number(values.shift_template_id),
      };

      if (values.email) {
        payload.email = values.email;
      }

      await simpegService.createPegawai(payload);
      toast.success('Data Pegawai berhasil ditambahkan! Akun SSO telah dibuat.');
      router.push('/simpeg/pegawai');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan data pegawai');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Tambah Pegawai Baru"
        description="Daftarkan dosen atau tenaga kependidikan baru ke SIMPEG"
        action={
          <Button
            onClick={() => router.back()}
            className="bg-orange-500 hover:bg-orange-600 text-white border-none shadow-sm"
            icon={<ArrowLeft size={16} />}
          >
            Kembali
          </Button>
        }
      />

      <div className="card">
        <div className="card-body p-6">
          {/* Info Banner SSO */}
          <div className="mb-6 p-4 rounded-xl bg-primary-50 border border-primary-200 text-primary-900 flex items-start gap-3">
            <Info size={20} className="text-primary-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-primary-900">Pembuatan Akun SSO Otomatis</p>
              <p className="text-primary-700 mt-0.5">
                Pegawai yang ditambahkan akan secara otomatis dibuatkan akun SSO (IAM) dengan default password: <strong className="font-mono bg-primary-100 px-1.5 py-0.5 rounded text-primary-800">indonusa</strong>.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              
              <Input
                label="Gelar Depan (Opsional)"
                placeholder="Contoh: Dr., Prof."
                error={errors.gelar_depan?.message}
                {...register('gelar_depan')}
              />

              <Input
                label="Nama Lengkap"
                required
                placeholder="Contoh: Wasis Utama"
                error={errors.nama_lengkap?.message}
                {...register('nama_lengkap')}
              />

              <Input
                label="Gelar Belakang (Opsional)"
                placeholder="Contoh: M.Kom., Ph.D."
                error={errors.gelar_belakang?.message}
                {...register('gelar_belakang')}
              />

              <Input
                label="NIP (Nomor Induk Pegawai)"
                required
                placeholder="Contoh: 199001012022011001"
                error={errors.nip?.message}
                {...register('nip')}
              />

              <Input
                label="NIDN (Nomor Induk Dosen Nasional)"
                required
                placeholder="Contoh: 0415018501"
                error={errors.nidn?.message}
                {...register('nidn')}
              />

              <Input
                label="NUPTK (Nomor Pendidik & Tenaga Kependidikan)"
                required
                placeholder="Contoh: 3560763664230001"
                error={errors.nuptk?.message}
                {...register('nuptk')}
              />

              <Input
                type="date"
                label="Tanggal Masuk"
                required
                error={errors.tanggal_masuk?.message}
                {...register('tanggal_masuk')}
              />

              <Input
                label="NIK (KTP)"
                placeholder="Contoh: 327101..."
                error={errors.nik?.message}
                {...register('nik')}
              />

              <Input
                type="email"
                label="Alamat Email (Opsional)"
                placeholder="Contoh: nama@campus.ac.id"
                error={errors.email?.message}
                {...register('email')}
              />

              <div className="md:col-span-2 lg:col-span-3">
                <Controller
                  name="role_ids"
                  control={control}
                  render={({ field }) => (
                    <AsyncSelect
                      label="Jenis Pegawai / Peran SSO (Dapat Memilih Lebih Dari 1)"
                      required
                      isMulti
                      placeholder="Cari dan pilih jenis pegawai / role..."
                      value={
                        Array.isArray(field.value)
                          ? field.value.map((v: any) =>
                              typeof v === 'object' && v !== null
                                ? v
                                : { value: String(v), label: `Role ID: ${v}` }
                            )
                          : []
                      }
                      onChange={(selectedOptions: any) => {
                        field.onChange(
                          Array.isArray(selectedOptions)
                            ? selectedOptions.map((opt: any) => opt.value)
                            : []
                        );
                      }}
                      loadOptions={loadRoleOptions}
                      error={errors.role_ids?.message as string}
                    />
                  )}
                />
              </div>

              <Controller
                name="status_kepegawaian"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Status Kepegawaian"
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
                    label="Status Keaktifan"
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
                      value={field.value ? { value: field.value, label: field.value } : null}
                      onChange={(opt) => field.onChange(opt ? opt.value : '')}
                      isClearable
                      error={errors.unit_kerja_id?.message}
                    />
                  )}
                />
              </div>

              <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Controller
                  name="shift_template_id"
                  control={control}
                  render={({ field }) => (
                    <AsyncSelect
                      label="Shift Kerja (Jadwal Presensi)"
                      required
                      placeholder="Cari tipe shift (contoh: Reguler / Pagi / Malam)..."
                      hint="Menentukan jam masuk-pulang & hari libur mingguan pegawai."
                      loadOptions={loadShiftOptions}
                      value={field.value ? { value: field.value, label: field.value } : null}
                      onChange={(opt) => field.onChange(opt ? opt.value : '')}
                      isClearable={false}
                      error={errors.shift_template_id?.message}
                    />
                  )}
                />
                <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-3 self-center">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <h5 className="font-semibold text-xs text-slate-800">Multi-Lokasi Presensi Otomatis</h5>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      Pegawai otomatis dapat melakukan presensi di semua lokasi kampus/kantor terdaftar yang aktif saat berada dalam radius GPS terdekat.
                    </p>
                  </div>
                </div>
              </div>

              <Input
                label="Tempat Lahir"
                placeholder="Contoh: Bandung"
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
                    label="Jenis Kelamin"
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
                label="Nomor Telepon / WA"
                placeholder="Contoh: 081234567890"
                error={errors.telepon?.message}
                {...register('telepon')}
              />

              <div className="lg:col-span-2">
                <Textarea
                  label="Alamat Domisili Lengkap"
                  placeholder="Jl. Kampus Utama No. 12, Bandung"
                  rows={2}
                  error={errors.alamat?.message}
                  {...register('alamat')}
                />
              </div>

            </div>

            <div className="flex justify-end gap-3 mt-8 border-t pt-6">
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
              >
                Simpan Data Pegawai
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
