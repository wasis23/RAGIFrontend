'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  FileText, 
  Calendar, 
  Building2, 
  User, 
  ExternalLink, 
  AlertTriangle,
  XCircle,
  FileCheck2,
  Share2
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Textarea';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { arsipService } from '@/services/arsip.service';
import { useAuth } from '@/hooks/useAuth';
import { getApiErrorMessage } from '@/lib/utils';
import type { NomorSurat } from '@/types/arsip.types';
import toast from 'react-hot-toast';

export default function DetailNomorSuratPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params?.id);

  const { hasPermission } = useAuth();
  const canCancel = hasPermission('arsip.nomor_surat.update');

  const [nomor, setNomor] = useState<NomorSurat | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Cancel dialog state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [alasanBatal, setAlasanBatal] = useState('');
  const [submittingCancel, setSubmittingCancel] = useState(false);

  const fetchDetail = async () => {
    if (!id || isNaN(id)) return;
    try {
      setLoading(true);
      const res = await arsipService.getNomorSuratDetail(id);
      setNomor(res.data || null);
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Gagal memuat rincian nomor surat.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleCopyNomor = () => {
    if (!nomor) return;
    navigator.clipboard.writeText(nomor.nomor_surat);
    setCopied(true);
    toast.success('Nomor surat berhasil disalin ke papan klip!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmCancel = async () => {
    if (!nomor) return;
    if (!alasanBatal.trim()) {
      toast.error('Alasan pembatalan nomor surat wajib diisi.');
      return;
    }

    try {
      setSubmittingCancel(true);
      await arsipService.batalkanNomorSurat(nomor.id, alasanBatal);
      toast.success(`Nomor surat ${nomor.nomor_surat} berhasil dibatalkan.`);
      setCancelDialogOpen(false);
      fetchDetail();
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Gagal membatalkan nomor surat.'));
    } finally {
      setSubmittingCancel(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center p-12 text-slate-500 text-xs">
        Memuat detail nomor surat...
      </div>
    );
  }

  if (!nomor) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-12 gap-3">
        <p className="text-xs text-slate-600">Nomor surat tidak ditemukan atau telah dihapus.</p>
        <Link href="/arsip/nomor-surat">
          <Button variant="outline" size="sm">
            Kembali ke Daftar
          </Button>
        </Link>
      </div>
    );
  }

  const isBatal = nomor.status === 'dibatalkan';

  return (
    <div className="animate-fade-in space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Detail Nomor Surat Resmi"
        description="Informasi lengkap dokumen, klasifikasi, status, dan riwayat penerbitan nomor surat"
        action={
          <div className="flex items-center gap-2">
            <Link href="/arsip/nomor-surat">
              <Button
                variant="outline"
                size="md"
                className="border-[var(--module-primary)] text-[var(--module-primary)] hover:bg-[var(--module-primary-subtle,#f0fdfa)]"
              >
                <ArrowLeft size={16} className="mr-1.5" />
                Kembali
              </Button>
            </Link>
            {!isBatal && canCancel && (
              <Button
                variant="outline"
                size="md"
                className="border-red-300 text-red-600 hover:bg-red-50"
                onClick={() => {
                  setAlasanBatal('');
                  setCancelDialogOpen(true);
                }}
              >
                <XCircle size={16} className="mr-1.5" />
                Batalkan Nomor
              </Button>
            )}
          </div>
        }
      />

      {/* Main Banner Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">
              Nomor Registrasi Resmi
            </span>
            <Badge
              variant={
                nomor.status === 'terpakai'
                  ? 'success'
                  : nomor.status === 'direservasi'
                  ? 'warning'
                  : 'danger'
              }
              className="capitalize text-2xs font-semibold"
            >
              {nomor.status}
            </Badge>
          </div>
          <h2 className="font-mono text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            {nomor.nomor_surat}
          </h2>
          <p className="text-2xs text-slate-500">
            Urutan Nomor #{nomor.nomor_urut} • Periode Tahun {nomor.tahun}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={handleCopyNomor}
            className="border-[var(--module-primary)] text-[var(--module-primary)] hover:bg-[var(--module-primary-subtle,#f0fdfa)]"
          >
            {copied ? (
              <>
                <Check size={16} className="mr-1.5 text-emerald-600" />
                Tersalin!
              </>
            ) : (
              <>
                <Copy size={16} className="mr-1.5" />
                Salin Nomor Surat
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Cancellation Warning Banner */}
      {isBatal && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-red-900">
          <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <h4 className="text-xs font-bold">Nomor Surat Ini Telah Dibatalkan</h4>
            <p className="text-xs text-red-700">
              {nomor.catatan || 'Tidak ada keterangan alasan pembatalan.'}
            </p>
          </div>
        </div>
      )}

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Rincian Surat */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 flex items-center gap-2">
            <FileText size={16} className="text-[var(--module-primary)]" />
            Rincian Dokumen Surat
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block text-2xs uppercase">Perihal Surat</span>
              <p className="font-semibold text-slate-800 text-xs mt-0.5">{nomor.perihal}</p>
            </div>

            <div>
              <span className="text-slate-400 block text-2xs uppercase">Tujuan / Penerima</span>
              <p className="font-medium text-slate-700 mt-0.5">{nomor.tujuan || '-'}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <span className="text-slate-400 block text-2xs uppercase">Tanggal Surat</span>
                <p className="font-medium text-slate-800 mt-0.5">{nomor.tanggal_surat}</p>
              </div>
              <div>
                <span className="text-slate-400 block text-2xs uppercase">Bulan Romawi</span>
                <p className="font-mono font-bold text-slate-800 mt-0.5">{nomor.bulan_romawi}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <span className="text-slate-400 block text-2xs uppercase">Kode Unit</span>
                <p className="font-medium text-slate-800 mt-0.5">{nomor.kode_unit}</p>
              </div>
              <div>
                <span className="text-slate-400 block text-2xs uppercase">Kode Klasifikasi</span>
                <p className="font-medium text-slate-800 mt-0.5">{nomor.kode_klasifikasi}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="text-slate-400 block text-2xs uppercase">Modul Penerbit / Asal</span>
              <div className="mt-1">
                <Badge variant="blue" className="uppercase text-2xs font-semibold">
                  {nomor.module_origin}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Kop Surat Berlaku */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Building2 size={16} className="text-[var(--module-primary)]" />
            Kop Surat Berlaku ({nomor.tahun})
          </h3>

          {nomor.kop_surat ? (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-2xs uppercase">Versi Kop Surat</span>
                  <p className="font-semibold text-slate-800 mt-0.5 capitalize">
                    Versi {nomor.kop_surat.versi}{' '}
                    <span className="text-slate-400 text-2xs">
                      ({nomor.kop_surat.versi === 'baru' ? '≥ 2021' : '< 2021'})
                    </span>
                  </p>
                </div>
                <Badge
                  variant={nomor.kop_surat.versi === 'baru' ? 'success' : 'purple'}
                  className="uppercase text-2xs font-semibold"
                >
                  Versi {nomor.kop_surat.versi}
                </Badge>
              </div>

              <div>
                <span className="text-slate-400 block text-2xs uppercase">Nama Institusi</span>
                <p className="font-medium text-slate-800 mt-0.5">
                  {nomor.kop_surat.nama_institusi || nomor.kop_surat.nama}
                </p>
              </div>

              <div>
                <span className="text-slate-400 block text-2xs uppercase">Alamat Institusi</span>
                <p className="text-slate-600 mt-0.5">
                  {nomor.kop_surat.alamat_institusi || '-'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <span className="text-slate-400 block text-2xs uppercase">Kontak</span>
                  <p className="text-slate-700 mt-0.5">{nomor.kop_surat.kontak_institusi || '-'}</p>
                </div>
                <div>
                  <span className="text-slate-400 block text-2xs uppercase">Website</span>
                  <p className="text-slate-700 mt-0.5">{nomor.kop_surat.website_institusi || '-'}</p>
                </div>
              </div>

              {nomor.kop_surat.file_url && (
                <div className="pt-2 border-t border-slate-100">
                  <a
                    href={nomor.kop_surat.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center text-xs font-semibold text-[var(--module-primary)] hover:opacity-80 hover:underline gap-1.5"
                  >
                    <ExternalLink size={14} />
                    Lihat Berkas Kop Surat (Signed URL)
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center text-xs text-slate-500">
              Tidak ada lampiran kop surat khusus untuk nomor ini.
            </div>
          )}
        </div>
      </div>

      {/* Card 3: Informasi Permohonan Lintas Modul (jika ada) */}
      {nomor.request && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 flex items-center gap-2">
            <FileCheck2 size={16} className="text-[var(--module-primary)]" />
            Asal Permohonan Lintas Modul
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block text-2xs uppercase">Kode Request</span>
              <p className="font-mono font-bold text-slate-800 mt-0.5">
                {nomor.request.kode_request}
              </p>
            </div>
            <div>
              <span className="text-slate-400 block text-2xs uppercase">Pemohon</span>
              <p className="font-medium text-slate-800 mt-0.5">
                {nomor.request.user?.name || '-'}
              </p>
            </div>
            <div>
              <span className="text-slate-400 block text-2xs uppercase">Asal Modul</span>
              <div className="mt-0.5">
                <Badge variant="blue" className="uppercase text-2xs">
                  {nomor.request.module_origin}
                </Badge>
              </div>
            </div>

            {nomor.request.catatan_pemohon && (
              <div className="md:col-span-3 pt-2 border-t border-slate-100">
                <span className="text-slate-400 block text-2xs uppercase">Catatan Pemohon</span>
                <p className="text-slate-700 mt-0.5 italic">
                  &ldquo;{nomor.request.catatan_pemohon}&rdquo;
                </p>
              </div>
            )}

            {nomor.request.dokumen_lampiran_url && (
              <div className="md:col-span-3 pt-2 border-t border-slate-100">
                <a
                  href={nomor.request.dokumen_lampiran_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center text-xs font-semibold text-[var(--module-primary)] hover:opacity-80 hover:underline gap-1.5"
                >
                  <ExternalLink size={14} />
                  Lihat Berkas Lampiran Permohonan
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Card 4: Metadata Penerbitan */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-500 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <User size={14} className="text-slate-400" />
          <span>
            Diterbitkan oleh: <strong className="text-slate-700">{nomor.pembuat?.name || 'Administrator'}</strong>
          </span>
        </div>
        <div>
          Waktu Penerbitan: {new Date(nomor.created_at).toLocaleString('id-ID')}
        </div>
      </div>

      {/* Confirm Dialog: Pembatalan */}
      <ConfirmDialog
        isOpen={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        onConfirm={handleConfirmCancel}
        title="Batalkan Nomor Surat"
        message={
          <div className="flex flex-col gap-3">
            <p className="text-xs text-slate-600">
              Apakah Anda yakin ingin membatalkan nomor surat{' '}
              <strong className="text-slate-900 font-mono">{nomor.nomor_surat}</strong>?
            </p>
            <div>
              <Textarea
                label="Alasan Pembatalan *"
                rows={3}
                placeholder="Tuliskan alasan resmi pembatalan nomor surat ini..."
                value={alasanBatal}
                onChange={(e) => setAlasanBatal(e.target.value)}
              />
            </div>
          </div>
        }
        confirmText="Ya, Batalkan Nomor"
        cancelText="Tutup"
        variant="danger"
        isLoading={submittingCancel}
      />
    </div>
  );
}
