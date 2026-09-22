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
- Tombol "Kembali" di Header **WAJIB** menggunakan warna dinamis modul (`var(--module-primary)`) atau komponen baku `<Button variant="outline">` dengan ikon `ArrowLeft` size 16. **DILARANG KERAS** menggunakan warna statis atau hardcode (seperti `bg-orange-500` atau `bg-blue-600`).
- Selain di Header, Anda juga tetap dapat menyediakan tombol "Batal" sekunder di deretan tombol form (berdampingan dengan tombol "Simpan").

## Contoh Struktur Halaman Terpisah:
```tsx
import { ArrowLeft, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, Input } from '@/components/ui';

export default function CreateDataPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Tambah Data Lengkap" 
        action={
          <Button 
            variant="outline"
            onClick={() => router.back()} 
            style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
          >
            <ArrowLeft size={16} className="mr-2" /> Kembali
          </Button>
        }
      />

      <div className="card">
        <div className="card-body">
          <form>
            {/* GRID LAYOUT MAKS 3 KOLOM */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Field 1 */}
              <Input label="Field 1" name="field_1" />
              {/* Field 2 */}
              <Input label="Field 2" name="field_2" />
              {/* Field 3 */}
              <Input label="Field 3" name="field_3" />
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
               <Button type="button" variant="secondary" onClick={() => router.back()}>Batal</Button>
               <Button type="submit"><Save size={16} className="mr-2" /> Simpan</Button>
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

### A. Komponen DataTable & Standar Warna Background Tabel (Wajib Putih Solid)
- **WAJIB** menggunakan komponen `<DataTable />` (`@/components/ui/DataTable`) untuk semua daftar data.
- **WAJIB WARNA PUTIH SOLID (DILARANG ABU-ABU):** Background tabel, container pembungkus tabel, dan seluruh baris data WAJIB berlatar belakang putih bersih (`bg-white` / `#ffffff`). DILARANG membuat background tabel berwarna abu-abu (seperti `bg-slate-50`, `bg-slate-100`, `bg-gray-100`, dsb.) atau membiarkan tabel transparan memperlihatkan latar abu-abu body. Efek abu-abu hanya diizinkan untuk hover baris data (`hover:bg-slate-50`).
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
- Tombol akses filter (ikon *Filter* Lucide) diletakkan sejajar dengan tombol "Tambah Data" (di area `action` pada `<PageHeader />`), **dengan posisi tombol Filter WAJIB di sebelah KIRI tombol Tambah Data (`[Filter] [Tambah Data]`)**.
- Opsi limitasi jumlah data (Limit) **diletakkan dan dikelola di bagian bawah `<DataTable />`**, BUKAN di dalam komponen *Drawer*. 
- Opsi untuk pengurutan data (*Order By*, *Direction*) jika ada, diletakkan di dalam *Drawer*.

### C. Standar Navigasi Tab Halaman (Divided Bottom Border Navigation)
- Jika halaman memiliki beberapa sub-kategori/sub-tabel yang dipisahkan oleh tab, navigasi tab **WAJIB** menggunakan format bar horizontal dengan pembatas border bawah (`flex border-b border-slate-200 gap-1 sm:gap-2 overflow-x-auto pb-0.5`) seperti standar SIMPEG Presensi (`/simpeg/presensi`).
- **DILARANG KERAS** menggunakan gaya tab oval/pills yang dibungkus dalam wadah abu-abu cembung/terisolasi (`bg-slate-50 border rounded-2xl`).
- Indikator aktif ditandai dengan `border-b-2 border-primary-600 text-primary-700 bg-primary-50/60 font-bold rounded-t-xl`.

### D. Tema & Posisi Tombol Pengaturan / Toggle Status Global (Wajib Selaras Tema Filter & di Sebelah Kiri Filter)
- Apabila terdapat tombol switcher skema, toggle status modul, atau konfigurasi global (contoh: `Skema UKT: ON/OFF`), tombol tersebut **WAJIB** dinaikkan ke level halaman utama pada prop `action` komponen `<PageHeader />`.
- **Wajib Tema Outline Serasi**: Tombol pengaturan/toggle global WAJIB menggunakan style outline yang selaras dan serasi dengan tombol Filter (`<Button variant="outline">` ukuran compact `min-h-[38px] text-xs font-bold`). DILARANG menggunakan tombol solid blok warna mencolok yang bertabrakan dengan tombol outline filter.
- Posisi tombol pengaturan/toggle global ini **WAJIB** berada di sebelah **KIRI** tombol Filter:
  `[Tombol Toggle / Pengaturan Global] -> [Tombol Filter] -> [Tombol Tambah Data]`
- DILARANG meletakkan tombol toggle konfigurasi global di dalam card tabel atau di Table Action Bar bawah.

### E. Dilarang Card Judul/Counter Mengambang di Atas Tabel (No Floating Title/Counter Card)
- **DILARANG KERAS** membuat card kontainer mengambang di atas tabel (`DataTable`) yang hanya berisi judul tabel dan badge counter jumlah data (seperti `Daftar Nominal Tarif Angkatan [5 Data]`).
- Seluruh tombol aksi utama (Filter & Tambah Data) **WAJIB** berada di `PageHeader action`.
- Total data sudah otomatis dihitung dan ditampilkan secara terintegrasi pada footer pagination `<DataTable />`.
- Menaruh card pembungkus judul/counter di atas tabel hanya membuang ruang layar vertikal (*wastes vertical space*) dan merusak kerapian antarmuka.


