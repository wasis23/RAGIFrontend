'use client';

import { useEffect, useState } from 'react';
import { BarChart3, Download, Users, CreditCard, FileCheck, GraduationCap, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { spmbService } from '@/services/spmb.service';

type Statistik = {
  per_status: { status: string; total: number }[];
  lulus_per_prodi: { nama_prodi?: string; total_lulus: number }[];
  per_gelombang: { nama_gelombang: string; total: number }[];
  funnel_data: { label: string; value: number }[];
};

export default function LaporanSpmbPage() {
  const [data, setData] = useState<Statistik | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await spmbService.getLaporanStatistik();
      setData(response.data);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal memuat statistik SPMB');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await spmbService.exportLaporanSpmb();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'laporan-spmb.csv';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Gagal mengekspor laporan');
    } finally {
      setExporting(false);
    }
  };

  const funnelIcons = [Users, CreditCard, FileCheck, GraduationCap, BarChart3];

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <PageHeader
        title="Laporan & Statistik SPMB"
        description="Pantau funnel pendaftaran, status seleksi, dan distribusi pendaftar"
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" icon={<RefreshCw size={16} />} onClick={fetchData} disabled={loading}>Refresh</Button>
            <Button icon={<Download size={16} />} onClick={handleExport} loading={exporting}>Export CSV</Button>
          </div>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((item) => <div key={item} className="h-28 rounded-xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {(data?.funnel_data || []).map((item, index) => {
              const Icon = funnelIcons[index] || BarChart3;
              return (
                <div key={item.label} className="card p-4 border border-slate-200">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-slate-500">{item.label}</span>
                    <Icon size={18} className="text-primary-600" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mt-3">{item.value}</div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="card overflow-hidden">
              <div className="card-header border-b border-slate-100 flex items-center gap-2">
                <BarChart3 size={18} className="text-primary-600" />
                <h2 className="font-bold text-slate-900">Pendaftar per Status</h2>
              </div>
              <div className="p-4 space-y-3">
                {(data?.per_status || []).map((item) => (
                  <div key={item.status} className="flex items-center justify-between gap-3">
                    <Badge variant="secondary">{item.status}</Badge>
                    <span className="font-bold text-slate-800">{item.total}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="card overflow-hidden">
              <div className="card-header border-b border-slate-100 flex items-center gap-2">
                <GraduationCap size={18} className="text-primary-600" />
                <h2 className="font-bold text-slate-900">Lulus per Program Studi</h2>
              </div>
              <div className="p-4 space-y-3">
                {(data?.lulus_per_prodi || []).map((item) => (
                  <div key={item.nama_prodi || 'unknown'} className="flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-600">{item.nama_prodi || 'Prodi tidak tersedia'}</span>
                    <span className="font-bold text-slate-800">{item.total_lulus}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="card overflow-hidden lg:col-span-2">
              <div className="card-header border-b border-slate-100 flex items-center gap-2">
                <Users size={18} className="text-primary-600" />
                <h2 className="font-bold text-slate-900">Pendaftar per Gelombang</h2>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {(data?.per_gelombang || []).map((item) => (
                  <div key={item.nama_gelombang} className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                    <span className="text-sm text-slate-600">{item.nama_gelombang}</span>
                    <span className="font-bold text-slate-800">{item.total}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
