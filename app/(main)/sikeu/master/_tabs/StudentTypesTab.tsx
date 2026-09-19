'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Filter, Loader2, Save, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { PaginationMeta } from '@/types/api.types';

interface StudentType {
  id: number;
  mahasiswa_id: number;
  nim: string;
  nama_mahasiswa: string;
  tahun_angkatan: number;
  jalur_kelas: string;
  kelompok_ukt: number;
  program_studi_id?: number;
  prodi?: string;
  beasiswa_id?: number;
  beasiswa?: { id: number; nama: string; kode?: string };
  catatan_perubahan?: string;
}

const formSchema = z.object({
  mahasiswa_id: z.number().min(1, 'Mahasiswa wajib dipilih dari database'),
  nim: z.string().optional(),
  nama_mahasiswa: z.string().optional(),
  tahun_angkatan: z.number().min(2000, 'Tahun angkatan tidak valid'),
  jalur_kelas: z.string().min(1, 'Jalur kelas wajib dipilih'),
  kelompok_ukt: z.number().min(1, 'Golongan UKT minimal 1').max(8, 'Golongan UKT maksimal 8'),
  catatan_perubahan: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const uktOptions = [
  { value: '1', label: 'Golongan I (Subsidi Penuh)' },
  { value: '2', label: 'Golongan II (Subsidi Parsial)' },
  { value: '3', label: 'Golongan III (Reguler / Standar)' },
  { value: '4', label: 'Golongan IV (Menengah)' },
  { value: '5', label: 'Golongan V (Atas)' },
  { value: '6', label: 'Golongan VI (Eksekutif)' },
  { value: '7', label: 'Golongan VII (Khusus)' },
  { value: '8', label: 'Golongan VIII (Maksimal)' },
];

export interface StudentTypesTabProps {
  setHeaderAction?: (action: React.ReactNode) => void;
}

export function StudentTypesTab({ setHeaderAction }: StudentTypesTabProps = {}) {
  const [data, setData] = useState<StudentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined);

  // Filter Drawer
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterAngkatan, setFilterAngkatan] = useState('');
  const [filterProdi, setFilterProdi] = useState('');
  const [filterJalur, setFilterJalur] = useState('');
  const [filterUkt, setFilterUkt] = useState('');
  const [filterSortBy, setFilterSortBy] = useState('id');
  const [filterSortDir, setFilterSortDir] = useState<'asc' | 'desc'>('desc');

  // Applied Filters
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    angkatan: '',
    prodi: '',
    jalur: '',
    ukt: '',
    sortBy: 'id',
    sortDir: 'desc' as 'asc' | 'desc',
  });

  // Master References
  const [jalurKelasList, setJalurKelasList] = useState<{ value: string; label: string }[]>([]);
  const [prodiList, setProdiList] = useState<{ value: string; label: string }[]>([]);

  // Modal Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StudentType | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Student Search inside Add Modal
  const [studentSearch, setStudentSearch] = useState('');
  const [studentResults, setStudentResults] = useState<any[]>([]);
  const [selectedStudentObj, setSelectedStudentObj] = useState<any | null>(null);
  const [searchingStudent, setSearchingStudent] = useState(false);

  const {
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mahasiswa_id: 0,
      nim: '',
      nama_mahasiswa: '',
      tahun_angkatan: new Date().getFullYear(),
      jalur_kelas: 'Reguler',
      kelompok_ukt: 3,
      catatan_perubahan: '',
    },
  });

  // Load Reference Data (Jalur SPMB & Prodi)
  useEffect(() => {
    const loadReferences = async () => {
      try {
        const [resJalur, resProdi] = await Promise.all([
          sikeuService.getJalurKelasList().catch(() => ({ data: [] })),
          sikeuService.getProgramStudiList().catch(() => ({ data: [] })),
        ]);

        if (Array.isArray(resJalur?.data)) {
          setJalurKelasList(
            resJalur.data.map((j: any) => ({
              value: j.nama_jalur || j.nama || j.kode,
              label: j.nama_jalur || j.nama || j.kode,
            }))
          );
        }

        if (Array.isArray(resProdi?.data)) {
          setProdiList(
            resProdi.data.map((p: any) => ({
              value: String(p.id),
              label: p.jenjang ? `${p.jenjang} ${p.nama || p.nama_prodi}` : (p.nama || p.nama_prodi),
            }))
          );
        }
      } catch {
        // Ignore reference failure
      }
    };

    loadReferences();
  }, []);

  // Fetch Paginated Data from Server
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await sikeuService.getStudentBillingTypes({
        page,
        per_page: limit,
        q: appliedFilters.search || undefined,
        angkatan: appliedFilters.angkatan || undefined,
        program_studi_id: appliedFilters.prodi || undefined,
        jalur_kelas: appliedFilters.jalur || undefined,
        kelompok_ukt: appliedFilters.ukt || undefined,
        sort_by: appliedFilters.sortBy,
        sort_dir: appliedFilters.sortDir,
      });

      setData(Array.isArray(res.data) ? res.data : []);
      if (res.meta) {
        setMeta(res.meta);
      }
    } catch {
      setData([]);
      toast.error('Gagal memuat data tipe tagihan mahasiswa');
    } finally {
      setLoading(false);
    }
  }, [page, limit, appliedFilters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Student Search inside Add Modal (Debounced)
  useEffect(() => {
    if (!isModalOpen || editingItem) return;
    if (!studentSearch || studentSearch.trim().length === 0) {
      setStudentResults([]);
      setSearchingStudent(false);
      return;
    }

    let isMounted = true;
    setSearchingStudent(true);
    const timer = setTimeout(async () => {
      try {
        const res = await sikeuService.searchMahasiswa(studentSearch.trim());
        if (isMounted) {
          setStudentResults(Array.isArray(res.data) ? res.data : []);
        }
      } catch {
        if (isMounted) setStudentResults([]);
      } finally {
        if (isMounted) setSearchingStudent(false);
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [studentSearch, isModalOpen, editingItem]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setSelectedStudentObj(null);
    setStudentSearch('');
    reset({
      mahasiswa_id: 0,
      nim: '',
      nama_mahasiswa: '',
      tahun_angkatan: new Date().getFullYear(),
      jalur_kelas: jalurKelasList.length > 0 ? jalurKelasList[0].value : 'Reguler',
      kelompok_ukt: 3,
      catatan_perubahan: 'Penetapan awal mahasiswa',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: StudentType) => {
    setEditingItem(item);
    setSelectedStudentObj({
      id: item.mahasiswa_id,
      nama_mahasiswa: item.nama_mahasiswa,
      nim: item.nim,
      tahun_angkatan: item.tahun_angkatan,
      prodi: item.prodi,
    });
    reset({
      mahasiswa_id: item.mahasiswa_id,
      nim: item.nim,
      nama_mahasiswa: item.nama_mahasiswa,
      tahun_angkatan: item.tahun_angkatan,
      jalur_kelas: item.jalur_kelas,
      kelompok_ukt: item.kelompok_ukt,
      catatan_perubahan: item.catatan_perubahan || '',
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (formData: FormValues) => {
    setSubmitting(true);
    try {
      if (editingItem) {
        await sikeuService.updateStudentBillingType(editingItem.id, {
          jalur_kelas: formData.jalur_kelas,
          kelompok_ukt: formData.kelompok_ukt,
          catatan_perubahan: formData.catatan_perubahan || 'Penyesuaian tipe & UKT mahasiswa',
        });
        toast.success('Tipe tagihan mahasiswa berhasil diperbarui dan disinkronkan ke SIAKAD/SPMB');
      } else {
        await sikeuService.assignStudentBillingType({
          ...formData,
          nim: selectedStudentObj?.nim || formData.nim,
          nama_mahasiswa: selectedStudentObj?.nama_mahasiswa || formData.nama_mahasiswa,
        });
        toast.success('Penetapan tipe tagihan mahasiswa baru berhasil disimpan dan disinkronkan');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal menyimpan penetapan tipe tagihan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyFilter = () => {
    setAppliedFilters({
      search: filterSearch,
      angkatan: filterAngkatan,
      prodi: filterProdi,
      jalur: filterJalur,
      ukt: filterUkt,
      sortBy: filterSortBy,
      sortDir: filterSortDir,
    });
    setPage(1);
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterAngkatan('');
    setFilterProdi('');
    setFilterJalur('');
    setFilterUkt('');
    setFilterSortBy('id');
    setFilterSortDir('desc');
    setAppliedFilters({
      search: '',
      angkatan: '',
      prodi: '',
      jalur: '',
      ukt: '',
      sortBy: 'id',
      sortDir: 'desc',
    });
    setPage(1);
    setShowFilter(false);
  };

  const isFiltered = Boolean(
    appliedFilters.search ||
    appliedFilters.angkatan ||
    appliedFilters.prodi ||
    appliedFilters.jalur ||
    appliedFilters.ukt
  );

  // Set Header Action in PageHeader
  useEffect(() => {
    if (setHeaderAction) {
      setHeaderAction(
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => setShowFilter(true)}
            icon={<Filter size={16} />}
            className="font-bold min-h-[38px] text-xs"
          >
            Filter
            {isFiltered && <span className="w-1.5 h-1.5 rounded-full bg-primary-600 ml-1"></span>}
          </Button>
          <Button
            variant="primary"
            onClick={handleOpenAdd}
            icon={<Plus size={16} />}
            className="font-bold min-h-[38px] text-xs px-3.5 shadow-sm"
          >
            Penetapan Tipe Mahasiswa
          </Button>
        </div>
      );
    }
  }, [setHeaderAction, isFiltered]);

  const columns: ColumnDef<StudentType>[] = [
    {
      key: 'nama_mahasiswa',
      label: 'MAHASISWA',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900 text-sm">{row.nama_mahasiswa}</p>
          <p className="font-mono text-xs text-slate-500">NIM: {row.nim}</p>
        </div>
      ),
    },
    {
      key: 'prodi',
      label: 'PROGRAM STUDI',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-800 text-xs">{row.prodi || '-'}</p>
        </div>
      ),
    },
    {
      key: 'tahun_angkatan',
      label: 'ANGKATAN',
      render: (row) => <span className="font-bold text-slate-700 text-xs">{row.tahun_angkatan}</span>,
    },
    {
      key: 'jalur_kelas',
      label: 'JALUR KELAS',
      render: (row) => <span className="badge badge-purple text-xs font-bold">{row.jalur_kelas}</span>,
    },
    {
      key: 'kelompok_ukt',
      label: 'GOLONGAN UKT',
      render: (row) => <span className="badge badge-blue text-xs font-bold">Golongan {row.kelompok_ukt}</span>,
    },
    {
      key: 'beasiswa',
      label: 'BEASISWA',
      render: (row) => (
        <span className="font-medium text-slate-600 text-xs">
          {row.beasiswa?.nama ? (
            <span className="text-emerald-700 font-bold">{row.beasiswa.nama}</span>
          ) : (
            <span className="text-slate-400 italic">Reguler (Tanpa Beasiswa)</span>
          )}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end">
          <DropdownMenu
            align="right"
            items={[
              {
                label: 'Ubah Tipe / Golongan',
                icon: <Edit size={14} />,
                onClick: () => handleOpenEdit(row),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      {!setHeaderAction && (
        <div className="flex items-center justify-end gap-2 flex-wrap mb-4">
          <Button
            variant="outline"
            onClick={() => setShowFilter(true)}
            icon={<Filter size={16} />}
            className="font-bold min-h-[38px] text-xs"
          >
            Filter
            {isFiltered && <span className="w-1.5 h-1.5 rounded-full bg-primary-600 ml-1"></span>}
          </Button>
          <Button
            variant="primary"
            onClick={handleOpenAdd}
            icon={<Plus size={16} />}
            className="font-bold min-h-[38px] text-xs px-3.5 shadow-sm"
          >
            Penetapan Tipe Mahasiswa
          </Button>
        </div>
      )}

      {/* Info Banner Integrasi Otomatis */}
      <div className="p-4 bg-primary-50/60 border border-primary-200/80 rounded-2xl flex items-start gap-3 text-xs text-primary-950">
        <Info size={18} className="text-primary-600 shrink-0 mt-0.5" />
        <div className="space-y-1 leading-relaxed">
          <span className="font-bold block">Sinkronisasi Otomatis Terintegrasi (SPMB &bull; SIAKAD &bull; SIKEU)</span>
          <span>
            Data mahasiswa baru tersinkronisasi secara otomatis saat konversi SPMB dan registrasi SIAKAD. Perubahan Jalur Kelas dan Golongan UKT pada tabel ini otomatis memperbarui profil mahasiswa di modul SIAKAD dan SPMB secara real-time.
          </span>
        </div>
      </div>

      <DataTable
        data={data}
        isLoading={loading}
        columns={columns}
        meta={meta}
        onPageChange={setPage}
        emptyMessage="Belum ada data penetapan tipe tagihan mahasiswa."
      />

      {/* Modal Add/Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Tipe Tagihan Mahasiswa' : 'Penetapan Tipe Tagihan Baru'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Interactive Student Selector (Add) or Info Card (Edit) */}
          <div className="space-y-2">
            <label className="form-label">Data Mahasiswa *</label>
            {!editingItem ? (
              !selectedStudentObj ? (
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      placeholder="Ketik NIM atau nama mahasiswa..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                    />
                    {searchingStudent && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 size={16} className="animate-spin text-primary-500" />
                      </div>
                    )}
                  </div>

                  {studentSearch.trim().length > 0 && (
                    studentResults.length > 0 ? (
                      <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto bg-slate-50/50">
                        <div className="px-3 py-1.5 bg-slate-100 text-2xs font-bold text-slate-500 uppercase tracking-wider">
                          Hasil Pencarian Mahasiswa ({studentResults.length})
                        </div>
                        {studentResults.map((stu) => (
                          <button
                            key={stu.id}
                            type="button"
                            onClick={() => {
                              setSelectedStudentObj(stu);
                              setValue('mahasiswa_id', stu.id);
                              setValue('nim', stu.nim);
                              setValue('nama_mahasiswa', stu.nama_mahasiswa);
                              setValue('tahun_angkatan', stu.tahun_angkatan || new Date().getFullYear());
                              setValue('jalur_kelas', stu.jalur_kelas || 'Reguler');
                              setValue('kelompok_ukt', stu.kelompok_ukt || 3);
                              setStudentSearch('');
                              setStudentResults([]);
                            }}
                            className="w-full p-2.5 text-left hover:bg-primary-50 transition flex items-center justify-between text-xs cursor-pointer"
                          >
                            <div>
                              <p className="font-bold text-slate-900">{stu.nama_mahasiswa}</p>
                              <p className="text-slate-500 font-mono text-2xs">NIM: {stu.nim} • {stu.prodi} • Angkatan {stu.tahun_angkatan}</p>
                            </div>
                            <span className="badge badge-purple text-2xs font-bold">{stu.jalur_kelas}</span>
                          </button>
                        ))}
                      </div>
                    ) : !searchingStudent ? (
                      <div className="p-3 border border-slate-200 rounded-xl text-center text-xs text-slate-500 bg-slate-50">
                        Tidak ditemukan mahasiswa dengan kata kunci &ldquo;{studentSearch}&rdquo;
                      </div>
                    ) : null
                  )}
                </div>
              ) : (
                <div className="p-3 bg-primary-50/80 border border-primary-200 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-extrabold text-slate-900 text-sm">{selectedStudentObj.nama_mahasiswa}</p>
                    <p className="font-mono text-xs text-slate-600">NIM: {selectedStudentObj.nim} • Angkatan {selectedStudentObj.tahun_angkatan}</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedStudentObj(null);
                      setValue('mahasiswa_id', 0);
                      setStudentSearch('');
                      setStudentResults([]);
                    }}
                    className="font-bold text-rose-600 hover:bg-rose-50"
                  >
                    Ganti
                  </Button>
                </div>
              )
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="font-extrabold text-slate-900 text-sm">{editingItem.nama_mahasiswa}</p>
                <p className="font-mono text-xs text-slate-600">NIM: {editingItem.nim} • {editingItem.prodi || ''} • Angkatan {editingItem.tahun_angkatan}</p>
              </div>
            )}
            {errors.mahasiswa_id && (
              <p className="text-xs text-red-500 mt-1">{errors.mahasiswa_id.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Jalur Kelas *"
              options={
                jalurKelasList.length > 0
                  ? jalurKelasList
                  : [{ value: 'Reguler', label: 'Reguler' }]
              }
              value={watch('jalur_kelas')}
              onChange={(val) => setValue('jalur_kelas', val as string)}
              error={errors.jalur_kelas?.message}
            />

            <Select
              label="Golongan / Kelompok UKT *"
              options={uktOptions}
              value={watch('kelompok_ukt')?.toString() || '3'}
              onChange={(val) => setValue('kelompok_ukt', Number(val))}
              error={errors.kelompok_ukt?.message}
            />
          </div>

          <div>
            <Input
              label="Catatan Perubahan"
              placeholder="Contoh: Penyesuaian golongan UKT hasil verifikasi berkas..."
              value={watch('catatan_perubahan') || ''}
              onChange={(e) => setValue('catatan_perubahan', e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
              className="font-bold text-slate-600"
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              icon={submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              className="font-bold shadow-md"
            >
              {submitting ? 'Menyimpan...' : editingItem ? 'Perbarui & Sinkronkan' : 'Simpan & Sinkronkan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Filter Drawer */}
      <Drawer
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Tipe Mahasiswa"
        width="440px"
        footer={
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleResetFilter}
              className="font-bold text-slate-600 min-h-[42px] px-4"
            >
              Reset
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleApplyFilter}
              className="font-bold min-h-[42px] px-5 shadow-md"
            >
              Terapkan Filter
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Cari Nama / NIM"
            placeholder="Ketik nama atau NIM mahasiswa..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Tahun Angkatan"
              placeholder="Contoh: 2025"
              type="number"
              value={filterAngkatan}
              onChange={(e) => setFilterAngkatan(e.target.value)}
            />

            <Select
              label="Golongan UKT"
              value={filterUkt}
              onChange={(val) => setFilterUkt(val as string)}
              options={[
                { value: '', label: 'Semua Golongan' },
                ...uktOptions,
              ]}
            />
          </div>

          <Select
            label="Program Studi"
            value={filterProdi}
            onChange={(val) => setFilterProdi(val as string)}
            options={[
              { value: '', label: 'Semua Program Studi' },
              ...prodiList,
            ]}
          />

          <Select
            label="Jalur Kelas"
            value={filterJalur}
            onChange={(val) => setFilterJalur(val as string)}
            options={[
              { value: '', label: 'Semua Jalur Kelas' },
              ...jalurKelasList,
            ]}
          />

          <div className="pt-3 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Pengurutan Data</p>
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Urutkan Berdasarkan"
                value={filterSortBy}
                onChange={(val) => setFilterSortBy(val as string)}
                options={[
                  { value: 'id', label: 'Terbaru Ditambahkan' },
                  { value: 'nama_mahasiswa', label: 'Nama Mahasiswa' },
                  { value: 'nim', label: 'NIM' },
                  { value: 'tahun_angkatan', label: 'Tahun Angkatan' },
                  { value: 'kelompok_ukt', label: 'Golongan UKT' },
                ]}
              />
              <Select
                label="Arah Urutan"
                value={filterSortDir}
                onChange={(val) => setFilterSortDir(val as 'asc' | 'desc')}
                options={[
                  { value: 'asc', label: 'Menaik (A-Z)' },
                  { value: 'desc', label: 'Menurun (Z-A)' },
                ]}
              />
            </div>
          </div>
        </div>
      </Drawer>
    </>
  );
}
