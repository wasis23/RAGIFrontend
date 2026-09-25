'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { siakadService } from '@/services/siakad.service';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const KATEGORI = [
  { value: 'akademik', label: 'Akademik / Nilai' },
  { value: 'krs', label: 'KRS' },
  { value: 'khs', label: 'KHS / IPK' },
  { value: 'keuangan', label: 'Pembayaran / Keuangan' },
  { value: 'pribadi', label: 'Pribadi / Konseling' },
  { value: 'lainnya', label: 'Lainnya' },
];

export default function BimbinganPaPage() {
  const { user } = useAuthStore();
  const userRoles = user?.roles?.map((r: any) => (typeof r === 'string' ? r : r.slug)) || [];
  const isSuperadminOrBaak = userRoles.includes('superadmin') || userRoles.includes('admin') || userRoles.includes('baak');
  const isDosenOnly = userRoles.includes('dosen') && !isSuperadminOrBaak && !userRoles.includes('kaprodi') && !userRoles.includes('wakil_prodi');

  // Main Tabs: 'mahasiswa' (Mahasiswa Bimbingan & Jurnal) | 'aktivitas' (Laporan Aktivitas PA Model SIMPA - Superadmin/BAAK only)
  const [activeMainTab, setActiveMainTab] = useState<'mahasiswa' | 'aktivitas'>('mahasiswa');

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
    tanggal_bimbingan: new Date().toISOString().slice(0, 10),
    butuh_penanganan_khusus: false,
  });
  const [savingCatatan, setSavingCatatan] = useState(false);
  const [deleteCatatan, setDeleteCatatan] = useState<any | null>(null);

  // Filter Drawer State (Tab Mahasiswa)
  const [showFilter, setShowFilter] = useState(false);
  const [filterAngkatan, setFilterAngkatan] = useState('');
  const [filterTglDari, setFilterTglDari] = useState('');
  const [filterTglSampai, setFilterTglSampai] = useState('');

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
    tanggal: new Date().toISOString().slice(0, 10),
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
  const fetchAll = async () => {
    try {
      setLoadingRekap(true);
      const [rRes, taRes] = await Promise.all([
        siakadService.getPaRekap().catch(() => ({ data: [] })),
        siakadService.getTahunAkademiks().catch(() => null),
      ]);
      if (rRes.data) setRekap(Array.isArray(rRes.data) ? rRes.data : []);
      if (taRes?.data?.length) {
        setTahunList(taRes.data);
        const aktif = taRes.data.find((t: any) => t.is_active) || taRes.data[0];
        setSelectedTaId(aktif.id);
      }
    } catch {
      toast.error('Gagal memuat rekap bimbingan');
    } finally {
      setLoadingRekap(false);
    }
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

  useEffect(() => {
    fetchAll();
    fetchAdvisees();
    fetchCatatan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(fetchAdvisees, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchAdv]);

  useEffect(() => {
    if (activeMainTab === 'aktivitas') {
      fetchAktivitasList();
      fetchKomposisiKelas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMainTab, selectedTaId, selectedKelas]);

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
        tanggal_bimbingan: new Date().toISOString().slice(0, 10),
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
      tanggal: new Date().toISOString().slice(0, 10),
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
      tanggal: row.tanggal || new Date().toISOString().slice(0, 10),
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

  // Ringkasan Totals
  const totals = rekap.reduce(
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
          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">Lulus {r.komposisi?.lulus || 0}</span>
          {Number(r.butuh_khusus_aktif || 0) > 0 && (
            <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">Khusus {r.butuh_khusus_aktif}</span>
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
              tanggal_bimbingan: new Date().toISOString().slice(0, 10),
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

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={isDosenOnly ? 'Bimbingan PA (Pembimbing Akademik)' : 'Bimbingan PA (Rekap & Aktivitas)'}
        description={
          isDosenOnly
            ? 'Pantau progres mahasiswa bimbingan, catat log pertemuan, dan kelola laporan aktivitas per kelas (SIMPA).'
            : 'Rekap menyeluruh per dosen PA, pantau penanganan khusus, dan evaluasi laporan aktivitas.'
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

      {/* Tab Navigasi Utama: Mahasiswa & Jurnal (Dosen & Admin) VS Laporan Aktivitas PA (Superadmin & BAAK) */}
      {isSuperadminOrBaak && (
        <div className="flex border-b border-slate-200 gap-2">
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
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 1: MAHASISWA BIMBINGAN & JURNAL SESI                 */}
      {/* ======================================================== */}
      {activeMainTab === 'mahasiswa' && (
        <div className="space-y-6 animate-fade-in">
          {/* Ringkasan Komposisi Mahasiswa */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              ['Total Bimbingan', totals.total || 0, 'text-slate-900'],
              ['Aktif', totals.aktif || 0, 'text-emerald-700'],
              ['Cuti', totals.cuti || 0, 'text-slate-500'],
              ['Mangkir', totals.mangkir || 0, 'text-amber-700'],
              ['Keluar', totals.keluar || 0, 'text-rose-700'],
              ['Lulus', totals.lulus || 0, 'text-blue-700'],
              ['Butuh Khusus', totals.khusus || 0, 'text-purple-700'],
            ].map(([label, val, cls]) => (
              <div key={label as string} className="card p-4 text-center">
                <span className="text-2xs font-bold text-slate-500 uppercase block">{label}</span>
                <span className={`text-2xl font-black font-mono ${cls}`}>{val as number}</span>
              </div>
            ))}
          </div>

          {!isDosenOnly && (
            <div className="card p-5 space-y-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Users size={16} className="text-primary-600" /> Rekap per Dosen PA
              </h3>
              <DataTable
                columns={rekapColumns}
                data={rekap}
                isLoading={loadingRekap}
                emptyMessage="Belum ada data bimbingan."
              />
            </div>
          )}

          <div className="card p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <ClipboardList size={16} className="text-primary-600" />
                {isDosenOnly ? 'Mahasiswa Bimbingan Saya' : 'Mahasiswa Bimbingan (semua PA)'}
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
                        className="text-slate-300 hover:text-rose-600 cursor-pointer"
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
          <Select
            label="Kategori Kendala"
            required
            options={KATEGORI}
            value={catatanForm.kategori}
            onChange={(v: any) => setCatatanForm({ ...catatanForm, kategori: String(v) })}
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
    </div>
  );
}
