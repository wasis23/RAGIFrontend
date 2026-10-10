'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  User, 
  TrendingUp, 
  TrendingDown 
} from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { simpegService } from '@/services/simpeg.service';
import { formatRupiah } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const pegawaiKomponenItemSchema = z.object({
  komponen_gaji_id: z.number(),
  kode: z.string(),
  nama: z.string(),
  jenis: z.enum(['pendapatan', 'potongan']),
  tipe_nilai: z.string(),
  nilai_default: z.number(),
  nominal_kustom: z.number().min(0, 'Nominal tidak boleh bernilai negatif'),
  is_active: z.boolean(),
  catatan: z.string().optional().nullable(),
});

const pegawaiKomponenFormSchema = z.object({
  items: z.array(pegawaiKomponenItemSchema),
});

type PegawaiKomponenFormValues = z.infer<typeof pegawaiKomponenFormSchema>;

export default function UbahNominalKomponenPegawaiPage() {
  const router = useRouter();
  const params = useParams();
  const pegawaiId = Number(params?.id);

  const { hasPermission } = useAuth();
  const canManage = hasPermission('simpeg.payroll.manage');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pegawai, setPegawai] = useState<any>(null);

  const form = useForm<PegawaiKomponenFormValues>({
    resolver: zodResolver(pegawaiKomponenFormSchema),
    defaultValues: {
      items: [],
    },
  });

  const { fields, replace, update } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const loadData = useCallback(async () => {
    if (!pegawaiId) return;
    try {
      setLoading(true);
      const res: any = await simpegService.getPegawaiKomponenList(pegawaiId);
      const data = res?.data || {};
      setPegawai(data.pegawai || null);
      
      const list: any[] = data.komponen || [];
      const formItems = list.map((item) => ({
        komponen_gaji_id: item.komponen_gaji_id,
        kode: item.kode,
        nama: item.nama,
        jenis: item.jenis,
        tipe_nilai: item.tipe_nilai,
        nilai_default: Number(item.nilai_default || 0),
        nominal_kustom: item.nominal_kustom !== null ? Number(item.nominal_kustom) : Number(item.nilai_default || 0),
        is_active: item.is_active ?? true,
        catatan: item.catatan || '',
      }));

      replace(formItems);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memuat konfigurasi komponen pegawai');
    } finally {
      setLoading(false);
    }
  }, [pegawaiId, replace]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleResetToDefault = (index: number) => {
    const current = fields[index];
    update(index, {
      ...current,
      nominal_kustom: current.nilai_default,
      catatan: '',
    });
    toast.success(`Nominal ${current.nama} dikembalikan ke nilai master (${formatRupiah(current.nilai_default)})`);
  };

  const onSubmit = async (values: PegawaiKomponenFormValues) => {
    if (!canManage) {
      toast.error('Anda tidak memiliki hak akses mengubah nominal komponen');
      return;
    }

    try {
      setSaving(true);
      const payload = values.items.map((item) => ({
        komponen_gaji_id: item.komponen_gaji_id,
        nominal_kustom: Number(item.nominal_kustom || 0),
        is_active: item.is_active,
        catatan: item.catatan || null,
      }));

      await simpegService.savePegawaiKomponenList(pegawaiId, payload);
      toast.success('Konfigurasi nominal komponen pegawai berhasil disimpan!');
      router.push('/simpeg/payroll/komponen');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan konfigurasi');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-3">
        <div className="w-8 h-8 border-4 border-[var(--module-primary)] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-500 font-medium">Memuat rincian komponen pegawai...</span>
      </div>
    );
  }

  // Pisahkan index pendapatan vs potongan
  const pendapatanIndices = fields
    .map((item, idx) => ({ item, idx }))
    .filter(({ item }) => item.jenis === 'pendapatan');

  const potonganIndices = fields
    .map((item, idx) => ({ item, idx }))
    .filter(({ item }) => item.jenis === 'potongan');

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Ubah Nominal Komponen Pegawai"
        description={`Kustomisasi besaran pendapatan dan potongan penggajian khusus pegawai: ${pegawai?.nama_lengkap || 'Pegawai'}`}
        backUrl="/simpeg/payroll/komponen"
        action={
          canManage && (
            <Button
              icon={<Save size={16} />}
              onClick={form.handleSubmit(onSubmit)}
              loading={saving}
            >
              Simpan Perubahan
            </Button>
          )
        }
      />

      {/* Profil Ringkas Pegawai */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[var(--module-primary-subtle)] text-[var(--module-primary)] flex items-center justify-center font-bold text-base shrink-0">
              <User size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  {pegawai?.nama_lengkap}
                </h3>
                <Badge variant={pegawai?.is_active ? 'success' : 'danger'}>
                  {pegawai?.is_active ? 'Aktif' : 'Nonaktif'}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-2xs text-slate-500 dark:text-slate-400">
                <span>NIP: <strong className="text-slate-700 dark:text-slate-200">{pegawai?.nip || '-'}</strong></span>
                <span>•</span>
                <span>Jenis: <strong className="capitalize text-slate-700 dark:text-slate-200">{pegawai?.jenis_pegawai || '-'}</strong></span>
                <span>•</span>
                <span>Status Kepegawaian: <strong className="capitalize text-slate-700 dark:text-slate-200">{(pegawai?.status_kepegawaian || '-').replace('_', ' ')}</strong></span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  Status Absensi: 
                  <Badge variant={pegawai?.terdampak_absensi ? 'success' : 'warning'}>
                    {pegawai?.terdampak_absensi ? 'Terdampak Presensi' : 'Bebas Absensi'}
                  </Badge>
                </span>
              </div>
            </div>
          </div>
          <div className="text-2xs text-slate-500 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 max-w-sm">
            💡 <em>Nilai yang diubah di sini akan meng-override (menimpa) nilai default master penggajian saat slip payroll dikalkulasikan.</em>
          </div>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Grid 2 Kolom Compact: Pendapatan vs Potongan */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Kolom 1: Pendapatan & Tunjangan */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Badge variant="success">
                  <TrendingUp size={14} className="mr-1 inline" />
                  Pendapatan & Tunjangan
                </Badge>
              </div>
              <Badge variant="success">{pendapatanIndices.length} Komponen</Badge>
            </div>

            <div className="space-y-3">
              {pendapatanIndices.map(({ item, idx }) => {
                const currentNominal = form.watch(`items.${idx}.nominal_kustom`);
                const isDefault = Number(currentNominal) === item.nilai_default;
                const errNominal = form.formState.errors.items?.[idx]?.nominal_kustom?.message;

                return (
                  <div 
                    key={item.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                            {item.nama}
                          </span>
                          <span className="text-2xs font-mono px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {item.kode}
                          </span>
                        </div>
                        <div className="text-2xs text-slate-500 mt-0.5">
                          Tipe: <span className="font-medium text-slate-700 dark:text-slate-300">{item.tipe_nilai.replace('_', ' ')}</span> | Nilai Master: <span className="font-semibold">{formatRupiah(item.nilai_default)}</span>
                        </div>
                      </div>

                      {!isDefault && (
                        <DropdownMenu
                          items={[
                            {
                              label: 'Kembalikan ke Nilai Master',
                              onClick: () => handleResetToDefault(idx),
                            },
                          ]}
                        />
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <Input
                          label="Nominal (Rp)"
                          type="number"
                          placeholder="0"
                          {...form.register(`items.${idx}.nominal_kustom`, { valueAsNumber: true })}
                          error={errNominal}
                        />
                      </div>
                      <div>
                        <Input
                          label="Catatan / Dasar Kustom"
                          placeholder="Misal: SK Direktur No. 12"
                          {...form.register(`items.${idx}.catatan`)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {pendapatanIndices.length === 0 && (
                <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200">
                  Tidak ada komponen pendapatan aktif.
                </div>
              )}
            </div>
          </div>

          {/* Kolom 2: Potongan */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Badge variant="danger">
                  <TrendingDown size={14} className="mr-1 inline" />
                  Potongan Penggajian
                </Badge>
              </div>
              <Badge variant="danger">{potonganIndices.length} Komponen</Badge>
            </div>

            <div className="space-y-3">
              {potonganIndices.map(({ item, idx }) => {
                const currentNominal = form.watch(`items.${idx}.nominal_kustom`);
                const isDefault = Number(currentNominal) === item.nilai_default;
                const errNominal = form.formState.errors.items?.[idx]?.nominal_kustom?.message;

                return (
                  <div 
                    key={item.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                            {item.nama}
                          </span>
                          <span className="text-2xs font-mono px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {item.kode}
                          </span>
                        </div>
                        <div className="text-2xs text-slate-500 mt-0.5">
                          Tipe: <span className="font-medium text-slate-700 dark:text-slate-300">{item.tipe_nilai.replace('_', ' ')}</span> | Nilai Master: <span className="font-semibold">{formatRupiah(item.nilai_default)}</span>
                        </div>
                      </div>

                      {!isDefault && (
                        <DropdownMenu
                          items={[
                            {
                              label: 'Kembalikan ke Nilai Master',
                              onClick: () => handleResetToDefault(idx),
                            },
                          ]}
                        />
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <Input
                          label="Nominal Potongan (Rp)"
                          type="number"
                          placeholder="0"
                          {...form.register(`items.${idx}.nominal_kustom`, { valueAsNumber: true })}
                          error={errNominal}
                        />
                      </div>
                      <div>
                        <Input
                          label="Catatan / No. Polis/Pinjaman"
                          placeholder="Misal: Polis BPJS 00123"
                          {...form.register(`items.${idx}.catatan`)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {potonganIndices.length === 0 && (
                <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200">
                  Tidak ada komponen potongan aktif.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/simpeg/payroll/komponen')}
          >
            Batal
          </Button>
          {canManage && (
            <Button
              type="submit"
              icon={<Save size={16} />}
              loading={saving}
            >
              Simpan Konfigurasi Pegawai
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
