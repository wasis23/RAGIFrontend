'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Boxes, Info, UserCheck, ShieldCheck, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';
import { sinapraService } from '@/services/sinapra.service';
import type { ApplyPeminjamanAsetPayload, Aset } from '@/types/sinapra.types';
import type { User } from '@/types/auth.types';

export default function PermohonanPinjamAsetPage() {
  const router = useRouter();
  const authUser = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [currentUser, setCurrentUser] = useState<User | null>(authUser);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Multi-item asset selection state
  const [selectedAsets, setSelectedAsets] = useState<Aset[]>([]);
  const [candidateAset, setCandidateAset] = useState<{ value: string; label: string; raw?: Aset } | null>(null);

  // Data Diri Peminjam (Otomatis dari Akun)
  const [namaPeminjam, setNamaPeminjam] = useState('');
  const [nomorIdentitas, setNomorIdentitas] = useState('');
  const [labelIdentitas, setLabelIdentitas] = useState('Nomor Identitas');
  const [keteranganRole, setKeteranganRole] = useState('Akun Pengguna');
  const [kontakPeminjam, setKontakPeminjam] = useState('');
  const [unitProdi, setUnitProdi] = useState('');

  // Form Data Peminjaman
  const [form, setForm] = useState<ApplyPeminjamanAsetPayload>({
    aset_id: 0,
    tanggal_pinjam: new Date().toISOString().split('T')[0],
    tanggal_kembali_rencana: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    keperluan: '',
  });

  // Ekstraksi info identitas peminjam dari profil user
  const populateUserIdentity = (userObj: User | null) => {
    if (!userObj) return;

    // 1. Nama peminjam
    const nama =
      userObj.nama_lengkap ||
      userObj.name ||
      userObj.pegawai?.nama_lengkap ||
      userObj.mahasiswa?.nama_lengkap ||
      userObj.username ||
      '';
    setNamaPeminjam(nama);

    // 2. Nomor Identitas & Status
    if (userObj.mahasiswa?.nim) {
      setNomorIdentitas(userObj.mahasiswa.nim);
      setLabelIdentitas('Nomor Induk Mahasiswa (NIM)');
      setKeteranganRole('Mahasiswa');
      setUnitProdi(userObj.mahasiswa.program_studi?.nama || 'Civitas Akademika');
    } else if (userObj.pegawai?.nidn) {
      setNomorIdentitas(userObj.pegawai.nidn);
      setLabelIdentitas('NIDN (Nomor Induk Dosen Nasional)');
      setKeteranganRole('Dosen Pengajar');
      setUnitProdi(userObj.pegawai.unit_kerja?.nama || 'Fakultas / Program Studi');
    } else if (userObj.pegawai?.nuptk) {
      setNomorIdentitas(userObj.pegawai.nuptk);
      setLabelIdentitas('NUPTK (Nomor Unik Pendidik & Tenaga Kependidikan)');
      setKeteranganRole('Tenaga Pendidik');
      setUnitProdi(userObj.pegawai.unit_kerja?.nama || 'Unit Kerja Kampus');
    } else if (userObj.pegawai?.nip) {
      setNomorIdentitas(userObj.pegawai.nip);
      setLabelIdentitas('Nomor Induk Pegawai (NIP)');
      setKeteranganRole('Pegawai / Tenaga Kependidikan');
      setUnitProdi(userObj.pegawai.unit_kerja?.nama || 'Unit Kerja Kampus');
    } else {
      setNomorIdentitas(userObj.username || `UID-${userObj.id}`);
      setLabelIdentitas('Nomor Identitas / ID Akun');
      setKeteranganRole('Akun Terdaftar');
      setUnitProdi('Fasilitas Kampus Terintegrasi');
    }

    // 3. Kontak
    const kontak = userObj.phone || userObj.pegawai?.telepon || userObj.mahasiswa?.telepon || '';
    if (kontak && !kontakPeminjam) {
      setKontakPeminjam(kontak);
    }
  };

  useEffect(() => {
    // Populate dari cache store awal
    if (authUser) {
      populateUserIdentity(authUser);
    }

    // Ambil data terbaru dari server untuk memuat relasi mahasiswa / pegawai lengkap
    authService
      .getMe()
      .then((res: any) => {
        const u = res?.data || res?.user || res;
        if (u && (u.username || u.email)) {
          setCurrentUser(u);
          setUser(u);
          populateUserIdentity(u);
        }
      })
      .catch(() => {
        // Fallback tetap menggunakan cache store
      });
  }, [setUser]);

  const loadAsetOptions = async (inputValue: string) => {
    try {
      const res: any = await sinapraService.getAsetList({
        search: inputValue,
        is_borrowable: true,
      });
      const list = res?.data?.items || res?.data || res || [];
      if (Array.isArray(list)) {
        return list.map((a: Aset) => ({
          value: a.id.toString(),
          label: `${a.kode_aset} - ${a.nama} (${a.ruangan?.nama || 'Ruangan Umum'} • Kondisi: ${a.kondisi})`,
          raw: a,
        }));
      }
      return [];
    } catch {
      return [];
    }
  };

  const handleAddCandidateAset = () => {
    if (!candidateAset || !candidateAset.raw) {
      toast.error('Silakan cari dan pilih barang terlebih dahulu.');
      return;
    }

    const exists = selectedAsets.some((item) => item.id === candidateAset.raw!.id);
    if (exists) {
      toast.error('Barang ini sudah ada dalam daftar peminjaman Anda.');
      return;
    }

    setSelectedAsets((prev) => [...prev, candidateAset.raw!]);
    setCandidateAset(null);
    toast.success(`${candidateAset.raw.nama} ditambahkan ke daftar peminjaman.`);
  };

  const handleRemoveAset = (id: number) => {
    setSelectedAsets((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi Data Diri Peminjam
    if (!namaPeminjam.trim()) {
      toast.error('Nama peminjam wajib terisi.');
      return;
    }

    if (!nomorIdentitas.trim()) {
      toast.error('Nomor identitas (NIM/NIDN/NUPTK/NIP) wajib terisi.');
      return;
    }

    if (!kontakPeminjam.trim()) {
      toast.error('Nomor kontak / WhatsApp aktif wajib diisi untuk konfirmasi.');
      return;
    }

    // Validasi Peminjaman Aset (Multi item)
    if (selectedAsets.length === 0) {
      toast.error('Silakan pilih minimal 1 barang atau aset inventaris yang ingin dipinjam.');
      return;
    }

    if (!form.tanggal_pinjam) {
      toast.error('Tanggal mulai pinjam wajib diisi.');
      return;
    }

    if (!form.tanggal_kembali_rencana) {
      toast.error('Tanggal rencana pengembalian wajib diisi.');
      return;
    }

    if (form.tanggal_kembali_rencana < form.tanggal_pinjam) {
      toast.error('Tanggal rencana kembali tidak boleh lebih awal daripada tanggal pinjam.');
      return;
    }

    if (!form.keperluan.trim()) {
      toast.error('Keperluan atau rincian pemakaian barang wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: ApplyPeminjamanAsetPayload = {
        ...form,
        aset_id: selectedAsets[0].id,
        aset_ids: selectedAsets.map((item) => item.id),
        nomor_identitas: nomorIdentitas,
        kontak_peminjam: kontakPeminjam,
      };

      await sinapraService.applyPeminjamanAset(payload);
      toast.success(`Permohonan peminjaman ${selectedAsets.length} barang aset berhasil diajukan!`);
      router.push('/sinapra/peminjaman');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengajukan permohonan peminjaman aset.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Permohonan Pinjam Barang / Aset"
        description="Formulir pengajuan peminjaman alat praktikum laboratorium, multimedia, dan inventaris kampus (Modul SINAPRA)"
        action={
          <Button
            variant="outline"
            onClick={() => router.push('/sinapra/peminjaman')}
            style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
            icon={<ArrowLeft size={16} />}
          >
            Kembali
          </Button>
        }
      />

      {/* Info Banner Alur & Ketentuan Peminjaman Aset */}
      <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/70 dark:bg-blue-950/20 flex items-start gap-3 text-xs text-blue-900 dark:text-blue-200">
        <Info size={18} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold block">Ketentuan Peminjaman Aset & Multi-Barang:</span>
          <p className="text-blue-700 dark:text-blue-300 leading-relaxed text-2xs md:text-xs">
            Anda dapat meminjam <strong>lebih dari 1 barang sekaligus</strong> dalam satu pengajuan (memiliki satu nomor transaksi bersama). Hanya aset berstatus <strong>Tersedia</strong> dan memiliki izin dapat dipinjam yang dapat dipilih. Bila aset merupakan fasilitas laboratorium, permohonan akan diverifikasi oleh <strong>Laboran Pengampu Prodi</strong> sebelum disetujui Admin Sarpras.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* CARD 1: DATA DIRI PEMINJAM (OTOMATIS DARI AKUN) */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-4 md:p-6 space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <UserCheck className="text-[var(--module-primary)]" size={20} />
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm md:text-base">
                  Data Diri Peminjam
                </h3>
                <p className="text-2xs text-slate-500">
                  Data pemohon terisi otomatis sesuai akun yang sedang login dan terikat sebagai penanggung jawab.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--module-primary) 12%, transparent)',
                  color: 'var(--module-primary)',
                  borderColor: 'color-mix(in srgb, var(--module-primary) 25%, transparent)',
                }}
                className="text-2xs font-semibold"
              >
                {keteranganRole}
              </Badge>
              <span className="inline-flex items-center gap-1 text-2xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded px-2 py-0.5">
                <ShieldCheck size={12} /> Data Identitas Dikunci
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Input
                label="Nama Lengkap Peminjam *"
                value={namaPeminjam}
                disabled
                readOnly
                className="bg-slate-100 dark:bg-slate-800 cursor-not-allowed font-medium text-slate-800 dark:text-slate-200"
                hint="Terverifikasi otomatis dari akun Anda (Tidak dapat diubah)."
              />
            </div>

            <div>
              <Input
                label={`${labelIdentitas} *`}
                value={nomorIdentitas}
                disabled
                readOnly
                className="bg-slate-100 dark:bg-slate-800 cursor-not-allowed font-mono text-slate-800 dark:text-slate-200 font-semibold"
                hint={`Nomor identitas resmi ${keteranganRole} (Tidak dapat diubah).`}
              />
            </div>

            <div>
              <Input
                label="Nomor Kontak / WhatsApp Aktif *"
                type="tel"
                required
                placeholder="cth: 081234567890"
                value={kontakPeminjam}
                onChange={(e) => setKontakPeminjam(e.target.value)}
                hint="Nomor aktif untuk konfirmasi pengambilan dan pengembalian barang."
              />
            </div>

            {unitProdi && (
              <div className="col-span-full">
                <Input
                  label="Satuan Kerja / Program Studi Asal Peminjam"
                  value={unitProdi}
                  disabled
                  readOnly
                  className="bg-slate-100 dark:bg-slate-800 cursor-not-allowed text-slate-700 dark:text-slate-300"
                  hint="Lingkup akademik atau unit penugasan pemohon."
                />
              </div>
            )}
          </div>
        </div>

        {/* CARD 2: DETAIL ASET MULTI-ITEM & JADWAL PEMINJAMAN */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-4 md:p-6 space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm md:text-base flex items-center gap-2">
                <Boxes className="text-[var(--module-primary)]" size={18} /> Daftar Barang & Aset yang Dipinjam
              </h3>
              <p className="text-2xs text-slate-500">
                Pilih satu atau beberapa barang inventaris yang berstatus tersedia untuk dipinjam sekaligus.
              </p>
            </div>
            <Badge
              variant="gray"
              className="text-xs font-semibold px-2.5 py-1"
              style={{
                borderColor: 'var(--module-primary)',
                color: 'var(--module-primary)',
                backgroundColor: 'color-mix(in srgb, var(--module-primary) 10%, transparent)',
              }}
            >
              {selectedAsets.length} Barang Dipilih
            </Badge>
          </div>

          {/* Area Pencarian & Tambah Barang */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-3 md:p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
              Cari & Tambahkan Barang ke Daftar Pinjaman
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1">
                <AsyncSelect
                  placeholder="Ketik kode aset atau nama barang..."
                  value={candidateAset}
                  onChange={(sel: any) => setCandidateAset(sel)}
                  loadOptions={loadAsetOptions}
                  hint="Hanya aset yang berstatus tersedia dan diizinkan dipinjam yang dapat dipilih."
                />
              </div>
              <Button
                type="button"
                variant="primary"
                onClick={handleAddCandidateAset}
                disabled={!candidateAset}
                icon={<Plus size={16} />}
                className="shrink-0 h-10"
              >
                Tambah ke Daftar
              </Button>
            </div>
          </div>

          {/* Tabel / List Barang yang Dipilih */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Barang yang Diajukan ({selectedAsets.length})
            </h4>

            {selectedAsets.length === 0 ? (
              <div className="p-6 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20">
                <Boxes size={32} className="mx-auto text-slate-400 mb-2 opacity-60" />
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Belum ada barang yang dipilih.
                </p>
                <p className="text-2xs text-slate-400 mt-0.5">
                  Gunakan pencarian di atas untuk memilih dan menambahkan barang inventaris / alat praktikum.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 uppercase text-2xs tracking-wider">
                      <th className="py-2.5 px-3 w-10 text-center">No</th>
                      <th className="py-2.5 px-3">Kode Aset</th>
                      <th className="py-2.5 px-3">Nama Barang</th>
                      <th className="py-2.5 px-3">Lokasi / Ruangan</th>
                      <th className="py-2.5 px-3">Kondisi</th>
                      <th className="py-2.5 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {selectedAsets.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3 text-center font-mono text-2xs text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-xs text-[var(--module-primary)]">
                          {item.kode_aset}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-100">
                          {item.nama}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 text-2xs">
                          {item.ruangan?.nama || 'Ruangan Umum'}
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge
                            variant="green"
                            className="text-2xs capitalize"
                          >
                            {item.kondisi}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveAset(item.id)}
                            className="inline-flex items-center justify-center p-1.5 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Hapus dari daftar pinjaman"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Area Jadwal & Keperluan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div>
              <Input
                label="Tanggal Pinjam *"
                type="date"
                required
                value={form.tanggal_pinjam}
                onChange={(e) => setForm({ ...form, tanggal_pinjam: e.target.value })}
                hint="Tanggal mulai penggunaan barang."
              />
            </div>

            <div>
              <Input
                label="Tanggal Rencana Kembali *"
                type="date"
                required
                value={form.tanggal_kembali_rencana}
                onChange={(e) => setForm({ ...form, tanggal_kembali_rencana: e.target.value })}
                hint="Perkiraan tanggal pengembalian barang ke laboratorium/sarpras."
              />
            </div>

            <div className="col-span-full">
              <Textarea
                label="Keperluan / Rincian Pemakaian *"
                required
                rows={4}
                placeholder="Jelaskan tujuan peminjaman, lokasi pemakaian, serta rincian kegiatan..."
                value={form.keperluan}
                onChange={(e) => setForm({ ...form, keperluan: e.target.value })}
                hint="Tuliskan keterangan kegiatan dengan jelas untuk mempercepat proses verifikasi oleh Laboran/Admin."
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/sinapra/peminjaman')}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              icon={<Boxes size={16} />}
              disabled={selectedAsets.length === 0}
            >
              Kirim Permohonan Pinjam ({selectedAsets.length} Barang)
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
