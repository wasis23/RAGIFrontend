---
name: crud-ui-standard
description: Standarisasi antarmuka (UI) dan arsitektur layout untuk pembuatan halaman CRUD di Frontend.
---

# Standar UI Halaman CRUD (Create, Read, Update, Delete)

Ekosistem aplikasi menetapkan aturan ketat terkait antarmuka dan *user experience* dalam pengolahan data (CRUD) untuk menjaga konsistensi di seluruh modul. Setiap agent yang ditugaskan membuat antarmuka CRUD WAJIB mematuhi aturan berikut:

## 1. Aturan Penempatan Form (Modal vs Separate Page)
Penempatan *form* untuk proses Tambah (Create) dan Ubah (Update) data ditentukan murni oleh **jumlah field input** yang diperlukan.

- **<= 5 Input (Gunakan Modal/Pop-up):**
  Jika *form* hanya memiliki 5 field input atau kurang (misal: hanya Nama, Kode, Keterangan), *form* WAJIB menggunakan Modal/Pop-up di halaman yang sama dengan tabel daftar data.
  **ATURAN GRID MODAL:** Di dalam Modal, field input WAJIB disusun menggunakan grid maksimal 2 kolom (contoh: `<div className="grid grid-cols-1 md:grid-cols-2 gap-4">`) agar form pop-up juga terlihat ringkas. Pengecualian hanya untuk elemen *full-width* jika memang mutlak diperlukan.
  
- **> 5 Input (Gunakan Halaman Terpisah):**
  Jika *form* memiliki lebih dari 5 field input, *form* **DILARANG** diletakkan di dalam Modal. Anda WAJIB membuat halaman baru yang terpisah secara spesifik untuk form tersebut (misal: `/admin/modul/create` dan `/admin/modul/[id]/edit`).

## 2. Standar Layout "Halaman Terpisah" (Separate Page)
Jika kondisi mengharuskan penggunaan Halaman Terpisah (> 5 input), tata letak halamannya wajib mengikuti spesifikasi berikut:

### A. Compact Grid Layout (Maksimal 3 Kolom)
Agar halaman form yang panjang tidak terlihat berantakan atau memakan terlalu banyak ruang putih (*whitespace*), *layout* wajib dirancang sangat *compact*:
- Gunakan arsitektur CSS Grid.
- Input diletakkan sejajar kesamping dengan proporsi responsif, **maksimal 3 kolom input berdampingan**.
- Contoh Tailwind: `<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">`
- Pengecualian: Input yang memerlukan ruang sangat lebar seperti *Textarea* panjang, Peta (Maps), atau *Rich Text Editor* boleh menempati rentang penuh (`col-span-full`).

### B. Kewajiban Tombol Kembali (Back Button)
Halaman form terpisah wajib memiliki tombol "Kembali" atau "Batal" yang diletakkan secara sangat jelas.
- Tombol ini diletakkan baik di *Header* halaman (sebelah kiri judul) atau di deretan tombol *Action* di bagian bawah form (berdampingan dengan tombol "Simpan").
- Tombol wajib menggunakan *router.push* atau *router.back* Next.js, atau Link untuk kembali ke halaman daftar data asalnya.

## Contoh Struktur Halaman Terpisah:
```tsx
import { ArrowLeft, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CreateDataPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* HEADER & BACK BUTTON */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => router.back()} 
          className="btn btn-ghost btn-sm"
        >
          <ArrowLeft size={18} /> Kembali
        </button>
        <h1 className="text-2xl font-bold">Tambah Data Lengkap</h1>
      </div>

      <div className="card">
        <div className="card-body">
          <form>
            {/* GRID LAYOUT MAKS 3 KOLOM */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Field 1 */}
              <div className="form-control">
                <label className="label">Field 1</label>
                <input type="text" className="input" />
              </div>
              {/* Field 2 */}
              <div className="form-control">
                <label className="label">Field 2</label>
                <input type="text" className="input" />
              </div>
              {/* Field 3 */}
              <div className="form-control">
                <label className="label">Field 3</label>
                <input type="text" className="input" />
              </div>
              {/* Field 4 dst... */}
              <div className="form-control">
                <label className="label">Field 4</label>
                <input type="text" className="input" />
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex justify-end gap-3 mt-8">
               <button type="button" onClick={() => router.back()} className="btn btn-ghost">Batal</button>
               <button type="submit" className="btn btn-primary"><Save size={18} className="mr-2" /> Simpan</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
```

**PATUHI ATURAN INI SECARA KETAT.** Jangan membuat form lebih dari 5 input di dalam modal, dan jangan membuat form 1 kolom menjuntai panjang ke bawah tanpa memanfaatkan grid layout.
