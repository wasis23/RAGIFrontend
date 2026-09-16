'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Award,
  FileCheck,
  GraduationCap,
  Building2,
  Calendar,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { simpegKompetensiService } from '@/services/simpeg.kompetensi.service';
import { simpegService } from '@/services/simpeg.service';
import { useAuth } from '@/hooks/useAuth';
import type { KompetensiMasters } from '@/types/simpeg.kompetensi.types';
import type { UnitKerja } from '@/types/simpeg.types';
import type { PaginationMeta } from '@/types/api.types';

export default function PencarianKompetensiAdminPage() {
  const router = useRouter();
  const { isAdmin, hasPermission } = useAuth();
  const isManager = isAdmin || hasPermission('simpeg.kompetensi.manage');

  const [masters, setMasters] = useState<KompetensiMasters | null>(null);
  const [unitKerjaList, setUnitKerjaList] = useState<UnitKerja[]>([]);

  // Filter Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [kategori, setKategori] = useState<'sertifikat' | 'tes' | 'pelatihan'>('sertifikat');
  const [search, setSearch] = useState('');
  const [unitKerjaId, setUnitKerjaId] = useState('');
  const [jenisId, setJenisId] = useState('');
  const [skorMin, setSkorMin] = useState('');
  const [tahun, setTahun] = useState('');

  // Table Data State
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [meta, setMeta] = useState<PaginationMeta>({
    current_page: 1,
    per_page: 15,
    total: 0,
    last_page: 1,
    from: 0,
    to: 0,
  });

  // Load Masters
  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const [resMasters, resUnits] = await Promise.all([
          simpegKompetensiService.getMasters(),
          simpegService.getUnitKerjaList({ per_page: 100 }),
        ]);
        if (resMasters.data) setMasters(resMasters.data);
        if (resUnits.data) setUnitKerjaList(resUnits.data);
      } catch (err) {
        console.error('Failed loading masters', err);
      }
    };
    fetchMasters();
  }, []);

  // Fetch Admin Data
  const fetchData = useCallback(
    async (page = 1, limit = 15) => {
      setIsLoading(true);
      try {
        const params: any = {
          page,
          per_page: limit,
          kategori,
          search,
          unit_kerja_id: unitKerjaId || undefined,
          jenis_id: jenisId || undefined,
          skor_min: skorMin || undefined,
          tahun: tahun || undefined,
        };

        const res = await simpegKompetensiService.searchKompetensiAdmin(params);
        setData(res.data || []);
        if (res.meta) setMeta(res.meta);
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Gagal memuat rekap kompetensi');
      } finally {
        setIsLoading(false);
      }
    },
    [kategori, search, unitKerjaId, jenisId, skorMin, tahun]
  );

  useEffect(() => {
    fetchData(1, meta.per_page);
  }, [fetchData]);

  const handleResetFilter = () => {
    setSearch('');
    setUnitKerjaId('');
    setJenisId('');
    setSkorMin('');
    setTahun('');
    setIsDrawerOpen(false);
  };

  // ── TABLE COLUMNS ──────────────────────────────────────────
  const columns: ColumnDef<any>[] = [
    {
      key: 'pegawai',
      label: 'Pegawai / Dosen',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-900">{row.pegawai?.nama_lengkap}</div>
          <div className="text-xs text-slate-500 font-mono">
            {row.pegawai?.nidn ? `NIDN: ${row.pegawai.nidn}` : `NIP: ${row.pegawai?.nip || '-'}`}
          </div>
          <div className="text-2xs text-primary-600 font-semibold mt-0.5">
            {row.pegawai?.unit_kerja?.nama || 'Unit Kerja Belum Diset'}
          </div>
        </div>
      ),
    },
    {
      key: 'kompetensi',
      label: 'Rincian Kompetensi',
      render: (row) => {
        if (kategori === 'sertifikat') {
          return (
            <div>
              <Badge variant="purple" className="text-2xs mb-1">
                {row.jenis_sertifikasi?.nama || 'Sertifikasi'}
              </Badge>
              <div className="font-semibold text-slate-800 text-sm">{row.nama_sertifikat}</div>
              <div className="text-xs text-slate-500">Bidang: {row.bidang_studi}</div>
              {row.nomor_registrasi && (
                <div className="text-2xs font-mono text-slate-400">No. Reg: {row.nomor_registrasi}</div>
              )}
            </div>
          );
        } else if (kategori === 'tes') {
          return (
            <div>
              <Badge variant="blue" className="text-2xs mb-1">
                {row.jenis_tes?.nama || row.nama_tes}
              </Badge>
              <div className="font-semibold text-slate-800 text-sm">{row.nama_tes}</div>
              <div className="text-xs text-slate-500">{row.penyelenggara}</div>
            </div>
          );
        } else {
          return (
            <div>
              <Badge variant="green" className="text-2xs mb-1">
                {row.jenis_pelatihan?.nama || 'Pelatihan'}
              </Badge>
              <div className="font-semibold text-slate-800 text-sm">{row.nama_kegiatan}</div>
              <div className="text-xs text-slate-500">Peran: {row.peran?.nama || 'Peserta'}</div>
            </div>
          );
        }
      },
    },
    {
      key: 'hasil',
      label: kategori === 'tes' ? 'Skor Tes' : kategori === 'pelatihan' ? 'Durasi (JP)' : 'Tahun Terbit',
      render: (row) => {
        if (kategori === 'tes') {
          return (
            <span className="font-mono font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg text-sm">
              {row.skor}
            </span>
          );
        } else if (kategori === 'pelatihan') {
          return (
            <span className="text-xs font-semibold text-slate-700">
              {row.jumlah_jam ? `${row.jumlah_jam} JP` : '-'}
            </span>
          );
        } else {
          return <span className="font-bold text-slate-800">{row.tahun_sertifikasi}</span>;
        }
      },
    },
    {
      key: 'penyelenggara',
      label: 'Lembaga Penyelenggara',
      render: (row) => (
        <div className="text-xs text-slate-600 font-medium">
          {row.penyelenggara || '-'}
        </div>
      ),
    },
    {
      key: 'berkas',
      label: 'Dokumen',
      render: (row) => (
        <div>
          {row.file_path ? (
            <a
              href={`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/${row.file_path}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 font-medium bg-primary-50 px-2 py-1 rounded"
            >
              <ExternalLink size={12} /> Unduh File
            </a>
          ) : (
            <span className="text-xs text-slate-400 italic">Tidak ada berkas</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <PageHeader
        title="Pencarian & Rekapitulasi Kompetensi"
        description="Pencarian dan rekap data sertifikasi dosen, skor tes, dan riwayat pelatihan lintas program studi untuk keperluan akreditasi BAN-PT/LAM & BKD."
        backUrl="/simpeg/kompetensi"
        action={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setIsDrawerOpen(true)}
            >
              Filter Pencarian
            </Button>
            <Button
              variant="secondary"
              icon={<RefreshCw size={16} />}
              onClick={() => fetchData(1, meta.per_page)}
            >
              Segarkan
            </Button>
          </div>
        }
      />

      {/* Kategori Quick Switcher */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3 overflow-x-auto">
        <button
          onClick={() => {
            setKategori('sertifikat');
            setJenisId('');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            kategori === 'sertifikat'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Award size={16} /> Sertifikasi Dosen (Serdos)
        </button>

        <button
          onClick={() => {
            setKategori('tes');
            setJenisId('');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            kategori === 'tes'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <FileCheck size={16} /> Riwayat Tes (TOEFL / TKDA)
        </button>

        <button
          onClick={() => {
            setKategori('pelatihan');
            setJenisId('');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            kategori === 'pelatihan'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <GraduationCap size={16} /> Pelatihan & Workshop
        </button>
      </div>

      {/* Search Bar */}
      <div className="card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Cari dosen (nama, NIDN, NIP)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Ditemukan <strong>{meta.total}</strong> riwayat kompetensi
        </div>
      </div>

      {/* Data Table */}
      <div className="card p-0 overflow-hidden">
        <DataTable
          columns={columns}
          data={data}
          isLoading={isLoading}
          meta={meta}
          onPageChange={(p) => fetchData(p, meta.per_page)}
          onLimitChange={(l) => fetchData(1, l)}
          emptyMessage="Tidak ada data kompetensi yang sesuai dengan kriteria filter."
        />
      </div>

      {/* FILTER DRAWER */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Filter Pencarian Kompetensi"
        footer={
          <div className="flex items-center justify-between gap-3 w-full">
            <Button variant="outline" onClick={handleResetFilter}>
              Reset Filter
            </Button>
            <Button
              onClick={() => {
                setIsDrawerOpen(false);
                fetchData(1, meta.per_page);
              }}
            >
              Terapkan Filter
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4 py-2">
          <Select
            label="Kategori Kompetensi"
            value={kategori}
            onChange={(e: any) => {
              setKategori(e.target.value);
              setJenisId('');
            }}
            options={[
              { value: 'sertifikat', label: 'Sertifikasi Dosen' },
              { value: 'tes', label: 'Tes Kemampuan (TOEFL / TKDA)' },
              { value: 'pelatihan', label: 'Pelatihan / Diklat / Workshop' },
            ]}
          />

          <Select
            label="Program Studi / Unit Kerja"
            value={unitKerjaId}
            onChange={(e) => setUnitKerjaId(e.target.value)}
            options={[
              { value: '', label: '-- Semua Unit Kerja / Prodi --' },
              ...unitKerjaList.map((u) => ({
                value: u.id.toString(),
                label: `${u.nama} (${u.tipe.toUpperCase()})`,
              })),
            ]}
          />

          {kategori === 'sertifikat' && (
            <Select
              label="Jenis Sertifikasi"
              value={jenisId}
              onChange={(e) => setJenisId(e.target.value)}
              options={[
                { value: '', label: '-- Semua Jenis Sertifikasi --' },
                ...(masters?.jenis_sertifikasi || []).map((j) => ({
                  value: j.id.toString(),
                  label: j.nama,
                })),
              ]}
            />
          )}

          {kategori === 'tes' && (
            <>
              <Select
                label="Jenis Tes"
                value={jenisId}
                onChange={(e) => setJenisId(e.target.value)}
                options={[
                  { value: '', label: '-- Semua Jenis Tes --' },
                  ...(masters?.jenis_tes || []).map((t) => ({
                    value: t.id.toString(),
                    label: t.nama,
                  })),
                ]}
              />

              <Input
                label="Skor Minimal"
                type="number"
                placeholder="Contoh: 500"
                value={skorMin}
                onChange={(e) => setSkorMin(e.target.value)}
              />
            </>
          )}

          {kategori === 'pelatihan' && (
            <Select
              label="Jenis Pelatihan"
              value={jenisId}
              onChange={(e) => setJenisId(e.target.value)}
              options={[
                { value: '', label: '-- Semua Jenis Pelatihan --' },
                ...(masters?.jenis_pelatihan || []).map((p) => ({
                  value: p.id.toString(),
                  label: p.nama,
                })),
              ]}
            />
          )}

          <Input
            label="Tahun"
            type="number"
            placeholder="Contoh: 2025"
            value={tahun}
            onChange={(e) => setTahun(e.target.value)}
          />
        </div>
      </Drawer>
    </div>
  );
}
