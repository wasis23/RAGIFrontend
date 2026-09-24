'use client';

import { useState, useEffect } from 'react';
import { Sliders, CheckCircle2, Layers, Sparkles, Clock } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SIAKAD_OPTION_TYPES, useSiakadOptions } from '@/lib/siakad-options';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

const MODE_CARDS = [
  {
    value: 'full_obe',
    title: '1. Full OBE (Asesmen Murni)',
    subtitle: 'Standar IABEE, ASIIN, dan Akreditasi Unggul LAM.',
    icon: Sparkles,
    accent: 'emerald',
    points: [
      'Nilai dihitung 100% dari Capaian Pembelajaran (CPMK).',
      'Portofolio evaluasi lulusan & spider chart langsung terbit.',
      'Dosen menginput nilai per indikator CPMK 1 s.d n.',
    ],
    cta: 'Terapkan Full OBE',
  },
  {
    value: 'semi_obe',
    title: '2. Hibrid / Semi-OBE (Rekomendasi)',
    subtitle: 'Paling fleksibel untuk transisi kurikulum bertahap.',
    icon: Layers,
    accent: 'primary',
    points: [
      'Dosen membuat komponen bebas (Tugas, UTS, UAS, Proyek).',
      'Setiap komponen dapat di-tag ke target CPMK tertentu.',
      'Perhitungan nilai angka & KHS tetap akurat dan otomatis.',
    ],
    cta: 'Terapkan Hibrid',
  },
  {
    value: 'konvensional',
    title: '3. Metode Konvensional (Klasik)',
    subtitle: 'Rumus nilai baku tanpa asesmen ketercapaian OBE.',
    icon: Clock,
    accent: 'amber',
    points: [
      'Rumus persentase baku: Harian, UTS, UAS, dan Praktik.',
      'Input nilai massal cepat melalui spreadsheet rekap dosen.',
      'Tidak menghasilkan laporan spider-chart akreditasi OBE.',
    ],
    cta: 'Terapkan Konvensional',
  },
] as const;

