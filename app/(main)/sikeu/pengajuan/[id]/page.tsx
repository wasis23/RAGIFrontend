'use client';

import { formatRupiah, formatDate } from '@/lib/utils';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, XCircle, Loader2, Upload, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { pengajuanOperasionalService } from '@/services/pengajuan-operasional.service';
import { sikeuService } from '@/services/sikeu.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';

const TAHAP = [
  { key: 'pending_sarpras', label: 'Sarpras', role: 'sarpras' },
  { key: 'pending_keuangan', label: 'Keuangan', role: 'keuangan' },
  { key: 'pending_direktur', label: 'Direktur', role: 'direktur' },
  { key: 'disetujui', label: 'Disetujui' },
  { key: 'dicairkan', label: 'Dicairkan' },
  { key: 'lpj_pending', label: 'LPJ' },
  { key: 'selesai', label: 'Selesai' },
];

const STATUS_STYLE: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'secondary' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  diajukan: { label: 'Diajukan', variant: 'info' },
  pending_sarpras: { label: 'Menunggu Sarpras', variant: 'warning' },
  pending_keuangan: { label: 'Menunggu Keuangan', variant: 'warning' },
  pending_direktur: { label: 'Menunggu Direktur', variant: 'warning' },
  disetujui: { label: 'Disetujui', variant: 'success' },
  ditolak: { label: 'Ditolak', variant: 'danger' },
  dicairkan: { label: 'Dicairkan', variant: 'success' },
  lpj_pending: { label: 'LPJ Diverifikasi', variant: 'warning' },
  selesai: { label: 'Selesai', variant: 'success' },
};

