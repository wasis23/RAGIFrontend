'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Users,
  ClipboardList,
  AlertTriangle,
  Plus,
  Trash2,
  Filter,
  FileText,
  Printer,
  Calendar,
  CheckCircle2,
  GraduationCap,
  UserCheck,
  Phone,
  Mail,
  RotateCcw,
  CalendarClock,
  Briefcase,
  ShieldAlert,
  BookOpen,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Textarea } from '@/components/ui/Textarea';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { siakadService } from '@/services/siakad.service';
import { useAuth } from '@/hooks/useAuth';
import {
  EMPTY_PA_REFERENSI,
  fetchPaReferensi,
  referensiLabel,
  referensiOptions,
  variantFor,
  RISIKO_BAND_VARIANT,
  RISIKO_BAND_LABEL,
  JADWAL_STATUS_VARIANT,
  BOOKING_STATUS_VARIANT,
  PKL_STATUS_VARIANT,
  INSIDEN_STATUS_VARIANT,
  PA_REFERENSI_TIPE,
  PA_SINYAL_KEHADIRAN_KRITIS,
  toLocalDateInput,
  toLocalMonthInput,
  type PaReferensiState,
} from '@/lib/siakad/pa-referensi';
import toast from 'react-hot-toast';

const ajukanBimbinganSchema = z.object({
  kategori: z.string().min(1, 'Kategori bimbingan wajib dipilih.'),
  tanggal_bimbingan: z.string().min(1, 'Tanggal konsultasi wajib diisi.'),
  isi: z.string().min(1, 'Topik / isi konsultasi wajib diisi.'),
});

type AjukanBimbinganFormValues = z.infer<typeof ajukanBimbinganSchema>;

const jadwalSchema = z
  .object({
    tanggal: z.string().min(1, 'Tanggal wajib diisi.'),
    jam_mulai: z.string().min(1, 'Jam mulai wajib diisi.'),
    jam_selesai: z.string().min(1, 'Jam selesai wajib diisi.'),
    mode: z.string().min(1, 'Mode pertemuan wajib dipilih.'),
    lokasi: z.string().optional(),
    kuota: z.coerce.number().int('Kuota harus bilangan bulat.').min(1, 'Kuota minimal 1.'),
    catatan: z.string().optional(),
  })
  .refine((v) => v.jam_selesai > v.jam_mulai, {
    message: 'Jam selesai harus lebih besar dari jam mulai.',
    path: ['jam_selesai'],
  });

type JadwalFormValues = z.input<typeof jadwalSchema>;

