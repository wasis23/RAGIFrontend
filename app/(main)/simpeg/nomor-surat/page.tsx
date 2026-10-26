'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Upload, 
  Download, 
  Eye, 
  CheckCircle, 
  Clock, 
  Filter, 
  Plus, 
  HelpCircle 
} from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';

import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { simpegService } from '@/services/simpeg.service';
import { arsipService } from '@/services/arsip.service';
import { useAuth } from '@/hooks/useAuth';
import { getApiErrorMessage } from '@/lib/utils';
import type { PaginationMeta } from '@/types/api.types';
import type { NomorSurat } from '@/types/arsip.types';

const uploadScanSchema = z.object({
  file: z
    .any()
    .refine((f) => f instanceof File, {
      message: 'Silakan pilih berkas scan surat terlebih dahulu.',
    })
    .refine((f) => !f || (f instanceof File && f.size <= 10 * 1024 * 1024), {
      message: 'Ukuran berkas maksimal 10 MB.',
    }),
});

type UploadScanFormData = {
  file: any;
};

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Semua Status Berkas' },
  { value: '1', label: 'Sudah Ada Surat (Scan Lengkap)' },
  { value: '0', label: 'Belum Ada Surat (Menunggu Scan)' },
];

const STATUS_PERMOHONAN_OPTIONS = [
  { value: '', label: 'Semua Status Permohonan' },
  { value: 'menunggu_verifikasi', label: 'Menunggu' },
  { value: 'disetujui', label: 'Disetujui' },
  { value: 'ditolak', label: 'Ditolak' },
];

