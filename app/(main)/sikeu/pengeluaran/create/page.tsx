'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Calculator } from 'lucide-react';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useForm } from 'react-hook-form';

interface UnitKas {
  id: number;
  nama_kas: string;
}

interface FormValues {
  kategori: string;
  nominal: number;
  tanggal_transaksi: string;
  nama_vendor: string;
  npwp_vendor: string;
  jenis_pajak: string;
  tarif_pajak_persen: number;
  unit_kas_id: number;
  keterangan: string;
}

const formatRupiah = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

export default function CreatePengeluaranPage() {
  const router = useRouter();
  const [unitKasList, setUnitKasList] = useState<UnitKas[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      kategori: 'operasional',
      nominal: 5000000,
      tanggal_transaksi: new Date().toISOString().split('T')[0],
      nama_vendor: '',
      npwp_vendor: '',
      jenis_pajak: 'tanpa_pajak',
      tarif_pajak_persen: 0,
      unit_kas_id: 1,
      keterangan: '',
    },
  });

  const nominalVal = watch('nominal') || 0;
  const jenisPajakVal = watch('jenis_pajak');
  const tarifPajakVal = watch('tarif_pajak_persen') || 0;

  const nominalPajak = (nominalVal * tarifPajakVal) / 100;
  const netDibayarkan = (jenisPajakVal === 'pph_21' || jenisPajakVal === 'pph_23')
    ? nominalVal - nominalPajak
    : nominalVal;

  useEffect(() => {
    const fetchUnitKas = async () => {
      try {
        const res = await sikeuService.getUnitKasList();
        const list = Array.isArray(res.data) ? res.data : [];
        setUnitKasList(list);
        if (list.length > 0) {
          setValue('unit_kas_id', list[0].id);
        }
      } catch {
        setUnitKasList([]);
      }
    };
    fetchUnitKas();
  }, [setValue]);

  const onSubmitForm = async (formData: FormValues) => {
    setSubmitting(true);
    try {
      await sikeuService.storePengeluaran({
        kategori: formData.kategori,
        nominal: formData.nominal,
        tanggal_transaksi: formData.tanggal_transaksi,
        nama_vendor: formData.nama_vendor,
        npwp_vendor: formData.npwp_vendor || undefined,
        jenis_pajak: formData.jenis_pajak,
        unit_kas_id: formData.unit_kas_id,
        keterangan: formData.keterangan || undefined,
      });
      toast.success('Transaksi pengeluaran kampus berhasil dicatat!');
      router.push('/sikeu/pengeluaran');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal menyimpan transaksi pengeluaran');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <PageHeader
        title="Input Transaksi Pengeluaran Kampus"
        description="Pencatatan beban operasional, vendor, honorarium & perhitungan pajak PPh/PPN."
        action={
          <Button
            variant="outline"
            icon={<ArrowLeft size={16} />}
            onClick={() => router.push('/sikeu/pengeluaran')}
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
              label="Kategori Pengeluaran *"
              options={[
                { value: 'operasional', label: 'Operasional Kantor / Fakultas' },
                { value: 'gaji', label: 'Payroll Gaji / Honorarium' },
                { value: 'pembelian', label: 'Pembelian Aset & Alat Kampus' },
                { value: 'praktikum', label: 'Bahan Laboratorium / Praktikum' },
              ]}
              value={watch('kategori')}
              onChange={(val) => setValue('kategori', val as string)}
            />

            <Select
              label="Sumber Kas / Rekening Pembayar *"
              options={unitKasList.map(u => ({ value: u.id.toString(), label: u.nama_kas }))}
              value={watch('unit_kas_id')?.toString() || '1'}
              onChange={(val) => setValue('unit_kas_id', Number(val))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input type="number" label="Nominal Gross Pengeluaran (Rp) *" placeholder="5000000"
              {...register('nominal', { required: 'Nominal wajib diisi', valueAsNumber: true, min: { value: 1, message: 'Nominal harus lebih dari 0' } })}
              error={errors.nominal?.message} />

            <Input type="date" label="Tanggal Transaksi *"
              {...register('tanggal_transaksi', { required: 'Tanggal wajib diisi' })}
              error={errors.tanggal_transaksi?.message} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nama Vendor / Penerima *" placeholder="Contoh: PT Mediatama Digital"
              {...register('nama_vendor', { required: 'Nama vendor wajib diisi' })}
              error={errors.nama_vendor?.message} />

            <Input label="NPWP Vendor (Opsional)" placeholder="Contoh: 01.234.567.8-012.000"
              {...register('npwp_vendor')} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Jenis Potongan Pajak *"
              options={[
                { value: 'tanpa_pajak', label: 'Tanpa Potongan Pajak' },
                { value: 'pph_21', label: 'PPh Pasal 21 (Gaji/Honor)' },
                { value: 'pph_23', label: 'PPh Pasal 23 (Jasa/Sewa)' },
                { value: 'ppn_11', label: 'PPN 11%' },
              ]}
              value={jenisPajakVal}
              onChange={(val) => setValue('jenis_pajak', val as string)}
            />

            <Input type="number" label="Tarif Pajak (%)" placeholder="0"
              {...register('tarif_pajak_persen', { valueAsNumber: true })} />
          </div>

          {/* Tax Calculation Live Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Calculator size={16} className="text-primary-600" />
              <span>Rincian Kalkulasi Pajak & Net Pembayaran:</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
              <div>
                <p className="text-2xs text-slate-500">Gross Nominal:</p>
                <p className="font-bold text-slate-900 tabular-nums">{formatRupiah(nominalVal)}</p>
              </div>
              <div>
                <p className="text-2xs text-slate-500">Nilai Pajak Terutang:</p>
                <p className="font-bold text-rose-600 tabular-nums">{formatRupiah(nominalPajak)}</p>
              </div>
              <div>
                <p className="text-2xs text-slate-500">Net Dibayarkan ke Vendor:</p>
                <p className="font-bold text-emerald-700 tabular-nums">{formatRupiah(netDibayarkan)}</p>
              </div>
            </div>
          </div>

          <Textarea label="Deskripsi Transaksi & Keterangan *" placeholder="Penjelasan mengenai peruntukan pengeluaran..."
            {...register('keterangan', { required: 'Keterangan wajib diisi' })}
            error={errors.keterangan?.message} />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => router.push('/sikeu/pengeluaran')} disabled={submitting} className="font-bold text-slate-600">
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}
              icon={submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              className="font-bold shadow-md min-h-[44px] px-6">
              {submitting ? 'Menyimpan...' : 'Simpan Transaksi Pengeluaran'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
