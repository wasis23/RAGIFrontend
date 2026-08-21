---
name: admin-crud-reviewer-standard
description: Standar Baku Reviewer & Auditor Halaman Admin CRUD (Mobile-First, Detail Halaman Terpisah, Form Compact, Atomic Design, DataTable, Pagination, Sort By & Direction, Filter Drawer Kanan-ke-Kiri).
---

# Admin CRUD & Table Reviewer Standard

Dokumen ini merupakan **Standar Penilaian (Reviewer Policy)** untuk pembuatan dan modifikasi halaman Admin CRUD (Create, Read, Update, Delete) di seluruh ekosistem aplikasi. Setiap halaman Admin yang menampilkan atau mengelola data **WAJIB** mematuhi Aturan Utama dan Aturan Konsistensi UI berikut:

---

## 1. Aturan Mobile-First Responsive Styling
- Seluruh tata letak, komponen, dan halaman **WAJIB** mengadopsi pendekatan **Mobile-First Design**.
- Pengaturan kelas CSS bawaan ditujukan untuk layar *mobile* (HP) terlebih dahulu (misal: `w-full flex-col grid-cols-1 gap-4`).
- Penyesuaian ke layar yang lebih lebar (tablet/desktop) menggunakan breakpoint terstruktur:
  - `sm:` (min-width: 640px)
  - `md:` (min-width: 768px)
  - `lg:` (min-width: 1024px)
- Seluruh tabel, tombol aksi, dan form harus tetap nyaman dan mudah ditekan pada perangkat seluler.

---

## 2. Aturan Halaman Detail Wajib Terpisah
- Tampilan **Detail Data** (melihat rincian entitas secara mendalam) **WAJIB** dibuat di **Halaman Terpisah** (misalnya di route `/[id]` atau `/detail/[id]`).
- **DILARANG KERAS** menyisipkan detail data yang kompleks ke dalam pop-up modal kecil atau tooltip.
- Halaman Detail Terpisah wajib dilengkapi **Tombol Kembali Berwarna Oranye** (`bg-orange-500 text-white hover:bg-orange-600 border-none shadow-sm`) di prop `action` komponen `<PageHeader />`.

---

## 3. Aturan Desain Form Compact & Elegan
- Layout form untuk *Create*, *Update*, maupun input data lainnya harus dirancang **sangat compact, rapi, dan tidak berlebihan** (*no excessive whitespace/margin*).
- Gunakan arsitektur **CSS Grid Responsif**:
  - Layar Mobile: 1 Kolom (`grid-cols-1`)
  - Layar Medium/Desktop: Maksimal 2 atau 3 Kolom (`md:grid-cols-2 lg:grid-cols-3 gap-4`)
- Jarak antar elemen input dijaga agar pas (`gap-4`), tidak terlalu renggang dan tidak terlalu sesak.
- Gunakan selalu prop `label` bawaan komponen UI Kit (`<Input label="...">`, `<Select label="...">`).

---

## 4. Aturan Arsitektur Atomic Design
Semua komponen antarmuka wajib dibangun mengikuti prinsip **Atomic Design**:
- **Atoms & Molecules (`components/ui/`)**: Elemen dasar dan komponen interaktif individual wajib diambil dari UI Kit terpusat:
  - `<Button>` (`components/ui/Button.tsx`)
  - `<Input>` (`components/ui/Input.tsx`)
  - `<Select>` & `<AsyncSelect>` (`components/ui/Select.tsx`, `components/ui/AsyncSelect.tsx`)
  - `<Modal>` (`components/ui/Modal.tsx`)
  - `<Drawer>` (`components/ui/Drawer.tsx`)
  - `<DataTable>` (`components/ui/DataTable.tsx`)
  - `<Badge>` / `<StatusBadge>` (`components/ui/Badge.tsx`)
- **Organisms & Templates (`components/layout/`)**: Komponen struktur halaman seperti `<PageHeader>` dan `<Sidebar>`.
- **Pages (`app/(main)/...`)**: File halaman utama bertugas merangkai (*assemble*) komponen atomik tanpa menulis elemen HTML mentah yang tidak terstandarisasi.

---

