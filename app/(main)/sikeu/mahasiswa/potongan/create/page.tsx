'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Save,
  Loader2,
  Search,
  User,
  Sparkles,
  AlertCircle,
  Receipt,
  CheckCircle2,
  Coins,
  Clock,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { sikeuService, MasterBiaya } from '@/services/sikeu.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { formatRupiah } from '@/lib/utils';

const potonganSchema = z.object({
  mahasiswa_id: z.number().min(1, 'Mahasiswa wajib dipilih'),
  nama_potongan: z.string().min(3, 'Nama potongan minimal 3 karakter'),
  tipe_potongan: z.enum(['nominal', 'persen']),
  nilai_potongan: z.number().min(1, 'Nilai potongan wajib lebih dari 0'),
  master_biaya_id: z.string().optional(),
  semester: z.string().optional(),
  tahun_akademik: z.string().min(4, 'Tahun akademik wajib diisi'),
  berlaku_mulai: z.string().min(1, 'Tanggal mulai berlaku wajib diisi'),
  berlaku_sampai: z.string().min(1, 'Tanggal selesai berlaku wajib diisi'),
  nomor_sk: z.string().optional(),
  keterangan: z.string().optional(),
  status: z.enum(['aktif', 'nonaktif']).default('aktif'),
});

type PotonganFormData = z.infer<typeof potonganSchema>;

interface UnpaidBill {
  id: number;
  nomor_tagihan: string;
  jenis: string;
  periode_label: string;
  total_tagihan: number;
  total_potongan: number;
  total_denda: number;
  total_bayar: number;
  sisa: number;
  status: string;
  jatuh_tempo?: string;
  details?: Array<{
    id: number;
    master_biaya: string;
    nominal: number;
    potongan: number;
    nominal_bersih: number;
    keterangan: string;
  }>;
}

