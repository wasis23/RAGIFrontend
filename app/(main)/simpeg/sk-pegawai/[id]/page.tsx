'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ShieldCheck,
  Download,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { simpegSkPegawaiService } from '@/services/simpeg.izin-sk.service';
import { useAuth } from '@/hooks/useAuth';
import type { SkPegawai, SkVerifikasiStatus } from '@/types/simpeg.izin-sk.types';

export default function SkPegawaiDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params?.id);
  const { user, isAdmin, hasPermission } = useAuth();
  const canVerify = isAdmin || hasPermission('simpeg.sk_pegawai.verify');

  const [data, setData] = useState<SkPegawai | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verification modal state
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifikasiStatus, setVerifikasiStatus] = useState<'terverifikasi' | 'ditolak'>('terverifikasi');
  const [catatanVerifikasi, setCatatanVerifikasi] = useState('');
  const [isSubmittingVerify, setIsSubmittingVerify] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await simpegSkPegawaiService.getById(id);
      if (res.status === 'success' && res.data) {
        setData(res.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memuat detail SK pegawai');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const renderStatusBadge = (status: SkVerifikasiStatus) => {
    switch (status) {
      case 'terverifikasi':
        return <Badge variant="success">Terverifikasi</Badge>;
      case 'ditolak':
        return <Badge variant="danger">Ditolak</Badge>;
      case 'pending':
      default:
        return <Badge variant="warning">Menunggu Verifikasi</Badge>;
    }
  };

  const handleProcessVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setIsSubmittingVerify(true);
    try {
      await simpegSkPegawaiService.verify(id, {
        status_verifikasi: verifikasiStatus,
        catatan_verifikasi: catatanVerifikasi,
      });

      toast.success(
        verifikasiStatus === 'terverifikasi'
          ? 'Berkas SK berhasil diverifikasi sah oleh Tim SDM.'
          : 'Laporan SK ditolak.'
      );
      setVerifyModalOpen(false);
      fetchDetail();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memproses verifikasi SK.');
    } finally {
      setIsSubmittingVerify(false);
    }
  };

  const verifyDecisionOptions = [
    { value: 'terverifikasi', label: 'Verifikasi Sah (Terverifikasi)' },
    { value: 'ditolak', label: 'Tolak Dokumen SK' },
  ];

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
        <p className="text-slate-500">Data arsip SK pegawai tidak ditemukan.</p>
        <Button
          variant="outline"
          onClick={() => router.push('/simpeg/sk-pegawai')}
          className="mt-4"
        >
          Kembali ke Repositori
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-6">
      <PageHeader
        title="Detail Arsip SK Pegawai"
        description={`Dokumen ketetapan resmi Nomor ${data.nomor_sk}`}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push('/simpeg/sk-pegawai')}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              <span>Kembali</span>
            </Button>
            {canVerify && data.status_verifikasi === 'pending' && (
              <Button
                variant="primary"
                onClick={() => {
                  setVerifikasiStatus('terverifikasi');
                  setCatatanVerifikasi('');
                  setVerifyModalOpen(true);
                }}
                className="flex items-center gap-2"
              >
                <ShieldCheck size={16} />
                <span>Verifikasi Berkas</span>
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Kolom Kiri: Detail SK & Dokumen */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Informasi Dokumen SK
              </h2>
              <div>{renderStatusBadge(data.status_verifikasi)}</div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-slate-400">Nomor SK</p>
                <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                  {data.nomor_sk}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400">Kategori Dokumen</p>
                <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-white">
                  {data.kategori_sk?.nama || '-'}
                </p>
              </div>

              <div className="md:col-span-2">
                <p className="text-xs font-medium text-slate-400">Judul / Ketetapan SK</p>
                <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-200">
                  {data.judul_sk}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400">Pegawai Pemilik</p>
                <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-white">
                  {data.pegawai?.nama_lengkap}
                </p>
                <p className="text-xs text-slate-500">
                  {data.pegawai?.nip ? `NIP: ${data.pegawai.nip}` : data.pegawai?.nidn ? `NIDN: ${data.pegawai.nidn}` : ''}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400">Unit Kerja</p>
                <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-white">
                  {data.pegawai?.unit_kerja?.nama || 'SDM'}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400">Pejabat Penetap</p>
                <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">
                  {data.pejabat_penetap}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400">Tanggal Penetapan SK</p>
                <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">
                  {new Date(data.tanggal_sk).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400">TMT Mulai</p>
                <p className="mt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  {new Date(data.tmt_sk).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400">TMT Selesai</p>
                <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">
                  {data.tmt_selesai
                    ? new Date(data.tmt_selesai).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : 'Berlaku Seterusnya'}
                </p>
              </div>

              {data.keterangan && (
                <div className="md:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-medium text-slate-400">Catatan Tambahan</p>
                  <p className="mt-1 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line">
                    {data.keterangan}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Unduhan Berkas SK */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
              Dokumen Pindaian Asli SK
            </h3>
            <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                    Berkas Pindaian SK (PDF)
                  </p>
                  <p className="text-[11px] text-slate-400">Arsip Digital Kepegawaian</p>
                </div>
              </div>
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/${data.file_sk}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Download size={14} />
                <span>Unduh / Buka PDF</span>
              </a>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Status Verifikasi SDM */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-200 pb-3 dark:border-slate-800">
              Status Verifikasi SDM
            </h3>

            <div className="mt-4 space-y-4 text-xs">
              <div>
                <p className="text-slate-400">Status Keabsahan</p>
                <div className="mt-1">{renderStatusBadge(data.status_verifikasi)}</div>
              </div>

              {data.verifier && (
                <div>
                  <p className="text-slate-400">Diverifikasi Oleh</p>
                  <p className="mt-0.5 font-medium text-slate-800 dark:text-white">
                    {data.verifier.name}
                  </p>
                </div>
              )}

              {data.verified_at && (
                <div>
                  <p className="text-slate-400">Waktu Verifikasi</p>
                  <p className="mt-0.5 text-slate-700 dark:text-slate-300">
                    {new Date(data.verified_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}

              {data.catatan_verifikasi && (
                <div>
                  <p className="text-slate-400">Catatan Verifikator</p>
                  <p className="mt-0.5 rounded-lg bg-slate-50 p-2 text-slate-700 italic dark:bg-slate-800 dark:text-slate-300">
                    &ldquo;{data.catatan_verifikasi}&rdquo;
                  </p>
                </div>
              )}

              <div className="rounded-lg bg-primary-50/50 p-3 text-[11px] text-primary-700 dark:bg-primary-950/20 dark:text-primary-300">
                <p className="font-semibold">Portofolio & Rekam Jejak:</p>
                <p className="mt-0.5">
                  SK yang terverifikasi menjadi basis rekam jejak resmi untuk kebutuhan Beban Kerja Dosen (BKD), Laporan Kinerja Dosen (LKD), akreditasi program studi, dan remunerasi.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Verifikasi */}
      <Modal
        isOpen={verifyModalOpen}
        onClose={() => setVerifyModalOpen(false)}
        title="Verifikasi Dokumen SK Pegawai"
      >
        <form onSubmit={handleProcessVerify} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Hasil Verifikasi <span className="text-rose-500">*</span>
            </label>
            <Select
              options={verifyDecisionOptions}
              value={verifikasiStatus}
              onChange={(val: any) => setVerifikasiStatus(val)}
              className="mt-1 w-full"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Catatan Verifikator SDM
            </label>
            <Input
              type="text"
              placeholder="Berikan alasan atau catatan verifikasi..."
              value={catatanVerifikasi}
              onChange={(e) => setCatatanVerifikasi(e.target.value)}
              className="mt-1 w-full"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setVerifyModalOpen(false)}
              disabled={isSubmittingVerify}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmittingVerify}
            >
              {isSubmittingVerify ? 'Menyimpan...' : 'Simpan Verifikasi'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
