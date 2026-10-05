'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CalendarCheck, Info, Clock, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { sinapraService } from '@/services/sinapra.service';
import type { ApplyPeminjamanRuanganPayload, Ruangan } from '@/types/sinapra.types';

export default function PermohonanPinjamRuanganPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRuanganObj, setSelectedRuanganObj] = useState<{ value: string; label: string } | null>(null);

  const [form, setForm] = useState<ApplyPeminjamanRuanganPayload>({
    ruangan_id: 0,
    tanggal: new Date().toISOString().split('T')[0],
    jam_mulai: '08:00',
    jam_selesai: '12:00',
    keperluan: '',
  });

  const loadRuanganOptions = async (inputValue: string) => {
    try {
      const res: any = await sinapraService.getRuanganList({ search: inputValue });
      const list = res?.data?.items || res?.data || res || [];
      if (Array.isArray(list)) {
        return list.map((r: Ruangan) => ({
          value: r.id.toString(),
          label: `${r.kode} - ${r.nama} (${r.gedung?.nama || 'Kampus'} • Kapasitas: ${r.kapasitas} org)`,
        }));
      }
      return [];
    } catch {
      return [];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.ruangan_id) {
      toast.error('Silakan pilih ruangan yang ingin dipinjam.');
      return;
    }

    if (!form.tanggal) {
      toast.error('Tanggal pemakaian wajib diisi.');
      return;
    }

    if (!form.jam_mulai || !form.jam_selesai) {
      toast.error('Jam mulai dan jam selesai wajib diisi.');
      return;
    }

    if (form.jam_mulai >= form.jam_selesai) {
      toast.error('Jam selesai harus lebih akhir daripada jam mulai.');
      return;
    }

    if (!form.keperluan.trim()) {
      toast.error('Keperluan atau rincian kegiatan wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      await sinapraService.applyPeminjamanRuangan(form);
      toast.success('Permohonan peminjaman ruangan berhasil diajukan!');
      router.push('/sinapra/peminjaman');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengajukan permohonan peminjaman ruangan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Permohonan Pinjam Ruangan"
        description="Formulir pengajuan pemakaian ruangan kelas, aula, atau laboratorium untuk kegiatan akademik dan kemahasiswaan (Modul SINAPRA)"
        action={
          <Button
            variant="outline"
            onClick={() => router.push('/sinapra/peminjaman')}
            style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
            icon={<ArrowLeft size={16} />}
          >
            Kembali
          </Button>
        }
      />

      {/* Info Banner Alur & Pencegahan Bentrok */}
      <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/70 dark:bg-blue-950/20 flex items-start gap-3 text-xs text-blue-900 dark:text-blue-200">
        <Info size={18} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold block">Pencegahan Bentrok & Alur Persetujuan Bertingkat:</span>
          <p className="text-blue-700 dark:text-blue-300 leading-relaxed text-2xs md:text-xs">
            Sistem secara otomatis akan memeriksa jadwal perkuliahan aktif dari modul <strong>SIAKAD</strong> dan agenda peminjaman lain. Apabila ruangan yang Anda pilih bertipe <strong>Laboratorium</strong>, pengajuan akan diverifikasi terlebih dahulu oleh <strong>Laboran Pengampu Prodi</strong> sebelum disahkan oleh Admin Sarpras.
          </p>
        </div>
      </div>

      {/* Form Card Container */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-4 md:p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-full">
              <AsyncSelect
                label="Pilih Ruangan Kampus *"
                required
                placeholder="Ketik kode atau nama ruangan / laboratorium..."
                value={selectedRuanganObj}
                onChange={(sel: any) => {
                  setSelectedRuanganObj(sel);
                  setForm({ ...form, ruangan_id: sel ? parseInt(sel.value) : 0 });
                }}
                loadOptions={loadRuanganOptions}
                hint="Cari berdasarkan nama ruangan, kode ruangan, atau gedung lokasi."
              />
            </div>

            <div>
              <Input
                label="Tanggal Pemakaian *"
                type="date"
                required
                value={form.tanggal}
                onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                hint="Pilih tanggal pelaksanaan kegiatan."
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Jam Mulai *"
                type="time"
                required
                value={form.jam_mulai}
                onChange={(e) => setForm({ ...form, jam_mulai: e.target.value })}
              />
              <Input
                label="Jam Selesai *"
                type="time"
                required
                value={form.jam_selesai}
                onChange={(e) => setForm({ ...form, jam_selesai: e.target.value })}
              />
            </div>

            <div className="col-span-full">
              <Textarea
                label="Keperluan / Rincian Acara *"
                required
                rows={4}
                placeholder="Jelaskan tujuan pemakaian ruangan, estimasi peserta, penanggung jawab kegiatan..."
                value={form.keperluan}
                onChange={(e) => setForm({ ...form, keperluan: e.target.value })}
                hint="Tuliskan nama acara dan estimasi jumlah peserta untuk mempermudah verifikasi petugas."
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/sinapra/peminjaman')}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              icon={<CalendarCheck size={16} />}
            >
              Kirim Permohonan Pinjam
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
