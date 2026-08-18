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
Halaman form terpisah wajib memiliki tombol "Kembali" yang diletakkan secara sangat jelas.
- Tombol ini **WAJIB** diletakkan di sebelah kanan Header halaman.
- Untuk penempatan di sisi kanan Header, Anda **WAJIB** menggunakan komponen `<PageHeader />` dan menyisipkan tombol tersebut ke dalam prop `action`.
- Tombol "Kembali" di Header **WAJIB** berwarna oren, contohnya menggunakan class Tailwind `bg-orange-500 text-white hover:bg-orange-600 border-none shadow-sm`.
- Selain di Header, Anda juga tetap dapat menyediakan tombol "Batal" sekunder di deretan tombol form (berdampingan dengan tombol "Simpan").

## Contoh Struktur Halaman Terpisah:
```tsx
import { ArrowLeft, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';

export default function CreateDataPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Tambah Data Lengkap" 
        action={
          <button 
            onClick={() => router.back()} 
            className="btn bg-orange-500 text-white hover:bg-orange-600 border-none shadow-sm"
          >
            <ArrowLeft size={16} className="mr-2" /> Kembali
          </button>
        }
      />

      <div className="card">
        <div className="card-body">
          <form>
            {/* GRID LAYOUT MAKS 3 KOLOM */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Field 1 */}
              <div className="form-group">
                <label className="label">Field 1</label>
                <input type="text" className="input" />
              </div>
              {/* Field 2 */}
              <div className="form-group">
                <label className="label">Field 2</label>
                <input type="text" className="input" />
              </div>
              {/* Field 3 */}
              <div className="form-group">
                <label className="label">Field 3</label>
                <input type="text" className="input" />
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
               <button type="button" onClick={() => router.back()} className="btn btn-ghost text-slate-600">Batal</button>
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

## 3. Standar Tabel Data dan Filter (Read/List)

Semua halaman yang menampilkan daftar data (tabel) WAJIB mengikuti standar ini untuk konsistensi, efisiensi, dan kemudahan pemeliharaan:

### A. Komponen DataTable
- **WAJIB** menggunakan komponen `<DataTable />` (`@/components/ui/DataTable`) untuk semua daftar data.
- **DILARANG KERAS** menggunakan tag HTML manual seperti `<table>`, `<thead>`, `<tbody>`, `<tr>`, atau `<td>` di dalam *page* utama.
- Komponen harus menerapkan *Server-Side Pagination* penuh dengan meneruskan parameter dari API (`limit`, `page`, dll) dan meneruskan objek `meta` (dari *PaginatedResponse* API) ke `<DataTable meta={meta} />`.
- Jangan menggunakan array `.filter()` atau `.map()` untuk *client-side pagination*. Tabel harus selalu bergantung pada respon pagination API.
- State perubahan halaman (termasuk *Limit/Rows per page*) harus mereset state halaman (`page`) kembali ke 1.

**Contoh Implementasi Pengolahan Data API untuk DataTable:**
```tsx
const [page, setPage] = useState(1);
const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined);

const fetchUsers = async () => {
  const res: any = await adminService.getUsers({ page, limit: filterLimit });
  let dataList = [];
  let metaData = undefined;

  // 1. Tangani jika balasan API berupa Paginator Laravel langsung
  if (res && Array.isArray(res.data) && 'current_page' in res) {
    dataList = res.data;
    metaData = {
      current_page: res.current_page,
      last_page: res.last_page,
      per_page: res.per_page,
      total: res.total,
      from: res.from,
      to: res.to
    };
  } 
  // 2. Tangani jika dibungkus format kustom { data: { items, meta } }
  else if (res && res.data && Array.isArray(res.data.items)) {
    dataList = res.data.items;
    metaData = res.data.meta;
  }

  setUsers(dataList);
  setMeta(metaData); // <- Wajib diatur agar footer pagination di tabel berfungsi!
};
```

### B. Standar Fitur Filter (Drawer)
- Apabila terdapat kebutuhan pencarian/filter lebih dari 1 kolom (misalnya selain "Search/Pencarian Global" biasa), Anda **WAJIB** membuat panel filter *Sidebar* dengan menggunakan komponen `<Drawer />` (`@/components/ui/Drawer`).
- Tombol akses filter (ikon *Filter* Lucide) diletakkan sejajar dengan tombol "Tambah Data" (di area `action` pada `<PageHeader />`).
- Opsi limitasi jumlah data (Limit) **diletakkan dan dikelola di bagian bawah `<DataTable />`**, BUKAN di dalam komponen *Drawer*. 
- Opsi untuk pengurutan data (*Order By*, *Direction*) jika ada, diletakkan di dalam *Drawer*.
