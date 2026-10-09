'use client';

import { useState, type ReactNode } from 'react';
import { BookOpenText } from 'lucide-react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import type { SelectOption } from '@/components/ui/Select';

// ===== Konstanta terpusat (sumber tunggal untuk form create + edit RPS) =====
// Nilai closed-set domain (bukan entitas master), value stabil selaras kolom backend.

export const DOSEN_BISA_EDIT_OPTIONS: SelectOption[] = [
  { value: 'true', label: 'Ya' },
  { value: 'false', label: 'Tidak' },
];

export const JENIS_PEMBELAJARAN_OPTIONS: SelectOption[] = [
  { value: 'Kuliah / Responsi', label: 'Kuliah / Responsi' },
  { value: 'Seminar / Diskusi Kelompok', label: 'Seminar / Diskusi Kelompok' },
  { value: 'Praktikum / Praktik Studio', label: 'Praktikum / Praktik Studio' },
  { value: 'Praktik Lapangan / Magang', label: 'Praktik Lapangan / Magang' },
  { value: 'Penelitian & Proyek Mandiri', label: 'Penelitian & Proyek Mandiri' },
  { value: 'Pembelajaran Daring / E-Learning', label: 'Pembelajaran Daring / E-Learning' },
  { value: 'Blended / Hybrid Learning', label: 'Blended / Hybrid Learning' },
];

// ===== Kartu section bernomor: hierarki visual stabil saat section bertambah =====

interface RpsSectionCardProps {
  no: string;
  title: string;
  description?: string;
  children: ReactNode;
}

export function RpsSectionCard({ no, title, description, children }: RpsSectionCardProps) {
  return (
    <Card>
      <CardHeader className="flex items-center gap-3">
        <span
          aria-hidden
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold"
          style={{ background: 'var(--module-primary-subtle)', color: 'var(--module-primary)' }}
        >
          {no}
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-extrabold text-slate-900">{title}</h3>
          {description ? <p className="text-2xs text-slate-500">{description}</p> : null}
        </div>
      </CardHeader>
      <CardBody className="space-y-4">{children}</CardBody>
    </Card>
  );
}

// ===== Banner identitas MK: pengganti 5 input disabled yang redundan =====

export interface RpsMkInfo {
  kode_mk?: string;
  nama?: string;
  sks_teori?: number;
  total_sks?: number;
  sks_praktik?: number;
  semester_anjuran?: number;
  rumpun?: string;
  rumpun_mata_kuliah?: { nama_rumpun?: string };
  rumpunMataKuliah?: { nama_rumpun?: string };
  kurikulum?: { nama_kurikulum?: string; kode_kurikulum?: string };
}

function sksLabel(mk: RpsMkInfo): string {
  const teori = mk?.sks_teori ?? mk?.total_sks ?? 0;
  const praktik = mk?.sks_praktik;
  return praktik ? `${Number(teori) + Number(praktik)} SKS (T=${teori} P=${praktik})` : `${teori} SKS`;
}

export function RpsMkBanner({ mk }: { mk: RpsMkInfo | null }) {
  if (!mk) {
    return (
      <EmptyState
        icon={<BookOpenText size={20} />}
        title="Belum ada mata kuliah dipilih"
        description="Pilih mata kuliah terlebih dahulu untuk melihat identitas, bobot SKS, dan rumpun."
      />
    );
  }

  const kode = mk.kode_mk || '-';
  const nama = mk.nama || '-';
  const rumpun =
    mk.rumpun_mata_kuliah?.nama_rumpun || mk.rumpunMataKuliah?.nama_rumpun || mk.rumpun || '-';
  const kurikulum = mk.kurikulum?.nama_kurikulum || mk.kurikulum?.kode_kurikulum || null;
  const semester = mk.semester_anjuran ? `Semester ${mk.semester_anjuran}` : null;

  return (
    <div className="space-y-3">
      <div className="min-w-0">
        <p className="font-mono text-xs font-bold" style={{ color: 'var(--module-primary)' }}>
          {kode}
        </p>
        <p className="truncate text-sm font-extrabold text-slate-900" title={nama}>
          {nama}
        </p>
        {kurikulum ? <p className="text-2xs text-slate-500">{kurikulum}</p> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant="siakad" title="Rumpun mata kuliah">
          {rumpun}
        </Badge>
        <Badge variant="gray" title="Bobot SKS">
          {sksLabel(mk)}
        </Badge>
        {semester ? <Badge variant="gray">{semester}</Badge> : null}
      </div>
    </div>
  );
}

// ===== Tab CPL / CPMK: satu section, hemat ruang vertikal =====

export type CplRow = { id: number; kode_cpl: string; deskripsi: string };
export type CpmkRow = { id: number; kode_cpmk: string; deskripsi: string };

const cplColumns: ColumnDef<CplRow>[] = [
  {
    key: 'kode_cpl',
    label: 'Kode',
    render: (row) => <span className="font-mono text-xs">{row.kode_cpl}</span>,
  },
  {
    key: 'deskripsi',
    label: 'Rumusan',
    render: (row) => <span className="text-xs text-slate-700">{row.deskripsi}</span>,
  },
];

const cpmkColumns: ColumnDef<CpmkRow>[] = [
  {
    key: 'kode_cpmk',
    label: 'Kode',
    render: (row) => <span className="font-mono text-xs">{row.kode_cpmk}</span>,
  },
  {
    key: 'deskripsi',
    label: 'Rumusan',
    render: (row) => <span className="text-xs text-slate-700">{row.deskripsi}</span>,
  },
];

export function RpsCplCpmkTabs({ cplRows, cpmkRows }: { cplRows: CplRow[]; cpmkRows: CpmkRow[] }) {
  const [tab, setTab] = useState<'cpl' | 'cpmk'>('cpl');

  return (
    <div className="space-y-3">
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'cpl'}
          onClick={() => setTab('cpl')}
          className={
            tab === 'cpl'
              ? 'border-b-2 font-bold rounded-t-lg px-2.5 py-1.5 text-xs border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle)]'
              : 'px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800'
          }
        >
          CPL-PRODI ({cplRows.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'cpmk'}
          onClick={() => setTab('cpmk')}
          className={
            tab === 'cpmk'
              ? 'border-b-2 font-bold rounded-t-lg px-2.5 py-1.5 text-xs border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle)]'
              : 'px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800'
          }
        >
          CPMK ({cpmkRows.length})
        </button>
      </div>
      <div className="max-h-[360px] overflow-y-auto">
        {tab === 'cpl' ? (
          <DataTable
            columns={cplColumns}
            data={cplRows}
            emptyMessage="Belum ada CPL-PRODI yang dibebankan pada mata kuliah ini."
          />
        ) : (
          <DataTable
            columns={cpmkColumns}
            data={cpmkRows}
            emptyMessage="Belum ada CPMK untuk mata kuliah ini."
          />
        )}
      </div>
      <p className="text-2xs text-slate-400">
        Data turunan dari mata kuliah (read-only). Ubah pembebanan melalui menu Pemetaan CPL-MK dan Rumusan CPMK.
      </p>
    </div>
  );
}
