'use client';

import React from 'react';
import Link from 'next/link';
import {
  FlaskConical,
  FilePlus,
  ClipboardCheck,
  Award,
  BookOpen,
  DollarSign,
  TrendingUp,
  Layers,
} from 'lucide-react';

interface SippmHeroProps {
  title?: string;
  subtitle?: string;
  totalProposal?: number;
  totalDanaDisetujui?: number;
  totalPublikasi?: number;
  activePeriodeName?: string;
  showActions?: boolean;
}

export function SippmHero({
  title = 'Sistem Informasi Penelitian & Pengabdian Masyarakat (SIPPM)',
  subtitle = 'Kelola pengajuan proposal riset, penilaian reviewer, kontrak hibah, serta portofolio publikasi & HKI secara profesional.',
  totalProposal = 0,
  totalDanaDisetujui = 0,
  totalPublikasi = 0,
  activePeriodeName = 'TA 2026/2027',
  showActions = true,
}: SippmHeroProps) {
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="bg-sippm-hero p-6 md:p-8 mb-6 shadow-lg relative overflow-hidden">
      {/* Background Decorative Rings */}
      <div
        className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full"
        style={{ background: 'rgba(255, 255, 255, 0.05)', pointerEvents: 'none' }}
      />
      <div
        className="absolute right-40 -top-20 w-48 h-48 rounded-full"
        style={{ background: 'rgba(255, 255, 255, 0.03)', pointerEvents: 'none' }}
      />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Column: Info & Action */}
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(255, 255, 255, 0.18)', backdropFilter: 'blur(4px)', color: '#ffffff' }}
            >
              <FlaskConical size={14} /> SIPPM Academic Ecosystem
            </span>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(204, 251, 241, 0.25)', color: '#ccfbf1', border: '1px solid rgba(204, 251, 241, 0.3)' }}
            >
              {activePeriodeName}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-2 leading-tight">
            {title}
          </h1>

          <p className="text-teal-100 text-sm md:text-base mb-6 opacity-90 font-medium leading-relaxed">
            {subtitle}
          </p>

          {showActions && (
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/sippm/proposal/create" className="btn btn-secondary text-teal-950 font-bold bg-white hover:bg-teal-50 border-none shadow-md">
                <FilePlus size={16} /> Ajukan Proposal Baru
              </Link>
              <Link
                href="/sippm/reviewer"
                className="btn text-white hover:bg-white/20 transition-all font-semibold"
                style={{
                  color: '#ffffff',
                  borderColor: 'rgba(255, 255, 255, 0.4)',
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(4px)',
                }}
              >
                <ClipboardCheck size={16} color="#ffffff" /> <span style={{ color: '#ffffff' }}>Portal Reviewer</span>
              </Link>
              <Link
                href="/sippm/skema"
                className="btn text-white hover:bg-white/20 transition-all font-semibold"
                style={{
                  color: '#ffffff',
                  borderColor: 'rgba(255, 255, 255, 0.4)',
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(4px)',
                }}
              >
                <Layers size={16} color="#ffffff" /> <span style={{ color: '#ffffff' }}>Master Skema</span>
              </Link>
            </div>
          )}
        </div>

        {/* Right Column: Metric Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 min-w-[320px]">
          <div className="p-3.5 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.18)' }}>
            <div className="flex items-center gap-2 text-teal-100 text-xs font-semibold mb-1">
              <BookOpen size={14} /> Total Proposal
            </div>
            <div className="text-xl md:text-2xl font-extrabold text-white">
              {totalProposal}
            </div>
            <div className="text-[11px] text-teal-200 mt-0.5">Penelitian & PkM</div>
          </div>

          <div className="p-3.5 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.18)' }}>
            <div className="flex items-center gap-2 text-teal-100 text-xs font-semibold mb-1">
              <DollarSign size={14} /> Hibah Approved
            </div>
            <div className="text-lg md:text-xl font-extrabold text-white">
              {totalDanaDisetujui > 0 ? formatRupiah(totalDanaDisetujui) : 'Rp 0'}
            </div>
            <div className="text-[11px] text-teal-200 mt-0.5">Alokasi Anggaran</div>
          </div>

          <div className="p-3.5 rounded-xl col-span-2 md:col-span-1" style={{ background: 'rgba(255, 255, 255, 0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.18)' }}>
            <div className="flex items-center gap-2 text-teal-100 text-xs font-semibold mb-1">
              <Award size={14} /> Target Luaran
            </div>
            <div className="text-xl md:text-2xl font-extrabold text-white">
              {totalPublikasi}
            </div>
            <div className="text-[11px] text-teal-200 mt-0.5">Scopus & Sinta</div>
          </div>
        </div>
      </div>
    </div>
  );
}
