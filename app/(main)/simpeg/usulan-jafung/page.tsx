'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Filter, ShieldAlert, FileText, Trash2, ExternalLink, UploadCloud } from 'lucide-react';
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
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { simpegService } from '@/services/simpeg.service';
import type { UsulanJafung, JabatanFungsionalAkademik, Pegawai } from '@/types/simpeg.types';
import type { PaginationMeta } from '@/types/api.types';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

const jadUploadSchema = z.object({
  pegawai_id: z.string().min(1, 'Pilih Dosen'),
  jafung_tujuan_id: z.string().min(1, 'Pilih Jabatan Akademik'),
  nomor_sk: z.string().min(1, 'Nomor SK wajib diisi'),
  tanggal_mulai_berlaku: z.string().min(1, 'Tanggal mulai berlaku (TMT) wajib diisi'),
});

type JadUploadFormValues = z.infer<typeof jadUploadSchema>;

export default function JabatanAkademikDosenPage() {
  const { isAdmin, hasPermission } = useAuth();
  const canAccess = isAdmin || hasPermission('simpeg.usulan_jafung.verify') || hasPermission('simpeg.usulan_jafung.manage');
  const canRead = hasPermission('simpeg.usulan_jafung.read') || hasPermission('simpeg.usulan_jafung.request') || hasPermission('simpeg.usulan_jafung.verify');
  const canCreate = hasPermission('simpeg.usulan_jafung.create') || hasPermission('simpeg.usulan_jafung.request');
  const canDelete = hasPermission('simpeg.usulan_jafung.delete') || canAccess;

  const [loading, setLoading] = useState(true);
  const [jadList, setJadList] = useState<UsulanJafung[]>([]);
  const [jafungList, setJafungList] = useState<JabatanFungsionalAkademik[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();
  const [showFilter, setShowFilter] = useState(false);
  const [search, setSearch] = useState('');
  const [filterOrderBy, setFilterOrderBy] = useState('created_at');
  const [filterOrderDir, setFilterOrderDir] = useState<'asc' | 'desc'>('desc');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedPegawai, setSelectedPegawai] = useState<Pegawai | null>(null);
  const [selectedPegawaiOption, setSelectedPegawaiOption] = useState<{ value: string; label: string } | null>(null);
  const [isCheckingPegawai, setIsCheckingPegawai] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [recordedJafungIds, setRecordedJafungIds] = useState<number[]>([]);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<UsulanJafung | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<JadUploadFormValues>({
    resolver: zodResolver(jadUploadSchema),
    defaultValues: {
      pegawai_id: '',
      jafung_tujuan_id: '',
      nomor_sk: '',
      tanggal_mulai_berlaku: '',
    },
  });

  const loadData = async () => {
    if (!canRead) return;
    setLoading(true);
    try {
      if (!canAccess) {
        const resMe = await simpegService.getPegawaiMe();
        if (resMe.data) {
          const pegId = resMe.data.id;
          const [resUsulan, resJaf] = await Promise.all([
            simpegService.getUsulanJafungList({
              pegawai_id: pegId,
              page,
              limit,
              search: search || undefined,
              sort_by: filterOrderBy,
              sort_dir: filterOrderDir,
            }),
            simpegService.getJabatanFungsionalList(),
          ]);
          setJadList(resUsulan.data || []);
          if ((resUsulan as any).meta) setMeta((resUsulan as any).meta);
          setJafungList(resJaf.data || []);
        }
      } else {
        const [resUsulan, resJaf] = await Promise.all([
          simpegService.getUsulanJafungList({
            page,
            limit,
            search: search || undefined,
            sort_by: filterOrderBy,
            sort_dir: filterOrderDir,
          }),
          simpegService.getJabatanFungsionalList(),
        ]);
        setJadList(resUsulan.data || []);
        if ((resUsulan as any).meta) setMeta((resUsulan as any).meta);
        setJafungList(resJaf.data || []);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memuat data Jabatan Akademik Dosen');
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

  const fetchRecordedJafungIds = async (pegId: number) => {
    try {
      const res = await simpegService.getUsulanJafungList({ pegawai_id: pegId, limit: 100 });
      const ids: number[] = (res.data || []).map((u: any) => u.jafung_tujuan_id).filter(Boolean);
      setRecordedJafungIds(ids);
    } catch {
      setRecordedJafungIds([]);
    }
  };

  const handleOpenModal = async () => {
    setShowModal(true);
    setSelectedFile(null);
    if (!canAccess) {
      setIsCheckingPegawai(true);
      try {
        const resMe = await simpegService.getPegawaiMe();
        if (resMe.data) {
          const me = resMe.data;
          setSelectedPegawai(me);
          reset({
            pegawai_id: String(me.id),
            jafung_tujuan_id: '',
            nomor_sk: '',
            tanggal_mulai_berlaku: '',
          });
          await fetchRecordedJafungIds(me.id);
        }
      } catch (err) {
        console.error('Gagal mengambil data dosen', err);
      } finally {
        setIsCheckingPegawai(false);
      }
    } else {
      if (!selectedPegawai) {
        setRecordedJafungIds([]);
        reset({
          pegawai_id: '',
          jafung_tujuan_id: '',
          nomor_sk: '',
          tanggal_mulai_berlaku: '',
        });
      } else {
        await fetchRecordedJafungIds(selectedPegawai.id);
      }
    }
  };

  const handleSelectDosen = (opt: any) => {
    setSelectedPegawaiOption(opt);
    if (!opt) {
      setSelectedPegawai(null);
      setRecordedJafungIds([]);
      setValue('pegawai_id', '', { shouldValidate: true });
      setValue('jafung_tujuan_id', '');
      return;
    }

    const peg = opt.pegawai;
    setSelectedPegawai(peg);
    setValue('pegawai_id', String(peg.id), { shouldValidate: true });
    setValue('jafung_tujuan_id', '');
    fetchRecordedJafungIds(peg.id);
  };

  const onSubmit = async (values: JadUploadFormValues) => {
    if (!canCreate) {
      toast.error('Akses Ditolak: Anda tidak memiliki hak akses mencatat data JAD.');
      return;
    }

    if (recordedJafungIds.includes(Number(values.jafung_tujuan_id))) {
      toast.error('Jabatan Akademik ini sudah pernah tercatat untuk dosen yang bersangkutan.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('pegawai_id', values.pegawai_id);
      formData.append('jafung_tujuan_id', values.jafung_tujuan_id);
      formData.append('nomor_sk', values.nomor_sk);
      formData.append('tanggal_mulai_berlaku', values.tanggal_mulai_berlaku);
      if (selectedFile) {
        formData.append('file_sk_hasil', selectedFile);
      }

      await simpegService.createUsulanJafung(formData);
      toast.success('Data penetapan JAD dan SK berhasil disimpan!');
      setShowModal(false);
      setSelectedFile(null);
      loadData();
    } catch (err: any) {
      const errMsg = err?.response?.data?.errors?.jafung_tujuan_id?.[0]
        || err?.response?.data?.message
        || 'Gagal menyimpan data JAD';
      toast.error(errMsg);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await simpegService.deleteUsulanJafung(deleteTarget.id);
      toast.success('Data penetapan JAD berhasil dihapus');
      setDeleteTarget(null);
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus data penetapan JAD');
    } finally {
      setIsDeleting(false);
    }
  };

  // Hanya 6 kolom sesuai instruksi:
  // 1. nama dosen
  // 2. Jabatan Akademik nya apa
  // 3. no sk nya berapa
  // 4. tanggal mulai berlaku atau tmt nya kapan
  // 5. berkas sk
  // 6. aksi
  const columns: ColumnDef<UsulanJafung>[] = [
    {
      key: 'nama_dosen',
      label: 'Nama Dosen',
      render: (u) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-900 text-xs">
            {u.pegawai?.nama_lengkap || `Dosen ID ${u.pegawai_id}`}
          </span>
          <span className="text-2xs text-slate-500">
            NIP: {u.pegawai?.nip || '-'} • {u.pegawai?.unit_kerja?.nama || 'Dosen'}
          </span>
        </div>
      ),
    },
    {
      key: 'jabatan_akademik',
      label: 'Jabatan Akademik',
      render: (u) => (
        <Badge
          style={{
            backgroundColor: 'var(--module-primary-subtle)',
            color: 'var(--module-primary)',
            borderColor: 'var(--module-primary)',
          }}
          className="font-bold text-2xs inline-block w-fit"
        >
          {u.jafung_tujuan?.nama || `JAD ID ${u.jafung_tujuan_id}`}
        </Badge>
      ),
    },
    {
      key: 'no_sk',
      label: 'No. SK',
      render: (u) => (
        <span className="text-xs font-medium text-slate-800">
          {u.nomor_sk || u.catatan_reviewer || '-'}
        </span>
      ),
    },
    {
      key: 'tmt_berlaku',
      label: 'Tanggal Mulai Berlaku / TMT',
      render: (u) => {
        if (!u.tanggal_mulai_berlaku) {
          return <span className="text-2xs text-slate-400">-</span>;
        }
        const d = new Date(u.tanggal_mulai_berlaku);
        const formatted = isNaN(d.getTime())
          ? u.tanggal_mulai_berlaku
          : d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
        return <span className="text-xs text-slate-700">{formatted}</span>;
      },
    },
    {
      key: 'berkas_sk',
      label: 'Berkas SK',
      render: (u) => {
        const fileUrl = u.file_sk_hasil_url || (u.file_sk_hasil ? `/api/files/view?path=${encodeURIComponent(u.file_sk_hasil)}` : null);
        if (!fileUrl) {
          return <span className="text-2xs text-slate-400 italic">Tidak ada berkas</span>;
        }
        return (
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 text-2xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            <FileText size={12} />
            <span>Lihat SK</span>
          </a>
        );
      },
    },
    {
      key: 'aksi',
      label: 'Aksi',
      align: 'right',
      render: (u) => {
        const fileUrl = u.file_sk_hasil_url || (u.file_sk_hasil ? `/api/files/view?path=${encodeURIComponent(u.file_sk_hasil)}` : null);
        const menuItems = [];

        if (fileUrl) {
          menuItems.push({
            label: 'Lihat Berkas SK',
            icon: <ExternalLink size={14} />,
            onClick: () => {
              window.open(fileUrl, '_blank');
            },
          });
        }

        if (canDelete) {
          menuItems.push({
            label: 'Hapus Data',
            icon: <Trash2 size={14} />,
            variant: 'danger' as const,
            onClick: () => setDeleteTarget(u),
          });
        }

        if (menuItems.length === 0) {
          return <span className="text-2xs text-slate-400">-</span>;
        }

        return <DropdownMenu items={menuItems} align="right" />;
      },
    },
  ];

  if (!canRead) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader
          title="Data Jabatan Akademik Dosen (JAD & SK)"
          description="Pencatatan & Unggah Berkas SK Penetapan Jabatan Fungsional Akademik Dosen"
        />
        <Card>
          <EmptyState
            icon={<ShieldAlert size={48} className="text-[var(--danger)]" />}
            title="Akses Ditolak / Dibatasi"
            description="Peran Anda saat ini tidak memiliki hak akses untuk melihat data Jabatan Akademik Dosen."
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Data Jabatan Akademik Dosen (JAD & SK)"
        description="Pencatatan & Unggah Berkas SK Penetapan Jabatan Fungsional Akademik Dosen"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setShowFilter(true)}
            >
              Filter
            </Button>
            {canCreate && (
              <Button
                icon={<Plus size={16} />}
                onClick={handleOpenModal}
                style={{ backgroundColor: 'var(--module-primary)' }}
              >
                Unggah SK JAD
              </Button>
            )}
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={jadList}
        isLoading={loading}
        meta={meta}
        onPageChange={(newPage) => setPage(newPage)}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
        emptyMessage="Belum ada data penetapan Jabatan Akademik Dosen (JAD) yang dicatat."
      />

      {/* Drawer Filter */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Data JAD Dosen"
      >
        <div className="space-y-4">
          <Input
            label="Cari Dosen / No. SK"
            placeholder="Ketik nama, NIP, atau nomor SK..."
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
                { value: 'created_at', label: 'Tanggal Input' },
                { value: 'tanggal_mulai_berlaku', label: 'Tanggal Mulai Berlaku (TMT)' },
                { value: 'nomor_sk', label: 'Nomor SK' },
                { value: 'id', label: 'ID' },
              ]}
            />
            <Select
              label="Arah Urutan"
              value={filterOrderDir}
              onChange={(val) => setFilterOrderDir(val as 'asc' | 'desc')}
              options={[
                { value: 'desc', label: 'Terbaru ke Terlama' },
                { value: 'asc', label: 'Terlama ke Terbaru' },
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
              style={{ backgroundColor: 'var(--module-primary)' }}
            >
              Terapkan
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Modal Unggah SK Penetapan JAD */}
      {canCreate && (
        <Modal
          open={showModal}
          onClose={() => setShowModal(false)}
          title="Unggah SK Penetapan Jabatan Akademik (JAD)"
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
                disabled={!selectedPegawai || isCheckingPegawai || isSubmitting}
                style={{ backgroundColor: 'var(--module-primary)' }}
              >
                Simpan Data JAD
              </Button>
            </>
          }
        >
          {/* Form input HANYA: Dosen, Jabatan Akademik, Nomor SK, TMT, Berkas SK */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {canAccess ? (
              <AsyncSelect
                label="Pilih Dosen"
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
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex flex-col gap-1">
                  <span className="text-slate-400 font-medium block">Dosen Terkait:</span>
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
              <div className="p-3 text-xs text-slate-500 bg-slate-50 rounded-xl text-center animate-pulse">
                Memeriksa data kepegawaian dosen...
              </div>
            )}

            <Controller
              name="jafung_tujuan_id"
              control={control}
              render={({ field }) => (
                <Select
                  label="Jabatan Akademik (JAD)"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.jafung_tujuan_id?.message}
                  options={[
                    { value: '', label: '-- Pilih Jabatan Akademik --' },
                    ...jafungList.map((jf) => {
                      const isRecorded = recordedJafungIds.includes(jf.id);
                      return {
                        value: String(jf.id),
                        label: isRecorded ? `${jf.nama} (Sudah Tercatat)` : jf.nama,
                        isDisabled: isRecorded,
                      };
                    }),
                  ]}
                  required
                  disabled={!selectedPegawai || isCheckingPegawai}
                />
              )}
            />

            <Input
              label="Nomor SK"
              placeholder="Contoh: SK LLDIKTI No. 123/LL6/AK/2026"
              required
              disabled={!selectedPegawai || isCheckingPegawai}
              error={errors.nomor_sk?.message}
              {...register('nomor_sk')}
            />

            <Input
              type="date"
              label="Tanggal Mulai Berlaku (TMT)"
              required
              disabled={!selectedPegawai || isCheckingPegawai}
              error={errors.tanggal_mulai_berlaku?.message}
              {...register('tanggal_mulai_berlaku')}
            />

            <Input
              type="file"
              label="Berkas SK"
              accept=".pdf,.jpg,.jpeg,.png"
              hint="Format: PDF, JPG, atau PNG. Maksimal 10MB."
              prefixIcon={<UploadCloud size={16} />}
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setSelectedFile(file);
              }}
              disabled={!selectedPegawai || isCheckingPegawai}
            />
          </form>
        </Modal>
      )}

      {/* Modal Konfirmasi Hapus UI */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Data Penetapan JAD"
        message={
          deleteTarget ? (
            <span>
              Apakah Anda yakin ingin menghapus data penetapan JAD{' '}
              <strong>{deleteTarget.jafung_tujuan?.nama || `ID ${deleteTarget.jafung_tujuan_id}`}</strong> untuk dosen{' '}
              <strong>{deleteTarget.pegawai?.nama_lengkap || `ID ${deleteTarget.pegawai_id}`}</strong>?
            </span>
          ) : (
            'Apakah Anda yakin ingin menghapus data penetapan JAD ini?'
          )
        }
        confirmText="Ya, Hapus Data"
        cancelText="Batal"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
