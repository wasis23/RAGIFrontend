'use client';

import { useEffect, useState } from 'react';
import { Settings2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const JENIS_LABEL: Record<string, string> = {
  pembayaran: 'Pembayaran kasir / loket',
  penerbitan: 'Penerbitan tagihan',
  koreksi: 'Koreksi / pembatalan bayar',
  pembatalan_tagihan: 'Pembatalan tagihan',
  potongan: 'Pemberian potongan',
  pembatalan_potongan: 'Pembatalan potongan',
  dispensasi_memo: 'Memo dispensasi',
  penutupan: 'Penutup periode (tutup buku)',
  pemasukan: 'Pemasukan dana',
  pengeluaran: 'Pengeluaran dana',
  manual: 'Jurnal manual',
};

export default function PengaturanAkuntansiPage() {
  const [prefixMap, setPrefixMap] = useState<Record<string, { default: string; nilai: string }>>({});
  const [prefixDraft, setPrefixDraft] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadPrefix = async () => {
    setLoading(true);
    try {
      const res = await sikeuService.getPengaturanJurnal();
      const map = res.data || {};
      setPrefixMap(map);
      setPrefixDraft(Object.fromEntries(Object.entries(map).map(([k, v]: any) => [k, v.nilai])));
    } catch {
      toast.error('Gagal memuat pengaturan kode jurnal.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrefix();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await sikeuService.updatePengaturanJurnal(prefixDraft);
      toast.success(res?.message || 'Prefix berhasil disimpan.');
      loadPrefix();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan prefix.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full space-y-6 animate-fade-in">
      <PageHeader
        title="Pengaturan Akuntansi"
        description="Kebijakan penomoran jurnal dan preferensi modul keuangan"
        breadcrumbs={[
          { label: 'Keuangan', href: '/sikeu' },
          { label: 'Akuntansi', href: '/sikeu/akuntansi' },
          { label: 'Pengaturan' },
        ]}
        action={
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={saving || loading || Object.keys(prefixDraft).length === 0}
            className="font-bold min-h-[38px] text-xs px-3.5 shadow-sm"
          >
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </Button>
        }
      />

      <Card>
        <CardBody>
          <div className="flex items-center gap-2 mb-1">
            <Settings2 size={16} className="text-primary-600" />
            <h3 className="text-sm font-extrabold text-slate-900">Kode Nomor Jurnal</h3>
          </div>
          <p className="text-2xs text-slate-500 mb-4">
            Awalan nomor jurnal per jenis transaksi (huruf/angka/strip, maks 12 karakter). Contoh: pembayaran{' '}
            <span className="font-mono font-bold">JRN-PAY</span> menghasilkan{' '}
            <span className="font-mono">JRN-PAY-20260921-XXXX</span>. Berlaku untuk jurnal baru berikutnya; jurnal lama tidak berubah.
          </p>
          {loading ? (
            <p className="text-xs text-slate-400 text-center py-6">Memuat pengaturan...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(prefixMap).map(([jenis, info]) => (
                <div key={jenis}>
                  <label className="text-2xs font-bold text-slate-600 uppercase tracking-wider block mb-1">
                    {JENIS_LABEL[jenis] || jenis.replace(/_/g, ' ')}
                  </label>
                  <input
                    value={prefixDraft[jenis] ?? ''}
                    onChange={(e) => setPrefixDraft((p) => ({ ...p, [jenis]: e.target.value.toUpperCase() }))}
                    placeholder={info.default}
                    maxLength={12}
                    className="input input-sm font-mono font-bold uppercase w-full"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5 font-mono">Bawaan: {info.default}</p>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
