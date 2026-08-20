'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  BookOpen, Plus, Calculator, Table, Filter, Loader2, Save, CheckCircle2, PieChart, RefreshCw
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
  total_debet: number;
  total_kredit: number;
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
  jenis_sumber: string;
  keterangan: string;
  akun_debet_id: number;
  nominal_debet: number;
  akun_kredit_id: number;
  nominal_kredit: number;
}

const formatRupiah = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

export default function AkuntansiPage() {
  const [activeTab, setActiveTab] = useState<'jurnal' | 'buku-besar' | 'coa'>('jurnal');
  const [loading, setLoading] = useState(true);

  const [coaList, setCoaList] = useState<CoaItem[]>([]);
  const [jurnalList, setJurnalList] = useState<JurnalItem[]>([]);

  // Filter Drawer State — 2-stage
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

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
      jenis_sumber: 'penyesuaian',
      keterangan: '',
      akun_debet_id: 1,
      nominal_debet: 1000000,
      akun_kredit_id: 2,
      nominal_kredit: 1000000,
    },
  });

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
      setJurnalList(list);
    } catch {
      setJurnalList([]);
      toast.error('Gagal memuat data jurnal akuntansi');
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
    if (formData.nominal_debet !== formData.nominal_kredit) {
      toast.error('Jurnal Unbalanced! Total Debet harus sama dengan Total Kredit');
      return;
    }
    setSubmitting(true);
    try {
      await sikeuService.storeJurnal({
        tanggal_jurnal: formData.tanggal_jurnal,
        jenis_sumber: formData.jenis_sumber,
        keterangan: formData.keterangan,
        details: [
          { akun_id: formData.akun_debet_id, debet: formData.nominal_debet, kredit: 0, keterangan: formData.keterangan },
          { akun_id: formData.akun_kredit_id, debet: 0, kredit: formData.nominal_kredit, keterangan: formData.keterangan },
        ],
      });
      toast.success('Jurnal penyesuaian berhasil dicatat');
      setIsJurnalModalOpen(false);
      fetchJurnal();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal menyimpan Jurnal');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredJurnal = useMemo(() => {
    if (!appliedSearch) return jurnalList;
    const q = appliedSearch.toLowerCase();
    return jurnalList.filter((j) =>
      j.nomor_jurnal?.toLowerCase().includes(q) || j.keterangan?.toLowerCase().includes(q)
    );
  }, [jurnalList, appliedSearch]);

  const filteredCoa = useMemo(() => {
    if (!appliedSearch) return coaList;
    const q = appliedSearch.toLowerCase();
    return coaList.filter((c) =>
      c.kode_akun?.toLowerCase().includes(q) || c.nama_akun?.toLowerCase().includes(q) || c.kelompok?.toLowerCase().includes(q)
    );
  }, [coaList, appliedSearch]);

  const jurnalColumns: ColumnDef<JurnalItem>[] = [
    {
      key: 'nomor_jurnal',
      label: 'NOMOR JURNAL & TANGGAL',
      render: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-md">
            {row.nomor_jurnal || `JRN-${row.id}`}
          </span>
          <span className="text-2xs block text-slate-400 font-semibold mt-1">{row.tanggal_jurnal || '-'}</span>
        </div>
      ),
    },
    {
      key: 'jenis_sumber',
      label: 'SUMBER TRANSAKSI',
      render: (row) => (
        <span className="badge badge-purple text-xs font-bold uppercase">{row.jenis_sumber || 'SIAKAD'}</span>
      ),
    },
    {
      key: 'keterangan',
      label: 'KETERANGAN BUKTI JURNAL',
      render: (row) => (
        <span className="font-medium text-slate-800 text-xs line-clamp-1">{row.keterangan || '-'}</span>
      ),
    },
    {
      key: 'total_debet',
      label: 'DEBET (RP)',
      render: (row) => (
        <span className="font-bold text-emerald-700 tabular-nums text-sm">
          {formatRupiah(row.total_debet || 0)}
        </span>
      ),
    },
    {
      key: 'total_kredit',
      label: 'KREDIT (RP)',
      render: (row) => (
        <span className="font-bold text-slate-900 tabular-nums text-sm">
          {formatRupiah(row.total_kredit || 0)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      render: () => (
        <span className="badge badge-green text-xs font-bold inline-flex items-center gap-1">
          <CheckCircle2 size={12} /> Posted
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
        title="Akuntansi Keuangan & Buku Besar"
        description="Pencatatan Jurnal Umum, Penyesuaian, Chart of Accounts (COA), dan Laporan Keuangan Standar."
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
                Entry Jurnal Penyesuaian
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

      {/* Tabs Bar */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('jurnal')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'jurnal' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen size={15} />
          Jurnal Umum & Penyesuaian
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
        <DataTable data={filteredJurnal} isLoading={loading} columns={jurnalColumns} emptyMessage="Belum ada data jurnal akuntansi." />
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

      {/* Modal Entry Jurnal */}
      <Modal isOpen={isJurnalModalOpen} onClose={() => setIsJurnalModalOpen(false)} title="Entry Jurnal Penyesuaian Baru">
        <form onSubmit={jurnalForm.handleSubmit(onSubmitJurnal)} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input type="date" label="Tanggal Jurnal *"
              {...jurnalForm.register('tanggal_jurnal', { required: 'Tanggal wajib diisi' })} />
            <Select label="Jenis Sumber Transaksi *"
              options={[
                { value: 'penyesuaian', label: 'Jurnal Penyesuaian' },
                { value: 'operasional', label: 'Jurnal Operasional' },
                { value: 'koreksi', label: 'Jurnal Koreksi' },
              ]}
              value={jurnalForm.watch('jenis_sumber')}
              onChange={(val) => jurnalForm.setValue('jenis_sumber', val as string)} />
          </div>

          <Textarea label="Keterangan Jurnal *" placeholder="Penjelasan transaksi jurnal..."
            {...jurnalForm.register('keterangan', { required: 'Keterangan wajib diisi' })} />

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
            <p className="text-xs font-bold text-slate-800">Entri Pasangan Debet & Kredit (Balanced):</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select label="Akun Debet *"
                options={coaList.map(c => ({ value: c.id.toString(), label: `[${c.kode_akun}] ${c.nama_akun}` }))}
                value={jurnalForm.watch('akun_debet_id')?.toString() || '1'}
                onChange={(val) => jurnalForm.setValue('akun_debet_id', Number(val))} />

              <Input type="number" label="Nominal Debet (Rp) *" placeholder="1000000"
                {...jurnalForm.register('nominal_debet', { required: true, valueAsNumber: true })} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select label="Akun Kredit *"
                options={coaList.map(c => ({ value: c.id.toString(), label: `[${c.kode_akun}] ${c.nama_akun}` }))}
                value={jurnalForm.watch('akun_kredit_id')?.toString() || '2'}
                onChange={(val) => jurnalForm.setValue('akun_kredit_id', Number(val))} />

              <Input type="number" label="Nominal Kredit (Rp) *" placeholder="1000000"
                {...jurnalForm.register('nominal_kredit', { required: true, valueAsNumber: true })} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsJurnalModalOpen(false)} disabled={submitting} className="font-bold text-slate-600">
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}
              icon={submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              className="font-bold shadow-md">
              {submitting ? 'Simpan Jurnal...' : 'Post Jurnal Penyesuaian'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Filter Drawer */}
      <Drawer isOpen={showFilter} onClose={() => setShowFilter(false)} title="Filter Akuntansi" width="420px"
        footer={
          <div className="flex items-center justify-between gap-3">
            <Button type="button" variant="outline" onClick={() => { setFilterSearch(''); setAppliedSearch(''); setShowFilter(false); }} className="font-bold text-slate-600 min-h-[42px] px-4">
              Reset
            </Button>
            <Button type="button" variant="primary" onClick={() => { setAppliedSearch(filterSearch); setShowFilter(false); }} className="font-bold min-h-[42px] px-5 shadow-md">
              Terapkan Filter
            </Button>
          </div>
        }>
        <div className="space-y-5">
          <Input label="Cari Nomor Jurnal / Kode Akun / Keterangan" placeholder="Ketik kata kunci..."
            value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} />
        </div>
      </Drawer>
    </div>
  );
}
