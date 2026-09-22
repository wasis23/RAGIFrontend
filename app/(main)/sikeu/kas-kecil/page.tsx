'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Filter, Eye, Wallet, Building2, UserRound, Edit2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { kasKecilService } from '@/services/kas-kecil.service';
import { sikeuService } from '@/services/sikeu.service';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { formatRupiah } from '@/lib/utils';
import type { PaginationMeta } from '@/types/api.types';
import type { AkunKeuangan, FakultasRingkas, KasKecilUnit } from '@/types/sikeu.types';

const editKasKecilSchema = z.object({
  nama_kas: z.string().min(3, 'Nama kas kecil minimal 3 karakter'),
  fakultas_id: z.number({ error: 'Fakultas wajib dipilih' }).int('Fakultas wajib dipilih'),
  penanggung_jawab_id: z.number({ error: 'Petugas penanggung jawab wajib dipilih' }).int('Petugas wajib dipilih'),
  akun_keuangan_id: z.number({ error: 'Akun kas (COA aset) wajib dipilih' }).int('Akun COA wajib dipilih'),
  status: z.boolean(),
  deskripsi: z.string().optional(),
});

type EditKasKecilForm = z.infer<typeof editKasKecilSchema>;

const petugasLabel = (unit: KasKecilUnit): string => {
  const pj = unit.penanggung_jawab;
  if (pj && typeof pj === 'object') {
    if (pj.pegawai?.nama_lengkap) return pj.pegawai.nama_lengkap;
    if (pj.username) return pj.username;
  }
  if (typeof pj === 'string' && pj) return pj;
  return '-';
};

