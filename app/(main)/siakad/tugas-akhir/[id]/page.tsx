'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  GraduationCap,
  Calendar,
  Award,
  BookOpen,
  User,
  Clock,
  Plus,
  CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Modal } from '@/components/ui/Modal';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { siakadService } from '@/services/siakad.service';
import {
  TugasAkhirBimbinganSchema,
  PenjadwalanSidangSchema,
  PenilaianSidangSchema,
  type TugasAkhirBimbinganFormValues,
  type PenjadwalanSidangFormValues,
  type PenilaianSidangFormValues,
} from '@/lib/validations/siakad-pipeline.schema';
import toast from 'react-hot-toast';

export default function TugasAkhirDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const taId = Number(resolvedParams.id);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [ta, setTa] = useState<any | null>(null);

  // Bimbingan state
  const [bimbinganList, setBimbinganList] = useState<any[]>([]);
  const [bimbinganLoading, setBimbinganLoading] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(false);

  // Modals
  const [openBimbinganModal, setOpenBimbinganModal] = useState(false);
  const [openSidangModal, setOpenSidangModal] = useState(false);
  const [openNilaiModal, setOpenNilaiModal] = useState(false);

  // React Hook Form: Bimbingan
  const {
    register: regBimb,
    handleSubmit: handleSubBimb,
    reset: resetBimbForm,
    control: ctrlBimb,
    formState: { errors: errorsBimb },
  } = useForm<TugasAkhirBimbinganFormValues>({
    resolver: zodResolver(TugasAkhirBimbinganSchema),
    defaultValues: {
      dosen_id: undefined,
      tanggal: new Date().toISOString().split('T')[0],
      bab_pembahasan: '',
      uraian_konsultasi: '',
      arahan_revisi: '',
    },
  });

  // React Hook Form: Penjadwalan Sidang
  const {
    register: regSidang,
    handleSubmit: handleSubSidang,
    reset: resetSidangForm,
    control: ctrlSidang,
    formState: { errors: errorsSidang },
  } = useForm<PenjadwalanSidangFormValues>({
    resolver: zodResolver(PenjadwalanSidangSchema),
    defaultValues: {
      jenis_sidang: 'sidang_skripsi',
      tanggal_sidang: '',
      jam_mulai: '09:00',
      jam_selesai: '11:00',
      ruangan_nama_manual: 'Ruang Sidang Utama',
      penguji_1_id: undefined,
      penguji_2_id: undefined,
    },
  });

  // React Hook Form: Penilaian Sidang
  const {
    register: regNilai,
    handleSubmit: handleSubNilai,
    reset: resetNilaiForm,
    formState: { errors: errorsNilai },
  } = useForm<PenilaianSidangFormValues>({
    resolver: zodResolver(PenilaianSidangSchema),
    defaultValues: {
      skor_metodologi: 85,
      skor_materi_skripsi: 85,
      skor_presentasi: 85,
      skor_penguasaan_materi: 85,
      catatan_revisi: '',
    },
  });

  const loadDosenOptions = useCallback(async (keyword: string) => {
    try {
      const res = await siakadService.getDosens({
        search: keyword || undefined,
        per_page: 50,
      });
      const list: any[] = Array.isArray(res.data) ? res.data : res.data?.items || [];
      return list.map((d: any) => ({
        value: Number(d.id),
        label: `${d.nama_lengkap || d.nama || 'Dosen'}${d.nip ? ` (${d.nip})` : ''}`,
      }));
    } catch {
      return [];
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await siakadService.getTugasAkhirDetail(taId);
      if (res?.data) {
        setTa(res.data);
      }
    } catch {
      toast.error('Gagal memuat detail Tugas Akhir');
    } finally {
      setLoading(false);
    }
  }, [taId]);

  const loadBimbingan = useCallback(async () => {
    try {
      setBimbinganLoading(true);
      const res = await siakadService.getTaBimbingan(taId);
      setBimbinganList(res?.data || []);
    } catch {
      toast.error('Gagal memuat kartu bimbingan');
    } finally {
      setBimbinganLoading(false);
    }
  }, [taId]);

  useEffect(() => {
    if (taId) {
      loadData();
      loadBimbingan();
    }
  }, [taId, loadData, loadBimbingan]);

  const onSubmitBimbingan = async (values: TugasAkhirBimbinganFormValues) => {
    try {
      setSubmittingAction(true);
      const res = await siakadService.createTaBimbingan(taId, values);
      toast.success(res?.message || 'Catatan bimbingan berhasil disimpan');
      resetBimbForm();
      setOpenBimbinganModal(false);
      await loadBimbingan();
      await loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menambahkan bimbingan');
    } finally {
      setSubmittingAction(false);
    }
  };

  const onSubmitSidang = async (values: PenjadwalanSidangFormValues) => {
    try {
      setSubmittingAction(true);
      const payload = {
        jenis_sidang: values.jenis_sidang,
        tanggal_sidang: values.tanggal_sidang,
        jam_mulai: values.jam_mulai,
        jam_selesai: values.jam_selesai,
        ruangan_id: values.ruangan_id,
        ruangan_nama_manual: values.ruangan_nama_manual,
        ketua_sidang_id: values.ketua_sidang_id,
        sekretaris_sidang_id: values.sekretaris_sidang_id,
        penguji: [
          { dosen_id: values.penguji_1_id, peran_penguji: 'penguji_1' },
          { dosen_id: values.penguji_2_id, peran_penguji: 'penguji_2' },
        ],
      };
      const res = await siakadService.scheduleTaSidang(taId, payload);
      toast.success(res?.message || 'Jadwal sidang berhasil ditetapkan');
      setOpenSidangModal(false);
      resetSidangForm();
      await loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menjadwalkan sidang');
    } finally {
      setSubmittingAction(false);
    }
  };

  const onSubmitNilai = async (values: PenilaianSidangFormValues) => {
    try {
      setSubmittingAction(true);
      const sidangId = ta?.sidang_aktif?.id || taId;
      const res = await siakadService.submitTaSidangNilai(sidangId, values);
      toast.success(res?.message || 'Nilai sidang berhasil disimpan');
      setOpenNilaiModal(false);
      resetNilaiForm();
      await loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan nilai sidang');
    } finally {
      setSubmittingAction(false);
    }
  };

  const bimbinganColumns: ColumnDef<any>[] = [
    {
      key: 'tanggal',
      label: 'TANGGAL & DOSEN',
      render: (row) => (
        <div>
          <span className="font-mono text-2xs text-slate-600 block">{row.tanggal}</span>
          <span className="text-2xs font-semibold text-slate-800">
            {row.dosen?.nama_lengkap || 'Dosen Pembimbing'}
          </span>
        </div>
      ),
    },
    {
      key: 'bab',
      label: 'BAB & KONSULTASI',
      render: (row) => (
        <div className="space-y-0.5">
          <span className="text-xs font-bold text-slate-900 block">{row.bab_pembahasan}</span>
          <span className="text-2xs text-slate-600 block">{row.uraian_konsultasi}</span>
          {row.arahan_revisi && (
            <span className="text-2xs text-amber-700 block">Arahan: {row.arahan_revisi}</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'STATUS ACC',
      align: 'center',
      render: (row) => {
        const v = row.status_validasi || 'menunggu';
        return (
          <Badge
            variant={v === 'acc' ? 'green' : v === 'revisi' ? 'red' : 'amber'}
            className="text-2xs uppercase font-semibold"
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
              label: 'Validasi / ACC',
              icon: <CheckCircle2 size={14} />,
              onClick: async () => {
                if (!taId || !row.id) return;
                try {
                  await siakadService.verifyTaBimbingan(taId, row.id, {
                    status_validasi: 'acc',
                  });
                  toast.success(`Asistensi bab ${row.bab_pembahasan} berhasil disetujui`);
                  loadBimbingan();
                } catch (err: any) {
                  toast.error(err?.response?.data?.message || 'Gagal memvalidasi asistensi');
                }
              },
            },
          ]}
        />
      ),
    },
  ];

  const status = ta?.status || 'draft';
  const statusVariant =
    status === 'selesai' || status === 'disetujui_prodi'
      ? 'green'
      : status === 'ditolak'
      ? 'red'
      : status === 'siap_sidang'
      ? 'cyan'
      : 'amber';

  return (
    <div className="space-y-6">
      <PageHeader
        title={ta ? ta.judul_utama : 'Detail Tugas Akhir'}
        description="Rincian usulan judul, penetapan dosen pembimbing, lembar bimbingan, jadwal sidang, dan nilai komposit."
        backUrl="/siakad/tugas-akhir"
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Tugas Akhir', href: '/siakad/tugas-akhir' },
          { label: 'Detail Skripsi' },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<Calendar size={14} />}
              onClick={() => setOpenSidangModal(true)}
              className="text-xs font-bold border-[var(--module-primary)] text-[var(--module-primary)] hover:bg-[var(--module-primary-subtle)]"
            >
              Jadwalkan Sidang
            </Button>
            <Button
              variant="outline"
              icon={<Award size={14} />}
              onClick={() => setOpenNilaiModal(true)}
              className="text-xs font-bold border-[var(--module-primary)] text-[var(--module-primary)] hover:bg-[var(--module-primary-subtle)]"
            >
              Input Nilai
            </Button>
            <Button
              variant="primary"
              icon={<Plus size={14} />}
              onClick={() => setOpenBimbinganModal(true)}
              className="text-xs font-bold"
            >
              Tambah Asistensi
            </Button>
          </div>
        }
      />

      {/* Ringkasan Profil Skripsi */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader className="p-4 border-b border-slate-200 flex flex-row items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Informasi Skripsi & Mahasiswa
              </h2>
              <p className="text-2xs text-slate-500">Data penelitian dan komisi pembimbing.</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="blue" className="text-2xs uppercase">
                {String(ta?.tahap || 'proposal').replace(/_/g, ' ')}
              </Badge>
              <Badge variant={statusVariant} className="text-2xs uppercase font-bold">
                {String(status).replace(/_/g, ' ')}
              </Badge>
            </div>
          </CardHeader>
          <CardBody className="p-4 space-y-4 text-xs">
            <div>
              <span className="text-2xs text-slate-500 block">Judul Skripsi (Bahasa Indonesia)</span>
              <p className="font-bold text-slate-900 text-xs mt-0.5">{ta?.judul_utama || '-'}</p>
              {ta?.judul_inggris && (
                <p className="italic text-slate-500 text-2xs mt-1">{ta.judul_inggris}</p>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-2xs text-slate-500 block">Mahasiswa</span>
                <span className="font-bold text-slate-900">
                  {ta?.mahasiswa?.nama_lengkap || ta?.nama_mahasiswa || '-'}
                </span>
                <span className="text-2xs text-slate-500 block font-mono">
                  NIM: {ta?.mahasiswa?.nim || '-'} • {ta?.program_studi?.nama || 'Prodi'}
                </span>
              </div>
              <div>
                <span className="text-2xs text-slate-500 block">Bidang Kajian</span>
                <span className="font-semibold text-slate-800">{ta?.bidang_kajian || '-'}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-2xs text-slate-500 block">Dosen Pembimbing Utama (1)</span>
                <span className="font-medium text-slate-900 block">
                  {ta?.dosen_pembimbing_1?.nama_lengkap || 'Belum diplot Kaprodi'}
                </span>
                <span className="text-2xs text-slate-500 font-mono block">
                  NIP: {ta?.dosen_pembimbing_1?.nip || '-'}
                </span>
              </div>
              <div>
                <span className="text-2xs text-slate-500 block">Dosen Pembimbing Pendamping (2)</span>
                <span className="font-medium text-slate-900 block">
                  {ta?.dosen_pembimbing_2?.nama_lengkap || '-'}
                </span>
                <span className="text-2xs text-slate-500 font-mono block">
                  {ta?.dosen_pembimbing_2?.nip ? `NIP: ${ta.dosen_pembimbing_2.nip}` : ''}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="text-2xs text-slate-500 block mb-1">Abstrak Proposal:</span>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-2xs text-slate-700 leading-relaxed max-h-40 overflow-y-auto">
                {ta?.abstrak || 'Belum ada abstrak yang diunggah.'}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Kartu Status Sidang & Nilai */}
        <Card>
          <CardHeader className="p-4 border-b border-slate-200">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Status Sidang & Nilai
            </h2>
          </CardHeader>
          <CardBody className="p-4 space-y-4 text-center">
            <div className="p-4 rounded-xl border border-slate-200 bg-[var(--module-primary-subtle)]">
              <p className="text-2xs font-semibold uppercase tracking-wider text-[var(--module-primary)]">
                Nilai Akhir Skripsi
              </p>
              <p className="text-2xl font-black mt-1 font-mono text-[var(--module-primary)]">
                {ta?.nilai_angka_akhir ?? '-'}
                {ta?.nilai_huruf_akhir ? ` (${ta.nilai_huruf_akhir})` : ''}
              </p>
              <span className="text-2xs text-slate-500">Total {ta?.total_sesi_bimbingan ?? 0} Sesi Asistensi</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left space-y-2 text-2xs">
              <p className="font-bold text-slate-800 uppercase tracking-wider">Jadwal Sidang Terakhir</p>
              {ta?.sidang_aktif ? (
                <>
                  <p><strong>Jenis:</strong> {String(ta.sidang_aktif.jenis_sidang).replace(/_/g, ' ')}</p>
                  <p><strong>Waktu:</strong> {ta.sidang_aktif.tanggal_sidang}, {ta.sidang_aktif.jam_mulai} - {ta.sidang_aktif.jam_selesai}</p>
                  <p><strong>Ruang:</strong> {ta.sidang_aktif.ruangan_nama_manual || 'Ruang Sidang'}</p>
                </>
              ) : (
                <p className="text-slate-500 italic">Belum ada sidang yang dijadwalkan.</p>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Tabel Bimbingan */}
      <Card>
        <CardHeader className="p-4 flex flex-row items-center justify-between border-b border-slate-200">
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Kartu Kendali Asistensi Bimbingan ({bimbinganList.length})
            </h2>
            <p className="text-2xs text-slate-500">
              Riwayat konsultasi bab, catatan perbaikan dosen pembimbing, dan status ACC.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={<Plus size={12} />}
            onClick={() => setOpenBimbinganModal(true)}
            className="text-2xs font-bold border-[var(--module-primary)] text-[var(--module-primary)] hover:bg-[var(--module-primary-subtle)]"
          >
            Catat Asistensi
          </Button>
        </CardHeader>
        <CardBody className="p-0">
          <DataTable
            columns={bimbinganColumns}
            data={bimbinganList}
            isLoading={bimbinganLoading}
            emptyMessage="Belum ada riwayat asistensi yang dicatat pada skripsi ini."
          />
        </CardBody>
      </Card>

      {/* Modal Bimbingan */}
      <Modal
        isOpen={openBimbinganModal}
        onClose={() => setOpenBimbinganModal(false)}
        title="Input Logbook Asistensi Bimbingan"
        size="lg"
      >
        <form onSubmit={handleSubBimb(onSubmitBimbingan)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Tanggal Asistensi"
              type="date"
              {...regBimb('tanggal')}
              error={errorsBimb.tanggal?.message}
            />
            <Controller
              name="dosen_id"
              control={ctrlBimb}
              render={({ field }) => (
                <AsyncSelect
                  label="Dosen Pembimbing"
                  placeholder="Cari dosen..."
                  loadOptions={loadDosenOptions}
                  value={field.value}
                  onChange={(val) => field.onChange(val ? Number(val) : undefined)}
                  error={errorsBimb.dosen_id?.message}
                  defaultOptions
                />
              )}
            />
            <Input
              label="Bab / Pokok Bahasan"
              placeholder="Contoh: BAB III Metodologi"
              {...regBimb('bab_pembahasan')}
              error={errorsBimb.bab_pembahasan?.message}
            />
          </div>
          <Textarea
            label="Uraian Asistensi & Catatan Konsultasi"
            placeholder="Tuliskan catatan konsultasi materi..."
            {...regBimb('uraian_konsultasi')}
            error={errorsBimb.uraian_konsultasi?.message}
            rows={3}
          />
          <Input
            label="Arahan Revisi (Opsional)"
            placeholder="Arahan perbaikan metodologi..."
            {...regBimb('arahan_revisi')}
            error={errorsBimb.arahan_revisi?.message}
          />
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenBimbinganModal(false)}
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
              Simpan Bimbingan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Jadwal Sidang */}
      <Modal
        isOpen={openSidangModal}
        onClose={() => setOpenSidangModal(false)}
        title="Penjadwalan Sidang Skripsi"
        size="md"
      >
        <form onSubmit={handleSubSidang(onSubmitSidang)} className="space-y-4">
          <Controller
            name="jenis_sidang"
            control={ctrlSidang}
            render={({ field }) => (
              <Select
                label="Jenis Sidang"
                options={[
                  { value: 'proposal', label: 'Seminar Proposal' },
                  { value: 'seminar_hasil', label: 'Seminar Hasil' },
                  { value: 'sidang_skripsi', label: 'Sidang Skripsi' },
                ]}
                value={field.value}
                onChange={field.onChange}
                error={errorsSidang.jenis_sidang?.message}
              />
            )}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Input
              label="Tanggal Sidang"
              type="date"
              {...regSidang('tanggal_sidang')}
              error={errorsSidang.tanggal_sidang?.message}
            />
            <Input
              label="Jam Mulai"
              placeholder="09:00"
              {...regSidang('jam_mulai')}
              error={errorsSidang.jam_mulai?.message}
            />
            <Input
              label="Jam Selesai"
              placeholder="11:00"
              {...regSidang('jam_selesai')}
              error={errorsSidang.jam_selesai?.message}
            />
          </div>

          <Input
            label="Ruangan Sidang"
            placeholder="Ruang Sidang FTI-2"
            {...regSidang('ruangan_nama_manual')}
            error={errorsSidang.ruangan_nama_manual?.message}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <Controller
              name="penguji_1_id"
              control={ctrlSidang}
              render={({ field }) => (
                <AsyncSelect
                  label="Dosen Penguji 1"
                  placeholder="Cari penguji 1..."
                  loadOptions={loadDosenOptions}
                  value={field.value}
                  onChange={(val) => field.onChange(val ? Number(val) : undefined)}
                  error={errorsSidang.penguji_1_id?.message}
                  defaultOptions
                />
              )}
            />
            <Controller
              name="penguji_2_id"
              control={ctrlSidang}
              render={({ field }) => (
                <AsyncSelect
                  label="Dosen Penguji 2"
                  placeholder="Cari penguji 2..."
                  loadOptions={loadDosenOptions}
                  value={field.value}
                  onChange={(val) => field.onChange(val ? Number(val) : undefined)}
                  error={errorsSidang.penguji_2_id?.message}
                  defaultOptions
                />
              )}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpenSidangModal(false)}
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
              Simpan Jadwal
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Input Nilai Sidang */}
      <Modal
        isOpen={openNilaiModal}
        onClose={() => setOpenNilaiModal(false)}
        title="Lembar Penilaian Sidang Skripsi"
        size="md"
      >
        <form onSubmit={handleSubNilai(onSubmitNilai)} className="space-y-4">
          <p className="text-2xs text-slate-500">
            Input rubrik penilaian individual penguji (skor 0 - 100).
          </p>

          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <Input
              label="Skor Metodologi"
              type="number"
              step="0.1"
              {...regNilai('skor_metodologi', { valueAsNumber: true })}
              error={errorsNilai.skor_metodologi?.message}
            />
            <Input
              label="Skor Materi Skripsi"
              type="number"
              step="0.1"
              {...regNilai('skor_materi_skripsi', { valueAsNumber: true })}
              error={errorsNilai.skor_materi_skripsi?.message}
            />
            <Input
              label="Skor Presentasi"
              type="number"
              step="0.1"
              {...regNilai('skor_presentasi', { valueAsNumber: true })}
              error={errorsNilai.skor_presentasi?.message}
            />
            <Input
              label="Skor Penguasaan Materi"
              type="number"
              step="0.1"
              {...regNilai('skor_penguasaan_materi', { valueAsNumber: true })}
              error={errorsNilai.skor_penguasaan_materi?.message}
            />
          </div>

          <Textarea
            label="Catatan Revisi Sidang (Opsional)"
            placeholder="Catatan perbaikan skripsi..."
            {...regNilai('catatan_revisi')}
            error={errorsNilai.catatan_revisi?.message}
            rows={2}
          />

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
              Simpan & Kunci Nilai
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}