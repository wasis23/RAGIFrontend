'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Textarea } from '@/components/ui/Textarea';
import { sinapraService } from '@/services/sinapra.service';
import { referensiService } from '@/services/referensi.service';
import { ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const disposalSchema = z.object({
  aset_id: z.string().min(1, 'Aset yang akan dihapus/dilelang wajib dipilih'),
  nomor_bap: z.string().optional(),
  tanggal_disposal: z.string().min(1, 'Tanggal pengajuan disposal wajib diisi'),
  metode_disposal: z.enum(['rusak_total', 'kadaluwarsa', 'hilang', 'hibah', 'lelang', 'lainnya']),
  nilai_residu: z.number().min(0, 'Nilai residu tidak boleh negatif'),
  alasan: z.string().min(10, 'Alasan pemutihan/penghapusan minimal 10 karakter'),
  catatan: z.string().optional(),
});

type DisposalFormData = z.infer<typeof disposalSchema>;

export default function CreateDisposalPage() {
  const router = useRouter();
  const [selectedAset, setSelectedAset] = useState<{ value: string; label: string } | null>(null);
  const [metodeOptions, setMetodeOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    const fetchMetodeOptions = async () => {
      try {
        const res = await referensiService.getAll({ modul: 'sinapra', tipe: 'metode_disposal' });
        setMetodeOptions((res || []).map((r) => ({ value: r.kode || String(r.id), label: r.nama })));
      } catch {
        setMetodeOptions([]);
      }
    };
    fetchMetodeOptions();
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DisposalFormData>({
    resolver: zodResolver(disposalSchema),
    defaultValues: {
      aset_id: '',
      nomor_bap: '',
      tanggal_disposal: new Date().toISOString().split('T')[0],
      metode_disposal: 'rusak_total',
      nilai_residu: 0,
      alasan: '',
      catatan: '',
    },
  });

  const loadAsetOptions = async (query: string) => {
    try {
      const res = await sinapraService.getAsetList({ search: query, per_page: 20 });
      const items = Array.isArray(res?.data) ? res.data : [];
      return items.map((a: any) => ({
        value: String(a.id),
        label: `${a.nama} (${a.kode_aset || a.kode}) - ${a.ruangan?.nama || 'Tanpa Ruangan'} [Kondisi: ${a.kondisi || 'Baik'}]`,
      }));
    } catch {
      return [];
    }
  };

  const onSubmit = async (data: DisposalFormData) => {
    try {
      await sinapraService.createDisposal({
        ...data,
        aset_id: Number(data.aset_id),
        nomor_bap: data.nomor_bap?.trim() || undefined,
        nilai_residu: Number(data.nilai_residu),
      });
      toast.success('Usulan pemutihan / penghapusan aset berhasil diajukan');
      router.push('/sinapra/audit-mutasi');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal mengajukan usulan pemutihan aset');
    }
  };

  return (
    <div className="w-full flex flex-col space-y-4">
      <PageHeader
        title="Usulan Pemutihan & Penghapusan Aset"
        description="Formulir resmi Berita Acara Pemeriksaan (BAP) penghapusan, lelang, hibah, atau pemusnahan aset sarpras kampus"
        action={
          <Button
            variant="outline"
            icon={<ArrowLeft size={16} />}
            onClick={() => router.push('/sinapra/audit-mutasi')}
            style={{
              borderColor: 'var(--module-primary)',
              color: 'var(--module-primary)',
            }}
          >
            Kembali
          </Button>
        }
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-sm font-semibold text-slate-800">
              Identitas Aset & Dokumen BAP
            </h3>
            <p className="text-xs text-slate-500">
              Pilih aset sarpras yang memenuhi kriteria penghapusan beserta dasar pertimbangan fisik dan ekonomis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <AsyncSelect
                label="Pilih Barang / Aset Yang Akan Dihapus *"
                loadOptions={loadAsetOptions}
                value={selectedAset}
                onChange={(val) => {
                  setSelectedAset(val);
                  setValue('aset_id', val?.value || '', { shouldValidate: true });
                }}
                placeholder="Cari berdasarkan nama atau kode aset..."
                error={errors.aset_id?.message}
              />
            </div>

            <Input
              label="Nomor Berita Acara (BAP) (Opsional)"
              placeholder="Contoh: BAP-DISP/2026/09/0012 (Otomatis jika dikosongkan)"
              {...register('nomor_bap')}
              error={errors.nomor_bap?.message}
            />

            <Input
              label="Tanggal Usulan BAP *"
              type="date"
              {...register('tanggal_disposal')}
              error={errors.tanggal_disposal?.message}
            />

            <Select
              label="Metode Pemutihan / Penghapusan *"
              options={metodeOptions}
              value={watch('metode_disposal')}
              onChange={(e) => setValue('metode_disposal', e.target.value as any, { shouldValidate: true })}
              error={errors.metode_disposal?.message}
            />

            <Input
              label="Estimasi Nilai Residu / Scrap (Rp) *"
              type="number"
              placeholder="0 jika tidak memiliki nilai sisa ekonomis"
              {...register('nilai_residu', { valueAsNumber: true })}
              error={errors.nilai_residu?.message}
            />
          </div>

          <div className="space-y-4">
            <Textarea
              label="Alasan Pemutihan / Penghapusan *"
              placeholder="Jelaskan dasar pertimbangan teknis, fisik, dan kerusakan aset mengapa perlu dihapus dari buku inventaris..."
              rows={3}
              {...register('alasan')}
              error={errors.alasan?.message}
            />

            <Textarea
              label="Catatan Tambahan / Rekomendasi Tim Penilai"
              placeholder="Rincian sparepart yang masih bisa dimanfaatkan atau instruksi pemindahan rongsok..."
              rows={2}
              {...register('catatan')}
              error={errors.catatan?.message}
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-2 p-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/sinapra/audit-mutasi')}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              icon={<Save size={16} />}
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Kirim Usulan BAP Pemutihan
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
