'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { lmsService } from '@/services/lms.service';
import type { LmsQuizItem } from '@/types/lms.types';
import { Save, Info } from 'lucide-react';

const nilaiMkSchema = z.object({
  komponen_penilaian_id: z.string().optional().default(''),
});

type NilaiMkFormValues = z.infer<typeof nilaiMkSchema>;

interface KomponenObe {
  id: number;
  nama_komponen: string;
  bobot: number;
}

interface TryoutNilaiTabProps {
  quiz: LmsQuizItem;
  komponenObe: KomponenObe[];
  onChanged: () => void;
}

export default function TryoutNilaiTab({ quiz, komponenObe, onChanged }: TryoutNilaiTabProps) {
  const form = useForm<NilaiMkFormValues>({
    resolver: zodResolver(nilaiMkSchema) as any,
    defaultValues: { komponen_penilaian_id: '' },
  });

  useEffect(() => {
    form.reset({ komponen_penilaian_id: quiz.komponen_penilaian_id ? String(quiz.komponen_penilaian_id) : '' });
  }, [quiz, form]);

  const onSubmit = async (values: NilaiMkFormValues) => {
    try {
      await lmsService.updateQuiz(quiz.id, {
        komponen_penilaian_id: values.komponen_penilaian_id ? Number(values.komponen_penilaian_id) : null,
      } as any);
      toast.success('Komponen penilaian tersimpan');
      onChanged();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan komponen penilaian');
    }
  };

  const aktif = komponenObe.find((k) => k.id === quiz.komponen_penilaian_id);

  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700">Jadikan Nilai ke Mata Kuliah</h5>
        {aktif ? (
          <Badge variant="green">{aktif.nama_komponen} • {aktif.bobot}%</Badge>
        ) : (
          <Badge variant="gray">Belum ditautkan</Badge>
        )}
      </div>

      <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-2xs text-slate-600">
        <Info size={16} className="shrink-0 mt-0.5 text-slate-400" />
        <span>
          Pilih komponen penilaian OBE mata kuliah untuk menautkan tryout ini. Nilai attempt mahasiswa yang sudah
          dinilai (termasuk nilai manual uraian) tersinkron otomatis ke komponen tersebut.
        </span>
      </div>

      {komponenObe.length === 0 ? (
        <p className="text-2xs text-slate-400">Belum ada komponen OBE pada kelas ini.</p>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <Controller
            name="komponen_penilaian_id"
            control={form.control}
            render={({ field }) => (
              <Select
                label="Komponen Penilaian OBE"
                placeholder="Pilih komponen... (kosongkan = lepas tautan)"
                value={field.value}
                onChange={field.onChange}
                options={komponenObe.map((k) => ({ value: String(k.id), label: `${k.nama_komponen} • ${k.bobot}%` }))}
                isClearable
                error={form.formState.errors.komponen_penilaian_id?.message}
              />
            )}
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              loading={form.formState.isSubmitting}
              disabled={form.formState.isSubmitting}
              icon={<Save size={16} />}
            >
              Simpan
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
