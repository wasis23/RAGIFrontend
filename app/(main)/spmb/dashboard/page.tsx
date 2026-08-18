'use client';

import { useState, useEffect } from 'react';
import { Users, FileText, CheckCircle, XCircle, TrendingUp, Calendar, Award, ArrowRight, Activity, BookOpen, Download, UserPlus, ClipboardCheck } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { Hero } from '@/components/ui/Hero';
import { StatCard } from '@/components/ui/StatCard';

export default function SPMBDashboardPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/spmb/laporan/statistik');
      setStats(res.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportCsv = async () => {
    try {
      const response = await api.get('/spmb/laporan/export-csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Laporan_Pendaftar_SPMB.csv');
      document.body.appendChild(link);
      link.click();
      toast.success('Laporan CSV berhasil diunduh!');
    } catch (error) {
      toast.error('Gagal mengunduh laporan CSV.');
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      <Hero
        badge={
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-sm font-medium">
            <Activity size={16} className="text-sky-200" />
            <span className="text-sky-50">Tahun Akademik 2026/2027</span>
          </span>
        }
        title={
          <>
            Dashboard <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-200 to-white">SPMB</span>
          </>
        }
        description="Pantau ringkasan statistik penerimaan mahasiswa baru, verifikasi berkas pendaftar, dan kelola gelombang pendaftaran secara real-time."
        actions={
          <div className="flex flex-wrap gap-4">
            <Link href="/spmb/master/gelombang" className="btn hero-btn-white">
              Kelola Gelombang
            </Link>
            <button onClick={handleExportCsv} className="btn hero-btn-glass flex items-center gap-2">
              <Download size={18} /> Export Laporan CSV
            </button>
          </div>
        }
      />

      {/* Main Stat Cards */}
      <div className="kpi-grid">
        <StatCard
          label="Total Pendaftar"
          value="1,245"
          icon={<Users size={24} />}
          iconVariant="blue"
          footer="+12% minggu ini"
        />
        <StatCard
          label="Berkas Terverifikasi"
          value="982"
          icon={<ClipboardCheck size={24} />}
          iconVariant="green"
          footer="78.8% dari total"
        />
        <StatCard
          label="Diterima"
          value="356"
          icon={<Award size={24} />}
          iconVariant="amber"
          footer="36.2% tingkat kelulusan"
        />
        <StatCard
          label="Perlu Tindakan"
          value="24"
          icon={<FileText size={24} />}
          iconVariant="red"
          footer="Berkas tidak lengkap"
        />

        {/* Card 2 */}
        <StatCard
          label="Menunggu Verifikasi"
          value="342"
          icon={<FileText size={24} />}
          iconVariant="amber"
          footer="Perlu tindakan"
        />

        {/* Card 3 */}
        <StatCard
          label="Lulus Seleksi"
          value="850"
          icon={<CheckCircle size={24} />}
          iconVariant="green"
          footer="Gelombang 1 & 2"
        />

        {/* Card 4 */}
        <StatCard
          label="Gagal / Gugur"
          value="53"
          icon={<XCircle size={24} />}
          iconVariant="red"
        />
      </div>

      {/* Two Column Layout for Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Prodi Terfavorit */}
        <div className="card bg-white shadow-sm border border-slate-100 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                <Award size={20} />
              </div>
              <h3 className="font-bold text-lg text-slate-800">Prodi Terfavorit</h3>
            </div>
          </div>
          <div className="p-6 space-y-6">
            
            {/* Item 1 */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <div>
                  <h4 className="font-bold text-slate-800 text-base">S1 Teknik Informatika</h4>
                  <p className="text-xs text-slate-500 font-medium">Fakultas Ilmu Komputer</p>
                </div>
                <span className="font-black text-indigo-600 text-lg">450 <span className="text-xs text-slate-400 font-medium">Pendaftar</span></span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div className="bg-gradient-to-r from-indigo-500 to-blue-500 h-2.5 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>

            {/* Item 2 */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <div>
                  <h4 className="font-bold text-slate-800 text-base">S1 Sistem Informasi</h4>
                  <p className="text-xs text-slate-500 font-medium">Fakultas Ilmu Komputer</p>
                </div>
                <span className="font-black text-indigo-600 text-lg">320 <span className="text-xs text-slate-400 font-medium">Pendaftar</span></span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div className="bg-gradient-to-r from-indigo-400 to-blue-400 h-2.5 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>

            {/* Item 3 */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <div>
                  <h4 className="font-bold text-slate-800 text-base">D3 Manajemen Informatika</h4>
                  <p className="text-xs text-slate-500 font-medium">Fakultas Vokasi</p>
                </div>
                <span className="font-black text-indigo-600 text-lg">150 <span className="text-xs text-slate-400 font-medium">Pendaftar</span></span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div className="bg-gradient-to-r from-slate-400 to-slate-500 h-2.5 rounded-full" style={{ width: '35%' }}></div>
              </div>
            </div>

          </div>
        </div>

        {/* Gelombang Aktif */}
        <div className="card bg-white shadow-sm border border-slate-100 rounded-2xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                <Calendar size={20} />
              </div>
              <h3 className="font-bold text-lg text-slate-800">Status Gelombang</h3>
            </div>
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          
          <div className="p-6 flex-1 flex flex-col justify-center items-center text-center">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-4 text-emerald-600">
              <BookOpen size={36} />
            </div>
            <h4 className="text-2xl font-black text-slate-900 mb-2">Gelombang 2 (Reguler)</h4>
            <p className="text-slate-500 font-medium mb-6">Pendaftaran sedang berlangsung saat ini.</p>
            
            <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 font-bold uppercase mb-1">Tutup Pada</p>
                <p className="font-bold text-slate-800">30 Agustus 2026</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 font-bold uppercase mb-1">Kuota Terisi</p>
                <p className="font-bold text-emerald-600">65%</p>
              </div>
            </div>

            <Link href="/spmb/master/gelombang" className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 group">
              Kelola Gelombang Penerimaan 
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
