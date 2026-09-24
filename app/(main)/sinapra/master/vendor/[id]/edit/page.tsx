'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { sinapraService } from '@/services/sinapra.service';
import { referensiService } from '@/services/referensi.service';

const vendorSchema = z.object({
  kode: z.string().trim().min(2, 'Kode vendor minimal 2 karakter').max(50, 'Kode maksimal 50 karakter'),
  nama: z.string().trim().min(2, 'Nama vendor minimal 2 karakter').max(150, 'Nama maksimal 150 karakter'),
  jenis_rekanan: z.string().min(1, 'Jenis rekanan wajib dipilih'),
  pic_nama: z.string().optional(),
  pic_kontak: z.string().optional(),
  telepon: z.string().optional(),
  email: z.string().email('Format email tidak valid').optional().or(z.literal('')),
  alamat: z.string().optional(),
  nomor_npwp: z.string().optional(),
  urutan: z.number().min(1, 'Urutan minimal 1'),
  is_active: z.boolean(),
});

type VendorFormData = z.infer<typeof vendorSchema>;

export default function EditMasterVendorPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params?.id);
  const [isLoading, setIsLoading] = useState(true);
  const [jenisRekananOptions, setJenisRekananOptions] = useState<{ value: string; label: string }[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VendorFormData>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      kode: '',
      nama: '',
      jenis_rekanan: '',
      pic_nama: '',
      pic_kontak: '',
      telepon: '',
      email: '',
      alamat: '',
      nomor_npwp: '',
      urutan: 1,
      is_active: true,
    },
  });

  useEffect(() => {
    const loadJenisRekanan = async () => {
      try {
        const res = await referensiService.getAll({ modul: 'sinapra', tipe: 'jenis_rekanan' });
        if (Array.isArray(res) && res.length > 0) {
          setJenisRekananOptions(
            res.map((item) => ({
              value: item.kode || String(item.id),
              label: item.nama,
            }))
          );
        }
      } catch {
        // Fallback silently
      }
    };
    loadJenisRekanan();
  }, []);

  useEffect(() => {
    if (!id) return;
    const fetchVendor = async () => {
      setIsLoading(true);
      try {
        const res: any = await sinapraService.getMasterVendorDetail(id);
        const data = res?.data;
        if (data) {
          reset({
            kode: data.kode || '',
            nama: data.nama || '',
            jenis_rekanan: data.jenis_rekanan || 'penyedia_barang',
            pic_nama: data.pic_nama || '',
            pic_kontak: data.pic_kontak || '',
            telepon: data.telepon || '',
            email: data.email || '',
            alamat: data.alamat || '',
            nomor_npwp: data.nomor_npwp || '',
            urutan: data.urutan || 1,
            is_active: Boolean(data.is_active),
          });
        }
      } catch {
        toast.error('Gagal memuat data vendor');
        router.push('/sinapra/master/vendor');
      } finally {
        setIsLoading(false);
      }
    };
    fetchVendor();
  }, [id, reset, router]);

  const onSubmit = async (data: VendorFormData) => {
    try {
      await sinapraService.updateMasterVendor(id, data);
      toast.success('Data vendor berhasil diperbarui');
      router.push('/sinapra/master/vendor');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memperbarui vendor');
    }
  };

  if (isLoading) {
    return (
      <div className="flex w-full flex-col gap-4">
        <PageHeader title="Edit Master Vendor" />
        <div className="flex justify-center p-4 md:p-6 bg-white rounded-lg border border-slate-200">
          <p className="text-xs text-slate-500">Memuat data vendor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <PageHeader
        title="Edit Rekanan / Vendor"
        description="Perubahan informasi identitas, narahubung, atau kontak vendor rekanan kampus"
        action={
          <Button
            variant="outline"
            icon={<ArrowLeft size={16} />}
            onClick={() => router.push('/sinapra/master/vendor')}
            style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
          >
            Kembali
          </Button>
        }
      />

      <div className="rounded-lg border border-slate-200 bg-white p-4 md:p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Section 1: Identitas Vendor */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              1. Identitas Rekanan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Kode Vendor"
                  placeholder="Contoh: VND-LAB-01"
                  {...register('kode')}
                />
                {errors.kode && (
                  <p className="text-xs text-rose-500">{errors.kode.message}</p>
                )}
              </div>

              <div>
                <Input
                  label="Nama Vendor / Rekanan"
                  placeholder="Contoh: PT Kalibrasi Presisi Indonesia"
                  {...register('nama')}
                />
                {errors.nama && (
                  <p className="text-xs text-rose-500">{errors.nama.message}</p>
                )}
              </div>

              <div>
                <Select
                  label="Jenis Rekanan"
                  value={watch('jenis_rekanan')}
                  onChange={(val) => setValue('jenis_rekanan', val as any)}
                  options={jenisRekananOptions}
                />
              </div>

              <div>
                <Input
                  label="Nomor NPWP"
                  placeholder="Contoh: 01.234.567.8-001.000"
                  {...register('nomor_npwp')}
                />
              </div>

              <div>
                <Input
                  label="Nomor Urutan"
                  type="number"
                  placeholder="1"
                  {...register('urutan', { valueAsNumber: true })}
                />
                {errors.urutan && (
                  <p className="text-xs text-rose-500">{errors.urutan.message}</p>
                )}
              </div>

              <div className="flex items-center">
                <Checkbox
                  label="Aktif"
                  checked={watch('is_active')}
                  onChange={(e) => setValue('is_active', e.target.checked)}
                />
              </div>
            </div>
          </div>

          <hr className="my-4 border-slate-200" />

          {/* Section 2: Person in Charge (PIC) & Kontak */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              2. PIC & Informasi Kontak
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Nama PIC"
                  placeholder="Nama narahubung vendor..."
                  {...register('pic_nama')}
                />
              </div>

              <div>
                <Input
                  label="Kontak HP / WA PIC"
                  placeholder="Contoh: 081234567890"
                  {...register('pic_kontak')}
                />
              </div>

              <div>
                <Input
                  label="Nomor Telepon Kantor"
                  placeholder="Contoh: 021-4601234"
                  {...register('telepon')}
                />
              </div>

              <div>
                <Input
                  label="Email Resmi"
                  placeholder="sales@vendor.co.id"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-xs text-rose-500">{errors.email.message}</p>
                )}
              </div>
            </div>
          </div>

          <hr className="my-4 border-slate-200" />

          {/* Section 3: Alamat Operasional */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              3. Alamat Operasional
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <Textarea
                label="Alamat Lengkap Kantor / Bengkel"
                placeholder="Jl. Raya Industri Blok B No. 12, Kawasan Industri..."
                {...register('alamat')}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              icon={<X size={16} />}
              onClick={() => router.push('/sinapra/master/vendor')}
            >
              Batal
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              disabled={isSubmitting}
              icon={<Save size={16} />}
              style={{ background: 'var(--module-primary)' }}
            >
              Perbarui Vendor
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
