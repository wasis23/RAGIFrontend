'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, ShieldAlert } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { simpegService } from '@/services/simpeg.service';
import type { StatusTransferGaji, Pegawai } from '@/types/simpeg.types';
import { useAuth } from '@/hooks/useAuth';

interface OptionType {
  value: string;
  label: string;
}

const payrollSchema = z.object({
  pegawai_id: z.string().min(1, 'Pegawai wajib dipilih'),
  periode_bulan_tahun: z.string().min(1, 'Periode wajib diisi (YYYY-MM)'),
  gaji_pokok: z.number().min(0, 'Gaji pokok minimal 0'),
  total_tunjangan: z.number().min(0, 'Total tunjangan minimal 0'),
  total_potongan: z.number().min(0, 'Total potongan minimal 0'),
  gaji_bersih: z.number().min(0, 'Gaji bersih minimal 0'),
  status_transfer: z.enum(['pending', 'paid', 'failed'], {
    message: 'Status transfer wajib dipilih',
  }),
  nomor_rekening: z.string().optional().nullable(),
  bank_nama: z.string().optional().nullable(),
});

type PayrollFormValues = z.infer<typeof payrollSchema>;

export default function CreatePayrollPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('simpeg.payroll.create') || hasPermission('simpeg.payroll.manage');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPegawaiOption, setSelectedPegawaiOption] = useState<OptionType | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<PayrollFormValues>({
    resolver: zodResolver(payrollSchema),
    defaultValues: {
      pegawai_id: '',
      periode_bulan_tahun: new Date().toISOString().slice(0, 7),
      gaji_pokok: 4500000,
      total_tunjangan: 1500000,
      total_potongan: 250000,
      gaji_bersih: 5750000,
      status_transfer: 'paid',
      nomor_rekening: '',
      bank_nama: '',
    },
  });

  const loadPegawaiOptions = useCallback(async (inputValue: string) => {
    try {
      const res: any = await simpegService.getPegawaiList();
      const list: Pegawai[] = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      const filtered = list.filter(
        (p: Pegawai) =>
          p.nama_lengkap.toLowerCase().includes(inputValue.toLowerCase()) ||
          (p.nip && p.nip.toLowerCase().includes(inputValue.toLowerCase()))
      );
      return filtered.map((p: Pegawai) => ({
        value: p.id.toString(),
        label: `[NIP: ${p.nip || '-'}] ${p.nama_lengkap}`,
      }));
    } catch (err) {
      console.error('Gagal memuat opsi pegawai', err);
      return [];
    }
  }, []);

  const onSubmit = async (values: PayrollFormValues) => {
    if (!canCreate) {
      toast.error('Akses Ditolak: Anda tidak memiliki permission menerbitkan slip gaji.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        pegawai_id: Number(values.pegawai_id),
        periode_bulan_tahun: values.periode_bulan_tahun,
        gaji_pokok: values.gaji_pokok,
        total_tunjangan: values.total_tunjangan,
        total_potongan: values.total_potongan,
        gaji_bersih: values.gaji_bersih,
        status_transfer: values.status_transfer as StatusTransferGaji,
        nomor_rekening: values.nomor_rekening || undefined,
        bank_nama: values.bank_nama || undefined,
      };

      await simpegService.createPayroll(payload);
      toast.success('Slip gaji berhasil diterbitkan & terposting ke Jurnal SIKEU!');
      router.push('/simpeg/payroll');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menerbitkan slip gaji');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canCreate) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Terbitkan Payroll Slip Gaji Baru"
          description="Posting gaji dan tunjangan pegawai ke Jurnal SIKEU"
          action={
            <Button
              variant="warning"
              onClick={() => router.back()}
              icon={<ArrowLeft size={16} />}
            >
              Kembali
            </Button>
          }
        />
        <div className="card p-6 text-center">
          <ShieldAlert size={56} className="mx-auto mb-4 opacity-40" />
          <h2 className="text-xl font-bold mb-2">Akses Ditolak</h2>
          <p className="max-w-[500px] mx-auto opacity-70">
            Anda tidak memiliki permission untuk menerbitkan Payroll.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Terbitkan Payroll Slip Gaji Baru"
        description="Posting gaji dan tunjangan pegawai ke Jurnal SIKEU"
        action={
          <Button
            variant="warning"
            onClick={() => router.back()}
            icon={<ArrowLeft size={16} />}
          >
            Kembali
          </Button>
        }
      />

      <div className="card p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Controller
              name="pegawai_id"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  label="Pilih Pegawai"
                  required
                  placeholder="Cari nama pegawai / NIP..."
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

            <Input
              label="Periode (YYYY-MM)"
              required
              placeholder="2026-07"
              error={errors.periode_bulan_tahun?.message}
              {...register('periode_bulan_tahun')}
            />

            <Controller
              name="status_transfer"
              control={control}
              render={({ field }) => (
                <Select
                  label="Status Transfer SIKEU"
                  required
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.status_transfer?.message}
                  options={[
                    { value: 'paid', label: 'Paid (Terbayar & Posted)' },
                    { value: 'pending', label: 'Pending (Menunggu Transfer)' },
                    { value: 'failed', label: 'Failed (Gagal Transfer)' },
                  ]}
                />
              )}
            />

            <Input
              label="Gaji Pokok (IDR)"
              type="number"
              required
              error={errors.gaji_pokok?.message}
              {...register('gaji_pokok', { valueAsNumber: true })}
            />

            <Input
              label="Total Tunjangan (IDR)"
              type="number"
              error={errors.total_tunjangan?.message}
              {...register('total_tunjangan', { valueAsNumber: true })}
            />

            <Input
              label="Total Potongan (IDR)"
              type="number"
              error={errors.total_potongan?.message}
              {...register('total_potongan', { valueAsNumber: true })}
            />

            <Input
              label="Gaji Bersih / THP (IDR)"
              type="number"
              required
              error={errors.gaji_bersih?.message}
              {...register('gaji_bersih', { valueAsNumber: true })}
            />

            <Input
              label="Nama Bank"
              placeholder="Contoh: Bank Mandiri"
              error={errors.bank_nama?.message}
              {...register('bank_nama')}
            />

            <Input
              label="Nomor Rekening"
              placeholder="Contoh: 5220391823"
              error={errors.nomor_rekening?.message}
              {...register('nomor_rekening')}
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t">
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
              Terbitkan & Post Jurnal
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
