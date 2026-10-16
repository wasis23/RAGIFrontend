'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Plus, Trash2, Search, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { z } from 'zod';
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { siakadService } from '@/services/siakad.service';
import { arsipService } from '@/services/arsip.service';
import type { CheckSkResult } from '@/types/arsip.types';
import toast from 'react-hot-toast';

const detailSchema = z.object({
  mata_kuliah_diakui_id: z
    .number()
    .min(1, 'Pilih mata kuliah kurikulum lokal'),
  kode_mk_asal: z.string().min(1, 'Kode MK asal wajib diisi'),
  nama_mk_asal: z.string().min(1, 'Nama MK asal wajib diisi'),
  sks_asal: z
    .number()
    .min(1, 'SKS asal minimal 1')
    .max(10, 'SKS asal maksimal 10'),
  nilai_huruf_asal: z.string().min(1, 'Nilai huruf asal wajib diisi'),
});

const konversiEditSchema = z.object({
  kampus_asal: z.string().min(1, 'Perguruan tinggi / kampus asal wajib diisi'),
  prodi_asal: z.string().min(1, 'Program studi asal wajib diisi'),
  nomor_sk: z.string().max(150, 'Nomor SK maksimal 150 karakter').optional().or(z.literal('')),
  catatan: z.string().optional().or(z.literal('')),
  status: z.string(),
  details: z.array(detailSchema).min(1, 'Minimal harus ada 1 baris mata kuliah konversi'),
});

type KonversiEditFormData = z.infer<typeof konversiEditSchema>;

