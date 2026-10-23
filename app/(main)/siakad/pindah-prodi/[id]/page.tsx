'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Wallet, CheckCircle2, XCircle, PlayCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

const cekSchema = z.object({
  hasil: z.enum(['layak', 'ada_tunggakan'], { error: 'Hasil cek wajib dipilih' }),
  catatan: z.string().max(1000, 'Maksimal 1000 karakter').nullable().optional(),
});

type CekValues = z.infer<typeof cekSchema>;

export default function DetailPindahProdiPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [item, setItem] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [dampak, setDampak] = useState<any | null>(null);
  const [loadingDampak, setLoadingDampak] = useState(false);

  const [isCekOpen, setIsCekOpen] = useState(false);
  const [confirm, setConfirm] = useState<'approve' | 'reject' | 'apply' | null>(null);
  const [working, setWorking] = useState(false);

  const { control, handleSubmit, reset, register, formState: { errors, isSubmitting } } = useForm<CekValues>({
    resolver: zodResolver(cekSchema),
    defaultValues: { hasil: 'layak' as const, catatan: null },
  });

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await siakadService.getPindahProdiDetail(id);
      setItem(res.data || null);
    } catch {
      toast.error('Gagal memuat detail pengajuan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleDampak = async () => {
    if (!item?.mahasiswa_id) return;
    try {
      setLoadingDampak(true);
      const res = await siakadService.getPindahProdiDampak(item.mahasiswa_id);
      setDampak(res.data || null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memuat dampak tunggakan');
    } finally {
      setLoadingDampak(false);
    }
  };

  const onCek = async (values: CekValues) => {
    try {
      await siakadService.cekKeuanganPindahProdi(id, { hasil: values.hasil, catatan: values.catatan ?? undefined });
      toast.success('Hasil cek keuangan tersimpan');
      setIsCekOpen(false);
      reset({ hasil: 'layak', catatan: null });
      fetchDetail();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan cek keuangan');
    }
  };

  const handleConfirm = async () => {
    if (!confirm) return;
    try {
      setWorking(true);
      if (confirm === 'approve') {
        await siakadService.approvePindahProdi(id);
        toast.success('Pengajuan disetujui');
      } else if (confirm === 'reject') {
        await siakadService.rejectPindahProdi(id);
        toast.success('Pengajuan ditolak');
      } else {
        await siakadService.applyPindahProdi(id);
        toast.success('Mutasi diterapkan, konteks SIKEU dicatat otomatis');
      }
      setConfirm(null);
      fetchDetail();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Aksi gagal');
    } finally {
      setWorking(false);
    }
  };

  const tagihanColumns: ColumnDef<any>[] = [
    {
      key: 'tagihan',
      label: 'TAGIHAN',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-slate-900 block text-xs">{row.nomor_tagihan}</span>
          <span className="text-2xs text-slate-500">Semester {row.semester} • {row.status}</span>
        </div>
      ),
    },
    {
      key: 'sisa',
      label: 'SISA',
      align: 'right',
      render: (row) => <span className="font-mono font-bold text-xs">Rp {Number(row.sisa || 0).toLocaleString('id-ID')}</span>,
    },
  ];

  const isPending = item?.status === 'pending';
  const isApproved = item?.status === 'approved';
  const bisaCekApprove = isPending;
  const bisaApply = isApproved;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-slate-400">
        <span className="text-xs font-bold animate-pulse">Memuat detail pengajuan...</span>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="space-y-4">
        <PageHeader title="Detail Pindah Prodi" breadcrumbs={[{ label: 'Pindah Prodi', href: '/siakad/pindah-prodi' }, { label: 'Tidak ditemukan' }]} />
        <p className="text-xs text-slate-500">Data pengajuan tidak ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={`Pindah Prodi — ${item.mahasiswa?.nama_lengkap || ''}`}
        description={`${item.mahasiswa?.nim || ''} • Status: ${item.status}`}
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Pindah Prodi', href: '/siakad/pindah-prodi' },
          { label: 'Detail' },
        ]}
        action={
          <Button
            variant="outline"
            icon={<ArrowLeft size={16} />}
            onClick={() => router.push('/siakad/pindah-prodi')}
            style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
          >
            Kembali
          </Button>
        }
      />

      <div className="bg-white border rounded-2xl p-5 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-xs">
        <p>Prodi Asal: <strong>{item.prodi_lama?.nama || item.mahasiswa?.program_studi?.nama || '-'}</strong></p>
        <p>Prodi Tujuan: <strong>{item.prodi_baru?.nama || '-'}</strong></p>
        <p>Semester Efektif: <strong>{item.semester_efektif || '-'}</strong></p>
        <p>Tanggal Efektif: <strong>{item.tanggal_efektif || '-'}</strong></p>
        <p className="md:col-span-2">Alasan: <strong>{item.alasan}</strong></p>
        <p>
          Cek Keuangan:{' '}
          {item.hasil_cek_keuangan
            ? <Badge variant={item.hasil_cek_keuangan === 'layak' ? 'green' : 'amber'} className="text-2xs font-bold">{item.hasil_cek_keuangan}</Badge>
            : <span className="italic text-slate-400">belum dicek</span>}
        </p>
        <p>Referensi Surat: <strong className="font-mono">{item.referensi_surat || '-'}</strong></p>
      </div>

      <div className="bg-white border rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-extrabold">Alur Persetujuan</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" icon={<Wallet size={15} />} className="font-bold text-xs min-h-[38px]" onClick={handleDampak} loading={loadingDampak}>
              Pratinjau Tunggakan
            </Button>
            <Button variant="outline" icon={<CheckCircle2 size={15} />} className="font-bold text-xs min-h-[38px]" onClick={() => setIsCekOpen(true)} disabled={!bisaCekApprove} title={!bisaCekApprove ? 'Hanya pengajuan pending yang bisa dicek' : 'Sign-off keuangan'}>
              Cek Keuangan
            </Button>
            <Button variant="primary" icon={<CheckCircle2 size={15} />} className="font-bold text-xs min-h-[38px]" onClick={() => setConfirm('approve')} disabled={!bisaCekApprove || !item?.hasil_cek_keuangan} title={!item?.hasil_cek_keuangan ? 'Wajib sign-off keuangan dulu' : 'Setujui pengajuan'}>
              Setujui
            </Button>
            <Button variant="outline" icon={<XCircle size={15} />} className="font-bold text-xs min-h-[38px]" onClick={() => setConfirm('reject')} disabled={!bisaCekApprove && !isApproved}>
              Tolak
            </Button>
            <Button variant="outline" icon={<PlayCircle size={15} />} className="font-bold text-xs min-h-[38px]" onClick={() => setConfirm('apply')} disabled={!bisaApply} title={!bisaApply ? 'Hanya yang sudah disetujui yang bisa diterapkan' : 'Terapkan mutasi'}>
              Terapkan Mutasi
            </Button>
          </div>
        </div>

        {dampak && (
          <div className="space-y-3">
            <p className="text-xs">
              Total sisa aktif: <strong className="font-mono">Rp {Number(dampak.total_sisa_aktif || 0).toLocaleString('id-ID')}</strong>
              {' • '}{dampak.layak_tanpa_catatan ? <Badge variant="green" className="text-2xs font-bold">Layak tanpa catatan</Badge> : <Badge variant="amber" className="text-2xs font-bold">Ada tunggakan aktif</Badge>}
            </p>
            <DataTable columns={tagihanColumns} data={dampak.tagihan_aktif || []} emptyMessage="Tidak ada tunggakan aktif." />
          </div>
        )}
      </div>

      <Modal open={isCekOpen} onClose={() => setIsCekOpen(false)} title="Sign-off Keuangan">
        <form onSubmit={handleSubmit(onCek)} noValidate className="space-y-4">
          <Controller
            name="hasil"
            control={control}
            render={({ field }) => (
              <Select
                label="Hasil Cek"
                required
                options={[
                  { value: 'layak', label: 'Layak — tanpa tunggakan menghambat' },
                  { value: 'ada_tunggakan', label: 'Ada tunggakan — perlu penyelesaian' },
                ]}
                value={field.value || ''}
                onChange={(v: any) => field.onChange(v)}
                error={errors.hasil?.message}
              />
            )}
          />
          <Textarea label="Catatan Keuangan" placeholder="Catatan sign-off (opsional)" error={errors.catatan?.message} {...register('catatan')} />
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsCekOpen(false)}>Batal</Button>
            <Button type="submit" variant="primary" loading={isSubmitting} disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan Hasil Cek'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={handleConfirm}
        title={confirm === 'approve' ? 'Setujui Pengajuan?' : confirm === 'reject' ? 'Tolak Pengajuan?' : 'Terapkan Mutasi?'}
        message={
          confirm === 'apply'
            ? 'Prodi mahasiswa akan dimutasi dan event konteks penagihan dikirim ke SIKEU. Aksi ini tidak dapat dibatalkan.'
            : `Pengajuan pindah prodi ${item.mahasiswa?.nama_lengkap} akan ${confirm === 'approve' ? 'disetujui' : 'ditolak'}.`
        }
        confirmText={confirm === 'approve' ? 'Ya, Setujui' : confirm === 'reject' ? 'Ya, Tolak' : 'Ya, Terapkan'}
        variant={confirm === 'reject' ? 'danger' : 'primary'}
        isLoading={working}
      />
    </div>
  );
}
