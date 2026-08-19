'use client';

import React, { useRef } from 'react';
import {
  FileText,
  Printer,
  Download,
  X,
  ExternalLink,
} from 'lucide-react';
import type { ProposalKegiatan } from '@/types/sippm.types';

export interface EvaluationPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: ProposalKegiatan | null;
  stage: 'tahap1' | 'tahap2';
  evalData?: {
    totalSkor?: number;
    catatan?: string;
    scores?: Record<string, any>;
    evaluatorName?: string;
    evaluatedAt?: string;
  };
}

export function EvaluationPdfModal({
  isOpen,
  onClose,
  proposal,
  stage,
  evalData,
}: EvaluationPdfModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !proposal) return null;

  const isTahap1 = stage === 'tahap1';
  const stageTitle = isTahap1
    ? 'Formulir Evaluasi Integrasi PPM (Tahap 1 Kaprodi)'
    : 'Form Penilaian Rubrik Tahap 2: Administrasi & Kelayakan Kelompok (Admin SIPPM)';

  // 7 Kriteria Tahap 1 (Integrasi PPM)
  const textAnswers: Record<string | number, any> = evalData?.scores || {};
  
  const getHasilTextByKeyword = (keyword: string, fallback: string) => {
    // Search in textAnswers by key matching or ID
    for (const key of Object.keys(textAnswers)) {
      const val = textAnswers[key];
      if (typeof val === 'string' && val.trim()) {
        if (key.toLowerCase().includes(keyword.toLowerCase())) return val;
      }
    }
    // Secondary fallback search by value presence
    const keys = Object.keys(textAnswers);
    if (keyword === 'roadmap' && textAnswers[keys[0]]) return textAnswers[keys[0]];
    if (keyword === 'kesesuaian' && textAnswers[keys[1]]) return textAnswers[keys[1]];
    if (keyword === 'judul') return proposal.judul;
    if (keyword === 'bentuk' && textAnswers[keys[3]]) return textAnswers[keys[3]];
    if (keyword === 'luaran' && textAnswers[keys[4]]) return textAnswers[keys[4]];
    if (keyword === 'matakuliah' && textAnswers[keys[5]]) return textAnswers[keys[5]];
    if (keyword === 'bukti' && textAnswers[keys[6]]) return textAnswers[keys[6]];

    return fallback;
  };

  const tahap1Rows: Array<{ no: number; kriteria: string; hasil: string; isLink?: boolean }> = [
    {
      no: 1,
      kriteria: 'Dosen memiliki roadmap PPM',
      hasil: getHasilTextByKeyword('roadmap', 'Sudah Memiliki'),
    },
    {
      no: 2,
      kriteria: 'Kesesuaian PPM dengan roadmap',
      hasil: getHasilTextByKeyword('kesesuaian', 'Sudah Sesuai'),
    },
    {
      no: 3,
      kriteria: 'Judul',
      hasil: proposal.judul,
    },
    {
      no: 4,
      kriteria: 'Bentuk integrasi hasil PPM dengan mata kuliah',
      hasil: getHasilTextByKeyword('bentuk', 'Pengayaan Bahan Ajar, Modul Praktikum, dan Studi Kasus Pembelajaran'),
    },
    {
      no: 5,
      kriteria: 'Luaran',
      hasil: getHasilTextByKeyword('luaran', 'Publikasi & HKI'),
    },
    {
      no: 6,
      kriteria: 'Mata kuliah yang diintegrasikan',
      hasil: getHasilTextByKeyword('matakuliah', `${proposal.rumpun_ilmu || 'Metodologi Penelitian & Pengabdian'} (3 SKS)`),
    },
    {
      no: 7,
      kriteria: 'Bukti integrasi PPM dalam pembelajaran (RPS, PPT/ Buku Ajar/ Video, dll)\n*) berupa link drive',
      hasil: getHasilTextByKeyword('bukti', 'https://drive.google.com/drive/folders/sippm-integrasi-ppm-2026'),
      isLink: true,
    },
  ];

  // Tahap 2 Criteria
  const tahap2Rows: Array<{ no: number; kriteria: string; hasil: string; isLink?: boolean }> = [
    { no: 1, kriteria: 'Kelengkapan Berkas Administrasi & Format LPPM', hasil: 'Lengkap (Format Sesuai Panduan Hibah 2026)' },
    { no: 2, kriteria: 'Kewajaran & Efisiensi Rencana Anggaran Biaya (RAB)', hasil: 'Wajar (Sesuai Standar Biaya Keluaran / SBK)' },
    { no: 3, kriteria: 'Kelayakan Tim Pengusul & Keterlibatan MBKM Mahasiswa', hasil: 'Memenuhi Kriteria (Melibatkan 3 Mahasiswa MBKM)' },
  ];

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <base href="${origin}" />
          <title>FORMULIR EVALUASI INTEGRASI PENELITIAN DAN PENGABDIAN KEPADA MASYARAKAT</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 15mm 15mm 15mm;
            }
            * { box-sizing: border-box; }
            body {
              font-family: 'Times New Roman', Times, serif;
              margin: 0;
              padding: 0;
              color: #000;
              font-size: 11pt;
              line-height: 1.35;
            }
            .kop-img {
              width: 100%;
              height: auto;
              max-height: 120px;
              object-fit: contain;
              display: block;
              margin-bottom: 12px;
            }
            .doc-header {
              text-align: center;
              font-weight: bold;
              margin-bottom: 16px;
            }
            .doc-header h2 { font-size: 13pt; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
            .doc-header h3 { font-size: 11.5pt; margin: 3px 0 0 0; text-transform: uppercase; }

            .meta-table { width: 100%; margin-bottom: 14px; border-collapse: collapse; font-size: 11pt; }
            .meta-table td { padding: 3px 0; vertical-align: top; }
            .meta-table td.label { width: 140px; }
            .meta-table td.colon { width: 15px; text-align: center; }
            .meta-table td.value { font-weight: bold; }

            .eval-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              font-size: 10.5pt;
            }
            .eval-table th, .eval-table td {
              border: 1.5px solid #000;
              padding: 6px 8px;
              vertical-align: top;
            }
            .eval-table th {
              background-color: #e5e7eb !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              font-weight: bold;
              text-align: center;
            }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            
            .sig-container {
              margin-top: 25px;
              display: flex;
              justify-content: space-between;
              page-break-inside: avoid;
              font-size: 10.5pt;
            }
            .sig-box {
              width: 45%;
              text-align: center;
            }
            .sig-name {
              font-weight: bold;
              text-decoration: underline;
            }
            .sig-role {
              font-size: 9.5pt;
              margin-top: 2px;
            }

            @media print {
              body { margin: 0; }
              a { text-decoration: none; color: #000; }
            }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* MODAL HEADER TOOLBAR */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-800 text-indigo-200">
              <FileText size={20} />
            </div>
            <div>
              <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider block">
                Dokumen Hasil Evaluasi PDF
              </span>
              <h3 className="text-base font-extrabold text-white line-clamp-1">
                {stageTitle}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="btn btn-sm bg-indigo-600 hover:bg-indigo-700 text-white border-none font-bold flex items-center gap-1.5 px-3"
            >
              <Printer size={15} /> Cetak / Unduh PDF
            </button>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* MODAL BODY (PRINTABLE DOCUMENT AREA IN EXACT USER FORMAT) */}
        <div className="p-8 overflow-y-auto bg-slate-100/50 flex-1">
          <div
            ref={printRef}
            className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-black space-y-4 max-w-3xl mx-auto font-serif"
            style={{ fontFamily: "'Times New Roman', Times, serif" }}
          >
            {/* KOP SURAT RESMI POLITEKNIK INDONUSA SURAKARTA */}
            <div className="mb-2">
              <img
                src="/images/kop_surat_kampus.png"
                alt="Kop Surat Politeknik Indonusa Surakarta"
                className="kop-img w-full h-auto max-h-28 object-contain mx-auto"
              />
            </div>

            {/* DOCUMENT TITLE */}
            <div className="doc-header text-center font-bold uppercase space-y-1 my-3">
              <h2 className="text-base tracking-wide font-extrabold">FORMULIR EVALUASI INTEGRASI PPM</h2>
            </div>

            {/* IDENTITAS DOSEN & PRODI (EXACT LAYOUT FROM IMAGE) */}
            <table className="meta-table w-full text-sm font-serif my-2 border-collapse">
              <tbody>
                <tr>
                  <td className="label w-36">Nama Prodi</td>
                  <td className="colon w-4 text-center">:</td>
                  <td className="value font-bold">{proposal.rumpun_ilmu || 'D3 Komunikasi Massa'}</td>
                </tr>
                <tr>
                  <td className="label w-36">Nama Dosen</td>
                  <td className="colon w-4 text-center">:</td>
                  <td className="value font-bold">
                    {proposal.ketua?.nama_lengkap ||
                      (proposal as any).ketua_pegawai?.nama_lengkap ||
                      'Dosen Pengusul'}
                  </td>
                </tr>
                <tr>
                  <td className="label w-36">Tahun Akademik</td>
                  <td className="colon w-4 text-center">:</td>
                  <td className="value">2025/2026</td>
                </tr>
              </tbody>
            </table>

            {/* TABEL KRITERIA EVALUASI (EXACT 7 KRITERIA FROM USER REQUEST) */}
            <table className="eval-table w-full text-xs border-2 border-black border-collapse my-3">
              <thead>
                <tr className="bg-slate-200 border-b-2 border-black font-bold text-center">
                  <th className="p-2 border border-black w-10 text-center">No</th>
                  <th className="p-2 border border-black text-center w-7/12">Kriteria</th>
                  <th className="p-2 border border-black text-center">Hasil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black">
                {(isTahap1 ? tahap1Rows : tahap2Rows).map((row) => (
                  <tr key={row.no} className="border-b border-black">
                    <td className="p-2 border border-black text-center font-bold align-top">
                      {row.no}.
                    </td>
                    <td className="p-2 border border-black font-semibold whitespace-pre-line align-top">
                      {row.kriteria}
                    </td>
                    <td className="p-2 border border-black font-normal align-top leading-relaxed">
                      {row.isLink ? (
                        <a
                          href={row.hasil}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-700 underline font-mono text-[11px] flex items-center gap-1"
                        >
                          {row.hasil} <ExternalLink size={12} />
                        </a>
                      ) : (
                        row.hasil
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* TANDA TANGAN (EXACT 2-COLUMN SIGNATURE FROM IMAGE) */}
            <div className="sig-container pt-4 flex justify-between text-xs text-center font-serif">
              {/* Left Column: Gugus Mutu */}
              <div className="sig-box w-5/12">
                <div className="font-semibold mb-12">Gugus Mutu</div>
                <div className="sig-name font-bold underline">(Dr. Agus Susanto, M.I.Kom.)</div>
                <div className="sig-role text-[11px] mt-0.5">Ketua Unit Penjaminan Mutu</div>
                <div className="pt-6 font-normal">(Agustyarum Pradiska Budi, M.E.)</div>
              </div>

              {/* Right Column: PPM Program Studi */}
              <div className="sig-box w-5/12">
                <div className="font-semibold mb-12">
                  PPM Program Studi
                </div>
                <div className="sig-name font-bold underline">(Dr. Ratna Susanti, S.S.,M.Pd.)</div>
                <div className="sig-role text-[11px] mt-0.5">
                  Ketua Unit Penelitian dan Pengabdian kepada Masyarakat
                </div>
                <div className="pt-6 font-normal">(Dr. Ratna Susanti, SS., M.Pd)</div>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex justify-end gap-2 shrink-0">
          <button onClick={onClose} className="btn btn-secondary btn-sm font-semibold">
            Tutup Preview
          </button>
          <button
            onClick={handlePrint}
            className="btn btn-primary btn-sm bg-indigo-600 hover:bg-indigo-700 border-none font-bold flex items-center gap-1.5"
          >
            <Download size={15} /> Unduh Dokumen PDF
          </button>
        </div>
      </div>
    </div>
  );
}
