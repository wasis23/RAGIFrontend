'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { kasKecilService } from '@/services/kas-kecil.service';
import { sikeuService } from '@/services/sikeu.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import type { AkunKeuangan } from '@/types/sikeu.types';

const unitKasKecilSchema = z.object({
  nama_kas: z.string().min(3, 'Nama kas kecil minimal 3 karakter'),
  fakultas_id: z.number({ error: 'Fakultas wajib dipilih' }).int('Fakultas wajib dipilih'),
  penanggung_jawab_id: z.number({ error: 'Petugas penanggung jawab wajib dipilih' }).int('Petugas wajib dipilih'),
  akun_keuangan_id: z.number({ error: 'Akun kas (COA aset) wajib dipilih' }).int('Akun COA wajib dipilih'),
  saldo_awal: z.coerce.number({ error: 'Saldo awal wajib diisi' }).min(0, 'Saldo awal tidak boleh negatif'),
  deskripsi: z.string().optional(),
});

type UnitKasKecilForm = z.infer<typeof unitKasKecilSchema>;

const apiErrorMessage = (err: unknown, fallback: string): string => {
  const e = err as { response?: { data?: { message?: string } } } | null | undefined;
  return e?.response?.data?.message || fallback;
};

export default function CreateKasKecilUnitPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [coaList, setCoaList] = useState<AkunKeuangan[]>([]);
  const [selectedFakultas, setSelectedFakultas] = useState<{ value: string; label: string } | null>(null);
  const [selectedPetugas, setSelectedPetugas] = useState<{ value: string; label: string } | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UnitKasKecilForm>({
    resolver: zodResolver(unitKasKecilSchema) as unknown as Resolver<UnitKasKecilForm>,
    defaultValues: {
      nama_kas: '',
      fakultas_id: undefined,
      penanggung_jawab_id: undefined,
      akun_keuangan_id: undefined,
      saldo_awal: 0,
      deskripsi: '',
    },
  });

  const watchAkun = watch('akun_keuangan_id');

  // COA kelompok aset (Kas & Bank 101/102)
  useEffect(() => {
    const fetchCoa = async () => {
      try {
        const res = await sikeuService.getCoaList('aset');
        const list = Array.isArray(res.data) ? res.data : [];
        setCoaList(
          list.filter(
            (a) =>
              String(a.kode_akun || '').startsWith('101') ||
              String(a.kode_akun || '').startsWith('102')
          )
        );
      } catch {
        setCoaList([]);
      }
    };
    fetchCoa();
  }, []);

  // Server-side AsyncSelect: Fakultas (master siakad_fakultas via referensi sikeu)
  const loadFakultasOptions = useCallback(async (inputValue: string) => {
    try {
      const res = await kasKecilService.referensiFakultas();
      const list = Array.isArray(res.data) ? res.data : [];
      const q = inputValue.trim().toLowerCase();
      const filtered = q ? list.filter((f) => f.nama.toLowerCase().includes(q)) : list;
      return filtered.map((f) => ({ value: String(f.id), label: f.nama }));
    } catch {
      return [];
    }
  }, []);

  // Server-side AsyncSelect: Petugas Kas Kecil (role petugas_kas_kecil)
  const loadPetugasOptions = useCallback(async (inputValue: string) => {
    try {
      const res = await kasKecilService.referensiPetugas(inputValue || undefined);
      const list = Array.isArray(res.data) ? res.data : [];
      return list.map((p) => ({ value: String(p.id), label: p.label }));
    } catch {
      return [];
    }
  }, []);

  const onSubmit = async (form: UnitKasKecilForm) => {
    setSubmitting(true);
    try {
      await kasKecilService.createUnit({
        nama_kas: form.nama_kas,
        fakultas_id: form.fakultas_id,
        penanggung_jawab_id: form.penanggung_jawab_id,
        akun_keuangan_id: form.akun_keuangan_id,
        saldo_awal: Number(form.saldo_awal) || 0,
        deskripsi: form.deskripsi?.trim() || undefined,
      });
      toast.success('Unit kas kecil berhasil didaftarkan');
      router.push('/sikeu/kas-kecil');
    } catch (err: unknown) {
      toast.error(apiErrorMessage(err, 'Gagal membuat unit kas kecil'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl pb-12">
      <PageHeader
        title="Tambah Unit Kas Kecil"
        description="Daftarkan kas kecil untuk fakultas/unit dan tunjuk Petugas Kas Kecil sebagai penanggung jawab."
        action={
          <Button
            variant="outline"
            icon={<ArrowLeft size={16} />}
            onClick={() => router.push('/sikeu/kas-kecil')}
            className="font-bold min-h-[38px] text-xs"
          >
            Kembali
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 size={18} className="text-primary-600" />
              Informasi Unit Kas Kecil
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Setiap unit wajib memiliki pemetaan akun kas (COA kelompok aset 101/102) agar jurnal otomatis akurat.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              label="Nama Kas Kecil *"
              placeholder="Contoh: Kas Kecil Fakultas Teknik"
              {...register('nama_kas')}
              error={errors.nama_kas?.message}
            />

            <div>
              <label className="form-label">
                Fakultas <span className="required">*</span>
              </label>
              <Controller
                control={control}
                name="fakultas_id"
                render={({ field }) => (
                  <AsyncSelect
                    loadOptions={loadFakultasOptions}
                    value={selectedFakultas}
                    onChange={(val: { value: string; label: string } | null) => {
                      setSelectedFakultas(val || null);
                      field.onChange(val ? Number(val.value) : undefined);
                    }}
                    placeholder="Pilih fakultas..."
                    error={errors.fakultas_id?.message as string | undefined}
                    isClearable
                  />
                )}
              />
              {errors.fakultas_id && (
                <span className="form-error">{errors.fakultas_id.message}</span>
              )}
            </div>

            <div>
              <label className="form-label">
                Petugas Penanggung Jawab <span className="required">*</span>
              </label>
              <Controller
                control={control}
                name="penanggung_jawab_id"
                render={({ field }) => (
                  <AsyncSelect
                    loadOptions={loadPetugasOptions}
                    value={selectedPetugas}
                    onChange={(val: { value: string; label: string } | null) => {
                      setSelectedPetugas(val || null);
                      field.onChange(val ? Number(val.value) : undefined);
                    }}
                    placeholder="Ketik nama/username petugas..."
                    error={errors.penanggung_jawab_id?.message as string | undefined}
                    isClearable
                  />
                )}
              />
              {errors.penanggung_jawab_id && (
                <span className="form-error">{errors.penanggung_jawab_id.message}</span>
              )}
            </div>

            <Select
              label="Akun Kas (COA Aset 101/102) *"
              options={[
                ...(watchAkun ? [] : [{ value: '', label: '-- Pilih akun kas --' }]),
                ...coaList.map((a) => ({ value: String(a.id), label: `[${a.kode_akun}] ${a.nama_akun}` })),
              ]}
              value={watchAkun?.toString() || ''}
              onChange={(val) => setValue('akun_keuangan_id', val ? Number(val) : null as unknown as number, { shouldValidate: true })}
              error={errors.akun_keuangan_id?.message}
            />

            <Input
              label="Saldo Awal (Rp) *"
              type="number"
              min={0}
              placeholder="0"
              {...register('saldo_awal')}
              error={errors.saldo_awal?.message}
            />

            <div className="lg:col-span-1">
              <Textarea
                label="Deskripsi / Catatan"
                placeholder="Peruntukan kas kecil, batasan pengeluaran harian, dsb."
                rows={3}
                {...register('deskripsi')}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/sikeu/kas-kecil')}
            disabled={submitting}
            className="font-bold min-h-[42px] px-5"
          >
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={submitting}
            loading={submitting}
            icon={!submitting ? <Save size={18} /> : undefined}
            className="font-bold shadow-md min-h-[42px] px-6"
          >
            {submitting ? 'Menyimpan...' : 'Simpan Unit Kas Kecil'}
          </Button>
        </div>
      </form>
    </div>
  );
}