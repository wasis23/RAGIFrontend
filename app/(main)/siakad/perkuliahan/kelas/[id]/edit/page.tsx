'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import KelasForm, { type KelasFormInitial } from '../../_components/KelasForm';
import { siakadService } from '@/services/siakad.service';
import toast from 'react-hot-toast';

export default function EditKelasPerkuliahanPage() {
  const params = useParams();
  const kelasId = Number(params.id);
  const [initial, setInitial] = useState<KelasFormInitial | null>(null);
  const [loading, setLoading] = useState(true);
  const [kelasNama, setKelasNama] = useState('');

  useEffect(() => {
    if (!kelasId) return;
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await siakadService.getKelasDetail(kelasId);
        const k = res.data;
        if (!k) {
          toast.error('Data kelas tidak ditemukan');
          return;
        }
        setKelasNama(k.nama_kelas || k.kode_kelas || '');
        const utama = (k.dosen_pengampu || []).find((dp: any) => dp.peran === 'pengampu_utama') || k.dosen_pengampu?.[0];
        const team = (k.dosen_pengampu || [])
          .filter((dp: any) => dp.peran !== 'pengampu_utama' && dp.dosen_id !== utama?.dosen_id)
          .map((dp: any) => dp.dosen_id);
        setInitial({
          mata_kuliah_id: k.mata_kuliah_id,
          tahun_akademik_id: k.tahun_akademik_id,
          program_studi_id: k.program_studi_id,
          ruangan_id: k.ruangan_id || 0,
          dosen_id: utama?.dosen_id || 0,
          team_teaching_dosen_ids: team,
          kode_kelas: k.kode_kelas || '',
          nama_kelas: k.nama_kelas || '',
          kapasitas: k.kapasitas || 40,
          kuota_krs: k.kuota_krs || 40,
          hari: k.hari || 'senin',
          jam_mulai: (k.jam_mulai || '08:00').substring(0, 5),
          jam_selesai: (k.jam_selesai || '10:30').substring(0, 5),
        });
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Gagal memuat detail kelas');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [kelasId]);

  return (
    <KelasForm
      mode="edit"
      kelasId={kelasId}
      initialValues={initial}
      loadingInitial={loading}
      title={`Ubah Kelas ${kelasNama}`}
      description="Perbarui nama kelas, pengampu, ruangan, jadwal, dan kuota. Mata kuliah, periode, dan kode kelas terkunci."
      breadcrumbLabel="Ubah Kelas"
      submitLabel="Simpan Perubahan Kelas"
    />
  );
}
