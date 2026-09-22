'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Loader2, Search, User, AlertTriangle, AlertCircle, FileText, Calendar, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { formatRupiah, formatDate } from '@/lib/utils';

const dispensasiSchema = z.object({
  mahasiswa_id: z.number().min(1, 'Mahasiswa wajib dipilih'),
  tagihan_id: z.number().min(1, 'Tagihan wajib dipilih'),
  tipe_dispensasi: z.enum(['penundaan_jatuh_tempo', 'cicilan', 'keringanan_khusus']),
  jatuh_tempo_baru: z.string().min(1, 'Tanggal jatuh tempo baru wajib diisi'),
  nominal_per_cicilan: z.number().min(0, 'Nominal per cicilan tidak boleh negatif'),
  allow_krs: z.boolean(),
  alasan: z.string().min(10, 'Alasan permohonan dispensasi minimal 10 karakter'),
});

type DispensasiFormData = z.infer<typeof dispensasiSchema>;

interface StudentOption {
  id: number;
  nim: string;
  nama_mahasiswa: string;
  tahun_angkatan: number;
  jalur_kelas: string;
  kelompok_ukt: number;
}

interface StudentBill {
  id: number;
  nomor_tagihan: string;
  total_tagihan: number;
  total_bayar: number;
  status: string;
  jatuh_tempo: string;
}

