'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { RichTextarea } from '@/components/ui/RichTextarea';
import { siakadService } from '@/services/siakad.service';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export interface SoalFormInitial {
  rps_id: number | '';
  minggu_ke: string;
  sub_cpmk_id: string;
  pertanyaan: string;
  bobot: number;
  kunci_jawaban: string;
}

export default function SoalForm({
  title,
  description,
  breadcrumbLabel,
  submitLabel,
  initial,
  soalId,
  loadingInitial = false,
}: {
  title: string;
  description: string;
  breadcrumbLabel: string;
  submitLabel: string;
  initial?: SoalFormInitial | null;
  soalId?: number;
  loadingInitial?: boolean;
}) {
  const router = useRouter();
  const { user } = useAuthStore();
  const userRoles = user?.roles?.map((r: any) => (typeof r === 'string' ? r : r.slug)) || [];
  const isDosenOnly = userRoles.includes('dosen') && !userRoles.includes('superadmin') && !userRoles.includes('admin') && !userRoles.includes('kaprodi') && !userRoles.includes('wakil_prodi');
  const [taughtMkIds, setTaughtMkIds] = useState<number[]>([]);
  const [rpsList, setRpsList] = useState<any[]>([]);

  useEffect(() => {
    if (!isDosenOnly) return;
    siakadService
      .getKelas({ my_teaching_only: true, per_page: 200 })
      .then((res) => {
        const ids: number[] = (res.data || []).map((k: any) => Number(k.mata_kuliah_id)).filter(Boolean);
        setTaughtMkIds([...new Set(ids)]);
      })
      .catch(() => setTaughtMkIds([]));
  }, [isDosenOnly]);

  const rpsTerlihat = isDosenOnly ? rpsList.filter((r: any) => taughtMkIds.includes(r.mata_kuliah_id)) : rpsList;
  const [rpsDetail, setRpsDetail] = useState<any | null>(null);
  const [form, setForm] = useState<SoalFormInitial>({
    rps_id: '',
    minggu_ke: '1',
    sub_cpmk_id: '',
    pertanyaan: '',
    bobot: 10,
    kunci_jawaban: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    siakadService
      .getRps({ per_page: 200 } as any)
      .then((res) => {
        if (Array.isArray(res.data)) setRpsList(res.data);
      })
      .catch(() => toast.error('Gagal memuat daftar RPS'));
  }, []);

  useEffect(() => {
    if (initial) setForm({ ...initial });
  }, [initial]);

  useEffect(() => {
    if (!form.rps_id) {
      setRpsDetail(null);
      return;
    }
    siakadService
      .showRps(Number(form.rps_id))
      .then((res) => {
        if (res.data) setRpsDetail(res.data);
      })
      .catch(() => toast.error('Gagal memuat detail RPS'));
  }, [form.rps_id]);

  const subOptions: { value: number; label: string }[] = [];
  (rpsDetail?.mata_kuliah?.cpmks || []).forEach((c: any) => {
    (c.subCpmks || c.sub_cpmks || []).forEach((sc: any) => {
      subOptions.push({
        value: sc.id,
        label: `${c.kode_cpmk} / ${sc.kode_sub_cpmk || 'Sub'} — ${(sc.deskripsi || '').substring(0, 50)}`,
      });
    });
  });

  const plainText = (html: string) =>
    String(html || '')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.rps_id || !plainText(form.pertanyaan)) {
      toast.error('RPS dan pertanyaan wajib diisi');
      return;
    }
    try {
      setSaving(true);
      const mg = (rpsDetail?.mingguan || []).find((m: any) => String(m.minggu_ke) === String(form.minggu_ke));
      await siakadService.saveSoal({
        id: soalId,
        rps_id: Number(form.rps_id),
        rps_mingguan_id: mg?.id || undefined,
        sub_cpmk_id: form.sub_cpmk_id ? Number(form.sub_cpmk_id) : undefined,
        pertanyaan: form.pertanyaan.trim(),
        bobot: Number(form.bobot) || 0,
        kunci_jawaban: form.kunci_jawaban || undefined,
      });
      toast.success(soalId ? 'Soal berhasil diperbarui' : 'Soal tersimpan ke bank soal');
      router.push('/siakad/obe/soal');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan soal');
    } finally {
      setSaving(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-slate-400">
        <span className="text-xs font-bold animate-pulse">Memuat data soal...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Bank Soal', href: '/siakad/obe/soal' },
          { label: breadcrumbLabel },
        ]}
        action={
          <Button variant="outline" icon={<ArrowLeft size={16} />} onClick={() => router.push('/siakad/obe/soal')}>
            Kembali
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="md:col-span-2 lg:col-span-3">
            <Select
              label="RPS Tujuan *"
              required
              placeholder="Pilih RPS (MK • periode)..."
              options={rpsTerlihat.map((r: any) => ({
                value: r.id,
                label: `${r.mata_kuliah?.kode_mk || ''} — ${r.mata_kuliah?.nama || ''} (${r.tahun_ajaran || ''})`,
              }))}
              value={form.rps_id || ''}
              onChange={(v: any) => setForm({ ...form, rps_id: Number(v) || '', sub_cpmk_id: '' })}
            />
          </div>
          <div>
            <label className="label">Minggu Ke *</label>
            <select
              value={form.minggu_ke}
              onChange={(e) => setForm({ ...form, minggu_ke: e.target.value })}
              className="select w-full"
            >
              {Array.from({ length: 16 }, (_, i) => (
                <option key={i + 1} value={i + 1}>Minggu {i + 1}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <Select
              label="SubCPMK (opsional)"
              placeholder="Umum — isi SubCPMK dulu di tab CPMK bila kosong"
              options={subOptions}
              value={form.sub_cpmk_id || ''}
              onChange={(v: any) => setForm({ ...form, sub_cpmk_id: String(v || '') })}
              isClearable
            />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <RichTextarea
              label="Pertanyaan *"
              required
              placeholder="Tulis butir soal... (teks, daftar, penekanan)"
              value={form.pertanyaan}
              onChange={(html) => setForm({ ...form, pertanyaan: html })}
            />
          </div>
          <Input
            label="Bobot"
            type="number"
            min={0}
            value={form.bobot}
            onChange={(e) => setForm({ ...form, bobot: Number(e.target.value) })}
            className="font-mono"
          />
          <div className="md:col-span-2">
            <RichTextarea
              label="Kunci Jawaban (opsional)"
              placeholder="Kunci / rubrik singkat..."
              value={form.kunci_jawaban}
              onChange={(html) => setForm({ ...form, kunci_jawaban: html })}
              minHeight={64}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={() => router.push('/siakad/obe/soal')}>
            Batal
          </Button>
          <Button type="submit" variant="primary" icon={<Save size={16} />} loading={saving} disabled={saving}>
            {saving ? 'Menyimpan...' : submitLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}
