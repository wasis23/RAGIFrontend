'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Award, ArrowLeft, Save, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { siakadService } from '@/services/siakad.service';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function InputNilaiKelasPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const kelasId = Number(params.kelasId);

  const userRoles = user?.roles?.map((r: any) => typeof r === 'string' ? r : r.slug) || [];
  const isAdmin = userRoles.includes('superadmin') || userRoles.includes('admin');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [kelasData, setKelasData] = useState<any | null>(null);
  const [komponenList, setKomponenList] = useState<any[]>([]);
  const [pesertaList, setPesertaList] = useState<any[]>([]);
  const [modePenilaian, setModePenilaian] = useState<string>('semi_obe');

  // State to hold temporary input scores in memory
  // Structure: { krs_detail_id: { komponen_id: score_value } }
  const [scores, setScores] = useState<Record<number, Record<number, string>>>({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await siakadService.getKelasNilaiObe(kelasId);
      if (res.data) {
        setKelasData(res.data.kelas);
        setKomponenList(res.data.komponen || []);
        setModePenilaian(res.data.mode_penilaian || 'semi_obe');
        
        const peserta = res.data.peserta || [];
        setPesertaList(peserta);

        // Prepopulate the input scores from existing DB values
        const initialScores: Record<number, Record<number, string>> = {};
        peserta.forEach((p: any) => {
          initialScores[p.krs_detail_id] = {};
          (res.data.komponen || []).forEach((comp: any) => {
            const dbVal = p.scores?.[comp.id]?.nilai_angka;
            initialScores[p.krs_detail_id][comp.id] =
              dbVal !== undefined && dbVal !== null && dbVal > 0
                ? String(dbVal)
                : dbVal === 0
                ? '0'
                : '';
          });
        });
        setScores(initialScores);
      }
    } catch (err: any) {
      toast.error('Gagal memuat data nilai kelas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (kelasId) {
      fetchData();
    }
  }, [kelasId]);

  const handleScoreChange = (krsDetailId: number, komponenId: number, value: string) => {
    // Basic validation: allow empty string, or positive number up to 100
    if (value !== '') {
      const num = Number(value);
      if (isNaN(num) || num < 0 || num > 100) return;
    }

    setScores((prev) => ({
      ...prev,
      [krsDetailId]: {
        ...prev[krsDetailId],
        [komponenId]: value,
      },
    }));
  };

  const calculateStudentTotal = (krsDetailId: number) => {
    const studentScores = scores[krsDetailId] || {};
    let total = 0;
    komponenList.forEach((comp) => {
      const scoreVal = Number(studentScores[comp.id]) || 0;
      total += (scoreVal * Number(comp.bobot)) / 100;
    });
    return total;
  };

  const getGradeLetter = (total: number) => {
    if (total >= 85) return { letter: 'A', class: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    if (total >= 80) return { letter: 'A-', class: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
    if (total >= 75) return { letter: 'B+', class: 'bg-blue-100 text-blue-800 border-blue-200' };
    if (total >= 70) return { letter: 'B', class: 'bg-blue-50 text-blue-700 border-blue-100' };
    if (total >= 65) return { letter: 'B-', class: 'bg-indigo-50 text-indigo-700 border-indigo-100' };
    if (total >= 60) return { letter: 'C+', class: 'bg-amber-100 text-amber-800 border-amber-200' };
    if (total >= 55) return { letter: 'C', class: 'bg-amber-50 text-amber-700 border-amber-100' };
    if (total >= 40) return { letter: 'D', class: 'bg-rose-50 text-rose-700 border-rose-100' };
    return { letter: 'E', class: 'bg-red-100 text-red-800 border-red-200' };
  };

  const handleSave = async (isFinal: boolean) => {
    if (isFinal) {
      const confirmPublish = confirm(
        'PERINGATAN: Mempublikasikan nilai secara FINAL akan mengunci nilai dan memperbarui KHS/IPK mahasiswa. Nilai yang dikunci tidak dapat diubah kembali kecuali oleh Administrator. Lanjutkan?'
      );
      if (!confirmPublish) return;
    }

    try {
      setSaving(true);
      
      // Build grades payload array
      const gradesPayload = pesertaList.map((p) => {
        const studentScores = scores[p.krs_detail_id] || {};
        const formattedScores: Record<number, number> = {};
        komponenList.forEach((comp) => {
          formattedScores[comp.id] = Number(studentScores[comp.id]) || 0;
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

      toast.success(res.message || 'Nilai berhasil disimpan');
      
      if (isFinal) {
        router.push('/siakad/nilai');
      } else {
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal menyimpan nilai');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
        <RefreshCw size={28} className="animate-spin mb-2" />
        <span className="text-xs font-bold">Memuat portal penilaian kelas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`Input Nilai & Asesmen OBE`}
        description={`Mata Kuliah: ${kelasData?.mata_kuliah?.nama} (${kelasData?.kode_kelas}) • Dosen: ${kelasData?.dosen_pengampu?.[0]?.dosen?.nama_lengkap || 'Dosen Pengampu'}`}
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Penilaian KHS', href: '/siakad/nilai' },
          { label: 'Input Nilai Kelas' },
        ]}
        action={
          <Button
            variant="outline"
            icon={<ArrowLeft size={15} />}
            onClick={() => router.push('/siakad/nilai')}
            className="text-xs font-bold"
          >
            Kembali
          </Button>
        }
      />

      {/* Main Grading Table Card */}
      <div className="card p-6 space-y-5 bg-white border rounded-3xl shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Award size={18} className="text-primary-600" />
              Daftar Nilai Mahasiswa Kelas ({kelasData?.nama_kelas})
              {modePenilaian === 'full_obe' && (
                <Badge variant="green" className="text-[10px] font-black uppercase">Pure OBE (CPMK)</Badge>
              )}
              {modePenilaian === 'semi_obe' && (
                <Badge variant="purple" className="text-[10px] font-black uppercase">Hybrid OBE (UTS/UAS)</Badge>
              )}
              {modePenilaian === 'konvensional' && (
                <Badge variant="gray" className="text-[10px] font-black uppercase">Konvensional</Badge>
              )}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {modePenilaian === 'full_obe' && 'Mode Murni OBE: Inputkan skor pencapaian (0–100) langsung untuk setiap poin CPMK. Nilai Akhir KHS terhitung otomatis.'}
              {modePenilaian === 'semi_obe' && 'Mode Hibrida: Inputkan nilai Tugas, UTS, UAS, Kuis. Nilai Akhir KHS & ketercapaian CPMK terhitung otomatis.'}
              {modePenilaian === 'konvensional' && 'Mode Konvensional: Inputkan nilai UTS, UAS, Tugas secara langsung untuk merekap nilai akhir perkuliahan.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              icon={<Save size={14} />}
              className="text-xs font-bold"
              onClick={() => handleSave(false)}
              disabled={saving}
            >
              Simpan Draft
            </Button>
            <Button
              variant="primary"
              icon={<CheckCircle2 size={14} />}
              className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-xs"
              onClick={() => handleSave(true)}
              disabled={saving}
            >
              Simpan & Publikasikan (Final)
            </Button>
          </div>
        </div>

        {komponenList.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border border-dashed rounded-2xl text-slate-400">
            <AlertCircle size={28} className="mb-2 text-slate-300" />
            <p className="text-xs font-bold">Komponen Penilaian OBE belum dikonfigurasi.</p>
            <p className="text-2xs text-slate-400">Dosen pengembang wajib melakukan penyusunan bobot asesmen (UTS, UAS, Tugas, dll.) pada menu OBE terlebih dahulu.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 font-extrabold text-slate-600 border-b">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">NO</th>
                  <th className="py-3 px-4 min-w-[150px]">NIM & MAHASISWA</th>
                  {komponenList.map((comp) => (
                    <th key={comp.id} className="py-3 px-3 text-center w-28 border-l border-slate-100">
                      <span className="block text-2xs truncate max-w-[110px]" title={comp.nama_komponen}>
                        {comp.nama_komponen}
                      </span>
                      <Badge variant="purple" className="text-[10px] font-black mt-0.5">
                        {comp.bobot}%
                      </Badge>
                    </th>
                  ))}
                  <th className="py-3 px-4 text-center w-24 border-l border-slate-200 bg-slate-100/50">TOTAL SKOR</th>
                  <th className="py-3 px-4 text-center w-24 border-l border-slate-100 bg-slate-100/50">NILAI HURUF</th>
                  <th className="py-3 px-4 text-center w-28 border-l border-slate-100 bg-slate-100/50">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y font-semibold text-slate-700">
                {pesertaList.length === 0 ? (
                  <tr>
                    <td colSpan={komponenList.length + 5} className="py-8 text-center text-slate-400 italic bg-slate-50">
                      Belum ada mahasiswa yang mengambil kelas perkuliahan ini pada semester aktif.
                    </td>
                  </tr>
                ) : (
                  pesertaList.map((p, idx) => {
                    const totalScore = calculateStudentTotal(p.krs_detail_id);
                    const grade = getGradeLetter(totalScore);
                    const isStudentFinal = p.is_final || false;

                    return (
                      <tr key={p.krs_detail_id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block text-xs">
                            {p.mahasiswa?.nama_lengkap || 'Mahasiswa'}
                          </span>
                          <span className="font-mono text-2xs text-slate-400 block mt-0.5">
                            NIM: {p.mahasiswa?.nim || '-'}
                          </span>
                        </td>
                        {komponenList.map((comp) => (
                          <td key={comp.id} className="py-3 px-3 text-center border-l border-slate-100">
                            <input
                              type="text"
                              value={scores[p.krs_detail_id]?.[comp.id] ?? ''}
                              onChange={(e) => handleScoreChange(p.krs_detail_id, comp.id, e.target.value)}
                              disabled={isStudentFinal && !isAdmin}
                              className="w-16 text-center text-xs font-bold py-1 px-1.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white"
                              placeholder="0"
                            />
                          </td>
                        ))}
                        <td className="py-3 px-4 text-center border-l border-slate-200 bg-slate-100/20 font-black text-sm text-primary-700">
                          {totalScore.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center border-l border-slate-100 bg-slate-100/20">
                          <span className={`px-2.5 py-1 text-2xs font-extrabold rounded-md border uppercase ${grade.class}`}>
                            {grade.letter}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center border-l border-slate-100 bg-slate-100/20">
                          {isStudentFinal ? (
                            <Badge variant="green">✓ Locked (Final)</Badge>
                          ) : (
                            <Badge variant="gray">Draft</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
