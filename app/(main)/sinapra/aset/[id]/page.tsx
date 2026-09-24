'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Edit2,
  Printer,
  Boxes,
  MapPin,
  Calendar,
  Building,
  Layers,
  Calculator,
  ShieldCheck,
  Tag,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AsetLabelPrintModal } from '@/components/sinapra/AsetLabelPrintModal';
import { formatCurrency, formatDate } from '@/lib/utils';
import { sinapraService } from '@/services/sinapra.service';
import type { Aset, AsetLabelData, PenyusutanAsetResult } from '@/types/sinapra.types';

// Code 39 Barcode renderer helper for label preview
const CODE39_PATTERNS: Record<string, string> = {
  '0': '000110100', '1': '100100001', '2': '001100001', '3': '101100000',
  '4': '000110001', '5': '100110000', '6': '001110000', '7': '000100101',
  '8': '100100100', '9': '001100100', 'A': '100001001', 'B': '001001001',
  'C': '101001000', 'D': '000011001', 'E': '100011000', 'F': '001011000',
  'G': '000001101', 'H': '100001100', 'I': '001001100', 'J': '000011100',
  'K': '100000011', 'L': '001000011', 'M': '101000010', 'N': '000010011',
  'O': '100010010', 'P': '001010010', 'Q': '000000111', 'R': '100000110',
  'S': '001000110', 'T': '000010110', 'U': '110000001', 'V': '011000001',
  'W': '111000000', 'X': '010010001', 'Y': '110010000', 'Z': '011010000',
  '-': '010000101', '.': '110000100', ' ': '011000100', '$': '010101000',
  '/': '010100010', '+': '010001010', '%': '000101010', '*': '010010100'
};

function renderCode39Bars(code: string) {
  const sanitized = `*${(code || '').toUpperCase().replace(/[^0-9A-Z\-. $/+%*]/g, '')}*`;
  const narrowWidth = 1.4;
  const wideWidth = 3.2;
  const barHeight = 24;

  let currentX = 0;
  const rects: React.ReactNode[] = [];

  for (let i = 0; i < sanitized.length; i++) {
    const char = sanitized[i];
    const pattern = CODE39_PATTERNS[char] || CODE39_PATTERNS['-'];

    for (let j = 0; j < 9; j++) {
      const isBar = j % 2 === 0;
      const isWide = pattern[j] === '1';
      const w = isWide ? wideWidth : narrowWidth;

      if (isBar) {
        rects.push(
          <rect
            key={`${i}-${j}`}
            x={currentX}
            y={0}
            width={w}
            height={barHeight}
            fill="#0f172a"
          />
        );
      }
      currentX += w;
    }
    currentX += narrowWidth;
  }

  return (
    <svg
      viewBox={`0 0 ${currentX} ${barHeight}`}
      className="h-6 w-full max-w-[180px]"
      preserveAspectRatio="none"
    >
      {rects}
    </svg>
  );
}

