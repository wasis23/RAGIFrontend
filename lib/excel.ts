import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';

/**
 * Helper utilitas ekspor data umum ke berkas Excel (.xlsx).
 */
export async function exportToExcel(
  filename: string,
  sheets: { name: string; data: Record<string, any>[] }[]
): Promise<void> {
  const wb = XLSX.utils.book_new();

  sheets.forEach(({ name, data }) => {
    if (!data || data.length === 0) {
      const ws = XLSX.utils.json_to_sheet([{}]);
      XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
      return;
    }

    const ws = XLSX.utils.json_to_sheet(data);

    // Hitung estimasi lebar kolom otomatis (min 10, max 60 karakter)
    const keys = Object.keys(data[0]);
    const colWidths = keys.map((key) => {
      let maxLen = key.length;
      for (let i = 0; i < data.length; i++) {
        const val = data[i][key];
        if (val !== null && val !== undefined) {
          const str = String(val);
          if (str.length > maxLen) {
            maxLen = str.length;
          }
        }
      }
      return { wch: Math.min(Math.max(maxLen + 3, 10), 60) };
    });

    ws['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  });

  const finalName = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;

  if (typeof window !== 'undefined') {
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    downloadBlob(blob, finalName);
  } else {
    XLSX.writeFile(wb, finalName);
  }
}

/**
 * Helper download Blob di browser
 */
function downloadBlob(blob: Blob, filename: string) {
  if (typeof window === 'undefined') return;
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export interface AttendanceMatrixExportParams {
  filename: string;
  days: {
    date: string;
    day: number;
    day_name: string;
    is_sunday: boolean;
    is_holiday: boolean;
    holiday_name?: string | null;
  }[];
  employees: {
    pegawai_id: number;
    nip: string;
    nama_lengkap: string;
    matrix: Record<string, any>;
    summary?: {
      total_hadir: number;
      total_terlambat: number;
      total_pulang_cepat: number;
      total_izin: number;
      total_alfa: number;
      total_hari_kerja: number;
      persentase: number;
    };
  }[];
  bundleInfo?: {
    nama_periode?: string;
    tanggal_awal?: string;
    tanggal_akhir?: string;
  };
  maxLateLimit?: number;
}

/**
 * Palet warna sel matriks presensi:
 * - Hijau (Tepat Waktu): background pastel hijau muda, teks hijau tua
 * - Merah (Terlambat / Pulang Cepat): background pastel merah muda, teks merah tua
 * - Kuning (Izin / Sakit / Dinas): background pastel kuning/amber, teks amber tua
 * - Abu-abu (Hari Libur / Minggu): background abu-abu, teks abu tua
 * - Putih (Tidak Absen / Alpa): background putih, teks abu/hitam
 */
const CELL_STYLES = {
  header: {
    font: { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF1E293B' } },
    alignment: { horizontal: 'center' as const, vertical: 'middle' as const, wrapText: true },
    fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFF1F5F9' } },
  },
  dateCell: {
    font: { name: 'Calibri', size: 10, color: { argb: 'FF0F172A' } },
    alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
    fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFFFFFFF' } },
  },
  labelCell: {
    font: { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF334155' } },
    alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
    fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFFFFFFF' } },
  },
  borderThin: {
    top: { style: 'thin' as const, color: { argb: 'FFE2E8F0' } },
    left: { style: 'thin' as const, color: { argb: 'FFE2E8F0' } },
    bottom: { style: 'thin' as const, color: { argb: 'FFE2E8F0' } },
    right: { style: 'thin' as const, color: { argb: 'FFE2E8F0' } },
  },
  // Status Presensi
  onTime: {
    fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFC8E6C9' } }, // Pastel Green
    font: { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1B5E20' } }, // Deep Green
  },
  lateOrEarly: {
    fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFFFCDD2' } }, // Pastel Red/Pink
    font: { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFB71C1C' } }, // Deep Red
  },
  permissionOrDuty: {
    fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFFFE082' } }, // Pastel Amber/Yellow
    font: { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFB78103' } }, // Deep Amber
  },
  holiday: {
    fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF9E9E9E' } }, // Grey
    font: { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF212121' } }, // Dark Grey
  },
  notPresent: {
    fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFFFFFFF' } }, // White
    font: { name: 'Calibri', size: 10, color: { argb: 'FF475569' } }, // Slate
  },
};

/**
 * Ekspor matriks presensi berdesain visual seperti lampiran pengguna:
 * Baris: Tanggal (Kolom A merged Masuk & Pulang, Kolom B: 'Masuk'/'Pulang')
 * Kolom: Pegawai (Kolom C dst: Nama Pegawai)
 * Warna:
 * - Hijau untuk tepat waktu
 * - Merah untuk terlambat / pulang cepat
 * - Kuning untuk izin atau dinas
 * - Putih untuk tidak absen
 * - Abu untuk hari libur
 */
export async function exportStyledAttendanceMatrix(params: AttendanceMatrixExportParams): Promise<void> {
  const { filename, days, employees, bundleInfo } = params;
  const wb = new ExcelJS.Workbook();
  wb.creator = 'SSO SIMPEG Campus';
  wb.created = new Date();

  // SHEET 1: Matriks Detail Harian
  const ws1 = wb.addWorksheet('Matriks Detail Harian', {
    views: [{ showGridLines: true }],
  });

  // Set lebar kolom A & B
  ws1.getColumn(1).width = 24; // Tanggal
  ws1.getColumn(2).width = 12; // Keterangan (Masuk/Pulang)

  // Header Row 1: Kolom A & B kosong, Kolom C dst nama pegawai
  const headerRow = ws1.getRow(1);
  headerRow.height = 28;

  const cellA1 = ws1.getCell('A1');
  cellA1.value = '';
  cellA1.border = CELL_STYLES.borderThin;

  const cellB1 = ws1.getCell('B1');
  cellB1.value = '';
  cellB1.border = CELL_STYLES.borderThin;

  employees.forEach((emp, empIdx) => {
    const colNum = 3 + empIdx;
    ws1.getColumn(colNum).width = Math.max(emp.nama_lengkap.length + 4, 18);
    const cell = ws1.getCell(1, colNum);
    cell.value = emp.nama_lengkap;
    cell.font = CELL_STYLES.header.font;
    cell.alignment = CELL_STYLES.header.alignment;
    cell.fill = CELL_STYLES.header.fill;
    cell.border = CELL_STYLES.borderThin;
  });

  // Tambahkan baris per hari (Setiap hari memakan 2 baris: Masuk & Pulang)
  let currentRowNum = 2;

  days.forEach((dayObj) => {
    const dateLabel = `${dayObj.day} ${dayObj.day_name} (${dayObj.date})`;
    const inRowNum = currentRowNum;
    const outRowNum = currentRowNum + 1;

    ws1.getRow(inRowNum).height = 22;
    ws1.getRow(outRowNum).height = 22;

    // Kolom 1 (Tanggal): Merge 2 baris (inRowNum & outRowNum)
    ws1.mergeCells(inRowNum, 1, outRowNum, 1);
    const dateCell = ws1.getCell(inRowNum, 1);
    dateCell.value = dateLabel;
    dateCell.font = CELL_STYLES.dateCell.font;
    dateCell.alignment = CELL_STYLES.dateCell.alignment;
    dateCell.border = CELL_STYLES.borderThin;

    // Kolom 2: 'Masuk' & 'Pulang'
    const inLabelCell = ws1.getCell(inRowNum, 2);
    inLabelCell.value = 'Masuk';
    inLabelCell.font = CELL_STYLES.labelCell.font;
    inLabelCell.alignment = CELL_STYLES.labelCell.alignment;
    inLabelCell.border = CELL_STYLES.borderThin;

    const outLabelCell = ws1.getCell(outRowNum, 2);
    outLabelCell.value = 'Pulang';
    outLabelCell.font = CELL_STYLES.labelCell.font;
    outLabelCell.alignment = CELL_STYLES.labelCell.alignment;
    outLabelCell.border = CELL_STYLES.borderThin;

    // Format warna bila tanggal adalah Hari Libur / Minggu
    if (dayObj.is_holiday || dayObj.is_sunday) {
      dateCell.fill = CELL_STYLES.holiday.fill;
      dateCell.font = CELL_STYLES.holiday.font;
      inLabelCell.fill = CELL_STYLES.holiday.fill;
      inLabelCell.font = CELL_STYLES.holiday.font;
      outLabelCell.fill = CELL_STYLES.holiday.fill;
      outLabelCell.font = CELL_STYLES.holiday.font;
    }

    // Isi sel data presensi tiap pegawai
    employees.forEach((emp, empIdx) => {
      const colNum = 3 + empIdx;
      const m = emp.matrix?.[dayObj.date];

      const inCell = ws1.getCell(inRowNum, colNum);
      const outCell = ws1.getCell(outRowNum, colNum);

      inCell.border = CELL_STYLES.borderThin;
      outCell.border = CELL_STYLES.borderThin;
      inCell.alignment = { horizontal: 'center', vertical: 'middle' };
      outCell.alignment = { horizontal: 'center', vertical: 'middle' };

      // KASUS 1: Hari Libur / Minggu -> Abu-abu ("LIBUR")
      if (dayObj.is_holiday || dayObj.is_sunday) {
        const holidayText = dayObj.holiday_name ? `LIBUR (${dayObj.holiday_name})` : 'LIBUR';
        inCell.value = holidayText;
        inCell.fill = CELL_STYLES.holiday.fill;
        inCell.font = CELL_STYLES.holiday.font;

        outCell.value = holidayText;
        outCell.fill = CELL_STYLES.holiday.fill;
        outCell.font = CELL_STYLES.holiday.font;
        return;
      }

      // KASUS 2: Tidak ada data / Kosong -> Putih ("TIDAK ABSEN")
      if (!m) {
        inCell.value = 'TIDAK ABSEN';
        inCell.fill = CELL_STYLES.notPresent.fill;
        inCell.font = CELL_STYLES.notPresent.font;

        outCell.value = 'TIDAK ABSEN';
        outCell.fill = CELL_STYLES.notPresent.fill;
        outCell.font = CELL_STYLES.notPresent.font;
        return;
      }

      const st = (m.status_kehadiran || '').toLowerCase();

      // KASUS 3: Status Izin / Sakit / Dinas / Cuti -> Kuning pastel
      if (['izin', 'sakit', 'dinas', 'cuti'].includes(st)) {
        const labelText = st === 'dinas' ? 'IZIN/DINAS' : st.toUpperCase();
        inCell.value = labelText;
        inCell.fill = CELL_STYLES.permissionOrDuty.fill;
        inCell.font = CELL_STYLES.permissionOrDuty.font;

        outCell.value = labelText;
        outCell.fill = CELL_STYLES.permissionOrDuty.fill;
        outCell.font = CELL_STYLES.permissionOrDuty.font;
        return;
      }

      // KASUS 4: Alfa -> Putih ("TIDAK ABSEN" / "ALFA")
      if (st === 'alfa') {
        inCell.value = 'TIDAK ABSEN';
        inCell.fill = CELL_STYLES.notPresent.fill;
        inCell.font = CELL_STYLES.notPresent.font;

        outCell.value = 'TIDAK ABSEN';
        outCell.fill = CELL_STYLES.notPresent.fill;
        outCell.font = CELL_STYLES.notPresent.font;
        return;
      }

      // KASUS 5: Masuk (in_status)
      const inStatus = m.in_status || 'upcoming';
      if (inStatus === 'on_time') {
        inCell.value = m.in_time || '08:00:00';
        inCell.fill = CELL_STYLES.onTime.fill;
        inCell.font = CELL_STYLES.onTime.font;
      } else if (inStatus === 'late') {
        inCell.value = m.in_time || 'TERLAMBAT';
        inCell.fill = CELL_STYLES.lateOrEarly.fill;
        inCell.font = CELL_STYLES.lateOrEarly.font;
      } else if (inStatus === 'permission') {
        inCell.value = 'DISPENSASI';
        inCell.fill = CELL_STYLES.permissionOrDuty.fill;
        inCell.font = CELL_STYLES.permissionOrDuty.font;
      } else if (inStatus === 'absent') {
        inCell.value = 'TIDAK ABSEN';
        inCell.fill = CELL_STYLES.notPresent.fill;
        inCell.font = CELL_STYLES.notPresent.font;
      } else {
        inCell.value = '-';
        inCell.fill = CELL_STYLES.notPresent.fill;
        inCell.font = CELL_STYLES.notPresent.font;
      }

      // KASUS 6: Pulang (out_status)
      const outStatus = m.out_status || 'upcoming';
      if (outStatus === 'on_time') {
        outCell.value = m.out_time || '16:00:00';
        outCell.fill = CELL_STYLES.onTime.fill;
        outCell.font = CELL_STYLES.onTime.font;
      } else if (outStatus === 'early') {
        outCell.value = m.out_time || 'PULANG CEPAT';
        outCell.fill = CELL_STYLES.lateOrEarly.fill;
        outCell.font = CELL_STYLES.lateOrEarly.font;
      } else if (outStatus === 'permission') {
        outCell.value = 'DISPENSASI';
        outCell.fill = CELL_STYLES.permissionOrDuty.fill;
        outCell.font = CELL_STYLES.permissionOrDuty.font;
      } else if (outStatus === 'absent') {
        inCell.value = inCell.value || 'TIDAK ABSEN';
        outCell.value = 'TIDAK ABSEN';
        outCell.fill = CELL_STYLES.notPresent.fill;
        outCell.font = CELL_STYLES.notPresent.font;
      } else {
        outCell.value = '-';
        outCell.fill = CELL_STYLES.notPresent.fill;
        outCell.font = CELL_STYLES.notPresent.font;
      }
    });

    currentRowNum += 2;
  });

  // SHEET 2: Ringkasan Rekap Kehadiran
  const ws2 = wb.addWorksheet('Ringkasan Rekap Kehadiran', {
    views: [{ showGridLines: true }],
  });

  const summaryHeaders = [
    'NO',
    'NIP',
    'NAMA PEGAWAI',
    'TOTAL HARI KERJA',
    'TOTAL HADIR (HARI)',
    'TERLAMBAT (HARI)',
    'PULANG CEPAT (HARI)',
    'IZIN (HARI)',
    'ALPHA / TIDAK HADIR (HARI)',
    'PERSENTASE KEHADIRAN (%)',
  ];

  ws2.addRow(summaryHeaders);
  const sumHeaderRow = ws2.getRow(1);
  sumHeaderRow.height = 26;
  sumHeaderRow.eachCell((c) => {
    c.font = CELL_STYLES.header.font;
    c.fill = CELL_STYLES.header.fill;
    c.alignment = CELL_STYLES.header.alignment;
    c.border = CELL_STYLES.borderThin;
  });

  const lateLimit = params.maxLateLimit !== undefined ? params.maxLateLimit : 5;

  employees.forEach((emp, idx) => {
    const s = emp.summary;
    const isExceedingLate = (s?.total_terlambat ?? 0) > lateLimit;

    const r = ws2.addRow([
      idx + 1,
      emp.nip || '-',
      emp.nama_lengkap,
      s?.total_hari_kerja ?? 0,
      s?.total_hadir ?? 0,
      s?.total_terlambat ?? 0,
      s?.total_pulang_cepat ?? 0,
      s?.total_izin ?? 0,
      s?.total_alfa ?? 0,
      Number(s?.persentase ?? 0),
    ]);
    r.height = 20;
    r.eachCell((c, colNum) => {
      c.border = CELL_STYLES.borderThin;
      c.font = { name: 'Calibri', size: 10 };
      c.alignment = colNum === 3 ? { horizontal: 'left', vertical: 'middle' } : { horizontal: 'center', vertical: 'middle' };

      // Jika pegawai terlambat melebihi batas, blok sel/baris dengan warna merah
      if (isExceedingLate) {
        c.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFC7CE' }, // Merah pastel elegan
        };
        if (colNum === 6 || colNum === 3) {
          c.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF9C0006' } };
        }
      }
    });
  });

  // Auto-width summary sheet
  ws2.columns.forEach((col, i) => {
    if (i === 2) col.width = 30; // Nama
    else if (i === 1) col.width = 20; // NIP
    else col.width = 16;
  });

  const finalName = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, finalName);
}
