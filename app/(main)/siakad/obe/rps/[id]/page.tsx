'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import {
  ArrowLeft,
  Edit2,
  FileText,
  Printer,
  CalendarDays,
  Award,
  Library,
  Layers,
  BookOpen,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Loader2,
} from 'lucide-react';
import { siakadService } from '@/services/siakad.service';
import { useAuth } from '@/hooks/useAuth';
import { RpsMkBanner, RpsCplCpmkTabs } from '@/components/siakad/RpsFormShared';
import toast from 'react-hot-toast';

export default function DetailRpsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromParam = searchParams.get('from');
  const backUrl = fromParam || '/siakad/obe/rps/kelola';
  const fromQuery = fromParam ? `?from=${encodeURIComponent(fromParam)}` : '';
  const editUrl = `/siakad/obe/rps/${params?.id}/edit${fromQuery}`;
  const cetakUrl = `/siakad/obe/rps/${params?.id}/cetak${fromQuery}`;
  const rpsId = Number(params?.id);

  const [loading, setLoading] = useState(true);
  const [rps, setRps] = useState<any | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Sesi Pertemuan List & Pagination
  const [sesiList, setSesiList] = useState<any[]>([]);
  const [loadingSesi, setLoadingSesi] = useState(false);
  const [sesiPage, setSesiPage] = useState(1);
  const [sesiLimit, setSesiLimit] = useState(16);
  const [sesiMeta, setSesiMeta] = useState<any>(null);

  // Approval / Rejection states
  const [isApproving, setIsApproving] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [catatanRevisi, setCatatanRevisi] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const { user, hasPermission } = useAuth();

  const fetchRpsDetail = useCallback(async () => {
    if (!rpsId) return;
    try {
      setLoading(true);
      const res = await siakadService.showRps(rpsId);
      const data = res?.data;
      if (!data) {
        setNotFound(true);
      } else {
        setRps(data);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [rpsId]);

  const fetchSesiList = useCallback(async () => {
    if (!rpsId) return;
    try {
      setLoadingSesi(true);
      const res = await siakadService.listRpsSesi(rpsId, {
        page: sesiPage,
        per_page: sesiLimit,
      });
      const raw = res?.data;
      setSesiList(Array.isArray(raw) ? raw : (raw?.items || raw?.data || []));
      setSesiMeta(res?.meta || null);
    } catch {
      // Abaikan error minor sesi
    } finally {
      setLoadingSesi(false);
    }
  }, [rpsId, sesiPage, sesiLimit]);

  useEffect(() => {
    fetchRpsDetail();
  }, [fetchRpsDetail]);

  useEffect(() => {
    fetchSesiList();
  }, [fetchSesiList]);

  // Evaluasi Hak Akses Review / Approve
  const canApprove = useMemo(() => {
    if (!rps) return false;
    let allowed = hasPermission
      ? hasPermission('siakad.obe.rps.approve') ||
        hasPermission('siakad.obe.rps.review') ||
        hasPermission('siakad.master.manage') ||
        hasPermission('siakad.kurikulum.manage')
      : false;

    if (!allowed) {
      const mkProdiId =
        rps.mata_kuliah?.kurikulum?.program_studi_id ||
        rps.mataKuliah?.kurikulum?.program_studi_id ||
        rps.kurikulum?.program_studi_id ||
        rps.mata_kuliah?.program_studi_id;

      const adminProdis =
        (user as any)?.siakad_admin_prodis || (user as any)?.siakadAdminProdis || [];
      if (adminProdis.length > 0 && mkProdiId) {
        const assigned = adminProdis.find(
          (ap: any) =>
            Number(ap.program_studi_id) === Number(mkProdiId) &&
            (ap.can_approve_rps === true || ap.can_approve_rps === 1)
        );
        if (assigned) allowed = true;
      }

      if (!allowed) {
        const kaprodi = rps.kaprodi;
        if (
          kaprodi &&
          (kaprodi.id === user?.id ||
            kaprodi.user_id === user?.id ||
            (user as any)?.dosen?.id === kaprodi.id)
        ) {
          allowed = true;
        }
      }
    }
    return allowed;
  }, [rps, user, hasPermission]);

  const handleApprove = async () => {
    if (!rps) return;
    try {
      setSubmittingReview(true);
      await siakadService.approveRps(rps.id, { status: 'disetujui' });
      toast.success('Dokumen RPS berhasil disetujui (Approved)');
      setIsApproving(false);
      fetchRpsDetail();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyetujui dokumen RPS');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleReject = async () => {
    if (!rps) return;
    if (!catatanRevisi.trim()) {
      toast.error('Catatan revisi wajib diisi');
      return;
    }
    try {
      setSubmittingReview(true);
      await siakadService.approveRps(rps.id, {
        status: 'revisi',
        catatan_revisi: catatanRevisi.trim(),
      });
      toast.success('Dokumen RPS dikembalikan untuk revisi');
      setShowRejectModal(false);
      setCatatanRevisi('');
      fetchRpsDetail();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal mengembalikan dokumen RPS');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Parsing Pustaka
  const pustakaList = useMemo(() => {
    if (!rps) return [];
    const list: { id: number; jenis: string; isi: string }[] = [];
    let counter = 1;

    if (rps.pustaka_utama) {
      rps.pustaka_utama
        .split('\n')
        .map((p: string) => p.trim())
        .filter(Boolean)
        .forEach((isi: string) => {
          list.push({ id: counter++, jenis: 'utama', isi });
        });
    }

    if (rps.pustaka_pendukung) {
      rps.pustaka_pendukung
        .split('\n')
        .map((p: string) => p.trim())
        .filter(Boolean)
        .forEach((isi: string) => {
          list.push({ id: counter++, jenis: 'pendukung', isi });
        });
    }

    return list;
  }, [rps]);

  // Parsing Sub-CPMK
  const subCpmkList = useMemo(() => {
    const list: any[] = [];
    const cpmks: any[] = rps?.mata_kuliah?.cpmks || rps?.mataKuliah?.cpmks || [];

    cpmks.forEach((cpmk: any) => {
      (cpmk.sub_cpmks || cpmk.subCpmks || []).forEach((sub: any) => {
        list.push({
          id: sub.id,
          kode_cpmk: cpmk.kode_cpmk || `CPMK #${cpmk.id}`,
          cpmk_deskripsi: cpmk.deskripsi,
          deskripsi: sub.deskripsi || sub.uraian,
        });
      });
    });

    return list;
  }, [rps]);

  // CPL & CPMK Rows untuk Tab Kanan
  const cplRows = useMemo(() => {
    const directCpls = rps?.mata_kuliah?.cpls || rps?.mataKuliah?.cpls || [];
    if (directCpls.length > 0) return directCpls;

    const seen = new Set<number>();
    const extracted: any[] = [];
    const cpmkProdis = rps?.mata_kuliah?.cpmk_prodis || rps?.mataKuliah?.cpmkProdis || [];
    cpmkProdis.forEach((cp: any) => {
      if (cp.cpl && !seen.has(cp.cpl.id)) {
        seen.add(cp.cpl.id);
        extracted.push(cp.cpl);
      }
    });
    return extracted;
  }, [rps]);

  const cpmkRows = useMemo(() => {
    const direct = rps?.mata_kuliah?.cpmks || rps?.mataKuliah?.cpmks || [];
    if (direct.length > 0) return direct;
    return rps?.mata_kuliah?.cpmk_prodis || rps?.mataKuliah?.cpmkProdis || [];
  }, [rps]);

  const totalBobotSesi = useMemo(() => {
    return sesiList.reduce((sum, item) => sum + (Number(item.bobot_penilaian) || 0), 0);
  }, [sesiList]);

  // Kolom Pustaka
  const pustakaColumns: ColumnDef<any>[] = [
    {
      key: 'jenis',
      label: 'Jenis',
      render: (row) => (
        <span
          className={`text-2xs font-bold px-2 py-0.5 rounded uppercase ${
            row.jenis === 'utama'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          {row.jenis}
        </span>
      ),
    },
    {
      key: 'isi',
      label: 'Referensi / Judul',
      render: (row) => <span className="text-xs text-slate-800">{row.isi}</span>,
    },
  ];

  // Kolom Sub-CPMK
  const subCpmkColumns: ColumnDef<any>[] = [
    {
      key: 'kode_cpmk',
      label: 'CPMK Induk',
      render: (row) => (
        <span
          className="font-mono text-2xs font-bold px-2 py-0.5 rounded"
          style={{ background: 'var(--module-primary-subtle)', color: 'var(--module-primary)' }}
        >
          {row.kode_cpmk}
        </span>
      ),
    },
    {
      key: 'deskripsi',
      label: 'Rumusan Kemampuan Akhir (Sub-CPMK)',
      render: (row) => <span className="text-xs text-slate-800">{row.deskripsi}</span>,
    },
  ];

  // Kolom Sesi Pertemuan
  const sesiColumns: ColumnDef<any>[] = [
    {
      key: 'minggu_ke',
      label: 'Minggu Ke',
      align: 'center',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-slate-900 block text-center">
          {row.minggu_ke}
        </span>
      ),
    },
    {
      key: 'kemampuan_akhir',
      label: 'Kemampuan Akhir (Sub-CPMK)',
      render: (row) => {
        const sub = row.sub_cpmk || row.subCpmk;
        return (
          <div className="text-xs text-slate-800 leading-snug">
            {sub ? (
              <span>{sub.deskripsi || sub.uraian}</span>
            ) : (
              <span className="text-slate-400 italic">Belum dikaitkan</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'indikator',
      label: 'Indikator',
      render: (row) => (
        <span className="text-2xs text-slate-700 block leading-snug">
          {row.indikator_penilaian || '-'}
        </span>
      ),
    },
    {
      key: 'kriteria_teknik',
      label: 'Kriteria & Teknik',
      render: (row) => (
        <span className="text-2xs text-slate-700 block leading-snug">
          {row.kriteria_teknik_penilaian || '-'}
        </span>
      ),
    },
    {
      key: 'materi',
      label: 'Materi Pembelajaran',
      render: (row) => (
        <span className="text-2xs text-slate-700 block leading-snug">
          {row.materi_pembelajaran || '-'}
        </span>
      ),
    },
    {
      key: 'bobot',
      label: 'Bobot (%)',
      align: 'center',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-slate-900 text-center block">
          {row.bobot_penilaian ? `${row.bobot_penilaian}%` : '0%'}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Detail Dokumen RPS"
          description="Memuat data dokumen RPS..."
          breadcrumbs={[
            { label: 'Portal SSO', href: '/dashboard' },
            { label: 'SIAKAD', href: '/siakad' },
            { label: 'RPS', href: backUrl },
            { label: 'Detail' },
          ]}
        />
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <Loader2 size={16} className="animate-spin text-slate-400" />
          <span className="text-xs text-slate-500">Memuat rincian dokumen RPS...</span>
        </div>
      </div>
    );
  }

  if (notFound || !rps) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Detail Dokumen RPS"
          description="Dokumen RPS tidak ditemukan atau tidak dapat diakses."
          breadcrumbs={[
            { label: 'Portal SSO', href: '/dashboard' },
            { label: 'SIAKAD', href: '/siakad' },
            { label: 'RPS', href: backUrl },
            { label: 'Detail' },
          ]}
          action={
            <Button
              variant="outline"
              icon={<ArrowLeft size={16} />}
              onClick={() => router.push(backUrl)}
              style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
            >
              Kembali
            </Button>
          }
        />
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-sm text-slate-500">
            Dokumen RPS dengan ID <span className="font-mono font-bold">{rpsId || '-'}</span> tidak ditemukan.
          </p>
        </div>
      </div>
    );
  }

  const selectedMk = rps.mata_kuliah || rps.mataKuliah;
  const status = rps.status || 'draft';
  const dosenAnggotas: any[] = Array.isArray(rps.dosen_anggotas) ? rps.dosen_anggotas : [];

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title={`RPS: ${selectedMk?.nama || 'Mata Kuliah'}`}
        description={`Kode RPS: ${rps.kode_rps || '-'} • Semester ${rps.semester || selectedMk?.semester_anjuran || 1} • Tahun Ajaran ${rps.tahun_ajaran || '-'}`}
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'RPS', href: backUrl },
          { label: 'Detail' },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<ArrowLeft size={16} />}
              onClick={() => router.push(backUrl)}
              style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
            >
              Kembali
            </Button>
            <Button
              variant="outline"
              icon={<Printer size={16} />}
              onClick={() => window.open(cetakUrl, '_blank')}
            >
              Cetak RPS
            </Button>
            <Button
              variant="secondary"
              icon={<Edit2 size={16} />}
              onClick={() => router.push(editUrl)}
            >
              Edit RPS
            </Button>
            {canApprove && (
              <>
                <Button
                  variant="outline"
                  icon={<XCircle size={16} className="text-amber-600" />}
                  onClick={() => {
                    setCatatanRevisi(rps.catatan_revisi || '');
                    setShowRejectModal(true);
                  }}
                  className="border-amber-300 text-amber-700 hover:bg-amber-50"
                >
                  Revisi
                </Button>
                <Button
                  variant="primary"
                  icon={<CheckCircle size={16} />}
                  onClick={() => setIsApproving(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Approve
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Banner Notifikasi Status RPS */}
      <div className="rounded-xl border p-4 transition-all">
        {status === 'disetujui' || status === 'approved' ? (
          <div className="flex items-start gap-3 text-emerald-800 bg-emerald-50/60 -m-4 p-4 rounded-xl">
            <CheckCircle size={20} className="text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs uppercase px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded">
                  Disetujui (Approved)
                </span>
                {rps.disetujui_at && (
                  <span className="text-2xs text-emerald-700">
                    diverifikasi pada {new Date(rps.disetujui_at).toLocaleString('id-ID')}
                  </span>
                )}
              </div>
              <p className="text-2xs text-emerald-700 mt-1">
                Dokumen RPS ini telah diverifikasi dan disahkan sebagai acuan pembelajaran perkuliahan aktif.
              </p>
            </div>
          </div>
        ) : status === 'revisi' ? (
          <div className="flex items-start gap-3 text-amber-800 bg-amber-50/70 -m-4 p-4 rounded-xl border border-amber-200">
            <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-xs uppercase px-2 py-0.5 bg-amber-200 text-amber-900 rounded">
                Perlu Revisi
              </span>
              <p className="text-xs font-semibold text-amber-900 mt-1.5">
                Catatan dari Pimpinan / Verifikator:
              </p>
              <div className="text-xs text-amber-800 bg-white/70 p-2.5 rounded-lg border border-amber-200 mt-1 italic whitespace-pre-wrap">
                {rps.catatan_revisi || 'Belum ada rincian catatan revisi tertulis.'}
              </div>
            </div>
          </div>
        ) : status === 'diajukan' ? (
          <div className="flex items-start gap-3 text-blue-800 bg-blue-50/60 -m-4 p-4 rounded-xl">
            <Clock size={20} className="text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-xs uppercase px-2 py-0.5 bg-blue-200 text-blue-900 rounded">
                Menunggu Persetujuan (Diajukan)
              </span>
              <p className="text-2xs text-blue-700 mt-1">
                Dokumen telah diajukan ke Ketua Program Studi / Tim Penjaminan Mutu OBE untuk peninjauan.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 text-slate-700 bg-slate-50 -m-4 p-4 rounded-xl">
            <FileText size={20} className="text-slate-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-xs uppercase px-2 py-0.5 bg-slate-200 text-slate-800 rounded">
                Draft
              </span>
              <p className="text-2xs text-slate-500 mt-1">
                Dokumen RPS masih dalam tahap penyusunan dan belum disahkan secara formal.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: 8 Kolom (Form Konten Read-Only RPS) */}
        <div className="lg:col-span-8 space-y-6">
          {/* CARD 1: Rincian RPS & Pengesahan */}
          <Card>
            <CardBody className="space-y-6">
              {/* Header Dokumen */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                  <FileText size={16} className="text-slate-600" style={{ color: 'var(--module-primary)' }} />
                  <h3 className="text-xs font-bold text-slate-900">Informasi Dokumen RPS</h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-2xs text-slate-400 block font-semibold uppercase">Kode RPS</span>
                    <span className="font-mono font-bold text-slate-800">{rps.kode_rps || '-'}</span>
                  </div>
                  <div>
                    <span className="text-2xs text-slate-400 block font-semibold uppercase">Tgl Penyusunan</span>
                    <span className="text-slate-800 font-medium">
                      {rps.tanggal_penyusunan
                        ? new Date(rps.tanggal_penyusunan).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-2xs text-slate-400 block font-semibold uppercase">Semester RPS</span>
                    <span className="text-slate-800 font-bold">Semester {rps.semester || 1}</span>
                  </div>
                  <div>
                    <span className="text-2xs text-slate-400 block font-semibold uppercase">Izin Edit Dosen</span>
                    <span
                      className={`text-2xs font-bold px-2 py-0.5 rounded ${
                        rps.dosen_bisa_edit
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {rps.dosen_bisa_edit ? 'Diizinkan' : 'Terkunci'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Prasyarat & Pembelajaran */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Layers size={16} className="text-slate-600" style={{ color: 'var(--module-primary)' }} />
                  <h3 className="text-xs font-bold text-slate-900">Prasyarat & Model Pembelajaran</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-2xs text-slate-400 block font-semibold uppercase">Mata Kuliah Syarat</span>
                    <span className="text-slate-800 font-medium">{rps.mata_kuliah_syarat || '-'}</span>
                  </div>
                  <div>
                    <span className="text-2xs text-slate-400 block font-semibold uppercase">Jenis Pembelajaran</span>
                    <span className="text-slate-800 font-semibold">{rps.jenis_pembelajaran || 'Kuliah / Responsi'}</span>
                  </div>
                </div>
              </div>

              {/* Deskripsi & Pokok Bahasan */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <BookOpen size={16} className="text-slate-600" style={{ color: 'var(--module-primary)' }} />
                  <h3 className="text-xs font-bold text-slate-900">Deskripsi Singkat & Bahan Kajian</h3>
                </div>

                <div className="space-y-3 text-xs leading-relaxed">
                  <div>
                    <span className="text-2xs text-slate-400 block font-semibold uppercase mb-1">Deskripsi Singkat MK</span>
                    <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/70 text-slate-700 whitespace-pre-wrap">
                      {rps.deskripsi_singkat || <span className="text-slate-400 italic">Belum ada deskripsi singkat.</span>}
                    </div>
                  </div>

                  <div>
                    <span className="text-2xs text-slate-400 block font-semibold uppercase mb-1">Bahan Kajian MK</span>
                    <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/70 text-slate-700 whitespace-pre-wrap">
                      {rps.bahan_kajian_mk || <span className="text-slate-400 italic">Belum ada rincian bahan kajian.</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pengesahan */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Users size={16} className="text-slate-600" style={{ color: 'var(--module-primary)' }} />
                  <h3 className="text-xs font-bold text-slate-900">Pengesahan Dokumen RPS</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100">
                    <span className="text-2xs text-slate-400 block font-semibold uppercase">Dosen Pengembang</span>
                    <span className="text-slate-800 font-bold block mt-1">
                      {rps.dosen_pengembang?.nama_lengkap ||
                        rps.dosen_pengembang?.nama ||
                        rps.dosenPengembang?.nama_lengkap ||
                        rps.dosenPengembang?.nama ||
                        '-'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100">
                    <span className="text-2xs text-slate-400 block font-semibold uppercase">Koordinator RMK</span>
                    <span className="text-slate-800 font-bold block mt-1">
                      {rps.koordinator_rmk?.nama_lengkap ||
                        rps.koordinator_rmk?.nama ||
                        rps.koordinatorRmk?.nama_lengkap ||
                        rps.koordinatorRmk?.nama ||
                        '-'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100">
                    <span className="text-2xs text-slate-400 block font-semibold uppercase">Ketua Program Studi</span>
                    <span className="text-slate-800 font-bold block mt-1">
                      {rps.kaprodi?.nama_lengkap || rps.kaprodi?.nama || '-'}
                    </span>
                  </div>
                </div>

                {dosenAnggotas.length > 0 && (
                  <div className="pt-2">
                    <span className="text-2xs text-slate-400 block font-semibold uppercase">Dosen Anggota Tim:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {dosenAnggotas.map((d: any) => (
                        <span key={d.id} className="text-2xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium">
                          {d.nama_lengkap || d.nama}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* CARD 2: Pustaka */}
          <Card>
            <CardBody className="space-y-4">
              <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                <Library size={16} className="text-slate-600" style={{ color: 'var(--module-primary)' }} />
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Pustaka & Referensi</h3>
                  <p className="text-2xs text-slate-500">Buku acuan utama dan literatur pendukung mata kuliah.</p>
                </div>
              </div>

              <DataTable
                columns={pustakaColumns}
                data={pustakaList}
                isLoading={false}
                emptyMessage="Belum ada pustaka acuan yang ditambahkan pada RPS ini."
              />
            </CardBody>
          </Card>

          {/* CARD 3: Sub-CPMK */}
          <Card>
            <CardBody className="space-y-4">
              <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                <Award size={16} className="text-slate-600" style={{ color: 'var(--module-primary)' }} />
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Kemampuan Akhir Tiap Tahapan Belajar (Sub-CPMK)</h3>
                  <p className="text-2xs text-slate-500">Jabaran capaian pembelajaran mata kuliah per tahap materi.</p>
                </div>
              </div>

              <DataTable
                columns={subCpmkColumns}
                data={subCpmkList}
                isLoading={false}
                emptyMessage="Belum ada Sub-CPMK yang dipetakan pada mata kuliah ini."
              />
            </CardBody>
          </Card>

          {/* CARD 4: Sesi Pertemuan Mingguan */}
          <Card>
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CalendarDays size={16} className="text-slate-600" style={{ color: 'var(--module-primary)' }} />
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Rencana Pembelajaran Tiap Pertemuan (Sesi Mingguan)</h3>
                    <p className="text-2xs text-slate-500">Silabus 16 pertemuan kuliah, metode, materi, dan instrumen asesmen.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-2xs font-bold text-slate-500 uppercase">Total Bobot:</span>
                  <span
                    className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
                      Math.abs(totalBobotSesi - 100) < 0.01
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {Math.round(totalBobotSesi * 100) / 100}%
                  </span>
                </div>
              </div>

              <DataTable
                columns={sesiColumns}
                data={sesiList}
                isLoading={loadingSesi}
                meta={sesiMeta}
                onPageChange={setSesiPage}
                onLimitChange={(l) => {
                  setSesiLimit(l);
                  setSesiPage(1);
                }}
                emptyMessage="Belum ada sesi pertemuan mingguan yang dirancang."
              />
            </CardBody>
          </Card>
        </div>

        {/* Kolom Kanan: 4 Kolom (Sidebar Sticky Info Mata Kuliah & OBE) */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
          <Card>
            <CardBody className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-900">Identitas Mata Kuliah</h3>
                <span className="text-2xs text-slate-400 font-medium">Read-Only</span>
              </div>
              <RpsMkBanner mk={selectedMk} />
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-900">Pemetaan CPL & CPMK</h3>
                <span className="text-2xs text-slate-400 font-medium">Kurikulum OBE</span>
              </div>
              <RpsCplCpmkTabs cplRows={cplRows} cpmkRows={cpmkRows} />
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Modal Dialog Approve RPS */}
      <ConfirmDialog
        isOpen={isApproving}
        onClose={() => setIsApproving(false)}
        onConfirm={handleApprove}
        title="Setujui Dokumen RPS?"
        message={`Apakah Anda yakin ingin menyetujui (Approve) RPS untuk mata kuliah ${selectedMk?.nama || ''} (${selectedMk?.kode_mk || ''})?`}
        confirmText="Setujui (Approve)"
        cancelText="Batal"
        isLoading={submittingReview}
      />

      {/* Modal Dialog Revisi RPS */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setCatatanRevisi('');
        }}
        title="Kembalikan RPS untuk Revisi"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowRejectModal(false);
                setCatatanRevisi('');
              }}
              disabled={submittingReview}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              isLoading={submittingReview}
            >
              Kirim Revisi
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Berikan catatan evaluasi perbaikan untuk dokumen RPS ini. Dokumen akan berstatus Revisi dan dikembalikan kepada Dosen Pengembang.
          </p>
          <Textarea
            label="Catatan Revisi RPS *"
            placeholder="Tuliskan poin-poin yang perlu diperbaiki oleh tim penyusun..."
            value={catatanRevisi}
            onChange={(e) => setCatatanRevisi(e.target.value)}
            rows={4}
          />
        </div>
      </Modal>
    </div>
  );
}
