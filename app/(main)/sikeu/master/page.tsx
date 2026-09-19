'use client';

import { useState, useEffect } from 'react';
import {
  Layers,
  Building2,
  Users,
  Sparkles,
  ArrowRight,
  Info,
  CreditCard,
  Banknote,
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
  SlidersHorizontal,
  UserCheck
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { JenisBiayaTab } from './_tabs/JenisBiayaTab';
import { UnitKasTab } from './_tabs/UnitKasTab';
import { BeasiswaTab } from './_tabs/BeasiswaTab';

type GlobalMasterTab = 'jenis_biaya' | 'beasiswa' | 'unit_kas';

export default function MasterKeuanganGlobalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabQuery = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<GlobalMasterTab>('jenis_biaya');

  useEffect(() => {
    if (tabQuery === 'mapping_beasiswa') {
      router.replace('/siakad/civitas/beasiswa');
      return;
    }
    if (tabQuery === 'potongan_khusus') {
      router.replace('/sikeu/mahasiswa/potongan');
      return;
    }
    if (tabQuery && ['jenis_biaya', 'beasiswa', 'unit_kas'].includes(tabQuery)) {
      setActiveTab(tabQuery as GlobalMasterTab);
    }
  }, [tabQuery, router]);

  return (
    <div className="w-full space-y-6 animate-fade-in pb-6">
      {/* Page Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'Keuangan', href: '/sikeu' },
          { label: 'Master Keuangan' },
        ]}
        title="Master & Katalog Keuangan Global"
        description="Kelola kamus komponen biaya institusi, skema beasiswa/diskon, penetapan potongan mahasiswa, dan unit kas kampus."
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/sikeu/mahasiswa/tarif"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 transition-all shadow-xs"
            >
              <DollarSign size={14} />
              Pengaturan Tarif Mahasiswa <ArrowRight size={13} />
            </Link>
            <Link
              href="/sikeu/panduan"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-primary-700 bg-primary-50 border border-primary-200/80 hover:bg-primary-100 transition-all shadow-2xs"
            >
              <Sparkles size={14} className="text-primary-600" />
              Panduan SIKEU <ArrowUpRight size={13} />
            </Link>
          </div>
        }
      />

      {/* Navigation Tabs (Mengikuti Format Simpeg Presensi) */}
      <div className="flex border-b border-slate-200 gap-1 sm:gap-2 overflow-x-auto pb-0.5">
        <button
          type="button"
          onClick={() => setActiveTab('jenis_biaya')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'jenis_biaya'
              ? 'border-primary-600 text-primary-700 bg-primary-50/60'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/70'
          }`}
        >
          <Layers size={15} className={activeTab === 'jenis_biaya' ? 'text-primary-600' : 'text-slate-400'} />
          <span>Katalog Komponen Biaya</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('beasiswa')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'beasiswa'
              ? 'border-primary-600 text-primary-700 bg-primary-50/60'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/70'
          }`}
        >
          <ShieldCheck size={15} className={activeTab === 'beasiswa' ? 'text-primary-600' : 'text-slate-400'} />
          <span>Skema Program Beasiswa</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('unit_kas')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'unit_kas'
              ? 'border-primary-600 text-primary-700 bg-primary-50/60'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/70'
          }`}
        >
          <Building2 size={15} className={activeTab === 'unit_kas' ? 'text-primary-600' : 'text-slate-400'} />
          <span>Unit Kas & Rekening</span>
        </button>
      </div>

      {/* Helper Banner */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Info size={16} className="text-primary-600 shrink-0" />
          <span>
            Sedang mengelola:{' '}
            <strong>
              {activeTab === 'jenis_biaya'
                ? 'Katalog Komponen Biaya Kampus'
                : activeTab === 'beasiswa'
                ? 'Master Skema Program Beasiswa Institusi (Pemotongan Biaya)'
                : 'Unit Kas & Rekening Bank'}
            </strong>
            . Penetapan penerima beasiswa dikelola oleh BAAK di modul SIAKAD, dan potongan khusus per mahasiswa dikelola di menu Potongan Khusus.
          </span>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="w-full space-y-6">
        {activeTab === 'jenis_biaya' && <JenisBiayaTab />}
        {activeTab === 'beasiswa' && <BeasiswaTab />}
        {activeTab === 'unit_kas' && <UnitKasTab />}
      </div>
    </div>
  );
}