export default function CreatePotonganPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [masterBiayaList, setMasterBiayaList] = useState<MasterBiaya[]>([]);
  const [, setLoadingBiaya] = useState(true);

  // Student search
  const [studentSearch, setStudentSearch] = useState('');
  const [studentResults, setStudentResults] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  // Unpaid bills auto-sync state
  const [unpaidBills, setUnpaidBills] = useState<UnpaidBill[]>([]);
  const [loadingBills, setLoadingBills] = useState(false);
  const [syncUnpaidBills, setSyncUnpaidBills] = useState(true);
  const [selectedTagihanId, setSelectedTagihanId] = useState<number | null>(null);

  const getTodayDate = () => new Date().toISOString().split('T')[0];
  const getDefaultEndDate = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PotonganFormData>({
    resolver: zodResolver(potonganSchema) as any,
    defaultValues: {
      mahasiswa_id: 0,
      nama_potongan: '',
      tipe_potongan: 'nominal',
      nilai_potongan: 500000,
      master_biaya_id: '',
      semester: '',
      tahun_akademik: '2026/2027',
      berlaku_mulai: getTodayDate(),
      berlaku_sampai: getDefaultEndDate(),
      nomor_sk: '',
      keterangan: '',
      status: 'aktif',
    },
  });

  const watchTipePotongan = watch('tipe_potongan');
  const watchNilaiPotongan = watch('nilai_potongan');
  const watchMasterBiayaId = watch('master_biaya_id');
  const watchSemester = watch('semester');
  const watchStatus = watch('status');

  // Load master biaya dynamically from DB
  useEffect(() => {
    const fetchMasterBiaya = async () => {
      try {
        setLoadingBiaya(true);
        const res = await sikeuService.getMasterBiayaList();
        setMasterBiayaList(Array.isArray(res.data) ? res.data : []);
      } catch {
        setMasterBiayaList([]);
      } finally {
        setLoadingBiaya(false);
      }
    };
    fetchMasterBiaya();
  }, []);

  // Autocomplete student search debounce
  useEffect(() => {
    if (studentSearch.trim().length < 2) {
      setStudentResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await sikeuService.searchMahasiswa(studentSearch);
        setStudentResults(Array.isArray(res.data) ? res.data : []);
      } catch {
        setStudentResults([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [studentSearch]);

  const handleSelectStudent = async (stu: any) => {
    setSelectedStudent(stu);
    setValue('mahasiswa_id', stu.id, { shouldValidate: true });
    setStudentResults([]);
    setStudentSearch('');

    // Fetch tagihan belum dibayar mahasiswa secara otomatis
    setLoadingBills(true);
    try {
      const res = await sikeuService.getStudentUnpaidBills(stu.id, stu.is_calon_mahasiswa);
      const bills: UnpaidBill[] = Array.isArray(res.data)
        ? res.data
        : (Array.isArray((res.data as any)?.bills) ? (res.data as any).bills : []);
      setUnpaidBills(bills);
      if (bills.length > 0) {
        // Auto-select tagihan pertama
        setSelectedTagihanId(bills[0].id);
      } else {
        setSelectedTagihanId(null);
      }
    } catch (err) {
      console.error('Error fetching unpaid bills:', err);
      setUnpaidBills([]);
      setSelectedTagihanId(null);
    } finally {
      setLoadingBills(false);
    }
  };

  const handleClearStudent = () => {
    setSelectedStudent(null);
    setValue('mahasiswa_id', 0, { shouldValidate: true });
    setUnpaidBills([]);
    setSelectedTagihanId(null);
  };

  // Simulasi kalkulasi potongan terhadap tagihan
  const calculateBillSimulation = useMemo(() => {
    return (bill: UnpaidBill) => {
      let baseNominal = bill.sisa;
      if (watchMasterBiayaId && bill.details && bill.details.length > 0) {
        const found = bill.details.find((d) => String(d.id) === String(watchMasterBiayaId));
        if (found) {
          baseNominal = Math.max(0, found.nominal - found.potongan);
        }
      }

      let pot = 0;
      const val = Number(watchNilaiPotongan) || 0;
      if (watchTipePotongan === 'persen') {
        pot = Math.round((baseNominal * val) / 100);
      } else {
        pot = val;
      }
      pot = Math.min(pot, bill.sisa);
      const sisaBaru = Math.max(0, bill.sisa - pot);
      const isLunas = sisaBaru === 0;

      return {
        potonganNominal: pot,
        sisaBaru,
        isLunas,
      };
    };
  }, [watchTipePotongan, watchNilaiPotongan, watchMasterBiayaId]);

  const onSubmit = async (data: PotonganFormData) => {
    setSubmitting(true);
    try {
      const res = await sikeuService.createPotonganMahasiswa({
        mahasiswa_id: data.mahasiswa_id,
        nim: selectedStudent?.nim,
        nama_mahasiswa: selectedStudent?.nama_mahasiswa || selectedStudent?.nama,
        nama_potongan: data.nama_potongan,
        tipe_potongan: data.tipe_potongan,
        nilai_potongan: Number(data.nilai_potongan),
        master_biaya_id: data.master_biaya_id ? Number(data.master_biaya_id) : null,
        semester: data.semester ? Number(data.semester) : null,
        tahun_akademik: data.tahun_akademik,
        berlaku_mulai: data.berlaku_mulai,
        berlaku_sampai: data.berlaku_sampai,
        nomor_sk: data.nomor_sk || null,
        keterangan: data.keterangan || null,
        status: data.status,
        tagihan_id: selectedTagihanId ? Number(selectedTagihanId) : null,
        sync_unpaid_bills: syncUnpaidBills,
      });

      const message = (res as any)?.message || `Berhasil menetapkan potongan khusus untuk ${selectedStudent?.nama_mahasiswa || 'mahasiswa'}`;
      toast.success(message);
      router.push('/sikeu/mahasiswa/potongan');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Gagal menyimpan potongan mahasiswa');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      <PageHeader
        title="Tambah Potongan Khusus Mahasiswa"
        description="Tetapkan potongan biaya pendidikan per individu mahasiswa dengan auto-sync tagihan belum dibayar."
        action={
          <Button
            variant="outline"
            icon={<ArrowLeft size={16} />}
            onClick={() => router.push('/sikeu/mahasiswa/potongan')}
            className="font-bold min-h-[40px]"
          >
            Kembali
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Data Mahasiswa */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <User size={18} className="text-primary-600" />
              Mahasiswa Penerima Potongan
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cari dan pilih mahasiswa penerima potongan khusus berdasarkan NIM atau Nama.
            </p>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Ketik minimal 2 karakter (NIM atau Nama Mahasiswa)..."
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
                      <p className="font-bold text-slate-900 text-xs">{stu.nama_mahasiswa || stu.nama}</p>
                      <p className="text-[11px] font-mono text-slate-500">
                        NIM: {stu.nim} • Angkatan: {stu.tahun_angkatan || stu.angkatan} ({stu.jalur_kelas || 'Reguler'})
                      </p>
                    </div>
                    <Badge variant="purple" className="text-2xs">
                      {stu.program_studi?.nama || 'Aktif'}
                    </Badge>
                  </button>
                ))}
              </div>
            )}

            {selectedStudent ? (
              <div className="p-4 bg-primary-50/70 border border-primary-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    <User size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{selectedStudent.nama_mahasiswa || selectedStudent.nama}</p>
                    <p className="text-xs text-slate-600 font-mono">
                      NIM: {selectedStudent.nim} • Angkatan: {selectedStudent.tahun_angkatan || selectedStudent.angkatan} ({selectedStudent.jalur_kelas || 'Reguler'})
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  type="button"
                  variant="ghost"
                  onClick={handleClearStudent}
                  className="text-xs text-slate-500 hover:text-rose-600 font-bold"
                >
                  Ganti
                </Button>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-500">
                Belum ada mahasiswa dipilih. Silakan ketik nama/NIM pada kolom pencarian di atas.
              </div>
            )}
            {errors.mahasiswa_id && (
              <p className="text-xs text-rose-600 font-medium">{errors.mahasiswa_id.message}</p>
            )}
          </div>
        </div>

        {/* Section 2: Auto-Sync Tagihan Belum Dibayar */}
        {selectedStudent && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Receipt size={18} className="text-emerald-600" />
                  Tagihan Belum Dibayar Mahasiswa (Sinkronisasi Otomatis)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Potongan dapat langsung diterapkan ke tagihan yang belum lunas serta memotong saldo Virtual Account.
                </p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 hover:bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors">
                <input
                  type="checkbox"
                  checked={syncUnpaidBills}
                  onChange={(e) => setSyncUnpaidBills(e.target.checked)}
                  className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-slate-300"
                />
                <span className="text-xs font-bold text-slate-700 select-none">
                  Sync Otomatis Tagihan
                </span>
              </label>
            </div>

            {loadingBills ? (
              <div className="flex items-center justify-center py-6 text-slate-400 gap-2">
                <Loader2 size={18} className="animate-spin text-primary-600" />
                <span className="text-xs font-medium">Memeriksa tagihan aktif mahasiswa...</span>
              </div>
            ) : unpaidBills.length === 0 ? (
              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-start gap-3">
                <CheckCircle2 size={18} className="text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-emerald-900">Mahasiswa Tidak Memiliki Tagihan Tertunggak</p>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Saat ini seluruh tagihan mahasiswa sudah lunas atau belum diterbitkan. Master potongan ini akan tetap tersimpan dan otomatis memotong saat tagihan semester mendatang digenerate.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Ditemukan <strong className="text-slate-800">{unpaidBills.length}</strong> tagihan yang belum lunas:</span>
                  <button
                    type="button"
                    onClick={() => setSelectedTagihanId(null)}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                      selectedTagihanId === null
                        ? 'bg-primary-50 border-primary-300 text-primary-700 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Terapkan ke Semua Tagihan Belum Lunas
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {unpaidBills.map((bill) => {
                    const isSelected = selectedTagihanId === bill.id;
                    const sim = calculateBillSimulation(bill);

                    return (
                      <div
                        key={bill.id}
                        onClick={() => setSelectedTagihanId(bill.id)}
                        className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-primary-50/50 border-primary-300 ring-1 ring-primary-500/30'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
                                isSelected
                                  ? 'border-primary-600 bg-primary-600 text-white'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isSelected && <Check size={12} strokeWidth={3} />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs text-slate-900">
                                  {bill.nomor_tagihan}
                                </span>
                                <Badge
                                  variant={bill.status === 'belum_bayar' ? 'red' : 'amber'}
                                  className="text-[10px] capitalize"
                                >
                                  {bill.status.replace('_', ' ')}
                                </Badge>
                              </div>
                              <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">
                                {bill.jenis} • {bill.periode_label}
                              </p>
                            </div>
                          </div>

                          <div className="sm:text-right text-xs">
                            <p className="text-slate-500 text-[11px]">Sisa Tagihan Saat Ini:</p>
                            <p className="font-bold text-slate-900 font-mono text-sm">
                              {formatRupiah(bill.sisa)}
                            </p>
                          </div>
                        </div>

                        {/* Simulasi Preview Pengurangan */}
                        {syncUnpaidBills && (isSelected || selectedTagihanId === null) && (
                          <div className="mt-3 pt-2.5 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2 text-emerald-700">
                              <Coins size={14} />
                              <span>
                                Estimasi Potongan: <strong>-{formatRupiah(sim.potonganNominal)}</strong>
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 font-mono">
                              <span className="text-slate-500">Sisa Baru:</span>
                              <strong className={sim.isLunas ? 'text-emerald-600 font-bold' : 'text-slate-800'}>
                                {formatRupiah(sim.sisaBaru)}
                              </strong>
                              {sim.isLunas && (
                                <Badge variant="green" className="text-[10px] ml-1">
                                  Akan Lunas
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Section 3: Nilai & Parameter Potongan */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles size={18} className="text-primary-600" />
              Rincian Kebijakan Potongan
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Atur besaran potongan (nominal atau persentase), target biaya, dan periode berlakunya.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nama / Alasan Potongan *"
              placeholder="Contoh: Diskon Anak Pegawai / SK Rektor Keringanan SPP"
              {...register('nama_potongan')}
              error={errors.nama_potongan?.message}
            />

            <Select
              label="Tipe Potongan *"
              options={[
                { value: 'nominal', label: 'Nominal Tetap (Rp)' },
                { value: 'persen', label: 'Persentase (%)' },
              ]}
              value={watchTipePotongan}
              onChange={(val) => setValue('tipe_potongan', val as any, { shouldValidate: true })}
            />

            <Input
              type="number"
              label={watchTipePotongan === 'persen' ? 'Besaran Potongan (%) *' : 'Nominal Potongan (Rp) *'}
              placeholder={watchTipePotongan === 'persen' ? '25' : '1500000'}
              {...register('nilai_potongan', { valueAsNumber: true })}
              error={errors.nilai_potongan?.message}
            />

            <Select
              label="Komponen Biaya yang Dipotong (Opsional)"
              options={[
                { value: '', label: 'Semua Komponen Biaya (Total Invoice)' },
                ...masterBiayaList.map((mb) => ({
                  value: String(mb.id),
                  label: `${mb.kode_biaya || mb.kode || ''} - ${mb.nama || mb.nama_biaya || ''}`,
                })),
              ]}
              value={watchMasterBiayaId || ''}
              onChange={(val) => setValue('master_biaya_id', val as string)}
            />

            <Select
              label="Semester Target (Opsional)"
              options={[
                { value: '', label: 'Semua Semester Berjalan' },
                { value: '1', label: 'Semester 1' },
                { value: '2', label: 'Semester 2' },
                { value: '3', label: 'Semester 3' },
                { value: '4', label: 'Semester 4' },
                { value: '5', label: 'Semester 5' },
                { value: '6', label: 'Semester 6' },
                { value: '7', label: 'Semester 7' },
                { value: '8', label: 'Semester 8' },
              ]}
              value={watchSemester || ''}
              onChange={(val) => setValue('semester', val as string)}
            />

            <Input
              label="Tahun Akademik *"
              placeholder="Contoh: 2026/2027"
              {...register('tahun_akademik')}
              error={errors.tahun_akademik?.message}
            />

            <Input
              type="date"
              label="Mulai Berlaku *"
              {...register('berlaku_mulai')}
              error={errors.berlaku_mulai?.message}
            />

            <Input
              type="date"
              label="Berlaku Sampai *"
              {...register('berlaku_sampai')}
              error={errors.berlaku_sampai?.message}
            />

            <Input
              label="Nomor SK / Surat Keputusan"
              placeholder="Contoh: 124/SK-REK/KEU/2026"
              {...register('nomor_sk')}
              error={errors.nomor_sk?.message}
            />

            <Select
              label="Status Potongan *"
              options={[
                { value: 'aktif', label: 'Aktif' },
                { value: 'nonaktif', label: 'Non-Aktif' },
              ]}
              value={watchStatus}
              onChange={(val) => setValue('status', val as any)}
            />
          </div>

          <Textarea
            label="Keterangan Tambahan / Catatan"
            placeholder="Catatan khusus terkait dasar pertimbangan atau arahan pimpinan..."
            rows={3}
            {...register('keterangan')}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/sikeu/mahasiswa/potongan')}
            disabled={submitting}
            className="font-bold min-h-[42px] px-5"
          >
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={submitting || !selectedStudent}
            icon={submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            className="font-bold shadow-md min-h-[42px] px-6"
          >
            {submitting ? 'Menyimpan...' : 'Simpan & Terapkan Potongan'}
          </Button>
        </div>
      </form>
    </div>
  );
}
