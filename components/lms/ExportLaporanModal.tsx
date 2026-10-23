'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { lmsService } from '@/services/lms.service';
import { downloadBlobFile } from '@/lib/download';
import {
  LMS_EXPORT_FORMAT_OPTIONS,
  LMS_EXPORT_JENIS_LABEL,
  LmsExportFile,
  LmsExportFormat,
  LmsExportJenis,
} from '@/types/lms.types';

interface ExportLaporanModalProps {
  open: boolean;
  onClose: () => void;
  /** Konteks sumber data laporan (kelas / tugas / quiz). */
  scope: {
    kelasId?: number;
    tugasId?: number;
    quizId?: number;
  };
  /** Jenis laporan yang boleh dipilih pada halaman ini (dibatasi permission pemanggil). */
  jenis: LmsExportJenis[];
}

/**
 * Modal export laporan LMS (CSV / XLSX).
 *
 * Memusatkan pemetaan jenis laporan → endpoint backend agar halaman cukup
 * menyediakan `scope` + daftar jenis yang relevan.
 */
export default function ExportLaporanModal({
  open,
  onClose,
  scope,
  jenis,
}: ExportLaporanModalProps) {
  const [jenisTerpilih, setJenisTerpilih] = useState<LmsExportJenis | ''>('');
  const [format, setFormat] = useState<LmsExportFormat>('csv');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setJenisTerpilih(jenis[0] ?? '');
      setFormat('csv');
    }
    // `jenis` bersifat stabil per halaman; sengaja tidak ikut jadi dependensi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const unduh = async (jenis: LmsExportJenis, fmt: LmsExportFormat): Promise<LmsExportFile> => {
    switch (jenis) {
      case 'presensi':
        return lmsService.exportRekapPresensi(scope.kelasId as number, fmt);
      case 'izin':
        return lmsService.exportRekapIzin(scope.kelasId as number, fmt);
      case 'nilai':
        return lmsService.exportRekapNilai(scope.kelasId as number, fmt);
      case 'pengumpulan':
        return lmsService.exportPengumpulanTugas(scope.tugasId as number, fmt);
      case 'quiz':
        return lmsService.exportHasilQuiz(scope.quizId as number, fmt);
      case 'tryout':
        return lmsService.exportHasilTryout(scope.quizId as number, fmt);
      default:
        throw new Error('Jenis laporan tidak dikenal.');
    }
  };

  const handleExport = async () => {
    if (!jenisTerpilih) return;

    setLoading(true);
    try {
      const file = await unduh(jenisTerpilih, format);
      downloadBlobFile(file.blob, file.filename);
      toast.success('Laporan berhasil diunduh.');
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal mengunduh laporan.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const jenisOptions = jenis.map((item) => ({
    value: item,
    label: LMS_EXPORT_JENIS_LABEL[item],
  }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Export Laporan"
      size="sm"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button
            type="button"
            size="sm"
            icon={<Download size={16} />}
            loading={loading}
            disabled={loading || !jenisTerpilih}
            onClick={handleExport}
          >
            Unduh
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4">
        <Select
          label="Jenis Laporan"
          options={jenisOptions}
          value={jenisTerpilih}
          onChange={(val: LmsExportJenis) => setJenisTerpilih(val)}
          placeholder="Pilih jenis laporan"
        />
        <Select
          label="Format Berkas"
          options={LMS_EXPORT_FORMAT_OPTIONS}
          value={format}
          onChange={(val: LmsExportFormat) => setFormat(val)}
          hint="CSV memakai BOM UTF-8 agar karakter Indonesia tampil benar di Excel."
        />
      </div>
    </Modal>
  );
}
