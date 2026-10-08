'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, HelpCircle } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import { spmbService } from '@/services/spmb.service';
import { moduleService } from '@/services/module.service';
import { JalurMasuk, GelombangPenerimaan, JENIS_SURAT_OPTIONS } from '@/types/spmb.types';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';

const schema = z.object({
  kode: z.string().min(1, 'Kode template wajib diisi').max(50, 'Maksimal 50 karakter'),
  nama: z.string().min(1, 'Nama template wajib diisi').max(150, 'Maksimal 150 karakter'),
  jenis_surat: z.string().min(1, 'Jenis surat wajib diisi'),
  module_id: z.string().optional().nullable(),
  klasifikasi_surat_id: z.string().optional().nullable(),
  unit_surat_id: z.string().optional().nullable(),
  jalur_masuk_id: z.string().optional().nullable(),
  gelombang_id: z.string().optional().nullable(),
  is_active: z.boolean(),
  kop_nama_institusi: z.string().optional().nullable(),
  kop_nama_sub: z.string().optional().nullable(),
  kop_alamat_kontak: z.string().optional().nullable(),
  format_nomor_surat: z.string().optional().nullable(),
  judul_surat: z.string().optional().nullable(),
  teks_pembuka: z.string().optional().nullable(),
  teks_keputusan: z.string().optional().nullable(),
  petunjuk_daftar_ulang: z.string().optional().nullable(),
  kota_penetapan: z.string().optional().nullable(),
  nama_penandatangan: z.string().optional().nullable(),
  jabatan_penandatangan: z.string().optional().nullable(),
  nip_penandatangan: z.string().optional().nullable(),
  catatan_kaki: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

const AVAILABLE_PLACEHOLDERS = [
  { token: '{no_pendaftaran}', desc: 'Nomor Pendaftaran peserta' },
  { token: '{nama}', desc: 'Nama lengkap peserta' },
  { token: '{nik}', desc: 'NIK peserta' },
  { token: '{tempat_lahir}', desc: 'Tempat lahir peserta' },
  { token: '{tanggal_lahir}', desc: 'Tanggal lahir peserta' },
  { token: '{asal_sekolah}', desc: 'Nama sekolah / institusi asal' },
  { token: '{prodi_diterima}', desc: 'Nama Program Studi yang diterima' },
  { token: '{jenjang}', desc: 'Jenjang pendidikan (S1, D3, dll.)' },
  { token: '{jalur}', desc: 'Nama Jalur Masuk' },
  { token: '{gelombang}', desc: 'Nama Gelombang Penerimaan' },
  { token: '{tahun_akademik}', desc: 'Tahun Akademik pendaftaran' },
  { token: '{tanggal_penetapan}', desc: 'Tanggal pengesahan / hari ini' },
  { token: '{tahun}', desc: 'Tahun 4 digit (misal: 2026)' },
  { token: '{romawi_bulan}', desc: 'Bulan dalam romawi (misal: X)' },
  { token: '{kota}', desc: 'Kota penetapan surat' },
];

export default function CreateTemplateSuratPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const loadJalurOptions = async (inputValue: string) => {
    try {
      const res = await spmbService.getJalurMasuk({ name: inputValue, limit: 50 });
      return (res.data || []).map((j: JalurMasuk) => ({
        value: String(j.id),
        label: `${j.kode} - ${j.nama}`,
      }));
    } catch {
      return [];
    }
  };

  const loadGelombangOptions = async (inputValue: string) => {
    try {
      const res = await spmbService.getGelombang({ nama: inputValue, per_page: 50 });
      return (res.data || []).map((g: GelombangPenerimaan) => ({
        value: String(g.id),
        label: g.nama,
      }));
    } catch {
      return [];
    }
  };

  const loadModuleOptions = async (inputValue: string) => {
    try {
      const modules = await moduleService.getAllModules();
      const q = inputValue.toLowerCase();
      return (modules || [])
        .filter((m) => m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q))
        .map((m) => ({ value: String(m.id), label: `${m.name} (${m.code})` }));
    } catch {
      return [];
    }
  };

  const loadKlasifikasiOptions = async (inputValue: string) => {
    try {
      const { klasifikasi: items } = await spmbService.getTemplateSuratArsipOptions();
      const q = inputValue.toLowerCase();
      return (items || [])
        .filter((k) => k.kode.toLowerCase().includes(q) || k.nama.toLowerCase().includes(q))
        .map((k) => ({ value: String(k.id), label: `${k.kode} - ${k.nama}` }));
    } catch {
      return [];
    }
  };

  const loadUnitOptions = async (inputValue: string) => {
    try {
      const { unit: items } = await spmbService.getTemplateSuratArsipOptions();
      const q = inputValue.toLowerCase();
      return (items || [])
        .filter((u) => u.kode.toLowerCase().includes(q) || u.nama.toLowerCase().includes(q))
        .map((u) => ({ value: String(u.id), label: `${u.kode} - ${u.nama}` }));
    } catch {
      return [];
    }
  };

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      kode: '',
      nama: '',
      jenis_surat: 'sk_lulus',
      module_id: '',
      klasifikasi_surat_id: '',
      unit_surat_id: '',
      jalur_masuk_id: '',
      gelombang_id: '',
      is_active: true,
      kop_nama_institusi: 'UNIVERSITAS INDONUSA',
      kop_nama_sub: 'PANITIA PENERIMAAN MAHASISWA BARU (SPMB)',
      kop_alamat_kontak:
        'Sekretariat SPMB Kampus Terpadu • Email: spmb@kampus.ac.id • Website: spmb.kampus.ac.id\nTahun Akademik {tahun_akademik}',
      format_nomor_surat: 'SKL/SPMB/{tahun}/{romawi_bulan}/{no_pendaftaran}',
      judul_surat: 'SURAT KETERANGAN TANDA LULUS SELEKSI',
      teks_pembuka:
        'Berdasarkan hasil evaluasi verifikasi kelengkapan berkas administrasi dan pemenuhan syarat seleksi penerimaan mahasiswa baru Tahun Akademik {tahun_akademik}, Panitia Penerimaan Mahasiswa Baru menyatakan bahwa:',
      teks_keputusan: 'DINYATAKAN LULUS / DITERIMA',
      petunjuk_daftar_ulang:
        '1. Calon mahasiswa yang dinyatakan lulus wajib melakukan Daftar Ulang melalui portal resmi SPMB pada menu Daftar Ulang.\n2. Selesaikan pembayaran biaya registrasi/UKT menggunakan nomor Virtual Account resmi yang tertera pada invoice tagihan Anda sebelum batas waktu yang ditentukan.\n3. Setelah pembayaran daftar ulang terkonfirmasi lunas, sistem akan menerbitkan Nomor Induk Mahasiswa (NIM) resmi dan akun akademik mahasiswa baru.\n4. Surat keterangan ini sah dan dihasilkan secara otomatis oleh Sistem Informasi Penerimaan Mahasiswa Baru terintegrasi.',
      kota_penetapan: 'Surakarta',
      nama_penandatangan: 'Panitia Seleksi SPMB',
      jabatan_penandatangan: 'Ketua Panitia SPMB / Direktur Admisi',
      nip_penandatangan: '',
      catatan_kaki:
        'Dokumen ini merupakan bukti kelulusan seleksi SPMB yang sah. Keabsahan dokumen dapat diverifikasi langsung melalui database induk kampus terintegrasi.',
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setLoading(true);
      const payload = {
        ...data,
        module_id: data.module_id ? Number(data.module_id) : null,
        klasifikasi_surat_id: data.klasifikasi_surat_id ? Number(data.klasifikasi_surat_id) : null,
        unit_surat_id: data.unit_surat_id ? Number(data.unit_surat_id) : null,
        jalur_masuk_id: data.jalur_masuk_id ? Number(data.jalur_masuk_id) : null,
        gelombang_id: data.gelombang_id ? Number(data.gelombang_id) : null,
      };

      await spmbService.createTemplateSurat(payload);
      toast.success('Template surat berhasil ditambahkan');
      router.push('/spmb/master/template-surat');
    } catch (err: unknown) {
      const error = err as AxiosError<{ message?: string }>;
      toast.error(error.response?.data?.message || error.message || 'Gagal menyimpan template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Tambah Template Surat SPMB"
        description="Buat konfigurasi template dokumen SK atau surat resmi SPMB"
        action={
          <Button
            variant="outline"
            onClick={() => router.push('/spmb/master/template-surat')}
            style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
            icon={<ArrowLeft size={16} />}
          >
            Kembali
          </Button>
        }
      />

      {/* Cheatsheet Variabel Dinamis */}
      <div className="card p-4 bg-slate-50 border border-slate-200">
        <div className="flex items-center gap-2 mb-2 text-slate-800">
          <HelpCircle size={16} className="text-slate-500" />
          <span className="text-xs font-bold uppercase tracking-wider">
            Token / Placeholder Dinamis yang Didukung
          </span>
        </div>
        <p className="text-2xs text-slate-600 mb-3">
          Anda dapat memasukkan token di bawah ini ke dalam format nomor surat, teks pembuka, teks
          keputusan, atau petunjuk daftar ulang. Nilainya akan diganti otomatis sesuai data pendaftar.
        </p>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_PLACEHOLDERS.map((item) => (
            <span
              key={item.token}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-white border border-slate-200 text-2xs font-mono text-slate-700"
              title={item.desc}
            >
              <strong className="text-slate-900">{item.token}</strong>
              <span className="text-slate-400 font-sans">• {item.desc}</span>
            </span>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Identitas & Ruang Lingkup */}
        <div className="card p-4 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b pb-2">
            1. Identitas & Ruang Lingkup Template
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              label="Kode Template"
              placeholder="Misal: SK_LULUS_REGULER_2026"
              required
              hint="Kode unik template surat."
              error={errors.kode?.message}
              {...register('kode')}
            />

            <Input
              label="Nama Template"
              placeholder="Misal: Template SK Kelulusan Jalur Reguler"
              required
              hint="Nama deskriptif untuk mempermudah identifikasi."
              error={errors.nama?.message}
              {...register('nama')}
            />

            <Controller
              name="jenis_surat"
              control={control}
              render={({ field }) => (
                <Select
                  label="Jenis Surat"
                  required
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.jenis_surat?.message}
                  options={JENIS_SURAT_OPTIONS as any}
                />
              )}
            />

            <Controller
              name="jalur_masuk_id"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  label="Khusus Jalur Masuk"
                  placeholder="Pilih Jalur Masuk (Kosongkan jika berlaku semua)"
                  value={field.value}
                  onChange={(opt: { value: string; label: string } | null) => field.onChange(opt ? opt.value : '')}
                  loadOptions={loadJalurOptions}
                  isClearable
                  hint="Kosongkan jika template ini berlaku untuk semua jalur."
                />
              )}
            />

            <Controller
              name="gelombang_id"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  label="Khusus Gelombang"
                  placeholder="Pilih Gelombang (Kosongkan jika berlaku semua)"
                  value={field.value}
                  onChange={(opt: { value: string; label: string } | null) => field.onChange(opt ? opt.value : '')}
                  loadOptions={loadGelombangOptions}
                  isClearable
                  hint="Kosongkan jika template ini berlaku untuk semua gelombang."
                />
              )}
            />

            <div className="flex items-center pt-6">
              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    label="Aktifkan Template Ini"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    hint="Template yang aktif akan dipilih sistem saat menerbitkan SK."
                  />
                )}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Kop & Penomoran Surat */}
        <div className="card p-4 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b pb-2">
            2. Kop Surat & Penomoran
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              label="Nama Institusi (Kop Atas)"
              placeholder="UNIVERSITAS INDONUSA"
              error={errors.kop_nama_institusi?.message}
              {...register('kop_nama_institusi')}
            />

            <Input
              label="Sub Unit / Panitia (Kop Baris 2)"
              placeholder="PANITIA PENERIMAAN MAHASISWA BARU (SPMB)"
              error={errors.kop_nama_sub?.message}
              {...register('kop_nama_sub')}
            />

            <Input
              label="Format Nomor Surat"
              placeholder="SKL/SPMB/{tahun}/{romawi_bulan}/{no_pendaftaran}"
              hint="Dapat menggunakan token {tahun}, {romawi_bulan}, {no_pendaftaran}."
              error={errors.format_nomor_surat?.message}
              {...register('format_nomor_surat')}
            />

            <div className="col-span-full">
              <Textarea
                label="Alamat & Kontak Institusi (Kop Bawah)"
                placeholder="Sekretariat SPMB • Email: spmb@kampus.ac.id • Website: spmb.kampus.ac.id"
                rows={2}
                error={errors.kop_alamat_kontak?.message}
                {...register('kop_alamat_kontak')}
              />
            </div>
          </div>
        </div>

        {/* Section 2b: Integrasi Arsip */}
        <div className="card p-4 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b pb-2">
            2b. Integrasi Penomoran Arsip (Opsional)
          </h3>
          <p className="text-2xs text-slate-500">
            Bila Modul, Klasifikasi, dan Unit diisi, nomor SK akan diterbitkan otomatis dari modul
            Arsip sesuai master data (bukan format internal SPMB).
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Controller
              name="module_id"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  label="Modul Asal Nomor"
                  placeholder="Pilih modul (mis. SPMB)"
                  value={field.value}
                  onChange={(opt: { value: string; label: string } | null) => field.onChange(opt ? opt.value : '')}
                  loadOptions={loadModuleOptions}
                  isClearable
                  hint="Modul yang menjadi asal permohonan nomor surat."
                />
              )}
            />

            <Controller
              name="klasifikasi_surat_id"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  label="Klasifikasi Surat (Arsip)"
                  placeholder="Cari kode/uraian klasifikasi..."
                  value={field.value}
                  onChange={(opt: { value: string; label: string } | null) => field.onChange(opt ? opt.value : '')}
                  loadOptions={loadKlasifikasiOptions}
                  isClearable
                  hint="Diambil dari master Klasifikasi Surat Arsip."
                />
              )}
            />

            <Controller
              name="unit_surat_id"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  label="Unit Pengolah (Arsip)"
                  placeholder="Cari kode/nama unit pengolah..."
                  value={field.value}
                  onChange={(opt: { value: string; label: string } | null) => field.onChange(opt ? opt.value : '')}
                  loadOptions={loadUnitOptions}
                  isClearable
                  hint="Diambil dari master Kode Unit Arsip."
                />
              )}
            />
          </div>
        </div>

        {/* Section 3: Konten & Isi Surat */}
        <div className="card p-4 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b pb-2">
            3. Isi Surat & Keputusan
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-full">
              <Input
                label="Judul Surat"
                placeholder="SURAT KETERANGAN TANDA LULUS SELEKSI"
                error={errors.judul_surat?.message}
                {...register('judul_surat')}
              />
            </div>

            <div className="col-span-full">
              <Textarea
                label="Teks Pembuka / Konsideran"
                placeholder="Berdasarkan hasil evaluasi verifikasi kelengkapan berkas administrasi..."
                rows={3}
                hint="Dapat menggunakan token {tahun_akademik}, {nama}, dll."
                error={errors.teks_pembuka?.message}
                {...register('teks_pembuka')}
              />
            </div>

            <div className="col-span-full">
              <Input
                label="Teks Status Keputusan Kelulusan"
                placeholder="DINYATAKAN LULUS / DITERIMA"
                hint="Teks utama yang tampil tebal di kotak status kelulusan."
                error={errors.teks_keputusan?.message}
                {...register('teks_keputusan')}
              />
            </div>

            <div className="col-span-full">
              <Textarea
                label="Petunjuk & Ketentuan Daftar Ulang"
                placeholder="1. Calon mahasiswa yang dinyatakan lulus wajib melakukan Daftar Ulang..."
                rows={4}
                hint="Masukkan butir petunjuk tahapan selanjutnya bagi calon mahasiswa baru."
                error={errors.petunjuk_daftar_ulang?.message}
                {...register('petunjuk_daftar_ulang')}
              />
            </div>
          </div>
        </div>

        {/* Section 4: Pengesahan & Footer */}
        <div className="card p-4 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b pb-2">
            4. Pengesahan & Catatan Kaki
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              label="Kota Penetapan"
              placeholder="Surakarta"
              error={errors.kota_penetapan?.message}
              {...register('kota_penetapan')}
            />

            <Input
              label="Nama Pejabat Penandatangan"
              placeholder="Dr. Ir. H. Ahmad Fauzi, M.T."
              error={errors.nama_penandatangan?.message}
              {...register('nama_penandatangan')}
            />

            <Input
              label="Jabatan Pejabat"
              placeholder="Ketua Panitia SPMB"
              error={errors.jabatan_penandatangan?.message}
              {...register('jabatan_penandatangan')}
            />

            <Input
              label="NIP / NIDN (Opsional)"
              placeholder="198001012005011003"
              error={errors.nip_penandatangan?.message}
              {...register('nip_penandatangan')}
            />

            <div className="col-span-full">
              <Input
                label="Catatan Kaki (Footer Dokumen)"
                placeholder="Dokumen ini merupakan bukti kelulusan seleksi SPMB yang sah..."
                error={errors.catatan_kaki?.message}
                {...register('catatan_kaki')}
              />
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push('/spmb/master/template-surat')}
          >
            Batal
          </Button>
          <Button
            type="submit"
            loading={loading}
            icon={<Save size={16} />}
            style={{ backgroundColor: 'var(--module-primary)' }}
          >
            Simpan Template
          </Button>
        </div>
      </form>
    </div>
  );
}
