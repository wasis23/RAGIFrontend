'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Boxes } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { sinapraService } from '@/services/sinapra.service';
import type { AsetFormPayload, KategoriAset, Ruangan } from '@/types/sinapra.types';

export default function CreateAsetPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedKategoriObj, setSelectedKategoriObj] = useState<{ value: string; label: string } | null>(null);
  const [selectedRuanganObj, setSelectedRuanganObj] = useState<{ value: string; label: string } | null>(null);

  const [formData, setFormData] = useState<AsetFormPayload>({
    kategori_id: 0,
    ruangan_id: undefined,
    kode_aset: '',
    nama: '',
    merk: '',
    nomor_seri: '',
    tanggal_perolehan: new Date().toISOString().split('T')[0],
    harga_perolehan: 0,
    kondisi: 'baik',
    status: 'tersedia',
    spesifikasi: '',
    keterangan: '',
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

  const loadRuanganOptions = async (inputValue: string) => {
    try {
      const res: any = await sinapraService.getRuanganList({ search: inputValue });
      let list = res?.data?.items || res?.data || res || [];
      if (Array.isArray(list)) {
        return list.map((r: Ruangan) => ({ value: r.id.toString(), label: `${r.kode} - ${r.nama}` }));
      }
      return [];
    } catch {
      return [];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kategori_id || !formData.kode_aset || !formData.nama || !formData.harga_perolehan) {
      toast.error('Kategori, Kode Aset, Nama Barang, dan Harga Perolehan wajib diisi!');
      return;
    }

    setIsSubmitting(true);
    try {
      await sinapraService.createAset(formData);
      toast.success('Barang inventaris aset berhasil ditambahkan!');
      router.push('/sinapra/aset');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan barang aset baru.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Tambah Inventaris Aset Baru"
        description="Formulir pendataan barang sarana dan prasarana baru di lingkungan kampus (Modul SINAPRA)"
        action={
          <Button variant="secondary" icon={<ArrowLeft size={16} />} onClick={() => router.push('/sinapra/aset')}>
            Kembali ke Daftar
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="card">
        <div className="card-body p-6 space-y-6">
          <div className="border-b pb-4">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <Boxes className="text-rose-600" size={20} /> Informasi Detail Aset
            </h3>
            <p className="text-xs text-slate-500">Lengkapi data fisik, perolehan, dan lokasi penempatan aset.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AsyncSelect
              label="Kategori Aset"
              required
              placeholder="Cari kategori..."
              value={selectedKategoriObj}
              onChange={(sel: any) => {
                setSelectedKategoriObj(sel);
                setFormData({ ...formData, kategori_id: sel ? parseInt(sel.value) : 0 });
              }}
              loadOptions={loadKategoriOptions}
            />

            <Input
              label="Kode Aset / Tagging"
              required
              placeholder="cth: AST-2026-001"
              value={formData.kode_aset}
              onChange={(e) => setFormData({ ...formData, kode_aset: e.target.value })}
            />

            <Input
              label="Nama Barang / Aset"
              required
              placeholder="cth: Laptop Dell Latitude 5420"
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
            />

            <Input
              label="Merk / Tipe"
              placeholder="cth: Dell Latitude 5420 Intel i7"
              value={formData.merk || ''}
              onChange={(e) => setFormData({ ...formData, merk: e.target.value })}
            />

            <Input
              label="Nomor Seri (Serial Number)"
              placeholder="cth: SN-9988776655"
              value={formData.nomor_seri || ''}
              onChange={(e) => setFormData({ ...formData, nomor_seri: e.target.value })}
            />

            <Input
              label="Tanggal Perolehan / Pembelian"
              type="date"
              required
              value={formData.tanggal_perolehan}
              onChange={(e) => setFormData({ ...formData, tanggal_perolehan: e.target.value })}
            />

            <Input
              label="Harga Perolehan (Rp)"
              type="number"
              required
              min={0}
              placeholder="cth: 15000000"
              value={formData.harga_perolehan || ''}
              onChange={(e) => setFormData({ ...formData, harga_perolehan: parseFloat(e.target.value) || 0 })}
            />

            <AsyncSelect
              label="Lokasi Penempatan Ruangan"
              placeholder="Cari ruangan..."
              value={selectedRuanganObj}
              onChange={(sel: any) => {
                setSelectedRuanganObj(sel);
                setFormData({ ...formData, ruangan_id: sel ? parseInt(sel.value) : undefined });
              }}
              loadOptions={loadRuanganOptions}
            />

            <Select
              label="Kondisi Fisik"
              value={formData.kondisi || 'baik'}
              onChange={(val) => setFormData({ ...formData, kondisi: val as any })}
              options={[
                { value: 'baik', label: 'Baik' },
                { value: 'rusak_ringan', label: 'Rusak Ringan' },
                { value: 'rusak_berat', label: 'Rusak Berat' },
              ]}
            />

            <Select
              label="Status Operasional"
              value={formData.status || 'tersedia'}
              onChange={(val) => setFormData({ ...formData, status: val as any })}
              options={[
                { value: 'tersedia', label: 'Tersedia' },
                { value: 'dipinjam', label: 'Dipinjam' },
                { value: 'maintenance', label: 'Maintenance' },
                { value: 'disetujui_diapkir', label: 'Diapkir / Non-aktif' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Textarea
              label="Spesifikasi Tambahan"
              rows={3}
              placeholder="cth: RAM 16GB, SSD 512GB, Display 14 Inch FHD..."
              value={formData.spesifikasi || ''}
              onChange={(e) => setFormData({ ...formData, spesifikasi: e.target.value })}
            />

            <Textarea
              label="Catatan / Keterangan"
              rows={3}
              placeholder="Catatan sumber pengadaan, garansi, dll..."
              value={formData.keterangan || ''}
              onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 border-t pt-4">
            <Button variant="secondary" onClick={() => router.push('/sinapra/aset')}>
              Batal
            </Button>
            <Button variant="primary" type="submit" icon={<Save size={16} />} loading={isSubmitting}>
              Simpan Barang Aset
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
