'use client';

import {
  Sparkles,
  ArrowRight,
  DollarSign,
  Receipt,
  Info
} from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { PotonganKhususTab } from '../../master/_tabs/PotonganKhususTab';

export default function PotonganKhususPage() {
  return (
    <div className="w-full space-y-6 animate-fade-in pb-16">
      {/* Page Header */}
      <PageHeader
        title="Potongan & Keringanan Khusus Mahasiswa"
        description="Kelola penetapan potongan biaya pendidikan tambahan/khusus untuk mahasiswa tertentu di luar beasiswa umum (misal: diskon anak dosen/karyawan, keringanan SK Rektor, beasiswa saudara kandung)."
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/sikeu/mahasiswa/tarif"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-2xs"
            >
              <DollarSign size={14} className="text-slate-500" />
              Pengaturan Tarif & Beasiswa <ArrowRight size={13} />
            </Link>
            <Link
              href="/sikeu/tagihan"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-primary-700 bg-primary-50 border border-primary-200/80 hover:bg-primary-100 transition-all shadow-2xs"
            >
              <Receipt size={14} className="text-primary-600" />
              Terbitkan Tagihan SPP <ArrowRight size={13} />
            </Link>
          </div>
        }
      />

      {/* Info Context Card */}
      <div className="p-4 bg-linear-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-200/80 rounded-2xl flex items-start gap-3">
        <div className="p-2 bg-amber-600 text-white rounded-xl shrink-0 mt-0.5 shadow-2xs">
          <Sparkles size={18} />
        </div>
        <div className="space-y-1">
          <h2 className="text-xs font-bold text-slate-900">
            Mekanisme Potongan Khusus Non-Beasiswa
          </h2>
          <p className="text-2xs text-slate-600 leading-relaxed">
            Potongan khusus ini ditetapkan <strong>secara individu per mahasiswa</strong> dengan status aktif dan batas masa berlaku semester/tahun. Saat tagihan massal digenerate di menu Tagihan SPP & UKT, nominal potongan otomatis dipotong dari invoice dan terakumulasi secara transparan bersama beasiswa umum institusi.
          </p>
        </div>
      </div>

      {/* Main Tab Interface */}
      <div className="w-full space-y-6">
        <PotonganKhususTab />
      </div>
    </div>
  );
}
