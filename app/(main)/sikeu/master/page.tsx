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
    <div className="w-full space-y-6 animate-fade-in pb-16">
      {/* Page Header */}
      <PageHeader
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

      {/* Visual Navigation Hub */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <DollarSign size={16} className="text-primary-600" />
            Pusat Pengaturan Tarif, Beasiswa, & Biaya Pendidikan
          </h2>
          <Link
            href="/sikeu/mahasiswa/tarif"
            className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            Buka Pengaturan Lengkap <ArrowRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Matriks Tarif */}
          <Link
            href="/sikeu/mahasiswa/tarif"
            className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-primary-300 hover:shadow-md transition-all space-y-2 block group"
          >
            <div className="flex items-center justify-between">
              <span className="p-2 bg-primary-50 text-primary-600 rounded-xl group-hover:scale-105 transition-transform">
                <DollarSign size={18} />
              </span>
              <span className="text-2xs font-extrabold px-2 py-0.5 rounded-md bg-primary-100 text-primary-700">
                Wajib Disetel
              </span>
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-primary-600 transition-colors">
                1. Matriks Tarif Angkatan
              </h3>
              <p className="text-2xs text-slate-500 mt-0.5">Penetapan nominal biaya per Angkatan, Prodi, & Semester.</p>
            </div>
          </Link>

          {/* Card 2: Skema Beasiswa & Diskon */}
          <button
            type="button"
            onClick={() => setActiveTab('beasiswa')}
            className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-300 hover:shadow-md transition-all space-y-2 block text-left group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-105 transition-transform">
                <ShieldCheck size={18} />
              </span>
              <span className="text-2xs font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700">
                Program Beasiswa
              </span>
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                2. Skema Beasiswa & Diskon
              </h3>
              <p className="text-2xs text-slate-500 mt-0.5">KIP-K, Tahfidz, Yayasan & persentase/nominal potongan.</p>
            </div>
          </button>

          {/* Card 3: Potongan Khusus Mahasiswa */}
          <Link
            href="/sikeu/mahasiswa/potongan"
            className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-amber-300 hover:shadow-md transition-all space-y-2 block text-left group"
          >
            <div className="flex items-center justify-between">
              <span className="p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-105 transition-transform">
                <Sparkles size={18} />
              </span>
              <span className="text-2xs font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-700">
                Menu Potongan
              </span>
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                3. Potongan Khusus Mahasiswa
              </h3>
              <p className="text-2xs text-slate-500 mt-0.5">Diskon SK Rektor, saudara kandung, & anak staf/dosen.</p>
            </div>
          </Link>

          {/* Card 4: Golongan UKT */}
          <Link
            href="/sikeu/mahasiswa/tarif"
            className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-indigo-300 hover:shadow-md transition-all space-y-2 block group"
          >
            <div className="flex items-center justify-between">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-105 transition-transform">
                <SlidersHorizontal size={18} />
              </span>
              <span className="text-2xs font-semibold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700">
                Subsidi Silang
              </span>
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                4. Golongan UKT (I - VIII)
              </h3>
              <p className="text-2xs text-slate-500 mt-0.5">Skema pengelompokan nominal UKT berjenjang.</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Global Master Direct Tabs Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Tab 1: Kamus Komponen Biaya */}
        <div className={`p-4 rounded-2xl border transition-all space-y-2 ${
          activeTab === 'jenis_biaya' ? 'bg-primary-50/60 border-primary-300 shadow-xs' : 'bg-white border-slate-200 hover:border-slate-300'
        }`}>
          <div className="flex items-center justify-between">
            <span className="p-2 bg-primary-100 text-primary-700 rounded-xl">
              <Layers size={18} />
            </span>
            <span className="text-2xs font-bold px-2 py-0.5 rounded-md bg-primary-600 text-white uppercase tracking-wider">
              Katalog
            </span>
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900">Komponen Biaya Institusi</h3>
            <p className="text-2xs text-slate-500 mt-0.5">Kamus master jenis biaya, tagihan, & akun COA.</p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('jenis_biaya')}
            className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
              activeTab === 'jenis_biaya' ? 'bg-primary-600 text-white' : 'bg-white text-primary-700 border border-primary-200 hover:bg-primary-50'
            }`}
          >
            <span>Buka Komponen</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Tab 2: Skema Beasiswa & Diskon */}
        <div className={`p-4 rounded-2xl border transition-all space-y-2 ${
          activeTab === 'beasiswa' ? 'bg-emerald-50/60 border-emerald-300 shadow-xs' : 'bg-white border-slate-200 hover:border-slate-300'
        }`}>
          <div className="flex items-center justify-between">
            <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <ShieldCheck size={18} />
            </span>
            <span className="text-2xs font-bold px-2 py-0.5 rounded-md bg-emerald-600 text-white uppercase tracking-wider">
              Program
            </span>
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900">Program Beasiswa</h3>
            <p className="text-2xs text-slate-500 mt-0.5">Skema program beasiswa KIP, Tahfidz, & Yayasan (diatur SIKEU).</p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('beasiswa')}
            className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
              activeTab === 'beasiswa' ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            <span>Buka Program Beasiswa</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Tab 3: Unit Kas & Rekening */}
        <div className={`p-4 rounded-2xl border transition-all space-y-2 ${
          activeTab === 'unit_kas' ? 'bg-indigo-50/60 border-indigo-300 shadow-xs' : 'bg-white border-slate-200 hover:border-slate-300'
        }`}>
          <div className="flex items-center justify-between">
            <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <Building2 size={18} />
            </span>
            <span className="text-2xs font-bold px-2 py-0.5 rounded-md bg-indigo-600 text-white uppercase tracking-wider">
              Kas & Bank
            </span>
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900">Unit Kas & Rekening</h3>
            <p className="text-2xs text-slate-500 mt-0.5">Kas utama rektorat, petty cash unit fakultas, & bank.</p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('unit_kas')}
            className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
              activeTab === 'unit_kas' ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50'
            }`}
          >
            <span>Buka Unit Kas</span>
            <ArrowRight size={13} />
          </button>
        </div>
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
