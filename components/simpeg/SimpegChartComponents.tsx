'use client';

import React, { useState } from 'react';
import {
  Clock,
  AlertTriangle,
  Award,
  GraduationCap,
  Building2,
  Calendar,
  Users,
  CheckCircle2,
  TrendingUp,
  ShieldAlert,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import type {
  PresensiAnalyticsData,
  DemografiAnalyticsData,
  MonthlyAttendanceItem,
  MonthlySpItem,
  UnitKerjaDisciplineItem,
  JadPyramidItem,
  AgeDistributionItem,
} from '@/types/simpeg.types';

// ============================================================================
// 1. GRAFIK TREN KEHADIRAN & KETERLAMBATAN BULANAN (12 BULAN)
// ============================================================================

export function AttendanceMonthlyTrendChart({ data }: { data: MonthlyAttendanceItem[] }) {
  const [hoveredMonth, setHoveredMonth] = useState<MonthlyAttendanceItem | null>(null);

  const maxVal = Math.max(
    1,
    ...data.map((d) => Math.max(d.total_kehadiran, d.tepat_waktu + d.terlambat + d.izin_sakit_cuti + d.alfa))
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
      <div className="pb-3 border-b border-slate-100 space-y-2">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Clock size={18} className="text-emerald-600 shrink-0" />
            <span>Tren Kehadiran & Keterlambatan Bulanan</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Komposisi tepat waktu, keterlambatan, dan izin sepanjang 12 bulan
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs pt-1 flex-wrap">
          <span className="flex items-center gap-1.5 text-slate-700 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shrink-0" />
            Tepat Waktu
          </span>
          <span className="flex items-center gap-1.5 text-slate-700 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block shrink-0" />
            Terlambat
          </span>
          <span className="flex items-center gap-1.5 text-slate-700 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block shrink-0" />
            Izin / Sakit
          </span>
          <span className="flex items-center gap-1.5 text-slate-700 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block shrink-0" />
            Alfa
          </span>
        </div>
      </div>

      {/* Visual Chart Bars (12 Kolom Bulan) */}
      <div className="pt-6 pb-2">
        <div className="grid grid-cols-12 gap-1.5 sm:gap-2 h-48 items-end border-b border-slate-200 px-1">
          {data.map((item) => {
            const tepatHeight = (item.tepat_waktu / maxVal) * 100;
            const terlambatHeight = (item.terlambat / maxVal) * 100;
            const izinHeight = (item.izin_sakit_cuti / maxVal) * 100;
            const alfaHeight = (item.alfa / maxVal) * 100;

            const isHovered = hoveredMonth?.month_code === item.month_code;

            return (
              <div
                key={item.month_code}
                onMouseEnter={() => setHoveredMonth(item)}
                onMouseLeave={() => setHoveredMonth(null)}
                className="relative flex flex-col justify-end items-center h-full group cursor-pointer"
              >
                {/* Stacked Bars */}
                <div
                  className={`w-full max-w-7 rounded-t-sm flex flex-col justify-end overflow-hidden transition-all duration-200 ${
                    isHovered ? 'ring-2 ring-emerald-500/50 scale-105' : 'hover:opacity-90'
                  }`}
                  style={{ height: `${Math.min(100, Math.max(6, tepatHeight + terlambatHeight + izinHeight + alfaHeight))}%` }}
                >
                  {alfaHeight > 0 && (
                    <div
                      style={{ height: `${alfaHeight}%` }}
                      className="bg-rose-500 w-full"
                      title={`Alfa: ${item.alfa}`}
                    />
                  )}
                  {izinHeight > 0 && (
                    <div
                      style={{ height: `${izinHeight}%` }}
                      className="bg-sky-400 w-full"
                      title={`Izin/Sakit: ${item.izin_sakit_cuti}`}
                    />
                  )}
                  {terlambatHeight > 0 && (
                    <div
                      style={{ height: `${terlambatHeight}%` }}
                      className="bg-amber-400 w-full"
                      title={`Terlambat: ${item.terlambat}`}
                    />
                  )}
                  <div
                    style={{ height: `${Math.max(4, tepatHeight)}%` }}
                    className="bg-emerald-500 w-full"
                    title={`Tepat Waktu: ${item.tepat_waktu}`}
                  />
                </div>

                {/* Label Bulan */}
                <span className={`text-xs font-semibold mt-2.5 ${isHovered ? 'text-emerald-700 font-bold' : 'text-slate-600'}`}>
                  {item.month_name}
                </span>

                {/* Floating Tooltip saat Hover */}
                {isHovered && (
                  <div className="absolute bottom-full mb-2 z-30 bg-slate-900 text-white rounded-lg p-2.5 text-2xs shadow-lg min-w-32 pointer-events-none animate-fade-in">
                    <div className="font-bold border-b border-slate-700 pb-1 mb-1.5 flex justify-between">
                      <span>Bulan {item.month_name}</span>
                      <span>Total: {item.total_kehadiran}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-emerald-300">
                        <span>Tepat Waktu:</span>
                        <span className="font-bold">{item.tepat_waktu}</span>
                      </div>
                      <div className="flex justify-between text-amber-300">
                        <span>Terlambat:</span>
                        <span className="font-bold">{item.terlambat}</span>
                      </div>
                      <div className="flex justify-between text-sky-300">
                        <span>Izin / Sakit:</span>
                        <span className="font-bold">{item.izin_sakit_cuti}</span>
                      </div>
                      <div className="flex justify-between text-rose-300">
                        <span>Alfa:</span>
                        <span className="font-bold">{item.alfa}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 2. GRAFIK TREN PENERBITAN SURAT PERINGATAN (SP) (12 BULAN)
// ============================================================================

export function SpMonthlyTrendChart({ data }: { data: MonthlySpItem[] }) {
  const [hoveredMonth, setHoveredMonth] = useState<MonthlySpItem | null>(null);

  const maxVal = Math.max(1, ...data.map((d) => d.total_sp));
  const totalSpAll = data.reduce((acc, curr) => acc + curr.total_sp, 0);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
      <div className="pb-3 border-b border-slate-100 space-y-2">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <ShieldAlert size={18} className="text-rose-600 shrink-0" />
              <span>Tren Penerbitan Surat Peringatan (SP)</span>
            </h3>
            <span className="text-2xs font-extrabold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 shrink-0">
              {totalSpAll} SP Terbit
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Distribusi sanksi kedisiplinan SP 1, SP 2, dan SP 3 per bulan
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs pt-1 flex-wrap">
          <span className="flex items-center gap-1.5 text-slate-700 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block shrink-0" />
            SP 1 (Pertama)
          </span>
          <span className="flex items-center gap-1.5 text-slate-700 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block shrink-0" />
            SP 2 (Kedua)
          </span>
          <span className="flex items-center gap-1.5 text-slate-700 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block shrink-0" />
            SP 3 (Ketiga)
          </span>
        </div>
      </div>

      {/* Visual Bars */}
      <div className="pt-6 pb-2">
        <div className="grid grid-cols-12 gap-1.5 sm:gap-2 h-48 items-end border-b border-slate-200 px-1">
          {data.map((item) => {
            const sp1Height = (item.sp_1 / maxVal) * 100;
            const sp2Height = (item.sp_2 / maxVal) * 100;
            const sp3Height = (item.sp_3 / maxVal) * 100;
            const totalHeight = sp1Height + sp2Height + sp3Height;

            const isHovered = hoveredMonth?.month_code === item.month_code;

            return (
              <div
                key={item.month_code}
                onMouseEnter={() => setHoveredMonth(item)}
                onMouseLeave={() => setHoveredMonth(null)}
                className="relative flex flex-col justify-end items-center h-full group cursor-pointer"
              >
                {/* Floating indicator total SP di atas bar */}
                {item.total_sp > 0 && (
                  <span className="text-xs font-mono font-bold text-rose-600 mb-1 leading-none">
                    {item.total_sp}
                  </span>
                )}

                {/* Stacked SP Bar */}
                <div
                  className={`w-full max-w-7 rounded-t-sm flex flex-col justify-end overflow-hidden transition-all duration-200 ${
                    item.total_sp === 0
                      ? 'bg-slate-100 h-1.5'
                      : isHovered
                      ? 'ring-2 ring-rose-500/50 scale-105'
                      : 'hover:opacity-90'
                  }`}
                  style={{
                    height: item.total_sp === 0 ? '6px' : `${Math.min(100, Math.max(10, totalHeight))}%`,
                  }}
                >
                  {sp3Height > 0 && <div style={{ height: `${sp3Height}%` }} className="bg-rose-600 w-full" />}
                  {sp2Height > 0 && <div style={{ height: `${sp2Height}%` }} className="bg-orange-500 w-full" />}
                  {sp1Height > 0 && <div style={{ height: `${sp1Height}%` }} className="bg-amber-400 w-full" />}
                </div>

                {/* Label Bulan */}
                <span className={`text-xs font-semibold mt-2.5 ${isHovered ? 'text-rose-700 font-bold' : 'text-slate-600'}`}>
                  {item.month_name}
                </span>

                {/* Tooltip Hover */}
                {isHovered && (
                  <div className="absolute bottom-full mb-2 z-30 bg-slate-900 text-white rounded-lg p-2.5 text-2xs shadow-lg min-w-28 pointer-events-none animate-fade-in">
                    <div className="font-bold border-b border-slate-700 pb-1 mb-1.5 flex justify-between">
                      <span>{item.month_name}</span>
                      <span className="text-rose-400">{item.total_sp} Terbit</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-amber-300">
                        <span>SP 1:</span>
                        <span className="font-bold">{item.sp_1}</span>
                      </div>
                      <div className="flex justify-between text-orange-300">
                        <span>SP 2:</span>
                        <span className="font-bold">{item.sp_2}</span>
                      </div>
                      <div className="flex justify-between text-rose-300">
                        <span>SP 3:</span>
                        <span className="font-bold">{item.sp_3}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 3. TOP 5 UNIT KERJA PALING DISIPLIN VS RAWAN TERLAMBAT
// ============================================================================

export function UnitKerjaDisciplineChart({
  topDisiplin,
  topRawan,
}: {
  topDisiplin: UnitKerjaDisciplineItem[];
  topRawan: UnitKerjaDisciplineItem[];
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
      <div className="pb-3 border-b border-slate-100 space-y-1">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Building2 size={18} className="text-indigo-600 shrink-0" />
          <span>Komparasi Kedisiplinan Unit Kerja Kampus</span>
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Perbandingan 5 unit kerja dengan rasio kehadiran terbaik vs 5 unit kerja paling rawan keterlambatan
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-5">
        {/* Kolom 1: Top 5 Paling Disiplin */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-md">
              <CheckCircle2 size={15} className="text-emerald-600" /> Top 5 Paling Disiplin
            </span>
            <span className="text-2xs text-slate-400 font-medium">Tepat Waktu (%)</span>
          </div>

          {topDisiplin.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-6 text-center">Belum ada data presensi periode ini</p>
          ) : (
            <div className="space-y-2.5">
              {topDisiplin.map((item, idx) => (
                <div key={item.unit_kerja_id} className="p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50/80 transition-colors">
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="font-semibold text-slate-800 truncate max-w-48" title={item.unit_kerja_nama}>
                      {idx + 1}. {item.unit_kerja_nama}
                    </span>
                    <span className="font-mono font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded text-xs">
                      {item.persentase_disiplin}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                    <div
                      style={{ width: `${item.persentase_disiplin}%` }}
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    />
                  </div>
                  <div className="flex justify-between text-2xs text-slate-500 mt-1.5">
                    <span>{item.total_tepat_waktu} tepat waktu</span>
                    <span>Total {item.total_presensi} log</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Kolom 2: Top 5 Paling Rawan Terlambat */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5 bg-rose-50 px-2.5 py-1 rounded-md">
              <AlertTriangle size={15} className="text-rose-600" /> Top 5 Paling Rawan Keterlambatan
            </span>
            <span className="text-2xs text-slate-400 font-medium">Total Terlambat</span>
          </div>

          {topRawan.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-6 text-center">Tidak ada unit kerja rawan</p>
          ) : (
            <div className="space-y-2.5">
              {topRawan.map((item, idx) => {
                const maxLate = Math.max(1, topRawan[0]?.total_terlambat || 1);
                const barWidth = Math.min(100, Math.max(10, (item.total_terlambat / maxLate) * 100));

                return (
                  <div key={item.unit_kerja_id} className="p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50/80 transition-colors">
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="font-semibold text-slate-800 truncate max-w-48" title={item.unit_kerja_nama}>
                        {idx + 1}. {item.unit_kerja_nama}
                      </span>
                      <span className="font-mono font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded text-xs">
                        {item.total_terlambat} Kali Terlambat
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                      <div
                        style={{ width: `${barWidth}%` }}
                        className="bg-rose-500 h-full rounded-full transition-all duration-500"
                      />
                    </div>
                    <div className="flex justify-between text-2xs text-slate-500 mt-1.5">
                      <span>{item.persentase_disiplin}% ketepatan</span>
                      <span>Total {item.total_presensi} log</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 4. PIRAMIDA JABATAN FUNGSIONAL AKADEMIK (JAD) DOSEN
// ============================================================================

export function JadPyramidChart({ data }: { data: JadPyramidItem[] }) {
  // Urutkan dari Guru Besar (atas) ke Tenaga Pengajar (bawah)
  const sorted = [...data].sort((a, b) => b.order - a.order);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col h-full">
      <div className="pb-3 border-b border-slate-100 space-y-1">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <GraduationCap size={18} className="text-purple-600 shrink-0" />
          <span>Piramida Jabatan Fungsional Dosen (JAD)</span>
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Struktur kepangkatan akademik dosen aktif Politeknik Indonusa Surakarta
        </p>
      </div>

      <div className="pt-5 space-y-3.5">
        {sorted.map((item) => {
          // Ketika nilainya 0, barWidth harus 0% (tidak ada warna yang muncul).
          // Jika > 0, lebar bar mengikuti persentase riil (misal 99.3%, tidak full 100%).
          const barWidth = item.count === 0 ? 0 : Math.max(1, Math.min(100, item.percentage));

          return (
            <div key={item.level} className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-800 flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.count > 0 ? item.color : '#cbd5e1' }}
                  />
                  {item.label}
                </span>
                <span className="font-mono text-xs text-slate-600">
                  <strong className="text-slate-900 font-bold">{item.count}</strong> Dosen{' '}
                  <span className="text-slate-400 text-2xs font-normal">({item.percentage}%)</span>
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                {barWidth > 0 && (
                  <div
                    style={{ width: `${barWidth}%`, backgroundColor: item.color }}
                    className="h-full rounded-full transition-all duration-500 shadow-xs"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// 5. RASIO DOSEN BERSERTIFIKASI PENDIDIK (SERDOS)
// ============================================================================

export function SerdosRadialGauge({
  tersertifikasi,
  belumTersertifikasi,
  totalDosen,
  persentase,
}: {
  tersertifikasi: number;
  belumTersertifikasi: number;
  totalDosen: number;
  persentase: number;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col h-full">
      <div className="pb-3 border-b border-slate-100 space-y-1">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Award size={18} className="text-emerald-600 shrink-0" />
          <span>Rasio Dosen Bersertifikasi (Serdos)</span>
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Pencapaian kepemilikan Sertifikat Pendidik resmi Kemdikbudristek
        </p>
      </div>

      <div className="flex-1 flex flex-col sm:flex-row items-center justify-around gap-6 py-6 my-auto">
        {/* Radial Progress Gauge (CSS Conic-Gradient Ring: Hijau Lulus & Merah Belum) */}
        <div
          className="relative w-44 h-44 rounded-full flex items-center justify-center shrink-0 shadow-inner"
          style={{
            background: `conic-gradient(#10b981 ${persentase * 3.6}deg, #ef4444 ${persentase * 3.6}deg 360deg)`,
          }}
        >
          <div className="w-32 h-32 rounded-full bg-white flex flex-col items-center justify-center text-center shadow-xs p-2">
            <span className="text-3xl font-black text-slate-800 font-mono leading-none">
              {persentase}%
            </span>
            <span className="text-2xs font-semibold text-slate-500 mt-1">
              Tersertifikasi
            </span>
          </div>
        </div>

        {/* Legend Rincian Angka: Hijau (Lulus) vs Merah (Belum Serdos) */}
        <div className="flex flex-col gap-3 w-full sm:max-w-56">
          <div className="p-3 rounded-lg bg-emerald-50/80 border border-emerald-200/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-xs font-semibold text-emerald-950">Lulus Serdos</span>
            </div>
            <span className="font-mono font-bold text-xs text-emerald-800">{tersertifikasi} Dosen</span>
          </div>

          <div className="p-3 rounded-lg bg-rose-50/80 border border-rose-200/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
              <span className="text-xs font-semibold text-rose-950">Belum Serdos</span>
            </div>
            <span className="font-mono font-bold text-xs text-rose-700">{belumTersertifikasi} Dosen</span>
          </div>

          <div className="text-xs text-slate-500 px-1 pt-2 flex justify-between border-t border-slate-100">
            <span>Total Dosen Aktif:</span>
            <span className="font-mono font-bold text-xs text-slate-800">{totalDosen} Orang</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 6. PENYEBARAN KELOMPOK USIA & PROYEKSI PENSIUN
// ============================================================================

export function AgeDistributionChart({ data }: { data: AgeDistributionItem[] }) {
  const maxVal = Math.max(1, ...data.map((d) => d.count));
  const totalMpp = data.find((d) => d.is_mpp)?.count || 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
      <div className="pb-3 border-b border-slate-100 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Users size={18} className="text-sky-600 shrink-0" />
            <span>Distribusi Usia & Proyeksi Masa Pensiun (MPP)</span>
          </h3>
          {totalMpp > 0 && (
            <span className="text-2xs font-extrabold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 shrink-0">
              {totalMpp} Pegawai MPP
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Komposisi usia seluruh Dosen dan Tendik untuk regenerasi SDM kampus
        </p>
      </div>

      <div className="pt-6 pb-2">
        <div className="grid grid-cols-5 gap-3 sm:gap-4 h-48 items-end border-b border-slate-200 px-2">
          {data.map((item) => {
            const barHeight = Math.max(10, Math.min(100, (item.count / maxVal) * 100));

            return (
              <div key={item.group} className="flex flex-col items-center justify-end h-full group">
                <span className="text-xs font-mono font-bold text-slate-800 mb-1.5 text-center">
                  {item.count}{' '}
                  <span className="text-2xs font-normal text-slate-400">({item.percentage}%)</span>
                </span>

                <div
                  className={`w-full max-w-12 rounded-t-md transition-all duration-300 ${
                    item.is_mpp
                      ? 'bg-rose-500 ring-2 ring-rose-400/50 shadow-xs'
                      : 'hover:opacity-90'
                  }`}
                  style={{
                    height: `${barHeight}%`,
                    backgroundColor: item.is_mpp ? undefined : item.color,
                  }}
                />

                <span
                  className={`text-xs font-bold mt-2.5 text-center leading-tight ${
                    item.is_mpp ? 'text-rose-700 font-extrabold' : 'text-slate-800'
                  }`}
                >
                  {item.label}
                </span>
                <span className="text-2xs text-slate-400 text-center leading-none mt-1 hidden sm:block">
                  {item.sublabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
