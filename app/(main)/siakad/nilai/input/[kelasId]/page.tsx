'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Award,
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  Download,
  BookOpen,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

const scoreFieldSchema = z
  .string()
  .refine(
    (val) => {
      if (val === '' || val === undefined || val === null) return true;
      const num = Number(val);
      return !isNaN(num) && num >= 0 && num <= 100;
    },
    { message: 'Nilai harus berupa angka 0 sampai 100' }
  );

const gradingFormSchema = z.object({
  grades: z.record(
    z.string(),
    z.record(z.string(), scoreFieldSchema)
  ),
});

type GradingFormValues = {
  grades: Record<string, Record<string, string>>;
};

export default function InputNilaiKelasPage() {
  const router = useRouter();
  const params = useParams();
  const kelasId = Number(params?.kelasId);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [kelasData, setKelasData] = useState<any | null>(null);
  const [komponenList, setKomponenList] = useState<any[]>([]);
  const [pesertaList, setPesertaList] = useState<any[]>([]);
  const [modePenilaian, setModePenilaian] = useState<string>('semi_obe');
  const [skalaList, setSkalaList] = useState<any[]>([]);
  const [confirmFinalOpen, setConfirmFinalOpen] = useState(false);
  const [kelayakan, setKelayakan] = useState<{ boleh: boolean; pesan: string | null; rps?: any; bobot?: any } | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    watch,
  } = useForm<GradingFormValues>({
    resolver: zodResolver(gradingFormSchema),
    defaultValues: {
      grades: {},
    },
  });

  const watchedGrades = watch('grades') || {};

  const fetchData = useCallback(async () => {
    if (!kelasId) return;
    try {
      setLoading(true);
      const [res, skalaRes] = await Promise.all([
        siakadService.getKelasNilaiObe(kelasId),
        siakadService.getSkalaNilais().catch(() => null),
      ]);

      if (skalaRes?.data) {
        setSkalaList(skalaRes.data);
      }

      if (res?.data) {
        setKelayakan(res.data.kelayakan || null);
        setKelasData(res.data.kelas);
        setKomponenList(res.data.komponen || []);
        setModePenilaian(res.data.mode_penilaian || 'semi_obe');

        const peserta = res.data.peserta || [];
        setPesertaList(peserta);

        // Prepopulate form values dengan data nilai tersimpan
        const initialGrades: Record<string, Record<string, any>> = {};
        peserta.forEach((p: any) => {
          const detailKey = String(p.krs_detail_id);
          initialGrades[detailKey] = {};
          (res.data.komponen || []).forEach((comp: any) => {
            const compKey = String(comp.id);
            const dbVal = p.scores?.[comp.id]?.nilai_angka ?? p.scores?.[compKey]?.nilai_angka;
            initialGrades[detailKey][compKey] =
              dbVal !== undefined && dbVal !== null && dbVal > 0
                ? String(dbVal)
                : dbVal === 0
                ? '0'
                : '';
          });
        });
        reset({ grades: initialGrades });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memuat portal penilaian kelas');
    } finally {
      setLoading(false);
    }
  }, [kelasId, reset]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const calculateStudentTotal = useCallback(
    (krsDetailId: number) => {
      const studentScores = watchedGrades[String(krsDetailId)] || {};
      let total = 0;
      komponenList.forEach((comp) => {
        const raw = studentScores[String(comp.id)];
        const scoreVal = typeof raw === 'number' ? raw : (raw ? Number(raw) : 0);
        total += (scoreVal * Number(comp.bobot)) / 100;
      });
      return total;
    },
    [watchedGrades, komponenList]
  );

  const getGradeLetter = useCallback(
    (total: number) => {
      const aktif = skalaList.filter((s: any) => s.is_active !== false);
      const cocok = aktif.find((s: any) => total >= Number(s.batas_bawah) && total <= Number(s.batas_atas));
      if (cocok) {
        const huruf = String(cocok.nilai_huruf);
        const isBaik = huruf === 'A' || huruf === 'A-';
        const isCukup = huruf.startsWith('B');
        return {
          letter: huruf,
          className: isBaik
            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
            : isCukup
            ? 'bg-blue-50 text-blue-700 border-blue-100'
            : huruf.startsWith('C')
            ? 'bg-amber-50 text-amber-700 border-amber-100'
            : 'bg-red-100 text-red-800 border-red-200',
        };
      }
      if (total >= 85) return { letter: 'A', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      if (total >= 80) return { letter: 'A-', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
      if (total >= 75) return { letter: 'B+', className: 'bg-blue-100 text-blue-800 border-blue-200' };
      if (total >= 70) return { letter: 'B', className: 'bg-blue-50 text-blue-700 border-blue-100' };
      if (total >= 65) return { letter: 'B-', className: 'bg-indigo-50 text-indigo-700 border-indigo-100' };
      if (total >= 60) return { letter: 'C+', className: 'bg-amber-100 text-amber-800 border-amber-200' };
      if (total >= 55) return { letter: 'C', className: 'bg-amber-50 text-amber-700 border-amber-100' };
      if (total >= 40) return { letter: 'D', className: 'bg-rose-50 text-rose-700 border-rose-100' };
      return { letter: 'E', className: 'bg-red-100 text-red-800 border-red-200' };
    },
    [skalaList]
  );

  const handleDownloadRekap = async () => {
    try {
      setDownloading(true);
      const blob = await siakadService.downloadRekapXlsx(kelasId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `rekap_nilai_${kelasData?.kode_kelas || kelasId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Rekap nilai berhasil diunduh (XLSX)');
    } catch {
      toast.error('Gagal mengunduh berkas rekap nilai');
    } finally {
      setDownloading(false);
    }
  };

  const onValidSubmit = async (values: GradingFormValues, isFinal: boolean) => {
    try {
      setSaving(true);
      const gradesPayload = pesertaList.map((p) => {
        const studentScores = values.grades[String(p.krs_detail_id)] || {};
        const formattedScores: Record<number, number> = {};
        komponenList.forEach((comp) => {
          const val = studentScores[String(comp.id)];
          formattedScores[comp.id] = typeof val === 'number' ? val : (val ? Number(val) : 0);
        });
        return {
          krs_detail_id: p.krs_detail_id,
          scores: formattedScores,
        };
      });

      const res = await siakadService.saveBulkNilaiObe(kelasId, {
        is_final: isFinal,
        grades: gradesPayload,
      });

      toast.success(res.message || (isFinal ? 'Nilai berhasil dipublikasikan (Final)' : 'Nilai draft berhasil disimpan'));

      if (isFinal) {
        router.push('/siakad/nilai');
      } else {
        fetchData();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Gagal menyimpan nilai');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = () => {
    handleSubmit((vals) => onValidSubmit(vals, false))();
  };

  const handleSaveFinal = () => {
    handleSubmit((vals) => onValidSubmit(vals, true))();
  };

  const totalBobot = useMemo(
    () => komponenList.reduce((acc, c) => acc + (Number(c.bobot) || 0), 0),
    [komponenList]
  );
  const isBobot100 = Math.abs(totalBobot - 100) < 0.01;
  const isTerkunci = Boolean(kelayakan && !kelayakan.boleh);
  const canSave = !saving && isBobot100 && !isTerkunci;

  // Bangun ColumnDef<any>[] untuk DataTable matriks penilaian OBE
  const columns: ColumnDef<any>[] = useMemo(() => {
    const cols: ColumnDef<any>[] = [
      {
        key: 'no',
        label: '#',
        align: 'center',
        render: (_, index) => (
          <span className="font-mono text-2xs text-slate-500 font-bold">{index + 1}</span>
        ),
      },
      {
        key: 'mahasiswa',
        label: 'NIM & Mahasiswa',
        render: (row) => (
          <div className="space-y-0.5 max-w-[200px]">
            <div className="font-mono font-black text-xs text-slate-900">{row.mahasiswa?.nim || '-'}</div>
            <div className="text-2xs font-semibold text-slate-700 truncate" title={row.mahasiswa?.nama_lengkap}>
              {row.mahasiswa?.nama_lengkap || '-'}
            </div>
          </div>
        ),
      },
    ];

    // Kolom dinamis untuk setiap komponen asesmen OBE
    komponenList.forEach((comp) => {
      cols.push({
        key: `komponen_${comp.id}`,
        align: 'center',
        label: (
          <div className="text-center py-0.5">
            <span className="block text-xs font-bold text-slate-900 truncate max-w-[130px]" title={comp.nama_komponen}>
              {comp.nama_komponen}
            </span>
            <span className="block text-2xs text-slate-500 font-medium">
              {comp.cpmk ? comp.cpmk.kode_cpmk : 'Asesmen'}
            </span>
            <Badge variant="purple" className="text-2xs font-black mt-0.5">
              {comp.bobot}%
            </Badge>
          </div>
        ),
        render: (row) => (
          <div className="flex justify-center">
            <Controller
              name={`grades.${row.krs_detail_id}.${comp.id}`}
              control={control}
              render={({ field, fieldState: { error } }) => (
                <div className="flex flex-col items-center">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    disabled={isTerkunci}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value)}
                    className="w-16 h-8 text-center font-mono text-xs font-bold"
                    placeholder="0"
                  />
                  {error?.message && (
                    <span className="text-2xs text-rose-500 font-semibold mt-0.5">
                      {error.message}
                    </span>
                  )}
                </div>
              )}
            />
          </div>
        ),
      });
    });

    // Kolom Total, Huruf, dan Status
    cols.push(
      {
        key: 'total',
        label: 'Total',
        align: 'center',
        render: (row) => {
          const totalScore = calculateStudentTotal(row.krs_detail_id);
          return (
            <span className="font-mono font-black text-xs text-slate-900">
              {totalScore.toFixed(2)}
            </span>
          );
        },
      },
      {
        key: 'huruf',
        label: 'Huruf',
        align: 'center',
        render: (row) => {
          const totalScore = calculateStudentTotal(row.krs_detail_id);
          const grade = getGradeLetter(totalScore);
          return (
            <span className={`inline-block px-2 py-0.5 rounded text-2xs font-black border font-mono ${grade.className}`}>
              {grade.letter}
            </span>
          );
        },
      },
      {
        key: 'status',
        label: 'Status',
        align: 'center',
        render: (row) => {
          const isFinal = Boolean(row.is_final);
          return (
            <Badge variant={isFinal ? 'green' : 'gray'} className="text-2xs font-bold">
              {isFinal ? 'Final' : 'Draft'}
            </Badge>
          );
        },
      }
    );

    return cols;
  }, [komponenList, control, isTerkunci, calculateStudentTotal, getGradeLetter]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
        <div className="w-8 h-8 border-2 border-[var(--module-primary)] border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs font-bold">Memuat portal penilaian kelas...</span>
      </div>
    );
  }

  const mkInfo = kelasData?.mata_kuliah;
  const dosenName = kelasData?.dosen_pengampu?.[0]?.dosen?.nama_lengkap || 'Dosen Pengampu';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Input Nilai & Asesmen OBE"
        description={`Mata Kuliah: ${mkInfo?.nama || '-'} (${kelasData?.kode_kelas || '-'}) • Dosen: ${dosenName}`}
        breadcrumbs={[
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Penilaian Perkuliahan', href: '/siakad/nilai' },
          { label: 'Input Nilai Kelas' },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<ArrowLeft size={15} />}
              onClick={() => router.push('/siakad/nilai')}
              className="text-xs font-bold"
              style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
            >
              Kembali
            </Button>
          </div>
        }
      />

      {/* Header Info Kelas & Status Mode */}
      <Card className="p-5 bg-white border rounded-2xl shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 flex-wrap">
              <Award size={18} className="text-[var(--module-primary)]" />
              Kelas: {kelasData?.nama_kelas || kelasData?.kode_kelas}
              {modePenilaian === 'full_obe' && (
                <Badge variant="green" className="text-2xs font-black uppercase">Pure OBE (CPMK)</Badge>
              )}
              {modePenilaian === 'semi_obe' && (
                <Badge variant="purple" className="text-2xs font-black uppercase">Hybrid OBE (UTS/UAS)</Badge>
              )}
              {modePenilaian === 'konvensional' && (
                <Badge variant="gray" className="text-2xs font-black uppercase">Konvensional</Badge>
              )}
            </h3>
            <p className="text-2xs text-slate-500 mt-1">
              {modePenilaian === 'full_obe' && 'Mode Murni OBE: Inputkan skor (0–100) langsung untuk setiap instrumen CPMK. Nilai Akhir KHS terhitung otomatis.'}
              {modePenilaian === 'semi_obe' && 'Mode Hibrida: Inputkan nilai Tugas, UTS, UAS, Kuis. Nilai Akhir KHS & ketercapaian CPMK terhitung otomatis.'}
              {modePenilaian === 'konvensional' && 'Mode Konvensional: Inputkan nilai UTS, UAS, Tugas secara langsung untuk merekap nilai akhir perkuliahan.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Button
              variant="outline"
              icon={<Download size={14} />}
              className="text-xs font-bold"
              onClick={handleDownloadRekap}
              disabled={downloading}
            >
              {downloading ? 'Mengunduh...' : 'Unduh Rekap (XLSX)'}
            </Button>
            <Button
              variant="outline"
              icon={<Save size={14} />}
              className="text-xs font-bold"
              onClick={handleSaveDraft}
              disabled={!canSave}
              title={isTerkunci ? 'Terkunci: lengkapi RPS & bobot 100%' : undefined}
            >
              {saving ? 'Menyimpan...' : 'Simpan Draft'}
            </Button>
            <Button
              variant="primary"
              icon={<CheckCircle2 size={14} />}
              className="text-xs font-bold"
              onClick={() => setConfirmFinalOpen(true)}
              disabled={!canSave}
              title={isTerkunci ? 'Terkunci: lengkapi RPS & bobot 100%' : undefined}
            >
              Publikasikan (Final)
            </Button>
          </div>
        </div>

        {/* Banner Alert Kelayakan RPS & Bobot */}
        {kelayakan && !kelayakan.boleh && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-xs text-rose-950">
            <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="font-extrabold text-sm">Pengisian Nilai Dikunci</p>
              <p className="text-2xs leading-relaxed text-rose-800">{kelayakan.pesan}</p>
              <div className="flex items-center gap-2 flex-wrap text-2xs font-bold">
                <span className={`px-2 py-0.5 rounded border ${kelayakan.rps?.terisi ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-rose-700 border-rose-200'}`}>
                  RPS: {kelayakan.rps?.terisi ? `Terisi (${kelayakan.rps.jumlah_pertemuan} pertemuan)` : 'Belum diisi'}
                </span>
                {kelayakan.bobot && (
                  <span className={`px-2 py-0.5 rounded border ${kelayakan.bobot.valid_100 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-rose-700 border-rose-200'}`}>
                    Bobot {kelayakan.bobot.tipe === 'cpmk' ? 'CPMK' : 'komponen'}: {kelayakan.bobot.total}%
                  </span>
                )}
                <Button
                  variant="outline"
                  className="text-2xs py-1 px-2.5 h-auto font-bold"
                  onClick={() => router.push(`/siakad/perkuliahan/kelas/${kelasId}/rps`)}
                  style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
                >
                  Lengkapi RPS Kelas →
                </Button>
              </div>
            </div>
          </div>
        )}

        {!isBobot100 && komponenList.length > 0 && !kelayakan && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-950">
            <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-extrabold text-sm">
                Total Bobot Belum 100% (Saat Ini: {totalBobot}%)
              </p>
              <p className="text-2xs text-amber-800 leading-relaxed">
                Akumulasi bobot seluruh instrumen penilaian wajib tepat <strong>100.0%</strong> sebelum nilai dapat dipublikasikan.
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Matriks Penilaian Mahasiswa via DataTable */}
      <div className="card p-0 bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <BookOpen size={15} className="text-[var(--module-primary)]" />
              Matriks Penilaian Peserta ({pesertaList.length} Mahasiswa)
            </h4>
            <p className="text-2xs text-slate-500 mt-0.5">
              Nilai angka (0–100) per komponen asesmen. Total nilai akhir dan nilai huruf dihitung secara otomatis.
            </p>
          </div>
          <div className="text-2xs font-bold text-slate-600">
            Total Bobot: <span className={isBobot100 ? 'text-emerald-600' : 'text-rose-600'}>{totalBobot}%</span>
          </div>
        </div>

        {komponenList.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border-t border-dashed rounded-b-2xl text-slate-400">
            <AlertCircle size={28} className="mb-2 text-slate-300" />
            <p className="text-xs font-bold">Komponen Penilaian OBE belum dikonfigurasi.</p>
            <p className="text-2xs text-slate-400 mt-1">
              Atur komponen asesmen (UTS, UAS, Tugas, dll.) pada menu RPS atau modul Kurikulum OBE terlebih dahulu.
            </p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={pesertaList}
            isLoading={loading}
            emptyMessage="Belum ada mahasiswa yang mengambil kelas perkuliahan ini pada semester aktif."
          />
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmFinalOpen}
        onClose={() => setConfirmFinalOpen(false)}
        onConfirm={() => {
          setConfirmFinalOpen(false);
          handleSaveFinal();
        }}
        title="Publikasikan Nilai Final?"
        message="Nilai yang dipublikasikan sebagai Final akan disinkronkan ke rekap KHS mahasiswa dan ketercapaian CPMK. Pastikan seluruh skor asesmen sudah lengkap dan benar."
        confirmText="Ya, Publikasikan Final"
        variant="primary"
        isLoading={saving}
      />
    </div>
  );
}