export default function KonfigurasiPenilaianPage() {
  const [tahunAkademiks, setTahunAkademiks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingChange, setPendingChange] = useState<{ ta: any; mode: string } | null>(null);
  const modeOptions = useSiakadOptions(SIAKAD_OPTION_TYPES.MODE_PENILAIAN);
  const modeLabel = (v?: string) => modeOptions.find((o) => o.value === v)?.label || v || '-';

  const fetchTahunAkademiks = async () => {
    try {
      setLoading(true);
      const res = await siakadService.getTahunAkademiks();
      if (res.data) {
        setTahunAkademiks(res.data);
      }
    } catch (err: any) {
      toast.error('Gagal memuat daftar tahun akademik');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTahunAkademiks();
  }, []);

  const handleConfirmChange = async () => {
    if (!pendingChange) return;
    try {
      setSaving(true);
      await siakadService.updateModePenilaian(pendingChange.ta.id, { mode_penilaian: pendingChange.mode });
      toast.success(`Mode penilaian ${pendingChange.ta.nama} diubah ke ${modeLabel(pendingChange.mode)}`);
      setPendingChange(null);
      fetchTahunAkademiks();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal mengubah mode penilaian');
    } finally {
      setSaving(false);
    }
  };

  const activeTa = tahunAkademiks.find((t) => t.is_active) || tahunAkademiks[0];

  const columns: ColumnDef<any>[] = [
    {
      key: 'kode',
      label: 'KODE',
      render: (row) => (
        <span className="font-mono font-black text-slate-900 text-xs">{row.kode}</span>
      ),
    },
    {
      key: 'nama',
      label: 'PERIODE TAHUN AKADEMIK',
      render: (row) => <span className="font-bold text-slate-900 text-xs">{row.nama}</span>,
    },
    {
      key: 'status',
      label: 'STATUS PERIODE',
      align: 'center',
      render: (row) =>
        row.is_active ? (
          <Badge variant="green" className="text-2xs font-bold">Periode Aktif</Badge>
        ) : (
          <Badge variant="gray" className="text-2xs">Non-aktif</Badge>
        ),
    },
    {
      key: 'mode',
      label: 'MODE PENILAIAN',
      align: 'center',
      render: (row) => <Badge variant="purple" className="text-2xs">{modeLabel(row.mode_penilaian)}</Badge>,
    },
    {
      key: 'aksi',
      label: 'AKSI PENGATURAN',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            icon={<Sliders size={12} />}
            onClick={() => setPendingChange({ ta: row, mode: row.mode_penilaian || 'semi_obe' })}
            className="text-2xs font-bold"
          >
            Ubah Mode
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Konfigurasi Mode Penilaian & Kurikulum OBE"
        description="Pengaturan fleksibel metode evaluasi akademik: Full OBE (Outcome-Based Education), Hibrid / Semi-OBE, atau Metode Konvensional."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Master Data', href: '/siakad/master/fakultas' },
          { label: 'Konfigurasi Penilaian' },
        ]}
      />

      {/* Hero Banner */}
      <div className="card p-6 text-white border-none shadow-xl" style={{ background: 'linear-gradient(to right, var(--module-primary), #0f172a)' }}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="green">Sistem Penilaian Dinamis</Badge>
              {activeTa && (
                <span className="text-2xs text-slate-300">
                  Periode Aktif: <strong>{activeTa.nama}</strong>
                </span>
              )}
            </div>
            <h2 className="text-lg md:text-xl font-black text-white">
              Tentukan Standar Penilaian Perkuliahan Kampus
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Sistem SIAKAD mendukung transisi kurikulum secara mulus. Anda dapat menerapkan asesmen berbasis capaian (OBE murni) untuk akreditasi internasional, metode hibrid untuk masa adaptasi, atau metode konvensional berbasis persentase baku.
            </p>
          </div>

          {activeTa && (
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center min-w-[200px]">
              <span className="text-2xs text-slate-300 font-semibold block">Mode Periode Berjalan</span>
              <span className="text-sm font-black text-amber-300 uppercase tracking-wider block mt-1">
                {modeLabel(activeTa.mode_penilaian)}
              </span>
              <Badge variant="green" className="text-2xs font-bold mt-2">Semester Aktif</Badge>
            </div>
          )}
        </div>
      </div>

      {/* 3 Comparison Options Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MODE_CARDS.map((card) => {
          const Icon = card.icon;
          const isActive = activeTa?.mode_penilaian === card.value;
          return (
            <div
              key={card.value}
              className={`card p-5 space-y-4 border-2 transition-all ${
                isActive ? 'shadow-md' : 'border-slate-200 hover:border-slate-300'
              }`}
              style={isActive ? { borderColor: 'var(--module-primary)' } : undefined}
            >
              <div className="flex items-center justify-between">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold"
                  style={{ background: 'var(--module-primary-subtle)', color: 'var(--module-primary)' }}
                >
                  <Icon size={20} />
                </div>
                {isActive && (
                  <Badge variant="green" className="text-2xs font-bold inline-flex items-center gap-1">
                    <CheckCircle2 size={11} /> Aktif Sekarang
                  </Badge>
                )}
              </div>

              <div>
                <h3 className="text-sm font-black text-slate-900">{card.title}</h3>
                <p className="text-2xs text-slate-500 mt-1">{card.subtitle}</p>
              </div>

              <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                {card.points.map((point) => (
                  <div key={point} className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="shrink-0 mt-0.5" style={{ color: 'var(--module-primary)' }} />
                    <span>{point}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <Button
                  variant={isActive ? 'secondary' : 'primary'}
                  className="w-full text-xs font-bold"
                  disabled={isActive || !activeTa || saving}
                  onClick={() => activeTa && setPendingChange({ ta: activeTa, mode: card.value })}
                >
                  {isActive ? 'Sedang Digunakan' : card.cta}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabel Konfigurasi Per Periode Akademik */}
      <div className="card p-6 space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sliders size={16} style={{ color: 'var(--module-primary)' }} />
            Riwayat & Konfigurasi Mode Penilaian Tiap Semester
          </h3>
          <p className="text-2xs text-slate-500">
            Mode penilaian berbeda dapat dikunci untuk arsip semester lalu dan semester yang akan datang.
          </p>
        </div>

        <DataTable
          columns={columns}
          data={tahunAkademiks}
          isLoading={loading}
          emptyMessage="Belum ada periode tahun akademik."
        />
      </div>

      <ConfirmDialog
        isOpen={Boolean(pendingChange)}
        onClose={() => setPendingChange(null)}
        onConfirm={handleConfirmChange}
        title="Ubah Mode Penilaian?"
        message={
          <span className="block text-left space-y-4">
            <span className="block">
              Pilih mode penilaian untuk periode <strong>{pendingChange?.ta.nama}</strong>. Ini memengaruhi cara nilai seluruh kelas pada periode tersebut dihitung.
            </span>
            {pendingChange && (
              <Select
                label="Mode Penilaian"
                options={modeOptions}
                value={pendingChange.mode}
                onChange={(val: any) => setPendingChange({ ...pendingChange, mode: String(val) })}
              />
            )}
          </span>
        }
        confirmText="Ya, Ubah Mode"
        variant="warning"
        isLoading={saving}
      />
    </div>
  );
}
