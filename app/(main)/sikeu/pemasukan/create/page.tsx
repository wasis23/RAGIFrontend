'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useForm } from 'react-hook-form';

interface FormValues {
  sumber_pemasukan: string;
  nominal: number;
  tanggal_terima: string;
  nama_donor_instansi: string;
  nomor_kontrak_ref: string;
  keterangan: string;
}

export default function CreatePemasukanPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      sumber_pemasukan: 'hibah_sippm',
      nominal: 10000000,
      tanggal_terima: new Date().toISOString().split('T')[0],
      nama_donor_instansi: '',
      nomor_kontrak_ref: '',
      keterangan: '',
    },
  });

  const onSubmitForm = async (formData: FormValues) => {
    setSubmitting(true);
    try {
      await sikeuService.storeExternalIncome({
        sumber_pemasukan: formData.sumber_pemasukan,
        nominal: Number(formData.nominal),
        tanggal_terima: formData.tanggal_terima,
        nama_donor_instansi: formData.nama_donor_instansi,
        nomor_kontrak_ref: formData.nomor_kontrak_ref || undefined,
        keterangan: formData.keterangan || undefined,
      });

      toast.success('Transaksi pemasukan hibah/donasi berhasil dicatat!');
      router.push('/sikeu/pemasukan');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal menyimpan transaksi pemasukan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <PageHeader
        title="Catat Pemasukan Hibah & Donasi"
        description="Pencatatan dana hibah riset SIPPM, donatur instansi, donasi alumni, atau pendapatan usaha kampus."
        action={
          <Button
            variant="outline"
            icon={<ArrowLeft size={16} />}
            onClick={() => router.push('/sikeu/pemasukan')}
            className="font-bold min-h-[40px]"
          >
            Kembali
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Sumber Pemasukan *"
              options={[
                { value: 'hibah_sippm', label: 'Hibah Riset / PkM (SIPPM)' },
                { value: 'donatur', label: 'Donatur & Beasiswa Mitra' },
                { value: 'kerjasama', label: 'Kerjasama Industri / Instansi' },
                { value: 'pendapatan_lainnya', label: 'Pendapatan Non-Akademik Lainnya' },
              ]}
              value={watch('sumber_pemasukan')}
              onChange={(val) => setValue('sumber_pemasukan', val as string)}
            />

            <Input
              type="date"
              label="Tanggal Terima Dana *"
              {...register('tanggal_terima', { required: 'Tanggal terima wajib diisi' })}
              error={errors.tanggal_terima?.message}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="number"
              label="Nominal Diterima (Rp) *"
              placeholder="10000000"
              {...register('nominal', { required: 'Nominal wajib diisi', valueAsNumber: true, min: { value: 1, message: 'Nominal harus lebih dari 0' } })}
              error={errors.nominal?.message}
            />

            <Input
              label="Nama Donor / Instansi Mitra *"
              placeholder="Contoh: PT Telkom Indonesia Tbk"
              {...register('nama_donor_instansi', { required: 'Nama donor/instansi wajib diisi' })}
              error={errors.nama_donor_instansi?.message}
            />
          </div>

          <Input
            label="Nomor Kontrak / SK Referensi (Opsional)"
            placeholder="Contoh: SK-HIBAH/2026/08/001"
            {...register('nomor_kontrak_ref')}
          />

          <Textarea
            label="Keterangan & Peruntukan Dana *"
            placeholder="Penjelasan mengenai penggunaan dana hibah..."
            {...register('keterangan', { required: 'Keterangan wajib diisi' })}
            error={errors.keterangan?.message}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push('/sikeu/pemasukan')}
              disabled={submitting}
              className="font-bold text-slate-600"
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              icon={submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              className="font-bold shadow-md min-h-[44px] px-6"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Pemasukan'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
