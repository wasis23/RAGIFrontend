'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, ArrowLeft, CheckCircle, Inbox } from 'lucide-react';
import { sikeuService } from '@/services/sikeu.service';
import { PemasukanKampus } from '@/types/sikeu.types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';

export default function PemasukanListPage() {
  const [pemasukanList, setPemasukanList] = useState<PemasukanKampus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPemasukan = async () => {
      setLoading(true);
      try {
        const res = await sikeuService.getPemasukanList();
        if (res.data) {
          setPemasukanList(res.data);
        }
      } catch (err) {
        console.error('Failed to load pemasukan list', err);
      } finally {
        setLoading(false);
      }
    };
    loadPemasukan();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daftar Pemasukan Kampus & Hibah"
        description="Rekapitulasi penerimaan dana hibah penelitian (SIPPM), donatur, kerjasama & pendapatan non-akademik"
        action={
          <div className="flex items-center gap-2">
            <Link href="/sikeu" className="btn btn-secondary btn-icon">
              <ArrowLeft size={18} />
            </Link>
            <Link href="/sikeu/pemasukan/create" className="btn btn-primary">
              <Plus size={16} /> Catat Pemasukan Hibah
            </Link>
          </div>
        }
      />

      <Card>
        <CardBody>
          {loading ? (
            <EmptyState title="Memuat data..." description="Sedang memuat data pemasukan..." />
          ) : pemasukanList.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>No. Transaksi</th>
                    <th>Sumber Pemasukan</th>
                    <th>Donor / Instansi</th>
                    <th className="text-right">Nominal</th>
                    <th>Tgl Terima</th>
                    <th className="text-center">Status Jurnal</th>
                  </tr>
                </thead>
                <tbody>
                  {pemasukanList.map((item) => (
                    <tr key={item.id}>
                      <td className="font-mono font-medium text-emerald-600">{item.nomor_transaksi}</td>
                      <td>
                        <Badge variant="green" className="capitalize">
                          {item.sumber_pemasukan.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="font-medium text-slate-900">{item.nama_donor_instansi}</td>
                      <td className="text-right font-bold text-slate-900">
                        Rp {Number(item.nominal).toLocaleString('id-ID')}
                      </td>
                      <td>{item.tanggal_terima}</td>
                      <td className="text-center">
                        <Badge variant="green">
                          <CheckCircle size={12} /> Auto-Posted
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={<Inbox size={40} />}
              title="Belum ada pemasukan"
              description="Belum ada pencatatan pemasukan dana hibah. Klik tombol Catat Pemasukan Hibah untuk menambahkan."
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
