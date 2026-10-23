'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Filter, Printer, ShieldCheck, Ban, Wallet } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { siakadService } from '@/services/siakad.service';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

type TabKey = 'cetak' | 'monitoring' | 'validasi';

const TIPE_UJIAN_OPTIONS = [
  { value: 'UTS', label: 'UTS' },
  { value: 'UAS', label: 'UAS' },
];

export default function KartuUjianPage() {
  const { user } = useAuthStore();
  const userRoles = user?.roles?.map((r: any) => (typeof r === 'string' ? r : r.slug)) || [];
  const isMahasiswa = userRoles.includes('mahasiswa');

  const [tab, setTab] = useState<TabKey>('cetak');
  const [tipe, setTipe] = useState<'UTS' | 'UAS'>('UTS');

  const [monitoring, setMonitoring] = useState<any[]>([]);
  const [monMeta, setMonMeta] = useState<any>(undefined);
  const [loadingMon, setLoadingMon] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [search, setSearch] = useState('');
  const [filterTipe, setFilterTipe] = useState('');
  const [applied, setApplied] = useState({ search: '', tipe: '', sort_by: 'tanggal_cetak', sort_order: 'desc' });
  const [filterSortBy, setFilterSortBy] = useState('tanggal_cetak');
  const [filterSortDir, setFilterSortDir] = useState('desc');
  const [nonaktifId, setNonaktifId] = useState<number | null>(null);
  const [working, setWorking] = useState(false);

  const [tokenInput, setTokenInput] = useState('');
  const [hasilValidasi, setHasilValidasi] = useState<any | null>(null);
  const [checking, setChecking] = useState(false);

  const fetchMonitoring = async () => {
    try {
      setLoadingMon(true);
      const res = await siakadService.getKartuUjianMonitoring({
        search: applied.search || undefined,
        tipe_ujian: applied.tipe || undefined,
        sort_by: (applied as any).sort_by || undefined,
        sort_order: (applied as any).sort_order || undefined,
        per_page: 15,
      });
      setMonitoring(res.data || []);
      setMonMeta((res as any).meta);
    } catch {
      toast.error('Gagal memuat monitoring kartu ujian');
    } finally {
      setLoadingMon(false);
    }
  };

  useEffect(() => {
    if (!isMahasiswa && tab === 'monitoring') fetchMonitoring();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, applied]);

  const loadMahasiswaOptions = async (keyword: string) => {
    try {
      const res = await siakadService.getMahasiswas({ per_page: 30, search: keyword || undefined });
      const list: any[] = res.data || [];
      return list.map((m: any) => ({ value: m.id, label: `${m.nama_lengkap} — ${m.nim}`, sublabel: m.program_studi?.nama || '', raw: m }));
    } catch {
      return [];
    }
  };
  const [cetakMhsId, setCetakMhsId] = useState<number | null>(null);

  const handleNonaktifkan = async () => {
    if (!nonaktifId) return;
    try {
      setWorking(true);
      await siakadService.nonaktifkanKartuUjian(nonaktifId);
      toast.success('Kartu dinonaktifkan');
      setNonaktifId(null);
      fetchMonitoring();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menonaktifkan');
    } finally {
      setWorking(false);
    }
  };

  const handleValidasi = async () => {
    if (!tokenInput.trim()) {
      toast.error('Masukkan token kartu terlebih dahulu');
      return;
    }
    try {
      setChecking(true);
      setHasilValidasi(null);
      const res = await siakadService.validasiKartuUjianPublic(tokenInput.trim());
      setHasilValidasi(res.data || null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Kartu tidak valid / tidak terdaftar');
    } finally {
      setChecking(false);
    }
  };

  const monColumns: ColumnDef<any>[] = [
    {
      key: 'mhs',
      label: 'NIM & NAMA',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{row.mahasiswa?.nama_lengkap || '-'}</span>
          <span className="font-mono text-2xs text-slate-500">{row.mahasiswa?.nim || '-'}</span>
        </div>
      ),
    },
    {
      key: 'tipe',
      label: 'UJIAN',
      align: 'center',
      render: (row) => <Badge variant="blue" className="text-2xs font-bold">{row.tipe_ujian}</Badge>,
    },
    {
      key: 'cetak',
      label: 'TGL CETAK',
      render: (row) => <span className="text-2xs text-slate-600">{row.tanggal_cetak ? new Date(row.tanggal_cetak).toLocaleString('id-ID') : '-'}</span>,
    },
    {
      key: 'status',
      label: 'STATUS',
      align: 'center',
      render: (row) => (
        <Badge variant={row.is_active ? 'green' : 'red'} className="text-2xs font-bold">
          {row.is_active ? 'Aktif' : 'Nonaktif'}
        </Badge>
      ),
    },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <DropdownMenu
          items={
            row.is_active
              ? [{ label: 'Nonaktifkan', icon: <Ban size={14} />, variant: 'danger' as const, onClick: () => setNonaktifId(row.id) }]
              : [{ label: 'Sudah nonaktif', icon: <Ban size={14} />, onClick: () => {} }]
          }
        />
      ),
    },
  ];

  const tabBtn = (key: TabKey, label: string) => (
    <button
      key={key}
      onClick={() => setTab(key)}
      className={`px-5 py-3 text-xs font-extrabold border-b-2 transition -mb-px cursor-pointer ${
        tab === key ? 'border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle)] rounded-t-lg border-b-2' : 'border-transparent text-slate-500 hover:text-slate-900'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kartu Ujian UTS / UAS"
        description="Penerbitan kartu ujian bersyarat lunas SIKEU, QR validasi publik, dan monitoring BAAK."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Kartu Ujian' },
        ]}
        action={
          !isMahasiswa && tab === 'monitoring' ? (
            <Button variant="outline" icon={<Filter size={15} />} className="font-bold text-xs min-h-[38px]" style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }} onClick={() => setShowFilter(true)}>
              Filter
            </Button>
          ) : undefined
        }
      />

      {!isMahasiswa && (
        <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto">
          {tabBtn('cetak', 'Terbitkan Kartu')}
          {tabBtn('monitoring', 'Monitoring BAAK')}
          {tabBtn('validasi', 'Validasi Token')}
        </div>
      )}

      {(isMahasiswa || tab === 'cetak') && (
        <div className="space-y-4">
          <div className="bg-white border rounded-2xl p-5 flex flex-col md:flex-row gap-3 md:items-end">
            <div className="w-full md:w-48">
              <Select
                label="Tipe Ujian"
                options={TIPE_UJIAN_OPTIONS}
                value={tipe}
                onChange={(v: any) => setTipe(v === 'UAS' ? 'UAS' : 'UTS')}
              />
            </div>
            {!isMahasiswa && (
              <div className="flex-1">
                <AsyncSelect
                  label="Mahasiswa (opsional — kosongkan bila tidak perlu)"
                  placeholder="Cari NIM / nama..."
                  loadOptions={loadMahasiswaOptions}
                  value={cetakMhsId}
                  onChange={(opt: any) => setCetakMhsId(opt?.value ? Number(opt.value) : null)}
                  isClearable
                />
              </div>
            )}
            <Link
              href={
                `/siakad/kartu-ujian/cetak?tipe=${tipe}` +
                (!isMahasiswa && cetakMhsId ? `&mhs=${cetakMhsId}` : '')
              }
            >
              <Button variant="primary" icon={<Printer size={15} />} className="font-bold text-xs min-h-[38px]">
                Terbitkan & Buka Kartu
              </Button>
            </Link>
          </div>

        </div>
      )}

      {!isMahasiswa && tab === 'monitoring' && (
        <DataTable columns={monColumns} data={monitoring} meta={monMeta} isLoading={loadingMon} emptyMessage="Belum ada kartu ujian diterbitkan." />
      )}

      {!isMahasiswa && tab === 'validasi' && (
        <div className="bg-white border rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2"><ShieldCheck size={16} /> Validasi Token Kartu (petugas ruang ujian)</h3>
          <div className="flex flex-col md:flex-row gap-3 md:items-end">
            <div className="flex-1">
              <Input label="Token Kartu" placeholder="Tempel token dari hasil pindai QR..." value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} />
            </div>
            <Button variant="primary" className="font-bold text-xs min-h-[38px]" onClick={handleValidasi} loading={checking} disabled={!tokenInput.trim()}>
              Validasi
            </Button>
          </div>
          {hasilValidasi && (
            <div className="border border-emerald-200 bg-emerald-50/60 rounded-xl px-4 py-3 text-xs space-y-1">
              <p className="font-extrabold text-emerald-700">VALID — {hasilValidasi.mahasiswa?.nama_lengkap} ({hasilValidasi.mahasiswa?.nim})</p>
              <p>Ujian: <strong>{hasilValidasi.tipe_ujian}</strong> • {hasilValidasi.tahun_akademik} • Keuangan: <strong>{hasilValidasi.keuangan_lunas ? 'Lunas' : 'Bermasalah'}</strong></p>
              <p className="text-2xs text-slate-500">Diverifikasi: {hasilValidasi.verified_at}</p>
            </div>
          )}
          <p className="text-2xs text-slate-500 flex items-center gap-1"><Wallet size={12} /> Pemindai luar juga dapat membuka halaman publik hasil pindaian QR tanpa login.</p>
        </div>
      )}

      <Drawer open={showFilter} onClose={() => setShowFilter(false)} title="Filter Monitoring">
        <div className="flex flex-col gap-5">
          <Input label="Pencarian" placeholder="Cari NIM / nama..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select
            label="Tipe Ujian"
            placeholder="Semua"
            options={TIPE_UJIAN_OPTIONS}
            value={filterTipe || ''}
            onChange={(v: any) => setFilterTipe(String(v || ''))}
            isClearable
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urutkan"
              options={[
                { value: 'mahasiswa', label: 'Nama Mahasiswa' },
                { value: 'tanggal_cetak', label: 'Tgl Cetak' },
                { value: 'created_at', label: 'Dibuat' },
                { value: 'id', label: 'ID' },
              ]}
              value={filterSortBy || 'tanggal_cetak'}
              onChange={(v: any) => setFilterSortBy(String(v || 'tanggal_cetak'))}
            />
            <Select
              label="Arah"
              options={[
                { value: 'desc', label: 'Terbaru' },
                { value: 'asc', label: 'Terlama' },
              ]}
              value={filterSortDir || 'desc'}
              onChange={(v: any) => setFilterSortDir(String(v || 'desc'))}
            />
          </div>
          <Button variant="primary" onClick={() => { setApplied({ search, tipe: filterTipe, sort_by: filterSortBy, sort_order: filterSortDir }); setShowFilter(false); }}>
            Terapkan
          </Button>
        </div>
      </Drawer>

      <ConfirmDialog
        isOpen={!!nonaktifId}
        onClose={() => setNonaktifId(null)}
        onConfirm={handleNonaktifkan}
        title="Nonaktifkan Kartu?"
        message="QR pada kartu cetak tidak akan valid lagi."
        confirmText="Ya, Nonaktifkan"
        variant="danger"
        isLoading={working}
      />
    </div>
  );
}
