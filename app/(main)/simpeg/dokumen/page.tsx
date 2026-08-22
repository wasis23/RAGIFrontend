'use client';

import { useEffect, useState, useCallback } from 'react';
import { FileText, Upload, Trash2, Eye, ShieldCheck, Filter, ShieldAlert, Download, ExternalLink } from 'lucide-react';
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Preview Watermark State
  const [showModalPreview, setShowModalPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);

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

  // Async loader for Pegawai AsyncSelect: Pulls ALL pegawai in database with high per_page
  const loadPegawaiOptions = useCallback(async (inputValue: string) => {
    try {
      const res: any = await simpegService.getPegawaiList({ per_page: 500 });
      const responseData = res?.data || res;
      const list: Pegawai[] = Array.isArray(responseData)
        ? responseData
        : responseData?.items || responseData?.data || [];
      
      const filtered = inputValue
        ? list.filter(
            (p: Pegawai) =>
              p.nama_lengkap.toLowerCase().includes(inputValue.toLowerCase()) ||
              (p.nip && p.nip.toLowerCase().includes(inputValue.toLowerCase()))
          )
        : list;

      return filtered.map((p: Pegawai) => ({
        value: p.id.toString(),
        label: `[NIP: ${p.nip || '-'}] ${p.nama_lengkap} (${p.unit_kerja?.nama || 'Tanpa Unit'})`,
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
    setSelectedFile(null);
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

    if (!selectedFile) {
      toast.error('Silakan pilih file berkas dokumen yang akan diunggah.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('pegawai_id', values.pegawai_id);
      formData.append('nama_dokumen', values.nama_dokumen);
      formData.append('jenis_dokumen', values.jenis_dokumen);
      formData.append('file', selectedFile);

      await simpegService.createDokumen(formData);
      toast.success('Dokumen E-File fisik berhasil diunggah & tersimpan aman di server!');
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
      toast.error(err?.response?.data?.message || 'Akses Ditolak: Dokumen ini rahasia dan hanya dapat dibuka oleh Admin SIMPEG, Superadmin, atau pemilik dokumen.');
    }
  };

  const handleDownloadOriginalFile = async (id: number, namaDokumen: string) => {
    setIsDownloading(true);
    try {
      const blob = await simpegService.downloadDokumenFile(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${namaDokumen}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('File dokumen fisik berhasil diunduh.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal mengunduh file dokumen atau Akses Ditolak.');
    } finally {
      setIsDownloading(false);
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
      toast.success('Dokumen beserta file fisiknya berhasil dihapus dari server!');
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
      render: (row) => <span className="text-slate-500 font-mono text-xs">{row.file_size || '0 MB'}</span>,
    },
    {
      key: 'proteksi',
      label: 'Proteksi Keamanan',
      render: () => (
        <Badge variant="indigo">
          <ShieldCheck size={12} className="mr-1 inline-block" /> Encrypted & Restricted
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
          {
            label: 'Unduh Berkas Fisik',
            icon: <Download size={14} />,
            onClick: () => handleDownloadOriginalFile(row.id, row.nama_dokumen),
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
        description="Arsip Surat Keputusan (SK), Ijazah, Transkrip, KTP, KK, dan Sertifikat Kepegawaian (Restricted Access)"
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
            <p>Belum ada dokumen digital yang tersimpan di server.</p>
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
                  placeholder="Ketik untuk mencari dari seluruh pegawai..."
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

            {/* File Upload Input Field */}
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-700">
                Pilih Berkas Dokumen Fisik (PDF, JPG, PNG) <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                required
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 border border-slate-300 rounded-xl cursor-pointer p-1.5 transition-all"
              />
              {selectedFile ? (
                <p className="text-xs text-emerald-600 font-medium">
                  File Terpilih: <strong>{selectedFile.name}</strong> ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
              ) : (
                <p className="text-xs text-slate-400">File akan disimpan aman di direktori storage server (Max 10MB)</p>
              )}
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Watermark Secure View */}
      <Modal
        open={showModalPreview}
        onClose={() => setShowModalPreview(false)}
        title="Dynamic Watermark Secure Preview"
        footer={
          <div className="flex justify-between w-full">
            {previewData?.dokumen_id && (
              <Button
                variant="outline"
                loading={isDownloading}
                disabled={isDownloading}
                icon={<Download size={16} />}
                onClick={() => handleDownloadOriginalFile(previewData.dokumen_id, previewData.nama_dokumen)}
              >
                Unduh Berkas Fisik
              </Button>
            )}
            <Button variant="secondary" onClick={() => setShowModalPreview(false)}>
              Tutup Viewer
            </Button>
          </div>
        }
      >
        {previewData && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="font-bold text-slate-900 mb-1">{previewData.nama_dokumen}</div>
              <div className="text-xs text-slate-500">Status Keamanan: {previewData.security_status}</div>
            </div>
            
            <div className="relative border border-slate-200 rounded-lg p-6 bg-slate-100 flex flex-col items-center justify-center text-center overflow-hidden min-h-[220px]">
              <FileText size={48} className="opacity-40 mb-2 text-slate-600" />
              <p className="text-sm font-semibold text-slate-700">Pratinjau Terproteksi & Terenkripsi</p>
              <p className="text-xs text-slate-500 max-w-xs mt-1">Dokumen ini hanya diizinkan untuk dibuka oleh Admin SIMPEG, Superadmin, atau Pegawai Pemilik Dokumen.</p>
              
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 rotate-[-25deg] text-base font-extrabold text-slate-900 tracking-widest uppercase select-none">
                {previewData.watermark_overlay || 'CONFIDENTIAL — RESTRICTED ACCESS'}
              </div>
            </div>

            {previewData.file_url && (
              <div className="pt-2 text-center">
                <a
                  href={previewData.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary-600 hover:underline font-semibold"
                >
                  <ExternalLink size={14} /> Buka Berkas Langsung dari Storage Server
                </a>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
