'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Printer, AlertTriangle, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { simpegService } from '@/services/simpeg.service';
import type { SuratPeringatan } from '@/types/simpeg.types';
import { formatDate } from '@/lib/utils';

export default function DetailSuratPeringatanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const spId = Number(resolvedParams.id);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [sp, setSp] = useState<SuratPeringatan | null>(null);

  useEffect(() => {
    if (!spId || isNaN(spId)) {
      toast.error('ID surat peringatan tidak valid');
      router.push('/simpeg/presensi');
      return;
    }

    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await simpegService.getSuratPeringatanDetail(spId);
        if (res.status === 'success' && res.data) {
          setSp(res.data);
        } else {
          toast.error('Gagal mengambil data surat peringatan');
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Gagal memuat dokumen resmi surat peringatan');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [spId, router]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dokumen Resmi Surat Peringatan"
        description="Dokumen audit resmi surat peringatan kedisiplinan atas keterlambatan kehadiran pegawai"
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIMPEG', href: '/simpeg' },
          { label: 'Presensi & Jadwal', href: '/simpeg/presensi' },
          { label: sp?.nomor_sp || 'Rincian SP' },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<ArrowLeft size={16} />}
              onClick={() => router.push('/simpeg/presensi')}
              className="text-[var(--module-primary)] border-[var(--module-primary)] hover:bg-[var(--module-primary-subtle)]"
            >
              Kembali
            </Button>
            <Button
              variant="outline"
              icon={<Printer size={16} />}
              onClick={() => window.print()}
            >
              Cetak Dokumen
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <FileText size={48} className="mx-auto mb-3 animate-pulse text-[var(--module-primary)]" />
          <p className="text-xs">Memuat dokumen resmi surat peringatan...</p>
        </div>
      ) : sp ? (
        <div className="max-w-4xl mx-auto p-6 sm:p-8 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-6 text-slate-800">
          {/* Kop Surat Resmi Dinamis */}
          <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
            <h2 className="text-sm font-extrabold tracking-wider uppercase">
              {sp.pegawai?.unit_kerja?.nama ? `DIVISI / UNIT: ${sp.pegawai.unit_kerja.nama}` : 'BAGIAN KEPEGAWAIAN & SDM'}
            </h2>
            <p className="text-xs text-slate-600">
              SISTEM INFORMASI MANAJEMEN PEGAWAI (SIMPEG)
            </p>
            <p className="text-2xs text-slate-500 italic">
              Rekapitulasi Audit Kehadiran Biometrik Terpadu Kampus
            </p>
          </div>

          {/* Nomor & Judul Surat */}
          <div className="text-center space-y-1 py-2">
            <div className="inline-block">
              <Badge variant="red" className="text-xs uppercase font-bold tracking-wide">
                Surat Peringatan Kedisiplinan ({sp.jenis_sp})
              </Badge>
            </div>
            <p className="text-xs font-mono font-semibold text-slate-600">
              Nomor: {sp.nomor_sp}
            </p>
          </div>

          {/* Identitas Pegawai Penerima */}
          <div className="text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
              <span className="text-slate-500 font-medium">Nama Pegawai</span>
              <span className="sm:col-span-2 font-bold text-slate-900">
                {sp.pegawai?.nama_lengkap || '-'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
              <span className="text-slate-500 font-medium">NIP / Identitas</span>
              <span className="sm:col-span-2 font-mono font-semibold text-slate-800">
                {sp.pegawai?.nip || '-'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
              <span className="text-slate-500 font-medium">Unit Kerja / Penempatan</span>
              <span className="sm:col-span-2 text-slate-700">
                {sp.pegawai?.unit_kerja?.nama || 'Unit Kerja Terdaftar'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
              <span className="text-slate-500 font-medium">Periode Keterlambatan</span>
              <span className="sm:col-span-2 font-semibold font-mono text-slate-800">
                {sp.periode_bulan_tahun}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
              <span className="text-slate-500 font-medium">Tanggal Terbit Dokumen</span>
              <span className="sm:col-span-2 font-semibold text-slate-800">
                {formatDate(sp.tanggal_terbit)}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
              <span className="text-slate-500 font-medium">Status Surat</span>
              <span className="sm:col-span-2">
                <Badge variant={sp.status === 'aktif' ? 'red' : 'gray'} className="capitalize text-2xs">
                  {sp.status}
                </Badge>
              </span>
            </div>
          </div>

          {/* Isi Peringatan & Keterangan Audit */}
          <div className="text-xs leading-relaxed space-y-3 text-slate-700">
            <p>
              Berdasarkan hasil audit rekapitulasi kehadiran dan integrasi sistem presensi bulanan kampus, dengan ini Manajemen Sumber Daya Manusia memberikan Surat Peringatan atas pelanggaran ketentuan jam kerja:
            </p>
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-1">
              <div className="font-semibold flex items-center gap-2">
                <AlertTriangle size={16} className="text-rose-600 shrink-0" />
                <span>Pelanggaran Batas Maksimal Keterlambatan</span>
              </div>
              <p className="text-xs">
                Akumulasi keterlambatan presensi tercatat sebanyak{' '}
                <strong className="text-rose-700 font-bold">{sp.total_terlambat} kali</strong>, melampaui batas maksimal kebijakan toleransi yaitu{' '}
                <strong className="text-rose-700 font-bold">{sp.batas_maksimal} kali per bulan</strong>.
              </p>
            </div>
            <p>
              {sp.keterangan ||
                'Harap meningkatkan kedisiplinan dan kepatuhan kehadiran kerja demi kelancaran operasional institusi pendidikan kampus.'}
            </p>
          </div>

          {/* Tanda Tangan Resmi Dinamis */}
          <div className="pt-8 flex flex-col sm:flex-row justify-between text-xs text-slate-600 border-t border-slate-200 gap-6">
            <div>
              <p>Mengetahui,</p>
              <p className="font-semibold mt-14">Pimpinan / Kepala Unit Kerja Terkait</p>
            </div>
            <div className="sm:text-right">
              <p>Diterbitkan tanggal: {formatDate(sp.tanggal_terbit)}</p>
              <p className="font-semibold mt-14">Bagian Kepegawaian (SIMPEG)</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-slate-400 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <p className="text-xs">Data surat peringatan tidak ditemukan.</p>
        </div>
      )}
    </div>
  );
}
