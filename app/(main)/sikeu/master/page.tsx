'use client';

import { useState } from 'react';
import {
  Layers,
  DollarSign,
  Bookmark,
  Users,
  ShieldCheck,
  Building2,
  SlidersHorizontal,
  GraduationCap,
  Sparkles,
  Info,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { JenisBiayaTab } from './_tabs/JenisBiayaTab';
import { SettingTarifTab } from './_tabs/SettingTarifTab';
import { JalurKelasTab } from './_tabs/JalurKelasTab';
import { TarifTab } from './_tabs/TarifTab';
import { BeasiswaTab } from './_tabs/BeasiswaTab';
import { MappingBeasiswaTab } from './_tabs/MappingBeasiswaTab';
import { StudentTypesTab } from './_tabs/StudentTypesTab';
import { UnitKasTab } from './_tabs/UnitKasTab';

// Kelompok Kategori Utama agar alur logis & tidak membingungkan
type CategoryId = 'tarif' | 'mahasiswa' | 'kas';

interface MasterSubTab {
  id: string;
  label: string;
  badge?: string;
  description: string;
  icon: React.ElementType;
}

const CATEGORIES: {
  id: CategoryId;
  label: string;
  shortDesc: string;
  subTabs: MasterSubTab[];
}[] = [
  {
    id: 'tarif',
    label: '1. Tarif & Komponen Biaya',
    shortDesc: 'Atur jenis biaya kuliah, skema tarif semesteran, & jalur masuk.',
    subTabs: [
      {
        id: 'jenis_biaya',
        label: '1. Daftar Komponen Biaya',
        badge: 'Master Biaya',
        description: 'Katalog jenis biaya (SPP, SKS, Praktikum, Wisuda, Formulir SPMB, Biaya Lainnya) & delegasi modul.',
        icon: Layers,
      },
      {
        id: 'setting_tarif',
        label: '2. Matriks Tarif Angkatan & Semester',
        badge: 'Acuan Tagihan',
        description: 'Penetapan nominal SPP/UKT riil per Angkatan, Prodi, dan Semester untuk tagihan masal.',
        icon: DollarSign,
      },
      {
        id: 'tarif_ukt',
        label: '3. Tarif UKT Kelompok (I - VIII)',
        description: 'Pengelompokan besaran UKT berbasis subsidi / golongan ekonomi mahasiswa.',
        icon: SlidersHorizontal,
      },
      {
        id: 'jalur_kelas',
        label: '4. Jalur & Kelas Kuliah',
        description: 'Daftar jalur masuk perkuliahan (Reguler, Karyawan/Eksekutif, Internasional, Online).',
        icon: Bookmark,
      },
    ],
  },
  {
    id: 'mahasiswa',
    label: '2. Mahasiswa & Keringanan',
    shortDesc: 'Penetapan tipe tagihan mahasiswa dan pengelolaan potongan beasiswa.',
    subTabs: [
      {
        id: 'student_types',
        label: 'Penetapan Tipe Tagihan Mahasiswa',
        badge: 'Mapping Mhs',
        description: 'Data mahasiswa aktif beserta kelompok UKT & jalur kelasnya untuk penagihan.',
        icon: Users,
      },
      {
        id: 'beasiswa',
        label: 'Program Beasiswa & Potongan',
        description: 'Master program beasiswa (KIP, Yayasan, Prestasi) & tipe pemotongan tagihan.',
        icon: ShieldCheck,
      },
      {
        id: 'mapping_beasiswa',
        label: 'Penerima Beasiswa',
        description: 'Daftar mahasiswa penerima subsidi beasiswa yang memotong invoice secara otomatis.',
        icon: GraduationCap,
      },
    ],
  },
  {
    id: 'kas',
    label: '3. Kas & Rekening',
    shortDesc: 'Pengelolaan akun kas operasional kampus dan rekening penerimaan.',
    subTabs: [
      {
        id: 'unit_kas',
        label: 'Unit Kas & Rekening Bank',
        description: 'Kas utama rektorat, petty cash unit fakultas, & rekening penerimaan bank.',
        icon: Building2,
      },
    ],
  },
];

export default function MasterBiayaPage() {
  const [activeCategory, setActiveCategory] = useState<CategoryId>('tarif');
  const [activeTab, setActiveTab] = useState<string>('jenis_biaya');

  const currentCategoryData = CATEGORIES.find((c) => c.id === activeCategory);

  const handleSelectCategory = (catId: CategoryId) => {
    setActiveCategory(catId);
    const firstSubTab = CATEGORIES.find((c) => c.id === catId)?.subTabs[0];
    if (firstSubTab) {
      setActiveTab(firstSubTab.id);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <PageHeader
        title="Master & Konfigurasi Keuangan"
        description="Kelola tarif perkuliahan, tipe tagihan mahasiswa, program beasiswa, dan unit kas operasional dalam alur yang terpadu."
        action={
          <Link
            href="/sikeu/panduan"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-primary-700 bg-primary-50 border border-primary-200/80 hover:bg-primary-100 transition-all shadow-xs"
          >
            <Sparkles size={14} className="text-primary-600" />
            Panduan Alur Sistem Keuangan <ArrowUpRight size={14} />
          </Link>
        }
      />

      {/* Step Indicator / 3 Main Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {CATEGORIES.map((cat, idx) => {
          const isSelected = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleSelectCategory(cat.id)}
              className={`p-4 rounded-2xl border text-left transition-all duration-200 relative overflow-hidden group ${
                isSelected
                  ? 'bg-gradient-to-br from-primary-50 via-white to-blue-50/40 border-primary-300 shadow-md ring-2 ring-primary-500/20'
                  : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/60 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-2xs font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    isSelected
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                  }`}
                >
                  Langkah {idx + 1}
                </span>
                <span className="text-2xs text-slate-400 font-semibold">
                  {cat.subTabs.length} Menu
                </span>
              </div>
              <h3
                className={`font-bold text-sm tracking-tight mb-1 ${
                  isSelected ? 'text-primary-900' : 'text-slate-800'
                }`}
              >
                {cat.label}
              </h3>
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                {cat.shortDesc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Sub-Tabs Pills Selector with Descriptions */}
      <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {currentCategoryData?.subTabs.map((subTab) => {
            const Icon = subTab.icon;
            const isTabActive = activeTab === subTab.id;

            return (
              <button
                key={subTab.id}
                type="button"
                onClick={() => setActiveTab(subTab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all duration-150 ${
                  isTabActive
                    ? 'bg-white text-primary-700 shadow-sm border border-slate-200/80 ring-1 ring-primary-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Icon
                  size={15}
                  className={isTabActive ? 'text-primary-600' : 'text-slate-400'}
                />
                <span>{subTab.label}</span>
                {subTab.badge && (
                  <span
                    className={`text-2xs px-1.5 py-0.2 rounded font-semibold ${
                      isTabActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {subTab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Current Active SubTab Description Helper Banner */}
        {(() => {
          const currentTabMeta = currentCategoryData?.subTabs.find(
            (t) => t.id === activeTab
          );
          if (!currentTabMeta) return null;
          return (
            <div className="mt-2.5 px-3 py-2 bg-white/70 rounded-xl border border-slate-200/60 flex items-center gap-2 text-xs text-slate-600">
              <Info size={14} className="text-primary-600 flex-shrink-0" />
              <span>{currentTabMeta.description}</span>
            </div>
          );
        })()}
      </div>

      {/* Tab Content Body Container */}
      <div className="bg-white p-5 md:p-7 rounded-2xl border border-slate-200 shadow-xs">
        {activeTab === 'setting_tarif' && <SettingTarifTab />}
        {activeTab === 'jenis_biaya' && <JenisBiayaTab />}
        {activeTab === 'tarif_ukt' && <TarifTab />}
        {activeTab === 'jalur_kelas' && <JalurKelasTab />}
        {activeTab === 'student_types' && <StudentTypesTab />}
        {activeTab === 'beasiswa' && <BeasiswaTab />}
        {activeTab === 'mapping_beasiswa' && <MappingBeasiswaTab />}
        {activeTab === 'unit_kas' && <UnitKasTab />}
      </div>
    </div>
  );
}
