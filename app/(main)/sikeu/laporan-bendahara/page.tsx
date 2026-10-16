'use client';

import { useState, useEffect, useCallback } from 'react';
import { Filter, FileSpreadsheet, Printer, Wallet, TrendingUp, TrendingDown, Scale } from 'lucide-react';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Drawer } from '@/components/ui/Drawer';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { formatRupiah, formatDate, getApiErrorMessage } from '@/lib/utils';
import type { PaginationMeta } from '@/types/api.types';
import type { LaporanBendaharaBaris, LaporanBendaharaSaldo } from '@/types/sikeu.types';
import { LAPORAN_SORT_OPTIONS, METODE_KAS_OPTIONS, SORT_DIRECTION_OPTIONS } from '@/types/sikeu.types';

type TabKey = 'harian' | 'bulanan' | 'periodik' | 'perakun';

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'harian', label: 'Harian' },
  { key: 'bulanan', label: 'Bulanan' },
  { key: 'periodik', label: 'Periodik' },
  { key: 'perakun', label: 'Per Akun' },
];

export default function LaporanBendaharaPage() {
  const [tab, setTab] = useState<TabKey>('harian');
  const [rows, setRows] = useState<LaporanBendaharaBaris[]>([]);
  const [perAkunRows, setPerAkunRows] = useState<Array<{ kode_akun: string; jumlah: number; jumlah_transaksi: number }>>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [saldo, setSaldo] = useState<LaporanBendaharaSaldo | null>(null);
  const [saldoAwal, setSaldoAwal] = useState(0);

  const [showFilter, setShowFilter] = useState(false);
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [bulan, setBulan] = useState(new Date().toISOString().slice(0, 7));
  const [awal, setAwal] = useState(new Date().toISOString().slice(0, 10));
  const [akhir, setAkhir] = useState(new Date().toISOString().slice(0, 10));
  const [unitKasId, setUnitKasId] = useState('all');
  const [selectedUnitKas, setSelectedUnitKas] = useState<{ value: string; label: string } | null>(null);
  const [metode, setMetode] = useState('OFFLINE');
  const [code, setCode] = useState('');
  const [sortBy, setSortBy] = useState('tanggal');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [applied, setApplied] = useState({ tanggal, bulan, awal, akhir, unit_kas_id: 'all', metode: 'OFFLINE', code: '', sort_by: 'tanggal', sort_dir: 'asc' as 'asc' | 'desc' });

  const loadUnitKasOptions = useCallback(async (inputValue: string) => {
    try {
      const res = await sikeuService.getUnitKasList();
      const list = Array.isArray(res.data) ? res.data : [];
      const q = inputValue.trim().toLowerCase();
      const filtered = q ? list.filter((u) => String(u.nama_kas || '').toLowerCase().includes(q)) : list;
      return filtered.map((u) => ({ value: String(u.id), label: u.nama_kas }));
    } catch {
      return [];
    }
  }, []);

  const fetchData = useCallback(async (t: TabKey, p = 1, f = applied) => {
    setLoading(true);
    try {
      const unit = f.unit_kas_id !== 'all' ? f.unit_kas_id : undefined;
      if (t === 'harian') {
        const res = await sikeuService.getLaporanHarian({ tanggal: f.tanggal, unit_kas_id: unit, metode: f.metode, sort_by: f.sort_by, sort_order: f.sort_dir, page: p, per_page: 15 });
        setRows(Array.isArray(res.data?.transaksi) ? res.data.transaksi : []);
        setMeta(res.meta);
        setSaldo(res.data?.saldo_periode || null);
        setSaldoAwal(Number(res.data?.saldo_awal || 0));
      } else if (t === 'bulanan') {
        const res = await sikeuService.getLaporanBulanan({ tanggal: f.bulan, unit_kas_id: unit, metode: f.metode, sort_by: f.sort_by, sort_order: f.sort_dir, page: p, per_page: 15 });
        setRows(Array.isArray(res.data?.transaksi) ? res.data.transaksi : []);
        setMeta(res.meta);
        setSaldo(res.data?.saldo_periode || null);
        setSaldoAwal(Number(res.data?.saldo_awal || 0));
      } else if (t === 'periodik') {
        const res = await sikeuService.getLaporanPeriodik({ awal: f.awal, akhir: f.akhir, code: f.code || undefined, sort_by: f.sort_by, sort_order: f.sort_dir, page: p, per_page: 15 });
        setRows(Array.isArray(res.data) ? res.data : []);
        setMeta(res.meta);
        setSaldo(null);
      } else {
        const res = await sikeuService.getLaporanPerAkun({ awal: f.awal, akhir: f.akhir, code: f.code || undefined });
        setPerAkunRows(Array.isArray(res.data) ? res.data : []);
        setSaldo(null);
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Gagal memuat laporan bendahara.'));
    } finally {
      setLoading(false);
    }
  }, [applied]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData(tab, 1, applied);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTabChange = (t: TabKey) => {
    setTab(t);
    setRows([]);
    setPerAkunRows([]);
    setMeta(undefined);
    fetchData(t, 1, applied);
  };

  const handleApplyFilter = () => {
    const next = { tanggal, bulan, awal, akhir, unit_kas_id: unitKasId, metode, code, sort_by: sortBy, sort_dir: sortDir };
    setApplied(next);
    setShowFilter(false);
    fetchData(tab, 1, next);
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const unit = applied.unit_kas_id !== 'all' ? applied.unit_kas_id : undefined;
      if (tab === 'harian') {
        await sikeuService.downloadLaporanBendaharaExcel({ jenis: 'harian', tanggal: applied.tanggal, unit_kas_id: unit, metode: applied.metode });
      } else if (tab === 'bulanan') {
        await sikeuService.downloadLaporanBendaharaExcel({ jenis: 'bulanan', tanggal: applied.bulan, unit_kas_id: unit, metode: applied.metode });
      } else if (tab === 'periodik') {
        await sikeuService.downloadLaporanBendaharaExcel({ jenis: 'periodik', awal: applied.awal, akhir: applied.akhir, code: applied.code || undefined });
      } else {
        await sikeuService.downloadLaporanBendaharaExcel({ jenis: 'perakun', awal: applied.awal, akhir: applied.akhir, code: applied.code || undefined });
      }
      toast.success('Berkas Excel berhasil diunduh.');
    } catch {
      toast.error('Gagal mengunduh Excel.');
    } finally {
      setDownloading(false);
    }
  };

  const transaksiColumns: ColumnDef<LaporanBendaharaBaris>[] = [
    {
      key: 'uraian',
      label: 'URAIAN',
      render: (row) => (
        <div>
          <p className="text-xs font-bold text-slate-800">{row.uraian || row.kode_transaksi}</p>
          <p className="text-2xs text-slate-400">
            {[row.tanggal ? formatDate(String(row.tanggal)) : '', row.mahasiswa_nim, row.mahasiswa_nama].filter(Boolean).join(' • ')}
          </p>
        </div>
      ),
    },
    {
      key: 'jumlah',
      label: 'JUMLAH',
      align: 'right',
      render: (row) => (
        <span className={`text-xs font-bold tabular-nums ${Number(row.jumlah) < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
          {formatRupiah(row.jumlah)}
        </span>
      ),
    },
    {
      key: 'jenis_transaksi',
      label: 'JENIS',
      render: (row) => (
        <span className={`text-2xs font-bold ${row.jenis_transaksi === 'masuk' ? 'text-emerald-700' : 'text-rose-600'}`}>
          {row.channel === 'KOREKSI' ? 'Koreksi' : row.jenis_transaksi === 'masuk' ? 'Masuk' : 'Keluar'}
        </span>
      ),
    },
  ];

  const perAkunColumns: ColumnDef<{ kode_akun: string; jumlah: number; jumlah_transaksi: number }>[] = [
    { key: 'kode_akun', label: 'KODE AKUN', render: (row) => <span className="text-xs font-bold">{row.kode_akun}</span> },
    { key: 'jumlah_transaksi', label: 'TRANSAKSI', align: 'right', render: (row) => <span className="text-xs tabular-nums">{row.jumlah_transaksi}</span> },
    { key: 'jumlah', label: 'JUMLAH', align: 'right', render: (row) => <span className="text-xs font-bold tabular-nums">{formatRupiah(row.jumlah)}</span> },
  ];

  const saldoAkhir = saldoAwal + (saldo?.saldo_bersih || 0);

  return (
    <div className="w-full space-y-6 animate-fade-in">
      <PageHeader
        title="Laporan Bendahara"
        description="Arus kas operasional (basis kas): pembayaran mahasiswa + mutasi kas unit, koreksi sebagai baris negatif."
        action={
          <div className="flex items-center gap-2 flex-wrap print:hidden">
            <Button variant="outline" icon={<Printer size={16} />} onClick={() => window.print()} className="font-bold text-xs">
              Cetak
            </Button>
            <Button variant="outline" icon={<Filter size={16} />} onClick={() => setShowFilter(true)} className="font-bold border-[var(--module-primary)] text-[var(--module-primary)] hover:bg-[var(--module-primary-subtle)]">
              Filter
            </Button>
            <Button variant="primary" icon={<FileSpreadsheet size={16} />} onClick={handleDownload} disabled={downloading} className="font-bold">
              {downloading ? 'Mengunduh...' : 'Download Excel'}
            </Button>
          </div>
        }
      />

      <div className="flex border-b border-slate-200 gap-1 sm:gap-2 overflow-x-auto pb-0.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => handleTabChange(t.key)}
            className={`px-4 py-2 text-xs font-bold whitespace-nowrap rounded-t-lg border-b-2 -mb-px ${
              tab === t.key
                ? 'border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle)]'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {(tab === 'harian' || tab === 'bulanan') && saldo && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
              <span>SALDO AWAL</span>
              <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center"><Wallet size={15} /></div>
            </div>
            <p className="text-xl font-black text-slate-800 tabular-nums">{formatRupiah(saldoAwal)}</p>
            <p className="text-2xs text-slate-400">Tutup kas bulan lalu</p>
          </div>
          <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
              <span>KAS MASUK</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><TrendingUp size={15} /></div>
            </div>
            <p className="text-xl font-black text-emerald-700 tabular-nums">{formatRupiah(saldo.saldo_masuk)}</p>
            <p className="text-2xs text-slate-400">Pembayaran + kas masuk lain</p>
          </div>
          <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
              <span>KAS KELUAR</span>
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center"><TrendingDown size={15} /></div>
            </div>
            <p className="text-xl font-black text-rose-700 tabular-nums">{formatRupiah(saldo.saldo_keluar)}</p>
            <p className="text-2xs text-slate-400">Mutasi kas keluar</p>
          </div>
          <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
              <span>SALDO AKHIR</span>
              <div className="w-7 h-7 rounded-lg bg-[var(--module-primary-subtle)] text-[var(--module-primary)] flex items-center justify-center"><Scale size={15} /></div>
            </div>
            <p className="text-xl font-black text-[var(--module-primary)] tabular-nums">{formatRupiah(saldoAkhir)}</p>
            <p className="text-2xs text-slate-400">Awal + bersih periode</p>
          </div>
        </div>
      )}

      {tab === 'perakun' ? (
        <DataTable
          data={perAkunRows}
          isLoading={loading}
          columns={perAkunColumns}
          emptyMessage="Tidak ada mutasi pada rentang ini."
        />
      ) : (
        <DataTable
          data={rows}
          isLoading={loading}
          columns={transaksiColumns}
          meta={meta}
          onPageChange={(p) => fetchData(tab, p)}
          emptyMessage="Tidak ada transaksi pada periode ini."
        />
      )}

      <Drawer open={showFilter} onClose={() => setShowFilter(false)} title="Filter Laporan Bendahara">
        <div className="space-y-4">
          {(tab === 'harian') && (
            <Input label="Tanggal" type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
          )}
          {(tab === 'bulanan') && (
            <Input label="Bulan" type="month" value={bulan} onChange={(e) => setBulan(e.target.value)} />
          )}
          {(tab === 'periodik' || tab === 'perakun') && (
            <div className="grid grid-cols-2 gap-3">
              <Input label="Tanggal Awal" type="date" value={awal} onChange={(e) => setAwal(e.target.value)} />
              <Input label="Tanggal Akhir" type="date" value={akhir} onChange={(e) => setAkhir(e.target.value)} />
            </div>
          )}
          {(tab === 'harian' || tab === 'bulanan') && (
            <>
              <AsyncSelect
                label="Unit Kas"
                loadOptions={loadUnitKasOptions}
                value={selectedUnitKas}
                onChange={(val: { value: string; label: string } | null) => {
                  setSelectedUnitKas(val);
                  setUnitKasId(val ? val.value : 'all');
                }}
                placeholder="Semua unit kas..."
                isClearable
              />
              <Select
                label="Metode"
                value={metode}
                onChange={(val) => setMetode(typeof val === 'object' && val?.target ? val.target.value : (val || 'OFFLINE'))}
                options={METODE_KAS_OPTIONS}
              />
            </>
          )}
          {(tab === 'periodik' || tab === 'perakun') && (
            <Input label="Prefix Kode Akun" placeholder="Contoh: 101 (kosongkan = semua)" value={code} onChange={(e) => setCode(e.target.value)} />
          )}
          {(tab === 'harian' || tab === 'bulanan' || tab === 'periodik') && (
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Urutkan"
                value={sortBy}
                onChange={(val) => setSortBy(typeof val === 'object' && val?.target ? val.target.value : (val || 'tanggal'))}
                options={LAPORAN_SORT_OPTIONS}
              />
              <Select
                label="Arah"
                value={sortDir}
                onChange={(val) => setSortDir(typeof val === 'object' && val?.target ? val.target.value : (val || 'asc'))}
                options={SORT_DIRECTION_OPTIONS}
              />
            </div>
          )}
          <div className="pt-4 flex gap-2">
            <Button variant="outline" className="flex-1 font-bold" onClick={() => setShowFilter(false)}>Batal</Button>
            <Button variant="primary" className="flex-1 font-bold" onClick={handleApplyFilter}>Terapkan Filter</Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
