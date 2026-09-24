'use client';

import { useState } from 'react';
import { Printer, X, MapPin, Sparkles } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import type { AsetLabelData } from '@/types/sinapra.types';

interface AsetLabelPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  labels: AsetLabelData[];
  isLoading?: boolean;
}

// Code 39 Character Patterns (0 = narrow, 1 = wide)
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
      className="h-6 w-full max-w-[200px]"
      preserveAspectRatio="none"
    >
      {rects}
    </svg>
  );
}

export function AsetLabelPrintModal({
  isOpen,
  onClose,
  labels,
  isLoading = false,
}: AsetLabelPrintModalProps) {
  const [layoutMode, setLayoutMode] = useState<'satuan' | 'lembar_a4'>('satuan');
  const [barcodeType, setBarcodeType] = useState<'lengkap' | 'qr_only' | 'barcode_only'>('lengkap');
  const [showLogo, setShowLogo] = useState(true);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cetak Label Barcode & QR Code Aset"
      size="xl"
    >
      <div className="space-y-4">
        {/* Kontrol Pengaturan Cetak Label */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Format Tata Letak"
              value={layoutMode}
              onChange={(val) => setLayoutMode(val as 'satuan' | 'lembar_a4')}
              options={[
                { value: 'satuan', label: 'Label Satuan (70 x 35 mm / Roll Printer)' },
                { value: 'lembar_a4', label: 'Lembar A4 (Grid 2 Kolom Stiker Label)' },
              ]}
            />

            <Select
              label="Jenis Kode Inventaris"
              value={barcodeType}
              onChange={(val) => setBarcodeType(val as 'lengkap' | 'qr_only' | 'barcode_only')}
              options={[
                { value: 'lengkap', label: 'Lengkap (QR Code + Barcode 1D)' },
                { value: 'qr_only', label: 'QR Code Saja (2D Scanner)' },
                { value: 'barcode_only', label: 'Barcode 1D Saja (Laser Scanner)' },
              ]}
            />
          </div>

          <div className="flex items-center gap-4">
            <Checkbox
              label="Sertakan Header Logo Kampus & Teks Hak Milik"
              checked={showLogo}
              onChange={(e) => setShowLogo(e.target.checked)}
            />
          </div>
        </div>

        {/* Petunjuk Cetak */}
        <div className="flex items-center justify-between text-2xs text-slate-500">
          <span>
            Menampilkan <strong>{labels.length}</strong> label stiker inventaris fisik siap cetak.
          </span>
          <span className="italic">
            Tip: Sesuaikan ukuran kertas stiker di dialog browser.
          </span>
        </div>

        {/* AREA LABEL CETAK (PRINTABLE AREA) */}
        <div
          id="print-label-area"
          className={
            layoutMode === 'lembar_a4'
              ? 'grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto p-4 bg-white rounded-lg border border-slate-200'
              : 'space-y-4 max-h-[500px] overflow-y-auto p-4 bg-white rounded-lg border border-slate-200'
          }
        >
          {isLoading ? (
            <div className="col-span-2 flex justify-center p-6 text-xs text-slate-500">
              Menyiapkan data label barcode dan QR Code...
            </div>
          ) : labels.length === 0 ? (
            <div className="col-span-2 flex justify-center p-6 text-xs text-rose-500">
              Tidak ada data aset yang dipilih untuk dicetak.
            </div>
          ) : (
            labels.map((item) => (
              <div
                key={item.id}
                className="print-sticker-card border-2 border-slate-800 rounded bg-white p-3 shadow-xs flex flex-col gap-2 text-slate-900"
                style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
              >
                {/* Header Stiker */}
                {showLogo && (
                  <div className="flex items-center justify-between border-b-2 border-slate-800 p-2">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded bg-slate-800 flex items-center justify-center text-white text-3xs font-black">
                        U
                      </div>
                      <div>
                        <p className="text-3xs font-extrabold uppercase tracking-wider text-slate-800 leading-tight">
                          {item.instansi || 'SISTEM SARANA & PRASARANA KAMPUS'}
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
                )}

                {/* Body Stiker */}
                <div className="flex items-start gap-3">
                  {/* Bagian Kiri: Kode QR & Barcode */}
                  <div className="flex flex-col items-center shrink-0 gap-2">
                    {(barcodeType === 'lengkap' || barcodeType === 'qr_only') && (
                      <div className="h-16 w-16 bg-white p-2 border border-slate-300 rounded flex items-center justify-center">
                        {item.qr_code_svg ? (
                          <div
                            className="h-full w-full [&>svg]:h-full [&>svg]:w-full"
                            dangerouslySetInnerHTML={{ __html: item.qr_code_svg }}
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-3xs text-slate-400">
                            <Sparkles size={16} />
                            <span>QR Code</span>
                          </div>
                        )}
                      </div>
                    )}

                    {(barcodeType === 'lengkap' || barcodeType === 'barcode_only') && (
                      <div className="flex flex-col items-center w-full">
                        {renderCode39Bars(item.kode_aset)}
                        <span className="text-3xs font-mono font-bold tracking-widest text-slate-800">
                          *{item.kode_aset}*
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Bagian Kanan: Identitas & Lokasi Aset */}
                  <div className="flex-1 min-w-0 flex flex-col gap-2">
                    <div>
                      <span className="text-3xs font-bold uppercase tracking-wider text-slate-500">
                        Kode Inventaris
                      </span>
                      <p className="text-xs font-mono font-extrabold text-slate-900 tracking-wider">
                        {item.kode_aset}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-800 line-clamp-1 leading-snug">
                        {item.nama}
                      </p>
                      {(item.merk || item.model) && (
                        <p className="text-3xs text-slate-600 line-clamp-1">
                          {[item.merk, item.model].filter(Boolean).join(' - ')}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-3xs text-slate-600">
                      <div>
                        <span className="font-semibold text-slate-500">Kategori:</span>
                        <p className="font-medium text-slate-800 line-clamp-1">
                          {item.kategori || '-'}
                        </p>
                      </div>

                      <div>
                        <span className="font-semibold text-slate-500">Kondisi:</span>
                        <p className="font-medium text-slate-800 capitalize">
                          {item.kondisi || 'Baik'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-3xs text-slate-700 bg-white p-2 rounded border border-slate-200">
                      <MapPin size={16} className="shrink-0 text-slate-500" />
                      <span className="line-clamp-1">
                        {[item.lokasi_ruangan, item.lokasi_gedung].filter(Boolean).join(' • ') || 'Ruangan belum dialokasikan'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Stiker */}
                {showLogo && (
                  <div className="border-t border-dashed border-slate-300 text-center p-2">
                    <p className="text-3xs font-semibold tracking-tight text-slate-500 uppercase">
                      Hak Milik Inventaris Kampus • Dilarang Melepas / Memindahkan Tanpa Izin
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Modal Action Buttons */}
        <div className="flex justify-end gap-2 border-t border-slate-200 p-2">
          <Button
            variant="outline"
            icon={<X size={16} />}
            onClick={onClose}
          >
            Tutup
          </Button>
          <Button
            icon={<Printer size={16} />}
            onClick={handlePrint}
            disabled={labels.length === 0 || isLoading}
            style={{ background: 'var(--module-primary)' }}
          >
            Cetak Label Sekarang
          </Button>
        </div>
      </div>

      {/* Global Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-label-area,
          #print-label-area * {
            visibility: visible;
          }
          #print-label-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            max-height: none !important;
          }
          .print-sticker-card {
            border: 2px solid #000 !important;
            box-shadow: none !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            margin-bottom: 12px !important;
          }
        }
      `}</style>
    </Modal>
  );
}