export default function CreateDispensasiPage() {
  const router = useRouter();
  const { user, isSuperAdmin, isAdmin } = useAuth();

  const userRoleSlugs = (user?.roles || []).map((r: any) =>
    (typeof r === 'string' ? r : r.slug || r.name || '').toLowerCase()
  );
  const isMahasiswaRole = userRoleSlugs.includes('mahasiswa') && !isSuperAdmin && !isAdmin;

  const [submitting, setSubmitting] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentResults, setStudentResults] = useState<StudentOption[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentOption | null>(null);
  const [unpaidBills, setUnpaidBills] = useState<StudentBill[]>([]);
  const [loadingBills, setLoadingBills] = useState(false);

  const defaultJatuhTempo = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DispensasiFormData>({
    resolver: zodResolver(dispensasiSchema) as any,
    defaultValues: {
      mahasiswa_id: 0,
      tagihan_id: 0,
      tipe_dispensasi: 'penundaan_jatuh_tempo',
      jatuh_tempo_baru: defaultJatuhTempo(),
      nominal_per_cicilan: 1000000,
      allow_krs: true,
      alasan: '',
    },
  });

  const selectedTagihanId = watch('tagihan_id');
  const selectedTipeDispensasi = watch('tipe_dispensasi');

  // Auto-detect student if logged in as mahasiswa
  useEffect(() => {
    if (isMahasiswaRole) {
      sikeuService.getMyBills()
        .then((res) => {
          if (Array.isArray(res.data) && res.data.length > 0) {
            const first = res.data[0];
            const mhsInfo: StudentOption = {
              id: first.mahasiswa_id || first.mahasiswa?.id || 1,
              nim: first.mahasiswa?.nim || user?.username || '',
              nama_mahasiswa: first.mahasiswa?.nama || (user as any)?.name || user?.username || 'Mahasiswa',
              tahun_angkatan: first.mahasiswa?.angkatan || 2023,
              jalur_kelas: first.mahasiswa?.jalur || 'Reguler',
              kelompok_ukt: 1,
            };
            setSelectedStudent(mhsInfo);
            setValue('mahasiswa_id', mhsInfo.id);

            const unpaid = res.data.filter((b: any) => b.status !== 'lunas');
            setUnpaidBills(unpaid);
            if (unpaid.length > 0) {
              setValue('tagihan_id', unpaid[0].id);
            }
          }
        })
        .catch(() => {
          // Fallback
        });
    }
  }, [isMahasiswaRole, user, setValue]);

  // Autocomplete student search for admin
  useEffect(() => {
    if (isMahasiswaRole) return;
    if (studentSearchQuery.trim().length < 2) {
      setStudentResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await sikeuService.searchMahasiswa(studentSearchQuery);
        setStudentResults(res.data || []);
      } catch {
        setStudentResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [studentSearchQuery, isMahasiswaRole]);

  // Load unpaid bills when student is selected
  const handleSelectStudent = async (student: StudentOption) => {
    setSelectedStudent(student);
    setValue('mahasiswa_id', student.id);
    setStudentResults([]);
    setStudentSearchQuery('');

    setLoadingBills(true);
    try {
      const res = await sikeuService.getStudentUnpaidBills(student.id);
      const bills: StudentBill[] = Array.isArray(res.data)
        ? res.data
        : (Array.isArray((res.data as any)?.bills) ? (res.data as any).bills : []);
      setUnpaidBills(bills);
      if (bills.length > 0) {
        setValue('tagihan_id', bills[0].id, { shouldValidate: true });
      } else {
        setValue('tagihan_id', 0);
      }
    } catch {
      setUnpaidBills([]);
      setValue('tagihan_id', 0);
    } finally {
      setLoadingBills(false);
    }
  };

  const onSubmit = async (data: DispensasiFormData) => {
    setSubmitting(true);
    try {
      await sikeuService.submitDispensasi({
        tagihan_id: data.tagihan_id,
        tipe_dispensasi: data.tipe_dispensasi,
        jatuh_tempo_baru: data.jatuh_tempo_baru,
        nominal_per_cicilan: data.nominal_per_cicilan,
        allow_krs: data.allow_krs,
        alasan: data.alasan,
      });

      toast.success('Permohonan dispensasi berhasil dikirim dan menunggu verifikasi.');
      router.push('/sikeu/dispensasi');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Gagal mengajukan dispensasi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      <PageHeader
        title="Pengajuan Dispensasi Baru"
        description="Formulir resmi permohonan penundaan atau skema cicilan pembayaran kuliah mahasiswa."
        action={
          <Button
            variant="outline"
            icon={<ArrowLeft size={16} />}
            onClick={() => router.push('/sikeu/dispensasi')}
            className="font-bold min-h-[40px]"
          >
            Kembali
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Card 1: Data Mahasiswa & Tagihan */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <User size={18} className="text-primary-600" />
              Identitas Mahasiswa & Tagihan Terkait
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih mahasiswa dan invoice tagihan semester yang dimohonkan penyesuaian.
            </p>
          </div>

          {!isMahasiswaRole && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Cari Mahasiswa (NIM atau Nama) *
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  placeholder="Ketik minimal 2 karakter (NIM atau Nama)..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
                />
              </div>

              {studentResults.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl shadow-lg max-h-52 overflow-y-auto divide-y z-50">
                  {studentResults.map((stu) => (
                    <button
                      key={stu.id}
                      type="button"
                      onClick={() => handleSelectStudent(stu)}
                      className="w-full text-left p-3 hover:bg-primary-50/80 transition-colors flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold text-slate-900 text-xs">{stu.nama_mahasiswa}</p>
                        <p className="text-2xs font-mono text-slate-500">
                          NIM: {stu.nim} • Angkatan: {stu.tahun_angkatan} ({stu.jalur_kelas})
                        </p>
                      </div>
                      <Badge variant="purple" className="text-2xs">
                        UKT Level {stu.kelompok_ukt}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Selected Student Display */}
          {selectedStudent ? (
            <div className="p-4 bg-primary-50/70 border border-primary-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  <User size={18} />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">{selectedStudent.nama_mahasiswa}</p>
                  <p className="text-xs text-slate-600 font-mono">
                    NIM: {selectedStudent.nim} • Jalur: {selectedStudent.jalur_kelas} (Angkatan {selectedStudent.tahun_angkatan})
                  </p>
                </div>
              </div>
              {!isMahasiswaRole && (
                <Button
                  size="sm"
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setSelectedStudent(null);
                    setValue('mahasiswa_id', 0);
                    setUnpaidBills([]);
                    setValue('tagihan_id', 0);
                  }}
                  className="text-xs text-slate-500 hover:text-rose-600 font-bold"
                >
                  Ganti Mahasiswa
                </Button>
              )}
            </div>
          ) : (
            <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-500">
              Belum ada mahasiswa dipilih. Silakan cari menggunakan kolom pencarian di atas.
            </div>
          )}
          {errors.mahasiswa_id && (
            <p className="text-xs text-rose-600 font-medium">{errors.mahasiswa_id.message}</p>
          )}

          {/* Tagihan Dropdown */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Pilih Tagihan yang Diajukan Dispensasi *
            </label>
            {loadingBills ? (
              <div className="py-3 flex items-center gap-2 text-xs text-slate-500">
                <Loader2 size={16} className="animate-spin text-primary-600" />
                <span>Memuat daftar tagihan belum lunas...</span>
              </div>
            ) : unpaidBills.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                <AlertCircle size={16} className="text-amber-600 shrink-0" />
                <span>
                  {selectedStudent
                    ? 'Tidak ditemukan tagihan berstatus belum lunas untuk mahasiswa ini.'
                    : 'Pilih mahasiswa terlebih dahulu untuk melihat daftar tagihan.'}
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {unpaidBills.map((b) => {
                  const isSelected = selectedTagihanId === b.id;
                  const sisa = (b.total_tagihan || 0) - (b.total_bayar || 0);
                  return (
                    <div
                      key={b.id}
                      onClick={() => setValue('tagihan_id', b.id, { shouldValidate: true })}
                      className={`p-3.5 rounded-xl border transition cursor-pointer ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50/50 shadow-xs ring-2 ring-primary-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-slate-900">{b.nomor_tagihan}</span>
                        <Badge variant="warning" className="text-2xs">
                          {b.status}
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="text-slate-500">Sisa Tagihan:</span>
                        <span className="font-bold text-primary-700 font-mono">{formatRupiah(sisa)}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-2xs text-slate-400">
                        <span>Jatuh Tempo:</span>
                        <span>{formatDate(b.jatuh_tempo)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {errors.tagihan_id && (
              <p className="text-xs text-rose-600 font-medium">{errors.tagihan_id.message}</p>
            )}
          </div>
        </div>

        {/* Card 2: Pengaturan Dispensasi */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar size={18} className="text-primary-600" />
              Skema & Kebijakan Dispensasi
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tentukan jenis penangguhan, tanggal baru, serta izin pengisian rencana studi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Tipe Dispensasi *"
              options={[
                { value: 'penundaan_jatuh_tempo', label: 'Penundaan Tanggal Jatuh Tempo' },
                { value: 'cicilan', label: 'Skema Pembayaran Per-Cicilan' },
                { value: 'keringanan_khusus', label: 'Permohonan Keringanan Khusus' },
              ]}
              value={selectedTipeDispensasi}
              onChange={(val) => setValue('tipe_dispensasi', val as any, { shouldValidate: true })}
            />

            <Input
              type="date"
              label="Batas Jatuh Tempo Baru *"
              {...register('jatuh_tempo_baru')}
              error={errors.jatuh_tempo_baru?.message}
            />

            <Input
              type="number"
              label="Nominal Per Cicilan (Rp) *"
              placeholder="1000000"
              {...register('nominal_per_cicilan', { valueAsNumber: true })}
              error={errors.nominal_per_cicilan?.message}
            />

            <div className="flex items-center pt-6">
              <label className="flex items-start gap-3 cursor-pointer p-3 bg-slate-50 border border-slate-200 rounded-xl w-full">
                <input
                  type="checkbox"
                  {...register('allow_krs')}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Izinkan Buka Lock KRS SIAKAD</span>
                  <span className="text-2xs text-slate-500 block leading-relaxed">
                    Mahasiswa tetap dapat melakukan pengisian Kartu Rencana Studi selama masa dispensasi.
                  </span>
                </div>
              </label>
            </div>
          </div>

          <Textarea
            label="Alasan Permohonan Dispensasi *"
            placeholder="Tuliskan kendala finansial, alasan keluarga, atau pertimbangan lainnya secara jelas dan lengkap..."
            rows={4}
            {...register('alasan')}
            error={errors.alasan?.message}
          />
        </div>

        {/* Form Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/sikeu/dispensasi')}
            disabled={submitting}
            className="font-bold min-h-[42px] px-5"
          >
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={submitting || !selectedStudent || selectedTagihanId === 0}
            icon={submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            className="font-bold shadow-md min-h-[42px] px-6"
          >
            {submitting ? 'Mengirim Pengajuan...' : 'Kirim Permohonan Dispensasi'}
          </Button>
        </div>
      </form>
    </div>
  );
}
