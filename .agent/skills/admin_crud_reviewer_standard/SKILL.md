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
- Halaman Detail Terpisah wajib dilengkapi **Tombol Kembali** yang warnanya secara dinamis mengikuti warna primary modul (bukan hardcode warna) di prop `action` komponen `<PageHeader />`.

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
- **WAJIB WARNA LATAR BELAKANG PUTIH SOLID:** Background tabel, container tabel, dan baris tabel WAJIB berwarna putih bersih (`bg-white` / `#ffffff`). DILARANG membuat tabel atau baris tabel berwarna abu-abu (seperti `bg-slate-50`, `bg-gray-100`, dsb.) atau membiarkan tabel transparan.
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

## 7. Aturan Tombol Filter Outline Dynamic & Drawer Slide Kanan-ke-Kiri
Semua halaman admin yang membutuhkan filter **WAJIB**:
- Menyediakan tombol **Filter** di header halaman (pada prop `action` komponen `<PageHeader />`).
- Style tombol filter wajib menggunakan **Outline Dynamic** (warna outline menyesuaikan primary_color modul, bukan hardcode warna biru) dengan ikon `<Filter size={16} />`.
- **Posisi tombol Filter WAJIB selalu di sebelah KIRI tombol Tambah Data (`[Filter] [Tambah Data]`). DILARANG menaruh tombol Tambah Data sebelum tombol Filter.**
- Ketika tombol diklik, panel filter **WAJIB** memunculkan komponen **`<Drawer />`** yang meluncur dari kanan ke kiri (*right-to-left*), merujuk pada standar modul **SSO / IAM**.
  ```tsx
  <PageHeader
    title="Manajemen Master Data"
    action={
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          icon={<Filter size={16} />} 
          onClick={() => setShowFilter(true)}
        >
          Filter
        </Button>
        <Button icon={<Plus size={16} />} onClick={handleOpenCreate}>
          Tambah Data
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
- **> 5 Input (Gunakan Halaman Terpisah)**: Membuat halaman terpisah (`/create`, `/[id]/edit`) dengan **Tombol Kembali** yang warnanya secara dinamis mengikuti primary modul di header.

---

## 9. Aturan Aksi Tabel Wajib 3-Dots Action Dropdown Menu (`<DropdownMenu />`)
- **Space-Efficient Action Menu**: Seluruh kolom Aksi pada tabel data (`DataTable`) **WAJIB** menggunakan menu titik 3 (`<DropdownMenu />` dari `@/components/ui/DropdownMenu`).
- **DILARANG HARDBOUND INLINE ACTION BUTTONS**: Dilarang keras menyejajarkan tombol-tombol aksi (Edit, Hapus, Detail, Status, Reset) secara horizontal di dalam sel tabel, karena sangat membuang ruang layar (*inefficient space*) dan tidak estetis.
- **Penggunaan Dropdown Menu yang Benar**:
  ```tsx
  import { DropdownMenu } from '@/components/ui/DropdownMenu';
  import { Edit2, Trash2, Eye } from 'lucide-react';

  { key: 'aksi', label: 'Aksi', align: 'right', render: (row) => (
    <div className="flex justify-end">
      <DropdownMenu
        items={[
          {
            label: 'Detail',
            icon: <Eye size={14} />,
            onClick: () => router.push(`/admin/module/${row.id}`)
          },
          {
            label: 'Edit',
            icon: <Edit2 size={14} />,
            onClick: () => openEditModal(row)
          },
          {
            label: 'Hapus',
            icon: <Trash2 size={14} />,
            variant: 'danger',
            onClick: () => handleOpenDelete(row)
          }
        ]}
      />
    </div>
  )}
  ```

---

## 10. Aturan Modal Konfirmasi Aksi Destruktif & Dilarang Dialog Native Browser
- **DILARANG KERAS Dialog Native Browser**: Dilarang keras memanggil `confirm()`, `window.confirm()`, `alert()`, `window.alert()`, `prompt()`, atau `window.prompt()` untuk konfirmasi penghapusan data atau pesan peringatan. Dialog bawaan browser merusak estetika UI, tidak responsif, dan tidak konsisten.
- **Wajib Komponen Modal Konfirmasi UI**: Seluruh aksi penghapusan (Delete) atau aksi destruktif lainnya **WAJIB** menggunakan modal konfirmasi bertema UI aplikasi, yaitu menggunakan `<ConfirmDialog />` dari `@/components/ui/ConfirmDialog` (atau `<Modal />` dengan tombol Batal dan Aksi Destruktif yang memiliki status `isLoading`).
- **Contoh Penggunaan `<ConfirmDialog />`**:
  ```tsx
  import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

  // State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    item: TItem | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    item: null,
    isLoading: false,
  });

  const handleOpenDelete = (item: TItem) => {
    setDeleteModal({ isOpen: true, item, isLoading: false });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.item) return;
    try {
      setDeleteModal(prev => ({ ...prev, isLoading: true }));
      await apiService.delete(deleteModal.item.id);
      toast.success('Data berhasil dihapus');
      setDeleteModal({ isOpen: false, item: null, isLoading: false });
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus data');
      setDeleteModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Di dalam JSX:
  <ConfirmDialog
    isOpen={deleteModal.isOpen}
    onClose={() => setDeleteModal({ isOpen: false, item: null, isLoading: false })}
    onConfirm={handleConfirmDelete}
    isLoading={deleteModal.isLoading}
    title="Hapus Data"
    message={<span>Apakah Anda yakin ingin menghapus <strong>{deleteModal.item?.nama}</strong>? Tindakan ini tidak dapat dibatalkan.</span>}
    confirmText="Hapus"
    cancelText="Batal"
    variant="danger"
  />
  ```

---

## 11. Aturan Standar Navigasi Tab (Divided Bottom Border Navigation)
- Navigasi antar-tab pada halaman multi-tab **WAJIB** menggunakan format bar horizontal dengan garis border bawah kontinu (`border-b border-slate-200`) seperti pada modul SIMPEG Presensi (`/simpeg/presensi`).
- **DILARANG KERAS** menggunakan format tab oval/pills yang dibungkus dalam container abu-abu cembung/terisolasi (`bg-slate-50 border rounded-2xl`).
- Struktur tab item standar:
  ```tsx
  <div className="flex border-b border-slate-200 gap-1 sm:gap-2 overflow-x-auto pb-0.5">
    {tabs.map((tab) => {
      const isTabActive = activeTab === tab.id;
      return (
        <button
          key={tab.id}
          type="button"
          onClick={() => setActiveTab(tab.id)}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            isTabActive
              ? 'border-primary-600 text-primary-700 bg-primary-50/60'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/70'
          }`}
        >
          <tab.icon size={15} className={isTabActive ? 'text-primary-600' : 'text-slate-400'} />
          <span>{tab.label}</span>
          {tab.badge && (
            <span className={`text-2xs px-1.5 py-0.5 rounded font-semibold ${
              isTabActive ? 'bg-primary-100 text-primary-700' : 'bg-slate-200/80 text-slate-600'
            }`}>
              {tab.badge}
            </span>
          )}
        </button>
      );
    })}
  </div>
  ```

---

## 12. Aturan Posisi Tombol Pengaturan Global / Toggle Status (Wajib di Sebelah KIRI Filter)
- Tombol toggle status modul atau konfigurasi global (seperti `Skema UKT: ON/OFF`, switcher mode aplikasi, toggle fitur) **WAJIB** ditempatkan di bagian atas pada prop `action` komponen `<PageHeader />`.
- **DILARANG KERAS** menyisipkan tombol konfigurasi/toggle global ke dalam *Table Action Bar* atau berserakan di bawah tabel.
- **Urutan Standar Elemen di PageHeader Action**:
  `[Tombol Toggle / Pengaturan Global] -> [Tombol Filter] -> [Tombol Tambah Data]`
  ```tsx
  <PageHeader
    title="Pengaturan Tarif Mahasiswa"
    breadcrumbs={[...]}
    action={
      <div className="flex items-center gap-2 flex-wrap">
        {/* 1. Tombol Toggle / Setting Global */}
        <button
          type="button"
          onClick={handleToggleUkt}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-2xs border ${
            isUktEnabled
              ? 'bg-emerald-600 border-emerald-700 text-white hover:bg-emerald-700'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <CheckCircle2 size={14} />
          <span>Skema UKT: {isUktEnabled ? 'ON' : 'OFF'}</span>
        </button>

        {/* 2. Tombol Filter Outline */}
        <Button variant="outline" onClick={() => setShowFilter(true)} icon={<Filter size={16} />}>
          Filter
        </Button>

        {/* 3. Tombol Tambah Data Primary */}
        <Button variant="primary" onClick={handleOpenAdd} icon={<Plus size={16} />}>
          Tambah Data
        </Button>
      </div>
    }
  />
  ```