export default function BimbinganPaPage() {
  const { hasRole, hasPermission, isSuperAdmin, isAdmin } = useAuth();
  const isSuperadminOrBaak = isSuperAdmin || isAdmin || hasRole('baak');

  // RBAC granular (bukan negasi role): visibilitas tab & aksi mengikuti izin.
  const canReadPa = hasPermission('siakad.pa.read');
  const canCreatePa = hasPermission('siakad.pa.create');
  const canUpdatePa = hasPermission('siakad.pa.update');
  const canManagePa = hasPermission('siakad.pa.manage'); // plotting & cakupan semua PA (admin/kaprodi/wakil prodi)
  const canViewMonitoring = canManagePa || canReadPa;
  const canViewLayanan = canManagePa || canReadPa;
  const canViewAllPa = canManagePa;
  const isMahasiswa = !canManagePa && !hasRole('dosen') && hasRole('mahasiswa');

  // Student view states
  const [myPaData, setMyPaData] = useState<any | null>(null);
  const [loadingMyPa, setLoadingMyPa] = useState(false);
  const [isAjukanModalOpen, setIsAjukanModalOpen] = useState(false);

  // Filter riwayat konsultasi mahasiswa. Endpoint riwayat PA sudah mengembalikan
  // seluruh sesi milik mahasiswa itu sendiri, jadi penyaringan cukup di sisi klien.
  const [showRiwayatFilter, setShowRiwayatFilter] = useState(false);
  const [riwayatSearch, setRiwayatSearch] = useState('');
  const [riwayatKategori, setRiwayatKategori] = useState('');

  const {
    register: registerAjukan,
    handleSubmit: handleAjukanSubmit,
    control: ajukanControl,
    reset: resetAjukan,
    formState: { errors: ajukanErrors, isSubmitting: submittingAjukan },
  } = useForm<AjukanBimbinganFormValues>({
    resolver: zodResolver(ajukanBimbinganSchema),
    defaultValues: {
      kategori: 'akademik',
      tanggal_bimbingan: toLocalDateInput(),
      isi: '',
    },
  });

  // Main Tabs: 'mahasiswa' (Mahasiswa Bimbingan & Jurnal) | 'monitoring' (Monitoring Kehadiran/Prestasi/Risiko) | 'layanan' (Jadwal, PKL, Insiden) | 'aktivitas' (Laporan Aktivitas PA - Superadmin/BAAK only)
  const [activeMainTab, setActiveMainTab] = useState<'mahasiswa' | 'monitoring' | 'layanan' | 'aktivitas'>('mahasiswa');

  // Tahun Akademik & Selection
  const [tahunList, setTahunList] = useState<any[]>([]);
  const [selectedTaId, setSelectedTaId] = useState<number | ''>('');

  // Tab 1 States: Mahasiswa & Jurnal
  const [rekap, setRekap] = useState<any[]>([]);
  const [loadingRekap, setLoadingRekap] = useState(true);
  const [advisees, setAdvisees] = useState<any[]>([]);
  const [loadingAdv, setLoadingAdv] = useState(false);
  const [searchAdv, setSearchAdv] = useState('');
  const [catatan, setCatatan] = useState<any[]>([]);
  const [isCatatanOpen, setIsCatatanOpen] = useState(false);
  const [catatanTarget, setCatatanTarget] = useState<any | null>(null);
  const [catatanForm, setCatatanForm] = useState({
    kategori: 'akademik',
    isi: '',
    kesimpulan: '',
    tanggal_bimbingan: toLocalDateInput(),
    butuh_penanganan_khusus: false,
  });
  const [savingCatatan, setSavingCatatan] = useState(false);
  const [deleteCatatan, setDeleteCatatan] = useState<any | null>(null);

  // Monitoring Bimbingan (Fase 1): kehadiran, prestasi, risiko, alerts
  const [monRisiko, setMonRisiko] = useState<any[]>([]);
  const [monSummary, setMonSummary] = useState<any | null>(null);
  const [loadingMon, setLoadingMon] = useState(false);

  // Layanan PA (Fase 2): jadwal & konsultasi, PKL/PL/Magang, insiden, laporan bulanan
  const [paJadwal, setPaJadwal] = useState<any[]>([]);
  const [paBooking, setPaBooking] = useState<any[]>([]);
  const [paPkl, setPaPkl] = useState<any[]>([]);
  const [paInsiden, setPaInsiden] = useState<any[]>([]);
  const [paLaporanBulanan, setPaLaporanBulanan] = useState<any | null>(null);
  const [loadingLayanan, setLoadingLayanan] = useState(false);
  const [layananSubTab, setLayananSubTab] = useState<'jadwal' | 'pkl' | 'insiden' | 'laporan'>('jadwal');
  const [laporanBulan, setLaporanBulan] = useState<string>(toLocalMonthInput());
  const [isJadwalModalOpen, setIsJadwalModalOpen] = useState(false);
  const [savingJadwal, setSavingJadwal] = useState(false);

  // Master referensi PA (sumber tunggal nilai domain: mode/status/jenis/eskalasi).
  const [paReferensi, setPaReferensi] = useState<PaReferensiState>(EMPTY_PA_REFERENSI);
  const kategoriOptions = useMemo(
    () => referensiOptions(paReferensi[PA_REFERENSI_TIPE.catatanKategori]),
    [paReferensi]
  );
  const modeOptions = useMemo(
    () => referensiOptions(paReferensi[PA_REFERENSI_TIPE.jadwalMode]),
    [paReferensi]
  );

  // Form Buat Jadwal (Zod + react-hook-form)
  const {
    register: registerJadwal,
    handleSubmit: handleJadwalSubmit,
    control: jadwalControl,
    reset: resetJadwal,
    formState: { errors: jadwalErrors },
  } = useForm<JadwalFormValues>({
    resolver: zodResolver(jadwalSchema),
    defaultValues: {
      tanggal: toLocalDateInput(),
      jam_mulai: '09:00',
      jam_selesai: '10:00',
      mode: '',
      lokasi: '',
      kuota: 5,
      catatan: '',
    },
  });

  // Filter Drawer State (Tab Mahasiswa)
  const [showFilter, setShowFilter] = useState(false);
  const [filterAngkatan, setFilterAngkatan] = useState('');
  const [filterTglDari, setFilterTglDari] = useState('');
  const [filterTglSampai, setFilterTglSampai] = useState('');
  const [filterNamaDosen, setFilterNamaDosen] = useState('');

  // Tab 2 States: Aktivitas Bimbingan PA per Kelas (Model SIMPA Indonusa)
  const [kelasList, setKelasList] = useState<string[]>([]);
  const [selectedKelas, setSelectedKelas] = useState<string>('');
  const [aktivitasList, setAktivitasList] = useState<any[]>([]);
  const [loadingAktivitas, setLoadingAktivitas] = useState(false);
  const [isAktivitasModalOpen, setIsAktivitasModalOpen] = useState(false);
  const [savingAktivitas, setSavingAktivitas] = useState(false);
  const [editingAktivitasId, setEditingAktivitasId] = useState<number | null>(null);
  const [deletingAktivitas, setDeletingAktivitas] = useState<any | null>(null);

  // Komposisi Mahasiswa Kelas (Otomatis dari DB BAAK)
  const [komposisiKelas, setKomposisiKelas] = useState<{
    total_mahasiswa: number;
    mhs_aktif: number;
    mhs_nonaktif: number;
    mhs_cuti: number;
    mhs_keluar: number;
  }>({
    total_mahasiswa: 0,
    mhs_aktif: 0,
    mhs_nonaktif: 0,
    mhs_cuti: 0,
    mhs_keluar: 0,
  });

  const [aktivitasForm, setAktivitasForm] = useState({
    tanggal: toLocalDateInput(),
    mhs_aktif: 0,
    mhs_nonaktif: 0,
    mhs_cuti: 0,
    mhs_keluar: 0,
    kondisi_mahasiswa: '',
    penanganan_mahasiswa: '',
    kesimpulan: '',
  });

  // Filter advisees based on search & angkatan
  const adviseesTerfilter = advisees.filter((a: any) => {
    if (filterAngkatan && String(a.angkatan) !== String(filterAngkatan)) return false;
    return true;
  });

  const catatanTerfilter = catatan.filter((c: any) => {
    if (selectedTaId && String(c.tahun_akademik_id) !== String(selectedTaId)) return false;
    const tgl = String(c.tanggal_bimbingan || c.created_at || '').slice(0, 10);
    if (filterTglDari && tgl < filterTglDari) return false;
    if (filterTglSampai && tgl > filterTglSampai) return false;
    return true;
  });

  // KRS / KHS / Riwayat Expandable per Mahasiswa
  function AdviseeDetail({ mhs }: { mhs: any }) {
    const [info, setInfo] = useState<{
      loading: boolean;
      ips?: number;
      ipk?: number;
      sks?: number;
      mkCount?: number;
      konversi?: any;
    } | null>(null);

    useEffect(() => {
      let alive = true;
      (async () => {
        setInfo({ loading: true });
        try {
          const [nilaiRes, konvRes] = await Promise.all([
            siakadService.getNilai({ mahasiswa_id: mhs.id, per_page: 100 }).catch(() => null),
            siakadService.getKonversis({ mahasiswa_id: mhs.id }).catch(() => null),
          ]);
          if (!alive) return;
          const rows: any[] = nilaiRes?.data || [];
          const finals = rows.filter((n: any) => n.is_final);
          const sks = finals.reduce((a: number, n: any) => a + Number(n.krs_detail?.kelas?.mata_kuliah?.total_sks || 0), 0);
          const mutu = finals.reduce((a: number, n: any) => a + Number(n.bobot_mutu || 0) * Number(n.krs_detail?.kelas?.mata_kuliah?.total_sks || 0), 0);
          const konversi = (Array.isArray(konvRes?.data) ? konvRes.data : [])[0] || null;
          setInfo({
            loading: false,
            ips: (nilaiRes as any)?.summary?.ips ?? (sks > 0 ? mutu / sks : 0),
            ipk: (nilaiRes as any)?.summary?.ipk ?? 0,
            sks,
            mkCount: finals.length,
            konversi,
          });
        } catch {
          if (alive) setInfo({ loading: false });
        }
      })();
      return () => {
        alive = false;
      };
    }, [mhs.id]);

    if (!info || info.loading) {
      return <p className="py-4 text-center text-2xs text-slate-400">Memuat rincian bimbingan...</p>;
    }

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="bg-white border border-slate-200 rounded-xl p-2.5 text-center">
            <span className="text-2xs text-slate-400 block uppercase font-bold">IPS Terakhir</span>
            <strong className="font-mono text-sm text-primary-700">{Number(info.ips || 0).toFixed(2)}</strong>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-2.5 text-center">
            <span className="text-2xs text-slate-400 block uppercase font-bold">IPK</span>
            <strong className="font-mono text-sm text-emerald-700">{Number(info.ipk || 0).toFixed(2)}</strong>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-2.5 text-center">
            <span className="text-2xs text-slate-400 block uppercase font-bold">SKS Final</span>
            <strong className="font-mono text-sm text-slate-800">{info.sks || 0}</strong>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-2.5 text-center">
            <span className="text-2xs text-slate-400 block uppercase font-bold">MK Lulus</span>
            <strong className="font-mono text-sm text-slate-800">{info.mkCount || 0}</strong>
          </div>
        </div>

        {/* Kontak Mahasiswa Bimbingan (telepon & email dari advisees) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="bg-white border border-slate-200 rounded-xl p-2.5 flex items-center gap-2">
            <span className="text-primary-600"><Phone size={14} /></span>
            <div className="min-w-0">
              <span className="text-2xs text-slate-400 block uppercase font-bold">Telepon</span>
              <span className="font-mono text-slate-800 truncate block">{mhs.telepon || '-'}</span>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-2.5 flex items-center gap-2">
            <span className="text-primary-600"><Mail size={14} /></span>
            <div className="min-w-0">
              <span className="text-2xs text-slate-400 block uppercase font-bold">Email</span>
              <span className="text-slate-800 truncate block">{mhs.email || '-'}</span>
            </div>
          </div>
        </div>

        {info.konversi ? (
          <div className="bg-white border border-amber-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div>
              <span className="font-bold text-slate-900 block">
                Konversi Transfer: {info.konversi.kampus_asal} — {info.konversi.prodi_asal}
              </span>
              <span className="text-2xs text-slate-500">
                {(info.konversi.details || []).length} MK • Status: <strong className="capitalize text-primary-700">{info.konversi.status}</strong>
              </span>
            </div>
            <Badge variant={info.konversi.status === 'disetujui' ? 'green' : 'amber'} className="text-2xs capitalize">
              {info.konversi.status}
            </Badge>
          </div>
        ) : (
          <p className="text-2xs text-slate-400 italic">Tidak ada pengajuan konversi nilai transfer.</p>
        )}

        {/* Log Riwayat Pertemuan Bimbingan Mahasiswa */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold text-slate-700 uppercase tracking-wider block">
              Log Riwayat Pertemuan Bimbingan ({mhs.sesi_list?.length || 0} Pertemuan)
            </span>
            <span className="text-2xs text-slate-400">Tercatat untuk Monev BAAK & Kepegawaian</span>
          </div>
          {(!mhs.sesi_list || mhs.sesi_list.length === 0) ? (
            <p className="text-2xs text-slate-400 italic py-1">Belum ada log sesi bimbingan yang tercatat.</p>
          ) : (
            <div className="space-y-1.5">
              {mhs.sesi_list.map((sesi: any) => (
                <div key={sesi.id} className="bg-white border border-slate-200 rounded-lg p-2.5 text-2xs flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded">
                        Pertemuan ke-{sesi.pertemuan_ke}
                      </span>
                      <span className="font-mono text-slate-500 font-semibold">{sesi.tanggal}</span>
                      <span className="capitalize text-slate-500">• {sesi.kategori}</span>
                      {sesi.butuh_penanganan_khusus && (
                        <span className="bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.2 rounded font-bold">Khusus</span>
                      )}
                    </div>
                    <p className="text-slate-700 mt-1">{sesi.isi}</p>
                    {sesi.kesimpulan && (
                      <p className="text-slate-500 italic mt-0.5">Kesimpulan: {sesi.kesimpulan}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fetch Master Data Awal
  const fetchRekap = async (dari?: string, sampai?: string) => {
    try {
      setLoadingRekap(true);
      const rRes = await siakadService
        .getPaRekap({
          dari_tanggal: dari || undefined,
          sampai_tanggal: sampai || undefined,
        })
        .catch(() => ({ data: [] }));
      if (rRes.data) setRekap(Array.isArray(rRes.data) ? rRes.data : []);
    } catch {
      toast.error('Gagal memuat rekap bimbingan');
    } finally {
      setLoadingRekap(false);
    }
  };

  const fetchAll = async () => {
    try {
      const taRes = await siakadService.getTahunAkademiks().catch(() => null);
      if (taRes?.data?.length) {
        setTahunList(taRes.data);
        const aktif = taRes.data.find((t: any) => t.is_active) || taRes.data[0];
        setSelectedTaId(aktif.id);
      }
    } catch {}
    fetchRekap();
  };

  // Monitoring Bimbingan PA: muat skor risiko (tabel) + ringkasan alerts (kartu)
  const fetchMonitoring = async () => {
    setLoadingMon(true);
    try {
      const [risikoRes, alertsRes] = await Promise.all([
        siakadService.getPaRisiko().catch(() => null),
        siakadService.getPaAlerts().catch(() => null),
      ]);
      setMonRisiko(Array.isArray((risikoRes as any)?.data) ? (risikoRes as any).data : []);
      setMonSummary((alertsRes as any)?.summary || null);
    } catch {
      toast.error('Gagal memuat monitoring bimbingan');
    } finally {
      setLoadingMon(false);
    }
  };

  // Layanan PA (Fase 2): jadwal/konsultasi, PKL, insiden, laporan bulanan (lazy per sub-tab)
  const fetchPaJadwal = async () => {
    try {
      const [jadwalRes, bookingRes] = await Promise.all([
        siakadService.getPaJadwal().catch(() => null),
        siakadService.getPaBooking().catch(() => null),
      ]);
      setPaJadwal(Array.isArray((jadwalRes as any)?.data) ? (jadwalRes as any).data : []);
      setPaBooking(Array.isArray((bookingRes as any)?.data) ? (bookingRes as any).data : []);
    } catch {
      toast.error('Gagal memuat jadwal konsultasi');
    }
  };

  const fetchPaPkl = async () => {
    try {
      const res = await siakadService.getPaPkl().catch(() => null);
      setPaPkl(Array.isArray((res as any)?.data) ? (res as any).data : []);
    } catch {
      toast.error('Gagal memuat status PKL/PL/Magang');
    }
  };

  const fetchPaInsiden = async () => {
    try {
      const res = await siakadService.getPaInsiden().catch(() => null);
      setPaInsiden(Array.isArray((res as any)?.data) ? (res as any).data : []);
    } catch {
      toast.error('Gagal memuat laporan insiden');
    }
  };

  const fetchPaLaporanBulanan = async () => {
    try {
      const res = await siakadService.getPaLaporanBulanan({ bulan: laporanBulan }).catch(() => null);
      setPaLaporanBulanan((res as any)?.data || null);
    } catch {
      toast.error('Gagal memuat laporan monitoring bulanan');
    }
  };

  const fetchLayanan = async () => {
    setLoadingLayanan(true);
    try {
      if (layananSubTab === 'jadwal') await fetchPaJadwal();
      else if (layananSubTab === 'pkl') await fetchPaPkl();
      else if (layananSubTab === 'insiden') await fetchPaInsiden();
      else if (layananSubTab === 'laporan') await fetchPaLaporanBulanan();
    } finally {
      setLoadingLayanan(false);
    }
  };

  const handleSaveJadwal = handleJadwalSubmit(async (values) => {
    setSavingJadwal(true);
    try {
      const res = await siakadService.createPaJadwal({
        tanggal: values.tanggal,
        jam_mulai: values.jam_mulai,
        jam_selesai: values.jam_selesai,
        mode: values.mode,
        lokasi: values.lokasi?.trim() || null,
        kuota: Number(values.kuota),
        catatan: values.catatan?.trim() || null,
      });
      if ((res as any)?.status === 'success') {
        toast.success('Jadwal bimbingan berhasil dibuat');
        setIsJadwalModalOpen(false);
        fetchPaJadwal();
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Gagal membuat jadwal bimbingan');
    } finally {
      setSavingJadwal(false);
    }
  });

  const openJadwalModal = () => {
    resetJadwal({
      tanggal: toLocalDateInput(),
      jam_mulai: '09:00',
      jam_selesai: '10:00',
      mode: modeOptions[0]?.value ?? '',
      lokasi: '',
      kuota: 5,
      catatan: '',
    });
    setIsJadwalModalOpen(true);
  };

  const fetchAdvisees = async () => {
    try {
      setLoadingAdv(true);
      const res = await siakadService.getPaAdvisees({ search: searchAdv || undefined });
      if (res.data) {
        const list = Array.isArray(res.data) ? res.data : [];
        setAdvisees(list);
        // Extract distinct angkatan/kelas bimbingan secara dinamis dari database
        const distinctKelas = [
          ...new Set(
            list
              .map((m: any) => m.kelas || (m.angkatan ? `Angkatan ${m.angkatan}` : ''))
              .filter(Boolean)
          ),
        ] as string[];
        setKelasList(distinctKelas);
        if (distinctKelas.length > 0 && !selectedKelas) {
          setSelectedKelas(distinctKelas[0]);
        }
      }
    } finally {
      setLoadingAdv(false);
    }
  };

  const fetchCatatan = async () => {
    try {
      const res = await siakadService.getPaCatatan({ per_page: 50 } as any);
      if (res.data) setCatatan(Array.isArray(res.data) ? res.data : []);
    } catch {}
  };

  // Fetch Riwayat Aktivitas Bimbingan PA Kelas (SIMPA)
  const fetchAktivitasList = async () => {
    if (!selectedTaId) return;
    try {
      setLoadingAktivitas(true);
      const res = await siakadService.getPaAktivitas({
        tahun_akademik_id: Number(selectedTaId),
        kelas: selectedKelas || undefined,
      });
      if (res.data) {
        setAktivitasList(Array.isArray(res.data) ? res.data : []);
      }
    } catch {
      toast.error('Gagal memuat riwayat aktivitas bimbingan');
    } finally {
      setLoadingAktivitas(false);
    }
  };

  // Fetch Komposisi Mahasiswa Kelas Dinamis dari Database BAAK
  const fetchKomposisiKelas = async () => {
    try {
      const res = await siakadService.getPaKomposisiKelas({
        kelas: selectedKelas || undefined,
      });
      if (res.data) {
        setKomposisiKelas(res.data);
      }
    } catch {}
  };

  // Fetch Mahasiswa PA data
  const fetchMyPa = async () => {
    try {
      setLoadingMyPa(true);
      const res = await siakadService.getMyPa();
      if (res.data) setMyPaData(res.data);
    } catch {
      toast.error('Gagal memuat informasi Pembimbing Akademik');
    } finally {
      setLoadingMyPa(false);
    }
  };

  const onAjukanSubmit = async (values: AjukanBimbinganFormValues) => {
    try {
      await siakadService.createPaCatatan({
        kategori: values.kategori,
        isi: values.isi,
        tanggal_bimbingan: values.tanggal_bimbingan,
      });
      toast.success('Pengajuan bimbingan berhasil dikirim ke Dosen PA');
      setIsAjukanModalOpen(false);
      resetAjukan();
      fetchMyPa();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengirim pengajuan bimbingan');
    }
  };

  // Muat master referensi PA sekali untuk seluruh nilai domain (mode, status, jenis, eskalasi).
  useEffect(() => {
    let alive = true;
    (async () => {
      const ref = await fetchPaReferensi();
      if (alive) setPaReferensi(ref);
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (isMahasiswa) {
      fetchMyPa();
    } else {
      fetchAll();
      fetchAdvisees();
      fetchCatatan();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMahasiswa]);

  useEffect(() => {
    const t = setTimeout(fetchAdvisees, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchAdv]);

  // Rekap mengikuti filter tanggal (lewati render pertama — sudah dimuat fetchAll)
  const firstRekapRender = useRef(true);
  useEffect(() => {
    if (firstRekapRender.current) {
      firstRekapRender.current = false;
      return;
    }
    fetchRekap(filterTglDari, filterTglSampai);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterTglDari, filterTglSampai]);

  useEffect(() => {
    if (activeMainTab === 'aktivitas') {
      fetchAktivitasList();
      fetchKomposisiKelas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMainTab, selectedTaId, selectedKelas]);

  // Layanan PA (Fase 2): muat data saat tab/sub-tab dibuka
  useEffect(() => {
    if (activeMainTab === 'layanan' && canViewLayanan) {
      fetchLayanan();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMainTab, layananSubTab, laporanBulan]);

  // Muat data monitoring saat tab Monitoring dibuka
  useEffect(() => {
    if (activeMainTab === 'monitoring' && canViewMonitoring) {
      fetchMonitoring();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMainTab, canViewMonitoring]);

  // Handler Tab 1: Simpan Catatan Bimbingan Mahasiswa
  const handleSaveCatatan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catatanTarget || !catatanForm.isi.trim()) return;
    try {
      setSavingCatatan(true);
      await siakadService.createPaCatatan({
        mahasiswa_id: catatanTarget.id,
        tahun_akademik_id: selectedTaId || undefined,
        ...catatanForm,
        isi: catatanForm.isi.trim(),
        kesimpulan: catatanForm.kesimpulan.trim() || undefined,
      });
      toast.success('Catatan bimbingan tersimpan');
      setIsCatatanOpen(false);
      setCatatanForm({
        kategori: 'akademik',
        isi: '',
        kesimpulan: '',
        tanggal_bimbingan: toLocalDateInput(),
        butuh_penanganan_khusus: false,
      });
      fetchCatatan();
      fetchAdvisees();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan catatan');
    } finally {
      setSavingCatatan(false);
    }
  };

  // Handler Tab 2: Buka Modal Tambah Aktivitas (Isi Otomatis dari Komposisi DB BAAK)
  const openTambahAktivitasModal = () => {
    setEditingAktivitasId(null);
    setAktivitasForm({
      tanggal: toLocalDateInput(),
      mhs_aktif: komposisiKelas.mhs_aktif || 0,
      mhs_nonaktif: komposisiKelas.mhs_nonaktif || 0,
      mhs_cuti: komposisiKelas.mhs_cuti || 0,
      mhs_keluar: komposisiKelas.mhs_keluar || 0,
      kondisi_mahasiswa: '',
      penanganan_mahasiswa: '',
      kesimpulan: '',
    });
    setIsAktivitasModalOpen(true);
  };

  // Handler Tab 2: Buka Modal Edit Aktivitas
  const openEditAktivitasModal = (row: any) => {
    setEditingAktivitasId(row.id);
    setAktivitasForm({
      tanggal: row.tanggal || toLocalDateInput(),
      mhs_aktif: Number(row.mhs_aktif) || 0,
      mhs_nonaktif: Number(row.mhs_nonaktif) || 0,
      mhs_cuti: Number(row.mhs_cuti) || 0,
      mhs_keluar: Number(row.mhs_keluar) || 0,
      kondisi_mahasiswa: row.kondisi_mahasiswa || '',
      penanganan_mahasiswa: row.penanganan_mahasiswa || '',
      kesimpulan: row.kesimpulan || '',
    });
    setIsAktivitasModalOpen(true);
  };

  // Handler Tab 2: Simpan Aktivitas Bimbingan PA Kelas
  const handleSaveAktivitas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaId) {
      toast.error('Pilih Tahun Akademik terlebih dahulu');
      return;
    }
    if (!aktivitasForm.tanggal) {
      toast.error('Tanggal bimbingan wajib diisi');
      return;
    }

    try {
      setSavingAktivitas(true);
      const payload: any = {
        tahun_akademik_id: Number(selectedTaId),
        kelas: selectedKelas || undefined,
        ...aktivitasForm,
      };
      if (editingAktivitasId) {
        payload.id = editingAktivitasId;
      }
      await siakadService.savePaAktivitas(payload);
      toast.success(editingAktivitasId ? 'Aktivitas bimbingan berhasil diperbarui' : 'Aktivitas bimbingan berhasil dicatat');
      setIsAktivitasModalOpen(false);
      fetchAktivitasList();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan aktivitas bimbingan');
    } finally {
      setSavingAktivitas(false);
    }
  };

  // Handler Tab 2: Hapus Aktivitas
  const handleDeleteAktivitas = async () => {
    if (!deletingAktivitas) return;
    try {
      await siakadService.deletePaAktivitas(deletingAktivitas.id);
      toast.success('Aktivitas bimbingan berhasil dihapus');
      setDeletingAktivitas(null);
      fetchAktivitasList();
    } catch (err: any) {
      toast.error('Gagal menghapus aktivitas bimbingan');
    }
  };

  // Handler Cetak Laporan PDF Resmi
  const handleCetakLaporanPdf = () => {
    if (!selectedTaId) {
      toast.error('Pilih periode semester terlebih dahulu');
      return;
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const params = new URLSearchParams({
      tahun_akademik_id: String(selectedTaId),
    });
    if (selectedKelas) {
      params.append('kelas', selectedKelas);
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
    if (token) {
      params.append('token', token);
    }
    const targetUrl = `${apiUrl}/v1/siakad/bimbingan/aktivitas/cetak?${params.toString()}`;
    window.open(targetUrl, '_blank');
  };

  // Rekap tersaring nama dosen (client-side); ringkasan mengikuti filter ini
  const rekapTerfilter = rekap.filter((r: any) => {
    if (filterNamaDosen) {
      const q = filterNamaDosen.toLowerCase();
      const nama = String(r.nama_lengkap || '').toLowerCase();
      const nidn = String(r.nidn || '').toLowerCase();
      if (!nama.includes(q) && !nidn.includes(q)) return false;
    }
    return true;
  });

  // Ringkasan Totals
  const totals = rekapTerfilter.reduce(
    (a: any, r: any) => {
      (['aktif', 'cuti', 'mangkir', 'keluar', 'lulus', 'total'] as const).forEach((k) => {
        a[k] = (a[k] || 0) + Number(r.komposisi?.[k] || 0);
      });
      a.khusus = (a.khusus || 0) + Number(r.butuh_khusus_aktif || 0);
      return a;
    },
    {}
  );

  // Kolom Rekap Dosen
  const rekapColumns: ColumnDef<any>[] = [
    {
      key: 'dosen',
      label: 'DOSEN PA',
      render: (r) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{r.nama_lengkap}</span>
          <span className="font-mono text-2xs text-slate-400">NIDN {r.nidn || '-'} • {r.program_studi || ''}</span>
        </div>
      ),
    },
    {
      key: 'aktivitas',
      label: 'AKTIVITAS',
      align: 'center',
      render: (r) => (
        <div className="space-y-0.5">
          <span className="font-mono font-black text-slate-900 text-xs block">{r.total_bimbingan || 0} sesi</span>
          {r.belum_bimbingan ? (
            <Badge variant="rose" className="text-2xs">Belum bimbingan</Badge>
          ) : (
            <span className="text-2xs text-slate-400 block">Terakhir: {String(r.terakhir_bimbingan_at || '').slice(0, 10) || '-'}</span>
          )}
        </div>
      ),
    },
    {
      key: 'komposisi',
      label: 'KOMPOSISI BIMBINGAN',
      render: (r) => (
        <div className="flex flex-wrap gap-1 text-2xs font-bold">
          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Aktif {r.komposisi?.aktif || 0}</span>
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">Cuti {r.komposisi?.cuti || 0}</span>
          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">Mangkir {r.komposisi?.mangkir || 0}</span>
          <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">Keluar {r.komposisi?.keluar || 0}</span>
          <span className="px-2 py-0.5 rounded bg-slate-50 text-slate-700 border border-slate-200">Lulus {r.komposisi?.lulus || 0}</span>
          {Number(r.butuh_khusus_aktif || 0) > 0 && (
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">Khusus {r.butuh_khusus_aktif}</span>
          )}
        </div>
      ),
    },
  ];

  // Kolom Mahasiswa Bimbingan
  const advColumns: ColumnDef<any>[] = [
    {
      key: 'mhs',
      label: 'NIM & MAHASISWA',
      render: (r) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{r.nama_lengkap}</span>
          <span className="font-mono text-2xs text-slate-500">{r.nim} • Angkatan {r.angkatan || '-'}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'STATUS / IPK',
      align: 'center',
      render: (r) => (
        <div className="space-y-0.5">
          <Badge variant={r.status === 'aktif' ? 'green' : 'gray'} className="capitalize">{r.status}</Badge>
          <span className="block font-mono text-2xs text-slate-500">IPK {Number(r.ipk || 0).toFixed(2)}</span>
        </div>
      ),
    },
    {
      key: 'sesi',
      label: 'SESI BIMBINGAN',
      align: 'center',
      render: (r) => (
        <div className="space-y-0.5">
          <Badge variant={Number(r.total_bimbingan || 0) > 0 ? 'purple' : 'gray'} className="text-2xs font-bold">
            {r.total_bimbingan || 0} Sesi
          </Badge>
          {r.terakhir_bimbingan_at && (
            <span className="block font-mono text-2xs text-slate-400">
              {String(r.terakhir_bimbingan_at).slice(0, 10)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'kendala',
      label: 'KENDALA TERPANTAU',
      render: (r) => (
        <div className="space-y-1">
          {(r.kendala || []).length === 0 && <span className="text-2xs text-emerald-600 font-bold">✓ Aman</span>}
          {(r.kendala || []).map((k: string, i: number) => (
            <span key={i} className="block text-2xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">• {k}</span>
          ))}
        </div>
      ),
    },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (r) => (
        <Button
          variant="outline"
          icon={<Plus size={13} />}
          className="text-2xs py-1 px-2.5 h-auto font-bold"
          onClick={() => {
            setCatatanTarget(r);
            setCatatanForm({
              kategori: 'akademik',
              isi: '',
              kesimpulan: '',
              tanggal_bimbingan: toLocalDateInput(),
              butuh_penanganan_khusus: false,
            });
            setIsCatatanOpen(true);
          }}
        >
          Catatan
        </Button>
      ),
    },
  ];

  // Kolom Monitoring Bimbingan (Fase 1): kehadiran, IPS/IPK, sinyal risiko, band
  const monColumns: ColumnDef<any>[] = [
    {
      key: 'mhs',
      label: 'NIM & MAHASISWA',
      render: (r) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{r.nama_lengkap}</span>
          <span className="font-mono text-2xs text-slate-500">{r.nim}</span>
        </div>
      ),
    },
    {
      key: 'kehadiran',
      label: 'KEHADIRAN',
      align: 'center',
      render: (r) => {
        if (r.persentase_hadir === null || r.persentase_hadir === undefined) {
          return <span className="text-2xs text-slate-400">Belum ada data</span>;
        }
        const kritis = (r.sinyal || []).some((s: { kode: string }) => s.kode === PA_SINYAL_KEHADIRAN_KRITIS);
        return (
          <Badge variant={kritis ? 'danger' : 'success'} dot>
            {r.persentase_hadir}%
          </Badge>
        );
      },
    },
    {
      key: 'prestasi',
      label: 'IPS / IPK',
      align: 'center',
      render: (r) => (
        <div className="space-y-0.5">
          <span className="block font-mono text-xs text-slate-800">
            IPS {r.ips_terakhir !== null && r.ips_terakhir !== undefined ? Number(r.ips_terakhir).toFixed(2) : '-'}
          </span>
          <span className="block font-mono text-2xs text-slate-500">
            IPK {r.ipk !== null && r.ipk !== undefined && r.ipk !== '' ? Number(r.ipk).toFixed(2) : '-'}
          </span>
          {r.ips_menurun && <Badge variant="warning">IPS menurun</Badge>}
        </div>
      ),
    },
    {
      key: 'sinyal',
      label: 'SINYAL RISIKO',
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          {(r.sinyal || []).map((s: any) => (
            <span
              key={s.kode}
              className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-2xs font-bold"
            >
              {s.label}
            </span>
          ))}
          {(!r.sinyal || r.sinyal.length === 0) && (
            <span className="text-2xs text-slate-400">Tidak ada sinyal</span>
          )}
        </div>
      ),
    },
    {
      key: 'band',
      label: 'RISIKO',
      align: 'center',
      render: (r) => (
        <div className="space-y-0.5">
          <Badge variant={variantFor(RISIKO_BAND_VARIANT, r.band_risiko)}>
            {RISIKO_BAND_LABEL[r.band_risiko] ?? r.band_risiko ?? '-'}
          </Badge>
          <span className="block font-mono text-2xs text-slate-500">Skor {r.skor}</span>
        </div>
      ),
    },
  ];

  // Kolom Tabel Aktivitas Bimbingan (Model SIMPA Indonusa)
  const aktivitasColumns: ColumnDef<any>[] = [
    {
      key: 'pertemuan_ke',
      label: 'PER',
      align: 'center',
      render: (r, idx) => (
        <span className="font-mono font-bold text-xs text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
          {r.pertemuan_ke || idx + 1}
        </span>
      ),
    },
    {
      key: 'tanggal',
      label: 'TANGGAL',
      render: (r) => (
        <div>
          <span className="font-mono font-bold text-xs text-slate-900 block">{r.tanggal || '-'}</span>
          <span className="text-2xs text-slate-400">Kelas: {r.kelas || selectedKelas || 'Umum'}</span>
        </div>
      ),
    },
    {
      key: 'komposisi',
      label: 'AKTIFITAS KULIAH',
      render: (r) => (
        <div className="flex flex-wrap gap-1 text-2xs font-mono font-bold">
          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200" title="Mahasiswa Aktif">
            A: {r.mhs_aktif ?? 0}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200" title="Mahasiswa Non-Aktif / Mangkir">
            N: {r.mhs_nonaktif ?? 0}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200" title="Mahasiswa Cuti">
            C: {r.mhs_cuti ?? 0}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200" title="Mahasiswa Keluar / Lulus">
            K: {r.mhs_keluar ?? 0}
          </span>
        </div>
      ),
    },
    {
      key: 'kondisi_mahasiswa',
      label: 'KONDISI MAHASISWA',
      render: (r) => (
        <p className="text-xs text-slate-800 line-clamp-2 max-w-xs">{r.kondisi_mahasiswa || '-'}</p>
      ),
    },
    {
      key: 'penanganan_mahasiswa',
      label: 'PENANGANAN KHUSUS',
      render: (r) => (
        <p className="text-xs text-amber-900 bg-amber-50/60 border border-amber-200/50 p-1.5 rounded-lg line-clamp-2 max-w-xs">
          {r.penanganan_mahasiswa || 'Tidak ada kendala khusus'}
        </p>
      ),
    },
    {
      key: 'kesimpulan',
      label: 'KESIMPULAN',
      render: (r) => (
        <p className="text-xs text-slate-700 line-clamp-2 max-w-xs">{r.kesimpulan || '-'}</p>
      ),
    },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (r) => (
        <div className="flex justify-end">
          <DropdownMenu
            items={[
              {
                label: 'Edit Aktivitas',
                icon: <FileText size={14} />,
                onClick: () => openEditAktivitasModal(r),
              },
              {
                label: 'Hapus Sesi',
                icon: <Trash2 size={14} />,
                variant: 'danger',
                onClick: () => setDeletingAktivitas(r),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  if (isMahasiswa) {
    const mhs = myPaData?.mahasiswa;
    const dosenPa = myPaData?.dosen_wali;
    const krsAktif = myPaData?.krs_aktif;
    const catatanSiswa = myPaData?.catatan || [];

    const catatanTersaring = catatanSiswa.filter((c: any) => {
      if (riwayatKategori && c.kategori !== riwayatKategori) return false;
      if (riwayatSearch) {
        const kunci = riwayatSearch.toLowerCase();
        const gabung = [c.isi, c.kesimpulan, c.kategori, c.status_tindak_lanjut]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!gabung.includes(kunci)) return false;
      }
      return true;
    });

    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Bimbingan Pembimbing Akademik (PA)"
          description="Konsultasi rencana studi, pemantauan perkembangan akademik, dan komunikasi terpadu bersama Dosen Wali."
          breadcrumbs={[
            { label: 'Portal SSO', href: '/dashboard' },
            { label: 'SIAKAD', href: '/siakad' },
            { label: 'Bimbingan PA' },
          ]}
          action={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                icon={<Filter size={16} />}
                style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
                onClick={() => setShowRiwayatFilter(true)}
              >
                Filter
              </Button>
              <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={() => setIsAjukanModalOpen(true)}
              >
                Ajukan Konsultasi ke PA
              </Button>
            </div>
          }
        />

        {loadingMyPa ? (
          <div className="card p-6 text-center text-slate-400">
            <p className="text-xs">Memuat data bimbingan akademik...</p>
          </div>
        ) : (
          <>
            {/* Top Cards: Dosen PA & Status Akademik */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Dosen PA Card */}
              <div className="card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Dosen Pembimbing Akademik
                  </span>
                  <div className="p-2 rounded-xl text-[var(--module-primary)] bg-[var(--module-primary-subtle)]">
                    <UserCheck size={18} />
                  </div>
                </div>
                {dosenPa ? (
                  <div className="space-y-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{dosenPa.nama_lengkap}</h4>
                      <p className="font-mono text-2xs text-slate-500">NIDN: {dosenPa.nidn || '-'}</p>
                    </div>
                    <div className="text-2xs text-slate-600 space-y-1">
                      <div>Prodi: <strong>{dosenPa.program_studi || '-'}</strong></div>
                      {dosenPa.jabatan_akademik && (
                        <div>Jabatan: <strong>{dosenPa.jabatan_akademik}</strong></div>
                      )}
                      {dosenPa.telepon && (
                        <div className="flex items-center gap-2 pt-1 text-emerald-700 font-semibold">
                          <Phone size={12} />
                          <span>{dosenPa.telepon}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200">
                    Belum ada Dosen Pembimbing Akademik (Wali) yang ditetapkan oleh BAAK.
                  </div>
                )}
              </div>

              {/* Status Mahasiswa Card */}
              <div className="card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status Akademik Mahasiswa
                  </span>
                  <div className="p-2 rounded-xl text-emerald-700 bg-emerald-50">
                    <GraduationCap size={18} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">NIM / Nama:</span>
                    <strong className="font-mono text-slate-800">{mhs?.nim}</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Angkatan:</span>
                    <strong className="text-slate-800">{mhs?.angkatan || '-'}</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Program Studi:</span>
                    <strong className="text-slate-800">{mhs?.program_studi || '-'}</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">IPK Berjalan:</span>
                    <strong className="font-mono text-emerald-700 text-xs">{Number(mhs?.ipk || 0).toFixed(2)}</strong>
                  </div>
                </div>
              </div>

              {/* KRS & Bimbingan Status Card */}
              <div className="card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Aktivitas & Approval KRS
                  </span>
                  <div className="p-2 rounded-xl text-indigo-700 bg-indigo-50">
                    <CheckCircle2 size={18} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Status KRS Semester:</span>
                    <Badge variant={krsAktif?.status === 'disetujui' ? 'green' : 'amber'} className="capitalize text-2xs">
                      {krsAktif?.status || 'Belum Mengisi'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Beban SKS Diambil:</span>
                    <strong className="font-mono text-slate-800">{krsAktif?.total_sks || 0} SKS</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-100">
                    <span className="text-slate-500">Total Bimbingan PA:</span>
                    <strong className="font-mono text-[var(--module-primary)] text-xs">{myPaData?.total_bimbingan || 0} Kali</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Riwayat Sesi Konsultasi & Bimbingan */}
            <div className="card p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-900">
                    Riwayat Konsultasi & Sesi Bimbingan PA
                  </h3>
                  <p className="text-xs text-slate-500">
                    Catatan arahan Dosen Wali, hasil bimbingan studi, dan rekam jejak konsultasi akademik Anda.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus size={16} />}
                  onClick={() => setIsAjukanModalOpen(true)}
                  className="text-xs font-bold"
                >
                  Ajukan Konsultasi
                </Button>
              </div>

              {catatanTersaring.length === 0 ? (
                catatanSiswa.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 gap-2 border border-dashed rounded-xl bg-slate-50">
                    <ClipboardList size={32} className="text-slate-300" />
                    <p className="text-xs font-bold text-slate-600">Belum Ada Riwayat Bimbingan PA</p>
                    <p className="text-2xs text-slate-400 max-w-sm">
                      Silakan klik tombol "Ajukan Konsultasi ke PA" untuk berkonsultasi mengenai rencana studi, KRS, KHS, atau kendala perkuliahan dengan Dosen Pembimbing Akademik Anda.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 gap-2 border border-dashed rounded-xl bg-slate-50">
                    <ClipboardList size={32} className="text-slate-300" />
                    <p className="text-xs font-bold text-slate-600">Tidak Ada Riwayat yang Cocok</p>
                    <p className="text-2xs text-slate-400 max-w-sm">
                      Ubah kata kunci atau kategori pada Filter untuk melihat sesi bimbingan lainnya.
                    </p>
                  </div>
                )
              ) : (
                <div className="space-y-3">
                  {catatanTersaring.map((c: any, idx: number) => (
                    <div
                      key={c.id}
                      className="border border-slate-200 rounded-xl p-4 bg-white hover:border-[var(--module-primary)] transition space-y-2 shadow-sm"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-[var(--module-primary)] bg-[var(--module-primary-subtle)] px-2 py-0.5 rounded text-xs">
                            Sesi Bimbingan #{catatanTersaring.length - idx}
                          </span>
                          <span className="capitalize text-slate-700 font-bold text-xs bg-slate-100 px-2 py-0.5 rounded">
                            {referensiLabel(paReferensi[PA_REFERENSI_TIPE.catatanKategori], c.kategori)}
                          </span>
                          {c.butuh_penanganan_khusus && (
                            <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded text-2xs font-bold">
                              Penanganan Khusus
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-2xs text-slate-400 font-mono">
                          <Calendar size={12} />
                          <span>{c.tanggal_bimbingan ? String(c.tanggal_bimbingan).slice(0, 10) : String(c.created_at).slice(0, 10)}</span>
                          <Badge variant={c.status_tindak_lanjut === 'selesai' ? 'green' : 'amber'} className="text-2xs capitalize">
                            {c.status_tindak_lanjut || 'Dipantau'}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div>
                          <span className="font-bold text-slate-700 text-2xs block uppercase tracking-wider">Topik / Isi Bimbingan:</span>
                          <p className="text-slate-800 leading-relaxed">{c.isi}</p>
                        </div>
                        {c.kesimpulan && (
                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 mt-2">
                            <span className="font-bold text-[var(--module-primary)] text-2xs block uppercase tracking-wider">
                              Arahan & Kesimpulan Dosen PA:
                            </span>
                            <p className="text-slate-700 italic mt-0.5">{c.kesimpulan}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <Drawer
          open={showRiwayatFilter}
          onClose={() => setShowRiwayatFilter(false)}
          title="Filter Riwayat Konsultasi"
          footer={
            <div className="grid grid-cols-2 gap-2 w-full">
              <Button
                variant="outline"
                icon={<RotateCcw size={16} />}
                onClick={() => {
                  setRiwayatSearch('');
                  setRiwayatKategori('');
                }}
              >
                Reset
              </Button>
              <Button icon={<CheckCircle2 size={16} />} onClick={() => setShowRiwayatFilter(false)}>
                Terapkan
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <Input
              label="Pencarian"
              placeholder="Cari isi, kesimpulan, atau kategori..."
              value={riwayatSearch}
              onChange={(e) => setRiwayatSearch(e.target.value)}
            />
            <AsyncSelect
              label="Kategori Bimbingan"
              placeholder="Semua kategori"
              loadOptions={async () => kategoriOptions}
              defaultOptions={kategoriOptions}
              value={riwayatKategori ? kategoriOptions.find((o) => o.value === riwayatKategori) || null : null}
              onChange={(val: any) => setRiwayatKategori(val ? String(val.value) : '')}
              isClearable
            />
          </div>
        </Drawer>

        {/* Modal Ajukan Konsultasi ke Dosen PA */}
        <Modal
          isOpen={isAjukanModalOpen}
          onClose={() => setIsAjukanModalOpen(false)}
          title="Ajukan Konsultasi ke Dosen PA"
          size="md"
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setIsAjukanModalOpen(false)}>
                Batal
              </Button>
              <Button
                variant="primary"
                onClick={handleAjukanSubmit(onAjukanSubmit)}
                loading={submittingAjukan}
                disabled={submittingAjukan}
                icon={<Plus size={16} />}
              >
                Kirim Pengajuan
              </Button>
            </div>
          }
        >
          <form onSubmit={handleAjukanSubmit(onAjukanSubmit)} className="flex flex-col gap-4">
            <Controller
              name="kategori"
              control={ajukanControl}
              render={({ field }) => (
                <AsyncSelect
                  label="Kategori Bimbingan"
                  loadOptions={async () => kategoriOptions}
                  defaultOptions={kategoriOptions}
                  value={kategoriOptions.find((o) => o.value === field.value) || null}
                  onChange={(val: any) => field.onChange(val ? String(val.value) : '')}
                  error={ajukanErrors.kategori?.message}
                  isClearable={false}
                />
              )}
            />
            <Input
              label="Tanggal Konsultasi"
              type="date"
              required
              {...registerAjukan('tanggal_bimbingan')}
              error={ajukanErrors.tanggal_bimbingan?.message}
            />
            <Textarea
              label="Topik / Isi Konsultasi"
              required
              rows={4}
              placeholder="Jelaskan topik yang ingin dikonsultasikan kepada Dosen PA (misal: rencana SKS semester depan, kendala mata kuliah, persiapan magang/skripsi)..."
              {...registerAjukan('isi')}
              error={ajukanErrors.isi?.message}
            />
          </form>
        </Modal>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={canViewAllPa ? 'Bimbingan PA (Rekap & Aktivitas)' : 'Bimbingan PA (Pembimbing Akademik)'}
        description={
          canViewAllPa
            ? 'Rekap menyeluruh per dosen PA, pantau penanganan khusus, dan evaluasi laporan aktivitas.'
            : 'Pantau progres mahasiswa bimbingan, catat log pertemuan, dan kelola laporan aktivitas per kelas (SIMPA).'
        }
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Bimbingan PA' },
        ]}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
              <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">Periode:</span>
              <select
                value={selectedTaId}
                onChange={(e) => setSelectedTaId(Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
              >
                {tahunList.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.nama}
                    {t.is_active ? ' (Aktif)' : ''}
                  </option>
                ))}
              </select>
            </div>
            {activeMainTab === 'mahasiswa' && (
              <Button
                variant="outline"
                icon={<Filter size={15} />}
                className="font-bold text-xs min-h-[38px]"
                onClick={() => setShowFilter(true)}
              >
                Filter
              </Button>
            )}
            {isSuperadminOrBaak && activeMainTab === 'aktivitas' && (
              <>
                <Button
                  variant="outline"
                  icon={<Printer size={15} />}
                  className="font-bold text-xs min-h-[38px] text-slate-700"
                  onClick={handleCetakLaporanPdf}
                >
                  Cetak PDF
                </Button>
                <Button
                  variant="primary"
                  icon={<Plus size={15} />}
                  className="font-bold text-xs min-h-[38px]"
                  onClick={openTambahAktivitasModal}
                >
                  Tambah Aktivitas
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Tab Navigasi Utama: Mahasiswa & Jurnal / Monitoring Bimbingan / Laporan Aktivitas PA (Superadmin & BAAK) */}
      <div className="flex flex-wrap border-b border-slate-200 gap-2">
        <button
          type="button"
          onClick={() => setActiveMainTab('mahasiswa')}
          className={`px-4 py-3 -mb-px text-xs font-extrabold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
            activeMainTab === 'mahasiswa'
              ? 'border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle)] rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ClipboardList size={14} />
          Mahasiswa Bimbingan & Jurnal Sesi
        </button>
        {canViewMonitoring && (
          <button
            type="button"
            onClick={() => setActiveMainTab('monitoring')}
            className={`px-4 py-3 -mb-px text-xs font-extrabold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeMainTab === 'monitoring'
                ? 'border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle)] rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <AlertTriangle size={14} />
            Monitoring Bimbingan
          </button>
        )}
        {canViewLayanan && (
          <button
            type="button"
            onClick={() => setActiveMainTab('layanan')}
            className={`px-4 py-3 -mb-px text-xs font-extrabold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeMainTab === 'layanan'
                ? 'border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle)] rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <CalendarClock size={14} />
            Jadwal, PKL &amp; Layanan
          </button>
        )}
        {isSuperadminOrBaak && (
          <button
            type="button"
            onClick={() => setActiveMainTab('aktivitas')}
            className={`px-4 py-3 -mb-px text-xs font-extrabold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeMainTab === 'aktivitas'
                ? 'border-[var(--module-primary)] text-[var(--module-primary)] bg-[var(--module-primary-subtle)] rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText size={14} />
            Laporan Aktivitas PA per Kelas (Monev BAAK)
          </button>
        )}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: MAHASISWA BIMBINGAN & JURNAL SESI                 */}
      {/* ======================================================== */}
      {activeMainTab === 'mahasiswa' && (
        <div className="space-y-6 animate-fade-in">
          {/* Ringkasan Komposisi Mahasiswa */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              ['Total Bimbingan', totals.total || 0],
              ['Aktif', totals.aktif || 0],
              ['Cuti', totals.cuti || 0],
              ['Mangkir', totals.mangkir || 0],
              ['Keluar', totals.keluar || 0],
              ['Lulus', totals.lulus || 0],
              ['Butuh Khusus', totals.khusus || 0],
            ].map(([label, val]) => (
              <div key={label as string} className="card p-4 text-center">
                <span className="text-2xs font-bold text-slate-500 uppercase block whitespace-nowrap">{label}</span>
                <span className="text-2xl font-black font-mono text-slate-900">{val as number}</span>
              </div>
            ))}
          </div>

          {canViewAllPa && (
            <div className="card p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Users size={16} className="text-[var(--module-primary)]" /> Rekap per Dosen PA
                </h3>
                {(filterNamaDosen || filterTglDari || filterTglSampai) && (
                  <span className="text-2xs text-slate-500">
                    Filter rekap
                    {filterNamaDosen ? ` • "${filterNamaDosen}"` : ''}
                    {filterTglDari || filterTglSampai ? ` • ${filterTglDari || '…'} s/d ${filterTglSampai || '…'}` : ''}
                  </span>
                )}
              </div>
              <DataTable
                columns={rekapColumns}
                data={rekapTerfilter}
                isLoading={loadingRekap}
                emptyMessage="Belum ada data bimbingan."
              />
            </div>
          )}

          <div className="card p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <ClipboardList size={16} className="text-[var(--module-primary)]" />
                {canViewAllPa ? 'Mahasiswa Bimbingan (semua PA)' : 'Mahasiswa Bimbingan Saya'}
              </h3>
              {(searchAdv || filterAngkatan) && (
                <span className="text-2xs text-slate-500">
                  Filter: {searchAdv ? `"${searchAdv}"` : ''}
                  {searchAdv && filterAngkatan ? ' • ' : ''}
                  {filterAngkatan ? `Angkatan ${filterAngkatan}` : ''}
                </span>
              )}
            </div>
            <DataTable
              columns={advColumns}
              data={adviseesTerfilter}
              isLoading={loadingAdv}
              emptyMessage="Belum ada mahasiswa bimbingan."
              defaultExpandedAll={false}
              renderExpandedRow={(r: any) => <AdviseeDetail mhs={r} />}
            />
          </div>

          <div className="card p-5 space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-600" /> Log Catatan & Jurnal Sesi Bimbingan Terbaru
            </h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {catatanTerfilter.length === 0 && (
                <p className="text-2xs text-slate-400 italic py-2">Belum ada catatan bimbingan yang tercatat.</p>
              )}
              {catatanTerfilter.slice(0, 20).map((c: any) => (
                <div key={c.id} className="p-3 border border-slate-200 rounded-xl text-xs space-y-1 bg-white">
                  <div className="flex items-center justify-between gap-2">
                    <strong className="text-slate-900">
                      {c.mahasiswa?.nama_lengkap}{' '}
                      <span className="font-mono text-2xs text-slate-400">{c.mahasiswa?.nim}</span>
                    </strong>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant="blue" className="text-2xs">{c.kategori}</Badge>
                      {c.butuh_penanganan_khusus && <Badge variant="rose" className="text-2xs">Khusus</Badge>}
                      <button
                        type="button"
                        onClick={() => setDeleteCatatan(c)}
                        className="text-slate-300 hover:text-[var(--module-primary)] cursor-pointer"
                        title="Hapus"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{c.isi}</p>
                  {c.kesimpulan && (
                    <p className="text-xs bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-emerald-900">
                      <strong>Kesimpulan:</strong> {c.kesimpulan}
                    </p>
                  )}
                  <p className="text-2xs text-slate-400">
                    {c.tanggal_bimbingan ? `${String(c.tanggal_bimbingan).slice(0, 10)} • ` : ''}
                    PA: {c.dosen?.nama_lengkap || '-'} • {c.status_tindak_lanjut}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB: MONITORING BIMBINGAN (Kehadiran, Prestasi, Risiko)  */}
      {/* ======================================================== */}
      {activeMainTab === 'monitoring' && canViewMonitoring && (
        <div className="space-y-6 animate-fade-in">
          {/* Ringkasan Monitoring (dari endpoint alerts) */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {[
              ['Total Advisees', monSummary?.total_advisees ?? 0, 'text-slate-900'],
              ['Risiko Tinggi', monSummary?.risiko_tinggi ?? 0, 'text-rose-700'],
              ['Risiko Sedang', monSummary?.risiko_sedang ?? 0, 'text-amber-700'],
              ['Kehadiran Kritis', monSummary?.kehadiran_kritis ?? 0, 'text-orange-700'],
              ['Perlu Perhatian', monSummary?.perlu_perhatian ?? 0, 'text-purple-700'],
            ].map(([label, val]) => (
              <div key={label as string} className="card p-4 text-center">
                <span className="text-2xs font-bold text-slate-500 uppercase block whitespace-nowrap">{label}</span>
                <span className="text-2xl font-black font-mono text-slate-900">{val as number}</span>
              </div>
            ))}
          </div>

          {/* Tabel Monitoring Risiko & Prestasi */}
          <div className="card p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <AlertTriangle size={16} className="text-[var(--module-primary)]" />
                {canViewAllPa ? 'Monitoring Bimbingan (semua PA)' : 'Monitoring Bimbingan Saya'}
              </h3>
              <span className="text-2xs text-slate-500">Kehadiran &bull; IPS/IPK &bull; Sinyal &amp; Skor Risiko</span>
            </div>
            <DataTable
              columns={monColumns}
              data={monRisiko}
              isLoading={loadingMon}
              emptyMessage="Belum ada data monitoring (kehadiran/prestasi) untuk advisees Anda."
            />
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB: JADWAL, PKL & LAYANAN PA (Fase 2)                    */}
      {/* ======================================================== */}
      {activeMainTab === 'layanan' && canViewLayanan && (
        <div className="space-y-6 animate-fade-in">
          {/* Sub-tab navigasi layanan PA */}
          <div className="flex flex-wrap gap-2">
            {([
              ['jadwal', 'Jadwal & Konsultasi', <CalendarClock key="i" size={14} />],
              ['pkl', 'Status PKL/PL/Magang', <Briefcase key="i" size={14} />],
              ['insiden', 'Laporan Insiden & Konseling', <ShieldAlert key="i" size={14} />],
              ['laporan', 'Laporan Monitoring Bulanan', <FileText key="i" size={14} />],
            ] as const).map(([key, label, icon]) => (
              <button
                key={key}
                type="button"
                onClick={() => setLayananSubTab(key)}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  layananSubTab === key
                    ? 'bg-[var(--module-primary)] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>

          {/* Sub: Jadwal & Konsultasi */}
          {layananSubTab === 'jadwal' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="card p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <CalendarClock size={16} className="text-[var(--module-primary)]" />
                    Slot Jadwal Bimbingan
                  </h3>
                  {canCreatePa && (
                    <Button
                      variant="primary"
                      icon={<Plus size={14} />}
                      className="text-xs font-bold py-1.5 px-3 h-auto"
                      onClick={openJadwalModal}
                    >
                      Buat Jadwal
                    </Button>
                  )}
                </div>
                <DataTable
                  columns={[
                    { key: 'tanggal', label: 'Tanggal', render: (r: any) => <span className="text-xs font-semibold">{r.tanggal}</span> },
                    { key: 'jam', label: 'Jam', render: (r: any) => <span className="text-xs font-mono">{r.jam_mulai}–{r.jam_selesai}</span> },
                    { key: 'mode', label: 'Mode', render: (r: any) => <Badge variant="blue" className="text-2xs">{referensiLabel(paReferensi[PA_REFERENSI_TIPE.jadwalMode], r.mode)}</Badge> },
                    { key: 'lokasi', label: 'Lokasi', render: (r: any) => <span className="text-2xs text-slate-600">{r.lokasi || '-'}</span> },
                    { key: 'kuota', label: 'Kuota', render: (r: any) => <span className="text-xs font-mono">{r.bookings_count ?? 0}/{r.kuota}</span> },
                    { key: 'status', label: 'Status', render: (r: any) => <Badge variant={variantFor(JADWAL_STATUS_VARIANT, r.status)} className="text-2xs">{referensiLabel(paReferensi[PA_REFERENSI_TIPE.jadwalStatus], r.status)}</Badge> },
                  ] as ColumnDef<any>[]}
                  data={paJadwal}
                  isLoading={loadingLayanan && layananSubTab === 'jadwal'}
                  emptyMessage="Belum ada slot jadwal bimbingan."
                />
              </div>
              <div className="card p-5 space-y-3">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <UserCheck size={16} className="text-[var(--module-primary)]" />
                  Pengajuan Konsultasi Mahasiswa
                </h3>
                <DataTable
                  columns={[
                    { key: 'mahasiswa', label: 'Mahasiswa', render: (r: any) => (
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-800">{r.mahasiswa?.nama_lengkap || '-'}</span>
                        <span className="text-2xs text-slate-500 font-mono">{r.mahasiswa?.nim || ''}</span>
                      </div>
                    ) },
                    { key: 'topik', label: 'Topik', render: (r: any) => <span className="text-2xs text-slate-600">{r.topik || '-'}</span> },
                    { key: 'status', label: 'Status', render: (r: any) => (
                      <Badge variant={variantFor(BOOKING_STATUS_VARIANT, r.status)} className="text-2xs">
                        {referensiLabel(paReferensi[PA_REFERENSI_TIPE.bookingStatus], r.status)}
                      </Badge>
                    ) },
                  ] as ColumnDef<any>[]}
                  data={paBooking}
                  isLoading={loadingLayanan && layananSubTab === 'jadwal'}
                  emptyMessage="Belum ada pengajuan konsultasi."
                />
              </div>
            </div>
          )}

          {/* Sub: PKL/PL/Magang */}
          {layananSubTab === 'pkl' && (
            <div className="card p-5 space-y-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Briefcase size={16} className="text-[var(--module-primary)]" />
                Status PKL / PL / Magang Mahasiswa Bimbingan
              </h3>
              <DataTable
                columns={[
                  { key: 'mahasiswa', label: 'Mahasiswa', render: (r: any) => (
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-800">{r.mahasiswa?.nama_lengkap || '-'}</span>
                      <span className="text-2xs text-slate-500 font-mono">{r.mahasiswa?.nim || ''}</span>
                    </div>
                  ) },
                  { key: 'jenis', label: 'Jenis', render: (r: any) => <Badge variant="purple" className="text-2xs">{referensiLabel(paReferensi[PA_REFERENSI_TIPE.pklJenis], r.jenis)}</Badge> },
                  { key: 'instansi', label: 'Instansi', render: (r: any) => <span className="text-xs text-slate-700">{r.instansi}</span> },
                  { key: 'periode', label: 'Periode', render: (r: any) => <span className="text-2xs font-mono text-slate-600">{r.tanggal_mulai || '-'} s.d {r.tanggal_selesai || '-'}</span> },
                  { key: 'status', label: 'Status', render: (r: any) => (
                    <Badge variant={variantFor(PKL_STATUS_VARIANT, r.status)} className="text-2xs">{referensiLabel(paReferensi[PA_REFERENSI_TIPE.pklStatus], r.status)}</Badge>
                  ) },
                ] as ColumnDef<any>[]}
                data={paPkl}
                isLoading={loadingLayanan && layananSubTab === 'pkl'}
                emptyMessage="Belum ada data PKL/PL/Magang."
              />
            </div>
          )}

          {/* Sub: Insiden & Konseling */}
          {layananSubTab === 'insiden' && (
            <div className="card p-5 space-y-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <ShieldAlert size={16} className="text-[var(--module-primary)]" />
                Laporan Insiden (Kekerasan/Pelecehan) &amp; Rujukan Konseling
              </h3>
              <DataTable
                columns={[
                  { key: 'identitas', label: 'Pelapor', render: (r: any) => (
                    r.anonim
                      ? <Badge variant="gray" className="text-2xs">Anonim</Badge>
                      : <span className="text-xs font-semibold text-slate-800">{r.mahasiswa?.nama_lengkap || '-'}</span>
                  ) },
                  { key: 'jenis', label: 'Jenis Insiden', render: (r: any) => <Badge variant="red" className="text-2xs">{referensiLabel(paReferensi[PA_REFERENSI_TIPE.insidenJenis], r.jenis)}</Badge> },
                  { key: 'status', label: 'Status', render: (r: any) => (
                    <Badge variant={variantFor(INSIDEN_STATUS_VARIANT, r.status)} className="text-2xs">{referensiLabel(paReferensi[PA_REFERENSI_TIPE.insidenStatus], r.status)}</Badge>
                  ) },
                  { key: 'eskalasi', label: 'Eskalasi', render: (r: any) => r.eskalasi_tujuan ? <Badge variant="blue" className="text-2xs">{referensiLabel(paReferensi[PA_REFERENSI_TIPE.eskalasiTujuan], r.eskalasi_tujuan)}</Badge> : <span className="text-2xs text-slate-400">-</span> },
                  { key: 'konseling', label: 'Konseling', render: (r: any) => r.rujukan_konseling ? <Badge variant="green" className="text-2xs">{r.konseling_ke || '-'}</Badge> : <span className="text-2xs text-slate-400">-</span> },
                ] as ColumnDef<any>[]}
                data={paInsiden}
                isLoading={loadingLayanan && layananSubTab === 'insiden'}
                emptyMessage="Belum ada laporan insiden."
              />
            </div>
          )}

          {/* Sub: Laporan Monitoring Bulanan */}
          {layananSubTab === 'laporan' && (
            <div className="space-y-4">
              <div className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-700">Periode Laporan Bulanan</span>
                <Input
                  type="month"
                  value={laporanBulan}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLaporanBulan(e.target.value)}
                  className="text-xs font-semibold py-1.5 px-3"
                />
              </div>
              {paLaporanBulanan ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      ['Total Advisees', paLaporanBulanan.kehadiran?.total_advisees ?? 0],
                      ['Kehadiran Kritis', paLaporanBulanan.kehadiran?.kehadiran_kritis ?? 0],
                      ['Risiko Tinggi', paLaporanBulanan.risiko?.tinggi ?? 0],
                      ['Risiko Sedang', paLaporanBulanan.risiko?.sedang ?? 0],
                      ['Pengajuan Konsultasi', paLaporanBulanan.konsultasi?.total_pengajuan ?? 0],
                      ['PKL Berjalan', paLaporanBulanan.pkl?.berjalan ?? 0],
                      ['Insiden', paLaporanBulanan.insiden?.total ?? 0],
                      ['Rujukan Konseling', paLaporanBulanan.insiden?.rujukan_konseling ?? 0],
                    ].map(([label, val]) => (
                      <div key={label as string} className="card p-4 text-center">
                        <span className="text-2xs font-bold text-slate-500 uppercase block whitespace-nowrap">{label}</span>
                        <span className="text-2xl font-black font-mono text-slate-900">{val as number}</span>
                      </div>
                    ))}
                  </div>
                  <div className="card p-5 space-y-3">
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <AlertTriangle size={16} className="text-[var(--module-primary)]" />
                      Mahasiswa Perlu Perhatian ({paLaporanBulanan.periode?.bulan})
                    </h3>
                    <DataTable
                      columns={[
                        { key: 'nama', label: 'Mahasiswa', render: (r: any) => (
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-slate-800">{r.nama_lengkap}</span>
                            <span className="text-2xs text-slate-500 font-mono">{r.nim}</span>
                          </div>
                        ) },
                        { key: 'skor', label: 'Skor', render: (r: any) => <span className="text-xs font-mono font-bold">{r.skor}</span> },
                        { key: 'band', label: 'Band Risiko', render: (r: any) => (
                          <Badge variant={variantFor(RISIKO_BAND_VARIANT, r.band_risiko)} className="text-2xs">{RISIKO_BAND_LABEL[r.band_risiko] ?? r.band_risiko ?? '-'}</Badge>
                        ) },
                        { key: 'sinyal', label: 'Sinyal', render: (r: any) => <span className="text-2xs text-slate-600">{(r.sinyal || []).map((s: any) => s.label).join(' • ')}</span> },
                      ] as ColumnDef<any>[]}
                      data={paLaporanBulanan.risiko?.daftar_perlu_perhatian || []}
                      isLoading={loadingLayanan && layananSubTab === 'laporan'}
                      emptyMessage="Tidak ada mahasiswa yang perlu perhatian khusus."
                    />
                  </div>
                </>
              ) : (
                <div className="card p-6 text-center text-xs text-slate-500">
                  {loadingLayanan && layananSubTab === 'laporan' ? 'Memuat laporan…' : 'Tidak ada data laporan untuk periode ini.'}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: LAPORAN AKTIVITAS BIMBINGAN PA PER KELAS (SIMPA)  */}
      {/* ======================================================== */}
      {isSuperadminOrBaak && activeMainTab === 'aktivitas' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Bar Kontrol Kelas & Cetak */}
          <div className="card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-bold text-slate-700">Pilih Kelas / Angkatan:</span>
              <select
                value={selectedKelas}
                onChange={(e) => setSelectedKelas(e.target.value)}
                className="select text-xs font-semibold py-1.5 px-3 min-w-[200px]"
              >
                {kelasList.length === 0 && <option value="">Semua Mahasiswa Bimbingan</option>}
                {kelasList.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
              <Badge variant="purple" className="text-xs font-mono font-bold">
                Total Mahasiswa: {komposisiKelas.total_mahasiswa} Orang
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                icon={<Printer size={15} />}
                className="text-xs font-bold py-1.5 px-3 h-auto"
                onClick={handleCetakLaporanPdf}
              >
                Cetak Laporan PDF
              </Button>
              <Button
                variant="primary"
                icon={<Plus size={15} />}
                className="text-xs font-bold py-1.5 px-3 h-auto"
                onClick={openTambahAktivitasModal}
              >
                + Tambah Aktivitas Bimbingan
              </Button>
            </div>
          </div>

          {/* Banner Komposisi Mahasiswa Kelas Aktif (Real-Time Database BAAK) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
              <span className="text-2xs text-emerald-700 uppercase font-bold block">Mahasiswa Aktif (A)</span>
              <strong className="font-mono text-xl text-emerald-800">{komposisiKelas.mhs_aktif}</strong>
            </div>
            <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 text-center">
              <span className="text-2xs text-slate-600 uppercase font-bold block">Non-Aktif / Mangkir (N)</span>
              <strong className="font-mono text-xl text-slate-700">{komposisiKelas.mhs_nonaktif}</strong>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
              <span className="text-2xs text-amber-700 uppercase font-bold block">Cuti Akademik (C)</span>
              <strong className="font-mono text-xl text-amber-800">{komposisiKelas.mhs_cuti}</strong>
            </div>
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-center">
              <span className="text-2xs text-rose-700 uppercase font-bold block">Keluar / Lulus (K/L)</span>
              <strong className="font-mono text-xl text-rose-800">{komposisiKelas.mhs_keluar}</strong>
            </div>
          </div>

          {/* DataTable Riwayat Sesi Aktivitas Bimbingan Kelas */}
          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <FileText size={16} className="text-primary-600" />
                  Riwayat Pertemuan Aktivitas Bimbingan PA — Kelas {selectedKelas || 'Bimbingan'}
                </h3>
                <p className="text-2xs text-slate-500">
                  Data pelaporan aktivitas tersinkronisasi untuk format cetak PDF BAAK & Pimpinan.
                </p>
              </div>
              <span className="text-2xs font-mono font-bold text-slate-500">
                {aktivitasList.length} Sesi Tercatat
              </span>
            </div>

            <DataTable
              columns={aktivitasColumns}
              data={aktivitasList}
              isLoading={loadingAktivitas}
              emptyMessage="Belum ada catatan aktivitas bimbingan untuk kelas ini. Klik '+ Tambah Aktivitas Bimbingan' untuk memulai."
            />
          </div>
        </div>
      )}

      {/* Filter Drawer (Tab Mahasiswa) */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Mahasiswa Bimbingan"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setSearchAdv('');
                setFilterAngkatan('');
                setFilterTglDari('');
                setFilterTglSampai('');
                setFilterNamaDosen('');
                setShowFilter(false);
              }}
            >
              Reset
            </Button>
            <Button variant="primary" onClick={() => setShowFilter(false)}>
              Terapkan
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-5">
          <Input
            label="Pencarian Mahasiswa"
            placeholder="Cari NIM atau nama..."
            value={searchAdv}
            onChange={(e) => setSearchAdv(e.target.value)}
          />
          {canViewAllPa && (
            <Input
              label="Nama Dosen PA"
              placeholder="Cari nama / NIDN dosen..."
              value={filterNamaDosen}
              onChange={(e) => setFilterNamaDosen(e.target.value)}
            />
          )}
          <div>
            <label className="label">Angkatan</label>
            <select
              value={filterAngkatan}
              onChange={(e) => setFilterAngkatan(e.target.value)}
              className="select w-full"
            >
              <option value="">Semua angkatan</option>
              {[...new Set(advisees.map((a: any) => a.angkatan).filter(Boolean))]
                .sort()
                .map((a: any) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Dari Tanggal"
              type="date"
              value={filterTglDari}
              onChange={(e) => setFilterTglDari(e.target.value)}
            />
            <Input
              label="Sampai Tanggal"
              type="date"
              value={filterTglSampai}
              onChange={(e) => setFilterTglSampai(e.target.value)}
            />
          </div>
        </div>
      </Drawer>

      {/* Modal Form Catatan Bimbingan Per Mahasiswa */}
      <Modal
        open={isCatatanOpen}
        onClose={() => setIsCatatanOpen(false)}
        title={`Catatan Bimbingan — ${catatanTarget?.nama_lengkap || ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsCatatanOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSaveCatatan} disabled={savingCatatan}>
              {savingCatatan ? 'Menyimpan...' : 'Simpan Catatan'}
            </Button>
          </>
        }
      >
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 mb-4 text-xs text-sky-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold">Pertemuan Ke-{Number(catatanTarget?.total_bimbingan || 0) + 1}</span>
            <span className="text-sky-700">({catatanTarget?.nim})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xs font-bold text-sky-800 bg-sky-100/80 px-2 py-0.5 rounded border border-sky-200">
              Periode: {tahunList.find((t: any) => t.id === selectedTaId)?.nama || 'Semester Aktif'}
            </span>
            <Badge variant="blue" className="text-2xs font-mono font-bold">
              Total Sesi Tercatat: {catatanTarget?.total_bimbingan || 0}
            </Badge>
          </div>
        </div>
        <form onSubmit={handleSaveCatatan} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AsyncSelect
            label="Kategori Kendala"
            required
            loadOptions={async () => kategoriOptions}
            defaultOptions={kategoriOptions}
            value={kategoriOptions.find((o) => o.value === catatanForm.kategori) || null}
            onChange={(v: any) => setCatatanForm({ ...catatanForm, kategori: v ? String(v.value) : '' })}
          />
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={catatanForm.butuh_penanganan_khusus}
                onChange={(e) => setCatatanForm({ ...catatanForm, butuh_penanganan_khusus: e.target.checked })}
                className="rounded text-primary-600 cursor-pointer"
              />
              Butuh penanganan khusus
            </label>
          </div>
          <div>
            <label className="label font-bold">Tanggal Bimbingan *</label>
            <input
              type="date"
              required
              value={catatanForm.tanggal_bimbingan}
              onChange={(e) => setCatatanForm({ ...catatanForm, tanggal_bimbingan: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:border-primary-500 font-mono"
            />
          </div>
          <div className="md:col-span-2">
            <label className="label font-bold">Isi Catatan / Pembahasan *</label>
            <textarea
              rows={3}
              required
              value={catatanForm.isi}
              onChange={(e) => setCatatanForm({ ...catatanForm, isi: e.target.value })}
              placeholder="cth. Menunggak UKT 1 semester, sudah diarahkan ajukan dispensasi..."
              className="textarea w-full text-xs"
            />
          </div>
          <div className="md:col-span-2">
            <label className="label font-bold">Kesimpulan Pertemuan Ini</label>
            <textarea
              rows={2}
              value={catatanForm.kesimpulan}
              onChange={(e) => setCatatanForm({ ...catatanForm, kesimpulan: e.target.value })}
              placeholder="cth. Disepakati cicilan UKT + pantau KRS minggu depan..."
              className="textarea w-full text-xs"
            />
          </div>
        </form>
      </Modal>

      {/* Modal Form Aktivitas Bimbingan PA Kelas (SIMPA) */}
      <Modal
        open={isAktivitasModalOpen}
        onClose={() => setIsAktivitasModalOpen(false)}
        title={editingAktivitasId ? 'Edit Aktivitas Bimbingan PA' : 'Tambah Sesi Aktivitas Bimbingan PA'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsAktivitasModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSaveAktivitas} disabled={savingAktivitas}>
              {savingAktivitas ? 'Menyimpan...' : 'Simpan Aktivitas Bimbingan'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveAktivitas} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-xs text-sky-900 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-bold block">
                Kelas: {selectedKelas || 'Seluruh Mahasiswa Bimbingan'}
              </span>
              <span className="text-2xs text-sky-700">
                Tahun Akademik: {tahunList.find((t: any) => t.id === selectedTaId)?.nama || '-'}
              </span>
            </div>
            <span className="text-2xs font-mono font-bold bg-sky-200/70 px-2 py-0.5 rounded">
              Komposisi Mahasiswa Terisi Otomatis dari BAAK
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label font-bold">Tanggal Aktivitas Bimbingan *</label>
              <input
                type="date"
                required
                value={aktivitasForm.tanggal}
                onChange={(e) => setAktivitasForm({ ...aktivitasForm, tanggal: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:border-primary-500 font-mono"
              />
            </div>
          </div>

          {/* Input Komposisi Mahasiswa */}
          <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50 space-y-2">
            <span className="text-2xs font-bold text-slate-700 uppercase tracking-wider block">
              Aktifitas Kuliah (Komposisi Mahasiswa Kelas)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <Input
                label="Mhs Aktif (A)"
                type="number"
                min="0"
                value={aktivitasForm.mhs_aktif}
                onChange={(e) =>
                  setAktivitasForm({ ...aktivitasForm, mhs_aktif: Number(e.target.value) || 0 })
                }
              />
              <Input
                label="Non-Aktif / Mangkir (N)"
                type="number"
                min="0"
                value={aktivitasForm.mhs_nonaktif}
                onChange={(e) =>
                  setAktivitasForm({ ...aktivitasForm, mhs_nonaktif: Number(e.target.value) || 0 })
                }
              />
              <Input
                label="Mhs Cuti (C)"
                type="number"
                min="0"
                value={aktivitasForm.mhs_cuti}
                onChange={(e) =>
                  setAktivitasForm({ ...aktivitasForm, mhs_cuti: Number(e.target.value) || 0 })
                }
              />
              <Input
                label="Mhs Keluar (K)"
                type="number"
                min="0"
                value={aktivitasForm.mhs_keluar}
                onChange={(e) =>
                  setAktivitasForm({ ...aktivitasForm, mhs_keluar: Number(e.target.value) || 0 })
                }
              />
            </div>
          </div>

          <div>
            <label className="label font-bold">Kondisi Mahasiswa Saat Ini</label>
            <textarea
              rows={2}
              value={aktivitasForm.kondisi_mahasiswa}
              onChange={(e) =>
                setAktivitasForm({ ...aktivitasForm, kondisi_mahasiswa: e.target.value })
              }
              placeholder="cth. Mahasiswa mengikuti perkuliahan dengan baik, motivasi tinggi..."
              className="textarea w-full text-xs"
            />
          </div>

          <div>
            <label className="label font-bold">Mahasiswa Butuh Penanganan Khusus</label>
            <textarea
              rows={2}
              value={aktivitasForm.penanganan_mahasiswa}
              onChange={(e) =>
                setAktivitasForm({ ...aktivitasForm, penanganan_mahasiswa: e.target.value })
              }
              placeholder="cth. 1 mahasiswa menunggak SPP, 1 mahasiswa sering tidak hadir..."
              className="textarea w-full text-xs"
            />
          </div>

          <div>
            <label className="label font-bold">Kesimpulan / Hasil Bimbingan</label>
            <textarea
              rows={2}
              value={aktivitasForm.kesimpulan}
              onChange={(e) => setAktivitasForm({ ...aktivitasForm, kesimpulan: e.target.value })}
              placeholder="cth. Diarahkan mengajukan keringanan pembayaran dan komitmen hadir..."
              className="textarea w-full text-xs"
            />
          </div>
        </form>
      </Modal>

      {/* Modal Konfirmasi Hapus Catatan */}
      <Modal
        open={!!deleteCatatan}
        onClose={() => setDeleteCatatan(null)}
        title="Hapus Catatan Bimbingan?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteCatatan(null)}>
              Batal
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                if (!deleteCatatan) return;
                await siakadService.deletePaCatatan(deleteCatatan.id);
                toast.success('Catatan dihapus');
                setDeleteCatatan(null);
                fetchCatatan();
              }}
            >
              Hapus
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-500">
          Catatan untuk <strong>{deleteCatatan?.mahasiswa?.nama_lengkap}</strong> akan dihapus.
        </p>
      </Modal>

      {/* Modal Konfirmasi Hapus Aktivitas Kelas */}
      <Modal
        open={!!deletingAktivitas}
        onClose={() => setDeletingAktivitas(null)}
        title="Hapus Sesi Aktivitas Bimbingan?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeletingAktivitas(null)}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleDeleteAktivitas}>
              Hapus
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-500">
          Aktivitas bimbingan tanggal <strong>{deletingAktivitas?.tanggal}</strong> untuk kelas{' '}
          <strong>{deletingAktivitas?.kelas || selectedKelas}</strong> akan dihapus permanen.
        </p>
      </Modal>

      {/* Modal Buat Jadwal Bimbingan PA (Fase 2) */}
      <Modal
        open={isJadwalModalOpen}
        onClose={() => setIsJadwalModalOpen(false)}
        title="Buat Slot Jadwal Bimbingan PA"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsJadwalModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" form="jadwal-pa-form" variant="primary" disabled={savingJadwal}>
              {savingJadwal ? 'Menyimpan...' : 'Simpan Jadwal'}
            </Button>
          </>
        }
      >
        <form id="jadwal-pa-form" onSubmit={handleSaveJadwal} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Tanggal"
            type="date"
            required
            {...registerJadwal('tanggal')}
            error={jadwalErrors.tanggal?.message}
          />
          <Input
            label="Kuota Peserta"
            type="number"
            min={1}
            required
            {...registerJadwal('kuota')}
            error={jadwalErrors.kuota?.message}
          />
          <Input
            label="Jam Mulai"
            type="time"
            required
            {...registerJadwal('jam_mulai')}
            error={jadwalErrors.jam_mulai?.message}
          />
          <Input
            label="Jam Selesai"
            type="time"
            required
            {...registerJadwal('jam_selesai')}
            error={jadwalErrors.jam_selesai?.message}
          />
          <Controller
            name="mode"
            control={jadwalControl}
            render={({ field }) => (
              <AsyncSelect
                label="Mode Pertemuan"
                required
                loadOptions={async () => modeOptions}
                defaultOptions={modeOptions}
                value={modeOptions.find((o) => o.value === field.value) || null}
                onChange={(v: any) => field.onChange(v ? String(v.value) : '')}
                error={jadwalErrors.mode?.message}
                isClearable={false}
              />
            )}
          />
          <Input
            label="Lokasi / Tautan"
            placeholder="cth. R. 201 / meet.google.com/xxx"
            {...registerJadwal('lokasi')}
            error={jadwalErrors.lokasi?.message}
          />
          <div className="md:col-span-2">
            <Textarea
              label="Catatan"
              rows={2}
              placeholder="cth. Khusus bimbingan KRS semester ganjil"
              {...registerJadwal('catatan')}
              error={jadwalErrors.catatan?.message}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
