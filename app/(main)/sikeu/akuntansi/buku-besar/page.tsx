'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { sikeuService } from '@/services/sikeu.service';
import { AkunKeuangan, DetailJurnalUmum } from '@/types/sikeu.types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';

export default function BukuBesarPage() {
  const [coaList, setCoaList] = useState<AkunKeuangan[]>([]);
  const [selectedAkunId, setSelectedAkunId] = useState<number | undefined>(undefined);
  const [glItems, setGlItems] = useState<DetailJurnalUmum[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCoa = async () => {
      try {
        const res = await sikeuService.getCoaList();
        if (res.data) setCoaList(res.data);
      } catch (err) {
        console.error('Failed to load COA', err);
      }
    };
    loadCoa();
  }, []);

  useEffect(() => {
    const loadGl = async () => {
      setLoading(true);
      try {
        const res = await sikeuService.getBukuBesar(selectedAkunId);
        if (res.data) setGlItems(res.data);
      } catch (err) {
        console.error('Failed to load Buku Besar', err);
      } finally {
        setLoading(false);
      }
    };
    loadGl();
  }, [selectedAkunId]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Buku Besar & Mutasi Akun (General Ledger)"
        description="Rincian histori mutasi debet/kredit dan saldo berjalan per akun COA"
        action={
          <Link href="/sikeu/akuntansi/jurnal" className="btn btn-secondary btn-icon">
            <ArrowLeft size={18} />
          </Link>
        }
      />

      <Card>
        <CardBody>
          <Select
            label="Filter Akun COA:"
            options={[
              { value: '', label: '-- Semua Akun Keuangan --' },
              ...coaList.map((a) => ({ value: String(a.id), label: `[${a.kode_akun}] ${a.nama_akun} (${a.kelompok.toUpperCase()})` })),
            ]}
            value={selectedAkunId ? String(selectedAkunId) : ''}
            onChange={(val: any) => setSelectedAkunId(val ? Number(val) : undefined)}
          />
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          {loading ? (
            <EmptyState title="Memuat data..." description="Sedang memuat data Buku Besar..." />
          ) : glItems.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Kode Akun</th>
                    <th>Nama Akun</th>
                    <th>Keterangan</th>
                    <th className="text-right">Debet (Rp)</th>
                    <th className="text-right">Kredit (Rp)</th>
                  </tr>
                </thead>
                <tbody>
                  {glItems.map((item) => (
                    <tr key={item.id}>
                      <td>{item.jurnal?.tanggal_jurnal || '-'}</td>
                      <td className="font-mono font-bold text-purple-600">{item.akun?.kode_akun}</td>
                      <td className="font-medium text-slate-900">{item.akun?.nama_akun}</td>
                      <td>{item.keterangan || item.jurnal?.keterangan}</td>
                      <td className="text-right font-mono font-semibold text-emerald-700">
                        {Number(item.debet) > 0 ? `Rp ${Number(item.debet).toLocaleString('id-ID')}` : '-'}
                      </td>
                      <td className="text-right font-mono font-semibold text-indigo-700">
                        {Number(item.kredit) > 0 ? `Rp ${Number(item.kredit).toLocaleString('id-ID')}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={<BookOpen size={40} />}
              title="Tidak ada mutasi"
              description="Tidak ada mutasi buku besar untuk akun yang dipilih."
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
