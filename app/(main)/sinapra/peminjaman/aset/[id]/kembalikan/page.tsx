'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, AlertTriangle, Package, Calendar, Clock, User, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { sinapraService } from '@/services/sinapra.service';
import { getApiErrorMessage } from '@/lib/utils';
import type { PeminjamanAset } from '@/types/sinapra.types';

const pengembalianSchema = z.object({
  kondisi_kembali: z.enum(['baik', 'rusak_ringan', 'rusak_berat', 'hilang']),
  tanggal_kembali_aktual: z.string().min(1, 'Tanggal pengembalian wajib diisi'),
  catatan_pengembalian: z.string().optional(),
  kembalikan_semua_dalam_batch: z.boolean(),
});

type PengembalianFormValues = z.infer<typeof pengembalianSchema>;

export default function PengembalianAsetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const peminjamanId = Number(resolvedParams.id);

  const [loading, setLoading] = useState(true);
  const [peminjaman, setPeminjaman] = useState<PeminjamanAset | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<PengembalianFormValues | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const todayStr = new Date().toISOString().substring(0, 10);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<PengembalianFormValues>({
    resolver: zodResolver(pengembalianSchema),
    defaultValues: {
      kondisi_kembali: 'baik',
      tanggal_kembali_aktual: todayStr,
      catatan_pengembalian: '',
      kembalikan_semua_dalam_batch: true,
    },
  });

  const selectedTanggalKembali = watch('tanggal_kembali_aktual') || todayStr;

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await sinapraService.getPeminjamanAsetDetail(peminjamanId);
        setPeminjaman(res.data || null);
      } catch (err: any) {
        toast.error(getApiErrorMessage(err, 'Gagal memuat detail peminjaman aset.'));
      } finally {
        setLoading(false);
      }
    };

    if (peminjamanId) {
      fetchDetail();
    }
  }, [peminjamanId]);

  // Hitung keterlambatan
  let isLate = false;
  let lateDays = 0;
  if (peminjaman?.tanggal_kembali_rencana && selectedTanggalKembali) {
    const rencanaDate = new Date(peminjaman.tanggal_kembali_rencana);
    const aktualDate = new Date(selectedTanggalKembali);
    const diffTime = aktualDate.getTime() - rencanaDate.getTime();
    if (diffTime > 0) {
      isLate = true;
      lateDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
  }

  const handleFormSubmit = (values: PengembalianFormValues) => {
    setPendingValues(values);
    setConfirmOpen(true);
  };

  const executePengembalian = async () => {
    if (!pendingValues) return;
    setIsSubmitting(true);
    try {
      await sinapraService.kembalikanPeminjamanAset(peminjamanId, {
        kondisi_kembali: pendingValues.kondisi_kembali,
        tanggal_kembali_aktual: pendingValues.tanggal_kembali_aktual,
        catatan_pengembalian: pendingValues.catatan_pengembalian,
        kembalikan_semua_dalam_batch: pendingValues.kembalikan_semua_dalam_batch,
      });

      toast.success('Pengembalian aset berhasil diproses. Status aset telah diperbarui.');
      router.push(`/sinapra/peminjaman/aset/${peminjamanId}`);
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Gagal memproses pengembalian aset.'));
    } finally {
      setIsSubmitting(false);
      setConfirmOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Memuat Formulir Pengembalian Aset...</p>
      </div>
    );
  }

  if (!peminjaman) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6">
        <p className="text-sm text-slate-600 font-medium">Data permohonan peminjaman tidak ditemukan.</p>
        <Link href="/sinapra/peminjaman/aset">
          <Button variant="outline" size="md">
            <ArrowLeft size={16} className="mr-1.5" />
            Kembali ke Daftar Peminjaman
          </Button>
        </Link>
      </div>
    );
  }

  const isAlreadyReturned = peminjaman.status === 'kembali';

  return (
    <div className="w-full flex flex-col gap-6 p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <PageHeader
        title="Proses Pengembalian Aset"
        description={`Serah terima fisik dan verifikasi kondisi pengembalian barang #${peminjaman.kode_peminjaman || peminjaman.id}`}
        action={
          <Link href={`/sinapra/peminjaman/aset/${peminjamanId}`}>
            <Button variant="outline" size="md" className="border-slate-300 text-slate-700 hover:bg-slate-100">
              <ArrowLeft size={16} className="mr-1.5" />
              Kembali ke Detail
            </Button>
          </Link>
        }
      />

      {/* Banner Jika Sudah Pernah Dikembalikan */}
      {isAlreadyReturned && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
          <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-800">
            <p className="font-bold">Aset ini sudah tercatat dikembalikan!</p>
            <p className="mt-0.5">
              Tanggal Pengembalian:{' '}
              <span className="font-semibold">{peminjaman.tanggal_kembali_aktual || peminjaman.tanggal_kembali_realisasi || '-'}</span>{' '}
              dengan kondisi <span className="font-semibold capitalize">{peminjaman.kondisi_kembali || 'baik'}</span>.
            </p>
          </div>
        </div>
      )}

      {/* Banner Deteksi Keterlambatan */}
      {isLate && !isAlreadyReturned && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800">
            <p className="font-bold">Peringatan: Pengembalian Melewati Batas Waktu!</p>
            <p className="mt-0.5">
              Rencana tanggal pengembalian adalah <span className="font-semibold">{peminjaman.tanggal_kembali_rencana}</span>. Pengembalian pada tanggal{' '}
              <span className="font-semibold">{selectedTanggalKembali}</span> terlambat{' '}
              <span className="font-bold text-red-600">{lateDays} hari</span>. Harap catat alasan keterlambatan pada catatan pengembalian.
            </p>
          </div>
        </div>
      )}

      {/* Grid Informasi Peminjaman & Formulir */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Kolom Kiri: Ringkasan Peminjaman */}
        <div className="md:col-span-1 flex flex-col gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
              <Package size={16} className="text-blue-600" />
              Barang yang Dipinjam
            </h3>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 text-2xs block">Nama Barang</span>
                <span className="font-semibold text-slate-800">{peminjaman.aset?.nama || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-2xs block">Kode Inventaris Aset</span>
                <span className="font-mono text-2xs font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                  {peminjaman.aset?.kode_aset || '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-2xs block">Lokasi Asal</span>
                <span className="text-slate-700">
                  {peminjaman.aset?.ruangan?.nama || 'Gudang Sarpras'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-2xs block">Kondisi Awal Pinjam</span>
                <span className="capitalize font-medium text-slate-700">{peminjaman.kondisi_pinjam}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
              <User size={16} className="text-blue-600" />
              Data Peminjam
            </h3>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 text-2xs block">Nama Peminjam</span>
                <span className="font-semibold text-slate-800">
                  {peminjaman.user?.pegawai?.nama_lengkap || peminjaman.user?.mahasiswa?.nama_lengkap || peminjaman.user?.name || '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-2xs block">Nomor Identitas (NIM/NIP)</span>
                <span className="text-slate-700">{peminjaman.nomor_identitas || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-2xs block">Kontak</span>
                <span className="text-slate-700">{peminjaman.kontak_peminjam || peminjaman.user?.email || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-2xs block">Jadwal Pinjam</span>
                <span className="text-slate-700">
                  {peminjaman.tanggal_pinjam} s.d. {peminjaman.tanggal_kembali_rencana}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-2xs block">Keperluan</span>
                <span className="text-slate-700">{peminjaman.keperluan}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Formulir Pengembalian */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-blue-600" />
              Formulir Pemeriksaan & Penerimaan Pengembalian
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Pastikan peralatan telah diperiksa secara fisik, aksesoris lengkap, dan berfungsi normal sebelum memproses pengembalian.
            </p>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Tanggal Pengembalian Aktual"
                  type="date"
                  {...register('tanggal_kembali_aktual')}
                  error={errors.tanggal_kembali_aktual?.message}
                  required
                  disabled={isAlreadyReturned}
                />

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kondisi Fisik Saat Kembali <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="kondisi_kembali"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onChange={field.onChange}
                        options={[
                          { value: 'baik', label: 'Baik (Lengkap & Berfungsi Normal)' },
                          { value: 'rusak_ringan', label: 'Rusak Ringan (Masih Berfungsi)' },
                          { value: 'rusak_berat', label: 'Rusak Berat (Perlu Maintenance)' },
                          { value: 'hilang', label: 'Hilang (Perlu Penggantian)' },
                        ]}
                        disabled={isAlreadyReturned}
                      />
                    )}
                  />
                  {errors.kondisi_kembali && (
                    <p className="text-2xs text-red-500 mt-1">{errors.kondisi_kembali.message}</p>
                  )}
                </div>
              </div>

              <Textarea
                label="Catatan Pemeriksaan Fisik & Pengembalian"
                placeholder="Tuliskan catatan kelengkapan charger/kabel, kondisi kebersihan, atau rincian kerusakan bila ada..."
                rows={4}
                {...register('catatan_pengembalian')}
                error={errors.catatan_pengembalian?.message}
                disabled={isAlreadyReturned}
              />

              {peminjaman.kode_peminjaman && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <Controller
                    name="kembalikan_semua_dalam_batch"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="batch_return"
                        label={`Kembalikan seluruh aset dalam pengajuan ini (${peminjaman.kode_peminjaman})`}
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        disabled={isAlreadyReturned}
                      />
                    )}
                  />
                  <p className="text-2xs text-slate-500 ml-6 mt-1">
                    Jika dicentang, seluruh peralatan lain yang dipinjam bersamaan pada kode permohonan ini akan otomatis ditandai kembali dengan kondisi yang sama.
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <Link href={`/sinapra/peminjaman/aset/${peminjamanId}`}>
                  <Button type="button" variant="outline" size="md">
                    Batal
                  </Button>
                </Link>
                {!isAlreadyReturned && (
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CheckCircle2 size={16} className="mr-1.5" />
                    Proses Pengembalian Aset
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Confirm Dialog Pengembalian */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={executePengembalian}
        title="Konfirmasi Penerimaan Pengembalian Aset"
        message={`Apakah Anda yakin ingin memproses pengembalian aset "${peminjaman.aset?.nama}" dengan kondisi "${pendingValues?.kondisi_kembali?.toUpperCase()}"? Status aset di inventaris akan otomatis disesuaikan.`}
        confirmText="Ya, Selesaikan Pengembalian"
        cancelText="Batal"
        variant="primary"
        isLoading={isSubmitting}
      />
    </div>
  );
}
