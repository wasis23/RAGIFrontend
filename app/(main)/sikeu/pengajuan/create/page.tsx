'use client';

import { formatRupiah } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { pengajuanOperasionalService } from '@/services/pengajuan-operasional.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';

const itemSchema = z.object({
  nama_barang: z.string().min(2, 'Nama barang minimal 2 karakter'),
  qty: z.number().min(0.01, 'Qty minimal 0.01'),
  satuan: z.string().optional(),
  harga_satuan: z.number().min(1, 'Harga satuan minimal Rp1'),
  keterangan: z.string().optional(),
});

const schema = z.object({
  judul_pengajuan: z.string().min(5, 'Judul minimal 5 karakter'),
  deskripsi: z.string().min(10, 'Alasan/alokasi minimal 10 karakter'),
  kategori_pengajuan: z.enum(['pengadaan_barang', 'non_barang']),
  fakultas_id: z.number().min(1, 'Fakultas wajib dipilih'),
  ruangan_id: z.number().nullable().optional(),
  unit_kas_id: z.number().min(1, 'Unit kas wajib dipilih'),
  jenis_pengajuan: z.string().optional(),
  nominal_diajukan: z.number().optional(),
  items: z.array(itemSchema).optional(),
}).superRefine((v, ctx) => {
  if (v.kategori_pengajuan === 'pengadaan_barang' && (!v.items || v.items.length === 0)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Minimal 1 barang wajib diisi', path: ['items'] });
  }
  if (v.kategori_pengajuan === 'non_barang' && (!v.nominal_diajukan || v.nominal_diajukan < 1000)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Nominal minimal Rp1.000', path: ['nominal_diajukan'] });
  }
});

type FormValues = z.infer<typeof schema>;