## 5. Aturan Wajib DataTable & Server-Side Pagination
Setiap halaman list/tabel data **WAJIB**:
- Menggunakan komponen **`<DataTable />`** (`@/components/ui/DataTable`).
- **DILARANG KERAS** menggunakan tag HTML mentah seperti `<table>`, `<thead>`, `<tbody>`, `<tr>`, atau `<td>` langsung di file halaman.
- Data **WAJIB** diambil dari API backend dengan mendukung **Limit** dan **Server-Side Pagination** (`page`, `limit`).
- Meneruskan metadata pagination API ke prop `meta` DataTable:
  ```tsx
  <DataTable
    columns={columns}
    data={items}
    isLoading={isLoading}
    meta={meta}
    onPageChange={(newPage) => setPage(newPage)}
  />
  ```

---

## 6. Aturan Filter Sort By & Sort Direction (Default Name/Label)
Setiap halaman list/tabel **WAJIB** memiliki opsi pengurutan data (*Sorting*):
- Pilihan **Urut Berdasarkan** (`sort_by` / `orderBy`) mencakup kolom-kolom penting pada tabel (contoh: `name`, `label`, `id`, `created_at`).
- Nilai **Default Sort** adalah berbasis `name` atau `label` (atau `id` / `created_at` yang relevan).
- Pilihan **Arah** (`sort_dir` / `orderDir`) mendukung `asc` (A - Z / Naik) dan `desc` (Z - A / Turun).
- Layout pilihan sorting di dalam Drawer menggunakan **Grid 2 Kolom**:
  ```tsx
  <hr className="border-t border-slate-200 my-2" />

  <div className="grid grid-cols-2 gap-4">
    <Select 
      label="Urut Berdasarkan"
      value={filterOrderBy}
      onChange={(val) => setFilterOrderBy(val)}
      options={[
        { value: 'name', label: 'Nama / Label' },
        { value: 'id', label: 'ID' },
        { value: 'created_at', label: 'Tanggal Dibuat' }
      ]}
    />
    <Select 
      label="Arah"
      value={filterOrderDir}
      onChange={(val) => setFilterOrderDir(val)}
      options={[
        { value: 'asc', label: 'A - Z (Naik)' },
        { value: 'desc', label: 'Z - A (Turun)' }
      ]}
    />
  </div>
  ```

---

## 7. Aturan Tombol Filter Outline Biru & Drawer Slide Kanan-ke-Kiri
Semua halaman admin yang membutuhkan filter **WAJIB**:
- Menyediakan tombol **Filter** di header halaman (pada prop `action` komponen `<PageHeader />`).
- Style tombol filter wajib menggunakan **Outline Biru** (`variant="outline"` / `btn-outline-blue`) dengan ikon `<Filter size={16} />`.
- Ketika tombol diklik, panel filter **WAJIB** memunculkan komponen **`<Drawer />`** yang meluncur dari kanan ke kiri (*right-to-left*), merujuk pada standar modul **SSO / IAM**.
  ```tsx
  <PageHeader
    title="Manajemen Master Data"
    action={
      <div className="flex gap-2">
        <Button icon={<Plus size={16} />} onClick={handleOpenCreate}>
          Tambah Data
        </Button>
        <Button 
          variant="outline" 
          icon={<Filter size={16} />} 
          onClick={() => setShowFilter(true)}
        >
          Filter
        </Button>
      </div>
    }
  />

  <Drawer
    open={showFilter}
    onClose={() => setShowFilter(false)}
    title="Filter Data"
  >
    {/* Filter Inputs & Sort Grid */}
  </Drawer>
  ```

---

## 8. Aturan Form Create/Update (Modal vs Halaman Terpisah)
- **<= 5 Input (Gunakan Modal)**: Menggunakan `<Modal />` dengan grid maksimal 2 kolom (`grid grid-cols-1 md:grid-cols-2 gap-4`).
- **> 5 Input (Gunakan Halaman Terpisah)**: Membuat halaman terpisah (`/create`, `/[id]/edit`) dengan **Tombol Kembali Berwarna Oranye** (`bg-orange-500 text-white hover:bg-orange-600`) di header.
