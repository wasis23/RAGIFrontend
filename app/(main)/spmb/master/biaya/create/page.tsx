'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, Plus, AlertCircle } from 'lucide-react';
import { useForm, Controller, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { Badge } from '@/components/ui/Badge';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { spmbService } from '@/services/spmb.service';
import { formatRupiah, formatGelombangLabel } from '@/lib/utils';
import type { MasterKomponenBiaya, GelombangPenerimaan } from '@/types/spmb.types';
import toast from 'react-hot-toast';

const masterBiayaFormSchema = z.object({
  gelombang_id: z.string().min(1, 'Gelombang penerimaan wajib dipilih'),
  program_studi_id: z.string().min(1, 'Program studi wajib dipilih'),
  is_active: z.boolean(),
  keterangan: z.string().max(255, 'Keterangan maksimal 255 karakter').optional().or(z.literal('')),
  items: z.array(
    z.object({
      komponen_biaya_id: z.number(),
      nominal: z.number().min(0, 'Nominal tidak boleh negatif'),
      dibebankan_saat_pendaftaran: z.boolean().optional(),
      nama: z.string(),
      kode: z.string(),
      kategori: z.string().optional().nullable(),
      keterangan: z.string().optional().nullable(),
    })
  ),
});

type MasterBiayaFormValues = z.infer<typeof masterBiayaFormSchema>;

export default function CreateMasterBiayaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [gelombangList, setGelombangList] = useState<GelombangPenerimaan[]>([]);
  const [prodiList, setProdiList] = useState<any[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const isLoadedRef = useRef(false);

  const defaultGelombangId = searchParams.get('gelombang_id') || '';
  const defaultProdiId = searchParams.get('program_studi_id') || '';

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<MasterBiayaFormValues>({
    resolver: zodResolver(masterBiayaFormSchema),
    defaultValues: {
      gelombang_id: defaultGelombangId,
      program_studi_id: defaultProdiId,
      is_active: true,
      keterangan: '',
      items: [],
    },
  });

  const { fields, replace } = useFieldArray({
    control,
    name: 'items',
  });

  const watchItems = useWatch({ control, name: 'items' });

  useEffect(() => {
    if (isLoadedRef.current) return;
    isLoadedRef.current = true;

    const loadPrerequisites = async () => {
      try {
        setLoadingInitial(true);
        const [gelRes, prodiRes, kompRes] = await Promise.all([
          spmbService.getGelombang({ per_page: 100 }),
          spmbService.getProgramStudi({ limit: 100 }),
          spmbService.getKomponenBiayaList({ is_active: true, limit: 100 }),
        ]);

        const gelsRaw = gelRes?.data;
        const gels: GelombangPenerimaan[] = Array.isArray(gelsRaw) ? gelsRaw : gelsRaw?.items || [];
        setGelombangList(gels);
        if (gels.length > 0 && !defaultGelombangId) {
          const activeGel = gels.find((g) => g.status === 'aktif') || gels[0];
          setValue('gelombang_id', String(activeGel.id));
        }

        const prodis = Array.isArray(prodiRes?.data) ? prodiRes.data : [];
        setProdiList(prodis);
        if (prodis.length > 0 && !defaultProdiId) {
          setValue('program_studi_id', String(prodis[0].id));
        }

        const komps = Array.isArray(kompRes?.data) ? kompRes.data : [];
        const initialItems = komps.map((k: MasterKomponenBiaya) => ({
          komponen_biaya_id: k.id,
          nominal: 0,
          dibebankan_saat_pendaftaran: false,
          nama: k.nama,
          kode: k.kode,
          kategori: k.kategori,
          keterangan: k.keterangan,
        }));
        replace(initialItems);

      } catch (error) {
        console.error('Failed to load initial data:', error);
        toast.error('Gagal memuat data master pendukung');
      } finally {
        setLoadingInitial(false);
      }
    };

    loadPrerequisites();
  }, [defaultGelombangId, defaultProdiId, replace, setValue]);

  const handleNominalChange = (index: number, rawValue: string) => {
    const cleanNumber = Math.max(0, Number(rawValue.replace(/\D/g, '')) || 0);
    setValue(`items.${index}.nominal`, cleanNumber, { shouldValidate: true });
  };

  // Live Total
  const calculatedTotal = (watchItems || []).reduce(
    (acc, val) => acc + (Number(val?.nominal) || 0),
    0
  );

  // Total beban awal (dibebankan saat pendaftaran) & sisanya (daftar ulang)
  const calculatedPendaftaran = (watchItems || [])
    .filter((v) => v?.dibebankan_saat_pendaftaran)
    .reduce((acc, val) => acc + (Number(val?.nominal) || 0), 0);

  const calculatedDaftarUlang = Math.max(0, calculatedTotal - calculatedPendaftaran);

  const onSubmit = async (values: MasterBiayaFormValues) => {
    if (values.items.length === 0) {
      toast.error('Belum ada komponen biaya aktif. Tambahkan komponen biaya terlebih dahulu.');
      return;
    }

    try {
      setSubmitting(true);
      await spmbService.createMasterBiaya({
        gelombang_id: Number(values.gelombang_id),
        program_studi_id: Number(values.program_studi_id),
        is_active: values.is_active,
        keterangan: values.keterangan?.trim() || undefined,
        items: values.items.map((it) => ({
          komponen_biaya_id: it.komponen_biaya_id,
          nominal: it.nominal || 0,
          dibebankan_saat_pendaftaran: it.dibebankan_saat_pendaftaran ?? false,
        })),
      });

      toast.success('Konfigurasi biaya program studi berhasil disimpan');
      router.push('/spmb/master/biaya');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'Gagal menyimpan data');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Tambah Master Biaya"
        description="Tetapkan paket biaya awal (DPI, UKT, Seragam, dll) untuk program studi pada gelombang pilihan"
        action={
          <Button
            variant="outline"
            onClick={() => router.back()}
            style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
            icon={<ArrowLeft size={16} />}
          >
            Kembali
          </Button>
        }
      />

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* 1. INFORMASI GELOMBANG & PRODI */}
            <div className="border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">
                Informasi Gelombang & Program Studi
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Controller
                  control={control}
                  name="gelombang_id"
                  render={({ field }) => (
                    <Select
                      label="Gelombang Penerimaan"
                      required
                      value={field.value}
                      onChange={field.onChange}
                      options={gelombangList.map((g) => ({
                        value: String(g.id),
                        label: formatGelombangLabel(g),
                      }))}
                      error={errors.gelombang_id?.message}
                      hint="Biaya berlaku untuk gelombang ini (jalur & tahun akademik mengikuti gelombang)."
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="program_studi_id"
                  render={({ field }) => (
                    <Select
                      label="Program Studi"
                      required
                      value={field.value}
                      onChange={field.onChange}
                      options={prodiList.map((p) => ({
                        value: String(p.id),
                        label: `${p.jenjang ? `[${p.jenjang}] ` : ''}${p.nama}`,
                      }))}
                      error={errors.program_studi_id?.message}
                      hint="Pilih program studi yang akan diatur biayanya."
                    />
                  )}
                />

                <div className="col-span-full">
                  <Checkbox
                    label="Status Aktif (Konfigurasi biaya ini berlaku)"
                    hint="Nonaktifkan jika tarif pembiayaan prodi ini sedang tidak diberlakukan."
                    {...register('is_active')}
                  />
                </div>
              </div>
            </div>

            {/* 2. RINCIAN KOMPONEN BIAYA */}
            <div className="border-b border-slate-100 pb-4 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
                    Rincian Komponen Biaya
                  </h3>
                  <p className="text-xs text-slate-500 mt-2">
                    Masukkan nominal rupiah untuk masing-masing pos komponen pembiayaan prodi.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={<Plus size={16} />}
                  onClick={() => router.push('/spmb/master/komponen-biaya')}
                >
                  Kelola Komponen
                </Button>
              </div>

              {loadingInitial ? (
                <div className="py-6 text-center text-sm text-slate-400">
                  Memuat rincian komponen...
                </div>
              ) : fields.length === 0 ? (
                <div className="py-6 px-4 text-center border-2 border-dashed border-slate-300 rounded-xl bg-slate-50">
                  <AlertCircle size={20} className="mx-auto text-slate-400 mb-2" />
                  <p className="text-sm font-medium text-slate-700">
                    Belum ada data komponen biaya aktif di sistem
                  </p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-2 mb-4">
                    Tambahkan komponen pembiayaan (seperti UKT, DPI, Seragam) di Master Komponen Biaya sebelum mengatur rincian biaya per program studi.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon={<Plus size={16} />}
                    onClick={() => router.push('/spmb/master/komponen-biaya')}
                  >
                    Tambah Komponen Biaya Dulu
                  </Button>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
                  <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-3 bg-white border-b border-slate-200 text-2xs font-bold uppercase text-slate-500">
                    <div className="col-span-1 text-center">No</div>
                    <div className="col-span-4">Komponen Biaya</div>
                    <div className="col-span-2 text-center">Kode</div>
                    <div className="col-span-3 text-right">Nominal (Rp)</div>
                    <div className="col-span-2 text-center">Beban Pendaftaran</div>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {fields.map((field, index) => {
                      const currentNom = watchItems?.[index]?.nominal ?? 0;

                      return (
                        <div
                          key={field.id}
                          className="grid grid-cols-1 md:grid-cols-12 gap-2 px-4 py-3 bg-white hover:bg-slate-50 transition-colors items-center"
                        >
                          <div className="hidden md:block col-span-1 text-center text-slate-400 font-mono text-xs">
                            {index + 1}
                          </div>
                          <div className="md:col-span-4">
                            <div className="font-medium text-slate-800">{field.nama}</div>
                            {field.keterangan && (
                              <div className="text-xs text-slate-400 mt-2">{field.keterangan}</div>
                            )}
                          </div>
                          <div className="md:col-span-2 md:text-center">
                            <Badge variant="secondary" className="font-mono text-xs bg-slate-100 text-slate-700 border border-slate-200">
                              {field.kode}
                            </Badge>
                          </div>
                          <div className="md:col-span-3">
                            <Input
                              placeholder="0"
                              className="text-right font-mono"
                              prefixIcon={<span className="text-xs font-semibold text-slate-400">Rp</span>}
                              value={currentNom > 0 ? currentNom.toLocaleString('id-ID') : ''}
                              onChange={(e) => handleNominalChange(index, e.target.value)}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Controller
                              control={control}
                              name={`items.${index}.dibebankan_saat_pendaftaran`}
                              render={({ field }) => (
                                <div className="flex flex-col items-center gap-2">
                                  <ToggleSwitch
                                    checked={!!field.value}
                                    disabled={currentNom <= 0}
                                    onChange={field.onChange}
                                  />
                                  <span className="text-2xs text-slate-400 font-medium">
                                    {field.value ? 'Beban awal' : 'Saat daftar ulang'}
                                  </span>
                                </div>
                              )}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="bg-white border-t-2 border-slate-200 divide-y divide-slate-100">
                    <div className="flex items-center justify-between px-4 py-2">
                      <span className="text-xs text-slate-600">Total Beban Pendaftaran:</span>
                      <span className="font-mono text-sm" style={{ color: 'var(--module-primary)' }}>{formatRupiah(calculatedPendaftaran)}</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2">
                      <span className="text-xs text-slate-600">Total Beban Daftar Ulang:</span>
                      <span className="font-mono text-sm text-slate-700">{formatRupiah(calculatedDaftarUlang)}</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-slate-700 font-semibold">Total Biaya Awal Masuk:</span>
                      <span className="font-mono text-base font-bold" style={{ color: 'var(--module-primary)' }}>{formatRupiah(calculatedTotal)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. KETERANGAN / CATATAN */}
            <div className="mb-6">
              <Textarea
                label="Keterangan / Catatan Tambahan (Opsional)"
                placeholder="Contoh: DPI dapat diangsur selama 3 semester. Biaya seragam mencakup 2 stel praktek & almamater."
                hint="Opsional, catatan khusus mengenai ketentuan pembiayaan prodi ini."
                {...register('keterangan')}
                error={errors.keterangan?.message}
                rows={3}
              />
            </div>

            {/* 4. ACTION BUTTONS */}
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={submitting}
                disabled={submitting || loadingInitial}
                icon={<Save size={16} />}
              >
                Simpan Konfigurasi Biaya
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
