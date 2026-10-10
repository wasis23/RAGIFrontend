'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { pengajuanOperasionalService, type PengajuanOperasional } from '@/services/pengajuan-operasional.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Checkbox } from '@/components/ui/Checkbox';
import { formatRupiah } from '@/lib/utils';

interface GajiRow {
  id: number;
  gaji_pegawai_id?: number;
  nip: string;
  nama: string;
  periode: string;
  gajiBersih: number;
  isSent: boolean;
  statusBayar: string;
}

export default function GajiBundleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [bundle, setBundle] = useState<PengajuanOperasional | null>(null);
  const [loading, setLoading] = useState(true);
  const [sentMap, setSentMap] = useState<Record<number, boolean>>({});
  const [exporting, setExporting] = useState(false);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await pengajuanOperasionalService.detail(id);
      setBundle(res.data ?? null);
      const map: Record<number, boolean> = {};
      res.data?.items?.forEach((item: any) => {
        if (item.gaji_pegawai_id) {
          map[item.gaji_pegawai_id] = item.gaji_pegawai?.status_transfer === 'paid';
        }
      });
      setSentMap(map);
    } catch {
      toast.error('Gagal memuat detail bundle gaji');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleToggleSent = (gajiPegawaiId: number) => {
    setSentMap((prev) => ({ ...prev, [gajiPegawaiId]: !prev[gajiPegawaiId] }));
  };

  const handleExportXlsx = async () => {
    if (!bundle) return;
    setExporting(true);
    try {
      const rows = (bundle.items || []).map((item: any, idx: number) => ({
        'NO': idx + 1,
        'NIP': item.gaji_pegawai?.pegawai?.nip || '-',
        'NAMA PEGAWAI': item.gaji_pegawai?.pegawai?.nama_lengkap || item.nama_barang || '-',
        'PERIODE': item.gaji_pegawai?.periode_bulan_tahun || bundle.sumber_id || '-',
        'GAJI BERSIH (Rp)': Number(item.harga_satuan) || 0,
        'STATUS KIRIM': sentMap[item.gaji_pegawai_id] ? 'Sudah Dikirim' : 'Belum Dikirim',
        'STATUS BAYAR': item.gaji_pegawai?.status_transfer || '-',
      }));
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data Gaji');
      XLSX.writeFile(wb, `bundle-gaji-${bundle.nomor_pengajuan}.xlsx`);
      toast.success('File XLSX berhasil diunduh.');
    } catch {
      toast.error('Gagal mengekspor XLSX.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Bundle gaji tidak ditemukan.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/sikeu/pengajuan')}>
          Kembali
        </Button>
      </div>
    );
  }

  const items = bundle.items || [];
  const sentCount = items.filter((item: any) => sentMap[item.gaji_pegawai_id]).length;
  const rows: GajiRow[] = items.map((item: any) => ({
    id: item.id,
    gaji_pegawai_id: item.gaji_pegawai_id,
    nip: item.gaji_pegawai?.pegawai?.nip || '-',
    nama: item.gaji_pegawai?.pegawai?.nama_lengkap || item.nama_barang || '-',
    periode: item.gaji_pegawai?.periode_bulan_tahun || bundle.sumber_id || '-',
    gajiBersih: Number(item.harga_satuan) || 0,
    isSent: sentMap[item.gaji_pegawai_id] || false,
    statusBayar: item.gaji_pegawai?.status_transfer || '-',
  }));

  const columns: ColumnDef<GajiRow>[] = [
    {
      key: 'nama',
      label: 'PEGAWAI',
      render: (row) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-slate-900 text-xs">{row.nama}</div>
          <div className="text-2xs text-slate-500 font-mono">NIP: {row.nip}</div>
        </div>
      ),
    },
    {
      key: 'periode',
      label: 'PERIODE',
      render: (row) => <span className="text-xs text-slate-600">{row.periode}</span>,
    },
    {
      key: 'gajiBersih',
      label: 'GAJI BERSIH',
      render: (row) => (
        <span className="font-bold tabular-nums text-xs">{formatRupiah(row.gajiBersih)}</span>
      ),
    },
    {
      key: 'isSent',
      label: 'SUDAH DIKIRIM?',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Checkbox
            checked={row.isSent}
            onChange={() => row.gaji_pegawai_id && handleToggleSent(row.gaji_pegawai_id)}
            label={row.isSent ? 'Sudah' : 'Belum'}
          />
          <Badge variant={row.isSent ? 'success' : 'warning'} className="text-2xs">
            {row.isSent ? 'Terkirim' : 'Pending'}
          </Badge>
        </div>
      ),
    },
    {
      key: 'statusBayar',
      label: 'STATUS BAYAR',
      render: (row) => (
        <Badge
          variant={row.statusBayar === 'paid' ? 'success' : 'secondary'}
          className="text-2xs"
        >
          {row.statusBayar || '-'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="w-full space-y-6 animate-fade-in">
      <PageHeader
        title={`Bundle Gaji: ${bundle.nomor_pengajuan}`}
        description={`${bundle.judul_pengajuan} — ${items.length} pegawai`}
        action={
          <Link href="/sikeu/pengajuan">
            <Button
              variant="outline"
              icon={<ArrowLeft size={16} />}
              style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
            >
              Kembali
            </Button>
          </Link>
        }
      />

      {/* Ringkasan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl">
          <div className="text-xs text-slate-500 mb-1">Periode</div>
          <div className="text-sm font-bold text-slate-900">{bundle.sumber_id || '-'}</div>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-2xl">
          <div className="text-xs text-slate-500 mb-1">Total Pegawai</div>
          <div className="text-sm font-bold text-slate-900">{items.length} Orang</div>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-2xl">
          <div className="text-xs text-slate-500 mb-1">Sudah Dikirim</div>
          <div className="text-sm font-bold text-emerald-600">
            {sentCount} / {items.length} Pegawai
          </div>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-2xl">
          <div className="text-xs text-slate-500 mb-1">Total Bersih</div>
          <div className="text-sm font-bold text-slate-900">{formatRupiah(bundle.nominal_diajukan)}</div>
        </div>
      </div>

      {/* Daftar Pegawai */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Daftar Pegawai & Gaji
          </h3>
          <Button
            variant="outline"
            icon={<Download size={16} />}
            loading={exporting}
            disabled={exporting}
            onClick={handleExportXlsx}
          >
            Export XLSX
          </Button>
        </div>

        <DataTable
          data={rows}
          isLoading={false}
          columns={columns}
          emptyMessage="Belum ada pegawai dalam bundle ini."
        />

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
          <p className="font-semibold">Cara Export:</p>
          <p>Klik tombol "Export XLSX" untuk mengunduh file Excel. File ini siap diunggah ke sistem payroll.</p>
        </div>
      </div>
    </div>
  );
}
