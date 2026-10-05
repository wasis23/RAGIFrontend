'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Boxes,
  CalendarCheck,
  MapPin,
  Clock,
  UserCheck,
  ShieldCheck,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  Tag,
  Phone,
  Printer,
  RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { sinapraService } from '@/services/sinapra.service';
import type { PeminjamanAset } from '@/types/sinapra.types';

export default function DetailPeminjamanAsetPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params?.id);

  const [peminjaman, setPeminjaman] = useState<PeminjamanAset | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      setIsLoading(true);
      try {
        const res = await sinapraService.getPeminjamanAsetDetail(id);
        if (res?.data) {
          setPeminjaman(res.data);
        }
      } catch {
        toast.error('Gagal memuat rincian peminjaman aset.');
        router.push('/sinapra/peminjaman');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetail();
  }, [id, router]);

  const renderStatusBadge = (status?: string) => {
    let label = status?.replace(/_/g, ' ') || '-';

    if (status === 'pending_laboran') {
      label = 'Tahap Verifikasi Laboran';
    } else if (status === 'pending_admin_sinapra') {
      label = 'Tahap Persetujuan Admin';
    } else if (status === 'disetujui') {
      label = 'Disetujui';
    } else if (status === 'dipinjam') {
      label = 'Sedang Dipinjam';
    } else if (status === 'ditolak_laboran') {
      label = 'Ditolak Laboran';
    } else if (status === 'ditolak_admin_sinapra' || status === 'ditolak') {
      label = 'Ditolak Admin';
    } else if (status === 'kembali') {
      label = 'Sudah Kembali';
    }

    return (
      <Badge
        style={{
          backgroundColor: 'color-mix(in srgb, var(--module-primary) 12%, transparent)',
          color: 'var(--module-primary)',
          borderColor: 'color-mix(in srgb, var(--module-primary) 25%, transparent)',
        }}
        className="text-xs font-semibold px-2.5 py-1 border capitalize"
      >
        {label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex w-full flex-col gap-4">
        <PageHeader title="Detail Peminjaman Aset" />
        <div className="flex justify-center p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500">Memuat rincian peminjaman aset...</p>
        </div>
      </div>
    );
  }

  if (!peminjaman) {
    return (
      <div className="flex w-full flex-col gap-4">
        <PageHeader title="Detail Peminjaman Aset" />
        <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
          <AlertCircle size={32} className="mx-auto text-rose-500 mb-2" />
          <p className="text-xs text-rose-500 font-semibold">Data peminjaman aset tidak ditemukan.</p>
          <Button
            variant="outline"
            className="mt-3"
            onClick={() => router.push('/sinapra/peminjaman')}
          >
            Kembali ke Daftar
          </Button>
        </div>
      </div>
    );
  }

  const isLaboranPending = peminjaman.status === 'pending_laboran';
  const identitasPemohon =
    peminjaman.nomor_identitas ||
    (peminjaman.user as any)?.mahasiswa?.nim ||
    (peminjaman.user as any)?.pegawai?.nidn ||
    (peminjaman.user as any)?.pegawai?.nuptk ||
    (peminjaman.user as any)?.pegawai?.nip;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title={`Detail Peminjaman Barang / Aset: ${peminjaman.kode_peminjaman || `PA-${peminjaman.id}`}`}
        description="Rincian lengkap barang inventaris yang dipinjam, identitas peminjam, jadwal pemakaian, serta status pengesahan"
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              icon={<ArrowLeft size={16} />}
              onClick={() => router.push('/sinapra/peminjaman')}
              style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
            >
              Kembali
            </Button>
            {['disetujui', 'dipinjam', 'kembali'].includes(peminjaman.status) && (
              <Button
                variant="outline"
                icon={<Printer size={16} />}
                onClick={() => router.push(`/sinapra/peminjaman/aset/${peminjaman.id}/surat`)}
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                Lihat Surat Peminjaman
              </Button>
            )}
            {['disetujui', 'dipinjam'].includes(peminjaman.status) && (
              <Button
                variant="primary"
                icon={<RotateCcw size={16} />}
                onClick={() => router.push(`/sinapra/peminjaman/aset/${peminjaman.id}/kembalikan`)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Kembalikan Aset
              </Button>
            )}
            {isLaboranPending && (
              <Button
                variant="primary"
                icon={<UserCheck size={16} />}
                onClick={() => router.push(`/sinapra/peminjaman/aset/${peminjaman.id}/verifikasi-laboran`)}
              >
                Verifikasi Laboran
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KOLOM KIRI (2/3): INFORMASI BARANG & JADWAL PINJAM */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card Barang Aset */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 md:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Boxes className="text-[var(--module-primary)]" size={20} />
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm md:text-base">
                    Informasi Barang Inventaris
                  </h3>
                  {peminjaman.kode_peminjaman && (
                    <span className="font-mono text-2xs text-[var(--module-primary)] font-bold">
                      Batch Transaksi: {peminjaman.kode_peminjaman}
                    </span>
                  )}
                </div>
              </div>
              {renderStatusBadge(peminjaman.status)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-700/60">
                <span className="text-2xs text-slate-400 block font-semibold uppercase">Nama Barang / Aset</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  {peminjaman.aset?.nama || `Aset #${peminjaman.aset_id}`}
                </span>
                <span className="text-2xs font-mono text-[var(--module-primary)] block mt-0.5">
                  Kode: {peminjaman.aset?.kode_aset || '-'}
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-700/60">
                <span className="text-2xs text-slate-400 block font-semibold uppercase">Lokasi / Ruangan Asal</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-1.5 mt-0.5">
                  <MapPin size={14} className="text-[var(--module-primary)]" />
                  {peminjaman.aset?.ruangan?.nama || 'Ruangan Umum Kampus'}
                </span>
                <span className="text-2xs text-slate-500 block mt-0.5">
                  Kondisi Saat Ini: <strong className="capitalize">{peminjaman.aset?.kondisi || 'Baik'}</strong>
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-700/60">
                <span className="text-2xs text-slate-400 block font-semibold uppercase">Tanggal Mulai Pinjam</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-1.5 mt-0.5">
                  <CalendarCheck size={14} className="text-[var(--module-primary)]" />
                  {formatDate(peminjaman.tanggal_pinjam)}
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-700/60">
                <span className="text-2xs text-slate-400 block font-semibold uppercase">Rencana Pengembalian</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-1.5 mt-0.5">
                  <Clock size={14} className="text-[var(--module-primary)]" />
                  {formatDate(peminjaman.tanggal_kembali_rencana)}
                </span>
                {peminjaman.tanggal_kembali_realisasi && (
                  <span className="text-2xs text-emerald-600 font-semibold block mt-0.5">
                    Dikembalikan: {formatDate(peminjaman.tanggal_kembali_realisasi)} (Kondisi: {peminjaman.kondisi_kembali || 'Baik'})
                  </span>
                )}
              </div>
            </div>

            {/* Keperluan */}
            <div className="pt-2">
              <span className="text-2xs text-slate-400 block font-semibold uppercase mb-1 flex items-center gap-1">
                <FileText size={12} /> Keperluan & Rincian Pemakaian Barang
              </span>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                {peminjaman.keperluan || 'Tidak ada deskripsi keperluan peminjaman.'}
              </div>
            </div>
          </div>

          {/* Card Verifikasi & Persetujuan Berjenjang */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 md:p-6 space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm md:text-base border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <ShieldCheck className="text-[var(--module-primary)]" size={18} />
              Tahapan Verifikasi & Persetujuan Peminjaman Aset
            </h3>

            <div className="space-y-3">
              {/* Tahap 1: Verifikasi Laboran */}
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    1. Verifikasi Laboran Pengampu Alat
                  </span>
                  {peminjaman.laboran_approved_at ? (
                    <span className="inline-flex items-center gap-1 text-2xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded px-2 py-0.5">
                      <CheckCircle2 size={12} /> Terverifikasi ({formatDate(peminjaman.laboran_approved_at)})
                    </span>
                  ) : peminjaman.status === 'ditolak_laboran' ? (
                    <span className="inline-flex items-center gap-1 text-2xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded px-2 py-0.5">
                      <XCircle size={12} /> Ditolak Laboran
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-2xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded px-2 py-0.5">
                      <HelpCircle size={12} /> Menunggu Verifikasi
                    </span>
                  )}
                </div>
                {peminjaman.laboran_approver && (
                  <p className="text-2xs text-slate-500">
                    Oleh Laboran: <strong>{peminjaman.laboran_approver.name}</strong> ({peminjaman.laboran_approver.email})
                  </p>
                )}
                {peminjaman.catatan_laboran && (
                  <div className="mt-1 text-2xs p-2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                    <strong>Catatan Laboran:</strong> {peminjaman.catatan_laboran}
                  </div>
                )}
              </div>

              {/* Tahap 2: Persetujuan Admin SARPRAS */}
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    2. Persetujuan Akhir Admin Sarpras (SINAPRA)
                  </span>
                  {peminjaman.admin_approved_at ? (
                    <span className="inline-flex items-center gap-1 text-2xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded px-2 py-0.5">
                      <CheckCircle2 size={12} /> Disetujui ({formatDate(peminjaman.admin_approved_at)})
                    </span>
                  ) : peminjaman.status === 'ditolak_admin_sinapra' || peminjaman.status === 'ditolak' ? (
                    <span className="inline-flex items-center gap-1 text-2xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded px-2 py-0.5">
                      <XCircle size={12} /> Ditolak Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-2xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-0.5">
                      Menunggu Tahap Sebelumnya
                    </span>
                  )}
                </div>
                {peminjaman.approver && (
                  <p className="text-2xs text-slate-500">
                    Oleh Admin: <strong>{peminjaman.approver.name}</strong> ({peminjaman.approver.email})
                  </p>
                )}
                {peminjaman.catatan_penolakan && (
                  <div className="mt-1 text-2xs p-2 rounded bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300">
                    <strong>Alasan / Catatan Penolakan:</strong> {peminjaman.catatan_penolakan}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN (1/3): DATA PEMINJAM & AKSI */}
        <div className="space-y-6">
          {/* Card Pemohon */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 md:p-6 space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm md:text-base border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <UserCheck className="text-[var(--module-primary)]" size={18} />
              Identitas Peminjam
            </h3>

            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-2xs text-slate-400 uppercase font-semibold block">Nama Peminjam</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  {peminjaman.user?.name || `User #${peminjaman.user_id}`}
                </span>
              </div>

              {identitasPemohon && (
                <div>
                  <span className="text-2xs text-slate-400 uppercase font-semibold block">Nomor Identitas (NIM/NIDN/NIP)</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200 text-xs font-semibold">
                    {identitasPemohon}
                  </span>
                </div>
              )}

              {peminjaman.kontak_peminjam && (
                <div>
                  <span className="text-2xs text-slate-400 uppercase font-semibold block">Kontak / WhatsApp Aktif</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5 mt-0.5">
                    <Phone size={12} className="text-emerald-600" />
                    {peminjaman.kontak_peminjam}
                  </span>
                </div>
              )}

              <div>
                <span className="text-2xs text-slate-400 uppercase font-semibold block">Alamat Email</span>
                <span className="font-mono text-slate-700 dark:text-slate-300 text-xs">
                  {peminjaman.user?.email || '-'}
                </span>
              </div>

              <div>
                <span className="text-2xs text-slate-400 uppercase font-semibold block">Waktu Pengajuan</span>
                <span className="text-slate-600 dark:text-slate-400 text-xs">
                  {peminjaman.created_at ? formatDate(peminjaman.created_at) : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Aksi Cepat
            </h4>
            <div className="flex flex-col gap-2">
              {isLaboranPending ? (
                <Button
                  variant="primary"
                  className="w-full justify-center"
                  icon={<UserCheck size={16} />}
                  onClick={() => router.push(`/sinapra/peminjaman/aset/${peminjaman.id}/verifikasi-laboran`)}
                >
                  Buka Form Verifikasi Laboran
                </Button>
              ) : null}
              <Button
                variant="outline"
                className="w-full justify-center"
                style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
                onClick={() => router.push('/sinapra/peminjaman')}
              >
                Kembali ke Daftar Peminjaman
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}