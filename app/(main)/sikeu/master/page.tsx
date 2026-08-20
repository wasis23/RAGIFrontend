'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Layers, Calendar, Wallet, Award, UserPlus, UserCheck, Building } from 'lucide-react';
import { JenisBiayaTab } from './_tabs/JenisBiayaTab';
import { JalurKelasTab } from './_tabs/JalurKelasTab';
import { TarifTab } from './_tabs/TarifTab';
import { BeasiswaTab } from './_tabs/BeasiswaTab';
import { StudentTypesTab } from './_tabs/StudentTypesTab';
import { MappingBeasiswaTab } from './_tabs/MappingBeasiswaTab';
import { UnitKasTab } from './_tabs/UnitKasTab';

type TabKey = 'jenis-biaya' | 'jalur-kelas' | 'tarif' | 'beasiswa' | 'student-types' | 'mapping-beasiswa' | 'unit-kas-master';

const TABS: { id: TabKey; label: string; icon: any }[] = [
  { id: 'jenis-biaya', label: 'Komponen Biaya', icon: Layers },
  { id: 'jalur-kelas', label: 'Jalur & Kelas', icon: Calendar },
  { id: 'tarif', label: 'Nominal Tarif', icon: Wallet },
  { id: 'beasiswa', label: 'Master Beasiswa', icon: Award },
  { id: 'student-types', label: 'Tipe Pendaftaran', icon: UserPlus },
  { id: 'mapping-beasiswa', label: 'Penerima Beasiswa', icon: UserCheck },
  { id: 'unit-kas-master', label: 'Unit Kas', icon: Building },
];

export default function MasterBiayaPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState<TabKey>('jenis-biaya');

  useEffect(() => {
    if (tabParam) {
      const valid = TABS.some(t => t.id === tabParam);
      if (valid) {
        setActiveTab(tabParam as TabKey);
      }
    }
  }, [tabParam]);

  const handleTabChange = (tabId: TabKey) => {
    setActiveTab(tabId);
    router.push(`/sikeu/master?tab=${tabId}`, { scroll: false });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* ── Tab Navigation ────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 no-scrollbar">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon size={15} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Active Tab Content ────────────────────────────────────────── */}
      {activeTab === 'jenis-biaya' && <JenisBiayaTab />}
      {activeTab === 'jalur-kelas' && <JalurKelasTab />}
      {activeTab === 'tarif' && <TarifTab />}
      {activeTab === 'beasiswa' && <BeasiswaTab />}
      {activeTab === 'student-types' && <StudentTypesTab />}
      {activeTab === 'mapping-beasiswa' && <MappingBeasiswaTab />}
      {activeTab === 'unit-kas-master' && <UnitKasTab />}
    </div>
  );
}
