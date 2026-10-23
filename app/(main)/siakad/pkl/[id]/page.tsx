'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Briefcase,
  Building,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Star,
  Plus,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { siakadService } from '@/services/siakad.service';
import {
  PklLogbookSchema,
  PklPenilaianSchema,
  type PklLogbookFormValues,
  type PklPenilaianFormValues,
} from '@/lib/validations/siakad-pipeline.schema';
import toast from 'react-hot-toast';

export default function PklDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const pklId = Number(resolvedParams.id);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [pkl, setPkl] = useState<any | null>(null);

  // Logbook list & loading
  const [logbooks, setLogbooks] = useState<any[]>([]);
  const [logbookLoading, setLogbookLoading] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(false);

  // Modals for actions
  const [openLogbookModal, setOpenLogbookModal] = useState(false);
  const [openNilaiModal, setOpenNilaiModal] = useState(false);

  // React Hook Form: Logbook
  const {
    register: regLog,
    handleSubmit: handleSubLog,
    reset: resetLogForm,
    formState: { errors: errorsLog },
  } = useForm<PklLogbookFormValues>({
    resolver: zodResolver(PklLogbookSchema),
    defaultValues: {
      tanggal: new Date().toISOString().split('T')[0],
      aktivitas: '',
      target_capaian: '',
      kendala: '',
    },
  });

  // React Hook Form: Penilaian PKL
  const {
    register: regNilai,
    handleSubmit: handleSubNilai,
    reset: resetNilaiForm,
    formState: { errors: errorsNilai },
  } = useForm<PklPenilaianFormValues>({
    resolver: zodResolver(PklPenilaianSchema),
    defaultValues: {
      nilai_lapangan_total: 80,
      nilai_dosen_bimbingan: 80,
      nilai_dosen_laporan: 80,
      nilai_dosen_presentasi: 80,
      catatan_dosen: '',
    },
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await siakadService.getPklDetail(pklId);
      if (res?.data) {
        setPkl(res.data);
      }
    } catch {
      toast.error('Gagal memuat detail PKL');
    } finally {
      setLoading(false);
    }
  }, [pklId]);

  const loadLogbooks = useCallback(async () => {
    try {
      setLogbookLoading(true);
      const res = await siakadService.getPklLogbook(pklId);
      setLogbooks(res?.data || []);
    } catch {
      toast.error('Gagal memuat logbook');
    } finally {
      setLogbookLoading(false);
    }
  }, [pklId]);

  useEffect(() => {
    if (pklId) {
      loadData();
      loadLogbooks();
    }
  }, [pklId, loadData, loadLogbooks]);

  const onSubmitLogbook = async (values: PklLogbookFormValues) => {
    try {
      setSubmittingAction(true);
      const res = await siakadService.createPklLogbook(pklId, values);
      toast.success(res?.message || 'Aktivitas logbook berhasil dicatat');
      resetLogForm();
      setOpenLogbookModal(false);
      await loadLogbooks();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menambahkan logbook');
    } finally {
      setSubmittingAction(false);
    }
  };

  const onSubmitNilai = async (values: PklPenilaianFormValues) => {
    try {
      setSubmittingAction(true);
      const res = await siakadService.savePklPenilaian(pklId, values);
      toast.success(res?.message || 'Penilaian PKL berhasil disimpan');
      resetNilaiForm();
      await loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan nilai PKL');
    } finally {
      setSubmittingAction(false);
    }
  };

  const logbookColumns: ColumnDef<any>[] = [
    {
      key: 'tanggal',
      label: 'TANGGAL',
      render: (row) => <span className="font-mono text-2xs text-slate-600">{row.tanggal}</span>,
    },
    {
      key: 'aktivitas',
      label: 'AKTIVITAS & TARGET',
      render: (row) => (
        <div className="space-y-0.5">
          <span className="text-xs text-slate-900 font-medium block">{row.aktivitas}</span>
          {row.target_capaian && (
            <span className="text-2xs text-emerald-600 block">Target: {row.target_capaian}</span>
          )}
          {row.kendala && (
            <span className="text-2xs text-rose-500 block">Kendala: {row.kendala}</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'STATUS VERIFIKASI',
      align: 'center',
      render: (row) => {
        const v = row.status_verifikasi || 'pending';
        return (
          <Badge
            variant={v === 'disetujui' ? 'green' : v === 'revisi' ? 'red' : 'amber'}
            className="text-2xs font-semibold capitalize"
          >
            {v}
          </Badge>
        );
      },
    },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <DropdownMenu
          items={[
            {
              label: 'Verifikasi Setuju',
              icon: <CheckCircle2 size={14} />,
              onClick: async () => {
                if (!pklId || !row.id) return;
                try {
                  await siakadService.verifyPklLogbook(pklId, row.id, {
                    status_verifikasi: 'disetujui',
                  });
                  toast.success(`Logbook tanggal ${row.tanggal} berhasil disetujui`);
                  loadLogbooks();
                } catch (err: any) {
                  toast.error(err?.response?.data?.message || 'Gagal memverifikasi logbook');
                }
              },
            },
          ]}
        />
      ),
    },
  ];

  const status = pkl?.status || 'draft';
  const statusVariant =
    status === 'dinilai' || status === 'disetujui'
      ? 'green'
      : status === 'ditolak'
      ? 'red'
      : status === 'sedang_berjalan'
      ? 'cyan'
      : 'amber';

  return (
    <div className="space-y-6">
      <PageHeader
        title={pkl ? `PKL: ${pkl.instansi_nama}` : 'Detail Pelaksanaan PKL'}
        description="Rincian informasi instansi mitra, dosen pembimbing, logbook aktivitas, dan lembar penilaian."
        backUrl="/siakad/pkl"
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Praktek Lapangan', href: '/siakad/pkl' },
          { label: pkl?.instansi_nama || 'Detail' },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<Star size={14} />}
              onClick={() => setOpenNilaiModal(true)}
              className="text-xs font-bold border-[var(--module-primary)] text-[var(--module-primary)] hover:bg-[var(--module-primary-subtle)]"
            >
              Input / Review Nilai
            </Button>
            <Button
              variant="primary"
              icon={<Plus size={14} />}
              onClick={() => setOpenLogbookModal(true)}
              className="text-xs font-bold"
            >
              Tambah Logbook
            </Button>
          </div>
        }
      />

      {/* Ringkasan Profil PKL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader className="p-4 border-b border-slate-200 flex flex-row items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Informasi Pelaksanaan & Mahasiswa
              </h2>
              <p className="text-2xs text-slate-500">Data pendaftaran dan penugasan pembimbing.</p>
            </div>
            <Badge variant={statusVariant} className="text-2xs uppercase font-bold">
              {String(status).replace(/_/g, ' ')}
            </Badge>
          </CardHeader>
          <CardBody className="p-4 space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-2xs text-slate-500 block">Mahasiswa</span>
                <span className="font-bold text-slate-900">
                  {pkl?.mahasiswa?.nama_lengkap || pkl?.nama_mahasiswa || '-'}
                </span>
                <span className="text-2xs text-slate-500 block font-mono">
                  NIM: {pkl?.mahasiswa?.nim || '-'} • {pkl?.program_studi?.nama || 'Prodi'}
                </span>
              </div>
              <div>
                <span className="text-2xs text-slate-500 block">Jenis Program</span>
                <span className="font-semibold text-slate-800 capitalize">
                  {String(pkl?.jenis || 'pkl_reguler').replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-2xs text-slate-500 block">Perusahaan / Instansi</span>
                <span className="font-bold text-slate-900 block">{pkl?.instansi_nama || '-'}</span>
                <span className="text-2xs text-slate-600 block">
                  {pkl?.instansi_alamat ? `${pkl.instansi_alamat}, ` : ''}{pkl?.instansi_kota || '-'}
                </span>
              </div>
              <div>
                <span className="text-2xs text-slate-500 block">Periode Magang</span>
                <span className="font-mono text-xs font-semibold text-slate-800">
                  {pkl?.tanggal_mulai || '-'} s.d {pkl?.tanggal_selesai || '-'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-2xs text-slate-500 block">Pembimbing Lapangan</span>
                <span className="font-medium text-slate-900 block">
                  {pkl?.pembimbing_lapangan_nama || '-'}
                </span>
                <span className="text-2xs text-slate-500 block">
                  {pkl?.pembimbing_lapangan_jabatan || 'Mentor'} • {pkl?.pembimbing_lapangan_kontak || '-'}
                </span>
              </div>
              <div>
                <span className="text-2xs text-slate-500 block">Dosen Pembimbing Akademik/PKL</span>
                <span className="font-medium text-slate-900 block">
                  {pkl?.dosen_pembimbing?.nama_lengkap || 'Belum diplot Kaprodi'}
                </span>
                <span className="text-2xs text-slate-500 font-mono block">
                  NIP: {pkl?.dosen_pembimbing?.nip || '-'}
                </span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Kartu Ringkasan Nilai Akhir */}
        <Card>
          <CardHeader className="p-4 border-b border-slate-200">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Rekapitulasi Nilai Akhir
            </h2>
          </CardHeader>
          <CardBody className="p-4 space-y-4 text-center">
            <div className="p-4 rounded-xl border border-slate-200 bg-[var(--module-primary-subtle)]">
              <p className="text-2xs font-semibold uppercase tracking-wider text-[var(--module-primary)]">
                Nilai Akhir
              </p>
              <p className="text-2xl font-black mt-1 font-mono text-[var(--module-primary)]">
                {pkl?.penilaian?.nilai_angka_akhir ?? pkl?.nilai_angka_akhir ?? '-'}
                {pkl?.penilaian?.nilai_huruf_akhir ? ` (${pkl.penilaian.nilai_huruf_akhir})` : ''}
              </p>
              <span className="text-2xs text-slate-500">Bobot 40% Lapangan + 60% Dosen</span>
            </div>

            <div className="space-y-2 text-left text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Skor Lapangan (40%)</span>
                <span className="font-mono font-bold">{pkl?.penilaian?.nilai_lapangan_total ?? '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Bimbingan Dosen</span>
                <span className="font-mono font-bold">{pkl?.penilaian?.nilai_dosen_bimbingan ?? '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Laporan Akhir</span>
                <span className="font-mono font-bold">{pkl?.penilaian?.nilai_dosen_laporan ?? '-'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Presentasi Ujian</span>
                <span className="font-mono font-bold">{pkl?.penilaian?.nilai_dosen_presentasi ?? '-'}</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Tabel Logbook Harian / Mingguan */}
      <Card>
          <CardHeader className="p-4 flex flex-row items-center justify-between border-b border-slate-200">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Riwayat Logbook Aktivitas Mahasiswa ({logbooks.length})
              </h2>
              <p className="text-2xs text-slate-500">
                Catatan harian kegiatan praktis dan verifikasi dosen pembimbing.
              </p>
            </div>
          </CardHeader>
      <CardBody className="p-0">
      <DataTable
        columns={logbookColumns}
        data={logbooks}
        isLoading={logbookLoading}
        emptyMessage="Belum ada aktivitas harian yang dicatat pada logbook PKL ini."
      />
      </CardBody>
      </Card>

      {/* Modal Input Logbook */}
      <Modal
      isOpen={openLogbookModal}
      onClose={() => setOpenLogbookModal(false)}
      title="Catat Aktivitas Logbook PKL"
      size="lg"
      >
      <form onSubmit={handleSubLog(onSubmitLogbook)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input
          label="Tanggal Kegiatan"
          type="date"
          {...regLog('tanggal')}
          error={errorsLog.tanggal?.message}
        />
        <div className="sm:col-span-2">
          <Input
            label="Target Capaian"
            placeholder="Target hasil capaian kegiatan..."
            {...regLog('target_capaian')}
            error={errorsLog.target_capaian?.message}
          />
        </div>
      </div>
      <Textarea
        label="Uraian Aktivitas Pelaksanaan"
        placeholder="Jelaskan pekerjaan atau tugas yang dikerjakan secara rinci..."
        {...regLog('aktivitas')}
        error={errorsLog.aktivitas?.message}
        rows={3}
      />
      <Input
        label="Kendala / Masalah (Opsional)"
        placeholder="Kendala teknis atau operasional..."
        {...regLog('kendala')}
        error={errorsLog.kendala?.message}
      />
      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpenLogbookModal(false)}
          className="text-xs"
        >
          Batal
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={submittingAction}
          className="text-xs font-bold"
        >
          Simpan Logbook
        </Button>
      </div>
      </form>
      </Modal>

      {/* Modal Input Penilaian PKL */}
      <Modal
        isOpen={openNilaiModal}
        onClose={() => setOpenNilaiModal(false)}
        title="Penilaian Komprehensif PKL"
        size="md"
      >
        <form onSubmit={handleSubNilai(onSubmitNilai)} className="space-y-4">
          <p className="text-2xs text-slate-500">
            Penilaian terdiri dari bobot nilai pembimbing lapangan (40%) dan dosen pembimbing (60%).
          </p>

          <div className="p-3 bg-slate-50 rounded-xl space-y-3 border border-slate-200">
            <h4 className="text-2xs font-bold text-slate-700 uppercase">1. Nilai Pembimbing Lapangan (40%)</h4>
            <Input
              label="Skor Total Lapangan (0 - 100)"
              type="number"
              step="0.1"
              {...regNilai('nilai_lapangan_total', { valueAsNumber: true })}
              error={errorsNilai.nilai_lapangan_total?.message}
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl space-y-3 border border-slate-200">
            <h4 className="text-2xs font-bold text-slate-700 uppercase">2. Nilai Dosen Pembimbing (60%)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Input
                label="Bimbingan"
                type="number"
                step="0.1"
                {...regNilai('nilai_dosen_bimbingan', { valueAsNumber: true })}
                error={errorsNilai.nilai_dosen_bimbingan?.message}
              />
              <Input
                label="Laporan"
                type="number"
                step="0.1"
                {...regNilai('nilai_dosen_laporan', { valueAsNumber: true })}
                error={errorsNilai.nilai_dosen_laporan?.message}
              />
              <Input
                label="Presentasi"
                type="number"
                step="0.1"
                {...regNilai('nilai_dosen_presentasi', { valueAsNumber: true })}
                error={errorsNilai.nilai_dosen_presentasi?.message}
              />
            </div>
            <Input
              label="Catatan Evaluasi Dosen"
              placeholder="Catatan penguasaan materi dan etika..."
              {...regNilai('catatan_dosen')}
              error={errorsNilai.catatan_dosen?.message}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpenNilaiModal(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={submittingAction}
              className="font-bold"
            >
              Simpan & Finalisasi Nilai
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}