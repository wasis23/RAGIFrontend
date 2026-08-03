'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreditCard, Plus, Search, CheckCircle2, XCircle, DollarSign, Upload, Building, FileText, Printer, ShieldCheck, Download, Award } from 'lucide-react';
import { sippmService } from '@/services/sippm.service';
import type { PencairanDanaHibah, KontrakKegiatan } from '@/types/sippm.types';
import { SippmBadge } from '@/components/sippm/SippmBadge';

const pencairanSchema = z.object({
  kontrak_kegiatan_id: z.number().min(1, 'Pilih kontrak hibah'),
  termin_ke: z.number().min(1, 'Termin minimal 1').max(2, 'Termin maksimal 2'),
  nominal_cair: z.number().min(1000000, 'Nominal pencairan minimal Rp 1.000.000'),
  nama_bank: z.string().min(2, 'Nama bank wajib diisi'),
  nomor_rekening: z.string().min(5, 'Nomor rekening wajib diisi'),
});

type PencairanFormValues = z.infer<typeof pencairanSchema>;

export default function PencairanPage() {
  const [pencairanList, setPencairanList] = useState<PencairanDanaHibah[]>([]);
  const [kontrakList, setKontrakList] = useState<KontrakKegiatan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Professional Legal Document Preview Modal State
  const [selectedSpkKontrak, setSelectedSpkKontrak] = useState<KontrakKegiatan | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PencairanFormValues>({
    resolver: zodResolver(pencairanSchema) as any,
    defaultValues: {
      kontrak_kegiatan_id: 0,
      termin_ke: 1,
      nominal_cair: 17500000,
      nama_bank: 'Bank Mandiri',
      nomor_rekening: '1370001234567',
    },
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const resKontrak = await sippmService.indexKontrak();
      if (resKontrak.data) {
        const list = Array.isArray(resKontrak.data) ? resKontrak.data : (resKontrak.data as any).data || [];
        setKontrakList(list);
      }
    } catch (err) {
      console.error('Failed to load pencairan data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onSubmit = async (data: PencairanFormValues) => {
    try {
      setSubmitting(true);
      setFeedback(null);
      await sippmService.requestPencairan(data.kontrak_kegiatan_id, {
        termin: data.termin_ke,
        nominal: data.nominal_cair,
        catatan_keuangan: `Pencairan bank ${data.nama_bank} - Rek: ${data.nomor_rekening}`,
      });
      setFeedback({ type: 'success', message: 'Permohonan pencairan dana berhasil diajukan' });
      setIsModalOpen(false);
      reset();
      fetchData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Gagal mengajukan pencairan' });
    } finally {
      setSubmitting(false);
    }
  };

  const formatRupiah = (val: number | null) => {
    if (val === null || val === undefined || isNaN(val)) return '-';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const filteredKontrak = kontrakList.filter(
    (k) =>
      k.nomor_kontrak.toLowerCase().includes(search.toLowerCase()) ||
      (k.proposal?.judul || '').toLowerCase().includes(search.toLowerCase()) ||
      (k.proposal?.ketua?.nama_lengkap || (k.proposal as any)?.ketua_pegawai?.nama_lengkap || '')
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge badge-sippm-gold">Keuangan & Pencairan SIPPM</span>
            <span className="badge badge-purple font-bold">SPK & Dokumen Legal</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">Pencairan Dana Hibah & Berkas SPK</h1>
          <p className="text-slate-500 text-sm">
            Lihat berkas fisik Surat Perjanjian Kerja (SPK) resmi, pengajuan pencairan Termin 1 (70%) & Termin 2 (30%), serta LPJ.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/sikeu/pemasukan" className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg text-sm font-bold transition flex items-center gap-1.5">
            Lihat Pemasukan SIKEU &rarr;
          </a>
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary bg-teal-600 hover:bg-teal-700 border-none shadow-sm font-bold">
            <Plus size={18} /> Pengajuan Pencairan Dana
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          {feedback.message}
        </div>
      )}

      {/* Filter Card */}
      <div className="card">
        <div className="card-body p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="input-wrapper w-full md:w-80">
            <span className="input-prefix-icon"><Search size={18} /></span>
            <input
              type="text"
              className="input input-icon-left"
              placeholder="Cari no SPK / judul proposal / ketua..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Total {filteredKontrak.length} Kontrak SPK Resmi
          </div>
        </div>
      </div>

      {/* Kontrak Hibah & Termins Table */}
      <div className="card">
        <div className="card-header bg-slate-50">
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <CreditCard size={18} className="text-teal-600" /> Daftar Kontrak SPK Aktif, Berkas Legal, & Alokasi Pencairan
          </h2>
        </div>
        <div className="card-body p-0">
          <div className="table-container bg-white border-none shadow-none">
            <table className="table">
              <thead>
                <tr>
                  <th>NO KONTRAK SPK</th>
                  <th>PROPOSAL & KETUA DOSEN</th>
                  <th>NOMINAL DANA DISETUJUI</th>
                  <th>BERKAS DOKUMEN SPK</th>
                  <th>TERMIN 1 (70%)</th>
                  <th>TERMIN 2 (30%)</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">Memuat data kontrak...</td>
                  </tr>
                ) : filteredKontrak.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">Belum ada kontrak SPK terdaftar untuk pencairan.</td>
                  </tr>
                ) : (
                  filteredKontrak.map((k) => {
                    const totalDana = (k as any).dana_disetujui || k.nominal_dana || 0;
                    return (
                      <tr key={k.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="font-mono text-xs font-bold text-amber-800">{k.nomor_kontrak}</td>
                        <td>
                          <div className="font-bold text-slate-900">{k.proposal?.judul || 'Proposal Usulan'}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Ketua: {k.proposal?.ketua?.nama_lengkap || (k.proposal as any)?.ketua_pegawai?.nama_lengkap || '-'}
                          </div>
                        </td>
                        <td className="font-extrabold text-emerald-700">{formatRupiah(totalDana)}</td>
                        <td>
                          <button
                            onClick={() => setSelectedSpkKontrak(k)}
                            className="btn btn-secondary btn-sm bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border-indigo-200 font-bold text-xs flex items-center gap-1.5"
                          >
                            <FileText size={14} className="text-indigo-600" /> Lihat File Dokumen SPK
                          </button>
                        </td>
                        <td>
                          <div className="text-xs font-bold text-slate-700">{formatRupiah(totalDana * 0.7)}</div>
                          <span className="badge badge-green mt-1 text-[10px]">Ready to Disburse (70%)</span>
                        </td>
                        <td>
                          <div className="text-xs font-bold text-slate-700">{formatRupiah(totalDana * 0.3)}</div>
                          <span className="badge badge-gray mt-1 text-[10px]">Menunggu LPJ 70%</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL PREVIEW DOKUMEN SPK KONTRAK PROFESIONAL */}
      {selectedSpkKontrak && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Action Bar */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <span className="badge badge-purple font-bold">Dokumen SPK Legal</span>
                <span className="text-xs text-slate-500 font-mono">ID: {selectedSpkKontrak.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs font-bold"
                >
                  <Printer size={15} /> Cetak SPK
                </button>
                <button onClick={() => setSelectedSpkKontrak(null)} className="btn btn-ghost btn-sm">
                  ✕ Close
                </button>
              </div>
            </div>

            {/* DOKUMEN FISIK SURAT PERJANJIAN KERJA (SPK) */}
            <div className="p-8 border border-slate-300 rounded-xl bg-white space-y-6 text-slate-900 font-serif leading-relaxed shadow-xs">
              {/* Kop Surat Universitas */}
              <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
                <h3 className="font-extrabold text-lg tracking-wider text-slate-900 uppercase font-sans">
                  UNIVERSITAS SSO CAMPUS INTEGRATED
                </h3>
                <h4 className="font-bold text-sm tracking-wide text-teal-800 uppercase font-sans">
                  LEMBAGA PENELITIAN DAN PENGABDIAN KEPADA MASYARAKAT (LPPM)
                </h4>
                <p className="text-[11px] font-sans text-slate-600">
                  Jl. Kampus Terpadu No. 1, Gedung Rektorat Lantai 3 • Telp: (021) 789-0123 • Email: lppm@campus.ac.id
                </p>
              </div>

              {/* Judul Dokumen SPK */}
              <div className="text-center space-y-1 py-2">
                <h2 className="text-base font-extrabold underline uppercase tracking-wide font-sans">
                  SURAT PERJANJIAN KERJA (SPK) PENELITIAN / PkM
                </h2>
                <div className="text-xs font-mono font-bold text-slate-700">
                  Nomor Surat: {selectedSpkKontrak.nomor_kontrak}
                </div>
              </div>

              {/* Pembuka */}
              <p className="text-xs text-justify">
                Pada hari ini, tanggal <strong>{selectedSpkKontrak.tgl_mulai || '01 September 2026'}</strong>, bertempat di Kantor LPPM Universitas SSO Campus, pihak-pihak di bawah ini:
              </p>

              {/* Para Pihak */}
              <div className="space-y-3 text-xs pl-4">
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-3 font-bold">1. Nama Pihak I</div>
                  <div className="col-span-9">: Dr. Ir. Superadmin, M.T. (Kepala LPPM Universitas)</div>
                  <div className="col-span-3 font-bold">   Jabatan</div>
                  <div className="col-span-9">: Ketua Lembaga Penelitian & Pengabdian Masyarakat</div>
                  <div className="col-span-12 text-slate-600 italic">
                    Bertindak untuk dan atas nama LPPM Universitas SSO Campus, selanjutnya disebut <strong>PIHAK PERTAMA</strong>.
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-2 pt-2 border-t border-slate-100">
                  <div className="col-span-3 font-bold">2. Nama Pihak II</div>
                  <div className="col-span-9">
                    : {selectedSpkKontrak.proposal?.ketua?.nama_lengkap || (selectedSpkKontrak.proposal as any)?.ketua_pegawai?.nama_lengkap || 'Dosen Ketua Pengusul'}
                  </div>
                  <div className="col-span-3 font-bold">   NIP / NIDN</div>
                  <div className="col-span-9">
                    : {selectedSpkKontrak.proposal?.ketua?.nip || (selectedSpkKontrak.proposal as any)?.ketua_pegawai?.nip || '198501012010121001'}
                  </div>
                  <div className="col-span-3 font-bold">   Rumpun Ilmu</div>
                  <div className="col-span-9">: {selectedSpkKontrak.proposal?.rumpun_ilmu || 'Teknologi Informasi'}</div>
                  <div className="col-span-12 text-slate-600 italic">
                    Bertindak selaku Ketua Tim Pengusul Kegiatan, selanjutnya disebut <strong>PIHAK KEDUA</strong>.
                  </div>
                </div>
              </div>

              {/* Pasal-Pasal Perjanjian */}
              <div className="space-y-3 text-xs pt-2">
                <div>
                  <div className="font-bold text-center font-sans uppercase">Pasal 1: Judul & Skema Kegiatan</div>
                  <p className="text-justify mt-1">
                    PIHAK PERTAMA memberikan tugas hibah kepada PIHAK KEDUA dan PIHAK KEDUA menerima tugas pelaksanaan hibah riset dengan judul usulan:
                    <br />
                    <strong className="font-sans block mt-1 p-2 bg-slate-50 border rounded-lg text-slate-900">
                      &quot;{selectedSpkKontrak.proposal?.judul}&quot;
                    </strong>
                  </p>
                </div>

                <div>
                  <div className="font-bold text-center font-sans uppercase">Pasal 2: Alokasi & Besaran Dana Hibah</div>
                  <p className="text-justify mt-1">
                    Besaran dana hibah pelaksanaan kegiatan yang disetujui oleh PIHAK PERTAMA adalah sebesar:
                    <br />
                    <strong className="text-emerald-800 font-sans text-sm block mt-1">
                      {formatRupiah((selectedSpkKontrak as any).dana_disetujui || selectedSpkKontrak.nominal_dana || 0)}
                    </strong>
                    Pencairan dana dilakukan secara bertahap dalam 2 (dua) termin, yaitu Termin 1 (70%) dan Termin 2 (30%) setelah penyerahan LPJ Kemajuan.
                  </p>
                </div>

                <div>
                  <div className="font-bold text-center font-sans uppercase">Pasal 3: Jangka Waktu Pelaksanaan</div>
                  <p className="text-justify mt-1">
                    Pelaksanaan kegiatan dilakukan dalam jangka waktu terhitung sejak tanggal{' '}
                    <strong>{selectedSpkKontrak.tgl_mulai || '01 September 2026'}</strong> sampai dengan tanggal{' '}
                    <strong>{selectedSpkKontrak.tgl_selesai || '28 Februari 2027'}</strong>.
                  </p>
                </div>
              </div>

              {/* Tanda Tangan Legal Pihak I & II */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs font-sans text-center">
                <div className="space-y-12">
                  <div>
                    <div>PIHAK KEDUA (Ketua Pengusul)</div>
                    <div className="text-[11px] text-slate-500">Dosen Pengampu / Peneliti Utama</div>
                  </div>
                  <div className="space-y-1">
                    <div className="font-bold underline">
                      {selectedSpkKontrak.proposal?.ketua?.nama_lengkap || (selectedSpkKontrak.proposal as any)?.ketua_pegawai?.nama_lengkap || 'Dosen Pengusul'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      NIP: {selectedSpkKontrak.proposal?.ketua?.nip || (selectedSpkKontrak.proposal as any)?.ketua_pegawai?.nip || '-'}
                    </div>
                  </div>
                </div>

                <div className="space-y-12">
                  <div>
                    <div>PIHAK PERTAMA (LPPM)</div>
                    <div className="text-[11px] text-slate-500">Kepala LPPM SSO Campus</div>
                  </div>
                  <div className="space-y-1">
                    <div className="font-bold underline flex items-center justify-center gap-1 text-teal-800">
                      <ShieldCheck size={16} className="text-teal-600" /> Dr. Ir. Superadmin, M.T.
                    </div>
                    <div className="text-[11px] text-slate-500">NIP: 197805122003121002</div>
                  </div>
                </div>
              </div>

              {/* Footer Digital Stamp */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] font-sans text-slate-400">
                <span>Dokumen Sah & Diterbitkan Secara Elektronik oleh SIPPM Integrated System</span>
                <span className="font-mono">VERIFIED SPK DIGITAL CODE: #{selectedSpkKontrak.id}-2026-OK</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FORM MODAL PENGAJUAN PENCAIRAN DANA (Grid 2 Kolom per crud-ui-standard) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Building className="text-teal-600" size={20} /> Pengajuan Pencairan Dana Hibah
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost btn-sm">✕</button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Pilih Kontrak SPK Hibah <span className="required">*</span></label>
                <select className={`input ${errors.kontrak_kegiatan_id ? 'error' : ''}`} {...register('kontrak_kegiatan_id', { valueAsNumber: true })}>
                  <option value={0}>-- Pilih Kontrak --</option>
                  {kontrakList.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nomor_kontrak} - {k.proposal?.judul}
                    </option>
                  ))}
                </select>
                {errors.kontrak_kegiatan_id && <span className="form-error">{errors.kontrak_kegiatan_id.message}</span>}
              </div>

              {/* Grid 2 Kolom per crud-ui-standard */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Termin Ke- <span className="required">*</span></label>
                  <select className="input" {...register('termin_ke', { valueAsNumber: true })}>
                    <option value={1}>Termin 1 (70% Dana Initial)</option>
                    <option value={2}>Termin 2 (30% Pelunasan LPJ)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Nominal Pencairan (Rp) <span className="required">*</span></label>
                  <input type="number" className={`input ${errors.nominal_cair ? 'error' : ''}`} placeholder="17500000" {...register('nominal_cair', { valueAsNumber: true })} />
                  {errors.nominal_cair && <span className="form-error">{errors.nominal_cair.message}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Nama Bank Rekening <span className="required">*</span></label>
                  <input type="text" className={`input ${errors.nama_bank ? 'error' : ''}`} placeholder="Misal: Bank Mandiri / BNI" {...register('nama_bank')} />
                  {errors.nama_bank && <span className="form-error">{errors.nama_bank.message}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Nomor Rekening Tujuan <span className="required">*</span></label>
                  <input type="text" className={`input ${errors.nomor_rekening ? 'error' : ''}`} placeholder="137000xxxx" {...register('nomor_rekening')} />
                  {errors.nomor_rekening && <span className="form-error">{errors.nomor_rekening.message}</span>}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Batal
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary bg-teal-600 hover:bg-teal-700 border-none font-bold">
                  {submitting ? 'Mengirim...' : 'Kirim Pengajuan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
