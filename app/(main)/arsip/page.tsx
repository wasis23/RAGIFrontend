'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Send, 
  CheckCircle2, 
  Clock, 
  Plus, 
  ArrowRight, 
  Stamp, 
  AlertCircle,
  FileCheck
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { arsipService } from '@/services/arsip.service';
import { useAuth } from '@/hooks/useAuth';
import { getApiErrorMessage } from '@/lib/utils';
import type { ArsipDashboardData } from '@/types/arsip.types';
import toast from 'react-hot-toast';

export default function ArsipDashboardPage() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('arsip.nomor_surat.create');
  const canReadRequest = hasPermission('arsip.request.read');

  const [data, setData] = useState<ArsipDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await arsipService.getDashboard();
        setData(res.data || null);
      } catch (err: any) {
        toast.error(getApiErrorMessage(err, 'Gagal memuat data dashboard arsip.'));
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <PageHeader
        title="Dashboard Arsip & Tata Persuratan"
        description="Pusat penerbitan nomor surat resmi kampus, verifikasi permohonan lintas modul, dan pengelolaan master kop surat."
        action={
          <div className="flex items-center gap-2">
            {canReadRequest && (
              <Link href="/arsip/request-nomor">
                <Button
                  variant="outline"
                  size="md"
                  className="border-[var(--module-primary)] text-[var(--module-primary)] hover:bg-[var(--module-primary-subtle,#f0fdfa)]"
                >
                  <Clock size={16} className="mr-1.5" />
                  Permohonan Masuk
                </Button>
              </Link>
            )}
            {canCreate && (
              <Link href="/arsip/nomor-surat/create">
                <Button variant="primary" size="md" className="bg-[var(--module-primary)] hover:opacity-90 text-white shadow-sm">
                  <Plus size={16} className="mr-1.5" />
                  Terbitkan Nomor Surat
                </Button>
              </Link>
            )}
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Nomor Terbit */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Nomor Terbit</span>
            <div className="w-8 h-8 rounded-lg bg-[var(--module-primary-subtle,#ecfeff)] text-[var(--module-primary)] flex items-center justify-center">
              <FileText size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900">
              {loading ? '-' : data?.total_nomor_surat ?? 0}
            </h3>
            <p className="text-2xs text-slate-500 mt-1">
              Tahun {data?.current_year || new Date().getFullYear()}: <span className="font-semibold text-[var(--module-primary)]">{data?.nomor_surat_tahun_ini ?? 0} nomor</span>
            </p>
          </div>
        </div>

        {/* Status Terpakai */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nomor Terpakai</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileCheck size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900">
              {loading ? '-' : data?.nomor_surat_terpakai ?? 0}
            </h3>
            <p className="text-2xs text-slate-500 mt-1">
              Direservasi: <span className="font-semibold text-slate-700">{data?.nomor_surat_direservasi ?? 0} nomor</span>
            </p>
          </div>
        </div>

        {/* Permohonan Menunggu Verifikasi */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Request Pending</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900">
              {loading ? '-' : data?.request_pending ?? 0}
            </h3>
            <p className="text-2xs text-slate-500 mt-1">
              Permohonan dari modul lain yang perlu diverifikasi
            </p>
          </div>
        </div>

        {/* Master Kop Surat Aktif */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kop Surat Aktif</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Stamp size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Badge variant={data?.kop_status?.baru_aktif ? 'success' : 'danger'}>
              Baru (≥ 2021): {data?.kop_status?.baru_aktif ? 'Siap' : 'Kosong'}
            </Badge>
            <Badge variant={data?.kop_status?.lama_aktif ? 'success' : 'warning'}>
              Lama (&lt; 2021): {data?.kop_status?.lama_aktif ? 'Siap' : 'Kosong'}
            </Badge>
          </div>
          <p className="text-2xs text-slate-500 mt-2">
            Total master berkas: <span className="font-semibold text-slate-700">{data?.total_kop_surat ?? 0}</span>
          </p>
        </div>
      </div>

      {/* Grid Quick Navigation & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Nomor Surat Terakhir Diterbitkan */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Nomor Surat Terakhir</h3>
              <Link href="/arsip/nomor-surat" className="text-xs font-semibold text-[var(--module-primary)] hover:opacity-80 flex items-center gap-1">
                Lihat Semua <ArrowRight size={14} />
              </Link>
            </div>

            <div className="mt-4 divide-y divide-slate-100">
              {loading ? (
                <div className="py-6 text-center text-xs text-slate-400">Memuat riwayat nomor surat...</div>
              ) : !data?.recent_nomor || data.recent_nomor.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">Belum ada nomor surat yang diterbitkan.</div>
              ) : (
                data.recent_nomor.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-mono text-xs font-bold text-slate-800">{item.nomor_surat}</span>
                      <span className="text-2xs text-slate-500 truncate max-w-xs">{item.perihal}</span>
                    </div>
                    <div className="flex items-center gap-2 text-right">
                      <Badge variant={item.status === 'terpakai' ? 'success' : item.status === 'direservasi' ? 'warning' : 'danger'}>
                        {item.status}
                      </Badge>
                      <span className="text-2xs text-slate-400 font-mono">{item.tanggal_surat}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Permohonan Masuk Lintas Modul */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Permohonan Masuk Lintas Modul</h3>
              <Link href="/arsip/request-nomor" className="text-xs font-semibold text-[var(--module-primary)] hover:opacity-80 flex items-center gap-1">
                Lihat Antrean <ArrowRight size={14} />
              </Link>
            </div>

            <div className="mt-4 divide-y divide-slate-100">
              {loading ? (
                <div className="py-6 text-center text-xs text-slate-400">Memuat permohonan masuk...</div>
              ) : !data?.recent_requests || data.recent_requests.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">Tidak ada permohonan yang sedang pending.</div>
              ) : (
                data.recent_requests.map((req) => (
                  <div key={req.id} className="py-2.5 flex items-center justify-between">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-2xs text-slate-400">{req.kode_request}</span>
                        <Badge variant="blue" className="uppercase text-2xs">{req.module_origin}</Badge>
                      </div>
                      <span className="text-xs font-medium text-slate-800 truncate max-w-xs">{req.perihal}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={req.status === 'disetujui' ? 'success' : req.status === 'ditolak' ? 'danger' : 'warning'}>
                        {req.status === 'menunggu_verifikasi' ? 'Pending' : req.status}
                      </Badge>
                      <Link href={`/arsip/request-nomor/${req.id}`}>
                        <Button variant="outline" size="sm" className="text-2xs h-7 px-2">
                          Detail
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
