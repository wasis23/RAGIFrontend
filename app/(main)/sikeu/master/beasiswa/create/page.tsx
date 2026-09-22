'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Loader2, Award, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { sikeuService, MasterBiaya } from '@/services/sikeu.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';

const beasiswaSchema = z.object({
  kode: z.string().min(2, 'Kode beasiswa minimal 2 karakter').max(50, 'Kode maksimal 50 karakter'),
  nama: z.string().min(3, 'Nama beasiswa minimal 3 karakter'),
  sumber: z.enum(['internal', 'pemerintah', 'swasta', 'yayasan']),
  tipe_potongan: z.enum(['persen', 'nominal']),
  nilai_potongan: z.number().min(1, 'Nilai potongan wajib lebih dari 0'),
  berlaku_angkatan_mulai: z.number().min(2000, 'Tahun angkatan tidak valid'),
  berlaku_angkatan_sampai: z.number().min(2000, 'Tahun angkatan tidak valid'),
  deskripsi: z.string().optional(),
});

type BeasiswaFormData = z.infer<typeof beasiswaSchema>;

export default function CreateBeasiswaPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [jenisBiayaList, setJenisBiayaList] = useState<MasterBiaya[]>([]);
  const [selectedJenisBiayaIds, setSelectedJenisBiayaIds] = useState<number[]>([]);
  const [loadingBiaya, setLoadingBiaya] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BeasiswaFormData>({
    resolver: zodResolver(beasiswaSchema) as any,
    defaultValues: {
      kode: '',
      nama: '',
      sumber: 'internal',
      tipe_potongan: 'persen',
      nilai_potongan: 100,
      berlaku_angkatan_mulai: 2023,
      berlaku_angkatan_sampai: 2027,
      deskripsi: '',
    },
  });

  const watchTipePotongan = watch('tipe_potongan');
  const watchSumber = watch('sumber');

  useEffect(() => {
    sikeuService.getJenisBiayaList()
      .then((res) => {
        const items = Array.isArray(res.data) ? res.data : [];
        setJenisBiayaList(items);
        // Default check UKT fees
        const uktIds = items.filter((b) => b.tipe === 'ukt' || b.kode?.includes('UKT')).map((b) => b.id);
        setSelectedJenisBiayaIds(uktIds.length > 0 ? uktIds : items.slice(0, 1).map((b) => b.id));
      })
      .catch(() => {
        setJenisBiayaList([]);
      })
      .finally(() => {
        setLoadingBiaya(false);
      });
  }, []);

  const toggleJenisBiaya = (id: number) => {
    setSelectedJenisBiayaIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const onSubmit = async (data: BeasiswaFormData) => {
    setSubmitting(true);
    try {
      await sikeuService.storeBeasiswa({
        kode: data.kode,
        nama: data.nama,
        sumber: data.sumber,
        tipe_potongan: data.tipe_potongan,
        nilai_potongan: data.nilai_potongan,
        jenis_biaya_ids: selectedJenisBiayaIds,
        berlaku_angkatan_mulai: data.berlaku_angkatan_mulai,
        berlaku_angkatan_sampai: data.berlaku_angkatan_sampai,
        deskripsi: data.deskripsi || undefined,
      });

      toast.success('Master program beasiswa baru berhasil dibuat!');
      router.push('/sikeu/master?tab=beasiswa');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Gagal menyimpan program beasiswa');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      <PageHeader
        title="Tambah Master Program Beasiswa"
        description="Kelola skema beasiswa, sumber dana penyandang, besaran diskon potongan, dan komponen biaya yang dicover."
        action={
          <Button
            variant="outline"
            icon={<ArrowLeft size={16} />}
            onClick={() => router.push('/sikeu/master?tab=beasiswa')}
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
              <Award size={18} className="text-primary-600" />
              Identitas & Skema Program Beasiswa
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tentukan kode, nama beasiswa, sumber pendanaan, serta formula potongannya.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Kode Beasiswa *"
              placeholder="Contoh: KIP_KULIAH, BEASISWA_YAYASAN"
              {...register('kode')}
              error={errors.kode?.message}
            />

            <Input
              label="Nama Program Beasiswa *"
              placeholder="Contoh: Beasiswa KIP Kuliah Merdeka"
              {...register('nama')}
              error={errors.nama?.message}
            />

            <Select
              label="Sumber Pendanaan Beasiswa *"
              options={[
                { value: 'internal', label: 'Internal Kampus / Rektorat' },
                { value: 'pemerintah', label: 'Pemerintah (Kemendikbud / Kemenag)' },
                { value: 'swasta', label: 'Swasta / Korporasi / CSR' },
                { value: 'yayasan', label: 'Yayasan Pembina Lembaga' },
              ]}
              value={watchSumber}
              onChange={(val) => setValue('sumber', val as any, { shouldValidate: true })}
            />

            <Select
              label="Tipe Potongan Tagihan *"
              options={[
                { value: 'persen', label: 'Persentase (%)' },
                { value: 'nominal', label: 'Nominal Tetap (Rp)' },
              ]}
              value={watchTipePotongan}
              onChange={(val) => setValue('tipe_potongan', val as any, { shouldValidate: true })}
            />

            <Input
              type="number"
              label={watchTipePotongan === 'persen' ? 'Besaran Potongan (%) *' : 'Nominal Potongan (Rp) *'}
              placeholder={watchTipePotongan === 'persen' ? '100' : '3000000'}
              {...register('nilai_potongan', { valueAsNumber: true })}
              error={errors.nilai_potongan?.message}
            />

            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                label="Angkatan Mulai *"
                placeholder="2023"
                {...register('berlaku_angkatan_mulai', { valueAsNumber: true })}
                error={errors.berlaku_angkatan_mulai?.message}
              />
              <Input
                type="number"
                label="Angkatan Sampai *"
                placeholder="2027"
                {...register('berlaku_angkatan_sampai', { valueAsNumber: true })}
                error={errors.berlaku_angkatan_sampai?.message}
              />
            </div>
          </div>

          {/* Cakupan Komponen Biaya */}
          <div className="space-y-3 p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-primary-600" />
                <span className="text-xs font-bold text-slate-900">
                  Cakupan Komponen Biaya yang Dicover Beasiswa
                </span>
              </div>
              <span className="text-2xs font-extrabold px-2.5 py-0.5 bg-primary-100 text-primary-700 rounded-md">
                {selectedJenisBiayaIds.length} Terpilih
              </span>
            </div>
            <p className="text-2xs text-slate-500">
              Centang komponen tagihan yang akan dipotong oleh beasiswa ini saat invoice diterbitkan.
            </p>

            {loadingBiaya ? (
              <div className="py-4 flex items-center justify-center gap-2 text-xs text-slate-400">
                <Loader2 size={16} className="animate-spin text-primary-600" />
                <span>Memuat master jenis biaya...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-48 overflow-y-auto">
                {jenisBiayaList.map((biaya) => {
                  const isChecked = selectedJenisBiayaIds.includes(biaya.id);
                  return (
                    <label
                      key={biaya.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        isChecked
                          ? 'border-primary-400 bg-white shadow-2xs text-primary-950 font-bold'
                          : 'border-slate-200 bg-slate-100/60 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleJenisBiaya(biaya.id)}
                          className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
                        />
                        <span>{biaya.nama}</span>
                      </div>
                      <span className="text-[10px] uppercase font-mono text-slate-400">{biaya.kode}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <Textarea
            label="Keterangan & Deskripsi Syarat"
            placeholder="Persyaratan IPK minimal, instansi penyandang dana, atau catatan kontrak ikatan dinas..."
            rows={3}
            {...register('deskripsi')}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/sikeu/master?tab=beasiswa')}
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
            {submitting ? 'Menyimpan...' : 'Simpan Master Beasiswa'}
          </Button>
        </div>
      </form>
    </div>
  );
}
