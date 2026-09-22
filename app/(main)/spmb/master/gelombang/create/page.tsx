'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { spmbService } from '@/services/spmb.service';
import { GelombangPenerimaan } from '@/types/spmb.types';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/layout/PageHeader';
import api from '@/lib/axios';

// ============================================================
// VALIDATION SCHEMA (MANDATORY ZOD STANDARD)
// ============================================================
const gelombangFormSchema = z.object({
  nama: z.string().min(1, 'Nama gelombang wajib diisi').max(255, 'Nama gelombang maksimal 255 karakter'),
  jalur_masuk_id: z.number().min(1, 'Jalur masuk wajib dipilih'),
  tahun_akademik_id: z.number().min(1, 'Tahun akademik wajib dipilih'),
  master_biaya_id: z.number().min(1, 'Tarif biaya pendaftaran SIKEU wajib dipilih'),
  biaya_pendaftaran: z.number().min(0, 'Biaya pendaftaran minimal 0').optional(),
  kuota_total: z.number().min(1, 'Kuota pendaftar minimal 1'),
  tanggal_buka: z.string().min(1, 'Tanggal buka pendaftaran wajib diisi'),
  tanggal_tutup: z.string().min(1, 'Tanggal tutup pendaftaran wajib diisi'),
  tanggal_pengumuman: z.string().optional().nullable(),
  status: z.enum(['draft', 'aktif', 'ditutup', 'selesai']),
}).refine((data) => {
  if (data.tanggal_buka && data.tanggal_tutup) {
    return new Date(data.tanggal_tutup) >= new Date(data.tanggal_buka);
  }
  return true;
}, {
  message: 'Tanggal tutup pendaftaran harus setelah tanggal buka',
  path: ['tanggal_tutup'],
});

type GelombangFormValues = z.infer<typeof gelombangFormSchema>;

