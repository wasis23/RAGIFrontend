'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarCheck,
  Filter,
  Clock,
  MapPin,
  Award,
  BookOpen,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { siakadService } from '@/services/siakad.service';
import { HARI_OPTIONS, SORT_ORDER_OPTIONS } from '@/lib/constants';
import { ABSENSI_SORT_BY_OPTIONS } from '@/types/lms.types';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function PresensiPerkuliahanPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const userRoles = user?.roles?.map((r: any) => (typeof r === 'string' ? r : r.slug)) || [];
  const isMahasiswa = userRoles.includes('mahasiswa');
  const isDosen = userRoles.includes('dosen');
  const isAdmin = userRoles.includes('superadmin') || userRoles.includes('admin') || userRoles.includes('baak');

  const [kelasList, setKelasList] = useState<any[]>([]);
  const [tahunAkademiks, setTahunAkademiks] = useState<any[]>([]);
  const [prodis, setProdis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter Drawer States
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterPeriode, setFilterPeriode] = useState('');
  const [filterProdi, setFilterProdi] = useState('');
  const [filterHari, setFilterHari] = useState('');
  const [filterSortBy, setFilterSortBy] = useState('mata_kuliah');
  const [filterSortDir, setFilterSortDir] = useState<'asc' | 'desc'>('asc');

  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    periode: '',
    prodi: '',
    hari: '',
    sort_by: 'mata_kuliah',
    sort_dir: 'asc' as 'asc' | 'desc',
  });

  const fetchOptions = async () => {
    try {
      const [taRes, prodiRes] = await Promise.all([
        siakadService.getTahunAkademiks().catch(() => null),
        siakadService.getProdi().catch(() => null),
      ]);

      if (taRes?.data) {
        setTahunAkademiks(taRes.data);
        const active = taRes.data.find((t: any) => t.is_active) || taRes.data[0];
        if (active) {
          setFilterPeriode(String(active.id));
          setAppliedFilters((prev) => (prev.periode ? prev : { ...prev, periode: String(active.id) }));
        }
      }
      if (prodiRes?.data) {
        setProdis(prodiRes.data);
      }
    } catch {}
  };

  const fetchKelas = async () => {
    try {
      setLoading(true);
      const res = await siakadService.getKelas({
        search: appliedFilters.search || undefined,
        hari: appliedFilters.hari || undefined,
        program_studi_id: appliedFilters.prodi || undefined,
        tahun_akademik_id: appliedFilters.periode || undefined,
        my_teaching_only: isDosen && !isAdmin ? true : undefined,
        my_enrolled_only: isMahasiswa && !isAdmin ? true : undefined,
      });

      let items = res.data || [];

      // Client-side sorting
      if (appliedFilters.sort_by === 'mata_kuliah') {
        items.sort((a: any, b: any) => {
          const nameA = a.mata_kuliah?.nama || '';
          const nameB = b.mata_kuliah?.nama || '';
          return appliedFilters.sort_dir === 'desc'
            ? nameB.localeCompare(nameA)
            : nameA.localeCompare(nameB);
        });
      } else if (appliedFilters.sort_by === 'kode_kelas') {
        items.sort((a: any, b: any) => {
          const kA = a.kode_kelas || '';
          const kB = b.kode_kelas || '';
          return appliedFilters.sort_dir === 'desc'
            ? kB.localeCompare(kA)
            : kA.localeCompare(kB);
        });
      } else if (appliedFilters.sort_by === 'hari') {
        items.sort((a: any, b: any) => {
          const hA = a.hari || '';
          const hB = b.hari || '';
          return appliedFilters.sort_dir === 'desc'
            ? hB.localeCompare(hA)
            : hA.localeCompare(hB);
        });
      }

      setKelasList(items);
    } catch (err: any) {
      toast.error('Gagal memuat jadwal kelas untuk presensi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    fetchKelas();
  }, [appliedFilters]);

  const activePeriodeObj = tahunAkademiks.find((t) => String(t.id) === String(appliedFilters.periode));

  const columns: ColumnDef<any>[] = [
    {
      key: 'kode_kelas',
      label: 'KODE & KELAS',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-slate-900 text-xs block">
            {row.kode_kelas}
          </span>
          <span className="text-2xs text-slate-500 font-medium">
            {row.nama_kelas}
          </span>
          {row.is_gabungan && (
            <span className="badge badge-purple text-2xs font-bold mt-0.5 block w-fit">
              Gabungan
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'mata_kuliah',
      label: 'MATA KULIAH',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">
            {row.mata_kuliah?.nama || '-'}
          </span>
          <span className="text-2xs text-slate-500 font-mono">
            {row.mata_kuliah?.kode_mk} • {row.mata_kuliah?.total_sks} SKS (Sem. {row.mata_kuliah?.semester_anjuran || 1})
          </span>
        </div>
      ),
    },
    {
      key: 'program_studi',
      label: 'PROGRAM STUDI',
      render: (row) => (
        <Badge variant="blue">
          {row.program_studi?.nama || row.mata_kuliah?.kurikulum?.program_studi?.nama || 'Program Studi'}
        </Badge>
      ),
    },
    ...(!isDosen
      ? [
          {
            key: 'dosen_pengampu',
            label: 'DOSEN PENGAMPU',
            render: (row: any) => {
              const utama =
                row.dosen_pengampu?.find((dp: any) => dp.peran === 'pengampu_utama')?.dosen ||
                row.dosen_pengampu?.[0]?.dosen;
              return (
                <div>
                  <span className="font-bold text-slate-900 block text-xs">
                    {utama?.nama_lengkap || 'Dosen Pengampu'}
                  </span>
                  <span className="font-mono text-2xs text-slate-400">
                    NIDN: {utama?.nidn || '-'}
                  </span>
                </div>
              );
            },
          },
        ]
      : []),
    {
      key: 'jadwal',
      label: 'JADWAL & RUANG',
      render: (row) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-xs text-slate-800">
            <Clock size={12} className="text-slate-400 shrink-0" />
            <span className="capitalize font-semibold">{row.hari || '-'}</span>,{' '}
            <span className="font-mono">
              {row.jam_mulai ? String(row.jam_mulai).slice(0, 5) : ''} -{' '}
              {row.jam_selesai ? String(row.jam_selesai).slice(0, 5) : ''}
            </span>
          </div>
          <div className="flex items-center gap-2 text-2xs text-slate-500">
            <MapPin size={11} className="text-slate-400 shrink-0" />
            <span>{row.ruangan?.nama || 'Ruang Perkuliahan'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'kuota',
      label: 'KUOTA / PESERTA',
      align: 'center',
      render: (row) => (
        <div className="text-center font-mono text-xs">
          <span className="font-bold text-slate-900">{row.kapasitas || 40}</span>
          <span className="text-2xs text-slate-400 block font-sans">Kapasitas</span>
        </div>
      ),
    },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (row) => {
        if (isMahasiswa) {
          return (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                icon={<BookOpen size={14} />}
                className="text-2xs font-bold"
                onClick={() => router.push(`/siakad/lms/${row.id}`)}
              >
                Buka LMS
              </Button>
            </div>
          );
        }

        return (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="primary"
              size="sm"
              icon={<CalendarCheck size={14} />}
              className="text-2xs font-bold shadow-xs"
              onClick={() => router.push(`/siakad/perkuliahan/kelas/${row.id}/absensi`)}
            >
              Input Presensi
            </Button>
            <DropdownMenu
              items={[
                {
                  label: 'Input Absensi Mahasiswa',
                  icon: <CalendarCheck size={14} />,
                  onClick: () => router.push(`/siakad/perkuliahan/kelas/${row.id}/absensi`),
                },
                {
                  label: 'Input Nilai OBE',
                  icon: <Award size={14} />,
                  onClick: () => router.push(`/siakad/nilai/input/${row.id}`),
                },
                {
                  label: 'Lihat RPS & Pertemuan',
                  icon: <BookOpen size={14} />,
                  onClick: () => router.push(`/siakad/perkuliahan/kelas/${row.id}/rps`),
                },
              ]}
            />
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Presensi & Absensi Perkuliahan"
        description="Pusat pencatatan kehadiran mahasiswa per pertemuan perkuliahan, jurnal kelas, dan rekapitulasi kehadiran semester."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Perkuliahan', href: '/siakad/perkuliahan/kelas' },
          { label: 'Absensi Mahasiswa' },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setShowFilter(true)}
            >
              Filter
            </Button>
          </div>
        }
      />

      {/* Info Badge Tahun Akademik */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center font-black shrink-0">
            <CalendarCheck size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 text-xs">
                {activePeriodeObj ? `${activePeriodeObj.nama} (${activePeriodeObj.kode})` : 'Tahun Akademik Berjalan'}
              </span>
              {activePeriodeObj?.is_active && (
                <span className="badge badge-success text-2xs font-bold">Semester Aktif</span>
              )}
            </div>
            <p className="text-2xs text-slate-500 font-medium">
              {isMahasiswa
                ? 'Daftar mata kuliah yang Anda ikuti pada semester ini. Klik "Buka LMS" untuk melihat rekap kehadiran Anda.'
                : 'Pilih kelas perkuliahan di bawah ini untuk menginput dan merekap presensi kehadiran mahasiswa per pertemuan (1 s.d 16).'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-xs font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs">
            {kelasList.length} Kelas Perkuliahan
          </span>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={kelasList}
        isLoading={loading}
        emptyMessage="Belum ada data kelas perkuliahan yang ditemukan untuk periode ini."
      />

      {/* Filter Drawer */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Presensi Perkuliahan"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setFilterSearch('');
                const active = tahunAkademiks.find((t: any) => t.is_active) || tahunAkademiks[0];
                setFilterPeriode(active ? String(active.id) : '');
                setFilterProdi('');
                setFilterHari('');
                setFilterSortBy('mata_kuliah');
                setFilterSortDir('asc');
                setAppliedFilters({
                  search: '',
                  periode: active ? String(active.id) : '',
                  prodi: '',
                  hari: '',
                  sort_by: 'mata_kuliah',
                  sort_dir: 'asc',
                });
                setShowFilter(false);
              }}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setAppliedFilters({
                  search: filterSearch,
                  periode: filterPeriode,
                  prodi: filterProdi,
                  hari: filterHari,
                  sort_by: filterSortBy,
                  sort_dir: filterSortDir,
                });
                setShowFilter(false);
              }}
            >
              Terapkan
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-5">
          <Input
            label="Pencarian Kelas / Mata Kuliah"
            placeholder="Ketik kode, nama mata kuliah, atau kelas..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />

          <Select
            label="Tahun Akademik"
            placeholder="Pilih Tahun Akademik"
            options={tahunAkademiks.map((t) => ({
              value: String(t.id),
              label: `${t.nama} (${t.kode})${t.is_active ? ' • Aktif' : ''}`,
            }))}
            value={filterPeriode}
            onChange={(val: any) => setFilterPeriode(val ? String(val) : '')}
          />

          <Select
            label="Program Studi"
            placeholder="Semua Program Studi"
            options={prodis.map((p) => ({
              value: String(p.id),
              label: `${p.nama}${p.jenjang ? ` (${p.jenjang})` : ''}`,
            }))}
            value={filterProdi}
            onChange={(val: any) => setFilterProdi(val ? String(val) : '')}
            isClearable
          />

          <Select
            label="Hari Kuliah"
            placeholder="Semua Hari"
            options={HARI_OPTIONS}
            value={filterHari}
            onChange={(val: any) => setFilterHari(val ? String(val) : '')}
            isClearable
          />

          <hr className="border-t border-slate-200 my-1" />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={filterSortBy}
              onChange={(val: any) => setFilterSortBy(val ? String(val) : 'mata_kuliah')}
              options={ABSENSI_SORT_BY_OPTIONS}
            />
            <Select
              label="Arah"
              value={filterSortDir}
              onChange={(val: any) => setFilterSortDir(val === 'desc' ? 'desc' : 'asc')}
              options={SORT_ORDER_OPTIONS}
            />
          </div>
        </div>
      </Drawer>
    </div>
  );
}
