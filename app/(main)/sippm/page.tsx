'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  ClipboardCheck,
  FileCheck,
  CreditCard,
  BookOpen,
  Award,
  Plus,
  ArrowRight,
  TrendingUp,
  Sliders,
} from 'lucide-react';
import { SippmHero } from '@/components/sippm/SippmHero';
import { sippmService } from '@/services/sippm.service';

export default function SippmDashboardPage() {
  const [upmMetrics, setUpmMetrics] = useState<any>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoadingMetrics(true);
        const res = await sippmService.getUpmMetrics();
        if (res.data) setUpmMetrics(res.data);
      } catch (err) {
        console.error('Failed to load UPM metrics', err);
      } finally {
        setLoadingMetrics(false);
      }
    };
    fetchMetrics();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Banner */}
      <SippmHero
        totalProposal={upmMetrics?.total_proposal || 12}
        totalDanaDisetujui={upmMetrics?.total_dana_approved || 350000000}
        totalPublikasi={upmMetrics?.total_publikasi_verified || 18}
      />

      {/* Main Menu Grid / Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Proposal Usulan */}
        <Link href="/sippm/proposal" className="card p-6 hover:shadow-lg transition-all duration-200 border-l-4 border-l-teal-600 group bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText size={24} />
            </div>
            <ArrowRight size={20} className="text-slate-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-lg font-black text-slate-900 group-hover:text-teal-700 transition-colors">Proposal Usulan Hibah</h3>
          <p className="text-xs text-slate-500 mt-1 font-medium">Pengajuan proposal riset & PkM, anggota tim, serta persetujuan LPPM.</p>
        </Link>

        {/* Card 2: Portal Reviewer */}
        <Link href="/sippm/reviewer" className="card p-6 hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-600 group bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ClipboardCheck size={24} />
            </div>
            <ArrowRight size={20} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-700 transition-colors">Portal Reviewer</h3>
          <p className="text-xs text-slate-500 mt-1 font-medium">Plotting Dual Reviewer LPPM & desk evaluation scoring rubrik.</p>
        </Link>

        {/* Card 3: Kontrak SPK */}
        <Link href="/sippm/kontrak" className="card p-6 hover:shadow-lg transition-all duration-200 border-l-4 border-l-amber-600 group bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileCheck size={24} />
            </div>
            <ArrowRight size={20} className="text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-lg font-black text-slate-900 group-hover:text-amber-700 transition-colors">Kontrak Hibah SPK</h3>
          <p className="text-xs text-slate-500 mt-1 font-medium">Penerbitan surat perjanjian kerja legal dan alokasi nominal disetujui.</p>
        </Link>

        {/* Card 4: Pencairan Dana & LPJ */}
        <Link href="/sippm/pencairan" className="card p-6 hover:shadow-lg transition-all duration-200 border-l-4 border-l-emerald-600 group bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CreditCard size={24} />
            </div>
            <ArrowRight size={20} className="text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-700 transition-colors">Pencairan Dana & LPJ</h3>
          <p className="text-xs text-slate-500 mt-1 font-medium">Disbursement Termin 1 (70%) & Termin 2 (30%) beserta LPJ keuangan.</p>
        </Link>

        {/* Card 5: Portofolio Publikasi & HKI */}
        <Link href="/sippm/luaran/publikasi" className="card p-6 hover:shadow-lg transition-all duration-200 border-l-4 border-l-purple-600 group bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen size={24} />
            </div>
            <ArrowRight size={20} className="text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-lg font-black text-slate-900 group-hover:text-purple-700 transition-colors">Publikasi & HKI Kampus</h3>
          <p className="text-xs text-slate-500 mt-1 font-medium">Registry luaran jurnal Scopus/SINTA serta sertifikat HKI/Paten.</p>
        </Link>

        {/* Card 6: Standar IKU 5 per Prodi */}
        <Link href="/sippm/iku5-standards" className="card p-6 hover:shadow-lg transition-all duration-200 border-l-4 border-l-fuchsia-600 group bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-fuchsia-50 text-fuchsia-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sliders size={24} />
            </div>
            <ArrowRight size={20} className="text-slate-400 group-hover:text-fuchsia-600 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-lg font-black text-slate-900 group-hover:text-fuchsia-700 transition-colors">Standar IKU 5 per Prodi</h3>
          <p className="text-xs text-slate-500 mt-1 font-medium">Konfigurasi target luaran Scopus, Sinta, Hibah & HKI per Program Studi.</p>
        </Link>
      </div>
    </div>
  );
}
