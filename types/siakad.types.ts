export interface Mahasiswa {
    id: number;
    nim: string;
    nama_lengkap: string;
    program_studi_id: number;
    angkatan: number;
    status: 'aktif' | 'cuti' | 'mangkir' | 'dropout' | 'lulus';
    // ... add more properties based on backend models
}

export interface MataKuliah {
    id: number;
    kode_mk: string;
    nama: string;
    sks_teori: number;
    sks_praktik: number;
    total_sks: number;
    semester_anjuran: number;
    tipe: 'wajib' | 'pilihan' | 'wajib_prodi';
}

export interface Kelas {
    id: number;
    kode_kelas: string;
    nama_kelas: string;
    mata_kuliah_id: number;
    mata_kuliah?: MataKuliah;
    kuota_krs: number;
    hari: string;
    jam_mulai: string;
    jam_selesai: string;
}

export interface Krs {
    id: number;
    mahasiswa_id: number;
    tahun_akademik_id: number;
    total_sks_diambil: number;
    status: 'draft' | 'diajukan' | 'disetujui' | 'dikunci' | 'dibatalkan';
    locked_by_keuangan: boolean;
}
