'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Plus, Sparkles, CreditCard, Filter, CheckCircle2, AlertCircle, XCircle, Clock, Search, Edit, Eye, Loader2, Save
} from 'lucide-react';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useForm } from 'react-hook-form';

interface TagihanItem {
  id: number;
  nomor: string;
  nim: string;
  nama: string;
  angkatan: number;
  jalur: string;
  kelompok_ukt: string;
  prodi: string;
  program_studi_id?: number;
  total: number;
  total_potongan?: number;
  total_bayar?: number;
  sisa?: number;
  status: 'lunas' | 'belum_bayar' | 'pending_approval' | 'sebagian' | 'dispensasi' | string;
  jatuhTempo: string;
  source: string;
}

interface MassFormValues {
  target_angkatan: string;
  target_jalur: string;
  target_prodi?: string;
  target_semester: string;
  semester_aktif: string;
  jatuh_tempo: string;
}

const formatRupiah = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

export default function TagihanListPage() {
  const [data, setData] = useState<TagihanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [prodiList, setProdiList] = useState<{ value: string; label: string }[]>([]);

  // Filter Drawer State — 2-stage
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterAngkatan, setFilterAngkatan] = useState('all');
  const [filterProdi, setFilterProdi] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [appliedFilters, setAppliedFilters] = useState({ search: '', angkatan: 'all', prodi: 'all', status: 'all' });

  // Mass Modal State
  const [isMassModalOpen, setIsMassModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fee Component preview state for Mass Billing
  const [matchedFeeComponents, setMatchedFeeComponents] = useState<any[]>([]);
  const [selectedFeeIds, setSelectedFeeIds] = useState<number[]>([]);
  const [loadingFeeComponents, setLoadingFeeComponents] = useState(false);

  const defaultJatuhTempo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  }, []);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<MassFormValues>({
    defaultValues: {
      target_angkatan: '2023',
      target_jalur: 'Reguler',
      target_prodi: '',
      target_semester: '1',
      semester_aktif: 'Semester Ganjil 2026/2027',
      jatuh_tempo: defaultJatuhTempo,
    },
  });

  const watchAngkatan = watch('target_angkatan');
  const watchJalur = watch('target_jalur');
  const watchProdi = watch('target_prodi');
  const watchSemester = watch('target_semester');

  // Sinkronisasi otomatis label semester saat semester dipilih (misal Semester 3 Ganjil 2026/2027)
  useEffect(() => {
    const semNum = parseInt(watchSemester) || 1;
    const isGanjil = semNum % 2 !== 0;
    const tipeSem = isGanjil ? 'Ganjil' : 'Genap';
    setValue('semester_aktif', `Semester ${semNum} (${tipeSem}) 2026/2027`);
  }, [watchSemester, setValue]);

  useEffect(() => {
    if (!isMassModalOpen) return;
    let isMounted = true;
    const fetchComponents = async () => {
      setLoadingFeeComponents(true);
      try {
        const res = await sikeuService.getSettingTarifList({
          tahun_angkatan: parseInt(watchAngkatan),
          jalur_kelas: watchJalur,
          semester: parseInt(watchSemester),
          program_studi_id: watchProdi ? parseInt(watchProdi) : undefined,
          is_active: true,
          include_global: true,
          per_page: 50,
        });
        if (isMounted) {
          const items = Array.isArray(res.data) ? res.data : [];
          setMatchedFeeComponents(items);
          setSelectedFeeIds(items.map((i: any) => i.master_biaya_id || i.id));
        }
      } catch {
        if (isMounted) {
          setMatchedFeeComponents([]);
          setSelectedFeeIds([]);
        }
      } finally {
        if (isMounted) setLoadingFeeComponents(false);
      }
    };
    fetchComponents();
    return () => {
      isMounted = false;
    };
  }, [isMassModalOpen, watchAngkatan, watchJalur, watchProdi, watchSemester]);

  const toggleFeeComponent = (id: number) => {
    setSelectedFeeIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const previewTotalNominal = matchedFeeComponents
    .filter((c) => selectedFeeIds.includes(c.master_biaya_id || c.id))
    .reduce((sum, c) => sum + (parseFloat(c.nominal) || 0), 0);

  useEffect(() => {
    const loadProdi = async () => {
      try {
        const res = await sikeuService.getProgramStudiList();
        if (Array.isArray(res.data)) {
          setProdiList(
            res.data.map((p: any) => {
              const rawName = p.nama || p.nama_prodi || 'Program Studi';
              const jenjang = p.jenjang || '';
              const label = jenjang && !rawName.startsWith(jenjang) ? `${jenjang} - ${rawName}` : rawName;
              return {
                value: String(p.id),
                label: label,
              };
            })
          );
        }
      } catch {
        // Fallback
      }
    };
    loadProdi();
  }, []);

  const fetchTagihan = async () => {
    setLoading(true);
    try {
      const res = await sikeuService.getTagihanList({
        page: 1,
        per_page: 100,
        search: appliedFilters.search || undefined,
        status: appliedFilters.status !== 'all' ? appliedFilters.status : undefined,
        tahun_angkatan: appliedFilters.angkatan !== 'all' ? parseInt(appliedFilters.angkatan) : undefined,
        program_studi_id: appliedFilters.prodi !== 'all' ? parseInt(appliedFilters.prodi) : undefined,
      });

      const raw = Array.isArray(res.data) ? res.data : [];
      if (raw.length > 0) {
        setData(raw);
      } else {
        // Fallback to student billing types mapping if no generated tagihan exists yet
        const altRes = await sikeuService.getStudentBillingTypes({ page: 1, per_page: 50 });
        const altRaw = Array.isArray(altRes.data) ? altRes.data : [];
        const mapped = altRaw.map((item: any) => ({
          id: item.id,
          nomor: `INV-SIAKAD-2026-${String(item.id).padStart(3, '0')}`,
          nim: item.nim || '-',
          nama: item.nama_mahasiswa || 'Mahasiswa',
          angkatan: item.tahun_angkatan || 2025,
          jalur: item.jalur_kelas || 'Reguler',
          kelompok_ukt: `Level ${item.kelompok_ukt || 3}`,
          prodi: 'Teknik Informatika',
          total: item.kelompok_ukt === 4 ? 5500000 : item.kelompok_ukt === 1 ? 500000 : 3500000,
          total_bayar: item.beasiswa ? 3500000 : 0,
          sisa: item.beasiswa ? 0 : 3500000,
          status: item.beasiswa ? 'lunas' : 'belum_bayar',
          jatuhTempo: '2026-08-31',
          source: item.status_pendaftaran || 'SIAKAD',
        }));
        setData(mapped);
      }
    } catch {
      setData([]);
      toast.error('Gagal memuat data tagihan mahasiswa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTagihan();
  }, [appliedFilters]);

  const onSubmitMassTagihan = async (formData: MassFormValues) => {
    setSubmitting(true);
    try {
      const res = await sikeuService.generateMassTagihan({
        tahun_angkatan: parseInt(formData.target_angkatan),
        jalur_kelas: formData.target_jalur,
        program_studi_id: formData.target_prodi ? parseInt(formData.target_prodi) : undefined,
        semester: parseInt(formData.target_semester),
        master_biaya_ids: selectedFeeIds.length > 0 ? selectedFeeIds : undefined,
        jatuh_tempo: formData.jatuh_tempo,
        semester_label: formData.semester_aktif,
      });
      toast.success(res.message || `Berhasil menerbitkan tagihan masal ${formData.semester_aktif}`);
      setIsMassModalOpen(false);
      fetchTagihan();
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menerbitkan tagihan masal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyFilter = () => {
    setAppliedFilters({ search: filterSearch, angkatan: filterAngkatan, prodi: filterProdi, status: filterStatus });
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterAngkatan('all');
    setFilterProdi('all');
    setFilterStatus('all');
    setAppliedFilters({ search: '', angkatan: 'all', prodi: 'all', status: 'all' });
    setShowFilter(false);
  };

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (appliedFilters.search) {
        const q = appliedFilters.search.toLowerCase();
        if (!item.nama?.toLowerCase().includes(q) && !item.nim?.toLowerCase().includes(q) && !item.nomor?.toLowerCase().includes(q)) return false;
      }
      if (appliedFilters.angkatan !== 'all' && String(item.angkatan) !== appliedFilters.angkatan) return false;
      if (appliedFilters.prodi !== 'all') {
        if (item.program_studi_id && String(item.program_studi_id) !== appliedFilters.prodi) return false;
      }
      if (appliedFilters.status !== 'all' && item.status !== appliedFilters.status) return false;
      return true;
    });
  }, [data, appliedFilters]);

  const columns: ColumnDef<TagihanItem>[] = [
    {
      key: 'nomor',
      label: 'NOMOR TAGIHAN',
      render: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-md">
            {row.nomor}
          </span>
          <span className="text-2xs block text-slate-400 font-semibold mt-1">Sumber: {row.source}</span>
        </div>
      ),
    },
    {
      key: 'nama',
      label: 'MAHASISWA',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900 text-sm">{row.nama}</p>
          <p className="font-mono text-xs text-slate-500">NIM: {row.nim}</p>
        </div>
      ),
    },
    {
      key: 'angkatan',
      label: 'ANGKATAN & PRODI',
      render: (row) => (
        <div>
          <p className="text-xs font-semibold text-slate-700">{row.prodi}</p>
          <p className="text-2xs text-slate-500">Angkatan {row.angkatan} • {row.jalur}</p>
        </div>
      ),
    },
    {
      key: 'total',
      label: 'TOTAL TAGIHAN',
      render: (row) => (
        <span className="font-bold text-slate-900 tabular-nums text-sm">
          {formatRupiah(row.total)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (row) => {
        if (row.status === 'lunas') {
          return (
            <span className="badge badge-green text-xs font-bold inline-flex items-center gap-1">
              <CheckCircle2 size={12} /> Lunas
            </span>
          );
        }
        if (row.status === 'sebagian') {
          return (
            <span className="badge badge-yellow text-xs font-bold inline-flex items-center gap-1">
              <Clock size={12} /> Bayar Sebagian
            </span>
          );
        }
        if (row.status === 'dispensasi') {
          return (
            <span className="badge badge-orange text-xs font-bold inline-flex items-center gap-1">
              <AlertCircle size={12} /> Dispensasi
            </span>
          );
        }
        if (row.status === 'pending_approval') {
          return (
            <span className="badge badge-blue text-xs font-bold inline-flex items-center gap-1">
              <Clock size={12} /> Menunggu Verifikasi
            </span>
          );
        }
        return (
          <span className="badge badge-red text-xs font-bold inline-flex items-center gap-1">
            <XCircle size={12} /> Belum Bayar
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Link href={`/sikeu/tagihan/${row.id}`}>
            <Button size="sm" variant="ghost" icon={<Eye size={14} />}
              className="font-semibold text-slate-600 hover:text-primary-600 hover:bg-primary-50">
              Detail
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <PageHeader
        title="Set Tagihan & Invoice Semester Aktif"
        description="Aktivasi tagihan masal per Angkatan/Prodi & Layanan Pembayaran Loket / VA Mahasiswa."
        action={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setShowFilter(true)}
              className="font-bold min-h-[40px]"
            >
              Filter
            </Button>
            <Button
              variant="primary"
              icon={<Sparkles size={16} />}
              onClick={() => setIsMassModalOpen(true)}
              className="font-bold min-h-[40px] px-4 shadow-sm"
            >
              Aktifkan Tagihan Masal
            </Button>
          </div>
        }
      />

      <DataTable data={filteredData} isLoading={loading} columns={columns} emptyMessage="Belum ada data tagihan semester aktif." />

      {/* Modal Mass Tagihan */}
      <Modal isOpen={isMassModalOpen} onClose={() => setIsMassModalOpen(false)} title="Aktivasi Tagihan Semester Masal" size="lg">
        <form onSubmit={handleSubmit(onSubmitMassTagihan)} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <Select
              label="Target Angkatan *"
              options={[
                { value: '2023', label: 'Angkatan 2023' },
                { value: '2024', label: 'Angkatan 2024' },
                { value: '2025', label: 'Angkatan 2025' },
                { value: '2026', label: 'Angkatan 2026' },
              ]}
              value={watch('target_angkatan')}
              onChange={(val) => setValue('target_angkatan', val as string)}
            />

            <Select
              label="Jalur Kelas *"
              options={[
                { value: 'Reguler', label: 'Reguler' },
                { value: 'Karyawan', label: 'Karyawan / Eksekutif' },
                { value: 'Internasional', label: 'Internasional' },
              ]}
              value={watch('target_jalur')}
              onChange={(val) => setValue('target_jalur', val as string)}
            />

            <Select
              label="Semester Perkuliahan *"
              options={[
                { value: '1', label: 'Semester 1' },
                { value: '2', label: 'Semester 2' },
                { value: '3', label: 'Semester 3' },
                { value: '4', label: 'Semester 4' },
                { value: '5', label: 'Semester 5' },
                { value: '6', label: 'Semester 6' },
                { value: '7', label: 'Semester 7' },
                { value: '8', label: 'Semester 8' },
              ]}
              value={watch('target_semester')}
              onChange={(val) => setValue('target_semester', val as string)}
            />
          </div>

          <div>
            <Select
              label="Target Program Studi (Opsional)"
              options={[
                { value: '', label: 'Semua Program Studi (Global Kampus)' },
                ...prodiList,
              ]}
              value={watch('target_prodi') || ''}
              onChange={(val) => setValue('target_prodi', val as string)}
            />
          </div>

          {/* Dynamic Fee Components Breakdown for the Selected Semester */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <CreditCard size={15} className="text-primary-600" />
                  Komponen Biaya Semester {watchSemester} (Matriks Tarif)
                </h4>
                <p className="text-2xs text-slate-500 mt-0.5">Centang komponen yang akan diikutsertakan pada penagihan semester ini.</p>
              </div>
              <span className="text-2xs font-extrabold px-3 py-1 bg-primary-100 text-primary-700 rounded-lg">
                {selectedFeeIds.length} Komponen Dipilih
              </span>
            </div>

            {loadingFeeComponents ? (
              <div className="py-6 flex items-center justify-center gap-2 text-slate-400 text-xs font-medium">
                <Loader2 size={16} className="animate-spin text-primary-600" />
                <span>Memuat komponen tarif semester dari database...</span>
              </div>
            ) : matchedFeeComponents.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                <p className="text-xs font-bold text-amber-900">Belum Ada Setting Tarif untuk Semester Ini</p>
                <p className="text-2xs text-amber-700 mt-0.5">
                  Silakan tambahkan komponen biaya Semester {watchSemester} di menu <Link href="/sikeu/mahasiswa/tarif" className="underline font-bold">Pengaturan Tarif</Link> terlebih dahulu.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto divide-y divide-slate-200/60 pr-1">
                {matchedFeeComponents.map((comp: any) => {
                  const compId = comp.master_biaya_id || comp.id;
                  const isChecked = selectedFeeIds.includes(compId);
                  const namaBiaya = comp.master_biaya?.nama || comp.keterangan || 'Biaya Pendidikan';
                  const nominal = parseFloat(comp.nominal) || 0;

                  return (
                    <label
                      key={comp.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl transition cursor-pointer ${
                        isChecked ? 'bg-white shadow-2xs border border-primary-200' : 'hover:bg-slate-100/70 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleFeeComponent(compId)}
                          className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4 cursor-pointer"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900">{namaBiaya}</p>
                          <p className="text-2xs text-slate-500">{comp.keterangan || 'Komponen semester aktif'}</p>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-extrabold text-slate-900">
                        {formatRupiah(nominal)}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            {matchedFeeComponents.length > 0 && (
              <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Total Nominal per Mahasiswa (sebelum beasiswa):</span>
                <span className="font-mono font-extrabold text-primary-700 text-sm">
                  {formatRupiah(previewTotalNominal)}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <Input label="Label Semester di Invoice *" placeholder="Contoh: Semester Ganjil 2026/2027"
              {...register('semester_aktif', { required: 'Semester aktif wajib diisi' })}
              error={errors.semester_aktif?.message} />

            <Input type="date" label="Batas Jatuh Tempo *"
              {...register('jatuh_tempo', { required: 'Jatuh tempo wajib diisi' })}
              error={errors.jatuh_tempo?.message} />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsMassModalOpen(false)} disabled={submitting} className="font-bold text-slate-600">
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={submitting || (matchedFeeComponents.length > 0 && selectedFeeIds.length === 0)}
              icon={submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              className="font-bold shadow-md min-h-[42px] px-5">
              {submitting ? 'Menerbitkan Tagihan...' : 'Terbitkan Tagihan Masal'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Filter Drawer */}
      <Drawer isOpen={showFilter} onClose={() => setShowFilter(false)} title="Filter Tagihan Mahasiswa" width="420px"
        footer={
          <div className="flex items-center justify-between gap-3">
            <Button type="button" variant="outline" onClick={handleResetFilter} className="font-bold text-slate-600 min-h-[42px] px-4">
              Reset
            </Button>
            <Button type="button" variant="primary" onClick={handleApplyFilter} className="font-bold min-h-[42px] px-5 shadow-md">
              Terapkan Filter
            </Button>
          </div>
        }>
        <div className="space-y-5">
          <Input label="Cari Nomor Invoice / Nama / NIM" placeholder="Ketik kata kunci..."
            value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} />

          <Select label="Program Studi"
            value={filterProdi}
            onChange={(val) => setFilterProdi(val as string)}
            options={[
              { value: 'all', label: 'Semua Program Studi' },
              ...prodiList,
            ]} />

          <Select label="Tahun Angkatan"
            value={filterAngkatan}
            onChange={(val) => setFilterAngkatan(val as string)}
            options={[
              { value: 'all', label: 'Semua Angkatan' },
              { value: '2023', label: '2023' },
              { value: '2024', label: '2024' },
              { value: '2025', label: '2025' },
              { value: '2026', label: '2026' },
            ]} />

          <Select label="Status Pembayaran"
            value={filterStatus}
            onChange={(val) => setFilterStatus(val as string)}
            options={[
              { value: 'all', label: 'Semua Status' },
              { value: 'lunas', label: 'Lunas' },
              { value: 'belum_bayar', label: 'Belum Bayar' },
              { value: 'sebagian', label: 'Bayar Sebagian' },
              { value: 'dispensasi', label: 'Dispensasi' },
              { value: 'pending_approval', label: 'Menunggu Verifikasi' },
            ]} />
        </div>
      </Drawer>
    </div>
  );
}