export default function EditKonversiTransferPage() {
  const router = useRouter();
  const params = useParams();
  const konversiId = Number(params.id);

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [konversi, setKonversi] = useState<any | null>(null);
  const [defaultMkOptions, setDefaultMkOptions] = useState<any[]>([]);

  const [skCheck, setSkCheck] = useState<{
    status: 'idle' | 'checking' | 'valid' | 'invalid';
    message?: string;
    data?: CheckSkResult | null;
  }>({
    status: 'idle',
    data: null,
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<KonversiEditFormData>({
    resolver: zodResolver(konversiEditSchema),
    defaultValues: {
      kampus_asal: '',
      prodi_asal: '',
      nomor_sk: '',
      catatan: '',
      status: 'diajukan',
      details: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'details',
  });

  const watchNomorSk = useWatch({ control, name: 'nomor_sk' });

  useEffect(() => {
    // Only reset to idle if user manually edits and it differs from initial
    if (konversi && watchNomorSk !== (konversi.nomor_sk || '')) {
      setSkCheck((prev) => (prev.status === 'idle' ? prev : { status: 'idle', data: null }));
    }
  }, [watchNomorSk, konversi]);

  const handleCheckSk = async () => {
    const nomor = (watchNomorSk || '').trim();
    if (!nomor) {
      toast.error('Masukkan nomor SK terlebih dahulu untuk dicek ke Arsip');
      return;
    }

    setSkCheck({ status: 'checking' });
    try {
      const res = await arsipService.checkNomorSk(nomor);
      const resData = res?.data;
      if (resData?.is_valid && resData?.has_document) {
        setSkCheck({
          status: 'valid',
          message: res.message || 'Nomor SK sah dan dokumen fisik SK terverifikasi di modul Arsip.',
          data: resData,
        });
        toast.success('Nomor SK sah dan berkas dokumen terverifikasi di Arsip!');
      } else if (resData && !resData.has_document) {
        setSkCheck({
          status: 'invalid',
          message: 'Nomor SK terdaftar di sistem Arsip, namun belum memiliki lampiran berkas dokumen fisik (dokumen kosong).',
          data: resData,
        });
        toast.error('Dokumen fisik SK belum diunggah di modul Arsip');
      } else {
        setSkCheck({
          status: 'invalid',
          message: res.message || 'Nomor SK tidak memenuhi syarat keabsahan di modul Arsip.',
          data: resData,
        });
        toast.error('Nomor SK tidak sah di modul Arsip');
      }
    } catch (err: any) {
      const respData = err?.response?.data?.data;
      const msg = err?.response?.data?.message || err?.message || 'Nomor SK tidak ditemukan di modul Arsip.';
      setSkCheck({
        status: 'invalid',
        message: msg,
        data: respData || null,
      });
      toast.error(msg);
    }
  };

  const loadMataKuliahOptions = useCallback(async (inputValue: string) => {
    try {
      const res = await siakadService.getMataKuliahs({
        search: inputValue,
        per_page: 20,
      });
      const data = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
      return data.map((mk: any) => ({
        value: mk.id,
        label: `${mk.kode_mk || ''} - ${mk.nama || ''} (${mk.sks_total || mk.sks_teori || 0} SKS)`.trim(),
      }));
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    if (!konversiId) {
      toast.error('ID usulan konversi tidak valid');
      router.push('/siakad/civitas/konversi');
      return;
    }

    const fetchData = async () => {
      try {
        setLoadingInitial(true);
        const detailRes = await siakadService.getKonversiDetail(konversiId);
        const data = detailRes.data;
        if (!data) {
          toast.error('Usulan konversi tidak ditemukan');
          router.push('/siakad/civitas/konversi');
          return;
        }

        setKonversi(data);

        if (data.arsip_nomor_surat) {
          setSkCheck({
            status: 'valid',
            message: 'Nomor SK sah dan dokumen fisik SK terverifikasi di modul Arsip.',
            data: {
              nomor_surat: data.nomor_sk || data.arsip_nomor_surat.nomor_surat || '',
              is_found: true,
              is_valid: true,
              has_document: Boolean(data.arsip_nomor_surat.has_dokumen),
              perihal: data.arsip_nomor_surat.perihal,
              status: data.arsip_nomor_surat.status,
              tanggal_surat: data.arsip_nomor_surat.tanggal_surat,
              dokumen_url: data.arsip_nomor_surat.dokumen_url,
            },
          });
        }

        const initialOptions = (data.details || []).map((d: any) => ({
          value: d.mata_kuliah_diakui_id,
          label: d.mata_kuliah_diakui
            ? `${d.mata_kuliah_diakui.kode_mk || ''} - ${d.mata_kuliah_diakui.nama || ''}`.trim()
            : `MK ID #${d.mata_kuliah_diakui_id}`,
        }));
        setDefaultMkOptions(initialOptions);

        reset({
          kampus_asal: data.kampus_asal || '',
          prodi_asal: data.prodi_asal || '',
          nomor_sk: data.nomor_sk || '',
          catatan: data.catatan || '',
          status: data.status || 'diajukan',
          details: (data.details || []).map((d: any) => ({
            mata_kuliah_diakui_id: Number(d.mata_kuliah_diakui_id) || 1,
            kode_mk_asal: d.kode_mk_asal || '',
            nama_mk_asal: d.nama_mk_asal || '',
            sks_asal: Number(d.sks_asal) || 3,
            nilai_huruf_asal: d.nilai_huruf_asal || 'A',
          })),
        });
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Gagal memuat usulan konversi');
        router.push('/siakad/civitas/konversi');
      } finally {
        setLoadingInitial(false);
      }
    };

    fetchData();
  }, [konversiId, router, reset]);

  const handleAddDetail = () => {
    append({
      mata_kuliah_diakui_id: defaultMkOptions[0]?.value || 1,
      kode_mk_asal: '',
      nama_mk_asal: '',
      sks_asal: 3,
      nilai_huruf_asal: 'A',
    });
  };

  const onSubmit = async (data: KonversiEditFormData) => {
    try {
      await siakadService.updateKonversi(konversiId, {
        kampus_asal: data.kampus_asal,
        prodi_asal: data.prodi_asal,
        nomor_sk: data.nomor_sk,
        catatan: data.catatan,
        status: data.status,
        details: data.details.map((d) => ({
          mata_kuliah_diakui_id: Number(d.mata_kuliah_diakui_id),
          kode_mk_asal: d.kode_mk_asal,
          nama_mk_asal: d.nama_mk_asal,
          sks_asal: Number(d.sks_asal),
          nilai_huruf_asal: d.nilai_huruf_asal,
        })),
      });
      toast.success('Perubahan mata kuliah konversi berhasil disimpan');
      router.push('/siakad/civitas/konversi');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal menyimpan perubahan konversi');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`Edit Usulan Penyetaraan MK${konversi?.mahasiswa ? ` — ${konversi.mahasiswa.nama_lengkap}` : ''}`}
        description="Sesuaikan kode/nama MK asal, bobot SKS, nilai huruf, nomor SK penyetaraan, atau MK lokal yang disetarakan."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Konversi Nilai', href: '/siakad/civitas/konversi' },
          { label: 'Edit Usulan' },
        ]}
        action={
          <Button
            variant="outline"
            icon={<ArrowLeft size={16} />}
            onClick={() => router.push('/siakad/civitas/konversi')}
            style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
          >
            Kembali
          </Button>
        }
      />

      {loadingInitial ? (
        <div className="card p-6 bg-white border border-slate-200 shadow-xs text-center text-sm text-slate-500">
          Memuat usulan konversi...
        </div>
      ) : (
        <div className="card p-6 bg-white border border-slate-200 shadow-xs">
          <div className="space-y-6">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 md:p-6 text-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-2xs text-slate-400 block uppercase font-bold">Mahasiswa</span>
                <strong className="text-slate-900">{konversi?.mahasiswa?.nama_lengkap}</strong>
                <span className="font-mono text-2xs text-slate-500 block">NIM: {konversi?.mahasiswa?.nim || '-'}</span>
              </div>
              <div>
                <span className="text-2xs text-slate-400 block uppercase font-bold">No. Transaksi</span>
                <strong className="font-mono text-slate-900 block text-xs">{konversi?.no_transaksi || '-'}</strong>
              </div>
              <div>
                <span className="text-2xs text-slate-400 block uppercase font-bold">Status Saat Ini</span>
                <Badge variant={konversi?.status === 'disetujui' ? 'green' : 'amber'} className="capitalize">
                  {konversi?.status || 'diajukan'}
                </Badge>
              </div>
            </div>

            <div className="border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">1. Asal Perguruan Tinggi &amp; SK Penyetaraan</h3>
              <p className="text-2xs text-slate-500">Identitas kampus tempat studi sebelumnya dan dasar nomor SK resmi.</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Perguruan Tinggi / Kampus Asal *"
                  required
                  placeholder="Contoh: Universitas Nusantara"
                  error={errors.kampus_asal?.message}
                  {...register('kampus_asal')}
                />

                <Input
                  label="Program Studi Asal *"
                  required
                  placeholder="Contoh: Teknik Komputer"
                  error={errors.prodi_asal?.message}
                  {...register('prodi_asal')}
                />
              </div>

              {/* Field Nomor SK Penyetaraan dengan Tombol CEK ke Modul Arsip */}
              <div className="space-y-2">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Input
                      label="Nomor SK Penyetaraan (dari Modul Arsip)"
                      placeholder="Contoh: 001/SK-KONV/UTI/2026"
                      className="font-mono uppercase"
                      error={errors.nomor_sk?.message}
                      {...register('nomor_sk')}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11 shrink-0"
                    style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
                    icon={<Search size={16} />}
                    onClick={handleCheckSk}
                    loading={skCheck.status === 'checking'}
                    disabled={skCheck.status === 'checking'}
                  >
                    CEK
                  </Button>
                </div>
                <p className="text-2xs text-slate-500">
                  Nomor SK resmi dari modul Arsip dapat diverifikasi secara langsung keabsahan surat dan kelengkapan dokumen fisiknya.
                </p>

                {/* Feedback Status Cek SK Arsip */}
                {skCheck.status === 'valid' && skCheck.data && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs space-y-2 animate-fade-in">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        <span>SK Sah &amp; Dokumen Fisik Terverifikasi di Arsip</span>
                      </div>
                      <Badge variant="success" className="text-2xs font-mono uppercase">
                        {skCheck.data.status || 'Terpakai'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 pt-1 border-t border-emerald-100">
                      <div>
                        <span className="text-slate-400 text-2xs block">Perihal Surat:</span>
                        <span className="font-medium">{skCheck.data.perihal || '-'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-2xs block">Tanggal Penetapan Surat:</span>
                        <span className="font-medium">{skCheck.data.tanggal_surat || '-'}</span>
                      </div>
                    </div>

                    {skCheck.data.dokumen_url && (
                      <div className="pt-1 flex items-center justify-between border-t border-emerald-100 text-2xs">
                        <span className="text-emerald-700 font-medium">Dokumen fisik SK terlampir di modul Arsip</span>
                        <a
                          href={skCheck.data.dokumen_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-semibold underline"
                        >
                          <span>Lihat Berkas SK</span>
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {skCheck.status === 'invalid' && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs flex items-start gap-2 text-red-700 animate-fade-in">
                    <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-semibold block">Pemeriksaan SK Gagal:</span>
                      <p className="text-2xs text-red-600 leading-relaxed">
                        {skCheck.message || 'Nomor SK tidak ditemukan atau belum memiliki lampiran berkas fisik di modul Arsip.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Input
                  label="Catatan Tambahan (Opsional)"
                  placeholder="Catatan khusus terkait konversi nilai mahasiswa transfer ini..."
                  error={errors.catatan?.message}
                  {...register('catatan')}
                />
              </div>
            </div>

            <div className="border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  2. Daftar Mata Kuliah Penyetaraan ({fields.length} MK)
                </h3>
                <p className="text-2xs text-slate-500">Mata kuliah dari kampus asal yang disetarakan dengan kurikulum lokal.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                icon={<Plus size={16} />}
                onClick={handleAddDetail}
                className="text-xs font-bold"
              >
                Tambah Baris MK
              </Button>
            </div>

            {errors.details?.message && (
              <p className="text-xs text-rose-600 font-bold">{errors.details.message}</p>
            )}

            <div className="space-y-4">
              {fields.map((field, idx) => (
                <div key={field.id} className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                      Baris #{idx + 1}
                    </span>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 size={16} className="text-rose-500" />}
                        className="text-xs text-rose-600 hover:bg-rose-50"
                        onClick={() => remove(idx)}
                      >
                        Hapus
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4 bg-white p-4 rounded-xl border border-slate-200">
                      <span className="text-2xs font-bold text-slate-500 block uppercase">Mata Kuliah Asal</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Input
                          label="Kode MK Asal *"
                          placeholder="CS101"
                          required
                          error={errors.details?.[idx]?.kode_mk_asal?.message}
                          {...register(`details.${idx}.kode_mk_asal`)}
                        />
                        <div className="sm:col-span-2">
                          <Input
                            label="Nama MK Asal *"
                            placeholder="Dasar Pemrograman"
                            required
                            error={errors.details?.[idx]?.nama_mk_asal?.message}
                            {...register(`details.${idx}.nama_mk_asal`)}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                          label="SKS Asal *"
                          type="number"
                          min={1}
                          max={10}
                          required
                          error={errors.details?.[idx]?.sks_asal?.message}
                          {...register(`details.${idx}.sks_asal`, { valueAsNumber: true })}
                        />
                        <Input
                          label="Nilai Huruf Asal *"
                          placeholder="A / B+"
                          required
                          error={errors.details?.[idx]?.nilai_huruf_asal?.message}
                          {...register(`details.${idx}.nilai_huruf_asal`)}
                        />
                      </div>
                    </div>

                    <div className="space-y-4 bg-white p-4 rounded-xl border border-slate-200">
                      <span className="text-2xs font-bold text-slate-500 block uppercase">Disetarakan Ke MK Lokal</span>
                      <Controller
                        control={control}
                        name={`details.${idx}.mata_kuliah_diakui_id`}
                        render={({ field: selectField }) => (
                          <AsyncSelect
                            label="Pilih MK Kurikulum Lokal"
                            required
                            placeholder="Cari kode atau nama mata kuliah..."
                            loadOptions={loadMataKuliahOptions}
                            defaultOptions={defaultMkOptions.length > 0 ? defaultMkOptions : true}
                            value={selectField.value}
                            onChange={(opt: any) => selectField.onChange(opt ? Number(opt.value) : 0)}
                            error={errors.details?.[idx]?.mata_kuliah_diakui_id?.message}
                          />
                        )}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/siakad/civitas/konversi')}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="primary"
                icon={<Save size={16} />}
                onClick={handleSubmit(onSubmit)}
                loading={isSubmitting}
                disabled={isSubmitting || loadingInitial}
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan MK'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
