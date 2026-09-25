'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Award,
  FileCheck,
  GraduationCap,
  Plus,
  Search,
  Filter,
  ExternalLink,
  Edit2,
  Trash2,
  Calendar,
  Building,
  CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { simpegKompetensiService } from '@/services/simpeg.kompetensi.service';
import { simpegService } from '@/services/simpeg.service';
import { useAuth } from '@/hooks/useAuth';
import type {
  KompetensiMasters,
  SertifikasiDosen,
  RiwayatTes,
  RiwayatPelatihan,
} from '@/types/simpeg.kompetensi.types';
import type { Pegawai } from '@/types/simpeg.types';
import type { PaginationMeta } from '@/types/api.types';

// ── ZOD SCHEMAS ───────────────────────────────────────────────
const sertifikasiSchema = z.object({
  pegawai_id: z.string().min(1, 'Pegawai wajib dipilih'),
  jenis_sertifikasi_id: z.string().min(1, 'Jenis sertifikasi wajib dipilih'),
  nama_sertifikat: z.string().min(3, 'Nama sertifikat minimal 3 karakter'),
  bidang_studi: z.string().min(2, 'Bidang studi wajib diisi'),
  nomor_registrasi: z.string().optional(),
  nomor_sk: z.string().optional(),
  tahun_sertifikasi: z.string().min(4, 'Tahun sertifikasi wajib diisi'),
  penyelenggara: z.string().min(2, 'Penyelenggara wajib diisi'),
  tautan: z.string().url('URL tidak valid').optional().or(z.literal('')),
});

const tesSchema = z.object({
  pegawai_id: z.string().min(1, 'Pegawai wajib dipilih'),
  jenis_tes_id: z.string().min(1, 'Jenis tes wajib dipilih'),
  nama_tes: z.string().min(2, 'Nama tes wajib diisi'),
  penyelenggara: z.string().min(2, 'Penyelenggara tes wajib diisi'),
  tahun: z.string().min(4, 'Tahun tes wajib diisi'),
  skor: z.string().min(1, 'Skor wajib diisi'),
  masa_berlaku: z.string().optional(),
  tautan: z.string().url('URL tidak valid').optional().or(z.literal('')),
});

const pelatihanSchema = z.object({
  pegawai_id: z.string().min(1, 'Pegawai wajib dipilih'),
  nama_kegiatan: z.string().min(3, 'Nama kegiatan minimal 3 karakter'),
  jenis_pelatihan_id: z.string().optional(),
  peran_id: z.string().min(1, 'Peran wajib dipilih'),
  tingkat_id: z.string().optional(),
  tanggal_mulai: z.string().min(1, 'Tanggal mulai wajib diisi'),
  tanggal_selesai: z.string().optional(),
  jumlah_jam: z.string().optional(),
  penyelenggara: z.string().min(2, 'Penyelenggara wajib diisi'),
  tempat: z.string().optional(),
  nomor_sertifikat: z.string().optional(),
  tautan: z.string().url('URL tidak valid').optional().or(z.literal('')),
});

