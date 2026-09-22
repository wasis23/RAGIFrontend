'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Upload, Wallet, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { kasKecilService } from '@/services/kas-kecil.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { formatRupiah } from '@/lib/utils';
import type { KasKecilUnit, ReferensiKasKecil } from '@/types/sikeu.types';

const transaksiSchema = z
  .object({
    tanggal_transaksi: z.string().min(1, 'Tanggal transaksi wajib diisi'),
    referensi_kategori_id: z.number({ error: 'Kategori transaksi wajib dipilih' }).int('Kategori wajib dipilih'),
    uraian: z.string().min(3, 'Uraian transaksi minimal 3 karakter').max(2000, 'Maksimal 2000 karakter'),
    penerima: z.string().max(191).optional(),
    nominal: z.coerce.number({ error: 'Nominal wajib diisi' }).min(1, 'Nominal harus lebih dari nol'),
    keterangan: z.string().max(2000).optional(),
  })
  .refine((v) => v.nominal <= Number.MAX_SAFE_INTEGER, { message: 'Nominal terlalu besar', path: ['nominal'] });

type TransaksiForm = z.infer<typeof transaksiSchema>;

const apiErrorMessage = (err: unknown, fallback: string): string => {
  const e = err as { response?: { data?: { message?: string } } } | null | undefined;
  return e?.response?.data?.message || fallback;
};

export default function CreateTransaksiKasKecilPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [unit, setUnit] = useState<KasKecilUnit | null>(null);
  const [kategoriList, setKategoriList] = useState<ReferensiKasKecil[]>([]);
  const [fileBukti, setFileBukti] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<TransaksiForm>({
    resolver: zodResolver(transaksiSchema) as unknown as Resolver<TransaksiForm>,
    defaultValues: {
      tanggal_transaksi: new Date().toISOString().split('T')[0],
      referensi_kategori_id: undefined,
      uraian: '',
      penerima: '',
      nominal: 0,
      keterangan: '',
    },
  });

  const watchKategori = watch('referensi_kategori_id');
  const watchNominal = watch('nominal');

  useEffect(() => {
    kasKecilService.detailUnit(id)
      .then((res) => setUnit(res.data || null))
      .catch(() => setUnit(null));
    kasKecilService.referensiKategori()
      .then((res) => setKategoriList(Array.isArray(res.data) ? res.data : []))
      .catch(() => setKategoriList([]));
  }, [id]);

  const onSubmit = async (form: TransaksiForm) => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('tanggal_transaksi', form.tanggal_transaksi);
      fd.append('referensi_kategori_id', String(form.referensi_kategori_id));
      fd.append('uraian', form.uraian);
      fd.append('nominal', String(form.nominal));
      if (form.penerima?.trim()) fd.append('penerima', form.penerima.trim());
      if (form.keterangan?.trim()) fd.append('keterangan', form.keterangan.trim());
      if (fileBukti) fd.append('file_bukti', fileBukti);

      await kasKecilService.createTransaksi(id, fd);
      toast.success('Transaksi keluar kas kecil dicatat. Saldo & jurnal otomatis diperbarui.');
      router.push(`/sikeu/kas-kecil/${id}`);
    } catch (err: unknown) {
      toast.error(apiErrorMessage(err, 'Gagal mencatat transaksi kas kecil'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setFileBukti(null);
      return;
    }
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
      toast.error('Bukti transaksi harus berformat pdf/jpg/jpeg/png');
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran bukti transaksi maksimal 5 MB');
      e.target.value = '';
      return;
    }
    setFileBukti(file);
  };

  return (
    <div className="space-y-6 max-w-5xl pb-12">
      <PageHeader
        title="Catat Transaksi Keluar Kas Kecil"
        description={
          unit
            ? `${unit.nama_kas} • Saldo saat ini: ${formatRupiah(Number(unit.saldo_saat_ini) || 0)}`
            : 'Pencatatan pengeluaran kas kecil (saldo berkurang + jurnal otomatis)'
        }
        action={
          <Link href={`/sikeu/kas-kecil/${id}`}>
            <Button variant="outline" icon={<ArrowLeft size={16} />} className="font-bold min-h-[38px] text-xs">
              Kembali
            </Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Wallet size={18} className="text-primary-600" />
              Detail Pengeluaran
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Transaksi tidak boleh melebihi saldo kas kecil. Kategori diambil dari master referensi sistem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              label="Tanggal Transaksi *"
              type="date"
              {...register('tanggal_transaksi')}
              error={errors.tanggal_transaksi?.message}
            />

            <div>
              <label className="form-label">
                Kategori Transaksi <span className="required">*</span>
              </label>
              <Controller
                control={control}
                name="referensi_kategori_id"
                render={({ field }) => (
                  <Select
                    options={[
                      ...(watchKategori ? [] : [{ value: '', label: '-- Pilih kategori --' }]),
                      ...kategoriList.map((k) => ({ value: String(k.id), label: k.nama })),
                    ]}
                    value={field.value?.toString() || ''}
                    onChange={(val) => field.onChange(val ? Number(val) : undefined)}
                    error={errors.referensi_kategori_id?.message}
                    placeholder={kategoriList.length === 0 ? 'Belum ada data kategori' : 'Pilih kategori...'}
                  />
                )}
              />
            </div>

            <Input
              label="Nominal (Rp) *"
              type="number"
              min={1}
              placeholder="0"
              {...register('nominal')}
              error={errors.nominal?.message}
            />

            <Input
              label="Penerima / Kepada"
              placeholder="Nama vendor / penerima dana"
              {...register('penerima')}
              error={errors.penerima?.message}
            />

            <div className="lg:col-span-2">
              <div>
                <label className="form-label">
                  Uraian Transaksi <span className="required">*</span>
                </label>
                <Textarea
                  placeholder="Contoh: Pembelian ATK perlengkapan kantor fakultas"
                  rows={3}
                  {...register('uraian')}
                  error={errors.uraian?.message}
                />
              </div>
            </div>

            <div className="lg:col-span-3">
              <Textarea
                label="Keterangan Tambahan"
                placeholder="Catatan internal (opsional)"
                rows={2}
                {...register('keterangan')}
                error={errors.keterangan?.message}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Tag size={18} className="text-primary-600" />
              Bukti Transaksi
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Unggah bukti pembelian/kuitansi. Format PDF/JPG/PNG maksimal 5 MB (opsional).
            </p>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex flex-col items-center justify-center w-full sm:w-80 border-2 border-dashed border-slate-300 rounded-xl px-4 py-5 cursor-pointer hover:border-primary-400 transition">
              <Upload size={20} className="text-slate-400 mb-1.5" />
              <span className="text-2xs font-bold text-slate-600">
                {fileBukti ? fileBukti.name : 'Klik untuk pilih file bukti'}
              </span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
            {watchNominal > 0 && (
              <p className="text-xs text-slate-500">
                Saldo akan berkurang sebesar <b className="text-rose-600">{formatRupiah(Number(watchNominal))}</b>.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href={`/sikeu/kas-kecil/${id}`}>
            <Button type="button" variant="outline" disabled={submitting} className="font-bold min-h-[42px] px-5">
              Batal
            </Button>
          </Link>
          <Button
            type="submit"
            variant="primary"
            disabled={submitting}
            loading={submitting}
            icon={!submitting ? <Save size={18} /> : undefined}
            className="font-bold shadow-md min-h-[42px] px-6"
          >
            {submitting ? 'Menyimpan...' : 'Simpan Transaksi'}
          </Button>
        </div>
      </form>
    </div>
  );
}