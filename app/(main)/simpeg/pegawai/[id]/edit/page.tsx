'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, RefreshCw, ScanFace, RotateCcw, CheckCircle2, MapPin } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Textarea } from '@/components/ui/Textarea';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { simpegService } from '@/services/simpeg.service';
import type { Pegawai, UnitKerja } from '@/types/simpeg.types';

const pegawaiSchema = z.object({
  nama_lengkap: z.string().min(1, 'Nama Lengkap wajib diisi'),
  gelar_depan: z.string().optional().nullable(),
  gelar_belakang: z.string().optional().nullable(),
  nidn: z.string().optional().nullable(),
  nuptk: z.string().optional().nullable(),
  nip: z.string().optional().nullable(),
  nik: z.string().optional().nullable(),
  tanggal_masuk: z.string().optional().nullable(),
  unit_kerja_id: z.string().optional().nullable(),
  role_ids: z.array(z.string().or(z.number())).min(1, 'Pilih minimal satu jenis pegawai / peran SSO'),
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
  nama_bank: z.string().optional().nullable(),
  bank_nama: z.string().optional().nullable(),
  nomor_rekening: z.string().optional().nullable(),
  nama_rekening: z.string().optional().nullable(),
  shift_template_id: z.string().optional().nullable(),
});

type PegawaiFormValues = z.infer<typeof pegawaiSchema>;

