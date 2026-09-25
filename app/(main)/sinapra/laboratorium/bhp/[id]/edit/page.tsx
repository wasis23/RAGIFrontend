'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

const bhpSchema = z.object({
  ruangan_id: z.string().min(1, 'Ruangan laboratorium wajib dipilih'),
  kode_bhp: z.string().min(1, 'Kode BHP wajib diisi'),
  nama_bhp: z.string().min(1, 'Nama BHP wajib diisi'),
  kategori: z.string().min(1, 'Kategori BHP wajib diisi'),
  satuan: z.string().min(1, 'Satuan wajib diisi'),
  stok_saat_ini: z.number().min(0, 'Stok saat ini tidak boleh bernilai negatif'),
  stok_minimum: z.number().min(0, 'Stok minimum tidak boleh bernilai negatif'),
  spesifikasi: z.string().optional(),
  lokasi_penyimpanan: z.string().optional(),
});

type BhpFormData = z.infer<typeof bhpSchema>;

export default function EditBhpPage() {
  const router = useRouter();
  const params = useParams();
  const bhpId = Number(params?.id);

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedRuangan, setSelectedRuangan] = useState<{ value: string; label: string } | null>(null);
  const [kategoriOptions, setKategoriOptions] = useState<{ value: string; label: string }[]>([]);
  const [satuanOptions, setSatuanOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    const fetchReferences = async () => {
      try {
        const [resKat, resSat] = await Promise.all([
          referensiService.getAll({ modul: 'sinapra', tipe: 'kategori_bhp' }),
          referensiService.getAll({ modul: 'sinapra', tipe: 'satuan_barang' }),
        ]);
        setKategoriOptions((resKat || []).map((r) => ({ value: r.kode || String(r.id), label: r.nama })));
        setSatuanOptions((resSat || []).map((r) => ({ value: r.kode || r.nama, label: r.nama })));
      } catch {
        setKategoriOptions([]);
        setSatuanOptions([]);
      }
    };
    fetchReferences();
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BhpFormData>({
    resolver: zodResolver(bhpSchema),
    defaultValues: {
      ruangan_id: '',
      kode_bhp: '',
      nama_bhp: '',
      kategori: 'komponen_elektronik',
      satuan: 'Pcs',
      stok_saat_ini: 0,
      stok_minimum: 10,
      spesifikasi: '',
      lokasi_penyimpanan: '',
    },
  });

  const loadRuanganLabOptions = async (query: string) => {
    try {
      const res: any = await sinapraService.getRuanganList({ search: query, tipe: 'lab', per_page: 20 });
      const items = Array.isArray(res?.data) ? res.data : (res?.data?.items || []);
      return items.map((r: any) => ({
        value: String(r.id),
        label: `${r.nama} [${r.kode}] - ${r.gedung?.nama || 'Gedung'}`,
      }));
    } catch {
      return [];
    }
  };

  useEffect(() => {
    if (!bhpId) return;
    const fetchBhpDetail = async () => {
      try {
        setIsLoadingData(true);
        const res: any = await sinapraService.getLabBhpList({ per_page: 100 });
        const items = Array.isArray(res?.data) ? res.data : (res?.data?.items || []);
        const target = items.find((item: any) => item.id === bhpId);
        if (target) {
          reset({
            ruangan_id: String(target.ruangan_id),
            kode_bhp: target.kode_bhp,
            nama_bhp: target.nama_bhp,
            kategori: target.kategori,
            satuan: target.satuan,
            stok_saat_ini: target.stok_saat_ini,
            stok_minimum: target.stok_minimum,
            spesifikasi: target.spesifikasi || '',
            lokasi_penyimpanan: target.lokasi_penyimpanan || '',
          });
          if (target.ruangan) {
            setSelectedRuangan({
              value: String(target.ruangan.id),
              label: `${target.ruangan.nama} [${target.ruangan.kode || ''}]`,
            });
          }
        } else {
          toast.error('Data Bahan Habis Pakai tidak ditemukan');
          router.push('/sinapra/laboratorium');
        }
      } catch (err: any) {
        toast.error('Gagal mengambil data BHP');
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchBhpDetail();
  }, [bhpId, reset, router]);

  const onSubmit = async (data: BhpFormData) => {
    try {
      await sinapraService.updateLabBhp(bhpId, {
        ...data,
        ruangan_id: Number(data.ruangan_id),
      });
      toast.success('Bahan Habis Pakai (BHP) berhasil diperbarui');
      router.push('/sinapra/laboratorium');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memperbarui data BHP lab');
    }
  };

  return (
    <div className="w-full flex-col grid-cols-1 space-y-4">
      <PageHeader
        title="Edit Bahan Habis Pakai (BHP)"
        description="Pembaruan informasi dan spesifikasi barang habis pakai laboratorium."
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
        {isLoadingData ? (
          <div className="py-6 text-center text-xs text-slate-500">Memuat data bahan habis pakai...</div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="col-span-full">
                <AsyncSelect
                  label="Ruangan Laboratorium"
                  placeholder="Cari ruangan laboratorium..."
                  loadOptions={loadRuanganLabOptions}
                  value={selectedRuangan}
                  onChange={(sel: any) => {
                    setSelectedRuangan(sel);
                    setValue('ruangan_id', sel ? sel.value : '', { shouldValidate: true });
                  }}
                />
                {errors.ruangan_id && (
                  <p className="text-xs text-[var(--module-primary)]">{errors.ruangan_id.message}</p>
                )}
              </div>

              <div>
                <Input
                  label="Kode BHP"
                  placeholder="cth: BHP-TRPL-001"
                  {...register('kode_bhp')}
                />
                {errors.kode_bhp && (
                  <p className="text-xs text-[var(--module-primary)]">{errors.kode_bhp.message}</p>
                )}
              </div>

              <div>
                <Input
                  label="Nama Bahan / Alat Habis Pakai"
                  placeholder="cth: Kabel UTP Cat6"
                  {...register('nama_bhp')}
                />
                {errors.nama_bhp && (
                  <p className="text-xs text-[var(--module-primary)]">{errors.nama_bhp.message}</p>
                )}
              </div>

              <div>
                <Select
                  label="Kategori BHP"
                  value={watch('kategori')}
                  onChange={(val) => setValue('kategori', val, { shouldValidate: true })}
                  options={kategoriOptions}
                />
                {errors.kategori && (
                  <p className="text-xs text-[var(--module-primary)]">{errors.kategori.message}</p>
                )}
              </div>

              <div>
                <Select
                  label="Satuan Barang / BHP"
                  value={watch('satuan')}
                  onChange={(val) => setValue('satuan', val, { shouldValidate: true })}
                  options={satuanOptions}
                />
                {errors.satuan && (
                  <p className="text-xs text-[var(--module-primary)]">{errors.satuan.message}</p>
                )}
              </div>

              <div>
                <Input
                  label="Stok Saat Ini"
                  type="number"
                  {...register('stok_saat_ini', { valueAsNumber: true })}
                />
                {errors.stok_saat_ini && (
                  <p className="text-xs text-[var(--module-primary)]">{errors.stok_saat_ini.message}</p>
                )}
              </div>

              <div>
                <Input
                  label="Batas Minimum Peringatan"
                  type="number"
                  {...register('stok_minimum', { valueAsNumber: true })}
                />
                {errors.stok_minimum && (
                  <p className="text-xs text-[var(--module-primary)]">{errors.stok_minimum.message}</p>
                )}
              </div>

              <div>
                <Input
                  label="Lokasi Penyimpanan Rak/Lemari"
                  placeholder="cth: Lemari A Rak 3"
                  {...register('lokasi_penyimpanan')}
                />
                {errors.lokasi_penyimpanan && (
                  <p className="text-xs text-[var(--module-primary)]">{errors.lokasi_penyimpanan.message}</p>
                )}
              </div>

              <div className="col-span-full">
                <Textarea
                  label="Spesifikasi / Keterangan Teknis"
                  placeholder="cth: Spesifikasi teknis atau grade bahan kimia..."
                  rows={2}
                  {...register('spesifikasi')}
                />
                {errors.spesifikasi && (
                  <p className="text-xs text-[var(--module-primary)]">{errors.spesifikasi.message}</p>
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
                Simpan Perubahan
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
