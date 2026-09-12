'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Filter, Loader2, Save, CheckCircle2, XCircle, GraduationCap, Calculator, Info, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { useForm } from 'react-hook-form';

interface ProgramStudiItem {
  id: number;
  kode_prodi?: string;
  nama: string;
  jenjang?: string;
  is_active?: boolean;
}

interface SettingTarifItem {
  id: number;
  master_biaya_id: number;
  tahun_angkatan: number;
  program_studi_id?: number | null;
  semester?: number | null;
  jalur_kelas: string;
  nominal: number;
  is_active: boolean;
  keterangan?: string;
  master_biaya?: {
    id: number;
    kode: string;
    nama: string;
    tipe: string;
  };
  program_studi?: {
    id: number;
    kode_prodi?: string;
    nama: string;
    jenjang?: string;
  } | null;
}

interface FormValues {
  master_biaya_id: number;
  tahun_angkatan: number;
  program_studi_id?: number | null | string;
  semester?: number | null | string;
  jalur_kelas: string;
  nominal: number;
  is_active: boolean;
  keterangan?: string;
}

const formatRupiah = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);

export function SettingTarifTab() {
  const [data, setData] = useState<SettingTarifItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [masterBiayaList, setMasterBiayaList] = useState<any[]>([]);
  const [programStudiList, setProgramStudiList] = useState<ProgramStudiItem[]>([]);

  // Filter Drawer State
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterAngkatan, setFilterAngkatan] = useState('');
  const [filterProdi, setFilterProdi] = useState('');
  const [filterJalur, setFilterJalur] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({ search: '', angkatan: '', prodi: '', jalur: '', semester: '' });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SettingTarifItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      master_biaya_id: 1,
      tahun_angkatan: 2025,
      program_studi_id: '',
      semester: '',
      jalur_kelas: 'Reguler',
      nominal: 3500000,
      is_active: true,
      keterangan: '',
    },
  });

  const selectedBiayaId = watch('master_biaya_id');
  const selectedProdiId = watch('program_studi_id');
  const selectedJalur = watch('jalur_kelas');

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await sikeuService.getSettingTarifList();
      if (res.data) {
        setData(res.data);
      }
    } catch {
      toast.error('Gagal memuat data setting tarif');
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterBiaya = async () => {
    try {
      const res = await sikeuService.getJenisBiayaList();
      if (res.data) {
        setMasterBiayaList(res.data);
      }
    } catch {
      console.error('Gagal mengambil master biaya');
    }
  };

  const fetchProgramStudi = async () => {
    try {
      const res = await sikeuService.getProgramStudiList();
      if (res.data && Array.isArray(res.data)) {
        setProgramStudiList(res.data);
      }
    } catch {
      console.error('Gagal mengambil daftar program studi');
    }
  };

  useEffect(() => {
    fetchData();
    fetchMasterBiaya();
    fetchProgramStudi();
  }, []);

  const handleOpenAdd = () => {
    setEditingItem(null);
    reset({
      master_biaya_id: masterBiayaList[0]?.id || 1,
      tahun_angkatan: 2025,
      program_studi_id: '',
      semester: '',
      jalur_kelas: 'Reguler',
      nominal: 3500000,
      is_active: true,
      keterangan: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: SettingTarifItem) => {
    setEditingItem(item);
    reset({
      master_biaya_id: item.master_biaya_id,
      tahun_angkatan: item.tahun_angkatan,
      program_studi_id: item.program_studi_id ? String(item.program_studi_id) : '',
      semester: item.semester ? String(item.semester) : '',
      jalur_kelas: item.jalur_kelas || 'Reguler',
      nominal: item.nominal,
      is_active: item.is_active,
      keterangan: item.keterangan || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus setting tarif ini?')) return;
    try {
      await sikeuService.deleteSettingTarif(id);
      toast.success('Setting tarif berhasil dihapus');
      fetchData();
    } catch (error: any) {
      toast.error(error?.message || 'Gagal menghapus setting tarif');
    }
  };

  const onSubmit = async (formData: FormValues) => {
    setSubmitting(true);
    try {
      const payload = {
        master_biaya_id: Number(formData.master_biaya_id),
        tahun_angkatan: Number(formData.tahun_angkatan),
        program_studi_id: formData.program_studi_id ? Number(formData.program_studi_id) : undefined,
        semester: formData.semester ? Number(formData.semester) : undefined,
        jalur_kelas: formData.jalur_kelas,
        nominal: Number(formData.nominal),
        is_active: Boolean(formData.is_active),
        keterangan: formData.keterangan || undefined,
      };

      if (editingItem) {
        await sikeuService.updateSettingTarif(editingItem.id, payload);
        toast.success('Setting tarif berhasil diperbarui');
      } else {
        await sikeuService.storeSettingTarif(payload);
        toast.success('Setting tarif baru berhasil ditambahkan');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error?.message || 'Gagal menyimpan setting tarif');
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
      semester: filterSemester,
    });
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterAngkatan('');
    setFilterProdi('');
    setFilterJalur('');
    setFilterSemester('');
    setAppliedFilters({ search: '', angkatan: '', prodi: '', jalur: '', semester: '' });
    setShowFilter(false);
  };

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (appliedFilters.search) {
        const q = appliedFilters.search.toLowerCase();
        const namaBiaya = item.master_biaya?.nama?.toLowerCase() || '';
        const kodeBiaya = item.master_biaya?.kode?.toLowerCase() || '';
        const namaProdi = item.program_studi?.nama?.toLowerCase() || '';
        const ket = item.keterangan?.toLowerCase() || '';
        if (!namaBiaya.includes(q) && !kodeBiaya.includes(q) && !namaProdi.includes(q) && !ket.includes(q)) return false;
      }
      if (appliedFilters.angkatan && String(item.tahun_angkatan) !== appliedFilters.angkatan) return false;
      if (appliedFilters.prodi) {
        if (appliedFilters.prodi === 'global' && item.program_studi_id) return false;
        if (appliedFilters.prodi !== 'global' && String(item.program_studi_id) !== appliedFilters.prodi) return false;
      }
      if (appliedFilters.jalur && item.jalur_kelas !== appliedFilters.jalur) return false;
      if (appliedFilters.semester && String(item.semester || '') !== appliedFilters.semester) return false;
      return true;
    });
  }, [data, appliedFilters]);

  const columns: ColumnDef<SettingTarifItem>[] = [
    {
      key: 'master_biaya',
      label: 'KOMPONEN BIAYA',
      render: (row) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded uppercase">
              {row.master_biaya?.kode || 'BIAYA'}
            </span>
            <p className="font-bold text-slate-900 text-sm">{row.master_biaya?.nama || 'Komponen Biaya'}</p>
          </div>
          {row.keterangan && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{row.keterangan}</p>}
        </div>
      ),
    },
    {
      key: 'program_studi',
      label: 'PROGRAM STUDI',
      render: (row) => {
        if (row.program_studi) {
          return (
            <div>
              <span className="badge badge-purple text-xs font-bold">
                {row.program_studi.jenjang ? `${row.program_studi.jenjang} ` : ''}{row.program_studi.nama}
              </span>
              {row.program_studi.kode_prodi && (
                <span className="text-2xs text-slate-400 block font-mono mt-0.5">
                  Kode: {row.program_studi.kode_prodi}
                </span>
              )}
            </div>
          );
        }
        return (
          <span className="badge badge-gray text-xs font-semibold">
            Semua Prodi (Global)
          </span>
        );
      },
    },
    {
      key: 'tahun_angkatan',
      label: 'ANGKATAN',
      render: (row) => (
        <span className="badge badge-blue text-xs font-bold">{row.tahun_angkatan}</span>
      ),
    },
    {
      key: 'jalur_kelas',
      label: 'JALUR KELAS',
      render: (row) => (
        <span className="font-semibold text-slate-700 text-xs">{row.jalur_kelas}</span>
      ),
    },
    {
      key: 'semester',
      label: 'SEMESTER',
      render: (row) => (
        row.semester ? (
          <span className="badge badge-green text-xs font-bold">Sem. {row.semester}</span>
        ) : (
          <span className="text-xs text-slate-400 italic">Semua Semester</span>
        )
      ),
    },
    {
      key: 'nominal',
      label: 'NOMINAL TAGIHAN RIIL (RP)',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 tabular-nums text-sm">
            {formatRupiah(row.nominal || 0)}
          </span>
          <span className="text-[10px] text-emerald-600 block font-semibold">Tarif Tagihan Aktif</span>
        </div>
      ),
    },
    {
      key: 'is_active',
      label: 'STATUS',
      render: (row) =>
        row.is_active ? (
          <span className="badge badge-green text-xs font-bold inline-flex items-center gap-1">
            <CheckCircle2 size={12} /> Aktif
          </span>
        ) : (
          <span className="badge badge-red text-xs font-bold inline-flex items-center gap-1">
            <XCircle size={12} /> Non-Aktif
          </span>
        ),
    },
    {
      key: 'actions',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(row)} icon={<Edit size={14} />}
            className="font-semibold text-slate-600 hover:text-primary-600 hover:bg-primary-50">
            Edit
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleDelete(row.id)} icon={<Trash2 size={14} />}
            className="font-semibold text-rose-600 hover:bg-rose-50">
            Hapus
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Matriks Tarif Biaya per Angkatan & Program Studi"
        description="Penetapan besaran tarif riil tagihan mahasiswa per kombinasi Tahun Angkatan, Program Studi, Semester, dan Jalur Kelas."
        action={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button variant="outline" onClick={() => setShowFilter(true)} icon={<Filter size={16} />} className="font-bold min-h-[40px]">
              Filter
            </Button>
            <Button variant="primary" onClick={handleOpenAdd} icon={<Plus size={16} />} className="font-bold min-h-[40px] px-4 shadow-sm">
              Tambah Setting Tarif
            </Button>
          </div>
        }
      />

      {/* Contextual Banner */}
      <div className="p-4 bg-linear-to-r from-emerald-50/80 via-teal-50/40 to-white border border-emerald-200/80 rounded-2xl flex items-start gap-3 my-4">
        <div className="p-2 bg-emerald-600 text-white rounded-xl shrink-0 mt-0.5 shadow-2xs">
          <Calculator size={16} />
        </div>
        <div className="text-xs text-slate-700 space-y-1">
          <p className="font-bold text-slate-900">
            Pusat Penetapan Tarif Riil Pembayaran Mahasiswa:
          </p>
          <p className="text-slate-600 leading-relaxed">
            Data pada matriks ini menjadi acuan kalkulasi penerbitan tagihan semester di menu <strong>Tagihan SPP & UKT</strong>. Anda dapat menyetel nominal berbeda untuk prodi dengan beban praktikum tinggi (misal: Teknik Informatika) vs prodi reguler lainnya.
          </p>
        </div>
      </div>

      <div className="mt-4">
        <DataTable
          columns={columns}
          data={filteredData}
          isLoading={loading}
          emptyMessage="Belum ada konfigurasi tarif per angkatan & prodi."
        />
      </div>

      {/* Modal Add / Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Setting Tarif' : 'Tambah Setting Tarif Baru'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select
            label="Komponen Master Biaya *"
            options={masterBiayaList.map((mb) => ({
              value: String(mb.id),
              label: `${mb.kode} - ${mb.nama} (${mb.tipe})`,
            }))}
            value={String(selectedBiayaId)}
            onChange={(val) => setValue('master_biaya_id', Number(val))}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select
              label="Program Studi (Target)"
              options={[
                { value: '', label: 'Semua Program Studi (Berlaku Umum / Global)' },
                ...programStudiList.map((p) => ({
                  value: String(p.id),
                  label: `${p.jenjang ? p.jenjang + ' ' : ''}${p.nama} (${p.kode_prodi || 'PRODI'})`,
                })),
              ]}
              value={selectedProdiId ? String(selectedProdiId) : ''}
              onChange={(val) => setValue('program_studi_id', val ? Number(val) : '')}
              hint="Pilih prodi spesifik atau biarkan kosong untuk berlaku global"
            />

            <Input
              type="number"
              label="Tahun Angkatan *"
              placeholder="2025"
              {...register('tahun_angkatan', { required: 'Angkatan wajib diisi', valueAsNumber: true })}
              error={errors.tahun_angkatan?.message}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select
              label="Jalur Kelas *"
              options={[
                { value: 'Reguler', label: 'Reguler' },
                { value: 'Karyawan', label: 'Karyawan / Eksekutif' },
                { value: 'Internasional', label: 'Internasional' },
                { value: 'Online', label: 'Online' },
              ]}
              value={selectedJalur}
              onChange={(val) => setValue('jalur_kelas', val as string)}
            />

            <Select
              label="Semester Target"
              options={[
                { value: '', label: 'Semua Semester (Berlaku 1-8)' },
                { value: '1', label: 'Semester 1' },
                { value: '2', label: 'Semester 2' },
                { value: '3', label: 'Semester 3' },
                { value: '4', label: 'Semester 4' },
                { value: '5', label: 'Semester 5' },
                { value: '6', label: 'Semester 6' },
                { value: '7', label: 'Semester 7' },
                { value: '8', label: 'Semester 8' },
              ]}
              value={watch('semester') ? String(watch('semester')) : ''}
              onChange={(val) => setValue('semester', val ? Number(val) : '')}
            />
          </div>

          <Input
            type="number"
            label="Nominal Biaya Riil (Rp) *"
            placeholder="3500000"
            {...register('nominal', {
              required: 'Nominal wajib diisi',
              valueAsNumber: true,
              min: { value: 0, message: 'Nominal tidak boleh negatif' },
            })}
            error={errors.nominal?.message}
            hint="Nominal tagihan riil yang akan terbit pada invoice mahasiswa"
          />

          <Input
            label="Keterangan Tambahan"
            placeholder="Contoh: UKT Angkatan 2025 TI Semester Ganjil Reguler"
            {...register('keterangan')}
          />

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="is_active"
              className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              {...register('is_active')}
            />
            <label htmlFor="is_active" className="text-sm font-semibold text-slate-700 cursor-pointer">
              Status Tarif Aktif
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} disabled={submitting} className="font-bold text-slate-600">
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              icon={submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              className="font-bold shadow-md"
            >
              {submitting ? 'Menyimpan...' : editingItem ? 'Perbarui' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Filter Drawer */}
      <Drawer
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Setting Tarif"
        width="420px"
        footer={
          <div className="flex items-center justify-between gap-3">
            <Button type="button" variant="outline" onClick={handleResetFilter} className="font-bold text-slate-600 min-h-[42px] px-4">
              Reset
            </Button>
            <Button type="button" variant="primary" onClick={handleApplyFilter} className="font-bold min-h-[42px] px-5 shadow-md">
              Terapkan Filter
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Cari Komponen Biaya / Prodi / Keterangan"
            placeholder="Ketik kata kunci..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />

          <Select
            label="Filter Program Studi"
            value={filterProdi}
            onChange={(val) => setFilterProdi(val as string)}
            options={[
              { value: '', label: 'Semua Program Studi' },
              { value: 'global', label: 'Khusus Global (Semua Prodi)' },
              ...programStudiList.map((p) => ({
                value: String(p.id),
                label: `${p.jenjang ? p.jenjang + ' ' : ''}${p.nama}`,
              })),
            ]}
          />

          <Select
            label="Tahun Angkatan"
            value={filterAngkatan}
            onChange={(val) => setFilterAngkatan(val as string)}
            options={[
              { value: '', label: 'Semua Angkatan' },
              { value: '2023', label: '2023' },
              { value: '2024', label: '2024' },
              { value: '2025', label: '2025' },
              { value: '2026', label: '2026' },
              { value: '2027', label: '2027' },
            ]}
          />

          <Select
            label="Jalur Kelas"
            value={filterJalur}
            onChange={(val) => setFilterJalur(val as string)}
            options={[
              { value: '', label: 'Semua Jalur' },
              { value: 'Reguler', label: 'Reguler' },
              { value: 'Karyawan', label: 'Karyawan / Eksekutif' },
              { value: 'Internasional', label: 'Internasional' },
              { value: 'Online', label: 'Online' },
            ]}
          />

          <Select
            label="Semester"
            value={filterSemester}
            onChange={(val) => setFilterSemester(val as string)}
            options={[
              { value: '', label: 'Semua Semester' },
              { value: '1', label: 'Semester 1' },
              { value: '2', label: 'Semester 2' },
              { value: '3', label: 'Semester 3' },
              { value: '4', label: 'Semester 4' },
              { value: '5', label: 'Semester 5' },
              { value: '6', label: 'Semester 6' },
              { value: '7', label: 'Semester 7' },
              { value: '8', label: 'Semester 8' },
            ]}
          />
        </div>
      </Drawer>
    </>
  );
}
