'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { simpegService } from '@/services/simpeg.service';
import type { UnitKerja, JenisPegawai, StatusKepegawaian, StatusPegawai } from '@/types/simpeg.types';

export default function CreatePegawaiPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unitList, setUnitList] = useState<UnitKerja[]>([]);

  const [formData, setFormData] = useState({
    unit_kerja_id: '',
    nip: '',
    nik: '',
    nama_lengkap: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    jenis_kelamin: 'L' as 'L' | 'P',
    jenis_pegawai: 'dosen' as JenisPegawai,
    status_kepegawaian: 'tetap_yayasan' as StatusKepegawaian,
    status: 'aktif' as StatusPegawai,
    telepon: '',
    alamat: '',
  });

  useEffect(() => {
    const fetchUnitList = async () => {
      try {
        const res = await simpegService.getUnitKerjaList();
        setUnitList(res.data || []);
      } catch (err) {
        console.error('Gagal memuat unit kerja');
      }
    };
    fetchUnitList();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_lengkap) {
      toast.error('Nama Lengkap wajib diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        unit_kerja_id: formData.unit_kerja_id ? Number(formData.unit_kerja_id) : null,
        nip: formData.nip || null,
        nik: formData.nik || null,
        nama_lengkap: formData.nama_lengkap,
        tempat_lahir: formData.tempat_lahir || null,
        tanggal_lahir: formData.tanggal_lahir || null,
        jenis_kelamin: formData.jenis_kelamin,
        jenis_pegawai: formData.jenis_pegawai,
        status_kepegawaian: formData.status_kepegawaian,
        status: formData.status,
        telepon: formData.telepon || null,
        alamat: formData.alamat || null,
      };

      await simpegService.createPegawai(payload);
      toast.success('Data Pegawai berhasil ditambahkan!');
      router.push('/simpeg/pegawai');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan data pegawai');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="btn btn-ghost btn-sm"
          title="Kembali"
        >
          <ArrowLeft size={18} /> Kembali
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Tambah Pegawai Baru
          </h1>
          <p className="text-gray-500 mt-1">Daftarkan dosen atau tenaga kependidikan baru ke SIMPEG</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <div className="form-control">
                <label className="label font-medium">Nama Lengkap & Gelar *</label>
                <input
                  type="text"
                  className="input"
                  required
                  value={formData.nama_lengkap}
                  onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
                  placeholder="Contoh: Dr. Wasis Utama, M.Kom."
                />
              </div>

              <div className="form-control">
                <label className="label font-medium">NIP (Nomor Induk Pegawai)</label>
                <input
                  type="text"
                  className="input"
                  value={formData.nip}
                  onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                  placeholder="Contoh: 199001012022011001"
                />
              </div>

              <div className="form-control">
                <label className="label font-medium">NIK (KTP)</label>
                <input
                  type="text"
                  className="input"
                  value={formData.nik}
                  onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                  placeholder="Contoh: 327101..."
                />
              </div>

              <div className="form-control">
                <label className="label font-medium">Jenis Pegawai</label>
                <select
                  className="input"
                  value={formData.jenis_pegawai}
                  onChange={(e) => setFormData({ ...formData, jenis_pegawai: e.target.value as JenisPegawai })}
                >
                  <option value="dosen">Dosen Pengajar</option>
                  <option value="tendik">Tenaga Kependidikan</option>
                  <option value="honorer">Honorer</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label font-medium">Status Kepegawaian</label>
                <select
                  className="input"
                  value={formData.status_kepegawaian}
                  onChange={(e) => setFormData({ ...formData, status_kepegawaian: e.target.value as StatusKepegawaian })}
                >
                  <option value="tetap_yayasan">Tetap Yayasan / Kampus</option>
                  <option value="pns">PNS DPK</option>
                  <option value="non_pns">Non-PNS</option>
                  <option value="kontrak">Kontrak</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label font-medium">Status Keaktifan</label>
                <select
                  className="input"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as StatusPegawai })}
                >
                  <option value="aktif">Aktif</option>
                  <option value="cuti">Cuti</option>
                  <option value="non_aktif">Non-Aktif</option>
                  <option value="pensiun">Pensiun</option>
                </select>
              </div>

              <div className="form-control lg:col-span-3">
                <label className="label font-medium">Unit Kerja Tempat Bertugas</label>
                <select
                  className="input"
                  value={formData.unit_kerja_id}
                  onChange={(e) => setFormData({ ...formData, unit_kerja_id: e.target.value })}
                >
                  <option value="">-- Tanpa Unit / Top Level --</option>
                  {unitList.map((u) => (
                    <option key={u.id} value={u.id}>[{u.kode}] {u.nama}</option>
                  ))}
                </select>
              </div>

              <div className="form-control">
                <label className="label font-medium">Tempat Lahir</label>
                <input
                  type="text"
                  className="input"
                  value={formData.tempat_lahir}
                  onChange={(e) => setFormData({ ...formData, tempat_lahir: e.target.value })}
                  placeholder="Bandung"
                />
              </div>

              <div className="form-control">
                <label className="label font-medium">Tanggal Lahir</label>
                <input
                  type="date"
                  className="input"
                  value={formData.tanggal_lahir}
                  onChange={(e) => setFormData({ ...formData, tanggal_lahir: e.target.value })}
                />
              </div>

              <div className="form-control">
                <label className="label font-medium">Jenis Kelamin</label>
                <select
                  className="input"
                  value={formData.jenis_kelamin}
                  onChange={(e) => setFormData({ ...formData, jenis_kelamin: e.target.value as 'L' | 'P' })}
                >
                  <option value="L">Laki-Laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label font-medium">Nomor Telepon / WA</label>
                <input
                  type="text"
                  className="input"
                  value={formData.telepon}
                  onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                  placeholder="081234567890"
                />
              </div>

              <div className="form-control lg:col-span-2">
                <label className="label font-medium">Alamat Domisili Lengkap</label>
                <textarea
                  className="input"
                  rows={2}
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  placeholder="Jl. Kampus Utama No. 12, Bandung"
                />
              </div>

            </div>

            <div className="flex justify-end gap-3 mt-8 border-t pt-6">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Batal
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <><RefreshCw size={18} className="animate-spin mr-2" /> Menyimpan...</>
                ) : (
                  <><Save size={18} className="mr-2" /> Simpan Data Pegawai</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
