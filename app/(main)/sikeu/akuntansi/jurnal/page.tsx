'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, ArrowLeft, BookOpen, CheckCircle, Inbox } from 'lucide-react';
import { sikeuService } from '@/services/sikeu.service';
import { JurnalUmum } from '@/types/sikeu.types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';

export default function JurnalListPage() {
  const [jurnalList, setJurnalList] = useState<JurnalUmum[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadJurnal = async () => {
      setLoading(true);
      try {
        const res = await sikeuService.getJurnalList();
        if (res.data) setJurnalList(res.data);
      } catch (err) {
        console.error('Failed to load jurnal', err);
      } finally {
        setLoading(false);
      }
    };
    loadJurnal();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jurnal Umum & Auto-Journal Feed"
        description="Rekapitulasi pencatatan jurnal transaksi otomatis & penyesuaian manual"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/sikeu" className="btn btn-secondary btn-icon">
              <ArrowLeft size={18} />
            </Link>
            <Link href="/sikeu/akuntansi/coa" className="btn btn-secondary">
              Master COA
            </Link>
            <Link href="/sikeu/akuntansi/buku-besar" className="btn btn-secondary">
              <BookOpen size={16} /> Buku Besar
            </Link>
            <Link href="/sikeu/akuntansi/jurnal/create" className="btn btn-primary">
              <Plus size={16} /> Entry Jurnal Manual
            </Link>
          </div>
        }
      />

      <Card>
        <CardBody>
          {loading ? (
            <EmptyState title="Memuat data..." description="Sedang memuat data jurnal..." />
          ) : jurnalList.length > 0 ? (
            <div className="space-y-6">
              {jurnalList.map((j) => (
                <div key={j.id} className="border border-slate-200 rounded-xl p-5 space-y-3 bg-slate-50/30">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-indigo-600 text-base">{j.nomor_jurnal}</span>
                      <Badge variant="indigo" className="capitalize">
                        {j.jenis_sumber.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-slate-400">| Tgl: {j.tanggal_jurnal}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">Total: <strong className="text-slate-900">Rp {Number(j.total_debet).toLocaleString('id-ID')}</strong></span>
                      <Badge variant="green">
                        <CheckCircle size={12} /> Posted
                      </Badge>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600">{j.keterangan}</p>

                  {j.details && j.details.length > 0 && (
                    <div className="table-container">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Kode & Nama Akun COA</th>
                            <th className="text-right">Debet (Rp)</th>
                            <th className="text-right">Kredit (Rp)</th>
                            <th>Catatan Baris</th>
                          </tr>
                        </thead>
                        <tbody>
                          {j.details.map((d) => (
                            <tr key={d.id}>
                              <td className="font-medium text-slate-900">
                                [{d.akun?.kode_akun || '-'}] {d.akun?.nama_akun || 'Akun'}
                              </td>
                              <td className="text-right font-mono font-semibold text-emerald-700">
                                {Number(d.debet) > 0 ? `Rp ${Number(d.debet).toLocaleString('id-ID')}` : '-'}
                              </td>
                              <td className="text-right font-mono font-semibold text-indigo-700">
                                {Number(d.kredit) > 0 ? `Rp ${Number(d.kredit).toLocaleString('id-ID')}` : '-'}
                              </td>
                              <td className="text-slate-500">{d.keterangan || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Inbox size={40} />}
              title="Belum ada jurnal"
              description="Belum ada data jurnal. Lakukan pencatatan tagihan, pembayaran, atau pemasukan hibah untuk meng-generate jurnal otomatis."
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
