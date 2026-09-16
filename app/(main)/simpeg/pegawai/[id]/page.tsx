'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Edit2,
  Building2,
  GraduationCap,
  Phone,
  CreditCard,
  Calendar,
  Award,
  ShieldAlert,
  BookOpen,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { simpegService } from '@/services/simpeg.service';
import { simpegKompetensiService } from '@/services/simpeg.kompetensi.service';
import type { Pegawai } from '@/types/simpeg.types';
import type { SertifikasiDosen, RiwayatTes, RiwayatPelatihan } from '@/types/simpeg.kompetensi.types';
import { FileCheck, ExternalLink } from 'lucide-react';

export default function DetailPegawaiPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const pegawaiId = Number(resolvedParams.id);
  const router = useRouter();

  const [pegawai, setPegawai] = useState<Pegawai | null>(null);
  const [sertifikasiList, setSertifikasiList] = useState<SertifikasiDosen[]>([]);
  const [tesList, setTesList] = useState<RiwayatTes[]>([]);
  const [pelatihanList, setPelatihanList] = useState<RiwayatPelatihan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const [resPeg, resSer, resTes, resPel] = await Promise.all([
          simpegService.getPegawaiDetail(pegawaiId),
          simpegKompetensiService.getSertifikasiList({ pegawai_id: pegawaiId, per_page: 50 }).catch(() => ({ data: [] })),
          simpegKompetensiService.getTesList({ pegawai_id: pegawaiId, per_page: 50 }).catch(() => ({ data: [] })),
          simpegKompetensiService.getPelatihanList({ pegawai_id: pegawaiId, per_page: 50 }).catch(() => ({ data: [] })),
        ]);

        if (resPeg.data) {
          setPegawai(resPeg.data);
        }
        setSertifikasiList(resSer.data || []);
        setTesList(resTes.data || []);
        setPelatihanList(resPel.data || []);
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Gagal memuat rincian data pegawai.');
      } finally {
        setLoading(false);
      }
    };

    if (pegawaiId) {
      fetchDetail();
    }
  }, [pegawaiId]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-fade-in">
        <PageHeader
          title="Detail Pegawai"
          description="Memuat informasi profil pegawai..."
          backUrl="/simpeg/pegawai"
        />
        <div className="card p-12 text-center text-slate-400">
          Memuat data profil dan riwayat pendidikan...
        </div>
      </div>
    );
  }

  if (!pegawai) {
    return (
      <div className="flex flex-col gap-6 animate-fade-in">
        <PageHeader
          title="Pegawai Tidak Ditemukan"
          description="Data pegawai yang Anda cari tidak tersedia di sistem."
          backUrl="/simpeg/pegawai"
        />
        <div className="card p-12 text-center">
          <ShieldAlert size={48} className="mx-auto mb-3 text-rose-500" />
          <p className="text-slate-600 font-medium">Pegawai dengan ID tersebut tidak ditemukan.</p>
        </div>
      </div>
    );
  }

  const displayName = pegawai.nama_gelar || pegawai.nama_lengkap;
  const nidn = pegawai.nidn || pegawai.dosen?.nidn;
  const nuptk = pegawai.nuptk || pegawai.dosen?.nuptk;
  const nip = pegawai.nip;
  const homebaseProdi = pegawai.dosen?.program_studi?.nama;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <PageHeader
        title={displayName}
        description="Rincian profil lengkap, identitas kepegawaian, homebase prodi, serta riwayat pendidikan resmi."
        backUrl="/simpeg/pegawai"
        action={
          <Button
            icon={<Edit2 size={16} />}
            onClick={() => router.push(`/simpeg/pegawai/${pegawai.id}/edit`)}
          >
            Edit Data Pegawai
          </Button>
        }
      />

      {/* Hero Banner Card */}
      <div className="card bg-simpeg-hero p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 flex items-center justify-center text-2xl sm:text-3xl font-extrabold text-white shadow-sm backdrop-blur-sm">
              {pegawai.nama_lengkap?.charAt(0) || 'P'}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {pegawai.roles && pegawai.roles.length > 0 ? (
                  pegawai.roles.map((r) => (
                    <Badge key={r.id} variant="purple" className="text-xs uppercase font-bold">
                      {r.name}
                    </Badge>
                  ))
                ) : (
                  <Badge variant={pegawai.jenis_pegawai === 'dosen' ? 'purple' : 'blue'} className="text-xs uppercase font-bold">
                    {pegawai.jenis_pegawai?.toUpperCase()}
                  </Badge>
                )}
                <Badge variant={pegawai.status === 'aktif' ? 'green' : 'gray'} className="text-xs uppercase">
                  {pegawai.status}
                </Badge>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">{displayName}</h2>
              <div className="flex items-center gap-3 mt-1 flex-wrap text-xs sm:text-sm text-white/90">
                {nidn && (
                  <span>
                    NIDN: <strong className="font-mono">{nidn}</strong>
                  </span>
                )}
                {nuptk && (
                  <span>
                    • NUPTK: <strong className="font-mono">{nuptk}</strong>
                  </span>
                )}
                {nip && (
                  <span>
                    • NIP: <strong className="font-mono">{nip}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Biodata & Identitas Utama */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-200">
            <Users size={20} className="text-primary-600" />
            <h3 className="text-base sm:text-lg font-bold text-slate-800 m-0">
              Biodata &amp; Identitas Utama
            </h3>
          </div>

          <div className="flex flex-col gap-4 text-sm">
            <div>
              <div className="text-xs text-slate-400 uppercase font-semibold">Nama Lengkap &amp; Gelar Resmi</div>
              <div className="font-bold text-slate-900 mt-0.5">{displayName}</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-400 uppercase font-semibold">NIDN / NUPTK</div>
                <div className="font-mono font-bold text-primary-600 mt-0.5">
                  {nidn || nuptk || '-'}
                </div>
                {nidn ? (
                  <span className="text-2xs text-slate-400">Nomor Induk Dosen Nasional</span>
                ) : nuptk ? (
                  <span className="text-2xs text-slate-400">Nomor Unik Pendidik &amp; Tenaga Kependidikan</span>
                ) : null}
              </div>
              <div>
                <div className="text-xs text-slate-400 uppercase font-semibold">NIP / NIK</div>
                <div className="font-mono font-semibold text-slate-800 mt-0.5">
                  {nip || pegawai.nik || '-'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-400 uppercase font-semibold">Tempat, Tanggal Lahir</div>
                <div className="text-slate-700 mt-0.5">
                  {pegawai.tempat_lahir || '-'}, {pegawai.tanggal_lahir || '-'}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400 uppercase font-semibold">Jenis Kelamin</div>
                <div className="text-slate-700 mt-0.5">
                  {pegawai.jenis_kelamin === 'L' ? 'Laki-Laki' : 'Perempuan'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-400 uppercase font-semibold">Agama</div>
                <div className="text-slate-700 mt-0.5">{pegawai.agama || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 uppercase font-semibold">Kontak / No. WhatsApp</div>
                <div className="text-slate-700 flex items-center gap-1.5 mt-0.5">
                  <Phone size={14} className="text-primary-600 shrink-0" />
                  <span>{pegawai.telepon || '-'}</span>
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-400 uppercase font-semibold">Alamat Domisili</div>
              <div className="text-slate-700 mt-0.5">{pegawai.alamat || '-'}</div>
            </div>
          </div>
        </div>

        {/* Card 2: Unit Kerja & Penugasan Akademik */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-200">
            <Building2 size={20} className="text-primary-600" />
            <h3 className="text-base sm:text-lg font-bold text-slate-800 m-0">
              Unit Kerja &amp; Penugasan
            </h3>
          </div>

          <div className="flex flex-col gap-4 text-sm">
            {homebaseProdi && (
              <div className="p-4 rounded-xl bg-primary-50/60 border border-primary-200">
                <div className="flex items-center gap-2 text-xs uppercase font-bold text-primary-700">
                  <BookOpen size={15} />
                  Homebase Program Studi
                </div>
                <div className="text-base font-extrabold text-primary-900 mt-1">
                  {homebaseProdi}
                </div>
                <div className="text-xs text-primary-600 mt-0.5">
                  Sesuai SK Penugasan Dosen PDDIKTI / Feeder Kemendikbudristek
                </div>
              </div>
            )}

            <div>
              <div className="text-xs text-slate-400 uppercase font-semibold mb-1">Peran / Jenis Pegawai (Role SSO)</div>
              <div className="flex flex-wrap gap-1.5 mt-0.5">
                {pegawai.roles && pegawai.roles.length > 0 ? (
                  pegawai.roles.map((r) => (
                    <Badge key={r.id} variant="purple" className="text-xs font-semibold">
                      {r.name}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="blue" className="text-xs font-semibold uppercase">
                    {pegawai.jenis_pegawai}
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-400 uppercase font-semibold">Unit Kerja</div>
                <div className="font-semibold text-slate-800 mt-0.5">
                  {pegawai.unit_kerja?.nama || '-'}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400 uppercase font-semibold">Status Kepegawaian</div>
                <div className="capitalize text-slate-700 mt-0.5">
                  {pegawai.status_kepegawaian?.replace('_', ' ') || '-'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-400 uppercase font-semibold">Tanggal Masuk</div>
                <div className="text-slate-700 flex items-center gap-1.5 mt-0.5">
                  <Calendar size={14} className="text-slate-400 shrink-0" />
                  <span>{pegawai.tanggal_masuk || '-'}</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400 uppercase font-semibold">Status Keaktifan</div>
                <div className="mt-0.5">
                  <Badge variant={pegawai.status === 'aktif' ? 'green' : 'gray'}>
                    {pegawai.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-400 uppercase font-semibold">Nama Bank</div>
                <div className="text-slate-700 flex items-center gap-1.5 mt-0.5">
                  <CreditCard size={14} className="text-slate-400 shrink-0" />
                  <span>{pegawai.bank_nama || '-'}</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400 uppercase font-semibold">Nomor Rekening</div>
                <div className="font-mono text-slate-800 mt-0.5">
                  {pegawai.nomor_rekening || '-'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Riwayat Pendidikan Resmi & Gelar Akademik */}
      <div className="card p-6">
        <div className="flex items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-200 flex-wrap">
          <div className="flex items-center gap-3">
            <GraduationCap size={22} className="text-primary-600" />
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800 m-0">
                Riwayat Pendidikan Resmi &amp; Gelar Akademik
              </h3>
              <p className="text-xs text-slate-400 m-0">
                Data pendidikan formal dari pangkalan data pendidikan tinggi yang menentukan gelar otomatis
              </p>
            </div>
          </div>
          <Badge variant="blue" className="text-xs">
            {pegawai.riwayat_pendidikan?.length || 0} Riwayat Tercatat
          </Badge>
        </div>

        {pegawai.riwayat_pendidikan && pegawai.riwayat_pendidikan.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pegawai.riwayat_pendidikan.map((edu) => (
              <div
                key={edu.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between gap-3 hover:border-primary-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="purple" className="uppercase font-mono text-xs font-bold">
                    {edu.jenjang}
                  </Badge>
                  {edu.is_pendidikan_terakhir && (
                    <Badge variant="green" className="text-2xs">
                      Pendidikan Terakhir
                    </Badge>
                  )}
                </div>

                <div>
                  <div className="font-bold text-slate-900 text-sm">{edu.nama_institusi}</div>
                  <div className="text-xs text-slate-600 mt-0.5 font-medium">
                    {edu.program_studi || 'Bidang Terkait'}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80 flex flex-col gap-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-2xs uppercase">Gelar Akademik:</span>
                    <span className="font-bold text-primary-700 font-mono">
                      {edu.singkatan_gelar || '-'}
                    </span>
                  </div>
                  {edu.gelar_akademik && (
                    <div className="text-2xs text-slate-500 italic text-right">
                      {edu.gelar_akademik}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1 text-slate-500">
                    <span>Tahun Lulus:</span>
                    <span className="font-mono font-semibold">{edu.tahun_lulus || '-'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <GraduationCap size={40} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Belum ada data riwayat pendidikan resmi yang tercatat untuk pegawai ini.</p>
          </div>
        )}
      </div>

      {/* Card 4: Riwayat Jabatan Fungsional */}
      {pegawai.riwayat_jabatan && pegawai.riwayat_jabatan.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-200">
            <Award size={20} className="text-primary-600" />
            <h3 className="text-base sm:text-lg font-bold text-slate-800 m-0">
              Riwayat Jabatan &amp; Jabatan Fungsional
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pegawai.riwayat_jabatan.map((jab) => (
              <div
                key={jab.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm">
                    {jab.jabatan?.nama || jab.jabatan_fungsional?.nama || 'Jabatan'}
                  </span>
                  {jab.is_active && <Badge variant="green">Aktif</Badge>}
                </div>
                {jab.sk_nomor && (
                  <div className="text-xs text-slate-500 font-mono">
                    SK: {jab.sk_nomor}
                  </div>
                )}
                {jab.mulai_jabatan && (
                  <div className="text-xs text-slate-400">
                    TMT: {jab.mulai_jabatan}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Card 5: Rekam Jejak Kompetensi & Sertifikasi Dosen */}
      <div className="card p-6">
        <div className="flex items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-200 flex-wrap">
          <div className="flex items-center gap-3">
            <Award size={22} className="text-primary-600" />
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800 m-0">
                Kompetensi, Sertifikasi &amp; Pelatihan
              </h3>
              <p className="text-xs text-slate-400 m-0">
                Sertifikasi dosen (Serdos), tes kemampuan bahasa/akademik (TOEFL/TKDA), dan rekam jejak diklat
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/simpeg/kompetensi')}
          >
            Kelola di Portal Kompetensi
          </Button>
        </div>

        {/* 3 Sub-sections */}
        <div className="flex flex-col gap-6">
          {/* Sub 1: Sertifikasi Dosen */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Award size={16} className="text-primary-600" />
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                Sertifikasi Dosen &amp; Profesi ({sertifikasiList.length})
              </h4>
            </div>

            {sertifikasiList.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sertifikasiList.map((ser) => (
                  <div
                    key={ser.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <Badge variant="purple" className="text-2xs">
                          {ser.jenis_sertifikasi?.nama || 'Sertifikasi'}
                        </Badge>
                        <span className="text-xs font-bold text-slate-700">{ser.tahun_sertifikasi}</span>
                      </div>
                      <div className="font-bold text-slate-900 text-sm">{ser.nama_sertifikat}</div>
                      <div className="text-xs text-primary-600 font-medium mt-0.5">{ser.bidang_studi}</div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 text-xs text-slate-500 flex items-center justify-between">
                      <span>{ser.penyelenggara}</span>
                      {ser.file_path && (
                        <a
                          href={`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/${ser.file_path}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-primary-600 font-semibold hover:underline"
                        >
                          <ExternalLink size={12} /> Berkas
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-dashed border-slate-200">
                Belum ada sertifikasi dosen / profesi yang tercatat.
              </p>
            )}
          </div>

          {/* Sub 2: Riwayat Tes */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileCheck size={16} className="text-primary-600" />
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                Riwayat Tes Kemampuan (TOEFL / TKDA) ({tesList.length})
              </h4>
            </div>

            {tesList.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tesList.map((t) => (
                  <div
                    key={t.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <Badge variant="blue" className="text-2xs">
                          {t.jenis_tes?.nama || t.nama_tes}
                        </Badge>
                        <span className="font-mono font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-xs">
                          Skor: {t.skor}
                        </span>
                      </div>
                      <div className="font-bold text-slate-800 text-xs">{t.nama_tes}</div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 text-xs text-slate-500 flex items-center justify-between">
                      <span>{t.tahun} • {t.penyelenggara}</span>
                      {t.file_path && (
                        <a
                          href={`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/${t.file_path}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-primary-600 font-semibold hover:underline"
                        >
                          <ExternalLink size={12} /> Bukti
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-dashed border-slate-200">
                Belum ada data skor tes kemampuan yang tercatat.
              </p>
            )}
          </div>

          {/* Sub 3: Pelatihan & Workshop */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap size={16} className="text-primary-600" />
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                Pelatihan, Diklat &amp; Workshop ({pelatihanList.length})
              </h4>
            </div>

            {pelatihanList.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pelatihanList.map((pel) => (
                  <div
                    key={pel.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <Badge variant="purple" className="text-2xs">
                          {pel.peran?.nama || 'Peserta'}
                        </Badge>
                        {pel.jumlah_jam && (
                          <span className="text-2xs font-semibold text-slate-500">{pel.jumlah_jam} JP</span>
                        )}
                      </div>
                      <div className="font-bold text-slate-900 text-xs line-clamp-2">{pel.nama_kegiatan}</div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 text-xs text-slate-500 flex items-center justify-between">
                      <span>{pel.tanggal_mulai ? pel.tanggal_mulai.substring(0, 10) : '-'}</span>
                      {pel.file_path && (
                        <a
                          href={`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/${pel.file_path}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-primary-600 font-semibold hover:underline"
                        >
                          <ExternalLink size={12} /> Sertifikat
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-dashed border-slate-200">
                Belum ada riwayat pelatihan &amp; diklat yang tercatat.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
