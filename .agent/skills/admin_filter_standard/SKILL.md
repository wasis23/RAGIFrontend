---
name: admin-filter-standard
description: Standar pembuatan Filter Drawer dan Sorting pada tabel admin untuk konsistensi UI.
---

# Standar Filter Drawer Admin

## Pendahuluan
Untuk memastikan konsistensi desain (UI/UX) di seluruh panel Admin, semua implementasi **Filter Drawer** harus mengikuti format dan struktur komponen yang sama dengan halaman `/admin/users`. 

## Aturan Komponen

1. **Gunakan Prop `label` pada Komponen Input/Select**
   - **JANGAN** membuat elemen `<label>` secara manual.
   - **GUNAKAN** prop `label="Nama Label"` langsung di dalam komponen `<Input>` atau `<Select>`.
   - Komponen `<Select>` dari UI Kit sudah pintar, berikan prop `value` berupa *string/number* saja (bukan object `{ value, label }`), dan `onChange` akan me-return *string/number* secara otomatis.

   ✅ **Benar:**
   ```tsx
   <Select 
     label="Status Akun"
     value={filterIsActive}
     onChange={(val) => setFilterIsActive(val)}
     options={[
       { value: '', label: 'Semua Status' },
       { value: 'true', label: 'Aktif' }
     ]}
   />
   ```

   ❌ **Salah (Jangan Lakukan Ini):**
   ```tsx
   <div>
     <label>Status Akun</label>
     <Select 
       value={{ value: filterIsActive, label: 'Aktif' }}
       onChange={(v: any) => setFilterIsActive(v?.value)}
       options={...}
     />
   </div>
   ```

2. **Pembatas Layout Sorting (Garis Horizontal)**
   - Jika Drawer memiliki fitur **Urut Berdasarkan (Order By)**, selalu pisahkan area filter dengan area *sorting* menggunakan garis pembatas:
   ```tsx
   <hr style={{ borderTop: '1px solid var(--border-light)', margin: '0.5rem 0' }} />
   ```

3. **Layout Sorting (Grid 2 Kolom)**
   - Bagian *sorting* wajib diletakkan di bawah garis pembatas.
   - Wajib menggunakan layout *grid 2 kolom* (Kolom 1: Urut Berdasarkan, Kolom 2: Arah/Order Dir).
   
   ✅ **Benar:**
   ```tsx
   <div className="grid grid-cols-2 gap-4">
     <Select 
       label="Urut Berdasarkan"
       value={filterOrderBy}
       onChange={(val) => setFilterOrderBy(val)}
       options={[
         { value: 'id', label: 'ID' },
         { value: 'name', label: 'Nama' }
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

4. **Posisi Tombol Filter Selalu di Sebelah Kiri Tombol Tambah Data**
   - Pada header halaman (`PageHeader` prop `action`), tombol **Filter** WAJIB diletakkan di sebelah kiri tombol **Tambah Data** (`[Filter] [Tambah Data]`).
   - Dilarang menempatkan tombol Tambah sebelum tombol Filter.
   
   ✅ **Benar:**
   ```tsx
   <PageHeader
     title="Kelola Data"
     action={
       <div className="flex gap-2">
         <Button variant="outline" icon={<Filter size={16} />} onClick={() => setShowFilter(true)}>
           Filter
         </Button>
         <Button icon={<Plus size={16} />} onClick={handleCreate}>
           Tambah Data
         </Button>
       </div>
     }
   />
   ```

   ❌ **Salah:**
   ```tsx
   <PageHeader
     title="Kelola Data"
     action={
       <div className="flex gap-2">
         <Button icon={<Plus size={16} />} onClick={handleCreate}>
           Tambah Data
         </Button>
         <Button variant="outline" icon={<Filter size={16} />} onClick={() => setShowFilter(true)}>
           Filter
         </Button>
       </div>
     }
   />
   ```

5. **Paritas 100% Field Filter terhadap Kolom Informasi Tabel (1:1 Column-to-Filter Parity)**
   - Setiap kolom informasi data yang ditampilkan pada tabel (di luar kolom non-informasi teknis seperti nomor urut `No`, checkbox seleksi baris, dan dropdown aksi 3-titik) **WAJIB** memiliki inputan filter yang bersesuaian di dalam Filter Drawer.
   - Jika tabel menampilkan 5 kolom data (misal: *Kode*, *Nama*, *Jalur Masuk*, *Gelombang*, *Status*), maka di dalam Filter Drawer **WAJIB ada 5 kontrol filter** untuk ke-5 kolom tersebut.
   - Jenis kontrol disesuaikan: `<Input>` untuk teks/angka/pencarian spesifik, `<Select>` / `<AsyncSelect>` untuk referensi/status, dan input date untuk tanggal.

6. **Sorting Komprehensif Seluruh Kolom Informasi Tabel**
   - Dropdown **"Urut Berdasarkan" (Order By)** di bawah garis pembatas `<hr />` **WAJIB** menyediakan opsi pengurutan untuk **SELURUH kolom informasi** yang tampil pada tabel tersebut, bukan hanya 1 atau 2 kolom saja.
   - Tetap dipadukan dengan kontrol **Arah (Direction: Asc / Desc)** dalam layout grid 2 kolom.

## Workflow Implementasi
1. Siapkan *state* filter individual (contoh: `filterName`, `filterRole`).
2. Siapkan *state* terapan (`appliedFilters` / `appliedFilterName`) yang di-trigger via tombol "Terapkan".
3. Terapkan logika penyaringan (*filtering* & *sorting*) dengan meneruskan *query params* ke API (`apiClient`). Server-side pagination dan filtering wajib digunakan.
