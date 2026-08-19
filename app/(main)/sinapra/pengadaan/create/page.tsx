'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, Trash2, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { formatCurrency } from '@/lib/utils';
import { sinapraService } from '@/services/sinapra.service';
import type {
  PengajuanPengadaanFormPayload,
  DetailPengadaanItemPayload,
  KategoriAset
} from '@/types/sinapra.types';

export default function CreatePengadaanPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<PengajuanPengadaanFormPayload>({
    unit_kerja_id: null,
    judul: '',
    alasan_kebutuhan: '',
    details: [
      {
        kategori_aset_id: null,
        nama_barang: '',
        spesifikasi: '',
        jumlah: 1,
        satuan: 'unit',
        harga_satuan_estimasi: 0,
      },
    ],
  });

  const loadKategoriOptions = async (inputValue: string) => {
    try {
      const res: any = await sinapraService.getKategoriList({ search: inputValue });
      let list = res?.data?.items || res?.data || res || [];
      if (Array.isArray(list)) {
        return list.map((k: KategoriAset) => ({ value: k.id.toString(), label: `${k.kode} - ${k.nama}` }));
      }
      return [];
    } catch {
      return [];
    }
  };

  // ------------------------------------------------------------
  // REPEATER HANDLERS
  // ------------------------------------------------------------
  const handleAddItemRow = () => {
    setFormData({
      ...formData,
      details: [
        ...formData.details,
        {
          kategori_aset_id: null,
          nama_barang: '',
          spesifikasi: '',
          jumlah: 1,
          satuan: 'unit',
          harga_satuan_estimasi: 0,
        },
      ],
    });
  };

  const handleRemoveItemRow = (index: number) => {
    if (formData.details.length <= 1) {
      toast.error('Usulan pengadaan minimal harus memiliki 1 item barang!');
      return;
    }
    const updated = [...formData.details];
    updated.splice(index, 1);
    setFormData({ ...formData, details: updated });
  };

  const handleItemChange = (index: number, field: keyof DetailPengadaanItemPayload, value: any) => {
    const updated = [...formData.details];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, details: updated });
  };

  // Calculate Total Sum
  const totalEstimasiAnggaran = formData.details.reduce((sum, item) => {
    const subtotal = (item.jumlah || 0) * (item.harga_satuan_estimasi || 0);
    return sum + subtotal;
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.judul || !formData.alasan_kebutuhan) {
      toast.error('Judul Usulan dan Alasan Kebutuhan wajib diisi!');
      return;
    }

    // Check items valid
    for (let i = 0; i < formData.details.length; i++) {
      const item = formData.details[i];
      if (!item.nama_barang || !item.jumlah || !item.harga_satuan_estimasi) {
        toast.error(`Baris item #${i + 1}: Nama barang, jumlah, dan harga satuan wajib diisi!`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await sinapraService.createPengadaan(formData);
      toast.success('Usulan pengadaan barang berhasil dikirim!');
      router.push('/sinapra/pengadaan');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengajukan usulan pengadaan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Form Pengajuan Usulan Pengadaan Barang"
        description="Pengajuan multi-item pengadaan barang sarana & prasarana baru per unit kerja (Modul SINAPRA)"
        action={
          <Button variant="secondary" icon={<ArrowLeft size={16} />} onClick={() => router.push('/sinapra/pengadaan')}>
            Kembali ke Daftar
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* HEADER INFORMATION CARD */}
        <div className="card">
          <div className="card-body p-6 space-y-4">
            <div className="border-b pb-3">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <ShoppingBag className="text-rose-600" size={20} /> Informasi Utama Pengadaan
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Judul Usulan Pengadaan"
                required
                placeholder="cth: Pengadaan Perangkat Komputer Lab Informatika T.A 2026"
                value={formData.judul}
                onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
              />

              <Textarea
                label="Alasan Kebutuhan Pengadaan"
                required
                rows={2}
                placeholder="Jelaskan mendesaknya kebutuhan pengadaan barang ini..."
                value={formData.alasan_kebutuhan}
                onChange={(e) => setFormData({ ...formData, alasan_kebutuhan: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* DYNAMIC ITEM REPEATER CARD */}
        <div className="card">
          <div className="card-body p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Rincian Barang yang Diajukan</h3>
                <p className="text-xs text-slate-500">Tambahkan daftar barang, spesifikasi, serta estimasi harga satuan.</p>
              </div>
              <Button type="button" variant="secondary" size="sm" icon={<Plus size={14} />} onClick={handleAddItemRow}>
                Tambah Baris Barang
              </Button>
            </div>

            <div className="space-y-4">
              {formData.details.map((item, idx) => {
                const subtotal = (item.jumlah || 0) * (item.harga_satuan_estimasi || 0);
                return (
                  <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 relative">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-bold text-rose-600 text-xs">Item Barang #{idx + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 size={14} color="var(--danger)" />}
                        onClick={() => handleRemoveItemRow(idx)}
                      >
                        Hapus Baris
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Input
                        label="Nama Barang"
                        required
                        placeholder="cth: Proyektor Epson EB-E500"
                        value={item.nama_barang}
                        onChange={(e) => handleItemChange(idx, 'nama_barang', e.target.value)}
                      />

                      <Input
                        label="Spesifikasi Ringkas"
                        placeholder="cth: 3300 Lumens, HDMI, XGA"
                        value={item.spesifikasi || ''}
                        onChange={(e) => handleItemChange(idx, 'spesifikasi', e.target.value)}
                      />

                      <AsyncSelect
                        label="Kategori Aset (Opsional)"
                        placeholder="Pilih kategori..."
                        value={item.kategori_aset_id ? { value: item.kategori_aset_id.toString(), label: `Kategori ID: ${item.kategori_aset_id}` } : null}
                        onChange={(sel: any) => handleItemChange(idx, 'kategori_aset_id', sel ? parseInt(sel.value) : null)}
                        loadOptions={loadKategoriOptions}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Input
                        label="Jumlah (Qty)"
                        type="number"
                        min={1}
                        required
                        value={item.jumlah}
                        onChange={(e) => handleItemChange(idx, 'jumlah', parseInt(e.target.value) || 1)}
                      />

                      <Input
                        label="Satuan Barang"
                        required
                        placeholder="cth: Unit / Buah / Paket"
                        value={item.satuan}
                        onChange={(e) => handleItemChange(idx, 'satuan', e.target.value)}
                      />

                      <Input
                        label="Harga Satuan Estimasi (Rp)"
                        type="number"
                        min={0}
                        required
                        placeholder="cth: 6500000"
                        value={item.harga_satuan_estimasi || ''}
                        onChange={(e) => handleItemChange(idx, 'harga_satuan_estimasi', parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="flex justify-end text-xs font-bold text-slate-700 pt-1">
                      Subtotal Item #{idx + 1}: <span className="font-extrabold text-slate-900 ml-2">{formatCurrency(subtotal)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* TOTAL ANGGARAN SUMMARY */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-rose-50 border border-rose-200 p-4 rounded-xl">
              <div className="text-sm font-bold text-rose-900">
                TOTAL ESTIMASI KESELURUHAN ANGGARAN
              </div>
              <div className="text-2xl font-extrabold text-rose-700">
                {formatCurrency(totalEstimasiAnggaran)}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="secondary" onClick={() => router.push('/sinapra/pengadaan')}>
                Batal
              </Button>
              <Button variant="primary" type="submit" icon={<Save size={16} />} loading={isSubmitting}>
                Kirim Usulan Pengadaan
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
