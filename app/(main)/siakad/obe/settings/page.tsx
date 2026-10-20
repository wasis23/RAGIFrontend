'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sliders, Save, CheckCircle2, ShieldAlert } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { SEMESTER_OPTIONS } from '@/components/siakad/DistribusiMengajarForm';
import { siakadService } from '@/services/siakad.service';
import { useObeSettings } from '@/lib/obe-settings';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

const obeSettingsSchema = z.object({
  tahun_akademik_id: z.string().min(1, 'Tahun Akademik wajib dipilih'),
  semester: z.string().min(1, 'Semester wajib dipilih'),
  kurikulum_id: z.string().min(1, 'Kurikulum wajib dipilih'),
});

type ObeSettingsFormData = z.infer<typeof obeSettingsSchema>;

export default function ObeSettingsPage() {
  const { user, hasPermission, isSuperAdmin } = useAuth();
  const isAdminObe = Boolean(
    isSuperAdmin ||
    (((user as any)?.siakad_admin_prodis || (user as any)?.siakadAdminProdis || []).filter((p: any) => p.is_active !== false).length > 0)
  );
  const canRead = hasPermission('siakad.kurikulum.read') || isAdminObe;
  const canManage = hasPermission('siakad.kurikulum.manage') || isAdminObe;

  const { settings, loading: settingsLoading, updateSettings } = useObeSettings();
  const [saving, setSaving] = useState(false);

  const [selectedTaLabel, setSelectedTaLabel] = useState<string>('-');
  const [selectedKurikulumLabel, setSelectedKurikulumLabel] = useState<string>('-');

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ObeSettingsFormData>({
    resolver: zodResolver(obeSettingsSchema),
    defaultValues: {
      tahun_akademik_id: '',
      semester: 'Ganjil',
      kurikulum_id: '',
    },
  });

  const watchedTaId = watch('tahun_akademik_id');
  const watchedSemester = watch('semester');
  const watchedKurikulumId = watch('kurikulum_id');

  const loadTahunAkademikOptions = useCallback(async (keyword: string) => {
    try {
      const res = await siakadService.getTahunAkademiks({ search: keyword || undefined, per_page: 50 });
      const raw = res?.data;
      const list: any[] = Array.isArray(raw) ? raw : (raw?.items || raw || []);
      return list.map((ta: any) => {
        const cleanLabel = ta.tahun_mulai && ta.tahun_selesai
          ? `${ta.tahun_mulai}/${ta.tahun_selesai}`
          : (ta.nama || ta.kode);
        return {
          value: String(ta.id),
          label: ta.nama && ta.nama !== cleanLabel ? `${cleanLabel} (${ta.nama})` : cleanLabel,
          cleanLabel,
          raw: ta,
        };
      });
    } catch {
      return [];
    }
  }, []);

  const loadKurikulumOptions = useCallback(async (keyword: string) => {
    try {
      const kurRes = await siakadService.getKurikulums({ search: keyword || undefined, per_page: 50 });
      const raw = kurRes?.data;
      const list: any[] = Array.isArray(raw) ? raw : (raw?.items || raw || []);
      return list.map((k: any) => {
        const kode = k.kode || `K-${k.id}`;
        const tahun = k.tahun_berlaku || '-';
        const sks = k.total_sks_lulus || '-';
        const nama = k.nama ? ` ${k.nama}` : '';
        const cleanLabel = `${kode} - ${tahun} - ${sks} -${nama}`;
        return {
          value: String(k.id),
          label: cleanLabel,
          cleanLabel,
          raw: k,
        };
      });
    } catch {
      return [];
    }
  }, []);

  // Inisialisasi form dari settings OBE
  useEffect(() => {
    if (settings) {
      if (settings.tahun_akademik_id) {
        setValue('tahun_akademik_id', String(settings.tahun_akademik_id));
        if (settings.tahun_akademik_label) {
          setSelectedTaLabel(settings.tahun_akademik_label);
        }
      }
      if (settings.semester) {
        setValue('semester', settings.semester);
      }
      if (settings.kurikulum_id) {
        setValue('kurikulum_id', String(settings.kurikulum_id));
        if (settings.kurikulum_label) {
          setSelectedKurikulumLabel(settings.kurikulum_label);
        }
      }
    }
  }, [settings, setValue]);

  const onSubmit = async (data: ObeSettingsFormData) => {
    if (!canManage) {
      toast.error('Anda tidak memiliki wewenang untuk mengubah pengaturan OBE');
      return;
    }

    try {
      setSaving(true);
      await updateSettings({
        tahun_akademik_id: Number(data.tahun_akademik_id),
        semester: data.semester,
        kurikulum_id: Number(data.kurikulum_id),
      });
      toast.success('Pengaturan OBE berhasil disimpan');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan pengaturan OBE');
    } finally {
      setSaving(false);
    }
  };

  if (!canRead) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center space-y-4">
        <div className="inline-flex p-3 rounded-full bg-amber-50 text-amber-600">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-base font-bold text-slate-800">Akses Terbatas</h2>
        <p className="text-xs text-slate-500">
          Anda tidak memiliki wewenang untuk melihat atau mengubah Pengaturan Konteks OBE.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in max-w-4xl mx-auto">
      <PageHeader
        title="Pengaturan OBE"
        description="Konfigurasi tahun akademik, semester, dan kurikulum aktif yang digunakan pada modul OBE."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'OBE', href: '/siakad/obe' },
          { label: 'Pengaturan OBE' },
        ]}
      />

      <Card>
        <CardBody className="p-6">
          <div className="flex items-center gap-3 pb-4 mb-6 border-b border-slate-100">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
              style={{ background: 'var(--module-primary-subtle)', color: 'var(--module-primary)' }}
            >
              <Sliders size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Konteks Tahun & Kurikulum OBE</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pengaturan ini akan otomatis menjadi filter aktif pada Distribusi Mata Kuliah dan Kelola RPS.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Field 1: Tahun Akademik */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Tahun Akademik <span className="text-rose-500">*</span>
              </label>
              <Controller
                name="tahun_akademik_id"
                control={control}
                render={({ field }) => (
                  <AsyncSelect
                    placeholder="Pilih Tahun Akademik..."
                    loadOptions={loadTahunAkademikOptions}
                    value={field.value ? Number(field.value) : null}
                    onChange={(opt: any) => {
                      const val = opt?.value ? String(opt.value) : '';
                      field.onChange(val);
                      if (opt?.cleanLabel || opt?.label) {
                        setSelectedTaLabel(opt.cleanLabel || opt.label);
                      }
                    }}
                    isDisabled={settingsLoading || saving || !canManage}
                    isClearable={false}
                  />
                )}
              />
              {errors.tahun_akademik_id && (
                <p className="text-2xs text-rose-500 mt-1">{errors.tahun_akademik_id.message}</p>
              )}
            </div>

            {/* Field 2: Semester */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Semester <span className="text-rose-500">*</span>
              </label>
              <Controller
                name="semester"
                control={control}
                render={({ field }) => (
                  <Select
                    options={SEMESTER_OPTIONS}
                    value={field.value}
                    onChange={(v) => field.onChange(v || 'Ganjil')}
                    placeholder="Pilih Semester..."
                    disabled={settingsLoading || saving || !canManage}
                  />
                )}
              />
              {errors.semester && (
                <p className="text-2xs text-rose-500 mt-1">{errors.semester.message}</p>
              )}
            </div>

            {/* Field 3: Kurikulum */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Kurikulum <span className="text-rose-500">*</span>
              </label>
              <Controller
                name="kurikulum_id"
                control={control}
                render={({ field }) => (
                  <AsyncSelect
                    placeholder="Pilih Kurikulum..."
                    loadOptions={loadKurikulumOptions}
                    value={field.value ? Number(field.value) : null}
                    onChange={(opt: any) => {
                      const val = opt?.value ? String(opt.value) : '';
                      field.onChange(val);
                      if (opt?.cleanLabel || opt?.label) {
                        setSelectedKurikulumLabel(opt.cleanLabel || opt.label);
                      }
                    }}
                    isDisabled={settingsLoading || saving || !canManage}
                    isClearable={false}
                  />
                )}
              />
              {errors.kurikulum_id && (
                <p className="text-2xs text-rose-500 mt-1">{errors.kurikulum_id.message}</p>
              )}
            </div>

            {/* Info Box Ringkasan Pengaturan Aktif */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
              <CheckCircle2 size={18} className="text-[var(--module-primary)] mt-0.5 shrink-0" />
              <div className="text-xs space-y-1">
                <p className="font-semibold text-slate-800">Ringkasan Konteks Aktif:</p>
                <p className="text-slate-600">
                  Tahun Akademik: <span className="font-bold text-slate-900">{selectedTaLabel}</span> • Semester:{' '}
                  <span className="font-bold text-slate-900">{watchedSemester || '-'}</span> • Kurikulum:{' '}
                  <span className="font-bold text-slate-900">{selectedKurikulumLabel}</span>
                </p>
                <p className="text-2xs text-slate-400">
                  Perubahan akan diterapkan secara otomatis saat membuka modul Distribusi Mata Kuliah dan Kelola RPS.
                </p>
              </div>
            </div>

            {/* Tombol Simpan */}
            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                type="submit"
                disabled={saving || settingsLoading || !canManage}
                isLoading={saving}
                icon={<Save size={16} />}
              >
                Simpan Pengaturan
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
