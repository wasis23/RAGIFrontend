'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarCheck, MapPin, Plus, Search, Filter, Clock, Users, Edit3, Trash2, BookOpen, FileText, CheckCircle2, Award, Download, MoreVertical } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { SIAKAD_OPTION_TYPES, useSiakadOptions } from '@/lib/siakad-options';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu, type DropdownMenuItem } from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { siakadService } from '@/services/siakad.service';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function PerkuliahanKelasPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [kelas, setKelas] = useState<any[]>([]);
  const [matakuliahs, setMatakuliahs] = useState<any[]>([]);
  const [dosens, setDosens] = useState<any[]>([]);
  const [prodis, setProdis] = useState<any[]>([]);
  const [tahunAkademiks, setTahunAkademiks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter Drawer State
  const [showFilter, setShowFilter] = useState(false);
  const [search, setSearch] = useState('');
  const [filterHari, setFilterHari] = useState('');
  const [filterProdi, setFilterProdi] = useState('');
  const [filterPeriode, setFilterPeriode] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    hari: '',
    prodi: '',
    periode: '',
  });
  const activePeriode = tahunAkademiks.find((t) => String(t.id) === String(appliedFilters.periode || filterPeriode)) || tahunAkademiks.find((t) => t.is_active);
  const hariOptions = useSiakadOptions(SIAKAD_OPTION_TYPES.HARI_KULIAH);

  // Check roles
  const userRoles = user?.roles?.map((r: any) => typeof r === 'string' ? r : r.slug) || [];
  const isMahasiswa = userRoles.includes('mahasiswa');
  const isDosen = userRoles.includes('dosen');
  const isAdmin = userRoles.includes('superadmin') || userRoles.includes('admin');

  // Modal Kelas dihapus — buka/edit kelas via halaman form penuh
  // (/siakad/perkuliahan/kelas/create dan /siakad/perkuliahan/kelas/[id]/edit)
  // Input absensi pindah ke halaman penuh: /siakad/perkuliahan/kelas/[id]/absensi
  const [ruangans, setRuangans] = useState<any[]>([]);


  const fetchOptions = async () => {
    try {
      const [mRes, dRes, pRes, rRes, taRes] = await Promise.all([
        siakadService.getMataKuliahs({ per_page: 200 }),
        siakadService.getDosens({ per_page: 200 }),
        siakadService.getProdi(),
        siakadService.getRefRuangan(),
        siakadService.getTahunAkademiks(),
      ]);
      if (mRes.data) setMatakuliahs(mRes.data);
      if (dRes.data) setDosens(dRes.data);
      if (pRes.data) setProdis(pRes.data);
      if (rRes.data) setRuangans(rRes.data);
      if (taRes.data) {
        setTahunAkademiks(taRes.data);
        const active = taRes.data.find((t: any) => t.is_active) || taRes.data[0];
        if (active) {
          setFilterPeriode(String(active.id));
          setAppliedFilters((prev) => (prev.periode ? prev : { ...prev, periode: String(active.id) }));
        }
      }
    } catch (err) {}
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
      if (res.data) setKelas(res.data);
    } catch (err: any) {
      toast.error('Gagal memuat jadwal kelas');
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

  const [kelasToDelete, setKelasToDelete] = useState<any | null>(null);
  const [deletingKelas, setDeletingKelas] = useState(false);

  const handleDeleteKelas = async () => {
    if (!kelasToDelete) return;
    try {
      setDeletingKelas(true);
      await siakadService.deleteKelas(kelasToDelete.id);
      toast.success('Kelas perkuliahan berhasil dihapus');
      setKelasToDelete(null);
      fetchKelas();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menghapus kelas');
    } finally {
      setDeletingKelas(false);
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      key: 'kode_kelas',
      label: 'KODE KELAS',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-slate-900 text-xs block">
            {row.kode_kelas}
          </span>
          {row.is_gabungan && (
            <span className="badge badge-purple text-2xs font-bold mt-0.5" title={`Gabungan: ${((row.program_studis || []).map((p: any) => p.nama).join(', ') || row.program_studi?.nama || '')}`}>
              Gabungan {(row.program_studis || []).length > 0 ? `(${(row.program_studis || []).length} prodi)` : ''}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'program_studi',
      label: 'PROGRAM STUDI',
      render: (row) => (
        <Badge variant="blue">
          {row.program_studi?.nama || row.mata_kuliah?.kurikulum?.program_studi?.nama || 'S1 Sistem Informasi'}
        </Badge>
      ),
    },
    {
      key: 'mata_kuliah',
      label: 'MATA KULIAH',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">
            {row.mata_kuliah?.nama}
          </span>
          <span className="text-2xs text-slate-500 font-normal">
            ({row.mata_kuliah?.total_sks} SKS • {row.mata_kuliah?.kode_mk})
          </span>
        </div>
      ),
    },
    // Kolom pengampu disembunyikan untuk dosen (seluruh baris adalah kelasnya sendiri)
    ...(!isDosen
      ? [
          {
            key: 'dosen_pengampu',
            label: 'DOSEN PENGAMPU',
            render: (row: any) => (
              <div>
                <span className="font-bold text-slate-900 block text-xs">
                  {row.dosen_pengampu?.find((dp: any) => dp.peran === 'pengampu_utama')?.dosen?.nama_lengkap ||
                    row.dosen_pengampu?.[0]?.dosen?.nama_lengkap ||
                    'Dosen Pengampu'}
                </span>
                {row.dosen_pengampu?.length > 1 && (
                  <div className="mt-0.5">
                    <Badge variant="purple" className="text-2xs">
                      +{row.dosen_pengampu.length - 1} Tim Teaching
                    </Badge>
                  </div>
                )}
              </div>
            ),
          },
        ]
      : []),
    {
      key: 'jadwal',
      label: 'JADWAL & WAKTU',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-800 capitalize block text-xs">
            {row.hari}
          </span>
          <span className="text-2xs text-slate-500 font-mono">
            {row.jam_mulai ? row.jam_mulai.slice(0, 5) : '08:00'} -{' '}
            {row.jam_selesai ? row.jam_selesai.slice(0, 5) : '10:30'} WIB
          </span>
        </div>
      ),
    },
    {
      key: 'ruangan',
      label: 'RUANGAN (SINAPRA)',
      render: (row) =>
        row.ruangan ? (
          <div>
            <Badge variant="purple" className="inline-flex items-center gap-1">
              <MapPin size={11} /> {row.ruangan.nama}
            </Badge>
            <span className="block text-[10px] text-slate-500 font-medium mt-0.5">
              {row.ruangan.gedung?.nama || 'Gedung'} • Lt. {row.ruangan.lantai || 1} ({row.ruangan.kapasitas} Kursi)
            </span>
          </div>
        ) : (
          <Badge variant="gray" className="inline-flex items-center gap-1">
            <MapPin size={11} /> Belum diatur
          </Badge>
        ),
    },
    {
      key: 'lms',
      label: 'KELAS LMS',
      align: 'center' as const,
      render: (row: any) => (
        <Button
          variant="outline"
          icon={<BookOpen size={12} />}
          className="text-2xs py-1 px-2.5 h-auto font-bold text-emerald-700 border-emerald-200 hover:bg-emerald-50"
          onClick={() => router.push(`/siakad/lms/${row.id}`)}
          title="Buka kelas ini di LMS terintegrasi (materi, presensi & tugas)"
        >
          Buka LMS
        </Button>
      ),
    },
    ...(!isMahasiswa && !isDosen
      ? [
          {
            key: 'kuota',
            label: 'KUOTA',
            align: 'center' as const,
            render: (row: any) => (
              <span className="tabular-nums font-bold text-slate-800 text-xs">
                {row.krs_details_count || 0} / {row.kapasitas}
              </span>
            ),
          },
        ]
      : []),
    {
      key: 'actions',
      label: 'AKSI',
      align: 'right',
      render: (row) => {
        const items: DropdownMenuItem[] = [
          {
            label: 'Kelola RPS 16 Minggu',
            icon: <FileText size={14} />,
            onClick: () => {
              router.push(`/siakad/perkuliahan/kelas/${row.id}/rps`);
            },
          },
        ];

        if (isDosen || isAdmin) {
          items.push({
            label: 'Input Nilai Mahasiswa (OBE)',
            icon: <Award size={14} />,
            onClick: () => {
              router.push(`/siakad/nilai/input/${row.id}`);
            },
          });
        }

        if (isDosen || isAdmin) {
          items.push({
            label: 'Input Absensi Mahasiswa',
            icon: <CalendarCheck size={14} />,
            onClick: () => {
              router.push(`/siakad/perkuliahan/kelas/${row.id}/absensi`);
            },
          });
        }

        if (!isMahasiswa && !isDosen) {
          items.push(
            {
              label: 'Edit Kelas',
              icon: <Edit3 size={14} />,
              onClick: () => {
                router.push(`/siakad/perkuliahan/kelas/${row.id}/edit`);
              },
            },
            {
              label: 'Hapus Kelas',
              icon: <Trash2 size={14} />,
              variant: 'danger' as const,
              onClick: () => {
                setKelasToDelete(row);
              },
            }
          );
        }

        return <DropdownMenu items={items} />;
      },
    },
  ];

  return (
    <div>
      <div className="space-y-6 animate-fade-in print:hidden">
        <PageHeader
          title={
            isMahasiswa
              ? 'Jadwal Kuliah & RPS Saya'
              : isDosen
              ? 'Jadwal Mengajar & RPS Pengampu'
              : 'Jadwal Perkuliahan & Penggunaan Ruang'
          }
          description={
            isMahasiswa
              ? 'Jadwal tatap muka mingguan, alokasi ruang kelas SINAPRA, dosen pengampu, dan Rencana Pembelajaran Semester (RPS).'
              : isDosen
              ? 'Daftar kelas yang diampu pada semester aktif, kuota mahasiswa, dan silabus RPS perkuliahan.'
              : 'Alokasi jadwal kelas, ruang perkuliahan terintegrasi modul SINAPRA, dan penetapan dosen pengampu.'
          }
          breadcrumbs={[
            { label: 'Portal SSO', href: '/dashboard' },
            { label: 'SIAKAD', href: '/siakad' },
            { label: 'Jadwal Perkuliahan' },
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
              {!isMahasiswa && !isDosen && (
                <Button
                  variant="primary"
                  icon={<Plus size={16} />}
                  onClick={() => router.push('/siakad/perkuliahan/kelas/create')}
                >
                  Buka Kelas Baru
                </Button>
              )}
            </div>
          }
        />

        {/* Filter Hari Tab Bar (Khusus Mahasiswa & Dosen) */}
        <div className="flex items-center gap-2 flex-wrap">
          {activePeriode && (
            <Badge variant="blue" className="inline-flex items-center gap-1.5 px-3 py-1.5">
              <CalendarCheck size={12} />
              {activePeriode.nama}
              {activePeriode.is_active ? ' • Aktif' : ''}
            </Badge>
          )}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 flex-1 text-xs">
          {[{ value: '', label: 'Semua Hari' }, ...hariOptions].map((hari) => (
            <button
              key={hari.value}
              onClick={() => {
                setFilterHari(hari.value);
                setAppliedFilters((prev) => ({ ...prev, hari: hari.value }));
              }}
              className={`px-4 py-2 font-bold rounded-xl transition whitespace-nowrap capitalize cursor-pointer ${
                appliedFilters.hari === hari.value
                  ? 'bg-primary-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              {hari.label}
            </button>
          ))}
          </div>
        </div>

        {/* DataTable */}
        <DataTable
          columns={columns}
          data={kelas}
          isLoading={loading}
          emptyMessage="Belum ada kelas perkuliahan yang sesuai filter."
        />
      </div>

      {/* Filter Drawer */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Jadwal Kelas"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setSearch('');
                setFilterHari('');
                setFilterProdi('');
                setFilterPeriode(activePeriode ? String(activePeriode.id) : '');
                setAppliedFilters({ search: '', hari: '', prodi: '', periode: activePeriode ? String(activePeriode.id) : '' });
                setShowFilter(false);
              }}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setAppliedFilters({
                  search,
                  hari: filterHari,
                  prodi: filterProdi,
                  periode: filterPeriode,
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
            label="Pencarian Kelas"
            placeholder="Cari mata kuliah, ruang, atau dosen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Select
            label="Periode Akademik"
            placeholder="Pilih periode semester..."
            options={tahunAkademiks.map((ta) => ({
              value: ta.id,
              label: `${ta.nama}${ta.is_active ? ' — Aktif' : ''}`,
            }))}
            value={filterPeriode || ''}
            onChange={(val: any) => setFilterPeriode(String(val || ''))}
          />

          <Select
            label="Program Studi"
            placeholder="Semua Program Studi"
            options={prodis.map((p) => ({
              value: p.id,
              label: `${p.nama}${p.jenjang ? ` (${p.jenjang})` : ''}`,
            }))}
            value={filterProdi || ''}
            onChange={(val: any) => setFilterProdi(String(val || ''))}
            isClearable
          />

          <Select
            label="Hari Perkuliahan"
            placeholder="Semua Hari"
            options={hariOptions}
            value={filterHari || ''}
            onChange={(val: any) => setFilterHari(String(val || ''))}
            isClearable
          />
        </div>
      </Drawer>

      {/* ======================================================== */}
      {/* DOKUMEN CETAK RPS RESMI (SN-DIKTI / OBE) — KHUSUS PRINT */}
      {/* ======================================================== */}
      <ConfirmDialog
        isOpen={!!kelasToDelete}
        onClose={() => setKelasToDelete(null)}
        onConfirm={handleDeleteKelas}
        title="Hapus Kelas Perkuliahan?"
        message={`Kelas "${kelasToDelete?.nama_kelas}" (${kelasToDelete?.kode_kelas}) beserta pengampu dan KRS di dalamnya akan dihapus.`}
        confirmText="Ya, Hapus"
        variant="danger"
        isLoading={deletingKelas}
      />
    </div>
  );
}
