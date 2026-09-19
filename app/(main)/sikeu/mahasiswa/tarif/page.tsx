'use client';

import { useState, useEffect } from 'react';
import {
  DollarSign,
  Bookmark,
  Users,
  ShieldCheck,
  SlidersHorizontal,
  Info,
  Loader2,
} from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { SettingTarifTab } from '../../master/_tabs/SettingTarifTab';
import { TarifTab } from '../../master/_tabs/TarifTab';
import { JalurKelasTab } from '../../master/_tabs/JalurKelasTab';
import { StudentTypesTab } from '../../master/_tabs/StudentTypesTab';
import { BeasiswaTab } from '../../master/_tabs/BeasiswaTab';

interface TabItem {
  id: string;
  label: string;
  badge?: string;
  description: string;
  icon: React.ElementType;
}

export default function PengaturanTarifMahasiswaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabQuery = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<string>(tabQuery || 'setting_tarif');
  const [headerAction, setHeaderAction] = useState<React.ReactNode>(null);
  const [isUktEnabled, setIsUktEnabled] = useState(true);
  const [loadingSetting, setLoadingSetting] = useState(false);
  const [togglingUkt, setTogglingUkt] = useState(false);

  useEffect(() => {
    if (tabQuery === 'mapping_beasiswa') {
      router.replace('/siakad/civitas/beasiswa');
      return;
    }
    if (tabQuery === 'potongan_khusus') {
      router.replace('/sikeu/mahasiswa/potongan');
      return;
    }
    if (tabQuery) {
      const validTabs = [
        'setting_tarif',
        'tarif_ukt',
        'jalur_kelas',
        'student_types',
        'beasiswa',
      ];
      if (validTabs.includes(tabQuery)) {
        setActiveTab(tabQuery);
      }
    }
  }, [tabQuery, router]);

  useEffect(() => {
    const fetchSetting = async () => {
      try {
        setLoadingSetting(true);
        const res = await sikeuService.getUktSetting();
        if (res.data && typeof res.data.enabled === 'boolean') {
          setIsUktEnabled(res.data.enabled);
        }
      } catch {
        // Default to true
      } finally {
        setLoadingSetting(false);
      }
    };
    fetchSetting();
  }, []);

  const handleToggleUkt = async () => {
    const nextState = !isUktEnabled;
    setTogglingUkt(true);
    try {
      await sikeuService.updateUktSetting(nextState);
      setIsUktEnabled(nextState);
      toast.success(
        nextState
          ? 'Skema Golongan UKT (I - VIII) berhasil DIAKTIFKAN.'
          : 'Skema Golongan UKT DINONAKTIFKAN. Sistem beralih ke Flat Tarif Matriks Semester.'
      );
    } catch {
      toast.error('Gagal memperbarui pengaturan Golongan UKT');
    } finally {
      setTogglingUkt(false);
    }
  };

  const tabs: TabItem[] = [
    {
      id: 'setting_tarif',
      label: '1. Matriks Tarif Angkatan & Semester',
      badge: 'Acuan Utama',
      description: 'Penetapan nominal biaya SPP/UKT riil per Tahun Angkatan (2023, 2024, 2025, 2026), Program Studi, Semester 1-8, & Jalur Kelas.',
      icon: DollarSign,
    },
    {
      id: 'tarif_ukt',
      label: '2. Tarif Golongan UKT (I - VIII)',
      badge: isUktEnabled ? 'Aktif' : 'Non-Aktif',
      description: isUktEnabled
        ? 'Master pengelompokan besaran UKT berbasis subsidi / golongan ekonomi mahasiswa.'
        : '⚠️ Skema Golongan UKT sedang DINONAKTIFKAN. Tagihan mahasiswa saat ini menggunakan Flat Tarif dari Matriks Tarif.',
      icon: SlidersHorizontal,
    },
    {
      id: 'jalur_kelas',
      label: '3. Jalur & Kelas Kuliah',
      description: 'Daftar jalur masuk perkuliahan (Reguler, Karyawan/Eksekutif, Internasional, Online).',
      icon: Bookmark,
    },
    {
      id: 'student_types',
      label: '4. Penetapan Tipe Tagihan Mahasiswa',
      badge: 'Mapping Mhs',
      description: 'Pemetaan mahasiswa aktif ke kelompok UKT dan jalur kelas masing-masing untuk penerbitan tagihan.',
      icon: Users,
    },
    {
      id: 'beasiswa',
      label: '5. Program Beasiswa & Potongan',
      badge: 'Master Skema',
      description: 'Master program beasiswa (KIP-Kuliah, Yayasan, Prestasi, Tahfidz) beserta konfigurasi pemotongan biaya. Penetapan mahasiswa penerima diatur oleh BAAK di modul SIAKAD.',
      icon: ShieldCheck,
    },
  ];

  const currentTabMeta = tabs.find((t) => t.id === activeTab);

  return (
    <div className="w-full space-y-6 animate-fade-in pb-6">
      {/* Page Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'Keuangan', href: '/sikeu' },
          { label: 'Mahasiswa', href: '/sikeu/mahasiswa/tagihan' },
          { label: 'Pengaturan Tarif' },
        ]}
        title="Pengaturan Tarif & Beasiswa Mahasiswa"
        description="Kelola matriks tarif per angkatan, golongan UKT, jalur kelas, dan subsidi beasiswa yang menjadi acuan penerbitan tagihan mahasiswa."
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              onClick={handleToggleUkt}
              disabled={togglingUkt || loadingSetting}
              icon={
                togglingUkt ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <SlidersHorizontal size={15} className={isUktEnabled ? 'text-primary-600' : 'text-slate-400'} />
                )
              }
              className="font-bold min-h-[38px] text-xs"
            >
              <span>Skema UKT:</span>
              <span className={isUktEnabled ? 'text-primary-700 font-extrabold' : 'text-slate-500 font-semibold'}>
                {isUktEnabled ? 'ON' : 'OFF'}
              </span>
              <span className={`w-1.5 h-1.5 rounded-full ${isUktEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            </Button>
            {headerAction}
          </div>
        }
      />

      {/* Modern Navigation Tabs (Mengikuti Format Simpeg Presensi) */}
      <div className="space-y-3">
        <div className="flex border-b border-slate-200 gap-1 sm:gap-2 overflow-x-auto pb-0.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isTabActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setHeaderAction(null);
                  setActiveTab(tab.id);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                  isTabActive
                    ? 'border-primary-600 text-primary-700 bg-primary-50/60'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/70'
                }`}
              >
                <Icon
                  size={15}
                  className={isTabActive ? 'text-primary-600' : 'text-slate-400'}
                />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-2xs px-1.5 py-0.5 rounded font-semibold ${
                      isTabActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-slate-200/80 text-slate-600'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Current Active SubTab Description Helper Banner */}
        {currentTabMeta && (
          <div className="px-3.5 py-2 bg-slate-50/90 rounded-xl border border-slate-200/70 flex items-center gap-2 text-xs text-slate-600">
            <Info size={14} className="text-primary-600 shrink-0" />
            <span>{currentTabMeta.description}</span>
          </div>
        )}
      </div>

      {/* Tab Content Body Container */}
      <div className="w-full space-y-6">
        {activeTab === 'setting_tarif' && <SettingTarifTab setHeaderAction={setHeaderAction} />}
        {activeTab === 'tarif_ukt' && <TarifTab setHeaderAction={setHeaderAction} />}
        {activeTab === 'jalur_kelas' && <JalurKelasTab setHeaderAction={setHeaderAction} />}
        {activeTab === 'student_types' && <StudentTypesTab setHeaderAction={setHeaderAction} />}
        {activeTab === 'beasiswa' && <BeasiswaTab setHeaderAction={setHeaderAction} />}
      </div>
    </div>
  );
}
