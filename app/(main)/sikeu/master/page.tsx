'use client';

import { useState } from 'react';
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
  SlidersHorizontal
} from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { JenisBiayaTab } from './_tabs/JenisBiayaTab';
import { UnitKasTab } from './_tabs/UnitKasTab';

type GlobalMasterTab = 'jenis_biaya' | 'unit_kas';

export default function MasterKeuanganGlobalPage() {
  const [activeTab, setActiveTab] = useState<GlobalMasterTab>('jenis_biaya');

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <PageHeader
        title="Master & Katalog Keuangan Global"
        description="Kelola kamus komponen biaya institusi, delegasi modul aplikasi, dan unit kas / rekening bank kampus."
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

      {/* Visual Navigation Hub for All SIKEU Master & Billing Features */}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
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
                1. Matriks Tarif Angkatan & Semester
              </h3>
              <p className="text-2xs text-slate-500 mt-0.5">Penetapan nominal biaya riil per Angkatan (2024, 2025, dst), Prodi, & Semester 1-8.</p>
            </div>
          </Link>

          {/* Card 2: Beasiswa & Diskon */}
          <Link
            href="/sikeu/mahasiswa/tarif"
            className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-300 hover:shadow-md transition-all space-y-2 block group"
          >
            <div className="flex items-center justify-between">
              <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-105 transition-transform">
                <ShieldCheck size={18} />
              </span>
              <span className="text-2xs font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700">
                Auto-Potongan
              </span>
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                2. Beasiswa & Penetapan Penerima
              </h3>
              <p className="text-2xs text-slate-500 mt-0.5">Program KIP-K, Yayasan, Tahfidz & penetapan mahasiswa penerima diskon otomatis.</p>
            </div>
          </Link>

          {/* Card 3: Golongan UKT */}
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
                3. Tarif Golongan UKT (I - VIII)
              </h3>
              <p className="text-2xs text-slate-500 mt-0.5">Skema pengelompokan nominal UKT berdasarkan kemampuan finansial mahasiswa.</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Global Master Direct Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-linear-to-br from-primary-50 to-white border border-primary-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="p-2 bg-primary-100 text-primary-700 rounded-xl">
              <Layers size={18} />
            </span>
            <span className="text-2xs font-bold px-2 py-0.5 rounded-md bg-primary-600 text-white uppercase tracking-wider">
              Katalog Master
            </span>
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900">Kamus Komponen Biaya</h3>
            <p className="text-2xs text-slate-500 mt-0.5">Daftar jenis pungutan & delegasi modul lintas sistem.</p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('jenis_biaya')}
            className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
              activeTab === 'jenis_biaya' ? 'bg-primary-600 text-white' : 'bg-white text-primary-700 border border-primary-200 hover:bg-primary-50'
            }`}
          >
            <span>Buka Katalog Biaya</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-linear-to-br from-indigo-50 to-white border border-indigo-200/80 shadow-2xs space-y-2">
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
            <p className="text-2xs text-slate-500 mt-0.5">Kas rektorat, petty cash unit fakultas, & bank.</p>
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

        <Link
          href="/sikeu/master/gaji-pegawai"
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all space-y-2 block group"
        >
          <div className="flex items-center justify-between">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-105 transition-transform">
              <Banknote size={18} />
            </span>
            <span className="text-2xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
              SIMPEG Hub
            </span>
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 group-hover:text-primary-600 transition-colors">
              Tarif Gaji Pegawai
            </h3>
            <p className="text-2xs text-slate-500 mt-0.5">Setting gaji pokok, tunjangan & transport dosen/tendik.</p>
          </div>
          <div className="text-2xs font-bold text-primary-600 flex items-center gap-1 pt-1">
            <span>Atur Gaji Pegawai</span>
            <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        <Link
          href="/sikeu/payment-gateway"
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all space-y-2 block group"
        >
          <div className="flex items-center justify-between">
            <span className="p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-105 transition-transform">
              <CreditCard size={18} />
            </span>
            <span className="text-2xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
              Integrasi Bank
            </span>
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 group-hover:text-primary-600 transition-colors">
              Payment Gateway
            </h3>
            <p className="text-2xs text-slate-500 mt-0.5">Konfigurasi Virtual Account & Webhook Gateway.</p>
          </div>
          <div className="text-2xs font-bold text-primary-600 flex items-center gap-1 pt-1">
            <span>Atur Payment Gateway</span>
            <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Helper Banner */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Info size={16} className="text-primary-600 shrink-0" />
          <span>
            Sedang mengelola: <strong>{activeTab === 'jenis_biaya' ? 'Katalog Komponen Biaya Kampus' : 'Unit Kas & Rekening Bank'}</strong>.
          </span>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="bg-white p-5 md:p-7 rounded-2xl border border-slate-200 shadow-2xs">
        {activeTab === 'jenis_biaya' && <JenisBiayaTab />}
        {activeTab === 'unit_kas' && <UnitKasTab />}
      </div>
    </div>
  );
}
