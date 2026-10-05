'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  Calendar, 
  User, 
  Building2, 
  ExternalLink, 
  AlertCircle,
  Hash,
  ShieldCheck
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select, type SelectOption } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { arsipService } from '@/services/arsip.service';
import { useAuth } from '@/hooks/useAuth';
import { getApiErrorMessage } from '@/lib/utils';
import type { RequestNomorSurat } from '@/types/arsip.types';
import toast from 'react-hot-toast';

export default function DetailRequestNomorPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params?.id);

  const { hasPermission } = useAuth();
  const canApprove = hasPermission('arsip.request.approve');

  const [requestData, setRequestData] = useState<RequestNomorSurat | null>(null);
  const [loading, setLoading] = useState(true);

  // Verification state & classification options
  const [actionType, setActionType] = useState<'setujui' | 'tolak'>('setujui');
  const [catatanVerifikasi, setCatatanVerifikasi] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [submittingVerify, setSubmittingVerify] = useState(false);

  // Form overrides managed by Admin Arsip
  const [kodeKlasifikasi, setKodeKlasifikasi] = useState('');
  const [kodeUnit, setKodeUnit] = useState('');
  const [perihal, setPerihal] = useState('');
  const [tujuan, setTujuan] = useState('');

  // Dropdown options
  const [klasifikasiOptions, setKlasifikasiOptions] = useState<SelectOption[]>([]);
  const [unitOptions, setUnitOptions] = useState<SelectOption[]>([]);

  const fetchDetail = async () => {
    if (!id || isNaN(id)) return;
    try {
      setLoading(true);
      const res = await arsipService.getRequestDetail(id);
      const data = res.data || null;
      setRequestData(data);

      if (data) {
        setKodeKlasifikasi(data.kode_klasifikasi || '');
        setKodeUnit(data.kode_unit || '');
        setPerihal(data.perihal || '');
        setTujuan(data.tujuan || '');
      }
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Gagal memuat rincian permohonan.'));
    } finally {
      setLoading(false);
    }
  };

  const loadOptions = async () => {
    try {
      const [klasifikasiRes, unitRes] = await Promise.all([
        arsipService.getAllKlasifikasi('klasifikasi'),
        arsipService.getAllKlasifikasi('unit'),
      ]);

      setKlasifikasiOptions(
        klasifikasiRes.map((k) => ({
          value: k.kode,
          label: `${k.kode} - ${k.nama}`,
        }))
      );

      setUnitOptions(
        unitRes.map((u) => ({
          value: u.kode,
          label: `${u.kode} - ${u.nama}`,
        }))
      );
    } catch (err) {
      console.error('Gagal memuat master klasifikasi/unit:', err);
    }
  };

  useEffect(() => {
    fetchDetail();
    loadOptions();
  }, [id]);

  const handleOpenConfirm = (type: 'setujui' | 'tolak') => {
    setActionType(type);
    if (type === 'tolak' && !catatanVerifikasi.trim()) {
      toast.error('Silakan isi alasan penolakan pada kolom catatan terlebih dahulu.');
      return;
    }
    if (type === 'setujui') {
      if (!kodeKlasifikasi.trim()) {
        toast.error('Pilih Kode Klasifikasi (DI - DIX) terlebih dahulu.');
        return;
      }
      if (!kodeUnit.trim()) {
        toast.error('Pilih Kode Unit tujuan terlebih dahulu.');
        return;
      }
      if (!perihal.trim()) {
        toast.error('Perihal surat tidak boleh kosong.');
        return;
      }
    }
    setConfirmDialogOpen(true);
  };

  const handleExecuteVerification = async () => {
    if (!requestData) return;
    try {
      setSubmittingVerify(true);
      await arsipService.verifyRequest(requestData.id, {
        action: actionType,
        catatan: catatanVerifikasi,
        kode_klasifikasi: kodeKlasifikasi,
        kode_unit: kodeUnit,
        perihal: perihal,
        tujuan: tujuan,
      });

      toast.success(
        actionType === 'setujui'
          ? 'Permohonan berhasil disetujui dan nomor surat otomatis diterbitkan!'
          : 'Permohonan berhasil ditolak.'
      );

      setConfirmDialogOpen(false);
      fetchDetail();
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Gagal memproses verifikasi permohonan.'));
    } finally {
      setSubmittingVerify(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center p-12 text-slate-500 text-xs">
        Memuat detail permohonan nomor surat...
      </div>
    );
  }

  if (!requestData) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-12 gap-3">
        <p className="text-xs text-slate-600">Permohonan tidak ditemukan.</p>
        <Link href="/arsip/request-nomor">
          <Button variant="outline" size="sm">
            Kembali ke Daftar
          </Button>
        </Link>
      </div>
    );
  }

  const isPending = requestData.status === 'menunggu_verifikasi';
  const isApproved = requestData.status === 'disetujui';
  const isRejected = requestData.status === 'ditolak';

  return (
    <div className="animate-fade-in space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Verifikasi Permohonan Nomor Surat"
        description="Pemeriksaan dan persetujuan penomoran surat resmi yang diajukan oleh modul lain"
        action={
          <Link href="/arsip/request-nomor">
            <Button
              variant="outline"
              size="md"
              className="border-[var(--module-primary)] text-[var(--module-primary)] hover:bg-[var(--module-primary-subtle,#f0fdfa)]"
            >
              <ArrowLeft size={16} className="mr-1.5" />
              Kembali ke Daftar
            </Button>
          </Link>
        }
      />

      {/* Top Banner Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">
              Pengajuan Nomor Surat Lintas Modul
            </span>
            <Badge
              variant={
                isApproved
                  ? 'success'
                  : isRejected
                  ? 'danger'
                  : 'warning'
              }
              className="capitalize text-2xs font-semibold"
            >
              {isApproved ? 'Disetujui' : isRejected ? 'Ditolak' : 'Menunggu Verifikasi'}
            </Badge>
          </div>
          <h2 className="font-mono text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            {requestData.kode_request}
          </h2>
          <p className="text-2xs text-slate-500">
            Modul Asal: <strong className="uppercase text-[var(--module-primary)]">{requestData.module_origin}</strong> • Diajukan pada {new Date(requestData.created_at).toLocaleString('id-ID')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="blue" className="text-xs font-mono py-1.5 px-3">
            Permintaan: {requestData.jumlah_nomor} Nomor
          </Badge>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Detail Permohonan */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 flex items-center gap-2">
            <FileText size={16} className="text-[var(--module-primary)]" />
            Rincian Pengajuan
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block text-2xs uppercase">Perihal Surat</span>
              <p className="font-semibold text-slate-800 text-sm mt-0.5">{requestData.perihal}</p>
            </div>

            <div>
              <span className="text-slate-400 block text-2xs uppercase">Tujuan / Penerima</span>
              <p className="font-medium text-slate-700 mt-0.5">{requestData.tujuan || '-'}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <span className="text-slate-400 block text-2xs uppercase">Tanggal Surat</span>
                <p className="font-medium text-slate-800 mt-0.5">{requestData.tanggal_surat}</p>
              </div>
              <div>
                <span className="text-slate-400 block text-2xs uppercase">Jumlah Nomor</span>
                <p className="font-mono font-bold text-slate-800 mt-0.5">{requestData.jumlah_nomor} Surat</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <span className="text-slate-400 block text-2xs uppercase">Unit Tujuan</span>
                <p className="font-medium text-slate-800 mt-0.5">{requestData.kode_unit}</p>
              </div>
              <div>
                <span className="text-slate-400 block text-2xs uppercase">Klasifikasi</span>
                <p className="font-medium text-slate-800 mt-0.5">{requestData.kode_klasifikasi}</p>
              </div>
            </div>

            {requestData.catatan_pemohon && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 block text-2xs uppercase">Catatan Pemohon</span>
                <p className="text-slate-600 mt-0.5 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  &ldquo;{requestData.catatan_pemohon}&rdquo;
                </p>
              </div>
            )}

            {requestData.dokumen_lampiran_url && (
              <div className="pt-2 border-t border-slate-100">
                <a
                  href={requestData.dokumen_lampiran_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--module-primary)] hover:opacity-80 hover:underline"
                >
                  <ExternalLink size={14} />
                  Lihat / Unduh Dokumen Pendukung (Signed URL)
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Right: Pemohon & Status Verifikasi */}
        <div className="flex flex-col gap-6">
          {/* Card Pemohon */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3 text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 flex items-center gap-2">
              <User size={16} className="text-[var(--module-primary)]" />
              Identitas Pemohon
            </h3>
            <div>
              <span className="text-slate-400 block text-2xs uppercase">Nama Pemohon</span>
              <p className="font-semibold text-slate-800 mt-0.5">{requestData.user?.name || `User #${requestData.user_id}`}</p>
            </div>
            <div>
              <span className="text-slate-400 block text-2xs uppercase">Email Kontak</span>
              <p className="text-slate-600 mt-0.5">{requestData.user?.email || '-'}</p>
            </div>
          </div>

          {/* Verification Box / Status */}
          {isPending && canApprove ? (
            <div className="bg-white border-2 border-[var(--module-primary)]/30 rounded-xl p-5 shadow-sm space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-[var(--module-primary)]" />
                  Otoritas Verifikasi & Klasifikasi Admin Arsip
                </h3>
                <p className="text-2xs text-slate-500 mt-1">
                  Sebagai Admin Arsip, Anda berwenang memvalidasi dan menentukan kode klasifikasi resmi (DI - DIX) serta kode unit sebelum nomor diterbitkan.
                </p>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select
                    label="Kode Klasifikasi (DI - DIX) *"
                    options={klasifikasiOptions}
                    value={kodeKlasifikasi}
                    onChange={(val) => setKodeKlasifikasi(val || '')}
                    placeholder="Pilih Klasifikasi..."
                  />

                  <Select
                    label="Kode Unit Tujuan *"
                    options={unitOptions}
                    value={kodeUnit}
                    onChange={(val) => setKodeUnit(val || '')}
                    placeholder="Pilih Unit..."
                  />
                </div>

                <Input
                  label="Perihal Surat Resmi *"
                  value={perihal}
                  onChange={(e) => setPerihal(e.target.value)}
                  placeholder="Koreksi perihal surat jika diperlukan..."
                />

                <Input
                  label="Tujuan / Penerima (Opsional)"
                  value={tujuan}
                  onChange={(e) => setTujuan(e.target.value)}
                  placeholder="Instansi / Pegawai / Pihak tujuan..."
                />

                <Textarea
                  label="Catatan Verifikasi"
                  placeholder="Berikan catatan persetujuan atau alasan apabila permohonan ditolak..."
                  rows={2}
                  value={catatanVerifikasi}
                  onChange={(e) => setCatatanVerifikasi(e.target.value)}
                />

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                    onClick={() => handleOpenConfirm('tolak')}
                  >
                    <XCircle size={16} className="mr-1.5" />
                    Tolak Pengajuan
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                    onClick={() => handleOpenConfirm('setujui')}
                  >
                    <CheckCircle2 size={16} className="mr-1.5" />
                    Setujui & Terbitkan Nomor
                  </Button>
                </div>
              </div>
            </div>
          ) : isPending ? (
            <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-5 shadow-sm space-y-2 text-xs text-amber-900">
              <h3 className="font-bold flex items-center gap-1.5 text-amber-800">
                <Clock size={16} /> Menunggu Verifikasi Admin Arsip
              </h3>
              <p className="text-2xs text-amber-700">
                Permohonan ini sedang dalam antrean verifikasi oleh unit tata persuratan/arsip.
              </p>
            </div>
          ) : (
            <div className={`border rounded-xl p-5 shadow-sm space-y-3 text-xs ${
              isApproved ? 'bg-emerald-50/50 border-emerald-200' : 'bg-red-50/50 border-red-200'
            }`}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200/60 pb-2 flex items-center gap-2">
                <ShieldCheck size={16} className={isApproved ? 'text-emerald-600' : 'text-red-600'} />
                Hasil Verifikasi
              </h3>
              <div>
                <span className="text-slate-400 block text-2xs uppercase">Diverifikasi Oleh</span>
                <p className="font-semibold text-slate-800 mt-0.5">{requestData.verifikator?.name || 'Admin Arsip'}</p>
              </div>
              <div>
                <span className="text-slate-400 block text-2xs uppercase">Waktu Verifikasi</span>
                <p className="text-slate-600 mt-0.5">
                  {requestData.verified_at ? new Date(requestData.verified_at).toLocaleString('id-ID') : '-'}
                </p>
              </div>
              <div>
                <span className="text-slate-400 block text-2xs uppercase">Catatan Verifikasi</span>
                <p className="text-slate-700 mt-0.5 italic">
                  {requestData.catatan_verifikasi || 'Tidak ada catatan khusus.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Generated Letters Section if Approved */}
      {isApproved && requestData.nomor_surat && requestData.nomor_surat.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Hash size={16} className="text-[var(--module-primary)]" />
            Nomor Surat yang Telah Diterbitkan ({requestData.nomor_surat.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {requestData.nomor_surat.map((num) => (
              <Link
                key={num.id}
                href={`/arsip/nomor-surat/${num.id}`}
                className="p-3 rounded-lg border border-slate-200 hover:border-[var(--module-primary)] hover:bg-[var(--module-primary-subtle,#f0fdfa)]/30 transition-all flex flex-col gap-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xs font-semibold text-slate-400 font-mono">
                    Urut #{num.nomor_urut}
                  </span>
                  <Badge variant="success" className="text-2xs capitalize">
                    {num.status}
                  </Badge>
                </div>
                <span className="font-mono font-bold text-xs text-slate-900">
                  {num.nomor_surat}
                </span>
                <span className="text-2xs text-slate-500 truncate">
                  {num.perihal}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Verification Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={handleExecuteVerification}
        title={actionType === 'setujui' ? 'Setujui Permohonan Nomor Surat' : 'Tolak Permohonan Nomor Surat'}
        message={
          actionType === 'setujui' ? (
            <p className="text-xs text-slate-600">
              Apakah Anda yakin ingin menyetujui permohonan ini? Sistem akan secara otomatis menerbitkan{' '}
              <strong className="text-slate-900">{requestData.jumlah_nomor} nomor surat resmi</strong> sesuai dengan klasifikasi dan tanggal yang diajukan.
            </p>
          ) : (
            <p className="text-xs text-slate-600">
              Apakah Anda yakin ingin menolak permohonan nomor surat dari modul{' '}
              <strong className="text-slate-900 uppercase">{requestData.module_origin}</strong> ini?
            </p>
          )
        }
        confirmText={actionType === 'setujui' ? 'Ya, Setujui Permohonan' : 'Ya, Tolak Permohonan'}
        cancelText="Batal"
        variant={actionType === 'setujui' ? 'primary' : 'danger'}
        isLoading={submittingVerify}
      />
    </div>
  );
}
