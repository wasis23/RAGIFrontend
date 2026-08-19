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
  Layers,
} from 'lucide-react';
import { Hero } from '@/components/ui/Hero';

interface SippmHeroProps {
  title?: string;
  subtitle?: string;
  totalProposal?: number;
  totalDanaDisetujui?: number;
  totalPublikasi?: number;
  activePeriodeName?: string;
  showActions?: boolean;
  capaianIku?: number;
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
    <Hero
      badge={
        <span className="flex items-center gap-2">
          <span className="flex items-center gap-1.5">
            <FlaskConical size={14} /> SIPPM Academic Ecosystem
          </span>
          <span className="badge badge-sippm">{activePeriodeName}</span>
        </span>
      }
      title={title}
      description={subtitle}
      actions={
        showActions ? (
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/sippm/proposal/create" className="btn hero-btn-white">
              <FilePlus size={16} /> Ajukan Proposal Baru
            </Link>
            <Link href="/sippm/reviewer" className="btn hero-btn-glass">
              <ClipboardCheck size={16} /> Portal Reviewer
            </Link>
            <Link href="/sippm/skema" className="btn hero-btn-glass">
              <Layers size={16} /> Master Skema
            </Link>
          </div>
        ) : undefined
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 min-w-[320px] mt-6">
        <div className="hero-metric">
          <div className="flex items-center gap-2 text-teal-100 text-xs font-semibold mb-1">
            <BookOpen size={14} /> Total Proposal
          </div>
          <div className="text-xl md:text-2xl font-extrabold text-white">
            {totalProposal}
          </div>
          <div className="text-[11px] text-teal-200 mt-0.5">Penelitian & PkM</div>
        </div>

        <div className="hero-metric">
          <div className="flex items-center gap-2 text-teal-100 text-xs font-semibold mb-1">
            <DollarSign size={14} /> Hibah Approved
          </div>
          <div className="text-lg md:text-xl font-extrabold text-white">
            {totalDanaDisetujui > 0 ? formatRupiah(totalDanaDisetujui) : 'Rp 0'}
          </div>
          <div className="text-[11px] text-teal-200 mt-0.5">Alokasi Anggaran</div>
        </div>

        <div className="hero-metric col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 text-teal-100 text-xs font-semibold mb-1">
            <Award size={14} /> Target Luaran
          </div>
          <div className="text-xl md:text-2xl font-extrabold text-white">
            {totalPublikasi}
          </div>
          <div className="text-[11px] text-teal-200 mt-0.5">Scopus & Sinta</div>
        </div>
      </div>
    </Hero>
  );
}