export default function EditPegawaiPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const pegawaiId = Number(resolvedParams.id);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pegawaiData, setPegawaiData] = useState<Pegawai | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [selectedUnitOption, setSelectedUnitOption] = useState<{ value: string; label: string } | null>(null);
  const [selectedShiftOption, setSelectedShiftOption] = useState<{ value: string; label: string } | null>(null);
  const [selectedRoleOptions, setSelectedRoleOptions] = useState<{ value: string; label: string }[]>([]);

  const handleResetBiometric = async () => {
    setIsResetting(true);
    try {
      const res = await simpegService.resetFaceBiometric(pegawaiId);
      toast.success(res.message || 'Data biometrik wajah pegawai berhasil direset.');
      setPegawaiData((prev) => (prev ? { ...prev, is_face_enrolled: false, face_enrolled_at: null } : null));
      setShowResetConfirm(false);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      toast.error(errorObj?.response?.data?.message || 'Gagal mereset biometrik pegawai.');
    } finally {
      setIsResetting(false);
    }
  };

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
      gelar_depan: '',
      gelar_belakang: '',
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
      nama_bank: '',
      bank_nama: '',
      nomor_rekening: '',
      nama_rekening: '',
      shift_template_id: '',
    },
  });

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

  const loadShiftOptions = useCallback(async (inputValue: string) => {
    try {
      const res = await simpegService.getShiftTemplates();
      const shifts = (res.data || []) as Array<{ id: number; name: string; is_active?: boolean }>;
      return shifts
        .filter((s) => s.name.toLowerCase().includes(inputValue.toLowerCase()))
        .map((s) => ({
          value: s.id.toString(),
          label: s.is_active ? s.name : `${s.name} (Non-Aktif)`,
        }));
    } catch (err) {
      console.error('Gagal memuat opsi shift kerja', err);
      return [];
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [resPegawai] = await Promise.all([
          simpegService.getPegawaiDetail(pegawaiId),
          simpegService.getUnitKerjaList(),
        ]);

        const peg = resPegawai.data;
        if (peg) {
          setPegawaiData(peg);
          const initialRoles = (peg.roles || []).map((r: { id: number; name: string }) => ({
            value: String(r.id),
            label: r.name,
          }));
          setSelectedRoleOptions(initialRoles);

          const formVals: PegawaiFormValues = {
            unit_kerja_id: peg.unit_kerja_id ? String(peg.unit_kerja_id) : '',
            nidn: peg.nidn || '',
            nuptk: peg.nuptk || '',
            nip: peg.nip || '',
            nik: peg.nik || '',
            nama_lengkap: peg.nama_lengkap || '',
            gelar_depan: peg.gelar_depan || '',
            gelar_belakang: peg.gelar_belakang || '',
            tanggal_masuk: peg.tanggal_masuk ? peg.tanggal_masuk.slice(0, 10) : '',
            role_ids: initialRoles.map((r) => r.value),
            tempat_lahir: peg.tempat_lahir || '',
            tanggal_lahir: peg.tanggal_lahir || '',
            jenis_kelamin: peg.jenis_kelamin || 'L',
            status_kepegawaian: peg.status_kepegawaian || 'tetap_yayasan',
            status: peg.status || 'aktif',
            telepon: peg.telepon || '',
            alamat: peg.alamat || '',
            nama_bank: peg.nama_bank || peg.bank_nama || '',
            bank_nama: peg.bank_nama || peg.nama_bank || '',
            nomor_rekening: peg.nomor_rekening || '',
            nama_rekening: peg.nama_rekening || '',
            shift_template_id: peg.shift_template_id ? String(peg.shift_template_id) : '',
          };
          reset(formVals);

          if (peg.unit_kerja) {
            setSelectedUnitOption({
              value: String(peg.unit_kerja.id),
              label: `[${peg.unit_kerja.kode}] ${peg.unit_kerja.nama}`,
            });
          }
          if (peg.shift_template) {
            setSelectedShiftOption({
              value: String(peg.shift_template.id),
              label: peg.shift_template.name,
            });
          }
        }
      } catch (err: unknown) {
        const errorObj = err as { response?: { data?: { message?: string } } };
        toast.error(errorObj?.response?.data?.message || 'Gagal memuat data pegawai');
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
        nidn: values.nidn || null,
        nuptk: values.nuptk || null,
        nip: values.nip || null,
        nik: values.nik || null,
        nama_lengkap: values.nama_lengkap,
        gelar_depan: values.gelar_depan || null,
        gelar_belakang: values.gelar_belakang || null,
        tanggal_masuk: values.tanggal_masuk || null,
        role_ids: values.role_ids.map(Number),
        tempat_lahir: values.tempat_lahir || null,
        tanggal_lahir: values.tanggal_lahir || null,
        jenis_kelamin: values.jenis_kelamin,
        status_kepegawaian: values.status_kepegawaian,
        status: values.status,
        telepon: values.telepon || null,
        alamat: values.alamat || null,
        nama_bank: values.nama_bank || values.bank_nama || null,
        bank_nama: values.bank_nama || values.nama_bank || null,
        nomor_rekening: values.nomor_rekening || null,
        nama_rekening: values.nama_rekening || null,
        shift_template_id: values.shift_template_id ? Number(values.shift_template_id) : null,
      };

      await simpegService.updatePegawai(pegawaiId, payload);
      toast.success('Data Pegawai berhasil diperbarui!');
      router.push('/simpeg/pegawai');
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      toast.error(errorObj?.response?.data?.message || 'Gagal memperbarui data pegawai');
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
                placeholder="Ketik NIP pegawai..."
                error={errors.nip?.message}
                {...register('nip')}
              />

              <Input
                label="NIDN (Nomor Induk Dosen Nasional)"
                placeholder="Ketik NIDN dosen..."
                error={errors.nidn?.message}
                {...register('nidn')}
              />

              <Input
                label="NUPTK (Nomor Pendidik & Tenaga Kependidikan)"
                placeholder="Ketik NUPTK..."
                error={errors.nuptk?.message}
                {...register('nuptk')}
              />

              <Input
                type="date"
                label="Tanggal Masuk"
                error={errors.tanggal_masuk?.message}
                {...register('tanggal_masuk')}
              />

              <Input
                label="NIK (KTP)"
                placeholder="Ketik NIK 16 digit..."
                error={errors.nik?.message}
                {...register('nik')}
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
                      value={selectedRoleOptions}
                      onChange={(selectedOptions: unknown) => {
                        const opts = Array.isArray(selectedOptions)
                          ? (selectedOptions as Array<{ value: string; label: string }>)
                          : [];
                        setSelectedRoleOptions(opts);
                        field.onChange(opts.map((opt) => opt.value));
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

              <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Controller
                  name="shift_template_id"
                  control={control}
                  render={({ field }) => (
                    <AsyncSelect
                      label="Shift Kerja (Jadwal Presensi)"
                      placeholder="Cari tipe shift (contoh: Reguler / Pagi / Malam)..."
                      hint="Menentukan jam masuk-pulang & hari libur mingguan pegawai."
                      loadOptions={loadShiftOptions}
                      value={selectedShiftOption || (field.value ? { value: field.value, label: field.value } : null)}
                      onChange={(opt) => {
                        setSelectedShiftOption(opt);
                        field.onChange(opt ? opt.value : '');
                      }}
                      isClearable
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

              {/* SECTION: DATA BIOMETRIK WAJAH */}
              <div className="lg:col-span-3 p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-primary-600 shadow-sm shrink-0">
                    <ScanFace size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-800">Biometrik Wajah Presensi Mobile</span>
                      {pegawaiData?.is_face_enrolled ? (
                        <Badge variant="green" className="text-xs">
                          <CheckCircle2 size={12} className="mr-1 inline" /> Wajah Terdaftar
                        </Badge>
                      ) : (
                        <Badge variant="gray" className="text-xs">
                          Belum Terdaftar
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {pegawaiData?.is_face_enrolled ? (
                        <>
                          Data biometrik aktif untuk verifikasi presensi di aplikasi mobile
                          {pegawaiData.face_enrolled_at ? ` (didaftarkan pada: ${new Date(pegawaiData.face_enrolled_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })})` : ''}.
                        </>
                      ) : (
                        'Pegawai belum mendaftarkan data wajah. Pendaftaran dilakukan secara mandiri melalui aplikasi mobile presensi.'
                      )}
                    </p>
                  </div>
                </div>

                {pegawaiData?.is_face_enrolled && (
                  <Button
                    type="button"
                    variant="outline"
                    className="text-rose-600 border-rose-300 hover:bg-rose-50 hover:border-rose-400 text-xs shrink-0 self-start sm:self-center"
                    icon={<RotateCcw size={14} />}
                    onClick={() => setShowResetConfirm(true)}
                  >
                    Reset Biometrik Wajah
                  </Button>
                )}
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
                label="Nomor Telepon / WhatsApp"
                placeholder="Ketik Nomor HP / WA..."
                error={errors.telepon?.message}
                {...register('telepon')}
              />

              <Input
                label="Nama Bank Pencairan"
                placeholder="Contoh: Bank Mandiri / BNI / BRI"
                error={errors.bank_nama?.message || errors.nama_bank?.message}
                {...register('bank_nama')}
              />

              <Input
                label="Nomor Rekening Bank"
                placeholder="Ketik Nomor Rekening..."
                error={errors.nomor_rekening?.message}
                {...register('nomor_rekening')}
              />

              <Input
                label="Nama Pemilik Rekening (Atas Nama)"
                placeholder="Contoh: Dr. Ir. Budi Santoso, M.Kom"
                error={errors.nama_rekening?.message}
                {...register('nama_rekening')}
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

      <ConfirmDialog
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleResetBiometric}
        title="Reset Biometrik Wajah"
        message={
          <div>
            Apakah Anda yakin ingin mereset data biometrik wajah pegawai <strong>{pegawaiData?.nama_lengkap}</strong>?
            <p className="mt-2 text-xs text-rose-600 font-semibold">
              Data vektor biometrik akan dihapus dan pegawai harus mendaftarkan ulang wajahnya melalui aplikasi mobile presensi.
            </p>
          </div>
        }
        confirmText="Ya, Reset Biometrik"
        cancelText="Batal"
        variant="danger"
        isLoading={isResetting}
      />
    </div>
  );
}
