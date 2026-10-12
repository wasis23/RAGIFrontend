'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Calculator, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import type { KoreksiAlokasiKonsolidasi, KoreksiAlokasiSimulasi } from '@/types/sikeu.types';
import { formatRupiah } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Checkbox } from '@/components/ui/Checkbox';

const rencanaItemSchema = z
  .object({
    from_tagihan_id: z.number({ error: 'Tagihan asal wajib dipilih' }).int().positive(),
    to_tagihan_id: z.number({ error: 'Tagihan tujuan wajib dipilih' }).int().positive(),
    nominal_dialihkan: z.number({ error: 'Nominal wajib diisi' }).positive('Nominal harus lebih dari 0'),
  })
  .refine((v) => v.from_tagihan_id !== v.to_tagihan_id, {
    message: 'Tagihan asal dan tujuan tidak boleh sama',
    path: ['to_tagihan_id'],
  });

const createKoreksiSchema = z.object({
  mahasiswa_id: z.number({ error: 'Mahasiswa wajib dipilih' }).int().positive('Pilih mahasiswa terlebih dahulu'),
  alasan: z.string().min(10, 'Alasan wajib diisi minimal 10 karakter'),
  referensi: z.string().optional(),
  buat_tagihan_kekurangan: z.boolean(),
  details: z.array(rencanaItemSchema).min(1, 'Tambahkan minimal 1 rencana perpindahan alokasi'),
});

type CreateKoreksiValues = z.infer<typeof createKoreksiSchema>;

