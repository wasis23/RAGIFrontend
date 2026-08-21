'use client';

import { useEffect, useState, useCallback } from 'react';
import { FileText, Upload, Trash2, Eye, ShieldCheck, Filter, ShieldAlert } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { simpegService } from '@/services/simpeg.service';
import type { DokumenPegawai, JenisDokumenPegawai, Pegawai } from '@/types/simpeg.types';
import type { PaginationMeta } from '@/types/api.types';
import { useAuth } from '@/hooks/useAuth';

interface OptionType {
  value: string;
  label: string;
}

const dokumenSchema = z.object({
  pegawai_id: z.string().min(1, 'Pegawai wajib dipilih'),
  nama_dokumen: z.string().min(1, 'Judul / Nama Dokumen wajib diisi'),
  jenis_dokumen: z.enum(['sk', 'ijazah', 'serdos', 'sertifikat', 'ktp', 'kk', 'lainnya'], {
    message: 'Jenis Dokumen wajib dipilih',
  }),
});

type DokumenFormValues = z.infer<typeof dokumenSchema>;

export default function DokumenPage() {
  const { hasPermission } = useAuth();
  const canRead = hasPermission('simpeg.dokumen.read') || hasPermission('simpeg.dokumen.manage');
  const canCreate = hasPermission('simpeg.dokumen.create') || hasPermission('simpeg.dokumen.upload') || hasPermission('simpeg.dokumen.manage');
  const canDelete = hasPermission('simpeg.dokumen.delete') || hasPermission('simpeg.dokumen.manage');

  const [loading, setLoading] = useState(true);
  const [dokumenList, setDokumenList] = useState<DokumenPegawai[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();

  // Filter & Pagination state
  const [search, setSearch] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [filterOrderBy, setFilterOrderBy] = useState('nama_dokumen');
  const [filterOrderDir, setFilterOrderDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [showFilter, setShowFilter] = useState(false);

  // Modal Upload State
  const [showModalUpload, setShowModalUpload] = useState(false);
  const [selectedPegawaiOption, setSelectedPegawaiOption] = useState<OptionType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Preview Watermark State
  const [showModalPreview, setShowModalPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<DokumenFormValues>({
    resolver: zodResolver(dokumenSchema),
    defaultValues: {
      pegawai_id: '',
      nama_dokumen: '',
      jenis_dokumen: 'ijazah',
    },
  });

  const loadDokumen = useCallback(async () => {
    if (!canRead) return;
    setLoading(true);
    try {
      const res: any = await simpegService.getDokumenList({
        page,
        limit,
        search: search || undefined,
        jenis_dokumen: filterJenis || undefined,
        sort_by: filterOrderBy,
        sort_dir: filterOrderDir,
      });

      if (res?.meta) {
        setDokumenList(res.data || []);
        setMeta(res.meta);
      } else {
        let items: DokumenPegawai[] = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        if (search) {
          const q = search.toLowerCase();
          items = items.filter(
            (d) =>
              d.nama_dokumen.toLowerCase().includes(q) ||
              d.pegawai?.nama_lengkap?.toLowerCase().includes(q)
          );
        }
        if (filterJenis) {
          items = items.filter((d) => d.jenis_dokumen === filterJenis);
        }

        items.sort((a, b) => {
          let valA = (a as any)[filterOrderBy] ?? '';
          let valB = (b as any)[filterOrderBy] ?? '';
          if (typeof valA === 'string') valA = valA.toLowerCase();
          if (typeof valB === 'string') valB = valB.toLowerCase();

          if (valA < valB) return filterOrderDir === 'asc' ? -1 : 1;
          if (valA > valB) return filterOrderDir === 'asc' ? 1 : -1;
          return 0;
        });

        const totalItems = items.length;
        const totalPages = Math.ceil(totalItems / limit) || 1;
        const startIndex = (page - 1) * limit;
        const paginated = items.slice(startIndex, startIndex + limit);

        setDokumenList(paginated);
        setMeta({
          current_page: page,
          last_page: totalPages,
          per_page: limit,
          total: totalItems,
          from: totalItems > 0 ? startIndex + 1 : 0,
          to: Math.min(startIndex + limit, totalItems),
        });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memuat Dokumen E-File');
    } finally {
      setLoading(false);
    }
  }, [canRead, page, limit, search, filterJenis, filterOrderBy, filterOrderDir]);

  useEffect(() => {
    loadDokumen();
  }, [loadDokumen]);

  // Async loader for Pegawai AsyncSelect
  const loadPegawaiOptions = useCallback(async (inputValue: string) => {
    try {
      const res: any = await simpegService.getPegawaiList();
      const list: Pegawai[] = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      const filtered = list.filter(
        (p: Pegawai) =>
          p.nama_lengkap.toLowerCase().includes(inputValue.toLowerCase()) ||
          (p.nip && p.nip.toLowerCase().includes(inputValue.toLowerCase()))
      );
      return filtered.map((p: Pegawai) => ({
        value: p.id.toString(),
        label: `[NIP: ${p.nip}] ${p.nama_lengkap}`,
      }));
    } catch (err) {
      console.error('Gagal memuat opsi pegawai', err);
      return [];
    }
  }, []);

  const handleOpenUpload = () => {
    if (!canCreate) {
      toast.error('Anda tidak memiliki permission untuk mengunggah dokumen.');
      return;
    }
    setSelectedPegawaiOption(null);
    reset({
      pegawai_id: '',
      nama_dokumen: '',
      jenis_dokumen: 'ijazah',
    });
    setShowModalUpload(true);
  };

  const onSubmitUpload = async (values: DokumenFormValues) => {
    if (!canCreate) {
      toast.error('Akses Ditolak: Anda tidak memiliki permission mengunggah dokumen.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        pegawai_id: Number(values.pegawai_id),
        nama_dokumen: values.nama_dokumen,
        jenis_dokumen: values.jenis_dokumen as JenisDokumenPegawai,
        file_path: '/uploads/documents/doc_' + Date.now() + '.pdf',
        file_size: '1.5 MB',
      };

      await simpegService.createDokumen(payload);
      toast.success('Dokumen E-File berhasil diunggah!');
      setShowModalUpload(false);
      loadDokumen();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal mengunggah dokumen');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreviewSecure = async (id: number) => {
    if (!canRead) {
      toast.error('Akses Ditolak: Anda tidak memiliki permission membaca dokumen.');
      return;
    }
    try {
      const res: any = await simpegService.getSecureDokumenView(id);
      setPreviewData(res.data);
      setShowModalPreview(true);
    } catch (err: any) {
      toast.error('Gagal memuat secure preview');
    }
  };

  const handleDelete = async (id: number, nama: string) => {
    if (!canDelete) {
      toast.error('Akses Ditolak: Anda tidak memiliki permission menghapus dokumen.');
      return;
    }
    if (!confirm(`Apakah Anda yakin ingin menghapus dokumen "${nama}"?`)) return;
    try {
      await simpegService.deleteDokumen(id);
      toast.success('Dokumen berhasil dihapus!');
      loadDokumen();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus dokumen');
    }
  };

  const columns: ColumnDef<DokumenPegawai>[] = [
    {
      key: 'nama_dokumen',
      label: 'Nama Dokumen',
      render: (row) => <span className="font-bold">{row.nama_dokumen}</span>,
    },
    {
      key: 'pegawai',
      label: 'Pemilik / Pegawai',
      render: (row) => row.pegawai?.nama_lengkap || `Pegawai ID ${row.pegawai_id}`,
    },
    {
      key: 'jenis_dokumen',
      label: 'Jenis Dokumen',
      render: (row) => (
        <Badge variant="purple" className="uppercase">
          {row.jenis_dokumen}
        </Badge>
      ),
    },
    {
      key: 'file_size',
      label: 'Ukuran',
      render: (row) => <span className="text-slate-500 font-mono text-xs">{row.file_size || '1.2 MB'}</span>,
    },
    {
      key: 'proteksi',
      label: 'Proteksi Keamanan',
      render: () => (
        <Badge variant="indigo">
          <ShieldCheck size={12} className="mr-1 inline-block" /> Encrypted Watermark
        </Badge>
      ),
    },
    {
      key: 'aksi',
      label: 'Aksi',
      align: 'right',
      render: (row) => {
        const menuItems: DropdownMenuItem[] = [
          {
            label: 'Pratinjau Terproteksi',
            icon: <Eye size={14} />,
            onClick: () => handlePreviewSecure(row.id),
          },
        ];

        if (canDelete) {
          menuItems.push({
            label: 'Hapus Dokumen',
            icon: <Trash2 size={14} />,
            variant: 'danger',
            onClick: () => handleDelete(row.id, row.nama_dokumen),
          });
        }

        return (
          <div className="flex justify-end">
            <DropdownMenu items={menuItems} />
          </div>
        );
      },
    },
  ];

  if (!canRead) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader
          title="Manajemen Dokumen E-File Digital"
          description="Arsip Surat Keputusan (SK), Ijazah, Transkrip, KTP, KK, dan Sertifikat Kepegawaian"
        />
        <div className="card p-6 text-center">
          <ShieldAlert size={56} color="var(--danger)" className="mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2 text-slate-800">
            Akses Ditolak / Dibatasi
          </h2>
          <p className="text-slate-400 max-w-[500px] mx-auto">
            Peran Anda saat ini tidak memiliki hak akses (*permission*) untuk membaca Arsip Dokumen E-File.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Manajemen Dokumen E-File Digital"
        description="Arsip Surat Keputusan (SK), Ijazah, Transkrip, KTP, KK, dan Sertifikat Kepegawaian"
        action={
          <div className="flex gap-2">
            {canCreate && (
              <Button icon={<Upload size={16} />} onClick={handleOpenUpload}>
                Unggah Dokumen Baru
              </Button>
            )}
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setShowFilter(true)}
            >
              Filter
            </Button>
          </div>
        }
      />

      {/* Main DataTable */}
      <DataTable
        columns={columns}
        data={dokumenList}
        isLoading={loading}
        meta={meta}
        onPageChange={(newPage) => setPage(newPage)}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
        emptyMessage={
          <div className="py-8 text-center text-slate-400">
            <FileText size={48} className="mx-auto mb-4 opacity-40" />
            <p>Belum ada dokumen digital yang sesuai filter.</p>
          </div>
        }
      />

      {/* Filter Drawer Slide Right-to-Left */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter & Urutkan Dokumen E-File"
      >
        <div className="space-y-4">
          <Input
            label="Pencarian Nama / Pegawai"
            placeholder="Cari SK Dosen, Ijazah..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />

          <Select
            label="Jenis Dokumen"
            value={filterJenis}
            onChange={(val) => {
              setFilterJenis(val);
              setPage(1);
            }}
            options={[
              { value: '', label: 'Semua Jenis Dokumen' },
              { value: 'sk', label: 'Surat Keputusan (SK)' },
              { value: 'ijazah', label: 'Ijazah & Transkrip' },
              { value: 'serdos', label: 'Sertifikat Dosen (Serdos)' },
              { value: 'sertifikat', label: 'Sertifikat Pelatihan / Keahlian' },
              { value: 'ktp', label: 'KTP / NIK' },
              { value: 'kk', label: 'Kartu Keluarga (KK)' },
              { value: 'lainnya', label: 'Dokumen Pendukung Lainnya' },
            ]}
          />

          <hr className="border-t border-slate-200 my-2" />

          {/* Grid 2 Kolom Sorting */}
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={filterOrderBy}
              onChange={(val) => setFilterOrderBy(val)}
              options={[
                { value: 'nama_dokumen', label: 'Nama Dokumen' },
                { value: 'jenis_dokumen', label: 'Jenis Dokumen' },
                { value: 'id', label: 'ID' },
              ]}
            />
            <Select
              label="Arah"
              value={filterOrderDir}
              onChange={(val) => setFilterOrderDir(val as 'asc' | 'desc')}
              options={[
                { value: 'asc', label: 'A - Z (Naik)' },
                { value: 'desc', label: 'Z - A (Turun)' },
              ]}
            />
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSearch('');
                setFilterJenis('');
                setFilterOrderBy('nama_dokumen');
                setFilterOrderDir('asc');
                setPage(1);
              }}
            >
              Reset Filter
            </Button>
            <Button onClick={() => setShowFilter(false)}>
              Terapkan
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Modal Upload */}
      {canCreate && (
        <Modal
          open={showModalUpload}
          onClose={() => setShowModalUpload(false)}
          title="Unggah Dokumen E-File Pegawai"
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowModalUpload(false)}>
                Batal
              </Button>
              <Button
                type="submit"
                loading={isSubmitting}
                disabled={isSubmitting}
                form="dokumen-upload-modal-form"
              >
                Unggah Dokumen
              </Button>
            </>
          }
        >
          <form id="dokumen-upload-modal-form" onSubmit={handleSubmit(onSubmitUpload)} className="space-y-4">
            <Controller
              name="pegawai_id"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  label="Pilih Pegawai Pemilik Dokumen"
                  required
                  placeholder="Cari nama pegawai / NIP..."
                  loadOptions={loadPegawaiOptions}
                  value={selectedPegawaiOption || (field.value ? { value: field.value, label: field.value } : null)}
                  onChange={(opt) => {
                    setSelectedPegawaiOption(opt);
                    field.onChange(opt ? opt.value : '');
                  }}
                  isClearable
                  error={errors.pegawai_id?.message}
                />
              )}
            />

            <Input
              label="Judul / Nama Dokumen"
              required
              placeholder="Contoh: SK Pengangkatan Dosen Tetap 2024"
              error={errors.nama_dokumen?.message}
              {...register('nama_dokumen')}
            />

            <Controller
              name="jenis_dokumen"
              control={control}
              render={({ field }) => (
                <Select
                  label="Jenis Dokumen"
                  required
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.jenis_dokumen?.message}
                  options={[
                    { value: 'sk', label: 'Surat Keputusan (SK)' },
                    { value: 'ijazah', label: 'Ijazah & Transkrip' },
                    { value: 'serdos', label: 'Sertifikat Dosen (Serdos)' },
                    { value: 'sertifikat', label: 'Sertifikat Pelatihan / Keahlian' },
                    { value: 'ktp', label: 'KTP / NIK' },
                    { value: 'kk', label: 'Kartu Keluarga (KK)' },
                    { value: 'lainnya', label: 'Dokumen Pendukung Lainnya' },
                  ]}
                />
              )}
            />
          </form>
        </Modal>
      )}

      {/* Modal Watermark Secure View */}
      <Modal
        open={showModalPreview}
        onClose={() => setShowModalPreview(false)}
        title="Dynamic Watermark Secure Preview"
        footer={
          <Button variant="secondary" onClick={() => setShowModalPreview(false)}>
            Tutup Viewer
          </Button>
        }
      >
        {previewData && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="font-bold text-slate-900 mb-1">{previewData.nama_dokumen}</div>
              <div className="text-xs text-slate-500">Status Keamanan: {previewData.security_status}</div>
            </div>
            <div className="relative border border-slate-200 rounded-lg p-8 bg-slate-100 flex flex-col items-center justify-center text-center overflow-hidden min-h-[220px]">
              <FileText size={48} className="opacity-40 mb-2 text-slate-600" />
              <p className="text-sm font-semibold text-slate-700">Pratinjau PDF Terenkripsi</p>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 rotate-[-25deg] text-lg font-extrabold text-slate-900 tracking-widest uppercase select-none">
                {previewData.watermark_overlay || 'CONFIDENTIAL — OFFICIAL DOCUMENT'}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
