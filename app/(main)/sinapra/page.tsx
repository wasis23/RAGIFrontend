'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Boxes,
  CalendarCheck,
  Wrench,
  ShoppingCart,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  Calendar,
  GraduationCap,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { sinapraService } from '@/services/sinapra.service';
import type { SinapraDashboardSummary } from '@/types/sinapra.types';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function SinapraDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<SinapraDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await sinapraService.getDashboardSummary();
      if (res.data) {
        setData(res.data);
      }
    } catch {
      toast.error('Gagal memuat ringkasan dashboard SINAPRA');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const metrics = data?.metrics;
  const breakdown = data?.breakdown_aset;
  const earlyWarnings = data?.early_warnings;
  const recent = data?.recent_activities;

  // Total aset untuk perhitungan persentase bar
  const totalAsetCount = metrics?.total_aset || 1;

  // Kolom Tabel Peminjaman Ruangan Terkini
  const peminjamanRuanganColumns: ColumnDef<any>[] = [
    {
      key: 'ruangan',
      label: 'RUANGAN & GEDUNG',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-800 text-xs block">
            {row.ruangan?.nama || 'Ruangan'}
          </span>
          <span className="text-2xs text-slate-500 font-mono">
            {row.ruangan?.kode || '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'peminjam',
      label: 'PEMINJAM & KEPERLUAN',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-800 text-xs block">
            {row.user?.name || 'Civitas Kampus'}
          </span>
          <span className="text-2xs text-slate-500 line-clamp-1">
            {row.keperluan || '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'jadwal',
      label: 'WAKTU & JADWAL',
      render: (row) => (
        <div>
          <span className="font-medium text-slate-800 text-xs block">
            {row.tanggal ? formatDate(row.tanggal) : '-'}
          </span>
          <span className="text-2xs text-slate-500 font-mono">
            {row.jam_mulai?.slice(0, 5)} - {row.jam_selesai?.slice(0, 5)} WIB
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (row) => {
        const isApproved = ['disetujui', 'aktif', 'selesai'].includes(row.status);
        const isPending = row.status === 'diajukan';
        return (
          <Badge variant={isApproved ? 'success' : isPending ? 'warning' : 'danger'} className="text-2xs uppercase">
            {row.status}
          </Badge>
        );
      },
    },
  ];

  // Kolom Tabel Peminjaman Aset Terkini
  const peminjamanAsetColumns: ColumnDef<any>[] = [
    {
      key: 'aset',
      label: 'BARANG / ASET',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-800 text-xs block">
            {row.aset?.nama || 'Aset'}
          </span>
          <span className="text-2xs text-slate-500 font-mono">
            {row.aset?.kode_aset || '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'peminjam',
      label: 'PEMINJAM & KEPERLUAN',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-800 text-xs block">
            {row.user?.name || 'Civitas Kampus'}
          </span>
          <span className="text-2xs text-slate-500 line-clamp-1">
            {row.keperluan || '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'jadwal',
      label: 'RENTANG PINJAM',
      render: (row) => (
        <div>
          <span className="font-medium text-slate-800 text-xs block">
            {row.tanggal_pinjam ? formatDate(row.tanggal_pinjam) : '-'}
          </span>
          <span className="text-2xs text-slate-500">
            s/d {row.tanggal_kembali_rencana ? formatDate(row.tanggal_kembali_rencana) : '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (row) => {
        const isApproved = ['disetujui', 'dipinjam', 'kembali'].includes(row.status);
        const isPending = row.status === 'diajukan';
        return (
          <Badge variant={isApproved ? 'success' : isPending ? 'warning' : 'danger'} className="text-2xs uppercase">
            {row.status}
          </Badge>
        );
      },
    },
  ];

  // Data dan Kolom Distribusi Fasilitas & Aset per Program Studi
  const distribusiData = [
    ...(data?.distribusi_prodi?.prodi_list || []),
    ...(data?.distribusi_prodi?.fasilitas_umum
      ? [
          {
            id: 0,
            kode_prodi: 'UMUM',
            nama: data.distribusi_prodi.fasilitas_umum.nama,
            jenjang: 'Fasilitas Terpusat',
            total_aset: data.distribusi_prodi.fasilitas_umum.total_aset,
            total_ruangan: data.distribusi_prodi.fasilitas_umum.total_ruangan,
            total_nilai_aset: data.distribusi_prodi.fasilitas_umum.total_nilai_aset,
          },
        ]
      : []),
  ];

  const prodiColumns: ColumnDef<any>[] = [
    {
      key: 'nama',
      label: 'PROGRAM STUDI / UNIT KAMPUS',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-800 text-xs block">
            {row.nama}
          </span>
          <span className="text-2xs text-slate-500 font-mono">
            {row.kode_prodi} {row.jenjang ? `• ${row.jenjang}` : ''}
          </span>
        </div>
      ),
    },
    {
      key: 'total_ruangan',
      label: 'RUANGAN TERKAIT',
      render: (row) => (
        <span className="font-medium text-slate-800 text-xs">
          {row.total_ruangan} Ruangan
        </span>
      ),
    },
    {
      key: 'total_aset',
      label: 'JUMLAH INVENTARIS',
      render: (row) => (
        <span className="font-bold text-slate-800 text-xs">
          {row.total_aset} Unit
        </span>
      ),
    },
    {
      key: 'total_nilai_aset',
      label: 'ESTIMASI NILAI ASET',
      align: 'right',
      render: (row) => (
        <span className="font-mono font-bold text-xs" style={{ color: 'var(--module-primary)' }}>
          {formatCurrency(row.total_nilai_aset)}
        </span>
      ),
    },
    {
      key: 'action',
      label: 'NAVIGASI',
      align: 'center',
      render: (row) => (
        <Link
          href={row.id > 0 ? `/sinapra/aset?program_studi_id=${row.id}` : '/sinapra/aset'}
          className="text-2xs font-semibold hover:underline flex items-center justify-center gap-2"
          style={{ color: 'var(--module-primary)' }}
        >
          Lihat Aset <ArrowRight size={12} />
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <PageHeader
        title="Dashboard Sarana & Prasarana (SINAPRA)"
        description="Pusat kendali eksekutif inventaris fasilitas kampus, peminjaman aset, pemeliharaan, serta integrasi akuntansi SIKEU dan SIMPEG."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<CalendarCheck size={16} />}
              onClick={() => router.push('/sinapra/peminjaman')}
            >
              Peminjaman
            </Button>
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => router.push('/sinapra/aset/create')}
            >
              Tambah Aset Baru
            </Button>
          </div>
        }
      />

      {/* KPI METRIC CARDS (4 COLUMNS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Fasilitas Ruangan & Gedung */}
        <div className="card p-4 md:p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">
              Fasilitas Kampus
            </span>
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'color-mix(in srgb, var(--module-primary) 12%, transparent)' }}
            >
              <Building2 size={20} style={{ color: 'var(--module-primary)' }} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">
              {loading ? '...' : `${metrics?.total_ruangan || 0} Ruangan`}
            </div>
            <p className="text-xs text-slate-500">
              Tersebar di <strong className="text-slate-700">{metrics?.total_gedung || 0} Gedung</strong> kampus
            </p>
          </div>
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-2xs">
            <span className="font-semibold flex items-center gap-2" style={{ color: 'var(--module-primary)' }}>
              <CheckCircle2 size={12} style={{ color: 'var(--module-primary)' }} />
              {metrics?.ruangan_tersedia || 0} Tersedia
            </span>
            <span className="text-slate-400">
              Kapasitas: {metrics?.total_kapasitas_ruangan || 0} Kursi
            </span>
          </div>
        </div>

        {/* Card 2: Inventaris Aset & Nilai Finansial SIKEU */}
        <div className="card p-4 md:p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">
              Inventaris Aset (SIKEU)
            </span>
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'color-mix(in srgb, var(--module-primary) 12%, transparent)' }}
            >
              <Boxes size={20} style={{ color: 'var(--module-primary)' }} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {loading ? '...' : formatCurrency(metrics?.total_nilai_buku || 0)}
            </div>
            <p className="text-xs text-slate-500">
              Nilai Buku dari <strong className="text-slate-700">{metrics?.total_aset || 0} Unit Aset</strong>
            </p>
          </div>
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-2xs">
            <span className="text-slate-500">
              Perolehan: {formatCurrency(metrics?.total_harga_perolehan || 0)}
            </span>
            <span className="font-medium" style={{ color: 'var(--module-primary)' }}>
              {metrics?.total_aset_ada_pic || 0} Ada PIC
            </span>
          </div>
        </div>

        {/* Card 3: Peminjaman & Ketersediaan */}
        <div className="card p-4 md:p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">
              Peminjaman Aktif
            </span>
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'color-mix(in srgb, var(--module-primary) 12%, transparent)' }}
            >
              <CalendarCheck size={20} style={{ color: 'var(--module-primary)' }} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">
              {loading ? '...' : `${(metrics?.peminjaman_ruangan_aktif || 0) + (metrics?.peminjaman_aset_aktif || 0)} Aktif`}
            </div>
            <p className="text-xs text-slate-500">
              {metrics?.peminjaman_ruangan_aktif || 0} Ruangan • {metrics?.peminjaman_aset_aktif || 0} Barang Aset
            </p>
          </div>
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-2xs">
            <span className="font-semibold text-slate-600">
              {metrics?.peminjaman_pending || 0} Butuh Approval
            </span>
            <Link
              href="/sinapra/peminjaman"
              style={{ color: 'var(--module-primary)' }}
              className="font-semibold hover:underline flex items-center gap-2"
            >
              Kelola <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Card 4: Pemeliharaan & Pengadaan Barang */}
        <div className="card p-4 md:p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">
              Maintenance &amp; Pengadaan
            </span>
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'color-mix(in srgb, var(--module-primary) 12%, transparent)' }}
            >
              <Wrench size={20} style={{ color: 'var(--module-primary)' }} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">
              {loading ? '...' : `${metrics?.maintenance_aktif || 0} Perbaikan`}
            </div>
            <p className="text-xs text-slate-500">
              Dalam proses pemeliharaan sarana kampus
            </p>
          </div>
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-2xs">
            <span className="font-medium text-slate-600">
              Pengadaan: {metrics?.pengadaan_pending || 0} Diajukan
            </span>
            <Link
              href="/sinapra/pengadaan"
              style={{ color: 'var(--module-primary)' }}
              className="font-semibold hover:underline flex items-center gap-2"
            >
              {metrics?.pengadaan_disetujui || 0} Disetujui <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* SECOND ROW: SEBARAN ASET, QUICK ACTIONS & EARLY WARNINGS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Kolom 1 & 2: Sebaran Status & Kondisi Aset */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-4 md:p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Sebaran Status &amp; Kondisi Fisik Inventaris
                </h3>
                <p className="text-2xs text-slate-400">
                  Distribusi fisik seluruh unit aset yang terdata dalam sistem SINAPRA
                </p>
              </div>
              <Link href="/sinapra/aset">
                <Button variant="outline" size="sm" className="text-2xs">
                  Semua Aset
                </Button>
              </Link>
            </div>

            {/* Grid 2 Kolom: Status & Kondisi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status Aset */}
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-4">
                <div className="text-xs font-bold text-slate-700 uppercase">
                  Status Ketersediaan Aset
                </div>
                <div className="space-y-4 text-xs">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-slate-600">
                      <span>Tersedia</span>
                      <strong className="text-slate-800">{breakdown?.status.tersedia || 0} unit</strong>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          background: 'var(--module-primary)',
                          width: `${Math.round(((breakdown?.status.tersedia || 0) / totalAsetCount) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-slate-600">
                      <span>Sedang Dipinjam</span>
                      <strong className="text-slate-800">{breakdown?.status.dipinjam || 0} unit</strong>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--module-primary) 70%, transparent)',
                          width: `${Math.round(((breakdown?.status.dipinjam || 0) / totalAsetCount) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-slate-600">
                      <span>Maintenance / Servis</span>
                      <strong className="text-slate-800">{breakdown?.status.maintenance || 0} unit</strong>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--module-primary) 45%, transparent)',
                          width: `${Math.round(((breakdown?.status.maintenance || 0) / totalAsetCount) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-slate-600">
                      <span>Rusak / Disposal</span>
                      <strong className="text-slate-800">
                        {(breakdown?.status.rusak || 0) + (breakdown?.status.dihapus || 0)} unit
                      </strong>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--module-primary) 25%, transparent)',
                          width: `${Math.round((((breakdown?.status.rusak || 0) + (breakdown?.status.dihapus || 0)) / totalAsetCount) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Kondisi Fisik */}
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-4">
                <div className="text-xs font-bold text-slate-700 uppercase">
                  Kelayakan &amp; Kondisi Fisik
                </div>
                <div className="space-y-4 text-xs">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-slate-600">
                      <span>Kondisi Baik (Prima)</span>
                      <strong className="text-slate-800">{breakdown?.kondisi.baik || 0} unit</strong>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          background: 'var(--module-primary)',
                          width: `${Math.round(((breakdown?.kondisi.baik || 0) / totalAsetCount) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-slate-600">
                      <span>Rusak Ringan</span>
                      <strong className="text-slate-800">{breakdown?.kondisi.rusak_ringan || 0} unit</strong>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--module-primary) 50%, transparent)',
                          width: `${Math.round(((breakdown?.kondisi.rusak_ringan || 0) / totalAsetCount) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-slate-600">
                      <span>Rusak Berat (Butuh Penggantian)</span>
                      <strong className="text-slate-800">{breakdown?.kondisi.rusak_berat || 0} unit</strong>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--module-primary) 25%, transparent)',
                          width: `${Math.round(((breakdown?.kondisi.rusak_berat || 0) / totalAsetCount) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Shortcuts */}
            <div className="pt-4 border-t border-slate-100">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Link
                  href="/sinapra/gedung-ruangan"
                  className="p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition text-center flex flex-col gap-2 items-center"
                >
                  <Building2 size={18} style={{ color: 'var(--module-primary)' }} />
                  <span className="text-2xs font-semibold text-slate-700">Ruangan</span>
                </Link>
                <Link
                  href="/sinapra/aset"
                  className="p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition text-center flex flex-col gap-2 items-center"
                >
                  <Boxes size={18} style={{ color: 'var(--module-primary)' }} />
                  <span className="text-2xs font-semibold text-slate-700">Inventaris</span>
                </Link>
                <Link
                  href="/sinapra/pengadaan"
                  className="p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition text-center flex flex-col gap-2 items-center"
                >
                  <ShoppingCart size={18} style={{ color: 'var(--module-primary)' }} />
                  <span className="text-2xs font-semibold text-slate-700">Pengadaan</span>
                </Link>
                <Link
                  href="/sinapra/kalender"
                  className="p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition text-center flex flex-col gap-2 items-center"
                >
                  <Calendar size={18} style={{ color: 'var(--module-primary)' }} />
                  <span className="text-2xs font-semibold text-slate-700">Kalender</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom 3: Early Warning System (Lab & Kalibrasi) */}
        <div className="space-y-4">
          <div className="card p-4 md:p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert size={18} style={{ color: 'var(--module-primary)' }} />
                <h3 className="text-sm font-bold text-slate-800">
                  Early Warning Lab
                </h3>
              </div>
              <Link href="/sinapra/laboratorium">
                <Button variant="outline" size="sm" className="text-2xs">
                  Modul Lab
                </Button>
              </Link>
            </div>

            {/* Peringatan Stok BHP Menipis */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-2">
                  <AlertTriangle size={14} style={{ color: 'var(--module-primary)' }} />
                  BHP Lab Stok Kritis
                </span>
                <Badge variant={earlyWarnings?.bhp_kritis_count ? 'danger' : 'success'} className="text-3xs">
                  {earlyWarnings?.bhp_kritis_count || 0} Kritis
                </Badge>
              </div>

              {earlyWarnings?.bhp_kritis_list && earlyWarnings.bhp_kritis_list.length > 0 ? (
                <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 overflow-hidden bg-white">
                  {earlyWarnings.bhp_kritis_list.map((item) => (
                    <div key={item.id} className="p-3 text-xs hover:bg-slate-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-semibold text-slate-800 block">{item.nama_bhp}</span>
                          <span className="text-2xs text-slate-400 block">{item.ruangan?.nama || 'Laboratorium'}</span>
                        </div>
                        <span className="text-2xs font-bold text-slate-700 font-mono">
                          Sisa: {item.stok_saat_ini} {item.satuan} (Min: {item.stok_minimum})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center text-slate-400 text-xs">
                  Seluruh stok BHP laboratorium aman di atas batas minimum.
                </div>
              )}
            </div>

            {/* Peringatan Kalibrasi Alat Presisi */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-2">
                  <Clock size={14} style={{ color: 'var(--module-primary)' }} />
                  Kalibrasi Mendekati Tempo
                </span>
                <Badge variant={earlyWarnings?.kalibrasi_urgent_count ? 'warning' : 'success'} className="text-3xs">
                  {earlyWarnings?.kalibrasi_urgent_count || 0} Alat
                </Badge>
              </div>

              {earlyWarnings?.kalibrasi_urgent_list && earlyWarnings.kalibrasi_urgent_list.length > 0 ? (
                <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 overflow-hidden bg-white">
                  {earlyWarnings.kalibrasi_urgent_list.map((item) => (
                    <div key={item.id} className="p-3 text-xs hover:bg-slate-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-semibold text-slate-800 block">
                            {item.aset?.nama || 'Alat Laboratorium'}
                          </span>
                          <span className="text-2xs text-slate-400 font-mono">
                            {item.nomor_sertifikat || 'Tanpa No. Sertifikat'}
                          </span>
                        </div>
                        <span className="text-2xs font-bold text-slate-700 font-mono">
                          {item.tanggal_kadaluarsa ? formatDate(item.tanggal_kadaluarsa) : 'Lewat Tempo'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center text-slate-400 text-xs">
                  Tidak ada instrumen presisi yang memerlukan kalibrasi segera.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PROGRAM STUDI ASSET DISTRIBUTION SECTION */}
      <div className="card p-4 md:p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <GraduationCap size={18} style={{ color: 'var(--module-primary)' }} />
              Distribusi Fasilitas &amp; Aset per Program Studi
            </h3>
            <p className="text-2xs text-slate-400">
              Pemetaan inventaris, ruangan khusus prodi, dan fasilitas umum kampus terintegrasi SIAKAD
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/sinapra/aset">
              <Button variant="outline" size="sm" className="text-2xs">
                Semua Inventaris
              </Button>
            </Link>
            <Link href="/sinapra/gedung-ruangan">
              <Button variant="outline" size="sm" className="text-2xs">
                Semua Ruangan
              </Button>
            </Link>
          </div>
        </div>

        <DataTable
          columns={prodiColumns}
          data={distribusiData}
          emptyMessage="Belum ada data distribusi fasilitas program studi."
        />
      </div>

      {/* THIRD ROW: TABEL AKTIVITAS PEMINJAMAN TERKINI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Peminjaman Ruangan Terkini */}
        <div className="card p-4 md:p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Peminjaman Ruangan Terkini
              </h3>
              <p className="text-2xs text-slate-400">
                Log permohonan dan jadwal penggunaan fasilitas ruangan kampus
              </p>
            </div>
            <Link href="/sinapra/peminjaman">
              <Button variant="outline" size="sm" className="text-2xs">
                Lihat Semua
              </Button>
            </Link>
          </div>
          <DataTable
            columns={peminjamanRuanganColumns}
            data={recent?.peminjaman_ruangan || []}
            emptyMessage="Belum ada aktivitas peminjaman ruangan tercatat."
          />
        </div>

        {/* Peminjaman Aset Terkini */}
        <div className="card p-4 md:p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Peminjaman Aset &amp; Barang Terkini
              </h3>
              <p className="text-2xs text-slate-400">
                Log peminjaman alat laboratorium, proyektor, atau inventaris portabel
              </p>
            </div>
            <Link href="/sinapra/peminjaman">
              <Button variant="outline" size="sm" className="text-2xs">
                Lihat Semua
              </Button>
            </Link>
          </div>
          <DataTable
            columns={peminjamanAsetColumns}
            data={recent?.peminjaman_aset || []}
            emptyMessage="Belum ada aktivitas peminjaman aset tercatat."
          />
        </div>
      </div>
    </div>
  );
}
