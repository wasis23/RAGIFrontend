'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PackagePlus, Filter, Plus, Trash2, Lock, LockOpen, Sparkles, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PeriodeSelector } from '@/components/siakad/PeriodeSelector';
import { siakadService } from '@/services/siakad.service';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const tambahSchema = z.object({
  mata_kuliah_id: z.number({ error: 'Mata kuliah wajib dipilih' }).min(1, 'Mata kuliah wajib dipilih'),
  semester_anjuran: z.number().min(1).max(14).nullable().optional(),
  is_wajib: z.boolean().optional(),
});

type TambahValues = z.infer<typeof tambahSchema>;
type TabKey = 'paket' | 'akses';

export default function PaketRombelPage() {
  const { user } = useAuthStore();
  const userRoles = user?.roles?.map((r: any) => (typeof r === 'string' ? r : r.slug)) || [];
  const isMahasiswa = userRoles.includes('mahasiswa');

  const [tab, setTab] = useState<TabKey>('paket');
  const [tahunAkademiks, setTahunAkademiks] = useState<any[]>([]);
  const [selectedTaId, setSelectedTaId] = useState<number | null>(null);
  const [rombelList, setRombelList] = useState<any[]>([]);
  const [selectedRombelId, setSelectedRombelId] = useState<number | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [draftRombelId, setDraftRombelId] = useState<number | null>(null);
  const [draftSearchAkses, setDraftSearchAkses] = useState('');
  const [draftTaId, setDraftTaId] = useState<number | null>(null);

  // Paket state
  const [paket, setPaket] = useState<any[]>([]);
  const [loadingPaket, setLoadingPaket] = useState(false);
  const [isTambahOpen, setIsTambahOpen] = useState(false);
  const [paketToDelete, setPaketToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Hak akses state
  const [aksesList, setAksesList] = useState<any[]>([]);
  const [aksesMeta, setAksesMeta] = useState<any>(undefined);
  const [loadingAkses, setLoadingAkses] = useState(false);
  const [searchAkses, setSearchAkses] = useState('');
  const [togglingRombel, setTogglingRombel] = useState(false);

  // Mahasiswa: paket saya + ambil
  const [paketSaya, setPaketSaya] = useState<any | null>(null);
  const [loadingSaya, setLoadingSaya] = useState(false);
  const [mengambil, setMengambil] = useState(false);
  const [hasilAmbil, setHasilAmbil] = useState<any | null>(null);

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<TambahValues>({
    resolver: zodResolver(tambahSchema),
    defaultValues: { mata_kuliah_id: 0, semester_anjuran: null, is_wajib: true },
  });

  useEffect(() => {
    siakadService.getTahunAkademiks().then((res) => {
      const list: any[] = res.data || [];
      setTahunAkademiks(list);
      const aktif = list.find((t: any) => t.is_active) || list[0];
      if (aktif) setSelectedTaId(aktif.id);
    });
    siakadService.getMasterKelasList({ per_page: 200 }).then((res: any) => {
      const list: any[] = res.data || [];
      setRombelList(list);
      if (list[0]) setSelectedRombelId(list[0].id);
    }).catch(() => {});
  }, []);

  const fetchPaket = async () => {
    if (!selectedRombelId) return;
    try {
      setLoadingPaket(true);
      const res = await siakadService.getPaketMk({
        master_kelas_id: selectedRombelId,
        tahun_akademik_id: selectedTaId || undefined,
        per_page: 100,
      });
      setPaket(res.data || []);
    } catch {
      toast.error('Gagal memuat paket MK rombel');
    } finally {
      setLoadingPaket(false);
    }
  };

  const fetchAkses = async () => {
    try {
      setLoadingAkses(true);
      const res = await siakadService.getHakaksesKrs({
        tahun_akademik_id: selectedTaId || undefined,
        search: searchAkses || undefined,
        per_page: 15,
      });
      setAksesList(res.data || []);
      setAksesMeta((res as any).meta);
    } catch {
      toast.error('Gagal memuat hak akses KRS');
    } finally {
      setLoadingAkses(false);
    }
  };

  const fetchPaketSaya = async () => {
    try {
      setLoadingSaya(true);
      const res = await siakadService.getPaketSaya({ tahun_akademik_id: selectedTaId || undefined });
      setPaketSaya(res.data || null);
    } catch {
      toast.error('Gagal memuat paket rombel Anda');
    } finally {
      setLoadingSaya(false);
    }
  };

  const loadMkOptions = async (keyword: string) => {
    try {
      const res = await siakadService.getMataKuliahs({ per_page: 50, search: keyword || undefined });
      const list: any[] = res.data || [];
      return list.map((m: any) => ({
        value: m.id,
        label: `${m.kode_mk} — ${m.nama} (${m.total_sks} SKS)`,
        raw: m,
      }));
    } catch {
      return [];
    }
  };

  const onTambah = async (values: TambahValues) => {
    if (!selectedRombelId) {
      toast.error('Pilih rombel terlebih dahulu');
      return;
    }
    try {
      await siakadService.createPaketMk({
        master_kelas_id: selectedRombelId,
        tahun_akademik_id: selectedTaId,
        mata_kuliah_id: values.mata_kuliah_id,
        semester_anjuran: values.semester_anjuran ?? undefined,
        is_wajib: values.is_wajib ?? true,
      });
      toast.success('MK ditambahkan ke paket rombel');
      setIsTambahOpen(false);
      reset({ mata_kuliah_id: 0, semester_anjuran: null, is_wajib: true });
      fetchPaket();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menambahkan MK ke paket');
    }
  };

  const handleDelete = async () => {
    if (!paketToDelete) return;
    try {
      setDeleting(true);
      await siakadService.deletePaketMk(paketToDelete.id);
      toast.success('MK dihapus dari paket');
      setPaketToDelete(null);
      fetchPaket();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menghapus');
    } finally {
      setDeleting(false);
    }
  };

  const handleAksesRombel = async (isDibuka: boolean) => {
    if (!selectedRombelId || !selectedTaId) {
      toast.error('Pilih rombel dan periode terlebih dahulu');
      return;
    }
    try {
      setTogglingRombel(true);
      const res = await siakadService.setHakaksesRombel({
        master_kelas_id: selectedRombelId,
        tahun_akademik_id: selectedTaId,
        is_dibuka: isDibuka,
      });
      toast.success(res.message || 'Berhasil');
      fetchAkses();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengubah akses rombel');
    } finally {
      setTogglingRombel(false);
    }
  };

  const handleToggleSatu = async (row: any) => {
    try {
      await siakadService.setHakaksesKrs({
        mahasiswa_id: row.mahasiswa_id,
        tahun_akademik_id: row.tahun_akademik_id,
        is_dibuka: !row.is_dibuka,
      });
      toast.success(row.is_dibuka ? 'Akses dikunci' : 'Akses dibuka');
      fetchAkses();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengubah akses');
    }
  };

  const handleAmbilPaket = async () => {
    try {
      setMengambil(true);
      setHasilAmbil(null);
      const res = await siakadService.ambilPaketKrs({ tahun_akademik_id: selectedTaId || undefined });
      setHasilAmbil(res.data || null);
      toast.success(res.message || 'Pengambilan paket selesai');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengambil paket');
    } finally {
      setMengambil(false);
    }
  };

  const selectedRombel = rombelList.find((r) => r.id === selectedRombelId);
  const selectedTa = tahunAkademiks.find((t) => t.id === selectedTaId);

  useEffect(() => {
    if (isMahasiswa) {
      fetchPaketSaya();
    } else if (selectedRombelId) {
      fetchPaket();
      if (tab === 'akses') fetchAkses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRombelId, selectedTaId, tab]);

  const paketColumns: ColumnDef<any>[] = [
    {
      key: 'mk',
      label: 'KODE & MATA KULIAH',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{row.mata_kuliah?.nama || '-'}</span>
          <span className="font-mono text-2xs text-slate-400">{row.mata_kuliah?.kode_mk || '-'} • {row.mata_kuliah?.total_sks || 0} SKS</span>
        </div>
      ),
    },
    {
      key: 'smt',
      label: 'SEMESTER',
      align: 'center',
      render: (row) => <span className="text-xs font-bold">{row.semester_anjuran || '-'}</span>,
    },
    {
      key: 'wajib',
      label: 'SIFAT',
      align: 'center',
      render: (row) => (
        <Badge variant={row.is_wajib ? 'blue' : 'gray'} className="text-2xs font-bold">
          {row.is_wajib ? 'Wajib' : 'Pilihan'}
        </Badge>
      ),
    },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <DropdownMenu
          items={[
            { label: 'Hapus dari Paket', icon: <Trash2 size={14} />, variant: 'danger' as const, onClick: () => setPaketToDelete(row) },
          ]}
        />
      ),
    },
  ];

  const aksesColumns: ColumnDef<any>[] = [
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
      key: 'status',
      label: 'AKSES',
      align: 'center',
      render: (row) => (
        <Badge variant={row.is_dibuka ? 'green' : 'red'} className="text-2xs font-bold">
          {row.is_dibuka ? 'Dibuka' : 'Dikunci'}
        </Badge>
      ),
    },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <DropdownMenu
          items={[
            {
              label: row.is_dibuka ? 'Kunci Akses' : 'Buka Akses',
              icon: row.is_dibuka ? <Lock size={14} /> : <LockOpen size={14} />,
              onClick: () => handleToggleSatu(row),
            },
          ]}
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
        title={isMahasiswa ? 'Paket KRS Rombel Saya' : 'Paket MK Rombel & Akses KRS'}
        description={
          isMahasiswa
            ? 'Daftar mata kuliah yang disediakan rombel Anda — ambil sekaligus dalam 1 klik.'
            : 'Tetapkan MK yang disediakan per rombel per periode, dan kelola hak akses pengisian KRS.'
        }
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'KRS', href: '/siakad/krs' },
          { label: 'Paket Rombel' },
        ]}
        action={
          <div className="flex items-center gap-2">
            {!isMahasiswa && (
              <Button variant="outline" icon={<Filter size={15} />} className="font-bold text-xs min-h-[38px]" style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }} onClick={() => { setDraftRombelId(selectedRombelId); setDraftTaId(selectedTaId); setDraftSearchAkses(searchAkses); setShowFilter(true); }}>
                Filter
              </Button>
            )}
            {!isMahasiswa && tab === 'paket' && (
              <Button variant="primary" icon={<Plus size={15} />} className="font-bold text-xs min-h-[38px]" onClick={() => setIsTambahOpen(true)} disabled={!selectedRombelId}>
                Tambah MK
              </Button>
            )}
          </div>
        }
      />

      {isMahasiswa ? (
        <div className="space-y-4">
          <div className="bg-slate-900 text-white rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg border border-slate-700">
            <div>
              <span className="inline-block bg-amber-400 text-slate-900 text-2xs font-black uppercase tracking-wider px-2.5 py-1 rounded-md">
                Rombel {paketSaya?.rombel?.nama_kelas || '-'}
              </span>
              <p className="text-xs text-slate-200 mt-2">
                {(paketSaya?.items || []).length} MK disediakan periode {selectedTa?.nama || ''}
                {!paketSaya?.is_krs_dibuka && <strong className="text-rose-300"> • Akses KRS dikunci BAAK</strong>}
              </p>
            </div>
            <Button
              variant="primary"
              icon={<Sparkles size={15} />}
              className="font-bold text-xs min-h-[38px]"
              onClick={handleAmbilPaket}
              loading={mengambil}
              disabled={mengambil || !paketSaya?.is_krs_dibuka || (paketSaya?.items || []).length === 0}
            >
              {mengambil ? 'Mengambil...' : 'Ambil Paket 1-Klik'}
            </Button>
          </div>

          <DataTable
            columns={[
              {
                key: 'mk',
                label: 'KODE & MATA KULIAH',
                render: (row: any) => (
                  <div>
                    <span className="font-bold text-slate-900 block text-xs">{row.mata_kuliah?.nama}</span>
                    <span className="font-mono text-2xs text-slate-400">{row.mata_kuliah?.kode_mk} • {row.mata_kuliah?.total_sks} SKS</span>
                  </div>
                ),
              },
              {
                key: 'wajib',
                label: 'SIFAT',
                align: 'center',
                render: (row: any) => (
                  <Badge variant={row.is_wajib ? 'blue' : 'gray'} className="text-2xs font-bold">
                    {row.is_wajib ? 'Wajib' : 'Pilihan'}
                  </Badge>
                ),
              },
            ]}
            data={paketSaya?.items || []}
            isLoading={loadingSaya}
            emptyMessage="Belum ada paket untuk rombel Anda periode ini."
          />

          {hasilAmbil && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { key: 'berhasil', label: 'Berhasil', icon: <CheckCircle2 size={14} />, cls: 'border-emerald-200 bg-emerald-50/60', txt: 'text-emerald-700' },
                { key: 'gagal', label: 'Gagal', icon: <XCircle size={14} />, cls: 'border-rose-200 bg-rose-50/60', txt: 'text-rose-700' },
                { key: 'dilewati', label: 'Dilewati', icon: <MinusCircle size={14} />, cls: 'border-slate-200 bg-slate-50', txt: 'text-slate-600' },
              ].map((g: any) => (
                <div key={g.key} className={`border rounded-2xl p-4 ${g.cls}`}>
                  <p className={`text-xs font-extrabold flex items-center gap-2 ${g.txt}`}>{g.icon} {g.label} ({(hasilAmbil.hasil?.[g.key] || []).length})</p>
                  <ul className="mt-2 space-y-1">
                    {(hasilAmbil.hasil?.[g.key] || []).map((r: any, i: number) => (
                      <li key={i} className="text-2xs text-slate-700">
                        <strong>{r.mk}</strong>
                        {r.kelas ? ` → ${r.kelas}` : ''}
                        {r.alasan ? ` — ${r.alasan}` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-2xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            Rombel: <strong>{selectedRombel ? `${selectedRombel.nama_kelas} — Angkatan ${selectedRombel.tahun_angkatan || '-'}` : '-'}</strong>
            {' • '}Periode: <strong>{selectedTa?.nama || '-'}</strong>
            {' • '}Ubah lewat tombol <strong>Filter</strong> di header.
          </p>
            {tab === 'akses' && (
              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" icon={<LockOpen size={15} />} className="font-bold text-xs min-h-[38px]" onClick={() => handleAksesRombel(true)} loading={togglingRombel} disabled={!selectedRombelId || !selectedTaId}>
                  Buka 1 Rombel
                </Button>
                <Button variant="outline" icon={<Lock size={15} />} className="font-bold text-xs min-h-[38px]" onClick={() => handleAksesRombel(false)} loading={togglingRombel} disabled={!selectedRombelId || !selectedTaId}>
                  Kunci 1 Rombel
                </Button>
              </div>
            )}

          <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto">
            {tabBtn('paket', `Paket MK${selectedRombel ? ` (${selectedRombel.nama_kelas})` : ''}`)}
            {tabBtn('akses', 'Hak Akses KRS')}
          </div>

          {tab === 'paket' && (
            <DataTable columns={paketColumns} data={paket} isLoading={loadingPaket} emptyMessage="Belum ada MK di paket rombel ini. Klik Tambah MK." />
          )}

          {tab === 'akses' && (
            <div className="space-y-4">
              <p className="text-2xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                Tanpa baris akses = <strong>terbuka</strong>. BAAK mengunci lewat tombol di atas atau per mahasiswa di bawah.
              </p>
              <DataTable columns={aksesColumns} data={aksesList} meta={aksesMeta} isLoading={loadingAkses} emptyMessage="Belum ada pembatasan akses periode ini (semua terbuka)." />
            </div>
          )}
        </div>
      )}

      <Drawer open={showFilter} onClose={() => setShowFilter(false)} title="Filter Paket Rombel">
        <div className="flex flex-col gap-5">
          <Select
            label="Rombel"
            placeholder="Pilih rombel..."
            options={rombelList.map((r: any) => ({ value: r.id, label: `${r.nama_kelas} — Angkatan ${r.tahun_angkatan || '-'}` }))}
            value={draftRombelId || ''}
            onChange={(v: any) => setDraftRombelId(v ? Number(v) : null)}
            isClearable
          />
          <Input label="Cari Akses (NIM/Nama)" placeholder="Cari di tab Hak Akses..." value={draftSearchAkses} onChange={(e) => setDraftSearchAkses(e.target.value)} />
          <PeriodeSelector value={draftTaId} onChange={(id) => setDraftTaId(id)} required />
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" className="flex-1 font-bold text-xs min-h-[38px]" onClick={() => { setDraftRombelId(selectedRombelId); setDraftTaId(selectedTaId); setDraftSearchAkses(searchAkses); setShowFilter(false); }}>
              Reset
            </Button>
            <Button variant="primary" className="flex-1 font-bold text-xs min-h-[38px]" onClick={() => { setSelectedRombelId(draftRombelId); setSelectedTaId(draftTaId); setSearchAkses(draftSearchAkses); setShowFilter(false); }}>
              Terapkan
            </Button>
          </div>
        </div>
      </Drawer>

      <Modal open={isTambahOpen} onClose={() => setIsTambahOpen(false)} title={`Tambah MK ke Paket ${selectedRombel?.nama_kelas || ''}`}>
        <form
          onSubmit={handleSubmit(onTambah)}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Controller
                name="mata_kuliah_id"
                control={control}
                render={({ field }) => (
                  <AsyncSelect
                    label="Mata Kuliah"
                    required
                    placeholder="Cari kode / nama MK..."
                    loadOptions={loadMkOptions}
                    value={field.value || null}
                    onChange={(opt: any) => field.onChange(opt?.value ? Number(opt.value) : 0)}
                    error={errors.mata_kuliah_id?.message}
                  />
                )}
              />
            </div>
            <Controller
              name="semester_anjuran"
              control={control}
              render={({ field }) => (
                <Input
                  label="Semester Anjuran"
                  type="number"
                  min={1}
                  max={14}
                  placeholder="cth. 3"
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                  error={errors.semester_anjuran?.message}
                />
              )}
            />
            <Controller
              name="is_wajib"
              control={control}
              render={({ field }) => (
                <Select
                  label="Sifat"
                  options={[
                    { value: 1, label: 'Wajib' },
                    { value: 0, label: 'Pilihan' },
                  ]}
                  value={field.value ? 1 : 0}
                  onChange={(v: any) => field.onChange(Number(v) === 1)}
                />
              )}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsTambahOpen(false)}>Batal</Button>
            <Button type="submit" variant="primary" icon={<PackagePlus size={16} />} loading={isSubmitting} disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan ke Paket'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!paketToDelete}
        onClose={() => setPaketToDelete(null)}
        onConfirm={handleDelete}
        title="Hapus dari Paket?"
        message={`"${paketToDelete?.mata_kuliah?.nama}" akan dihapus dari paket rombel ${selectedRombel?.nama_kelas || ''}.`}
        confirmText="Ya, Hapus"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}
