'use client';

import { useState, useEffect } from 'react';
import { CalendarCheck, MapPin, Plus, Search, Filter, Clock, Users, Edit3, Trash2, BookOpen, FileText, CheckCircle2, Award, Download, MoreVertical } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu, type DropdownMenuItem } from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { siakadService } from '@/services/siakad.service';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function PerkuliahanKelasPage() {
  const { user } = useAuthStore();
  const [kelas, setKelas] = useState<any[]>([]);
  const [matakuliahs, setMatakuliahs] = useState<any[]>([]);
  const [dosens, setDosens] = useState<any[]>([]);
  const [prodis, setProdis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter Drawer State
  const [showFilter, setShowFilter] = useState(false);
  const [search, setSearch] = useState('');
  const [filterHari, setFilterHari] = useState('');
  const [filterProdi, setFilterProdi] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    hari: '',
    prodi: '',
  });

  // Check roles
  const userRoles = user?.roles?.map((r: any) => typeof r === 'string' ? r : r.slug) || [];
  const isMahasiswa = userRoles.includes('mahasiswa');
  const isDosen = userRoles.includes('dosen');
  const isAdmin = userRoles.includes('superadmin') || userRoles.includes('admin');

  // Modal Kelas state (Admin)
  const [isKelasModalOpen, setIsKelasModalOpen] = useState(false);
  const [editingKelas, setEditingKelas] = useState<any | null>(null);
  const [modalSearchMk, setModalSearchMk] = useState('');
  const [searchDosenUtama, setSearchDosenUtama] = useState('');
  const [isDosenSelectOpen, setIsDosenSelectOpen] = useState(false);
  const [searchTeamTeaching, setSearchTeamTeaching] = useState('');
  const [ruangans, setRuangans] = useState<any[]>([]);
  const [searchRuangan, setSearchRuangan] = useState('');
  const [isRuanganSelectOpen, setIsRuanganSelectOpen] = useState(false);

  const [kelasForm, setKelasForm] = useState({
    mata_kuliah_id: 1,
    tahun_akademik_id: 1,
    program_studi_id: 1,
    ruangan_id: 1,
    dosen_id: 1,
    team_teaching_dosen_ids: [] as number[],
    kode_kelas: '',
    nama_kelas: '',
    kapasitas: 40,
    kuota_krs: 40,
    hari: 'senin',
    jam_mulai: '08:00',
    jam_selesai: '10:30',
  });
  const [saving, setSaving] = useState(false);

  // Modal RPS (Rencana Pembelajaran Semester)
  const [selectedRpsKelas, setSelectedRpsKelas] = useState<any | null>(null);
  const [rpsDetail, setRpsDetail] = useState<any | null>(null);
  const [loadingRps, setLoadingRps] = useState(false);
  const [isEditingRps, setIsEditingRps] = useState(false);
  const [rpsForm, setRpsForm] = useState({
    deskripsi_singkat: '',
    pustaka_utama: '',
    pustaka_pendukung: '',
    dosen_pengembang_id: 1,
    koordinator_rmk_id: 1,
    kaprodi_id: 1,
    mingguan: [] as any[],
  });
  const [savingRps, setSavingRps] = useState(false);

  // Student Attendance States
  const [selectedAbsenKelas, setSelectedAbsenKelas] = useState<any | null>(null);
  const [isAbsensiModalOpen, setIsAbsensiModalOpen] = useState(false);
  const [pertemuans, setPertemuans] = useState<any[]>([]);
  const [activePertemuan, setActivePertemuan] = useState<any | null>(null);
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [isNewPertemuanOpen, setIsNewPertemuanOpen] = useState(false);
  const [newPertemuanForm, setNewPertemuanForm] = useState({
    pertemuan_ke: 1,
    tanggal: new Date().toISOString().slice(0, 10),
    materi: '',
    jam_mulai: '08:00',
    jam_selesai: '10:30',
  });
  const [savingAbsen, setSavingAbsen] = useState(false);

  const fetchPertemuans = async (kelasId: number) => {
    try {
      const res = await siakadService.getPertemuans(kelasId);
      if (res.data) setPertemuans(res.data);
    } catch (err: any) {
      toast.error('Gagal memuat daftar pertemuan');
    }
  };

  const handleOpenAbsensi = (k: any) => {
    setSelectedAbsenKelas(k);
    fetchPertemuans(k.id);
    setActivePertemuan(null);
    setIsAbsensiModalOpen(true);
  };

  const handleCreatePertemuan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingAbsen(true);
      await siakadService.createPertemuan(selectedAbsenKelas.id, newPertemuanForm);
      toast.success('Pertemuan baru berhasil dibuat.');
      setIsNewPertemuanOpen(false);
      fetchPertemuans(selectedAbsenKelas.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal membuat pertemuan. Pastikan RPS disetujui.');
    } finally {
      setSavingAbsen(false);
    }
  };

  const handleViewAttendanceDetails = async (p: any) => {
    setActivePertemuan(p);
    try {
      const res = await siakadService.getAbsensiList(p.id);
      if (res.data && res.data.absensi) {
        setAttendanceList(res.data.absensi);
      }
    } catch (err: any) {
      toast.error('Gagal memuat data kehadiran mahasiswa');
    }
  };

  const handleSaveAttendance = async () => {
    try {
      setSavingAbsen(true);
      const payload = attendanceList.map((item) => ({
        mahasiswa_id: item.mahasiswa_id,
        status: item.status,
        catatan: item.catatan || '',
      }));
      await siakadService.saveAbsensi(activePertemuan.id, { absensi: payload });
      toast.success('Presensi mahasiswa berhasil disimpan.');
      setActivePertemuan(null);
      fetchPertemuans(selectedAbsenKelas.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan absensi');
    } finally {
      setSavingAbsen(false);
    }
  };


  const handleOpenRps = async (k: any) => {
    setSelectedRpsKelas(k);
    try {
      setLoadingRps(true);
      const res = await siakadService.getRps({
        program_studi_id: k.program_studi_id || k.mata_kuliah?.kurikulum?.program_studi_id,
      });
      if (res.data) {
        const match = res.data.find((r: any) => r.mata_kuliah_id === k.mata_kuliah_id) || res.data[0];
        if (match) {
          const detailRes = await siakadService.showRps(match.id);
          if (detailRes.data) {
            setRpsDetail(detailRes.data);
            setRpsForm({
              deskripsi_singkat: detailRes.data.deskripsi_singkat || '',
              pustaka_utama: detailRes.data.pustaka_utama || '',
              pustaka_pendukung: detailRes.data.pustaka_pendukung || '',
              dosen_pengembang_id: detailRes.data.dosen_pengembang_id || 1,
              koordinator_rmk_id: detailRes.data.koordinator_rmk_id || 1,
              kaprodi_id: detailRes.data.kaprodi_id || 1,
              mingguan: detailRes.data.mingguan || [],
            });
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRps(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [mRes, dRes, pRes, rRes] = await Promise.all([
        siakadService.getMataKuliahs({ per_page: 200 }),
        siakadService.getDosens({ per_page: 200 }),
        siakadService.getProdi(),
        siakadService.getRefRuangan(),
      ]);
      if (mRes.data) setMatakuliahs(mRes.data);
      if (dRes.data) setDosens(dRes.data);
      if (pRes.data) setProdis(pRes.data);
      if (rRes.data) setRuangans(rRes.data);
    } catch (err) {}
  };

  const fetchKelas = async () => {
    try {
      setLoading(true);
      const res = await siakadService.getKelas({
        search: appliedFilters.search || undefined,
        hari: appliedFilters.hari || undefined,
        program_studi_id: appliedFilters.prodi || undefined,
        my_teaching_only: isDosen && !isAdmin ? true : undefined,
        my_enrolled_only: isMahasiswa && !isAdmin ? true : undefined,
      });
      if (res.data) setKelas(res.data);
    } catch (err: any) {
      toast.error('Gagal memuat jadwal kelas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    fetchKelas();
  }, [appliedFilters]);

  const handleOpenKelasModal = (item?: any) => {
    setModalSearchMk('');
    setSearchTeamTeaching('');
    if (item) {
      setEditingKelas(item);
      const primaryDosen = item.dosen_pengampu?.find((dp: any) => dp.peran === 'pengampu_utama')?.dosen || item.dosen_pengampu?.[0]?.dosen;
      const primaryDosenId = primaryDosen?.id || 1;
      const teamTeachingIds = item.dosen_pengampu?.filter((dp: any) => dp.peran !== 'pengampu_utama').map((dp: any) => dp.dosen_id) || [];
      setSearchDosenUtama(primaryDosen?.nama_lengkap || '');
      setIsDosenSelectOpen(false);

      const currentRoom = item.ruangan;
      setSearchRuangan(currentRoom ? `[${currentRoom.gedung?.nama || 'Gedung'}] ${currentRoom.nama} (${currentRoom.kode})` : '');
      setIsRuanganSelectOpen(false);

      setKelasForm({
        mata_kuliah_id: item.mata_kuliah_id,
        tahun_akademik_id: item.tahun_akademik_id || 1,
        program_studi_id: item.program_studi_id || item.mata_kuliah?.kurikulum?.program_studi_id || 1,
        ruangan_id: item.ruangan_id || (ruangans[0]?.id || 1),
        dosen_id: primaryDosenId,
        team_teaching_dosen_ids: teamTeachingIds,
        kode_kelas: item.kode_kelas,
        nama_kelas: item.nama_kelas,
        kapasitas: item.kapasitas,
        kuota_krs: item.kuota_krs,
        hari: item.hari,
        jam_mulai: item.jam_mulai ? item.jam_mulai.slice(0, 5) : '08:00',
        jam_selesai: item.jam_selesai ? item.jam_selesai.slice(0, 5) : '10:30',
      });
    } else {
      setEditingKelas(null);
      const defaultProdiId = prodis[0]?.id || 1;
      const openedMkIds = kelas.map((k) => k.mata_kuliah_id);
      const initialMks = matakuliahs.filter((m) => (!m.kurikulum?.program_studi_id || m.kurikulum?.program_studi_id === defaultProdiId) && !openedMkIds.includes(m.id));
      const defaultMk = initialMks[0] || matakuliahs[0];
      const defaultDosen = dosens[0];
      const defaultRoom = ruangans[0];

      setSearchDosenUtama(defaultDosen?.nama_lengkap || '');
      setIsDosenSelectOpen(false);

      setSearchRuangan(defaultRoom ? `[${defaultRoom.gedung?.nama || 'Gedung'}] ${defaultRoom.nama} (${defaultRoom.kode})` : '');
      setIsRuanganSelectOpen(false);

      setKelasForm({
        mata_kuliah_id: defaultMk?.id || 1,
        tahun_akademik_id: 1,
        program_studi_id: defaultProdiId,
        ruangan_id: defaultRoom?.id || 1,
        dosen_id: defaultDosen?.id || 1,
        team_teaching_dosen_ids: [],
        kode_kelas: defaultMk ? `${defaultMk.kode_mk}-A` : 'IF101-A',
        nama_kelas: defaultMk ? `${defaultMk.nama} (Kelas A)` : 'Kelas A',
        kapasitas: defaultRoom?.kapasitas || 40,
        kuota_krs: defaultRoom?.kapasitas || 40,
        hari: 'senin',
        jam_mulai: '08:00',
        jam_selesai: '10:30',
      });
    }
    setIsKelasModalOpen(true);
  };

  const handleSaveKelas = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editingKelas) {
        await siakadService.updateKelas(editingKelas.id, kelasForm);
        toast.success('Kelas perkuliahan berhasil diperbarui');
      } else {
        await siakadService.createKelas(kelasForm);
        toast.success('Kelas perkuliahan baru berhasil dibuka');
      }
      setIsKelasModalOpen(false);
      fetchKelas();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal menyimpan kelas');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteKelas = async (id: number) => {
    if (!confirm('Yakin ingin menghapus kelas perkuliahan ini?')) return;
    try {
      await siakadService.deleteKelas(id);
      toast.success('Kelas perkuliahan berhasil dihapus');
      fetchKelas();
    } catch (err: any) {
      toast.error('Gagal menghapus kelas');
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      key: 'kode_kelas',
      label: 'KODE KELAS',
      render: (row) => (
        <span className="font-mono font-bold text-slate-900 text-xs">
          {row.kode_kelas}
        </span>
      ),
    },
    {
      key: 'program_studi',
      label: 'PROGRAM STUDI',
      render: (row) => (
        <Badge variant="blue">
          {row.program_studi?.nama || row.mata_kuliah?.kurikulum?.program_studi?.nama || 'S1 Sistem Informasi'}
        </Badge>
      ),
    },
    {
      key: 'mata_kuliah',
      label: 'MATA KULIAH',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">
            {row.mata_kuliah?.nama}
          </span>
          <span className="text-2xs text-slate-500 font-normal">
            ({row.mata_kuliah?.total_sks} SKS • {row.mata_kuliah?.kode_mk})
          </span>
        </div>
      ),
    },
    {
      key: 'dosen_pengampu',
      label: 'DOSEN PENGAMPU',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">
            {row.dosen_pengampu?.find((dp: any) => dp.peran === 'pengampu_utama')?.dosen?.nama_lengkap ||
              row.dosen_pengampu?.[0]?.dosen?.nama_lengkap ||
              'Dosen Pengampu'}
          </span>
          {row.dosen_pengampu?.length > 1 && (
            <div className="mt-0.5">
              <Badge variant="purple" className="text-2xs">
                +{row.dosen_pengampu.length - 1} Tim Teaching
              </Badge>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'jadwal',
      label: 'JADWAL & WAKTU',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-800 capitalize block text-xs">
            {row.hari}
          </span>
          <span className="text-2xs text-slate-500 font-mono">
            {row.jam_mulai ? row.jam_mulai.slice(0, 5) : '08:00'} -{' '}
            {row.jam_selesai ? row.jam_selesai.slice(0, 5) : '10:30'} WIB
          </span>
        </div>
      ),
    },
    {
      key: 'ruangan',
      label: 'RUANGAN (SINAPRA)',
      render: (row) =>
        row.ruangan ? (
          <div>
            <Badge variant="purple" className="inline-flex items-center gap-1">
              <MapPin size={11} /> {row.ruangan.nama}
            </Badge>
            <span className="block text-[10px] text-slate-500 font-medium mt-0.5">
              {row.ruangan.gedung?.nama || 'Gedung'} • Lt. {row.ruangan.lantai || 1} ({row.ruangan.kapasitas} Kursi)
            </span>
          </div>
        ) : (
          <Badge variant="gray" className="inline-flex items-center gap-1">
            <MapPin size={11} /> Belum diatur
          </Badge>
        ),
    },
    {
      key: 'rps',
      label: 'RPS SILABUS',
      align: 'center',
      render: (row) => (
        <Button
          variant="outline"
          icon={<FileText size={12} />}
          className="text-2xs py-1 px-2.5 h-auto font-bold"
          onClick={() => handleOpenRps(row)}
        >
          Lihat RPS
        </Button>
      ),
    },
    ...(!isMahasiswa && !isDosen
      ? [
          {
            key: 'kuota',
            label: 'KUOTA',
            align: 'center' as const,
            render: (row: any) => (
              <span className="tabular-nums font-bold text-slate-800 text-xs">
                {row.krs_details_count || 0} / {row.kapasitas}
              </span>
            ),
          },
        ]
      : []),
    {
      key: 'actions',
      label: 'AKSI',
      align: 'right',
      render: (row) => {
        const items: DropdownMenuItem[] = [
          {
            label: 'Lihat Silabus RPS',
            icon: <FileText size={14} />,
            onClick: () => {
              handleOpenRps(row);
            },
          },
        ];

        if (isDosen) {
          items.push({
            label: 'Input Absensi Mahasiswa',
            icon: <CalendarCheck size={14} />,
            onClick: () => {
              handleOpenAbsensi(row);
            },
          });
        }

        if (!isMahasiswa && !isDosen) {
          items.push(
            {
              label: 'Edit Kelas',
              icon: <Edit3 size={14} />,
              onClick: () => {
                handleOpenKelasModal(row);
              },
            },
            {
              label: 'Hapus Kelas',
              icon: <Trash2 size={14} />,
              variant: 'danger' as const,
              onClick: () => {
                handleDeleteKelas(row.id);
              },
            }
          );
        }

        return <DropdownMenu items={items} />;
      },
    },
  ];

  return (
    <div>
      <div className="space-y-6 animate-fade-in print:hidden">
        <PageHeader
          title={
            isMahasiswa
              ? 'Jadwal Kuliah & RPS Saya'
              : isDosen
              ? 'Jadwal Mengajar & RPS Pengampu'
              : 'Jadwal Perkuliahan & Penggunaan Ruang'
          }
          description={
            isMahasiswa
              ? 'Jadwal tatap muka mingguan, alokasi ruang kelas SINAPRA, dosen pengampu, dan Rencana Pembelajaran Semester (RPS).'
              : isDosen
              ? 'Daftar kelas yang diampu pada semester aktif, kuota mahasiswa, dan silabus RPS perkuliahan.'
              : 'Alokasi jadwal kelas, ruang perkuliahan terintegrasi modul SINAPRA, dan penetapan dosen pengampu.'
          }
          breadcrumbs={[
            { label: 'Portal SSO', href: '/dashboard' },
            { label: 'SIAKAD', href: '/siakad' },
            { label: 'Jadwal Perkuliahan' },
          ]}
          action={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                icon={<Filter size={16} />}
                onClick={() => setShowFilter(true)}
              >
                Filter
              </Button>
              {!isMahasiswa && !isDosen && (
                <Button
                  variant="primary"
                  icon={<Plus size={16} />}
                  onClick={() => handleOpenKelasModal()}
                >
                  Buka Kelas Baru
                </Button>
              )}
            </div>
          }
        />

        {/* Filter Hari Tab Bar (Khusus Mahasiswa & Dosen) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 text-xs">
          {['', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'].map((hari) => (
            <button
              key={hari}
              onClick={() => {
                setFilterHari(hari);
                setAppliedFilters((prev) => ({ ...prev, hari }));
              }}
              className={`px-4 py-2 font-bold rounded-xl transition whitespace-nowrap capitalize cursor-pointer ${
                appliedFilters.hari === hari
                  ? 'bg-primary-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              {hari === '' ? 'Semua Hari' : hari}
            </button>
          ))}
        </div>

        {/* DataTable */}
        <DataTable
          columns={columns}
          data={kelas}
          isLoading={loading}
          emptyMessage="Belum ada kelas perkuliahan yang sesuai filter."
        />
      </div>

      {/* Filter Drawer */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Jadwal Kelas"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setSearch('');
                setFilterHari('');
                setFilterProdi('');
                setAppliedFilters({ search: '', hari: '', prodi: '' });
                setShowFilter(false);
              }}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setAppliedFilters({
                  search,
                  hari: filterHari,
                  prodi: filterProdi,
                });
                setShowFilter(false);
              }}
            >
              Terapkan
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-5">
          <Input
            label="Pencarian Kelas"
            placeholder="Cari mata kuliah, ruang, atau dosen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div>
            <label className="label">Program Studi</label>
            <select
              value={filterProdi}
              onChange={(e) => setFilterProdi(e.target.value)}
              className="select w-full"
            >
              <option value="">Semua Program Studi</option>
              {prodis.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama} ({p.jenjang || 'S1'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Hari Perkuliahan</label>
            <select
              value={filterHari}
              onChange={(e) => setFilterHari(e.target.value)}
              className="select w-full capitalize"
            >
              <option value="">Semua Hari</option>
              {['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'].map((h) => (
                <option key={h} value={h} className="capitalize">
                  {h}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Drawer>

      {/* Modal Buka / Edit Kelas (Admin) */}
      {isKelasModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-extrabold text-slate-900">
              {editingKelas ? 'Edit Kelas Perkuliahan' : 'Buka Kelas Perkuliahan Baru'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Pilih Program Studi terlebih dahulu, lalu pilih mata kuliah yang dibuka untuk semester aktif.
            </p>

            <form onSubmit={handleSaveKelas} className="space-y-4">
              {/* STEP 1: PILIH PROGRAM STUDI */}
              <div>
                <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  1. Program Studi *
                </label>
                <select
                  disabled={Boolean(editingKelas)}
                  value={kelasForm.program_studi_id}
                  onChange={(e) => {
                    const prodiId = parseInt(e.target.value);
                    const prodiMks = matakuliahs.filter(
                      (m) => !m.kurikulum?.program_studi_id || m.kurikulum?.program_studi_id === prodiId
                    );
                    const firstMk = prodiMks[0] || matakuliahs[0];
                    setKelasForm({
                      ...kelasForm,
                      program_studi_id: prodiId,
                      mata_kuliah_id: firstMk?.id || kelasForm.mata_kuliah_id,
                      kode_kelas: firstMk ? `${firstMk.kode_mk}-A` : kelasForm.kode_kelas,
                      nama_kelas: firstMk ? `${firstMk.nama} (Kelas A)` : kelasForm.nama_kelas,
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-primary-500 disabled:bg-slate-100"
                >
                  {prodis.map((p) => (
                    <option key={p.id} value={p.id}>{p.nama} ({p.jenjang || 'S1'})</option>
                  ))}
                </select>
              </div>

              {/* STEP 2: CARI & PILIH MATA KULIAH DARI PRODI TERSEBUT */}
              <div>
                <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  2. Cari & Pilih Mata Kuliah (Sesuai Prodi) *
                </label>
                {!editingKelas && (
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      type="text"
                      placeholder="Ketik untuk mencari mata kuliah..."
                      value={modalSearchMk}
                      onChange={(e) => setModalSearchMk(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-primary-500 transition outline-none"
                    />
                  </div>
                )}

                <select
                  disabled={Boolean(editingKelas)}
                  value={kelasForm.mata_kuliah_id}
                  onChange={(e) => {
                    const mkId = parseInt(e.target.value);
                    const selected = matakuliahs.find((m) => m.id === mkId);
                    setKelasForm({
                      ...kelasForm,
                      mata_kuliah_id: mkId,
                      kode_kelas: selected ? `${selected.kode_mk}-A` : kelasForm.kode_kelas,
                      nama_kelas: selected ? `${selected.nama} (Kelas A)` : kelasForm.nama_kelas,
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-primary-500 disabled:bg-slate-100"
                >
                  {matakuliahs
                    .filter((mk) => {
                      const matchProdi =
                        !mk.kurikulum?.program_studi_id ||
                        mk.kurikulum?.program_studi_id === kelasForm.program_studi_id;
                      const matchSearch =
                        !modalSearchMk ||
                        mk.nama.toLowerCase().includes(modalSearchMk.toLowerCase()) ||
                        mk.kode_mk.toLowerCase().includes(modalSearchMk.toLowerCase());
                      const openedMkIds = kelas.map((k) => k.mata_kuliah_id);
                      const notOpenedYet = editingKelas
                        ? editingKelas.mata_kuliah_id === mk.id || !openedMkIds.includes(mk.id)
                        : !openedMkIds.includes(mk.id);
                      return matchProdi && matchSearch && notOpenedYet;
                    })
                    .map((mk) => (
                      <option key={mk.id} value={mk.id}>
                        {mk.kode_mk} - {mk.nama} ({mk.total_sks} SKS • Smtr {mk.semester_anjuran})
                      </option>
                    ))}
                </select>
                {!editingKelas && (
                  <span className="text-2xs text-slate-400 mt-1 block">
                    * Hanya menampilkan mata kuliah yang belum dibuka kelasnya pada semester aktif ini.
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kode Kelas *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingKelas)}
                    placeholder="IF3A-ALGO"
                    value={kelasForm.kode_kelas}
                    onChange={(e) => setKelasForm({ ...kelasForm, kode_kelas: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary-500 font-mono disabled:bg-slate-100 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Kelas *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Algoritma Pemrograman (Kelas A)"
                    value={kelasForm.nama_kelas}
                    onChange={(e) => setKelasForm({ ...kelasForm, nama_kelas: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary-500 font-medium"
                  />
                </div>
              </div>

              {/* Dosen Utama (SELECT2 SEARCHABLE) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider">
                    Dosen Pengampu Utama (Ketua Tim / Lapor Feeder) *
                  </label>
                  <span className="text-2xs text-slate-400 font-medium">Cari via Nama / NIDN</span>
                </div>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      type="text"
                      placeholder="Ketik untuk mencari nama dosen pengampu utama atau NIDN..."
                      value={searchDosenUtama}
                      onChange={(e) => {
                        setSearchDosenUtama(e.target.value);
                        setIsDosenSelectOpen(true);
                      }}
                      onFocus={() => setIsDosenSelectOpen(true)}
                      className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-primary-500 outline-none"
                    />
                    {searchDosenUtama && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchDosenUtama('');
                          setIsDosenSelectOpen(true);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Dropdown Hasil Pencarian Select2 */}
                  {isDosenSelectOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-30 divide-y divide-slate-100 text-xs">
                      {dosens
                        .filter((d) => {
                          if (!searchDosenUtama) return true;
                          const q = searchDosenUtama.toLowerCase();
                          return d.nama_lengkap.toLowerCase().includes(q) || (d.nidn && d.nidn.includes(q));
                        })
                        .map((d) => (
                          <div
                            key={d.id}
                            onClick={() => {
                              setKelasForm({ ...kelasForm, dosen_id: d.id });
                              setSearchDosenUtama(d.nama_lengkap);
                              setIsDosenSelectOpen(false);
                            }}
                            className={`p-2.5 hover:bg-primary-50 cursor-pointer flex items-center justify-between transition ${
                              kelasForm.dosen_id === d.id ? 'bg-primary-50/80 font-bold text-primary-900' : 'text-slate-800'
                            }`}
                          >
                            <div>
                              <span className="block font-bold">{d.nama_lengkap}</span>
                              <span className="text-2xs text-slate-500 font-mono">
                                NIDN: {d.nidn || '-'} • {d.program_studi?.nama || 'Dosen Homebase'}
                              </span>
                            </div>
                            {kelasForm.dosen_id === d.id && (
                              <span className="badge badge-green text-2xs font-bold">✓ Terpilih</span>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Team Teaching Dosen dengan Real-time Search */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider">
                    Dosen Anggota Pengajar (Team Teaching)
                  </label>
                  <span className="badge badge-purple text-2xs font-bold font-mono">
                    {kelasForm.team_teaching_dosen_ids.length} Dosen Dipilih
                  </span>
                </div>

                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                  <input
                    type="text"
                    placeholder="Cari dosen pendamping team teaching..."
                    value={searchTeamTeaching}
                    onChange={(e) => setSearchTeamTeaching(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-primary-500 transition"
                  />
                </div>

                <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1 bg-slate-50">
                  {dosens
                    .filter((d) => d.id !== kelasForm.dosen_id)
                    .filter((d) => {
                      if (!searchTeamTeaching) return true;
                      const q = searchTeamTeaching.toLowerCase();
                      return d.nama_lengkap.toLowerCase().includes(q) || (d.nidn && d.nidn.includes(q));
                    })
                    .map((d) => {
                      const isChecked = kelasForm.team_teaching_dosen_ids.includes(d.id);
                      return (
                        <label
                          key={d.id}
                          className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition ${
                            isChecked ? 'bg-purple-50 border border-purple-200 shadow-2xs' : 'hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setKelasForm({
                                    ...kelasForm,
                                    team_teaching_dosen_ids: [...kelasForm.team_teaching_dosen_ids, d.id],
                                  });
                                } else {
                                  setKelasForm({
                                    ...kelasForm,
                                    team_teaching_dosen_ids: kelasForm.team_teaching_dosen_ids.filter((id) => id !== d.id),
                                  });
                                }
                              }}
                              className="rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                            />
                            <div>
                              <span className="font-bold text-slate-800 block">{d.nama_lengkap}</span>
                              <span className="text-2xs text-slate-500 font-mono">NIDN: {d.nidn || '-'} • {d.program_studi?.nama || 'Dosen'}</span>
                            </div>
                          </div>
                          {isChecked && <span className="badge badge-purple text-2xs font-bold">Team Teaching</span>}
                        </label>
                      );
                    })}
                </div>
              </div>

              {/* Ruangan Perkuliahan (TERINTEGRASI MODUL SINAPRA) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider">
                    Alokasi Ruangan Perkuliahan (Modul SINAPRA) *
                  </label>
                  <span className="text-2xs text-slate-400 font-medium">Gedung, Kapasitas & Fasilitas</span>
                </div>

                <div className="relative">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      type="text"
                      placeholder="Cari nama ruang, gedung, atau kode ruang SINAPRA..."
                      value={searchRuangan}
                      onChange={(e) => {
                        setSearchRuangan(e.target.value);
                        setIsRuanganSelectOpen(true);
                      }}
                      onFocus={() => setIsRuanganSelectOpen(true)}
                      className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-primary-500 outline-none"
                    />
                    {searchRuangan && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchRuangan('');
                          setIsRuanganSelectOpen(true);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Dropdown Ruangan SINAPRA */}
                  {isRuanganSelectOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 max-h-52 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-30 divide-y divide-slate-100 text-xs">
                      {ruangans
                        .filter((r) => {
                          if (!searchRuangan) return true;
                          const q = searchRuangan.toLowerCase();
                          return (
                            r.nama.toLowerCase().includes(q) ||
                            r.kode.toLowerCase().includes(q) ||
                            (r.gedung?.nama && r.gedung.nama.toLowerCase().includes(q))
                          );
                        })
                        .map((r) => (
                          <div
                            key={r.id}
                            onClick={() => {
                              setKelasForm({
                                ...kelasForm,
                                ruangan_id: r.id,
                                kapasitas: r.kapasitas || kelasForm.kapasitas,
                                kuota_krs: r.kapasitas || kelasForm.kuota_krs,
                              });
                              setSearchRuangan(`[${r.gedung?.nama || 'Gedung'}] ${r.nama} (${r.kode})`);
                              setIsRuanganSelectOpen(false);
                            }}
                            className={`p-2.5 hover:bg-primary-50 cursor-pointer flex items-center justify-between transition ${
                              kelasForm.ruangan_id === r.id ? 'bg-primary-50/80 font-bold text-primary-900' : 'text-slate-800'
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold">{r.nama}</span>
                                <span className="badge badge-gray text-[10px] font-mono">{r.kode}</span>
                                <span className="badge badge-purple text-[10px] uppercase font-bold">{r.tipe || 'Kelas'}</span>
                              </div>
                              <div className="text-2xs text-slate-500 mt-0.5 flex items-center gap-2">
                                <span>{r.gedung?.nama || 'Gedung Terpadu'} • Lt. {r.lantai}</span>
                                <span>• <strong>{r.kapasitas} Kursi</strong></span>
                                {r.ada_ac && <span className="text-sky-600">❄️ AC</span>}
                                {r.ada_proyektor && <span className="text-amber-600">📽️ Proyektor</span>}
                                {r.ada_wifi && <span className="text-emerald-600">📶 WiFi</span>}
                              </div>
                            </div>
                            {kelasForm.ruangan_id === r.id && (
                              <span className="badge badge-green text-2xs font-bold">✓ Terpilih</span>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Hari *
                  </label>
                  <select
                    value={kelasForm.hari}
                    onChange={(e) => setKelasForm({ ...kelasForm, hari: e.target.value })}
                    className="w-full px-2 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary-500 capitalize"
                  >
                    <option value="senin">Senin</option>
                    <option value="selasa">Selasa</option>
                    <option value="rabu">Rabu</option>
                    <option value="kamis">Kamis</option>
                    <option value="jumat">Jumat</option>
                    <option value="sabtu">Sabtu</option>
                  </select>
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Jam Mulai *
                  </label>
                  <input
                    type="time"
                    required
                    value={kelasForm.jam_mulai}
                    onChange={(e) => setKelasForm({ ...kelasForm, jam_mulai: e.target.value })}
                    className="w-full px-2 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Jam Selesai *
                  </label>
                  <input
                    type="time"
                    required
                    value={kelasForm.jam_selesai}
                    onChange={(e) => setKelasForm({ ...kelasForm, jam_selesai: e.target.value })}
                    className="w-full px-2 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kapasitas Ruang
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={kelasForm.kapasitas}
                    onChange={(e) => setKelasForm({ ...kelasForm, kapasitas: parseInt(e.target.value) || 40 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary-500 tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kuota KRS
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={kelasForm.kuota_krs}
                    onChange={(e) => setKelasForm({ ...kelasForm, kuota_krs: parseInt(e.target.value) || 40 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary-500 tabular-nums"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  className="text-xs"
                  onClick={() => setIsKelasModalOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="text-xs font-bold"
                  disabled={saving}
                >
                  {saving ? 'Menyimpan...' : 'Simpan Kelas'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL LIHAT & EDIT LANGSUNG DOKUMEN RPS (16 MINGGU) */}
      {/* ======================================================== */}
      {/* MODAL ABSENSI & PRESENSI DOSEN */}
      {isAbsensiModalOpen && selectedAbsenKelas && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-100 animate-scale-in flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-slate-50 shrink-0">
              <div>
                <span className="text-2xs font-extrabold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">PORTAL DOSEN PENGAJAR</span>
                <h3 className="font-black text-sm text-slate-900 mt-1">
                  Absensi Kelas: {selectedAbsenKelas.nama_kelas} ({selectedAbsenKelas.mata_kuliah?.nama})
                </h3>
              </div>
              <button onClick={() => setIsAbsensiModalOpen(false)} className="text-slate-400 font-bold hover:text-slate-600">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Kolom Kiri: Pertemuan 1-16 */}
              <div className="md:col-span-1 border-r pr-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs uppercase text-slate-500">Pertemuan 1-16</span>
                  <Button
                    variant="primary"
                    size="sm"
                    className="text-2xs font-bold"
                    onClick={() => {
                      setNewPertemuanForm({
                        pertemuan_ke: pertemuans.length + 1,
                        tanggal: new Date().toISOString().slice(0, 10),
                        materi: '',
                        jam_mulai: selectedAbsenKelas.jam_mulai ? selectedAbsenKelas.jam_mulai.slice(0, 5) : '08:00',
                        jam_selesai: selectedAbsenKelas.jam_selesai ? selectedAbsenKelas.jam_selesai.slice(0, 5) : '10:30',
                      });
                      setIsNewPertemuanOpen(true);
                    }}
                  >
                    Tambah
                  </Button>
                </div>

                {isNewPertemuanOpen && (
                  <form onSubmit={handleCreatePertemuan} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-2xs">
                      <div>
                        <label className="font-bold text-slate-500 block uppercase mb-0.5">Pertemuan Ke</label>
                        <input
                          type="number"
                          required
                          min={1}
                          max={16}
                          value={newPertemuanForm.pertemuan_ke}
                          onChange={(e) => setNewPertemuanForm({ ...newPertemuanForm, pertemuan_ke: Number(e.target.value) })}
                          className="input w-full font-bold text-xs"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-500 block uppercase mb-0.5">Tanggal</label>
                        <input
                          type="date"
                          required
                          value={newPertemuanForm.tanggal}
                          onChange={(e) => setNewPertemuanForm({ ...newPertemuanForm, tanggal: e.target.value })}
                          className="input w-full text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-1 text-2xs">
                      <label className="font-bold text-slate-500 block uppercase">Materi Pembahasan</label>
                      <input
                        type="text"
                        required
                        value={newPertemuanForm.materi}
                        onChange={(e) => setNewPertemuanForm({ ...newPertemuanForm, materi: e.target.value })}
                        className="input w-full text-xs"
                        placeholder="Contoh: Pengenalan OOP, Analisis Kebutuhan"
                      />
                    </div>
                    <div className="flex justify-end gap-1.5 pt-1">
                      <Button type="button" variant="outline" size="sm" className="text-2xs" onClick={() => setIsNewPertemuanOpen(false)}>Batal</Button>
                      <Button type="submit" variant="primary" size="sm" className="text-2xs font-bold" disabled={savingAbsen}>Simpan</Button>
                    </div>
                  </form>
                )}

                <div className="space-y-2 max-h-[45vh] overflow-y-auto">
                  {pertemuans.length === 0 ? (
                    <p className="text-2xs text-slate-400 italic">Belum ada pertemuan kelas.</p>
                  ) : (
                    pertemuans.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleViewAttendanceDetails(p)}
                        className={`p-3 rounded-xl border border-slate-200 cursor-pointer transition ${
                          activePertemuan?.id === p.id ? 'bg-primary-50 border-primary-300 font-bold' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-900 font-black">Pertemuan {p.pertemuan_ke}</span>
                          <span className="text-2xs font-mono text-slate-400">{p.tanggal}</span>
                        </div>
                        <p className="text-2xs text-slate-600 mt-1 font-medium truncate">{p.materi || 'Tidak ada materi'}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Kolom Kanan: Pengisian Absen Mahasiswa */}
              <div className="md:col-span-2 flex flex-col h-[55vh]">
                {activePertemuan ? (
                  <div className="flex flex-col h-full space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b">
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-900">Daftar Kehadiran: Pertemuan {activePertemuan.pertemuan_ke}</h4>
                        <p className="text-2xs text-slate-500 font-medium">Materi: {activePertemuan.materi}</p>
                      </div>
                      <Button
                        variant="primary"
                        className="text-xs font-bold"
                        onClick={handleSaveAttendance}
                        disabled={savingAbsen}
                      >
                        {savingAbsen ? 'Menyimpan...' : 'Simpan Presensi'}
                      </Button>
                    </div>

                    <div className="overflow-y-auto flex-1 border border-slate-200 rounded-2xl">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-50 font-bold text-slate-600 border-b">
                          <tr>
                            <th className="py-2.5 px-3">MAHASISWA</th>
                            <th className="py-2.5 px-3 text-center w-48">STATUS KEHADIRAN</th>
                            <th className="py-2.5 px-3 w-40">CATATAN</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y font-medium text-slate-700">
                          {attendanceList.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="py-6 text-center text-slate-400 italic">Tidak ada mahasiswa terdaftar di kelas ini.</td>
                            </tr>
                          ) : (
                            attendanceList.map((item, idx) => (
                              <tr key={item.id || idx}>
                                <td className="py-2.5 px-3">
                                  <span className="font-bold text-slate-900 block text-xs">{item.mahasiswa?.nama_lengkap}</span>
                                  <span className="font-mono text-2xs text-slate-400">NIM: {item.mahasiswa?.nim}</span>
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg justify-between border">
                                    {['hadir', 'sakit', 'izin', 'alfa'].map((st) => (
                                      <button
                                        key={st}
                                        type="button"
                                        onClick={() => {
                                          const next = [...attendanceList];
                                          next[idx].status = st;
                                          setAttendanceList(next);
                                        }}
                                        className={`px-2 py-1 text-2xs font-extrabold capitalize rounded-md transition ${
                                          item.status === st
                                            ? st === 'hadir' ? 'bg-emerald-600 text-white'
                                              : st === 'sakit' ? 'bg-blue-600 text-white'
                                              : st === 'izin' ? 'bg-amber-500 text-white'
                                              : 'bg-red-600 text-white'
                                            : 'text-slate-500 hover:text-slate-900'
                                        }`}
                                      >
                                        {st}
                                      </button>
                                    ))}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3">
                                  <input
                                    type="text"
                                    value={item.catatan || ''}
                                    onChange={(e) => {
                                      const next = [...attendanceList];
                                      next[idx].catatan = e.target.value;
                                      setAttendanceList(next);
                                    }}
                                    placeholder="..."
                                    className="input w-full text-2xs py-1 px-2 border-slate-200"
                                  />
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center border border-dashed rounded-3xl bg-slate-50 text-slate-400 p-6">
                    <CalendarCheck size={36} className="text-slate-300 animate-bounce mb-2" />
                    <p className="text-xs font-bold">Pilih Pertemuan di sebelah kiri</p>
                    <p className="text-2xs text-slate-400">Untuk menginput atau merekap presensi mahasiswa.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedRpsKelas && (

        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-5xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between border-b pb-3.5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="badge badge-purple text-2xs font-extrabold uppercase">
                    RPS Standar OBE (SN-DIKTI)
                  </span>
                  <span className={`badge text-2xs font-bold ${rpsDetail?.status === 'disetujui' ? 'badge-green' : rpsDetail?.status === 'diajukan' ? 'badge-yellow' : 'badge-gray'}`}>
                    Status: {(rpsDetail?.status || 'disetujui').toUpperCase()}
                  </span>
                </div>
                <h3 className="font-extrabold text-base text-slate-900 mt-1">
                  RPS: {selectedRpsKelas.mata_kuliah?.nama} ({selectedRpsKelas.mata_kuliah?.kode_mk}) • {selectedRpsKelas.mata_kuliah?.total_sks || 3} SKS
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  icon={<FileText size={14} />}
                  className="text-xs font-bold"
                  onClick={() => window.print()}
                >
                  Cetak RPS (PDF)
                </Button>
                <Button
                  variant="primary"
                  className="text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white shadow-xs"
                  disabled={savingRps}
                  onClick={async () => {
                    try {
                      setSavingRps(true);
                      await siakadService.storeRps({
                        id: rpsDetail?.id,
                        mata_kuliah_id: selectedRpsKelas.mata_kuliah_id,
                        tahun_ajaran: '2026/2027',
                        semester: selectedRpsKelas.mata_kuliah?.semester_anjuran || 1,
                        ...rpsForm,
                      });
                      toast.success('Dokumen RPS dan 16 pertemuan berhasil disimpan!');
                      handleOpenRps(selectedRpsKelas);
                    } catch (err: any) {
                      toast.error('Gagal menyimpan RPS');
                    } finally {
                      setSavingRps(false);
                    }
                  }}
                >
                  {savingRps ? 'Menyimpan...' : '💾 Simpan Perubahan RPS'}
                </Button>
                <button onClick={() => setSelectedRpsKelas(null)} className="text-slate-400 hover:text-slate-600 font-bold p-1">
                  ✕
                </button>
              </div>
            </div>

            {loadingRps ? (
              <div className="py-12 text-center text-slate-400 text-xs">Memuat dokumen RPS mata kuliah...</div>
            ) : (
              <div className="space-y-5">
                {/* Banner Dosen Pengembang & Kaprodi */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-2xs font-bold text-slate-500 uppercase block">Tim Pengembang Kurikulum</span>
                    <p className="text-slate-800 mt-0.5">
                      Dosen Pengembang: <strong>{rpsDetail?.dosen_pengembang?.nama_lengkap || selectedRpsKelas.dosen_pengampu?.[0]?.dosen?.nama_lengkap || 'Dosen Pengampu'}</strong> • Kaprodi: <strong>{rpsDetail?.kaprodi?.nama_lengkap || 'Dr. Ir. Ahmad Santoso, M.Kom'}</strong>
                    </p>
                  </div>
                  <span className="text-2xs text-slate-400 font-medium">
                    * Deskripsi, referensi, dan 16 pertemuan dapat diedit langsung di bawah ini.
                  </span>
                </div>

                {/* Deskripsi Langsung & Capaian CPMK */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2 shadow-2xs">
                    <span className="font-extrabold text-slate-900 block">
                      Deskripsi Singkat Mata Kuliah:
                    </span>
                    <textarea
                      rows={4}
                      placeholder="Tuliskan deskripsi ringkas mengenai mata kuliah ini..."
                      value={rpsForm.deskripsi_singkat}
                      onChange={(e) => setRpsForm({ ...rpsForm, deskripsi_singkat: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs leading-relaxed outline-none focus:bg-white focus:border-primary-500 font-medium"
                    />
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <span className="font-extrabold text-slate-900 block">
                      Capaian Pembelajaran Mata Kuliah (CPMK):
                    </span>
                    <ul className="space-y-1.5 list-disc pl-4 text-slate-700 text-xs">
                      {rpsDetail?.mata_kuliah?.cpmks?.length ? (
                        rpsDetail.mata_kuliah.cpmks.map((c: any) => (
                          <li key={c.id}>
                            <strong>{c.kode_cpmk} ({c.bobot_persentase}%):</strong> {c.deskripsi}
                          </li>
                        ))
                      ) : (
                        <li className="text-slate-400 list-none">
                          Belum ada CPMK spesifik yang dipetakan pada mata kuliah ini.
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Pustaka Utama & Pendukung Langsung */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2 shadow-2xs">
                    <span className="font-extrabold text-slate-900 block">
                      Pustaka Utama (Buku Teks Wajib):
                    </span>
                    <textarea
                      rows={3}
                      placeholder="1. Pressman, Software Engineering.\n2. Tanenbaum, Modern Operating Systems."
                      value={rpsForm.pustaka_utama}
                      onChange={(e) => setRpsForm({ ...rpsForm, pustaka_utama: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs leading-relaxed outline-none focus:bg-white focus:border-primary-500 font-medium"
                    />
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2 shadow-2xs">
                    <span className="font-extrabold text-slate-900 block">
                      Pustaka Pendukung (Jurnal / Sumber Online):
                    </span>
                    <textarea
                      rows={3}
                      placeholder="1. IEEE Transactions on Software Engineering.\n2. Dokumentasi Framework Terkait."
                      value={rpsForm.pustaka_pendukung}
                      onChange={(e) => setRpsForm({ ...rpsForm, pustaka_pendukung: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs leading-relaxed outline-none focus:bg-white focus:border-primary-500 font-medium"
                    />
                  </div>
                </div>

                {/* Rencana 16 Pertemuan Mingguan Langsung Diedit Pada Tabel */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-900 block">
                      Rencana Kegiatan Pembelajaran 16 Pertemuan Perkuliahan:
                    </span>
                    <span className="text-2xs text-slate-500 font-medium">
                      Pekan 8 (UTS) & Pekan 16 (UAS / Proyek Akhir)
                    </span>
                  </div>

                  <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-xl bg-white divide-y divide-slate-100 shadow-2xs">
                    {Array.from({ length: 16 }, (_, i) => i + 1).map((mingguKe) => {
                      const existing = rpsForm.mingguan?.find((m: any) => m.minggu_ke === mingguKe) || {};
                      const isMidOrFinal = mingguKe === 8 || mingguKe === 16;

                      return (
                        <div
                          key={mingguKe}
                          className={`p-3 grid grid-cols-1 md:grid-cols-12 gap-2 items-center transition ${
                            isMidOrFinal ? 'bg-primary-50/50' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="md:col-span-1 text-center font-mono font-black text-xs text-primary-700">
                            Mg {mingguKe}
                          </div>
                          <div className="md:col-span-4">
                            <label className="block text-[10px] text-slate-400 font-bold uppercase">Sub-CPMK</label>
                            <input
                              type="text"
                              placeholder={`Sub-CPMK Minggu ${mingguKe}`}
                              value={existing.kemampuan_akhir || ''}
                              onChange={(e) => {
                                const updated = [...(rpsForm.mingguan || [])];
                                const idx = updated.findIndex((m: any) => m.minggu_ke === mingguKe);
                                if (idx >= 0) {
                                  updated[idx] = { ...updated[idx], kemampuan_akhir: e.target.value };
                                } else {
                                  updated.push({ minggu_ke: mingguKe, kemampuan_akhir: e.target.value });
                                }
                                setRpsForm({ ...rpsForm, mingguan: updated });
                              }}
                              className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white font-medium outline-none focus:border-primary-500"
                            />
                          </div>
                          <div className="md:col-span-4">
                            <label className="block text-[10px] text-slate-400 font-bold uppercase">Bahan Kajian / Topik Materi</label>
                            <input
                              type="text"
                              placeholder={mingguKe === 8 ? 'Ujian Tengah Semester (UTS)' : mingguKe === 16 ? 'Evaluasi Akhir Semester (UAS / Proyek)' : `Materi Pokok Pembahasan Pekan ${mingguKe}`}
                              value={existing.bahan_kajian || ''}
                              onChange={(e) => {
                                const updated = [...(rpsForm.mingguan || [])];
                                const idx = updated.findIndex((m: any) => m.minggu_ke === mingguKe);
                                if (idx >= 0) {
                                  updated[idx] = { ...updated[idx], bahan_kajian: e.target.value };
                                } else {
                                  updated.push({ minggu_ke: mingguKe, bahan_kajian: e.target.value });
                                }
                                setRpsForm({ ...rpsForm, mingguan: updated });
                              }}
                              className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white font-medium outline-none focus:border-primary-500"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-[10px] text-slate-400 font-bold uppercase">Bentuk / Metode</label>
                            <input
                              type="text"
                              placeholder="Kuliah & PBL"
                              value={existing.bentuk_metode || 'Kuliah, Diskusi & PBL'}
                              onChange={(e) => {
                                const updated = [...(rpsForm.mingguan || [])];
                                const idx = updated.findIndex((m: any) => m.minggu_ke === mingguKe);
                                if (idx >= 0) {
                                  updated[idx] = { ...updated[idx], bentuk_metode: e.target.value };
                                } else {
                                  updated.push({ minggu_ke: mingguKe, bentuk_metode: e.target.value });
                                }
                                setRpsForm({ ...rpsForm, mingguan: updated });
                              }}
                              className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white outline-none focus:border-primary-500"
                            />
                          </div>
                          <div className="md:col-span-1">
                            <label className="block text-[10px] text-slate-400 font-bold uppercase text-center">Bobot %</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={existing.bobot_penilaian ?? (mingguKe === 8 ? 25 : mingguKe === 16 ? 30 : 3)}
                              onChange={(e) => {
                                const updated = [...(rpsForm.mingguan || [])];
                                const idx = updated.findIndex((m: any) => m.minggu_ke === mingguKe);
                                if (idx >= 0) {
                                  updated[idx] = { ...updated[idx], bobot_penilaian: Number(e.target.value) };
                                } else {
                                  updated.push({ minggu_ke: mingguKe, bobot_penilaian: Number(e.target.value) });
                                }
                                setRpsForm({ ...rpsForm, mingguan: updated });
                              }}
                              className="w-full px-1 py-1 text-xs border border-slate-200 rounded-lg bg-white font-mono font-bold text-center outline-none focus:border-primary-500"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <Button
                    variant="outline"
                    className="text-xs"
                    onClick={() => setSelectedRpsKelas(null)}
                  >
                    Tutup
                  </Button>
                  <Button
                    variant="primary"
                    className="text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white shadow-xs"
                    disabled={savingRps}
                    onClick={async () => {
                      try {
                        setSavingRps(true);
                        await siakadService.storeRps({
                          id: rpsDetail?.id,
                          mata_kuliah_id: selectedRpsKelas.mata_kuliah_id,
                          tahun_ajaran: '2026/2027',
                          semester: selectedRpsKelas.mata_kuliah?.semester_anjuran || 1,
                          ...rpsForm,
                        });
                        toast.success('Dokumen RPS dan 16 rencana pertemuan berhasil disimpan!');
                        handleOpenRps(selectedRpsKelas);
                      } catch (err: any) {
                        toast.error('Gagal menyimpan RPS');
                      } finally {
                        setSavingRps(false);
                      }
                    }}
                  >
                    {savingRps ? 'Menyimpan...' : '💾 Simpan Perubahan RPS & 16 Pertemuan'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DOKUMEN CETAK RPS RESMI (SN-DIKTI / OBE) — KHUSUS PRINT */}
      {/* ======================================================== */}
      {/* MODAL ABSENSI & PRESENSI DOSEN */}
      {isAbsensiModalOpen && selectedAbsenKelas && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-100 animate-scale-in flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-slate-50 shrink-0">
              <div>
                <span className="text-2xs font-extrabold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">PORTAL DOSEN PENGAJAR</span>
                <h3 className="font-black text-sm text-slate-900 mt-1">
                  Absensi Kelas: {selectedAbsenKelas.nama_kelas} ({selectedAbsenKelas.mata_kuliah?.nama})
                </h3>
              </div>
              <button onClick={() => setIsAbsensiModalOpen(false)} className="text-slate-400 font-bold hover:text-slate-600">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Kolom Kiri: Pertemuan 1-16 */}
              <div className="md:col-span-1 border-r pr-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs uppercase text-slate-500">Pertemuan 1-16</span>
                  <Button
                    variant="primary"
                    size="sm"
                    className="text-2xs font-bold"
                    onClick={() => {
                      setNewPertemuanForm({
                        pertemuan_ke: pertemuans.length + 1,
                        tanggal: new Date().toISOString().slice(0, 10),
                        materi: '',
                        jam_mulai: selectedAbsenKelas.jam_mulai ? selectedAbsenKelas.jam_mulai.slice(0, 5) : '08:00',
                        jam_selesai: selectedAbsenKelas.jam_selesai ? selectedAbsenKelas.jam_selesai.slice(0, 5) : '10:30',
                      });
                      setIsNewPertemuanOpen(true);
                    }}
                  >
                    Tambah
                  </Button>
                </div>

                {isNewPertemuanOpen && (
                  <form onSubmit={handleCreatePertemuan} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-2xs">
                      <div>
                        <label className="font-bold text-slate-500 block uppercase mb-0.5">Pertemuan Ke</label>
                        <input
                          type="number"
                          required
                          min={1}
                          max={16}
                          value={newPertemuanForm.pertemuan_ke}
                          onChange={(e) => setNewPertemuanForm({ ...newPertemuanForm, pertemuan_ke: Number(e.target.value) })}
                          className="input w-full font-bold text-xs"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-500 block uppercase mb-0.5">Tanggal</label>
                        <input
                          type="date"
                          required
                          value={newPertemuanForm.tanggal}
                          onChange={(e) => setNewPertemuanForm({ ...newPertemuanForm, tanggal: e.target.value })}
                          className="input w-full text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-1 text-2xs">
                      <label className="font-bold text-slate-500 block uppercase">Materi Pembahasan</label>
                      <input
                        type="text"
                        required
                        value={newPertemuanForm.materi}
                        onChange={(e) => setNewPertemuanForm({ ...newPertemuanForm, materi: e.target.value })}
                        className="input w-full text-xs"
                        placeholder="Contoh: Pengenalan OOP, Analisis Kebutuhan"
                      />
                    </div>
                    <div className="flex justify-end gap-1.5 pt-1">
                      <Button type="button" variant="outline" size="sm" className="text-2xs" onClick={() => setIsNewPertemuanOpen(false)}>Batal</Button>
                      <Button type="submit" variant="primary" size="sm" className="text-2xs font-bold" disabled={savingAbsen}>Simpan</Button>
                    </div>
                  </form>
                )}

                <div className="space-y-2 max-h-[45vh] overflow-y-auto">
                  {pertemuans.length === 0 ? (
                    <p className="text-2xs text-slate-400 italic">Belum ada pertemuan kelas.</p>
                  ) : (
                    pertemuans.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleViewAttendanceDetails(p)}
                        className={`p-3 rounded-xl border border-slate-200 cursor-pointer transition ${
                          activePertemuan?.id === p.id ? 'bg-primary-50 border-primary-300 font-bold' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-900 font-black">Pertemuan {p.pertemuan_ke}</span>
                          <span className="text-2xs font-mono text-slate-400">{p.tanggal}</span>
                        </div>
                        <p className="text-2xs text-slate-600 mt-1 font-medium truncate">{p.materi || 'Tidak ada materi'}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Kolom Kanan: Pengisian Absen Mahasiswa */}
              <div className="md:col-span-2 flex flex-col h-[55vh]">
                {activePertemuan ? (
                  <div className="flex flex-col h-full space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b">
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-900">Daftar Kehadiran: Pertemuan {activePertemuan.pertemuan_ke}</h4>
                        <p className="text-2xs text-slate-500 font-medium">Materi: {activePertemuan.materi}</p>
                      </div>
                      <Button
                        variant="primary"
                        className="text-xs font-bold"
                        onClick={handleSaveAttendance}
                        disabled={savingAbsen}
                      >
                        {savingAbsen ? 'Menyimpan...' : 'Simpan Presensi'}
                      </Button>
                    </div>

                    <div className="overflow-y-auto flex-1 border border-slate-200 rounded-2xl">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-50 font-bold text-slate-600 border-b">
                          <tr>
                            <th className="py-2.5 px-3">MAHASISWA</th>
                            <th className="py-2.5 px-3 text-center w-48">STATUS KEHADIRAN</th>
                            <th className="py-2.5 px-3 w-40">CATATAN</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y font-medium text-slate-700">
                          {attendanceList.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="py-6 text-center text-slate-400 italic">Tidak ada mahasiswa terdaftar di kelas ini.</td>
                            </tr>
                          ) : (
                            attendanceList.map((item, idx) => (
                              <tr key={item.id || idx}>
                                <td className="py-2.5 px-3">
                                  <span className="font-bold text-slate-900 block text-xs">{item.mahasiswa?.nama_lengkap}</span>
                                  <span className="font-mono text-2xs text-slate-400">NIM: {item.mahasiswa?.nim}</span>
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg justify-between border">
                                    {['hadir', 'sakit', 'izin', 'alfa'].map((st) => (
                                      <button
                                        key={st}
                                        type="button"
                                        onClick={() => {
                                          const next = [...attendanceList];
                                          next[idx].status = st;
                                          setAttendanceList(next);
                                        }}
                                        className={`px-2 py-1 text-2xs font-extrabold capitalize rounded-md transition ${
                                          item.status === st
                                            ? st === 'hadir' ? 'bg-emerald-600 text-white'
                                              : st === 'sakit' ? 'bg-blue-600 text-white'
                                              : st === 'izin' ? 'bg-amber-500 text-white'
                                              : 'bg-red-600 text-white'
                                            : 'text-slate-500 hover:text-slate-900'
                                        }`}
                                      >
                                        {st}
                                      </button>
                                    ))}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3">
                                  <input
                                    type="text"
                                    value={item.catatan || ''}
                                    onChange={(e) => {
                                      const next = [...attendanceList];
                                      next[idx].catatan = e.target.value;
                                      setAttendanceList(next);
                                    }}
                                    placeholder="..."
                                    className="input w-full text-2xs py-1 px-2 border-slate-200"
                                  />
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center border border-dashed rounded-3xl bg-slate-50 text-slate-400 p-6">
                    <CalendarCheck size={36} className="text-slate-300 animate-bounce mb-2" />
                    <p className="text-xs font-bold">Pilih Pertemuan di sebelah kiri</p>
                    <p className="text-2xs text-slate-400">Untuk menginput atau merekap presensi mahasiswa.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedRpsKelas && (

        <div className="hidden print:block printable-document print-document bg-white text-black p-8 font-serif leading-normal w-full">
          {/* Kop Dokumen Resmi */}
          <div className="border-b-2 border-black pb-3 mb-4 text-center">
            <h2 className="text-sm font-bold uppercase tracking-wider">KEMENTERIAN PENDIDIKAN TINGGI, RISET, DAN TEKNOLOGI</h2>
            <h1 className="text-base font-black uppercase tracking-tight">UNIVERSITAS NUSANTARA TERPADU</h1>
            <p className="text-xs">
              FAKULTAS TEKNOLOGI INFORMASI & KOMUNIKASI • PROGRAM STUDI {selectedRpsKelas.program_studi?.nama?.toUpperCase() || selectedRpsKelas.mata_kuliah?.kurikulum?.program_studi?.nama?.toUpperCase() || 'SISTEM INFORMASI'}
            </p>
            <p className="text-[10px] text-gray-600 mt-0.5 font-sans">
              Jl. Kampus Terpadu No. 1 • Website: siakad.kampus.ac.id • Email: akademik@kampus.ac.id
            </p>
          </div>

          <div className="text-center mb-5">
            <h3 className="text-sm font-black uppercase tracking-wide underline">
              RENCANA PEMBELAJARAN SEMESTER (RPS)
            </h3>
            <p className="text-xs font-semibold mt-0.5">
              Standar Kurikulum Berbasis Capaian Pembelajaran Lulusan (Outcome-Based Education / SN-DIKTI)
            </p>
          </div>

          {/* Tabel Identitas Mata Kuliah */}
          <table className="w-full border-collapse border border-black text-xs mb-4">
            <tbody>
              <tr className="border-b border-black">
                <td className="p-2 font-bold bg-gray-100 w-1/4 border-r border-black">MATA KULIAH</td>
                <td className="p-2 border-r border-black font-semibold">{selectedRpsKelas.mata_kuliah?.nama}</td>
                <td className="p-2 font-bold bg-gray-100 w-1/6 border-r border-black">KODE MK</td>
                <td className="p-2 font-mono font-bold">{selectedRpsKelas.mata_kuliah?.kode_mk}</td>
              </tr>
              <tr className="border-b border-black">
                <td className="p-2 font-bold bg-gray-100 border-r border-black">BOBOT / SKS</td>
                <td className="p-2 border-r border-black">{selectedRpsKelas.mata_kuliah?.total_sks || 3} SKS</td>
                <td className="p-2 font-bold bg-gray-100 border-r border-black">SEMESTER</td>
                <td className="p-2">Semester {selectedRpsKelas.mata_kuliah?.semester_anjuran || 1}</td>
              </tr>
              <tr className="border-b border-black">
                <td className="p-2 font-bold bg-gray-100 border-r border-black">DOSEN PENGEMBANG RPS</td>
                <td className="p-2 border-r border-black font-semibold">{rpsDetail?.dosen_pengembang?.nama_lengkap || selectedRpsKelas.dosen_pengampu?.[0]?.dosen?.nama_lengkap || 'Dosen Pengampu'}</td>
                <td className="p-2 font-bold bg-gray-100 border-r border-black">KETUA PRODI</td>
                <td className="p-2 font-semibold">{rpsDetail?.kaprodi?.nama_lengkap || 'Dr. Ir. Ahmad Santoso, M.Kom'}</td>
              </tr>
            </tbody>
          </table>

          {/* Deskripsi Singkat */}
          <div className="mb-4 text-xs">
            <h4 className="font-bold border-b border-black pb-1 mb-1.5 uppercase">I. DESKRIPSI SINGKAT MATA KULIAH</h4>
            <p className="text-justify leading-relaxed whitespace-pre-line pl-2">
              {rpsForm.deskripsi_singkat || rpsDetail?.deskripsi_singkat || 'Mata kuliah ini membahas konsep dasar, metodologi, implementasi sistem terstruktur dan studi kasus komprehensif.'}
            </p>
          </div>

          {/* Capaian Pembelajaran (CPMK) */}
          <div className="mb-4 text-xs">
            <h4 className="font-bold border-b border-black pb-1 mb-1.5 uppercase">II. CAPAIAN PEMBELAJARAN MATA KULIAH (CPMK)</h4>
            <table className="w-full border-collapse border border-black text-xs">
              <thead className="bg-gray-100">
                <tr className="border-b border-black text-center font-bold">
                  <th className="p-1.5 border-r border-black w-20">KODE</th>
                  <th className="p-1.5 border-r border-black">DESKRIPSI CAPAIAN PEMBELAJARAN (CPMK)</th>
                  <th className="p-1.5 w-20">BOBOT</th>
                </tr>
              </thead>
              <tbody>
                {rpsDetail?.mata_kuliah?.cpmks?.length ? (
                  rpsDetail.mata_kuliah.cpmks.map((c: any) => (
                    <tr key={c.id} className="border-b border-black">
                      <td className="p-1.5 font-bold font-mono text-center border-r border-black">{c.kode_cpmk}</td>
                      <td className="p-1.5 border-r border-black">{c.deskripsi}</td>
                      <td className="p-1.5 text-center font-bold">{c.bobot_persentase}%</td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-b border-black">
                    <td colSpan={3} className="p-2 text-center italic">CPMK disusun sesuai panduan kurikulum OBE SN-DIKTI.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pustaka & Referensi */}
          <div className="mb-4 text-xs">
            <h4 className="font-bold border-b border-black pb-1 mb-1.5 uppercase">III. REFERENSI / PUSTAKA PEMBELAJARAN</h4>
            <div className="pl-2 space-y-1">
              <p><strong>Pustaka Utama (Wajib):</strong></p>
              <p className="whitespace-pre-line pl-4 text-gray-800">{rpsForm.pustaka_utama || rpsDetail?.pustaka_utama || '1. Pressman, R. S. Software Engineering: A Practitioner’s Approach.\n2. Tanenbaum, A. S. Modern Operating Systems.'}</p>
              <p className="mt-2"><strong>Pustaka Pendukung:</strong></p>
              <p className="whitespace-pre-line pl-4 text-gray-800">{rpsForm.pustaka_pendukung || rpsDetail?.pustaka_pendukung || '1. IEEE Transactions on Systems and Software.\n2. Dokumentasi Standar Industri Terkait.'}</p>
            </div>
          </div>

          {/* Rencana 16 Pertemuan Mingguan */}
          <div className="mb-6 text-xs">
            <h4 className="font-bold border-b border-black pb-1 mb-1.5 uppercase">IV. RENCANA KEGIATAN PEMBELAJARAN MINGGUAN (16 PERTEMUAN)</h4>
            <table className="w-full border-collapse border border-black text-[10px]">
              <thead className="bg-gray-100 font-bold text-center">
                <tr className="border-b border-black">
                  <th className="p-1 border-r border-black w-8">MG</th>
                  <th className="p-1 border-r border-black w-1/4">KEMAMPUAN AKHIR (SUB-CPMK)</th>
                  <th className="p-1 border-r border-black">BAHAN KAJIAN / MATERI POKOK</th>
                  <th className="p-1 border-r border-black w-28">BENTUK & METODE</th>
                  <th className="p-1 w-12">BOBOT</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 16 }, (_, i) => i + 1).map((mKe) => {
                  const mData = rpsForm.mingguan?.find((m: any) => m.minggu_ke === mKe) || rpsDetail?.mingguan?.find((m: any) => m.minggu_ke === mKe) || {};
                  return (
                    <tr key={mKe} className={`border-b border-black ${mKe === 8 || mKe === 16 ? 'bg-gray-100 font-bold' : ''}`}>
                      <td className="p-1 text-center font-bold border-r border-black">{mKe}</td>
                      <td className="p-1 border-r border-black">{mData.kemampuan_akhir || (mKe === 8 ? 'Evaluasi Tengah Semester' : mKe === 16 ? 'Evaluasi Akhir Semester' : `Sub-CPMK Pertemuan ${mKe}`)}</td>
                      <td className="p-1 border-r border-black">{mData.bahan_kajian || (mKe === 8 ? 'Ujian Tengah Semester (UTS)' : mKe === 16 ? 'Evaluasi Akhir Semester (UAS / Proyek)' : `Topik Pembahasan Perkuliahan Minggu ${mKe}`)}</td>
                      <td className="p-1 border-r border-black text-center">{mData.bentuk_metode || 'Kuliah & PBL'}</td>
                      <td className="p-1 text-center font-bold">{mData.bobot_penilaian ?? (mKe === 8 ? 25 : mKe === 16 ? 30 : 3)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Lembar Pengesahan Tanda Tangan */}
          <div className="grid grid-cols-3 gap-4 pt-6 text-center text-xs break-inside-avoid">
            <div className="space-y-16">
              <div>
                <span className="block text-gray-600">Dosen Pengembang RPS,</span>
              </div>
              <div>
                <strong className="underline block">{rpsDetail?.dosen_pengembang?.nama_lengkap || selectedRpsKelas.dosen_pengampu?.[0]?.dosen?.nama_lengkap || 'Dosen Pengampu'}</strong>
                <span className="font-mono text-[10px]">NIDN: {rpsDetail?.dosen_pengembang?.nidn || selectedRpsKelas.dosen_pengampu?.[0]?.dosen?.nidn || '0412058001'}</span>
              </div>
            </div>

            <div className="space-y-16">
              <div>
                <span className="block text-gray-600">Koordinator RMK,</span>
              </div>
              <div>
                <strong className="underline block">{rpsDetail?.koordinator_rmk?.nama_lengkap || 'Koordinator Bidang Keahlian'}</strong>
                <span className="font-mono text-[10px]">NIDN: {rpsDetail?.koordinator_rmk?.nidn || '0419088502'}</span>
              </div>
            </div>

            <div className="space-y-16">
              <div>
                <span className="block text-gray-600">Ketua Program Studi,</span>
              </div>
              <div>
                <strong className="underline block">{rpsDetail?.kaprodi?.nama_lengkap || 'Dr. Ir. Ahmad Santoso, M.Kom'}</strong>
                <span className="font-mono text-[10px]">NIP: 198005122005011002</span>
              </div>
            </div>
          </div>

          {/* Footer Dokumen */}
          <div className="pt-8 border-t border-black mt-8 flex justify-between items-center text-[9px] font-mono text-gray-500">
            <span>DOKUMEN RPS RESMI UNIVERSITAS NUSANTARA TERPADU — SISTEM INFORMASI AKADEMIK TERPADU (SIAKAD)</span>
            <span>VERIFIED OBE COMPLIANT #{selectedRpsKelas.mata_kuliah?.kode_mk}-2026</span>
          </div>
        </div>
      )}
    </div>
  );
}
