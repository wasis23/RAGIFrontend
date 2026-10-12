'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, Play, Ban } from 'lucide-react';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import { formatRupiah } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export default function DetailKoreksiPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { hasPermission } = useAuth();
  const canApprove = hasPermission('sikeu.approval.approve');
  const canReject = hasPermission('sikeu.approval.reject');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await sikeuService.getKoreksiAlokasiDetail(id);
      setData(res?.data ?? null);
    } catch {
      toast.error('Gagal memuat detail koreksi');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const runAction = async () => {
    if (!confirm) return;
    setConfirmLoading(true);
    try {
      if (confirm === 'approve') await sikeuService.approveKoreksiAlokasi(id);
      if (confirm === 'apply') await sikeuService.applyKoreksiAlokasi(id);
      if (confirm === 'reject') await sikeuService.rejectKoreksiAlokasi(id);
      if (confirm === 'cancel') await sikeuService.cancelKoreksiAlokasi(id);
      toast.success('Aksi berhasil diproses');
      setConfirm(null);
      fetchDetail();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Gagal memproses aksi');
    } finally {
      setConfirmLoading(false);
    }
  };

  const detailColumns: ColumnDef<any>[] = [
    {
      key: 'from',
      label: 'DARI TAGIHAN',
      render: (row) => (
        <p className="text-xs font-mono font-bold text-slate-800">{row.from_tagihan?.nomor_tagihan ?? `#${row.from_tagihan_id}`}</p>
      ),
    },
    {
      key: 'to',
      label: 'KE TAGIHAN',
      render: (row) => (
        <p className="text-xs font-mono font-bold text-slate-800">{row.to_tagihan?.nomor_tagihan ?? `#${row.to_tagihan_id}`}</p>
      ),
    },
    {
      key: 'nominal',
      label: 'NOMINAL',
      render: (row) => <span className="text-xs font-bold tabular-nums">{formatRupiah(Number(row.nominal_dialihkan))}</span>,
    },
  ];

  const sim = data?.simulasi_terkini;

  return (
    <div className="w-full space-y-4">
      <PageHeader
        title={data ? `Koreksi ${data.nomor_koreksi}` : 'Detail Koreksi'}
        description={data?.alasan}
        backUrl="/sikeu/koreksi-alokasi"
        action={
          data && (
            <div className="flex items-center gap-2 flex-wrap">
              {data.status === 'pending' && canApprove && (
                <Button variant="primary" icon={<CheckCircle2 size={16} />} onClick={() => setConfirm('approve')} className="font-bold">
                  Setujui
                </Button>
              )}
              {data.status === 'pending' && canReject && (
                <Button variant="outline" icon={<XCircle size={16} />} onClick={() => setConfirm('reject')} className="font-bold">
                  Tolak
                </Button>
              )}
              {data.status === 'approved' && canApprove && (
                <Button variant="primary" icon={<Play size={16} />} onClick={() => setConfirm('apply')} className="font-bold">
                  Terapkan
                </Button>
              )}
              {(data.status === 'pending' || data.status === 'approved') && canReject && (
                <Button variant="outline" icon={<Ban size={16} />} onClick={() => setConfirm('cancel')} className="font-bold">
                  Batalkan
                </Button>
              )}
            </div>
          )
        }
      />

      {loading ? (
        <p className="text-xs text-slate-500">Memuat detail...</p>
      ) : !data ? (
        <p className="text-xs text-slate-500">Data tidak ditemukan.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white border border-slate-200 rounded-2xl">
              <p className="text-2xs font-bold text-slate-500">STATUS</p>
              <p className="text-xs font-bold text-slate-900 mt-1 uppercase">{data.status}</p>
            </div>
            <div className="p-4 bg-white border border-slate-200 rounded-2xl">
              <p className="text-2xs font-bold text-slate-500">TOTAL DIALIHKAN</p>
              <p className="text-xs font-bold text-slate-900 mt-1 tabular-nums">{formatRupiah(Number(data.total_nominal_dialihkan))}</p>
            </div>
            <div className="p-4 bg-white border border-slate-200 rounded-2xl">
              <p className="text-2xs font-bold text-slate-500">REFERENSI</p>
              <p className="text-xs font-bold text-slate-900 mt-1">{data.referensi || '-'}</p>
            </div>
            <div className="p-4 bg-white border border-slate-200 rounded-2xl">
              <p className="text-2xs font-bold text-slate-500">TAGIHAN KEKURANGAN</p>
              <p className="text-xs font-bold text-slate-900 mt-1">{data.tagihan_kekurangan?.length ?? 0} tagihan</p>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="font-bold text-sm">Rincian Perpindahan</h2>
            </div>
            <div className="card-body">
              <DataTable data={data.details ?? []} columns={detailColumns} emptyMessage="Tidak ada rincian." />
            </div>
          </div>

          {sim && !sim.error && (
            <div className="card">
              <div className="card-header">
                <h2 className="font-bold text-sm">Dampak Terkini per Target</h2>
              </div>
              <div className="card-body space-y-2 text-xs text-slate-700">
                {sim.dampak_target?.map((d: any) => (
                  <p key={d.to_tagihan_id}>
                    {d.nomor_tagihan}: sisa {formatRupiah(d.sisa_sebelum)} → <strong>{formatRupiah(d.sisa_setelah)}</strong>{' '}
                    {d.akan_lunas ? '(lunas)' : '(masih kurang)'}
                  </p>
                ))}
                {sim.ada_kekurangan && <p className="font-bold text-amber-800">{sim.usulan_tagihan_kekurangan}</p>}
              </div>
            </div>
          )}

          {data.tagihan_kekurangan?.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="font-bold text-sm">Tagihan Kekurangan Terbit</h2>
              </div>
              <div className="card-body space-y-2 text-xs">
                {data.tagihan_kekurangan.map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between gap-2 p-2.5 border border-slate-200 rounded-xl">
                    <span className="font-mono font-bold text-xs">{t.nomor_tagihan}</span>
                    <span className="font-bold tabular-nums text-xs">{formatRupiah(Number(t.total_tagihan))}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push('/sikeu/pembayaran-mahasiswa/tagihan')}
                      className="text-xs font-bold"
                    >
                      Lihat Tagihan
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        isOpen={confirm !== null}
        onClose={() => setConfirm(null)}
        onConfirm={runAction}
        title={confirm === 'apply' ? 'Terapkan Koreksi?' : confirm === 'approve' ? 'Setujui Koreksi?' : 'Lanjutkan Aksi?'}
        message={
          confirm === 'apply'
            ? 'Alokasi dipindahkan permanen. Tagihan kekurangan otomatis diterbitkan bila target masih bersisa.'
            : 'Pastikan aksi ini sudah diverifikasi bagian keuangan.'
        }
        confirmText="Ya, Lanjutkan"
        variant={confirm === 'reject' || confirm === 'cancel' ? 'danger' : 'primary'}
        isLoading={confirmLoading}
      />
    </div>
  );
}
