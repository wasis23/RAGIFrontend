import { z } from 'zod';

export const PklSubmissionSchema = z.object({
  tahun_akademik_id: z.number({ error: 'Tahun akademik wajib dipilih' }).int().positive({ message: 'Tahun akademik wajib dipilih' }),
  jenis: z.enum(['pkl_reguler', 'magang_industri', 'magang_mbkm', 'studi_independen'], {
    message: 'Jenis PKL / magang wajib dipilih',
  }),
  instansi_nama: z.string().min(3, { message: 'Nama instansi minimal 3 karakter' }).max(200, { message: 'Maksimal 200 karakter' }),
  instansi_alamat: z.string().min(10, { message: 'Alamat instansi minimal 10 karakter' }),
  instansi_kota: z.string().min(2, { message: 'Kota instansi wajib diisi' }),
  pembimbing_lapangan_nama: z.string().min(3, { message: 'Nama pembimbing lapangan wajib diisi' }),
  pembimbing_lapangan_kontak: z.string().min(8, { message: 'Kontak pembimbing lapangan minimal 8 digit' }),
  pembimbing_lapangan_jabatan: z.string().optional(),
  tanggal_mulai: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Format tanggal mulai YYYY-MM-DD' }),
  tanggal_selesai: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Format tanggal selesai YYYY-MM-DD' }),
}).refine((data) => new Date(data.tanggal_selesai) >= new Date(data.tanggal_mulai), {
  message: 'Tanggal selesai tidak boleh sebelum tanggal mulai',
  path: ['tanggal_selesai'],
});

export type PklSubmissionFormValues = z.infer<typeof PklSubmissionSchema>;

export const PklLogbookSchema = z.object({
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Format tanggal YYYY-MM-DD' }),
  aktivitas: z.string().min(10, { message: 'Uraian aktivitas minimal 10 karakter' }),
  target_capaian: z.string().optional(),
  kendala: z.string().optional(),
});

export type PklLogbookFormValues = z.infer<typeof PklLogbookSchema>;

export const PklPenilaianSchema = z.object({
  nilai_lapangan_total: z.number({ error: 'Nilai wajib diisi' }).min(0, { message: 'Nilai minimal 0' }).max(100, { message: 'Nilai maksimal 100' }),
  nilai_dosen_bimbingan: z.number({ error: 'Nilai wajib diisi' }).min(0, { message: 'Nilai minimal 0' }).max(100, { message: 'Nilai maksimal 100' }),
  nilai_dosen_laporan: z.number({ error: 'Nilai wajib diisi' }).min(0, { message: 'Nilai minimal 0' }).max(100, { message: 'Nilai maksimal 100' }),
  nilai_dosen_presentasi: z.number({ error: 'Nilai wajib diisi' }).min(0, { message: 'Nilai minimal 0' }).max(100, { message: 'Nilai maksimal 100' }),
  catatan_dosen: z.string().optional(),
});

export type PklPenilaianFormValues = z.infer<typeof PklPenilaianSchema>;

export const TugasAkhirProposalSchema = z.object({
  tahun_akademik_id: z.number({ error: 'Tahun akademik wajib dipilih' }).int().positive({ message: 'Tahun akademik wajib dipilih' }),
  judul_utama: z.string().min(10, { message: 'Judul proposal skripsi minimal 10 karakter' }).max(255, { message: 'Maksimal 255 karakter' }),
  judul_inggris: z.string().max(255, { message: 'Maksimal 255 karakter' }).optional(),
  bidang_kajian: z.string().min(3, { message: 'Bidang kajian wajib diisi' }),
  abstrak: z.string().min(50, { message: 'Abstrak proposal skripsi minimal 50 karakter' }),
  usulan_pembimbing_1_id: z.number({ error: 'Usulan Pembimbing 1 wajib dipilih' }).int().positive({ message: 'Usulan Pembimbing 1 wajib dipilih' }),
  usulan_pembimbing_2_id: z.number().int().positive().optional().nullable(),
});

export type TugasAkhirProposalFormValues = z.infer<typeof TugasAkhirProposalSchema>;

export const TugasAkhirBimbinganSchema = z.object({
  dosen_id: z.number({ error: 'Dosen pembimbing wajib dipilih' }).int().positive({ message: 'Dosen pembimbing wajib dipilih' }),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Format tanggal YYYY-MM-DD' }),
  bab_pembahasan: z.string().min(3, { message: 'Bab / topik pembahasan minimal 3 karakter' }),
  uraian_konsultasi: z.string().min(10, { message: 'Uraian konsultasi minimal 10 karakter' }),
  arahan_revisi: z.string().optional(),
});

export type TugasAkhirBimbinganFormValues = z.infer<typeof TugasAkhirBimbinganSchema>;

export const PenjadwalanSidangSchema = z.object({
  jenis_sidang: z.enum(['proposal', 'seminar_hasil', 'sidang_skripsi'], {
    message: 'Jenis sidang wajib dipilih',
  }),
  tanggal_sidang: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Format tanggal YYYY-MM-DD' }),
  jam_mulai: z.string().regex(/^\d{2}:\d{2}$/, { message: 'Format jam mulai HH:MM' }),
  jam_selesai: z.string().regex(/^\d{2}:\d{2}$/, { message: 'Format jam selesai HH:MM' }),
  ruangan_id: z.number().int().positive().optional().nullable(),
  ruangan_nama_manual: z.string().optional(),
  ketua_sidang_id: z.number().int().positive().optional().nullable(),
  sekretaris_sidang_id: z.number().int().positive().optional().nullable(),
  penguji_1_id: z.number({ error: 'Penguji 1 wajib dipilih' }).int().positive({ message: 'Penguji 1 wajib dipilih' }),
  penguji_2_id: z.number({ error: 'Penguji 2 wajib dipilih' }).int().positive({ message: 'Penguji 2 wajib dipilih' }),
});

export type PenjadwalanSidangFormValues = z.infer<typeof PenjadwalanSidangSchema>;

export const PenilaianSidangSchema = z.object({
  skor_metodologi: z.number({ error: 'Skor wajib diisi' }).min(0, { message: 'Skor minimal 0' }).max(100, { message: 'Skor maksimal 100' }),
  skor_materi_skripsi: z.number({ error: 'Skor wajib diisi' }).min(0, { message: 'Skor minimal 0' }).max(100, { message: 'Skor maksimal 100' }),
  skor_presentasi: z.number({ error: 'Skor wajib diisi' }).min(0, { message: 'Skor minimal 0' }).max(100, { message: 'Skor maksimal 100' }),
  skor_penguasaan_materi: z.number({ error: 'Skor wajib diisi' }).min(0, { message: 'Skor minimal 0' }).max(100, { message: 'Skor maksimal 100' }),
  catatan_revisi: z.string().optional(),
});

export type PenilaianSidangFormValues = z.infer<typeof PenilaianSidangSchema>;

export const KrsSubmitSchema = z.object({
  tahun_akademik_id: z.number({ error: 'Tahun akademik wajib dipilih' }).int().positive({ message: 'Tahun akademik wajib dipilih' }),
  catatan_mahasiswa: z.string().max(255, { message: 'Catatan maksimal 255 karakter' }).optional(),
});

export type KrsSubmitFormValues = z.infer<typeof KrsSubmitSchema>;

export const KrsApprovalSchema = z.object({
  catatan_pa: z.string().min(3, { message: 'Catatan approval minimal 3 karakter' }),
});

export type KrsApprovalFormValues = z.infer<typeof KrsApprovalSchema>;
