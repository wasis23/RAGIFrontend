'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Loader2, Save, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

// Atomic Design Components
import { JournalHeader } from '@/components/sikeu/akuntansi/organisms/JournalHeader';
import { FinancialMetricCard } from '@/components/sikeu/akuntansi/molecules/FinancialMetricCard';
import { JournalFilterBar } from '@/components/sikeu/akuntansi/organisms/JournalFilterBar';
import { JournalTable } from '@/components/sikeu/akuntansi/organisms/JournalTable';
import { JournalMobileList } from '@/components/sikeu/akuntansi/organisms/JournalMobileList';
import { TransactionDetailDrawer } from '@/components/sikeu/akuntansi/organisms/TransactionDetailDrawer';
import { FilterSheet } from '@/components/sikeu/akuntansi/organisms/FilterSheet';
import { JournalItemData } from '@/components/sikeu/akuntansi/molecules/JournalRow';

// UI Kit
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { useForm } from 'react-hook-form';

// Service
import { sikeuService } from '@/services/sikeu.service';

interface CoaItem {
  id: number;
  kode_akun: string;
  nama_akun: string;
  kelompok: string;
  saldo_normal: string;
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

export default function AccountingJournalPage() {
  const [activeTab, setActiveTab] = useState<'jurnal' | 'coa'>('jurnal');
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);

  const [coaList, setCoaList] = useState<CoaItem[]>([]);
  const [jurnalList, setJurnalList] = useState<JournalItemData[]>([]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTipe, setFilterTipe] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  // Detail Drawer State
  const [selectedTransaction, setSelectedTransaction] = useState<JournalItemData | null>(null);

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
    setErrorState(null);
    setLoading(true);
    try {
      const res = await sikeuService.getJurnalList();
      const list = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];

      const mapped: JournalItemData[] = list.map((item: any) => {
        const debet = Number(item.total_debet || item.debet) || 0;
        const kredit = Number(item.total_kredit || item.kredit) || 0;

        const isMasuk = debet >= kredit;
        const uangMasuk = isMasuk ? debet : 0;
        const uangKeluar = !isMasuk ? kredit : 0;

        return {
          id: item.id,
          nomor_jurnal: item.nomor_jurnal || `JRN-2026-${String(item.id).padStart(4, '0')}`,
          tanggal_jurnal: item.tanggal_jurnal || '2026-08-01',
          jenis_sumber: item.jenis_sumber || (isMasuk ? 'pemasukan' : 'pengeluaran'),
          keterangan: item.keterangan || 'Transaksi Keuangan Kampus',
          uang_masuk: uangMasuk,
          uang_keluar: uangKeluar,
          kode_coa: item.kode_coa || '1101',
          nama_akun_terkait: isMasuk ? 'Kas Penerimaan' : 'Kas Operasional',
          status_posting: item.status_posting || 'posted',
        };
      });

