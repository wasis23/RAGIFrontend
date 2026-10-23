'use client';

import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { downloadBlobFile } from '@/lib/download';
import { getApiErrorMessage } from '@/lib/utils';
import { siakadService } from '@/services/siakad.service';
import { TINGKAT_KESULITAN_OPTIONS } from '@/types/bank-soal.types';
import { AlertTriangle, Download, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { loadKategoriOptions, loadRpsOptions } from './BankSoalForm';

const importSchema = z.object({
  file: z
    .custom<File>((val) => val instanceof File, { message: 'File import wajib dipilih.' })
    .refine((val) => /\.(xlsx|xls|csv)$/i.test(val?.name ?? ''), {
      message: 'Format file harus XLSX, XLS, atau CSV.',
    })
    .refine((val) => (val?.size ?? 0) <= 10 * 1024 * 1024, {
      message: 'Ukuran file maksimal 10 MB.',
    }),
  rps_id: z.string().min(1, 'RPS tujuan wajib dipilih.'),
  kategori_id: z.string().optional().default(''),
  tingkat_kesulitan: z.string().optional().default(''),
});

type ImportValues = z.infer<typeof importSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onImported: (totalImported: number) => void;
}

function extractVal(val: unknown): string {
  if (val === null || val === undefined || val === '') return '';
  if (typeof val === 'object' && val !== null && 'value' in (val as Record<string, unknown>)) {
    const v = (val as { value: unknown }).value;
    return v === null || v === undefined ? '' : String(v);
  }
  return String(val);
}

/**
 * Modal import bank soal dari file XLSX/CSV (LMS-02).
 */
export default function ImportSoalModal({ open, onClose, onImported }: Props) {
  const [isImporting, setIsImporting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const form = useForm<ImportValues>({
    resolver: zodResolver(importSchema) as any,
    defaultValues: { file: undefined as unknown as File, rps_id: '', kategori_id: '', tingkat_kesulitan: '' },
  });

  const handleDownloadTemplate = async () => {
    setIsDownloading(true);
    try {
      const { blob, filename } = await siakadService.downloadTemplateSoal();
      downloadBlobFile(blob, filename);
      toast.success('Template import berhasil diunduh.');
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Gagal mengunduh template import.'));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSubmit = async (values: ImportValues) => {
    setIsImporting(true);
    try {
      const res = await siakadService.importSoal({
        file: values.file,
        rps_id: Number(values.rps_id),
        kategori_id: values.kategori_id ? Number(values.kategori_id) : null,
        tingkat_kesulitan: values.tingkat_kesulitan || null,
      });
      const totalImported = res?.data?.total_imported ?? 0;
      const errors: string[] = res?.data?.errors ?? [];

      if (errors.length > 0) {
        toast.error(`${totalImported} soal diimport, ${errors.length} baris dilewati.`, { duration: 6000 });
        errors.slice(0, 5).forEach((e) => toast.error(e, { duration: 6000 }));
      } else {
        toast.success(`${totalImported} soal berhasil diimport.`);
      }

      form.reset();
      onClose();
      onImported(totalImported);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Gagal import bank soal.'));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Import Bank Soal"
      size="md"
      footer={
        <div className="flex justify-between gap-2 w-full">
          <Button
            type="button"
            variant="outline"
            icon={<Download size={16} />}
            onClick={handleDownloadTemplate}
            loading={isDownloading}
            disabled={isDownloading || isImporting}
          >
            Unduh Template
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isImporting}>
              Batal
            </Button>
            <Button
              type="button"
              variant="primary"
              icon={<Upload size={16} />}
              onClick={form.handleSubmit(handleSubmit)}
              loading={isImporting}
              disabled={isImporting}
            >
              Import
            </Button>
          </div>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="alert alert-warning text-xs">
          <AlertTriangle size={16} className="shrink-0" />
          <span>
            Gunakan template resmi agar kolom terbaca. Baris yang tidak valid akan dilewati dan
            dilaporkan setelah import selesai.
          </span>
        </div>

        <Controller
          name="file"
          control={form.control}
          render={({ field }) => (
            <Input
              id="import-soal-file"
              type="file"
              label="File Import"
              required
              accept=".xlsx,.xls,.csv"
              error={form.formState.errors.file?.message}
              hint="Format: XLSX, XLS, atau CSV. Maksimal 500 baris data."
              onChange={(e) => {
                const picked = e.target.files?.[0] ?? null;
                field.onChange(picked);
              }}
            />
          )}
        />

        <Controller
          name="rps_id"
          control={form.control}
          render={({ field }) => (
            <AsyncSelect
              label="RPS Tujuan"
              required
              placeholder="Cari RPS (mata kuliah)..."
              value={field.value || ''}
              onChange={(val) => field.onChange(extractVal(val))}
              loadOptions={loadRpsOptions}
              isClearable
              error={form.formState.errors.rps_id?.message}
            />
          )}
        />

        <Controller
          name="kategori_id"
          control={form.control}
          render={({ field }) => (
            <AsyncSelect
              label="Kategori"
              placeholder="Pilih kategori (opsional)..."
              value={field.value || ''}
              onChange={(val) => field.onChange(extractVal(val))}
              loadOptions={loadKategoriOptions}
              isClearable
            />
          )}
        />

        <Controller
          name="tingkat_kesulitan"
          control={form.control}
          render={({ field }) => (
            <Select
              label="Tingkat Kesulitan Default"
              placeholder="Gunakan nilai default sistem..."
              options={TINGKAT_KESULITAN_OPTIONS}
              value={field.value || ''}
              onChange={(val) => field.onChange(val)}
              isClearable
            />
          )}
        />
      </form>
    </Modal>
  );
}