export default function CreateGelombangPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<GelombangFormValues>({
    resolver: zodResolver(gelombangFormSchema) as any,
    defaultValues: {
      nama: '',
      kuota_total: 100,
      status: 'draft',
      biaya_pendaftaran: 0,
      tanggal_buka: '',
      tanggal_tutup: '',
      tanggal_pengumuman: '',
    }
  });

  const selectedBiaya = watch('biaya_pendaftaran');
  const tglBuka = watch('tanggal_buka');
  const tglTutup = watch('tanggal_tutup');

  const loadTahunAkademik = useCallback(async (input: string) => {
    try {
      const res = await spmbService.getTahunAkademikList();
      const list = res?.data || [];
      return list
        .filter((t: any) => (t.nama || `${t.tahun_mulai}/${t.tahun_selesai}`).toLowerCase().includes(input.toLowerCase()))
        .map((t: any) => ({
          value: t.id,
          label: t.nama || `${t.tahun_mulai}/${t.tahun_selesai}`,
          ...t
        }));
    } catch {
      return [];
    }
  }, []);

  const loadJalurMasuk = useCallback(async (input: string) => {
    try {
      const res = await spmbService.getJalurMasuk();
      const list = res?.data || [];
      return list
        .filter((j: any) => j.is_active && (j.nama || '').toLowerCase().includes(input.toLowerCase()))
        .map((j: any) => ({
          value: j.id,
          label: j.nama,
          ...j
        }));
    } catch {
      return [];
    }
  }, []);

  const loadMasterBiaya = useCallback(async (input: string) => {
    try {
      const response = await api.get('/v1/sikeu/master/master-biaya?module_code=spmb');
      const list = response.data?.data || [];
      return list
        .filter((item: any) => 
          (item.nama || '').toLowerCase().includes(input.toLowerCase()) || 
          (item.kode || '').toLowerCase().includes(input.toLowerCase())
        )
        .map((item: any) => ({
          value: item.id,
          label: `[${item.kode}] ${item.nama} (Rp ${Number(item.nominal_standar || 0).toLocaleString('id-ID')})`,
          ...item
        }));
    } catch {
      return [];
    }
  }, []);

  const onSubmit = async (data: Partial<GelombangPenerimaan>) => {
    if (data.tanggal_buka && data.tanggal_tutup && new Date(data.tanggal_tutup) < new Date(data.tanggal_buka)) {
      toast.error('Tanggal tutup pendaftaran harus setelah tanggal buka');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...data,
        jalur_masuk_id: Number(data.jalur_masuk_id),
        tahun_akademik_id: Number(data.tahun_akademik_id),
        master_biaya_id: data.master_biaya_id ? Number(data.master_biaya_id) : undefined,
        biaya_pendaftaran: data.biaya_pendaftaran !== undefined ? Number(data.biaya_pendaftaran) : undefined,
      };
      await spmbService.createGelombang(payload as any);
      toast.success('Gelombang penerimaan baru berhasil ditambahkan');
      router.push('/spmb/master/gelombang');
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan data gelombang');
    } finally {
      setLoading(false);
    }
  };

  const isDateInvalid = Boolean(tglBuka && tglTutup && new Date(tglTutup) < new Date(tglBuka));

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Tambah Gelombang"
        description="Buat periode gelombang pendaftaran SPMB baru beserta biaya dan jadwalnya."
        action={
          <Button
            variant="outline"
            onClick={() => router.back()} 
            style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
            icon={<ArrowLeft size={16} />}
          >
            Kembali
          </Button>
        }
      />

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* GRID LAYOUT MAKS 3 KOLOM */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Controller
                  name="tahun_akademik_id"
                  control={control}
                  render={({ field }) => (
                    <AsyncSelect
                      label="Tahun Akademik"
                      required
                      placeholder="Pilih Tahun Akademik..."
                      loadOptions={loadTahunAkademik}
                      defaultOptions
                      value={field.value}
                      onChange={(opt: any) => field.onChange(opt ? Number(opt.value) : undefined)}
                      error={errors.tahun_akademik_id?.message}
                      hint="Tahun akademik penerimaan."
                    />
                  )}
                />
              </div>

              <div>
                <Controller
                  name="jalur_masuk_id"
                  control={control}
                  render={({ field }) => (
                    <AsyncSelect
                      label="Jalur Masuk"
                      required
                      placeholder="Pilih Jalur Masuk..."
                      loadOptions={loadJalurMasuk}
                      defaultOptions
                      value={field.value}
                      onChange={(opt: any) => field.onChange(opt ? Number(opt.value) : undefined)}
                      error={errors.jalur_masuk_id?.message}
                      hint="Jalur penerimaan yang dinaungi."
                    />
                  )}
                />
              </div>

              <div>
                <Input 
                  label="Nama Gelombang"
                  placeholder="Contoh: Gelombang 1 - Prestasi"
                  required
                  error={errors.nama?.message}
                  {...register('nama')} 
                />
              </div>

              <div>
                <Input 
                  type="number"
                  label="Kuota Pendaftar"
                  placeholder="100"
                  required
                  hint="Jumlah maksimal kuota pendaftar."
                  error={errors.kuota_total?.message}
                  {...register('kuota_total', { valueAsNumber: true })} 
                />
              </div>

              <div>
                <Controller
                  name="master_biaya_id"
                  control={control}
                  render={({ field }) => (
                    <AsyncSelect
                      label="Tarif Biaya (Mapping SIKEU)"
                      required
                      placeholder="Pilih Tarif Keuangan SIKEU..."
                      loadOptions={loadMasterBiaya}
                      defaultOptions
                      value={field.value}
                      onChange={(opt: any) => {
                        const id = opt ? Number(opt.value) : undefined;
                        field.onChange(id);
                        if (opt) {
                          const nominal = Number(opt.nominal_standar ?? opt.nominal ?? 0);
                          setValue('biaya_pendaftaran', nominal);
                        }
                      }}
                      error={errors.master_biaya_id?.message}
                      hint={selectedBiaya ? `Nominal: Rp ${Number(selectedBiaya).toLocaleString('id-ID')}` : 'Pilih tarif master modul SIKEU.'}
                    />
                  )}
                />
              </div>

              <div>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Status Gelombang"
                      required
                      options={[
                        { value: 'draft', label: 'Draft (Belum Dipublikasikan)' },
                        { value: 'aktif', label: 'Aktif (Sedang Berjalan / Dibuka)' },
                        { value: 'ditutup', label: 'Ditutup (Pendaftaran Berakhir)' },
                        { value: 'selesai', label: 'Selesai (Sudah Pengumuman)' }
                      ]}
                      value={field.value}
                      onChange={field.onChange}
                      hint="Status keaktifan gelombang."
                      error={errors.status?.message}
                    />
                  )}
                />
              </div>

              <div>
                <Input 
                  type="date"
                  label="Tanggal Buka Pendaftaran"
                  required
                  error={errors.tanggal_buka?.message}
                  {...register('tanggal_buka')} 
                />
              </div>

              <div>
                <Input 
                  type="date"
                  label="Tanggal Tutup Pendaftaran"
                  required
                  error={errors.tanggal_tutup?.message || (isDateInvalid ? 'Tanggal tutup harus setelah tanggal buka' : undefined)}
                  {...register('tanggal_tutup')} 
                />
              </div>

              <div>
                <Input 
                  type="date"
                  label="Tanggal Pengumuman"
                  hint="Opsional, jadwal pengumuman kelulusan."
                  error={errors.tanggal_pengumuman?.message}
                  {...register('tanggal_pengumuman')} 
                />
              </div>
            </div>

            {/* ACTION AREA */}
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
                disabled={loading}
              >
                Batal
              </Button>
              
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                disabled={loading || isDateInvalid}
                icon={<Save size={16} />}
              >
                Simpan Gelombang
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

