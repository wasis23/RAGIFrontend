'use client';

import { useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { sinapraService, type SinapraImportResult } from '@/services/sinapra.service';

export interface SinapraImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title: string;
  entity:
    | 'gedung'
    | 'tipe-ruangan'
    | 'ruangan'
    | 'kategori-aset'
    | 'kategori-bhp'
    | 'satuan'
    | 'vendor'
    | 'aset';
  templateFilename?: string;
}

const importFileSchema = z.object({
  file: z
    .custom<File>((val) => typeof window !== 'undefined' && val instanceof File, {
      message: 'Pilih berkas Excel terlebih dahulu',
    })
    .refine(
      (file) => file && /\.(xlsx|xls|csv)$/i.test(file.name),
      'Format berkas harus berekstensi .xlsx, .xls, atau .csv'
    )
    .refine(
      (file) => file && file.size <= 10 * 1024 * 1024,
      'Ukuran berkas tidak boleh melebihi 10 MB'
    ),
});

type ImportFileFormValues = z.infer<typeof importFileSchema>;

export function SinapraImportModal({
  isOpen,
  onClose,
  onSuccess,
  title,
  entity,
  templateFilename,
}: SinapraImportModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [result, setResult] = useState<SinapraImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ImportFileFormValues>({
    resolver: zodResolver(importFileSchema),
  });

  const selectedFile = watch('file');

  const resetState = () => {
    setValue('file', undefined as unknown as File, { shouldValidate: false });
    reset();
    setIsUploading(false);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    if (result && (result.created > 0 || result.updated > 0)) {
      onSuccess?.();
    }
    resetState();
    onClose();
  };

  const handleDownloadTemplate = async () => {
    setIsDownloadingTemplate(true);
    try {
      const blob = await sinapraService.downloadTemplate(entity);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', templateFilename || `Template_Import_${entity}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Template berhasil diunduh.');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr?.response?.data?.message || 'Gagal mengunduh berkas template.');
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const onSubmit = async (values: ImportFileFormValues) => {
    if (!values.file) return;

    setIsUploading(true);
    try {
      const res = await sinapraService.importExcel(entity, values.file);
      const importData = res.data;
      if (!importData) {
        toast.error('Gagal memproses berkas import.');
        return;
      }
      setResult(importData);

      if (importData.failed === 0) {
        toast.success(`Berhasil! Dibuat: ${importData.created}, Diperbarui: ${importData.updated}`);
      } else if (importData.created > 0 || importData.updated > 0) {
        toast.success(`Selesai dengan catatan: ${importData.failed} baris gagal.`);
      } else {
        toast.error(`Import gagal: ${importData.failed} baris mengalami kesalahan.`);
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const errMsg = axiosErr?.response?.data?.message || 'Gagal memproses file import.';
      toast.error(errMsg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Card 1: Unduh Template */}
        <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{
                backgroundColor: 'var(--module-primary-subtle)',
                color: 'var(--module-primary)',
              }}
            >
              <FileSpreadsheet size={18} />
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 text-xs">Unduh Format Template Berkas</h4>
              <p className="text-2xs text-slate-500 mt-0.5">
                Format resmi Excel (.xlsx) dengan kolom terstandarisasi dan contoh pengisian.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={<Download size={14} />}
            isLoading={isDownloadingTemplate}
            disabled={isDownloadingTemplate}
            onClick={handleDownloadTemplate}
            className="shrink-0 bg-white"
          >
            Unduh Template
          </Button>
        </div>

        {/* Card 2: Upload Area */}
        <div className="space-y-3">
          <Controller
            control={control}
            name="file"
            render={({ field: { onChange } }) => (
              <Input
                ref={fileInputRef}
                type="file"
                label="Pilih Berkas Excel / CSV *"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  onChange(file);
                  setResult(null);
                }}
                error={errors.file?.message ? String(errors.file.message) : undefined}
                hint="Format berkas .xlsx, .xls, .csv (Maksimal 10 MB). Berkas template atau workbook DATA_MASTER_SINAPRA.xlsx."
              />
            )}
          />

          {selectedFile && (
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: 'var(--module-primary-subtle)',
                    color: 'var(--module-primary)',
                  }}
                >
                  <FileSpreadsheet size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-2xs text-slate-400">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<X size={14} />}
                onClick={() => {
                  resetState();
                }}
                disabled={isUploading || isSubmitting}
                className="shrink-0"
              >
                Ganti
              </Button>
            </div>
          )}
        </div>

        {/* Ringkasan Hasil Import */}
        {result && (
          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center gap-2">
              {result.failed === 0 ? (
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle size={18} className="text-amber-600 shrink-0" />
              )}
              <h5 className="font-bold text-xs text-slate-800">Ringkasan Hasil Import</h5>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                <div className="text-xs font-bold text-emerald-700">{result.created}</div>
                <div className="text-2xs text-emerald-600 font-medium">Data Baru</div>
              </div>
              <div
                className="p-3 rounded-lg border border-slate-200"
                style={{
                  backgroundColor: 'var(--module-primary-subtle)',
                }}
              >
                <div
                  className="text-xs font-bold"
                  style={{ color: 'var(--module-primary)' }}
                >
                  {result.updated}
                </div>
                <div
                  className="text-2xs font-medium"
                  style={{ color: 'var(--module-primary)' }}
                >
                  Diperbarui
                </div>
              </div>
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-100">
                <div className="text-xs font-bold text-rose-700">{result.failed}</div>
                <div className="text-2xs text-rose-600 font-medium">Gagal</div>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="space-y-2 mt-2">
                <p className="text-2xs font-semibold text-rose-600">
                  Rincian Baris Gagal ({result.errors.length}):
                </p>
                <div className="max-h-32 overflow-y-auto space-y-2 pr-2">
                  {result.errors.map((err, idx) => (
                    <div
                      key={idx}
                      className="text-2xs text-slate-600 bg-white p-2 rounded border border-rose-100 flex items-start gap-1.5"
                    >
                      <span className="font-bold text-rose-600 shrink-0">Baris {err.row}:</span>
                      <span>{err.error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={isUploading || isSubmitting}
          >
            {result ? 'Tutup' : 'Batal'}
          </Button>

          {!result ? (
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={<Upload size={14} />}
              isLoading={isUploading || isSubmitting}
              disabled={!selectedFile || isUploading || isSubmitting}
            >
              Mulai Import Data
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={<Check size={14} />}
              onClick={handleClose}
            >
              Selesai
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}
