'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, type SelectOption } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { siakadService } from '@/services/siakad.service';
import { useAuth } from '@/hooks/useAuth';
import { useObeFilterContext } from '@/lib/obe-settings';
import {
  FileText,
  Filter,
  Edit2,
  Eye,
  Printer,
  BookOpen,
} from 'lucide-react';
import toast from 'react-hot-toast';

const SEMESTER_OPTIONS: SelectOption[] = [
  { value: '', label: 'Semua Semester' },
  { value: '1', label: 'Semester 1' },
  { value: '2', label: 'Semester 2' },
  { value: '3', label: 'Semester 3' },
  { value: '4', label: 'Semester 4' },
  { value: '5', label: 'Semester 5' },
  { value: '6', label: 'Semester 6' },
  { value: '7', label: 'Semester 7' },
  { value: '8', label: 'Semester 8' },
];

const SORT_BY_OPTIONS: SelectOption[] = [
  { value: 'created_at', label: 'Waktu Dibuat' },
  { value: 'semester', label: 'Semester' },
  { value: 'id', label: 'ID' },
];

const SORT_DIR_OPTIONS: SelectOption[] = [
  { value: 'asc', label: 'Menaik (A-Z)' },
  { value: 'desc', label: 'Menurun (Z-A)' },
];

