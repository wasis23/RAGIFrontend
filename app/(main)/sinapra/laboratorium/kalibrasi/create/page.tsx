'use client';

import React, { useState } from 'react';
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
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const kalibrasiSchema = z.object({
  aset_id: z.string().min(1, 'Instrumen/Alat laboratorium wajib dipilih'),
  institusi_kalibrasi: z.string().min(1, 'Institusi kalibrasi wajib diisi'),
  nomor_sertifikat: z.string().min(1, 'Nomor sertifikat kalibrasi wajib diisi'),
  tanggal_kalibrasi: z.string().min(1, 'Tanggal pelaksanaan kalibrasi wajib diisi'),
  tanggal_kadaluarsa: z.string().min(1, 'Tanggal kedaluwarsa sertifikat kalibrasi wajib diisi'),
  status_kelayakan: z.enum(['laik', 'tidak_laik', 'butuh_perbaikan']),
  catatan: z.string().optional(),
});

type KalibrasiFormData = z.infer<typeof kalibrasiSchema>;

export default function CreateKalibrasiPage() {
  const router = useRouter();
  const [selectedAset, setSelectedAset] = useState<{ value: string; label: string } | null>(null);
  const [statusKelayakanOptions, setStatusKelayakanOptions] = useState<{ value: string; label: string }[]>([]);

  React.useEffect(() => {
    const fetchReferences = async () => {
      try {
        const res = await referensiService.getAll({ modul: 'sinapra', tipe: 'status_kelayakan_kalibrasi' });
        setStatusKelayakanOptions((res || []).map((r) => ({ value: r.kode || String(r.id), label: r.nama })));
      } catch {
        setStatusKelayakanOptions([]);
      }
    };
    fetchReferences();
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<KalibrasiFormData>({
    resolver: zodResolver(kalibrasiSchema),
    defaultValues: {
      aset_id: '',
      institusi_kalibrasi: '',
      nomor_sertifikat: '',
      tanggal_kalibrasi: new Date().toISOString().split('T')[0],
      tanggal_kadaluarsa: '',
      status_kelayakan: 'laik',
      catatan: '',
    },
  });

  const loadAsetLabOptions = async (query: string) => {
    try {
      const res: any = await sinapraService.getAsetList({ search: query, per_page: 20 });
      const items = Array.isArray(res?.data) ? res.data : (res?.data?.items || []);
      return items.map((a: any) => ({
        value: String(a.id),
        label: `${a.nama} [${a.kode}] - ${a.ruangan?.nama || 'Ruang Lab'}`,
      }));
    } catch {
      return [];
    }
  };

  const onSubmit = async (data: KalibrasiFormData) => {
    try {
      await sinapraService.createAlatKalibrasi({
        ...data,
        aset_id: Number(data.aset_id),
      });
      toast.success('Pencatatan jadwal kalibrasi alat presisi berhasil disimpan');
      router.push('/sinapra/laboratorium');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan jadwal kalibrasi alat');
    }
  };

  return (
    <div className="w-full flex-col grid-cols-1 space-y-4">
      <PageHeader
        title="Catat Kalibrasi Alat Presisi"
        description="Pencatatan riwayat pengujian akurasi, sertifikasi, dan jadwal kedaluwarsa instrumen laboratorium presisi."
        action={
          <Button
            variant="outline"
            style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
            onClick={() => router.push('/sinapra/laboratorium')}
            icon={<ArrowLeft size={16} />}
          >
            Kembali
          </Button>
        }
      />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="col-span-full">
              <AsyncSelect
                label="Instrumen / Alat Presisi Laboratorium"
                placeholder="Cari aset alat presisi..."
                loadOptions={loadAsetLabOptions}
                value={selectedAset}
                onChange={(sel: any) => {
                  setSelectedAset(sel);
                  setValue('aset_id', sel ? sel.value : '', { shouldValidate: true });
                }}
              />
              {errors.aset_id && (
                <p className="text-xs text-[var(--module-primary)]">{errors.aset_id.message}</p>
              )}
            </div>

            <div>
              <Input
                label="Institusi Pelaksana Kalibrasi"
                placeholder="cth: Balai Standardisasi & Metrologi"
                {...register('institusi_kalibrasi')}
              />
              {errors.institusi_kalibrasi && (
                <p className="text-xs text-[var(--module-primary)]">{errors.institusi_kalibrasi.message}</p>
              )}
            </div>

            <div>
              <Input
                label="Nomor Sertifikat Kalibrasi"
                placeholder="cth: CERT-KAL-2026-001"
                {...register('nomor_sertifikat')}
              />
              {errors.nomor_sertifikat && (
                <p className="text-xs text-[var(--module-primary)]">{errors.nomor_sertifikat.message}</p>
              )}
            </div>

            <div>
              <Select
                label="Status Kelayakan Fisik"
                value={watch('status_kelayakan')}
                onChange={(val) => setValue('status_kelayakan', val as 'laik' | 'tidak_laik' | 'butuh_perbaikan', { shouldValidate: true })}
                options={statusKelayakanOptions}
              />
              {errors.status_kelayakan && (
                <p className="text-xs text-[var(--module-primary)]">{errors.status_kelayakan.message}</p>
              )}
            </div>

            <div>
              <Input
                label="Tanggal Kalibrasi"
                type="date"
                {...register('tanggal_kalibrasi')}
              />
              {errors.tanggal_kalibrasi && (
                <p className="text-xs text-[var(--module-primary)]">{errors.tanggal_kalibrasi.message}</p>
              )}
            </div>

            <div>
              <Input
                label="Tanggal Kedaluwarsa Kalibrasi"
                type="date"
                {...register('tanggal_kadaluarsa')}
              />
              {errors.tanggal_kadaluarsa && (
                <p className="text-xs text-[var(--module-primary)]">{errors.tanggal_kadaluarsa.message}</p>
              )}
            </div>

            <div className="col-span-full">
              <Textarea
                label="Catatan Hasil Pengujian & Presisi"
                placeholder="cth: Batas toleransi presisi deviasi 0.02mm, memenuhi standar SNI..."
                rows={3}
                {...register('catatan')}
              />
              {errors.catatan && (
                <p className="text-xs text-[var(--module-primary)]">{errors.catatan.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/sinapra/laboratorium')}
            >
              Batal
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              Simpan Jadwal Kalibrasi
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
