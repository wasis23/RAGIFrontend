'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Download, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { spmbService } from '@/services/spmb.service';
import { TemplateSuratSpmb } from '@/types/spmb.types';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function DetailTemplateSuratPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();

  const [template, setTemplate] = useState<TemplateSuratSpmb | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await spmbService.getTemplateSuratDetail(id);
        if (res.data) {
          setTemplate(res.data);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Gagal memuat detail template surat';
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const handlePreviewPdf = async () => {
    if (!template) return;
    const toastId = toast.loading('Menyiapkan pratinjau dokumen PDF...');
    try {
      const blob = await spmbService.previewTemplateSuratPdf(template.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.download = `Preview-Template-${template.kode}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Pratinjau PDF berhasil diunduh', { id: toastId });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal membuat pratinjau PDF';
      toast.error(message, { id: toastId });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded w-1/3"></div>
        <div className="card p-6 bg-slate-100 h-64 rounded-lg"></div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Detail Template Surat"
          description="Template surat tidak ditemukan"
          action={
            <Button
              variant="outline"
              onClick={() => router.push('/spmb/master/template-surat')}
              style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
              icon={<ArrowLeft size={16} />}
            >
              Kembali
            </Button>
          }
        />
        <div className="card p-6 text-center text-slate-500">
          Data template surat tidak ditemukan atau telah dihapus.
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <PageHeader
        title={`Detail Template: ${template.nama}`}
        description={`Konfigurasi template dokumen ${template.kode}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => router.push('/spmb/master/template-surat')}
              style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
              icon={<ArrowLeft size={16} />}
            >
              Kembali
            </Button>
            <Button
              variant="outline"
              onClick={handlePreviewPdf}
              icon={<Download size={16} />}
              style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
            >
              Pratinjau PDF
            </Button>
            <Button
              onClick={() => router.push(`/spmb/master/template-surat/${template.id}/edit`)}
              icon={<Edit size={16} />}
              style={{ backgroundColor: 'var(--module-primary)' }}
            >
              Edit Template
            </Button>
          </div>
        }
      />

      {/* Grid Informasi Template */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Metadata & Kop */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          <div className="card p-4 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b pb-2">
              Identitas Template
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block text-2xs uppercase">Kode Template</span>
                <span className="font-bold text-slate-800">{template.kode}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-2xs uppercase">Nama Template</span>
                <span className="font-semibold text-slate-800">{template.nama}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-2xs uppercase">Jenis Surat</span>
                <span className="font-semibold text-slate-800 capitalize">
                  {template.jenis_surat?.replace('_', ' ')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-2xs uppercase">Berlaku Untuk Jalur</span>
                <span className="font-semibold text-slate-800">
                  {template.jalur_masuk?.nama || 'Semua Jalur Pendaftaran'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-2xs uppercase">Berlaku Untuk Gelombang</span>
                <span className="font-semibold text-slate-800">
                  {template.gelombang?.nama || 'Semua Gelombang'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-2xs uppercase">Status</span>
                <div className="mt-1">
                  {template.is_active ? (
                    <Badge variant="success">Aktif</Badge>
                  ) : (
                    <Badge variant="danger">Tidak Aktif</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="card p-4 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b pb-2">
              Kop & Penomoran
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block text-2xs uppercase">Nama Institusi</span>
                <span className="font-semibold text-slate-800">{template.kop_nama_institusi || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-2xs uppercase">Sub Unit / Panitia</span>
                <span className="font-semibold text-slate-800">{template.kop_nama_sub || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-2xs uppercase">Alamat & Kontak</span>
                <p className="text-slate-700 whitespace-pre-line text-xs">{template.kop_alamat_kontak || '-'}</p>
              </div>
              <div>
                <span className="text-slate-400 block text-2xs uppercase">Format Nomor Surat</span>
                <code className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                  {template.format_nomor_surat || '-'}
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Teks & Konten Surat */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="card p-4 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b pb-2">
              Isi & Teks Keputusan Surat
            </h3>
            <div className="space-y-4 text-xs">
              <div>
                <span className="text-slate-400 block text-2xs uppercase">Judul Dokumen</span>
                <span className="font-bold text-slate-900 text-xs">{template.judul_surat || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-2xs uppercase">Teks Pembuka / Konsideran</span>
                <div className="bg-slate-50 p-3 rounded border text-slate-700 whitespace-pre-line leading-relaxed">
                  {template.teks_pembuka || '-'}
                </div>
              </div>
              <div>
                <span className="text-slate-400 block text-2xs uppercase">Teks Diktum Keputusan</span>
                <div className="bg-emerald-50 text-emerald-800 font-semibold p-3 rounded border border-emerald-200 text-center">
                  {template.teks_keputusan || '-'}
                </div>
              </div>
              <div>
                <span className="text-slate-400 block text-2xs uppercase">Petunjuk Daftar Ulang</span>
                <div className="bg-slate-50 p-3 rounded border text-slate-700 whitespace-pre-line leading-relaxed">
                  {template.petunjuk_daftar_ulang || '-'}
                </div>
              </div>
            </div>
          </div>

          <div className="card p-4 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b pb-2">
              Pengesahan & Catatan Kaki
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-2xs uppercase">Kota Penetapan</span>
                <span className="font-semibold text-slate-800">{template.kota_penetapan || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-2xs uppercase">Nama Penandatangan</span>
                <span className="font-semibold text-slate-800">{template.nama_penandatangan || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-2xs uppercase">Jabatan</span>
                <span className="font-semibold text-slate-800">{template.jabatan_penandatangan || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-2xs uppercase">NIP / NIDN</span>
                <span className="font-semibold text-slate-800">{template.nip_penandatangan || '-'}</span>
              </div>
              <div className="md:col-span-2">
                <span className="text-slate-400 block text-2xs uppercase">Catatan Kaki Dokumen</span>
                <p className="text-slate-600 italic text-2xs">{template.catatan_kaki || '-'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
