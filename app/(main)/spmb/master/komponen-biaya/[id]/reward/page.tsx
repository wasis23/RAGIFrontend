'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Plus, Save, Trash2, Gift, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { spmbService } from '@/services/spmb.service';
import type { MasterKomponenBiaya } from '@/types/spmb.types';

const schema = z
  .object({
    is_referral_reward: z.boolean(),
    role_rewards: z
      .array(
        z.object({
          role_id: z.number().int().positive('Role wajib dipilih'),
          nominal: z.number().min(0, 'Nominal minimal 0'),
        })
      )
      .optional(),
  })
  .superRefine((val, ctx) => {
    if (val.is_referral_reward && (!val.role_rewards || val.role_rewards.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['role_rewards'],
        message: 'Tambahkan minimal satu pemetaan role reward.',
      });
    }
  });

type FormValues = z.infer<typeof schema>;

export default function KelolaRewardReferralPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);

  const [komponen, setKomponen] = useState<MasterKomponenBiaya | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { is_referral_reward: false, role_rewards: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'role_rewards' });
  const isReward = watch('is_referral_reward');

  const loadRoleOptions = useCallback(async (input: string) => {
    const res = await spmbService.getKomponenBiayaRoleOptions({ search: input || undefined, per_page: 100 });
    const items = res?.data || [];
    return items.map((r) => ({ value: String(r.id), label: r.name }));
  }, []);

  useEffect(() => {
    if (!id || Number.isNaN(id)) {
      setLoading(false);
      return;
    }
    spmbService
      .getKomponenBiayaById(id)
      .then((res) => {
        const data: MasterKomponenBiaya | undefined = res?.data;
        if (!data) return;
        setKomponen(data);
        reset({
          is_referral_reward: Boolean(data.is_referral_reward),
          role_rewards: (data.role_rewards || []).map((r) => ({
            role_id: r.role_id,
            nominal: Number(r.nominal),
          })),
        });
      })
      .catch(() => {
        toast.error('Gagal memuat detail komponen biaya.');
      })
      .finally(() => setLoading(false));
  }, [id, reset]);

  const onSubmit = async (values: FormValues) => {
    if (!komponen) return;

    try {
      setSubmitting(true);
      await spmbService.updateKomponenBiaya(id, {
        kode: komponen.kode || undefined,
        nama: komponen.nama,
        kategori: komponen.kategori,
        tipe_potongan: komponen.tipe_potongan,
        is_active: komponen.is_active,
        keterangan: komponen.keterangan || undefined,
        is_referral_reward: values.is_referral_reward,
        role_rewards: values.is_referral_reward
          ? (values.role_rewards || []).map((r) => ({
              role_id: Number(r.role_id),
              nominal: Number(r.nominal),
            }))
          : [],
      });
      toast.success('Pemetaan reward referral berhasil disimpan.');
      router.push('/spmb/master/komponen-biaya');
    } catch (err: unknown) {
      const error = err as AxiosError<{ message?: string }>;
      toast.error(error?.response?.data?.message || 'Gagal menyimpan pemetaan reward.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Kelola Reward Referral"
        description={
          komponen
            ? `Pemetaan nominal reward per role untuk komponen "${komponen.nama}".`
            : 'Pemetaan nominal reward per role pada komponen biaya.'
        }
        action={
          <Button
            variant="outline"
            icon={<ArrowLeft size={16} />}
            style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
            onClick={() => router.push('/spmb/master/komponen-biaya')}
          >
            Kembali
          </Button>
        }
      />

      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center text-sm text-slate-500 py-6">Memuat data...</div>
          ) : !komponen ? (
            <div className="text-center text-sm text-slate-500 py-6">Komponen biaya tidak ditemukan.</div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input label="Kode Komponen" value={komponen.kode || '-'} disabled />
                <Input label="Nama Komponen" value={komponen.nama} disabled />
                <Input label="Kategori" value={komponen.kategori || '-'} disabled />
              </div>

              <Checkbox
                label="Jadikan Komponen Reward Referral"
                hint="Jika aktif, referrer dengan role di bawah akan menerima nominal reward ini per referral yang lolos."
                {...register('is_referral_reward')}
              />

              {isReward && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Gift size={16} style={{ color: 'var(--module-primary)' }} /> Pemetaan Role &amp; Nominal
                    </h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      icon={<Plus size={16} />}
                      style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
                      onClick={() => append({ role_id: 0, nominal: 0 })}
                    >
                      Tambah Role
                    </Button>
                  </div>

                  {errors.role_rewards?.root?.message && (
                    <p className="form-error">{errors.role_rewards.root.message}</p>
                  )}

                  {fields.length === 0 && (
                    <div className="flex items-start gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                      <Info size={16} className="shrink-0" style={{ color: 'var(--module-primary)' }} />
                      <span>Belum ada role. Klik &quot;Tambah Role&quot; untuk memetakan nominal reward.</span>
                    </div>
                  )}

                  {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end border-b border-slate-100 pb-4">
                      <Controller
                        control={control}
                        name={`role_rewards.${index}.role_id`}
                        render={({ field: roleField }) => (
                          <AsyncSelect
                            label="Role Referrer"
                            placeholder="Pilih Role"
                            isClearable
                            defaultOptions
                            loadOptions={loadRoleOptions}
                            value={roleField.value ? String(roleField.value) : null}
                            error={errors.role_rewards?.[index]?.role_id?.message}
                            onChange={(sel: { value?: string } | null) =>
                              roleField.onChange(sel?.value ? Number(sel.value) : undefined)
                            }
                          />
                        )}
                      />
                      <Input
                        label="Nominal Reward (Rp)"
                        type="number"
                        min={0}
                        placeholder="Contoh: 50000"
                        error={errors.role_rewards?.[index]?.nominal?.message}
                        {...register(`role_rewards.${index}.nominal`, { valueAsNumber: true })}
                      />
                      <div>
                        <Button
                          type="button"
                          variant="outline"
                          icon={<Trash2 size={16} className="text-red-500" />}
                          onClick={() => remove(index)}
                        >
                          Hapus
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.push('/spmb/master/komponen-biaya')}
                  disabled={submitting}
                >
                  Batal
                </Button>
                <Button type="submit" variant="primary" loading={submitting} disabled={submitting} icon={<Save size={16} />}>
                  Simpan Pemetaan
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
