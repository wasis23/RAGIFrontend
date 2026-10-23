'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Printer } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

function CetakKartuContent() {
  const params = useSearchParams();
  const router = useRouter();
  const tipe = params.get('tipe') === 'UAS' ? 'UAS' : 'UTS';
  const mhsParam = params.get('mhs') ? Number(params.get('mhs')) : undefined;
  const taParam = params.get('ta') ? Number(params.get('ta')) : undefined;

  const [kartu, setKartu] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const terbitkan = async () => {
      try {
        setLoading(true);
        const res = await siakadService.getKartuUjian({ tipe_ujian: tipe as 'UTS' | 'UAS', mahasiswa_id: mhsParam, tahun_akademik_id: taParam });
        setKartu(res.data || null);
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Gagal menerbitkan kartu ujian');
      } finally {
        setLoading(false);
      }
    };
    terbitkan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mhs = kartu?.mahasiswa;

  const handlePrintKartu = () => {
    if (typeof window === 'undefined') return;
    if (loading || !kartu) {
      toast.error('Kartu belum siap dicetak, tunggu hingga selesai diterbitkan');
      return;
    }
    window.print();
  };

  const jadwalColumns: ColumnDef<any>[] = [
    {
      key: 'no',
      label: 'NO',
      align: 'center',
      render: (_r, i) => <span className="font-mono text-xs">{(i || 0) + 1}</span>,
    },
    {
      key: 'mk',
      label: 'KODE & MATA KULIAH',
      render: (j) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{j.nama_mk}</span>
          <span className="font-mono text-2xs text-slate-400">{j.kode_mk}</span>
        </div>
      ),
    },
    {
      key: 'kelas',
      label: 'KELAS',
      render: (j) => <span className="text-xs">{j.kelas}</span>,
    },
    {
      key: 'jadwal',
      label: 'JADWAL',
      render: (j) => <span className="text-xs capitalize">{j.hari || '-'} {j.jam || ''}</span>,
    },
    {
      key: 'ruang',
      label: 'RUANG',
      render: (j) => <span className="text-xs">{j.ruangan || '-'}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="print:hidden">
        <PageHeader
          title={`Cetak Kartu ${tipe}`}
          description="Pratinjau kartu peserta ujian sebelum dicetak."
          breadcrumbs={[
            { label: 'Portal SSO', href: '/dashboard' },
            { label: 'SIAKAD', href: '/siakad' },
            { label: 'Kartu Ujian', href: '/siakad/kartu-ujian' },
            { label: 'Cetak' },
          ]}
          action={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                icon={<ArrowLeft size={16} />}
                onClick={() => router.push('/siakad/kartu-ujian')}
                style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
              >
                Kembali
              </Button>
              <Button variant="primary" icon={<Printer size={15} />} className="font-bold text-xs" onClick={handlePrintKartu} disabled={loading || !kartu}>
                Cetak (PDF)
              </Button>
            </div>
          }
        />
      </div>

      {loading ? (
        <p className="text-xs font-bold text-slate-400 animate-pulse print:hidden">Menerbitkan kartu...</p>
      ) : kartu ? (
        <div className="printable-document bg-white border-2 border-slate-900 rounded-2xl p-6 space-y-4 text-xs text-slate-900 print:border-0 print:rounded-none">
          <div className="text-center border-b-2 border-slate-900 pb-3">
            <h2 className="font-black uppercase text-sm">Kartu Peserta Ujian {kartu.tipe_ujian}</h2>
            <p className="font-bold">{mhs?.program_studi?.fakultas?.nama || 'Fakultas'} — {mhs?.program_studi?.nama}</p>
            <p>Tahun Akademik: <strong>{kartu.tahun_akademik?.nama}</strong></p>
          </div>
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 flex-1">
              <p>Nama: <strong>{mhs?.nama_lengkap}</strong></p>
              <p>NIM: <strong className="font-mono">{mhs?.nim}</strong></p>
              <p>Angkatan: <strong>{mhs?.angkatan || '-'}</strong></p>
              <p>Status Keuangan: <strong>LUNAS</strong></p>
            </div>
            {kartu.qr_code_svg && (
              <div className="text-center shrink-0">
                <img
                  src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(kartu.qr_code_svg)}`}
                  alt="QR validasi kartu ujian"
                  className="inline-block border border-slate-300 p-2 bg-white"
                  width={132}
                  height={132}
                />
                <p className="font-mono text-2xs mt-1">Pindai untuk validasi</p>
              </div>
            )}
          </div>
          <DataTable columns={jadwalColumns} data={kartu.jadwal || []} isLoading={false} emptyMessage="Tidak ada jadwal ujian." />
          <div className="flex justify-between items-end pt-4">
            <p className="italic">Dicetak: {kartu.tanggal_cetak || '-'} • Berlaku untuk {kartu.tipe_ujian} {kartu.tahun_akademik?.nama}</p>
            <div className="text-center w-56">
              <p>Pengawas Ujian</p>
              <div className="h-16" />
              <p className="font-bold underline">( ........................................ )</p>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-500 print:hidden">Kartu tidak dapat diterbitkan (cek syarat keuangan / status akademik).</p>
      )}
    </div>
  );
}

export default function CetakKartuPage() {
  return (
    <Suspense fallback={<p className="text-xs font-bold text-slate-400 animate-pulse">Memuat...</p>}>
      <CetakKartuContent />
    </Suspense>
  );
}
