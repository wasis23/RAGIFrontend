'use client';

import { useState, useEffect } from 'react';
import { Users, FileText, CheckCircle, XCircle, TrendingUp, Calendar, Award, ArrowRight, Activity, BookOpen, Download } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

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
      {/* Hero Banner with Gradient */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-700 to-sky-500 p-8 sm:p-10 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 opacity-10">
          <TrendingUp size={300} />
        </div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-sm font-medium">
            <Activity size={16} className="text-sky-200" />
            <span className="text-sky-50">Tahun Akademik 2026/2027</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
            Dashboard <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-200 to-white">SPMB</span>
          </h1>
          <p className="text-lg text-indigo-100 mb-8 max-w-2xl font-medium leading-relaxed">
            Pantau ringkasan statistik penerimaan mahasiswa baru, verifikasi berkas pendaftar, dan kelola gelombang pendaftaran secara real-time.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/spmb/master/gelombang" className="btn bg-white text-indigo-700 hover:bg-sky-50 border-none shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl px-6">
              Kelola Gelombang
            </Link>
            <button onClick={handleExportCsv} className="btn bg-indigo-500/30 text-white hover:bg-indigo-500/50 backdrop-blur-md border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl px-6 flex items-center gap-2">
              <Download size={18} /> Export Laporan CSV
            </button>
          </div>
        </div>
      </div>

      {/* Main Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1 */}
        <div className="card bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-400 to-indigo-600"></div>
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                <Users size={24} />
              </div>
              <span className="badge badge-ghost badge-sm text-slate-500 font-medium">+12% minggu ini</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Pendaftar</p>
              <h3 className="text-3xl font-black text-slate-900">1,245</h3>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="card bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-400 to-orange-500"></div>
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
                <FileText size={24} />
              </div>
              <span className="badge badge-ghost badge-sm text-slate-500 font-medium">Perlu Tindakan</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Menunggu Verifikasi</p>
              <h3 className="text-3xl font-black text-slate-900">342</h3>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="card bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-400 to-teal-600"></div>
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                <CheckCircle size={24} />
              </div>
              <span className="badge badge-ghost badge-sm text-slate-500 font-medium">Gelombang 1 & 2</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Lulus Seleksi</p>
              <h3 className="text-3xl font-black text-slate-900">850</h3>
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="card bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-rose-400 to-red-600"></div>
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl group-hover:scale-110 group-hover:bg-rose-500 group-hover:text-white transition-all duration-300">
                <XCircle size={24} />
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Gagal / Gugur</p>
              <h3 className="text-3xl font-black text-slate-900">53</h3>
            </div>
          </div>
        </div>
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
