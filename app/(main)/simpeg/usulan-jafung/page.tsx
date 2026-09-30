'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Award, Plus, Filter, ShieldAlert, AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { simpegService } from '@/services/simpeg.service';
import type { UsulanJafung, JabatanFungsionalAkademik, Pegawai } from '@/types/simpeg.types';
import type { PaginationMeta } from '@/types/api.types';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

const usulanJafungSchema = z.object({
  pegawai_id: z.string().min(1, 'Pilih Dosen Pengusul'),
  jafung_asal_id: z.string().min(1, 'Jabatan Fungsional asal belum diisi di biodata dosen'),
  jafung_tujuan_id: z.string().min(1, 'Pilih Jabatan Fungsional target'),
  angka_kredit_usulan: z.number().min(0, 'Angka kredit usulan minimal 0'),
  catatan_reviewer: z.string().optional().nullable(),
});

type UsulanJafungFormValues = z.infer<typeof usulanJafungSchema>;

export default function UsulanJafungPage() {
  const { isAdmin, hasPermission } = useAuth();
  const canAccess = isAdmin || hasPermission('simpeg.usulan_jafung.verify') || hasPermission('simpeg.usulan_jafung.manage');
  const canRead = hasPermission('simpeg.usulan_jafung.read') || hasPermission('simpeg.usulan_jafung.request') || hasPermission('simpeg.usulan_jafung.verify');
  const canCreate = hasPermission('simpeg.usulan_jafung.create') || hasPermission('simpeg.usulan_jafung.request');

  const [loading, setLoading] = useState(true);
  const [usulanList, setUsulanList] = useState<UsulanJafung[]>([]);
  const [jafungList, setJafungList] = useState<JabatanFungsionalAkademik[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();
  const [showFilter, setShowFilter] = useState(false);
  const [search, setSearch] = useState('');
  const [filterOrderBy, setFilterOrderBy] = useState('created_at');
  const [filterOrderDir, setFilterOrderDir] = useState<'asc' | 'desc'>('desc');

  // Modal Request State
  const [showModal, setShowModal] = useState(false);
  const [selectedPegawai, setSelectedPegawai] = useState<Pegawai | null>(null);
  const [selectedPegawaiOption, setSelectedPegawaiOption] = useState<{ value: string; label: string } | null>(null);
  const [isCheckingPegawai, setIsCheckingPegawai] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UsulanJafungFormValues>({
    resolver: zodResolver(usulanJafungSchema),
    defaultValues: {
      pegawai_id: '',
      jafung_asal_id: '',
      jafung_tujuan_id: '',
      angka_kredit_usulan: 200,
      catatan_reviewer: '',
    },
  });

  const jafungAsalId = watch('jafung_asal_id');
  const jafungTujuanId = watch('jafung_tujuan_id');

  const loadData = async () => {
    if (!canRead) return;
    setLoading(true);
    try {
      if (!canAccess) {
        const resMe = await simpegService.getPegawaiMe();
        if (resMe.data) {
          const pegId = resMe.data.id;
          const [resUsulan, resJaf] = await Promise.all([
            simpegService.getUsulanJafungList({ pegawai_id: pegId, page, limit, search: search || undefined, sort_by: filterOrderBy, sort_dir: filterOrderDir }),
            simpegService.getJabatanFungsionalList(),
          ]);
          setUsulanList(resUsulan.data || []);
          if ((resUsulan as any).meta) setMeta((resUsulan as any).meta);
          setJafungList(resJaf.data || []);
        }
      } else {
        const [resUsulan, resJaf] = await Promise.all([
          simpegService.getUsulanJafungList({ page, limit, search: search || undefined, sort_by: filterOrderBy, sort_dir: filterOrderDir }),
          simpegService.getJabatanFungsionalList(),
        ]);
        setUsulanList(resUsulan.data || []);
        if ((resUsulan as any).meta) setMeta((resUsulan as any).meta);
        setJafungList(resJaf.data || []);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memuat Usulan Jafung');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [canRead, page, limit, filterOrderBy, filterOrderDir]);

  // Server-side async loader untuk memilih dosen
  const loadDosenOptions = useCallback(async (inputValue: string) => {
    try {
      const res = await simpegService.getPegawaiList({
        search: inputValue || undefined,
        jenis_pegawai: 'dosen',
        per_page: 50,
      });
      const list: Pegawai[] = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
      return list.map((p) => ({
        value: String(p.id),
        label: `${p.nama_lengkap}${p.nip ? ` (NIP: ${p.nip})` : ''} - ${p.unit_kerja?.nama || 'Dosen'}`,
        pegawai: p,
      }));
    } catch (err) {
      console.error('Gagal memuat daftar dosen', err);
      return [];
    }
  }, []);

  const handleOpenModal = async () => {
    setShowModal(true);
    if (!canAccess) {
      setIsCheckingPegawai(true);
      try {
        const resMe = await simpegService.getPegawaiMe();
        if (resMe.data) {
          const me = resMe.data;
          setSelectedPegawai(me);
          reset({
            pegawai_id: String(me.id),
            jafung_asal_id: me.jabatan_fungsional_id ? String(me.jabatan_fungsional_id) : '',
            jafung_tujuan_id: '',
            angka_kredit_usulan: 200,
            catatan_reviewer: '',
          });
        }
      } catch (err) {
        console.error('Gagal mengambil profil dosen', err);
      } finally {
        setIsCheckingPegawai(false);
      }
    } else {
      if (!selectedPegawai) {
        reset({
          pegawai_id: '',
          jafung_asal_id: '',
          jafung_tujuan_id: '',
          angka_kredit_usulan: 200,
          catatan_reviewer: '',
        });
      }
    }
  };

  const handleSelectDosen = async (opt: any) => {
    setSelectedPegawaiOption(opt);
    if (!opt) {
      setSelectedPegawai(null);
      setValue('pegawai_id', '', { shouldValidate: true });
      setValue('jafung_asal_id', '', { shouldValidate: true });
      setValue('jafung_tujuan_id', '');
      return;
    }

    setIsCheckingPegawai(true);
    try {
      const res = await simpegService.getPegawaiDetail(Number(opt.value));
      const peg = res.data;
      if (peg) {
        setSelectedPegawai(peg);
        setValue('pegawai_id', String(peg.id), { shouldValidate: true });
        setValue('jafung_asal_id', peg.jabatan_fungsional_id ? String(peg.jabatan_fungsional_id) : '', { shouldValidate: true });
        setValue('jafung_tujuan_id', '');
      }
    } catch (err) {
      console.error('Gagal memuat rincian dosen', err);
      toast.error('Gagal memuat rincian dosen');
    } finally {
      setIsCheckingPegawai(false);
    }
  };

  const onSubmit = async (values: UsulanJafungFormValues) => {
    if (!canCreate) {
      toast.error('Akses Ditolak: Anda tidak memiliki permission mengajukan Usulan Jafung.');
      return;
    }

    try {
      await simpegService.createUsulanJafung({
        pegawai_id: Number(values.pegawai_id),
        jafung_asal_id: Number(values.jafung_asal_id),
        jafung_tujuan_id: Number(values.jafung_tujuan_id),
        angka_kredit_usulan: Number(values.angka_kredit_usulan),
        catatan_reviewer: values.catatan_reviewer || null,
      });
      toast.success('Usulan kenaikan Jafung Dosen berhasil diajukan!');
      setShowModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal mengajukan usulan Jafung');
    }
  };

  const columns: ColumnDef<UsulanJafung>[] = [
    {
      key: 'nama_dosen',
      label: 'Nama Dosen',
      render: (u) => (
        <span className="font-bold">
          {u.pegawai?.nama_lengkap || `Dosen ID ${u.pegawai_id}`}
        </span>
      ),
    },
    {
      key: 'jafung_asal',
      label: 'Jafung Asal',
      render: (u) => (
        <span className="text-slate-700 font-medium">
          {u.jafung_asal?.nama || u.pegawai?.jabatan_fungsional?.nama || '-'}
        </span>
      ),
    },
    {
      key: 'jafung_tujuan',
      label: 'Jafung Tujuan',
      render: (u) => (
        <Badge
          style={{
            backgroundColor: 'var(--module-primary-subtle)',
            color: 'var(--module-primary)',
            borderColor: 'var(--module-primary)',
          }}
          className="font-bold"
        >
          {u.jafung_tujuan?.nama || `Jafung ID ${u.jafung_tujuan_id}`}
        </Badge>
      ),
    },
    {
      key: 'angka_kredit',
      label: 'Angka Kredit (KUM)',
      render: (u) => <span className="font-bold text-[var(--success)]">{u.angka_kredit_usulan} KUM</span>,
    },
    {
      key: 'catatan_reviewer',
      label: 'Catatan Reviewer Tim Senat',
      render: (u) => <span className="text-sm text-[var(--text-secondary)]">{u.catatan_reviewer || '-'}</span>,
    },
  ];

  if (!canRead) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader
          title="Usulan Kenaikan Jabatan Fungsional (Jafung & KUM Dosen)"
          description="Pengajuan & Verifikasi Angka Kredit Akademik Dosen (Asisten Ahli, Lektor, Lektor Kepala, Guru Besar)"
        />
        <Card>
          <EmptyState
            icon={<ShieldAlert size={48} className="text-[var(--danger)]" />}
            title="Akses Ditolak / Dibatasi"
            description="Peran Anda saat ini tidak memiliki permission untuk melihat atau mengajukan Usulan Jafung Dosen."
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Usulan Kenaikan Jabatan Fungsional (Jafung & KUM Dosen)"
        description="Pengajuan & Verifikasi Angka Kredit Akademik Dosen (Asisten Ahli, Lektor, Lektor Kepala, Guru Besar)"
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setShowFilter(true)}
            >
              Filter
            </Button>
            {canCreate && (
              <Button icon={<Plus size={16} />} onClick={handleOpenModal}>
                Ajukan Kenaikan Jafung
              </Button>
            )}
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={usulanList}
        isLoading={loading}
        meta={meta}
        onPageChange={(newPage) => setPage(newPage)}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
        emptyMessage="Belum ada usulan kenaikan Jafung Dosen."
      />

      {/* Drawer Filter */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Usulan Jafung Dosen"
      >
        <div className="space-y-4">
          <Input
            label="Cari Dosen / Jafung"
            placeholder="Ketik nama dosen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <hr className="my-2 border-slate-200" />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={filterOrderBy}
              onChange={(val) => setFilterOrderBy(val)}
              options={[
                { value: 'created_at', label: 'Tanggal Dibuat' },
                { value: 'angka_kredit_usulan', label: 'KUM Usulan' },
                { value: 'id', label: 'ID' },
              ]}
            />
            <Select
              label="Arah"
              value={filterOrderDir}
              onChange={(val) => setFilterOrderDir(val as 'asc' | 'desc')}
              options={[
                { value: 'desc', label: 'Z - A (Terbaru)' },
                { value: 'asc', label: 'A - Z (Terlama)' },
              ]}
            />
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSearch('');
                setFilterOrderBy('created_at');
                setFilterOrderDir('desc');
              }}
            >
              Reset
            </Button>
            <Button
              onClick={() => {
                setShowFilter(false);
                loadData();
              }}
            >
              Terapkan
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Modal Ajukan Jafung */}
      {canCreate && (
        <Modal
          open={showModal}
          onClose={() => setShowModal(false)}
          title="Ajukan Kenaikan Jabatan Fungsional Dosen"
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Batal
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleSubmit(onSubmit)}
                loading={isSubmitting}
                disabled={
                  !selectedPegawai ||
                  !jafungAsalId ||
                  isCheckingPegawai ||
                  isSubmitting
                }
              >
                Kirim Usulan Jafung
              </Button>
            </>
          }
        >
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {canAccess ? (
              <AsyncSelect
                label="Pilih Dosen Pengusul"
                required
                placeholder="Ketik nama atau NIP dosen..."
                loadOptions={loadDosenOptions}
                value={selectedPegawaiOption}
                onChange={handleSelectDosen}
                isClearable
                error={errors.pegawai_id?.message}
              />
            ) : (
              selectedPegawai && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs flex flex-col gap-2">
                  <span className="text-slate-400 font-medium block">Dosen Pengusul:</span>
                  <span className="font-semibold text-slate-800 text-sm">
                    {selectedPegawai.nama_lengkap}
                  </span>
                  <span className="text-slate-500 block">
                    NIP: {selectedPegawai.nip || '-'} • Unit: {selectedPegawai.unit_kerja?.nama || '-'}
                  </span>
                </div>
              )
            )}

            {isCheckingPegawai && (
              <div className="p-4 text-xs text-slate-500 bg-slate-50 rounded-xl text-center animate-pulse">
                Memeriksa data kepegawaian dosen...
              </div>
            )}

            {selectedPegawai && !isCheckingPegawai && (
              <>
                {jafungAsalId ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <div className="text-xs flex flex-col gap-2">
                      <span className="font-bold text-emerald-900 block">
                        Jabatan Fungsional Asal: {selectedPegawai.jabatan_fungsional?.nama || 'Terdaftar'}
                      </span>
                      <span className="text-emerald-700 block">
                        Otomatis terisi dari biodata kepegawaian dosen (KUM Minimal: {selectedPegawai.jabatan_fungsional?.angka_kredit_min ?? 0} KUM).
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
                    <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                    <div className="text-xs flex-1 flex flex-col gap-2">
                      <span className="font-bold text-amber-900 block">
                        Jabatan Fungsional Asal Belum Diisi
                      </span>
                      <span className="text-amber-700 block leading-relaxed">
                        Dosen ini belum memiliki data Jabatan Fungsional di biodata kepegawaian. Harap lengkapi terlebih dahulu Jabatan Fungsional di biodata dosen sebelum mengajukan usulan kenaikan jafung.
                      </span>
                      {canAccess && (
                        <div>
                          <Link
                            href={`/simpeg/pegawai/${selectedPegawai.id}/edit`}
                            target="_blank"
                          >
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              icon={<ExternalLink size={16} />}
                            >
                              Lengkapi Jafung di Data Pegawai
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            <Controller
              name="jafung_tujuan_id"
              control={control}
              render={({ field }) => (
                <Select
                  label="Jabatan Fungsional Tujuan"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.jafung_tujuan_id?.message}
                  options={[
                    { value: '', label: '-- Pilih Jafung Target --' },
                    ...jafungList
                      .filter((jf) => !jafungAsalId || jf.id !== Number(jafungAsalId))
                      .map((jf) => ({
                        value: String(jf.id),
                        label: `${jf.nama} (${jf.angka_kredit_min} KUM)`,
                      })),
                  ]}
                  required
                  disabled={!selectedPegawai || !jafungAsalId || isCheckingPegawai}
                />
              )}
            />

            <Input
              label="Total Angka Kredit Usulan (KUM)"
              type="number"
              required
              disabled={!selectedPegawai || !jafungAsalId || isCheckingPegawai}
              error={errors.angka_kredit_usulan?.message}
              {...register('angka_kredit_usulan', { valueAsNumber: true })}
            />

            <Textarea
              label="Catatan Pengajuan / Ringkasan Tridharma"
              rows={3}
              placeholder="Tuliskan karya ilmiah & pengajaran pendukung..."
              disabled={!selectedPegawai || !jafungAsalId || isCheckingPegawai}
              error={errors.catatan_reviewer?.message}
              {...register('catatan_reviewer')}
            />
          </form>
        </Modal>
      )}
    </div>
  );
}