export default function CreateKoreksiPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('sikeu.tagihan.create');
  const [konsolidasi, setKonsolidasi] = useState<KoreksiAlokasiKonsolidasi | null>(null);
  const [loadingKonsolidasi, setLoadingKonsolidasi] = useState(false);
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [nominal, setNominal] = useState('');
  const [rencanaError, setRencanaError] = useState<string | null>(null);
  const [simulasi, setSimulasi] = useState<KoreksiAlokasiSimulasi | null>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    control,
    trigger,
    formState: { errors },
  } = useForm<CreateKoreksiValues>({
    resolver: zodResolver(createKoreksiSchema),
    defaultValues: { mahasiswa_id: 0, alasan: '', referensi: '', buat_tagihan_kekurangan: true, details: [] },
  });

  const { fields, append, remove, replace } = useFieldArray({ control, name: 'details' });

  const loadMahasiswaOptions = async (q: string) => {
    if (!q || q.length < 2) return [];
    try {
      const res = await sikeuService.searchMahasiswa(q);
      const list = Array.isArray(res?.data) ? res.data : [];
      return list.map((m: any) => ({
        value: m.mahasiswa_id ?? m.id,
        label: `${m.nim ?? '-'} — ${m.nama_mahasiswa ?? m.nama ?? '-'}`,
      }));
    } catch {
      return [];
    }
  };

  const muatKonsolidasi = async (id: number) => {
    setLoadingKonsolidasi(true);
    try {
      const res = await sikeuService.getKoreksiAlokasiKonsolidasi({ mahasiswa_id: id });
      setKonsolidasi(res?.data ?? null);
      replace([]);
      setSimulasi(null);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Gagal memuat tagihan mahasiswa');
    } finally {
      setLoadingKonsolidasi(false);
    }
  };

  const tambahRencana = () => {
    const parsed = rencanaItemSchema.safeParse({
      from_tagihan_id: Number(fromId),
      to_tagihan_id: Number(toId),
      nominal_dialihkan: Number(nominal),
    });
    if (!parsed.success) {
      setRencanaError(parsed.error.issues[0]?.message ?? 'Rencana tidak valid');
      return;
    }
    setRencanaError(null);
    append(parsed.data);
    setNominal('');
    setSimulasi(null);
  };

  const hitungSimulasi = async () => {
    const valid = await trigger('details');
    if (!valid) return;
    setSimLoading(true);
    try {
      const res = await sikeuService.simulateKoreksiAlokasi({ details: getValues('details') });
      setSimulasi(res?.data ?? null);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Simulasi gagal dihitung');
    } finally {
      setSimLoading(false);
    }
  };

  const onSubmit = async (values: CreateKoreksiValues) => {
    setSubmitting(true);
    try {
      const res = await sikeuService.createKoreksiAlokasiDraft({
        alasan: values.alasan,
        referensi: values.referensi || undefined,
        buat_tagihan_kekurangan: values.buat_tagihan_kekurangan,
        details: values.details,
      });
      toast.success('Draft koreksi berhasil dibuat');
      const id = (res?.data as any)?.id;
      router.push(id ? `/sikeu/koreksi-alokasi/${id}` : '/sikeu/koreksi-alokasi');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Gagal membuat draft koreksi');
    } finally {
      setSubmitting(false);
    }
  };

  const tagihanOptions = (konsolidasi?.tagihan ?? []).map((t) => ({
    value: String(t.id),
    label: `${t.nomor_tagihan} — sisa ${formatRupiah(t.sisa)} (${t.status})`,
  }));

  const detailsError = typeof errors.details?.message === 'string' ? errors.details.message : null;

  return (
    <div className="w-full space-y-4">
      <PageHeader
        title="Buat Koreksi Alokasi"
        description="Pilih mahasiswa, susun perpindahan alokasi, simulasikan dampak, lalu ajukan sebagai draft."
        backUrl="/sikeu/koreksi-alokasi"
      />

      <div className="card">
        <div className="card-body space-y-4">
          <div>
            <AsyncSelect
              label="Mahasiswa (cari NIM / nama)"
              placeholder="Ketik minimal 2 huruf..."
              loadOptions={loadMahasiswaOptions}
              error={errors.mahasiswa_id?.message}
              onChange={(opt: any) => {
                const id = Number(opt?.value);
                setValue('mahasiswa_id', Number.isFinite(id) && id > 0 ? id : 0);
                if (id > 0) {
                  muatKonsolidasi(id);
                } else {
                  setKonsolidasi(null);
                  replace([]);
                  setSimulasi(null);
                }
              }}
            />
          </div>

          {loadingKonsolidasi && <p className="text-xs text-slate-500">Memuat tagihan mahasiswa...</p>}

          {konsolidasi && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <p className="font-bold text-slate-500">TOTAL BERSIH</p>
                <p className="font-bold text-slate-900 tabular-nums">{formatRupiah(konsolidasi.ringkasan.total_tagihan_bersih)}</p>
              </div>
              <div>
                <p className="font-bold text-slate-500">TERBAYAR</p>
                <p className="font-bold text-emerald-700 tabular-nums">{formatRupiah(konsolidasi.ringkasan.total_terbayar)}</p>
              </div>
              <div>
                <p className="font-bold text-slate-500">SISA</p>
                <p className="font-bold text-rose-700 tabular-nums">{formatRupiah(konsolidasi.ringkasan.total_sisa)}</p>
              </div>
              <div>
                <p className="font-bold text-slate-500">TAGIHAN</p>
                <p className="font-bold text-slate-900">{konsolidasi.ringkasan.jumlah_tagihan} tagihan</p>
              </div>
            </div>
          )}

          {konsolidasi && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <Select label="Dari Tagihan (sumber)" value={fromId} onChange={(v: any) => setFromId(typeof v === 'object' && v?.target ? v.target.value : v)} options={[{ value: '', label: 'Pilih sumber...' }, ...tagihanOptions]} />
              <Select label="Ke Tagihan (tujuan)" value={toId} onChange={(v: any) => setToId(typeof v === 'object' && v?.target ? v.target.value : v)} options={[{ value: '', label: 'Pilih tujuan...' }, ...tagihanOptions]} />
              <Input label="Nominal Dialihkan (Rp)" type="number" min={1} placeholder="cth. 1500000" value={nominal} onChange={(e) => setNominal(e.target.value)} />
              <div>
                <Button variant="outline" icon={<Plus size={16} />} onClick={tambahRencana} className="w-full font-bold">
                  Tambah
                </Button>
              </div>
            </div>
          )}
          {rencanaError && <span className="form-error">{rencanaError}</span>}

          {fields.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700">Rencana Perpindahan ({fields.length})</p>
              {fields.map((r, i) => (
                <div key={r.id} className="flex items-center justify-between gap-3 p-2.5 bg-white border border-slate-200 rounded-xl text-xs">
                  <span className="font-semibold text-slate-700">
                    #{r.from_tagihan_id} → #{r.to_tagihan_id} — <span className="font-bold tabular-nums">{formatRupiah(r.nominal_dialihkan)}</span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 size={14} />}
                    onClick={() => {
                      remove(i);
                      setSimulasi(null);
                    }}
                    className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 text-xs font-bold h-7 px-2"
                  >
                    Hapus
                  </Button>
                </div>
              ))}
              <Button variant="outline" icon={<Calculator size={16} />} onClick={hitungSimulasi} disabled={simLoading} className="font-bold">
                {simLoading ? 'Menghitung...' : 'Hitung Simulasi Dampak'}
              </Button>
            </div>
          )}
          {detailsError && <span className="form-error">{detailsError}</span>}

          {simulasi && (
            <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl text-xs space-y-2">
              <p className="font-bold text-blue-900">Total dialihkan: {formatRupiah(simulasi.total_dialihkan)}</p>
              {simulasi.dampak_target.map((d) => (
                <p key={d.to_tagihan_id} className="text-slate-700">
                  {d.nomor_tagihan}: sisa {formatRupiah(d.sisa_sebelum)} → <strong>{formatRupiah(d.sisa_setelah)}</strong>{' '}
                  {d.akan_lunas ? '(lunas)' : '(masih kurang)'}
                </p>
              ))}
              {simulasi.ada_kekurangan && (
                <p className="font-bold text-amber-800">{simulasi.usulan_tagihan_kekurangan} — akan otomatis diterbitkan saat diterapkan.</p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 pt-2 border-t border-slate-100">
            <div>
              <Textarea label="Alasan Koreksi *" {...register('alasan')} placeholder="cth. SK Pindah Prodi No. 123/2026, alokasi dipindahkan ke tagihan prodi baru" error={errors.alasan?.message} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Referensi Surat" {...register('referensi')} placeholder="No. SK / nota dinas (opsional)" />
              <div className="flex items-end pb-2">
                <Checkbox
                  label="Otomatis buatkan tagihan kekurangan bila target masih bersisa"
                  checked={watch('buat_tagihan_kekurangan')}
                  onChange={(e: any) => setValue('buat_tagihan_kekurangan', !!(e?.target ? e.target.checked : e))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()} className="font-bold">
                Batal
              </Button>
              {canCreate ? (
                <Button type="submit" variant="primary" icon={<Send size={16} />} loading={submitting} className="font-bold">
                  Ajukan Draft
                </Button>
              ) : (
                <p className="text-xs text-amber-700 font-semibold self-center">Anda tidak memiliki izin membuat koreksi.</p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
