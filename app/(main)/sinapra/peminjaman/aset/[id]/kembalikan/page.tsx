'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Package,
  Calendar,
  Clock,
  User,
  ShieldAlert,
  Wrench,
  Boxes,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { sinapraService } from '@/services/sinapra.service';
import { getApiErrorMessage, formatDate } from '@/lib/utils';
import type { PeminjamanAset } from '@/types/sinapra.types';

const pengembalianSchema = z.object({
  tanggal_kembali_aktual: z.string().min(1, 'Tanggal pengembalian wajib diisi'),
  catatan_pengembalian: z.string().optional(),
});

type PengembalianFormValues = z.infer<typeof pengembalianSchema>;

interface ItemReturnState {
  peminjaman_id: number;
  aset_id: number;
  nama_barang: string;
  kode_aset: string;
  ruangan_nama: string;
  kondisi_awal: string;
  kondisi_kembali: 'baik' | 'rusak_ringan' | 'rusak_berat' | 'hilang';
  catatan: string;
}

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
  const [itemsState, setItemsState] = useState<ItemReturnState[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<PengembalianFormValues | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const todayStr = new Date().toISOString().substring(0, 10);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PengembalianFormValues>({
    resolver: zodResolver(pengembalianSchema),
    defaultValues: {
      tanggal_kembali_aktual: todayStr,
      catatan_pengembalian: '',
    },
  });

  const selectedTanggalKembali = watch('tanggal_kembali_aktual') || todayStr;

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await sinapraService.getPeminjamanAsetDetail(peminjamanId);
        const data = res.data || null;
        setPeminjaman(data);

        if (data) {
          const rawItems = data.batch_items && data.batch_items.length > 0
            ? data.batch_items
            : [data];

          setItemsState(
            rawItems.map((it) => ({
              peminjaman_id: it.id,
              aset_id: it.aset_id,
              nama_barang: it.aset?.nama || `Aset #${it.aset_id}`,
              kode_aset: it.aset?.kode_aset || '-',
              ruangan_nama: it.aset?.ruangan?.nama || 'Gudang Sarpras',
              kondisi_awal: it.kondisi_pinjam || 'baik',
              kondisi_kembali: (it.kondisi_kembali as any) || 'baik',
              catatan: it.catatan_pengembalian || '',
            }))
          );
        }
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

  const handleSetAllBaik = () => {
    setItemsState((prev) =>
      prev.map((item) => ({
        ...item,
        kondisi_kembali: 'baik',
      }))
    );
    toast.success('Semua barang berhasil diatur ke kondisi Baik.');
  };

  const updateItemKondisi = (
    pId: number,
    kondisi: 'baik' | 'rusak_ringan' | 'rusak_berat' | 'hilang'
  ) => {
    setItemsState((prev) =>
      prev.map((it) => (it.peminjaman_id === pId ? { ...it, kondisi_kembali: kondisi } : it))
    );
  };

  const updateItemCatatan = (pId: number, catatan: string) => {
    setItemsState((prev) =>
      prev.map((it) => (it.peminjaman_id === pId ? { ...it, catatan } : it))
    );
  };

  const handleFormSubmit = (values: PengembalianFormValues) => {
    setPendingValues(values);
    setConfirmOpen(true);
  };

  const executePengembalian = async () => {
    if (!pendingValues) return;
    setIsSubmitting(true);
    try {
      await sinapraService.kembalikanPeminjamanAset(peminjamanId, {
        kondisi_kembali: itemsState[0]?.kondisi_kembali || 'baik',
        tanggal_kembali_aktual: pendingValues.tanggal_kembali_aktual,
        catatan_pengembalian: pendingValues.catatan_pengembalian,
        kembalikan_semua_dalam_batch: true,
        items: itemsState.map((it) => ({
          peminjaman_id: it.peminjaman_id,
          kondisi_kembali: it.kondisi_kembali,
          catatan: it.catatan,
        })),
      });

      toast.success('Pengembalian barang berhasil diverifikasi. Status aset dan antrean perawatan telah disesuaikan.');
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
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Memuat Formulir Pengembalian Barang...</p>
      </div>
    );
  }

  if (!peminjaman) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6">
        <p className="text-xs text-slate-600 font-medium">Data transaksi peminjaman tidak ditemukan.</p>
        <Link href="/sinapra/peminjaman">
          <Button variant="outline">
            <ArrowLeft size={16} className="mr-1.5" />
            Kembali ke Daftar Peminjaman
          </Button>
        </Link>
      </div>
    );
  }

  const isAlreadyReturned = peminjaman.status === 'kembali';
  const rusakBeratCount = itemsState.filter((i) => i.kondisi_kembali === 'rusak_berat').length;
  const hilangCount = itemsState.filter((i) => i.kondisi_kembali === 'hilang').length;

  return (
    <div className="w-full flex flex-col gap-6 p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header Halaman */}
      <PageHeader
        title="Pemeriksaan & Pengembalian Barang"
        description={`Verifikasi kelengkapan fisik, kondisi barang kembali, dan alur perbaikan/penggantian transaksi #${peminjaman.kode_peminjaman || `PA-${peminjaman.id}`}`}
        action={
          <Link href={`/sinapra/peminjaman/aset/${peminjamanId}`}>
            <Button
              variant="outline"
              style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
            >
              <ArrowLeft size={16} className="mr-1.5" />
              Kembali ke Detail
            </Button>
          </Link>
        }
      />

      {/* Banner Jika Sudah Pernah Dikembalikan */}
      {isAlreadyReturned && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-start gap-3">
          <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-800 dark:text-emerald-200">
            <p className="font-bold">Barang dalam pengajuan ini sudah tercatat dikembalikan!</p>
            <p className="mt-0.5">
              Tanggal Pengembalian:{' '}
              <span className="font-semibold">
                {formatDate(peminjaman.tanggal_kembali_aktual || peminjaman.tanggal_kembali_realisasi)}
              </span>{' '}
              dengan kondisi <span className="font-semibold capitalize">{peminjaman.kondisi_kembali || 'baik'}</span>.
            </p>
          </div>
        </div>
      )}

      {/* Banner Deteksi Keterlambatan */}
      {isLate && !isAlreadyReturned && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 dark:text-amber-200">
            <p className="font-bold">Peringatan: Pengembalian Melewati Batas Waktu!</p>
            <p className="mt-0.5">
              Rencana tanggal pengembalian adalah{' '}
              <span className="font-semibold">{formatDate(peminjaman.tanggal_kembali_rencana)}</span>. Pengembalian pada tanggal{' '}
              <span className="font-semibold">{formatDate(selectedTanggalKembali)}</span> terlambat{' '}
              <span className="font-bold text-rose-600">{lateDays} hari</span>. Harap catat alasan keterlambatan pada catatan pemeriksaan.
            </p>
          </div>
        </div>
      )}

      {/* Grid Informasi Ringkas Peminjam */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <User size={15} className="text-[var(--module-primary)]" />
            Informasi Peminjam & Jadwal Pemakaian
          </h3>
          <span className="text-2xs font-mono font-semibold text-[var(--module-primary)] bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
            Kode: {peminjaman.kode_peminjaman || `PA-${peminjaman.id}`}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-2xs text-slate-400 block font-semibold uppercase">Nama Peminjam</span>
            <span className="font-bold text-slate-800 dark:text-slate-100 text-xs">
              {peminjaman.user?.pegawai?.nama_lengkap ||
                peminjaman.user?.mahasiswa?.nama_lengkap ||
                peminjaman.user?.name ||
                '-'}
            </span>
            <span className="text-2xs text-slate-400 block mt-0.5">
              Identitas: {peminjaman.nomor_identitas || '-'} | Kontak: {peminjaman.kontak_peminjam || '-'}
            </span>
          </div>

          <div>
            <span className="text-2xs text-slate-400 block font-semibold uppercase">Jadwal Peminjaman</span>
            <span className="text-slate-700 dark:text-slate-300 text-xs font-medium">
              {formatDate(peminjaman.tanggal_pinjam)} s.d. {formatDate(peminjaman.tanggal_kembali_rencana)}
            </span>
          </div>

          <div>
            <span className="text-2xs text-slate-400 block font-semibold uppercase">Keperluan</span>
            <span className="text-slate-700 dark:text-slate-300 text-xs truncate block" title={peminjaman.keperluan}>
              {peminjaman.keperluan}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* CARD DAFTAR BARANG YANG DIPINJAM & STATUS KONDISI */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 md:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 flex-wrap gap-2">
            <div>
              <h3 className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Boxes className="text-[var(--module-primary)]" size={18} />
                Pemeriksaan Fisik Barang yang Dipinjam ({itemsState.length} Barang)
              </h3>
              <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pastikan seluruh komponen dan kondisi fisik barang diperiksa secara cermat oleh Admin / Laboran
              </p>
            </div>

            {!isAlreadyReturned && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<Sparkles size={14} className="text-emerald-600" />}
                onClick={handleSetAllBaik}
                className="text-2xs"
              >
                Set Semua Kondisi Baik
              </Button>
            )}
          </div>

          {/* List Barang Pinjaman */}
          <div className="space-y-4">
            {itemsState.map((item, index) => (
              <div
                key={item.peminjaman_id}
                className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-2xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-100 text-xs block">
                        {item.nama_barang}
                      </span>
                      <div className="flex flex-wrap items-center gap-2 text-2xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                        <span className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-bold text-[var(--module-primary)]">
                          {item.kode_aset}
                        </span>
                        <span>Lokasi: {item.ruangan_nama}</span>
                        <span>•</span>
                        <span>Kondisi Awal: <strong className="capitalize font-sans">{item.kondisi_awal}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full sm:w-64">
                    <Select
                      label="Kondisi Saat Kembali *"
                      value={item.kondisi_kembali}
                      onChange={(val) => updateItemKondisi(item.peminjaman_id, val as any)}
                      options={[
                        { value: 'baik', label: 'Baik (Lengkap & Normal)' },
                        { value: 'rusak_ringan', label: 'Rusak Ringan (Bisa Digunakan)' },
                        { value: 'rusak_berat', label: 'Rusak Berat (Butuh Perbaikan)' },
                        { value: 'hilang', label: 'Hilang (Butuh Penggantian)' },
                      ]}
                      disabled={isAlreadyReturned}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <Input
                    placeholder="Catatan kondisi fisik/kelengkapan barang ini (opsional)..."
                    value={item.catatan}
                    onChange={(e) => updateItemCatatan(item.peminjaman_id, e.target.value)}
                    disabled={isAlreadyReturned}
                  />
                </div>

                {/* Notifikasi Alur Kondisi Khusus Per Barang */}
                {item.kondisi_kembali === 'rusak_berat' && (
                  <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-2 text-2xs text-rose-800 dark:text-rose-300">
                    <Wrench size={14} className="text-rose-600 flex-shrink-0" />
                    <span>
                      <strong>Alur Perbaikan Otomatis:</strong> Barang ini akan otomatis dialihkan ke status <em>maintenance</em> dan dibuatkan tiket perawatan darurat di log pemeliharaan sarpras.
                    </span>
                  </div>
                )}

                {item.kondisi_kembali === 'hilang' && (
                  <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-center gap-2 text-2xs text-amber-900 dark:text-amber-200">
                    <ShieldAlert size={14} className="text-amber-600 flex-shrink-0" />
                    <span>
                      <strong>Alur Penggantian Barang:</strong> Barang ini berstatus hilang dan dialihkan ke usulan apkir. Peminjam wajib menindaklanjuti proses penggantian barang.
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ALUR PENANGANAN SISTEM JIKA ADA BARANG RUSAK ATAU HILANG */}
        {(rusakBeratCount > 0 || hilangCount > 0) && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <ShieldAlert size={16} className="text-amber-600" />
              Alur Tindak Lanjut Otomatis Sistem
            </h4>

            <div className="space-y-2 text-2xs">
              {rusakBeratCount > 0 && (
                <div className="p-3 rounded-lg bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 flex items-start gap-2">
                  <Wrench size={15} className="text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">
                      {rusakBeratCount} Barang Membutuhkan Perbaikan / Servis
                    </span>
                    <p className="mt-0.5 text-slate-600 dark:text-slate-400">
                      Sistem SINAPRA akan otomatis menerbitkan tiket perbaikan pada tabel antrean perawatan (<code>sinapra_maintenance_log</code>) dengan prioritas <strong>Tinggi</strong> agar teknisi sarpras dapat segera melakukan penanganan.
                    </p>
                  </div>
                </div>
              )}

              {hilangCount > 0 && (
                <div className="p-3 rounded-lg bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 flex items-start gap-2">
                  <ShieldAlert size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">
                      {hilangCount} Barang Berstatus Hilang / Butuh Penggantian
                    </span>
                    <p className="mt-0.5 text-slate-600 dark:text-slate-400">
                      Status aset di inventaris akan otomatis disesuaikan menjadi <strong>disetujui_diapkir</strong> dan tercatat pada audit log untuk verifikasi ganti rugi peminjam.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TANGGAL & CATATAN GLOBAL */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 md:p-6 space-y-4">
          <h3 className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-[var(--module-primary)]" />
            Konfirmasi Serah Terima & Tanggal Aktual
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Tanggal Pengembalian Aktual"
              type="date"
              {...register('tanggal_kembali_aktual')}
              error={errors.tanggal_kembali_aktual?.message}
              required
              disabled={isAlreadyReturned}
            />

            <Textarea
              label="Catatan Umum Penerimaan (Admin / Laboran)"
              placeholder="Catatan menyeluruh mengenai serah terima barang, kondisi kebersihan, atau kelengkapan berkas..."
              rows={3}
              {...register('catatan_pengembalian')}
              error={errors.catatan_pengembalian?.message}
              disabled={isAlreadyReturned}
            />
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <Link href={`/sinapra/peminjaman/aset/${peminjamanId}`}>
              <Button type="button" variant="outline">
                Batal
              </Button>
            </Link>
            {!isAlreadyReturned && (
              <Button
                type="submit"
                variant="primary"
                icon={<RotateCcw size={16} />}
              >
                Selesaikan Pengembalian Barang
              </Button>
            )}
          </div>
        </div>
      </form>

      {/* Modal Konfirmasi Pengembalian */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={executePengembalian}
        title="Konfirmasi Penyelesaian Pengembalian Barang"
        message={
          <span>
            Apakah Anda yakin ingin memproses pengembalian untuk{' '}
            <strong>{itemsState.length} barang</strong> dalam transaksi ini? Status fisik aset dan antrean perawatan akan diperbarui secara otomatis.
          </span>
        }
        confirmText="Ya, Selesaikan Pengembalian"
        cancelText="Batal"
        variant="primary"
        isLoading={isSubmitting}
      />
    </div>
  );
}

