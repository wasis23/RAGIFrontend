'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Printer } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

function CetakHasilStudiContent() {
  const params = useSearchParams();
  const router = useRouter();
  const mode = params.get('mode') === 'transkrip' ? 'transkrip' : 'khs';
  const mhsParam = params.get('mhs') ? Number(params.get('mhs')) : undefined;
  const taParam = params.get('ta') ? Number(params.get('ta')) : undefined;

  const [nilaiList, setNilaiList] = useState<any[]>([]);
  const [transkrip, setTranskrip] = useState<any | null>(null);
  const [dok, setDok] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [dokError, setDokError] = useState<string | null>(null);
  const [taLabel, setTaLabel] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [nilaiRes, trxRes] = await Promise.all([
          siakadService.getNilai({ tahun_akademik_id: taParam, mahasiswa_id: mhsParam }),
          siakadService.getTranskrip(mhsParam ? { mahasiswa_id: mhsParam } : undefined),
        ]);
        setNilaiList(nilaiRes.data || []);
        setTranskrip((trxRes as any).data || trxRes.data || null);
        const taList: any[] = (await siakadService.getTahunAkademiks().catch(() => ({ data: [] }))).data || [];
        setTaLabel(taList.find((t: any) => t.id === taParam)?.nama || '');
        try {
          const dokRes = await siakadService.terbitkanDokumen({
            jenis: mode === 'khs' ? 'KHS' : 'TRANSKRIP',
            mahasiswa_id: mhsParam,
            tahun_akademik_id: mode === 'khs' ? taParam : undefined,
          });
          setDok(dokRes.data || null);
        } catch (err: any) {
          setDokError(err.response?.data?.message || 'Dokumen resmi belum dapat diterbitkan; cetakan tanpa QR.');
        }
      } catch {
        toast.error('Gagal memuat data hasil studi');
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mhs = (transkrip as any)?.mahasiswa || dok?.mahasiswa;
  const khsFinalRows = nilaiList.filter((n: any) => n.is_final);
  const khsLive = khsFinalRows.reduce(
    (acc: any, n: any) => {
      const sks = Number(n.krs_detail?.kelas?.mata_kuliah?.total_sks || 0);
      acc.sks += sks;
      acc.mutu += Number(n.bobot_mutu || 0) * sks;
      return acc;
    },
    { sks: 0, mutu: 0 }
  );
  const khsLiveIps = khsLive.sks > 0 ? khsLive.mutu / khsLive.sks : 0;

  const khsColumns: ColumnDef<any>[] = [
    {
      key: 'no',
      label: 'NO',
      align: 'center',
      render: (_r, i) => <span className="font-mono text-xs">{(i || 0) + 1}</span>,
    },
    {
      key: 'mk',
      label: 'KODE & MATA KULIAH',
      render: (row) => {
        const mk = row.krs_detail?.kelas?.mata_kuliah;
        return (
          <div>
            <span className="font-bold text-slate-900 block text-xs">{mk?.nama || '-'}</span>
            <span className="font-mono text-2xs text-slate-400">{mk?.kode_mk || '-'}</span>
          </div>
        );
      },
    },
    {
      key: 'sks',
      label: 'SKS',
      align: 'center',
      render: (row) => <span className="font-mono font-bold text-xs">{row.krs_detail?.kelas?.mata_kuliah?.total_sks || 0}</span>,
    },
    {
      key: 'angka',
      label: 'ANGKA',
      align: 'center',
      render: (row) => <span className="font-mono text-xs">{Number(row.nilai_akhir || 0).toFixed(2)}</span>,
    },
    {
      key: 'huruf',
      label: 'HURUF',
      align: 'center',
      render: (row) => <Badge variant="gray" className="text-2xs font-bold">{row.nilai_huruf || '-'}</Badge>,
    },
    {
      key: 'mutu',
      label: 'MUTU',
      align: 'center',
      render: (row) => <span className="font-mono text-xs">{Number(row.bobot_mutu || 0).toFixed(2)}</span>,
    },
  ];

  const trxColumns: ColumnDef<any>[] = [
    {
      key: 'no',
      label: 'NO',
      align: 'center',
      render: (_r, i) => <span className="font-mono text-xs">{(i || 0) + 1}</span>,
    },
    {
      key: 'mk',
      label: 'KODE & MATA KULIAH',
      render: (item) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{item.nama_mk}</span>
          <span className="font-mono text-2xs text-slate-400">{item.kode_mk} • {item.semester_label}{item.is_transfer ? ' (Transfer)' : ''}</span>
        </div>
      ),
    },
    {
      key: 'sks',
      label: 'SKS',
      align: 'center',
      render: (item) => <span className="font-mono font-bold text-xs">{item.sks}</span>,
    },
    {
      key: 'huruf',
      label: 'NILAI',
      align: 'center',
      render: (item) => <Badge variant="gray" className="text-2xs font-bold">{item.nilai_huruf}</Badge>,
    },
    {
      key: 'kxm',
      label: 'SKS × MUTU',
      align: 'center',
      render: (item) => <span className="font-mono text-xs">{Number(item.mutu_x_sks).toFixed(2)}</span>,
    },
  ];

  const isKhs = mode === 'khs';

  const handlePrintDokumen = () => {
    if (typeof window === 'undefined') return;
    if (loading) {
      toast.error('Dokumen belum siap dicetak, tunggu hingga selesai dimuat');
      return;
    }
    window.print();
  };

  return (
    <div className="space-y-4">
      <div className="print:hidden">
        <PageHeader
          title={isKhs ? 'Cetak KHS' : 'Cetak Transkrip'}
          description={isKhs ? 'Pratinjau dokumen KHS semester sebelum dicetak.' : 'Pratinjau dokumen transkrip kumulatif sebelum dicetak.'}
          breadcrumbs={[
            { label: 'Portal SSO', href: '/dashboard' },
            { label: 'SIAKAD', href: '/siakad' },
            { label: 'Hasil Studi', href: '/siakad/hasil-studi' },
            { label: 'Cetak' },
          ]}
          action={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                icon={<ArrowLeft size={16} />}
                onClick={() => router.push('/siakad/hasil-studi')}
                style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
              >
                Kembali
              </Button>
              <Button variant="primary" icon={<Printer size={15} />} className="font-bold text-xs" onClick={handlePrintDokumen} disabled={loading}>
                Cetak (PDF)
              </Button>
            </div>
          }
        />
      </div>

      {loading ? (
        <p className="text-xs font-bold text-slate-400 animate-pulse print:hidden">Memuat dokumen...</p>
      ) : (
        <div className="printable-document bg-white border rounded-2xl p-6 space-y-4 text-xs text-slate-900 print:border-0 print:rounded-none">
          <div className="text-center border-b-2 border-slate-900 pb-3">
            <h2 className="font-black uppercase text-sm">{isKhs ? 'Kartu Hasil Studi (KHS)' : 'Transkrip Akademik'}</h2>
            <p className="font-bold">{mhs?.program_studi?.fakultas?.nama || 'Fakultas'} — {mhs?.program_studi?.nama}</p>
            {isKhs
              ? <p>Semester: <strong>{taLabel || '-'}</strong></p>
              : <p>Nomor: <strong className="font-mono">{dok?.nomor_dokumen || `TRX-${mhs?.nim}`}</strong></p>}
            {isKhs && dok && <p>Nomor: <strong className="font-mono">{dok.nomor_dokumen}</strong> • Diterbitkan: <strong>{dok.tanggal_terbit}</strong></p>}
            {!isKhs && <p>Tanggal cetak: <strong>{dok?.tanggal_terbit || transkrip?.ringkasan?.tanggal_cetak || new Date().toLocaleDateString('id-ID')}</strong></p>}
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            <p>Nama: <strong>{mhs?.nama_lengkap}</strong></p>
            <p>NIM: <strong className="font-mono">{mhs?.nim}</strong></p>
            <p>Program Studi: <strong>{mhs?.program_studi?.nama || '-'}</strong></p>
            <p>Angkatan: <strong>{mhs?.angkatan || '-'}</strong></p>
          </div>

          {isKhs ? (
            <DataTable columns={khsColumns} data={khsFinalRows} isLoading={false} emptyMessage="Belum ada nilai final pada semester ini." />
          ) : (
            <DataTable columns={trxColumns} data={transkrip?.items || []} isLoading={false} emptyMessage="Belum ada transkrip." />
          )}

          {isKhs ? (
            <p className="font-bold">Total SKS Semester (final): <span className="font-mono">{khsLive.sks}</span> • IPS{taLabel ? ` (${taLabel})` : ''}: <span className="font-mono">{khsLiveIps.toFixed(2)}</span></p>
          ) : (
            transkrip?.ringkasan && (
              <p className="font-bold">SKS Lulus: <span className="font-mono">{transkrip.ringkasan.total_sks_lulus}</span> • IPK: <span className="font-mono">{transkrip.ringkasan.ipk}</span> • {transkrip.ringkasan.predikat}</p>
            )
          )}

          {dokError && <p className="italic text-amber-700 print:hidden">{dokError}</p>}

          <div className="flex justify-between items-end pt-4">
            {dok?.qr_code_svg && (
              <div className="text-center">
                <img
                  src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(dok.qr_code_svg)}`}
                  alt="QR validasi dokumen"
                  className="inline-block border border-slate-300 p-2 bg-white"
                  width={132}
                  height={132}
                />
                <p className="font-mono text-2xs mt-1">Pindai untuk validasi</p>
              </div>
            )}
            <div className="text-center w-56">
              <p>Ditetapkan pada {dok?.tanggal_terbit || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <div className="h-16" />
              <p className="font-bold underline">( ........................................ )</p>
              <p>Ketua Program Studi</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CetakHasilStudiPage() {
  return (
    <Suspense fallback={<p className="text-xs font-bold text-slate-400 animate-pulse">Memuat...</p>}>
      <CetakHasilStudiContent />
    </Suspense>
  );
}
