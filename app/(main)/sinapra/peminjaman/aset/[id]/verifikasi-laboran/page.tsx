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
  Info,
  CheckCircle2,
  XCircle,
  Phone,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { sinapraService } from '@/services/sinapra.service';
import type { PeminjamanAset } from '@/types/sinapra.types';

export default function VerifikasiLaboranAsetPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params?.id);

  const [peminjaman, setPeminjaman] = useState<PeminjamanAset | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [isApproved, setIsApproved] = useState(true);
  const [catatanLaboran, setCatatanLaboran] = useState('');

  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      setIsLoading(true);
      try {
        const res = await sinapraService.getPeminjamanAsetDetail(id);
        if (res?.data) {
          setPeminjaman(res.data);
          if (res.data.status !== 'pending_laboran') {
            toast('Permohonan ini tidak sedang dalam status menunggu verifikasi laboran.');
          }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    if (!isApproved && !catatanLaboran.trim()) {
      toast.error('Wajib memberikan catatan / alasan penolakan verifikasi.');
      return;
    }

    setIsSubmitting(true);
    try {
      await sinapraService.approveLaboranAset(id, {
        is_approved: isApproved,
        catatan_laboran: catatanLaboran.trim() || undefined,
      });

      toast.success(
        `Verifikasi laboran aset berhasil ${isApproved ? 'disetujui & diteruskan ke Admin Sarpras' : 'ditolak'}!`
      );
      router.push(`/sinapra/peminjaman/aset/${id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memproses verifikasi laboran aset.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex w-full flex-col gap-4">
        <PageHeader title="Verifikasi Laboran Peminjaman Aset" />
        <div className="flex justify-center p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500">Memuat berkas permohonan aset...</p>
        </div>
      </div>
    );
  }

  if (!peminjaman) {
    return null;
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title={`Verifikasi Laboran Aset: ${peminjaman.kode_peminjaman || `PA-${peminjaman.id}`}`}
        description="Pemeriksaan ketersediaan barang inventaris praktikum, kondisi fisik alat, dan kelayakan peminjaman"
        action={
          <Button
            variant="outline"
            icon={<ArrowLeft size={16} />}
            onClick={() => router.push(`/sinapra/peminjaman/aset/${peminjaman.id}`)}
            style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
          >
            Kembali ke Detail
          </Button>
        }
      />

      {/* Banner Keterangan Tahap Laboran */}
      <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/70 dark:bg-blue-950/20 flex items-start gap-3 text-xs text-blue-900 dark:text-blue-200">
        <Info size={18} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold block">Pemeriksaan Fisik & Kesiapan Alat Praktikum:</span>
          <p className="text-blue-700 dark:text-blue-300 leading-relaxed text-2xs md:text-xs">
            Sebagai laboran penanggung jawab, Anda memverifikasi kelayakan alat laboratorium, memastikan kelengkapan kabel/aksesori, serta tidak sedang dibutuhkan untuk modul praktikum berjalan. Persetujuan Anda akan meneruskan permohonan ke Admin Sarpras untuk persetujuan akhir.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KOLOM KIRI (2/3): FORM KEPUTUSAN VERIFIKASI */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 md:p-6 space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm md:text-base border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <ShieldCheck className="text-[var(--module-primary)]" size={18} />
              Formulir Keputusan Verifikasi Laboran
            </h3>

            <div className="space-y-4">
              <div>
                <Select
                  label="Keputusan Verifikasi Laboran *"
                  value={isApproved ? 'true' : 'false'}
                  onChange={(val) => setIsApproved(val === 'true')}
                  options={[
                    { value: 'true', label: 'Setujui & Teruskan ke Admin Sarpras' },
                    { value: 'false', label: 'Tolak Permohonan Peminjaman Aset' },
                  ]}
                />
                <p className="text-2xs text-slate-500 mt-1">
                  {isApproved
                    ? 'Permohonan akan berlanjut ke tahap persetujuan final Admin SINAPRA.'
                    : 'Permohonan akan ditolak dan peminjam akan menerima alasan pembatalan.'}
                </p>
              </div>

              <div>
                <Textarea
                  label={isApproved ? 'Catatan Kondisi Fisik / Kelengkapan Alat (Opsional)' : 'Alasan Penolakan Laboran *'}
                  required={!isApproved}
                  rows={4}
                  placeholder={
                    isApproved
                      ? 'Catatan kondisi kelengkapan komponen, aksesori pendukung, atau arahan pengambilan barang di lab...'
                      : 'Jelaskan alasan penolakan (misal: alat sedang rusak/dikalibrasi, sedang dipakai praktikum inti)...'
                  }
                  value={catatanLaboran}
                  onChange={(e) => setCatatanLaboran(e.target.value)}
                  hint={isApproved ? 'Dapat dibaca oleh pemohon dan Admin Sarpras.' : 'Wajib diisi agar pemohon mengetahui alasan pembatalan.'}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push(`/sinapra/peminjaman/aset/${peminjaman.id}`)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant={isApproved ? 'primary' : 'danger'}
                loading={isSubmitting}
                icon={isApproved ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
              >
                {isApproved ? 'Kirim Persetujuan Verifikasi' : 'Tolak Permohonan Aset'}
              </Button>
            </div>
          </form>
        </div>

        {/* KOLOM KANAN (1/3): RINGKASAN BARANG & PEMINJAM */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 md:p-6 space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm md:text-base border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Boxes className="text-[var(--module-primary)]" size={18} />
              Ringkasan Barang yang Diajukan
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-2xs text-slate-400 uppercase font-semibold block">Nama Barang</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  {peminjaman.aset?.nama}
                </span>
                <span className="text-2xs font-mono text-[var(--module-primary)] block">
                  [{peminjaman.aset?.kode_aset}] • Ruangan: {peminjaman.aset?.ruangan?.nama || 'Sentral'}
                </span>
              </div>

              <div>
                <span className="text-2xs text-slate-400 uppercase font-semibold block">Identitas Peminjam</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                  {peminjaman.user?.name || `User #${peminjaman.user_id}`}
                </span>
                {peminjaman.nomor_identitas && (
                  <span className="text-2xs text-slate-500 font-mono block">
                    NIM/NIDN/NIP: {peminjaman.nomor_identitas}
                  </span>
                )}
                {peminjaman.kontak_peminjam && (
                  <span className="text-2xs text-emerald-600 font-mono flex items-center gap-1 mt-0.5">
                    <Phone size={11} /> {peminjaman.kontak_peminjam}
                  </span>
                )}
              </div>

              <div>
                <span className="text-2xs text-slate-400 uppercase font-semibold block">Jadwal Pinjam</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mt-0.5">
                  <CalendarCheck size={14} className="text-[var(--module-primary)]" />
                  {formatDate(peminjaman.tanggal_pinjam)} s.d {formatDate(peminjaman.tanggal_kembali_rencana)}
                </span>
              </div>

              <div>
                <span className="text-2xs text-slate-400 uppercase font-semibold block">Keperluan</span>
                <p className="text-2xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/60 leading-relaxed mt-1">
                  {peminjaman.keperluan}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}