import { redirect } from 'next/navigation';

// Halaman lama "Data Calon Mahasiswa" (/spmb/pendaftar) yang duplikat dengan
// /spmb/pendaftaran. Dialihkan agar tautan/bookmark lama tetap berfungsi.
export default function PendaftarRedirectPage() {
  redirect('/spmb/pendaftaran');
}
