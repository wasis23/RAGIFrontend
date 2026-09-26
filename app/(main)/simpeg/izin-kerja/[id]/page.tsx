'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  FileText,
  Download,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { simpegIzinKerjaService } from '@/services/simpeg.izin-sk.service';
import { useAuth } from '@/hooks/useAuth';
import { getStorageFileUrl } from '@/lib/utils';
import type { IzinJamKerja, IzinJamKerjaStatus } from '@/types/simpeg.izin-sk.types';

export default function IzinKerjaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params?.id);
  const { user, isAdmin, hasPermission } = useAuth();
  const canApprove = isAdmin || hasPermission('simpeg.izin_kerja.approve');

  const [data, setData] = useState<IzinJamKerja | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Approval modal state
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<'disetujui' | 'ditolak'>('disetujui');
  const [catatanApproval, setCatatanApproval] = useState('');
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await simpegIzinKerjaService.getById(id);
      if (res.status === 'success' && res.data) {
        setData(res.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengambil detail izin');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const renderStatusBadge = (status: IzinJamKerjaStatus) => {
    switch (status) {
      case 'disetujui':
        return <Badge variant="success">Disetujui</Badge>;
      case 'ditolak':
        return <Badge variant="danger">Ditolak</Badge>;
      case 'menunggu':
      default:
        return <Badge variant="warning">Menunggu Approval</Badge>;
    }
  };

  const handleProcessApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setIsSubmittingApproval(true);
    try {
      await simpegIzinKerjaService.approve(id, {
        status: approvalStatus,
        catatan_approval: catatanApproval,
      });

      toast.success(
        approvalStatus === 'disetujui'
          ? 'Izin jam kerja disetujui! Status presensi telah disinkronisasikan otomatis.'
          : 'Izin jam kerja ditolak.'
      );
      setApprovalModalOpen(false);
      fetchDetail();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memproses approval.');
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const decisionOptions = [
    { value: 'disetujui', label: 'Setujui Izin' },
    { value: 'ditolak', label: 'Tolak Izin' },
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
        <p className="text-slate-500">Data pengajuan izin tidak ditemukan.</p>
        <Button
          variant="outline"
          onClick={() => router.push('/simpeg/izin-kerja')}
          className="mt-4"
        >
          Kembali ke Daftar
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-6">
      <PageHeader
        title="Detail Izin Parsial Jam Kerja"
        description={`Rincian pengajuan izin jam kerja atas nama ${data.pegawai?.nama_lengkap || '-'}`}
        action={
          <div className="flex items-center gap-2">
            <Button
              style={{ background: 'var(--module-primary, #3b82f6)' }}
              className="text-white border-none shadow-sm font-bold flex items-center gap-2"
              onClick={() => router.push('/simpeg/cuti?tab=izin-kerja')}
            >
              <ArrowLeft size={16} />
              <span>Kembali ke Cuti & Izin</span>
            </Button>
            {canApprove && data.status === 'menunggu' && (
              <Button
                variant="primary"
                onClick={() => {
                  setApprovalStatus('disetujui');
                  setCatatanApproval('');
                  setApprovalModalOpen(true);
                }}
                className="flex items-center gap-2"
              >
                <Check size={16} />
                <span>Proses Approval</span>
              </Button>
            )}
          </div>
        }
      />

      {/* Grid Informasi Utama */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Kolom Kiri: Rincian Pemohon & Izin */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Rincian Izin Jam Kerja
              </h2>
              <div>{renderStatusBadge(data.status)}</div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-slate-400">Pegawai Pemohon</p>
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
                <p className="text-xs font-medium text-slate-400">Jenis Izin</p>
                <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-white">
                  {data.jenis_izin?.nama}
                </p>
                <p className="text-xs text-slate-500">
                  Tipe: {data.jenis_izin?.tipe_potongan === 'potong_jam' ? 'Potong Jam' : 'Tidak Ada Potongan'}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400">Tanggal Izin</p>
                <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-white">
                  {new Date(data.tanggal).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400">Rentang Waktu</p>
                <p className="mt-1 text-sm font-semibold text-primary-600 dark:text-primary-400">
                  {data.jam_mulai.substring(0, 5)} - {data.jam_selesai.substring(0, 5)} WIB
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400">Diajukan Pada</p>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                  {new Date(data.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              <div className="md:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs font-medium text-slate-400">Alasan / Keperluan</p>
                <p className="mt-1 text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                  {data.alasan}
                </p>
              </div>
            </div>
          </div>

          {/* Berkas Bukti Pendukung */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
              Berkas Lampiran Pendukung
            </h3>
            {data.file_bukti ? (
              <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400">
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                      Berkas Bukti Izin
                    </p>
                    <p className="text-[11px] text-slate-400">Format PDF / Gambar</p>
                  </div>
                </div>
                <a
                  href={data.file_bukti_url || getStorageFileUrl(data.file_bukti)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Download size={14} />
                  <span>Lihat / Unduh</span>
                </a>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Tidak ada berkas bukti yang dilampirkan pada pengajuan izin ini.
              </p>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Status Approval & Presensi */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-200 pb-3 dark:border-slate-800">
              Riwayat Persetujuan
            </h3>

            <div className="mt-4 space-y-4 text-xs">
              <div>
                <p className="text-slate-400">Status Pengajuan</p>
                <div className="mt-1">{renderStatusBadge(data.status)}</div>
              </div>

              {data.approver && (
                <div>
                  <p className="text-slate-400">Diproses Oleh</p>
                  <p className="mt-0.5 font-medium text-slate-800 dark:text-white">
                    {data.approver.name}
                  </p>
                </div>
              )}

              {data.approved_at && (
                <div>
                  <p className="text-slate-400">Waktu Approval</p>
                  <p className="mt-0.5 text-slate-700 dark:text-slate-300">
                    {new Date(data.approved_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}

              {data.catatan_approval && (
                <div>
                  <p className="text-slate-400">Catatan Pertimbangan</p>
                  <p className="mt-0.5 rounded-lg bg-slate-50 p-2 text-slate-700 italic dark:bg-slate-800 dark:text-slate-300">
                    &ldquo;{data.catatan_approval}&rdquo;
                  </p>
                </div>
              )}

              <div className="rounded-lg bg-primary-50/50 p-3 text-[11px] text-primary-700 dark:bg-primary-950/20 dark:text-primary-300">
                <p className="font-semibold">Integrasi Presensi Otomatis:</p>
                <p className="mt-0.5">
                  Izin yang disetujui langsung melegitimasi kehadiran pada sistem presensi harian pegawai.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Approval */}
      <Modal
        isOpen={approvalModalOpen}
        onClose={() => setApprovalModalOpen(false)}
        title="Proses Approval Izin Jam Kerja"
      >
        <form onSubmit={handleProcessApproval} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Keputusan Approval <span className="text-rose-500">*</span>
            </label>
            <Select
              options={decisionOptions}
              value={approvalStatus}
              onChange={(val: any) => setApprovalStatus(val)}
              className="mt-1 w-full"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Catatan Approval
            </label>
            <Input
              type="text"
              placeholder="Tambahkan catatan pertimbangan..."
              value={catatanApproval}
              onChange={(e) => setCatatanApproval(e.target.value)}
              className="mt-1 w-full"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setApprovalModalOpen(false)}
              disabled={isSubmittingApproval}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmittingApproval}
            >
              {isSubmittingApproval ? 'Memproses...' : 'Simpan Keputusan'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