export default function SimpegNomorSuratPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canRequest = 
    hasPermission('simpeg.nomor_surat.create') || 
    hasPermission('simpeg.nomor_surat.request') ||
    hasPermission('arsip.request.create');
  const canUpload = 
    hasPermission('simpeg.nomor_surat.upload') || 
    hasPermission('simpeg.nomor_surat.update') ||
    hasPermission('arsip.nomor_surat.update') || 
    hasPermission('simpeg.pegawai.manage');

  // State Tabel Daftar Surat Pegawai
  const [data, setData] = useState<NomorSurat[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);

  // Filter Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterUnit, setFilterUnit] = useState('');
  const [filterKlasifikasi, setFilterKlasifikasi] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterHasFile, setFilterHasFile] = useState('');
  const [sortBy, setSortBy] = useState('nomor_surat');
  const [sortDir, setSortDir] = useState('desc');

  // Modal Upload Scan State & Form Hook
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<NomorSurat | null>(null);
  const [uploading, setUploading] = useState(false);

  const {
    handleSubmit: handleUploadSubmit,
    control: uploadControl,
    reset: resetUploadForm,
  } = useForm<UploadScanFormData>({
    resolver: zodResolver(uploadScanSchema),
    defaultValues: {
      file: null,
    },
  });

  const fetchMyLetters = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {
        page,
        per_page: limit,
      };
      if (search) params.search = search;
      if (filterUnit) params.kode_unit = filterUnit;
      if (filterKlasifikasi) params.kode_klasifikasi = filterKlasifikasi;
      if (filterStatus) params.status = filterStatus;
      if (filterHasFile !== '') params.has_file = filterHasFile;
      if (sortBy) params.sort_by = sortBy;
      if (sortDir) params.sort_dir = sortDir;

      const res = await simpegService.getMyNomorSuratList(params);
      const rawData: any = res.data;
      const items: NomorSurat[] = Array.isArray(rawData) ? rawData : (rawData?.items || []);
      const paginationMeta: PaginationMeta | undefined = (res as any).meta || rawData?.meta;
      setData(items);
      setMeta(paginationMeta);
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Gagal memuat nomor surat saya.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyLetters();
  }, [page, limit, filterHasFile, filterStatus]);

  const handleApplyFilter = () => {
    setPage(1);
    setDrawerOpen(false);
    fetchMyLetters();
  };

  const handleResetFilter = () => {
    setSearch('');
    setFilterUnit('');
    setFilterKlasifikasi('');
    setFilterStatus('');
    setFilterHasFile('');
    setSortBy('nomor_surat');
    setSortDir('desc');
    setPage(1);
    setDrawerOpen(false);
    setTimeout(() => {
      fetchMyLetters();
    }, 50);
  };

  const handleOpenUploadModal = (row: NomorSurat) => {
    setSelectedLetter(row);
    resetUploadForm({ file: null });
    setUploadModalOpen(true);
  };

  const onConfirmUploadScan = async (formData: UploadScanFormData) => {
    if (!selectedLetter || !formData.file) return;

    try {
      setUploading(true);
      await simpegService.uploadScanNomorSurat(selectedLetter.id, formData.file);
      toast.success(`Berkas scan surat ${selectedLetter.nomor_surat} berhasil diunggah!`);
      setUploadModalOpen(false);
      resetUploadForm({ file: null });
      fetchMyLetters();
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Gagal mengunggah berkas scan surat.'));
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadScan = async (row: NomorSurat) => {
    try {
      const res = await simpegService.downloadScanNomorSurat(row.id);
      if (res.url) {
        window.open(res.url, '_blank');
        toast.success('Membuka tautan berkas scan surat.');
        return;
      }
      if (res.blob) {
        const url = window.URL.createObjectURL(res.blob);
        const a = document.createElement('a');
        a.href = url;
        const safeName = row.nomor_surat.replace(/[\/\\]/g, '_');
        a.download = `Scan_Surat_${safeName}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Berkas scan berhasil diunduh.');
      }
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Gagal mengunduh berkas scan.'));
    }
  };

  // Columns definition sesuai standar Admin CRUD SIMPEG (max 12px, soft contrast, 2-line format)
  const columns: ColumnDef<NomorSurat>[] = [
    {
      key: 'no',
      label: 'NO',
      align: 'center',
      render: (_row: NomorSurat, idx: number) => (
        <span className="text-xs font-semibold text-slate-500">
          {(page - 1) * limit + idx + 1}
        </span>
      ),
    },
    {
      key: 'nomor_surat',
      label: 'NOMOR SURAT RESMI',
      render: (row: NomorSurat) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono font-bold text-xs text-slate-900">{row.nomor_surat}</span>
            {row.is_backdate && (
              <Badge variant="amber" className="text-2xs font-bold uppercase">
                Backdate
              </Badge>
            )}
          </div>
          <span className="text-2xs text-slate-400 font-mono">
            Urut: #{row.nomor_urut} • Tgl: {row.tanggal_surat}
          </span>
        </div>
      ),
    },
    {
      key: 'perihal',
      label: 'PERIHAL & TUJUAN',
      render: (row: NomorSurat) => (
        <div className="flex flex-col max-w-sm">
          <span className="text-xs font-semibold text-slate-800 line-clamp-1">{row.perihal}</span>
          <span className="text-2xs text-slate-400 truncate">
            Kepada: {row.tujuan || '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'klasifikasi',
      label: 'UNIT / KLASIFIKASI',
      render: (row: NomorSurat) => (
        <div className="flex flex-col">
          <span className="text-xs font-medium text-slate-700">Unit: {row.kode_unit}</span>
          <span className="text-2xs text-slate-400">Klasifikasi: {row.kode_klasifikasi}</span>
        </div>
      ),
    },
    {
      key: 'status_pengajuan',
      label: 'STATUS NOMOR SURAT',
      align: 'center',
      render: (row: NomorSurat) => {
        const rawStatus = (row.status_pengajuan || row.request?.status || (row.status === 'dibatalkan' ? 'ditolak' : 'disetujui')).toLowerCase();
        if (rawStatus === 'menunggu_verifikasi' || rawStatus === 'menunggu') {
          return (
            <Badge variant="warning" className="text-2xs font-semibold">
              Menunggu
            </Badge>
          );
        }
        if (rawStatus === 'disetujui' || rawStatus === 'terpakai') {
          return (
            <Badge variant="success" className="text-2xs font-semibold">
              Disetujui
            </Badge>
          );
        }
        if (rawStatus === 'ditolak' || rawStatus === 'dibatalkan') {
          return (
            <Badge variant="danger" className="text-2xs font-semibold">
              Ditolak
            </Badge>
          );
        }
        return (
          <Badge variant="info" className="text-2xs font-semibold">
            {row.status_pengajuan || row.status}
          </Badge>
        );
      },
    },
    {
      key: 'status_berkas',
      label: 'STATUS BERKAS SCAN',
      align: 'center',
      render: (row: NomorSurat) => {
        if (row.is_request_only || !row.id) {
          return (
            <span className="text-2xs text-slate-400 italic">
              Menunggu Penerbitan
            </span>
          );
        }
        if (row.has_file || row.file_surat_path) {
          return (
            <div className="flex flex-col items-center gap-1">
              <Badge variant="success" className="text-2xs font-semibold flex items-center gap-1">
                <CheckCircle size={11} />
                Sudah Ada Surat
              </Badge>
              {row.file_surat_url && (
                <a
                  href={row.file_surat_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-2xs text-[var(--module-primary)] hover:underline inline-flex items-center gap-0.5 font-medium"
                >
                  <Eye size={10} />
                  Lihat Berkas
                </a>
              )}
            </div>
          );
        }
        return (
          <div className="flex flex-col items-center gap-1">
            <Badge variant="warning" className="text-2xs font-semibold flex items-center gap-1">
              <Clock size={11} />
              Belum Ada Surat
            </Badge>
            <span className="text-2xs text-amber-600 font-medium">
              Wajib Unggah Scan
            </span>
          </div>
        );
      },
    },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'center',
      render: (row: NomorSurat) => {
        const canUploadThis = canUpload && !row.is_request_only && !!row.id;
        const canDownloadThis = !row.is_request_only && !!row.id && (row.has_file || row.file_surat_path);

        const menuItems = [
          ...(canUploadThis
            ? [
                {
                  label: row.has_file || row.file_surat_path ? 'Ganti Berkas Scan' : 'Unggah Berkas Scan',
                  icon: <Upload size={14} className="text-[var(--module-primary)]" />,
                  onClick: () => handleOpenUploadModal(row),
                },
              ]
            : []),
          ...(canDownloadThis
            ? [
                {
                  label: 'Unduh Berkas Surat',
                  icon: <Download size={14} className="text-emerald-600" />,
                  onClick: () => handleDownloadScan(row),
                },
              ]
            : []),
        ];

        return (
          <div className="flex justify-center">
            <DropdownMenu
              items={
                menuItems.length > 0
                  ? menuItems
                  : [
                      {
                        label: row.is_request_only ? 'Menunggu Verifikasi ARSIP' : 'Tidak Ada Aksi',
                        disabled: true,
                        onClick: () => {},
                      },
                    ]
              }
            />
          </div>
        );
      },
    },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Penomoran Surat Pegawai"
        description="Layanan penerbitan nomor surat resmi kampus dan unggah scan dokumen surat penugasan / kedinasan"
        action={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              icon={<Filter size={16} />}
              onClick={() => setDrawerOpen(true)}
              className="border-[var(--module-primary)] text-[var(--module-primary)] hover:bg-[var(--module-primary-subtle,#f0fdfa)]"
            >
              Filter
            </Button>
            {canRequest && (
              <Button
                type="button"
                variant="primary"
                size="md"
                icon={<Plus size={16} />}
                className="bg-[var(--module-primary)] hover:opacity-90 text-white shadow-sm"
                onClick={() => router.push('/simpeg/nomor-surat/create')}
              >
                Ajukan Nomor Surat
              </Button>
            )}
          </div>
        }
      />

      <div className="space-y-4">
        <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2">
          <HelpCircle size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-blue-950">
              Kewajiban Pengarsipan Surat Resmi
            </p>
            <p className="text-2xs text-blue-800">
              Nomor surat resmi yang telah diterbitkan oleh Admin ARSIP atas nama Anda wajib dilengkapi dengan unggahan scan berkas fisik (PDF) yang telah ditandatangani dan dicap resmi.
            </p>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={data}
          isLoading={loading}
          meta={meta}
          onPageChange={(p) => setPage(p)}
          onLimitChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
          emptyMessage="Belum ada nomor surat yang diterbitkan atas nama Anda."
        />
      </div>

      {/* Filter Drawer Slide Right-to-Left */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Filter Nomor Surat Saya"
      >
        <div className="flex flex-col gap-4 p-4">
          <Input
            label="Pencarian Bebas"
            placeholder="Cari nomor, perihal, tujuan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <AsyncSelect
            label="Kode Unit Pengolah"
            placeholder="Pilih unit pengolah..."
            loadOptions={async (query) => {
              const units = await arsipService.getAllKlasifikasi('unit');
              const filtered = (units || []).filter(
                (u) =>
                  u.nama.toLowerCase().includes(query.toLowerCase()) ||
                  u.kode.toLowerCase().includes(query.toLowerCase())
              );
              return filtered.map((u) => ({
                value: u.kode,
                label: `${u.kode} - ${u.nama}`,
              }));
            }}
            value={filterUnit}
            onChange={(opt: any) => setFilterUnit(opt?.value || '')}
            isClearable
          />

          <AsyncSelect
            label="Kode Klasifikasi Surat"
            placeholder="Pilih klasifikasi surat..."
            loadOptions={async (query) => {
              const klasifikasis = await arsipService.getAllKlasifikasi('klasifikasi');
              const filtered = (klasifikasis || []).filter(
                (k) =>
                  k.nama.toLowerCase().includes(query.toLowerCase()) ||
                  k.kode.toLowerCase().includes(query.toLowerCase())
              );
              return filtered.map((k) => ({
                value: k.kode,
                label: `${k.kode} - ${k.nama}`,
              }));
            }}
            value={filterKlasifikasi}
            onChange={(opt: any) => setFilterKlasifikasi(opt?.value || '')}
            isClearable
          />

          <Select
            label="Status Nomor Surat"
            value={filterStatus}
            onChange={(val) => setFilterStatus(val || '')}
            options={STATUS_PERMOHONAN_OPTIONS}
          />

          <Select
            label="Status Berkas Scan"
            value={filterHasFile}
            onChange={(val) => setFilterHasFile(val || '')}
            options={STATUS_FILTER_OPTIONS}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Urutkan Berdasarkan"
              value={sortBy}
              onChange={(val) => setSortBy(val || 'nomor_surat')}
              options={[
                { value: 'nomor_surat', label: 'Nomor Surat' },
                { value: 'tanggal_surat', label: 'Tanggal Surat' },
                { value: 'created_at', label: 'Waktu Terbit' },
                { value: 'perihal', label: 'Perihal Surat' },
              ]}
            />
            <Select
              label="Arah Urutan"
              value={sortDir}
              onChange={(val) => setSortDir(val || 'desc')}
              options={[
                { value: 'desc', label: 'Z-A / Terbaru' },
                { value: 'asc', label: 'A-Z / Terlama' },
              ]}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 mt-2">
            <Button variant="outline" size="md" onClick={handleResetFilter}>
              Reset
            </Button>
            <Button
              variant="primary"
              size="md"
              className="bg-[var(--module-primary)] hover:opacity-90 text-white"
              onClick={handleApplyFilter}
            >
              Terapkan
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Modal: Unggah Berkas Scan Dokumen Oleh Pegawai */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Unggah Scan Dokumen Surat Resmi"
        size="md"
      >
        <div className="flex flex-col gap-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-2xs uppercase tracking-wider text-slate-400 font-semibold block">
              Nomor Surat Terkait
            </span>
            <p className="font-mono text-xs font-bold text-slate-900 mt-0.5">
              {selectedLetter?.nomor_surat}
            </p>
            <p className="text-2xs text-slate-500 mt-0.5">
              Perihal: {selectedLetter?.perihal}
            </p>
          </div>

          <form onSubmit={handleUploadSubmit(onConfirmUploadScan)} className="flex flex-col gap-4">
            <Controller
              name="file"
              control={uploadControl}
              render={({ field, fieldState: { error } }) => (
                <div>
                  <Input
                    type="file"
                    label="Pilih Berkas Scan Dokumen (PDF/JPG/PNG) *"
                    accept=".pdf,.jpg,.jpeg,.png"
                    error={error?.message}
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      field.onChange(file);
                    }}
                    className="text-xs text-slate-600 cursor-pointer"
                  />
                  {field.value && (
                    <p className="text-2xs text-emerald-600 mt-1 font-medium">
                      ✓ Berkas dipilih: {field.value.name} ({(field.value.size / 1024).toFixed(0)} KB)
                    </p>
                  )}
                </div>
              )}
            />
            <p className="text-2xs text-slate-400">
              Format: PDF atau Gambar. Maks. 10 MB. Berkas akan tersimpan di repositori persuratan kampus dan dapat diakses oleh Admin ARSIP.
            </p>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 mt-2">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setUploadModalOpen(false)}
                disabled={uploading}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                icon={<Upload size={14} />}
                className="bg-[var(--module-primary)] hover:opacity-90 text-white"
                isLoading={uploading}
              >
                Simpan & Unggah Scan
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