export default function CreatePengajuanPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [fakultas, setFakultas] = useState<{ id: number; nama: string }[]>([]);
  const [ruangan, setRuangan] = useState<{ id: number; nama: string }[]>([]);
  const [unitKas, setUnitKas] = useState<{ id: number; nama_kas: string }[]>([]);
  const [lampiran, setLampiran] = useState<File | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      judul_pengajuan: '',
      deskripsi: '',
      kategori_pengajuan: 'pengadaan_barang',
      fakultas_id: 0,
      ruangan_id: null,
      unit_kas_id: 0,
      jenis_pengajuan: 'operasional',
      nominal_diajukan: 0,
      items: [{ nama_barang: '', qty: 1, satuan: 'pcs', harga_satuan: 0, keterangan: '' }],
    },
  });

  const kategori = watch('kategori_pengajuan');
  const items = watch('items') || [];
  const total = kategori === 'pengadaan_barang'
    ? items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.harga_satuan) || 0), 0)
    : Number(watch('nominal_diajukan')) || 0;

  useEffect(() => {
    pengajuanOperasionalService.listFakultas().then((r) => setFakultas(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    pengajuanOperasionalService.listRuangan().then((r) => setRuangan(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    pengajuanOperasionalService.listUnitKas().then((r) => setUnitKas(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  const addItem = () => setValue('items', [...items, { nama_barang: '', qty: 1, satuan: 'pcs', harga_satuan: 0, keterangan: '' }]);
  const removeItem = (i: number) => setValue('items', items.filter((_, x) => x !== i));

  const onSubmit = async (v: FormValues) => {
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('judul_pengajuan', v.judul_pengajuan);
      form.append('deskripsi', v.deskripsi);
      form.append('kategori_pengajuan', v.kategori_pengajuan);
      form.append('fakultas_id', String(v.fakultas_id));
      if (v.ruangan_id) form.append('ruangan_id', String(v.ruangan_id));
      form.append('unit_kas_id', String(v.unit_kas_id));
      form.append('jenis_pengajuan', v.jenis_pengajuan || 'operasional');
      if (v.kategori_pengajuan === 'non_barang') {
        form.append('nominal_diajukan', String(v.nominal_diajukan || 0));
      } else {
        (v.items || []).forEach((it, i) => {
          form.append(`items[${i}][nama_barang]`, it.nama_barang);
          form.append(`items[${i}][qty]`, String(it.qty));
          form.append(`items[${i}][satuan]`, it.satuan || 'pcs');
          form.append(`items[${i}][harga_satuan]`, String(it.harga_satuan));
          form.append(`items[${i}][keterangan]`, it.keterangan || '');
        });
      }
      if (lampiran) form.append('file_lampiran', lampiran);

      await pengajuanOperasionalService.create(form);
      toast.success('Pengajuan berhasil dibuat');
      router.push('/sikeu/pengajuan');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Gagal membuat pengajuan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl pb-16 animate-fade-in">
      <PageHeader
        title="Buat Pengajuan Operasional"
        description="Isi alasan/alokasi, fakultas & ruang, dan rincian barang (nama, qty, harga satuan)."
        action={
          <Link href="/sikeu/pengajuan">
            <Button variant="outline" icon={<ArrowLeft size={16} />} className="font-bold min-h-[38px] text-xs">
              Kembali
            </Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl space-y-4">
          <h2 className="text-sm font-extrabold">1. Alasan & Alokasi</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="col-span-full">
              <Input label="Judul Pengajuan *" placeholder="Contoh: Pengadaan ATK Fakultas Teknik" {...register('judul_pengajuan')} />
              {errors.judul_pengajuan && <p className="text-xs text-rose-600 mt-1">{errors.judul_pengajuan.message}</p>}
            </div>
            <Select label="Kategori *" value={kategori} onChange={(v) => setValue('kategori_pengajuan', v as any)} options={[{ value: 'pengadaan_barang', label: 'Pengadaan Barang' }, { value: 'non_barang', label: 'Non-Barang (langsung keuangan)' }]} />
            <Select label="Jenis" value={watch('jenis_pengajuan') || 'operasional'} onChange={(v) => setValue('jenis_pengajuan', v as string)} options={[{ value: 'operasional', label: 'Operasional' }, { value: 'kegiatan', label: 'Kegiatan' }, { value: 'reimbursement', label: 'Reimbursement' }, { value: 'lainnya', label: 'Lainnya' }]} />
            <Select label="Fakultas *" value={String(watch('fakultas_id') || '')} onChange={(v) => setValue('fakultas_id', Number(v))} options={[{ value: '', label: 'Pilih Fakultas' }, ...fakultas.map((f) => ({ value: String(f.id), label: f.nama }))]} />
            <Select label="Ruang (opsional)" value={String(watch('ruangan_id') || '')} onChange={(v) => setValue('ruangan_id', v ? Number(v) : null)} options={[{ value: '', label: 'Tanpa ruang khusus' }, ...ruangan.map((r) => ({ value: String(r.id), label: r.nama }))]} />
            <Select label="Unit Kas *" value={String(watch('unit_kas_id') || '')} onChange={(v) => setValue('unit_kas_id', Number(v))} options={[{ value: '', label: 'Pilih Unit Kas' }, ...unitKas.map((u) => ({ value: String(u.id), label: u.nama_kas }))]} />
            <div className="col-span-full">
              <Textarea label="Alasan / Alokasi Penggunaan *" placeholder="Untuk apa pengajuan ini dialokasikan..." {...register('deskripsi')} />
              {errors.deskripsi && <p className="text-xs text-rose-600 mt-1">{errors.deskripsi.message}</p>}
            </div>
            {kategori === 'non_barang' && (
              <Input label="Nominal Pengajuan (Rp) *" type="number" {...register('nominal_diajukan', { valueAsNumber: true })} />
            )}
            <div>
              <label className="text-xs font-bold text-slate-700">Lampiran (PDF/Gambar, maks 5MB)</label>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setLampiran(e.target.files?.[0] || null)} className="mt-1 block w-full text-xs" />
            </div>
          </div>
          {errors.fakultas_id && <p className="text-xs text-rose-600">{errors.fakultas_id.message}</p>}
        </div>

        {kategori === 'pengadaan_barang' && (
          <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold">2. Rincian Barang</h2>
              <Button type="button" variant="outline" icon={<Plus size={14} />} onClick={addItem} className="text-xs min-h-[36px]">Tambah Barang</Button>
            </div>
            <div className="space-y-3">
              {items.map((it, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-6 gap-3 p-3 border border-slate-200 rounded-xl bg-slate-50/50">
                  <div className="md:col-span-2">
                    <Input label={`Barang #${i + 1} *`} placeholder="Nama barang" value={it.nama_barang} onChange={(e) => setValue(`items.${i}.nama_barang` as any, e.target.value)} />
                  </div>
                  <Input label="Qty *" type="number" value={String(it.qty)} onChange={(e) => setValue(`items.${i}.qty` as any, Number(e.target.value))} />
                  <Input label="Satuan" value={it.satuan} onChange={(e) => setValue(`items.${i}.satuan` as any, e.target.value)} />
                  <Input label="Harga Satuan *" type="number" value={String(it.harga_satuan)} onChange={(e) => setValue(`items.${i}.harga_satuan` as any, Number(e.target.value))} />
                  <div className="flex items-end gap-2">
                    <div className="flex-1 text-xs font-bold">Subtotal:<br /><span className="text-sm">{formatRupiah((Number(it.qty) || 0) * (Number(it.harga_satuan) || 0))}</span></div>
                    {items.length > 1 && (
                      <Button type="button" variant="outline" icon={<Trash2 size={14} />} onClick={() => removeItem(i)} className="text-rose-600 border-rose-200" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            {errors.items && <p className="text-xs text-rose-600">{(errors.items as any)?.message || 'Periksa rincian barang'}</p>}
            <div className="text-right text-sm font-extrabold">Total Pengajuan: {formatRupiah(total)}</div>
          </div>
        )}

        {kategori === 'non_barang' && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-800">
            Non-barang langsung ke <b>keuangan → direktur → keuangan (pencairan)</b>. Rincian qty tidak diperlukan.
            Total: <b>{formatRupiah(total)}</b>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => router.push('/sikeu/pengajuan')} disabled={submitting} className="font-bold">Batal</Button>
          <Button type="submit" variant="primary" disabled={submitting} icon={submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} className="font-bold">
            {submitting ? 'Menyimpan...' : 'Kirim Pengajuan'}
          </Button>
        </div>
      </form>
    </div>
  );
}