export default function DetailPengajuanPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [modal, setModal] = useState<{ aksi: 'approve' | 'reject'; konteks: 'tahap' | 'lpj'; lpjId?: number } | null>(null);
  const [catatan, setCatatan] = useState('');

  // Pencairan
  const [nominalCair, setNominalCair] = useState('');
  const [tglCair, setTglCair] = useState(new Date().toISOString().split('T')[0]);
  const [buktiCair, setBuktiCair] = useState<File | null>(null);
  const [referensiEksternal, setReferensiEksternal] = useState('');
  const [sumberKasList, setSumberKasList] = useState<any[]>([]);
  const [sumberKasId, setSumberKasId] = useState('');

  // LPJ
  const [tglLpj, setTglLpj] = useState(new Date().toISOString().split('T')[0]);
  const [realisasi, setRealisasi] = useState('');
  const [rincian, setRincian] = useState('');
  const [nota, setNota] = useState<File | null>(null);
  const [metodeSisa, setMetodeSisa] = useState('belum_ditentukan');
  const [buktiKembali, setBuktiKembali] = useState<File | null>(null);
  const [rekTujuan, setRekTujuan] = useState('');
  const [tambahan, setTambahan] = useState<{ keterangan: string; qty: number; satuan: string; harga_satuan: number }[]>([]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await pengajuanOperasionalService.detail(id);
      setData(res.data);
      setNominalCair(String(res.data?.nominal_disetujui || res.data?.nominal_diajukan || ''));
      if (res.data?.unit_kas_id) setSumberKasId(String(res.data.unit_kas_id));
    } catch {
      toast.error('Gagal memuat detail pengajuan');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const fetchSumberKas = async () => {
      try {
        const res = await sikeuService.getUnitKasList();
        const list = Array.isArray(res.data) ? res.data.filter((u: any) => u.status !== false) : [];
        setSumberKasList(list);
      } catch {
        setSumberKasList([]);
      }
    };
    fetchSumberKas();
  }, []);

  const submitKeputusan = async () => {
    if (!modal) return;
    setActing(true);
    try {
      if (modal.konteks === 'tahap') {
        await pengajuanOperasionalService.approve(id, modal.aksi, catatan);
      } else if (modal.lpjId) {
        await pengajuanOperasionalService.verifikasiLpj(modal.lpjId, modal.aksi, catatan);
      }
      toast.success('Keputusan berhasil disimpan');
      setModal(null); setCatatan('');
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Gagal memproses');
    } finally {
      setActing(false);
    }
  };

  const submitPencairan = async () => {
    setActing(true);
    try {
      const form = new FormData();
      if (nominalCair) form.append('nominal_cair', nominalCair);
      form.append('tanggal_pencairan', tglCair);
      if (sumberKasId) form.append('unit_kas_id', sumberKasId);
      if (referensiEksternal.trim()) form.append('referensi_eksternal', referensiEksternal.trim());
      if (buktiCair) form.append('bukti_pencairan', buktiCair);
      await pengajuanOperasionalService.pencairan(id, form);
      toast.success('Dana dicairkan + jurnal otomatis terbit');
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Gagal mencairkan');
    } finally {
      setActing(false);
    }
  };

  const tambahanTotal = tambahan.reduce((s, t) => s + (Number(t.qty) || 0) * (Number(t.harga_satuan) || 0), 0);
  const cair = Number(data?.nominal_disetujui || 0);
  const pakai = (Number(realisasi) || 0) + tambahanTotal;
  const sisa = Math.max(0, cair - pakai);

  const submitLpj = async () => {
    setActing(true);
    try {
      const form = new FormData();
      form.append('tanggal_pelaksanaan', tglLpj);
      form.append('total_realisasi', realisasi || '0');
      form.append('rincian_keterangan', rincian);
      form.append('metode_sisa', sisa > 0 ? metodeSisa : 'belum_ditentukan');
      if (nota) form.append('file_nota_kuitansi', nota);
      if (buktiKembali) form.append('bukti_pengembalian', buktiKembali);
      if (rekTujuan) form.append('nomor_rekening_tujuan', rekTujuan);
      tambahan.forEach((t, i) => {
        form.append(`tambahan[${i}][keterangan]`, t.keterangan);
        form.append(`tambahan[${i}][qty]`, String(t.qty));
        form.append(`tambahan[${i}][satuan]`, t.satuan || 'pcs');
        form.append(`tambahan[${i}][harga_satuan]`, String(t.harga_satuan));
      });
      await pengajuanOperasionalService.simpanLpj(id, form);
      toast.success('LPJ tersimpan, menunggu verifikasi keuangan');
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Gagal menyimpan LPJ');
    } finally {
      setActing(false);
    }
  };

  if (loading) return <div className="p-8 text-sm">Memuat detail pengajuan...</div>;
  if (!data) return <div className="p-8 text-sm">Data tidak ditemukan. <Link href="/sikeu/pengajuan" className="underline">Kembali</Link></div>;

  const lpj = Array.isArray(data.lpj) ? data.lpj[0] : data.lpj;
  const bisaApproveTahap = ['pending_sarpras', 'pending_keuangan', 'pending_direktur'].includes(data.status);
  const isDitolak = data.status === 'ditolak';
  const statusStyle = STATUS_STYLE[data.status] || { label: data.status, variant: 'secondary' as const };

  const history: any[] = Array.isArray((data as any).history_approval) ? (data as any).history_approval : [];
  const tahapKeputusan = (role?: string) => {
    if (!role) return null;
    const recs = history.filter((h) => h.role_approver === role);
    if (recs.some((h) => h.status_action === 'rejected')) return 'rejected';
    if (recs.some((h) => h.status_action === 'approved')) return 'approved';
    return null;
  };
  const tahapPenolak = history.find((h) => h.status_action === 'rejected');

  return (
    <div className="space-y-6 max-w-5xl pb-16 animate-fade-in">
      <PageHeader
        title={`${data.nomor_pengajuan} — ${data.judul_pengajuan}`}
        description={`${data.kategori_pengajuan === 'pengadaan_barang' ? 'Pengadaan Barang' : 'Non-Barang'} • ${formatRupiah(Number(data.nominal_diajukan))}`}
        action={
          <Link href="/sikeu/pengajuan">
            <Button variant="outline" icon={<ArrowLeft size={16} />} className="font-bold min-h-[38px] text-xs">Kembali</Button>
          </Link>
        }
      />

      <div className="p-4 bg-white border rounded-2xl space-y-2 text-sm">
        <p><b>Alasan/Alokasi:</b> {data.deskripsi}</p>
        <p><b>Fakultas:</b> {data.fakultas?.nama || '-'} • <b>Ruang:</b> {data.ruangan?.nama || '-'}</p>
        <p><b>Dokumen:</b> <Badge variant="info">Pengajuan</Badge></p>
        <p><b>Status:</b> <Badge variant={statusStyle.variant}>{statusStyle.label}</Badge> • <b>Dicairkan:</b> {formatRupiah(Number(data.nominal_disetujui || 0))} • <b>Realisasi:</b> {formatRupiah(Number(data.total_realisasi || 0))} • <b>Sisa:</b> {formatRupiah(Number(data.sisa_nominal || 0))}</p>
        {(data as any).kanal && (
          <p>
            <b>Kanal pencairan:</b>{' '}
            <span className="badge badge-cyan text-2xs font-bold uppercase">
              {String((data as any).kanal).replace('_', ' ')}
            </span>
            {(data as any).referensi_eksternal && (
              <span className="font-mono text-xs text-slate-600"> • Ref: {(data as any).referensi_eksternal}</span>
            )}
          </p>
        )}
        <div className="flex gap-2 pt-1 flex-wrap">
          {TAHAP.map((t) => {
            const keputusan = tahapKeputusan(t.role);
            const isCurrent = data.status === t.key;
            const cls =
              keputusan === 'approved'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                : keputusan === 'rejected' || (isDitolak && isCurrent)
                  ? 'bg-rose-50 border-rose-300 text-rose-800 font-bold'
                  : isCurrent
                    ? 'bg-amber-50 border-amber-300 text-amber-800 font-bold'
                    : 'border text-slate-500';
            return (
              <span key={t.key} className={`text-2xs px-2 py-1 rounded-full border ${cls}`}>
                {t.label}
                {keputusan === 'approved' ? ' ✓' : keputusan === 'rejected' ? ' ✕' : isCurrent ? ' •' : ''}
              </span>
            );
          })}
        </div>
      </div>

      {isDitolak && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl flex gap-3 items-start">
          <XCircle size={20} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-extrabold text-rose-800">
              Pengajuan ditolak{tahapPenolak?.role_approver ? ` pada tahap ${tahapPenolak.role_approver}` : ''} — proses berhenti.
            </p>
            {(data as any).catatan_penolakan && (
              <p className="text-rose-700 mt-1">Alasan: {(data as any).catatan_penolakan}</p>
            )}
            {tahapPenolak?.catatan && <p className="text-rose-700 mt-1">Catatan penolak: {tahapPenolak.catatan}</p>}
          </div>
        </div>
      )}

      {Array.isArray(data.items) && data.items.length > 0 && (
        <div className="p-4 bg-white border rounded-2xl">
          <h3 className="text-sm font-extrabold mb-3">Rincian Barang (nama • qty • harga satuan • jumlah)</h3>
          <div className="space-y-2 text-sm">
            {data.items.map((it: any, i: number) => (
              <div key={i} className="flex justify-between border-b pb-2">
                <span>{i + 1}. {it.nama_barang} — {it.qty} {it.satuan} × {formatRupiah(Number(it.harga_satuan))}</span>
                <b>{formatRupiah(Number(it.subtotal))}</b>
              </div>
            ))}
            <div className="text-right font-extrabold">Total: {formatRupiah(Number(data.nominal_diajukan))}</div>
          </div>
        </div>
      )}

      {bisaApproveTahap && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex gap-3 flex-wrap">
          <Button variant="primary" icon={<CheckCircle2 size={16} />} onClick={() => setModal({ aksi: 'approve', konteks: 'tahap' })} className="font-bold">Setujui Tahap Ini</Button>
          <Button variant="outline" icon={<XCircle size={16} />} onClick={() => setModal({ aksi: 'reject', konteks: 'tahap' })} className="font-bold text-rose-700 border-rose-300">Tolak</Button>
          <span className="text-xs text-amber-800 self-center">Tahap berjalan: {data.status} (sarpras → keuangan → direktur; non-barang mulai dari keuangan)</span>
        </div>
      )}

      {data.status === 'disetujui' && (
        <div className="p-4 bg-white border rounded-2xl space-y-3">
          <h3 className="text-sm font-extrabold">Pencairan Manual (Keuangan)</h3>
          <p className="text-xs text-slate-600">
            Sumber dana: <b>{data.unit_kas?.nama_kas || '-'}</b>
            {(data.unit_kas as any)?.kanal && (
              <span className="badge badge-cyan text-2xs font-bold uppercase ml-1">
                {String((data.unit_kas as any).kanal).replace('_', ' ')}
              </span>
            )}
            <span className="block text-2xs text-slate-400 mt-0.5">
              Jurnal kredit mengikuti akun COA kanal tersebut — cek di Jurnal Umum setelah mencairkan.
            </span>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Nominal Cair" type="number" value={nominalCair} onChange={(e) => setNominalCair(e.target.value)} />
            <Input label="Tanggal Pencairan" type="date" value={tglCair} onChange={(e) => setTglCair(e.target.value)} />
            <Select
              label="Sumber Dana (Saldo)"
              value={sumberKasId}
              onChange={(val: any) => setSumberKasId(String(val || ''))}
              options={sumberKasList.map((u: any) => ({
                value: String(u.id),
                label: `${u.nama_kas}${u.kanal ? ` [${String(u.kanal).replace('_', ' ')}]` : ''} — ${formatRupiah(Number(u.saldo_saat_ini) || 0)}`,
              }))}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="No. Referensi Transfer (opsional)" placeholder="No. bukti / batch / M-Banking ref" value={referensiEksternal} onChange={(e) => setReferensiEksternal(e.target.value)} />
            <div>
              <label className="text-xs font-bold">Bukti Pencairan</label>
              <input type="file" onChange={(e) => setBuktiCair(e.target.files?.[0] || null)} className="mt-1 block w-full text-xs" />
            </div>
          </div>
          <Button variant="primary" icon={<Upload size={16} />} onClick={submitPencairan} disabled={acting} className="font-bold">{acting ? 'Memproses...' : 'Cairkan Dana'}</Button>
        </div>
      )}

      {(data.status === 'dicairkan' || data.status === 'lpj_pending') && (
        <div className="p-4 bg-white border rounded-2xl space-y-4">
          <h3 className="text-sm font-extrabold">Laporan Keuangan (LPJ) — wajib upload nota</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Tanggal Pelaksanaan *" type="date" value={tglLpj} onChange={(e) => setTglLpj(e.target.value)} />
            <Input label="Total Realisasi (Rp) *" type="number" value={realisasi} onChange={(e) => setRealisasi(e.target.value)} />
          </div>
          <Textarea label="Rincian Penggunaan" value={rincian} onChange={(e) => setRincian(e.target.value)} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold">File Nota/Kuitansi *</label>
              <input type="file" onChange={(e) => setNota(e.target.files?.[0] || null)} className="mt-1 block w-full text-xs" />
            </div>
            <div>
              <label className="text-xs font-bold">Metode Sisa Dana (cair {formatRupiah(cair)} • pakai {formatRupiah(pakai)} • sisa {formatRupiah(sisa)})</label>
              <select value={metodeSisa} onChange={(e) => setMetodeSisa(e.target.value)} className="mt-1 w-full border rounded-lg text-sm p-2">
                <option value="belum_ditentukan">-- Pilih jika ada sisa --</option>
                <option value="kembali_transfer">Kembalikan via transfer (upload bukti)</option>
                <option value="pakai_lagi">Gunakan untuk pembelian lain (isi tambahan)</option>
              </select>
            </div>
          </div>
          {sisa > 0 && metodeSisa === 'kembali_transfer' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-slate-50 rounded-xl">
              <div>
                <label className="text-xs font-bold">Bukti Transfer Kembali *</label>
                <input type="file" onChange={(e) => setBuktiKembali(e.target.files?.[0] || null)} className="mt-1 block w-full text-xs" />
              </div>
              <Input label="No. Rekening Tujuan Kampus" value={rekTujuan} onChange={(e) => setRekTujuan(e.target.value)} />
            </div>
          )}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-extrabold">Pembelian Lain dari Sisa (keterangan • qty • harga satuan + bukti)</h4>
              <Button type="button" variant="outline" icon={<Plus size={14} />} onClick={() => setTambahan([...tambahan, { keterangan: '', qty: 1, satuan: 'pcs', harga_satuan: 0 }])} className="text-xs">Tambah</Button>
            </div>
            {tambahan.map((t, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-5 gap-2 p-2 border rounded-xl text-xs">
                <Input label="Keterangan" value={t.keterangan} onChange={(e) => { const c = [...tambahan]; c[i].keterangan = e.target.value; setTambahan(c); }} />
                <Input label="Qty" type="number" value={String(t.qty)} onChange={(e) => { const c = [...tambahan]; c[i].qty = Number(e.target.value); setTambahan(c); }} />
                <Input label="Satuan" value={t.satuan} onChange={(e) => { const c = [...tambahan]; c[i].satuan = e.target.value; setTambahan(c); }} />
                <Input label="Harga Satuan" type="number" value={String(t.harga_satuan)} onChange={(e) => { const c = [...tambahan]; c[i].harga_satuan = Number(e.target.value); setTambahan(c); }} />
                <div className="flex items-end"><Button type="button" variant="outline" icon={<Trash2 size={14} />} onClick={() => setTambahan(tambahan.filter((_, x) => x !== i))} className="text-rose-600" /></div>
              </div>
            ))}
          </div>
          <Button variant="primary" icon={<Upload size={16} />} onClick={submitLpj} disabled={acting} className="font-bold">{acting ? 'Menyimpan...' : 'Kirim LPJ'}</Button>
        </div>
      )}

      {lpj && (
        <div className="p-4 bg-white border rounded-2xl text-sm space-y-2">
          <h3 className="font-extrabold">LPJ Terakhir: {lpj.nomor_bukti} — {lpj.status_verifikasi} ({lpj.tanggal_pelaksanaan ? formatDate(lpj.tanggal_pelaksanaan) : '-'})</h3>
          <p>Realisasi {formatRupiah(Number(lpj.total_realisasi))} • Sisa {formatRupiah(Number(lpj.sisa_nominal))} • Metode: {lpj.metode_sisa}</p>
          {lpj.status_verifikasi === 'pending' && (
            <div className="flex gap-2">
              <Button variant="primary" icon={<CheckCircle2 size={14} />} onClick={() => setModal({ aksi: 'approve', konteks: 'lpj', lpjId: lpj.id })} className="text-xs font-bold">Verifikasi & Jurnal Otomatis</Button>
              <Button variant="outline" icon={<XCircle size={14} />} onClick={() => setModal({ aksi: 'reject', konteks: 'lpj', lpjId: lpj.id })} className="text-xs font-bold text-rose-700">Tolak LPJ</Button>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={!!modal} onClose={() => setModal(null)} title={modal?.aksi === 'approve' ? 'Konfirmasi Persetujuan' : 'Konfirmasi Penolakan'}>
        <div className="space-y-4">
          <Textarea label="Catatan (opsional)" value={catatan} onChange={(e) => setCatatan(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModal(null)}>Batal</Button>
            <Button variant="primary" onClick={submitKeputusan} disabled={acting} icon={acting ? <Loader2 size={14} className="animate-spin" /> : undefined}>
              {acting ? 'Memproses...' : 'Simpan Keputusan'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
