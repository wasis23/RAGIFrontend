'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  BookOpen, Plus, Calculator, Table, Filter, Loader2, Save, CheckCircle2, TrendingUp, TrendingDown, Wallet, Search
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
import { Textarea } from '@/components/ui/Textarea';
import { useForm } from 'react-hook-form';

interface CoaItem {
  id: number;
  kode_akun: string;
  nama_akun: string;
  kelompok: string;
  saldo_normal: string;
}

interface JurnalItem {
  id: number;
  nomor_jurnal: string;
  tanggal_jurnal: string;
  jenis_sumber: string;
  keterangan: string;
  uang_masuk: number;   // Debet / Inflow
  uang_keluar: number;  // Kredit / Outflow
  saldo_running?: number;
  nama_akun_terkait?: string;
  status_posting?: string;
}

interface CoaFormValues {
  kode_akun: string;
  nama_akun: string;
  kelompok: string;
  saldo_normal: string;
}

interface JurnalFormValues {
  tanggal_jurnal: string;
  tipe_transaksi: 'pemasukan' | 'pengeluaran' | 'penyesuaian';
  nominal: number;
  akun_kas_id: number;
  keterangan: string;
}

const formatRupiah = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

export default function AkuntansiPage() {
  const [activeTab, setActiveTab] = useState<'jurnal' | 'coa'>('jurnal');
  const [loading, setLoading] = useState(true);

  const [coaList, setCoaList] = useState<CoaItem[]>([]);
  const [jurnalList, setJurnalList] = useState<JurnalItem[]>([]);

  // Filter Drawer State — 2-stage
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterTipe, setFilterTipe] = useState('all');
  const [appliedFilters, setAppliedFilters] = useState({ search: '', tipe: 'all' });

  // Modals State
  const [isCoaModalOpen, setIsCoaModalOpen] = useState(false);
  const [isJurnalModalOpen, setIsJurnalModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const coaForm = useForm<CoaFormValues>({
    defaultValues: { kode_akun: '', nama_akun: '', kelompok: 'aset', saldo_normal: 'debet' },
  });

  const jurnalForm = useForm<JurnalFormValues>({
    defaultValues: {
      tanggal_jurnal: new Date().toISOString().split('T')[0],
      tipe_transaksi: 'pemasukan',
      nominal: 1000000,
      akun_kas_id: 1,
      keterangan: '',
    },
  });

  const tipeTxWatch = jurnalForm.watch('tipe_transaksi');

  const fetchCoa = async () => {
    try {
      const res = await sikeuService.getCoaList();
      const list = Array.isArray(res.data) ? res.data : [];
      setCoaList(list);
    } catch {
      setCoaList([]);
    }
  };

  const fetchJurnal = async () => {
    try {
      setLoading(true);
      const res = await sikeuService.getJurnalList();
      const list = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];

      // Map raw entries into clean Inflow (Uang Masuk) vs Outflow (Uang Keluar)
      let currentRunningBalance = 0;
      const mapped: JurnalItem[] = list.map((item: any) => {
        const debet = item.total_debet || item.debet || 0;
        const kredit = item.total_kredit || item.kredit || 0;
        
        // Determine whether this transaction represents money coming in or going out
        const isMasuk = debet >= kredit;
        const uangMasuk = isMasuk ? debet : 0;
        const uangKeluar = !isMasuk ? kredit : 0;
        
        currentRunningBalance += (uangMasuk - uangKeluar);

        return {
          id: item.id,
          nomor_jurnal: item.nomor_jurnal || `JRN-2026-${String(item.id).padStart(4, '0')}`,
          tanggal_jurnal: item.tanggal_jurnal || '2026-08-01',
          jenis_sumber: item.jenis_sumber || (isMasuk ? 'pemasukan' : 'pengeluaran'),
          keterangan: item.keterangan || 'Transaksi Keuangan Kampus',
          uang_masuk: uangMasuk,
          uang_keluar: uangKeluar,
          saldo_running: currentRunningBalance,
          nama_akun_terkait: isMasuk ? 'Kas Penerimaan' : 'Kas Operasional',
          status_posting: item.status_posting || 'posted',
        };
      });

      setJurnalList(mapped);
    } catch {
      setJurnalList([]);
      toast.error('Gagal memuat data jurnal keuangan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoa();
    fetchJurnal();
  }, []);

  const onSubmitCoa = async (formData: CoaFormValues) => {
    setSubmitting(true);
    try {
      await sikeuService.storeCoa(formData);
      toast.success('Kode Akun (COA) baru berhasil disimpan');
      setIsCoaModalOpen(false);
      fetchCoa();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal membuat COA');
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmitJurnal = async (formData: JurnalFormValues) => {
    setSubmitting(true);
    try {
      const isPemasukan = formData.tipe_transaksi === 'pemasukan';
      await sikeuService.storeJurnal({
        tanggal_jurnal: formData.tanggal_jurnal,
        jenis_sumber: formData.tipe_transaksi,
        keterangan: formData.keterangan,
        details: [
          { akun_id: formData.akun_kas_id, debet: isPemasukan ? formData.nominal : 0, kredit: isPemasukan ? 0 : formData.nominal, keterangan: formData.keterangan },
          { akun_id: 2, debet: isPemasukan ? 0 : formData.nominal, kredit: isPemasukan ? formData.nominal : 0, keterangan: formData.keterangan },
        ],
      });

      toast.success(`Catatan ${isPemasukan ? 'Uang Masuk' : 'Uang Keluar'} berhasil disimpan!`);
      setIsJurnalModalOpen(false);
      fetchJurnal();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal mencatat transaksi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyFilter = () => {
    setAppliedFilters({ search: filterSearch, tipe: filterTipe });
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterSearch('');
    setFilterTipe('all');
    setAppliedFilters({ search: '', tipe: 'all' });
    setShowFilter(false);
  };

  const filteredJurnal = useMemo(() => {
    return jurnalList.filter((j) => {
      if (appliedFilters.search) {
        const q = appliedFilters.search.toLowerCase();
        if (!j.nomor_jurnal?.toLowerCase().includes(q) && !j.keterangan?.toLowerCase().includes(q) && !j.jenis_sumber?.toLowerCase().includes(q)) return false;
      }
      if (appliedFilters.tipe === 'masuk' && j.uang_masuk <= 0) return false;
      if (appliedFilters.tipe === 'keluar' && j.uang_keluar <= 0) return false;
      return true;
    });
  }, [jurnalList, appliedFilters]);

  const filteredCoa = useMemo(() => {
    if (!appliedFilters.search) return coaList;
    const q = appliedFilters.search.toLowerCase();
    return coaList.filter((c) =>
      c.kode_akun?.toLowerCase().includes(q) || c.nama_akun?.toLowerCase().includes(q) || c.kelompok?.toLowerCase().includes(q)
    );
  }, [coaList, appliedFilters]);

  // Total Summaries
  const totalUangMasuk = useMemo(() => filteredJurnal.reduce((sum, j) => sum + j.uang_masuk, 0), [filteredJurnal]);
  const totalUangKeluar = useMemo(() => filteredJurnal.reduce((sum, j) => sum + j.uang_keluar, 0), [filteredJurnal]);
  const netMutasiKas = totalUangMasuk - totalUangKeluar;

  const jurnalColumns: ColumnDef<JurnalItem>[] = [
    {
      key: 'tanggal_jurnal',
      label: 'TANGGAL & NO JURNAL',
      render: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-md">
            {row.nomor_jurnal}
          </span>
          <span className="text-2xs block text-slate-500 font-semibold mt-1">{row.tanggal_jurnal}</span>
        </div>
      ),
    },
    {
      key: 'keterangan',
      label: 'SUMBER & URAIAN TRANSAKSI',
      render: (row) => (
        <div>
          <span className="badge badge-purple text-xs font-bold uppercase">{row.jenis_sumber}</span>
          <p className="text-xs text-slate-800 font-semibold mt-1 line-clamp-1">{row.keterangan}</p>
        </div>
      ),
    },
    {
      key: 'uang_masuk',
      label: 'UANG MASUK (+RP)',
      render: (row) => (
        row.uang_masuk > 0 ? (
          <span className="font-bold text-emerald-600 text-sm tabular-nums">
            + {formatRupiah(row.uang_masuk)}
          </span>
        ) : (
          <span className="text-slate-300 font-mono text-xs">—</span>
        )
      ),
    },
    {
      key: 'uang_keluar',
      label: 'UANG KELUAR (-RP)',
      render: (row) => (
        row.uang_keluar > 0 ? (
          <span className="font-bold text-rose-600 text-sm tabular-nums">
            - {formatRupiah(row.uang_keluar)}
          </span>
        ) : (
          <span className="text-slate-300 font-mono text-xs">—</span>
        )
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      render: () => (
        <span className="badge badge-green text-xs font-bold inline-flex items-center gap-1">
          <CheckCircle2 size={12} /> Lunas / Posted
        </span>
      ),
    },
  ];

  const coaColumns: ColumnDef<CoaItem>[] = [
    {
      key: 'kode_akun',
      label: 'KODE AKUN',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-md">
          {row.kode_akun}
        </span>
      ),
    },
    {
      key: 'nama_akun',
      label: 'NAMA AKUN KEUSANGAN',
      render: (row) => (
        <span className="font-bold text-slate-900 text-sm">{row.nama_akun}</span>
      ),
    },
    {
      key: 'kelompok',
      label: 'KELOMPOK',
      render: (row) => (
        <span className="badge badge-blue text-xs font-bold uppercase">{row.kelompok}</span>
      ),
    },
    {
      key: 'saldo_normal',
      label: 'SALDO NORMAL',
      render: (row) => (
        <span className="font-semibold text-slate-700 text-xs uppercase">{row.saldo_normal}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <PageHeader
        title="Jurnal Keuangan & Mutasi Kas Kampus"
        description="Pencatatan arus Uang Masuk (Inflow), Uang Keluar (Outflow), dan Master Kode Akun COA."
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

            {activeTab === 'jurnal' && (
              <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={() => setIsJurnalModalOpen(true)}
                className="font-bold min-h-[40px] px-4 shadow-sm"
              >
                Catat Transaksi Kas Baru
              </Button>
            )}

            {activeTab === 'coa' && (
              <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={() => setIsCoaModalOpen(true)}
                className="font-bold min-h-[40px] px-4 shadow-sm"
              >
                Tambah Akun COA
              </Button>
            )}
          </div>
        }
      />

      {/* Summary Cards: Uang Masuk, Uang Keluar, Saldo Net */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Uang Masuk (+)</p>
            <p className="text-xl font-extrabold text-emerald-600 mt-1 tabular-nums">
              + {formatRupiah(totalUangMasuk)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Uang Keluar (-)</p>
            <p className="text-xl font-extrabold text-rose-600 mt-1 tabular-nums">
              - {formatRupiah(totalUangKeluar)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <TrendingDown size={20} />
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Net Mutasi Saldo Kas</p>
            <p className={`text-xl font-extrabold mt-1 tabular-nums ${netMutasiKas >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
              {formatRupiah(netMutasiKas)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
            <Wallet size={20} />
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('jurnal')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'jurnal' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen size={15} />
          Jurnal Uang Masuk & Keluar
        </button>

        <button
          onClick={() => setActiveTab('coa')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'coa' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calculator size={15} />
          Master Chart of Accounts (COA)
        </button>
      </div>

      {activeTab === 'jurnal' && (
        <DataTable data={filteredJurnal} isLoading={loading} columns={jurnalColumns} emptyMessage="Belum ada data jurnal keuangan." />
      )}

      {activeTab === 'coa' && (
        <DataTable data={filteredCoa} isLoading={loading} columns={coaColumns} emptyMessage="Belum ada kode akun COA." />
      )}

      {/* Modal Add COA */}
      <Modal isOpen={isCoaModalOpen} onClose={() => setIsCoaModalOpen(false)} title="Tambah Kode Akun (COA) Baru">
        <form onSubmit={coaForm.handleSubmit(onSubmitCoa)} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Kode Akun *" placeholder="Contoh: 1101"
              {...coaForm.register('kode_akun', { required: 'Kode akun wajib diisi' })}
              error={coaForm.formState.errors.kode_akun?.message} />
            <Input label="Nama Akun Keuangan *" placeholder="Contoh: Kas Utama Rektorat"
              {...coaForm.register('nama_akun', { required: 'Nama akun wajib diisi' })}
              error={coaForm.formState.errors.nama_akun?.message} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Kelompok Akun *"
              options={[
                { value: 'aset', label: 'Aset / Aktiva' },
                { value: 'kewajiban', label: 'Kewajiban / Utang' },
                { value: 'ekuitas', label: 'Ekuitas / Modal' },
                { value: 'pendapatan', label: 'Pendapatan' },
                { value: 'beban', label: 'Beban / Pengeluaran' },
              ]}
              value={coaForm.watch('kelompok')}
              onChange={(val) => coaForm.setValue('kelompok', val as string)} />

            <Select label="Saldo Normal *"
              options={[
                { value: 'debet', label: 'Debet' },
                { value: 'kredit', label: 'Kredit' },
              ]}
              value={coaForm.watch('saldo_normal')}
              onChange={(val) => coaForm.setValue('saldo_normal', val as string)} />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsCoaModalOpen(false)} disabled={submitting} className="font-bold text-slate-600">
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}
              icon={submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              className="font-bold shadow-md">
              {submitting ? 'Menyimpan...' : 'Simpan Akun COA'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Entry Transaksi Kas Baru */}
      <Modal isOpen={isJurnalModalOpen} onClose={() => setIsJurnalModalOpen(false)} title="Catat Transaksi Keuangan Kas Baru">
        <form onSubmit={jurnalForm.handleSubmit(onSubmitJurnal)} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Jenis Transaksi *"
              options={[
                { value: 'pemasukan', label: '🟢 Uang Masuk (Inflow / Penerimaan)' },
                { value: 'pengeluaran', label: '🔴 Uang Keluar (Outflow / Belanja)' },
                { value: 'penyesuaian', label: '🔵 Jurnal Penyesuaian Akuntansi' },
              ]}
              value={tipeTxWatch}
              onChange={(val) => jurnalForm.setValue('tipe_transaksi', val as any)} />

            <Input type="date" label="Tanggal Transaksi *"
              {...jurnalForm.register('tanggal_jurnal', { required: 'Tanggal wajib diisi' })} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input type="number" label="Nominal Uang (Rp) *" placeholder="1000000"
              {...jurnalForm.register('nominal', { required: 'Nominal wajib diisi', valueAsNumber: true, min: { value: 1, message: 'Nominal harus lebih dari 0' } })}
              error={jurnalForm.formState.errors.nominal?.message} />

            <Select label="Rekening / Kas Terkait *"
              options={coaList.map(c => ({ value: c.id.toString(), label: `[${c.kode_akun}] ${c.nama_akun}` }))}
              value={jurnalForm.watch('akun_kas_id')?.toString() || '1'}
              onChange={(val) => jurnalForm.setValue('akun_kas_id', Number(val))} />
          </div>

          <Textarea label="Keterangan & Peruntukan Uang *" placeholder="Contoh: Penerimaan pembayaran sewa kantin semester ganjil..."
            {...jurnalForm.register('keterangan', { required: 'Keterangan wajib diisi' })}
            error={jurnalForm.formState.errors.keterangan?.message} />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsJurnalModalOpen(false)} disabled={submitting} className="font-bold text-slate-600">
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}
              icon={submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              className="font-bold shadow-md">
              {submitting ? 'Menyimpan...' : 'Simpan Transaksi Kas'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Filter Drawer */}
      <Drawer isOpen={showFilter} onClose={() => setShowFilter(false)} title="Filter Jurnal Keuangan" width="420px"
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
          <Input label="Cari Nomor Jurnal / Keterangan" placeholder="Ketik kata kunci..."
            value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} />

          <Select label="Filter Tipe Transaksi"
            value={filterTipe}
            onChange={(val) => setFilterTipe(val as string)}
            options={[
              { value: 'all', label: 'Semua Transaksi' },
              { value: 'masuk', label: 'Hanya Uang Masuk (+)' },
              { value: 'keluar', label: 'Hanya Uang Keluar (-)' },
            ]} />
        </div>
      </Drawer>
    </div>
  );
}