export default function DetailAsetPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params?.id);

  const [aset, setAset] = useState<Aset | null>(null);
  const [labelData, setLabelData] = useState<AsetLabelData | null>(null);
  const [penyusutan, setPenyusutan] = useState<PenyusutanAsetResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      setIsLoading(true);
      try {
        const [asetRes, labelRes, penyusutanRes] = await Promise.allSettled([
          sinapraService.getAsetDetail(id),
          sinapraService.getAsetLabel(id),
          sinapraService.hitungPenyusutanAset(id),
        ]);

        if (asetRes.status === 'fulfilled' && asetRes.value?.data) {
          setAset(asetRes.value.data);
        }
        if (labelRes.status === 'fulfilled' && labelRes.value?.data) {
          setLabelData(labelRes.value.data);
        }
        if (penyusutanRes.status === 'fulfilled' && penyusutanRes.value?.data) {
          setPenyusutan(penyusutanRes.value.data);
        }
      } catch {
        toast.error('Gagal memuat rincian inventaris aset');
        router.push('/sinapra/aset');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetail();
  }, [id, router]);

  if (isLoading) {
    return (
      <div className="flex w-full flex-col gap-4">
        <PageHeader title="Detail Inventaris Barang / Aset" />
        <div className="flex justify-center p-4 md:p-6 bg-white rounded-lg border border-slate-200">
          <p className="text-xs text-slate-500">Memuat rincian aset...</p>
        </div>
      </div>
    );
  }

  if (!aset) {
    return (
      <div className="flex w-full flex-col gap-4">
        <PageHeader title="Detail Inventaris Barang / Aset" />
        <div className="p-4 md:p-6 bg-white rounded-lg border border-slate-200">
          <p className="text-xs text-rose-500">Data aset tidak ditemukan.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <PageHeader
        title={`Detail Aset: ${aset.nama}`}
        description={`Informasi inventaris, spesifikasi, lokasi penempatan, dan label fisik ${aset.kode_aset}`}
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              icon={<ArrowLeft size={16} />}
              onClick={() => router.push('/sinapra/aset')}
              style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
            >
              Kembali
            </Button>
            <Button
              variant="outline"
              icon={<Printer size={16} />}
              onClick={() => setIsPrintModalOpen(true)}
              style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
            >
              Cetak Label
            </Button>
            <Button
              icon={<Edit2 size={16} />}
              onClick={() => router.push(`/sinapra/aset/${aset.id}/edit`)}
              style={{ background: 'var(--module-primary)' }}
            >
              Edit Aset
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Kolom 1: Identitas & Nilai Aset */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 md:p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-700">
              <Boxes size={24} />
            </div>
            <div>
              <span className="font-mono text-2xs font-semibold text-slate-500 uppercase">
                {aset.kode_aset}
              </span>
              <h2 className="text-sm font-bold text-slate-800">{aset.nama}</h2>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-2xs font-medium text-slate-500 uppercase">Kategori Aset</p>
              <p className="text-xs font-semibold text-slate-800">
                {aset.kategori?.nama || '-'}
              </p>
            </div>

            <div>
              <p className="text-2xs font-medium text-slate-500 uppercase">Merk & Model</p>
              <p className="text-xs text-slate-700">
                {[aset.merk, aset.nomor_seri].filter(Boolean).join(' • ') || '-'}
              </p>
            </div>

            <div>
              <p className="text-2xs font-medium text-slate-500 uppercase">Status & Kondisi</p>
              <div className="flex items-center gap-2">
                <Badge variant={aset.status === 'tersedia' ? 'success' : 'warning'}>
                  {aset.status?.replace('_', ' ')}
                </Badge>
                <Badge variant={aset.kondisi === 'baik' ? 'info' : 'danger'}>
                  {aset.kondisi?.replace('_', ' ')}
                </Badge>
              </div>
            </div>

            <div>
              <p className="text-2xs font-medium text-slate-500 uppercase">Tanggal Perolehan</p>
              <p className="text-xs text-slate-700">
                {aset.tanggal_perolehan ? formatDate(aset.tanggal_perolehan) : '-'}
              </p>
            </div>

            <div className="rounded bg-white p-3 flex flex-col gap-2 border border-slate-200">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Harga Perolehan:</span>
                <span className="font-bold text-slate-800">
                  {formatCurrency(aset.harga_perolehan)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Estimasi Nilai Buku:</span>
                <span className="font-bold text-emerald-600">
                  {penyusutan ? formatCurrency(penyusutan.nilai_buku_saat_ini) : formatCurrency(aset.nilai_buku)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom 2: Lokasi & Penempatan Ruangan */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 md:p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Building size={16} /> Lokasi & Operasional
          </h3>

          <div className="space-y-4">
            <div>
              <p className="text-2xs font-medium text-slate-500 uppercase">Ruangan Penempatan</p>
              <p className="text-xs font-semibold text-slate-800 flex items-center gap-2">
                <MapPin size={16} className="text-slate-400 shrink-0" />
                <span>{aset.ruangan?.nama || 'Belum ditempatkan di ruangan'}</span>
              </p>
            </div>

            <div>
              <p className="text-2xs font-medium text-slate-500 uppercase">Gedung Kampus</p>
              <p className="text-xs text-slate-700">
                {aset.ruangan?.gedung?.nama || '-'}
              </p>
            </div>

            <div>
              <p className="text-2xs font-medium text-slate-500 uppercase">Peminjaman Aset</p>
              <p className="text-xs text-slate-700">
                {aset.is_borrowable ? 'Dapat Dipinjam Civitas Akademika' : 'Khusus Operasional Internal'}
              </p>
            </div>

            <div>
              <p className="text-2xs font-medium text-slate-500 uppercase">Klasifikasi Laboratorium</p>
              <p className="text-xs text-slate-700">
                {aset.is_lab_asset ? 'Instrumen / Aset Laboratorium' : 'Aset Sarana Umum'}
              </p>
            </div>

            {aset.spesifikasi && (
              <div>
                <p className="text-2xs font-medium text-slate-500 uppercase">Spesifikasi Tambahan</p>
                <p className="text-xs text-slate-600 whitespace-pre-line bg-white p-2 rounded border border-slate-200">
                  {aset.spesifikasi}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Kolom 3: Preview Fisik Label Stiker Inventaris */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Printer size={16} /> Label Fisik Inventaris
            </h3>
            <span className="text-3xs font-mono text-slate-400 uppercase">70 x 35 mm</span>
          </div>

          {/* Kartu Stiker Inventaris Realistis */}
          <div className="border-2 border-slate-800 rounded bg-white p-3 shadow-xs flex flex-col gap-2 text-slate-900">
            {/* Header Stiker */}
            <div className="flex items-center justify-between border-b-2 border-slate-800 p-2">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded bg-slate-800 flex items-center justify-center text-white text-3xs font-black">
                  U
                </div>
                <div>
                  <p className="text-3xs font-extrabold uppercase tracking-wider text-slate-800 leading-tight">
                    {labelData?.instansi || 'SISTEM SARANA & PRASARANA'}
                  </p>
                  <p className="text-3xs text-slate-500 font-medium leading-tight">
                    STIKER INVENTARIS RESMI
                  </p>
                </div>
              </div>
              <span className="text-3xs font-mono font-bold bg-white text-slate-800 p-2 rounded border border-slate-300">
                SINAPRA
              </span>
            </div>

            {/* Konten Stiker */}
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center shrink-0 gap-2">
                <div className="h-16 w-16 bg-white p-2 border border-slate-300 rounded flex items-center justify-center">
                  {labelData?.qr_code_svg ? (
                    <div
                      className="h-full w-full [&>svg]:h-full [&>svg]:w-full"
                      dangerouslySetInnerHTML={{ __html: labelData.qr_code_svg }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-3xs text-slate-400">
                      <Sparkles size={16} />
                      <span>QR Code</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-center w-full">
                  {renderCode39Bars(aset.kode_aset)}
                  <span className="text-3xs font-mono font-bold tracking-widest text-slate-800">
                    *{aset.kode_aset}*
                  </span>
                </div>
              </div>

              <div className="flex-1 min-w-0 flex flex-col gap-2">
                <div>
                  <span className="text-3xs font-bold uppercase tracking-wider text-slate-500">
                    Kode Inventaris
                  </span>
                  <p className="text-xs font-mono font-extrabold text-slate-900 tracking-wider">
                    {aset.kode_aset}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-800 line-clamp-1 leading-snug">
                    {aset.nama}
                  </p>
                  <p className="text-3xs text-slate-600 line-clamp-1">
                    {[aset.merk, aset.nomor_seri].filter(Boolean).join(' - ') || '-'}
                  </p>
                </div>

                <div className="text-3xs text-slate-600">
                  <p className="font-semibold text-slate-500">Lokasi Penempatan:</p>
                  <p className="font-medium text-slate-800 line-clamp-1">
                    {[aset.ruangan?.nama, aset.ruangan?.gedung?.nama].filter(Boolean).join(' • ') || 'Belum dialokasikan'}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Stiker */}
            <div className="border-t border-dashed border-slate-300 text-center p-2">
              <p className="text-3xs font-semibold tracking-tight text-slate-500 uppercase">
                Hak Milik Inventaris Kampus • Dilarang Melepas Stiker
              </p>
            </div>
          </div>

          <div>
            <Button
              className="w-full"
              icon={<Printer size={16} />}
              onClick={() => setIsPrintModalOpen(true)}
              style={{ background: 'var(--module-primary)' }}
            >
              Cetak Stiker Label Ini
            </Button>
          </div>
        </div>
      </div>

      {/* Modal Cetak Label */}
      <AsetLabelPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        labels={labelData ? [labelData] : [{
          id: aset.id,
          kode_aset: aset.kode_aset,
          nama: aset.nama,
          merk: aset.merk,
          kategori: aset.kategori?.nama,
          lokasi_ruangan: aset.ruangan?.nama,
          lokasi_gedung: aset.ruangan?.gedung?.nama,
          tanggal_perolehan: aset.tanggal_perolehan,
          kondisi: aset.kondisi,
          status: aset.status,
        }]}
      />
    </div>
  );
}