export default function KasKecilPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();

  const [data, setData] = useState<KasKecilUnit[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);

  // filter drawer
  const [showFilter, setShowFilter] = useState(false);
  const [fakultasList, setFakultasList] = useState<FakultasRingkas[]>([]);

  const [search, setSearch] = useState('');
  const [fakultasId, setFakultasId] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('nama_kas');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const [applied, setApplied] = useState({
    search: '', fakultas_id: '', status: '', sort_by: 'nama_kas', sort_dir: 'asc' as 'asc' | 'desc',
  });

  const canManage = hasPermission('sikeu.kas.manage');

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<KasKecilUnit | null>(null);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [coaList, setCoaList] = useState<AkunKeuangan[]>([]);
  const [selectedEditFakultas, setSelectedEditFakultas] = useState<{ value: string; label: string } | null>(null);
  const [selectedEditPetugas, setSelectedEditPetugas] = useState<{ value: string; label: string } | null>(null);

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    control: controlEdit,
    setValue: setEditValue,
    watch: watchEdit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<EditKasKecilForm>({
    resolver: zodResolver(editKasKecilSchema) as unknown as Resolver<EditKasKecilForm>,
    defaultValues: {
      nama_kas: '',
      fakultas_id: undefined,
      penanggung_jawab_id: undefined,
      akun_keuangan_id: undefined,
      status: true,
      deskripsi: '',
    },
  });

  const watchEditAkun = watchEdit('akun_keuangan_id');

  // Load COA kelompok aset (Kas & Bank 101/102)
  useEffect(() => {
    const fetchCoa = async () => {
      try {
        const res = await sikeuService.getCoaList('aset');
        const list = Array.isArray(res.data) ? res.data : [];
        setCoaList(
          list.filter(
            (a) =>
              String(a.kode_akun || '').startsWith('101') ||
              String(a.kode_akun || '').startsWith('102')
          )
        );
      } catch {
        setCoaList([]);
      }
    };
    fetchCoa();
  }, []);

  // AsyncSelect loaders
  const loadFakultasOptions = useCallback(async (inputValue: string) => {
    try {
      const res = await kasKecilService.referensiFakultas();
      const list = Array.isArray(res.data) ? res.data : [];
      const q = inputValue.trim().toLowerCase();
      const filtered = q ? list.filter((f) => f.nama.toLowerCase().includes(q)) : list;
      return filtered.map((f) => ({ value: String(f.id), label: f.nama }));
    } catch {
      return [];
    }
  }, []);

  const loadPetugasOptions = useCallback(async (inputValue: string) => {
    try {
      const res = await kasKecilService.referensiPetugas(inputValue || undefined);
      const list = Array.isArray(res.data) ? res.data : [];
      return list.map((p) => ({ value: String(p.id), label: p.label }));
    } catch {
      return [];
    }
  }, []);

  const handleOpenEdit = (unit: KasKecilUnit) => {
    setEditingUnit(unit);
    resetEdit({
      nama_kas: unit.nama_kas,
      fakultas_id: unit.fakultas_id || (unit.fakultas?.id ? Number(unit.fakultas.id) : undefined),
      penanggung_jawab_id:
        unit.penanggung_jawab_id ||
        (typeof unit.penanggung_jawab === 'object' && unit.penanggung_jawab ? Number(unit.penanggung_jawab.id) : undefined),
      akun_keuangan_id:
        unit.akun_keuangan_id ||
        (unit.akunKeuangan?.id ? Number(unit.akunKeuangan.id) : undefined) ||
        (unit.akun_keuangan?.id ? Number(unit.akun_keuangan.id) : undefined),
      status: unit.status !== false && unit.status !== 0,
      deskripsi: unit.deskripsi || '',
    });

    if (unit.fakultas) {
      setSelectedEditFakultas({ value: String(unit.fakultas.id), label: unit.fakultas.nama });
    } else {
      setSelectedEditFakultas(null);
    }

    if (unit.penanggung_jawab && typeof unit.penanggung_jawab === 'object') {
      const label = unit.penanggung_jawab.pegawai?.nama_lengkap
        ? `${unit.penanggung_jawab.pegawai.nama_lengkap} (${unit.penanggung_jawab.username || ''})`
        : unit.penanggung_jawab.username || 'Petugas Kas Kecil';
      setSelectedEditPetugas({ value: String(unit.penanggung_jawab.id), label });
    } else {
      setSelectedEditPetugas(null);
    }

    setEditModalOpen(true);
  };

  const onSaveEdit = async (form: EditKasKecilForm) => {
    if (!editingUnit) return;
    setSubmittingEdit(true);
    try {
      await kasKecilService.updateUnit(editingUnit.id, {
        nama_kas: form.nama_kas,
        fakultas_id: form.fakultas_id,
        penanggung_jawab_id: form.penanggung_jawab_id,
        akun_keuangan_id: form.akun_keuangan_id,
        status: form.status,
        deskripsi: form.deskripsi?.trim() || undefined,
      });
      toast.success('Unit kas kecil berhasil diperbarui');
      setEditModalOpen(false);
      setEditingUnit(null);
      fetchData();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Gagal memperbarui unit kas kecil';
      toast.error(msg);
    } finally {
      setSubmittingEdit(false);
    }
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await kasKecilService.listUnits({
        page,
        per_page: perPage,
        search: applied.search || undefined,
        fakultas_id: applied.fakultas_id || undefined,
        status: applied.status || undefined,
        sort_by: applied.sort_by,
        sort_dir: applied.sort_dir,
      });
      setData(Array.isArray(res.data) ? res.data : []);
      setMeta(res.meta);
    } catch {
      setData([]);
      toast.error('Gagal memuat data kas kecil');
    } finally {
      setLoading(false);
    }
  }, [page, perPage, applied]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    kasKecilService.referensiFakultas()
      .then((res) => setFakultasList(Array.isArray(res.data) ? res.data : []))
      .catch(() => setFakultasList([]));
  }, []);

  const handleApplyFilter = () => {
    setApplied({ search, fakultas_id: fakultasId, status, sort_by: sortBy, sort_dir: sortDir });
    setPage(1);
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setSearch('');
    setFakultasId('');
    setStatus('');
    setSortBy('nama_kas');
    setSortDir('asc');
    setApplied({ search: '', fakultas_id: '', status: '', sort_by: 'nama_kas', sort_dir: 'asc' });
    setPage(1);
    setShowFilter(false);
  };

  const columns: ColumnDef<KasKecilUnit>[] = [
    {
      key: 'nama_kas',
      label: 'NAMA KAS KECIL',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900 text-sm">{row.nama_kas}</p>
          <p className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
            <Building2 size={12} className="text-slate-400" />
            {row.fakultas?.nama || '-'}
          </p>
        </div>
      ),
    },
    {
      key: 'penanggung_jawab',
      label: 'PENANGGUNG JAWAB',
      render: (row) => (
        <p className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
          <UserRound size={13} className="text-slate-400" />
          {petugasLabel(row)}
        </p>
      ),
    },
    {
      key: 'saldo_saat_ini',
      label: 'SALDO',
      align: 'right',
      render: (row) => (
        <p className="font-mono font-bold text-sm text-emerald-700">
          {formatRupiah(Number(row.saldo_saat_ini) || 0)}
        </p>
      ),
    },
    {
      key: 'akun',
      label: 'AKUN COA',
      render: (row) => {
        const akun = row.akunKeuangan || row.akun_keuangan;
        return akun ? (
          <span className="font-mono text-2xs font-semibold text-indigo-600">
            [{akun.kode_akun}] {akun.nama_akun}
          </span>
        ) : (
          <span className="text-2xs text-slate-400">-</span>
        );
      },
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (row) =>
        row.status !== false && row.status !== 0 ? (
          <Badge variant="green" dot>Aktif</Badge>
        ) : (
          <Badge variant="red" dot>Non-Aktif</Badge>
        ),
    },
    {
      key: 'actions',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <DropdownMenu
          items={[
            {
              label: 'Detail Unit & Transaksi',
              icon: <Eye size={14} />,
              onClick: () => router.push(`/sikeu/kas-kecil/${row.id}`),
            },
            ...(canManage
              ? [
                  {
                    label: 'Edit Unit Kas Kecil',
                    icon: <Edit2 size={14} />,
                    onClick: () => handleOpenEdit(row),
                  },
                ]
              : []),
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Kas Kecil (Petty Cash)"
        description="Unit kas kecil per fakultas: transaksi pengeluaran, saldo, dan pengajuan kas langsung (top-up)."
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setShowFilter(true)}
              className="font-bold min-h-[38px] text-xs"
            >
              Filter
            </Button>
            {canManage && (
              <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={() => router.push('/sikeu/kas-kecil/create')}
                className="font-bold min-h-[38px] text-xs shadow-md"
              >
                Tambah Unit Kas Kecil
              </Button>
            )}
          </div>
        }
      />

      <div className="card p-4 sm:p-6 border border-slate-200/80">
        <DataTable
          columns={columns}
          data={data}
          isLoading={loading}
          meta={meta}
          onPageChange={setPage}
          onLimitChange={(l) => { setPerPage(l); setPage(1); }}
        />
      </div>

      {/* Filter Drawer slide kanan */}
      <Drawer
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Kas Kecil"
        width="360px"
        footer={
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={handleResetFilter} className="font-bold min-h-[38px] text-xs">Reset</Button>
            <Button variant="primary" onClick={handleApplyFilter} className="font-bold min-h-[38px] text-xs">Terapkan</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Cari Nama / PJ"
                placeholder="Ketik kata kunci..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Select
                label="Fakultas"
                options={[
                  { value: '', label: 'Semua Fakultas' },
                  ...fakultasList.map((f) => ({ value: String(f.id), label: f.nama })),
                ]}
                value={fakultasId}
                onChange={(val) => setFakultasId(String(val || ''))}
              />
            </div>
          </div>

          <div>
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Status"
                options={[
                  { value: '', label: 'Semua Status' },
                  { value: '1', label: 'Aktif' },
                  { value: '0', label: 'Non-Aktif' },
                ]}
                value={status}
                onChange={(val) => setStatus(String(val || ''))}
              />
              <Select
                label="Urutkan"
                options={[
                  { value: 'nama_kas', label: 'Nama Kas' },
                  { value: 'saldo_saat_ini', label: 'Saldo' },
                  { value: 'created_at', label: 'Tanggal Dibuat' },
                ]}
                value={sortBy}
                onChange={(val) => setSortBy(String(val || 'nama_kas'))}
              />
            </div>
          </div>

          <Select
            label="Arah Urutan"
            options={[
              { value: 'asc', label: 'Naik (A-Z)' },
              { value: 'desc', label: 'Turun (Z-A)' },
            ]}
            value={sortDir}
            onChange={(val) => setSortDir((val as 'asc' | 'desc') || 'asc')}
          />

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-1.5">
            <p className="flex items-center gap-2 text-2xs font-bold text-slate-600">
              <Wallet size={13} className="text-primary-600" /> Ringkasan Kas Kecil
            </p>
            <p className="text-xs text-slate-500">
              Saldo ditampilkan per unit. Transaksi keluar & top-up dicatatkan ke jurnal otomatis.
            </p>
          </div>
        </div>
      </Drawer>

      {/* Modal Edit Unit Kas Kecil (Atomic Design <= 5/6 inputs) */}
      <Modal
        open={editModalOpen}
        onClose={() => {
          if (!submittingEdit) {
            setEditModalOpen(false);
            setEditingUnit(null);
          }
        }}
        title={`Edit Unit Kas Kecil: ${editingUnit?.nama_kas || ''}`}
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditModalOpen(false);
                setEditingUnit(null);
              }}
              disabled={submittingEdit}
              className="font-bold min-h-[38px] text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSubmitEdit(onSaveEdit)}
              disabled={submittingEdit}
              loading={submittingEdit}
              icon={!submittingEdit ? <Save size={15} /> : undefined}
              className="font-bold min-h-[38px] text-xs shadow-md"
            >
              {submittingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmitEdit(onSaveEdit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nama Kas Kecil *"
              placeholder="Contoh: Kas Kecil Fakultas Teknik"
              {...registerEdit('nama_kas')}
              error={editErrors.nama_kas?.message}
            />

            <div>
              <label className="form-label">
                Fakultas <span className="required">*</span>
              </label>
              <Controller
                control={controlEdit}
                name="fakultas_id"
                render={({ field }) => (
                  <AsyncSelect
                    loadOptions={loadFakultasOptions}
                    value={selectedEditFakultas}
                    onChange={(val: { value: string; label: string } | null) => {
                      setSelectedEditFakultas(val || null);
                      field.onChange(val ? Number(val.value) : undefined);
                    }}
                    placeholder="Pilih fakultas..."
                    error={editErrors.fakultas_id?.message as string | undefined}
                    isClearable
                  />
                )}
              />
              {editErrors.fakultas_id && (
                <span className="form-error">{editErrors.fakultas_id.message}</span>
              )}
            </div>

            <div>
              <label className="form-label">
                Petugas Penanggung Jawab <span className="required">*</span>
              </label>
              <Controller
                control={controlEdit}
                name="penanggung_jawab_id"
                render={({ field }) => (
                  <AsyncSelect
                    loadOptions={loadPetugasOptions}
                    value={selectedEditPetugas}
                    onChange={(val: { value: string; label: string } | null) => {
                      setSelectedEditPetugas(val || null);
                      field.onChange(val ? Number(val.value) : undefined);
                    }}
                    placeholder="Ketik nama/username petugas..."
                    error={editErrors.penanggung_jawab_id?.message as string | undefined}
                    isClearable
                  />
                )}
              />
              {editErrors.penanggung_jawab_id && (
                <span className="form-error">{editErrors.penanggung_jawab_id.message}</span>
              )}
            </div>

            <Select
              label="Akun Kas (COA Aset 101/102) *"
              options={[
                ...(watchEditAkun ? [] : [{ value: '', label: '-- Pilih akun kas --' }]),
                ...coaList.map((a) => ({ value: String(a.id), label: `[${a.kode_akun}] ${a.nama_akun}` })),
              ]}
              value={watchEditAkun?.toString() || ''}
              onChange={(val) =>
                setEditValue('akun_keuangan_id', val ? Number(val) : (null as unknown as number), {
                  shouldValidate: true,
                })
              }
              error={editErrors.akun_keuangan_id?.message}
            />

            <Select
              label="Status Operasional Unit *"
              options={[
                { value: 'true', label: 'Aktif (Dapat Bertransaksi)' },
                { value: 'false', label: 'Non-Aktif (Ditangguhkan)' },
              ]}
              value={watchEdit('status') ? 'true' : 'false'}
              onChange={(val) => setEditValue('status', val === 'true')}
            />

            <div>
              <Textarea
                label="Deskripsi / Catatan"
                placeholder="Peruntukan kas kecil, batasan pengeluaran harian, dsb."
                rows={2}
                {...registerEdit('deskripsi')}
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}