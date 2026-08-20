'use client';

import { useState, useEffect } from 'react';
import { CalendarCheck, MapPin, Plus, Search, Filter, Clock, Users, Edit3, Trash2, BookOpen, FileText, CheckCircle2, Award, Download } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
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
  const [search, setSearch] = useState('');
  const [filterHari, setFilterHari] = useState('');
  const [filterProdi, setFilterProdi] = useState('');

  // Check roles
  const userRoles = user?.roles?.map((r: any) => typeof r === 'string' ? r : r.slug) || [];
  const isMahasiswa = userRoles.includes('mahasiswa');
  const isDosen = userRoles.includes('dosen');
  const isAdmin = userRoles.includes('superadmin') || userRoles.includes('admin');

  // Modal Kelas state (Admin)
  const [isKelasModalOpen, setIsKelasModalOpen] = useState(false);
  const [editingKelas, setEditingKelas] = useState<any | null>(null);
  const [modalSearchMk, setModalSearchMk] = useState('');
  const [kelasForm, setKelasForm] = useState({
    mata_kuliah_id: 1,
    tahun_akademik_id: 1,
    program_studi_id: 1,
    ruangan_id: 1,
    dosen_id: 1,
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
  });
  const [savingRps, setSavingRps] = useState(false);

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
      const [mRes, dRes, pRes] = await Promise.all([
        siakadService.getMataKuliahs({ per_page: 200 }),
        siakadService.getDosens({ per_page: 200 }),
        siakadService.getProdi(),
      ]);
      if (mRes.data) setMatakuliahs(mRes.data);
      if (dRes.data) setDosens(dRes.data);
      if (pRes.data) setProdis(pRes.data);
    } catch (err) {}
  };

  const fetchKelas = async () => {
    try {
      setLoading(true);
      const res = await siakadService.getKelas({
        search,
        hari: filterHari,
        program_studi_id: filterProdi || undefined,
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
  }, [search, filterHari, filterProdi]);

  const handleOpenKelasModal = (item?: any) => {
    setModalSearchMk('');
    if (item) {
      setEditingKelas(item);
      setKelasForm({
        mata_kuliah_id: item.mata_kuliah_id,
        tahun_akademik_id: item.tahun_akademik_id || 1,
        program_studi_id: item.program_studi_id || item.mata_kuliah?.kurikulum?.program_studi_id || 1,
        ruangan_id: item.ruangan_id || 1,
        dosen_id: item.dosen_pengampu?.[0]?.dosen_id || 1,
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
      const initialMks = matakuliahs.filter((m) => !m.kurikulum?.program_studi_id || m.kurikulum?.program_studi_id === defaultProdiId);
      const defaultMk = initialMks[0] || matakuliahs[0];

      setKelasForm({
        mata_kuliah_id: defaultMk?.id || 1,
        tahun_akademik_id: 1,
        program_studi_id: defaultProdiId,
        ruangan_id: 1,
        dosen_id: dosens[0]?.id || 1,
        kode_kelas: defaultMk ? `${defaultMk.kode_mk}-A` : 'IF101-A',
        nama_kelas: defaultMk ? `${defaultMk.nama} (Kelas A)` : 'Kelas A',
        kapasitas: 40,
        kuota_krs: 40,
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

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
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
        action={
          !isMahasiswa && !isDosen && (
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              className="font-bold min-h-[40px]"
              onClick={() => handleOpenKelasModal()}
            >
              Buka Kelas Baru
            </Button>
          )
        }
      />

      {/* Filter Hari Tab Bar (Khusus Mahasiswa & Dosen) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 text-xs">
        {['', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'].map((hari) => (
          <button
            key={hari}
            onClick={() => setFilterHari(hari)}
            className={`px-4 py-2 font-bold rounded-xl transition whitespace-nowrap capitalize ${
              filterHari === hari
                ? 'bg-primary-700 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            {hari === '' ? 'Semua Hari' : hari}
          </button>
        ))}
      </div>



      {/* Modal RPS (Rencana Pembelajaran Semester) */}
      {selectedRpsKelas && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="badge badge-purple text-2xs font-bold mb-1 inline-block">
                  Rencana Pembelajaran Semester (RPS OBE)
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  {selectedRpsKelas.mata_kuliah?.kode_mk} - {selectedRpsKelas.mata_kuliah?.nama}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Bobot {selectedRpsKelas.mata_kuliah?.total_sks} SKS ({selectedRpsKelas.mata_kuliah?.sks_teori} Teori / {selectedRpsKelas.mata_kuliah?.sks_praktik} Praktik) • Semester {selectedRpsKelas.mata_kuliah?.semester_anjuran}
                </p>
              </div>
              <Button
                variant="outline"
                icon={<Download size={13} />}
                className="text-2xs font-bold"
                onClick={() => toast.success('Mengunduh dokumen RPS (PDF)...')}
              >
                Unduh PDF
              </Button>
            </div>

            {/* Capaian Pembelajaran */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2 text-xs">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Award size={14} className="text-primary-600" /> Capaian Pembelajaran Lulusan (CPL / CPMK):
              </h4>
              <ul className="list-disc list-inside space-y-1 text-slate-700">
                <li>Mampu merancang dan mengimplementasikan algoritma perangkat lunak berstandar industri.</li>
                <li>Mampu menganalisis efisiensi komputasi struktur data kompleks secara mandiri dan tim.</li>
                <li>Memahami etika profesional dan regulasi perlindungan data dalam rekayasa sistem terintegrasi.</li>
              </ul>
            </div>

            {/* Bobot Penilaian */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-3 bg-primary-50 border border-primary-200 rounded-xl">
                <span className="text-2xs text-primary-700 font-semibold block">Tugas & Harian</span>
                <span className="text-base font-black text-primary-900">20%</span>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <span className="text-2xs text-blue-700 font-semibold block">UTS</span>
                <span className="text-base font-black text-blue-900">25%</span>
              </div>
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                <span className="text-2xs text-indigo-700 font-semibold block">UAS Final</span>
                <span className="text-base font-black text-indigo-900">35%</span>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-2xs text-emerald-700 font-semibold block">Praktikum / Lab</span>
                <span className="text-base font-black text-emerald-900">20%</span>
              </div>
            </div>

            {/* Silabus 16 Minggu */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Matriks Rencana Perkuliahan (16 Pertemuan):
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3 w-16 text-center">MINGGU</th>
                      <th className="py-2 px-3">POKOK BAHASAN & MATERI KAJIAN</th>
                      <th className="py-2 px-3">METODE PEMBELAJARAN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    <tr>
                      <td className="py-2 px-3 text-center font-bold">1 - 2</td>
                      <td className="py-2 px-3">Pengantar Paradigma & Fondasi Arsitektur</td>
                      <td className="py-2 px-3 text-slate-500">Kuliah Interaktif & Diskusi</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-center font-bold">3 - 4</td>
                      <td className="py-2 px-3">Analisis Kompleksitas Algoritma & Big-O Notation</td>
                      <td className="py-2 px-3 text-slate-500">Problem-Based Learning</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-center font-bold">5 - 7</td>
                      <td className="py-2 px-3">Struktur Data Non-Linear: Binary Trees & Graph Traversal</td>
                      <td className="py-2 px-3 text-slate-500">Praktikum Lab Komputer</td>
                    </tr>
                    <tr className="bg-blue-50/50 font-bold text-blue-900">
                      <td className="py-2 px-3 text-center">8</td>
                      <td colSpan={2} className="py-2 px-3">Evaluasi Tengah Semester (UTS)</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-center font-bold">9 - 11</td>
                      <td className="py-2 px-3">Optimasi Algoritma Greedy & Dynamic Programming</td>
                      <td className="py-2 px-3 text-slate-500">Project-Based Learning</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-center font-bold">12 - 15</td>
                      <td className="py-2 px-3">Integrasi API RESTful & Keamanan Data</td>
                      <td className="py-2 px-3 text-slate-500">Studi Kasus & Presentasi Tim</td>
                    </tr>
                    <tr className="bg-primary-50/50 font-bold text-primary-900">
                      <td className="py-2 px-3 text-center">16</td>
                      <td colSpan={2} className="py-2 px-3">Evaluasi Akhir Semester (UAS) & Ujian Praktik</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-100">
              <Button
                variant="primary"
                className="text-xs font-bold"
                onClick={() => setSelectedRpsKelas(null)}
              >
                Tutup Dokumen RPS
              </Button>
            </div>
          </div>
        </div>
      )}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
        {/* Filters Toolbar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari mata kuliah, ruang, atau dosen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-primary-500 transition outline-none font-medium"
            />
          </div>

          <select
            value={filterProdi}
            onChange={(e) => setFilterProdi(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none font-semibold text-slate-700"
          >
            <option value="">Semua Program Studi</option>
            {prodis.map((p) => (
              <option key={p.id} value={p.id}>{p.nama} ({p.jenjang || 'S1'})</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-y border-slate-200">
              <tr>
                <th className="py-3 px-4">KODE KELAS</th>
                <th className="py-3 px-4">MATA KULIAH</th>
                <th className="py-3 px-4">DOSEN PENGAMPU</th>
                <th className="py-3 px-4">JADWAL & WAKTU</th>
                <th className="py-3 px-4">RUANGAN (SINAPRA)</th>
                <th className="py-3 px-4 text-center">RPS SILABUS</th>
                {!isMahasiswa && !isDosen && <th className="py-3 px-4">KUOTA</th>}
                <th className="py-3 px-4 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr><td colSpan={8} className="py-8 text-center text-slate-400">Memuat jadwal kelas...</td></tr>
              ) : kelas.length === 0 ? (
                <tr><td colSpan={8} className="py-8 text-center text-slate-400">Belum ada kelas perkuliahan yang sesuai filter</td></tr>
              ) : (
                kelas.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{k.kode_kelas}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900">{k.mata_kuliah?.nama}</span>
                      <span className="text-2xs text-slate-500 block font-normal">
                        ({k.mata_kuliah?.total_sks} SKS • {k.mata_kuliah?.kode_mk})
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {k.dosen_pengampu?.[0]?.dosen?.nama_lengkap || '-'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-800 capitalize block">{k.hari}</span>
                      <span className="text-2xs text-slate-500 font-mono">
                        {k.jam_mulai ? k.jam_mulai.slice(0, 5) : '08:00'} - {k.jam_selesai ? k.jam_selesai.slice(0, 5) : '10:30'} WIB
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="badge badge-purple text-2xs font-semibold inline-flex items-center gap-1">
                        <MapPin size={11} /> {k.ruangan?.nama || 'Ruang Kuliah'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Button
                        variant="outline"
                        icon={<FileText size={12} />}
                        className="text-2xs py-1 px-2.5 h-auto font-bold hover:bg-slate-100"
                        onClick={() => handleOpenRps(k)}
                      >
                        Lihat RPS
                      </Button>
                    </td>
                    {!isMahasiswa && !isDosen && (
                      <td className="py-3.5 px-4 tabular-nums font-bold text-slate-800">
                        {k.krs_details_count || 0} / {k.kapasitas} kursi
                      </td>
                    )}
                    <td className="py-3.5 px-4 text-right">
                      {!isMahasiswa && !isDosen ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            icon={<Edit3 size={13} />}
                            className="text-2xs py-1 px-2.5 h-auto font-bold"
                            onClick={() => handleOpenKelasModal(k)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            icon={<Trash2 size={13} className="text-rose-600" />}
                            className="text-2xs py-1 px-2.5 h-auto hover:bg-rose-50"
                            onClick={() => handleDeleteKelas(k.id)}
                          />
                        </div>
                      ) : (
                        <span className="text-2xs text-slate-400 font-bold">Terjadwal</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
                      return matchProdi && matchSearch;
                    })
                    .map((mk) => (
                      <option key={mk.id} value={mk.id}>
                        {mk.kode_mk} - {mk.nama} ({mk.total_sks} SKS • Smtr {mk.semester_anjuran})
                      </option>
                    ))}
                </select>
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

              {!editingKelas && (
                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Dosen Pengampu Utama
                  </label>
                  <select
                    value={kelasForm.dosen_id}
                    onChange={(e) => setKelasForm({ ...kelasForm, dosen_id: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary-500"
                  >
                    {dosens.map((d) => (
                      <option key={d.id} value={d.id}>{d.nama_lengkap} ({d.nidn})</option>
                    ))}
                  </select>
                </div>
              )}

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
      {/* MODAL LIHAT & EDIT DOKUMEN RPS (16 MINGGU) */}
      {/* ======================================================== */}
      {selectedRpsKelas && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="badge badge-purple text-2xs font-bold uppercase">
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
                <button onClick={() => setSelectedRpsKelas(null)} className="text-slate-400 hover:text-slate-600 font-bold">
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
                    <p className="text-slate-800">
                      Dosen Pengembang: <strong>{rpsDetail?.dosen_pengembang?.nama_lengkap || selectedRpsKelas.dosen_pengampu?.[0]?.dosen?.nama_lengkap || 'Dosen Pengampu'}</strong> • Kaprodi: <strong>{rpsDetail?.kaprodi?.nama_lengkap || 'Dr. Ir. Ahmad Santoso, M.Kom'}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      className="text-xs font-bold"
                      onClick={() => setIsEditingRps(!isEditingRps)}
                    >
                      {isEditingRps ? 'Tutup Form Edit' : '✏️ Edit Dokumen RPS'}
                    </Button>
                  </div>
                </div>

                {/* Form Edit RPS jika Dosen / Admin Mengubah */}
                {isEditingRps && (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      try {
                        setSavingRps(true);
                        await siakadService.storeRps({
                          id: rpsDetail?.id,
                          mata_kuliah_id: selectedRpsKelas.mata_kuliah_id,
                          tahun_ajaran: '2026/2027',
                          semester: selectedRpsKelas.mata_kuliah?.semester_anjuran || 1,
                          ...rpsForm,
                        });
                        toast.success('RPS berhasil diperbarui!');
                        setIsEditingRps(false);
                        handleOpenRps(selectedRpsKelas);
                      } catch (err: any) {
                        toast.error('Gagal memperbarui RPS');
                      } finally {
                        setSavingRps(false);
                      }
                    }}
                    className="p-4 bg-primary-50/50 border border-primary-200 rounded-xl space-y-3 text-xs"
                  >
                    <span className="font-extrabold text-primary-900 block text-xs">Form Pemutakhiran Dokumen RPS:</span>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Deskripsi Singkat Mata Kuliah</label>
                      <textarea
                        rows={3}
                        required
                        value={rpsForm.deskripsi_singkat}
                        onChange={(e) => setRpsForm({ ...rpsForm, deskripsi_singkat: e.target.value })}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">Pustaka Utama</label>
                        <textarea
                          rows={2}
                          value={rpsForm.pustaka_utama}
                          onChange={(e) => setRpsForm({ ...rpsForm, pustaka_utama: e.target.value })}
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">Pustaka Pendukung</label>
                        <textarea
                          rows={2}
                          value={rpsForm.pustaka_pendukung}
                          onChange={(e) => setRpsForm({ ...rpsForm, pustaka_pendukung: e.target.value })}
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <Button type="submit" variant="primary" className="text-xs font-bold" disabled={savingRps}>
                        {savingRps ? 'Menyimpan...' : 'Simpan Perubahan RPS'}
                      </Button>
                    </div>
                  </form>
                )}

                {/* Deskripsi & Capaian CPMK */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <span className="font-extrabold text-slate-900 block">Capaian Pembelajaran (CPMK):</span>
                    <ul className="space-y-1.5 list-disc pl-4 text-slate-700">
                      {rpsDetail?.mata_kuliah?.cpmks?.map((c: any) => (
                        <li key={c.id}>
                          <strong>{c.kode_cpmk} ({c.bobot_persentase}%):</strong> {c.deskripsi}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <span className="font-extrabold text-slate-900 block">Pustaka & Referensi:</span>
                    <p className="text-slate-700 whitespace-pre-line text-2xs leading-relaxed">
                      {rpsDetail?.pustaka_utama || '1. Tanenbaum, Modern Operating Systems.\n2. Pressman, Software Engineering.'}
                    </p>
                  </div>
                </div>

                {/* Rencana 16 Pertemuan Mingguan */}
                <div className="space-y-2">
                  <span className="font-extrabold text-xs text-slate-900 block">
                    Rencana Kegiatan Pembelajaran Mingguan (16 Pertemuan):
                  </span>
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3 w-12 text-center">MG</th>
                          <th className="py-2.5 px-3 w-48">KEMAMPUAN AKHIR (SUB-CPMK)</th>
                          <th className="py-2.5 px-3">BAHAN KAJIAN / MATERI</th>
                          <th className="py-2.5 px-3 w-40">METODE PEMBELAJARAN</th>
                          <th className="py-2.5 px-3 text-center w-16">BOBOT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {rpsDetail?.mingguan?.map((m: any) => (
                          <tr key={m.id} className={m.minggu_ke === 8 || m.minggu_ke === 16 ? 'bg-primary-50/60 font-bold' : 'hover:bg-slate-50'}>
                            <td className="py-2.5 px-3 text-center font-mono font-black">{m.minggu_ke}</td>
                            <td className="py-2.5 px-3 text-slate-900">{m.kemampuan_akhir}</td>
                            <td className="py-2.5 px-3 text-slate-700">{m.bahan_kajian}</td>
                            <td className="py-2.5 px-3 text-2xs text-slate-600">{m.bentuk_metode}</td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold">{m.bobot_penilaian}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