export default function KompetensiPage() {
  const router = useRouter();
  const { user, isAdmin, hasPermission } = useAuth();
  const isManager = isAdmin || hasPermission('simpeg.kompetensi.manage');

  const [activeTab, setActiveTab] = useState<'sertifikasi' | 'tes' | 'pelatihan'>('sertifikasi');
  const [masters, setMasters] = useState<KompetensiMasters | null>(null);
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>([]);
  const [myPegawai, setMyPegawai] = useState<Pegawai | null>(null);

  // List States
  const [sertifikasiList, setSertifikasiList] = useState<SertifikasiDosen[]>([]);
  const [tesList, setTesList] = useState<RiwayatTes[]>([]);
  const [pelatihanList, setPelatihanList] = useState<RiwayatPelatihan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [meta, setMeta] = useState<PaginationMeta>({
    current_page: 1,
    per_page: 15,
    total: 0,
    last_page: 1,
    from: 0,
    to: 0,
  });

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [fileUpload, setFileUpload] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirm Delete
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Forms
  const formSertifikasi = useForm({
    resolver: zodResolver(sertifikasiSchema),
    defaultValues: {
      pegawai_id: '',
      jenis_sertifikasi_id: '',
      nama_sertifikat: '',
      bidang_studi: '',
      nomor_registrasi: '',
      nomor_sk: '',
      tahun_sertifikasi: new Date().getFullYear().toString(),
      penyelenggara: '',
      tautan: '',
    },
  });

  const formTes = useForm({
    resolver: zodResolver(tesSchema),
    defaultValues: {
      pegawai_id: '',
      jenis_tes_id: '',
      nama_tes: '',
      penyelenggara: '',
      tahun: new Date().getFullYear().toString(),
      skor: '',
      masa_berlaku: '',
      tautan: '',
    },
  });

  const formPelatihan = useForm({
    resolver: zodResolver(pelatihanSchema),
    defaultValues: {
      pegawai_id: '',
      nama_kegiatan: '',
      jenis_pelatihan_id: '',
      peran_id: '',
      tingkat_id: '',
      tanggal_mulai: '',
      tanggal_selesai: '',
      jumlah_jam: '',
      penyelenggara: '',
      tempat: '',
      nomor_sertifikat: '',
      tautan: '',
    },
  });

  // Initial Load Masters
  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const [resMasters, resMe] = await Promise.all([
          simpegKompetensiService.getMasters(),
          simpegService.getPegawaiMe().catch(() => ({ data: null })),
        ]);
        if (resMasters.data) setMasters(resMasters.data);
        if (resMe.data) setMyPegawai(resMe.data);

        if (isManager) {
          const resPeg = await simpegService.getPegawaiList({ per_page: 100 });
          const responseData = (resPeg as any)?.data || resPeg;
          const list: Pegawai[] = Array.isArray(responseData)
            ? responseData
            : responseData?.data || responseData?.items || [];
          setPegawaiList(list);
        }
      } catch (err) {
        console.error('Failed fetching masters', err);
      }
    };
    fetchMasters();
  }, [isManager]);

  // Fetch Tab Data
  const fetchData = useCallback(
    async (page = 1, limit = 15) => {
      setIsLoading(true);
      try {
        const params = { page, per_page: limit, search };

        if (activeTab === 'sertifikasi') {
          const res = await simpegKompetensiService.getSertifikasiList(params);
          setSertifikasiList(res.data || []);
          if (res.meta) setMeta(res.meta);
        } else if (activeTab === 'tes') {
          const res = await simpegKompetensiService.getTesList(params);
          setTesList(res.data || []);
          if (res.meta) setMeta(res.meta);
        } else {
          const res = await simpegKompetensiService.getPelatihanList(params);
          setPelatihanList(res.data || []);
          if (res.meta) setMeta(res.meta);
        }
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Gagal memuat data');
      } finally {
        setIsLoading(false);
      }
    },
    [activeTab, search]
  );

  useEffect(() => {
    fetchData(1, meta.per_page);
  }, [fetchData]);

  // Modal Open Handler
  const handleOpenAdd = () => {
    setEditItem(null);
    setFileUpload(null);

    const defaultPegId = myPegawai?.id ? myPegawai.id.toString() : '';

    if (activeTab === 'sertifikasi') {
      formSertifikasi.reset({
        pegawai_id: defaultPegId,
        jenis_sertifikasi_id: masters?.jenis_sertifikasi?.[0]?.id.toString() || '',
        nama_sertifikat: '',
        bidang_studi: '',
        nomor_registrasi: '',
        nomor_sk: '',
        tahun_sertifikasi: new Date().getFullYear().toString(),
        penyelenggara: '',
        tautan: '',
      });
    } else if (activeTab === 'tes') {
      formTes.reset({
        pegawai_id: defaultPegId,
        jenis_tes_id: masters?.jenis_tes?.[0]?.id.toString() || '',
        nama_tes: '',
        penyelenggara: '',
        tahun: new Date().getFullYear().toString(),
        skor: '',
        masa_berlaku: '',
        tautan: '',
      });
    } else {
      formPelatihan.reset({
        pegawai_id: defaultPegId,
        nama_kegiatan: '',
        jenis_pelatihan_id: masters?.jenis_pelatihan?.[0]?.id.toString() || '',
        peran_id: masters?.peran_pelatihan?.[0]?.id.toString() || '',
        tingkat_id: masters?.tingkat_kegiatan?.[0]?.id.toString() || '',
        tanggal_mulai: '',
        tanggal_selesai: '',
        jumlah_jam: '',
        penyelenggara: '',
        tempat: '',
        nomor_sertifikat: '',
        tautan: '',
      });
    }

    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditItem(item);
    setFileUpload(null);

    if (activeTab === 'sertifikasi') {
      formSertifikasi.reset({
        pegawai_id: item.pegawai_id.toString(),
        jenis_sertifikasi_id: item.jenis_sertifikasi_id.toString(),
        nama_sertifikat: item.nama_sertifikat,
        bidang_studi: item.bidang_studi,
        nomor_registrasi: item.nomor_registrasi || '',
        nomor_sk: item.nomor_sk || '',
        tahun_sertifikasi: item.tahun_sertifikasi.toString(),
        penyelenggara: item.penyelenggara,
        tautan: item.tautan || '',
      });
    } else if (activeTab === 'tes') {
      formTes.reset({
        pegawai_id: item.pegawai_id.toString(),
        jenis_tes_id: item.jenis_tes_id.toString(),
        nama_tes: item.nama_tes,
        penyelenggara: item.penyelenggara,
        tahun: item.tahun.toString(),
        skor: item.skor.toString(),
        masa_berlaku: item.masa_berlaku || '',
        tautan: item.tautan || '',
      });
    } else {
      formPelatihan.reset({
        pegawai_id: item.pegawai_id.toString(),
        nama_kegiatan: item.nama_kegiatan,
        jenis_pelatihan_id: item.jenis_pelatihan_id?.toString() || '',
        peran_id: item.peran_id.toString(),
        tingkat_id: item.tingkat_id?.toString() || '',
        tanggal_mulai: item.tanggal_mulai ? item.tanggal_mulai.substring(0, 10) : '',
        tanggal_selesai: item.tanggal_selesai ? item.tanggal_selesai.substring(0, 10) : '',
        jumlah_jam: item.jumlah_jam?.toString() || '',
        penyelenggara: item.penyelenggara,
        tempat: item.tempat || '',
        nomor_sertifikat: item.nomor_sertifikat || '',
        tautan: item.tautan || '',
      });
    }

    setIsModalOpen(true);
  };

  // Submit Handler
  const onSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.keys(values).forEach((key) => {
        if (values[key] !== undefined && values[key] !== null) {
          formData.append(key, values[key]);
        }
      });
      if (fileUpload) {
        formData.append('file', fileUpload);
      }

      if (activeTab === 'sertifikasi') {
        if (editItem) {
          await simpegKompetensiService.updateSertifikasi(editItem.id, formData);
          toast.success('Sertifikasi dosen berhasil diperbarui');
        } else {
          await simpegKompetensiService.createSertifikasi(formData);
          toast.success('Sertifikasi dosen berhasil ditambahkan');
        }
      } else if (activeTab === 'tes') {
        if (editItem) {
          await simpegKompetensiService.updateTes(editItem.id, formData);
          toast.success('Riwayat tes berhasil diperbarui');
        } else {
          await simpegKompetensiService.createTes(formData);
          toast.success('Riwayat tes berhasil ditambahkan');
        }
      } else {
        if (editItem) {
          await simpegKompetensiService.updatePelatihan(editItem.id, formData);
          toast.success('Riwayat pelatihan berhasil diperbarui');
        } else {
          await simpegKompetensiService.createPelatihan(formData);
          toast.success('Riwayat pelatihan berhasil ditambahkan');
        }
      }

      setIsModalOpen(false);
      fetchData(meta.current_page, meta.per_page);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Handler
  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      if (activeTab === 'sertifikasi') {
        await simpegKompetensiService.deleteSertifikasi(deleteId);
      } else if (activeTab === 'tes') {
        await simpegKompetensiService.deleteTes(deleteId);
      } else {
        await simpegKompetensiService.deletePelatihan(deleteId);
      }
      toast.success('Data berhasil dihapus');
      setDeleteId(null);
      fetchData(meta.current_page, meta.per_page);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus data');
    } finally {
      setIsDeleting(false);
    }
  };

  // ── TABLE COLUMNS ──────────────────────────────────────────
  const columnsSertifikasi: ColumnDef<SertifikasiDosen>[] = [
    {
      key: 'pegawai',
      label: 'Pegawai / Dosen',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-900">{row.pegawai?.nama_lengkap}</div>
          <div className="text-xs text-slate-500 font-mono">
            {row.pegawai?.nidn ? `NIDN: ${row.pegawai.nidn}` : `NIP: ${row.pegawai?.nip || '-'}`}
          </div>
        </div>
      ),
    },
    {
      key: 'nama_sertifikat',
      label: 'Sertifikasi & Bidang',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-800">{row.nama_sertifikat}</div>
          <div className="text-xs text-primary-600 font-medium">{row.bidang_studi}</div>
          {row.nomor_registrasi && (
            <div className="text-2xs text-slate-400 font-mono mt-0.5">No. Reg: {row.nomor_registrasi}</div>
          )}
        </div>
      ),
    },
    {
      key: 'jenis_sertifikasi',
      label: 'Jenis',
      render: (row) => (
        <Badge variant="purple" className="text-xs">
          {row.jenis_sertifikasi?.nama || 'Sertifikasi'}
        </Badge>
      ),
    },
    {
      key: 'tahun_sertifikasi',
      label: 'Tahun & Lembaga',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-800">{row.tahun_sertifikasi}</div>
          <div className="text-xs text-slate-500">{row.penyelenggara}</div>
        </div>
      ),
    },
    {
      key: 'dokumen',
      label: 'Berkas',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          {row.file_path ? (
            <a
              href={`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/${row.file_path}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 font-medium bg-primary-50 px-2 py-1 rounded"
            >
              <ExternalLink size={12} /> Unduh
            </a>
          ) : (
            <span className="text-xs text-slate-400 italic">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (row) => (
        <DropdownMenu
          items={[
            {
              label: 'Edit Data',
              icon: <Edit2 size={14} />,
              onClick: () => handleOpenEdit(row),
            },
            {
              label: 'Hapus Data',
              icon: <Trash2 size={14} />,
              variant: 'danger',
              onClick: () => setDeleteId(row.id),
            },
          ]}
        />
      ),
    },
  ];

  const columnsTes: ColumnDef<RiwayatTes>[] = [
    {
      key: 'pegawai',
      label: 'Pegawai / Dosen',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-900">{row.pegawai?.nama_lengkap}</div>
          <div className="text-xs text-slate-500 font-mono">
            {row.pegawai?.nidn ? `NIDN: ${row.pegawai.nidn}` : `NIP: ${row.pegawai?.nip || '-'}`}
          </div>
        </div>
      ),
    },
    {
      key: 'jenis_tes',
      label: 'Jenis Tes',
      render: (row) => (
        <div>
          <Badge variant="blue" className="text-xs font-semibold mb-1">
            {row.jenis_tes?.nama || row.nama_tes}
          </Badge>
          <div className="text-xs text-slate-600">{row.nama_tes}</div>
        </div>
      ),
    },
    {
      key: 'skor',
      label: 'Skor / Nilai',
      render: (row) => (
        <div className="font-mono text-base font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-lg inline-block">
          {row.skor}
        </div>
      ),
    },
    {
      key: 'tahun',
      label: 'Tahun & Penyelenggara',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-800">{row.tahun}</div>
          <div className="text-xs text-slate-500">{row.penyelenggara}</div>
        </div>
      ),
    },
    {
      key: 'dokumen',
      label: 'Berkas',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          {row.file_path ? (
            <a
              href={`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/${row.file_path}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 font-medium bg-primary-50 px-2 py-1 rounded"
            >
              <ExternalLink size={12} /> Unduh
            </a>
          ) : (
            <span className="text-xs text-slate-400 italic">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (row) => (
        <DropdownMenu
          items={[
            {
              label: 'Edit Data',
              icon: <Edit2 size={14} />,
              onClick: () => handleOpenEdit(row),
            },
            {
              label: 'Hapus Data',
              icon: <Trash2 size={14} />,
              variant: 'danger',
              onClick: () => setDeleteId(row.id),
            },
          ]}
        />
      ),
    },
  ];

  const columnsPelatihan: ColumnDef<RiwayatPelatihan>[] = [
    {
      key: 'pegawai',
      label: 'Pegawai / Dosen',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-900">{row.pegawai?.nama_lengkap}</div>
          <div className="text-xs text-slate-500 font-mono">
            {row.pegawai?.nidn ? `NIDN: ${row.pegawai.nidn}` : `NIP: ${row.pegawai?.nip || '-'}`}
          </div>
        </div>
      ),
    },
    {
      key: 'nama_kegiatan',
      label: 'Kegiatan Pelatihan',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-900 text-sm">{row.nama_kegiatan}</div>
          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
            <Building size={12} /> {row.penyelenggara}
          </div>
        </div>
      ),
    },
    {
      key: 'peran',
      label: 'Peran & Tingkat',
      render: (row) => (
        <div className="flex flex-col gap-1">
          <Badge variant="purple" className="text-xs w-max">
            {row.peran?.nama || 'Peserta'}
          </Badge>
          {row.tingkat && (
            <span className="text-2xs text-slate-500 font-medium">Tingkat: {row.tingkat.nama}</span>
          )}
        </div>
      ),
    },
    {
      key: 'tanggal',
      label: 'Jadwal & Durasi',
      render: (row) => (
        <div>
          <div className="text-xs font-semibold text-slate-800 flex items-center gap-1">
            <Calendar size={12} className="text-slate-400" />
            {row.tanggal_mulai ? row.tanggal_mulai.substring(0, 10) : '-'}
          </div>
          {row.jumlah_jam && (
            <div className="text-2xs text-slate-500 mt-0.5">{row.jumlah_jam} Jam Pelajaran (JP)</div>
          )}
        </div>
      ),
    },
    {
      key: 'dokumen',
      label: 'Berkas',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          {row.file_path ? (
            <a
              href={`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/${row.file_path}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 font-medium bg-primary-50 px-2 py-1 rounded"
            >
              <ExternalLink size={12} /> Unduh
            </a>
          ) : (
            <span className="text-xs text-slate-400 italic">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (row) => (
        <DropdownMenu
          items={[
            {
              label: 'Edit Data',
              icon: <Edit2 size={14} />,
              onClick: () => handleOpenEdit(row),
            },
            {
              label: 'Hapus Data',
              icon: <Trash2 size={14} />,
              variant: 'danger',
              onClick: () => setDeleteId(row.id),
            },
          ]}
        />
      ),
    },
  ];

  const [showFilter, setShowFilter] = useState(false);
  const [filterOrderBy, setFilterOrderBy] = useState('created_at');
  const [filterOrderDir, setFilterOrderDir] = useState<'asc' | 'desc'>('desc');

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <PageHeader
        title="Kompetensi & Pelatihan Dosen"
        description="Rekam jejak keahlian, sertifikasi dosen resmi, skor tes kemampuan bahasa/akademik, serta riwayat pelatihan profesional."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setShowFilter(true)}
            >
              Filter
            </Button>
            <Button icon={<Plus size={16} />} onClick={handleOpenAdd}>
              {activeTab === 'sertifikasi'
                ? 'Tambah Sertifikasi'
                : activeTab === 'tes'
                ? 'Tambah Riwayat Tes'
                : 'Tambah Pelatihan'}
            </Button>
          </div>
        }
      />

      {/* Tab Navigation (Mengikuti Format Master Surat Tugas & Presensi) */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto">
        <Button
          type="button"
          variant="tab"
          onClick={() => setActiveTab('sertifikasi')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'sertifikasi'
              ? 'border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle)]'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <Award size={16} /> Sertifikasi Dosen
        </Button>

        <Button
          type="button"
          variant="tab"
          onClick={() => setActiveTab('tes')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'tes'
              ? 'border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle)]'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <FileCheck size={16} /> Riwayat Tes
        </Button>

        <Button
          type="button"
          variant="tab"
          onClick={() => setActiveTab('pelatihan')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'pelatihan'
              ? 'border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle)]'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <GraduationCap size={16} /> Pelatihan & Workshop
        </Button>
      </div>

      {/* Main Table */}
      <div className="space-y-4">
        {activeTab === 'sertifikasi' && (
          <DataTable
            columns={columnsSertifikasi}
            data={sertifikasiList}
            isLoading={isLoading}
            meta={meta}
            onPageChange={(p) => fetchData(p, meta.per_page)}
            onLimitChange={(l) => fetchData(1, l)}
            emptyMessage="Belum ada data sertifikasi dosen yang tercatat."
          />
        )}
        {activeTab === 'tes' && (
          <DataTable
            columns={columnsTes}
            data={tesList}
            isLoading={isLoading}
            meta={meta}
            onPageChange={(p) => fetchData(p, meta.per_page)}
            onLimitChange={(l) => fetchData(1, l)}
            emptyMessage="Belum ada riwayat tes kemampuan yang tercatat."
          />
        )}
        {activeTab === 'pelatihan' && (
          <DataTable
            columns={columnsPelatihan}
            data={pelatihanList}
            isLoading={isLoading}
            meta={meta}
            onPageChange={(p) => fetchData(p, meta.per_page)}
            onLimitChange={(l) => fetchData(1, l)}
            emptyMessage="Belum ada riwayat pelatihan & workshop yang tercatat."
          />
        )}
      </div>

      {/* Drawer Filter */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Data Kompetensi"
      >
        <div className="space-y-4">
          <Input
            label="Cari Kata Kunci"
            placeholder="Cari berdasarkan nama, nomor reg, dll..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <hr className="my-4 border-slate-200" />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Urut Berdasarkan"
              value={filterOrderBy}
              onChange={(val) => setFilterOrderBy(val)}
              options={[
                { value: 'created_at', label: 'Tanggal Dibuat' },
                { value: 'nama', label: 'Nama / Judul' },
                { value: 'nomor_registrasi', label: 'Nomor Registrasi / SK' },
                { value: 'tanggal_perolehan', label: 'Tanggal Perolehan' },
                { value: 'status', label: 'Status Verifikasi' },
                { value: 'id', label: 'ID' },
              ]}
            />
            <Select
              label="Arah"
              value={filterOrderDir}
              onChange={(val) => setFilterOrderDir(val as 'asc' | 'desc')}
              options={[
                { value: 'desc', label: 'Z - A (Terbaru)' },
                { value: 'asc', label: 'A - Z (Terlama)' },
              ]}
            />
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSearch('');
                setFilterOrderBy('created_at');
                setFilterOrderDir('desc');
              }}
            >
              Reset
            </Button>
            <Button
              onClick={() => {
                setShowFilter(false);
                fetchData(1, meta.per_page);
              }}
            >
              Terapkan
            </Button>
          </div>
        </div>
      </Drawer>

      {/* MODAL FORM: SERTIFIKASI DOSEN */}
      {activeTab === 'sertifikasi' && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editItem ? 'Edit Sertifikasi Dosen' : 'Tambah Sertifikasi Dosen'}
          size="lg"
        >
          <form onSubmit={formSertifikasi.handleSubmit(onSubmit)} className="space-y-4">
            {isManager && (
              <Select
                label="Pegawai / Dosen *"
                options={(pegawaiList || []).map((p) => ({
                  value: p.id.toString(),
                  label: `${p.nama_lengkap} (${p.nidn || p.nip || '-'})`,
                }))}
                value={formSertifikasi.watch('pegawai_id')}
                onChange={(e) => formSertifikasi.setValue('pegawai_id', e.target.value)}
                error={formSertifikasi.formState.errors.pegawai_id?.message}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Select
                  label="Jenis Sertifikasi *"
                  options={(masters?.jenis_sertifikasi || []).map((j) => ({
                    value: j.id.toString(),
                    label: j.nama,
                  }))}
                  placeholder={(masters?.jenis_sertifikasi || []).length === 0 ? '-- Belum ada data jenis sertifikasi --' : '-- Pilih Jenis Sertifikasi --'}
                  value={formSertifikasi.watch('jenis_sertifikasi_id')}
                  onChange={(e) => formSertifikasi.setValue('jenis_sertifikasi_id', e.target.value)}
                  error={formSertifikasi.formState.errors.jenis_sertifikasi_id?.message}
                />
                {(masters?.jenis_sertifikasi || []).length === 0 && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-2">
                    <span>Belum ada jenis sertifikasi.</span>
                    <Link href="/simpeg/master/kompetensi" className="font-semibold underline text-[var(--module-primary)]">
                      Tambah di Master
                    </Link>
                  </p>
                )}
              </div>

              <Input
                label="Tahun Sertifikasi *"
                type="number"
                {...formSertifikasi.register('tahun_sertifikasi')}
                error={formSertifikasi.formState.errors.tahun_sertifikasi?.message}
              />
            </div>

            <Input
              label="Nama Sertifikat Resmi *"
              placeholder="Contoh: Sertifikat Pendidik Profesional"
              {...formSertifikasi.register('nama_sertifikat')}
              error={formSertifikasi.formState.errors.nama_sertifikat?.message}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Bidang Studi / Keahlian *"
                placeholder="Contoh: Teknik Informatika"
                {...formSertifikasi.register('bidang_studi')}
                error={formSertifikasi.formState.errors.bidang_studi?.message}
              />

              <Input
                label="Lembaga Penyelenggara *"
                placeholder="Contoh: Kemendikbudristek"
                {...formSertifikasi.register('penyelenggara')}
                error={formSertifikasi.formState.errors.penyelenggara?.message}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nomor Registrasi / No. Sertifikat"
                placeholder="Contoh: REG-2025-00129"
                {...formSertifikasi.register('nomor_registrasi')}
              />

              <Input
                label="Nomor SK Penetapan"
                placeholder="Contoh: SK/DIKTI/2025/110"
                {...formSertifikasi.register('nomor_sk')}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Unggah Berkas Sertifikat (PDF / Gambar, Maks. 10MB)
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setFileUpload(e.target.files?.[0] || null)}
                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                {editItem ? 'Simpan Perubahan' : 'Tambah Sertifikasi'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL FORM: RIWAYAT TES */}
      {activeTab === 'tes' && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editItem ? 'Edit Riwayat Tes Kemampuan' : 'Tambah Riwayat Tes Kemampuan'}
          size="lg"
        >
          <form onSubmit={formTes.handleSubmit(onSubmit)} className="space-y-4">
            {isManager && (
              <Select
                label="Pegawai / Dosen *"
                options={(pegawaiList || []).map((p) => ({
                  value: p.id.toString(),
                  label: `${p.nama_lengkap} (${p.nidn || p.nip || '-'})`,
                }))}
                value={formTes.watch('pegawai_id')}
                onChange={(e) => formTes.setValue('pegawai_id', e.target.value)}
                error={formTes.formState.errors.pegawai_id?.message}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Select
                  label="Jenis Tes Resmi *"
                  options={(masters?.jenis_tes || []).map((t) => ({
                    value: t.id.toString(),
                    label: `${t.nama} (${t.kategori === 'bahasa' ? 'Bahasa' : 'Potensi Akademik'})`,
                  }))}
                  placeholder={(masters?.jenis_tes || []).length === 0 ? '-- Belum ada data jenis tes --' : '-- Pilih Jenis Tes --'}
                  value={formTes.watch('jenis_tes_id')}
                  onChange={(e) => formTes.setValue('jenis_tes_id', e.target.value)}
                  error={formTes.formState.errors.jenis_tes_id?.message}
                />
                {(masters?.jenis_tes || []).length === 0 && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-2">
                    <span>Belum ada jenis tes resmi.</span>
                    <Link href="/simpeg/master/kompetensi" className="font-semibold underline text-[var(--module-primary)]">
                      Tambah di Master
                    </Link>
                  </p>
                )}
              </div>

              <Input
                label="Skor / Nilai Hasil Tes *"
                type="number"
                step="0.01"
                placeholder="Contoh: 550"
                {...formTes.register('skor')}
                error={formTes.formState.errors.skor?.message}
              />
            </div>

            <Input
              label="Nama Lengkap Sertifikat Tes *"
              placeholder="Contoh: Test of English as a Foreign Language ITP"
              {...formTes.register('nama_tes')}
              error={formTes.formState.errors.nama_tes?.message}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Lembaga Penyelenggara *"
                placeholder="Contoh: Pusat Bahasa ITB / PLTI"
                {...formTes.register('penyelenggara')}
                error={formTes.formState.errors.penyelenggara?.message}
              />

              <Input
                label="Tahun Tes *"
                type="number"
                {...formTes.register('tahun')}
                error={formTes.formState.errors.tahun?.message}
              />
            </div>

            <Input
              label="Masa Berlaku Hingga"
              type="date"
              {...formTes.register('masa_berlaku')}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Unggah Berkas Skor Tes (PDF / Gambar, Maks. 10MB)
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setFileUpload(e.target.files?.[0] || null)}
                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                {editItem ? 'Simpan Perubahan' : 'Simpan Riwayat Tes'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL FORM: PELATIHAN & WORKSHOP */}
      {activeTab === 'pelatihan' && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editItem ? 'Edit Riwayat Pelatihan & Diklat' : 'Tambah Riwayat Pelatihan & Diklat'}
          size="lg"
        >
          <form onSubmit={formPelatihan.handleSubmit(onSubmit)} className="space-y-4">
            {isManager && (
              <Select
                label="Pegawai / Dosen *"
                options={(pegawaiList || []).map((p) => ({
                  value: p.id.toString(),
                  label: `${p.nama_lengkap} (${p.nidn || p.nip || '-'})`,
                }))}
                value={formPelatihan.watch('pegawai_id')}
                onChange={(e) => formPelatihan.setValue('pegawai_id', e.target.value)}
                error={formPelatihan.formState.errors.pegawai_id?.message}
              />
            )}

            <Input
              label="Nama Kegiatan Pelatihan / Diklat / Workshop *"
              placeholder="Contoh: Pelatihan Pekerti Dosen Muda Angkatan 10"
              {...formPelatihan.register('nama_kegiatan')}
              error={formPelatihan.formState.errors.nama_kegiatan?.message}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Jenis Pelatihan"
                options={[
                  { value: '', label: '-- Pilih Jenis --' },
                  ...(masters?.jenis_pelatihan || []).map((p) => ({
                    value: p.id.toString(),
                    label: p.nama,
                  })),
                ]}
                value={formPelatihan.watch('jenis_pelatihan_id')}
                onChange={(e) => formPelatihan.setValue('jenis_pelatihan_id', e.target.value)}
              />

              <Select
                label="Peran Dalam Kegiatan *"
                options={(masters?.peran_pelatihan || []).map((p) => ({
                  value: p.id.toString(),
                  label: p.nama,
                }))}
                value={formPelatihan.watch('peran_id')}
                onChange={(e) => formPelatihan.setValue('peran_id', e.target.value)}
                error={formPelatihan.formState.errors.peran_id?.message}
              />

              <Select
                label="Tingkat Kegiatan"
                options={[
                  { value: '', label: '-- Pilih Tingkat --' },
                  ...(masters?.tingkat_kegiatan || []).map((t) => ({
                    value: t.id.toString(),
                    label: t.nama,
                  })),
                ]}
                value={formPelatihan.watch('tingkat_id')}
                onChange={(e) => formPelatihan.setValue('tingkat_id', e.target.value)}
              />
            </div>

            {((masters?.jenis_pelatihan || []).length === 0 || (masters?.peran_pelatihan || []).length === 0) && (
              <p className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <span>Master jenis pelatihan atau peran belum lengkap?</span>
                <Link href="/simpeg/master/kompetensi" className="font-semibold underline text-[var(--module-primary)]">
                  Kelola di Master Kompetensi
                </Link>
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Tanggal Mulai *"
                type="date"
                {...formPelatihan.register('tanggal_mulai')}
                error={formPelatihan.formState.errors.tanggal_mulai?.message}
              />

              <Input
                label="Tanggal Selesai"
                type="date"
                {...formPelatihan.register('tanggal_selesai')}
              />

              <Input
                label="Jumlah Jam (JP)"
                type="number"
                placeholder="Contoh: 36"
                {...formPelatihan.register('jumlah_jam')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Lembaga Penyelenggara *"
                placeholder="Contoh: LP3M Universitas / Kemendikbud"
                {...formPelatihan.register('penyelenggara')}
                error={formPelatihan.formState.errors.penyelenggara?.message}
              />

              <Input
                label="Tempat Pelaksanaan"
                placeholder="Contoh: Bandung / Daring (Zoom)"
                {...formPelatihan.register('tempat')}
              />
            </div>

            <Input
              label="Nomor Sertifikat Pelatihan"
              placeholder="Contoh: 104/PEKERTI/LP3M/2026"
              {...formPelatihan.register('nomor_sertifikat')}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Unggah Sertifikat Pelatihan (PDF / Gambar, Maks. 10MB)
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setFileUpload(e.target.files?.[0] || null)}
                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                {editItem ? 'Simpan Perubahan' : 'Simpan Riwayat Pelatihan'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Hapus Riwayat Kompetensi"
        message="Apakah Anda yakin ingin menghapus data kompetensi ini? Berkas lampiran terkait juga akan terhapus."
        isLoading={isDeleting}
      />
    </div>
  );
}