export default function SiakadDosenRpsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    settings: obeSettings,
    loadTahunAkademikOptions,
    setTaLabels,
  } = useObeFilterContext();

  const [items, setItems] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);

  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterTahunAkademikId, setFilterTahunAkademikId] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [filterSortBy, setFilterSortBy] = useState('created_at');
  const [filterSortDir, setFilterSortDir] = useState<'asc' | 'desc'>('desc');

  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    tahunAkademikId: '',
    semester: '',
    sortBy: 'created_at',
    sortDir: 'desc' as 'asc' | 'desc',
  });

  const [modalRevisiRow, setModalRevisiRow] = useState<any | null>(null);

  // Sinkronisasi default filter TA dari Pengaturan OBE jika tersedia
  useEffect(() => {
    if (obeSettings?.tahun_akademik_id && !appliedFilters.tahunAkademikId) {
      const taIdStr = String(obeSettings.tahun_akademik_id);
      setFilterTahunAkademikId(taIdStr);
      setAppliedFilters((prev) => ({
        ...prev,
        tahunAkademikId: taIdStr,
      }));
    }
  }, [obeSettings?.tahun_akademik_id, appliedFilters.tahunAkademikId]);

  // Ambil data RPS dari backend
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {
        page,
        per_page: limit,
        sort_by: appliedFilters.sortBy,
        sort_order: appliedFilters.sortDir,
      };

      const activeTaId = appliedFilters.tahunAkademikId || obeSettings?.tahun_akademik_id;
      if (activeTaId) {
        params.tahun_akademik_id = Number(activeTaId);
      }
      if (appliedFilters.search) {
        params.search = appliedFilters.search;
      }
      if (appliedFilters.semester) {
        params.semester = appliedFilters.semester;
      }

      const res = await siakadService.getRps(params);
      const raw = res?.data;
      const list: any[] = Array.isArray(raw) ? raw : (raw?.items || raw?.data || []);
      setItems(list);
      setMeta(res?.meta || (raw?.meta ?? null));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memuat dokumen RPS');
      setItems([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [page, limit, appliedFilters, obeSettings?.tahun_akademik_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApplyFilter = () => {
    setAppliedFilters({
      search: filterSearch,
      tahunAkademikId: filterTahunAkademikId,
      semester: filterSemester,
      sortBy: filterSortBy,
      sortDir: filterSortDir,
    });
    setPage(1);
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    const defaultTa = obeSettings?.tahun_akademik_id ? String(obeSettings.tahun_akademik_id) : '';
    setFilterTahunAkademikId(defaultTa);
    setFilterSemester('');
    setFilterSortBy('created_at');
    setFilterSortDir('desc');
    setAppliedFilters({
      search: '',
      tahunAkademikId: defaultTa,
      semester: '',
      sortBy: 'created_at',
      sortDir: 'desc',
    });
    setPage(1);
    setShowFilter(false);
  };

  // Filter:
  // 1. Tahun Akademik sesuai filter setting OBE (jika tersetting)
  // 2. Dosen anggota id / dosen koordinator id sama dengan user id yang aktif login (atau dosen id tertaut)
  const filteredItems = useMemo(() => {
    if (!items || items.length === 0) return [];
    const activeUserId = Number(user?.id);
    const activeDosenId = Number((user as any)?.dosen?.id || (user as any)?.pegawai?.id || 0);
    const filterTaId = appliedFilters.tahunAkademikId
      ? Number(appliedFilters.tahunAkademikId)
      : (obeSettings?.tahun_akademik_id ? Number(obeSettings.tahun_akademik_id) : null);

    return items.filter((row: any) => {
      // 1. Cek kesesuaian Tahun Akademik
      if (filterTaId) {
        const rowTaId = row.tahun_akademik_id ? Number(row.tahun_akademik_id) : null;
        if (rowTaId && rowTaId !== filterTaId) {
          return false;
        }
      }

      // 2. Cek apakah user aktif adalah dosen koordinator atau anggota di RPS
      if (!activeUserId) return true;

      // Cek dosen_koordinator_id
      if (Number(row.dosen_koordinator_id) === activeUserId) return true;
      if (activeDosenId && Number(row.dosen_koordinator_id) === activeDosenId) return true;

      // Cek dosen_koordinator objek
      if (row.dosen_koordinator) {
        const kId = Number(row.dosen_koordinator.id || 0);
        const kUserId = Number(row.dosen_koordinator.user_id || 0);
        if (kId === activeUserId || kUserId === activeUserId) return true;
        if (activeDosenId && kId === activeDosenId) return true;
      }

      // Cek dosen_anggota_ids (array id)
      if (Array.isArray(row.dosen_anggota_ids)) {
        const ids = row.dosen_anggota_ids.map(Number);
        if (ids.includes(activeUserId)) return true;
        if (activeDosenId && ids.includes(activeDosenId)) return true;
      }

      // Cek dosen_anggotas & dosen_anggota_details
      const anggotas: any[] = [
        ...(Array.isArray(row.dosen_anggotas) ? row.dosen_anggotas : []),
        ...(Array.isArray(row.dosen_anggota_details) ? row.dosen_anggota_details : []),
      ];

      return anggotas.some((a: any) => {
        const aId = Number(a.id || a.dosen_id || 0);
        const aUserId = Number(a.user_id || 0);
        if (aId === activeUserId || aUserId === activeUserId) return true;
        if (activeDosenId && aId === activeDosenId) return true;
        return false;
      });
    });
  }, [items, user, appliedFilters.tahunAkademikId, obeSettings?.tahun_akademik_id]);

  const taLabel =
    obeSettings?.tahun_akademik_label ||
    (appliedFilters.tahunAkademikId
      ? `Tahun Akademik #${appliedFilters.tahunAkademikId}`
      : (obeSettings?.tahun_akademik_id ? `Tahun Akademik #${obeSettings.tahun_akademik_id}` : 'Semua Tahun Akademik'));

  const semesterLabel = obeSettings?.semester || (appliedFilters.semester ? `Semester ${appliedFilters.semester}` : 'Semua Semester');

  const columns: ColumnDef<any>[] = useMemo(
    () => [
      {
        key: 'mata_kuliah',
        label: 'Mata Kuliah',
        render: (row) => {
          const mk = row.mata_kuliah || row.mataKuliah;
          const kodeMk = mk?.kode_mk || mk?.kode || '-';
          const namaMk = mk?.nama || 'Tanpa Nama Mata Kuliah';
          const prodiName =
            row.program_studi_nama ||
            mk?.kurikulum?.program_studi?.nama ||
            row.program_studi?.nama;

          return (
            <div>
              <span className="font-bold text-slate-900 text-xs tracking-tight uppercase block font-mono">
                {kodeMk} - {namaMk}
              </span>
              {prodiName && (
                <span className="text-2xs text-slate-500 font-medium block mt-0.5">
                  Prodi: {prodiName}
                </span>
              )}
            </div>
          );
        },
      },
      {
        key: 'semester',
        label: 'Semester',
        align: 'center',
        render: (row) => {
          const mk = row.mata_kuliah || row.mataKuliah;
          const semester = row.semester || mk?.semester_anjuran || 1;
          return (
            <span className="text-xs font-semibold text-slate-800">
              {semester}
            </span>
          );
        },
      },
      {
        key: 'dosen',
        label: 'Dosen',
        render: (row) => {
          const dosenList: any[] = [];
          if (row.dosen_koordinator) {
            dosenList.push(row.dosen_koordinator);
          }
          const anggotaDetails = Array.isArray(row.dosen_anggota_details) ? row.dosen_anggota_details : [];
          const anggotas = Array.isArray(row.dosen_anggotas) ? row.dosen_anggotas : [];
          const rawAnggotaList = anggotaDetails.length > 0 ? anggotaDetails : anggotas;

          rawAnggotaList.forEach((a: any) => {
            const aName = a.nama_lengkap || a.nama || a.name || a.dosen_nama;
            if (aName && !dosenList.some((d: any) => (d.nama_lengkap || d.nama || d.name) === aName)) {
              dosenList.push(a);
            }
          });

          return (
            <div className="flex flex-col items-start gap-1.5">
              {dosenList.length > 0 ? (
                dosenList.map((d: any, dIdx: number) => {
                  const dName = d.nama_lengkap || d.nama || d.name || d.dosen_nama || 'Dosen Pengampu';
                  const isPrimary = dIdx === 0;
                  return (
                    <span
                      key={dIdx}
                      className={`inline-block px-3 py-0.5 rounded-full text-xs font-semibold shadow-2xs ${
                        isPrimary
                          ? 'bg-sky-500 text-white'
                          : 'bg-slate-800 text-white'
                      }`}
                    >
                      {dName}
                    </span>
                  );
                })
              ) : (
                <span className="text-slate-400 italic text-2xs">Belum ditentukan</span>
              )}
            </div>
          );
        },
      },
      {
        key: 'persetujuan',
        label: 'Persetujuan RPS',
        render: (row) => {
          const isApproved =
            row.status === 'disetujui' ||
            row.status === 'approved' ||
            row.status === 'approve';

          return isApproved ? (
            <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-600 text-white shadow-2xs">
              Sudah Disetujui
            </span>
          ) : (
            <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-rose-500 text-white shadow-2xs">
              Belum Disetujui
            </span>
          );
        },
      },
      {
        key: 'catatan',
        label: 'Catatan RPS',
        render: (row) => {
          const totalBobot = row.total_bobot ?? (row.has_rps ? 100 : 0);
          const hasDetailMetrics =
            typeof row.revisi_count !== 'undefined' ||
            typeof row.kerjakan_count !== 'undefined' ||
            typeof row.selesai_count !== 'undefined';

          const revisiCount = row.revisi_count ?? (row.status === 'revisi' ? 1 : 0);
          const kerjakanCount = row.kerjakan_count ?? (row.has_rps ? 0 : 16);
          const selesaiCount = row.selesai_count ?? (row.has_rps ? 16 : 0);

          return (
            <div className="flex flex-wrap items-center gap-1.5">
              {hasDetailMetrics ? (
                <>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500 text-white shadow-2xs">
                    Revisi: {revisiCount}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500 text-white shadow-2xs">
                    Kerjakan: {kerjakanCount}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-white shadow-2xs">
                    Selesai: {selesaiCount}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500 text-white shadow-2xs">
                    Total Bobot: {totalBobot}
                  </span>
                </>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500 text-white shadow-2xs">
                  Total Bobot: {totalBobot}
                </span>
              )}
            </div>
          );
        },
      },
      {
        key: 'actions',
        label: 'Opsi',
        align: 'center',
        render: (row) => (
          <DropdownMenu
            items={[
              {
                label: 'Edit RPS',
                icon: <Edit2 size={14} />,
                onClick: () => {
                  if (row.has_rps && row.id) {
                    router.push(`/siakad/obe/rps/${row.id}/edit`);
                  } else {
                    router.push(`/siakad/obe/rps/kelola/create?mata_kuliah_id=${row.mata_kuliah_id}`);
                  }
                },
              },
              {
                label: 'Detail RPS',
                icon: <Eye size={14} />,
                onClick: () => {
                  if (row.has_rps && row.id) {
                    router.push(`/siakad/obe/rps/${row.id}`);
                  } else {
                    router.push(`/siakad/obe/rps/kelola/create?mata_kuliah_id=${row.mata_kuliah_id}`);
                  }
                },
              },
              {
                label: 'Catatan Revisi RPS',
                icon: <FileText size={14} />,
                onClick: () => setModalRevisiRow(row),
              },
              {
                label: 'Cetak RPS',
                icon: <Printer size={14} />,
                onClick: () => {
                  if (row.has_rps && row.id) {
                    window.open(`/siakad/obe/rps/${row.id}/cetak`, '_blank');
                  } else {
                    toast.error('Dokumen RPS belum disusun, silakan buat dokumen RPS terlebih dahulu');
                  }
                },
              },
            ]}
          />
        ),
      },
    ],
    [router]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rencana Pembelajaran Semester (RPS)"
        description="Portal peninjauan dan penyusunan RPS pengampu Anda yang diselaraskan dengan Tahun Akademik aktif di Pengaturan OBE."
        breadcrumbs={[
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'RPS' },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilter(true)}
            >
              <Filter size={16} className="mr-1.5" />
              Filter
            </Button>
          </div>
        }
      />

      {/* Banner Konteks Filter Aktif OBE */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary-50 text-primary-600">
            <BookOpen size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-800">Konteks Aktif OBE:</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-100 text-primary-800 border border-primary-200">
                {taLabel}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                {semesterLabel}
              </span>
              {user && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                  Dosen Pengampu: {user.nama_lengkap || user.name || user.username}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Menampilkan mata kuliah di mana Anda terdaftar sebagai koordinator atau dosen anggota pada tahun akademik terpilih.
            </p>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <button
            onClick={() => router.push('/siakad/obe/settings')}
            className="text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline cursor-pointer"
          >
            Ubah Pengaturan OBE →
          </button>
        </div>
      </div>

      {/* Tabel RPS per Program Studi via DataTable Standar */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredItems}
          isLoading={loading}
          meta={meta}
          onPageChange={setPage}
          onLimitChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
          emptyMessage="Tidak ditemukan data RPS pengampu Anda untuk periode ini. Pastikan Anda telah di-ploting pada distribusi mengajar atau gunakan Filter untuk menyesuaikan periode."
        />
      </div>

      {/* Drawer Filter Terstandarisasi */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Dokumen RPS"
        width="400px"
      >
        <div className="space-y-4">
          <Input
            label="Kata Kunci"
            placeholder="Cari kode MK, nama MK..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />

          <AsyncSelect
            label="Tahun Akademik"
            placeholder="Semua tahun akademik..."
            loadOptions={loadTahunAkademikOptions}
            value={filterTahunAkademikId ? Number(filterTahunAkademikId) : null}
            onChange={(opt: any) => {
              const val = opt?.value ? String(opt.value) : '';
              setFilterTahunAkademikId(val);
              if (val && (opt?.cleanLabel || opt?.label)) {
                setTaLabels((prev) => ({ ...prev, [val]: opt.cleanLabel || opt.label }));
              }
            }}
            isClearable
          />

          <Select
            label="Semester"
            options={SEMESTER_OPTIONS}
            value={filterSemester}
            onChange={(v) => setFilterSemester(String(v || ''))}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Urutkan Berdasarkan"
              options={SORT_BY_OPTIONS}
              value={filterSortBy}
              onChange={(v) => setFilterSortBy(String(v || 'created_at'))}
            />
            <Select
              label="Arah Urutan"
              options={SORT_DIR_OPTIONS}
              value={filterSortDir}
              onChange={(v) => setFilterSortDir((v as 'asc' | 'desc') || 'desc')}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={handleResetFilter}>
              Reset
            </Button>
            <Button variant="primary" onClick={handleApplyFilter}>
              Terapkan
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Modal Catatan Revisi RPS */}
      <Modal
        isOpen={Boolean(modalRevisiRow)}
        onClose={() => setModalRevisiRow(null)}
        title="Catatan Revisi RPS"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">Mata Kuliah</span>
            <span className="text-xs font-bold text-slate-800 block mt-0.5">
              {modalRevisiRow?.mata_kuliah?.kode_mk ? `${modalRevisiRow.mata_kuliah.kode_mk} - ` : ''}
              {modalRevisiRow?.mata_kuliah?.nama || '-'}
            </span>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-2xs font-semibold text-slate-500">Status Dokumen:</span>
              <span className="px-2 py-0.5 rounded text-2xs font-bold uppercase bg-amber-100 text-amber-800">
                {modalRevisiRow?.status || 'Draft'}
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Catatan dari Reviewer / Kaprodi:
            </label>
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed min-h-[90px] whitespace-pre-wrap">
              {modalRevisiRow?.catatan_revisi || 'Belum ada catatan revisi untuk dokumen RPS ini.'}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModalRevisiRow(null)}
            >
              Tutup
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
