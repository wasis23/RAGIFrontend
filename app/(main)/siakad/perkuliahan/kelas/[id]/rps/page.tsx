'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, FileText, BookOpen, AlertCircle, Copy } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

const defaultBobot = (mingguKe: number) => (mingguKe === 8 ? 25 : mingguKe === 16 ? 30 : 3);

export default function KelasRpsPage() {
  const params = useParams();
  const router = useRouter();
  const kelasId = Number(params.id);

  const [kelas, setKelas] = useState<any | null>(null);
  const [rpsDetail, setRpsDetail] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    deskripsi_singkat: '',
    pustaka_utama: '',
    pustaka_pendukung: '',
    mingguan: [] as any[],
  });

  // Impor dari RPS MK sama periode lain
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [rpsSources, setRpsSources] = useState<any[]>([]);
  const [sourceRpsId, setSourceRpsId] = useState('');
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (!kelasId) return;
    const init = async () => {
      try {
        setLoading(true);
        const kRes = await siakadService.getKelasDetail(kelasId);
        const k = kRes.data;
        if (!k) {
          toast.error('Data kelas tidak ditemukan');
          return;
        }
        setKelas(k);
        const rRes = await siakadService.getRps({
          program_studi_id: k.program_studi_id || k.mata_kuliah?.kurikulum?.program_studi_id,
        });
        const match = (rRes.data || []).find((r: any) => r.mata_kuliah_id === k.mata_kuliah_id) || (rRes.data || [])[0];
        if (match) {
          const dRes = await siakadService.showRps(match.id);
          if (dRes.data) {
            setRpsDetail(dRes.data);
            setForm({
              deskripsi_singkat: dRes.data.deskripsi_singkat || '',
              pustaka_utama: dRes.data.pustaka_utama || '',
              pustaka_pendukung: dRes.data.pustaka_pendukung || '',
              mingguan: dRes.data.mingguan || [],
            });
          }
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Gagal memuat dokumen RPS');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [kelasId]);

  const updateMinggu = (mingguKe: number, field: string, value: any) => {
    setForm((prev) => {
      const updated = [...(prev.mingguan || [])];
      const idx = updated.findIndex((m: any) => m.minggu_ke === mingguKe);
      if (idx >= 0) {
        updated[idx] = { ...updated[idx], [field]: value };
      } else {
        updated.push({ minggu_ke: mingguKe, [field]: value });
      }
      return { ...prev, mingguan: updated };
    });
  };

  const totalBobot = useMemo(() => {
    let total = 0;
    for (let m = 1; m <= 16; m++) {
      const ex = form.mingguan?.find((x: any) => x.minggu_ke === m);
      total += Number(ex?.bobot_penilaian ?? defaultBobot(m));
    }
    return total;
  }, [form.mingguan]);
  const isBobot100 = Math.abs(totalBobot - 100) < 0.01;

  const tahunAjaran = kelas?.tahun_akademik
    ? `${kelas.tahun_akademik.tahun_mulai}/${kelas.tahun_akademik.tahun_selesai || ''}`
    : kelas?.tahun_akademik?.nama || '';

  const handleOpenImport = async () => {
    if (!kelas) return;
    try {
      const res = await siakadService.getRps({ mata_kuliah_id: kelas.mata_kuliah_id });
      const others = (res.data || []).filter((r: any) => r.id !== rpsDetail?.id);
      setRpsSources(others);
      setSourceRpsId(others[0]?.id ? String(others[0].id) : '');
      setIsImportOpen(true);
    } catch {
      toast.error('Gagal memuat daftar RPS periode lain');
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceRpsId) return;
    try {
      setImporting(true);
      const res = await siakadService.duplicateRps(Number(sourceRpsId), {
        tahun_ajaran: tahunAjaran,
        semester: kelas?.mata_kuliah?.semester_anjuran || kelas?.mata_kuliah?.semester_default || 1,
      });
      toast.success(res.message || 'RPS berhasil diimpor sebagai draft');
      setIsImportOpen(false);
      if (res.data) {
        setRpsDetail(res.data);
        setForm({
          deskripsi_singkat: res.data.deskripsi_singkat || '',
          pustaka_utama: res.data.pustaka_utama || '',
          pustaka_pendukung: res.data.pustaka_pendukung || '',
          mingguan: res.data.mingguan || [],
        });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengimpor RPS');
    } finally {
      setImporting(false);
    }
  };

  const handleSave = async () => {    if (!kelas) return;
    try {
      setSaving(true);
      await siakadService.storeRps({
        id: rpsDetail?.id,
        mata_kuliah_id: kelas.mata_kuliah_id,
        tahun_ajaran: tahunAjaran,
        semester: kelas.mata_kuliah?.semester_anjuran || kelas.mata_kuliah?.semester_default || 1,
        ...form,
      });
      toast.success('Dokumen RPS dan 16 rencana pertemuan berhasil disimpan!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan RPS');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-slate-400">
        <span className="text-xs font-bold animate-pulse">Memuat dokumen RPS...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title={`RPS: ${kelas?.mata_kuliah?.nama || ''}`}
        description={`${kelas?.mata_kuliah?.kode_mk || ''} • ${kelas?.mata_kuliah?.total_sks || 0} SKS • Kelas ${kelas?.nama_kelas || ''} • Periode ${kelas?.tahun_akademik?.nama || tahunAjaran}`}
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Jadwal Kelas', href: '/siakad/perkuliahan/kelas' },
          { label: 'RPS 16 Minggu' },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" icon={<ArrowLeft size={16} />} onClick={() => router.push('/siakad/perkuliahan/kelas')}>
              Kembali
            </Button>
            <Button variant="outline" icon={<Copy size={14} />} onClick={handleOpenImport} className="font-bold text-xs">
              Impor Periode Lain
            </Button>
            <Button variant="primary" icon={<Save size={14} />} onClick={handleSave} loading={saving} disabled={saving || !isBobot100}>
              {saving ? 'Menyimpan...' : 'Simpan RPS'}
            </Button>
          </div>
        }
      />

      <div className="flex items-center gap-2">
        <span className="badge badge-purple text-2xs font-extrabold uppercase">RPS Standar OBE (SN-DIKTI)</span>
        <Badge variant={rpsDetail?.status === 'disetujui' ? 'green' : rpsDetail?.status === 'diajukan' ? 'amber' : 'gray'}>
          Status: {String(rpsDetail?.status || 'draft').toUpperCase()}
        </Badge>
        <Badge variant={isBobot100 ? 'green' : 'amber'} className="font-mono font-bold">
          Total Bobot 16 Minggu: {totalBobot}%
        </Badge>
      </div>

      {!isBobot100 && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3 text-xs text-amber-950">
          <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <p><strong>Total bobot harus 100%</strong> (saat ini {totalBobot}%). Sesuaikan kolom Bobot % per minggu sebelum menyimpan.</p>
        </div>
      )}

      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
        <span className="text-2xs font-bold text-slate-500 uppercase block">Tim Pengembang Kurikulum</span>
        <p className="text-slate-800 mt-0.5">
          Dosen Pengembang: <strong>{rpsDetail?.dosen_pengembang?.nama_lengkap || kelas?.dosen_pengampu?.[0]?.dosen?.nama_lengkap || 'Dosen Pengampu'}</strong> • Kaprodi: <strong>{rpsDetail?.kaprodi?.nama_lengkap || '-'}</strong>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-4 space-y-2">
          <span className="font-extrabold text-slate-900 text-xs block">Deskripsi Singkat Mata Kuliah</span>
          <textarea
            rows={4}
            placeholder="Tuliskan deskripsi ringkas mengenai mata kuliah ini..."
            value={form.deskripsi_singkat}
            onChange={(e) => setForm({ ...form, deskripsi_singkat: e.target.value })}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-primary-500 font-medium"
          />
        </div>
        <div className="card p-4 space-y-2">
          <span className="font-extrabold text-slate-900 text-xs block flex items-center gap-1.5"><BookOpen size={14} className="text-primary-600" /> CPMK Mata Kuliah (read-only dari Master OBE)</span>
          <ul className="space-y-1.5 list-disc pl-4 text-slate-700 text-xs">
            {rpsDetail?.mata_kuliah?.cpmks?.length ? (
              rpsDetail.mata_kuliah.cpmks.map((c: any) => (
                <li key={c.id}><strong>{c.kode_cpmk} ({c.bobot_persentase}%):</strong> {c.deskripsi}</li>
              ))
            ) : (
              <li className="text-slate-400 list-none">Belum ada CPMK — petakan dulu di menu OBE/CPMK.</li>
            )}
          </ul>
        </div>
        <div className="card p-4 space-y-2">
          <span className="font-extrabold text-slate-900 text-xs block">Pustaka Utama</span>
          <textarea
            rows={3}
            value={form.pustaka_utama}
            onChange={(e) => setForm({ ...form, pustaka_utama: e.target.value })}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-primary-500 font-medium"
          />
        </div>
        <div className="card p-4 space-y-2">
          <span className="font-extrabold text-slate-900 text-xs block">Pustaka Pendukung</span>
          <textarea
            rows={3}
            value={form.pustaka_pendukung}
            onChange={(e) => setForm({ ...form, pustaka_pendukung: e.target.value })}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-primary-500 font-medium"
          />
        </div>
      </div>

      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5"><FileText size={14} className="text-primary-600" /> Rencana 16 Pertemuan</span>
          <span className="text-2xs text-slate-500">Pekan 8 (UTS) & 16 (UAS/Proyek)</span>
        </div>
        <div className="border border-slate-200 rounded-xl divide-y divide-slate-100">
          {Array.from({ length: 16 }, (_, i) => i + 1).map((mingguKe) => {
            const existing = form.mingguan?.find((m: any) => m.minggu_ke === mingguKe) || {};
            const isMidOrFinal = mingguKe === 8 || mingguKe === 16;
            return (
              <div key={mingguKe} className={`p-3 grid grid-cols-1 md:grid-cols-12 gap-2 items-center ${isMidOrFinal ? 'bg-primary-50/50' : ''}`}>
                <div className="md:col-span-1 text-center font-mono font-black text-xs text-primary-700">Mg {mingguKe}</div>
                <div className="md:col-span-4">
                  <Input label="Sub-CPMK" placeholder={`Sub-CPMK Minggu ${mingguKe}`} value={existing.kemampuan_akhir || ''} onChange={(e) => updateMinggu(mingguKe, 'kemampuan_akhir', e.target.value)} />
                </div>
                <div className="md:col-span-4">
                  <Input label="Bahan Kajian / Topik" placeholder={mingguKe === 8 ? 'Ujian Tengah Semester (UTS)' : mingguKe === 16 ? 'Evaluasi Akhir (UAS/Proyek)' : `Materi pekan ${mingguKe}`} value={existing.bahan_kajian || ''} onChange={(e) => updateMinggu(mingguKe, 'bahan_kajian', e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <Input label="Metode" placeholder="Kuliah & PBL" value={existing.bentuk_metode || ''} onChange={(e) => updateMinggu(mingguKe, 'bentuk_metode', e.target.value)} />
                </div>
                <div className="md:col-span-1">
                  <Input label="Bobot %" type="number" min={0} max={100} value={existing.bobot_penilaian ?? defaultBobot(mingguKe)} onChange={(e) => updateMinggu(mingguKe, 'bobot_penilaian', Number(e.target.value))} className="text-center font-mono font-bold" />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={() => router.push('/siakad/perkuliahan/kelas')}>Batal</Button>
          <Button variant="primary" icon={<Save size={14} />} onClick={handleSave} loading={saving} disabled={saving || !isBobot100}>
            {saving ? 'Menyimpan...' : 'Simpan RPS & 16 Pertemuan'}
          </Button>
        </div>
      </div>

      <Modal
        open={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Impor RPS dari Periode Lain"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsImportOpen(false)}>Batal</Button>
            <Button variant="primary" onClick={handleImport} disabled={importing || !sourceRpsId} icon={<Copy size={14} />}>
              {importing ? 'Mengimpor...' : 'Impor sebagai Draft'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleImport} className="space-y-4">
          <p className="text-xs text-slate-600">
            Salin isi RPS <strong>{kelas?.mata_kuliah?.nama}</strong> dari periode lain ke periode <strong>{kelas?.tahun_akademik?.nama || tahunAjaran}</strong> sebagai draft — tinggal ubah yang berbeda saja.
          </p>
          {rpsSources.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Tidak ada RPS MK ini di periode lain.</p>
          ) : (
            <Select
              label="Sumber RPS"
              required
              options={rpsSources.map((r: any) => ({
                value: r.id,
                label: `${r.tahun_ajaran} • Smt ${r.semester} • ${r.status || 'draft'} (${(r.mingguan_count ?? '?')} pertemuan)`,
              }))}
              value={sourceRpsId || ''}
              onChange={(v: any) => setSourceRpsId(String(v || ''))}
            />
          )}
        </form>
      </Modal>
    </div>
  );
}
