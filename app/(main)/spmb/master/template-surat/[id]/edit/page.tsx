'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, HelpCircle, Download } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import { spmbService } from '@/services/spmb.service';
import { JalurMasuk, GelombangPenerimaan, TemplateSuratSpmb, JENIS_SURAT_OPTIONS } from '@/types/spmb.types';
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

export default function EditTemplateSuratPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

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

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      kode: '',
      nama: '',
      jenis_surat: 'sk_lulus',
      jalur_masuk_id: '',
      gelombang_id: '',
      is_active: true,
      kop_nama_institusi: '',
      kop_nama_sub: '',
      kop_alamat_kontak: '',
      format_nomor_surat: '',
      judul_surat: '',
      teks_pembuka: '',
      teks_keputusan: '',
      petunjuk_daftar_ulang: '',
      kota_penetapan: '',
      nama_penandatangan: '',
      jabatan_penandatangan: '',
      nip_penandatangan: '',
      catatan_kaki: '',
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetching(true);
        const resDetail = await spmbService.getTemplateSuratDetail(id);

        if (resDetail?.data) {
          const d = resDetail.data;
          reset({
            kode: d.kode || '',
            nama: d.nama || '',
            jenis_surat: d.jenis_surat || 'sk_lulus',
            jalur_masuk_id: d.jalur_masuk_id ? String(d.jalur_masuk_id) : '',
            gelombang_id: d.gelombang_id ? String(d.gelombang_id) : '',
            is_active: d.is_active ?? true,
            kop_nama_institusi: d.kop_nama_institusi || '',
            kop_nama_sub: d.kop_nama_sub || '',
            kop_alamat_kontak: d.kop_alamat_kontak || '',
            format_nomor_surat: d.format_nomor_surat || '',
            judul_surat: d.judul_surat || '',
            teks_pembuka: d.teks_pembuka || '',
            teks_keputusan: d.teks_keputusan || '',
            petunjuk_daftar_ulang: d.petunjuk_daftar_ulang || '',
            kota_penetapan: d.kota_penetapan || '',
            nama_penandatangan: d.nama_penandatangan || '',
            jabatan_penandatangan: d.jabatan_penandatangan || '',
            nip_penandatangan: d.nip_penandatangan || '',
            catatan_kaki: d.catatan_kaki || '',
          });
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Gagal memuat template';
        toast.error(message);
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, [id, reset]);

  const onSubmit = async (data: FormValues) => {
    try {
      setLoading(true);
      const payload = {
        ...data,
        jalur_masuk_id: data.jalur_masuk_id ? Number(data.jalur_masuk_id) : null,
        gelombang_id: data.gelombang_id ? Number(data.gelombang_id) : null,
      };

      await spmbService.updateTemplateSurat(id, payload);
      toast.success('Template surat berhasil diperbarui');
      router.push('/spmb/master/template-surat');
    } catch (err: unknown) {
      const error = err as AxiosError<{ message?: string }>;
      toast.error(error.response?.data?.message || error.message || 'Gagal menyimpan perubahan');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewPdf = async () => {
    const toastId = toast.loading('Menyiapkan pratinjau dokumen PDF...');
    try {
      const blob = await spmbService.previewTemplateSuratPdf(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.download = `Preview-Template-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Pratinjau PDF berhasil dibuka', { id: toastId });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal membuka pratinjau PDF';
      toast.error(message, { id: toastId });
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded w-1/3"></div>
        <div className="card p-6 bg-slate-100 h-96 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Edit Template Surat SPMB"
        description="Perbarui konfigurasi teks, kop, dan format nomor surat keputusan"
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push('/spmb/master/template-surat')}
              style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
              icon={<ArrowLeft size={16} />}
            >
              Kembali
            </Button>
            <Button
              variant="outline"
              onClick={handlePreviewPdf}
              style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
              icon={<Download size={16} />}
            >
              Pratinjau PDF
            </Button>
          </div>
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
            Simpan Perubahan
          </Button>
        </div>
      </form>
    </div>
  );
}
