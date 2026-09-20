'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Loader2,
  DollarSign,
  AlertCircle,
  Info,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import { formatRupiah } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';

const tarifSchema = z.object({
  master_biaya_id: z.number().min(1, 'Komponen biaya wajib dipilih dari katalog'),
  tahun_angkatan: z.number().min(2000, 'Tahun angkatan wajib diisi (minimal tahun 2000)'),
  program_studi_id: z.string().optional(),
  nominal: z.number().min(0, 'Nominal tarif tidak boleh bernilai negatif'),
  keterangan: z.string().optional(),
  is_active: z.boolean().default(true),
});

type TarifFormData = z.infer<typeof tarifSchema>;

export default function EditTarifBiayaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Master References
  const [katalogBiaya, setKatalogBiaya] = useState<any[]>([]);
  const [prodiList, setProdiList] = useState<any[]>([]);
  const [angkatanOptions, setAngkatanOptions] = useState<number[]>([]);
  const [existingTarifs, setExistingTarifs] = useState<any[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TarifFormData>({
    resolver: zodResolver(tarifSchema) as any,
    defaultValues: {
      master_biaya_id: 0,
      tahun_angkatan: new Date().getFullYear(),
      program_studi_id: '',
      nominal: 0,
      keterangan: '',
      is_active: true,
    },
  });

  const watchMasterBiayaId = watch('master_biaya_id');
  const watchAngkatan = watch('tahun_angkatan');
  const watchProdiId = watch('program_studi_id');
  const watchIsActive = watch('is_active');

  // Load master data and existing item
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoadingData(true);
      try {
        const [resKatalog, resProdi, resAngkatan, resTarifList, resDetail] = await Promise.all([
          sikeuService.getPembayaranMahasiswaKatalogBiaya(),
          sikeuService.getPembayaranMahasiswaProdiList(),
          sikeuService.getAngkatanList(),
          sikeuService.getPembayaranMahasiswaTarifList({ per_page: 100 }),
          sikeuService.getPembayaranMahasiswaTarifDetail(id),
        ]);

        const katalog = Array.isArray(resKatalog.data) ? resKatalog.data : [];
        const prodis = Array.isArray(resProdi.data) ? resProdi.data : [];
        const angkatans = Array.isArray(resAngkatan.data) ? resAngkatan.data : [];
        const tarifs = Array.isArray(resTarifList.data) ? resTarifList.data : [];

        setKatalogBiaya(katalog);
        setProdiList(prodis);
        setExistingTarifs(tarifs);
        setAngkatanOptions(
          angkatans.length > 0 ? angkatans : [2027, 2026, 2025, 2024, 2023, 2022, 2021, 2020]
        );

        if (resDetail?.data) {
          const detail = resDetail.data;
          reset({
            master_biaya_id: detail.master_biaya_id,
            tahun_angkatan: detail.tahun_angkatan,
            program_studi_id: detail.program_studi_id ? String(detail.program_studi_id) : '',
            nominal: Number(detail.nominal),
            keterangan: detail.keterangan || '',
            is_active: Boolean(detail.is_active),
          });
        }
      } catch (err) {
        console.error('Error fetching tarif detail:', err);
        toast.error('Gagal memuat detail tarif komponen biaya');
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [id, reset]);

  // Deteksi real-time apakah komponen biaya pada angkatan ini sudah aktif untuk Semua Program Studi (Global) pada item lain
  const existingGlobalTarif = useMemo(() => {
    if (!watchMasterBiayaId || !watchAngkatan || !id) return null;
    return existingTarifs.find(
      (t) =>
        t.id !== Number(id) &&
        t.master_biaya_id === Number(watchMasterBiayaId) &&
        t.tahun_angkatan === Number(watchAngkatan) &&
        (t.program_studi_id === null || t.program_studi_id === undefined) &&
        t.is_active
    );
  }, [watchMasterBiayaId, watchAngkatan, existingTarifs, id]);

  // Deteksi real-time apakah sudah ada tarif spesifik per prodi yang aktif untuk komponen & angkatan ini pada item lain
  const existingProdiTarifs = useMemo(() => {
    if (!watchMasterBiayaId || !watchAngkatan || !id) return [];
    return existingTarifs.filter(
      (t) =>
        t.id !== Number(id) &&
        t.master_biaya_id === Number(watchMasterBiayaId) &&
        t.tahun_angkatan === Number(watchAngkatan) &&
        t.program_studi_id &&
        t.is_active
    );
  }, [watchMasterBiayaId, watchAngkatan, existingTarifs, id]);

  const handleBiayaChange = (val: string) => {
    const bId = Number(val);
    setValue('master_biaya_id', bId, { shouldValidate: true });
  };

  const onSubmitForm = async (formData: TarifFormData) => {
    setSubmitting(true);
    try {
      const payload = {
        master_biaya_id: formData.master_biaya_id,
        tahun_angkatan: formData.tahun_angkatan,
        program_studi_id: formData.program_studi_id ? Number(formData.program_studi_id) : null,
        nominal: formData.nominal,
        keterangan: formData.keterangan || null,
        is_active: formData.is_active,
      };

      await sikeuService.updatePembayaranMahasiswaTarif(id, payload);
      toast.success('Pengaturan tarif komponen biaya berhasil diperbarui!');
      router.push('/sikeu/pembayaran-mahasiswa/tarif');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Gagal memperbarui tarif');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6 animate-fade-in">
      <PageHeader
        breadcrumbs={[
          { label: 'Keuangan', href: '/sikeu' },
          { label: 'Pembayaran Mahasiswa', href: '/sikeu/pembayaran-mahasiswa/tarif' },
          { label: 'Pengaturan Tarif', href: '/sikeu/pembayaran-mahasiswa/tarif' },
          { label: 'Edit Tarif' },
        ]}
        title="Edit Tarif Komponen Biaya"
        description="Perbarui pengaturan tarif komponen biaya berdasarkan program studi dan tahun angkatan mahasiswa."
        action={
          <Link
            href="/sikeu/pembayaran-mahasiswa/tarif"
            className="btn btn-warning flex items-center gap-1.5 font-bold text-xs"
            title="Kembali ke Daftar Tarif"
          >
            <ArrowLeft size={16} />
            <span>Kembali</span>
          </Link>
        }
      />

      {loadingData ? (
        <div className="p-12 bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 size={28} className="animate-spin text-primary-600" />
          <p className="text-xs font-semibold">Memuat rincian data tarif komponen biaya...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
          {/* Peringatan Real-Time jika sudah ada tarif Semua Program Studi pada item lain */}
          {existingGlobalTarif && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 shadow-2xs">
              <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs sm:text-sm font-bold text-amber-950">
                  Tarif Global Sudah Aktif untuk Semua Program Studi
                </p>
                <p className="text-xs text-amber-800 mt-1">
                  Komponen biaya ini sudah disetting aktif berlaku menyeluruh untuk <strong>Semua Program Studi</strong> pada Angkatan {watchAngkatan} sebesar <strong>{formatRupiah(existingGlobalTarif.nominal)}</strong> pada data lain.
                </p>
              </div>
            </div>
          )}

          {/* Peringatan jika memilih Semua Prodi namun sudah ada tarif spesifik prodi */}
          {!existingGlobalTarif && !watchProdiId && existingProdiTarifs.length > 0 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3 shadow-2xs">
              <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs sm:text-sm font-bold text-blue-950">
                  Perhatian: Tarif Spesifik Program Studi Telah Dikonfigurasi
                </p>
                <p className="text-xs text-blue-800 mt-1">
                  Sudah terdapat <strong>{existingProdiTarifs.length} program studi</strong> yang memiliki tarif spesifik aktif untuk komponen & angkatan ini. Harap nonaktifkan tarif prodi terlebih dahulu jika ingin menerapkan satu tarif seragam untuk Semua Program Studi.
                </p>
              </div>
            </div>
          )}

          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-5">
            <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <DollarSign size={16} className="text-primary-600" />
              <span>Informasi Penetapan Tarif Komponen Biaya</span>
            </h2>

            {/* Grid Form Compact Maksimal 3 Kolom Sesuai Standar UI */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Field 1: Komponen Biaya Katalog */}
              <div className="lg:col-span-2">
                <Select
                  label="Pilih Komponen Biaya dari Katalog *"
                  options={[
                    { value: '', label: '-- Pilih Komponen Biaya --' },
                    ...katalogBiaya.map((b) => ({
                      value: String(b.id),
                      label: `${b.kode} - ${b.nama} (Standar: ${formatRupiah(b.nominal_standar)})`,
                    })),
                  ]}
                  value={watchMasterBiayaId ? String(watchMasterBiayaId) : ''}
                  onChange={handleBiayaChange}
                  error={errors.master_biaya_id?.message}
                />
              </div>

              {/* Field 2: Tahun Angkatan */}
              <div>
                <Select
                  label="Tahun Angkatan *"
                  options={angkatanOptions.map((ang) => ({
                    value: String(ang),
                    label: `Angkatan ${ang}`,
                  }))}
                  value={String(watch('tahun_angkatan'))}
                  onChange={(val) => setValue('tahun_angkatan', Number(val), { shouldValidate: true })}
                  error={errors.tahun_angkatan?.message}
                />
              </div>

              {/* Field 3: Program Studi Target */}
              <div>
                <Select
                  label="Program Studi Target *"
                  options={[
                    { value: '', label: 'Semua Program Studi (Berlaku Global)' },
                    ...prodiList.map((p) => ({
                      value: String(p.id),
                      label: `${p.nama} (${p.jenjang || 'S1'})`,
                    })),
                  ]}
                  value={watchProdiId || ''}
                  onChange={(val) => setValue('program_studi_id', val as string)}
                />
              </div>

              {/* Field 4: Nominal Tarif */}
              <div>
                <Input
                  type="number"
                  label="Nominal Tarif (Rp) *"
                  placeholder="Contoh: 5000000"
                  {...register('nominal', { valueAsNumber: true })}
                  error={errors.nominal?.message}
                />
              </div>

              {/* Field 5: Status Tarif */}
              <div>
                <Select
                  label="Status Tarif *"
                  options={[
                    { value: 'true', label: 'Aktif' },
                    { value: 'false', label: 'Non-Aktif' },
                  ]}
                  value={watchIsActive ? 'true' : 'false'}
                  onChange={(val) => setValue('is_active', val === 'true')}
                />
              </div>

              {/* Field 6: Keterangan / Dasar Kebijakan (Rentang Penuh) */}
              <div className="col-span-full">
                <Textarea
                  label="Keterangan / Catatan Tambahan (Opsional)"
                  placeholder="Dasar penetapan SK tarif, ketentuan khusus, atau rincian peruntukan biaya..."
                  rows={3}
                  {...register('keterangan')}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/sikeu/pembayaran-mahasiswa/tarif')}
                disabled={submitting}
                className="text-xs font-bold"
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={submitting || Boolean(existingGlobalTarif) || (!watchProdiId && existingProdiTarifs.length > 0)}
                icon={submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                className="text-xs font-bold shadow-sm px-6"
              >
                {submitting ? 'Menyimpan Perubahan...' : 'Simpan Perubahan Tarif'}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
