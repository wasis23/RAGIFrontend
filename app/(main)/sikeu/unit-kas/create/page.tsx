'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Loader2, Building, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';

const KANAL_OPTIONS = [
  { value: 'tunai', label: 'Tunai (brankas / serah terima fisik)' },
  { value: 'bank_manual', label: 'Bank Manual (m-banking BSN / BNI)' },
  { value: 'bank_h2h', label: 'Bank Host-to-Host (batch disbursement)' },
  { value: 'xendit', label: 'Xendit (disbursement API)' },
];

const unitKasSchema = z.object({
  nama_kas: z.string().min(3, 'Nama kas unit minimal 3 karakter'),
  tipe_kas: z.enum(['utama', 'operasional', 'prodi', 'unit_bisnis']),
  kanal: z.enum(['tunai', 'bank_manual', 'bank_h2h', 'xendit']),
  akun_keuangan_id: z.number().optional(),
  bank_name: z.string().min(2, 'Nama bank atau kas wajib diisi'),
  bank_account_number: z.string().optional(),
  bank_account_name: z.string().optional(),
  penanggung_jawab: z.string().min(3, 'Nama penanggung jawab wajib diisi'),
  status: z.boolean().default(true),
  deskripsi: z.string().optional(),
}).superRefine((val, ctx) => {
  if (val.kanal === 'bank_manual') {
    if (!['BNI', 'BSN'].includes(val.bank_name)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['bank_name'], message: 'Rekening manual hanya BNI atau BSN' });
    }
    if (!val.bank_account_number?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['bank_account_number'], message: 'Nomor rekening wajib diisi untuk bank manual' });
    }
    if (!val.bank_account_name?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['bank_account_name'], message: 'Atas nama rekening wajib diisi untuk bank manual' });
    }
  }
});

type UnitKasFormData = z.infer<typeof unitKasSchema>;

export default function CreateUnitKasPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [akunKasList, setAkunKasList] = useState<{ id: number; kode_akun: string; nama_akun: string }[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UnitKasFormData>({
    resolver: zodResolver(unitKasSchema) as any,
    defaultValues: {
      nama_kas: '',
      tipe_kas: 'operasional',
      kanal: 'bank_manual',
      akun_keuangan_id: undefined,
      bank_name: 'BNI',
      bank_account_number: '',
      bank_account_name: '',
      penanggung_jawab: '',
      status: true,
      deskripsi: '',
    },
  });

  const watchTipeKas = watch('tipe_kas');
  const watchBankName = watch('bank_name');
  const watchKanal = watch('kanal');

  useEffect(() => {
    const fetchAkun = async () => {
      try {
        const res = await sikeuService.getCoaList('aset');
        const list = Array.isArray(res.data) ? res.data : [];
        setAkunKasList(
          list.filter((a: any) => String(a.kode_akun || '').startsWith('101') || String(a.kode_akun || '').startsWith('102'))
        );
      } catch {
        setAkunKasList([]);
      }
    };
    fetchAkun();
  }, []);

  const onSubmit = async (data: UnitKasFormData) => {
    setSubmitting(true);
    try {
      await sikeuService.storeUnitKas(data);
      toast.success('Unit kas operasional baru berhasil didaftarkan');
      router.push('/sikeu/master?tab=unit_kas');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Gagal mendaftarkan unit kas');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      <PageHeader
        title="Pendaftaran Unit Kas Baru"
        description="Kelola kas operasional fakultas, program studi, unit bisnis, dan rekening penampung kampus."
        action={
          <Button
            variant="outline"
            icon={<ArrowLeft size={16} />}
            onClick={() => router.push('/sikeu/master?tab=unit_kas')}
            className="font-bold min-h-[40px]"
          >
            Kembali
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building size={18} className="text-primary-600" />
              Informasi Unit Kas & Rekening Bank
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tentukan nama kas, jenis peruntukan, nomor rekening operasional, serta pejabat penanggung jawab.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nama Kas Unit *"
              placeholder="Contoh: Kas Operasional Fakultas Teknik / Kas SPMB"
              {...register('nama_kas')}
              error={errors.nama_kas?.message}
            />

            <Select
              label="Tipe / Klasifikasi Kas *"
              options={[
                { value: 'utama', label: 'Kas Utama Kampus / Rektorat' },
                { value: 'operasional', label: 'Kas Operasional Unit / Bagian' },
                { value: 'prodi', label: 'Kas Program Studi / Jurusan' },
                { value: 'unit_bisnis', label: 'Unit Bisnis Kampus' },
              ]}
              value={watchTipeKas}
              onChange={(val) => setValue('tipe_kas', val as any, { shouldValidate: true })}
            />

            <Select
              label="Kanal Sumber Dana *"
              options={KANAL_OPTIONS}
              value={watchKanal}
              onChange={(val) => setValue('kanal', val as any, { shouldValidate: true })}
            />

            <Select
              label="Pemetaan Akun COA Kas-Bank"
              options={[
                { value: '', label: '-- Tanpa pemetaan (pakai default kanal) --' },
                ...akunKasList.map((a) => ({ value: String(a.id), label: `[${a.kode_akun}] ${a.nama_akun}` })),
              ]}
              value={watch('akun_keuangan_id')?.toString() || ''}
              onChange={(val) => setValue('akun_keuangan_id', val ? Number(val) : undefined as any)}
            />

            <Input
              label="Nama Bank / Penyedia Kas *"
              placeholder="Contoh: BNI, Mandiri, BRI, Kas Tunai Brankas"
              {...register('bank_name')}
              error={errors.bank_name?.message}
            />

            <Input
              label="Nomor Rekening Bank"
              placeholder="Contoh: 1234567890 (Kosongkan jika kas tunai fisik)"
              {...register('bank_account_number')}
              error={errors.bank_account_number?.message}
            />

            <Input
              label="Nama Pemilik Rekening (Atas Nama)"
              placeholder="Contoh: Universitas SSO Campus - FT"
              {...register('bank_account_name')}
              error={errors.bank_account_name?.message}
            />

            <Input
              label="Penanggung Jawab Kas (PIC) *"
              placeholder="Contoh: Bendahara Fakultas Teknik / Kasir Loket"
              {...register('penanggung_jawab')}
              error={errors.penanggung_jawab?.message}
            />

            <div className="md:col-span-2 pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('status')}
                  className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-xs font-bold text-slate-800">
                  Unit Kas Aktif dan Siap Menerima Pengajuan / Pencairan Dana
                </span>
              </label>
            </div>
          </div>

          <Textarea
            label="Deskripsi / Catatan Peruntukan"
            placeholder="Keterangan alur pencairan uang muka, batas maksimum saldo kas, atau arahan bendahara umum..."
            rows={3}
            {...register('deskripsi')}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/sikeu/master?tab=unit_kas')}
            disabled={submitting}
            className="font-bold min-h-[42px] px-5"
          >
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={submitting}
            icon={submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            className="font-bold shadow-md min-h-[42px] px-6"
          >
            {submitting ? 'Menyimpan...' : 'Simpan Unit Kas'}
          </Button>
        </div>
      </form>
    </div>
  );
}