      setJurnalList(mapped);
    } catch {
      setJurnalList([]);
      setErrorState('Terjadi masalah saat mengambil data transaksi.');
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

  // Filter Computation
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterTipe !== 'all') count++;
    if (filterStatus !== 'all') count++;
    if (startDate) count++;
    if (endDate) count++;
    return count;
  }, [filterTipe, filterStatus, startDate, endDate]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterTipe('all');
    setFilterStatus('all');
    setStartDate('');
    setEndDate('');
  };

  const filteredJurnal = useMemo(() => {
    return jurnalList.filter((j) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!j.nomor_jurnal?.toLowerCase().includes(q) &&
            !j.keterangan?.toLowerCase().includes(q) &&
            !j.jenis_sumber?.toLowerCase().includes(q) &&
            !j.nama_akun_terkait?.toLowerCase().includes(q)) return false;
      }
      if (filterTipe === 'masuk' && j.uang_masuk <= 0) return false;
      if (filterTipe === 'keluar' && j.uang_keluar <= 0) return false;
      if (filterStatus !== 'all' && (j.status_posting || 'posted').toLowerCase() !== filterStatus) return false;
      return true;
    });
  }, [jurnalList, searchQuery, filterTipe, filterStatus]);

  const filteredCoa = useMemo(() => {
    if (!searchQuery) return coaList;
    const q = searchQuery.toLowerCase();
    return coaList.filter((c) =>
      c.kode_akun?.toLowerCase().includes(q) || c.nama_akun?.toLowerCase().includes(q) || c.kelompok?.toLowerCase().includes(q)
    );
  }, [coaList, searchQuery]);

  // Financial Summaries
  const totalUangMasuk = useMemo(() => filteredJurnal.reduce((sum, j) => sum + (j.uang_masuk || 0), 0), [filteredJurnal]);
  const totalUangKeluar = useMemo(() => filteredJurnal.reduce((sum, j) => sum + (j.uang_keluar || 0), 0), [filteredJurnal]);
  const netMutasiKas = totalUangMasuk - totalUangKeluar;

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
    <div className="space-y-5 animate-fade-in max-w-7xl mx-auto px-1 sm:px-4 py-2">
      {/* 1. Header Section */}
      <JournalHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenFilter={() => setIsFilterSheetOpen(true)}
        onOpenCreateModal={() => {
          if (activeTab === 'jurnal') setIsJurnalModalOpen(true);
          else setIsCoaModalOpen(true);
        }}
      />

      {/* 2. Financial Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <FinancialMetricCard
          title="TOTAL UANG MASUK"
          amount={totalUangMasuk}
          type="inflow"
          countInfo={`↑ ${filteredJurnal.filter(j => j.uang_masuk > 0).length} transaksi`}
          loading={loading}
        />

        <FinancialMetricCard
          title="TOTAL UANG KELUAR"
          amount={totalUangKeluar}
          type="outflow"
          countInfo={`↓ ${filteredJurnal.filter(j => j.uang_keluar > 0).length} transaksi`}
          loading={loading}
        />

        <FinancialMetricCard
          title="NET MUTASI KAS"
          amount={netMutasiKas}
          type="balance"
          countInfo="Saldo berjalan periode ini"
          loading={loading}
        />
      </div>

      {/* Error Banner */}
      {errorState && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs font-medium text-rose-800">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>Gagal memuat jurnal keuangan: {errorState}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            icon={<RefreshCw size={14} />}
            onClick={fetchJurnal}
            className="font-bold text-rose-700 border-rose-300"
          >
            Tampilkan Lagi
          </Button>
        </div>
      )}

      {/* 3. Search & Filter Bar */}
      <JournalFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterTipe={filterTipe}
        onTipeChange={setFilterTipe}
        filterStatus={filterStatus}
        onStatusChange={setFilterStatus}
        onOpenFilterSheet={() => setIsFilterSheetOpen(true)}
        activeFilterCount={activeFilterCount}
        onClearFilters={handleClearFilters}
      />

      {/* 4. Journal Content Section */}
      {activeTab === 'jurnal' ? (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <JournalTable
              data={filteredJurnal}
              loading={loading}
              onSelect={setSelectedTransaction}
              onResetSearch={handleClearFilters}
            />
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden">
            <JournalMobileList
              data={filteredJurnal}
              loading={loading}
              onSelect={setSelectedTransaction}
              onResetSearch={handleClearFilters}
            />
          </div>
        </>
      ) : (
        <DataTable data={filteredCoa} isLoading={loading} columns={coaColumns} emptyMessage="Belum ada kode akun COA." />
      )}

      {/* Detail Drawer */}
      <TransactionDetailDrawer
        item={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />

      {/* Mobile Filter Sheet */}
      <FilterSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        filterTipe={filterTipe}
        onTipeChange={setFilterTipe}
        filterStatus={filterStatus}
        onStatusChange={setFilterStatus}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        onApply={() => setIsFilterSheetOpen(false)}
        onReset={handleClearFilters}
      />

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

      {/* Modal Catat Transaksi Baru */}
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
    </div>
  );
}
