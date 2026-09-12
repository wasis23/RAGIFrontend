'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Filter, Loader2, Save, RefreshCw, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useForm } from 'react-hook-form';

interface StudentType {
  id: number;
  mahasiswa_id: number;
  nim: string;
  nama_mahasiswa: string;
  tahun_angkatan: number;
  jalur_kelas: string;
  kelompok_ukt: number;
  beasiswa_id?: number;
  beasiswa?: { nama: string };
  catatan_perubahan?: string;
}

interface FormValues {
  mahasiswa_id: number;
  nim: string;
  nama_mahasiswa: string;
  tahun_angkatan: number;
  jalur_kelas: string;
  kelompok_ukt: number;
  beasiswa_id: number;
  catatan_perubahan: string;
}

export function StudentTypesTab() {
  const [data, setData] = useState<StudentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Filter Drawer — 2-stage
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StudentType | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      mahasiswa_id: 101,
      nim: '',
      nama_mahasiswa: '',
      tahun_angkatan: 2025,
      jalur_kelas: 'Reguler',
      kelompok_ukt: 1,
      beasiswa_id: 0,
      catatan_perubahan: '',
    },
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await sikeuService.getStudentBillingTypes();
      setData(Array.isArray(res.data) ? res.data : []);
    } catch {
      setData([]);
      toast.error('Gagal memuat data tipe tagihan mahasiswa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSyncStudents = async () => {
    setSyncing(true);
    try {
      const res = await sikeuService.syncStudentsFromSiakad();
      toast.success(res.message || 'Sinkronisasi mahasiswa dari SIAKAD/SPMB berhasil!');
      fetchData();
    } catch (error: any) {
      toast.error(error?.message || 'Gagal menyinkronkan mahasiswa dari SIAKAD/SPMB');
    } finally {
      setSyncing(false);
    }
  };

  // Student Selection state for Add Modal
  const [studentSearch, setStudentSearch] = useState('');
  const [studentResults, setStudentResults] = useState<any[]>([]);
  const [selectedStudentObj, setSelectedStudentObj] = useState<any | null>(null);
  const [searchingStudent, setSearchingStudent] = useState(false);

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
      tahun_angkatan: 2025,
      jalur_kelas: 'Reguler',
      kelompok_ukt: 3,
      beasiswa_id: 0,
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
    });
    reset({
      mahasiswa_id: item.mahasiswa_id,
      nim: item.nim,
      nama_mahasiswa: item.nama_mahasiswa,
      tahun_angkatan: item.tahun_angkatan,
      jalur_kelas: item.jalur_kelas,
      kelompok_ukt: item.kelompok_ukt,
      beasiswa_id: item.beasiswa_id || 0,
      catatan_perubahan: item.catatan_perubahan || '',
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (formData: FormValues) => {
    if (!editingItem && (!formData.mahasiswa_id || formData.mahasiswa_id === 0)) {
      toast.error('Silakan pilih mahasiswa dari database terlebih dahulu');
      return;
    }
    setSubmitting(true);
    try {
      if (editingItem) {
        await sikeuService.updateStudentBillingType(editingItem.id, formData);
        toast.success('Tipe tagihan mahasiswa berhasil diperbarui');
      } else {
        await sikeuService.assignStudentBillingType({
          ...formData,
          nim: selectedStudentObj?.nim || formData.nim,
          nama_mahasiswa: selectedStudentObj?.nama_mahasiswa || formData.nama_mahasiswa,
        });
        toast.success('Penetapan tipe tagihan mahasiswa baru berhasil disimpan');
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
    setAppliedSearch(filterSearch);
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setAppliedSearch('');
    setShowFilter(false);
  };

  const filteredData = useMemo(() => {
    if (!appliedSearch) return data;
    const q = appliedSearch.toLowerCase();
    return data.filter((item) =>
      item.nama_mahasiswa?.toLowerCase().includes(q) ||
      item.nim?.toLowerCase().includes(q) ||
      item.jalur_kelas?.toLowerCase().includes(q)
    );
  }, [data, appliedSearch]);

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
      render: (row) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleOpenEdit(row)}
          icon={<Edit size={14} />}
          className="font-bold text-xs"
        >
          Ubah
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Penetapan Tipe Tagihan & Golongan Mahasiswa"
        description="Petakan mahasiswa ke jalur kelas (Reguler/Karyawan/Internasional) dan golongan UKT masing-masing."
        action={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="outline"
              onClick={handleSyncStudents}
              disabled={syncing}
              icon={syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              className="font-bold min-h-[40px]"
            >
              {syncing ? 'Menyinkronkan...' : 'Sinkronisasi SIAKAD / SPMB'}
            </Button>
            <Button variant="outline" onClick={() => setShowFilter(true)} icon={<Filter size={16} />} className="font-bold min-h-[40px]">
              Filter
            </Button>
            <Button variant="primary" onClick={handleOpenAdd} icon={<Plus size={16} />} className="font-bold min-h-[40px] px-4 shadow-sm">
              Penetapan Tipe Mahasiswa
            </Button>
          </div>
        }
      />

      <div className="p-4 bg-primary-50/60 border border-primary-200/80 rounded-2xl flex items-start gap-3 text-xs text-primary-950">
        <Info size={18} className="text-primary-600 shrink-0 mt-0.5" />
        <div className="space-y-1 leading-relaxed">
          <span className="font-bold block">Sinkronisasi Otomatis SPMB & SIAKAD</span>
          <span>
            Mahasiswa baru yang telah lulus konversi SPMB otomatis tercatat dengan jalur kelas dan golongan UKT standar. Gunakan tombol <strong>&ldquo;Sinkronisasi SIAKAD / SPMB&rdquo;</strong> untuk memperbarui basis data mahasiswa secara masal tanpa perlu input satu per satu.
          </span>
        </div>
      </div>

      <DataTable data={filteredData} isLoading={loading} columns={columns} emptyMessage="Belum ada data penetapan tipe tagihan mahasiswa." />

      {/* Modal Add/Edit */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Tipe Tagihan Mahasiswa' : 'Penetapan Tipe Tagihan Baru'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Interactive Student Selector (for Add) or Info Card (for Edit) */}
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
                              setValue('tahun_angkatan', stu.tahun_angkatan || 2025);
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
                <p className="font-mono text-xs text-slate-600">NIM: {editingItem.nim} • Angkatan {editingItem.tahun_angkatan}</p>
              </div>
            )}
            <input type="hidden" {...register('mahasiswa_id', { required: true, min: 1 })} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Jalur Kelas *"
              options={[
                { value: 'Reguler', label: 'Reguler' },
                { value: 'Karyawan', label: 'Karyawan / Eksekutif' },
                { value: 'Internasional', label: 'Internasional' },
                { value: 'Online', label: 'Online' },
              ]}
              value={watch('jalur_kelas')}
              onChange={(val) => setValue('jalur_kelas', val as string)} />

            <Select label="Golongan / Kelompok UKT *"
              options={[
                { value: '1', label: 'Golongan 1 (Subsidi Penuh)' },
                { value: '2', label: 'Golongan 2 (Subsidi Parsial)' },
                { value: '3', label: 'Golongan 3 (Reguler / Standar)' },
                { value: '4', label: 'Golongan 4 (Mandiri / Menengah)' },
                { value: '5', label: 'Golongan 5 (Eksekutif / Khusus)' },
              ]}
              value={watch('kelompok_ukt')?.toString() || '3'}
              onChange={(val) => setValue('kelompok_ukt', Number(val))} />
          </div>

          <div>
            <Input label="Catatan Perubahan" placeholder="Contoh: Pindah jalur pada semester 3..."
              {...register('catatan_perubahan')} />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} disabled={submitting} className="font-bold text-slate-600">
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}
              icon={submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              className="font-bold shadow-md">
              {submitting ? 'Menyimpan...' : editingItem ? 'Perbarui' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Filter Drawer */}
      <Drawer isOpen={showFilter} onClose={() => setShowFilter(false)} title="Filter Tipe Mahasiswa" width="420px"
        footer={
          <div className="flex items-center justify-between gap-3">
            <Button type="button" variant="outline" onClick={handleResetFilter}
              className="font-bold text-slate-600 min-h-[42px] px-4">
              Reset
            </Button>
            <Button type="button" variant="primary" onClick={() => { setAppliedSearch(filterSearch); setShowFilter(false); }}
              className="font-bold min-h-[42px] px-5 shadow-md">
              Terapkan Filter
            </Button>
          </div>
        }>
        <div className="space-y-5">
          <Input label="Cari Nama / NIM / Jalur" placeholder="Ketik kata kunci..."
            value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} />
        </div>
      </Drawer>
    </>
  );
}
